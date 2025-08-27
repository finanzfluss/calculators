export function annualToMonthly(annualValue: number) {
  return annualValue / 12
}

export function percentToDecimal(percentValue: number) {
  return percentValue / 100
}

export function annualToMonthlyConformalRate(annualRate: number) {
  return (1 + annualRate / 100) ** (1 / 12) - 1
}
