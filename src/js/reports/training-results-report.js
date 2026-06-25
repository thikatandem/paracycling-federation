// =====================================================
// TRAINING RESULTS REPORT
// =====================================================

import {
  supabase
}
from '../core/supabase/supabaseClient.js'

import {
  getValue,
  setText,
  setHtml,
  on,
  replaceOptions,
  get
}
from '../core/domService.js'

import {
  calculateAverage,
  calculateTotal,
  attendancePercentage
}
from '../core/calculationService.js'

import {
  downloadCsv
}
from '../core/export/csvExport.js'
import {

  downloadExcelWorkbook,

  downloadPdf

}
from '../core/export/exportService.js'

import {
  getParticipantStatusBadge
}
from '../core/badgeService.js'

// =====================================================
// STATE
// =====================================================

let trainingRecords = []

let filteredTrainingRecords = []

let eventsLookup = []

let occurrencesLookup = []

let programsLookup = []

let countiesLookup = []

let statusesLookup = []

let currentTrainingPage = 1

const TRAINING_PAGE_SIZE =
  25
let participantAnalysisPage = 1

const PARTICIPANT_PAGE_SIZE =
  20


document.addEventListener(
  'DOMContentLoaded',
  initializeTrainingReport
)

function getPagedTrainingRecords() {

  const startIndex =

    (
      currentTrainingPage - 1
    ) *
    TRAINING_PAGE_SIZE

  const endIndex =

    startIndex +
    TRAINING_PAGE_SIZE

  return filteredTrainingRecords
    .slice(
      startIndex,
      endIndex
    )
}

function updateTrainingPagination() {

  const totalPages =

    Math.max(
      1,

      Math.ceil(
        filteredTrainingRecords.length /
        TRAINING_PAGE_SIZE
      )
    )

  setText(

    'trainingPaginationInfo',

    `Page ${currentTrainingPage} of ${totalPages}`
  )

  const previousButton =
    get(
  'btnPreviousTrainingPage'
)

  const nextButton =
    get(
  'btnNextTrainingPage'
)

  if (
    previousButton
  ) {

    previousButton.disabled =
      currentTrainingPage <= 1
  }

  if (
    nextButton
  ) {

    nextButton.disabled =

      currentTrainingPage >=
      totalPages
  }
}


function goToTrainingPage(
  page
) {

  const totalPages =

    Math.max(
      1,

      Math.ceil(
        filteredTrainingRecords.length /
        TRAINING_PAGE_SIZE
      )
    )

  currentTrainingPage =

    Math.max(
      1,

      Math.min(
        page,
        totalPages
      )
    )

  renderTrainingTable()

  updateTrainingPagination()
}

function nextTrainingPage() {

  goToTrainingPage(
    currentTrainingPage + 1
  )
}

function previousTrainingPage() {

  goToTrainingPage(
    currentTrainingPage - 1
  )
}


function buildAttendanceIntelligence() {

  const weeks = {}

  filteredTrainingRecords.forEach(
    record => {

      const week =

        record.training_week ||
        'Unknown'

      if (
        !weeks[week]
      ) {

        weeks[week] = {

          sessions: 0,

          attendance: 0
        }
      }

      weeks[week]
        .sessions++

      if (
        record.attendance
      ) {

        weeks[week]
          .attendance++
      }
    }
  )

  const results =

    Object.entries(
      weeks
    ).map(
      ([week, stat]) => ({

        week,

        percentage:

          stat.sessions

            ?

            (
              stat.attendance /
              stat.sessions
            ) * 100

            :

            0
      })
    )

  results.sort(
    (
      a,
      b
    ) =>

      Number(
        a.week
      ) -

      Number(
        b.week
      )
  )

  let html = `
    <table
      class="table"
    >
      <thead>
        <tr>
          <th>Week</th>
          <th>Attendance %</th>
        </tr>
      </thead>
      <tbody>
  `

  results.forEach(
    row => {

      html += `
        <tr>
          <td>${row.week}</td>
          <td>
            ${row.percentage.toFixed(
              1
            )}%
          </td>
        </tr>
      `
    }
  )

  html += `
      </tbody>
    </table>
  `

  setHtml(
    'attendanceIntelligenceContainer',
    html
  )

  return results
}


function buildPerformanceCorrelation() {

  const correlations = []

  filteredTrainingRecords.forEach(
    record => {

      const performance =
        record.performance?.[0]

      if (
        !performance
      ) {

        return
      }

      correlations.push({

        participant:

          record
            ?.participant_instances
            ?.participant_registry
            ?.display_name ||

          'Unknown',

        attendance:

          record.attendance
            ? 100
            : 0,

        speed:

          Number(
            performance.avg_speed_kmh || 0
          ),

        watts:

          Number(
            performance.avg_watts || 0
          ),

        tss:

          Number(
            performance.training_stress_score || 0
          )
      })
    }
  )

  let html = `
    <table
      class="table table-striped"
    >
      <thead>
        <tr>
          <th>Participant</th>
          <th>Attendance</th>
          <th>Speed</th>
          <th>Watts</th>
          <th>TSS</th>
        </tr>
      </thead>
      <tbody>
  `

  correlations.forEach(
    row => {

      html += `
        <tr>
          <td>${row.participant}</td>
          <td>${row.attendance}%</td>
          <td>${row.speed}</td>
          <td>${row.watts}</td>
          <td>${row.tss}</td>
        </tr>
      `
    }
  )

  html += `
      </tbody>
    </table>
  `

  setHtml(
    'performanceCorrelationContainer',
    html
  )

  return correlations
}






async function initializeTrainingReport() {

  try {

    bindEvents()

    await loadLookups()

    await loadTrainingRecords()

    applyTrainingFilters()

  } catch (error) {

    console.error(error)

    showError(
      'Failed to initialize training report'
    )
  }
}
function bindEvents() {

  on(
    'btnRefreshTrainingReport',
    'click',
    async () => {

      await loadTrainingRecords()

      applyTrainingFilters()
    }
  )

on(
  'filterEventId',
  'change',
  handleEventFilterChange
)

on(
  'filterProgramId',
  'change',
  handleProgramFilterChange
)


on(
  'filterOccurrenceId',
  'change',
  handleOccurrenceFilterChange
)


on(
  'filterCountyId',
  'change',
  applyTrainingFilters
)

on(
  'filterStatusId',
  'change',
  applyTrainingFilters
)

on(
  'filterStartDate',
  'change',
  applyTrainingFilters
)

on(
  'filterEndDate',
  'change',
  applyTrainingFilters
)


  on(
    'btnApplyTrainingReportFilters',
    'click',
    applyTrainingFilters
  )

  on(
    'btnClearTrainingReportFilters',
    'click',
    clearFilters
  )

on(
  'btnPreviousTrainingPage',
  'click',
  previousTrainingPage
)

on(
  'btnNextTrainingPage',
  'click',
  nextTrainingPage
)

  on(
    'btnExportTrainingCsv',
    'click',
    exportTrainingCsv
  )

  on(
  'btnExportTrainingExcel',
  'click',
  exportTrainingExcel
)

on(
  'btnExportTrainingPdf',
  'click',
  exportTrainingPdf
)   


  on(
  'searchParticipantAnalysis',
  'input',
  buildParticipantAnalysis
)
}
async function loadLookups() {

  const [
  eventsResponse,
  occurrencesResponse,
  programsResponse,
  countiesResponse,
  statusesResponse
] = await Promise.all([

  supabase
    .from('events')
    .select('*')
    .order(
      'event_name'
    ),
  supabase
  .from('event_instances')
  .select(`
    event_instance_id,
    event_id,
    event_area
  `)
  .order(
    'event_area'
  ),

  supabase
    .from('event_programs')
    .select('*')
    .order(
      'program_name'
    ),

  supabase
    .from('county_master')
    .select('*')
    .order(
      'county_name'
    ),

  supabase
    .from('status_master')
    .select('*')
    .order(
      'status_name'
    )
])

programsLookup =
  programsResponse.data || []



  eventsLookup =
    eventsResponse.data || []

occurrencesLookup =
  occurrencesResponse.data || []

  countiesLookup =
    countiesResponse.data || []

  statusesLookup =
    statusesResponse.data || []

  replaceOptions({

    selectId:
      'filterEventId',

    placeholder:
      'All Events',

    options:
      eventsLookup.map(
        event => ({
          value:
            event.event_id,

          text:
            event.event_name
        })
      )
  })

replaceOptions({

  selectId:
    'filterOccurrenceId',

  placeholder:
    'All Occurrences',

  options: []
})


replaceOptions({

  selectId:
    'filterProgramId',

  placeholder:
    'All Programs',

  options:
    programsLookup.map(
      program => ({
        value:
          program.program_id,

        text:
          program.program_name
      })
    )
})

  replaceOptions({

    selectId:
      'filterCountyId',

    placeholder:
      'All Counties',

    options:
      countiesLookup.map(
        county => ({
          value:
            county.county_id,

          text:
            county.county_name
        })
      )
  })

  replaceOptions({

    selectId:
      'filterStatusId',

    placeholder:
      'All Statuses',

    options:
      statusesLookup.map(
        status => ({
          value:
            status.status_id,

          text:
            status.status_name
        })
      )
  })
}


