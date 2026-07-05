// =====================================================
// FORM SERVICE
// ParaCycling Federation Management System
// =====================================================

import {
  get,
  getValue,
  setValue,
  setChecked,
  clearForm as clearDomForm
}
  from './domService.js'

// =====================================================
// FORM STATE
// =====================================================

const dirtyForms =
  new Set()

// =====================================================
// RESET FORM
// =====================================================

export function resetForm(
  formId
) {
  const form =
    get(formId)

  if (!form) {
    return false
  }

  form.reset()

  clearValidation(
    formId
  )

  dirtyForms.delete(
    formId
  )

  return true
}

export function buildPayload(
  mappings = {}
) {
  const payload = {}

  for (const [dbField, formField] of Object.entries(
    mappings
  )) {
    const value =
        getValue(
          formField
        )

    payload[
        dbField
    ] =
        value || null
  }

  return payload
}

// =====================================================
// SERIALIZE FORM
// =====================================================

// =====================================================
// POPULATE FORM
// =====================================================

// =====================================================
// GET FORM DATA
// =====================================================

export function getFormData(
  formId
) {
  return serializeForm(
    formId
  )
}

// =====================================================
// SET FORM DATA
// =====================================================

export function setFormData(
  formId,
  data
) {
  populateForm(data)

  return true
}

// =====================================================
// ENABLE FORM
// =====================================================

export function enableForm(
  formId
) {
  const form =
    get(formId)

  if (!form) {
    return false
  }

  for (const element of form
    .querySelectorAll(
      'input, select, textarea, button'
    )) {
    element.disabled =
          false
  }

  return true
}

// =====================================================
// DISABLE FORM
// =====================================================

export function disableForm(
  formId
) {
  const form =
    get(formId)

  if (!form) {
    return false
  }

  for (const element of form
    .querySelectorAll(
      'input, select, textarea, button'
    )) {
    element.disabled =
          true
  }

  return true
}

// =====================================================
// ENABLE FIELD
// =====================================================

export function enableField(
  fieldId
) {
  const field =
    get(fieldId)

  if (!field) {
    return false
  }

  field.disabled =
    false

  return true
}

// =====================================================
// DISABLE FIELD
// =====================================================

export function disableField(
  fieldId
) {
  const field =
    get(fieldId)

  if (!field) {
    return false
  }

  field.disabled =
    true

  return true
}

// =====================================================
// READ ONLY
// =====================================================

export function setReadOnly(
  fieldId,
  readOnly = true
) {
  const field =
    get(fieldId)

  if (!field) {
    return false
  }

  field.readOnly =
    readOnly

  return true
}

// =====================================================
// DIRTY TRACKING
// =====================================================

export function markDirty(
  formId
) {
  dirtyForms.add(
    formId
  )
}

export function markClean(
  formId
) {
  dirtyForms.delete(
    formId
  )
}

export function isDirty(
  formId
) {
  return dirtyForms.has(
    formId
  )
}

// =====================================================
// AUTO DIRTY TRACKING
// =====================================================

export function trackChanges(
  formId
) {
  const form =
    get(formId)

  if (!form) {
    return false
  }

  for (const field of form
    .querySelectorAll(
      'input, select, textarea'
    )) {
    field.addEventListener(
      'change',

      () =>
        markDirty(
          formId
        )
    )
  }

  return true
}

// =====================================================
// VALIDATION UI
// =====================================================

export function showFieldError(
  fieldId,
  message
) {
  const field =
    get(fieldId)

  if (!field) {
    return false
  }

  field.classList.add(
    'is-invalid'
  )

  let feedback =
    field
      .parentElement
      ?.querySelector(
        '.invalid-feedback'
      )

  if (!feedback) {
    feedback =
      document.createElement(
        'div'
      )

    feedback.className =
      'invalid-feedback'

    field.parentElement
      ?.append(
        feedback
      )
  }

  feedback.textContent =
    message

  return true
}

// =====================================================
// CLEAR FIELD ERROR
// =====================================================

export function clearFieldError(
  fieldId
) {
  const field =
    get(fieldId)

  if (!field) {
    return false
  }

  field.classList.remove(
    'is-invalid'
  )

  return true
}

// =====================================================
// CLEAR VALIDATION
// =====================================================

export function clearValidation(
  formId
) {
  const form =
    get(formId)

  if (!form) {
    return false
  }

  for (const field of form
    .querySelectorAll(
      '.is-invalid'
    )) {
    field.classList.remove(
      'is-invalid'
    )
  }

  return true
}

// =====================================================
// APPLY VALIDATION ERRORS
// =====================================================

export function applyValidationErrors(
  validationResult
) {
  if (
    validationResult.valid
  ) {
    return true
  }

  for (const error of validationResult.errors) {
    showFieldError(
      error.field,
      error.message
    )
  }

  return false
}

// =====================================================
// FORM SUBMISSION LOCK
// =====================================================

export function lockForm(
  formId
) {
  disableForm(
    formId
  )
}

export function unlockForm(
  formId
) {
  enableForm(
    formId
  )
}

// =====================================================
// CONFIRM NAVIGATION
// =====================================================

export function confirmUnsavedChanges(
  formId
) {
  if (
    !isDirty(
      formId
    )
  ) {
    return true
  }

  return window.confirm(

    'You have unsaved changes. Leave this page?'

  )
}

export function getFormValues(
  fieldIds = []
) {
  const result = {}

  for (const id of fieldIds) {
    result[id] =
        document
          .getElementById(id)
          ?.value || ''
  }

  return result
}

export function setFormValues(
  values = {}
) {
  for (const [id, value] of Object.entries(
    values
  )) {
    const element =
        document.getElementById(
          id
        )

    if (
      element
    ) {
      element.value =
          value ?? ''
    }
  }
}

export function clearFormFields(
  fieldIds = []
) {
  for (const id of fieldIds) {
    const element =
        document.getElementById(
          id
        )

    if (
      element
    ) {
      element.value = ''
    }
  }
}

export function resetEntityForm({

  fields = [],

  defaults = {}

}) {
  return resetForm({

    fields,

    defaults

  })
}
