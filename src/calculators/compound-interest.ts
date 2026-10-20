import { z } from 'zod'
import { formatCurrencyAdaptive } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { savingsEndValue } from './savings-end-value'
import { calcDiagramData, diagramDataSchema } from './savings-utils'

const inputSchema = z.object({
  startCapital: z.coerce.number(),
  monthlyPayment: z.coerce.number(),
  durationYears: z.coerce.number().nonnegative().max(1000),
  yearlyInterest: z.coerce.number().min(0).max(10_000),
  type: z.enum(['monthly', 'quarterly', 'yearly']),
})

const outputSchema = z.object({
  finalCapital: z.string(),
  totalPayments: z.string(),
  totalInterest: z.string(),
  diagramData: diagramDataSchema,
})

type CalculatorInput = z.output<typeof inputSchema>

export const compoundInterest = defineCalculator({
  inputSchema,
  outputSchema,
  calculate,
})

function calculate(parsedInput: CalculatorInput) {
  const savingsObject = getSavingsObject(parsedInput)
  const finalCapital = savingsEndValue.calculate(savingsObject)

  const { startCapital, monthlyPayment, durationYears } = parsedInput
  const totalPayments = startCapital + monthlyPayment * durationYears * 12

  return {
    finalCapital: formatCurrencyAdaptive(finalCapital),
    totalPayments: formatCurrencyAdaptive(totalPayments),
    totalInterest: formatCurrencyAdaptive(finalCapital - totalPayments),
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
