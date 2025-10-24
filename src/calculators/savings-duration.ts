import type { z } from 'zod'
import { defineCalculator } from '../utils/calculator'
import { nper, nperAccumulatingTaxed } from '../utils/financial'
import {
  getFinancialFunctionParameters,
  savingsBaseSchema,
} from './savings-utils'

const schema = savingsBaseSchema.omit({ yearlyDuration: true })

type CalculatorInput = z.output<typeof schema>

export const savingsDuration = defineCalculator({
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

  const {
    rate,
    payments,
    fvType,
    numberOfPeriods: periodsPerYear,
    effectiveTaxRate,
  } = getFinancialFunctionParameters(parsedInput)

  let actualPeriods: number
  if (considerCapitalGainsTax && distributionType === 'accumulating') {
    actualPeriods = nperAccumulatingTaxed(
      rate,
      -payments,
      -startValue,
      endValue,
      effectiveTaxRate,
      fvType,
    )
  } else {
    actualPeriods = nper(rate, -payments, -startValue, endValue, fvType)
  }
  const numberOfPeriods = actualPeriods / periodsPerYear
  return numberOfPeriods
}

/* v8 ignore next -- @preserve */
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
    startValue,
    yearlyInterest,
  } = parsedInput

  const taxFactor = considerCapitalGainsTax
    ? 1 - (capitalGainsTax / 100) * (1 - partialExemption / 100)
    : 1
  const periodsPerYear = saveIntervalType === 'yearly' ? 1 : 12
  const effectiveInterestRate =
    ((yearlyInterest / periodsPerYear) * taxFactor) / 100

  const toYears = (numberOfPeriods: number) =>
    numberOfPeriods <= 0
      ? Number.POSITIVE_INFINITY
      : numberOfPeriods / periodsPerYear

  if (savingRate === 0) {
    if (startValue === 0) {
      return Number.POSITIVE_INFINITY // Cannot reach endValue without startValue or savings
    }
    if (Math.abs(effectiveInterestRate) === 0) {
      return startValue === endValue ? 0 : Number.POSITIVE_INFINITY
    }
    const numberOfPeriods = (endValue / startValue - 1) / effectiveInterestRate
    return toYears(numberOfPeriods)
  }

  // For simple interest with periodic savings, solve quadratic equation
  // First, rearrange to standard quadratic form: an² + bn + c = 0
  const a = (savingRate * effectiveInterestRate) / 2
  const b =
    startValue * effectiveInterestRate +
    savingRate *
      (1 + (effectiveInterestRate * (savingType === 'inAdvance' ? 1 : -1)) / 2)
  const c = startValue - endValue

  if (Math.abs(a) === 0) {
    const numberOfPeriods = (endValue - startValue) / savingRate
    return toYears(numberOfPeriods)
  }

  // Quadratic formula: n = (-b ± √(b² - 4ac)) / 2a
  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) {
    return Number.POSITIVE_INFINITY
  }

  const sqrt_discriminant = Math.sqrt(discriminant)
  const n1 = (-b + sqrt_discriminant) / (2 * a)
  const n2 = (-b - sqrt_discriminant) / (2 * a)
  const numberOfPeriods = Math.max(n1, n2)

  return toYears(numberOfPeriods)
}
