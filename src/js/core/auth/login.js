import {
  login
}
from '../../core/auth/authService.js'

const form =
  document.getElementById(
    'loginForm'
  )

const emailInput =
  document.getElementById(
    'email'
  )

const passwordInput =
  document.getElementById(
    'password'
  )

const loginButton =
  document.getElementById(
    'loginButton'
  )

const loginMessage =
  document.getElementById(
    'loginMessage'
  )

function clearMessage() {

  if (!loginMessage) {
    return
  }

  loginMessage.textContent =
    ''

  loginMessage.className =
    'alert alert-danger d-none mt-3'

}

function showMessage(
  message,
  isError = true
) {

  if (!loginMessage) {
    return
  }

  loginMessage.textContent =
    message

  loginMessage.className =
    isError
      ? 'alert alert-danger mt-3'
      : 'alert alert-success mt-3'

}

async function handleLogin(
  event
) {

  event.preventDefault()

  clearMessage()

  const email =
    emailInput.value.trim()

  const password =
    passwordInput.value

  if (
    !email ||
    !password
  ) {

    showMessage(
      'Email and password are required.'
    )

    return

  }

  try {

    loginButton.disabled =
      true

    loginButton.textContent =
      'Signing In...'

    console.log(
      'LOGIN ATTEMPT:',
      {
        email
      }
    )

    await login(
      email,
      password
    )

    console.log(
      'LOGIN SUCCESS'
    )

    showMessage(
      'Login successful. Redirecting...',
      false
    )

    window.location.href =
      '/'

  } catch (error) {

    console.error(
      'LOGIN ERROR:',
      error
    )

    try {

      console.error(
        'LOGIN ERROR JSON:',
        JSON.stringify(
          error,
          null,
          2
        )
      )

    } catch (
      jsonError
    ) {

      console.error(
        'ERROR SERIALIZATION FAILED:',
        jsonError
      )

    }

    let message =
      'Login failed.'

    if (
      error?.message
    ) {

      message =
        error.message

    } else if (
      error?.error_description
    ) {

      message =
        error.error_description

    } else if (
      error?.code ===
      'invalid_credentials'
    ) {

      message =
        'Invalid email or password.'

    } else if (
      error?.status ===
      400
    ) {

      message =
        'Invalid email or password.'

    } else if (
      error?.status ===
      401
    ) {

      message =
        'Authentication failed.'

    } else if (
      error?.status ===
      403
    ) {

      message =
        'Your account does not have permission to access the portal.'

    } else if (
      error?.status ===
      404
    ) {

      message =
        'User account not found.'

    } else if (
      error?.status ===
      500
    ) {

      message =
        'Server error. Please contact the system administrator.'
    }

    showMessage(
      message
    )

  } finally {

    loginButton.disabled =
      false

    loginButton.textContent =
      'Sign in'

  }

}

if (form) {

  form.addEventListener(
    'submit',
    handleLogin
  )

}