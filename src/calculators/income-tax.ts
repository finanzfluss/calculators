import { z } from 'zod'
import { defineCalculator } from '../utils/calculator'
import {
  formatPercent,
  formatResultWithTwoOptionalDecimals,
} from '../utils/formatters'
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

  const total = est + soli
  const marginalRate = (estPlus - est) / MARGINAL_STEP
  const formatRate = (ratio: number) => formatPercent(ratio * 100, 2)
  const averageRate = (n: number) => formatRate(zve === 0 ? 0 : n / zve)

  return {
    incomeTax: {
      amount: formatResultWithTwoOptionalDecimals(est),
      averageRate: averageRate(est),
      marginalRate: formatRate(marginalRate),
    },
    solidaritySurcharge: {
      amount: formatResultWithTwoOptionalDecimals(soli),
      averageRate: averageRate(soli),
    },
    total: {
      amount: formatResultWithTwoOptionalDecimals(total),
      averageRate: averageRate(total),
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
  const floor2dp = (n: number) => Math.floor(n * 100) / 100
  const solzJ = floor2dp(est * 0.055)
  const solzMin = floor2dp((est - solzFrei) * 0.119)
  return Math.min(solzJ, solzMin)
}
