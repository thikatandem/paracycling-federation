import {
  getDb
} from '../supabase/getDb.js'

import {
  getProfile
} from '../auth/authStateService.js'

function actorId() {
  return getProfile()?.profile_id || null
}

function now() {
  return new Date().toISOString()
}

function requireValue(
  value,
  label
) {
  if (!String(value || '').trim()) {
    throw new Error(
      `${label} is required.`
    )
  }
}

function normalizeModuleState(
  row = {}
) {
  return {
    module_code:
      row.module_code,
    can_view:
      Boolean(row.can_view),
    can_create:
      Boolean(row.can_create),
    can_update:
      Boolean(row.can_update),
    can_delete:
      Boolean(row.can_delete)
  }
}

function sameModuleState(
  first,
  second
) {
  return (
    Boolean(first?.can_view) ===
      Boolean(second?.can_view) &&
    Boolean(first?.can_create) ===
      Boolean(second?.can_create) &&
    Boolean(first?.can_update) ===
      Boolean(second?.can_update) &&
    Boolean(first?.can_delete) ===
      Boolean(second?.can_delete)
  )
}

export async function loadAccessLookups() {
  const [
    departmentResult,
    roleResult,
    permissionResult,
    staffResult
  ] = await Promise.all([
    getDb()
      .from('department_master')
      .select(`
        department_id,
        department_code,
        department_name,
        is_active
      `)
      .order('department_name'),
    getDb()
      .from('user_role_master')
      .select(`
        user_role_id,
        role_code,
        role_name
      `)
      .order('role_name'),
    getDb()
      .from('permission_master')
      .select(`
        permission_id,
        permission_code,
        permission_name,
        module_code,
        description,
        is_active
      `)
      .eq('is_active', true)
      .order('module_code')
      .order('permission_name'),
    getDb()
      .from('staff_registry')
      .select(`
        staff_id,
        staff_code,
        first_name,
        last_name,
        department_id,
        profile_id,
        email,
        is_active
      `)
      .eq('is_active', true)
      .order('last_name')
  ])

  for (const result of [
    departmentResult,
    roleResult,
    permissionResult,
    staffResult
  ]) {
    if (result.error) {
      throw result.error
    }
  }

  return {
    departments:
      departmentResult.data || [],
    roles:
      roleResult.data || [],
    permissions:
      permissionResult.data || [],
    staff:
      staffResult.data || []
  }
}

export async function loadDepartmentAccessRows() {
  const [
    lookups,
    policyResult,
    permissionOverrideResult,
    moduleOverrideResult,
    settingsResult
  ] = await Promise.all([
    loadAccessLookups(),
    getDb()
      .from('department_access_policy')
      .select('*'),
    getDb()
      .from('department_permission_overrides')
      .select('department_id, permission_id, is_allowed'),
    getDb()
      .from('department_module_overrides')
      .select('department_id, module_code'),
    getDb()
      .from('staff_access_settings')
      .select('profile_id, inherit_department_role')
  ])

  for (const result of [
    policyResult,
    permissionOverrideResult,
    moduleOverrideResult,
    settingsResult
  ]) {
    if (result.error) {
      throw result.error
    }
  }

  const policyMap = new Map(
    (policyResult.data || []).map(
      row => [row.department_id, row]
    )
  )

  const roleMap = new Map(
    lookups.roles.map(
      role => [role.user_role_id, role]
    )
  )

  const permissionCount = new Map()
  for (const row of permissionOverrideResult.data || []) {
    permissionCount.set(
      row.department_id,
      (permissionCount.get(row.department_id) || 0) + 1
    )
  }

  const moduleCount = new Map()
  for (const row of moduleOverrideResult.data || []) {
    moduleCount.set(
      row.department_id,
      (moduleCount.get(row.department_id) || 0) + 1
    )
  }

  const staffByDepartment = new Map()
  const profileDepartment = new Map()

  for (const person of lookups.staff) {
    if (!person.department_id) {
      continue
    }

    staffByDepartment.set(
      person.department_id,
      (staffByDepartment.get(person.department_id) || 0) + 1
    )

    if (person.profile_id) {
      profileDepartment.set(
        person.profile_id,
        person.department_id
      )
    }
  }

  const customCount = new Map()
  for (const setting of settingsResult.data || []) {
    if (setting.inherit_department_role !== false) {
      continue
    }

    const departmentId =
      profileDepartment.get(setting.profile_id)

    if (departmentId) {
      customCount.set(
        departmentId,
        (customCount.get(departmentId) || 0) + 1
      )
    }
  }

  return lookups.departments.map(
    department => {
      const policy =
        policyMap.get(department.department_id)

      const role =
        roleMap.get(policy?.user_role_id)

      return {
        ...department,
        user_role_id:
          policy?.user_role_id || null,
        role_name:
          role?.role_name || '',
        role_code:
          role?.role_code || '',
        access_active:
          Boolean(policy?.is_active),
        staff_count:
          staffByDepartment.get(
            department.department_id
          ) || 0,
        custom_profile_count:
          customCount.get(
            department.department_id
          ) || 0,
        permission_override_count:
          permissionCount.get(
            department.department_id
          ) || 0,
        module_override_count:
          moduleCount.get(
            department.department_id
          ) || 0
      }
    }
  )
}