function handleEventFilterChange() {

  const eventId =
    getValue(
      'filterEventId'
    )

  if (!eventId) {

    replaceOptions({

      selectId:
        'filterOccurrenceId',

      placeholder:
        'All Occurrences',

      options: []
    })

    replaceOptions({

      selectId:
        'filterProgramId',

      placeholder:
        'All Programs',

      options:
        programsLookup.map(
          program => ({
            value:
              program.program_id,

            text:
              program.program_name
          })
        )
    })

    replaceOptions({

      selectId:
        'filterCountyId',

      placeholder:
        'All Counties',

      options:
        countiesLookup.map(
          county => ({
            value:
              county.county_id,

            text:
              county.county_name
          })
        )
    })

    applyTrainingFilters()

    return
  }

  const occurrenceMap =
    new Map()

  const programMap =
    new Map()

  const countyMap =
    new Map()

const statusMap =
  new Map()


  trainingRecords.forEach(
    record => {

      if (
        record.event_id !==
        eventId
      ) {
        return
      }

      const occurrence =
        record.event_instances

      if (
        occurrence?.event_instance_id
      ) {

        occurrenceMap.set(
          occurrence.event_instance_id,
          occurrence
        )
      }

      const program =
        record.event_programs

      if (
        program?.program_id
      ) {

        programMap.set(
          program.program_id,
          program
        )
      }

      const county =
        occurrence?.county_master

      if (
        county?.county_id
      ) {

        countyMap.set(
          county.county_id,
          county
        )
      }

const statusId =
  record
    ?.participant_instances
    ?.participant_status_id

const status =
  statusesLookup.find(
    s =>
      s.status_id ===
      statusId
  )

if (
  status?.status_id
) {

  statusMap.set(
    status.status_id,
    status
  )
}
    }
  )
  



  replaceOptions({

    selectId:
      'filterOccurrenceId',

    placeholder:
      'All Occurrences',

    options:
      [...occurrenceMap.values()]
        .map(
          occurrence => ({
            value:
              occurrence.event_instance_id,

            text:
              occurrence.event_area
          })
        )
  })

  replaceOptions({

    selectId:
      'filterProgramId',

    placeholder:
      'All Programs',

    options:
      [...programMap.values()]
        .map(
          program => ({
            value:
              program.program_id,

            text:
              program.program_name
          })
        )
  })

  replaceOptions({

    selectId:
      'filterCountyId',

    placeholder:
      'All Counties',

    options:
      [...countyMap.values()]
        .map(
          county => ({
            value:
              county.county_id,

            text:
              county.county_name
          })
        )
  })


replaceOptions({

  selectId:
    'filterStatusId',

  placeholder:
    'All Statuses',

  options:
    [...statusMap.values()]
      .map(
        status => ({
          value:
            status.status_id,

          text:
            status.status_name
        })
      )
})

  applyTrainingFilters()
}

function handleOccurrenceFilterChange() {

  const occurrenceId =
    getValue(
      'filterOccurrenceId'
    )

  const programMap =
    new Map()

  trainingRecords.forEach(
    record => {

      if (
        record.event_instance_id ===
        occurrenceId
      ) {

        const program =
          record.event_programs

        if (
          program?.program_id
        ) {

          programMap.set(
            program.program_id,
            program
          )
        }
      }
    }
  )

  replaceOptions({

    selectId:
      'filterProgramId',

    placeholder:
      'All Programs',

    options:
      [...programMap.values()]
        .map(
          program => ({
            value:
              program.program_id,

            text:
              program.program_name
          })
        )
  })
applyTrainingFilters()

}



function handleProgramFilterChange() {

  const eventId =
    getValue(
      'filterEventId'
    )

  const occurrenceId =
    getValue(
      'filterOccurrenceId'
    )

  const programId =
    getValue(
      'filterProgramId'
    )

  const countyMap =
    new Map()

  trainingRecords.forEach(
    record => {

      if (
        eventId &&
        record.event_id !==
        eventId
      ) {
        return
      }

      if (
        occurrenceId &&
        record.event_instance_id !==
        occurrenceId
      ) {
        return
      }

      if (
        programId &&
        record.event_programs
          ?.program_id !==
        programId
      ) {
        return
      }

      const county =
        record.event_instances
          ?.county_master

      if (
        county?.county_id
      ) {

        countyMap.set(
          county.county_id,
          county
        )
      }
    }
  )

  replaceOptions({

    selectId:
      'filterCountyId',

    placeholder:
      'All Counties',

    options:
      [...countyMap.values()]
        .map(
          county => ({
            value:
              county.county_id,

            text:
              county.county_name
          })
        )
  })

  applyTrainingFilters()
}

async function loadTrainingRecords() {



  const {
    data,
    error
  } = await supabase

    .from(
      'training_log'
    )

    .select(`
  *,
  participant_instances(
    participant_instance_id,
    participant_status_id,

    participant_registry(
      participant_ref_id,
      display_name,
      source_id,

      participant_type_master(
        participant_type_code
      )
    )
  ),

  event_instances(
  event_instance_id,
  event_area,
  start_date,
  end_date,
  start_time,
  end_time,

  county_master(
    county_id,
    county_name
  ),

  town_master(
    town_id,
    town_name
  ),

  events(
    event_id,
    event_name
  )
),
  event_programs(
    program_id,
    program_name
  ),

  performance(
    performance_id,
    participant_instance_id,
    avg_speed_kmh,
    avg_watts,
    normalized_power,
    training_stress_score
  )
`)
    .order(
      'training_date',
      {
        ascending:false
      }
    )
if (error) {

  console.error(
    'TRAINING REPORT QUERY ERROR',
    error
  )

  throw error
}

  trainingRecords =
    data || []

console.table(
  trainingRecords.map(
    r => ({
      training_id: r.training_id,
      hasEventInstance: !!r.event_instances,
      hasEvent: !!r.event_instances?.events,
      hasProgram: !!r.event_programs,
      hasParticipant: !!r.participant_instances
    })
  )
)

console.log(
  'TRAINING RECORD COUNT',
  trainingRecords.length
)

console.log(
  'FIRST RECORD',
  JSON.stringify(
    trainingRecords[0],
    null,
    2
  )
)

}
function applyTrainingFilters() {

  filteredTrainingRecords =
    [...trainingRecords]

  const eventId =
    getValue(
      'filterEventId'
    )

  if (eventId) {

  filteredTrainingRecords =
    filteredTrainingRecords.filter(
      record =>
        record.event_id ===
        eventId
    )
}


  const programId =
    getValue(
      'filterProgramId'
    )

  if (programId) {

    filteredTrainingRecords =
      filteredTrainingRecords.filter(
        record =>
          record.event_programs
            ?.program_id ===
          programId
      )
  }

  const countyId =
    getValue(
      'filterCountyId'
    )

  if (countyId) {

    filteredTrainingRecords =
      filteredTrainingRecords.filter(
        record =>
          record.event_instances
            ?.county_master
            ?.county_id ===
          countyId
      )
  }

  const statusId =
    getValue(
      'filterStatusId'
    )

  if (statusId) {

    filteredTrainingRecords =
      filteredTrainingRecords.filter(
        record =>
          record
            ?.participant_instances
            ?.participant_status_id ===
          statusId
      )
  }

  const startDate =
    getValue(
      'filterStartDate'
    )

  if (startDate) {

    filteredTrainingRecords =
      filteredTrainingRecords.filter(
        record =>
          record.training_date >=
          startDate
      )
  }

  const endDate =
    getValue(
      'filterEndDate'
    )

  if (endDate) {

    filteredTrainingRecords =
      filteredTrainingRecords.filter(
        record =>
          record.training_date <=
          endDate
      )
  }

  buildSummaryCards()

  buildEventAnalysis()

  buildProgramAnalysis()

  buildParticipantAnalysis()

  buildCountyAnalysis()

  buildStatusAnalysis()

  buildWeeklyAnalysis()

  buildSessionTypeAnalysis()

  buildTrainingIntelligence()

  buildTopPerformers()

  buildRiskAnalysis()

  buildCountyRankings()

  buildProgramEffectiveness()

  buildTrainingLoadAnalysis()

  buildAttendanceIntelligence()

  buildPerformanceCorrelation()

  buildRecommendations()

  buildExecutiveDashboard()

  currentTrainingPage = 1

  renderTrainingTable()

  updateTrainingPagination()


}

