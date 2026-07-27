import { getDb } from '../supabase/getDb.js'

async function loadInstance(participantInstanceId) {
  const { data, error } =
    await getDb()
      .from('participant_instances')
      .select(`
        participant_instance_id,
        participant_ref_id,
        event_instance_id,
        program_id,
        participant_registry(
          participant_ref_id,
          source_id,
          display_name,
          participant_type_master(
            participant_type_code
          )
        )
      `)
      .eq('participant_instance_id', participantInstanceId)
      .single()

  if (error) {
    throw error
  }

  return data
}

export async function resolveParticipantContext({
  participantInstanceId = null,
  participantId = null,
  athleteId = null,
  teamId = null
} = {}) {
  if (!participantInstanceId) {
    return {
      participantInstanceId: null,
      participantRefId: null,
      participantId,
      athleteId,
      teamId,
      participantTypeCode: athleteId ? 'ATHLETE' : (teamId ? 'TEAM' : null),
      sourceId: athleteId || teamId || null,
      displayName: ''
    }
  }

  const instance = await loadInstance(participantInstanceId)
  const registry = instance.participant_registry
  const participantTypeCode =
    registry?.participant_type_master?.participant_type_code || null
  const sourceId = registry?.source_id || null

  return {
    participantInstanceId: instance.participant_instance_id,
    participantRefId: instance.participant_ref_id,
    participantId,
    athleteId: athleteId || (participantTypeCode === 'ATHLETE' ? sourceId : null),
    teamId: teamId || (participantTypeCode === 'TEAM' ? sourceId : null),
    participantTypeCode,
    sourceId,
    displayName: registry?.display_name || ''
  }
}
