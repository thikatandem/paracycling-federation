// =====================================================
// PREVIEW IMPORTER
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// BUILD PREVIEW
// =====================================================

export function buildPreview(
    importResult = {}
) {

   const preview = {

    success:
        importResult.success ?? false,

    headers:
        importResult.headers ?? [],

    normalizedHeaders:
        importResult.normalizedHeaders ?? [],

    rows:
        importResult.rows ?? [],

    objects:
        importResult.objects ?? [],

    errors:
        importResult.errors ?? [],

    warnings:
        importResult.warnings ?? []

}

preview.index =
    buildPreviewIndex(
        preview
    )

preview.totals =
    calculateTotals(
        preview
    )

return preview

}

// =====================================================
// RENDER PREVIEW
// =====================================================

export function renderPreview(
    preview = {}
) {

    return {

        headers:
            preview.headers ?? [],

        rows:

            (preview.rows || []).map(

                (
                    row,
                    rowIndex
                ) =>

                    createPreviewRow(

                        row,

                        rowIndex,

                        preview

                    )

            )

    }

}

// =====================================================
// SHOW TOTALS
// =====================================================

export function showTotals(
    preview = {}
) {

    return calculateTotals(
        preview
    )

}

// =====================================================
// CLEAR PREVIEW
// =====================================================

export function clearPreview() {

    return {

        headers: [],

        rows: [],

        errors: [],

        warnings: [],

        totals: {

            totalRows: 0,

            successfulRows: 0,

            warningRows: 0,

            errorRows: 0

        }

    }

}

// =====================================================
// CREATE PREVIEW ROW
// =====================================================

function createPreviewRow(

    row = [],

    rowIndex = 0,

    preview = {}

) {

    return {

        rowNumber:

            rowIndex + 1,

        cells:

            row.map(

                (
                    value,
                    columnIndex
                ) =>

                    createCell(

                        value,

                        rowIndex,

                        columnIndex,

                        preview

                    )

            )

    }

}

// =====================================================
// CREATE CELL
// =====================================================

function createCell(

    value,

    rowIndex,

    columnIndex,

    preview

) {

    return {

        value,

        className:

            getCellClass(

                rowIndex,

                columnIndex,

                preview

            )

    }

}

// =====================================================
// CALCULATE TOTALS
// =====================================================

function calculateTotals(
    preview = {}
) {

    const errors =
        preview.errors || []

    const warnings =
        preview.warnings || []

    const totalRows =
        preview.rows
            ? preview.rows.length
            : 0

    return {

        totalRows,

        errorRows:
            errors.length,

        warningRows:
            warnings.length,

        successfulRows:

            Math.max(

                totalRows -

                errors.length,

                0

            )

    }

}

// =====================================================
// RENDER ERRORS
// =====================================================

export function renderErrors(
    preview = {}
) {

    return (preview.errors || []).map(

        error => ({

            row:
                error.row,

            column:
                error.column,

            header:
                error.header,

            value:
                error.value,

            type:
                error.type,

            severity:
                error.severity,

            message:
                error.message

        })

    )

}

// =====================================================
// RENDER WARNINGS
// =====================================================

export function renderWarnings(
    preview = {}
) {

    return (preview.warnings || []).map(

        warning => ({

            row:
                warning.row,

            column:
                warning.column,

            header:
                warning.header,

            value:
                warning.value,

            type:
                warning.type,

            severity:
                warning.severity,

            message:
                warning.message

        })

    )

}

// =====================================================
// HIGHLIGHT CELLS
// =====================================================

export function highlightCells(

    rowIndex,

    columnIndex,

    preview = {}

) {

    return getCellClass(

        rowIndex,

        columnIndex,

        preview

    )

}

// =====================================================
// BUILD PREVIEW INDEX
// =====================================================

function buildPreviewIndex(
    preview = {}
) {

    const index =
        new Map()

    ;[

        ...(preview.errors || []),

        ...(preview.warnings || [])

    ].forEach(

        item => {

            index.set(

                `${item.row}:${item.column}`,

                item

            )

        }

    )

    return index

}

// =====================================================
// GET CELL CLASS
// =====================================================

function getCellClass(

    rowIndex,

    columnIndex,

    preview = {}

) {

    const index =

        preview.index ||

        buildPreviewIndex(
            preview
        )

    const item =

        index.get(

            `${rowIndex + 1}:${columnIndex + 1}`

        )

    if (

        !item

    ) {

        return 'import-success'

    }

    return item.severity === 'error'

        ? 'import-error'

        : 'import-warning'

}



