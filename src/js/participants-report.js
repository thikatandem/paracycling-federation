/* =====================================================
   CONSTANTS
===================================================== */

const PARTICIPATION_PAGE_SIZE = 10

/* =====================================================
   GLOBALS
===================================================== */

let participationRecords = []
let filteredParticipationRecords = []

let eventsLookup = []
let programsLookup = []
let countiesLookup = []
let classificationsLookup = []

let currentParticipationPage = 1

/* =====================================================
   DOM HELPERS
===================================================== */

function getElement(id) {

  return document.getElementById(id)
}

function getValue(id) {

  return getElement(id)?.value || ''
}

function setText(id, value) {

  const element = getElement(id)

  if (!element) {

    return
  }

  element.textContent = value
}

function showError(message) {

  if (
    window.Swal
  ) {

    Swal.fire(
      'Error',
      message,
      'error'
    )

    return
  }

  alert(message)
}

function showSuccess(message) {

  if (
    window.Swal
  ) {

    Swal.fire(
      'Success',
      message,
      'success'
    )

    return
  }

  alert(message)
}

function safeArray(value) {

  return Array.isArray(value)
    ? value
    : []
}

/* =====================================================
   LOOKUPS
===================================================== */

async function loadEventsLookup() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from('events')
      .select(`
        event_id,
        event_name
      `)
      .order(
        'event_name'
      )

  if (error) {

    console.error(error)

    return
  }

  eventsLookup =
    data || []

  const select =
    getElement(
      'filterParticipationEvent'
    )

  if (!select) {

    return
  }

  select.innerHTML =
    `
      <option value="">
        All Events
      </option>
    `

  eventsLookup.forEach(
    event => {

      select.innerHTML +=
        `
          <option
            value="${event.event_id}"
          >
            ${event.event_name}
          </option>
        `
    }
  )
}

async function loadProgramsLookup() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'event_programs'
      )
      .select(`
        program_id,
        program_name
      `)
      .order(
        'program_name'
      )

  if (error) {

    console.error(error)

    return
  }

  programsLookup =
    data || []

  const select =
    getElement(
      'filterParticipationProgram'
    )

  if (!select) {

    return
  }

  select.innerHTML =
    `
      <option value="">
        All Programs
      </option>
    `

  programsLookup.forEach(
    program => {

      select.innerHTML +=
        `
          <option
            value="${program.program_id}"
          >
            ${program.program_name}
          </option>
        `
    }
  )
}

async function loadCountiesLookup() {

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

    console.error(error)

    return
  }

  countiesLookup =
    data || []

  const select =
    getElement(
      'filterParticipationCounty'
    )

  if (!select) {

    return
  }

  select.innerHTML =
    `
      <option value="">
        All Counties
      </option>
    `

  countiesLookup.forEach(
    county => {

      select.innerHTML +=
        `
          <option
            value="${county.county_id}"
          >
            ${county.county_name}
          </option>
        `
    }
  )
}

async function loadClassificationsLookup() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'classification_master'
      )
      .select(`
        classification_id,
        classification_code,
        description
      `)
      .order(
        'classification_code'
      )

  if (error) {

    console.error(error)

    return
  }

  classificationsLookup =
    data || []
}

async function loadYearsLookup() {

  const select =
    getElement(
      'filterParticipationYear'
    )

  if (!select) {

    return
  }

  const years =
    [
      ...new Set(
        participationRecords
          .filter(
            record =>
              record.registration_date
          )
          .map(
            record =>
              new Date(
                record.registration_date
              ).getFullYear()
          )
      )
    ]
      .sort(
        (a, b) => b - a
      )

  select.innerHTML =
    `
      <option value="">
        All Years
      </option>
    `

  years.forEach(
    year => {

      select.innerHTML +=
        `
          <option value="${year}">
            ${year}
          </option>
        `
    }
  )
}

/* =====================================================
   LOAD PARTICIPATION DATA
===================================================== */

