import {
  STATUS_CONFIG,
  normalizeStatusCode,
  getStatusConfig,
  getStatusBadge,
  isActiveStatus,
  isClosedStatus
} from './statusService.js'
import {
  escapeHtml
} from './formattingService.js'

export {
  STATUS_CONFIG,
  normalizeStatusCode,
  getStatusConfig,
  getStatusBadge,
  isActiveStatus,
  isClosedStatus
}

export function getAttendanceBadge(
  status
) {
  const code =
    normalizeStatusCode(status)

  const labels = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    ABSENT_WITH_APOLOGY:
      'Absent With Apology',
    ABSENT_WITHOUT_APOLOGY:
      'Absent Without Apology'
  }

  return getStatusBadge(
    labels[code] || status || '',
    code
  )
}

export function getEventStatusBadge(
  status
) {
  return getStatusBadge(
    status || '',
    status
  )
}

export function getPerformanceBadge(
  value
) {
  return `
    <span class="badge bg-info federation-status">
      ${escapeHtml(value || '')}
    </span>
  `
}

export function getRoleBadge(
  roleCode
) {
  const code =
    normalizeStatusCode(
      roleCode
    )

  const color =
    code === 'PILOT' ?
      'primary' :
      code === 'STOKER' ?
        'success' :
        'secondary'

  const label =
    code === 'PILOT' ?
      'Pilot' :
      code === 'STOKER' ?
        'Stoker' :
        roleCode || ''

  return `
    <span class="badge bg-${color} federation-status">
      ${escapeHtml(label)}
    </span>
  `
}

export function getActiveBadge(
  active
) {
  return getStatusBadge(
    active ? 'Active' : 'Inactive',
    active ? 'ACTIVE' : 'INACTIVE'
  )
}

export function getRankingBadge(
  position
) {
  const color =
    Number(position) === 1 ?
      'warning' :
      'info'

  return `
    <span class="badge bg-${color} federation-status">
      #${escapeHtml(position ?? '')}
    </span>
  `
}

export function getParticipantStatusBadge(
  status
) {
  return getStatusBadge(
    status || '',
    status
  )
}

export function getGenericBadge(
  value,
  color = 'secondary'
) {
  return `
    <span class="badge bg-${color} federation-status">
      ${escapeHtml(value || '')}
    </span>
  `
}
