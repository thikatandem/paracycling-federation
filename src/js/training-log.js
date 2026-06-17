/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

const db =
  window.supabaseClient

let trainingLogs = []

let filteredTrainingLogs = []

let events = []

let programs = []

let participants = []
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
function showLoading() {

  trainingLoading?.classList.remove(
    'd-none'
  )

}

function hideLoading() {

  trainingLoading?.classList.add(
    'd-none'
  )

}

function showError(message) {

  if (
    trainingFormError
  ) {

    trainingFormError.textContent =
      message

  }

}

function clearError() {

  if (
    trainingFormError
  ) {

    trainingFormError.textContent = ''

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
async function loadTrainingEvents() {

  const {
    data,
    error
  } =
    await db
      .from('events')
      .select(`
        event_id,
        event_name
      `)
      .eq(
        'event_category',
        'TRAINING'
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
async function loadParticipants(
  programId
) {

  const {
    data,
    error
  } =
    await db
      .from(
        'event_participants'
      )
      .select(`
  participant_id,
  team_id,
  athlete_id,

  teams(
    team_name
  ),

  athletes(
    first_name,
    last_name
  )
`)
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

  const trainingType =
  document.querySelector(
    'input[name="trainingType"]:checked'
  )?.value

for (
  const participant
  of participants
) {

  const participantName =

    trainingType ===
    'TEAM'

      ?

      (
        participant.teams
          ?.team_name || ''
      )

      :

      (
        `${participant.athletes?.first_name || ''} ${participant.athletes?.last_name || ''}`
      )

  select.innerHTML += `
    <option
      value="${participant.participant_id}"
    >
      ${participantName}
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

  if (error) {
    throw error
  }

  const datalist =
    document.getElementById(
      'sessionTypes'
    )

  if (!datalist) {
    return
  }

  const sessionTypes =
    [
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

  ;(
    data || []
  ).forEach(
    row => {

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
  )

  datalist.innerHTML =
    ''

  sessionTypes.forEach(
    session => {

      datalist.innerHTML += `
        <option value="${session}">
      `

    }
  )

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

  teams(
    team_name
  ),

  athletes(
    first_name,
    last_name
  ),

  event_participants(
    participant_id,

    event_programs(
      program_name,

      events(
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

    if (error) {
      throw error
    }

    trainingLogs =
      data || []

    filteredTrainingLogs =
      [...trainingLogs]

    renderTrainingLogs()

  } catch (error) {

    console.error(error)

    alert(
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
      currentPage - 1
    ) * PAGE_SIZE

  const end =
    start + PAGE_SIZE

  const pageRows =
    filteredTrainingLogs.slice(
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
          colspan="9"
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
      training.team_id
        ? 'TEAM'
        : 'INDIVIDUAL'

    const participantName =
      training.team_id

        ?

        (
          training.teams
            ?.team_name || ''
        )

        :

        (
          `${training.athletes?.first_name || ''} ${training.athletes?.last_name || ''}`
        )

    trainingTableBody.innerHTML += `
      <tr>

        <td>
          ${
            training.training_date || ''
          }
        </td>

        <td>
          ${type}
        </td>

        <td>
          ${participantName}
        </td>

        <td>
          ${
            training
              .event_participants
              ?.event_programs
              ?.events
              ?.event_name || ''
          }
        </td>

        <td>
  ${
    training.town_master
      ?.town_name

      ?

      `${training.town_master.town_name} ${training.session_type}`

      :

      training.session_type
  }
</td>

        <td>
          ${
            training.distance_km || 0
          }
        </td>

        <td>
          ${
            training.duration_minutes || 0
          }
        </td>

        <td>
          ${
            training.avg_speed_kmh || 0
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
function updatePagination() {

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTrainingLogs.length /
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
function searchTrainingLogs() {

  const search =
    (
      searchTraining?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredTrainingLogs =

    search ?

      trainingLogs.filter(
        training => {

          return (

            (
  training.team_id

    ?

    (
      training.teams
        ?.team_name || ''
    )

    :

    (
      `${training.athletes?.first_name || ''} ${training.athletes?.last_name || ''}`
    )

)
              .toLowerCase()
              .includes(search)

            ||
           (
  training
    .event_participants
    ?.event_programs
    ?.events
    ?.event_name || ''
)
  .toLowerCase()
  .includes(search)

||

(
  training
    .event_participants
    ?.event_programs
    ?.program_name || ''
)
  .toLowerCase()
  .includes(search)

||
            (
              training.session_type || ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              training.notes || ''
            )
              .toLowerCase()
              .includes(search)

          )

        }
      )

      :

      [...trainingLogs]

  currentPage = 1

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
  'participantId',
  ''
)

  setValue(
    'sessionType',
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
      .split('T')[0]
  )

}
function openNewTrainingModal() {

  clearTrainingForm()

  const modal =
    new coreui.Modal(
      document.getElementById(
        'trainingModal'
      )
    )

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

  return true

}
async function saveTraining() {

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
      p.participant_id ===
      participantId
  )

if (
  !participant
) {

  throw new Error(
    'Please select a valid participant'
  )

}

const trainingType =
  document.querySelector(
    'input[name="trainingType"]:checked'
  )?.value 

let selectedTown =
  towns.find(
    town =>

      town.town_name
        .trim()
        .toLowerCase()

      ===

      getValue(
        'townName'
      )
        .trim()
        .toLowerCase()
  )

if (
  !selectedTown &&
  getValue(
    'townName'
  )
) {

  const {
    data,
    error
  } =
    await db
      .from(
        'town_master'
      )
      .insert({
        subcounty_id:
          getValue(
            'subcountyId'
          ),

        town_name:
          getValue(
            'townName'
          )
      })
      .select()
      .single()

  if (error) {
    throw error
  }

  selectedTown =
    data

}

if (
  !selectedTown
) {

  throw new Error(
    'Please select an existing town'
  )

}

const payload = {

  town_id:
    selectedTown
      ?.town_id || null,

  training_date:
    getValue(
      'trainingDate'
    ),

  start_time:
    getValue(
      'startTime'
    ),
   
    training_week:
  getValue(
    'trainingWeek'
  ),

training_day:
  getValue(
    'trainingDay'
  ), 


  end_time:
    getValue(
      'endTime'
    ),

  avg_speed_kmh:
    Number(
      getValue(
        'avgSpeedKmh'
      )
    ),

  indoor_session:
    getValue(
      'indoorSession'
    ) === 'true',

  participant_id:
    participantId,

  event_id:
    getValue(
      'eventId'
    ),

  team_id:

  trainingType ===
  'TEAM'

    ?

    participant.team_id

    :

    null,

athlete_id:

  trainingType ===
  'INDIVIDUAL'

    ?

    participant.athlete_id

    :

    null,

  session_type:
  getValue(
    'sessionType'
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

  attendance:
    getValue(
      'attendance'
    ) === 'true',

  notes:
    getValue(
      'notes'
    )

}
const trainingId =
  getValue(
    'trainingId'
  )
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

    coreui.Modal
      .getInstance(
        document.getElementById(
          'trainingModal'
        )
      )
      ?.hide()

    await loadTrainingLogs()

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
window.editTraining =
function (
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
  'participantId',
  training.participant_id
)
   
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
  training.indoor_session
    ? 'true'
    : 'false'
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
    'attendance',
    training.attendance
      ? 'true'
      : 'false'
  )

  setValue(
    'notes',
    training.notes
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'trainingModal'
      )
    )

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
    new coreui.Modal(
      document.getElementById(
        'deleteTrainingModal'
      )
    )

  modal.show()

}
async function deleteTraining() {

  try {

    const trainingId =
      getValue(
        'deleteTrainingId'
      )

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

    coreui.Modal
      .getInstance(
        document.getElementById(
          'deleteTrainingModal'
        )
      )
      ?.hide()

    await loadTrainingLogs()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      error.message
    )

  }

}
function wireEvents() {

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
      date.getDate() / 7
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

        await loadPrograms(
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

        setValue(
          'participantId',
          ''
        )

        await loadParticipants(
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

      const programId =
        getValue(
          'programId'
        )

      if (
        programId
      ) {

        await loadParticipants(
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

      const programId =
        getValue(
          'programId'
        )

      if (
        programId
      ) {

        await loadParticipants(
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
          currentPage > 1
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

await loadTrainingLogs()

    await loadTrainingLogs()

    wireEvents()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      error.message
    )

  }

}

document.addEventListener(
  'DOMContentLoaded',
  initializeTrainingLogs
)
