/* global coreui */
/* eslint-disable no-console */

/* ==========================================
   CONSTANTS
========================================== */

const PAGE_SIZE = 10

/* ==========================================
   GLOBALS
========================================== */

let currentPage = 1

let eventReportData = []

let filteredEventReportData = []

let statusLookup = []

let categoryLookup = []

let countyLookup = []

let sponsorLookup = []

let eventIntelligenceModal = null

let currentSortField =
  'start_date'

let currentSortDirection =
  'desc'

/* ==========================================
   DOM HELPERS
========================================== */

const $ = id =>
  document.getElementById(id)

function showLoading(
  show = true
) {

  const loading =
    $('eventReportLoading')

  if (!loading) {
    return
  }

  loading.classList.toggle(
    'd-none',
    !show
  )
}

function setText(
  id,
  value
) {

  const element =
    $(id)

  if (!element) {
    return
  }

  element.textContent =
    value ?? ''
}

function safeNumber(
  value
) {

  return Number(
    value || 0
  )
}

function calculatePercentage(
  count,
  total
) {

  if (
    !total
  ) {

    return '0%'
  }

  return `
    ${(
      (
        count /
        total
      ) * 100
    ).toFixed(1)}%
  `
}

function calculateDuration(
  startDate,
  endDate
) {

  if (
    !startDate ||
    !endDate
  ) {

    return '-'
  }

  const start =
    new Date(
      startDate
    )

  const end =
    new Date(
      endDate
    )

  const days =
    Math.floor(
      (
        end - start
      ) /
      (
        1000 *
        60 *
        60 *
        24
      )
    )

  return `${days} Days`
}

function getStatusBadge(
  status
) {

  const value =
    (
      status || ''
    )
      .toLowerCase()

  if (
    value.includes(
      'upcoming'
    )
  ) {

    return `
      <span class="badge bg-info">
        Upcoming
      </span>
    `
  }

  if (
    value.includes(
      'ongoing'
    )
  ) {

    return `
      <span class="badge bg-success">
        Ongoing
      </span>
    `
  }

  if (
    value.includes(
      'completed'
    )
  ) {

    return `
      <span class="badge bg-secondary">
        Completed
      </span>
    `
  }

  if (
    value.includes(
      'cancel'
    )
  ) {

    return `
      <span class="badge bg-danger">
        Cancelled
      </span>
    `
  }

  return `
    <span class="badge bg-primary">
      ${status || ''}
    </span>
  `
}

/* ==========================================
   LOOKUPS
========================================== */

async function loadStatuses() {

  const {
    data,
    error
  } =
    await window.supabaseClient
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

  statusLookup.forEach(
    status => {

      const option =
        document.createElement(
          'option'
        )

      option.value =
        status.event_status_id

      option.textContent =
        status.status_name

      select.appendChild(
        option
      )
    }
  )
}

async function loadCategories() {

  const {
    data,
    error
  } =
    await window.supabaseClient
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
    console.error(
      error
    )

    return
  }

  categoryLookup =
    data || []

  const select =
    $('filterEventCategory')

  if (!select) {
    return
  }

  categoryLookup.forEach(
    category => {

      const option =
        document.createElement(
          'option'
        )

      option.value =
        category.event_category_id

      option.textContent =
        category.category_name

      select.appendChild(
        option
      )
    }
  )
}

