import {
  getCurrentProfile,
  getCurrentRole
}
from './core/auth/authService.js'

import {
  initializeAuthentication
}
from './core/auth/authInitializer.js'

import {
  initializeProfilePhotoUpload
}
from './core/profile/profilePhotoService.js'

import {
  getDb
}
from './core/supabase/getDb.js'

window.addEventListener(
  'unhandledrejection',
  event => {

    console.error(
      'FULL REJECTION',
      JSON.stringify(
        event.reason,
        null,
        2
      )
    )

    console.error(
      event.reason
    )

  }
)

document.addEventListener(
  'DOMContentLoaded',
  initializeProfile
)

async function initializeProfile() {

  try {

    await initializeAuthentication()

    while (
      !getCurrentProfile()
    ) {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            100
          )
      )

    }

  } catch (error) {

    console.error(
      'initializeAuthentication',
      error
    )

    return

  }

  await loadProfileHeader()

  const loaders = [

    [
      'loadAthleteProfile',
      loadAthleteProfile
    ],

    [
      'loadTeamSummary',
      loadTeamSummary
    ],

    [
      'loadTrainingSummary',
      loadTrainingSummary
    ],

    [
      'loadCompetitionSummary',
      loadCompetitionSummary
    ],

    [
      'loadRankingCard',
      loadRankingCard
    ],

    [
      'loadRecentTraining',
      loadRecentTraining
    ],

    [
      'loadRecentResults',
      loadRecentResults
    ],

    [
      'loadUpcomingEvents',
      loadUpcomingEvents
    ],

    [
      'loadRecentActivity',
      loadRecentActivity
    ],

    [
      'loadFederationSummary',
      loadFederationSummary
    ],

    [
      'loadTrainingAnalytics',
      loadTrainingAnalytics
    ],

    [
      'loadTrainingHistory',
      loadTrainingHistory
    ],

    [
      'loadCompetitionAnalytics',
      loadCompetitionAnalytics
    ],

    [
      'loadCompetitionHistory',
      loadCompetitionHistory
    ],

    [
      'loadRankingDashboard',
      loadRankingDashboard
    ],

    [
      'loadPerformanceAnalytics',
      loadPerformanceAnalytics
    ],

    [
      'loadCurrentTeamDashboard',
      loadCurrentTeamDashboard
    ]

  ]

  for (
    const [
      name,
      loader
    ]
    of loaders
  ) {

    try {

      await loader()

    } catch (error) {

      console.error(
        name,
        error
      )

    }

  }

  initializeProfilePhotoUpload()

}

async function loadProfileHeader() {
console.log(
  'LOAD PROFILE HEADER',
  getCurrentProfile()
)

console.log(
  'getCurrentProfile type',
  typeof getCurrentProfile
)

console.log(
  'getCurrentRole type',
  typeof getCurrentRole
)

console.log(
  'window.currentProfile',
  window.currentProfile
)

console.log(
  'window.profile',
  window.profile
)
  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const role =
    getCurrentRole()

    let lastLoginRecord =
    null

  try {

    const {
      data,
      error
    }
    =
      await getDb()
        .from(
          'login_history'
        )
        .select(
          'login_time'
        )
        .eq(
          'profile_id',
          profile.profile_id
        )
        .eq(
          'success',
          true
        )
        .order(
          'login_time',
          {
            ascending: false
          }
        )
        .limit(1)
        .maybeSingle()

    if (
      error
    ) {

      console.error(
        'login_history',
        error
      )

    } else {

      lastLoginRecord =
        data

    }

  } catch (error) {

    console.error(
      'login_history',
      error
    )

  }

  if (!profile) {
    return
  }

  const profilePageFullName =
  document.getElementById(
    'profilePageFullName'
  )

if (
  profilePageFullName
) {

  profilePageFullName.textContent =
    profile.full_name || ''

}

  const profilePageRole =
  document.getElementById(
    'profilePageRole'
  )

if (
  profilePageRole
) {

  profilePageRole.textContent =
    role?.role_name ||
    role?.role_code ||
    ''

}

  const fullName =
    document.getElementById(
      'fullName'
    )

  if (
    fullName
  ) {

    fullName.value =
      profile.full_name || ''

  }

  const email =
    document.getElementById(
      'email'
    )

  if (
    email
  ) {

    email.value =
      profile.email || ''

  }

  const roleCode =
    document.getElementById(
      'roleCode'
    )

  if (
    roleCode
  ) {

    roleCode.value =
      role?.role_name ||
      role?.role_code ||
      ''

  }

  const lastLogin =
    document.getElementById(
      'lastLogin'
    )

  if (
    lastLogin
  ) {

    lastLogin.value =
      lastLoginRecord
        ?.login_time || ''

  }

 if (
  profile.profile_photo_url
) {

  const profilePhoto =
    document.getElementById(
      'profilePhoto'
    )

  if (
    profilePhoto
  ) {

    profilePhoto.src =
      profile.profile_photo_url

  }

}

}

