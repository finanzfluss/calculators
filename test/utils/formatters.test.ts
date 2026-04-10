import { dinero, EUR } from 'dinero.js'
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
      it('pads numbers < 10', () => {
        expect(pad(1)).toBe('01')
      })
      it('does not pad numbers >= 10', () => {
        expect(pad(10)).toBe('10')
      })
    })

    describe('formatInput', () => {
      it('removes dots and spaces', () => {
        expect(formatInput('123 4567.890')).toBe(1234567890)
      })
      it('removes multiple dots', () => {
        expect(formatInput('1.234.567.890')).toBe(1234567890)
      })
      it('removes multiple spaces', () => {
        expect(formatInput('1 234 567 890')).toBe(1234567890)
      })
      it('replaces commata with dot', () => {
        expect(formatInput('123,456')).toBe(123.456)
      })
      it('is inverse of formatNumber()', () => {
        const input = '1.234,56'
        expect(formatNumber(formatInput(input), 2)).toBe(input)
      })
    })

    describe('formatResult', () => {
      it('returns decimal value if under 1000', () => {
        expect(formatResult(512.25)).toBe('512,25€')
      })
      it('appends decimal value if under 1000', () => {
        expect(formatResult(1)).toBe('1,00€')
      })
      it('returns no decimal value if above 1000', () => {
        expect(formatResult(1234)).toBe('1.234€')
      })
      it('returns no decimal value if equal 1000', () => {
        expect(formatResult(1000)).toBe('1.000€')
      })
      it('formats negative numbers', () => {
        expect(formatResult(-9.99)).toBe('-9,99€')
      })
      it('rounds up', () => {
        expect(formatResult(1234.56)).toBe('1.235€')
      })
      it('returns pow format for large numbers', () => {
        expect(formatResult(1 * 10 ** 21)).toBe('1×10²¹€')
      })
      it('returns pow format with decimal for large numbers', () => {
        expect(formatResult(1.2 * 10 ** 21)).toBe('1,2×10²¹€')
      })
      it('returns pow format with cropped decimal for large numbers', () => {
        expect(formatResult(1.299999e21)).toBe('1,2×10²¹€')
      })
      it('handles Dinero objects', () => {
        const dineroObj = dinero({ amount: 12345, currency: EUR })
        expect(formatResult(dineroObj)).toBe('123,45€')
      })
    })

    describe('formatResultWithTwoOptionalDecimals', () => {
      it('shows decimals when number has fractional part', () => {
        expect(formatResultWithTwoOptionalDecimals(99.5)).toBe('99,50€')
      })
      it('does not show decimals for whole numbers', () => {
        expect(formatResultWithTwoOptionalDecimals(99)).toBe('99€')
      })
      it('supports custom suffix', () => {
        expect(formatResultWithTwoOptionalDecimals(99, ' EUR')).toBe('99 EUR')
      })
      it('handles exponential numbers', () => {
        expect(formatResultWithTwoOptionalDecimals(1.2 * 10 ** 21)).toBe(
          '1,2×10²¹€',
        )
      })
      it('handles Dinero objects', () => {
        const dineroObj = dinero({ amount: 9900, currency: EUR })
        expect(formatResultWithTwoOptionalDecimals(dineroObj)).toBe('99€')

        const dineroWithFraction = dinero({ amount: 9950, currency: EUR })
        expect(formatResultWithTwoOptionalDecimals(dineroWithFraction)).toBe(
          '99,50€',
        )
      })
    })

    describe('formatPercent', () => {
      it('rounds up', () => {
        expect(formatPercent(12.4437)).toBe('12,444%')
      })
    })

    describe('formatNumber', () => {
      it('rounds to whole number', () => {
        expect(formatNumber(12.66)).toBe('13')
      })
      it('rounds down', () => {
        expect(formatNumber(12.01)).toBe('12')
      })
      it('rounds trunc', () => {
        expect(formatNumber(1.555, 2)).toBe('1,55')
      })
      it('sets correct decimal points and naming', () => {
        expect(formatNumber(13.547, 2)).toBe('13,55')
      })
      it('returns pow format for large numbers', () => {
        expect(formatNumber(1e40)).toBe('1×10⁴⁰')
      })
      it('throws error for negative precision', () => {
        expect(() => formatNumber(1, -2)).toThrowError()
      })
      it('throws error for non-finite values', () => {
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
      it('returns decimal value if under 1000', () => {
        expect(formatResult(512.25)).toBe('512,25€')
      })
      it('returns no decimal value above 1000', () => {
        expect(formatResult(1234.46)).toBe('1 234€')
      })
      it('rounds up', () => {
        expect(formatResult(1234.56)).toBe('1 235€')
      })
    })
  })
})
