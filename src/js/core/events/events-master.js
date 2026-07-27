import {
  createNumberedPaginationRenderer
} from '../services/paginationService.js'

import {
  getEventStatusBadge
} from '../services/badgeService.js'
import {
  buildActionButtons,
  buildActionCell,
  buildStatusCell
} from '../services/tableRendererService.js'

import {
  PAGE_SIZE as pageSize
} from '../services/constants.js'
import {
  createMessageController
} from '../services/errorService.js'
import {
  confirmAction
} from '../services/feedbackService.js'
import {
  getDb
} from '../supabase/getDb.js'

import {
  createModalByElement
} from '../services/modalService.js'
const {
  showErrorMessage: showError,
  showSuccessMessage: showSuccess,
  clearMessageBox: clearError
} = createMessageController({
  containerId: 'eventError'
})

let events = []
let filteredEvents = []
let currentPage = 1
let activeStatusId = null
let inactiveStatusId = null
let eventModal = null

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
      createModalByElement(modalElement)

    bindEvents()

    await loadEventCategories()
    await loadEventTypes()
    await loadEventStatuses()
    await loadEvents()
    await loadEventNameSuggestions()
  } catch (error) {

    showError(
      error.message ||
      'Failed to initialize Event Master.'
    )
  }
}

function bindEvents() {
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

async function loadEventNameSuggestions() {
  const {
    data,
    error
  } =
    await getDb()
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

  for (const name of uniqueNames) {
    const option =
        document.createElement(
          'option'
        )

    option.value = name

    datalist.append(
      option
    )
  }
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
    await getDb()
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

  for (const category of data) {
    select.innerHTML += `
        <option
          value="${category.event_category_id}">
          ${category.category_name}
        </option>
      `
  }
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
    await getDb()
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

  for (const type of data) {
    select.innerHTML += `
        <option
          value="${type.event_type_id}">
          ${type.event_type_name}
        </option>
      `
  }
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
    await getDb()
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

  for (const status of data) {
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
}

async function loadEvents() {
  const {
    data,
    error
  } =
    await getDb()
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

  for (const event of pageData) {
    const statusBadge =
      getEventStatusBadge(
        event
          .event_master_status_master
          ?.status_name || ''
      )

    const actionButtons =
      buildActionButtons({
        buttons: [
          {
            type: 'edit',
            onClick:
              `editEvent('${event.event_id}')`
          },
          {
            type: 'delete',
            onClick:
              `deleteEvent('${event.event_id}')`
          }
        ]
      })

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
        ${buildStatusCell(statusBadge)}
        ${buildActionCell(actionButtons)}
      </tr>
    `
  }

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
          .includes(search) ||

        event
          .event_category_master
          ?.category_name
          ?.toLowerCase()
          .includes(search) ||

        event
          .event_type_master
          ?.event_type_name
          ?.toLowerCase()
          .includes(search)
    )

  currentPage = 1

  renderEvents()
}

const renderPagination =
  createNumberedPaginationRenderer({
    getItemCount: () =>
      filteredEvents.length,
    getCurrentPage: () =>
      currentPage,
    pageSize,
    containerId:
      'paginationContainer',
    infoElementId:
      'paginationInfo',
    infoMode:
      'records',
    handlerName:
      'goToPage',
    control:
      'link'
  })


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
      .trim() &&

    document
      .getElementById(
        'eventCategoryId'
      )
      .value &&

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
function (eventId) {
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
async function (
  eventId
) {
  if (
    !await confirmAction({
      title: 'Confirm Delete',
      message:
        'Delete this Event Master?',
      confirmText: 'Delete',
      type: 'warning'
    })
  ) {
    return
  }

  const {
    error
  } =
    await getDb()
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
    await getDb()
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
        await getDb()
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
        await getDb()
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