async function loadCounties() {

  const {
    data,
    error
  } =
    await window.supabaseClient
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
    console.error(
      error
    )

    return
  }

  countyLookup =
    data || []

  const select =
    $('filterEventCounty')

  if (!select) {
    return
  }

  countyLookup.forEach(
    county => {

      const option =
        document.createElement(
          'option'
        )

      option.value =
        county.county_id

      option.textContent =
        county.county_name

      select.appendChild(
        option
      )
    }
  )
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

    select.appendChild(
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

    const {
      data,
      error
    } =
     await window.supabaseClient
  .from('event_instances')
  .select(`
    *,
    events(
      event_id,
      event_name,
      event_category_master(
        category_name
      )
    ),
    county_master(
      county_name
    ),
    subcounty_master(
      subcounty_name
    ),
    town_master(
      town_name
    ),
    event_status_master(
  status_name,
  status_code
),
    event_sponsors(
      *,
      sponsor_master(
        sponsor_name
      )
    )
  `)

    if (error) {
      throw error
    }

    eventReportData =
      data || []

    filteredEventReportData =
      [...eventReportData]

    buildEventStatistics()

  } catch (error) {

    console.error(
      error
    )

    alert(
      error.message
    )

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
    eventReportData.length

  const upcoming =
    eventReportData.filter(
      event =>
        event.event_status_master
          ?.status_name
          ?.toLowerCase()
          .includes(
            'upcoming'
          )
    ).length

  const ongoing =
    eventReportData.filter(
      event =>
        event.event_status_master
          ?.status_name
          ?.toLowerCase()
          .includes(
            'ongoing'
          )
    ).length

  const completed =
    eventReportData.filter(
      event =>
        event.event_status_master
          ?.status_name
          ?.toLowerCase()
          .includes(
            'completed'
          )
    ).length

  const cancelled =
    eventReportData.filter(
      event =>
        event.event_status_master
          ?.status_name
          ?.toLowerCase()
          .includes(
            'cancel'
          )
    ).length

  const competition =
    eventReportData.filter(
      event =>
        event.events?.event_category_master
          ?.category_name
          ?.toLowerCase()
          .includes(
            'competition'
          )
    ).length

  const training =
    eventReportData.filter(
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

  eventReportData.forEach(
    event => {

      const status =
        event.event_status_master
          ?.status_name ||
        'Unknown'

      stats[status] =
        (
          stats[status] || 0
        ) + 1
    }
  )

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
                eventReportData.length
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

  eventReportData.forEach(
    event => {

      const category =
        event.events?.event_category_master
          ?.category_name ||
        event.event_category ||
        'Unknown'

      stats[category] =
        (stats[category] || 0) + 1
    }
  )

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
                eventReportData.length
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

  eventReportData.forEach(
    event => {

      const county =
        event.county_master
          ?.county_name ||
        'Unknown'

      stats[county] =
        (stats[county] || 0) + 1
    }
  )

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
                eventReportData.length
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

  eventReportData.forEach(
    event => {

      const sponsors =
        event.event_sponsors || []

      sponsors.forEach(
        sponsor => {

          const sponsorName =
            sponsor
              .sponsor_master
              ?.sponsor_name ||
            'Unknown'

          stats[sponsorName] =
            (stats[sponsorName] || 0) + 1
        }
      )
    }
  )

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
                eventReportData.length
              )}
            </td>
          </tr>
        `
      )
      .join('')
}

/* ==========================================
   SEARCH
========================================== */

function applyFilters() {

  const search =
    (
      $('searchEventReport')
        ?.value || ''
    )
      .trim()
      .toLowerCase()

  const statusId =
    $('filterEventStatus')
      ?.value || ''

  const categoryId =
    $('filterEventCategory')
      ?.value || ''

  const countyId =
    $('filterEventCounty')
      ?.value || ''

  const year =
    $('filterEventYear')
      ?.value || ''

  filteredEventReportData =
    eventReportData.filter(
      event => {

        const searchable =
          [
            event.event_code || '',

            event.events?.event_name || '',

            event.organizer || '',

            event.country_master
              ?.country_name || '',

            event.county_master
              ?.county_name || '',

            event.town_master
              ?.town_name || '',

            event.event_status_master
              ?.status_name || '',

            event.events?.event_category_master
              ?.category_name || ''
          ]
            .join(' ')
            .toLowerCase()

        if (
          search &&
          !searchable.includes(
            search
          )
        ) {

          return false
        }

        if (
          statusId &&
          event.status_id !==
          statusId
        ) {

          return false
        }

        if (
          categoryId &&
          event.event_category_id !==
          categoryId
        ) {

          return false
        }

        if (
          countyId &&
          event.county_id !==
          countyId
        ) {

          return false
        }

        if (
          year
        ) {

          const eventYear =
            new Date(
              event.start_date
            )
              .getFullYear()
              .toString()

          if (
            eventYear !==
            year
          ) {

            return false
          }
        }

        return true
      }
    )

  currentPage = 1

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

  applySorting()
}

/* ==========================================
   SORTING
========================================== */

function sortBy(
  field
) {

  if (
    currentSortField ===
    field
  ) {

    currentSortDirection =
      currentSortDirection ===
      'asc'
        ? 'desc'
        : 'asc'

  } else {

    currentSortField =
      field

    currentSortDirection =
      'asc'
  }

  applySorting()
}

function applySorting() {

  filteredEventReportData.sort(
    (
      a,
      b
    ) => {

      let valueA = ''

      let valueB = ''

      switch (
        currentSortField
      ) {

      case 'event_code':

        valueA =
          a.event_code || ''

        valueB =
          b.event_code || ''

        break

      case 'event_name':

        valueA =
          a.event_name || ''

        valueB =
          b.event_name || ''

        break

      case 'category':

        valueA =
          a.event_category_master
            ?.category_name || ''

        valueB =
          b.event_category_master
            ?.category_name || ''

        break

      case 'county':

        valueA =
          a.county_master
            ?.county_name || ''

        valueB =
          b.county_master
            ?.county_name || ''

        break

      case 'organizer':

        valueA =
          a.organizer || ''

        valueB =
          b.organizer || ''

        break

      case 'start_date':

        valueA =
          a.start_date || ''

        valueB =
          b.start_date || ''

        break

      case 'end_date':

        valueA =
          a.end_date || ''

        valueB =
          b.end_date || ''

        break

      case 'duration':

        valueA =
          new Date(
            a.end_date ||
            new Date()
          ) -
          new Date(
            a.start_date
          )

        valueB =
          new Date(
            b.end_date ||
            new Date()
          ) -
          new Date(
            b.start_date
          )

        break

      case 'status':

        valueA =
          a.status_master
            ?.status_name || ''

        valueB =
          b.status_master
            ?.status_name || ''

        break

      default:

        valueA = ''
        valueB = ''
      }

      if (
        valueA <
        valueB
      ) {

        return currentSortDirection ===
          'asc'
          ? -1
          : 1
      }

      if (
        valueA >
        valueB
      ) {

        return currentSortDirection ===
          'asc'
          ? 1
          : -1
      }

      return 0
    }
  )

  renderTable()
}

/* ==========================================
   TABLE RENDERING
========================================== */

function renderTable() {

  const tbody =
    $('eventReportTableBody')

  if (!tbody) {
    return
  }

  const start =
    (
      currentPage - 1
    ) * PAGE_SIZE

  const end =
    start + PAGE_SIZE

  const rows =
    filteredEventReportData.slice(
      start,
      end
    )

  if (
    !rows.length
  ) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="12"
          class="text-center"
        >
          No Events Found
        </td>
      </tr>
    `

    renderPagination()

    return
  }

  tbody.innerHTML =
    rows.map(
      event => {

        const teams =
          safeNumber(
            event.team_count
          )

        const participants =
          safeNumber(
            event.participant_count
          )

        return `
          <tr>

            <td>
              ${
                event.event_code ||
                ''
              }
            </td>

            <td>
              ${
                event.events?.event_name ||
                ''
              }
            </td>

            <td>
              ${
                event.events?.event_category_master
                  ?.category_name ||
                ''
              }
            </td>

            <td>
              ${
                event.county_master
                  ?.county_name ||
                ''
              }
            </td>

            <td>
              ${
                event.organizer ||
                ''
              }
            </td>

            <td>
              ${
                event.start_date ||
                ''
              }
            </td>

            <td>
              ${
                event.end_date ||
                ''
              }
            </td>

            <td>
              ${calculateDuration(
                event.start_date,
                event.end_date
              )}
            </td>

            <td>
              ${teams}
            </td>

            <td>
              ${participants}
            </td>

            <td>
              ${getStatusBadge(
                event.event_status_master
                  ?.status_name
              )}
            </td>

            <td>

              <button
                class="
                  btn
                  btn-sm
                  btn-info
                "
                onclick="
                  viewEventIntelligence(
                    '${event.event_id}'
                  )
                "
              >
                View
              </button>

            </td>

          </tr>
        `
      }
    ).join('')

  renderPagination()
}

