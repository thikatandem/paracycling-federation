import {
  printCurrentView as printReport,
  createLoadingStateSetter
} from '../services/uiService.js'

import {
  createPaginationInfoUpdater
} from '../services/paginationService.js'

import {
  safeNumber,
  calculatePercentage,
  calculateDateDuration as calculateDuration
} from '../services/calculationService.js'

/* ==========================================
   CONSTANTS
========================================== */

import {
  createSortToggle,
  createPageNavigator
} from '../services/pageStateService.js'
import {
  getStatusBadge
} from '../services/statusService.js'
import {
  get as $,
  setText
} from '../services/domService.js'


import {
  showInlineError
} from '../services/feedbackService.js'

import {
  PAGE_SIZE
} from '../services/constants.js'

import {
  getDb
} from '../supabase/getDb.js'



import {
  createModalByElement
} from '../services/modalService.js'

import {
  downloadCsv,
  downloadExcelWorkbook
} from '../export/exportService.js'

import {
  ensureReportAnalyticsHost
} from '../services/reportControlsService.js'
const sortBy =
  createSortToggle({
    getField: () =>
      currentSortField,
    setField: value => {
      currentSortField = value
    },
    getDirection: () =>
      currentSortDirection,
    setDirection: value => {
      currentSortDirection = value
    },
    apply: applySorting
  })

const pageNavigator =
  createPageNavigator({
    getPage: () =>
      currentPage,
    setPage: value => {
      currentPage = value
    },
    getTotalPages: () =>
      Math.max(
        1,
        Math.ceil(
          filteredEventReportData.length /
          PAGE_SIZE
        )
      ),
    render: renderTable
  })

const previousPage =
  pageNavigator.previous
    .bind(pageNavigator)

const nextPage =
  pageNavigator.next
    .bind(pageNavigator)

const renderPagination =
  createPaginationInfoUpdater({
    getItemCount: () =>
      filteredEventReportData.length,
    getCurrentPage: () =>
      currentPage,
    pageSize:
      PAGE_SIZE,
    infoElementId:
      'eventReportPaginationInfo',
    includeRecordCount:
      true
  })

const showLoading =
  createLoadingStateSetter(
    'eventReportLoading'
  )

/* ==========================================
   GLOBALS
========================================== */

let currentPage = 1

let eventReportData = []

let filteredEventReportData = []

let statusLookup = []

let categoryLookup = []

let countyLookup = []

const sponsorLookup = []

let eventDetailsModal = null

let eventAreaChart = null

let currentSortField =
  'start_date'

let currentSortDirection =
  'desc'

/* ==========================================
   DOM HELPERS
========================================== */

/* ==========================================
   LOOKUPS
========================================== */

async function loadStatuses() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'event_status_master'
      )
.select(`
  event_status_id,
  status_name,
  status_code
`)
      .order(
        'status_name'
      )

  if (error) {
    throw error
  }

  statusLookup =
    data || []

  const select =
    $('filterEventStatus')

  if (!select) {
    return
  }

  for (const status of statusLookup) {
    const option =
        document.createElement(
          'option'
        )

    option.value =
        status.event_status_id

    option.textContent =
        status.status_name

    select.append(
      option
    )
  }
}

async function loadCategories() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'event_category_master'
      )
      .select(`
        event_category_id,
        category_name
      `)
      .order(
        'category_name'
      )

  if (error) {

    return
  }

  categoryLookup =
    data || []

  const select =
    $('filterEventCategory')

  if (!select) {
    return
  }

  for (const category of categoryLookup) {
    const option =
        document.createElement(
          'option'
        )

    option.value =
        category.event_category_id

    option.textContent =
        category.category_name

    select.append(
      option
    )
  }
}

async function loadCounties() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'county_master'
      )
      .select(`
        county_id,
        county_name
      `)
      .order(
        'county_name'
      )

  if (error) {

    return
  }

  countyLookup =
    data || []

  const select =
    $('filterEventCounty')

  if (!select) {
    return
  }

  for (const county of countyLookup) {
    const option =
        document.createElement(
          'option'
        )

    option.value =
        county.county_id

    option.textContent =
        county.county_name

    select.append(
      option
    )
  }
}

function buildYearFilter() {
  const select =
    $('filterEventYear')

  if (!select) {
    return
  }

  const currentYear =
    new Date()
      .getFullYear()

  for (
    let year =
      currentYear + 1;
    year >=
      currentYear - 10;
    year--
  ) {
    const option =
      document.createElement(
        'option'
      )

    option.value =
      year

    option.textContent =
      year

    select.append(
      option
    )
  }
}

/* ==========================================
   LOAD EVENT REPORT DATA
========================================== */

async function loadEventReportData() {
  try {
    showLoading(true)
    const { data, error } = await getDb()
      .from('event_instances')
      .select(`
        *,
        events(
          event_id,
          event_code,
          event_name,
          event_type_id,
          event_category_id,
          event_type_master(
            event_type_id,
            event_type_code,
            event_type_name
          ),
          event_category_master(
            event_category_id,
            category_code,
            category_name
          )
        ),
        country_master(
          country_id,
          country_code,
          country_name
        ),
        county_master(
          county_id,
          county_code,
          county_name
        ),
        subcounty_master(
          subcounty_id,
          subcounty_code,
          subcounty_name
        ),
        town_master(
          town_id,
          town_name
        ),
        event_status_master(
          event_status_id,
          status_name,
          status_code
        ),
        event_sponsors(
          event_sponsor_id,
          sponsor_id,
          sponsorship_notes,
          sponsor_master(
            sponsor_id,
            sponsor_name
          )
        ),
        participant_instances(
          participant_instance_id,
          participant_ref_id,
          participant_registry(
            participant_ref_id,
            source_id,
            display_name,
            participant_type_master(
              participant_type_id,
              participant_type_code,
              participant_type_name
            )
          )
        )
      `)
      .order('start_date', { ascending: false })

    if (error) throw error
    eventReportData = data || []
    filteredEventReportData = [...eventReportData]
  } catch (error) {
    showInlineError(error.message)
  } finally {
    showLoading(false)
  }
}

