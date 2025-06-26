import { z } from 'zod'
import { formatResult, toPercentRate } from '../utils'

export const COMPOUND_INTEREST_QUERY_SCHEMA = z.object({
  startCapital: z.coerce.number(),
  monthlyPayment: z.coerce.number(),
  durationYears: z.coerce.number().nonnegative().max(1000),
  yearlyInterest: z.coerce
    .number()
    .min(-10_000)
    .max(10_000)
    .transform(toPercentRate),
  type: z.enum(['monthly', 'quarterly', 'yearly']),
})

type CompoundInterestQuery = z.output<typeof COMPOUND_INTEREST_QUERY_SCHEMA>

export function calcCompoundInterest(parsedQuery: CompoundInterestQuery) {
  const { startCapital, monthlyPayment, type, durationYears, yearlyInterest } =
    parsedQuery
  const totalPayments = startCapital + durationYears * 12 * monthlyPayment

  let duration: number
  let payment: number
  let interest: number

  if (type === 'monthly') {
    duration = durationYears * 12
    payment = monthlyPayment
    interest = yearlyInterest / 12
  } else if (type === 'quarterly') {
    duration = durationYears * 4
    payment = monthlyPayment * 3
    interest = yearlyInterest / 4
  } else {
    duration = durationYears
    payment = monthlyPayment * 12
    interest = yearlyInterest
  }

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

  const diagramData = {
    CAPITAL_LIST: capitalList,
    INTEREST_LIST: accInterestList,
    LAST_CAPITAL: formatResult(capitalAmount),
    LAST_INTEREST: formatResult(accInterestAmount),
    TOTAL_CAPITAL: formatResult(capitalLastMonth),
  }

  return {
    finalCapital: formatResult(capitalLastMonth),
    totalPayments: formatResult(totalPayments),
    totalInterest: formatResult(capitalLastMonth - totalPayments),
    diagramData,
  }
}
