// =====================================================
// UI SERVICE
// ParaCycling Federation Management System
// =====================================================

import {
  get,
  show,
  hide,
  setText,
  setHtml
} from './domService.js'

// =====================================================
// LOADING
// =====================================================

export function showLoading(
  elementId
) {

  const element =
    get(elementId)

  if (!element) {
    return false
  }

  show(elementId)

  return true
}

export function hideLoading(
  elementId
) {

  const element =
    get(elementId)

  if (!element) {
    return false
  }

  hide(elementId)

  return true
}

// =====================================================
// PAGE LOADER
// =====================================================

export function showPageLoader() {

  document.body.classList.add(
    'loading'
  )

}

export function hidePageLoader() {

  document.body.classList.remove(
    'loading'
  )

}

// =====================================================
// ALERTS
// =====================================================

export function showSuccess(
  containerId,
  message,
  timeout = 4000
) {

  showMessage({
    containerId,
    message,
    alertClass:
      'alert-success',
    timeout
  })

}

export function showError(
  containerId,
  message,
  timeout = 0
) {

  showMessage({
    containerId,
    message,
    alertClass:
      'alert-danger',
    timeout
  })

}

export function showWarning(
  containerId,
  message,
  timeout = 5000
) {

  showMessage({
    containerId,
    message,
    alertClass:
      'alert-warning',
    timeout
  })

}

export function showInfo(
  containerId,
  message,
  timeout = 4000
) {

  showMessage({
    containerId,
    message,
    alertClass:
      'alert-info',
    timeout
  })

}

export function clearMessage(
  containerId
) {

  const container =
    get(containerId)

  if (!container) {
    return
  }

  container.classList.add(
    'd-none'
  )

  container.textContent = ''

}

// =====================================================
// INTERNAL MESSAGE ENGINE
// =====================================================

function showMessage({
  containerId,
  message,
  alertClass,
  timeout
}) {

  const container =
    get(containerId)

  if (!container) {
    return false
  }

  container.className =
    `alert ${alertClass}`

  container.textContent =
    message

  container.classList.remove(
    'd-none'
  )

  if (
    timeout > 0
  ) {

    setTimeout(
      () =>
        clearMessage(
          containerId
        ),
      timeout
    )

  }

  return true

}

// =====================================================
// TOASTS
// =====================================================

export function toastSuccess(
  message
) {

  console.log(
    `✅ ${message}`
  )

}

export function toastError(
  message
) {

  console.error(
    `❌ ${message}`
  )

}

export function toastWarning(
  message
) {

  console.warn(
    `⚠️ ${message}`
  )

}

export function toastInfo(
  message
) {

  console.info(
    `ℹ️ ${message}`
  )

}

// =====================================================
// CONFIRMATIONS
// =====================================================


export function confirmDelete(
  itemName =
    'record'
) {

  return window.confirm(
    `Delete this ${itemName}?`
  )

}

// =====================================================
// NOTIFICATIONS
// =====================================================

export function notify({
  type = 'info',
  message = ''
}) {

  switch (type) {

    case 'success':
      toastSuccess(
        message
      )
      break

    case 'error':
      toastError(
        message
      )
      break

    case 'warning':
      toastWarning(
        message
      )
      break

    default:
      toastInfo(
        message
      )

  }

}

// =====================================================
// SCROLLING
// =====================================================

export function scrollToTop() {

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })

}

export function scrollToElement(
  elementId
) {

  const element =
    get(elementId)

  if (!element) {
    return false
  }

  element.scrollIntoView({
    behavior:
      'smooth',
    block:
      'start'
  })

  return true

}

// =====================================================
// EMPTY STATES
// =====================================================

export function showEmptyState({
  containerId,
  message =
    'No records found.'
}) {

  setHtml(
    containerId,
    `
      <div class="text-center p-4">
        <div class="text-muted">
          ${message}
        </div>
      </div>
    `
  )

}

export function showTableError({
  containerId,
  message =
    'Unable to load records.'
}) {

  setHtml(
    containerId,
    `
      <tr>
        <td
          colspan="100"
          class="text-center text-danger"
        >
          ${message}
        </td>
      </tr>
    `
  )

}

export async function confirmAction({

  title = 'Confirm',

  message = 'Continue?',

  confirmText = 'Yes'

}) {

  if (
    window.Swal
  ) {

    const result =
      await Swal.fire({

        title,

        text: message,

        icon: 'warning',

        showCancelButton: true,

        confirmButtonText:
          confirmText

      })

    return result.isConfirmed

  }

  return confirm(message)

}
