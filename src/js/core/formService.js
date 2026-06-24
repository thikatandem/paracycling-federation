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

  Object.entries(
    mappings
  ).forEach(

    ([dbField, formField]) => {

      const value =
        getValue(
          formField
        )

      payload[
        dbField
      ] =
        value || null

    }

  )

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

  form
    .querySelectorAll(
      'input, select, textarea, button'
    )
    .forEach(
      element => {

        element.disabled =
          false

      }
    )

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

  form
    .querySelectorAll(
      'input, select, textarea, button'
    )
    .forEach(
      element => {

        element.disabled =
          true

      }
    )

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

  form
    .querySelectorAll(
      'input, select, textarea'
    )
    .forEach(
      field => {

        field.addEventListener(
          'change',

          () =>
            markDirty(
              formId
            )
        )

      }
    )

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
      ?.appendChild(
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

  form
    .querySelectorAll(
      '.is-invalid'
    )
    .forEach(
      field => {

        field.classList.remove(
          'is-invalid'
        )

      }
    )

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

  validationResult.errors
    .forEach(
      error => {

        showFieldError(
          error.field,
          error.message
        )

      }
    )

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

  fieldIds.forEach(
    id => {

      result[id] =
        document
          .getElementById(id)
          ?.value || ''

    }
  )

  return result

}

export function setFormValues(
  values = {}
) {

  Object.entries(
    values
  ).forEach(
    ([id, value]) => {

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
  )

}

export function clearFormFields(
  fieldIds = []
) {

  fieldIds.forEach(
    id => {

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
  )

}

