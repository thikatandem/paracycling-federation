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

let events = []

let sourceRecords = []
let selectedTeamId = null


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
async function loadEvents() {

  const {
    data,
    error
  } =
    await db
      .from('events')
      .select(`
  event_id,
  event_name,
  event_category
`)
      .order(
        'event_name'
      )

  if (error) {
    throw error
  }

  events =
    data || []

  const select =
    document.getElementById(
      'eventId'
    )

  select.innerHTML =
    '<option value="">Select Event</option>'

  events.forEach(
    event => {

      select.innerHTML += `
        <option
          value="${event.event_id}"
        >
          ${event.event_name}
        </option>
      `

    }
  )

}

function filterEventsBySource() {

  const sourceType =
    getValue(
      'sourceType'
    )

  const select =
    document.getElementById(
      'eventId'
    )

  if (
    !select
  ) {
    return
  }

  select.innerHTML =
    '<option value="">Select Event</option>'

  events
    .filter(
      event =>
        event.event_category ===
        sourceType
    )
    .forEach(
      event => {

        select.innerHTML += `
          <option
            value="${event.event_id}"
          >
            ${event.event_name}
          </option>
        `

      }
    )

}

async function loadTrainingSources(
  eventId
) {

  const {
    data
  } =
    await db
      .from(
        'training_log'
      )
      .select(`
        training_id,
        training_date,
        session_type
      `)
      .eq(
        'event_id',
        eventId
      )

  sourceRecords =
    data || []

}
async function loadCompetitionSources(
  eventId
) {

  const {
    data
  } =
    await db
      .from(
        'race_results'
      )
      .select(`
        result_id,
        competition_date,
        position
      `)
      .eq(
        'event_id',
        eventId
      )

  sourceRecords =
    data || []

}

async function handleSourceChange() {

  setValue(
    'sourceRecordId',
    ''
  )

  const sourceType =
    getValue(
      'sourceType'
    )

  const eventId =
    getValue(
      'eventId'
    )

  if (
    !sourceType ||
    !eventId
  ) {

    sourceRecords = []

    populateSourceRecords()

    return

  }

  if (
    sourceType ===
    'TRAINING'
  ) {

    await loadTrainingSources(
      eventId
    )

  } else {

    await loadCompetitionSources(
      eventId
    )

  }

  populateSourceRecords()

}
function populateSourceRecords() {

  const select =
    document.getElementById(
      'sourceRecordId'
    )

  if (
    !select
  ) {
    return
  }

  select.innerHTML =
    '<option value="">Select Record</option>'

  const sourceType =
    getValue(
      'sourceType'
    )

  sourceRecords.forEach(
    record => {

      if (
        sourceType ===
        'TRAINING'
      ) {

        select.innerHTML += `
          <option value="${record.training_id}">
            ${record.training_date} - ${record.session_type}
          </option>
        `

      } else {

        select.innerHTML += `
          <option value="${record.result_id}">
            ${record.competition_date} - Position ${record.position}
          </option>
        `

      }

    }
  )

}

