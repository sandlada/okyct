import { NamingCases, type NamingCase, type TokenDictionary, type TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'
import { splitTokenWords } from './internal/split-token-words.ts'

function toKebab(key: string): string {
  return splitTokenWords(key).map((w) => w.toLowerCase()).join('-')
}

function toCamel(key: string): string {
  return splitTokenWords(key)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
}

function toSnake(key: string): string {
  return splitTokenWords(key).map((w) => w.toLowerCase()).join('_')
}

function toConstant(key: string): string {
  return splitTokenWords(key).map((w) => w.toUpperCase()).join('_')
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
    const seenSources = new Map<string, string>()
    for (const [key, val] of Object.entries(normalized)) {
      const nextKey = transform(key)
      const prev = seenSources.get(nextKey)
      if (prev !== undefined) {
        throw new Error(
          `Token key collision in renameCase("${targetCase}"): "${prev}" and "${key}" both map to "${nextKey}".`
        )
      }
      seenSources.set(nextKey, key)
      result[nextKey] = val
    }
    return result
  }
}
