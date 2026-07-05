/**
 * Minimal pure-JS PDF generator.
 * Generates a simple, clean PDF without external font dependencies.
 * Produces a valid PDF 1.4 document with text content.
 */

interface TextRun {
  text: string
  font: 'F1' | 'F2' | 'F3' // Helvetica, Helvetica-Bold, Helvetica-Oblique
  size: number
  x: number
  y: number
  color: [number, number, number]
  width?: number
  align?: 'left' | 'center' | 'right'
}

interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  color: [number, number, number]
}

export function generateResumePDF(
  resumeText: string,
  meta: { name: string; jobTitle: string; company: string }
): Buffer {
  const pageWidth = 612 // Letter
  const pageHeight = 792
  const margin = 60
  const contentWidth = pageWidth - margin * 2

  const textRuns: TextRun[] = []
  const lines: Line[] = []
  let y = margin + 10
  let currentPage = 1
  const pageBreaks: number[] = [] // y values where new pages start

  // Parse the resume text
  const lines_arr = resumeText.split('\n')

  // Header: Name (large, bold)
  textRuns.push({
    text: meta.name,
    font: 'F2',
    size: 22,
    x: margin,
    y: pageHeight - y,
    color: [15, 23, 42],
  })
  y += 28

  // Contact line (small, gray)
  const contactLine = lines_arr[1] || '' // second line is usually contact info
  textRuns.push({
    text: contactLine.slice(0, 150),
    font: 'F1',
    size: 9,
    x: margin,
    y: pageHeight - y,
    color: [71, 85, 105],
    width: contentWidth,
  })
  y += 14

  // Headline (italic, teal)
  if (lines_arr[2]) {
    textRuns.push({
      text: lines_arr[2].slice(0, 120),
      font: 'F3',
      size: 11,
      x: margin,
      y: pageHeight - y,
      color: [13, 148, 136],
    })
    y += 16
  }

  // Divider line
  lines.push({
    x1: margin,
    y1: pageHeight - y,
    x2: pageWidth - margin,
    y2: pageHeight - y,
    width: 1,
    color: [203, 213, 225],
  })
  y += 16

  // Skip the first 3 lines (already used for header)
  const bodyLines = lines_arr.slice(3)

  for (const rawLine of bodyLines) {
    const line = rawLine.trim()
    if (!line) {
      y += 4
      continue
    }

    // Check for page break
    if (y > pageHeight - margin - 40) {
      pageBreaks.push(y)
      currentPage++
      y = margin + 20
    }

    // Is it a section header? (ALL CAPS, short)
    const isHeader = /^[A-Z][A-Z\s\/&,-]{2,30}$/.test(line) && line.length < 32

    if (isHeader) {
      y += 8
      textRuns.push({
        text: line,
        font: 'F2',
        size: 11,
        x: margin,
        y: pageHeight - y,
        color: [15, 23, 42],
      })
      y += 14
      // Underline
      lines.push({
        x1: margin,
        y1: pageHeight - y,
        x2: pageWidth - margin,
        y2: pageHeight - y,
        width: 0.5,
        color: [13, 148, 136],
      })
      y += 8
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      const text = line.replace(/^[-•]\s*/, '')
      textRuns.push({
        text: '• ' + text,
        font: 'F1',
        size: 9.5,
        x: margin + 12,
        y: pageHeight - y,
        color: [30, 41, 59],
        width: contentWidth - 24,
      })
      y += 13
    } else {
      // Regular text
      textRuns.push({
        text: line,
        font: 'F1',
        size: 9.5,
        x: margin,
        y: pageHeight - y,
        color: [30, 41, 59],
        width: contentWidth,
      })
      y += 13
    }
  }

  // Build PDF
  return buildPDF({
    pageWidth,
    pageHeight,
    pages: currentPage,
    textRuns,
    lines,
    pageBreaks,
    meta,
  })
}

interface PDFBuildInput {
  pageWidth: number
  pageHeight: number
  pages: number
  textRuns: TextRun[]
  lines: Line[]
  pageBreaks: number[]
  meta: { name: string; jobTitle: string; company: string }
}

