import type { TaxableDepotState } from './av-depot-tax'
import { z } from 'zod'
import {
  ABGELTUNGSTEUERSATZ,
  AV_CONTRACT_CONTRIBUTION_CAP,
  AV_SUBSIDIZED_CAP,
  AV_TOTAL_CONTRIBUTION_CAP,
  BERUFSEINSTEIGER_BONUS,
  INCOME_TAX_YEAR,
  KINDERZULAGE_CAP,
  MIN_OWN_CONTRIBUTION,
  TAXABLE_EQUITY_FUND_FRACTION,
  TEILFREISTELLUNG,
} from '../constants/av-depot'
import { formatCurrencyAdaptive, parseCurrency, pmt } from '../utils'
import { defineCalculator } from '../utils/calculator'
import {
  addFundLot,
  assessVorabpauschale,
  cloneTaxableDepot,
  createTaxableDepot,
  getTaxableDepotValue,
  growTaxableDepot,
  sellFundLots,
} from './av-depot-tax'
import { incomeTax } from './income-tax'

const schema = z
  .object({
    age: z.coerce.number().int().min(18).max(67),
    retirementAge: z.coerce.number().int().min(65).max(70),
    zveSavingsPhase: z.coerce.number().min(0),
    zveRetirement: z.coerce.number().min(0),
    savingsRate: z.coerce
      .number()
      .min(MIN_OWN_CONTRIBUTION)
      .max(AV_TOTAL_CONTRIBUTION_CAP),
    etfReturnRate: z.coerce
      .number()
      .gt(-100)
      .max(100)
      .transform((value) => value / 100),
    avDepotCosts: z.coerce
      .number()
      .min(0)
      .max(100)
      .transform((value) => value / 100),
    exemptionOrder: z.coerce.number().min(0).max(1000).default(1000),
    taxSavingsMode: z.enum(['avDepot', 'secondaryDepot', 'consume']),
    baseRate: z.coerce
      .number()
      .min(0)
      .max(100)
      .default(0)
      .transform((value) => value / 100),
    oneTimePayout: z.coerce
      .number()
      .min(0)
      .max(30)
      .transform((value) => value / 100),
    payoutReturnRate: z.coerce
      .number()
      .gt(-100)
      .max(100)
      .transform((value) => value / 100),
    payoutUntilAge: z.coerce.number().int().min(85).max(120),
    childBirthYears: z.preprocess(
      (value) =>
        value === undefined ? [] : Array.isArray(value) ? value : [value],
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
  .refine((data) => data.etfReturnRate - data.avDepotCosts > -1, {
    message: 'AV depot net return must be greater than -100%',
    path: ['avDepotCosts'],
  })
  .refine((data) => data.payoutReturnRate - data.avDepotCosts > -1, {
    message: 'AV depot payout net return must be greater than -100%',
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

interface TaxableSavingsResult {
  yearlyData: SavingsYear[]
  depot: TaxableDepotState
  finalCapital: number
  totalContributions: number
  totalVorabpauschale: number
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

function calculateNormalDepotSavings(
  input: CalculatorInput,
): TaxableSavingsResult {
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
  baseRate: number,
  exemptionOrder: number,
  zve: number,
): TaxableSavingsResult {
  const yearlyData: SavingsYear[] = []
  const depot = createTaxableDepot()
  let totalVorabpauschale = 0

  for (const [index, contribution] of contributions.entries()) {
    const yearResult = advanceTaxableSavingsYear(
      depot,
      contribution,
      returnRate,
      baseRate,
      exemptionOrder,
      zve,
      index + 1,
    )
    totalVorabpauschale += yearResult.vorabpauschale
    yearlyData.push(yearResult)
  }

  return {
    yearlyData,
    depot,
    finalCapital: getTaxableDepotValue(depot),
    totalContributions: contributions.reduce((sum, value) => sum + value, 0),
    totalVorabpauschale,
  }
}

function advanceTaxableSavingsYear(
  depot: TaxableDepotState,
  contribution: number,
  returnRate: number,
  baseRate: number,
  exemptionOrder: number,
  zve: number,
  year: number,
): SavingsYear {
  const capitalStart = getTaxableDepotValue(depot)
  const estimatedTax = estimateSavingsYearTax(
    depot,
    depot.pendingTaxableVorabpauschale,
    contribution,
    exemptionOrder,
    zve,
  )

  let saleTaxableGain = 0
  if (estimatedTax > contribution) {
    saleTaxableGain = sellFundLots(
      depot,
      estimatedTax - contribution,
    ).taxableGain
  }

  const taxableAmount = applyLossCarryAndAllowance(
    depot,
    depot.pendingTaxableVorabpauschale + saleTaxableGain,
    exemptionOrder,
  )
  const tax = günstigerprüfung(taxableAmount, zve)
  depot.pendingTaxableVorabpauschale = 0

  const grossReturn = growTaxableDepot(depot, returnRate)
  const grossVorabpauschale = assessVorabpauschale(
    depot,
    getTaxableDepotValue(depot) - grossReturn,
    grossReturn,
    baseRate,
  )
  depot.pendingTaxableVorabpauschale =
    grossVorabpauschale * TAXABLE_EQUITY_FUND_FRACTION
  addFundLot(depot, Math.max(0, contribution - tax))

  return {
    year,
    contribution,
    capitalStart,
    grossReturn,
    vorabpauschale: grossVorabpauschale,
    vorabpauschaleTax: tax,
    capitalEnd: getTaxableDepotValue(depot),
  }
}

function estimateSavingsYearTax(
  depot: TaxableDepotState,
  taxableVorabpauschale: number,
  contribution: number,
  exemptionOrder: number,
  zve: number,
): number {
  let saleAmount = 0
  let tax = 0

  for (let iteration = 0; iteration < 12; iteration++) {
    const preview = cloneTaxableDepot(depot)
    const saleTaxableGain = sellFundLots(preview, saleAmount).taxableGain
    const taxableAmount = previewTaxableAmount(
      taxableVorabpauschale + saleTaxableGain,
      depot.taxableLossCarry,
      exemptionOrder,
    )
    tax = günstigerprüfung(taxableAmount, zve)
    const nextSaleAmount = Math.max(0, tax - contribution)
    if (Math.abs(nextSaleAmount - saleAmount) < 1e-8) break
    saleAmount = nextSaleAmount
  }

  return tax
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
  const savingYears = input.retirementAge - input.age
  const netReturnRate = input.etfReturnRate - input.avDepotCosts
  const yearlyData: SavingsYear[] = []
  const secondaryDepot = createTaxableDepot()
  let subsidizedCapital = 0
  let unsubsidizedCapital = 0
  let unsubsidizedContributionBasis = 0
  let pendingTaxSaving = 0
  let totalSecondaryVorabpauschale = 0
  const contractContributionCap =
    input.savingsRate <= AV_CONTRACT_CONTRIBUTION_CAP
      ? AV_CONTRACT_CONTRIBUTION_CAP
      : AV_TOTAL_CONTRIBUTION_CAP

  for (let index = 0; index < savingYears; index++) {
    const savingsYear = index + 1
    const capitalStart =
      subsidizedCapital +
      unsubsidizedCapital +
      getTaxableDepotValue(secondaryDepot)

    const reinvestment = allocateTaxSaving(
      pendingTaxSaving,
      input.savingsRate,
      contractContributionCap,
      input.taxSavingsMode,
    )
    const contractOwnContribution = input.savingsRate + reinvestment.avDepot
    const { grundzulage, kinderzulage, starterBonus } = calculateZulagen(
      contractOwnContribution,
      savingsYear,
      input.currentYear,
      input.age,
      input.childBirthYears,
    )
    const subsidizedOwnContribution = Math.min(
      contractOwnContribution,
      AV_SUBSIDIZED_CAP,
    )
    const unsubsidizedOwnContribution =
      contractOwnContribution - subsidizedOwnContribution
    if (index < savingYears - 1) {
      const deductionBase =
        subsidizedOwnContribution + grundzulage + kinderzulage
      pendingTaxSaving = calculateTaxSaving(
        deductionBase,
        grundzulage + kinderzulage,
        input,
      )
    }

    const subsidizedGrossReturn = subsidizedCapital * netReturnRate
    const unsubsidizedGrossReturn = unsubsidizedCapital * netReturnRate
    subsidizedCapital +=
      subsidizedGrossReturn +
      subsidizedOwnContribution +
      grundzulage +
      kinderzulage +
      starterBonus
    unsubsidizedCapital += unsubsidizedGrossReturn + unsubsidizedOwnContribution
    unsubsidizedContributionBasis += unsubsidizedOwnContribution

    const secondaryYear = advanceTaxableSavingsYear(
      secondaryDepot,
      reinvestment.secondaryDepot,
      input.etfReturnRate,
      input.baseRate,
      input.exemptionOrder,
      input.zveSavingsPhase,
      savingsYear,
    )
    totalSecondaryVorabpauschale += secondaryYear.vorabpauschale

    const avInflow =
      contractOwnContribution + grundzulage + kinderzulage + starterBonus
    yearlyData.push({
      year: savingsYear,
      contribution: avInflow + reinvestment.secondaryDepot,
      capitalStart,
      grossReturn:
        subsidizedGrossReturn +
        unsubsidizedGrossReturn +
        secondaryYear.grossReturn,
      vorabpauschale: secondaryYear.vorabpauschale,
      vorabpauschaleTax: secondaryYear.vorabpauschaleTax,
      capitalEnd:
        subsidizedCapital +
        unsubsidizedCapital +
        getTaxableDepotValue(secondaryDepot),
    })
  }

  const secondaryDepotCapital = getTaxableDepotValue(secondaryDepot)
  const secondaryDepotContributions = secondaryDepot.lots.reduce(
    (sum, lot) => sum + lot.basis,
    0,
  )
  const secondaryDepotVorabpauschale = secondaryDepot.lots.reduce(
    (sum, lot) => sum + lot.grossVorabpauschale,
    0,
  )

  return {
    result: {
      yearlyData,
      finalCapital:
        subsidizedCapital + unsubsidizedCapital + secondaryDepotCapital,
      totalContributions: input.savingsRate * savingYears,
      totalVorabpauschale: totalSecondaryVorabpauschale,
    },
    subsidizedCapital,
    überzahlungCapital: unsubsidizedCapital,
    totalÜberzahlungContributions: unsubsidizedContributionBasis,
    secondaryDepotCapital,
    secondaryDepotContributions,
    secondaryDepotVorabpauschale,
    secondaryDepot,
  }
}

function allocateTaxSaving(
  taxSaving: number,
  regularContribution: number,
  contributionCap: number,
  mode: CalculatorInput['taxSavingsMode'],
): { avDepot: number; secondaryDepot: number } {
  if (mode === 'consume') return { avDepot: 0, secondaryDepot: 0 }
  if (mode === 'secondaryDepot') {
    return { avDepot: 0, secondaryDepot: taxSaving }
  }

  const avDepot = Math.min(taxSaving, contributionCap - regularContribution)
  return { avDepot, secondaryDepot: taxSaving - avDepot }
}

function calculateTaxSaving(
  deductionBase: number,
  allowance: number,
  input: CalculatorInput,
): number {
  // § 10a separately determines the additional tariff-income-tax reduction.
  // A possible secondary solidarity-surcharge effect is outside this model.
  return Math.max(
    0,
    germanTariffIncomeTax(input.zveSavingsPhase) -
      germanTariffIncomeTax(
        Math.max(0, input.zveSavingsPhase - deductionBase),
      ) -
      allowance,
  )
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

function applyLossCarryAndAllowance(
  depot: TaxableDepotState,
  taxableIncome: number,
  exemptionOrder: number,
): number {
  const afterLossCarry = taxableIncome - depot.taxableLossCarry
  if (afterLossCarry <= 0) {
    depot.taxableLossCarry = -afterLossCarry
    return 0
  }

  depot.taxableLossCarry = 0
  return Math.max(0, afterLossCarry - exemptionOrder)
}

function previewTaxableAmount(
  taxableIncome: number,
  lossCarry: number,
  exemptionOrder: number,
): number {
  return Math.max(0, taxableIncome - lossCarry - exemptionOrder)
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