export async function loadRoleAccessModel(
  userRoleId,
  permissions = null
) {
  const permissionRows =
    permissions ||
    (await loadAccessLookups()).permissions

  const [
    rolePermissionResult,
    moduleResult
  ] = await Promise.all([
    getDb()
      .from('role_permissions')
      .select('permission_id')
      .eq('user_role_id', userRoleId),
    getDb()
      .from('module_permissions')
      .select(`
        module_code,
        can_view,
        can_create,
        can_update,
        can_delete
      `)
      .eq('user_role_id', userRoleId)
  ])

  if (rolePermissionResult.error) {
    throw rolePermissionResult.error
  }

  if (moduleResult.error) {
    throw moduleResult.error
  }

  const rolePermissionIds = new Set(
    (rolePermissionResult.data || [])
      .map(row => row.permission_id)
  )

  const permissionStates =
    permissionRows.map(
      permission => ({
        ...permission,
        allowed:
          rolePermissionIds.has(
            permission.permission_id
          ),
        inherited:
          true
      })
    )

  const moduleMap = new Map(
    (moduleResult.data || []).map(
      row => [
        row.module_code,
        normalizeModuleState(row)
      ]
    )
  )

  const moduleCodes = new Set([
    ...permissionRows
      .map(row => row.module_code)
      .filter(Boolean),
    ...moduleMap.keys()
  ])

  const moduleStates =
    [...moduleCodes]
      .sort()
      .map(moduleCode => ({
        module_code:
          moduleCode,
        ...(moduleMap.get(moduleCode) || {
          can_view: false,
          can_create: false,
          can_update: false,
          can_delete: false
        })
      }))

  return {
    permissionStates,
    moduleStates
  }
}

export async function saveRoleAccessModel({
  userRoleId,
  permissionStates = [],
  moduleStates = []
}) {
  requireValue(
    userRoleId,
    'Access role'
  )

  const permissionIds =
    permissionStates
      .filter(row => Boolean(row.allowed))
      .map(row => row.permission_id)
      .filter(Boolean)

  const modules =
    moduleStates
      .filter(row => row.module_code)
      .map(normalizeModuleState)

  const {
    error
  } = await getDb()
    .rpc(
      'replace_user_role_access',
      {
        p_user_role_id:
          userRoleId,
        p_permission_ids:
          permissionIds,
        p_modules:
          modules,
        p_actor:
          actorId()
      }
    )

  if (error) {
    throw error
  }
}

