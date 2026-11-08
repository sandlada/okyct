/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * [Hexagonal Layer: Inbound Port]
 * 按需定制 MD3 CSS Tokens 动态方案求解、扩展色四元组与对比度审计驱动端契约 (一个口对应一个文件)
 * 约束：仅依赖 domain/models 与同层契约
 */

import type { PaletteSet, ITonalPalettePort } from './palette-generation.port.ts'
import type { EmissiveSchemeOptions } from '../outbound/display-physics.port.ts'

export type ThemeMode = 'light' | 'dark'

export interface CustomColorConfig {
  id: string
  name: string        // 语义标识符 (如 'info', 'brandGold')
  label: string       // 显示名称 (如 '信息蓝', '品牌金')
  sourceHex: string   // 原始输入 Hex
  harmonize: boolean  // 是否向主色进行色相和谐偏移
}

export interface ResolvedCustomColor {
  id: string
  name: string
  label: string
  sourceHex: string
  harmonizedHex: string
  hueShiftDeg: number
  color: string
  onColor: string
  colorContainer: string
  onColorContainer: string
  wcagRatioColor: number
  wcagRatioContainer: number
}

/**
 * 系统色彩 Token 唯一权威清单 (SSOT)
 * 按需在此增删 Token 后，TypeScript 将自动推导 SystemColorToken 与 DynamicSchemeColors，
 * 并在编译期锁定所有需要同步更新的求解与映射实现。
 */
export const SystemColorTokens = [
  // 核心色彩四元组 (Primary)
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'primaryFixed',
  'primaryFixedDim',
  'onPrimaryFixed',
  'onPrimaryFixedVariant',

  // 次要色彩 (Secondary)
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',

  // 第三强调色 (Tertiary)
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',

  // 语义错误 (Error)
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',

  // 语义警告与成功 (Warning & Success)
  'warning',
  'onWarning',
  'warningContainer',
  'onWarningContainer',

  'success',
  'onSuccess',
  'successContainer',
  'onSuccessContainer',

  // 语义信息 (Info)
  'info',
  'onInfo',
  'infoContainer',
  'onInfoContainer',

  // MD3 五级表面容器体系 (Surface Container Hierarchy)
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',

  // 结构边框与倒置表面 (Outline & Inverse)
  'outline',
  'outlineVariant',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'inverseOnPrimary',
  'inversePrimaryContainer',
  'inverseOnPrimaryContainer',
  'scrim',
  'shadow',
] as const

export type SystemColorToken = (typeof SystemColorTokens)[number]

export type DynamicSchemeColors = {
  [K in SystemColorToken]: string
} & {
  // 对应的色调值 (Tone 记录，方便色度学分析与无障碍审计)
  tones: Record<SystemColorToken, number>
}

export interface ContrastAuditItem {
  name: string
  fgRole: SystemColorToken
  bgRole: SystemColorToken
  fgTone: number
  bgTone: number
  wcagRatio: number
  wcagPassAA: boolean
  wcagPassAAA: boolean
  apcaLc: number
  apcaPass: boolean
}

export interface ISchemeBuildingPort<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  buildDynamicScheme(
    palettes: PaletteSet<TPalette>,
    isDark: boolean,
    contrastLevel?: number,
    emissiveOptions?: EmissiveSchemeOptions
  ): DynamicSchemeColors

  resolveCustomColors(
    configs: readonly CustomColorConfig[],
    primarySeedHex: string,
    isDark: boolean,
    contrastLevel?: number
  ): ResolvedCustomColor[]

  auditSchemeContrast(scheme: DynamicSchemeColors): ContrastAuditItem[]
}
