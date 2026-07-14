// =====================================================
// COMMIT IMPORTER
// ParaCycling Federation Management System
// =====================================================

import {
    supabase
}
from '../supabase/supabaseClient.js'



// =====================================================
// BEGIN IMPORT COMMIT
// =====================================================

export function begin() {

    return {

        startedAt:

            new Date(),

        completedAt:

            null,

        committed: 0,

        inserted: 0,

        updated: 0,

        upserted: 0,

        failed: 0,

        errors: [],

        operations: [],
        rollbackStack: [],
identityMap: {

    events:

        new Map(),

    occurrences:

        new Map(),

    sponsors:

        new Map(),

    eventSponsors:

        new Map()

},

    }

}

// =====================================================
// COMMIT IMPORT
// =====================================================

export async function commit(

    context,

    commitPlan = {}

) {

    try {

        const stages =

            commitPlan.stages || []

        for (

            const stage

            of stages

        ) {

            await executeStage(

                context,

                stage

            )

        }

        return context

    }

    catch (

        error

    ) {

        await rollback(

            context

        )

        throw error

    }

}

async function executeStage(

    context,

    stage

) {

    for (

        const operation

        of stage.operations || []

    ) {

        await resolveForeignKeys(

            context,

            operation

        )

        const operationType =

    resolveOperation(

        operation.table,

        operation.operation

    )

switch (

    operationType

) {

            case 'insert':

                await batchInsert(

                    context,

                    operation

                )

                break

            case 'update':

                await batchUpdate(

                    context,

                    operation

                )

                break

            case 'upsert':

                await batchUpsert(

                    context,

                    operation

                )

                break

        }

    }

}

function resolveForeignKeys(

    context,

    operation

) {

    const foreignKeys =

        operation.foreignKeys || []

    for (

        const record

        of operation.records || []

    ) {

        for (

            const foreignKey

            of foreignKeys

        ) {

            const map =

                context.identityMap[
                    foreignKey.identity
                ]

            if (

                !map

            ) {

                continue

            }

            const key =

                foreignKey.businessKey(

                    record

                )

            record[
                foreignKey.field
            ] =

                map.get(
                    key
                ) ?? null

        }

    }

}


// =====================================================
//
// STANDARD OPERATION CONTRACT
//
// {
//
//     table: '',
//
//     operation: 'insert' | 'update' | 'upsert',
//
//     records: [],
//
//     options: {
//
//         chunkSize: 500,
//
//         ignoreDuplicates: false,
//
//         returning: true
//
//     },
//
//     identity: {
//
//         collection: '',
//
//         databaseKey: '',
//
//         businessKey(record) {}
//
//     },
//
//     foreignKeys: [
//
//         {
//
//             field: '',
//
//             identity: '',
//
//             businessKey(record) {}
//
//         }
//
//     ]
//
// }
//


// =====================================================
// DEFAULT OPERATION POLICIES
//
// Central ownership rules.
//
// Individual importers may override these,
// but should not violate ownership.
//
// =====================================================

export const DEFAULT_OPERATION_POLICIES = Object.freeze({

    events:

        'upsert',

    athletes:

        'upsert',

    teams:

        'upsert',

    sponsor_master:

        'upsert',

    event_instances:

        'upsert',

    participant_instances:

        'insert',

    training_log:

        'update',

    race_results:

        'update'

})

// =====================================================
// RESOLVE OPERATION
// =====================================================

export function resolveOperation(

    table,

    requestedOperation = null

) {

    if (

        requestedOperation

    ) {

        return requestedOperation

    }

    return (

        DEFAULT_OPERATION_POLICIES[
            table
        ] ||

        'insert'

    )

}
// =====================================================
// =====================================================
// ROLLBACK
// =====================================================

export async function rollback(

    context

) {

    const operations =

        [

            ...(context.rollbackStack || [])

        ].reverse()

    for (

        const operation

        of operations

    ) {

        try {

            const ids =

                operation.rows

                    .map(

                        row =>

                            Object.values(

                                row

                            )[0]

                    )

                    .filter(Boolean)

            if (

                ids.length === 0

            ) {

                continue

            }

            const primaryKey =

                Object.keys(

                    operation.rows[0]

                )[0]

            await supabase

                .from(

                    operation.table

                )

                .delete()

                .in(

                    primaryKey,

                    ids

                )

        }

        catch (

            error

        ) {

            context.errors.push({

                type:

                    'rollback',

                severity:

                    'error',

                table:

                    operation.table,

                message:

                    error.message

            })

        }

    }

    return {

        success:

            true,

        supported:

            true,

        context

    }

}

// =====================================================
// FINISH IMPORT
// =====================================================

export function finish(

    context

) {

    context.completedAt =

        new Date()

    return {

        success:

            context.failed === 0,

        startedAt:

            context.startedAt,

        completedAt:

            context.completedAt,

        inserted:

            context.inserted,

        updated:

            context.updated,

        upserted:

            context.upserted,

        failed:

            context.failed,

        committed:

            context.committed,

        errors:

            context.errors

    }

}

// =====================================================
// WRITE AUDIT LOG
// =====================================================

