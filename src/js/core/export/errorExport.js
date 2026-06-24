// =====================================================
// ERROR EXPORT
// ParaCycling Federation Management System
// =====================================================

import {
  downloadCsv
}
from './csvExport.js'

import {
  downloadErrorWorkbook
}
from './excelExport.js'

import {
  downloadPdfErrors,
  downloadSummaryPdf
}
from './pdfExport.js'

// =====================================================
// STANDARD ERROR COLUMNS
// =====================================================

export const ERROR_COLUMNS = [

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
    label: 'Error Message'
  }

]

// =====================================================
// BUILD IMPORT SUMMARY
// =====================================================

export function buildImportSummary({

  totalRows = 0,

  successfulRows = 0,

  failedRows = 0,

  skippedRows = 0,

  startedAt = null,

  completedAt = null

}) {

  return {

    totalRows,

    successfulRows,

    failedRows,

    skippedRows,

    successRate:
      totalRows > 0
        ? (
            (
              successfulRows /
              totalRows
            ) * 100
          ).toFixed(2)
        : 0,

    startedAt,

    completedAt

  }

}

// =====================================================
// ERROR GROUPING
// =====================================================

export function groupErrorsByField(
  errors = []
) {

  const grouped = {}

  errors.forEach(
    error => {

      const field =
        error.field ||
        'Unknown'

      if (
        !grouped[field]
      ) {

        grouped[field] = 0

      }

      grouped[field]++

    }
  )

  return grouped

}

// =====================================================
// ERROR GROUPING BY MESSAGE
// =====================================================

export function groupErrorsByMessage(
  errors = []
) {

  const grouped = {}

  errors.forEach(
    error => {

      const message =
        error.message ||
        'Unknown Error'

      if (
        !grouped[message]
      ) {

        grouped[message] = 0

      }

      grouped[message]++

    }
  )

  return grouped

}

// =====================================================
// CSV ERROR REPORT
// =====================================================

export function downloadImportErrorsCsv({

  errors = [],

  reportName =
    'Import Errors'

}) {

  downloadCsv({

    data:
      errors,

    columns:
      ERROR_COLUMNS,

    reportName

  })

}

// =====================================================
// EXCEL ERROR REPORT
// =====================================================

export async function downloadImportErrorsExcel({

  errors = [],

  reportName =
    'Import Errors'

}) {

  await downloadErrorWorkbook({

    reportName,

    errors

  })

}

// =====================================================
// PDF ERROR REPORT
// =====================================================

export function downloadImportErrorsPdf({

  errors = [],

  reportName =
    'Import Errors'

}) {

  downloadPdfErrors({

    reportName,

    errors

  })

}

// =====================================================
// FULL ERROR PACKAGE
// =====================================================

export async function downloadFullErrorPackage({

  errors = [],

  reportName =
    'Import Errors'

}) {

  downloadImportErrorsCsv({

    errors,

    reportName

  })

  await downloadImportErrorsExcel({

    errors,

    reportName

  })

  downloadImportErrorsPdf({

    errors,

    reportName

  })

}

// =====================================================
// UPLOAD SUMMARY PDF
// =====================================================

export function downloadUploadSummary({

  summary

}) {

  downloadSummaryPdf({

    reportName:
      'Upload Summary',

    summary

  })

}

// =====================================================
// IMPORT DIAGNOSTICS
// =====================================================

export function buildDiagnostics({

  errors = []

}) {

  return {

    totalErrors:
      errors.length,

    fieldBreakdown:
      groupErrorsByField(
        errors
      ),

    errorBreakdown:
      groupErrorsByMessage(
        errors
      )

  }

}

// =====================================================
// IMPORT RESULT OBJECT
// =====================================================

export function createImportResult({

  totalRows = 0,

  successfulRows = 0,

  failedRows = 0,

  skippedRows = 0,

  errors = []

}) {

  const summary =
    buildImportSummary({

      totalRows,

      successfulRows,

      failedRows,

      skippedRows,

      startedAt:
        new Date()
          .toISOString(),

      completedAt:
        new Date()
          .toISOString()

    })

  return {

    success:
      failedRows === 0,

    summary,

    diagnostics:
      buildDiagnostics({

        errors

      }),

    errors

  }

}

// =====================================================
// HUMAN READABLE IMPORT MESSAGE
// =====================================================

export function buildImportMessage({

  totalRows,

  successfulRows,

  failedRows

}) {

  if (
    failedRows === 0
  ) {

    return `Import completed successfully. ${successfulRows} records imported.`

  }

  return `Import completed with issues. ${successfulRows} imported, ${failedRows} failed out of ${totalRows} records.`

}