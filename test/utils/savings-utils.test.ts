import { describe, expect, it } from 'vitest'
import { savingsDuration } from '../../src/calculators/savings-duration'
import { savingsEndValue } from '../../src/calculators/savings-end-value'
import { savingsInterestRate } from '../../src/calculators/savings-interest-rate'
import { savingsPayment } from '../../src/calculators/savings-payment'
import { savingsStartValue } from '../../src/calculators/savings-start-value'
import { calcDiagramData } from '../../src/calculators/savings-utils'
import {
  formatNumber,
  formatResultWithTwoOptionalDecimals,
} from '../../src/utils'

describe('/calculators/savings-utils', () => {
  const sharedInput = {
    startValue: 1_000,
    yearlyInterest: 12,
    yearlyDuration: 2,
    capitalGainsTax: 50,
    partialExemption: 0,
    distributionType: 'distributing',
  }

  const testConfig = [
    {
      describes: 'without saving rate, without tax',
      input: {
        ...sharedInput,
        _savingRatePerYear: 0,
        considerCapitalGainsTax: false,
      },
      expected: [
        ['yearly', 'yearly', '1.254,40'],
        ['yearly', 'quarterly', '1.266,77'],
        ['yearly', 'monthly', '1.269,73'],
        ['monthly', 'yearly', '1.254,40'],
        ['monthly', 'quarterly', '1.266,77'],
        ['monthly', 'monthly', '1.269,73'],
      ],
    },
    {
      describes: 'without saving rate, with tax, distributing',
      input: {
        ...sharedInput,
        _savingRatePerYear: 0,
        considerCapitalGainsTax: true,
        distributionType: 'distributing',
      },
      expected: [
        ['yearly', 'yearly', '1.123,60'],
        ['yearly', 'quarterly', '1.126,49'],
        ['yearly', 'monthly', '1.127,16'],
        ['monthly', 'yearly', '1.123,60'],
        ['monthly', 'quarterly', '1.126,49'],
        ['monthly', 'monthly', '1.127,16'],
      ],
    },
    {
      describes: 'without saving rate, with tax, accumulating',
      input: {
        ...sharedInput,
        _savingRatePerYear: 0,
        considerCapitalGainsTax: true,
        distributionType: 'accumulating',
      },
      expected: [
        ['yearly', 'yearly', '1.127,20'],
        ['yearly', 'quarterly', '1.133,39'],
        ['yearly', 'monthly', '1.134,87'],
        ['monthly', 'yearly', '1.127,20'],
        ['monthly', 'quarterly', '1.133,39'],
        ['monthly', 'monthly', '1.134,87'],
      ],
    },
    {
      describes:
        'with in-advance saving rate, with zero interest, with tax, accumulating',
      input: {
        ...sharedInput,
        yearlyInterest: 0,
        _savingRatePerYear: 120,
        considerCapitalGainsTax: true,
        distributionType: 'accumulating',
      },
      expected: [
        ['yearly', 'yearly', '1.240'],
        ['yearly', 'quarterly', '1.240'],
        ['yearly', 'monthly', '1.240'],
        ['monthly', 'yearly', '1.240'],
        ['monthly', 'quarterly', '1.240'],
        ['monthly', 'monthly', '1.240'],
      ],
    },
    {
      describes: 'with in-advance saving rate, without tax',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inAdvance',
        considerCapitalGainsTax: false,
      },
      expected: [
        ['yearly', 'yearly', '1.539,33'],
        ['yearly', 'quarterly', '1.553,84'],
        ['yearly', 'monthly', '1.557,32'],
        ['monthly', 'yearly', '1.525,34'],
        ['monthly', 'quarterly', '1.538,88'],
        ['monthly', 'monthly', '1.542,17'],
      ],
    },
    {
      describes: 'with in-advance saving rate, with tax, distributing',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inAdvance',
        considerCapitalGainsTax: true,
        distributionType: 'distributing',
      },
      expected: [
        ['yearly', 'yearly', '1.385,63'],
        ['yearly', 'quarterly', '1.389,04'],
        ['yearly', 'monthly', '1.389,82'],
        ['monthly', 'yearly', '1.378,83'],
        ['monthly', 'quarterly', '1.382,01'],
        ['monthly', 'monthly', '1.382,75'],
      ],
    },
    {
      describes:
        'with in-advance saving rate, with tax, distributing, 30% exemption',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inAdvance',
        considerCapitalGainsTax: true,
        distributionType: 'distributing',
        partialExemption: 30,
      },
      expected: [
        ['yearly', 'yearly', '1.430,89'],
        ['yearly', 'quarterly', '1.436,76'],
        ['yearly', 'monthly', '1.438,13'],
        ['monthly', 'yearly', '1.421,98'],
        ['monthly', 'quarterly', '1.427,45'],
        ['monthly', 'monthly', '1.428,74'],
      ],
    },
    {
      describes: 'with in-advance saving rate, with tax, accumulating',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inAdvance',
        considerCapitalGainsTax: true,
        distributionType: 'accumulating',
      },
      expected: [
        ['yearly', 'yearly', '1.389,67'],
        ['yearly', 'quarterly', '1.396,92'],
        ['yearly', 'monthly', '1.398,66'],
        ['monthly', 'yearly', '1.382,67'],
        ['monthly', 'quarterly', '1.389,44'],
        ['monthly', 'monthly', '1.391,09'],
      ],
    },
    {
      describes:
        'with in-advance saving rate, with tax, accumulating, 30% exemption',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inAdvance',
        considerCapitalGainsTax: true,
        distributionType: 'accumulating',
        partialExemption: 30,
      },
      expected: [
        ['yearly', 'yearly', '1.434,56'],
        ['yearly', 'quarterly', '1.444'],
        ['yearly', 'monthly', '1.446,26'],
        ['monthly', 'yearly', '1.425,47'],
        ['monthly', 'quarterly', '1.434,27'],
        ['monthly', 'monthly', '1.436,41'],
      ],
    },
    {
      describes: 'with in-arrear saving rate, without tax',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inArrear',
        considerCapitalGainsTax: false,
      },
      expected: [
        ['yearly', 'yearly', '1.508,80'],
        ['yearly', 'quarterly', '1.521,83'],
        ['yearly', 'monthly', '1.524,95'],
        ['monthly', 'yearly', '1.522,79'],
        ['monthly', 'quarterly', '1.536,21'],
        ['monthly', 'monthly', '1.539,47'],
      ],
    },
    {
      describes: 'with in-arrear saving rate, with tax, distributing',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inArrear',
        considerCapitalGainsTax: true,
        distributionType: 'distributing',
      },
      expected: [
        ['yearly', 'yearly', '1.370,80'],
        ['yearly', 'quarterly', '1.373,86'],
        ['yearly', 'monthly', '1.374,56'],
        ['monthly', 'yearly', '1.377,60'],
        ['monthly', 'quarterly', '1.380,74'],
        ['monthly', 'monthly', '1.381,48'],
      ],
    },
    {
      describes:
        'with in-arrear saving rate, with tax, distributing, 30% exemption',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inArrear',
        considerCapitalGainsTax: true,
        distributionType: 'distributing',
        partialExemption: 30,
      },
      expected: [
        ['yearly', 'yearly', '1.411,44'],
        ['yearly', 'quarterly', '1.416,71'],
        ['yearly', 'monthly', '1.417,94'],
        ['monthly', 'yearly', '1.420,36'],
        ['monthly', 'quarterly', '1.425,78'],
        ['monthly', 'monthly', '1.427,06'],
      ],
    },
    {
      describes: 'with in-arrear saving rate, with tax, accumulating',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inArrear',
        considerCapitalGainsTax: true,
        distributionType: 'accumulating',
      },
      expected: [
        ['yearly', 'yearly', '1.374,40'],
        ['yearly', 'quarterly', '1.380,92'],
        ['yearly', 'monthly', '1.382,48'],
        ['monthly', 'yearly', '1.381,40'],
        ['monthly', 'quarterly', '1.388,11'],
        ['monthly', 'monthly', '1.389,74'],
      ],
    },
    {
      describes:
        'with in-arrear saving rate, with tax, accumulating, 30% exemption',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inArrear',
        considerCapitalGainsTax: true,
        distributionType: 'accumulating',
        partialExemption: 30,
      },
      expected: [
        ['yearly', 'yearly', '1.414,72'],
        ['yearly', 'quarterly', '1.423,19'],
        ['yearly', 'monthly', '1.425,22'],
        ['monthly', 'yearly', '1.423,81'],
        ['monthly', 'quarterly', '1.432,54'],
        ['monthly', 'monthly', '1.434,66'],
      ],
    },
    {
      describes: 'without saving rate, without tax, without compound interest',
      input: {
        ...sharedInput,
        _savingRatePerYear: 0,
        useCompoundInterest: false,
        considerCapitalGainsTax: false,
      },
      expected: [
        ['yearly', 'yearly', '1.240'],
        ['yearly', 'quarterly', '1.240'],
        ['yearly', 'monthly', '1.240'],
        ['monthly', 'yearly', '1.240'],
        ['monthly', 'quarterly', '1.240'],
        ['monthly', 'monthly', '1.240'],
      ],
    },
    {
      describes: 'without saving rate, with tax, without compound interest',
      input: {
        ...sharedInput,
        _savingRatePerYear: 0,
        useCompoundInterest: false,
        considerCapitalGainsTax: true,
      },
      expected: [
        ['yearly', 'yearly', '1.120'],
        ['yearly', 'quarterly', '1.120'],
        ['yearly', 'monthly', '1.120'],
        ['monthly', 'yearly', '1.120'],
        ['monthly', 'quarterly', '1.120'],
        ['monthly', 'monthly', '1.120'],
      ],
    },
    {
      describes:
        'with in-advance saving rate, without tax, without compound interest',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inAdvance',
        useCompoundInterest: false,
        considerCapitalGainsTax: false,
      },
      expected: [
        ['yearly', 'yearly', '1.523,20'],
        ['yearly', 'quarterly', '1.523,20'],
        ['yearly', 'monthly', '1.523,20'],
        ['monthly', 'yearly', '1.510'],
        ['monthly', 'quarterly', '1.510'],
        ['monthly', 'monthly', '1.510'],
      ],
    },
    {
      describes:
        'with in-advance saving rate, with tax, without compound interest',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inAdvance',
        useCompoundInterest: false,
        considerCapitalGainsTax: true,
      },
      expected: [
        ['yearly', 'yearly', '1.381,60'],
        ['yearly', 'quarterly', '1.381,60'],
        ['yearly', 'monthly', '1.381,60'],
        ['monthly', 'yearly', '1.375'],
        ['monthly', 'quarterly', '1.375'],
        ['monthly', 'monthly', '1.375'],
      ],
    },
    {
      describes:
        'with in-arrear saving rate, without tax, without compound interest',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inArrear',
        useCompoundInterest: false,
        considerCapitalGainsTax: false,
      },
      expected: [
        ['yearly', 'yearly', '1.494,40'],
        ['yearly', 'quarterly', '1.494,40'],
        ['yearly', 'monthly', '1.494,40'],
        ['monthly', 'yearly', '1.507,60'],
        ['monthly', 'quarterly', '1.507,60'],
        ['monthly', 'monthly', '1.507,60'],
      ],
    },
    {
      describes:
        'with in-arrear saving rate, with tax, without compound interest',
      input: {
        ...sharedInput,
        _savingRatePerYear: 120,
        savingType: 'inArrear',
        useCompoundInterest: false,
        considerCapitalGainsTax: true,
      },
      expected: [
        ['yearly', 'yearly', '1.367,20'],
        ['yearly', 'quarterly', '1.367,20'],
        ['yearly', 'monthly', '1.367,20'],
        ['monthly', 'yearly', '1.373,80'],
        ['monthly', 'quarterly', '1.373,80'],
        ['monthly', 'monthly', '1.373,80'],
      ],
    },
  ] as const

  describe('end value calculation', () => {
    for (const { describes, input, expected } of testConfig) {
      describe(describes, () => {
        for (const [
          saveIntervalType,
          interestIntervalType,
          expectedValue,
        ] of expected) {
          it(`should return correct values for ${saveIntervalType} / ${interestIntervalType}`, () => {
            const result = savingsEndValue.validateAndCalculate({
              ...input,
              saveIntervalType,
              interestIntervalType,
              savingRate:
                input._savingRatePerYear /
                (saveIntervalType === 'monthly' ? 12 : 1),
            })

            const formattedResult = formatResultWithTwoOptionalDecimals(result)
            expect(formattedResult).toBe(`${expectedValue}€`)
          })
        }
      })
    }
  })

  describe('payment calculation', () => {
    for (const { describes, input, expected } of testConfig) {
      describe(describes, () => {
        for (const [
          saveIntervalType,
          interestIntervalType,
          endValueString,
        ] of expected) {
          const { endValue, savingRate } = parseTestData(
            endValueString,
            saveIntervalType,
            input._savingRatePerYear,
          )

          it(`should return correct values for ${saveIntervalType} / ${interestIntervalType}`, () => {
            const result = savingsPayment.validateAndCalculate({
              ...input,
              saveIntervalType,
              interestIntervalType,
              savingRate,
              endValue,
            })

            const formattedResult = formatResultWithTwoOptionalDecimals(result)
            const expected = formatResultWithTwoOptionalDecimals(savingRate)
            const expectedPlus1Cent = formatResultWithTwoOptionalDecimals(
              savingRate + 0.01, // Sometimes we are off by 1 cent due to rounding issues
            )

            expect(formattedResult).toBeOneOf([expected, expectedPlus1Cent])
          })
        }
      })
    }
  })

  describe('start value calculation', () => {
    for (const { describes, input, expected } of testConfig) {
      describe(describes, () => {
        for (const [
          saveIntervalType,
          interestIntervalType,
          endValueString,
        ] of expected) {
          const { endValue, savingRate } = parseTestData(
            endValueString,
            saveIntervalType,
            input._savingRatePerYear,
          )

          it(`should return correct values for ${saveIntervalType} / ${interestIntervalType}`, () => {
            const result = savingsStartValue.validateAndCalculate({
              ...input,
              saveIntervalType,
              interestIntervalType,
              savingRate,
              endValue,
            })

            const formattedResult = formatResultWithTwoOptionalDecimals(result)
            const expected = formatResultWithTwoOptionalDecimals(
              input.startValue,
            )
            const expectedPlus1Cent = formatResultWithTwoOptionalDecimals(
              input.startValue + 0.01, // Sometimes we are off by 1 cent due to rounding issues
            )

            expect(formattedResult).toBeOneOf([expected, expectedPlus1Cent])
          })
        }
      })
    }
  })

  describe('duration calculation', () => {
    for (const { describes, input, expected } of testConfig) {
      describe(describes, () => {
        for (const [
          saveIntervalType,
          interestIntervalType,
          endValueString,
        ] of expected) {
          const { endValue, savingRate } = parseTestData(
            endValueString,
            saveIntervalType,
            input._savingRatePerYear,
          )

          it(`should return correct values for ${saveIntervalType} / ${interestIntervalType}`, () => {
            const result = savingsDuration.validateAndCalculate({
              ...input,
              saveIntervalType,
              interestIntervalType,
              savingRate,
              endValue,
            })

            expect.soft(result).toBeCloseTo(input.yearlyDuration, 3)
            const formattedResult = formatNumber(result)
            const expected = formatNumber(input.yearlyDuration)
            expect(formattedResult).toBe(expected)
          })
        }
      })
    }
  })

  describe('interest rate calculation', () => {
    for (const { describes, input, expected } of testConfig) {
      describe(describes, () => {
        for (const [
          saveIntervalType,
          interestIntervalType,
          endValueString,
        ] of expected) {
          const { endValue, savingRate } = parseTestData(
            endValueString,
            saveIntervalType,
            input._savingRatePerYear,
          )

          it(`should return correct values for ${saveIntervalType} / ${interestIntervalType}`, () => {
            const result =
              100 *
              savingsInterestRate.validateAndCalculate({
                ...input,
                saveIntervalType,
                interestIntervalType,
                savingRate,
                endValue,
              })

            expect.soft(result).toBeCloseTo(input.yearlyInterest, 3)
            const formattedResult = formatNumber(result)
            const expected = formatNumber(input.yearlyInterest)
            expect(formattedResult).toBe(expected)
          })
        }
      })
    }
  })

  function parseTestData(
    endValueString: string,
    saveIntervalType: string,
    savingRatePerYear: number,
  ) {
    const endValue = Number(endValueString.replace('.', '').replace(',', '.'))
    const savingRate =
      savingRatePerYear / (saveIntervalType === 'monthly' ? 12 : 1)

    return { endValue, savingRate }
  }

  describe('calcDiagramData', () => {
    const baseConfig = {
      ...testConfig[1].input,
      endValue: 100,
      savingRate: 0,
      savingType: 'inAdvance',
      useCompoundInterest: false,
    } as const

    it('should delay interest calculation until first full year with yearly/yearly intervals', () => {
      const result = calcDiagramData({
        ...baseConfig,
        saveIntervalType: 'yearly',
        interestIntervalType: 'yearly',
      })

      const interests = result.INTEREST_LIST || []
      expect(interests.slice(0, 11).every((v) => v === 0)).toBe(true)
      expect(interests[12]).toBeGreaterThan(0)
    })

    it('should delay interest calculation until first quarter with yearly/quarterly intervals', () => {
      const result = calcDiagramData({
        ...baseConfig,
        saveIntervalType: 'yearly',
        interestIntervalType: 'quarterly',
      })

      const interests = result.INTEREST_LIST || []
      expect(interests.slice(0, 2).every((v) => v === 0)).toBe(true)
      expect(interests[3]).toBeGreaterThan(0)
    })

    it('should delay interest calculation until first quarter with monthly/quarterly intervals', () => {
      const result = calcDiagramData({
        ...baseConfig,
        saveIntervalType: 'monthly',
        interestIntervalType: 'quarterly',
      })

      const interests = result.INTEREST_LIST || []
      expect(interests.slice(0, 2).every((v) => v === 0)).toBe(true)
      expect(interests[3]).toBeGreaterThan(0)
    })

    it('should calculate interest immediately with yearly/monthly intervals', () => {
      const result = calcDiagramData({
        ...baseConfig,
        saveIntervalType: 'yearly',
        interestIntervalType: 'monthly',
      })

      const interests = result.INTEREST_LIST || []
      expect(interests[0]).toBeGreaterThan(0)
    })

    it('should return empty interest list when duration is zero', () => {
      const result = calcDiagramData({
        ...baseConfig,
        yearlyDuration: 0,
        saveIntervalType: 'yearly',
        interestIntervalType: 'yearly',
      })

      const interests = result.INTEREST_LIST || []
      expect(interests.length).toBe(0)
    })
  })
})
