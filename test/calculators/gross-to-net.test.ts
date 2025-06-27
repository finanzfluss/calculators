/* eslint-disable unused-imports/no-unused-vars */
import { describe, expect, it } from 'vitest'
import {
  calcGrossToNet,
  GROSS_NET_SCHEMA,
} from '../../src/calculators/gross-to-net'

const MONTHLY_PERIOD = 2
const YEARLY_PERIOD = 1

const TAX_CLASS_1 = 1
const TAX_CLASS_2 = 2
const TAX_CLASS_3 = 3
const TAX_CLASS_4 = 4
const TAX_CLASS_5 = 5
const TAX_CLASS_6 = 6

const NO_CHURCH_TAX = 0
const PAY_CHURCH_TAX = 1

const STATE_BADEN_WUERTTEMBERG = 'Baden-Wuerttemberg'
const STATE_BAYERN = 'Bayern'
const STATE_BERLIN = 'Berlin'
const STATE_BRANDENBURG = 'Brandenburg'
const STATE_BREMEN = 'Bremen'
const STATE_HAMBURG = 'Hamburg'
const STATE_HESSEN = 'Hessen'
const STATE_MECKLENBURG_VORPOMMERN = 'Mecklenburg-Vorpommern'
const STATE_NIEDERSACHSEN = 'Niedersachsen'
const STATE_NORDRHEIN_WESTFALEN = 'Nordrhein-Westfalen'
const STATE_RHEINLAND_PFALZ = 'Rheinland-Pfalz'
const STATE_SAARLAND = 'Saarland'
const STATE_SACHSEN = 'Sachsen'
const STATE_SACHSEN_ANHALT = 'Sachsen-Anhalt'
const STATE_SCHLESWIG_HOLSTEIN = 'Schleswig-Holstein'
const STATE_THUERINGEN = 'Thueringen'

const HEALTH_INSURANCE = 0
const REDUCED_HEALTH_INSURANCE = -1
const PRIVATE_HEALTH_INSURANCE = 1

const NO_EMPLOYER_SUBSIDY = 0
const EMPLOYER_SUBSIDY = 1

const NO_PENSION_INSURANCE = 1
const PENSION_INSURANCE = 0

const LEVY = 0
const NO_LEVY = 1

const DEFAULT_VALUES: Record<string, string | number> = {
  grossWage: 2500,
  period: MONTHLY_PERIOD,
  accountingYear: '2022',
  taxClass: TAX_CLASS_1,
  taxAllowance: 0,
  churchTax: NO_CHURCH_TAX,
  state: STATE_BADEN_WUERTTEMBERG,
  yearOfBirth: 0,
  children: 0,
  childTaxAllowance: 0,
  healthInsurance: HEALTH_INSURANCE,
  additionalContribution: 1.1,
  pkvContribution: 0,
  employerSubsidy: NO_EMPLOYER_SUBSIDY,
  pensionInsurance: PENSION_INSURANCE,
  levyOne: 0,
  levyTwo: 0,
  activateLevy: NO_LEVY,
}

