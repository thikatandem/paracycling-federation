// =====================================================
// IMPORT CONSTANTS
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// SUPPORTED IMPORT TYPES
// =====================================================

export const SUPPORTED_TYPES = Object.freeze({

    CSV: 'csv',

    XLSX: 'xlsx',

    XLS: 'xls'

})

// =====================================================
// IMPORT LIMITS
// =====================================================

export const MAX_ROWS = 10000

export const DEFAULT_BATCH_SIZE = 500

// =====================================================
// CSV OPTIONS
// =====================================================

export const CSV_OPTIONS = Object.freeze({

    delimiter: ',',

    quote: '"',

    escape: '"',

    lineBreak: '\n',

    hasHeader: true

})

// =====================================================
// DATE FORMATS
// =====================================================

export const DATE_FORMATS = Object.freeze([

    'YYYY-MM-DD',

    'DD/MM/YYYY',

    'MM/DD/YYYY'

])

// =====================================================
// TIME FORMATS
// =====================================================

export const TIME_FORMATS = Object.freeze([

    'HH:mm',

    'HH:mm:ss'

])

// =====================================================
// IMPORT STATUS
// =====================================================

export const IMPORT_STATUS = Object.freeze({

    READY: 'ready',

    READING: 'reading',

    VALIDATING: 'validating',

    RESOLVING: 'resolving',

    PREVIEWING: 'previewing',

    COMMITTING: 'committing',

    FINISHED: 'finished',

    FAILED: 'failed'

})

// =====================================================
// TEMPLATE COLORS
// =====================================================

export const REQUIRED_FIELD_COLOR = '#FFF2CC'