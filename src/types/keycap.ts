export type KeycapConfiguration = {
  schemaVersion: 2
  colour: string
  characters: string[]
}

export type KeycapPricing = {
  currency: 'SGD'
  developmentOnly: boolean
  boardPricesMinor: Readonly<Record<number, number>>
  characterPricesMinor: Readonly<Record<string, number>>
}