async function loadSourceRecordDetails() {

  const sourceType =
    getValue(
      'sourceType'
    )

  const recordId =
    getValue(
      'sourceRecordId'
    )

  if (
    !sourceType ||
    !recordId
  ) {
    return
  }

  let source = null

  if (
    sourceType ===
    'TRAINING'
  ) {

    const {
      data,
      error
    } =
      await db
        .from(
          'training_log'
        )
        .select(`
  training_id,
  training_date,
  team_id,
  distance_km,
  duration_minutes,
  avg_speed_kmh,
  teams(
    team_name
  )
`)
          
        .eq(
          'training_id',
          recordId
        )
        .single()

    if (
      error
    ) {
      throw error
    }

    source = data

    selectedTeamId =
      source.team_id
    setValue(
  'teamName',
  source.teams?.team_name || ''
)
    setValue(
      'performanceDate',
      source.training_date
    )

    setValue(
      'maxSpeedKmh',
      ''
    )

  } else {

    const {
      data,
      error
    } =
      await db
        .from(
          'race_results'
        )
        .select(`
  result_id,
  competition_date,
  team_id,
  distance_km,
  duration_minutes,
  avg_speed_kmh,
  max_speed_kmh,
  teams(
    team_name
  )
`)
          
        .eq(
          'result_id',
          recordId
        )
        .single()

    if (
      error
    ) {
      throw error
    }

    source = data

    selectedTeamId =
      source.team_id

    setValue(
      'performanceDate',
      source.competition_date
    )
   setValue(
  'teamName',
  source.teams?.team_name || ''
)
    setValue(
      'maxSpeedKmh',
      source.max_speed_kmh || ''
    )

  }

  setValue(
    'distanceKm',
    source.distance_km || ''
  )

  setValue(
    'durationMinutes',
    source.duration_minutes || ''
  )

  setValue(
    'avgSpeedKmh',
    source.avg_speed_kmh || ''
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
            performance.avg_speed_kmh || 0
          }
        </td>

        <td>
          ${
            performance.avg_heart_rate || 0
          }
        </td>

        <td>
          ${
            performance.max_heart_rate || 0
          }
        </td>

        <td>
          ${
            performance.avg_cadence_rpm || 0
          }
        </td>

        <td>
          ${
            performance.avg_watts || 0
          }
        </td>

        <td>
          ${
            performance.training_stress_score || 0
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
  searchPerformanceInput?.value || ''
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
              performance.avg_speed_kmh || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            String(
              performance.avg_watts || ''
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

  selectedTeamId = null

  setValue(
    'performanceId',
    ''
  )

  setValue(
    'sourceType',
    ''
  )

  setValue(
    'eventId',
    ''
  )

  setValue(
    'sourceRecordId',
    ''
  )

  setValue(
    'performanceDate',
    ''
  )

  setValue(
    'teamName',
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
    'avgSpeedKmh',
    ''
  )

  setValue(
    'maxSpeedKmh',
    ''
  )

  setValue(
    'avgWatts',
    ''
  )

  setValue(
    'maxWatts',
    ''
  )

  setValue(
    'avgCadenceRpm',
    ''
  )

  setValue(
    'maxCadenceRpm',
    ''
  )

  setValue(
    'avgHeartRate',
    ''
  )

  setValue(
    'maxHeartRate',
    ''
  )

  setValue(
    'normalizedPower',
    ''
  )

  setValue(
    'trainingStressScore',
    ''
  )

  setValue(
    'elevationGain',
    ''
  )

  sourceRecords = []

  populateSourceRecords()

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
      'sourceType'
    )
  ) {

    showError(
      'Source Type is required'
    )

    return false

  }

  if (
    !getValue(
      'eventId'
    )
  ) {

    showError(
      'Event is required'
    )

    return false

  }

  if (
    !getValue(
      'sourceRecordId'
    )
  ) {

    showError(
      'Source Record is required'
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

      source_type:
        getValue(
          'sourceType'
        ),

      event_id:
        getValue(
          'eventId'
        ),

      training_id:
        getValue(
          'sourceType'
        ) === 'TRAINING'
          ? getValue(
              'sourceRecordId'
            )
          : null,

      result_id:
        getValue(
          'sourceType'
        ) === 'COMPETITION'
          ? getValue(
              'sourceRecordId'
            )
          : null,

      performance_date:
        getValue(
          'performanceDate'
        ),

      team_id:
        selectedTeamId,

      distance_km:
        Number(
          getValue(
            'distanceKm'
          ) || 0
        ),

      duration_minutes:
        Number(
          getValue(
            'durationMinutes'
          ) || 0
        ),

      avg_speed_kmh:
        Number(
          getValue(
            'avgSpeedKmh'
          ) || 0
        ),

      max_speed_kmh:
        getValue(
          'maxSpeedKmh'
        ) || null,

      avg_watts:
        getValue(
          'avgWatts'
        ) || null,

      max_watts:
        getValue(
          'maxWatts'
        ) || null,

      avg_cadence_rpm:
        getValue(
          'avgCadenceRpm'
        ) || null,

      max_cadence_rpm:
        getValue(
          'maxCadenceRpm'
        ) || null,

      avg_heart_rate:
        getValue(
          'avgHeartRate'
        ) || null,

      max_heart_rate:
        getValue(
          'maxHeartRate'
        ) || null,

      normalized_power:
        getValue(
          'normalizedPower'
        ) || null,

      training_stress_score:
        getValue(
          'trainingStressScore'
        ) || null,

      elevation_gain:
        getValue(
          'elevationGain'
        ) || null

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

  selectedTeamId =
    performance.team_id

  setValue(
    'performanceId',
    performance.performance_id
  )

  setValue(
    'sourceType',
    performance.source_type
  )

  setValue(
    'eventId',
    performance.event_id
  )

  if (
    performance.source_type ===
    'TRAINING'
  ) {

    loadTrainingSources(
      performance.event_id
    ).then(
      () => {

        populateSourceRecords()

        setValue(
          'sourceRecordId',
          performance.training_id
        )

        loadSourceRecordDetails()

      }
    )

  } else {

    loadCompetitionSources(
      performance.event_id
    ).then(
      () => {

        populateSourceRecords()

        setValue(
          'sourceRecordId',
          performance.result_id
        )

        loadSourceRecordDetails()

      }
    )

  }

  setValue(
    'performanceDate',
    performance.performance_date
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
    'avgSpeedKmh',
    performance.avg_speed_kmh
  )

  setValue(
    'maxSpeedKmh',
    performance.max_speed_kmh
  )

  setValue(
    'avgWatts',
    performance.avg_watts
  )

  setValue(
    'maxWatts',
    performance.max_watts
  )

  setValue(
    'avgCadenceRpm',
    performance.avg_cadence_rpm
  )

  setValue(
    'maxCadenceRpm',
    performance.max_cadence_rpm
  )

  setValue(
    'avgHeartRate',
    performance.avg_heart_rate
  )

  setValue(
    'maxHeartRate',
    performance.max_heart_rate
  )

  setValue(
    'normalizedPower',
    performance.normalized_power
  )

  setValue(
    'trainingStressScore',
    performance.training_stress_score
  )

  setValue(
    'elevationGain',
    performance.elevation_gain
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
    'sourceRecordId'
  )
  ?.addEventListener(
    'change',
    loadSourceRecordDetails
  )

   document
  .getElementById(
    'sourceType'
  )
  ?.addEventListener(
    'change',
    () => {

      setValue(
        'eventId',
        ''
      )

      setValue(
        'sourceRecordId',
        ''
      )

      filterEventsBySource()

    }
  )

document
  .getElementById(
    'eventId'
  )
  ?.addEventListener(
    'change',
    handleSourceChange
  )
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

   await loadEvents()

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
