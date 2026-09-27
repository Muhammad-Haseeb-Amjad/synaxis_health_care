import { asNumber } from './format'

type CustomerBalanceSource = {
  opening_balance: number | string
  created_at: string
  customer_ledger: { debit: number | string; credit: number | string; entry_date: string }[]
}

export const balanceOf = (customer: CustomerBalanceSource, fromDate = '', toDate = '') => {
  const openingBalance = !fromDate && (!toDate || customer.created_at.slice(0, 10) <= toDate) ? asNumber(customer.opening_balance) : 0
  return openingBalance + customer.customer_ledger
    .filter((row) => (!fromDate || row.entry_date >= fromDate) && (!toDate || row.entry_date <= toDate))
    .reduce((sum, row) => sum + asNumber(row.debit) - asNumber(row.credit), 0)
}
