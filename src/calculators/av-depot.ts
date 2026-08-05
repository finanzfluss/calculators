import { z } from 'zod'
import {
  ABGELTUNGSTEUERSATZ,
  AV_SUBSIDIZED_CAP,
  BERUFSEINSTEIGER_BONUS,
  INCOME_TAX_YEAR,
  KINDERZULAGE_CAP,
  MIN_OWN_CONTRIBUTION,
  TEILFREISTELLUNG,
  VORABPAUSCHALE_FACTOR,
} from '../constants/av-depot'
import { formatCurrencyAdaptive, parseCurrency, pmt } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { incomeTax } from './income-tax'

const schema = z
  .object({
    age: z.coerce.number().int().min(18).max(67),
    retirementAge: z.coerce.number().int().min(65).max(70),
    zveSavingsPhase: z.coerce.number().min(0),
    zveRetirement: z.coerce.number().min(0),
    savingsRate: z.coerce.number().min(120).max(13_680),
    etfReturnRate: z.coerce
      .number()
      .positive()
      .max(100)
      .transform((v) => v / 100),
    avDepotCosts: z.coerce
      .number()
      .min(0)
      .max(100)
      .transform((v) => v / 100),
    exemptionOrder: z.coerce.number().min(0).max(1000).default(1000),
    taxSavingsMode: z.enum(['avDepot', 'secondaryDepot', 'consume']),
    baseRate: z.coerce
      .number()
      .min(0)
      .max(100)
      .default(0)
      .transform((v) => v / 100),
    oneTimePayout: z.coerce
      .number()
      .min(0)
      .max(30)
      .transform((v) => v / 100),
    payoutReturnRate: z.coerce
      .number()
      .positive()
      .max(100)
      .transform((v) => v / 100),
    payoutUntilAge: z.coerce.number().int().min(85).max(120),
    childBirthYears: z.preprocess(
      (val) => (val === undefined ? [] : Array.isArray(val) ? val : [val]),
      z.array(z.coerce.number().int().min(1900)),
    ),
    currentYear: z.coerce
      .number()
      .int()
      .min(2027)
      .default(() => Math.max(2027, new Date().getFullYear())),
  })
  .refine((data) => data.age < data.retirementAge, {
    message: 'age must be less than retirementAge',
    path: ['retirementAge'],
  })
  .refine((data) => data.retirementAge < data.payoutUntilAge, {
    message: 'retirementAge must be less than payoutUntilAge',
    path: ['payoutUntilAge'],
  })
  .refine((data) => data.avDepotCosts < data.etfReturnRate, {
    message: 'avDepotCosts must be less than etfReturnRate',
    path: ['avDepotCosts'],
  })
  .refine((data) => data.avDepotCosts < data.payoutReturnRate, {
    message: 'avDepotCosts must be less than payoutReturnRate',
    path: ['avDepotCosts'],
  })

type CalculatorInput = z.output<typeof schema>

interface SavingsYear {
  year: number
  contribution: number
  capitalStart: number
  grossReturn: number
  vorabpauschale: number
  vorabpauschaleTax: number
  capitalEnd: number
}

interface PayoutYear {
  grossPayout: number
  tax: number
  netPayout: number
}

interface DepotPair {
  avDepot: string
  normalDepot: string
}

interface PayoutYearResult {
  gross: DepotPair
  tax: DepotPair
  net: DepotPair
}

interface SavingsYearResult {
  year: number
  contribution: DepotPair
  capitalStart: DepotPair
  grossReturn: DepotPair
  vorabpauschale: DepotPair
  vorabpauschaleTax: DepotPair
  capitalEnd: DepotPair
}

interface CalculatorOutput {
  savingsPerYear: SavingsYearResult[]
  finalCapital: DepotPair
  totalContributions: DepotPair
  totalVorabpauschale: DepotPair
  firstPayoutYear: PayoutYearResult
  regularPayoutYear: PayoutYearResult
  payoutTotal: PayoutYearResult
}

export const avDepot = defineCalculator({
  schema,
  calculate,
})

