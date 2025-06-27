import { describe, expect, it } from 'vitest'
import {
  calcNetPolicy,
  NET_POLICY_QUERY_SCHEMA,
} from '../../src/calculators/net-policy'

const SHARED_QUERY = {
  savingRate: 250,
  taxAllowance: 1000,
  useGrossToNet: false,
  additionalIncome: 0,
  personalTaxRate: 35,
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
  it('should have correct table data', () => {
    const parsedQuery = NET_POLICY_QUERY_SCHEMA.parse({
      ...SHARED_QUERY,
      duration: 35,
    })

    const data = calcNetPolicy(parsedQuery)
    expect(data.tableData).toMatchSnapshot()
  })

  it('should work with fixed costs', () => {
    const parsedQuery = NET_POLICY_QUERY_SCHEMA.parse({
      ...SHARED_QUERY,
      duration: 35,
      fixedCosts: 12,
    })

    const data = calcNetPolicy(parsedQuery)

    expect(data.tableData.grossWorth.policy).toMatchInlineSnapshot('"374.366"')
    expect(data.tableData.netWorth.policy).toMatchInlineSnapshot(`"335.163"`)
  })

  it('should use different calculation for durations under 12 years', () => {
    const parsedQuery = NET_POLICY_QUERY_SCHEMA.parse({
      ...SHARED_QUERY,
      duration: 10,
    })

    const data = calcNetPolicy(parsedQuery)

    expect(data.tableData.gain.policy).toMatchInlineSnapshot(`"10.114"`)
    expect(data.tableData.gross.policy).toMatchInlineSnapshot(`"8.597"`)
    expect(data.tableData.tax.policy).toMatchInlineSnapshot(`"2.004"`)
    expect(data.tableData.netWorth.policy).toMatchInlineSnapshot(`"38.111"`)
  })
})
