import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts', // index.ts only includes exports
        'src/utils/Lohnsteuer', // Lohnsteuer files are automatically generated
      ],
      thresholds: {
        100: true, // enforce 100% coverage
      },
    },
  },
})
