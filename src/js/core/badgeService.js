

// =====================================================
// BADGE SERVICE
// =====================================================

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

export function getStatusConfig(
  statusCode
) {

  return (
    STATUS_CONFIG[
      String(
        statusCode || ''
      )
        .trim()
        .toUpperCase()
    ] || {
      color: 'secondary'
    }
  )

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


export function getAttendanceBadge(
  status
) {

  switch (
    String(status || '')
      .trim()
      .toUpperCase()
  ) {

    case 'PRESENT':
      return '<span class="badge bg-success">Present</span>'

    case 'ABSENT':
      return '<span class="badge bg-danger">Absent</span>'

    case 'LATE':
      return '<span class="badge bg-warning">Late</span>'

    default:
      return status || ''
  }

}

export function getEventStatusBadge(
  status
) {

  switch (
    String(status || '')
      .trim()
      .toUpperCase()
  ) {

    case 'OPEN':
      return '<span class="badge bg-primary">Open</span>'

    case 'ONGOING':
      return '<span class="badge bg-success">Ongoing</span>'

    case 'COMPLETED':
      return '<span class="badge bg-dark">Completed</span>'

    case 'CANCELLED':
      return '<span class="badge bg-danger">Cancelled</span>'

    default:
      return status || ''
  }

}

export function getPerformanceBadge(
  value
) {

  return `
    <span class="badge bg-info">
      ${value || ''}
    </span>
  `

}

export function getRoleBadge(
  roleCode
) {

  switch (
    String(
      roleCode || ''
    ).toUpperCase()
  ) {

    case 'PILOT':
      return `
        <span class="badge bg-primary">
          Pilot
        </span>
      `

    case 'STOKER':
      return `
        <span class="badge bg-success">
          Stoker
        </span>
      `

    default:
      return `
        <span class="badge bg-secondary">
          ${roleCode || ''}
        </span>
      `
  }

}

export function getActiveBadge(
  active
) {

  return active
    ? `
      <span class="badge bg-success">
        Active
      </span>
    `
    : `
      <span class="badge bg-secondary">
        Inactive
      </span>
    `

}

export function getRankingBadge(
  position
) {

  if (position === 1) {

    return `
      <span class="badge bg-warning">
        #1
      </span>
    `

  }

  return `
    <span class="badge bg-info">
      #${position}
    </span>
  `

}

export function getParticipantStatusBadge(
  status
) {

  const value =
    String(
      status || ''
    )
      .trim()
      .toUpperCase()

  switch (
    value
  ) {

    case 'REGISTERED':
      return `
        <span class="badge bg-primary">
          Registered
        </span>
      `

    case 'CONFIRMED':
      return `
        <span class="badge bg-success">
          Confirmed
        </span>
      `

    case 'ATTENDED':
      return `
        <span class="badge bg-info">
          Attended
        </span>
      `

    case 'COMPLETED':
      return `
        <span class="badge bg-dark">
          Completed
        </span>
      `

    case 'CANCELLED':
      return `
        <span class="badge bg-danger">
          Cancelled
        </span>
      `

    default:
      return getGenericBadge(
        status
      )

  }

}

export function getGenericBadge(
  value,

  color =
    'secondary'
) {

  return `
    <span
      class="badge bg-${color}"
    >
      ${value || ''}
    </span>
  `

}


