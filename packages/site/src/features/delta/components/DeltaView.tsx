import { Activity, AlertTriangle, Check, Copy, Cpu, Eye, GitCompareArrows, Layers } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { useI18n } from '../../../i18n/index.tsx'
import { Tabs } from '../../../ui/Tabs.tsx'
import { selectCustomLight, selectScheme } from '../../studio/selectors.ts'
import {
  selectReferenceHexState,
  selectScaleAContrastRows,
  selectScaleACoreAnalysis,
  selectScaleBCoreAnalysis,
  selectScalePairComparison,
} from '../selectors.ts'
import {
  DeltaPaletteKeys,
  DeltaSectionIds,
  setActiveSection,
  setApplyEmissiveProfile,
  setCompareEnabled,
  setDeltaToast,
  setReferenceHexInput,
  setScaleACustomId,
  setScaleAManualInput,
  setScaleASource,
  setScaleBCustomId,
  setScaleBManualInput,
  setScaleBSource,
  type DeltaScaleSourceKind,
  type DeltaSectionId,
} from '../slice.ts'

const EnglishCopy = {
  title: 'Delta',
  subtitle: 'Color scale perceptual deltas, coordinates, contrast & OLED telemetry',
  scaleALabel: 'Scale A',
  scaleBLabel: 'Scale B',
  compareToggle: 'Compare A vs B',
  emissiveToggle: 'Apply emissive profile',
  referenceLabel: 'Reference HEX',
  refWhite: 'White',
  refBlack: 'Black',
  refSurface: 'Surface',
  invalidRefHint: 'Invalid HEX (using #FFFFFF)',
  manualPlaceholder: 'Paste HEX colors separated by comma, space, or newline (e.g. #000000, #3B82F6, #FFFFFF)',
  invalidTokensWarning: (tokens: readonly string[]) =>
    `Ignored ${tokens.length} invalid token(s): ${tokens.slice(0, 4).join(', ')}${tokens.length > 4 ? '…' : ''}`,
  emptyScale: 'Enter at least one valid HEX color (#RGB or #RRGGBB) to compute scale metrics.',
  copyJson: 'Copy JSON',
  copiedJson: 'Copied Delta analysis JSON',
  copiedHex: (hex: string) => `Copied ${hex}`,
  sourceOptions: {
    primary: 'Primary',
    secondary: 'Secondary',
    tertiary: 'Tertiary',
    neutral: 'Neutral',
    neutralVariant: 'Neutral variant',
    error: 'Error',
    warning: 'Warning',
    success: 'Success',
    info: 'Info',
    'custom-palette': 'Custom color',
    manual: 'Manual HEX list',
  } as Record<DeltaScaleSourceKind, string>,
  sections: {
    all: 'All metrics',
    deltas: 'Step deltas',
    coordinates: 'Coordinates',
    accessibility: 'Contrast',
    emissive: 'OLED telemetry',
  } as Record<DeltaSectionId, string>,
  kpi: {
    meanDe2000: 'Mean ΔE2000',
    stdDevSub: (sd: string, min: string, max: string) => `σ ${sd} · min ${min} / max ${max}`,
    meanDeOk: 'Mean ΔE OKLab',
    maxDeOkSub: (max: string, steps: number) => `Max ${max} · ${steps} steps`,
    maxHueDrift: 'Max |ΔH| drift',
    toneStepSub: (tStep: string) => `Mean |ΔT| ${tStep} per step`,
    meanPower: 'Mean OLED power',
    peakBlueSub: (stress: number) => `Peak blue stress ${stress}/100`,
  },
  stripTitle: 'Scale ramp & adjacent ΔE2000',
  stripBTitle: 'Scale B ramp',
  tables: {
    stepDeltasTitle: 'Adjacent step-to-step perceptual deltas',
    coordinatesTitle: 'Colorimetric coordinates & sRGB gamut utilization',
    contrastTitle: 'Accessibility contrast matrix (WCAG 2.1 & APCA Lc)',
    emissiveTitle: 'Emissive OLED power & blue subpixel telemetry',
    compareTitle: 'Scale A vs Scale B paired comparison',
  },
  cols: {
    transition: 'Transition',
    step: 'Step',
    swatch: 'Swatch',
    hex: 'HEX',
    rgb: 'RGB (0–255)',
    hue: 'H°',
    chroma: 'C',
    tone: 'T',
    cieY: 'CIE Y',
    maxChroma: 'sRGB Max C',
    gamutUtil: 'Gamut %',
    deltaT: 'ΔT',
    deltaC: 'ΔC',
    deltaH: 'ΔH°',
    deltaEOk: 'ΔE OK',
    deltaE2000: 'ΔE2000',
    vsWhite: 'vs #FFFFFF',
    vsBlack: 'vs #000000',
    vsRef: 'vs Ref',
    powerMw: 'Power (mW)',
    channelsMw: 'R / G / B (mW)',
    apl: 'APL %',
    blueStress: 'Blue stress',
    pixelState: 'Pixel',
    pair: 'Pair (A / B)',
    wcagAB: 'WCAG A↔B',
    apcaAB: 'APCA A↔B',
    powerDelta: 'ΔPower (B−A)',
  },
  pixelOff: 'Off',
  pixelActive: 'Active',
  outOfGamut: 'OOG',
  inGamut: 'sRGB',
}

