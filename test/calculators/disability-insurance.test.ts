import { describe, expect, it } from 'vitest'
import { disabilityInsurance } from '../../src/calculators/disability-insurance'

describe('/calculators/disability-insurance', () => {
  it('returns coverage levels for default inputs', async () => {
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

  it('falls back to 18% of gross income when useCustomHalfDisabilityPension is false', () => {
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

  it('coerces stringified "0" flag from query params to false', () => {
    const result = disabilityInsurance.validateAndCalculate({
      grossIncome: 4000,
      netIncome: 2602,
      useCustomHalfDisabilityPension: '0', // frontend sends this as '0' or '1'
      customHalfDisabilityPension: 0,
    })
    expect(result.diagramData.intervalCoverages.at(-1)).toBe(627)
  })
})
