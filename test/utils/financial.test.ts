import { describe, expect, it } from 'vitest'
import { formatPercent, formatResult } from '../../src/utils'
import { fv, nper, pmt, pv, rate, xirr } from '../../src/utils/financial'

describe('financial functions', () => {
  describe('pmt', () => {
    it('should return excel rmz/pmt', () => {
      const expectedResult = 602.95
      const calculation = pmt(0.03, 180, -20000, 0)
      expect(formatResult(calculation)).toBe(formatResult(expectedResult))
    })
    it('should return excel rmz/pmt type 1', () => {
      const expectedResult = 585.39
      const calculation = pmt(0.03, 180, -20000, 0, 1)
      expect(formatResult(calculation)).toBe(formatResult(expectedResult))
    })
  })

  describe('pv', () => {
    it('should return excel pv/bw', () => {
      const expectedResult = -3463.73
      const calculation = pv(0.03, 180, 100, 30000)
      expect(formatResult(calculation)).toBe(formatResult(expectedResult))
    })
    it('should return excel pv/bw type 1', () => {
      const expectedResult = -3563.24
      const calculation = pv(0.03, 180, 100, 30000, 1)
      expect(formatResult(calculation)).toBe(formatResult(expectedResult))
    })
  })

  describe('fv', () => {
    it('should return excel fv/zw', () => {
      const expectedResult = 21506.45
      const calculation = fv(0.03 / 12, 180, -150, 8000)
      expect(formatResult(calculation)).toBe(formatResult(expectedResult))
    })
    it('should return excel fv/zw type 1', () => {
      const expectedResult = 21591.56
      const calculation = fv(0.03 / 12, 180, -150, 8000, 1)
      expect(formatResult(calculation)).toBe(formatResult(expectedResult))
    })
  })

  describe('nper', () => {
    it('should return excel nper/zzr', () => {
      const expectedResult = 179.8
      const calculation = nper(3 / 12 / 100, -150, 0, 34000)
      expect(formatResult(calculation)).toBe(formatResult(expectedResult))
    })
    it('should return excel nper/zzr type 1', () => {
      const expectedResult = 179.44
      const calculation = nper(3 / 12 / 100, -150, 0, 34000, 1)
      expect(formatResult(calculation)).toBe(formatResult(expectedResult))
    })
  })

  describe('rate', () => {
    it('should return excel rate/zins', () => {
      const expectedResult = 14.167
      const calculation = rate(15, 1800, 0, -80000) * 100
      expect(formatPercent(calculation)).toBe(formatPercent(expectedResult))
    })
    it('should return excel rate/zins type 1', () => {
      const expectedResult = 12.697
      const calculation = rate(15, 1800, 0, -80000, 1) * 100
      expect(formatPercent(calculation)).toBe(formatPercent(expectedResult))
    })
    it('should return excel rate/zins with 0 payment', () => {
      const expectedResult = 58.489
      const calculation = rate(15, 0, -1000, 1000000, 1) * 100
      expect(formatPercent(calculation)).toBe(formatPercent(expectedResult))
    })
  })

  describe('xirr', () => {
    it('should return correct excel xirr/xintzinsfuss', () => {
      const values = [-10000, 2750, 4250, 3250, 2750]
      const dates = [
        new Date('2008-01-01'),
        new Date('2008-03-01'),
        new Date('2008-10-30'),
        new Date('2009-02-15'),
        new Date('2009-04-01'),
      ]
      const expectedResult = 0.373362535
      const calculation = xirr(values, dates)
      expect(formatPercent(calculation)).toBe(formatPercent(expectedResult))
    })
  })
})
