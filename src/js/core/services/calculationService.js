export function safeNumber(
  value
) {
  return Number(
    value || 0
  )
}

export function calculatePercentage(
  count,
  total,
  decimals = 1
) {
  const denominator =
    Number(
      total || 0
    )

  if (!denominator) {
    return '0%'
  }

  return `${(
    (
      Number(count || 0) /
      denominator
    ) * 100
  ).toFixed(decimals)}%`
}

export function calculateDateDuration(
  startDate,
  endDate,
  {
    suffix = 'Days'
  } = {}
) {
  if (
    !startDate ||
    !endDate
  ) {
    return '-'
  }

  const start =
    new Date(
      startDate
    )

  const end =
    new Date(
      endDate
    )

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return '-'
  }

  const days =
    Math.floor(
      (
        end -
        start
      ) /
      86400000
    )

  return `${days} ${suffix}`
}


export function calculateElapsedDateDuration(
  startDate,
  endDate = null
) {
  if (!startDate) {
    return ''
  }

  const start =
    new Date(
      startDate
    )

  const end =
    endDate ?
      new Date(endDate) :
      new Date()

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return ''
  }

  const diffDays =
    Math.floor(
      (
        end - start
      ) / 86400000
    )

  if (diffDays < 30) {
    return `${diffDays}d`
  }

  const months =
    Math.floor(
      diffDays / 30
    )

  if (months < 12) {
    return `${months}m`
  }

  const years =
    Math.floor(
      months / 12
    )

  const remainingMonths =
    months % 12

  return `${years}y ${remainingMonths}m`
}

export function calculateTotal(values = []) {
  return values.reduce(
    (total, value) => total + Number(value || 0),
    0
  )
}

export function calculateAverage(values = []) {
  const numbers = values
    .map(value => Number(value))
    .filter(Number.isFinite)

  if (numbers.length === 0) {
    return 0
  }

  return calculateTotal(numbers) / numbers.length
}

export function attendancePercentage(attended = 0, total = 0) {
  const denominator = Number(total || 0)

  if (denominator <= 0) {
    return 0
  }

  return (Number(attended || 0) / denominator) * 100
}


export function createTrainingMetricCalculators({
  getValue,
  setValue,
  startTimeId = 'startTime',
  endTimeId = 'endTime',
  durationId = 'durationMinutes',
  distanceId = 'distanceKm',
  averageSpeedId = 'avgSpeedKmh'
} = {}) {
  function calculateAverageSpeed() {
    const distance =
      Number(
        getValue(distanceId)
      )

    const duration =
      Number(
        getValue(durationId)
      )

    if (!distance || !duration) {
      setValue(
        averageSpeedId,
        ''
      )
      return
    }

    const speed =
      distance /
      (duration / 60)

    setValue(
      averageSpeedId,
      speed.toFixed(2)
    )
  }

  function calculateDuration() {
    const start =
      getValue(startTimeId)

    const end =
      getValue(endTimeId)

    if (!start || !end) {
      return
    }

    const startDate =
      new Date(
        `1970-01-01T${start}`
      )

    const endDate =
      new Date(
        `1970-01-01T${end}`
      )

    const minutes =
      Math.round(
        (
          endDate -
          startDate
        ) / 60000
      )

    if (minutes >= 0) {
      setValue(
        durationId,
        minutes
      )
      calculateAverageSpeed()
    }
  }

  return {
    calculateDuration,
    calculateAverageSpeed
  }
}
