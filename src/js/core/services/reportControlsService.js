// =====================================================
// REPORT CONTROLS SERVICE
// Consistent top/bottom CSV, Excel and PDF controls.
// =====================================================

function createButton(label, action, handler, variant) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `btn btn-${variant} btn-sm`
  button.dataset.reportAction = action
  button.textContent = label
  if (typeof handler === 'function') button.addEventListener('click', handler)
  else button.disabled = true
  return button
}

function createBar({ key, position, title, onCsv, onExcel, onPdf }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'card mb-3 report-export-bar'
  wrapper.dataset.reportExportBar = `${key}-${position}`

  const body = document.createElement('div')
  body.className = 'card-body py-2 d-flex flex-wrap align-items-center justify-content-between gap-2'

  const label = document.createElement('div')
  label.className = 'small fw-semibold text-body-secondary'
  label.textContent = title || 'Download report'

  const actions = document.createElement('div')
  actions.className = 'btn-group btn-group-sm'
  actions.setAttribute('role', 'group')
  actions.setAttribute('aria-label', `${title || 'Report'} downloads`)
  actions.append(
    createButton('CSV', 'csv', onCsv, 'outline-success'),
    createButton('Excel', 'excel', onExcel, 'outline-primary'),
    createButton('PDF', 'pdf', onPdf, 'outline-danger')
  )
  body.append(label, actions)
  wrapper.append(body)
  return wrapper
}

function insertTop(container, bar, anchor) {
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(bar, anchor)
    return
  }
  const firstContent = container.querySelector('.card, .row, .alert, form, table')
  if (firstContent) container.insertBefore(bar, firstContent)
  else container.prepend(bar)
}

function insertBottom(container, bar, anchor) {
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(bar, anchor.nextSibling)
    return
  }
  container.append(bar)
}

export function ensureReportExportBars(options = {}) {
  const key = options.key || options.reportKey || 'report'
  const title = options.title || 'Download report'
  const handlers = options.handlers || {}
  const onCsv = options.onCsv || handlers.csv
  const onExcel = options.onExcel || handlers.excel
  const onPdf = options.onPdf || handlers.pdf
  const container = options.host || document.querySelector('.container-fluid') || document.querySelector('main') || document.body
  if (!container) return null

  document.querySelectorAll(`[data-report-export-bar^="${key}-"]`).forEach(element => element.remove())

  const topBar = createBar({ key, position: 'top', title, onCsv, onExcel, onPdf })
  const bottomBar = createBar({ key, position: 'bottom', title, onCsv, onExcel, onPdf })
  insertTop(container, topBar, options.topAnchor)
  insertBottom(container, bottomBar, options.bottomAnchor)
  return { topBar, bottomBar }
}

export function ensureReportAnalyticsHost({ id, title, beforeSelector = null, host = null } = {}) {
  let element = document.getElementById(id)
  if (element) return element
  const container = host || document.querySelector('.container-fluid') || document.querySelector('main') || document.body
  if (!container) return null
  element = document.createElement('section')
  element.id = id
  element.className = 'report-analytics-host mb-4'
  if (title) {
    const heading = document.createElement('div')
    heading.className = 'd-flex align-items-center justify-content-between mb-2'
    const h = document.createElement('h4')
    h.className = 'mb-0'
    h.textContent = title
    heading.append(h)
    element.append(heading)
  }
  const before = beforeSelector ? container.querySelector(beforeSelector) : null
  if (before) container.insertBefore(element, before)
  else container.append(element)
  return element
}

export function setReportButtonState(root, busy) {
  if (!root) return
  for (const button of root.querySelectorAll('[data-report-action]')) {
    button.disabled = Boolean(busy)
  }
}
