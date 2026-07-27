import {
  SESSION_CHECK_INTERVAL,
  INACTIVITY_LIMIT
} from '../services/constants.js'

import {
  getSession,
  isAuthenticated
}
  from './authStateService.js'

import {
  logout
}
  from './authService.js'

let sessionCheckInterval =
  null

let inactivityTimeout =
  null

let lastActivityTime =
  Date.now()

/* ============================================================
   INITIALIZE SESSION
   ============================================================ */

export async function initializeSession() {
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

export {
  trackLogin,
  trackLogout
} from './loginHistoryService.js'

/* ============================================================
   ACTIVE SESSION
   ============================================================ */

export function hasActiveSession() {
  return (
    isAuthenticated() &&
    Boolean(getSession())
  )
}

/* ============================================================
   CURRENT SESSION
   ============================================================ */


export {
  getSession as getCurrentSession
} from './authStateService.js'
