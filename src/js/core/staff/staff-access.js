import {
  get,
  getValue,
  setValue,
  setText
} from '../services/domService.js'

import {
  showModal,
  hideModal
} from '../services/modalService.js'

import {
  createPaginator,
  bindPagination,
  updatePaginationUi,
  resetPagination
} from '../services/paginationService.js'

import {
  loadAccessLookups,
  loadDepartmentAccessRows,
  loadDepartmentAccessModel,
  loadRoleAccessModel,
  saveRoleAccessModel,
  saveDepartmentAccess,
  loadIndividualAccessModel,
  saveIndividualAccess
} from './departmentAccessService.js'

const paginator =
  createPaginator()

let lookups = {
  departments: [],
  roles: [],
  permissions: [],
  staff: []
}

let rows = []
let filteredRows = []
let roleDefinitionPermissionStates = []
let roleDefinitionModuleStates = []
let departmentPermissionStates = []
let departmentModuleStates = []
let individualPermissionStates = []
let individualModuleStates = []
let individualModel = null

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

function setLoading(
  active
) {
  get('assignmentLoading')
    ?.classList
    .toggle('d-none', !active)
}

function roleName(
  roleId
) {
  return lookups.roles.find(
    role =>
      role.user_role_id === roleId
  )?.role_name || ''
}

function populateSelect(
  elementId,
  items,
  valueField,
  textField,
  placeholder
) {
  const select =
    get(elementId)

  if (!select) {
    return
  }

  select.innerHTML = ''

  const empty =
    document.createElement('option')
  empty.value = ''
  empty.textContent = placeholder
  select.append(empty)

  for (const item of items) {
    const option =
      document.createElement('option')
    option.value =
      item[valueField] || ''
    option.textContent =
      item[textField] || ''
    select.append(option)
  }
}

