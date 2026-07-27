/* global Chart */

function getChartConstructor() {
  const chartGlobal =
    window.Chart

  if (
    typeof chartGlobal === 'function'
  ) {
    return chartGlobal
  }

  if (
    typeof chartGlobal?.Chart === 'function'
  ) {
    return chartGlobal.Chart
  }

  if (
    typeof chartGlobal?.default === 'function'
  ) {
    return chartGlobal.default
  }

  if (
    typeof chartGlobal?.default?.Chart === 'function'
  ) {
    return chartGlobal.default.Chart
  }

  throw new TypeError(
    'Chart.js is loaded in an unsupported form. Expected the Chart.js UMD constructor.'
  )
}

function createChart(
  canvas,
  config
) {
  const ChartConstructor =
    getChartConstructor()

  return new ChartConstructor(
    canvas,
    applyPdfChartTypography(config)
  )
}
export const CHART_COLORS = {

  primary: '#198754',

  secondary: '#FFC107',

  dark: '#212529',

  info: '#0DCAF0',

  danger: '#DC3545',

  light: '#F8F9FA'

}

function readableChartFont(font, minimumSize) {
  const source =
    font && typeof font === 'object' ?
      font :
      {}

  return {
    ...source,
    size: Math.max(
      Number(source.size) || 0,
      minimumSize
    ),
    weight: source.weight || 'bold'
  }
}

function applyPdfChartTypography(config = {}) {
  const options = {
    ...config.options
  }

  const plugins = {
    ...options.plugins
  }

  if (plugins.title !== false) {
    const title = plugins.title || {}
    plugins.title = {
      ...title,
      color: title.color || CHART_COLORS.dark,
      font: readableChartFont(title.font, 22),
      padding: title.padding || {
        top: 8,
        bottom: 14
      }
    }
  }

  if (plugins.legend !== false) {
    const legend = plugins.legend || {}
    const labels = legend.labels || {}
    plugins.legend = {
      ...legend,
      labels: {
        ...labels,
        color: labels.color || CHART_COLORS.dark,
        font: readableChartFont(labels.font, 17),
        padding: labels.padding || 18
      }
    }
  }

  const scales = {}

  for (const [key, scaleValue] of Object.entries(options.scales || {})) {
    const scale = scaleValue || {}
    const ticks = scale.ticks || {}
    const title = scale.title || {}

    scales[key] = {
      ...scale,
      ticks: {
        ...ticks,
        color: ticks.color || CHART_COLORS.dark,
        font: readableChartFont(ticks.font, 16)
      },
      title: scale.title === false ?
        false :
        {
          ...title,
          color: title.color || CHART_COLORS.dark,
          font: readableChartFont(title.font, 18)
        }
    }
  }

  return {
    ...config,
    options: {
      ...options,
      animation: false,
      plugins,
      scales
    }
  }
}

export const PDF_CHARTS = []

export function ensurePdfChartContainer() {
  let container =
    document.getElementById(
      'pdfChartContainer'
    )

  if (
    container
  ) {
    return container
  }

  container =
    document.createElement(
      'div'
    )

  container.id =
    'pdfChartContainer'

  container.style.position =
    'absolute'

  container.style.left =
    '-9999px'

  container.style.top =
    '-9999px'

  document.body.append(
    container
  )

  return container
}

export function createChartCanvas() {
  ensurePdfChartContainer()

  const canvas =
    document.createElement(
      'canvas'
    )

  canvas.width = 1200

  canvas.height = 700

  document
    .getElementById(
      'pdfChartContainer'
    )
    .append(
      canvas
    )

  return canvas
}

async function exportChartImage(
  chart
) {
  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        500
      )
  )

  chart.update()

  return chart
    .toBase64Image()
}

export async function createAttendanceChart({

  labels,

  attendance

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'line',

        data: {

          labels,

          datasets: [

            {

              label:
                'Attendance %',

              data:
                attendance,

              borderColor:
                CHART_COLORS.primary,

              backgroundColor:
                'rgba(25,135,84,0.15)',

              fill: true,

              tension: 0.3

            }

          ]

        }

      }
    )

  PDF_CHARTS.push(
    chart
  )

  return exportChartImage(
    chart
  )
}

export async function createCountyChart({

  labels,

  totals

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'bar',

        data: {

          labels,

          datasets: [

            {

              label:
                'Sessions',

              data:
                totals,

              backgroundColor:
                CHART_COLORS.primary

            }

          ]

        },

        options: {

          indexAxis:
            'y'

        }

      }

    )
  PDF_CHARTS.push(
    chart
  )

  return exportChartImage(
    chart
  )
}

