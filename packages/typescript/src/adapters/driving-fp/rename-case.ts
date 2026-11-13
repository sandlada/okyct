import { NamingCases, type NamingCase, type TokenDictionary, type TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'

function splitWords(key: string): string[] {
  return key
    .replace(/^--+/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .filter(Boolean)
}

function toKebab(key: string): string {
  return splitWords(key).map((w) => w.toLowerCase()).join('-')
}

function toCamel(key: string): string {
  return splitWords(key)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
}

function toSnake(key: string): string {
  return splitWords(key).map((w) => w.toLowerCase()).join('_')
}

function toConstant(key: string): string {
  return splitWords(key).map((w) => w.toUpperCase()).join('_')
}

const CaseTransformers: Record<NamingCase, (key: string) => string> = {
  kebab: toKebab,
  camel: toCamel,
  snake: toSnake,
  constant: toConstant,
}

export const renameCase = (targetCase: NamingCase) => {
  if (!NamingCases.includes(targetCase)) {
    throw new Error(`Invalid naming case: "${String(targetCase)}". Expected one of: ${NamingCases.join(', ')}.`)
  }
  const transform = CaseTransformers[targetCase]

  return (dict: TokenSource): TokenDictionary => {
    const normalized = normalizeTokenDict(dict)
    const result: TokenDictionary = {}
    for (const [key, val] of Object.entries(normalized)) {
      result[transform(key)] = val
    }
    return result
  }
}
