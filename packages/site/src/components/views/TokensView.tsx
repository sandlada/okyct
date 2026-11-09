
import React, { useState, useMemo } from 'react'
import {
  DynamicSchemeColors,
  ResolvedCustomColor,
  SystemColorToken,
} from '../../color/scheme.ts'
import { hexToOkyct, getContrastRatio } from '../../color/math.ts'
import { CvdType, simulateCvd } from '../../color/benchmark.ts'
import {
  Check,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Sliders,
} from 'lucide-react'
import { useI18n } from '../../i18n/index.tsx'
import { SchemeContrastAuditTable } from '../tokens/SchemeContrastAuditTable.tsx'
import { TonalPaletteRamps } from '../tokens/TonalPaletteRamps.tsx'
import type { PaletteSet } from '../../color/palettes.ts'

interface TokensViewProps {
  palettes: PaletteSet
  scheme: DynamicSchemeColors
  lightScheme: DynamicSchemeColors
  darkScheme: DynamicSchemeColors
  customColorsLight: ResolvedCustomColor[]
  customColorsDark: ResolvedCustomColor[]
  cvdType: CvdType
}

export type TokenCategory =
  | 'all'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'status'
  | 'surface'
  | 'inverse-utility'
  | 'custom'

interface TokenMeta {
  token: SystemColorToken
  label: string
  category: TokenCategory
  pairedRole?: SystemColorToken
}

export const TokenCategories = [
  { id: 'all', label: 'All' },
  { id: 'primary', label: 'Primary' },
  { id: 'secondary', label: 'Secondary' },
  { id: 'tertiary', label: 'Tertiary' },
  { id: 'status', label: 'Status' },
  { id: 'surface', label: 'Surface' },
  { id: 'inverse-utility', label: 'Inverse & utility' },
  { id: 'custom', label: 'Custom' },
] as const

