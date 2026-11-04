import { afterEach, describe, expect, it, vi } from 'vitest'
import { riesterOrAvDepot } from '../../src/calculators/riester-or-av-depot'
import { parseCurrency } from '../../src/utils'

const BASE_INPUT = {
  age: 42,
  retirementAge: 67,
  zveSavingsPhase: 30_000,
  zveRetirement: 20_000,
  riesterAnnualContribution: 1_200,
  riesterContractValue: 18_500,
  riesterContractStart: 2012,
  riesterTotalContributions: 0,
  riesterTotalAllowances: 0,
  riesterAnnuityFactor: 32.5,
  riesterSwitchingCosts: 150,
  etfReturnRate: 6,
  avDepotCosts: 0.2,
  oneTimePayout: 0,
  payoutReturnRate: 3,
  payoutUntilAge: 85,
  childBirthYears: [],
  currentYear: 2027,
}

describe('/calculators/riester-or-av-depot', () => {
  it('calculates the AV-Depot scenario', () => {
    const result = riesterOrAvDepot.validateAndCalculate(BASE_INPUT)

    expect(result).toMatchSnapshot()
  })

  it('deducts switching costs for contracts younger than 5 years', () => {
    const result = riesterOrAvDepot.validateAndCalculate({
      ...BASE_INPUT,
      riesterContractStart: 2023,
    })

    expect(result.startCapital.avDepot).toBe('18.350€')
  })

  it('ignores switching costs for contracts aged 5 years or more', () => {
    const result = riesterOrAvDepot.validateAndCalculate({
      ...BASE_INPUT,
      riesterContractStart: 2022,
    })

    expect(result.startCapital.avDepot).toBe('18.500€')
  })

  it('grows only the transferred capital without contributions', () => {
    const result = riesterOrAvDepot.validateAndCalculate({
      ...BASE_INPUT,
      riesterAnnualContribution: 0,
    })

    expect(result.totalContributions.avDepot).toBe('0€')
    expect(result.totalGrundzulage.avDepot).toBe('0€')
    expect(result.finalCapital).toMatchInlineSnapshot(`
      {
        "avDepot": "75.738€",
        "riester": "28.197€",
      }
    `)
  })

  it('includes the tax saving in the total inflow', () => {
    const result = riesterOrAvDepot.validateAndCalculate({
      ...BASE_INPUT,
      childBirthYears: [2027],
      zveSavingsPhase: 80_000,
    })
    const own = parseCurrency(result.totalContributions.avDepot)
    const allowances =
      parseCurrency(result.totalGrundzulage.avDepot) +
      parseCurrency(result.totalKinderzulage.avDepot)
    const taxSaving = parseCurrency(result.totalTaxSaving.avDepot)

    expect(taxSaving).toBeGreaterThan(0)
    expect(parseCurrency(result.totalInflow.avDepot)).toBeCloseTo(
      own + allowances + taxSaving,
      0,
    )
  })

  it('derives the total return from final capital, start capital and inflow', () => {
    const result = riesterOrAvDepot.validateAndCalculate(BASE_INPUT)

    expect(
      parseCurrency(result.startCapital.avDepot) +
        parseCurrency(result.totalInflow.avDepot) +
        parseCurrency(result.totalReturn.avDepot),
    ).toBeCloseTo(parseCurrency(result.finalCapital.avDepot), -1)
  })

  it.each([
    {
      etfReturnRate: 6,
      riesterAnnuityFactor: 32.5,
      payoutUntilAge: 85,
      expected: { case: 'avDepotWins', leader: 'avDepot' },
    },
    {
      etfReturnRate: 1,
      riesterAnnuityFactor: 50,
      payoutUntilAge: 100,
      expected: { case: 'riesterWins', leader: 'riester' },
    },
    {
      etfReturnRate: 2,
      riesterAnnuityFactor: 50,
      payoutUntilAge: 100,
      expected: { case: 'mixed', leader: 'avDepot' },
    },
    {
      etfReturnRate: 1,
      riesterAnnuityFactor: 25,
      payoutUntilAge: 85,
      expected: { case: 'mixed', leader: 'riester' },
    },
    {
      etfReturnRate: 1.98,
      riesterAnnuityFactor: 50,
      payoutUntilAge: 90,
      expected: { case: 'mixed', leader: 'avDepot' },
    },
  ])(
    'decides the $expected.case case with $expected.leader leading in capital',
    ({ expected, ...input }) => {
      const { verdict } = riesterOrAvDepot.validateAndCalculate({
        ...BASE_INPUT,
        ...input,
      })

      expect({ case: verdict.case, leader: verdict.leader }).toEqual(expected)
    },
  )

  it('hides the subsidy difference and caps survival at the life table end', () => {
    const result = riesterOrAvDepot.validateAndCalculate({
      ...BASE_INPUT,
      etfReturnRate: 1,
      riesterAnnuityFactor: 50,
      payoutUntilAge: 120,
    })

    expect(result.verdict.leader).toBe('riester')
    expect(result.verdict.capitalDifference).toMatch(/^-/)
    expect(result.verdict.subsidyDifference).toBeNull()
    expect(result.verdict.survivalToPayoutEnd.age).toBe(100)
  })

  it('stops paying out Zulagen when the own contribution is zero', () => {
    const result = riesterOrAvDepot.validateAndCalculate({
      ...BASE_INPUT,
      riesterAnnualContribution: 0,
      childBirthYears: [2027],
    })

    expect(result.totalGrundzulage.riester).toBe('0€')
    expect(result.totalKinderzulage.riester).toBe('0€')
  })

  describe('riester return rate', () => {
    function calculate(input: Record<string, unknown>) {
      return riesterOrAvDepot.validateAndCalculate({ ...BASE_INPUT, ...input })
        .riesterReturnRate
    }

    it('derives the rate from contributions, allowances and contract value', () => {
      expect(
        calculate({
          riesterTotalContributions: 11_000,
          riesterTotalAllowances: 2_000,
        }),
      ).toEqual({ case: 'derived', value: '4,7%', derivedValue: '4,7%' })
    })

    it.each([
      { riesterTotalContributions: 0, riesterTotalAllowances: 0 },
      { riesterTotalContributions: 14_000, riesterContractValue: 0 },
    ])('falls back to 1.7 % when inputs are missing: %o', (input) => {
      expect(calculate(input)).toEqual({
        case: 'missingInputs',
        value: '1,7%',
        derivedValue: null,
      })
    })

    it('falls back to 1.7 % for contracts younger than one year', () => {
      expect(
        calculate({
          riesterContractStart: 2026,
          riesterTotalContributions: 100,
        }),
      ).toEqual({ case: 'tooShort', value: '1,7%', derivedValue: null })
      expect(
        calculate({
          riesterContractStart: 2025,
          riesterTotalContributions: 18_000,
        }),
      ).toEqual({ case: 'derived', value: '3,5%', derivedValue: '3,5%' })
    })

    it('treats a tiny negative rate as a derived 0 %', () => {
      expect(calculate({ riesterTotalContributions: 18_501 })).toEqual({
        case: 'derived',
        value: '0,0%',
        derivedValue: '0,0%',
      })
    })

    it('caps the rate at 10 %', () => {
      expect(calculate({ riesterTotalContributions: 5_000 })).toEqual({
        case: 'tooHigh',
        value: '10,0%',
        derivedValue: '16,5%',
      })
    })

    it('floors the rate at 0 % and grows the Riester capital accordingly', () => {
      const result = riesterOrAvDepot.validateAndCalculate({
        ...BASE_INPUT,
        riesterTotalContributions: 25_000,
        riesterAnnualContribution: 0,
      })

      expect(result.riesterReturnRate).toEqual({
        case: 'tooLow',
        value: '0,0%',
        derivedValue: '-4,3%',
      })
      expect(result.finalCapital.riester).toBe('18.500€')
    })

    it('uses a manual rate instead of deriving one', () => {
      expect(
        calculate({
          riesterReturnRate: 2.5,
          riesterTotalContributions: 11_000,
          riesterTotalAllowances: 2_000,
        }),
      ).toEqual({ case: 'manual', value: '2,5%', derivedValue: null })
    })

    it('derives the rate when the sums are omitted and no manual rate is given', () => {
      const {
        riesterTotalContributions: _,
        riesterTotalAllowances: __,
        ...input
      } = BASE_INPUT

      expect(
        riesterOrAvDepot.validateAndCalculate(input).riesterReturnRate,
      ).toEqual({ case: 'missingInputs', value: '1,7%', derivedValue: null })
    })
  })

  describe('riester contribution maximum', () => {
    function validate(input: Record<string, unknown>) {
      return () =>
        riesterOrAvDepot.validateAndCalculate({ ...BASE_INPUT, ...input })
    }

    it('allows up to 2,100 € minus the Grundzulage without children', () => {
      expect(validate({ riesterAnnualContribution: 1_925 })).not.toThrow()
      expect(validate({ riesterAnnualContribution: 1_926 })).toThrow()
    })

    it('subtracts the Kinderzulage of children under 18 at the same time', () => {
      const childBirthYears = [2020, 2025]

      expect(
        validate({ childBirthYears, riesterAnnualContribution: 1_325 }),
      ).not.toThrow()
      expect(
        validate({ childBirthYears, riesterAnnualContribution: 1_326 }),
      ).toThrow()
    })

    it('counts only children who are under 18 in the same saving year', () => {
      const childBirthYears = [2010, 2030]

      expect(
        validate({ childBirthYears, riesterAnnualContribution: 1_625 }),
      ).not.toThrow()
      expect(
        validate({ childBirthYears, riesterAnnualContribution: 1_626 }),
      ).toThrow()
    })

    it('counts children born later in the saving phase', () => {
      expect(
        validate({ childBirthYears: [2035], riesterAnnualContribution: 1_626 }),
      ).toThrow()
    })

    it('never drops below the minimum own contribution', () => {
      const childBirthYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

      expect(
        validate({ childBirthYears, riesterAnnualContribution: 60 }),
      ).not.toThrow()
      expect(
        validate({ childBirthYears, riesterAnnualContribution: 61 }),
      ).toThrow()
    })
  })

  describe('input normalization', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('treats omitted childBirthYears the same as an empty array', () => {
      const { childBirthYears: _, ...input } = BASE_INPUT

      expect(riesterOrAvDepot.validateAndCalculate(input)).toEqual(
        riesterOrAvDepot.validateAndCalculate(BASE_INPUT),
      )
    })

    it('normalizes a single childBirthYears value into an array', () => {
      expect(
        riesterOrAvDepot.validateAndCalculate({
          ...BASE_INPUT,
          childBirthYears: 2020,
        }),
      ).toEqual(
        riesterOrAvDepot.validateAndCalculate({
          ...BASE_INPUT,
          childBirthYears: [2020],
        }),
      )
    })

    it.each([
      { now: '2026-06-01', expectedYear: 2027 },
      { now: '2030-06-01', expectedYear: 2030 },
    ])(
      'defaults currentYear to $expectedYear at $now',
      ({ now, expectedYear }) => {
        vi.useFakeTimers({ now: new Date(now) })
        const { currentYear: _, ...input } = BASE_INPUT

        expect(riesterOrAvDepot.validateAndCalculate(input)).toEqual(
          riesterOrAvDepot.validateAndCalculate({
            ...input,
            currentYear: expectedYear,
          }),
        )
      },
    )
  })

  it('rejects contract starts after 2026', () => {
    expect(() =>
      riesterOrAvDepot.validateAndCalculate({
        ...BASE_INPUT,
        riesterContractStart: 2026,
      }),
    ).not.toThrow()
    expect(() =>
      riesterOrAvDepot.validateAndCalculate({
        ...BASE_INPUT,
        riesterContractStart: 2027,
      }),
    ).toThrow()
  })

  it('matches outputSchema', () => {
    const result = riesterOrAvDepot.validateAndCalculate(BASE_INPUT)
    expect(riesterOrAvDepot.outputSchema.parse(result)).toEqual(result)
  })
})
