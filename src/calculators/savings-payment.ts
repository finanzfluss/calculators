import type { z } from 'zod'
import { toDinero } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { pmt, pmtAccumulatingTaxed } from '../utils/financial'
import {
  getFinancialFunctionParameters,
  savingsBaseSchema,
} from './savings-utils'

const schema = savingsBaseSchema.omit({ savingRate: true })

type CalculatorInput = z.output<typeof schema>

export const savingsPayment = defineCalculator({
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
  const { considerCapitalGainsTax, distributionType, endValue, startValue } =
    parsedInput

  const { rate, numberOfPeriods, fvType, effectiveTaxRate } =
    getFinancialFunctionParameters(parsedInput)

  let payment: number
  if (considerCapitalGainsTax && distributionType === 'accumulating') {
    payment = -pmtAccumulatingTaxed(
      rate,
      numberOfPeriods,
      -startValue,
      endValue,
      effectiveTaxRate,
      fvType,
    )
  } else {
    payment = -pmt(rate, numberOfPeriods, -startValue, endValue, fvType)
  }

  const result = payment * getPaymentAdjustmentFactor(parsedInput)
  return toDinero(result).toUnit()
}

function getPaymentAdjustmentFactor(parsedInput: CalculatorInput): number {
  const {
    savingType,
    considerCapitalGainsTax,
    saveIntervalType,
    interestIntervalType,
  } = parsedInput
  const { rate } = getFinancialFunctionParameters(parsedInput, {
    forceConsiderTax: considerCapitalGainsTax,
  })
  if (saveIntervalType === 'monthly' && interestIntervalType === 'yearly') {
    const averageMonths = savingType === 'inAdvance' ? 6.5 : 5.5
    return 1 / (12 + averageMonths * rate)
  }
  if (saveIntervalType === 'monthly' && interestIntervalType === 'quarterly') {
    const averageMonths = savingType === 'inAdvance' ? 2 : 1
    return 1 / (3 + averageMonths * rate)
  }
  return 1 // No adjustment needed in all other cases
}

function calculateWithSimpleInterest(parsedInput: CalculatorInput) {
  const {
    // @keep-sorted
    capitalGainsTax,
    considerCapitalGainsTax,
    endValue,
    partialExemption,
    saveIntervalType,
    savingType,
    startValue,
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

  const interestOnInitial = startValue * effectiveInterestRate * numberOfPeriods
  const valueFromInitial = startValue + interestOnInitial
  const remainingToReach = endValue - valueFromInitial

  const savingRate =
    remainingToReach /
    (numberOfPeriods + totalInterestPeriods * effectiveInterestRate)

  return toDinero(savingRate).toUnit()
}
