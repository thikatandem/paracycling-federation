// =====================================================
// PAGINATION SERVICE
// ParaCycling Federation Management System
// =====================================================

import {
  PAGE_SIZE
}
  from './constants.js'
// =====================================================
// PAGINATOR FACTORY
// =====================================================

export function createPaginator({

  pageSize =
  PAGE_SIZE,

  storageKey = null

} = {}) {
  let data = []

  let currentPage = 1

  let currentPageSize =
    pageSize

  restoreState()

  // ===================================================
  // DATA
  // ===================================================

  function setData(
    rows = []
  ) {
    data =
      Array.isArray(rows) ?
        rows :
        []

    const totalPages =
      getTotalPages()

    if (
      currentPage >
      totalPages
    ) {
      currentPage =
        totalPages || 1
    }

    saveState()
  }

  function getData() {
    return [...data]
  }

  // ===================================================
  // PAGE INFO
  // ===================================================

  function getTotalRows() {
    return data.length
  }

  function getTotalPages() {
    return Math.max(
      1,
      Math.ceil(
        data.length /
        currentPageSize
      )
    )
  }

  function getCurrentPage() {
    return currentPage
  }

  function getPageSize() {
    return currentPageSize
  }

  // ===================================================
  // PAGE DATA
  // ===================================================

  function getPage() {
    const start =
      (currentPage - 1) *
      currentPageSize

    const end =
      start +
      currentPageSize

    return data.slice(
      start,
      end
    )
  }

  function getStartIndex() {
    if (
      data.length === 0
    ) {
      return 0
    }

    return (
      (
        currentPage - 1
      ) *
      currentPageSize
    ) + 1
  }

  function getEndIndex() {
    return Math.min(

      currentPage *
      currentPageSize,

      data.length

    )
  }

  // ===================================================
  // NAVIGATION
  // ===================================================

  function first() {
    currentPage = 1

    saveState()

    return getPage()
  }

  function last() {
    currentPage =
      getTotalPages()

    saveState()

    return getPage()
  }

  function next() {
    if (
      hasNext()
    ) {
      currentPage++

      saveState()
    }

    return getPage()
  }

  function previous() {
    if (
      hasPrevious()
    ) {
      currentPage--

      saveState()
    }

    return getPage()
  }

  function goTo(
    page
  ) {
    const target =
      Number(page)

    if (
      Number.isNaN(target)
    ) {
      return getPage()
    }

    currentPage =
      Math.min(
        Math.max(
          target,
          1
        ),
        getTotalPages()
      )

    saveState()

    return getPage()
  }

  // ===================================================
  // STATUS
  // ===================================================

  function hasNext() {
    return (
      currentPage <
      getTotalPages()
    )
  }

  function hasPrevious() {
    return (
      currentPage > 1
    )
  }

  // ===================================================
  // PAGE SIZE
  // ===================================================

  function setPageSize(
    size
  ) {
    const parsed =
      Number(size)

    if (
      Number.isNaN(parsed) ||
      parsed <= 0
    ) {
      return
    }

    currentPageSize =
      parsed

    currentPage = 1

    saveState()
  }

  // ===================================================
  // INFO
  // ===================================================

  function getPageInfo() {
    return {

      currentPage,

      pageSize:
        currentPageSize,

      totalRows:
        getTotalRows(),

      totalPages:
        getTotalPages(),

      startIndex:
        getStartIndex(),

      endIndex:
        getEndIndex(),

      hasNext:
        hasNext(),

      hasPrevious:
        hasPrevious()

    }
  }

  // ===================================================
  // STORAGE
  // ===================================================

  function saveState() {
    if (
      !storageKey
    ) {
      return
    }

    localStorage.setItem(

      storageKey,

      JSON.stringify({

        currentPage,

        pageSize:
          currentPageSize

      })

    )
  }

  function restoreState() {
    if (
      !storageKey
    ) {
      return
    }

    try {
      const state =
        JSON.parse(

          localStorage.getItem(
            storageKey
          )

        )

      if (!state) {
        return
      }

      currentPage =
        state.currentPage || 1

      currentPageSize =
        state.pageSize ||
        pageSize
    } catch {
      currentPage = 1
    }
  }

  function clearState() {
    if (
      !storageKey
    ) {
      return
    }

    localStorage.removeItem(
      storageKey
    )
  }

  // ===================================================
  // API
  // ===================================================

  return {

    setData,

    getData,

    getPage,

    getPageInfo,

    getTotalRows,

    getTotalPages,

    getCurrentPage,

    getPageSize,

    first,

    last,

    next,

    previous,

    goTo,

    hasNext,

    hasPrevious,

    setPageSize,

    saveState,

    restoreState,

    clearState

  }
}

export function paginateRows({

  paginator

}) {
  return paginator.getPage()
}

export function applyPagination({

  rows,

  paginator

}) {
  return paginateRows({

    rows,

    paginator

  })
}

export function wirePaginationButtons({

  paginator,

  previousButton,

  nextButton,

  onPageChange

}) {
  previousButton
    ?.addEventListener(
      'click',
      () => {
        paginator.previous()

        onPageChange()
      }
    )

  nextButton
    ?.addEventListener(
      'click',
      () => {
        paginator.next()

        onPageChange()
      }
    )
}

export function updatePaginationUi({

  paginator,

  infoElement,

  previousButton,

  nextButton

}) {
  const info =
    paginator.getPageInfo()

  if (infoElement) {
    infoElement.textContent =
      `Page ${info.currentPage} of ${info.totalPages}`
  }

  if (previousButton) {
    previousButton.disabled =
      !info.hasPrevious
  }

  if (nextButton) {
    nextButton.disabled =
      !info.hasNext
  }
}

