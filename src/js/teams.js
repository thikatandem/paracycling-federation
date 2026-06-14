/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

let currentPage = 1

let teams = []
let filteredTeams = []
let roleMap = {}
let pilots = []
let stokers = []

let teamModal = null
let deleteTeamModal = null



/* ==========================================
   DOM
========================================== */

const $ = id =>
  document.getElementById(id)

/* ==========================================
   HELPERS
========================================== */

function showLoading(
  show = true
) {
  const el =
    $('teamLoading')

  if (!el) {
    return
  }

  el.classList.toggle(
    'd-none',
    !show
  )
}

function showError(
  message = ''
) {
  const el =
    $('teamFormError')

  if (!el) {
    return
  }

  el.textContent =
    message
}

function clearForm() {
  $('teamId').value = ''

  $('teamCode').value = ''

  $('teamName').value = ''

  $('teamNickname').value = ''

  $('pilotAthleteId').value = ''

  $('stokerAthleteId').value = ''

  $('teamStatus').value =
    'Active'

  $('effectiveDate').value = ''

  $('changeReason').value = ''

  showError('')
}

/* ==========================================
   PILOT LOOKUP
========================================== */

async function loadPilotLookup() {
  try {
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
          'role',
          'Pilot'
        )
        .eq(
          'status',
          'Active'
        )
        .order(
          'first_name'
        )

    if (error) {
      throw error
    }

    pilots =
      data || []

    renderPilotLookup()
  } catch (error) {
    console.error(
      error
    )
  }
}

function renderPilotLookup() {
  const select =
    $('pilotAthleteId')

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        Select Pilot
      </option>
    `

  for (const pilot of pilots) {
    const option =
        document.createElement(
          'option'
        )

    option.value =
        pilot.athlete_id

    option.textContent =
        `${pilot.athlete_code} - ${pilot.first_name} ${pilot.last_name}`

    select.append(
      option
    )
  }
}

/* ==========================================
   STOKER LOOKUP
========================================== */

async function loadStokerLookup() {
  try {
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
          'role',
          'Stoker'
        )
        .eq(
          'status',
          'Active'
        )
        .order(
          'first_name'
        )

    if (error) {
      throw error
    }

    stokers =
      data || []

    renderStokerLookup()
  } catch (error) {
    console.error(
      error
    )
  }
}

function renderStokerLookup() {
  const select =
    $('stokerAthleteId')

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        Select Stoker
      </option>
    `

  for (const stoker of stokers) {
    const option =
        document.createElement(
          'option'
        )

    option.value =
        stoker.athlete_id

    option.textContent =
        `${stoker.athlete_code} - ${stoker.first_name} ${stoker.last_name}`

    select.append(
      option
    )
  }
}

async function loadRoleMap() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from('role_master')
      .select(`
        role_id,
        role_code
      `)

  if (error) {
    throw error
  }

  roleMap = {}

  for (const role of data) {
    roleMap[
      role.role_code
    ] = role.role_id
  }
}

/* ==========================================
   LOAD TEAMS
========================================== */

async function loadTeams() {
  try {
    showLoading(true)

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from('teams')
        .select(`
          *,
          pilot:athletes!teams_pilot_athlete_id_fkey(
            athlete_id,
            athlete_code,
            first_name,
            last_name
          ),
          stoker:athletes!teams_stoker_athlete_id_fkey(
            athlete_id,
            athlete_code,
            first_name,
            last_name
          )
        `)
        .order(
          'team_code'
        )

    if (error) {
      throw error
    }

    teams =
      data || []
   for (const team of teams) {

  const {
    data: activeMembers
  } =
    await window.supabaseClient
      .from('team_members')
      .select(`
        start_date
      `)
      .eq(
        'team_id',
        team.team_id
      )
      .eq(
        'is_active',
        true
      )
      .order(
        'start_date',
        {
          ascending: false
        }
      )
      .limit(1)

  team.current_effective_date =
    activeMembers?.[0]
      ?.start_date || ''
}

    filteredTeams =
      [...teams]

    renderTeamsTable()

  } catch (error) {
    console.error(error)

    alert(
      error.message ||
      'Failed to load teams'
    )
  } finally {
    showLoading(false)
  }
}

