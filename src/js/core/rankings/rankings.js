/* eslint camelcase: 0 */

import {
  PAGE_SIZE
} from './services/constants.js'
import {
  getDb
} from './supabase/getDb.js'
import {
  getInputValue as getValue,
  setFalsyEmptyValue as setValue
} from './services/domService.js'
import {
  createDualFeedbackController
} from './services/feedbackService.js'
import {
  createLoadingController
} from './services/uiService.js'
import {
  createSimplePaginationUpdater
} from './services/paginationService.js'
import {
  createModal,
  showModal,
  hideModal
} from './services/modalService.js'
import {
  buildActionButtons,
  buildActionCell
} from './services/tableRendererService.js'
import {
  getRankingBadge
} from './services/badgeService.js'

const db =
  getDb()

let rankings = []
let filteredRankings = []

let rankingTypes = []
let teams = []

let currentPage = 1



const rankingsTableBody =
  document.getElementById(
    'rankingsTableBody'
  )

const searchRanking =
  document.getElementById(
    'searchRanking'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  )
const {
  show: showLoading,
  hide: hideLoading
} = createLoadingController(
  'rankingLoading'
)

const rankingFeedback =
  createDualFeedbackController({
    errorContainerId:
      'rankingFormError',
    successContainerId:
      'rankingFormSuccess'
  })

const showError =
  rankingFeedback.error
    .bind(rankingFeedback)

const showSuccess =
  rankingFeedback.success
    .bind(rankingFeedback)

const clearError =
  rankingFeedback.clearError
    .bind(rankingFeedback)

