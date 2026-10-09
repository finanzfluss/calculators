import { describe, expect, it } from 'vitest'
import { avDepotSimulator } from '../../src/calculators/av-depot-simulator'
import { BERUFSEINSTEIGER_BONUS } from '../../src/constants/av-depot'

describe('/calculators/av-depot-simulator', () => {
  it('produces complete calculation output for standard inputs', () => {
    const data = avDepotSimulator.validateAndCalculate(sampleInputs())
    expect(data).toMatchSnapshot()
  })

  it('sums Zulagen and tax savings over all savings years', () => {
    const data = avDepotSimulator.validateAndCalculate(sampleInputs())

    expect(data.savings.totalGrundzulage).toBe(32 * (360 * 0.5 + 1440 * 0.25))
    expect(data.savings.totalKinderzulage).toBe(0)
    expect(data.savings.totalStarterBonus).toBe(0)
    expect(data.savings.totalTaxSaving).toBeGreaterThan(0)
    expect(data.savings.totalReinvestedTaxSaving).toBe(0)
  })

  it('reinvests the full tax saving in avDepot mode below the contribution cap', () => {
    const data = avDepotSimulator.validateAndCalculate({
      ...sampleInputs(),
      taxSavingsMode: 'avDepot',
    })

    expect(data.savings.totalReinvestedTaxSaving).toBeGreaterThan(0)
    expect(data.savings.totalReinvestedTaxSaving).toBeCloseTo(
      data.savings.totalTaxSaving,
      6,
    )
  })

  it('grants the starter bonus only when includeStarterBonus is set', () => {
    const young = { ...sampleInputs(), age: 22 }

    expect(
      avDepotSimulator.validateAndCalculate(young).savings.totalStarterBonus,
    ).toBe(BERUFSEINSTEIGER_BONUS)
    expect(
      avDepotSimulator.validateAndCalculate({
        ...young,
        includeStarterBonus: 'false',
      }).savings.totalStarterBonus,
    ).toBe(0)
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
