import {
  printCurrentView as exportPdf
} from '../services/uiService.js'

import {
  createNumberedPaginationRenderer
} from '../services/paginationService.js'

import {
  formatDate
} from '../services/formattingService.js'

import {
  getParticipantStatusBadge
} from '../services/badgeService.js'

import {
  buildActionButtons,
  buildActionCell,
  buildStatusCell
} from '../services/tableRendererService.js'

import {
  getProgramsForEvent
} from '../programs/programService.js'

// =====================================================
// EVENTS MODULE
// ParaCycling Federation Management System
// =====================================================

/* eslint camelcase: 0 */
import {
  getInputValue as getValue,
  setRawValue as setValue } from '../services/domService.js'
import { showInlineError,
  createDualFeedbackController } from '../services/feedbackService.js'
import { PAGE_SIZE as pageSize,
  ERROR_TIMEOUT,
  SUCCESS_TIMEOUT
} from '../services/constants.js'
import { getDb } from '../supabase/getDb.js'
import { ensureParticipantRegistryEntry,
  saveParticipantRegistrations,
  updateParticipantRegistration } from './participantRegistrationService.js'
import { createModal,
  showModal,
  hideModal
} from '../services/modalService.js'
const participantFeedback =
  createDualFeedbackController({
    errorContainerId:
      'participantRegistrationError',
    successContainerId:
      'participantRegistrationSuccess',
    errorOptions: {
      timeout: ERROR_TIMEOUT
    },
    successOptions: {
      timeout: SUCCESS_TIMEOUT
    }
  })

const showError =
  participantFeedback.error
    .bind(participantFeedback)

const showSuccess =
  participantFeedback.success
    .bind(participantFeedback)

let events = []

let eventOccurrences = []

let eventPrograms = []

let participants = []
let participantStatuses = []

const registrations = []

let filteredRegistrations = []

let selectedParticipants = []

let participantRegistrations = []

let pendingDeleteIds = []

let currentPage = 1
let registrationSaveInFlight = false



const eventId =
  document.getElementById(
    'eventId'
  )
const participantSearch =
  document.getElementById(
    'participantSearch'
  )

const participantTypeFilter =
  document.getElementById(
    'participantTypeFilter'
  )

const eventInstanceId =
  document.getElementById(
    'eventInstanceId'
  )

const programId =
  document.getElementById(
    'programId'
  )

const participantStatusId =
  document.getElementById(
    'participantStatusId'
  )

const availableParticipantsBody =
  document.getElementById(
    'availableParticipantsBody'
  )
const occurrenceFilter =
  document.getElementById(
    'occurrenceFilter'
  )

const programFilter =
  document.getElementById(
    'programFilter'
  )
const btnExportExcel =
  document.getElementById(
    'btnExportExcel'
  )

const btnExportPdf =
  document.getElementById(
    'btnExportPdf'
  )

document.addEventListener(
  'DOMContentLoaded',
  initializeParticipants
)


function showDeleteConfirmation(
  participantInstanceId = null,
  participantInstanceIds = []
) {
  pendingDeleteIds =
    participantInstanceId ?
      [participantInstanceId] :
      participantInstanceIds

  document.getElementById(
    'deleteRegistrationMessage'
  ).textContent =
  pendingDeleteIds.length === 1 ?

    'Remove this participant from the selected event?' :

    `WARNING: You are about to remove ${pendingDeleteIds.length} participants. This action cannot be undone.`

  showModal(
    'deleteRegistrationModal'
  )
}

function toggleBulkDeleteButton() {
  const button =
    document.getElementById(
      'btnBulkDelete'
    )

  if (
    !button
  ) {
    return
  }

  const checked =
    document.querySelectorAll(
      '.registration-check:checked'
    ).length
  button.classList.toggle(
    'd-none',
    checked === 0
  )

  const text =
  document.getElementById(
    'bulkDeleteText'
  )

  if (
    text
  ) {
    text.textContent =
    checked === 1 ?
      'Remove 1 Selected Participant' :
      `Remove ${checked} Selected Participants`
  }
}

async function initializeParticipants() {
  try {
    bindEvents()

    await loadEvents()

    await loadParticipantStatuses()

    await loadParticipantRegistry()
    await loadPrograms()

    await loadRegistrations()
  } catch (
    error
  ) {
  }
}

function selectAllParticipants() {
  selectedParticipants =
    participants.map(
      participant =>
        participant.participant_ref_id
    )

  renderParticipants()
}