export async function loadDepartmentAccessModel(
  departmentId
) {
  requireValue(
    departmentId,
    'Department'
  )

  const lookups =
    await loadAccessLookups()

  const {
    data: policy,
    error: policyError
  } = await getDb()
    .from('department_access_policy')
    .select('*')
    .eq('department_id', departmentId)
    .maybeSingle()

  if (policyError) {
    throw policyError
  }

  if (!policy?.user_role_id) {
    return {
      departmentId,
      policy: null,
      permissionStates:
        lookups.permissions.map(
          permission => ({
            ...permission,
            allowed: false,
            inherited: true
          })
        ),
      moduleStates: []
    }
  }

  const base =
    await loadRoleAccessModel(
      policy.user_role_id,
      lookups.permissions
    )

  const [
    permissionOverrideResult,
    moduleOverrideResult
  ] = await Promise.all([
    getDb()
      .from('department_permission_overrides')
      .select('permission_id, is_allowed')
      .eq('department_id', departmentId),
    getDb()
      .from('department_module_overrides')
      .select(`
        module_code,
        can_view,
        can_create,
        can_update,
        can_delete
      `)
      .eq('department_id', departmentId)
  ])

  if (permissionOverrideResult.error) {
    throw permissionOverrideResult.error
  }

  if (moduleOverrideResult.error) {
    throw moduleOverrideResult.error
  }

  const permissionOverrideMap = new Map(
    (permissionOverrideResult.data || []).map(
      row => [row.permission_id, row.is_allowed]
    )
  )

  const permissionStates =
    base.permissionStates.map(
      permission => {
        if (
          !permissionOverrideMap.has(
            permission.permission_id
          )
        ) {
          return permission
        }

        return {
          ...permission,
          allowed:
            permissionOverrideMap.get(
              permission.permission_id
            ),
          inherited: false
        }
      }
    )

  const moduleOverrideMap = new Map(
    (moduleOverrideResult.data || []).map(
      row => [row.module_code, row]
    )
  )

  const moduleCodes = new Set([
    ...base.moduleStates.map(
      row => row.module_code
    ),
    ...moduleOverrideMap.keys()
  ])

  const baseModuleMap = new Map(
    base.moduleStates.map(
      row => [row.module_code, row]
    )
  )

  const moduleStates =
    [...moduleCodes]
      .sort()
      .map(moduleCode => {
        const inherited =
          baseModuleMap.get(moduleCode) || {
            module_code: moduleCode,
            can_view: false,
            can_create: false,
            can_update: false,
            can_delete: false
          }

        const override =
          moduleOverrideMap.get(moduleCode)

        return {
          module_code:
            moduleCode,
          ...(override ?
            normalizeModuleState(override) :
            normalizeModuleState(inherited)),
          inherited:
            !override
        }
      })

  return {
    departmentId,
    policy,
    permissionStates,
    moduleStates
  }
}

async function replacePermissionOverrides({
  table,
  ownerField,
  ownerId,
  currentStates,
  baseStates
}) {
  const baseMap = new Map(
    baseStates.map(
      row => [
        row.permission_id,
        Boolean(row.allowed)
      ]
    )
  )

  const overrides =
    currentStates
      .filter(
        row =>
          Boolean(row.allowed) !==
          Boolean(
            baseMap.get(row.permission_id)
          )
      )
      .map(row => ({
        [ownerField]: ownerId,
        permission_id:
          row.permission_id,
        is_allowed:
          Boolean(row.allowed),
        created_by:
          actorId(),
        updated_by:
          actorId(),
        updated_at:
          now()
      }))

  const deleteResult =
    await getDb()
      .from(table)
      .delete()
      .eq(ownerField, ownerId)

  if (deleteResult.error) {
    throw deleteResult.error
  }

  if (!overrides.length) {
    return
  }

  const insertResult =
    await getDb()
      .from(table)
      .insert(overrides)

  if (insertResult.error) {
    throw insertResult.error
  }
}