function showError(
  message
) {

  setText(
    'trainingReportError',
    message
  )

  document
    .getElementById(
      'trainingReportError'
    )
    ?.classList
    .remove(
      'd-none'
    )
}

function showSuccess(
  message
) {

  setText(
    'trainingReportSuccess',
    message
  )

  document
    .getElementById(
      'trainingReportSuccess'
    )
    ?.classList
    .remove(
      'd-none'
    )
}

function buildSummaryCards() {

  const totalSessions =
    filteredTrainingRecords.length

  const uniqueParticipants =
    new Set()

  const distanceValues = []

  const speedValues = []

  const durationValues = []

  const countyTotals = {}

  const weekTotals = {}

  let attendanceCount = 0

  filteredTrainingRecords.forEach(
    record => {

      const participantId =
        record
          ?.participant_instances
          ?.participant_registry
          ?.participant_ref_id

      if (
        participantId
      ) {

        uniqueParticipants.add(
          participantId
        )
      }

      const distance =
        Number(
          record.distance_km || 0
        )

      const speed =
        Number(
          record.avg_speed_kmh || 0
        )

      const duration =
        Number(
          record.duration_minutes || 0
        )

      distanceValues.push(
        distance
      )

      if (speed > 0) {

        speedValues.push(
          speed
        )
      }

      if (duration > 0) {

        durationValues.push(
          duration
        )
      }

      if (
        record.attendance
      ) {

        attendanceCount++
      }

      const countyName =
        record.event_instances
          ?.county_master
          ?.county_name

      if (
        countyName
      ) {

        countyTotals[
          countyName
        ] =
          (
            countyTotals[
              countyName
            ] || 0
          ) + 1
      }

      const week =
        record.training_week

      if (week) {

        weekTotals[
          week
        ] =
          (
            weekTotals[
              week
            ] || 0
          ) + 1
      }
    }
  )

  const attendance =
    totalSessions
      ? (
          attendanceCount /
          totalSessions
        ) * 100
      : 0

  const topCounty =
    Object.entries(
      countyTotals
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] - a[1]
      )[0]?.[0] || '-'

  const bestWeek =
    Object.entries(
      weekTotals
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] - a[1]
      )[0]?.[0] || '-'

  setText(
    'summaryTotalSessions',
    totalSessions
  )

  setText(
    'summaryParticipants',
    uniqueParticipants.size
  )

  setText(
    'summaryDistance',
    calculateTotal(
      distanceValues
    ).toFixed(2)
  )

  setText(
    'summaryAttendance',
    `${attendance.toFixed(1)}%`
  )

  setText(
    'summaryAverageSpeed',
    calculateAverage(
      speedValues
    )
  )

  setText(
    'summaryAverageDuration',
    calculateAverage(
      durationValues
    )
  )

  setText(
    'summaryBestWeek',
    bestWeek
  )

  setText(
    'summaryTopCounty',
    topCounty
  )
}

function buildProgramAnalysis() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const programName =
        record.event_programs
          ?.program_name ||
        'Unknown Program'

      if (
        !statistics[
          programName
        ]
      ) {

        statistics[
          programName
        ] = {

          sessions: 0,

          distance: 0,

          duration: 0,

          attendance: 0
        }
      }

      const stat =
        statistics[
          programName
        ]

      stat.sessions++

      stat.distance +=
        Number(
          record.distance_km || 0
        )

      stat.duration +=
        Number(
          record.duration_minutes || 0
        )

      if (
        record.attendance
      ) {

        stat.attendance++
      }
    }
  )

  let html = ''

  Object.entries(
    statistics
  ).forEach(
    ([programName, stat]) => {

      html += `
        <tr>
          <td>${programName}</td>
          <td>${stat.sessions}</td>
          <td>${stat.distance.toFixed(2)}</td>
          <td>${stat.duration}</td>
          <td>${(
            stat.attendance /
            stat.sessions *
            100
          ).toFixed(1)}%</td>
        </tr>
      `
    }
  )

  setHtml(
    'programAnalysisTableBody',
    html
  )
}

function buildParticipantAnalysis() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const participant =
        record
          ?.participant_instances
          ?.participant_registry

      const name =
        participant
          ?.display_name ||
        'Unknown Participant'

      if (
        !statistics[name]
      ) {

        statistics[name] = {

  participantRefId:
    participant
      ?.participant_ref_id,

  sessions: 0,

  distance: 0,

  duration: 0,

  attendance: 0,

  speeds: []
}
}
      const stat =
        statistics[name]

      stat.sessions++

      stat.distance +=
        Number(
          record.distance_km || 0
        )

      stat.duration +=
        Number(
          record.duration_minutes || 0
        )

      stat.speeds.push(
        Number(
          record.avg_speed_kmh || 0
        )
      )

      if (
        record.attendance
      ) {

        stat.attendance++
      }
    }
  )

  const search =
    getValue(
      'searchParticipantAnalysis'
    )
      .toLowerCase()
      .trim()

  let html = ''

  Object.entries(
    statistics
  )
    .filter(
      ([name]) =>
        name
          .toLowerCase()
          .includes(
            search
          )
    )
    .forEach(
      ([name, stat]) => {

        html += `
  <tr>

    <td>

      <button
        class="btn btn-sm btn-primary"
        onclick="
          viewParticipantTraining(
            '${stat.participantRefId}'
          )
        "
      >
        View
      </button>

    </td>

    <td>${name}</td>

    <td>${stat.sessions}</td>

    <td>${stat.distance.toFixed(2)}</td>

    <td>${stat.duration}</td>

    <td>${calculateAverage(stat.speeds)}</td>

    <td>
      ${(
        stat.attendance /
        stat.sessions *
        100
      ).toFixed(1)}%
    </td>

  </tr>
`
      }
    )

  setHtml(
    'participantAnalysisTableBody',
    html
  )
}

function buildCountyAnalysis() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const county =
        record.event_instances
          ?.county_master
          ?.county_name ||
        'Unknown'

      if (
        !statistics[
          county
        ]
      ) {

        statistics[
          county
        ] = {

          sessions: 0,

          distance: 0,

          participants:
            new Set()
        }
      }

      statistics[
        county
      ].sessions++

      statistics[
        county
      ].distance +=
        Number(
          record.distance_km || 0
        )

      const participantId =
        record
          ?.participant_instances
          ?.participant_registry
          ?.participant_ref_id

      if (
        participantId
      ) {

        statistics[
          county
        ].participants.add(
          participantId
        )
      }
    }
  )

  let html = ''

  Object.entries(
    statistics
  ).forEach(
    ([county, stat]) => {

      html += `
        <tr>
          <td>${county}</td>
          <td>${stat.sessions}</td>
          <td>${stat.participants.size}</td>
          <td>${stat.distance.toFixed(2)}</td>
        </tr>
      `
    }
  )

  setHtml(
    'countyAnalysisTableBody',
    html
  )
}

function buildStatusAnalysis() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const statusId =
        record
          ?.participant_instances
          ?.participant_status_id

      const status =
        statusesLookup.find(
          item =>
            item.status_id ===
            statusId
        )

      const statusName =
        status?.status_name ||
        'Unknown'

      statistics[
        statusName
      ] =
        (
          statistics[
            statusName
          ] || 0
        ) + 1
    }
  )

  const total =
    filteredTrainingRecords.length

  let html = ''

  Object.entries(
    statistics
  )
    .sort(
      (
        a,
        b
      ) =>
        b[1] - a[1]
    )
    .forEach(
      (
        [
          status,
          count
        ]
      ) => {

        const percentage =
          total
            ? (
                count /
                total
              ) * 100
            : 0

        html += `
          <tr>
            <td>${status}</td>
            <td>${count}</td>
            <td>${percentage.toFixed(1)}%</td>
          </tr>
        `
      }
    )

  setHtml(
    'statusAnalysisTableBody',
    html
  )
}