export async function createStatusDonutChart({

  participated,

  absent,

  late,

  excused

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type:
          'doughnut',

        data: {

          labels: [

            'Participated',

            'Absent',

            'Late',

            'Excused'

          ],

          datasets: [

            {

              data: [

                participated,

                absent,

                late,

                excused

              ]

            }

          ]

        }

      }
    )
  PDF_CHARTS.push(
    chart
  )

  return exportChartImage(
    chart
  )
}

export async function createPerformanceTrendChart({

  labels,

  speeds

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'line',

        data: {

          labels,

          datasets: [

            {

              label:
                'Average Speed',

              data:
                speeds,

              borderColor:
                CHART_COLORS.info,

              fill: false

            }

          ]

        }

      }
    )
  PDF_CHARTS.push(
    chart
  )

  return exportChartImage(
    chart
  )
}

export async function createClassificationChart({

  labels,

  counts

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'pie',

        data: {

          labels,

          datasets: [

            {

              data:
                counts

            }

          ]

        }

      }
    )

  PDF_CHARTS.push(
    chart
  )

  return exportChartImage(
    chart
  )
}

export async function createTrainingLoadChart({

  labels,

  distances

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'line',

        data: {

          labels,

          datasets: [

            {

              label:
                'Distance KM',

              data:
                distances,

              borderColor:
                CHART_COLORS.primary,

              backgroundColor:
                'rgba(25,135,84,0.15)',

              fill: true,

              tension: 0.3

            }

          ]

        },

        options: {

          responsive: true,

          plugins: {

            title: {

              display: true,

              text:
                'Training Load Trend'

            }

          }

        }

      }

    )

  PDF_CHARTS.push(
    chart

  )

  return exportChartImage(
    chart
  )
}

export async function createGenderDistributionChart({

  male,

  female

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'doughnut',

        data: {

          labels: [

            'Male',

            'Female'

          ],

          datasets: [

            {

              data: [

                male,

                female

              ],

              backgroundColor: [

                CHART_COLORS.info,

                CHART_COLORS.secondary

              ]

            }

          ]

        }

      }

    )

  PDF_CHARTS.push(
    chart

  )

  return exportChartImage(
    chart
  )
}

export async function createTeamVsIndividualChart({

  team,

  individual

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'pie',

        data: {

          labels: [

            'Team',

            'Individual'

          ],

          datasets: [

            {

              data: [

                team,

                individual

              ],

              backgroundColor: [

                CHART_COLORS.primary,

                CHART_COLORS.secondary

              ]

            }

          ]

        }

      }

    )

  PDF_CHARTS.push(
    chart

  )

  return exportChartImage(
    chart
  )
}

export async function createSpeedDistributionChart({

  labels,

  values

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'bar',

        data: {

          labels,

          datasets: [

            {

              label:
                'Athletes',

              data:
                values,

              backgroundColor:
                CHART_COLORS.info

            }

          ]

        },

        options: {

          plugins: {

            title: {

              display: true,

              text:
                'Speed Distribution'

            }

          }

        }

      }
    )

  PDF_CHARTS.push(
    chart

  )

  return exportChartImage(
    chart
  )
}

export async function createRaceGapChart({

  labels,

  gaps

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'bar',

        data: {

          labels,

          datasets: [

            {

              label:
                'Gap Seconds',

              data:
                gaps,

              backgroundColor:
                CHART_COLORS.danger

            }

          ]

        },

        options: {

          plugins: {

            title: {

              display: true,

              text:
                'Race Time Gaps'

            }

          }

        }

      }
    )

  PDF_CHARTS.push(
    chart

  )

  return exportChartImage(
    chart
  )
}

export async function createMonthlyRegistrationChart({

  labels,

  totals

}) {
  const canvas =
    createChartCanvas()

  const chart =
    createChart(
      canvas,
      {

        type: 'line',

        data: {

          labels,

          datasets: [

            {

              label:
                'Registrations',

              data:
                totals,

              borderColor:
                CHART_COLORS.secondary,

              backgroundColor:
                'rgba(255,193,7,0.15)',

              fill: true,

              tension: 0.3

            }

          ]

        },

        options: {

          plugins: {

            title: {

              display: true,

              text:
                'Registration Growth'

            }

          }

        }

      }
    )

  PDF_CHARTS.push(
    chart

  )

  return exportChartImage(
    chart
  )
}


// =====================================================
// ADVANCED TRAINING REPORT CHARTS
// =====================================================

