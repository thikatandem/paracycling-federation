// =====================================================
// PDF EXPORT
// ParaCycling Federation Management System
// =====================================================

const {
  jsPDF
} = window.jspdf

const autoTable =
  window.autoTable

console.log(
  'window.autoTable',
  window.autoTable
)

import {
  EXPORT_CONFIG,
  buildFileName
}
from './exportConstants.js'

const tandemLogo =
  '/assets/logo/tandem-logo.png'

const tandemBackground =
  '/assets/shared/tandem-pdf.png'


import {

  createAttendanceChart,

  createCountyChart,

  createStatusDonutChart,

  createTrainingLoadChart,

  createTeamVsIndividualChart,

  createPerformanceTrendChart,

  createSpeedDistributionChart,

  createClassificationChart,

  createMonthlyRegistrationChart,

  createGenderDistributionChart,

  createRaceGapChart,

  destroyPdfCharts

}
from '../../reports/chartExport.js'

export const PDF_COLORS = {

  primary: [25, 135, 84],

  secondary: [255, 193, 7],

  dark: [33, 37, 41],

  light: [248, 249, 250],

  info: [13, 202, 240],

  danger: [220, 53, 69]

}

function imageToBase64(
  imageUrl
) {

  return new Promise(

    (
      resolve,
      reject
    ) => {

      const image =
        new Image()

      image.crossOrigin =
        'anonymous'

      image.onload =
        () => {

          const canvas =
            document.createElement(
              'canvas'
            )

          canvas.width =
            image.width

          canvas.height =
            image.height

          const context =
            canvas.getContext(
              '2d'
            )

          context.drawImage(
            image,
            0,
            0
          )

          resolve(

            canvas.toDataURL(
              'image/png'
            )

          )

        }

      image.onerror =
        reject

      image.src =
        imageUrl

    }

  )

}

// =====================================================
// DOCUMENT
// =====================================================

export function createPdf({

  orientation =
    'landscape',

  unit =
    'mm',

  format =
    'a4'

} = {}) {

  return new jsPDF({

    orientation,
    unit,
    format

  })

}


export function addKpiCard({

  pdf,

  x,

  y,

  width = 60,

  height = 30,

  title,

  value,

  color = PDF_COLORS.primary

}) {

  pdf.setFillColor(
    ...color
  )

  pdf.roundedRect(

    x,

    y,

    width,

    height,

    3,

    3,

    'F'
  )

  pdf.setTextColor(
    255,
    255,
    255
  )

  pdf.setFontSize(
    10
  )

  pdf.text(
    title,
    x + 5,
    y + 10
  )

  pdf.setFontSize(
    18
  )

  pdf.text(
    String(value),
    x + 5,
    y + 22
  )

  pdf.setTextColor(
    0,
    0,
    0
  )
}

export function addKpiPage({

  pdf,

  kpis = []

}) {

  addPageWithBackground(
  pdf
)




  pdf.setFontSize(
    18
  )

  pdf.text(
  'Executive Performance Dashboard',
  14,
  20
)

  let x = 14

  let y = 35

 kpis.forEach(

  (
    card,
    index
  ) => {

    addKpiCard({

      pdf,

      x,

      y,

      title:
        card.title,

      value:
        card.value,

      color:
        card.color
    })

    pdf.setFontSize(
      8
    )

    const notes = {

      Athletes:
        'Active participants',

      Sessions:
        'Training activity',

      Attendance:
        'Participation level',

      'Distance KM':
        'Distance covered'

    }

    pdf.text(

      notes[
        card.title
      ] || '',

      x + 5,

      y + 35

    )

    x += 70

    if (
      (
        index + 1
      ) % 4 === 0
    ) {

      x = 14

      y += 50

    }

  }
)
  
}


export function addBackgroundWatermark({

  pdf,

  imageBase64

}) {

  if (
    !imageBase64
  ) {

    return
  }

  const pageWidth =

    pdf.internal
      .pageSize
      .getWidth()

  const pageHeight =

    pdf.internal
      .pageSize
      .getHeight()

  pdf.saveGraphicsState()

  pdf.setGState(
    new pdf.GState({
      opacity: 0.08
    })
  )

  pdf.addImage(

    imageBase64,

    'PNG',

    20,

    15,

    pageWidth - 40,

    pageHeight - 30

  )

  pdf.restoreGraphicsState()

}

