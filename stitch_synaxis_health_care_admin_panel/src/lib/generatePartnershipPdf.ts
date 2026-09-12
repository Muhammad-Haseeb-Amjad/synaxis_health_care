import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { money } from './format'
import { drawBrandHeader, type CompanySettings } from './pdfBranding'

export type PartnershipPdfData = {
  partner1: string
  partner2: string
  groupA: { cost: number; revenue: number; profit: number }
  groupB: { cost: number; revenue: number; profit: number }
  expenses: number
  settlement: string
}

export async function generatePartnershipPdf(data: PartnershipPdfData, company: CompanySettings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await drawBrandHeader(doc, company, 'PARTNERSHIP SUMMARY')
  const combined = {
    cost: data.groupA.cost + data.groupB.cost,
    revenue: data.groupA.revenue + data.groupB.revenue,
    profit: data.groupA.profit + data.groupB.profit - data.expenses,
  }
  autoTable(doc, {
    startY: 50,
    head: [['GROUP', 'PARTNER', 'TOTAL COST', 'TOTAL REVENUE', 'NET PROFIT']],
    body: [
      ['Group A', data.partner1, money(data.groupA.cost), money(data.groupA.revenue), money(data.groupA.profit - data.expenses / 2)],
      ['Group B', data.partner2, money(data.groupB.cost), money(data.groupB.revenue), money(data.groupB.profit - data.expenses / 2)],
      ['Combined', '50 / 50', money(combined.cost), money(combined.revenue), money(combined.profit)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [5, 15, 30], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  })
  const end = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.text('Shared expenses', 14, end + 14); doc.text(money(data.expenses), 196, end + 14, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(data.settlement, 14, end + 25)
  return doc
}