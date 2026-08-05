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

interface AvSavingsResult {
  yearlyData: SavingsYear[]
  finalCapital: number
  totalContributions: number
  totalVorabpauschale: number
  subsidizedCapital: number
  unsubsidizedCapital: number
  unsubsidizedContributionBasis: number
  secondaryDepot: TaxableDepotState
}

interface PayoutResult {
  firstYear: PayoutYear
  recurringYear: PayoutYear
  totalGross: number
  totalTax: number
  totalNet: number
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

  const avDepotSavings = calculateAvDepotSavings(input)
  const avDepotPayout = calculateAvDepotPayout(input, avDepotSavings)

  return {
    savingsPerYear: normalDepotSavings.yearlyData.map((normalYear, index) => {
      const avYear = avDepotSavings.yearlyData[index]!
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

function depotPair(normalDepot: number, avDepotValue: number): DepotPair {
  return {
    normalDepot: formatCurrencyAdaptive(normalDepot),
    avDepot: formatCurrencyAdaptive(avDepotValue),
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
  const savingYears = getSavingYears(input)
  return calculateDepotSavings(
    Array.from({ length: savingYears }, () => input.savingsRate),
    input.etfReturnRate,
    input.baseRate,
    input.exemptionOrder,
    input.zveSavingsPhase,
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
  savings: TaxableSavingsResult,
): PayoutResult {
  const depot = cloneTaxableDepot(savings.depot)
  const initialCapital = getTaxableDepotValue(depot)
  const payoutYears = input.payoutUntilAge - input.retirementAge
  const lumpSum = initialCapital * input.oneTimePayout
  const annualPayout = calculateAnnualPayout(
    input.payoutReturnRate,
    payoutYears,
    initialCapital - lumpSum,
  )
  const years: PayoutYear[] = []
  let pendingTaxableVorabpauschale = depot.pendingTaxableVorabpauschale
  depot.pendingTaxableVorabpauschale = 0

  for (let index = 0; index < payoutYears; index++) {
    const requestedPayout = annualPayout + (index === 0 ? lumpSum : 0)
    const sale = sellFundLots(depot, requestedPayout)
    const taxableAmount = applyLossCarryAndAllowance(
      depot,
      pendingTaxableVorabpauschale + sale.taxableGain,
      input.exemptionOrder,
    )
    const tax = günstigerprüfung(taxableAmount, input.zveRetirement)

    years.push({
      grossPayout: sale.proceeds,
      tax,
      netPayout: sale.proceeds - tax,
    })

    pendingTaxableVorabpauschale =
      index < payoutYears - 1
        ? growAndAssessVorabpauschale(
            depot,
            input.payoutReturnRate,
            input.baseRate,
          ) * TAXABLE_EQUITY_FUND_FRACTION
        : 0
  }

  return summarizePayout(years)
}

function calculateAvDepotSavings(input: CalculatorInput): AvSavingsResult {
  const savingYears = getSavingYears(input)
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
      // The one-time starter bonus is excluded from the § 10a
      // Günstigerprüfung, but remains funded AV capital.
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

  const finalCapital =
    subsidizedCapital +
    unsubsidizedCapital +
    getTaxableDepotValue(secondaryDepot)

  return {
    yearlyData,
    finalCapital,
    totalContributions: input.savingsRate * savingYears,
    totalVorabpauschale: totalSecondaryVorabpauschale,
    subsidizedCapital,
    unsubsidizedCapital,
    unsubsidizedContributionBasis,
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
  savings: AvSavingsResult,
): PayoutResult {
  const payoutYears = input.payoutUntilAge - input.retirementAge
  const avReturnRate = input.payoutReturnRate - input.avDepotCosts
  const avInitialCapital =
    savings.subsidizedCapital + savings.unsubsidizedCapital
  const secondaryDepot = cloneTaxableDepot(savings.secondaryDepot)
  const secondaryInitialCapital = getTaxableDepotValue(secondaryDepot)
  const avLumpSum = avInitialCapital * input.oneTimePayout
  const secondaryLumpSum = secondaryInitialCapital * input.oneTimePayout
  const avAnnualPayout = calculateAnnualPayout(
    avReturnRate,
    payoutYears,
    avInitialCapital - avLumpSum,
  )
  const secondaryAnnualPayout = calculateAnnualPayout(
    input.payoutReturnRate,
    payoutYears,
    secondaryInitialCapital - secondaryLumpSum,
  )
  const avState = {
    subsidizedValue: savings.subsidizedCapital,
    unsubsidizedValue: savings.unsubsidizedCapital,
    unsubsidizedBasis: savings.unsubsidizedContributionBasis,
  }
  const halfDifferenceApplies = getSavingYears(input) >= 12
  const years: PayoutYear[] = []
  let pendingTaxableVorabpauschale = secondaryDepot.pendingTaxableVorabpauschale
  secondaryDepot.pendingTaxableVorabpauschale = 0

  for (let index = 0; index < payoutYears; index++) {
    const avWithdrawal = withdrawFromAvDepot(
      avState,
      avAnnualPayout + (index === 0 ? avLumpSum : 0),
    )
    const secondarySale = sellFundLots(
      secondaryDepot,
      secondaryAnnualPayout + (index === 0 ? secondaryLumpSum : 0),
    )
    const unsubsidizedTaxableGain =
      avWithdrawal.unsubsidizedGain * (halfDifferenceApplies ? 0.5 : 1)
    const ordinaryTaxableIncome =
      avWithdrawal.subsidizedAmount + unsubsidizedTaxableGain
    const ordinaryTax = grenzsteuer(ordinaryTaxableIncome, input.zveRetirement)
    const taxableCapitalIncome = applyLossCarryAndAllowance(
      secondaryDepot,
      pendingTaxableVorabpauschale + secondarySale.taxableGain,
      input.exemptionOrder,
    )
    const secondaryTax = günstigerprüfung(
      taxableCapitalIncome,
      Math.max(0, input.zveRetirement + ordinaryTaxableIncome),
    )
    const grossPayout = avWithdrawal.amount + secondarySale.proceeds
    const tax = ordinaryTax + secondaryTax

    years.push({
      grossPayout,
      tax,
      netPayout: grossPayout - tax,
    })

    if (index < payoutYears - 1) {
      avState.subsidizedValue *= 1 + avReturnRate
      avState.unsubsidizedValue *= 1 + avReturnRate
      pendingTaxableVorabpauschale =
        growAndAssessVorabpauschale(
          secondaryDepot,
          input.payoutReturnRate,
          input.baseRate,
        ) * TAXABLE_EQUITY_FUND_FRACTION
    }
  }

  return summarizePayout(years)
}

function withdrawFromAvDepot(
  state: {
    subsidizedValue: number
    unsubsidizedValue: number
    unsubsidizedBasis: number
  },
  requestedAmount: number,
): {
  amount: number
  subsidizedAmount: number
  unsubsidizedGain: number
} {
  const totalValue = state.subsidizedValue + state.unsubsidizedValue
  const amount = Math.min(requestedAmount, totalValue)
  const subsidizedAmount = amount * (state.subsidizedValue / totalValue)
  const unsubsidizedAmount = amount - subsidizedAmount
  const closesUnsubsidizedBucket =
    unsubsidizedAmount >= state.unsubsidizedValue - 1e-9
  const unsubsidizedBasis =
    state.unsubsidizedValue > 0
      ? closesUnsubsidizedBucket
        ? state.unsubsidizedBasis
        : unsubsidizedAmount *
          (state.unsubsidizedBasis / state.unsubsidizedValue)
      : 0

  state.subsidizedValue -= subsidizedAmount
  state.unsubsidizedValue -= unsubsidizedAmount
  state.unsubsidizedBasis -= unsubsidizedBasis

  return {
    amount,
    subsidizedAmount,
    unsubsidizedGain: unsubsidizedAmount - unsubsidizedBasis,
  }
}

function growAndAssessVorabpauschale(
  depot: TaxableDepotState,
  returnRate: number,
  baseRate: number,
): number {
  const capitalStart = getTaxableDepotValue(depot)
  const grossReturn = growTaxableDepot(depot, returnRate)
  return assessVorabpauschale(depot, capitalStart, grossReturn, baseRate)
}

function calculateAnnualPayout(
  returnRate: number,
  payoutYears: number,
  capital: number,
): number {
  return capital > 0 ? -pmt(returnRate, payoutYears, capital, 0, 1) : 0
}

function summarizePayout(years: PayoutYear[]): PayoutResult {
  const firstYear = years[0]!
  const recurringYears = years.slice(1)
  const recurringYear = averagePayoutYear(recurringYears)

  return {
    firstYear,
    recurringYear,
    totalGross: years.reduce((sum, year) => sum + year.grossPayout, 0),
    totalTax: years.reduce((sum, year) => sum + year.tax, 0),
    totalNet: years.reduce((sum, year) => sum + year.netPayout, 0),
  }
}

function averagePayoutYear(years: PayoutYear[]): PayoutYear {
  const count = years.length
  return {
    grossPayout: years.reduce((sum, year) => sum + year.grossPayout, 0) / count,
    tax: years.reduce((sum, year) => sum + year.tax, 0) / count,
    netPayout: years.reduce((sum, year) => sum + year.netPayout, 0) / count,
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
  return (
    germanTaxIncludingSoli(Math.max(0, zve + amount)) -
    germanTaxIncludingSoli(zve)
  )
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

function getSavingYears(input: CalculatorInput): number {
  // The annual model treats age as the age in the first contribution year.
  return input.retirementAge - input.age
}
