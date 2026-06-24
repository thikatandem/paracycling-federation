// =====================================================
// LOCATION LOOKUP SERVICE
// =====================================================

export async function loadCounties() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'county_master'
      )
      .select('*')
      .order(
        'county_name'
      )

  if (error) {
    throw error
  }

  return data || []

}

export async function loadSubcounties(
  countyId
) {

  if (!countyId) {
    return []
  }

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'subcounty_master'
      )
      .select('*')
      .eq(
        'county_id',
        countyId
      )
      .order(
        'subcounty_name'
      )

  if (error) {
    throw error
  }

  return data || []

}

export async function loadTowns(
  subcountyId
) {

  if (!subcountyId) {
    return []
  }

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'town_master'
      )
      .select('*')
      .eq(
        'subcounty_id',
        subcountyId
      )
      .order(
        'town_name'
      )

  if (error) {
    throw error
  }

  return data || []

}

export async function findOrCreateTown({

  subcountyId,

  townName

}) {

  const cleanedTown =
    String(
      townName || ''
    ).trim()

  if (
    !subcountyId ||
    !cleanedTown
  ) {

    return null

  }

  const {
    data: existingTown
  } =
    await window.supabaseClient
      .from(
        'town_master'
      )
      .select(
        'town_id'
      )
      .eq(
        'subcounty_id',
        subcountyId
      )
      .ilike(
        'town_name',
        cleanedTown
      )
      .maybeSingle()

  if (existingTown) {

    return existingTown.town_id

  }

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'town_master'
      )
      .insert({

        subcounty_id:
          subcountyId,

        town_name:
          cleanedTown

      })
      .select()
      .single()

  if (error) {
    throw error
  }

  return data.town_id

}

export async function loadAllSubcounties() {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        'subcounty_master'
      )
      .select('*')
      .order(
        'subcounty_name'
      )

  if (error) {
    throw error
  }

  return data || []

}

export function populateCountySelect({

  select,

  counties,

  placeholder =
    'Select County'

}) {

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        ${placeholder}
      </option>
    `

  counties.forEach(
    county => {

      select.innerHTML += `
        <option
          value="${county.county_id}"
        >
          ${county.county_name}
        </option>
      `
    }
  )

}

export function populateSubcountySelect({

  select,

  subcounties,

  placeholder =
    'Select Subcounty'

}) {

  if (!select) {
    return
  }

  select.innerHTML =
    `
      <option value="">
        ${placeholder}
      </option>
    `

  subcounties.forEach(
    subcounty => {

      select.innerHTML += `
        <option
          value="${subcounty.subcounty_id}"
        >
          ${subcounty.subcounty_name}
        </option>
      `
    }
  )

}
export function populateTownDatalist({

  datalist,

  towns

}) {

  if (!datalist) {
    return
  }

  datalist.innerHTML = ''

  towns.forEach(
    town => {

      datalist.innerHTML += `
        <option
          value="${town.town_name}"
        ></option>
      `
    }
  )

}

export function findTownByName({

  towns,

  townName

}) {

  return (
    towns.find(
      town =>
        String(
          town.town_name
        )
          .trim()
          .toLowerCase() ===
        String(
          townName
        )
          .trim()
          .toLowerCase()
    ) || null
  )

}

export function buildLocationText({

  county,

  subcounty,

  town

}) {

  return [

    county,

    subcounty,

    town

  ]
    .filter(Boolean)
    .join(', ')

}

export async function populateLocationHierarchy({

  countySelect,

  subcountySelect,

  townDatalist,

  countyId = null,

  subcountyId = null

}) {

  const counties =
    await loadCounties()

  populateCountySelect({

    select:
      countySelect,

    counties

  })

  if (!countyId) {

    return {

      counties,

      subcounties: [],

      towns: []

    }

  }

  const subcounties =
    await loadSubcounties(
      countyId
    )

  populateSubcountySelect({

    select:
      subcountySelect,

    subcounties

  })

  if (!subcountyId) {

    return {

      counties,

      subcounties,

      towns: []

    }

  }

  const towns =
    await loadTowns(
      subcountyId
    )

  populateTownDatalist({

    datalist:
      townDatalist,

    towns

  })

  return {

    counties,

    subcounties,

    towns

  }

}

export async function resolveLocation({

  countyId,

  subcountyId,

  townId

}) {

  const [
    counties,
    subcounties,
    towns
  ] =
    await Promise.all([

      loadCounties(),

      loadAllSubcounties(),

      townId
        ? loadTowns(
            subcountyId
          )
        : []

    ])

  return {

    county:
      counties.find(
        row =>
          row.county_id ===
          countyId
      ),

    subcounty:
      subcounties.find(
        row =>
          row.subcounty_id ===
          subcountyId
      ),

    town:
      towns.find(
        row =>
          row.town_id ===
          townId
      )

  }

}

