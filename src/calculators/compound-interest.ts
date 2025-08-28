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

const IntervalFactors: Record<
  CalculatorInput['type'],
  { periodsPerYear: number; paymentsPerPeriod: number }
> = {
  monthly: { periodsPerYear: 12, paymentsPerPeriod: 1 },
  quarterly: { periodsPerYear: 4, paymentsPerPeriod: 3 },
  yearly: { periodsPerYear: 1, paymentsPerPeriod: 12 },
}

export const compoundInterest = defineCalculator({ schema, calculate })

function getBaseInvestmentData(parsedInput: CalculatorInput) {
  const { monthlyPayment, type, durationYears, yearlyInterest } = parsedInput
  const intervalFactors = IntervalFactors[type]

  return {
    totalPeriods: durationYears * intervalFactors.periodsPerYear,
    periodicPayment: monthlyPayment.multiply(intervalFactors.paymentsPerPeriod),
    periodicInterestRate: yearlyInterest / intervalFactors.periodsPerYear,
  }
}

function calculate(parsedInput: CalculatorInput) {
  const { startCapital, monthlyPayment, durationYears } = parsedInput
  const totalPayments = startCapital.add(
    monthlyPayment.multiply(durationYears * 12),
  )

  const { totalPeriods, periodicPayment, periodicInterestRate } =
    getBaseInvestmentData(parsedInput)

  const capitalList: Dinero.Dinero[] = []
  const interestList: Dinero.Dinero[] = []
  let currentCapital = startCapital
  let accumulatedInterest = toDinero(0)
  let totalBalance = currentCapital

  for (let period = 0; period < totalPeriods; period++) {
    currentCapital = currentCapital.add(periodicPayment)
    capitalList.push(currentCapital)

    const periodicInterest = totalBalance.multiply(periodicInterestRate)
    accumulatedInterest = accumulatedInterest.add(periodicInterest)
    interestList.push(accumulatedInterest)

    totalBalance = currentCapital.add(accumulatedInterest)
  }

  const diagramData = {
    CAPITAL_LIST: capitalList.map((dinero) => dinero.toUnit()),
    INTEREST_LIST: interestList.map((dinero) => dinero.toUnit()),
    LAST_CAPITAL: formatResult(currentCapital),
    LAST_INTEREST: formatResult(accumulatedInterest),
    TOTAL_CAPITAL: formatResult(totalBalance),
  }

  return {
    finalCapital: formatResult(totalBalance),
    totalPayments: formatResult(totalPayments),
    totalInterest: formatResult(totalBalance.subtract(totalPayments)),
    diagramData,
  }
}