const TraditionalCopy: typeof EnglishCopy = {
  title: 'Delta',
  subtitle: '色階步進感知差值、色度座標、無障礙對比度與 OLED 物理遙測',
  scaleALabel: '色階 A',
  scaleBLabel: '色階 B',
  compareToggle: '雙色階對比 (A vs B)',
  emissiveToggle: '套用自發光面板物理曲線',
  referenceLabel: '參考基準 HEX',
  refWhite: '純白',
  refBlack: '純黑',
  refSurface: 'Surface',
  invalidRefHint: 'HEX 格式無效（暫以 #FFFFFF 計算）',
  manualPlaceholder: '貼上 HEX 色值，以逗號、空白或換行分隔（例如 #000000, #3B82F6, #FFFFFF）',
  invalidTokensWarning: (tokens: readonly string[]) =>
    `已忽略 ${tokens.length} 個無效色值：${tokens.slice(0, 4).join(', ')}${tokens.length > 4 ? '…' : ''}`,
  emptyScale: '請輸入至少一個有效的 HEX 色值（#RGB 或 #RRGGBB）以進行計算。',
  copyJson: '複製 JSON',
  copiedJson: '已複製 Delta 分析 JSON',
  copiedHex: (hex: string) => `已複製 ${hex}`,
  sourceOptions: {
    primary: 'Primary 主要色',
    secondary: 'Secondary 次要色',
    tertiary: 'Tertiary 第三色',
    neutral: 'Neutral 中性色',
    neutralVariant: 'Neutral Variant 中性變體',
    error: 'Error 錯誤',
    warning: 'Warning 警告',
    success: 'Success 成功',
    info: 'Info 資訊',
    'custom-palette': '自訂擴展色',
    manual: '手動輸入 HEX 列表',
  },
  sections: {
    all: '全部指標',
    deltas: '步進差值',
    coordinates: '色度座標',
    accessibility: '對比度矩陣',
    emissive: 'OLED 遙測',
  },
  kpi: {
    meanDe2000: '平均 ΔE2000',
    stdDevSub: (sd: string, min: string, max: string) => `標準差 ${sd} · 最小 ${min} / 最大 ${max}`,
    meanDeOk: '平均 ΔE OKLab',
    maxDeOkSub: (max: string, steps: number) => `最大 ${max} · 共 ${steps} 階`,
    maxHueDrift: '最大色相漂移 |ΔH|',
    toneStepSub: (tStep: string) => `平均明度步進 |ΔT| ${tStep}`,
    meanPower: '平均 OLED 功耗',
    peakBlueSub: (stress: number) => `藍光應力峰值 ${stress}/100`,
  },
  stripTitle: '色階帶與相鄰步進 ΔE2000',
  stripBTitle: '色階 B 色階帶',
  tables: {
    stepDeltasTitle: '相鄰色階步進感知差值（Step-to-Step Deltas）',
    coordinatesTitle: '完整色度座標與 sRGB 色域利用率',
    contrastTitle: '無障礙對比度矩陣（WCAG 2.1 & APCA Lc）',
    emissiveTitle: '自發光 OLED 功耗與藍光子像素遙測',
    compareTitle: '色階 A vs 色階 B 逐階對比矩陣',
  },
  cols: {
    transition: '步進區間',
    step: '階',
    swatch: '色塊',
    hex: 'HEX',
    rgb: 'RGB (0–255)',
    hue: 'H°',
    chroma: 'C',
    tone: 'T',
    cieY: 'CIE Y',
    maxChroma: 'sRGB 上限 C',
    gamutUtil: '色域佔比',
    deltaT: 'ΔT',
    deltaC: 'ΔC',
    deltaH: 'ΔH°',
    deltaEOk: 'ΔE OK',
    deltaE2000: 'ΔE2000',
    vsWhite: '對 #FFFFFF',
    vsBlack: '對 #000000',
    vsRef: '對基準色',
    powerMw: '總功耗 (mW)',
    channelsMw: 'R / G / B (mW)',
    apl: 'APL %',
    blueStress: '藍光應力',
    pixelState: '像素',
    pair: '配對 (A / B)',
    wcagAB: 'WCAG A↔B',
    apcaAB: 'APCA A↔B',
    powerDelta: '功耗差 (B−A)',
  },
  pixelOff: '關斷',
  pixelActive: '點亮',
  outOfGamut: '超色域',
  inGamut: 'sRGB',
}

