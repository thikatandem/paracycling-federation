import {
  getProgramsForOccurrence
} from '../programs/programService.js'

/* eslint camelcase: 0 */
import {
  loadTrainingEventOptions } from '../services/lookupService.js'
import { createLocationFormLoaders } from '../services/locationLookupService.js'
import { createTrainingMetricCalculators } from '../services/calculationService.js'
import { createSimplePaginationUpdater } from '../services/paginationService.js'
import { createDualFeedbackController } from '../services/feedbackService.js'
import { createLoadingController } from '../services/uiService.js'
import { getInputValue as getValue,
  setStringValue as setValue } from '../services/domService.js'
import { PAGE_SIZE,
  ERROR_TIMEOUT,
  SUCCESS_TIMEOUT
} from '../services/constants.js'
import { getDb } from '../supabase/getDb.js'
import { ensureUniqueActivityRecord } from '../services/activityRecordService.js'
import { createModal,
  hideModal
} from '../services/modalService.js'
const loadTrainingEvents = () =>
  loadTrainingEventOptions({
    selectId: 'eventId',
    onLoad: data => {
      events = data
    }
  })

const {
  loadCounties,
  loadSubcounties,
  loadTowns
} = createLocationFormLoaders({
  onCounties: data => {
    counties = data
  },
  onSubcounties: data => {
    subcounties = data
  },
  onTowns: data => {
    towns = data
  }
})

const {
  calculateDuration,
  calculateAverageSpeed
} = createTrainingMetricCalculators({
  getValue,
  setValue
})

const {
  show: showLoading,
  hide: hideLoading
} = createLoadingController(
  'trainingLoading'
)

const formFeedback =
  createDualFeedbackController({
    errorContainerId:
      'trainingFormError',
    successContainerId:
      'trainingFormSuccess',
    errorOptions: {
      timeout: ERROR_TIMEOUT
    },
    successOptions: {
      timeout: SUCCESS_TIMEOUT
    }
  })

const showError =
  formFeedback.error
    .bind(formFeedback)

const showSuccess =
  formFeedback.success
    .bind(formFeedback)

const clearError =
  formFeedback.clearError
    .bind(formFeedback)

