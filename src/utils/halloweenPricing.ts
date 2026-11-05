import type { HalloweenConfiguration } from '../types/halloween'

export const halloweenBoardPricesMinor = { '1x1': 790, '2x1': 990, '2x2': 1190, '4x1': 1190 } as const
export const halloweenExtraKeycapMinor = 250

export function calculateHalloweenPrice(configuration: HalloweenConfiguration) {
  const boardMinor = halloweenBoardPricesMinor[configuration.layout]
  const extrasMinor = (configuration.extras?.length ?? 0) * halloweenExtraKeycapMinor
  return { boardMinor, extrasMinor, totalMinor: boardMinor + extrasMinor }
}
