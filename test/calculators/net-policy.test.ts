import { describe, expect, it } from 'vitest'
import { netPolicy } from '../../src/calculators/net-policy'

const SHARED_INPUT = {
  savingRate: 250,
  taxAllowance: 1000,
  additionalIncome: 0,
  capitalGainsTax: 26.375,

  placementCommission: 299,
  savingRateCosts: 4,
  balanceCosts: 0.22,
  minimumCosts: 30,

  ter: 0.15,
  expectedInterest: 7,
  partialExemption: 30,

  reallocationOccurrence: 10,
  reallocationRate: 40,
}

describe('calculators/net-policy', () => {
  it('returns table data comparing policy vs ETF over 35 years', () => {
    const data = netPolicy.validateAndCalculate({
      ...SHARED_INPUT,
      duration: 35,
    })

    expect(data.tableData).toMatchSnapshot()
  })

  it('subtracts fixedCosts from gross worth and net worth', () => {
    const data = netPolicy.validateAndCalculate({
      ...SHARED_INPUT,
      duration: 35,
      fixedCosts: 12,
    })

    expect(data.tableData.grossWorth.policy).toMatchInlineSnapshot(`"374.384"`)
    expect(data.tableData.netWorth.policy).toMatchInlineSnapshot(`"335.482"`)
  })

  it('applies the pre-12-year tax rule for short durations', () => {
    const data = netPolicy.validateAndCalculate({
      ...SHARED_INPUT,
      duration: 10,
    })

    expect(data.tableData.gain.policy).toMatchInlineSnapshot(`"10.115"`)
    expect(data.tableData.gross.policy).toMatchInlineSnapshot(`"8.597"`)
    expect(data.tableData.tax.policy).toMatchInlineSnapshot(`"2.004"`)
    expect(data.tableData.netWorth.policy).toMatchInlineSnapshot(`"38.111"`)
  })
})
