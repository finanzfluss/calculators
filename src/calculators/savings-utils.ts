import Dinero from 'dinero.js'
import { z } from 'zod'
import { formatResultWithTwoOptionalDecimals } from '../utils'

export const savingsBaseSchema = z.object({
  endValue: z.coerce.number().nonnegative(),
  startValue: z.coerce.number().nonnegative(),
  savingRate: z.coerce.number().nonnegative(),
  saveIntervalType: z.enum(['monthly', 'yearly']),
  savingType: z.enum(['inAdvance', 'inArrear']).optional().default('inAdvance'),
  yearlyInterest: z.coerce.number().nonnegative().max(10000),
  interestIntervalType: z.enum(['monthly', 'quarterly', 'yearly']),
  yearlyDuration: z.coerce.number().positive().max(1000),
  considerCapitalGainsTax: z.stringbool().or(z.boolean()),
  capitalGainsTax: z.coerce.number().nonnegative().max(100),
  distributionType: z.enum(['accumulating', 'distributing']),
  partialExemption: z.coerce.number().nonnegative().max(100),
  useCompoundInterest: z.stringbool().or(z.boolean()).optional().default(true),
})

export function calculateAccumulatingTax(
  fvBeforeTax: number,
  parsedInput: Omit<z.output<typeof savingsBaseSchema>, 'endValue'>,
) {
  const {
    // @keep-sorted
    capitalGainsTax,
    partialExemption,
    saveIntervalType,
    savingRate,
    startValue,
    yearlyDuration,
  } = parsedInput

  const deposits =
    startValue +
    savingRate * yearlyDuration * (saveIntervalType === 'yearly' ? 1 : 12)
  const grossGains = fvBeforeTax - deposits
  const taxableGains = grossGains * (1 - partialExemption / 100)
  const tax = Math.max(0, taxableGains * (capitalGainsTax / 100))
  return tax
}

export function getFinancialFunctionParameters(
  parsedInput: Partial<z.output<typeof savingsBaseSchema>> &
    Pick<
      z.output<typeof savingsBaseSchema>,
      | 'capitalGainsTax'
      | 'interestIntervalType'
      | 'partialExemption'
      | 'saveIntervalType'
      | 'savingType'
    >,
  config: { forceConsiderTax?: boolean } = {},
) {
  const {
    // @keep-sorted
    capitalGainsTax,
    considerCapitalGainsTax,
    distributionType,
    interestIntervalType,
    partialExemption,
    saveIntervalType,
    savingRate = 0,
    savingType,
    yearlyDuration = 1,
    yearlyInterest = 0,
  } = parsedInput

  const taxFactor = 1 - (capitalGainsTax / 100) * (1 - partialExemption / 100)
  const useTaxFactor =
    config.forceConsiderTax ??
    (considerCapitalGainsTax && distributionType !== 'accumulating')
  const effectiveInterest = useTaxFactor
    ? yearlyInterest * taxFactor
    : yearlyInterest
  const yearlyInterestRate = effectiveInterest / 100
  const monthlyInterestRate = yearlyInterestRate / 12
  const quarterlyInterestRate = yearlyInterestRate / 4
  const fvType: 0 | 1 = savingType === 'inAdvance' ? 1 : 0 // 1 = beginning of period, 0 = end of period
  const effectiveTaxRate =
    ((1 - partialExemption / 100) * capitalGainsTax) / 100

  if (saveIntervalType === 'yearly' && interestIntervalType === 'monthly') {
    return {
      rate: (1 + monthlyInterestRate) ** 12 - 1,
      numberOfPeriods: yearlyDuration,
      payments: savingRate,
      fvType,
      effectiveTaxRate,
    }
  }
  if (saveIntervalType === 'yearly' && interestIntervalType === 'quarterly') {
    return {
      rate: (1 + quarterlyInterestRate) ** 4 - 1,
      numberOfPeriods: yearlyDuration,
      payments: savingRate,
      fvType,
      effectiveTaxRate,
    }
  }
  if (saveIntervalType === 'yearly' && interestIntervalType === 'yearly') {
    return {
      rate: yearlyInterestRate,
      numberOfPeriods: yearlyDuration,
      payments: savingRate,
      fvType,
      effectiveTaxRate,
    }
  }
  if (saveIntervalType === 'monthly' && interestIntervalType === 'monthly') {
    return {
      rate: monthlyInterestRate,
      numberOfPeriods: yearlyDuration * 12,
      payments: savingRate,
      fvType,
      effectiveTaxRate,
    }
  }
  if (saveIntervalType === 'monthly' && interestIntervalType === 'quarterly') {
    const averageMonths = savingType === 'inAdvance' ? 2 : 1
    return {
      rate: quarterlyInterestRate,
      numberOfPeriods: yearlyDuration * 4,
      payments:
        savingRate * 3 + savingRate * averageMonths * quarterlyInterestRate,
      fvType: 0 as const,
      effectiveTaxRate,
    }
  }
  /* v8 ignore else -- @preserve */
  if (saveIntervalType === 'monthly' && interestIntervalType === 'yearly') {
    const averageMonths = savingType === 'inAdvance' ? 6.5 : 5.5
    return {
      rate: yearlyInterestRate,
      numberOfPeriods: yearlyDuration,
      payments:
        savingRate * 12 + savingRate * averageMonths * yearlyInterestRate,
      fvType: 0 as const,
      effectiveTaxRate,
    }
  }

  /* v8 ignore next -- @preserve */
  throw new Error(
    'Invalid combination of saveIntervalType and interestIntervalType',
  )
}

