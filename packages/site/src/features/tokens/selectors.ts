import { createSelector } from '@reduxjs/toolkit'
import { StandardTones, TonalPalette, type PaletteSet } from '../../color/palettes.ts'
import type { RootState } from '../../app/store.ts'
import { simulateCvd } from '../../color/benchmark.ts'
import { getContrastRatio, hexToOkyct } from '../../color/math.ts'
import {
  StateLayerStates,
  StatefulSystemColorTokens,
  auditSchemeContrast,
  resolveSchemeStateLayers,
  type DynamicSchemeColors,
  type SchemeStateLayerTokens,
  type StateLayerState,
  type StatefulSystemColorToken,
  type SystemColorToken,
} from '../../color/scheme.ts'
import { stackStateLayers } from '../../color/stacker.ts'
import { selectCustomDark, selectCustomLight, selectDarkScheme, selectLightScheme, selectPalettes, selectScheme } from '../studio/selectors.ts'
import { SystemTokenDefinitions, TokensWithoutAaPreview, type TokenMeta } from './catalog.ts'

export interface StateLayerSwatch {
  state: StateLayerState
  lightHex: string
  darkHex: string
  lightSwatch: string
  darkSwatch: string
}

export interface SwatchInteractionColors {
  hovered: string
  focused: string
  pressed: string
}

export interface TokenCardModel {
  token: SystemColorToken
  label: string
  lightHex: string
  darkHex: string
  lightSwatch: string
  darkSwatch: string
  lightInteraction?: SwatchInteractionColors
  darkInteraction?: SwatchInteractionColors
  lightTone: number
  darkTone: number
  lightContrast: number | null
  darkContrast: number | null
  showAa: boolean
  lightAa: string
  darkAa: string
  stateLayers?: StateLayerSwatch[]
}

export interface CustomRoleModel {
  key: string
  labelKey: 'primary' | 'text' | 'container' | 'containerText'
  groupLabel: string
  groupName: string
  sourceHex: string
  lightHex: string
  darkHex: string
  lightSwatch: string
  darkSwatch: string
  lightInteraction: SwatchInteractionColors
  darkInteraction: SwatchInteractionColors
  lightTone: number
  darkTone: number
  lightContrast: number
  darkContrast: number
  lightAa: string
  darkAa: string
  stateLayers?: StateLayerSwatch[]
}

function toneOf(hex: string): number {
  return Math.round(hexToOkyct(hex).t)
}

function contrastFor(
  scheme: DynamicSchemeColors,
  token: SystemColorToken,
  paired?: SystemColorToken,
): number | null {
  if (paired === undefined) {
    return null
  }
  return getContrastRatio(hexToOkyct(scheme[token]).t, hexToOkyct(scheme[paired]).t)
}

const StatefulTokenSet = new Set<SystemColorToken>(StatefulSystemColorTokens)

function buildSystemStateSwatches(
  token: SystemColorToken,
  lightStates: SchemeStateLayerTokens,
  darkStates: SchemeStateLayerTokens,
  cvd: RootState['studio']['cvdType'],
): StateLayerSwatch[] | undefined {
  if (!StatefulTokenSet.has(token)) return undefined
  const statefulToken = token as StatefulSystemColorToken
  return StateLayerStates.map((state) => {
    const cap = `${state.charAt(0).toUpperCase()}${state.slice(1)}` as Capitalize<StateLayerState>
    const key = `${statefulToken}${cap}` as const
    const lightHex = lightStates[key] ?? '#000000'
    const darkHex = darkStates[key] ?? '#000000'
    return {
      state,
      lightHex,
      darkHex,
      lightSwatch: simulateCvd(lightHex, cvd),
      darkSwatch: simulateCvd(darkHex, cvd),
    }
  })
}

function buildCustomStateSwatches(
  lightBase: string,
  lightOverlay: string,
  darkBase: string,
  darkOverlay: string,
  cvd: RootState['studio']['cvdType'],
): StateLayerSwatch[] {
  return StateLayerStates.map((state) => {
    const lightHex = stackStateLayers([state])({ base: lightBase, stateColor: lightOverlay }).finalHex
    const darkHex = stackStateLayers([state])({ base: darkBase, stateColor: darkOverlay }).finalHex
    return {
      state,
      lightHex,
      darkHex,
      lightSwatch: simulateCvd(lightHex, cvd),
      darkSwatch: simulateCvd(darkHex, cvd),
    }
  })
}

function buildSystemInteraction(
  token: SystemColorToken,
  states: SchemeStateLayerTokens,
  cvd: RootState['studio']['cvdType'],
): SwatchInteractionColors | undefined {
  if (!StatefulTokenSet.has(token)) return undefined
  const statefulToken = token as StatefulSystemColorToken
  return {
    hovered: simulateCvd(states[`${statefulToken}Hovered`] ?? '#000000', cvd),
    focused: simulateCvd(states[`${statefulToken}Focused`] ?? '#000000', cvd),
    pressed: simulateCvd(states[`${statefulToken}Pressed`] ?? '#000000', cvd),
  }
}

