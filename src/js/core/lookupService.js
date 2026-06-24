 // =====================================================
// LOOKUP SERVICE
// ParaCycling Federation Management System
// =====================================================


import {
  get,
  clearSelect,
  replaceOptions,
  appendOption
}
from './domService.js'

import {
  getRecords
}
from './supabase/supabaseCrudService.js'
 // =====================================================
// CACHE
 // =====================================================

const lookupCache =
  new Map()

const CACHE_TTL =
  5 * 60 * 1000

 // =====================================================
 // CACHE HELPERS
 // =====================================================

function buildCacheKey({
  table,
  filters = []
}) {

  return JSON.stringify({
    table,
    filters
  })

}

function isExpired(
  timestamp
) {

 return (
  Date.now() -
  timestamp
) > CACHE_TTL

}


export async function
loadLookupOptions({

  table,

  valueField,

  textField,

  orderBy,

  selectId,

  placeholder

}) {

  const rows =
    await getRecords({

      table,

      orderBy

    })

  replaceOptions({

    selectId,

    placeholder,

    options:
      rows.map(
        row => ({

          value:
            row[valueField],

          text:
            row[textField]

        })
      )

  })

  return rows

}


// =====================================================
// LOAD LOOKUP
// =====================================================

export async function loadLookup({

  table,

  filters = [],

  orderBy = null

}) {

  let query =
    supabase
      .from(table)
      .select('*')

  filters.forEach(
  filter => {

    const {
      field,
      operator = 'eq',
      value
    } = filter

    query =
      query[
        operator
      ](
        field,
        value
      )

  }
)

  if (orderBy) {

    query =
      query.order(
        orderBy
      )

  }

  const {
    data,
    error
  } =
    await query

  if (error) {

    throw new Error(
      error.message
    )

  }

 return data || []

}

//  =====================================================
//  CACHED LOOKUP
//  =====================================================

export async function loadLookupCached(
  config
) {

  const key =
    buildCacheKey(
      config
    )

  const cached =
    lookupCache.get(
      key
    )

  if (
    cached &&
    !isExpired(
      cached.timestamp
    )
  ) {

    return cached.data

  }

  const data =
    await loadLookup(
      config
    )

  lookupCache.set(
    key,
    {
  data,
  timestamp:
    Date.now()
}
  )

  return data

}

//  =====================================================
//  PRELOAD LOOKUPS
//  =====================================================

export async function preloadLookups(
  lookups = []
) {

  await Promise.all(

    lookups.map(
  lookup =>
    loadLookupCached(
      lookup
    )
)

  )

}

//  =====================================================
//  CACHE MANAGEMENT
//  =====================================================

export function clearLookupCache() {

  lookupCache.clear()

}

export function refreshLookup(
  config
) {

  const key =
    buildCacheKey(
      config
    )

  lookupCache.delete(
    key
  )

}

//  =====================================================
//  SELECT POPULATION
//  =====================================================

export function populateSelect({

  selectId,

  data = [],

  valueField,

  textField,

  selectedValue = '',

  placeholder =
    'Select Option'

}) {

  clearSelect(
    selectId
  )

  appendOption(
    selectId,
    '',
    placeholder
  )

  data.forEach(
  row => {

    appendOption(
      selectId,

      row[
        valueField
      ],

      row[
        textField
      ]
    )

  }
)

  const select =
    get(selectId)

  if (
    select &&
    selectedValue
  ) {

    select.value =
      selectedValue

  }

}

//  =====================================================
//  MULTI SELECT
//  =====================================================

export function populateMultiSelect({

  selectId,

  data,

  valueField,

  textField,

  selectedValues = []

}) {

  clearSelect(
    selectId
  )

  const select =
    get(selectId)

  if (!select) {
    return
  }

 data.forEach(
  row => {

    const option =
      document.createElement(
        'option'
      )

    option.value =
      row[
        valueField
      ]

    option.textContent =
      row[
        textField
      ]

    option.selected =
      selectedValues.includes(
        row[
          valueField
        ]
      )

    select.appendChild(
      option
    )

  }
)

}

//  =====================================================
//  DATALIST
//  =====================================================

export function populateDataList({

  datalistId,

  data,

  textField

}) {

  const datalist =
    get(
      datalistId
    )

  if (!datalist) {
    return
  }

  datalist.innerHTML =
    ''

  data.forEach(
  row => {

    const option =
      document.createElement(
        'option'
      )

    option.value =
      row[
        textField
      ]

    datalist.appendChild(
      option
    )

  }
)

}

//  =====================================================
//  LOOKUP HELPERS
//  =====================================================

