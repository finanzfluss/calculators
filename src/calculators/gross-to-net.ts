import { z } from 'zod'
import {
  CARE_INSURANCE_CONTRIBUTION_RATES,
  CARE_INSURANCE_CONTRIBUTION_RATES_SAXONY,
} from '../constants/gross-to-net'
import { PENSION_VALUES } from '../constants/pension'
import { formatPercent, formatResultWithTwoOptionalDecimals } from '../utils'
import { defineCalculator } from '../utils/calculator'
import { INCOME_TAX_CLASSES } from '../utils/Lohnsteuer'
import { BigDecimal } from '../utils/Lohnsteuer/shims/BigDecimal'

const schema = z.object({
  output: z.literal('grossToNetCalc').optional(),
  inputAccountingYear: z
    .enum(['2019', '2020', '2021', '2022', '2023', '2024', '2025'])
    .transform(Number), // YEAR
  inputTaxClass: z.coerce.number(), // STKL
  inputTaxAllowance: z.coerce.number(), // LZZFREIB
  inputChurchTax: z.coerce.number(), // R
  inputState: z.string(),
  inputYearOfBirth: z.coerce.number(),
  inputChildren: z.coerce.number().default(0),
  inputChildTaxAllowance: z.coerce.number(), // ZKF
  inputPkvContribution: z.coerce.number(),
  inputEmployerSubsidy: z.coerce.number(),
  inputPensionInsurance: z.coerce.number(), // KRV
  inputLevyOne: z.coerce.number(),
  inputLevyTwo: z.coerce.number(),
  inputActivateLevy: z.coerce.number(),
  inputHealthInsurance: z.coerce.number(), // PKV
  inputAdditionalContribution: z.coerce.number(), // KVZ
  inputGrossWage: z.coerce
    .number()
    .min(-(10 ** 9))
    .max(10 ** 9), // RE4
  inputPeriod: z.coerce.number(), // LZZ
})

type CalculatorInput = z.output<typeof schema>

export const grossToNet = defineCalculator({
  schema,
  calculate,
})