function bindEvents() {
  eventId
    ?.addEventListener(
      'change',
      handleEventChange
    )

  eventInstanceId
    ?.addEventListener(
      'change',
      handleOccurrenceChange
    )
  document
  .getElementById(
    'btnNewParticipantRegistration'
  )
  ?.addEventListener(
    'click',
    newRegistration
  )

document
  .getElementById(
    'btnFinishParticipantRegistration'
  )
  ?.addEventListener(
    'click',
    finishRegistration
  )


  document
  .getElementById(
    'btnSelectAllParticipants'
  )
  ?.addEventListener(
    'click',
    selectAllParticipants
  )

  document
  .getElementById(
    'searchParticipantRegistration'
  )
  ?.addEventListener(
    'input',
    searchRegistrations
  )
  occurrenceFilter
  ?.addEventListener(
    'change',
    applyFilters
  )
  participantSearch
  ?.addEventListener(
    'input',
    renderParticipants
  )

  participantTypeFilter
  ?.addEventListener(
    'change',
    () => {
      toggleCompositionBuilder()

      renderParticipants()
    }
  )
  programFilter
  ?.addEventListener(
    'change',
    applyFilters
  )
  btnExportExcel
  ?.addEventListener(
    'click',
    exportExcel
  )

  btnExportPdf
  ?.addEventListener(
    'click',
    exportPdf
  )
  document
  .getElementById(
    'btnCreateComposition'
  )
  ?.addEventListener(
    'click',
    createComposition
  )

  document
  .getElementById(
    'btnSaveParticipantRegistration'
  )
  ?.addEventListener(
    'click',
    saveRegistration
  )

  document
  .getElementById(
    'btnBulkStatusUpdate'
  )
  ?.addEventListener(
    'click',
    bulkStatusUpdate
  )

  document
  .getElementById(
    'btnConfirmDelete'
  )
  ?.addEventListener(
    'click',
    confirmDeleteRegistrations
  )

  document
  .getElementById(
    'btnBulkDelete'
  )
  ?.addEventListener(
    'click',
    bulkDeleteRegistrations
  )
}

async function loadEvents() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'events'
      )
      .select(`
        event_id,
        event_name
      `)
      .order(
        'event_name'
      )

  if (
    error
  ) {
    throw error
  }

  events =
    data || []

  eventId.innerHTML =
    `
      <option value="">
        Select Event
      </option>
    `

  for (const event of events) {
    eventId.innerHTML += `
        <option
          value="${event.event_id}">
          ${event.event_name}
        </option>
      `
  }
}

async function handleEventChange() {
  const selectedEventId =
    eventId.value

  await loadOccurrences(
    selectedEventId
  )

  programId.innerHTML =
    `
      <option value="">
        Select Program
      </option>
    `

  clearOccurrenceDetails()
}

function toggleCompositionBuilder() {
  const builder =
    document.getElementById(
      'compositionBuilder'
    )

  const table =
    document.querySelector(
      '#availableParticipantsBody'
    )

  if (
    participantTypeFilter.value ===
    'COMPOSITION'
  ) {
    builder?.classList.remove(
      'd-none'
    )

    populateCompositionSelectors()

    return
  }

  builder?.classList.add(
    'd-none'
  )

  renderParticipants()
}

function renderSelectedBundle() {
  const container =
    document.getElementById(
      'selectedParticipantsList'
    )

  if (
    !container
  ) {
    return
  }

  container.innerHTML = ''

  for (const participantId of selectedParticipants) {
    const participant =
        participants.find(
          row =>
            row.participant_ref_id ===
            participantId
        )

    if (
      participant
    ) {
      container.innerHTML += `
          <li>
            ${participant.display_name}
          </li>
        `
    }
  }
}


function renderRegisteredBundle() {

  const container =
    document.getElementById(
      'selectedParticipantsList'
    )

  if (
    !container
  ) {
    return
  }

  const occurrenceId =
    getValue(
      'eventInstanceId'
    )

  if (
    !occurrenceId
  ) {

    container.innerHTML = ''

    return

  }

  const registrations =
    participantRegistrations.filter(
      row =>

        row.event_instances
          ?.event_instance_id ===
        occurrenceId
    )

  const groupedPrograms = {}

  for (const registration of registrations) {

    const programName =

      registration
        .program_master
        ?.program_name ||

      'Unknown Program'

    if (
      !groupedPrograms[
        programName
      ]
    ) {

      groupedPrograms[
        programName
      ] = []

    }

    groupedPrograms[
      programName
    ].push(
      registration
    )

  }

  container.innerHTML = ''

  for (const programName of Object.keys(
    groupedPrograms
  )) {

    container.innerHTML += `

      <li class="fw-bold mt-2">

        ${programName}

      </li>

    `

    for (
      const registration of groupedPrograms[
        programName
      ]
    ) {

      container.innerHTML += `

        <li class="ms-3">

          ${
            registration
              .participant_registry
              ?.display_name || ''
          }

        </li>

      `

    }

  }

}

async function populateCompositionSelectors() {
  const pilot =
    document.getElementById(
      'compositionPilotId'
    )

  const stoker =
    document.getElementById(
      'compositionStokerId'
    )

  if (
    !pilot ||
    !stoker
  ) {
    return
  }

  pilot.innerHTML =
    `
      <option value="">
        Select Pilot
      </option>
    `

  stoker.innerHTML =
    `
      <option value="">
        Select Stoker
      </option>
    `

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'athletes'
      )
      .select(`
        athlete_id,
        first_name,
        last_name,
        role
      `)

  if (
    error
  ) {
    throw error
  }

  for (const athlete of data) {
    const fullName =
        `${athlete.first_name || ''} ${athlete.last_name || ''}`

    if (
      athlete.role?.toUpperCase() ===
        'PILOT'
    ) {
      pilot.innerHTML += `
          <option value="${athlete.athlete_id}">
            [PILOT] ${fullName}
          </option>
        `
    }

    if (
      athlete.role?.toUpperCase() ===
        'STOKER'
    ) {
      stoker.innerHTML += `
          <option value="${athlete.athlete_id}">
            [STOKER] ${fullName}
          </option>
        `
    }
  }
}

