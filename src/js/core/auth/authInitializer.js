
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