// =====================================================
// ATHLETES MODULE
// ParaCycling Federation Management System
// =====================================================
/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */
const PAGE_SIZE = 10

let athletes = []
let filteredAthletes = []
let currentPage = 1

let counties = []
let classifications = []
let subcounties = []
let towns = []
const athleteLoading =
  document.getElementById('athleteLoading')

const athleteFormError =
  document.getElementById('athleteFormError')

const athletesTableBody =
  document.getElementById('athletesTableBody')

const searchAthlete =
  document.getElementById('searchAthlete')

const paginationInfo =
  document.getElementById('paginationInfo')

function showLoading() {
  athleteLoading?.classList.remove('d-none')
}

function hideLoading() {
  athleteLoading?.classList.add('d-none')
}

function showError(message) {
  if (athleteFormError) {
    athleteFormError.textContent = message
  }
}

function clearError() {
  if (athleteFormError) {
    athleteFormError.textContent = ''
  }
}

function getValue(id) {
  return document.getElementById(id)?.value || ''
}

function setValue(id, value) {
  const element = document.getElementById(id)

  if (element) {
    element.value = value || ''
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'Active': {
      return '<span class="badge bg-success">Active</span>'
    }

    case 'Inactive': {
      return '<span class="badge bg-warning">Inactive</span>'
    }

    case 'Disabled': {
      return '<span class="badge bg-danger">Disabled</span>'
    }

    default: {
      return status || ''
    }
  }
}

// =====================================================
// LOOKUPS
// =====================================================

async function loadCounties() {
  const { data, error } =
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
    document.getElementById('countyId')

  if (!select) {
    return
  }

  select.innerHTML =
    '<option value="">Select County</option>'

  for (const county of counties) {
    select.innerHTML += `
      <option value="${county.county_id}">
        ${county.county_name}
      </option>
    `
  }
}

async function loadClassifications() {
  const { data, error } =
    await window.supabaseClient
      .from('classification_master')
      .select('*')
      .order('classification_code')

  if (error) {
    console.error(error)
    return
  }

  classifications = data || []

  const select =
    document.getElementById('classificationId')

  if (!select) {
    return
  }

  select.innerHTML =
    '<option value="">Select Classification</option>'

  for (const classification of classifications) {

  select.innerHTML += `
    <option
      value="${classification.classification_id}"
    >
      ${classification.classification_code}
      -
      ${classification.description}
    </option>
  `
}
}

// =====================================================
// LOAD ATHLETES
// =====================================================

async function loadAthletes() {
  try {
    showLoading()

    const { data, error } =
      await window.supabaseClient
        .from('athletes')
        .select(`
  *,
  county_master(
    county_name
  ),
  subcounty_master(
    subcounty_name
  ),
  town_master(
    town_name
  ),
  classification_master(
    classification_code
  )
`)
        .order(
          'created_at',
          { ascending: false }
        )

    if (error) {
      throw error
    }

    athletes = data || []

    filteredAthletes = [...athletes]

    renderAthletes()
  } catch (error) {
    console.error(error)

    alert(
      'Failed to load athletes'
    )
  } finally {
    hideLoading()
  }
}

async function loadSubcounties(
  countyId
) {

  const select =
    document.getElementById(
      'subcountyId'
    )

  if (!select) {
    return
  }

  select.innerHTML =
    '<option value="">Select Sub County</option>'

  const countySubcounties =
    subcounties.filter(
      s =>
        s.county_id ===
        countyId
    )

  for (
    const subcounty
    of countySubcounties
  ) {

    select.innerHTML += `
      <option
        value="${subcounty.subcounty_id}"
      >
        ${subcounty.subcounty_name}
      </option>
    `
  }
}

async function loadTowns(
  subcountyId
) {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'town_master'
      )
      .select('*')
      .eq(
        'subcounty_id',
        subcountyId
      )
      .order(
        'town_name'
      )

  if (error) {
    console.error(error)
    return
  }

  towns = data || []

  const datalist =
    document.getElementById(
      'townList'
    )

  if (!datalist) {
    return
  }

  datalist.innerHTML = ''

  for (
    const town
    of towns
  ) {

    datalist.innerHTML += `
      <option
        value="${town.town_name}"
      >
    `
  }
}


