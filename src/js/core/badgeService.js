// =====================================================
// BADGE SERVICE
// =====================================================

export function getStatusBadge(
  status
) {

  switch (
    String(status || '')
      .trim()
      .toLowerCase()
  ) {

    case 'active':
      return '<span class="badge bg-success">Active</span>'

    case 'inactive':
      return '<span class="badge bg-warning">Inactive</span>'

    case 'disabled':
      return '<span class="badge bg-danger">Disabled</span>'

    default:
      return status || ''
  }

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


