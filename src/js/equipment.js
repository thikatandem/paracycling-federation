async function loadEvents() {
  const { data, error } =
  await window.supabaseClient
    .from('equipment')
    .select('*')

  console.log(data)
}

document.addEventListener(
  'DOMContentLoaded',
  loadEvents
)
