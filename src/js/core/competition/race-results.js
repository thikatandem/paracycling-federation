import {
  getProgramsForOccurrence
} from '../programs/programService.js'

/* eslint camelcase: 0 */
import {
  createLocationFormLoaders } from '../services/locationLookupService.js'
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
  showModal,
  hideModal
} from '../services/modalService.js'
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
  'competitionResultLoading'
)

const formFeedback =
  createDualFeedbackController({
    errorContainerId:
      'competitionResultFormError',
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
      filteredcompetitionResults.length,
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

let competitionResults = []

let filteredcompetitionResults = []

let events = []

let programs = []

let occurrences = []

let participants = []

let attendanceStatuses = []

let outcomeStatuses = []

let towns = []

let counties = []

let subcounties = []

let currentPage = 1

const competitionResultLoading =
  document.getElementById(
    'trainingLoading'
  )

const competitionResultFormError =
  document.getElementById(
    'competitionResultFormError'
  )

const competitionResultTableBody =
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



async function loadAttendanceStatuses() {
  const {
    data,
    error
  } =
    await db
      .from(
        'attendance_status_master'
      )
      .select(`
        attendance_status_id,
        status_name,
        status_code
      `)
      .order(
        'status_name'
      )

  if (error) {
    throw error
  }

  attendanceStatuses =
    data || []

  const select =
    document.getElementById(
      'attendanceStatusId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        Select Attendance
      </option>
    `

  for (const status of attendanceStatuses) {
    select.innerHTML += `
        <option
          value="${status.attendance_status_id}"
        >
          ${status.status_name}
        </option>
      `
  }
}

async function loadOutcomeStatuses() {
  const {
    data,
    error
  } =
    await db
      .from(
        'outcome_status_master'
      )
      .select(`
        outcome_status_id,
        status_name,
        status_code
      `)
      .order(
        'status_name'
      )

  if (error) {
    throw error
  }

  outcomeStatuses =
    data || []

  const select =
    document.getElementById(
      'outcomeStatusId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        Select Outcome
      </option>
    `

  for (const status of outcomeStatuses) {
    select.innerHTML += `
        <option
          value="${status.outcome_status_id}"
        >
          ${status.status_name}
        </option>
      `
  }
}








async function loadCompetitionEvents() {
  const {
    data: category,
    error: categoryError
  } =
  await db
    .from(
      'event_category_master'
    )
    .select(
      'event_category_id'
    )
    .eq(
      'category_code',
      'COMPETITION'
    )
    .single()

  if (
    categoryError
  ) {
    throw categoryError
  }

  const {
    data,
    error
  } =
  await db
    .from(
      'events'
    )
    .select(`
      event_id,
      event_name
    `)
    .eq(
      'event_category_id',
      category.event_category_id
    )
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

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select Event
    </option>
    `

  for (
    const event
    of events
  ) {
    select.innerHTML += `
      <option
        value="${event.event_id}"
      >
        ${event.event_name}
      </option>
    `
  }
}

async function loadPrograms(
  occurrenceId
) {
  if (!occurrenceId) {
    programs = []

    const select =
      document.getElementById(
        'programId'
      )

    if (select) {
      select.innerHTML =
        `
          <option value="">
            Select Program
          </option>
        `
    }

    return
  }

  programs =
    await getProgramsForOccurrence(
      occurrenceId
    )

  const select =
    document.getElementById(
      'programId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
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

  select.innerHTML =
    `
      <option value="">
        Select Occurrence
      </option>
    `

  for (const occurrence of occurrences) {
    select.innerHTML += `
        <option
          value="${occurrence.event_instance_id}"
        >
          ${occurrence.event_area}
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

  if (error) {
    throw error
  }

  participants =
    data || []

  const select =
    document.getElementById(
      'participantId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select Participant
    </option>
    `

  for (
    const participant
    of participants
  ) {
    const selectedType =
    document.querySelector(
      'input[name="competitionType"]:checked'
    )?.value

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
          ?.display_name || ''
}
    </option>
  `
  }

  applyAttendanceStatusRules()
}

function applyAttendanceStatusRules() {
  const statusId =
  getValue(
    'attendanceStatusId'
  )

  const status =
attendanceStatuses.find(
  row =>
    row.attendance_status_id ===
    statusId
)

  const attendanceCode =
    status
      ?.status_code
      ?.toUpperCase() || ''

  const metricsAllowed =

  attendanceCode !==
  'ABSENT_WITH_APOLOGY' &&

  attendanceCode !==
  'ABSENT_WITHOUT_APOLOGY'

  const distanceField =
    document.getElementById(
      'distanceKm'
    )

  if (
    distanceField
  ) {
    distanceField.disabled =
      !metricsAllowed

    document.getElementById(
      'durationMinutes'
    ).disabled =
  !metricsAllowed

    document.getElementById(
      'startTime'
    ).disabled =
  !metricsAllowed

    document.getElementById(
      'endTime'
    ).disabled =
  !metricsAllowed

    document.getElementById(
      'outcomeStatusId'
    ).disabled =
  !metricsAllowed

    if (
      !metricsAllowed
    ) {
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
        'startTime',
        ''
      )

      setValue(
        'endTime',
        ''
      )

      setValue(
        'outcomeStatusId',
        ''
      )
    }
  }
}




async function loadcompetitionResults() {
  try {
    showLoading()

    const {
      data,
      error
    } =
      await db
        .from(
          'race_results'
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
                event_name
              )
            )
          )
        `)
        .order(
          'competition_date',
          {
            ascending: false
          }
        )

    if (error) {
      throw error
    }

    competitionResults =
      data || []

    filteredcompetitionResults =
      [...competitionResults]

    rendercompetitionResults()
  } catch (error) {

    showError(
      'Failed to load competition results'
    )
  } finally {
    hideLoading()
  }
}

function rendercompetitionResults() {
  if (
    !competitionResultTableBody
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
    filteredcompetitionResults.slice(
      start,
      end
    )

  competitionResultTableBody.innerHTML =
    ''

  if (
    pageRows.length === 0
  ) {
    competitionResultTableBody.innerHTML =
      `
      <tr>
        <td
          colspan="15"
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
    const competitionResult
    of pageRows
  ) {
    const type =
    competitionResult
      .participant_instances
      ?.participant_registry
      ?.participant_type_master
      ?.participant_type_code || ''

    const participantName =
    competitionResult
      .participant_instances
      ?.participant_registry
      ?.display_name || ''

    const eventName =
    competitionResult
      .participant_instances
      ?.event_instances
      ?.events
      ?.event_name || ''

    const occurrence =
    competitionResult
      .participant_instances
      ?.event_instances
      ?.event_area || ''

    const program =
    competitionResult
      .participant_instances
      ?.program_master
      ?.program_name || ''

    const attendanceStatus =
  competitionResult
    .attendance_status_master
    ?.status_code || ''

    const attendanceIndicator =

  attendanceStatus ===
  'ABSENT_WITH_APOLOGY' ||

  attendanceStatus ===
  'ABSENT_WITHOUT_APOLOGY' ?

    '✗' :
    '✓'

    const outcomeStatus =
  competitionResult
    .outcome_status_master
    ?.status_code || ''

    const session =
    competitionResult.session_type || ''

    const position =
    competitionResult.position ?? ''

    const points =
    competitionResult.points ?? ''

    const medal =
    competitionResult.medal ?? ''

    competitionResultTableBody.innerHTML += `
    <tr>

      <td>${competitionResult.competition_date || ''}</td>
      <td>${type}</td>
      <td>${participantName}</td>
      <td>${eventName}</td>
      <td>${occurrence}</td>
      <td>${program}</td>
      <td class="text-center">

  ${
  attendanceIndicator === '✓' ?

    '<span class="text-success fw-bold">✓</span>' :

    '<span class="text-danger fw-bold">✗</span>'
}

</td>

<td>
  ${outcomeStatus}
</td>
      <td>${position}</td>
      <td>${points}</td>
      <td>${medal}</td>
      <td>${session}</td>
      <td>${competitionResult.distance_km ?? ''}</td>
      <td>${competitionResult.duration_minutes ?? ''}</td>
      <td>${competitionResult.avg_speed_kmh ?? ''}</td>

      <td>

        <button
          class="btn btn-sm btn-warning me-1"
          onclick="editCompetitionResult('${competitionResult.result_id}')"
        >
          Edit
        </button>

        <button
          class="btn btn-sm btn-danger"
          onclick="confirmdeleteCompetitionResult('${competitionResult.result_id}')"
        >
          Delete
        </button>

      </td>

    </tr>
  `
  }

  updatePagination()
}


