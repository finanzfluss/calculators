import type { Dinero } from 'dinero.js'
import { dinero, EUR, toDecimal } from 'dinero.js'

export function toMonthly(valuePerYear: number) {
  return valuePerYear / 12
}

export function toPercentRate(value: number) {
  return value / 100
}

export function toMonthlyConformalRate(valuePerYear: number) {
  return (1 + valuePerYear / 100) ** (1 / 12) - 1
}

export function dineroToNumber(value: Dinero<number, string>) {
  return Number(toDecimal(value))
}

export function toDinero(euros: number) {
  return dinero({
    amount: Math.round(euros * 100),
    currency: EUR,
  })
}

export function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100
}

export function toDineroMultiplier(rate: number) {
  return {
    amount: Math.round(rate * 10 ** 6),
    scale: 6,
  }
}
