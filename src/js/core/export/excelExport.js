// =====================================================
// EXCEL EXPORT
// ParaCycling Federation Management System
// =====================================================

import {
  buildFileName,
  EXPORT_CONFIG
}
  from './exportConstants.js'

import {
  ensureExcelJs,
  ensureFileSaver
} from './exportDependencies.js'

function getExcelJs() {
  const ExcelJS = window.ExcelJS

  if (typeof ExcelJS?.Workbook !== 'function') {
    throw new Error(
      'ExcelJS is not ready. Call ensureExcelJs() before creating a workbook.'
    )
  }

  return ExcelJS
}

// =====================================================
// WORKBOOK
// =====================================================

export function createWorkbook(
  title = 'Report'
) {
  const ExcelJS =
    getExcelJs()

  const workbook =
    new ExcelJS.Workbook()

  workbook.creator =
    EXPORT_CONFIG.organization

  workbook.company =
    EXPORT_CONFIG.organization

  workbook.subject =
    title

  workbook.title =
    title

  workbook.created =
    new Date()

  return workbook
}

// =====================================================
// SAVE WORKBOOK
// =====================================================

export async function saveWorkbook({

  workbook,

  reportName

}) {
  const saveAs =
    await ensureFileSaver()

  const buffer =
    await workbook.xlsx.writeBuffer()

  const blob =
    new Blob(
      [buffer],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    )

  saveAs(
    blob,
    `${buildFileName(
      reportName
    )}.xlsx`
  )
}

// =====================================================
// AUTOFIT
// =====================================================

export function autoFitColumns(
  worksheet
) {
  for (const column of worksheet.columns) {
    let maxLength =
        15

    column.eachCell(
      {
        includeEmpty:
            true
      },
      cell => {
        const { length } = String(
          cell.value || ''
        )

        maxLength =
            Math.max(
              maxLength,
              length + 2
            )
      }
    )

    column.width =
        Math.min(
          maxLength,
          50
        )
  }
}

// =====================================================
// HEADER STYLE
// =====================================================

export function styleHeaderRow(
  worksheet
) {
  const header =
    worksheet.getRow(1)

  header.font = {

    bold: true,

    size: 11

  }

  header.alignment = {

    vertical:
      'middle',

    horizontal:
      'center'

  }

  header.eachCell(
    cell => {
      cell.fill = {

        type:
          'pattern',

        pattern:
          'solid',

        fgColor: {
          argb:
            'D9EAD3'
        }

      }

      cell.border = {

        top: {
          style:
            'thin'
        },

        left: {
          style:
            'thin'
        },

        bottom: {
          style:
            'thin'
        },

        right: {
          style:
            'thin'
        }

      }
    }
  )
}

// =====================================================
// FREEZE HEADER
// =====================================================

export function freezeHeader(
  worksheet
) {
  worksheet.views = [

    {
      state:
        'frozen',

      ySplit:
        1
    }

  ]
}

// =====================================================
// FILTERS
// =====================================================

export function addFilters(
  worksheet
) {
  worksheet.autoFilter = {

    from: 'A1',

    to: {
      row: 1,
      column:
        worksheet.columnCount
    }

  }
}

// =====================================================
// ADD TABLE SHEET
// =====================================================

export function addWorksheet({

  workbook,

  sheetName,

  data = [],

  columns = []

}) {
  const worksheet =
    workbook.addWorksheet(
      sheetName
    )

  worksheet.columns =
    columns.map(
      column => ({

        header:
          column.label,

        key:
          column.key

      })
    )

  for (const row of data) {
    worksheet.addRow(
      row
    )
  }

  styleHeaderRow(
    worksheet
  )

  freezeHeader(
    worksheet
  )

  addFilters(
    worksheet
  )

  autoFitColumns(
    worksheet
  )

  return worksheet
}

// =====================================================
// SINGLE SHEET EXPORT
// =====================================================

export async function downloadExcel({

  reportName,

  columns,

  data

}) {
  await ensureExcelJs()

  const workbook =
    createWorkbook(
      reportName
    )

  addWorksheet({

    workbook,

    sheetName:
      reportName,

    columns,

    data

  })

  await saveWorkbook({

    workbook,

    reportName

  })
}

// =====================================================
// MULTI SHEET EXPORT
// =====================================================

export async function downloadExcelWorkbook({

  reportName,

  sheets = []

}) {
  await ensureExcelJs()

  const workbook =
    createWorkbook(
      reportName
    )

  for (const sheet of sheets) {
    addWorksheet({

      workbook,

      sheetName:
          sheet.sheetName,

      columns:
          sheet.columns,

      data:
          sheet.data

    })
  }

  await saveWorkbook({

    workbook,

    reportName

  })
}

// =====================================================
// SUMMARY SHEET
// =====================================================

export function addSummarySheet({

  workbook,

  title,

  summary = {}

}) {
  const worksheet =
    workbook.addWorksheet(
      'Summary'
    )

  worksheet.addRow(
    [title]
  )

  worksheet.addRow([])

  for (const [key, value] of Object.entries(
    summary
  )) {
    worksheet.addRow(
      [
        key,
        value
      ]
    )
  }

  autoFitColumns(
    worksheet
  )

  return worksheet
}

// =====================================================
// IMPORT TEMPLATE
// =====================================================

export async function downloadImportTemplate({

  reportName,

  columns,

  sampleRows = []

}) {
  await ensureExcelJs()

  const workbook =
    createWorkbook(
      reportName
    )

  addWorksheet({

    workbook,

    sheetName:
      'Template',

    columns,

    data:
      sampleRows

  })

  await saveWorkbook({

    workbook,

    reportName:
      `${reportName}_Template`

  })
}

// =====================================================
// LOOKUP SHEET
// =====================================================

export function addLookupSheet({

  workbook,

  sheetName,

  values = []

}) {
  const worksheet =
    workbook.addWorksheet(
      sheetName
    )

  for (const value of values) {
    worksheet.addRow(
      [value]
    )
  }

  autoFitColumns(
    worksheet
  )

  return worksheet
}

// =====================================================
// HIDDEN LOOKUP SHEET
// =====================================================

export function hideWorksheet(
  worksheet
) {
  worksheet.state =
    'hidden'
}

// =====================================================
// ERROR WORKBOOK
// =====================================================

export async function downloadErrorWorkbook({

  reportName,

  errors = []

}) {
  await ensureExcelJs()

  const workbook =
    createWorkbook(
      reportName
    )

  const worksheet =
    workbook.addWorksheet(
      'Errors'
    )

  worksheet.columns = [

    {
      header:
        'Row',

      key:
        'row'
    },

    {
      header:
        'Field',

      key:
        'field'
    },

    {
      header:
        'Value',

      key:
        'value'
    },

    {
      header:
        'Error',

      key:
        'message'
    }

  ]

  for (const error of errors) {
    worksheet.addRow(
      error
    )
  }

  styleHeaderRow(
    worksheet
  )

  autoFitColumns(
    worksheet
  )

  await saveWorkbook({

    workbook,

    reportName:
      `${reportName}_Errors`

  })
}
