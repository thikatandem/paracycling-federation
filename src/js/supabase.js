/* global supabase */

const supabaseLib =
  window.supabase

if (!supabaseLib) {
  throw new Error(
    'Supabase library not loaded. Check script order.'
  )
}

const SUPABASE_URL =
  'https://ingbnzsiabtttijddenn.supabase.co'

const SUPABASE_ANON_KEY =
  'sb_publishable_jaruEYItuMtUUgyQ_xfFMg_VH_ZWUsW'

window.supabaseClient =
  supabaseLib.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )