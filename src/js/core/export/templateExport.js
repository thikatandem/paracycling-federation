// =====================================================
// TEMPLATE EXPORT
// ParaCycling Federation Management System
// =====================================================

import ExcelJS from 'exceljs'

import {
  saveAs
}
from 'file-saver'

import {
  createWorkbook,
  autoFitColumns,
  styleHeaderRow,
  hideWorksheet
}
from './excelExport.js'

import {
  buildFileName
}
from './exportConstants.js'

// =====================================================
// SAVE TEMPLATE
// =====================================================

async function saveTemplate({

  workbook,

  reportName

}) {

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
// INSTRUCTIONS SHEET
// =====================================================

export function addInstructionsSheet({

  workbook,

  title,

  instructions = []

}) {

  const sheet =
    workbook.addWorksheet(
      'Instructions'
    )

  sheet.addRow(
    [title]
  )

  sheet.addRow([])

  instructions.forEach(
    instruction => {

      sheet.addRow(
        [instruction]
      )

    }
  )

  sheet.getRow(1)
    .font = {

    bold: true,

    size: 16

  }

  autoFitColumns(
    sheet
  )

  return sheet

}

// =====================================================
// TEMPLATE SHEET
// =====================================================

export function addTemplateSheet({

  workbook,

  sheetName,

  columns = [],

  sampleRows = []

}) {

  const sheet =
    workbook.addWorksheet(
      sheetName
    )

  sheet.columns =
    columns.map(
      column => ({

        header:
          column.required
            ? `${column.label} *`
            : column.label,

        key:
          column.key

      })
    )

  sampleRows.forEach(
    row => {

      sheet.addRow(
        row
      )

    }
  )

  styleHeaderRow(
    sheet
  )

  autoFitColumns(
    sheet
  )

  return sheet

}

// =====================================================
// LOOKUP SHEET
// =====================================================

export function addLookupSheet({

  workbook,

  sheetName,

  values = [],

  hidden = true

}) {

  const sheet =
    workbook.addWorksheet(
      sheetName
    )

  values.forEach(
    value => {

      sheet.addRow(
        [value]
      )

    }
  )

  autoFitColumns(
    sheet
  )

  if (
    hidden
  ) {

    hideWorksheet(
      sheet
    )

  }

  return sheet

}

// =====================================================
// DROPDOWN VALIDATION
// =====================================================

export function addDropdownValidation({

  worksheet,

  column,

  lookupSheet,

  rowCount = 5000

}) {

  for (
    let row = 2;
    row <= rowCount;
    row++
  ) {

    worksheet.getCell(
      `${column}${row}`
    ).dataValidation = {

      type:
        'list',

      allowBlank:
        true,

      formulae: [

        `'${lookupSheet}'!$A$1:$A$5000`

      ]

    }

  }

}

// =====================================================
// REQUIRED FIELD HIGHLIGHT
// =====================================================

export function highlightRequiredColumns({

  worksheet,

  requiredColumns = []

}) {

  worksheet.getRow(1)
    .eachCell(
      (cell, index) => {

        const letter =
          worksheet.getColumn(
            index
          ).letter

        if (

          requiredColumns.includes(
            letter
          )

        ) {

          cell.fill = {

            type:
              'pattern',

            pattern:
              'solid',

            fgColor: {
              argb:
                'FFF2CC'
            }

          }

        }

      }
    )

}

// =====================================================
// MASTER TEMPLATE
// =====================================================

export async function downloadImportTemplate({

  reportName,

  sheetName,

  columns,

  sampleRows = [],

  instructions = [],

  lookups = []

}) {

  const workbook =
    createWorkbook(
      reportName
    )

  addInstructionsSheet({

    workbook,

    title:
      `${reportName} Import Template`,

    instructions

  })

  const templateSheet =
    addTemplateSheet({

      workbook,

      sheetName,

      columns,

      sampleRows

    })

  lookups.forEach(
    lookup => {

      addLookupSheet({

        workbook,

        sheetName:
          lookup.sheetName,

        values:
          lookup.values

      })

    }
  )

  await saveTemplate({

    workbook,

    reportName:
      `${reportName}_Template`

  })

}

// =====================================================
// ATHLETE TEMPLATE
// =====================================================

export async function downloadAthleteTemplate() {

  await downloadImportTemplate({

    reportName:
      'Athletes',

    sheetName:
      'Athletes',

    columns: [

      {
        key:
          'athlete_code',

        label:
          'Athlete Code',

        required:
          true
      },

      {
        key:
          'full_name',

        label:
          'Full Name',

        required:
          true
      },

      {
        key:
          'gender',

        label:
          'Gender',

        required:
          true
      },

      {
        key:
          'date_of_birth',

        label:
          'Date Of Birth',

        required:
          true
      }

    ],

    sampleRows: [

      {
        athlete_code:
          'ATH001',

        full_name:
          'John Doe',

        gender:
          'Male',

        date_of_birth:
          '1995-05-12'
      }

    ],

    instructions: [

      'Complete all required fields marked with *',

      'Do not change column names',

      'Remove sample rows before upload',

      'Gender must match available lookup values'

    ]

  })

}