/* global coreui */
/* eslint camelcase: 0 */
/* eslint-disable no-console */
/* eslint-disable no-alert */

import {
  get,
  getValue,
  setValue,
  setText,
  resetForm,
  populateSelect
} from './core/domService.js';

import {
  showPageLoader,
  hidePageLoader
} from './core/uiService.js';

import {
  clearMessage,
  showError,
  getFederationFriendlyError
} from './core/errorService.js';

import {
  showModal,
  hideModal,
  openEntityModal
} from './core/modalService.js';

import { searchNestedCollection } from './core/searchService.js';

import {
  createPaginator,
  updatePaginationUi,
  resetPagination,
  bindPagination
} from './core/paginationService.js';

import {
  renderEntityTable,
  buildActionButtons,
  buildActionCell,
  buildTextCell,
  buildStatusCell
} from './core/tableRendererService.js';

import { getStatusBadge } from './core/badgeService.js';

import {
  createPageState,
  setRows
} from './core/pageStateService.js';

import {
  loadRoleLookup,
  loadGenderLookup,
  loadContractTypeLookup,
  loadEmploymentStatusLookup,
  loadStaffStatusLookup,
  loadDepartmentLookup,
  loadPositionLookupByDepartment
}
from './core/lookupService.js';

import {
  loadCountrySelect,
  loadCountySelect,
  loadSubcountySelect,
  loadSubcounties,
  loadTowns,
  populateLocationChain,
  wireCascade,
  resolveTownId
} from './core/locationLookupService.js';

const paginator = createPaginator();
const state = createPageState();


let assignments = []
let qualifications = []
let certifications = []
let reviews = []

/* ==========================================
   HELPERS
========================================== */
function clearForm() {

  clearMessage(
    'teamFormError'
  )

  resetForm({

    fields: [

  'staffId',
  'staffCode',

  'firstName',
  'lastName',

  'gender',
  'dob',

  'phone',
  'email',
'departmentId',
'positionId',
  'roleId',

'countryId',
'countyId',
'subcountyId',
'townId',

  'employmentDate',
  'contractType',
  'employmentStatus',
  'staffStatus',

  'salaryStipend',

  'licenseExpiry',

  'emergencyContactName',
  'emergencyContactPhone',

  'notes'

],

    

  })

}


/* ==========================================
   LOAD TEAMS
========================================== */

async function loadTeams() {
  try {
    showPageLoader()

    const {
      data,
      error
    } =
      await window.supabaseClient
        .from('staff_registry')
.select(`
  *,
  role_master(
    role_name
  ),
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
  staff_profiles(
  employment_date,
  contract_type,
  employment_status,
  staff_status,
  salary_stipend,
  license_expiry,
  emergency_contact_name,
  emergency_contact_phone,
  notes
)
`)
.order(
  'staff_code'
)

    if (error) {
      throw error
    }

    setRows({

  state,

  rows:
    data || []

})
   
    

    renderTeamsTable()

  } catch (error) {
    console.error(error)

    showError(
  'teamFormError',
  getFederationFriendlyError(
    error
  )
)
  } finally {
    hidePageLoader()
  }
}


async function loadAssignments(
  staffId
) {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'staff_assignments'
      )
      .select(`
        *,
        role_master(
          role_name
        ),
        teams(
          team_name
        )
      `)
      .eq(
        'staff_id',
        staffId
      )

  if (error) {
    throw error
  }

  assignments =
    data || []

}


async function loadQualifications(
  staffId
) {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'staff_qualifications'
      )
      .select(`
        *
      `)
      .eq(
        'staff_id',
        staffId
      )

  if (error) {
    throw error
  }

  qualifications =
    data || []

}


function renderQualificationRow(
  qualification
) {

  return `

<tr>

${buildTextCell(
  qualification.qualification_name
)}

${buildTextCell(
  qualification.institution
)}

${buildTextCell(
  qualification.date_awarded
)}

${buildTextCell(
  qualification.expiry_date
)}

</tr>

`

}