function buildWeeklyAnalysis() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const week =
        record.training_week ||
        'Unknown'

      if (
        !statistics[
          week
        ]
      ) {

        statistics[
          week
        ] = {

          sessions: 0,

          distance: 0,

          participants:
            new Set()
        }
      }

      statistics[
        week
      ].sessions++

      statistics[
        week
      ].distance +=
        Number(
          record.distance_km || 0
        )

      const participantId =
        record
          ?.participant_instances
          ?.participant_registry
          ?.participant_ref_id

      if (
        participantId
      ) {

        statistics[
          week
        ].participants.add(
          participantId
        )
      }
    }
  )

  let html = ''

  Object.entries(
    statistics
  )
    .sort()
    .forEach(
      (
        [
          week,
          stat
        ]
      ) => {

        html += `
          <tr>
            <td>${week}</td>
            <td>${stat.sessions}</td>
            <td>${stat.distance.toFixed(2)}</td>
            <td>${stat.participants.size}</td>
          </tr>
        `
      }
    )

  setHtml(
    'weeklyAnalysisTableBody',
    html
  )
}
function buildSessionTypeAnalysis() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const sessionType =
        record.session_type ||
        'Unknown'

      if (
        !statistics[
          sessionType
        ]
      ) {

        statistics[
          sessionType
        ] = {

          sessions: 0,

          distance: 0,

          duration: 0
        }
      }

      statistics[
        sessionType
      ].sessions++

      statistics[
        sessionType
      ].distance +=
        Number(
          record.distance_km || 0
        )

      statistics[
        sessionType
      ].duration +=
        Number(
          record.duration_minutes || 0
        )
    }
  )

  let html = ''

  Object.entries(
    statistics
  )
    .sort(
      (
        a,
        b
      ) =>
        b[1].sessions -
        a[1].sessions
    )
    .forEach(
      (
        [
          sessionType,
          stat
        ]
      ) => {

        html += `
          <tr>
            <td>${sessionType}</td>
            <td>${stat.sessions}</td>
            <td>${stat.distance.toFixed(2)}</td>
            <td>${stat.duration}</td>
          </tr>
        `
      }
    )

  setHtml(
    'sessionTypeAnalysisTableBody',
    html
  )
}

function buildEventAnalysis() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const eventId =
  record.event_id

      const eventName =
  eventsLookup.find(
    e =>
      e.event_id ===
      record.event_id
  )?.event_name ||
  'Unknown Event'


      if (
        !statistics[eventId]
      ) {

        statistics[eventId] = {

          eventId,

          eventName,

          sessions: 0,

          distance: 0,

          duration: 0,

          participants:
            new Set()
        }
      }

      const stat =
        statistics[eventId]

      stat.sessions++

      stat.distance +=
        Number(
          record.distance_km || 0
        )

      stat.duration +=
        Number(
          record.duration_minutes || 0
        )

      const participantId =
        record
          ?.participant_instances
          ?.participant_registry
          ?.participant_ref_id

      if (
        participantId
      ) {

        stat.participants.add(
          participantId
        )
      }
    }
  )

  let html = ''

  Object.values(
    statistics
  ).forEach(
    stat => {

      html += `
        <tr>
          <td>${stat.eventName}</td>
          <td>${stat.sessions}</td>
          <td>${stat.participants.size}</td>
          <td>${stat.distance.toFixed(2)}</td>
          <td>${stat.duration}</td>
          <td>
            <button
              class="btn btn-sm btn-primary"
              onclick="
                viewEventTraining(
                  '${stat.eventId}'
                )
              "
            >
              View
            </button>
          </td>
        </tr>
      `
    }
  )

  setHtml(
    'eventAnalysisTableBody',
    html
  )
}

async function viewEventTraining(
  eventId
) {

  try {

    const records =
      filteredTrainingRecords.filter(
        record =>
          record.event_id ===
          eventId
      )

    if (!records.length) {

      showError(
        'No event records found'
      )

      return
    }




    const eventName =
      records[0]
        ?.event_instances
        ?.events
        ?.event_name

    const participants =
      new Set()

    const programs =
      new Set()

    const counties =
      new Set()

    let distance = 0

    let attendance = 0

    let bestSpeed = 0

    records.forEach(
      record => {

        participants.add(
          record
            ?.participant_instances
            ?.participant_registry
            ?.participant_ref_id
        )

        programs.add(
          record.program_id
        )

        counties.add(
          record.event_instances
            ?.county_master
            ?.county_name
        )

        distance +=
          Number(
            record.distance_km || 0
          )

        if (
          record.attendance
        ) {

          attendance++
        }

        bestSpeed =
          Math.max(
            bestSpeed,
            Number(
              record.avg_speed_kmh || 0
            )
          )
      }
    )

    setHtml(
      'trainingInsightsContainer',

      `
      <h4>${eventName}</h4>

      <table class="table table-bordered">

        <tr>
          <th>Participants</th>
          <td>${participants.size}</td>
        </tr>

        <tr>
          <th>Programs</th>
          <td>${programs.size}</td>
        </tr>

        <tr>
          <th>Counties</th>
          <td>${counties.size}</td>
        </tr>

        <tr>
          <th>Distance</th>
          <td>${distance.toFixed(2)}</td>
        </tr>

        <tr>
          <th>Attendance</th>
          <td>
            ${(
              attendance /
              records.length *
              100
            ).toFixed(1)}%
          </td>
        </tr>

        <tr>
          <th>Best Session Speed</th>
          <td>${bestSpeed}</td>
        </tr>

      </table>
      `
    )

    new coreui.Modal(
      document.getElementById(
        'trainingInsightsModal'
      )
    ).show()

  } catch (error) {

    console.error(error)

    showError(
      'Failed to load event intelligence'
    )
  }
}

function clearFilters() {

  document.getElementById(
    'filterEventId'
  ).value = ''

  document.getElementById(
    'filterProgramId'
  ).value = ''

  document.getElementById(
    'filterCountyId'
  ).value = ''

  document.getElementById(
    'filterStatusId'
  ).value = ''

  document.getElementById(
    'filterStartDate'
  ).value = ''

  document.getElementById(
    'filterEndDate'
  ).value = ''

  document.getElementById(
    'searchParticipantAnalysis'
  ).value = ''

  filteredTrainingRecords =
    [...trainingRecords]

  applyTrainingFilters()
}



async function viewParticipantTraining(
  participantRefId
) {

  try {

    const records =
      filteredTrainingRecords.filter(
        record =>
          record
            ?.participant_instances
            ?.participant_registry
            ?.participant_ref_id ===
          participantRefId
      )

    if (!records.length) {

      showError(
        'Participant training records not found'
      )

      return
    }

    const participant =
      records[0]
        ?.participant_instances
        ?.participant_registry

    const events =
      new Set()

    const programs =
      new Set()

    const counties =
      new Set()

    const speeds = []

    const watts = []

    const powers = []

    const tssValues = []

    let totalDistance = 0

    let totalDuration = 0

    let attendance = 0

    records.forEach(
      record => {

        totalDistance +=
          Number(
            record.distance_km || 0
          )

        totalDuration +=
          Number(
            record.duration_minutes || 0
          )

        if (
          record.attendance
        ) {

          attendance++
        }

        const speed =
          Number(
            record.avg_speed_kmh || 0
          )

        if (speed > 0) {

          speeds.push(
            speed
          )
        }

        const performance =
          record.performance?.[0]

        if (performance) {

          if (
            performance.avg_watts
          ) {

            watts.push(
              Number(
                performance.avg_watts
              )
            )
          }

          if (
            performance.normalized_power
          ) {

            powers.push(
              Number(
                performance.normalized_power
              )
            )
          }

          if (
            performance.training_stress_score
          ) {

            tssValues.push(
              Number(
                performance.training_stress_score
              )
            )
          }
        }

        events.add(
          record.event_instances
            ?.events
            ?.event_name
        )

        programs.add(
          record.event_programs
            ?.program_name
        )

        counties.add(
          record.event_instances
            ?.county_master
            ?.county_name
        )
      }
    )

    setHtml(
      'trainingInsightsContainer',

      `
      <h4>
        ${participant?.display_name || '-'}
      </h4>

      <table class="table table-bordered">

        <tr>
          <th>Sessions</th>
          <td>${records.length}</td>
        </tr>

        <tr>
          <th>Distance KM</th>
          <td>${totalDistance.toFixed(2)}</td>
        </tr>

        <tr>
          <th>Duration Minutes</th>
          <td>${totalDuration}</td>
        </tr>

        <tr>
          <th>Attendance %</th>
          <td>
            ${(
              attendance /
              records.length *
              100
            ).toFixed(1)}%
          </td>
        </tr>

        <tr>
          <th>Average Speed</th>
          <td>
            ${calculateAverage(
              speeds
            )}
          </td>
        </tr>

        <tr>
          <th>Average Watts</th>
          <td>
            ${calculateAverage(
              watts
            )}
          </td>
        </tr>

        <tr>
          <th>Normalized Power</th>
          <td>
            ${calculateAverage(
              powers
            )}
          </td>
        </tr>

        <tr>
          <th>Training Stress Score</th>
          <td>
            ${calculateAverage(
              tssValues
            )}
          </td>
        </tr>

        <tr>
          <th>Events</th>
          <td>${events.size}</td>
        </tr>

        <tr>
          <th>Programs</th>
          <td>${programs.size}</td>
        </tr>

        <tr>
          <th>Counties</th>
          <td>${counties.size}</td>
        </tr>

      </table>
      `
    )

    new coreui.Modal(
      document.getElementById(
        'trainingInsightsModal'
      )
    ).show()

  } catch (error) {

    console.error(error)

    showError(
      'Failed to load participant intelligence'
    )
  }
}