export const SystemTokenDefinitions: TokenMeta[] = [
  // Primary
  { token: 'primary', label: 'Primary', category: 'primary', pairedRole: 'onPrimary' },
  { token: 'onPrimary', label: 'On primary', category: 'primary', pairedRole: 'primary' },
  { token: 'primaryContainer', label: 'Primary container', category: 'primary', pairedRole: 'onPrimaryContainer' },
  { token: 'onPrimaryContainer', label: 'On primary container', category: 'primary', pairedRole: 'primaryContainer' },
  { token: 'primaryFixed', label: 'Primary fixed', category: 'primary', pairedRole: 'onPrimaryFixed' },
  { token: 'primaryFixedDim', label: 'Primary fixed dim', category: 'primary', pairedRole: 'onPrimaryFixedVariant' },
  { token: 'onPrimaryFixed', label: 'On primary fixed', category: 'primary', pairedRole: 'primaryFixed' },
  { token: 'onPrimaryFixedVariant', label: 'On primary fixed variant', category: 'primary', pairedRole: 'primaryFixedDim' },

  // Secondary
  { token: 'secondary', label: 'Secondary', category: 'secondary', pairedRole: 'onSecondary' },
  { token: 'onSecondary', label: 'On secondary', category: 'secondary', pairedRole: 'secondary' },
  { token: 'secondaryContainer', label: 'Secondary container', category: 'secondary', pairedRole: 'onSecondaryContainer' },
  { token: 'onSecondaryContainer', label: 'On secondary container', category: 'secondary', pairedRole: 'secondaryContainer' },

  // Tertiary
  { token: 'tertiary', label: 'Tertiary', category: 'tertiary', pairedRole: 'onTertiary' },
  { token: 'onTertiary', label: 'On tertiary', category: 'tertiary', pairedRole: 'tertiary' },
  { token: 'tertiaryContainer', label: 'Tertiary container', category: 'tertiary', pairedRole: 'onTertiaryContainer' },
  { token: 'onTertiaryContainer', label: 'On tertiary container', category: 'tertiary', pairedRole: 'tertiaryContainer' },

  // Status (Error / Warning / Success / Info)
  { token: 'error', label: 'Error', category: 'status', pairedRole: 'onError' },
  { token: 'onError', label: 'On error', category: 'status', pairedRole: 'error' },
  { token: 'errorContainer', label: 'Error container', category: 'status', pairedRole: 'onErrorContainer' },
  { token: 'onErrorContainer', label: 'On error container', category: 'status', pairedRole: 'errorContainer' },

  { token: 'warning', label: 'Warning', category: 'status', pairedRole: 'onWarning' },
  { token: 'onWarning', label: 'On warning', category: 'status', pairedRole: 'warning' },
  { token: 'warningContainer', label: 'Warning container', category: 'status', pairedRole: 'onWarningContainer' },
  { token: 'onWarningContainer', label: 'On warning container', category: 'status', pairedRole: 'warningContainer' },

  { token: 'success', label: 'Success', category: 'status', pairedRole: 'onSuccess' },
  { token: 'onSuccess', label: 'On success', category: 'status', pairedRole: 'success' },
  { token: 'successContainer', label: 'Success container', category: 'status', pairedRole: 'onSuccessContainer' },
  { token: 'onSuccessContainer', label: 'On success container', category: 'status', pairedRole: 'successContainer' },

  { token: 'info', label: 'Info', category: 'status', pairedRole: 'onInfo' },
  { token: 'onInfo', label: 'On info', category: 'status', pairedRole: 'info' },
  { token: 'infoContainer', label: 'Info container', category: 'status', pairedRole: 'onInfoContainer' },
  { token: 'onInfoContainer', label: 'On info container', category: 'status', pairedRole: 'infoContainer' },

  // Surface Hierarchy
  { token: 'surface', label: 'Surface', category: 'surface', pairedRole: 'onSurface' },
  { token: 'onSurface', label: 'On surface', category: 'surface', pairedRole: 'surface' },
  { token: 'surfaceVariant', label: 'Surface variant', category: 'surface', pairedRole: 'onSurfaceVariant' },
  { token: 'onSurfaceVariant', label: 'On surface variant', category: 'surface', pairedRole: 'surfaceVariant' },
  { token: 'surfaceDim', label: 'Surface dim', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceBright', label: 'Surface bright', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainerLowest', label: 'Container lowest', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainerLow', label: 'Container low', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainer', label: 'Surface container', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainerHigh', label: 'Container high', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainerHighest', label: 'Container highest', category: 'surface', pairedRole: 'onSurface' },

  // Inverse & Utility
  { token: 'inverseSurface', label: 'Inverse surface', category: 'inverse-utility', pairedRole: 'inverseOnSurface' },
  { token: 'inverseOnSurface', label: 'Inverse on surface', category: 'inverse-utility', pairedRole: 'inverseSurface' },
  { token: 'inversePrimary', label: 'Inverse primary', category: 'inverse-utility', pairedRole: 'inverseOnPrimary' },
  { token: 'inverseOnPrimary', label: 'Inverse on primary', category: 'inverse-utility', pairedRole: 'inversePrimary' },
  { token: 'inversePrimaryContainer', label: 'Inverse primary container', category: 'inverse-utility', pairedRole: 'inverseOnPrimaryContainer' },
  { token: 'inverseOnPrimaryContainer', label: 'Inverse on primary container', category: 'inverse-utility', pairedRole: 'inversePrimaryContainer' },
  { token: 'outline', label: 'Outline', category: 'inverse-utility' },
  { token: 'outlineVariant', label: 'Outline variant', category: 'inverse-utility' },
  { token: 'shadow', label: 'Shadow', category: 'inverse-utility' },
  { token: 'scrim', label: 'Scrim', category: 'inverse-utility' },
]

const TokensWithoutAaPreview = new Set<SystemColorToken>([
  'scrim',
  'shadow',
  'outline',
  'outlineVariant',
])