async function replaceModuleOverrides({
  table,
  ownerField,
  ownerId,
  currentStates,
  baseStates
}) {
  const baseMap = new Map(
    baseStates.map(
      row => [row.module_code, row]
    )
  )

  const overrides =
    currentStates
      .filter(row => {
        const baseline =
          baseMap.get(row.module_code) || {
            can_view: false,
            can_create: false,
            can_update: false,
            can_delete: false
          }

        return !sameModuleState(
          row,
          baseline
        )
      })
      .map(row => ({
        [ownerField]: ownerId,
        module_code:
          row.module_code,
        can_view:
          Boolean(row.can_view),
        can_create:
          Boolean(row.can_create),
        can_update:
          Boolean(row.can_update),
        can_delete:
          Boolean(row.can_delete),
        created_by:
          actorId(),
        updated_by:
          actorId(),
        updated_at:
          now()
      }))

  const deleteResult =
    await getDb()
      .from(table)
      .delete()
      .eq(ownerField, ownerId)

  if (deleteResult.error) {
    throw deleteResult.error
  }

  if (!overrides.length) {
    return
  }

  const insertResult =
    await getDb()
      .from(table)
      .insert(overrides)

  if (insertResult.error) {
    throw insertResult.error
  }
}

export async function syncDepartmentProfiles(
  departmentId
) {
  const {
    data: policy,
    error: policyError
  } = await getDb()
    .from('department_access_policy')
    .select('user_role_id, is_active')
    .eq('department_id', departmentId)
    .maybeSingle()

  if (policyError) {
    throw policyError
  }

  if (!policy) {
    return 0
  }

  const {
    data: staff,
    error: staffError
  } = await getDb()
    .from('staff_registry')
    .select('profile_id')
    .eq('department_id', departmentId)
    .not('profile_id', 'is', null)

  if (staffError) {
    throw staffError
  }

  const profileIds =
    (staff || [])
      .map(row => row.profile_id)
      .filter(Boolean)

  if (!profileIds.length) {
    return 0
  }

  const {
    data: settings,
    error: settingsError
  } = await getDb()
    .from('staff_access_settings')
    .select(`
      profile_id,
      inherit_department_role
    `)
    .in('profile_id', profileIds)

  if (settingsError) {
    throw settingsError
  }

  const customProfiles = new Set(
    (settings || [])
      .filter(
        row =>
          row.inherit_department_role === false
      )
      .map(row => row.profile_id)
  )

  const inheritedProfiles =
    profileIds.filter(
      profileId =>
        !customProfiles.has(profileId)
    )

  if (!inheritedProfiles.length) {
    return 0
  }

  const updateResult =
    await getDb()
      .from('profiles')
      .update({
        user_role_id:
          policy.is_active ?
            policy.user_role_id :
            null
      })
      .in('profile_id', inheritedProfiles)

  if (updateResult.error) {
    throw updateResult.error
  }

  return inheritedProfiles.length
}

export async function saveDepartmentAccess({
  departmentId,
  userRoleId,
  isActive = true,
  permissionStates = [],
  moduleStates = []
}) {
  requireValue(
    departmentId,
    'Department'
  )
  requireValue(
    userRoleId,
    'Access role'
  )

  const base =
    await loadRoleAccessModel(
      userRoleId
    )

  const policyPayload = {
    department_id:
      departmentId,
    user_role_id:
      userRoleId,
    is_active:
      Boolean(isActive),
    updated_by:
      actorId(),
    updated_at:
      now()
  }

  const {
    data: existingPolicy,
    error: existingPolicyError
  } = await getDb()
    .from('department_access_policy')
    .select('department_id')
    .eq('department_id', departmentId)
    .maybeSingle()

  if (existingPolicyError) {
    throw existingPolicyError
  }

  if (existingPolicy) {
    const result =
      await getDb()
        .from('department_access_policy')
        .update(policyPayload)
        .eq('department_id', departmentId)

    if (result.error) {
      throw result.error
    }
  } else {
    const result =
      await getDb()
        .from('department_access_policy')
        .insert({
          ...policyPayload,
          created_by:
            actorId()
        })

    if (result.error) {
      throw result.error
    }
  }

  await replacePermissionOverrides({
    table:
      'department_permission_overrides',
    ownerField:
      'department_id',
    ownerId:
      departmentId,
    currentStates:
      permissionStates,
    baseStates:
      base.permissionStates
  })

  await replaceModuleOverrides({
    table:
      'department_module_overrides',
    ownerField:
      'department_id',
    ownerId:
      departmentId,
    currentStates:
      moduleStates,
    baseStates:
      base.moduleStates
  })

  await syncDepartmentProfiles(
    departmentId
  )
}