export function getLookupItem({

  data,

  field,

  value

}) {

  return (
    data.find(
      row =>
        String(
          row[field]
        ) ===
        String(
          value
        )
    ) || null
  )

}

export function getLookupName({

  data,

  valueField,

  textField,

  value

}) {

  const item =
    getLookupItem({

      data,

      field:
        valueField,

      value

    })

  return item
    ? item[
        textField
      ]
    : ''

}

export function lookupExists({

  data,

  field,

  value

}) {

  return Boolean(

    getLookupItem({

      data,

      field,

      value

    })

  )

}

//  =====================================================
//  FILTER LOOKUP
//  =====================================================

export function filterLookup({

  data,

  searchTerm,

  fields

}) {

  if (
    !searchTerm
  ) {

    return data

  }

  const term =
    searchTerm
      .toLowerCase()

  return data.filter(
    row =>

      fields.some(
        field =>

          String(
            row[
              field
            ] || ''
          )

            .toLowerCase()

            .includes(
              term
            )
      )
  )

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

        data: [],

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

      data:
        rows,

      valueField,

      textField,

      placeholder

    })

  }
)

}

//  =====================================================
//  LOCATION CHAIN
//  =====================================================

export function populateLocationChain({

  countyId,

  subcountyId,

  townId,

  loadSubcounties,

  loadTowns

}) {

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

export function loadLookupById({

  data,

  idField,

  id

}) {

  return (
    data.find(
      row =>
        String(
          row[idField]
        ) ===
        String(id)
    ) || null
  )

}

export async function populateSelectFromLookup({

  selectId,

  table,

  valueField,

  textField,

  orderBy,

  placeholder =
    'Select Option',

  filters = []

}) {

  const rows =
    await loadLookupCached({

      table,

      filters,

      orderBy

    })

  populateSelect({

    selectId,

    data: rows,

    valueField,

    textField,

    placeholder

  })

  return rows

}

export async function populateDataListFromLookup({

  datalistId,

  table,

  textField,

  orderBy,

  filters = []

}) {

  const rows =
    await loadLookupCached({

      table,

      filters,

      orderBy

    })

  populateDataList({

    datalistId,

    data: rows,

    textField

  })

  return rows

}

export async function loadStatusLookup(

  entityType

) {

  return loadLookupCached({

    table:
      'status_master',

    filters: [

      {

        field:
          'entity_type',

        value:
          entityType

      }

    ],

    orderBy:
      'status_name'

  })

}

export async function loadCountyLookup() {

  return loadLookupCached({

    table:
      'county_master',

    orderBy:
      'county_name'

  })

}

export async function loadCountryLookup() {

  return loadLookupCached({

    table:
      'country_master',

    orderBy:
      'country_name'

  })

}

export async function loadSponsorLookup() {

  return loadLookupCached({

    table:
      'sponsor_master',

    orderBy:
      'sponsor_name'

  })

}

export async function loadClassificationLookup() {

  return loadLookupCached({

    table:
      'classification_master',

    orderBy:
      'classification_code'

  })

}

export async function loadRankingTypeLookup() {

  return loadLookupCached({

    table:
      'ranking_type_master',

    orderBy:
      'ranking_type_name'

  })

}

export async function loadParticipantStatusLookup() {

  return loadLookupCached({

    table:
      'participant_status_master',

    orderBy:
      'status_name'

  })

}

export async function loadEventCategoryLookup() {

  return loadLookupCached({

    table:
      'event_category_master',

    orderBy:
      'category_name'

  })

}

export async function loadEventTypeLookup() {

  return loadLookupCached({

    table:
      'event_type_master',

    orderBy:
      'event_type_name'

  })

}

export async function loadTeamLookup() {

  return loadLookupCached({

    table:
      'teams',

    orderBy:
      'team_name'

  })

}

export async function loadAthleteLookup() {

  return loadLookupCached({

    table:
      'athletes',

    orderBy:
      'first_name'

  })

}

export async function loadTrainingLookup() {

  return loadLookupCached({

    table:
      'training_log',

    orderBy:
      'training_date'

  })

}
export async function loadEventLookup() {

  return loadLookupCached({

    table:
      'events',

    orderBy:
      'event_name'

  })

}

export async function loadProgramLookup(
  eventId = null
) {

  const filters = []

  if (eventId) {

    filters.push({

      field:
        'event_id',

      value:
        eventId

    })

  }

  return loadLookupCached({

    table:
      'event_programs',

    filters,

    orderBy:
      'program_name'

  })

}

export async function loadRoleLookup() {

  return loadLookupCached({

    table:
      'role_master',

    orderBy:
      'role_name'

  })

}




