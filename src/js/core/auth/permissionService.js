import {
  getRole,
  getProfile,
  getPermissions,
  setPermissions
}
from './authStateService.js'

import {
  getDb
}
from '../supabase/getDb.js'
/* ============================================================
   LOAD ROLE PERMISSIONS
   ============================================================ */

export async function loadPermissions() {

  const role =
    getRole()

  if (!role?.user_role_id) {

    setPermissions([])

    return []

  }

  const roleResult =
   await getDb()
      .from(
        'role_permissions'
      )
      .select(`
        permission_master(
          permission_code
        )
      `)
      .eq(
        'user_role_id',
        role.user_role_id
      )

  if (
    roleResult.error
  ) {
    throw roleResult.error
  }

  const rolePermissions =
    (
      roleResult.data || []
    )
      .map(
        item =>
          item
            ?.permission_master
            ?.permission_code
      )
      .filter(Boolean)

  const profileId =
    getProfile()
      ?.profile_id

  let userPermissions =
    []

  if (profileId) {

    const userResult =
     await getDb()
        .from(
          'user_permissions'
        )
        .select(`
          permission_master(
            permission_code
          )
        `)
        .eq(
          'profile_id',
          profileId
        )
        .eq(
          'is_active',
          true
        )

    if (
      userResult.error
    ) {
      throw userResult.error
    }

    userPermissions =
      (
        userResult.data || []
      )
        .map(
          item =>
            item
              ?.permission_master
              ?.permission_code
        )
        .filter(Boolean)

  }

  const permissions =
    [
      ...new Set([
        ...rolePermissions,
        ...userPermissions
      ])
    ]

  setPermissions(
    permissions
  )

  return permissions

}
/* ============================================================
   RELOAD
   ============================================================ */

export async function reloadPermissions() {

  return loadPermissions()

}

/* ============================================================
   GETTERS
   ============================================================ */

export function getCurrentPermissions() {

  return getPermissions()

}

/* ============================================================
   SINGLE PERMISSION
   ============================================================ */

export function hasPermission(
  permissionCode
) {

  const permissions =
    getPermissions()

  return permissions.includes(
    permissionCode
  )

}

/* ============================================================
   ANY
   ============================================================ */

export function hasAnyPermission(
  permissionCodes = []
) {

  const permissions =
    getPermissions()

  return permissionCodes.some(
    permission =>
      permissions.includes(
        permission
      )
  )

}

/* ============================================================
   ALL
   ============================================================ */

export function hasAllPermissions(
  permissionCodes = []
) {

  const permissions =
    getPermissions()

  return permissionCodes.every(
    permission =>
      permissions.includes(
        permission
      )
  )

}

/* ============================================================
   ROLE CHECK
   ============================================================ */

export function isRole(
  roleCode
) {

  const role =
    getRole()

  return (
    role?.role_code ===
    roleCode
  )

}

/* ============================================================
   ROLE GROUP
   ============================================================ */

export function isOneOfRoles(
  roleCodes = []
) {

  const role =
    getRole()

  return roleCodes.includes(
    role?.role_code
  )

}

/* ============================================================
   ADMIN CHECK
   ============================================================ */

export function isAdmin() {

  return isOneOfRoles([
    'SYS_ADMIN',
    'FED_ADMIN'
  ])

}

/* ============================================================
   SYS ADMIN CHECK
   ============================================================ */

export function isSystemAdmin() {

  return isRole(
    'SYS_ADMIN'
  )

}