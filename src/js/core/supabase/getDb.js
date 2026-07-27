import {
  supabaseClient
} from '../../supabase.js'

export function hasDb() {
  return Boolean(
    supabaseClient
  )
}

export function getDb() {
  if (!supabaseClient) {
    throw new Error(
      'Supabase client not initialized. Check that the Supabase browser library loads before the application module.'
    )
  }

  return supabaseClient
}
