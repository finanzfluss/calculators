import type { z } from 'zod'
import { defineCalculator } from '../utils/calculator'
import { rate } from '../utils/financial'
import { bisectByEndValue } from './savings-end-value'
import {
  getFinancialFunctionParameters,
  savingsBaseSchema,
} from './savings-utils'

const schema = savingsBaseSchema.omit({ yearlyInterest: true })

type CalculatorInput = z.output<typeof schema>

export const savingsInterestRate = defineCalculator({
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
  const { considerCapitalGainsTax, distributionType, startValue, endValue } =
    parsedInput

  if (considerCapitalGainsTax && distributionType === 'accumulating') {
    const interestPercentage = bisectByEndValue({
      targetEndValue: endValue,
      baseInput: parsedInput,
      paramName: 'yearlyInterest',
      searchRange: { lower: 0, upper: 100 },
    })
    return interestPercentage / 100
  } else {
    const { numberOfPeriods, payments, fvType, effectiveTaxRate } =
      getFinancialFunctionParameters(parsedInput)

    const interestRate = rate(
      numberOfPeriods,
      -payments,
      -startValue,
      endValue,
      fvType,
    )

    const yearlyInterestRate = convertToYearlyRate(interestRate, parsedInput)

    if (considerCapitalGainsTax && distributionType === 'distributing') {
      return yearlyInterestRate / (1 - effectiveTaxRate)
    }

    return yearlyInterestRate
  }
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
    startValue,
    yearlyDuration,
  } = parsedInput

  const taxFactor = considerCapitalGainsTax
    ? 1 - (capitalGainsTax / 100) * (1 - partialExemption / 100)
    : 1
  const periodsPerYear = saveIntervalType === 'yearly' ? 1 : 12
  const numberOfPeriods = yearlyDuration * periodsPerYear
  const totalRemainingPeriods =
    savingType === 'inAdvance'
      ? (numberOfPeriods * (numberOfPeriods + 1)) / 2
      : (numberOfPeriods * (numberOfPeriods - 1)) / 2

  const totalRemainingYears = totalRemainingPeriods / periodsPerYear
  const totalSavings = savingRate * numberOfPeriods
  const coefficient =
    startValue * yearlyDuration + savingRate * totalRemainingYears

  /* v8 ignore next -- @preserve */
  if (coefficient === 0) {
    throw new Error(
      'Cannot calculate interest rate: too many parameters set to zero',
    )
  }

  const grossYearlyInterestRate =
    (endValue - startValue - totalSavings) / coefficient
  return grossYearlyInterestRate / taxFactor
}

/**
 * Converts an effective interest rate back to the nominal yearly rate based on
 * how getFinancialFunctionParameters transforms rates for different interval combinations
 */
/* v8 ignore next  -- @preserve */
function convertToYearlyRate(
  interestRate: number,
  parsedInput: CalculatorInput,
): number {
  const { saveIntervalType, interestIntervalType } = parsedInput

  if (saveIntervalType === 'yearly' && interestIntervalType === 'yearly') {
    return interestRate
  } else if (
    saveIntervalType === 'yearly' &&
    interestIntervalType === 'quarterly'
  ) {
    return 4 * ((1 + interestRate) ** (1 / 4) - 1)
  } else if (
    saveIntervalType === 'yearly' &&
    interestIntervalType === 'monthly'
  ) {
    return 12 * ((1 + interestRate) ** (1 / 12) - 1)
  } else if (
    saveIntervalType === 'monthly' &&
    interestIntervalType === 'monthly'
  ) {
    return interestRate * 12
  } else if (
    saveIntervalType === 'monthly' &&
    interestIntervalType === 'quarterly'
  ) {
    return convertMonthlyToYearly(interestRate, parsedInput)
  } else if (
    saveIntervalType === 'monthly' &&
    interestIntervalType === 'yearly'
  ) {
    return convertMonthlyToYearly(interestRate, parsedInput)
  } else {
    throw new Error(
      'Invalid combination of saveIntervalType and interestIntervalType',
    )
  }
}

