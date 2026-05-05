import { describe, expect, it } from 'vitest'
import { compoundInterest } from '../../src/calculators/compound-interest'

describe('calculators/compound-interest', () => {
  it('compounds monthly with start capital', () => {
    const result = compoundInterest.validateAndCalculate({
      startCapital: 5000,
      monthlyPayment: 100,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'monthly',
    })

    const { finalCapital, totalPayments, totalInterest } = result
    expect({ finalCapital, totalPayments, totalInterest }).toMatchSnapshot()
  })

  it('compounds monthly without start capital', () => {
    const result = compoundInterest.validateAndCalculate({
      startCapital: 0,
      monthlyPayment: 100,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'monthly',
    })

    const { finalCapital, totalPayments, totalInterest } = result
    expect({ finalCapital, totalPayments, totalInterest }).toMatchSnapshot()
  })

  it('compounds quarterly with start capital', () => {
    const result = compoundInterest.validateAndCalculate({
      startCapital: 15000,
      monthlyPayment: 200,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'quarterly',
    })

    const { finalCapital, totalPayments, totalInterest } = result
    expect({ finalCapital, totalPayments, totalInterest }).toMatchSnapshot()
  })

  it('compounds yearly with start capital', () => {
    const result = compoundInterest.validateAndCalculate({
      startCapital: 15000,
      monthlyPayment: 200,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'yearly',
    })

    const { finalCapital, totalPayments, totalInterest } = result
    expect({ finalCapital, totalPayments, totalInterest }).toMatchSnapshot()
  })

  it('exposes per-year diagram data alongside the totals', () => {
    const result = compoundInterest.validateAndCalculate({
      startCapital: 5000,
      monthlyPayment: 100,
      durationYears: 10,
      yearlyInterest: 5,
      type: 'monthly',
    })

    const { diagramData } = result
    expect(diagramData).toMatchSnapshot()
  })
})