// =====================================================
// TABLE RENDERING
// =====================================================

function renderAthletes() {
  if (!athletesTableBody) {
    return
  }

  const start =
    (currentPage - 1) * PAGE_SIZE

  const end =
    start + PAGE_SIZE

  const pageRows =
    filteredAthletes.slice(start, end)

  athletesTableBody.innerHTML = ''

  if (pageRows.length === 0) {
    athletesTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="text-center">
          No athletes found
        </td>
      </tr>
    `

    updatePagination()

    return
  }

  for (const athlete of pageRows) {
    athletesTableBody.innerHTML += `
      <tr>

      

        <td>${athlete.first_name || ''}</td>

        <td>${athlete.last_name || ''}</td>

        <td>${athlete.gender || ''}</td>

        <td>${athlete.role || ''}</td>

        <td>
  ${athlete.county_master?.county_name || ''}
</td>

<td>
  ${
    athlete.subcounty_master
      ?.subcounty_name || ''
  }
</td>

<td>
  ${
    athlete.town_master
      ?.town_name || ''
  }
</td>

<td>
  ${athlete.phone || ''}
</td>

        <td>
          ${getStatusBadge(athlete.status)}
        </td>

        <td>

          <button
            class="btn btn-sm btn-warning me-1"
            onclick="editAthlete('${athlete.athlete_id}')"
          >
            Edit
          </button>

          <button
            class="btn btn-sm btn-danger"
            onclick="confirmDeleteAthlete('${athlete.athlete_id}')"
          >
            Delete
          </button>

        </td>

      </tr>
    `
  }

  updatePagination()
}

// =====================================================
// PAGINATION
// =====================================================

function updatePagination() {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredAthletes.length /
        PAGE_SIZE
      )
    )

  if (paginationInfo) {
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

  if (previousButton) {
    previousButton.disabled =
      currentPage <= 1
  }

  if (nextButton) {
    nextButton.disabled =
      currentPage >= totalPages
  }
}

// =====================================================
// SEARCH
// =====================================================

function searchAthletes() {
  const search =
    (
      searchAthlete?.value || ''
    )
      .trim()
      .toLowerCase()

  filteredAthletes = search ?
    athletes.filter(a => {
      return (

        (a.first_name || '')
            .toLowerCase()
            .includes(search) ||

          (a.last_name || '')
            .toLowerCase()
            .includes(search) ||

          (a.athlete_code || '')
            .toLowerCase()
            .includes(search) ||

          (a.phone || '')
            .toLowerCase()
            .includes(search) ||

          (a.email || '')
            .toLowerCase()
            .includes(search)
      )
    }) :
    [...athletes]

  currentPage = 1

  renderAthletes()
}

// =====================================================
// NEW ATHLETE
// =====================================================

function clearAthleteForm() {
  clearError()

  setValue('athleteId', '')
  setValue('athleteCode', '')

  setValue('firstName', '')
  setValue('lastName', '')
  setValue('dob', '')

  setValue('gender', '')
  setValue('role', '')

  setValue('classificationId', '')
setValue('countyId', '')
setValue('subcountyId', '')
setValue('townName', '')
const subcountySelect =
  document.getElementById(
    'subcountyId'
  )

if (subcountySelect) {

  subcountySelect.innerHTML =
    '<option value="">Select Sub County</option>'
}

const townList =
  document.getElementById(
    'townList'
  )

if (townList) {

  townList.innerHTML = ''
}

  setValue('passportNo', '')
  setValue('nationalId', '')

  setValue('phone', '')
  setValue('email', '')

  setValue(
    'emergencyContactName',
    ''
  )

  setValue(
    'emergencyContactPhone',
    ''
  )

  setValue(
    'registrationDate',
    ''
  )

  setValue(
    'status',
    'Active'
  )
}

function openNewAthleteModal() {
  clearAthleteForm()

  document.getElementById(
    'athleteModalTitle'
  ).textContent =
    'Add Athlete'

  const modal =
    new coreui.Modal(
      document.getElementById(
        'athleteModal'
      )
    )

  modal.show()
}

// =====================================================
// EDIT ATHLETE
// =====================================================

window.editAthlete =
async function (
  athleteId
) {
  const athlete =
    athletes.find(
      a =>
        a.athlete_id === athleteId
    )

  if (!athlete) {
    return
  }

  clearError()

  document.getElementById(
    'athleteModalTitle'
  ).textContent =
    'Edit Athlete'

  setValue(
    'athleteId',
    athlete.athlete_id
  )

  setValue(
    'athleteCode',
    athlete.athlete_code
  )

  setValue(
    'firstName',
    athlete.first_name
  )

  setValue(
    'lastName',
    athlete.last_name
  )

  setValue(
    'dob',
    athlete.dob
  )

  setValue(
    'gender',
    athlete.gender
  )

  setValue(
    'role',
    athlete.role
  )

  setValue(
    'classificationId',
    athlete.classification_id
  )

  setValue(
    'countyId',
    athlete.county_id
  )
  await loadSubcounties(
  athlete.county_id
)

setValue(
  'subcountyId',
  athlete.subcounty_id
)

await loadTowns(
  athlete.subcounty_id
)

setValue(
  'townName',
  athlete.town_master
    ?.town_name || ''
)
  setValue(
    'passportNo',
    athlete.passport_no
  )

  setValue(
    'nationalId',
    athlete.national_id
  )

  setValue(
    'phone',
    athlete.phone
  )

  setValue(
    'email',
    athlete.email
  )

  setValue(
    'emergencyContactName',
    athlete.emergency_contact_name
  )

  setValue(
    'emergencyContactPhone',
    athlete.emergency_contact_phone
  )

  setValue(
    'registrationDate',
    athlete.registration_date
  )

  setValue(
    'status',
    athlete.status
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'athleteModal'
      )
    )

  modal.show()
}
// =====================================================
// VALIDATION
// =====================================================

function validateAthlete() {
  clearError()

  if (!getValue('firstName').trim()) {
    showError('First Name is required')
    return false
  }

  if (!getValue('lastName').trim()) {
    showError('Last Name is required')
    return false
  }

  if (!getValue('dob')) {
    showError('Date Of Birth is required')
    return false
  }

  if (!getValue('gender')) {
    showError('Gender is required')
    return false
  }

  if (!getValue('role')) {
    showError('Role is required')
    return false
  }

  return true
}


async function loadAllSubcounties() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'subcounty_master'
      )
      .select('*')
      .order(
        'subcounty_name'
      )

  if (error) {
    throw error
  }

  subcounties =
    data || []
}


// =====================================================
// SAVE ATHLETE
// =====================================================

async function saveAthlete() {
  try {
    if (!validateAthlete()) {
      return
    }

    showLoading()

    const athleteId =
      getValue('athleteId')

  
   const townName =
  getValue(
    'townName'
  )
    .trim()

let townId = null

if (
  townName &&
  getValue(
    'subcountyId'
  )
) {

  const {
    data: existingTown
  } =
    await window.supabaseClient
      .from(
        'town_master'
      )
      .select(
        'town_id'
      )
      .eq(
        'subcounty_id',
        getValue(
          'subcountyId'
        )
      )
      .ilike(
        'town_name',
        townName
      )
      .maybeSingle()

  if (
    existingTown
  ) {

    townId =
      existingTown.town_id

  } else {

    const {
      data: newTown,
      error: townError
    } =
      await window.supabaseClient
        .from(
          'town_master'
        )
        .insert({

          subcounty_id:
            getValue(
              'subcountyId'
            ),

          town_name:
            townName

        })
        .select()
        .single()

    if (townError) {
      throw townError
    }

    townId =
      newTown.town_id
  }
}


    const payload = {

      first_name:
        getValue('firstName'),

      last_name:
        getValue('lastName'),

      dob:
        getValue('dob'),

      gender:
        getValue('gender'),

      role:
        getValue('role'),

      classification_id:
        getValue('classificationId') || null,

      county_id:
  getValue(
    'countyId'
  ) || null,

subcounty_id:
  getValue(
    'subcountyId'
  ) || null,

town_id:
  townId,

      passport_no:
        getValue('passportNo') || null,

      national_id:
        getValue('nationalId') || null,

      phone:
        getValue('phone') || null,

      email:
        getValue('email') || null,

      emergency_contact_name:
        getValue('emergencyContactName') || null,

      emergency_contact_phone:
        getValue('emergencyContactPhone') || null,

      status:
        getValue('status')
    }

    let error

    if (athleteId) {
      const result =
        await window.supabaseClient
          .from('athletes')
          .update(payload)
          .eq(
            'athlete_id',
            athleteId
          )

      error = result.error
    } else {
      const result =
        await window.supabaseClient
          .from('athletes')
          .insert(payload)

      error = result.error
    }

    if (error) {
      throw error
    }

    const modalElement =
      document.getElementById(
        'athleteModal'
      )

    const modal =
      coreui.Modal.getInstance(
        modalElement
      )

    if (modal) {
      modal.hide()
    }

    await loadAthletes()
  } catch (error) {
    console.error(error)

    showError(
      error.message ||
      'Failed to save athlete'
    )
  } finally {
    hideLoading()
  }
}

// =====================================================
// DELETE ATHLETE
// =====================================================

window.confirmDeleteAthlete =
function (athleteId) {
  setValue(
    'deleteAthleteId',
    athleteId
  )

  const modal =
    new coreui.Modal(
      document.getElementById(
        'deleteAthleteModal'
      )
    )

  modal.show()
}

async function deleteAthlete() {
  try {
    const athleteId =
      getValue('deleteAthleteId')

    if (!athleteId) {
      return
    }

    showLoading()

    const { error } =
      await window.supabaseClient
        .from('athletes')
        .delete()
        .eq(
          'athlete_id',
          athleteId
        )

    if (error) {
      throw error
    }

    const modalElement =
      document.getElementById(
        'deleteAthleteModal'
      )

    const modal =
      coreui.Modal.getInstance(
        modalElement
      )

    if (modal) {
      modal.hide()
    }

    await loadAthletes()
  } catch (error) {
    console.error(error)

    alert(
      error.message ||
      'Delete failed'
    )
  } finally {
    hideLoading()
  }
}

// =====================================================
// EVENT LISTENERS
// =====================================================

document
  .getElementById(
    'btnAddAthlete'
  )
  ?.addEventListener(
    'click',
    openNewAthleteModal
  )

document
  .getElementById(
    'btnSaveAthlete'
  )
  ?.addEventListener(
    'click',
    saveAthlete
  )

document
  .getElementById(
    'btnRefreshAthletes'
  )
  ?.addEventListener(
    'click',
    loadAthletes
  )

document
  .getElementById(
    'btnConfirmDeleteAthlete'
  )
  ?.addEventListener(
    'click',
    deleteAthlete
  )

document
  .getElementById(
    'btnPreviousPage'
  )
  ?.addEventListener(
    'click',
    () => {
      if (currentPage > 1) {
        currentPage--

        renderAthletes()
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
          filteredAthletes.length /
          PAGE_SIZE
        )

      if (
        currentPage <
        totalPages
      ) {
        currentPage++

        renderAthletes()
      }
    }
  )

searchAthlete
  ?.addEventListener(
    'input',
    searchAthletes
  )


document
  .getElementById(
    'countyId'
  )
  ?.addEventListener(
    'change',
    async event => {

      const countyId =
        event.target.value

      await loadSubcounties(
        countyId
      )

      setValue(
        'subcountyId',
        ''
      )

      setValue(
        'townName',
        ''
      )

      const townList =
        document.getElementById(
          'townList'
        )

      if (townList) {
        townList.innerHTML = ''
      }
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
    }
  )



// =====================================================
// INITIALIZE
// =====================================================

async function initializeAthletes() {
  try {
    if (
      !window.supabaseClient
    ) {
      console.error(
        'Supabase client not found'
      )

      return
    }

await loadCounties()

await loadAllSubcounties()

await loadClassifications()

await loadAthletes()
  } catch (error) {
    console.error(error)
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeAthletes
)
