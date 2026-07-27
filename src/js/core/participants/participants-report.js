import {
  printCurrentView as printParticipationReport
} from '../services/uiService.js'

/* =====================================================
   CONSTANTS
===================================================== */

import {
  get as getElement,
  getInputValue as getValue,
  setText
} from '../services/domService.js'

import {
  createFeedbackController
} from '../services/feedbackService.js'

import {
  PARTICIPATION_PAGE_SIZE
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

/* =====================================================
   GLOBALS
===================================================== */

let participationRecords = []
let filteredParticipationRecords = []

let eventsLookup = []
let programsLookup = []
let countiesLookup = []
let classificationsLookup = []
let registrationStatusesLookup = []

let currentParticipationPage = 1

/* =====================================================
   DOM HELPERS
===================================================== */




const reportFeedback =
  createFeedbackController()

const showError =
  reportFeedback.error

const showSuccess =
  reportFeedback.success

function safeArray(value) {
  return Array.isArray(value) ?
    value :
    []
}

/* =====================================================
   LOOKUPS
===================================================== */

async function loadEventsLookup() {
  const {
    data,
    error
  } =
    await getDb()
      .from('events')
      .select(`
        event_id,
        event_name
      `)
      .order(
        'event_name'
      )

  if (error) {

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

  for (const event of eventsLookup) {
    select.innerHTML +=
        `
          <option
            value="${event.event_id}"
          >
            ${event.event_name}
          </option>
        `
  }
}

async function loadProgramsLookup() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'program_master'
      )
      .select(`
        program_id,
        program_name
      `)
      .order(
        'program_name'
      )

  if (error) {

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

  for (const program of programsLookup) {
    select.innerHTML +=
        `
          <option
            value="${program.program_id}"
          >
            ${program.program_name}
          </option>
        `
  }
}

async function loadCountiesLookup() {
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

  for (const county of countiesLookup) {
    select.innerHTML +=
        `
          <option
            value="${county.county_id}"
          >
            ${county.county_name}
          </option>
        `
  }
}

async function loadClassificationsLookup() {
  const {
    data,
    error
  } =
    await getDb()
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

    return
  }

  classificationsLookup =
    data || []
}

async function loadRegistrationStatusesLookup() {
  const { data, error } = await getDb()
    .from('registration_status_master')
    .select(`
      registration_status_id,
      status_name,
      status_code
    `)
    .order('status_name')

  if (error) return
  registrationStatusesLookup = data || []

  const select = getElement('filterParticipationStatus')
  if (!select) return

  select.innerHTML = '<option value="">All Registration Statuses</option>'
  for (const status of registrationStatusesLookup) {
    select.innerHTML += `<option value="${status.registration_status_id}">${status.status_name}</option>`
  }
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

  for (const year of years) {
    select.innerHTML +=
        `
          <option value="${year}">
            ${year}
          </option>
        `
  }
}

/* =====================================================
   LOAD PARTICIPATION DATA
===================================================== */

