import {
  escapeHtml
} from './formattingService.js'

export const STATUS_CONFIG =
  Object.freeze({
    ACTIVE: { color: 'success' },
    DEACTIVATED: { color: 'danger' },
    INACTIVE: { color: 'secondary' },
    SUSPENDED: { color: 'warning' },
    ON_LEAVE: { color: 'warning' },
    TERMINATED: { color: 'danger' },
    DISBANDED: { color: 'danger' },
    EXPIRED: { color: 'secondary' },

    UPCOMING: { color: 'info' },
    PLANNED: { color: 'secondary' },
    OPEN: { color: 'primary' },
    ONGOING: { color: 'success' },
    COMPLETED: { color: 'secondary' },
    CANCELLED: { color: 'danger' },
    RESCHEDULED: { color: 'warning' },

    AVAILABLE: { color: 'success' },
    ASSIGNED: { color: 'primary' },
    UNDER_MAINTENANCE: { color: 'warning' },
    RETIRED: { color: 'secondary' },

    PRESENT: { color: 'success' },
    ABSENT: { color: 'danger' },
    LATE: { color: 'warning' },
    ABSENT_WITH_APOLOGY: { color: 'warning' },
    ABSENT_WITHOUT_APOLOGY: { color: 'danger' },

    FINISHED: { color: 'success' },
    DNF: { color: 'warning' },
    DNS: { color: 'secondary' },
    DISQUALIFIED: { color: 'danger' },
    DISCONTINUED: { color: 'dark' },

    REGISTERED: { color: 'primary' },
    CONFIRMED: { color: 'success' },
    APPROVED: { color: 'info' },
    REJECTED: { color: 'danger' },
    WITHDRAWN: { color: 'warning' }
  })

export function normalizeStatusCode(
  statusCode
) {
  return String(
    statusCode || ''
  )
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
}

export function getStatusConfig(
  statusCode
) {
  return (
    STATUS_CONFIG[
      normalizeStatusCode(
        statusCode
      )
    ] || {
      color: 'secondary'
    }
  )
}

export function getStatusBadge(
  statusName,
  statusCode = statusName
) {
  const code =
    normalizeStatusCode(
      statusCode
    )

  const config =
    getStatusConfig(code)

  const statusClass =
    code ?
      `status-${code
        .toLowerCase()
        .replace(/_/g, '-')}` :
      'status-unknown'

  return `
    <span
      class="badge federation-status ${statusClass} bg-${config.color}"
    >
      ${escapeHtml(statusName || '')}
    </span>
  `
}

export function isActiveStatus(
  statusCode
) {
  return [
    'ACTIVE',
    'OPEN',
    'ONGOING',
    'AVAILABLE',
    'CONFIRMED',
    'APPROVED',
    'REGISTERED',
    'PRESENT'
  ].includes(
    normalizeStatusCode(
      statusCode
    )
  )
}

export function isClosedStatus(
  statusCode
) {
  return [
    'COMPLETED',
    'CANCELLED',
    'DISQUALIFIED',
    'DNF',
    'DNS',
    'DISCONTINUED',
    'EXPIRED',
    'DISBANDED',
    'TERMINATED',
    'REJECTED',
    'WITHDRAWN'
  ].includes(
    normalizeStatusCode(
      statusCode
    )
  )
}
