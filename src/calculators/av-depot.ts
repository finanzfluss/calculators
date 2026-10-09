import type { z } from 'zod'
import type { PayoutYear } from './av-depot-utils'
import { TEILFREISTELLUNG } from '../constants/av-depot'
import { formatCurrencyAdaptive, pmt } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { avDepotSimulator } from './av-depot-simulator'
import {
  avDepotBaseSchema,
  calculateDepotSavings,
  günstigerprüfung,
} from './av-depot-utils'

const schema = avDepotBaseSchema

type CalculatorInput = z.output<typeof schema>

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

  const { savings: avDepotSavings, payout: avDepotPayout } =
    avDepotSimulator.calculate({
      ...input,
      startCapital: 0,
      includeStarterBonus: true,
    })

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
