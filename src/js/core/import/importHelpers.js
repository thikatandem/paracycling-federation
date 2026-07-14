// =====================================================
// IMPORT HELPERS
// ParaCycling Federation Management System
// =====================================================


// =====================================================
// COMMIT FIELD MAP
//
// Standard database fields shared by all import modules.
//
// These fields are never hardcoded inside individual
// importers.
//
// =====================================================

export const COMMIT_FIELDS = Object.freeze({

    COUNTRY_ID:

        'country_id',

    COUNTY_ID:

        'county_id',

    SUBCOUNTY_ID:

        'subcounty_id',

    TOWN_ID:

        'town_id',

    EVENT_TYPE_ID:

        'event_type_id',

    EVENT_CATEGORY_ID:

        'event_category_id',

    STATUS_ID:

        'status_id',

    EVENT_MASTER_STATUS_ID:

    'event_master_status_id',

    SPONSOR_ID:

        'sponsor_id',
   
    PROGRAM_ID:
    'program_id',

EVENT_ID:
    'event_id',

EVENT_INSTANCE_ID:
    'event_instance_id',

DISPLAY_ORDER:
    'display_order',

IS_REQUIRED:
    'is_required',

ACTIVE:
    'active'

})


// =====================================================
// BUILD COMMIT OBJECT
//
// Converts a Generated Object into a standardized
// Commit Object.
//
// Shared by every importer.
//
// =====================================================

export function buildCommitObject(

    generatedObject = {}

) {

    return {

        ...generatedObject,

        [COMMIT_FIELDS.COUNTRY_ID]:

            generatedObject.country?.id ?? null,

        [COMMIT_FIELDS.COUNTY_ID]:

            generatedObject.county?.id ?? null,

        [COMMIT_FIELDS.SUBCOUNTY_ID]:

            generatedObject.subcounty?.id ?? null,

        [COMMIT_FIELDS.TOWN_ID]:

            generatedObject.town?.id ?? null,

        [COMMIT_FIELDS.EVENT_TYPE_ID]:

            generatedObject.eventType?.id ?? null,

        [COMMIT_FIELDS.EVENT_CATEGORY_ID]:

            generatedObject.category?.id ?? null,

        [COMMIT_FIELDS.STATUS_ID]:

            generatedObject.status?.id ?? null,
       [COMMIT_FIELDS.EVENT_MASTER_STATUS_ID]:

    generatedObject.eventMasterStatus?.id ?? null,

        [COMMIT_FIELDS.SPONSOR_ID]:

            generatedObject.sponsor?.id ?? null,
   [COMMIT_FIELDS.PROGRAM_ID]:

    generatedObject.program?.id ?? null,

program:

    generatedObject.program ?? null,

sponsor:

    generatedObject.sponsor ?? null,

town:

    generatedObject.town ?? null,

subcounty:

    generatedObject.subcounty ?? null,

county:

    generatedObject.county ?? null,

country:

    generatedObject.country ?? null,

eventType:

    generatedObject.eventType ?? null,

category:

    generatedObject.category ?? null,

status:

    generatedObject.status ?? null,

eventMasterStatus:

    generatedObject.eventMasterStatus ?? null

}

}

