/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

const db =
  window.supabaseClient

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

function showLoading() {

  competitionResultLoading
    ?.classList.remove(
      'd-none'
    )

}

function hideLoading() {

  competitionResultLoading
    ?.classList.add(
      'd-none'
    )

}

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

  attendanceStatuses.forEach(
    status => {

      select.innerHTML += `
        <option
          value="${status.attendance_status_id}"
        >
          ${status.status_name}
        </option>
      `
    }
  )
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

  outcomeStatuses.forEach(
    status => {

      select.innerHTML += `
        <option
          value="${status.outcome_status_id}"
        >
          ${status.status_name}
        </option>
      `
    }
  )
}




function showError(message) {

  if (
    !competitionResultFormError
  ) {
    return
  }

  competitionResultFormError.textContent =
    message

  competitionResultFormError.classList.remove(
    'd-none'
  )

  setTimeout(
    () => {

      competitionResultFormError.classList.add(
        'd-none'
      )

    },
    5000
  )

}
function showSuccess(message) {

  const successBox =
    document.getElementById(
      'trainingFormSuccess'
    )

  if (
    successBox
  ) {

    successBox.textContent =
      message

    successBox.classList.remove(
      'd-none'
    )

    setTimeout(
      () => {

        successBox.classList.add(
          'd-none'
        )

      },
      3000
    )
  }

}