async function loadAthleteProfile() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'athletes'
      )
      .select(`
        *,
        classification_master(
          description,
          classification_code
        ),
        membership_status_master(
          status_name
        ),
        county_master(
          county_name
        )
      `)
      .eq(
        'athlete_id',
        profile.athlete_id
      )
      .maybeSingle()

  if (
    error ||
    !data
  ) {

    console.error(
      'loadAthleteProfile',
      error
    )

    return

  }

  setValue(
    'fullName',
    profile.full_name
  )

  setValue(
    'email',
    profile.email
  )

  setValue(
    'membershipSummary',
    data
      .membership_status_master
      ?.status_name
  )

  setValue(
    'classificationSummary',
    data
      .classification_master
      ?.description
  )

  const membershipBadge =
    document.getElementById(
      'membershipBadge'
    )

  if (
    membershipBadge
  ) {

    membershipBadge.textContent =
      data
        .membership_status_master
        ?.status_name || '-'

  }

  const classificationBadge =
    document.getElementById(
      'classificationBadge'
    )

  if (
    classificationBadge
  ) {

    classificationBadge.textContent =
      data
        .classification_master
        ?.classification_code ||
      data
        .classification_master
        ?.description ||
      '-'

  }

}
async function loadTeamSummary() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    data
  } =
    await getDb()
      .from(
        'team_members'
      )
      .select(`
        *,
        teams(
          team_name,
          team_code,
          status
        )
      `)
      .eq(
        'athlete_id',
        profile.athlete_id
      )
      .eq(
        'is_active',
        true
      )
      .limit(1)
      .maybeSingle()

  if (!data?.teams) {
    return
  }

  setValue(
    'activeTeamSummary',
    data.teams.team_name
  )

  const activeTeamBadge =
    document.getElementById(
      'activeTeamBadge'
    )

  if (
    activeTeamBadge
  ) {

    activeTeamBadge.textContent =
      data.teams.team_code || '-'

  }

}

async function loadTrainingSummary() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    count
  } =
    await getDb()
      .from(
        'training_log'
      )
      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      )
      .eq(
        'athlete_id',
        profile.athlete_id
      )

  const attendanceRate =
    document.getElementById(
      'attendanceRate'
    )

  if (
    attendanceRate
  ) {

    attendanceRate.textContent =
      `${count || 0}`

  }

}

async function loadCompetitionSummary() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    count
  } =
    await getDb()
      .from(
        'race_results'
      )
      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      )
      .eq(
        'athlete_id',
        profile.athlete_id
      )

  const competitionTotal =
    document.getElementById(
      'competitionTotal'
    )

  if (
    competitionTotal
  ) {

    competitionTotal.textContent =
      count || 0

  }

}

function setValue(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    )

  if (!element) {
    return
  }

  element.value =
    value || ''

} 

