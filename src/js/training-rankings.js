// =====================================================
// TRAINING RANKINGS MODULE
// =====================================================
/* global coreui */
/* eslint-disable no-console */

const db =
  window.supabaseClient

const PAGE_SIZE = 10

let trainingRankings = []

let filteredTrainingRankings = []

let currentPage = 1

const trainingRankingLoading =
  document.getElementById(
    'trainingRankingLoading'
  )

const trainingRankingsTableBody =
  document.getElementById(
    'trainingRankingsTableBody'
  )

const searchTrainingRanking =
  document.getElementById(
    'searchTrainingRanking'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  )
function showLoading() {

  trainingRankingLoading
    ?.classList.remove(
      'd-none'
    )

}

function hideLoading() {

  trainingRankingLoading
    ?.classList.add(
      'd-none'
    )

}

function formatNumber(
  value
) {

  return Number(
    value || 0
  ).toFixed(2)

}
async function loadTrainingRankings() {

  try {

    showLoading()

    const {
      data,
      error
    } =
      await db
        .from(
          'training_rankings'
        )
        .select(`
          *,
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

    if (
      error
    ) {
      throw error
    }

    trainingRankings =
      data || []

    filteredTrainingRankings =
      [...trainingRankings]

    renderTrainingRankings()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      'Failed to load training rankings'
    )

  } finally {

    hideLoading()

  }

}
function renderTrainingRankings() {

  if (
    !trainingRankingsTableBody
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
    filteredTrainingRankings.slice(
      start,
      end
    )

  trainingRankingsTableBody.innerHTML =
    ''

  if (
    pageRows.length === 0
  ) {

    trainingRankingsTableBody.innerHTML =
      `
      <tr>
        <td colspan="9" class="text-center">
          No training rankings found
        </td>
      </tr>
      `

    updatePagination()

    return

  }

  for (
    const row
    of pageRows
  ) {

    trainingRankingsTableBody.innerHTML +=
      `
      <tr>

        <td>
          ${row.ranking_position || ''}
        </td>

        <td>
          ${row.teams?.team_name || ''}
        </td>

        <td>
          ${formatNumber(
            row.total_score
          )}
        </td>

        <td>
          ${formatNumber(
            row.attendance_score
          )}
        </td>

        <td>
          ${formatNumber(
            row.distance_score
          )}
        </td>

        <td>
          ${formatNumber(
            row.duration_score
          )}
        </td>

        <td>
          ${formatNumber(
            row.speed_score
          )}
        </td>

        <td>
          ${formatNumber(
            row.power_score
          )}
        </td>

        <td>
          ${formatNumber(
            row.recovery_score
          )}
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
        filteredTrainingRankings.length /
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
function searchTrainingRankings() {

  const search =
    (
      searchTrainingRanking?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredTrainingRankings =
    search
      ? trainingRankings.filter(
          ranking => {

            return (

              (
                ranking.teams
                  ?.team_name || ''
              )
                .toLowerCase()
                .includes(
                  search
                )

              ||

              String(
                ranking.ranking_position || ''
              )
                .includes(
                  search
                )

            )

          }
        )
      : [...trainingRankings]

  currentPage = 1

  renderTrainingRankings()

}
function wireEvents() {

  document
    .getElementById(
      'btnRefreshTrainingRankings'
    )
    ?.addEventListener(
      'click',
      loadTrainingRankings
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

          renderTrainingRankings()

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
            filteredTrainingRankings.length /
            PAGE_SIZE
          )

        if (
          currentPage <
          totalPages
        ) {

          currentPage++

          renderTrainingRankings()

        }

      }
    )

  searchTrainingRanking
    ?.addEventListener(
      'input',
      searchTrainingRankings
    )

}
async function initializeTrainingRankings() {

  try {

    if (
      !window.supabaseClient
    ) {

      console.error(
        'Supabase client not found'
      )

      return

    }

    await loadTrainingRankings()

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
  initializeTrainingRankings
)