function renderQualificationsTable() {

  const tbody =
    get(
      'qualificationsTableBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML =
    qualifications
      .map(
        renderQualificationRow
      )
      .join('')

}


/* ==========================================
   SEARCH
========================================== */

function applySearch() {

  const term =
    (
      get('searchTeam')
        ?.value || ''
    )
      .trim()

  state.filteredRows =
    searchNestedCollection({

      data:
        state.rows,

      searchTerm:
        term,

      fields: [

  'staff_code',

  'first_name',

  'last_name',

  'phone',

  'email',

  'role_master.role_name'

]

    })

  resetPagination(
    paginator
  )

  renderTeamsTable()

}
/* ==========================================
   TABLE
========================================== */

function renderTeamsTable() {

  const tbody =
    get('teamsTableBody')

  if (!tbody) {
    return
  }

  renderEntityTable({

    tableBody:
      tbody,

    data:
  state.filteredRows,
    paginator,

    colspan: 8,

    emptyMessage:
      'No Staff found',

    rowRenderer:
      renderStaffRow

  })

  updatePagination()

}

function updatePagination() {

  updatePaginationUi({

    paginator,

    infoElement:
      get('teamPaginationInfo'),

    previousButton:
      get('btnPreviousTeamPage'),

    nextButton:
      get('btnNextTeamPage')

  })

}

/* ==========================================
   REFRESH
========================================== */

async function refreshTeams() {

  await loadTeams()

}
/* ==========================================
   MODAL OPEN
========================================== */

function openAddTeamModal() {

  openEntityModal({

    modalId:
      'teamModal',



    titleId:
      'teamModalTitle',

    title: 'Add Staff',

    beforeOpen:
      clearForm

  })

}
/* ==========================================
   VALIDATION
========================================== */

function validateStaff() {

  if (
    !getValue(
      'firstName'
    )
  ) {
    return 'First Name is required'
  }

  if (
    !getValue(
      'lastName'
    )
  ) {
    return 'Last Name is required'
  }

  return null

}
/* ==========================================
   SAVE TEAM
========================================== */

async function saveTeam() {
  try {
    clearMessage(
  'teamFormError'
)

    const validationError =
      validateStaff()

    if (validationError) {
      showError(
  'teamFormError',
  validationError
)

      return
    }

    const staffId =
  getValue(
    'staffId'
  )

    await (
  staffId
    ? updateStaff()
    : createStaff()
)
    hideModal(
  'teamModal'
)

    await refreshTeams()
  } catch (error) {
    console.error(error)

    showError(
  'teamFormError',
  getFederationFriendlyError(
    error
  )
)

  }
}

/* ==========================================
   CREATE TEAM
========================================== */
async function createStaff() {

  const registryPayload = {

    

    first_name:
      getValue(
        'firstName'
      ),

    last_name:
      getValue(
        'lastName'
      ),

    gender:
      getValue(
        'gender'
      ) || null,

    dob:
      getValue(
        'dob'
      ) || null,

    phone:
      getValue(
        'phone'
      ) || null,

    email:
      getValue(
        'email'
      ) || null,
department_id:
  getValue(
    'departmentId'
  ) || null,

position_id:
  getValue(
    'positionId'
  ) || null,

    role_id:
  getValue(
    'roleId'
  ) || null,

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

    is_active: true,
    
created_by:
  window.currentUser?.id || null,

updated_by:
  window.currentUser?.id || null

  }

  const {
    data: staff,
    error
  } =
    await window.supabaseClient
      .from(
        'staff_registry'
      )
      .insert(
        registryPayload
      )
      .select()
      .single()

  if (error) {
    throw error
  }

  const profilePayload = {

    staff_id:
      staff.staff_id,

    employment_date:
      getValue(
        'employmentDate'
      ) || null,

    contract_type:
      getValue(
        'contractType'
      ) || null,

employment_status:
  getValue(
    'employmentStatus'
  ) || null,

staff_status:
  getValue(
    'staffStatus'
  ) || null,

salary_stipend:
  getValue(
    'salaryStipend'
  ) || null,

    license_expiry:
      getValue(
        'licenseExpiry'
      ) || null,

    emergency_contact_name:
      getValue(
        'emergencyContactName'
      ) || null,

    emergency_contact_phone:
      getValue(
        'emergencyContactPhone'
      ) || null,

    notes:
  getValue(
    'notes'
  ) || null,

created_by:
  window.currentUser?.id || null,

updated_by:
  window.currentUser?.id || null
  }

  const {
    error: profileError
  } =
    await window.supabaseClient
      .from(
        'staff_profiles'
      )
      .insert(
        profilePayload
      )

  if (profileError) {
    throw profileError
  }

}
/* ==========================================
   UPDATE TEAM
========================================== */

async function updateStaff() {

  const staffId =
    getValue(
      'staffId'
    )

  const registryPayload = {

    staff_code:
      getValue(
        'staffCode'
      ),

    first_name:
      getValue(
        'firstName'
      ),

    last_name:
      getValue(
        'lastName'
      ),

    gender:
      getValue(
        'gender'
      ) || null,

    dob:
      getValue(
        'dob'
      ) || null,

    phone:
      getValue(
        'phone'
      ) || null,

    email:
      getValue(
        'email'
      ) || null,

department_id:
  getValue(
    'departmentId'
  ) || null,

position_id:
  getValue(
    'positionId'
  ) || null,

   role_id:
  getValue(
    'roleId'
  ) || null,

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

    is_active: true,

updated_by:
  window.currentUser?.id || null
  }

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_registry'
      )
      .update(
        registryPayload
      )
      .eq(
        'staff_id',
        staffId
      )

  if (error) {
    throw error
  }

  const profilePayload = {

    employment_date:
      getValue(
        'employmentDate'
      ) || null,

    contract_type:
      getValue(
        'contractType'
      ) || null,

   employment_status:
  getValue(
    'employmentStatus'
  ) || null,

staff_status:
  getValue(
    'staffStatus'
  ) || null,

salary_stipend:
  getValue(
    'salaryStipend'
  ) || null,

    license_expiry:
      getValue(
        'licenseExpiry'
      ) || null,

    emergency_contact_name:
      getValue(
        'emergencyContactName'
      ) || null,

    emergency_contact_phone:
      getValue(
        'emergencyContactPhone'
      ) || null,

    notes:
  getValue(
    'notes'
  ) || null,

updated_by:
  window.currentUser?.id || null

  }

  const {
    error: profileError
  } =
    await window.supabaseClient
      .from(
        'staff_profiles'
      )
      .update(
        profilePayload
      )
      .eq(
        'staff_id',
        staffId
      )

  if (profileError) {
    throw profileError
  }

}

