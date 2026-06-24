// =====================================================
// EXPORT CONSTANTS
// ParaCycling Federation Management System
// =====================================================

export const EXPORT_CONFIG = {

  organization:
    'Kenya ParaCycling Federation',

  systemName:
    'Federation Management System',

  reportFooter:
    'Kenya ParaCycling Federation',

  generatedBy:
    'ParaCycling Federation System',

  defaultSheetName:
    'Report',

  defaultCsvDelimiter:
    ',',

  defaultDateFormat:
    'YYYY-MM-DD',

  defaultDateTimeFormat:
    'YYYY-MM-DD HH:mm',

  defaultPdfOrientation:
    'landscape',

  defaultPdfSize:
    'a4',

  defaultFilePrefix:
    'KPF'

}

// =====================================================
// FILE TYPES
// =====================================================

export const FILE_TYPES = {

  CSV:
    'csv',

  XLSX:
    'xlsx',

  PDF:
    'pdf'

}

// =====================================================
// MIME TYPES
// =====================================================

export const MIME_TYPES = {

  CSV:
    'text/csv;charset=utf-8;',

  XLSX:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  PDF:
    'application/pdf'

}

// =====================================================
// DEFAULT FILE NAMES
// =====================================================

export const REPORT_NAMES = {

  ATHLETES:
    'Athletes',

  TEAMS:
    'Teams',

  TEAM_MEMBERS:
    'Team Members',

  EVENTS:
    'Events',

  PARTICIPANTS:
    'Participants',

  TRAINING:
    'Training Log',

  PERFORMANCE:
    'Performance',

  RACE_RESULTS:
    'Race Results',

  RANKINGS:
    'Competition Rankings'

}

// =====================================================
// IMPORT TEMPLATE TITLES
// =====================================================

export const TEMPLATE_NAMES = {

  ATHLETES:
    'Athlete Import Template',

  TEAMS:
    'Team Import Template',

  TEAM_MEMBERS:
    'Team Member Import Template',

  EVENTS:
    'Event Import Template',

  PARTICIPANTS:
    'Participant Import Template',

  TRAINING:
    'Training Import Template',

  PERFORMANCE:
    'Performance Import Template',

  RACE_RESULTS:
    'Race Results Import Template'

}

// =====================================================
// PDF STYLES
// =====================================================

export const PDF_STYLES = {

  titleSize:
    18,

  subtitleSize:
    12,

  bodySize:
    10,

  footerSize:
    8,

  margin:
    20

}

// =====================================================
// EXCEL STYLES
// =====================================================

export const EXCEL_STYLES = {

  headerRowHeight:
    25,

  defaultColumnWidth:
    20,

  titleFontSize:
    16,

  headerFontSize:
    12

}

// =====================================================
// CSV OPTIONS
// =====================================================

export const CSV_OPTIONS = {

  delimiter:
    ',',

  quote:
    '"',

  lineBreak:
    '\r\n'

}

// =====================================================
// DOWNLOAD HELPERS
// =====================================================

export function buildFileName(
  reportName
) {

  const now =
    new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    )

  return `${EXPORT_CONFIG.defaultFilePrefix}_${reportName}_${year}${month}${day}`

}