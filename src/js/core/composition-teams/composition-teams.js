import {
  get as $
} from '../services/domService.js'

/* eslint camelcase: 0 */
import {
  createSimplePaginationUpdater
} from '../services/paginationService.js'

import {
  createPageNavigator
} from '../services/pageStateService.js'

import {
  createLoadingStateSetter,
  createAsyncRefresher
} from '../services/uiService.js'

import {
  showInlineError,
  createFeedbackController
} from '../services/feedbackService.js'

import {
  PAGE_SIZE
} from '../services/constants.js'

import {
  getGenericBadge
} from '../services/badgeService.js'

import {
  buildActionButtons,
  buildActionCell,
  buildStatusCell
} from '../services/tableRendererService.js'

import {
  getDb,
  hasDb
} from '../supabase/getDb.js'

import {
  ensureParticipantRegistryEntry
} from '../participants/participantRegistrationService.js'

import {
  validateTeamForm
} from '../services/teamFormService.js'




import {
  createModalByElement
} from '../services/modalService.js'
const refreshTeams =
  createAsyncRefresher(
    loadPilotLookup,
    loadStokerLookup,
    loadTeams
  )

const updatePagination =
  createSimplePaginationUpdater({
    getItemCount: () =>
      filteredCompositionTeams.length,
    getCurrentPage: () =>
      currentPage,
    pageSize: PAGE_SIZE,
    infoElementId:
      'teamPaginationInfo',
    previousButtonId:
      'btnPreviousTeamPage',
    nextButtonId:
      'btnNextTeamPage'
  })

const showLoading =
  createLoadingStateSetter(
    'teamLoading'
  )

const teamFeedback =
  createFeedbackController({
    containerId: 'teamFormError',
    errorOptions: {
      sticky: true
    }
  })

const showError =
  teamFeedback.error
    .bind(teamFeedback)

let currentPage = 1

const pageNavigator =
  createPageNavigator({
    getPage: () =>
      currentPage,
    setPage: page => {
      currentPage = page
    },
    getTotalPages: () =>
      Math.ceil(
        filteredCompositionTeams.length /
        PAGE_SIZE
      ),
    render:
      renderTeamsTable
  })

const nextPage = () =>
  pageNavigator.next()

const previousPage = () =>
  pageNavigator.previous()

let compositionTeams = []
let filteredCompositionTeams = []

let pilots = []
let stokers = []

let teamModal = null
let deleteTeamModal = null

/* ==========================================
   DOM
========================================== */

/* ==========================================
   HELPERS
========================================== */



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
      await getDb()
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
      await getDb()
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
      await getDb()
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

    showInlineError(
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

      ${buildStatusCell(
    getGenericBadge(
      composition
        .composition_status
        ?.status_name || '',
      composition
        .composition_status
        ?.status_name
        ?.toUpperCase() === 'ACTIVE' ?
        'success' :
        'secondary'
    )
  )}

      ${buildActionCell(
    buildActionButtons({
      buttons: [
        {
          type: 'edit',
          onClick:
            `editTeam('${composition.composition_id}')`
        },
        {
          type: 'delete',
          onClick:
            `confirmDeleteTeam('${composition.composition_id}')`
        }
      ]
    })
  )}
    `

    tbody.append(
      row
    )
  }

  updatePagination()
}






/* ==========================================
   REFRESH
========================================== */


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

/* ==========================================
   SAVE TEAM
========================================== */

async function saveTeam() {
  try {
    showError('')

    const validationError =
      validateTeamForm()

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
    await getDb()
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
          .slice(
            0,
            3
          )
    )
    .join('')
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

  const {
    data: activeStatus
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
    .single()

  const {
    data: temporaryType
  } =
  await getDb()
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

  await ensureParticipantRegistryEntry({
    participantTypeCode: 'COMPOSITION',
    sourceId: compositionTeamId,
    displayName: compositionName
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
    await getDb()
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

    showInlineError(
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
      await getDb()
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
  await getDb()
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
  await getDb()
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

    showInlineError(
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

  if (teamModalElement) {
    teamModal =
      createModalByElement(
        teamModalElement
      )
  }

  const deleteModalElement =
    $('deleteTeamModal')

  if (deleteModalElement) {
    deleteTeamModal =
      createModalByElement(
        deleteModalElement
      )
  }
}

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
      !hasDb()
    ) {

      return
    }

    initializeModals()

    wireEvents()

    await refreshTeams()

  } catch (error) {
  }
}

/* ==========================================
   STARTUP
========================================== */

document.addEventListener(
  'DOMContentLoaded',
  initializeTeams
)
