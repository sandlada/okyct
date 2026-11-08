/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer 3: Application Use-Case]
 * 按需定制 MD3 CSS Tokens 动态配色方案求解、O(1) 代数对比度守卫与扩展语义色编排用例
 * 约束：仅依赖 ../domain 与 ../ports（通过 IDisplayPhysicsPort 依赖倒置调用物理面板能力，零 adapters 依赖）
 */

import { getContrastRatio, getApcaContrast, solveTonesForContrast, hexToOkyct } from '../domain/index.ts'
import {
  SystemColorTokens,
  type SystemColorToken,
  type DynamicSchemeColors,
  type CustomColorConfig,
  type ResolvedCustomColor,
  type ContrastAuditItem,
  type ThemeMode,
} from '../ports/inbound/scheme-building.port.ts'
import type {
  EmissivePanelType,
  EmissiveSchemeOptions,
  IDisplayPhysicsPort,
} from '../ports/outbound/display-physics.port.ts'
import { TonalPalette, type PaletteSet, harmonizeHex } from './palette.use-case.ts'

export {
  SystemColorTokens,
  type SystemColorToken,
  type DynamicSchemeColors,
  type CustomColorConfig,
  type ResolvedCustomColor,
  type ContrastAuditItem,
  type ThemeMode,
  type EmissiveSchemeOptions,
}

export type SchemeRoleKind = 'surface' | 'foreground' | 'accent'

export interface SchemeTokenRoleBinding {
  palette: keyof PaletteSet
  kind: SchemeRoleKind
}

/**
 * 每个系统 Token 对应的调色板源与物理渲染角色分类映射表。
 * 当在 SystemColorTokens 增删 Token 时，TypeScript 会在此处强制要求同步更新。
 */
export const SchemeTokenRoleMap: Record<SystemColorToken, SchemeTokenRoleBinding> = {
  primary: { palette: 'primary', kind: 'accent' },
  onPrimary: { palette: 'primary', kind: 'foreground' },
  primaryContainer: { palette: 'primary', kind: 'accent' },
  onPrimaryContainer: { palette: 'primary', kind: 'foreground' },
  primaryFixed: { palette: 'primary', kind: 'accent' },
  primaryFixedDim: { palette: 'primary', kind: 'accent' },
  onPrimaryFixed: { palette: 'primary', kind: 'foreground' },
  onPrimaryFixedVariant: { palette: 'primary', kind: 'foreground' },

  secondary: { palette: 'secondary', kind: 'accent' },
  onSecondary: { palette: 'secondary', kind: 'foreground' },
  secondaryContainer: { palette: 'secondary', kind: 'accent' },
  onSecondaryContainer: { palette: 'secondary', kind: 'foreground' },

  tertiary: { palette: 'tertiary', kind: 'accent' },
  onTertiary: { palette: 'tertiary', kind: 'foreground' },
  tertiaryContainer: { palette: 'tertiary', kind: 'accent' },
  onTertiaryContainer: { palette: 'tertiary', kind: 'foreground' },

  error: { palette: 'error', kind: 'accent' },
  onError: { palette: 'error', kind: 'foreground' },
  errorContainer: { palette: 'error', kind: 'accent' },
  onErrorContainer: { palette: 'error', kind: 'foreground' },

  warning: { palette: 'warning', kind: 'accent' },
  onWarning: { palette: 'warning', kind: 'foreground' },
  warningContainer: { palette: 'warning', kind: 'accent' },
  onWarningContainer: { palette: 'warning', kind: 'foreground' },

  success: { palette: 'success', kind: 'accent' },
  onSuccess: { palette: 'success', kind: 'foreground' },
  successContainer: { palette: 'success', kind: 'accent' },
  onSuccessContainer: { palette: 'success', kind: 'foreground' },

  info: { palette: 'info', kind: 'accent' },
  onInfo: { palette: 'info', kind: 'foreground' },
  infoContainer: { palette: 'info', kind: 'accent' },
  onInfoContainer: { palette: 'info', kind: 'foreground' },

  surface: { palette: 'neutral', kind: 'surface' },
  onSurface: { palette: 'neutral', kind: 'foreground' },
  surfaceVariant: { palette: 'neutralVariant', kind: 'surface' },
  onSurfaceVariant: { palette: 'neutralVariant', kind: 'foreground' },

  surfaceDim: { palette: 'neutral', kind: 'surface' },
  surfaceBright: { palette: 'neutral', kind: 'surface' },
  surfaceContainerLowest: { palette: 'neutral', kind: 'surface' },
  surfaceContainerLow: { palette: 'neutral', kind: 'surface' },
  surfaceContainer: { palette: 'neutral', kind: 'surface' },
  surfaceContainerHigh: { palette: 'neutral', kind: 'surface' },
  surfaceContainerHighest: { palette: 'neutral', kind: 'surface' },

  outline: { palette: 'neutralVariant', kind: 'foreground' },
  outlineVariant: { palette: 'neutralVariant', kind: 'surface' },
  inverseSurface: { palette: 'neutral', kind: 'surface' },
  inverseOnSurface: { palette: 'neutral', kind: 'foreground' },
  inversePrimary: { palette: 'primary', kind: 'accent' },
  inverseOnPrimary: { palette: 'primary', kind: 'foreground' },
  inversePrimaryContainer: { palette: 'primary', kind: 'accent' },
  inverseOnPrimaryContainer: { palette: 'primary', kind: 'foreground' },
  scrim: { palette: 'neutral', kind: 'surface' },
  shadow: { palette: 'neutral', kind: 'surface' },
}

