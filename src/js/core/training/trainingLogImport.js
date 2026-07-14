// =====================================================
// TRAINING LOG IMPORT
// ParaCycling Federation Management System
//
// Imports Training Logs into
// training_log.
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

    COMMIT_FIELDS,

    buildCommitObject

}

from '../import/importHelpers.js'

import {

    buildSummary,

    downloadFullPackage

}

from '../import/importErrors.js'

import {

    IMPORT_STATUS

}

from '../import/importConstants.js'


import * as lookup
from '../import/lookupResolver.js'

const TRAINING_IMPORT_FIELDS = Object.freeze({

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

    TRAINING_DATE:
        'training_date',

    SESSION_TYPE:
        'session_type',

    TRAINING_RESULT_CODE:
        'training_result_code',

    DISTANCE_KM:
        'distance_km',

    START_TIME:
        'start_time',

    END_TIME:
        'end_time',

    INDOOR_SESSION:
        'indoor_session',

    NOTES:
        'notes'

})

// =====================================================
// VALIDATE TRAINING LOGS
// =====================================================

export async function validateTrainingLogs(

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

    validateTrainingResult(

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
// VALIDATE HEADERS
// =====================================================

function validateHeaders(

    result,

    validation

) {

    const headerResult =

        validation.validateHeaders(

            result.headers,

            Object.values(

                TRAINING_IMPORT_FIELDS

            )

        )

    for (

        const field

        of headerResult.missing

    ) {

        addError(

            result,

            0,

            field,

            'Missing required header.'

        )

    }

    for (

        const field

        of headerResult.duplicates

    ) {

        addError(

            result,

            0,

            field,

            'Duplicate header.'

        )

    }

    for (

        const field

        of headerResult.unexpected

    ) {

        addWarning(

            result,

            0,

            field,

            'Unexpected header.'

        )

    }

}

// =====================================================
// VALIDATE REQUIRED FIELDS
// =====================================================

function validateRequiredFields(

    result,

    validation

) {

    const required = [

        TRAINING_IMPORT_FIELDS.EVENT_CODE,

        TRAINING_IMPORT_FIELDS.EVENT_AREA,

        TRAINING_IMPORT_FIELDS.PROGRAM_CODE,

        TRAINING_IMPORT_FIELDS.PARTICIPANT_TYPE_CODE,

        TRAINING_IMPORT_FIELDS.PARTICIPANT_CODE,

        TRAINING_IMPORT_FIELDS.TRAINING_DATE,

        TRAINING_IMPORT_FIELDS.SESSION_TYPE,

        TRAINING_IMPORT_FIELDS.TRAINING_RESULT_CODE

    ]

    result.objects.forEach(

        (

            row,

            index

        ) => {

            for (

                const field

                of required

            ) {

                const check =

                    validation.validateRequired(

                        row[field],

                        field

                    )

                if (

                    !check.valid

                ) {

                    addError(

                        result,

                        index + 2,

                        field,

                        check.message

                    )

                }

            }

        }

    )

}

// =====================================================
// VALIDATE TRAINING RESULT
// =====================================================

function validateTrainingResult(

    result,

    validation

) {

    result.objects.forEach(

        (

            row,

            index

        ) => {

            const check =

                validation.validateRequired(

                    row.training_result_code,

                    'training_result_code'

                )

            if (

                !check.valid

            ) {

                addError(

                    result,

                    index + 2,

                    'training_result_code',

                    check.message

                )

            }

        }

    )

}

// =====================================================
// VALIDATE DUPLICATE ROWS
// =====================================================

function validateDuplicateRows(

    result

) {

    const seen =

        new Set()

    result.objects.forEach(

        (

            row,

            index

        ) => {

            const key = [

                row.event_code,

                row.event_area,

                row.program_code,

                row.participant_type_code,

                row.participant_code,

                row.training_date,

                row.session_type

            ]

            .join('|')

            .toLowerCase()

            if (

                seen.has(

                    key

                )

            ) {

                addError(

                    result,

                    index + 2,

                    'duplicate',

                    'Duplicate training record found.'

                )

            }

            else {

                seen.add(

                    key

                )

            }

        }

    )

}

// =====================================================
// VALIDATE BUSINESS KEYS
// =====================================================

function validateBusinessKeys(

    result

) {

    result.objects.forEach(

        (

            row,

            index

        ) => {

            const fields = [

                row.event_code,

                row.event_area,

                row.program_code,

                row.participant_type_code,

                row.participant_code,

                row.training_date,

                row.session_type

            ]

            if (

                fields.some(

                    value =>

                        value === null ||

                        value === ''

                )

            ) {

                addError(

                    result,

                    index + 2,

                    'business_key',

                    'Incomplete business key.'

                )

            }

        }

    )

}

// =====================================================
// BUILD VALIDATION RESULT
// =====================================================

function buildValidationResult(

    row,

    field,

    severity,

    message

) {

    return {

        row,

        field,

        severity,

        message

    }

}
// =====================================================
// ADD ERROR
// =====================================================

function addError(

    result,

    row,

    field,

    message

) {

    result.errors.push(

        buildValidationResult(

            row,

            field,

            'error',

            message

        )

    )

}

// =====================================================
// ADD WARNING
// =====================================================

function addWarning(

    result,

    row,

    field,

    message

) {

    result.warnings.push(

        buildValidationResult(

            row,

            field,

            'warning',

            message

        )

    )

}

// =====================================================
// RESOLVE TRAINING LOGS
// =====================================================

export async function resolveTrainingLogs(

    validatedImport = {}

) {

    const resolvedRows = []

    for (

        const participant

        of validatedImport.rows || []

    ) {

        resolvedRows.push(

            await resolveTrainingRow(

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
// RESOLVE TRAINING ROW
// =====================================================

async function resolveTrainingRow(

    participant

) {

    await resolveEventOccurrence(

    participant

)

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

participant.trainingResult =

    await resolveTrainingResult(

        participant

    )

    participant.generated =

    buildGeneratedTraining(

        participant

    )

participant.commit =

    buildTrainingCommitObject(

        participant

    )

participant.record =

    buildTrainingRecord(

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

    return lookup.resolveEventCode(

        participant.event_code

    )

}

// =====================================================
// RESOLVE OCCURRENCE
// =====================================================

async function resolveOccurrence(

    participant

) {

    return lookup.resolveOccurrence(

        participant.event_area

    )

}

// =====================================================
// VERIFY OCCURRENCE BELONGS TO EVENT
// =====================================================

function verifyOccurrenceOwnership(

    participant

) {

    if (

        !participant.event ||

        !participant.occurrence

    ) {

        return

    }

    if (

        participant.occurrence.event_id !==

        participant.event.event_id

    ) {

        throw new Error(

            `Occurrence '${participant.event_area}' does not belong to Event '${participant.event_code}'.`

        )

    }

}

// =====================================================
// RESOLVE EVENT + OCCURRENCE
// =====================================================

async function resolveEventOccurrence(

    participant

) {

    participant.event =

        await resolveEvent(

            participant

        )

    participant.occurrence =

        await resolveOccurrence(

            participant

        )

    verifyOccurrenceOwnership(

        participant

    )

    return participant

}

// =====================================================
// RESOLVE PROGRAM
// =====================================================

async function resolveProgram(

    participant

) {

    const program =

        await lookup.resolveProgramCode(

            participant.program_code

        )

    if (

        !program ||

        !program.found

    ) {

        throw new Error(

            `Program '${participant.program_code}' was not found.`

        )

    }

    return program

}

// =====================================================
// RESOLVE PARTICIPANT
// =====================================================

async function resolveParticipant(

    participant

) {

    const participantRecord =

        await lookup.resolveParticipant(

            participant.participant_type_code,

            participant.participant_code

        )

    if (

        !participantRecord ||

        !participantRecord.found

    ) {

        throw new Error(

            `Participant '${participant.participant_code}' was not found.`

        )

    }

    return participantRecord

}

// =====================================================
// RESOLVE PARTICIPANT REGISTRATION
// =====================================================

async function resolveParticipantRegistration(

    participant

) {

    participant.participant =

        await resolveParticipant(

            participant

        )

    const registration =

        await lookup.resolveParticipantRegistration(

            participant.occurrence.event_instance_id,

            participant.program.program_id,

            participant.participant.participant_ref_id

        )

    if (

        !registration ||

        !registration.found

    ) {

        throw new Error(

            `Participant '${participant.participant_code}' is not registered for Program '${participant.program_code}'.`

        )

    }

    return registration

}

// =====================================================
// RESOLVE TRAINING RESULT
// =====================================================

async function resolveTrainingResult(

    participant

) {

    const result =

        await lookup.resolveTrainingResultCode(

            participant.training_result_code

        )

    if (

        !result ||

        !result.found

    ) {

        throw new Error(

            `Training Result '${participant.training_result_code}' was not found.`

        )

    }

    return result

}

// =====================================================
// VERIFY PROGRAM REGISTRATION
// =====================================================

function verifyProgramRegistration(

    participant

) {

    if (

        participant.registration.program_id !==

        participant.program.program_id

    ) {

        throw new Error(

            `Participant is not registered for Program '${participant.program_code}'.`

        )

    }

}
// =====================================================
// BUILD GENERATED TRAINING
// =====================================================

function buildGeneratedTraining(

    participant

) {

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

        trainingResult:

            participant.trainingResult,

        event_id:

            participant.event.id,

        event_instance_id:

            participant.occurrence.id,

        participant_instance_id:

            participant.registration.id,

        participant_ref_id:

            participant.participant.id,

        program_id:

            participant.program.id,

        training_date:

            participant.training_date,

        session_type:

            participant.session_type,

        distance_km:

            participant.distance_km ?? null,

        start_time:

            participant.start_time ?? null,

        end_time:

            participant.end_time ?? null,

        indoor_session:

            participant.indoor_session ?? false,

        notes:

            participant.notes ?? null

    }

}

// =====================================================
// BUILD TRAINING COMMIT OBJECT
// =====================================================

function buildTrainingCommitObject(

    participant

) {

    return buildCommitObject(

        participant.generated

    )

}

// =====================================================
// BUILD TRAINING IDENTITY
// =====================================================

function buildTrainingIdentity(

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

        trainingDate:

            participant.training_date,

        sessionType:

            participant.session_type

    }

}

// =====================================================
// BUILD TRAINING RECORD
// =====================================================

function buildTrainingRecord(

    participant

) {

    return {

        operation:

            null,

        identity:

            buildTrainingIdentity(

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

// =====================================================
// BUILD COMMIT PLAN
// =====================================================

export function buildCommitPlan(

    resolvedImport = {}

) {

    return {

        stages: [

            {

                name:

                    'Training Logs',

                operations: [

                    {

                        table:

                            'training_log',

                        operation:

                            null,

                        keyField:

                            'training_id',

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

// =====================================================
// BUILD IMPORT PREVIEW
// =====================================================

export function buildTrainingPreview(

    resolvedImport = {}

) {

    return buildPreview(

        resolvedImport

    )

}

// =====================================================
// BUILD IMPORT SUMMARY
// =====================================================

export function buildTrainingSummary(

    report = {}

) {

    return buildSummary({

        module:

            'Training Import',

        ...report

    })

}
// =====================================================
// DOWNLOAD IMPORT PACKAGE
// =====================================================

export async function downloadTrainingPackage(

    report = {}

) {

    return downloadFullPackage({

        module:

            'Training Import',

        ...report

    })

}

// =====================================================
// EXECUTE TRAINING IMPORT
// =====================================================

export async function executeTrainingImport({

    file

}) {

    const pipeline =

        await process({

            file,

            validator:

                validateTrainingLogs,

            resolver:

                resolveTrainingLogs,

            commitPlanBuilder:

                buildCommitPlan

        })

    if (

        !pipeline.validated.success

    ) {

        return finish({

            success:

                false,

            preview:

                buildTrainingPreview(

                    pipeline.validated

                ),

            summary:

                buildTrainingSummary({

                    summary: {

                        totalRows:

                            pipeline.normalized.totalRows,

                        importedRows:

                            0,

                        warningRows:

                            pipeline.validated.warnings.length,

                        errorRows:

                            pipeline.validated.errors.length

                    },

                    errors:

                        pipeline.validated.errors,

                    warnings:

                        pipeline.validated.warnings

                })

        })

    }

    const commitResult =

        await commit(

            pipeline.commitPlan

        )

    return finish({

        success:

            commitResult.success,

        preview:

            buildTrainingPreview(

                pipeline.resolved

            ),

        summary:

            buildTrainingSummary({

                summary: {

                    totalRows:

                        pipeline.normalized.totalRows,

                    importedRows:

                        commitResult.committed,

                    warningRows:

                        commitResult.errors.length,

                    errorRows:

                        commitResult.failed

                },

                errors:

                    commitResult.errors,

                warnings:

                    []

            }),

        download:

            await downloadTrainingPackage({

                summary: {

                    totalRows:

                        pipeline.normalized.totalRows,

                    importedRows:

                        commitResult.committed,

                    warningRows:

                        commitResult.errors.length,

                    errorRows:

                        commitResult.failed

                },

                errors:

                    commitResult.errors,

                warnings:

                    []

            })

    })

}

// =====================================================
// UI ENTRY POINT
// =====================================================

export async function importTrainingLog(

    file

) {

    return executeTrainingImport({

        file

    })

}


