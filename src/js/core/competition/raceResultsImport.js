// =====================================================
// RACE RESULTS IMPORT
// ParaCycling Federation Management System
//
// Imports Competition Results into
// race_results.
//
// Business Flow
//
// CSV
//      ↓
// Validation
//      ↓
// Lookup Resolution
//      ↓
// Preview
//      ↓
// Commit
//      ↓
// Summary
//
// Business Rule
//
// Race Results NEVER:
//
// • create Events
// • create Occurrences
// • register Participants
// • assign Programs
//
// Everything must already exist.
//
// The importer records only
// Competition Results.
//
// =====================================================

import {
  resolveEventOccurrence as resolveSharedEventOccurrence,
  resolveActivityProgram as resolveProgram,
  resolveActivityParticipantRegistration as resolveParticipantRegistration,
  verifyProgramRegistration
} from '../import/activityImportResolverService.js'

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

// =====================================================
// RACE RESULT IMPORT FIELDS
// =====================================================

const RACE_RESULT_IMPORT_FIELDS = Object.freeze({

  EVENT_CODE:
        'event_code',

  EVENT_AREA:
        'event_area',

  PROGRAM_CODE:
        'program_code',

  PARTICIPANT_TYPE_CODE:
        'participant_type_code',

  PARTICIPANT_CODE:
        'participant_code',

  COMPETITION_DATE:
        'competition_date',

  SESSION_TYPE:
        'session_type',

  RACE_RESULT_CODE:
        'race_result_code',

  POSITION:
        'position',

  FINISH_TIME:
        'finish_time',

  DISTANCE_KM:
        'distance_km',

  START_TIME:
        'start_time',

  END_TIME:
        'end_time',

  AVG_SPEED_KMH:
        'avg_speed_kmh',

  MAX_SPEED_KMH:
        'max_speed_kmh',

  INDOOR_SESSION:
        'indoor_session',

  NOTES:
        'notes'

})

// =====================================================
// VALIDATE RACE RESULTS
// =====================================================

export async function validateRaceResults(

  importData = {},

  validation

) {
  const result = {

    ...importData,

    success: true,

    errors: [],

    warnings: []

  }

  validateHeaders(

    result,

    validation

  )

  validateRequiredFields(

    result,

    validation

  )

  validateRaceResult(

    result,

    validation

  )

  validatePosition(

    result,

    validation

  )

  validateFinishTime(

    result,

    validation

  )

  validateDuplicateRows(

    result

  )

  validateBusinessKeys(

    result

  )

  result.success =

        result.errors.length === 0

  return result
}

// =====================================================
// HEADER VALIDATION
// =====================================================

function validateHeaders(

  result,

  validation

) {
  validation.validateHeaders(

    result,

    Object.values(

      RACE_RESULT_IMPORT_FIELDS

    )

  )
}

// =====================================================
// REQUIRED FIELD VALIDATION
// =====================================================

function validateRequiredFields(

  result,

  validation

) {
  validation.validateRequiredFields(

    result,

    [

      RACE_RESULT_IMPORT_FIELDS.EVENT_CODE,

      RACE_RESULT_IMPORT_FIELDS.EVENT_AREA,

      RACE_RESULT_IMPORT_FIELDS.PROGRAM_CODE,

      RACE_RESULT_IMPORT_FIELDS.PARTICIPANT_TYPE_CODE,

      RACE_RESULT_IMPORT_FIELDS.PARTICIPANT_CODE,

      RACE_RESULT_IMPORT_FIELDS.COMPETITION_DATE,

      RACE_RESULT_IMPORT_FIELDS.SESSION_TYPE,

      RACE_RESULT_IMPORT_FIELDS.RACE_RESULT_CODE

    ]

  )
}

// =====================================================
// RACE RESULT VALIDATION
// =====================================================

function validateRaceResult(

  result,

  validation

) {
  validation.validateCodeField(

    result,

    RACE_RESULT_IMPORT_FIELDS.RACE_RESULT_CODE,

    {

      uppercase:

                true,

      allowSpaces:

                false,

      allowEmpty:

                false

    }

  )
}

// =====================================================
// POSITION VALIDATION
// =====================================================