function clearError() {

  if (
    competitionResultFormError
  ) {

    competitionResultFormError.textContent = ''

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

  if (!element) {
    return
  }

  element.value =
    value === null ||
    value === undefined
      ? ''
      : String(value)

}
function calculateDuration() {

  const start =
    getValue(
      'startTime'
    )

  const end =
    getValue(
      'endTime'
    )

  if (
    !start ||
    !end
  ) {
    return
  }

  const startDate =
    new Date(
      `1970-01-01T${start}`
    )

  const endDate =
    new Date(
      `1970-01-01T${end}`
    )

  const minutes =
    Math.round(
      (
        endDate -
        startDate
      ) / 60000
    )

  if (
    minutes >= 0
  ) {

    setValue(
      'durationMinutes',
      minutes
    )

    calculateAverageSpeed()
  }
}

function calculateAverageSpeed() {

  const distance =
    Number(
      getValue(
        'distanceKm'
      )
    )

  const duration =
    Number(
      getValue(
        'durationMinutes'
      )
    )

  if (
    !distance ||
    !duration
  ) {

    setValue(
      'avgSpeedKmh',
      ''
    )

    return
  }

  const speed =
    distance /
    (duration / 60)

  setValue(
    'avgSpeedKmh',
    speed.toFixed(2)
  )
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
  eventId
) {

  const {
    data,
    error
  } =
    await db
      .from(
        'event_programs'
      )
      .select(`
        program_id,
        program_name
      `)
      .eq(
        'event_id',
        eventId
      )

  if (error) {
    throw error
  }

  programs =
    data || []

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
        program_id,

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

  occurrences.forEach(
    occurrence => {

      select.innerHTML += `
        <option
          value="${occurrence.event_instance_id}"
        >
          ${occurrence.event_area}
        </option>
      `

    }
  )

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
    'TEAM'
    &&
    participantType !==
    'TEAM'
  ) {
    continue
  }

  if (
    selectedType ===
    'INDIVIDUAL'
    &&
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
  'ABSENT_WITH_APOLOGY'

  &&

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



async function loadCounties() {

  const {
    data,
    error
  } =
    await db
      .from(
        'county_master'
      )
      .select(`
        county_id,
        county_name
      `)
      .order(
        'county_name'
      )

  if (error) {
    throw error
  }

  counties =
    data || []

  const select =
    document.getElementById(
      'countyId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select County
    </option>
    `

  counties.forEach(
    county => {

      select.innerHTML += `
        <option
          value="${county.county_id}"
        >
          ${county.county_name}
        </option>
      `

    }
  )

}

async function loadSubcounties(
  countyId
) {

  const {
    data,
    error
  } =
    await db
      .from(
        'subcounty_master'
      )
      .select(`
        subcounty_id,
        subcounty_name
      `)
      .eq(
        'county_id',
        countyId
      )
      .order(
        'subcounty_name'
      )

  if (error) {
    throw error
  }

  subcounties =
    data || []

  const select =
    document.getElementById(
      'subcountyId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
    <option value="">
      Select Subcounty
    </option>
    `

  subcounties.forEach(
    subcounty => {

      select.innerHTML += `
        <option
          value="${subcounty.subcounty_id}"
        >
          ${subcounty.subcounty_name}
        </option>
      `

    }
  )

}


async function loadTowns(
  subcountyId
) {

  const {
    data,
    error
  } =
    await db
      .from(
  'town_master'
)
.select(`
  town_id,
  town_name,
  subcounty_id
`)
.eq(
  'subcounty_id',
  subcountyId
)
.order(
  'town_name'
)

  if (error) {
    throw error
  }

  towns =
    data || []

  const datalist =
    document.getElementById(
      'townList'
    )

  if (!datalist) {
    return
  }

  datalist.innerHTML = ''

  towns.forEach(
    town => {

      datalist.innerHTML += `
        <option value="${town.town_name}">
      `

    }
  )

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

            event_programs(
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

    console.error(
      error
    )

    showError(
      'Failed to load competition results'
    )

  } finally {

    hideLoading()

  }

}

function rendercompetitionResults() {

  if (
    !trainingTableBody
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

  trainingTableBody.innerHTML =
    ''

  if (
    pageRows.length === 0
  ) {

    trainingTableBody.innerHTML =
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
      ?.event_programs
      ?.program_name || ''

  const attendanceStatus =
  competitionResult
    .attendance_status_master
    ?.status_code || ''

const attendanceIndicator =

  attendanceStatus ===
  'ABSENT_WITH_APOLOGY'

  ||

  attendanceStatus ===
  'ABSENT_WITHOUT_APOLOGY'

    ? '✗'
    : '✓'

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
    attendanceIndicator === '✓'

      ?

      '<span class="text-success fw-bold">✓</span>'

      :

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


function updatePagination() {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredcompetitionResults.length /
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
        .includes(search)

      ||

      (
        competitionResult
          .participant_instances
          ?.event_instances
          ?.events
          ?.event_name || ''
      )
        .toLowerCase()
        .includes(search)

      ||

      (
        competitionResult
          .participant_instances
          ?.event_programs
          ?.program_name || ''
      )
        .toLowerCase()
        .includes(search)

      ||

      (
        competitionResult.session_type || ''
      )
        .toLowerCase()
        .includes(search)

      ||

      (
        competitionResult.notes || ''
      )
        .toLowerCase()
        .includes(search)

    )

  }
)
      :

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
    new coreui.Modal(
      document.getElementById(
        'competitionResultModal'
      )
    )

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
  'ABSENT_WITH_APOLOGY'

  &&

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

const participantType =
  participant
    ?.participant_registry
    ?.participant_type_master
    ?.participant_type_code

const athleteId =

  participantType ===
  'ATHLETE'

    ?

    participant
      ?.participant_registry
      ?.source_id

    :

    null

const teamId =

  participantType ===
  'TEAM'

    ?

    participant
      ?.participant_registry
      ?.source_id

    :

    null

    if (
      !participant
    ) {

      throw new Error(
        'Please select a valid participant'
      )

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

const metricsAllowed =

  attendanceCode !==
  'ABSENT_WITH_APOLOGY'

  &&

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

 

    const payload = {

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
        getValue(
          'startTime'
        ),

      end_time:
        getValue(
          'endTime'
        ),

      avg_speed_kmh:

        metricsAllowed

          ?

          Number(
            getValue(
              'avgSpeedKmh'
            )
          )

          :

          null,

      indoor_session:
        getValue(
          'indoorSession'
        ) === 'true',

      participant_id:
  participant
    ?.participant_registry
    ?.participant_ref_id || null,

      participant_instance_id:
  participant
    ?.participant_instance_id || null,

event_id:
  getValue(
    'eventId'
  ),

event_instance_id:
  getValue(
    'eventInstanceId'
  ),

program_id:
  getValue(
    'programId'
  ),

team_id:
  teamId,

athlete_id:
  athleteId,

     participant_source_id:

  participant
    ?.participant_registry
    ?.source_id || null,

      session_type:
        getValue(
          'sessionType'
        ),

     distance_km:

  metricsAllowed

    ?

    Number(
      getValue(
        'distanceKm'
      )
    )

    :

    null,

duration_minutes:

  metricsAllowed

    ?

    Number(
      getValue(
        'durationMinutes'
      )
    )

    :

    null,

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



max_speed_kmh:
  Number(
    getValue(
      'maxSpeedKmh'
    )
  ) || null,

      attendance: true,

attendance_status_id:
  getValue(
    'attendanceStatusId'
  ) || null,

outcome_status_id:

  metricsAllowed

    ?

    getValue(
      'outcomeStatusId'
    ) || null

    :

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


console.log(
  'RACE RESULTS PAYLOAD'
)

console.table(
  payload
)

console.log(
  'PARTICIPANT'
)

console.log(
  participant
)
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

    coreui.Modal
      .getInstance(
        document.getElementById(
          'competitionResultModal'
        )
      )
      ?.hide()

    await loadcompetitionResults()

    showSuccess(
      resultId
  ? 'Competition Result Updated'
  : 'Competition Result Saved'
    )

  } catch (
    error
  ) {

    console.error(
      error
    )

    console.error(
  'RACE RESULT SAVE',
  error
)

console.log(
  'MESSAGE',
  error.message
)

console.log(
  'DETAILS',
  error.details
)

console.log(
  'HINT',
  error.hint
)

console.log(
  'CODE',
  error.code
)

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
      item =>
        item.result_id ===
        resultId
    )

  if (
    !competitionResult
  ) {
    return
  }

  clearError()

  setValue(
    'resultId',
    competitionResult.result_id
  )

  setValue(
    'competitionDate',
    competitionResult.competition_date
  )

  setValue(
    'eventId',
    competitionResult.event_id
  )

  await loadOccurrences(
    competitionResult.event_id
  )

  setValue(
    'eventInstanceId',
    competitionResult
      .participant_instances
      ?.event_instance_id || ''
  )

  await loadPrograms(
    competitionResult.event_id
  )

  setValue(
    'programId',
    competitionResult
      .participant_instances
      ?.program_id || ''
  )

  await loadParticipants(
    competitionResult
      .participant_instances
      ?.event_instance_id,
    competitionResult
      .participant_instances
      ?.program_id
  )

  const participantType =
    competitionResult
      .participant_instances
      ?.participant_registry
      ?.participant_type_master
      ?.participant_type_code

  if (
    participantType === 'TEAM'
  ) {

    document.getElementById(
      'competitionTypeTeam'
    ).checked = true

  } else {

    document.getElementById(
      'competitionTypeIndividual'
    ).checked = true

  }

  setValue(
  'participantId',
  competitionResult
    .participant_instance_id
)

  

  setValue(
  'attendanceStatusId',
  competitionResult
    .attendance_status_id || ''
)

setValue(
  'outcomeStatusId',
  competitionResult
    .outcome_status_id || ''
)

applyAttendanceStatusRules()

  setValue(
    'startTime',
    competitionResult.start_time
  )

  setValue(
    'endTime',
    competitionResult.end_time
  )

  setValue(
    'avgSpeedKmh',
    competitionResult.avg_speed_kmh
  )

  setValue(
    'indoorSession',
    competitionResult.indoor_session
      ? 'true'
      : 'false'
  )

  setValue(
    'sessionType',
    competitionResult.session_type
  )

  setValue(
    'distanceKm',
    competitionResult.distance_km
  )

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
    'maxSpeedKmh',
    competitionResult.max_speed_kmh
  )

  setValue(
    'competitionWeek',
    competitionResult.competition_week
  )

  setValue(
    'competitionDay',
    competitionResult.competition_day
  )

  setValue(
    'durationMinutes',
    competitionResult.duration_minutes
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

  const modal =
    new coreui.Modal(
      document.getElementById(
        'competitionResultModal'
      )
    )

  modal.show()

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
    new coreui.Modal(
      document.getElementById(
        'deleteCompetitionResultModal'
      )
    )

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

    coreui.Modal
      .getInstance(
        document.getElementById(
          'deleteCompetitionResultModal'
        )
      )
      ?.hide()

    await loadcompetitionResults()

  } catch (
    error
  ) {

    console.error(
      error
    )

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

        // Program

        if (
          occurrence.program_id
        ) {

          setValue(
            'programId',
            occurrence.program_id
          )

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

        await Promise.all([
          loadPrograms(
            e.target.value
          ),
          loadOccurrences(
            e.target.value
          )
        ])

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

    console.error(
      error
    )

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
