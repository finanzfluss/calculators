import type { z } from 'zod'

export function defineCalculator<TInput, TOutput>(config: {
  schema: z.ZodSchema<TInput>
  calculate: (input: TInput) => TOutput
}) {
  return {
    ...config,
    validateAndCalculate: (rawInput: unknown): TOutput => {
      const parsed = config.schema.parse(rawInput)
      return config.calculate(parsed)
    },
  }
}
