import {
  showInlineInfo
} from '../services/feedbackService.js'

import {
  getCurrentProfile,
  getCurrentRole,
  logout
}
  from './authService.js'

export function initializeProfileHeader() {
  const profile =
    getCurrentProfile()

  const role =
    getCurrentRole()

  const avatar =
  document.getElementById(
    'profileAvatar'
  )

  const dropdownAvatar =
  document.getElementById(
    'profileAvatarDropdown'
  )

  const fullName =
    document.getElementById(
      'profileFullName'
    )

  const roleLabel =
    document.getElementById(
      'profileRole'
    )

  const logoutButton =
    document.getElementById(
      'logoutButton'
    )

  if (
    profile
  ) {
    if (
      fullName
    ) {
      fullName.textContent =
        profile.full_name ||
        profile.email
    }

    if (
      profile.profile_photo_url
    ) {
      if (avatar) {
        avatar.src =
      profile.profile_photo_url
      }

      if (dropdownAvatar) {
        dropdownAvatar.src =
      profile.profile_photo_url
      }
    }
  }

  if (
    role &&
    roleLabel
  ) {
    roleLabel.textContent =
      role.role_code
  }

  logoutButton
    ?.addEventListener(
      'click',
      async event => {
        event.preventDefault()

        await logout()

        window.location.href =
          '/authentication/login.html'
      }
    )

  initializeAccountMenu()
}

function initializeAccountMenu() {
  document
    .getElementById(
      'headerProfile'
    )
    ?.addEventListener(
      'click',
      event => {
        event.preventDefault()

        window.location.href =
         'federation/profile.html'
      }
    )

  document
    .getElementById(
      'headerSettings'
    )
    ?.addEventListener(
      'click',
      event => {
        event.preventDefault()

        window.location.href =
         'federation/profile.html#settingsTab'
      }
    )

  document
    .getElementById(
      'headerLock'
    )
    ?.addEventListener(
      'click',
      event => {
        event.preventDefault()

        showInlineInfo(
          'Session Lock not implemented yet.'
        )
      }
    )
}
