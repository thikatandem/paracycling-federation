/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

const db =
  window.supabaseClient

let rankings = []
let filteredRankings = []

let rankingTypes = []
let teams = []

let currentPage = 1

const rankingLoading =
  document.getElementById(
    'rankingLoading'
  )

const rankingFormError =
  document.getElementById(
    'rankingFormError'
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

function showError(message) {
  if (rankingFormError) {
    rankingFormError.textContent =
      message
  }
}

function clearError() {
  if (rankingFormError) {
    rankingFormError.textContent = ''
  }
}

function getValue(id) {
  return (
    document.getElementById(id)
      ?.value || ''
  )
}

function setValue(
  id,
  value
) {
  const element =
    document.getElementById(id)

  if (element) {
    element.value =
      value || ''
  }
}
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
    console.error(error)
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
    console.error(error)
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

    console.error(error)

    alert(
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
          ${
            ranking
              .ranking_position || ''
          }
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

        <td>

          <button
            class="btn btn-sm btn-warning me-1"
            onclick="editRanking('${ranking.ranking_id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-sm btn-danger"
            onclick="confirmDeleteRanking('${ranking.ranking_id}')"
          >
            Delete
          </button>

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

  if (paginationInfo) {

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

  if (previousButton) {

    previousButton.disabled =
      currentPage <= 1

  }

  if (nextButton) {

    nextButton.disabled =
      currentPage >= totalPages

  }
}
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
              .includes(search)

            ||

            (
              ranking
                .teams
                ?.team_name || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              ranking
                .remarks || ''
            )
              .toLowerCase()
              .includes(search)

          )

        }
      )

      :

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

  const modal =
    new coreui.Modal(
      document.getElementById(
        'rankingModal'
      )
    )

  modal.show()
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

    coreui.Modal
      .getInstance(
        document.getElementById(
          'rankingModal'
        )
      )
      ?.hide()

    await loadRankings()

  } catch (error) {

    console.error(error)

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

  const modal =
    new coreui.Modal(
      document.getElementById(
        'rankingModal'
      )
    )

  modal.show()
}
window.confirmDeleteRanking =
function (
  rankingId
) {

  setValue(
    'deleteRankingId',
    rankingId
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'deleteRankingModal'
      )
    )

  modal.show()
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

    coreui.Modal
      .getInstance(
        document.getElementById(
          'deleteRankingModal'
        )
      )
      ?.hide()

    await loadRankings()

  } catch (error) {

    console.error(error)

    alert(
      error.message
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

    console.error(error)

    alert(
      error.message
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeRankings
)
