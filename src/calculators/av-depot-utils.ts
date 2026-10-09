import { z } from 'zod'
import {
  ABGELTUNGSTEUERSATZ,
  AV_CONTRIBUTION_CAP,
  BASISERTRAG_FACTOR,
  INCOME_TAX_YEAR,
  TEILFREISTELLUNG,
} from '../constants/av-depot'
import { parseCurrency } from '../utils'
import { incomeTax } from './income-tax'

export const avDepotBaseSchema = z
  .object({
    age: z.coerce.number().int().min(18).max(67),
    retirementAge: z.coerce.number().int().min(65).max(70),
    zveSavingsPhase: z.coerce.number().min(0),
    zveRetirement: z.coerce.number().min(0),
    savingsRate: z.coerce.number().min(120).max(AV_CONTRIBUTION_CAP),
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

export interface SavingsYear {
  year: number
  contribution: number
  capitalStart: number
  grossReturn: number
  vorabpauschale: number
  vorabpauschaleTax: number
  capitalEnd: number
}

export interface PayoutYear {
  grossPayout: number
  tax: number
  netPayout: number
}

export function calculateDepotSavings(
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
    const vorabpauschale = Math.min(
      capitalStart * baseRateDecimal * BASISERTRAG_FACTOR,
      grossReturn,
    )
    const vorabpauschaleTax = günstigerprüfung(
      Math.max(0, vorabpauschale * TEILFREISTELLUNG - exemptionOrder),
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

export function grenzsteuer(amount: number, zve: number): number {
  return germanIncomeTax(zve + amount) - germanIncomeTax(zve)
}

export function günstigerprüfung(taxableGain: number, zve: number): number {
  const kapitalertragsteuer = taxableGain * ABGELTUNGSTEUERSATZ
  const grenzsteuerbetrag = grenzsteuer(taxableGain, zve)
  return Math.min(kapitalertragsteuer, grenzsteuerbetrag)
}

export function germanIncomeTax(zve: number): number {
  return parseCurrency(
    incomeTax.calculate({ zve, splitting: false, year: INCOME_TAX_YEAR }).total
      .amount,
  )
}
