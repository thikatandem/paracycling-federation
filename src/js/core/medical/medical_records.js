import {
  getDb
} from '../supabase/getDb.js'

async function loadEvents() {
  const { data, error } =
  await getDb()
    .from('medical_records')
    .select('*')

}

document.addEventListener(
  'DOMContentLoaded',
  loadEvents
)