async function createComposition() {
  try {
    const pilotId =
      getValue(
        'compositionPilotId'
      )

    const stokerId =
      getValue(
        'compositionStokerId'
      )

    const {
      data: athletes,
      error: athleteError
    } =
  await getDb()
    .from(
      'athletes'
    )
    .select(`
      athlete_id,
      first_name
    `)
    .in(
      'athlete_id',
      [
        pilotId,
        stokerId
      ].filter(
        Boolean
      )
    )

    if (
      athleteError
    ) {
      throw athleteError
    }

    const sortedAthletes =
  [...athletes]
    .sort(
      (
        a,
        b
      ) =>
        a.athlete_id.localeCompare(
          b.athlete_id
        )
    )

    const compositionName =
  sortedAthletes
    .map(
      athlete =>
        athlete.first_name
          .slice(
            0,
            3
          )
    )
    .join(
      ''
    )
    const athleteAId =
  sortedAthletes[0]
    ?.athlete_id

    const athleteBId =
  sortedAthletes[1]
    ?.athlete_id

    const {
      data: existingComposition
    } =
  await getDb()
    .from(
      'team_compositions'
    )
    .select(`
      composition_id,
      composition_team_id
    `)
    .eq(
      'athlete_a_id',
      athleteAId
    )
    .eq(
      'athlete_b_id',
      athleteBId
    )
    .is(
      'effective_to',
      null
    )
    .maybeSingle()

    if (
      !pilotId &&
      !stokerId
    ) {
      showError(
        'Select Pilot or Stoker'
      )

      return
    }

    let compositionTeamId

    if (
      existingComposition
    ) {
      compositionTeamId =
    existingComposition
      .composition_team_id
    } else {
      const {
        data: existingTeam
      } =
    await getDb()
      .from(
        'team_composition_master'
      )
      .select(`
        composition_team_id
      `)
      .eq(
        'composition_name',
        compositionName
      )
      .maybeSingle()

      if (
        existingTeam
      ) {
        compositionTeamId =
      existingTeam
        .composition_team_id
      } else {
        const {
          data: newTeam,
          error: teamError
        } =
      await getDb()
        .from(
          'team_composition_master'
        )
        .insert({
          composition_name:
            compositionName
        })
        .select()
        .single()

        if (
          teamError
        ) {
          throw teamError
        }

        compositionTeamId =
      newTeam
        .composition_team_id
      }
    }

    const {
      data: activeStatus,
      error: activeStatusError
    } =
      await getDb()
        .from(
          'team_composition_status_master'
        )
        .select(
          'team_composition_status_id'
        )
        .eq(
          'status_code',
          'ACTIVE'
        )
        .maybeSingle()

    if (
      activeStatusError
    ) {
      throw activeStatusError
    }

    const {
      data: teamType,
      error: teamTypeError
    } =
  await getDb()
    .from(
      'team_type_master'
    )
    .select(`
      team_type_id,
      type_code
    `)
    .eq(
      'type_code',
      'TEMPORARY'
    )


    if (
      teamTypeError
    ) {
      throw teamTypeError
    }

    const {
      error
    } =
      await getDb()
        .from(
          'team_compositions'
        )
        .insert({

          composition_team_id:
    compositionTeamId,

          athlete_a_id:
    athleteAId,

          athlete_b_id:
    athleteBId,

          pilot_id:
    pilotId || null,

          stoker_id:
    stokerId || null,

          team_type_id:
  teamType?.[0]
    ?.team_type_id,

          team_composition_status_id:
            activeStatus
              ?.team_composition_status_id || null,

          effective_from:
            new Date()
              .toISOString()
              .split(
                'T'
              )[0],

          effective_to:
            null

        })

    if (
      error
    ) {
      throw error
    }

    await ensureParticipantRegistryEntry({
      participantTypeCode: 'COMPOSITION',
      sourceId: compositionTeamId,
      displayName: compositionName
    })

    await loadParticipantRegistry()

    const newComposition =
  participants.find(
    participant =>

      participant.source_id ===
      compositionTeamId &&

      participant
        .participant_type_master
        ?.participant_type_code ===
      'COMPOSITION'
  )
    if (
      newComposition
    ) {
      selectedParticipants.push(
        newComposition
      .participant_ref_id
      )
      renderParticipants()
      renderSelectedBundle()

      setValue(
        'compositionPilotId',
        ''
      )

      setValue(
        'compositionStokerId',
        ''
      )

      setValue(
        'compositionTeamName',
        ''
      )
    }

    showSuccess(
      'Composition Created'
    )

    renderParticipants()
  } catch (
    error
  ) {

    showInlineError(
      JSON.stringify(
        error,
        null,
        2
      )
    )

    showError(
      JSON.stringify(
        error,
        null,
        2
      )
    )
  }
}

async function loadOccurrences(
  selectedEventId
) {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'event_instances'
      )
      .select(`
        event_instance_id,
        event_area
      `)
      .eq(
        'event_id',
        selectedEventId
      )
      .order(
        'event_area'
      )

  if (
    error
  ) {
    throw error
  }

  eventOccurrences =
    data || []

  eventInstanceId.innerHTML =
    `
      <option value="">
        Select Event Occurrence
      </option>
    `

  for (const occurrence of eventOccurrences) {
    eventInstanceId.innerHTML += `
        <option
          value="${occurrence.event_instance_id}">
          ${occurrence.event_area}
        </option>
      `
  }
}

