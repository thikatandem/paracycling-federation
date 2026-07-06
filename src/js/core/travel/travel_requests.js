async function loadEvents() {
  const { data, error } =
  await window.supabaseClient
    .from('travel_requests')
    .select('*')

  console.log(data)
}

document.addEventListener(
  'DOMContentLoaded',
  loadEvents
)