/* ==========================================
  REVIEWS
========================================== */
async function loadReviews(
  staffId
) {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'staff_reviews'
      )
      .select(`
        *
      `)
      .eq(
        'staff_id',
        staffId
      )

  if (error) {
    throw error
  }

  reviews =
    data || []

}

function renderReviewRow(
  review
) {

  return `

<tr>

${buildTextCell(
  review.review_date
)}

${buildTextCell(
  review.reviewer
)}

${buildTextCell(
  review.score
)}

${buildTextCell(
  review.comments
)}

</tr>

`

}

function renderReviewsTable() {

  const tbody =
    get(
      'reviewsTableBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML =
    reviews
      .map(
        renderReviewRow
      )
      .join('')

}

/* ==========================================
   EDIT TEAM
========================================== */

async function editStaff(
  staffId
) {

  try {

    const staff =
      state.rows.find(
        row =>
          row.staff_id ===
          staffId
      )

    if (!staff) {
      return
    }

    clearForm()

    const profile =
      staff.staff_profiles?.[0] || {}

    setValue(
      'staffId',
      staff.staff_id
    )

    setValue(
      'staffCode',
      staff.staff_code || ''
    )

    setValue(
      'firstName',
      staff.first_name || ''
    )

    setValue(
      'lastName',
      staff.last_name || ''
    )

    setValue(
      'gender',
      staff.gender || ''
    )

    setValue(
      'dob',
      staff.dob || ''
    )

    setValue(
      'phone',
      staff.phone || ''
    )

    setValue(
      'email',
      staff.email || ''
    )
setValue(
  'departmentId',
  staff.department_id || ''
)

const positions =
  await loadPositionLookupByDepartment(
    staff.department_id
  )

populateSelect({

  selectId:
    'positionId',

  items:
    positions,

  valueField:
    'position_id',

  textField:
    'position_name'

})

setValue(
  'positionId',
  staff.position_id || ''
)

    setValue(
  'roleId',
  staff.role_id || ''
)

setValue(
  'countryId',
  staff.country_id || ''
)

setValue(
  'countyId',
  staff.county_id || ''
)

setValue(
  'subcountyId',
  staff.subcounty_id || ''
)

setValue(
  'townId',
  staff.town_id || ''
)

    
    

    setValue(
      'employmentDate',
      profile.employment_date || ''
    )

    setValue(
      'contractType',
      profile.contract_type || ''
    )

    setValue(
      'employmentStatus',
      profile.employment_status || ''
    )
setValue(
  'staffStatus',
  profile.staff_status || ''
)
    setValue(
      'salaryStipend',
      profile.salary_stipend || ''
    )

    setValue(
      'licenseExpiry',
      profile.license_expiry || ''
    )

    setValue(
      'emergencyContactName',
      profile.emergency_contact_name || ''
    )

    setValue(
      'emergencyContactPhone',
      profile.emergency_contact_phone || ''
    )

    setValue(
      'notes',
      profile.notes || ''
    )

    setText(
      'teamModalTitle',
      'Edit Staff'
    )

    showModal(
      'teamModal'
    )

await loadAssignments(
  staffId
)

renderAssignmentsTable()


await loadQualifications(
  staffId
)

renderQualificationsTable()

await loadCertifications(
  staffId
)

renderCertificationsTable()

await loadReviews(
  staffId
)

renderReviewsTable()

  } catch (error) {

    console.error(
      error
    )

    showError(
      'teamFormError',
      getFederationFriendlyError(
        error
      )
    )

  }

}
/* ==========================================
   DELETE MODAL
========================================== */

function confirmDeleteStaff(
  staffId
) {

  setValue(
  'deletestaffId',
  staffId
)

  showModal(
    'deleteTeamModal'
  )

}

function renderStaffRow(
  staff
) {

  const profile =
    staff.staff_profiles?.[0] || {}

  const fullName =
    `${staff.first_name || ''} ${staff.last_name || ''}`

  const actionButtons =

    buildActionButtons({

      buttons: [

        {

          type: 'edit',

          onClick:
            `editStaff('${staff.staff_id}')`

        },

        {

          type: 'delete',

          onClick:
            `confirmDeleteStaff('${staff.staff_id}')`

        }

      ]

    })

  return `

<tr>

${buildTextCell(
  staff.staff_code
)}

${buildTextCell(
  fullName
)}

${buildTextCell(
  staff.role_master?.role_name || ''
)}

${buildTextCell(
  staff.phone
)}

${buildTextCell(
  String(
    profile.employment_status || ''
  )
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      letter => letter.toUpperCase()
    )
)}

${buildTextCell(
  String(
    profile.contract_type || ''
  )
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      letter => letter.toUpperCase()
    )
)}
${buildStatusCell(
  getStatusBadge(
    String(
      profile.staff_status || ''
    )
      .replaceAll(
        '_',
        ' '
      ),
    profile.staff_status
  )
)}


${buildActionCell(
  actionButtons
)}

</tr>

`

}


function renderAssignmentRow(
  assignment
) {

  return `

<tr>

${buildTextCell(
  assignment.role_master
    ?.role_name || ''
)}

${buildTextCell(
  assignment.teams
    ?.team_name || ''
)}

${buildTextCell(
  assignment.start_date || ''
)}

${buildTextCell(
  assignment.end_date || ''
)}

${buildStatusCell(
  getStatusBadge(
    assignment.is_active
      ? 'Active'
      : 'Inactive',
    assignment.is_active
      ? 'Active'
      : 'Inactive'
  )
)}

${buildTextCell(
  assignment.assignment_reason || ''
)}

</tr>

`

}


function renderAssignmentsTable() {

  const tbody =
    get(
      'assignmentsTableBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML =
    assignments
      .map(
        renderAssignmentRow
      )
      .join('')

}

/* ==========================================
   ASSIGNMENT CRUD
========================================== */

async function createAssignment(
  payload
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_assignments'
      )
      .insert(
        payload
      )

  if (error) {
    throw error
  }

}

async function updateAssignment(
  assignmentId,
  payload
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_assignments'
      )
      .update(
        payload
      )
      .eq(
        'assignment_id',
        assignmentId
      )

  if (error) {
    throw error
  }

}