export function resetPagination(
  paginator
) {
  paginator.goTo(1)
}

export function refreshPagination({

  paginator,

  rows

}) {
  paginator.setData(
    rows || []
  )

  return paginator.getPage()
}

export function bindPagination({

  paginator,

  previousButtonId,

  nextButtonId,

  infoElementId,

  onChange

}) {
  const previousButton =
    document.getElementById(
      previousButtonId
    )

  const nextButton =
    document.getElementById(
      nextButtonId
    )

  previousButton
    ?.addEventListener(
      'click',
      () => {
        paginator.previous()

        onChange?.()
      }
    )

  nextButton
    ?.addEventListener(
      'click',
      () => {
        paginator.next()

        onChange?.()
      }
    )

  const infoElement =
  document.getElementById(
    infoElementId
  )

  updatePaginationUi({

    paginator,

    infoElement,

    previousButton,

    nextButton

  })
}

export function getPagedRows({

  rows,

  page,

  pageSize

}) {
  const start =
    (page - 1) *
    pageSize

  return rows.slice(

    start,

    start + pageSize

  )
}


export function createSimplePaginationUpdater({
  getItemCount,
  getCurrentPage,
  pageSize = PAGE_SIZE,
  infoElementId = null,
  previousButtonId = null,
  nextButtonId = null,
  includeRecordCount = false
} = {}) {
  return function updateSimplePagination() {
    const itemCount =
      Math.max(
        0,
        Number(
          getItemCount?.() || 0
        )
      )

    const currentPage =
      Math.max(
        1,
        Number(
          getCurrentPage?.() || 1
        )
      )

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          itemCount / pageSize
        )
      )

    const info =
      infoElementId ?
        document.getElementById(
          infoElementId
        ) :
        null

    if (info) {
      info.textContent =
        includeRecordCount ?
          `Page ${currentPage} of ${totalPages} (${itemCount} records)` :
          `Page ${currentPage} of ${totalPages}`
    }

    const previousButton =
      previousButtonId ?
        document.getElementById(
          previousButtonId
        ) :
        null

    const nextButton =
      nextButtonId ?
        document.getElementById(
          nextButtonId
        ) :
        null

    if (previousButton) {
      previousButton.disabled =
        currentPage <= 1
    }

    if (nextButton) {
      nextButton.disabled =
        currentPage >= totalPages
    }

    return {
      currentPage,
      totalPages,
      itemCount
    }
  }
}


export function createPaginatorUiUpdater({
  paginator,
  infoElementId,
  previousButtonId,
  nextButtonId
} = {}) {
  return function updatePaginatorUi() {
    return updatePaginationUi({
      paginator,
      infoElement:
        document.getElementById(
          infoElementId
        ),
      previousButton:
        document.getElementById(
          previousButtonId
        ),
      nextButton:
        document.getElementById(
          nextButtonId
        )
    })
  }
}


export function createPaginationInfoUpdater({
  getItemCount,
  getCurrentPage,
  pageSize = PAGE_SIZE,
  infoElementId,
  includeRecordCount = true
} = {}) {
  return function updatePaginationInfo() {
    const itemCount =
      Math.max(
        0,
        Number(
          getItemCount?.() || 0
        )
      )

    const currentPage =
      Math.max(
        1,
        Number(
          getCurrentPage?.() || 1
        )
      )

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          itemCount /
          pageSize
        )
      )

    const info =
      document.getElementById(
        infoElementId
      )

    if (info) {
      info.textContent =
        includeRecordCount ?
          `Page ${currentPage} of ${totalPages} (${itemCount} records)` :
          `Page ${currentPage} of ${totalPages}`
    }

    return {
      currentPage,
      totalPages,
      itemCount
    }
  }
}

export function createNumberedPaginationRenderer({
  getItemCount,
  getCurrentPage,
  pageSize = PAGE_SIZE,
  containerId = 'paginationContainer',
  infoElementId = null,
  infoMode = 'records',
  handlerName = 'goToPage',
  control = 'link'
} = {}) {
  return function renderNumberedPagination() {
    const itemCount =
      Math.max(
        0,
        Number(
          getItemCount?.() || 0
        )
      )

    const currentPage =
      Math.max(
        1,
        Number(
          getCurrentPage?.() || 1
        )
      )

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          itemCount /
          pageSize
        )
      )

    const container =
      document.getElementById(
        containerId
      )

    if (!container) {
      return {
        currentPage,
        totalPages,
        itemCount
      }
    }

    if (infoElementId) {
      const info =
        document.getElementById(
          infoElementId
        )

      if (info) {
        if (infoMode === 'records') {
          info.textContent =
            `${itemCount} record(s)`
        } else if (
          infoMode ===
          'page-records'
        ) {
          info.textContent =
            `Page ${currentPage} of ${totalPages} (${itemCount} records)`
        } else {
          info.textContent =
            `Page ${currentPage} of ${totalPages}`
        }
      }
    }

    container.innerHTML = ''

    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {
      const activeClass =
        page === currentPage ?
          ' active' :
          ''

      const controlHtml =
        control === 'button' ?
          `
            <button
              type="button"
              class="page-link"
              onclick="${handlerName}(${page})"
            >
              ${page}
            </button>
          ` :
          `
            <a
              href="#"
              class="page-link"
              onclick="${handlerName}(${page})"
            >
              ${page}
            </a>
          `

      container.insertAdjacentHTML(
        'beforeend',
        `
          <li class="page-item${activeClass}">
            ${controlHtml}
          </li>
        `
      )
    }

    return {
      currentPage,
      totalPages,
      itemCount
    }
  }
}