function viewTrainingInsight(
  eventId
) {

  viewEventTraining(
    eventId
  )
}

function buildTrainingIntelligence() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const participant =
        record
          ?.participant_instances
          ?.participant_registry

      const name =
        participant
          ?.display_name

      if (!name) {

        return
      }

      if (
        !statistics[name]
      ) {

       statistics[name] = {

  participantRefId:
    participant
      ?.participant_ref_id,

  sessions: 0,

  distance: 0,

  duration: 0,

  attendance: 0,

  speeds: []
}
      }

      const stat =
        statistics[name]

      stat.sessions++

      stat.distance +=
        Number(
          record.distance_km || 0
        )

      if (
        record.attendance
      ) {

        stat.attendance++
      }

      stat.speeds.push(
        Number(
          record.avg_speed_kmh || 0
        )
      )
    }
  )

  return Object.entries(
    statistics
  ).map(
    ([name, stat]) => {

      const attendanceScore =
        (
          stat.attendance /
          stat.sessions
        ) * 30

      const distanceScore =
        Math.min(
          stat.distance / 10,
          20
        )

      const sessionScore =
        Math.min(
          stat.sessions,
          20
        )

      const speedScore =
        Math.min(
          calculateAverage(
            stat.speeds
          ),
          15
        )

      const score =
        attendanceScore +
        distanceScore +
        sessionScore +
        speedScore

      return {

        participant:
          name,

        score:
          score.toFixed(0)
      }
    }
  )
}

function buildTopPerformers() {

  const intelligence =
    buildTrainingIntelligence()

  intelligence.sort(
    (a, b) =>
      Number(b.score) -
      Number(a.score)
  )

  const topFive =
    intelligence.slice(
      0,
      5
    )

  let html = `
    <table
      class="table table-striped"
    >

      <thead>

        <tr>
          <th>Rank</th>
          <th>Participant</th>
          <th>Score</th>
        </tr>

      </thead>

      <tbody>
  `

  topFive.forEach(
    (
      athlete,
      index
    ) => {

      html += `
        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${athlete.participant}
          </td>

          <td>
            ${athlete.score}
          </td>

        </tr>
      `
    }
  )

  html += `
      </tbody>

    </table>
  `

  setHtml(
    'topPerformersContainer',
    html
  )
}
function buildRiskAnalysis() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const participant =
        record
          ?.participant_instances
          ?.participant_registry

      const participantRefId =
        participant
          ?.participant_ref_id

      const participantName =
        participant
          ?.display_name

      if (
        !participantRefId
      ) {

        return
      }

      if (
        !statistics[
          participantRefId
        ]
      ) {

        statistics[
          participantRefId
        ] = {

          participantName,

          sessions: 0,

          attendance: 0
        }
      }

      statistics[
        participantRefId
      ].sessions++

      if (
        record.attendance
      ) {

        statistics[
          participantRefId
        ].attendance++
      }
    }
  )

  const riskRecords =

    Object.values(
      statistics
    ).map(
      participant => {

        const attendanceRate =

          participant.sessions

            ?

            (
              participant.attendance /
              participant.sessions
            ) * 100

            :

            0

        let riskLevel =
          'LOW'

        if (
          attendanceRate < 50
        ) {

          riskLevel =
            'HIGH'
        }

        else if (
          attendanceRate < 75
        ) {

          riskLevel =
            'MEDIUM'
        }

        return {

          participant:
            participant.participantName,

          attendanceRate,

          riskLevel
        }
      }
    )

  riskRecords.sort(
    (
      a,
      b
    ) =>
      a.attendanceRate -
      b.attendanceRate
  )

  let html = `

    <table
      class="table table-striped"
    >

      <thead>

        <tr>

          <th>
            Participant
          </th>

          <th>
            Attendance %
          </th>

          <th>
            Risk
          </th>

        </tr>

      </thead>

      <tbody>

  `

  riskRecords.forEach(
    record => {

      let badgeClass =
        'success'

      if (
        record.riskLevel ===
        'HIGH'
      ) {

        badgeClass =
          'danger'
      }

      else if (
        record.riskLevel ===
        'MEDIUM'
      ) {

        badgeClass =
          'warning'
      }

      html += `

        <tr>

          <td>
            ${record.participant}
          </td>

          <td>
            ${record.attendanceRate.toFixed(1)}%
          </td>

          <td>

            <span
              class="
                badge
                bg-${badgeClass}
              "
            >

              ${record.riskLevel}

            </span>

          </td>

        </tr>

      `
    }
  )

  html += `

      </tbody>

    </table>

  `

  setHtml(
    'riskAnalysisContainer',
    html
  )

  return riskRecords
}



function buildCountyRankings() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const countyId =
        record
          ?.event_instances
          ?.county_master
          ?.county_id

      const countyName =
        record
          ?.event_instances
          ?.county_master
          ?.county_name

      if (
        !countyId
      ) {

        return
      }

      if (
        !statistics[
          countyId
        ]
      ) {

        statistics[
          countyId
        ] = {

          countyId,

          countyName,

          sessions: 0,

          distance: 0,

          attendance: 0,

          participants:
            new Set()
        }
      }

      statistics[
        countyId
      ].sessions++

      statistics[
        countyId
      ].distance +=

        Number(
          record.distance_km || 0
        )

      if (
        record.attendance
      ) {

        statistics[
          countyId
        ].attendance++
      }

      const participantRefId =

        record
          ?.participant_instances
          ?.participant_registry
          ?.participant_ref_id

      if (
        participantRefId
      ) {

        statistics[
          countyId
        ].participants.add(
          participantRefId
        )
      }
    }
  )

  const rankings =

    Object.values(
      statistics
    ).map(
      county => {

        const attendanceRate =

          county.sessions

            ?

            (
              county.attendance /
              county.sessions
            ) * 100

            :

            0

        const participantCount =

          county.participants
            .size

        const score =

          (
            participantCount * 30
          ) +

          (
            attendanceRate * 0.4
          ) +

          (
            county.distance * 0.1
          )

        return {

          countyId:
            county.countyId,

          countyName:
            county.countyName,

          participants:
            participantCount,

          sessions:
            county.sessions,

          distance:
            county.distance,

          attendanceRate,

          score
        }
      }
    )

  rankings.sort(
    (
      a,
      b
    ) =>
      b.score -
      a.score
  )

  let html = `

    <table
      class="table table-striped"
    >

      <thead>

        <tr>

          <th>
            Rank
          </th>

          <th>
            County
          </th>

          <th>
            Participants
          </th>

          <th>
            Sessions
          </th>

          <th>
            Distance
          </th>

          <th>
            Attendance %
          </th>

          <th>
            Score
          </th>

        </tr>

      </thead>

      <tbody>

  `

  rankings.forEach(
    (
      county,
      index
    ) => {

      html += `

        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${county.countyName}
          </td>

          <td>
            ${county.participants}
          </td>

          <td>
            ${county.sessions}
          </td>

          <td>
            ${county.distance.toFixed(2)}
          </td>

          <td>
            ${county.attendanceRate.toFixed(1)}%
          </td>

          <td>
            ${county.score.toFixed(0)}
          </td>

        </tr>

      `
    }
  )

  html += `

      </tbody>

    </table>

  `

  setHtml(
    'countyRankingsContainer',
    html
  )

  return rankings
}


