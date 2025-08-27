import { z } from 'zod'
import { formatResult, toDinero, toPercentRate } from '../utils'
import { defineCalculator } from '../utils/calculator'

const schema = z.object({
  startCapital: z.coerce.number().transform(toDinero),
  monthlyPayment: z.coerce.number().transform(toDinero),
  durationYears: z.coerce.number().nonnegative().max(1000),
  yearlyInterest: z.coerce
    .number()
    .min(-10_000)
    .max(10_000)
    .transform(toPercentRate),
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
    payment: monthlyPayment.multiply(multiplier.monthlyPayment),
    interest: yearlyInterest / multiplier.duration,
  }
}

function calculate(parsedInput: CalculatorInput) {
  const { startCapital, monthlyPayment, durationYears } = parsedInput
  const totalPayments =
    startCapital.toUnit() + durationYears * 12 * monthlyPayment.toUnit()

  const { duration, payment, interest } = getBaseInvestmentData(parsedInput)

  const capitalList: number[] = []
  const accInterestList: number[] = []
  let capitalAmount = startCapital
  let accInterestAmount = toDinero(0)
  let capitalLastMonth = capitalAmount

  for (let i = 0; i < duration; i++) {
    capitalAmount = capitalAmount.add(payment)
    capitalList.push(capitalAmount.toUnit())

    const interestMonth = capitalLastMonth.multiply(interest)
    accInterestAmount = accInterestAmount.add(interestMonth)
    accInterestList.push(accInterestAmount.toUnit())

    capitalLastMonth = capitalAmount.add(accInterestAmount)
  }

  const diagramData = {
    CAPITAL_LIST: capitalList,
    INTEREST_LIST: accInterestList,
    LAST_CAPITAL: formatResult(capitalAmount.toUnit()),
    LAST_INTEREST: formatResult(accInterestAmount.toUnit()),
    TOTAL_CAPITAL: formatResult(capitalLastMonth.toUnit()),
  }

  return {
    finalCapital: formatResult(capitalLastMonth.toUnit()),
    totalPayments: formatResult(totalPayments),
    totalInterest: formatResult(capitalLastMonth.toUnit() - totalPayments),
    diagramData,
  }
}
