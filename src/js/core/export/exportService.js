// =====================================================
// EXPORT SERVICE
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// CSV
// =====================================================

export {

  downloadCsv,

  exportCurrentPage,

  exportAll,

  exportSelected,

  downloadCsvTemplate,

  downloadImportErrors

}
from './csvExport.js'



// =====================================================
// EXCEL
// =====================================================

export {

  downloadExcel,

  downloadExcelWorkbook,

  downloadImportTemplate,

  downloadErrorWorkbook,

  addWorksheet,

  addSummarySheet

}
from './excelExport.js'

// =====================================================
// PDF
// =====================================================

export {

  downloadPdf,

  downloadPdfErrors,

  downloadSummaryPdf,

  buildFederationReport,

  downloadTrainingReportPdf,

  downloadPerformanceReportPdf,

  downloadParticipantsReportPdf,

  downloadRaceResultsPdf

}
from './pdfExport.js'
// =====================================================
// TEMPLATES
// =====================================================

export {

  downloadAthleteTemplate,

  downloadImportTemplate as downloadFederationTemplate

}
from './templateExport.js'

// =====================================================
// ERRORS
// =====================================================

export {

  downloadImportErrorsCsv,

  downloadImportErrorsExcel,

  downloadImportErrorsPdf,

  downloadFullErrorPackage,

  downloadUploadSummary,

  createImportResult,

  buildImportMessage

}
from './errorExport.js'

// =====================================================
// EXPORT TYPES
// =====================================================

export const EXPORT_TYPES = {

  CSV:
    'csv',

  EXCEL:
    'excel',

  PDF:
    'pdf'

}

// =====================================================
// GENERIC EXPORT
// =====================================================

export async function exportData({

  type,

  reportName,

  columns,

  data,

  filters = {},

  summary = {}

}) {

  switch (
    String(type)
      .toLowerCase()
  ) {

    case 'csv':

      return downloadCsv({

        reportName,

        columns,

        data

      })

    case 'excel':

      return downloadExcel({

        reportName,

        columns,

        data

      })

    case 'pdf':

      return downloadPdf({

        reportName,

        columns,

        data,

        filters,

        summary

      })

    default:

      throw new Error(
        `Unsupported export type: ${type}`
      )

  }

}




// =====================================================
// FILTERED DATA
// =====================================================

export async function exportFilteredRows({

  type,

  rows,

  columns,

  reportName,

  filters = {},

  summary = {}

}) {

  return exportData({

    type,

    reportName,

    columns,

    data:
      rows,

    filters,

    summary

  })

}

// =====================================================
// ALL DATA
// =====================================================

export async function exportAllRows({

  type,

  data,

  columns,

  reportName,

  filters = {},

  summary = {}

}) {

  return exportData({

    type,

    reportName,

    columns,

    data,

    filters,

    summary

  })

}

// =====================================================
// SELECTED ROWS
// =====================================================

export async function exportSelectedRows({

  type,

  selectedRows,

  columns,

  reportName,

  filters = {},

  summary = {}

}) {

  return exportData({

    type,

    reportName,

    columns,

    data:
      selectedRows,

    filters,

    summary

  })

}

// =====================================================
// FEDERATION EXPORT
// =====================================================

export async function exportFederationReport({

  type,

  reportName,

  columns,

  data,

  summary = {},

  filters = {}

}) {

  return exportData({

    type,

    reportName,

    columns,

    data,

    summary,

    filters

  })

}

// =====================================================
// BULK EXPORT
// =====================================================

export async function exportMultipleReports({

  reports = []

}) {

  const results = []

  for (
    const report
    of reports
  ) {

    try {

      await exportData(
        report
      )

      results.push({

        report:
          report.reportName,

        success:
          true

      })

    } catch (
      error
    ) {

      results.push({

        report:
          report.reportName,

        success:
          false,

        error:
          error.message

      })

    }

  }

  return results

}

// =====================================================
// TEMPLATE EXPORT
// =====================================================

export async function exportTemplate({

  reportName,

  sheetName,

  columns,

  sampleRows,

  instructions,

  lookups

}) {

  return downloadFederationTemplate({

    reportName,

    sheetName,

    columns,

    sampleRows,

    instructions,

    lookups

  })

}

// =====================================================
// IMPORT FAILURE PACKAGE
// =====================================================

export async function exportImportFailure({

  reportName,

  errors,

  summary

}) {

  await downloadFullErrorPackage({

    reportName,

    errors

  })

  downloadUploadSummary({

    summary

  })

}

// =====================================================
// EXPORT MENU CONFIG
// =====================================================

export function buildExportMenu({

  includeCsv = true,

  includeExcel = true,

  includePdf = true

} = {}) {

  const menu = []

  if (
    includeCsv
  ) {

    menu.push({

      type:
        'csv',

      label:
        'Export CSV'

    })

  }

  if (
    includeExcel
  ) {

    menu.push({

      type:
        'excel',

      label:
        'Export Excel'

    })

  }

  if (
    includePdf
  ) {

    menu.push({

      type:
        'pdf',

      label:
        'Export PDF'

    })

  }

  return menu

}