export async function syncStaffAccessByStaffId(
  staffId
) {
  if (!staffId) {
    return null
  }

  const {
    data: staff,
    error: staffError
  } = await getDb()
    .from('staff_registry')
    .select(`
      staff_id,
      department_id,
      profile_id
    `)
    .eq('staff_id', staffId)
    .maybeSingle()

  if (staffError) {
    throw staffError
  }

  if (!staff?.profile_id) {
    return null
  }

  const {
    data: setting,
    error: settingError
  } = await getDb()
    .from('staff_access_settings')
    .select('*')
    .eq('profile_id', staff.profile_id)
    .maybeSingle()

  if (settingError) {
    throw settingError
  }

  let userRoleId = null

  if (
    setting?.inherit_department_role === false &&
    setting.user_role_id_override
  ) {
    userRoleId =
      setting.user_role_id_override
  } else if (staff.department_id) {
    const {
      data: policy,
      error: policyError
    } = await getDb()
      .from('department_access_policy')
      .select('user_role_id, is_active')
      .eq('department_id', staff.department_id)
      .maybeSingle()

    if (policyError) {
      throw policyError
    }

    if (policy?.is_active) {
      userRoleId =
        policy.user_role_id
    }
  }

  const updateResult =
    await getDb()
      .from('profiles')
      .update({
        user_role_id:
          userRoleId
      })
      .eq('profile_id', staff.profile_id)

  if (updateResult.error) {
    throw updateResult.error
  }

  return userRoleId
}


async function applyDepartmentOverridesToRoleBase(
  departmentId,
  roleBase
) {
  const [
    permissionOverrideResult,
    moduleOverrideResult
  ] = await Promise.all([
    getDb()
      .from('department_permission_overrides')
      .select('permission_id, is_allowed')
      .eq('department_id', departmentId),
    getDb()
      .from('department_module_overrides')
      .select(`
        module_code,
        can_view,
        can_create,
        can_update,
        can_delete
      `)
      .eq('department_id', departmentId)
  ])

  if (permissionOverrideResult.error) {
    throw permissionOverrideResult.error
  }

  if (moduleOverrideResult.error) {
    throw moduleOverrideResult.error
  }

  const permissionOverrideMap = new Map(
    (permissionOverrideResult.data || []).map(
      row => [row.permission_id, row.is_allowed]
    )
  )

  const permissionStates =
    roleBase.permissionStates.map(
      row => ({
        ...row,
        allowed:
          permissionOverrideMap.has(row.permission_id) ?
            permissionOverrideMap.get(row.permission_id) :
            row.allowed
      })
    )

  const roleModuleMap = new Map(
    roleBase.moduleStates.map(
      row => [row.module_code, row]
    )
  )
  const departmentModuleMap = new Map(
    (moduleOverrideResult.data || []).map(
      row => [row.module_code, row]
    )
  )
  const moduleCodes = new Set([
    ...roleModuleMap.keys(),
    ...departmentModuleMap.keys()
  ])

  const moduleStates =
    [...moduleCodes]
      .sort()
      .map(moduleCode => ({
        module_code: moduleCode,
        ...normalizeModuleState(
          departmentModuleMap.get(moduleCode) ||
          roleModuleMap.get(moduleCode) || {
            module_code: moduleCode
          }
        )
      }))

  return {
    permissionStates,
    moduleStates
  }
}