async function writeAuditLog(

    table,

    action,

    oldValues,

    newValues

) {

    try {

        await supabase

            .from(

                'audit_log'

            )

            .insert({

                table_name:

                    table,

                action_type:

                    action,

                old_values:

                    oldValues,

                new_values:

                    newValues

            })

    }

    catch (

        error

    ) {

        console.warn(

            'Audit logging failed:',

            error.message

        )

    }

}
// =====================================================
// BATCH INSERT
// =====================================================

async function batchInsert(

    context,

    operation = {}

) {

    const {

        table,

        records = [],

        options = {}

    } = operation

    const {

        chunkSize = 500,

        ignoreDuplicates = false,

        returning = true,

        continueOnError = false

    } = options

    const chunks =

        splitIntoChunks(

            records,

            chunkSize

        )

    for (

        const chunk

        of chunks

    ) {

        const query =

            supabase

                .from(table)

                .insert(

                    chunk,

                    {

                        ignoreDuplicates

                    }

                )

        const {

            data,

            error

        } = returning

            ? await query.select()

            : await query

        if (

            error

        ) {

            context.failed +=

                chunk.length

            context.errors.push({

                table,

                operation: 'insert',

                severity: 'error',

                message:

                    error.message,

                error

            })

            if (

                !continueOnError

            ) {

                throw error

            }

            continue

        }

        context.inserted +=

    data.length

context.committed +=

    data.length

captureIdentity(

    context,

    operation,

    chunk,

    data

)

context.operations.push({

    table,

    operation:'insert',

    affected:

        data.length,

    returned:

        data

})

context.rollbackStack.push({

    table,

    action:

        'delete',

    rows:

        data

})


for (

    const row

    of data

) {

    await writeAuditLog(

        table,

        'INSERT',

        null,

        row

    )

}
    }

}

function captureIdentity(

    context,

    operation,

    sourceRecords = [],

    returnedRows = []

) {

    const identity =

        operation.identity

    if (

        !identity

    ) {

        return

    }

    const map =

        context.identityMap[
            identity.collection
        ]

    if (

        !map

    ) {

        return

    }

    for (

        let index = 0;

        index < returnedRows.length;

        index++

    ) {

        const source =

            sourceRecords[index]

        const returned =

            returnedRows[index]

        if (

            !source ||

            !returned

        ) {

            continue

        }

        const key =

            identity.businessKey(

                source

            )

        map.set(

            key,

            returned[
                identity.databaseKey
            ]

        )

    }

}

// =====================================================
// BATCH UPDATE
// =====================================================

async function batchUpdate(

    context,

    operation = {}

) {

    const {

        table,

        records = [],

        keyField,

        options = {}

    } = operation

    const {

        continueOnError = false,

        returning = true

    } = options

    for (

        const record

        of records

    ) {

        const key =

            record[keyField]

        const payload =

            {

                ...record

            }

        delete payload[keyField]

        const query =

            supabase

                .from(table)

                .update(

                    payload

                )

                .eq(

                    keyField,

                    key

                )

        const {

            data,

            error

        } = returning

            ? await query.select()

            : await query

        if (

            error

        ) {

            context.failed++

            context.errors.push({

                table,

                operation: 'update',

                severity: 'error',

                key,

                message:

                    error.message,

                error

            })

            if (

                !continueOnError

            ) {

                throw error

            }

            continue

        }

        context.updated++

        context.committed++

        context.operations.push({

    table,

    operation:

        'update',

    affected:

        data?.length || 1,

    returned:

        data || []

})

await writeAuditLog(

    table,

    'UPDATE',

    null,

    payload

)
    }

}



// =====================================================
// BATCH UPSERT
// =====================================================

async function batchUpsert(

    context,

    operation = {}

) {

    const {

        table,

        records = [],

        conflictColumn,

        identity,

        options = {}

    } = operation

    const {

        chunkSize = 500,

        returning = true,

        continueOnError = false

    } = options

    const chunks =

        splitIntoChunks(

            records,

            chunkSize

        )

    for (

        const chunk

        of chunks

    ) {

        const query =

            supabase

                .from(

                    table

                )

                .upsert(

                    chunk,

                    {

                        onConflict:

                            conflictColumn

                    }

                )

        const {

            data,

            error

        } = returning

            ? await query.select()

            : await query

        if (

            error

        ) {

            context.failed +=

                chunk.length

            context.errors.push({

                table,

                operation:

                    'upsert',

                severity:

                    'error',

                message:

                    error.message,

                error

            })

            if (

                !continueOnError

            ) {

                throw error

            }

            continue

        }

        context.upserted +=

            chunk.length

        context.committed +=

            chunk.length

        captureIdentity(

            context,

            operation,

            chunk,

            data || []

        )

        context.operations.push({

            table,

            operation:

                'upsert',

            affected:

                data?.length ||

                chunk.length,

            returned:

                data || []

        })

context.rollbackStack.push({

    table,

    action:

        'delete',

    rows:

            data || []

})

for (

    const row

    of data || []

) {

    await writeAuditLog(

        table,

        'UPSERT',

        null,

        row

    )

}
    }

}
// =====================================================
// SPLIT INTO CHUNKS
// =====================================================

function splitIntoChunks(

    records = [],

    chunkSize = 500

) {

    const chunks = []

    for (

        let i = 0;

        i < records.length;

        i += chunkSize

    ) {

        chunks.push(

            records.slice(

                i,

                i + chunkSize

            )

        )

    }

    return chunks

}
