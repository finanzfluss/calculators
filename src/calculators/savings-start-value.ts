import type { z } from 'zod'
import { toDinero } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { pv, pvAccumulatingTaxed } from '../utils/financial'
import { bisectByEndValue } from './savings-end-value'
import {
  getFinancialFunctionParameters,
  savingsBaseSchema,
} from './savings-utils'

const schema = savingsBaseSchema.omit({ startValue: true })

type CalculatorInput = z.output<typeof schema>

export const savingsStartValue = defineCalculator({
  schema,
  calculate,
})

function calculate(parsedInput: CalculatorInput) {
  const { useCompoundInterest } = parsedInput

  if (useCompoundInterest) {
    return calculateWithCompoundInterest(parsedInput)
  } else {
    return calculateWithSimpleInterest(parsedInput)
  }
}

function calculateWithCompoundInterest(parsedInput: CalculatorInput) {
  const {
    considerCapitalGainsTax,
    distributionType,
    endValue,
    interestIntervalType,
    saveIntervalType,
  } = parsedInput

  const { rate, numberOfPeriods, payments, fvType, effectiveTaxRate } =
    getFinancialFunctionParameters(parsedInput)

  let startValue: number
  if (considerCapitalGainsTax && distributionType === 'accumulating') {
    if (saveIntervalType === 'monthly' && interestIntervalType === 'monthly') {
      startValue = -pvAccumulatingTaxed(
        rate,
        numberOfPeriods,
        -payments,
        endValue,
        effectiveTaxRate,
        fvType,
      )
    } else {
      startValue = bisectByEndValue({
        targetEndValue: endValue,
        baseInput: parsedInput,
        paramName: 'startValue',
        searchRange: { lower: 0, upper: endValue },
      })
    }
  } else {
    startValue = -pv(rate, numberOfPeriods, -payments, endValue, fvType)
  }
  return toDinero(startValue).toUnit()
}

function calculateWithSimpleInterest(parsedInput: CalculatorInput) {
  const {
    // @keep-sorted
    capitalGainsTax,
    considerCapitalGainsTax,
    endValue,
    partialExemption,
    saveIntervalType,
    savingRate,
    savingType,
    yearlyDuration,
    yearlyInterest,
  } = parsedInput

  const taxFactor = considerCapitalGainsTax
    ? 1 - (capitalGainsTax / 100) * (1 - partialExemption / 100)
    : 1
  const periodsPerYear = saveIntervalType === 'yearly' ? 1 : 12
  const effectiveInterestRate =
    ((yearlyInterest / periodsPerYear) * taxFactor) / 100
  const numberOfPeriods = yearlyDuration * periodsPerYear

  const lastPeriodAdjustment =
    numberOfPeriods + (savingType === 'inAdvance' ? 1 : -1)
  const totalInterestPeriods = (numberOfPeriods * lastPeriodAdjustment) / 2

  const totalSavings = savingRate * numberOfPeriods
  const interestOnSavings =
    savingRate * totalInterestPeriods * effectiveInterestRate
  const valueFromSavings = totalSavings + interestOnSavings
  const remainingToReach = endValue - valueFromSavings

  const startValue =
    remainingToReach / (1 + effectiveInterestRate * numberOfPeriods)

  return toDinero(startValue).toUnit()
}
