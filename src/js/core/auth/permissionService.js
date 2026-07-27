import {
  getProfile,
  getRole,
  getPermissions,
  setPermissions
} from './authStateService.js'

import {
  resolveEffectivePermissionCodes
} from './accessResolutionService.js'

/* ============================================================
   LOAD EFFECTIVE PERMISSIONS

   Precedence:
   1. Access role defaults (user_role_master -> role_permissions)
   2. Department allow/deny overrides
   3. Existing active user_permissions grants (legacy-compatible)
   4. Profile allow/deny overrides
   ============================================================ */

export async function loadPermissions() {
  const role =
    getRole()
  const profile =
    getProfile()

  if (
    !role?.user_role_id &&
    !profile?.profile_id
  ) {
    setPermissions([])
    return []
  }

  const permissions =
    await resolveEffectivePermissionCodes({
      profileId:
        profile?.profile_id || null,
      fallbackUserRoleId:
        role?.user_role_id || null
    })

  setPermissions(
    permissions
  )

  return permissions
}

export async function reloadPermissions() {
  return loadPermissions()
}

export function getCurrentPermissions() {
  return getPermissions()
}

export function hasPermission(
  permissionCode
) {
  return getPermissions().includes(
    permissionCode
  )
}

export function hasAnyPermission(
  permissionCodes = []
) {
  const permissions =
    getPermissions()

  return permissionCodes.some(
    permission =>
      permissions.includes(permission)
  )
}

export function hasAllPermissions(
  permissionCodes = []
) {
  const permissions =
    getPermissions()

  return permissionCodes.every(
    permission =>
      permissions.includes(permission)
  )
}

export function isRole(
  roleCode
) {
  return (
    getRole()?.role_code ===
    roleCode
  )
}

export function isOneOfRoles(
  roleCodes = []
) {
  return roleCodes.includes(
    getRole()?.role_code
  )
}

export function isAdmin() {
  return isOneOfRoles([
    'SYS_ADMIN',
    'FED_ADMIN'
  ])
}

export function isSystemAdmin() {
  return isRole(
    'SYS_ADMIN'
  )
}
