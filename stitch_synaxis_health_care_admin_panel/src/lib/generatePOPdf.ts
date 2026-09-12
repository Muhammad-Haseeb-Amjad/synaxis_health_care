import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { asNumber, money, shortDate } from './format'
import { drawBrandHeader, type CompanySettings } from './pdfBranding'

export type POPdfData = {
  po_number: string
  order_date: string
  delivery_date: string | null
  vendor_name_snapshot: string
  vendor_address_snapshot: string | null
  vendor_phone_snapshot: string | null
  ship_to_name: string
  ship_to_address: string | null
  ship_to_phone: string | null
  note: string | null
  status: string
  total_amount: number | string
  subtotal?: number | string
  total_tax?: number | string
  items: { description: string; qty: number | string; price: number | string; tax_percent?: number | string; amount?: number | string }[]
}

function infoBlock(doc: jsPDF, label: string, lines: (string | null | undefined)[], x: number, y: number, width: number) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(15, 23, 42); doc.text(label, x, y)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85)
  let offset = 5
  lines.filter(Boolean).forEach((line) => { const wrapped = doc.splitTextToSize(String(line), width); doc.text(wrapped, x, y + offset); offset += wrapped.length * 4 })
}

export async function generatePOPdf(order: POPdfData, company: CompanySettings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const brandedCompany = { ...company, logo_url: company.logo_url || '/assets/synaxis-login-bg.png' }
  // Soft professional corner washes sit behind the branded header and content.
  doc.setFillColor(236, 253, 245); doc.circle(202, 42, 30, 'F')
  doc.setFillColor(255, 241, 242); doc.circle(6, 271, 34, 'F')
  await drawBrandHeader(doc, brandedCompany, 'PURCHASE ORDER')

  // Faint brand watermark behind the table.
  doc.setFont('helvetica', 'bold'); doc.setFontSize(35); doc.setTextColor(241, 245, 249)
  doc.text(company.company_name.toUpperCase(), 105, 174, { align: 'center', angle: 25 })

  infoBlock(doc, 'VENDOR', [order.vendor_name_snapshot, order.vendor_address_snapshot, order.vendor_phone_snapshot], 14, 46, 52)
  infoBlock(doc, 'SHIP TO', [order.ship_to_name, order.ship_to_address, order.ship_to_phone], 78, 46, 55)
  infoBlock(doc, 'PO DETAILS', [`PO NUMBER     ${order.po_number}`, `ORDER ON      ${shortDate(order.order_date)}`, `DELIVERY ON   ${order.delivery_date ? shortDate(order.delivery_date) : '-'}`], 145, 46, 51)

  const startY = 76
  const rows = order.items.map((item, index) => {
    const qty = asNumber(item.qty)
    const taxInclusivePrice = asNumber(item.price) * (1 + asNumber(item.tax_percent) / 100)
    const amount = item.amount === undefined ? qty * taxInclusivePrice : asNumber(item.amount)
    return [String(index + 1), item.description || '-', qty.toLocaleString(), money(taxInclusivePrice), money(amount)]
  })

  autoTable(doc, {
    startY,
    margin: { left: 14, right: 14 },
    head: [['NO.', 'DESCRIPTION', 'QTY', 'PRICE', 'AMOUNT']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [5, 15, 30], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { textColor: [30, 41, 59], fontSize: 8, minCellHeight: 12, valign: 'middle' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 13, halign: 'center' },
      1: { cellWidth: 92 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 27, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: ({ section, column, row, cell }) => {
      if (section !== 'body' || column.index !== 1) return
      const description = order.items[row.index]?.description || '-'
      const [primary, ...secondaryParts] = description.split(/\n|\s+-\s+/)
      const secondary = secondaryParts.join(' - ')
      doc.setFillColor(row.index % 2 ? 241 : 255, row.index % 2 ? 245 : 255, row.index % 2 ? 249 : 255)
      doc.rect(cell.x + 0.2, cell.y + 0.2, cell.width - 0.4, cell.height - 0.4, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 41, 59); doc.text(doc.splitTextToSize(primary, cell.width - 6), cell.x + 3, cell.y + 5)
      if (secondary) { doc.setFont('helvetica', 'normal'); doc.setFontSize(6.7); doc.setTextColor(100, 116, 139); doc.text(doc.splitTextToSize(secondary, cell.width - 6), cell.x + 3, cell.y + 9) }
    },
  })

  const tableEnd = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  const displayedTotal = order.items.reduce((sum, item) => sum + (item.amount === undefined ? asNumber(item.qty) * asNumber(item.price) * (1 + asNumber(item.tax_percent) / 100) : asNumber(item.amount)), 0)
  doc.setFillColor(5, 15, 30); doc.rect(132, tableEnd, 64, 11, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('TOTAL', 138, tableEnd + 7); doc.text(money(displayedTotal), 192, tableEnd + 7, { align: 'right' })

  doc.setTextColor(15, 23, 42); doc.setFontSize(8); doc.text('NOTE', 14, tableEnd + 9)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85); doc.text(doc.splitTextToSize(order.note || '-', 110), 14, tableEnd + 14)

  if (order.status === 'Completed') {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(34); doc.setTextColor(134, 204, 158)
    doc.text('COMPLETED', 105, startY + Math.min(45, order.items.length * 6), { align: 'center', angle: 25 })
  }
  doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.text(company.company_name, 14, 288); doc.text(`Generated ${new Date().toLocaleDateString()}`, 196, 288, { align: 'right' })
  return doc
}