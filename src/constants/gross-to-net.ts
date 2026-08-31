export interface CareInsuranceContributionRate {
  /** Employer contribution rate */
  AN: number
  /** Employee contribution rate */
  AG: number
}

/**
 * Index is based on the amount of children
 * @example
 * CARE_INSURANCE_CONTRIBUTION_RATES[0] // Rates for zero children
 */
export const CARE_INSURANCE_CONTRIBUTION_RATES: CareInsuranceContributionRate[] =
  [
    { AN: 1.8, AG: 1.8 }, // no childrens, additional 0.6 pct added when hasExtraCiContribution
    { AN: 1.8, AG: 1.8 }, // 1 children
    { AN: 1.55, AG: 1.8 }, // 2 children
    { AN: 1.3, AG: 1.8 }, // 3 children
    { AN: 1.05, AG: 1.8 }, // 4 children
    { AN: 0.8, AG: 1.8 }, // 5 children
  ]

/**
 * Index is based on the amount of children
 * @example
 * CARE_INSURANCE_CONTRIBUTION_RATES_SAXONY[0] // Rates for zero children
 */
export const CARE_INSURANCE_CONTRIBUTION_RATES_SAXONY: CareInsuranceContributionRate[] =
  [
    { AN: 2.3, AG: 1.3 }, // no children, additional 0.6 pct added when hasExtraCiContribution
    { AN: 2.3, AG: 1.3 }, // 1 children
    { AN: 2.05, AG: 1.3 }, // 2 children
    { AN: 1.8, AG: 1.3 }, // 3 children
    { AN: 1.55, AG: 1.3 }, // 4 children
    { AN: 1.3, AG: 1.3 }, // 5 children
  ]
export const PRIVATE_CARE_INSURANCE_EMPLOYER_RATES: Record<
  number,
  { default: number; saxony: number }
> = {
  2019: { default: 1.525, saxony: 1.025 },
  2020: { default: 1.525, saxony: 1.025 },
  2021: { default: 1.525, saxony: 1.025 },
  2022: { default: 1.525, saxony: 1.025 },
  2023: { default: 1.525, saxony: 1.025 },
  2024: { default: 1.7, saxony: 1.2 },
  2025: { default: 1.8, saxony: 1.3 },
  2026: { default: 1.8, saxony: 1.3 },
}
