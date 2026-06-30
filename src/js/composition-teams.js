/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

let currentPage = 1

let compositionTeams = []
let filteredCompositionTeams = []



let pilots = []
let stokers = []

let compositionTeamModal = null
let deleteCompositionTeamModal = null


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

  $('teamName').value = ''

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
        .from(
          'team_compositions'
        )
        .select(`
          *,
          composition:team_composition_master(
            composition_team_id,
            composition_name
          ),
          pilot:athletes!fk_team_compositions_pilot(
            athlete_id,
            athlete_code,
            first_name,
            last_name
          ),
          stoker:athletes!fk_team_compositions_stoker(
            athlete_id,
            athlete_code,
            first_name,
            last_name
          ),
          team_type:team_type_master(
            team_type_id,
            type_name,
            type_code
          ),
          composition_status:team_composition_status_master(
            team_composition_status_id,
            status_name,
            status_code
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

    compositionTeams =
      data || []

    filteredCompositionTeams =
      [
        ...compositionTeams
      ]

    renderTeamsTable()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      error.message ||
      'Failed to load composition teams'
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

  filteredCompositionTeams = term ?
  compositionTeams.filter(
      team => {
        const text =
          [
  team.composition
    ?.composition_name || '',

  team.pilot
    ?.first_name || '',

  team.pilot
    ?.last_name || '',

  team.stoker
    ?.first_name || '',

  team.stoker
    ?.last_name || '',

  team.team_type
    ?.type_name || '',

  team.composition_status
    ?.status_name || ''
]
            .join(' ')
            .toLowerCase()

        return text.includes(
          term
        )
      }
    ) :
    [...compositionTeams]

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
    filteredCompositionTeams.slice(
      start,
      start +
      PAGE_SIZE
    )

  for (
    const composition
    of pageRows
  ) {

    const row =
      document.createElement(
        'tr'
      )

    row.innerHTML = `

      <td>
        ${
          composition
            .composition
            ?.composition_name ||
          ''
        }
      </td>

      <td>
        ${
          composition
            .pilot
            ?.first_name || ''
        }
        ${
          composition
            .pilot
            ?.last_name || ''
        }
      </td>

      <td>
        ${
          composition
            .stoker
            ?.first_name || ''
        }
        ${
          composition
            .stoker
            ?.last_name || ''
        }
      </td>

      <td>
        ${
          composition
            .team_type
            ?.type_name ||
          ''
        }
      </td>

      <td>
        ${
          composition
            .effective_from ||
          ''
        }
      </td>

      <td>
        ${
          composition
            .composition_status
            ?.status_name ||
          ''
        }
      </td>

      <td>

        <button
          class="btn btn-warning btn-sm me-1"
          onclick="editTeam('${composition.composition_id}')"
        >
          Edit
        </button>

        <button
          class="btn btn-danger btn-sm"
          onclick="confirmDeleteTeam('${composition.composition_id}')"
        >
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
        filteredCompositionTeams.length /
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
      filteredCompositionTeams.length /
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

  $('pilotAthleteId').disabled =
    false

  $('stokerAthleteId').disabled =
    false

  $('teamModalTitle').textContent =
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

  const pilotId =
    $('pilotAthleteId').value

  const stokerId =
    $('stokerAthleteId').value

  const effectiveDate =
    $('effectiveDate').value

  const {
    data: athletes,
    error: athleteError
  } =
    await window.supabaseClient
      .from('athletes')
      .select(`
        athlete_id,
        first_name
      `)
      .in(
        'athlete_id',
        [
          pilotId,
          stokerId
        ]
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

  const athleteAId =
    sortedAthletes[0]
      ?.athlete_id

  const athleteBId =
    sortedAthletes[1]
      ?.athlete_id

  const compositionName =
  sortedAthletes
    .map(
      athlete =>
        athlete.first_name
          .substring(
            0,
            3
          )
    )
    .join('')
const {
  data: existingComposition
} =
  await window.supabaseClient
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
  existingComposition
) {

  throw new Error(
    'This composition already exists'
  )
}

let compositionTeamId

const {
  data: existingTeam
} =
  await window.supabaseClient
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
    await window.supabaseClient
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

const {
  data: activeStatus
} =
  await window.supabaseClient
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
    .single()

const {
  data: temporaryType
} =
  await window.supabaseClient
    .from(
      'team_type_master'
    )
    .select(
      'team_type_id'
    )
    .eq(
      'type_code',
      'TEMPORARY'
    )
    .single()

const {
  error: compositionError
} =
  await window.supabaseClient
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
        pilotId,

      stoker_id:
        stokerId,

      team_type_id:
        temporaryType
          ?.team_type_id,

      team_composition_status_id:
        activeStatus
          ?.team_composition_status_id,

      effective_from:
        effectiveDate,

      effective_to:
        null

    })

