// =====================================================
// ERROR SERVICE
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// ERROR CODES
// =====================================================

import {

  get,

  showMessage

} from './domService.js'

export const ERROR_CODES = {

  NETWORK_ERROR:
    'NETWORK_ERROR',

  VALIDATION_ERROR:
    'VALIDATION_ERROR',

  DUPLICATE_RECORD:
    'DUPLICATE_RECORD',

  FOREIGN_KEY:
    'FOREIGN_KEY',

  NOT_FOUND:
    'NOT_FOUND',

  PERMISSION_DENIED:
    'PERMISSION_DENIED',

  AUTH_REQUIRED:
    'AUTH_REQUIRED',

  SESSION_EXPIRED:
    'SESSION_EXPIRED',

  SERVER_ERROR:
    'SERVER_ERROR',

  UNKNOWN_ERROR:
    'UNKNOWN_ERROR'

}

// =====================================================
// FRIENDLY MESSAGES
// =====================================================

const FRIENDLY_MESSAGES = {

  NETWORK_ERROR:
    'Unable to connect to the server. Please check your internet connection.',

  VALIDATION_ERROR:
    'Please review the information entered and try again.',

  DUPLICATE_RECORD:
    'A record with the same information already exists.',

  FOREIGN_KEY:
    'This record is linked to other records and cannot be deleted.',

  NOT_FOUND:
    'The requested record could not be found.',

  PERMISSION_DENIED:
    'You do not have permission to perform this action.',

  AUTH_REQUIRED:
    'Please sign in and try again.',

  SESSION_EXPIRED:
    'Your session has expired. Please sign in again.',

  SERVER_ERROR:
    'The server encountered a problem processing your request.',

  UNKNOWN_ERROR:
    'An unexpected error occurred.'

}

// =====================================================
// CREATE ERROR
// =====================================================

export function createError({

  code =
    ERROR_CODES.UNKNOWN_ERROR,

  message = '',

  details = null

}) {

  return {

    code,

    message,

    details,

    timestamp:
      new Date()
        .toISOString()

  }

}

// =====================================================
// PARSE SUPABASE ERROR
// =====================================================

export function parseSupabaseError(
  error
) {

  if (!error) {

    return createError({
      code:
        ERROR_CODES.UNKNOWN_ERROR
    })

  }

  const message =
    String(
      error.message || ''
    ).toLowerCase()

  // ------------------------------------------
  // DUPLICATE RECORD
  // ------------------------------------------

  if (

    message.includes(
      'duplicate key'
    ) ||

    message.includes(
      'already exists'
    )

  ) {

    return createError({

      code:
        ERROR_CODES.DUPLICATE_RECORD,

      message:
        'A matching record already exists.',

      details:
        error

    })

  }

  // ------------------------------------------
  // FOREIGN KEY
  // ------------------------------------------

  if (

    message.includes(
      'foreign key'
    ) ||

    message.includes(
      'violates foreign key constraint'
    )

  ) {

    return createError({

      code:
        ERROR_CODES.FOREIGN_KEY,

      message:
        'This record is linked to other records and cannot be deleted.',

      details:
        error

    })

  }

  // ------------------------------------------
  // NULL CONSTRAINT
  // ------------------------------------------

  if (

    message.includes(
      'null value'
    ) ||

    message.includes(
      'not-null constraint'
    )

  ) {

    return createError({

      code:
        ERROR_CODES.VALIDATION_ERROR,

      message:
        'A required field is missing.',

      details:
        error

    })

  }

  // ------------------------------------------
  // PERMISSION
  // ------------------------------------------

  if (

    message.includes(
      'permission denied'
    ) ||

    message.includes(
      'not authorized'
    )

  ) {

    return createError({

      code:
        ERROR_CODES.PERMISSION_DENIED,

      message:
        FRIENDLY_MESSAGES.PERMISSION_DENIED,

      details:
        error

    })

  }

  // ------------------------------------------
  // JWT
  // ------------------------------------------

  if (

    message.includes(
      'jwt'
    ) ||

    message.includes(
      'expired'
    )

  ) {

    return createError({

      code:
        ERROR_CODES.SESSION_EXPIRED,

      message:
        FRIENDLY_MESSAGES.SESSION_EXPIRED,

      details:
        error

    })

  }

  // ------------------------------------------
  // NOT FOUND
  // ------------------------------------------

  if (

    message.includes(
      'not found'
    )

  ) {

    return createError({

      code:
        ERROR_CODES.NOT_FOUND,

      message:
        FRIENDLY_MESSAGES.NOT_FOUND,

      details:
        error

    })

  }

  return createError({

    code:
      ERROR_CODES.SERVER_ERROR,

    message:
      error.message ||
      FRIENDLY_MESSAGES.SERVER_ERROR,

    details:
      error

  })

}