async function deleteAssignment(
  assignmentId
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_assignments'
      )
      .delete()
      .eq(
        'assignment_id',
        assignmentId
      )

  if (error) {
    throw error
  }

}

/* ==========================================
   QUALIFICATION CRUD
========================================== */

async function createQualification(
  payload
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_qualifications'
      )
      .insert(
        payload
      )

  if (error) {
    throw error
  }

}

async function updateQualification(
  qualificationId,
  payload
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_qualifications'
      )
      .update(
        payload
      )
      .eq(
        'qualification_id',
        qualificationId
      )

  if (error) {
    throw error
  }

}

async function deleteQualification(
  qualificationId
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_qualifications'
      )
      .delete()
      .eq(
        'qualification_id',
        qualificationId
      )

  if (error) {
    throw error
  }

}

/* ==========================================
   REVIEW CRUD
========================================== */

async function createReview(
  payload
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_reviews'
      )
      .insert(
        payload
      )

  if (error) {
    throw error
  }

}

async function updateReview(
  reviewId,
  payload
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_reviews'
      )
      .update(
        payload
      )
      .eq(
        'review_id',
        reviewId
      )

  if (error) {
    throw error
  }

}

async function deleteReview(
  reviewId
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_reviews'
      )
      .delete()
      .eq(
        'review_id',
        reviewId
      )

  if (error) {
    throw error
  }

}



