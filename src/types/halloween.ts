export const halloweenLayouts = { '1x1': 1, '2x1': 2, '2x2': 4, '4x1': 4 } as const
export const halloweenColours = ['Cream', 'Pink', 'Black', 'Purple', 'White', 'Turquoise'] as const
export const halloweenKeycaps = ['pumpkin', 'ghost', 'skull', 'spider', 'cat-side', 'cat-back'] as const

export type HalloweenConfiguration = {
  version: 1
  layout: keyof typeof halloweenLayouts
  boardColour: typeof halloweenColours[number]
  slots: Array<typeof halloweenKeycaps[number]>
  extras?: Array<typeof halloweenKeycaps[number]>
}

export function isHalloweenConfiguration(value: unknown): value is HalloweenConfiguration {
  if (!value || typeof value !== 'object') return false
  const design = value as Partial<HalloweenConfiguration>
  return design.version === 1 && typeof design.layout === 'string' &&
    Object.prototype.hasOwnProperty.call(halloweenLayouts, design.layout) &&
    halloweenColours.includes(design.boardColour as HalloweenConfiguration['boardColour']) &&
    Array.isArray(design.slots) && design.slots.length === halloweenLayouts[design.layout as HalloweenConfiguration['layout']] &&
    design.slots.every(slot => halloweenKeycaps.includes(slot)) &&
    (design.extras === undefined || (Array.isArray(design.extras) && design.extras.length <= 20 &&
      design.extras.every(extra => halloweenKeycaps.includes(extra))))
}
