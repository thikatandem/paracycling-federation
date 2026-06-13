// =====================================================
// COMPETITION RANKINGS MODULE
// =====================================================

/* global coreui */
/* eslint-disable no-console */

const PAGE_SIZE = 10

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
function showLoading() {
  rankingLoading?.classList.remove(
    'd-none'
  )
}

function hideLoading() {
  rankingLoading?.classList.add(
    'd-none'
  )
}

function formatNumber(value) {
  return Number(
    value || 0
  ).toFixed(2)
}
async function loadCompetitionRankings() {
  try {

    showLoading()

    const { data, error } =
      await db
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

    console.error(error)

    alert(
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
function updatePagination() {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRankings.length /
        PAGE_SIZE
      )
    )

  if (
    paginationInfo
  ) {

    paginationInfo.textContent =
      `Page ${currentPage} of ${totalPages}`

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
function searchCompetitionRankings() {

  const search =
    (
      searchRanking?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredRankings =
    search
      ? rankings.filter(
        ranking => {

          return (

            (
              ranking.teams
                ?.team_name || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              ranking.ranking_type_master
                ?.ranking_type_name || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            String(
              ranking.ranking_position || ''
            )
              .includes(search)

          )

        }
      )
      : [...rankings]

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
      !window.supabaseClient
    ) {

      console.error(
        'Database client not found'
      )

      return

    }

    await loadCompetitionRankings()

    wireEvents()

  } catch (
    error
  ) {

    console.error(
      error
    )

  }

}

document.addEventListener(
  'DOMContentLoaded',
  initializeCompetitionRankings
)