async function loadRecentTraining() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    data: athlete
  } =
    await getDb()
      .from(
        'athletes'
      )
      .select(
        'athlete_id'
      )
      .eq(
  'athlete_id',
  profile.athlete_id
)
      .maybeSingle()

  if (!athlete) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'training_log'
      )
      .select(`
        training_date,
        distance_km,
        duration_minutes,
        session_type
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )
      .order(
        'training_date',
        {
          ascending: false
        }
      )
      .limit(10)

  if (error) {
    throw error
  }

  const tbody =
    document.getElementById(
      'recentTrainingBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  for (const row of data || []) {

    tbody.innerHTML += `
      <tr>

        <td>
          ${row.training_date || ''}
        </td>

        <td>
          ${row.session_type || ''}
        </td>

        <td>
          ${row.distance_km || 0}
        </td>

        <td>
          ${row.duration_minutes || 0}
        </td>

      </tr>
    `
  }

}

async function loadRecentResults() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    data: athlete
  } =
    await getDb()
      .from(
        'athletes'
      )
      .select(
        'athlete_id'
      )
     .eq(
  'athlete_id',
  profile.athlete_id
)
      .maybeSingle()

  if (!athlete) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'race_results'
      )
      .select(`
        position,
        points,
        medal,
        event_instances(
          event_area
        )
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )
      .order(
        'changed_at',
        {
          ascending: false
        }
      )
      .limit(10)

  if (error) {
    throw error
  }

  const tbody =
    document.getElementById(
      'recentResultsBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  for (const row of data || []) {

    tbody.innerHTML += `
      <tr>

        <td>
          ${row.event_instances?.event_area || ''}
        </td>

        <td>
          ${row.position || ''}
        </td>

        <td>
          ${row.points || 0}
        </td>

        <td>
          ${row.medal || ''}
        </td>

      </tr>
    `
  }

}

async function loadRankingCard() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    data
  } =
    await getDb()
      .from(
        'rankings'
      )
      .select(`
        ranking_position,
        ranking_points
      `)
      .eq(
        'athlete_id',
        profile.athlete_id
      )
      .order(
        'changed_at',
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle()

  const currentRanking =
    document.getElementById(
      'currentRanking'
    )

  if (
    currentRanking
  ) {

    currentRanking.textContent =
      data?.ranking_position || '-'

  }

  const rankingPoints =
    document.getElementById(
      'rankingPoints'
    )

  if (
    rankingPoints
  ) {

    rankingPoints.textContent =
      data?.ranking_points || 0

  }

  setValue(
    'rankingPointsSummary',
    data?.ranking_points || 0
  )

}
async function loadUpcomingEvents() {

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'event_instances'
      )
      .select(`
        event_area,
        start_date,
        end_date
      `)
      .gte(
        'start_date',
        new Date()
          .toISOString()
          .split('T')[0]
      )
      .order(
        'start_date'
      )
      .limit(5)

  if (error) {
    throw error
  }

  const container =
    document.getElementById(
      'upcomingEvents'
    )

  if (!container) {
    return
  }

  container.innerHTML = ''

  for (const event of data || []) {

    container.innerHTML += `
      <div class="border rounded p-2 mb-2">

        <strong>
          ${event.event_area}
        </strong>

        <br>

        <small>
          ${event.start_date}
        </small>

      </div>
    `
  }

}

async function loadRecentActivity() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'audit_log'
      )
      .select(`
  action_type,
  changed_at
`)
      .eq(
  'changed_by',
  profile.profile_id
)
      .order(
        'changed_at',
        {
          ascending: false
        }
      )
      .limit(10)

  if (error) {
    return
  }

  const container =
    document.getElementById(
      'recentActivity'
    )

  if (!container) {
    return
  }

  container.innerHTML = ''

  for (const row of data || []) {

    container.innerHTML += `
      <div class="border-bottom py-2">

        <strong>
          ${row.action_type}
        </strong>

        <br>

        <small>
          ${row.changed_at}
        </small>

      </div>
    `
  }

}

