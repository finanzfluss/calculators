import { describe, expect, it, vi } from 'vitest'
import { avDepot } from '../../src/calculators/av-depot'
import { BERUFSEINSTEIGER_BONUS } from '../../src/constants/av-depot'
import { parseCurrency } from '../../src/utils'

describe('/calculators/av-depot', () => {
  it('produces complete calculation output for standard inputs', () => {
    const data = avDepot.validateAndCalculate(sampleInputs())
    expect(data).toMatchSnapshot()
  })

  it('calculates correct savings and payout totals', () => {
    const data = avDepot.validateAndCalculate(sampleInputs())

    const lastYear = data.savingsPerYear[data.savingsPerYear.length - 1]!
    expect(lastYear.capitalEnd.normalDepot).toMatchInlineSnapshot(`"528.579€"`)
    expect(lastYear.grossReturn.normalDepot).toMatchInlineSnapshot(`"34.360€"`)

    expect(data.totalContributions.normalDepot).toMatchInlineSnapshot(
      `"160.000€"`,
    )
    expect(data.totalVorabpauschale.normalDepot).toMatchInlineSnapshot(
      `"114.879€"`,
    )
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"528.579€"`)
    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"617.285€"`)

    expect(data.payoutTotal.gross.normalDepot).toMatchInlineSnapshot(
      `"628.716€"`,
    )
    expect(data.payoutTotal.tax.normalDepot).toMatchInlineSnapshot(`"50.579€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"578.137€"`)
    expect(data.payoutTotal.gross.avDepot).toMatchInlineSnapshot(`"726.434€"`)
    expect(data.payoutTotal.tax.avDepot).toMatchInlineSnapshot(`"137.233€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"589.200€"`)
  })

  it('increases AV depot capital with Kinderzulage', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      childBirthYears: [2026, 2019],
    })

    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"637.769€"`)
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"528.579€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"596.414€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"578.137€"`)
  })

  it('normalizes a single childBirthYears value into an array', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      childBirthYears: 2026,
    })

    const withArray = avDepot.validateAndCalculate({
      ...sampleInputs(),
      childBirthYears: [2026],
    })

    expect(data.finalCapital.avDepot).toBe(withArray.finalCapital.avDepot)
  })

  it('reduces AV depot capital when tax savings are consumed', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      taxSavingsMode: 'consume',
    })

    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"587.306€"`)
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"528.579€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"554.239€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"578.137€"`)
  })

  it('increases AV depot capital when tax savings are reinvested', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      taxSavingsMode: 'avDepot',
    })

    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"616.141€"`)
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"528.579€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"584.016€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"578.137€"`)
  })

  it('defaults to the product start year 2027 if current year is before 2027', () => {
    vi.setSystemTime(`2026-01-01`)
    const { currentYear: _currentYear, ...inputsWithoutCurrentYear } =
      sampleInputs()

    const defaulted = avDepot.validateAndCalculate(inputsWithoutCurrentYear)
    const explicitFirstProductYear = avDepot.validateAndCalculate({
      currentYear: 2027,
      ...inputsWithoutCurrentYear,
    })

    expect(defaulted.finalCapital.avDepot).toBe(
      explicitFirstProductYear.finalCapital.avDepot,
    )
  })

  it('rejects contribution years before the product exists', () => {
    expect(() =>
      avDepot.validateAndCalculate({
        ...sampleInputs(),
        currentYear: 2026,
      }),
    ).toThrow()
  })

  it('rejects fractional payout ages in the whole-year model', () => {
    expect(() =>
      avDepot.validateAndCalculate({
        ...sampleInputs(),
        payoutUntilAge: 85.5,
      }),
    ).toThrow()
  })

  it('treats omitted childBirthYears the same as an empty array', () => {
    const { childBirthYears: _childBirthYears, ...inputsWithoutChildren } =
      sampleInputs()

    const data = avDepot.validateAndCalculate(inputsWithoutChildren)
    const withEmptyArray = avDepot.validateAndCalculate({
      ...sampleInputs(),
      childBirthYears: [],
    })

    expect(data.finalCapital.avDepot).toBe(withEmptyArray.finalCapital.avDepot)
  })

  it('does not tax Überzahlung when contributions stay within the subsidized cap', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      savingsRate: 1_500,
    })

    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"232.451€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"200.469€"`)
  })

  it('taxes the full gain without Halbeinkünfteverfahren for short savings phases', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      age: 64,
      retirementAge: 65,
    })

    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"6.275€"`)
  })

  it('applies the Berufseinsteigerbonus for savers under 25 in their first year', () => {
    const withBonus = avDepot.validateAndCalculate({
      ...sampleInputs(),
      age: 24,
      taxSavingsMode: 'avDepot',
    })
    const withoutBonus = avDepot.validateAndCalculate({
      ...sampleInputs(),
      age: 25,
      taxSavingsMode: 'avDepot',
    })

    const firstYearContributionDiff =
      parseCurrency(withBonus.savingsPerYear[0]!.contribution.avDepot) -
      parseCurrency(withoutBonus.savingsPerYear[0]!.contribution.avDepot)

    expect(firstYearContributionDiff).toBe(BERUFSEINSTEIGER_BONUS)
    expect(withBonus.savingsPerYear[1]!.contribution.avDepot).toBe(
      withoutBonus.savingsPerYear[1]!.contribution.avDepot,
    )
  })

  it('applies günstigerprüfung when marginal income tax rate is lower than Abgeltungsteuer', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      zveSavingsPhase: 5_000,
    })

    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"587.306€"`)
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"551.091€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"554.239€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"600.373€"`)
  })

  it('preserves the basis of a reinvested tax refund', () => {
    const common = {
      ...sampleInputs(),
      age: 63,
      currentYear: 2027,
      retirementAge: 65,
      savingsRate: 1_800,
      etfReturnRate: 0.0001,
      avDepotCosts: 0,
      baseRate: 0,
      oneTimePayout: 0,
      payoutReturnRate: 0.0001,
      exemptionOrder: 0,
      payoutUntilAge: 85,
    }
    const consumed = avDepot.validateAndCalculate({
      ...common,
      taxSavingsMode: 'consume',
    })
    const reinvested = avDepot.validateAndCalculate({
      ...common,
      taxSavingsMode: 'avDepot',
    })

    const addedCapital =
      parseCurrency(reinvested.finalCapital.avDepot) -
      parseCurrency(consumed.finalCapital.avDepot)
    const addedNetPayout =
      parseCurrency(reinvested.payoutTotal.net.avDepot) -
      parseCurrency(consumed.payoutTotal.net.avDepot)

    expect(addedCapital).toBeGreaterThan(0)
    expect(addedNetPayout).toBeCloseTo(addedCapital, 2)
  })

  it('reports the gross Vorabpauschale, capped at the actual appreciation', () => {
    const uncapped = avDepot.validateAndCalculate(sampleInputs())
    const year2 = uncapped.savingsPerYear[1]!
    expect(parseCurrency(year2.vorabpauschale.normalDepot)).toBe(
      Math.round(5_000 * 0.03 * 0.7),
    )

    const capped = avDepot.validateAndCalculate({
      ...sampleInputs(),
      etfReturnRate: 1,
      avDepotCosts: 0,
      baseRate: 10,
    })
    for (const year of capped.savingsPerYear) {
      expect(year.vorabpauschale.normalDepot).toBe(year.grossReturn.normalDepot)
    }
  })

  it('does not tax gains again at payout that were already taxed as Vorabpauschale', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      etfReturnRate: 1.4,
      avDepotCosts: 0,
      baseRate: 2,
      exemptionOrder: 0,
    })

    expect(
      parseCurrency(data.savingsPerYear[1]!.vorabpauschaleTax.normalDepot),
    ).toBeGreaterThan(0)
    expect(parseCurrency(data.firstPayoutYear.tax.normalDepot)).toBe(0)
  })
})

function sampleInputs() {
  return {
    currentYear: 2027,
    age: 35,
    retirementAge: 67,
    zveSavingsPhase: 50_000,
    zveRetirement: 20_000,
    savingsRate: 5_000,
    etfReturnRate: 7.0,
    avDepotCosts: 0.2,
    exemptionOrder: 1_000,
    taxSavingsMode: 'secondaryDepot' as const,
    baseRate: 3,
    oneTimePayout: 30,
    payoutReturnRate: 3.0,
    payoutUntilAge: 85,
    childBirthYears: [],
  }
}
