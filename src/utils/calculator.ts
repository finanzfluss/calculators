import type { z } from 'zod'

export function defineCalculator<Schema extends z.ZodObject, Output>(config: {
  schema: Schema
  calculate: (input: z.output<Schema>) => Output
}) {
  return {
    ...config,
    validateAndCalculate: (rawInput: unknown): Output => {
      const parsed = config.schema.parse(rawInput)
      return config.calculate(parsed)
    },
  }
}