export async function loadIndividualAccessModel(
  profileId
) {
  requireValue(
    profileId,
    'Profile'
  )

  const [
    staffResult,
    settingResult,
    profileResult
  ] = await Promise.all([
    getDb()
      .from('staff_registry')
      .select(`
        staff_id,
        department_id,
        profile_id,
        staff_code,
        first_name,
        last_name
      `)
      .eq('profile_id', profileId)
      .single(),
    getDb()
      .from('staff_access_settings')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle(),
    getDb()
      .from('profiles')
      .select(`
        profile_id,
        user_role_id,
        email,
        full_name
      `)
      .eq('profile_id', profileId)
      .single()
  ])

  for (const result of [
    staffResult,
    settingResult,
    profileResult
  ]) {
    if (result.error) {
      throw result.error
    }
  }

  const staff = staffResult.data
  const setting = settingResult.data
  const departmentModel =
    await loadDepartmentAccessModel(
      staff.department_id
    )

  const inheritDepartmentRole =
    setting?.inherit_department_role !== false

  const effectiveRoleId =
    inheritDepartmentRole ?
      (
        departmentModel.policy?.is_active ?
          departmentModel.policy.user_role_id :
          null
      ) :
      setting?.user_role_id_override

  const roleBase =
    effectiveRoleId ?
      await loadRoleAccessModel(
        effectiveRoleId
      ) :
      {
        permissionStates: [],
        moduleStates: []
      }

  const baseline =
    await applyDepartmentOverridesToRoleBase(
      staff.department_id,
      roleBase
    )

  const baselinePermissions =
    baseline.permissionStates

  const baselineModules =
    baseline.moduleStates

  const [
    permissionOverrideResult,
    moduleOverrideResult
  ] = await Promise.all([
    getDb()
      .from('profile_permission_overrides')
      .select('permission_id, is_allowed')
      .eq('profile_id', profileId),
    getDb()
      .from('profile_module_overrides')
      .select(`
        module_code,
        can_view,
        can_create,
        can_update,
        can_delete
      `)
      .eq('profile_id', profileId)
  ])

  if (permissionOverrideResult.error) {
    throw permissionOverrideResult.error
  }

  if (moduleOverrideResult.error) {
    throw moduleOverrideResult.error
  }

  const permissionOverrideMap = new Map(
    (permissionOverrideResult.data || []).map(
      row => [row.permission_id, row.is_allowed]
    )
  )

  const permissionStates =
    baselinePermissions.map(
      row => ({
        ...row,
        allowed:
          permissionOverrideMap.has(
            row.permission_id
          ) ?
            permissionOverrideMap.get(
              row.permission_id
            ) :
            row.allowed,
        inherited:
          !permissionOverrideMap.has(
            row.permission_id
          )
      })
    )

  const moduleOverrideMap = new Map(
    (moduleOverrideResult.data || []).map(
      row => [row.module_code, row]
    )
  )

  const moduleStates =
    baselineModules.map(
      row => ({
        module_code:
          row.module_code,
        ...normalizeModuleState(
          moduleOverrideMap.get(row.module_code) ||
          row
        ),
        inherited:
          !moduleOverrideMap.has(row.module_code)
      })
    )

  return {
    staff,
    profile:
      profileResult.data,
    departmentModel,
    inheritDepartmentRole,
    userRoleIdOverride:
      setting?.user_role_id_override || null,
    effectiveRoleId,
    permissionStates,
    baselinePermissions,
    moduleStates,
    baselineModules
  }
}

export async function saveIndividualAccess({
  profileId,
  inheritDepartmentRole = true,
  userRoleIdOverride = null,
  permissionStates = [],
  moduleStates = []
}) {
  requireValue(
    profileId,
    'Profile'
  )

  if (
    !inheritDepartmentRole &&
    !userRoleIdOverride
  ) {
    throw new Error(
      'Choose an access role when department-role inheritance is disabled.'
    )
  }

  const existing =
    await loadIndividualAccessModel(
      profileId
    )

  const settingsPayload = {
    profile_id:
      profileId,
    inherit_department_role:
      Boolean(inheritDepartmentRole),
    user_role_id_override:
      inheritDepartmentRole ?
        null :
        userRoleIdOverride,
    updated_by:
      actorId(),
    updated_at:
      now()
  }

  const {
    data: currentSetting,
    error: currentSettingError
  } = await getDb()
    .from('staff_access_settings')
    .select('profile_id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (currentSettingError) {
    throw currentSettingError
  }

  if (currentSetting) {
    const result =
      await getDb()
        .from('staff_access_settings')
        .update(settingsPayload)
        .eq('profile_id', profileId)

    if (result.error) {
      throw result.error
    }
  } else {
    const result =
      await getDb()
        .from('staff_access_settings')
        .insert({
          ...settingsPayload,
          created_by:
            actorId()
        })

    if (result.error) {
      throw result.error
    }
  }

  const refreshedBaseline =
    await loadIndividualAccessBaseline({
      profileId,
      inheritDepartmentRole,
      userRoleIdOverride
    })

  await replacePermissionOverrides({
    table:
      'profile_permission_overrides',
    ownerField:
      'profile_id',
    ownerId:
      profileId,
    currentStates:
      permissionStates,
    baseStates:
      refreshedBaseline.permissionStates
  })

  await replaceModuleOverrides({
    table:
      'profile_module_overrides',
    ownerField:
      'profile_id',
    ownerId:
      profileId,
    currentStates:
      moduleStates,
    baseStates:
      refreshedBaseline.moduleStates
  })

  await syncStaffAccessByStaffId(
    existing.staff.staff_id
  )
}