/* ==========================================
   SEARCH
========================================== */

function applySearch() {
  const term =
    (
      $('searchTeam')
        ?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredTeams = term ?
    teams.filter(
      team => {
        const text =
          [
  team.team_code || '',

  team.team_name || '',

  team.team_nickname || '',

  team.status || '',

  team.pilot?.first_name || '',

  team.pilot?.last_name || '',

  team.stoker?.first_name || '',

  team.stoker?.last_name || ''
]
            .join(' ')
            .toLowerCase()

        return text.includes(
          term
        )
      }
    ) :
    [...teams]

  currentPage = 1

  renderTeamsTable()
}

/* ==========================================
   TABLE
========================================== */

function renderTeamsTable() {
  const tbody =
    $('teamsTableBody')

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  const start =
    (
      currentPage - 1
    ) * PAGE_SIZE

  const pageRows =
    filteredTeams.slice(
      start,
      start +
      PAGE_SIZE
    )

  for (const team of pageRows) {
    const row =
      document.createElement(
        'tr'
      )

    row.innerHTML = `
  <td>${team.team_code || ''}</td>

  <td>${team.team_name || ''}</td>

  <td>${team.team_nickname || ''}</td>

  <td>
    ${team.pilot?.first_name || ''}
    ${team.pilot?.last_name || ''}
  </td>

  <td>
    ${team.stoker?.first_name || ''}
    ${team.stoker?.last_name || ''}
  </td>

  <td>
  ${
    team.current_effective_date ||
    ''
  }
</td>

  <td>
    ${team.status || ''}
  </td>

  <td>

    <button
      class="btn btn-warning btn-sm me-1"
      onclick="editTeam('${team.team_id}')">
      Edit
    </button>

    <button
      class="btn btn-danger btn-sm"
      onclick="confirmDeleteTeam('${team.team_id}')">
      Delete
    </button>

  </td>
`

    tbody.append(
      row
    )
  }

  updatePagination()
}
function updatePagination() {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTeams.length /
        PAGE_SIZE
      )
    )

  const info =
    $('teamPaginationInfo')

  if (info) {
    info.textContent =
      `Page ${currentPage} of ${totalPages}`
  }

  const previousButton =
    $('btnPreviousTeamPage')

  if (previousButton) {
    previousButton.disabled =
      currentPage <= 1
  }

  const nextButton =
    $('btnNextTeamPage')

  if (nextButton) {
    nextButton.disabled =
      currentPage >= totalPages
  }
}
function nextPage() {
  const totalPages =
    Math.ceil(
      filteredTeams.length /
      PAGE_SIZE
    )

  if (
    currentPage <
    totalPages
  ) {
    currentPage++

    renderTeamsTable()
  }
}

function previousPage() {
  if (
    currentPage > 1
  ) {
    currentPage--

    renderTeamsTable()
  }
}

/* ==========================================
   REFRESH
========================================== */

async function refreshTeams() {
  await Promise.all([

    loadPilotLookup(),

    loadStokerLookup(),

    loadTeams()

  ])
}

/* ==========================================
   MODAL OPEN
========================================== */

function openAddTeamModal() {
  clearForm()

  $('teamModalTitle')
    .textContent =
    'Add Team'

  teamModal.show()
}
/* ==========================================
   VALIDATION
========================================== */

function validateTeam() {
  const pilotId =
    $('pilotAthleteId').value

  const stokerId =
    $('stokerAthleteId').value

  const effectiveDate =
  $('effectiveDate').value

  if (!pilotId) {
    return 'Pilot is required'
  }

  if (!stokerId) {
    return 'Stoker is required'
  }

  if (pilotId === stokerId) {
    return 'Pilot and Stoker cannot be the same athlete'
  }

  if (!effectiveDate) {
  return 'Effective Date is required'
}

  return null
}