function calculate(input: CalculatorInput): CalculatorOutput {
  const normalDepotSavings = calculateNormalDepotSavings(input)
  const normalDepotPayout = calculateNormalDepotPayout(
    input,
    normalDepotSavings,
  )

  const avDepotSavingsFull = calculateAvDepotSavings(input)
  const avDepotSavings = avDepotSavingsFull.result
  const avDepotPayout = calculateAvDepotPayout(input, avDepotSavingsFull)

  return {
    savingsPerYear: normalDepotSavings.yearlyData.map((normalYear, i) => {
      const avYear = avDepotSavings.yearlyData[i]!
      return {
        year: normalYear.year,
        contribution: depotPair(normalYear.contribution, avYear.contribution),
        capitalStart: depotPair(normalYear.capitalStart, avYear.capitalStart),
        grossReturn: depotPair(normalYear.grossReturn, avYear.grossReturn),
        vorabpauschale: depotPair(
          normalYear.vorabpauschale,
          avYear.vorabpauschale,
        ),
        vorabpauschaleTax: depotPair(
          normalYear.vorabpauschaleTax,
          avYear.vorabpauschaleTax,
        ),
        capitalEnd: depotPair(normalYear.capitalEnd, avYear.capitalEnd),
      }
    }),
    finalCapital: depotPair(
      normalDepotSavings.finalCapital,
      avDepotSavings.finalCapital,
    ),
    totalContributions: depotPair(
      normalDepotSavings.totalContributions,
      avDepotSavings.totalContributions,
    ),
    totalVorabpauschale: depotPair(
      normalDepotSavings.totalVorabpauschale,
      avDepotSavings.totalVorabpauschale,
    ),
    firstPayoutYear: payoutYearResult(
      normalDepotPayout.firstYear,
      avDepotPayout.firstYear,
    ),
    regularPayoutYear: payoutYearResult(
      normalDepotPayout.recurringYear,
      avDepotPayout.recurringYear,
    ),
    payoutTotal: {
      gross: depotPair(normalDepotPayout.totalGross, avDepotPayout.totalGross),
      tax: depotPair(normalDepotPayout.totalTax, avDepotPayout.totalTax),
      net: depotPair(normalDepotPayout.totalNet, avDepotPayout.totalNet),
    },
  }
}

function depotPair(normalDepot: number, avDepot: number): DepotPair {
  return {
    normalDepot: formatCurrencyAdaptive(normalDepot),
    avDepot: formatCurrencyAdaptive(avDepot),
  }
}

function payoutYearResult(
  normal: PayoutYear,
  av: PayoutYear,
): PayoutYearResult {
  return {
    gross: depotPair(normal.grossPayout, av.grossPayout),
    tax: depotPair(normal.tax, av.tax),
    net: depotPair(normal.netPayout, av.netPayout),
  }
}

function calculateNormalDepotSavings(input: CalculatorInput) {
  const {
    savingsRate,
    etfReturnRate,
    baseRate,
    exemptionOrder,
    zveSavingsPhase,
    age,
    retirementAge,
  } = input
  const savingYears = retirementAge - age
  return calculateDepotSavings(
    Array.from({ length: savingYears }, () => savingsRate),
    etfReturnRate,
    baseRate,
    exemptionOrder,
    zveSavingsPhase,
  )
}

function calculateDepotSavings(
  contributions: number[],
  returnRate: number,
  baseRateDecimal: number,
  exemptionOrder: number,
  zve: number,
) {
  const yearlyData: SavingsYear[] = []
  let capitalStart = 0
  let totalVorabpauschale = 0

  for (let year = 1; year <= contributions.length; year++) {
    const contribution = contributions[year - 1]!
    const grossReturn = capitalStart * returnRate
    const vorabpauschale =
      capitalStart * baseRateDecimal * VORABPAUSCHALE_FACTOR
    const vorabpauschaleTax = günstigerprüfung(
      Math.max(0, vorabpauschale - exemptionOrder),
      zve,
    )
    const capitalEnd =
      capitalStart + contribution + grossReturn - vorabpauschaleTax

    totalVorabpauschale += vorabpauschale
    yearlyData.push({
      year,
      contribution,
      capitalStart,
      grossReturn,
      vorabpauschale,
      vorabpauschaleTax,
      capitalEnd,
    })
    capitalStart = capitalEnd
  }

  return {
    yearlyData,
    finalCapital: capitalStart,
    totalContributions: contributions.reduce((sum, c) => sum + c, 0),
    totalVorabpauschale,
  }
}

