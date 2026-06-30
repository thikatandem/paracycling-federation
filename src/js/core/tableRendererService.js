// =====================================================
// TABLE RENDERER SERVICE
// =====================================================

export function clearTable(
  tableBody
) {

  if (!tableBody) {
    return
  }

  tableBody.innerHTML = ''

}

export function renderEmptyRow({

  tableBody,

  colspan = 1,

  message =
    'No records found'

}) {

  if (!tableBody) {
    return
  }

  tableBody.innerHTML = `
    <tr>
      <td
        colspan="${colspan}"
        class="text-center"
      >
        ${message}
      </td>
    </tr>
  `

}

export function appendRow({

  tableBody,

  html = ''

}) {

  if (!tableBody) {
    return
  }

  tableBody.innerHTML +=
    html

}

function renderTeamRow(
  team
) {

  const actionButtons =

    buildActionButtons({

      buttons: [

        {
          type: 'edit',
          onClick:
            `editTeam('${team.team_id}')`
        },

        {
          type: 'delete',
          onClick:
            `confirmDeleteTeam('${team.team_id}')`
        }

      ]

    })

  return `

<tr>

${buildTextCell(
  team.team_code
)}

${buildTextCell(
  team.team_name
)}

${buildTextCell(
  team.team_nickname
)}

${buildTextCell(
  `${team.pilot?.first_name || ''} ${team.pilot?.last_name || ''}`
)}

${buildTextCell(
  `${team.stoker?.first_name || ''} ${team.stoker?.last_name || ''}`
)}

${buildTextCell(
  team.current_effective_date
)}

${buildTextCell(
  team.status
)}

${buildActionCell(
  actionButtons
)}

</tr>

`

}

export function renderTable({

  tableBody,

  rows = [],

  colspan = 1,

  emptyMessage =
    'No records found'

}) {

  clearTable(
    tableBody
  )

  if (
    rows.length === 0
  ) {

    renderEmptyRow({

      tableBody,

      colspan,

      message:
        emptyMessage

    })

    return
  }

  rows.forEach(

  row =>

    appendRow({

      tableBody,

      html: row

    })

)

}






export function buildTableRows({

  data = [],

  renderRow

}) {

  if (
    !Array.isArray(data)
  ) {

    return []

  }

  return data.map(
    row =>
      renderRow(row)
  )

}

export function renderPagedTable({

  tableBody,

  data = [],

  page = 1,

  pageSize = 10,

  renderRow,

  colspan = 1,

  emptyMessage =
    'No records found'

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

  renderTable({

    tableBody,

    rows,

    colspan,

    emptyMessage

  })

}

export function replaceTableBody({

  tableBody,

  html

}) {

  if (!tableBody) {
    return
  }

  tableBody.innerHTML =
    html || ''

}

// =====================================================
// FEDERATION TABLE RENDERER
// =====================================================

export function renderEntityTable({

  tableBody,

  data = [],

  rowRenderer,

  paginator = null,

  colspan = 1,

  emptyMessage =
    'No records found'

}) {

  let renderData =
    data

  if (

    paginator &&

    typeof paginator.getPage ===
      'function'

  ) {

    paginator.setData(
      data
    )

    renderData =
      paginator.getPage()

  }

  const rows =

    buildTableRows({

      data:
        renderData,

      renderRow:
        rowRenderer

    })

  return renderTable({

    tableBody,

    rows,

    colspan,

    emptyMessage

  })

}

// =====================================================
// ACTION BUTTONS
// =====================================================

export function buildActionButtons({

  buttons = []

}) {

  if (
    !Array.isArray(buttons)
  ) {

    return ''

  }

  return buttons
    .map(button => {

      const config =
        TABLE_BUTTONS[
          button.type
        ] || {}

      return `
        <button
          type="button"
          class="${config.className || ''}"
          onclick="${button.onClick || ''}"
        >
          ${config.label || ''}
        </button>
      `

    })
    .join('')

}

// =====================================================
// CELL BUILDERS
// =====================================================

export function buildTextCell(
  value
) {

  return `
    <td>
      ${value ?? ''}
    </td>
  `

}

export function buildNumberCell(
  value
) {

  return `
    <td
      class="text-end"
    >
      ${value ?? ''}
    </td>
  `

}

export function buildStatusCell(
  html
) {

  return `
    <td>
      ${html ?? ''}
    </td>
  `

}

export function buildActionCell(
  buttons
) {

  return `
  <td

    class="
      text-nowrap
      text-center
    "

    style="
      width: 140px;
    "

  >
    ${buttons ?? ''}
  </td>
`

}


// =====================================================
// BUTTONS
// =====================================================

export const TABLE_BUTTONS = {

  edit: {
    label: 'Edit',
    className:
      'btn btn-sm btn-warning me-1'
  },

  delete: {
    label: 'Delete',
    className:
      'btn btn-sm btn-danger'
  },

  view: {
    label: 'View',
    className:
      'btn btn-sm btn-info me-1'
  },

  activate: {
    label: 'Activate',
    className:
      'btn btn-sm btn-success me-1'
  },

  deactivate: {
    label: 'Deactivate',
    className:
      'btn btn-sm btn-secondary'
  }

}