// =====================================================
// FEDERATION ANALYTICS REPORT
// Shared controller for overall, individual, team and event reports.
// =====================================================
import { getDb, hasDb } from '../supabase/getDb.js'
import {
  showInlineError,
  createDualFeedbackController
} from '../services/feedbackService.js'
import {
  on
} from '../services/domService.js'
import {
  loadFederationReportingData
} from '../services/reportDataService.js'
import {
  buildTrainingAnalytics,
  buildOverallExportSheets,
  flattenTrainingRecord,
  getParticipantRegistry,
  getEvent,
  resolveAthleteId,
  resolveTeamId,
  isTeamParticipant,
  isIndividualParticipant
} from '../services/reportAnalyticsService.js'
import {
  ensureReportAnalyticsHost
} from '../services/reportControlsService.js'
import {
  renderAdvancedTrainingAnalytics
} from './reportDashboardRenderer.js'
import {
  downloadCsv,
  downloadExcelWorkbook,
  downloadTrainingReportPdf
} from '../export/exportService.js'

let allTrainingRecords = []
let reportContext = {}
let filteredRecords = []
let currentAnalytics = null
let eventEntities = []

const federationReportFeedback =
  createDualFeedbackController({
    errorContainerId:
      'federationReportError',
    successContainerId:
      'federationReportSuccess',
    errorOptions: {
      sticky: true
    },
    successOptions: {
      sticky: true
    }
  })

const showError =
  federationReportFeedback.error
    .bind(federationReportFeedback)

const showSuccess =
  federationReportFeedback.success
    .bind(federationReportFeedback)

function element(id) {
  return document.getElementById(id)
}

function scope() {
  return element('reportScope')?.value || 'overall'
}

function entityId() {
  return element('filterReportEntity')?.value || ''
}

function reportName() {
  if (scope() === 'individual') {
    return 'Individual Performance Report'
  }

  if (scope() === 'team') {
    return 'Team Performance Report'
  }

  if (scope() === 'event') {
    return 'Event Performance Report'
  }

  return 'Thika Tandem Overall Performance Report'
}

function scopeDisplayName() {
  if (scope() === 'individual') {
    return 'Individual'
  }

  if (scope() === 'team') {
    return 'Team'
  }

  if (scope() === 'event') {
    return 'Event'
  }

  return 'Overall'
}

function scopeEntityPlural() {
  if (scope() === 'team') {
    return 'Teams'
  }

  if (scope() === 'event') {
    return 'Events'
  }

  return 'Individuals'
}

function exportReportTitle() {
  const baseName =
    reportName()

  if (
    scope() === 'overall'
  ) {
    return baseName
  }

  const selected =
    element(
      'filterReportEntity'
    )
      ?.selectedOptions?.[0]
      ?.textContent
      ?.trim() || ''

  if (
    !selected ||
    selected.startsWith(
      'All '
    )
  ) {
    return baseName
  }

  return `${baseName} - ${selected}`
}

function inDateRange(record) {
  const start = element('filterReportStartDate')?.value || ''
  const end = element('filterReportEndDate')?.value || ''
  const date = record.training_date || ''
  if (start && date < start) {
return false
}
  if (end && date > end) {
return false
}
  return true
}

function matchesScope(record) {
  const selected = entityId()
  if (scope() === 'team') {
    if (!isTeamParticipant(record, currentAnalytics?.context || reportContext)) {
return false
}
    return !selected || resolveTeamId(record, currentAnalytics?.context || reportContext) === selected
  }
  if (scope() === 'individual') {
    if (!isIndividualParticipant(record, currentAnalytics?.context || reportContext)) {
return false
}
    if (!selected) {
return true
}
    const registry = getParticipantRegistry(record)
    const athleteId = resolveAthleteId(record, currentAnalytics?.context || reportContext)
    return registry?.participant_ref_id === selected || athleteId === selected || registry?.source_id === selected
  }
  if (scope() === 'event') {
    if (!selected) {
      return true
    }

    const eventId =
      getEvent(record)?.event_id ||
      record.event_id ||
      record.event_instances?.event_id ||
      record.participant_instances
        ?.event_instances
        ?.event_id ||
      ''

    return eventId === selected
  }
  return true
}

async function loadEventEntities() {
  if (scope() !== 'event') {
    eventEntities = []
    return
  }

  const { data, error } =
    await getDb()
      .from('events')
      .select(`
        event_id,
        event_code,
        event_name
      `)
      .order('event_name')

  if (error) {
    throw new Error(
      `Events: ${error.message || 'database query failed'}`
    )
  }

  eventEntities = data || []
}