/**
 * 依据色阶集合、对比度系数 (-0.5 ~ +1.0) 与注入的 IDisplayPhysicsPort 求解完整的语义颜色字典
 */
export function buildDynamicSchemeWithPhysics(
  palettes: PaletteSet,
  isDark: boolean,
  contrastLevel = 0.0,
  emissiveOptions: EmissiveSchemeOptions = {},
  physicsPort?: Pick<
    IDisplayPhysicsPort,
    'getPanelSpec' | 'applyBlueBurnInGuard' | 'applySubpixelEdgeCompensation'
  >
): DynamicSchemeColors {
  const c = Math.max(-0.5, Math.min(1.0, contrastLevel))
  const profile: EmissivePanelType = emissiveOptions.profile ?? 'standard-lcd'
  const burnInGuard = emissiveOptions.burnInGuard ?? false
  const antiFringing = emissiveOptions.antiFringing ?? false

  const panelSpec = physicsPort
    ? physicsPort.getPanelSpec(profile)
    : {
        lightPeakToneCap: 100,
        darkSurfaceTones: {
          lowest: 4,
          surface: 6,
          low: 10,
          container: 12,
          high: 17,
          highest: 22,
          bright: 24,
        },
      }

  const peakWhiteCap = panelSpec.lightPeakToneCap

  const adjustTone = (baseTone: number, polarity: 'lighten' | 'darken', delta = 15): number => {
    if (c === 0) return baseTone
    const factor = c > 0 ? c : c * 0.5
    if (polarity === 'lighten') {
      return Math.min(peakWhiteCap, Math.round(baseTone + delta * factor))
    } else {
      return Math.max(0, Math.round(baseTone - delta * factor))
    }
  }

  const lightSurfaceCap = profile === 'micro-oled-xr' ? 94 : 98
  const darkFloors = panelSpec.darkSurfaceTones

  const tones: Record<SystemColorToken, number> = !isDark
    ? {
        // Light Mode
        primary: adjustTone(40, 'darken', 12),
        onPrimary: 100,
        primaryContainer: adjustTone(90, 'lighten', 5),
        onPrimaryContainer: adjustTone(10, 'darken', 6),
        primaryFixed: 90,
        primaryFixedDim: 80,
        onPrimaryFixed: 10,
        onPrimaryFixedVariant: 30,

        secondary: adjustTone(40, 'darken', 10),
        onSecondary: 100,
        secondaryContainer: adjustTone(90, 'lighten', 5),
        onSecondaryContainer: adjustTone(10, 'darken', 6),

        tertiary: adjustTone(40, 'darken', 10),
        onTertiary: 100,
        tertiaryContainer: adjustTone(90, 'lighten', 5),
        onTertiaryContainer: adjustTone(10, 'darken', 6),

        error: adjustTone(40, 'darken', 10),
        onError: 100,
        errorContainer: 90,
        onErrorContainer: 10,

        warning: adjustTone(42, 'darken', 10),
        onWarning: 100,
        warningContainer: 90,
        onWarningContainer: 12,

        success: adjustTone(38, 'darken', 10),
        onSuccess: 100,
        successContainer: 90,
        onSuccessContainer: 10,

        info: adjustTone(40, 'darken', 10),
        onInfo: 100,
        infoContainer: adjustTone(90, 'lighten', 5),
        onInfoContainer: adjustTone(10, 'darken', 6),

        surface: Math.min(lightSurfaceCap, adjustTone(98, 'lighten', 2)),
        onSurface: adjustTone(10, 'darken', 8),
        surfaceVariant: adjustTone(90, 'darken', 4),
        onSurfaceVariant: adjustTone(30, 'darken', 10),

        surfaceDim: 87,
        surfaceBright: lightSurfaceCap,
        surfaceContainerLowest: profile === 'micro-oled-xr' ? 96 : 100,
        surfaceContainerLow: profile === 'micro-oled-xr' ? 92 : 96,
        surfaceContainer: profile === 'micro-oled-xr' ? 90 : 94,
        surfaceContainerHigh: profile === 'micro-oled-xr' ? 88 : 92,
        surfaceContainerHighest: profile === 'micro-oled-xr' ? 85 : 90,

        outline: adjustTone(50, 'darken', 15),
        outlineVariant: adjustTone(80, 'darken', 10),
        inverseSurface: 20,
        inverseOnSurface: 95,
        inversePrimary: 80,
        inverseOnPrimary: 20,
        inversePrimaryContainer: adjustTone(30, 'darken', 6),
        inverseOnPrimaryContainer: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 6)),
        scrim: 0,
        shadow: 0,
      }
    : {
        // Dark Mode
        primary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 12)),
        onPrimary: adjustTone(20, 'darken', 10),
        primaryContainer: adjustTone(30, 'darken', 6),
        onPrimaryContainer: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 6)),
        primaryFixed: 90,
        primaryFixedDim: 80,
        onPrimaryFixed: 10,
        onPrimaryFixedVariant: 30,

        secondary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onSecondary: adjustTone(20, 'darken', 10),
        secondaryContainer: adjustTone(30, 'darken', 6),
        onSecondaryContainer: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 6)),

        tertiary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onTertiary: adjustTone(20, 'darken', 10),
        tertiaryContainer: adjustTone(30, 'darken', 6),
        onTertiaryContainer: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 6)),

        error: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onError: 20,
        errorContainer: 30,
        onErrorContainer: Math.min(peakWhiteCap, 90),

        warning: Math.min(peakWhiteCap, adjustTone(82, 'lighten', 10)),
        onWarning: 20,
        warningContainer: 32,
        onWarningContainer: Math.min(peakWhiteCap, 90),

        success: Math.min(peakWhiteCap, adjustTone(78, 'lighten', 10)),
        onSuccess: 18,
        successContainer: 28,
        onSuccessContainer: Math.min(peakWhiteCap, 90),

        info: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onInfo: 20,
        infoContainer: 30,
        onInfoContainer: Math.min(peakWhiteCap, 90),

        surface: darkFloors.surface,
        onSurface: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 8)),
        surfaceVariant: adjustTone(30, 'lighten', 5),
        onSurfaceVariant: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),

        surfaceDim: darkFloors.surface,
        surfaceBright: darkFloors.bright,
        surfaceContainerLowest: darkFloors.lowest,
        surfaceContainerLow: darkFloors.low,
        surfaceContainer: darkFloors.container,
        surfaceContainerHigh: darkFloors.high,
        surfaceContainerHighest: darkFloors.highest,

        outline: adjustTone(60, 'lighten', 15),
        outlineVariant: adjustTone(30, 'lighten', 10),
        inverseSurface: Math.min(peakWhiteCap, 90),
        inverseOnSurface: 20,
        inversePrimary: 40,
        inverseOnPrimary: 100,
        inversePrimaryContainer: adjustTone(90, 'lighten', 5),
        inverseOnPrimaryContainer: adjustTone(10, 'darken', 6),
        scrim: 0,
        shadow: 0,
      }

  // O(1) 代数解析对比度守卫 (Algebraic Contrast Guard)
  const targetTextRatio = c >= 0.8 ? 7.0 : c >= 0.35 ? 5.8 : 4.5
  const targetOutlineRatio = c >= 0.5 ? 4.5 : 3.0

  const enforceAlgebraicContrast = (
    fgToneKey: SystemColorToken,
    bgToneKey: SystemColorToken,
    minRatio: number
  ) => {
    const fgT = tones[fgToneKey]
    const bgT = tones[bgToneKey]
    if (getContrastRatio(fgT, bgT) >= minRatio) return

    const solved = solveTonesForContrast(bgT, minRatio)
    if (fgT >= bgT) {
      if (solved.lightForegroundTone !== null) {
        tones[fgToneKey] = solved.lightForegroundTone
      } else if (solved.darkForegroundTone !== null) {
        tones[fgToneKey] = solved.darkForegroundTone
      } else {
        tones[fgToneKey] = 100
      }
    } else {
      if (solved.darkForegroundTone !== null) {
        tones[fgToneKey] = solved.darkForegroundTone
      } else if (solved.lightForegroundTone !== null) {
        tones[fgToneKey] = solved.lightForegroundTone
      } else {
        tones[fgToneKey] = 0
      }
    }
  }

  enforceAlgebraicContrast('onPrimary', 'primary', targetTextRatio)
  enforceAlgebraicContrast('onPrimaryContainer', 'primaryContainer', targetTextRatio)
  enforceAlgebraicContrast('onSecondary', 'secondary', targetTextRatio)
  enforceAlgebraicContrast('onSecondaryContainer', 'secondaryContainer', targetTextRatio)
  enforceAlgebraicContrast('onTertiary', 'tertiary', targetTextRatio)
  enforceAlgebraicContrast('onTertiaryContainer', 'tertiaryContainer', targetTextRatio)
  enforceAlgebraicContrast('onSurface', 'surface', targetTextRatio)
  enforceAlgebraicContrast('onSurface', 'surfaceContainer', targetTextRatio)
  enforceAlgebraicContrast('onSurfaceVariant', 'surfaceVariant', targetTextRatio)
  enforceAlgebraicContrast('onError', 'error', targetTextRatio)
  enforceAlgebraicContrast('onErrorContainer', 'errorContainer', targetTextRatio)
  enforceAlgebraicContrast('onWarning', 'warning', targetTextRatio)
  enforceAlgebraicContrast('onWarningContainer', 'warningContainer', targetTextRatio)
  enforceAlgebraicContrast('onSuccess', 'success', targetTextRatio)
  enforceAlgebraicContrast('onSuccessContainer', 'successContainer', targetTextRatio)
  enforceAlgebraicContrast('onInfo', 'info', targetTextRatio)
  enforceAlgebraicContrast('onInfoContainer', 'infoContainer', targetTextRatio)
  enforceAlgebraicContrast('inverseOnSurface', 'inverseSurface', targetTextRatio)
  enforceAlgebraicContrast('inverseOnPrimary', 'inversePrimary', targetTextRatio)
  enforceAlgebraicContrast('inverseOnPrimaryContainer', 'inversePrimaryContainer', targetTextRatio)
  enforceAlgebraicContrast('outline', 'surface', targetOutlineRatio)

  const resolveRoleHex = (
    palette: TonalPalette,
    tone: number,
    roleKind: SchemeRoleKind
  ): string => {
    if (tone <= 0) return '#000000'
    let hex = palette.tone(tone)
    if (physicsPort) {
      if (burnInGuard && roleKind !== 'surface') {
        hex = physicsPort.applyBlueBurnInGuard(hex)
      }
      if (antiFringing) {
        hex = physicsPort.applySubpixelEdgeCompensation(hex, profile, roleKind)
      }
    }
    return hex
  }

  const resolvedColors = {} as Record<SystemColorToken, string>
  for (const token of SystemColorTokens) {
    const binding = SchemeTokenRoleMap[token]
    resolvedColors[token] = resolveRoleHex(palettes[binding.palette], tones[token], binding.kind)
  }

  return {
    ...resolvedColors,
    tones,
  }
}

