import {
  getCurrentRole,
  getCurrentProfile
}
  from '../auth/authService.js'

document.addEventListener(
  'DOMContentLoaded',
  loadDashboard
)

async function loadDashboard() {
  await loadAthletes()

  await loadTeams()

  await loadEvents()

  await loadTraining()

  await loadPerformance()

  await loadCompetition()

  await loadDocuments()

  await loadStaff()
}

function isAthleteRole() {
  const role =
    getCurrentRole()

  return (
    role?.role_code ===
    'ATHLETE'
  )
}

async function loadAthletes() {
  const profile =
    getCurrentProfile()

  let query =
    window.supabaseClient
      .from('athletes')
      .select('*', {
        count: 'exact',
        head: true
      })

  if (
    isAthleteRole() &&
    profile &&
    profile.athlete_id
  ) {
    query =
      query.eq(
        'athlete_id',
        profile.athlete_id
      )
  }

  const {
    count,
    error
  } =
  await query

  if (error) {
    console.error(error)
    return
  }

  document.getElementById(
    'totalAthletes'
  ).textContent = count
}

async function loadTeams() {
  const profile =
    getCurrentProfile()

  let query =
    window.supabaseClient
      .from(
        'team_members'
      )
      .select('*', {
        count: 'exact',
        head: true
      })

  query = isAthleteRole() &&
    profile?.athlete_id ?
    query.eq(
      'athlete_id',
      profile.athlete_id
    ) :
    window.supabaseClient
        .from(
          'teams'
        )
        .select('*', {
          count: 'exact',
          head: true
        })

  const {
    count,
    error
  } =
    await query

  if (error) {
    return
  }

  document.getElementById(
    'totalTeams'
  ).textContent =
    count || 0
}

async function loadEvents() {
  const { count, error } =
    await window.supabaseClient
      .from('events')
      .select('*', {
        count: 'exact',
        head: true
      })

  if (error) {
    console.error(error)
    return
  }

  document.getElementById(
    'totalEvents'
  ).textContent = count
}

async function loadTraining() {
  const profile =
    getCurrentProfile()

  let query =
    window.supabaseClient
      .from(
        'training_log'
      )
      .select('*', {
        count: 'exact',
        head: true
      })

  if (
    isAthleteRole() &&
    profile?.athlete_id
  ) {
    query =
      query.eq(
        'athlete_id',
        profile.athlete_id
      )
  }

  const {
    count,
    error
  } =
    await query

  if (error) {
    return
  }

  document.getElementById(
    'totalTraining'
  ).textContent =
    count || 0
}

async function loadPerformance() {
  const profile =
    getCurrentProfile()

  let query =
    window.supabaseClient
      .from(
        'performance'
      )
      .select('*', {
        count: 'exact',
        head: true
      })

  if (
    isAthleteRole() &&
    profile &&
    profile.athlete_id
  ) {
    query =
      query.eq(
        'athlete_id',
        profile.athlete_id
      )
  }

  const {
    count,
    error
  } =
    await query

  if (error) {
    console.error(error)

    return
  }

  const element =
    document.getElementById(
      'totalPerformance'
    )

  if (element) {
    element.textContent =
      count || 0
  }
}

async function loadCompetition() {
  const profile =
    getCurrentProfile()

  let query =
    window.supabaseClient
      .from(
        'race_results'
      )
      .select('*', {
        count: 'exact',
        head: true
      })

  if (
    isAthleteRole() &&
    profile &&
    profile.athlete_id
  ) {
    query =
      query.eq(
        'athlete_id',
        profile.athlete_id
      )
  }

  const {
    count,
    error
  } =
    await query

  if (error) {
    console.error(error)

    return
  }

  const element =
    document.getElementById(
      'totalCompetitions'
    )

  if (element) {
    element.textContent =
      count || 0
  }
}

async function loadDocuments() {
  const profile =
    getCurrentProfile()

  let query =
    window.supabaseClient
      .from(
        'documents'
      )
      .select('*', {
        count: 'exact',
        head: true
      })

  if (
    isAthleteRole() &&
    profile?.athlete_id
  ) {
    query =
      query.eq(
        'athlete_id',
        profile.athlete_id
      )
  }

  const {
    count,
    error
  } =
    await query

  if (error) {
    return
  }

  const element =
    document.getElementById(
      'totalDocuments'
    )

  if (element) {
    element.textContent =
      count || 0
  }
}

async function loadStaff() {
  if (
    isAthleteRole()
  ) {
    const element =
      document.getElementById(
        'totalStaff'
      )

    if (element) {
      element.textContent =
        '0'
    }

    return
  }

  const {
    count,
    error
  } =
    await window.supabaseClient
      .from(
        'staff_registry'
      )
      .select('*', {
        count: 'exact',
        head: true
      })

  if (error) {
    return
  }

  const element =
    document.getElementById(
      'totalStaff'
    )

  if (element) {
    element.textContent =
      count || 0
  }
}
