// =====================================================
// SEARCH SERVICE
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// HELPERS
// =====================================================

function normalize(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return ''

  }

  return String(value)
    .trim()
    .toLowerCase()

}

// =====================================================
// TEXT SEARCH
// =====================================================

export function containsSearch({

  value,

  searchTerm

}) {

  return normalize(value)
    .includes(
      normalize(searchTerm)
    )

}

export function startsWithSearch({

  value,

  searchTerm

}) {

  return normalize(value)
    .startsWith(
      normalize(searchTerm)
    )

}

export function exactSearch({

  value,

  searchTerm

}) {

  return (
    normalize(value) ===
    normalize(searchTerm)
  )

}

// =====================================================
// COLLECTION SEARCH
// =====================================================

export function searchCollection({

  data = [],

  searchTerm = '',

  fields = []

}) {

  if (
    !searchTerm ||
    !fields.length
  ) {

    return [...data]

  }

  const term =
    normalize(searchTerm)

  return data.filter(
    row =>

      fields.some(
        field =>

          normalize(
            row[field]
          ).includes(term)
      )
  )

}

// =====================================================
// MULTI TERM SEARCH
// =====================================================

export function multiTermSearch({

  data = [],

  searchTerm = '',

  fields = []

}) {

  if (
    !searchTerm
  ) {

    return [...data]

  }

  const terms =
    searchTerm
      .split(' ')
      .filter(Boolean)

  return data.filter(
    row =>

      terms.every(
        term =>

          fields.some(
            field =>

              normalize(
                row[field]
              ).includes(
                normalize(term)
              )
          )
      )
  )

}

// =====================================================
// STATUS FILTER
// =====================================================

export function filterByStatus({

  data = [],

  statusField = 'status',

  status

}) {

  if (!status) {

    return [...data]

  }

  return data.filter(
    row =>

      String(
        row[
          statusField
        ]
      ) ===
      String(status)
  )

}

// =====================================================
// LOOKUP FILTER
// =====================================================

export function filterByLookup({

  data = [],

  field,

  value

}) {

  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {

    return [...data]

  }

  return data.filter(
    row =>

      String(
        row[field]
      ) ===
      String(value)
  )

}

// =====================================================
// BOOLEAN FILTER
// =====================================================

export function filterByBoolean({

  data = [],

  field,

  value

}) {

  if (
    value === null ||
    value === undefined
  ) {

    return [...data]

  }

  return data.filter(
    row =>

      Boolean(
        row[field]
      ) ===
      Boolean(value)
  )

}

// =====================================================
// DATE RANGE
// =====================================================

export function dateRangeSearch({

  data = [],

  field,

  startDate,

  endDate

}) {

  if (
    !startDate &&
    !endDate
  ) {

    return [...data]

  }

  return data.filter(
    row => {

      const value =
        new Date(
          row[field]
        )

      if (
        startDate &&
        value <
        new Date(
          startDate
        )
      ) {

        return false

      }

      if (
        endDate &&
        value >
        new Date(
          endDate
        )
      ) {

        return false

      }

      return true

    }
  )

}

// =====================================================
// NUMERIC RANGE
// =====================================================

export function numericRangeSearch({

  data = [],

  field,

  min,

  max

}) {

  return data.filter(
    row => {

      const value =
        Number(
          row[field]
        )

      if (
        min !== null &&
        min !== undefined &&
        value < min
      ) {

        return false

      }

      if (
        max !== null &&
        max !== undefined &&
        value > max
      ) {

        return false

      }

      return true

    }
  )

}

// =====================================================
// SORTING
// =====================================================

export function sortBy({

  data = [],

  field,

  direction = 'asc'

}) {

  const rows =
    [...data]

  rows.sort(
    (a, b) => {

      const valueA =
        normalize(
          a[field]
        )

      const valueB =
        normalize(
          b[field]
        )

      if (
        valueA <
        valueB
      ) {

        return direction === 'asc'
          ? -1
          : 1

      }

      if (
        valueA >
        valueB
      ) {

        return direction === 'asc'
          ? 1
          : -1

      }

      return 0

    }
  )

  return rows

}

// =====================================================
// GLOBAL FILTER ENGINE
// =====================================================

export function applyFilters({

  data = [],

  searchTerm = '',

  searchFields = [],

  filters = {},

  dateFilters = [],

  numericFilters = []

}) {

  let results =
    [...data]

  // Search

  if (
    searchTerm &&
    searchFields.length
  ) {

    results =
      searchCollection({

        data:
          results,

        searchTerm,

        fields:
          searchFields

      })

  }

  // Exact Filters

  Object.entries(
    filters
  ).forEach(
    ([field, value]) => {

      if (
        value !== '' &&
        value !== null &&
        value !== undefined
      ) {

        results =
          filterByLookup({

            data:
              results,

            field,

            value

          })

      }

    }
  )

  // Date Filters

  dateFilters.forEach(
    filter => {

      results =
        dateRangeSearch({

          data:
            results,

          field:
            filter.field,

          startDate:
            filter.startDate,

          endDate:
            filter.endDate

        })

    }
  )

  // Numeric Filters

  numericFilters.forEach(
    filter => {

      results =
        numericRangeSearch({

          data:
            results,

          field:
            filter.field,

          min:
            filter.min,

          max:
            filter.max

        })

    }
  )

  return results

}

// =====================================================
// DEBOUNCE
// =====================================================

export function debounce(
  callback,
  delay = 300
) {

  let timeout

  return (...args) => {

    clearTimeout(
      timeout
    )

    timeout =
      setTimeout(
        () =>
          callback(
            ...args
          ),
        delay
      )

  }

}

// =====================================================
// REMOTE SEARCH
// =====================================================

export function createRemoteSearch({

  searchFunction,

  delay = 300

}) {

  return debounce(

    async term => {

      return await searchFunction(
        term
      )

    },

    delay

  )

}

export function searchNestedCollection({

  data = [],

  searchTerm = '',

  fields = []

}) {

  if (
    !searchTerm ||
    !fields.length
  ) {

    return [...data]

  }

  const term =
    normalize(searchTerm)

  return data.filter(
    row =>

      fields.some(
        field => {

          const value =
            field
              .split('.')
              .reduce(
                (obj,key) =>
                  obj?.[key],
                row
              )

          return normalize(
            value
          ).includes(term)

        }
      )
  )

}

export function searchAndSort({

  data,

  searchTerm,

  fields,

  sortField,

  sortDirection = 'asc'

}) {

  const filtered =
    searchCollection({

      data,

      searchTerm,

      fields

    })

  if (!sortField) {

    return filtered

  }

  return [...filtered].sort(
    (a, b) => {

      const left =
        String(
          a[
            sortField
          ] || ''
        )

      const right =
        String(
          b[
            sortField
          ] || ''
        )

      return sortDirection === 'desc'
        ? right.localeCompare(left)
        : left.localeCompare(right)

    }
  )

}