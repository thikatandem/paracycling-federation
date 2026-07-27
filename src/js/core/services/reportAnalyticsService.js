// =====================================================
// REPORT ANALYTICS SERVICE
// Schema-driven analytics for training/reporting pages.
// No database IDs, tables, or status names are invented here.
// =====================================================

export function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function round(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round((safeNumber(value) + Number.EPSILON) * factor) / factor
}

export function sum(values = []) {
  return values.reduce((total, value) => total + safeNumber(value), 0)
}

export function average(values = []) {
  const usable = values
    .map(value => Number(value))
    .filter(value => Number.isFinite(value))

  return usable.length ? sum(usable) / usable.length : 0
}

export function percentage(numerator, denominator, digits = 1) {
  if (!denominator) return 0
  return round((safeNumber(numerator) / safeNumber(denominator)) * 100, digits)
}

function cleanText(value) {
  return String(value ?? '').trim()
}

export function monthKey(dateValue) {
  if (!dateValue) return 'Unknown'
  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key) {
  if (!/^\d{4}-\d{2}$/.test(String(key))) return String(key || 'Unknown')
  const [year, month] = String(key).split('-').map(Number)
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function isoWeekKey(dateValue) {
  if (!dateValue) return 'Unknown'
  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  const target = new Date(date.valueOf())
  const dayNumber = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3)
  const week = 1 + Math.round((target - firstThursday) / 604800000)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function ageOnDate(dob, onDate = new Date()) {
  if (!dob) return null
  const birth = new Date(`${String(dob).slice(0, 10)}T00:00:00Z`)
  const reference = onDate instanceof Date ? onDate : new Date(onDate)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(reference.getTime())) return null

  let age = reference.getUTCFullYear() - birth.getUTCFullYear()
  const monthDelta = reference.getUTCMonth() - birth.getUTCMonth()
  if (monthDelta < 0 || (monthDelta === 0 && reference.getUTCDate() < birth.getUTCDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

export function getPerformance(record) {
  if (!record) return null
  if (Array.isArray(record.performance)) return record.performance[0] || null
  return record.performance || null
}

export function getEventInstance(record) {
  return record?.event_instances || record?.participant_instances?.event_instances || null
}

export function getEvent(record) {
  return record?.events || getEventInstance(record)?.events || null
}

export function getProgram(record, context = {}) {
  const nested = record?.participant_instances?.program_master
  if (nested) return nested
  const programId = record?.program_id || record?.participant_instances?.program_id || getEventInstance(record)?.program_id
  return context.programById?.get(programId) || null
}

export function getParticipantRegistry(record) {
  return record?.participant_instances?.participant_registry || record?.participant_registry || null
}

export function getParticipantTypeCode(record) {
  return cleanText(
    getParticipantRegistry(record)?.participant_type_master?.participant_type_code ||
    getParticipantRegistry(record)?.participant_type_master?.participant_type_name
  ).toUpperCase()
}

export function getParticipantName(record, context = {}) {
  const registry = getParticipantRegistry(record)
  if (registry?.display_name) return registry.display_name

  const athleteId = record?.athlete_id
  const athlete = context.athleteById?.get(athleteId)
  if (athlete) return `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || athlete.athlete_code || 'Unknown'

  const teamId = record?.team_id
  const team = context.teamById?.get(teamId)
  if (team) return team.team_name || team.team_code || 'Unknown'

  return 'Unknown'
}

export function isTeamParticipant(record, context = {}) {
  const code = getParticipantTypeCode(record)
  const registry = getParticipantRegistry(record)
  if (code.includes('TEAM')) return true
  if (record?.team_id) return true
  if (registry?.source_id && context.teamById?.has(registry.source_id)) return true
  return false
}

export function isIndividualParticipant(record, context = {}) {
  const code = getParticipantTypeCode(record)
  const registry = getParticipantRegistry(record)
  if (code.includes('ATHLETE') || code.includes('INDIVIDUAL')) return true
  if (record?.athlete_id) return true
  if (registry?.source_id && context.athleteById?.has(registry.source_id)) return true
  return !isTeamParticipant(record, context)
}

export function resolveAthleteId(record, context = {}) {
  if (record?.athlete_id) return record.athlete_id
  const registry = getParticipantRegistry(record)
  if (registry?.source_id && context.athleteById?.has(registry.source_id)) return registry.source_id
  return null
}

export function resolveTeamId(record, context = {}) {
  if (record?.team_id) return record.team_id
  const registry = getParticipantRegistry(record)
  if (registry?.source_id && context.teamById?.has(registry.source_id)) return registry.source_id

  const athleteId = resolveAthleteId(record, context)
  if (!athleteId) return null
  const date = String(record?.training_date || '')
  const memberships = context.teamMembershipsByAthlete?.get(athleteId) || []
  const membership = memberships.find(item => {
    if (!date) return Boolean(item.is_active)
    return date >= String(item.start_date || '0000-01-01') && (!item.end_date || date <= item.end_date)
  })
  return membership?.team_id || null
}

export function sessionKey(record) {
  const eventInstanceId = record?.event_instance_id || record?.participant_instances?.event_instance_id || getEventInstance(record)?.event_instance_id || ''
  const eventId = record?.event_id || getEvent(record)?.event_id || ''
  const programId = record?.program_id || record?.participant_instances?.program_id || ''
  return [
    String(record?.training_date || ''),
    String(eventInstanceId || eventId || ''),
    String(programId || ''),
    cleanText(record?.session_type).toUpperCase(),
    String(record?.start_time || ''),
    String(record?.end_time || '')
  ].join('|')
}

export function attendanceState(record) {
  const master = record?.attendance_status_master || null
  const status = cleanText(master?.status_code || master?.status_name).toUpperCase()

  if (status.includes('EXCUS')) return { state: 'Excused', attended: false, denominator: false, recorded: true }
  if (status.includes('ABSENT')) return { state: 'Absent', attended: false, denominator: true, recorded: true }
  if (status.includes('LATE')) return { state: 'Late', attended: true, denominator: true, recorded: true }
  if (status.includes('PRESENT') || status.includes('PARTICIP')) return { state: 'Present', attended: true, denominator: true, recorded: true }

  if (record?.absent === true) return { state: 'Absent', attended: false, denominator: true, recorded: true }
  if (record?.present === true || record?.participated === true) return { state: 'Present', attended: true, denominator: true, recorded: true }
  if (record?.attendance === true) return { state: 'Present', attended: true, denominator: true, recorded: true }
  if (record?.attendance === false) return { state: 'Absent', attended: false, denominator: true, recorded: true }

  return { state: 'Not Recorded', attended: false, denominator: false, recorded: false }
}

export function effectiveDistance(record) {
  const direct = safeNumber(record?.distance_km, NaN)
  if (Number.isFinite(direct)) return direct
  return safeNumber(getPerformance(record)?.distance_km, 0)
}

export function effectiveDuration(record) {
  const direct = safeNumber(record?.duration_minutes, NaN)
  if (Number.isFinite(direct)) return direct
  return safeNumber(getPerformance(record)?.duration_minutes, 0)
}

export function effectiveSpeed(record) {
  const direct = safeNumber(record?.avg_speed_kmh, NaN)
  if (Number.isFinite(direct) && direct > 0) return direct
  return safeNumber(getPerformance(record)?.avg_speed_kmh, 0)
}

export function effectiveTss(record) {
  return safeNumber(getPerformance(record)?.training_stress_score, 0)
}

function pushMapArray(map, key, value) {
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(value)
}

function metricAccumulator(label = '') {
  return {
    label,
    rows: 0,
    sessionKeys: new Set(),
    participants: new Set(),
    distance: 0,
    durations: [],
    speeds: [],
    tss: [],
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    attendanceDenominator: 0,
    attended: 0,
    attendanceRecorded: 0
  }
}

function addRecordToAccumulator(acc, record, participantId) {
  acc.rows += 1
  acc.sessionKeys.add(sessionKey(record))
  if (participantId) acc.participants.add(participantId)
  acc.distance += effectiveDistance(record)

  const duration = effectiveDuration(record)
  if (duration > 0) acc.durations.push(duration)
  const speed = effectiveSpeed(record)
  if (speed > 0) acc.speeds.push(speed)
  const tss = effectiveTss(record)
  if (tss > 0) acc.tss.push(tss)

  const attendance = attendanceState(record)
  if (attendance.recorded) acc.attendanceRecorded += 1
  if (attendance.denominator) acc.attendanceDenominator += 1
  if (attendance.attended) acc.attended += 1
  if (attendance.state === 'Present') acc.present += 1
  else if (attendance.state === 'Late') acc.late += 1
  else if (attendance.state === 'Absent') acc.absent += 1
  else if (attendance.state === 'Excused') acc.excused += 1
}

function finalizeAccumulator(acc) {
  return {
    label: acc.label,
    sessions: acc.sessionKeys.size,
    records: acc.rows,
    participants: acc.participants.size,
    totalDistanceKm: round(acc.distance, 2),
    averageDistanceKm: round(acc.sessionKeys.size ? acc.distance / acc.sessionKeys.size : 0, 2),
    totalDurationMinutes: round(sum(acc.durations), 1),
    averageDurationMinutes: round(average(acc.durations), 1),
    averageSpeedKmh: round(average(acc.speeds), 2),
    totalTss: round(sum(acc.tss), 1),
    averageTss: round(average(acc.tss), 1),
    tssRecords: acc.tss.length,
    present: acc.present,
    late: acc.late,
    absent: acc.absent,
    excused: acc.excused,
    attendanceRate: percentage(acc.attended, acc.attendanceDenominator),
    attendanceRecorded: acc.attendanceRecorded,
    attendanceCoverage: percentage(acc.attendanceRecorded, acc.rows)
  }
}

function groupRecords(records, keyGetter, labelGetter, context = {}) {
  const groups = new Map()
  for (const record of records) {
    const key = keyGetter(record)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, metricAccumulator(labelGetter(record, key)))
    const participantId = getParticipantRegistry(record)?.participant_ref_id || resolveAthleteId(record, context) || resolveTeamId(record, context)
    addRecordToAccumulator(groups.get(key), record, participantId)
  }
  return [...groups.entries()].map(([key, acc]) => ({ key, ...finalizeAccumulator(acc) }))
}

function rowsByLogicalSession(records = []) {
  const sessions = new Map()
  for (const record of records) {
    const key = sessionKey(record)
    if (!sessions.has(key)) sessions.set(key, [])
    sessions.get(key).push(record)
  }
  return sessions
}

function sessionMetricFromRows(rows = []) {
  const distances = rows.map(effectiveDistance).filter(value => value > 0)
  const durations = rows.map(effectiveDuration).filter(value => value > 0)
  const speeds = rows.map(effectiveSpeed).filter(value => value > 0)
  const tssValues = rows.map(effectiveTss).filter(value => value > 0)
  return {
    distanceKm: distances.length ? Math.max(...distances) : 0,
    durationMinutes: durations.length ? Math.max(...durations) : 0,
    averageSpeedKmh: average(speeds),
    tss: average(tssValues)
  }
}

export function buildContextMaps(context = {}) {
  const athleteById = new Map((context.athletes || []).map(row => [row.athlete_id, row]))
  const teamById = new Map((context.teams || []).map(row => [row.team_id, row]))
  const programById = new Map((context.programs || []).map(row => [row.program_id, row]))
  const participantRegistryById = new Map((context.participantRegistry || []).map(row => [row.participant_ref_id, row]))
  const teamMembershipsByAthlete = new Map()

  for (const membership of context.teamMembers || []) {
    pushMapArray(teamMembershipsByAthlete, membership.athlete_id, membership)
  }

  return {
    ...context,
    athleteById,
    teamById,
    programById,
    participantRegistryById,
    teamMembershipsByAthlete
  }
}

function individualRows(records, context) {
  return records.filter(record => isIndividualParticipant(record, context))
}

function buildIndividualStats(records, context) {
  return groupRecords(
    individualRows(records, context),
    record => getParticipantRegistry(record)?.participant_ref_id || resolveAthleteId(record, context),
    record => getParticipantName(record, context),
    context
  ).sort((a, b) => b.totalDistanceKm - a.totalDistanceKm)
}

function buildTeamSessionRows(records, context) {
  const grouped = new Map()

  for (const record of records) {
    // Team distance/speed/load must come from an explicitly team-scoped
    // training record, not from silently re-labelling an individual member's ride.
    if (!record?.team_id && !isTeamParticipant(record, context)) continue
    const teamId = resolveTeamId(record, context)
    if (!teamId) continue
    const key = `${teamId}::${sessionKey(record)}`
    if (!grouped.has(key)) grouped.set(key, { teamId, rows: [] })
    grouped.get(key).rows.push(record)
  }

  return [...grouped.values()]
}

function buildTeamStats(records, context) {
  const teams = new Map()
  for (const entry of buildTeamSessionRows(records, context)) {
    const team = context.teamById?.get(entry.teamId)
    const label = team?.team_name || team?.team_code || entry.teamId
    if (!teams.has(entry.teamId)) {
      teams.set(entry.teamId, {
        teamId: entry.teamId,
        label,
        sessions: 0,
        distance: 0,
        durations: [],
        speeds: [],
        tss: [],
        attendanceDenominator: 0,
        attended: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0
      })
    }

    const acc = teams.get(entry.teamId)
    const metric = sessionMetricFromRows(entry.rows)
    acc.sessions += 1
    acc.distance += metric.distanceKm
    if (metric.durationMinutes > 0) acc.durations.push(metric.durationMinutes)
    if (metric.averageSpeedKmh > 0) acc.speeds.push(metric.averageSpeedKmh)
    if (metric.tss > 0) acc.tss.push(metric.tss)

    const attendanceStates = entry.rows.map(attendanceState)
    const hasAbsent = attendanceStates.some(item => item.state === 'Absent')
    const hasExcused = attendanceStates.every(item => item.state === 'Excused') && attendanceStates.length > 0
    const hasLate = attendanceStates.some(item => item.state === 'Late')
    const hasPresent = attendanceStates.some(item => item.attended)

    if (hasExcused) acc.excused += 1
    else {
      acc.attendanceDenominator += 1
      if (hasAbsent && !hasPresent) acc.absent += 1
      else if (hasLate) {
        acc.late += 1
        acc.attended += 1
      } else if (hasPresent) {
        acc.present += 1
        acc.attended += 1
      } else {
        acc.absent += 1
      }
    }
  }

  return [...teams.values()]
    .map(acc => ({
      key: acc.teamId,
      label: acc.label,
      sessions: acc.sessions,
      totalDistanceKm: round(acc.distance, 2),
      averageDistanceKm: round(acc.sessions ? acc.distance / acc.sessions : 0, 2),
      totalDurationMinutes: round(sum(acc.durations), 1),
      averageDurationMinutes: round(average(acc.durations), 1),
      averageSpeedKmh: round(average(acc.speeds), 2),
      totalTss: round(sum(acc.tss), 1),
      averageTss: round(average(acc.tss), 1),
      tssRecords: acc.tss.length,
      present: acc.present,
      late: acc.late,
      absent: acc.absent,
      excused: acc.excused,
      attendanceRate: percentage(acc.attended, acc.attendanceDenominator)
    }))
    .sort((a, b) => b.totalDistanceKm - a.totalDistanceKm)
}

function buildPeriodAttendance(records, periodGetter, context) {
  const groups = new Map()
  for (const record of records) {
    const key = periodGetter(record.training_date)
    if (!groups.has(key)) groups.set(key, metricAccumulator(key))
    const participant = getParticipantRegistry(record)?.participant_ref_id || resolveAthleteId(record, context) || resolveTeamId(record, context)
    addRecordToAccumulator(groups.get(key), record, participant)
  }
  return [...groups.values()]
    .map(finalizeAccumulator)
    .sort((a, b) => a.label.localeCompare(b.label))
}

function buildMonthlyStats(records, context) {
  const groups = new Map()
  for (const [key, rows] of rowsByLogicalSession(records)) {
    const sample = rows[0]
    const month = monthKey(sample?.training_date)
    if (!groups.has(month)) {
      groups.set(month, {
        month,
        sessions: 0,
        individualSessions: new Set(),
        teamSessions: new Set(),
        distance: 0,
        individualDistance: 0,
        teamDistance: 0,
        individualSpeeds: [],
        teamSpeeds: [],
        allSpeeds: [],
        tss: 0,
        tssSessions: 0,
        duration: 0,
        attendanceDenominator: 0,
        attended: 0,
        types: new Map(),
        eventTypes: new Map(),
        categories: new Map(),
        combinations: new Map()
      })
    }

    const acc = groups.get(month)
    const metric = sessionMetricFromRows(rows)
    acc.sessions += 1
    acc.distance += metric.distanceKm
    acc.duration += metric.durationMinutes
    if (metric.averageSpeedKmh > 0) acc.allSpeeds.push(metric.averageSpeedKmh)
    if (metric.tss > 0) {
      acc.tss += metric.tss
      acc.tssSessions += 1
    }

    const teamRows = rows.filter(row => Boolean(row?.team_id) || isTeamParticipant(row, context))
    const individual = rows.filter(row => isIndividualParticipant(row, context))

    if (teamRows.length) {
      acc.teamSessions.add(key)
      const teamMetric = sessionMetricFromRows(teamRows)
      acc.teamDistance += teamMetric.distanceKm
      if (teamMetric.averageSpeedKmh > 0) acc.teamSpeeds.push(teamMetric.averageSpeedKmh)
    }
    if (individual.length) {
      acc.individualSessions.add(key)
      // Individual distance is deliberately the sum of individual records.
      // Team distance above is session-level to avoid double-counting tandem members.
      acc.individualDistance += individual.reduce((total, row) => total + effectiveDistance(row), 0)
      const individualSpeed = average(individual.map(effectiveSpeed).filter(value => value > 0))
      if (individualSpeed > 0) acc.individualSpeeds.push(individualSpeed)
    }

    const states = rows.map(attendanceState)
    for (const state of states) {
      if (state.denominator) acc.attendanceDenominator += 1
      if (state.attended) acc.attended += 1
    }

    const event = getEvent(sample)
    const typeName = event?.event_type_master?.event_type_name || 'Unclassified'
    const categoryName = event?.event_category_master?.category_name || 'Unclassified'
    const sessionType = cleanText(sample?.session_type) || 'Unclassified'
    const combination = `${sessionType} / ${typeName} / ${categoryName}`
    acc.types.set(sessionType, (acc.types.get(sessionType) || 0) + 1)
    acc.eventTypes.set(typeName, (acc.eventTypes.get(typeName) || 0) + 1)
    acc.categories.set(categoryName, (acc.categories.get(categoryName) || 0) + 1)
    acc.combinations.set(combination, (acc.combinations.get(combination) || 0) + 1)
  }

  const months = [...groups.values()].sort((a, b) => a.month.localeCompare(b.month))
  let cumulativeDistance = 0
  let cumulativeIndividualDistance = 0
  let cumulativeTeamDistance = 0

  return months.map((acc, index) => {
    cumulativeDistance += acc.distance
    cumulativeIndividualDistance += acc.individualDistance
    cumulativeTeamDistance += acc.teamDistance
    const previous = index ? months[index - 1] : null
    const avgSpeed = average(acc.allSpeeds)
    const previousSpeed = previous ? average(previous.allSpeeds) : 0

    return {
      month: acc.month,
      monthLabel: monthLabel(acc.month),
      sessions: acc.sessions,
      individualSessions: acc.individualSessions.size,
      teamSessions: acc.teamSessions.size,
      totalDistanceKm: round(acc.distance, 2),
      individualDistanceKm: round(acc.individualDistance, 2),
      teamDistanceKm: round(acc.teamDistance, 2),
      cumulativeDistanceKm: round(cumulativeDistance, 2),
      cumulativeIndividualDistanceKm: round(cumulativeIndividualDistance, 2),
      cumulativeTeamDistanceKm: round(cumulativeTeamDistance, 2),
      averageSpeedKmh: round(avgSpeed, 2),
      individualAverageSpeedKmh: round(average(acc.individualSpeeds), 2),
      teamAverageSpeedKmh: round(average(acc.teamSpeeds), 2),
      distanceGrowthPct: previous && previous.distance > 0 ? percentage(acc.distance - previous.distance, previous.distance) : null,
      speedGrowthPct: previousSpeed > 0 ? percentage(avgSpeed - previousSpeed, previousSpeed) : null,
      sessionsGrowthPct: previous && previous.sessions > 0 ? percentage(acc.sessions - previous.sessions, previous.sessions) : null,
      totalTss: round(acc.tss, 1),
      tssSessions: acc.tssSessions,
      totalDurationMinutes: round(acc.duration, 1),
      attendanceRate: percentage(acc.attended, acc.attendanceDenominator),
      sessionTypes: Object.fromEntries(acc.types),
      eventTypes: Object.fromEntries(acc.eventTypes),
      eventCategories: Object.fromEntries(acc.categories),
      classifications: Object.fromEntries(acc.combinations)
    }
  })
}

function buildClassificationRows(monthly) {
  const rows = []
  for (const month of monthly) {
    for (const [classification, sessions] of Object.entries(month.classifications || {})) {
      const [sessionType = '', eventType = '', eventCategory = ''] = classification.split(' / ')
      rows.push({
        month: month.month,
        monthLabel: month.monthLabel,
        sessionType,
        eventType,
        eventCategory,
        sessions
      })
    }
  }
  return rows
}

function buildDimensionStats(records, context, dimension) {
  const sessionGroups = rowsByLogicalSession(records)
  const groups = new Map()

  for (const [key, rows] of sessionGroups) {
    const sample = rows[0]
    const event = getEvent(sample)
    const instance = getEventInstance(sample)
    let label = 'Unclassified'

    if (dimension === 'eventType') label = event?.event_type_master?.event_type_name || 'Unclassified'
    else if (dimension === 'eventCategory') label = event?.event_category_master?.category_name || 'Unclassified'
    else if (dimension === 'eventArea') label = instance?.event_area || 'Unspecified'
    else if (dimension === 'county') label = instance?.county_master?.county_name || 'Unspecified'
    else if (dimension === 'subcounty') label = instance?.subcounty_master?.subcounty_name || 'Unspecified'
    else if (dimension === 'town') label = instance?.town_master?.town_name || 'Unspecified'
    else if (dimension === 'sessionType') label = cleanText(sample?.session_type) || 'Unclassified'

    if (!groups.has(label)) {
      groups.set(label, {
        label,
        sessions: 0,
        participants: new Set(),
        distance: 0,
        speeds: [],
        tss: [],
        attendanceDenominator: 0,
        attended: 0
      })
    }

    const acc = groups.get(label)
    const metric = sessionMetricFromRows(rows)
    acc.sessions += 1
    acc.distance += metric.distanceKm
    if (metric.averageSpeedKmh > 0) acc.speeds.push(metric.averageSpeedKmh)
    if (metric.tss > 0) acc.tss.push(metric.tss)

    for (const row of rows) {
      const participantId = getParticipantRegistry(row)?.participant_ref_id || resolveAthleteId(row, context) || resolveTeamId(row, context)
      if (participantId) acc.participants.add(participantId)
      const status = attendanceState(row)
      if (status.denominator) acc.attendanceDenominator += 1
      if (status.attended) acc.attended += 1
    }
  }

  return [...groups.values()]
    .map(acc => ({
      label: acc.label,
      sessions: acc.sessions,
      participants: acc.participants.size,
      totalDistanceKm: round(acc.distance, 2),
      averageDistanceKm: round(acc.sessions ? acc.distance / acc.sessions : 0, 2),
      averageSpeedKmh: round(average(acc.speeds), 2),
      totalTss: round(sum(acc.tss), 1),
      averageTss: round(average(acc.tss), 1),
      attendanceRate: percentage(acc.attended, acc.attendanceDenominator)
    }))
    .sort((a, b) => b.sessions - a.sessions || b.totalDistanceKm - a.totalDistanceKm)
}

function buildRegisteredAttendance(records, context) {
  const registrations = context.participantInstances || []
  const registrationsByEventInstance = new Map()
  for (const item of registrations) {
    const eventInstanceId = item.event_instance_id
    if (!eventInstanceId) continue
    pushMapArray(registrationsByEventInstance, eventInstanceId, item)
  }

  const rows = []
  const sessions = rowsByLogicalSession(records)
  for (const [key, sessionRows] of sessions) {
    const sample = sessionRows[0]
    const eventInstanceId = sample?.event_instance_id || sample?.participant_instances?.event_instance_id || getEventInstance(sample)?.event_instance_id
    if (!eventInstanceId) continue

    const registered = registrationsByEventInstance.get(eventInstanceId) || []
    const expectedIds = new Set(registered.map(item => item.participant_ref_id).filter(Boolean))
    const recordedIds = new Set()
    let attended = 0
    let absent = 0
    let excused = 0

    for (const row of sessionRows) {
      const ref = getParticipantRegistry(row)?.participant_ref_id || row?.participant_instances?.participant_ref_id
      if (ref) recordedIds.add(ref)
      const status = attendanceState(row)
      if (status.attended) attended += 1
      else if (status.state === 'Absent') absent += 1
      else if (status.state === 'Excused') excused += 1
    }

    const expected = expectedIds.size
    const recorded = [...recordedIds].filter(id => expectedIds.has(id)).length
    rows.push({
      sessionKey: key,
      date: sample?.training_date || '',
      week: isoWeekKey(sample?.training_date),
      month: monthKey(sample?.training_date),
      eventInstanceId,
      event: getEvent(sample)?.event_name || '',
      eventArea: getEventInstance(sample)?.event_area || '',
      sessionType: sample?.session_type || '',
      registered: expected,
      attendanceRecords: recorded,
      coveragePct: percentage(recorded, expected),
      attended,
      absent,
      excused
    })
  }

  return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

function buildDemographics(context) {
  const activeRegistries = (context.participantRegistry || []).filter(item => item.is_active !== false)
  const registeredIndividualSourceIds = new Set()
  const registeredTeamSourceIds = new Set()

  for (const registry of activeRegistries) {
    const code = cleanText(registry?.participant_type_master?.participant_type_code || registry?.participant_type_master?.participant_type_name).toUpperCase()
    if (code.includes('TEAM') || context.teamById?.has(registry.source_id)) registeredTeamSourceIds.add(registry.source_id)
    else if (code.includes('ATHLETE') || code.includes('INDIVIDUAL') || context.athleteById?.has(registry.source_id)) registeredIndividualSourceIds.add(registry.source_id)
  }

  // If participant_registry is not populated for all historical entities, counts still remain explicitly labelled as registered.
  const registeredAthletes = (context.athletes || []).filter(item => registeredIndividualSourceIds.has(item.athlete_id))
  const ages = registeredAthletes.map(item => ageOnDate(item.dob)).filter(value => Number.isFinite(value))
  const ageRows = registeredAthletes
    .map(item => ({
      name: `${item.first_name || ''} ${item.last_name || ''}`.trim(),
      age: ageOnDate(item.dob)
    }))
    .filter(item => Number.isFinite(item.age))
    .sort((a, b) => a.age - b.age)

  const genderCounts = {}
  for (const athlete of registeredAthletes) {
    const gender = athlete.gender || 'Unspecified'
    genderCounts[gender] = (genderCounts[gender] || 0) + 1
  }

  return {
    registeredIndividuals: registeredIndividualSourceIds.size,
    registeredTeams: registeredTeamSourceIds.size,
    athletesWithDemographics: registeredAthletes.length,
    genderCounts,
    meanAge: round(average(ages), 1),
    youngest: ageRows[0] || null,
    oldest: ageRows[ageRows.length - 1] || null,
    totalAthletesInRegistryTable: (context.athletes || []).length,
    totalTeamsInTeamsTable: (context.teams || []).length
  }
}

function buildAthleteGeography(context) {
  const rows = []
  const registeredSourceIds = new Set(
    (context.participantRegistry || [])
      .filter(item => item.is_active !== false)
      .map(item => item.source_id)
  )

  const groups = new Map()
  for (const athlete of context.athletes || []) {
    if (registeredSourceIds.size && !registeredSourceIds.has(athlete.athlete_id)) continue
    const country = athlete?.county_master?.country_master?.country_name || 'Unspecified'
    const county = athlete?.county_master?.county_name || 'Unspecified'
    const subcounty = athlete?.subcounty_master?.subcounty_name || 'Unspecified'
    const town = athlete?.town_master?.town_name || 'Unspecified'
    const key = `${country}|${county}|${subcounty}|${town}`
    if (!groups.has(key)) groups.set(key, { country, county, subcounty, town, individuals: 0 })
    groups.get(key).individuals += 1
  }
  rows.push(...groups.values())
  return rows.sort((a, b) => b.individuals - a.individuals)
}

function buildStaffStats(context) {
  const staff = (context.staff || []).filter(item => !item.deleted_at)
  const active = staff.filter(item => item.is_active !== false)
  const ages = active.map(item => ageOnDate(item.dob)).filter(Number.isFinite)
  const roles = new Map()
  const genders = new Map()
  const counties = new Map()

  for (const item of active) {
    const role = item?.role_master?.role_name || item?.role_master?.role_code || 'Unspecified'
    roles.set(role, (roles.get(role) || 0) + 1)
    const gender = item.gender || 'Unspecified'
    genders.set(gender, (genders.get(gender) || 0) + 1)
    const county = item?.county_master?.county_name || 'Unspecified'
    counties.set(county, (counties.get(county) || 0) + 1)
  }

  const activeAssignments = (context.staffAssignments || []).filter(item => item.is_active !== false && !item.end_date)
  const assignedStaff = new Set(activeAssignments.map(item => item.staff_id).filter(Boolean))
  const assignedTeams = new Set(activeAssignments.map(item => item.team_id).filter(Boolean))

  return {
    total: staff.length,
    active: active.length,
    inactive: staff.length - active.length,
    averageAge: round(average(ages), 1),
    roles: [...roles.entries()].map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count),
    genders: [...genders.entries()].map(([gender, count]) => ({ gender, count })).sort((a, b) => b.count - a.count),
    counties: [...counties.entries()].map(([county, count]) => ({ county, count })).sort((a, b) => b.count - a.count),
    activeAssignments: activeAssignments.length,
    assignedStaff: assignedStaff.size,
    assignedTeams: assignedTeams.size,
    unassignedActiveStaff: Math.max(0, active.length - assignedStaff.size)
  }
}

function buildCompetitionStats(context) {
  const results = context.raceResults || []
  const medals = { Gold: 0, Silver: 0, Bronze: 0 }
  const speeds = []
  let totalDistance = 0
  const events = new Set()
  const teams = new Set()
  const individuals = new Set()

  for (const row of results) {
    if (row.event_id) events.add(row.event_id)
    if (row.team_id) teams.add(row.team_id)
    else {
      const id = row.participant_instance_id || row.athlete_id || row.participant_id
      if (id) individuals.add(id)
    }
    const speed = safeNumber(row.avg_speed_kmh)
    if (speed > 0) speeds.push(speed)
    totalDistance += safeNumber(row.distance_km)
    const medal = cleanText(row.medal)
    if (Object.hasOwn(medals, medal)) medals[medal] += 1
  }

  return {
    results: results.length,
    events: events.size,
    teamResults: teams.size,
    individualResults: individuals.size,
    averageSpeedKmh: round(average(speeds), 2),
    totalDistanceKm: round(totalDistance, 2),
    medals,
    rankings: (context.rankings || []).length
  }
}

function buildTrainingRankingTrend(context) {
  return (context.trainingRankings || [])
    .map(row => ({
      teamId: row.team_id,
      team: context.teamById?.get(row.team_id)?.team_name || context.teamById?.get(row.team_id)?.team_code || row.team_id,
      date: row.ranking_date,
      month: monthKey(row.ranking_date),
      attendanceScore: safeNumber(row.attendance_score),
      enduranceScore: safeNumber(row.endurance_score),
      performanceScore: safeNumber(row.performance_score),
      totalScore: safeNumber(row.total_score),
      distanceScore: safeNumber(row.distance_score),
      durationScore: safeNumber(row.duration_score),
      speedScore: safeNumber(row.speed_score),
      powerScore: safeNumber(row.power_score),
      cadenceScore: safeNumber(row.cadence_score),
      hrScore: safeNumber(row.hr_score),
      recoveryScore: safeNumber(row.recovery_score),
      rankingPosition: row.ranking_position ?? null
    }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

function buildInsights(analytics) {
  const insights = []
  const monthly = analytics.monthly || []
  const latest = monthly[monthly.length - 1]
  const previous = monthly[monthly.length - 2]

  if (latest) {
    insights.push(`${latest.monthLabel}: ${latest.sessions} distinct training sessions covering ${latest.totalDistanceKm.toFixed(2)} km at ${latest.averageSpeedKmh.toFixed(2)} km/h average speed.`)
  }

  if (latest && previous) {
    if (latest.sessionsGrowthPct !== null) {
      const direction = latest.sessionsGrowthPct > 0 ? 'increased' : latest.sessionsGrowthPct < 0 ? 'decreased' : 'was unchanged'
      insights.push(`Session volume ${direction} by ${Math.abs(latest.sessionsGrowthPct).toFixed(1)}% versus ${previous.monthLabel}.`)
    }
    if (latest.speedGrowthPct !== null) {
      const direction = latest.speedGrowthPct > 0 ? 'improved' : latest.speedGrowthPct < 0 ? 'declined' : 'was unchanged'
      insights.push(`Average speed ${direction} by ${Math.abs(latest.speedGrowthPct).toFixed(1)}% month to month; this describes the recorded sessions and is not a medical or injury-risk prediction.`)
    }
  }

  if (analytics.eventTypes?.[0]) {
    const top = analytics.eventTypes[0]
    insights.push(`${top.label} is the most frequently trained event type in the selected data (${top.sessions} sessions, ${top.totalDistanceKm.toFixed(2)} km).`)
  }

  if (analytics.eventAreas?.[0]) {
    const top = analytics.eventAreas[0]
    insights.push(`${top.label} has the highest recorded session count among event areas (${top.sessions} sessions).`)
  }

  const tssRecords = analytics.summary.tssRecords || 0
  const totalRecords = analytics.summary.records || 0
  const tssCoverage = percentage(tssRecords, totalRecords)
  if (totalRecords) {
    insights.push(`Training Stress Score is populated on ${tssCoverage.toFixed(1)}% of training records; where TSS is absent, load interpretation should rely on recorded distance/duration rather than a fabricated score.`)
  }

  const coverageRows = analytics.registeredAttendance || []
  if (coverageRows.length) {
    const averageCoverage = average(coverageRows.map(row => row.coveragePct))
    insights.push(`Attendance-record coverage averages ${averageCoverage.toFixed(1)}% against participants registered to the corresponding event instances; unrecorded registrations are kept separate from explicit absences.`)
  }

  if (analytics.demographics.registeredIndividuals && analytics.demographics.athletesWithDemographics < analytics.demographics.registeredIndividuals) {
    insights.push(`Age/gender statistics cover ${analytics.demographics.athletesWithDemographics} registered individuals with matching athlete records; unmatched registrations are not assigned invented demographics.`)
  }

  if (analytics.staff.total) {
    insights.push(`${analytics.staff.active} of ${analytics.staff.total} non-deleted staff records are active; ${analytics.staff.unassignedActiveStaff} active staff currently have no open team assignment in staff_assignments.`)
  }

  if (analytics.competition?.results) {
    insights.push(`${analytics.competition.results} race-result records are available across ${analytics.competition.events} event IDs, with ${analytics.competition.medals.Gold} gold, ${analytics.competition.medals.Silver} silver and ${analytics.competition.medals.Bronze} bronze results recorded.`)
  }

  return insights
}

export function buildTrainingAnalytics(records = [], rawContext = {}) {
  const context = rawContext.athleteById ? rawContext : buildContextMaps(rawContext)
  const all = metricAccumulator('Overall')
  for (const record of records) {
    const participantId = getParticipantRegistry(record)?.participant_ref_id || resolveAthleteId(record, context) || resolveTeamId(record, context)
    addRecordToAccumulator(all, record, participantId)
  }

  const analytics = {
    context,
    summary: finalizeAccumulator(all),
    individuals: buildIndividualStats(records, context),
    teams: buildTeamStats(records, context),
    weeklyAttendance: buildPeriodAttendance(records, isoWeekKey, context),
    monthlyAttendance: buildPeriodAttendance(records, monthKey, context),
    monthly: buildMonthlyStats(records, context),
    eventTypes: buildDimensionStats(records, context, 'eventType'),
    eventCategories: buildDimensionStats(records, context, 'eventCategory'),
    sessionTypes: buildDimensionStats(records, context, 'sessionType'),
    eventAreas: buildDimensionStats(records, context, 'eventArea'),
    counties: buildDimensionStats(records, context, 'county'),
    subcounties: buildDimensionStats(records, context, 'subcounty'),
    towns: buildDimensionStats(records, context, 'town'),
    registeredAttendance: buildRegisteredAttendance(records, context),
    demographics: buildDemographics(context),
    athleteGeography: buildAthleteGeography(context),
    staff: buildStaffStats(context),
    competition: buildCompetitionStats(context),
    trainingRankings: buildTrainingRankingTrend(context)
  }

  analytics.monthlyClassifications = buildClassificationRows(analytics.monthly)
  analytics.insights = buildInsights(analytics)
  return analytics
}

export function flattenTrainingRecord(record, context = {}) {
  const instance = getEventInstance(record)
  const event = getEvent(record)
  const performance = getPerformance(record)
  const participant = getParticipantRegistry(record)
  const program = getProgram(record, context)
  const teamId = resolveTeamId(record, context)
  const team = context.teamById?.get(teamId)
  const athleteId = resolveAthleteId(record, context)
  const athlete = context.athleteById?.get(athleteId)
  const attendance = attendanceState(record)

  return {
    training_date: record?.training_date || '',
    training_week: record?.training_week || isoWeekKey(record?.training_date),
    training_day: record?.training_day || '',
    session_type: record?.session_type || '',
    scope: isTeamParticipant(record, context) ? 'Team' : 'Individual',
    participant: getParticipantName(record, context),
    participant_type: participant?.participant_type_master?.participant_type_name || participant?.participant_type_master?.participant_type_code || '',
    athlete_code: athlete?.athlete_code || '',
    team: team?.team_name || team?.team_code || '',
    event: event?.event_name || '',
    event_type: event?.event_type_master?.event_type_name || '',
    event_category: event?.event_category_master?.category_name || '',
    event_area: instance?.event_area || '',
    program: program?.program_name || '',
    country: instance?.country_master?.country_name || '',
    county: instance?.county_master?.county_name || '',
    subcounty: instance?.subcounty_master?.subcounty_name || '',
    town: instance?.town_master?.town_name || '',
    distance_km: round(effectiveDistance(record), 2),
    duration_minutes: round(effectiveDuration(record), 1),
    avg_speed_kmh: round(effectiveSpeed(record), 2),
    max_speed_kmh: round(safeNumber(performance?.max_speed_kmh), 2),
    avg_watts: round(safeNumber(performance?.avg_watts), 1),
    max_watts: round(safeNumber(performance?.max_watts), 1),
    avg_cadence_rpm: round(safeNumber(performance?.avg_cadence_rpm), 1),
    max_cadence_rpm: round(safeNumber(performance?.max_cadence_rpm), 1),
    avg_heart_rate: round(safeNumber(performance?.avg_heart_rate), 1),
    max_heart_rate: round(safeNumber(performance?.max_heart_rate), 1),
    normalized_power: round(safeNumber(performance?.normalized_power), 1),
    training_stress_score: round(safeNumber(performance?.training_stress_score), 1),
    elevation_gain: round(safeNumber(performance?.elevation_gain), 1),
    attendance_status: attendance.state,
    indoor_session: record?.indoor_session ? 'Yes' : 'No',
    notes: record?.notes || ''
  }
}

export function buildOverallExportSheets(analytics, records = []) {
  const context = analytics.context
  const rawRows = records.map(record => flattenTrainingRecord(record, context))
  const summaryRows = [
    { metric: 'Training records', value: analytics.summary.records },
    { metric: 'Distinct sessions', value: analytics.summary.sessions },
    { metric: 'Total distance (km)', value: analytics.summary.totalDistanceKm },
    { metric: 'Average distance/session (km)', value: analytics.summary.averageDistanceKm },
    { metric: 'Average speed (km/h)', value: analytics.summary.averageSpeedKmh },
    { metric: 'Attendance rate (%)', value: analytics.summary.attendanceRate },
    { metric: 'Registered individuals', value: analytics.demographics.registeredIndividuals },
    { metric: 'Registered teams', value: analytics.demographics.registeredTeams },
    { metric: 'Active staff', value: analytics.staff.active },
    { metric: 'Race results', value: analytics.competition.results },
    { metric: 'Competition rankings', value: analytics.competition.rankings },
    { metric: 'Total TSS', value: analytics.summary.totalTss },
    { metric: 'TSS records', value: analytics.summary.tssRecords }
  ]

  const metricColumns = [
    { key: 'label', label: 'Name' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'totalDistanceKm', label: 'Total Distance KM' },
    { key: 'averageDistanceKm', label: 'Average Distance KM' },
    { key: 'averageSpeedKmh', label: 'Average Speed KM/H' },
    { key: 'attendanceRate', label: 'Attendance %' },
    { key: 'totalTss', label: 'Total TSS' },
    { key: 'averageTss', label: 'Average TSS' }
  ]

  return [
    {
      sheetName: 'Summary',
      columns: [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' }
      ],
      data: summaryRows
    },
    { sheetName: 'Individuals', columns: metricColumns, data: analytics.individuals },
    { sheetName: 'Teams', columns: metricColumns, data: analytics.teams },
    {
      sheetName: 'Demographics',
      columns: [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' }
      ],
      data: [
        { metric: 'Registered individuals', value: analytics.demographics.registeredIndividuals },
        { metric: 'Registered teams', value: analytics.demographics.registeredTeams },
        { metric: 'Individuals with demographics', value: analytics.demographics.athletesWithDemographics },
        { metric: 'Mean age', value: analytics.demographics.meanAge },
        { metric: 'Youngest', value: analytics.demographics.youngest ? `${analytics.demographics.youngest.name} (${analytics.demographics.youngest.age})` : '' },
        { metric: 'Oldest', value: analytics.demographics.oldest ? `${analytics.demographics.oldest.name} (${analytics.demographics.oldest.age})` : '' },
        ...Object.entries(analytics.demographics.genderCounts || {}).map(([gender, value]) => ({ metric: `Gender: ${gender}`, value }))
      ]
    },
    {
      sheetName: 'Monthly',
      columns: [
        { key: 'month', label: 'Month' },
        { key: 'sessions', label: 'Sessions' },
        { key: 'individualSessions', label: 'Individual Sessions' },
        { key: 'teamSessions', label: 'Team Sessions' },
        { key: 'totalDistanceKm', label: 'Total Distance KM' },
        { key: 'averageSpeedKmh', label: 'Average Speed KM/H' },
        { key: 'attendanceRate', label: 'Attendance %' },
        { key: 'totalTss', label: 'TSS' },
        { key: 'distanceGrowthPct', label: 'Distance MoM %' },
        { key: 'speedGrowthPct', label: 'Speed MoM %' },
        { key: 'sessionsGrowthPct', label: 'Sessions MoM %' },
        { key: 'cumulativeDistanceKm', label: 'Cumulative Distance KM' }
      ],
      data: analytics.monthly
    },
    {
      sheetName: 'Weekly Attendance',
      columns: [
        { key: 'label', label: 'Week' },
        { key: 'sessions', label: 'Sessions' },
        { key: 'attendanceRate', label: 'Attendance %' },
        { key: 'present', label: 'Present' },
        { key: 'late', label: 'Late' },
        { key: 'absent', label: 'Absent' },
        { key: 'excused', label: 'Excused' }
      ],
      data: analytics.weeklyAttendance
    },
    {
      sheetName: 'Monthly Attendance',
      columns: [
        { key: 'label', label: 'Month' },
        { key: 'sessions', label: 'Sessions' },
        { key: 'attendanceRate', label: 'Attendance %' },
        { key: 'present', label: 'Present' },
        { key: 'late', label: 'Late' },
        { key: 'absent', label: 'Absent' },
        { key: 'excused', label: 'Excused' }
      ],
      data: analytics.monthlyAttendance
    },
    {
      sheetName: 'Monthly Classification',
      columns: [
        { key: 'month', label: 'Month' },
        { key: 'sessionType', label: 'Session Type' },
        { key: 'eventType', label: 'Event Type' },
        { key: 'eventCategory', label: 'Event Category' },
        { key: 'sessions', label: 'Sessions' }
      ],
      data: analytics.monthlyClassifications
    },
    { sheetName: 'Event Areas', columns: metricColumns, data: analytics.eventAreas },
    { sheetName: 'Event Types', columns: metricColumns, data: analytics.eventTypes },
    { sheetName: 'Event Categories', columns: metricColumns, data: analytics.eventCategories },
    {
      sheetName: 'Attendance Coverage',
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'event', label: 'Event' },
        { key: 'eventArea', label: 'Event Area' },
        { key: 'sessionType', label: 'Session Type' },
        { key: 'registered', label: 'Registered' },
        { key: 'attendanceRecords', label: 'Attendance Records' },
        { key: 'coveragePct', label: 'Coverage %' },
        { key: 'attended', label: 'Attended' },
        { key: 'absent', label: 'Absent' },
        { key: 'excused', label: 'Excused' }
      ],
      data: analytics.registeredAttendance
    },
    {
      sheetName: 'Athlete Geography',
      columns: [
        { key: 'country', label: 'Country' },
        { key: 'county', label: 'County' },
        { key: 'subcounty', label: 'Subcounty' },
        { key: 'town', label: 'Town' },
        { key: 'individuals', label: 'Registered Individuals' }
      ],
      data: analytics.athleteGeography
    },
    {
      sheetName: 'Staff',
      columns: [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' }
      ],
      data: [
        { metric: 'Total staff', value: analytics.staff.total },
        { metric: 'Active staff', value: analytics.staff.active },
        { metric: 'Inactive staff', value: analytics.staff.inactive },
        { metric: 'Average age', value: analytics.staff.averageAge },
        { metric: 'Active assignments', value: analytics.staff.activeAssignments },
        { metric: 'Assigned teams', value: analytics.staff.assignedTeams },
        { metric: 'Unassigned active staff', value: analytics.staff.unassignedActiveStaff }
      ]
    },
    {
      sheetName: 'Staff Roles',
      columns: [
        { key: 'role', label: 'Role' },
        { key: 'count', label: 'Active Staff' }
      ],
      data: analytics.staff.roles || []
    },
    {
      sheetName: 'Staff Geography',
      columns: [
        { key: 'county', label: 'County' },
        { key: 'count', label: 'Active Staff' }
      ],
      data: analytics.staff.counties || []
    },
    {
      sheetName: 'Competition Summary',
      columns: [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' }
      ],
      data: [
        { metric: 'Race results', value: analytics.competition.results },
        { metric: 'Event IDs represented', value: analytics.competition.events },
        { metric: 'Teams with results', value: analytics.competition.teamResults },
        { metric: 'Individuals with results', value: analytics.competition.individualResults },
        { metric: 'Average result speed KM/H', value: analytics.competition.averageSpeedKmh },
        { metric: 'Result distance KM', value: analytics.competition.totalDistanceKm },
        { metric: 'Gold', value: analytics.competition.medals.Gold },
        { metric: 'Silver', value: analytics.competition.medals.Silver },
        { metric: 'Bronze', value: analytics.competition.medals.Bronze },
        { metric: 'Rankings records', value: analytics.competition.rankings }
      ]
    },
    {
      sheetName: 'Training Rankings',
      columns: [
        { key: 'date', label: 'Date' },
        { key: 'team', label: 'Team' },
        { key: 'rankingPosition', label: 'Position' },
        { key: 'totalScore', label: 'Total Score' },
        { key: 'attendanceScore', label: 'Attendance Score' },
        { key: 'enduranceScore', label: 'Endurance Score' },
        { key: 'performanceScore', label: 'Performance Score' },
        { key: 'distanceScore', label: 'Distance Score' },
        { key: 'speedScore', label: 'Speed Score' },
        { key: 'powerScore', label: 'Power Score' },
        { key: 'cadenceScore', label: 'Cadence Score' },
        { key: 'hrScore', label: 'HR Score' },
        { key: 'recoveryScore', label: 'Recovery Score' }
      ],
      data: analytics.trainingRankings
    },
    {
      sheetName: 'Training Data',
      columns: [
        { key: 'training_date', label: 'Training Date' },
        { key: 'training_week', label: 'Week' },
        { key: 'training_day', label: 'Day' },
        { key: 'scope', label: 'Scope' },
        { key: 'participant', label: 'Participant' },
        { key: 'team', label: 'Team' },
        { key: 'event', label: 'Event' },
        { key: 'event_type', label: 'Event Type' },
        { key: 'event_category', label: 'Event Category' },
        { key: 'event_area', label: 'Event Area' },
        { key: 'program', label: 'Program' },
        { key: 'county', label: 'County' },
        { key: 'subcounty', label: 'Subcounty' },
        { key: 'town', label: 'Town' },
        { key: 'session_type', label: 'Session Type' },
        { key: 'distance_km', label: 'Distance KM' },
        { key: 'duration_minutes', label: 'Duration Minutes' },
        { key: 'avg_speed_kmh', label: 'Average Speed KM/H' },
        { key: 'avg_watts', label: 'Average Watts' },
        { key: 'normalized_power', label: 'Normalized Power' },
        { key: 'training_stress_score', label: 'TSS' },
        { key: 'elevation_gain', label: 'Elevation Gain' },
        { key: 'attendance_status', label: 'Attendance' },
        { key: 'indoor_session', label: 'Indoor' }
      ],
      data: rawRows
    }
  ]
}
