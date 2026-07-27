import {
  SUCCESS_TIMEOUT,
  INFO_TIMEOUT,
  WARNING_TIMEOUT,
  ERROR_TIMEOUT
} from './constants.js'

const FEEDBACK_HOST_ID =
  'appInlineFeedback'

const CONFIRM_HOST_ID =
  'appInlineConfirmation'

const messageTimers =
  new WeakMap()

let pendingConfirmation =
  null

function resolvePageRoot() {
  return (
    document.querySelector(
      '.modal.show .modal-body'
    ) ||
    document.querySelector(
      '.container-fluid .card-body'
    ) ||
    document.querySelector(
      '.container-fluid'
    ) ||
    document.querySelector('main') ||
    document.body
  )
}

function createHost({
  id,
  className
}) {
  const existing =
    document.getElementById(id)

  if (existing) {
    return existing
  }

  const root =
    resolvePageRoot()

  if (!root) {
    return null
  }

  const host =
    document.createElement('div')

  host.id = id
  host.className = className
  host.setAttribute(
    'role',
    'status'
  )
  host.setAttribute(
    'aria-live',
    'polite'
  )

  root.prepend(host)

  return host
}

function isVisible(element) {
  if (!element) {
    return false
  }

  return Boolean(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  )
}

function resolveMessageHost(
  containerId = null,
  containerSelector = null
) {
  if (containerId) {
    const explicit =
      document.getElementById(
        containerId
      )

    if (explicit) {
      return explicit
    }
  }

  if (containerSelector) {
    const matches =
      Array.from(
        document.querySelectorAll(
          containerSelector
        )
      )

    const visible =
      matches.find(
        element =>
          isVisible(element)
      )

    if (visible) {
      return visible
    }

    if (matches[0]) {
      return matches[0]
    }
  }

  return createHost({
    id: FEEDBACK_HOST_ID,
    className:
      'alert d-none mb-3'
  })
}

function clearTimer(element) {
  const timer =
    messageTimers.get(element)

  if (timer) {
    clearTimeout(timer)
    messageTimers.delete(element)
  }
}

function getTimeout(
  type,
  timeout
) {
  if (
    timeout !== undefined &&
    timeout !== null
  ) {
    return Number(timeout)
  }

  switch (type) {
    case 'success': {
      return SUCCESS_TIMEOUT
    }

    case 'warning': {
      return WARNING_TIMEOUT
    }

    case 'error': {
      return ERROR_TIMEOUT
    }

    default: {
      return INFO_TIMEOUT
    }
  }
}

function getAlertClass(type) {
  switch (type) {
    case 'success': {
      return 'alert-success'
    }

    case 'warning': {
      return 'alert-warning'
    }

    case 'error': {
      return 'alert-danger'
    }

    default: {
      return 'alert-info'
    }
  }
}

export function clearInlineFeedback(
  containerId = null,
  containerSelector = null
) {
  const element =
    resolveMessageHost(
      containerId,
      containerSelector
    )

  if (!element) {
    return false
  }

  clearTimer(element)

  element.textContent = ''
  element.classList.add(
    'd-none'
  )

  element.classList.remove(
    'alert-success',
    'alert-danger',
    'alert-warning',
    'alert-info'
  )

  return true
}

export function showInlineMessage(
  message,
  {
    type = 'info',
    containerId = null,
    containerSelector = null,
    timeout = null,
    sticky = false
  } = {}
) {
  const element =
    resolveMessageHost(
      containerId,
      containerSelector
    )

  if (!element) {
    return false
  }

  clearTimer(element)

  element.classList.remove(
    'alert-success',
    'alert-danger',
    'alert-warning',
    'alert-info',
    'd-none'
  )

  element.classList.add(
    'alert',
    getAlertClass(type)
  )

  element.textContent =
    String(message || '')

  const duration =
    sticky ?
      0 :
      getTimeout(
        type,
        timeout
      )

  if (duration > 0) {
    const timer =
      setTimeout(
        () => {
          clearInlineFeedback(
            containerId,
            containerSelector
          )
        },
        duration
      )

    messageTimers.set(
      element,
      timer
    )
  }

  return true
}

export function showInlineSuccess(
  message,
  options = {}
) {
  return showInlineMessage(
    message,
    {
      ...options,
      type: 'success'
    }
  )
}

export function showInlineError(
  message,
  options = {}
) {
  return showInlineMessage(
    message,
    {
      ...options,
      type: 'error'
    }
  )
}

export function showInlineWarning(
  message,
  options = {}
) {
  return showInlineMessage(
    message,
    {
      ...options,
      type: 'warning'
    }
  )
}

export function showInlineInfo(
  message,
  options = {}
) {
  return showInlineMessage(
    message,
    {
      ...options,
      type: 'info'
    }
  )
}

