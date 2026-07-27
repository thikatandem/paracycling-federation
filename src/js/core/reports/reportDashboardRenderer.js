// =====================================================
// REPORT DASHBOARD RENDERER
// Visualizes schema-derived analytics in report pages.
// =====================================================

const chartInstances = new Map()

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function fmt(value, digits = 1) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(digits) : '-'
}

function destroyChart(id) {
  const chart = chartInstances.get(id)
  if (chart) {
    try { chart.destroy() } catch { /* no-op */ }
    chartInstances.delete(id)
  }
}

function getChartConstructor() {
  const chartGlobal = window.Chart
  if (typeof chartGlobal === 'function') return chartGlobal
  if (typeof chartGlobal?.Chart === 'function') return chartGlobal.Chart
  if (typeof chartGlobal?.default === 'function') return chartGlobal.default
  if (typeof chartGlobal?.default?.Chart === 'function') return chartGlobal.default.Chart
  return null
}

function drawChart(id, config) {
  const canvas = document.getElementById(id)
  const ChartConstructor = getChartConstructor()
  if (!canvas || !ChartConstructor) return
  destroyChart(id)
  const chart = new ChartConstructor(canvas, config)
  chartInstances.set(id, chart)
}

function metricCard(title, value, subtitle = '') {
  return `
    <div class="col-6 col-md-3 col-xl-2">
      <div class="card h-100 shadow-sm">
        <div class="card-body py-3">
          <div class="small text-body-secondary">${escapeHtml(title)}</div>
          <div class="fs-4 fw-semibold">${escapeHtml(value)}</div>
          ${subtitle ? `<div class="small text-body-secondary">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>
    </div>`
}

function tableHtml(columns, rows, maxRows = 12) {
  const body = rows.slice(0, maxRows).map(row => `
    <tr>${columns.map(column => `<td>${escapeHtml(column.format ? column.format(row[column.key], row) : row[column.key] ?? '')}</td>`).join('')}</tr>
  `).join('')

  return `
    <div class="table-responsive">
      <table class="table table-sm table-striped align-middle mb-0">
        <thead><tr>${columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr></thead>
        <tbody>${body || `<tr><td colspan="${columns.length}" class="text-center text-body-secondary py-3">No data available for this section.</td></tr>`}</tbody>
      </table>
    </div>`
}

function chartCard(title, canvasId, subtitle = '', col = 'col-12 col-xl-6') {
  return `
    <div class="${col}">
      <div class="card h-100 shadow-sm">
        <div class="card-header">
          <div class="fw-semibold">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="small text-body-secondary">${escapeHtml(subtitle)}</div>` : ''}
        </div>
        <div class="card-body"><canvas id="${canvasId}" height="110"></canvas></div>
      </div>
    </div>`
}

function topClassificationDatasets(analytics) {
  const months = analytics.monthly || []
  const counts = new Map()
  for (const month of months) {
    for (const [name, value] of Object.entries(month.eventTypes || {})) {
      counts.set(name, (counts.get(name) || 0) + Number(value || 0))
    }
  }
  const names = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name)

  return names.map(name => ({
    label: name,
    data: months.map(month => Number(month.eventTypes?.[name] || 0))
  }))
}

