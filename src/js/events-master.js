let events = []

let filteredEvents = []

let currentPage = 1

const pageSize = 10

let activeStatusId = null

let inactiveStatusId = null

let eventModal = null
let programModal = null

document.addEventListener(
  'DOMContentLoaded',
  initializeMasterEvents
)

async function initializeMasterEvents() {

  try {

    const modalElement =
      document.getElementById(
        'eventModal'
      )

    if (!modalElement) {
      throw new Error(
        'Event modal not found.'
      )
    }

    eventModal =
      new coreui.Modal(
        modalElement
      )
   programModal =
  new coreui.Modal(
    document.getElementById(
      'programModal'
    )
  )

    bindEvents()

    await loadEventCategories()

    await loadEventTypes()

    await loadEventStatuses()

    await loadEvents()

    await loadEventNameSuggestions()

  } catch (error) {

    console.error(error)

    showError(
      error.message ||
      'Failed to initialize Event Master.'
    )

  }

}

function bindEvents() {
document
  .getElementById(
    'btnSaveProgram'
  )
  ?.addEventListener(
    'click',
    saveProgram
  )

  document
    .getElementById(
      'btnNewEvent'
    )
    ?.addEventListener(
      'click',
      openNewEventModal
    )

  document
    .getElementById(
      'btnSaveEvent'
    )
    ?.addEventListener(
      'click',
      saveEvent
    )

  document
    .getElementById(
      'searchEvent'
    )
    ?.addEventListener(
      'input',
      searchEvents
    )

}

window.managePrograms =
async function(eventId) {

  const event =
    events.find(
      row =>
        row.event_id === eventId
    )

  if (!event) {
    return
  }

  document.getElementById(
    'programEventId'
  ).value =
    event.event_id

  document.getElementById(
    'programEventName'
  ).value =
    event.event_name

  document.getElementById(
    'programEventType'
  ).value =
    event
      .event_type_master
      ?.event_type_name || ''

  await loadPrograms(
    eventId
  )

  programModal.show()

}

async function loadPrograms(
  eventId
) {

  const tbody =
    document.getElementById(
      'programTableBody'
    )

  tbody.innerHTML = ''

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_programs'
      )
      .select('*')
      .eq(
        'event_id',
        eventId
      )
      .order(
        'program_name'
      )

  if (error) {
    throw error
  }

  data.forEach(
    program => {

      tbody.innerHTML += `
        <tr>

          <td>
            ${program.program_name}
          </td>

         <td>

  <button
    class="btn btn-sm btn-primary me-1"
    onclick="editProgram(
      '${program.program_id}',
      '${program.program_name}'
    )">

    Edit

  </button>

  <button
    class="btn btn-sm btn-danger"
    onclick="deleteProgram('${program.program_id}')">

    Delete

  </button>

</td>
        </tr>
      `
    }
  )

}


window.editProgram =
function(
  programId,
  programName
) {

  document.getElementById(
    'programId'
  ).value =
    programId

  document.getElementById(
    'programName'
  ).value =
    programName

}

async function saveProgram() {

  const eventId =
    document.getElementById(
      'programEventId'
    ).value

  const programName =
    document
      .getElementById(
        'programName'
      )
      .value
      .trim()

  if (!programName) {

    alert(
      'Program Name required'
    )

    return

  }

  const programId =
  document.getElementById(
    'programId'
  ).value

let error

if (programId) {

  const result =
    await window
      .supabaseClient
      .from(
        'event_programs'
      )
      .update({

        program_name:
          programName

      })
      .eq(
        'program_id',
        programId
      )

  error =
    result.error

} else {

  const result =
    await window
      .supabaseClient
      .from(
        'event_programs'
      )
      .insert({

        event_id:
          eventId,

        program_name:
          programName

      })

  error =
    result.error

}



        

  if (error) {

    alert(
      error.message
    )

    return

  }

  document.getElementById(
    'programName'
  ).value = ''
  
  document.getElementById(
  'programId'
).value = ''

  await loadPrograms(
    eventId
  )

}

window.deleteProgram =
async function(programId) {

  if (
    !confirm(
      'Delete this program?'
    )
  ) {
    return
  }

  const eventId =
    document.getElementById(
      'programEventId'
    ).value

  const {
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_programs'
      )
      .delete()
      .eq(
        'program_id',
        programId
      )

  if (error) {

    alert(
      error.message
    )

    return

  }

  await loadPrograms(
    eventId
  )

}


function showError(message) {

  const errorBox =
    document.getElementById(
      'eventError'
    )

  if (!errorBox) {

    alert(message)

    return

  }

  errorBox.textContent =
    message

  errorBox.classList.remove(
    'd-none'
  )

}

