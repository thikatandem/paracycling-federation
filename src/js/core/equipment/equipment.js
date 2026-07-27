import {
  getDb
} from '../supabase/getDb.js'

async function loadEvents() {
  const { data, error } =
  await getDb()
    .from('equipment')
    .select('*')

}

document.addEventListener(
  'DOMContentLoaded',
  loadEvents
)
