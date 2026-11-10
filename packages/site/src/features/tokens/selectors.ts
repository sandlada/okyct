import { createSelector } from '@reduxjs/toolkit'
import { STANDARD_TONES, TonalPalette, type PaletteSet } from '../../color/palettes.ts'
import type { RootState } from '../../app/store.ts'
import { simulateCvd } from '../../color/benchmark.ts'
import { getContrastRatio, hexToOkyct } from '../../color/math.ts'
import { auditSchemeContrast, type DynamicSchemeColors, type SystemColorToken } from '../../color/scheme.ts'
import { selectCustomDark, selectCustomLight, selectDarkScheme, selectLightScheme, selectPalettes, selectScheme } from '../studio/selectors.ts'
import { SystemTokenDefinitions, TokensWithoutAaPreview, type TokenMeta } from './catalog.ts'

export interface TokenCardModel {
  token: SystemColorToken
  label: string
  lightHex: string
  darkHex: string
  lightSwatch: string
  darkSwatch: string
  lightTone: number
  darkTone: number
  lightContrast: number | null
  darkContrast: number | null
  showAa: boolean
  lightAa: string
  darkAa: string
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
  lightTone: number
  darkTone: number
  lightContrast: number
  darkContrast: number
  lightAa: string
  darkAa: string
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

function cardFor(meta: TokenMeta, light: DynamicSchemeColors, dark: DynamicSchemeColors, cvd: RootState['studio']['cvdType']): TokenCardModel {
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
    lightTone: toneOf(lightHex),
    darkTone: toneOf(darkHex),
    lightContrast: contrastFor(light, meta.token, paired),
    darkContrast: contrastFor(dark, meta.token, paired),
    showAa: !TokensWithoutAaPreview.has(meta.token),
    lightAa: simulateCvd(paired ? light[paired] : light.onSurface, cvd),
    darkAa: simulateCvd(paired ? dark[paired] : dark.onSurface, cvd),
  }
}

export const selectTokenCards = createSelector(
  [selectLightScheme, selectDarkScheme, (state: RootState) => state.studio.cvdType],
  (light, dark, cvd) => SystemTokenDefinitions.map((meta) => cardFor(meta, light, dark, cvd)),
)

export const selectCustomRoleGroups = createSelector(
  [selectCustomLight, selectCustomDark, (state: RootState) => state.studio.cvdType],
  (lightColors, darkColors, cvd) => {
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
          lightTone: toneOf(customLight.color),
          darkTone: toneOf(customDark.color),
          lightContrast: customLight.wcagRatioColor,
          darkContrast: customDark.wcagRatioColor,
          lightAa: simulateCvd(customLight.onColor, cvd),
          darkAa: simulateCvd(customDark.onColor, cvd),
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
          lightTone: toneOf(customLight.onColor),
          darkTone: toneOf(customDark.onColor),
          lightContrast: customLight.wcagRatioColor,
          darkContrast: customDark.wcagRatioColor,
          lightAa: simulateCvd(customLight.color, cvd),
          darkAa: simulateCvd(customDark.color, cvd),
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
          lightTone: toneOf(customLight.colorContainer),
          darkTone: toneOf(customDark.colorContainer),
          lightContrast: customLight.wcagRatioContainer,
          darkContrast: customDark.wcagRatioContainer,
          lightAa: simulateCvd(customLight.onColorContainer, cvd),
          darkAa: simulateCvd(customDark.onColorContainer, cvd),
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
          lightTone: toneOf(customLight.onColorContainer),
          darkTone: toneOf(customDark.onColorContainer),
          lightContrast: customLight.wcagRatioContainer,
          darkContrast: customDark.wcagRatioContainer,
          lightAa: simulateCvd(customLight.colorContainer, cvd),
          darkAa: simulateCvd(customDark.colorContainer, cvd),
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

export const selectRampFamilies = createSelector([selectPalettes, selectCustomLight], (palettes, customs) => {
  const families = RampFamilies.map((family) => ({
    id: family.id,
    rows: family.keys.map((key) => ({
      key,
      label: undefined as string | undefined,
      hue: palettes[key].hue,
      swatches: STANDARD_TONES.map((tone) => ({
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
          swatches: STANDARD_TONES.map((tone) => ({
            tone,
            hex: palette.tone(tone),
          })),
        }
      }),
    },
  ]
})

