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
  downloadExcelWorkbook,
  downloadPdf
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
    { key: 'organizer', label: 'Organizer' },
    { key: 'county', label: 'County' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'duration_days', label: 'Days' },
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

function exportPdf() {
  downloadPdf({
    reportName:
      'Event Report',
    columns:
      eventPdfColumns(),
    data:
      eventExportRows(),
    summary:
      eventExportSummary()
  })
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