const updatePagination =
  createSimplePaginationUpdater({
    getItemCount: () =>
      filteredTrainingLogs.length,
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

const db =
  getDb()

let trainingLogs = []

let filteredTrainingLogs = []

let events = []

let programs = []
let occurrences = []
let participants = []
let trainingResults = []
let towns = []
let counties = []

let subcounties = []
let currentPage = 1

const trainingLoading =
  document.getElementById(
    'trainingLoading'
  )

const trainingFormError =
  document.getElementById(
    'trainingFormError'
  )

const trainingTableBody =
  document.getElementById(
    'trainingTableBody'
  )

const searchTraining =
  document.getElementById(
    'searchTraining'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  )



async function loadTrainingResults() {
  const {
    data: attendanceData,
    error: attendanceError
  } =
    await db
      .from(
        'attendance_status_master'
      )
      .select(`
        attendance_status_id,
        status_code,
        status_name
      `)

  if (
    attendanceError
  ) {
    throw attendanceError
  }

  const {
    data: outcomeData,
    error: outcomeError
  } =
    await db
      .from(
        'outcome_status_master'
      )
      .select(`
        outcome_status_id,
        status_code,
        status_name
      `)

  if (
    outcomeError
  ) {
    throw outcomeError
  }

  trainingResults = [

    ...(outcomeData || []).map(
      row => ({
        type: 'OUTCOME',
        id:
          row.outcome_status_id,
        ...row
      })
    ),

    ...(attendanceData || []).map(
      row => ({
        type: 'ABSENCE',
        id:
          row.attendance_status_id,
        ...row
      })
    )

  ]

  const select =
    document.getElementById(
      'trainingResultId'
    )

  if (
    !select
  ) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        Select Training Result
      </option>
    `

  for (
    const result
    of trainingResults
  ) {
    select.innerHTML += `
      <option
        value="${result.id}"
      >
        ${result.status_name}
      </option>
    `
  }
}

function deriveTrainingState(
  resultCode
) {
  switch (
    resultCode
  ) {
    case 'FINISHED':
    case 'DNF':
    case 'DISQUALIFIED':
    case 'DISCONTINUED': {
      return {
        attendance: true,
        present: true,
        participated: true,
        absent: false,
        metricsAllowed: true
      }
    }

    case 'DNS': {
      return {
        attendance: true,
        present: true,
        participated: false,
        absent: false,
        metricsAllowed: false
      }
    }

    case 'ABSENT_WITH_APOLOGY':
    case 'ABSENT_WITHOUT_APOLOGY':
    case 'EXCUSED': {
      return {
        attendance: false,
        present: false,
        participated: false,
        absent: true,
        metricsAllowed: false
      }
    }

    default: {
      return null
    }
  }
}

function applyTrainingResultRules() {
  const selectedResult =
    trainingResults.find(
      row =>
        row.id ===
        getValue(
          'trainingResultId'
        )
    )

  if (
    !selectedResult
  ) {
    return
  }

  const resultCode =
    selectedResult
      ?.status_code
      ?.toUpperCase()

  const disableMetrics = [
    'DNS',
    'ABSENT_WITH_APOLOGY',
    'ABSENT_WITHOUT_APOLOGY',
    'EXCUSED'
  ].includes(
    resultCode
  )

  const metricFields = [
    'distanceKm',
    'durationMinutes',
    'startTime',
    'endTime',
    'avgSpeedKmh'
  ]

  for (
    const id
    of metricFields
  ) {
    const field =
      document.getElementById(
        id
      )

    if (
      !field
    ) {
      continue
    }

    field.disabled =
      disableMetrics

    if (
      disableMetrics
    ) {
      field.value = ''
    }
  }
}









async function loadPrograms(
  occurrenceId = null
) {
  const select =
    document.getElementById(
      'programId'
    )

  if (!occurrenceId) {
    programs = []

    if (select) {
      select.innerHTML = `
        <option value="">
          Select Program
        </option>
      `
    }

    return
  }

  programs =
    await getProgramsForOccurrence(
      occurrenceId,
      {
        includeSortOrder: true,
        sortByMasterOrder: true
      }
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Program
    </option>
  `

  for (
    const program
    of programs
  ) {
    select.innerHTML += `
      <option
        value="${program.program_id}"
      >
        ${program.program_name}
      </option>
    `
  }
}

async function loadOccurrences(
  eventId
) {
  if (
    !eventId
  ) {
    return
  }

  const {
    data,
    error
  } =
    await db
      .from(
        'event_instances'
      )
      .select(`
        event_instance_id,
        event_area,
        start_date,
        end_date,
        start_time,
        end_time,
        county_id,
        subcounty_id,
        town_id,

        events(
          event_id,
          event_type_id,

          event_type_master(
            event_type_id,
            event_type_name
          )
        ),

        subcounty_master(
          subcounty_name
        ),

        town_master(
          town_name
        )
      `)
      .eq(
        'event_id',
        eventId
      )
      .order(
        'start_date'
      )

  if (
    error
  ) {
    throw error
  }

  occurrences =
    data || []

  const select =
    document.getElementById(
      'eventInstanceId'
    )

  if (
    !select
  ) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Occurrence
    </option>
  `

  for (
    const occurrence
    of occurrences
  ) {
    select.innerHTML += `
      <option
        value="${occurrence.event_instance_id}"
      >
        ${occurrence.event_area}
        (${occurrence.start_date})
      </option>
    `
  }
}

async function loadParticipants(
  occurrenceId,
  programId
) {
  const {
    data,
    error
  } =
    await db
      .from(
        'participant_instances'
      )
      .select(`
        participant_instance_id,
        participant_ref_id,
        participant_status_id,

        participant_registry(
          participant_ref_id,
          source_id,
          display_name,

          participant_type_master(
            participant_type_code
          )
        ),

        status_master(
          status_id,
          status_code,
          status_name
        )
      `)
      .eq(
        'event_instance_id',
        occurrenceId
      )
      .eq(
        'program_id',
        programId
      )

  if (
    error
  ) {
    throw error
  }

  participants =
    data || []

  const select =
    document.getElementById(
      'participantId'
    )

  if (
    !select
  ) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Participant
    </option>
  `

  const selectedType =
    document.querySelector(
      'input[name="trainingType"]:checked'
    )?.value

  for (
    const participant
    of participants
  ) {
    const participantType =
      participant
        .participant_registry
        ?.participant_type_master
        ?.participant_type_code

    if (
      selectedType ===
        'TEAM' &&
      participantType !==
        'TEAM'
    ) {
      continue
    }

    if (
      selectedType ===
        'INDIVIDUAL' &&
      participantType !==
        'ATHLETE'
    ) {
      continue
    }

    select.innerHTML += `
      <option
        value="${participant.participant_instance_id}"
      >
        ${
          participant
            .participant_registry
            ?.display_name ||
          ''
        }
      </option>
    `
  }
}

async function loadSessionTypes() {
  const {
    data,
    error
  } =
    await db
      .from(
        'training_log'
      )
      .select(
        'session_type'
      )

  if (
    error
  ) {
    throw error
  }

  const datalist =
    document.getElementById(
      'sessionTypes'
    )

  if (
    !datalist
  ) {
    return
  }

  const sessionTypes = [
    'Road Ride',
    'Endurance',
    'Recovery',
    'Hill Climb',
    'Sprint',
    'Time Trial',
    'Gym',
    'Strength',
    'Track',
    'Skills'
  ]

  for (
    const row
    of data || []
  ) {
    if (
      row.session_type &&
      !sessionTypes.includes(
        row.session_type
      )
    ) {
      sessionTypes.push(
        row.session_type
      )
    }
  }

  datalist.innerHTML =
    ''

  for (
    const session
    of sessionTypes
  ) {
    datalist.innerHTML += `
      <option value="${session}">
    `
  }
}




async function loadTrainingLogs() {
  try {
    showLoading()

    const {
      data,
      error
    } =
      await db
        .from(
          'training_log'
        )
        .select(`
          *,

          town_master(
            town_name
          ),

          attendance_status_master(
            status_code,
            status_name
          ),

          outcome_status_master(
            status_code,
            status_name
          ),

          participant_instances(
            participant_instance_id,
            participant_ref_id,
            program_id,
            event_instance_id,

            participant_registry(
              participant_ref_id,
              display_name,

              participant_type_master(
                participant_type_code
              )
            ),

            program_master(
              program_id,
              program_name
            ),

            event_instances(
              event_instance_id,
              event_area,

              events(
                event_id,
                event_name
              )
            )
          )
        `)
        .order(
          'training_date',
          {
            ascending: false
          }
        )

    if (
      error
    ) {
      throw error
    }

    trainingLogs =
      data || []

    filteredTrainingLogs =
      [
        ...trainingLogs
      ]

    renderTrainingLogs()
  } catch (
    error
  ) {

    showError(
      'Failed to load training logs'
    )
  } finally {
    hideLoading()
  }
}

function renderTrainingLogs() {
  if (
    !trainingTableBody
  ) {
    return
  }

  const start =
    (
      currentPage -
      1
    ) *
    PAGE_SIZE

  const end =
    start +
    PAGE_SIZE

  const pageRows =
    filteredTrainingLogs.slice(
      start,
      end
    )

  trainingTableBody.innerHTML =
    ''

  if (
    pageRows.length ===
    0
  ) {
    trainingTableBody.innerHTML = `
      <tr>
        <td
          colspan="12"
          class="text-center"
        >
          No Training Records Found
        </td>
      </tr>
    `

    updatePagination()

    return
  }

  for (
    const training
    of pageRows
  ) {
    const type =
      training
        .participant_instances
        ?.participant_registry
        ?.participant_type_master
        ?.participant_type_code ||
      ''

    const participantName =
      training
        .participant_instances
        ?.participant_registry
        ?.display_name ||
      ''

    const eventName =
      training
        .participant_instances
        ?.event_instances
        ?.events
        ?.event_name ||
      ''

    const occurrence =
      training
        .participant_instances
        ?.event_instances
        ?.event_area ||
      ''

    const program =
      training
        .participant_instances
        ?.program_master
        ?.program_name ||
      ''

    const attendanceStatus =
      training
        .attendance_status_master
        ?.status_code ||
      ''

    const attendanceIndicator =
      attendanceStatus ===
        'ABSENT_WITH_APOLOGY' ||
      attendanceStatus ===
        'ABSENT_WITHOUT_APOLOGY' ?
        '✗' :
        '✓'

    const outcomeStatus =
      training
        .outcome_status_master
        ?.status_code ||
      ''

    const session =
      training.session_type ||
      ''

    trainingTableBody.innerHTML += `
      <tr>

        <td>
          ${
            training.training_date ||
            ''
          }
        </td>

        <td>
          ${type}
        </td>

        <td>
          ${participantName}
        </td>

        <td>
          ${eventName}
        </td>

        <td>
          ${occurrence}
        </td>

        <td>
          ${program}
        </td>

        <td class="text-center">
          ${
            attendanceIndicator ===
            '✓' ?
              '<span class="text-success fw-bold">✓</span>' :
              '<span class="text-danger fw-bold">✗</span>'
          }
        </td>

        <td>
          ${outcomeStatus}
        </td>

        <td>
          ${session}
        </td>

        <td>
          ${
            training.distance_km ??
            ''
          }
        </td>

        <td>
          ${
            training.duration_minutes ??
            ''
          }
        </td>

        <td>
          ${
            training.avg_speed_kmh ??
            ''
          }
        </td>

        <td>

          <button
            class="btn btn-sm btn-warning me-1"
            onclick="editTraining('${training.training_id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-sm btn-danger"
            onclick="confirmDeleteTraining('${training.training_id}')"
          >
            Delete
          </button>

        </td>

      </tr>
    `
  }

  updatePagination()
}


function searchTrainingLogs() {
  const search =
    (
      searchTraining?.value ||
      ''
    )
      .trim()
      .toLowerCase()

  filteredTrainingLogs =
    search ?
      trainingLogs.filter(
        training => {
          return (
            (
              training
                .participant_instances
                ?.participant_registry
                ?.display_name ||
              ''
            )
              .toLowerCase()
              .includes(
                search
              ) ||

            (
              training
                .participant_instances
                ?.event_instances
                ?.events
                ?.event_name ||
              ''
            )
              .toLowerCase()
              .includes(
                search
              ) ||

            (
              training
                .participant_instances
                ?.program_master
                ?.program_name ||
              ''
            )
              .toLowerCase()
              .includes(
                search
              ) ||

            (
              training.session_type ||
              ''
            )
              .toLowerCase()
              .includes(
                search
              ) ||

            (
              training.notes ||
              ''
            )
              .toLowerCase()
              .includes(
                search
              )
          )
        }
      ) :
      [
        ...trainingLogs
      ]

  currentPage =
    1

  renderTrainingLogs()
}

function clearTrainingForm() {
  clearError()

  setValue(
    'trainingId',
    ''
  )

  setValue(
    'eventId',
    ''
  )

  setValue(
    'programId',
    ''
  )

  setValue(
    'eventInstanceId',
    ''
  )

  setValue(
    'participantId',
    ''
  )

  setValue(
    'sessionType',
    ''
  )

  setValue(
    'trainingResultId',
    ''
  )

  setValue(
    'startTime',
    ''
  )

  setValue(
    'endTime',
    ''
  )

  setValue(
    'avgSpeedKmh',
    ''
  )

  setValue(
    'indoorSession',
    'false'
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
    'notes',
    ''
  )

  setValue(
    'trainingWeek',
    ''
  )

  setValue(
    'trainingDay',
    ''
  )

  setValue(
    'trainingDate',
    new Date()
      .toISOString()
      .split(
        'T'
      )[0]
  )

  applyTrainingResultRules()
}

function openNewTrainingModal() {
  clearTrainingForm()

  document.getElementById(
    'eventId'
  ).disabled =
    false

  document.getElementById(
    'eventInstanceId'
  ).disabled =
    false

  document.getElementById(
    'programId'
  ).disabled =
    false

  document.getElementById(
    'participantId'
  ).disabled =
    false

  document.getElementById(
    'countyId'
  ).disabled =
    false

  document.getElementById(
    'subcountyId'
  ).disabled =
    false

  document.getElementById(
    'townName'
  ).readOnly =
    false

  document.getElementById(
    'trainingTypeIndividual'
  ).disabled =
    false

  document.getElementById(
    'trainingTypeTeam'
  ).disabled =
    false

  document.getElementById(
    'participantId'
  )
    .classList
    .remove(
      'd-none'
    )

  const modal =
    createModal('trainingModal')

  modal.show()
}

function validateTraining() {
  clearError()

  if (
    !getValue(
      'trainingDate'
    )
  ) {
    showError(
      'Training Date is required'
    )

    return false
  }

  if (
    !getValue(
      'eventId'
    )
  ) {
    showError(
      'Training Event is required'
    )

    return false
  }

  if (
    !getValue(
      'eventInstanceId'
    )
  ) {
    showError(
      'Event Occurrence is required'
    )

    return false
  }

  if (
    !getValue(
      'programId'
    )
  ) {
    showError(
      'Program is required'
    )

    return false
  }

  if (
    !getValue(
      'participantId'
    )
  ) {
    showError(
      'Participant is required'
    )

    return false
  }

  if (
    !getValue(
      'trainingResultId'
    )
  ) {
    showError(
      'Training Result is required'
    )

    return false
  }

  if (
    !getValue(
      'sessionType'
    )
  ) {
    showError(
      'Session Type is required'
    )

    return false
  }

  const selectedResult =
    trainingResults.find(
      row =>
        row.id ===
        getValue(
          'trainingResultId'
        )
    )

  const derived =
    deriveTrainingState(
      selectedResult
        ?.status_code
    )

  if (
    derived
      ?.metricsAllowed
  ) {
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
  }

  return true
}

async function saveTraining() {
  try {
    if (
      !validateTraining()
    ) {
      return
    }

    const participantInstanceId =
      getValue(
        'participantId'
      )

    const participant =
      participants.find(
        p =>
          p.participant_instance_id ===
          participantInstanceId
      )

    if (
      !participant
    ) {
      throw new Error(
        'Please select a valid participant'
      )
    }

    const eventId =
      getValue(
        'eventId'
      )

    const eventInstanceId =
      getValue(
        'eventInstanceId'
      )

    const programId =
      getValue(
        'programId'
      )

    const occurrence =
      occurrences.find(
        row =>
          row.event_instance_id ===
          eventInstanceId
      )

    if (
      !occurrence
    ) {
      throw new Error(
        'Selected Event Occurrence was not found'
      )
    }

    const selectedResult =
      trainingResults.find(
        row =>
          row.id ===
          getValue(
            'trainingResultId'
          )
      )

    const derived =
      deriveTrainingState(
        selectedResult
          ?.status_code
      )

    const metricsAllowed =
      derived
        ?.metricsAllowed

    const trainingType =
      document.querySelector(
        'input[name="trainingType"]:checked'
      )?.value

    const selectedTown =
      towns.find(
        town =>
          town.town_name
            .trim()
            .toLowerCase() ===
          getValue(
            'townName'
          )
            .trim()
            .toLowerCase()
      )

    if (
      !selectedTown
    ) {
      throw new Error(
        'Occurrence town not found'
      )
    }

    const payload = {
      town_id:
        selectedTown
          ?.town_id ||
        null,

      training_date:
        getValue(
          'trainingDate'
        ),

      training_week:
        getValue(
          'trainingWeek'
        ),

      training_day:
        getValue(
          'trainingDay'
        ),

      start_time:
        metricsAllowed ?
          getValue(
            'startTime'
          ) :
          null,

      end_time:
        metricsAllowed ?
          getValue(
            'endTime'
          ) :
          null,

      avg_speed_kmh:
        metricsAllowed ?
          Number(
            getValue(
              'avgSpeedKmh'
            )
          ) :
          null,

      indoor_session:
        getValue(
          'indoorSession'
        ) ===
        'true',

      participant_instance_id:
        participantInstanceId,

      participant_id:
        null,

      event_id:
        eventId,

      event_instance_id:
        eventInstanceId,

      program_id:
        programId,

      team_id:
        trainingType ===
          'TEAM' ?
          participant
            .participant_registry
            ?.source_id :
          null,

      athlete_id:
        trainingType ===
          'INDIVIDUAL' ?
          participant
            .participant_registry
            ?.source_id :
          null,

      session_type:
        getValue(
          'sessionType'
        ),

      distance_km:
        metricsAllowed ?
          Number(
            getValue(
              'distanceKm'
            )
          ) :
          null,

      duration_minutes:
        metricsAllowed ?
          Number(
            getValue(
              'durationMinutes'
            )
          ) :
          null,

      attendance:
        derived.attendance,

      present:
        derived.present,

      participated:
        derived.participated,

      absent:
        derived.absent,

      attendance_status_id:
        selectedResult
          ?.type ===
          'ABSENCE' ?
          selectedResult.id :
          null,

      outcome_status_id:
        selectedResult
          ?.type ===
          'OUTCOME' ?
          selectedResult.id :
          null,

      notes:
        getValue(
          'notes'
        )
    }

    const trainingId =
      getValue(
        'trainingId'
      )

    await ensureUniqueActivityRecord({
      table: 'training_log',
      idColumn: 'training_id',
      currentId: trainingId || null,
      eventInstanceId,
      programId,
      participantInstanceId,
      dateColumn: 'training_date',
      dateValue: getValue('trainingDate'),
      sessionType: getValue('sessionType')
    })

    let error

    if (
      trainingId
    ) {
      const response =
        await db
          .from(
            'training_log'
          )
          .update(
            payload
          )
          .eq(
            'training_id',
            trainingId
          )

      error =
        response.error
    } else {
      const response =
        await db
          .from(
            'training_log'
          )
          .insert(
            payload
          )

      error =
        response.error
    }

    if (
      error
    ) {
      throw error
    }

    await db.rpc(
      'rebuild_training_rankings'
    )

    hideModal(
      'trainingModal'
    )

    await loadTrainingLogs()

    showSuccess(
      trainingId ?
        'Training Updated' :
        'Training Saved'
    )
  } catch (
    error
  ) {

    showError(
      error.message
    )
  }
}

window.editTraining =
async function (
  trainingId
) {
  const training =
    trainingLogs.find(
      item =>
        item.training_id ===
        trainingId
    )

  if (
    !training
  ) {
    return
  }

  clearError()

  setValue(
    'trainingId',
    training.training_id
  )

  setValue(
    'trainingDate',
    training.training_date
  )

  setValue(
    'trainingWeek',
    training.training_week ||
    ''
  )

  setValue(
    'trainingDay',
    training.training_day ||
    ''
  )

  const eventId =
    training.event_id ||
    training
      .participant_instances
      ?.event_instances
      ?.events
      ?.event_id

  const occurrenceId =
    training.event_instance_id ||
    training
      .participant_instances
      ?.event_instance_id ||
    ''

  const programId =
    training.program_id ||
    training
      .participant_instances
      ?.program_id ||
    ''

  setValue(
    'eventId',
    eventId
  )

  await loadOccurrences(
    eventId
  )

  const occurrence =
    occurrences.find(
      row =>
        row.event_instance_id ===
        occurrenceId
    )

  setValue(
    'eventInstanceId',
    occurrenceId
  )

  await loadPrograms(
    occurrenceId
  )

  setValue(
    'programId',
    programId
  )

  const participantType =
    training
      .participant_instances
      ?.participant_registry
      ?.participant_type_master
      ?.participant_type_code

  if (
    participantType ===
    'TEAM'
  ) {
    document.getElementById(
      'trainingTypeTeam'
    ).checked =
      true
  } else {
    document.getElementById(
      'trainingTypeIndividual'
    ).checked =
      true
  }

  await loadParticipants(
    occurrenceId,
    programId
  )

  if (
    occurrence
  ) {
    setValue(
      'countyId',
      occurrence.county_id
    )

    await loadSubcounties(
      occurrence.county_id
    )

    setValue(
      'subcountyId',
      occurrence.subcounty_id
    )

    await loadTowns(
      occurrence.subcounty_id
    )

    setValue(
      'townName',
      occurrence
        .town_master
        ?.town_name ||
      ''
    )
  }

  setValue(
    'participantId',
    training.participant_instance_id
  )

  const resultId =
    training
      .attendance_status_id ||
    training
      .outcome_status_id ||
    ''

  setValue(
    'trainingResultId',
    resultId
  )

  applyTrainingResultRules()

  setValue(
    'startTime',
    training.start_time
  )

  setValue(
    'endTime',
    training.end_time
  )

  setValue(
    'avgSpeedKmh',
    training.avg_speed_kmh
  )

  setValue(
    'indoorSession',
    training.indoor_session ?
      'true' :
      'false'
  )

  setValue(
    'sessionType',
    training.session_type
  )

  setValue(
    'distanceKm',
    training.distance_km
  )

  setValue(
    'durationMinutes',
    training.duration_minutes
  )

  setValue(
    'notes',
    training.notes
  )

  document.getElementById(
    'eventId'
  ).disabled =
    true

  document.getElementById(
    'eventInstanceId'
  ).disabled =
    true

  document.getElementById(
    'programId'
  ).disabled =
    true

  document.getElementById(
    'participantId'
  ).disabled =
    true

  document.getElementById(
    'countyId'
  ).disabled =
    true

  document.getElementById(
    'subcountyId'
  ).disabled =
    true

  document.getElementById(
    'townName'
  ).readOnly =
    true

  document.getElementById(
    'trainingTypeIndividual'
  ).disabled =
    true

  document.getElementById(
    'trainingTypeTeam'
  ).disabled =
    true

  const modal =
    createModal('trainingModal')

  modal.show()
}

window.confirmDeleteTraining =
function (
  trainingId
) {
  setValue(
    'deleteTrainingId',
    trainingId
  )

  const modal =
    createModal('deleteTrainingModal')

  modal.show()
}

async function deleteTraining() {
  try {
    const trainingId =
      getValue(
        'deleteTrainingId'
      )

    const {
      count
    } =
      await db
        .from(
          'performance'
        )
        .select(
          '*',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'training_id',
          trainingId
        )

    if (
      count >
      0
    ) {
      showError(
        'Delete the performance record first.'
      )

      return
    }

    const {
      error
    } =
      await db
        .from(
          'training_log'
        )
        .delete()
        .eq(
          'training_id',
          trainingId
        )

    if (
      error
    ) {
      throw error
    }

    await db.rpc(
      'rebuild_training_rankings'
    )

    hideModal(
      'deleteTrainingModal'
    )

    await loadTrainingLogs()
  } catch (
    error
  ) {

    showError(
      error.message
    )
  }
}

function wireEvents() {
  document
    .getElementById(
      'trainingResultId'
    )
    ?.addEventListener(
      'change',
      applyTrainingResultRules
    )

  document
    .getElementById(
      'eventInstanceId'
    )
    ?.addEventListener(
      'change',
      async () => {
        const occurrenceId =
          getValue(
            'eventInstanceId'
          )

        if (
          !occurrenceId
        ) {
          return
        }

        const occurrence =
          occurrences.find(
            row =>
              row.event_instance_id ===
              occurrenceId
          )

        if (
          !occurrence
        ) {
          return
        }

        setValue(
          'eventArea',
          occurrence.event_area ||
          ''
        )

        setValue(
          'trainingDate',
          occurrence.start_date
        )

        setValue(
          'startTime',
          occurrence.start_time
        )

        setValue(
          'endTime',
          occurrence.end_time
        )

        setValue(
          'countyId',
          occurrence.county_id
        )

        await loadSubcounties(
          occurrence.county_id
        )

        setValue(
          'subcountyId',
          occurrence.subcounty_id
        )

        await loadTowns(
          occurrence.subcounty_id
        )

        setValue(
          'townName',
          occurrence
            .town_master
            ?.town_name ||
          ''
        )

        setValue(
          'sessionType',
          occurrence
            ?.events
            ?.event_type_master
            ?.event_type_name ||
          ''
        )

        calculateDuration()

        const date =
          new Date(
            occurrence.start_date
          )

        setValue(
          'trainingDay',
          date.toLocaleDateString(
            'en-US',
            {
              weekday: 'long'
            }
          )
        )

        const week =
          Math.ceil(
            date.getDate() /
            7
          )

        const month =
          date.toLocaleDateString(
            'en-US',
            {
              month: 'long'
            }
          )

        setValue(
          'trainingWeek',
          `${month} Week ${week} ${date.getFullYear()}`
        )

        await loadPrograms(
          occurrenceId
        )

        const selectedProgramId =
          getValue(
            'programId'
          )

        if (
          selectedProgramId
        ) {
          await loadParticipants(
            occurrenceId,
            selectedProgramId
          )
        }
      }
    )

  document
    .getElementById(
      'trainingDate'
    )
    ?.addEventListener(
      'change',
      e => {
        const date =
          new Date(
            e.target.value
          )

        const dayName =
          date.toLocaleDateString(
            'en-US',
            {
              weekday: 'long'
            }
          )

        setValue(
          'trainingDay',
          dayName
        )

        const monthName =
          date.toLocaleDateString(
            'en-US',
            {
              month: 'long'
            }
          )

        const year =
          date.getFullYear()

        const weekNumber =
          Math.ceil(
            date.getDate() /
            7
          )

        setValue(
          'trainingWeek',
          `${monthName} Week ${weekNumber} ${year}`
        )
      }
    )

  document
    .getElementById(
      'countyId'
    )
    ?.addEventListener(
      'change',
      async e => {
        setValue(
          'subcountyId',
          ''
        )

        await loadSubcounties(
          e.target.value
        )
      }
    )

  document
    .getElementById(
      'subcountyId'
    )
    ?.addEventListener(
      'change',
      async e => {
        await loadTowns(
          e.target.value
        )
      }
    )

  document
    .getElementById(
      'btnAddTraining'
    )
    ?.addEventListener(
      'click',
      openNewTrainingModal
    )

  document
    .getElementById(
      'btnSaveTraining'
    )
    ?.addEventListener(
      'click',
      saveTraining
    )

  document
    .getElementById(
      'startTime'
    )
    ?.addEventListener(
      'change',
      calculateDuration
    )

  document
    .getElementById(
      'endTime'
    )
    ?.addEventListener(
      'change',
      calculateDuration
    )

  document
    .getElementById(
      'distanceKm'
    )
    ?.addEventListener(
      'input',
      calculateAverageSpeed
    )

  document
    .getElementById(
      'eventId'
    )
    ?.addEventListener(
      'change',
      async e => {
        setValue(
          'programId',
          ''
        )

        setValue(
          'participantId',
          ''
        )

        setValue(
          'eventInstanceId',
          ''
        )

        await loadOccurrences(
          e.target.value
        )
      }
    )

  document
    .getElementById(
      'programId'
    )
    ?.addEventListener(
      'change',
      async e => {
        const occurrenceId =
          getValue(
            'eventInstanceId'
          )

        if (
          !occurrenceId
        ) {
          return
        }

        setValue(
          'participantId',
          ''
        )

        await loadParticipants(
          occurrenceId,
          e.target.value
        )
      }
    )

  document
    .getElementById(
      'trainingTypeIndividual'
    )
    ?.addEventListener(
      'change',
      async () => {
        const occurrenceId =
          getValue(
            'eventInstanceId'
          )

        const programId =
          getValue(
            'programId'
          )

        if (
          occurrenceId &&
          programId
        ) {
          await loadParticipants(
            occurrenceId,
            programId
          )
        }
      }
    )

  document
    .getElementById(
      'trainingTypeTeam'
    )
    ?.addEventListener(
      'change',
      async () => {
        const occurrenceId =
          getValue(
            'eventInstanceId'
          )

        const programId =
          getValue(
            'programId'
          )

        if (
          occurrenceId &&
          programId
        ) {
          await loadParticipants(
            occurrenceId,
            programId
          )
        }
      }
    )

  document
    .getElementById(
      'btnRefreshTraining'
    )
    ?.addEventListener(
      'click',
      loadTrainingLogs
    )

  document
    .getElementById(
      'btnConfirmDeleteTraining'
    )
    ?.addEventListener(
      'click',
      deleteTraining
    )

  searchTraining
    ?.addEventListener(
      'input',
      searchTrainingLogs
    )

  document
    .getElementById(
      'btnPreviousPage'
    )
    ?.addEventListener(
      'click',
      () => {
        if (
          currentPage >
          1
        ) {
          currentPage--

          renderTrainingLogs()
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
              filteredTrainingLogs.length /
              PAGE_SIZE
            )
          )

        if (
          currentPage <
          totalPages
        ) {
          currentPage++

          renderTrainingLogs()
        }
      }
    )
}

async function initializeTrainingLogs() {
  try {
    await loadTrainingEvents()

    await loadSessionTypes()

    await loadCounties()

    await loadTrainingResults()

    await loadTrainingLogs()

    wireEvents()
  } catch (
    error
  ) {

    showError(
      error.message
    )
  }
}

document
  .getElementById(
    'startTime'
  )
  ?.addEventListener(
    'change',
    calculateDuration
  )

document
  .getElementById(
    'endTime'
  )
  ?.addEventListener(
    'change',
    calculateDuration
  )

document
  .getElementById(
    'distanceKm'
  )
  ?.addEventListener(
    'input',
    calculateAverageSpeed
  )

document.addEventListener(
  'DOMContentLoaded',
  initializeTrainingLogs
)
