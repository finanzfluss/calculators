import Dinero from 'dinero.js'
import { z } from 'zod'
import { CORRECTION_VALUES } from '../constants/net-policy'
import { defineCalculator } from '../utils/calculator'
import { formatInput, formatResult } from '../utils/formatters'
import {
  toDinero,
  toMonthly,
  toMonthlyConformalRate,
  toPercentRate,
} from '../utils/validation'
import { grossToNet } from './gross-to-net'

const MAX_EURO = 10_000
const MAX_PERCENT = 100

const schema = z.object({
  // General inputs
  savingRate: z.coerce.number().nonnegative().max(MAX_EURO).transform(toDinero),
  duration: z.coerce
    .number()
    .positive()
    .int()
    .max(100)
    .transform((years) => years * 12),
  taxAllowance: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .transform(toDinero),
  additionalIncome: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO * 100)
    .transform(toDinero),
  capitalGainsTax: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toPercentRate),

  // Policy inputs
  placementCommission: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .transform(toDinero),
  savingRateCosts: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .optional()
    .default(0)
    .transform(toPercentRate),
  balanceCosts: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .optional()
    .default(0)
    .transform(toPercentRate)
    .transform(toMonthly),
  fixedCosts: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .optional()
    .default(0)
    .transform(toMonthly)
    .transform(toDinero),
  minimumCosts: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .optional()
    .default(0)
    .transform(toMonthly)
    .transform(toDinero),

  // ETF inputs
  ter: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toPercentRate)
    .transform(toMonthly),
  expectedInterest: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toMonthlyConformalRate),
  partialExemption: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toPercentRate)
    .transform((rate) => 1 - rate),

  // Reallocation inputs
  reallocationOccurrence: z.coerce
    .number()
    .int()
    .max(100)
    .optional()
    .default(0)
    .transform((years) => years * 12),
  reallocationRate: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .optional()
    .default(0)
    .transform(toPercentRate),
})

type CalculatorInput = z.output<typeof schema>

export const netPolicy = defineCalculator({
  schema,
  calculate,
})

function calculate(parsedInput: CalculatorInput) {
  const { policyBalance, etfBalance, etfGain } = simulateOverPeriod(parsedInput)

  return {
    tableData: calcTableData(policyBalance, etfBalance, etfGain, parsedInput),
  }
}

function simulateOverPeriod(parsedInput: CalculatorInput) {
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

  let policyBalance = toDinero(0)
  let etfBalance = toDinero(0)
  let etfGain = toDinero(0)

  for (let month = 1; month <= duration; month++) {
    // reallocation
    let tax = toDinero(0)
    if (reallocationOccurrence > 0 && month % reallocationOccurrence === 0) {
      const realizedGain = etfGain.multiply(reallocationRate)
      const taxableAmount = Dinero.maximum([
        toDinero(0),
        realizedGain.multiply(partialExemption).subtract(taxAllowance),
      ])
      tax = taxableAmount.multiply(capitalGainsTax)
      etfGain = etfGain.subtract(realizedGain)
    }

    // for etf
    const etfCost = etfBalance.multiply(ter)
    const etfInterest = etfBalance.multiply(expectedInterest)
    etfGain = etfGain.add(etfInterest).subtract(etfCost)
    etfBalance = etfBalance
      .add(savingRate)
      .subtract(tax)
      .add(etfInterest)
      .subtract(etfCost)
    if (month === 1) etfBalance = etfBalance.add(placementCommission)

    // for policy
    const policyInterest = policyBalance.multiply(expectedInterest)
    const policyBalanceCost = policyBalance.multiply(balanceCosts)
    const policyCostAdministration = policyBalance
      .multiply(ter)
      .add(Dinero.maximum([policyBalanceCost, minimumCosts]))
      .add(fixedCosts)
    const policyCostSaving = savingRate.multiply(savingRateCosts)
    policyBalance = policyBalance
      .add(savingRate)
      .add(policyInterest)
      .subtract(policyCostAdministration)
      .subtract(policyCostSaving)
  }

  return { policyBalance, etfBalance, etfGain }
}

function calcTableData(
  policyGrossWorth: Dinero.Dinero,
  etfGrossWorth: Dinero.Dinero,
  etfGain: Dinero.Dinero,
  parsedInput: CalculatorInput,
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

  const etfGross = Dinero.maximum([
    toDinero(0),
    etfGain.multiply(partialExemption).subtract(taxAllowance),
  ])
  const totalSavings = savingRate.multiply(duration)
  const policyGain = policyGrossWorth.subtract(totalSavings)
  const appliesPolicy12YearRule = duration >= 12 * 12 // 12 years in months

  const policyGross = appliesPolicy12YearRule
    ? policyGain.multiply(0.85 / 2)
    : policyGain.multiply(0.85)

  const policyTax = appliesPolicy12YearRule
    ? toDinero(calcPolicyTax(policyGross.toUnit(), additionalIncome.toUnit()))
    : policyGross.subtract(taxAllowance).multiply(capitalGainsTax)

  return {
    grossWorth: {
      policy: formatResult(policyGrossWorth, ''),
      etf: formatResult(etfGrossWorth, ''),
    },
    totalPayments: {
      policy: formatResult(totalSavings, ''),
      etf: formatResult(totalSavings.add(placementCommission), ''),
    },
    gain: {
      policy: formatResult(policyGain, ''),
      etf: formatResult(etfGain, ''),
    },
    gross: {
      policy: formatResult(policyGross, ''),
      etf: formatResult(etfGross, ''),
    },
    tax: {
      policy: formatResult(policyTax, ''),
      etf: formatResult(etfGross.multiply(capitalGainsTax), ''),
    },
    netWorth: {
      policy: formatResult(policyGrossWorth.subtract(policyTax), ''),
      etf: formatResult(
        etfGrossWorth.subtract(etfGross.multiply(capitalGainsTax)),
        '',
      ),
    },
  }
}

function calcPolicyTax(policyGross: number, additionalIncome: number) {
  const sharedInput = {
    inputPeriod: 1,
    inputAccountingYear: '2025',
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
  const taxesWithPolicy = grossToNet
    .validateAndCalculate({
      ...sharedInput,
      inputGrossWage: policyGross + correction + additionalIncome,
    })
    .outputTotalTaxesYear.replace('€', '')

  const taxesWithoutPolicy = grossToNet
    .validateAndCalculate({
      ...sharedInput,
      inputGrossWage: additionalIncome + correction,
    })
    .outputTotalTaxesYear.replace('€', '')

  return formatInput(taxesWithPolicy) - formatInput(taxesWithoutPolicy)
}
