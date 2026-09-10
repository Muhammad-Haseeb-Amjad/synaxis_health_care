import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { money } from './format'
import { drawBrandHeader, type CompanySettings } from './pdfBranding'

export type CustomerSummaryRow = { name: string; phone: string | null; balance: number }

export async function generateCustomersSummaryPdf(rows: CustomerSummaryRow[], totalOutstanding: number, company: CompanySettings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await drawBrandHeader(doc, company, 'CUSTOMERS SUMMARY')
  autoTable(doc, {
    startY: 48,
    margin: { left: 14, right: 14 },
    head: [['SR#', 'CUSTOMER', 'PHONE', 'CURRENT BALANCE']],
    body: rows.map((row, index) => [String(index + 1), row.name, row.phone || '-', money(row.balance)]),
    theme: 'grid',
    headStyles: { fillColor: [5, 15, 30], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 0: { cellWidth: 15, halign: 'center' }, 3: { halign: 'right', fontStyle: 'bold' } },
  })
  const end = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  const barLeft = 14
  const barRight = 196
  const barHeight = 12
  const textY = end + 7.5
  doc.setFillColor(5, 15, 30)
  doc.rect(barLeft, end, barRight - barLeft, barHeight, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('TOTAL OUTSTANDING', barLeft + 6, textY)
  doc.text(money(totalOutstanding), barRight - 4, textY, { align: 'right' })
  return doc
}