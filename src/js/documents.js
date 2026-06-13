async function loadEvents() {
  const { data, error } =
  await window.supabaseClient
    .from('documents')
    .select('*')

  console.log(data)
}

document.addEventListener(
  'DOMContentLoaded',
  loadEvents
)