/* ==========================================
   CERTIFICATION CRUD
========================================== */

async function createCertification(
  payload
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_certifications'
      )
      .insert(
        payload
      )

  if (error) {
    throw error
  }

}

async function updateCertification(
  certificationId,
  payload
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_certifications'
      )
      .update(
        payload
      )
      .eq(
        'certification_id',
        certificationId
      )

  if (error) {
    throw error
  }

}

async function deleteCertification(
  certificationId
) {

  const {
    error
  } =
    await window.supabaseClient
      .from(
        'staff_certifications'
      )
      .delete()
      .eq(
        'certification_id',
        certificationId
      )

  if (error) {
    throw error
  }

}



/* ==========================================
   DELETE TEAM
========================================== */

async function deleteStaff() {

  try {

    const staffId =
      getValue(
        'deletestaffId'
      )

    if (!staffId) {
      return
    }

    const {
      error
    } =
      await window.supabaseClient
        .from(
          'staff_registry'
        )
        .delete()
        .eq(
          'staff_id',
          staffId
        )

    if (error) {
      throw error
    }

    hideModal(
      'deleteTeamModal'
    )

    await refreshTeams()

  } catch (error) {

    console.error(
      error
    )

    showError(
      'teamFormError',
      getFederationFriendlyError(
        error
      )
    )

  }

}
/* ==========================================
   EVENT WIRING
========================================== */

function wireEvents() {

  const refreshButton =
    get('btnRefreshTeams')

  if (refreshButton) {
    refreshButton.addEventListener(
      'click',
      refreshTeams
    )
  }

  const addButton =
    get('btnAddTeam')

  if (addButton) {
    addButton.addEventListener(
      'click',
      openAddTeamModal
    )
  }

  const saveButton =
    get('btnSaveTeam')

  if (saveButton) {
    saveButton.addEventListener(
      'click',
      saveTeam
    )
  }

  const deleteButton =
    get('btnConfirmDeleteTeam')

  if (deleteButton) {
    deleteButton.addEventListener(
      'click',
      deleteStaff
    )
  }

  const searchBox =
    get('searchTeam')

  if (searchBox) {
    searchBox.addEventListener(
      'input',
      applySearch
    )
  }

}

/* ==========================================
   CERTIFICATION
========================================== */
async function loadCertifications(
  staffId
) {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'staff_certifications'
      )
      .select(`
        *
      `)
      .eq(
        'staff_id',
        staffId
      )

  if (error) {
    throw error
  }

  certifications =
    data || []

}


