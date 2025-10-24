import type z from 'zod'
import { toDinero } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { fv } from '../utils/financial'
import {
  calculateAccumulatingTax,
  getFinancialFunctionParameters,
  savingsBaseSchema,
} from './savings-utils'

const schema = savingsBaseSchema.omit({ endValue: true })

type CalculatorInput = z.output<typeof schema>

export const savingsEndValue = defineCalculator({
  schema,
  calculate,
})

/**
 * Bisection (binary search) to find a parameter value that matches a target end value.
 */
/* v8 ignore next -- @preserve */
export function bisectByEndValue<K extends keyof CalculatorInput>({
  targetEndValue,
  baseInput,
  paramName,
  searchRange,
}: {
  targetEndValue: number
  baseInput: Omit<CalculatorInput, K>
  paramName: K
  searchRange: { lower: number; upper: number }
}): number {
  const tolerance = 1e-4
  const maxIterations = 100
  let lower = searchRange.lower
  let upper = searchRange.upper

  const getEndValue = (paramValue: number): number => {
    const input = { ...baseInput, [paramName]: paramValue }
    return savingsEndValue.validateAndCalculate(input)
  }

  // Expand upper bound if needed to bracket the solution
  let isBracketed = false
  for (let expansion = 0; expansion < 10; expansion++) {
    const lowerVal = getEndValue(lower)
    const upperVal = getEndValue(upper)
    isBracketed = lowerVal <= targetEndValue && targetEndValue <= upperVal
    if (isBracketed) {
      break
    }

    if (upperVal < targetEndValue) {
      lower = upper
      upper = upper * 2
    }
  }

  if (!isBracketed) {
    throw new Error(
      `Failed to bracket target end value ${targetEndValue} after expanding range for parameter "${paramName}"`,
    )
  }

  // Bisect to find solution
  for (let i = 0; i < maxIterations; i++) {
    const mid = (lower + upper) / 2
    const midVal = getEndValue(mid)
    const error = midVal - targetEndValue
    if (Math.abs(error) < tolerance) {
      return mid
    }
    if (error < 0) {
      lower = mid
    } else {
      upper = mid
    }
    if (Math.abs(upper - lower) < tolerance) {
      break
    }
  }

  return (lower + upper) / 2
}

function calculate(parsedInput: CalculatorInput) {
  const { useCompoundInterest } = parsedInput

  if (useCompoundInterest) {
    return calculateWithCompoundInterest(parsedInput)
  } else {
    return calculateWithSimpleInterest(parsedInput)
  }
}

function calculateWithCompoundInterest(parsedInput: CalculatorInput) {
  const { considerCapitalGainsTax, distributionType, startValue } = parsedInput

  const { rate, numberOfPeriods, payments, fvType } =
    getFinancialFunctionParameters(parsedInput)

  const endValue = fv(rate, numberOfPeriods, -payments, -startValue, fvType)

  let result: number
  if (considerCapitalGainsTax && distributionType === 'accumulating') {
    const tax = calculateAccumulatingTax(endValue, parsedInput)
    result = endValue - tax
  } else {
    result = endValue
  }

  return toDinero(result).toUnit()
}

function calculateWithSimpleInterest(parsedInput: CalculatorInput) {
  const {
    // @keep-sorted
    capitalGainsTax,
    considerCapitalGainsTax,
    partialExemption,
    saveIntervalType,
    savingRate,
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
  const interestOnSavings =
    savingRate * totalInterestPeriods * effectiveInterestRate

  const interestOnInitial = startValue * effectiveInterestRate * numberOfPeriods

  const totalInterest = interestOnInitial + interestOnSavings
  const totalDeposits = startValue + savingRate * numberOfPeriods
  const total = totalDeposits + totalInterest
  return toDinero(total).toUnit()
}
