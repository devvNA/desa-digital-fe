import { fallbackThumbnail, normalizeImageUrl } from '@/helpers/socialAssistance'

const DAY_IN_MS = 86_400_000 // 24 * 60 * 60 * 1000

function parseDateInputAsUTC(value) {
  const normalized = normalizeDateInput(value)

  if (!normalized) return null

  const [year, month, day] = normalized.split('-').map(Number)

  if (!year || !month || !day) return null

  const date = new Date(Date.UTC(year, month - 1, day))
  return Number.isNaN(date.getTime()) ? null : date
}

function formatUTCDateToInput(date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Strips the time portion from an ISO date string.
 * "2024-01-15T10:30:00" → "2024-01-15"
 */
export function normalizeDateInput(value) {
  if (!value) return ''
  return String(value).split('T')[0]
}

/**
 * Calculates the number of whole days between two dates.
 * Returns '' if either date is missing or invalid.
 */
export function calculateDayDifference(startDate, endDate) {
  const start = parseDateInputAsUTC(startDate)
  const end = parseDateInputAsUTC(endDate)

  if (!start || !end) return ''

  const diffMs = end.getTime() - start.getTime()

  if (Number.isNaN(diffMs)) return ''

  return Math.max(0, Math.round(diffMs / DAY_IN_MS))
}

export function calculateEndDate(startDate, day) {
  const start = parseDateInputAsUTC(startDate)
  const dayValue = Number(day)

  if (day === '' || day === null || day === undefined) return ''
  if (!start || !Number.isFinite(dayValue) || dayValue < 0) return ''

  start.setUTCDate(start.getUTCDate() + dayValue)

  return formatUTCDateToInput(start)
}

/**
 * Normalizes a raw monetary value (string or number) into
 * a plain numeric string suitable for further formatting.
 *
 * Handles mixed separators (dots vs commas as grouping or decimal).
 */
export function normalizeAmountInput(value) {
  if (value === null || value === undefined || value === '') return ''

  const sanitized = String(value).trim().replace(/[^\d,.-]/g, '')
  if (!sanitized) return ''

  const hasDot = sanitized.includes('.')
  const hasComma = sanitized.includes(',')

  // No separators at all → strip everything except digits and minus
  if (!hasDot && !hasComma) return sanitized.replace(/[^\d-]/g, '')

  // Both separators → figure out which is the decimal
  if (hasDot && hasComma) {
    const commaIsDecimal = sanitized.lastIndexOf(',') > sanitized.lastIndexOf('.')
    const groupingRe = commaIsDecimal ? /\./g : /,/g
    const cleaned = sanitized.replace(groupingRe, '')
    return commaIsDecimal ? cleaned.replace(',', '.') : cleaned
  }

  // Single separator type — decide if grouping or decimal
  const sep = hasComma ? ',' : '.'
  const parts = sanitized.split(sep)
  const trailingDigits = parts.at(-1)?.replace(/\D/g, '') ?? ''
  const isGrouping = parts.length > 2 || trailingDigits.length > 2 || !trailingDigits

  if (isGrouping) {
    return sanitized
      .replace(new RegExp(`\\${sep}`, 'g'), '')
      .replace(/[^\d-]/g, '')
  }

  const cleanRe = hasComma ? /[^\d,-]/g : /[^\d.-]/g
  const normalized = sanitized.replace(cleanRe, '')
  return hasComma ? normalized.replace(',', '.') : normalized
}

/**
 * Maps a raw API response object into the shape used by
 * DevelopmentDetailView and DevelopmentEditView.
 */
export function mapDevelopmentResponse(response, routeId) {
  return {
    id: response.id ?? routeId,
    thumbnail: null,
    thumbnail_url: normalizeImageUrl(response.thumbnail, fallbackThumbnail),
    name: response.name ?? '',
    description: response.description ?? '',
    person_in_charge: response.person_in_charge ?? '',
    start_date: normalizeDateInput(response.start_date),
    day: calculateDayDifference(response.start_date, response.end_date),
    end_date: normalizeDateInput(response.end_date),
    amount: response.amount == null ? '' : normalizeAmountInput(response.amount),
    status: response.status ?? 'ongoing',
    development_applicants: response.development_applicants ?? [],
  }
}