/* ==========================================
   PAGINATION
========================================== */

function renderPagination() {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEventReportData.length /
        PAGE_SIZE
      )
    )

  setText(
    'eventReportPaginationInfo',
    `
      Page ${currentPage}
      of ${totalPages}
      (
      ${filteredEventReportData.length}
      records
      )
    `
  )
}

function nextPage() {

  const totalPages =
    Math.ceil(
      filteredEventReportData.length /
      PAGE_SIZE
    )

  if (
    currentPage <
    totalPages
  ) {

    currentPage++

    renderTable()
  }
}

function previousPage() {

  if (
    currentPage > 1
  ) {

    currentPage--

    renderTable()
  }
}
/* ==========================================
   EVENT INTELLIGENCE MODAL
========================================== */

window.viewEventIntelligence =
async function (
  eventId
) {

  try {

    showLoading(true)

    const event =
      eventReportData.find(
        item =>
          item.event_id ===
          eventId
      )

    if (
      !event
    ) {

      return
    }

    let teamsCount = 0

    let participantsCount = 0

    let programsCount = 0

    let sponsorsCount = 0

    let resultsCount = 0

    let rankingsCount = 0

    let performanceCount = 0

    const [
      participantsResponse,
      programsResponse,
      sponsorsResponse,
      resultsResponse,
      rankingsResponse,
      performanceResponse
    ] = await Promise.all([

      window.supabaseClient
        .from(
          'event_participants'
        )
        .select(
          'participant_id'
        )
        .eq(
          'event_id',
          eventId
        ),

      window.supabaseClient
        .from(
          'event_programs'
        )
        .select(
          'event_program_id'
        )
        .eq(
          'event_id',
          eventId
        ),

      window.supabaseClient
        .from(
          'event_sponsors'
        )
        .select(
          'event_sponsor_id'
        )
        .eq(
          'event_id',
          eventId
        ),

      window.supabaseClient
        .from(
          'race_results'
        )
        .select(
          '*',
          {
            count:
              'exact',
            head:
              true
          }
        )
        .eq(
          'event_id',
          eventId
        ),

      window.supabaseClient
        .from(
          'rankings'
        )
        .select(
          '*',
          {
            count:
              'exact',
            head:
              true
          }
        ),

      window.supabaseClient
        .from(
          'performance'
        )
        .select(
          '*',
          {
            count:
              'exact',
            head:
              true
          }
        )
    ])

    teamsCount =
      participantsResponse
        ?.data
        ?.length || 0

    participantsCount =
      participantsResponse
        ?.data
        ?.length || 0

    programsCount =
      programsResponse
        ?.data
        ?.length || 0

    sponsorsCount =
      sponsorsResponse
        ?.data
        ?.length || 0

    resultsCount =
      resultsResponse
        ?.count || 0

    rankingsCount =
      rankingsResponse
        ?.count || 0

    performanceCount =
      performanceResponse
        ?.count || 0

    setText(
      'reportEventName',
      event.events?.event_name
    )

    setText(
      'reportEventCategory',
      event
        .event_category_master
        ?.category_name
    )

    setText(
      'reportEventStatus',
      event
        .status_master
        ?.status_name
    )

    setText(
      'reportEventCountry',
      event
        .country_master
        ?.country_name
    )

    setText(
      'reportEventCounty',
      event
        .county_master
        ?.county_name
    )

    setText(
      'reportEventTown',
      event
        .town_master
        ?.town_name
    )

    setText(
      'reportEventOrganizer',
      event.organizer
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
      teamsCount
    )

    setText(
      'reportRegisteredParticipants',
      participantsCount
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
      resultsCount
    )

    setText(
      'reportRankingsGenerated',
      rankingsCount
    )

    setText(
      'reportPerformanceRecords',
      performanceCount
    )

    eventIntelligenceModal.show()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      error.message
    )

  } finally {

    showLoading(false)
  }
}

