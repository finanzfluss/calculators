import { z } from 'zod'
import { defineCalculator } from '../utils/calculator'
import { INCOME_TAX_CLASSES } from '../utils/Lohnsteuer'
import { BigDecimal } from '../utils/Lohnsteuer/shims/BigDecimal'

const schema = z.object({
  zve: z.coerce.number().min(0).max(10_000_000).transform(Math.floor),
  splitting: z.stringbool().or(z.boolean()),
  year: z
    .enum(['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'])
    .transform(Number),
})

type CalculatorInput = z.output<typeof schema>

export const incomeTax = defineCalculator({ schema, calculate })

/**
 * Step size (€) for the numerical marginal rate:
 *   marginalRate = (ESt(ZVE + MARGINAL_STEP) − ESt(ZVE)) / MARGINAL_STEP
 */
const MARGINAL_STEP = 100

function calculate({ zve, splitting, year }: CalculatorInput) {
  const kztab = splitting ? 2 : 1

  const { est, solzFrei } = computeEst(zve, kztab, year)
  const { est: estPlus } = computeEst(zve + MARGINAL_STEP, kztab, year)
  const soli = computeSoli(est, solzFrei)

  const totalAmount = floor2dp(est + soli)
  const marginalRate = round4dp((estPlus - est) / MARGINAL_STEP)
  const averageRateEst = zve === 0 ? 0 : round4dp(est / zve)
  const averageRateSoli = zve === 0 ? 0 : round4dp(soli / zve)
  const averageRateTotal = zve === 0 ? 0 : round4dp(totalAmount / zve)

  return {
    incomeTax: {
      amount: est,
      averageRate: averageRateEst,
      marginalRate,
    },
    solidaritySurcharge: {
      amount: soli,
      averageRate: averageRateSoli,
    },
    total: {
      amount: totalAmount,
      averageRate: averageRateTotal,
    },
  }
}

function computeEst(
  zve: number,
  kztab: number,
  year: number,
): { est: number; solzFrei: number } {
  const PAPClass = INCOME_TAX_CLASSES[year as keyof typeof INCOME_TAX_CLASSES]
  const pap = new PAPClass()
  pap.MPARA()
  pap.KZTAB = kztab
  pap.STKL = 1
  pap.ZVE = BigDecimal.valueOf(zve)
  pap.UPMLST()
  return { est: pap.ST.toNumber(), solzFrei: pap.SOLZFREI.toNumber() * kztab }
}

function computeSoli(est: number, solzFrei: number): number {
  if (est <= solzFrei) return 0
  const solzJ = floor2dp(est * 0.055)
  const solzMin = floor2dp((est - solzFrei) * 0.119)
  return Math.min(solzJ, solzMin)
}

function floor2dp(n: number): number {
  return Math.floor(n * 100) / 100
}

function round4dp(n: number): number {
  return Math.round(n * 10000) / 10000
}
