import {
  getProfile,
  getRole,
  getModulePermissions,
  setModulePermissions
} from './authStateService.js'

import {
  resolveEffectiveModulePermissions
} from './accessResolutionService.js'

export async function loadModulePermissions() {
  const role =
    getRole()
  const profile =
    getProfile()

  if (
    !role?.user_role_id &&
    !profile?.profile_id
  ) {
    setModulePermissions([])
    return []
  }

  const permissions =
    await resolveEffectiveModulePermissions({
      profileId:
        profile?.profile_id || null,
      fallbackUserRoleId:
        role?.user_role_id || null
    })

  setModulePermissions(
    permissions
  )

  return permissions
}

export function getCurrentModulePermissions() {
  return getModulePermissions()
}

function can(
  moduleCode,
  field
) {
  return getModulePermissions().some(
    module =>
      module.module_code === moduleCode &&
      Boolean(module[field])
  )
}

export function canViewModule(
  moduleCode
) {
  return can(
    moduleCode,
    'can_view'
  )
}

export function canCreateModule(
  moduleCode
) {
  return can(
    moduleCode,
    'can_create'
  )
}

export function canUpdateModule(
  moduleCode
) {
  return can(
    moduleCode,
    'can_update'
  )
}

export function canDeleteModule(
  moduleCode
) {
  return can(
    moduleCode,
    'can_delete'
  )
}