async function loadParticipationData() {

  try {

    const {
      data,
      error
    } =
     await window.supabaseClient
  .from('participant_instances')
.select(`
  participant_instance_id,
  participant_ref_id,
  registration_date,
  participant_status_id,
  program_id,

  status_master(
    status_id,
    status_name
  ),

  event_programs(
    program_id,
    program_name
  ),

  event_instances(
    event_instance_id,
    event_id,

    events(
      event_id,
      event_name
    )
  ),

  participant_registry(
    participant_ref_id,
    source_id,
    display_name,
    participant_type_master(
      participant_type_code
    )
  )
`)
    if (error) {

      throw error
    }

    participationRecords =
      safeArray(data)

    filteredParticipationRecords =
      [...participationRecords]

    buildParticipationStatistics()

  } catch (error) {

    console.error(error)

    showError(
      'Failed to load participation report data'
    )
  }
}

/* =====================================================
   BUILD STATISTICS
===================================================== */

function buildParticipationStatistics() {

  buildSummaryCards()

  buildEventAnalysis()

  buildTeamAnalysis()

  buildAthleteAnalysis()

  buildClassificationAnalysis()

  buildCountyAnalysis()

  buildProgramAnalysis()
}

/* =====================================================
   SUMMARY CARDS
===================================================== */

function buildSummaryCards() {

  const uniqueEvents =
    new Set()

  const uniqueParticipants =
    new Set()

  const uniquePrograms =
    new Set()

 

  

  participationRecords.forEach(
    record => {

      if (
       record.event_instances?.events?.event_id
      ) {

        uniqueEvents.add(
          record.event_instances?.events?.event_id
        )
      }

      if (
  record.participant_ref_id
) {

  uniqueParticipants.add(
    record.participant_ref_id
  )
}

      if (
        record.program_id
      ) {

        uniquePrograms.add(
          record.program_id
        )
      }

     
    }
  )

  setText(
    'totalRegistrationsCard',
    participationRecords.length
  )

  setText(
    'uniqueEventsCard',
    uniqueEvents.size
  )

  setText(
  'uniqueTeamsCard',
  uniqueParticipants.size
)

  setText(
  'uniqueAthletesCard',
  uniqueParticipants.size
)

  setText(
    'programsUtilizedCard',
    uniquePrograms.size
  )

  setText(
  'countiesRepresentedCard',
  '-'
)
}

/* =====================================================
   EVENT ANALYSIS
===================================================== */


function buildEventAnalysis() {

  const body =
    getElement(
      'eventParticipationAnalysisBody'
    )

  if (!body) {
    return
  }

  body.innerHTML = ''

  const statistics = {}

  participationRecords.forEach(
    record => {

      const eventName =
        record.event_instances?.events?.event_name ||
        'Unknown Event'

      if (!statistics[eventName]) {
        statistics[eventName] = {
          teams: new Set(),
          athletes: new Set(),
          programs: new Set(),
          registrations: 0
        }
      }

      statistics[eventName].registrations += 1

      if (
  record.participant_ref_id
) {

  statistics[eventName]
    .athletes
    .add(
      record.participant_ref_id
    )

  statistics[eventName]
    .teams
    .add(
      record.participant_ref_id
    )
}

      if (record.program_id) {
        statistics[eventName].programs.add(
          record.program_id
        )
      }

      
    }
  )

  Object.entries(
    statistics
  ).forEach(
    ([eventName, item]) => {

      body.innerHTML += `
        <tr>
          <td>${eventName}</td>
          <td>${item.teams.size}</td>
          <td>${item.athletes.size}</td>
          <td>${item.programs.size}</td>
          <td>${item.registrations}</td>
        </tr>
      `
    }
  )
}
/* =====================================================
   TEAM ANALYSIS
===================================================== */

