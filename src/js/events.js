// =====================================================
// EVENTS MODULE
// ParaCycling Federation Management System
// =====================================================

/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

const PAGE_SIZE = 10

let eventOccurrences = []

let filteredOccurrences = []

let currentPage = 1

let events = []

let sponsors = []

let countries = []

let counties = []

let subcounties = []

let towns = []

let pendingOccurrenceDeleteId =
  null

const eventInstanceId =
  document.getElementById(
    'eventInstanceId'
  )
const btnNewOccurrence =
  document.getElementById(
    'btnNewOccurrence'
  )
const occurrenceTableBody =
  document.getElementById(
    'occurrenceTableBody'
  )

const searchOccurrence =
  document.getElementById(
    'searchOccurrence'
  )

const paginationInfo =
  document.getElementById(
    'paginationInfo'
  )

const occurrenceError =
  document.getElementById(
    'occurrenceError'
  )

const eventId =
  document.getElementById(
    'eventId'
  )

const sponsorId =
  document.getElementById(
    'sponsorId'
  )

const countryId =
  document.getElementById(
    'countryId'
  )

const countyId =
  document.getElementById(
    'countyId'
  )

const subcountyId =
  document.getElementById(
    'subcountyId'
  )

const occurrenceStatusId =
  document.getElementById(
    'occurrenceStatusId'
  )



const btnSaveOccurrence =
  document.getElementById(
    'btnSaveOccurrence'
  )

const btnSaveOccurrenceAsNew =
  document.getElementById(
    'btnSaveOccurrenceAsNew'
  )

const eventCategory =
  document.getElementById(
    'eventCategory'
  )

const eventType =
  document.getElementById(
    'eventType'
  )

const townName =
  document.getElementById(
    'townName'
  )

const eventArea =
  document.getElementById(
    'eventArea'
  )

const townSuggestions =
  document.getElementById(
    'townSuggestions'
  )




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

function showError(
  message
) {

  if (
    occurrenceError
  ) {

    occurrenceError
      .textContent =
      message

    occurrenceError
      .classList
      .remove(
        'd-none'
      )
  }
}

function clearError() {

  if (
    occurrenceError
  ) {

    occurrenceError
      .textContent = ''

    occurrenceError
      .classList
      .add(
        'd-none'
      )
  }
}

function showSuccess(
  message
) {

  if (
    occurrenceError
  ) {

    occurrenceError.classList.remove(
      'alert-danger'
    )

    occurrenceError.classList.add(
      'alert-success'
    )

    occurrenceError.textContent =
      message

    occurrenceError.classList.remove(
      'd-none'
    )

    setTimeout(
      () => {

        occurrenceError.classList.add(
          'd-none'
        )

        occurrenceError.classList.remove(
          'alert-success'
        )

        occurrenceError.classList.add(
          'alert-danger'
        )

      },
      4000
    )
  }
}