async function loadFederationSummary() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    data: athlete
  } =
    await getDb()
      .from(
        'athletes'
      )
      .select(`
        *,
        classification_master(
  description,
  classification_code
),
        membership_status_master(
          status_name
        )
      `)
      .eq(
  'athlete_id',
  profile.athlete_id
)
      .maybeSingle()

  if (!athlete) {
    return
  }

  setValue(
    'membershipSummary',
    athlete
      .membership_status_master
      ?.status_name
  )

  setValue(
    'classificationSummary',
    athlete
      .classification_master
      ?.description
  )

}

async function loadTrainingAnalytics() {

  const athlete =
    await getCurrentAthlete()

  if (!athlete) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'training_log'
      )
      .select(`
        distance_km,
        duration_minutes,
        avg_speed_kmh
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )

  if (error) {
    throw error
  }

  const rows =
    data || []

  const totalDistance =
    rows.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Number(
          row.distance_km || 0
        ),
      0
    )

  const totalMinutes =
    rows.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Number(
          row.duration_minutes || 0
        ),
      0
    )

  const avgSpeed =
    rows.length ?
      (
        rows.reduce(
          (
            sum,
            row
          ) =>
            sum +
            Number(
              row.avg_speed_kmh || 0
            ),
          0
        ) /
        rows.length
      ) :
      0

  document.getElementById(
    'totalDistanceKm'
  ).textContent =
    totalDistance.toFixed(1)

  document.getElementById(
    'totalDurationHours'
  ).textContent =
    (
      totalMinutes /
      60
    ).toFixed(1)

  document.getElementById(
    'averageSpeed'
  ).textContent =
    avgSpeed.toFixed(1)

}

async function getCurrentAthlete() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return null
  }

  const {
    data
  } =
    await getDb()
      .from(
        'athletes'
      )
      .select(
        'athlete_id'
      )
      .eq(
  'athlete_id',
  profile.athlete_id
)
      .maybeSingle()

  return data

}

async function loadTrainingHistory() {

  const athlete =
    await getCurrentAthlete()

  if (!athlete) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'training_log'
      )
      .select(`
        training_date,
        distance_km,
        duration_minutes,
        avg_speed_kmh,

        events(
          event_name
        ),

        event_programs(
          program_name
        )
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )
      .order(
        'training_date',
        {
          ascending: false
        }
      )
      .limit(25)

  if (error) {
    throw error
  }

  const tbody =
    document.getElementById(
      'trainingHistoryBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  for (
    const row
    of data || []
  ) {

    tbody.innerHTML += `
      <tr>

        <td>
          ${row.training_date || ''}
        </td>

        <td>
          ${row.events?.event_name || ''}
        </td>

        <td>
          ${row.event_programs?.program_name || ''}
        </td>

        <td>
          ${row.distance_km || 0}
        </td>

        <td>
          ${row.duration_minutes || 0}
        </td>

        <td>
          ${row.avg_speed_kmh || 0}
        </td>

        <td>
          Completed
        </td>

      </tr>
    `
  }

}


