import { z } from 'zod'
import { formatResult, percentToDecimal } from '../utils'
import { defineCalculator } from '../utils/calculator'

const schema = z.object({
  startCapital: z.coerce.number(),
  monthlyPayment: z.coerce.number(),
  durationYears: z.coerce.number().nonnegative().max(1000),
  yearlyInterest: z.coerce
    .number()
    .min(-10_000)
    .max(10_000)
    .transform(percentToDecimal),
  type: z.enum(['monthly', 'quarterly', 'yearly']),
})

type CalculatorInput = z.output<typeof schema>

const CompoundInterestMultipliers: Record<
  CalculatorInput['type'],
  { duration: number; monthlyPayment: number }
> = {
  monthly: { duration: 12, monthlyPayment: 1 },
  quarterly: { duration: 4, monthlyPayment: 3 },
  yearly: { duration: 1, monthlyPayment: 12 },
}

export const compoundInterest = defineCalculator({ schema, calculate })

function getBaseInvestmentData(parsedInput: CalculatorInput) {
  const { monthlyPayment, type, durationYears, yearlyInterest } = parsedInput
  const multiplier = CompoundInterestMultipliers[type]

  return {
    duration: durationYears * multiplier.duration,
    payment: monthlyPayment * multiplier.monthlyPayment,
    interest: yearlyInterest / multiplier.duration,
  }
}

function calculate(parsedInput: CalculatorInput) {
  const { startCapital, monthlyPayment, durationYears } = parsedInput
  const totalPayments = startCapital + durationYears * 12 * monthlyPayment

  const { duration, payment, interest } = getBaseInvestmentData(parsedInput)

  const capitalList: number[] = []
  const accInterestList: number[] = []
  let capitalAmount = startCapital
  let accInterestAmount = 0
  let capitalLastMonth = capitalAmount

  for (let i = 0; i < duration; i++) {
    capitalAmount += payment
    capitalList.push(capitalAmount)

    const interestMonth = capitalLastMonth * interest
    accInterestAmount += interestMonth
    accInterestList.push(accInterestAmount)

    capitalLastMonth = capitalAmount + accInterestAmount
  }

  const finalCapital = formatResult(capitalLastMonth)

  return {
    finalCapital,
    totalPayments: formatResult(totalPayments),
    totalInterest: formatResult(capitalLastMonth - totalPayments),
    diagramData: {
      CAPITAL_LIST: capitalList,
      INTEREST_LIST: accInterestList,
      LAST_CAPITAL: formatResult(capitalAmount),
      LAST_INTEREST: formatResult(accInterestAmount),
      TOTAL_CAPITAL: finalCapital,
    },
  }
}
