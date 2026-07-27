// =====================================================
// IMPORT ERRORS
// ParaCycling Federation Management System
// =====================================================

import { downloadCsv as downloadCsvFile } from '../export/csvExport.js'
import { downloadExcel as downloadExcelFile } from '../export/excelExport.js'
import { downloadPdf as downloadPdfFile } from '../export/pdfExport.js'

const IMPORT_ISSUE_COLUMNS = [
  { key: 'module', label: 'Module' },
  { key: 'source', label: 'Source' },
  { key: 'row', label: 'Row' },
  { key: 'column', label: 'Column' },
  { key: 'header', label: 'Header' },
  { key: 'value', label: 'Value' },
  { key: 'type', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'message', label: 'Message' }
]

// =====================================================
// BUILD SUMMARY
// =====================================================

export function buildSummary(
  report = {}
) {
  const summary = {

    module:

            report.module ?? null,

    source:

            report.source ?? null,

    startedAt:

            report.startedAt ?? null,

    completedAt:

            report.completedAt ?? null,

    totalRows:

            report.summary?.totalRows ?? 0,

    importedRows:

            report.summary?.importedRows ?? 0,

    warningRows:

            report.summary?.warningRows ?? 0,

    errorRows:

            report.summary?.errorRows ?? 0,

    totalWarnings:

            (report.warnings || []).length,

    totalErrors:

            (report.errors || []).length

  }

  summary.bySeverity =

        groupBySeverity(
          report
        )

  summary.byType =

        groupByType(
          report
        )

  summary.byRow =

        groupByRow(
          report
        )

  return summary
}

// =====================================================
// BUILD MESSAGE
// =====================================================

export function buildMessage(
  report = {}
) {
  const summary =

        buildSummary(
          report
        )

  return [

    'Import completed.',

    '',

    `Rows : ${summary.totalRows}`,

    `Imported : ${summary.importedRows}`,

    `Warnings : ${summary.totalWarnings}`,

    `Errors : ${summary.totalErrors}`

  ].join('\n')
}

// =====================================================
// DOWNLOAD CSV
// =====================================================

export async function downloadCsv(
  report = {}
) {
  const packageData = buildPackage(report)

  return downloadCsvFile({
    data: packageData.flattened,
    columns: IMPORT_ISSUE_COLUMNS,
    reportName: `${report.module || 'Import'} Issues`
  })
}

export async function downloadExcel(
  report = {}
) {
  const packageData = buildPackage(report)

  return downloadExcelFile({
    data: packageData.flattened,
    columns: IMPORT_ISSUE_COLUMNS,
    reportName: `${report.module || 'Import'} Issues`
  })
}

export async function downloadPdf(
  report = {}
) {
  const packageData = buildPackage(report)

  return downloadPdfFile({
    data: packageData.flattened,
    columns: IMPORT_ISSUE_COLUMNS,
    reportName: `${report.module || 'Import'} Issues`,
    summary: packageData.summary
  })
}

export async function downloadFullPackage(
  report = {}
) {
  const packageData = buildPackage(report)

  const csv = await downloadCsv(report)
  const excel = await downloadExcel(report)
  const pdf = await downloadPdf(report)

  return {
    package: packageData,
    csv,
    excel,
    pdf
  }
}

// =====================================================
// GROUP BY SEVERITY
// =====================================================

function groupBySeverity(
  report = {}
) {
  const groups = new Map()

    ;[

    ...(report.errors || []),

    ...(report.warnings || [])

  ].forEach(

    item => {
      const key =
                item.severity || 'unknown'

      if (
        !groups.has(key)
      ) {
        groups.set(
          key,
          []
        )
      }

      groups
                .get(key)
                .push(item)
    }

  )

  return Object.fromEntries(
    groups
  )
}

// =====================================================
// GROUP BY TYPE
// =====================================================

function groupByType(
  report = {}
) {
  const groups = new Map()

    ;[

    ...(report.errors || []),

    ...(report.warnings || [])

  ].forEach(

    item => {
      const key =
                item.type || 'unknown'

      if (
        !groups.has(key)
      ) {
        groups.set(
          key,
          []
        )
      }

      groups
                .get(key)
                .push(item)
    }

  )

  return Object.fromEntries(
    groups
  )
}

// =====================================================
// GROUP BY ROW
// =====================================================

function groupByRow(
  report = {}
) {
  const groups = new Map()

    ;[

    ...(report.errors || []),

    ...(report.warnings || [])

  ].forEach(

    item => {
      const key =
                item.row ?? 0

      if (
        !groups.has(key)
      ) {
        groups.set(
          key,
          []
        )
      }

      groups
                .get(key)
                .push(item)
    }

  )

  return Object.fromEntries(
    groups
  )
}

// =====================================================
// BUILD STATISTICS
// =====================================================

function buildStatistics(
  report = {}
) {
  const summary =
        buildSummary(
          report
        )

  return {

    totalRows:
            summary.totalRows,

    importedRows:
            summary.importedRows,

    warningRows:
            summary.warningRows,

    errorRows:
            summary.errorRows,

    totalWarnings:
            summary.totalWarnings,

    totalErrors:
            summary.totalErrors

  }
}

// =====================================================
// FLATTEN REPORT
// =====================================================

function flattenReport(
  report = {}
) {
  return [

    ...(report.errors || []),

    ...(report.warnings || [])

  ].map(

    item => ({

      module:
                report.module,

      source:
                report.source,

      row:
                item.row,

      column:
                item.column,

      header:
                item.header,

      value:
                item.value,

      type:
                item.type,

      severity:
                item.severity,

      message:
                item.message

    })

  )
}

// =====================================================
// BUILD PACKAGE
// =====================================================

function buildPackage(
  report = {}
) {
  return {

    summary:
            buildSummary(
              report
            ),

    statistics:
            buildStatistics(
              report
            ),

    errors:
            report.errors || [],

    warnings:
            report.warnings || [],

    flattened:
            flattenReport(
              report
            )

  }
}
