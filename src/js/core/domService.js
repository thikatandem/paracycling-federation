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


export function hideAfter(

  id,

  duration = 3000

) {

  setTimeout(
    () => hide(id),
    duration
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


export function setDisabled(

  id,

  disabled = true

) {

  const element =
    get(id)

  if (!element) {
    return false
  }

  element.disabled =
    disabled

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

  selected = false,

  dataset = {}

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

  Object.entries(
    dataset
  ).forEach(
    ([key, value]) => {

      option.dataset[key] =
        value ?? ''

    }
  )

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




export function clearDataList(
  datalistId
) {

  return setHtml(
    datalistId,
    ''
  )

}









// =====================================================
// BULK VALUES
// =====================================================

export function setValues(
  values = {}
) {

  Object.entries(
    values
  ).forEach(
    ([id, value]) =>
      setValue(
        id,
        value
      )
  )

  return true

}

export function getValues(
  fieldIds = []
) {

  const values = {}

  fieldIds.forEach(
    id => {

      values[id] =
        getValue(id)

    }
  )

  return values

}



// =====================================================
// DATALIST POPULATION
// =====================================================

export function populateDataList({

  datalistId,

  items = [],

  valueField

}) {

  const datalist =
    get(datalistId)

  if (!datalist) {
    return false
  }

  clearDataList(
    datalistId
  )

  items.forEach(
    item => {

      datalist.insertAdjacentHTML(
        'beforeend',
        `
        <option
          value="${item[valueField] ?? ''}">
        </option>
        `
      )

    }
  )

  return true

}

// =====================================================
// MESSAGES
// =====================================================

export function showMessage({

  elementId,

  message = '',

  type = 'danger'

}) {

  const element =
    get(elementId)

  if (!element) {
    return false
  }

  element.textContent =
    message

  element.classList.remove(
    'd-none'
  )

  element.classList.remove(
    'alert-success',
    'alert-danger',
    'alert-warning',
    'alert-info'
  )

  element.classList.add(
    `alert-${type}`
  )

  return true

}

export function clearMessage(
  elementId
) {

  const element =
    get(elementId)

  if (!element) {
    return false
  }

  element.textContent = ''

  element.classList.add(
    'd-none'
  )

  return true

}



// =====================================================
// READONLY
// =====================================================

export function setReadonly(

  id,

  readonly = true

) {

  const element =
    get(id)

  if (!element) {
    return false
  }

  element.readOnly =
    readonly

  return true

}

// =====================================================
// ATTRIBUTES
// =====================================================

export function setAttribute(

  id,

  name,

  value

) {

  const element =
    get(id)

  if (!element) {
    return false
  }

  element.setAttribute(
    name,
    value
  )

  return true

}

export function getAttribute(

  id,

  name

) {

  return (
    get(id)
      ?.getAttribute(
        name
      ) || null
  )

}

export function removeAttribute(

  id,

  name

) {

  const element =
    get(id)

  if (!element) {
    return false
  }

  element.removeAttribute(
    name
  )

  return true

}

// =====================================================
// DATASET
// =====================================================

export function getDataset(

  id,

  key

) {

  return (
    get(id)
      ?.dataset?.[key]
      ?? null
  )

}

export function setDataset(

  id,

  key,

  value

) {

  const element =
    get(id)

  if (!element) {
    return false
  }

  element.dataset[key] =
    value

  return true

}

export function selectedDataset(

  selectId,

  key

) {

  const select =
    get(selectId)

  if (
    !select ||
    select.selectedIndex < 0
  ) {
    return null
  }

  return (
    select.options[
      select.selectedIndex
    ]
      ?.dataset?.[key]
      ?? null
  )

}




// =====================================================
// ADVANCED SELECT HELPERS
// =====================================================

export function resetSelect(

  selectId,

  placeholder = 'Select Option'

) {

  const select =
    get(selectId)

  if (!select) {
    return false
  }

  select.innerHTML = `
    <option value="">
      ${placeholder}
    </option>
  `

  return true

}

export function populateSelect({

  selectId,

  items = [],

  valueField,

  textField,

  textFormatter = null,

  datasetFields = {},

  placeholder = null,

  selectedValue = null

}) {

  const select =
    get(selectId)

  if (!select) {
    return false
  }

  clearSelect(
    selectId
  )

  if (
    placeholder !== null
  ) {

    appendOption(
      selectId,
      '',
      placeholder
    )

  }

  items.forEach(
    item => {

      const option =
        document.createElement(
          'option'
        )

      option.value =
        item[valueField] ?? ''

      option.textContent =
        typeof textFormatter ===
        'function'

          ? textFormatter(item)

          : item[textField] ?? ''

      Object.entries(
        datasetFields
      ).forEach(
        ([datasetKey, field]) => {

          option.dataset[
            datasetKey
          ] =
            item[field] ?? ''

        }
      )

      option.selected =
        item[valueField] ===
        selectedValue

      select.appendChild(
        option
      )

    }
  )

  return true

}

export function selectedOption(
  selectId
) {

  const select =
    get(selectId)

  if (
    !select ||
    select.selectedIndex < 0
  ) {
    return null
  }

  return select.options[
    select.selectedIndex
  ]

}

// =====================================================
// TIMED MESSAGES
// =====================================================

export function showTimedMessage({

  elementId,

  message = '',

  type = 'success',

  duration = 3000

}) {

  const element =
    get(elementId)

  if (!element) {
    return false
  }

  element.textContent =
    message

  element.classList.remove(
    'd-none'
  )

  element.classList.remove(
    'alert-success',
    'alert-danger',
    'alert-warning',
    'alert-info'
  )

  element.classList.add(
    `alert-${type}`
  )

  setTimeout(
    () => {

      element.classList.add(
        'd-none'
      )

    },
    duration
  )

  return true

}


// =====================================================
// FORM HELPERS
// =====================================================

export function resetForm({

  fields = [],

  defaults = {}

}) {

  fields.forEach(
    fieldId => {

      if (
        Object.prototype.hasOwnProperty.call(
          defaults,
          fieldId
        )
      ) {

        setValue(
          fieldId,
          defaults[fieldId]
        )

      } else {

        setValue(
          fieldId,
          ''
        )

      }

    }
  )

  return true

}

// =====================================================
// RADIO HELPERS
// =====================================================

export function getCheckedRadio(
  name
) {

  return (
    document.querySelector(
      `input[name="${name}"]:checked`
    )?.value || ''
  )

}

export function setCheckedRadio(

  name,

  value

) {

  const radio =
    document.querySelector(
      `input[name="${name}"][value="${value}"]`
    )

  if (!radio) {
    return false
  }

  radio.checked = true

  return true

}

// =====================================================
// SAFE ELEMENT HELPERS
// =====================================================

export function requireElement(
  id
) {

  const element =
    get(id)

  if (!element) {

    throw new Error(
      `${id} not found`
    )

  }

  return element

}