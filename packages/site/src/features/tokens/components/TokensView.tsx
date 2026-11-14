import type { CSSProperties } from 'react'
import { Check, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useI18n } from '../../../i18n/index.tsx'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { copyTokenText } from '../actions.ts'
import { SystemTokenDefinitions, TokenCategories } from '../catalog.ts'
import {
  selectCustomRoleGroups,
  selectTokenCards,
  type StateLayerSwatch,
  type SwatchInteractionColors,
} from '../selectors.ts'
import { setShowStateLayers } from '../slice.ts'
import { SchemeContrastAuditTable } from './SchemeContrastAuditTable.tsx'
import { TonalPaletteRamps } from './TonalPaletteRamps.tsx'

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
  showStateLayers: 'State layers (hovered / focused / pressed / dragged)',
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
  showStateLayers: '狀態層預覽（hovered / focused / pressed / dragged）',
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

const TokenGridClass =
  'grid gap-2 sm:gap-2.5 lg:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-[repeat(auto-fill,minmax(10.75rem,1fr))]'


export function TokensView() {
  const { locale } = useI18n()
  const copy = Copy[locale]
  const dispatch = useAppDispatch()
  const toastMessage = useAppSelector((state) => state.tokens.toast)
  const showStateLayers = useAppSelector((state) => state.tokens.showStateLayers)
  const cards = useAppSelector(selectTokenCards)
  const customGroups = useAppSelector(selectCustomRoleGroups)

  const handleCopy = (text: string, label: string) => {
    dispatch(copyTokenText(text, copy.copyToast(label, text)))
  }

  const roleLabel = {
    primary: copy.customRolePrimary,
    text: copy.customRoleText,
    container: copy.customRoleContainer,
    containerText: copy.customRoleContainerText,
  } as const

  return (
    <div className="flex-1 min-h-0 w-full max-w-[2400px] mx-auto p-3 sm:p-6 xl:px-8 2xl:px-10 overflow-y-auto flex flex-col gap-4 sm:gap-6 xl:gap-8 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 relative">
      <style>{`
        .okyct-token-swatch { background-color: var(--swatch-rest); transition: background-color 140ms ease; }
        .okyct-token-swatch:hover { background-color: var(--swatch-hovered, var(--swatch-rest)); }
        .okyct-token-swatch:focus-visible { background-color: var(--swatch-focused, var(--swatch-rest)); }
        .okyct-token-swatch:active { background-color: var(--swatch-pressed, var(--swatch-rest)); }
      `}</style>
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-end">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showStateLayers}
              onChange={(e) => dispatch(setShowStateLayers(e.target.checked))}
              className="w-3.5 h-3.5 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
            />
            <span>{copy.showStateLayers}</span>
          </label>
        </div>

        {cards.length > 0 && (
          <div className={TokenGridClass}>
            {cards.map((card) => (
              <div
                key={card.token}
                title={copy.tokenLabels[card.token] ?? card.label}
                className="group relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden transition-all flex flex-col hover:border-neutral-400 dark:hover:border-neutral-600"
              >
                <div className="flex h-10 w-full shrink-0">
                  <SwatchHalf
                    hex={card.lightSwatch}
                    interaction={card.lightInteraction}
                    contrast={card.lightContrast}
                    side="left"
                    showAa={card.showAa}
                    aaColor={card.lightAa}
                    onCopy={() => handleCopy(card.lightHex, `${card.token} (light)`)}
                    copyTitle={copy.copySwatchTitle(card.lightHex)}
                  />
                  <SwatchHalf
                    hex={card.darkSwatch}
                    interaction={card.darkInteraction}
                    contrast={card.darkContrast}
                    side="right"
                    showAa={card.showAa}
                    aaColor={card.darkAa}
                    onCopy={() => handleCopy(card.darkHex, `${card.token} (dark)`)}
                    copyTitle={copy.copySwatchTitle(card.darkHex)}
                  />
                </div>
                <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 min-w-0">
                    <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100 truncate text-[10px] leading-tight">
                      {card.token}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-400 tabular-nums shrink-0">
                      T{card.lightTone}/{card.darkTone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0 text-[9px] font-mono text-neutral-500 dark:text-neutral-400">
                    <span className="flex-1 truncate uppercase text-left">{card.lightHex}</span>
                    <span className="text-neutral-300 dark:text-neutral-600 shrink-0">|</span>
                    <span className="flex-1 truncate uppercase text-right">{card.darkHex}</span>
                  </div>
                </div>
                {card.stateLayers ? (
                  <StateLayerStrip
                    token={card.token}
                    items={card.stateLayers}
                    onCopy={handleCopy}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}

        {customGroups.length > 0 && (
          <div className="flex flex-col gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {copy.customFamilyTitle}
            </h3>
            <div className="flex flex-col gap-3">
              {customGroups.map((group) => (
                <div key={group.id} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-neutral-700 dark:text-neutral-300">
                      {group.label} ({group.name})
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {copy.sourceHex(group.sourceHex)}
                    </span>
                  </div>
                  <div className={TokenGridClass}>
                    {group.roles.map((role) => (
                      <div
                        key={role.key}
                        title={roleLabel[role.labelKey](role.groupLabel)}
                        className="group relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-all flex flex-col"
                      >
                        <div className="flex h-10 w-full shrink-0">
                          <SwatchHalf
                            hex={role.lightSwatch}
                            interaction={role.lightInteraction}
                            contrast={role.lightContrast}
                            side="left"
                            showAa
                            aaColor={role.lightAa}
                            onCopy={() => handleCopy(role.lightHex, role.key)}
                            copyTitle={copy.copySwatchTitle(role.lightHex)}
                          />
                          <SwatchHalf
                            hex={role.darkSwatch}
                            interaction={role.darkInteraction}
                            contrast={role.darkContrast}
                            side="right"
                            showAa
                            aaColor={role.darkAa}
                            onCopy={() => handleCopy(role.darkHex, role.key)}
                            copyTitle={copy.copySwatchTitle(role.darkHex)}
                          />
                        </div>
                        <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-baseline justify-between gap-1 min-w-0">
                            <span className="font-mono font-semibold text-[10px] truncate">{role.key}</span>
                            <span className="font-mono text-[9px] text-neutral-400 tabular-nums shrink-0">
                              T{role.lightTone}/{role.darkTone}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-500 min-w-0">
                            <span className="flex-1 truncate uppercase">{role.lightHex}</span>
                            <span className="text-neutral-300 dark:text-neutral-600 shrink-0">|</span>
                            <span className="flex-1 truncate uppercase text-right">{role.darkHex}</span>
                          </div>
                        </div>
                        {role.stateLayers ? (
                          <StateLayerStrip
                            token={role.key}
                            items={role.stateLayers}
                            onCopy={handleCopy}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cards.length === 0 && customGroups.length === 0 && (
          <div className="p-8 text-center text-xs text-neutral-400">
            {copy.emptyState}
          </div>
        )}

        <TonalPaletteRamps />
        <SchemeContrastAuditTable />
      </div>
    </div>
  )
}

function SwatchHalf({
  hex,
  interaction,
  contrast,
  side,
  showAa = false,
  aaColor,
  onCopy,
  copyTitle,
}: {
  hex: string
  interaction?: SwatchInteractionColors
  contrast: number | null
  side: 'left' | 'right'
  showAa?: boolean
  aaColor?: string
  onCopy?: () => void
  copyTitle?: string
}) {
  const style = {
    '--swatch-rest': hex,
    ...(interaction
      ? {
          '--swatch-hovered': interaction.hovered,
          '--swatch-focused': interaction.focused,
          '--swatch-pressed': interaction.pressed,
        }
      : {}),
  } as CSSProperties

  return (
    <button
      type="button"
      onClick={onCopy}
      title={copyTitle}
      className={`okyct-token-swatch relative flex-1 min-w-0 cursor-pointer outline-none ${
        side === 'left' ? 'border-r border-black/10 dark:border-white/10' : ''
      }`}
      style={style}
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

function StateLayerStrip({
  token,
  items,
  onCopy,
}: {
  token: string
  items: readonly StateLayerSwatch[]
  onCopy: (hex: string, label: string) => void
}) {
  return (
    <div className="grid grid-cols-4 border-t border-neutral-200 dark:border-neutral-800 h-5">
      {items.map((item) => {
        const cap = `${item.state.charAt(0).toUpperCase()}${item.state.slice(1)}`
        const tokenName = `${token}${cap}`
        return (
          <div key={item.state} className="flex h-full min-w-0 border-r last:border-r-0 border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => onCopy(item.lightHex, `${tokenName} (light)`)}
              title={`${tokenName} (light): ${item.lightHex}`}
              className="flex-1 h-full cursor-pointer hover:opacity-85"
              style={{ backgroundColor: item.lightSwatch }}
            />
            <button
              type="button"
              onClick={() => onCopy(item.darkHex, `${tokenName} (dark)`)}
              title={`${tokenName} (dark): ${item.darkHex}`}
              className="flex-1 h-full cursor-pointer hover:opacity-85"
              style={{ backgroundColor: item.darkSwatch }}
            />
          </div>
        )
      })}
    </div>
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
