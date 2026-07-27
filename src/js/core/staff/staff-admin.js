import {
  get,
  getValue,
  setValue
} from '../services/domService.js'

import {
  showModal,
  hideModal
} from '../services/modalService.js'

import {
  enablePortal,
  disablePortal
} from '../auth/portalAccessService.js'

import {
  requestUserCreation
} from '../auth/userProvisioningService.js'

import {
  loadAccessLookups,
  loadDepartmentAccessRows,
  loadDepartmentAccessModel,
  saveDepartment,
  loadProfileAdministrationRows,
  createStaffProfile
} from './departmentAccessService.js'

let lookups = {
  departments: [],
  roles: []
}

function escapeHtml(
  value
) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function showFeedback(
  elementId,
  message,
  type = 'danger'
) {
  const element =
    get(elementId)

  if (!element) {
    return
  }

  if (!message) {
    element.textContent = ''
    element.className =
      'alert d-none'
    return
  }

  element.textContent = message
  element.className =
    `alert alert-${type}`
}

function populateRoleSelect() {
  const select =
    get('departmentDefaultAccessRoleId')

  if (!select) {
    return
  }

  select.innerHTML =
    '<option value="">Select Default Access Role</option>'

  for (const role of lookups.roles) {
    const option =
      document.createElement('option')
    option.value =
      role.user_role_id
    option.textContent =
      role.role_name
    select.append(option)
  }
}

function clearDepartmentForm() {
  setValue('departmentAdminId', '')
  setValue('departmentCode', '')
  setValue('departmentName', '')
  setValue('departmentDefaultAccessRoleId', '')
  get('departmentIsActive').checked = true
  showFeedback(
    'departmentAdminFeedback',
    ''
  )
}

async function renderDepartments() {
  const tbody =
    get('departmentsAdminTableBody')

  if (!tbody) {
    return
  }

  const rows =
    await loadDepartmentAccessRows()

  tbody.innerHTML = ''

  for (const row of rows) {
    tbody.insertAdjacentHTML(
      'beforeend',
      `
        <tr>
          <td>${escapeHtml(row.department_code)}</td>
          <td>${escapeHtml(row.department_name)}</td>
          <td>${escapeHtml(row.role_name || 'Not configured')}</td>
          <td>${row.staff_count}</td>
          <td>
            ${row.is_active ?
              '<span class="badge bg-success">Active</span>' :
              '<span class="badge bg-secondary">Inactive</span>'}
          </td>
          <td>
            <button
              type="button"
              class="btn btn-sm btn-warning"
              onclick="editDepartmentAdmin('${row.department_id}')"
            >
              Edit
            </button>
          </td>
        </tr>
      `
    )
  }
}

async function editDepartmentAdmin(
  departmentId
) {
  const department =
    lookups.departments.find(
      row =>
        row.department_id === departmentId
    )

  if (!department) {
    return
  }

  const access =
    await loadDepartmentAccessModel(
      departmentId
    )

  setValue(
    'departmentAdminId',
    department.department_id
  )
  setValue(
    'departmentCode',
    department.department_code
  )
  setValue(
    'departmentName',
    department.department_name
  )
  setValue(
    'departmentDefaultAccessRoleId',
    access.policy?.user_role_id || ''
  )
  get('departmentIsActive').checked =
    Boolean(department.is_active)
}

async function saveDepartmentAdmin() {
  showFeedback(
    'departmentAdminFeedback',
    ''
  )

  try {
    await saveDepartment({
      departmentId:
        getValue('departmentAdminId') || null,
      departmentCode:
        getValue('departmentCode'),
      departmentName:
        getValue('departmentName'),
      defaultUserRoleId:
        getValue('departmentDefaultAccessRoleId'),
      isActive:
        Boolean(
          get('departmentIsActive')?.checked
        )
    })

    lookups =
      await loadAccessLookups()
    populateRoleSelect()
    await renderDepartments()
    clearDepartmentForm()

    showFeedback(
      'departmentAdminFeedback',
      'Department saved successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'departmentAdminFeedback',
      error.message || String(error)
    )
  }
}

async function openDepartmentsAdmin() {
  showFeedback(
    'departmentAdminFeedback',
    ''
  )
  lookups =
    await loadAccessLookups()
  populateRoleSelect()
  clearDepartmentForm()
  await renderDepartments()
  showModal(
    'departmentsAdminModal'
  )
}

