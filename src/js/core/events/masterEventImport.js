// =====================================================
// MASTER EVENT IMPORT
// ParaCycling Federation Management System
// =====================================================

import {

  process,

  commit,

  finish

}

  from '../import/importService.js'

import {

  buildPreview

}

  from '../import/previewImporter.js'

import {

  buildSummary,

  downloadFullPackage

}

  from '../import/importErrors.js'

import * as lookup

  from '../import/lookupResolver.js'

const MASTER_EVENT_FIELDS = Object.freeze({

  EVENT_NAME:

        'event_name',

  CATEGORY_CODE:

        'event_category_code',

  TYPE_CODE:

        'event_type_code',

  MASTER_STATUS_CODE:

        'event_master_status_code',

  NOTES:

        'notes'

})

// =====================================================
// IMPORT MASTER EVENTS
// =====================================================

export async function importMasterEvents(

  file

) {
  const pipeline =

        await process({

          file,

          validator:

                validateMasterEvents,

          resolver:

                resolveMasterEvents,

          commitPlanBuilder:

                buildCommitPlan

        })

  return {

    stage:

            'preview',

    summary:

            pipeline.resolved.summary,

    preview:

            pipeline.resolved.preview,

    errors:

            pipeline.resolved.errors,

    hasErrors:

            pipeline.resolved.hasErrors,

    approve:

            async () =>

              approveMasterEvents(

                pipeline

              )

  }
}

// =====================================================
// APPROVE MASTER EVENTS
// =====================================================

async function approveMasterEvents(

  pipeline

) {
  if (

    pipeline.resolved.hasErrors

  ) {
    throw new Error(

      'Cannot commit while validation errors exist.'

    )
  }

  const committed =

        await commit(

          pipeline.commitPlan

        )

  const finished =

        finish(

          committed

        )

  return {

    ...finished,

    summary:

            buildSummary(

              finished

            ),

    downloads:

            await downloadFullPackage(

              finished

            )

  }
}

// =====================================================
// VALIDATE MASTER EVENTS
//
// Performs all CSV validation before any lookups.
//
// This stage validates:
//
// • Required fields
// • Duplicate rows in the CSV
// • Event Name formatting
// • Code formatting
//
// No database lookups occur here.
//
// =====================================================

export async function validateMasterEvents(

  importData,

  validation

) {
  const errors = []

  validateRequiredFields(

    importData,

    validation,

    errors

  )

  validateEventNames(

    importData,

    errors

  )

  validateCodeFormats(

    importData,

    errors

  )

  validateDuplicateMasterEvents(

    importData,

    validation,

    errors

  )

  return {

    ...importData,

    valid:

            errors.length === 0,

    errors

  }
}

// =====================================================
// REQUIRED FIELD VALIDATION
// =====================================================

function validateRequiredFields(

  importData,

  validation,

  errors

) {
  const requiredFields = [

    [

      MASTER_EVENT_FIELDS.EVENT_NAME,

      'Event Name'

    ],

    [

      MASTER_EVENT_FIELDS.CATEGORY_CODE,

      'Event Category Code'

    ],

    [

      MASTER_EVENT_FIELDS.TYPE_CODE,

      'Event Type Code'

    ],

    [

      MASTER_EVENT_FIELDS.MASTER_STATUS_CODE,

      'Event Master Status Code'

    ]

  ]

  for (

    const [

      rowIndex,

      row

    ]

    of (

      importData.objects || []

    ).entries()

  ) {
    for (

      const [

        field,

        label

      ]

      of requiredFields

    ) {
      const result =

                validation.validateRequired(

                  row[field],

                  label

                )

      if (

        !result.valid

      ) {
        errors.push({

          row:

                        rowIndex + 1,

          field,

          message:

                        result.message

        })
      }
    }
  }
}

// =====================================================
// EVENT NAME VALIDATION
// =====================================================

function validateEventNames(

  importData,

  errors

) {
  for (

    const [

      rowIndex,

      row

    ]

    of (

      importData.objects || []

    ).entries()

  ) {
    const name =

            String(

              row.event_name ||

                ''

            ).trim()

    if (

      name.length < 3

    ) {
      errors.push({

        row:

                    rowIndex + 1,

        field:

                    'event_name',

        message:

                    'Event Name must contain at least 3 characters.'

      })
    }
  }
}

// =====================================================
// CODE FORMAT VALIDATION
// =====================================================

function validateCodeFormats(

  importData,

  errors

) {
  const codeFields = [

    MASTER_EVENT_FIELDS.CATEGORY_CODE,

    MASTER_EVENT_FIELDS.TYPE_CODE,

    MASTER_EVENT_FIELDS.MASTER_STATUS_CODE

  ]

  const pattern =

        /^[A-Z0-9_]+$/

  for (

    const [

      rowIndex,

      row

    ]

    of (

      importData.objects || []

    ).entries()

  ) {
    for (

      const field

      of codeFields

    ) {
      const value =

                String(

                  row[field] ||

                    ''

                )

                .trim()

                .toUpperCase()

      if (

        value &&

                !pattern.test(

                  value

                )

      ) {
        errors.push({

          row:

                        rowIndex + 1,

          field,

          message:

                        `${field} contains invalid characters.`

        })
      }
    }
  }
}

// =====================================================
// DUPLICATE MASTER EVENT VALIDATION
// =====================================================

function validateDuplicateMasterEvents(

  importData,

  validation,

  errors

) {
  const duplicates =

        validation.validateDuplicates(

          importData.objects || [],

          [

            MASTER_EVENT_FIELDS.EVENT_NAME,

            MASTER_EVENT_FIELDS.TYPE_CODE

          ]

        )

  if (

    !duplicates.valid

  ) {
    errors.push(

      ...(duplicates.value || [])

    )
  }
}

