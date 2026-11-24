import {
  StateLayerStates,
  StatefulSystemColorTokens,
  SystemColorTokens,
  type DynamicSchemeColors,
  type ResolvedCustomColor,
  type SchemeStateLayerTokens,
} from '../../ports/index.ts'
import type { TokenDictionary } from './token-dictionary.ts'
import { splitTokenWords } from './internal/split-token-words.ts'

function toCamelName(name: string): string {
  const words = splitTokenWords(name)
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
    const seen = new Set<string>()
    for (const token of StatefulSystemColorTokens) {
      for (const state of StateLayerStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        const stateKey = `${token}${cap}` as keyof SchemeStateLayerTokens
        const stateHex = scheme.stateLayers[stateKey]
        if (typeof stateHex === 'string') {
          seen.add(stateKey)
          assignToken(stateKey, stateHex, `system state layer "${stateKey}"`)
        }
      }
    }
    for (const [stateKey, stateHex] of Object.entries(scheme.stateLayers)) {
      if (!seen.has(stateKey) && typeof stateHex === 'string') {
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
      const rolePairs: ReadonlyArray<readonly [string, string]> = [
        ['color', baseKey],
        ['onColor', onKey],
        ['colorContainer', containerKey],
        ['onColorContainer', onContainerKey],
      ]
      for (const state of StateLayerStates) {
        const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}`
        for (const [sourcePrefix, targetPrefix] of rolePairs) {
          const stateHex = custom.stateLayers[`${sourcePrefix}${cap}`]
          if (typeof stateHex === 'string') {
            assignToken(`${targetPrefix}${cap}`, stateHex, sourceLabel)
          }
        }
      }
    }
  }

  return dict
}
