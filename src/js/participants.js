/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

let participants = []
let filteredParticipants = []

let events = []
let teams = []
let statuses = []

let currentPage = 1

const participantLoading =
  document.getElementById(
    'participantLoading'
  )

const participantsTableBody =
  document.getElementById(
    'participantsTableBody'
  )

const searchParticipant =
  document.getElementById(
    'searchParticipant'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  )

const participantFormError =
  document.getElementById(
    'participantFormError'
  )
function showLoading() {

  participantLoading
    ?.classList
    .remove('d-none')
}

function hideLoading() {

  participantLoading
    ?.classList
    .add('d-none')
}

function showError(
  message
) {

  if (
    participantFormError
  ) {

    participantFormError.textContent =
      message
  }
}

function clearError() {

  if (
    participantFormError
  ) {

    participantFormError.textContent =
      ''
  }
}

function getValue(
  id
) {

  return (
    document
      .getElementById(id)
      ?.value || ''
  )
}

function setValue(
  id,
  value
) {

  const element =
    document
      .getElementById(id)

  if (
    element
  ) {

    element.value =
      value || ''
  }
}
async function loadEvents() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .select(`
        event_id,
        event_name
      `)
      .order(
        'event_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  events =
    data || []

  const select =
    document
      .getElementById(
        'eventId'
      )

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select Event
    </option>
    `

  for (
    const event
    of events
  ) {

    select.innerHTML += `
      <option
        value="${event.event_id}"
      >
        ${event.event_name}
      </option>
    `
  }
}
async function loadTeams() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from('teams')
      .select(`
        team_id,
        team_name
      `)
      .order(
        'team_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  teams =
    data || []

  const select =
    document
      .getElementById(
        'teamId'
      )

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select Team
    </option>
    `

  for (
    const team
    of teams
  ) {

    select.innerHTML += `
      <option
        value="${team.team_id}"
      >
        ${team.team_name}
      </option>
    `
  }
}
async function loadStatuses() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'status_master'
      )
      .select('*')
      .eq(
        'entity_type',
        'PARTICIPANT'
      )
      .order(
        'status_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  statuses =
    data || []

  const select =
    document
      .getElementById(
        'statusId'
      )

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select Status
    </option>
    `

  for (
    const status
    of statuses
  ) {

    select.innerHTML += `
      <option
        value="${status.status_id}"
      >
        ${status.status_name}
      </option>
    `
  }
}
function clearParticipantForm() {

  clearError()

  setValue(
    'participantId',
    ''
  )

  setValue(
    'eventId',
    ''
  )

  setValue(
    'teamId',
    ''
  )

  setValue(
    'statusId',
    ''
  )

  setValue(
    'registrationDate',
    new Date()
      .toISOString()
      .split('T')[0]
  )
}
async function loadParticipants() {

  try {

    showLoading()

    const {
      data,
      error
    } =
      await window
        .supabaseClient
        .from(
          'event_participants'
        )
        .select(`
          participant_id,
          registration_date,
          event_id,
          team_id,
          status_id,

          events (
            event_name
          ),

          teams (
            team_name
          ),

          status_master (
            status_name
          )
        `)
        .order(
          'registration_date',
          {
            ascending: false
          }
        )

    if (error) {
      throw error
    }

    participants =
      data || []

    filteredParticipants =
      [...participants]

    renderParticipants()

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

    hideLoading()

  }
} 
function renderParticipants() {

  if (
    !participantsTableBody
  ) {
    return
  }

  const start =
    (
      currentPage - 1
    ) * PAGE_SIZE

  const end =
    start + PAGE_SIZE

  const rows =
    filteredParticipants.slice(
      start,
      end
    )

  participantsTableBody.innerHTML =
    ''

  if (
    rows.length === 0
  ) {

    participantsTableBody.innerHTML =
      `
      <tr>
        <td colspan="5"
            class="text-center">
          No participants found
        </td>
      </tr>
      `

    updatePagination()

    return
  }

  for (
    const participant
    of rows
  ) {

    participantsTableBody.innerHTML += `
      <tr>

        <td>
          ${
            participant.events
              ?.event_name || ''
          }
        </td>

        <td>
          ${
            participant.teams
              ?.team_name || ''
          }
        </td>

        <td>
          ${
            participant.registration_date
              ?
              participant
                .registration_date
                .split('T')[0]
              :
              ''
          }
        </td>

        <td>
          ${
            participant.status_master
              ?.status_name || ''
          }
        </td>

        <td>

          <button
            class="btn btn-warning btn-sm me-1"
            onclick="editParticipant('${participant.participant_id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-danger btn-sm"
            onclick="confirmDeleteParticipant('${participant.participant_id}')"
          >
            Delete
          </button>

        </td>

      </tr>
    `
  }

  updatePagination()
}
function searchParticipants() {

  const search =
    (
      searchParticipant
        ?.value || ''
    )
      .trim()
      .toLowerCase()

  if (!search) {

    filteredParticipants =
      [...participants]

  } else {

    filteredParticipants =
      participants.filter(
        participant =>

          (
            participant.events
              ?.event_name || ''
          )
            .toLowerCase()
            .includes(search)

          ||

          (
            participant.teams
              ?.team_name || ''
          )
            .toLowerCase()
            .includes(search)

          ||

          (
            participant
              .status_master
              ?.status_name || ''
          )
            .toLowerCase()
            .includes(search)
      )
  }

  currentPage = 1

  renderParticipants()
}
function updatePagination() {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredParticipants.length /
        PAGE_SIZE
      )
    )

  if (
    paginationInfo
  ) {

    paginationInfo.textContent =
      `
      Page ${currentPage}
      of ${totalPages}
      `
  }

  const previousButton =
    document.getElementById(
      'btnPreviousPage'
    )

  const nextButton =
    document.getElementById(
      'btnNextPage'
    )

  if (
    previousButton
  ) {

    previousButton.disabled =
      currentPage <= 1
  }

  if (
    nextButton
  ) {

    nextButton.disabled =
      currentPage >= totalPages
  }
}
async function saveParticipant() {

  try {

    clearError()

    const participantId =
      getValue(
        'participantId'
      )

    const eventId =
      getValue(
        'eventId'
      )

    const teamId =
      getValue(
        'teamId'
      )

    const registrationDate =
      getValue(
        'registrationDate'
      )

    const statusId =
      getValue(
        'statusId'
      )

    if (!eventId) {
      return showError(
        'Event is required'
      )
    }

    if (!teamId) {
      return showError(
        'Team is required'
      )
    }

    if (!statusId) {
      return showError(
        'Status is required'
      )
    }

    if (
      !participantId
    ) {

      const duplicate =
        participants.find(
          p =>

            p.event_id ===
              eventId

            &&

            p.team_id ===
              teamId
        )

      if (
        duplicate
      ) {

        return showError(
          'Team already registered for this event'
        )
      }
    }

    const payload = {

      event_id:
        eventId,

      team_id:
        teamId,

      registration_date:
        registrationDate,

      status_id:
        statusId
    }

    let error

    if (
      participantId
    ) {

      const result =
        await window
          .supabaseClient
          .from(
            'event_participants'
          )
          .update(
            payload
          )
          .eq(
            'participant_id',
            participantId
          )

      error =
        result.error

    } else {

      const result =
        await window
          .supabaseClient
          .from(
            'event_participants'
          )
          .insert(
            payload
          )

      error =
        result.error
    }

    if (
      error
    ) {
      throw error
    }

    const modal =
      coreui.Modal
        .getInstance(
          document.getElementById(
            'participantModal'
          )
        )

    modal?.hide()

    await loadParticipants()

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
window.editParticipant =
function (
  participantId
) {

  const participant =
    participants.find(
      p =>
        p.participant_id ===
        participantId
    )

  if (
    !participant
  ) {
    return
  }

  clearParticipantForm()

  setValue(
    'participantId',
    participant.participant_id
  )

  setValue(
    'eventId',
    participant.event_id
  )

  setValue(
    'teamId',
    participant.team_id
  )

  setValue(
    'registrationDate',
    participant.registration_date
      ?.split('T')[0]
  )

  setValue(
    'statusId',
    participant.status_id
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'participantModal'
      )
    )

  modal.show()
}
window.confirmDeleteParticipant =
function (
  participantId
) {

  setValue(
    'deleteParticipantId',
    participantId
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'deleteParticipantModal'
      )
    )

  modal.show()
}

async function deleteParticipant() {

  try {

    const participantId =
      getValue(
        'deleteParticipantId'
      )

    if (
      !participantId
    ) {
      return
    }

    const {
      error
    } =
      await window
        .supabaseClient
        .from(
          'event_participants'
        )
        .delete()
        .eq(
          'participant_id',
          participantId
        )

    if (
      error
    ) {
      throw error
    }

    const modal =
      coreui.Modal
        .getInstance(
          document.getElementById(
            'deleteParticipantModal'
          )
        )

    modal?.hide()

    await loadParticipants()

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
function wireEvents() {

  document
    .getElementById(
      'btnAddParticipant'
    )
    ?.addEventListener(
      'click',
      () => {

        clearParticipantForm()

        new coreui.Modal(
          document.getElementById(
            'participantModal'
          )
        ).show()
      }
    )

  document
    .getElementById(
      'btnSaveParticipant'
    )
    ?.addEventListener(
      'click',
      saveParticipant
    )

  document
    .getElementById(
      'btnRefreshParticipants'
    )
    ?.addEventListener(
      'click',
      loadParticipants
    )

  document
    .getElementById(
      'btnConfirmDeleteParticipant'
    )
    ?.addEventListener(
      'click',
      deleteParticipant
    )

  document
    .getElementById(
      'searchParticipant'
    )
    ?.addEventListener(
      'input',
      searchParticipants
    )

  document
    .getElementById(
      'btnPreviousPage'
    )
    ?.addEventListener(
      'click',
      () => {

        if (
          currentPage > 1
        ) {

          currentPage--

          renderParticipants()
        }
      }
    )

  document
    .getElementById(
      'btnNextPage'
    )
    ?.addEventListener(
      'click',
      () => {

        const totalPages =
          Math.ceil(
            filteredParticipants.length /
            PAGE_SIZE
          )

        if (
          currentPage <
          totalPages
        ) {

          currentPage++

          renderParticipants()
        }
      }
    )
}
async function initializeParticipants() {

  try {

    await loadEvents()

    await loadTeams()

    await loadStatuses()

    await loadParticipants()

    wireEvents()

  } catch (
    error
  ) {

    console.error(
      error
    )
  }
}

document
  .addEventListener(
    'DOMContentLoaded',
    initializeParticipants
  )