function buildTeamAnalysis() {

  const body =
    getElement(
      'teamParticipationAnalysisBody'
    )

  if (!body) {

    return
  }

  body.innerHTML = ''

  const statistics = {}

  participationRecords.forEach(
    record => {

      const participant =
        record.participant_registry

      if (
        !participant
      ) {

        return
      }

      const participantId =
        participant.participant_ref_id

      if (
        !statistics[
          participantId
        ]
      ) {

        statistics[
          participantId
        ] = {

          displayName:
            participant.display_name,

          events:
            new Set(),

          programs:
            new Set(),

          latestEvent:
            ''
        }
      }

      statistics[
        participantId
      ].events.add(
        record.event_instances
          ?.events
          ?.event_id
      )

      statistics[
        participantId
      ].programs.add(
        record.program_id
      )

      statistics[
        participantId
      ].latestEvent =
        record.event_instances
          ?.events
          ?.event_name || ''
    }
  )

  Object.values(
    statistics
  ).forEach(
    item => {

      body.innerHTML += `
        <tr>
          <td>-</td>
          <td>${item.displayName}</td>
          <td>${item.events.size}</td>
          <td>${item.programs.size}</td>
          <td>${item.latestEvent}</td>
          <td>Active</td>
        </tr>
      `
    }
  )
}

/* =====================================================
   ATHLETE ANALYSIS
===================================================== */

function buildAthleteAnalysis() {

  const body =
    getElement(
      'athleteParticipationAnalysisBody'
    )

  if (!body) {

    return
  }

  body.innerHTML = ''

  const participants = {}

  participationRecords.forEach(
    record => {

      const participant =
        record.participant_registry

      if (
        !participant
      ) {

        return
      }

      const participantId =
        participant.participant_ref_id

      if (
        !participants[
          participantId
        ]
      ) {

        participants[
          participantId
        ] = {

          displayName:
            participant.display_name,

          participantType:
            participant
              ?.participant_type_master
              ?.participant_type_code || '',

          events:
            new Set(),

          programs:
            new Set()
        }
      }

      participants[
        participantId
      ].events.add(
        record.event_instances
          ?.events
          ?.event_id
      )

      participants[
        participantId
      ].programs.add(
        record.program_id
      )
    }
  )

  Object.values(
    participants
  ).forEach(
    item => {

      body.innerHTML += `
        <tr>
          <td>-</td>
          <td>${item.displayName}</td>
          <td>${item.participantType}</td>
          <td>-</td>
          <td>${item.events.size}</td>
          <td>${item.programs.size}</td>
        </tr>
      `
    }
  )
}

/* =====================================================
   CLASSIFICATION ANALYSIS
===================================================== */

function buildClassificationAnalysis() {

  const body =
    getElement(
      'classificationParticipationAnalysisBody'
    )

  if (!body) {

    return
  }

  body.innerHTML = ''

  const statistics = {}

  participationRecords.forEach(
    record => {

      const type =
        record
          ?.participant_registry
          ?.participant_type_master
          ?.participant_type_code ||
        'Unknown'

      if (
        !statistics[type]
      ) {

        statistics[type] = {

          participants:
            new Set(),

          registrations: 0
        }
      }

      statistics[type]
        .participants
        .add(
          record.participant_ref_id
        )

      statistics[type]
        .registrations += 1
    }
  )

  Object.entries(
    statistics
  ).forEach(
    ([type, item]) => {

      body.innerHTML += `
        <tr>
          <td>${type}</td>
          <td>${item.participants.size}</td>
          <td>${item.registrations}</td>
          <td>-</td>
        </tr>
      `
    }
  )
}

/* =====================================================
   COUNTY ANALYSIS
===================================================== */

function buildCountyAnalysis() {

  const body =
    getElement(
      'countyParticipationAnalysisBody'
    )

  if (!body) {

    return
  }

  body.innerHTML = `
    <tr>
      <td colspan="5">
        County analysis unavailable in Participant Registry architecture.
      </td>
    </tr>
  `
}


/* =====================================================
   PROGRAM ANALYSIS
===================================================== */

