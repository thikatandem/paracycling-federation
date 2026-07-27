export function toDisplayText(
  value,
  fallback = ''
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback
  }

  return String(value)
}


export function formatDateInputValue(
  value,
  fallback = ''
) {
  return value || fallback
}

export function escapeHtml(
  value
) {
  return toDisplayText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function formatFixedNumber(
  value,
  decimals = 2
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return Number(0).toFixed(
      decimals
    )
  }

  return number.toFixed(
    decimals
  )
}

export function formatPercentage(
  value,
  decimals = 1
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return ''
  }

  return `${number.toFixed(decimals)}%`
}

export function formatDate(
  value,
  {
    locale = 'en-GB',
    options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    },
    fallback = ''
  } = {}
) {
  if (!value) {
    return fallback
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback
  }

  return date.toLocaleDateString(
    locale,
    options
  )
}

export function formatDateTime(
  value,
  {
    locale = 'en-GB',
    options = {},
    fallback = ''
  } = {}
) {
  if (!value) {
    return fallback
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fallback
  }

  return date.toLocaleString(
    locale,
    options
  )
}

export function formatTime(
  value,
  fallback = ''
) {
  if (!value) {
    return fallback
  }

  const text =
    String(value)

  return text.length >= 5 ?
    text.slice(0, 5) :
    text
}

export function formatBoolean(
  value,
  {
    trueLabel = 'Yes',
    falseLabel = 'No'
  } = {}
) {
  return value ?
    trueLabel :
    falseLabel
}

export function joinName(
  ...parts
) {
  return parts
    .filter(
      part =>
        String(
          part || ''
        ).trim()
    )
    .join(' ')
    .trim()
}
