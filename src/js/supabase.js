import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from './core/services/appConfig.js'
import {
  installGlobalErrorHandling
} from './core/services/feedbackService.js'

installGlobalErrorHandling()

const supabaseLibrary =
  window.supabase

export const supabaseClient =
  window.supabaseClient ||
  (
    supabaseLibrary ?
      supabaseLibrary.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      ) :
      null
  )

if (
  supabaseClient &&
  !window.supabaseClient
) {
  window.supabaseClient =
    supabaseClient
}

export {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
}

export default supabaseClient