function buildProgramAnalysis() {

  const body =
    getElement(
      'programParticipationAnalysisBody'
    )

  if (!body) {

    return
  }

  body.innerHTML = ''

  const statistics = {}

  participationRecords.forEach(
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

          registrations: 0,

          teams:
            new Set(),

          athletes:
            new Set()
        }
      }

      statistics[
        programName
      ].registrations += 1

      statistics[
        programName
      ].teams.add(
        record.team_id
      )

      const pilot =
        record.teams?.pilot

      const stoker =
        record.teams?.stoker

      if (
        pilot?.athlete_id
      ) {

        statistics[
          programName
        ].athletes.add(
          pilot.athlete_id
        )
      }

      if (
        stoker?.athlete_id
      ) {

        statistics[
          programName
        ].athletes.add(
          stoker.athlete_id
        )
      }
    }
  )

  Object.entries(
    statistics
  ).forEach(
    ([program, item]) => {

      body.innerHTML += `
        <tr>
          <td>${program}</td>
          <td>${item.teams.size}</td>
          <td>${item.athletes.size}</td>
          <td>${item.registrations}</td>
        </tr>
      `
    }
  )
}

/* =====================================================
   SEARCH
===================================================== */

function applyParticipationSearch() {

  const searchTerm =
    getValue(
      'searchParticipationReport'
    )
      .toLowerCase()
      .trim()

  filteredParticipationRecords =
    participationRecords.filter(
      record => {

        const eventName =
          record.event_instances
            ?.events
            ?.event_name || ''

        const programName =
          record.event_programs
            ?.program_name || ''

        const participantName =
          record
            .participant_registry
            ?.display_name || ''

        const participantType =
          record
            .participant_registry
            ?.participant_type_master
            ?.participant_type_code || ''

        const statusName =
          record.status_master
            ?.status_name || ''

        const searchableText =
          `
            ${eventName}
            ${programName}
            ${participantName}
            ${participantType}
            ${statusName}
          `
            .toLowerCase()

        return searchableText
          .includes(
            searchTerm
          )
      }
    )

  currentParticipationPage = 1

  renderParticipationTable()

  updateParticipationPagination()
}
/* =====================================================
   FILTERS
===================================================== */

function applyParticipationFilters() {

  const eventId =
    getValue(
      'filterParticipationEvent'
    )

  const programId =
    getValue(
      'filterParticipationProgram'
    )

  const statusId =
    getValue(
      'filterParticipationStatus'
    )
const countyId =
  getValue(
    'filterParticipationCounty'
  )
  const year =
  getValue(
    'filterParticipationYear'
  )
  filteredParticipationRecords =
    participationRecords.filter(
      record => {
       if (
  year
) {

  const recordYear =
    record.registration_date
      ? String(
          new Date(
            record.registration_date
          ).getFullYear()
        )
      : ''

  if (
    recordYear !== year
  ) {

    return false
  }
}

        if (
          eventId &&
          record.event_instances?.events?.event_id !== eventId
        ) {

          return false
        }

        if (
          programId &&
          record.program_id !==
            programId
        ) {

          return false
        }

        if (
          statusId &&
          record.participant_status_id !== statusId
        ) {

          return false
        }
       if (
  countyId
) {

  return false
}
        return true
      }
    )

  const searchTerm =
    getValue(
      'searchParticipationReport'
    )
      .toLowerCase()
      .trim()

  if (
    searchTerm
  ) {

    filteredParticipationRecords =
      filteredParticipationRecords.filter(
        record => {

          const searchableText =
            `
              ${record.event_instances?.events?.event_name || ''}
              ${record.event_programs?.program_name || ''}
              ${record.teams?.team_code || ''}
              ${record.teams?.team_name || ''}
              ${record.teams?.pilot?.first_name || ''}
              ${record.teams?.pilot?.last_name || ''}
              ${record.teams?.stoker?.first_name || ''}
              ${record.teams?.stoker?.last_name || ''}
            `
              .toLowerCase()

          return searchableText
            .includes(
              searchTerm
            )
        }
      )
  }

  currentParticipationPage = 1

  renderParticipationTable()

  updateParticipationPagination()
}

