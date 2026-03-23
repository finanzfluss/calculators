import { describe, expect, it } from 'vitest'
import { dinero, EUR } from 'dinero.js'
import { dineroToNumber } from '../../src/utils/validation'

function eur(cents: number) {
  return dinero({ amount: cents, currency: EUR })
}

describe('dineroToNumber', () => {
  it('converts a whole-euro amount', () => {
    expect(dineroToNumber(eur(10000))).toBe(100)
  })

  it('converts an amount with cents', () => {
    expect(dineroToNumber(eur(10050))).toBe(100.5)
  })

  it('converts zero', () => {
    expect(dineroToNumber(eur(0))).toBe(0)
  })

  it('converts a negative amount', () => {
    expect(dineroToNumber(eur(-500))).toBe(-5)
  })
})
