/* global Chart */

const Chart =
  window.Chart
export const CHART_COLORS = {

  primary: '#198754',

  secondary: '#FFC107',

  dark: '#212529',

  info: '#0DCAF0',

  danger: '#DC3545',

  light: '#F8F9FA'

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

  document.body.appendChild(
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
    .appendChild(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
    new Chart(
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
// PDF CHART CLEANUP
// =====================================================

export function destroyPdfCharts() {

  PDF_CHARTS.forEach(
    chart => {

      try {

        chart.destroy()

      }
      catch {

        //
      }

    }
  )

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
