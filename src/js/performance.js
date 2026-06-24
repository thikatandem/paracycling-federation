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
let trainingCategoryId = null
let competitionCategoryId = null
let selectedParticipantId = null
let cancelledStatusId = null
let selectedParticipantInstanceId = null
let selectedAthleteId = null
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


async function loadStatusIds() {

  const { data, error } =
    await db
      .from('status_master')
      .select(`
        status_id,
        status_name
      `)

  if (error) {
    throw error
  }

  cancelledStatusId =
    data.find(
      status =>
        status.status_name ===
        'Cancelled'
    )?.status_id

}


async function loadEvents() {

  const {
    data: categories,
    error: categoryError
  } =
    await db
      .from(
        'event_category_master'
      )
      .select(`
        event_category_id,
        category_code
      `)

  if (categoryError) {
    throw categoryError
  }

  trainingCategoryId =
    categories.find(
      c =>
        c.category_code ===
        'TRAINING'
    )?.event_category_id

  competitionCategoryId =
    categories.find(
      c =>
        c.category_code ===
        'COMPETITION'
    )?.event_category_id

  const {
    data,
    error
  } =
    await db
      .from('events')
      .select(`
        event_id,
        event_name,
        event_category_id
      `)
      .order(
        'event_name'
      )

  if (error) {
    throw error
  }

  events =
    data || []

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

  if (!select) {
    return
  }

  select.innerHTML =
    '<option value="">Select Event</option>'

  let categoryId = null

  if (
    sourceType ===
    'TRAINING'
  ) {

    categoryId =
      trainingCategoryId

  } else if (
    sourceType ===
    'COMPETITION'
  ) {

    categoryId =
      competitionCategoryId

  }

  events
    .filter(
      event =>
        event.event_category_id ===
        categoryId
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
        participant_id,
        participant_instance_id,
        athlete_id,
        team_id,

        participant_instances(
          participant_ref_id,

          participant_registry(
            display_name
          ),

          event_instances(
            event_area
          )
        )
      `)
      .eq(
        'event_id',
        eventId
      )

  if (error) {
    throw error
  }

  sourceRecords =
    data || []

}
async function loadCompetitionSources(
  eventId
) {

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
        position,
        participant_id,
        participant_instance_id,
        athlete_id,
        team_id,

        participant_instances(
          participant_ref_id,

          participant_registry(
            display_name
          ),

          event_instances(
            event_area
          )
        )
      `)
      .eq(
        'event_id',
        eventId
      )

  if (error) {
    throw error
  }

  sourceRecords =
    data || []

}


