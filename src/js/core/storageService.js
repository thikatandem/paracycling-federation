// =====================================================
// STORAGE SERVICE
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// STORAGE TYPES
// =====================================================

export const STORAGE_TYPES = {

  LOCAL:
    'local',

  SESSION:
    'session'

}

// =====================================================
// INTERNAL STORAGE
// =====================================================

function getStorage(
  type = STORAGE_TYPES.LOCAL
) {

  return type ===
    STORAGE_TYPES.SESSION
      ? sessionStorage
      : localStorage

}

// =====================================================
// BASIC SET
// =====================================================

export function setItem({

  key,

  value,

  type =
    STORAGE_TYPES.LOCAL

}) {

  try {

    getStorage(type)
      .setItem(
        key,
        JSON.stringify(value)
      )

    return true

  } catch (error) {

    console.error(
      'Storage Error:',
      error
    )

    return false

  }

}

// =====================================================
// BASIC GET
// =====================================================

export function getItem({

  key,

  defaultValue = null,

  type =
    STORAGE_TYPES.LOCAL

}) {

  try {

    const value =
      getStorage(type)
        .getItem(key)

    if (
      value === null
    ) {

      return defaultValue

    }

    return JSON.parse(
      value
    )

  } catch {

    return defaultValue

  }

}

// =====================================================
// REMOVE
// =====================================================

export function removeItem({

  key,

  type =
    STORAGE_TYPES.LOCAL

}) {

  getStorage(type)
    .removeItem(key)

}

// =====================================================
// EXISTS
// =====================================================

export function exists({

  key,

  type =
    STORAGE_TYPES.LOCAL

}) {

  return (
    getStorage(type)
      .getItem(key) !== null
  )

}

// =====================================================
// CLEAR
// =====================================================

export function clearStorage(
  type =
    STORAGE_TYPES.LOCAL
) {

  getStorage(type)
    .clear()

}

// =====================================================
// KEYS
// =====================================================

export function getKeys(
  type =
    STORAGE_TYPES.LOCAL
) {

  return Object.keys(
    getStorage(type)
  )

}

// =====================================================
// TTL STORAGE
// =====================================================

export function setWithExpiry({

  key,

  value,

  ttl,

  type =
    STORAGE_TYPES.LOCAL

}) {

  const item = {

    value,

    expiry:
      Date.now() + ttl

  }

  return setItem({

    key,

    value:
      item,

    type

  })

}

// =====================================================
// TTL GET
// =====================================================

export function getWithExpiry({

  key,

  defaultValue = null,

  type =
    STORAGE_TYPES.LOCAL

}) {

  const item =
    getItem({

      key,

      defaultValue:
        null,

      type

    })

  if (!item) {

    return defaultValue

  }

  if (
    Date.now() >
    item.expiry
  ) {

    removeItem({
      key,
      type
    })

    return defaultValue

  }

  return item.value

}

// =====================================================
// PAGE STATE
// =====================================================

export function savePageState({

  page,

  state

}) {

  setItem({

    key:
      `page-state:${page}`,

    value:
      state

  })

}

// =====================================================
// RESTORE PAGE STATE
// =====================================================

export function getPageState(
  page
) {

  return getItem({

    key:
      `page-state:${page}`,

    defaultValue:
      {}

  })

}

// =====================================================
// FILTERS
// =====================================================

export function saveFilters({

  page,

  filters

}) {

  setItem({

    key:
      `filters:${page}`,

    value:
      filters

  })

}

export function getFilters(
  page
) {

  return getItem({

    key:
      `filters:${page}`,

    defaultValue:
      {}

  })

}

// =====================================================
// SEARCH TERMS
// =====================================================

export function saveSearchTerm({

  page,

  searchTerm

}) {

  setItem({

    key:
      `search:${page}`,

    value:
      searchTerm

  })

}

export function getSearchTerm(
  page
) {

  return getItem({

    key:
      `search:${page}`,

    defaultValue:
      ''

  })

}

// =====================================================
// SORTING
// =====================================================

export function saveSort({

  page,

  field,

  direction

}) {

  setItem({

    key:
      `sort:${page}`,

    value: {

      field,

      direction

    }

  })

}

export function getSort(
  page
) {

  return getItem({

    key:
      `sort:${page}`,

    defaultValue: {

      field: '',

      direction:
        'asc'

    }

  })

}

// =====================================================
// PAGINATION
// =====================================================

export function savePagination({

  page,

  currentPage,

  pageSize

}) {

  setItem({

    key:
      `pagination:${page}`,

    value: {

      currentPage,

      pageSize

    }

  })

}

export function getPagination(
  page
) {

  return getItem({

    key:
      `pagination:${page}`,

    defaultValue: {

      currentPage:
        1,

      pageSize:
        10

    }

  })

}

// =====================================================
// TABLE SETTINGS
// =====================================================

export function saveTableSettings({

  table,

  settings

}) {

  setItem({

    key:
      `table:${table}`,

    value:
      settings

  })

}

export function getTableSettings(
  table
) {

  return getItem({

    key:
      `table:${table}`,

    defaultValue:
      {}

  })

}

// =====================================================
// COLUMN VISIBILITY
// =====================================================

export function saveVisibleColumns({

  table,

  columns

}) {

  setItem({

    key:
      `columns:${table}`,

    value:
      columns

  })

}

export function getVisibleColumns(
  table
) {

  return getItem({

    key:
      `columns:${table}`,

    defaultValue:
      []

  })

}

// =====================================================
// USER PREFERENCES
// =====================================================

export function savePreference({

  key,

  value

}) {

  setItem({

    key:
      `pref:${key}`,

    value

  })

}

export function getPreference({

  key,

  defaultValue = null

}) {

  return getItem({

    key:
      `pref:${key}`,

    defaultValue

  })

}

// =====================================================
// EXPORT SETTINGS
// =====================================================

export function saveExportSettings({

  page,

  settings

}) {

  setItem({

    key:
      `export:${page}`,

    value:
      settings

  })

}

export function getExportSettings(
  page
) {

  return getItem({

    key:
      `export:${page}`,

    defaultValue:
      {}

  })

}

// =====================================================
// CLEANUP
// =====================================================

export function removePageData(
  page
) {

  removeItem({
    key:
      `page-state:${page}`
  })

  removeItem({
    key:
      `filters:${page}`
  })

  removeItem({
    key:
      `search:${page}`
  })

  removeItem({
    key:
      `sort:${page}`
  })

  removeItem({
    key:
      `pagination:${page}`
  })

}