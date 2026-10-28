export const asNumber = (value: unknown) => Number(value ?? 0) || 0
export const money = (value: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value)
export const shortDate = (value: string) => new Intl.DateTimeFormat('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))


// Date inputs use the device's calendar date, not UTC (which can be yesterday locally).
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

// Supabase returns PostgrestError objects, which are NOT Error instances.
// String(error) on those yields "[object Object]", hiding the real cause from the user.
export const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message || 'Unknown error'
  if (typeof error === 'object' && error !== null) {
    const { message, details, hint, code } = error as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [message, details, hint].filter((part): part is string => Boolean(part && part.trim()))
    if (parts.length) return parts.join(' - ')
    if (code) return `Request failed (${code})`
    try { return JSON.stringify(error) } catch { return 'Unknown error' }
  }
  return String(error)
}
