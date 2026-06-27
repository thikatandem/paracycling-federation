// =====================================================
// EVENTS MODULE
// ParaCycling Federation Management System
// =====================================================

/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

let events = []

let eventOccurrences = []

let eventPrograms = []

let participants = []

let participantStatuses = []

let registrations = []

let filteredRegistrations = []

let selectedParticipants = []

let participantRegistrations = []

let pendingDeleteIds = []

let currentPage = 1

const pageSize = 10


function setValue(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    )

  if (
    element
  ) {

    element.value =
      value
  }
}

function getValue(
  id
) {

  return (
    document.getElementById(
      id
    )?.value || ''
  )
}


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
function showSuccess(
  message
) {

  const successBox =
    document.getElementById(
      'participantRegistrationSuccess'
    )

  if (
    successBox
  ) {

    successBox.textContent =
      message

    successBox.classList.remove(
      'd-none'
    )

    setTimeout(
      () =>
        successBox.classList.add(
          'd-none'
        ),
      3000
    )
  }
}

function showError(
  message
) {

  const errorBox =
    document.getElementById(
      'participantRegistrationError'
    )

  if (
    errorBox
  ) {

    errorBox.textContent =
      message

    errorBox.classList.remove(
      'd-none'
    )

    setTimeout(
      () =>
        errorBox.classList.add(
          'd-none'
        ),
      5000
    )
  }
}


function showDeleteConfirmation(
  participantInstanceId = null,
  participantInstanceIds = []
) {

  pendingDeleteIds =
    participantInstanceId
      ? [participantInstanceId]
      : participantInstanceIds

  document.getElementById(
  'deleteRegistrationMessage'
).textContent =
  pendingDeleteIds.length === 1

    ? 'Remove this participant from the selected event?'

    : `WARNING: You are about to remove ${pendingDeleteIds.length} participants. This action cannot be undone.`

  coreui.Modal
    .getOrCreateInstance(
      document.getElementById(
        'deleteRegistrationModal'
      )
    )
    .show()
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
    checked === 1
      ? 'Remove 1 Selected Participant'
      : `Remove ${checked} Selected Participants`
}
}


async function initializeParticipants() {

  try {

    bindEvents()

    await loadEvents()

    await loadParticipantStatuses()

    await loadParticipantRegistry()

    await loadRegistrations()

  } catch (
    error
  ) {

    console.error(
      error
    )
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
    renderParticipants
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
    await window
      .supabaseClient
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

  events.forEach(
    event => {

      eventId.innerHTML += `
        <option
          value="${event.event_id}">
          ${event.event_name}
        </option>
      `
    }
  )
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

async function loadOccurrences(
  selectedEventId
) {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
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

  eventOccurrences.forEach(
    occurrence => {

      eventInstanceId.innerHTML += `
        <option
          value="${occurrence.event_instance_id}">
          ${occurrence.event_area}
        </option>
      `
    }
  )
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

  await loadPrograms()

  await loadOccurrenceDetails(
    occurrence.event_instance_id
  )
}

async function loadPrograms() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_programs'
      )
      .select(`
        program_id,
        program_name
      `)
      .eq(
        'event_id',
        eventId.value
      )
      .order(
        'program_name'
      )

  if (
    error
  ) {

    throw error
  }

  eventPrograms =
    data || []

  programId.innerHTML =
    `
      <option value="">
        Select Program
      </option>
    `

  eventPrograms.forEach(
    program => {

      programId.innerHTML += `
        <option
          value="${program.program_id}">
          ${program.program_name}
        </option>
      `
    }
  )
}