async function handleOccurrenceChange() {
  const occurrence =
    eventOccurrences.find(
      row =>
        row.event_instance_id ===
        eventInstanceId.value
    )

  if (
    !occurrence
  ) {
    return
  }

  await loadPrograms(
    getValue(
        'eventId'
    )
)

  await loadOccurrenceDetails(
    occurrence.event_instance_id
  )
}

async function loadPrograms(
  selectedEventId = getValue('eventId')
) {
  programId.innerHTML = `
    <option value="">
      Select Program
    </option>
  `

  eventPrograms = []

  if (!selectedEventId) {
    return
  }

  eventPrograms =
    await getProgramsForEvent(
      selectedEventId,
      {
        includeSortOrder: true,
        filterInactivePrograms: true,
        orderBySequence: true
      }
    )

  for (const program of eventPrograms) {
    programId.innerHTML += `
      <option value="${program.program_id}">
        ${program.program_name}
      </option>
    `
  }
}

async function loadOccurrenceDetails(
  occurrenceId
) {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'event_instances'
      )
      .select(`
        *,
        subcounty_master(
          subcounty_name
        )
      `)
      .eq(
        'event_instance_id',
        occurrenceId
      )
      .single()

  if (
    error
  ) {
    throw error
  }

  setValue(
    'eventArea',
    data.event_area || ''
  )

  setValue(
    'subcountyName',
    data.subcounty_master
      ?.subcounty_name || ''
  )

  setValue(
    'organizer',
    data.organizer || ''
  )

  setValue(
    'startDate',
    data.start_date || ''
  )

  setValue(
    'startTime',
    data.start_time || ''
  )

  setValue(
    'endDate',
    data.end_date || ''
  )

  setValue(
    'endTime',
    data.end_time || ''
  )
}

function clearOccurrenceDetails() {
  setValue(
    'eventArea',
    ''
  )

  setValue(
    'subcountyName',
    ''
  )

  setValue(
    'organizer',
    ''
  )

  setValue(
    'startDate',
    ''
  )

  setValue(
    'startTime',
    ''
  )

  setValue(
    'endDate',
    ''
  )

  setValue(
    'endTime',
    ''
  )
}

async function loadParticipantRegistry() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'participant_registry'
      )
            .select(`
  participant_ref_id,
  display_name,
  source_id,
  participant_type_id,
  participant_type_master(
    participant_type_code,
    participant_type_name
  )
`)
      .eq(
        'is_active',
        true
      )
      .order(
        'display_name'
      )

  if (
    error
  ) {
    throw error
  }

  participants =
    data || []

  renderParticipants()
}

function renderParticipants() {
  availableParticipantsBody.innerHTML =
    ''

  const searchText =
    participantSearch
      ?.value
      ?.toLowerCase() || ''

  const typeFilter =
    participantTypeFilter
      ?.value || ''

  for (const participant of participants
    .filter(
      participant => {
        const nameMatch =
          participant.display_name
            ?.toLowerCase()
            .includes(
              searchText
            )

        const typeMatch =
  !typeFilter ||
  (
    participant
      .participant_type_master
      ?.participant_type_code ===
    typeFilter
  )
        return (
          nameMatch &&
          typeMatch
        )
      }
    )) {
    availableParticipantsBody.innerHTML += `
        <tr>

          <td>

           <input
  type="checkbox"
  class="participant-check"
  value="${participant.participant_ref_id}"
  ${
  selectedParticipants.includes(
    participant.participant_ref_id
  ) ?
    'checked' :
    ''
}
  onchange="toggleParticipantSelection(this)"
>

          </td>

          <td>
  ${
  participant
      .participant_type_master
      ?.participant_type_name || ''
}
</td>

          <td>
            ${participant.display_name || ''}
          </td>

        </tr>
      `
  }
}

window.toggleParticipantSelection =
  function (
    checkbox
  ) {
    const participantId =
      checkbox.value

    if (
      checkbox.checked
    ) {
      if (
        !selectedParticipants.includes(
          participantId
        )
      ) {
        selectedParticipants.push(
          participantId
        )

        renderSelectedBundle()
      }
    } else {
      selectedParticipants =
        selectedParticipants.filter(
          id =>
            id !== participantId
        )
      renderSelectedBundle()
    }
  }

async function loadParticipantStatuses() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'registration_status_master'
      )
.select(`
  registration_status_id,
  status_name,
  status_code
`)
.order(
  'status_name'
)

  if (
    error
  ) {
    throw error
  }

  participantStatuses =
    data || []

  participantStatusId.innerHTML =
    `
      <option value="">
        Select Status
      </option>
    `

  for (const status of participantStatuses) {
    participantStatusId.innerHTML += `
        <option
          value="${status.registration_status_id}">
          ${status.status_name}
        </option>
      `
  }
}

function setRegistrationSaveBusy(busy) {
  registrationSaveInFlight = busy

  const saveButton =
    document.getElementById(
      'btnSaveParticipantRegistration'
    )

  const finishButton =
    document.getElementById(
      'btnFinishParticipantRegistration'
    )

  if (saveButton) {
    saveButton.disabled = busy
  }

  if (finishButton) {
    finishButton.disabled = busy
  }
}

