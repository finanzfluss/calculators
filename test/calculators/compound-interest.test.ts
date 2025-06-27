import { describe, expect, it } from 'vitest'
import {
  calcCompoundInterest,
  COMPOUND_INTEREST_SCHEMA,
} from '../../src/calculators/compound-interest'

describe('calculators/compound-interest', () => {
  it('should return finalCapital, totalPayments and totalInterest on monthly interest base', async () => {
    const parsedQuery = COMPOUND_INTEREST_SCHEMA.parse({
      startCapital: 5000,
      monthlyPayment: 100,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'monthly',
    })

    const { finalCapital, totalPayments, totalInterest } =
      calcCompoundInterest(parsedQuery)
    expect({ finalCapital, totalPayments, totalInterest }).toMatchSnapshot()
  })

  it('should return finalCapital, totalPayments and totalInterest on monthly interest base without start capital', async () => {
    const parsedQuery = COMPOUND_INTEREST_SCHEMA.parse({
      startCapital: 0,
      monthlyPayment: 100,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'monthly',
    })

    const { finalCapital, totalPayments, totalInterest } =
      calcCompoundInterest(parsedQuery)
    expect({ finalCapital, totalPayments, totalInterest }).toMatchSnapshot()
  })

  it('should return finalCapital, totalPayments and totalInterest on quarterly interest base', async () => {
    const parsedQuery = COMPOUND_INTEREST_SCHEMA.parse({
      startCapital: 15000,
      monthlyPayment: 200,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'quarterly',
    })

    const { finalCapital, totalPayments, totalInterest } =
      calcCompoundInterest(parsedQuery)
    expect({ finalCapital, totalPayments, totalInterest }).toMatchSnapshot()
  })

  it('should return finalCapital, totalPayments and totalInterest on yearly interest base', async () => {
    const parsedQuery = COMPOUND_INTEREST_SCHEMA.parse({
      startCapital: 15000,
      monthlyPayment: 200,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'yearly',
    })

    const { finalCapital, totalPayments, totalInterest } =
      calcCompoundInterest(parsedQuery)
    expect({ finalCapital, totalPayments, totalInterest }).toMatchSnapshot()
  })
})