function clearError() {

  const errorBox =
    document.getElementById(
      'eventError'
    )

  if (!errorBox) {
    return
  }

  errorBox.textContent = ''

  errorBox.classList.add(
    'd-none'
  )

}

async function loadEventNameSuggestions() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .select(
        'event_name'
      )
      .order(
        'event_name'
      )

  if (error) {
    throw error
  }

  const datalist =
    document.getElementById(
      'eventNameSuggestions'
    )

  if (!datalist) {
    return
  }

  datalist.innerHTML = ''

  const uniqueNames =
    [
      ...new Set(
        (data || [])
          .map(
            row =>
              row.event_name
          )
          .filter(Boolean)
      )
    ]

  uniqueNames.forEach(
    name => {

      const option =
        document.createElement(
          'option'
        )

      option.value = name

      datalist.appendChild(
        option
      )

    }
  )

}

async function loadEventCategories() {

  const select =
    document.getElementById(
      'eventCategoryId'
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Event Category
    </option>
  `

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_category_master'
      )
      .select('*')
      .order(
        'category_name'
      )

  if (error) {
    throw error
  }

  data.forEach(
    category => {

      select.innerHTML += `
        <option
          value="${category.event_category_id}">
          ${category.category_name}
        </option>
      `
    }
  )

}

async function loadEventTypes() {

  const select =
    document.getElementById(
      'eventTypeId'
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Event Type
    </option>
  `

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_type_master'
      )
      .select('*')
      .order(
        'event_type_name'
      )

  if (error) {
    throw error
  }

  data.forEach(
    type => {

      select.innerHTML += `
        <option
          value="${type.event_type_id}">
          ${type.event_type_name}
        </option>
      `
    }
  )

}

