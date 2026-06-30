/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

import {
  get,
  getValue,
  setValue,
  setText,
  resetForm,
  populateSelect
}
from './core/domService.js'

import {
  showPageLoader,
  hidePageLoader
}
from './core/uiService.js'

import {
  clearMessage,
  showError,
  getFederationFriendlyError
} from './core/errorService.js'

import {
  showModal,
  hideModal,
  openEntityModal
} from './core/modalService.js'

import {
  searchNestedCollection
} from './core/searchService.js'

import {
  createPaginator,
  updatePaginationUi,
  resetPagination,
  bindPagination
} from './core/paginationService.js'

import {
  renderEntityTable,
  buildActionButtons,
  buildActionCell,
  buildTextCell,
  buildStatusCell
} from './core/tableRendererService.js'

import {
  getStatusBadge
} from './core/badgeService.js'

import {

  createPageState,
  setRows

}
from './core/pageStateService.js'

import {
  populateTeamForm,
  buildTeamPayload,
  renderCurrentPairingRow,
  renderTeamHistoryRow,
  detectPilotChange,
  detectStokerChange
}
from './core/teamFormService.js'

import {
  loadAthletesByRole,
  populateAthleteLookup
}
from './core/lookupService.js'


const paginator =
  createPaginator()

const state =
  createPageState()
let roleMap = {}
let pilots = []
let stokers = []


/* ==========================================
   HELPERS
========================================== */
function clearForm() {

  clearMessage(
    'teamFormError'
  )

  resetForm({

    fields: [

      'teamId',
      'teamCode',
      'teamName',
      'teamNickname',
      'pilotAthleteId',
      'stokerAthleteId',
      'effectiveDate',
      'changeReason'

    ],

    defaults: {

      teamStatus: 'Active'

    }

  })

}
/* ==========================================
   PILOT LOOKUP
========================================== */

async function loadPilotLookup() {

  pilots =
    await loadAthletesByRole(
      'Pilot'
    )

  renderPilotLookup()

}

function renderPilotLookup() {

  populateAthleteLookup({

    selectId:
      'pilotAthleteId',

    athletes:
      pilots,

    placeholder:
      'Select Pilot'

  })

}

/* ==========================================
   STOKER LOOKUP
========================================== */

async function loadStokerLookup() {

  stokers =
    await loadAthletesByRole(
      'Stoker'
    )

  renderStokerLookup()

}

function renderStokerLookup() {

  populateAthleteLookup({

    selectId:
      'stokerAthleteId',

    athletes:
      stokers,

    placeholder:
      'Select Stoker'

  })

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
    showPageLoader()

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

    setRows({

  state,

  rows:
    data || []

})
   for (const team of state.rows) {

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

    

    renderTeamsTable()

  } catch (error) {
    console.error(error)

    showError(
  'teamFormError',
  getFederationFriendlyError(
    error
  )
)
  } finally {
    hidePageLoader()
  }
}

/* ==========================================
   SEARCH
========================================== */

function applySearch() {

  const term =
    (
      get('searchTeam')
        ?.value || ''
    )
      .trim()

  state.filteredRows =
    searchNestedCollection({

      data:
        state.rows,

      searchTerm:
        term,

      fields: [

        'team_code',

        'team_name',

        'team_nickname',

        'status',

        'pilot.first_name',

        'pilot.last_name',

        'stoker.first_name',

        'stoker.last_name'

      ]

    })

  resetPagination(
    paginator
  )

  renderTeamsTable()

}
/* ==========================================
   TABLE
========================================== */

function renderTeamsTable() {

  const tbody =
    get('teamsTableBody')

  if (!tbody) {
    return
  }

  renderEntityTable({

    tableBody:
      tbody,

    data:
  state.filteredRows,
    paginator,

    colspan: 8,

    emptyMessage:
      'No teams found',

    rowRenderer:
      renderTeamRow

  })

  updatePagination()

}

function updatePagination() {

  updatePaginationUi({

    paginator,

    infoElement:
      get('teamPaginationInfo'),

    previousButton:
      get('btnPreviousTeamPage'),

    nextButton:
      get('btnNextTeamPage')

  })

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

  openEntityModal({

    modalId:
      'teamModal',

    titleId:
      'teamModalTitle',

    title:
      'Add Team',

    beforeOpen:
      clearForm

  })

}
/* ==========================================
   VALIDATION
========================================== */

function validateTeam() {

  const pilotId =
    getValue(
      'pilotAthleteId'
    )

  const stokerId =
    getValue(
      'stokerAthleteId'
    )

  const effectiveDate =
    getValue(
      'effectiveDate'
    )

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
    clearMessage(
  'teamFormError'
)

    const validationError =
      validateTeam()

    if (validationError) {
      showError(
  'teamFormError',
  validationError
)

      return
    }

    const teamId =
  getValue(
    'teamId'
  )

    await (teamId ? updateTeam() : createTeam())

    hideModal(
  'teamModal'
)

    await refreshTeams()
  } catch (error) {
    console.error(error)

    showError(
  'teamFormError',
  getFederationFriendlyError(
    error
  )
)

  }
}

