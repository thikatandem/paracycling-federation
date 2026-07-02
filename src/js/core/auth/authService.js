import {
  setSession,
  setUser,
  setProfile,
  setRole,
  setInitialized,
  clearAuthState,
  getUser,
  getProfile,
  getRole,
  getSession,
  setLoginId
}
from './authStateService.js'

import {
  trackLogin,
  trackLogout
}
from './sessionService.js'



import {
  loadPermissions
}
from './permissionService.js'



/* ============================================================
   LOGIN
   ============================================================ */

export async function login(
  email,
  password
) {

  const {
    data,
    error
  } =
    await getDb().auth.signInWithPassword({

      email,

      password

    })

  if (error)
    throw error

  try {

  await initializeAuth()

} catch (error) {

  console.error(
    'INITIALIZE AUTH FAILED:',
    error
  )

  throw error

}

  const loginId =
    await trackLogin()

  if (loginId) {

    setLoginId(
      loginId
    )

  }

  return data

}

/* ============================================================
   LOGOUT
   ============================================================ */

export async function logout() {

  await trackLogout()

  const {
    error
  } =
    await getDb().auth.signOut()

  if (error)
    throw error

  clearAuthState()

}

/* ============================================================
   REGISTER
   ============================================================ */

export async function register(
  email,
  password,
  metadata = {}
) {

  const {
    data,
    error
  } =
    await getDb().auth.signUp({

      email,

      password,

      options: {
        data: metadata
      }

    })

  if (error)
    throw error

  return data

}

/* ============================================================
   RESET PASSWORD
   ============================================================ */

export async function resetPassword(
  email,
  redirectUrl
) {

  const {
    error
  } =
    await getDb().auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          redirectUrl
      }
    )

  if (error)
    throw error

}

/* ============================================================
   UPDATE PASSWORD
   ============================================================ */

export async function updatePassword(
  password
) {

  const {
    error
  } =
    await getDb().auth.updateUser({
      password
    })

  if (error)
    throw error

}

/* ============================================================
   LOAD PROFILE
   ============================================================ */

export async function loadProfile(
  userId
) {

  const {
    data,
    error
  } =
    await getDb()
      .from('profiles')
      .select('*')
      .eq(
        'auth_user_id',
        userId
      )
      .single()

  console.log(
    'PROFILE DATA',
    data
  )

  console.log(
    'PROFILE ERROR',
    error
  )

  if (error) {

    throw error

  }

  return data

}

/* ============================================================
   INITIALIZE AUTH
   ============================================================ */

export async function initializeAuth() {

  const {
    data,
    error
  } =
    await getDb().auth.getSession()

  if (error)
    throw error

  const session =
    data?.session

  if (!session) {

    clearAuthState()

    setInitialized(
      true
    )

    return null

  }

  const user =
    session.user

  const profile =
  await loadProfile(
    user.id
  )

const {
  data: roleCode,
  error: roleError
}
=
await getDb()
  .rpc(
    'current_role_code'
  )

if (
  roleError
) {

  throw roleError

}

const role = {

  role_code:
    roleCode

}

  setSession(
    session
  )

  setUser(
    user
  )

  setProfile(
    profile
  )

  setRole(
    role
  )

  await loadPermissions()
 

  setInitialized(
    true
  )

  return {
    session,
    user,
    profile,
    role
  }

}

/* ============================================================
   CURRENT STATE
   ============================================================ */

export function getCurrentUser() {

  return getUser()

}

export function getCurrentProfile() {

  return getProfile()

}

export function getCurrentRole() {

  return getRole()

}

export function getCurrentSession() {

  return getSession()

}

/* ============================================================
   AUTH LISTENER
   ============================================================ */

export function initializeAuthListener() {

  getDb().auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      switch (
        event
      ) {

        case 'SIGNED_IN':

          await initializeAuth()

          break

        case 'SIGNED_OUT':

          clearAuthState()

          break

        case 'TOKEN_REFRESHED':

          setSession(
            session
          )

          break

      }

    }
  )

}

function getDb() {

  if (
    !window.supabaseClient
  ) {

    throw new Error(
      'Supabase client not initialized.'
    )

  }

  return window.supabaseClient

}