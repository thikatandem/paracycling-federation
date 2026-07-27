// =====================================================
// PROGRAM SERVICE
// ParaCycling Federation Management System
// Central program, event-program and schedule data rules.
// =====================================================

import {
  getDb
} from '../supabase/getDb.js'
import {
  required,
  positiveInteger,
  validateDateRange,
  timeRange,
  validateRules
} from '../services/validationService.js'

export function normalizeProgramName(
  value
) {
  return String(
    value || ''
  )
    .toUpperCase()
    .replace(
      /\bDAYS\b/g,
      'DAY'
    )
    .replace(
      /\s+/g,
      ''
    )
    .trim()
}

export function validateProgramPayload(
  payload = {}
) {
  return validateRules([
    {
      validator: () =>
        required(
          payload.program_name,
          'Program Name'
        )
    },
    {
      validator: () =>
        positiveInteger(
          payload.program_duration_days,
          'Program Duration'
        )
    }
  ])
}

export function validateSchedulePayload(
  payload = {}
) {
  return validateRules([
    {
      validator: () =>
        required(
          payload.program_id,
          'Program'
        )
    },
    {
      validator: () =>
        required(
          payload.schedule_name,
          'Schedule Name'
        )
    },
    {
      validator: () =>
        required(
          payload.schedule_start_date,
          'Start Date'
        )
    },
    {
      validator: () =>
        validateDateRange({
          startDate:
            payload.schedule_start_date,
          endDate:
            payload.schedule_end_date
        })
    },
    {
      validator: () =>
        timeRange(
          payload.start_time,
          payload.end_time,
          'Schedule time'
        )
    }
  ])
}

export async function listPrograms({
  activeOnly = false,
  orderBy = 'program_duration_days',
  ascending = true
} = {}) {
  let query =
    getDb()
      .from(
        'program_master'
      )
      .select(`
        program_id,
        program_code,
        program_name,
        program_duration_days,
        recurrence_type_id,
        sort_order,
        active
      `)

  if (activeOnly) {
    query =
      query.eq(
        'active',
        true
      )
  }

  if (orderBy) {
    query =
      query.order(
        orderBy,
        {
          ascending
        }
      )
  }

  const {
    data,
    error
  } =
    await query

  if (error) {
    throw error
  }

  return data || []
}

export async function getProgram(
  programId
) {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'program_master'
      )
      .select(`
        program_id,
        program_code,
        program_name,
        program_duration_days,
        recurrence_type_id,
        active
      `)
      .eq(
        'program_id',
        programId
      )
      .single()

  if (error) {
    throw error
  }

  return data
}

export async function getProgramSummary(
  programId
) {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'program_master'
      )
      .select(`
        program_code,
        program_name,
        program_duration_days,
        active,
        recurrence_type_master(
          recurrence_name
        )
      `)
      .eq(
        'program_id',
        programId
      )
      .single()

  if (error) {
    throw error
  }

  return data
}

export async function getProgramIdByName(
  programName
) {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'program_master'
      )
      .select(
        'program_id'
      )
      .eq(
        'program_name',
        programName
      )
      .single()

  if (error) {
    throw error
  }

  return data
    ?.program_id ||
    null
}

export async function programExists(
  programName,
  excludeId = null
) {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'program_master'
      )
      .select(`
        program_id,
        program_name
      `)

  if (error) {
    throw error
  }

  const normalized =
    normalizeProgramName(
      programName
    )

  return (
    data || []
  ).some(
    row =>
      row.program_id !==
        excludeId &&
      normalizeProgramName(
        row.program_name
      ) === normalized
  )
}

export async function saveProgramRecord({
  programId = null,
  payload
}) {
  const validation =
    validateProgramPayload(
      payload
    )

  if (!validation.valid) {
    throw new Error(
      validation.message
    )
  }

  const table =
    getDb()
      .from(
        'program_master'
      )

  const result =
    programId ?
      await table
        .update(
          payload
        )
        .eq(
          'program_id',
          programId
        ) :
      await table
        .insert(
          payload
        )

  if (result.error) {
    throw result.error
  }

  return result.data || null
}

export async function deleteProgramRecord(
  programId
) {
  const {
    error
  } =
    await getDb()
      .from(
        'program_master'
      )
      .delete()
      .eq(
        'program_id',
        programId
      )

  if (error) {
    throw error
  }

  return true
}

export async function listProgramRecurrenceTypes({
  includeDetails = false
} = {}) {
  const fields =
    includeDetails ?
      `
        recurrence_type_id,
        recurrence_code,
        recurrence_name,
        recurrence_category,
        sort_order
      ` :
      `
        recurrence_type_id,
        recurrence_name,
        sort_order
      `

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'recurrence_type_master'
      )
      .select(
        fields
      )
      .eq(
        'active',
        true
      )
      .order(
        'sort_order',
        {
          ascending: true
        }
      )

  if (error) {
    throw error
  }

  return data || []
}

