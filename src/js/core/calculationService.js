// =====================================================
// CALCULATION SERVICE
// ParaCycling Federation Management System
// =====================================================

// =====================================================
// NUMBER HELPERS
// =====================================================

export function toNumber(
  value,
  defaultValue = 0
) {

  const number =
    Number(value)

  return Number.isNaN(number)
    ? defaultValue
    : number

}

export function round(
  value,
  decimals = 2
) {

  return Number(
    Number(value)
      .toFixed(decimals)
  )

}

// =====================================================
// PERCENTAGES
// =====================================================

export function calculatePercentage(
  value,
  total,
  decimals = 2
) {

  value =
    toNumber(value)

  total =
    toNumber(total)

  if (total <= 0) {

    return 0

  }

  return round(
    (value / total) * 100,
    decimals
  )

}

export function percentageText(
  value,
  total,
  decimals = 2
) {

  return `${calculatePercentage(
    value,
    total,
    decimals
  )}%`

}

// =====================================================
// AVERAGES
// =====================================================

export function calculateAverage(
  values = [],
  decimals = 2
) {

  if (!values.length) {

    return 0

  }

  const total =
    values.reduce(
      (sum, value) =>
        sum +
        toNumber(value),
      0
    )

  return round(
    total / values.length,
    decimals
  )

}

// =====================================================
// TOTALS
// =====================================================

export function calculateTotal(
  values = []
) {

  return values.reduce(
    (sum, value) =>
      sum +
      toNumber(value),
    0
  )

}

// =====================================================
// MINIMUM
// =====================================================

export function calculateMin(
  values = []
) {

  if (!values.length) {

    return 0

  }

  return Math.min(
    ...values.map(
      toNumber
    )
  )

}

// =====================================================
// MAXIMUM
// =====================================================

export function calculateMax(
  values = []
) {

  if (!values.length) {

    return 0

  }

  return Math.max(
    ...values.map(
      toNumber
    )
  )

}

// =====================================================
// AGE
// =====================================================

export function calculateAge(
  dateOfBirth
) {

  if (!dateOfBirth) {

    return 0

  }

  const dob =
    new Date(
      dateOfBirth
    )

  const today =
    new Date()

  let age =
    today.getFullYear() -
    dob.getFullYear()

  const monthDiff =
    today.getMonth() -
    dob.getMonth()

  if (

    monthDiff < 0 ||

    (
      monthDiff === 0 &&
      today.getDate() <
      dob.getDate()
    )

  ) {

    age--

  }

  return age

}

// =====================================================
// DATE DIFFERENCE
// =====================================================

export function daysBetween(
  startDate,
  endDate
) {

  const start =
    new Date(
      startDate
    )

  const end =
    new Date(
      endDate
    )

  const diff =
    end - start

  return Math.floor(
    diff /
    (
      1000 *
      60 *
      60 *
      24
    )
  )

}

export function weeksBetween(
  startDate,
  endDate
) {

  return Math.floor(
    daysBetween(
      startDate,
      endDate
    ) / 7
  )

}

export function monthsBetween(
  startDate,
  endDate
) {

  const start =
    new Date(
      startDate
    )

  const end =
    new Date(
      endDate
    )

  return (
    (
      end.getFullYear() -
      start.getFullYear()
    ) * 12
  ) +
  (
    end.getMonth() -
    start.getMonth()
  )

}

// =====================================================
// DURATION
// =====================================================

export function durationMinutes(
  startTime,
  endTime
) {

  if (
    !startTime ||
    !endTime
  ) {

    return 0

  }

  const start =
    new Date(
      `2000-01-01 ${startTime}`
    )

  const end =
    new Date(
      `2000-01-01 ${endTime}`
    )

  return Math.max(
    0,
    Math.floor(
      (end - start) /
      (1000 * 60)
    )
  )

}

export function durationHours(
  startTime,
  endTime,
  decimals = 2
) {

  return round(

    durationMinutes(
      startTime,
      endTime
    ) / 60,

    decimals

  )

}

// =====================================================
// TRAINING
// =====================================================

export function averageSpeed(

  distanceKm,

  durationMinutes,

  decimals = 2

) {

  distanceKm =
    toNumber(
      distanceKm
    )

  durationMinutes =
    toNumber(
      durationMinutes
    )

  if (
    durationMinutes <= 0
  ) {

    return 0

  }

  return round(

    distanceKm /
    (
      durationMinutes / 60
    ),

    decimals

  )

}

export function pacePerKm(

  distanceKm,

  durationMinutes

) {

  distanceKm =
    toNumber(
      distanceKm
    )

  durationMinutes =
    toNumber(
      durationMinutes
    )

  if (
    distanceKm <= 0
  ) {

    return 0

  }

  return round(

    durationMinutes /
    distanceKm,

    2

  )

}

// =====================================================
// PERFORMANCE
// =====================================================

export function improvementPercentage(

  previousValue,

  currentValue,

  decimals = 2

) {

  previousValue =
    toNumber(
      previousValue
    )

  currentValue =
    toNumber(
      currentValue
    )

  if (
    previousValue <= 0
  ) {

    return 0

  }

  return round(

    (
      (
        currentValue -
        previousValue
      ) /
      previousValue
    ) * 100,

    decimals

  )

}

// =====================================================
// ATTENDANCE
// =====================================================

export function attendancePercentage(

  attended,

  scheduled

) {

  return calculatePercentage(

    attended,

    scheduled,

    2

  )

}

// =====================================================
// RACE RESULTS
// =====================================================

export function calculatePositionPoints(
  position
) {

  const pointsTable = {

    1: 100,
    2: 80,
    3: 65,
    4: 55,
    5: 50,
    6: 45,
    7: 40,
    8: 35,
    9: 30,
    10: 25

  }

  return (
    pointsTable[
      position
    ] || 0
  )

}

// =====================================================
// RANKINGS
// =====================================================

export function rankingScore(
  results = []
) {

  return calculateTotal(
    results
  )

}

// =====================================================
// GROWTH
// =====================================================

export function growthRate(

  oldValue,

  newValue,

  decimals = 2

) {

  oldValue =
    toNumber(
      oldValue
    )

  newValue =
    toNumber(
      newValue
    )

  if (
    oldValue <= 0
  ) {

    return 0

  }

  return round(

    (
      (
        newValue -
        oldValue
      ) /
      oldValue
    ) * 100,

    decimals

  )

}

// =====================================================
// FEDERATION DASHBOARD
// =====================================================

export function dashboardSummary({

  athletes = [],

  teams = [],

  events = [],

  trainings = []

}) {

  return {

    totalAthletes:
      athletes.length,

    totalTeams:
      teams.length,

    totalEvents:
      events.length,

    totalTrainings:
      trainings.length

  }

}



export function calculateDurationDays(

  startDate,

  endDate

) {

  if (
    !startDate ||
    !endDate
  ) {

    return 0

  }

  return daysBetween(

    startDate,

    endDate

  )

}

export function formatNumber(

  value,

  decimals = 2

) {

  return Number(
    value || 0
  ).toFixed(
    decimals
  )

}


export function trainingMetrics({

  distanceKm = 0,

  startTime,

  endTime

}) {

  const duration =
    durationMinutes(
      startTime,
      endTime
    )

  return {

    durationMinutes:
      duration,

    durationHours:
      durationHours(
        startTime,
        endTime
      ),

    averageSpeed:
      averageSpeed(
        distanceKm,
        duration
      ),

    pacePerKm:
      pacePerKm(
        distanceKm,
        duration
      )

  }

}




