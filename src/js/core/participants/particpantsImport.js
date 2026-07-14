// =====================================================
// PARTICIPANT IMPORT
// ParaCycling Federation Management System
//
// Imports Participant Registrations into
// participant_instances.
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


// =====================================================
// PUBLIC ENTRY POINT
// =====================================================

export async function participantImport(

    file

) {

    const pipeline =

        await process({

            file,

            validator:

                validateParticipants,

            resolver:

                resolveParticipants,

            commitPlanBuilder:

                buildCommitPlan

        })

    return {

        approve:

            async () => {

                const commitResult =

                    await commit(

                        pipeline.commitPlan

                    )

                const summary =

    buildParticipantSummary(

        commitResult

    )

const downloads =

    await buildParticipantDownloads(

        summary

    )

                return finish({

                    ...commitResult,

                    summary,

                    downloads

                })

            },

        preview:

    buildParticipantPreview(

        pipeline.resolved

    )

    }

}
// =====================================================
// PARTICIPANT IMPORT FIELDS
// =====================================================

const PARTICIPANT_IMPORT_FIELDS = Object.freeze({

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

    REGISTRATION_STATUS_CODE:

        'registration_status_code',

    PARTICIPANT_STATUS_CODE:

        'participant_status_code'

})



// =====================================================
// PARTICIPANT VALIDATION
//
// Business validation only.
//
// =====================================================

