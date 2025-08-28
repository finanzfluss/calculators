import type Dinero from 'dinero.js'
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
  const totalPayments = startCapital.add(
    monthlyPayment.multiply(durationYears * 12),
  )

  const { duration, payment, interest } = getBaseInvestmentData(parsedInput)

  const capitalList: Dinero.Dinero[] = []
  const accInterestList: Dinero.Dinero[] = []
  let capitalAmount = startCapital
  let accInterestAmount = toDinero(0)
  let capitalLastMonth = capitalAmount

  for (let i = 0; i < duration; i++) {
    capitalAmount = capitalAmount.add(payment)
    capitalList.push(capitalAmount)

    const interestMonth = capitalLastMonth.multiply(interest)
    accInterestAmount = accInterestAmount.add(interestMonth)
    accInterestList.push(accInterestAmount)

    capitalLastMonth = capitalAmount.add(accInterestAmount)
  }

  const diagramData = {
    CAPITAL_LIST: capitalList.map((dinero) => dinero.toUnit()),
    INTEREST_LIST: accInterestList.map((dinero) => dinero.toUnit()),
    LAST_CAPITAL: formatResult(capitalAmount),
    LAST_INTEREST: formatResult(accInterestAmount),
    TOTAL_CAPITAL: formatResult(capitalLastMonth),
  }

  return {
    finalCapital: formatResult(capitalLastMonth),
    totalPayments: formatResult(totalPayments),
    totalInterest: formatResult(capitalLastMonth.subtract(totalPayments)),
    diagramData,
  }
}
