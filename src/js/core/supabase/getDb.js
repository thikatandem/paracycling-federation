export function getDb() {

  if (
    !window.supabaseClient
  ) {

    throw new Error(
      'Supabase client not initialized.'
    )

  }

  return window.supabaseClient

}