async function loadRankingTypes() {
  const { data, error } =
    await db
      .from(
        'ranking_type_master'
      )
      .select('*')
      .order(
        'ranking_type_name'
      )

  if (error) {
    showError(
      error.message ||
      'Unable to load ranking options.'
    )
    return
  }

  rankingTypes =
    data || []

  const select =
    document.getElementById(
      'rankingTypeId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select Ranking Type
    </option>
    `

  for (
    const rankingType
    of rankingTypes
  ) {
    select.innerHTML += `
      <option
        value="${rankingType.ranking_type_id}"
      >
        ${rankingType.ranking_type_name}
      </option>
    `
  }
}

async function loadTeams() {
  const { data, error } =
    await db
      .from('teams')
      .select(`
        team_id,
        team_name
      `)
      .order(
        'team_name'
      )

  if (error) {
    showError(
      error.message ||
      'Unable to load ranking options.'
    )
    return
  }

  teams = data || []

  const select =
    document.getElementById(
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

async function loadRankings() {
  try {
    showLoading()

    const { data, error } =
      await db
        .from('rankings')
        .select(`
          *,
          ranking_type_master(
            ranking_type_name
          ),
          teams(
            team_name
          )
        `)
        .order(
          'ranking_position',
          {
            ascending: true
          }
        )

    if (error) {
      throw error
    }

    rankings =
      data || []

    filteredRankings =
      [...rankings]

    renderRankings()
  } catch (error) {

    showError(
      'Failed to load rankings'
    )
  } finally {
    hideLoading()
  }
}

function renderRankings() {
  if (
    !rankingsTableBody
  ) {
    return
  }

  const start =
    (
      currentPage - 1
    ) * PAGE_SIZE

  const end =
    start + PAGE_SIZE

  const pageRows =
    filteredRankings.slice(
      start,
      end
    )

  rankingsTableBody.innerHTML =
    ''

  if (
    pageRows.length === 0
  ) {
    rankingsTableBody.innerHTML =
      `
      <tr>
        <td
          colspan="7"
          class="text-center"
        >
          No rankings found
        </td>
      </tr>
      `

    updatePagination()

    return
  }

  for (
    const ranking
    of pageRows
  ) {
    rankingsTableBody.innerHTML += `
      <tr>

        <td>
          ${
  ranking
              .ranking_type_master
              ?.ranking_type_name || ''
}
        </td>

        <td>
          ${
  ranking
              .teams
              ?.team_name || ''
}
        </td>

        <td>
          ${getRankingBadge(
    ranking.ranking_position
  )}
        </td>

        <td>
          ${
  ranking
              .ranking_points || 0
}
        </td>

        <td>
          ${
  ranking
              .ranking_date || ''
}
        </td>

        <td>
          ${
  ranking
              .remarks || ''
}
        </td>

        ${buildActionCell(
    buildActionButtons({
      buttons: [
        {
          type: 'edit',
          onClick:
            `editRanking('${ranking.ranking_id}')`
        },
        {
          type: 'delete',
          onClick:
            `confirmDeleteRanking('${ranking.ranking_id}')`
        }
      ]
    })
  )}

      </tr>
    `
  }

  updatePagination()
}

const updatePagination =
  createSimplePaginationUpdater({
    getItemCount: () =>
      filteredRankings.length,
    getCurrentPage: () =>
      currentPage,
    pageSize: PAGE_SIZE,
    infoElementId:
      'paginationInfo',
    previousButtonId:
      'btnPreviousPage',
    nextButtonId:
      'btnNextPage'
  })

function searchRankings() {
  const search =
    (
      searchRanking?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredRankings =

    search ?

      rankings.filter(
        ranking => {
          return (

            (
              ranking
                .ranking_type_master
                ?.ranking_type_name || ''
            )
              .toLowerCase()
              .includes(search) ||

            (
              ranking
                .teams
                ?.team_name || ''
            )
              .toLowerCase()
              .includes(search) ||

            (
              ranking
                .remarks || ''
            )
              .toLowerCase()
              .includes(search)

          )
        }
      ) :

      [...rankings]

  currentPage = 1

  renderRankings()
}

function clearRankingForm() {
  clearError()

  setValue(
    'rankingId',
    ''
  )

  setValue(
    'rankingTypeId',
    ''
  )

  setValue(
    'teamId',
    ''
  )

  setValue(
    'rankingPosition',
    ''
  )

  setValue(
    'rankingPoints',
    ''
  )

  setValue(
    'remarks',
    ''
  )

  setValue(
    'rankingDate',
    new Date()
      .toISOString()
      .split('T')[0]
  )
}

function openNewRankingModal() {
  clearRankingForm()

  createModal(
    'rankingModal'
  )

  showModal(
    'rankingModal'
  )
}

function validateRanking() {
  clearError()

  if (
    !getValue(
      'rankingTypeId'
    )
  ) {
    showError(
      'Ranking Type is required'
    )

    return false
  }

  if (
    !getValue(
      'teamId'
    )
  ) {
    showError(
      'Team is required'
    )

    return false
  }

  if (
    !getValue(
      'rankingPosition'
    )
  ) {
    showError(
      'Position is required'
    )

    return false
  }

  if (
    !getValue(
      'rankingPoints'
    )
  ) {
    showError(
      'Points are required'
    )

    return false
  }

  if (
    !getValue(
      'rankingDate'
    )
  ) {
    showError(
      'Ranking Date is required'
    )

    return false
  }

  return true
}

async function saveRanking() {
  try {
    if (!validateRanking()) {
      return
    }

    const rankingId =
      getValue('rankingId')

    const payload = {

      ranking_type_id:
        getValue(
          'rankingTypeId'
        ),

      team_id:
        getValue('teamId'),

      ranking_position:
        Number(
          getValue(
            'rankingPosition'
          )
        ),

      ranking_points:
        Number(
          getValue(
            'rankingPoints'
          )
        ),

      ranking_date:
        getValue(
          'rankingDate'
        ),

      remarks:
        getValue('remarks')
    }

    let error

    if (rankingId) {
      const response =
        await db
          .from('rankings')
          .update(payload)
          .eq(
            'ranking_id',
            rankingId
          )

      error =
        response.error
    } else {
      const response =
        await db
          .from('rankings')
          .insert(payload)

      error =
        response.error
    }

    if (error) {
      throw error
    }

    hideModal(
      'rankingModal'
    )

    await loadRankings()

    showSuccess(
      'Ranking saved successfully.'
    )
  } catch (error) {

    showError(
      error.message
    )
  }
}

window.editRanking =
function (
  rankingId
) {
  const ranking =
    rankings.find(
      item =>
        item.ranking_id ===
        rankingId
    )

  if (!ranking) {
    return
  }

  clearError()

  setValue(
    'rankingId',
    ranking.ranking_id
  )

  setValue(
    'rankingTypeId',
    ranking.ranking_type_id
  )

  setValue(
    'teamId',
    ranking.team_id
  )

  setValue(
    'rankingPosition',
    ranking.ranking_position
  )

  setValue(
    'rankingPoints',
    ranking.ranking_points
  )

  setValue(
    'rankingDate',
    ranking.ranking_date
  )

  setValue(
    'remarks',
    ranking.remarks
  )

  createModal(
    'rankingModal'
  )

  showModal(
    'rankingModal'
  )
}

window.confirmDeleteRanking =
function (
  rankingId
) {
  setValue(
    'deleteRankingId',
    rankingId
  )

  createModal(
    'deleteRankingModal'
  )

  showModal(
    'deleteRankingModal'
  )
}

async function deleteRanking() {
  try {
    const rankingId =
      getValue(
        'deleteRankingId'
      )

    const { error } =
      await db
        .from('rankings')
        .delete()
        .eq(
          'ranking_id',
          rankingId
        )

    if (error) {
      throw error
    }

    hideModal(
      'deleteRankingModal'
    )

    await loadRankings()

    showSuccess(
      'Ranking deleted successfully.'
    )
  } catch (error) {

    showError(
      error.message ||
      'Unable to complete ranking operation.'
    )
  }
}

function wireEvents() {
  document
    .getElementById(
      'btnAddRanking'
    )
    ?.addEventListener(
      'click',
      openNewRankingModal
    )

  document
    .getElementById(
      'btnSaveRanking'
    )
    ?.addEventListener(
      'click',
      saveRanking
    )

  document
    .getElementById(
      'btnRefreshRankings'
    )
    ?.addEventListener(
      'click',
      loadRankings
    )

  document
    .getElementById(
      'btnConfirmDeleteRanking'
    )
    ?.addEventListener(
      'click',
      deleteRanking
    )

  searchRanking
    ?.addEventListener(
      'input',
      searchRankings
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

          renderRankings()
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
              filteredRankings.length /
              PAGE_SIZE
            )
          )

        if (
          currentPage <
          totalPages
        ) {
          currentPage++

          renderRankings()
        }
      }
    )
}

async function initializeRankings() {
  try {
    await loadRankingTypes()

    await loadTeams()

    await loadRankings()

    wireEvents()
  } catch (error) {

    showError(
      error.message ||
      'Unable to complete ranking operation.'
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeRankings
)