function calculateNormalDepotPayout(
  input: CalculatorInput,
  savings: ReturnType<typeof calculateDepotSavings>,
) {
  const {
    zveRetirement,
    exemptionOrder,
    payoutReturnRate,
    payoutUntilAge,
    retirementAge,
    oneTimePayout,
  } = input
  const { finalCapital, totalContributions, totalVorabpauschale } = savings

  const remainingCapital = finalCapital * (1 - oneTimePayout)
  const payoutYears = payoutUntilAge - retirementAge
  /* v8 ignore next -- @preserve —— finalCapital is always positive since every savings year adds a positive contribution */
  const gainFraction =
    finalCapital > 0
      ? Math.max(0, finalCapital - totalContributions - totalVorabpauschale) /
        finalCapital
      : 0
  const annualPMT = -pmt(payoutReturnRate, payoutYears, remainingCapital, 0, 1)

  const computePayoutYear = (grossPayout: number) => {
    const taxableGain = Math.max(
      0,
      grossPayout * gainFraction * TEILFREISTELLUNG - exemptionOrder,
    )
    const tax = günstigerprüfung(taxableGain, zveRetirement)
    return { grossPayout, tax, netPayout: grossPayout - tax }
  }

  const firstPayoutYear = computePayoutYear(
    finalCapital - remainingCapital + annualPMT,
  )
  const regularPayoutYear = computePayoutYear(annualPMT)

  return {
    firstYear: firstPayoutYear,
    recurringYear: regularPayoutYear,
    totalGross:
      firstPayoutYear.grossPayout +
      regularPayoutYear.grossPayout * (payoutYears - 1),
    totalTax: firstPayoutYear.tax + regularPayoutYear.tax * (payoutYears - 1),
    totalNet:
      firstPayoutYear.netPayout +
      regularPayoutYear.netPayout * (payoutYears - 1),
  }
}

function calculateAvDepotSavings(input: CalculatorInput) {
  const {
    savingsRate,
    etfReturnRate,
    avDepotCosts,
    baseRate,
    exemptionOrder,
    age,
    retirementAge,
    zveSavingsPhase,
    taxSavingsMode,
    currentYear,
    childBirthYears,
  } = input

  const savingYears = retirementAge - age
  const netReturnRate = etfReturnRate - avDepotCosts
  const yearlyData: SavingsYear[] = []
  let subsidizedCapital = 0
  let überzahlungCapital = 0
  let totalOwnContributions = 0
  let totalÜberzahlung = 0
  const taxSavings: number[] = []
  let pendingTaxSaving = 0

  for (let year = 1; year <= savingYears; year++) {
    const capitalStart = subsidizedCapital + überzahlungCapital
    const contribution = savingsRate
    const reinvestedTaxSaving = pendingTaxSaving
    const ownContribToAv =
      taxSavingsMode === 'avDepot'
        ? contribution + reinvestedTaxSaving
        : contribution
    const { grundzulage, kinderzulage, starterBonus } = calculateZulagen(
      ownContribToAv,
      year,
      currentYear,
      age,
      childBirthYears,
    )

    const deductionBase =
      Math.min(ownContribToAv, AV_SUBSIDIZED_CAP) + grundzulage + kinderzulage
    if (year < savingYears) {
      pendingTaxSaving = Math.max(
        0,
        germanTariffIncomeTax(zveSavingsPhase) -
          germanTariffIncomeTax(Math.max(0, zveSavingsPhase - deductionBase)) -
          grundzulage -
          kinderzulage,
      )
    }
    taxSavings.push(reinvestedTaxSaving)

    const subsidizedInflow =
      Math.min(ownContribToAv, AV_SUBSIDIZED_CAP) +
      grundzulage +
      kinderzulage +
      starterBonus
    const avInflow =
      contribution +
      grundzulage +
      kinderzulage +
      starterBonus +
      (taxSavingsMode === 'avDepot' ? reinvestedTaxSaving : 0)
    const überzahlungInflow = avInflow - subsidizedInflow

    const subsidizedGrossReturn = subsidizedCapital * netReturnRate
    const überzahlungGrossReturn = überzahlungCapital * netReturnRate
    const grossReturn = subsidizedGrossReturn + überzahlungGrossReturn

    subsidizedCapital =
      subsidizedCapital + subsidizedInflow + subsidizedGrossReturn
    überzahlungCapital =
      überzahlungCapital + überzahlungInflow + überzahlungGrossReturn
    const capitalEnd = subsidizedCapital + überzahlungCapital

    totalOwnContributions += contribution
    totalÜberzahlung += Math.max(0, contribution - AV_SUBSIDIZED_CAP)

    yearlyData.push({
      year,
      contribution: avInflow,
      capitalStart,
      grossReturn,
      vorabpauschale: 0,
      vorabpauschaleTax: 0,
      capitalEnd,
    })
  }

  const secondaryDepot =
    taxSavingsMode === 'secondaryDepot'
      ? calculateDepotSavings(
          taxSavings,
          etfReturnRate,
          baseRate,
          exemptionOrder,
          zveSavingsPhase,
        )
      : undefined

  const yearlyDataWithSecondaryDepot = secondaryDepot
    ? yearlyData.map((av, i) => {
        const secondary = secondaryDepot.yearlyData[i]!
        return {
          ...av,
          contribution: av.contribution + secondary.contribution,
          capitalStart: av.capitalStart + secondary.capitalStart,
          grossReturn: av.grossReturn + secondary.grossReturn,
          vorabpauschale: av.vorabpauschale + secondary.vorabpauschale,
          vorabpauschaleTax: av.vorabpauschaleTax + secondary.vorabpauschaleTax,
          capitalEnd: av.capitalEnd + secondary.capitalEnd,
        }
      })
    : yearlyData

  return {
    result: {
      yearlyData: yearlyDataWithSecondaryDepot,
      finalCapital:
        subsidizedCapital +
        überzahlungCapital +
        (secondaryDepot?.finalCapital ?? 0),
      totalContributions: totalOwnContributions,
      totalVorabpauschale: secondaryDepot?.totalVorabpauschale ?? 0,
    },
    subsidizedCapital,
    überzahlungCapital,
    totalÜberzahlungContributions: totalÜberzahlung,
    secondaryDepotCapital: secondaryDepot?.finalCapital ?? 0,
    secondaryDepotContributions: secondaryDepot?.totalContributions ?? 0,
    secondaryDepotVorabpauschale: secondaryDepot?.totalVorabpauschale ?? 0,
  }
}