/**
 * 推导自定义扩展品牌/业务语义色的完整四元组 (color, onColor, colorContainer, onColorContainer)
 */
export function resolveCustomColors(
  configs: readonly CustomColorConfig[],
  primarySeedHex: string,
  isDark: boolean,
  contrastLevel = 0.0
): ResolvedCustomColor[] {
  const targetRatio = contrastLevel >= 0.8 ? 7.0 : contrastLevel >= 0.35 ? 5.8 : 4.5

  return configs.map((cfg) => {
    const effectiveHex = cfg.harmonize
      ? harmonizeHex(cfg.sourceHex, primarySeedHex, 18)
      : cfg.sourceHex

    const origOkyct = hexToOkyct(cfg.sourceHex)
    const harmOkyct = hexToOkyct(effectiveHex)
    let hueDiff = Math.abs(harmOkyct.h - origOkyct.h) % 360
    if (hueDiff > 180) hueDiff = 360 - hueDiff

    const palette = TonalPalette.fromHex(effectiveHex)

    const colorTone = isDark ? (contrastLevel > 0.3 ? 86 : 80) : (contrastLevel > 0.3 ? 32 : 40)
    let onColorTone = isDark ? 20 : 100
    const containerTone = isDark ? 30 : 90
    let onContainerTone = isDark ? 90 : 10

    if (getContrastRatio(onColorTone, colorTone) < targetRatio) {
      const solved = solveTonesForContrast(colorTone, targetRatio)
      onColorTone = isDark
        ? (solved.darkForegroundTone ?? 0)
        : (solved.lightForegroundTone ?? 100)
    }
    if (getContrastRatio(onContainerTone, containerTone) < targetRatio) {
      const solved = solveTonesForContrast(containerTone, targetRatio)
      onContainerTone = isDark
        ? (solved.lightForegroundTone ?? 100)
        : (solved.darkForegroundTone ?? 0)
    }

    return {
      id: cfg.id,
      name: cfg.name,
      label: cfg.label,
      sourceHex: cfg.sourceHex,
      harmonizedHex: effectiveHex,
      hueShiftDeg: parseFloat(hueDiff.toFixed(1)),
      color: palette.tone(colorTone),
      onColor: palette.tone(onColorTone),
      colorContainer: palette.tone(containerTone),
      onColorContainer: palette.tone(onContainerTone),
      wcagRatioColor: parseFloat(getContrastRatio(onColorTone, colorTone).toFixed(2)),
      wcagRatioContainer: parseFloat(getContrastRatio(onContainerTone, containerTone).toFixed(2)),
    }
  })
}