export function addPageWithBackground(
  pdf
) {

  pdf.addPage()

  if (
    window.pdfBackgroundImage
  ) {

    addBackgroundWatermark({

      pdf,

      imageBase64:
        window.pdfBackgroundImage

    })

  }

}

export function addCoverPage({

  pdf,

  reportTitle,

  reportPeriod,

  generatedDate,

  logoBase64 = null

}) {

  pdf.setFillColor(
    ...PDF_COLORS.primary
  )

  pdf.rect(
    0,
    0,
    297,
    210,
    'F'
  )

 if (
  window.pdfBackgroundImage
) {

  addBackgroundWatermark({

    pdf,

    imageBase64:
      window.pdfBackgroundImage

  })

}

if (
  logoBase64
) {

  addFederationLogo({

    pdf,

    logoBase64,

    x: 245,

    y: 10,

    width: 40,

    height: 40

  })

}
  

  pdf.setTextColor(
    255,
    255,
    255
  )

  pdf.setFontSize(
    26
  )

 const centerX = 148.5

pdf.setFont(
  'helvetica',
  'bold'
)

pdf.setFontSize(
  30
)

pdf.text(

  'THIKA TANDEM PARACYCLING CLUB',

  centerX,

  75,

  {
    align:
      'center'
  }

)

  pdf.setFontSize(
    22
  )

  pdf.setFontSize(
  22
)

pdf.text(

  reportTitle,

  centerX,

  105,

  {
    align:
      'center'
  }

)


  pdf.setFontSize(
    12
  )

 pdf.setFontSize(
  14
)

pdf.text(

  `Reporting Period: ${reportPeriod}`,

  centerX,

  125,

  {
    align:
      'center'
  }

)

  pdf.setFontSize(
  8
)

pdf.text(

  `Generated ${generatedDate}`,

  centerX,

  190,

  {
    align:
      'center'
  }

)

}

export function addReportContext({

  pdf,

  filters = {}

}) {

  addPageWithBackground(
  pdf
)




  pdf.setFontSize(20)

  pdf.text(
    'Report Context',
    14,
    20
  )

  const entries =
    Object.entries(
      filters
    )

  let x = 14
  let y = 40

  entries.forEach(

    ([key, value], index) => {

      pdf.setFillColor(
  25,
  135,
  84
)

      pdf.roundedRect(
        x,
        y,
        60,
        30,
        3,
        3,
        'F'
      )

      pdf.setFontSize(10)

      pdf.text(
        key,
        x + 4,
        y + 8
      )
  pdf.setTextColor(
  255,
  255,
  255
)
      pdf.setFontSize(14)

      pdf.text(
        String(
          value || 'All'
        ),
        x + 4,
        y + 20
      )
pdf.setTextColor(
  0,
  0,
  0
)
      x += 70

      if (
        (
          index + 1
        ) % 4 === 0
      ) {

        x = 14

        y += 40
      }

    }

  )

}


// =====================================================
// DASHBOARD PAGE
// =====================================================

export function addDashboardPage({

  pdf,

  title = 'Analytics Dashboard'

}) {

  addPageWithBackground(
  pdf
)



  pdf.setFontSize(
    20
  )

  pdf.setTextColor(
    ...PDF_COLORS.dark
  )

  pdf.text(
    title,
    14,
    20
  )

  pdf.setDrawColor(
    220,
    220,
    220
  )

  pdf.line(
    14,
    25,
    280,
    25
  )

}

// =====================================================
// CHART IMAGE
// =====================================================

export function addChartImage({

  pdf,

  imageData,

  x,

  y,

  width = 120,

  height = 80,

  title = ''

}) {

  if (
    title
  ) {

    pdf.setFontSize(
      11
    )

    pdf.text(
      title,
      x,
      y - 4
    )

  }

  pdf.addImage(

    imageData,

    'PNG',

    x,

    y,

    width,

    height

  )

}