export function renderAdvancedTrainingAnalytics({ host, analytics, title = 'Training Performance Overview' }) {
  if (!host || !analytics) return

  const demographics = analytics.demographics || {}
  const latestMonth = analytics.monthly?.[analytics.monthly.length - 1]
  const summary = analytics.summary || {}

  host.innerHTML = `
    <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
      <div>
        <h3 class="mb-1">${escapeHtml(title)}</h3>
        <div class="text-body-secondary small">Training, attendance, participant, location and performance comparisons.</div>
      </div>
      ${latestMonth ? `<div class="small text-body-secondary">Latest month: <strong>${escapeHtml(latestMonth.monthLabel)}</strong></div>` : ''}
    </div>

    <div class="row g-3 mb-4">
      ${metricCard('Distinct Sessions', summary.sessions || 0, `${summary.records || 0} training records`)}
      ${metricCard('Total Distance', `${fmt(summary.totalDistanceKm, 1)} km`, `${fmt(summary.averageDistanceKm, 1)} km/session`)}
      ${metricCard('Average Speed', `${fmt(summary.averageSpeedKmh, 1)} km/h`)}
      ${metricCard('Attendance', `${fmt(summary.attendanceRate, 1)}%`, `${summary.present || 0} present + ${summary.late || 0} late`)}
      ${metricCard('Registered Individuals', demographics.registeredIndividuals || 0, `${demographics.athletesWithDemographics || 0} with participant details`)}
      ${metricCard('Registered Teams', demographics.registeredTeams || 0)}
      ${metricCard('Mean Age', demographics.athletesWithDemographics ? `${fmt(demographics.meanAge, 1)} yrs` : '-', 'Registered individuals with date of birth')}
      ${metricCard('Youngest', demographics.youngest ? `${demographics.youngest.name} · ${demographics.youngest.age}` : '-')}
      ${metricCard('Oldest', demographics.oldest ? `${demographics.oldest.name} · ${demographics.oldest.age}` : '-')}
      ${metricCard('Active Staff', analytics.staff?.active || 0, `${analytics.staff?.activeAssignments || 0} active assignments`)}
      ${metricCard('Staff Avg Age', analytics.staff?.active ? `${fmt(analytics.staff?.averageAge, 1)} yrs` : '-')}
      ${metricCard('Race Results', analytics.competition?.results || 0, `${analytics.competition?.rankings || 0} ranking records`)}
      ${metricCard('Medals', (analytics.competition?.medals?.Gold || 0) + (analytics.competition?.medals?.Silver || 0) + (analytics.competition?.medals?.Bronze || 0), `G ${analytics.competition?.medals?.Gold || 0} · S ${analytics.competition?.medals?.Silver || 0} · B ${analytics.competition?.medals?.Bronze || 0}`)}
      ${metricCard('Training Stress Score', fmt(summary.totalTss, 0), `${summary.tssRecords || 0} records with training stress score`)}
    </div>

    <div class="row g-3 mb-4">
      ${chartCard('Individual vs Team Distance & Speed', 'reportDistanceSpeedChart', 'Monthly distance and average speed.')}
      ${chartCard('Sessions by Month & Event Type', 'reportMonthlyClassificationChart', 'Monthly sessions grouped by event type.')}
      ${chartCard('Training Load', 'reportTrainingLoadChart', 'Distance, duration and training stress score.')}
      ${chartCard('Event Area Comparison', 'reportEventAreaChart', 'Sessions and distance by event area.')}
      ${chartCard('Cumulative Growth', 'reportGrowthChart', 'Individual, team and overall cumulative distance.')}
      ${chartCard('Month-to-Month Change', 'reportImprovementChart', 'Recorded change in distance, speed and session volume; positive and negative values are shown.')}
      ${chartCard('Weekly Attendance', 'reportAttendanceChart', 'Attendance rate based on explicit present/late/absent records.')}
      ${chartCard('Registered Gender Distribution', 'reportGenderChart', 'Only registered individuals matched to athlete records.')}
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-6">
        <div class="card h-100 shadow-sm">
          <div class="card-header fw-semibold">Individual Performance Comparison</div>
          <div class="card-body p-0">
            ${tableHtml([
              { key: 'label', label: 'Individual' },
              { key: 'sessions', label: 'Sessions' },
              { key: 'totalDistanceKm', label: 'Distance (km)', format: value => fmt(value, 1) },
              { key: 'averageSpeedKmh', label: 'Average Speed', format: value => fmt(value, 1) },
              { key: 'attendanceRate', label: 'Attendance %', format: value => fmt(value, 1) },
              { key: 'totalTss', label: 'Training Stress Score', format: value => fmt(value, 0) }
            ], analytics.individuals || [])}
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card h-100 shadow-sm">
          <div class="card-header fw-semibold">Team Performance Comparison</div>
          <div class="card-body p-0">
            ${tableHtml([
              { key: 'label', label: 'Team' },
              { key: 'sessions', label: 'Sessions' },
              { key: 'totalDistanceKm', label: 'Distance (km)', format: value => fmt(value, 1) },
              { key: 'averageSpeedKmh', label: 'Average Speed', format: value => fmt(value, 1) },
              { key: 'attendanceRate', label: 'Attendance %', format: value => fmt(value, 1) },
              { key: 'totalTss', label: 'Training Stress Score', format: value => fmt(value, 0) }
            ], analytics.teams || [])}
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-6">
        <div class="card h-100 shadow-sm">
          <div class="card-header fw-semibold">Event Type and Area Summary</div>
          <div class="card-body p-0">
            ${tableHtml([
              { key: 'label', label: 'Event Type' },
              { key: 'sessions', label: 'Sessions' },
              { key: 'participants', label: 'Participants' },
              { key: 'totalDistanceKm', label: 'Distance (km)', format: value => fmt(value, 1) },
              { key: 'averageSpeedKmh', label: 'Average Speed', format: value => fmt(value, 1) }
            ], analytics.eventTypes || [], 8)}
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card h-100 shadow-sm">
          <div class="card-header fw-semibold">Attendance Record Coverage</div>
          <div class="card-body p-0">
            ${tableHtml([
              { key: 'date', label: 'Date' },
              { key: 'event', label: 'Event' },
              { key: 'sessionType', label: 'Session' },
              { key: 'registered', label: 'Registered' },
              { key: 'attendanceRecords', label: 'Recorded' },
              { key: 'coveragePct', label: 'Coverage %', format: value => fmt(value, 1) }
            ], [...(analytics.registeredAttendance || [])].reverse(), 10)}
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-7">
        <div class="card h-100 shadow-sm">
          <div class="card-header fw-semibold">Monthly Session Summary</div>
          <div class="card-body p-0">
            ${tableHtml([
              { key: 'monthLabel', label: 'Month' },
              { key: 'sessionType', label: 'Session Type' },
              { key: 'eventType', label: 'Event Type' },
              { key: 'eventCategory', label: 'Event Category' },
              { key: 'sessions', label: 'Sessions' }
            ], analytics.monthlyClassifications || [], 20)}
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-5">
        <div class="card h-100 shadow-sm">
          <div class="card-header fw-semibold">Staff Metrics</div>
          <div class="card-body p-0">
            ${tableHtml([
              { key: 'role', label: 'Role' },
              { key: 'count', label: 'Active Staff' }
            ], analytics.staff?.roles || [], 12)}
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-12 col-xl-6">
        <div class="card h-100 shadow-sm">
          <div class="card-header fw-semibold">Participant Locations</div>
          <div class="card-body p-0">
            ${tableHtml([
              { key: 'country', label: 'Country' },
              { key: 'county', label: 'County' },
              { key: 'subcounty', label: 'Subcounty' },
              { key: 'town', label: 'Town' },
              { key: 'individuals', label: 'Individuals' }
            ], analytics.athleteGeography || [], 12)}
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card h-100 shadow-sm">
          <div class="card-header fw-semibold">Key Findings</div>
          <div class="card-body">
            <ul class="mb-0">${(analytics.insights || []).map(item => `<li class="mb-2">${escapeHtml(item)}</li>`).join('') || '<li>No sufficient data for observations.</li>'}</ul>
          </div>
        </div>
      </div>
    </div>
  `

  const months = analytics.monthly || []
  const monthLabels = months.map(item => item.monthLabel)
  const classificationDatasets = topClassificationDatasets(analytics)

  drawChart('reportDistanceSpeedChart', {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'Individual Distance (km)', data: months.map(item => item.individualDistanceKm), backgroundColor: '#198754', yAxisID: 'distance' },
        { label: 'Team Distance (km)', data: months.map(item => item.teamDistanceKm), backgroundColor: '#ffc107', yAxisID: 'distance' },
        { type: 'line', label: 'Individual Average Speed', data: months.map(item => item.individualAverageSpeedKmh), borderColor: '#0dcaf0', tension: 0.25, yAxisID: 'speed' },
        { type: 'line', label: 'Team Average Speed', data: months.map(item => item.teamAverageSpeedKmh), borderColor: '#212529', tension: 0.25, yAxisID: 'speed' }
      ]
    },
    options: {
      responsive: true,
      scales: {
        distance: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: 'Distance (km)' } },
        speed: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: 'Average Speed (km/h)' } }
      }
    }
  })

  drawChart('reportMonthlyClassificationChart', {
    type: 'bar',
    data: { labels: monthLabels, datasets: classificationDatasets },
    options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
  })

  drawChart('reportTrainingLoadChart', {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'Distance (km)', data: months.map(item => item.totalDistanceKm), borderColor: '#198754', backgroundColor: 'rgba(25,135,84,.12)', fill: true, tension: 0.25, yAxisID: 'volume' },
        { label: 'Duration (minutes)', data: months.map(item => item.totalDurationMinutes), borderColor: '#0dcaf0', tension: 0.25, yAxisID: 'volume' },
        { label: 'Training Stress Score', data: months.map(item => item.totalTss), borderColor: '#dc3545', tension: 0.25, yAxisID: 'tss' }
      ]
    },
    options: {
      responsive: true,
      scales: {
        volume: { type: 'linear', position: 'left', beginAtZero: true },
        tss: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }
      }
    }
  })

  const areas = (analytics.eventAreas || []).slice(0, 10)
  drawChart('reportEventAreaChart', {
    type: 'bar',
    data: {
      labels: areas.map(item => item.label),
      datasets: [
        { label: 'Sessions', data: areas.map(item => item.sessions), backgroundColor: '#0dcaf0', xAxisID: 'sessions' },
        { label: 'Distance (km)', data: areas.map(item => item.totalDistanceKm), backgroundColor: '#198754', xAxisID: 'distance' }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        sessions: { type: 'linear', position: 'bottom', beginAtZero: true },
        distance: { type: 'linear', position: 'top', beginAtZero: true, grid: { drawOnChartArea: false } }
      }
    }
  })

  drawChart('reportGrowthChart', {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'Individual cumulative distance', data: months.map(item => item.cumulativeIndividualDistanceKm), borderColor: '#0dcaf0', tension: 0.25 },
        { label: 'Team cumulative distance', data: months.map(item => item.cumulativeTeamDistanceKm), borderColor: '#ffc107', tension: 0.25 },
        { label: 'Overall cumulative distance', data: months.map(item => item.cumulativeDistanceKm), borderColor: '#198754', tension: 0.25 }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  })

  drawChart('reportImprovementChart', {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [
        { label: 'Distance Month-to-month %', data: months.map(item => item.distanceGrowthPct), tension: 0.25 },
        { label: 'Speed Month-to-month %', data: months.map(item => item.speedGrowthPct), tension: 0.25 },
        { label: 'Sessions Month-to-month %', data: months.map(item => item.sessionsGrowthPct), tension: 0.25 }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { title: { display: true, text: 'Change %' } } }
    }
  })

  drawChart('reportAttendanceChart', {
    type: 'line',
    data: {
      labels: (analytics.weeklyAttendance || []).map(item => item.label),
      datasets: [{
        label: 'Attendance %',
        data: (analytics.weeklyAttendance || []).map(item => item.attendanceRate),
        borderColor: '#198754',
        backgroundColor: 'rgba(25,135,84,.12)',
        fill: true,
        tension: 0.25
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
  })

  const genderEntries = Object.entries(demographics.genderCounts || {})
  drawChart('reportGenderChart', {
    type: 'doughnut',
    data: {
      labels: genderEntries.map(([label]) => label),
      datasets: [{ data: genderEntries.map(([, value]) => value) }]
    },
    options: { responsive: true }
  })
}

export function destroyAdvancedReportCharts() {
  for (const id of [...chartInstances.keys()]) destroyChart(id)
}
