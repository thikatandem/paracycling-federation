import {
  getProfile
 
}
from './authStateService.js'

import {
  getDb
}
from '../supabase/getDb.js'

/* ============================================================
   AUDIT EVENT TYPES
   ============================================================ */

export const AUDIT_EVENTS = {

  CREATE: 'CREATE',

  UPDATE: 'UPDATE',

  DELETE: 'DELETE',

  LOGIN: 'LOGIN',

  LOGOUT: 'LOGOUT',

  PASSWORD_CHANGE:
    'PASSWORD_CHANGE',

  ROLE_CHANGE:
    'ROLE_CHANGE',

  PERMISSION_CHANGE:
    'PERMISSION_CHANGE'

}

/* ============================================================
   CORE AUDIT LOGGER
   ============================================================ */

export async function logAuditEvent({

  tableName,

  recordId = null,

  action,

  oldValues = null,

  newValues = null

}) {

  try {

    const profile =
      getProfile()

    await getDb()
  .from('audit_log')
  .insert({

    table_name:
      tableName,

    record_id:
      recordId,

    action_type:
      action,

        changed_by:
          profile?.profile_id,

        changed_at:
          new Date()
            .toISOString(),

        old_values:
          oldValues,

        new_values:
          newValues

      })

  } catch (error) {

    console.error(
      'Audit logging failed',
      error
    )

  }

}

/* ============================================================
   CREATE
   ============================================================ */

export async function logCreate({

  tableName,

  recordId,

  newValues

}) {

  return logAuditEvent({

    tableName,

    recordId,

    action:
      AUDIT_EVENTS.CREATE,

    newValues

  })

}

/* ============================================================
   UPDATE
   ============================================================ */

export async function logUpdate({

  tableName,

  recordId,

  oldValues,

  newValues

}) {

  return logAuditEvent({

    tableName,

    recordId,

    action:
      AUDIT_EVENTS.UPDATE,

    oldValues,

    newValues

  })

}

/* ============================================================
   DELETE
   ============================================================ */

export async function logDelete({

  tableName,

  recordId,

  oldValues

}) {

  return logAuditEvent({

    tableName,

    recordId,

    action:
      AUDIT_EVENTS.DELETE,

    oldValues

  })

}

/* ============================================================
   LOGIN
   ============================================================ */

export async function logLogin() {

  return logAuditEvent({

    tableName:
      'auth',

    action:
      AUDIT_EVENTS.LOGIN

  })

}

/* ============================================================
   LOGOUT
   ============================================================ */

export async function logLogout() {

  return logAuditEvent({

    tableName:
      'auth',

    action:
      AUDIT_EVENTS.LOGOUT

  })

}

/* ============================================================
   PASSWORD CHANGE
   ============================================================ */

export async function logPasswordChange() {

  return logAuditEvent({

    tableName:
      'auth',

    action:
      AUDIT_EVENTS.PASSWORD_CHANGE

  })

}

/* ============================================================
   ROLE CHANGE
   ============================================================ */

export async function logRoleChange({

  profileId,

  oldRole,

  newRole

}) {

  return logAuditEvent({

    tableName:
      'profiles',

    recordId:
      profileId,

    action:
      AUDIT_EVENTS.ROLE_CHANGE,

    oldValues: {

      role:
        oldRole

    },

    newValues: {

      role:
        newRole

    }

  })

}

/* ============================================================
   PERMISSION CHANGE
   ============================================================ */

export async function logPermissionChange({

  profileId,

  permissionCode,

  changeType

}) {

  return logAuditEvent({

    tableName:
      'user_permissions',

    recordId:
      profileId,

    action:
      AUDIT_EVENTS.PERMISSION_CHANGE,

    newValues: {

      permission_code:
        permissionCode,

      change_type:
        changeType

    }

  })

}