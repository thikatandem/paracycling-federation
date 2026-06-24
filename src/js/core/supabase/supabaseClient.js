const supabase = window.supabaseClient

if (!supabase) {

  throw new Error(
    'Supabase client not initialized'
  )

}

export {
  supabase
}