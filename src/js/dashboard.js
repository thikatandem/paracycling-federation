

document.addEventListener(
  'DOMContentLoaded',
  loadDashboard
)

async function loadDashboard() {

  await loadAthletes()
  await loadTeams()
  await loadEvents()
  await loadTraining()

}

async function loadAthletes() {

  const { count,error } =
    await window.supabaseClient
      .from('athletes')
      .select('*',{
        count:'exact',
        head:true
      })

  if(error) {
    console.error(error)
    return
  }

  document.getElementById(
    'totalAthletes'
  ).textContent = count

}

async function loadTeams() {

  const { count,error } =
    await window.supabaseClient
      .from('teams')
      .select('*',{
        count:'exact',
        head:true
      })

  if(error) {
    console.error(error)
    return
  }

  document.getElementById(
    'totalTeams'
  ).textContent = count

}

async function loadEvents() {

  const { count,error } =
    await window.supabaseClient
      .from('events')
      .select('*',{
        count:'exact',
        head:true
      })

  if(error) {
    console.error(error)
    return
  }

  document.getElementById(
    'totalEvents'
  ).textContent = count

}

async function loadTraining() {

  const { count,error } =
    await window.supabaseClient
      .from('training_log')
      .select('*',{
        count:'exact',
        head:true
      })

  if(error) {
    console.error(error)
    return
  }

  document.getElementById(
    'totalTraining'
  ).textContent = count

}