export async function createDistanceSpeedComparisonChart({
  labels = [],
  individualDistance = [],
  teamDistance = [],
  individualSpeed = [],
  teamSpeed = []
}) {
  const canvas = createChartCanvas()
  const chart = createChart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Individual Distance KM',
          data: individualDistance,
          backgroundColor: CHART_COLORS.primary,
          yAxisID: 'yDistance'
        },
        {
          label: 'Team Distance KM',
          data: teamDistance,
          backgroundColor: CHART_COLORS.secondary,
          yAxisID: 'yDistance'
        },
        {
          type: 'line',
          label: 'Individual Avg Speed KM/H',
          data: individualSpeed,
          borderColor: CHART_COLORS.info,
          fill: false,
          tension: 0.25,
          yAxisID: 'ySpeed'
        },
        {
          type: 'line',
          label: 'Team Avg Speed KM/H',
          data: teamSpeed,
          borderColor: CHART_COLORS.dark,
          fill: false,
          tension: 0.25,
          yAxisID: 'ySpeed'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        yDistance: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: { display: true, text: 'Distance KM' }
        },
        ySpeed: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Average Speed KM/H' }
        }
      },
      plugins: {
        title: { display: true, text: 'Individual vs Team Distance and Speed' }
      }
    }
  })
  PDF_CHARTS.push(chart)
  return exportChartImage(chart)
}

export async function createMonthlyClassificationChart({
  labels = [],
  datasets = []
}) {
  const canvas = createChartCanvas()
  const palette = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.info,
    CHART_COLORS.dark,
    CHART_COLORS.danger
  ]
  const chart = createChart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: palette[index % palette.length]
      }))
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      },
      plugins: {
        title: { display: true, text: 'Sessions by Month and Classification' }
      }
    }
  })
  PDF_CHARTS.push(chart)
  return exportChartImage(chart)
}

export async function createTrainingLoadCompositeChart({
  labels = [],
  distance = [],
  tss = [],
  duration = []
}) {
  const canvas = createChartCanvas()
  const chart = createChart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Distance KM',
          data: distance,
          borderColor: CHART_COLORS.primary,
          backgroundColor: 'rgba(25,135,84,0.12)',
          fill: true,
          tension: 0.25,
          yAxisID: 'yVolume'
        },
        {
          label: 'Duration Min',
          data: duration,
          borderColor: CHART_COLORS.info,
          fill: false,
          tension: 0.25,
          yAxisID: 'yVolume'
        },
        {
          label: 'TSS',
          data: tss,
          borderColor: CHART_COLORS.danger,
          fill: false,
          tension: 0.25,
          yAxisID: 'yTss'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        yVolume: { type: 'linear', position: 'left', beginAtZero: true },
        yTss: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        title: { display: true, text: 'Training Load: Distance, Duration and TSS' }
      }
    }
  })
  PDF_CHARTS.push(chart)
  return exportChartImage(chart)
}

export async function createEventAreaComparisonChart({
  labels = [],
  sessions = [],
  distance = []
}) {
  const canvas = createChartCanvas()
  const chart = createChart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Sessions',
          data: sessions,
          backgroundColor: CHART_COLORS.info,
          xAxisID: 'xSessions'
        },
        {
          label: 'Distance KM',
          data: distance,
          backgroundColor: CHART_COLORS.primary,
          xAxisID: 'xDistance'
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        xSessions: { type: 'linear', position: 'bottom', beginAtZero: true },
        xDistance: {
          type: 'linear',
          position: 'top',
          beginAtZero: true,
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        title: { display: true, text: 'Event Area Comparison' }
      }
    }
  })
  PDF_CHARTS.push(chart)
  return exportChartImage(chart)
}

export async function createGrowthComparisonChart({
  labels = [],
  individual = [],
  team = [],
  overall = []
}) {
  const canvas = createChartCanvas()
  const chart = createChart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Individual Cumulative Distance KM',
          data: individual,
          borderColor: CHART_COLORS.info,
          fill: false,
          tension: 0.25
        },
        {
          label: 'Team Cumulative Distance KM',
          data: team,
          borderColor: CHART_COLORS.secondary,
          fill: false,
          tension: 0.25
        },
        {
          label: 'Overall Cumulative Distance KM',
          data: overall,
          borderColor: CHART_COLORS.primary,
          fill: false,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: {
        title: { display: true, text: 'Month-to-Month Cumulative Growth' }
      }
    }
  })
  PDF_CHARTS.push(chart)
  return exportChartImage(chart)
}

// =====================================================
// PDF CHART CLEANUP
// =====================================================

export function destroyPdfCharts() {
  for (const chart of PDF_CHARTS) {
    try {
      chart.destroy()
    } catch {

      //
    }
  }

  PDF_CHARTS.length = 0

  const container =
    document.getElementById(
      'pdfChartContainer'
    )

  if (
    container
  ) {
    container.innerHTML = ''
  }
}
