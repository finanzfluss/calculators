import { z } from 'zod'
import {
  formatNumber,
  formatPercent,
  formatResultWithTwoOptionalDecimals,
} from '../utils'
import { defineCalculator } from '../utils/calculator'
import { savingsDuration } from './savings-duration'
import { savingsEndValue } from './savings-end-value'
import { savingsInterestRate } from './savings-interest-rate'
import { savingsPayment } from './savings-payment'
import { savingsStartValue } from './savings-start-value'
import { calcDiagramData, savingsBaseSchema } from './savings-utils'

const schema = z.looseObject({
  output: z.enum([
    'endValue',
    'startValue',
    'yearlyInterest',
    'monthlyDuration',
    'savingRate',
  ]),
})

type CalculatorInput = z.output<typeof schema>
type SavingsObject = z.output<typeof savingsBaseSchema>

export const savings = defineCalculator({
  schema,
  calculate,
})

function calculate(parsedInput: CalculatorInput) {
  const completed = calculateSavingsObject(parsedInput)
  const deposits = getDeposits(completed)

  return {
    endValue: formatResultWithTwoOptionalDecimals(completed.endValue),
    startCapital: formatResultWithTwoOptionalDecimals(completed.startValue),
    savingRate: formatResultWithTwoOptionalDecimals(completed.savingRate),
    yearlyDuration: formatNumber(completed.yearlyDuration, 2),
    monthlyDuration: formatNumber(completed.yearlyDuration * 12, 2),
    yearlyInterest: formatPercent(completed.yearlyInterest, 2),
    deposits: formatResultWithTwoOptionalDecimals(deposits),
    interestAfterTax: formatResultWithTwoOptionalDecimals(
      completed.endValue - deposits,
    ),
    diagramData: calcDiagramData(completed),
  }
}

function calculateSavingsObject(parsedInput: CalculatorInput): SavingsObject {
  const { output: calculationType } = parsedInput

  switch (calculationType) {
    case 'endValue': {
      const schema = savingsBaseSchema.omit({ endValue: true })
      const parsedQuery = schema.parse(parsedInput)

      const endValue = savingsEndValue.calculate(parsedQuery)
      return {
        ...parsedQuery,
        endValue,
      }
    }

    case 'startValue': {
      const schema = savingsBaseSchema.omit({ startValue: true })
      const parsedQuery = schema.parse(parsedInput)

      const startValue = savingsStartValue.calculate(parsedQuery)
      return {
        ...parsedQuery,
        startValue,
      }
    }
    case 'yearlyInterest': {
      const schema = savingsBaseSchema.omit({ yearlyInterest: true })
      const parsedQuery = schema.parse(parsedInput)

      const yearlyInterest = 100 * savingsInterestRate.calculate(parsedQuery)
      return {
        ...parsedQuery,
        yearlyInterest,
      }
    }

    case 'monthlyDuration': {
      const schema = savingsBaseSchema.omit({ yearlyDuration: true })
      const parsedQuery = schema.parse(parsedInput)

      const yearlyDuration = savingsDuration.calculate(parsedQuery)
      return {
        ...parsedQuery,
        yearlyDuration,
      }
    }

    case 'savingRate': {
      const schema = savingsBaseSchema.omit({ savingRate: true })
      const parsedQuery = schema.parse(parsedInput)

      const savingRate = savingsPayment.calculate(parsedQuery)
      return {
        ...parsedQuery,
        savingRate,
      }
    }
  }
}

function getDeposits(savings: SavingsObject): number {
  const { startValue, savingRate, yearlyDuration, saveIntervalType } = savings
  return (
    startValue +
    savingRate * yearlyDuration * (saveIntervalType === 'monthly' ? 12 : 1)
  )
}
