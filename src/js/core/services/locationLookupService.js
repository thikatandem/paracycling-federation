// =====================================================
// LOCATION LOOKUP SERVICE
// =====================================================
import {
  getDb
} from '../supabase/getDb.js'

import {

  get,

  populateSelect,

  populateDataList

} from './domService.js'

export async function loadCountries() {
  const {
    data,
    error
  } =
    await getDb()
      .from(
        'country_master'
      )
      .select('*')
      .order(
        'country_name'
      )

  if (error) {
    throw error
  }

  return data || []
}

export async function loadCountiesByCountry(
  countryId
) {
  if (!countryId) {
    return []
  }

  const {
    data,
    error
  } =
    await getDb()
      .from(
        'county_master'
      )
      .select('*')
      .eq(
        'country_id',
        countryId
      )
      .order(
        'county_name'
      )

  if (error) {
    throw error
  }

  return data || []
}

export async function loadCountrySelect({

  selectId,

  placeholder =
  'Select Country'

}) {
  const countries =
    await loadCountries()

  populateSelect({

    selectId,

    items:
      countries,

    valueField:
      'country_id',

    textField:
      'country_name',

    placeholder

  })

  return countries
}

export async function loadCounties() {
  const {
    data,
    error
  } =
    await getDb()
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
    await getDb()
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
    await getDb()
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

  townName,

  subcountyId = null,

  subcountyCode = null,

  subcountyName = null

}) {
  const cleanedTown =

        String(

          townName || ''

        ).trim()

  if (

    !cleanedTown

  ) {
    return {

      found: false,

      id: null,

      code: null,

      name: null,

      record: null

    }
  }

  // ==========================================
  // Resolve Subcounty UUID
  // ==========================================

  let resolvedSubcountyId =

        subcountyId

  if (

    !resolvedSubcountyId

  ) {
    let query =

            getDb()

                .from(

                  'subcounty_master'

                )

                .select('*')

    if (

      subcountyCode

    ) {
      query =

                query.eq(

                  'subcounty_code',

                  subcountyCode

                )
    } else if (

      subcountyName

    ) {
      query =

                query.ilike(

                  'subcounty_name',

                  subcountyName

                )
    }

    const {

      data,

      error

    } =

            await query

                .maybeSingle()

    if (

      error ||

            !data

    ) {
      return {

        found: false,

        id: null,

        code: null,

        name: null,

        record: null

      }
    }

    resolvedSubcountyId =

            data.subcounty_id
  }

  // ==========================================
  // Check whether Town already exists
  // ==========================================

  const {

    data: existing,

    error: existingError

  } =

        await getDb()

            .from(

              'town_master'

            )

            .select('*')

            .eq(

              'subcounty_id',

              resolvedSubcountyId

            )

            .ilike(

              'town_name',

              cleanedTown

            )

            .maybeSingle()

  if (

    existingError

  ) {
    throw existingError
  }

  if (

    existing

  ) {
    return {

      found: true,

      id:

                existing.town_id,

      code:

                existing.town_code ?? null,

      name:

                existing.town_name,

      record:

                existing

    }
  }

  // ==========================================
  // Create Town
  // ==========================================

  const {

    data,

    error

  } =

        await getDb()

            .from(

              'town_master'

            )

            .insert({

              subcounty_id:

                    resolvedSubcountyId,

              town_name:

                    cleanedTown

            })

            .select()

            .single()

  if (

    error

  ) {
    throw error
  }

  return {

    found: true,

    id:

            data.town_id,

    code:

            data.town_code ?? null,

    name:

            data.town_name,

    record:

            data

  }
}

export async function resolveTownId({

  townId,

  subcountyId,

  townName

}) {
  if (

    townId

  ) {
    return townId
  }

  const town =

        await findOrCreateTown({

          subcountyId,

          townName

        })

  return town.id
}

export async function loadAllSubcounties() {
  const {
    data,
    error
  } =
    await getDb()
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

  for (const county of counties) {
    select.innerHTML += `
        <option
          value="${county.county_id}"
        >
          ${county.county_name}
        </option>
      `
  }
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

  for (const subcounty of subcounties) {
    select.innerHTML += `
        <option
          value="${subcounty.subcounty_id}"
        >
          ${subcounty.subcounty_name}
        </option>
      `
  }
}