function buildProgramEffectiveness() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const programId =
        record
          ?.event_programs
          ?.program_id

      const programName =
        record
          ?.event_programs
          ?.program_name

      if (
        !programId
      ) {

        return
      }

      if (
        !statistics[
          programId
        ]
      ) {

        statistics[
          programId
        ] = {

          programId,

          programName,

          sessions: 0,

          attendance: 0,

          distance: 0,

          speeds: [],

          participants:
            new Set()
        }
      }

      statistics[
        programId
      ].sessions++

      if (
        record.attendance
      ) {

        statistics[
          programId
        ].attendance++
      }

      statistics[
        programId
      ].distance +=

        Number(
          record.distance_km || 0
        )

      const speed =
        Number(
          record.avg_speed_kmh || 0
        )

      if (
        speed > 0
      ) {

        statistics[
          programId
        ].speeds.push(
          speed
        )
      }

      const participantRefId =

        record
          ?.participant_instances
          ?.participant_registry
          ?.participant_ref_id

      if (
        participantRefId
      ) {

        statistics[
          programId
        ].participants.add(
          participantRefId
        )
      }
    }
  )

  const programs =

    Object.values(
      statistics
    ).map(
      program => {

        const attendanceRate =

          program.sessions

            ?

            (
              program.attendance /
              program.sessions
            ) * 100

            :

            0

        const avgSpeed =

          calculateAverage(
            program.speeds
          )

        const participantCount =

          program.participants
            .size

        const effectiveness =

          (
            attendanceRate * 0.4
          ) +

          (
            avgSpeed * 0.2
          ) +

          (
            program.distance * 0.1
          ) +

          (
            participantCount * 5
          )

        return {

          programId:
            program.programId,

          programName:
            program.programName,

          sessions:
            program.sessions,

          participants:
            participantCount,

          distance:
            program.distance,

          attendanceRate,

          avgSpeed,

          effectiveness
        }
      }
    )

  programs.sort(
    (
      a,
      b
    ) =>
      b.effectiveness -
      a.effectiveness
  )

  let html = `

    <table
      class="table table-striped"
    >

      <thead>

        <tr>

          <th>
            Rank
          </th>

          <th>
            Program
          </th>

          <th>
            Sessions
          </th>

          <th>
            Participants
          </th>

          <th>
            Attendance %
          </th>

          <th>
            Distance
          </th>

          <th>
            Avg Speed
          </th>

          <th>
            Effectiveness
          </th>

          <th>
            Actions
          </th>

        </tr>

      </thead>

      <tbody>

  `

  programs.forEach(
    (
      program,
      index
    ) => {

      html += `

        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${program.programName}
          </td>

          <td>
            ${program.sessions}
          </td>

          <td>
            ${program.participants}
          </td>

          <td>
            ${program.attendanceRate.toFixed(1)}%
          </td>

          <td>
            ${program.distance.toFixed(2)}
          </td>

          <td>
            ${Number(
              program.avgSpeed || 0
            ).toFixed(2)}
          </td>

          <td>

            ${program.effectiveness.toFixed(0)}

          </td>

          <td>

            <button
              class="
                btn
                btn-sm
                btn-primary
              "
              onclick="
                viewProgramTraining(
                  '${program.programId}'
                )
              "
            >

              View

            </button>

          </td>

        </tr>

      `
    }
  )

  html += `

      </tbody>

    </table>

  `

  setHtml(
    'programEffectivenessContainer',
    html
  )

  return programs
}

async function viewProgramTraining(
  programId
) {

  try {

    const records =
      filteredTrainingRecords.filter(
        record =>
          record
            ?.event_programs
            ?.program_id ===
          programId
      )

    if (
      !records.length
    ) {

      showError(
        'Program records not found'
      )

      return
    }

    const programName =
      records[0]
        ?.event_programs
        ?.program_name ||
      'Unknown Program'

    const participants =
      new Set()

    const events =
      new Set()

    const counties =
      new Set()

    const speeds = []

    const watts = []

    const powers = []

    const tssValues = []

    let totalDistance = 0

    let totalDuration = 0

    let attendanceCount = 0

    records.forEach(
      record => {

        const participantRefId =
          record
            ?.participant_instances
            ?.participant_registry
            ?.participant_ref_id

        if (
          participantRefId
        ) {

          participants.add(
            participantRefId
          )
        }

        const eventName =
          record
            ?.event_instances
            ?.events
            ?.event_name

        if (
          eventName
        ) {

          events.add(
            eventName
          )
        }

        const countyName =
          record
            ?.event_instances
            ?.county_master
            ?.county_name

        if (
          countyName
        ) {

          counties.add(
            countyName
          )
        }

        totalDistance +=
          Number(
            record.distance_km || 0
          )

        totalDuration +=
          Number(
            record.duration_minutes || 0
          )

        if (
          record.attendance
        ) {

          attendanceCount++
        }

        const speed =
          Number(
            record.avg_speed_kmh || 0
          )

        if (
          speed > 0
        ) {

          speeds.push(
            speed
          )
        }

        const performance =
          record.performance?.[0]

        if (
          performance
        ) {

          if (
            performance.avg_watts
          ) {

            watts.push(
              Number(
                performance.avg_watts
              )
            )
          }

          if (
            performance.normalized_power
          ) {

            powers.push(
              Number(
                performance.normalized_power
              )
            )
          }

          if (
            performance.training_stress_score
          ) {

            tssValues.push(
              Number(
                performance.training_stress_score
              )
            )
          }
        }
      }
    )

    const attendanceRate =
      (
        attendanceCount /
        records.length
      ) * 100

    setHtml(
      'trainingInsightsContainer',

      `
      <h4>
        ${programName}
      </h4>

      <table
        class="
          table
          table-bordered
        "
      >

        <tr>
          <th>
            Sessions
          </th>

          <td>
            ${records.length}
          </td>
        </tr>

        <tr>
          <th>
            Participants
          </th>

          <td>
            ${participants.size}
          </td>
        </tr>

        <tr>
          <th>
            Events
          </th>

          <td>
            ${events.size}
          </td>
        </tr>

        <tr>
          <th>
            Counties
          </th>

          <td>
            ${counties.size}
          </td>
        </tr>

        <tr>
          <th>
            Distance KM
          </th>

          <td>
            ${totalDistance.toFixed(
              2
            )}
          </td>
        </tr>

        <tr>
          <th>
            Duration Minutes
          </th>

          <td>
            ${totalDuration}
          </td>
        </tr>

        <tr>
          <th>
            Attendance %
          </th>

          <td>
            ${attendanceRate.toFixed(
              1
            )}%
          </td>
        </tr>

        <tr>
          <th>
            Avg Speed
          </th>

          <td>
            ${calculateAverage(
              speeds
            )}
          </td>
        </tr>

        <tr>
          <th>
            Avg Watts
          </th>

          <td>
            ${calculateAverage(
              watts
            )}
          </td>
        </tr>

        <tr>
          <th>
            Normalized Power
          </th>

          <td>
            ${calculateAverage(
              powers
            )}
          </td>
        </tr>

        <tr>
          <th>
            Avg TSS
          </th>

          <td>
            ${calculateAverage(
              tssValues
            )}
          </td>
        </tr>

      </table>
      `
    )

    new coreui.Modal(
      document.getElementById(
        'trainingInsightsModal'
      )
    ).show()

  } catch (error) {

    console.error(
      error
    )

    showError(
      'Failed to load program intelligence'
    )
  }
}


function buildTrainingLoadAnalysis() {

  const loadSummary = {

    low: 0,

    medium: 0,

    high: 0
  }

  const participantLoads = {}

  filteredTrainingRecords.forEach(
    record => {

      const participant =
        record
          ?.participant_instances
          ?.participant_registry

      const participantRefId =
        participant
          ?.participant_ref_id

      const participantName =
        participant
          ?.display_name

      const tss =
        Number(
          record.performance?.[0]
            ?.training_stress_score || 0
        )

      if (
        tss < 50
      ) {

        loadSummary.low++
      }

      else if (
        tss < 100
      ) {

        loadSummary.medium++
      }

      else {

        loadSummary.high++
      }

      if (
        !participantRefId
      ) {

        return
      }

      if (
        !participantLoads[
          participantRefId
        ]
      ) {

        participantLoads[
          participantRefId
        ] = {

          participantName,

          totalTss: 0,

          sessions: 0
        }
      }

      participantLoads[
        participantRefId
      ].totalTss += tss

      participantLoads[
        participantRefId
      ].sessions++
    }
  )

  const athleteLoads =

    Object.values(
      participantLoads
    ).map(
      participant => {

        const averageTss =

          participant.sessions

            ?

            participant.totalTss /
            participant.sessions

            :

            0

        let loadStatus =
          'Balanced'

        if (
          averageTss < 40
        ) {

          loadStatus =
            'Undertrained'
        }

        else if (
          averageTss > 100
        ) {

          loadStatus =
            'Overtrained'
        }

        return {

          participant:
            participant.participantName,

          averageTss,

          loadStatus
        }
      }
    )

  athleteLoads.sort(
    (
      a,
      b
    ) =>
      b.averageTss -
      a.averageTss
  )

  let html = `

    <div class="row mb-3">

      <div class="col-md-4">

        <div class="alert alert-success">

          <strong>
            Low Load
          </strong>

          <br>

          ${loadSummary.low}

        </div>

      </div>

      <div class="col-md-4">

        <div class="alert alert-warning">

          <strong>
            Medium Load
          </strong>

          <br>

          ${loadSummary.medium}

        </div>

      </div>

      <div class="col-md-4">

        <div class="alert alert-danger">

          <strong>
            High Load
          </strong>

          <br>

          ${loadSummary.high}

        </div>

      </div>

    </div>

    <table
      class="
        table
        table-striped
      "
    >

      <thead>

        <tr>

          <th>
            Participant
          </th>

          <th>
            Avg TSS
          </th>

          <th>
            Training Load
          </th>

        </tr>

      </thead>

      <tbody>

  `

  athleteLoads.forEach(
    athlete => {

      let badgeClass =
        'success'

      if (
        athlete.loadStatus ===
        'Overtrained'
      ) {

        badgeClass =
          'danger'
      }

      else if (
        athlete.loadStatus ===
        'Balanced'
      ) {

        badgeClass =
          'primary'
      }

      else {

        badgeClass =
          'warning'
      }

      html += `

        <tr>

          <td>
            ${athlete.participant}
          </td>

          <td>
            ${athlete.averageTss.toFixed(
              1
            )}
          </td>

          <td>

            <span
              class="
                badge
                bg-${badgeClass}
              "
            >

              ${athlete.loadStatus}

            </span>

          </td>

        </tr>

      `
    }
  )

  html += `

      </tbody>

    </table>

  `

  setHtml(
    'trainingLoadContainer',
    html
  )

  return {

    loadSummary,

    athleteLoads
  }
}