// =====================================================
// INSIGHTS SECTION
// =====================================================

export function addInsightsSection({

  pdf,

  insights = [],

  startY = 140

}) {

  pdf.setFontSize(
    14
  )

  pdf.text(
    'Key Insights',
    14,
    startY
  )

  let y =
    startY + 10

  insights.forEach(
    insight => {

      pdf.setFontSize(
        10
      )

      pdf.text(

        `• ${insight}`,

        18,

        y

      )

      y += 8

    }
  )

  return y

}

// =====================================================
// PODIUM SECTION
// =====================================================

export function addPodiumSection({

  pdf,

  first,

  second,

  third,

  startY = 40

}) {

  pdf.setFontSize(
    18
  )

  pdf.text(
    'Top Performers',
    14,
    startY
  )

  pdf.setFillColor(
    255,
    215,
    0
  )

  pdf.roundedRect(
    100,
    startY + 20,
    60,
    40,
    3,
    3,
    'F'
  )

  pdf.setFillColor(
    192,
    192,
    192
  )

  pdf.roundedRect(
    30,
    startY + 30,
    60,
    30,
    3,
    3,
    'F'
  )

  pdf.setFillColor(
    205,
    127,
    50
  )

  pdf.roundedRect(
    170,
    startY + 35,
    60,
    25,
    3,
    3,
    'F'
  )

  pdf.setTextColor(
    0,
    0,
    0
  )

  pdf.text(
    `🥇 ${first}`,
    105,
    startY + 42
  )

  pdf.text(
    `🥈 ${second}`,
    35,
    startY + 47
  )

  pdf.text(
    `🥉 ${third}`,
    175,
    startY + 50
  )

}

// =====================================================
// FEDERATION LOGO
// =====================================================

export function addFederationLogo({

  pdf,

  logoBase64,

  x = 14,

  y = 10,

  width = 30,

  height = 30

}) {

  if (
    !logoBase64
  ) {

    return
  }

  pdf.addImage(

    logoBase64,

    'PNG',

    x,

    y,

    width,

    height

  )

}


// =====================================================
// HEADER
// =====================================================

export function addReportHeader({

  pdf,

  reportTitle,

  reportSubtitle = ''

}) {

  pdf.setFontSize(18)

  pdf.text(

    EXPORT_CONFIG.organization,

    14,

    15

  )

  pdf.setFontSize(14)

  pdf.text(
    reportTitle,
    14,
    24
  )

  if (
    reportSubtitle
  ) {

    pdf.setFontSize(10)

    pdf.text(
      reportSubtitle,
      14,
      30
    )

  }

}

// =====================================================
// GENERATED INFO
// =====================================================

export function addGeneratedInfo({

  pdf,

  generatedBy =
    EXPORT_CONFIG.generatedBy

}) {

  const pageWidth =
    pdf.internal.pageSize.width

  const now =
    new Date()

  pdf.setFontSize(8)

  pdf.text(

    `Generated: ${now.toLocaleString()}`,

    pageWidth - 70,

    15

  )

  pdf.text(

    `Generated By: ${generatedBy}`,

    pageWidth - 70,

    20

  )

}

// =====================================================
// FILTERS SECTION
// =====================================================

export function addFiltersSection({

  pdf,

  filters = {}

}) {

  let y = 38

  const entries =
    Object.entries(
      filters
    )

  if (
    entries.length === 0
  ) {

    return y

  }

  pdf.setFontSize(10)

  pdf.text(
    'Filters Applied',
    14,
    y
  )

  y += 6

  entries.forEach(

    ([key, value]) => {

      pdf.text(

        `${key}: ${value}`,

        18,

        y

      )

      y += 5

    }

  )

  return y

}

// =====================================================
// SUMMARY SECTION
// =====================================================

export function addSummarySection({

  pdf,

  summary = {},

  startY = 40

}) {

  const entries =
    Object.entries(
      summary
    )

  if (
    entries.length === 0
  ) {

    return startY

  }

  pdf.setFontSize(10)

  pdf.text(
    'Summary',
    14,
    startY
  )

  let y =
    startY + 6

  entries.forEach(

    ([key, value]) => {

      pdf.text(

        `${key}: ${value}`,

        18,

        y

      )

      y += 5

    }

  )

  return y

}

