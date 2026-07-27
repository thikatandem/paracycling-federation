import {
  getDb
}
  from '../supabase/getDb.js'

const db =
  getDb()

// =====================================================
// LOOKUP CACHE
// =====================================================

const lookupCache = {

  countries: null,

  counties: null,

  subcounties: null,

  towns: null,

  athletes: null,

  teams: null,

  participants: null,

  events: null,

  programs: null,

  occurrences: null,

  statuses: null,

  sponsors: null,

  categories: null,

  eventTypes: null,

  eventMasterStatuses: null

}

// =====================================================
// LOOKUP CONFIGURATION
// =====================================================

const LOOKUPS = {

  countries: {

    table: 'country_master',

    select: '*',

    idField: 'country_id',

    codeField: 'country_code',

    nameField: 'country_name',

    activeField: null,

    orderBy: 'country_name',

    ascending: true

  },

  counties: {

    table: 'county_master',

    select: '*',

    idField: 'county_id',

    codeField: null,

    nameField: 'county_name',

    activeField: null,

    orderBy: 'county_name',

    ascending: true

  },

  subcounties: {

    table: 'subcounty_master',

    select: '*',

    idField: 'subcounty_id',

    codeField: 'subcounty_code',

    nameField: 'subcounty_name',

    activeField: null,

    orderBy: 'subcounty_name',

    ascending: true

  },
  towns: {

    table: 'town_master',

    select: '*',

    idField: 'town_id',

    codeField: null,

    nameField: 'town_name',

    activeField: null,

    orderBy: 'town_name',

    ascending: true

  },

  athletes: {

    table: 'athletes',

    select: '*',

    idField: 'athlete_id',

    codeField: 'athlete_code',

    nameField: null,

    activeField: null,

    orderBy: 'athlete_code',

    ascending: true

  },
  teams: {

    table: 'teams',

    select: '*',

    idField: 'team_id',

    codeField: 'team_code',

    nameField: 'team_name',

    activeField: null,

    orderBy: 'team_name',

    ascending: true

  },

  participants: {

    table: 'participant_registry',

    select: '*',

    idField: 'participant_ref_id',

    codeField: null,

    nameField: 'display_name',

    activeField: 'is_active',

    orderBy: 'display_name',

    ascending: true

  },

  events: {

    table: 'events',

    select: '*',

    idField: 'event_id',

    codeField: 'event_code',

    nameField: 'event_name',

    activeField: null,

    orderBy: 'event_name',

    ascending: true

  },

  programs: {

    table: 'program_master',

    select: '*',

    idField: 'program_id',

    codeField: 'program_code',

    nameField: 'program_name',

    activeField: 'active',

    orderBy: 'sort_order',

    ascending: true

  },

  occurrences: {

    table: 'event_instances',

    select: '*',

    idField: 'event_instance_id',

    codeField: null,

    nameField: 'event_area',

    activeField: null,

    orderBy: 'event_area',

    ascending: true

  },
  statuses: {

    table: 'status_master',

    select: '*',

    idField: 'status_id',

    codeField: 'status_code',

    nameField: 'status_name',

    activeField: null,

    orderBy: 'status_name',

    ascending: true

  },

  sponsors: {

    table: 'sponsor_master',

    select: '*',

    idField: 'sponsor_id',

    codeField: 'sponsor_code',

    nameField: 'sponsor_name',

    activeField: null,

    orderBy: 'sponsor_name',

    ascending: true

  },

  categories: {

    table: 'event_category_master',

    select: '*',

    idField: 'event_category_id',

    codeField: 'category_code',

    nameField: 'category_name',

    activeField: null,

    orderBy: 'category_name',

    ascending: true

  },

  eventTypes: {

    table: 'event_type_master',

    select: '*',

    idField: 'event_type_id',

    codeField: 'event_type_code',

    nameField: 'event_type_name',

    activeField: null,

    orderBy: 'event_type_name',

    ascending: true

  },

  eventMasterStatuses: {

    table:

        'event_master_status_master',

    select:

        '*',

    idField:

        'event_master_status_id',

    codeField:

        'status_code',

    nameField:

        'status_name',

    activeField:

        null,

    orderBy:

        'status_name',

    ascending:

        true

  }

}

function getCache(
  key
) {
  return lookupCache[
    key
  ] || null
}

function setCache(
  key,
  value
) {
  lookupCache[
    key
  ] = value
}

export function clearLookupCache(
  key
) {
  lookupCache[
    key
  ] = null
}