/* ==========================================
   BUILD EVENT STATISTICS
========================================== */

function buildEventStatistics() {
  updateSummaryCards()
  buildStatusAnalysis()
  buildCategoryAnalysis()
  buildCountyAnalysis()
  buildSponsorAnalysis()
}

/* ==========================================
   SUMMARY CARDS
========================================== */

function updateSummaryCards() {
  const totalEvents =
    filteredEventReportData.length

  const upcoming =
    filteredEventReportData.filter(
      event =>
        event.event_status_master
          ?.status_name
          ?.toLowerCase()
          .includes(
            'upcoming'
          )
    ).length

  const ongoing =
    filteredEventReportData.filter(
      event =>
        event.event_status_master
          ?.status_name
          ?.toLowerCase()
          .includes(
            'ongoing'
          )
    ).length

  const completed =
    filteredEventReportData.filter(
      event =>
        event.event_status_master
          ?.status_name
          ?.toLowerCase()
          .includes(
            'completed'
          )
    ).length

  const cancelled =
    filteredEventReportData.filter(
      event =>
        event.event_status_master
          ?.status_name
          ?.toLowerCase()
          .includes(
            'cancel'
          )
    ).length

  const competition =
    filteredEventReportData.filter(
      event =>
        event.events?.event_category_master
          ?.category_name
          ?.toLowerCase()
          .includes(
            'competition'
          )
    ).length

  const training =
    filteredEventReportData.filter(
      event =>
        event.events?.event_category_master
          ?.category_name
          ?.toLowerCase()
          .includes(
            'training'
          )
    ).length

  setText(
    'totalEventsCard',
    totalEvents
  )

  setText(
    'upcomingEventsCard',
    upcoming
  )

  setText(
    'ongoingEventsCard',
    ongoing
  )

  setText(
    'completedEventsCard',
    completed
  )

  setText(
    'cancelledEventsCard',
    cancelled
  )

  setText(
    'competitionEventsCard',
    competition
  )

  setText(
    'trainingEventsCard',
    training
  )
}

/* ==========================================
   STATUS ANALYSIS
========================================== */

function buildStatusAnalysis() {
  const tbody =
    $('eventStatusAnalysisBody')

  if (!tbody) {
    return
  }

  const stats = {}

  for (const event of filteredEventReportData) {
    const status =
        event.event_status_master
          ?.status_name ||
        'Unknown'

    stats[status] =
        (
          stats[status] || 0
        ) + 1
  }

  tbody.innerHTML =
    Object.entries(
      stats
    )
      .map(
        (
          [
            status,
            count
          ]
        ) => `
          <tr>

            <td>
              ${status}
            </td>

            <td>
              ${count}
            </td>

            <td>
              ${calculatePercentage(
    count,
    filteredEventReportData.length
  )}
            </td>

          </tr>
        `
      )
      .join('')
}

/* ==========================================
   CATEGORY ANALYSIS
========================================== */

function buildCategoryAnalysis() {
  const tbody =
    $('eventCategoryAnalysisBody')

  if (!tbody) {
    return
  }

  const stats = {}

  for (const event of filteredEventReportData) {
    const category =
        event.events?.event_category_master
          ?.category_name ||
        event.event_category ||
        'Unknown'

    stats[category] =
        (stats[category] || 0) + 1
  }

  tbody.innerHTML =
    Object.entries(stats)
      .sort(
        (a, b) => b[1] - a[1]
      )
      .map(
        ([category, count]) => `
          <tr>
            <td>${category}</td>
            <td>${count}</td>
            <td>
              ${calculatePercentage(
    count,
    filteredEventReportData.length
  )}
            </td>
          </tr>
        `
      )
      .join('')
}

/* ==========================================
   COUNTY ANALYSIS
========================================== */

function buildCountyAnalysis() {
  const tbody =
    $('eventCountyAnalysisBody')

  if (!tbody) {
    return
  }

  const stats = {}

  for (const event of filteredEventReportData) {
    const county =
        event.county_master
          ?.county_name ||
        'Unknown'

    stats[county] =
        (stats[county] || 0) + 1
  }

  tbody.innerHTML =
    Object.entries(stats)
      .sort(
        (a, b) => b[1] - a[1]
      )
      .map(
        ([county, count]) => `
          <tr>
            <td>${county}</td>
            <td>${count}</td>
            <td>
              ${calculatePercentage(
    count,
    filteredEventReportData.length
  )}
            </td>
          </tr>
        `
      )
      .join('')
}

/* ==========================================
   SPONSOR ANALYSIS
========================================== */

function buildSponsorAnalysis() {
  const tbody =
    $('eventSponsorAnalysisBody')

  if (!tbody) {
    return
  }

  const stats = {}

  for (const event of filteredEventReportData) {
    const sponsors =
        event.event_sponsors || []

    for (const sponsor of sponsors) {
      const sponsorName =
            sponsor
              .sponsor_master
              ?.sponsor_name ||
            'Unknown'

      stats[sponsorName] =
            (stats[sponsorName] || 0) + 1
    }
  }

  tbody.innerHTML =
    Object.entries(stats)
      .sort(
        (a, b) => b[1] - a[1]
      )
      .map(
        ([sponsor, count]) => `
          <tr>
            <td>${sponsor}</td>
            <td>${count}</td>
            <td>
              ${calculatePercentage(
    count,
    filteredEventReportData.length
  )}
            </td>
          </tr>
        `
      )
      .join('')
}

function eventParticipantCounts(event) {
  const teams = new Set()
  const individuals = new Set()
  for (const registration of event.participant_instances || []) {
    const registry = registration.participant_registry
    const code = String(registry?.participant_type_master?.participant_type_code || '').toUpperCase()
    if (!registry?.participant_ref_id) continue
    if (code.includes('TEAM')) teams.add(registry.participant_ref_id)
    else individuals.add(registry.participant_ref_id)
  }
  return { teams: teams.size, individuals: individuals.size, total: teams.size + individuals.size }
}

