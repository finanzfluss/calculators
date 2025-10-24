import { z } from 'zod'
import { formatResult } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { savingsEndValue } from './savings-end-value'
import { calcDiagramData } from './savings-utils'

const schema = z.object({
  startCapital: z.coerce.number(),
  monthlyPayment: z.coerce.number(),
  durationYears: z.coerce.number().nonnegative().max(1000),
  yearlyInterest: z.coerce.number().min(0).max(10_000),
  type: z.enum(['monthly', 'quarterly', 'yearly']),
})

type CalculatorInput = z.output<typeof schema>

export const compoundInterest = defineCalculator({ schema, calculate })

function calculate(parsedInput: CalculatorInput) {
  const savingsObject = getSavingsObject(parsedInput)
  const finalCapital = savingsEndValue.calculate(savingsObject)

  const { startCapital, monthlyPayment, durationYears } = parsedInput
  const totalPayments = startCapital + monthlyPayment * durationYears * 12

  return {
    finalCapital: formatResult(finalCapital),
    totalPayments: formatResult(totalPayments),
    totalInterest: formatResult(finalCapital - totalPayments),
    diagramData: calcDiagramData({ ...savingsObject, endValue: finalCapital }),
  }
}

function getSavingsObject(parsedInput: CalculatorInput) {
  return {
    startValue: parsedInput.startCapital,
    savingRate: parsedInput.monthlyPayment,
    yearlyDuration: parsedInput.durationYears,
    yearlyInterest: parsedInput.yearlyInterest,
    interestIntervalType: parsedInput.type,

    // All other parameters stay at their defaults
    useCompoundInterest: true,
    saveIntervalType: 'monthly',
    savingType: 'inAdvance',
    considerCapitalGainsTax: false,
    capitalGainsTax: 0,
    distributionType: 'distributing',
    partialExemption: 0,
  } as const
}
