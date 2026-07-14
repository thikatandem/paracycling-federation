// =====================================================
// IMPORT VALIDATION
// ParaCycling Federation Management System
// =====================================================


// =====================================================
// VALIDATE HEADERS
// =====================================================

export function validateHeaders(
  headers = [],
  requiredHeaders = []
) {

  const normalizedHeaders =
    headers.map(
      header =>
        String(
          header
        )
          .trim()
          .toLowerCase()
    )

  const normalizedRequired =
    requiredHeaders.map(
      header =>
        String(
          header
        )
          .trim()
          .toLowerCase()
    )

  const missing =
    normalizedRequired.filter(
      header =>
        !normalizedHeaders.includes(
          header
        )
    )

  const unexpected =
    normalizedHeaders.filter(
      header =>
        !normalizedRequired.includes(
          header
        )
    )

  const duplicates =
    normalizedHeaders.filter(
      (
        header,
        index
      ) =>
        normalizedHeaders.indexOf(
          header
        ) !== index
    )

  return {

    valid:

      missing.length === 0 &&

      duplicates.length === 0,

    missing,

    unexpected,

    duplicates

  }

}

// =====================================================
// VALIDATE REQUIRED
// =====================================================

export function validateRequired(
  value,
  fieldName = 'Field'
) {

  if (

    value === null ||

    value === undefined

  ) {

    return {

      valid: false,

      value: null,

      message:
        `${fieldName} is required.`

    }

  }

  if (

    String(
      value
    )
      .trim() === ''

  ) {

    return {

      valid: false,

      value: null,

      message:
        `${fieldName} is required.`

    }

  }

  return {

    valid: true,

    value,

    message: null

  }

}

// =====================================================
// VALIDATE NUMBER
// =====================================================

export function validateNumber(

  value,

  {

    min = null,

    max = null,

    allowDecimal = true,

    allowNegative = true,

    required = false

  } = {}

) {

  if (

    value === null ||

    value === undefined ||

    value === ''

  ) {

    if (
      required
    ) {

      return {

        valid: false,

        value: null,

        message:
          'Number is required.'

      }

    }

    return {

      valid: true,

      value: null,

      message: null

    }

  }

  const number =
    Number(
      value
    )

  if (

    Number.isNaN(
      number
    )

  ) {

    return {

      valid: false,

      value: null,

      message:
        'Invalid number.'

    }

  }

  if (

    !allowDecimal &&

    !Number.isInteger(
      number
    )

  ) {

    return {

      valid: false,

      value: null,

      message:
        'Whole numbers only.'

    }

  }

  if (

    !allowNegative &&

    number < 0

  ) {

    return {

      valid: false,

      value: null,

      message:
        'Negative numbers are not allowed.'

    }

  }

  if (

    min !== null &&

    number < min

  ) {

    return {

      valid: false,

      value: null,

      message:
        `Minimum value is ${min}.`

    }

  }

  if (

    max !== null &&

    number > max

  ) {

    return {

      valid: false,

      value: null,

      message:
        `Maximum value is ${max}.`

    }

  }

  return {

    valid: true,

    value: number,

    message: null

  }

}

// =====================================================
// VALIDATE DATE
// =====================================================

export function validateDate(
  value
) {

  if (

    value === null ||

    value === undefined ||

    value === ''

  ) {

    return {

      valid: true,

      value: null,

      message: null

    }

  }

  const regex =
    /^\d{4}-\d{2}-\d{2}$/

  if (

    !regex.test(
      value
    )

  ) {

    return {

      valid: false,

      value: null,

      message:
        'Date must be in YYYY-MM-DD format.'

    }

  }

  const date =
    new Date(
      value
    )

  if (

    Number.isNaN(
      date.getTime()
    )

  ) {

    return {

      valid: false,

      value: null,

      message:
        'Invalid date.'

    }

  }

  return {

    valid: true,

    value,

    message: null

  }

}

// =====================================================
// VALIDATE TIME
// =====================================================

export function validateTime(
  value
) {

  if (

    value === null ||

    value === undefined ||

    value === ''

  ) {

    return {

      valid: true,

      value: null,

      message: null

    }

  }

  const regex =
    /^([01]\d|2[0-3]):([0-5]\d)$/

  if (

    !regex.test(
      value
    )

  ) {

    return {

      valid: false,

      value: null,

      message:
        'Time must be in HH:MM format.'

    }

  }

  return {

    valid: true,

    value,

    message: null

  }

}

// =====================================================
// VALIDATE EMAIL
// =====================================================

export function validateEmail(
  value
) {

  if (

    value === null ||

    value === undefined ||

    value === ''

  ) {

    return buildValidationResult(
      true,
      null
    )

  }

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (

    !regex.test(
      String(
        value
      ).trim()
    )

  ) {

    return buildValidationResult(
      false,
      null,
      'Invalid email address.'
    )

  }

  return buildValidationResult(
    true,
    String(
      value
    ).trim()
  )

}