async function loadEvents() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'events'
      )
      .select(`
        event_id,
        event_name,
        event_category_master(
          category_name
        ),
        event_type_master(
          event_type_name
        )
      `)
      .order(
        'event_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  events =
    data || []

  if (!eventId) {
    return
  }

  eventId.innerHTML =
    `
      <option value="">
        Select Event Name
      </option>
    `

  for (
    const event
    of events
  ) {

    eventId.innerHTML += `
      <option
        value="${event.event_id}"
      >
        ${event.event_name}
      </option>
    `
  }
}
async function loadSponsors() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'sponsor_master'
      )
      .select('*')
      .order(
        'sponsor_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  sponsors =
    data || []

  if (!sponsorId) {
    return
  }

  sponsorId.innerHTML =
    `
      <option value="">
        Select Sponsor
      </option>
    `

  for (
    const sponsor
    of sponsors
  ) {

    sponsorId.innerHTML += `
      <option
        value="${sponsor.sponsor_id}"
      >
        ${sponsor.sponsor_name}
      </option>
    `
  }
}
async function loadCountries() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'country_master'
      )
      .select('*')
      .order(
        'country_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  countries =
    data || []

  if (!countryId) {
    return
  }

  countryId.innerHTML =
    `
      <option value="">
        Select Country
      </option>
    `

  for (
    const country
    of countries
  ) {

    countryId.innerHTML += `
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
    await window
      .supabaseClient
      .from(
        'county_master'
      )
      .select('*')
      .order(
        'county_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  counties =
    data || []
}

async function loadAllSubcounties() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'subcounty_master'
      )
      .select('*')
      .order(
        'subcounty_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  subcounties =
    data || []
}
async function loadStatuses() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
  'event_status_master'
)
.select(`
  event_status_id,
  status_name,
  status_code
`)
.order(
  'status_name'
)
      .order(
        'status_name'
      )

  if (error) {

    console.error(error)

    return
  }

  occurrenceStatusId.innerHTML =
    `
      <option value="">
        Select Event Status
      </option>
    `

  data.forEach(
    status => {

      occurrenceStatusId
        .innerHTML += `
          <option
  value="${status.event_status_id}"
  data-code="${status.status_code}"
>
            ${status.status_name}
          </option>
        `
    }
  )
}







async function initializeEvents() {

  try {

    if (
      !window.supabaseClient
    ) {

      console.error(
        'Supabase client not found'
      )

      return
    }

    await loadEvents()

    await loadSponsors()

    await loadCountries()

    await loadCounties()

    await loadAllSubcounties()

    await loadStatuses()

await loadOccurrences()

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
  initializeEvents
)

async function loadCountyOptions(
  countryIdValue
) {

  if (!countyId) {
    return
  }

  countyId.innerHTML =
    `
      <option value="">
        Select County
      </option>
    `

  if (!countryIdValue) {
    return
  }

  const filtered =
    counties.filter(
      county =>
        county.country_id ===
        countryIdValue
    )

  filtered.forEach(
    county => {

      countyId.innerHTML += `
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
  countyIdValue
) {

  if (!subcountyId) {
    return
  }

  subcountyId.innerHTML =
    `
      <option value="">
        Select Subcounty
      </option>
    `

  const filtered =
    subcounties.filter(
      s =>
        s.county_id ===
        countyIdValue
    )

  for (
    const subcounty
    of filtered
  ) {

    subcountyId.innerHTML += `
      <option
        value="${subcounty.subcounty_id}"
      >
        ${subcounty.subcounty_name}
      </option>
    `
  }
}
async function loadTowns(
  subcountyIdValue
) {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'town_master'
      )
      .select('*')
      .eq(
        'subcounty_id',
        subcountyIdValue
      )
      .order(
        'town_name'
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  towns =
    data || []

  if (
    !townSuggestions
  ) {
    return
  }

  townSuggestions.innerHTML =
    ''

  for (
    const town
    of towns
  ) {

    townSuggestions.innerHTML += `
      <option
        value="${town.town_name}">
      </option>
    `
  }
}


function handleEventSelection() {

  const selected =
    events.find(
      event =>
        event.event_id ===
        eventId.value
    )

  if (!selected) {

    setValue(
      'eventCategory',
      ''
    )

    setValue(
      'eventType',
      ''
    )

    return
  }

  setValue(
    'eventCategory',
    selected
      .event_category_master
      ?.category_name || ''
  )

  setValue(
    'eventType',
    selected
      .event_type_master
      ?.event_type_name || ''
  )

  generateEventArea()
}
function generateEventArea() {

  const town =
    getValue(
      'townName'
    )
      .trim()

  const type =
    getValue(
      'eventType'
    )
      .trim()

  if (
    !town ||
    !type
  ) {

    setValue(
      'eventArea',
      ''
    )

    return
  }

  setValue(
    'eventArea',
    `${town} ${type}`
  )
}

async function buildOccurrencePayload() {

  const townId =
    await getOrCreateTown()

  return {

    event_id:
      getValue(
        'eventId'
      ),

    sponsor_id:
      getValue(
        'sponsorId'
      ) || null,

    country_id:
      getValue(
        'countryId'
      ),

    county_id:
      getValue(
        'countyId'
      ),

    subcounty_id:
      getValue(
        'subcountyId'
      ),

    town_id:
      townId,

    organizer:
      getValue(
        'organizer'
      ),

    event_area:
      getValue(
        'eventArea'
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
      ),

    end_time:
      getValue(
        'endTime'
      ),

    
  }
}

async function getOrCreateTown() {

  const town =
    getValue(
      'townName'
    ).trim()

  if (!town) {

    throw new Error(
      'Town is required'
    )
  }

  const existing =
    await window
      .supabaseClient
      .from(
        'town_master'
      )
      .select(`
        town_id,
        town_name
      `)
      .eq(
        'subcounty_id',
        getValue(
          'subcountyId'
        )
      )
      .ilike(
        'town_name',
        town
      )
      .maybeSingle()

  if (
    existing.data
  ) {

    return existing.data.town_id
  }

  const inserted =
    await window
      .supabaseClient
      .from(
        'town_master'
      )
      .insert({

        town_name:
          town,

        subcounty_id:
          getValue(
            'subcountyId'
          )
      })
      .select()
      .single()

  if (
    inserted.error
  ) {

    throw inserted.error
  }

  return inserted
    .data
    .town_id
}


function validateOccurrence() {

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
      'Subcounty is required'
    )

    return false
  }

  if (
    !getValue(
      'townName'
    )
  ) {

    showError(
      'Town is required'
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

const isEditMode =
  !!getValue(
    'eventInstanceId'
  )

if (
  isEditMode &&
  !getValue(
    'occurrenceStatusId'
  )
) {

  showError(
    'Event Status is required'
  )

  return false
}
  clearError()

  return true
}

async function saveSame() {

  if (
    btnSaveOccurrence.disabled
  ) {

    return
  }

  btnSaveOccurrence.disabled =
    true

  try {

    if (
      !validateOccurrence()
    ) {

      btnSaveOccurrence.disabled =
        false

      return
    }

    const payload =
      await buildOccurrencePayload()

  const currentStatusCode =
  document
    .querySelector(
      '#occurrenceStatusId option:checked'
    )
    ?.dataset
    ?.code

if (
  currentStatusCode !==
    'CANCELLED' &&
  currentStatusCode !==
    'RESCHEDULED'
) {

  payload.event_status_id =
    getCalculatedStatusId(
      payload
    )

if (
  !payload.event_status_id
) {

  throw new Error(
    'Unable to determine event status.'
  )

}

}


    const eventInstanceId =
      getValue(
        'eventInstanceId'
      )

    if (
      !eventInstanceId
    ) {

      showError(
        'No Event Occurrence selected'
      )

      btnSaveOccurrence.disabled =
        false

      return
    }

    const {
      error
    } =
      await window
        .supabaseClient
        .from(
          'event_instances'
        )
        .update(
          payload
        )
        .eq(
          'event_instance_id',
          eventInstanceId
        )

    if (error) {

      throw error
    }

    

    await loadOccurrences()

    showSuccess(
      'Event Occurrence Updated'
    )

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

    btnSaveOccurrence.disabled =
      false
  }
}

function getCalculatedStatusId(
  payload
) {

  const now =
    new Date()

  const startDateTime =
    new Date(
      `${payload.start_date}T${payload.start_time || '00:00'}`
    )

  const endDateTime =
    new Date(
      `${payload.end_date}T${payload.end_time || '23:59'}`
    )

  let statusCode =
    'PLANNED'

  if (
    now >= endDateTime
  ) {

    statusCode =
      'COMPLETED'

  } else if (
    now >= startDateTime
  ) {

    statusCode =
      'ONGOING'

  } else {

    const today =
      now
        .toISOString()
        .split('T')[0]

    if (
      payload.start_date ===
      today
    ) {

      statusCode =
        'OPEN'

    }

  }

  return document.querySelector(
    `#occurrenceStatusId option[data-code="${statusCode}"]`
  )?.value || null

}

async function saveNew() {

  if (
    btnSaveOccurrenceAsNew.disabled
  ) {

    return

  }

  btnSaveOccurrenceAsNew.disabled =
    true

  try {

    if (
      !validateOccurrence()
    ) {

      btnSaveOccurrenceAsNew.disabled =
        false

      return

    }

    const payload =
      await buildOccurrencePayload()

    payload.event_status_id =
  getCalculatedStatusId(
    payload
  )

    

    const existing =
  await window
    .supabaseClient
    .from(
      'event_instances'
    )
    .select(
      'event_instance_id'
    )
    .eq(
      'event_id',
      payload.event_id
    )
    .eq(
      'event_area',
      payload.event_area
    )
    .eq(
      'start_date',
      payload.start_date
    )
    .eq(
      'start_time',
      payload.start_time
    )
    .maybeSingle()

if (
  existing.data
) {

  showError(
    'An occurrence already exists for the same Event, Area, Date and Start Time.'
  )

  btnSaveOccurrenceAsNew.disabled =
    false

  return

}

const {
  data,
  error
} =
  await window
    .supabaseClient
    .from(
      'event_instances'
    )
    .insert(
      payload
    )
    .select()
    .single()
    if (
      error
    ) {

      throw error

    }

    await loadOccurrences()

    setValue(
      'eventInstanceId',
      ''
    )

    showSuccess(
      'Event Occurrence Created'
    )

    clearOccurrenceForm()

    const modal =
      coreui.Modal.getInstance(
        document.getElementById(
          'occurrenceModal'
        )
      )

    modal?.hide()

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

    btnSaveOccurrenceAsNew.disabled =
      false

  }

}


async function checkDependencies(
  occurrenceId
) {

  const {
    count,
    error
  } =
    await window
      .supabaseClient
      .from(
        'participant_instances'
      )
      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      )
      .eq(
        'event_instance_id',
        occurrenceId
      )

  if (error) {

    throw error
  }

  return {
    participantCount:
      count || 0
  }
}

