import {
 
  getProfile,
  getRole
}
from './authStateService.js'

import {
  isSystemAdmin,
  isAdmin
}
from './permissionService.js'

import {
  getDb
}
from '../supabase/getDb.js'

/* ============================================================
   ROLE HELPERS
   ============================================================ */

export function isAthlete() {

  return (
    getRole()?.role_code ===
    'ATHLETE'
  )

}

export function isCoach() {

  return (
    getRole()?.role_code ===
    'COACH'
  )

}

export function isMedicalOfficer() {

  return (
    getRole()?.role_code ===
    'MEDICAL_OFFICER'
  )

}

export function isEquipmentOfficer() {

  return (
    getRole()?.role_code ===
    'EQUIPMENT_OFFICER'
  )

}

/* ============================================================
   PROFILE OWNERSHIP
   ============================================================ */

export function ownsProfile(
  profileId
) {

  return (
    getProfile()?.profile_id ===
    profileId
  )

}

/* ============================================================
   ATHLETE OWNERSHIP
   ============================================================ */

export function ownsAthlete(
  athleteId
) {

  return (
    getProfile()
      ?.athlete_id ===
    athleteId
  )

}

/* ============================================================
   TEAM OWNERSHIP
   ============================================================ */


export async function ownsTeam(
  teamId
) {

  const athleteId =
    getProfile()
      ?.athlete_id

  if (!athleteId) {

    return false

  }

  const {
    data,
    error
  } =
   await getDb()
      .from(
        'team_members'
      )
      .select(
        'team_member_id'
      )
      .eq(
        'team_id',
        teamId
      )
      .eq(
        'athlete_id',
        athleteId
      )
      .eq(
        'is_active',
        true
      )
      .maybeSingle()

  if (error) {

    throw error

  }

  return !!data

}


export async function ownsStaff(
  staffId
) {

  const profileId =
    getProfile()
      ?.profile_id

  if (!profileId) {

    return false

  }

  const {
    data,
    error
  } =
   await getDb()
      .from(
        'staff_registry'
      )
      .select(
        'staff_id'
      )
      .eq(
        'staff_id',
        staffId
      )
      .eq(
        'profile_id',
        profileId
      )
      .maybeSingle()

  if (error) {

    throw error

  }

  return !!data

}

/* ============================================================
   GENERIC VIEW RULES
   ============================================================ */

export function canViewAthlete(
  athleteId
) {

  if (
    isSystemAdmin()
  ) {
    return true
  }

  if (
    isAdmin()
  ) {
    return true
  }

  if (
    isCoach()
  ) {
    return true
  }

  if (
    isAthlete()
  ) {

    return ownsAthlete(
      athleteId
    )

  }

  return false

}

/* ============================================================
   ATHLETE EDIT
   ============================================================ */

export function canEditAthlete(
  athleteId
) {

  if (
    isSystemAdmin()
  ) {
    return true
  }

  if (
    isAdmin()
  ) {
    return true
  }

  return false

}

/* ============================================================
   TRAINING
   ============================================================ */

export function canViewTraining(
  athleteId
) {

  return canViewAthlete(
    athleteId
  )

}

export function canEditTraining(
  athleteId
) {

  if (
    isSystemAdmin()
  ) {
    return true
  }

  if (
    isAdmin()
  ) {
    return true
  }

  if (
    isCoach()
  ) {
    return true
  }

  return false

}

/* ============================================================
   PERFORMANCE
   ============================================================ */

export function canViewPerformance(
  athleteId
) {

  return canViewAthlete(
    athleteId
  )

}

export function canEditPerformance(
  athleteId
) {

  return canEditTraining(
    athleteId
  )

}

/* ============================================================
   RESULTS
   ============================================================ */

export function canViewResults(
  athleteId
) {

  return canViewAthlete(
    athleteId
  )

}

/* ============================================================
   MEDICAL
   ============================================================ */

export function canViewMedical(
  athleteId
) {

  if (
    isSystemAdmin()
  ) {
    return true
  }

  if (
    isMedicalOfficer()
  ) {
    return true
  }

  return ownsAthlete(
    athleteId
  )

}

export function canEditMedical() {

  if (
    isSystemAdmin()
  ) {
    return true
  }

  if (
    isMedicalOfficer()
  ) {
    return true
  }

  return false

}

/* ============================================================
   TRAVEL
   ============================================================ */

export function canViewTravel(
  athleteId
) {

  return canViewAthlete(
    athleteId
  )

}

export function canApproveTravel() {

  return (
    getRole()?.role_code ===
    'TRAVEL_OFFICER'
  )

}

/* ============================================================
   EQUIPMENT
   ============================================================ */

export function canViewEquipment() {

  if (
    isSystemAdmin()
  ) {
    return true
  }

  return (
    isEquipmentOfficer()
  )

}

export function canEditEquipment() {

  return canViewEquipment()

}

/* ============================================================
   STAFF
   ============================================================ */

export function canManageStaff() {

  return (
    getRole()?.role_code ===
    'STAFF_MANAGER'
  )

}

/* ============================================================
   AUDIT
   ============================================================ */

export function canViewAudit() {

  const roleCode =
    getRole()?.role_code

  return [
    'SYS_ADMIN',
    'FED_ADMIN',
    'AUDITOR'
  ].includes(
    roleCode
  )

}