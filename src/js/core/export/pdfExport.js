// =====================================================
// PDF EXPORT
// ParaCycling Federation Management System
// =====================================================

const {
  jsPDF
} = window.jspdf

const autoTable =
  window.jspdf
    ?.autoTable

import {
  EXPORT_CONFIG,
  buildFileName
}
from './exportConstants.js'

export const PDF_COLORS = {

  primary: [25, 135, 84],

  secondary: [255, 193, 7],

  dark: [33, 37, 41],

  light: [248, 249, 250],

  info: [13, 202, 240],

  danger: [220, 53, 69]

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

  pdf.addPage()

  pdf.setFontSize(
    18
  )

  pdf.text(
    'Executive Dashboard',
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
    logoBase64
  ) {

    addFederationLogo({

      pdf,

      logoBase64,

      x: 20,

      y: 20,

      width: 35,

      height: 35

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

  pdf.text(
    'KENYA PARA CYCLING FEDERATION',
    20,
    80
  )

  pdf.setFontSize(
    22
  )

  pdf.text(
    reportTitle,
    20,
    105
  )

  pdf.setFontSize(
    12
  )

  pdf.text(
    `Period: ${reportPeriod}`,
    20,
    125
  )

  pdf.text(
    `Generated: ${generatedDate}`,
    20,
    135
  )

}

// =====================================================
// DASHBOARD PAGE
// =====================================================

export function addDashboardPage({

  pdf,

  title = 'Analytics Dashboard'

}) {

  pdf.addPage()

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