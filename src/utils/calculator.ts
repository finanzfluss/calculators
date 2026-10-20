import type { z } from 'zod'

export function defineCalculator<
  InputShape extends z.core.$ZodShape,
  OutputSchema extends z.ZodType,
>(config: {
  inputSchema: z.ZodObject<InputShape>
  outputSchema: OutputSchema
  calculate: (input: z.output<z.ZodObject<InputShape>>) => z.input<OutputSchema>
}) {
  return {
    ...config,
    validateAndCalculate: (rawInput: unknown): z.input<OutputSchema> => {
      const parsed = config.inputSchema.parse(rawInput)
      return config.calculate(parsed)
    },
  }
}
