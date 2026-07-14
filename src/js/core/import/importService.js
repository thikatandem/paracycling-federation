import { readCsv } from './csvImporter.js'
import * as validation from './importValidation.js'
import * as lookup from './lookupResolver.js'
import * as preview from './previewImporter.js'
import * as commitEngine from './commitImporter.js'
import { IMPORT_STATUS } from './importConstants.js'
// =====================================================
// IMPORT SERVICE
// ParaCycling Federation Management System
// =====================================================


// =====================================================
// NORMALIZATION ENGINE
//
// Shared by CSV, Excel, JSON,
// API imports and future import sources.
//
// This section converts raw parsed data
// into the federation's standardized
// import object.
//
// =====================================================


// =====================================================
// TRIM VALUES
// =====================================================

export function trimValues(
  rows = []
) {
  return rows.map(
    row =>
      row.map(
        value => {

          if (
            value === null ||
            value === undefined
          ) {
            return value
          }

          return String(
            value
          ).trim()

        }
      )
  )
}

// =====================================================
// CONVERT EMPTY STRINGS
// =====================================================

export function convertEmptyStrings(
  rows = []
) {
  return rows.map(
    row =>
      row.map(
        value => {

          if (
            value === null ||
            value === undefined
          ) {
            return null
          }

          const trimmed =
            String(
              value
            ).trim()

          return trimmed === ''
            ? null
            : trimmed

        }
      )
  )
}

// =====================================================
// GET COLUMN COUNT
// =====================================================

export function getColumnCount(
  rows = []
) {
  if (
    !rows.length
  ) {
    return 0
  }

  return Math.max(
    ...rows.map(
      row =>
        row.length
    )
  )
}

// =====================================================
// PAD ROWS
// Ensures every row has the same number of columns
// =====================================================

export function padRows(
  rows = [],
  columnCount = 0
) {
  return rows.map(
    row => {

      const copy =
        [...row]

      while (
        copy.length <
        columnCount
      ) {
        copy.push(
          null
        )
      }

      return copy

    }
  )
}


// =====================================================
// NORMALIZE ROWS
// =====================================================

export function normalizeRows(
    rows = []
) {

    const columnCount =

        getColumnCount(
            rows
        )

    return padRows(

        rows,

        columnCount

    )

}

// =====================================================
// NORMALIZE HEADERS
// =====================================================

export function normalizeHeaders(
  headers = []
) {
  return headers.map(
    header =>

      String(
        header
      )

        .trim()

        .toLowerCase()

        .replace(
          /\s+/g,
          '_'
        )

        .replace(
          /[^a-z0-9_]/g,
          ''
        )

        .replace(
          /_+/g,
          '_'
        )

        .replace(
          /^_|_$/g,
          ''

        )
  )
}



// =====================================================
// BUILD RECORD OBJECTS
// =====================================================

export function buildObjects(
  headers = [],
  rows = []
) {
  const normalized =
    normalizeHeaders(
      headers
    )

  return rows.map(
    row => {

      const record = {}

      normalized.forEach(
        (
          header,
          index
        ) => {

          record[
            header
          ] =
            row[index] ??
            null

        }
      )

      return record

    }
  )
}





// =====================================================
// BUILD IMPORT RESULT
// =====================================================

export function buildImportResult({

    source,

    delimiter,

    headers = [],

    rows = [],

    errors = [],

    warnings = []

} = {}){

  const normalizedRows =
    normalizeRows(
      rows
    )

  return {

    success:
      errors.length === 0,

    source,

    delimiter,

    headers,

    normalizedHeaders:
      normalizeHeaders(
        headers
      ),

    rows:
      normalizedRows,

    objects:
      buildObjects(
        headers,
        normalizedRows
      ),

    totalRows:
      normalizedRows.length,

    columnCount:
  normalizedRows.length
    ? normalizedRows[0].length
    : headers.length,

errors,

    warnings

  }

}
// =====================================================
// NORMALIZATION PIPELINE
//
// Raw Import
//      ↓
// trimValues()
//      ↓
// convertEmptyStrings()
//      ↓
// normalizeRows()
//      ↓
// normalizeHeaders()
//      ↓
// buildObjects()
//      ↓
// buildImportResult()
//      ↓
// Standard Import Object
// =====================================================

export function normalizeImport(
  rawImport = {}
) {

 const rows =
  convertEmptyStrings(
    trimValues(
      rawImport.rows || []
    )
  )

  return buildImportResult({

    source:
      rawImport.source,

    delimiter:
      rawImport.delimiter,

    headers:
    rawImport.headers || [],

    rows

  })

}

// =====================================================
// READ
// =====================================================

export async function read(

    file

) {

    return readCsv(

        file

    )

}

// =====================================================
// VALIDATE
// =====================================================

export async function validate(

    importData,

    validator

) {

    return validator(

        importData,

        validation

    )

}

// =====================================================
// RESOLVE
// =====================================================

export async function resolve(

    validatedData,

    resolver

) {

    return resolver(

        validatedData,

        lookup

    )

}

// =====================================================
// PREVIEW
// =====================================================

export async function previewImport(

    resolvedData

) {

    return preview.buildPreview(

        resolvedData

    )

}

// =====================================================
// COMMIT
// =====================================================

export async function commit(

    commitPlan

) {

    const context =

        commitEngine.begin()

    await commitEngine.commit(

        context,

        commitPlan

    )

    return commitEngine.finish(

        context

    )

}

// =====================================================
// FINISH
// =====================================================

export function finish(

    result

) {

    return {

        status:

            result.success

                ? IMPORT_STATUS.FINISHED

                : IMPORT_STATUS.FAILED,

        ...result

    }

}

// =====================================================
// PROCESS
// Complete Generic Import Pipeline
// =====================================================

export async function process({

    file,

    validator,

    resolver,

    commitPlanBuilder

}) {

    const raw =

        await read(

            file

        )

    const normalized =

        normalizeImport(

            raw

        )

    const validated =

        await validate(

            normalized,

            validator

        )

    const resolved =

        await resolve(

            validated,

            resolver

        )

    const previewModel =

        await previewImport(

            resolved

        )

    return {

        raw,

        normalized,

        validated,

        resolved,

        preview:

            previewModel,

        commitPlan:

            commitPlanBuilder

                ? commitPlanBuilder(

                    resolved

                  )

                : null

    }

}
// =====================================================
// IMPORT ORCHESTRATOR
//
// Coordinates the complete import workflow.
//
// This section never parses files and never performs
// normalization.
//
// It coordinates:
//
// Raw Import
//      ↓
// normalizeImport()
//      ↓
// validate()
//      ↓
// resolve()
//      ↓
// previewImport()
//      ↓
// commit()
//      ↓
// finish()
//
// =====================================================