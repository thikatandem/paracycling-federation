// =====================================================
// REPORT DATA SERVICE
// Centralized schema-verified Supabase reads for reports.
// =====================================================

function dataOrThrow(response, label) {
  if (response?.error) {
    const error = new Error(`${label}: ${response.error.message || 'database query failed'}`)
    error.cause = response.error
    throw error
  }
  return response?.data || []
}

export async function loadTrainingReportRows(db) {
  const response = await db
    .from('training_log')
    .select(`
      *,
      teams(
        team_id,
        team_code,
        team_name,
        pilot_athlete_id,
        stoker_athlete_id,
        status,
        status_id,
        membership_status_id
      ),
      athletes(
        athlete_id,
        athlete_code,
        first_name,
        last_name,
        dob,
        gender,
        role,
        classification_id,
        county_id,
        subcounty_id,
        town_id,
        status,
        status_id,
        membership_status_id
      ),
      events(
        event_id,
        event_code,
        event_name,
        event_type_id,
        event_category_id,
        event_type_master(
          event_type_id,
          event_type_code,
          event_type_name
        ),
        event_category_master(
          event_category_id,
          category_code,
          category_name
        )
      ),
      event_instances(
        event_instance_id,
        event_id,
        program_id,
        country_id,
        county_id,
        subcounty_id,
        town_id,
        event_area,
        start_date,
        start_time,
        end_date,
        end_time,
        country_master(
          country_id,
          country_code,
          country_name
        ),
        county_master(
          county_id,
          county_code,
          county_name
        ),
        subcounty_master(
          subcounty_id,
          subcounty_code,
          subcounty_name
        ),
        town_master(
          town_id,
          town_name
        )
      ),
      attendance_status_master(
        attendance_status_id,
        status_code,
        status_name
      ),
      outcome_status_master(
        outcome_status_id,
        status_code,
        status_name
      ),
      participant_instances(
        participant_instance_id,
        participant_ref_id,
        participant_status_id,
        registration_status_id,
        program_id,
        event_instance_id,
        participant_registry(
          participant_ref_id,
          participant_type_id,
          source_id,
          display_name,
          is_active,
          participant_type_master(
            participant_type_id,
            participant_type_code,
            participant_type_name,
            is_active
          )
        ),
        registration_status_master(
          registration_status_id,
          status_code,
          status_name
        ),
        program_master(
          program_id,
          program_code,
          program_name,
          active
        ),
        event_instances(
          event_instance_id,
          event_id,
          program_id,
          country_id,
          county_id,
          subcounty_id,
          town_id,
          event_area,
          start_date,
          start_time,
          end_date,
          end_time,
          country_master(country_id, country_code, country_name),
          county_master(county_id, county_code, county_name, country_id, country_master(country_id, country_code, country_name)),
          subcounty_master(subcounty_id, subcounty_code, subcounty_name),
          town_master(town_id, town_name),
          events(
            event_id,
            event_code,
            event_name,
            event_type_id,
            event_category_id,
            event_type_master(event_type_id, event_type_code, event_type_name),
            event_category_master(event_category_id, category_code, category_name)
          )
        )
      ),
      performance(
        performance_id,
        performance_date,
        distance_km,
        duration_minutes,
        avg_speed_kmh,
        max_speed_kmh,
        avg_watts,
        max_watts,
        avg_cadence_rpm,
        max_cadence_rpm,
        avg_heart_rate,
        max_heart_rate,
        normalized_power,
        training_stress_score,
        elevation_gain,
        source_type,
        training_id,
        result_id,
        team_id,
        participant_id,
        athlete_id,
        participant_instance_id
      )
    `)
    .order('training_date', { ascending: false })

  return dataOrThrow(response, 'Training records')
}

