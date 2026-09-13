export type KeycapConfiguration = {
  schemaVersion: 3
  boardColour: string
  characters: { character: string; colour: string; characterColour?: string }[]
}

export type KeycapPricing = {
  currency: 'SGD'
  developmentOnly: boolean
  boardPricesMinor: Readonly<Record<number, number>>
  characterPricesMinor: Readonly<Record<string, number>>
}
