import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { asNumber, money } from './format'
import { drawBrandHeader, type CompanySettings } from './pdfBranding'
import { saleTotals, type PartnershipSale } from './partnershipMath'

export type MergedMedicineSale = {
  item_code: string
  item_name: string
  qty: number
  cost_price: number
  selling_price: number
  return_qty: number
  total_cost: number
  total_revenue: number
  bounce_cost: number
  distributor_commission: number
  profit: number
}

export type GroupSalesPdfData = {
  group: 'A' | 'B'
  periodLabel: string
  rows: PartnershipSale[]
  commissionRate: number
}

export function mergeSalesByMedicine(rows: PartnershipSale[], commissionRate: number): MergedMedicineSale[] {
  const map = new Map<string, MergedMedicineSale>()

  for (const row of rows) {
    const code = (row.item_code ?? '').trim()
    const name = (row.item_name ?? '').trim()
    // Group key prioritizing item_name so all entries of the same medicine merge together
    const key = (name || code || row.id).toLowerCase()

    const totals = saleTotals(row, commissionRate)
    const costPrice = asNumber(row.cost_price)
    const sellingPrice = asNumber(row.selling_price)
    const qty = asNumber(row.qty)
    const returnQty = asNumber(row.return_qty)

    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        item_code: code,
        item_name: name,
        qty,
        cost_price: costPrice,
        selling_price: sellingPrice,
        return_qty: returnQty,
        total_cost: totals.cost,
        total_revenue: totals.revenue,
        bounce_cost: totals.bounceCost,
        distributor_commission: totals.distributorCommission,
        profit: totals.profit,
      })
    } else {
      existing.qty += qty
      existing.return_qty += returnQty
      existing.total_cost += totals.cost
      existing.total_revenue += totals.revenue
      existing.bounce_cost += totals.bounceCost
      existing.distributor_commission += totals.distributorCommission
      existing.profit += totals.profit

      if (!existing.item_code && code) {
        existing.item_code = code
      }
      if (!existing.item_name && name) {
        existing.item_name = name
      }
      if (existing.cost_price === 0 && costPrice > 0) {
        existing.cost_price = costPrice
      }
      if (existing.selling_price === 0 && sellingPrice > 0) {
        existing.selling_price = sellingPrice
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.item_name.localeCompare(b.item_name))
}

export async function generateGroupSalesPdf(data: GroupSalesPdfData, company: CompanySettings): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const navy: [number, number, number] = [5, 15, 30]
  const pale: [number, number, number] = [241, 245, 249]
  const slate: [number, number, number] = [51, 65, 85]

  // Draw standard brand header
  await drawBrandHeader(doc, company, `GROUP ${data.group} SALES`)

  // Subtitle with group and period label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`GROUP ${data.group}  •  ${data.periodLabel.toUpperCase()}`, 14, 43)

  // Merge the sales items
  const mergedItems = mergeSalesByMedicine(data.rows, data.commissionRate)

  // Calculate totals
  const totalQty = mergedItems.reduce((sum, item) => sum + item.qty, 0)
  const totalReturnQty = mergedItems.reduce((sum, item) => sum + item.return_qty, 0)
  const totalCost = mergedItems.reduce((sum, item) => sum + item.total_cost, 0)
  const totalRevenue = mergedItems.reduce((sum, item) => sum + item.total_revenue, 0)
  const totalBounceCost = mergedItems.reduce((sum, item) => sum + item.bounce_cost, 0)
  const totalCommission = mergedItems.reduce((sum, item) => sum + item.distributor_commission, 0)
  const totalProfit = mergedItems.reduce((sum, item) => sum + item.profit, 0)
  const margin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0

  // 1. KPI Summary mini-table
  const commissionPercent = (data.commissionRate * 100).toFixed(0)
  autoTable(doc, {
    startY: 47,
    margin: { left: 14, right: 14 },
    head: [['TOTAL REVENUE', 'TOTAL COST', 'BOUNCE COST', `COMMISSION (${commissionPercent}%)`, 'GROUP PROFIT', 'MARGIN']],
    body: [[
      money(totalRevenue),
      money(totalCost),
      money(totalBounceCost),
      money(totalCommission),
      money(totalProfit),
      `${margin.toFixed(1)}%`
    ]],
    theme: 'grid',
    headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.8, halign: 'center' },
    bodyStyles: { textColor: navy, fontSize: 7.5, fontStyle: 'bold', minCellHeight: 6, halign: 'center' },
    alternateRowStyles: { fillColor: pale },
  })

  const currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

  // 2. Merged Items Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [['SR#', 'CODE', 'ITEM NAME', 'QTY', 'COST', 'SALE', 'RETURN', 'COMMISSION', 'PROFIT']],
    body: mergedItems.length
      ? mergedItems.map((item, index) => {
          const displayCost = item.qty > 0 && item.total_cost > 0 ? item.total_cost / item.qty : item.cost_price
          const displaySale = item.qty > 0 && item.total_revenue > 0 ? item.total_revenue / item.qty : item.selling_price
          return [
            String(index + 1),
            item.item_code || '-',
            item.item_name,
            item.qty.toLocaleString(),
            money(displayCost),
            money(displaySale),
            item.return_qty.toLocaleString(),
            money(item.distributor_commission),
            money(item.profit),
          ]
        })
      : [['-', '-', 'No records found for this period', '0', '-', '-', '0', money(0), money(0)]],
    foot: [
      [
        '',
        '',
        'TOTAL',
        totalQty.toLocaleString(),
        '',
        '',
        totalReturnQty.toLocaleString(),
        money(totalCommission),
        money(totalProfit)
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    bodyStyles: { textColor: slate, fontSize: 7, minCellHeight: 6 },
    footStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: pale },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 16 },
      2: { cellWidth: 50 },
      3: { cellWidth: 14, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 14, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
  })

  // 3. Page numbering and footer
  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(company.company_name, 14, 288)
    doc.text(`Page ${page} of ${totalPages}`, 105, 288, { align: 'center' })
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 196, 288, { align: 'right' })
  }

  return doc
}
