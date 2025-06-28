import type { z } from 'zod'

export function defineCalculator<
  TSchema extends z.ZodRawShape,
  TOutput,
>(config: {
  schema: z.ZodObject<TSchema>
  calculate: (input: z.output<z.ZodObject<TSchema>>) => TOutput
}) {
  return {
    ...config,
    validateAndCalculate: (rawInput: unknown): TOutput => {
      const parsed = config.schema.parse(rawInput)
      return config.calculate(parsed)
    },
  }
}
