import {
  getProfile
}
from '../../auth/authStateService.js'

import {
  supabase
}
from '../../supabase/supabaseClient.js'

export async function getCurrentAthlete() {

  const profile =
    getProfile()

  if (
    !profile?.athlete_id
  ) {

    return null

  }

  const {
    data,
    error
  } =
    await supabase
      .from(
        'athletes'
      )
      .select('*')
      .eq(
        'athlete_id',
        profile.athlete_id
      )
      .single()

  if (
    error
  ) {

    throw error

  }

  return data

}

export function getCurrentAthleteId() {

  return (
    getProfile()?.athlete_id ||
    null
  )

}

export async function getCurrentAthleteTeamIds() {

  const athleteId =
    getCurrentAthleteId()

  if (
    !athleteId
  ) {

    return []

  }

  const {
    data,
    error
  } =
    await supabase
      .from(
        'team_members'
      )
      .select(
        'team_id'
      )
      .eq(
        'athlete_id',
        athleteId
      )
      .eq(
        'is_active',
        true
      )

  if (
    error
  ) {

    throw error

  }

  return (
    data || []
  ).map(
    row =>
      row.team_id
  )

}