export async function validateParticipants(

    importData,

    validation

) {

    const errors = []

    validateHeaders(

        importData,

        validation,

        errors

    )

    validateRequiredFields(

        importData,

        validation,

        errors

    )

    validateParticipantCodes(

        importData,

        validation,

        errors

    )

    validateDuplicateRows(

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
// PARTICIPANT RESOLUTION
//
// Converts validated CSV rows into fully resolved
// federation business objects.
//
// Validation has already succeeded.
//
// =====================================================

export async function resolveParticipants(

    validatedImport,

    lookup

) {

    const errors = [

        ...(validatedImport.errors || [])

    ]

    const warnings = [

        ...(validatedImport.warnings || [])

    ]

    const objects = []

    for (

        const [

            index,

            row

        ]

        of (

            validatedImport.objects || []

        ).entries()

    ) {

        try {

            objects.push(

                await resolveParticipantRow(

                    row,

                    lookup

                )

            )

        }

        catch (

            error

        ) {

            errors.push({

                row:

                    index + 1,

                type:

                    'lookup',

                severity:

                    'error',

                message:

                    error.message

            })

        }

    }

    const resolved = {

    ...validatedImport,

    success:

        errors.length === 0,

    errors,

    warnings,

    objects

}

return prepareCommitObjects(

    resolved,

    lookup

)

}

// =====================================================
// RESOLVE SINGLE ROW
// =====================================================

async function resolveParticipantRow(

    row,

    lookup

) {

    const event =

        lookup.requireLookup(

            await lookup.resolveEvent(

                row.event_code

            ),

            row.event_code,

            'Event'

        )

    const occurrence =

        lookup.requireLookup(

            await lookup.resolveOccurrence(

                row.event_area

            ),

            row.event_area,

            'Occurrence'

        )

    const program =

        lookup.requireLookup(

            await lookup.resolveProgram(

                row.program_code

            ),

            row.program_code,

            'Program'

        )

    const participantType =

        normalizeParticipantType(

            row.participant_type_code

        )

    const participant =

        await resolveParticipantEntity(

            participantType,

            row.participant_code,

            lookup

        )

    const registrationStatus =

        row.registration_status_code

            ?

            lookup.requireLookup(

                await lookup.resolveStatus(

                    row.registration_status_code

                ),

                row.registration_status_code,

                'Registration Status'

            )

            :

            null

    const participantStatus =

        row.participant_status_code

            ?

            lookup.requireLookup(

                await lookup.resolveStatus(

                    row.participant_status_code

                ),

                row.participant_status_code,

                'Participant Status'

            )

            :

            null

    return buildResolvedParticipant(

        row,

        {

            event,

            occurrence,

            program,

            participant,

            participantType,

            registrationStatus,

            participantStatus

        }

    )

}

// =====================================================
// RESOLVE PARTICIPANT ENTITY
// =====================================================

async function resolveParticipantEntity(

    participantType,

    participantCode,

    lookup

) {

    switch (

        participantType

    ) {

        case 'ATHLETE':

            return lookup.requireLookup(

                await lookup.resolveAthlete(

                    participantCode

                ),

                participantCode,

                'Athlete'

            )

        case 'TEAM':

            return lookup.requireLookup(

                await lookup.resolveTeam(

                    participantCode

                ),

                participantCode,

                'Team'

            )

        case 'COMPOSITION':

            return lookup.requireLookup(

                await lookup.resolveParticipant(

                    participantCode

                ),

                participantCode,

                'Composition'

            )

        default:

            throw new Error(

                `Unsupported participant type '${participantType}'.`

            )

    }

}


// =====================================================
// NORMALIZE PARTICIPANT TYPE
// =====================================================

function normalizeParticipantType(

    value

) {

    return String(

        value || ''

    )

        .trim()

        .toUpperCase()

}


// =====================================================
// BUILD RESOLVED PARTICIPANT
// =====================================================

function buildResolvedParticipant(

    source,

    resolved

) {

    return {

        source,

        event:

            resolved.event,

        occurrence:

            resolved.occurrence,

        program:

            resolved.program,

        participant:

            resolved.participant,

        participantType:

            resolved.participantType,

        registrationStatus:

            resolved.registrationStatus,

        participantStatus:

            resolved.participantStatus

    }

}

// =====================================================
// BUILD GENERATED OBJECT
// =====================================================

function buildGeneratedParticipant(

    resolved

) {

    return buildCommitObject({

        event:

            resolved.event,

        occurrence:

            resolved.occurrence,

        program:

            resolved.program,

        participant:

            resolved.participant,

        status:

            resolved.participantStatus,

        registrationStatus:

            resolved.registrationStatus

    })

}

// =====================================================
// NORMALIZE RESOLVED PARTICIPANTS
// =====================================================

function normalizeResolvedParticipants(

    resolvedImport

) {

    return {

        ...resolvedImport,

        objects:

            (resolvedImport.objects || []).map(

                normalizeResolvedParticipant

            )

    }

}

// =====================================================
// NORMALIZE SINGLE PARTICIPANT
// =====================================================

function normalizeResolvedParticipant(

    resolved

) {

    return {

        ...resolved,

        generated:

            buildGeneratedParticipant(

                resolved

            )

    }

}

// =====================================================
// GENERATE COMMIT OBJECTS
// =====================================================

function generateCommitObjects(

    resolvedImport

) {

    return (

        resolvedImport.objects || []

    ).map(

        participant =>

            participant.generated

    )

}

// =====================================================
// CHECK EXISTING REGISTRATIONS
// =====================================================

async function checkExistingRegistrations(

    resolvedImport,

    lookup

) {

    const objects =

        resolvedImport.objects || []

    for (

        const participant

        of objects

    ) {

        participant.existingRegistration =

            await lookup.resolveParticipantInstance(

                participant.generated

            )

    }

    return resolvedImport

}

// =====================================================
// MARK OPERATION TYPE
// =====================================================

function determineOperations(

    resolvedImport

) {

    for (

        const participant

        of (

            resolvedImport.objects || []

        )

    ) {

        participant.operation =

            null

    }

    return resolvedImport

}
// =====================================================
// BUILD READY OBJECTS
// =====================================================

async function prepareCommitObjects(

    resolvedImport,

    lookup

) {

    let prepared =

        normalizeResolvedParticipants(

            resolvedImport

        )

    prepared =

        await checkExistingRegistrations(

            prepared,

            lookup

        )

    prepared =

        determineOperations(

            prepared

        )

    return prepared

}
// =====================================================
// BUILD COMMIT PLAN
// =====================================================

function buildCommitPlan(

    resolvedImport

) {

    const objects =

        resolvedImport.objects || []

    return {

        description:

            'Participant Registration Import',

        stages: [

            buildParticipantStage(

                objects

            )

        ]

    }

}

// =====================================================
// PARTICIPANT INSTANCE STAGE
// =====================================================

function buildParticipantStage(

    objects = []

) {

    return {

        name:

            'Participant Registrations',

        operations: [

            {

                table:

                    'participant_instances',

                operation:

                    null,

                records:

                    objects.map(

                        buildParticipantRecord

                    )

            }

        ]

    }

}
// =====================================================
// BUILD PARTICIPANT RECORD
// =====================================================

function buildParticipantRecord(

    participant

) {

    return {

        operation:

            participant.operation,

        identity:

            buildParticipantIdentity(

                participant

            ),

        data:

            participant.generated,

        source:

            participant.source,

        resolved:

            participant

    }

}

// =====================================================
// PARTICIPANT IDENTITY
// =====================================================

function buildParticipantIdentity(

    participant

) {

    if (

        participant.existingRegistration

    ) {

        return {

            participant_instance_id:

                participant

                    .existingRegistration

                    .id

        }

    }

    return {

        event_instance_id:

            participant.generated

                .event_instance_id,

        program_id:

            participant.generated

                .program_id,

        participant_ref_id:

            participant.generated

                .participant_ref_id

    }

}

// =====================================================
// BUILD PREVIEW MODEL
// =====================================================

function buildParticipantPreview(

    resolvedImport

) {

    return buildPreview(

        resolvedImport

    )

}
// =====================================================
// BUILD IMPORT SUMMARY
// =====================================================

function buildParticipantSummary(

    commitResult

) {

    return buildSummary(

        commitResult

    )

}
// =====================================================
// BUILD DOWNLOAD PACKAGE
// =====================================================

async function buildParticipantDownloads(

    summary

) {

    return downloadFullPackage(

        summary

    )

}



// =====================================================
// REQUIRED FIELD VALIDATION
// =====================================================

function validateRequiredFields(

    importData,

    validation,

    errors

) {

    const required = [

        [

            PARTICIPANT_IMPORT_FIELDS.EVENT_CODE,

            'Event Code'

        ],

        [

            PARTICIPANT_IMPORT_FIELDS.EVENT_AREA,

            'Event Area'

        ],

        [

            PARTICIPANT_IMPORT_FIELDS.PROGRAM_CODE,

            'Program Code'

        ],

        [

            PARTICIPANT_IMPORT_FIELDS.PARTICIPANT_TYPE_CODE,

            'Participant Type'

        ],

        [

            PARTICIPANT_IMPORT_FIELDS.PARTICIPANT_CODE,

            'Participant Code'

        ]

    ]

    for (

        const [

            index,

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

            of required

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

                        index + 1,

                    field,

                    message:

                        result.message

                })

            }

        }

    }

}

