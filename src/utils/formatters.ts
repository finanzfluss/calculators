import type { Dinero } from 'dinero.js'
import { transformScale } from 'dinero.js'
import { getLocale } from './i18n'
import { dineroToNumber } from './validation'

const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

export function pad(value: number) {
  return (value < 10 ? '0' : '') + value
}

export function formatNumber(value: number, decimalCount = 0) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${value} is not a valid number`)
  }
  if (value.toString().includes('e+')) {
    return formatExponential(value)
  }
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: decimalCount,
    maximumFractionDigits: decimalCount,
  }).format(Number(value.toFixed(decimalCount)))
}

/**
 * Formats a number with adaptive decimal precision.
 * Shows 2 decimals for |value| < 1000, shows 0 decimals for larger amounts.
 *
 * @example formatNumberAdaptive(512.25) // "512,25"
 * @example formatNumberAdaptive(1234)   // "1.234"
 */
export function formatNumberAdaptive(value: number | Dinero<number, string>) {
  const amount =
    typeof value === 'number' ? value : dineroToNumber(transformScale(value, 2))
  const decimalCount = Math.abs(amount) < 1000 ? 2 : 0
  return formatNumber(amount, decimalCount)
}

/**
 * Like {@link formatNumberAdaptive}, with a € suffix.
 *
 * @example formatCurrencyAdaptive(512.25) // "512,25€"
 * @example formatCurrencyAdaptive(1234)   // "1.234€"
 */
export function formatCurrencyAdaptive(value: number | Dinero<number, string>) {
  return `${formatNumberAdaptive(value)}€`
}

/**
 * Formats a number showing 2 decimals only if the value has a fractional part.
 *
 * @example formatNumberNatural(99.5) // "99,50"
 * @example formatNumberNatural(99)   // "99"
 */
export function formatNumberNatural(value: number | Dinero<number, string>) {
  const amount =
    typeof value === 'number' ? value : dineroToNumber(transformScale(value, 2))
  const isWholeNumber = amount % 1 === 0
  const decimalCount = isWholeNumber ? 0 : 2
  return formatNumber(amount, decimalCount)
}

/**
 * Like {@link formatNumberNatural}, with a € suffix.
 *
 * @example formatCurrencyNatural(99.5) // "99,50€"
 * @example formatCurrencyNatural(99)   // "99€"
 */
export function formatCurrencyNatural(value: number | Dinero<number, string>) {
  return `${formatNumberNatural(value)}€`
}

export function formatPercent(percentAsFloat: number, decimalCount = 3) {
  return `${formatNumber(percentAsFloat, decimalCount)}%`
}

export function parseFormattedNumber(value: string) {
  return Number(value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.'))
}

export function parseCurrency(value: string) {
  return parseFormattedNumber(value.replace('€', ''))
}

function formatExponential(amount: number) {
  const amountString = amount.toExponential() // Example: `1.2345e+30`
  const parsedMantissa = amountString.slice(0, amountString.indexOf('.') + 2)
  const formattedMantissa = new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: 1,
  }).format(Number(parsedMantissa))
  const parsedExponent = amountString.slice(amountString.indexOf('+') + 1)
  const formattedExponent = parsedExponent
    .split('')
    .map((i) => SUPERSCRIPTS[+i])
    .join('')

  return `${formattedMantissa}×10${formattedExponent}`
}
