import {
  getDb
} from '../supabase/getDb.js'

const REQUEST_DEDUPE_WINDOW_MS =
  1500

const staffContextRequests =
  new Map()

const departmentPolicyRequests =
  new Map()

function getDedupedRequest(
  cache,
  key,
  factory
) {
  const now =
    Date.now()

  const existing =
    cache.get(key)

  if (
    existing &&
    existing.expiresAt > now
  ) {
    return existing.promise
  }

  const promise =
    Promise.resolve()
      .then(factory)
      .catch(error => {
        cache.delete(key)
        throw error
      })

  cache.set(
    key,
    {
      promise,
      expiresAt:
        now + REQUEST_DEDUPE_WINDOW_MS
    }
  )

  return promise
}

function applyBooleanOverride(
  current,
  override
) {
  if (!override) {
    return current
  }

  return {
    can_view:
      Boolean(override.can_view),
    can_create:
      Boolean(override.can_create),
    can_update:
      Boolean(override.can_update),
    can_delete:
      Boolean(override.can_delete)
  }
}

async function loadStaffAccessContext(
  profileId
) {
  if (!profileId) {
    return {
      departmentId: null,
      settings: null,
      hasStaffRecord: false
    }
  }

  return getDedupedRequest(
    staffContextRequests,
    profileId,
    async () => {
      const [staffResult, settingsResult] =
        await Promise.all([
          getDb()
            .from('staff_registry')
            .select('staff_id, department_id, profile_id')
            .eq('profile_id', profileId)
            .maybeSingle(),
          getDb()
            .from('staff_access_settings')
            .select('*')
            .eq('profile_id', profileId)
            .maybeSingle()
        ])

      if (staffResult.error) {
        throw staffResult.error
      }

      if (settingsResult.error) {
        throw settingsResult.error
      }

      return {
        departmentId:
          staffResult.data?.department_id || null,
        settings:
          settingsResult.data || null,
        hasStaffRecord:
          Boolean(staffResult.data)
      }
    }
  )
}

async function loadDepartmentPolicy(
  departmentId
) {
  if (!departmentId) {
    return null
  }

  return getDedupedRequest(
    departmentPolicyRequests,
    departmentId,
    async () => {
      const {
        data,
        error
      } = await getDb()
        .from('department_access_policy')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data || null
    }
  )
}

export async function resolveEffectiveUserRoleId({
  profileId = null,
  fallbackUserRoleId = null
} = {}) {
  const context =
    await loadStaffAccessContext(
      profileId
    )

  if (
    context.settings &&
    context.settings.inherit_department_role === false &&
    context.settings.user_role_id_override
  ) {
    return context.settings.user_role_id_override
  }

  const policy =
    await loadDepartmentPolicy(
      context.departmentId
    )

  if (policy?.user_role_id) {
    return policy.user_role_id
  }

  if (context.hasStaffRecord) {
    return null
  }

  return fallbackUserRoleId || null
}

async function loadRolePermissionIds(
  userRoleId
) {
  if (!userRoleId) {
    return new Set()
  }

  const {
    data,
    error
  } = await getDb()
    .from('role_permissions')
    .select('permission_id')
    .eq('user_role_id', userRoleId)

  if (error) {
    throw error
  }

  return new Set(
    (data || [])
      .map(row => row.permission_id)
      .filter(Boolean)
  )
}

async function loadPermissionCodeMap() {
  const {
    data,
    error
  } = await getDb()
    .from('permission_master')
    .select('permission_id, permission_code')
    .eq('is_active', true)

  if (error) {
    throw error
  }

  return new Map(
    (data || []).map(
      row => [
        row.permission_id,
        row.permission_code
      ]
    )
  )
}

