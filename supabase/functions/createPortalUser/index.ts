import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase =
  createClient(
    Deno.env.get(
      'SUPABASE_URL'
    )!,
    Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY'
    )!
  )

serve(
  async (
    request
  ) => {

    try {

      const {
        provisioningRequestId
      } =
        await request.json()

      if (
        !provisioningRequestId
      ) {

        return new Response(
          JSON.stringify({

            success: false,

            error:
              'provisioningRequestId is required'

          }),
          {
            status: 400
          }
        )

      }

      /* ========================================================
         LOAD REQUEST
         ======================================================== */

      const {
        data: provisioningRequest,
        error: provisioningError
      } =
        await supabase
          .from(
            'user_provisioning_requests'
          )
          .select(`
            *,
            profiles (
              profile_id,
              email,
              full_name,
              auth_user_id,
              portal_enabled,
              user_role_id
            )
          `)
          .eq(
            'provisioning_request_id',
            provisioningRequestId
          )
          .single()

      if (
        provisioningError
      ) {

        throw provisioningError

      }

      if (
        !provisioningRequest
      ) {

        throw new Error(
          'Provisioning request not found'
        )

      }

      const profile =
        provisioningRequest
          .profiles

      if (
        !profile
      ) {

        throw new Error(
          'Profile not found'
        )

      }

      if (
        !profile.portal_enabled
      ) {

        throw new Error(
          'Portal access is disabled'
        )

      }

      if (
        !profile.email
      ) {

        throw new Error(
          'Profile email missing'
        )

      }

      if (
        profile.auth_user_id
      ) {

        throw new Error(
          'Profile already linked'
        )

      }

      /* ========================================================
         MARK PROCESSING
         ======================================================== */

      await supabase
        .from(
          'user_provisioning_requests'
        )
        .update({

          request_status:
            'PROCESSING'

        })
        .eq(
          'provisioning_request_id',
          provisioningRequestId
        )

      /* ========================================================
         CREATE AUTH USER
         ======================================================== */

      const temporaryPassword =
        crypto.randomUUID()

      const {
        data: authUser,
        error: createUserError
      } =
        await supabase
          .auth
          .admin
          .createUser({

            email:
              profile.email,

            password:
              temporaryPassword,

            email_confirm: true,

            user_metadata: {

              profile_id:
                profile.profile_id,

              full_name:
                profile.full_name

            }

          })

      if (
        createUserError
      ) {

        throw createUserError

      }

      /* ========================================================
         LINK PROFILE
         ======================================================== */

      await supabase
        .from(
          'profiles'
        )
        .update({

          auth_user_id:
            authUser.user.id

        })
        .eq(
          'profile_id',
          profile.profile_id
        )

      /* ========================================================
         ACCOUNT STATUS
         ======================================================== */

      await supabase
        .from(
          'auth_account_status'
        )
        .upsert({

          profile_id:
            profile.profile_id,

          auth_user_id:
            authUser.user.id,

          account_status:
            'ACTIVE'

        })

      /* ========================================================
         COMPLETE REQUEST
         ======================================================== */

      await supabase
        .from(
          'user_provisioning_requests'
        )
        .update({

          request_status:
            'COMPLETED',

          auth_user_id:
            authUser.user.id,

          processed_at:
            new Date()
              .toISOString()

        })
        .eq(
          'provisioning_request_id',
          provisioningRequestId
        )

      /* ========================================================
         SECURITY EVENT
         ======================================================== */

      await supabase
        .from(
          'security_events'
        )
        .insert({

          profile_id:
            profile.profile_id,

          event_type:
            'PORTAL_USER_CREATED',

          event_details: {

            auth_user_id:
              authUser.user.id

          }

        })

      /* ========================================================
         AUDIT
         ======================================================== */

     await supabase
  .from(
    'audit_log'
  )
  .insert({

    table_name:
      'profiles',

    record_id:
      profile.profile_id,

    action_type:
      'PORTAL_USER_CREATED',

    changed_at:
      new Date()
        .toISOString(),

    new_values: {

      auth_user_id:
        authUser.user.id

    }

  })
      /* ========================================================
         PASSWORD RESET EMAIL
         ======================================================== */

      await supabase
        .auth
        .resetPasswordForEmail(
          profile.email
        )

      return new Response(
        JSON.stringify({

          success: true,

          authUserId:
            authUser.user.id

        }),
        {
          status: 200
        }
      )

    } catch (
      error
    ) {

      console.error(
        error
      )

      return new Response(
        JSON.stringify({

          success: false,

          error:
            error.message

        }),
        {
          status: 500
        }
      )

    }

  }
)