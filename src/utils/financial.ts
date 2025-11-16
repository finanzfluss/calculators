import { FV, NPER, PMT, PV, RATE, XIRR } from '@formulajs/formulajs'

/**
 * Calculates the payment for a loan based on constant payments and a constant interest rate.
 *
 * @param rate The interest rate for the loan.
 * @param nperiod The total number of payments for the loan.
 * @param pv The present value, or the total amount that a series of future payments is worth now.
 * @param fv The future value, or a cash balance you want to attain after the last payment is made.
 * @param type The number `0` or `1` and indicates when payments are due.
 *   Set type equal to `0` if payments are due *at the end* of the period; set to `1` if payments are due *at the beginning* of the period.
 * @see [Official Microsoft documentation for `PMT` (en)](https://support.microsoft.com/en-us/office/pmt-function-0214da64-9a63-4996-bc20-214433fa6441)
 * @see [Official Microsoft documentation for `RMZ` (de)](https://support.microsoft.com/de-de/office/rmz-funktion-0214da64-9a63-4996-bc20-214433fa6441)
 */
export function pmt(
  rate: number,
  nperiod: number,
  pv: number,
  fv: number,
  type: 0 | 1 = 0,
): number {
  const result = PMT(rate, nperiod, pv, fv, type)
  return handleFormulaResult(result)
}

/**
 * Calculates the present value of a loan or an investment, based on a constant interest rate.
 *
 * @param rate The interest rate per period.
 * @param periods The total number of payment periods in an annuity.
 * @param payment The payment made each period and cannot change over the life of the annuity.
 * @param future The future value, or a cash balance you want to attain after the last payment is made.
 * @param type The number `0` or `1` and indicates when payments are due.
 *   Set type equal to `0` if payments are due *at the end* of the period; set to `1` if payments are due *at the beginning* of the period.
 * @see [Official Microsoft documentation for `PV` (en)](https://support.microsoft.com/en-us/office/pv-function-23879d31-0e02-4321-be01-da16e8168cbd)
 * @see [Official Microsoft documentation for `BW` (de)](https://support.microsoft.com/de-de/office/bw-funktion-23879d31-0e02-4321-be01-da16e8168cbd)
 */
export function pv(
  rate: number,
  periods: number,
  payment: number,
  future: number,
  type: 0 | 1 = 0,
): number {
  const result = PV(rate, periods, payment, future, type)
  return handleFormulaResult(result)
}

/**
 * Calculates the present value of a loan or an investment, based on a constant interest rate,
 * with taxes applied only to gains at the end (**accumulating distribution**).
 *
 * @param rate The interest rate per period.
 * @param periods The total number of payment periods in an annuity.
 * @param payment The payment made each period and cannot change over the life of the annuity.
 * @param future The future value, or a cash balance you want to attain after the last payment is made.
 * @param taxRate The tax rate applied to gains (as a decimal, e.g., 0.25 for 25%).
 * @param type The number `0` or `1` and indicates when payments are due.
 *   Set type equal to `0` if payments are due *at the end* of the period; set to `1` if payments are due *at the beginning* of the period.
 */
export function pvAccumulatingTaxed(
  rate: number,
  periods: number,
  payment: number,
  future: number,
  taxRate: number,
  type: 0 | 1 = 0,
): number {
  if (rate === 0) {
    return -(future + payment * periods)
  }

  const pow = (1 + rate) ** periods
  const denominator =
    ((pow - 1) / rate) * (1 + rate * type) * (1 - taxRate) + periods * taxRate

  const pvCoeff = pow * (1 - taxRate) + taxRate
  const pv = -(future + payment * denominator) / pvCoeff

  return pv
}

