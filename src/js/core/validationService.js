// =====================================================
// VALIDATION SERVICE
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// HELPERS
// =====================================================


import {
  getValue
} from './domService.js'

export function validateRequiredFields({

  fields = [],

  errorElementId,

  showError

}) {

  for (
    const field
    of fields
  ) {

    const value =
      getValue(
        field.id
      )

    if (
      !String(
        value || ''
      ).trim()
    ) {

      showError(

        errorElementId,

        `${field.label} is required`

      )

      return false

    }

  }

  return true

}


function result(
  valid,
  message = ''
) {

  return {
    valid,
    message
  }

}

// =====================================================
// REQUIRED
// =====================================================

export function required(
  value,
  fieldName = 'Field'
) {

  const valid =
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ''

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} is required.`
      )

}

// =====================================================
// TEXT
// =====================================================

export function minLength(
  value,
  min,
  fieldName = 'Field'
) {

  const valid =
    String(value || '')
      .trim()
      .length >= min

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} must be at least ${min} characters.`
      )

}

export function maxLength(
  value,
  max,
  fieldName = 'Field'
) {

  const valid =
    String(value || '')
      .trim()
      .length <= max

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} cannot exceed ${max} characters.`
      )

}

export function exactLength(
  value,
  length,
  fieldName = 'Field'
) {

  const valid =
    String(value || '')
      .trim()
      .length === length

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} must contain exactly ${length} characters.`
      )

}

// =====================================================
// EMAIL
// =====================================================

export function email(
  value
) {

  if (!value) {
    return result(true)
  }

  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return regex.test(value)
    ? result(true)
    : result(
        false,
        'Email address is invalid.'
      )

}

// =====================================================
// PHONE
// =====================================================

export function phone(
  value
) {

  if (!value) {
    return result(true)
  }

  const cleaned =
    String(value)
      .replace(/\s/g, '')
      .replace(/-/g, '')

  const regex =
    /^(\+254|254|0)?[17]\d{8}$/

  return regex.test(cleaned)
    ? result(true)
    : result(
        false,
        'Phone number is invalid.'
      )

}

// =====================================================
// URL
// =====================================================

export function url(
  value
) {

  if (!value) {
    return result(true)
  }

  try {

    new URL(value)

    return result(true)

  } catch {

    return result(
      false,
      'URL is invalid.'
    )

  }

}

// =====================================================
// NUMBERS
// =====================================================

export function numeric(
  value,
  fieldName = 'Field'
) {

  const valid =
    !isNaN(value)

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} must be numeric.`
      )

}

export function integer(
  value,
  fieldName = 'Field'
) {

  const valid =
    Number.isInteger(
      Number(value)
    )

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} must be a whole number.`
      )

}

export function decimal(
  value,
  fieldName = 'Field'
) {

  const valid =
    !isNaN(
      parseFloat(value)
    )

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} must be a valid decimal number.`
      )

}

export function positive(
  value,
  fieldName = 'Field'
) {

  const valid =
    Number(value) > 0

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} must be greater than zero.`
      )

}

export function nonNegative(
  value,
  fieldName = 'Field'
) {

  const valid =
    Number(value) >= 0

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} cannot be negative.`
      )

}

// =====================================================
// UUID
// =====================================================

export function uuid(
  value
) {

  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  return regex.test(value)
    ? result(true)
    : result(
        false,
        'Invalid identifier.'
      )

}

// =====================================================
// DATE
// =====================================================

export function date(
  value,
  fieldName = 'Date'
) {

  const valid =
    !isNaN(
      Date.parse(value)
    )

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} is invalid.`
      )

}

export function futureDate(
  value,
  fieldName = 'Date'
) {

  const valid =
    new Date(value) >
    new Date()

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} must be in the future.`
      )

}

export function pastDate(
  value,
  fieldName = 'Date'
) {

  const valid =
    new Date(value) <
    new Date()

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} must be in the past.`
      )

}

export function dateRange(
  startDate,
  endDate
) {

  const valid =
    new Date(startDate) <=
    new Date(endDate)

  return valid
    ? result(true)
    : result(
        false,
        'Start date cannot be after end date.'
      )

}

// =====================================================
// AGE
// =====================================================

export function minimumAge(
  dateOfBirth,
  age
) {

  const dob =
    new Date(dateOfBirth)

  const today =
    new Date()

  const years =
    today.getFullYear() -
    dob.getFullYear()

  return years >= age
    ? result(true)
    : result(
        false,
        `Minimum age is ${age}.`
      )

}

// =====================================================
// ENUMS
// =====================================================

export function oneOf(
  value,
  allowedValues,
  fieldName = 'Field'
) {

  const valid =
    allowedValues.includes(
      value
    )

  return valid
    ? result(true)
    : result(
        false,
        `${fieldName} contains an invalid value.`
      )

}

// =====================================================
// FILES
// =====================================================

export function fileSize(
  file,
  maxMb
) {

  const sizeMb =
    file.size /
    1024 /
    1024

  return sizeMb <= maxMb
    ? result(true)
    : result(
        false,
        `File exceeds ${maxMb} MB.`
      )

}

export function fileExtension(
  file,
  allowed
) {

  const extension =
    file.name
      .split('.')
      .pop()
      .toLowerCase()

  return allowed.includes(
    extension
  )
    ? result(true)
    : result(
        false,
        `Allowed file types: ${allowed.join(', ')}`
      )

}

// =====================================================
// LOOKUPS
// =====================================================

export function lookupExists(
  value,
  lookup,
  fieldName
) {

  const found =
    lookup.some(
      item =>
        item === value
    )

  return found
    ? result(true)
    : result(
        false,
        `${fieldName} was not found.`
      )

}

// =====================================================
// UNIQUE
// =====================================================

export function unique(
  value,
  existingValues,
  fieldName
) {

  const exists =
    existingValues.includes(
      value
    )

  return exists
    ? result(
        false,
        `${fieldName} already exists.`
      )
    : result(true)

}

// =====================================================
// OBJECT VALIDATION
// =====================================================

export function validateObject(
  rules = []
) {

  const errors = []

  rules.forEach(
    rule => {

      const validation =
        rule.validator()

      if (
        !validation.valid
      ) {

        errors.push({

          field:
            rule.field,

          message:
            validation.message

        })

      }

    }
  )

  return {

    valid:
      errors.length === 0,

    errors

  }

}






export function validateLocationSelection({

  countyId,

  subcountyId

}) {

  if (
    countyId &&
    !subcountyId
  ) {

    return {

      valid: false,

      message:
        'Select a Subcounty'

    }

  }

  return {
    valid: true
  }

}

export function guid(

  value,

  fieldName = 'Id'

) {

  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  return regex.test(
    value || ''
  )

    ? result(true)

    : result(
        false,
        `${fieldName} is invalid.`
      )

}


export function positiveNumber(

  value,

  fieldName = 'Value'

) {

  const valid =
    Number(value) > 0

  return valid

    ? result(true)

    : result(
        false,
        `${fieldName} must be greater than zero.`
      )

}




export function validateDateRange({

  startDate,

  endDate

}) {

  if (
    !startDate ||
    !endDate
  ) {

    return {
      valid: true
    }

  }

  return new Date(
    startDate
  ) <=
  new Date(
    endDate
  )
    ? {
        valid: true
      }
    : {
        valid: false,
        message:
          'End date cannot be earlier than start date.'
      }

}