export function clearAllLookupCaches() {
  Object.keys(
    lookupCache
  ).forEach(

    key => {
      lookupCache[
        key
      ] = null
    }

  )
}

export async function resolveEventCode(
  eventCode
) {
  if (
    !eventCode
  ) {
    return {

      found: false,

      id: null,

      name: null,

      code: null,

      record: null

    }
  }

  const {

    data,

    error

  } =
        await db
            .from(
              'events'
            )
            .select(`
                event_id,
                event_code,
                event_name,
                event_category_id,
                event_type_id,
                event_category_master(
                    category_name
                ),
                event_type_master(
                    event_type_name
                )
            `)
            .ilike(
              'event_code',
              eventCode.trim()
            )
            .maybeSingle()

  if (

    error ||
        !data

  ) {
    return {

      found: false,

      id: null,

      name: null,

      code: eventCode,

      record: null

    }
  }

  return {

    found: true,

    id: data.event_id,

    event_id: data.event_id,

    event_category_id: data.event_category_id,

    event_type_id: data.event_type_id,

    name: data.event_name,

    code: data.event_code,

    record: data

  }
}

// =====================================================
// LOAD DICTIONARY
// =====================================================

async function loadDictionary(
  lookupKey
) {
  const cache =
    getCache(
      lookupKey
    )

  if (
    cache
  ) {
    return cache
  }

  const config =
    LOOKUPS[
      lookupKey
    ]

  if (
    !config
  ) {
    throw new Error(
      `Unknown lookup: ${lookupKey}`
    )
  }

  let query =
    db
      .from(
        config.table
      )
      .select(
        config.select
      )

  if (
    config.activeField
  ) {
    query =
      query.eq(
        config.activeField,
        true
      )
  }

  if (
    config.orderBy
  ) {
    query =
      query.order(
        config.orderBy,
        {
          ascending:
            config.ascending
        }
      )
  }

  const {
    data,
    error
  } =
    await query

  if (
    error
  ) {
    throw error
  }

  const dictionary = data ?? []

  setCache(

    lookupKey,

    dictionary

  )

  return dictionary
}

// =====================================================
// RESOLVE BY NAME
// =====================================================

async function resolveByName(

  lookupKey,

  value

) {
  if (

    value === null ||

        value === undefined ||

        value === ''

  ) {
    return null
  }

  const config =

        LOOKUPS[
            lookupKey
        ]

  if (

    !config ||

        !config.nameField

  ) {
    return null
  }

  const dictionary =

        await loadDictionary(

          lookupKey

        )

  const search =

        normalizeLookupValue(

          value

        )

  return (

    dictionary.find(

      record =>

        normalizeLookupValue(

          record[
                        config.nameField
          ]

        ) === search

    ) || null

  )
}
// =====================================================
// RESOLVE BY ID
// =====================================================

async function resolveById(

  lookupKey,

  id

) {
  if (

    id === null ||

    id === undefined ||

    id === ''

  ) {
    return null
  }

  const dictionary =
    await loadDictionary(
      lookupKey
    )

  const config =
    LOOKUPS[
      lookupKey
    ]

  return (

    dictionary.find(

      record =>

        record[
          config.idField
        ] === id

    ) || null

  )
}
// =====================================================
// RESOLVE BY CODE
// =====================================================

async function resolveByCode(

  lookupKey,

  code

) {
  if (

    code === null ||

    code === undefined ||

    code === ''

  ) {
    return null
  }

  const config =
    LOOKUPS[
      lookupKey
    ]

  if (

    !config ||

    !config.codeField

  ) {
    throw new Error(

      `Lookup '${lookupKey}' does not support code resolution.`

    )
  }

  const dictionary =
    await loadDictionary(
      lookupKey
    )

  const search =
    normalizeLookupValue(
      code
    )

  return (

    dictionary.find(

      record =>

        normalizeLookupValue(

          record[
            config.codeField
          ]

        ) === search

    ) || null

  )
}

// =====================================================
// NORMALIZE LOOKUP VALUE
// =====================================================

function normalizeLookupValue(
  value
) {
  return String(
    value ?? ''
  )

    .trim()

    .replace(
      /\s+/g,
      ' '
    )

    .toLowerCase()
}

// =====================================================
// PUBLIC RESOLVERS
// =====================================================

// ---------- MASTER LOOKUPS ----------

export async function resolveCountry(value) {
  return buildResolverResult(
    await resolveByName('countries', value),
    LOOKUPS.countries
  )
}