async function loadCompetitionAnalytics() {

  const athlete =
    await getCurrentAthlete()

  if (!athlete) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'race_results'
      )
      .select(`
        position,
        points,
        medal
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )

  if (error) {
    throw error
  }

  const rows =
    data || []

  const gold =
    rows.filter(
      row =>
        row.medal ===
        'GOLD'
    ).length

  const silver =
    rows.filter(
      row =>
        row.medal ===
        'SILVER'
    ).length

  const bronze =
    rows.filter(
      row =>
        row.medal ===
        'BRONZE'
    ).length

  const podiums =
    rows.filter(
      row =>
        Number(
          row.position
        ) <= 3
    ).length

  const points =
    rows.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Number(
          row.points || 0
        ),
      0
    )

  document.getElementById(
    'competitionTotal'
  ).textContent =
    rows.length

  document.getElementById(
    'goldMedals'
  ).textContent =
    gold

  document.getElementById(
    'silverMedals'
  ).textContent =
    silver

  document.getElementById(
    'bronzeMedals'
  ).textContent =
    bronze

  document.getElementById(
    'podiumFinishes'
  ).textContent =
    podiums

  document.getElementById(
    'competitionPoints'
  ).textContent =
    points

}

async function loadCompetitionHistory() {

  const athlete =
    await getCurrentAthlete()

  if (!athlete) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'race_results'
      )
      .select(`
        result_date,
        position,
        points,
        medal,

        event_instances(
          event_area
        )
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )
      .order(
        'result_date',
        {
          ascending: false
        }
      )
      .limit(25)

  if (error) {
    throw error
  }

  const tbody =
    document.getElementById(
      'competitionHistoryBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  for (
    const row
    of data || []
  ) {

    tbody.innerHTML += `
      <tr>

        <td>
          ${row.result_date || ''}
        </td>

        <td>
          ${row.event_instances?.event_area || ''}
        </td>

        <td>
          ${row.position || ''}
        </td>

        <td>
          ${row.points || 0}
        </td>

        <td>
          ${row.medal || ''}
        </td>

      </tr>
    `
  }

}
async function loadRankingDashboard() {

  const athlete =
    await getCurrentAthlete()

  if (!athlete) {
    return
  }

  const {
    data
  } =
    await getDb()
      .from(
        'rankings'
      )
      .select(`
        ranking_position,
        ranking_points
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )
      .order(
        'changed_at',
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle()

  document.getElementById(
    'currentRanking'
  ).textContent =
    data?.ranking_position || '-'

  document.getElementById(
    'rankingPointsTotal'
  ).textContent =
    data?.ranking_points || 0

}

async function loadPerformanceAnalytics() {

  const athlete =
    await getCurrentAthlete()

  if (!athlete) {
    return
  }

  const {
    data
  } =
    await getDb()
      .from(
        'performance'
      )
      .select(`
        avg_heart_rate,
        avg_cadence,
        avg_power,
        avg_speed_kmh
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )

  const rows =
    data || []

  if (!rows.length) {
    return
  }

  const averageHeartRate =
    rows.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Number(
          row.avg_heart_rate || 0
        ),
      0
    ) /
    rows.length

  const averageCadence =
    rows.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Number(
          row.avg_cadence || 0
        ),
      0
    ) /
    rows.length

  const averagePower =
    rows.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Number(
          row.avg_power || 0
        ),
      0
    ) /
    rows.length

  const bestSpeed =
    Math.max(
      ...rows.map(
        row =>
          Number(
            row.avg_speed_kmh || 0
          )
      )
    )

  document.getElementById(
    'averageHeartRate'
  ).textContent =
    averageHeartRate.toFixed(0)

  document.getElementById(
    'averageCadence'
  ).textContent =
    averageCadence.toFixed(0)

  document.getElementById(
    'averagePower'
  ).textContent =
    averagePower.toFixed(0)

  document.getElementById(
    'bestSpeed'
  ).textContent =
    bestSpeed.toFixed(1)

}

