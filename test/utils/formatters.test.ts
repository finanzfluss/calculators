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
      it('left-pads single-digit numbers with "0"', () => {
        expect(pad(1)).toBe('01')
      })
      it('leaves numbers >= 10 unchanged', () => {
        expect(pad(10)).toBe('10')
      })
    })

    describe('formatInput', () => {
      it('strips spaces and dots used as thousand separators', () => {
        expect(formatInput('123 4567.890')).toBe(1234567890)
      })
      it('strips repeated dot separators', () => {
        expect(formatInput('1.234.567.890')).toBe(1234567890)
      })
      it('strips repeated space separators', () => {
        expect(formatInput('1 234 567 890')).toBe(1234567890)
      })
      it('treats comma as the decimal separator', () => {
        expect(formatInput('123,456')).toBe(123.456)
      })
      it('round-trips through formatNumber for de-formatted strings', () => {
        const input = '1.234,56'
        expect(formatNumber(formatInput(input), 2)).toBe(input)
      })
    })

    describe('formatResult', () => {
      it('shows two decimals when |value| < 1000', () => {
        expect(formatResult(512.25)).toBe('512,25€')
      })
      it('pads whole numbers below 1000 with two decimals', () => {
        expect(formatResult(1)).toBe('1,00€')
      })
      it('omits decimals when |value| > 1000', () => {
        expect(formatResult(1234)).toBe('1.234€')
      })
      it('omits decimals when |value| equals 1000', () => {
        expect(formatResult(1000)).toBe('1.000€')
      })
      it('formats negative numbers with the leading minus sign', () => {
        expect(formatResult(-9.99)).toBe('-9,99€')
      })
      it('rounds half-up to the nearest euro for values >= 1000', () => {
        expect(formatResult(1234.56)).toBe('1.235€')
      })
      it('switches to exponential notation for whole values >= 1e21', () => {
        expect(formatResult(1 * 10 ** 21)).toBe('1×10²¹€')
      })
      it('keeps one decimal in the mantissa for fractional values >= 1e21', () => {
        expect(formatResult(1.2 * 10 ** 21)).toBe('1,2×10²¹€')
      })
      it('truncates the mantissa to one decimal for high-precision values >= 1e21', () => {
        expect(formatResult(1.299999e21)).toBe('1,2×10²¹€')
      })
      it('handles Dinero objects', () => {
        const dineroObj = dinero({ amount: 12345, currency: EUR })
        expect(formatResult(dineroObj)).toBe('123,45€')
      })
    })

    describe('formatResultWithTwoOptionalDecimals', () => {
      it('shows two decimals for fractional values', () => {
        expect(formatResultWithTwoOptionalDecimals(99.5)).toBe('99,50€')
      })
      it('omits decimals for whole numbers', () => {
        expect(formatResultWithTwoOptionalDecimals(99)).toBe('99€')
      })
      it('supports a custom suffix in place of "€"', () => {
        expect(formatResultWithTwoOptionalDecimals(99, ' EUR')).toBe('99 EUR')
      })
      it('switches to exponential notation for very large values', () => {
        expect(formatResultWithTwoOptionalDecimals(1.2 * 10 ** 21)).toBe(
          '1,2×10²¹€',
        )
      })
      it('formats Dinero amounts and respects optional decimals', () => {
        const dineroObj = dinero({ amount: 9900, currency: EUR })
        expect(formatResultWithTwoOptionalDecimals(dineroObj)).toBe('99€')

        const dineroWithFraction = dinero({ amount: 9950, currency: EUR })
        expect(formatResultWithTwoOptionalDecimals(dineroWithFraction)).toBe(
          '99,50€',
        )
      })
    })

    describe('formatPercent', () => {
      it('formats with three decimals by default and rounds half-up', () => {
        expect(formatPercent(12.4437)).toBe('12,444%')
      })
    })

    describe('formatNumber', () => {
      it('rounds half-up to a whole number when decimalCount = 0', () => {
        expect(formatNumber(12.66)).toBe('13')
      })
      it('rounds half-down to a whole number for fractions < 0.5', () => {
        expect(formatNumber(12.01)).toBe('12')
      })
      it('returns "1,55" for 1.555 due to floating-point representation', () => {
        expect(formatNumber(1.555, 2)).toBe('1,55')
      })
      it('rounds to the requested decimal count using locale separators', () => {
        expect(formatNumber(13.547, 2)).toBe('13,55')
      })
      it('switches to exponential notation for values >= 1e21', () => {
        expect(formatNumber(1e40)).toBe('1×10⁴⁰')
      })
      it('throws when decimalCount is negative', () => {
        expect(() => formatNumber(1, -2)).toThrowError()
      })
      it('throws for NaN and infinite values', () => {
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
      it('shows two decimals when |value| < 1000', () => {
        expect(formatResult(512.25)).toBe('512,25€')
      })
      it('uses narrow non-breaking space as thousand separator above 1000', () => {
        expect(formatResult(1234.46)).toBe('1 234€')
      })
      it('rounds half-up to the nearest euro for values >= 1000', () => {
        expect(formatResult(1234.56)).toBe('1 235€')
      })
    })
  })
})
