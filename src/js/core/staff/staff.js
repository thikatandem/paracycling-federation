/* eslint camelcase: 0 */
import {
  getDb,
  hasDb
} from '../supabase/getDb.js'

import {
  get,
  getValue,
  setValue,
  setText,
  resetForm,
  populateSelect
} from '../services/domService.js'

import {
  showPageLoader,
  hidePageLoader
} from '../services/uiService.js'

import {
  clearMessage,
  showError,
  getFederationFriendlyError
} from '../services/errorService.js'

import {
  showModal,
  hideModal,
  openEntityModal
} from '../services/modalService.js'

import { searchNestedCollection } from '../services/searchService.js'

import {
  createPaginator,
  updatePaginationUi,
  resetPagination,
  bindPagination,
  createPaginatorUiUpdater
} from '../services/paginationService.js'

import {
  renderEntityTable,
  buildActionButtons,
  buildActionCell,
  buildTextCell,
  buildStatusCell
} from '../services/tableRendererService.js'

import { getStatusBadge } from '../services/badgeService.js'

import {
  createPageState,
  setRows
} from '../services/pageStateService.js'

import {
  loadRoleLookup,
  loadGenderLookup,
  loadContractTypeLookup,
  loadEmploymentStatusLookup,
  loadStaffStatusLookup,
  loadDepartmentLookup,
  loadPositionLookupByDepartment
}
  from '../services/lookupService.js'

import {
  loadCountrySelect,
  loadCountySelect,
  loadSubcountySelect,
  loadSubcounties,
  loadTowns,
  populateLocationChain,
  wireCascade,
  resolveTownId
} from '../services/locationLookupService.js'

import {
  syncStaffAccessByStaffId
} from './departmentAccessService.js'


const paginator = createPaginator()
const state = createPageState()

const updatePagination =
  createPaginatorUiUpdater({
    paginator,
    infoElementId:
      'teamPaginationInfo',
    previousButtonId:
      'btnPreviousTeamPage',
    nextButtonId:
      'btnNextTeamPage'
  })


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

    ]

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
      await getDb()
        .from('staff_registry')
.select(`
  *,
  role_master(
    role_name
  ),
  department_master(
    department_name
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

        'department_master.department_name',

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

    colspan: 9,

    emptyMessage:
      'No Staff found',

    rowRenderer:
      renderStaffRow

  })

  updatePagination()
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
      staffId ?
        updateStaff() :
        createStaff()
    )
    hideModal(
      'teamModal'
    )

    await refreshTeams()
  } catch (error) {

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
    await getDb()
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
    await getDb()
      .from(
        'staff_profiles'
      )
      .insert(
        profilePayload
      )

  if (profileError) {
    throw profileError
  }

  await syncStaffAccessByStaffId(
    staff.staff_id
  )
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
    await getDb()
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
    await getDb()
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

  await syncStaffAccessByStaffId(
    staffId
  )
}

/* ==========================================
  REVIEWS
========================================== */
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

  } catch (error) {

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

  const profileButton = `
    <button
      type="button"
      class="btn btn-sm btn-outline-primary me-1"
      onclick="openStaffProfileAdmin('${staff.staff_id}')"
    >
      Profile
    </button>
  `

  return `

<tr>

${buildTextCell(
    staff.staff_code
  )}

${buildTextCell(
    fullName
  )}

${buildTextCell(
    staff.department_master?.department_name || ''
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
    `${profileButton}${actionButtons}`
  )}

</tr>

`
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
      await getDb()
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
      !hasDb()
    ) {

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

  } catch (error) {
  }
}

/* ==========================================
   STARTUP
========================================== */

document.addEventListener(
  'DOMContentLoaded',
  initializeTeams
)
