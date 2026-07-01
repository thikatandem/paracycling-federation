import {
  getProfile
}
from './authStateService.js'

import {
  enablePortal,
  disablePortal
}
from './portalAccessService.js'

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
   REQUEST TYPES
   ============================================================ */

export const PROVISIONING_REQUEST_TYPES = {

  CREATE_USER:
    'CREATE_USER',

  RESET_PASSWORD:
    'RESET_PASSWORD',

  ENABLE_USER:
    'ENABLE_USER',

  DISABLE_USER:
    'DISABLE_USER',

  DELETE_USER:
    'DELETE_USER'

}

/* ============================================================
   REQUEST STATUS
   ============================================================ */

export const PROVISIONING_REQUEST_STATUS = {

  PENDING:
    'PENDING',

  PROCESSING:
    'PROCESSING',

  COMPLETED:
    'COMPLETED',

  FAILED:
    'FAILED'

}

/* ============================================================
   PROFILE LOOKUP
   ============================================================ */

export async function getProvisioningProfile(
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
        *
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
   CREATE REQUEST
   ============================================================ */

export async function createProvisioningRequest({

  profileId,

  requestType,

  requestNotes = null

}) {

  await getProvisioningProfile(
    profileId
  )

  const {
    data: existingRequest,
    error: existingError
  } =
    await getDb()
      .from(
        'user_provisioning_requests'
      )
      .select(
        'provisioning_request_id'
      )
      .eq(
        'profile_id',
        profileId
      )
      .eq(
        'request_type',
        requestType
      )
      .in(
        'request_status',
        [
          PROVISIONING_REQUEST_STATUS.PENDING,
          PROVISIONING_REQUEST_STATUS.PROCESSING
        ]
      )
      .maybeSingle()

  if (existingError) {

    throw existingError

  }

  if (existingRequest) {

    throw new Error(
      `${requestType} request already exists`
    )

  }

  const currentProfile =
    getProfile()

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'user_provisioning_requests'
      )
      .insert({

        profile_id:
          profileId,

        request_type:
          requestType,

        requested_by:
          currentProfile
            ?.profile_id,

        request_notes:
          requestNotes

      })
      .select()
      .single()

  if (error)
    throw error

  await recordSecurityEvent({

    profileId,

    eventType:
      'PROVISIONING_REQUEST_CREATED',

    eventDetails: {

      request_type:
        requestType

    }

  })

  await logAuditEvent({

    tableName:
      'user_provisioning_requests',

    recordId:
      data
        ?.provisioning_request_id,

    action:
      'CREATE',

    newValues:
      data

  })

  return data

}

/* ============================================================
   REQUEST USER CREATION
   ============================================================ */

export async function requestUserCreation(
  profileId,
  notes = null
) {

  await enablePortal(
    profileId
  )

  return createProvisioningRequest({

    profileId,

    requestType:
      PROVISIONING_REQUEST_TYPES
        .CREATE_USER,

    requestNotes:
      notes

  })

}

/* ============================================================
   REQUEST PASSWORD RESET
   ============================================================ */

export async function requestPasswordReset(
  profileId,
  notes = null
) {

  return createProvisioningRequest({

    profileId,

    requestType:
      PROVISIONING_REQUEST_TYPES
        .RESET_PASSWORD,

    requestNotes:
      notes

  })

}

/* ============================================================
   REQUEST USER ENABLE
   ============================================================ */

export async function requestUserEnable(
  profileId,
  notes = null
) {

  return createProvisioningRequest({

    profileId,

    requestType:
      PROVISIONING_REQUEST_TYPES
        .ENABLE_USER,

    requestNotes:
      notes

  })

}

/* ============================================================
   REQUEST USER DISABLE
   ============================================================ */

export async function requestUserDisable(
  profileId,
  notes = null
) {

  return createProvisioningRequest({

    profileId,

    requestType:
      PROVISIONING_REQUEST_TYPES
        .DISABLE_USER,

    requestNotes:
      notes

  })

}

/* ============================================================
   REQUEST USER DELETION
   ============================================================ */

export async function requestUserDeletion(
  profileId,
  notes = null
) {

  return createProvisioningRequest({

    profileId,

    requestType:
      PROVISIONING_REQUEST_TYPES
        .DELETE_USER,

    requestNotes:
      notes

  })

}

/* ============================================================
   REQUEST HISTORY
   ============================================================ */

export async function loadProvisioningRequests(
  profileId
) {

  let query =
    db
      .from(
        'user_provisioning_requests'
      )
      .select(`
        *
      `)
      .order(
        'requested_at',
        {
          ascending: false
        }
      )

  if (profileId) {

    query =
      query.eq(
        'profile_id',
        profileId
      )

  }

  const {
    data,
    error
  } =
    await query

  if (error)
    throw error

  return data || []

}

/* ============================================================
   REQUEST STATUS
   ============================================================ */

export async function updateRequestStatus({

  provisioningRequestId,

  status,

  authUserId = null,

  errorMessage = null

}) {

  const currentProfile =
    getProfile()

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'user_provisioning_requests'
      )
      .update({

        request_status:
          status,

        auth_user_id:
          authUserId,

        processed_by:
          currentProfile
            ?.profile_id,

        processed_at:
          new Date()
            .toISOString(),

        error_message:
          errorMessage

      })
      .eq(
        'provisioning_request_id',
        provisioningRequestId
      )
      .select()
      .single()

  if (error)
    throw error

  return data

}