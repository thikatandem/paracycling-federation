const authState = {

  session: null,

  user: null,

  profile: null,

  role: null,

  permissions: [],

  modulePermissions: [],
 
  loginId: null,

  initialized: false

}

/* ============================================================
   SESSION
   ============================================================ */

export function getSession() {

  return authState.session

}

export function setSession(session) {

  authState.session = session

}

export function clearSession() {

  authState.session = null

}


export function getLoginId() {

  return authState.loginId

}

export function setLoginId(
  loginId
) {

  authState.loginId =
    loginId

}

export function clearLoginId() {

  authState.loginId = null

}


/* ============================================================
   USER
   ============================================================ */

export function getUser() {

  return authState.user

}

export function setUser(user) {

  authState.user = user

}

export function clearUser() {

  authState.user = null

}

/* ============================================================
   PROFILE
   ============================================================ */

export function getProfile() {

  return authState.profile

}

export function setProfile(profile) {

  authState.profile = profile

}

export function clearProfile() {

  authState.profile = null

}

/* ============================================================
   ROLE
   ============================================================ */

export function getRole() {

  return authState.role

}

export function setRole(role) {

  authState.role = role

}

export function clearRole() {

  authState.role = null

}

/* ============================================================
   PERMISSIONS
   ============================================================ */

export function getPermissions() {

  return authState.permissions

}

export function setPermissions(permissions = []) {

  authState.permissions = permissions

}

export function addPermission(permissionCode) {

  if (
    !authState.permissions.includes(
      permissionCode
    )
  ) {

    authState.permissions.push(
      permissionCode
    )

  }

}

export function clearPermissions() {

  authState.permissions = []

}


/* ============================================================
   MODULE PERMISSIONS
   ============================================================ */

export function getModulePermissions() {

  return authState.modulePermissions

}

export function setModulePermissions(
  permissions = []
) {

  authState.modulePermissions =
    permissions

}

export function clearModulePermissions() {

  authState.modulePermissions = []

}

/* ============================================================
   AUTH STATUS
   ============================================================ */

export function isAuthenticated() {

  return !!authState.user

}

export function isInitialized() {

  return authState.initialized

}

export function setInitialized(value = true) {

  authState.initialized = value

}

/* ============================================================
   RESET
   ============================================================ */

export function clearAuthState() {

  authState.session = null

  authState.user = null

  authState.profile = null

  authState.role = null

  authState.permissions = []

  authState.modulePermissions = []

  authState.loginId = null

  authState.initialized = false

}

/* ============================================================
   SNAPSHOT
   ============================================================ */

export function getAuthState() {

  return structuredClone(
    authState
  )

}