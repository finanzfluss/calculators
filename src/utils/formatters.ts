import { getLocale } from './i18n'

const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

export function pad(value: number) {
  return (value < 10 ? '0' : '') + value
}

export function formatResultWithTwoOptionalDecimals(
  value: number | { toUnit: () => number },
  suffix = '€',
) {
  const amount = typeof value === 'number' ? value : value.toUnit()
  const decimalsRequired =
    Math.abs(amount) - Number.parseInt(amount.toString()) > 0
  const decimalCount = decimalsRequired ? 2 : 0
  const formattedAmount = formatNumber(amount, decimalCount)
  return `${formattedAmount}${suffix}`
}

export function formatResult(
  value: number | { toUnit: () => number },
  suffix = '€',
) {
  const amount = typeof value === 'number' ? value : value.toUnit()
  const decimalCount = Math.abs(amount) < 1000 ? 2 : 0
  const formattedAmount = formatNumber(amount, decimalCount)
  return `${formattedAmount}${suffix}`
}

export function formatInput(value: string) {
  return Number(value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.'))
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

export function formatPercent(percentAsFloat: number, decimalCount = 3) {
  return `${formatNumber(percentAsFloat, decimalCount)}%`
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