export async function loadFederationReportContext(db) {
  const [
    athletesResponse,
    teamsResponse,
    teamMembersResponse,
    registryResponse,
    participantInstancesResponse,
    programsResponse,
    staffResponse,
    staffAssignmentsResponse,
    trainingRankingsResponse,
    raceResultsResponse,
    rankingsResponse
  ] = await Promise.all([
    db.from('athletes').select(`
      athlete_id,
      athlete_code,
      first_name,
      last_name,
      dob,
      gender,
      role,
      classification_id,
      county_id,
      subcounty_id,
      town_id,
      status,
      status_id,
      membership_status_id,
      county_master(county_id, county_code, county_name),
      subcounty_master(subcounty_id, subcounty_code, subcounty_name),
      town_master(town_id, town_name),
      classification_master(classification_id, classification_code, description)
    `),

    db.from('teams').select(`
      team_id,
      team_code,
      team_name,
      team_nickname,
      pilot_athlete_id,
      stoker_athlete_id,
      formed_date,
      dissolved_date,
      status,
      status_id,
      membership_status_id
    `),

    db.from('team_members').select(`
      team_member_id,
      team_id,
      athlete_id,
      role_id,
      start_date,
      end_date,
      is_active,
      membership_status_id,
      role_master(role_id, role_code, role_name),
      membership_status_master(membership_status_id, status_code, status_name)
    `),

    db.from('participant_registry').select(`
      participant_ref_id,
      participant_type_id,
      source_id,
      display_name,
      is_active,
      created_at,
      participant_type_master(
        participant_type_id,
        participant_type_code,
        participant_type_name,
        is_active
      )
    `),

    db.from('participant_instances').select(`
      participant_instance_id,
      event_instance_id,
      participant_ref_id,
      participant_status_id,
      registration_status_id,
      registration_date,
      program_id,
      participant_registry(
        participant_ref_id,
        source_id,
        display_name,
        is_active,
        participant_type_master(
          participant_type_id,
          participant_type_code,
          participant_type_name,
          is_active
        )
      ),
      registration_status_master(
        registration_status_id,
        status_code,
        status_name
      )
    `),

    db.from('program_master').select(`
      program_id,
      program_code,
      program_name,
      active,
      sort_order,
      program_duration_days,
      recurrence_type_id,
      recurrence_interval,
      occurrences_per_period
    `),

    db.from('staff_registry').select(`
      staff_id,
      staff_code,
      first_name,
      last_name,
      gender,
      dob,
      county_id,
      subcounty_id,
      town_id,
      role_id,
      is_active,
      deleted_at,
      country_id,
      department_id,
      position_id,
      athlete_id,
      role_master(role_id, role_code, role_name),
      country_master(country_id, country_code, country_name),
      county_master(county_id, county_code, county_name),
      subcounty_master(subcounty_id, subcounty_code, subcounty_name),
      town_master(town_id, town_name)
    `),

    db.from('staff_assignments').select(`
      assignment_id,
      role_id,
      team_id,
      start_date,
      end_date,
      is_active,
      staff_id
    `),

    db.from('training_rankings').select(`
      training_ranking_id,
      team_id,
      ranking_date,
      attendance_score,
      endurance_score,
      performance_score,
      total_score,
      ranking_position,
      distance_score,
      duration_score,
      speed_score,
      power_score,
      cadence_score,
      hr_score,
      recovery_score
    `).order('ranking_date', { ascending: true }),

    db.from('race_results').select(`
      result_id,
      event_id,
      team_id,
      position,
      finish_time,
      points,
      medal,
      competition_date,
      distance_km,
      avg_speed_kmh,
      max_speed_kmh,
      duration_minutes,
      participant_id,
      participant_instance_id,
      event_instance_id,
      program_id,
      session_type,
      competition_week,
      competition_day,
      indoor_session,
      attendance,
      athlete_id,
      attendance_status_id,
      outcome_status_id
    `),

    db.from('rankings').select(`
      ranking_id,
      ranking_type_id,
      athlete_id,
      team_id,
      ranking_position,
      ranking_points,
      ranking_date,
      competition_score,
      average_position,
      average_points,
      gold_count,
      silver_count,
      bronze_count,
      participant_ref_id
    `)
  ])

  return {
    athletes: dataOrThrow(athletesResponse, 'Athletes'),
    teams: dataOrThrow(teamsResponse, 'Teams'),
    teamMembers: dataOrThrow(teamMembersResponse, 'Team members'),
    participantRegistry: dataOrThrow(registryResponse, 'Participant registry'),
    participantInstances: dataOrThrow(participantInstancesResponse, 'Participant registrations'),
    programs: dataOrThrow(programsResponse, 'Programs'),
    staff: dataOrThrow(staffResponse, 'Staff registry'),
    staffAssignments: dataOrThrow(staffAssignmentsResponse, 'Staff assignments'),
    trainingRankings: dataOrThrow(trainingRankingsResponse, 'Training rankings'),
    raceResults: dataOrThrow(raceResultsResponse, 'Race results'),
    rankings: dataOrThrow(rankingsResponse, 'Rankings')
  }
}

export async function loadFederationReportingData(db) {
  const [trainingRecords, context] = await Promise.all([
    loadTrainingReportRows(db),
    loadFederationReportContext(db)
  ])
  return { trainingRecords, context }
}