async function applyPermissionOverrides({
  table,
  ownerField,
  ownerId,
  permissionIds
}) {
  if (!ownerId) {
    return permissionIds
  }

  const {
    data,
    error
  } = await getDb()
    .from(table)
    .select('permission_id, is_allowed')
    .eq(ownerField, ownerId)

  if (error) {
    throw error
  }

  for (const row of data || []) {
    if (row.is_allowed) {
      permissionIds.add(row.permission_id)
    } else {
      permissionIds.delete(row.permission_id)
    }
  }

  return permissionIds
}

async function applyLegacyUserGrants(
  profileId,
  permissionIds
) {
  if (!profileId) {
    return permissionIds
  }

  const {
    data,
    error
  } = await getDb()
    .from('user_permissions')
    .select('permission_id')
    .eq('profile_id', profileId)
    .eq('is_active', true)

  if (error) {
    throw error
  }

  for (const row of data || []) {
    if (row.permission_id) {
      permissionIds.add(row.permission_id)
    }
  }

  return permissionIds
}

export async function resolveEffectivePermissionCodes({
  profileId = null,
  fallbackUserRoleId = null
} = {}) {
  const context =
    await loadStaffAccessContext(
      profileId
    )

  const effectiveRoleId =
    await resolveEffectiveUserRoleId({
      profileId,
      fallbackUserRoleId
    })

  if (!effectiveRoleId) {
    return []
  }

  const permissionIds =
    await loadRolePermissionIds(
      effectiveRoleId
    )

  await applyPermissionOverrides({
    table:
      'department_permission_overrides',
    ownerField:
      'department_id',
    ownerId:
      context.departmentId,
    permissionIds
  })

  await applyLegacyUserGrants(
    profileId,
    permissionIds
  )

  await applyPermissionOverrides({
    table:
      'profile_permission_overrides',
    ownerField:
      'profile_id',
    ownerId:
      profileId,
    permissionIds
  })

  const codeMap =
    await loadPermissionCodeMap()

  return [...permissionIds]
    .map(id => codeMap.get(id))
    .filter(Boolean)
}

async function loadRoleModules(
  userRoleId
) {
  const result = new Map()

  if (!userRoleId) {
    return result
  }

  const {
    data,
    error
  } = await getDb()
    .from('module_permissions')
    .select(`
      module_code,
      can_view,
      can_create,
      can_update,
      can_delete
    `)
    .eq('user_role_id', userRoleId)

  if (error) {
    throw error
  }

  for (const row of data || []) {
    result.set(
      row.module_code,
      {
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
    )
  }

  return result
}

async function applyModuleOverrides({
  table,
  ownerField,
  ownerId,
  modules
}) {
  if (!ownerId) {
    return modules
  }

  const {
    data,
    error
  } = await getDb()
    .from(table)
    .select(`
      module_code,
      can_view,
      can_create,
      can_update,
      can_delete
    `)
    .eq(ownerField, ownerId)

  if (error) {
    throw error
  }

  for (const row of data || []) {
    const current =
      modules.get(row.module_code) || {
        can_view: false,
        can_create: false,
        can_update: false,
        can_delete: false
      }

    modules.set(
      row.module_code,
      {
        module_code:
          row.module_code,
        ...applyBooleanOverride(
          current,
          row
        )
      }
    )
  }

  return modules
}

export async function resolveEffectiveModulePermissions({
  profileId = null,
  fallbackUserRoleId = null
} = {}) {
  const context =
    await loadStaffAccessContext(
      profileId
    )

  const effectiveRoleId =
    await resolveEffectiveUserRoleId({
      profileId,
      fallbackUserRoleId
    })

  if (!effectiveRoleId) {
    return []
  }

  const modules =
    await loadRoleModules(
      effectiveRoleId
    )

  await applyModuleOverrides({
    table:
      'department_module_overrides',
    ownerField:
      'department_id',
    ownerId:
      context.departmentId,
    modules
  })

  await applyModuleOverrides({
    table:
      'profile_module_overrides',
    ownerField:
      'profile_id',
    ownerId:
      profileId,
    modules
  })

  return [...modules.values()]
}