const EnglishCopy = {
  categoryLabels: Object.fromEntries(
    TokenCategories.map((cat) => [cat.id, cat.label])
  ) as Record<string, string>,
  tokenLabels: Object.fromEntries(
    SystemTokenDefinitions.map((item) => [item.token, item.label])
  ) as Record<string, string>,

  copyToast: (label: string, value: string) => `Copied ${label}: ${value}`,
  copyAction: 'Copy',
  textContrastBadge: 'Aa contrast',
  textBadge: 'Aa text',

  matrixTitle: 'Token matrix',
  tokenCount: (count: number) => `${count} tokens`,
  copySwatchTitle: (hex: string) => `Click to copy ${hex}`,
  viewCurrent: 'Current',
  viewSplit: 'Light / dark',
  toggleThemeTitle: 'Toggle the global light/dark theme',
  searchPlaceholder: 'Search token names (e.g. primary, container, surface, info)…',
  customFamilyTitle: 'Custom extended color family',
  emptyState: 'No matching tokens found',
  lightSchemeTitle: 'Light scheme',
  darkSchemeTitle: 'Dark scheme',
  sourceHex: (hex: string) => `Source: ${hex}`,
  customRolePrimary: (label: string) => `${label} primary`,
  customRoleText: (label: string) => `${label} on-color`,
  customRoleContainer: (label: string) => `${label} container`,
  customRoleContainerText: (label: string) => `${label} container on-color`,
}