function populateSourceRecords() {

  const select =
    document.getElementById(
      'sourceRecordId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    '<option value="">Select Source Record</option>'

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
          <option
            value="${record.training_id}"
          >
            ${
  record
    .participant_instances
    ?.event_instances
    ?.event_area || ''
}
 - ${
  record
    .participant_instances
    ?.participant_registry
    ?.display_name || ''
}
 - ${
  record.training_date || ''
}
          </option>
        `

      } else {

        select.innerHTML += `
          <option
            value="${record.result_id}"
          >
            ${
  record
    .participant_instances
    ?.event_instances
    ?.event_area || ''
}
 - ${
  record
    .participant_instances
    ?.participant_registry
    ?.display_name || ''
}
 - ${
  record.competition_date || ''
}
          </option>
        `

      }

    }
  )

}

async function handleSourceChange() {

  selectedTeamId = null
selectedParticipantId = null

  setValue(
    'sourceRecordId',
    ''
  )

  setValue(
    'performanceDate',
    ''
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
    'avgSpeedKmh',
    ''
  )

  setValue(
    'maxSpeedKmh',
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

// await loadAvailableTeams(
 //  eventId
// )

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
    .from('training_log')
.select(`
  training_id,
  training_date,
  participant_id,
  participant_instance_id,
  athlete_id,
  team_id,
  distance_km,
  duration_minutes,
  avg_speed_kmh,

  teams(
    team_name
  ),

  athletes(
    first_name,
    last_name
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

const participantDisplay =
  document.getElementById(
    'participantDisplay'
  )

if (participantDisplay) {

  participantDisplay.value =

    source.team_id

      ? source.teams?.team_name || ''

      : source.athlete_id

      ? `${source.athletes?.first_name || ''} ${source.athletes?.last_name || ''}`.trim()

      : ''

}

selectedParticipantId =
  source.participant_id || null

selectedTeamId =
  source.team_id || null

selectedParticipantInstanceId =
  source.participant_instance_id || null

selectedAthleteId =
  source.athlete_id || null

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
      .from('race_results')
    .select(`
      result_id,
      participant_id,
      participant_instance_id,
      athlete_id,
      competition_date,
      team_id,
      distance_km,
      duration_minutes,
      avg_speed_kmh,
      max_speed_kmh,

      teams(
        team_name
      ),

      athletes(
        first_name,
        last_name
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
const participantDisplay =
  document.getElementById(
    'participantDisplay'
  )

if (participantDisplay) {

  participantDisplay.value =

    source.team_id

      ? source.teams?.team_name || ''

      : source.athlete_id

      ? `${source.athletes?.first_name || ''} ${source.athletes?.last_name || ''}`.trim()

      : ''

}

   
selectedParticipantId =
  source.participant_id || null

selectedTeamId =
  source.team_id || null
selectedParticipantInstanceId =
  source.participant_instance_id || null

selectedAthleteId =
  source.athlete_id || null

setValue(
  'teamId',
  source.team_id || ''
)

setValue(
  'athleteId',
  source.athlete_id || ''
)


    setValue(
      'performanceDate',
      source.competition_date
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

  const element =
    document.getElementById(id)

  return element
    ? element.value
    : ''

}

function setValue(
  id,
  value
) {

  const element =
    document.getElementById(id)

  if (
    !element
  ) {
    return
  }

  element.value =
    value === null ||
    value === undefined
      ? ''
      : String(value)

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

selectedParticipantId = null
const teamSelect =
  document.getElementById(
    'teamId'
  )

if (teamSelect) {

  teamSelect.disabled = false

}
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
  'teamId',
  ''
)

setValue(
  'participantDisplay',
  ''
) 

setValue(
  'athleteId',
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

  const modalElement =
    document.getElementById(
      'performanceModal'
    )

  if (
    !modalElement
  ) {

    showError(
      'performanceModal not found'
    )

    return

  }

  const modal =
    new coreui.Modal(
      modalElement
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

  if (
  !selectedParticipantId &&
  !selectedTeamId
) {

  showError(
    'Selected source record has no participant'
  )

  return false

}

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

      participant_id:
  selectedParticipantId,

participant_instance_id:
  selectedParticipantInstanceId,

athlete_id:
  selectedAthleteId,

team_id:
  selectedTeamId,

      performance_date:
        getValue(
          'performanceDate'
        ),

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

    if (
      !payload.source_type
    ) {

      throw new Error(
        'Source Type is required'
      )

    }

    if (
      !payload.event_id
    ) {

      throw new Error(
        'Event is required'
      )

    }

    if (
      payload.source_type ===
      'TRAINING'
      &&
      !payload.training_id
    ) {

      throw new Error(
        'Training Session not selected'
      )

    }

    if (
      payload.source_type ===
      'COMPETITION'
      &&
      !payload.result_id
    ) {

      throw new Error(
        'Competition Result not selected'
      )

    }

    if (
      !payload.participant_id
    ) {

      throw new Error(
        'Participant not selected'
      )

    }

    if (
  !payload.participant_instance_id
) {

  throw new Error(
    'Participant instance is required.'
  )

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

      selectedTeamId = null
selectedParticipantId = null

      sourceRecords = []

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
        'avgSpeedKmh',
        ''
      )

      setValue(
        'maxSpeedKmh',
        ''
      )

      populateSourceRecords()

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

   await loadStatusIds()

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
