// =====================================================
// STATUS SERVICE
// =====================================================

export const STATUS_CONFIG = {

  // ---------------------------------------------------
  // ATTENDANCE
  // ---------------------------------------------------

  ABSENT_WITH_APOLOGY: {
    color: 'warning'
  },

  ABSENT_WITHOUT_APOLOGY: {
    color: 'danger'
  },

  // ---------------------------------------------------
  // EQUIPMENT
  // ---------------------------------------------------

  AVAILABLE: {
    color: 'success'
  },

  ASSIGNED: {
    color: 'primary'
  },

  UNDER_MAINTENANCE: {
    color: 'warning'
  },

  RETIRED: {
    color: 'secondary'
  },

  // ---------------------------------------------------
  // EVENT MASTER
  // ---------------------------------------------------

  ACTIVE: {
    color: 'success'
  },

  DEACTIVATED: {
    color: 'danger'
  },

  // ---------------------------------------------------
  // EVENT STATUS
  // ---------------------------------------------------

  PLANNED: {
    color: 'secondary'
  },

  OPEN: {
    color: 'primary'
  },

  ONGOING: {
    color: 'success'
  },

  COMPLETED: {
    color: 'dark'
  },

  CANCELLED: {
    color: 'danger'
  },

  RESCHEDULED: {
    color: 'warning'
  },

  // ---------------------------------------------------
  // MEMBERSHIP
  // ---------------------------------------------------

  INACTIVE: {
    color: 'secondary'
  },

  SUSPENDED: {
    color: 'warning'
  },

  DISBANDED: {
    color: 'danger'
  },

  // ---------------------------------------------------
  // OUTCOMES
  // ---------------------------------------------------

  FINISHED: {
    color: 'success'
  },

  DNF: {
    color: 'warning'
  },

  DNS: {
    color: 'secondary'
  },

  DISQUALIFIED: {
    color: 'danger'
  },

  DISCONTINUED: {
    color: 'dark'
  },

  // ---------------------------------------------------
  // REGISTRATION
  // ---------------------------------------------------

  REGISTERED: {
    color: 'primary'
  },

  CONFIRMED: {
    color: 'success'
  },

  APPROVED: {
    color: 'info'
  },

  REJECTED: {
    color: 'danger'
  },

  WITHDRAWN: {
    color: 'warning'
  },

  // ---------------------------------------------------
  // TEAM
  // ---------------------------------------------------

  EXPIRED: {
    color: 'secondary'
  }

}

export function getStatusBadge(
  statusName,
  statusCode = statusName
) {

  const config =
    getStatusConfig(
      statusCode
    )

  return `
    <span
      class="badge bg-${config.color}"
    >
      ${statusName || ''}
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
    'REGISTERED'

  ].includes(
    String(
      statusCode
    ).toUpperCase()
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
    'DISBANDED'

  ].includes(
    String(
      statusCode
    ).toUpperCase()
  )

}