/**
 * For monthly savings with non-monthly interest intervals
 */
function convertMonthlyToYearly(
  interestRate: number,
  parsedInput: CalculatorInput,
): number {
  const { savingRate, interestIntervalType } = parsedInput

  if (savingRate > 0) {
    return solveRateDependentPaymentEquation({
      parsedInput,
    })
  } else {
    const periodsPerYear = interestIntervalType === 'yearly' ? 1 : 4
    return interestRate * periodsPerYear
  }
}

/**
 * Solves rate-dependent payment equations using Newton's method
 */
/* v8 ignore next -- @preserve */
function solveRateDependentPaymentEquation({
  parsedInput,
}: {
  parsedInput: CalculatorInput
}): number {
  const initialGuess = 0.1
  const tolerance = 1e-10
  const maxIterations = 50
  const {
    savingRate,
    yearlyDuration,
    startValue,
    endValue,
    savingType,
    interestIntervalType,
  } = parsedInput

  const periodsPerYear = interestIntervalType === 'yearly' ? 1 : 4
  const basePeriods = 12 / periodsPerYear
  const averageMonths =
    interestIntervalType === 'yearly'
      ? savingType === 'inAdvance'
        ? 6.5
        : 5.5
      : savingType === 'inAdvance'
        ? 2
        : 1

  const periods = yearlyDuration * periodsPerYear
  let rate = initialGuess / periodsPerYear

  for (let i = 0; i < maxIterations; i++) {
    // Calculate function value: f(rate) = FV(rate) - endValue
    const effectivePayment = savingRate * (basePeriods + averageMonths * rate)
    const nearZero = Math.abs(rate) < 1e-8
    const annuityFactor = nearZero
      ? periods
      : ((1 + rate) ** periods - 1) / rate
    const futureValueFromPayments = effectivePayment * annuityFactor
    const futureValueFromPrincipal = startValue * (1 + rate) ** periods
    const fValue = futureValueFromPayments + futureValueFromPrincipal - endValue

    if (Math.abs(fValue) < tolerance) {
      return rate * periodsPerYear
    }

    // Calculate analytical derivative: f'(rate)
    // d/dr[effectivePayment] = savingRate * averageMonths
    const dEffectivePayment = savingRate * averageMonths

    // d/dr[annuityFactor] = d/dr[((1+r)^n - 1) / r]
    //                     = [r * n * (1+r)^(n-1) - ((1+r)^n - 1)] / r^2
    const dAnnuityFactor = nearZero
      ? (periods * (periods - 1)) / 2
      : (rate * periods * (1 + rate) ** (periods - 1) -
          ((1 + rate) ** periods - 1)) /
        (rate * rate)

    // d/dr[futureValueFromPayments] = effectivePayment * dAnnuityFactor + dEffectivePayment * annuityFactor
    const dFutureValueFromPayments =
      effectivePayment * dAnnuityFactor + dEffectivePayment * annuityFactor

    // d/dr[futureValueFromPrincipal] = startValue * n * (1+r)^(n-1)
    const dFutureValueFromPrincipal =
      startValue * periods * (1 + rate) ** (periods - 1)

    const derivative = dFutureValueFromPayments + dFutureValueFromPrincipal

    if (Math.abs(derivative) < 1e-15) {
      throw new Error(
        `Newton's method failed: derivative too small at iteration ${i + 1}`,
      )
    }

    const newRate = rate - fValue / derivative

    if (newRate < -0.5 || newRate > 2) {
      throw new Error(
        `Newton's method failed: rate out of reasonable bounds (${newRate}) at iteration ${i + 1}`,
      )
    }

    rate = newRate
  }

  throw new Error(
    `Newton's method failed to converge after ${maxIterations} iterations`,
  )
}