function calculateAvDepotPayout(
  input: CalculatorInput,
  savings: ReturnType<typeof calculateAvDepotSavings>,
) {
  const {
    zveRetirement,
    exemptionOrder,
    payoutReturnRate,
    payoutUntilAge,
    retirementAge,
    oneTimePayout,
    age,
    avDepotCosts,
  } = input
  const {
    subsidizedCapital,
    überzahlungCapital,
    totalÜberzahlungContributions,
    secondaryDepotCapital,
    secondaryDepotContributions,
    secondaryDepotVorabpauschale,
  } = savings

  const payoutYears = payoutUntilAge - retirementAge
  const avReturnRate = payoutReturnRate - avDepotCosts
  const secReturnRate = payoutReturnRate

  const avDepotCapital = subsidizedCapital + überzahlungCapital
  const avRemainingCapital = avDepotCapital * (1 - oneTimePayout)
  const secRemainingCapital = secondaryDepotCapital * (1 - oneTimePayout)

  const avAnnualPMT = -pmt(avReturnRate, payoutYears, avRemainingCapital, 0, 1)
  const secAnnualPMT =
    secondaryDepotCapital > 0
      ? -pmt(secReturnRate, payoutYears, secRemainingCapital, 0, 1)
      : 0

  /* v8 ignore next -- @preserve —— avDepotCapital is always positive since every savings year adds a positive contribution */
  const subsidizedFraction =
    avDepotCapital > 0 ? subsidizedCapital / avDepotCapital : 0
  /* v8 ignore next -- @preserve —— avDepotCapital is always positive since every savings year adds a positive contribution */
  const überzahlungFraction =
    avDepotCapital > 0 ? überzahlungCapital / avDepotCapital : 0

  const überzahlungGainFraction =
    überzahlungCapital > 0
      ? Math.max(0, überzahlungCapital - totalÜberzahlungContributions) /
        überzahlungCapital
      : 0
  const secGainFraction =
    secondaryDepotCapital > 0
      ? Math.max(
          0,
          secondaryDepotCapital -
            secondaryDepotContributions -
            secondaryDepotVorabpauschale,
        ) / secondaryDepotCapital
      : 0

  const savingYears = retirementAge - age
  const halbeinkünfteApplies = retirementAge >= 62 && savingYears >= 12

  const computePayoutYear = (avGross: number, secGross: number) => {
    const subsidizedAmount = avGross * subsidizedFraction
    const subsidizedTax = grenzsteuer(subsidizedAmount, zveRetirement)

    const überzahlungAmount = avGross * überzahlungFraction
    const überzahlungTaxableGain =
      überzahlungAmount *
      überzahlungGainFraction *
      (halbeinkünfteApplies ? 0.5 : 1)
    const überzahlungTax = grenzsteuer(
      überzahlungTaxableGain,
      zveRetirement + subsidizedAmount,
    )

    const secTaxableGain = Math.max(
      0,
      secGross * secGainFraction * TEILFREISTELLUNG - exemptionOrder,
    )
    const secTax = günstigerprüfung(
      secTaxableGain,
      zveRetirement + subsidizedAmount + überzahlungTaxableGain,
    )

    const grossPayout = avGross + secGross
    const tax = subsidizedTax + überzahlungTax + secTax
    return { grossPayout, tax, netPayout: grossPayout - tax }
  }

  const avLumpSum = avDepotCapital - avRemainingCapital
  const secLumpSum = secondaryDepotCapital - secRemainingCapital
  const firstPayoutYear = computePayoutYear(
    avLumpSum + avAnnualPMT,
    secLumpSum + secAnnualPMT,
  )
  const regularPayoutYear = computePayoutYear(avAnnualPMT, secAnnualPMT)

  return {
    firstYear: firstPayoutYear,
    recurringYear: regularPayoutYear,
    totalGross:
      firstPayoutYear.grossPayout +
      regularPayoutYear.grossPayout * (payoutYears - 1),
    totalTax: firstPayoutYear.tax + regularPayoutYear.tax * (payoutYears - 1),
    totalNet:
      firstPayoutYear.netPayout +
      regularPayoutYear.netPayout * (payoutYears - 1),
  }
}

