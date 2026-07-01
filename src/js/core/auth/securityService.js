import {
  getProfile
}
from './authStateService.js'

import {
  logAuditEvent
}
from './auditService.js'

const db =
  window.supabaseClient

const MAX_FAILED_ATTEMPTS =
  5

/* ============================================================
   RECORD SECURITY EVENT
   ============================================================ */

export async function recordSecurityEvent({

  eventType,

  eventDetails = {},

  profileId = null

}) {

  try {

    const currentProfile =
      getProfile()

    await db
      .from(
        'security_events'
      )
      .insert({

        profile_id:
          profileId ||
          currentProfile?.profile_id,

        event_type:
          eventType,

        event_details:
          eventDetails,

        user_agent:
          navigator.userAgent

      })

  } catch (error) {

    console.error(
      'Security event failed',
      error
    )

  }

}

/* ============================================================
   FAILED LOGIN
   ============================================================ */

export async function recordFailedLogin({

  profileId = null,

  reason = 'INVALID_CREDENTIALS'

}) {

  await recordSecurityEvent({

    profileId,

    eventType:
      'FAILED_LOGIN',

    eventDetails: {
      reason
    }

  })

}

/* ============================================================
   ACCOUNT LOCK CHECK
   ============================================================ */

export async function isAccountLocked(
  profileId
) {

  const {
    data,
    error
  } =
    await db
      .from(
        'account_lockouts'
      )
      .select('*')
      .eq(
        'profile_id',
        profileId
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle()

  if (error)
    throw error

  if (!data) {
    return false
  }

  if (
    !data.locked_until
  ) {
    return false
  }

  return (
    new Date(
      data.locked_until
    ) > new Date()
  )

}

/* ============================================================
   GET FAILED ATTEMPTS
   ============================================================ */

export async function getFailedAttempts(
  profileId
) {

  const {
    data,
    error
  } =
    await db
      .from(
        'account_lockouts'
      )
      .select(
        'failed_attempts'
      )
      .eq(
        'profile_id',
        profileId
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle()

  if (error)
    throw error

  return (
    data
      ?.failed_attempts || 0
  )

}

/* ============================================================
   INCREMENT FAILED ATTEMPTS
   ============================================================ */

export async function incrementFailedAttempts(
  profileId
) {

  const attempts =
    await getFailedAttempts(
      profileId
    )

  const nextAttempts =
    attempts + 1

  if (
    nextAttempts >=
    MAX_FAILED_ATTEMPTS
  ) {

    await lockAccount({
      profileId,
      reason:
        'MAX_LOGIN_ATTEMPTS'
    })

    return
  }

  await db
    .from(
      'account_lockouts'
    )
    .insert({

      profile_id:
        profileId,

      failed_attempts:
        nextAttempts

    })

}

/* ============================================================
   LOCK ACCOUNT
   ============================================================ */

export async function lockAccount({

  profileId,

  reason

}) {

  const lockedUntil =
    new Date(
      Date.now() +
      30 * 60 * 1000
    )

  await db
    .from(
      'account_lockouts'
    )
    .insert({

      profile_id:
        profileId,

      failed_attempts:
        MAX_FAILED_ATTEMPTS,

      locked_until:
        lockedUntil
          .toISOString(),

      reason

    })

  await recordSecurityEvent({

    profileId,

    eventType:
      'ACCOUNT_LOCK',

    eventDetails: {
      reason
    }

  })

}

/* ============================================================
   UNLOCK ACCOUNT
   ============================================================ */

export async function unlockAccount(
  profileId
) {

  await db
    .from(
      'account_lockouts'
    )
    .insert({

      profile_id:
        profileId,

      failed_attempts: 0,

      locked_until:
        null,

      reason:
        'MANUAL_UNLOCK'

    })

  await recordSecurityEvent({

    profileId,

    eventType:
      'ACCOUNT_UNLOCK'

  })

}

/* ============================================================
   RESET FAILED ATTEMPTS
   ============================================================ */

export async function resetFailedAttempts(
  profileId
) {

  await db
    .from(
      'account_lockouts'
    )
    .insert({

      profile_id:
        profileId,

      failed_attempts: 0

    })

}

/* ============================================================
   LOGIN SUCCESS
   ============================================================ */

export async function recordSuccessfulLogin(
  profileId
) {

  await resetFailedAttempts(
    profileId
  )

  await recordSecurityEvent({

    profileId,

    eventType:
      'LOGIN_SUCCESS'

  })

}

/* ============================================================
   LOGOUT
   ============================================================ */

export async function recordLogout(
  profileId
) {

  await recordSecurityEvent({

    profileId,

    eventType:
      'LOGOUT'

  })

}

/* ============================================================
   PASSWORD CHANGE
   ============================================================ */

export async function recordPasswordChange(
  profileId
) {

  await recordSecurityEvent({

    profileId,

    eventType:
      'PASSWORD_CHANGE'

  })

}

/* ============================================================
   ROLE CHANGE
   ============================================================ */

export async function recordRoleChange({

  profileId,

  oldRole,

  newRole

}) {

  await recordSecurityEvent({

    profileId,

    eventType:
      'ROLE_CHANGE',

    eventDetails: {

      old_role:
        oldRole,

      new_role:
        newRole

    }

  })

}

/* ============================================================
   PERMISSION CHANGE
   ============================================================ */

export async function recordPermissionChange({

  profileId,

  permissionCode,

  action

}) {

  await recordSecurityEvent({

    profileId,

    eventType:
      'PERMISSION_CHANGE',

    eventDetails: {

      permission_code:
        permissionCode,

      action

    }

  })

}