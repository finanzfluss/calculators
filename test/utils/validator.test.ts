import { describe, expect, it } from 'vitest'
import {
  annualToMonthly,
  annualToMonthlyConformalRate,
  percentToDecimal,
} from '../../src/utils/validation'

describe('toMonthly', () => {
  it('should convert yearly to monthly', () => {
    expect(annualToMonthly(12)).toBe(1)
    expect(annualToMonthly(120)).toBe(10)
    expect(annualToMonthly(0)).toBe(0)
  })
})

describe('toPercentRate', () => {
  it('should convert percent to rate', () => {
    expect(percentToDecimal(50)).toBe(0.5)
    expect(percentToDecimal(0)).toBe(0)
    expect(percentToDecimal(-50)).toBe(-0.5)
  })
})

describe('toMonthlyConformalRate', () => {
  it('should convert yearly percent to monthly conformal rate', () => {
    expect(annualToMonthlyConformalRate(0)).toBe(0)
    expect(annualToMonthlyConformalRate(12.68)).toBeCloseTo(0.01, 5)
    expect(annualToMonthlyConformalRate(213.84)).toBeCloseTo(0.1, 5)
  })
})