const CopyByLocale = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

function formatSigned(value: number, digits: number): string {
  const fixed = value.toFixed(digits)
  return value > 0 ? `+${fixed}` : fixed
}

function wcagBadgeClass(ratio: number): string {
  if (ratio >= 7) {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  }
  if (ratio >= 4.5) {
    return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
  }
  if (ratio >= 3) {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  }
  return 'bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20'
}

export function DeltaView() {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]
  const dispatch = useAppDispatch()

  const deltaState = useAppSelector((state) => state.delta)
  const customColors = useAppSelector(selectCustomLight)
  const scheme = useAppSelector(selectScheme)
  const refState = useAppSelector(selectReferenceHexState)
  const scaleA = useAppSelector(selectScaleACoreAnalysis)
  const scaleB = useAppSelector(selectScaleBCoreAnalysis)
  const contrastRows = useAppSelector(selectScaleAContrastRows)
  const pairRows = useAppSelector(selectScalePairComparison)

  const showToast = (msg: string) => {
    dispatch(setDeltaToast(msg))
    window.setTimeout(() => {
      dispatch(setDeltaToast(null))
    }, 2000)
  }

  const handleCopyText = async (text: string, toastLabel: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(toastLabel)
    } catch {
      showToast(toastLabel)
    }
  }

  const handleExportJson = () => {
    const payload = {
      scaleA: {
        source: deltaState.scaleASource,
        summary: scaleA.summary,
        steps: scaleA.steps,
        contrast: contrastRows,
      },
      ...(deltaState.compareEnabled
        ? {
            scaleB: {
              source: deltaState.scaleBSource,
              summary: scaleB.summary,
              steps: scaleB.steps,
            },
            comparison: pairRows,
          }
        : {}),
    }
    void handleCopyText(JSON.stringify(payload, null, 2), copy.copiedJson)
  }

  const showDeltas =
    deltaState.activeSection === 'all' || deltaState.activeSection === 'deltas'
  const showCoordinates =
    deltaState.activeSection === 'all' || deltaState.activeSection === 'coordinates'
  const showAccessibility =
    deltaState.activeSection === 'all' || deltaState.activeSection === 'accessibility'
  const showEmissive =
    deltaState.activeSection === 'all' || deltaState.activeSection === 'emissive'

  const renderRampStrip = (steps: typeof scaleA.steps) => {
    const useFullWidthBar = steps.length > 0 && steps.length <= 16
    return (
      <div className="flex flex-col gap-3 w-full min-w-0">
        {useFullWidthBar && (
          <div className="hidden lg:flex flex-col gap-1 w-full min-w-0">
            <div
              className="grid w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
              style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
            >
              {steps.map((step) => (
                <button
                  key={step.index}
                  type="button"
                  onClick={() => void handleCopyText(step.hex, copy.copiedHex(step.hex))}
                  className="h-16 min-w-0 flex flex-col items-center justify-center gap-0.5 px-1 transition-transform hover:z-10 hover:scale-[1.03]"
                  style={{
                    backgroundColor: step.swatchHex,
                    color: step.okyct.t > 55 ? '#000000' : '#FFFFFF',
                  }}
                  title={`${step.label}: ${step.hex}`}
                >
                  <span className="text-[11px] font-mono font-bold leading-none truncate max-w-full">
                    {step.label}
                  </span>
                  <span className="text-[9px] font-mono opacity-80 leading-none truncate max-w-full">
                    {step.hex}
                  </span>
                </button>
              ))}
            </div>

            {steps.length > 1 && (
              <div
                className="grid w-full"
                style={{
                  paddingInline: `calc(50% / ${steps.length})`,
                  gridTemplateColumns: `repeat(${steps.length - 1}, minmax(0, 1fr))`,
                }}
              >
                {steps.slice(1).map((step) => {
                  const d = step.deltaFromPrev
                  if (!d) return null
                  return (
                    <div
                      key={step.index}
                      className="flex flex-col items-center text-center min-w-0 px-0.5"
                      title={`${d.fromLabel} → ${d.toLabel}: ΔE2000 ${d.deltaE2000.toFixed(2)}, ΔT ${formatSigned(d.deltaT, 1)}`}
                    >
                      <span className="h-1.5 w-px bg-neutral-300 dark:bg-neutral-700 mb-0.5" />
                      <span className="text-[10px] font-mono font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums leading-tight truncate max-w-full">
                        {d.deltaE2000.toFixed(1)}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 tabular-nums leading-tight truncate max-w-full">
                        {formatSigned(d.deltaT, 0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div
          className={`grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2 ${
            useFullWidthBar ? 'lg:hidden' : 'lg:grid-cols-8 xl:grid-cols-10'
          }`}
        >
          {steps.map((step) => (
            <div key={step.index} className="flex flex-col gap-1 min-w-0">
              <button
                type="button"
                onClick={() => void handleCopyText(step.hex, copy.copiedHex(step.hex))}
                className="h-14 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center p-1 transition-transform hover:scale-[1.03]"
                style={{
                  backgroundColor: step.swatchHex,
                  color: step.okyct.t > 55 ? '#000000' : '#FFFFFF',
                }}
                title={`${step.label}: ${step.hex}`}
              >
                <span className="text-[10px] font-mono font-bold leading-tight">{step.label}</span>
                <span className="text-[9px] font-mono opacity-85 leading-tight">{step.hex}</span>
              </button>
              {step.deltaFromPrev ? (
                <div className="flex items-center justify-between px-1 text-[9px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                  <span>ΔE {step.deltaFromPrev.deltaE2000.toFixed(1)}</span>
                  <span>ΔT {formatSigned(step.deltaFromPrev.deltaT, 0)}</span>
                </div>
              ) : (
                <div className="px-1 text-[9px] font-mono text-neutral-400">—</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSourceSelector = (
    label: string,
    source: DeltaScaleSourceKind,
    customId: string,
    manualInput: string,
    invalidTokens: readonly string[],
    onSourceChange: (val: DeltaScaleSourceKind) => void,
    onCustomChange: (val: string) => void,
    onManualChange: (val: string) => void,
  ) => (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        <select
          value={source}
          onChange={(e) => onSourceChange(e.target.value as DeltaScaleSourceKind)}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          {DeltaPaletteKeys.map((key) => (
            <option key={key} value={key}>
              {copy.sourceOptions[key]}
            </option>
          ))}
          {customColors.length > 0 && (
            <option value="custom-palette">{copy.sourceOptions['custom-palette']}</option>
          )}
          <option value="manual">{copy.sourceOptions.manual}</option>
        </select>

        {source === 'custom-palette' && customColors.length > 0 && (
          <select
            value={customId || customColors[0].id}
            onChange={(e) => onCustomChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          >
            {customColors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.sourceHex})
              </option>
            ))}
          </select>
        )}
      </div>

      {source === 'manual' && (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={manualInput}
            onChange={(e) => onManualChange(e.target.value)}
            rows={2}
            placeholder={copy.manualPlaceholder}
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 resize-y"
          />
          {invalidTokens.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{copy.invalidTokensWarning(invalidTokens)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-8 flex flex-col gap-5">
      {deltaState.toast ? (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{deltaState.toast}</span>
        </div>
      ) : null}

      {/* Header & Controls */}
      <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-500" />
              {copy.title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {copy.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(setCompareEnabled(!deltaState.compareEnabled))}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                deltaState.compareEnabled
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
              }`}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              <span>{copy.compareToggle}</span>
            </button>

            <button
              type="button"
              onClick={() => dispatch(setApplyEmissiveProfile(!deltaState.applyEmissiveProfile))}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                deltaState.applyEmissiveProfile
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{copy.emissiveToggle}</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copy.copyJson}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {renderSourceSelector(
            copy.scaleALabel,
            deltaState.scaleASource,
            deltaState.scaleACustomId,
            deltaState.scaleAManualInput,
            scaleA.invalidTokens,
            (val) => dispatch(setScaleASource(val)),
            (val) => dispatch(setScaleACustomId(val)),
            (val) => dispatch(setScaleAManualInput(val)),
          )}

          {deltaState.compareEnabled ? (
            renderSourceSelector(
              copy.scaleBLabel,
              deltaState.scaleBSource,
              deltaState.scaleBCustomId,
              deltaState.scaleBManualInput,
              scaleB.invalidTokens,
              (val) => dispatch(setScaleBSource(val)),
              (val) => dispatch(setScaleBCustomId(val)),
              (val) => dispatch(setScaleBManualInput(val)),
            )
          ) : (
            <div className="flex flex-wrap items-center gap-2 self-start">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {copy.referenceLabel}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-6 h-6 rounded-md border border-neutral-300 dark:border-neutral-700 shrink-0"
                  style={{ backgroundColor: refState.hex }}
                />
                <input
                  type="text"
                  value={deltaState.referenceHexInput}
                  onChange={(e) => dispatch(setReferenceHexInput(e.target.value))}
                  className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => dispatch(setReferenceHexInput('#FFFFFF'))}
                  className="px-2 py-1 text-[11px] rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {copy.refWhite}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(setReferenceHexInput('#000000'))}
                  className="px-2 py-1 text-[11px] rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {copy.refBlack}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(setReferenceHexInput(scheme.surface))}
                  className="px-2 py-1 text-[11px] rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {copy.refSurface}
                </button>
              </div>
              {!refState.isValid && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                  {copy.invalidRefHint}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="pt-1">
          <Tabs
            label={copy.title}
            appearance="pill"
            size="sm"
            wrap
            value={deltaState.activeSection}
            onChange={(id) => dispatch(setActiveSection(id))}
            options={DeltaSectionIds.map((id) => ({
              id,
              label: copy.sections[id],
            }))}
          />
        </div>
      </section>

      {scaleA.steps.length === 0 ? (
        <div className="p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500 dark:text-neutral-400">
          {copy.emptyScale}
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {copy.kpi.meanDe2000}
              </span>
              <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {scaleA.summary.meanDeltaE2000.toFixed(2)}
              </span>
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                {copy.kpi.stdDevSub(
                  scaleA.summary.stdDevDeltaE2000.toFixed(2),
                  scaleA.summary.minDeltaE2000.toFixed(2),
                  scaleA.summary.maxDeltaE2000.toFixed(2),
                )}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {copy.kpi.meanDeOk}
              </span>
              <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {(scaleA.summary.meanDeltaEOk * 100).toFixed(2)}
              </span>
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                {copy.kpi.maxDeOkSub(
                  (scaleA.summary.maxDeltaEOk * 100).toFixed(2),
                  scaleA.summary.stepCount,
                )}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {copy.kpi.maxHueDrift}
              </span>
              <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {scaleA.summary.maxAbsDeltaH.toFixed(2)}°
              </span>
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                {copy.kpi.toneStepSub(scaleA.summary.meanToneStep.toFixed(1))}
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {copy.kpi.meanPower}
              </span>
              <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {scaleA.summary.meanPowerMw.toFixed(1)} <span className="text-sm font-normal">mW</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
                {copy.kpi.peakBlueSub(scaleA.summary.peakBlueStress)}
              </span>
            </div>
          </section>

          {/* Visual Step Delta Strip */}
          <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {copy.stripTitle}
            </h3>
            {renderRampStrip(scaleA.steps)}

            {deltaState.compareEnabled && scaleB.steps.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {copy.stripBTitle}
                </h4>
                {renderRampStrip(scaleB.steps)}
              </div>
            )}
          </section>

          {/* Scale A vs Scale B Comparison Table */}
          {deltaState.compareEnabled && pairRows.length > 0 && (
            <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <GitCompareArrows className="w-3.5 h-3.5" />
                {copy.tables.compareTitle}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <th className="py-2 pr-3">{copy.cols.pair}</th>
                      <th className="py-2 pr-3">{copy.cols.swatch}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaE2000}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaEOk}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaT}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaC}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaH}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.wcagAB}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.apcaAB}</th>
                      <th className="py-2 font-mono">{copy.cols.powerDelta}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70 font-mono tabular-nums">
                    {pairRows.map((row) => (
                      <tr key={row.index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="py-2 pr-3 font-semibold text-neutral-800 dark:text-neutral-200">
                          {row.labelA} / {row.labelB}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-5 h-5 rounded-md border border-neutral-300 dark:border-neutral-700"
                              style={{ backgroundColor: row.swatchA }}
                              title={row.hexA}
                            />
                            <span
                              className="w-5 h-5 rounded-md border border-neutral-300 dark:border-neutral-700"
                              style={{ backgroundColor: row.swatchB }}
                              title={row.hexB}
                            />
                          </div>
                        </td>
                        <td className="py-2 pr-3 font-semibold">{row.deltaE2000.toFixed(2)}</td>
                        <td className="py-2 pr-3">{(row.deltaEOk * 100).toFixed(2)}</td>
                        <td className="py-2 pr-3">{formatSigned(row.deltaT, 1)}</td>
                        <td className="py-2 pr-3">{formatSigned(row.deltaC, 4)}</td>
                        <td className="py-2 pr-3">{formatSigned(row.deltaH, 1)}°</td>
                        <td className="py-2 pr-3">{row.wcagBetweenAB.toFixed(2)}:1</td>
                        <td className="py-2 pr-3">{row.apcaBetweenAB.toFixed(1)}</td>
                        <td className="py-2">{formatSigned(row.powerDeltaMw, 1)} mW</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Table 1: Step-to-Step Deltas */}
          {showDeltas && scaleA.steps.length > 1 && (
            <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {copy.tables.stepDeltasTitle}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <th className="py-2 pr-3">{copy.cols.transition}</th>
                      <th className="py-2 pr-3">{copy.cols.swatch}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaT}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaC}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaH}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.deltaEOk} (×100)</th>
                      <th className="py-2 font-mono">{copy.cols.deltaE2000}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70 font-mono tabular-nums">
                    {scaleA.steps.map((step, idx) => {
                      if (!step.deltaFromPrev) return null
                      const prev = scaleA.steps[idx - 1]
                      const d = step.deltaFromPrev
                      return (
                        <tr key={step.index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                          <td className="py-2 pr-3 font-semibold text-neutral-800 dark:text-neutral-200">
                            {d.fromLabel} → {d.toLabel}
                          </td>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-1">
                              <span
                                className="w-5 h-5 rounded-md border border-neutral-300 dark:border-neutral-700"
                                style={{ backgroundColor: prev.swatchHex }}
                              />
                              <span className="text-neutral-400">→</span>
                              <span
                                className="w-5 h-5 rounded-md border border-neutral-300 dark:border-neutral-700"
                                style={{ backgroundColor: step.swatchHex }}
                              />
                            </div>
                          </td>
                          <td className="py-2 pr-3">{formatSigned(d.deltaT, 2)}</td>
                          <td className="py-2 pr-3">{formatSigned(d.deltaC, 4)}</td>
                          <td className="py-2 pr-3">{formatSigned(d.deltaH, 2)}°</td>
                          <td className="py-2 pr-3">{(d.deltaEOk * 100).toFixed(2)}</td>
                          <td className="py-2 font-semibold">{d.deltaE2000.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Table 2: Colorimetric Coordinates */}
          {showCoordinates && (
            <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {copy.tables.coordinatesTitle}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <th className="py-2 pr-3">{copy.cols.step}</th>
                      <th className="py-2 pr-3">{copy.cols.swatch}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.hex}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.rgb}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.hue}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.chroma}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.tone}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.cieY}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.maxChroma}</th>
                      <th className="py-2 font-mono">{copy.cols.gamutUtil}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70 font-mono tabular-nums">
                    {scaleA.steps.map((step) => (
                      <tr key={step.index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="py-2 pr-3 font-semibold">{step.label}</td>
                        <td className="py-2 pr-3">
                          <span
                            className="inline-block w-6 h-5 rounded-md border border-neutral-300 dark:border-neutral-700 align-middle"
                            style={{ backgroundColor: step.swatchHex }}
                          />
                        </td>
                        <td className="py-2 pr-3">
                          <button
                            type="button"
                            onClick={() => void handleCopyText(step.hex, copy.copiedHex(step.hex))}
                            className="hover:underline"
                          >
                            {step.hex}
                          </button>
                        </td>
                        <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">
                          {step.rgb255.r}, {step.rgb255.g}, {step.rgb255.b}
                        </td>
                        <td className="py-2 pr-3">{step.okyct.h.toFixed(1)}°</td>
                        <td className="py-2 pr-3">{step.okyct.c.toFixed(4)}</td>
                        <td className="py-2 pr-3">{step.okyct.t.toFixed(1)}</td>
                        <td className="py-2 pr-3">{step.cieY.toFixed(4)}</td>
                        <td className="py-2 pr-3">{step.maxSrgbChroma.toFixed(4)}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span>{(step.chromaUtilization * 100).toFixed(1)}%</span>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded border ${
                                step.inSrgbGamut
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {step.inSrgbGamut ? copy.inGamut : copy.outOfGamut}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Table 3: Accessibility Contrast Matrix */}
          {showAccessibility && (
            <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {copy.tables.contrastTitle}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <th className="py-2 pr-3">{copy.cols.step}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.hex}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.vsWhite} (WCAG / APCA)</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.vsBlack} (WCAG / APCA)</th>
                      <th className="py-2 font-mono">
                        {copy.cols.vsRef} {refState.hex} (WCAG / APCA)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70 font-mono tabular-nums">
                    {contrastRows.map((row) => (
                      <tr key={row.index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="py-2 pr-3 font-semibold">{row.label}</td>
                        <td className="py-2 pr-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-700"
                              style={{ backgroundColor: row.swatchHex }}
                            />
                            <span>{row.hex}</span>
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[11px] ${wcagBadgeClass(row.wcagVsWhite)}`}
                            >
                              {row.wcagVsWhite.toFixed(2)}:1
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              Lc {row.apcaVsWhite.toFixed(1)}
                            </span>
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[11px] ${wcagBadgeClass(row.wcagVsBlack)}`}
                            >
                              {row.wcagVsBlack.toFixed(2)}:1
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              Lc {row.apcaVsBlack.toFixed(1)}
                            </span>
                          </span>
                        </td>
                        <td className="py-2">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[11px] ${wcagBadgeClass(row.wcagVsRef)}`}
                            >
                              {row.wcagVsRef.toFixed(2)}:1
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              Lc {row.apcaVsRef.toFixed(1)}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Table 4: Emissive OLED Telemetry */}
          {showEmissive && (
            <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                {copy.tables.emissiveTitle}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                      <th className="py-2 pr-3">{copy.cols.step}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.hex}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.powerMw}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.channelsMw}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.apl}</th>
                      <th className="py-2 pr-3 font-mono">{copy.cols.blueStress}</th>
                      <th className="py-2">{copy.cols.pixelState}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/70 font-mono tabular-nums">
                    {scaleA.steps.map((step) => {
                      const tel = step.telemetry
                      return (
                        <tr key={step.index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                          <td className="py-2 pr-3 font-semibold">{step.label}</td>
                          <td className="py-2 pr-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="w-4 h-4 rounded border border-neutral-300 dark:border-neutral-700"
                                style={{ backgroundColor: step.swatchHex }}
                              />
                              <span>{step.hex}</span>
                            </span>
                          </td>
                          <td className="py-2 pr-3 font-semibold">{tel.powerMw.toFixed(1)}</td>
                          <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-300">
                            {tel.channelPowerMw.r.toFixed(1)} / {tel.channelPowerMw.g.toFixed(1)} /{' '}
                            {tel.channelPowerMw.b.toFixed(1)}
                          </td>
                          <td className="py-2 pr-3">{tel.aplPercent.toFixed(1)}%</td>
                          <td className="py-2 pr-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] ${
                                tel.blueStressIndex >= 60
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                  : tel.blueStressIndex >= 30
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {tel.blueStressIndex}/100
                            </span>
                          </td>
                          <td className="py-2 font-sans">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                tel.isPixelOff
                                  ? 'bg-neutral-800 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                                  : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                              }`}
                            >
                              {tel.isPixelOff ? copy.pixelOff : copy.pixelActive}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
