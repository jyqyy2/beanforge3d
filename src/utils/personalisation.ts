export function normalisePersonalisation(slug: string, value: string): string | null {
  const text = value.toUpperCase().trim().replace(/\s+/g, ' ')
  if (slug === 'custom-carplate-keychain') return /^[A-Z0-9 ]{1,16}$/.test(text) ? text : null
  if (slug === 'custom-name-keychain') return /^[A-Z]{1,10}$/.test(text) ? text : null
  return null
}
