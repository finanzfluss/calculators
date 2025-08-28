import Dinero from 'dinero.js'

export function toMonthly(valuePerYear: number) {
  return valuePerYear / 12
}

export function toPercentRate(value: number) {
  return value / 100
}

export function toMonthlyConformalRate(valuePerYear: number) {
  return (1 + valuePerYear / 100) ** (1 / 12) - 1
}

export function toDinero(euros: number) {
  return Dinero({
    amount: Math.round(euros * 100),
    currency: 'EUR',
  })
}
