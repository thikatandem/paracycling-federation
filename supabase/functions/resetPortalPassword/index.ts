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
              portal_enabled
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
        !profile.auth_user_id
      ) {

        throw new Error(
          'No linked auth user'
        )

      }

      if (
        !profile.email
      ) {

        throw new Error(
          'Profile email missing'
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
         SEND RESET EMAIL
         ======================================================== */

      const {
        error: resetError
      } =
        await supabase
          .auth
          .resetPasswordForEmail(
            profile.email
          )

      if (
        resetError
      ) {

        throw resetError

      }

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
            'PASSWORD_RESET_SENT',

          event_details: {

            auth_user_id:
              profile.auth_user_id

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
      'PASSWORD_RESET_SENT',

    changed_at:
      new Date()
        .toISOString(),

    new_values: {

      auth_user_id:
        profile.auth_user_id

    }

  })

      return new Response(
        JSON.stringify({

          success: true

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

      try {

        const {
          provisioningRequestId
        } =
          await request
            .clone()
            .json()

        if (
          provisioningRequestId
        ) {

          await supabase
            .from(
              'user_provisioning_requests'
            )
            .update({

              request_status:
                'FAILED',

              error_message:
                error.message,

              processed_at:
                new Date()
                  .toISOString()

            })
            .eq(
              'provisioning_request_id',
              provisioningRequestId
            )

        }

      } catch {

      }

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