// =====================================================
// TABLE
// =====================================================

export function addTable({

  pdf,

  columns = [],

  data = [],

  startY = 50

}) {

  autoTable(
    pdf,
    {

      startY,

      head: [

        columns.map(
          column =>
            column.label
        )

      ],

      body:

        data.map(
          row =>

            columns.map(
              column =>

                row[
                  column.key
                ] ?? ''
            )
        ),

      styles: {

        fontSize:
          8

      },

      headStyles: {

        fillColor:
          [60, 120, 60]

      }

    }
  )

  return (
    pdf.lastAutoTable
      ?.finalY || startY
  )

}

// =====================================================
// FOOTER
// =====================================================

export function addFooter(
  pdf
) {

  const pageCount =
    pdf.internal
      .getNumberOfPages()

  for (

    let page = 1;

    page <= pageCount;

    page++

  ) {

    pdf.setPage(
      page
    )

    const width =
      pdf.internal
        .pageSize
        .getWidth()

    const height =
      pdf.internal
        .pageSize
        .getHeight()

    pdf.setFontSize(
      8
    )

    pdf.text(

      EXPORT_CONFIG.reportFooter,

      14,

      height - 8

    )

    pdf.text(

      `Page ${page} of ${pageCount}`,

      width - 35,

      height - 8

    )

  }

}

// =====================================================
// FEDERATION REPORT BUILDER
// =====================================================


// =====================================================
// TRAINING REPORT
// =====================================================



// =====================================================
// PERFORMANCE REPORT
// =====================================================





// =====================================================
// SAVE
// =====================================================

export function savePdf({

  pdf,

  reportName

}) {

  pdf.save(

    `${buildFileName(
      reportName
    )}.pdf`

  )

}

// =====================================================
// SIMPLE REPORT
// =====================================================

export function downloadPdf({

  reportName,

  columns,

  data,

  filters = {},

  summary = {},

  orientation =
    'landscape'

}) {

  const pdf =
    createPdf({

      orientation

    })

  addReportHeader({

    pdf,

    reportTitle:
      reportName

  })

  addGeneratedInfo({
    pdf
  })

  let currentY =
    addFiltersSection({

      pdf,

      filters

    })

  currentY =
    addSummarySection({

      pdf,

      summary,

      startY:
        currentY + 5

    })

  addTable({

    pdf,

    columns,

    data,

    startY:
      currentY + 10

  })

  addFooter(
    pdf
  )

  savePdf({

    pdf,

    reportName

  })

}

// =====================================================
// IMPORT ERROR REPORT
// =====================================================

export function downloadPdfErrors({

  reportName,

  errors = []

}) {

  const columns = [

    {
      key: 'row',
      label: 'Row'
    },

    {
      key: 'field',
      label: 'Field'
    },

    {
      key: 'value',
      label: 'Value'
    },

    {
      key: 'message',
      label: 'Error'
    }

  ]

  downloadPdf({

    reportName,

    columns,

    data:
      errors

  })

}

// =====================================================
// SUMMARY REPORT
// =====================================================

export function downloadSummaryPdf({

  reportName,

  summary

}) {

  const pdf =
    createPdf()

  addReportHeader({

    pdf,

    reportTitle:
      reportName

  })

  addGeneratedInfo({
    pdf
  })

  addSummarySection({

    pdf,

    summary,

    startY: 40

  })

  addFooter(
    pdf
  )

  savePdf({

    pdf,

    reportName

  })

}

// =====================================================
// FEDERATION REPORT BUILDER
// =====================================================


// =====================================================
// TRAINING REPORT
// =====================================================