function buildPDF(input: PDFBuildInput): Buffer {
  const { pageWidth, pageHeight, pages, textRuns, lines: lineObjs, meta } = input

  // Build objects
  const objects: string[] = []
  const xref: number[] = []

  // Object 1: Catalog
  objects.push('<< /Type /Catalog /Pages 2 0 R >>')

  // Object 2: Pages
  const pageRefs = Array.from({ length: pages }, (_, i) => `${3 + i * 2} 0 R`).join(' ')
  objects.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages} >>`)

  // For each page: create a Page object and a Content stream
  for (let p = 0; p < pages; p++) {
    const pageObjNum = 3 + p * 2
    const contentObjNum = 4 + p * 2

    // Page object
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 1000 0 R /F2 1001 0 R /F3 1002 0 R >> >> >>`
    )

    // Content stream
    let content = ''

    // Determine which text runs are on this page
    // For simplicity, we'll render all text runs on page 1, and paginate based on y
    // Actually, we need to track which page each run belongs to
    // Let's use the y coordinate: page 1 = y from 0 to pageHeight, page 2 = next page, etc.
    // Since we already adjusted y values, let's filter by page

    // For page 0: y (in our coordinate) < first pageBreak
    // For page 1: first pageBreak <= y < second pageBreak
    // etc.
    const pageStart = p === 0 ? 0 : input.pageBreaks[p - 1] || pageHeight
    const pageEnd = p < pages - 1 ? input.pageBreaks[p] || pageHeight : pageHeight + 100

    // Draw lines
    for (const ln of lineObjs) {
      const lineY = pageHeight - ln.y1
      const lineYPage = ln.y1
      // Check if line is on this page
      if (p === 0) {
        if (lineYPage > (input.pageBreaks[0] || pageHeight + 1)) continue
      } else {
        const thisPageStart = input.pageBreaks[p - 1] || 0
        const thisPageEnd = input.pageBreaks[p] || pageHeight + 1
        if (lineYPage < thisPageStart || lineYPage >= thisPageEnd) continue
      }
      content += `${ln.x1.toFixed(1)} ${lineY.toFixed(1)} m ${ln.x2.toFixed(1)} ${lineY.toFixed(1)} l\n`
      content += `${ln.width} w\n`
      content += `${ln.color[0] / 255} ${ln.color[1] / 255} ${ln.color[2] / 255} RG\n`
      content += 'S\n'
    }

    // Draw text
    for (const tr of textRuns) {
      const trYPage = pageHeight - tr.y
      if (p === 0) {
        if (trYPage > (input.pageBreaks[0] || pageHeight + 1)) continue
      } else {
        const thisPageStart = input.pageBreaks[p - 1] || 0
        const thisPageEnd = input.pageBreaks[p] || pageHeight + 1
        if (trYPage < thisPageStart || trYPage >= thisPageEnd) continue
      }

      const textY = pageHeight - tr.y
      content += `BT\n/${tr.font} ${tr.size} Tf\n`
      content += `${tr.color[0] / 255} ${tr.color[1] / 255} ${tr.color[2] / 255} rg\n`
      content += `${tr.x.toFixed(1)} ${textY.toFixed(1)} Td\n`

      // Escape special chars
      const escaped = tr.text
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\r/g, '')
      content += `(${escaped}) Tj\nET\n`
    }

    // Footer with page number
    const footerY = 30
    content += `BT\n/F1 8 Tf\n0.58 0.58 0.58 rg\n`
    content += `${(pageWidth / 2 - 100).toFixed(1)} ${footerY} Td\n`
    const footerText = `${meta.name} — Resume for ${meta.jobTitle} at ${meta.company}  |  Page ${p + 1} of ${pages}`
    const footerEscaped = footerText.replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    content += `(${footerEscaped}) Tj\nET\n`

    const contentBytes = Buffer.from(content, 'latin1')
    objects.push(`<< /Length ${contentBytes.length} >>\nstream\n${content}endstream`)
  }

  // Font objects (1000, 1001, 1002)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>')

  // Build the PDF
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []

  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'))
    const objNum = i < 3 + pages * 2 ? i + 1 : 1000 + (i - (3 + pages * 2))
    pdf += `${objNum} 0 obj\n${objects[i]}\nendobj\n`
  }

  // xref
  const xrefOffset = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += `0000000000 65535 f \n`
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`
  }

  // Trailer
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'latin1')
}
