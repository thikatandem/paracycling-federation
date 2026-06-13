// =====================================================
// PERFORMANCE MODULE
// ParaCycling Federation Management System
// =====================================================
/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

const db =
  window.supabaseClient

let performanceRecords = []

let filteredPerformance = []

let currentPage = 1

let teams = []

const performanceLoading =
  document.getElementById(
    'performanceLoading'
  )

const performanceFormError =
  document.getElementById(
    'performanceFormError'
  )

const performanceTableBody =
  document.getElementById(
    'performanceTableBody'
  )

const searchPerformanceInput =
  document.getElementById(
    'searchPerformance'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  )
function showLoading() {

  performanceLoading
    ?.classList.remove(
      'd-none'
    )

}

function hideLoading() {

  performanceLoading
    ?.classList.add(
      'd-none'
    )

}

function showError(
  message
) {

  if (
    performanceFormError
  ) {

    performanceFormError.textContent =
      message

  }

}

function clearError() {

  if (
    performanceFormError
  ) {

    performanceFormError.textContent =
      ''

  }

}

function getValue(
  id
) {

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

  if (
    element
  ) {

    element.value =
      value || ''

  }

}
async function loadTeams() {

  try {

    const {
      data,
      error
    } =
      await db
        .from('teams')
        .select(`
          team_id,
          team_name
        `)
        .order(
          'team_name'
        )

    if (
      error
    ) {
      throw error
    }

    teams =
      data || []

    const select =
      document.getElementById(
        'teamId'
      )

    if (
      !select
    ) {
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

  } catch (
    error
  ) {

    console.error(
      error
    )

  }

}
async function loadPerformance() {

  try {

    showLoading()

    const {
      data,
      error
    } =
      await db
        .from(
          'performance'
        )
        .select(`
          *,
          teams(
            team_name
          )
        `)
        .order(
          'performance_date',
          {
            ascending: false
          }
        )

    if (
      error
    ) {
      throw error
    }

    performanceRecords =
      data || []

    filteredPerformance =
      [...performanceRecords]

    renderPerformance()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      'Failed to load performance records'
    )

  } finally {

    hideLoading()

  }

}
function renderPerformance() {

  if (
    !performanceTableBody
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
    filteredPerformance.slice(
      start,
      end
    )

  performanceTableBody.innerHTML =
    ''

  if (
    pageRows.length === 0
  ) {

    performanceTableBody.innerHTML =
      `
      <tr>

        <td
          colspan="11"
          class="text-center"
        >
          No Performance Records Found
        </td>

      </tr>
      `

    updatePagination()

    return

  }

  for (
    const performance
    of pageRows
  ) {

    performanceTableBody.innerHTML += `

      <tr>

        <td>
          ${
            performance.performance_date || ''
          }
        </td>

        <td>
          ${
            performance.teams
              ?.team_name || ''
          }
        </td>

        <td>
          ${
            performance.distance_km || 0
          }
        </td>

        <td>
          ${
            performance.duration_minutes || 0
          }
        </td>

        <td>
          ${
            performance.speed_kmh || 0
          }
        </td>

        <td>
          ${
            performance.avg_hr || 0
          }
        </td>

        <td>
          ${
            performance.max_hr || 0
          }
        </td>

        <td>
          ${
            performance.cadence || 0
          }
        </td>

        <td>
          ${
            performance.power_watts || 0
          }
        </td>

        <td>
          ${
            performance.rpe || 0
          }
        </td>

        <td>

          <button
            class="btn btn-sm btn-warning me-1"
            onclick="editPerformance('${performance.performance_id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-sm btn-danger"
            onclick="confirmDeletePerformance('${performance.performance_id}')"
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
        filteredPerformance.length /
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
function searchPerformance() {

  const search =
    (
      searchPerformance?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredPerformance =
    search
      ? performanceRecords.filter(
        performance => {

          return (

            (
              performance.teams
                ?.team_name || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              performance.performance_date || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            String(
              performance.distance_km || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            String(
              performance.speed_kmh || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            String(
              performance.power_watts || ''
            )
              .toLowerCase()
              .includes(search)

          )

        }
      )
      : [...performanceRecords]

  currentPage = 1

  renderPerformance()

}
function clearPerformanceForm() {

  clearError()

  setValue(
    'performanceId',
    ''
  )

  setValue(
    'performanceDate',
    new Date()
      .toISOString()
      .split('T')[0]
  )

  setValue(
    'teamId',
    ''
  )

  setValue(
    'distanceKm',
    ''
  )

  setValue(
    'durationMinutes',
    ''
  )

  setValue(
    'avgHr',
    ''
  )

  setValue(
    'maxHr',
    ''
  )

  setValue(
    'cadence',
    ''
  )

  setValue(
    'powerWatts',
    ''
  )

  setValue(
    'rpe',
    ''
  )

  setValue(
    'speedKmh',
    ''
  )

}
function openNewPerformanceModal() {

  clearPerformanceForm()

  document.getElementById(
    'performanceModalTitle'
  ).textContent =
    'Add Performance'

  const modal =
    new coreui.Modal(
      document.getElementById(
        'performanceModal'
      )
    )

  modal.show()

}
function validatePerformance() {

  clearError()

  if (
    !getValue(
      'performanceDate'
    )
  ) {

    showError(
      'Performance Date is required'
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
      'distanceKm'
    )
  ) {

    showError(
      'Distance is required'
    )

    return false

  }

  if (
    !getValue(
      'durationMinutes'
    )
  ) {

    showError(
      'Duration is required'
    )

    return false

  }

  const distance =
    Number(
      getValue(
        'distanceKm'
      )
    )

  if (
    distance < 0
  ) {

    showError(
      'Distance cannot be negative'
    )

    return false

  }

  const duration =
    Number(
      getValue(
        'durationMinutes'
      )
    )

  if (
    duration <= 0
  ) {

    showError(
      'Duration must be greater than zero'
    )

    return false

  }

  const avgHr =
    Number(
      getValue(
        'avgHr'
      ) || 0
    )

  const maxHr =
    Number(
      getValue(
        'maxHr'
      ) || 0
    )

  if (
    maxHr &&
    avgHr &&
    maxHr < avgHr
  ) {

    showError(
      'Max HR cannot be lower than Average HR'
    )

    return false

  }

  const rpe =
    Number(
      getValue(
        'rpe'
      ) || 0
    )

  if (
    rpe &&
    (
      rpe < 1 ||
      rpe > 10
    )
  ) {

    showError(
      'RPE must be between 1 and 10'
    )

    return false

  }

  return true

}
async function savePerformance() {

  try {

    if (
      !validatePerformance()
    ) {
      return
    }

    showLoading()

    const performanceId =
      getValue(
        'performanceId'
      )

    const payload = {

      performance_date:
        getValue(
          'performanceDate'
        ),

      team_id:
        getValue(
          'teamId'
        ),

      distance_km:
        Number(
          getValue(
            'distanceKm'
          )
        ),

      duration_minutes:
        Number(
          getValue(
            'durationMinutes'
          )
        ),

      avg_hr:
        getValue(
          'avgHr'
        )
          ? Number(
              getValue(
                'avgHr'
              )
            )
          : null,

      max_hr:
        getValue(
          'maxHr'
        )
          ? Number(
              getValue(
                'maxHr'
              )
            )
          : null,

      cadence:
        getValue(
          'cadence'
        )
          ? Number(
              getValue(
                'cadence'
              )
            )
          : null,

      power_watts:
        getValue(
          'powerWatts'
        )
          ? Number(
              getValue(
                'powerWatts'
              )
            )
          : null,

      rpe:
        getValue(
          'rpe'
        )
          ? Number(
              getValue(
                'rpe'
              )
            )
          : null
    }

    let error

    if (
      performanceId
    ) {

      const result =
        await db
          .from(
            'performance'
          )
          .update(
            payload
          )
          .eq(
            'performance_id',
            performanceId
          )

      error =
        result.error

    } else {

      const result =
        await db
          .from(
            'performance'
          )
          .insert(
            payload
          )

      error =
        result.error

    }

    if (
      error
    ) {
      throw error
    }
    await db.rpc(
     'rebuild_training_rankings'
    )
    const modalElement =
      document.getElementById(
        'performanceModal'
      )

    const modal =
      coreui.Modal.getInstance(
        modalElement
      )

    if (
      modal
    ) {
      modal.hide()
    }

    await loadPerformance()

  } catch (
    error
  ) {

    console.error(
      error
    )

    showError(
      error.message ||
      'Failed to save performance'
    )

  } finally {

    hideLoading()

  }

}
window.editPerformance =
function (
  performanceId
) {

  const performance =
    performanceRecords.find(
      p =>
        p.performance_id ===
        performanceId
    )

  if (
    !performance
  ) {
    return
  }

  clearError()

  document.getElementById(
    'performanceModalTitle'
  ).textContent =
    'Edit Performance'

  setValue(
    'performanceId',
    performance.performance_id
  )

  setValue(
    'performanceDate',
    performance.performance_date
  )

  setValue(
    'teamId',
    performance.team_id
  )

  setValue(
    'distanceKm',
    performance.distance_km
  )

  setValue(
    'durationMinutes',
    performance.duration_minutes
  )

  setValue(
    'avgHr',
    performance.avg_hr
  )

  setValue(
    'maxHr',
    performance.max_hr
  )

  setValue(
    'cadence',
    performance.cadence
  )

  setValue(
    'powerWatts',
    performance.power_watts
  )

  setValue(
    'rpe',
    performance.rpe
  )

  setValue(
    'speedKmh',
    performance.speed_kmh
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'performanceModal'
      )
    )

  modal.show()

}
window.confirmDeletePerformance =
function (
  performanceId
) {

  setValue(
    'deletePerformanceId',
    performanceId
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'deletePerformanceModal'
      )
    )

  modal.show()

}
async function deletePerformance() {

  try {

    const performanceId =
      getValue(
        'deletePerformanceId'
      )

    if (
      !performanceId
    ) {
      return
    }

    showLoading()

    const {
      error
    } =
      await db
        .from(
          'performance'
        )
        .delete()
        .eq(
          'performance_id',
          performanceId
        )

    if (
      error
    ) {
      throw error
    }

    await db.rpc(
      'rebuild_training_rankings'
    )

    const modalElement =
      document.getElementById(
        'deletePerformanceModal'
      )

    const modal =
      coreui.Modal.getInstance(
        modalElement
      )

    if (
      modal
    ) {
      modal.hide()
    }

    await loadPerformance()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      error.message ||
      'Delete failed'
    )

  } finally {

    hideLoading()

  }

}
function wireEvents() {

  document
    .getElementById(
      'btnAddPerformance'
    )
    ?.addEventListener(
      'click',
      openNewPerformanceModal
    )

  document
    .getElementById(
      'btnSavePerformance'
    )
    ?.addEventListener(
      'click',
      savePerformance
    )

  document
    .getElementById(
      'btnRefreshPerformance'
    )
    ?.addEventListener(
      'click',
      loadPerformance
    )

  document
    .getElementById(
      'btnConfirmDeletePerformance'
    )
    ?.addEventListener(
      'click',
      deletePerformance
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

          renderPerformance()

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
            filteredPerformance.length /
            PAGE_SIZE
          )

        if (
          currentPage <
          totalPages
        ) {

          currentPage++

          renderPerformance()

        }

      }
    )

  searchPerformanceInput
    ?.addEventListener(
      'input',
      searchPerformance
    )

}
async function initializePerformance() {

  try {

    if (
      !window.supabaseClient
    ) {

      console.error(
        'Database client not found'
      )

      return

    }

    await loadTeams()

    await loadPerformance()

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
  initializePerformance
)