async function deleteOccurrence(
  occurrenceId
) {

  const dependencyInfo =
    await checkDependencies(
      occurrenceId
    )

  const confirmed =
    pendingOccurrenceDeleteId =
  occurrenceId

document.getElementById(
  'deleteOccurrenceMessage'
).textContent =
  `This occurrence contains ${dependencyInfo.participantCount} participant registration(s).`

new coreui.Modal(
  document.getElementById(
    'deleteOccurrenceModal'
  )
).show()

return

  try {

    const {
      error
    } =
      await window
        .supabaseClient
        .from(
          'event_instances'
        )
        .delete()
        .eq(
          'event_instance_id',
          occurrenceId
        )

    if (error) {

      throw error
    }

    eventOccurrences =
      eventOccurrences.filter(
        item =>
          item.event_instance_id !==
          occurrenceId
      )

    filteredOccurrences =
      [...eventOccurrences]

    renderOccurrences()

    showSuccess(
  'Event Occurrence Deleted'
)

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

async function loadOccurrences() {

  const {
    data,
    error
  } =
    await window
      .supabaseClient
      .from(
        'event_instances'
      )
      .select(`
        *,
        events(
          event_id,
          event_name
        ),
        sponsor_master(
          sponsor_name
        ),
        event_status_master(
          status_name
        ),
        participant_instances(
          participant_instance_id
        )
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      )

  if (error) {

    console.error(
      error
    )

    return
  }

  eventOccurrences =
    data || []

  filteredOccurrences =
    [...eventOccurrences]

  renderOccurrences()
}





function renderOccurrences() {

  if (
    !occurrenceTableBody
  ) {

    return
  }

  occurrenceTableBody.innerHTML =
    ''

  const start =
    (
      currentPage - 1
    ) * PAGE_SIZE

  const end =
    start + PAGE_SIZE

  const pageData =
    filteredOccurrences.slice(
      start,
      end
    )

  pageData.forEach(
    occurrence => {

      const participantCount =
        occurrence
          .participant_instances
          ?.length || 0

 const eventMaster =
  events.find(
    event =>
      event.event_id ===
      occurrence.event_id
  )

const eventTypeName =
  eventMaster
    ?.event_type_master
    ?.event_type_name || ''
      occurrenceTableBody.innerHTML += `

        <tr>

          <td>
            ${
              occurrence.events
                ?.event_name || ''
            }
          </td>

          <td>
  ${eventTypeName}
</td>

          <td>
            ${
              occurrence.event_area || ''
            }
          </td>

          <td>
            ${
              occurrence.organizer || ''
            }
          </td>

          <td>
            ${
              occurrence.sponsor_master
                ?.sponsor_name || ''
            }
          </td>

          <td>
            ${
              occurrence.start_date || ''
            }
          </td>

          <td>
            ${
              occurrence.end_date || ''
            }
          </td>

          <td>
            ${
              occurrence.start_time || ''
            }
          </td>

          <td>
            ${
              occurrence.end_time || ''
            }
          </td>

          <td>
            ${participantCount}
          </td>

         <td>

  ${(() => {

    const status =
      occurrence
        .event_status_master
        ?.status_name
        ?.toUpperCase() || ''

    let badgeClass =
      'bg-secondary'

    if (
      status.includes(
        'CANCEL'
      )
    ) {

      badgeClass =
        'bg-danger'

    } else if (
      status.includes(
        'OPEN'
      )
    ) {

      badgeClass =
        'bg-success'

    } else if (
      status.includes(
        'ONGOING'
      )
    ) {

      badgeClass =
        'bg-success'

    } else if (
      status.includes(
        'COMPLETED'
      )
    ) {

      badgeClass =
        'bg-warning text-dark'

    } else if (
      status.includes(
        'PLANNED'
      )
    ) {

      badgeClass =
        'bg-primary'

    } else if (
      status.includes(
        'RESCHEDULE'
      )
    ) {

      badgeClass =
        'bg-warning text-dark'

    }

    return `
      <span
        class="badge ${badgeClass}"
      >
        ${occurrence
          .event_status_master
          ?.status_name || ''}
      </span>
    `

  })()}

</td>

          <td class="text-nowrap">

            <button
  class="btn btn-sm btn-primary me-1"
  onclick="editOccurrence('${occurrence.event_instance_id}')"
>

  Edit

</button>

<button
  class="btn btn-sm btn-danger"
  onclick="deleteOccurrence('${occurrence.event_instance_id}')"
>

  Delete

</button>

          </td>

        </tr>
      `
    }
  )

  if (
    paginationInfo
  ) {

    paginationInfo.textContent =
      `${filteredOccurrences.length} record(s)`
  }

  renderPagination()
}


function renderPagination() {

  const container =
    document.getElementById(
      'paginationContainer'
    )

  if (
    !container
  ) {

    return
  }

  container.innerHTML =
    ''

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOccurrences.length /
        PAGE_SIZE
      )
    )

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
          href="#"
          class="page-link"
          onclick="goToPage(${i})"
        >

          ${i}

        </a>

      </li>
    `
  }
}

window.goToPage =
function (
  page
) {

  currentPage =
    page

  renderOccurrences()
}


function searchOccurrences() {

  const term =
    (
      searchOccurrence
        ?.value || ''
    )
      .toLowerCase()

  filteredOccurrences =
    eventOccurrences.filter(
      occurrence =>

        (
          occurrence.events
            ?.event_name || ''
        )
          .toLowerCase()
          .includes(
            term
          ) ||

        (
          occurrence.event_area || ''
        )
          .toLowerCase()
          .includes(
            term
          ) ||

        (
          occurrence.organizer || ''
        )
          .toLowerCase()
          .includes(
            term
          )
    )

  currentPage = 1

  renderOccurrences()
}


window.editOccurrence =
async function (
  occurrenceId
) {


  const occurrence =
    eventOccurrences.find(
      item =>
        item.event_instance_id ===
        occurrenceId
    )

  if (!occurrence) {

    return
  }

  setValue(
    'eventInstanceId',
    occurrence.event_instance_id
  )
 btnSaveOccurrence
  ?.classList
  .remove(
    'd-none'
  )

btnSaveOccurrenceAsNew
  ?.classList
  .remove(
    'd-none'
  )

document
  .getElementById(
    'occurrenceStatusCard'
  )
  ?.classList
  .remove(
    'd-none'
  )

  setValue(
    'eventId',
    occurrence.event_id
  )

  await Promise.resolve(
  handleEventSelection()
)

  setValue(
    'sponsorId',
    occurrence.sponsor_id
  )

  setValue(
    'countryId',
    occurrence.country_id
  )

  await loadCountyOptions(
    occurrence.country_id
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

const town =
  towns.find(
    item =>
      item.town_id ===
      occurrence.town_id
  )

setValue(
  'townName',
  town?.town_name || ''
)

generateEventArea()

setValue(
  'organizer',
  occurrence.organizer
)

  setValue(
    'organizer',
    occurrence.organizer
  )

  setValue(
    'eventArea',
    occurrence.event_area
  )

  setValue(
    'startDate',
    occurrence.start_date
  )

  setValue(
    'endDate',
    occurrence.end_date
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
    'occurrenceStatusId',
    occurrence.event_status_id
  )
 
  const modal =
    new coreui.Modal(
      document.getElementById(
        'occurrenceModal'
      )
    )

  modal.show()
}
window.deleteOccurrence =
  deleteOccurrence


function clearOccurrenceForm() {

  setValue(
    'eventInstanceId',
    ''
  )

  setValue(
    'eventId',
    ''
  )

  setValue(
    'eventCategory',
    ''
  )

  setValue(
    'eventType',
    ''
  )

  setValue(
    'sponsorId',
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
    'townName',
    ''
  )

  setValue(
    'eventArea',
    ''
  )

  setValue(
    'organizer',
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
    'occurrenceStatusId',
    ''
  )

  

  clearError()
}

document
  .getElementById(
    'occurrenceStatusCard'
  )
  ?.classList
  .add(
    'd-none'
  )


// =====================================================
// PHASE 2 EVENT LISTENERS
// =====================================================

if (eventId) {

  eventId.addEventListener(
    'change',
    handleEventSelection
  )
}

if (countryId) {

  countryId.addEventListener(
    'change',
    async () => {

      await loadCountyOptions(
        countryId.value
      )

      countyId.value = ''

      subcountyId.innerHTML =
        `
          <option value="">
            Select Subcounty
          </option>
        `

      if (townSuggestions) {
        townSuggestions.innerHTML = ''
      }

      setValue(
        'townName',
        ''
      )

      setValue(
        'eventArea',
        ''
      )
    }
  )
}

if (countyId) {

  countyId.addEventListener(
    'change',
    async () => {

      await loadSubcounties(
        countyId.value
      )

      if (townSuggestions) {
        townSuggestions.innerHTML = ''
      }

      setValue(
        'townName',
        ''
      )

      setValue(
        'eventArea',
        ''
      )
    }
  )
}

if (subcountyId) {

  subcountyId.addEventListener(
    'change',
    async () => {

      await loadTowns(
        subcountyId.value
      )


      setValue(
        'townName',
        ''
      )

      setValue(
        'eventArea',
        ''
      )
    }
  )
}

if (townName) {

  townName.addEventListener(
    'input',
    generateEventArea
  )
}




if (
  btnSaveOccurrence
) {

  btnSaveOccurrence
    .addEventListener(
      'click',
      saveSame
    )
}

if (
  btnSaveOccurrenceAsNew
) {

  btnSaveOccurrenceAsNew
    .addEventListener(
      'click',
      saveNew
    )
}

if (
  searchOccurrence
) {

  searchOccurrence
    .addEventListener(
      'input',
      searchOccurrences
    )
}

if (
  btnNewOccurrence
) {

  btnNewOccurrence
    .addEventListener(
      'click',
      () => {

        clearOccurrenceForm()
        btnSaveOccurrence
  ?.classList
  .add(
    'd-none'
  )

btnSaveOccurrenceAsNew
  ?.classList
  .remove(
    'd-none'
  )

        const modal =
          new coreui.Modal(
            document.getElementById(
              'occurrenceModal'
            )
          )

        modal.show()
      }
    )
}

document
  .getElementById(
    'btnConfirmDeleteOccurrence'
  )
  ?.addEventListener(
    'click',
    async () => {

      if (
        !pendingOccurrenceDeleteId
      ) {

        return

      }

      try {

        const {
          error
        } =
          await window
            .supabaseClient
            .from(
              'event_instances'
            )
            .delete()
            .eq(
              'event_instance_id',
              pendingOccurrenceDeleteId
            )

        if (
          error
        ) {

          throw error

        }

        await loadOccurrences()

        showSuccess(
          'Event Occurrence Deleted'
        )

      } catch (
        error
      ) {

        showError(
          error.message
        )

      }

      pendingOccurrenceDeleteId =
        null

      coreui.Modal
        .getInstance(
          document.getElementById(
            'deleteOccurrenceModal'
          )
        )
        ?.hide()

    }
  )
