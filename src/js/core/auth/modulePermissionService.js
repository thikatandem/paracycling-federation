import {
  getRole,
  getModulePermissions,
  setModulePermissions
}
from './authStateService.js'
import {
  getDb
}
from '../supabase/getDb.js'



/* ============================================================
   LOAD MODULE PERMISSIONS
   ============================================================ */

export async function loadModulePermissions() {

  const role =
    getRole()

  if (!role?.user_role_id) {

  setModulePermissions([])

  return []

}

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'module_permissions'
      )
      .select('*')
      .eq(
        'user_role_id',
        role.user_role_id
      )

  if (error)
    throw error

 setModulePermissions(
  data || []
)

  return getModulePermissions()

}

/* ============================================================
   GET MODULES
   ============================================================ */

export function getCurrentModulePermissions() {

  return getModulePermissions()

}

/* ============================================================
   MODULE VISIBILITY
   ============================================================ */

export function canViewModule(
  moduleCode
) {

  return getModulePermissions().some(
    module =>
      module.module_code ===
        moduleCode &&
      module.can_view
  )

}

/* ============================================================
   MODULE CREATE
   ============================================================ */

export function canCreateModule(
  moduleCode
) {

  return getModulePermissions().some(
    module =>
      module.module_code ===
        moduleCode &&
      module.can_create
  )

}

/* ============================================================
   MODULE UPDATE
   ============================================================ */

export function canUpdateModule(
  moduleCode
) {

  return getModulePermissions().some(
    module =>
      module.module_code ===
        moduleCode &&
      module.can_update
  )

}

/* ============================================================
   MODULE DELETE
   ============================================================ */

export function canDeleteModule(
  moduleCode
) {

  return getModulePermissions().some(
    module =>
      module.module_code ===
        moduleCode &&
      module.can_delete
  )

}