/* ==========================================
   SAVE TEAM
========================================== */

async function saveTeam() {
  try {
    showError('')

    const validationError =
      validateTeam()

    if (validationError) {
      showError(
        validationError
      )

      return
    }

    const teamId =
      $('teamId').value

    await (teamId ? updateTeam() : createTeam())

    teamModal.hide()

    await refreshTeams()
  } catch (error) {
    console.error(error)

    showError(
      error.message
    )
  }
}

/* ==========================================
   CREATE TEAM
========================================== */
async function createTeam() {

  const effectiveDate =
    $('effectiveDate').value

  const {
    data: teamData,
    error: teamError
  } =
    await window.supabaseClient
      .from('teams')
      .insert({
        team_name:
          $('teamName').value || null,

        team_nickname:
          $('teamNickname').value || null,

        status:
          $('teamStatus').value,

        pilot_athlete_id:
          $('pilotAthleteId').value,

        stoker_athlete_id:
          $('stokerAthleteId').value
      })
      .select()
      .single()

  if (teamError) {
    throw teamError
  }

  await createPilotHistory(
    teamData.team_id,
    $('pilotAthleteId').value,
    effectiveDate,
    $('changeReason').value
  )

  await createStokerHistory(
    teamData.team_id,
    $('stokerAthleteId').value,
    effectiveDate,
    $('changeReason').value
  )
}
/* ==========================================
   UPDATE TEAM
========================================== */

async function updateTeam() {

  const teamId =
    $('teamId').value

  const selectedPilot =
    $('pilotAthleteId').value

  const selectedStoker =
    $('stokerAthleteId').value

  const effectiveDate =
    $('effectiveDate').value

  const reason =
    $('changeReason').value

  const currentTeam =
    teams.find(
      team =>
        team.team_id === teamId
    )

  if (!currentTeam) {
    throw new Error(
      'Team not found'
    )
  }

  const pilotChanged =
    detectPilotChange(
      currentTeam,
      selectedPilot
    )

  const stokerChanged =
    detectStokerChange(
      currentTeam,
      selectedStoker
    )

  const {
    error
  } =
    await window.supabaseClient
      .from('teams')
      .update({
        team_name:
          $('teamName').value,

        team_nickname:
          $('teamNickname').value,

        status:
          $('teamStatus').value,

        pilot_athlete_id:
          selectedPilot,

        stoker_athlete_id:
          selectedStoker
      })
      .eq(
        'team_id',
        teamId
      )

  if (error) {
    throw error
  }

  if (pilotChanged) {

  await closeActiveMember(
    teamId,
    roleMap.PILOT
  )

  await createPilotHistory(
    teamId,
    selectedPilot,
    effectiveDate,
    reason
  )
}

 if (stokerChanged) {

  await closeActiveMember(
    teamId,
    roleMap.STOKER
  )

  await createStokerHistory(
    teamId,
    selectedStoker,
    effectiveDate,
    reason
  )
}

}
async function loadTeamHistory(
  teamId
) {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from('team_members')
      .select(`
        *,
        athletes(
          athlete_code,
          first_name,
          last_name
        ),
        role_master(
          role_name
        )
      `)
      .eq(
        'team_id',
        teamId
      )
      .order(
        'start_date',
        {
          ascending: false
        }
      )

  if (error) {
    throw error
  }

  renderCurrentPairing(
    data || []
  )

  renderTeamHistory(
    data || []
  )
}

function renderCurrentPairing(
  members
) {

  const tbody =
    $('currentPairingBody')

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  const activeMembers =
    members.filter(
      member =>
        member.is_active
    )

  for (
    const member
    of activeMembers
  ) {

    const row =
      document.createElement(
        'tr'
      )

    row.innerHTML = `
      <td>
        ${member.role_master?.role_name || ''}
      </td>

      <td>
        ${member.athletes?.first_name || ''}
        ${member.athletes?.last_name || ''}
      </td>

      <td>
        ${member.start_date || ''}
      </td>
    `

    tbody.append(row)
  }
}

