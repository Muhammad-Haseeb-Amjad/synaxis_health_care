import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { money } from './format'
import { drawBrandHeader, type CompanySettings } from './pdfBranding'

type Totals = { cost: number; revenue: number; bounceCost?: number; distributorCommission?: number; profit: number }
type Draw = { entry_date: string; description: string; amount: number }
type Expense = { expense_date: string; description: string; amount: number; paidBy: string }
type PartnerDetails = { name: string; profit: number; drawn: number; expensesPaid: number; expenseShare: number; profitShareRemaining: number; draws: Draw[] }

export type PartnershipPdfData = {
  groupA: Totals
  groupB: Totals
  partner1: PartnerDetails
  partner2: PartnerDetails
  expenses: Expense[]
  expenseTotal: number
  fairShare: number
  netDistributable: number
  settlementHeadline: string
}

const navy: [number, number, number] = [5, 15, 30]
const teal: [number, number, number] = [78, 222, 163]
const slate: [number, number, number] = [51, 65, 85]
const pale: [number, number, number] = [241, 245, 249]

function sectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(...navy)
  doc.roundedRect(14, y, 182, 8, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...teal)
  doc.text(title.toUpperCase(), 18, y + 5.4)
}

function partnerCard(doc: jsPDF, partner: PartnerDetails, group: 'A' | 'B', x: number, y: number, width: number) {
  const visibleDraws = partner.draws.slice(0, 4)
  const metricCount = 5
  const listY = y + 18 + metricCount * 4.5 + 2
  const height = listY - y + Math.max(1, visibleDraws.length) * 5 + 2
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(x, y, width, height, 2, 2, 'FD')
  doc.setFillColor(...teal)
  doc.rect(x, y, 2.5, height, 'F')
  doc.setTextColor(...navy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(partner.name, x + 6, y + 7)
  doc.setFontSize(7)
  doc.setTextColor(...slate)
  doc.text(`PARTNER ${group === 'A' ? '1' : '2'} - GROUP ${group}`, x + 6, y + 12)
  const rows: [string, number][] = [
    ['Profit', partner.profit],
    ['Given / drawn', partner.drawn],
    ['Expenses paid', partner.expensesPaid],
    ['Expense share', partner.expenseShare],
    ['Profit share remaining', partner.profitShareRemaining],
  ]
  rows.forEach(([label, value], index) => {
    const rowY = y + 18 + index * 4.5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...slate)
    doc.text(label, x + 6, rowY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...navy)
    doc.text(money(value), x + width - 5, rowY, { align: 'right' })
  })
  doc.setDrawColor(203, 213, 225)
  doc.line(x + 6, listY - 3, x + width - 5, listY - 3)
  if (visibleDraws.length) {
    visibleDraws.forEach((draw, index) => {
      const rowY = listY + index * 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(...slate)
      const label = `${draw.entry_date}  ${draw.description || 'Partner draw'}`
      doc.text(doc.splitTextToSize(label, width - 34)[0], x + 6, rowY)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...navy)
      doc.text(money(draw.amount), x + width - 5, rowY, { align: 'right' })
    })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(6.8)
    doc.setTextColor(100, 116, 139)
    doc.text('No draws in this period', x + 6, listY)
  }
  return height
}

export async function generatePartnershipPdf(data: PartnershipPdfData, company: CompanySettings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await drawBrandHeader(doc, company, 'PARTNERSHIP SUMMARY')
  const combined = {
    cost: data.groupA.cost + data.groupB.cost,
    revenue: data.groupA.revenue + data.groupB.revenue,
    profit: data.groupA.profit + data.groupB.profit,
  }

  sectionTitle(doc, 'Group performance', 46)
  autoTable(doc, {
    startY: 56,
    margin: { left: 14, right: 14 },
    head: [['GROUP', 'PARTNER', 'TOTAL COST', 'TOTAL REVENUE', 'GROUP PROFIT']],
    body: [
      ['Group A', data.partner1.name, money(data.groupA.cost), money(data.groupA.revenue), money(data.groupA.profit)],
      ['Group B', data.partner2.name, money(data.groupB.cost), money(data.groupB.revenue), money(data.groupB.profit)],
      ['Combined', '50 / 50', money(combined.cost), money(combined.revenue), money(combined.profit)],
    ],
    theme: 'grid',
    headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.3 },
    bodyStyles: { textColor: slate, fontSize: 7.3, minCellHeight: 7 },
    alternateRowStyles: { fillColor: pale },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
  })

  let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7
  sectionTitle(doc, 'Partner details', y)
  y += 11
  const cardsHeight = Math.max(
    partnerCard(doc, data.partner1, 'A', 14, y, 88),
    partnerCard(doc, data.partner2, 'B', 108, y, 88),
  )
  y += cardsHeight + 7

  sectionTitle(doc, 'Shared expenses', y)
  y += 10
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['DATE', 'DESCRIPTION', 'PAID BY', 'AMOUNT']],
    body: data.expenses.length
      ? data.expenses.map(item => [item.expense_date, item.description, item.paidBy, money(item.amount)])
      : [['-', 'No shared expenses in this period', '-', money(0)]],
    foot: [['', '', 'TOTAL SHARED EXPENSES', money(data.expenseTotal)]],
    theme: 'grid',
    headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { textColor: slate, fontSize: 7, minCellHeight: 6 },
    footStyles: { fillColor: pale, textColor: navy, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 82 }, 2: { cellWidth: 42 }, 3: { cellWidth: 32, halign: 'right' } },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7
  if (y > 247) {
    doc.addPage()
    y = 18
  }
  sectionTitle(doc, 'Equal profit settlement', y)
  y += 13
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...navy)
  const headline = doc.splitTextToSize(data.settlementHeadline, 174)
  doc.text(headline, 18, y)
  y += headline.length * 5.5 + 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...slate)
  const detail = `Net distributable ${money(data.netDistributable)} after shared expenses ${money(data.expenseTotal)}; fair share ${money(data.fairShare)} each.`
  const detailLines = doc.splitTextToSize(detail, 174)
  doc.text(detailLines, 18, y)
  y += detailLines.length * 4.5 + 2
  const drawsNote = "Partner draws are tracked separately and deducted from each partner's amount still owed."
  doc.text(doc.splitTextToSize(drawsNote, 174), 18, y)

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(company.company_name, 14, 288)
    doc.text(`Page ${page} of ${pages}`, 105, 288, { align: 'center' })
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 196, 288, { align: 'right' })
  }
  return doc
}
