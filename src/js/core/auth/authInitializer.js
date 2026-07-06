import {
  getRoleSidebar
}
  from '../rolePages/rolePageService.js'
import {
  renderSidebar
}
  from '../rolePages/sidebarRenderer.js'
import {
  initializeProfilePhotoUpload
}
  from '../profile/profilePhotoService.js'
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
  initializeAuthListener
}
  from './authService.js'

import {
  initializeSession
}
  from './sessionService.js'

let initialized =
  false

export async function initializeAuthentication() {
  if (
    initialized
  ) {
    return
  }

  initialized =
    true

  console.log(
    'supabase client:',
    window.supabaseClient
  )

  await initializeAuth()

  initializeAuthListener()

  await initializeSession()

  preventBackNavigation()

  const sidebar =
  getRoleSidebar()

  if (
    sidebar
  ) {
    renderSidebar(
      sidebar
    )
  }

  initializeProfileHeader()

  document
    .getElementById(
      'sidebar'
    )
    ?.classList
    .remove(
      'd-none'
    )

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