/* ==========================================
   CREATE TEAM
========================================== */
async function createTeam() {

  const effectiveDate =
    getValue(
      'effectiveDate'
    )

  const payload =
    buildTeamPayload()

  const {
    data: teamData,
    error: teamError
  } =
    await window.supabaseClient
      .from('teams')
      .insert(payload)
      .select()
      .single()

  if (teamError) {
    throw teamError
  }

  await createPilotHistory(
    teamData.team_id,
    getValue(
      'pilotAthleteId'
    ),
    effectiveDate,
    getValue(
      'changeReason'
    )
  )

  await createStokerHistory(
    teamData.team_id,
    getValue(
      'stokerAthleteId'
    ),
    effectiveDate,
    getValue(
      'changeReason'
    )
  )

}
/* ==========================================
   UPDATE TEAM
========================================== */

async function updateTeam() {

 const teamId =
  getValue(
    'teamId'
  )

const selectedPilot =
  getValue(
    'pilotAthleteId'
  )

const selectedStoker =
  getValue(
    'stokerAthleteId'
  )

const effectiveDate =
  getValue(
    'effectiveDate'
  )

const reason =
  getValue(
    'changeReason'
  )

  const currentTeam =
  state.rows.find(
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
const payload =
  buildTeamPayload()

const {
  error
} =
  await window.supabaseClient
  .from('teams')
  .update(payload)
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
    get('currentPairingBody')

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
    get('teamHistoryBody')

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




/* ==========================================
   EDIT TEAM
========================================== */

async function editTeam(
  teamId
) {
  try {

    const team =
  state.rows.find(
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

    populateTeamForm({

  team,

  effectiveDate:
    activeMembers?.[0]
      ?.start_date || ''

})

    setText(
  'teamModalTitle',
  'Edit Team'
)

    await loadTeamHistory(
      teamId
    )

    showModal(
  'teamModal'
)

  } catch (error) {
    console.error(
      error
    )

    showError(

  'teamFormError',

  getFederationFriendlyError(
    error
  )

)
  }
}
/* ==========================================
   DELETE MODAL
========================================== */

function confirmDeleteTeam(
  teamId
) {

  setValue(
  'deleteTeamId',
  teamId
)

  showModal(
    'deleteTeamModal'
  )

}

function renderTeamRow(
  team
) {

  const actionButtons =

    buildActionButtons({

      buttons: [

        {
          type: 'edit',
          onClick:
            `editTeam('${team.team_id}')`
        },

        {
          type: 'delete',
          onClick:
            `confirmDeleteTeam('${team.team_id}')`
        }

      ]

    })

  return `

<tr>

${buildTextCell(
  team.team_code
)}

${buildTextCell(
  team.team_name
)}

${buildTextCell(
  team.team_nickname
)}

${buildTextCell(
  `${team.pilot?.first_name || ''} ${team.pilot?.last_name || ''}`
)}

${buildTextCell(
  `${team.stoker?.first_name || ''} ${team.stoker?.last_name || ''}`
)}

${buildTextCell(
  team.current_effective_date
)}

${buildStatusCell(
  getStatusBadge(
    team.status,
    team.status
  )
)}

${buildActionCell(
  actionButtons
)}

</tr>

`

}


/* ==========================================
   DELETE TEAM
========================================== */

async function deleteTeam() {
  try {
    const teamId =
  getValue(
    'deleteTeamId'
  )

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

    hideModal(
  'deleteTeamModal'
)

    await refreshTeams()
  } catch (error) {
    console.error(error)

    showError(
  'teamFormError',
  getFederationFriendlyError(
    error
  )
)
  }
}
/* ==========================================
   EVENT WIRING
========================================== */

function wireEvents() {

const refreshButton =
  get('btnRefreshTeams')

if (refreshButton) {
  refreshButton.addEventListener(
    'click',
    refreshTeams
  )
}

const addButton =
    get('btnAddTeam')

  if (addButton) {
    addButton.addEventListener(
      'click',
      openAddTeamModal
    )
  }

  const saveButton =
    get('btnSaveTeam')

  if (saveButton) {
    saveButton.addEventListener(
      'click',
      saveTeam
    )
  }

  const deleteButton =
    get('btnConfirmDeleteTeam')

  if (deleteButton) {
    deleteButton.addEventListener(
      'click',
      deleteTeam
    )
  }

  const searchBox =
    get('searchTeam')

  if (searchBox) {
    searchBox.addEventListener(
      'input',
      applySearch
    )
  }

  
}

/* ==========================================
   MODALS
========================================== */


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

   bindPagination({

  paginator,

  previousButtonId:
    'btnPreviousTeamPage',

  nextButtonId:
    'btnNextTeamPage',

  infoElementId:
    'teamPaginationInfo',

  onChange:
    renderTeamsTable

})

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