async function loadOccurrenceDetails(
  occurrenceId
) {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
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
    await window
      .supabaseClient
      .from(
        'participant_registry'
      )
      .select(`
        participant_ref_id,
display_name,
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

  participants
    .filter(
      participant => {

        const nameMatch =
          participant.display_name
            ?.toLowerCase()
            .includes(
              searchText
            )

        const typeMatch =
          !typeFilter
          ||
          participant
            .participant_type_master
            ?.participant_type_code ===
          typeFilter

        return (
          nameMatch &&
          typeMatch
        )
      }
    )
    .forEach(
    participant => {

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
    )
      ? 'checked'
      : ''
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
  )
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
      }

    } else {

      selectedParticipants =
        selectedParticipants.filter(
          id =>
            id !== participantId
        )

    }

  }



async function loadParticipantStatuses() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
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

  participantStatuses.forEach(
    status => {

      participantStatusId.innerHTML += `
        <option
          value="${status.registration_status_id}">
          ${status.status_name}
        </option>
      `
    }
  )
}

async function saveRegistration() {

  try {

    const occurrenceId =
      getValue(
        'eventInstanceId'
      )

    const selectedProgramId =
      getValue(
        'programId'
      )

    const participantStatus =
      getValue(
        'participantStatusId'
      )

const registeredStatus =
  participantStatuses.find(
    status =>
      status.status_code ===
      'REGISTERED'
  )

const participantInstanceId =
  getValue(
    'participantInstanceId'
  )


    if (
      !occurrenceId
    ) {

      showError(
        'Event Occurrence is required'
      )

      return
    }

    if (
      !selectedProgramId
    ) {

      showError(
        'Program is required'
      )

      return
    }

    if (
  participantInstanceId &&
  !participantStatus
) {

  showError(
    'Participant Status is required'
  )

  return
}

    const checkedParticipants =
  selectedParticipants.map(
    participantId => ({
      value: participantId
    })
  )

    if (
      checkedParticipants.length === 0
    ) {

      showError(
        'Select at least one participant'
      )

      return
    }
   
 
   if (
  participantInstanceId
) {

  const selectedParticipant =
    checkedParticipants[0]

  const {
    error
  } =
    await window
      .supabaseClient
      .from(
        'participant_instances'
      )
      .update({

        event_instance_id:
          occurrenceId,

        participant_ref_id:
          selectedParticipant.value,
registration_status_id:
  participantStatus,

        program_id:
          selectedProgramId,

      })
      .eq(
        'participant_instance_id',
        participantInstanceId
      )

  if (
    error
  ) {

    throw error
  }

  await loadRegistrations()

  showSuccess(
    'Registration Updated'
  )
const modalElement =
  document.getElementById(
    'participantRegistrationModal'
  )

const modal =
  coreui.Modal.getOrCreateInstance(
    modalElement
  )

modal.hide()

clearRegistrationForm()
  return
}
    const duplicateParticipants =
  checkedParticipants.filter(
    checkbox =>

      participantRegistrations.some(
        registration =>

          registration
            .event_instances
            ?.event_instance_id ===
          occurrenceId

          &&

          registration.program_id ===
          selectedProgramId

          &&

          registration
            .participant_registry
            ?.participant_ref_id ===
          checkbox.value
      )
  )

if (
  duplicateParticipants.length > 0 &&
  !getValue(
    'participantInstanceId'
  )
) {

  showError(
    'Registration already exists'
  )

  return
}

    const rows =
      checkedParticipants.map(
        checkbox => {

          return {

            event_instance_id:
              occurrenceId,

            participant_ref_id:
              checkbox.value,

            registration_status_id:
             registeredStatus
             ?.registration_status_id,

            program_id:
              selectedProgramId
          }
        }
      )

    const {
      error
    } =
      await window
        .supabaseClient
        .from(
          'participant_instances'
        )
        .upsert(
          rows,
          {
            onConflict:
            'event_instance_id,program_id,participant_ref_id'
          }
        )

    if (
      error
    ) {

      throw error
    }

    await loadRegistrations()

    showSuccess(
      'Participants Registered'
    )
const modalElement =
  document.getElementById(
    'participantRegistrationModal'
  )

const modal =
  coreui.Modal.getOrCreateInstance(
    modalElement
  )

modal.hide()

clearRegistrationForm()
  } catch (
    error
  ) {

    console.error(
      error
    )

    showError(
      error.message
    )
  }
}

async function loadRegistrations() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
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

        event_programs(
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

  occurrences.forEach(
    occurrence => {

      occurrenceFilter.innerHTML += `
        <option value="${occurrence}">
          ${occurrence}
        </option>
      `
    }
  )

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
              row.event_programs
                ?.program_name
          )
          .filter(Boolean)
      )
    ]

  programs.forEach(
    program => {

      programFilter.innerHTML += `
        <option value="${program}">
          ${program}
        </option>
      `
    }
  )
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
        occurrenceId

        &&

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

function formatDate(
  value
) {

  if (
    !value
  ) {

    return ''

  }

  return new Date(
    value
  ).toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  )

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

pageData.forEach(
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
)

Object.values(
  groupedData
).forEach(
  group => {

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

<tr class="bundle-column-header">

  <th>Type</th>

  <th>Participant</th>

  <th>Status</th>

  <th>Actions</th>

</tr>
`

    group.registrations.forEach(
      registration => {

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
                  .event_programs
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

            <td>

${(() => {

  const status =
    registration
      .registration_status_master
      ?.status_name || ''

  const cssClass =
    `status-${
      status
        .toLowerCase()
        .replaceAll(
          ' ',
          '-'
        )
    }`

  return `
    <span
      class="badge ${cssClass}"
    >
      ${status}
    </span>
  `

})()}

</td>

            <td class="text-nowrap">

              <button
                class="btn btn-sm btn-primary me-1"
                onclick="editRegistration('${registration.participant_instance_id}')"
              >
                Edit
              </button>

              <button
                class="btn btn-sm btn-danger"
                onclick="deleteRegistration('${registration.participant_instance_id}')"
              >
                Remove
              </button>

            </td>

          </tr>
        `
      }
    )
  }
)
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

await loadPrograms()


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
  new coreui.Modal(
    document.getElementById(
      'participantRegistrationModal'
    )
  )

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
    new coreui.Modal(
      document.getElementById(
        'participantRegistrationModal'
      )
    )

  modal.show()

}

function clearRegistrationForm() {

  setValue(
    'participantInstanceId',
    ''
  )

selectedParticipants = []

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

  document
    .querySelectorAll(
      '.participant-check'
    )
    .forEach(
      checkbox =>
        checkbox.checked =
          false
    )
}

function applyFilters() {

  filteredRegistrations =
    participantRegistrations.filter(
      registration => {

        const occurrenceMatch =
          !occurrenceFilter.value
          ||
          registration
            .event_instances
            ?.event_area ===
          occurrenceFilter.value

        const programMatch =
          !programFilter.value
          ||
          registration
            .event_programs
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
            )
          ||
          eventArea
            .toLowerCase()
            .includes(
              searchText
            )
          ||
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

participantRegistrations.forEach(
  row => {

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
)

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

participantRegistrations.forEach(
  row => {

    const program =
      row.event_programs
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
)

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
  participantRegistrations.length
    ? Math.round(
        (
          participated /
          participantRegistrations.length
        ) * 100
      )
    : 0

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


function renderPagination() {

  const container =
    document.getElementById(
      'paginationContainer'
    )

  if (
    !container
  ) {

    return
  }

  const totalPages =
    Math.ceil(
      filteredRegistrations.length /
      pageSize
    )

  container.innerHTML =
    ''

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {

    container.innerHTML += `

      <li class="page-item ${page === currentPage ? 'active' : ''}">

        <button
          class="page-link"
          onclick="changePage(${page})"
        >

          ${page}

        </button>

      </li>
    `
  }
}

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
              .event_programs
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

  console.table(
    rows
  )

  showSuccess(
    'Excel Export Ready'
  )
}

function exportPdf() {

  window.print()
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
        occurrenceId

        &&

        registration.program_id ===
        programIdValue

        &&

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
    await window
      .supabaseClient
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
      await window
        .supabaseClient
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
      pendingDeleteIds.length === 1
        ? 'Participant removed from the event successfully.'
        : `${pendingDeleteIds.length} participants removed from the event successfully.`
    )

    coreui.Modal
      .getOrCreateInstance(
        document.getElementById(
          'deleteRegistrationModal'
        )
      )
      .hide()

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

    bundleCheckboxes.forEach(
      checkbox => {

        checkbox.checked =
          !allSelected

      }
    )

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
                .event_programs
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