async function loadParticipationData() {
  try {
    const { data, error } = await getDb()
      .from('participant_instances')
      .select(`
        participant_instance_id,
        participant_ref_id,
        participant_status_id,
        registration_date,
        registration_status_id,
        program_id,
        status_master(
          status_id,
          status_code,
          status_name
        ),
        registration_status_master(
          registration_status_id,
          status_name,
          status_code
        ),
        program_master(
          program_id,
          program_code,
          program_name
        ),
        event_instances(
          event_instance_id,
          event_id,
          country_id,
          county_id,
          subcounty_id,
          town_id,
          event_area,
          start_date,
          end_date,
          country_master(country_id, country_code, country_name),
          county_master(county_id, county_code, county_name),
          subcounty_master(subcounty_id, subcounty_code, subcounty_name),
          town_master(town_id, town_name),
          events(
            event_id,
            event_code,
            event_name,
            event_type_master(event_type_id, event_type_code, event_type_name),
            event_category_master(event_category_id, category_code, category_name)
          )
        ),
        participant_registry(
          participant_ref_id,
          participant_type_id,
          source_id,
          display_name,
          is_active,
          participant_type_master(
            participant_type_id,
            participant_type_code,
            participant_type_name
          )
        )
      `)

    if (error) throw error

    participationRecords = safeArray(data)
    filteredParticipationRecords = [...participationRecords]
    buildParticipationStatistics()
  } catch (error) {
    showError(`Failed to load participation report data${error?.message ? `: ${error.message}` : ''}`)
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
  const records = filteredParticipationRecords
  const uniqueEvents = new Set()
  const uniqueTeams = new Set()
  const uniqueIndividuals = new Set()
  const uniquePrograms = new Set()
  const uniqueCounties = new Set()

  for (const record of records) {
    const typeCode = String(record?.participant_registry?.participant_type_master?.participant_type_code || '').toUpperCase()
    if (record.event_instances?.events?.event_id) uniqueEvents.add(record.event_instances.events.event_id)
    if (record.program_id) uniquePrograms.add(record.program_id)
    if (record.event_instances?.county_id) uniqueCounties.add(record.event_instances.county_id)
    if (record.participant_ref_id) {
      if (typeCode.includes('TEAM')) uniqueTeams.add(record.participant_ref_id)
      else uniqueIndividuals.add(record.participant_ref_id)
    }
  }

  setText('totalRegistrationsCard', records.length)
  setText('uniqueEventsCard', uniqueEvents.size)
  setText('uniqueTeamsCard', uniqueTeams.size)
  setText('uniqueAthletesCard', uniqueIndividuals.size)
  setText('programsUtilizedCard', uniquePrograms.size)
  setText('countiesRepresentedCard', uniqueCounties.size)
}

/* =====================================================
   EVENT ANALYSIS
===================================================== */

function buildEventAnalysis() {
  const body = getElement('eventParticipationAnalysisBody')
  if (!body) return
  body.innerHTML = ''
  const statistics = {}

  for (const record of filteredParticipationRecords) {
    const eventName = record.event_instances?.events?.event_name || 'Unknown Event'
    if (!statistics[eventName]) {
      statistics[eventName] = { teams: new Set(), athletes: new Set(), programs: new Set(), registrations: 0 }
    }
    const item = statistics[eventName]
    item.registrations += 1
    const typeCode = String(record?.participant_registry?.participant_type_master?.participant_type_code || '').toUpperCase()
    if (record.participant_ref_id) {
      if (typeCode.includes('TEAM')) item.teams.add(record.participant_ref_id)
      else item.athletes.add(record.participant_ref_id)
    }
    if (record.program_id) item.programs.add(record.program_id)
  }

  for (const [eventName, item] of Object.entries(statistics)) {
    body.innerHTML += `<tr><td>${eventName}</td><td>${item.teams.size}</td><td>${item.athletes.size}</td><td>${item.programs.size}</td><td>${item.registrations}</td></tr>`
  }
}
/* =====================================================
   TEAM ANALYSIS
===================================================== */

function buildTeamAnalysis() {
  const body = getElement('teamParticipationAnalysisBody')
  if (!body) return
  body.innerHTML = ''
  const statistics = {}

  for (const record of filteredParticipationRecords) {
    const participant = record.participant_registry
    const typeCode = String(participant?.participant_type_master?.participant_type_code || '').toUpperCase()
    if (!participant || !typeCode.includes('TEAM')) continue
    const participantId = participant.participant_ref_id
    if (!statistics[participantId]) {
      statistics[participantId] = {
        sourceId: participant.source_id,
        displayName: participant.display_name,
        events: new Set(),
        programs: new Set(),
        latestEvent: '',
        active: participant.is_active !== false
      }
    }
    const item = statistics[participantId]
    if (record.event_instances?.events?.event_id) item.events.add(record.event_instances.events.event_id)
    if (record.program_id) item.programs.add(record.program_id)
    item.latestEvent = record.event_instances?.events?.event_name || item.latestEvent
  }

  for (const item of Object.values(statistics)) {
    body.innerHTML += `<tr><td>${item.displayName}</td><td>${item.events.size}</td><td>${item.programs.size}</td><td>${item.latestEvent}</td><td>${item.active ? 'Active' : 'Inactive'}</td></tr>`
  }
}

/* =====================================================
   ATHLETE ANALYSIS
===================================================== */

function buildAthleteAnalysis() {
  const body = getElement('athleteParticipationAnalysisBody')
  if (!body) return
  body.innerHTML = ''
  const participants = {}

  for (const record of filteredParticipationRecords) {
    const participant = record.participant_registry
    const typeCode = String(participant?.participant_type_master?.participant_type_code || '').toUpperCase()
    if (!participant || typeCode.includes('TEAM')) continue
    const participantId = participant.participant_ref_id
    if (!participants[participantId]) {
      participants[participantId] = {
        sourceId: participant.source_id,
        displayName: participant.display_name,
        participantType: participant?.participant_type_master?.participant_type_name || 'Participant',
        county: record.event_instances?.county_master?.county_name || '',
        events: new Set(),
        programs: new Set()
      }
    }
    const item = participants[participantId]
    if (!item.county && record.event_instances?.county_master?.county_name) {
      item.county = record.event_instances.county_master.county_name
    }
    if (record.event_instances?.events?.event_id) item.events.add(record.event_instances.events.event_id)
    if (record.program_id) item.programs.add(record.program_id)
  }

  for (const item of Object.values(participants)) {
    body.innerHTML += `<tr><td>${item.displayName}</td><td>${item.participantType}</td><td>${item.county || '-'}</td><td>${item.events.size}</td><td>${item.programs.size}</td></tr>`
  }
}

/* =====================================================
   CLASSIFICATION ANALYSIS
===================================================== */

function buildClassificationAnalysis() {
  const body = getElement('classificationParticipationAnalysisBody')
  if (!body) return
  body.innerHTML = ''
  const statistics = {}

  for (const record of filteredParticipationRecords) {
    const type = record?.participant_registry?.participant_type_master?.participant_type_name || record?.participant_registry?.participant_type_master?.participant_type_code || 'Unknown'
    if (!statistics[type]) statistics[type] = { participants: new Set(), registrations: 0 }
    if (record.participant_ref_id) statistics[type].participants.add(record.participant_ref_id)
    statistics[type].registrations += 1
  }

  for (const [type, item] of Object.entries(statistics)) {
    body.innerHTML += `<tr><td>${type}</td><td>${item.participants.size}</td><td>${item.registrations}</td><td>-</td></tr>`
  }
}

/* =====================================================
   COUNTY ANALYSIS
===================================================== */

function buildCountyAnalysis() {
  const body = getElement('countyParticipationAnalysisBody')
  if (!body) return
  body.innerHTML = ''
  const statistics = {}

  for (const record of filteredParticipationRecords) {
    const county = record.event_instances?.county_master?.county_name || 'Unspecified'
    if (!statistics[county]) {
      statistics[county] = { teams: new Set(), individuals: new Set(), events: new Set(), registrations: 0 }
    }
    const item = statistics[county]
    const typeCode = String(record?.participant_registry?.participant_type_master?.participant_type_code || '').toUpperCase()
    if (record.participant_ref_id) {
      if (typeCode.includes('TEAM')) item.teams.add(record.participant_ref_id)
      else item.individuals.add(record.participant_ref_id)
    }
    if (record.event_instances?.events?.event_id) item.events.add(record.event_instances.events.event_id)
    item.registrations += 1
  }

  for (const [county, item] of Object.entries(statistics).sort((a, b) => b[1].registrations - a[1].registrations)) {
    body.innerHTML += `<tr><td>${county}</td><td>${item.teams.size}</td><td>${item.individuals.size}</td><td>${item.events.size}</td><td>${item.registrations}</td></tr>`
  }
}

/* =====================================================
   PROGRAM ANALYSIS
===================================================== */

function buildProgramAnalysis() {
  const body = getElement('programParticipationAnalysisBody')
  if (!body) return
  body.innerHTML = ''
  const statistics = {}

  for (const record of filteredParticipationRecords) {
    const programName = record.program_master?.program_name || 'Unknown Program'
    if (!statistics[programName]) statistics[programName] = { registrations: 0, teams: new Set(), athletes: new Set() }
    const item = statistics[programName]
    item.registrations += 1
    const typeCode = String(record?.participant_registry?.participant_type_master?.participant_type_code || '').toUpperCase()
    if (record.participant_ref_id) {
      if (typeCode.includes('TEAM')) item.teams.add(record.participant_ref_id)
      else item.athletes.add(record.participant_ref_id)
    }
  }

  for (const [program, item] of Object.entries(statistics)) {
    body.innerHTML += `<tr><td>${program}</td><td>${item.teams.size}</td><td>${item.athletes.size}</td><td>${item.registrations}</td></tr>`
  }
}

/* =====================================================
   SEARCH
===================================================== */

function applyParticipationSearch() {
  applyParticipationFilters()
}
/* =====================================================
   FILTERS
===================================================== */

function applyParticipationFilters() {
  const eventId = getValue('filterParticipationEvent')
  const programId = getValue('filterParticipationProgram')
  const statusId = getValue('filterParticipationStatus')
  const countyId = getValue('filterParticipationCounty')
  const year = getValue('filterParticipationYear')
  const searchTerm = getValue('searchParticipationReport').toLowerCase().trim()

  filteredParticipationRecords = participationRecords.filter(record => {
    if (year) {
      const recordYear = record.registration_date ? String(new Date(record.registration_date).getFullYear()) : ''
      if (recordYear !== year) return false
    }
    if (eventId && record.event_instances?.events?.event_id !== eventId) return false
    if (programId && record.program_id !== programId) return false
    if (statusId && record.registration_status_id !== statusId) return false
    if (countyId && record.event_instances?.county_id !== countyId) return false

    if (searchTerm) {
      const searchableText = `
        ${record.event_instances?.events?.event_name || ''}
        ${record.event_instances?.event_area || ''}
        ${record.program_master?.program_name || ''}
        ${record.participant_registry?.display_name || ''}
        ${record.participant_registry?.participant_type_master?.participant_type_code || ''}
        ${record.participant_registry?.participant_type_master?.participant_type_name || ''}
        ${record.registration_status_master?.status_name || ''}
        ${record.event_instances?.county_master?.county_name || ''}
        ${record.event_instances?.subcounty_master?.subcounty_name || ''}
        ${record.event_instances?.town_master?.town_name || ''}
      `.toLowerCase()
      if (!searchableText.includes(searchTerm)) return false
    }

    return true
  })

  currentParticipationPage = 1
  buildParticipationStatistics()
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
      'asc' ?
        'desc' :
        'asc'
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
        case 'event': {
          valueA =
            a.event_instances?.events?.event_name || ''

          valueB =
            b.event_instances?.events?.event_name || ''

          break
        }

        case 'program': {
          valueA =
            a.program_master
              ?.program_name || ''

          valueB =
            b.program_master
              ?.program_name || ''

          break
        }

        case 'team_code': {
          valueA =
            a.teams
              ?.team_code || ''

          valueB =
            b.teams
              ?.team_code || ''

          break
        }

        case 'team_name': {
          valueA =
            a.teams
              ?.team_name || ''

          valueB =
            b.teams
              ?.team_name || ''

          break
        }

        case 'registration_date': {
          valueA =
            a.registration_date || ''

          valueB =
            b.registration_date || ''

          break
        }
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

  for (const record of pageRecords) {
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
  record.program_master?.program_name ||
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
              ?.participant_type_name ||
            'Participant'
}
        </td>

        <td>
          ${
  record.registration_date ?
    new Date(
      record.registration_date
    ).toLocaleDateString() :
    '-'
}
        </td>

        <td>
          ${
  record.registration_status_master
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
      record.program_master
        ?.program_name || '-'
    )

    setText(
      'reportStatus',
      record.registration_status_master
        ?.status_name || '-'
    )

    setText(
      'reportRegistrationDate',
      record.registration_date ?
        new Date(
          record.registration_date
        ).toLocaleString() :
        '-'
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

    for (const item of participantRecords) {
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
        'participationDetailsModal'
      )

    if (
      modalElement
    ) {
      const modal =
        createModalByElement(modalElement)

      modal.show()
    }
  } catch (error) {

    showError(
      'Failed to load participation details'
    )
  }
}
function flattenParticipationRecord(record) {
  return {
    event: record.event_instances?.events?.event_name || '',
    event_type: record.event_instances?.events?.event_type_master?.event_type_name || '',
    event_category: record.event_instances?.events?.event_category_master?.category_name || '',
    event_area: record.event_instances?.event_area || '',
    program: record.program_master?.program_name || '',
    participant: record.participant_registry?.display_name || '',
    participant_type: record.participant_registry?.participant_type_master?.participant_type_name || 'Participant',
    registration_date: record.registration_date || '',
    registration_status: record.registration_status_master?.status_name || '',
    participant_status: record.status_master?.status_name || '',
    country: record.event_instances?.country_master?.country_name || '',
    county: record.event_instances?.county_master?.county_name || '',
    subcounty: record.event_instances?.subcounty_master?.subcounty_name || '',
    town: record.event_instances?.town_master?.town_name || ''
  }
}

function participationExportColumns() {
  return [
    { key: 'event', label: 'Event' },
    { key: 'event_type', label: 'Event Type' },
    { key: 'event_category', label: 'Event Category' },
    { key: 'event_area', label: 'Area' },
    { key: 'program', label: 'Program' },
    { key: 'participant', label: 'Participant' },
    { key: 'participant_type', label: 'Participant Type' },
    { key: 'registration_date', label: 'Registered Date' },
    { key: 'registration_status', label: 'Registration Status' },
    { key: 'participant_status', label: 'Participant Status' },
    { key: 'country', label: 'Country' },
    { key: 'county', label: 'County' },
    { key: 'subcounty', label: 'Subcounty' },
    { key: 'town', label: 'Town' }
  ]
}

/* =====================================================
   EXPORTS
===================================================== */

function exportParticipationCsv() {
  if (!filteredParticipationRecords.length) {
    showError('No data available')
    return
  }

  downloadCsv({
    reportName: 'Participation Report',
    columns: participationExportColumns(),
    data: filteredParticipationRecords.map(flattenParticipationRecord)
  })
  showSuccess('Participation CSV exported successfully')
}

async function exportParticipationExcel() {
  if (!filteredParticipationRecords.length) {
    showError('No data available')
    return
  }

  const rows = filteredParticipationRecords.map(flattenParticipationRecord)
  const typeStats = new Map()
  const countyStats = new Map()
  const eventStats = new Map()
  for (const row of rows) {
    typeStats.set(row.participant_type || 'Unspecified', (typeStats.get(row.participant_type || 'Unspecified') || 0) + 1)
    countyStats.set(row.county || 'Unspecified', (countyStats.get(row.county || 'Unspecified') || 0) + 1)
    eventStats.set(row.event || 'Unspecified', (eventStats.get(row.event || 'Unspecified') || 0) + 1)
  }

  await downloadExcelWorkbook({
    reportName: 'Participation Report',
    sheets: [
      {
        sheetName: 'Summary',
        columns: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }],
        data: [
          { metric: 'Registrations', value: rows.length },
          { metric: 'Unique participants', value: new Set(filteredParticipationRecords.map(item => item.participant_ref_id).filter(Boolean)).size },
          { metric: 'Events', value: new Set(rows.map(item => item.event).filter(Boolean)).size },
          { metric: 'Programs', value: new Set(rows.map(item => item.program).filter(Boolean)).size },
          { metric: 'Counties', value: new Set(rows.map(item => item.county).filter(Boolean)).size }
        ]
      },
      { sheetName: 'Registrations', columns: participationExportColumns(), data: rows },
      {
        sheetName: 'Participant Types',
        columns: [{ key: 'type', label: 'Participant Type' }, { key: 'registrations', label: 'Registrations' }],
        data: [...typeStats.entries()].map(([type, registrations]) => ({ type, registrations })).sort((a, b) => b.registrations - a.registrations)
      },
      {
        sheetName: 'Counties',
        columns: [{ key: 'county', label: 'County' }, { key: 'registrations', label: 'Registrations' }],
        data: [...countyStats.entries()].map(([county, registrations]) => ({ county, registrations })).sort((a, b) => b.registrations - a.registrations)
      },
      {
        sheetName: 'Events',
        columns: [{ key: 'event', label: 'Event' }, { key: 'registrations', label: 'Registrations' }],
        data: [...eventStats.entries()].map(([event, registrations]) => ({ event, registrations })).sort((a, b) => b.registrations - a.registrations)
      }
    ]
  })
  showSuccess('Participation Excel workbook exported successfully')
}