export async function downloadTrainingReportPdf({




  reportPeriod,

  filters = {},

  logoBase64 = null,
  columns = [],

  data = [],

  insights = [],

  attendanceLabels = [],

  attendanceValues = [],

  countyLabels = [],

  countyTotals = [],

  participated = 0,

  absent = 0,

  late = 0,

  excused = 0,

  distanceLabels = [],

  distanceValues = [],

  teamCount = 0,

  individualCount = 0,

  totalAthletes = 0,

  totalSessions = 0,

  attendancePercentage = 0,

  totalDistance = 0

}) {

  try {

const logoBase64Loaded =

  await imageToBase64(
    tandemLogo
  )

const backgroundBase64 =

  await imageToBase64(
    tandemBackground
  )

window.pdfBackgroundImage =
  backgroundBase64

    const attendanceChart =
      await createAttendanceChart({

        labels:
          attendanceLabels,

        attendance:
          attendanceValues

      })

    const countyChart =
      await createCountyChart({

        labels:
          countyLabels,

        totals:
          countyTotals

      })

    const statusChart =
      await createStatusDonutChart({

        participated,

        absent,

        late,

        excused

      })

    const loadChart =
      await createTrainingLoadChart({

        labels:
          distanceLabels,

        distances:
          distanceValues

      })

    const scopeChart =
      await createTeamVsIndividualChart({

        team:
          teamCount,

        individual:
          individualCount

      })

 const uniqueOccurrences =

  new Set(

    data.map(
      row =>

        row.event_instances
          ?.event_area
    )
    .filter(Boolean)

  )


const dates =

  data
    .map(
      row =>
        row.training_date
    )
    .filter(Boolean)
    .sort()

const oldestDate =
  dates[0]

const newestDate =
  dates[
    dates.length - 1
  ]

const actualReportPeriod =

  oldestDate === newestDate

    ? oldestDate

    : `${oldestDate} - ${newestDate}`

const reportTitle =

  uniqueOccurrences.size === 1

    ?

    `${[
      ...uniqueOccurrences
    ][0]} Training Performance Report`

    :

    'Training Combined Performance Report'


    const pdf =
  buildFederationReport({
  

    reportTitle,

    reportPeriod:
      actualReportPeriod,

       logoBase64:
  logoBase64Loaded,
         
        filters,

        

        insights,

        columns,

        data,

        kpis: [

          {
            title:
              'Athletes',

            value:
              totalAthletes,

            color:
              PDF_COLORS.primary
          },

          {
            title:
              'Sessions',

            value:
              totalSessions,

            color:
              PDF_COLORS.info
          },

          {
            title:
              'Attendance',

            value:
              `${attendancePercentage}%`,

            color:
              PDF_COLORS.secondary
          },

          {
            title:
              'Distance KM',

            value:
              totalDistance,

            color:
              PDF_COLORS.dark
          }

        ],

        charts: [

          {
            image:
              attendanceChart,

            title:
              'Attendance Trend',

            x: 10,

            y: 35,

            width: 130,

            height: 80
          },

          {
            image:
              countyChart,

            title:
              'County Activity',

            x: 150,

            y: 35,

            width: 130,

            height: 80
          },

          {
            image:
              statusChart,

            title:
              'Status Breakdown',

            x: 10,

            y: 120,

            width: 120,

            height: 80
          },

          {
            image:
              loadChart,

            title:
              'Training Load',

            x: 140,

            y: 120,

            width: 120,

            height: 80
          },

          {
  image:
    scopeChart,

  title:
    'Team vs Individual',

  x: 10,

  y: 170,

  width: 100,

  height: 45
}

        ]

      })

    savePdf({

      pdf,

      reportName:
        'Training_Report'

    })

  }
  finally {

    destroyPdfCharts()

  }

}

// =====================================================
// PERFORMANCE REPORT
// =====================================================

