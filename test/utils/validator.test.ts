import { describe, expect, it } from 'vitest'
import {
  toMonthly,
  toMonthlyConformalRate,
  toPercentRate,
} from '../../src/utils/validation'

describe('toMonthly', () => {
  it('should convert yearly to monthly', () => {
    expect(toMonthly(12)).toBe(1)
    expect(toMonthly(120)).toBe(10)
    expect(toMonthly(0)).toBe(0)
  })
})

describe('toPercentRate', () => {
  it('should convert percent to rate', () => {
    expect(toPercentRate(50)).toBe(0.5)
    expect(toPercentRate(0)).toBe(0)
    expect(toPercentRate(-50)).toBe(-0.5)
  })
})

describe('toMonthlyConformalRate', () => {
  it('should convert yearly percent to monthly conformal rate', () => {
    expect(toMonthlyConformalRate(0)).toBe(0)
    expect(toMonthlyConformalRate(12.68)).toBeCloseTo(0.01, 5)
    expect(toMonthlyConformalRate(213.84)).toBeCloseTo(0.1, 5)
  })
})