function renderTrainingTable() {

  const records =
    getPagedTrainingRecords()

  let html = ''

  records.forEach(
    record => {

      const participant =

        record
          ?.participant_instances
          ?.participant_registry
          ?.display_name ||

        '-'

      const eventName =

        record
          ?.event_instances
          ?.events
          ?.event_name ||

        '-'

      const programName =

        record
          ?.event_programs
          ?.program_name ||

        '-'

      const countyName =

        record
          ?.event_instances
          ?.county_master
          ?.county_name ||

        '-'

      html += `
        <td>${record.training_date || ''}</td>

<td>${record.training_week || ''}</td>

<td>${record.training_day || ''}</td>

<td>
  ${
    record.event_instances
      ?.events
      ?.event_name || ''
  }
</td>

<td>
  ${
    record.event_instances
      ?.event_area || ''
  }
</td>

<td>
  ${
    record.event_programs
      ?.program_name || ''
  }
</td>

<td>
  ${
    record.participant_instances
      ?.participant_registry
      ?.display_name || ''
  }
</td>

<td>
  ${
    record.event_instances
      ?.county_master
      ?.county_name || ''
  }
</td>

<td>
  ${
    record.event_instances
      ?.town_master
      ?.town_name || ''
  }
</td>

<td>${record.session_type || ''}</td>

<td>${record.start_time || ''}</td>

<td>${record.end_time || ''}</td>

<td>${record.distance_km ?? ''}</td>

<td>${record.duration_minutes ?? ''}</td>

<td>${record.avg_speed_kmh ?? ''}</td>

<td>
  ${
    record.attendance
      ? 'Present'
      : 'Absent'
  }
</td>

<td>
  ${
    record.indoor_session
      ? 'Yes'
      : 'No'
  }
</td>

<td>${record.notes || ''}</td>
      `
    }
  )

  setHtml(
    'trainingResultsTableBody',
    html
  )
}






function buildRecommendations() {

  const recommendations = []

  const risks =
    buildRiskAnalysis()

  const countyRankings =
    buildCountyRankings()

  const programEffectiveness =
    buildProgramEffectiveness()

  const attendance =
    buildAttendanceIntelligence()

  if (
    risks.length
  ) {

    const highRisk =

      risks.filter(
        item =>
          item.riskLevel ===
          'HIGH'
      )

    if (
      highRisk.length
    ) {

      recommendations.push(

        `${highRisk.length} participants are at high attendance risk.`
      )
    }
  }

  if (
    countyRankings.length
  ) {

    recommendations.push(

      `${countyRankings[0]?.countyName} currently leads federation training activity.`
    )
  }

  if (
    programEffectiveness.length
  ) {

    recommendations.push(

      `${programEffectiveness[0]?.programName} is the most effective training program.`
    )
  }

  if (
    attendance.length >= 2
  ) {

    const firstWeek =
      attendance[0]
        ?.percentage || 0

    const lastWeek =
      attendance[
        attendance.length - 1
      ]?.percentage || 0

    if (
      lastWeek < firstWeek
    ) {

      recommendations.push(

        'Attendance trend is declining and requires intervention.'
      )
    }

    else {

      recommendations.push(

        'Attendance trend is improving.'
      )
    }
  }

  recommendations.push(

    'Continue monitoring training load and attendance together.'
  )

  let html =

    '<ul class="list-group">'

  recommendations.forEach(
    recommendation => {

      html += `

        <li
          class="
            list-group-item
          "
        >

          ${recommendation}

        </li>

      `
    }
  )

  html +=
    '</ul>'

  setHtml(
    'recommendationsContainer',
    html
  )

  return recommendations
}

function buildExecutiveDashboard() {

  const totalSessions =
    filteredTrainingRecords.length

  const participants =
    new Set()

  let distance = 0

  filteredTrainingRecords.forEach(
    record => {

      const participantId =
        record
          ?.participant_instances
          ?.participant_registry
          ?.participant_ref_id

      if (
        participantId
      ) {

        participants.add(
          participantId
        )
      }

      distance +=
        Number(
          record.distance_km || 0
        )
    }
  )

  const countyRanking =
    buildCountyRankings()

  const intelligence =
    buildTrainingIntelligence()

  intelligence.sort(
    (
      a,
      b
    ) =>
      Number(
        b.score
      ) -
      Number(
        a.score
      )
  )

  const topParticipant =
    intelligence[0]

  setHtml(
    'executiveDashboardContainer',

    `
      <div class="row">

        <div class="col-md-3">

          <div class="card">

            <div class="card-body">

              <h5>
                Sessions
              </h5>

              <h2>
                ${totalSessions}
              </h2>

            </div>

          </div>

        </div>

        <div class="col-md-3">

          <div class="card">

            <div class="card-body">

              <h5>
                Participants
              </h5>

              <h2>
                ${participants.size}
              </h2>

            </div>

          </div>

        </div>

        <div class="col-md-3">

          <div class="card">

            <div class="card-body">

              <h5>
                Distance
              </h5>

              <h2>
                ${distance.toFixed(1)}
              </h2>

            </div>

          </div>

        </div>

        <div class="col-md-3">

          <div class="card">

            <div class="card-body">

              <h5>
                Top County
              </h5>

              <h2>
                ${
                  countyRanking[0]
                   ?.countyName ||
                  '-'
                }
              </h2>

            </div>

          </div>

        </div>

      </div>

      <hr>

      <p>

        <strong>
          Top Participant:
        </strong>

        ${
          topParticipant
            ?.participant || '-'
        }

      </p>
    `
  )
}


function exportTrainingCsv() {

  if (
    !filteredTrainingRecords.length
  ) {

    showError(
      'No training records available for export'
    )

    return
  }

  const rows =
  filteredTrainingRecords.map(
    record => ({

      training_date:
        record.training_date,

      training_week:
        record.training_week,

      training_day:
        record.training_day,

      event:
        record.event_instances
          ?.events
          ?.event_name || '',

      occurrence:
        record.event_instances
          ?.event_area || '',

      program:
        record.event_programs
          ?.program_name || '',

      participant:
        record
          ?.participant_instances
          ?.participant_registry
          ?.display_name || '',

      county:
        record.event_instances
          ?.county_master
          ?.county_name || '',

      town:
        record.event_instances
          ?.town_master
          ?.town_name || '',

      session_type:
        record.session_type || '',

      start_time:
        record.start_time || '',

      end_time:
        record.end_time || '',

      distance_km:
        record.distance_km || '',

      duration_minutes:
        record.duration_minutes || '',

      avg_speed_kmh:
        record.avg_speed_kmh || '',

      attendance:
        record.attendance
          ? 'Present'
          : 'Absent',

      indoor_session:
        record.indoor_session
          ? 'Yes'
          : 'No',

      notes:
        record.notes || ''

    })
  )

  downloadCsv({

  reportName:
    'Training Results Report',

  columns: [

    { key:'training_date', label:'Training Date' },
    { key:'training_week', label:'Training Week' },
    { key:'training_day', label:'Training Day' },

    { key:'event', label:'Event' },
    { key:'occurrence', label:'Occurrence' },
    { key:'program', label:'Program' },

    { key:'participant', label:'Participant' },

    { key:'county', label:'County' },
    { key:'town', label:'Town' },

    { key:'session_type', label:'Session Type' },

    { key:'start_time', label:'Start Time' },
    { key:'end_time', label:'End Time' },

    { key:'distance_km', label:'Distance KM' },

    { key:'duration_minutes', label:'Duration Minutes' },

    { key:'avg_speed_kmh', label:'Average Speed' },

    { key:'attendance', label:'Attendance' },

    { key:'indoor_session', label:'Indoor Session' },

    { key:'notes', label:'Notes' }

  ],

  data:
    rows
})

  showSuccess(
    'Training report exported successfully'
  )
}