function validatePosition(

  result

) {
  for (

    const row

    of result.rows

  ) {
    const value =

            row[

                RACE_RESULT_IMPORT_FIELDS.POSITION

            ]

    if (

      value === '' ||

            value === null ||

            value === undefined

    ) {
      continue
    }

    const position =

            Number(

              value

            )

    if (

      !Number.isInteger(

        position

      ) ||

            position <= 0

    ) {
      result.errors.push({

        rowNumber:

                    row.rowNumber,

        field:

                    RACE_RESULT_IMPORT_FIELDS.POSITION,

        message:

                    'Position must be a positive whole number.'

      })
    }
  }
}

// =====================================================
// FINISH TIME VALIDATION
// =====================================================

function validateFinishTime(

  result

) {
  const intervalPattern =

        /^([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}(\.[0-9]+)?$/

  for (

    const row

    of result.rows

  ) {
    const value =

            (

              row[

                    RACE_RESULT_IMPORT_FIELDS.FINISH_TIME

              ] || ''

            )

            .trim()

    if (

      !value

    ) {
      continue
    }

    if (

      !intervalPattern.test(

        value

      )

    ) {
      result.errors.push({

        rowNumber:

                    row.rowNumber,

        field:

                    RACE_RESULT_IMPORT_FIELDS.FINISH_TIME,

        message:

                    'Finish Time must be HH:MM:SS or HH:MM:SS.mmm.'

      })
    }
  }
}

// =====================================================
// DUPLICATE CSV ROW VALIDATION
// =====================================================

function validateDuplicateRows(

  result

) {
  const seen =

        new Map()

  for (

    const row

    of result.rows

  ) {
    const key =

            [

              row[

                    RACE_RESULT_IMPORT_FIELDS.EVENT_CODE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.EVENT_AREA

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.PROGRAM_CODE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.PARTICIPANT_TYPE_CODE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.PARTICIPANT_CODE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.COMPETITION_DATE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.SESSION_TYPE

              ]

            ]

            .map(

              value =>

                String(

                  value ?? ''

                )

                    .trim()

                    .toUpperCase()

            )

            .join(

              '|'

            )

    if (

      seen.has(

        key

      )

    ) {
      result.errors.push({

        rowNumber:

                    row.rowNumber,

        field:

                    null,

        message:

                    `Duplicate CSV row. First occurrence is row ${seen.get(

                      key

                    )}.`

      })
    } else {
      seen.set(

        key,

        row.rowNumber

      )
    }
  }
}

// =====================================================
// BUSINESS KEY VALIDATION
// =====================================================

function validateBusinessKeys(

  result

) {
  for (

    const row

    of result.rows

  ) {
    const businessKey =

            [

              row[

                    RACE_RESULT_IMPORT_FIELDS.EVENT_CODE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.EVENT_AREA

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.PROGRAM_CODE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.PARTICIPANT_TYPE_CODE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.PARTICIPANT_CODE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.COMPETITION_DATE

              ],

              row[

                    RACE_RESULT_IMPORT_FIELDS.SESSION_TYPE

              ]

            ]

    const missing =

            businessKey.some(

              value =>

                value === null ||

                    value === undefined ||

                    String(

                      value

                    ).trim() === ''

            )

    if (

      missing

    ) {
      result.errors.push({

        rowNumber:

                    row.rowNumber,

        field:

                    null,

        message:

                    'Incomplete business key. Event, Occurrence, Program, Participant, Competition Date and Session Type are required.'

      })
    }
  }
}

// =====================================================
// BUILD VALIDATION RESULT
// =====================================================

function buildValidationResult(

  result

) {
  result.success =

        result.errors.length === 0

  return {

    ...result,

    totalRows:

            result.rows.length,

    validRows:

            result.rows.length -

            result.errors.length,

    invalidRows:

            result.errors.length,

    warningRows:

            result.warnings.length

  }
}

// =====================================================
// ADD ERROR
// =====================================================

function addError(

  result,

  rowNumber,

  field,

  message

) {
  result.errors.push({

    rowNumber,

    field,

    message

  })
}

// =====================================================
// ADD WARNING
// =====================================================

function addWarning(

  result,

  rowNumber,

  field,

  message

) {
  result.warnings.push({

    rowNumber,

    field,

    message

  })
}

// =====================================================
// RESOLVE RACE RESULTS
// =====================================================

export async function resolveRaceResults(

  validatedImport = {}

) {
  const resolvedRows = []

  for (

    const participant

    of validatedImport.rows || []

  ) {
    resolvedRows.push(

      await resolveRaceResultRow(

        participant

      )

    )
  }

  return {

    ...validatedImport,

    rows:

            resolvedRows

  }
}

// =====================================================
// RESOLVE RACE RESULT ROW
// =====================================================

async function resolveRaceResultRow(

  participant

) {
  await resolveSharedEventOccurrence(
          participant,
          resolveEvent,
          resolveOccurrence
        )

  await resolveParticipantChain(

    participant

  )

  participant.generated =

        buildGeneratedRaceResult(

          participant

        )

  participant.commit =

        buildRaceResultCommitObject(

          participant

        )

  participant.record =

        buildRaceResultRecord(

          participant

        )

  return participant
}

// =====================================================
// RESOLVE EVENT
// =====================================================

async function resolveEvent(

  participant

) {
  const event =

        await lookup.resolveEventCode(

          participant.event_code

        )

  if (

    !event ||

        !event.found

  ) {
    throw new Error(

      `Event '${participant.event_code}' was not found.`

    )
  }

  return event
}

// =====================================================
// RESOLVE OCCURRENCE
// =====================================================

async function resolveOccurrence(

  participant

) {
  const occurrence =

        await lookup.resolveOccurrence(

          participant.event_area,

          participant.event.id || participant.event.event_id

        )

  if (

    !occurrence ||

        !occurrence.found

  ) {
    throw new Error(

      `Event Occurrence '${participant.event_area}' was not found.`

    )
  }

  return occurrence
}

// =====================================================
// VERIFY OCCURRENCE BELONGS TO EVENT
// =====================================================


// =====================================================
// RESOLVE EVENT + OCCURRENCE
// =====================================================


// =====================================================
// RESOLVE PROGRAM
// =====================================================


// =====================================================
// RESOLVE PARTICIPANT
// =====================================================


// =====================================================
// RESOLVE PARTICIPANT REGISTRATION
// =====================================================


// =====================================================
// VERIFY PROGRAM REGISTRATION
// =====================================================


// =====================================================
// RESOLVE RACE RESULT CODE
// =====================================================

async function resolveRaceResult(

  participant

) {
  const result =

        await lookup.resolveRaceResultCode(

          participant.race_result_code

        )

  if (

    !result ||

        !result.found

  ) {
    throw new Error(

      `Race Result '${participant.race_result_code}' was not found.`

    )
  }

  return result
}

// =====================================================
// COMPLETE PARTICIPANT RESOLUTION
// =====================================================

async function resolveParticipantChain(

  participant

) {
  participant.program =

        await resolveProgram(

          participant

        )

  participant.registration =

        await resolveParticipantRegistration(

          participant

        )

  verifyProgramRegistration(

    participant

  )

  participant.raceResult =

        await resolveRaceResult(

          participant

        )

  return participant
}

// =====================================================
// DERIVE RESULT STATUS
// =====================================================

function deriveRaceResult(

  participant

) {
  const result =

        participant.raceResult

  return {

    attendance:

        result.present,

    attendance_status_id:

        result.attendanceStatus?.id ?? null,

    outcome_status_id:

        result.outcomeStatus?.id ?? null

  }
}

// =====================================================
// BUILD GENERATED RACE RESULT
// =====================================================

function buildGeneratedRaceResult(

  participant

) {
  const derived =

        deriveRaceResult(

          participant

        )

  return {

    event:

            participant.event,

    occurrence:

            participant.occurrence,

    program:

            participant.program,

    participant:

            participant.participant,

    registration:

            participant.registration,

    event_id:

    participant.event.event_id,

    event_instance_id:

    participant.occurrence.event_instance_id,

    participant_instance_id:

    participant.registration.participant_instance_id,

    participant_source_id:

    participant.participant.participant_source_id ??

    participant.participant.source_id ??

    null,

    athlete_id:

            participant.participant.athlete_id ?? null,

    team_id:

            participant.participant.team_id ?? null,

    town_id:

            participant.occurrence.town_id ?? null,

    program_id:

    participant.program.program_id,

    competition_date:

            participant.competition_date,

    session_type:

            participant.session_type,

    position:

            participant.position ?? null,

    finish_time:

            participant.finish_time ?? null,

    distance_km:

            participant.distance_km ?? null,

    avg_speed_kmh:

            participant.avg_speed_kmh ?? null,

    max_speed_kmh:

            participant.max_speed_kmh ?? null,

    start_time:

            participant.start_time ?? null,

    end_time:

            participant.end_time ?? null,

    indoor_session:

            participant.indoor_session ?? false,

    notes:

            participant.notes ?? null,

    attendance:

            derived.attendance,

    attendance_status_id:

    derived.attendance_status_id,

    outcome_status_id:

    derived.outcome_status_id

  }
}

// =====================================================
// BUILD RACE RESULT COMMIT OBJECT
// =====================================================

function buildRaceResultCommitObject(

  participant

) {
  const participantTypeCode =
    String(participant.participant_type_code || '').trim().toUpperCase()
  const sourceId = participant.participant.source_id ?? null
  const derived = deriveRaceResult(participant)

  return {

    event_id: participant.event.event_id,

    event_instance_id: participant.occurrence.event_instance_id,

    participant_instance_id: participant.registration.participant_instance_id,

    participant_id: null,

    participant_source_id: sourceId,

    athlete_id:
      participantTypeCode === 'ATHLETE' ? sourceId : null,

    team_id:
      participantTypeCode === 'TEAM' ? sourceId : null,

    town_id: participant.occurrence.town_id ?? null,

    program_id: participant.program.program_id,

    competition_date: participant.competition_date,

    session_type: participant.session_type,

    position: participant.position ?? null,

    finish_time: participant.finish_time ?? null,

    distance_km: participant.distance_km ?? null,

    avg_speed_kmh: participant.avg_speed_kmh ?? null,

    max_speed_kmh: participant.max_speed_kmh ?? null,

    start_time: participant.start_time || null,

    end_time: participant.end_time || null,

    indoor_session: participant.indoor_session ?? false,

    notes: participant.notes ?? null,

    attendance: derived.attendance,

    attendance_status_id: derived.attendance_status_id,

    outcome_status_id: derived.outcome_status_id

  }
}

// =====================================================
// BUILD RACE RESULT IDENTITY
// =====================================================

function buildRaceResultIdentity(

  participant

) {
  return {

    eventCode:

            participant.event_code,

    eventArea:

            participant.event_area,

    programCode:

            participant.program_code,

    participantType:

            participant.participant_type_code,

    participantCode:

            participant.participant_code,

    competitionDate:

            participant.competition_date,

    sessionType:

            participant.session_type

  }
}

// =====================================================
// BUILD RACE RESULT RECORD
// =====================================================

function buildRaceResultRecord(

  participant

) {
  return {

    operation:

            null,

    identity:

            buildRaceResultIdentity(

              participant

            ),

    data:

            participant.commit,

    source:

            participant.source,

    resolved:

            participant

  }
}

export function buildRaceResultCommitPlan(

  resolvedImport = {}

) {
  return {

    stages: [

      {

        name:

                    'Race Results',

        operations: [

          {

            table:

                            'race_results',

            operation:

                            'upsert',

            conflictColumn:

                            'event_instance_id,program_id,participant_instance_id,competition_date,session_type',

            records:

                            resolvedImport.rows.map(

                              row =>

                                row.record.data

                            ),

            options: {

              continueOnError:

                                false,

              returning:

                                true

            }

          }

        ]

      }

    ]

  }
}

export function buildRaceResultPreview(

  resolvedImport = {}

) {
  return buildPreview(

    resolvedImport

  )
}

// =====================================================
// BUILD RACE RESULT SUMMARY
// =====================================================

export function buildRaceResultSummary(

  committedImport = {}

) {
  return buildSummary(

    committedImport

  )
}

// =====================================================
// DOWNLOAD RACE RESULT PACKAGE
// =====================================================

export function downloadRaceResultPackage(

  importResult = {}

) {
  return downloadFullPackage(

    importResult

  )
}

// =====================================================
// EXECUTE RACE RESULT IMPORT
// =====================================================

export async function executeRaceResultImport(

  resolvedImport = {}

) {
  const commitPlan =

        buildRaceResultCommitPlan(

          resolvedImport

        )

  const committedImport =

        await commit(

          commitPlan

        )

  return {

    ...committedImport,

    summary:

            buildRaceResultSummary(

              committedImport

            )

  }
}

// =====================================================
// IMPORT RACE RESULTS
// =====================================================

export async function importRaceResults(

  validatedImport = {}

) {
  const resolvedImport =

        await resolveRaceResults(

          validatedImport

        )

  const preview =

        buildRaceResultPreview(

          resolvedImport

        )

  const committedImport =

        await executeRaceResultImport(

          resolvedImport

        )

  return finish({

    preview,

    ...committedImport

  })
}
