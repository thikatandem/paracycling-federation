// =====================================================
// DOM SERVICE
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// ELEMENTS
// =====================================================

export function get(id) {
  return document.getElementById(id)
}

export function getAll(selector) {
  return Array.from(
    document.querySelectorAll(selector)
  )
}

export function exists(id) {
  return Boolean(get(id))
}

// =====================================================
// VALUES
// =====================================================

export function getValue(id) {
  const element = get(id)

  if (!element) {
    return ''
  }

  if (
    element.type === 'checkbox'
  ) {
    return element.checked
  }

  return element.value ?? ''
}

export function setValue(
  id,
  value
) {
  const element = get(id)

  if (!element) {
    return false
  }

  if (
    element.type === 'checkbox'
  ) {
    element.checked =
      Boolean(value)

    return true
  }

  element.value =
    value ?? ''

  return true
}

// =====================================================
// TEXT
// =====================================================

export function getText(id) {
  return (
    get(id)?.textContent || ''
  )
}

export function setText(
  id,
  text
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.textContent =
    text ?? ''

  return true
}

// =====================================================
// HTML
// =====================================================

export function getHtml(id) {
  return (
    get(id)?.innerHTML || ''
  )
}

export function setHtml(
  id,
  html
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.innerHTML =
    html ?? ''

  return true
}

export function appendHtml(
  id,
  html
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.insertAdjacentHTML(
    'beforeend',
    html ?? ''
  )

  return true
}

export function clear(id) {
  return setHtml(id, '')
}

// =====================================================
// VISIBILITY
// =====================================================

export function show(id) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.classList.remove(
    'd-none'
  )

  return true
}

export function hide(id) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.classList.add(
    'd-none'
  )

  return true
}

export function toggle(id) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.classList.toggle(
    'd-none'
  )

  return true
}

// =====================================================
// ENABLE / DISABLE
// =====================================================

export function enable(id) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.disabled = false

  return true
}

export function disable(id) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.disabled = true

  return true
}

// =====================================================
// FOCUS
// =====================================================

export function focus(id) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.focus()

  return true
}

// =====================================================
// CHECKBOXES
// =====================================================

export function isChecked(id) {
  return Boolean(
    get(id)?.checked
  )
}

export function setChecked(
  id,
  checked = false
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.checked =
    Boolean(checked)

  return true
}

// =====================================================
// CSS CLASSES
// =====================================================

export function addClass(
  id,
  className
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.classList.add(
    className
  )

  return true
}

export function removeClass(
  id,
  className
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.classList.remove(
    className
  )

  return true
}

export function toggleClass(
  id,
  className
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.classList.toggle(
    className
  )

  return true
}

// =====================================================
// SELECTS
// =====================================================

export function createOption(
  value,
  text,
  selected = false
) {
  const option =
    document.createElement(
      'option'
    )

  option.value =
    value ?? ''

  option.textContent =
    text ?? ''

  option.selected =
    selected

  return option
}

export function appendOption(
  selectId,
  value,
  text,
  selected = false
) {
  const select =
    get(selectId)

  if (!select) {
    return false
  }

  select.appendChild(
    createOption(
      value,
      text,
      selected
    )
  )

  return true
}

export function clearSelect(
  selectId
) {
  const select =
    get(selectId)

  if (!select) {
    return false
  }

  select.innerHTML = ''

  return true
}

export function selectValue(
  selectId
) {
  const select =
    get(selectId)

  return (
    select?.value || ''
  )
}

export function selectedText(
  selectId
) {
  const select =
    get(selectId)

  if (
    !select ||
    select.selectedIndex < 0
  ) {
    return ''
  }

  return select.options[
    select.selectedIndex
  ].text
}

// =====================================================
// FORMS
// =====================================================

export function clearForm(
  fieldIds = []
) {
  fieldIds.forEach(
    id => {

      const element =
        get(id)

      if (!element) {
        return
      }

      if (
        element.type === 'checkbox'
      ) {
        element.checked = false
      } else {
        element.value = ''
      }
    }
  )
}

export function serializeForm(
  formId
) {
  const form =
    get(formId)

  if (!form) {
    return {}
  }

  const data = {}

  const formData =
    new FormData(form)

  for (
    const [key, value]
    of formData.entries()
  ) {
    data[key] = value
  }

  return data
}

export function populateForm(
  data = {}
) {
  Object.entries(data)
    .forEach(
      ([key, value]) => {

        const element =
          document.querySelector(
            `[name="${key}"]`
          )

        if (!element) {
          return
        }

        if (
          element.type === 'checkbox'
        ) {
          element.checked =
            Boolean(value)
        } else {
          element.value =
            value ?? ''
        }
      }
    )
}

// =====================================================
// EVENTS
// =====================================================

export function on(
  id,
  event,
  handler
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.addEventListener(
    event,
    handler
  )

  return true
}

export function off(
  id,
  event,
  handler
) {
  const element = get(id)

  if (!element) {
    return false
  }

  element.removeEventListener(
    event,
    handler
  )

  return true
}

export function replaceOptions({

  selectId,

  options = [],

  placeholder =
    null

}) {

  clearSelect(
    selectId
  )

  if (
    placeholder !==
    null
  ) {

    appendOption(

      selectId,

      '',

      placeholder

    )

  }

  options.forEach(
    option => {

      appendOption(

        selectId,

        option.value,

        option.text

      )

    }
  )

}

export function clearTableBody(
  tableBodyId
) {

  return setHtml(
    tableBodyId,
    ''
  )

}



export function clearDataList(
  datalistId
) {

  return setHtml(
    datalistId,
    ''
  )

}





export function replaceTableBody(

  tableBodyId,

  html

) {

  return setHtml(

    tableBodyId,

    html

  )

}



export function showElement(
  id
) {

  return show(id)

}

export function hideElement(
  id
) {

  return hide(id)

}

export function showTextError({

  elementId,

  message

}) {

  setText(
    elementId,
    message || ''
  )

}

export function clearTextError(
  elementId
) {

  setText(
    elementId,
    ''
  )

}

export function resetFormFields({

  fields = [],

  defaults = {}

}) {

  clearForm(fields)

  Object.entries(
    defaults
  ).forEach(
    ([id, value]) =>
      setValue(
        id,
        value
      )
  )

}


