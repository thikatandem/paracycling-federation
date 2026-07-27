import { getDb } from '../supabase/getDb.js'

export async function ensureUniqueActivityRecord({
  table,
  idColumn,
  currentId = null,
  eventInstanceId,
  programId,
  participantInstanceId,
  dateColumn,
  dateValue,
  sessionType
}) {
  let query =
    getDb()
      .from(table)
      .select(idColumn)
      .eq('event_instance_id', eventInstanceId)
      .eq('program_id', programId)
      .eq('participant_instance_id', participantInstanceId)
      .eq(dateColumn, dateValue)
      .eq('session_type', sessionType)

  if (currentId) {
    query = query.neq(idColumn, currentId)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    throw error
  }

  if ((data || []).length > 0) {
    throw new Error('A matching activity record already exists.')
  }
}