async function persistRegistrationSelection({
  allowEmpty = false
} = {}) {
  const occurrenceId = getValue('eventInstanceId')
  const selectedProgramId = getValue('programId')
  const participantStatus = getValue('participantStatusId')
  const participantInstanceId = getValue('participantInstanceId')
  const participantRefIds =
    [...new Set(selectedParticipants.filter(Boolean))]

  if (!occurrenceId) {
    throw new Error('Event Occurrence is required')
  }

  if (!selectedProgramId) {
    throw new Error('Program is required')
  }

  if (participantInstanceId && !participantStatus) {
    throw new Error('Participant Status is required')
  }

  if (participantRefIds.length === 0) {
    if (allowEmpty) {
      return false
    }

    throw new Error('Select at least one participant')
  }

  if (participantInstanceId) {
    await updateParticipantRegistration({
      participantInstanceId,
      eventInstanceId: occurrenceId,
      programId: selectedProgramId,
      participantRefId: participantRefIds[0],
      registrationStatusId: participantStatus
    })
  } else {
    const registeredStatus = participantStatuses.find(
      status => status.status_code === 'REGISTERED'
    )

    if (!registeredStatus?.registration_status_id) {
      throw new Error(
        'REGISTERED participant status is not configured.'
      )
    }

    await saveParticipantRegistrations({
      eventInstanceId: occurrenceId,
      programId: selectedProgramId,
      participantRefIds,
      registrationStatusId: registeredStatus.registration_status_id
    })
  }

  await loadRegistrations()
  await loadParticipantRegistry()
  renderRegisteredBundle()

  selectedParticipants = []
  renderSelectedBundle()
  renderParticipants()

  return true
}

async function saveRegistration() {
  if (registrationSaveInFlight) {
    return
  }

  setRegistrationSaveBusy(true)

  try {
    const participantInstanceId = getValue('participantInstanceId')

    await persistRegistrationSelection()

    showSuccess(
      participantInstanceId ?
        'Participants Updated' :
        'Participants Registered'
    )
  } catch (error) {
    showError(error.message)
  } finally {
    setRegistrationSaveBusy(false)
  }
}

async function finishRegistration() {
  if (registrationSaveInFlight) {
    return
  }

  setRegistrationSaveBusy(true)

  try {
    if (selectedParticipants.length > 0) {
      await persistRegistrationSelection()
    } else {
      await loadRegistrations()
      await loadParticipantRegistry()
      renderRegisteredBundle()
    }

    selectedParticipants = []
    renderSelectedBundle()
    renderParticipants()

    showSuccess(
      'All participant bundles have been saved successfully.'
    )

    hideModal(
      'participantRegistrationModal'
    )
    clearRegistrationForm()
  } catch (error) {
    showError(error.message)
  } finally {
    setRegistrationSaveBusy(false)
  }
}