async function loadIndividualAccessBaseline({
  profileId,
  inheritDepartmentRole,
  userRoleIdOverride
}) {
  const {
    data: staff,
    error
  } = await getDb()
    .from('staff_registry')
    .select('department_id')
    .eq('profile_id', profileId)
    .single()

  if (error) {
    throw error
  }

  const department =
    await loadDepartmentAccessModel(
      staff.department_id
    )

  const roleId =
    inheritDepartmentRole ?
      (
        department.policy?.is_active ?
          department.policy.user_role_id :
          null
      ) :
      userRoleIdOverride

  const roleBase =
    roleId ?
      await loadRoleAccessModel(roleId) :
      {
        permissionStates: [],
        moduleStates: []
      }

  const baseline =
    await applyDepartmentOverridesToRoleBase(
      staff.department_id,
      roleBase
    )

  const permissionStates =
    baseline.permissionStates

  const moduleStates =
    baseline.moduleStates

  return {
    permissionStates,
    moduleStates
  }
}

export async function saveDepartment({
  departmentId = null,
  departmentCode,
  departmentName,
  isActive = true,
  defaultUserRoleId
}) {
  requireValue(
    departmentCode,
    'Department code'
  )
  requireValue(
    departmentName,
    'Department name'
  )
  requireValue(
    defaultUserRoleId,
    'Default access role'
  )

  const payload = {
    department_code:
      String(departmentCode).trim(),
    department_name:
      String(departmentName).trim(),
    is_active:
      Boolean(isActive)
  }

  let savedDepartmentId =
    departmentId

  if (departmentId) {
    const {
      error
    } = await getDb()
      .from('department_master')
      .update(payload)
      .eq('department_id', departmentId)

    if (error) {
      throw error
    }
  } else {
    const {
      data,
      error
    } = await getDb()
      .from('department_master')
      .insert(payload)
      .select('department_id')
      .single()

    if (error) {
      throw error
    }

    savedDepartmentId =
      data.department_id
  }

  const existingModel =
    await loadDepartmentAccessModel(
      savedDepartmentId
    )

  const roleChanged =
    existingModel.policy?.user_role_id !==
      defaultUserRoleId

  const permissionStates =
    roleChanged ?
      (await loadRoleAccessModel(
        defaultUserRoleId
      )).permissionStates :
      existingModel.permissionStates

  const moduleStates =
    roleChanged ?
      (await loadRoleAccessModel(
        defaultUserRoleId
      )).moduleStates :
      existingModel.moduleStates

  await saveDepartmentAccess({
    departmentId:
      savedDepartmentId,
    userRoleId:
      defaultUserRoleId,
    isActive:
      Boolean(isActive),
    permissionStates,
    moduleStates
  })

  return savedDepartmentId
}