if (
  compositionError
) {

  throw compositionError
}

const {
  data: participantType
} =
  await window.supabaseClient
    .from(
      'participant_type_master'
    )
    .select(
      'participant_type_id'
    )
    .eq(
      'participant_type_code',
      'COMPOSITION'
    )
    .single()

await window.supabaseClient
  .from(
    'participant_registry'
  )
  .insert({

    participant_type_id:
      participantType
        ?.participant_type_id,

    source_id:
      compositionTeamId,

    display_name:
      compositionName,

    is_active:
      true

  })

}

/* ==========================================
   UPDATE TEAM
========================================== */

async function updateTeam() {

  const compositionId =
    $('teamId').value

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'team_compositions'
      )
      .update({

        pilot_id:
          $('pilotAthleteId').value,

        stoker_id:
          $('stokerAthleteId').value,

        effective_from:
          $('effectiveDate').value

      })
      .eq(
        'composition_id',
        compositionId
      )

  if (
    error
  ) {

    throw error
  }
}





/* ==========================================
   EDIT TEAM
========================================== */

async function editTeam(
  teamId
) {
  try {

    const composition =
  compositionTeams.find(
    row =>
      row.composition_id ===
      teamId
  )

    if (!composition) {
  return
}

    clearForm()

    const activeMembers = [
  {
    start_date:
      composition.effective_from
  }
]


    
   $('teamId').value =
  composition.composition_id || ''

$('teamName').value =
  composition.composition?.composition_name || ''

$('pilotAthleteId').value =
  composition.pilot_id || ''

$('stokerAthleteId').value =
  composition.stoker_id || ''

$('pilotAthleteId').disabled =
  true

$('stokerAthleteId').disabled =
  true

$('teamStatus').value =
  composition
    .composition_status
    ?.status_name || ''

    $('effectiveDate').value =
      activeMembers?.[0]
        ?.start_date || ''

    $('changeReason').value =
      ''

    $('teamModalTitle').textContent =
  'Edit Composition Team'

   // Composition history not implemented yet

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

    const compositionId =
      $('deleteTeamId')
        .value

    const composition =
      compositionTeams.find(
        row =>
          row.composition_id ===
          compositionId
      )

    if (
      !composition
    ) {

      return
    }

    const {
      error: detailError
    } =
      await window
        .supabaseClient
        .from(
          'team_compositions'
        )
        .delete()
        .eq(
          'composition_id',
          compositionId
        )

    if (
      detailError
    ) {

      throw detailError
    }

    const {
  data: inactiveStatus,
  error: statusError
} =
  await window
    .supabaseClient
    .from(
      'team_composition_status_master'
    )
    .select(
      'team_composition_status_id'
    )
    .eq(
      'status_code',
      'INACTIVE'
    )
    .single()

if (
  statusError
) {

  throw statusError
}

const {
  error: masterError
} =
  await window
    .supabaseClient
    .from(
      'team_compositions'
    )
    .update({

      team_composition_status_id:
        inactiveStatus
          .team_composition_status_id,

      effective_to:
        new Date()
          .toISOString()
          .split('T')[0]

    })
    .eq(
      'composition_id',
      compositionId
    )

if (
  masterError
) {

  throw masterError
}


    deleteTeamModal.hide()

    await refreshTeams()

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