describe('calculators/gross-to-net', () => {
  describe('with page defaults', () => {
    it('data from initial page load', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(fakeTestValues())

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('taxClass 1', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          grossWage: 4000,
          churchTax: PAY_CHURCH_TAX,
          taxClass: TAX_CLASS_1,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('taxClass 2', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          grossWage: 4000,
          churchTax: PAY_CHURCH_TAX,
          taxClass: TAX_CLASS_2,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('taxClass 3', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          grossWage: 4000,
          churchTax: PAY_CHURCH_TAX,
          taxClass: TAX_CLASS_3,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('taxClass 4', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          grossWage: 4000,
          churchTax: PAY_CHURCH_TAX,
          taxClass: TAX_CLASS_4,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('taxClass 5', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          grossWage: 4000,
          churchTax: PAY_CHURCH_TAX,
          taxClass: TAX_CLASS_5,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('taxClass 6', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          grossWage: 4000,
          churchTax: PAY_CHURCH_TAX,
          taxClass: TAX_CLASS_6,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('with children', () => {
    it('no children', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          children: 0,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('one child', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          children: 1,
          childTaxAllowance: 0.5,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('five children', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          children: 5,
          childTaxAllowance: 0.5,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('with children and church', () => {
    it('monthly period', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          grossWage: 6500,
          churchTax: PAY_CHURCH_TAX,
          state: STATE_SAARLAND,
          yearOfBirth: 1984,
          children: 1,
          childTaxAllowance: 0.5,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('yearly period', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          grossWage: 78000,
          period: YEARLY_PERIOD,
          churchTax: PAY_CHURCH_TAX,
          state: STATE_SAARLAND,
          yearOfBirth: 1984,
          children: 1,
          childTaxAllowance: 0.5,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('private health insurance', () => {
    it(' without employer subsidy', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          healthInsurance: PRIVATE_HEALTH_INSURANCE,
          pkvContribution: 800,
          employerSubsidy: NO_EMPLOYER_SUBSIDY,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })

    it('with employer subsidy', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          healthInsurance: PRIVATE_HEALTH_INSURANCE,
          pkvContribution: 800,
          employerSubsidy: EMPLOYER_SUBSIDY,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('reduced health insurance', () => {
    it('should return specific result for user made input', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          healthInsurance: REDUCED_HEALTH_INSURANCE,
          additionalContribution: 0,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('without pension insurance', () => {
    it('should return specific result for user made input', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          pensionInsurance: NO_PENSION_INSURANCE,
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('tax year 2019', () => {
    it('should return specific result for tax year 2019', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          accountingYear: '2019',
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('tax year 2020', () => {
    it('should return specific result for tax year 2020', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          accountingYear: '2020',
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('tax year 2021', () => {
    it('should return specific result for tax year 2021', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          accountingYear: '2021',
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('tax year 2022', () => {
    it('should return specific result for tax year 2022', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(fakeTestValues())

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('tax year 2023', () => {
    it('should return specific result for tax year 2023', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          accountingYear: '2023',
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })

  describe('tax year 2024', () => {
    it('should return specific result for tax year 2024', async () => {
      const parsedInput = GROSS_NET_SCHEMA.parse(
        fakeTestValues({
          accountingYear: '2024',
        }),
      )

      expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
    })
  })
})

describe('tax year 2025', () => {
  it('should return specific result for tax year 2025', async () => {
    const parsedInput = GROSS_NET_SCHEMA.parse(
      fakeTestValues({
        accountingYear: '2025',
      }),
    )

    expect(calcGrossToNet(parsedInput)).toMatchSnapshot()
  })
})

function fakeTestValues(options = {}) {
  return {
    inputGrossWage: getOrDefault(options, 'grossWage'), // Bruttogehalt
    inputPeriod: getOrDefault(options, 'period'), // Periode: 1 year, 2 month
    inputAccountingYear: getOrDefault(options, 'accountingYear'), // Abrechnungsjahr: 2019, 2020
    inputTaxClass: getOrDefault(options, 'taxClass'), // Steuerklasse: 1, 2,3,4,5,6
    inputTaxAllowance: getOrDefault(options, 'taxAllowance'), // Steuerfreibetrag
    inputChurchTax: getOrDefault(options, 'churchTax'), // Kirchensteuer: 0 Nein, 1 Yes
    inputState: getOrDefault(options, 'state'), // Bundesland: Baden Württemberg, Bayern, Berlin, Brandenburg, Bremen, Hamburg, Hessen, Mecklenburg-Vorpommern,
    // Niedersachsen, Nordrhein-Westfalen, Rheinland Pfalz, Saarland, Sachsen, Sachsen-Anhalt, Schleswig-Holstein, Thüringen
    inputYearOfBirth: getOrDefault(options, 'yearOfBirth'), // Geburtsjahr
    inputChildren: getOrDefault(options, 'children'), // Kinder: 0 Nein, 1 Ja
    inputChildTaxAllowance: getOrDefault(options, 'childTaxAllowance'), // Anzahl der Kinder: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6
    inputHealthInsurance: getOrDefault(options, 'healthInsurance'), // Krankenversicherung: 0 Gesetzlich 14,6%, -1 Gesetzlich ermässigt 14, 1 Privat
    inputAdditionalContribution: getOrDefault(
      options,
      'additionalContribution',
    ), // Zusatzbeitrag Prozentual
    inputPkvContribution: getOrDefault(options, 'pkvContribution'), // PKV-Beitrag
    inputEmployerSubsidy: getOrDefault(options, 'employerSubsidy'), // Arbeitgeberzuschuss: 0 Nein, 1 Ja
    inputPensionInsurance: getOrDefault(options, 'pensionInsurance'), // Rentenversicherungspflicht: 0 Nein, 1 Ja
    inputLevyOne: getOrDefault(options, 'levyOne'), // Umlage U1
    inputLevyTwo: getOrDefault(options, 'levyTwo'), // Umlage U2
    inputActivateLevy: getOrDefault(options, 'activateLevy'), // Umlagen berücksichtigen: 0 Nein, 1 Ja
  }
}

function getOrDefault(options: Record<string, string | number>, key: string) {
  return options[key] ?? DEFAULT_VALUES[key]
}
