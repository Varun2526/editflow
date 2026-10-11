const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const inrWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** ₹25,000 — decimals only when the amount has paise. */
export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  return Number.isInteger(number) ? inrWhole.format(number) : inr.format(number)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Backend LocalDate ("2026-10-20") is a calendar date: parse it without timezone shifting. */
export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}

export function formatDateTime(instant) {
  if (!instant) return '—'
  return new Date(instant).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function formatPeriod(month, year) {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

/** Today as a local calendar date string, for date inputs. */
export function todayIso() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatPercent(value) {
  const number = Number(value ?? 0)
  return `${Number.isInteger(number) ? number : number.toFixed(2)}%`
}
