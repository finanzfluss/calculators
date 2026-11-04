import { z } from 'zod'
import {
  LIFE_TABLE_MAX_AGE,
  survivalProbability,
} from '../constants/life-table'
import { formatNumber, formatPercent, rate } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { avDepotSimulator } from './av-depot-simulator'
import * as avDepotUtils from './av-depot-utils'

const inputSchema = z
  .object({
    age: z.coerce.number().int().min(18).max(66),
    retirementAge: z.coerce.number().int().min(65).max(70),
    zveSavingsPhase: z.coerce.number().min(0).max(500_000),
    zveRetirement: z.coerce.number().min(0).max(500_000),
    riesterAnnualContribution: z.coerce.number().min(0).max(10_000),
    riesterContractValue: z.coerce.number().min(0).max(500_000),
    riesterContractStart: z.coerce.number().int().min(2002).max(2026),
    riesterTotalContributions: z.coerce.number().min(0).max(500_000).default(0),
    riesterTotalAllowances: z.coerce.number().min(0).max(500_000).default(0),
    riesterReturnRate: z.coerce
      .number()
      .min(0)
      .max(10)
      .transform((v) => v / 100)
      .optional(),
    riesterAnnuityFactor: z.coerce.number().min(1).max(50),
    riesterSwitchingCosts: z.coerce.number().min(0).max(10_000),
    etfReturnRate: z.coerce
      .number()
      .positive()
      .max(20)
      .transform((v) => v / 100),
    avDepotCosts: z.coerce
      .number()
      .min(0)
      .max(10)
      .transform((v) => v / 100),
    oneTimePayout: z.coerce
      .number()
      .min(0)
      .max(30)
      .transform((v) => v / 100),
    payoutReturnRate: z.coerce
      .number()
      .positive()
      .max(20)
      .transform((v) => v / 100),
    payoutUntilAge: z.coerce.number().int().min(85).max(120),
    childBirthYears: z.preprocess(
      (val) => (val === undefined ? [] : Array.isArray(val) ? val : [val]),
      z.array(z.coerce.number().int()),
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
    path: ['retirementAge'],
  })
  .refine((data) => data.avDepotCosts < data.etfReturnRate, {
    message: 'avDepotCosts must be less than etfReturnRate',
    path: ['avDepotCosts'],
  })
  .refine((data) => data.avDepotCosts < data.payoutReturnRate, {
    message: 'avDepotCosts must be less than payoutReturnRate',
    path: ['avDepotCosts'],
  })
  .refine(
    (data) =>
      data.childBirthYears.every(
        (year) =>
          year >= data.currentYear - 18 && year <= data.currentYear + 10,
      ),
    {
      message:
        'childBirthYears must be between currentYear - 18 and currentYear + 10',
      path: ['childBirthYears'],
    },
  )
  .refine(
    (data) =>
      data.riesterAnnualContribution <= riesterMaxAnnualContribution(data),
    {
      message:
        'riesterAnnualContribution plus allowances must not exceed the maximum subsidized contribution',
      path: ['riesterAnnualContribution'],
    },
  )

const scenarioPairSchema = z.object({
  avDepot: z.string(),
  riester: z.string(),
})

const payoutYearResultSchema = z.object({
  gross: scenarioPairSchema,
  tax: scenarioPairSchema,
  net: scenarioPairSchema,
})

const verdictCaseSchema = z.enum(['avDepotWins', 'riesterWins', 'mixed'])

const riesterReturnRateCaseSchema = z.enum([
  'manual',
  'derived',
  'missingInputs',
  'tooShort',
  'tooHigh',
  'tooLow',
])

const survivalToAgeSchema = z.object({
  age: z.number(),
  female: z.string(),
  male: z.string(),
})

const verdictSchema = z.object({
  case: verdictCaseSchema,
  leader: z.enum(['avDepot', 'riester']),
  capitalDifference: z.string(),
  subsidyDifference: z.string().nullable(),
  monthlyPayout: scenarioPairSchema,
  survivalToPayoutEnd: survivalToAgeSchema,
})

const outputSchema = z.object({
  savingsPerYear: z.array(
    z.object({
      year: z.number(),
      contribution: scenarioPairSchema,
      capitalStart: scenarioPairSchema,
      grossReturn: scenarioPairSchema,
      capitalEnd: scenarioPairSchema,
    }),
  ),
  startCapital: scenarioPairSchema,
  finalCapital: scenarioPairSchema,
  totalContributions: scenarioPairSchema,
  totalGrundzulage: scenarioPairSchema,
  totalKinderzulage: scenarioPairSchema,
  totalTaxSaving: scenarioPairSchema,
  totalInflow: scenarioPairSchema,
  totalReturn: scenarioPairSchema,
  firstPayoutYear: payoutYearResultSchema,
  regularPayoutYear: payoutYearResultSchema,
  payoutTotal: payoutYearResultSchema,
  riesterReturnRate: z.object({
    case: riesterReturnRateCaseSchema,
    value: z.string(),
    derivedValue: z.string().nullable(),
  }),
  verdict: verdictSchema,
})

type CalculatorInput = z.output<typeof inputSchema>
type CalculatorOutput = z.output<typeof outputSchema>
type ScenarioPair = z.output<typeof scenarioPairSchema>
type PayoutYearResult = z.output<typeof payoutYearResultSchema>
type RiesterReturnRateCase = z.output<typeof riesterReturnRateCaseSchema>
type VerdictCase = z.output<typeof verdictCaseSchema>
type Verdict = z.output<typeof verdictSchema>
type PayoutYear = avDepotUtils.PayoutYear

interface SavingsYear {
  contribution: number
  capitalStart: number
  grossReturn: number
  capitalEnd: number
}

interface RiesterReturnRate {
  case: RiesterReturnRateCase
  rate: number
  derivedRate: number | null
}

const SWITCHING_COSTS_MAX_CONTRACT_AGE = 5
const RIESTER_DEFAULT_RETURN_RATE = 0.017
const RIESTER_MIN_RETURN_RATE = 0
const RIESTER_MAX_RETURN_RATE = 0.1
const RIESTER_MIN_CONTRACT_MONTHS = 12
const RIESTER_GRUNDZULAGE = 175
const RIESTER_KINDERZULAGE = 300
const RIESTER_MIN_OWN_CONTRIBUTION = 60
const RIESTER_MAX_SUBSIDIZED_CONTRIBUTION = 2_100
const RIESTER_MIN_CONTRIBUTION_INCOME_SHARE = 0.04
const RIESTER_ANNUITY_BASE = 10_000
const MONTHS_PER_YEAR = 12

export const riesterOrAvDepot = defineCalculator({
  inputSchema,
  outputSchema,
  calculate,
})

function calculate(input: CalculatorInput): CalculatorOutput {
  const riester = simulateRiester(input)
  const startCapital = calculateTransferredCapital(input)
  const { savings, payout } = avDepotSimulator.calculate({
    age: input.age,
    retirementAge: input.retirementAge,
    zveSavingsPhase: input.zveSavingsPhase,
    zveRetirement: input.zveRetirement,
    savingsRate: input.riesterAnnualContribution,
    etfReturnRate: input.etfReturnRate,
    avDepotCosts: input.avDepotCosts,
    taxSavingsMode: 'avDepot',
    oneTimePayout: input.oneTimePayout,
    payoutReturnRate: input.payoutReturnRate,
    payoutUntilAge: input.payoutUntilAge,
    childBirthYears: input.childBirthYears,
    currentYear: input.currentYear,
    startCapital,
    exemptionOrder: 1000,
    baseRate: 0,
    includeStarterBonus: false,
  })

  const totalInflow =
    savings.totalContributions +
    savings.totalGrundzulage +
    savings.totalKinderzulage +
    savings.totalReinvestedTaxSaving

  return {
    savingsPerYear: savings.yearlyData.map((year, index) => {
      const riesterYear = riester.years[index]!
      return {
        year: year.year,
        contribution: scenarioPair(year.contribution, riesterYear.contribution),
        capitalStart: scenarioPair(year.capitalStart, riesterYear.capitalStart),
        grossReturn: scenarioPair(year.grossReturn, riesterYear.grossReturn),
        capitalEnd: scenarioPair(year.capitalEnd, riesterYear.capitalEnd),
      }
    }),
    startCapital: scenarioPair(startCapital, input.riesterContractValue),
    finalCapital: scenarioPair(savings.finalCapital, riester.finalCapital),
    totalContributions: scenarioPair(
      savings.totalContributions,
      riester.totalContributions,
    ),
    totalGrundzulage: scenarioPair(
      savings.totalGrundzulage,
      riester.totalGrundzulage,
    ),
    totalKinderzulage: scenarioPair(
      savings.totalKinderzulage,
      riester.totalKinderzulage,
    ),
    totalTaxSaving: scenarioPair(
      savings.totalTaxSaving,
      riester.totalTaxSaving,
    ),
    totalInflow: scenarioPair(totalInflow, riester.totalInflow),
    totalReturn: scenarioPair(
      savings.finalCapital - startCapital - totalInflow,
      riester.finalCapital - input.riesterContractValue - riester.totalInflow,
    ),
    firstPayoutYear: payoutYearResult(
      payout.firstYear,
      riester.payout.firstYear,
    ),
    regularPayoutYear: payoutYearResult(
      payout.recurringYear,
      riester.payout.recurringYear,
    ),
    payoutTotal: payoutYearResult(
      {
        grossPayout: payout.totalGross,
        tax: payout.totalTax,
        netPayout: payout.totalNet,
      },
      riester.payout.total,
    ),
    riesterReturnRate: {
      case: riester.returnRate.case,
      value: formatReturnRate(riester.returnRate.rate),
      derivedValue:
        riester.returnRate.derivedRate === null
          ? null
          : formatReturnRate(riester.returnRate.derivedRate),
    },
    verdict: calculateVerdict(input, {
      finalCapital: {
        avDepot: savings.finalCapital,
        riester: riester.finalCapital,
      },
      subsidies: {
        avDepot: totalInflow - savings.totalContributions,
        riester: riester.totalInflow - riester.totalContributions,
      },
      monthlyNetPayout: {
        avDepot: payout.recurringYear.netPayout / MONTHS_PER_YEAR,
        riester: riester.payout.recurringYear.netPayout / MONTHS_PER_YEAR,
      },
    }),
  }
}

interface ScenarioValues {
  avDepot: number
  riester: number
}

function calculateVerdict(
  input: CalculatorInput,
  values: {
    finalCapital: ScenarioValues
    subsidies: ScenarioValues
    monthlyNetPayout: ScenarioValues
  },
): Verdict {
  const capitalDifference =
    Math.round(values.finalCapital.avDepot) -
    Math.round(values.finalCapital.riester)
  const leader = capitalDifference >= 0 ? 'avDepot' : 'riester'
  const subsidyDifference = values.subsidies.avDepot - values.subsidies.riester
  const showSubsidyDifference =
    leader === 'avDepot' &&
    subsidyDifference > 0 &&
    subsidyDifference < Math.abs(capitalDifference)

  const monthlyPayoutDifference =
    Math.round(values.monthlyNetPayout.avDepot) -
    Math.round(values.monthlyNetPayout.riester)

  return {
    case: verdictCase(capitalDifference, monthlyPayoutDifference),
    leader,
    capitalDifference: `${leader === 'avDepot' ? '+' : '-'}${formatWholeEuros(Math.abs(capitalDifference))}`,
    subsidyDifference: showSubsidyDifference
      ? formatWholeEuros(Math.max(1, Math.round(subsidyDifference)))
      : null,
    monthlyPayout: {
      avDepot: formatWholeEuros(values.monthlyNetPayout.avDepot),
      riester: formatWholeEuros(values.monthlyNetPayout.riester),
    },
    survivalToPayoutEnd: survivalToAge(
      input.age,
      Math.min(input.payoutUntilAge, LIFE_TABLE_MAX_AGE),
    ),
  }
}

function formattedSurvival(fromAge: number, toAge: number) {
  const { female, male } = survivalProbability(fromAge, toAge)
  return {
    female: formatPercent(female * 100, 1),
    male: formatPercent(male * 100, 1),
  }
}

function survivalToAge(fromAge: number, toAge: number) {
  return { age: toAge, ...formattedSurvival(fromAge, toAge) }
}

function verdictCase(
  capitalDifference: number,
  monthlyPayoutDifference: number,
): VerdictCase {
  if (capitalDifference > 0 && monthlyPayoutDifference > 0) return 'avDepotWins'
  if (capitalDifference < 0 && monthlyPayoutDifference < 0) return 'riesterWins'
  return 'mixed'
}

function riesterMaxAnnualContribution(input: {
  age: number
  retirementAge: number
  currentYear: number
  childBirthYears: number[]
}) {
  let maxEligibleChildren = 0
  for (let year = 0; year < input.retirementAge - input.age; year++) {
    const calendarYear = input.currentYear + year
    const eligibleChildren = input.childBirthYears.filter((birthYear) => {
      const childAge = calendarYear - birthYear
      return childAge >= 0 && childAge < 18
    }).length
    maxEligibleChildren = Math.max(maxEligibleChildren, eligibleChildren)
  }
  return Math.max(
    RIESTER_MIN_OWN_CONTRIBUTION,
    RIESTER_MAX_SUBSIDIZED_CONTRIBUTION -
      RIESTER_GRUNDZULAGE -
      RIESTER_KINDERZULAGE * maxEligibleChildren,
  )
}

function calculateTransferredCapital(input: CalculatorInput) {
  const contractAge = input.currentYear - input.riesterContractStart
  const switchingCosts =
    contractAge < SWITCHING_COSTS_MAX_CONTRACT_AGE
      ? input.riesterSwitchingCosts
      : 0
  return Math.max(0, input.riesterContractValue - switchingCosts)
}

function calculateRiesterReturnRate(input: CalculatorInput): RiesterReturnRate {
  if (input.riesterReturnRate !== undefined)
    return { case: 'manual', rate: input.riesterReturnRate, derivedRate: null }

  const months = Math.round(
    (input.currentYear - 1 - input.riesterContractStart + 0.5) *
      MONTHS_PER_YEAR,
  )
  if (months < RIESTER_MIN_CONTRACT_MONTHS) return defaultReturnRate('tooShort')

  const paidIn = input.riesterTotalContributions + input.riesterTotalAllowances
  if (paidIn <= 0 || input.riesterContractValue <= 0)
    return defaultReturnRate('missingInputs')

  const monthlyRate = rate(
    months,
    -paidIn / months,
    0,
    input.riesterContractValue,
    1,
  )
  /* v8 ignore if -- @preserve: defensive, rate() converges for all valid inputs */
  if (!Number.isFinite(monthlyRate)) return defaultReturnRate('missingInputs')

  const derivedRate = roundReturnRate((1 + monthlyRate) ** MONTHS_PER_YEAR - 1)
  if (derivedRate > RIESTER_MAX_RETURN_RATE)
    return { case: 'tooHigh', rate: RIESTER_MAX_RETURN_RATE, derivedRate }
  if (derivedRate < RIESTER_MIN_RETURN_RATE)
    return { case: 'tooLow', rate: RIESTER_MIN_RETURN_RATE, derivedRate }
  return { case: 'derived', rate: derivedRate, derivedRate }
}

function defaultReturnRate(
  returnRateCase: 'missingInputs' | 'tooShort',
): RiesterReturnRate {
  return {
    case: returnRateCase,
    rate: RIESTER_DEFAULT_RETURN_RATE,
    derivedRate: null,
  }
}

function roundReturnRate(rate: number) {
  return Math.round(rate * 1000) / 1000 || 0
}

function formatReturnRate(rate: number) {
  return formatPercent(rate * 100, 1)
}

function formatWholeEuros(value: number) {
  return `${formatNumber(value, 0)}€`
}

function scenarioPair(avDepot: number, riester: number): ScenarioPair {
  return {
    avDepot: formatWholeEuros(avDepot),
    riester: formatWholeEuros(riester),
  }
}

function payoutYearResult(
  avDepot: PayoutYear,
  riester: PayoutYear,
): PayoutYearResult {
  return {
    gross: scenarioPair(avDepot.grossPayout, riester.grossPayout),
    tax: scenarioPair(avDepot.tax, riester.tax),
    net: scenarioPair(avDepot.netPayout, riester.netPayout),
  }
}

function simulateRiester(input: CalculatorInput) {
  const savingYears = input.retirementAge - input.age
  const returnRate = calculateRiesterReturnRate(input)
  const { germanIncomeTax } = avDepotUtils

  const years: SavingsYear[] = []
  let capital = input.riesterContractValue
  let totalContributions = 0
  let totalGrundzulage = 0
  let totalKinderzulage = 0
  let totalTaxSaving = 0
  let totalInflow = 0

  for (let year = 1; year <= savingYears; year++) {
    const contribution = input.riesterAnnualContribution
    const calendarYear = input.currentYear + year - 1
    const fullKinderzulage = input.childBirthYears.reduce((sum, birthYear) => {
      const childAge = calendarYear - birthYear
      return childAge >= 0 && childAge < 18 ? sum + RIESTER_KINDERZULAGE : sum
    }, 0)
    const minOwnContribution = Math.max(
      RIESTER_MIN_OWN_CONTRIBUTION,
      Math.min(
        RIESTER_MAX_SUBSIDIZED_CONTRIBUTION,
        RIESTER_MIN_CONTRIBUTION_INCOME_SHARE * input.zveSavingsPhase,
      ) -
        (RIESTER_GRUNDZULAGE + fullKinderzulage),
    )
    const reductionFactor = Math.min(1, contribution / minOwnContribution)
    const grundzulage = RIESTER_GRUNDZULAGE * reductionFactor
    const kinderzulage = fullKinderzulage * reductionFactor
    const allowances = grundzulage + kinderzulage
    const taxSaving = Math.max(
      0,
      germanIncomeTax(input.zveSavingsPhase) -
        germanIncomeTax(
          input.zveSavingsPhase -
            Math.min(
              contribution + allowances,
              RIESTER_MAX_SUBSIDIZED_CONTRIBUTION,
            ),
        ) -
        allowances,
    )
    const inflow = contribution + allowances + taxSaving
    const grossReturn = capital * returnRate.rate
    const capitalEnd = capital + grossReturn + inflow

    years.push({
      contribution: inflow,
      capitalStart: capital,
      grossReturn,
      capitalEnd,
    })
    capital = capitalEnd
    totalContributions += contribution
    totalGrundzulage += grundzulage
    totalKinderzulage += kinderzulage
    totalTaxSaving += taxSaving
    totalInflow += inflow
  }

  return {
    years,
    finalCapital: capital,
    totalContributions,
    totalGrundzulage,
    totalKinderzulage,
    totalTaxSaving,
    totalInflow,
    returnRate,
    payout: simulateRiesterPayout(input, capital),
  }
}

function simulateRiesterPayout(input: CalculatorInput, finalCapital: number) {
  const payoutYears = input.payoutUntilAge - input.retirementAge
  const lumpSum = finalCapital * input.oneTimePayout
  const annuity =
    ((finalCapital - lumpSum) / RIESTER_ANNUITY_BASE) *
    input.riesterAnnuityFactor *
    MONTHS_PER_YEAR

  function payoutYear(gross: number): PayoutYear {
    const tax = avDepotUtils.grenzsteuer(gross, input.zveRetirement)
    return { grossPayout: gross, tax, netPayout: gross - tax }
  }

  const firstYear = payoutYear(lumpSum + annuity)
  const recurringYear = payoutYear(annuity)
  const remainingYears = Math.max(0, payoutYears - 1)

  return {
    firstYear,
    recurringYear,
    total: {
      grossPayout:
        firstYear.grossPayout + recurringYear.grossPayout * remainingYears,
      tax: firstYear.tax + recurringYear.tax * remainingYears,
      netPayout: firstYear.netPayout + recurringYear.netPayout * remainingYears,
    },
  }
}