function searchcompetitionResults() {
  const search =
    (
      searchTraining?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredcompetitionResults =

    search ?

      competitionResults.filter(
        competitionResult => {
          return (

            (
              competitionResult
          .participant_instances
          ?.participant_registry
          ?.display_name || ''
            )
        .toLowerCase()
        .includes(search) ||

      (
        competitionResult
          .participant_instances
          ?.event_instances
          ?.events
          ?.event_name || ''
      )
        .toLowerCase()
        .includes(search) ||

      (
        competitionResult
    .participant_instances
    ?.program_master
    ?.program_name || ''
      )
        .toLowerCase()
        .includes(search) ||

      (
        competitionResult.session_type || ''
      )
        .toLowerCase()
        .includes(search) ||

      (
        competitionResult.notes || ''
      )
        .toLowerCase()
        .includes(search)

          )
        }
      ) :

      [...competitionResults]

  currentPage = 1

  rendercompetitionResults()
}

function clearTrainingForm() {
  clearError()

  setValue(
    'resultId',
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
    'position',
    ''
  )

  setValue(
    'points',
    ''
  )

  setValue(
    'medal',
    ''
  )

  setValue(
    'maxSpeedKmh',
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
    'attendance',
    'true'
  )
  setValue(
    'competitionWeek',
    ''
  )

  setValue(
    'competitionDay',
    ''
  )
  setValue(
    'competitionDate',
    new Date()
      .toISOString()
      .split('T')[0]
  )
}

function openNewTrainingModal() {
  clearTrainingForm()

  const modal =
    createModal('competitionResultModal')

  modal.show()
}

function validateTraining() {
  clearError()

  if (
    !getValue(
      'competitionDate'
    )
  ) {
    showError(
      'Competition Date is required'
    )

    return false
  }

  if (
    !getValue(
      'eventId'
    )
  ) {
    showError(
      'Competition Event is required'
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
      'sessionType'
    )
  ) {
    showError(
      'Session Type is required'
    )

    return false
  }

  if (
    getValue(
      'attendance'
    ) === ''
  ) {
    showError(
      'Attendance is required'
    )

    return false
  }

  const attendanceStatus =
  attendanceStatuses.find(
    row =>
      row.attendance_status_id ===
      getValue(
        'attendanceStatusId'
      )
  )

  const attendanceCode =
  attendanceStatus
    ?.status_code
    ?.toUpperCase() || ''

  if (
    attendanceCode !==
  'ABSENT_WITH_APOLOGY' &&

  attendanceCode !==
  'ABSENT_WITHOUT_APOLOGY'
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

async function saveCompetitionResult() {
  try {

    if (
      !validateTraining()
    ) {
      return
    }

    const participantId =
      getValue(
        'participantId'
      )

    const participant =
      participants.find(
        p =>
          p.participant_instance_id ===
          participantId
      )

    if (
      !participant
    ) {
      throw new Error(
        'Please select a valid participant'
      )
    }

    const participantType =
      participant
        ?.participant_registry
        ?.participant_type_master
        ?.participant_type_code

    const athleteId =

      participantType ===
      'ATHLETE' ?

        participant
          ?.participant_registry
          ?.source_id :

        null

    const teamId =

      participantType ===
      'TEAM' ?

        participant
          ?.participant_registry
          ?.source_id :

        null

    const attendanceStatus =
      attendanceStatuses.find(
        row =>
          row.attendance_status_id ===
          getValue(
            'attendanceStatusId'
          )
      )

    const attendanceCode =
      attendanceStatus
        ?.status_code
        ?.toUpperCase() || ''

    const metricsAllowed =

      attendanceCode !==
      'ABSENT_WITH_APOLOGY' &&

      attendanceCode !==
      'ABSENT_WITHOUT_APOLOGY'

    const occurrence =
      occurrences.find(
        row =>
          row.event_instance_id ===
          getValue(
            'eventInstanceId'
          )
      )

    if (
      !occurrence
    ) {
      throw new Error(
        'Occurrence not found'
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

    const payload = {

      event_id:
        eventId,

      event_instance_id:
        eventInstanceId,

      program_id:
        programId,

      participant_instance_id:
        participant.participant_instance_id,

      participant_source_id:
        participant
          ?.participant_registry
          ?.source_id || null,

      athlete_id:
        athleteId,

      team_id:
        teamId,

      town_id:
        occurrence.town_id || null,

      competition_date:
        getValue(
          'competitionDate'
        ),

      competition_week:
        getValue(
          'competitionWeek'
        ),

      competition_day:
        getValue(
          'competitionDay'
        ),

      start_time:
        metricsAllowed ?
          getValue(
            'startTime'
          ) || null :
          null,

      end_time:
        metricsAllowed ?
          getValue(
            'endTime'
          ) || null :
          null,

      session_type:
        getValue(
          'sessionType'
        ),

      indoor_session:
        getValue(
          'indoorSession'
        ) === 'true',

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

      avg_speed_kmh:

        metricsAllowed ?

          Number(
            getValue(
              'avgSpeedKmh'
            )
          ) :

          null,

      max_speed_kmh:
        Number(
          getValue(
            'maxSpeedKmh'
          )
        ) || null,

      position:
        Number(
          getValue(
            'position'
          )
        ) || null,

      points:
        Number(
          getValue(
            'points'
          )
        ) || 0,

      attendance:
        metricsAllowed,

      attendance_status_id:
        getValue(
          'attendanceStatusId'
        ) || null,

      outcome_status_id:

        metricsAllowed ?

          getValue(
            'outcomeStatusId'
          ) || null :

          null,

      notes:
        getValue(
          'notes'
        )

    }

    const resultId =
      getValue(
        'resultId'
      )

    await ensureUniqueActivityRecord({
      table: 'race_results',
      idColumn: 'result_id',
      currentId: resultId || null,
      eventInstanceId,
      programId,
      participantInstanceId: participant.participant_instance_id,
      dateColumn: 'competition_date',
      dateValue: getValue('competitionDate'),
      sessionType: getValue('sessionType')
    })

    let error

    if (
      resultId
    ) {

      const response =
        await db
          .from(
            'race_results'
          )
          .update(
            payload
          )
          .eq(
            'result_id',
            resultId
          )

      error =
        response.error

    } else {

      const response =
        await db
          .from(
            'race_results'
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
      'rebuild_competition_rankings'
    )

    hideModal(
      'competitionResultModal'
    )

    await loadcompetitionResults()

    showSuccess(

      resultId ?

        'Competition Result Updated' :

        'Competition Result Saved'

    )

  } catch (
    error
  ) {


    showError(
      error.message ||
      'Save failed'
    )

  }
}
window.editCompetitionResult =
async function (
  resultId
) {

  const competitionResult =
    competitionResults.find(
      row =>
        row.result_id ===
        resultId
    )

  if (
    !competitionResult
  ) {
    return
  }

  clearError()

  const bundle =
    competitionResult
      .participant_instances

  if (
    !bundle
  ) {
    showError(
      'Participant bundle not found.'
    )

    return
  }

  const occurrenceId =
    bundle.event_instance_id

  const eventId =
    bundle
      ?.event_instances
      ?.events
      ?.event_id

  setValue(
    'resultId',
    competitionResult.result_id
  )

  /*
   * Rebuild hierarchy
   */

  setValue(
    'eventId',
    eventId || ''
  )

  await loadOccurrences(
    eventId
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
    bundle.program_id
  )

  await loadParticipants(
    occurrenceId,
    bundle.program_id
  )

  /*
   * Participant Type
   */

  const participantType =
    bundle
      ?.participant_registry
      ?.participant_type_master
      ?.participant_type_code

  document.getElementById(
    participantType === 'TEAM'
      ? 'competitionTypeTeam'
      : 'competitionTypeIndividual'
  ).checked = true

  /*
   * Bundle
   */

  setValue(
    'participantId',
    bundle.participant_instance_id
  )

  /*
   * Occurrence Context
   */

  setValue(
    'competitionDate',
    competitionResult.competition_date
  )

  setValue(
    'startTime',
    competitionResult.start_time
  )

  setValue(
    'endTime',
    competitionResult.end_time
  )

  setValue(
    'competitionWeek',
    competitionResult.competition_week
  )

  setValue(
    'competitionDay',
    competitionResult.competition_day
  )

  /*
   * Status
   */

  setValue(
    'attendanceStatusId',
    competitionResult.attendance_status_id || ''
  )

  setValue(
    'outcomeStatusId',
    competitionResult.outcome_status_id || ''
  )

  applyAttendanceStatusRules()

  /*
   * Metrics
   */

  setValue(
    'distanceKm',
    competitionResult.distance_km
  )

  setValue(
    'durationMinutes',
    competitionResult.duration_minutes
  )

  setValue(
    'avgSpeedKmh',
    competitionResult.avg_speed_kmh
  )

  setValue(
    'maxSpeedKmh',
    competitionResult.max_speed_kmh
  )

  /*
   * Result
   */

  setValue(
    'position',
    competitionResult.position
  )

  setValue(
    'points',
    competitionResult.points
  )

  setValue(
    'medal',
    competitionResult.medal
  )

  setValue(
    'sessionType',
    competitionResult.session_type
  )

  setValue(
    'indoorSession',
    competitionResult.indoor_session
      ? 'true'
      : 'false'
  )

  setValue(
    'attendance',
    competitionResult.attendance
      ? 'true'
      : 'false'
  )

  setValue(
    'notes',
    competitionResult.notes
  )

  showModal('competitionResultModal')

}


window.confirmdeleteCompetitionResult =
function (
  resultId
) {
  setValue(
    'deleteresultId',
    resultId
  )

  const modal =
    createModal('deleteCompetitionResultModal')

  modal.show()
}

function getMedal(
  position
) {
  const pos =
    Number(position)

  if (pos === 1) {
    return 'Gold'
  }

  if (pos === 2) {
    return 'Silver'
  }

  if (pos === 3) {
    return 'Bronze'
  }

  return ''
}

document
  .getElementById(
    'position'
  )
  ?.addEventListener(
    'input',
    e => {
      setValue(
        'medal',
        getMedal(
          e.target.value
        )
      )
    }
  )

async function deleteCompetitionResult() {
  try {
    const resultId =
      getValue(
        'deleteresultId'
      )

    const {
      error
    } =

      await db
        .from(
          'race_results'
        )
        .delete()
        .eq(
          'result_id',
          resultId
        )

    if (
      error
    ) {
      throw error
    }

    await db.rpc(
      'rebuild_competition_rankings'
    )

    hideModal(
      'deleteCompetitionResultModal'
    )

    await loadcompetitionResults()
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
    'attendanceStatusId'
  )
  ?.addEventListener(
    'change',
    applyAttendanceStatusRules
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

        

        // Date & Time

        setValue(
          'competitionDate',
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

        // Location

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
            ?.town_name || ''
        )
        setValue(
          'sessionType',
          occurrence
    ?.events
    ?.event_type_master
    ?.event_type_name || ''
        )
        // Duration

        calculateDuration()

        // Week & Day

        const date =
          new Date(
            occurrence.start_date
          )

        setValue(
          'competitionDay',
          date.toLocaleDateString(
            'en-US',
            {
              weekday: 'long'
            }
          )
        )

        const week =
          Math.ceil(
            date.getDate() / 7
          )

        const month =
          date.toLocaleDateString(
            'en-US',
            {
              month: 'long'
            }
          )

        setValue(
          'competitionWeek',
          `${month} Week ${week} ${date.getFullYear()}`
        )
await loadPrograms(
  occurrenceId
)
        // Participants
      }
    )

  document
    .getElementById(
      'competitionDate'
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
          'competitionDay',
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
            date.getDate() / 7
          )

        setValue(
          'competitionWeek',
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
      'btnsaveCompetitionResult'
    )
    ?.addEventListener(
      'click',
      saveCompetitionResult
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
      'competitionTypeIndividual'
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
      'competitionTypeTeam'
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
      loadcompetitionResults
    )

  document
    .getElementById(
      'btnConfirmdeleteCompetitionResult'
    )
    ?.addEventListener(
      'click',
      deleteCompetitionResult
    )

  searchTraining
    ?.addEventListener(
      'input',
      searchcompetitionResults
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

          rendercompetitionResults()
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
              filteredcompetitionResults.length /
              PAGE_SIZE
            )
          )

        if (
          currentPage <
          totalPages
        ) {
          currentPage++

          rendercompetitionResults()
        }
      }
    )
}

async function initializecompetitionResults() {
  try {
    await loadCompetitionEvents()

    await loadCounties()

    await loadAttendanceStatuses()

    await loadOutcomeStatuses()

    await loadcompetitionResults()

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
  .getElementById('startTime')
  ?.addEventListener(
    'change',
    calculateDuration
  )

document
  .getElementById('endTime')
  ?.addEventListener(
    'change',
    calculateDuration
  )

document
  .getElementById('distanceKm')
  ?.addEventListener(
    'input',
    calculateAverageSpeed
  )

document.addEventListener(
  'DOMContentLoaded',
  initializecompetitionResults
)