function renderTeamHistory(
  members
) {

  const tbody =
    $('teamHistoryBody')

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  for (
    const member
    of members
  ) {

    const row =
      document.createElement(
        'tr'
      )

    row.innerHTML = `
      <td>
        ${member.role_master?.role_name || ''}
      </td>

      <td>
        ${member.athletes?.first_name || ''}
        ${member.athletes?.last_name || ''}
      </td>

      <td>
        ${member.start_date || ''}
      </td>

      <td>
        ${member.end_date || ''}
      </td>

      <td>
        ${member.is_active ? 'Yes' : 'No'}
      </td>

      <td>
        ${member.change_reason || ''}
      </td>
    `

    tbody.append(row)
  }
}
async function createPilotHistory(
  teamId,
  athleteId,
  effectiveDate,
  reason
) {

  const {
    error
  } =
    await window.supabaseClient
      .from('team_members')
      .insert({
        team_id:
          teamId,

        athlete_id:
          athleteId,

        role_id:
        roleMap.PILOT,

        start_date:
          effectiveDate,

        is_active:
          true,

        change_reason:
          reason || null
      })

  if (error) {
    throw error
  }
}

async function createStokerHistory(
  teamId,
  athleteId,
  effectiveDate,
  reason
) {

  const {
    error
  } =
    await window.supabaseClient
      .from('team_members')
      .insert({
        team_id:
          teamId,

        athlete_id:
          athleteId,

        role_id:
        roleMap.STOKER,

        start_date:
          effectiveDate,

        is_active:
          true,

        change_reason:
          reason || null
      })

  if (error) {
    throw error
  }
}

async function closeActiveMember(
  teamId,
  roleId
) {

  const {
    error
  } =
    await window.supabaseClient
      .from('team_members')
      .update({
        is_active:
          false,

        end_date:
          new Date()
            .toISOString()
            .slice(
              0,
              10
            )
      })
      .eq(
        'team_id',
        teamId
      )
      .eq(
        'role_id',
        roleId
      )
      .eq(
        'is_active',
        true
      )

  if (error) {
    throw error
  }
}

function detectPilotChange(
  team,
  selectedPilot
) {
  return (
    team.pilot_athlete_id !==
    selectedPilot
  )
}

function detectStokerChange(
  team,
  selectedStoker
) {
  return (
    team.stoker_athlete_id !==
    selectedStoker
  )
}


/* ==========================================
   EDIT TEAM
========================================== */

async function editTeam(
  teamId
) {
  try {

    const team =
      teams.find(
        team =>
          team.team_id ===
          teamId
      )

    if (!team) {
      return
    }

    clearForm()

    const {
      data: activeMembers,
      error: activeMemberError
    } =
      await window.supabaseClient
        .from('team_members')
        .select(`
          start_date
        `)
        .eq(
          'team_id',
          teamId
        )
        .eq(
          'is_active',
          true
        )
        .order(
          'start_date',
          {
            ascending: false
          }
        )
        .limit(1)

    if (activeMemberError) {
      throw activeMemberError
    }

    $('teamId').value =
      team.team_id || ''

    $('teamCode').value =
      team.team_code || ''

    $('teamName').value =
      team.team_name || ''

    $('teamNickname').value =
      team.team_nickname || ''

    $('pilotAthleteId').value =
      team.pilot_athlete_id || ''

    $('stokerAthleteId').value =
      team.stoker_athlete_id || ''

    $('teamStatus').value =
      team.status || 'Active'

    $('effectiveDate').value =
      activeMembers?.[0]
        ?.start_date || ''

    $('changeReason').value =
      ''

    $('teamModalTitle').textContent =
      'Edit Team'

    await loadTeamHistory(
      teamId
    )

    teamModal.show()

  } catch (error) {
    console.error(
      error
    )

    alert(
      error.message ||
      'Failed to load team'
    )
  }
}
/* ==========================================
   DELETE MODAL
========================================== */

