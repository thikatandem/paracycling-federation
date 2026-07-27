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

// =====================================================
// EVENTS MODULE
// ParaCycling Federation Management System
// =====================================================

/* eslint camelcase: 0 */
import {
  createFeedbackController } from '../services/feedbackService.js'
import { getInputValue as getValue,
  setFalsyEmptyValue as setValue } from '../services/domService.js'
import { PAGE_SIZE,
  INFO_TIMEOUT
} from '../services/constants.js'
import { getDb,
  hasDb } from '../supabase/getDb.js'
import { importEvents } from './eventImport.js'
import { createModal,
  showModal,
  hideModal
} from '../services/modalService.js'
const occurrenceFeedback =
  createFeedbackController({
    containerId: 'occurrenceError',
    errorOptions: {
      sticky: true
    },
    successOptions: {
      timeout: INFO_TIMEOUT
    }
  })

const showError =
  occurrenceFeedback.error
    .bind(occurrenceFeedback)

const showSuccess =
  occurrenceFeedback.success
    .bind(occurrenceFeedback)

const clearError =
  occurrenceFeedback.clear
    .bind(occurrenceFeedback)

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
const btnImportEvents =
  document.getElementById(
    'btnImportEvents'
  )

const btnDownloadEventTemplate =
  document.getElementById(
    'btnDownloadEventTemplate'
  )

const eventImportFile =
  document.getElementById(
    'eventImportFile'
  )

const btnApproveImport =
  document.getElementById(
    'btnApproveImport'
  )

let pendingImport =
  null
let latestImportResult =
  null

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






