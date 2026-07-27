import {
  login
}
  from "../auth/authService.js"

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
    isError ?
      'alert alert-danger mt-3' :
      'alert alert-success mt-3'
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


    await login(
      email,
      password
    )


    showMessage(
      'Login successful. Redirecting...',
      false
    )

    window.location.href =
      '/'
  } catch (error) {

    try {
    } catch (
      jsonError
    ) {
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
    } else {
      switch (error?.status) {
        case 400: {
          message =
        'Invalid email or password.'

          break
        }

        case 401: {
          message =
        'Authentication failed.'

          break
        }

        case 403: {
          message =
        'Your account does not have permission to access the portal.'

          break
        }

        case 404: {
          message =
        'User account not found.'

          break
        }

        case 500: {
          message =
        'Server error. Please contact the system administrator.'

          break
        }
 // No default
      }
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

initializePasswordToggle()
if (form) {
  form.addEventListener(
    'submit',
    handleLogin
  )
}

function initializePasswordToggle() {
  const passwordField =
    document.getElementById(
      'password'
    )

  const toggleButton =
    document.getElementById(
      'togglePassword'
    )

  if (
    !passwordField ||
    !toggleButton
  ) {
    return
  }

  toggleButton.addEventListener(
    'click',
    () => {
      passwordField.type =
        passwordField.type ===
        'password' ?
          'text' :
          'password'
    }
  )
}
