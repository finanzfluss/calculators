import { z } from 'zod'
import { CORRECTION_VALUES } from '../constants/net-policy'
import { formatInput, formatNumber } from '../utils/formatters'
import {
  toMonthly,
  toMonthlyConformalRate,
  toPercentRate,
} from '../utils/validation'
import { calcGrossToNet } from './gross-to-net'

const MAX_EURO = 10_000
const MAX_PERCENT = 100

export const NET_POLICY_SCHEMA = z.object({
  // General inputs
  savingRate: z.number().nonnegative().max(MAX_EURO),
  duration: z
    .number()
    .positive()
    .int()
    .max(100)
    .transform((years) => years * 12),
  taxAllowance: z.number().nonnegative().max(MAX_EURO),
  additionalIncome: z
    .number()
    .nonnegative()
    .max(MAX_EURO * 100),
  personalTaxRate: z
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .optional()
    .default(0)
    .transform(toPercentRate),
  capitalGainsTax: z
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toPercentRate),

  // Policy inputs
  placementCommission: z.number().nonnegative().max(MAX_EURO),
  savingRateCosts: z
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .optional()
    .default(0)
    .transform(toPercentRate),
  balanceCosts: z
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .optional()
    .default(0)
    .transform(toPercentRate)
    .transform(toMonthly),
  fixedCosts: z
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .optional()
    .default(0)
    .transform(toMonthly),
  minimumCosts: z
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .optional()
    .default(0)
    .transform(toMonthly),

  // ETF inputs
  ter: z
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toPercentRate)
    .transform(toMonthly),
  expectedInterest: z
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toMonthlyConformalRate),
  partialExemption: z
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toPercentRate)
    .transform((rate) => 1 - rate),

  // Reallocation inputs
  reallocationOccurrence: z
    .number()
    .int()
    .max(100)
    .optional()
    .default(0)
    .transform((years) => years * 12),
  reallocationRate: z
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .optional()
    .default(0)
    .transform(toPercentRate),
})

type NetPolicyInput = z.output<typeof NET_POLICY_SCHEMA>

export function calcNetPolicy(parsedInput: NetPolicyInput) {
  const { policyBalance, etfBalance, etfGain } = simulateOverPeriod(parsedInput)

  return {
    tableData: calcTableData(policyBalance, etfBalance, etfGain, parsedInput),
  }
}

function simulateOverPeriod(parsedInput: NetPolicyInput) {
  const {
    duration,
    savingRate,
    placementCommission,
    balanceCosts,
    fixedCosts,
    minimumCosts,
    savingRateCosts,
    ter,
    expectedInterest,
    reallocationOccurrence,
    reallocationRate,
    taxAllowance,
    capitalGainsTax,
    partialExemption,
  } = parsedInput

  let policyBalance = 0
  let etfBalance = 0
  let etfGain = 0

  for (let month = 1; month <= duration; month++) {
    // reallocation
    let tax = 0
    if (reallocationOccurrence > 0 && month % reallocationOccurrence === 0) {
      const realizedGain = etfGain * reallocationRate
      tax =
        Math.max(0, realizedGain * partialExemption - taxAllowance) *
        capitalGainsTax
      etfGain -= realizedGain
    }

    // for etf
    const etfCost = etfBalance * ter
    const etfInterest = etfBalance * expectedInterest
    etfGain += etfInterest - etfCost
    etfBalance += savingRate - tax + etfInterest - etfCost
    if (month === 1) etfBalance += placementCommission

    // for policy
    const policyInterest = policyBalance * expectedInterest
    const policyCostAdministration =
      policyBalance * ter +
      Math.max(policyBalance * balanceCosts, minimumCosts) +
      fixedCosts
    const policyCostSaving = savingRate * savingRateCosts
    policyBalance +=
      savingRate + policyInterest - policyCostAdministration - policyCostSaving
  }

  return { policyBalance, etfBalance, etfGain }
}

function calcTableData(
  policyGrossWorth: number,
  etfGrossWorth: number,
  etfGain: number,
  parsedInput: NetPolicyInput,
) {
  const {
    duration,
    savingRate,
    placementCommission,
    taxAllowance,
    capitalGainsTax,
    partialExemption,
    additionalIncome,
  } = parsedInput

  const etfGross = Math.max(0, etfGain * partialExemption - taxAllowance)
  const policyGain = policyGrossWorth - savingRate * duration
  const appliesPolicy12YearRule = duration >= 12 * 12 // 12 years in months
  const policyGross = appliesPolicy12YearRule
    ? (policyGain * 0.85) / 2
    : policyGain * 0.85
  const policyTax = appliesPolicy12YearRule
    ? calcPolicyTax(policyGross, additionalIncome)
    : (policyGross - taxAllowance) * capitalGainsTax

  return {
    grossWorth: {
      policy: formatNumber(policyGrossWorth),
      etf: formatNumber(etfGrossWorth),
    },
    totalPayments: {
      policy: formatNumber(savingRate * duration),
      etf: formatNumber(savingRate * duration + placementCommission),
    },
    gain: {
      policy: formatNumber(policyGain),
      etf: formatNumber(etfGain),
    },
    gross: {
      policy: formatNumber(policyGross),
      etf: formatNumber(etfGross),
    },
    tax: {
      policy: formatNumber(policyTax),
      etf: formatNumber(etfGross * capitalGainsTax),
    },
    netWorth: {
      policy: formatNumber(policyGrossWorth - policyTax),
      etf: formatNumber(etfGrossWorth - etfGross * capitalGainsTax),
    },
  }
}

function calcPolicyTax(policyGross: number, additionalIncome: number) {
  const sharedQuery = {
    inputPeriod: 1,
    inputAccountingYear: 2025,
    inputTaxClass: 1,
    inputTaxAllowance: 0,
    inputChurchTax: 0,
    inputState: 'Hamburg',
    inputYearOfBirth: 1980,
    inputChildren: 0,
    inputChildTaxAllowance: 0,
    inputHealthInsurance: 1,
    inputAdditionalContribution: 0,
    inputPkvContribution: 0,
    inputEmployerSubsidy: 0,
    inputPensionInsurance: 1,
    inputLevyOne: 0,
    inputLevyTwo: 0,
    inputActivateLevy: 0,
  }
  const correction =
    CORRECTION_VALUES.werbungskostenpauschale +
    CORRECTION_VALUES.arbeitslosenversicherung *
      Math.min(policyGross, CORRECTION_VALUES.beitragsbemessungsgrenze)
  const taxesWithPolicy = calcGrossToNet({
    ...sharedQuery,
    inputGrossWage: policyGross + correction + additionalIncome,
  }).outputTotalTaxesYear.replace('€', '')

  const taxesWithoutPolicy = calcGrossToNet({
    ...sharedQuery,
    inputGrossWage: additionalIncome + correction,
  }).outputTotalTaxesYear.replace('€', '')

  return formatInput(taxesWithPolicy) - formatInput(taxesWithoutPolicy)
}
