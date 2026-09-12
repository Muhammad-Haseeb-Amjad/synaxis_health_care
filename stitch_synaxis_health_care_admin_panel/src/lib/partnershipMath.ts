import { asNumber } from './format'

export type PartnershipSale = {
  id: string
  group_label: 'A' | 'B'
  item_code: string
  item_name: string
  qty: number | string
  cost_price: number | string
  selling_price: number | string
  return_qty: number | string
  return_cost?: number | string
  month?: string
  product_id?: string | null
  created_at: string
}

export const DEFAULT_DISTRIBUTOR_COMMISSION_RATE = 0.10

export function saleTotals(row: PartnershipSale, commissionRate = DEFAULT_DISTRIBUTOR_COMMISSION_RATE) {
  const qty = asNumber(row.qty)
  const costPrice = asNumber(row.cost_price)
  const sellingPrice = asNumber(row.selling_price)
  const bounceQty = asNumber(row.return_qty)
  const cost = qty * costPrice
  const revenue = qty * sellingPrice
  const bounceCost = bounceQty * costPrice
  const distributorCommission = revenue * commissionRate
  const profit = revenue - cost - bounceCost - distributorCommission
  return { qty, cost, revenue, bounceQty, bounceCost, distributorCommission, profit, margin: revenue ? (profit / revenue) * 100 : 0 }
}

export function groupTotals(rows: PartnershipSale[], commissionRate = DEFAULT_DISTRIBUTOR_COMMISSION_RATE) {
  const totals = rows.reduce((total, row) => {
    const value = saleTotals(row, commissionRate)
    total.qty += value.qty
    total.cost += value.cost
    total.revenue += value.revenue
    total.bounceQty += value.bounceQty
    total.bounceCost += value.bounceCost
    total.distributorCommission += value.distributorCommission
    total.profit += value.profit
    return total
  }, { qty: 0, cost: 0, revenue: 0, bounceQty: 0, bounceCost: 0, distributorCommission: 0, profit: 0 })
  return { ...totals, margin: totals.revenue ? (totals.profit / totals.revenue) * 100 : 0 }
}

export function partnershipSettlement(groupAProfit: number, groupBProfit: number, expenses: number, partner1Name: string, partner2Name: string) {
  const combinedProfit = groupAProfit + groupBProfit
  const netDistributableProfit = combinedProfit - expenses
  const fairShareEach = netDistributableProfit / 2
  const partner1TakeHome = groupAProfit - expenses / 2
  const partner2TakeHome = groupBProfit - expenses / 2
  const partner1Adjustment = fairShareEach - partner1TakeHome
  const partner2Adjustment = fairShareEach - partner2TakeHome
  const amount = Math.abs(partner1Adjustment).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const message = partner1Adjustment > 0
    ? `${partner1Name} should receive Rs ${amount} from ${partner2Name}`
    : partner1Adjustment < 0
      ? `${partner2Name} should receive Rs ${amount} from ${partner1Name}`
      : 'Profit is already equal - no settlement needed.'
  return { combinedProfit, netDistributableProfit, fairShareEach, partner1TakeHome, partner2TakeHome, partner1Adjustment, partner2Adjustment, message }
}

export function requiredDoctorBusiness(givenAmount: unknown, percentage: unknown) {
  if (givenAmount === '' || givenAmount === null || givenAmount === undefined || percentage === '' || percentage === null || percentage === undefined) return null
  const given = Number(givenAmount)
  const rate = Number(percentage)
  if (!Number.isFinite(given) || !Number.isFinite(rate) || rate === 0) return null
  return given / (rate / 100)
}

export function monthTag(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en', { month: 'short', year: 'numeric' }).replace(' ', '-')
}