// =====================================================
// VALIDATE PHONE
// =====================================================

export function validatePhone(
  value
) {

  if (

    value === null ||

    value === undefined ||

    value === ''

  ) {

    return buildValidationResult(
      true,
      null
    )

  }

  const phone =
    String(
      value
    )

      .replace(
        /\s+/g,
        ''
      )

      .replace(
        /-/g,
        ''

      )

  const regex =
    /^\+?[0-9]{7,15}$/

  if (

    !regex.test(
      phone
    )

  ) {

    return buildValidationResult(
      false,
      null,
      'Invalid phone number.'
    )

  }

  return buildValidationResult(
    true,
    phone
  )

}

// =====================================================
// VALIDATE LENGTH
// =====================================================

export function validateLength(

  value,

  {

    minimum = 0,

    maximum = Infinity

  } = {}

) {

  const text =
    String(
      value ?? ''
    )

  if (

    text.length < minimum

  ) {

    return buildValidationResult(

      false,

      null,

      `Minimum length is ${minimum}.`

    )

  }

  if (

    text.length > maximum

  ) {

    return buildValidationResult(

      false,

      null,

      `Maximum length is ${maximum}.`

    )

  }

  return buildValidationResult(
    true,
    text
  )

}

// =====================================================
// VALIDATE REGEX
// =====================================================

export function validateRegex(

  value,

  regex,

  message =
    'Invalid value.'

) {

  if (

    value === null ||

    value === undefined ||

    value === ''

  ) {

    return buildValidationResult(
      true,
      null
    )

  }

  if (

    !regex.test(
      String(
        value
      )
    )

  ) {

    return buildValidationResult(
      false,
      null,
      message
    )

  }

  return buildValidationResult(
    true,
    value
  )

}

// =====================================================
// VALIDATE BOOLEAN
// =====================================================

export function validateBoolean(
  value
) {

  if (

    value === null ||

    value === undefined ||

    value === ''

  ) {

    return buildValidationResult(
      true,
      null
    )

  }

  const text =
    String(
      value
    )

      .trim()

      .toLowerCase()

  if (

    [

      'true',

      'yes',

      '1'

    ].includes(
      text
    )

  ) {

    return buildValidationResult(
      true,
      true
    )

  }

  if (

    [

      'false',

      'no',

      '0'

    ].includes(
      text
    )

  ) {

    return buildValidationResult(
      true,
      false
    )

  }

  return buildValidationResult(

    false,

    null,

    'Invalid boolean value.'

  )

}

// =====================================================
// BUILD VALIDATION RESULT
// =====================================================

function buildValidationResult({

    valid,

    row = null,

    column = null,

    header = null,

    value = null,

    type = 'validation',

    severity = valid
        ? null
        : 'error',

    message = null

} = {}) {

    return {

        valid,

        row,

        column,

        header,

        value,

        type,

        severity,

        message

    }

}
// =====================================================
// VALIDATE DUPLICATES
// =====================================================

export function validateDuplicates(

  rows = [],

  keys = [],

  {

    caseSensitive = false,

    ignoreEmpty = true,

    trim = true

  } = {}

) {

  const duplicates = []

  const seen = new Map()

  rows.forEach(

    (

      row,

      rowIndex

    ) => {

      const compositeKey =

        keys.map(

          key => {

            let value =

              row[
                key
              ]

            if (

              value === null ||

              value === undefined

            ) {

              value = ''

            }

            value =
              String(
                value
              )

            if (
              trim
            ) {

              value =
                value.trim()

            }

            if (

              !caseSensitive

            ) {

              value =
                value.toLowerCase()

            }

            return value

          }

        ).join(
          '|'
        )

      if (

        ignoreEmpty &&

        compositeKey
          .replace(
            /\|/g,
            ''
          ) === ''

      ) {

        return

      }

      if (

        seen.has(
          compositeKey
        )

      ) {

        duplicates.push({

          row:

            rowIndex + 1,

          duplicateOf:

            seen.get(
              compositeKey
            ) + 1,

          key:

            compositeKey,

          record:

            row

        })

      }

      else {

        seen.set(

          compositeKey,

          rowIndex

        )

      }

    }

  )

 return buildValidationResult({

    valid:

        duplicates.length === 0,

    value:

        duplicates,

    type:

        'duplicate',

    severity:

        duplicates.length

            ? 'error'

            : null,

    message:

        duplicates.length

            ? 'Duplicate records found.'

            : null

})

}

// =====================================================
// NORMALIZE VALIDATION VALUE
// =====================================================

function normalizeValue(
  value,
  {
    trim = true,
    caseSensitive = false
  } = {}
) {

  if (

    value === null ||

    value === undefined

  ) {

    return ''

  }

  let normalized =
    String(
      value
    )

  if (
    trim
  ) {

    normalized =
      normalized.trim()

  }

  if (

    !caseSensitive

  ) {

    normalized =
      normalized.toLowerCase()

  }

  return normalized

}