function renderRows() {
  const tbody =
    get('assignmentsTableBody')

  if (!tbody) {
    return
  }

  paginator.setData(
    filteredRows
  )

  const pageRows =
    paginator.getPage()

  tbody.innerHTML = ''

  if (!pageRows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center">
          No department access policies found
        </td>
      </tr>
    `
  } else {
    for (const row of pageRows) {
      const status =
        row.access_active ?
          '<span class="badge bg-success">Active</span>' :
          row.user_role_id ?
            '<span class="badge bg-warning text-dark">Inactive</span>' :
            '<span class="badge bg-secondary">Not configured</span>'

      tbody.insertAdjacentHTML(
        'beforeend',
        `
          <tr>
            <td>${escapeHtml(row.department_name)}</td>
            <td>${escapeHtml(row.role_name || 'Not configured')}</td>
            <td>${row.staff_count}</td>
            <td>${row.custom_profile_count}</td>
            <td>${row.permission_override_count}</td>
            <td>${row.module_override_count}</td>
            <td>${status}</td>
            <td>
              <button
                type="button"
                class="btn btn-sm btn-warning"
                onclick="editDepartmentAccess('${row.department_id}')"
              >
                Configure
              </button>
            </td>
          </tr>
        `
      )
    }
  }

  updatePaginationUi({
    paginator,
    infoElement:
      get('assignmentPaginationInfo'),
    previousButton:
      get('btnPreviousAssignmentPage'),
    nextButton:
      get('btnNextAssignmentPage')
  })
}

function applySearch() {
  const term =
    String(
      getValue('searchAssignment') || ''
    )
      .trim()
      .toLowerCase()

  filteredRows =
    !term ?
      [...rows] :
      rows.filter(row =>
        [
          row.department_code,
          row.department_name,
          row.role_code,
          row.role_name
        ]
          .some(value =>
            String(value || '')
              .toLowerCase()
              .includes(term)
          )
      )

  resetPagination(
    paginator
  )
  renderRows()
}

function groupPermissions(
  states
) {
  const groups = new Map()

  for (const state of states) {
    const moduleCode =
      state.module_code || 'GENERAL'

    if (!groups.has(moduleCode)) {
      groups.set(moduleCode, [])
    }

    groups.get(moduleCode).push(state)
  }

  return groups
}

function renderPermissionMatrix({
  containerId,
  states,
  prefix
}) {
  const container =
    get(containerId)

  if (!container) {
    return
  }

  const groups =
    groupPermissions(states)

  if (!states.length) {
    container.innerHTML = `
      <div class="alert alert-info mb-0">
        No active detailed permissions are defined.
      </div>
    `
    return
  }

  container.innerHTML =
    [...groups.entries()]
      .map(([moduleCode, permissions]) => `
        <div class="card mb-3">
          <div class="card-header">
            <strong>${escapeHtml(moduleCode)}</strong>
          </div>
          <div class="card-body">
            <div class="row g-2">
              ${permissions.map(permission => `
                <div class="col-lg-6">
                  <div class="form-check border rounded p-3 ps-5 h-100">
                    <input
                      class="form-check-input access-permission-checkbox"
                      type="checkbox"
                      id="${prefix}-${permission.permission_id}"
                      data-permission-id="${permission.permission_id}"
                      ${permission.allowed ? 'checked' : ''}
                    >
                    <label
                      class="form-check-label"
                      for="${prefix}-${permission.permission_id}"
                    >
                      <strong>${escapeHtml(permission.permission_name)}</strong>
                      <span class="d-block small text-muted">
                        ${escapeHtml(permission.permission_code)}
                      </span>
                      ${permission.description ? `
                        <span class="d-block small mt-1">
                          ${escapeHtml(permission.description)}
                        </span>
                      ` : ''}
                    </label>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `)
      .join('')
}

function renderModuleMatrix({
  containerId,
  states,
  prefix
}) {
  const container =
    get(containerId)

  if (!container) {
    return
  }

  if (!states.length) {
    container.innerHTML = `
      <div class="alert alert-info mb-0">
        No module permissions are defined for this role.
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead>
          <tr>
            <th>Module</th>
            <th class="text-center">View</th>
            <th class="text-center">Create</th>
            <th class="text-center">Update</th>
            <th class="text-center">Delete</th>
          </tr>
        </thead>
        <tbody>
          ${states.map(state => `
            <tr data-module-code="${escapeHtml(state.module_code)}">
              <td>${escapeHtml(state.module_code)}</td>
              ${['can_view', 'can_create', 'can_update', 'can_delete']
                .map(action => `
                  <td class="text-center">
                    <input
                      class="form-check-input access-module-checkbox"
                      type="checkbox"
                      data-module-code="${escapeHtml(state.module_code)}"
                      data-action="${action}"
                      data-prefix="${prefix}"
                      ${state[action] ? 'checked' : ''}
                    >
                  </td>
                `)
                .join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function readPermissionMatrix(
  containerId,
  originalStates
) {
  const container =
    get(containerId)

  return originalStates.map(
    state => {
      const input =
        container?.querySelector(
          `[data-permission-id="${state.permission_id}"]`
        )

      return {
        ...state,
        allowed:
          Boolean(input?.checked)
      }
    }
  )
}

function readModuleMatrix(
  containerId,
  originalStates
) {
  const container =
    get(containerId)

  return originalStates.map(
    state => {
      const next = {
        ...state
      }

      for (const action of [
        'can_view',
        'can_create',
        'can_update',
        'can_delete'
      ]) {
        const input =
          container?.querySelector(
            `[data-module-code="${CSS.escape(state.module_code)}"][data-action="${action}"]`
          )

        next[action] =
          Boolean(input?.checked)
      }

      return next
    }
  )
}

async function loadRows() {
  setLoading(true)
  showFeedback(
    'assignmentPageFeedback',
    ''
  )

  try {
    rows =
      await loadDepartmentAccessRows()
    filteredRows =
      [...rows]
    renderRows()
  } catch (error) {
    showFeedback(
      'assignmentPageFeedback',
      error.message || String(error)
    )
  } finally {
    setLoading(false)
  }
}

async function loadRoleDefinition() {
  showFeedback(
    'roleDefinitionError',
    ''
  )

  const roleId =
    getValue('roleDefinitionRoleId')

  if (!roleId) {
    roleDefinitionPermissionStates = []
    roleDefinitionModuleStates = []
    renderPermissionMatrix({
      containerId:
        'roleDefinitionPermissionMatrix',
      states: [],
      prefix:
        'role-definition-permission'
    })
    renderModuleMatrix({
      containerId:
        'roleDefinitionModuleMatrix',
      states: [],
      prefix:
        'role-definition-module'
    })
    return
  }

  const model =
    await loadRoleAccessModel(
      roleId,
      lookups.permissions
    )

  roleDefinitionPermissionStates =
    model.permissionStates
  roleDefinitionModuleStates =
    model.moduleStates

  renderPermissionMatrix({
    containerId:
      'roleDefinitionPermissionMatrix',
    states:
      roleDefinitionPermissionStates,
    prefix:
      'role-definition-permission'
  })
  renderModuleMatrix({
    containerId:
      'roleDefinitionModuleMatrix',
    states:
      roleDefinitionModuleStates,
    prefix:
      'role-definition-module'
  })
}

async function openRoleDefinitionModal() {
  showFeedback(
    'roleDefinitionError',
    ''
  )
  setValue(
    'roleDefinitionRoleId',
    ''
  )
  roleDefinitionPermissionStates = []
  roleDefinitionModuleStates = []
  renderPermissionMatrix({
    containerId:
      'roleDefinitionPermissionMatrix',
    states: [],
    prefix:
      'role-definition-permission'
  })
  renderModuleMatrix({
    containerId:
      'roleDefinitionModuleMatrix',
    states: [],
    prefix:
      'role-definition-module'
  })
  showModal(
    'roleDefinitionModal'
  )
}

async function saveRoleDefinition() {
  showFeedback(
    'roleDefinitionError',
    ''
  )

  try {
    const userRoleId =
      getValue(
        'roleDefinitionRoleId'
      )

    if (!userRoleId) {
      throw new Error(
        'Choose an access role.'
      )
    }

    await saveRoleAccessModel({
      userRoleId,
      permissionStates:
        readPermissionMatrix(
          'roleDefinitionPermissionMatrix',
          roleDefinitionPermissionStates
        ),
      moduleStates:
        readModuleMatrix(
          'roleDefinitionModuleMatrix',
          roleDefinitionModuleStates
        )
    })

    hideModal(
      'roleDefinitionModal'
    )
    await loadRows()
    showFeedback(
      'assignmentPageFeedback',
      'Access role definition saved. Departments using this role now inherit the updated baseline unless an explicit department/profile override says otherwise.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'roleDefinitionError',
      error.message || String(error)
    )
  }
}

async function loadDepartmentSelection() {
  const departmentId =
    getValue('assignmentDepartmentId')

  departmentPermissionStates = []
  departmentModuleStates = []

  if (!departmentId) {
    setValue('assignmentAccessRoleId', '')
    setValue('assignmentIsActive', 'true')
    renderPermissionMatrix({
      containerId: 'departmentPermissionMatrix',
      states: [],
      prefix: 'department-permission'
    })
    renderModuleMatrix({
      containerId: 'departmentModuleMatrix',
      states: [],
      prefix: 'department-module'
    })
    return
  }

  const model =
    await loadDepartmentAccessModel(
      departmentId
    )

  if (!model.policy?.user_role_id) {
    setValue('assignmentAccessRoleId', '')
    setValue('assignmentIsActive', 'true')
    renderPermissionMatrix({
      containerId: 'departmentPermissionMatrix',
      states: [],
      prefix: 'department-permission'
    })
    renderModuleMatrix({
      containerId: 'departmentModuleMatrix',
      states: [],
      prefix: 'department-module'
    })
    return
  }

  setValue(
    'assignmentAccessRoleId',
    model.policy.user_role_id
  )
  setValue(
    'assignmentIsActive',
    model.policy.is_active ? 'true' : 'false'
  )
  departmentPermissionStates =
    model.permissionStates
  departmentModuleStates =
    model.moduleStates

  renderPermissionMatrix({
    containerId: 'departmentPermissionMatrix',
    states: departmentPermissionStates,
    prefix: 'department-permission'
  })
  renderModuleMatrix({
    containerId: 'departmentModuleMatrix',
    states: departmentModuleStates,
    prefix: 'department-module'
  })
}

async function openDepartmentModal(
  departmentId = ''
) {
  showFeedback(
    'assignmentFormError',
    ''
  )

  setValue(
    'assignmentDepartmentId',
    departmentId
  )
  setValue(
    'assignmentAccessRoleId',
    ''
  )
  setValue(
    'assignmentIsActive',
    'true'
  )

  departmentPermissionStates = []
  departmentModuleStates = []

  get('departmentPermissionMatrix').innerHTML =
    '<div class="text-muted">Choose a department and access role.</div>'
  get('departmentModuleMatrix').innerHTML =
    '<div class="text-muted">Choose a department and access role.</div>'

  if (departmentId) {
    await loadDepartmentSelection()
  }

  showModal(
    'assignmentModal'
  )
}

async function reloadDepartmentRoleDefaults() {
  const roleId =
    getValue(
      'assignmentAccessRoleId'
    )

  if (!roleId) {
    departmentPermissionStates = []
    departmentModuleStates = []
    renderPermissionMatrix({
      containerId:
        'departmentPermissionMatrix',
      states: [],
      prefix:
        'department-permission'
    })
    renderModuleMatrix({
      containerId:
        'departmentModuleMatrix',
      states: [],
      prefix:
        'department-module'
    })
    return
  }

  const model =
    await loadRoleAccessModel(
      roleId,
      lookups.permissions
    )

  departmentPermissionStates =
    model.permissionStates
  departmentModuleStates =
    model.moduleStates

  renderPermissionMatrix({
    containerId:
      'departmentPermissionMatrix',
    states:
      departmentPermissionStates,
    prefix:
      'department-permission'
  })
  renderModuleMatrix({
    containerId:
      'departmentModuleMatrix',
    states:
      departmentModuleStates,
    prefix:
      'department-module'
  })
}

async function saveDepartmentPolicy() {
  showFeedback(
    'assignmentFormError',
    ''
  )

  try {
    const departmentId =
      getValue('assignmentDepartmentId')
    const userRoleId =
      getValue('assignmentAccessRoleId')

    if (!departmentId) {
      throw new Error(
        'Department is required.'
      )
    }

    if (!userRoleId) {
      throw new Error(
        'Access role is required.'
      )
    }

    await saveDepartmentAccess({
      departmentId,
      userRoleId,
      isActive:
        getValue('assignmentIsActive') === 'true',
      permissionStates:
        readPermissionMatrix(
          'departmentPermissionMatrix',
          departmentPermissionStates
        ),
      moduleStates:
        readModuleMatrix(
          'departmentModuleMatrix',
          departmentModuleStates
        )
    })

    hideModal(
      'assignmentModal'
    )
    await loadRows()
    showFeedback(
      'assignmentPageFeedback',
      'Department access saved successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'assignmentFormError',
      error.message || String(error)
    )
  }
}

function staffForDepartment(
  departmentId
) {
  return lookups.staff.filter(
    person =>
      person.department_id === departmentId
  )
}

function populateIndividualStaff() {
  const departmentId =
    getValue(
      'individualDepartmentId'
    )

  const staff =
    staffForDepartment(
      departmentId
    )
      .map(person => ({
        ...person,
        display_name:
          `${person.staff_code || ''} - ${person.first_name || ''} ${person.last_name || ''}`.trim()
      }))

  populateSelect(
    'individualStaffId',
    staff,
    'staff_id',
    'display_name',
    'Select staff member to customize'
  )

  individualModel = null
  individualPermissionStates = []
  individualModuleStates = []
  get('individualAccessDetails')
    ?.classList
    .add('d-none')
}

async function loadSelectedIndividual() {
  showFeedback(
    'individualAccessError',
    ''
  )

  const staffId =
    getValue('individualStaffId')

  const person =
    lookups.staff.find(
      row => row.staff_id === staffId
    )

  if (!person) {
    get('individualAccessDetails')
      ?.classList
      .add('d-none')
    return
  }

  if (!person.profile_id) {
    get('individualAccessDetails')
      ?.classList
      .add('d-none')
    throw new Error(
      'This staff member has no linked profile. Use the Profiles button on the Staff page to create/link the profile before customizing access.'
    )
  }

  individualModel =
    await loadIndividualAccessModel(
      person.profile_id
    )

  setValue(
    'individualProfileId',
    person.profile_id
  )

  const inherit =
    individualModel.inheritDepartmentRole

  get('inheritDepartmentRole').checked =
    inherit

  setValue(
    'individualAccessRoleId',
    inherit ?
      '' :
      individualModel.userRoleIdOverride
  )

  get('individualAccessRoleId').disabled =
    inherit

  setText(
    'individualBaselineInfo',
    inherit ?
      `Base role: ${roleName(individualModel.departmentModel.policy?.user_role_id) || 'Department not configured'}. Only deviations are stored for this profile.` :
      `Custom base role: ${roleName(individualModel.userRoleIdOverride)}. Department overrides still apply before profile-specific overrides.`
  )

  individualPermissionStates =
    individualModel.permissionStates
  individualModuleStates =
    individualModel.moduleStates

  renderPermissionMatrix({
    containerId:
      'individualPermissionMatrix',
    states:
      individualPermissionStates,
    prefix:
      'individual-permission'
  })
  renderModuleMatrix({
    containerId:
      'individualModuleMatrix',
    states:
      individualModuleStates,
    prefix:
      'individual-module'
  })

  get('individualAccessDetails')
    ?.classList
    .remove('d-none')
}

async function reloadIndividualRoleBaseline() {
  if (!individualModel) {
    return
  }

  const inherit =
    get('inheritDepartmentRole').checked
  const roleId =
    inherit ?
      individualModel.departmentModel.policy?.user_role_id :
      getValue('individualAccessRoleId')

  if (!roleId) {
    return
  }

  const roleBase =
    await loadRoleAccessModel(
      roleId,
      lookups.permissions
    )

  const departmentModel =
    await loadDepartmentAccessModel(
      individualModel.staff.department_id
    )

  const departmentPermissionOverrideMap = new Map(
    departmentModel.permissionStates
      .filter(row => row.inherited === false)
      .map(row => [row.permission_id, row.allowed])
  )

  individualPermissionStates =
    roleBase.permissionStates.map(
      row => ({
        ...row,
        allowed:
          departmentPermissionOverrideMap.has(row.permission_id) ?
            departmentPermissionOverrideMap.get(row.permission_id) :
            row.allowed
      })
    )

  const departmentModuleOverrideMap = new Map(
    departmentModel.moduleStates
      .filter(row => row.inherited === false)
      .map(row => [row.module_code, row])
  )

  const roleModuleMap = new Map(
    roleBase.moduleStates.map(
      row => [row.module_code, row]
    )
  )

  const moduleCodes = new Set([
    ...roleModuleMap.keys(),
    ...departmentModuleOverrideMap.keys()
  ])

  individualModuleStates =
    [...moduleCodes]
      .sort()
      .map(moduleCode => ({
        module_code: moduleCode,
        ...(departmentModuleOverrideMap.get(moduleCode) ||
          roleModuleMap.get(moduleCode) || {
            can_view: false,
            can_create: false,
            can_update: false,
            can_delete: false
          })
      }))

  renderPermissionMatrix({
    containerId:
      'individualPermissionMatrix',
    states:
      individualPermissionStates,
    prefix:
      'individual-permission'
  })
  renderModuleMatrix({
    containerId:
      'individualModuleMatrix',
    states:
      individualModuleStates,
    prefix:
      'individual-module'
  })
}

async function saveIndividualPolicy() {
  showFeedback(
    'individualAccessError',
    ''
  )

  try {
    const profileId =
      getValue('individualProfileId')
    const inheritDepartmentRole =
      Boolean(
        get('inheritDepartmentRole')
          ?.checked
      )
    const userRoleIdOverride =
      getValue('individualAccessRoleId') || null

    if (!profileId) {
      throw new Error(
        'Choose a staff member with a linked profile.'
      )
    }

    await saveIndividualAccess({
      profileId,
      inheritDepartmentRole,
      userRoleIdOverride,
      permissionStates:
        readPermissionMatrix(
          'individualPermissionMatrix',
          individualPermissionStates
        ),
      moduleStates:
        readModuleMatrix(
          'individualModuleMatrix',
          individualModuleStates
        )
    })

    hideModal(
      'individualAccessModal'
    )
    await loadRows()
    showFeedback(
      'assignmentPageFeedback',
      'Individual access customization saved successfully.',
      'success'
    )
  } catch (error) {
    showFeedback(
      'individualAccessError',
      error.message || String(error)
    )
  }
}

async function initialize() {
  try {
    lookups =
      await loadAccessLookups()

    populateSelect(
      'assignmentDepartmentId',
      lookups.departments,
      'department_id',
      'department_name',
      'Select Department'
    )
    populateSelect(
      'assignmentAccessRoleId',
      lookups.roles,
      'user_role_id',
      'role_name',
      'Select Access Role'
    )
    populateSelect(
      'roleDefinitionRoleId',
      lookups.roles,
      'user_role_id',
      'role_name',
      'Select Access Role'
    )
    populateSelect(
      'individualDepartmentId',
      lookups.departments,
      'department_id',
      'department_name',
      'Select Department'
    )
    populateSelect(
      'individualAccessRoleId',
      lookups.roles,
      'user_role_id',
      'role_name',
      'Select Custom Access Role'
    )

    bindPagination({
      paginator,
      previousButtonId:
        'btnPreviousAssignmentPage',
      nextButtonId:
        'btnNextAssignmentPage',
      infoElementId:
        'assignmentPaginationInfo',
      onChange:
        renderRows
    })

    get('searchAssignment')
      ?.addEventListener(
        'input',
        applySearch
      )

    get('btnRefreshAssignments')
      ?.addEventListener(
        'click',
        loadRows
      )

    get('btnAddAssignment')
      ?.addEventListener(
        'click',
        () => openDepartmentModal()
      )

    get('btnManageAccessRoles')
      ?.addEventListener(
        'click',
        () => {
          openRoleDefinitionModal()
            .catch(error =>
              showFeedback(
                'roleDefinitionError',
                error.message || String(error)
              )
            )
        }
      )

    get('roleDefinitionRoleId')
      ?.addEventListener(
        'change',
        () => {
          loadRoleDefinition()
            .catch(error =>
              showFeedback(
                'roleDefinitionError',
                error.message || String(error)
              )
            )
        }
      )

    get('btnSaveRoleDefinition')
      ?.addEventListener(
        'click',
        saveRoleDefinition
      )

    get('btnCustomizeIndividual')
      ?.addEventListener(
        'click',
        () => {
          setValue(
            'individualDepartmentId',
            ''
          )
          populateIndividualStaff()
          showFeedback(
            'individualAccessError',
            ''
          )
          showModal(
            'individualAccessModal'
          )
        }
      )

    get('assignmentDepartmentId')
      ?.addEventListener(
        'change',
        () => {
          loadDepartmentSelection()
            .catch(error =>
              showFeedback(
                'assignmentFormError',
                error.message || String(error)
              )
            )
        }
      )

    get('assignmentAccessRoleId')
      ?.addEventListener(
        'change',
        reloadDepartmentRoleDefaults
      )

    get('btnSaveAssignment')
      ?.addEventListener(
        'click',
        saveDepartmentPolicy
      )

    get('individualDepartmentId')
      ?.addEventListener(
        'change',
        populateIndividualStaff
      )

    get('individualStaffId')
      ?.addEventListener(
        'change',
        async () => {
          try {
            await loadSelectedIndividual()
          } catch (error) {
            showFeedback(
              'individualAccessError',
              error.message || String(error)
            )
          }
        }
      )

    get('inheritDepartmentRole')
      ?.addEventListener(
        'change',
        async event => {
          const inherit =
            event.target.checked
          get('individualAccessRoleId').disabled =
            inherit

          if (!inherit) {
            setValue(
              'individualAccessRoleId',
              individualModel?.effectiveRoleId || ''
            )
          }

          await reloadIndividualRoleBaseline()
        }
      )

    get('individualAccessRoleId')
      ?.addEventListener(
        'change',
        reloadIndividualRoleBaseline
      )

    get('btnSaveIndividualAccess')
      ?.addEventListener(
        'click',
        saveIndividualPolicy
      )

    window.editDepartmentAccess =
      openDepartmentModal

    await loadRows()
  } catch (error) {
    showFeedback(
      'assignmentPageFeedback',
      error.message || String(error)
    )
  }
}

document.addEventListener(
  'DOMContentLoaded',
  initialize
)
