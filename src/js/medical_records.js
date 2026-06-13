async function loadEvents() {
  const { data, error } =
  await window.supabaseClient
    .from('medical_records')
    .select('*')

  console.log(data)
}

document.addEventListener(
  'DOMContentLoaded',
  loadEvents
)