// =====================================================
// PARSE ANY ERROR
// =====================================================

export function parseError(
  error
) {

  if (!error) {

    return createError({
      code:
        ERROR_CODES.UNKNOWN_ERROR
    })

  }

  if (
    typeof error ===
    'string'
  ) {

    return createError({

      code:
        ERROR_CODES.UNKNOWN_ERROR,

      message:
        error

    })

  }

  if (
    error.code ||
    error.details ||
    error.hint
  ) {

    return parseSupabaseError(
      error
    )

  }

  return createError({

    code:
      ERROR_CODES.UNKNOWN_ERROR,

    message:
      error.message ||
      FRIENDLY_MESSAGES.UNKNOWN_ERROR,

    details:
      error

  })

}

// =====================================================
// FRIENDLY MESSAGE
// =====================================================

export function getFriendlyError(
  error
) {

  const parsed =
    parseError(
      error
    )

  return (
    parsed.message ||

    FRIENDLY_MESSAGES[
      parsed.code
    ] ||

    FRIENDLY_MESSAGES.UNKNOWN_ERROR
  )

}

// =====================================================
// VALIDATION ERROR
// =====================================================

export function buildValidationError(
  field,
  message
) {

  return {

    field,

    message

  }

}

// =====================================================
// MULTIPLE VALIDATION ERRORS
// =====================================================

export function buildValidationErrors(
  errors = []
) {

  return {

    valid:
      false,

    errors

  }

}

// =====================================================
// IMPORT ERROR
// =====================================================

export function buildImportError({

  row,

  field,

  value,

  message

}) {

  return {

    row,

    field,

    value,

    message

  }

}

// =====================================================
// IMPORT SUMMARY
// =====================================================

export function buildImportSummary({

  totalRows = 0,

  successfulRows = 0,

  failedRows = 0

}) {

  return {

    totalRows,

    successfulRows,

    failedRows,

    importedAt:
      new Date()
        .toISOString()

  }

}

// =====================================================
// LOG ERROR
// =====================================================

export function logError(
  error,
  context = ''
) {

  console.error({

    context,

    error,

    timestamp:
      new Date()
        .toISOString()

  })

}

// =====================================================
// TRY WRAPPER
// =====================================================

export async function tryExecute(
  callback,
  context = ''
) {

  try {

    return {

      success: true,

      data:
        await callback()

    }

  } catch (error) {

    logError(
      error,
      context
    )

    return {

      success: false,

      error:
        parseError(
          error
        )

    }

  }

}

export function getFederationFriendlyError(
  error
) {

  const message =
    String(
      error?.message || ''
    ).toLowerCase()

  if (

    message.includes(
      'foreign key'
    )

  ) {

    return (
      'This record is currently being used elsewhere in the federation system and cannot be removed.'
    )

  }

  if (

    message.includes(
      'duplicate key'
    )

  ) {

    return (
      'A similar record already exists.'
    )

  }

  if (

    message.includes(
      'not-null'
    )

  ) {

    return (
      'Please complete all required fields.'
    )

  }

  return getFriendlyError(
    error
  )

}

export async function executeSafely({

  action,

  onError = null

}) {

  try {

    return await action()

  } catch (
    error
  ) {

    console.error(
      error
    )

    const message =
      getFederationFriendlyError(
        error
      )

    if (
      onError
    ) {

      onError(
        message
      )

    }

    throw error

  }

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