export async function resolveCounty(value) {
  return buildResolverResult(
    await resolveByName('counties', value),
    LOOKUPS.counties
  )
}

export async function resolveSubcounty(value) {
  return buildResolverResult(
    await resolveByName('subcounties', value),
    LOOKUPS.subcounties
  )
}

export async function resolveTown(

  townName,

  subcountyId = null

) {
  if (

    !townName

  ) {
    return buildResolverResult(

      null,

      LOOKUPS.towns

    )
  }

  const towns =

        await loadDictionary(

          'towns'

        )

  const search =

        normalizeLookupValue(

          townName

        )

  const record =

        towns.find(

          town =>

            normalizeLookupValue(

              town.town_name

            ) === search &&

                (

                  !subcountyId ||

                    town.subcounty_id === subcountyId

                )

        ) || null

  return buildResolverResult(

    record,

    LOOKUPS.towns

  )
}

export async function resolveProgram(value) {
  return buildResolverResult(
    await resolveByName('programs', value),
    LOOKUPS.programs
  )
}

export async function resolveStatus(value) {
  return buildResolverResult(
    await resolveByName('statuses', value),
    LOOKUPS.statuses
  )
}

export async function resolveStatusCode(
  code
) {
  return buildResolverResult(
    await resolveByCode('statuses', code),
    LOOKUPS.statuses
  )
}

export async function resolveCategory(value) {
  return buildResolverResult(
    await resolveByName('categories', value),
    LOOKUPS.categories
  )
}

export async function resolveEventType(value) {
  return buildResolverResult(
    await resolveByName('eventTypes', value),
    LOOKUPS.eventTypes
  )
}

export async function resolveCountryById(id) {
  return buildResolverResult(

    await resolveById(

      'countries',

      id

    ),

    LOOKUPS.countries

  )
}

export async function resolveCountyById(id) {
  return buildResolverResult(

    await resolveById(

      'counties',

      id

    ),

    LOOKUPS.counties

  )
}

export async function resolveSubcountyById(id) {
  return buildResolverResult(

    await resolveById(

      'subcounties',

      id

    ),

    LOOKUPS.subcounties

  )
}

export async function resolveTownById(id) {
  return buildResolverResult(

    await resolveById(

      'towns',

      id

    ),

    LOOKUPS.towns

  )
}

export function requireLookup(

  lookup,

  value,

  label

) {
  if (

    !lookup.found

  ) {
    throw new Error(

      `${label} '${value}' does not exist.`

    )
  }

  return lookup
}

export async function resolveProgramById(id) {
  return buildResolverResult(

    await resolveById(

      'programs',

      id

    ),

    LOOKUPS.programs

  )
}

// =====================================================
// CODE RESOLVERS
// =====================================================

export async function resolveCategoryCode(

  code

) {
  return buildResolverResult(

    await resolveByCode(

      'categories',

      code

    ),

    LOOKUPS.categories

  )
}

export async function resolveCountryCode(

  code

) {
  return buildResolverResult(

    await resolveByCode(

      'countries',

      code

    ),

    LOOKUPS.countries

  )
}

export async function resolveCountyCode(

  code

) {
  return buildResolverResult(

    await resolveByCode(

      'counties',

      code

    ),

    LOOKUPS.counties

  )
}

export async function resolveSubcountyCode(

  code

) {
  return buildResolverResult(

    await resolveByCode(

      'subcounties',

      code

    ),

    LOOKUPS.subcounties

  )
}

export async function resolveEventTypeCode(

  code

) {
  return buildResolverResult(

    await resolveByCode(

      'eventTypes',

      code

    ),

    LOOKUPS.eventTypes

  )
}

export async function resolveEventMasterStatusCode(

  code

) {
  return buildResolverResult(

    await resolveByCode(

      'eventMasterStatuses',

      code

    ),

    LOOKUPS.eventMasterStatuses

  )
}

export async function resolveStatusById(id) {
  return buildResolverResult(

    await resolveById(

      'statuses',

      id

    ),

    LOOKUPS.statuses

  )
}

export async function resolveCategoryById(id) {
  return buildResolverResult(

    await resolveById(

      'categories',

      id

    ),

    LOOKUPS.categories

  )
}

export async function resolveEventTypeById(id) {
  return buildResolverResult(

    await resolveById(

      'eventTypes',

      id

    ),

    LOOKUPS.eventTypes

  )
}
// =====================================================
// BUILD RESOLVER RESULT
// =====================================================