function eventDurationDays(event) {
  if (!event.start_date || !event.end_date) return 0
  const start = new Date(`${event.start_date}T00:00:00Z`)
  const end = new Date(`${event.end_date}T00:00:00Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(1, Math.floor((end - start) / 86400000) + 1)
}

function flattenEventRecord(event) {
  const counts = eventParticipantCounts(event)
  return {
    event_name: event.events?.event_name || '',
    event_type: event.events?.event_type_master?.event_type_name || '',
    event_category: event.events?.event_category_master?.category_name || '',
    event_area: event.event_area || '',
    organizer: event.organizer || '',
    country: event.country_master?.country_name || '',
    county: event.county_master?.county_name || '',
    subcounty: event.subcounty_master?.subcounty_name || '',
    town: event.town_master?.town_name || '',
    start_date: event.start_date || '',
    end_date: event.end_date || '',
    duration_days: eventDurationDays(event),
    teams_registered: counts.teams,
    individuals_registered: counts.individuals,
    total_registered: counts.total,
    status: event.event_status_master?.status_name || '',
    sponsors: (event.event_sponsors || []).map(item => item.sponsor_master?.sponsor_name).filter(Boolean).join('; ')
  }
}

function eventExportColumns() {
  return [
    { key: 'event_name', label: 'Event' },
    { key: 'event_type', label: 'Event Type' },
    { key: 'event_category', label: 'Category' },
    { key: 'event_area', label: 'Area' },
    { key: 'organizer', label: 'Organizer' },
    { key: 'country', label: 'Country' },
    { key: 'county', label: 'County' },
    { key: 'subcounty', label: 'Subcounty' },
    { key: 'town', label: 'Town' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'duration_days', label: 'Duration (days)' },
    { key: 'teams_registered', label: 'Teams' },
    { key: 'individuals_registered', label: 'Individuals' },
    { key: 'total_registered', label: 'Total Participants' },
    { key: 'status', label: 'Status' },
    { key: 'sponsors', label: 'Sponsors' }
  ]
}


function eventPdfColumns() {
  return [
    { key: 'event_name', label: 'Event' },
    { key: 'event_type', label: 'Type' },
    { key: 'event_category', label: 'Category' },
    { key: 'event_area', label: 'Area' },
    { key: 'county', label: 'County' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'teams_registered', label: 'Teams' },
    { key: 'individuals_registered', label: 'Individuals' },
    { key: 'total_registered', label: 'Total' },
    { key: 'status', label: 'Status' }
  ]
}

function buildEventAreaRows() {
  const groups = new Map()
  for (const event of filteredEventReportData) {
    const area = event.event_area || 'Unspecified'
    if (!groups.has(area)) {
      groups.set(area, { area, occurrences: 0, participants: 0, teams: 0, individuals: 0, durationDays: 0, counties: new Set(), categories: new Set() })
    }
    const item = groups.get(area)
    const counts = eventParticipantCounts(event)
    item.occurrences += 1
    item.participants += counts.total
    item.teams += counts.teams
    item.individuals += counts.individuals
    item.durationDays += eventDurationDays(event)
    if (event.county_master?.county_name) item.counties.add(event.county_master.county_name)
    if (event.events?.event_category_master?.category_name) item.categories.add(event.events.event_category_master.category_name)
  }
  return [...groups.values()].map(item => ({
    area: item.area,
    occurrences: item.occurrences,
    participants: item.participants,
    teams: item.teams,
    individuals: item.individuals,
    averageDurationDays: item.occurrences ? item.durationDays / item.occurrences : 0,
    counties: item.counties.size,
    categories: item.categories.size
  })).sort((a, b) => b.occurrences - a.occurrences || b.participants - a.participants)
}

function renderEventAreaAnalytics() {
  const host = ensureReportAnalyticsHost({ id: 'eventAreaAnalyticsContainer' })
  if (!host) return
  const areas = buildEventAreaRows()
  host.innerHTML = `
    <div class="card shadow-sm mb-3">
      <div class="card-header"><strong>Event Area Comparison</strong><div class="small text-body-secondary">Uses event_instances.event_area and registered participant instances.</div></div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-12 col-xl-7"><canvas id="eventAreaComparisonChart" height="120"></canvas></div>
          <div class="col-12 col-xl-5">
            <div class="table-responsive"><table class="table table-sm table-striped"><thead><tr><th>Area</th><th>Occurrences</th><th>Registered</th><th>Avg Days</th></tr></thead><tbody>
              ${areas.slice(0, 10).map(item => `<tr><td>${item.area}</td><td>${item.occurrences}</td><td>${item.participants}</td><td>${item.averageDurationDays.toFixed(1)}</td></tr>`).join('') || '<tr><td colspan="4">No event-area data.</td></tr>'}
            </tbody></table></div>
          </div>
        </div>
      </div>
    </div>`

  const canvas = document.getElementById('eventAreaComparisonChart')
  if (!canvas || !window.Chart) return
  if (eventAreaChart) {
    try { eventAreaChart.destroy() } catch { /* no-op */ }
  }
  eventAreaChart = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: areas.slice(0, 10).map(item => item.area),
      datasets: [
        { label: 'Occurrences', data: areas.slice(0, 10).map(item => item.occurrences), backgroundColor: '#198754' },
        { label: 'Registered participants', data: areas.slice(0, 10).map(item => item.participants), backgroundColor: '#0dcaf0' }
      ]
    },
    options: { indexAxis: 'y', responsive: true, scales: { x: { beginAtZero: true } } }
  })
}

/* ==========================================
   SEARCH
========================================== */

function applyFilters() {
  const search = ($('searchEventReport')?.value || '').trim().toLowerCase()
  const statusId = $('filterEventStatus')?.value || ''
  const categoryId = $('filterEventCategory')?.value || ''
  const countyId = $('filterEventCounty')?.value || ''
  const year = $('filterEventYear')?.value || ''

  filteredEventReportData = eventReportData.filter(event => {
    const searchable = [
      event.events?.event_code || '',
      event.events?.event_name || '',
      event.events?.event_type_master?.event_type_name || '',
      event.events?.event_category_master?.category_name || '',
      event.event_area || '',
      event.organizer || '',
      event.country_master?.country_name || '',
      event.county_master?.county_name || '',
      event.subcounty_master?.subcounty_name || '',
      event.town_master?.town_name || '',
      event.event_status_master?.status_name || ''
    ].join(' ').toLowerCase()

    if (search && !searchable.includes(search)) return false
    if (statusId && event.event_status_id !== statusId) return false
    if (categoryId && event.events?.event_category_id !== categoryId) return false
    if (countyId && event.county_id !== countyId) return false
    if (year) {
      const eventYear = event.start_date ? new Date(`${event.start_date}T00:00:00`).getFullYear().toString() : ''
      if (eventYear !== year) return false
    }
    return true
  })

  currentPage = 1
  buildEventStatistics()
  applySorting()
}

/* ==========================================
   FILTERS
========================================== */

function clearFilters() {
  $('searchEventReport')
    .value = ''

  $('filterEventStatus')
    .value = ''

  $('filterEventCategory')
    .value = ''

  $('filterEventCounty')
    .value = ''

  $('filterEventYear')
    .value = ''

  filteredEventReportData =
    [...eventReportData]

  currentPage = 1

  buildEventStatistics()
  applySorting()
}

/* ==========================================
   SORTING
========================================== */


function applySorting() {
  filteredEventReportData.sort((a, b) => {
    const values = event => {
      switch (currentSortField) {
        case 'event_code': return event.events?.event_code || ''
        case 'event_name': return event.events?.event_name || ''
        case 'category': return event.events?.event_category_master?.category_name || ''
        case 'county': return event.county_master?.county_name || ''
        case 'organizer': return event.organizer || ''
        case 'start_date': return event.start_date || ''
        case 'end_date': return event.end_date || ''
        case 'duration': return eventDurationDays(event)
        case 'status': return event.event_status_master?.status_name || ''
        default: return ''
      }
    }
    const valueA = values(a)
    const valueB = values(b)
    if (valueA < valueB) return currentSortDirection === 'asc' ? -1 : 1
    if (valueA > valueB) return currentSortDirection === 'asc' ? 1 : -1
    return 0
  })
  renderTable()
  renderEventAreaAnalytics()
}

/* ==========================================
   TABLE RENDERING
========================================== */

function renderTable() {
  const tbody = $('eventReportTableBody')
  if (!tbody) return
  const start = (currentPage - 1) * PAGE_SIZE
  const rows = filteredEventReportData.slice(start, start + PAGE_SIZE)

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="11" class="text-center">No Events Found</td></tr>'
    renderPagination()
    return
  }

  tbody.innerHTML = rows.map(event => {
    const counts = eventParticipantCounts(event)
    return `
      <tr>
        <td>${event.events?.event_name || ''}</td>
        <td>${event.events?.event_category_master?.category_name || ''}</td>
        <td>${event.county_master?.county_name || ''}</td>
        <td>${event.organizer || ''}</td>
        <td>${event.start_date || ''}</td>
        <td>${event.end_date || ''}</td>
        <td>${eventDurationDays(event)}</td>
        <td>${counts.teams}</td>
        <td>${counts.individuals}</td>
        <td>${getStatusBadge(event.event_status_master?.status_name)}</td>
        <td><button class="btn btn-sm btn-info" onclick="viewEventDetails('${event.event_instance_id}')">View</button></td>
      </tr>`
  }).join('')
  renderPagination()
}

/* ==========================================
   PAGINATION
========================================== */

/* ==========================================
   EVENT DETAILS MODAL
========================================== */

window.viewEventDetails =
async function (
  eventInstanceId
) {
  try {
    showLoading(true)

    const event =
      eventReportData.find(
        item =>
          item.event_instance_id ===
          eventInstanceId
      )

    if (!event) {
      return
    }

    const eventId =
      event.event_id

    const participantRows =
      event.participant_instances || []

    const teamRefs =
      new Set()

    let individualCount = 0

    for (const participant of participantRows) {
      const typeCode =
        String(
          participant
            ?.participant_registry
            ?.participant_type_master
            ?.participant_type_code || ''
        )
          .toUpperCase()

      if (typeCode.includes('TEAM')) {
        teamRefs.add(
          participant.participant_ref_id
        )
      } else {
        individualCount++
      }
    }

    const [
      resultsResponse,
      performanceResponse
    ] = await Promise.all([

      getDb()
        .from('race_results')
        .select(
          '*',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'event_instance_id',
          eventInstanceId
        ),

      getDb()
        .from('performance')
        .select(
          '*',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'event_id',
          eventId
        )
    ])

    const programsCount =
      new Set(
        participantRows
          .map(
            participant =>
              participant.program_id
          )
          .filter(Boolean)
      ).size

    const sponsorsCount =
      event.event_sponsors
        ?.length || 0

    const rankingsCount =
      'N/A (rankings are not linked to event instances)'

    setText(
      'reportEventName',
      event.events?.event_name || ''
    )

    setText(
      'reportEventCategory',
      event
        .events
        ?.event_category_master
        ?.category_name || ''
    )

    setText(
      'reportEventStatus',
      event
        .event_status_master
        ?.status_name || ''
    )

    setText(
      'reportEventCountry',
      event
        .country_master
        ?.country_name || ''
    )

    setText(
      'reportEventCounty',
      event
        .county_master
        ?.county_name || ''
    )

    setText(
      'reportEventTown',
      event
        .town_master
        ?.town_name || ''
    )

    setText(
      'reportEventOrganizer',
      event.organizer || ''
    )

    setText(
      'reportEventDuration',
      calculateDuration(
        event.start_date,
        event.end_date
      )
    )

    setText(
      'reportRegisteredTeams',
      teamRefs.size
    )

    setText(
      'reportRegisteredParticipants',
      participantRows.length
    )

    setText(
      'reportPrograms',
      programsCount
    )

    setText(
      'reportSponsors',
      sponsorsCount
    )

    setText(
      'reportResultsRecorded',
      resultsResponse?.count || 0
    )

    setText(
      'reportRankingsGenerated',
      rankingsCount
    )

    setText(
      'reportPerformanceRecords',
      performanceResponse?.count || 0
    )

    const participantMetric =
      document.getElementById(
        'reportRegisteredIndividuals'
      )

    if (participantMetric) {
      participantMetric.textContent =
        String(individualCount)
    }

    eventDetailsModal?.show()
  } catch (
    error
  ) {
    showInlineError(
      error.message
    )
  } finally {
    showLoading(false)
  }
}

/* ==========================================
   EXPORTS
========================================== */

function eventExportSummary() {
  const areaRows =
    buildEventAreaRows()

  const uniqueParticipants =
    new Set()

  for (
    const event
    of filteredEventReportData
  ) {
    for (
      const participant
      of event.participant_instances || []
    ) {
      if (
        participant.participant_ref_id
      ) {
        uniqueParticipants.add(
          participant.participant_ref_id
        )
      }
    }
  }

  return {
    Events:
      filteredEventReportData.length,
    'Event Areas':
      areaRows.length,
    'Registered Participants':
      uniqueParticipants.size,
    Countries:
      new Set(
        filteredEventReportData
          .map(
            event =>
              event.country_master
                ?.country_name
          )
          .filter(Boolean)
      ).size,
    Counties:
      new Set(
        filteredEventReportData
          .map(
            event =>
              event.county_master
                ?.county_name
          )
          .filter(Boolean)
      ).size,
    Subcounties:
      new Set(
        filteredEventReportData
          .map(
            event =>
              event.subcounty_master
                ?.subcounty_name
          )
          .filter(Boolean)
      ).size
  }
}

function eventExportRows() {
  return filteredEventReportData
    .map(
      flattenEventRecord
    )
}

function exportCsv() {
  downloadCsv({
    reportName:
      'Event Report',
    columns:
      eventExportColumns(),
    data:
      eventExportRows()
  })
}

async function exportExcel() {
  const areaRows =
    buildEventAreaRows()

  const countyRows =
    Object.values(
      filteredEventReportData.reduce(
        (
          accumulator,
          event
        ) => {
          const county =
            event.county_master
              ?.county_name ||
            'Unknown'

          if (
            !accumulator[county]
          ) {
            accumulator[county] = {
              county,
              events: 0,
              participants:
                new Set(),
              areas:
                new Set()
            }
          }

          accumulator[county].events++

          if (event.event_area) {
            accumulator[county]
              .areas
              .add(event.event_area)
          }

          for (
            const participant
            of event.participant_instances || []
          ) {
            if (
              participant.participant_ref_id
            ) {
              accumulator[county]
                .participants
                .add(
                  participant.participant_ref_id
                )
            }
          }

          return accumulator
        },
        {}
      )
    )
      .map(
        item => ({
          county:
            item.county,
          events:
            item.events,
          participants:
            item.participants.size,
          areas:
            item.areas.size
        })
      )

  await downloadExcelWorkbook({
    reportName:
      'Event Report',
    sheets: [
      {
        sheetName:
          'Summary',
        columns: [
          {
            key: 'metric',
            label: 'Metric'
          },
          {
            key: 'value',
            label: 'Value'
          }
        ],
        data:
          Object.entries(
            eventExportSummary()
          )
            .map(
              ([metric, value]) => ({
                metric,
                value
              })
            )
      },
      {
        sheetName:
          'Events',
        columns:
          eventExportColumns(),
        data:
          eventExportRows()
      },
      {
        sheetName:
          'Event Areas',
        columns: [
          {
            key: 'area',
            label: 'Event Area'
          },
          {
            key: 'occurrences',
            label: 'Occurrences'
          },
          {
            key: 'participants',
            label: 'Registered Participants'
          },
          {
            key: 'teams',
            label: 'Registered Teams'
          },
          {
            key: 'individuals',
            label: 'Registered Individuals'
          },
          {
            key: 'averageDurationDays',
            label: 'Average Duration Days'
          },
          {
            key: 'counties',
            label: 'Counties'
          },
          {
            key: 'categories',
            label: 'Categories'
          }
        ],
        data:
          areaRows
      },
      {
        sheetName:
          'Counties',
        columns: [
          {
            key: 'county',
            label: 'County'
          },
          {
            key: 'events',
            label: 'Events'
          },
          {
            key: 'participants',
            label: 'Participants'
          },
          {
            key: 'areas',
            label: 'Event Areas'
          }
        ],
        data:
          countyRows
      }
    ]
  })
}

function eventPdfSelectedText(id, fallback = 'All') {
  const element = $(id)
  return element?.selectedOptions?.[0]?.textContent?.trim() || fallback
}

function eventPdfCountBy(getValue) {
  const counts = new Map()

  for (const event of filteredEventReportData) {
    const value = String(getValue(event) || 'Unspecified').trim() || 'Unspecified'
    counts.set(value, (counts.get(value) || 0) + 1)
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
}

function eventPdfParticipantSummary() {
  const all = new Set()
  const teams = new Set()
  const individuals = new Set()

  for (const event of filteredEventReportData) {
    for (const registration of event.participant_instances || []) {
      const registry = registration.participant_registry
      const participantId =
        registration.participant_ref_id ||
        registry?.participant_ref_id ||
        registry?.source_id

      if (!participantId) {
        continue
      }

      all.add(participantId)

      const typeCode = String(
        registry?.participant_type_master?.participant_type_code || ''
      ).toUpperCase()

      if (typeCode.includes('TEAM')) {
        teams.add(participantId)
      } else {
        individuals.add(participantId)
      }
    }
  }

  return {
    total: all.size,
    teams: teams.size,
    individuals: individuals.size
  }
}

function eventPdfFilters() {
  return {
    Search: $('searchEventReport')?.value?.trim() || 'All',
    Status: eventPdfSelectedText('filterEventStatus'),
    Category: eventPdfSelectedText('filterEventCategory'),
    County: eventPdfSelectedText('filterEventCounty'),
    Year: eventPdfSelectedText('filterEventYear')
  }
}

function eventPdfReportingPeriod() {
  const dates = filteredEventReportData
    .map(event => event.start_date)
    .filter(Boolean)
    .sort()

  if (!dates.length) {
    return 'No dated events in current selection'
  }

  if (dates[0] === dates[dates.length - 1]) {
    return dates[0]
  }
  return `${dates[0]} to ${dates[dates.length - 1]}`
}

function eventPdfInsights() {
  const areas = buildEventAreaRows()
  const counties = eventPdfCountBy(
    event => event.county_master?.county_name
  )
  const categories = eventPdfCountBy(
    event => event.events?.event_category_master?.category_name
  )
  const statuses = eventPdfCountBy(
    event => event.event_status_master?.status_name
  )

  const totalRegistrations = filteredEventReportData.reduce(
    (total, event) => total + eventParticipantCounts(event).total,
    0
  )

  const totalDuration = filteredEventReportData.reduce(
    (total, event) => total + eventDurationDays(event),
    0
  )

  const eventCount = filteredEventReportData.length
  const insights = []

  if (areas[0]) {
    insights.push(
      `Most active event area: ${areas[0].area} (${areas[0].occurrences} occurrence${areas[0].occurrences === 1 ? '' : 's'}, ${areas[0].participants} registrations).`
    )
  }

  if (counties[0]) {
    insights.push(
      `County with the most event occurrences: ${counties[0].label} (${counties[0].value}).`
    )
  }

  if (categories[0]) {
    insights.push(
      `Most common event category: ${categories[0].label} (${categories[0].value} event${categories[0].value === 1 ? '' : 's'}).`
    )
  }

  if (statuses[0]) {
    insights.push(
      `Most common event status: ${statuses[0].label} (${statuses[0].value} event${statuses[0].value === 1 ? '' : 's'}).`
    )
  }

  if (eventCount) {
    insights.push(
      `Average registrations per event occurrence: ${(totalRegistrations / eventCount).toFixed(1)}.`,
      `Average event duration: ${(totalDuration / eventCount).toFixed(1)} day${(totalDuration / eventCount) === 1 ? '' : 's'}.`
    )
  }

  return insights
}

function eventPdfAutoTable(pdf, options) {
  if (typeof pdf?.autoTable === 'function') {
    return pdf.autoTable(options)
  }

  if (typeof window.autoTable === 'function') {
    return window.autoTable(pdf, options)
  }

  const standalone =
    window.jspdfAutoTable?.default ||
    window.jspdfAutoTable?.autoTable

  if (typeof standalone === 'function') {
    return standalone(pdf, options)
  }

  throw new Error(
    'jsPDF AutoTable is not loaded. Ensure the AutoTable plugin is loaded before using Event PDF export.'
  )
}

function eventPdfAddPageTitle(pdf, title, subtitle = '') {
  pdf.setTextColor(33, 37, 41)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(19)
  pdf.text(title, 14, 18)

  if (subtitle) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(90, 96, 100)
    pdf.text(subtitle, 14, 25)
  }

  pdf.setDrawColor(210, 215, 210)
  pdf.line(14, 29, 283, 29)
  pdf.setTextColor(33, 37, 41)
}

function eventPdfAddFooter(pdf) {
  const pages = pdf.internal.getNumberOfPages()

  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    const width = pdf.internal.pageSize.getWidth()
    const height = pdf.internal.pageSize.getHeight()

    pdf.setDrawColor(220, 225, 220)
    pdf.line(14, height - 13, width - 14, height - 13)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(90, 96, 100)
    pdf.text('Thika Tandem ParaCycling Club', 14, height - 7)
    pdf.text(`Page ${page} of ${pages}`, width - 14, height - 7, {
      align: 'right'
    })
  }
}

function eventPdfAddCover(pdf) {
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()

  pdf.setFillColor(25, 135, 84)
  pdf.rect(0, 0, width, height, 'F')

  pdf.setFillColor(255, 193, 7)
  pdf.rect(0, 0, width, 7, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(29)
  pdf.text('THIKA TANDEM PARACYCLING CLUB', width / 2, 68, {
    align: 'center'
  })

  pdf.setFontSize(24)
  pdf.text('EVENT REPORT', width / 2, 100, {
    align: 'center'
  })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(13)
  pdf.text(`Reporting Period: ${eventPdfReportingPeriod()}`, width / 2, 121, {
    align: 'center'
  })

  pdf.setFontSize(10)
  pdf.text(
    `${filteredEventReportData.length} filtered event occurrence${filteredEventReportData.length === 1 ? '' : 's'}`,
    width / 2,
    134,
    { align: 'center' }
  )

  pdf.setFontSize(8.5)
  pdf.text(`Generated ${new Date().toLocaleString()}`, width / 2, height - 18, {
    align: 'center'
  })
}

function eventPdfAddKpiCard(pdf, { x, y, width, title, value, color }) {
  pdf.setFillColor(...color)
  pdf.roundedRect(x, y, width, 29, 3, 3, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9.5)
  pdf.text(title, x + 5, y + 9)

  pdf.setFontSize(18)
  pdf.text(String(value), x + 5, y + 22)
}

function eventPdfCreateChartImage(config) {
  const ChartConstructor =
    typeof window.Chart === 'function' ?
      window.Chart :
      window.Chart?.Chart

  if (typeof ChartConstructor !== 'function') {
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1500
  canvas.height = 850
  canvas.style.position = 'absolute'
  canvas.style.left = '-10000px'
  canvas.style.top = '-10000px'
  document.body.append(canvas)

  const sourceOptions =
    config.options

  const sourcePlugins =
    sourceOptions?.plugins

  const sourceLegend =
    sourcePlugins?.legend

  const sourceTitle =
    sourcePlugins?.title

  const legend =
    sourceLegend === false ?
      false :
      {
        ...sourceLegend,
        labels: {
          ...sourceLegend?.labels,
          color: '#212529',
          font: {
            size: 20,
            weight: 'bold'
          },
          padding: 18
        }
      }

  const title =
    sourceTitle ?
      {
        ...sourceTitle,
        color: '#212529',
        font: {
          size: 25,
          weight: 'bold'
        },
        padding: {
          top: 6,
          bottom: 16
        }
      } :
      undefined

  const options = {
    ...sourceOptions,
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      ...sourcePlugins,
      legend,
      title
    }
  }

  const scales = {}
  for (const [key, value] of Object.entries(options.scales || {})) {
    const scaleTitle =
      value?.title ?
        {
          ...value.title,
          color: '#212529',
          font: {
            size: 19,
            weight: 'bold'
          }
        } :
        value?.title

    scales[key] = {
      ...value,
      ticks: {
        ...value?.ticks,
        color: '#212529',
        font: {
          size: 18,
          weight: 'bold'
        }
      },
      title: scaleTitle
    }
  }

  options.scales = scales

  let chart = null

  try {
    chart = new ChartConstructor(canvas, {
      ...config,
      options
    })
    chart.update('none')
    return chart.toBase64Image('image/png', 1)
  } finally {
    try {
      chart?.destroy()
    } catch {
      // no-op
    }

    canvas.remove()
  }
}

function eventPdfAddChart(pdf, image, x, y, width, height, title) {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(33, 37, 41)
  pdf.text(title, x, y - 4)

  if (image) {
    pdf.addImage(image, 'PNG', x, y, width, height)
  } else {
    pdf.setDrawColor(220, 225, 220)
    pdf.rect(x, y, width, height)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(90, 96, 100)
    pdf.text('Chart unavailable', x + width / 2, y + height / 2, {
      align: 'center'
    })
  }
}

function eventPdfAddDashboardPage(pdf) {
  pdf.addPage()
  eventPdfAddPageTitle(
    pdf,
    'Event Performance Dashboard',
    'Filtered event occurrences, registrations, categories and geographic coverage.'
  )

  const summary = eventExportSummary()
  const participants = eventPdfParticipantSummary()
  const categories = eventPdfCountBy(
    event => event.events?.event_category_master?.category_name
  )

  const competition = categories
    .filter(item => item.label.toLowerCase().includes('competition'))
    .reduce((total, item) => total + item.value, 0)
  const training = categories
    .filter(item => item.label.toLowerCase().includes('training'))
    .reduce((total, item) => total + item.value, 0)

  const cards = [
    { title: 'EVENTS', value: summary.Events || 0, color: [25, 135, 84] },
    { title: 'EVENT AREAS', value: summary['Event Areas'] || 0, color: [13, 110, 253] },
    { title: 'REGISTERED', value: participants.total, color: [13, 202, 240] },
    { title: 'TEAMS', value: participants.teams, color: [108, 117, 125] },
    { title: 'INDIVIDUALS', value: participants.individuals, color: [111, 66, 193] },
    { title: 'COUNTIES', value: summary.Counties || 0, color: [255, 193, 7] },
    { title: 'COMPETITION', value: competition, color: [220, 53, 69] },
    { title: 'TRAINING', value: training, color: [32, 201, 151] }
  ]

  const cardWidth = 61
  cards.forEach((card, index) => {
    const column = index % 4
    const row = Math.floor(index / 4)
    eventPdfAddKpiCard(pdf, {
      x: 14 + column * 68,
      y: 38 + row * 38,
      width: cardWidth,
      ...card
    })
  })

  pdf.setTextColor(33, 37, 41)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text('Filters Applied', 14, 122)

  const filters = Object.entries(eventPdfFilters())
  let filterY = 131
  for (const [key, value] of filters) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    pdf.text(`${key}:`, 18, filterY)
    pdf.setFont('helvetica', 'normal')
    pdf.text(String(value), 48, filterY)
    filterY += 7
  }

  const insights = eventPdfInsights()
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text('Key Event Insights', 150, 122)

  let insightY = 131
  for (const insight of insights.slice(0, 6)) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.2)
    const lines = pdf.splitTextToSize(`• ${insight}`, 128)
    pdf.text(lines, 154, insightY)
    insightY += lines.length * 5 + 2
  }
}

function eventPdfAddChartsPage(pdf) {
  const statuses = eventPdfCountBy(
    event => event.event_status_master?.status_name
  ).slice(0, 8)
  const categories = eventPdfCountBy(
    event => event.events?.event_category_master?.category_name
  ).slice(0, 8)
  const counties = eventPdfCountBy(
    event => event.county_master?.county_name
  ).slice(0, 10)
  const areas = buildEventAreaRows().slice(0, 10)

  const statusImage = eventPdfCreateChartImage({
    type: 'doughnut',
    data: {
      labels: statuses.map(item => item.label),
      datasets: [{
        label: 'Events',
        data: statuses.map(item => item.value)
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Event Status Distribution' }
      }
    }
  })

  const categoryImage = eventPdfCreateChartImage({
    type: 'bar',
    data: {
      labels: categories.map(item => item.label),
      datasets: [{
        label: 'Events',
        data: categories.map(item => item.value),
        backgroundColor: '#198754'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        title: { display: true, text: 'Events by Category' }
      }
    }
  })

  const areaImage = eventPdfCreateChartImage({
    type: 'bar',
    data: {
      labels: areas.map(item => item.area),
      datasets: [
        {
          label: 'Occurrences',
          data: areas.map(item => item.occurrences),
          backgroundColor: '#198754'
        },
        {
          label: 'Registered Participants',
          data: areas.map(item => item.participants),
          backgroundColor: '#0dcaf0'
        }
      ]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true }
      },
      plugins: {
        title: { display: true, text: 'Event Area Comparison' }
      }
    }
  })

  const countyImage = eventPdfCreateChartImage({
    type: 'bar',
    data: {
      labels: counties.map(item => item.label),
      datasets: [{
        label: 'Events',
        data: counties.map(item => item.value),
        backgroundColor: '#ffc107'
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true }
      },
      plugins: {
        title: { display: true, text: 'Events by County' }
      }
    }
  })

  pdf.addPage()
  eventPdfAddPageTitle(
    pdf,
    'Event Comparisons',
    'Status, category, event-area and county distributions for the current report selection.'
  )

  eventPdfAddChart(pdf, statusImage, 14, 40, 128, 62, 'Status Distribution')
  eventPdfAddChart(pdf, categoryImage, 154, 40, 128, 62, 'Category Distribution')
  eventPdfAddChart(pdf, areaImage, 14, 119, 128, 62, 'Event Area Comparison')
  eventPdfAddChart(pdf, countyImage, 154, 119, 128, 62, 'County Distribution')
}

function eventPdfAddAreaTable(pdf) {
  const areas = buildEventAreaRows()

  pdf.addPage()
  eventPdfAddPageTitle(
    pdf,
    'Event Area Intelligence',
    'Occurrence and registration activity grouped by event_instances.event_area.'
  )

  eventPdfAutoTable(pdf, {
    startY: 36,
    head: [[
      'Event Area',
      'Occurrences',
      'Registered',
      'Teams',
      'Individuals',
      'Avg Days',
      'Counties',
      'Categories'
    ]],
    body: areas.map(item => [
      item.area,
      item.occurrences,
      item.participants,
      item.teams,
      item.individuals,
      item.averageDurationDays.toFixed(1),
      item.counties,
      item.categories
    ]),
    theme: 'grid',
    margin: { left: 12, right: 12, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: [33, 37, 41],
      cellPadding: 2.2,
      valign: 'middle',
      lineColor: [220, 225, 220],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [25, 135, 84],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [248, 250, 248]
    },
    showHead: 'everyPage',
    rowPageBreak: 'avoid'
  })
}

function eventPdfAddDetailTable(pdf) {
  const rows = eventExportRows()
  const columns = eventPdfColumns()

  pdf.addPage()
  eventPdfAddPageTitle(
    pdf,
    'Detailed Event Records',
    `${rows.length} filtered event occurrence${rows.length === 1 ? '' : 's'}.`
  )

  eventPdfAutoTable(pdf, {
    startY: 36,
    head: [columns.map(column => column.label)],
    body: rows.map(row => columns.map(column => row[column.key] ?? '')),
    theme: 'grid',
    margin: { left: 8, right: 8, bottom: 18 },
    styles: {
      font: 'helvetica',
      fontSize: 7.6,
      textColor: [33, 37, 41],
      cellPadding: 1.7,
      valign: 'middle',
      overflow: 'linebreak',
      lineColor: [220, 225, 220],
      lineWidth: 0.1,
      minCellHeight: 7
    },
    headStyles: {
      fillColor: [25, 135, 84],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.2,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 248]
    },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 27 },
      4: { cellWidth: 27 },
      5: { cellWidth: 24 },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 21, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 27 }
    },
    showHead: 'everyPage',
    rowPageBreak: 'avoid'
  })
}

async function exportPdf() {
  try {
    if (!filteredEventReportData.length) {
      showInlineError('No event records are available for PDF export.')
      return
    }

    const JsPdf =
      window.jspdf?.jsPDF ||
      window.jsPDF

    if (typeof JsPdf !== 'function') {
      throw new TypeError(
        'jsPDF is not loaded. Ensure the jsPDF library is loaded before using Event PDF export.'
      )
    }

    const pdf = new JsPdf({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    eventPdfAddCover(pdf)
    eventPdfAddDashboardPage(pdf)
    eventPdfAddChartsPage(pdf)
    eventPdfAddAreaTable(pdf)
    eventPdfAddDetailTable(pdf)
    eventPdfAddFooter(pdf)

    pdf.save('Event_Report.pdf')
  } catch (error) {
    showInlineError(
      `PDF Export Failed:\n\n${error?.message || String(error)}`
    )
  }
}


/* ==========================================
   EVENT WIRING
========================================== */

function wireEvents() {
  $('searchEventReport')
    ?.addEventListener(
      'input',
      applyFilters
    )

  $('filterEventStatus')
    ?.addEventListener(
      'change',
      applyFilters
    )

  $('filterEventCategory')
    ?.addEventListener(
      'change',
      applyFilters
    )

  $('filterEventCounty')
    ?.addEventListener(
      'change',
      applyFilters
    )

  $('filterEventYear')
    ?.addEventListener(
      'change',
      applyFilters
    )

  $('btnRefreshEventReport')
    ?.addEventListener(
      'click',
      async () => {
        await loadEventReportData()
        applyFilters()
      }
    )

  $('btnExportEventReportCsv')
    ?.addEventListener(
      'click',
      exportCsv
    )

  $('btnExportEventReportExcel')
    ?.addEventListener(
      'click',
      exportExcel
    )

  $('btnExportEventReportPdf')
    ?.addEventListener(
      'click',
      exportPdf
    )

  $('btnPrintEventReport')
    ?.addEventListener(
      'click',
      printReport
    )

  $('btnPreviousEventReportPage')
    ?.addEventListener(
      'click',
      previousPage
    )

  $('btnNextEventReportPage')
    ?.addEventListener(
      'click',
      nextPage
    )

  for (const header of document
    .querySelectorAll(
      'th.sortable'
    )) {
    header
          .addEventListener(
            'click',
            () => {
              sortBy(
                header.dataset
                  .sort
              )
            }
          )
  }
}

/* ==========================================
   MODALS
========================================== */

function initializeModals() {
  const modalElement =
    document.getElementById(
      'eventIntelligenceModal'
    )

  if (
    modalElement
  ) {
    eventDetailsModal =
      createModalByElement(modalElement)
  }
}

/* ==========================================
   INITIALIZATION
========================================== */

async function initializeEventReport() {
  try {
    initializeModals()

    await Promise.all([

      loadStatuses(),

      loadCategories(),

      loadCounties()

    ])

    buildYearFilter()

    await loadEventReportData()

    wireEvents()

    applyFilters()
  } catch (
    error
  ) {

    showInlineError(
      error.message
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeEventReport
)
