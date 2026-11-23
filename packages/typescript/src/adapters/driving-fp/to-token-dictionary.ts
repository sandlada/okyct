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
  customColors: readonly ResolvedCustomColor[] = [],
  options: { includeStateLayers?: boolean } = {}
): TokenDictionary {
  if (scheme === null || typeof scheme !== 'object' || Array.isArray(scheme)) {
    throw new Error('Invalid DynamicSchemeColors input: expected an object.')
  }
  if (!Array.isArray(customColors)) {
    throw new Error('Invalid customColors input: expected an array of ResolvedCustomColor.')
  }

  const includeStateLayers = options.includeStateLayers ?? true
  const dict: TokenDictionary = {}
  const keySources = new Map<string, string>()

  const assignToken = (key: string, value: string, sourceLabel: string) => {
    const existing = keySources.get(key)
    if (existing !== undefined) {
      throw new Error(
        `Token key collision in toTokenDictionary: "${key}" from ${sourceLabel} conflicts with ${existing}.`
      )
    }
    keySources.set(key, sourceLabel)
    dict[key] = value
  }

  for (const key of SystemColorTokens) {
    const value = scheme[key]
    if (typeof value !== 'string') {
      throw new Error(`Invalid scheme color for token "${key}": expected string, received ${typeof value}.`)
    }
    assignToken(key, value, `system role "${key}"`)
  }

  if (includeStateLayers && scheme.stateLayers) {
    for (const [stateKey, stateHex] of Object.entries(scheme.stateLayers)) {
      if (typeof stateHex === 'string') {
        assignToken(stateKey, stateHex, `system state layer "${stateKey}"`)
      }
    }
  }

  for (const custom of customColors) {
    if (custom === null || typeof custom !== 'object') {
      throw new Error('Invalid custom color entry: expected a ResolvedCustomColor object.')
    }
    const sourceLabel = `custom color "${custom.name}"`
    const [baseKey, onKey, containerKey, onContainerKey] = customRoleKeys(custom.name)
    assignToken(baseKey, custom.color, sourceLabel)
    assignToken(onKey, custom.onColor, sourceLabel)
    assignToken(containerKey, custom.colorContainer, sourceLabel)
    assignToken(onContainerKey, custom.onColorContainer, sourceLabel)

    if (includeStateLayers && custom.stateLayers) {
      for (const [roleStateKey, stateHex] of Object.entries(custom.stateLayers)) {
        if (typeof stateHex !== 'string') continue
        if (roleStateKey.startsWith('colorContainer')) {
          const suffix = roleStateKey.slice('colorContainer'.length)
          assignToken(`${containerKey}${suffix}`, stateHex, sourceLabel)
        } else if (roleStateKey.startsWith('onColorContainer')) {
          const suffix = roleStateKey.slice('onColorContainer'.length)
          assignToken(`${onContainerKey}${suffix}`, stateHex, sourceLabel)
        } else if (roleStateKey.startsWith('onColor')) {
          const suffix = roleStateKey.slice('onColor'.length)
          assignToken(`${onKey}${suffix}`, stateHex, sourceLabel)
        } else if (roleStateKey.startsWith('color')) {
          const suffix = roleStateKey.slice('color'.length)
          assignToken(`${baseKey}${suffix}`, stateHex, sourceLabel)
        }
      }
    }
  }

  return dict
}
