import Dinero from 'dinero.js'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  formatInput,
  formatNumber,
  formatPercent,
  formatResult,
  formatResultWithTwoOptionalDecimals,
  pad,
} from '../../src/utils/formatters'
import { setLocale } from '../../src/utils/i18n'

describe('formatting methods', () => {
  describe('de', () => {
    beforeAll(() => {
      setLocale('de')
    })

    describe('pad', () => {
      it('should pad numbers < 10', () => {
        expect(pad(1)).toBe('01')
      })
      it('should not pad numbers >= 10', () => {
        expect(pad(10)).toBe('10')
      })
    })

    describe('formatInput', () => {
      it('should remove dots and spaces', () => {
        expect(formatInput('123 4567.890')).toBe(1234567890)
      })
      it('should remove multiple dots', () => {
        expect(formatInput('1.234.567.890')).toBe(1234567890)
      })
      it('should remove multiple spaces', () => {
        expect(formatInput('1 234 567 890')).toBe(1234567890)
      })
      it('should replace commata with dot', () => {
        expect(formatInput('123,456')).toBe(123.456)
      })
      it('should be inverse of formatNumber()', () => {
        const input = '1.234,56'
        expect(formatNumber(formatInput(input), 2)).toBe(input)
      })
    })

    describe('formatResult', () => {
      it('should return decimal value if under 1000', () => {
        expect(formatResult(512.25)).toBe('512,25€')
      })
      it('should append decimal value if under 1000', () => {
        expect(formatResult(1)).toBe('1,00€')
      })
      it('should return no decimal value if above 1000', () => {
        expect(formatResult(1234)).toBe('1.234€')
      })
      it('should return no decimal value if equal 1000', () => {
        expect(formatResult(1000)).toBe('1.000€')
      })
      it('should format negative numbers', () => {
        expect(formatResult(-9.99)).toBe('-9,99€')
      })
      it('should round up', () => {
        expect(formatResult(1234.56)).toBe('1.235€')
      })
      it('should return pow format for large numbers', () => {
        expect(formatResult(1 * 10 ** 21)).toBe('1×10²¹€')
      })
      it('should return pow format with decimal for large numbers', () => {
        expect(formatResult(1.2 * 10 ** 21)).toBe('1,2×10²¹€')
      })
      it('should return pow format with cropped decimal for large numbers', () => {
        expect(formatResult(1.299999e21)).toBe('1,2×10²¹€')
      })
      it('should handle Dinero objects', () => {
        const dinero = Dinero({ amount: 12345, currency: 'EUR' })
        expect(formatResult(dinero)).toBe('123,45€')
      })
    })

    describe('formatResultWithTwoOptionalDecimals', () => {
      it('should show decimals when number has fractional part', () => {
        expect(formatResultWithTwoOptionalDecimals(99.5)).toBe('99,50€')
      })
      it('should not show decimals for whole numbers', () => {
        expect(formatResultWithTwoOptionalDecimals(99)).toBe('99€')
      })
      it('should support custom suffix', () => {
        expect(formatResultWithTwoOptionalDecimals(99, ' EUR')).toBe('99 EUR')
      })
      it('should handle exponential numbers', () => {
        expect(formatResultWithTwoOptionalDecimals(1.2 * 10 ** 21)).toBe(
          '1,2×10²¹€',
        )
      })
      it('should handle Dinero objects', () => {
        const dinero = Dinero({ amount: 9900, currency: 'EUR' })
        expect(formatResultWithTwoOptionalDecimals(dinero)).toBe('99€')

        const dineroWithFraction = Dinero({ amount: 9950, currency: 'EUR' })
        expect(formatResultWithTwoOptionalDecimals(dineroWithFraction)).toBe(
          '99,50€',
        )
      })
    })

    describe('formatPercent', () => {
      it('should round up', () => {
        expect(formatPercent(12.4437)).toBe('12,444%')
      })
      it('should round down', () => {
        expect(formatNumber(12.01)).toBe('12')
      })
      it('should round trunc', () => {
        expect(formatNumber(1.555, 2)).toBe('1,55')
      })
      it('should set correct decimal points and naming', () => {
        expect(formatNumber(13.547, 2)).toBe('13,55')
      })
      it('should return pow format for large numbers', () => {
        expect(formatNumber(1e40)).toBe('1×10⁴⁰')
      })
      it('should throw error for negative precision', () => {
        expect(() => formatNumber(1, -2)).toThrowError()
      })
    })

    describe('formatNumber', () => {
      it('should return % value and round', () => {
        expect(formatNumber(12.66)).toBe('13')
      })
      it('should set correct decimal points and naming', () => {
        expect(formatNumber(13.547, 2)).toBe('13,55')
      })
      it('should throw error for non-finite values', () => {
        expect(() => formatNumber(Number.NaN)).toThrowError(
          'NaN is not a valid number',
        )
        expect(() => formatNumber(Number.POSITIVE_INFINITY)).toThrowError(
          'Infinity is not a valid number',
        )
        expect(() => formatNumber(Number.NEGATIVE_INFINITY)).toThrowError(
          '-Infinity is not a valid number',
        )
      })
    })
  })

  describe('fr', () => {
    beforeAll(() => {
      setLocale('fr')
    })

    describe('formatResult', () => {
      it('should return decimal value if under 1000', () => {
        expect(formatResult(512.25)).toBe('512,25€')
      })
      it('should return no decimal value above 1000', () => {
        expect(formatResult(1234.46)).toBe('1 234€')
      })
      it('should round up', () => {
        expect(formatResult(1234.56)).toBe('1 235€')
      })
    })
  })
})