function buildCustomInteraction(
  base: string,
  overlay: string,
  cvd: RootState['studio']['cvdType'],
): SwatchInteractionColors {
  return {
    hovered: simulateCvd(stackStateLayers(['hovered'])({ base, stateColor: overlay }).finalHex, cvd),
    focused: simulateCvd(stackStateLayers(['focused'])({ base, stateColor: overlay }).finalHex, cvd),
    pressed: simulateCvd(stackStateLayers(['pressed'])({ base, stateColor: overlay }).finalHex, cvd),
  }
}

function cardFor(
  meta: TokenMeta,
  light: DynamicSchemeColors,
  dark: DynamicSchemeColors,
  cvd: RootState['studio']['cvdType'],
  lightStates: SchemeStateLayerTokens,
  darkStates: SchemeStateLayerTokens,
  showStateLayers: boolean,
): TokenCardModel {
  const lightHex = light[meta.token]
  const darkHex = dark[meta.token]
  const paired = meta.pairedRole
  return {
    token: meta.token,
    label: meta.label,
    lightHex,
    darkHex,
    lightSwatch: simulateCvd(lightHex, cvd),
    darkSwatch: simulateCvd(darkHex, cvd),
    lightInteraction: buildSystemInteraction(meta.token, lightStates, cvd),
    darkInteraction: buildSystemInteraction(meta.token, darkStates, cvd),
    lightTone: toneOf(lightHex),
    darkTone: toneOf(darkHex),
    lightContrast: contrastFor(light, meta.token, paired),
    darkContrast: contrastFor(dark, meta.token, paired),
    showAa: !TokensWithoutAaPreview.has(meta.token),
    lightAa: simulateCvd(paired ? light[paired] : light.onSurface, cvd),
    darkAa: simulateCvd(paired ? dark[paired] : dark.onSurface, cvd),
    stateLayers: showStateLayers ? buildSystemStateSwatches(meta.token, lightStates, darkStates, cvd) : undefined,
  }
}

export const selectTokenCards = createSelector(
  [
    selectLightScheme,
    selectDarkScheme,
    (state: RootState) => state.studio.cvdType,
    (state: RootState) => state.tokens.showStateLayers,
  ],
  (light, dark, cvd, showStateLayers) => {
    const statesArg = showStateLayers ? true : (['hovered', 'focused', 'pressed'] as const)
    const lightStates = resolveSchemeStateLayers(light, statesArg)
    const darkStates = resolveSchemeStateLayers(dark, statesArg)
    return SystemTokenDefinitions.map((meta) =>
      cardFor(meta, light, dark, cvd, lightStates, darkStates, showStateLayers),
    )
  },
)