export function createFeedbackController({
  containerId = null,
  containerSelector = null,
  errorOptions = {},
  successOptions = {},
  warningOptions = {},
  infoOptions = {}
} = {}) {
  const withTarget = options => ({
    ...options,
    containerId,
    containerSelector
  })

  return {
    error(
      message,
      options = {}
    ) {
      return showInlineError(
        message,
        withTarget({
          ...errorOptions,
          ...options
        })
      )
    },

    success(
      message,
      options = {}
    ) {
      return showInlineSuccess(
        message,
        withTarget({
          ...successOptions,
          ...options
        })
      )
    },

    warning(
      message,
      options = {}
    ) {
      return showInlineWarning(
        message,
        withTarget({
          ...warningOptions,
          ...options
        })
      )
    },

    info(
      message,
      options = {}
    ) {
      return showInlineInfo(
        message,
        withTarget({
          ...infoOptions,
          ...options
        })
      )
    },

    clear() {
      return clearInlineFeedback(
        containerId,
        containerSelector
      )
    }
  }
}

export function createDualFeedbackController({
  errorContainerId = null,
  successContainerId = null,
  errorOptions = {},
  successOptions = {}
} = {}) {
  const errorController =
    createFeedbackController({
      containerId: errorContainerId,
      errorOptions
    })

  const successController =
    createFeedbackController({
      containerId: successContainerId,
      successOptions
    })

  return {
    error(
      message,
      options = {}
    ) {
      return errorController.error(
        message,
        options
      )
    },

    success(
      message,
      options = {}
    ) {
      return successController.success(
        message,
        options
      )
    },

    clearError() {
      return errorController.clear()
    },

    clearSuccess() {
      return successController.clear()
    },

    clear() {
      errorController.clear()
      successController.clear()
      return true
    }
  }
}

function removeConfirmationHost() {
  const host =
    document.getElementById(
      CONFIRM_HOST_ID
    )

  host?.remove()
}

export function confirmAction({
  title = 'Confirm',
  message = 'Continue?',
  confirmText = 'Yes',
  cancelText = 'Cancel',
  type = 'warning'
} = {}) {
  if (pendingConfirmation) {
    pendingConfirmation(false)
    pendingConfirmation = null
  }

  removeConfirmationHost()

  const root =
    resolvePageRoot()

  if (!root) {
    return Promise.resolve(false)
  }

  const host =
    document.createElement('div')

  host.id = CONFIRM_HOST_ID
  host.className =
    `alert ${getAlertClass(type)} mb-3`
  host.setAttribute(
    'role',
    'alertdialog'
  )
  host.setAttribute(
    'aria-modal',
    'false'
  )

  const heading =
    document.createElement('div')

  heading.className =
    'fw-semibold mb-1'
  heading.textContent =
    String(title || 'Confirm')

  const body =
    document.createElement('div')

  body.className = 'mb-3'
  body.textContent =
    String(message || '')

  const actions =
    document.createElement('div')

  actions.className =
    'd-flex gap-2 flex-wrap'

  const confirmButton =
    document.createElement('button')

  confirmButton.type = 'button'
  confirmButton.className =
    'btn btn-sm btn-danger'
  confirmButton.textContent =
    String(confirmText || 'Yes')

  const cancelButton =
    document.createElement('button')

  cancelButton.type = 'button'
  cancelButton.className =
    'btn btn-sm btn-secondary'
  cancelButton.textContent =
    String(cancelText || 'Cancel')

  actions.append(
    confirmButton,
    cancelButton
  )

  host.append(
    heading,
    body,
    actions
  )

  root.prepend(host)

  return new Promise(resolve => {
    let settled = false

    const finish = value => {
      if (settled) {
        return
      }

      settled = true
      pendingConfirmation = null
      removeConfirmationHost()
      resolve(value)
    }

    pendingConfirmation =
      finish

    confirmButton.addEventListener(
      'click',
      () => finish(true),
      { once: true }
    )

    cancelButton.addEventListener(
      'click',
      () => finish(false),
      { once: true }
    )

    cancelButton.focus()
  })
}


let globalErrorHandlingInstalled =
  false

function getErrorMessage(
  value,
  fallback
) {
  if (
    value &&
    typeof value === 'object' &&
    value.message
  ) {
    return String(
      value.message
    )
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    return value.trim()
  }

  return fallback
}

export function installGlobalErrorHandling() {
  if (
    globalErrorHandlingInstalled ||
    typeof window === 'undefined'
  ) {
    return false
  }

  globalErrorHandlingInstalled =
    true

  window.addEventListener(
    'error',
    event => {
      showInlineError(
        getErrorMessage(
          event.error ||
          event.message,
          'An unexpected error occurred.'
        ),
        {
          sticky: true
        }
      )
    }
  )

  window.addEventListener(
    'unhandledrejection',
    event => {
      showInlineError(
        getErrorMessage(
          event.reason,
          'An unexpected operation failed.'
        ),
        {
          sticky: true
        }
      )
    }
  )

  return true
}
