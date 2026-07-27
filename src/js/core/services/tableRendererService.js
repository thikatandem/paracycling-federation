import {
  PAGE_SIZE,
  EMPTY_TABLE_MESSAGE
} from './constants.js'

export const TABLE_BUTTONS =
  Object.freeze({
    edit: {
      label: 'Edit',
      className:
        'btn btn-sm btn-warning federation-action-button'
    },
    delete: {
      label: 'Delete',
      className:
        'btn btn-sm btn-danger federation-action-button'
    },
    view: {
      label: 'View',
      className:
        'btn btn-sm btn-info federation-action-button'
    },
    manage: {
      label: 'Manage',
      className:
        'btn btn-sm btn-primary federation-action-button'
    },
    history: {
      label: 'History',
      className:
        'btn btn-sm btn-info federation-action-button'
    },
    activate: {
      label: 'Activate',
      className:
        'btn btn-sm btn-success federation-action-button'
    },
    deactivate: {
      label: 'Deactivate',
      className:
        'btn btn-sm btn-secondary federation-action-button'
    },
    close: {
      label: 'Close',
      className:
        'btn btn-sm btn-secondary federation-action-button'
    }
  })

export function clearTable(
  tableBody
) {
  if (!tableBody) {
    return false
  }

  tableBody.innerHTML = ''

  return true
}

export function renderEmptyRow({
  tableBody,
  colspan = 1,
  message = EMPTY_TABLE_MESSAGE
}) {
  if (!tableBody) {
    return false
  }

  tableBody.innerHTML = `
    <tr>
      <td
        colspan="${colspan}"
        class="text-center text-muted py-4"
      >
        ${message}
      </td>
    </tr>
  `

  return true
}

export function appendRow({
  tableBody,
  html = ''
}) {
  if (!tableBody) {
    return false
  }

  tableBody.insertAdjacentHTML(
    'beforeend',
    html
  )

  return true
}

export function replaceTableBody({
  tableBody,
  html = ''
}) {
  if (!tableBody) {
    return false
  }

  tableBody.innerHTML = html

  return true
}

export function buildTableRows({
  data = [],
  renderRow
}) {
  if (
    !Array.isArray(data) ||
    typeof renderRow !== 'function'
  ) {
    return []
  }

  return data.map(
    row =>
      renderRow(row)
  )
}

export function renderTable({
  tableBody,
  rows = [],
  colspan = 1,
  emptyMessage = EMPTY_TABLE_MESSAGE
}) {
  clearTable(tableBody)

  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return renderEmptyRow({
      tableBody,
      colspan,
      message: emptyMessage
    })
  }

  for (const row of rows) {
    appendRow({
      tableBody,
      html: row
    })
  }

  return true
}

export function renderPagedTable({
  tableBody,
  data = [],
  page = 1,
  pageSize = PAGE_SIZE,
  renderRow,
  colspan = 1,
  emptyMessage = EMPTY_TABLE_MESSAGE
}) {
  const start =
    (page - 1) *
    pageSize

  const rows =
    buildTableRows({
      data:
        data.slice(
          start,
          start + pageSize
        ),
      renderRow
    })

  return renderTable({
    tableBody,
    rows,
    colspan,
    emptyMessage
  })
}

export function renderEntityTable({
  tableBody,
  data = [],
  rowRenderer,
  paginator = null,
  colspan = 1,
  emptyMessage = EMPTY_TABLE_MESSAGE
}) {
  let renderData = data

  if (
    paginator &&
    typeof paginator.getPage ===
      'function'
  ) {
    paginator.setData(data)
    renderData =
      paginator.getPage()
  }

  const rows =
    buildTableRows({
      data: renderData,
      renderRow: rowRenderer
    })

  return renderTable({
    tableBody,
    rows,
    colspan,
    emptyMessage
  })
}

export function buildActionButton({
  type = 'view',
  label = null,
  onClick = '',
  className = '',
  disabled = false,
  title = null
} = {}) {
  const config =
    TABLE_BUTTONS[type] ||
    TABLE_BUTTONS.view

  const classes = [
    config.className,
    className
  ]
    .filter(Boolean)
    .join(' ')

  return `
    <button
      type="button"
      class="${classes}"
      ${title ? `title="${title}"` : ''}
      ${disabled ? 'disabled' : ''}
      onclick="${onClick || ''}"
    >
      ${label || config.label}
    </button>
  `
}

export function buildActionButtons({
  buttons = []
} = {}) {
  if (!Array.isArray(buttons)) {
    return ''
  }

  return buttons
    .map(
      button =>
        buildActionButton(button)
    )
    .join('')
}

export function buildTextCell(
  value,
  className = ''
) {
  return `
    <td class="${className}">
      ${value ?? ''}
    </td>
  `
}

export function buildNumberCell(
  value,
  className = ''
) {
  return `
    <td class="text-end ${className}">
      ${value ?? ''}
    </td>
  `
}

export function buildStatusCell(
  html,
  className = ''
) {
  return `
    <td class="federation-status-cell ${className}">
      ${html ?? ''}
    </td>
  `
}

export function buildActionCell(
  buttons,
  className = ''
) {
  return `
    <td class="text-nowrap text-center federation-table-actions ${className}">
      <div class="d-inline-flex flex-wrap gap-1 justify-content-center">
        ${buttons ?? ''}
      </div>
    </td>
  `
}
