// =====================================================
// ATHLETES MODULE
// ParaCycling Federation Management System
// =====================================================
/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */


import {
  getValue,
  setValue,
  populateSelect,
  resetForm
} from './core/domService.js'

import { showLoading, hideLoading } from './core/uiService.js'

import {
  renderEntityTable,
  buildActionButtons,
  buildActionCell,
  buildTextCell,
  buildStatusCell
} from './core/tableRendererService.js'

import {
  clearMessage,
  showSuccess,
  showError,
  getFederationFriendlyError
} from './core/errorService.js'

import { showModal, hideModal, openEntityModal } from './core/modalService.js'

import { getStatusBadge } from './core/badgeService.js'

import {

  loadAllSubcounties,
  loadCountySelect,
  loadSubcountySelect,
  loadTownDatalist,
  findOrCreateTown

} from './core/locationLookupService.js'

import { searchCollection } from './core/searchService.js'

import { validateRequiredFields } from './core/validationService.js'

import {
  createPaginator,
  updatePaginationUi,
  resetPagination,
  bindPagination
} from './core/paginationService.js'

import { loadClassificationLookup,getMembershipStatusId } from './core/lookupService.js'

import {
  populateAthleteForm,
  buildAthletePayload
} from './core/athleteFormService.js'

import { createPageState, setRows } from './core/pageStateService.js'



const paginator =
  createPaginator()

const state =
  createPageState()

const athletesTableBody =
  document.getElementById('athletesTableBody')

const searchAthlete =
  document.getElementById('searchAthlete')

