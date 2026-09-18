export type StandDesign = 'Chick' | 'Bee'

export function isStandDesign(value: unknown): value is StandDesign {
  return value === 'Chick' || value === 'Bee'
}
