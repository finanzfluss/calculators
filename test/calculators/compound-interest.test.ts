import { describe, expect, it } from 'vitest'
import {
  calcCompoundInterest,
  COMPOUND_INTEREST_QUERY_SCHEMA,
} from '../../src/calculators/compound-interest'
import { stringifyValues } from '../utils'

describe('calculators/compound-interest', () => {
  it('should return finalCapital, totalPayments and totalInterest on monthly interest base', async () => {
    const parsedQuery = COMPOUND_INTEREST_QUERY_SCHEMA.parse(
      stringifyValues({
        startCapital: '5000',
        monthlyPayment: '100',
        durationYears: '10',
        yearlyInterest: '5',
        type: 'monthly',
        isTest: 'true',
      }),
    )

    const data = calcCompoundInterest(parsedQuery)
    expect(data).toMatchSnapshot()
  })

  it('should return finalCapital, totalPayments and totalInterest on monthly interest base without start capital', async () => {
    const parsedQuery = COMPOUND_INTEREST_QUERY_SCHEMA.parse(
      stringifyValues({
        startCapital: '0',
        monthlyPayment: '100',
        durationYears: '10',
        yearlyInterest: '5',
        type: 'monthly',
        isTest: 'true',
      }),
    )

    const data = calcCompoundInterest(parsedQuery)
    expect(data).toMatchSnapshot()
  })

  it('should return finalCapital, totalPayments and totalInterest on quarterly interest base', async () => {
    const parsedQuery = COMPOUND_INTEREST_QUERY_SCHEMA.parse(
      stringifyValues({
        startCapital: '15000',
        monthlyPayment: '200',
        durationYears: '10',
        yearlyInterest: '5',
        type: 'quarterly',
        isTest: 'true',
      }),
    )

    const data = calcCompoundInterest(parsedQuery)
    expect(data).toMatchSnapshot()
  })

  it('should return finalCapital, totalPayments and totalInterest on yearly interest base', async () => {
    const parsedQuery = COMPOUND_INTEREST_QUERY_SCHEMA.parse(
      stringifyValues({
        startCapital: '15000',
        monthlyPayment: '200',
        durationYears: '10',
        yearlyInterest: '5',
        type: 'yearly',
        isTest: 'true',
      }),
    )

    const data = calcCompoundInterest(parsedQuery)
    expect(data).toMatchSnapshot()
  })
})