async function loadRegistrations() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'participant_instances'
      )
      .select(`
        participant_instance_id,

        program_id,

        registration_status_id,

        event_instances(
          event_instance_id,
          event_id,
          event_area,
          start_date,
          start_time,
          end_date,
          end_time,
          subcounty_master(
            subcounty_name,
            county_master(
              county_name
            )
          ),
          events(
            event_name
          )
        ),

        program_master(
    program_name
),

        participant_registry(
  participant_ref_id,
  display_name,
  participant_type_id,
  participant_type_master(
    participant_type_code,
    participant_type_name
  )
),

        registration_status_master(
          status_name
        )
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      )

  if (
    error
  ) {
    throw error
  }

  participantRegistrations =
    data || []

  filteredRegistrations =
    [
      ...participantRegistrations
    ]

  loadFilterOptions()

  updateSummaryCards()

  renderRegistrations()
}

function loadFilterOptions() {
  if (
    !occurrenceFilter ||
    !programFilter
  ) {
    return
  }

  occurrenceFilter.innerHTML =
    `
      <option value="">
        All Occurrences
      </option>
    `

  const occurrences =
    [
      ...new Set(
        participantRegistrations
          .map(
            row =>
              row.event_instances
                ?.event_area
          )
          .filter(Boolean)
      )
    ]

  for (const occurrence of occurrences) {
    occurrenceFilter.innerHTML += `
        <option value="${occurrence}">
          ${occurrence}
        </option>
      `
  }

  programFilter.innerHTML =
    `
      <option value="">
        All Programs
      </option>
    `

  const programs =
[
  ...new Set(
    participantRegistrations
      .map(
        row =>
          row.program_master
            ?.program_name
      )
      .filter(Boolean)
  )
]

  for (const program of programs) {
    programFilter.innerHTML += `
        <option value="${program}">
          ${program}
        </option>
      `
  }
}

async function loadRegisteredParticipants(
  occurrenceId,
  programIdValue
) {
  const registered =
    participantRegistrations.filter(
      row =>

        row.event_instances
          ?.event_instance_id ===
        occurrenceId &&

        row.program_id ===
        programIdValue
    )

  participants =
    registered.map(
      row =>
        row.participant_registry
    )

  renderParticipants()
}



function renderRegistrations() {
  const tbody =
    document.getElementById(
      'participantRegistrationTableBody'
    )

  if (
    !tbody
  ) {
    return
  }

  tbody.innerHTML =
    ''

  const start =
  (
    currentPage - 1
  ) * pageSize

  const end =
  start + pageSize

  const pageData =
  filteredRegistrations.slice(
    start,
    end
  )

  const groupedData = {}

  for (const registration of pageData) {
    const eventName =
      registration
        .event_instances
        ?.events
        ?.event_name || ''

    const occurrence =
      registration
        .event_instances
        ?.event_area || ''

    const program =

    registration
    .program_master
    ?.program_name || ''

    const groupKey =
      `${eventName}|${occurrence}|${program}`

    if (
      !groupedData[groupKey]
    ) {
      groupedData[groupKey] = {
        eventName,
        groupKey,
        occurrence,
        program,
        registrations: []
      }
    }

    groupedData[groupKey]
      .registrations
      .push(
        registration
      )
  }

  for (const group of Object.values(
    groupedData
  )) {
    tbody.innerHTML += `

  <tr class="bundle-spacer">
    <td colspan="13"></td>
  </tr>

 <tr class="group-row">

  <td colspan="13">

    <div
      class="bundle-header"
    >

      <div class="bundle-title">

        ${group.eventName}

        |

        ${group.occurrence}

        |

        ${group.program}

      </div>

      <div class="bundle-actions">

        <button
          class="btn btn-sm btn-outline-primary me-2"
          onclick="selectBundle('${group.groupKey}')"
        >
          Select Participants
        </button>

        <button
          class="btn btn-sm btn-outline-danger"
          onclick="deleteBundle('${group.groupKey}')"
        >
          Remove Participants
        </button>

      </div>

    </div>

  </td>

</tr>
`

    for (const registration of group.registrations) {
      tbody.innerHTML += `

          <tr>

            <td>

              <input
  type="checkbox"
  class="registration-check"
  value="${registration.participant_instance_id}"
  onchange="toggleBulkDeleteButton()"
>

            </td>

            <td>
              ${
  registration
                  .event_instances
                  ?.events
                  ?.event_name || ''
}
            </td>

            <td>
              ${
  registration
                  .event_instances
                  ?.subcounty_master
                  ?.subcounty_name || ''
}
            </td>

            <td>
              ${
  registration
                  .event_instances
                  ?.event_area || ''
}
            </td>

            <td>
              ${
  formatDate(
    registration
    .event_instances
    ?.start_date
  )
}
            </td>

            <td>
              ${
  registration
                  .event_instances
                  ?.start_time || ''
}
            </td>

            <td>
              ${
  formatDate(
    registration
    .event_instances
    ?.end_date
  )
}
            </td>

            <td>
              ${
  registration
                  .event_instances
                  ?.end_time || ''
}
            </td>

            <td>
              ${
  registration
                  .program_master
                  ?.program_name || ''
}
            </td>

            <td>
              ${
  registration
                  .participant_registry
                  ?.participant_type_master
                  ?.participant_type_name || ''
}
            </td>

            <td>
              ${
  registration
                  .participant_registry
                  ?.display_name || ''
}
            </td>

            ${buildStatusCell(
    getParticipantStatusBadge(
      registration
        .registration_status_master
        ?.status_name || ''
    )
  )}

            ${buildActionCell(
    buildActionButtons({
      buttons: [
        {
          type: 'edit',
          onClick:
            `editRegistration('${registration.participant_instance_id}')`
        },
        {
          type: 'delete',
          label: 'Remove',
          onClick:
            `deleteRegistration('${registration.participant_instance_id}')`
        }
      ]
    })
  )}

          </tr>
        `
    }
  }

  renderPagination()
  toggleBulkDeleteButton()
}

window.editRegistration =
  async function (
    participantInstanceId
  ) {
    const registration =
      participantRegistrations.find(
        row =>
          row.participant_instance_id ===
          participantInstanceId
      )

    if (
      !registration
    ) {
      return
    }

    setValue(
      'participantInstanceId',
      registration.participant_instance_id
    )

    const eventMaster =
  events.find(
    event =>
      event.event_id ===
      registration
        .event_instances
        ?.event_id
  )
    if (
      !eventMaster
    ) {
      return
    }

    setValue(
      'eventId',
      eventMaster?.event_id || ''
    )

    await loadOccurrences(
      eventMaster.event_id
    )

   await loadPrograms(
    registration
        .event_instances
        ?.event_id
)

    setValue(
      'eventInstanceId',
      registration.event_instances
        ?.event_instance_id || ''
    )

    setValue(
      'programId',
      registration.program_id || ''
    )

    setValue(
      'participantStatusId',
      registration.registration_status_id || ''
    )

    await loadOccurrenceDetails(
      registration.event_instances
    ?.event_instance_id
    )

    await loadRegisteredParticipants(
      registration.event_instances
    ?.event_instance_id,

      registration.program_id
    )

    await restoreParticipant(
      registration
    .participant_registry
    ?.participant_ref_id
    )

    document
  .getElementById(
    'participantStatusCard'
  )
  ?.classList.remove(
    'd-none'
  )

    const modal =
  createModal('participantRegistrationModal')

    modal.show()
  }

async function restoreParticipant(
  participantRefId
) {
  selectedParticipants =
    [participantRefId]

  renderParticipants()
}

function newRegistration() {
  clearRegistrationForm()

  document
    .getElementById(
      'participantStatusCard'
    )
    ?.classList.add(
      'd-none'
    )

  const modal =
    createModal('participantRegistrationModal')

  modal.show()
}

function clearRegistrationForm() {
  setValue(
    'participantInstanceId',
    ''
  )

  selectedParticipants = []

  renderSelectedBundle()

  renderParticipants()

  setValue(
    'eventId',
    ''
  )

  setValue(
    'eventInstanceId',
    ''
  )

  setValue(
    'programId',
    ''
  )

  setValue(
    'participantStatusId',
    ''
  )

  setValue(
    'eventArea',
    ''
  )

  setValue(
    'subcountyName',
    ''
  )

  setValue(
    'organizer',
    ''
  )

  setValue(
    'startDate',
    ''
  )

  setValue(
    'startTime',
    ''
  )

  setValue(
    'endDate',
    ''
  )

  setValue(
    'endTime',
    ''
  )

  for (const checkbox of document
    .querySelectorAll(
      '.participant-check'
    )) {
    checkbox.checked =
          false
  }

  eventInstanceId.innerHTML =
    `
      <option value="">
        Select Event Occurrence
      </option>
    `

  programId.innerHTML =
    `
      <option value="">
        Select Program
      </option>
    `

  clearOccurrenceDetails()

}

function applyFilters() {
  filteredRegistrations =
    participantRegistrations.filter(
      registration => {
        const occurrenceMatch =

    !occurrenceFilter.value ||

    registration
        .event_instances
        ?.event_area ===

    occurrenceFilter.value

        const programMatch =

    !programFilter.value ||

    registration
        .program_master
        ?.program_name ===

    programFilter.value

        return (
          occurrenceMatch &&
          programMatch
        )
      }
    )

  currentPage = 1

  renderRegistrations()
}

function searchRegistrations() {
  const searchText =
    document
      .getElementById(
        'searchParticipantRegistration'
      )
      .value
      .toLowerCase()

  filteredRegistrations =
    participantRegistrations.filter(
      registration => {
        const eventName =
          registration
            .event_instances
            ?.events
            ?.event_name || ''

        const eventArea =
          registration
            .event_instances
            ?.event_area || ''

        const participantName =
          registration
            .participant_registry
            ?.display_name || ''

        return (
          eventName
            .toLowerCase()
            .includes(
              searchText
            ) ||
          eventArea
            .toLowerCase()
            .includes(
              searchText
            ) ||
          participantName
            .toLowerCase()
            .includes(
              searchText
            )
        )
      }
    )

  currentPage = 1

  renderRegistrations()
}

function updateSummaryCards() {
  const totalRegistrations =
    document.getElementById(
      'totalRegistrations'
    )

  const totalTeams =
    document.getElementById(
      'totalTeams'
    )

  const totalAthletes =
    document.getElementById(
      'totalAthletes'
    )

  if (
    !totalRegistrations
  ) {
    return
  }

  totalRegistrations.textContent =
    participantRegistrations.length

  totalTeams.textContent =
  participantRegistrations.filter(
    row =>
      row.participant_registry
        ?.participant_type_master
        ?.participant_type_code ===
      'TEAM'
  ).length

  totalAthletes.textContent =
  participantRegistrations.filter(
    row =>
      row.participant_registry
        ?.participant_type_master
        ?.participant_type_code ===
      'ATHLETE'
  ).length

  const countyCounts = {}

  for (const row of participantRegistrations) {
    const county =
      row.event_instances
        ?.subcounty_master
        ?.county_master
        ?.county_name

    if (
      county
    ) {
      countyCounts[county] =
        (
          countyCounts[county] || 0
        ) + 1
    }
  }

  const topCounty =
  Object.entries(
    countyCounts
  )
    .sort(
      (
        a,
        b
      ) =>
        b[1] - a[1]
    )[0]

  const topCountyCard =
  document.getElementById(
    'topCounty'
  )

  if (
    topCountyCard
  ) {
    topCountyCard.textContent =
    topCounty?.[0] || '-'
  }

  const programCounts = {}

  for (const row of participantRegistrations) {
   const program =

    row.program_master
        ?.program_name
    if (
      program
    ) {
      programCounts[program] =
        (
          programCounts[program] || 0
        ) + 1
    }
  }

  const topProgram =
  Object.entries(
    programCounts
  )
    .sort(
      (
        a,
        b
      ) =>
        b[1] - a[1]
    )[0]

  const topProgramCard =
  document.getElementById(
    'topProgram'
  )

  if (
    topProgramCard
  ) {
    topProgramCard.textContent =
    topProgram?.[0] || '-'
  }

  const participated =
  participantRegistrations.filter(
    row =>
      row.registration_status_master
        ?.status_name ===
      'Participated'
  ).length

  const attendanceRate =
  participantRegistrations.length ?
    Math.round(
      (
        participated /
          participantRegistrations.length
      ) * 100
    ) :
    0

  const attendanceRateCard =
  document.getElementById(
    'attendanceRate'
  )

  if (
    attendanceRateCard
  ) {
    attendanceRateCard.textContent =
    `${attendanceRate}%`
  }
}

const renderPagination =
  createNumberedPaginationRenderer({
    getItemCount: () =>
      filteredRegistrations.length,
    getCurrentPage: () =>
      currentPage,
    pageSize,
    containerId:
      'paginationContainer',
    handlerName:
      'changePage',
    control:
      'button'
  })


window.changePage =
  function (
    page
  ) {
    currentPage =
      page

    renderRegistrations()
  }

function exportExcel() {
  const rows =
    participantRegistrations.map(
      registration => {
        return {

          event:
            registration
              .event_instances
              ?.events
              ?.event_name,

          occurrence:
            registration
              .event_instances
              ?.event_area,

          program:
    registration
        .program_master
        ?.program_name,

          participant:
            registration
              .participant_registry
              ?.display_name,

          status:
            registration
              .registration_status_master
              ?.status_name
        }
      }
    )


  showSuccess(
    'Excel Export Ready'
  )
}



function bulkDeleteRegistrations() {
  const selectedIds =
    [
      ...document.querySelectorAll(
        '.registration-check:checked'
      )
    ].map(
      checkbox => checkbox.value
    )

  if (
    selectedIds.length === 0
  ) {
    showError(
      'Please select at least one participant to remove.'
    )

    return
  }

  showDeleteConfirmation(
    null,
    selectedIds
  )
}

async function bulkStatusUpdate() {
  const selectedStatus =
    getValue(
      'participantStatusId'
    )

  const occurrenceId =
    getValue(
      'eventInstanceId'
    )

  const programIdValue =
    getValue(
      'programId'
    )
  if (
    !selectedStatus
  ) {
    showError(
      'Select Status'
    )

    return
  }

  if (
    !occurrenceId
  ) {
    showError(
      'Select Event Occurrence'
    )

    return
  }

  if (
    !programIdValue
  ) {
    showError(
      'Select Program'
    )

    return
  }

  const checked =
    [
      ...document.querySelectorAll(
        '.participant-check:checked'
      )
    ]

  if (
    checked.length === 0
  ) {
    showError(
      'Select participants'
    )

    return
  }

  const participantInstanceIds =
  participantRegistrations
    .filter(
      registration =>

        registration
          .event_instances
          ?.event_instance_id ===
        occurrenceId &&

        registration.program_id ===
        programIdValue &&

        checked.some(
          checkbox =>
            checkbox.value ===
            registration
              .participant_registry
              ?.participant_ref_id
        )
    )
    .map(
      registration =>
        registration
          .participant_instance_id
    )

  const {
    error
  } =
    await getDb()
      .from(
        'participant_instances'
      )
      .update({
        registration_status_id:
          selectedStatus
      })
      .eq(
        'event_instance_id',
        occurrenceId
      )
      .eq(
        'program_id',
        programIdValue
      )
      .in(
        'participant_instance_id',
        participantInstanceIds
      )

  if (
    error
  ) {
    throw error
  }

  await loadRegistrations()

  showSuccess(
    'Statuses Updated'
  )
}

async function confirmDeleteRegistrations() {
  try {
    const {
      error
    } =
      await getDb()
        .from(
          'participant_instances'
        )
        .delete()
        .in(
          'participant_instance_id',
          pendingDeleteIds
        )

    if (
      error
    ) {
      throw error
    }

    await loadRegistrations()

    showSuccess(
      pendingDeleteIds.length === 1 ?
        'Participant removed from the event successfully.' :
        `${pendingDeleteIds.length} participants removed from the event successfully.`
    )

    hideModal(
      'deleteRegistrationModal'
    )
  } catch (
    error
  ) {
    showError(
      error.message
    )
  }
}

window.deleteRegistration =
  async function (
    participantInstanceId
  ) {
    showDeleteConfirmation(
      participantInstanceId
    )
  }

window.selectBundle =
  function (
    groupKey
  ) {
    const registrations =
      participantRegistrations.filter(
        registration => {
          const eventName =
            registration
              .event_instances
              ?.events
              ?.event_name || ''

          const occurrence =
            registration
              .event_instances
              ?.event_area || ''

          const program =
            registration
              .event_programs
              ?.program_name || ''

          return (
            `${eventName}|${occurrence}|${program}` ===
            groupKey
          )
        }
      )

    const bundleCheckboxes =
      registrations
        .map(
          registration =>
            document.querySelector(
              `.registration-check[value="${registration.participant_instance_id}"]`
            )
        )
        .filter(Boolean)

    const allSelected =
      bundleCheckboxes.every(
        checkbox =>
          checkbox.checked
      )

    for (const checkbox of bundleCheckboxes) {
      checkbox.checked =
          !allSelected
    }

    toggleBulkDeleteButton()
  }

window.deleteBundle =
  function (
    groupKey
  ) {
    const ids =
      participantRegistrations
        .filter(
          registration => {
            const eventName =
              registration
                .event_instances
                ?.events
                ?.event_name || ''

            const occurrence =
              registration
                .event_instances
                ?.event_area || ''

            const program =

    registration
        .program_master
        ?.program_name || ''

            return (
              `${eventName}|${occurrence}|${program}` ===
              groupKey
            )
          }
        )
        .map(
          registration =>
            registration
              .participant_instance_id
        )

    showDeleteConfirmation(
      null,
      ids
    )
  }

window.toggleBulkDeleteButton =
  function () {
    const button =
      document.getElementById(
        'btnBulkDelete'
      )

    if (
      !button
    ) {
      return
    }

    const checked =
      document.querySelectorAll(
        '.registration-check:checked'
      ).length

    button.classList.toggle(
      'd-none',
      checked === 0
    )
  }
