/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

let participants = []
let filteredParticipants = []

let events = []
let teams = []

let athletes = []

let registrationType =
  'TEAM'
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

const availableTeamsBody =
  document.getElementById(
    'availableTeamsBody'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  )

const participantFormError =
  document.getElementById(
    'participantFormError'
  )
const participantSuccess =
  document.getElementById(
    'participantSuccess'
  )

const participantError =
  document.getElementById(
    'participantError'
  )
function getSelectedProgramId() {

  return getValue(
    'selectedProgramId'
  )

}
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

  if (
    participantSuccess
  ) {

    participantSuccess.textContent =
      ''
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

function showSuccess(
  message
) {

  if (
    participantSuccess
  ) {

    participantSuccess.textContent =
      message
  }

  if (
    participantError
  ) {

    participantError.textContent =
      ''
  }
}

function clearSuccess() {

  if (
    participantSuccess
  ) {

    participantSuccess.textContent =
      ''
  }
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

function getSelectedEventId() {

  return getValue(
    'selectedEventId'
  )
}
async function loadEventDropdown() {

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
        'selectedEventId'
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
function updateEventHeader() {

  const eventId =
    getSelectedEventId()

  const event =
    events.find(
      e =>
        e.event_id ===
        eventId
    )

  if (!event) {
    return
  }

  const title =
    document.getElementById(
      'selectedEventTitle'
    )

  const date =
    document.getElementById(
      'selectedEventDate'
    )

  if (title) {

    title.textContent =
      `Registered Teams For ${event.event_name}`
  }

  if (date) {

    date.textContent = ''
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
        'status_master'
      )
      .select(`
        status_id,
        status_name
      `)
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

function renderAvailableTeams() {

  if (
    !availableTeamsBody
  ) {
    return
  }

  availableTeamsBody.innerHTML =
    ''

  for (
    const team
    of teams
  ) {

    availableTeamsBody.innerHTML += `
      <tr>

        <td>

          <input
            type="checkbox"
            class="team-checkbox"
            value="${team.team_id}"
          >

        </td>

        <td>

          <strong>
            ${team.team_name}
          </strong>

          ${
            team.team_nickname
              ?
              `<br>
               <small class="text-muted">
                 (${team.team_nickname})
               </small>`
              :
              ''
          }

        </td>

      </tr>
    `
  }
}
async function loadAvailableTeams() {

  const eventId =
    getSelectedEventId()

  const {
    data: allTeams,
    error
  } =
    await window
      .supabaseClient
      .from('teams')
      .select(`
        team_id,
        team_name,
        team_nickname
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

  if (!eventId) {

    teams =
      allTeams || []

    renderAvailableTeams()

    return
  }

  const {
    data: registered
  } =
    await window
      .supabaseClient
      .from(
        'event_participants'
      )
      .select(
        'team_id'
      )
      .eq(
        'event_id',
        eventId
      )

  const registeredIds =
    new Set(
      (registered || [])
        .map(
          participant =>
            participant.team_id
        )
    )

  teams =
    (allTeams || [])
      .filter(
        team =>
          !registeredIds.has(
            team.team_id
          )
      )

  renderAvailableTeams()
}

async function loadAvailableAthletes() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from('athletes')
      .select(`
        athlete_id,
        athlete_code,
        first_name,
        last_name
      `)
      .eq(
        'status',
        'Active'
      )
      .order(
        'first_name'
      )

  if (error) {
    console.error(error)
    return
  }

  athletes =
    data || []

  renderAvailableAthletes()
}

function renderAvailableAthletes() {

  availableTeamsBody.innerHTML =
    ''

  athletes.forEach(
    athlete => {

      availableTeamsBody.innerHTML += `
        <tr>

          <td>

            <input
              type="checkbox"
              class="athlete-checkbox"
              value="${athlete.athlete_id}"
            >

          </td>

          <td>

            ${athlete.athlete_code}

            -
            ${athlete.first_name}

            ${athlete.last_name}

          </td>

        </tr>
      `
    }
  )
}
async function detectRegistrationType() {

  const eventId =
    getSelectedEventId()

  if (!eventId) {
    return
  }

  const {
    data
  } =
    await window.supabaseClient
      .from('events')
      .select(`
        event_category
      `)
      .eq(
        'event_id',
        eventId
      )
      .single()

  if (
    data?.event_category ===
    'TRAINING'
  ) {

    registrationType =
      'ATHLETE'

    document.getElementById(
      'registrationTypeAthlete'
    ).checked = true

    loadAvailableAthletes()

  } else {

    registrationType =
      'TEAM'

    document.getElementById(
      'registrationTypeTeam'
    ).checked = true

    loadAvailableTeams()
  }
}

function getSelectedTeamIds() {

  return Array
    .from(
      document.querySelectorAll(
        '.team-checkbox:checked'
      )
    )
    .map(
      checkbox =>
        checkbox.value
    )
}
async function loadEventParticipants() {

  try {

    const eventId =
      getSelectedEventId()

    if (!eventId) {

      participants = []

      filteredParticipants = []

      renderParticipants()

      return
    }

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
  athlete_id,
  status_id,
  program_id,

  teams (
    team_name,
    team_nickname
  ),

  athletes (
    first_name,
    last_name,
    athlete_code
  ),

  event_programs (
    program_name
  ),

  status_master (
    status_name
  )
`)
        .eq(
          'event_id',
          eventId
        )
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

    currentPage = 1

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
        <td colspan="6"
            class="text-center">
          No registrations found
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

    const participantType =
      participant.team_id
        ? 'TEAM'
        : 'ATHLETE'

    const participantName =
      participant.team_id

        ?

        (
          participant.teams
            ?.team_name || ''
        )

        :

        (
          `${participant.athletes?.first_name || ''} ${participant.athletes?.last_name || ''}`
        )

    participantsTableBody.innerHTML += `
      <tr>

        <td>
          ${participantType}
        </td>

        <td>
          ${participantName}
        </td>

        <td>
          ${
            participant
              .event_programs
              ?.program_name || ''
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
            participant
              .status_master
              ?.status_name || ''
          }
        </td>

        <td>

          <button
            class="btn btn-warning btn-sm me-1"
            onclick="editParticipantStatus('${participant.participant_id}')"
          >
            Status
          </button>

          <button
            class="btn btn-danger btn-sm"
            onclick="confirmDeleteParticipant('${participant.participant_id}')"
          >
            Remove
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
      document
        .getElementById(
          'searchParticipant'
        )
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
async function registerSelectedTeams() {

  try {

    clearError()

    const eventId =
      getSelectedEventId()

    if (!eventId) {

      return showError(
        'Select Event'
      )
    }

    if (
  registrationType ===
  'TEAM'
) {

  const selectedTeamIds =
    getSelectedTeamIds()

  if (
    selectedTeamIds.length === 0
  ) {

    return showError(
      'Select at least one team'
    )
  }

} else {

  const selectedAthleteIds =
    Array.from(
      document.querySelectorAll(
        '.athlete-checkbox:checked'
      )
    )

  if (
    selectedAthleteIds.length === 0
  ) {

    return showError(
      'Select at least one athlete'
    )
  }

}
    const registeredStatus =
      statuses.find(
        status =>
          status.status_name ===
          'Registered'
      )

    if (
      !registeredStatus
    ) {

      return showError(
        'Registered status missing'
      )
    }
const programId =
  getSelectedProgramId()
if (!programId) {

  return showError(
    'Select Program'
  )

}
    const payload = []

if (
  registrationType ===
  'TEAM'
) {

  const selectedTeamIds =
    getSelectedTeamIds()

  for (
    const teamId
    of selectedTeamIds
  ) {

    payload.push({

      event_id:
        eventId,

      program_id:
        programId,

      team_id:
        teamId,

      athlete_id:
        null,

      status_id:
        registeredStatus.status_id
    })
  }

} else {

  const selectedAthleteIds =
    Array.from(
      document.querySelectorAll(
        '.athlete-checkbox:checked'
      )
    )
      .map(
        checkbox =>
          checkbox.value
      )

  for (
    const athleteId
    of selectedAthleteIds
  ) {

    payload.push({

      event_id:
        eventId,

      program_id:
        programId,

      athlete_id:
        athleteId,

      team_id:
        null,

      status_id:
        registeredStatus.status_id
    })
  }
}

if (
  payload.length === 0
) {

  return showError(
    'Select at least one participant'
  )

}

      
    const {
      error
    } =
      await window
        .supabaseClient
        .from(
          'event_participants'
        )
        .insert(
          payload
        )

    if (error) {
  throw error
}

await loadEventParticipants()

await loadAvailableTeams()

filteredParticipants =
  [...participants]

renderParticipants()

showSuccess(
  `${payload.length} team(s) registered successfully`
)

document
  .querySelectorAll(
    '.team-checkbox'
  )
  .forEach(
    checkbox => {

      checkbox.checked =
        false
    }
  )

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
window.editParticipantStatus =
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

  setValue(
    'participantId',
    participant.participant_id
  )

  setValue(
    'participantTeamName',
    participant.teams
      ?.team_name || ''
  )

  setValue(
    'statusId',
    participant.status_id
  )

  new coreui.Modal(
    document.getElementById(
      'participantStatusModal'
    )
  ).show()
}
async function saveParticipantStatus() {

  try {

    clearError()

    const participantId =
      getValue(
        'participantId'
      )

    const statusId =
      getValue(
        'statusId'
      )

    if (!statusId) {

      return showError(
        'Status is required'
      )
    }

    const {
      error
    } =
      await window
        .supabaseClient
        .from(
          'event_participants'
        )
        .update({

          status_id:
            statusId
        })
        .eq(
          'participant_id',
          participantId
        )

    if (error) {
      throw error
    }

    const modal =
      coreui.Modal
        .getInstance(
          document.getElementById(
            'participantStatusModal'
          )
        )

    modal?.hide()

    await loadEventParticipants()

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
window.confirmDeleteParticipant =
function (
  participantId
) {

  setValue(
    'deleteParticipantId',
    participantId
  )

  new coreui.Modal(
    document.getElementById(
      'deleteParticipantModal'
    )
  ).show()
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

    if (error) {
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

    await loadEventParticipants()

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
function searchAvailableTeams() {

  const search =
    (
      document
        .getElementById(
          'searchAvailableTeams'
        )
        ?.value || ''
    )
      .trim()
      .toLowerCase()

  const rows =
    availableTeamsBody
      ?.querySelectorAll(
        'tr'
      ) || []

  rows.forEach(
    row => {

      const text =
        row.textContent
          .toLowerCase()

      row.style.display =
        text.includes(
          search
        )
          ? ''
          : 'none'
    }
  )
}
function toggleSelectAllTeams() {

  const checked =
    document
      .getElementById(
        'selectAllTeams'
      )
      ?.checked

  document
    .querySelectorAll(
      '.team-checkbox'
    )
    .forEach(
      checkbox => {

        checkbox.checked =
          checked
      }
    )
}
async function loadEventAndParticipants() {

  clearError()

clearSuccess()

  const eventId =
    getSelectedEventId()

  if (!eventId) {

    participants = []

    filteredParticipants = []

    renderParticipants()

    return showError(
      'Select Event'
    )
  }

  await loadEventParticipants()

await loadAvailableTeams()

updateEventHeader()
}
function wireEvents() {


  document
  .getElementById(
    'registrationTypeTeam'
  )
  ?.addEventListener(
    'change',
    async () => {

      registrationType =
        'TEAM'

      await loadAvailableTeams()
    }
  )

document
  .getElementById(
    'registrationTypeAthlete'
  )
  ?.addEventListener(
    'change',
    async () => {

      registrationType =
        'ATHLETE'

      await loadAvailableAthletes()
    }
  )
  document
    .getElementById(
      'btnLoadEventParticipants'
    )
    ?.addEventListener(
      'click',
      loadEventAndParticipants
    )
    document
  .getElementById(
    'btnRefreshParticipants'
  )
  ?.addEventListener(
    'click',
    loadEventAndParticipants
  )
  document
    .getElementById(
      'btnRegisterSelectedTeams'
    )
    ?.addEventListener(
      'click',
      registerSelectedTeams
    )
  document
  .getElementById(
    'selectedEventId'
  )
  ?.addEventListener(
    'change',
    async event => {

      await loadPrograms(
        event.target.value
      )

      await detectRegistrationType()

      await loadEventParticipants()

    }
  )

  document
    .getElementById(
      'btnSaveParticipantStatus'
    )
    ?.addEventListener(
      'click',
      saveParticipantStatus
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
      'searchAvailableTeams'
    )
    ?.addEventListener(
      'input',
      searchAvailableTeams
    )

  document
    .getElementById(
      'selectAllTeams'
    )
    ?.addEventListener(
      'change',
      toggleSelectAllTeams
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
          Math.max(
            1,
            Math.ceil(
              filteredParticipants.length /
              PAGE_SIZE
            )
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

    showLoading()

    await Promise.all([

      loadEventDropdown(),

      loadAvailableTeams(),

      loadParticipantStatuses()

    ])

    participants = []

    filteredParticipants = []

    currentPage = 1

    renderParticipants()

    wireEvents()

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
document
  .addEventListener(
    'DOMContentLoaded',
    initializeParticipants
  )

async function loadPrograms(
  eventId
) {

  const select =
    document.getElementById(
      'selectedProgramId'
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Program
    </option>
  `

  if (!eventId) {
    return
  }

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
        eventId
      )
      .order(
        'program_name'
      )

  if (error) {

    console.error(error)

    return
  }

  programs =
    data || []

  for (
    const program
    of programs
  ) {

    select.innerHTML += `
      <option
        value="${program.program_id}"
      >
        ${program.program_name}
      </option>
    `
  }

}