export async function loadProfileAdministrationRows() {
  const [
    staffResult,
    profileResult,
    departmentResult,
    roleResult,
    settingsResult
  ] = await Promise.all([
    getDb()
      .from('staff_registry')
      .select(`
        staff_id,
        staff_code,
        first_name,
        last_name,
        email,
        department_id,
        profile_id,
        is_active
      `)
      .order('last_name'),
    getDb()
      .from('profiles')
      .select(`
        profile_id,
        email,
        full_name,
        user_role_id,
        portal_enabled,
        auth_user_id,
        account_status
      `),
    getDb()
      .from('department_master')
      .select('department_id, department_name'),
    getDb()
      .from('user_role_master')
      .select('user_role_id, role_name, role_code'),
    getDb()
      .from('staff_access_settings')
      .select(`
        profile_id,
        inherit_department_role,
        user_role_id_override
      `)
  ])

  for (const result of [
    staffResult,
    profileResult,
    departmentResult,
    roleResult,
    settingsResult
  ]) {
    if (result.error) {
      throw result.error
    }
  }

  const profileMap = new Map(
    (profileResult.data || []).map(
      row => [row.profile_id, row]
    )
  )

  const departmentMap = new Map(
    (departmentResult.data || []).map(
      row => [row.department_id, row]
    )
  )

  const roleMap = new Map(
    (roleResult.data || []).map(
      row => [row.user_role_id, row]
    )
  )

  const settingsMap = new Map(
    (settingsResult.data || []).map(
      row => [row.profile_id, row]
    )
  )

  return (staffResult.data || []).map(
    staff => {
      const profile =
        profileMap.get(staff.profile_id) || null
      const setting =
        settingsMap.get(staff.profile_id) || null
      const role =
        roleMap.get(profile?.user_role_id) || null

      return {
        ...staff,
        staff_name:
          `${staff.first_name || ''} ${staff.last_name || ''}`.trim(),
        department_name:
          departmentMap.get(
            staff.department_id
          )?.department_name || '',
        profile,
        role_name:
          role?.role_name || '',
        role_code:
          role?.role_code || '',
        access_source:
          setting?.inherit_department_role === false ?
            'Custom' :
            'Department'
      }
    }
  )
}

export async function createStaffProfile(
  staffId
) {
  requireValue(
    staffId,
    'Staff member'
  )

  const {
    data: staff,
    error: staffError
  } = await getDb()
    .from('staff_registry')
    .select(`
      staff_id,
      first_name,
      last_name,
      email,
      profile_id,
      department_id
    `)
    .eq('staff_id', staffId)
    .single()

  if (staffError) {
    throw staffError
  }

  if (staff.profile_id) {
    return staff.profile_id
  }

  requireValue(
    staff.email,
    'Staff email'
  )

  if (
    typeof crypto === 'undefined' ||
    typeof crypto.randomUUID !== 'function'
  ) {
    throw new Error(
      'This browser cannot generate a secure profile identifier.'
    )
  }

  const {
    data: existingProfile,
    error: existingProfileError
  } = await getDb()
    .from('profiles')
    .select(`
      profile_id,
      email,
      user_role_id,
      auth_user_id
    `)
    .eq('email', staff.email)
    .maybeSingle()

  if (existingProfileError) {
    throw existingProfileError
  }

  if (existingProfile) {
    throw new Error(
      'A profile already exists for this email. Review/link that profile instead of creating a duplicate account.'
    )
  }

  const profileId =
    crypto.randomUUID()

  const {
    data: policy,
    error: policyError
  } = await getDb()
    .from('department_access_policy')
    .select('user_role_id, is_active')
    .eq('department_id', staff.department_id)
    .maybeSingle()

  if (policyError) {
    throw policyError
  }

  const {
    error: profileError
  } = await getDb()
    .from('profiles')
    .insert({
      profile_id:
        profileId,
      email:
        staff.email,
      full_name:
        `${staff.first_name || ''} ${staff.last_name || ''}`.trim(),
      user_role_id:
        policy?.is_active ?
          policy.user_role_id :
          null,
      portal_enabled: false
    })

  if (profileError) {
    throw profileError
  }

  const {
    error: linkError
  } = await getDb()
    .from('staff_registry')
    .update({
      profile_id:
        profileId,
      updated_by:
        actorId(),
      updated_at:
        now()
    })
    .eq('staff_id', staffId)

  if (linkError) {
    throw linkError
  }

  return profileId
}
