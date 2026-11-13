import {
  SystemColorTokens,
  type DynamicSchemeColors,
  type ResolvedCustomColor,
} from '../../ports/index.ts'
import type { TokenDictionary } from './token-dictionary.ts'

function splitNameWords(name: string): string[] {
  return name
    .replace(/^--+/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
}

function toCamelName(name: string): string {
  const words = splitNameWords(name)
  if (words.length === 0) {
    throw new Error(`Invalid custom color name: "${name}". Expected at least one alphanumeric word.`)
  }
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
}

function customRoleKeys(name: string): readonly [string, string, string, string] {
  const base = toCamelName(name)
  const cap = base.charAt(0).toUpperCase() + base.slice(1)
  return [base, `on${cap}`, `${base}Container`, `on${cap}Container`]
}

export function toTokenDictionary(
  scheme: DynamicSchemeColors,
  customColors: readonly ResolvedCustomColor[] = []
): TokenDictionary {
  if (scheme === null || typeof scheme !== 'object' || Array.isArray(scheme)) {
    throw new Error('Invalid DynamicSchemeColors input: expected an object.')
  }
  if (!Array.isArray(customColors)) {
    throw new Error('Invalid customColors input: expected an array of ResolvedCustomColor.')
  }

  const dict: TokenDictionary = {}
  for (const key of SystemColorTokens) {
    const value = scheme[key]
    if (typeof value !== 'string') {
      throw new Error(`Invalid scheme color for token "${key}": expected string, received ${typeof value}.`)
    }
    dict[key] = value
  }

  for (const custom of customColors) {
    if (custom === null || typeof custom !== 'object') {
      throw new Error('Invalid custom color entry: expected a ResolvedCustomColor object.')
    }
    const [baseKey, onKey, containerKey, onContainerKey] = customRoleKeys(custom.name)
    dict[baseKey] = custom.color
    dict[onKey] = custom.onColor
    dict[containerKey] = custom.colorContainer
    dict[onContainerKey] = custom.onColorContainer
  }

  return dict
}
