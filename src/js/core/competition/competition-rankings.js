// =====================================================
// COMPETITION RANKINGS MODULE
// =====================================================

import {
  formatFixedNumber as formatNumber
} from '../services/formattingService.js'

import {
  createSimplePaginationUpdater
} from '../services/paginationService.js'

import {
  createLoadingController
} from '../services/uiService.js'

import {
  showInlineError
} from '../services/feedbackService.js'

import {
  PAGE_SIZE
} from '../services/constants.js'

import {
  getDb,
  hasDb
} from '../supabase/getDb.js'


const {
  show: showLoading,
  hide: hideLoading
} = createLoadingController(
  'rankingLoading'
)

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

let rankings = []

let filteredRankings = []

let currentPage = 1

const rankingLoading =
  document.getElementById(
    'rankingLoading'
  )

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



async function loadCompetitionRankings() {
  try {
    showLoading()

    const { data, error } =
      await getDb()
        .from('rankings')
        .select(`
          *,
          teams(
            team_name
          ),
          ranking_type_master(
            ranking_type_name
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

    renderCompetitionRankings()
  } catch (error) {

    showInlineError(
      'Failed to load competition rankings'
    )
  } finally {
    hideLoading()
  }
}

function renderCompetitionRankings() {
  if (!rankingsTableBody) {
    return
  }

  const start =
    (currentPage - 1) *
    PAGE_SIZE

  const end =
    start +
    PAGE_SIZE

  const pageRows =
    filteredRankings.slice(
      start,
      end
    )

  rankingsTableBody.innerHTML = ''

  if (pageRows.length === 0) {
    rankingsTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center">
          No competition rankings found
        </td>
      </tr>
    `

    updatePagination()

    return
  }

  for (const row of pageRows) {
    rankingsTableBody.innerHTML += `

      <tr>

        <td>
          ${row.ranking_position || ''}
        </td>

        <td>
          ${row.teams?.team_name || ''}
        </td>

        <td>
          ${row.ranking_type_master?.ranking_type_name || ''}
        </td>

        <td>
          ${formatNumber(
    row.competition_score
  )}
        </td>

        <td>
          ${formatNumber(
    row.average_position
  )}
        </td>

        <td>
          ${formatNumber(
    row.average_points
  )}
        </td>

        <td>
          ${row.gold_count || 0}
        </td>

        <td>
          ${row.silver_count || 0}
        </td>

        <td>
          ${row.bronze_count || 0}
        </td>

      </tr>

    `
  }

  updatePagination()
}


function searchCompetitionRankings() {
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
              ranking.teams
                ?.team_name || ''
            )
              .toLowerCase()
              .includes(search) ||

            (
              ranking.ranking_type_master
                ?.ranking_type_name || ''
            )
              .toLowerCase()
              .includes(search) ||

            String(
              ranking.ranking_position || ''
            )
              .includes(search)

          )
        }
      ) :
      [...rankings]

  currentPage = 1

  renderCompetitionRankings()
}

function wireEvents() {
  document
    .getElementById(
      'btnRefreshRankings'
    )
    ?.addEventListener(
      'click',
      loadCompetitionRankings
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

          renderCompetitionRankings()
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
            filteredRankings.length /
            PAGE_SIZE
          )

        if (
          currentPage <
          totalPages
        ) {
          currentPage++

          renderCompetitionRankings()
        }
      }
    )

  searchRanking
    ?.addEventListener(
      'input',
      searchCompetitionRankings
    )
}

async function initializeCompetitionRankings() {
  try {
    if (
      !hasDb()
    ) {

      return
    }

    await loadCompetitionRankings()

    wireEvents()
  } catch (
    error
  ) {
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeCompetitionRankings
)
