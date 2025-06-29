import { z } from "zod";

import { formatResult, toPercentRate } from "../utils";

// Schema for the input of the compound interest calculator
export const COMPOUND_INTEREST_SCHEMA = z.object({
    startCapital: z.number(),
    monthlyPayment: z.number(),
    durationYears: z.number().nonnegative().max(1000),
    yearlyInterest: z.number().min(-10_000).max(10_000).transform(toPercentRate),
    type: z.enum(['monthly', 'quarterly', 'yearly']),
})

// TYPES
type CompoundInterestInput = z.output<typeof COMPOUND_INTEREST_SCHEMA>;
interface CompoundAccData { CAPITAL_LIST: number[], INTEREST_LIST: number[] };

const CompoundInterestMultipliers: Record<CompoundInterestInput['type'], { duration: number, monthlyPayment: number }> = {
    monthly: { duration: 12, monthlyPayment: 1 },
    quarterly: { duration: 4, monthlyPayment: 3 },
    yearly: { duration: 1, monthlyPayment: 12 },
}

// Helper Function to get the base investment datas
const getBaseInvestmentData = (parsedInput: CompoundInterestInput) => {
    const { monthlyPayment, type, durationYears, yearlyInterest } = parsedInput
    const multiplier = CompoundInterestMultipliers[type]!;

    return {
        duration: durationYears * multiplier.duration,
        payment: monthlyPayment * multiplier.monthlyPayment,
        interest: yearlyInterest / multiplier.duration,
    }
}

// Helper Fubnction to increase readability of the main function
const subCalcCompounding = (parsedInput: CompoundInterestInput) => {
    const { startCapital } = parsedInput;
    // Extract the multiplier for the correct intervaliterations by object lookup
    const { duration, payment, interest } = getBaseInvestmentData(parsedInput);
    // Replace for loop with proper Array Iteration, removes need for dynamic array memory allocation and overhead, leading to better performance and allowing Javascript to utilize the "optimization engine" better
    const { CAPITAL_LIST, INTEREST_LIST } = Array.from<CompoundAccData>({ length: duration }).reduce(({ CAPITAL_LIST, INTEREST_LIST }) => {
        const prevCapital = CAPITAL_LIST[CAPITAL_LIST.length - 1]! || startCapital; // grab previous capital, default-start-val is the start capital
        const prevInterest = INTEREST_LIST[INTEREST_LIST.length - 1]! || 0; // grab previous interest, default-start-val is 0
        CAPITAL_LIST.push(prevCapital + payment); // add new invested capital
        INTEREST_LIST.push(prevInterest + (prevCapital + prevInterest) * interest); // add newly gained interest
        return { CAPITAL_LIST, INTEREST_LIST };
    }, { CAPITAL_LIST: [], INTEREST_LIST: [] });
    // return with right naming, so no duplication variable allocations are necessary
    return {
        FINAL_CAPITAL: CAPITAL_LIST[CAPITAL_LIST.length - 1]!,
        FINAL_INTEREST: INTEREST_LIST[INTEREST_LIST.length - 1]!,
        CAPITAL_LIST,
        INTEREST_LIST
    };
}

// MAIN Function
export const calcCompoundInterest = (parsedInput: CompoundInterestInput) => {
    const { startCapital, monthlyPayment, durationYears } = parsedInput
    const { FINAL_CAPITAL, FINAL_INTEREST, CAPITAL_LIST, INTEREST_LIST } = subCalcCompounding(parsedInput);

    const LAST_CAPITAL = formatResult(FINAL_CAPITAL);
    const LAST_INTEREST = formatResult(FINAL_INTEREST);
    const TOTAL_CAPITAL = formatResult(FINAL_CAPITAL + FINAL_INTEREST);

    return {
        finalCapital: TOTAL_CAPITAL,
        totalPayments: formatResult(startCapital + durationYears * 12 * monthlyPayment),
        totalInterest: LAST_INTEREST,
        diagramData: { CAPITAL_LIST, INTEREST_LIST, LAST_CAPITAL, LAST_INTEREST, TOTAL_CAPITAL },
    }
}