function applyTrainingSearch() {

  const searchTerm =
    getValue(
      'searchParticipantAnalysis'
    )
      .toLowerCase()
      .trim()

  filteredTrainingRecords =
    trainingRecords.filter(
      record => {

        const participant =
          record
            ?.participant_instances
            ?.participant_registry
            ?.display_name || ''

        const event =
          record.event_instances
            ?.events
            ?.event_name || ''

        const program =
          record.event_programs
            ?.program_name || ''

        const sessionType =
          record.session_type || ''

        const searchableText =
          `
            ${participant}
            ${event}
            ${program}
            ${sessionType}
          `
            .toLowerCase()

        return searchableText
          .includes(
            searchTerm
          )
      }
    )

  buildSummaryCards()

  buildParticipantAnalysis()
}

on(
  'searchParticipantAnalysis',
  'input',
  applyTrainingSearch
)



function buildAttendanceTrends() {

  const statistics = {}

  filteredTrainingRecords.forEach(
    record => {

      const week =
        record.training_week ||
        'Unknown'

      if (
        !statistics[
          week
        ]
      ) {

        statistics[
          week
        ] = {

          present: 0,
          absent: 0
        }
      }

      if (
        record.attendance
      ) {

        statistics[
          week
        ].present++
      }

      else {

        statistics[
          week
        ].absent++
      }
    }
  )

  let html = ''

  Object.entries(
    statistics
  ).forEach(
    (
      [
        week,
        stat
      ]
    ) => {

      const total =
        stat.present +
        stat.absent

      const percentage =
        total
          ? (
              stat.present /
              total
            ) * 100
          : 0

      html += `
        <tr>
          <td>${week}</td>
          <td>${stat.present}</td>
          <td>${stat.absent}</td>
          <td>${percentage.toFixed(1)}%</td>
        </tr>
      `
    }
  )

  setHtml(
    'attendanceTrendTableBody',
    html
  )
}


async function exportTrainingExcel() {

  try {



    const summaryData = [

      {
        metric:
          'Total Sessions',

        value:
          filteredTrainingRecords.length
      },

      {
        metric:
          'Participants',

        value:
          new Set(

            filteredTrainingRecords.map(
              record =>

                record
                  ?.participant_instances
                  ?.participant_registry
                  ?.participant_ref_id
            )

          ).size
      }
    ]

   const rawData =
  filteredTrainingRecords.map(
    record => ({

      

      training_date:
        record.training_date,

      training_week:
        record.training_week,

      training_day:
        record.training_day,

      event:
        record.event_instances
          ?.events
          ?.event_name || '',

      

      occurrence:
        record.event_instances
          ?.event_area || '',

      occurrence_start_date:
        record.event_instances
          ?.start_date || '',

      occurrence_end_date:
        record.event_instances
          ?.end_date || '',

      occurrence_start_time:
        record.event_instances
          ?.start_time || '',

      occurrence_end_time:
        record.event_instances
          ?.end_time || '',

      program:
        record.event_programs
          ?.program_name || '',

      participant:
        record
          ?.participant_instances
          ?.participant_registry
          ?.display_name || '',

      

      

      participant_type:
        record
          ?.participant_instances
          ?.participant_registry
          ?.participant_type_master
          ?.participant_type_code || '',

      county:
        record.event_instances
          ?.county_master
          ?.county_name || '',

      town:
        record.event_instances
          ?.town_master
          ?.town_name || '',

      session_type:
        record.session_type || '',

      training_start_time:
        record.start_time || '',

      training_end_time:
        record.end_time || '',

      distance_km:
        record.distance_km || 0,

      duration_minutes:
        record.duration_minutes || 0,

      avg_speed_kmh:
        record.avg_speed_kmh || 0,

      attendance:
        record.attendance
          ? 'Present'
          : 'Absent',

      indoor_session:
        record.indoor_session
          ? 'Yes'
          : 'No',

      participant_status:
        statusesLookup.find(
          status =>
            status.status_id ===
            record
              ?.participant_instances
              ?.participant_status_id
        )?.status_name || '',

      notes:
        record.notes || '',

      

      avg_watts:
        record.performance?.[0]
          ?.avg_watts || 0,

      normalized_power:
        record.performance?.[0]
          ?.normalized_power || 0,

      training_stress_score:
        record.performance?.[0]
          ?.training_stress_score || 0

    })
  )
    await downloadExcelWorkbook({

      reportName:
        'Training Results Report',

      sheets: [

        {

          sheetName:
            'Training Data',

          columns: [

 

  {
    key:'training_date',
    label:'Training Date'
  },

  {
    key:'training_week',
    label:'Week'
  },

  {
    key:'training_day',
    label:'Day'
  },

  {
    key:'event',
    label:'Event'
  },

 

  {
    key:'occurrence',
    label:'Occurrence'
  },

  {
    key:'occurrence_start_date',
    label:'Occurrence Start Date'
  },

  {
    key:'occurrence_end_date',
    label:'Occurrence End Date'
  },

  {
    key:'occurrence_start_time',
    label:'Occurrence Start Time'
  },

  {
    key:'occurrence_end_time',
    label:'Occurrence End Time'
  },

  {
    key:'program',
    label:'Program'
  },

  {
    key:'participant',
    label:'Participant'
  },

  
  

  {
    key:'participant_type',
    label:'Participant Type'
  },

  {
    key:'county',
    label:'County'
  },

  {
    key:'town',
    label:'Town'
  },

  {
    key:'session_type',
    label:'Session Type'
  },

  {
    key:'training_start_time',
    label:'Training Start'
  },

  {
    key:'training_end_time',
    label:'Training End'
  },

  {
    key:'distance_km',
    label:'Distance KM'
  },

  {
    key:'duration_minutes',
    label:'Duration Minutes'
  },

  {
    key:'avg_speed_kmh',
    label:'Average Speed'
  },

  {
    key:'attendance',
    label:'Attendance'
  },

  {
    key:'participant_status',
    label:'Participant Status'
  },

  {
    key:'indoor_session',
    label:'Indoor Session'
  },

  {
    key:'avg_watts',
    label:'Average Watts'
  },

  {
    key:'normalized_power',
    label:'Normalized Power'
  },

  {
    key:'training_stress_score',
    label:'TSS'
  },

  {
    key:'notes',
    label:'Notes'
  }

],

          data:
            rawData
        },
{
    sheetName:
      'Event Analysis',

    columns: [
      { key:'event', label:'Event' },
      { key:'sessions', label:'Sessions' },
      { key:'participants', label:'Participants' },
      { key:'distance', label:'Distance KM' }
    ],

    data:
      Object.values(
        filteredTrainingRecords.reduce(
          (acc, record) => {

            const event =
              record.event_instances
                ?.events
                ?.event_name ||
              'Unknown'

            if (!acc[event]) {

              acc[event] = {

                event,

                sessions: 0,

                participants:
                  new Set(),

                distance: 0
              }
            }

            acc[event].sessions++

            acc[event].distance +=
              Number(
                record.distance_km || 0
              )

            acc[event]
              .participants
              .add(
                record
                  ?.participant_instances
                  ?.participant_registry
                  ?.participant_ref_id
              )

            return acc

          },
          {}
        )
      ).map(
        item => ({

          event:
            item.event,

          sessions:
            item.sessions,

          participants:
            item.participants.size,

          distance:
            item.distance.toFixed(2)
        })
      )
  }
]

      
    })

    showSuccess(
      'Excel report exported successfully'
    )

  } catch (error) {

    console.error(error)

    showError(
      'Failed to export Excel report'
    )
  }
}
function exportTrainingPdf() {

  try {

    const rows =
      filteredTrainingRecords.map(
        record => ({

          event:
            record.event_instances
              ?.events
              ?.event_name,

          participant:
            record
              ?.participant_instances
              ?.participant_registry
              ?.display_name,

          county:
            record.event_instances
              ?.county_master
              ?.county_name,

          distance:
            record.distance_km,

          speed:
            record.avg_speed_kmh
        })
      )

    downloadPdf({

      reportName:
        'Training Results Report',

      summary: {

        Sessions:
          filteredTrainingRecords.length,

        Participants:
          new Set(

            filteredTrainingRecords.map(
              record =>

                record
                  ?.participant_instances
                  ?.participant_registry
                  ?.participant_ref_id
            )

          ).size
      },

      columns: [

        {
          key:
            'event',

          label:
            'Event'
        },

        {
          key:
            'participant',

          label:
            'Participant'
        },

        {
          key:
            'county',

          label:
            'County'
        },

        {
          key:
            'distance',

          label:
            'Distance'
        },

        {
          key:
            'speed',

          label:
            'Avg Speed'
        }
      ],

      data:
        rows
    })

    showSuccess(
      'PDF report exported successfully'
    )

  } catch (error) {

    console.error(error)

    showError(
      'Failed to export PDF report'
    )
  }
}