function calculateZulagen(
  contribution: number,
  savingsYear: number,
  currentYear: number,
  age: number,
  childBirthYears: number[],
): {
  grundzulage: number
  kinderzulage: number
  starterBonus: number
} {
  /* v8 ignore if -- @preserve —— unreachable while savingsRate's schema min equals MIN_OWN_CONTRIBUTION (120) */
  if (contribution < MIN_OWN_CONTRIBUTION)
    return { grundzulage: 0, kinderzulage: 0, starterBonus: 0 }

  const grundzulage =
    Math.min(contribution, 360) * 0.5 +
    Math.max(0, Math.min(contribution, AV_SUBSIDIZED_CAP) - 360) * 0.25
  const starterBonus =
    savingsYear === 1 && age < 25 ? BERUFSEINSTEIGER_BONUS : 0
  const calendarYear = currentYear + savingsYear - 1
  const kinderzulage = childBirthYears.reduce((sum, birthYear) => {
    const childAge = calendarYear - birthYear
    return childAge >= 0 && childAge < 18
      ? sum + Math.min(contribution, KINDERZULAGE_CAP)
      : sum
  }, 0)

  return { grundzulage, kinderzulage, starterBonus }
}

function grenzsteuer(amount: number, zve: number): number {
  return germanTaxIncludingSoli(zve + amount) - germanTaxIncludingSoli(zve)
}

function günstigerprüfung(taxableGain: number, zve: number): number {
  const kapitalertragsteuer = taxableGain * ABGELTUNGSTEUERSATZ
  const grenzsteuerbetrag = grenzsteuer(taxableGain, zve)
  return Math.min(kapitalertragsteuer, grenzsteuerbetrag)
}

function germanTaxIncludingSoli(zve: number): number {
  return parseCurrency(calculateGermanIncomeTax(zve).total.amount)
}

function germanTariffIncomeTax(zve: number): number {
  return parseCurrency(calculateGermanIncomeTax(zve).incomeTax.amount)
}

function calculateGermanIncomeTax(zve: number) {
  return incomeTax.calculate({ zve, splitting: false, year: INCOME_TAX_YEAR })
}