export function populateTownDatalist({

  datalist,

  towns

}) {
  if (!datalist) {
    return
  }

  datalist.innerHTML = ''

  for (const town of towns) {
    datalist.innerHTML += `
        <option
          value="${town.town_name}"
        ></option>
      `
  }
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

  await loadCountySelect({

    selectId:
    countySelect.id

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

  await loadSubcountySelect({

    countyId,

    selectId:
    subcountySelect.id

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

  await loadTownDatalist({

    subcountyId,

    datalistId:
    townDatalist.id

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

      townId ?
        loadTowns(
          subcountyId
        ) :
        []

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

export async function loadCountySelect({

  selectId,

  placeholder = 'Select County'

}) {
  const counties =
    await loadCounties()

  populateSelect({

    selectId,

    items: counties,

    valueField:
      'county_id',

    textField:
      'county_name',

    placeholder

  })

  return counties
}

export async function loadSubcountySelect({

  countyId,

  selectId,

  placeholder =
  'Select Sub County'

}) {
  const subcounties =
    await loadSubcounties(
      countyId
    )

  populateSelect({

    selectId,

    items:
    subcounties,

    valueField:
    'subcounty_id',

    textField:
    'subcounty_name',

    placeholder

  })

  return subcounties
}

export async function loadTownDatalist({

  subcountyId,

  datalistId

}) {
  if (!subcountyId) {
    populateDataList({

      datalistId,

      items: [],

      valueField:
        'town_name'

    })

    return []
  }

  const towns =
    await loadTowns(
      subcountyId
    )

  populateDataList({

    datalistId,

    items:
      towns,

    valueField:
      'town_name'

  })

  return towns
}
// =====================================================
//  LOCATION CHAIN
//  =====================================================

export function populateLocationChain({

  countryId,

  countyId,

  subcountyId,

  townId

}) {
  wireCascade({

    parentId:
      countryId,

    childId:
      countyId,

    loadChildren:
      loadCountiesByCountry,

    valueField:
      'county_id',

    textField:
      'county_name'

  })

  wireCascade({

    parentId:
      countyId,

    childId:
      subcountyId,

    loadChildren:
      loadSubcounties,

    valueField:
      'subcounty_id',

    textField:
      'subcounty_name'

  })

  wireCascade({

    parentId:
      subcountyId,

    childId:
      townId,

    loadChildren:
      loadTowns,

    valueField:
      'town_id',

    textField:
      'town_name'

  })
}
//  =====================================================
//  CASCADING SELECTS
// =====================================================

export function wireCascade({

  parentId,

  childId,

  loadChildren,

  valueField,

  textField,

  placeholder =
  'Select Option'

}) {
  const parent =
    get(parentId)

  if (!parent) {
    return
  }

  parent.addEventListener(
    'change',

    async () => {
      const parentValue =
      parent.value

      if (
        !parentValue
      ) {
        populateSelect({

          selectId:
          childId,

          items: [],

          valueField,

          textField,

          placeholder

        })

        return
      }

      const rows =
      await loadChildren(
        parentValue
      )

      populateSelect({

        selectId:
        childId,

        items:
        rows,

        valueField,

        textField,

        placeholder

      })
    }
  )
}


export function createLocationFormLoaders({
  countySelectId = 'countyId',
  subcountySelectId = 'subcountyId',
  townListId = 'townList',
  onCounties = null,
  onSubcounties = null,
  onTowns = null
} = {}) {
  async function loadCountyOptions() {
    const data =
      await loadCounties()

    onCounties?.(data)

    populateSelect({
      selectId: countySelectId,
      items: data,
      valueField: 'county_id',
      textField: 'county_name',
      placeholder: 'Select County'
    })

    return data
  }

  async function loadSubcountyOptions(
    countyId
  ) {
    const data =
      await loadSubcounties(
        countyId
      )

    onSubcounties?.(data)

    populateSelect({
      selectId: subcountySelectId,
      items: data,
      valueField: 'subcounty_id',
      textField: 'subcounty_name',
      placeholder: 'Select Subcounty'
    })

    return data
  }

  async function loadTownOptions(
    subcountyId
  ) {
    const data =
      await loadTowns(
        subcountyId
      )

    onTowns?.(data)

    populateDataList({
      datalistId: townListId,
      items: data,
      valueField: 'town_name'
    })

    return data
  }

  return {
    loadCounties:
      loadCountyOptions,
    loadSubcounties:
      loadSubcountyOptions,
    loadTowns:
      loadTownOptions
  }
}
