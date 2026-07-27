// =====================================================
// STAFF QUALIFICATION / CERTIFICATION RECORDS SERVICE
// Department access and staff reviews use their own dedicated services.
// No team or access-role assignment logic belongs in this service.
// =====================================================

import {
  getDb
} from '../supabase/getDb.js'

import {
  getUser,
  getProfile
} from '../auth/authStateService.js'

import {
  joinName
} from '../services/formattingService.js'

export const STAFF_RECORD_TYPES =
  Object.freeze({
    QUALIFICATION: 'qualification',
    CERTIFICATION: 'certification'
  })

const RECORD_DEFINITIONS =
  Object.freeze({
    [STAFF_RECORD_TYPES.QUALIFICATION]:
      Object.freeze({
        table: 'staff_qualifications',
        idField: 'qualification_id',
        orderBy: 'updated_at'
      }),
    [STAFF_RECORD_TYPES.CERTIFICATION]:
      Object.freeze({
        table: 'staff_certifications',
        idField: 'certification_id',
        orderBy: 'updated_at'
      })
  })

function definitionFor(
  type
) {
  const definition =
    RECORD_DEFINITIONS[type]

  if (!definition) {
    throw new Error(
      `Unsupported staff record type: ${type}`
    )
  }

  return definition
}

function nullableText(
  value
) {
  const text =
    String(value ?? '').trim()

  return text || null
}

function normalized(
  value
) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function currentActorId() {
  return (
    getProfile()?.profile_id ||
    getUser()?.id ||
    null
  )
}

function assertDateOrder(
  start,
  end,
  label
) {
  if (!start || !end) {
    return
  }

  if (
    Date.parse(end) <
    Date.parse(start)
  ) {
    throw new Error(
      `${label} expiry date cannot be before its issue/award date.`
    )
  }
}

async function assertStaffExists(
  staffId
) {
  if (!staffId) {
    throw new Error(
      'Staff member is required.'
    )
  }

  const {
    data,
    error
  } = await getDb()
    .from('staff_registry')
    .select('staff_id')
    .eq('staff_id', staffId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(
      'Selected staff member was not found.'
    )
  }
}

export async function loadStaffRecordLookups() {
  const {
    data,
    error
  } = await getDb()
    .from('staff_registry')
    .select(`
      staff_id,
      staff_code,
      first_name,
      last_name,
      department_id,
      is_active
    `)
    .eq('is_active', true)
    .order('last_name')
    .order('first_name')

  if (error) {
    throw error
  }

  const staff =
    (data || []).map(
      person => ({
        ...person,
        staff_display_name:
          joinName(
            person.first_name,
            person.last_name
          ) ||
          person.staff_code ||
          'Unnamed Staff'
      })
    )

  return {
    staff,
    staffMap:
      new Map(
        staff.map(
          person => [
            String(person.staff_id),
            person
          ]
        )
      )
  }
}

export async function listStaffRecords(
  type,
  {
    staffId = null,
    enrich = true
  } = {}
) {
  const definition =
    definitionFor(type)

  let query =
    getDb()
      .from(definition.table)
      .select('*')
      .order(
        definition.orderBy,
        { ascending: false }
      )

  if (staffId) {
    query =
      query.eq(
        'staff_id',
        staffId
      )
  }

  const {
    data,
    error
  } = await query

  if (error) {
    throw error
  }

  const rows =
    data || []

  if (!enrich || !rows.length) {
    return rows
  }

  const lookups =
    await loadStaffRecordLookups()

  return rows.map(
    row => {
      const staff =
        lookups.staffMap.get(
          String(row.staff_id || '')
        ) || null

      return {
        ...row,
        staff_name:
          staff?.staff_display_name || '',
        staff_code:
          staff?.staff_code || ''
      }
    }
  )
}

function prepareQualification(
  payload
) {
  return {
    staff_id:
      nullableText(payload.staff_id),
    qualification_name:
      nullableText(
        payload.qualification_name
      ),
    qualification_level:
      nullableText(
        payload.qualification_level
      ),
    field_of_study:
      nullableText(
        payload.field_of_study
      ),
    institution:
      nullableText(payload.institution),
    credential_number:
      nullableText(
        payload.credential_number
      ),
    date_awarded:
      nullableText(payload.date_awarded),
    expiry_date:
      nullableText(payload.expiry_date),
    document_url:
      nullableText(payload.document_url),
    notes:
      nullableText(payload.notes)
  }
}

