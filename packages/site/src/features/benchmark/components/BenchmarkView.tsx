
import { Scale } from 'lucide-react'
import { useI18n } from '../../../i18n/index.tsx'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { BenchmarkFairMatrixTable } from './BenchmarkFairMatrixTable.tsx'
import { selectStudioBenchmark } from '../selectors.ts'
import { toggleYellowMode, YellowDemo } from '../slice.ts'

const EnglishCopy = {
  title: '3-Model Fair Color Benchmark',
  sourceSummary: (hex: string) => `OKYCT vs Google MCU vs culori · CIE L* axis · Seed ${hex}`,
  modelComparisonTitle: 'Measured stops (10 × CIE L*)',
  baselineLabel: 'Protocol v2 · shared quantizeNearest · MCU native 8-bit',
  columnModel: 'Model',
  columnSolveTime: 'Median time',
  columnDeltaLP95: 'ΔL* p95',
  columnWeightedHueMean: 'Weighted ΔH mean (OKLab)',
  columnWeightedHueP95: 'Weighted ΔH p95',
  columnContrastGate: 'Semantic role AA',
  columnNotes: 'Adapter',
  modelOkyct: 'OKYCT',
  modelCam16: 'Google MCU (HCT)',
  modelCulori: 'culori (OKLCH L* solve)',
  tonalScale: (modelName: string) => `${modelName} tonal scale`,
  highLuminanceTitle: 'High-Luminance Seed Decoupling Test (#FFD600)',
  naiveModeLabel: 'Naive Raw Color (1.3:1 failure)',
  okyctModeLabel: 'OKYCT Role Decoupling (4.5:1 AA)',
  confirmPayment: 'Confirm Payment ￥199.00',
  primaryButtonLabel: 'Primary Button (T40)',
  primaryContainerLabel: 'Primary Container (T90)',
  naiveContrast: (ratio: string) => `Contrast ${ratio}:1 (extremely blurry, unreadable)`,
  okyctContrast: (ratio: string) =>
    `Primary button contrast ${ratio}:1 (meets WCAG AA) · Container retains vivid yellow energy`,
}

const TraditionalCopy: typeof EnglishCopy = {
  title: '三模型公平色彩標竿',
  sourceSummary: (hex: string) => `OKYCT vs Google MCU vs culori · CIE L* 軸 · 種子 ${hex}`,
  modelComparisonTitle: '實測色階（10 × CIE L*）',
  baselineLabel: '協議 v2 · 共享 quantizeNearest · MCU 原生 8-bit',
  columnModel: '模型',
  columnSolveTime: '耗時中位',
  columnDeltaLP95: 'ΔL* p95',
  columnWeightedHueMean: '加權 ΔH 平均 (OKLab)',
  columnWeightedHueP95: '加權 ΔH p95',
  columnContrastGate: '語義角色 AA',
  columnNotes: '適配器',
  modelOkyct: 'OKYCT',
  modelCam16: 'Google MCU (HCT)',
  modelCulori: 'culori (OKLCH L* 求解)',
  tonalScale: (modelName: string) => `${modelName} 色階`,
  highLuminanceTitle: '高明度種子色解耦實測 (#FFD600)',
  naiveModeLabel: '樸素原色直接套用 (1.3:1 事故)',
  okyctModeLabel: 'OKYCT 角色解耦 (4.5:1 AA)',
  confirmPayment: '確認付款 ￥199.00',
  primaryButtonLabel: '主要按鈕 (T40)',
  primaryContainerLabel: '主容器 (T90)',
  naiveContrast: (ratio: string) => `對比度 ${ratio}:1 (極度模糊不可讀)`,
  okyctContrast: (ratio: string) =>
    `主按鈕對比度 ${ratio}:1 (符合 WCAG AA) · 容器保留亮黃活力`,
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

export function BenchmarkView() {
  const { locale } = useI18n()
  const copy = Copy[locale]
  const dispatch = useAppDispatch()
  const { sourceHex, yellowMode, results: benchmarkResults, matrix: benchmarkMatrix } = useAppSelector(selectStudioBenchmark)

  const getModelLabel = (modelId: string) => {
    switch (modelId) {
      case 'okyct':
        return copy.modelOkyct
      case 'google-mcu':
        return copy.modelCam16
      case 'culori':
        return copy.modelCulori
      default:
        return modelId
    }
  }

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-5 sm:gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-neutral-500 shrink-0" />
          <h2 className="text-sm sm:text-base font-bold font-display tracking-tight">
            {copy.title}
          </h2>
        </div>
        <span className="text-[11px] font-mono text-neutral-500">
          {copy.sourceSummary(sourceHex.toUpperCase())}
        </span>
      </div>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {copy.modelComparisonTitle}
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">{copy.baselineLabel}</span>
        </div>

        <BenchmarkFairMatrixTable matrix={benchmarkMatrix} />

        <div className="flex flex-col gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {benchmarkResults.map((m) => (
            <div key={m.modelId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {copy.tonalScale(getModelLabel(m.modelId))}
                </span>
                <span className="font-mono text-neutral-400 text-[10px]">
                  ΔL* p95 = {m.deltaLStarP95.toFixed(2)} · L* mean err{' '}
                  {m.deltaLStarMean.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-10 h-8 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                {m.stops.map((stop) => (
                  <div
                    key={stop.stopName}
                    className="flex flex-col items-center justify-center text-[9px] font-mono"
                    style={{
                      backgroundColor: stop.hex,
                      color: stop.actualTone > 55 ? '#000000' : '#ffffff',
                    }}
                    title={`${stop.stopName}: ${stop.hex} | L*=${stop.actualLStar} | wΔH=${stop.weightedHueDeg.oklab.toFixed(2)}°`}
                  >
                    <span>{stop.stopName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {copy.highLuminanceTitle}
          </h3>
          <button
            type="button"
            onClick={() => dispatch(toggleYellowMode())}
            className="text-[11px] font-mono px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700"
          >
            {yellowMode === 'naive' ? copy.okyctModeLabel : copy.naiveModeLabel}
          </button>
        </div>
        <div
          className="rounded-xl p-6 flex flex-col gap-3 border"
          style={{
            backgroundColor: yellowMode === 'naive' ? YellowDemo.naive : YellowDemo.primary,
            color: yellowMode === 'naive' ? '#000' : '#fff',
            borderColor: 'rgba(128,128,128,0.3)',
          }}
        >
          <button
            type="button"
            className="self-start px-4 py-2 rounded-lg font-semibold text-sm"
            style={{
              backgroundColor: yellowMode === 'naive' ? '#fff' : YellowDemo.primary,
              color: yellowMode === 'naive' ? YellowDemo.naive : '#fff',
            }}
          >
            {copy.confirmPayment}
          </button>
          <p className="text-xs font-mono opacity-90">
            {yellowMode === 'naive'
              ? copy.naiveContrast(YellowDemo.naiveContrast.toFixed(1))
              : copy.okyctContrast(YellowDemo.okyctContrast.toFixed(1))}
          </p>
          {yellowMode === 'okyct' && (
            <YellowContainerSwatch hex={YellowDemo.container} label={copy.primaryContainerLabel} />
          )}
        </div>
      </section>
    </div>
  )
}

function YellowContainerSwatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 h-8 rounded border border-black/10" style={{ backgroundColor: hex }} />
      <span>{label}</span>
    </div>
  )
}
