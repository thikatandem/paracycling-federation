// =====================================================
// CSV IMPORTER
// ParaCycling Federation Management System
// =====================================================
import {

    CSV_OPTIONS,

    SUPPORTED_TYPES

}

from './importConstants.js'
// =====================================================
// READ CSV FILE
// =====================================================

export async function readCsv(
  file
) {
  if (
    !file
  ) {
    throw new Error(
      'No CSV file supplied.'
    )
  }

  const csvText =
    await file.text()

  return parseCsv(
    csvText
  )
}

// =====================================================
// PARSE CSV
// =====================================================

export function parseCsv(
  csvText = ''
) {
  let text =
    removeUtf8Bom(
      csvText
    )

  text =
    normalizeLineEndings(
      text
    )

  const delimiter =
    detectDelimiter(
      text
    )

  const rows =
    splitCsvLines(
      text
    ).map(
      row =>
        parseCsvRow(
          row,
          delimiter
        )
    )

  const headers =
    getHeaders(
      rows
    )

  
 return {
    source: SUPPORTED_TYPES.CSV,
    delimiter,
    headers,
    rows: getRows(rows)
}
}

// =====================================================
// DETECT DELIMITER
// =====================================================

export function detectDelimiter(
  csvText = ''
) {
  const sample =
    csvText
      .split('\n')
      .slice(
        0,
        5
      )
      .join('\n')

  const delimiters = [

    ',',

    ';',

    '\t',

    '|'

  ]

  let detected =
    CSV_OPTIONS
      ?.delimiter || ','

  let highest =
    -1

  for (
    const delimiter
    of delimiters
  ) {
    const matches =
      sample
        .split(
          delimiter
        ).length

    if (
      matches >
      highest
    ) {
      highest =
        matches

      detected =
        delimiter
    }
  }

  return detected
}

// =====================================================
// GET HEADERS
// =====================================================

export function getHeaders(
  rows = []
) {
  if (
    !rows.length
  ) {
    return []
  }

  return rows[0].map(
    value =>
      String(
        value ??
        ''
      )
  )
}

// =====================================================
// GET DATA ROWS
// =====================================================

export function getRows(
  rows = []
) {
  if (
    rows.length <= 1
  ) {
    return []
  }

  return rows.slice(
    1
  )
}



// =====================================================
// EXPORT CSV
// =====================================================

export function exportCsv(
  rows = [],
  delimiter =
    CSV_OPTIONS.delimiter
) {
  return rows
    .map(
      row =>
        buildCsvRow(
          row,
          delimiter
        )
    )
    .join(
      CSV_OPTIONS.lineBreak
    )
}

// =====================================================
// BUILD CSV ROW
// =====================================================

function buildCsvRow(
  values = [],
  delimiter =
    CSV_OPTIONS.delimiter
) {
  return values
    .map(
      value =>
        escapeCsvValue(
          value
        )
    )
    .join(
      delimiter
    )
}

// =====================================================
// ESCAPE CSV VALUE
// =====================================================

function escapeCsvValue(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  let stringValue =
    String(
      value
    )

  stringValue =
    escapeQuotes(
      stringValue
    )

  if (

    stringValue.includes(',') ||

    stringValue.includes(';') ||

    stringValue.includes('|') ||

    stringValue.includes('\t') ||

    stringValue.includes('\n') ||

    stringValue.includes('\r') ||

    stringValue.includes('"')

  ) {
    stringValue =
      `"${stringValue}"`
  }

  return stringValue
}



