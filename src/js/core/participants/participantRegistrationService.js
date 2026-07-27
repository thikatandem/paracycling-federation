import { getDb } from '../supabase/getDb.js'

function uniqueIds(values = []) {
  return [...new Set(values.filter(Boolean))]
}

async function loadParticipantType(participantTypeCode) {
  const { data, error } =
    await getDb()
      .from('participant_type_master')
      .select('participant_type_id, participant_type_code')
      .eq(
        'participant_type_code',
        String(participantTypeCode || '').trim().toUpperCase()
      )
      .single()

  if (error) {
    throw error
  }

  return data
}

async function findRegistryEntry(participantTypeId, sourceId) {
  const { data, error } =
    await getDb()
      .from('participant_registry')
      .select('*')
      .eq('participant_type_id', participantTypeId)
      .eq('source_id', sourceId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function ensureParticipantRegistryEntry({
  participantTypeCode,
  sourceId,
  displayName
}) {
  if (!participantTypeCode || !sourceId) {
    throw new Error('Participant type and source are required.')
  }

  if (!displayName) {
    throw new Error('Participant display name is required.')
  }

  const type = await loadParticipantType(participantTypeCode)
  const existing = await findRegistryEntry(type.participant_type_id, sourceId)

  if (existing) {
    if (!existing.is_active || (displayName && existing.display_name !== displayName)) {
      const { data, error } =
        await getDb()
          .from('participant_registry')
          .update({
            display_name: displayName || existing.display_name,
            is_active: true
          })
          .eq('participant_ref_id', existing.participant_ref_id)
          .select()
          .single()

      if (error) {
        throw error
      }

      return data
    }

    return existing
  }

  const { data, error } =
    await getDb()
      .from('participant_registry')
      .insert({
        participant_type_id: type.participant_type_id,
        source_id: sourceId,
        display_name: displayName,
        is_active: true
      })
      .select()
      .single()

  if (!error) {
    return data
  }

  if (error.code === '23505') {
    const concurrent = await findRegistryEntry(type.participant_type_id, sourceId)
    if (concurrent) {
      return concurrent
    }
  }

  throw error
}

async function loadExistingRegistrations({
  eventInstanceId,
  programId,
  participantRefIds
}) {
  if (participantRefIds.length === 0) {
    return []
  }

  let query =
    getDb()
      .from('participant_instances')
      .select('participant_instance_id, participant_ref_id, registration_status_id, program_id')
      .eq('event_instance_id', eventInstanceId)
      .in('participant_ref_id', participantRefIds)

  query = programId ?
    query.eq('program_id', programId) :
    query.is('program_id', null)

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data || []
}

export async function saveParticipantRegistrations({
  eventInstanceId,
  programId,
  participantRefIds = [],
  registrationStatusId = null
}) {
  if (!eventInstanceId) {
    throw new Error('Event Occurrence is required')
  }

  if (!programId) {
    throw new Error('Program is required')
  }

  const uniqueParticipantRefIds = uniqueIds(participantRefIds)

  if (uniqueParticipantRefIds.length === 0) {
    return { inserted: [], existing: [], all: [] }
  }

  const existing = await loadExistingRegistrations({
    eventInstanceId,
    programId,
    participantRefIds: uniqueParticipantRefIds
  })

  const existingIds = new Set(existing.map(row => row.participant_ref_id))
  const missingIds = uniqueParticipantRefIds.filter(id => !existingIds.has(id))

  if (missingIds.length === 0) {
    return { inserted: [], existing, all: existing }
  }

  const rows = missingIds.map(participantRefId => ({
    event_instance_id: eventInstanceId,
    participant_ref_id: participantRefId,
    registration_status_id: registrationStatusId,
    program_id: programId
  }))

  const { data, error } =
    await getDb()
      .from('participant_instances')
      .insert(rows)
      .select('participant_instance_id, participant_ref_id, registration_status_id, program_id')

  if (error) {
    if (error.code === '23505') {
      const all = await loadExistingRegistrations({
        eventInstanceId,
        programId,
        participantRefIds: uniqueParticipantRefIds
      })

      return { inserted: [], existing: all, all }
    }

    throw error
  }

  const inserted = data || []
  return { inserted, existing, all: [...existing, ...inserted] }
}

export async function updateParticipantRegistration({
  participantInstanceId,
  eventInstanceId,
  programId,
  participantRefId,
  registrationStatusId
}) {
  if (!participantInstanceId) {
    throw new Error('Participant registration is required.')
  }

  const existing = await loadExistingRegistrations({
    eventInstanceId,
    programId,
    participantRefIds: [participantRefId]
  })

  if (
    existing.some(
      row => row.participant_instance_id !== participantInstanceId
    )
  ) {
    throw new Error('Registration already exists')
  }

  const { data, error } =
    await getDb()
      .from('participant_instances')
      .update({
        event_instance_id: eventInstanceId,
        participant_ref_id: participantRefId,
        registration_status_id: registrationStatusId,
        program_id: programId
      })
      .eq('participant_instance_id', participantInstanceId)
      .select()
      .single()

  if (error) {
    throw error
  }

  return data
}