async function loadEvents() {
  const {
    data,
    error
  } =
    await getDb()
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
    await getDb()
      .from(
        'sponsor_master'
      )
      .select('*')
      .order(
        'sponsor_name'
      )

  if (error) {

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
    await getDb()
      .from(
        'country_master'
      )
      .select('*')
      .order(
        'country_name'
      )

  if (error) {

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
    await getDb()
      .from(
        'county_master'
      )
      .select('*')
      .order(
        'county_name'
      )

  if (error) {

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
    await getDb()
      .from(
        'subcounty_master'
      )
      .select('*')
      .order(
        'subcounty_name'
      )

  if (error) {

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
    await getDb()
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

    return
  }

  occurrenceStatusId.innerHTML =
    `
      <option value="">
        Select Event Status
      </option>
    `

  for (const status of data) {
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
}

async function initializeEvents() {
  try {
    if (
      !hasDb()
    ) {

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

  for (const county of filtered) {
    countyId.innerHTML += `
        <option
          value="${county.county_id}"
        >
          ${county.county_name}
        </option>
      `
  }
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
    await getDb()
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

    notes:
      getValue(
        'notes'
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
      )

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
    await getDb()
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
    await getDb()
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
  Boolean(getValue(
    'eventInstanceId'
  ))

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
      await getDb()
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
  await getDb()
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
  await getDb()
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

    hideModal(
      'occurrenceModal'
    )
  } catch (
    error
  ) {

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
    await getDb()
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

  pendingOccurrenceDeleteId =
    occurrenceId

  document.getElementById(
    'deleteOccurrenceMessage'
  ).textContent =
    `This occurrence contains ${dependencyInfo.participantCount} participant registration(s).`

  showModal('deleteOccurrenceModal')
}

async function loadOccurrences() {
  const {
    data,
    error
  } =
    await getDb()
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

  for (const occurrence of pageData) {
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

         ${buildStatusCell(
    getEventStatusBadge(
      occurrence
        .event_status_master
        ?.status_name || ''
    )
  )}

          ${buildActionCell(
    buildActionButtons({
      buttons: [
        {
          type: 'edit',
          onClick:
            `editOccurrence('${occurrence.event_instance_id}')`
        },
        {
          type: 'delete',
          onClick:
            `deleteOccurrence('${occurrence.event_instance_id}')`
        }
      ]
    })
  )}

          </td>

        </tr>
      `
  }

  if (
    paginationInfo
  ) {
    paginationInfo.textContent =
      `${filteredOccurrences.length} record(s)`
  }

  renderPagination()
}

const renderPagination =
  createNumberedPaginationRenderer({
    getItemCount: () =>
      filteredOccurrences.length,
    getCurrentPage: () =>
      currentPage,
    pageSize:
      PAGE_SIZE,
    containerId:
      'paginationContainer',
    handlerName:
      'goToPage',
    control:
      'link'
  })


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
    'notes',
    occurrence.notes
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
    createModal('occurrenceModal')

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
    'notes',
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
async function startEventImport(
  file
) {

  try {

    pendingImport =
      await importEvents(
        file
      )

    const preview =
      pendingImport.preview

    document.getElementById(
      'importTotalRows'
    ).textContent =
      preview.totals.totalRows

    document.getElementById(
      'importValidRows'
    ).textContent =
      preview.totals.successfulRows

    document.getElementById(
      'importWarningRows'
    ).textContent =
      preview.totals.warningRows

    document.getElementById(
      'importErrorRows'
    ).textContent =
      preview.totals.errorRows

    renderPreviewTable(
      preview
    )

    renderPreviewErrors(
      preview
    )

    renderPreviewWarnings(
      preview
    )
if (

    btnApproveImport

) {

    btnApproveImport.disabled = false

    btnApproveImport.classList.remove(

        'd-none'

    )

}
    showModal('eventImportPreviewModal')

    eventImportFile.value =
      ''

  }

  catch (

    error

  ) {


    showError(

      error.message

    )

  }

}

function renderPreviewTable(
  preview
) {

  const header =
    document.getElementById(
      'previewHeader'
    )

  const body =
    document.getElementById(
      'previewBody'
    )

  if (
    !header ||
    !body
  ) {
    return
  }

  header.innerHTML = ''

  body.innerHTML = ''

  if (
    !preview.rows?.length
  ) {
    return
  }

 const columns =
    preview.headers

  header.innerHTML = `
    <tr>
      ${
        columns
          .map(
            column =>
              `<th>${column}</th>`
          )
          .join('')
      }
    </tr>
  `

  for (

    const row

    of preview.rows

) {

    body.innerHTML += `

        <tr>

            ${

                row

                    .map(

                        value =>

                            `<td>${

                                value ?? ''

                            }</td>`

                    )

                    .join('')

            }

        </tr>

    `

}

}


function renderPreviewErrors(
  preview
) {

  const container =
    document.getElementById(
      'importErrors'
    )

  if (
    !container
  ) {
    return
  }

  container.innerHTML = ''

  if (
    !preview.errors?.length
  ) {

    container.innerHTML =
      `
        <div
          class="alert alert-success"
        >
          No validation errors.
        </div>
      `

    return

  }

  for (
    const error
    of preview.errors
  ) {

    container.innerHTML += `
      <div
        class="alert alert-danger mb-2"
      >
        ${error.message}
      </div>
    `

  }

}

function renderPreviewWarnings(
  preview
) {

  const container =
    document.getElementById(
      'importWarnings'
    )

  if (
    !container
  ) {
    return
  }

  container.innerHTML = ''

  if (
    !preview.warnings?.length
  ) {

    container.innerHTML =
      `
        <div
          class="alert alert-success"
        >
          No warnings.
        </div>
      `

    return

  }

  for (
    const warning
    of preview.warnings
  ) {

    container.innerHTML += `
      <div
        class="alert alert-warning mb-2"
      >
        ${warning.message}
      </div>
    `

  }

}

function renderImportSummary(
  result
) {

  latestImportResult =
    result

  const summary =
    document.getElementById(
      'importSummary'
    )

  if (
    !summary
  ) {

    return

  }

  const importSummary =

    result.summary || {}

  summary.innerHTML = `

    <div class="row g-3">

      <div class="col-md-3">

        <div class="card text-bg-primary">

          <div class="card-body text-center">

            <h6>Total Rows</h6>

            <h3>

              ${importSummary.totalRows || 0}

            </h3>

          </div>

        </div>

      </div>

      <div class="col-md-3">

        <div class="card text-bg-success">

          <div class="card-body text-center">

            <h6>Imported</h6>

            <h3>

              ${importSummary.importedRows || 0}

            </h3>

          </div>

        </div>

      </div>

      <div class="col-md-3">

        <div class="card text-bg-warning">

          <div class="card-body text-center">

            <h6>Warnings</h6>

            <h3>

              ${importSummary.totalWarnings || 0}

            </h3>

          </div>

        </div>

      </div>

      <div class="col-md-3">

        <div class="card text-bg-danger">

          <div class="card-body text-center">

            <h6>Errors</h6>

            <h3>

              ${importSummary.totalErrors || 0}

            </h3>

          </div>

        </div>

      </div>

    </div>

    <hr>

    <div class="row">

      <div class="col-md-6">

        <table class="table table-sm">

          <tbody>

            <tr>

              <th>Module</th>

              <td>

                ${importSummary.module || 'Events'}

              </td>

            </tr>

            <tr>

              <th>Source</th>

              <td>

                ${importSummary.source || '-'}

              </td>

            </tr>

          </tbody>

        </table>

      </div>

      <div class="col-md-6">

        <table class="table table-sm">

          <tbody>

            <tr>

              <th>Started</th>

              <td>

                ${importSummary.startedAt || '-'}

              </td>

            </tr>

            <tr>

              <th>Completed</th>

              <td>

                ${importSummary.completedAt || '-'}

              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>

  `

  showModal('eventImportSummaryModal')

}
// =====================================================
// DOWNLOAD EVENT TEMPLATE
// =====================================================

function downloadEventTemplate() {

  const csv = [

    'event_code,subcounty_code,town_name,sponsor_code,organizer,start_date,start_time,end_date,end_time,notes',

    'EVT-000026,THIKA-TOWN-001,Kiganjo,SPN-000016,Kenya Cycling Federation,2026-08-10,06:00,2026-08-10,18:00,Regional Under 19 Trials'

  ].join('\n')

  const blob =

    new Blob(

      [

        csv

      ],

      {

        type:

          'text/csv;charset=utf-8;'

      }

    )

  const url =

    URL.createObjectURL(

      blob

    )

  const link =

    document.createElement(

      'a'

    )

  link.href =

    url

  link.download =

    'Event_Import_Template.csv'

  document.body.appendChild(

    link

  )

  link.click()

  document.body.removeChild(

    link

  )

  URL.revokeObjectURL(

    url

  )

}

// =====================================================
// PHASE 2 EVENT LISTENERS
// =====================================================

if (

  btnDownloadEventTemplate

) {

  btnDownloadEventTemplate
    .addEventListener(

      'click',

      downloadEventTemplate

    )

}

if (

  btnImportEvents

) {

  btnImportEvents
    .addEventListener(

      'click',

      () => {

        eventImportFile.click()

      }

    )

}

if (

  eventImportFile

) {

  eventImportFile
    .addEventListener(

      'change',

      async e => {

        const file =
          e.target.files[0]

        if (

          !file

        ) {

          return

        }

        await startEventImport(

          file

        )

      }

    )

}

if (

  btnApproveImport

) {

 btnApproveImport.addEventListener(
    'click',
    async () => {

        try {

            btnApproveImport.disabled = true






            const result =
                await pendingImport.approve()

            hideModal(
      'eventImportPreviewModal'
    )

            renderImportSummary(result)

            await loadOccurrences()

            pendingImport = null

        }

        catch (error) {






}

        finally {

            btnApproveImport.disabled = false

        }

    }
)

}

if (

  eventId

) {

  eventId
    .addEventListener(

      'change',

      handleEventSelection

    )

}

if (

  countryId

) {

  countryId
    .addEventListener(

      'change',

      async () => {

        await loadCountyOptions(

          countryId.value

        )

        countyId.value =
          ''

        subcountyId.innerHTML =
          `
            <option value="">
              Select Subcounty
            </option>
          `

        if (

          townSuggestions

        ) {

          townSuggestions.innerHTML =
            ''

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

if (

  countyId

) {

  countyId
    .addEventListener(

      'change',

      async () => {

        await loadSubcounties(

          countyId.value

        )

        if (

          townSuggestions

        ) {

          townSuggestions.innerHTML =
            ''

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

if (

  subcountyId

) {

  subcountyId
    .addEventListener(

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

if (

  townName

) {

  townName
    .addEventListener(

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

          createModal('occurrenceModal')

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

          await getDb()
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

      hideModal(
      'deleteOccurrenceModal'
    )

    }

  )
document
  .getElementById(
    'btnDownloadCsv'
  )
  ?.addEventListener(

    'click',

    () => {

      const file =

        latestImportResult
          ?.downloads
          ?.csv

      if (

        !file

      ) {

        return

      }

      window.open(

        file,

        '_blank'

      )

    }

  )

document
  .getElementById(
    'btnDownloadExcel'
  )
  ?.addEventListener(

    'click',

    () => {

      const file =

        latestImportResult
          ?.downloads
          ?.excel

      if (

        !file

      ) {

        return

      }

      window.open(

        file,

        '_blank'

      )

    }

  )

document
  .getElementById(
    'btnDownloadPdf'
  )
  ?.addEventListener(

    'click',

    () => {

      const file =

        latestImportResult
          ?.downloads
          ?.pdf

      if (

        !file

      ) {

        return

      }

      window.open(

        file,

        '_blank'

      )

    }

  )
