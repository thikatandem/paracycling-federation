import {
  isAuthenticated,
  getRole
}
from './authStateService.js'

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isSystemAdmin
}
from './permissionService.js'

import {
  isInitialized
}
from './authStateService.js'


/* ============================================================
   REDIRECT
   ============================================================ */

export function redirectToLogin() {

  window.location.href =
    '/authentication/login.html'

}

/* ============================================================
   REQUIRE AUTHENTICATION
   ============================================================ */

export function requireAuthentication() {

  if (
    !isInitialized()
  ) {

    return false

  }

  if (
    !isAuthenticated()
  ) {

    redirectToLogin()

    return false

  }

  return true

}

/* ============================================================
   REQUIRE ROLE
   ============================================================ */

export function requireRole(
  roleCode
) {

  if (
    !requireAuthentication()
  ) {
    return false
  }

  const role =
    getRole()

  if (
    role?.role_code !==
    roleCode
  ) {

    redirectUnauthorized()

    return false

  }

  return true

}

export function preventBackNavigation() {

  window.addEventListener(
    'pageshow',
    async (
      event
    ) => {

      if (
        event.persisted
      ) {

        const {
          data
        } =
        await window
          .supabaseClient
          .auth
          .getSession()

        if (
          !data?.session
        ) {

          redirectToLogin()

        }

      }

    }
  )

}

/* ============================================================
   REQUIRE ANY ROLE
   ============================================================ */

export function requireAnyRole(
  roleCodes = []
) {

  if (
    !requireAuthentication()
  ) {
    return false
  }

  const roleCode =
    getRole()?.role_code

  if (
    !roleCodes.includes(
      roleCode
    )
  ) {

    redirectUnauthorized()

    return false

  }

  return true

}

/* ============================================================
   REQUIRE PERMISSION
   ============================================================ */

export function requirePermission(
  permissionCode
) {

  if (
    !requireAuthentication()
  ) {
    return false
  }

  if (
    !hasPermission(
      permissionCode
    )
  ) {

    redirectUnauthorized()

    return false

  }

  return true

}

/* ============================================================
   REQUIRE ANY PERMISSION
   ============================================================ */

export function requireAnyPermission(
  permissionCodes = []
) {

  if (
    !requireAuthentication()
  ) {
    return false
  }

  if (
    !hasAnyPermission(
      permissionCodes
    )
  ) {

    redirectUnauthorized()

    return false

  }

  return true

}

/* ============================================================
   REQUIRE ALL PERMISSIONS
   ============================================================ */

export function requireAllPermissions(
  permissionCodes = []
) {

  if (
    !requireAuthentication()
  ) {
    return false
  }

  if (
    !hasAllPermissions(
      permissionCodes
    )
  ) {

    redirectUnauthorized()

    return false

  }

  return true

}

/* ============================================================
   ADMIN AREA
   ============================================================ */

export function requireAdmin() {

  if (
    !requireAuthentication()
  ) {
    return false
  }

  if (
    !isAdmin()
  ) {

    redirectUnauthorized()

    return false

  }

  return true

}

/* ============================================================
   SYS ADMIN AREA
   ============================================================ */

export function requireSystemAdmin() {

  if (
    !requireAuthentication()
  ) {
    return false
  }

  if (
    !isSystemAdmin()
  ) {

    redirectUnauthorized()

    return false

  }

  return true

}

/* ============================================================
   UNAUTHORIZED
   ============================================================ */

export function redirectUnauthorized() {

  window.location.href =
    '/authentication/login.html'

}

/* ============================================================
   PAGE GUARD
   ============================================================ */

export function protectPage(
  permissionCode
) {

  return requirePermission(
    permissionCode
  )

}

/* ============================================================
   MODULE GUARD
   ============================================================ */

export function protectModule(
  permissionCode
) {

  return hasPermission(
    permissionCode
  )

}