/**
 * 汇总无障碍对比度审计结果项
 */
export function auditSchemeContrast(scheme: DynamicSchemeColors): ContrastAuditItem[] {
  const pairs: ReadonlyArray<{
    name: string
    fg: SystemColorToken
    bg: SystemColorToken
    minRatio: number
    minApca: number
  }> = [
    { name: '主要按钮文本', fg: 'onPrimary', bg: 'primary', minRatio: 4.5, minApca: 60 },
    { name: '主要容器文本', fg: 'onPrimaryContainer', bg: 'primaryContainer', minRatio: 4.5, minApca: 60 },
    { name: '次要按钮文本', fg: 'onSecondary', bg: 'secondary', minRatio: 4.5, minApca: 60 },
    { name: '次要容器文本', fg: 'onSecondaryContainer', bg: 'secondaryContainer', minRatio: 4.5, minApca: 60 },
    { name: '第三强调容器', fg: 'onTertiaryContainer', bg: 'tertiaryContainer', minRatio: 4.5, minApca: 60 },
    { name: '正文文本 / 基础背景', fg: 'onSurface', bg: 'surface', minRatio: 4.5, minApca: 60 },
    { name: '次级正文 / 变体表面', fg: 'onSurfaceVariant', bg: 'surfaceVariant', minRatio: 4.5, minApca: 60 },
    { name: '卡片容器文本', fg: 'onSurface', bg: 'surfaceContainer', minRatio: 4.5, minApca: 60 },
    { name: '错误按钮文本', fg: 'onError', bg: 'error', minRatio: 4.5, minApca: 60 },
    { name: '错误容器文本', fg: 'onErrorContainer', bg: 'errorContainer', minRatio: 4.5, minApca: 60 },
    { name: '警告容器文本', fg: 'onWarningContainer', bg: 'warningContainer', minRatio: 4.5, minApca: 60 },
    { name: '成功容器文本', fg: 'onSuccessContainer', bg: 'successContainer', minRatio: 4.5, minApca: 60 },
    { name: '信息按钮文本', fg: 'onInfo', bg: 'info', minRatio: 4.5, minApca: 60 },
    { name: '信息容器文本', fg: 'onInfoContainer', bg: 'infoContainer', minRatio: 4.5, minApca: 60 },
    { name: '倒置表面文本', fg: 'inverseOnSurface', bg: 'inverseSurface', minRatio: 4.5, minApca: 60 },
    { name: '倒置主色文本', fg: 'inverseOnPrimary', bg: 'inversePrimary', minRatio: 4.5, minApca: 60 },
    { name: '倒置主色容器', fg: 'inverseOnPrimaryContainer', bg: 'inversePrimaryContainer', minRatio: 4.5, minApca: 60 },
  ]

  return pairs.map((p) => {
    const fgTone = scheme.tones[p.fg] ?? 50
    const bgTone = scheme.tones[p.bg] ?? 50
    const wcag = getContrastRatio(fgTone, bgTone)
    const apca = Math.abs(getApcaContrast(fgTone, bgTone))

    return {
      name: p.name,
      fgRole: p.fg,
      bgRole: p.bg,
      fgTone,
      bgTone,
      wcagRatio: parseFloat(wcag.toFixed(2)),
      wcagPassAA: wcag >= 4.5,
      wcagPassAAA: wcag >= 7.0,
      apcaLc: apca,
      apcaPass: apca >= 60,
    }
  })
}
