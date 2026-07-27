// =====================================================
// UI SERVICE
// ParaCycling Federation Management System
// =====================================================

import {
  get,
  show,
  hide,
  setHtml
} from './domService.js'
import {
  showInlineMessage,
  showInlineSuccess,
  showInlineError,
  showInlineWarning,
  showInlineInfo,
  clearInlineFeedback,
  createFeedbackController,
  confirmAction
} from './feedbackService.js'

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

export function setLoadingState(
  elementOrId,
  visible = true
) {
  const element =
    typeof elementOrId === 'string' ?
      get(elementOrId) :
      elementOrId

  if (!element) {
    return false
  }

  element.classList.toggle(
    'd-none',
    !visible
  )

  return true
}

export function createLoadingStateSetter(
  elementOrId
) {
  return (
    visible = true
  ) =>
    setLoadingState(
      elementOrId,
      visible
    )
}

export function createLoadingController(
  elementOrId
) {
  return {
    show() {
      return setLoadingState(
        elementOrId,
        true
      )
    },

    hide() {
      return setLoadingState(
        elementOrId,
        false
      )
    },

    set(
      visible = true
    ) {
      return setLoadingState(
        elementOrId,
        visible
      )
    }
  }
}

export function createAsyncRefresher(
  ...loaders
) {
  return async function refreshAll() {
    await Promise.all(
      loaders.map(
        loader =>
          loader()
      )
    )
  }
}

// =====================================================
// INLINE FEEDBACK
// =====================================================

export function toastSuccess(
  message,
  options = {}
) {
  return showInlineSuccess(
    message,
    options
  )
}

export function toastError(
  message,
  options = {}
) {
  return showInlineError(
    message,
    options
  )
}

export function toastWarning(
  message,
  options = {}
) {
  return showInlineWarning(
    message,
    options
  )
}

export function toastInfo(
  message,
  options = {}
) {
  return showInlineInfo(
    message,
    options
  )
}

export function notify({
  type = 'info',
  message = '',
  containerId = null,
  timeout = null,
  sticky = false
} = {}) {
  return showInlineMessage(
    message,
    {
      type,
      containerId,
      timeout,
      sticky
    }
  )
}

export async function confirmDelete(
  itemName = 'record'
) {
  return confirmAction({
    title: 'Confirm Delete',
    message:
      `Delete this ${itemName}?`,
    confirmText: 'Delete',
    type: 'warning'
  })
}

export {
  showInlineMessage,
  showInlineSuccess,
  showInlineError,
  showInlineWarning,
  showInlineInfo,
  clearInlineFeedback,
  createFeedbackController,
  confirmAction
}

// =====================================================
// PRINTING
// =====================================================

export function printCurrentView() {
  window.print()
  return true
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
    behavior: 'smooth',
    block: 'start'
  })

  return true
}

// =====================================================
// EMPTY / ERROR STATES
// =====================================================

export function showEmptyState({
  containerId,
  message = 'No records found.'
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
  message = 'Unable to load records.'
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