function exportParticipationPdf() {
  if (!filteredParticipationRecords.length) {
    showError('No data available')
    return
  }
  const rows = filteredParticipationRecords.map(flattenParticipationRecord)
  downloadPdf({
    reportName: 'Participation Report',
    columns: [
      { key: 'event', label: 'Event' },
      { key: 'program', label: 'Program' },
      { key: 'participant', label: 'Participant' },
      { key: 'participant_type', label: 'Type' },
      { key: 'registration_date', label: 'Registered' },
      { key: 'registration_status', label: 'Status' },
      { key: 'county', label: 'County' },
      { key: 'subcounty', label: 'Subcounty' }
    ],
    data: rows,
    summary: {
      Registrations: rows.length,
      Participants: new Set(filteredParticipationRecords.map(item => item.participant_ref_id).filter(Boolean)).size,
      Events: new Set(rows.map(item => item.event).filter(Boolean)).size,
      Counties: new Set(rows.map(item => item.county).filter(Boolean)).size
    }
  })
  showSuccess('Participation PDF exported successfully')
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
    'btnExportParticipationPdf'
  )
    ?.addEventListener(
      'click',
      exportParticipationPdf
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

        applyParticipationFilters()
      }
    )

  for (const header of document
    .querySelectorAll(
      '[data-sort]'
    )) {
    header.addEventListener(
      'click',
      () => {
        sortParticipationData(
          header.dataset.sort
        )
      }
    )
  }
}

/* =====================================================
   MODALS
===================================================== */

function initializeParticipationModals() {
  const modal =
    getElement(
      'participationDetailsModal'
    )

  if (!modal) {
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

      loadClassificationsLookup(),

      loadRegistrationStatusesLookup()
    ])

    await loadParticipationData()
    await loadYearsLookup()

    applyParticipationFilters()

    wireParticipationEvents()

    initializeParticipationModals()
  } catch (error) {

    showError(
      'Failed to initialize participation report'
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeParticipationReport
)
