import { describe, expect, it } from 'vitest'
import { disabilityInsurance } from '../../src/calculators/disability-insurance'

describe('/calculators/disability-insurance', () => {
  it('returns correct levels', async () => {
    const result = disabilityInsurance.validateAndCalculate({
      grossIncome: 4000,
      netIncome: 2602,
      customHalfDisabilityPension: 720,
    })
    expect(result.tableData).toMatchSnapshot()
  })

  it('includes custom pension amount if useCustomPensionAmount is true', () => {
    const result = disabilityInsurance.validateAndCalculate({
      grossIncome: 4000,
      netIncome: 2602,
      customHalfDisabilityPension: 720,
      useCustomPensionAmount: true,
      customPensionAmount: 500,
    })
    expect(result.tableData.levelCustom).toBe('500,00€')
  })

  it('calculates half disability pension correctly', () => {
    const resultWithCustom = disabilityInsurance.validateAndCalculate({
      grossIncome: 4000,
      netIncome: 2602,
      useCustomHalfDisabilityPension: true,
      customHalfDisabilityPension: 720,
    })
    const resultWithoutCustom = disabilityInsurance.validateAndCalculate({
      grossIncome: 4000,
      netIncome: 2602,
      useCustomHalfDisabilityPension: false,
      customHalfDisabilityPension: 0,
    })
    expect(resultWithoutCustom.diagramData.intervalCoverages.at(-1)).toBe(
      resultWithCustom.diagramData.intervalCoverages.at(-1),
    )
  })

  it('parses query-style flag values correctly', () => {
    const result = disabilityInsurance.validateAndCalculate({
      grossIncome: 4000,
      netIncome: 2602,
      useCustomHalfDisabilityPension: '0', // frontend sends this as '0' or '1'
      customHalfDisabilityPension: 0,
    })
    expect(result.diagramData.intervalCoverages.at(-1)).toBe(627)
  })
})
