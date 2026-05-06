import { describe, expect, it } from 'vitest'
import { savings } from '../../src/calculators/savings'

describe('/calculators/savings', () => {
  describe('endValue', () => {
    it('computes endValue for yearly saving / yearly interest with tax and 30% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'endValue',
        startValue: '5000',
        yearlyInterest: '1.5',
        yearlyDuration: '10',
        saveIntervalType: 'yearly',
        interestIntervalType: 'yearly',
        savingRate: '1800',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '30',
      })

      expect(data).toMatchSnapshot()
    })
    it('computes endValue for monthly saving / monthly interest with tax and 15% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'endValue',
        startValue: '5000',
        yearlyInterest: '1.5',
        yearlyDuration: '10',
        saveIntervalType: 'monthly',
        interestIntervalType: 'monthly',
        savingRate: '150',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '15',
      })
      expect(data).toMatchSnapshot()
    })
    it('computes endValue for monthly saving / yearly interest without tax', async () => {
      const data = savings.validateAndCalculate({
        output: 'endValue',
        startValue: '5000',
        yearlyInterest: '1.5',
        yearlyDuration: '10',
        saveIntervalType: 'monthly',
        interestIntervalType: 'yearly',
        savingRate: '150',
        considerCapitalGainsTax: 'false',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '15',
      })
      expect(data).toMatchSnapshot()
    })
    it('computes endValue for monthly saving / monthly interest with no start capital', async () => {
      const data = savings.validateAndCalculate({
        output: 'endValue',
        startValue: '0',
        yearlyInterest: '5',
        yearlyDuration: '10',
        saveIntervalType: 'monthly',
        interestIntervalType: 'monthly',
        savingRate: '100',
        considerCapitalGainsTax: 'false',
        capitalGainsTax: '0',
        distributionType: 'distributing',
        partialExemption: '0',
      })
      expect(data).toMatchSnapshot()
    })
  })

  describe('startValue', () => {
    it('computes startValue for yearly saving / yearly interest without tax', async () => {
      const data = savings.validateAndCalculate({
        output: 'startValue',
        endValue: '20000',
        yearlyInterest: '3',
        yearlyDuration: '7',
        saveIntervalType: 'yearly',
        interestIntervalType: 'yearly',
        savingRate: '1800',
        considerCapitalGainsTax: 'false',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '15',
      })
      expect(data).toMatchSnapshot()
    })
    it('computes startValue for monthly saving / monthly interest with tax and 30% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'startValue',
        endValue: '20000',
        yearlyInterest: '3',
        yearlyDuration: '7',
        saveIntervalType: 'monthly',
        interestIntervalType: 'monthly',
        savingRate: '150',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '30',
      })
      expect(data).toMatchSnapshot()
    })
    it('computes startValue for monthly saving / yearly interest with tax and no exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'startValue',
        endValue: '20000',
        yearlyInterest: '3',
        yearlyDuration: '7',
        saveIntervalType: 'monthly',
        interestIntervalType: 'yearly',
        savingRate: '150',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '0',
      })
      expect(data).toMatchSnapshot()
    })
  })

  describe('yearlyInterest', () => {
    it('solves for yearlyInterest given yearly saving / yearly interest with tax and 15% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'yearlyInterest',
        endValue: '30000',
        startValue: '5000',
        yearlyDuration: '10',
        saveIntervalType: 'yearly',
        interestIntervalType: 'yearly',
        savingRate: '1800',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '15',
      })
      expect(data).toMatchSnapshot()
    })
    it('solves for yearlyInterest given monthly saving / monthly interest with tax and 30% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'yearlyInterest',
        endValue: '30000',
        startValue: '5000',
        yearlyDuration: '10',
        saveIntervalType: 'monthly',
        interestIntervalType: 'monthly',
        savingRate: '150',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '30',
      })
      expect(data).toMatchSnapshot()
    })
    it('solves for yearlyInterest given monthly saving / yearly interest without tax', async () => {
      const data = savings.validateAndCalculate({
        output: 'yearlyInterest',
        endValue: '30000',
        startValue: '5000',
        yearlyDuration: '10',
        saveIntervalType: 'monthly',
        interestIntervalType: 'yearly',
        savingRate: '150',
        considerCapitalGainsTax: 'false',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '0',
      })
      expect(data).toMatchSnapshot()
    })
  })

  describe('monthlyDuration', () => {
    it('solves for monthlyDuration given yearly saving / yearly interest with tax and 30% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'monthlyDuration',
        yearlyInterest: '3',
        startValue: '5000',
        endValue: '20000',
        saveIntervalType: 'yearly',
        interestIntervalType: 'yearly',
        savingRate: '1800',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '30',
      })
      expect(data).toMatchSnapshot()
    })
    it('solves for monthlyDuration given monthly saving / monthly interest without tax', async () => {
      const data = savings.validateAndCalculate({
        output: 'monthlyDuration',
        yearlyInterest: '3',
        startValue: '5000',
        endValue: '20000',
        saveIntervalType: 'monthly',
        interestIntervalType: 'monthly',
        savingRate: '150',
        considerCapitalGainsTax: 'false',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '0',
      })
      expect(data).toMatchSnapshot()
    })
    it('solves for monthlyDuration given monthly saving / yearly interest with tax and 30% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'monthlyDuration',
        yearlyInterest: '3',
        startValue: '5000',
        endValue: '20000',
        saveIntervalType: 'monthly',
        interestIntervalType: 'yearly',
        savingRate: '150',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '30',
      })
      expect(data).toMatchSnapshot()
    })
  })

  describe('savingRate', () => {
    it('solves for savingRate given yearly saving / yearly interest without tax', async () => {
      const data = savings.validateAndCalculate({
        output: 'savingRate',
        startValue: '5000',
        yearlyInterest: '1.5',
        yearlyDuration: '7',
        saveIntervalType: 'yearly',
        interestIntervalType: 'yearly',
        endValue: '10000',
        considerCapitalGainsTax: 'false',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '0',
      })
      expect(data).toMatchSnapshot()
    })
    it('solves for savingRate given monthly saving / monthly interest with tax and 30% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'savingRate',
        startValue: '5000',
        yearlyInterest: '1.5',
        yearlyDuration: '7',
        saveIntervalType: 'monthly',
        interestIntervalType: 'monthly',
        endValue: '10000',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '30',
      })
      expect(data).toMatchSnapshot()
    })
    it('solves for savingRate given monthly saving / yearly interest with tax and 15% exemption', async () => {
      const data = savings.validateAndCalculate({
        output: 'savingRate',
        startValue: '5000',
        yearlyInterest: '1.5',
        yearlyDuration: '7',
        saveIntervalType: 'monthly',
        interestIntervalType: 'yearly',
        endValue: '10000',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'distributing',
        partialExemption: '15',
      })
      expect(data).toMatchSnapshot()
    })
    it('solves for savingRate with accumulating distribution and capital gains tax', async () => {
      const data = savings.validateAndCalculate({
        output: 'savingRate',
        startValue: '5000',
        yearlyInterest: '1.5',
        yearlyDuration: '7',
        saveIntervalType: 'yearly',
        interestIntervalType: 'yearly',
        endValue: '10000',
        considerCapitalGainsTax: 'true',
        capitalGainsTax: '26.375',
        distributionType: 'accumulating',
        partialExemption: '15',
      })
      expect(data).toMatchSnapshot()
    })
  })
})
