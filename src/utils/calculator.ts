import type { z } from 'zod'

export function defineCalculator<
  TSchema extends z.ZodTypeAny,
  TOutput,
>(config: {
  schema: TSchema
  calculate: (input: z.output<TSchema>) => TOutput
}) {
  return {
    ...config,
    validateAndCalculate: (rawInput: unknown): TOutput => {
      const parsed = config.schema.parse(rawInput)
      return config.calculate(parsed)
    },
  }
}
