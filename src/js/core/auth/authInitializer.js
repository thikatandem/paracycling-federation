import {
  getRoleSidebar
}
  from '../rolePages/rolePageService.js'
import {
  renderSidebar
}
  from '../rolePages/sidebarRenderer.js'
import {
  initializeProfileHeader
}
  from './profileHeaderService.js'

import {
  requireAuthentication,
  preventBackNavigation
}
  from './routeGuardService.js'

import {
  initializeAuth,
  initializeAuthListener,
  getCurrentUser
}
  from './authService.js'

import {
  initializeSession
}
  from './sessionService.js'

const SIDEBAR_SHELL_CACHE_KEY =
  'thika-tandem.sidebar-shell.v1'

let initialized =
  false

let initializationPromise =
  null

function revealSidebarNavigation() {
  const container =
    document.getElementById(
      'roleSidebar'
    )

  if (container) {
    container.style.visibility =
      'visible'
  }
}

function restoreDefaultSidebar() {
  const container =
    document.getElementById(
      'roleSidebar'
    )

  const defaultHtml =
    window.__defaultRoleSidebarHtml

  if (
    container &&
    typeof defaultHtml === 'string'
  ) {
    container.innerHTML =
      defaultHtml
  }
}

function cacheSidebarForCurrentUser() {
  const container =
    document.getElementById(
      'roleSidebar'
    )

  const user =
    getCurrentUser()

  if (
    !container ||
    !user?.id
  ) {
    return
  }

  try {
    sessionStorage.setItem(
      SIDEBAR_SHELL_CACHE_KEY,
      JSON.stringify({
        userId:
          user.id,
        html:
          container.innerHTML,
        cachedAt:
          Date.now()
      })
    )
  } catch {
    // Sidebar caching is a visual optimization only.
  }
}

async function runInitialization() {
  await initializeAuth()

  initializeAuthListener()

  await initializeSession()

  preventBackNavigation()

  const sidebar =
    getRoleSidebar()

  if (sidebar) {
    renderSidebar(
      sidebar
    )
  } else {
    restoreDefaultSidebar()
  }

  cacheSidebarForCurrentUser()
  revealSidebarNavigation()

  initializeProfileHeader()

  const isAuthPage =
    window.location.pathname.includes(
      '/authentication/'
    )

  if (
    !isAuthPage
  ) {
    requireAuthentication()
  }
}

export async function initializeAuthentication() {
  if (initialized) {
    return
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise =
    runInitialization()

  try {
    await initializationPromise
    initialized =
      true
  } finally {
    initializationPromise =
      null
  }
}