function prepareCertification(
  payload
) {
  return {
    staff_id:
      nullableText(payload.staff_id),
    certification_name:
      nullableText(
        payload.certification_name
      ),
    certification_type:
      nullableText(
        payload.certification_type
      ),
    issuing_body:
      nullableText(payload.issuing_body),
    credential_number:
      nullableText(
        payload.credential_number
      ),
    issue_date:
      nullableText(payload.issue_date),
    expiry_date:
      nullableText(payload.expiry_date),
    renewal_required:
      Boolean(payload.renewal_required),
    document_url:
      nullableText(payload.document_url),
    notes:
      nullableText(payload.notes)
  }
}

function preparePayload(
  type,
  payload
) {
  switch (type) {
    case STAFF_RECORD_TYPES.QUALIFICATION:
      return prepareQualification(payload)

    case STAFF_RECORD_TYPES.CERTIFICATION:
      return prepareCertification(payload)

    default:
      throw new Error(
        'Unsupported staff record type.'
      )
  }
}

function validatePrepared(
  type,
  payload
) {
  if (!payload.staff_id) {
    throw new Error(
      'Staff member is required.'
    )
  }

  if (
    type ===
    STAFF_RECORD_TYPES.QUALIFICATION
  ) {
    if (!payload.qualification_name) {
      throw new Error(
        'Qualification name is required.'
      )
    }

    assertDateOrder(
      payload.date_awarded,
      payload.expiry_date,
      'Qualification'
    )

    return
  }

  if (!payload.certification_name) {
    throw new Error(
      'Certification name is required.'
    )
  }

  assertDateOrder(
    payload.issue_date,
    payload.expiry_date,
    'Certification'
  )
}

function isDuplicateQualification(
  candidate,
  existing
) {
  if (
    candidate.credential_number &&
    existing.credential_number
  ) {
    return (
      normalized(candidate.credential_number) ===
      normalized(existing.credential_number)
    )
  }

  return (
    normalized(candidate.qualification_name) ===
      normalized(existing.qualification_name) &&
    normalized(candidate.institution) ===
      normalized(existing.institution) &&
    String(candidate.date_awarded || '') ===
      String(existing.date_awarded || '')
  )
}

function isDuplicateCertification(
  candidate,
  existing
) {
  if (
    candidate.credential_number &&
    existing.credential_number
  ) {
    return (
      normalized(candidate.credential_number) ===
      normalized(existing.credential_number)
    )
  }

  return (
    normalized(candidate.certification_name) ===
      normalized(existing.certification_name) &&
    normalized(candidate.issuing_body) ===
      normalized(existing.issuing_body) &&
    String(candidate.issue_date || '') ===
      String(existing.issue_date || '')
  )
}

async function assertNoDuplicate({
  type,
  id = null,
  payload
}) {
  const definition =
    definitionFor(type)
  const existing =
    await listStaffRecords(
      type,
      {
        staffId:
          payload.staff_id,
        enrich: false
      }
    )

  const duplicate =
    existing.find(
      row => {
        if (
          String(
            row[definition.idField] || ''
          ) === String(id || '')
        ) {
          return false
        }

        return type ===
          STAFF_RECORD_TYPES.QUALIFICATION ?
          isDuplicateQualification(
            payload,
            row
          ) :
          isDuplicateCertification(
            payload,
            row
          )
      }
    )

  if (duplicate) {
    throw new Error(
      'A matching record already exists for this staff member. Edit the existing record instead of creating a duplicate.'
    )
  }
}

export async function saveStaffRecord({
  type,
  id = null,
  payload = {}
}) {
  const definition =
    definitionFor(type)
  const prepared =
    preparePayload(
      type,
      payload
    )

  validatePrepared(
    type,
    prepared
  )
  await assertStaffExists(
    prepared.staff_id
  )
  await assertNoDuplicate({
    type,
    id,
    payload: prepared
  })

  const actorId =
    currentActorId()
  const auditPayload =
    id ?
      {
        ...prepared,
        updated_by: actorId,
        updated_at:
          new Date().toISOString()
      } :
      {
        ...prepared,
        created_by: actorId,
        updated_by: actorId
      }

  let query =
    getDb()
      .from(definition.table)

  query = id ?
    query
      .update(auditPayload)
      .eq(
        definition.idField,
        id
      ) :
    query.insert(auditPayload)

  const {
    data,
    error
  } = await query
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteStaffRecord({
  type,
  id
}) {
  const definition =
    definitionFor(type)

  if (!id) {
    throw new Error(
      'Record identifier is required.'
    )
  }

  const {
    error
  } = await getDb()
    .from(definition.table)
    .delete()
    .eq(
      definition.idField,
      id
    )

  if (error) {
    throw error
  }
}

export function getStaffRecordIdField(
  type
) {
  return definitionFor(type).idField
}