async function loadEventStatuses() {

  const select =
    document.getElementById(
      'eventStatusId'
    )

  if (!select) {
    return
  }

  select.innerHTML = `
    <option value="">
      Select Status
    </option>
  `

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
  'event_master_status_master'
)
.select(`
  event_master_status_id,
  status_name,
  status_code
`)
      

  if (error) {
    throw error
  }

  data.forEach(
    status => {

      if (
  status.status_code
    ?.toUpperCase() ===
  'ACTIVE'
) {

  activeStatusId =
    status.event_master_status_id

}

      if (
        status.status_code
          ?.toUpperCase() ===
        'DEACTIVATED'
      ) {

        inactiveStatusId =
          status.event_master_status_id

      }

      select.innerHTML += `
        <option
          value="${status.event_master_status_id}">
          ${status.status_name}
        </option>
      `
    }
  )

}
async function loadEvents() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .select(`
        *,
        event_category_master(
          category_name
        ),
        event_type_master(
          event_type_name
        ),
        event_master_status_master(
          status_name
        )
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      )

  if (error) {
    throw error
  }

  events =
    data || []

  filteredEvents =
    [...events]

  renderEvents()

}

function renderEvents() {

  const tbody =
    document.getElementById(
      'eventTableBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  const start =
    (currentPage - 1) *
    pageSize

  const pageData =
    filteredEvents.slice(
      start,
      start + pageSize
    )

  pageData.forEach(
    event => {

      tbody.innerHTML += `
        <tr>

          <td>
            ${event.event_name || ''}
          </td>

          <td>
            ${
              event
                .event_category_master
                ?.category_name || ''
            }
          </td>

          <td>
            ${
              event
                .event_type_master
                ?.event_type_name || ''
            }
          </td>

          <td>
            ${
              event
                .event_master_status_master
                ?.status_name || ''
            }
          </td>

         <td class="text-center">

  <button
    class="btn btn-sm btn-primary me-1"
    onclick="editEvent('${event.event_id}')">
    Edit
  </button>

  <button
    class="btn btn-sm btn-success me-1"
    onclick="managePrograms('${event.event_id}')">
    Programs
  </button>

  <button
    class="btn btn-sm btn-danger"
    onclick="deleteEvent('${event.event_id}')">
    Delete
  </button>

</td>

        </tr>
      `
    }
  )

  renderPagination()

}
function searchEvents() {

  const search =
    document
      .getElementById(
        'searchEvent'
      )
      .value
      .trim()
      .toLowerCase()

  filteredEvents =
    events.filter(
      event =>

        event.event_name
          ?.toLowerCase()
          .includes(search)

        ||

        event
          .event_category_master
          ?.category_name
          ?.toLowerCase()
          .includes(search)

        ||

        event
          .event_type_master
          ?.event_type_name
          ?.toLowerCase()
          .includes(search)
    )

  currentPage = 1

  renderEvents()

}

function renderPagination() {

  const container =
    document.getElementById(
      'paginationContainer'
    )

  const info =
    document.getElementById(
      'paginationInfo'
    )

  if (
    !container ||
    !info
  ) {
    return
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEvents.length /
        pageSize
      )
    )

  info.textContent =
    `${filteredEvents.length} record(s)`

  container.innerHTML = ''

  for (
    let i = 1;
    i <= totalPages;
    i++
  ) {

    container.innerHTML += `
      <li class="page-item ${
        i === currentPage
          ? 'active'
          : ''
      }">

        <a
          class="page-link"
          href="#"
          onclick="goToPage(${i})">

          ${i}

        </a>

      </li>
    `
  }

}

function goToPage(page) {

  currentPage = page

  renderEvents()

}

function validateEvent() {

  return Boolean(

    document
      .getElementById(
        'eventName'
      )
      .value
      .trim()

    &&

    document
      .getElementById(
        'eventCategoryId'
      )
      .value

    &&

    document
      .getElementById(
        'eventTypeId'
      )
      .value

  )

}

function openNewEventModal() {

  clearError()

  clearEventForm()

  document
    .getElementById(
      'eventStatusContainer'
    )
    .classList
    .add('d-none')

  eventModal.show()

}

function clearEventForm() {

  document.getElementById(
    'eventId'
  ).value = ''

  document.getElementById(
    'eventName'
  ).value = ''

  document.getElementById(
    'eventCategoryId'
  ).value = ''

  document.getElementById(
    'eventTypeId'
  ).value = ''

  document.getElementById(
    'eventStatusId'
  ).value = ''

}

window.editEvent =
function(eventId) {

  const event =
    events.find(
      row =>
        row.event_id ===
        eventId
    )

  if (!event) {
    return
  }

  clearError()

  document
    .getElementById(
      'eventId'
    )
    .value =
      event.event_id

  document
    .getElementById(
      'eventName'
    )
    .value =
      event.event_name

  document
    .getElementById(
      'eventCategoryId'
    )
    .value =
      event.event_category_id

  document
    .getElementById(
      'eventTypeId'
    )
    .value =
      event.event_type_id

  document
    .getElementById(
      'eventStatusId'
    )
    .value =
      event.event_master_status_id

  document
    .getElementById(
      'eventStatusContainer'
    )
    .classList
    .remove('d-none')

  eventModal.show()

}

window.deleteEvent =
async function(
  eventId
) {

  if (
    !confirm(
      'Delete this Event Master?'
    )
  ) {
    return
  }

  const {
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .delete()
      .eq(
        'event_id',
        eventId
      )

  if (error) {

    showError(
      error.message
    )

    return

  }

  await loadEvents()

}

async function eventExists(
  eventName,
  eventTypeId,
  excludeId = null
) {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from('events')
      .select(
        'event_id'
      )
      .eq(
        'event_name',
        eventName
      )
      .eq(
        'event_type_id',
        eventTypeId
      )

  if (error) {
    throw error
  }

  const rows =
    (data || [])
      .filter(
        row =>
          row.event_id !==
          excludeId
      )

  return rows.length > 0

}

async function saveEvent() {

  clearError()

  if (
    !validateEvent()
  ) {

    showError(
      'All fields are required.'
    )

    return

  }

  try {

    const eventId =
      document
        .getElementById(
          'eventId'
        )
        .value

    const eventName =
      document
        .getElementById(
          'eventName'
        )
        .value
        .trim()

    const eventTypeId =
      document
        .getElementById(
          'eventTypeId'
        )
        .value

    const exists =
      await eventExists(
        eventName,
        eventTypeId,
        eventId
      )

    if (exists) {

      showError(
        'Event Name and Event Type already exist.'
      )

      return

    }

    const payload = {

      event_name:
        eventName,

      event_category_id:
        document
          .getElementById(
            'eventCategoryId'
          )
          .value,

      event_type_id:
        eventTypeId

    }

    if (eventId) {

      payload.event_master_status_id =
        document
          .getElementById(
            'eventStatusId'
          )
          .value

      const {
        error
      } =
        await window
          .supabaseClient
          .from('events')
          .update(
            payload
          )
          .eq(
            'event_id',
            eventId
          )

      if (error) {
        throw error
      }

    } else {

      payload.event_master_status_id =
        activeStatusId

      const {
        error
      } =
        await window
          .supabaseClient
          .from('events')
          .insert(
            payload
          )

      if (error) {
        throw error
      }

    }

    eventModal.hide()

    await loadEvents()

    await loadEventNameSuggestions()

  } catch (error) {

    console.error(error)

    showError(
      error.message ||
      'Failed to save Event Master.'
    )

  }

}



window.openNewEventModal =
  openNewEventModal

window.saveEvent =
  saveEvent

window.goToPage =
  goToPage

window.searchEvents =
  searchEvents