async function renderProfiles(
  focusStaffId = null
) {
  const tbody =
    get('profilesAdminTableBody')

  if (!tbody) {
    return
  }

  const rows =
    await loadProfileAdministrationRows()

  tbody.innerHTML = ''

  for (const row of rows) {
    const profile = row.profile
    const portal =
      profile?.portal_enabled ?
        '<span class="badge bg-success">Enabled</span>' :
        '<span class="badge bg-secondary">Disabled</span>'
    const auth =
      profile?.auth_user_id ?
        '<span class="badge bg-success">Linked</span>' :
        '<span class="badge bg-warning text-dark">Not linked</span>'

    let actions = ''

    if (!profile) {
      actions = `
        <button
          type="button"
          class="btn btn-sm btn-primary"
          onclick="createStaffProfileAdmin('${row.staff_id}')"
        >
          Create Profile
        </button>
      `
    } else {
      actions += `
        <button
          type="button"
          class="btn btn-sm ${profile.portal_enabled ? 'btn-outline-danger' : 'btn-outline-success'} me-1"
          onclick="toggleStaffPortalAdmin('${profile.profile_id}', ${profile.portal_enabled ? 'false' : 'true'})"
        >
          ${profile.portal_enabled ? 'Disable Portal' : 'Enable Portal'}
        </button>
      `

      if (!profile.auth_user_id) {
        actions += `
          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            onclick="provisionStaffUserAdmin('${profile.profile_id}')"
            ${profile.portal_enabled ? '' : 'disabled title="Enable portal first"'}
          >
            Provision User
          </button>
        `
      }
    }

    tbody.insertAdjacentHTML(
      'beforeend',
      `
        <tr
          data-staff-id="${row.staff_id}"
          class="${focusStaffId === row.staff_id ? 'table-primary' : ''}"
        >
          <td>${escapeHtml(row.staff_code || '')}</td>
          <td>${escapeHtml(row.staff_name)}</td>
          <td>${escapeHtml(row.department_name)}</td>
          <td>${escapeHtml(profile?.email || row.email || 'No profile')}</td>
          <td>${escapeHtml(row.role_name || 'Not assigned')}</td>
          <td>${escapeHtml(row.access_source)}</td>
          <td>${profile ? portal : '<span class="badge bg-secondary">No profile</span>'}</td>
          <td>${profile ? auth : '-'}</td>
          <td>${actions}</td>
        </tr>
      `
    )
  }
}

async function openProfilesAdmin(
  focusStaffId = null
) {
  showFeedback(
    'profilesAdminFeedback',
    ''
  )
  await renderProfiles(
    focusStaffId
  )
  showModal(
    'profilesAdminModal'
  )
}

async function createStaffProfileAdmin(
  staffId
) {
  showFeedback(
    'profilesAdminFeedback',
    ''
  )

  try {
    await createStaffProfile(
      staffId
    )
    await renderProfiles(
      staffId
    )
    showFeedback(
      'profilesAdminFeedback',
      'Profile created and linked to the staff member. Department access role was applied where configured.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'profilesAdminFeedback',
      error.message || String(error)
    )
  }
}

async function toggleStaffPortalAdmin(
  profileId,
  enable
) {
  showFeedback(
    'profilesAdminFeedback',
    ''
  )

  try {
    if (enable) {
      await enablePortal(
        profileId
      )
    } else {
      await disablePortal(
        profileId
      )
    }

    await renderProfiles()
    showFeedback(
      'profilesAdminFeedback',
      `Portal access ${enable ? 'enabled' : 'disabled'} successfully.`,
      'success'
    )
  } catch (error) {
    showFeedback(
      'profilesAdminFeedback',
      error.message || String(error)
    )
  }
}

async function provisionStaffUserAdmin(
  profileId
) {
  showFeedback(
    'profilesAdminFeedback',
    ''
  )

  try {
    await requestUserCreation(
      profileId,
      'Requested from Staff Profiles administration.'
    )
    showFeedback(
      'profilesAdminFeedback',
      'User provisioning request created successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'profilesAdminFeedback',
      error.message || String(error)
    )
  }
}

async function initialize() {
  get('btnManageDepartments')
    ?.addEventListener(
      'click',
      () => {
        openDepartmentsAdmin()
          .catch(error =>
            showFeedback(
              'departmentAdminFeedback',
              error.message || String(error)
            )
          )
      }
    )

  get('btnNewDepartment')
    ?.addEventListener(
      'click',
      clearDepartmentForm
    )

  get('btnSaveDepartment')
    ?.addEventListener(
      'click',
      saveDepartmentAdmin
    )

  get('btnManageProfiles')
    ?.addEventListener(
      'click',
      () => {
        openProfilesAdmin()
          .catch(error =>
            showFeedback(
              'profilesAdminFeedback',
              error.message || String(error)
            )
          )
      }
    )

  window.editDepartmentAdmin =
    editDepartmentAdmin
  window.createStaffProfileAdmin =
    createStaffProfileAdmin
  window.toggleStaffPortalAdmin =
    toggleStaffPortalAdmin
  window.provisionStaffUserAdmin =
    provisionStaffUserAdmin
  window.openStaffProfileAdmin =
    openProfilesAdmin
}

document.addEventListener(
  'DOMContentLoaded',
  initialize
)
