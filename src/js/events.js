/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

let events = []
let filteredEvents = []

let countries = []
let counties = []
let subcounties = []
let towns = []

let eventTypes = []
let sponsors = []

let currentPage = 1
let programs = []
const eventLoading =
  document.getElementById(
    'eventLoading'
  )

const eventFormError =
  document.getElementById(
    'eventFormError'
  )

const eventsTableBody =
  document.getElementById(
    'eventsTableBody'
  )

const searchEvent =
  document.getElementById(
    'searchEvent'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  ) 
function showLoading() {
  eventLoading?.classList.remove(
    'd-none'
  )
}

function hideLoading() {
  eventLoading?.classList.add(
    'd-none'
  )
}

function showError(message) {
  if (eventFormError) {
    eventFormError.textContent =
      message
  }
}

function clearError() {
  if (eventFormError) {
    eventFormError.textContent =
      ''
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
function getStatusBadge(
  status
) {

  switch (status) {

    case 'Planned':
      return `
        <span class="badge bg-secondary">
          Planned
        </span>
      `

    case 'Open':
      return `
        <span class="badge bg-info">
          Open
        </span>
      `

    case 'Ongoing':
      return `
        <span class="badge bg-primary">
          Ongoing
        </span>
      `

    case 'Completed':
      return `
        <span class="badge bg-success">
          Completed
        </span>
      `

    case 'Unfinished':
      return `
        <span class="badge bg-warning text-dark">
          Unfinished
        </span>
      `

    case 'Cancelled':
      return `
        <span class="badge bg-danger">
          Cancelled
        </span>
      `

    default:
      return status || ''
  }
}
async function loadCountries() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'country_master'
      )
      .select('*')
      .order(
        'country_name'
      )

  if (error) {
    console.error(error)
    return
  }

  countries =
    data || []

  const select =
    document.getElementById(
      'countryId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        Select Country
      </option>
    `

  for (
    const country
    of countries
  ) {

    select.innerHTML += `
      <option
        value="${country.country_id}"
      >
        ${country.country_name}
      </option>
    `
  }
} 

async function loadCounties() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from('county_master')
      .select('*')
      .order('county_name')

  if (error) {
    console.error(error)
    return
  }

  counties = data || []

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
    await window.supabaseClient
      .from('subcounty_master')
      .select('*')
      .eq(
        'county_id',
        countyId
      )
      .order(
        'subcounty_name'
      )

  if (error) {
    return
  }

  const select =
    document.getElementById(
      'subcountyId'
    )

  select.innerHTML =
    `
      <option value="">
        Select Sub County
      </option>
    `

  data.forEach(
    item => {

      select.innerHTML += `
        <option
          value="${item.subcounty_id}"
        >
          ${item.subcounty_name}
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
    await window.supabaseClient
      .from('town_master')
      .select('*')
      .eq(
        'subcounty_id',
        subcountyId
      )
      .order(
        'town_name'
      )

  if (error) {
    return
  }

  const select =
    document.getElementById(
      'townId'
    )

  select.innerHTML =
    `
      <option value="">
        Select Town
      </option>
    `

  data.forEach(
    item => {

      select.innerHTML += `
        <option
          value="${item.town_id}"
        >
          ${item.town_name}
        </option>
      `
    }
  )
}


async function loadEventTypes() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'event_type_master'
      )
      .select('*')
      .order(
        'event_type_name'
      )

  if (error) {
    console.error(error)
    return
  }

  eventTypes =
    data || []

  const select =
    document.getElementById(
      'eventTypeId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        Select Event Type
      </option>
    `

  for (
    const type
    of eventTypes
  ) {

    select.innerHTML += `
      <option
        value="${type.event_type_id}"
      >
        ${type.event_type_name}
      </option>
    `
  }
} 

async function loadSponsors() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'sponsor_master'
      )
      .select('*')
      .order(
        'sponsor_name'
      )

  if (error) {
    console.error(error)
    return
  }

  sponsors =
    data || []

  const select =
    document.getElementById(
      'sponsorIds'
    )

  if (!select) {
    return
  }

  select.innerHTML = ''

  for (
    const sponsor
    of sponsors
  ) {

    select.innerHTML += `
      <option
        value="${sponsor.sponsor_id}"
      >
        ${sponsor.sponsor_name}
      </option>
    `
  }
} 
async function loadEvents() {

  try {

    showLoading()

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from('events')
        .select(`
  *,
  country_master(
    country_name
  ),
  county_master(
    county_name
  ),
  subcounty_master(
    subcounty_name
  ),
  town_master(
    town_name
  ),
  event_type_master(
            event_type_name
          ),
          status_master(
            status_name
          ),
          event_sponsors(
            sponsor_id,
            sponsor_master(
              sponsor_name
            )
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

  } catch (error) {

    console.error(error)

    alert(
      error.message ||
      'Failed to load events'
    )

  } finally {

    hideLoading()

  }
} 
function getSponsors(
  event
) {

  if (
    !event.event_sponsors
  ) {
    return ''
  }

  return event
    .event_sponsors
    .map(
      sponsor =>
        sponsor
          ?.sponsor_master
          ?.sponsor_name
    )
    .filter(Boolean)
    .join(', ')
} 
function renderEvents() {

  if (
    !eventsTableBody
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
    filteredEvents.slice(
      start,
      end
    )

  eventsTableBody.innerHTML =
    ''

  if (
    pageRows.length === 0
  ) {

    eventsTableBody.innerHTML =
      `
      <tr>
        <td
          colspan="14"
          class="text-center"
        >
          No events found
        </td>
      </tr>
      `

    updatePagination()

    return
  }

  for (
    const event
    of pageRows
  ) {

    eventsTableBody.innerHTML += `
      <tr>

        
        <td>
  ${event.event_name || ''}
</td>

<td>
  ${event.event_category || ''}
</td>

<td>
  ${
    event.country_master
      ?.country_name || ''
  }
</td>

<td>
  ${
    event.county_master
      ?.county_name || ''
  }
</td>

<td>
  ${
    event.subcounty_master
      ?.subcounty_name || ''
  }
</td>

<td>
  ${
    event.town_master
      ?.town_name || ''
  }
</td>

<td>
  ${event.city || ''}
</td>
        <td>
          ${event.organizer || ''}
        </td>

        <td>
          ${
            event.event_type_master
              ?.event_type_name || ''
          }
        </td>

        <td>
          ${getSponsors(event)}
        </td>

       <td>
  ${event.start_date || ''}
  <br>
  <small>
    ${event.start_time || ''}
  </small>
</td>

<td>
  ${event.end_date || ''}
  <br>
  <small>
    ${event.end_time || ''}
  </small>
</td>

        <td>
  ${
    getStatusBadge(
      event.status_master
        ?.status_name
    )
  }
</td>

        <td>

  <button
    class="btn btn-sm btn-warning me-1"
    onclick="editEvent('${event.event_id}')"
  >
    Edit
  </button>

  ${
    event.status_master?.status_name ===
    'Cancelled'

      ?

      `
      <button
        class="btn btn-sm btn-success me-1"
        onclick="restoreEvent('${event.event_id}')"
      >
        Restore
      </button>
      `

      :

      `
      <button
        class="btn btn-sm btn-secondary me-1"
        onclick="cancelEvent('${event.event_id}')"
      >
        Cancel
      </button>
      `
  }
<button
  class="btn btn-sm btn-info me-1"
  onclick="managePrograms('${event.event_id}')"
>
  Programs
</button>
  <button
    class="btn btn-sm btn-danger"
    onclick="confirmDeleteEvent('${event.event_id}')"
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
        filteredEvents.length /
        PAGE_SIZE
      )
    )

  if (
    paginationInfo
  ) {

    paginationInfo.textContent =
      `
      Page ${currentPage}
      of ${totalPages}
      `
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
function searchEvents() {

  const search =
    (
      searchEvent?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredEvents =
    search ?

      events.filter(
        event => {

          const sponsors =
            getSponsors(event)
              .toLowerCase()

          return (

            (
              event.event_code ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              event.event_name ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              event.city ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              event.organizer ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              event.country_master
                ?.country_name ||
              ''
            )
              .toLowerCase()
              .includes(search)
            

          ||

(
  event.county_master
    ?.county_name ||
  ''
)
  .toLowerCase()
  .includes(search)

||

(
  event.subcounty_master
    ?.subcounty_name ||
  ''
)
  .toLowerCase()
  .includes(search)

||

(
  event.town_master
    ?.town_name ||
  ''
)
  .toLowerCase()
  .includes(search)


            ||

            (
              event.event_type_master
                ?.event_type_name ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            (
              event.status_master
                ?.status_name ||
              ''
            )
              .toLowerCase()
              .includes(search)

            ||

            sponsors.includes(
              search
            )
          )
        }
      )

      :

      [...events]

  currentPage = 1

  renderEvents()
}
function clearEventForm() {

  clearError()

  setValue(
    'eventId',
    ''
  )

  setValue(
    'eventCode',
    ''
  )
  setValue(
    'eventCategory',
    ''
  )
  setValue(
    'eventName',
    ''
  )

  setValue(
    'countryId',
    ''
  )
setValue(
  'countyId',
  ''
)

setValue(
  'subcountyId',
  ''
)

setValue(
  'townId',
  ''
)

  setValue(
    'city',
    ''
  )

  setValue(
    'organizer',
    ''
  )

  setValue(
    'eventTypeId',
    ''
  )

  setValue(
    'startDate',
    ''
  )

  setValue(
    'endDate',
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
  'eventStatus',
  'Automatic'
)

  const sponsorsSelect =
    document.getElementById(
      'sponsorIds'
    )

  if (
    sponsorsSelect
  ) {

    Array
      .from(
        sponsorsSelect.options
      )
      .forEach(
        option => {
          option.selected =
            false
        }
      )
  }
}
function openNewEventModal() {

  clearEventForm()

  document
    .getElementById(
      'eventModalTitle'
    )
    .textContent =
      'Add Event'

  const modal =
    new coreui.Modal(
      document.getElementById(
        'eventModal'
      )
    )

  modal.show()
} 
window.editEvent =
async function (eventId) {

  const event =
    events.find(
      e =>
        e.event_id === eventId
    )

  if (!event) {
    return
  }

  clearError()

  document
    .getElementById(
      'eventModalTitle'
    )
    .textContent =
      'Edit Event'

  setValue(
    'eventId',
    event.event_id
  )
  
  setValue(
  'eventCategory',
  event.event_category
)

  setValue(
    'eventCode',
    event.event_code
  )

  setValue(
    'eventName',
    event.event_name
  )

  setValue(
    'countryId',
    event.country_id
  )
setValue(
  'countyId',
  event.county_id
)

await loadSubcounties(
  event.county_id
)

setValue(
  'subcountyId',
  event.subcounty_id
)

await loadTowns(
  event.subcounty_id
)

setValue(
  'townId',
  event.town_id
)
  setValue(
    'city',
    event.city
  )

  setValue(
    'organizer',
    event.organizer
  )

  setValue(
    'eventTypeId',
    event.event_type_id
  )

  setValue(
    'startDate',
    event.start_date
  )

  setValue(
    'endDate',
    event.end_date
  )

  setValue(
    'startTime',
    event.start_time
  )

  setValue(
    'endTime',
    event.end_time
  )

  setValue(
  'eventStatus',
  event.status_master?.status_name ||
  'Automatic'
)

  const sponsorsSelect =
    document.getElementById(
      'sponsorIds'
    )

  if (
    sponsorsSelect
  ) {

    const selectedSponsors =
      (
        event.event_sponsors ||
        []
      ).map(
        s =>
          s.sponsor_id
      )

    Array
      .from(
        sponsorsSelect.options
      )
      .forEach(
        option => {

          option.selected =
            selectedSponsors.includes(
              option.value
            )
        }
      )
  }

  const modal =
    new coreui.Modal(
      document.getElementById(
        'eventModal'
      )
    )

  modal.show()
}
function validateEvent() {

  clearError()

  if (
    !getValue(
      'eventName'
    ).trim()
  ) {

    showError(
      'Event Name is required'
    )

    return false
  }

  if (
    !getValue(
      'countryId'
    )
  ) {

    showError(
      'Country is required'
    )

    return false
  }

 if (
  !getValue(
    'countyId'
  )
) {

  showError(
    'County is required'
  )

  return false
}

if (
  !getValue(
    'subcountyId'
  )
) {

  showError(
    'Sub County is required'
  )

  return false
}

if (
  !getValue(
    'townId'
  )
) {

  showError(
    'Town is required'
  )

  return false
}

  if (
    !getValue(
      'city'
    ).trim()
  ) {

    showError(
      'City is required'
    )

    return false
  }

  if (
    !getValue(
      'eventTypeId'
    )
  ) {

    showError(
      'Event Type is required'
    )

    return false
  }
  if (
  !getValue(
    'eventCategory'
  )
) {

  showError(
    'Event Category is required'
  )

  return false
}

  if (
    !getValue(
      'startDate'
    )
  ) {

    showError(
      'Start Date is required'
    )

    return false
  }

  if (
  !getValue(
    'endDate'
  )
) {

  showError(
    'End Date is required'
  )

  return false
}

const startTime =
  getValue(
    'startTime'
  )

const endTime =
  getValue(
    'endTime'
  )
const startDate =
  getValue(
    'startDate'
  )

const endDate =
  getValue(
    'endDate'
  )
if (
  startDate >
  endDate
) {

  showError(
    'End Date must be on or after Start Date'
  )

  return false
}

if (
  startDate === endDate &&
  startTime &&
  endTime &&
  startTime >= endTime
) {

  showError(
    'End Time must be after Start Time'
  )

  return false
}

return true
}
async function saveSponsors(
  eventId
) {

  const sponsorsSelect =
    document.getElementById(
      'sponsorIds'
    )

  if (
    !sponsorsSelect
  ) {
    return
  }

  const selectedSponsors =
    Array
      .from(
        sponsorsSelect
          .selectedOptions
      )
      .map(
        option =>
          option.value
      )

  if (
    selectedSponsors.length === 0
  ) {
    return
  }

  const sponsorRows =
    selectedSponsors.map(
      sponsorId => ({

        event_id:
          eventId,

        sponsor_id:
          sponsorId
      })
    )

  const { error } =
    await window
      .supabaseClient
      .from(
        'event_sponsors'
      )
      .insert(
        sponsorRows
      )

  if (error) {
    throw error
  }
}
async function updateSponsors(
  eventId
) {

  await window
    .supabaseClient
    .from(
      'event_sponsors'
    )
    .delete()
    .eq(
      'event_id',
      eventId
    )

  await saveSponsors(
    eventId
  )
}
async function saveEvent() {

  try {

    if (
      !validateEvent()
    ) {
      return
    }

    showLoading()

    const eventId =
      getValue(
        'eventId'
      )

   const payload = {

  event_name:
    getValue(
      'eventName'
    ),

  country_id:
    getValue(
      'countryId'
    ) || null,

  county_id:
    getValue(
      'countyId'
    ) || null,

  subcounty_id:
    getValue(
      'subcountyId'
    ) || null,

  town_id:
    getValue(
      'townId'
    ) || null,

  city:
    getValue(
      'city'
    ),

  organizer:
    getValue(
      'organizer'
    ) || null,

  event_type_id:
    getValue(
      'eventTypeId'
    ) || null,
  
   event_category:
  getValue(
    'eventCategory'
  ), 

  start_date:
    getValue(
      'startDate'
    ),

  end_date:
    getValue(
      'endDate'
    ),

  start_time:
    getValue(
      'startTime'
    ) || null,

  end_time:
    getValue(
      'endTime'
    ) || null,


}

    let error
    let savedEventId

    if (
      eventId
    ) {

      const result =
        await window
          .supabaseClient
          .from(
            'events'
          )
          .update(
            payload
          )
          .eq(
            'event_id',
            eventId
          )
          .select()

      error =
        result.error

      savedEventId =
        eventId

      await updateSponsors(
        eventId
      )

    } else {

      const result =
        await window
          .supabaseClient
          .from(
            'events'
          )
          .insert(
            payload
          )
          .select()

      error =
        result.error

      savedEventId =
        result.data?.[0]
          ?.event_id

      await saveSponsors(
        savedEventId
      )
    }

    if (
      error
    ) {
      throw error
    }

    const modal =
      coreui.Modal
        .getInstance(
          document
            .getElementById(
              'eventModal'
            )
        )

    if (
      modal
    ) {
      modal.hide()
    }

    await loadEvents()

  } catch (
    error
  ) {

    console.error(
      error
    )

    showError(
      error.message
    )

  } finally {

    hideLoading()

  }
}
window.confirmDeleteEvent =
function (
  eventId
) {
window.cancelEvent =
async function (
  eventId
) {

  try {

    const { error } =
      await window
        .supabaseClient
        .from(
          'events'
        )
        .update({

          status_id:
            'dd9f0359-5454-4d3d-9db1-b794cbeb8e4d'

        })
        .eq(
          'event_id',
          eventId
        )

    if (error) {
      throw error
    }

    await loadEvents()

  } catch (
    error
  ) {

    alert(
      error.message
    )

  }
}
window.restoreEvent =
async function (
  eventId
) {

  try {

    const { error } =
      await window
        .supabaseClient
        .from(
          'events'
        )
        .update({

          status_id:
            'e0898929-e07d-4731-8ad6-ed8f0978a261'

        })
        .eq(
          'event_id',
          eventId
        )

    if (error) {
      throw error
    }

    await loadEvents()

  } catch (
    error
  ) {

    alert(
      error.message
    )

  }
}

  setValue(
    'deleteEventId',
    eventId
  )

  const modal =
    new coreui.Modal(
      document
        .getElementById(
          'deleteEventModal'
        )
    )

  modal.show()
}
async function deleteEvent() {

  try {

    const eventId =
      getValue(
        'deleteEventId'
      )

    if (
      !eventId
    ) {
      return
    }

    showLoading()

    await window
      .supabaseClient
      .from(
        'event_sponsors'
      )
      .delete()
      .eq(
        'event_id',
        eventId
      )

    const { error } =
      await window
        .supabaseClient
        .from(
          'events'
        )
        .delete()
        .eq(
          'event_id',
          eventId
        )

    if (
      error
    ) {
      throw error
    }

    const modal =
      coreui.Modal
        .getInstance(
          document
            .getElementById(
              'deleteEventModal'
            )
        )

    if (
      modal
    ) {
      modal.hide()
    }

    await loadEvents()

  } catch (
    error
  ) {

    console.error(
      error
    )

    alert(
      error.message
    )

  } finally {

    hideLoading()

  }
}
async function initializeEvents() {

  try {

    if (
      !window
        .supabaseClient
    ) {

      console.error(
        'Supabase client not found'
      )

      return
    }

    await loadCountries()

await loadCounties()

await loadEventTypes()

await loadSponsors()

await loadEvents()

  } catch (
    error
  ) {

    console.error(
      error
    )
  }
}

document
  .addEventListener(
    'DOMContentLoaded',
    initializeEvents
  )
document.addEventListener(
  'DOMContentLoaded',
  () => {

    document
      .getElementById('btnAddEvent')
      ?.addEventListener(
        'click',
        openNewEventModal
      )

    document
      .getElementById('btnSaveEvent')
      ?.addEventListener(
        'click',
        saveEvent
      )

    document
      .getElementById(
        'btnConfirmDeleteEvent'
      )
      ?.addEventListener(
        'click',
        deleteEvent
      )

    document
      .getElementById('searchEvent')
      ?.addEventListener(
        'input',
        searchEvents
      )

    document
      .getElementById(
        'btnRefreshEvents'
      )
      ?.addEventListener(
        'click',
        loadEvents
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

        renderEvents()

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
              filteredEvents.length /
              PAGE_SIZE
            )

          if (
            currentPage <
            totalPages
          ) {

            currentPage++

            renderEvents()
          }
        }
      )
document
  .getElementById(
    'countyId'
  )
  ?.addEventListener(
    'change',
    async event => {

      await loadSubcounties(
        event.target.value
      )

      setValue(
        'subcountyId',
        ''
      )

      setValue(
        'townId',
        ''
      )
    }
  )

document
  .getElementById(
    'subcountyId'
  )
  ?.addEventListener(
    'change',
    async event => {

      await loadTowns(
        event.target.value
      )

      setValue(
        'townId',
        ''
      )
    }
  )

  }
)

window.managePrograms =
async function (
  eventId
) {

  const event =
    events.find(
      e =>
        e.event_id ===
        eventId
    )

  if (!event) {
    return
  }

  setValue(
    'programEventId',
    eventId
  )

  document
    .getElementById(
      'programEventName'
    ).textContent =
      event.event_name

  await loadPrograms(
    eventId
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'programModal'
      )
    )

  modal.show()

}

async function loadPrograms(
  eventId
) {

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
        'sort_order'
      )

  if (error) {

    console.error(error)

    return
  }

  programs =
    data || []

  renderPrograms()

}

function renderPrograms() {

  const body =
    document.getElementById(
      'programTableBody'
    )

  if (!body) {
    return
  }

  body.innerHTML = ''

  programs.forEach(
    program => {

      body.innerHTML += `
        <tr>

          <td>
            ${program.program_name}
          </td>

          <td>
            ${program.program_type}
          </td>

          <td>
            ${
              program.days_per_week || ''
            }
          </td>

          <td>
            ${
              program.active
                ? 'Yes'
                : 'No'
            }
          </td>

          <td>

            <button
              class="btn btn-sm btn-danger"
              onclick="deleteProgram('${program.program_id}')"
            >
              Delete
            </button>

          </td>

        </tr>
      `
    }
  )

}
async function saveProgram() {

  const eventId =
    getValue(
      'programEventId'
    )

  const payload = {

    event_id:
      eventId,

    program_name:
      getValue(
        'programName'
      ),

    program_type:
      getValue(
        'programType'
      ),

    days_per_week:
      getValue(
        'daysPerWeek'
      ) || null

  }

  const {
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_programs'
      )
      .insert(
        payload
      )

  if (error) {

    alert(
      error.message
    )

    return
  }

  setValue(
    'programName',
    ''
  )

  setValue(
    'programType',
    ''
  )

  setValue(
    'daysPerWeek',
    ''
  )

  await loadPrograms(
    eventId
  )

}
window.deleteProgram =
async function (
  programId
) {

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
    getValue(
      'programEventId'
    )
  )

}
document
  .getElementById(
    'btnSaveProgram'
  )
  ?.addEventListener(
    'click',
    saveProgram
  )