/* =====================================================
   SORTING
===================================================== */

let participationSortField =
  'registration_date'

let participationSortDirection =
  'desc'

function sortParticipationData(
  field
) {

  if (
    participationSortField ===
    field
  ) {

    participationSortDirection =
      participationSortDirection ===
      'asc'
        ? 'desc'
        : 'asc'
  } else {

    participationSortField =
      field

    participationSortDirection =
      'asc'
  }

  filteredParticipationRecords.sort(
    (a, b) => {

      let valueA = ''
      let valueB = ''

      switch (
        participationSortField
      ) {

        case 'event':

          valueA =
            a.event_instances?.events?.event_name || ''

          valueB =
            b.event_instances?.events?.event_name || ''

          break

        case 'program':

          valueA =
            a.event_programs
              ?.program_name || ''

          valueB =
            b.event_programs
              ?.program_name || ''

          break

        case 'team_code':

          valueA =
            a.teams
              ?.team_code || ''

          valueB =
            b.teams
              ?.team_code || ''

          break

        case 'team_name':

          valueA =
            a.teams
              ?.team_name || ''

          valueB =
            b.teams
              ?.team_name || ''

          break

        case 'registration_date':

          valueA =
            a.registration_date || ''

          valueB =
            b.registration_date || ''

          break
      }

      if (
        participationSortDirection ===
        'asc'
      ) {

        return String(
          valueA
        ).localeCompare(
          String(
            valueB
          )
        )
      }

      return String(
        valueB
      ).localeCompare(
        String(
          valueA
        )
      )
    }
  )

  renderParticipationTable()
}

/* =====================================================
   TABLE RENDERING
===================================================== */

function renderParticipationTable() {

  const body =
    getElement(
      'participationReportTableBody'
    )

  if (!body) {

    return
  }

  body.innerHTML = ''

  const startIndex =
    (
      currentParticipationPage - 1
    ) *
    PARTICIPATION_PAGE_SIZE

  const pageRecords =
    filteredParticipationRecords.slice(
      startIndex,
      startIndex +
        PARTICIPATION_PAGE_SIZE
    )

  pageRecords.forEach(
  record => {

    body.innerHTML += `
      <tr>

        <td>
          ${
            record.event_instances?.events?.event_name ||
            '-'
          }
        </td>

        <td>
          ${
            record.event_programs?.program_name ||
            '-'
          }
        </td>

        <td>
          ${
            record.participant_registry?.display_name ||
            '-'
          }
        </td>

        <td>
          ${
            record.participant_registry
              ?.participant_type_master
              ?.participant_type_code ||
            '-'
          }
        </td>

        <td>
          ${
            record.registration_date
              ? new Date(
                  record.registration_date
                ).toLocaleDateString()
              : '-'
          }
        </td>

        <td>
          ${
            record.status_master
              ?.status_name ||
            '-'
          }
        </td>

        <td>
          <button
            class="btn btn-sm btn-primary"
            onclick="viewParticipationRecord(
              '${record.participant_instance_id}'
            )"
          >
            View
          </button>
        </td>

      </tr>
    `
  }
)
}

/* =====================================================
   PAGINATION
===================================================== */

function updateParticipationPagination() {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredParticipationRecords.length /
        PARTICIPATION_PAGE_SIZE
      )
    )

  setText(
    'participationPaginationInfo',
    `Page ${currentParticipationPage} of ${totalPages}`
  )

  const previousButton =
    getElement(
      'btnPreviousParticipationPage'
    )

  const nextButton =
    getElement(
      'btnNextParticipationPage'
    )

  if (
    previousButton
  ) {

    previousButton.disabled =
      currentParticipationPage <=
      1
  }

  if (
    nextButton
  ) {

    nextButton.disabled =
      currentParticipationPage >=
      totalPages
  }
}