const paginationInfo =
  document.getElementById('paginationInfo')





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
  ),
  membership_status_master(
  status_code,
  status_name
)
`)
        .order(
          'created_at',
          { ascending: false }
        )

    if (error) {
      throw error
    }

    setRows({

  state,

  rows:
    data || []

})

    renderAthletes()
  } catch (error) {
    console.error(error)

   showError(

  'athleteFormError',

  getFederationFriendlyError(
    error
  )

)
  } finally {
    hideLoading()
  }
}


function renderAthleteRow(
  athlete
) {

  const actionButtons =

    buildActionButtons({

     buttons: [

  {
    type: 'edit',
    onClick:
      `editAthlete('${athlete.athlete_id}')`
  },

  {
    type: 'delete',
    onClick:
      `confirmDeleteAthlete('${athlete.athlete_id}')`
  }

]

    })

  return `

    <tr>

      ${buildTextCell(
        athlete.first_name
      )}

      ${buildTextCell(
        athlete.last_name
      )}

      ${buildTextCell(
        athlete.gender
      )}

      ${buildTextCell(
        athlete.role
      )}

      ${buildTextCell(
        athlete.county_master?.county_name
      )}

      ${buildTextCell(
        athlete.subcounty_master?.subcounty_name
      )}

      ${buildTextCell(
        athlete.town_master?.town_name
      )}

      ${buildTextCell(
        athlete.phone
      )}

     ${buildStatusCell(
  getStatusBadge(
    athlete.membership_status_master?.status_name,
    athlete.membership_status_master?.status_code
  )
)}

      ${buildActionCell(
        actionButtons
      )}

    </tr>

  `

}


// =====================================================
// TABLE RENDERING
// =====================================================

function renderAthletes() {

  if (
    !athletesTableBody
  ) {

    return

  }

  renderEntityTable({

    tableBody:
      athletesTableBody,

    data:
     state.filteredRows,
    paginator,

    colspan: 10,

    emptyMessage:
      'No athletes found',

    rowRenderer:
      renderAthleteRow

  })

  updatePagination()

}
// =====================================================
// PAGINATION
// =====================================================

function updatePagination() {

  updatePaginationUi({

    paginator,

    infoElement:
      paginationInfo,

    previousButton:
      document.getElementById(
        'btnPreviousPage'
      ),

    nextButton:
      document.getElementById(
        'btnNextPage'
      )

  })

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

  
state.filteredRows =
  searchCollection({

    data:
      state.rows,

    searchTerm:
      search,

    fields: [

      'first_name',

      'last_name',

      'athlete_code',

      'phone',

      'email'

    ]

  })


resetPagination(
  paginator
)

  renderAthletes()
}

// =====================================================
// NEW ATHLETE
// =====================================================

function clearAthleteForm() {
  clearMessage(
  'athleteFormError'
)

 resetForm({

  fields: [

    'athleteId',
    'athleteCode',
    'firstName',
    'lastName',
    'dob',
    'gender',
    'role',
    'classificationId',
    'countyId',
    'subcountyId',
    'townName',
    'passportNo',
    'nationalId',
    'phone',
    'email',
    'emergencyContactName',
    'emergencyContactPhone',
    'registrationDate',
    'status'

  ],

  defaults: {

    status: 'Active'

  }

})
}

function openNewAthleteModal() {

  openEntityModal({

    modalId:
      'athleteModal',

    titleId:
      'athleteModalTitle',

    title:
      'Add Athlete',

    beforeOpen:
      clearAthleteForm

  })

}

// =====================================================
// EDIT ATHLETE
// =====================================================

window.editAthlete =
async function (
  athleteId
) {
  const athlete =
  state.rows.find(
    a =>
      a.athlete_id === athleteId
  )

  if (!athlete) {
    return
  }

  clearMessage(
  'athleteFormError'
)

  document.getElementById(
    'athleteModalTitle'
  ).textContent =
    'Edit Athlete'

 populateAthleteForm(
  athlete
)

  setValue(
  'status',
  athlete.membership_status_master?.status_name || ''
)

  showModal(
  'athleteModal'
)
}
// =====================================================
// VALIDATION
// =====================================================

function validateAthlete() {

  clearMessage(
    'athleteFormError'
  )

  return validateRequiredFields({

    fields: [

      {
        id: 'firstName',
        label: 'First Name'
      },

      {
        id: 'lastName',
        label: 'Last Name'
      },

      {
        id: 'dob',
        label: 'Date Of Birth'
      },

      {
        id: 'gender',
        label: 'Gender'
      },

      {
        id: 'role',
        label: 'Role'
      }

    ],

    errorElementId:
      'athleteFormError',

    showError:
  (elementId, message) =>

    showError(
      elementId,
      message
    )

  })

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

let townId = await findOrCreateTown({

  subcountyId:
    getValue(
      'subcountyId'
    ),

  townName

})
    



   const payload =
  buildAthletePayload({
    townId
  })
const membershipStatusId =
  await getMembershipStatusId(
    getValue('status')
  )
payload.membership_status_id =
  membershipStatusId
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

    hideModal(
  'athleteModal'
)

    await loadAthletes()
  } catch (error) {
    console.error(error)

    showError(

  'athleteFormError',

  getFederationFriendlyError(
    error
  )

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

 showModal(
  'deleteAthleteModal'
)
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

   hideModal(
  'deleteAthleteModal'
)
    await loadAthletes()
  } catch (error) {
    console.error(error)

    showError(

  'athleteFormError',

  getFederationFriendlyError(
    error
  )

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

      await loadSubcountySelect({

  countyId,

  selectId:
    'subcountyId'

})

      setValue(
        'subcountyId',
        ''
      )

      setValue(
        'townName',
        ''
      )

     await loadTownDatalist({

  subcountyId:
    null,

  datalistId:
    'townList'

})
    }
  )

document
  .getElementById(
    'subcountyId'
  )
  ?.addEventListener(
    'change',
    async event => {

      await loadTownDatalist({

        subcountyId:
          event.target.value,

        datalistId:
          'townList'

      })

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

await loadCountySelect({

  selectId:
    'countyId',

  placeholder:
    'Select County'

})

await loadAllSubcounties()

const classifications =
  await loadClassificationLookup()

populateSelect({

  selectId:
    'classificationId',

  items:
    classifications,

  valueField:
    'classification_id',

  textFormatter:
    classification =>
      `${classification.classification_code} - ${classification.description}`,

  placeholder:
    'Select Classification'

})

await loadAthletes()

bindPagination({

  paginator,

  previousButtonId:
    'btnPreviousPage',

  nextButtonId:
    'btnNextPage',

  infoElementId:
    'paginationInfo',

  onChange:
    renderAthletes

})

  } catch (error) {
    console.error(error)
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initializeAthletes
)
