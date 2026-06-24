// =====================================================
// TABLE RENDERER SERVICE
// =====================================================

export function clearTable(
  tbody
) {

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

}

export function renderEmptyRow({

  tbody,

  colspan = 1,

  message =
    'No records found'

}) {

  if (!tbody) {
    return
  }

  tbody.innerHTML = `
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

export function appendRows({

  tbody,

  rows = []

}) {

  if (!tbody) {
    return
  }

  tbody.innerHTML +=
    rows.join('')

}

export function renderTable({

  tbody,

  rows = [],

  colspan = 1,

  emptyMessage =
    'No records found'

}) {

  clearTable(
    tbody
  )

  if (
    rows.length === 0
  ) {

    renderEmptyRow({

      tbody,

      colspan,

      message:
        emptyMessage

    })

    return
  }

  appendRows({

    tbody,

    rows

  })

}



export function renderNoDataRow({

  tbody,

  colspan = 1,

  message =
    'No records found'

}) {

  renderEmptyRow({

    tbody,

    colspan,

    message

  })

}


export function buildRows({

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

  tbody,

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
    buildRows({

      data:
        data.slice(
          start,
          start + pageSize
        ),

      renderRow

    })

  renderTable({

    tbody,

    rows,

    colspan,

    emptyMessage

  })

}

export function replaceTableBody({

  tbody,

  html

}) {

  if (!tbody) {
    return
  }

  tbody.innerHTML =
    html || ''

}