// =====================================================
// EXPORT DEPENDENCY LOADER
// Loads browser libraries only when an export actually needs them.
// Local project files are tried first; CDN is only a final fallback.
// =====================================================

const loadingScripts = new Map()

function asArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function configuredPaths(key) {
  return asArray(
    window.EXPORT_LIBRARY_PATHS?.[key]
  ).filter(Boolean)
}

function loadScript(src) {
  if (loadingScripts.has(src)) {
    return loadingScripts.get(src)
  }

  const promise = new Promise((resolve, reject) => {
    const absoluteSrc = new URL(src, document.baseURI).href

    const existing = [...document.scripts].find(
      script => script.src === absoluteSrc
    )

    if (existing) {
      if (existing.dataset.exportDependencyLoaded === 'true') {
        resolve()
        return
      }

      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true }
      )

      // A script may already have loaded before this loader was called.
      // Give the caller a chance to re-check the expected global.
      setTimeout(resolve, 0)
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.crossOrigin = 'anonymous'

    script.addEventListener(
      'load',
      () => {
        script.dataset.exportDependencyLoaded = 'true'
        resolve()
      },
      { once: true }
    )

    script.addEventListener(
      'error',
      () => reject(new Error(`Failed to load ${src}`)),
      { once: true }
    )

    document.head.append(script)
  })

  loadingScripts.set(src, promise)
  return promise
}

async function loadFirstWorking({
  label,
  candidates,
  isReady,
  getValue
}) {
  if (isReady()) return getValue()

  const attempted = []

  for (const src of candidates) {
    if (!src || attempted.includes(src)) continue
    attempted.push(src)

    try {
      await loadScript(src)
    } catch {
      continue
    }

    if (isReady()) {
      return getValue()
    }
  }

  throw new Error(
    `${label} could not be loaded. Tried: ${attempted.join(', ')}`
  )
}

export async function ensureChartJs() {
  return loadFirstWorking({
    label: 'Chart.js',
    candidates: [
      ...configuredPaths('chartJs'),

      // Your stated local location: js/core/charts/
      '/js/core/charts/chart.umd.min.js',
      '/js/core/charts/chart.umd.js',
      '/js/core/charts/chart.min.js',
      '/js/core/charts/chart.js',
      'js/core/charts/chart.umd.min.js',
      'js/core/charts/chart.umd.js',
      'js/core/charts/chart.min.js',
      'js/core/charts/chart.js',

      // Common CoreUI/vendor locations
      '/vendors/chart.js/js/chart.umd.js',
      '/vendors/chart.js/js/chart.umd.min.js',
      'vendors/chart.js/js/chart.umd.js',
      'vendors/chart.js/js/chart.umd.min.js',

      // Final network fallback
      'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js'
    ],
    isReady: () => typeof window.Chart === 'function',
    getValue: () => window.Chart
  })
}

export async function ensureExcelJs() {
  return loadFirstWorking({
    label: 'ExcelJS',
    candidates: [
      ...configuredPaths('excelJs'),

      '/js/core/exceljs/exceljs.min.js',
      '/js/core/excel/exceljs.min.js',
      '/js/core/exceljs.min.js',
      'js/core/exceljs/exceljs.min.js',
      'js/core/excel/exceljs.min.js',
      'js/core/exceljs.min.js',

      '/vendors/exceljs/exceljs.min.js',
      'vendors/exceljs/exceljs.min.js',

      'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js'
    ],
    isReady: () =>
      typeof window.ExcelJS?.Workbook === 'function',
    getValue: () => window.ExcelJS
  })
}

export async function ensureFileSaver() {
  return loadFirstWorking({
    label: 'FileSaver',
    candidates: [
      ...configuredPaths('fileSaver'),

      '/js/core/filesaver/FileSaver.min.js',
      '/js/core/file-saver/FileSaver.min.js',
      '/js/core/FileSaver.min.js',
      'js/core/filesaver/FileSaver.min.js',
      'js/core/file-saver/FileSaver.min.js',
      'js/core/FileSaver.min.js',

      '/vendors/file-saver/FileSaver.min.js',
      '/vendors/filesaver/FileSaver.min.js',
      'vendors/file-saver/FileSaver.min.js',
      'vendors/filesaver/FileSaver.min.js',

      'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
    ],
    isReady: () => typeof window.saveAs === 'function',
    getValue: () => window.saveAs
  })
}