function goToPreviousParticipationPage() {

  if (
    currentParticipationPage <=
    1
  ) {

    return
  }

  currentParticipationPage -= 1

  renderParticipationTable()

  updateParticipationPagination()
}

function goToNextParticipationPage() {

  const totalPages =
    Math.ceil(
      filteredParticipationRecords.length /
      PARTICIPATION_PAGE_SIZE
    )

  if (
    currentParticipationPage >=
    totalPages
  ) {

    return
  }

  currentParticipationPage += 1

  renderParticipationTable()

  updateParticipationPagination()
}
/* =====================================================
   PARTICIPATION INTELLIGENCE MODAL
===================================================== */

async function viewParticipationRecord(
  participantId
) {

  try {

    const record =
      participationRecords.find(
        item =>
          item.participant_instance_id ===
          participantId
      )

    if (!record) {

      showError(
        'Participation record not found'
      )

      return
    }

    setText(
      'reportEventName',
      record.event_instances
        ?.events
        ?.event_name || '-'
    )

    setText(
      'reportProgramName',
      record.event_programs
        ?.program_name || '-'
    )

    setText(
      'reportStatus',
      record.status_master
        ?.status_name || '-'
    )

    setText(
      'reportRegistrationDate',
      record.registration_date
        ? new Date(
            record.registration_date
          ).toLocaleString()
        : '-'
    )

    setText(
      'reportTeamCode',
      record
        .participant_registry
        ?.participant_type_master
        ?.participant_type_code || '-'
    )

    setText(
      'reportTeamName',
      record
        .participant_registry
        ?.display_name || '-'
    )

    const participantContainer =
      getElement(
        'pilotParticipationInfo'
      )

    if (
      participantContainer
    ) {

      participantContainer.innerHTML =
        `
          <p>
            <strong>Participant:</strong>
            ${
              record
                .participant_registry
                ?.display_name || '-'
            }
          </p>

          <p>
            <strong>Type:</strong>
            ${
              record
                .participant_registry
                ?.participant_type_master
                ?.participant_type_code || '-'
            }
          </p>
        `
    }

    const secondaryContainer =
      getElement(
        'stokerParticipationInfo'
      )

    if (
      secondaryContainer
    ) {

      secondaryContainer.innerHTML =
        `
          <p>
            <strong>Participant Ref:</strong>
            ${
              record
                .participant_registry
                ?.participant_ref_id || '-'
            }
          </p>

          <p>
            <strong>Source ID:</strong>
            ${
              record
                .participant_registry
                ?.source_id || '-'
            }
          </p>
        `
    }

    const participantRefId =
      record.participant_ref_id

    const participantRecords =
      participationRecords.filter(
        item =>
          item.participant_ref_id ===
          participantRefId
      )

    const uniqueEvents =
      new Set()

    const uniquePrograms =
      new Set()

    participantRecords.forEach(
      item => {

        if (
          item.event_instances
            ?.events
            ?.event_id
        ) {

          uniqueEvents.add(
            item.event_instances
              ?.events
              ?.event_id
          )
        }

        if (
          item.program_id
        ) {

          uniquePrograms.add(
            item.program_id
          )
        }
      }
    )

    setText(
      'metricEvents',
      uniqueEvents.size
    )

    setText(
      'metricPrograms',
      uniquePrograms.size
    )

    setText(
      'metricCounties',
      '-'
    )

    setText(
      'metricClassifications',
      '-'
    )

    const modalElement =
      getElement(
        'participationIntelligenceModal'
      )

    if (
      modalElement
    ) {

      const modal =
        new coreui.Modal(
          modalElement
        )

      modal.show()
    }

  } catch (error) {

    console.error(
      error
    )

    showError(
      'Failed to load participation details'
    )
  }
}
/* =====================================================
   EXPORTS
===================================================== */