// =====================================================
// PARTICIPANT TYPE VALIDATION
// =====================================================

function validateParticipantCodes(

    importData,

    validation,

    errors

) {

    const allowed = [

        'ATHLETE',

        'TEAM',

        'COMPOSITION'

    ]

    for (

        const [

            index,

            row

        ]

        of (

            importData.objects || []

        ).entries()

    ) {

        const value =

            String(

                row.participant_type_code ||

                ''

            )

            .trim()

            .toUpperCase()

        if (

            !allowed.includes(

                value

            )

        ) {

            errors.push({

                row:

                    index + 1,

                field:

                    'participant_type_code',

                message:

                    `Unknown participant type '${value}'.`

            })

        }

    }

}
// =====================================================
// HEADER VALIDATION
// =====================================================

function validateHeaders(

    importData,

    validation,

    errors

) {

    const result =

        validation.validateHeaders(

            importData.headers,

            Object.values(

                PARTICIPANT_IMPORT_FIELDS

            )

        )

    if (

        result.valid

    ) {

        return

    }

    if (

        result.missing.length

    ) {

        errors.push({

            type:

                'missing_headers',

            message:

                `Missing headers: ${result.missing.join(', ')}`

        })

    }

    if (

        result.duplicates.length

    ) {

        errors.push({

            type:

                'duplicate_headers',

            message:

                `Duplicate headers: ${result.duplicates.join(', ')}`

        })

    }

}


// =====================================================
// DUPLICATE CSV ROWS
// =====================================================

function validateDuplicateRows(

    importData,

    validation,

    errors

) {

    const duplicates =

        validation.validateDuplicates(

            importData.objects,

            [

                PARTICIPANT_IMPORT_FIELDS.EVENT_CODE,

                PARTICIPANT_IMPORT_FIELDS.EVENT_AREA,

                PARTICIPANT_IMPORT_FIELDS.PROGRAM_CODE,

                PARTICIPANT_IMPORT_FIELDS.PARTICIPANT_CODE

            ]

        )

    if (

        duplicates.valid

    ) {

        return

    }

    errors.push(

        ...(duplicates.value || [])

    )

}