/**
 * Calculates the future value of an investment based on a constant interest rate.
 *
 * @param rate The interest rate per period.
 * @param nper The total number of payment periods in an annuity.
 * @param pmt The payment made each period; it cannot change over the life of the annuity.
 * @param pv The present value, or the lump-sum amount that a series of future payments is worth right now.
 * @param type The number `0` or `1` and indicates when payments are due.
 *   Set type equal to `0` if payments are due *at the end* of the period; set to `1` if payments are due *at the beginning* of the period.
 * @see [Official Microsoft documentation for `FV` (en)](https://support.microsoft.com/en-us/office/fv-function-2eef9f44-a084-4c61-bdd8-4fe4bb1b71b3)
 * @see [Official Microsoft documentation for `ZW` (de)](https://support.microsoft.com/de-de/office/zw-funktion-2eef9f44-a084-4c61-bdd8-4fe4bb1b71b3)
 */
export function fv(
  rate: number,
  nper: number,
  pmt: number,
  pv: number,
  type: 0 | 1 = 0,
): number {
  const result = FV(rate, nper, pmt, pv, type)
  const numberResult = handleFormulaResult(result)
  return Number.parseFloat(numberResult.toFixed(2))
}

/**
 * Returns the number of periods for an investment based on periodic, constant payments and a constant interest rate.
 *
 * @param ir The interest rate per period.
 * @param pmt The payment made each period.
 * @param pv The present value, or the lump-sum amount that a series of future payments is worth right now.
 * @param fv The future value, or a cash balance you want to attain after the last payment is made.
 * @param type The number `0` or `1` and indicates when payments are due.
 *   Set type equal to `0` if payments are due *at the end* of the period; set to `1` if payments are due *at the beginning* of the period.
 * @see [Official Microsoft documentation for `NPER` (en)](https://support.microsoft.com/en-us/office/nper-function-240535b5-6653-4d2d-bfcf-b6a38151d815)
 * @see [Official Microsoft documentation for `ZZR` (de)](https://support.microsoft.com/de-de/office/zzr-funktion-240535b5-6653-4d2d-bfcf-b6a38151d815)
 */
export function nper(
  ir: number,
  pmt: number,
  pv: number,
  fv: number,
  type: 0 | 1 = 0,
): number {
  const result = NPER(ir, pmt, pv, fv, type)
  return handleFormulaResult(result)
}

/**
 * Returns the number of periods for an investment based on periodic, constant payments and a constant interest rate,
 * with taxes applied only to gains at the end (**accumulating distribution**).
 *
 * @param ir The interest rate per period.
 * @param pmt The payment made each period.
 * @param pv The present value, or the lump-sum amount that a series of future payments is worth right now.
 * @param fv The future value, or a cash balance you want to attain after the last payment is made.
 * @param taxRate The tax rate applied to gains (as a decimal, e.g., 0.25 for 25%).
 * @param type The number `0` or `1` and indicates when payments are due.
 *   Set type equal to `0` if payments are due *at the end* of the period; set to `1` if payments are due *at the beginning* of the period.
 */
