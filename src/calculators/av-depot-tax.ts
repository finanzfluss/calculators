import {
  BASIS_YIELD_FACTOR,
  TAXABLE_EQUITY_FUND_FRACTION,
} from '../constants/av-depot'

export interface FundLot {
  value: number
  basis: number
  grossVorabpauschale: number
}

export interface TaxableDepotState {
  lots: FundLot[]
  pendingTaxableVorabpauschale: number
  taxableLossCarry: number
}

export function createTaxableDepot(): TaxableDepotState {
  return {
    lots: [],
    pendingTaxableVorabpauschale: 0,
    taxableLossCarry: 0,
  }
}

export function cloneTaxableDepot(state: TaxableDepotState): TaxableDepotState {
  return {
    lots: state.lots.map((lot) => ({ ...lot })),
    pendingTaxableVorabpauschale: state.pendingTaxableVorabpauschale,
    taxableLossCarry: state.taxableLossCarry,
  }
}

export function getTaxableDepotValue(state: TaxableDepotState): number {
  return state.lots.reduce((sum, lot) => sum + lot.value, 0)
}

export function addFundLot(
  state: TaxableDepotState,
  contribution: number,
): void {
  if (contribution <= 0) return
  state.lots.push({
    value: contribution,
    basis: contribution,
    grossVorabpauschale: 0,
  })
}

export function growTaxableDepot(
  state: TaxableDepotState,
  returnRate: number,
): number {
  const capitalStart = getTaxableDepotValue(state)
  for (const lot of state.lots) lot.value *= 1 + returnRate
  return capitalStart * returnRate
}

export function calculateGrossVorabpauschale(
  capitalStart: number,
  grossReturn: number,
  baseRate: number,
): number {
  const basisYield = capitalStart * baseRate * BASIS_YIELD_FACTOR
  return Math.min(basisYield, Math.max(0, grossReturn))
}

export function assessVorabpauschale(
  state: TaxableDepotState,
  capitalStart: number,
  grossReturn: number,
  baseRate: number,
): number {
  const grossVorabpauschale = calculateGrossVorabpauschale(
    capitalStart,
    grossReturn,
    baseRate,
  )
  const capitalEnd = getTaxableDepotValue(state)

  if (grossVorabpauschale > 0 && capitalEnd > 0) {
    for (const lot of state.lots) {
      lot.grossVorabpauschale += grossVorabpauschale * (lot.value / capitalEnd)
    }
  }

  return grossVorabpauschale
}

export function calculateTaxableFundSaleGain(
  grossCapitalGain: number,
  grossVorabpauschale: number,
): number {
  return (grossCapitalGain - grossVorabpauschale) * TAXABLE_EQUITY_FUND_FRACTION
}

export function sellFundLots(
  state: TaxableDepotState,
  requestedProceeds: number,
): { proceeds: number; taxableGain: number } {
  let amountLeft = Math.min(requestedProceeds, getTaxableDepotValue(state))
  let proceeds = 0
  let grossCapitalGain = 0
  let grossVorabpauschale = 0

  while (amountLeft > 1e-9 && state.lots.length > 0) {
    const lot = state.lots[0]!
    const soldValue = Math.min(amountLeft, lot.value)
    const soldFraction = soldValue / lot.value

    proceeds += soldValue
    grossCapitalGain += soldValue - lot.basis * soldFraction
    grossVorabpauschale += lot.grossVorabpauschale * soldFraction

    if (soldFraction >= 1 - 1e-12) {
      state.lots.shift()
    } else {
      lot.value -= soldValue
      lot.basis *= 1 - soldFraction
      lot.grossVorabpauschale *= 1 - soldFraction
    }

    amountLeft -= soldValue
  }

  return {
    proceeds,
    taxableGain: calculateTaxableFundSaleGain(
      grossCapitalGain,
      grossVorabpauschale,
    ),
  }
}
