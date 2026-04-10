import {
  dinero,
  EUR,
  multiply,
  toDecimal,
  toSnapshot,
  toUnits,
  trimScale,
} from 'dinero.js'
import { describe, expect, it } from 'vitest'
import {
  dineroToNumber,
  roundToTwoDecimals,
  toDinero,
  toDineroMultiplier,
  toMonthly,
  toMonthlyConformalRate,
  toPercentRate,
} from '../../src/utils/validation'

describe('roundToTwoDecimals', () => {
  it('rounds to two decimal places', () => {
    expect(roundToTwoDecimals(1.234)).toBe(1.23)
    expect(roundToTwoDecimals(1.235)).toBe(1.24)
    expect(roundToTwoDecimals(1.999)).toBe(2)
    expect(roundToTwoDecimals(0.1 + 0.2)).toBe(0.3)
  })

  it('handles whole numbers', () => {
    expect(roundToTwoDecimals(5)).toBe(5)
    expect(roundToTwoDecimals(0)).toBe(0)
  })

  it('handles negative values', () => {
    expect(roundToTwoDecimals(-1.234)).toBe(-1.23)
    expect(roundToTwoDecimals(-1.235)).toBe(-1.24)
  })
})

describe('toMonthly', () => {
  it('converts yearly to monthly', () => {
    expect(toMonthly(12)).toBe(1)
    expect(toMonthly(120)).toBe(10)
    expect(toMonthly(0)).toBe(0)
  })
})

describe('toPercentRate', () => {
  it('converts percent to rate', () => {
    expect(toPercentRate(50)).toBe(0.5)
    expect(toPercentRate(0)).toBe(0)
    expect(toPercentRate(-50)).toBe(-0.5)
  })
})

describe('toMonthlyConformalRate', () => {
  it('converts yearly percent to monthly conformal rate', () => {
    expect(toMonthlyConformalRate(0)).toBe(0)
    expect(toMonthlyConformalRate(12.68)).toBeCloseTo(0.01, 5)
    expect(toMonthlyConformalRate(213.84)).toBeCloseTo(0.1, 5)
  })
})

describe('toDinero', () => {
  it('converts euros to Dinero object', () => {
    const dineroValue = toDinero(10)
    expect(dineroValue).not.toBeInstanceOf(Number)
    expect(toDecimal(dineroValue)).toEqual('10.00')
    expect(toSnapshot(dineroValue).amount).toBe(1000)
    expect(toSnapshot(dineroValue).currency.code).toBe('EUR')
  })

  it('handles zero and negative values', () => {
    const zeroValue = toDinero(0)
    expect(toDecimal(zeroValue)).toEqual('0.00')

    const negativeValue = toDinero(-5)
    expect(toDecimal(negativeValue)).toEqual('-5.00')
  })

  it('handles fractional euros', () => {
    const fractionalValue = toDinero(10.42)
    expect(toDecimal(fractionalValue)).toEqual('10.42')
  })

  it('rounds to nearest cent', () => {
    const dineroValue = toDinero(10.005)
    expect(toDecimal(dineroValue)).toEqual('10.01')
  })
})

describe('toDineroMultiplier', () => {
  it('converts rate to Dinero multiplier', () => {
    const multiplier = toDineroMultiplier(1)
    expect(multiplier).toEqual({ amount: 1_000_000, scale: 6 }) // 1 * 10^6 = 1_000_000
  })

  it('handles zero and negative rates', () => {
    const zeroMultiplier = toDineroMultiplier(0)
    expect(zeroMultiplier).toEqual({ amount: 0, scale: 6 })
  })

  it('handles fractional rates', () => {
    const fractionalMultiplier = toDineroMultiplier(0.05)
    expect(fractionalMultiplier).toEqual({ amount: 50_000, scale: 6 })
  })

  it('rounds to nearest millionth', () => {
    const smallMultiplier = toDineroMultiplier(0.0000005)
    expect(smallMultiplier).toEqual({ amount: 1, scale: 6 })

    const tinyMultiplier = toDineroMultiplier(0.0000000000005)
    expect(tinyMultiplier).toEqual({ amount: 0, scale: 6 })
  })

  it('works with Dinero calculations', () => {
    const multiplier = toDineroMultiplier(0.1) // 10% -> 0.1
    const baseAmount = toDinero(100) // 100 euros
    const expectedResult = toDinero(10) // 10 euros (10% of 100)

    let result = multiply(baseAmount, multiplier)
    expect(toUnits(result)).toEqual(toUnits(expectedResult))

    expect(toDecimal(result)).not.toEqual(toDecimal(expectedResult))
    result = trimScale(result)
    expect(toDecimal(result)).toEqual(toDecimal(expectedResult))
  })
})

describe('dineroToNumber', () => {
  function eur(cents: number) {
    return dinero({ amount: cents, currency: EUR })
  }
  it('converts whole-euro amounts', () => {
    expect(dineroToNumber(eur(10000))).toBe(100)
  })

  it('converts amounts with cents', () => {
    expect(dineroToNumber(eur(10050))).toBe(100.5)
  })

  it('converts zero', () => {
    expect(dineroToNumber(eur(0))).toBe(0)
  })

  it('converts negative amounts', () => {
    expect(dineroToNumber(eur(-500))).toBe(-5)
  })
})
