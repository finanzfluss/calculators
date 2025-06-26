import { describe, expect, it } from 'vitest'
import {
  NumberValidator,
  toMonthly,
  toMonthlyConformalRate,
  toPercentRate,
  validate,
  Validator,
} from '../../src/utils/validator'

describe('validator instance', () => {
  it('should be a Validator instance', () => {
    expect(new Validator()).toBeInstanceOf(Validator)
  })

  it('should be a NumberValidator instance when number is passed', () => {
    expect(new NumberValidator(1)).toBeInstanceOf(NumberValidator)
  })

  it('should be a NumberValidator instance for static number method', () => {
    expect(validate.number(1)).toBeInstanceOf(NumberValidator)
  })
})

describe('validate number inputs', () => {
  describe('greaterThan', () => {
    it('should accept for 2 > 1', () => {
      expect(validate.number(2).greaterThan(1)).toBe(2)
    })
    it('should throw for 1 > 2', () => {
      expect(() => validate.number(1).greaterThan(2)).toThrow(
        'Number must be greater than 2',
      )
    })
  })

  describe('lessThan', () => {
    it('should accept for 1 < 2 ', () => {
      expect(validate.number(1).lessThan(2)).toBe(1)
    })
    it('should throw for 2 < 1', () => {
      expect(() => validate.number(2).lessThan(1)).toThrow(
        'Number must be less than 1',
      )
    })
    it('should throw for 2 < 2', () => {
      expect(() => validate.number(2).lessThan(2)).toThrow(
        'Number must be less than 2',
      )
    })
  })

  describe('between', () => {
    it('should accept for 0 < 1 < 2', () => {
      expect(validate.number(1).between(0, 2)).toBe(1)
    })
    it('should accept for 1 < 1 < 1', () => {
      expect(validate.number(1).between(1, 1)).toBe(1)
    })
    it('should throw for 2 < 1 < 4', () => {
      expect(() => validate.number(1).between(2, 4)).toThrow(
        'Number must be greater than or equal to 2',
      )
    })
    it('should throw for 0 < 1 < 0', () => {
      expect(() => validate.number(1).between(0, 0)).toThrow(
        'Number must be less than or equal to 0',
      )
    })
  })

  describe('not.zero', () => {
    it('should accept for value not equal to 0', () => {
      expect(() => validate.number(1).not.zero()).not.toThrow()
    })

    it('should throw for value equal to 0', () => {
      expect(() => validate.number(0).not.zero()).toThrow(
        'Value must not be zero',
      )
    })

    it('should accept for negative value', () => {
      expect(() => validate.number(-1).not.zero()).not.toThrow()
    })
  })
})

describe('toMonthly', () => {
  it('should convert yearly to monthly', () => {
    expect(toMonthly(12)).toBe(1)
    expect(toMonthly(120)).toBe(10)
    expect(toMonthly(0)).toBe(0)
  })
})

describe('toPercentRate', () => {
  it('should convert percent to rate', () => {
    expect(toPercentRate(50)).toBe(0.5)
    expect(toPercentRate(0)).toBe(0)
    expect(toPercentRate(-50)).toBe(-0.5)
  })
})

describe('toMonthlyConformalRate', () => {
  it('should convert yearly percent to monthly conformal rate', () => {
    expect(toMonthlyConformalRate(0)).toBe(0)
    expect(toMonthlyConformalRate(12.68)).toBeCloseTo(0.01, 5)
    expect(toMonthlyConformalRate(213.84)).toBeCloseTo(0.1, 5)
  })
})
