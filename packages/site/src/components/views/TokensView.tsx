
import React, { useState, useMemo } from 'react'
import {
  DynamicSchemeColors,
  ResolvedCustomColor,
  SystemColorToken,
} from '../../color/scheme.ts'
import { hexToOkyct, getContrastRatio } from '../../color/math.ts'
import { CvdType, simulateCvd } from '../../color/benchmark.ts'
import {
  Search,
  Copy as CopyIcon,
  Check,
  Columns,
  Sun,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Sliders,
} from 'lucide-react'
import { useI18n } from '../../i18n/index.tsx'

interface TokensViewProps {
  scheme: DynamicSchemeColors
  lightScheme: DynamicSchemeColors
  darkScheme: DynamicSchemeColors
  customColors: ResolvedCustomColor[]
  isDark: boolean
  onToggleDark: () => void
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
  copyHexTitle: 'Copy the HEX value',
  copyVarTitle: 'Copy the CSS variable name',
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
  copyHexTitle: '複製 HEX 值',
  copyVarTitle: '複製 CSS 變數名稱',
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

export const TokensView: React.FC<TokensViewProps> = ({
  scheme,
  lightScheme,
  darkScheme,
  customColors,
  isDark,
  onToggleDark,
  cvdType,
}) => {
  const { locale } = useI18n()
  const copy = Copy[locale]

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory>('all')
  const [viewMode, setViewMode] = useState<'current' | 'split'>('current')
  const [copyFormat, setCopyFormat] = useState<'hex' | 'var'>('hex')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const c = (hex: string) => simulateCvd(hex, cvdType)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setToastMessage(copy.copyToast(label, text))
    setTimeout(() => setToastMessage(null), 1800)
  }