const TraditionalCopy: typeof EnglishCopy = {
  categoryLabels: {
    all: '全部',
    primary: 'Primary 主要色',
    secondary: 'Secondary 次要色',
    tertiary: 'Tertiary 第三色',
    status: 'Status 語意狀態',
    surface: 'Surface 表面階層',
    'inverse-utility': 'Inverse & Utility 倒置輔助',
    custom: 'Custom 擴展色',
  },
  tokenLabels: {
    primary: '主要色',
    onPrimary: '主要色文字',
    primaryContainer: '主要色容器',
    onPrimaryContainer: '主要色容器文字',
    primaryFixed: '主要色固定',
    primaryFixedDim: '主要色固定暗',
    onPrimaryFixed: '主要色固定文字',
    onPrimaryFixedVariant: '主要色固定變體文字',

    secondary: '次要色',
    onSecondary: '次要色文字',
    secondaryContainer: '次要色容器',
    onSecondaryContainer: '次要色容器文字',

    tertiary: '第三色',
    onTertiary: '第三色文字',
    tertiaryContainer: '第三色容器',
    onTertiaryContainer: '第三色容器文字',

    error: '錯誤色',
    onError: '錯誤色文字',
    errorContainer: '錯誤色容器',
    onErrorContainer: '錯誤色容器文字',

    warning: '警告色',
    onWarning: '警告色文字',
    warningContainer: '警告色容器',
    onWarningContainer: '警告色容器文字',

    success: '成功色',
    onSuccess: '成功色文字',
    successContainer: '成功色容器',
    onSuccessContainer: '成功色容器文字',

    info: '資訊色',
    onInfo: '資訊色文字',
    infoContainer: '資訊色容器',
    onInfoContainer: '資訊色容器文字',

    surface: '基礎表面',
    onSurface: '表面主文字',
    surfaceVariant: '變體表面',
    onSurfaceVariant: '變體表面文字',
    surfaceDim: '沉浸暗表面',
    surfaceBright: '提亮表面',
    surfaceContainerLowest: '最低容器',
    surfaceContainerLow: '偏低容器',
    surfaceContainer: '標準容器',
    surfaceContainerHigh: '偏高容器',
    surfaceContainerHighest: '頂階容器',

    inverseSurface: '倒置表面',
    inverseOnSurface: '倒置表面文字',
    inversePrimary: '倒置主要色',
    inverseOnPrimary: '倒置主要色文字',
    inversePrimaryContainer: '倒置主要色容器',
    inverseOnPrimaryContainer: '倒置主要色容器文字',
    outline: '結構邊框',
    outlineVariant: '弱化邊框',
    shadow: '投影底色',
    scrim: '模態遮罩',
  },

  copyToast: (label: string, value: string) => `已複製 ${label}：${value}`,
  copyAction: '複製',
  textContrastBadge: 'Aa 文字對比',
  textBadge: 'Aa 文字',

  matrixTitle: 'Token 矩陣',
  tokenCount: (count: number) => `共 ${count} 個權杖`,
  copySwatchTitle: (hex: string) => `點擊複製 ${hex}`,
  viewCurrent: '目前方案',
  viewSplit: '明暗對照',
  toggleThemeTitle: '切換全域明暗主題',
  searchPlaceholder: '搜尋 Token 名稱（例如 primary、container、surface、info）…',
  customFamilyTitle: '自訂擴展語意色族',
  emptyState: '找不到符合的 Token',
  lightSchemeTitle: '淺色方案',
  darkSchemeTitle: '深色方案',
  sourceHex: (hex: string) => `原色：${hex}`,
  customRolePrimary: (label: string) => `${label} 主色`,
  customRoleText: (label: string) => `${label} 文字`,
  customRoleContainer: (label: string) => `${label} 容器`,
  customRoleContainerText: (label: string) => `${label} 容器文字`,
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

const TokenGridClass =
  'grid gap-2 sm:gap-2.5 lg:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-[repeat(auto-fill,minmax(10.75rem,1fr))]'

export const TokensView: React.FC<TokensViewProps> = ({
  palettes,
  scheme,
  lightScheme,
  darkScheme,
  customColorsLight,
  customColorsDark,
  cvdType,
}) => {
  const { locale } = useI18n()
  const copy = Copy[locale]

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const c = (hex: string) => simulateCvd(hex, cvdType)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setToastMessage(copy.copyToast(label, text))
    setTimeout(() => setToastMessage(null), 1800)
  }

  const filteredSystemTokens = SystemTokenDefinitions
  const filteredCustomColors = customColorsLight

  const darkCustomById = useMemo(
    () => new Map(customColorsDark.map((item) => [item.id, item])),
    [customColorsDark]
  )

  const contrastForRole = (
    roleScheme: DynamicSchemeColors,
    token: SystemColorToken,
    pairedToken?: SystemColorToken
  ): number | null => {
    if (!pairedToken) return null
    const fg = hexToOkyct(roleScheme[token])
    const bg = hexToOkyct(roleScheme[pairedToken])
    return getContrastRatio(fg.t, bg.t)
  }

  const renderDualSwatch = (
    lightHexRaw: string,
    darkHexRaw: string,
    lightContrast: number | null,
    darkContrast: number | null,
    aa?: { show: boolean; lightTextHex?: string; darkTextHex?: string },
    onCopyLight?: () => void,
    onCopyDark?: () => void
  ) => (
    <div className="flex h-10 w-full shrink-0">
      <SwatchHalf
        hex={c(lightHexRaw)}
        contrast={lightContrast}
        side="left"
        showAa={aa?.show ?? false}
        aaColor={aa?.lightTextHex ? c(aa.lightTextHex) : undefined}
        onCopy={onCopyLight}
        copyTitle={copy.copySwatchTitle(lightHexRaw)}
      />
      <SwatchHalf
        hex={c(darkHexRaw)}
        contrast={darkContrast}
        side="right"
        showAa={aa?.show ?? false}
        aaColor={aa?.darkTextHex ? c(aa.darkTextHex) : undefined}
        onCopy={onCopyDark}
        copyTitle={copy.copySwatchTitle(darkHexRaw)}
      />
    </div>
  )

  const renderTokenCard = (
    token: SystemColorToken,
    label: string,
    pairedToken?: SystemColorToken
  ) => {
    const lightHex = lightScheme[token]
    const darkHex = darkScheme[token]
    const lightTone = Math.round(hexToOkyct(lightHex).t)
    const darkTone = Math.round(hexToOkyct(darkHex).t)
    const lightContrast = contrastForRole(lightScheme, token, pairedToken)
    const darkContrast = contrastForRole(darkScheme, token, pairedToken)
    const showAa = !TokensWithoutAaPreview.has(token)
    const lightAaHex = pairedToken ? lightScheme[pairedToken] : lightScheme.onSurface
    const darkAaHex = pairedToken ? darkScheme[pairedToken] : darkScheme.onSurface

    const humanLabel = copy.tokenLabels[token] ?? label

    return (
      <div
        key={token}
        title={humanLabel}
        className="group relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden transition-all flex flex-col hover:border-neutral-400 dark:hover:border-neutral-600"
      >
        {renderDualSwatch(
          lightHex,
          darkHex,
          lightContrast,
          darkContrast,
          {
            show: showAa,
            lightTextHex: lightAaHex,
            darkTextHex: darkAaHex,
          },
          () => handleCopy(lightHex, `${token} (light)`),
          () => handleCopy(darkHex, `${token} (dark)`)
        )}
        <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0">
          <div className="flex items-baseline justify-between gap-1 min-w-0">
            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 truncate text-[10px] leading-tight">
              {token}
            </span>
            <span className="font-mono text-[9px] text-neutral-400 tabular-nums shrink-0">
              T{lightTone}/{darkTone}
            </span>
          </div>
          <div className="flex items-center gap-1 min-w-0 text-[9px] font-mono text-neutral-500 dark:text-neutral-400">
            <span className="flex-1 truncate uppercase text-left">{lightHex}</span>
            <span className="text-neutral-300 dark:text-neutral-600 shrink-0">|</span>
            <span className="flex-1 truncate uppercase text-right">{darkHex}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderCustomColorGroup = (customLight: ResolvedCustomColor) => {
    const customDark = darkCustomById.get(customLight.id) ?? customLight

    const roleDefs = [
      {
        key: customLight.name,
        label: copy.customRolePrimary(customLight.label),
        lightHex: customLight.color,
        darkHex: customDark.color,
        lightAaHex: customLight.onColor,
        darkAaHex: customDark.onColor,
        lightRatio: customLight.wcagRatioColor,
        darkRatio: customDark.wcagRatioColor,
      },
      {
        key: `on${customLight.name.charAt(0).toUpperCase()}${customLight.name.slice(1)}`,
        label: copy.customRoleText(customLight.label),
        lightHex: customLight.onColor,
        darkHex: customDark.onColor,
        lightAaHex: customLight.color,
        darkAaHex: customDark.color,
        lightRatio: customLight.wcagRatioColor,
        darkRatio: customDark.wcagRatioColor,
      },
      {
        key: `${customLight.name}Container`,
        label: copy.customRoleContainer(customLight.label),
        lightHex: customLight.colorContainer,
        darkHex: customDark.colorContainer,
        lightAaHex: customLight.onColorContainer,
        darkAaHex: customDark.onColorContainer,
        lightRatio: customLight.wcagRatioContainer,
        darkRatio: customDark.wcagRatioContainer,
      },
      {
        key: `on${customLight.name.charAt(0).toUpperCase()}${customLight.name.slice(1)}Container`,
        label: copy.customRoleContainerText(customLight.label),
        lightHex: customLight.onColorContainer,
        darkHex: customDark.onColorContainer,
        lightAaHex: customLight.colorContainer,
        darkAaHex: customDark.colorContainer,
        lightRatio: customLight.wcagRatioContainer,
        darkRatio: customDark.wcagRatioContainer,
      },
    ]

    return (
      <div key={customLight.id} className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-neutral-700 dark:text-neutral-300">
            {customLight.label} ({customLight.name})
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            {copy.sourceHex(customLight.sourceHex)}
          </span>
        </div>
        <div className={TokenGridClass}>
          {roleDefs.map((r) => {
            const lightTone = Math.round(hexToOkyct(r.lightHex).t)
            const darkTone = Math.round(hexToOkyct(r.darkHex).t)
            return (
              <div
                key={r.key}
                title={r.label}
                className="group relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col"
              >
                {renderDualSwatch(
                  r.lightHex,
                  r.darkHex,
                  r.lightRatio,
                  r.darkRatio,
                  {
                    show: true,
                    lightTextHex: r.lightAaHex,
                    darkTextHex: r.darkAaHex,
                  },
                  () => handleCopy(r.lightHex, r.key),
                  () => handleCopy(r.darkHex, r.key)
                )}
                <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 min-w-0">
                    <span className="font-mono font-semibold text-[10px] truncate">{r.key}</span>
                    <span className="font-mono text-[9px] text-neutral-400 tabular-nums shrink-0">
                      T{lightTone}/{darkTone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-500 min-w-0">
                    <span className="flex-1 truncate uppercase">{r.lightHex}</span>
                    <span className="text-neutral-300 dark:text-neutral-600 shrink-0">|</span>
                    <span className="flex-1 truncate uppercase text-right">{r.darkHex}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 w-full max-w-[2400px] mx-auto p-3 sm:p-6 xl:px-8 2xl:px-10 overflow-y-auto flex flex-col gap-4 sm:gap-6 xl:gap-8 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 relative">
      {/* 浮动 Toast 复制提示 */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {filteredSystemTokens.length > 0 && (
          <div className={TokenGridClass}>
            {filteredSystemTokens.map((item) =>
              renderTokenCard(item.token, item.label, item.pairedRole)
            )}
          </div>
        )}

        {filteredCustomColors.length > 0 && (
          <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {copy.customFamilyTitle}
            </h3>
            <div className="flex flex-col gap-3">
              {filteredCustomColors.map((item) => renderCustomColorGroup(item))}
            </div>
          </div>
        )}

        {filteredSystemTokens.length === 0 && filteredCustomColors.length === 0 && (
          <div className="p-8 text-center text-xs text-neutral-400">
            {copy.emptyState}
          </div>
        )}

        <TonalPaletteRamps palettes={palettes} />

        <SchemeContrastAuditTable scheme={scheme} />
      </div>
    </div>
  )
}

function SwatchHalf({
  hex,
  contrast,
  side,
  showAa = false,
  aaColor,
  onCopy,
  copyTitle,
}: {
  hex: string
  contrast: number | null
  side: 'left' | 'right'
  showAa?: boolean
  aaColor?: string
  onCopy?: () => void
  copyTitle?: string
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      title={copyTitle}
      className={`relative flex-1 min-w-0 cursor-pointer transition-opacity hover:opacity-90 active:opacity-80 ${
        side === 'left' ? 'border-r border-black/10 dark:border-white/10' : ''
      }`}
      style={{ backgroundColor: hex }}
    >
      {showAa && aaColor ? (
        <span
          className="absolute inset-0 flex items-center justify-center font-display font-bold text-[13px] leading-none select-none pointer-events-none"
          style={{ color: aaColor }}
          aria-hidden
        >
          Aa
        </span>
      ) : null}
      {contrast !== null ? (
        <ContrastRatioBadge
          pass={contrast >= 4.5}
          ratio={contrast}
          compact
          side={side}
          backgroundColor={aaColor ?? hex}
          textColor={hex}
        />
      ) : null}
    </button>
  )
}

function ContrastRatioBadge({
  pass,
  ratio,
  compact = false,
  side = 'right',
  backgroundColor,
  textColor,
}: {
  pass: boolean
  ratio: number
  compact?: boolean
  side?: 'left' | 'right'
  backgroundColor: string
  textColor: string
}) {
  const corner = side === 'left' ? 'left-0.5' : 'right-0.5'
  return (
    <div
      className={`absolute bottom-0.5 ${corner} rounded font-mono font-bold flex items-center gap-0.5 ${
        compact ? 'px-1 py-px text-[8px]' : 'px-1 py-0.5 text-[9px]'
      }`}
      style={{ backgroundColor, color: textColor }}
    >
      {!compact ? (
        pass ? (
          <ShieldCheck className="w-2.5 h-2.5" />
        ) : (
          <ShieldAlert className="w-2.5 h-2.5" />
        )
      ) : null}
      <span>{ratio.toFixed(1)}</span>
    </div>
  )
}