export async function downloadPerformanceReportPdf({

  reportPeriod,

  logoBase64 = null,

  columns = [],

  data = [],

  insights = [],

  speedLabels = [],

  speedValues = [],

  trendLabels = [],

  trendValues = [],

  podium = null,

  totalAthletes = 0,

  averageSpeed = 0,

  bestSpeed = 0,

  improvement = 0

}) {

  try {

    const trendChart =
      await createPerformanceTrendChart({

        labels:
          trendLabels,

        speeds:
          trendValues

      })

    const speedChart =
      await createSpeedDistributionChart({

        labels:
          speedLabels,

        values:
          speedValues

      })

    const pdf =
      buildFederationReport({

        reportTitle:
          'Performance Report',

        reportPeriod,

        logoBase64,

        insights,

        podium,

        columns,

        data,

        kpis: [

          {

            title:
              'Athletes',

            value:
              totalAthletes,

            color:
              PDF_COLORS.primary

          },

          {

            title:
              'Average Speed',

            value:
              averageSpeed,

            color:
              PDF_COLORS.info

          },

          {

            title:
              'Best Speed',

            value:
              bestSpeed,

            color:
              PDF_COLORS.secondary

          },

          {

            title:
              'Improvement',

            value:
              `${improvement}%`,

            color:
              PDF_COLORS.dark

          }

        ],

        charts: [

          {

            image:
              trendChart,

            title:
              'Performance Trend',

            x: 10,

            y: 35,

            width: 130,

            height: 80

          },

          {

            image:
              speedChart,

            title:
              'Speed Distribution',

            x: 150,

            y: 35,

            width: 130,

            height: 80

          }

        ]

      })

    savePdf({

      pdf,

      reportName:
        'Performance_Report'

    })

  }
  finally {

    destroyPdfCharts()

  }

}

// =====================================================
// PARTICIPANTS REPORT
// =====================================================

export async function downloadParticipantsReportPdf({

  reportPeriod,

  logoBase64 = null,

  columns = [],

  data = [],

  insights = [],

  classificationLabels = [],

  classificationCounts = [],

  registrationLabels = [],

  registrationTotals = [],

  male = 0,

  female = 0,

  totalRegistered = 0,

  active = 0,

  inactive = 0,

  suspended = 0

}) {

  try {

    const classificationChart =
      await createClassificationChart({

        labels:
          classificationLabels,

        counts:
          classificationCounts

      })

    const registrationChart =
      await createMonthlyRegistrationChart({

        labels:
          registrationLabels,

        totals:
          registrationTotals

      })

    const genderChart =
      await createGenderDistributionChart({

        male,

        female

      })

    const pdf =
      buildFederationReport({

        reportTitle:
          'Participants Report',

        reportPeriod,

        logoBase64,

        insights,

        columns,

        data,

        kpis: [

          {

            title:
              'Registered',

            value:
              totalRegistered,

            color:
              PDF_COLORS.primary

          },

          {

            title:
              'Active',

            value:
              active,

            color:
              PDF_COLORS.info

          },

          {

            title:
              'Inactive',

            value:
              inactive,

            color:
              PDF_COLORS.secondary

          },

          {

            title:
              'Suspended',

            value:
              suspended,

            color:
              PDF_COLORS.danger

          }

        ],

        charts: [

          {

            image:
              registrationChart,

            title:
              'Registration Growth',

            x: 10,

            y: 35,

            width: 130,

            height: 80

          },

          {

            image:
              classificationChart,

            title:
              'Classification Distribution',

            x: 150,

            y: 35,

            width: 120,

            height: 80

          },

          {

            image:
              genderChart,

            title:
              'Gender Distribution',

            x: 10,

            y: 120,

            width: 120,

            height: 80

          }

        ]

      })

    savePdf({

      pdf,

      reportName:
        'Participants_Report'

    })

  }
  finally {

    destroyPdfCharts()

  }

}

// =====================================================
// RACE RESULTS REPORT
// =====================================================

export async function downloadRaceResultsPdf({

  eventName,

  eventDate,

  logoBase64 = null,

  columns = [],

  data = [],

  insights = [],

  podium = null,

  gapLabels = [],

  gapValues = [],

  totalCompetitors = 0,

  finishRate = 0,

  averageSpeed = 0,

  fastestTime = ''

}) {

  try {

    const gapChart =
      await createRaceGapChart({

        labels:
          gapLabels,

        gaps:
          gapValues

      })

    const pdf =
      buildFederationReport({

        reportTitle:
          eventName,

        reportPeriod:
          eventDate,

        logoBase64,

        insights,

        podium,

        columns,

        data,

        kpis: [

          {

            title:
              'Competitors',

            value:
              totalCompetitors,

            color:
              PDF_COLORS.primary

          },

          {

            title:
              'Finish Rate',

            value:
              `${finishRate}%`,

            color:
              PDF_COLORS.info

          },

          {

            title:
              'Average Speed',

            value:
              averageSpeed,

            color:
              PDF_COLORS.secondary

          },

          {

            title:
              'Fastest Time',

            value:
              fastestTime,

            color:
              PDF_COLORS.dark

          }

        ],

        charts: [

          {

            image:
              gapChart,

            title:
              'Race Time Gaps',

            x: 10,

            y: 35,

            width: 150,

            height: 90

          }

        ]

      })

    savePdf({

      pdf,

      reportName:
        eventName

    })

  }
  finally {

    destroyPdfCharts()

  }

}


