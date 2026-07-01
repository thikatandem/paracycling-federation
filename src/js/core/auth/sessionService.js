import {
  getSession,
  getProfile,
  isAuthenticated,
  getLoginId,
  clearLoginId
}
from './authStateService.js'


import {
  logout,
  initializeAuth
}
from './authService.js'

import {
  getDb
}
from '../supabase/getDb.js'

let sessionCheckInterval =
  null

let inactivityTimeout =
  null

let lastActivityTime =
  Date.now()

const SESSION_CHECK_INTERVAL =
  60 * 1000

const INACTIVITY_LIMIT =
  60 * 60 * 1000

/* ============================================================
   INITIALIZE SESSION
   ============================================================ */

export async function initializeSession() {

  await initializeAuth()

  if (
    !isAuthenticated()
  ) {
    return
  }

  startSessionMonitor()

  startActivityTracking()

}

/* ============================================================
   SESSION VALIDATION
   ============================================================ */

export async function validateSession() {

  const session =
    getSession()

  if (!session) {

    await expireSession()

    return false

  }

  const expiresAt =
    session.expires_at

  if (!expiresAt) {
    return true
  }

  const now =
    Math.floor(
      Date.now() / 1000
    )

  if (
    now >= expiresAt
  ) {

    await expireSession()

    return false

  }

  return true

}

/* ============================================================
   EXPIRE SESSION
   ============================================================ */

export async function expireSession() {

  stopSessionMonitor()

  stopActivityTracking()

  await logout()

}
/* ============================================================
   FORCE LOGOUT
   ============================================================ */

export async function forceLogout() {

  await expireSession()

}

/* ============================================================
   SESSION MONITOR
   ============================================================ */

export function startSessionMonitor() {

  stopSessionMonitor()

  sessionCheckInterval =
    setInterval(
      async () => {

        await validateSession()

        await validateInactivity()

      },
      SESSION_CHECK_INTERVAL
    )

}

export function stopSessionMonitor() {

  if (
    sessionCheckInterval
  ) {

    clearInterval(
      sessionCheckInterval
    )

    sessionCheckInterval =
      null

  }

}

/* ============================================================
   ACTIVITY TRACKING
   ============================================================ */

export function startActivityTracking() {

  stopActivityTracking()

  const updateActivity =
    () => {

      lastActivityTime =
        Date.now()

    }

  window.addEventListener(
    'click',
    updateActivity
  )

  window.addEventListener(
    'mousemove',
    updateActivity
  )

  window.addEventListener(
    'keydown',
    updateActivity
  )

  inactivityTimeout =
    updateActivity

}

export function stopActivityTracking() {

  if (
    inactivityTimeout
  ) {

    window.removeEventListener(
      'click',
      inactivityTimeout
    )

    window.removeEventListener(
      'mousemove',
      inactivityTimeout
    )

    window.removeEventListener(
      'keydown',
      inactivityTimeout
    )

    inactivityTimeout =
      null

  }

}

/* ============================================================
   INACTIVITY VALIDATION
   ============================================================ */

export async function validateInactivity() {

  const inactiveTime =
    Date.now() -
    lastActivityTime

  if (
    inactiveTime >=
    INACTIVITY_LIMIT
  ) {

    await expireSession()

  }

}

/* ============================================================
   LOGIN TRACKING
   ============================================================ */

export async function trackLogin() {

  try {

    const profile =
      getProfile()

    if (!profile) {
      return null
    }

    const {
      data,
      error
    } =
      await getDb()
        .from(
          'login_history'
        )
        .insert({

          profile_id:
            profile.profile_id,

          login_time:
            new Date()
              .toISOString(),

          success: true,

          user_agent:
            navigator.userAgent

        })
        .select(
          'login_id'
        )
        .single()

    if (error)
      throw error

    return data.login_id

  } catch (error) {

    console.error(
      'Failed to track login',
      error
    )

    return null

  }

}


/* ============================================================
   LOGOUT TRACKING
   ============================================================ */

export async function trackLogout() {

  try {

    const profile =
      getProfile()

    const loginId =
      getLoginId()

    if (
      !profile ||
      !loginId
    ) {
      return
    }

    await getDb()
      .from(
        'login_history'
      )
      .update({

        logout_time:
          new Date()
            .toISOString()

      })
      .eq(
        'login_id',
        loginId
      )

    clearLoginId()

  } catch (error) {

    console.error(
      'Failed to track logout',
      error
    )

  }

}

/* ============================================================
   ACTIVE SESSION
   ============================================================ */

export function hasActiveSession() {

  return (
    isAuthenticated() &&
    !!getSession()
  )

}

/* ============================================================
   CURRENT SESSION
   ============================================================ */

export function getCurrentSession() {

  return getSession()

}