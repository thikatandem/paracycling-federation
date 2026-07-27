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

import {
  downloadCsv,
  downloadExcelWorkbook,
  downloadPdf
} from '../export/exportService.js'


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
            team_id,
            team_code,
            team_name
          ),
          athletes(
            athlete_id,
            athlete_code,
            first_name,
            last_name
          ),
          participant_registry(
            participant_ref_id,
            display_name,
            participant_type_master(
              participant_type_code,
              participant_type_name
            )
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

function rankingEntity(row) {
  if (row.teams?.team_name) {
    return row.teams.team_name
  }

  if (row.participant_registry?.display_name) {
    return row.participant_registry.display_name
  }

  const athleteName =
    `${row.athletes?.first_name || ''} ${row.athletes?.last_name || ''}`
      .trim()

  return athleteName || 'Unnamed Individual'
}

function flattenRanking(row) {
  return {
    position: row.ranking_position || '',
    entity: rankingEntity(row),
    entity_type: row.teams?.team_id ? 'Team' : 'Individual',
    ranking_type: row.ranking_type_master?.ranking_type_name || '',
    ranking_date: row.ranking_date || '',
    ranking_points: row.ranking_points || 0,
    competition_score: row.competition_score || 0,
    average_position: row.average_position || 0,
    average_points: row.average_points || 0,
    gold: row.gold_count || 0,
    silver: row.silver_count || 0,
    bronze: row.bronze_count || 0
  }
}

function rankingColumns() {
  return [
    { key: 'position', label: 'Position' },
    { key: 'entity', label: 'Team / Individual' },
    { key: 'ranking_type', label: 'Ranking Type' },
    { key: 'competition_score', label: 'Competition Score' },
    { key: 'average_position', label: 'Average Position' },
    { key: 'average_points', label: 'Average Points' },
    { key: 'gold', label: 'Gold' },
    { key: 'silver', label: 'Silver' },
    { key: 'bronze', label: 'Bronze' }
  ]
}

function rankingSummary() {
  return {
    Rankings: filteredRankings.length,
    Teams: new Set(filteredRankings.map(row => row.team_id).filter(Boolean)).size,
    Individuals: new Set(filteredRankings.map(row => row.participant_ref_id || row.athlete_id).filter(Boolean)).size
  }
}

function exportRankingsCsv() {
  downloadCsv({ reportName: 'Competition Rankings', columns: rankingColumns(), data: filteredRankings.map(flattenRanking) })
}

async function exportRankingsExcel() {
  await downloadExcelWorkbook({
    reportName: 'Competition Rankings',
    sheets: [
      {
        sheetName: 'Summary',
        columns: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }],
        data: Object.entries(rankingSummary()).map(([metric, value]) => ({ metric, value }))
      },
      { sheetName: 'Rankings', columns: rankingColumns(), data: filteredRankings.map(flattenRanking) }
    ]
  })
}

function exportRankingsPdf() {
  downloadPdf({ reportName: 'Competition Rankings', columns: rankingColumns(), data: filteredRankings.map(flattenRanking), summary: rankingSummary() })
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
          ${rankingEntity(row)}
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

            rankingEntity(ranking)
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

    document.getElementById('btnExportRankingsCsv')?.addEventListener('click', exportRankingsCsv)
    document.getElementById('btnExportRankingsExcel')?.addEventListener('click', exportRankingsExcel)
    document.getElementById('btnExportRankingsPdf')?.addEventListener('click', exportRankingsPdf)

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
