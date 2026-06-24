// =====================================================
// PAGE STATE SERVICE
// =====================================================

export function createPageState({

  pageSize = 10

} = {}) {

  return {

  pageSize,

  currentPage: 1,

  selectedId: null,

  selectedRow: null,

  rows: [],

  filteredRows: [],

  filters: {},

  searchTerm: '',

  sortField: '',

  sortDirection: 'asc',

  lookupCache: {},

  metadata: {}

}

}



export function resetState(
  state
) {

  state.currentPage = 1

  state.selectedId =
    null

  state.rows = []

  state.filteredRows = []

  state.filters = {}

}

export function setRows({

  state,

  rows

}) {

  state.rows = rows

  state.filteredRows =
    [...rows]

}

export function getPageRows({

  state

}) {

  const start =
    (
      state.currentPage - 1
    ) *
    state.pageSize

  return state.filteredRows
    .slice(
      start,
      start +
      state.pageSize
    )

}

export function setSearchTerm({

  state,

  searchTerm

}) {

  state.searchTerm =
    searchTerm || ''

}

export function setSelectedRow({

  state,

  id,

  row

}) {

  state.selectedId =
    id || null

  state.selectedRow =
    row || null

}

export function setSort({

  state,

  field,

  direction = 'asc'

}) {

  state.sortField =
    field || ''

  state.sortDirection =
    direction

}

export function setPage({

  state,

  page

}) {

  state.currentPage =
    Math.max(
      1,
      Number(page) || 1
    )

}

export function setFilter({

  state,

  key,

  value

}) {

  state.filters[key] =
    value

}

export function clearFilters(
  state
) {

  state.filters = {}

}

export function setLookupCache({

  state,

  key,

  value

}) {

  state.lookupCache[key] =
    value

}

export function getLookupCache({

  state,

  key

}) {

  return (
    state.lookupCache[key] ||
    null
  )

}

export function setMetadata({

  state,

  key,

  value

}) {

  state.metadata[key] =
    value

}

export function getMetadata({

  state,

  key

}) {

  return (
    state.metadata[key] ||
    null
  )

}


