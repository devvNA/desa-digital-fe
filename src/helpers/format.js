import { DateTime } from 'luxon'
import numeral from 'numeral'

function parseDateValue(value) {
    if (!value) return null

    const raw = String(value)
    const dateStr = raw.includes('T') ? raw : `${raw}T00:00:00`
    const date = new Date(dateStr)

    return Number.isNaN(date.getTime()) ? null : date
}

export function formatRupiah(value) {
    if (value === null || value === undefined || value === '') {
        return 'Rp0'
    }

    const rawValue = String(value).trim()
    const sanitizedValue = rawValue.replace(/[^\d,.-]/g, '')
    const separatorIndex = Math.max(
        sanitizedValue.lastIndexOf('.'),
        sanitizedValue.lastIndexOf(','),
    )
    const fractionDigits = separatorIndex >= 0 ? sanitizedValue.length - separatorIndex - 1 : 0
    const normalizedValue =
        sanitizedValue.includes(',') && !sanitizedValue.includes('.')
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
    })
        .format(amount)
        .replace(/\s/g, '')
}

export function parseRupiah(value) {
    return numeral(value).value()
}

export function formatPercentage(value) {
    return numeral(value).format('0,0[.00]%')
}

export function formatDate(value) {
    const date = parseDateValue(value)
    if (!date) return '-'

    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export function formatDateWithDay(value) {
    const date = parseDateValue(value)
    if (!date) return '-'

    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
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

export function formatTimeWIB(value) {
    const date = parseDateValue(value)
    if (!date) return '-'

    const time = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
    })

    return `${time} WIB`
}

export function formatToClientTimezone(value) {
    if (!value) return '-'
    const originalDate = DateTime.fromISO(value, { zone: 'utc' })
    if (!originalDate.isValid) return '-'
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    return originalDate.setZone(timezone).setLocale('id').toFormat('dd LLLL yyyy, HH:mm')
}

export function ucfirst(string) {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : ''
}