// =====================================================
// NORMALIZE EVENT NAME
// =====================================================

function normalizeEventName(

  value

) {
  return String(

    value ||

        ''

  )

        .trim()

        .replace(

          /\s+/g,

          ' '

        )
}

// =====================================================
// NORMALIZE CODE
// =====================================================

function normalizeCode(

  value

) {
  return String(

    value ||

        ''

  )

        .trim()

        .replace(

          /\s+/g,

          '_'

        )

        .toUpperCase()
}

// =====================================================
// RESOLVE MASTER EVENTS
//
// Converts validated CSV rows into
// commit-ready Event Master objects.
//
// Validation has already happened.
//
// This stage:
//
// • Normalizes values
// • Resolves lookup codes
// • Enforces lookup existence
// • Builds commit objects
//
// =====================================================

async function resolveMasterEvents(

  validated

) {
  const resolved = []

  const errors = []

  for (

    const [

      rowNumber,

      row

    ]

    of (

      validated.objects || []

    ).entries()

  ) {
    try {
      const eventName =

                normalizeEventName(

                  row.event_name

                )

      const categoryCode =

                normalizeCode(

                  row.event_category_code

                )

      const eventTypeCode =

                normalizeCode(

                  row.event_type_code

                )

      const masterStatusCode =

                normalizeCode(

                  row.event_master_status_code

                )

      const category =

                requireLookup(

                  await lookup.resolveCategoryCode(

                    categoryCode

                  ),

                  categoryCode,

                  'Event Category'

                )

      const eventType =

                requireLookup(

                  await lookup.resolveEventTypeCode(

                    eventTypeCode

                  ),

                  eventTypeCode,

                  'Event Type'

                )

      const eventMasterStatus =

                requireLookup(

                  await lookup.resolveEventMasterStatusCode(

                    masterStatusCode

                  ),

                  masterStatusCode,

                  'Event Master Status'

                )

      resolved.push(

        buildMasterEvent(

          row,

          category,

          eventType,

          eventMasterStatus

        )

      )
    } catch (

      error

    ) {
      errors.push({

        row:

                    rowNumber + 1,

        event:

                    row.event_name,

        message:

                    error.message

      })
    }
  }

  const result = {

    rows:

        resolved,

    errors

  }

  return {

    ...result,

    ...formatPreview(

      result

    )

  }
}

// =====================================================
// REQUIRE LOOKUP
// =====================================================

function requireLookup(

  lookupResult,

  code,

  label

) {
  if (

    !lookupResult ||

        !lookupResult.found

  ) {
    throw new Error(

      `${label} '${code}' does not exist.`

    )
  }

  return lookupResult
}

// =====================================================
// BUILD MASTER EVENT
// =====================================================

function buildMasterEvent(

  row,

  category,

  eventType,

  eventMasterStatus

) {
  return {

    event_name:

            normalizeEventName(

              row.event_name

            ),

    event_category_id:

            category.id,

    event_type_id:

            eventType.id,

    event_master_status_id:

            eventMasterStatus.id

  }
}

// =====================================================
// BUILD COMMIT PLAN
// =====================================================

function buildCommitPlan(

  resolved

) {
  return {

    summary:

            buildImportSummary(

              resolved

            ),

    preview:

            buildPreviewRows(

              resolved.rows

            ),

    stages: [

      {

        name:

                    'Event Master',

        description:

                    'Upsert Event Master records.',

        operations: [

          {

            table:

                            'events',

            operation:

                            'upsert',

            conflictColumn:

                            'event_name,event_type_id',

            records:

                            resolved.rows,

            identity: {

              collection:

                                'events',

              databaseKey:

                                'event_id',

              businessKey(

                record

              ) {
                return [

                  normalizeEventName(

                    record.event_name

                  ).toLowerCase(),

                  record.event_type_id

                ].join(

                  '|'

                )
              }

            }

          }

        ]

      }

    ]

  }
}

// =====================================================
// BUILD PREVIEW ROWS
// =====================================================

function buildPreviewRows(

  rows = []

) {
  return rows.map(

    row => ({

      event_name:

                row.event_name,

      event_category_code:

                row.category?.code ??

                null,

      event_category:

                row.category?.name ??

                null,

      event_type_code:

                row.eventType?.code ??

                null,

      event_type:

                row.eventType?.name ??

                null,

      event_master_status_code:

                row.eventMasterStatus?.code ??

                null,

      event_master_status:

                row.eventMasterStatus?.name ??

                null,

      notes:

                row.notes ??

                ''

    })

  )
}

// =====================================================
// FORMAT PREVIEW
// =====================================================

function formatPreview(

  resolved

) {
  return {

    summary:

            buildImportSummary(

              resolved

            ),

    rows:

            buildPreviewRows(

              resolved.rows

            ),

    errors:

            resolved.errors,

    hasErrors:

            hasErrors(

              resolved

            )

  }
}

// =====================================================
// BUILD IMPORT SUMMARY
// =====================================================

function buildImportSummary(

  resolved

) {
  return {

    totalRows:

            resolved.rows.length +

            resolved.errors.length,

    validRows:

            resolved.rows.length,

    errorRows:

            resolved.errors.length,

    warningRows:

            0

  }
}

// =====================================================
// HAS ERRORS
// =====================================================

function hasErrors(

  resolved

) {
  return (

    resolved.errors?.length || 0

  ) > 0
}

