import type { GenericLohnsteuer } from './types'
import { Lohnsteuer2019 } from './2019'
import { Lohnsteuer2020 } from './2020'
import { Lohnsteuer2021 } from './2021'
import { Lohnsteuer2022 } from './2022'
import { Lohnsteuer2023 } from './2023'
import { Lohnsteuer2024 } from './2024'
import { Lohnsteuer2025 } from './2025'
import { Lohnsteuer2026 } from './2026'

type LohnsteuerInstance = (new () => GenericLohnsteuer) & GenericLohnsteuer

export const INCOME_TAX_CLASSES = {
  2019: Lohnsteuer2019 as unknown as LohnsteuerInstance,
  2020: Lohnsteuer2020 as unknown as LohnsteuerInstance,
  2021: Lohnsteuer2021 as unknown as LohnsteuerInstance,
  2022: Lohnsteuer2022 as unknown as LohnsteuerInstance,
  2023: Lohnsteuer2023 as unknown as LohnsteuerInstance,
  2024: Lohnsteuer2024 as unknown as LohnsteuerInstance,
  2025: Lohnsteuer2025 as unknown as LohnsteuerInstance,
  2026: Lohnsteuer2026 as unknown as LohnsteuerInstance,
} as const
