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

// =====================================================
// BUILD COMMIT OBJECT
//
// Converts a Generated Object into a standardized
// Commit Object containing ONLY database fields.
//
// =====================================================

export function buildCommitObject(

  generatedObject = {}

) {
  return {

    ...generatedObject,

    [COMMIT_FIELDS.EVENT_ID]:

            generatedObject.event?.id ?? null,

    [COMMIT_FIELDS.PROGRAM_ID]:

            generatedObject.program?.id ?? null,

    [COMMIT_FIELDS.COUNTRY_ID]:

            generatedObject.country?.id ?? null,

    [COMMIT_FIELDS.COUNTY_ID]:

            generatedObject.county?.id ?? null,

    [COMMIT_FIELDS.SUBCOUNTY_ID]:

            generatedObject.subcounty?.id ?? null,

    [COMMIT_FIELDS.TOWN_ID]:

            generatedObject.town?.id ?? null,

    [COMMIT_FIELDS.SPONSOR_ID]:

            generatedObject.sponsor?.id ?? null

  }
}
