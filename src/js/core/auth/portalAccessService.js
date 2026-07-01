import {
  getProfile
}
from './authStateService.js'

import {
  recordSecurityEvent
}
from './securityService.js'

import {
  logAuditEvent
}
from './auditService.js'

import {
  getDb
}
from '../supabase/getDb.js'
/* ============================================================
   PORTAL STATUS
   ============================================================ */

export async function getPortalStatus(
  profileId
) {

  const {
    data,
    error
  } =
   await getDb()
      .from(
        'profiles'
      )
      .select(`
        profile_id,
        portal_enabled,
        portal_enabled_at,
        portal_enabled_by,
        auth_user_id
      `)
      .eq(
        'profile_id',
        profileId
      )
      .single()

  if (error)
    throw error

  return data

}

/* ============================================================
   PORTAL ENABLED
   ============================================================ */

export async function isPortalEnabled(
  profileId
) {

  const profile =
    await getPortalStatus(
      profileId
    )

  return (
    profile?.portal_enabled ===
    true
  )

}

/* ============================================================
   ENABLE PORTAL
   ============================================================ */

export async function enablePortal(
  profileId
) {

  const currentProfile =
    getProfile()

  const {
    data,
    error
  } =
   await getDb()
      .from(
        'profiles'
      )
      .update({

        portal_enabled: true,

        portal_enabled_at:
          new Date()
            .toISOString(),

        portal_enabled_by:
          currentProfile
            ?.profile_id

      })
      .eq(
        'profile_id',
        profileId
      )
      .select()
      .single()

  if (error)
    throw error

  await recordSecurityEvent({

    profileId,

    eventType:
      'PORTAL_ENABLED'

  })

  await logAuditEvent({

    tableName:
      'profiles',

    recordId:
      profileId,

    action:
      'PORTAL_ENABLED',

    newValues: {

      portal_enabled:
        true

    }

  })

  return data

}

/* ============================================================
   DISABLE PORTAL
   ============================================================ */

export async function disablePortal(
  profileId
) {

  const {
    data,
    error
  } =
   await getDb()
      .from(
        'profiles'
      )
      .update({

  portal_enabled: false,

  portal_enabled_at:
    null,

  portal_enabled_by:
    null

})
      .eq(
        'profile_id',
        profileId
      )
      .select()
      .single()

  if (error)
    throw error

  await recordSecurityEvent({

    profileId,

    eventType:
      'PORTAL_DISABLED'

  })

  await logAuditEvent({

    tableName:
      'profiles',

    recordId:
      profileId,

    action:
      'PORTAL_DISABLED',

    newValues: {

      portal_enabled:
        false

    }

  })

  return data

}

/* ============================================================
   GRANT PORTAL ACCESS
   ============================================================ */

export async function grantPortalAccess(
  profileId
) {

  return enablePortal(
    profileId
  )

}

/* ============================================================
   REVOKE PORTAL ACCESS
   ============================================================ */

export async function revokePortalAccess(
  profileId
) {

  return disablePortal(
    profileId
  )

}