/* ==========================================
   EXPORTS
========================================== */

function exportCsv() {

  const headers = [

    'Event Code',
    'Event Name',
    'Category',
    'County',
    'Organizer',
    'Start Date',
    'End Date',
    'Status'

  ]

  const rows =
    filteredEventReportData.map(
      event => [

        event.event_code,

        event.events?.event_name,

        event
          .event_category_master
          ?.category_name,

        event
          .county_master
          ?.county_name,

        event.organizer,

        event.start_date,

        event.end_date,

        event
          .status_master
          ?.status_name
      ]
    )

  const csvContent =
    [
      headers,
      ...rows
    ]
      .map(
        row =>
          row.join(',')
      )
      .join('\n')

  const blob =
    new Blob(
      [csvContent],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    )

  const url =
    URL.createObjectURL(
      blob
    )

  const link =
    document.createElement(
      'a'
    )

  link.href =
    url

  link.download =
    'event-report.csv'

  link.click()

  URL.revokeObjectURL(
    url
  )
}

function exportExcel() {

  exportCsv()
}

function printReport() {

  window.print()
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

  document
    .querySelectorAll(
      'th.sortable'
    )
    .forEach(
      header => {

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
    )
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

    eventIntelligenceModal =
      new coreui.Modal(
        modalElement
      )
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

    renderTable()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      error.message
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeEventReport
)