export const selectCustomRoleGroups = createSelector(
  [
    selectCustomLight,
    selectCustomDark,
    (state: RootState) => state.studio.cvdType,
    (state: RootState) => state.tokens.showStateLayers,
  ],
  (lightColors, darkColors, cvd, showStateLayers) => {
    const darkById = new Map(darkColors.map((item) => [item.id, item]))
    return lightColors.map((customLight) => {
      const customDark = darkById.get(customLight.id) ?? customLight
      const cap = customLight.name.charAt(0).toUpperCase() + customLight.name.slice(1)
      const roles: CustomRoleModel[] = [
        {
          key: customLight.name,
          labelKey: 'primary',
          groupLabel: customLight.label,
          groupName: customLight.name,
          sourceHex: customLight.sourceHex,
          lightHex: customLight.color,
          darkHex: customDark.color,
          lightSwatch: simulateCvd(customLight.color, cvd),
          darkSwatch: simulateCvd(customDark.color, cvd),
          lightInteraction: buildCustomInteraction(customLight.color, customLight.onColor, cvd),
          darkInteraction: buildCustomInteraction(customDark.color, customDark.onColor, cvd),
          lightTone: toneOf(customLight.color),
          darkTone: toneOf(customDark.color),
          lightContrast: customLight.wcagRatioColor,
          darkContrast: customDark.wcagRatioColor,
          lightAa: simulateCvd(customLight.onColor, cvd),
          darkAa: simulateCvd(customDark.onColor, cvd),
          stateLayers: showStateLayers
            ? buildCustomStateSwatches(customLight.color, customLight.onColor, customDark.color, customDark.onColor, cvd)
            : undefined,
        },
        {
          key: `on${cap}`,
          labelKey: 'text',
          groupLabel: customLight.label,
          groupName: customLight.name,
          sourceHex: customLight.sourceHex,
          lightHex: customLight.onColor,
          darkHex: customDark.onColor,
          lightSwatch: simulateCvd(customLight.onColor, cvd),
          darkSwatch: simulateCvd(customDark.onColor, cvd),
          lightInteraction: buildCustomInteraction(customLight.onColor, customLight.color, cvd),
          darkInteraction: buildCustomInteraction(customDark.onColor, customDark.color, cvd),
          lightTone: toneOf(customLight.onColor),
          darkTone: toneOf(customDark.onColor),
          lightContrast: customLight.wcagRatioColor,
          darkContrast: customDark.wcagRatioColor,
          lightAa: simulateCvd(customLight.color, cvd),
          darkAa: simulateCvd(customDark.color, cvd),
          stateLayers: showStateLayers
            ? buildCustomStateSwatches(customLight.onColor, customLight.color, customDark.onColor, customDark.color, cvd)
            : undefined,
        },
        {
          key: `${customLight.name}Container`,
          labelKey: 'container',
          groupLabel: customLight.label,
          groupName: customLight.name,
          sourceHex: customLight.sourceHex,
          lightHex: customLight.colorContainer,
          darkHex: customDark.colorContainer,
          lightSwatch: simulateCvd(customLight.colorContainer, cvd),
          darkSwatch: simulateCvd(customDark.colorContainer, cvd),
          lightInteraction: buildCustomInteraction(customLight.colorContainer, customLight.onColorContainer, cvd),
          darkInteraction: buildCustomInteraction(customDark.colorContainer, customDark.onColorContainer, cvd),
          lightTone: toneOf(customLight.colorContainer),
          darkTone: toneOf(customDark.colorContainer),
          lightContrast: customLight.wcagRatioContainer,
          darkContrast: customDark.wcagRatioContainer,
          lightAa: simulateCvd(customLight.onColorContainer, cvd),
          darkAa: simulateCvd(customDark.onColorContainer, cvd),
          stateLayers: showStateLayers
            ? buildCustomStateSwatches(
                customLight.colorContainer,
                customLight.onColorContainer,
                customDark.colorContainer,
                customDark.onColorContainer,
                cvd,
              )
            : undefined,
        },
        {
          key: `on${cap}Container`,
          labelKey: 'containerText',
          groupLabel: customLight.label,
          groupName: customLight.name,
          sourceHex: customLight.sourceHex,
          lightHex: customLight.onColorContainer,
          darkHex: customDark.onColorContainer,
          lightSwatch: simulateCvd(customLight.onColorContainer, cvd),
          darkSwatch: simulateCvd(customDark.onColorContainer, cvd),
          lightInteraction: buildCustomInteraction(customLight.onColorContainer, customLight.colorContainer, cvd),
          darkInteraction: buildCustomInteraction(customDark.onColorContainer, customDark.colorContainer, cvd),
          lightTone: toneOf(customLight.onColorContainer),
          darkTone: toneOf(customDark.onColorContainer),
          lightContrast: customLight.wcagRatioContainer,
          darkContrast: customDark.wcagRatioContainer,
          lightAa: simulateCvd(customLight.colorContainer, cvd),
          darkAa: simulateCvd(customDark.colorContainer, cvd),
          stateLayers: showStateLayers
            ? buildCustomStateSwatches(
                customLight.onColorContainer,
                customLight.colorContainer,
                customDark.onColorContainer,
                customDark.colorContainer,
                cvd,
              )
            : undefined,
        },
      ]
      return {
        id: customLight.id,
        label: customLight.label,
        name: customLight.name,
        sourceHex: customLight.sourceHex,
        roles,
      }
    })
  },
)

export const selectContrastAudits = createSelector([selectScheme], (scheme) => auditSchemeContrast(scheme))

const RampFamilies = [
  { id: 'brand', keys: ['primary', 'secondary', 'tertiary'] },
  { id: 'neutral', keys: ['neutral', 'neutralVariant'] },
  { id: 'semantic', keys: ['error', 'warning', 'success', 'info'] },
] as const satisfies readonly { id: string; keys: readonly (keyof PaletteSet)[] }[]

const TokensPageTones = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100] as const

export const selectRampFamilies = createSelector([selectPalettes, selectCustomLight], (palettes, customs) => {
  const families = RampFamilies.map((family) => ({
    id: family.id,
    rows: family.keys.map((key) => ({
      key,
      label: undefined as string | undefined,
      hue: palettes[key].hue,
      swatches: TokensPageTones.map((tone) => ({
        tone,
        hex: palettes[key].tone(tone),
      })),
    })),
  }))

  if (customs.length === 0) {
    return families
  }

  return [
    ...families,
    {
      id: 'custom',
      rows: customs.map((color) => {
        const palette = TonalPalette.fromHex(color.harmonizedHex)
        return {
          key: color.id,
          label: color.label,
          hue: palette.hue,
          swatches: TokensPageTones.map((tone) => ({
            tone,
            hex: palette.tone(tone),
          })),
        }
      }),
    },
  ]
})

