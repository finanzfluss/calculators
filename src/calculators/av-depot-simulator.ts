import type { SavingsYear } from './av-depot-utils'
import { z } from 'zod'
import {
  AV_CONTRIBUTION_CAP,
  AV_SUBSIDIZED_CAP,
  BERUFSEINSTEIGER_BONUS,
  KINDERZULAGE_CAP,
  MIN_OWN_CONTRIBUTION,
  TEILFREISTELLUNG,
} from '../constants/av-depot'
import { pmt } from '../utils'
import { defineCalculator } from '../utils/calculator'
import {
  avDepotBaseSchema,
  calculateDepotSavings,
  germanIncomeTax,
  grenzsteuer,
  günstigerprüfung,
} from './av-depot-utils'

const schema = avDepotBaseSchema.extend({
  startCapital: z.coerce.number().min(0).default(0),
  includeStarterBonus: z.stringbool().or(z.boolean()).default(true),
})

type CalculatorInput = z.output<typeof schema>

export const avDepotSimulator = defineCalculator({
  schema,
  calculate,
})

function calculate(input: CalculatorInput) {
  const savings = calculateAvDepotSavings(input)
  const payout = calculateAvDepotPayout(input, savings)

  return {
    savings: savings.result,
    payout,
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
    startCapital,
    includeStarterBonus,
  } = input

  const savingYears = retirementAge - age
  const netReturnRate = etfReturnRate - avDepotCosts
  const yearlyData: SavingsYear[] = []
  let subsidizedCapital = startCapital
  let überzahlungCapital = 0
  let totalOwnContributions = 0
  let totalÜberzahlung = 0
  let totalGrundzulage = 0
  let totalKinderzulage = 0
  let totalStarterBonus = 0
  let totalTaxSaving = 0
  let totalReinvestedTaxSaving = 0
  const secondaryDepotContributions: number[] = []

  for (let year = 1; year <= savingYears; year++) {
    const capitalStart = subsidizedCapital + überzahlungCapital
    const contribution = savingsRate
    const { grundzulage, kinderzulage, starterBonus } = calculateZulagen(
      contribution,
      year,
      currentYear,
      age,
      childBirthYears,
      includeStarterBonus,
    )

    const deductionBase =
      Math.min(contribution, AV_SUBSIDIZED_CAP) + grundzulage + kinderzulage
    const taxSaving = Math.max(
      0,
      germanIncomeTax(zveSavingsPhase) -
        germanIncomeTax(Math.max(0, zveSavingsPhase - deductionBase)) -
        grundzulage -
        kinderzulage,
    )

    const reinvestedTaxSaving =
      taxSavingsMode === 'avDepot'
        ? Math.min(taxSaving, AV_CONTRIBUTION_CAP - contribution)
        : 0
    secondaryDepotContributions.push(
      taxSavingsMode === 'consume' ? 0 : taxSaving - reinvestedTaxSaving,
    )

    const ownContribToAv = contribution + reinvestedTaxSaving
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
      reinvestedTaxSaving
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
    totalÜberzahlung += überzahlungInflow
    totalGrundzulage += grundzulage
    totalKinderzulage += kinderzulage
    totalStarterBonus += starterBonus
    totalTaxSaving += taxSaving
    totalReinvestedTaxSaving += reinvestedTaxSaving

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

  const secondaryDepot = secondaryDepotContributions.some((c) => c > 0)
    ? calculateDepotSavings(
        secondaryDepotContributions,
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
      totalGrundzulage,
      totalKinderzulage,
      totalStarterBonus,
      totalTaxSaving,
      totalReinvestedTaxSaving,
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
  includeStarterBonus: boolean,
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
    includeStarterBonus && savingsYear === 1 && age < 25
      ? BERUFSEINSTEIGER_BONUS
      : 0
  const calendarYear = currentYear + savingsYear - 1
  const kinderzulage = childBirthYears.reduce((sum, birthYear) => {
    const childAge = calendarYear - birthYear
    return childAge >= 0 && childAge < 18
      ? sum + Math.min(contribution, KINDERZULAGE_CAP)
      : sum
  }, 0)

  return { grundzulage, kinderzulage, starterBonus }
}
