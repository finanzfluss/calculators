import type { Dinero } from 'dinero.js'
import { minimum, multiply, subtract } from 'dinero.js'
import { z } from 'zod'
import {
  AN_ANTEIL,
  BEITRAG_PFLEGEVERSICHERUNG,
  MINDESTBEDARF,
} from '../constants/disability-insurance'
import {
  dineroToNumber,
  formatResult,
  toDinero,
  toDineroMultiplier,
} from '../utils/'
import { defineCalculator } from '../utils/calculator'

const MAX_EURO = 10_000

const schema = z.object({
  grossIncome: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .transform(toDinero),
  netIncome: z.coerce.number().nonnegative().max(MAX_EURO).transform(toDinero),
  useCustomHalfDisabilityPension: z
    .enum(['0', '1'])
    .transform((value) => value === '1')
    .or(z.boolean())
    .optional()
    .default(false),
  customHalfDisabilityPension: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .transform(toDinero),
  numberOfChildren: z.coerce
    .number()
    .nonnegative()
    .int()
    .max(4)
    .optional()
    .default(0)
    .transform((number) => number as 0 | 1 | 2 | 3 | 4),
  useCustomPensionAmount: z
    .stringbool()
    .or(z.boolean())
    .optional()
    .default(false),
  customPensionAmount: z.coerce
    .number()
    .nonnegative()
    .max(MAX_EURO)
    .optional()
    .default(0),
})

type CalculatorInput = z.output<typeof schema>

export const disabilityInsurance = defineCalculator({
  schema,
  calculate,
})

function calculate(parsedInput: CalculatorInput) {
  return {
    tableData: calculateTableData(parsedInput),
    diagramData: calculateDiagramData(parsedInput),
  }
}

function calculateLevels(parsedInput: CalculatorInput) {
  const { grossIncome, netIncome } = parsedInput
  const halfDisabilityPension = getHalfDisabilityPension(parsedInput)

  return {
    level1: subtract(toDinero(MINDESTBEDARF), halfDisabilityPension),
    level2: subtract(
      multiply(netIncome, toDineroMultiplier(0.8)),
      halfDisabilityPension,
    ),
    level3: multiply(grossIncome, toDineroMultiplier(0.6)),
    levelCustom: parsedInput.useCustomPensionAmount
      ? toDinero(parsedInput.customPensionAmount)
      : undefined,
  }
}

function calculateTableData(parsedInput: CalculatorInput) {
  const { level1, level2, level3, levelCustom } = calculateLevels(parsedInput)

  return {
    level1: formatResult(level1),
    level2: formatResult(level2),
    level3: formatResult(level3),
    levelCustom:
      levelCustom !== undefined ? formatResult(levelCustom) : undefined,
  }
}

function getHalfDisabilityPension(parsedInput: CalculatorInput) {
  const {
    grossIncome,
    useCustomHalfDisabilityPension,
    customHalfDisabilityPension,
  } = parsedInput
  if (useCustomHalfDisabilityPension) {
    return customHalfDisabilityPension
  }
  return multiply(grossIncome, toDineroMultiplier(0.18))
}

function calculateDiagramData(parsedInput: CalculatorInput) {
  const { netIncome } = parsedInput
  const { level1, level2, level3, levelCustom } = calculateLevels(parsedInput)

  const coverage = calculateCoverageDuringIntervals(parsedInput)

  const coverageDuringInterval = [
    coverage.duringAtWorkInterval,
    coverage.duringIllnessInterval,
    coverage.duringProlongedIllnessInterval,
    coverage.duringDisabilityInterval,
  ]

  const toInt = (dineroObj: Dinero<number, 'EUR'>) =>
    Math.round(dineroToNumber(dineroObj))

  return {
    netIncome: toInt(netIncome),
    intervalCoverages: coverageDuringInterval.map((amount) => toInt(amount)),
    insuranceLevels: {
      level1: toInt(level1),
      level2: toInt(level2),
      level3: toInt(level3),
      levelCustom: levelCustom !== undefined ? toInt(levelCustom) : undefined,
    },
  }
}

function calculateCoverageDuringIntervals(parsedInput: CalculatorInput) {
  const { netIncome, grossIncome, numberOfChildren } = parsedInput

  const pflegeversicherung = BEITRAG_PFLEGEVERSICHERUNG[numberOfChildren]
  const krankengeld = minimum([
    multiply(grossIncome, toDineroMultiplier(0.7)),
    multiply(netIncome, toDineroMultiplier(0.9)),
  ])

  return {
    duringAtWorkInterval: netIncome,
    duringIllnessInterval: netIncome,
    duringProlongedIllnessInterval: multiply(
      krankengeld,
      toDineroMultiplier(
        1 -
          (AN_ANTEIL.RENTENVERSICHERUNG +
            AN_ANTEIL.ARBEITSLOSENVERSICHERUNG +
            pflegeversicherung -
            1.8) /
            100,
      ),
    ),
    duringDisabilityInterval: multiply(
      getHalfDisabilityPension(parsedInput),
      toDineroMultiplier(
        1 - (pflegeversicherung + AN_ANTEIL.KRANKENVERSICHERUNG) / 100,
      ),
    ),
  }
}