function calculate({
  inputAccountingYear,
  inputTaxClass,
  inputTaxAllowance,
  inputChurchTax,
  inputState,
  inputYearOfBirth,
  inputChildren,
  inputChildTaxAllowance,
  inputPkvContribution,
  inputEmployerSubsidy,
  inputPensionInsurance,
  inputLevyOne,
  inputLevyTwo,
  inputActivateLevy,
  inputHealthInsurance,
  inputAdditionalContribution,
  inputGrossWage,
  inputPeriod,
}: CalculatorInput) {
  const { PENSION_LIMIT_WEST, PENSION_LIMIT_EAST } = PENSION_VALUES

  const ZERO = new BigDecimal(0)
  const ZAHL2 = new BigDecimal(2)
  const ZAHL12 = new BigDecimal(12)
  const ZAHL100 = new BigDecimal(100)
  const ZAHL450 = new BigDecimal(450)

  const ZAHL54450 = BigDecimal.valueOf(54450)
  const ZAHL56250 = BigDecimal.valueOf(56250)
  const ZAHL58050 = BigDecimal.valueOf(58050)
  const ZAHL59850 = BigDecimal.valueOf(59850)
  const ZAHL62100 = BigDecimal.valueOf(62100)
  const ZAHL66150 = BigDecimal.valueOf(66150)

  const SOCIAL_THRESHOLDS: Record<string, BigDecimal> = {
    2019: ZAHL54450,
    2020: ZAHL56250,
    2021: ZAHL58050,
    2022: ZAHL58050,
    2023: ZAHL59850,
    2024: ZAHL62100,
    2025: ZAHL66150,
  }

  const GROSS_WAGE =
    inputPeriod === 1
      ? new BigDecimal(inputGrossWage)
      : new BigDecimal(inputGrossWage).multiply(ZAHL12)

  const STATE_IS_OST = isNewFederalState(inputState)

  const SOCIAL_INSURANCE_THRESHOLD_KEY =
    Object.keys(SOCIAL_THRESHOLDS).find(
      (key) => key === inputAccountingYear.toString(),
    ) ?? Object.keys(SOCIAL_THRESHOLDS).at(-1)!

  // Krankenversicherung
  const HI_INCOME_THRESHOLD = SOCIAL_THRESHOLDS[SOCIAL_INSURANCE_THRESHOLD_KEY]

  let inputContributionRate = ZERO

  if (inputHealthInsurance === 0) {
    inputContributionRate = new BigDecimal(14.6)
  } else if (inputHealthInsurance === -1) {
    inputContributionRate = new BigDecimal(14)
    inputAdditionalContribution = 0
    inputHealthInsurance = 0
  } else if (inputHealthInsurance === 1) {
    inputAdditionalContribution = 0
  }

  const HI_TOTAL_PERCENTAGE = inputContributionRate.add(
    new BigDecimal(inputAdditionalContribution),
  )
  const HI_GROSS_WAGE_THRESHOLD =
    GROSS_WAGE.comparedTo(HI_INCOME_THRESHOLD!) === 1
      ? HI_INCOME_THRESHOLD
      : GROSS_WAGE
  const HI_ADDITIONAL_CONTRIBUTION_PROPOTION = new BigDecimal(
    inputAdditionalContribution,
  ).divide(ZAHL2, 50, BigDecimal.ROUND_HALF_DOWN)
  const HI_CONTRIBUTION_PROPOTION = inputContributionRate.divide(
    ZAHL2,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  )
  const HI_CONTRIBUTION_AMOUNT_PROPOTION =
    HI_ADDITIONAL_CONTRIBUTION_PROPOTION.add(HI_CONTRIBUTION_PROPOTION)
      .divide(ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)
      .multiply(HI_GROSS_WAGE_THRESHOLD!)

  let healthInsurance = ZERO
  let noCareInsurance = false
  let privateHealthInsurance = ZERO

  if (inputHealthInsurance === 0) {
    // Gesetzliche Krankenversicherung
    healthInsurance = HI_CONTRIBUTION_AMOUNT_PROPOTION
  } else if (inputHealthInsurance === 1) {
    // Private Krankenversicherung
    inputAdditionalContribution = 0

    noCareInsurance = true
    healthInsurance = new BigDecimal(inputPkvContribution).multiply(ZAHL12)
    if (inputEmployerSubsidy === 1) {
      let maxEmployerGrant =
        inputAccountingYear === 2019
          ? new BigDecimal(351.66)
          : new BigDecimal(367.97)
      maxEmployerGrant = maxEmployerGrant.multiply(ZAHL12)

      healthInsurance = healthInsurance.divide(
        ZAHL2,
        50,
        BigDecimal.ROUND_HALF_DOWN,
      )
      if (healthInsurance.comparedTo(maxEmployerGrant) === 1) {
        privateHealthInsurance = maxEmployerGrant
        healthInsurance = healthInsurance.add(
          healthInsurance.subtract(maxEmployerGrant),
        )
      } else {
        privateHealthInsurance = healthInsurance
      }
    }
  }

  if (GROSS_WAGE.comparedTo(ZAHL450.multiply(ZAHL12))! < 1) {
    healthInsurance = ZERO
  }

  // Pflegeversicherung
  const CI_INCOME_THRESHOLD = SOCIAL_THRESHOLDS[SOCIAL_INSURANCE_THRESHOLD_KEY]
  const CI_GROSS_WAGE_THRESHOLD =
    GROSS_WAGE.comparedTo(CI_INCOME_THRESHOLD!) === 1
      ? CI_INCOME_THRESHOLD
      : GROSS_WAGE
  const LOCAL_CI_CONTRIBUTION_RATES =
    inputState === 'Sachsen'
      ? CARE_INSURANCE_CONTRIBUTION_RATES_SAXONY
      : CARE_INSURANCE_CONTRIBUTION_RATES

  // Fall back to rate for no children
  const CI_CONTRIBUTION_RATE = LOCAL_CI_CONTRIBUTION_RATES[inputChildren]
  let CI_CONTRIBUTION_TOTAL = new BigDecimal(
    CI_CONTRIBUTION_RATE!.AN + CI_CONTRIBUTION_RATE!.AG,
  )
  let ciContribution = new BigDecimal(CI_CONTRIBUTION_RATE!.AN)

  const hasExtraCiContribution =
    inputAccountingYear - inputYearOfBirth > 23 && inputChildren === 0

  // Zuschlag für Kinderlose
  if (hasExtraCiContribution) {
    ciContribution = ciContribution.add(new BigDecimal(0.6))
  }

  let careInsurance = ciContribution
    .divide(ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)
    .multiply(CI_GROSS_WAGE_THRESHOLD!)

  if (GROSS_WAGE.comparedTo(ZAHL450.multiply(ZAHL12))! < 1) {
    careInsurance = ZERO
  }

  if (noCareInsurance) {
    CI_CONTRIBUTION_TOTAL = ZERO
    careInsurance = ZERO
  }

  // Rentenversicherung
  let piIncomeThreshold = ZERO
  if (inputPensionInsurance === 0) {
    // gesetzliche Rentenversicherung
    if (STATE_IS_OST) {
      piIncomeThreshold = BigDecimal.valueOf(PENSION_LIMIT_EAST)
    } else {
      piIncomeThreshold = BigDecimal.valueOf(PENSION_LIMIT_WEST)
    }
  } else if (inputPensionInsurance === 1) {
    // private Rentenversicherung
    piIncomeThreshold = ZERO
  }

  const PI_PERCENTAGE = new BigDecimal(18.6)
  const PI_GROSS_WAGE_THRESHOLD =
    GROSS_WAGE.comparedTo(piIncomeThreshold) === 1
      ? piIncomeThreshold
      : GROSS_WAGE
  const PI_CONTRIBUTION_PROPOTION = PI_PERCENTAGE.divide(
    ZAHL2,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  )
  const pensionInsurance = PI_CONTRIBUTION_PROPOTION.divide(
    ZAHL100,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  ).multiply(PI_GROSS_WAGE_THRESHOLD)

  // Arbeitslosenversicherung
  let uiIncomeThreshold: BigDecimal
  if (STATE_IS_OST) {
    uiIncomeThreshold = BigDecimal.valueOf(PENSION_LIMIT_EAST)
  } else {
    uiIncomeThreshold = BigDecimal.valueOf(PENSION_LIMIT_WEST)
  }

  const UI_PERCENTAGE = new BigDecimal(2.6)
  const UI_GROSS_WAGE_THRESHOLD =
    GROSS_WAGE.comparedTo(piIncomeThreshold) === 1
      ? uiIncomeThreshold
      : GROSS_WAGE
  const UI_CONTRIBUTION_PROPOTION = UI_PERCENTAGE.divide(
    ZAHL2,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  )

  let unemploymentInsurance = UI_CONTRIBUTION_PROPOTION.divide(
    ZAHL100,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  ).multiply(UI_GROSS_WAGE_THRESHOLD)
  if (GROSS_WAGE.comparedTo(ZAHL450.multiply(ZAHL12))! < 1) {
    unemploymentInsurance = ZERO
  }

  // Lohnsteuer
  // Use typed class for selected accounting year
  const WageTaxClass =
    INCOME_TAX_CLASSES[inputAccountingYear as keyof typeof INCOME_TAX_CLASSES]

  const lst = new WageTaxClass()
  let grossWage = new BigDecimal(inputGrossWage)

  // Cleanup user input
  if (inputPeriod === 1) {
    inputPeriod = 2
    grossWage = grossWage.divide(
      WageTaxClass.ZAHL12,
      50,
      BigDecimal.ROUND_HALF_DOWN,
    )
  } else if (inputPeriod === 0) {
    inputPeriod = 2
  }

  lst.setAf(0) // Anwendung des Faktorverfahrens
  lst.setAlter1(0) // 1, wenn das 64. Lebensjahr zu Beginn des Kalenderjahres vollendet wurde
  if (inputTaxAllowance === 0) {
    lst.setF(1) // Faktor
  } else {
    lst.setLzzfreib(
      new BigDecimal(inputTaxAllowance)
        .divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
        .multiply(ZAHL100),
    ) // Jahresfreibetrag
  }
  lst.setKrv(inputPensionInsurance) // 0 Ges. RV WEST, 1 Ges. RV OST, 2 weder noch
  lst.setKvz(new BigDecimal(inputAdditionalContribution)) // Zusatzbeitrag Krankenversicherung
  lst.setLzz(inputPeriod) // 1 Jahreslohn, 2 Monatslohn
  lst.setLzzhinzu(ZERO)
  lst.setPkv(inputHealthInsurance) // Krankenversicherung
  lst.setPvs(inputState === 'Sachsen' ? 1 : 0) // Besonderheiten Pflegeversicherung in Sachsen
  lst.setR(inputChurchTax) // Kirchensteuer
  lst.setRe4(grossWage.multiply(WageTaxClass.ZAHL100)) // in Cents
  lst.setStkl(inputTaxClass) // Steuerklasse
  if (hasExtraCiContribution) {
    lst.setPvz(1) // AN zahlt den Zuschuss zur Sozialen Pflegeversicherung
  } else {
    lst.setPvz(0) // AN zahlt keinen Zuschuss zur Sozialen Pflegeversicherung
  }
  if (inputChildTaxAllowance > 0) {
    lst.setZkf(new BigDecimal(inputChildTaxAllowance)) // Kinder
  }
  // `setPva` is only available in Lohnsteuer 2024+
  if (lst.setPva) {
    // Set the default value to `BigDecimal`
    // See: https://app.asana.com/0/1203046358489956/1206908743344200
    lst.setPva(new BigDecimal(0))
  }
  lst.MAIN()

  let churchTaxRate = new BigDecimal(9)
  if (inputState === 'Baden-Wuerttemberg' || inputState === 'Bayern') {
    churchTaxRate = new BigDecimal(8)
  }

  const incomeTax = lst
    .getLstlzz()
    .add(
      (inputAccountingYear >= 2025 ? BigDecimal.ZERO() : lst.getStv()).add(
        lst.getSts(),
      ),
    )
    .divide(WageTaxClass.ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)

  const solidaritySurcharge = lst
    .getSolzlzz()
    .add(
      lst
        .getSolzs()
        .add(inputAccountingYear >= 2025 ? BigDecimal.ZERO() : lst.getSolzv()),
    )
    .divide(WageTaxClass.ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)
  const churchTax = lst
    .getBk()
    .add(
      lst
        .getBks()
        .add(inputAccountingYear >= 2025 ? BigDecimal.ZERO() : lst.getBkv()),
    )
    .divide(WageTaxClass.ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)
    .multiply(churchTaxRate)
    .divide(WageTaxClass.ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)
  const insuranceComplete = healthInsurance
    .add(careInsurance)
    .add(pensionInsurance)
    .add(unemploymentInsurance)
    .divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
  const totalTaxes = incomeTax.add(solidaritySurcharge).add(churchTax)
  const complete = grossWage.subtract(totalTaxes).subtract(insuranceComplete)

  const healthInsurancePercentage = HI_TOTAL_PERCENTAGE.divide(
    ZAHL2,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  ).toNumber()
  const unemploymentInsurancePercentage = UI_PERCENTAGE.divide(
    ZAHL2,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  ).toNumber()
  const pensionInsurancePercentage = PI_PERCENTAGE.divide(
    ZAHL2,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  ).toNumber()

  let employerCareInsurancePercentage = CI_CONTRIBUTION_RATE!.AG
  let employeeCareInsurancePercentage = ciContribution.toNumber()

  if (noCareInsurance) {
    employerCareInsurancePercentage = employeeCareInsurancePercentage =
      CI_CONTRIBUTION_TOTAL.toNumber() / 2
  }

  let employerCareInsuranceMonth = careInsurance.divide(
    ZAHL12,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  )
  let employerCareInsuranceYear = careInsurance

  if (employeeCareInsurancePercentage !== employerCareInsurancePercentage) {
    employerCareInsuranceMonth = employerCareInsuranceMonth
      .divide(
        new BigDecimal(employeeCareInsurancePercentage),
        50,
        BigDecimal.ROUND_HALF_DOWN,
      )
      .multiply(new BigDecimal(employerCareInsurancePercentage))
    employerCareInsuranceYear = employerCareInsuranceMonth.multiply(ZAHL12)
  }

  let employerHealthInsuranceMonth = healthInsurance.divide(
    ZAHL12,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  )
  let employerHealthInsuranceYear = healthInsurance
  if (inputHealthInsurance === 1) {
    // Gesetzliche KV
    employerHealthInsuranceMonth =
      inputEmployerSubsidy === 1
        ? privateHealthInsurance.divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
        : ZERO
    employerHealthInsuranceYear =
      inputEmployerSubsidy === 1 ? privateHealthInsurance : ZERO
  }

  const employerTotalInsurances = employerHealthInsuranceMonth
    .add(employerCareInsuranceMonth)
    .add(pensionInsurance.divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN))
    .add(unemploymentInsurance.divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN))
  const employerTotalInsurancesYear = employerHealthInsuranceYear
    .add(employerCareInsuranceYear)
    .add(pensionInsurance)
    .add(unemploymentInsurance)

  const levyOne = GROSS_WAGE.divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
    .multiply(new BigDecimal(inputLevyOne))
    .divide(ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)
  const levyTwo = GROSS_WAGE.divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
    .multiply(new BigDecimal(inputLevyTwo))
    .divide(ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)
  const levyThree = GROSS_WAGE.divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
    .multiply(new BigDecimal(0.06))
    .divide(ZAHL100, 50, BigDecimal.ROUND_HALF_DOWN)
  const levyTotal = levyOne.add(levyTwo).add(levyThree)

  const employerGrossWageMonth = GROSS_WAGE.divide(
    ZAHL12,
    50,
    BigDecimal.ROUND_HALF_DOWN,
  )
    .add(employerTotalInsurances)
    .add(inputActivateLevy === 1 ? levyTotal : ZERO)

  return {
    outputResGrossWageMonth: formatResultWithTwoOptionalDecimals(
      lst.RE4.divide(
        WageTaxClass.ZAHL100,
        50,
        BigDecimal.ROUND_HALF_DOWN,
      ).toNumber(),
    ),
    outputResGrossWageYear: formatResultWithTwoOptionalDecimals(
      lst.ZRE4J.toNumber(),
    ),
    outputResIncomeTaxMonth: formatResultWithTwoOptionalDecimals(
      incomeTax.toNumber(),
    ),
    outputResIncomeTaxYear: formatResultWithTwoOptionalDecimals(
      incomeTax.multiply(ZAHL12).toNumber(),
    ),
    outputResSolidaritySurchargeMonth: formatResultWithTwoOptionalDecimals(
      solidaritySurcharge.toNumber(),
    ),
    outputResSolidaritySurchargeYear: formatResultWithTwoOptionalDecimals(
      solidaritySurcharge.multiply(ZAHL12).toNumber(),
    ),
    outputResChurchTaxPercentage: ` (${churchTaxRate.toNumber()}% der Lohnsteuer)`,
    outputResChurchTaxMonth: formatResultWithTwoOptionalDecimals(
      churchTax.toNumber(),
    ),
    outputResChurchTaxYear: formatResultWithTwoOptionalDecimals(
      churchTax.multiply(ZAHL12).toNumber(),
    ),
    outputTotalTaxes: formatResultWithTwoOptionalDecimals(
      totalTaxes.toNumber(),
    ),
    outputTotalTaxesYear: formatResultWithTwoOptionalDecimals(
      totalTaxes.multiply(ZAHL12).toNumber(),
    ),
    outputResHealthInsurancePercentage: formatPercent(
      healthInsurancePercentage,
      2,
    ),
    outputResHealthInsuranceMonth: formatResultWithTwoOptionalDecimals(
      healthInsurance.divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN).toNumber(),
    ),
    outputResHealthInsuranceYear: formatResultWithTwoOptionalDecimals(
      healthInsurance.toNumber(),
    ),
    outputResPrivateHealthInsuranceEmployerMonth:
      formatResultWithTwoOptionalDecimals(
        privateHealthInsurance
          .divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
          .toNumber(),
      ),
    outputResPrivateHealthInsuranceEmployerYear:
      formatResultWithTwoOptionalDecimals(privateHealthInsurance.toNumber()),
    outputDisableResCareInsurance: noCareInsurance,
    outputResCareInsurancePercentage: formatPercent(
      employeeCareInsurancePercentage,
      2,
    ),
    outputResCareInsuranceMonth: formatResultWithTwoOptionalDecimals(
      careInsurance.divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN).toNumber(),
    ),
    outputResCareInsuranceYear: formatResultWithTwoOptionalDecimals(
      careInsurance.toNumber(),
    ),
    outputResPensionInsurancePercentage: formatPercent(
      pensionInsurancePercentage,
      2,
    ),
    outputResPensionInsuranceMonth: formatResultWithTwoOptionalDecimals(
      pensionInsurance
        .divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
        .toNumber(),
    ),
    outputResPensionInsuranceYear: formatResultWithTwoOptionalDecimals(
      pensionInsurance.toNumber(),
    ),
    outputResUnemploymentInsurancePercentage: formatPercent(
      unemploymentInsurancePercentage,
      2,
    ),
    outputResUnemploymentInsuranceMonth: formatResultWithTwoOptionalDecimals(
      unemploymentInsurance
        .divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
        .toNumber(),
    ),
    outputResUnemploymentInsuranceYear: formatResultWithTwoOptionalDecimals(
      unemploymentInsurance.toNumber(),
    ),
    outputTotalInsurances: formatResultWithTwoOptionalDecimals(
      insuranceComplete.toNumber(),
    ),
    outputTotalInsurancesYear: formatResultWithTwoOptionalDecimals(
      insuranceComplete.multiply(ZAHL12).toNumber(),
    ),

    outputResNetWageMonth: formatResultWithTwoOptionalDecimals(
      complete.toNumber(),
    ),
    outputResNetWageYear: formatResultWithTwoOptionalDecimals(
      complete.multiply(ZAHL12).toNumber(),
    ),

    outputResEmployerHealthInsuranceMonth: formatResultWithTwoOptionalDecimals(
      employerHealthInsuranceMonth.toNumber(),
    ),
    outputResEmployerHealthInsuranceYear: formatResultWithTwoOptionalDecimals(
      employerHealthInsuranceYear.toNumber(),
    ),
    outputResEmployerCareInsuranceMonth: formatResultWithTwoOptionalDecimals(
      employerCareInsuranceMonth.toNumber(),
    ),
    outputResEmployerCareInsuranceYear: formatResultWithTwoOptionalDecimals(
      employerCareInsuranceYear.toNumber(),
    ),
    outputResEmployerPensionInsuranceMonth: formatResultWithTwoOptionalDecimals(
      pensionInsurance
        .divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
        .toNumber(),
    ),
    outputResEmployerPensionInsuranceYear: formatResultWithTwoOptionalDecimals(
      pensionInsurance.toNumber(),
    ),
    outputResEmployerUnemploymentInsuranceMonth:
      formatResultWithTwoOptionalDecimals(
        unemploymentInsurance
          .divide(ZAHL12, 50, BigDecimal.ROUND_HALF_DOWN)
          .toNumber(),
      ),
    outputResEmployerUnemploymentInsuranceYear:
      formatResultWithTwoOptionalDecimals(unemploymentInsurance.toNumber()),

    outputResEmployerHealthInsurancePercentage: formatPercent(
      healthInsurancePercentage,
      2,
    ),
    outputResEmployerCareInsurancePercentage: formatPercent(
      employerCareInsurancePercentage,
      2,
    ),
    outputResEmployerPensionInsurancePercentage: formatPercent(
      pensionInsurancePercentage,
      2,
    ),
    outputResEmployerUnemploymentInsurancePercentage: formatPercent(
      unemploymentInsurancePercentage,
      2,
    ),

    outputEmployerTotalInsurances: formatResultWithTwoOptionalDecimals(
      employerTotalInsurances.toNumber(),
    ),
    outputEmployerTotalInsurancesYear: formatResultWithTwoOptionalDecimals(
      employerTotalInsurancesYear.toNumber(),
    ),

    outputResEmployerLevyOneMonth: formatResultWithTwoOptionalDecimals(
      levyOne.toNumber(),
    ),
    outputResEmployerLevyOneYear: formatResultWithTwoOptionalDecimals(
      levyOne.multiply(ZAHL12).toNumber(),
    ),
    outputResEmployerLevyTwoMonth: formatResultWithTwoOptionalDecimals(
      levyTwo.toNumber(),
    ),
    outputResEmployerLevyTwoYear: formatResultWithTwoOptionalDecimals(
      levyTwo.multiply(ZAHL12).toNumber(),
    ),
    outputResEmployerLevyThreeMonth: formatResultWithTwoOptionalDecimals(
      levyThree.toNumber(),
    ),
    outputResEmployerLevyThreeYear: formatResultWithTwoOptionalDecimals(
      levyThree.multiply(ZAHL12).toNumber(),
    ),
    outputResEmployerLevyTotal: formatResultWithTwoOptionalDecimals(
      levyTotal.toNumber(),
    ),
    outputResEmployerLevyTotalYear: formatResultWithTwoOptionalDecimals(
      levyTotal.multiply(ZAHL12).toNumber(),
    ),

    outputResEmployerGrossWageMonth: formatResultWithTwoOptionalDecimals(
      employerGrossWageMonth.toNumber(),
    ),
    outputResEmployerGrossWageYear: formatResultWithTwoOptionalDecimals(
      employerGrossWageMonth.multiply(ZAHL12).toNumber(),
    ),
  }
}

export function isNewFederalState(state: string) {
  return [
    'Brandenburg',
    'Mecklenburg-Vorpommern',
    'Sachsen',
    'Sachsen-Anhalt',
    'Thueringen',
  ].includes(state)
}