async function loadCurrentTeamDashboard() {

  const athlete =
    await getCurrentAthlete()

  if (!athlete) {
    return
  }

  const {
    data
  } =
    await getDb()
      .from(
        'team_members'
      )
      .select(`
        teams(
          team_code,
          team_name,
          status,
          pilot:athletes!teams_pilot_athlete_id_fkey(
            first_name,
            last_name
          ),
          stoker:athletes!teams_stoker_athlete_id_fkey(
            first_name,
            last_name
          )
        )
      `)
      .eq(
        'athlete_id',
        athlete.athlete_id
      )
      .eq(
        'is_active',
        true
      )
      .limit(1)
      .maybeSingle()

  if (!data?.teams) {
    return
  }

  setValue(
    'currentTeamName',
    data.teams.team_name
  )

  setValue(
    'currentTeamCode',
    data.teams.team_code
  )

  setValue(
    'currentTeamStatus',
    data.teams.status
  )

  setValue(
    'currentPilot',
    `${data.teams.pilot?.first_name || ''} ${data.teams.pilot?.last_name || ''}`
  )

  setValue(
    'currentStoker',
    `${data.teams.stoker?.first_name || ''} ${data.teams.stoker?.last_name || ''}`
  )

}

async function loadDocuments() {

  const profile =
    getCurrentProfile()

  if (!profile) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'documents'
      )
      .select(`
        document_type,
        file_name,
        file_url,
        uploaded_at
      `)
      .eq(
        'uploaded_by',
        profile.profile_id
      )
      .order(
        'uploaded_at',
        {
          ascending: false
        }
      )

  if (error) {
    throw error
  }

  const rows =
    data || []

  document.getElementById(
    'documentCount'
  ).textContent =
    rows.length

  const tbody =
    document.getElementById(
      'documentsBody'
    )

  if (!tbody) {
    return
  }

  tbody.innerHTML = ''

  for (
    const row
    of rows
  ) {

    tbody.innerHTML += `
      <tr>

        <td>
          ${row.document_type || ''}
        </td>

        <td>
          ${row.file_name || ''}
        </td>

        <td>
          ${row.uploaded_at || ''}
        </td>

        <td>

          <a
            href="${row.file_url}"
            target="_blank"
            class="btn btn-sm btn-primary"
          >
            View
          </a>

        </td>

      </tr>
    `
  }

}

async function loadSettingsDashboard() {

  const profile =
    getCurrentProfile()

  const role =
    getCurrentRole()

  if (!profile) {
    return
  }

  setValue(
    'settingsFullName',
    profile.full_name
  )

  setValue(
    'settingsEmail',
    profile.email
  )

  setValue(
    'settingsRole',
    role?.role_name ||
    role?.role_code ||
    ''
  )

}
function initializeSettingsActions() {

  const uploader =
    document.getElementById(
      'profilePhotoUpload'
    )

  document
    .getElementById(
      'changePhotoButton'
    )
    ?.addEventListener(
      'click',
      () => {

        uploader?.click()

      }
    )

}

async function loadMedicalDashboard() {

  const athlete =
    await getCurrentAthlete()

  if (!athlete) {
    return
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'medical_records'
      )
      .select('*')
      .eq(
        'athlete_id',
        athlete.athlete_id
      )
      .order(
        'examination_date',
        {
          ascending: false
        }
      )

  if (error) {
    throw error
  }

  const records =
    data || []

  if (
    !records.length
  ) {
    return
  }

  const latest =
    records[0]

  setValue(
    'medicalClearanceStatus',
    latest.clearance_status
  )

  setValue(
    'medicalLastReview',
    latest.examination_date
  )

  setValue(
    'medicalNextReview',
    latest.next_review_date
  )

  setValue(
    'medicalDoctor',
    latest.doctor_name
  )

  setValue(
    'medicalRestrictions',
    latest.restrictions
  )

  const reviewBody =
    document.getElementById(
      'medicalReviewBody'
    )

  if (
    reviewBody
  ) {

    reviewBody.innerHTML = ''

    for (
      const review
      of records
    ) {

      reviewBody.innerHTML += `
        <tr>

          <td>
            ${review.examination_date || ''}
          </td>

          <td>
            ${review.doctor_name || ''}
          </td>

          <td>
            ${review.clearance_status || ''}
          </td>

          <td>
            ${review.next_review_date || ''}
          </td>

        </tr>
      `
    }

  }

}