import {
  getDb
} from '../supabase/getDb.js'

async function loadEvents() {
  const { data, error } =
  await getDb()
    .from('travel_requests')
    .select('*')

}

document.addEventListener(
  'DOMContentLoaded',
  loadEvents
)