function populateEntityFilter() {
  const select = element('filterReportEntity')
  if (!select) {
return
}
  const current = select.value
  const options = []

  if (scope() === 'team') {
    for (const team of reportContext.teams || []) {
      options.push({ value: team.team_id, label: team.team_name || 'Unnamed Team' })
    }
  } else if (scope() === 'individual') {
    const registryBySource = new Map(
      (reportContext.participantRegistry || [])
        .filter(item => !String(item.participant_type_master?.participant_type_code || '').toUpperCase().includes('TEAM'))
        .map(item => [item.source_id, item])
    )
    for (const athlete of reportContext.athletes || []) {
      const registry = registryBySource.get(athlete.athlete_id)
      options.push({
        value: registry?.participant_ref_id || athlete.athlete_id,
        label: registry?.display_name || `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unnamed Individual'
      })
    }
  } else if (scope() === 'event') {
    for (const event of eventEntities) {
      const code = event.event_code ? `${event.event_code} · ` : ''
      options.push({
        value: event.event_id,
        label: `${code}${event.event_name || 'Unnamed Event'}`
      })
    }
  }

  options.sort((a, b) => a.label.localeCompare(b.label))
  const allLabel =
    scopeEntityPlural()

  select.innerHTML = `<option value="">All ${allLabel}</option>` +
    options.map(option => `<option value="${option.value}">${option.label}</option>`).join('')
  if (options.some(option => option.value === current)) {
select.value = current
}
}

function applyFilters() {
  filteredRecords = allTrainingRecords.filter(record => inDateRange(record) && matchesScope(record))
  currentAnalytics = buildTrainingAnalytics(filteredRecords, reportContext)
  const host = ensureReportAnalyticsHost({ id: 'federationReportDashboard' }) || element('federationReportDashboard')
  renderAdvancedTrainingAnalytics({ host, analytics: currentAnalytics, title: reportName() })
  const count = element('reportRecordCount')
  if (count) {
count.textContent = `${currentAnalytics.summary.sessions || 0} distinct sessions · ${filteredRecords.length} records`
}
}

function exportRows() {
  return filteredRecords.map(
    record => {
      const row =
        flattenTrainingRecord(
          record,
          currentAnalytics.context
        )

      return {
        ...row,
        report_subject:
          row.team ||
          row.participant ||
          '',
        report_subject_type:
          row.team ?
            'Team' :
            'Individual'
      }
    }
  )
}

function csvColumns() {
  return [
    { key: 'training_date', label: 'Training Date' },
    { key: 'training_week', label: 'Week' },
    { key: 'session_type', label: 'Session' },
    { key: 'report_subject', label: 'Participant / Team' },
    { key: 'report_subject_type', label: 'Type' },
    { key: 'event', label: 'Event' },
    { key: 'event_type', label: 'Event Type' },
    { key: 'event_area', label: 'Event Area' },
    { key: 'program', label: 'Program' },
    { key: 'county', label: 'County' },
    { key: 'town', label: 'Town' },
    { key: 'distance_km', label: 'Distance (km)' },
    { key: 'duration_minutes', label: 'Duration (minutes)' },
    { key: 'avg_speed_kmh', label: 'Average Speed (km/h)' },
    { key: 'attendance_status', label: 'Attendance' }
  ]
}

function pdfColumns() {
  return [
    { key: 'training_date', label: 'Date' },
    { key: 'session_type', label: 'Session' },
    { key: 'report_subject', label: 'Participant / Team' },
    { key: 'event', label: 'Event' },
    { key: 'event_area', label: 'Event Area' },
    { key: 'program', label: 'Program' },
    { key: 'county', label: 'County' },
    { key: 'distance_km', label: 'Distance (km)' },
    { key: 'duration_minutes', label: 'Duration (min)' },
    { key: 'avg_speed_kmh', label: 'Average Speed (km/h)' },
    { key: 'attendance_status', label: 'Attendance' }
  ]
}

function buildPageExportSheets() {
  const summary =
    currentAnalytics.summary || {}

  const demographics =
    currentAnalytics.demographics || {}

  const rows =
    exportRows()

  return [
    {
      sheetName: 'Summary',
      columns: [
        { key: 'metric', label: 'Measure' },
        { key: 'value', label: 'Value' }
      ],
      data: [
        { metric: 'Report', value: exportReportTitle() },
        { metric: 'Sessions', value: summary.sessions || 0 },
        { metric: 'Records', value: filteredRecords.length },
        { metric: 'Total Distance (km)', value: Number(summary.totalDistanceKm || 0).toFixed(1) },
        { metric: 'Average Speed (km/h)', value: Number(summary.averageSpeedKmh || 0).toFixed(1) },
        { metric: 'Attendance (%)', value: Number(summary.attendanceRate || 0).toFixed(1) },
        { metric: 'Registered Individuals', value: demographics.registeredIndividuals || 0 },
        { metric: 'Registered Teams', value: demographics.registeredTeams || 0 }
      ]
    },
    {
      sheetName: 'Records',
      columns: csvColumns(),
      data: rows
    },
    {
      sheetName: 'Monthly Performance',
      columns: [
        { key: 'month', label: 'Month' },
        { key: 'sessions', label: 'Sessions' },
        { key: 'distance', label: 'Distance (km)' },
        { key: 'duration', label: 'Duration (minutes)' },
        { key: 'speed', label: 'Average Speed (km/h)' }
      ],
      data: (currentAnalytics.monthly || []).map(
        row => ({
          month: row.monthLabel || '',
          sessions: row.sessions || 0,
          distance: Number(row.totalDistanceKm || 0).toFixed(1),
          duration: Number(row.totalDurationMinutes || 0).toFixed(1),
          speed: Number(row.averageSpeedKmh || 0).toFixed(1)
        })
      )
    }
  ]
}

function exportCsv() {
  try {
    if (!filteredRecords.length) {
      showError('No report records available for export')
      return
    }

    downloadCsv({
      reportName: exportReportTitle(),
      columns: csvColumns(),
      data: exportRows()
    })

    showSuccess('CSV report exported successfully')
  } catch (error) {
    showError(
      error?.message ||
      'Failed to export CSV report'
    )
  }
}

async function exportExcel() {
  try {
    if (!filteredRecords.length) {
      showError('No report records available for export')
      return
    }

    await downloadExcelWorkbook({
      reportName: exportReportTitle(),
      sheets: buildPageExportSheets()
    })

    showSuccess('Excel report exported successfully')
  } catch (error) {
    showError(
      error?.message ||
      'Failed to export Excel report'
    )
  }
}

function classificationDatasets() {
  const months = currentAnalytics.monthly || []
  const totals = new Map()
  for (const month of months) {
    for (const [name, value] of Object.entries(month.eventTypes || {})) {
      totals.set(name, (totals.get(name) || 0) + Number(value || 0))
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => ({
      label: name,
      data: months.map(month => Number(month.eventTypes?.[name] || 0))
    }))
}

function statusCounts() {
  let participated = 0
  let absent = 0
  let late = 0
  let excused = 0
  for (const row of currentAnalytics.registeredAttendance || []) {
    participated += Number(row.present || 0)
    absent += Number(row.absent || 0)
    late += Number(row.late || 0)
    excused += Number(row.excused || 0)
  }
  return {
 participated, absent, late, excused 
}
}

async function exportPdf() {
  try {
    if (!filteredRecords.length) {
      showError('No report records available for export')
      return
    }

      const monthly = currentAnalytics.monthly || []
      const status = statusCounts()
      const individualRows = currentAnalytics.individuals || []
      const teamRows = currentAnalytics.teams || []
      const areas = currentAnalytics.eventAreas || []
      const weeks = currentAnalytics.weeklyAttendance || []
      const rawRows =
        exportRows()

      const activeReportTitle =
        exportReportTitle()

      const summary =
        currentAnalytics.summary || {}

      const demographics =
        currentAnalytics.demographics || {}

      await downloadTrainingReportPdf({
        reportPeriod:
          activeReportTitle,

        reportTitle:
          activeReportTitle,

        reportFileName:
          activeReportTitle,

        dashboardTitle:
          `${activeReportTitle} Dashboard`,

        intelligenceTitle:
          `${activeReportTitle} Summary`,

        intelligenceLines: [
          `Distinct sessions: ${summary.sessions || 0}`,
          `Filtered records: ${filteredRecords.length}`,
          `Attendance rate: ${Number(summary.attendanceRate || 0).toFixed(1)}%`,
          `Total distance: ${Number(summary.totalDistanceKm || 0).toFixed(1)} km`,
          `Average speed: ${Number(summary.averageSpeedKmh || 0).toFixed(1)} km/h`
        ],

        detailTitle:
          `${activeReportTitle} Detailed Data`,

        comparisonPageTitle:
          `${activeReportTitle} Monthly Performance Comparisons`,

        loadPageTitle:
          `${activeReportTitle} Load, Area and Growth Analysis`,

        filters: {
          Scope:
            scopeDisplayName(),
          Entity: element('filterReportEntity')?.selectedOptions?.[0]?.textContent || 'All',
          'Start Date': element('filterReportStartDate')?.value || 'All',
          'End Date': element('filterReportEndDate')?.value || 'All'
        },
        columns: pdfColumns(),
        data: rawRows,
        insights: currentAnalytics.insights || [],
        attendanceLabels: weeks.map(row => row.period),
        attendanceValues: weeks.map(row => row.attendanceRate),
        countyLabels: (currentAnalytics.counties || []).slice(0, 10).map(row => row.label),
        countyTotals: (currentAnalytics.counties || []).slice(0, 10).map(row => row.sessions),
        participated: status.participated,
        absent: status.absent,
        late: status.late,
        excused: status.excused,
        distanceLabels: monthly.map(row => row.monthLabel),
        distanceValues: monthly.map(row => row.totalDistanceKm),
        teamCount: currentAnalytics.demographics.registeredTeams || 0,
        individualCount: currentAnalytics.demographics.registeredIndividuals || 0,
        totalAthletes: currentAnalytics.demographics.athletesWithDemographics || 0,
        totalSessions: currentAnalytics.summary.sessions || 0,
        attendancePercentage: currentAnalytics.summary.attendanceRate || 0,
        totalDistance: currentAnalytics.summary.totalDistanceKm || 0,
        comparisonLabels: monthly.map(row => row.monthLabel),
        individualDistanceValues: monthly.map(row => row.individualDistanceKm),
        teamDistanceValues: monthly.map(row => row.teamDistanceKm),
        individualSpeedValues: monthly.map(row => row.individualAverageSpeedKmh),
        teamSpeedValues: monthly.map(row => row.teamAverageSpeedKmh),
        classificationLabels: monthly.map(row => row.monthLabel),
        classificationDatasets: classificationDatasets(),
        loadLabels: monthly.map(row => row.monthLabel),
        loadDistanceValues: monthly.map(row => row.totalDistanceKm),
        loadDurationValues: monthly.map(row => row.totalDurationMinutes),
        loadTssValues: monthly.map(row => row.totalTss),
        areaLabels: areas.slice(0, 10).map(row => row.label),
        areaSessionValues: areas.slice(0, 10).map(row => row.sessions),
        areaDistanceValues: areas.slice(0, 10).map(row => row.totalDistanceKm),
        growthLabels: monthly.map(row => row.monthLabel),
        individualGrowthValues: monthly.map(row => row.cumulativeIndividualDistanceKm),
        teamGrowthValues: monthly.map(row => row.cumulativeTeamDistanceKm),
        overallGrowthValues: monthly.map(row => row.cumulativeDistanceKm)
      })

    showSuccess('PDF report exported successfully')
  } catch (error) {
    showInlineError(
      `PDF Export Failed:\n\n${
        error?.message ||
        JSON.stringify(error, null, 2)
      }`
    )

    showError(
      error?.message ||
      'Failed to export PDF report'
    )
  }
}

function clearFilters() {
  if (element('filterReportEntity')) {
element('filterReportEntity').value = ''
}
  if (element('filterReportStartDate')) {
element('filterReportStartDate').value = ''
}
  if (element('filterReportEndDate')) {
element('filterReportEndDate').value = ''
}
  applyFilters()
}

function bindEvents() {
  on(
    'filterReportEntity',
    'change',
    applyFilters
  )

  on(
    'filterReportStartDate',
    'change',
    applyFilters
  )

  on(
    'filterReportEndDate',
    'change',
    applyFilters
  )

  on(
    'btnApplyReportFilters',
    'click',
    applyFilters
  )

  on(
    'btnClearReportFilters',
    'click',
    clearFilters
  )

  on(
    'btnRefreshReport',
    'click',
    async () => {
      const [refreshed] =
        await Promise.all([
          loadFederationReportingData(
            getDb()
          ),
          loadEventEntities()
        ])

      allTrainingRecords =
        refreshed.trainingRecords
      reportContext =
        refreshed.context
      currentAnalytics =
        buildTrainingAnalytics(
          allTrainingRecords,
          reportContext
        )

      populateEntityFilter()
      applyFilters()
    }
  )

  on(
    'btnExportTrainingCsv',
    'click',
    exportCsv
  )

  on(
    'btnExportTrainingExcel',
    'click',
    exportExcel
  )

  on(
    'btnExportTrainingPdf',
    'click',
    exportPdf
  )
}

async function initialize() {
  if (!hasDb()) {
return
}

  try {
    bindEvents()

    const [result] =
      await Promise.all([
        loadFederationReportingData(
          getDb()
        ),
        loadEventEntities()
      ])

    allTrainingRecords =
      result.trainingRecords
    reportContext =
      result.context
    currentAnalytics =
      buildTrainingAnalytics(
        allTrainingRecords,
        reportContext
      )

    populateEntityFilter()
    applyFilters()
  } catch (error) {
    showInlineError(
      error.message ||
      'Failed to load report'
    )

    showError(
      error.message ||
      'Failed to initialize report'
    )
  }
}

document.addEventListener('DOMContentLoaded', initialize)