function renderCertificationRow(
  certification
) {

  return `

<tr>

${buildTextCell(
  certification.certification_name
)}

${buildTextCell(
  certification.issuing_body
)}

${buildTextCell(
  certification.issue_date
)}

${buildTextCell(
  certification.expiry_date
)}

</tr>

`

}

function renderCertificationsTable() {

  const tbody =
    get(
      'certificationsTableBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML =
    certifications
      .map(
        renderCertificationRow
      )
      .join('')

}

async function loadLookups() {

  const genders =
    await loadGenderLookup()

  populateSelect({

    selectId:
      'gender',

    items:
      genders,

    valueField:
      'gender_code',

    textField:
      'gender_name',

    placeholder:
      'Select Gender'

  })

  const contractTypes =
    await loadContractTypeLookup()

  populateSelect({

    selectId:
      'contractType',

    items:
      contractTypes,

    valueField:
      'contract_code',

    textField:
      'contract_name',

    placeholder:
      'Select Contract Type'

  })

  const employmentStatuses =
    await loadEmploymentStatusLookup()

  populateSelect({

    selectId:
      'employmentStatus',

    items:
      employmentStatuses,

    valueField:
      'status_code',

    textField:
      'status_name',

    placeholder:
      'Select Employment Status'

  })

  const staffStatuses =
    await loadStaffStatusLookup()

  populateSelect({

    selectId:
      'staffStatus',

    items:
      staffStatuses,

    valueField:
      'status_code',

    textField:
      'status_name',

    placeholder:
      'Select Staff Status'

  })


const departments =
  await loadDepartmentLookup()

populateSelect({

  selectId:
    'departmentId',

  items:
    departments,

  valueField:
    'department_id',

  textField:
    'department_name',

  placeholder:
    'Select Department'

})

const departmentSelect =
  get('departmentId')

departmentSelect?.addEventListener(
  'change',
  async event => {

    const positions =
      await loadPositionLookupByDepartment(
        event.target.value
      )

    populateSelect({

      selectId:
        'positionId',

      items:
        positions,

      valueField:
        'position_id',

      textField:
        'position_name',

      placeholder:
        'Select Position'

    })

  }
)
  const roles =
    await loadRoleLookup()

  populateSelect({

    selectId:
      'roleId',

    items:
      roles,

    valueField:
      'role_id',

    textField:
      'role_name',

    placeholder:
      'Select Role'

  })

await loadCountrySelect({

  selectId:
    'countryId'

})

populateLocationChain({

  countryId:
    'countryId',

  countyId:
    'countyId',

  subcountyId:
    'subcountyId',

  townId:
    'townId'

})
}
/* ==========================================
   ERROR HANDLING
========================================== */

window.addEventListener(
  'error',
  event => {
    console.error(
      'Teams Module Error:',
      event.error
    )
  }
)

window.addEventListener(
  'unhandledrejection',
  event => {
    console.error(
      'Unhandled Promise:',
      event.reason
    )
  }
)

/* ==========================================
   GLOBAL FUNCTIONS
========================================== */

window.editStaff =
  editStaff

window.confirmDeleteStaff =
  confirmDeleteStaff

window.openAddTeamModal =
  openAddTeamModal


/* ==========================================
   INITIALIZATION
========================================== */

async function initializeTeams() {
  try {
    if (
      !window.supabaseClient
    ) {
      console.error(
        'Supabase client not found'
      )

      return
    }

   bindPagination({

  paginator,

  previousButtonId:
    'btnPreviousTeamPage',

  nextButtonId:
    'btnNextTeamPage',

  infoElementId:
    'teamPaginationInfo',

  onChange:
    renderTeamsTable

})

   wireEvents()

    
    await loadLookups()
    await refreshTeams()

    console.log(
      'Teams module initialized'
    )
  } catch (error) {
    console.error(
      'Initialization Error',
      error
    )
  }
}

/* ==========================================
   STARTUP
========================================== */

document.addEventListener(
  'DOMContentLoaded',
  initializeTeams
)
