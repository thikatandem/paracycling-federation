// =====================================================
// IMPORT TEMPLATES
// ParaCycling Federation Management System
// =====================================================

import {
    downloadTemplate as exportTemplate
}
from '../export/templateExport.js'


// =====================================================
// DOWNLOAD TEMPLATE
// =====================================================

export async function downloadTemplate(
    template = {}
) {

    return exportTemplate(

        buildTemplatePackage(
            template
        )

    )

}

// =====================================================
// BUILD INSTRUCTIONS
// =====================================================

export function buildInstructions(
    template = {}
) {

    return {

        title:

            template.title ?? '',

        description:

            template.description ?? '',

        instructions:

            template.instructions ?? [],

        notes:

            template.notes ?? []

    }

}

// =====================================================
// BUILD LOOKUP SHEETS
// =====================================================

export function buildLookupSheets(
    template = {}
) {

    return template.lookupSheets ?? []

}

// =====================================================
// BUILD SAMPLE ROWS
// =====================================================

export function buildSampleRows(
    template = {}
) {

    return template.sampleRows ?? []

}

// =====================================================
// HIGHLIGHT REQUIRED
// =====================================================

export function highlightRequired(
    template = {}
) {

    return template.requiredColumns ?? []

}

// =====================================================
// ADD DROPDOWNS
// =====================================================

export function addDropdowns(
    template = {}
) {

    return template.dropdowns ?? []

}

// =====================================================
// BUILD TEMPLATE PACKAGE
// =====================================================

function buildTemplatePackage(
    template = {}
) {

    return {

        title:

            template.title ?? '',

        description:

            template.description ?? '',

        worksheet:

            template.worksheet ?? 'Import',

        headers:

            template.headers ?? [],

        requiredColumns:

            highlightRequired(
                template
            ),

        lookupSheets:

            buildLookupSheets(
                template
            ),

        dropdowns:

            addDropdowns(
                template
            ),

        sampleRows:

            buildSampleRows(
                template
            ),

        instructions:

            buildInstructions(
                template
            )

    }

}