  // 过滤系统 Token
  const filteredSystemTokens = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return SystemTokenDefinitions.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory
      if (!matchCategory) return false
      if (!query) return true
      return (
        item.token.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query) ||
        `--md-sys-color-${item.token}`.toLowerCase().includes(query)
      )
    })
  }, [searchQuery, selectedCategory])

  // 过滤自定义扩展语义色
  const shouldShowCustom =
    selectedCategory === 'all' || selectedCategory === 'custom'

  const filteredCustomColors = useMemo(() => {
    if (!shouldShowCustom) return []
    const query = searchQuery.trim().toLowerCase()
    if (!query) return customColors
    return customColors.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.label.toLowerCase().includes(query)
    )
  }, [customColors, shouldShowCustom, searchQuery])

  const totalTokensCount =
    SystemTokenDefinitions.length + customColors.length * 4

  const renderTokenCard = (
    token: SystemColorToken,
    label: string,
    currentScheme: DynamicSchemeColors,
    pairedToken?: SystemColorToken
  ) => {
    const rawHex = currentScheme[token]
    const hex = c(rawHex)
    const oky = hexToOkyct(rawHex)
    const toneVal = Math.round(oky.t)

    // 若有配对角色，求 WCAG 对比度
    let contrastRatio: number | null = null
    let pairedHex: string | null = null
    if (pairedToken) {
      pairedHex = currentScheme[pairedToken]
      const pairedOky = hexToOkyct(pairedHex)
      contrastRatio = getContrastRatio(oky.t, pairedOky.t)
    }

    const cssVar = `--md-sys-color-${token}`
    const copyVal = copyFormat === 'hex' ? rawHex : `var(${cssVar})`

    return (
      <div
        key={token}
        onClick={() => handleCopy(copyVal, token)}
        className="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer flex flex-col shadow-xs"
      >
        {/* 顶部色彩预览块 */}
        <div
          className="h-20 w-full p-2.5 flex flex-col justify-between relative transition-opacity"
          style={{ backgroundColor: hex }}
        >
          {/* 左上角配对文本预览 */}
          {pairedToken && pairedHex ? (
            <div
              className="text-xs font-semibold px-2 py-0.5 rounded backdrop-blur-xs self-start"
              style={{
                color: c(pairedHex),
                backgroundColor: 'rgba(0,0,0,0.06)',
              }}
            >
              {copy.textContrastBadge}
            </div>
          ) : (
            <div />
          )}

          {/* 右下角对比度徽标 */}
          {contrastRatio !== null && (
            <div
              className="self-end px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 shadow-xs"
              style={{
                backgroundColor: contrastRatio >= 4.5 ? '#10b981' : '#f59e0b',
                color: '#ffffff',
              }}
            >
              {contrastRatio >= 4.5 ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <ShieldAlert className="w-3 h-3" />
              )}
              <span>{contrastRatio.toFixed(1)}:1</span>
            </div>
          )}
        </div>

        {/* 底部详情信息 */}
        <div className="p-3 flex flex-col gap-1.5 flex-1 justify-between text-xs">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100 truncate text-[11px] sm:text-xs">
                {token}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 tabular-nums">
                T{toneVal}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              {copy.tokenLabels[token] ?? label}
            </div>
          </div>

          <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
            <span className="tabular-nums uppercase font-semibold">{rawHex}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-900 dark:text-neutral-100">
              <CopyIcon className="w-3 h-3" />
              <span className="text-[10px]">{copy.copyAction}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCustomColorGroup = (custom: ResolvedCustomColor) => {
    const roles = [
      { key: custom.name, label: copy.customRolePrimary(custom.label), hex: custom.color, pairedHex: custom.onColor, ratio: custom.wcagRatioColor },
      { key: `on${custom.name.charAt(0).toUpperCase()}${custom.name.slice(1)}`, label: copy.customRoleText(custom.label), hex: custom.onColor, pairedHex: custom.color, ratio: custom.wcagRatioColor },
      { key: `${custom.name}Container`, label: copy.customRoleContainer(custom.label), hex: custom.colorContainer, pairedHex: custom.onColorContainer, ratio: custom.wcagRatioContainer },
      { key: `on${custom.name.charAt(0).toUpperCase()}${custom.name.slice(1)}Container`, label: copy.customRoleContainerText(custom.label), hex: custom.onColorContainer, pairedHex: custom.colorContainer, ratio: custom.wcagRatioContainer },
    ]

    return (
      <div key={custom.id} className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-neutral-700 dark:text-neutral-300">
            {custom.label} ({custom.name})
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            {copy.sourceHex(custom.sourceHex)}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {roles.map((r) => {
            const hex = c(r.hex)
            const oky = hexToOkyct(r.hex)
            const toneVal = Math.round(oky.t)
            const copyVal = copyFormat === 'hex' ? r.hex : `var(--md-custom-color-${r.key})`

            return (
              <div
                key={r.key}
                onClick={() => handleCopy(copyVal, r.key)}
                className="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer flex flex-col shadow-xs"
              >
                <div
                  className="h-16 w-full p-2 flex flex-col justify-between relative"
                  style={{ backgroundColor: hex }}
                >
                  <div
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs self-start"
                    style={{ color: c(r.pairedHex) }}
                  >
                    {copy.textBadge}
                  </div>
                  <div
                    className="self-end px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs"
                    style={{
                      backgroundColor: r.ratio >= 4.5 ? '#10b981' : '#f59e0b',
                      color: '#ffffff',
                    }}
                  >
                    <span>{r.ratio.toFixed(1)}:1</span>
                  </div>
                </div>
                <div className="p-2.5 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[11px] truncate">
                      {r.key}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400">
                      T{toneVal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>{r.hex}</span>
                    <CopyIcon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
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
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 relative">
      {/* 浮动 Toast 复制提示 */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 顶部紧凑控制栏 */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3.5 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold font-display tracking-tight">
              {copy.matrixTitle}
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {copy.tokenCount(totalTokensCount)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 复制格式快捷切换 */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-mono">
              <button
                onClick={() => setCopyFormat('hex')}
                className={`px-2 py-1 rounded transition-colors ${
                  copyFormat === 'hex'
                    ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title={copy.copyHexTitle}
              >
                HEX
              </button>
              <button
                onClick={() => setCopyFormat('var')}
                className={`px-2 py-1 rounded transition-colors ${
                  copyFormat === 'var'
                    ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title={copy.copyVarTitle}
              >
                CSS Var
              </button>
            </div>

            {/* 视图模式：当前模式 vs 双模对照 */}
            <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs">
              <button
                onClick={() => setViewMode('current')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'current'
                    ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {copy.viewCurrent}
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-neutral-700 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{copy.viewSplit}</span>
              </button>
            </div>

            {/* 明暗切换按钮 */}
            <button
              onClick={onToggleDark}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              title={copy.toggleThemeTitle}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 搜索与分类 Tab */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-0.5">
            {TokenCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as TokenCategory)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors text-[11px] ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {copy.categoryLabels[cat.id] ?? cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 视图主体 */}
      {viewMode === 'current' ? (
        /* 单视图模式 (当前主题) */
        <div className="flex flex-col gap-6">
          {filteredSystemTokens.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredSystemTokens.map((item) =>
                renderTokenCard(item.token, item.label, scheme, item.pairedRole)
              )}
            </div>
          )}

          {/* 扩展自定义色 */}
          {filteredCustomColors.length > 0 && (
            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {copy.customFamilyTitle}
              </h3>
              <div className="flex flex-col gap-4">
                {filteredCustomColors.map((c) => renderCustomColorGroup(c))}
              </div>
            </div>
          )}

          {filteredSystemTokens.length === 0 && filteredCustomColors.length === 0 && (
            <div className="p-8 text-center text-xs text-neutral-400">
              {copy.emptyState}
            </div>
          )}
        </div>
      ) : (
        /* 双模对照模式 (Light vs Dark) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 浅色模式列 */}
          <div className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-amber-700 dark:text-amber-400">
              <Sun className="w-4 h-4" />
              <span>{copy.lightSchemeTitle}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredSystemTokens.map((item) =>
                renderTokenCard(item.token, item.label, lightScheme, item.pairedRole)
              )}
            </div>
          </div>

          {/* 深色模式列 */}
          <div className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-neutral-900/60 dark:bg-neutral-900/90 border border-neutral-800">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-800 text-xs font-bold text-indigo-400">
              <Moon className="w-4 h-4" />
              <span>{copy.darkSchemeTitle}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredSystemTokens.map((item) =>
                renderTokenCard(item.token, item.label, darkScheme, item.pairedRole)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