export function calcDiagramData(savings: z.output<typeof savingsBaseSchema>): {
  CAPITAL_LIST?: number[]
  INTEREST_LIST?: number[]
  LAST_CAPITAL: string
  LAST_INTEREST: string
  TOTAL_CAPITAL: string
} {
  const {
    capitalGainsTax,
    considerCapitalGainsTax,
    distributionType,
    interestIntervalType,
    partialExemption,
    saveIntervalType,
    savingRate: savingRateNumber,
    startValue,
    yearlyDuration,
    yearlyInterest,
  } = savings

  const capitalList: Dinero.Dinero[] = []
  const accInterestList: Dinero.Dinero[] = []

  let capitalAmount = toPreciseDinero(startValue)
  let accInterestAmount = toPreciseDinero(0)
  const savingRate = toPreciseDinero(savingRateNumber)
  const taxFactor = 1 - (capitalGainsTax / 100) * (1 - partialExemption / 100)
  const effectiveInterest =
    considerCapitalGainsTax && distributionType === 'distributing'
      ? yearlyInterest * taxFactor
      : yearlyInterest
  const yearlyInterestRate = effectiveInterest / 100
  const monthlyInterestRate = yearlyInterestRate / 12
  const quarterlyInterestRate = yearlyInterestRate / 4

  for (let month = 1; month <= yearlyDuration * 12; month++) {
    if (
      saveIntervalType === 'monthly' ||
      (saveIntervalType === 'yearly' && month % 12 === 1)
    ) {
      capitalAmount = capitalAmount.add(savingRate)
    }
    const balance = capitalAmount.add(accInterestAmount)

    if (interestIntervalType === 'monthly') {
      accInterestAmount = accInterestAmount.add(
        balance.multiply(monthlyInterestRate),
      )
    } else if (interestIntervalType === 'yearly' && month % 12 === 0) {
      if (saveIntervalType === 'yearly') {
        accInterestAmount = accInterestAmount.add(
          balance.multiply(yearlyInterestRate),
        )
      } else {
        const averageBalance = balance.subtract(
          savingRate.multiply(11).divide(2),
        )
        accInterestAmount = accInterestAmount.add(
          averageBalance.multiply(yearlyInterestRate),
        )
      }
    } else if (interestIntervalType === 'quarterly' && month % 3 === 0) {
      if (saveIntervalType === 'yearly') {
        accInterestAmount = accInterestAmount.add(
          balance.multiply(quarterlyInterestRate),
        )
      } else {
        const averageBalance = balance.subtract(savingRate.multiply(1))
        accInterestAmount = accInterestAmount.add(
          averageBalance.multiply(quarterlyInterestRate),
        )
      }
    }

    accInterestList.push(accInterestAmount.convertPrecision(2))
    capitalList.push(capitalAmount.convertPrecision(2))
  }

  const listLength = Math.min(capitalList.length, accInterestList.length)
  if (listLength === 0) {
    return {
      CAPITAL_LIST: [],
      INTEREST_LIST: [],
      LAST_CAPITAL: formatResultWithTwoOptionalDecimals(0),
      LAST_INTEREST: formatResultWithTwoOptionalDecimals(0),
      TOTAL_CAPITAL: formatResultWithTwoOptionalDecimals(0),
    }
  }

  if (considerCapitalGainsTax && distributionType === 'accumulating') {
    const lastCapital = capitalList[listLength - 1]!
    const lastInterest = accInterestList[listLength - 1]!
    const totalCapital = lastCapital.add(lastInterest)
    const tax = toPreciseDinero(
      calculateAccumulatingTax(totalCapital.toUnit(), savings),
    )
    accInterestList[listLength - 1] =
      accInterestList[listLength - 1]!.subtract(tax)
  }

  const lastCapital = capitalList[listLength - 1]!
  const lastInterest = accInterestList[listLength - 1]!
  const totalCapital = lastCapital.add(lastInterest)
  return {
    CAPITAL_LIST: capitalList.map((dinero) => dinero.toUnit()),
    INTEREST_LIST: accInterestList.map((dinero) => dinero.toUnit()),
    LAST_CAPITAL: formatResultWithTwoOptionalDecimals(lastCapital),
    LAST_INTEREST: formatResultWithTwoOptionalDecimals(lastInterest),
    TOTAL_CAPITAL: formatResultWithTwoOptionalDecimals(totalCapital),
  }
}

function toPreciseDinero(euros: number) {
  return Dinero({
    amount: Math.round(euros * 1000),
    currency: 'EUR',
    precision: 3, // three decimal places (0.001 EUR = 0.1 cent)
  })
}
