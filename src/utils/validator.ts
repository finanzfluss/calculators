import { z } from 'zod'

export class Validator {
  static number(value: number) {
    return new NumberValidator(value)
  }
}

export const validate = Validator

export class NumberValidator<T> {
  protected value: T

  constructor(value: T) {
    this.value = value
  }

  greaterThan(limit: number) {
    return this.#parse(z.number().gt(limit))
  }

  lessThan(limit: number) {
    return this.#parse(z.number().lt(limit))
  }

  between(min: number, max: number) {
    return this.#parse(z.number().min(min).max(max))
  }

  get not() {
    return new NotNumberValidator(this.value)
  }

  #parse(schema: z.ZodNumber) {
    const parsed = schema.safeParse(this.value)

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? 'Invalid number')
    }

    return parsed.data
  }
}

export class NotNumberValidator<T> extends NumberValidator<T> {
  zero() {
    if (this.value !== 0) return

    throw new Error('Value must not be zero')
  }
}

export function toMonthly(valuePerYear: number) {
  return valuePerYear / 12
}

export function toPercentRate(value: number) {
  return value / 100
}

export function toMonthlyConformalRate(valuePerYear: number) {
  return (1 + valuePerYear / 100) ** (1 / 12) - 1
}