export function addParticipantSummary({

  pdf,

  participants = []

}) {

  if (
    !participants.length
  ) {

    return

  }

  addPageWithBackground(
  pdf
)



  pdf.setFontSize(
    18
  )

  pdf.text(
    'Participant Summary',
    14,
    20
  )

  autoTable(
    pdf,
    {

      startY: 30,

      head: [[

        'Participant',

        'Sessions',

        'Distance',

        'Duration'

      ]],

      body:

        participants.map(
          row => [

            row.participant,

            row.sessions,

            row.distance,

            row.duration

          ]
        )

    }
  )

}



// =====================================================
// FEDERATION REPORT BUILDER
// =====================================================

export function buildFederationReport({

  reportTitle,

  reportPeriod,

  filters = {},

  participantSummary = [],

  kpis = [],

  charts = [],

  insights = [],

  podium = null,

  columns = [],

  data = [],

  logoBase64 = null

}) {

  const pdf =
    createPdf({

      orientation:
        'landscape'

    })

  addCoverPage({

    pdf,

    reportTitle,

    reportPeriod,

    generatedDate:
      new Date()
        .toLocaleDateString(),

    logoBase64

  })

  addReportContext({

    pdf,

    filters

  })

  addKpiPage({

    pdf,

    kpis

  })

  // ==========================================
  // ANALYTICS DASHBOARD
  // ==========================================

  addDashboardPage({

    pdf,

    title:
      'Federation Analytics Dashboard'

  })

  charts.forEach(
    chart => {

      addChartImage({

        pdf,

        imageData:
          chart.image,

        x:
          chart.x,

        y:
          chart.y,

        width:
          chart.width,

        height:
          chart.height,

        title:
          chart.title

      })

    }
  )

  // ==========================================
  // TRAINING INTELLIGENCE PAGE
  // ==========================================

  addPageWithBackground(
  pdf
)

  pdf.setFontSize(
    18
  )

  pdf.text(
    'Training Intelligence Summary',
    14,
    20
  )

  pdf.setFontSize(
    11
  )

  pdf.text(
    'Attendance trend indicates participant engagement.',
    14,
    40
  )

  pdf.text(
    'County activity highlights training concentration.',
    14,
    50
  )

  pdf.text(
    'Status distribution reflects participation levels.',
    14,
    60
  )

  pdf.text(
    'Training load shows volume progression.',
    14,
    70
  )

  pdf.text(
    'Team vs Individual reflects session composition.',
    14,
    80
  )

  if (
    insights.length
  ) {

    addInsightsSection({

      pdf,

      insights,

      startY: 100

    })

  }

  if (
    participantSummary.length
  ) {

    addParticipantSummary({

      pdf,

      participants:
        participantSummary

    })

  }

  // ==========================================
  // DETAILED TRAINING LOG
  // ==========================================

  addPageWithBackground(
  pdf
)

  pdf.setFontSize(
    18
  )

  const uniqueOccurrences =

    new Set(

      data
        .map(
          row =>
            row.occurrence
        )
        .filter(Boolean)

    )

  const detailTitle =

    uniqueOccurrences.size === 1

      ?

      [...uniqueOccurrences][0]

      :

      'Detailed Training Log'

  pdf.text(

    detailTitle,

    148.5,

    15,

    {
      align:
        'center'
    }

  )

  addTable({

    pdf,

    columns,

    data,

    startY: 25

  })

  addFooter(
    pdf
  )

  return pdf

}