import { describe, expect, it } from 'vitest'
import { incomeTax } from '../../src/calculators/income-tax'

describe('calculators/income-tax', () => {
  it('floors decimal ZVE to whole euros — 80,000.99 is treated as 80,000', () => {
    const decimal = incomeTax.validateAndCalculate({
      zve: 80000.99,
      splitting: false,
      year: '2026',
    })
    const integer = incomeTax.validateAndCalculate({
      zve: 80000,
      splitting: false,
      year: '2026',
    })

    expect(decimal).toEqual(integer)
  })

  it('returns all zeros when ZVE is 0', () => {
    const result = incomeTax.validateAndCalculate({
      zve: 0,
      splitting: false,
      year: '2026',
    })

    expect(result.incomeTax.amount).toBe(0)
    expect(result.incomeTax.averageRate).toBe(0)
    expect(result.incomeTax.marginalRate).toBe(0)
    expect(result.solidaritySurcharge.amount).toBe(0)
    expect(result.solidaritySurcharge.averageRate).toBe(0)
    expect(result.total.amount).toBe(0)
    expect(result.total.averageRate).toBe(0)
  })

  it('charges no tax when ZVE is within the Grundfreibetrag', () => {
    const result = incomeTax.validateAndCalculate({
      zve: 12348,
      splitting: false,
      year: '2026',
    })

    expect(result.incomeTax.amount).toBe(0)
    expect(result.solidaritySurcharge.amount).toBe(0)
    expect(result.total.amount).toBe(0)
  })

  it('charges no Solidaritätszuschlag when ESt is at or below the Freigrenze', () => {
    const result = incomeTax.validateAndCalculate({
      zve: 74_000,
      splitting: false,
      year: '2026',
    })

    expect(result.incomeTax.amount).toBe(19944)
    expect(result.solidaritySurcharge.amount).toBe(0)
  })

  it('applies Splittingverfahren — lower ESt and no Soli below the doubled Freigrenze', () => {
    const grundtarif = incomeTax.validateAndCalculate({
      zve: 80_000,
      splitting: false,
      year: '2026',
    })
    const splitting = incomeTax.validateAndCalculate({
      zve: 80_000,
      splitting: true,
      year: '2026',
    })

    expect(splitting.incomeTax.amount).toBe(14418)
    expect(splitting.incomeTax.amount).toBeLessThan(grundtarif.incomeTax.amount)
    // ESt is below the doubled Soli Freigrenze — no Soli
    expect(splitting.solidaritySurcharge.amount).toBe(0)
  })

  it('applies the 45% Reichensteuer rate above 277,826 and computes Soli at 5.5%', () => {
    const result = incomeTax.validateAndCalculate({
      zve: 400_000,
      splitting: false,
      year: '2026',
    })

    expect(result.incomeTax.amount).toBe(160529)
    expect(result.incomeTax.marginalRate).toBe(0.45)
    expect(result.solidaritySurcharge.amount).toBe(8829.09)
  })

  it('produces different results for different years (2025 vs 2026 have different Grundfreibetrag)', () => {
    const result2025 = incomeTax.validateAndCalculate({
      zve: 40_000,
      splitting: false,
      year: '2025',
    })
    const result2026 = incomeTax.validateAndCalculate({
      zve: 40_000,
      splitting: false,
      year: '2026',
    })

    expect(result2026.incomeTax.amount).toBeLessThan(
      result2025.incomeTax.amount,
    )
  })

  it('calculates ESt, Soli, and rates for 2026 Grundtarif at ZVE 80,000', () => {
    const result = incomeTax.validateAndCalculate({
      zve: 80_000,
      splitting: false,
      year: '2026',
    })

    expect(result).toMatchSnapshot()
  })

  it('calculates ESt, Soli, and rates for 2026 Grundtarif at ZVE 45,000 (zone 2, no Soli)', () => {
    const result = incomeTax.validateAndCalculate({
      zve: 45_000,
      splitting: false,
      year: '2026',
    })

    expect(result).toMatchSnapshot()
  })

  it('calculates ESt, Soli, and rates for 2026 Splittingverfahren at ZVE 200,000 (Soli applies)', () => {
    const result = incomeTax.validateAndCalculate({
      zve: 200_000,
      splitting: true,
      year: '2026',
    })

    expect(result).toMatchSnapshot()
  })

  it('calculates ESt, Soli, and rates for 2024 Grundtarif at ZVE 80,000', () => {
    const result = incomeTax.validateAndCalculate({
      zve: 80_000,
      splitting: false,
      year: '2024',
    })

    expect(result).toMatchSnapshot()
  })
})