/* v8 ignore next -- @preserve */
export function nperAccumulatingTaxed(
  ir: number,
  pmt: number,
  pv: number,
  fv: number,
  taxRate: number,
  type: 0 | 1 = 0,
): number {
  // Fast-path for zero tax
  if (taxRate === 0) {
    return nper(ir, pmt, pv, fv, type)
  }
  // Work with non-negative magnitudes
  const cpv = Math.abs(pv)
  const cpmt = Math.abs(pmt)
  if (cpv >= fv) return 0 // No periods needed if current value already meets target
  if (ir === 0) {
    // Zero-interest closed-form
    if (cpmt === 0) return Number.NaN
    return Math.max(0, (fv - cpv) / cpmt)
  }

  function calculateNetFvForPeriods(periods: number): number {
    const fvInitial = cpv * (1 + ir) ** periods

    let fvPayments = 0
    if (cpmt > 0) {
      if (type === 1) {
        // In-advance payments earn full‐period interest
        fvPayments = cpmt * (((1 + ir) ** periods - 1) / ir) * (1 + ir)
      } else {
        // In-arrears payments
        fvPayments = cpmt * (((1 + ir) ** periods - 1) / ir)
      }
    }

    const totalFv = fvInitial + fvPayments
    const totalContributions = cpv + cpmt * periods
    const taxableGains = Math.max(0, totalFv - totalContributions)
    return totalFv - taxableGains * taxRate
  }

  // Use binary search to find the number of periods
  let low = 0
  let high = 100 // Will expand if needed
  const tolerance = 1e-6
  const maxIterations = 200

  // Expand upper bound until target is bracketed or overflow
  for (let expansion = 0; expansion < 10; expansion++) {
    const testFv = calculateNetFvForPeriods(high)
    if (testFv >= fv) {
      break // Found a suitable upper bound
    }
    /* v8 ignore next -- @preserve */
    if (!Number.isFinite(testFv)) {
      break // Overflowed
    }
    high *= 10 // Expand search range
  }
  const upper = calculateNetFvForPeriods(high)
  if (!Number.isFinite(upper) || upper < fv) {
    return Number.NaN // Unattainable target
  }

  // Binary search within bracket
  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2
    const netFv = calculateNetFvForPeriods(mid)

    if (Math.abs(netFv - fv) < tolerance) {
      return mid
    }

    if (netFv < fv) {
      low = mid
    } else {
      high = mid
    }

    if (Math.abs(high - low) < tolerance) {
      break // Converged
    }
  }

  return (low + high) / 2
}

/**
 * Returns the interest rate per period of an annuity.
 *
 * @param periods The total number of payment periods in an annuity.
 * @param payment The payment made each period and cannot change over the life of the annuity.
 * @param present The present value — the total amount that a series of future payments is worth now.
 * @param future The future value, or a cash balance you want to attain after the last payment is made.
 * @param type The number `0` or `1` and indicates when payments are due.
 *   Set type equal to `0` if payments are due *at the end* of the period; set to `1` if payments are due *at the beginning* of the period.
 * @param guess Your guess for what the rate will be.
 *   If you omit guess, it is assumed to be 10 percent.
 *   If `rate` does not converge, try different values for `guess`.
 * @see [Official Microsoft documentation for `RATE` (en)](https://support.microsoft.com/en-us/office/rate-function-9f665657-4a7e-4bb7-a030-83fc59e748ce)
 * @see [Official Microsoft documentation for `ZINS` (de)](https://support.microsoft.com/de-de/office/zins-funktion-9f665657-4a7e-4bb7-a030-83fc59e748ce)
 */
export function rate(
  periods: number,
  payment: number,
  present: number,
  future = 0,
  type: 0 | 1 = 0,
  guess = 0.1,
): number {
  const result = RATE(periods, payment, present, future, type, guess)
  return handleFormulaResult(result)
}

/**
 * Returns the internal rate of return for a schedule of cash flows that is not necessarily periodic.
 *
 * @param values An array of numbers representing a series of cash flows.
 * @param dates An array of dates corresponding to each cash flow in the values array.
 * @param guess An optional guess for what the internal rate of return might be.
 *   If you omit guess, it is assumed to be 10 percent.
 * @see [Official Microsoft documentation for `XIRR` (en)](https://support.microsoft.com/en-us/office/xirr-function-de1242ec-6477-445b-b11b-a303ad9adc9d)
 * @see [Official Microsoft documentation for `XINTZINSFUSS` (de)](https://support.microsoft.com/de-de/office/xintzinsfuss-funktion-de1242ec-6477-445b-b11b-a303ad9adc9d)
 */
export function xirr(values: number[], dates: Date[], guess?: number): number {
  const result = XIRR(values, dates, guess)
  return handleFormulaResult(result)
}

/**
 * Safely handles formulajs results that might be Error objects
 * @param result The result from a formulajs calculation
 * @returns The result value or NaN if an error occurred
 */
export function handleFormulaResult(result: number | Error): number {
  /* v8 ignore if -- @preserve */
  if (result instanceof Error) {
    console.error(
      `Error during calculating formula:`,
      result.message,
      result.cause,
    )
    return Number.NaN
  }
  return result
}
