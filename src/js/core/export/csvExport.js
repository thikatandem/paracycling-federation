// =====================================================
// CSV EXPORT
// ParaCycling Federation Management System
// =====================================================

import {
  MIME_TYPES,
  CSV_OPTIONS,
  buildFileName
}
from './exportConstants.js'

// =====================================================
// CSV ESCAPING
// =====================================================

export function escapeCsvValue(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return ''

  }

  let stringValue =
    String(value)

  stringValue =
    stringValue.replace(
      /"/g,
      '""'
    )

  if (

    stringValue.includes(',') ||

    stringValue.includes('"') ||

    stringValue.includes('\n') ||

    stringValue.includes('\r')

  ) {

    stringValue =
      `"${stringValue}"`

  }

  return stringValue

}

// =====================================================
// CSV ROW
// =====================================================

export function buildCsvRow(
  values = []
) {

  return values
    .map(
      escapeCsvValue
    )
    .join(
      CSV_OPTIONS.delimiter
    )

}

// =====================================================
// CSV CONTENT
// =====================================================

export function buildCsvContent({

  data = [],

  columns = []

}) {

  const rows = []

  const headerRow =
    columns.map(
      column =>
        column.label ||
        column.title ||
        column.key
    )

  rows.push(
    buildCsvRow(
      headerRow
    )
  )

  data.forEach(
    record => {

      const row =
        columns.map(
          column => {

            const value =
              record[
                column.key
              ]

            return value ?? ''

          }
        )

      rows.push(
        buildCsvRow(
          row
        )
      )

    }
  )

  return rows.join(
    CSV_OPTIONS.lineBreak
  )

}

// =====================================================
// UTF8 BOM
// =====================================================

export function addUtf8Bom(
  content
) {

  return (
    '\uFEFF' +
    content
  )

}

// =====================================================
// DOWNLOAD BLOB
// =====================================================

export function downloadBlob({

  blob,

  fileName

}) {

  const url =
    URL.createObjectURL(
      blob
    )

  const link =
    document.createElement(
      'a'
    )

  link.href =
    url

  link.download =
    fileName

  document.body.appendChild(
    link
  )

  link.click()

  document.body.removeChild(
    link
  )

  URL.revokeObjectURL(
    url
  )

}

// =====================================================
// DOWNLOAD CSV
// =====================================================

export function downloadCsv({

  data = [],

  columns = [],

  reportName =
    'Export'

}) {

  const csvContent =
    buildCsvContent({

      data,

      columns

    })

  const content =
    addUtf8Bom(
      csvContent
    )

  const blob =
    new Blob(
      [content],
      {
        type:
          MIME_TYPES.CSV
      }
    )

  downloadBlob({

    blob,

    fileName:
      `${buildFileName(
        reportName
      )}.csv`

  })

}

// =====================================================
// EXPORT CURRENT PAGE
// =====================================================

export function exportCurrentPage({

  paginator,

  columns,

  reportName

}) {

  downloadCsv({

    data:
      paginator.getPage(),

    columns,

    reportName

  })

}

// =====================================================
// EXPORT ALL
// =====================================================

export function exportAll({

  data,

  columns,

  reportName

}) {

  downloadCsv({

    data,

    columns,

    reportName

  })

}

// =====================================================
// EXPORT SELECTED
// =====================================================

export function exportSelected({

  selectedRows,

  columns,

  reportName

}) {

  downloadCsv({

    data:
      selectedRows,

    columns,

    reportName

  })

}

// =====================================================
// REQUIRED COLUMN
// =====================================================

export function requiredHeader(
  header
) {

  return `${header} *`

}

// =====================================================
// TEMPLATE HEADERS
// =====================================================

export function buildTemplateHeaders(

  columns = []

) {

  return columns.map(
    column =>

      column.required
        ? requiredHeader(
            column.label
          )
        : column.label
  )

}

// =====================================================
// TEMPLATE CSV
// =====================================================

export function buildTemplateCsv({

  columns = [],

  sampleRows = []

}) {

  const rows = []

  rows.push(

    buildCsvRow(
      buildTemplateHeaders(
        columns
      )
    )

  )

  sampleRows.forEach(
    row => {

      rows.push(

        buildCsvRow(
          columns.map(
            column =>

              row[
                column.key
              ] ?? ''
          )
        )

      )

    }
  )

  return rows.join(
    CSV_OPTIONS.lineBreak
  )

}

// =====================================================
// DOWNLOAD TEMPLATE
// =====================================================

export function downloadCsvTemplate({

  columns = [],

  sampleRows = [],

  reportName =
    'Template'

}) {

  const content =
    addUtf8Bom(

      buildTemplateCsv({

        columns,

        sampleRows

      })

    )

  const blob =
    new Blob(
      [content],
      {
        type:
          MIME_TYPES.CSV
      }
    )

  downloadBlob({

    blob,

    fileName:
      `${buildFileName(
        reportName
      )}_Template.csv`

  })

}

// =====================================================
// IMPORT ERROR CSV
// =====================================================

export function downloadImportErrors({

  errors = [],

  reportName =
    'ImportErrors'

}) {

  const columns = [

    {
      key: 'row',
      label: 'Row'
    },

    {
      key: 'field',
      label: 'Field'
    },

    {
      key: 'value',
      label: 'Value'
    },

    {
      key: 'message',
      label: 'Error'
    }

  ]

  downloadCsv({

    data:
      errors,

    columns,

    reportName

  })

}

// =====================================================
// VALIDATE EXPORT CONFIG
// =====================================================

export function validateCsvExport({

  data,

  columns

}) {

  const errors = []

  if (
    !Array.isArray(data)
  ) {

    errors.push(
      'Data must be an array.'
    )

  }

  if (
    !Array.isArray(columns)
  ) {

    errors.push(
      'Columns must be an array.'
    )

  }

  if (
    columns.length === 0
  ) {

    errors.push(
      'At least one column is required.'
    )

  }

  return {

    valid:
      errors.length === 0,

    errors

  }

}