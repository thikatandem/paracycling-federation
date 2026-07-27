import {
  setSession,
  setUser,
  setProfile,
  setRole,
  setPermissions,
  setModulePermissions,
  setInitialized,
  clearAuthState,
  getUser,
  getProfile,
  getRole,
  getSession,
  getPermissions,
  getModulePermissions,
  isInitialized,
  setLoginId
}
  from './authStateService.js'

import {
  trackLogin,
  trackLogout
}
  from './loginHistoryService.js'

import {
  loadPermissions
}
  from './permissionService.js'

import {
  loadModulePermissions
}
  from './modulePermissionService.js'

import {
  getDb
}
  from '../supabase/getDb.js'

const AUTH_CONTEXT_CACHE_KEY =
  'thika-tandem.auth-context.v1'

const SIDEBAR_SHELL_CACHE_KEY =
  'thika-tandem.sidebar-shell.v1'

const AUTH_CONTEXT_MAX_AGE =
  5 * 60 * 1000

let initializationPromise =
  null

function clearBrowserAuthCache() {
  try {
    sessionStorage.removeItem(
      AUTH_CONTEXT_CACHE_KEY
    )

    sessionStorage.removeItem(
      SIDEBAR_SHELL_CACHE_KEY
    )
  } catch {
    // Browser storage is an optimization only.
  }
}

function readCachedAuthContext(
  userId,
  session
) {
  if (!userId) {
    return null
  }

  try {
    const raw =
      sessionStorage.getItem(
        AUTH_CONTEXT_CACHE_KEY
      )

    if (!raw) {
      return null
    }

    const cached =
      JSON.parse(raw)

    if (
      !cached ||
      cached.userId !== userId ||
      !cached.profile ||
      !cached.role ||
      !Array.isArray(cached.permissions) ||
      !Array.isArray(cached.modulePermissions)
    ) {
      return null
    }

    const sessionExpiresAt =
      Number(session?.expires_at || 0)

    if (
      sessionExpiresAt &&
      cached.sessionExpiresAt &&
      Number(cached.sessionExpiresAt) !==
        sessionExpiresAt
    ) {
      return null
    }

    const age =
      Date.now() -
      Number(cached.cachedAt || 0)

    if (
      !Number.isFinite(age) ||
      age < 0 ||
      age > AUTH_CONTEXT_MAX_AGE
    ) {
      return null
    }

    return cached
  } catch {
    return null
  }
}

function cacheCurrentAuthContext(
  session,
  user,
  profile,
  role
) {
  try {
    sessionStorage.setItem(
      AUTH_CONTEXT_CACHE_KEY,
      JSON.stringify({
        userId:
          user?.id || null,
        sessionExpiresAt:
          session?.expires_at || null,
        cachedAt:
          Date.now(),
        profile,
        role,
        permissions:
          getPermissions(),
        modulePermissions:
          getModulePermissions()
      })
    )
  } catch {
    // Authentication must continue even if storage is unavailable.
  }
}

function hydrateCachedAuthContext(
  session,
  user,
  cached
) {
  setSession(
    session
  )

  setUser(
    user
  )

  setProfile(
    cached.profile
  )

  setRole(
    cached.role
  )

  setPermissions(
    cached.permissions
  )

  setModulePermissions(
    cached.modulePermissions
  )

  setInitialized(
    true
  )

  return {
    session,
    user,
    profile:
      cached.profile,
    role:
      cached.role
  }
}

function getInitializedAuthResult() {
  if (
    !isInitialized() ||
    !getUser()
  ) {
    return null
  }

  return {
    session:
      getSession(),
    user:
      getUser(),
    profile:
      getProfile(),
    role:
      getRole()
  }
}

/* ============================================================
   LOGIN
   ============================================================ */

export async function login(
  email,
  password
) {
  clearBrowserAuthCache()

  const {
    data,
    error
  } =
    await getDb().auth.signInWithPassword({

      email,

      password

    })

  if (error) {
    throw error
  }

  try {
    await initializeAuth({
      force: true
    })
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

  if (error) {
    throw error
  }

  clearBrowserAuthCache()
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

  if (error) {
    throw error
  }

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

  if (error) {
    throw error
  }
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

  if (error) {
    throw error
  }
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

  if (error) {
    throw error
  }

  return data
}

/* ============================================================
   INITIALIZE AUTH

   The authenticated role/permission context is cached only in
   sessionStorage and is always tied to the current Supabase user
   and session expiry. This avoids rebuilding the same UI context
   on every normal HTML page navigation while preserving the same
   authorization logic and Supabase/RLS enforcement.
   ============================================================ */

export async function initializeAuth({
  force = false
} = {}) {
  if (!force) {
    const initializedResult =
      getInitializedAuthResult()

    if (initializedResult) {
      return initializedResult
    }
  }

  if (
    initializationPromise &&
    !force
  ) {
    return initializationPromise
  }

  const runInitialization =
    async () => {
      const {
        data,
        error
      } =
        await getDb().auth.getSession()

      if (error) {
        throw error
      }

      const session =
        data?.session

      if (!session) {
        clearBrowserAuthCache()
        clearAuthState()

        setInitialized(
          true
        )

        return null
      }

      const { user } =
        session

      if (!force) {
        const cached =
          readCachedAuthContext(
            user.id,
            session
          )

        if (cached) {
          return hydrateCachedAuthContext(
            session,
            user,
            cached
          )
        }
      }

      const [
        profile,
        roleResult
      ] =
        await Promise.all([
          loadProfile(
            user.id
          ),
          getDb()
            .rpc(
              'current_role_code'
            )
        ])

      if (
        roleResult.error
      ) {
        throw roleResult.error
      }

      const role = {

        user_role_id:
          profile.user_role_id,

        role_code:
          roleResult.data,

        role_name:
          roleResult.data

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

      await Promise.all([
        loadPermissions(),
        loadModulePermissions()
      ])

      setInitialized(
        true
      )

      cacheCurrentAuthContext(
        session,
        user,
        profile,
        role
      )

      return {
        session,
        user,
        profile,
        role
      }
    }

  initializationPromise =
    runInitialization()

  try {
    return await initializationPromise
  } finally {
    initializationPromise =
      null
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
        case 'SIGNED_IN': {
          if (
            !isInitialized() ||
            getUser()?.id !==
              session?.user?.id
          ) {
            await initializeAuth()
          }

          break
        }

        case 'SIGNED_OUT': {
          clearBrowserAuthCache()
          clearAuthState()

          break
        }

        case 'TOKEN_REFRESHED': {
          setSession(
            session
          )

          break
        }
      }
    }
  )
}
