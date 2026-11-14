import type {
  DynamicSchemeColors,
  ResolvedCustomColor,
  SchemeStateLayerTokens,
  StateLayerState,
  StateLayersOption,
} from '../../../ports/index.ts'
import {
  StateLayerStates,
  resolveSchemeStateLayers,
  stackStateLayers,
} from '../../../application/index.ts'

function normalizeStates(option: StateLayersOption): StateLayerState[] {
  if (option === false) return []
  if (option === true) return [...StateLayerStates]
  if (!Array.isArray(option)) {
    throw new Error('Invalid stateLayers option: expected a boolean or an array of state names.')
  }
  const seen = new Set<StateLayerState>()
  const result: StateLayerState[] = []
  for (const state of option) {
    if (!StateLayerStates.includes(state)) {
      throw new Error(
        `Invalid state layer name: "${String(state)}". Expected one of: ${StateLayerStates.join(', ')}.`
      )
    }
    if (!seen.has(state)) {
      seen.add(state)
      result.push(state)
    }
  }
  return result
}

function capitalizeState(state: StateLayerState): string {
  return `${state.charAt(0).toUpperCase()}${state.slice(1)}`
}

export function resolveSystemStateLayersForExport(
  scheme: DynamicSchemeColors,
  stateLayers?: StateLayersOption
): Array<[string, string]> {
  if (stateLayers === false) return []
  if (stateLayers !== undefined) {
    const requested = normalizeStates(stateLayers)
    if (requested.length === 0) return []
    const resolved = resolveSchemeStateLayers(scheme, requested)
    const entries = Object.entries(resolved).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
    if (!scheme.stateLayers) return entries
    return entries.map(([key, fallbackHex]) => {
      const existingHex = scheme.stateLayers?.[key as keyof SchemeStateLayerTokens]
      return [key, typeof existingHex === 'string' ? existingHex : fallbackHex]
    })
  }
  if (scheme.stateLayers) {
    return Object.entries(scheme.stateLayers).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
  }
  return []
}

export function resolveCustomStateLayersForExport(
  custom: ResolvedCustomColor,
  stateLayers?: StateLayersOption
): {
  colorStates: Array<[StateLayerState, string]>
  onColorStates: Array<[StateLayerState, string]>
  containerStates: Array<[StateLayerState, string]>
  onContainerStates: Array<[StateLayerState, string]>
} {
  if (stateLayers === false) {
    return { colorStates: [], onColorStates: [], containerStates: [], onContainerStates: [] }
  }

  if (stateLayers !== undefined) {
    const states = normalizeStates(stateLayers)
    if (states.length === 0) {
      return { colorStates: [], onColorStates: [], containerStates: [], onContainerStates: [] }
    }
    const existing = custom.stateLayers
    return {
      colorStates: states.map((state) => {
        const existingHex = existing?.[`color${capitalizeState(state)}`]
        return [
          state,
          typeof existingHex === 'string'
            ? existingHex
            : stackStateLayers([state])({ base: custom.color, stateColor: custom.onColor }).finalHex,
        ]
      }),
      onColorStates: states.map((state) => {
        const existingHex = existing?.[`onColor${capitalizeState(state)}`]
        return [
          state,
          typeof existingHex === 'string'
            ? existingHex
            : stackStateLayers([state])({ base: custom.onColor, stateColor: custom.color }).finalHex,
        ]
      }),
      containerStates: states.map((state) => {
        const existingHex = existing?.[`colorContainer${capitalizeState(state)}`]
        return [
          state,
          typeof existingHex === 'string'
            ? existingHex
            : stackStateLayers([state])({
                base: custom.colorContainer,
                stateColor: custom.onColorContainer,
              }).finalHex,
        ]
      }),
      onContainerStates: states.map((state) => {
        const existingHex = existing?.[`onColorContainer${capitalizeState(state)}`]
        return [
          state,
          typeof existingHex === 'string'
            ? existingHex
            : stackStateLayers([state])({
                base: custom.onColorContainer,
                stateColor: custom.colorContainer,
              }).finalHex,
        ]
      }),
    }
  }

  const existing = custom.stateLayers
  if (!existing) {
    return { colorStates: [], onColorStates: [], containerStates: [], onContainerStates: [] }
  }

  const colorStates: Array<[StateLayerState, string]> = []
  const onColorStates: Array<[StateLayerState, string]> = []
  const containerStates: Array<[StateLayerState, string]> = []
  const onContainerStates: Array<[StateLayerState, string]> = []
  for (const state of StateLayerStates) {
    const cap = capitalizeState(state)
    const colorHex = existing[`color${cap}`]
    if (typeof colorHex === 'string') {
      colorStates.push([state, colorHex])
    }
    const onColorHex = existing[`onColor${cap}`]
    if (typeof onColorHex === 'string') {
      onColorStates.push([state, onColorHex])
    }
    const containerHex = existing[`colorContainer${cap}`]
    if (typeof containerHex === 'string') {
      containerStates.push([state, containerHex])
    }
    const onContainerHex = existing[`onColorContainer${cap}`]
    if (typeof onContainerHex === 'string') {
      onContainerStates.push([state, onContainerHex])
    }
  }
  return { colorStates, onColorStates, containerStates, onContainerStates }
}

export function toStateLayerRecord(
  scheme: DynamicSchemeColors,
  stateLayers?: StateLayersOption
): SchemeStateLayerTokens {
  return Object.fromEntries(resolveSystemStateLayersForExport(scheme, stateLayers))
}
