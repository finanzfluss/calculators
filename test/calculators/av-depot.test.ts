import { describe, expect, it } from 'vitest'
import { avDepot } from '../../src/calculators/av-depot'
import {
  addFundLot,
  calculateGrossVorabpauschale,
  calculateTaxableFundSaleGain,
  createTaxableDepot,
  growTaxableDepot,
  sellFundLots,
} from '../../src/calculators/av-depot-tax'
import { incomeTax } from '../../src/calculators/income-tax'
import {
  BERUFSEINSTEIGER_BONUS,
  INCOME_TAX_YEAR,
  TAXABLE_EQUITY_FUND_FRACTION,
} from '../../src/constants/av-depot'
import { parseCurrency } from '../../src/utils'

describe('/calculators/av-depot', () => {
  it('produces complete calculation output for standard inputs', () => {
    const data = avDepot.validateAndCalculate(sampleInputs())
    expect(data).toMatchSnapshot()
  })

  it('calculates correct savings and payout totals', () => {
    const data = avDepot.validateAndCalculate(sampleInputs())

    const lastYear = data.savingsPerYear[data.savingsPerYear.length - 1]!
    expect(lastYear.capitalEnd.normalDepot).toMatchInlineSnapshot(`"531.491€"`)
    expect(lastYear.grossReturn.normalDepot).toMatchInlineSnapshot(`"34.542€"`)

    expect(data.totalContributions.normalDepot).toMatchInlineSnapshot(
      `"160.000€"`,
    )
    expect(data.totalVorabpauschale.normalDepot).toMatchInlineSnapshot(
      `"115.280€"`,
    )
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"531.491€"`)
    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"615.070€"`)

    expect(data.payoutTotal.gross.normalDepot).toMatchInlineSnapshot(
      `"632.180€"`,
    )
    expect(data.payoutTotal.tax.normalDepot).toMatchInlineSnapshot(`"51.149€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"581.032€"`)
    expect(data.payoutTotal.gross.avDepot).toMatchInlineSnapshot(`"723.799€"`)
    expect(data.payoutTotal.tax.avDepot).toMatchInlineSnapshot(`"137.146€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"586.653€"`)
  })

  it('increases AV depot capital with Kinderzulage', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      childBirthYears: [2026, 2019],
    })

    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"636.951€"`)
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"531.491€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"595.440€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"581.032€"`)
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
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"531.491€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"554.239€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"581.032€"`)
  })

  it('increases AV depot capital when tax savings are reinvested', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      taxSavingsMode: 'avDepot',
    })

    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"614.050€"`)
    expect(data.finalCapital.normalDepot).toMatchInlineSnapshot(`"531.491€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"581.935€"`)
    expect(data.payoutTotal.net.normalDepot).toMatchInlineSnapshot(`"581.032€"`)
  })

  it('defaults to the product start year or the current year, whichever is later', () => {
    const { currentYear: _currentYear, ...inputsWithoutCurrentYear } =
      sampleInputs()

    const defaulted = avDepot.validateAndCalculate(inputsWithoutCurrentYear)
    const explicitFirstProductYear = avDepot.validateAndCalculate({
      currentYear: Math.max(2027, new Date().getFullYear()),
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

    expect(data.finalCapital.avDepot).toMatchInlineSnapshot(`"230.667€"`)
    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"198.418€"`)
  })

  it('taxes the full gain without Halbeinkünfteverfahren for short savings phases', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      age: 64,
      retirementAge: 65,
    })

    expect(data.payoutTotal.net.avDepot).toMatchInlineSnapshot(`"5.945€"`)
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

  it('caps the gross Vorabpauschale at the actual fund appreciation', () => {
    const grossVorabpauschale = calculateGrossVorabpauschale(
      100_000,
      1_000,
      0.03,
    )

    expect(grossVorabpauschale).toBe(1_000)
    expect(grossVorabpauschale * TAXABLE_EQUITY_FUND_FRACTION).toBe(700)
  })

  it('deducts gross Vorabpauschalen before applying the partial exemption', () => {
    expect(calculateTaxableFundSaleGain(20_000, 2_100)).toBe(12_530)
  })

  it('sells fund units when Vorabpauschale tax exceeds the new contribution', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      age: 59,
      retirementAge: 65,
      savingsRate: 120,
      etfReturnRate: 100,
      avDepotCosts: 0,
      exemptionOrder: 0,
      taxSavingsMode: 'consume',
      baseRate: 100,
    })

    expect(
      data.savingsPerYear.some(
        (year) => parseCurrency(year.vorabpauschaleTax.normalDepot) > 120,
      ),
    ).toBe(true)
  })

  it('uses FIFO when selling shares from a taxable depot', () => {
    const depot = createTaxableDepot()
    addFundLot(depot, 100)
    growTaxableDepot(depot, 1)
    addFundLot(depot, 100)

    const sale = sellFundLots(depot, 150)

    expect(sale.taxableGain).toBeCloseTo(52.5)
  })

  it('calculates the § 10a benefit from tariff income tax without solidarity surcharge', () => {
    const common = {
      ...sampleInputs(),
      age: 63,
      retirementAge: 65,
      savingsRate: 1_800,
      zveSavingsPhase: 100_000,
      etfReturnRate: 0,
      avDepotCosts: 0,
      baseRate: 0,
      oneTimePayout: 0,
      payoutReturnRate: 0,
    }
    const consumed = avDepot.validateAndCalculate({
      ...common,
      taxSavingsMode: 'consume',
    })
    const reinvested = avDepot.validateAndCalculate({
      ...common,
      taxSavingsMode: 'secondaryDepot',
    })
    const tariffTax = (zve: number) =>
      parseCurrency(
        incomeTax.validateAndCalculate({
          zve,
          splitting: false,
          year: String(INCOME_TAX_YEAR),
        }).incomeTax.amount,
      )
    const grundzulage = 540
    const expectedBenefit =
      tariffTax(common.zveSavingsPhase) -
      tariffTax(common.zveSavingsPhase - common.savingsRate - grundzulage) -
      grundzulage

    expect(
      parseCurrency(reinvested.finalCapital.avDepot) -
        parseCurrency(consumed.finalCapital.avDepot),
    ).toBe(expectedBenefit)
    expect(expectedBenefit).toBe(443)
  })

  it('reinvests a tax refund no earlier than the following contribution year', () => {
    const consumed = avDepot.validateAndCalculate({
      ...sampleInputs(),
      taxSavingsMode: 'consume',
    })
    const reinvested = avDepot.validateAndCalculate({
      ...sampleInputs(),
      taxSavingsMode: 'avDepot',
    })

    expect(reinvested.savingsPerYear[0]!.contribution.avDepot).toBe(
      consumed.savingsPerYear[0]!.contribution.avDepot,
    )
    expect(
      parseCurrency(reinvested.savingsPerYear[1]!.contribution.avDepot),
    ).toBeGreaterThan(
      parseCurrency(consumed.savingsPerYear[1]!.contribution.avDepot),
    )
  })

  it('preserves the basis of a reinvested tax refund', () => {
    const common = {
      ...sampleInputs(),
      age: 63,
      currentYear: 2027,
      retirementAge: 65,
      savingsRate: 1_800,
      etfReturnRate: 0,
      avDepotCosts: 0,
      baseRate: 0,
      oneTimePayout: 0,
      payoutReturnRate: 0,
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

  it('accepts loss scenarios and assesses no Vorabpauschale for them', () => {
    const data = avDepot.validateAndCalculate({
      ...sampleInputs(),
      etfReturnRate: -10,
      avDepotCosts: 0,
      payoutReturnRate: -5,
    })

    expect(data.totalVorabpauschale.normalDepot).toBe('0,00€')
    expect(data.totalVorabpauschale.avDepot).toBe('0,00€')
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
