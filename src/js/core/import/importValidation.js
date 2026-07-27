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

  const text =

        String(

          value

        ).trim()

  // ==========================================
  // Already ISO
  // ==========================================

  if (

    /^\d{4}-\d{2}-\d{2}$/.test(

      text

    )

  ) {
    return {

      valid: true,

      value: text,

      message: null

    }
  }

  // ==========================================
  // Excel / CSV (M/D/YYYY)
  // ==========================================

  const usMatch =

        text.match(

          /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

        )

  if (

    usMatch

  ) {
    const [

      ,

      month,

      day,

      year

    ] = usMatch

    return {

      valid: true,

      value:

                `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,

      message: null

    }
  }

  return {

    valid: false,

    value: null,

    message:

            'Date must be in YYYY-MM-DD format.'

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
    return buildValidationResult({
      valid: true,
      value: null
    })
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
    return buildValidationResult({
      valid: false,
      value: null,
      message: 'Invalid email address.'
    })
  }

  return buildValidationResult({
    valid: true,
    value:
      String(
        value
      ).trim()
  })
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
    return buildValidationResult({
      valid: true,
      value: null
    })
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
    return buildValidationResult({
      valid: false,
      value: null,
      message: 'Invalid phone number.'
    })
  }

  return buildValidationResult({
    valid: true,
    value: phone
  })
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
    return buildValidationResult({
      valid: false,
      value: null,
      message:
        `Minimum length is ${minimum}.`
    })
  }

  if (

    text.length > maximum

  ) {
    return buildValidationResult({
      valid: false,
      value: null,
      message:
        `Maximum length is ${maximum}.`
    })
  }

  return buildValidationResult({
    valid: true,
    value: text
  })
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
    return buildValidationResult({
      valid: true,
      value: null
    })
  }

  if (

    !regex.test(
      String(
        value
      )
    )

  ) {
    return buildValidationResult({
      valid: false,
      value: null,
      message
    })
  }

  return buildValidationResult({
    valid: true,
    value
  })
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
    return buildValidationResult({
      valid: true,
      value: null
    })
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
    return buildValidationResult({
      valid: true,
      value: true
    })
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
    return buildValidationResult({
      valid: true,
      value: false
    })
  }

  return buildValidationResult({
    valid: false,
    value: null,
    message:
      'Invalid boolean value.'
  })
}

// =====================================================
// BUILD VALIDATION RESULT
// =====================================================

export function buildValidationResult({

  valid,

  row = null,

  column = null,

  header = null,

  value = null,

  type = 'validation',

  severity = valid ?
    null :
    'error',

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
// VALIDATE REQUIRED FIELDS IN IMPORT ROWS
// =====================================================

export function validateRequiredFields(
  result = {},
  requiredFields = [],
  {
    rowsKey = 'rows',
    errorsKey = 'errors',
    rowNumberKey = 'rowNumber',
    rowOffset = 1,
    labels = {}
  } = {}
) {
  const rows =
    Array.isArray(
      result[rowsKey]
    ) ?
      result[rowsKey] :
      []

  if (!Array.isArray(result[errorsKey])) {
    result[errorsKey] = []
  }

  rows.forEach(
    (
      row,
      index
    ) => {
      for (const field of requiredFields) {
        const check =
          validateRequired(
            row?.[field],
            labels[field] || field
          )

        if (!check.valid) {
          result[errorsKey].push({
            rowNumber:
              row?.[rowNumberKey] ??
              index + rowOffset,
            field,
            message:
              check.message
          })
        }
      }
    }
  )

  return result
}

export function findDuplicateRows(
  rows = [],
  keys = [],
  {
    rowNumberKey = 'rowNumber',
    rowOffset = 1,
    caseSensitive = false,
    ignoreEmpty = true,
    trim = true
  } = {}
) {
  const seen = new Map()
  const duplicates = []

  rows.forEach(
    (
      row,
      index
    ) => {
      const values =
        keys.map(
          key =>
            normalizeValue(
              row?.[key],
              {
                trim,
                caseSensitive
              }
            )
        )

      if (
        ignoreEmpty &&
        values.every(
          value => value === ''
        )
      ) {
        return
      }

      const compositeKey =
        values.join('|')

      const rowNumber =
        row?.[rowNumberKey] ??
        index + rowOffset

      if (seen.has(compositeKey)) {
        duplicates.push({
          rowNumber,
          duplicateOf:
            seen.get(compositeKey),
          key: compositeKey,
          record: row
        })
        return
      }

      seen.set(
        compositeKey,
        rowNumber
      )
    }
  )

  return duplicates
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
      } else {
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

        duplicates.length ?

          'error' :

          null,

    message:

        duplicates.length ?

          'Duplicate records found.' :

          null

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