export async function getProgramNameSuggestions() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'program_master'
      )
      .select(
        'program_name'
      )
      .order(
        'program_name'
      )

  if (error) {
    throw error
  }

  return [
    ...new Set(
      (data || [])
        .map(
          program =>
            program.program_name
        )
        .filter(
          Boolean
        )
    )
  ]
}

export async function countProgramSchedules(
  programId
) {
  const {
    count,
    error
  } =
    await getDb()
      .from(
        'program_schedules'
      )
      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      )
      .eq(
        'program_id',
        programId
      )

  if (error) {
    throw error
  }

  return count || 0
}

export async function listProgramSchedules(
  programId,
  {
    activeOnly = true
  } = {}
) {
  let query =
    getDb()
      .from(
        'program_schedules'
      )
      .select(`
        program_schedule_id,
        program_id,
        schedule_name,
        schedule_start_date,
        schedule_end_date,
        start_time,
        end_time,
        active
      `)
      .eq(
        'program_id',
        programId
      )

  if (activeOnly) {
    query =
      query.eq(
        'active',
        true
      )
  }

  const {
    data,
    error
  } =
    await query.order(
      'schedule_start_date',
      {
        ascending: true
      }
    )

  if (error) {
    throw error
  }

  return data || []
}

export async function getProgramSchedule(
  scheduleId
) {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'program_schedules'
      )
      .select(`
        program_schedule_id,
        program_id,
        schedule_name,
        schedule_start_date,
        schedule_end_date,
        start_time,
        end_time,
        active
      `)
      .eq(
        'program_schedule_id',
        scheduleId
      )
      .single()

  if (error) {
    throw error
  }

  return data
}

export async function scheduleExists(
  programId,
  scheduleName,
  excludeId = null
) {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'program_schedules'
      )
      .select(
        'program_schedule_id'
      )
      .eq(
        'program_id',
        programId
      )
      .ilike(
        'schedule_name',
        scheduleName
      )

  if (error) {
    throw error
  }

  return (
    data || []
  ).some(
    row =>
      row.program_schedule_id !==
      excludeId
  )
}

export async function saveScheduleRecord({
  scheduleId = null,
  payload
}) {
  const validation =
    validateSchedulePayload(
      payload
    )

  if (!validation.valid) {
    throw new Error(
      validation.message
    )
  }

  const table =
    getDb()
      .from(
        'program_schedules'
      )

  const result =
    scheduleId ?
      await table
        .update(
          payload
        )
        .eq(
          'program_schedule_id',
          scheduleId
        ) :
      await table
        .insert(
          payload
        )

  if (result.error) {
    throw result.error
  }

  return result.data || null
}

export async function deleteScheduleRecord(
  scheduleId
) {
  const {
    error
  } =
    await getDb()
      .from(
        'program_schedules'
      )
      .delete()
      .eq(
        'program_schedule_id',
        scheduleId
      )

  if (error) {
    throw error
  }

  return true
}

export async function getProgramsForEvent(
  eventId,
  {
    includeSortOrder = false,
    filterInactivePrograms = false,
    orderBySequence = false
  } = {}
) {
  if (!eventId) {
    return []
  }

  const programFields =
    includeSortOrder ?
      `
        program_id,
        program_name,
        sort_order,
        active
      ` :
      `
        program_id,
        program_name,
        active
      `

  let query =
    getDb()
      .from(
        'event_programs'
      )
      .select(`
        program_id,
        display_order,
        sequence_no,
        program_master(
          ${programFields}
        )
      `)
      .eq(
        'event_id',
        eventId
      )
      .eq(
        'active',
        true
      )
      .order(
        'display_order'
      )

  if (orderBySequence) {
    query =
      query.order(
        'sequence_no'
      )
  }

  const {
    data,
    error
  } =
    await query

  if (error) {
    throw error
  }

  return (
    data || []
  )
    .filter(
      row =>
        !filterInactivePrograms ||
        row.program_master
          ?.active !== false
    )
    .map(
      row =>
        row.program_master
    )
    .filter(
      Boolean
    )
}

export async function getProgramsForOccurrence(
  eventInstanceId,
  {
    includeSortOrder = false,
    sortByMasterOrder = false
  } = {}
) {
  if (!eventInstanceId) {
    return []
  }

  const programFields =
    includeSortOrder ?
      `
        program_id,
        program_name,
        sort_order
      ` :
      `
        program_id,
        program_name
      `

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'participant_instances'
      )
      .select(`
        program_id,
        program_master(
          ${programFields}
        )
      `)
      .eq(
        'event_instance_id',
        eventInstanceId
      )

  if (error) {
    throw error
  }

  const unique =
    new Map()

  for (const row of data || []) {
    if (
      row.program_master &&
      !unique.has(
        row.program_id
      )
    ) {
      unique.set(
        row.program_id,
        row.program_master
      )
    }
  }

  const programs =
    Array.from(
      unique.values()
    )

  if (sortByMasterOrder) {
    programs.sort(
      (
        first,
        second
      ) =>
        (
          first.sort_order ??
          9999
        ) -
        (
          second.sort_order ??
          9999
        )
    )
  }

  return programs
}