function confirmDeleteTeam(
  teamId
) {
  $('deleteTeamId').value =
    teamId

  deleteTeamModal.show()
}

/* ==========================================
   DELETE TEAM
========================================== */

async function deleteTeam() {
  try {
    const teamId =
      $('deleteTeamId').value

    if (!teamId) {
      return
    }

    const {
  error: historyError
} =
  await window.supabaseClient
    .from('team_members')
    .delete()
    .eq(
      'team_id',
      teamId
    )

if (historyError) {
  throw historyError
}

const {
  error: teamError
} =
  await window.supabaseClient
    .from('teams')
    .delete()
    .eq(
      'team_id',
      teamId
    )

if (teamError) {
  throw teamError
}

    deleteTeamModal.hide()

    await refreshTeams()
  } catch (error) {
    console.error(error)

    alert(
      error.message
    )
  }
}
/* ==========================================
   EVENT WIRING
========================================== */

function wireEvents() {

const refreshButton =
  $('btnRefreshTeams')

if (refreshButton) {
  refreshButton.addEventListener(
    'click',
    refreshTeams
  )
}

const addButton =
    $('btnAddTeam')

  if (addButton) {
    addButton.addEventListener(
      'click',
      openAddTeamModal
    )
  }

  const saveButton =
    $('btnSaveTeam')

  if (saveButton) {
    saveButton.addEventListener(
      'click',
      saveTeam
    )
  }

  const deleteButton =
    $('btnConfirmDeleteTeam')

  if (deleteButton) {
    deleteButton.addEventListener(
      'click',
      deleteTeam
    )
  }

  const searchBox =
    $('searchTeam')

  if (searchBox) {
    searchBox.addEventListener(
      'input',
      applySearch
    )
  }

  const previousButton =
    $('btnPreviousTeamPage')

  if (previousButton) {
    previousButton.addEventListener(
      'click',
      previousPage
    )
  }

  const nextButton =
    $('btnNextTeamPage')

  if (nextButton) {
    nextButton.addEventListener(
      'click',
      nextPage
    )
  }
}

/* ==========================================
   MODALS
========================================== */

function initializeModals() {
  const teamModalElement =
    $('teamModal')

  if (
    teamModalElement &&
    window.coreui
  ) {
    teamModal =
      new coreui.Modal(
        teamModalElement
      )
  }

  const deleteModalElement =
    $('deleteTeamModal')

  if (
    deleteModalElement &&
    window.coreui
  ) {
    deleteTeamModal =
      new coreui.Modal(
        deleteModalElement
      )
  }
}

/* ==========================================
   ERROR HANDLING
========================================== */

window.addEventListener(
  'error',
  event => {
    console.error(
      'Teams Module Error:',
      event.error
    )
  }
)

window.addEventListener(
  'unhandledrejection',
  event => {
    console.error(
      'Unhandled Promise:',
      event.reason
    )
  }
)

/* ==========================================
   GLOBAL FUNCTIONS
========================================== */

window.editTeam =
  editTeam

window.confirmDeleteTeam =
  confirmDeleteTeam

window.openAddTeamModal =
  openAddTeamModal

window.nextPage =
  nextPage

window.previousPage =
  previousPage

/* ==========================================
   INITIALIZATION
========================================== */

async function initializeTeams() {
  try {
    if (
      !window.supabaseClient
    ) {
      console.error(
        'Supabase client not found'
      )

      return
    }

    initializeModals()

   wireEvents()

    await loadRoleMap()

    await refreshTeams()

    console.log(
      'Teams module initialized'
    )
  } catch (error) {
    console.error(
      'Initialization Error',
      error
    )
  }
}

/* ==========================================
   STARTUP
========================================== */

document.addEventListener(
  'DOMContentLoaded',
  initializeTeams
)
