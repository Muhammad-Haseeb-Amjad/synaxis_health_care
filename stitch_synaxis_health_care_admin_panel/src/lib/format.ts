export const asNumber = (value: unknown) => Number(value ?? 0) || 0
export const money = (value: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value)
export const shortDate = (value: string) => new Intl.DateTimeFormat('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))


// Date inputs use the device's calendar date, not UTC (which can be yesterday locally).
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