function exportParticipationCsv() {

  if (
    !filteredParticipationRecords.length
  ) {

    showError(
      'No data available'
    )

    return
  }

  const rows = [

    [
      'Event',
      'Program',
      'Team Code',
      'Team Name',
      'Pilot',
      'Stoker',
      'Registration Date',
      'Status'
    ]
  ]

  filteredParticipationRecords.forEach(
    record => {

      rows.push([

        record.events
          ?.event_name || '',

        record.event_programs
          ?.program_name || '',

        record.teams
          ?.team_code || '',

        record.teams
          ?.team_name || '',

        `${record.teams?.pilot?.first_name || ''} ${record.teams?.pilot?.last_name || ''}`,

        `${record.teams?.stoker?.first_name || ''} ${record.teams?.stoker?.last_name || ''}`,

        record.registration_date || '',

        record.status_master
          ?.status_name || ''
      ])
    }
  )

  const csv =
    rows
      .map(
        row =>
          row.join(',')
      )
      .join('\n')

  const blob =
    new Blob(
      [csv],
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

  link.href = url

  link.download =
    'participation-report.csv'

  link.click()
}

function exportParticipationExcel() {

  showSuccess(
    'Excel export reserved for next enhancement phase'
  )
}

function printParticipationReport() {

  window.print()
}

/* =====================================================
   EVENT WIRING
===================================================== */

function wireParticipationEvents() {

  getElement(
    'searchParticipationReport'
  )
    ?.addEventListener(
      'input',
      applyParticipationSearch
    )

  getElement(
    'filterParticipationEvent'
  )
    ?.addEventListener(
      'change',
      applyParticipationFilters
    )

  getElement(
    'filterParticipationProgram'
  )
    ?.addEventListener(
      'change',
      applyParticipationFilters
    )

  getElement(
    'filterParticipationStatus'
  )
    ?.addEventListener(
      'change',
      applyParticipationFilters
    )
  getElement(
  'filterParticipationCounty'
)
  ?.addEventListener(
    'change',
    applyParticipationFilters
  )

getElement(
  'filterParticipationYear'
)
  ?.addEventListener(
    'change',
    applyParticipationFilters
  )
  getElement(
    'btnPreviousParticipationPage'
  )
    ?.addEventListener(
      'click',
      goToPreviousParticipationPage
    )

  getElement(
    'btnNextParticipationPage'
  )
    ?.addEventListener(
      'click',
      goToNextParticipationPage
    )

  getElement(
    'btnExportParticipationCsv'
  )
    ?.addEventListener(
      'click',
      exportParticipationCsv
    )

  getElement(
    'btnExportParticipationExcel'
  )
    ?.addEventListener(
      'click',
      exportParticipationExcel
    )

  getElement(
    'btnPrintParticipationReport'
  )
    ?.addEventListener(
      'click',
      printParticipationReport
    )

  getElement(
    'btnRefreshParticipationReport'
  )
    ?.addEventListener(
      'click',
      async () => {

        await loadParticipationData()

await loadYearsLookup()

renderParticipationTable()

updateParticipationPagination()
      }
    )

  document
    .querySelectorAll(
      '[data-sort]'
    )
    .forEach(
      header => {

        header.addEventListener(
          'click',
          () => {

            sortParticipationData(
              header.dataset.sort
            )
          }
        )
      }
    )
}

/* =====================================================
   MODALS
===================================================== */

function initializeParticipationModals() {

  const modal =
    getElement(
      'participationIntelligenceModal'
    )

  if (!modal) {

    return
  }
}

/* =====================================================
   INITIALIZATION
===================================================== */

async function initializeParticipationReport() {

  try {

    await Promise.all([

      loadEventsLookup(),

      loadProgramsLookup(),

      loadCountiesLookup(),

      loadClassificationsLookup()
    ])

    await loadParticipationData()
  await loadYearsLookup()

    renderParticipationTable()

    updateParticipationPagination()

    wireParticipationEvents()

    initializeParticipationModals()

  } catch (error) {

    console.error(error)

    showError(
      'Failed to initialize participation report'
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeParticipationReport
)