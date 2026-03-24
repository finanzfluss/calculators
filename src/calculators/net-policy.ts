import type { Dinero } from 'dinero.js'
import { add, maximum, multiply, subtract, transformScale } from 'dinero.js'
import { z } from 'zod'
import { CORRECTION_VALUES } from '../constants/net-policy'
import { defineCalculator } from '../utils/calculator'
import { formatInput, formatResult } from '../utils/formatters'
import {
  dineroToNumber,
  toDinero,
  toDineroMultiplier,
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
  taxAllowance: z.coerce.number().nonnegative().max(2_000).transform(toDinero),
  additionalIncome: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO * 100)
    .transform(toDinero),
  capitalGainsTax: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toPercentRate)
    .transform(toDineroMultiplier),

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
    .transform(toMonthly)
    .transform(toDineroMultiplier),
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
    .transform(toMonthly)
    .transform(toDineroMultiplier),
  expectedInterest: z.coerce
    .number()
    .nonnegative()
    .max(MAX_PERCENT)
    .transform(toMonthlyConformalRate)
    .transform(toDineroMultiplier),
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
    .transform(toPercentRate)
    .transform(toDineroMultiplier),
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
      const realizedGain = multiply(etfGain, reallocationRate)
      const taxableAmount = maximum([
        toDinero(0),
        subtract(multiply(realizedGain, partialExemption), taxAllowance),
      ])
      tax = multiply(taxableAmount, capitalGainsTax)
      etfGain = subtract(etfGain, realizedGain)
    }

    // for etf
    const etfCost = multiply(etfBalance, ter)
    const etfInterest = multiply(etfBalance, expectedInterest)
    etfGain = add(etfGain, etfInterest)
    etfGain = subtract(etfGain, etfCost)
    etfBalance = add(etfBalance, savingRate)
    etfBalance = subtract(etfBalance, tax)
    etfBalance = add(etfBalance, etfInterest)
    etfBalance = subtract(etfBalance, etfCost)
    if (month === 1) etfBalance = add(etfBalance, placementCommission)
    etfBalance = transformScale(etfBalance, 3)

    // for policy
    const policyInterest = multiply(policyBalance, expectedInterest)
    const policyBalanceCost = multiply(policyBalance, balanceCosts)
    let policyCostAdministration = add(
      multiply(policyBalance, ter),
      maximum([policyBalanceCost, minimumCosts]),
    )
    policyCostAdministration = add(policyCostAdministration, fixedCosts)
    const policyCostSaving = multiply(savingRate, savingRateCosts)
    policyBalance = add(policyBalance, savingRate)
    policyBalance = add(policyBalance, policyInterest)
    policyBalance = subtract(policyBalance, policyCostAdministration)
    policyBalance = subtract(policyBalance, policyCostSaving)
    policyBalance = transformScale(policyBalance, 3)
  }

  return { policyBalance, etfBalance, etfGain }
}

function calcTableData(
  policyGrossWorth: Dinero<number, 'EUR'>,
  etfGrossWorth: Dinero<number, 'EUR'>,
  etfGain: Dinero<number, 'EUR'>,
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

  const etfGross = maximum([
    toDinero(0),
    subtract(multiply(etfGain, partialExemption), taxAllowance),
  ])
  const totalSavings = multiply(savingRate, duration)
  const policyGain = subtract(policyGrossWorth, totalSavings)
  const appliesPolicy12YearRule = duration >= 12 * 12 // 12 years in months

  const policyGross = appliesPolicy12YearRule
    ? multiply(policyGain, toDineroMultiplier(0.85 / 2))
    : multiply(policyGain, toDineroMultiplier(0.85))

  const etfTax = multiply(etfGross, capitalGainsTax)
  const policyTaxableGross = subtract(policyGross, taxAllowance)
  const policyTax = appliesPolicy12YearRule
    ? toDinero(
        calcPolicyTax(
          dineroToNumber(policyGross),
          dineroToNumber(additionalIncome),
        ),
      )
    : multiply(policyTaxableGross, capitalGainsTax)

  return {
    grossWorth: {
      policy: formatResult(policyGrossWorth, ''),
      etf: formatResult(etfGrossWorth, ''),
    },
    totalPayments: {
      policy: formatResult(totalSavings, ''),
      etf: formatResult(add(totalSavings, placementCommission), ''),
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
      etf: formatResult(etfTax, ''),
    },
    netWorth: {
      policy: formatResult(subtract(policyGrossWorth, policyTax), ''),
      etf: formatResult(subtract(etfGrossWorth, etfTax), ''),
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
