import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { money } from './format'
import { drawBrandHeader, type CompanySettings } from './pdfBranding'

export type CustomerSummaryRow = { name: string; phone: string | null; balance: number }

export async function generateCustomersSummaryPdf(rows: CustomerSummaryRow[], totalOutstanding: number, company: CompanySettings, dateRangeLabel = '') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await drawBrandHeader(doc, company, 'CUSTOMERS SUMMARY')
  if (dateRangeLabel) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(dateRangeLabel, 14, 44)
  }
  autoTable(doc, {
    startY: 48,
    margin: { left: 14, right: 14 },
    head: [['SR#', 'CUSTOMER', 'PHONE', dateRangeLabel ? 'PERIOD BALANCE' : 'CURRENT BALANCE']],
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
  doc.text(dateRangeLabel ? 'PERIOD OUTSTANDING' : 'TOTAL OUTSTANDING', barLeft + 6, textY)
  doc.text(money(totalOutstanding), barRight - 4, textY, { align: 'right' })
  return doc
}

export type MonthlySummaryRow = { name: string; debit: number; credit: number }

export async function generateMonthlySummaryPdf(rows: MonthlySummaryRow[], monthName: string, company: CompanySettings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await drawBrandHeader(doc, company, 'MONTHLY SUMMARY')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(71, 85, 105)
  doc.text(monthName.toUpperCase(), 14, 44)
  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0)
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0)

  autoTable(doc, {
    startY: 48,
    margin: { left: 14, right: 14 },
    head: [['SR#', 'CUSTOMER', 'DEBIT', 'CREDIT']],
    body: rows.map((row, index) => [
      String(index + 1), 
      row.name, 
      row.debit ? money(row.debit) : '-', 
      row.credit ? money(row.credit) : '-'
    ]),
    foot: [['', 'TOTAL SUMMARY', money(totalDebit), money(totalCredit)]],
    theme: 'grid',
    headStyles: { fillColor: [5, 15, 30], textColor: [255, 255, 255] },
    footStyles: { fillColor: [5, 15, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 
      0: { cellWidth: 15, halign: 'center' }, 
      2: { halign: 'right' }, 
      3: { halign: 'right' }
    },
  })
  
  return doc
}