function buildResolverResult(

  record,

  config

) {
  if (

    !config

  ) {
    throw new Error(

      'Lookup configuration missing.'

    )
  }

  if (

    !record

  ) {
    return {

      found: false,

      id: null,

      code: null,

      name: null,

      record: null

    }
  }

  return {

    found: true,

    id:

            record[
                config.idField
            ],

    code:

            config.codeField ?

              record[
                    config.codeField
              ] :

              null,

    name:

            config.nameField ?

              record[
                    config.nameField
              ] :

              null,

    record

  }
}

// ---------- BUSINESS ENTITIES ----------

export async function resolveAthlete(value) {
  return buildResolverResult(
    await resolveByCode('athletes', value),
    LOOKUPS.athletes
  )
}

export async function resolveTeam(value) {
  return buildResolverResult(
    await resolveByCode('teams', value),
    LOOKUPS.teams
  )
}

async function loadParticipantTypeByCode(
  participantTypeCode
) {
  const { data, error } =
    await db
      .from('participant_type_master')
      .select('participant_type_id, participant_type_code')
      .eq(
        'participant_type_code',
        String(participantTypeCode || '').trim().toUpperCase()
      )
      .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

async function resolveParticipantRegistryBySource(
  participantTypeCode,
  sourceId
) {
  const type =
    await loadParticipantTypeByCode(
      participantTypeCode
    )

  if (!type || !sourceId) {
    return null
  }

  const { data, error } =
    await db
      .from('participant_registry')
      .select('*')
      .eq('participant_type_id', type.participant_type_id)
      .eq('source_id', sourceId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

function enrichParticipantResult(
  result,
  participantTypeCode = null
) {
  if (!result.found) {
    return result
  }

  const typeCode = participantTypeCode ?
    String(participantTypeCode).trim().toUpperCase() :
    null
  const sourceId = result.record?.source_id ?? null

  return {
    ...result,
    participant_ref_id: result.id,
    participant_source_id: sourceId,
    source_id: sourceId,
    participant_type_code: typeCode,
    athlete_id: typeCode === 'ATHLETE' ? sourceId : null,
    team_id: typeCode === 'TEAM' ? sourceId : null
  }
}

export async function resolveParticipant(
  value,
  participantCode = null
) {
  if (participantCode === null) {
    return enrichParticipantResult(
      buildResolverResult(
        await resolveByName('participants', value),
        LOOKUPS.participants
      )
    )
  }

  const participantTypeCode =
    String(value || '').trim().toUpperCase()
  let source = null

  if (participantTypeCode === 'ATHLETE') {
    source = await resolveAthlete(participantCode)
  } else if (participantTypeCode === 'TEAM') {
    source = await resolveTeam(participantCode)
  } else if (participantTypeCode === 'COMPOSITION') {
    const byName = buildResolverResult(
      await resolveByName('participants', participantCode),
      LOOKUPS.participants
    )

    return enrichParticipantResult(
      byName,
      participantTypeCode
    )
  } else {
    return buildResolverResult(null, LOOKUPS.participants)
  }

  if (!source.found) {
    return buildResolverResult(null, LOOKUPS.participants)
  }

  const registry =
    await resolveParticipantRegistryBySource(
      participantTypeCode,
      source.id
    )

  return enrichParticipantResult(
    buildResolverResult(
      registry,
      LOOKUPS.participants
    ),
    participantTypeCode
  )
}

export async function resolveEvent(
  value
) {
  return resolveEventCode(value)
}

export async function resolveOccurrence(
  value,
  eventId = null
) {
  const occurrences =
    await loadDictionary('occurrences')
  const search = normalizeLookupValue(value)

  const record = occurrences.find(
    occurrence =>
      normalizeLookupValue(occurrence.event_area) === search &&
      (!eventId || occurrence.event_id === eventId)
  ) || null

  const result =
    buildResolverResult(
      record,
      LOOKUPS.occurrences
    )

  if (!result.found) {
    return result
  }

  return {
    ...result,
    event_instance_id: result.id,
    event_id: result.record?.event_id ?? null,
    program_id: result.record?.program_id ?? null,
    town_id: result.record?.town_id ?? null
  }
}

export async function resolveProgramCode(
  code
) {
  const result = buildResolverResult(
    await resolveByCode('programs', code),
    LOOKUPS.programs
  )

  return result.found ?
    { ...result, program_id: result.id } :
    result
}

export async function resolveParticipantRegistration(
  eventInstanceId,
  programId,
  participantRefId
) {
  if (!eventInstanceId || !programId || !participantRefId) {
    return {
      found: false,
      id: null,
      participant_instance_id: null,
      event_instance_id: eventInstanceId || null,
      program_id: programId || null,
      participant_ref_id: participantRefId || null,
      record: null
    }
  }

  const { data, error } =
    await db
      .from('participant_instances')
      .select('*')
      .eq('event_instance_id', eventInstanceId)
      .eq('program_id', programId)
      .eq('participant_ref_id', participantRefId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return {
      found: false,
      id: null,
      participant_instance_id: null,
      event_instance_id: eventInstanceId,
      program_id: programId,
      participant_ref_id: participantRefId,
      record: null
    }
  }

  return {
    found: true,
    id: data.participant_instance_id,
    participant_instance_id: data.participant_instance_id,
    event_instance_id: data.event_instance_id,
    program_id: data.program_id,
    participant_ref_id: data.participant_ref_id,
    record: data
  }
}

export async function resolveParticipantInstance(
  generated = {}
) {
  return resolveParticipantRegistration(
    generated.event_instance_id || generated.occurrence?.id,
    generated.program_id || generated.program?.id,
    generated.participant_ref_id ||
      generated.participant?.participant_ref_id ||
      generated.participant?.id
  )
}

export async function resolveRegistrationStatusCode(
  code
) {
  const { data, error } =
    await db
      .from('registration_status_master')
      .select('*')
      .eq(
        'status_code',
        String(code || '').trim().toUpperCase()
      )
      .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return {
      found: false,
      id: null,
      code,
      name: null,
      record: null
    }
  }

  return {
    found: true,
    id: data.registration_status_id,
    registration_status_id: data.registration_status_id,
    code: data.status_code,
    name: data.status_name,
    record: data
  }
}

async function resolveActivityResultCode(
  code
) {
  const normalizedCode =
    String(code || '').trim().toUpperCase()

  const { data: outcome, error: outcomeError } =
    await db
      .from('outcome_status_master')
      .select('*')
      .eq('status_code', normalizedCode)
      .maybeSingle()

  if (outcomeError) {
    throw outcomeError
  }

  if (outcome) {
    const participated =
      normalizedCode !== 'DNS'

    return {
      found: true,
      code: outcome.status_code,
      name: outcome.status_name,
      present: true,
      attendance: true,
      participated,
      absent: false,
      outcomeStatus: {
        id: outcome.outcome_status_id,
        record: outcome
      },
      attendanceStatus: null,
      record: outcome
    }
  }

  const { data: attendance, error: attendanceError } =
    await db
      .from('attendance_status_master')
      .select('*')
      .eq('status_code', normalizedCode)
      .maybeSingle()

  if (attendanceError) {
    throw attendanceError
  }

  if (attendance) {
    const absent =
      normalizedCode.startsWith('ABSENT') ||
      normalizedCode === 'EXCUSED'

    return {
      found: true,
      code: attendance.status_code,
      name: attendance.status_name,
      present: !absent,
      attendance: !absent,
      participated: false,
      absent,
      outcomeStatus: null,
      attendanceStatus: {
        id: attendance.attendance_status_id,
        record: attendance
      },
      record: attendance
    }
  }

  return {
    found: false,
    code: normalizedCode,
    name: null,
    present: false,
    attendance: false,
    participated: false,
    absent: false,
    outcomeStatus: null,
    attendanceStatus: null,
    record: null
  }
}

export async function resolveTrainingResultCode(code) {
  return resolveActivityResultCode(code)
}

export async function resolveRaceResultCode(code) {
  return resolveActivityResultCode(code)
}

export async function resolveSponsor(value) {
  return buildResolverResult(
    await resolveByCode('sponsors', value),
    LOOKUPS.sponsors
  )
}

export async function resolveSponsorCode(

  sponsorCode

) {
  return buildResolverResult(

    await resolveByCode(

      'sponsors',

      sponsorCode

    ),

    LOOKUPS.sponsors

  )
}
// =====================================================
// BUILD LOOKUP ERROR
// =====================================================

export function buildLookupError({

  row = null,

  column = null,

  header = null,

  value = null,

  message = 'Lookup failed.'

} = {}) {
  return {

    row,

    column,

    header,

    value,

    type: 'lookup',

    severity: 'error',

    message

  }
}
