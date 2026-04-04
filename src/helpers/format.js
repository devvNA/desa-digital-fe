import { DateTime } from 'luxon'
import numeral from 'numeral'

export function formatRupiah(value) {
  if (value === null || value === undefined || value === '') {
    return 'Rp0'
  }

  const rawValue = String(value).trim()
  const sanitizedValue = rawValue.replace(/[^\d,.-]/g, '')
  const separatorIndex = Math.max(sanitizedValue.lastIndexOf('.'), sanitizedValue.lastIndexOf(','))
  const fractionDigits = separatorIndex >= 0 ? sanitizedValue.length - separatorIndex - 1 : 0
  const normalizedValue = sanitizedValue.includes(',') && !sanitizedValue.includes('.')
    ? sanitizedValue.replace(',', '.')
    : sanitizedValue.replace(/,/g, '')
  const amount = Number(normalizedValue)

  if (Number.isNaN(amount)) {
    return 'Rp0'
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount).replace(/\s/g, '')
}

export function parseRupiah(value) {
  return numeral(value).value()
}

export function formatPercentage(value) {
  return numeral(value).format('0,0[.00]%')
}

export function formatDate(date) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' }
  return new Date(date).toLocaleDateString('id-ID', options)
}

export function formatDateTime(date) {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }
  return new Date(date).toLocaleString('id-ID', options)
}

export function formatToClientTimezone(date) {
  const originalDate = DateTime.fromISO(date, { zone: 'utc' })
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return originalDate.setZone(timezone).setLocale('id').toFormat('dd LLLL yyyy, HH:mm')
}

export function ucfirst(string) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : ''
}
