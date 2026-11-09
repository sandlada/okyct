
import React, { useState, useMemo } from 'react'
import { runModelBenchmark } from '../../color/benchmark.ts'
import { getContrastRatio } from '../../color/math.ts'
import { Scale, CheckCircle2, EyeOff } from 'lucide-react'
import { useI18n } from '../../i18n/index.tsx'

const EnglishCopy = {
  title: '5-Model Color Benchmarking & Telemetry',
  sourceSummary: (hex: string) => `OKYCT vs Google MCU vs culori vs AntD vs HSL · Seed ${hex}`,
  modelComparisonTitle: 'Side-by-Side Model Measurements & Tone Comparison',
  baselineLabel: 'Real libraries: @material/material-color-utilities, culori, @ant-design/colors',
  columnModel: 'Model',
  columnSolveTime: 'Solve Time',
  columnMaxHueDrift: 'Max Hue Drift (ΔH)',
  columnMeanHueDrift: 'Mean ΔH',
  columnWcagAaPassRate: 'WCAG AA Pass Rate',
  columnBluePurpleStability: 'Blue-Purple Stability',
  columnComplexity: 'Computational Complexity',
  modelOkyct: 'OKYCT (this engine)',
  modelCam16: 'Google MCU (CAM16)',
  modelCulori: 'culori (OKLCH)',
  modelAntd: '@ant-design/colors',
  modelSrgb: 'Legacy HSL (sRGB)',
  stabilityStable: 'Stable, artifact-free',
  stabilityCam16: 'Blue-to-purple inversion',
  stabilityCulori: 'Chroma clipping shift',
  stabilityAntd: 'Hue rotational distortion',
  stabilitySrgb: 'Channel clipping distortion',
  complexityOkyct: 'O(1) Newton tangent method',
  complexityCam16: 'Nested double bisection',
  complexityCulori: 'Bisection clampChroma',
  complexityAntd: 'Empirical HSV steps',
  complexitySrgb: 'Plain polar coordinates',
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
  title: '五模型色彩標竿比較與遙測',
  sourceSummary: (hex: string) => `OKYCT vs Google MCU vs culori vs AntD vs HSL · 種子色 ${hex}`,
  modelComparisonTitle: '同畫面模型實測與色階對比',
  baselineLabel: '真實第三方庫實測：@material/material-color-utilities、culori、@ant-design/colors',
  columnModel: '模型',
  columnSolveTime: '求解耗時',
  columnMaxHueDrift: '最大色相漂移 (ΔH)',
  columnMeanHueDrift: '平均 ΔH',
  columnWcagAaPassRate: 'WCAG AA 達標率',
  columnBluePurpleStability: '藍紫區穩定性',
  columnComplexity: '計算複雜度',
  modelOkyct: '自研 OKYCT 模型',
  modelCam16: 'Google MCU (CAM16)',
  modelCulori: 'culori (OKLCH)',
  modelAntd: '@ant-design/colors',
  modelSrgb: '傳統 HSL 模型',
  stabilityStable: '穩定無偽影',
  stabilityCam16: '藍變紫逆向扭曲',
  stabilityCulori: '色度折返微偏',
  stabilityAntd: '色相旋轉失真',
  stabilitySrgb: '通道截斷失真',
  complexityOkyct: 'O(1) 牛頓切線',
  complexityCam16: '雙重二分迭代',
  complexityCulori: '二分 clampChroma',
  complexityAntd: '經驗 HSV 步進',
  complexitySrgb: '簡單極座標',
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

interface BenchmarkViewProps {
  sourceHex: string
  isDark: boolean
}

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({ sourceHex }) => {
  const { locale } = useI18n()
  const copy = Copy[locale]

  // 调用独立 @sandlada/benchmark 运行五模型实测
  const benchmarkResults = useMemo(() => {
    return runModelBenchmark(sourceHex)
  }, [sourceHex])

  // 试验台：黄色对比度反例体验
  const [yellowMode, setYellowMode] = useState<'naive' | 'okyct'>('okyct')
  const naiveYellow = '#FFD600' // 纯高亮黄 (Tone ~92)
  const okyctYellowPrimary = '#705D00' // 适合白字的深琥珀黄 (Tone 40)
  const okyctYellowContainer = '#FFE264' // 高光黄容器 (Tone 90)

  const naiveContrastWithWhite = getContrastRatio(92, 100)
  const okyctContrastWithWhite = getContrastRatio(40, 100)

  const getModelDisplayInfo = (modelId: string) => {
    switch (modelId) {
      case 'okyct':
        return { label: copy.modelOkyct, stability: copy.stabilityStable, complexity: copy.complexityOkyct }
      case 'google-mcu':
        return { label: copy.modelCam16, stability: copy.stabilityCam16, complexity: copy.complexityCam16 }
      case 'culori':
        return { label: copy.modelCulori, stability: copy.stabilityCulori, complexity: copy.complexityCulori }
      case 'antd-colors':
        return { label: copy.modelAntd, stability: copy.stabilityAntd, complexity: copy.complexityAntd }
      case 'hsl':
      default:
        return { label: copy.modelSrgb, stability: copy.stabilitySrgb, complexity: copy.complexitySrgb }
    }
  }

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-5 sm:gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6">
      {/* 头部标题与遥测概览 */}
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

      {/* 1. 五模型综合对标指标看板 */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {copy.modelComparisonTitle}
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">
            {copy.baselineLabel}
          </span>
        </div>

        {/* 综合指标表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400 font-mono">
                <th className="pb-2 font-medium">{copy.columnModel}</th>
                <th className="pb-2 font-medium">{copy.columnSolveTime}</th>
                <th className="pb-2 font-medium">{copy.columnMaxHueDrift}</th>
                <th className="pb-2 font-medium">{copy.columnMeanHueDrift}</th>
                <th className="pb-2 font-medium">{copy.columnWcagAaPassRate}</th>
                <th className="pb-2 font-medium">{copy.columnBluePurpleStability}</th>
                <th className="pb-2 font-medium">{copy.columnComplexity}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono text-[11px]">
              {benchmarkResults.map((m) => {
                const info = getModelDisplayInfo(m.modelId)
                return (
                  <tr key={m.modelId} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                    <td className="py-2.5 font-bold font-sans text-neutral-900 dark:text-neutral-100">
                      {info.label}
                    </td>
                    <td className="py-2.5 tabular-nums text-neutral-600 dark:text-neutral-400">
                      {m.computeTimeMs.toFixed(2)} ms ({m.relativeSpeedup}x)
                    </td>
                    <td className="py-2.5 tabular-nums">
                      <span
                        className={`font-semibold ${
                          m.maxHueDriftDeg <= 2.5
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {m.maxHueDriftDeg.toFixed(1)}°
                      </span>
                    </td>
                    <td className="py-2.5 tabular-nums text-neutral-600 dark:text-neutral-400">
                      {m.meanHueDriftDeg.toFixed(2)}°
                    </td>
                    <td className="py-2.5 tabular-nums font-semibold">
                      <span className={m.wcagAaPassRate >= 90 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.wcagAaPassRate}%
                      </span>
                    </td>
                    <td className="py-2.5 font-sans text-neutral-600 dark:text-neutral-400">
                      {info.stability}
                    </td>
                    <td className="py-2.5 font-sans text-neutral-600 dark:text-neutral-400">
                      {info.complexity}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 各模型色阶色条 */}
        <div className="flex flex-col gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {benchmarkResults.map((m) => {
            const info = getModelDisplayInfo(m.modelId)
            return (
              <div key={m.modelId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    {copy.tonalScale(info.label)}
                  </span>
                  <span className="font-mono text-neutral-400 text-[10px]">
                    ΔH_max = {m.maxHueDriftDeg.toFixed(1)}° | ΔT_max = {m.maxToneDelta}
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
                      title={`${stop.stopName}: ${stop.hex} | Tone: ${stop.actualTone} | ΔH: ${stop.oklabHueDrift}°`}
                    >
                      <span>{stop.stopName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. 亮黄对比度解耦试验台 */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {copy.highLuminanceTitle}
          </h3>
          <div className="flex items-center gap-1 p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setYellowMode('naive')}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                yellowMode === 'naive'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {copy.naiveModeLabel}
            </button>
            <button
              onClick={() => setYellowMode('okyct')}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                yellowMode === 'okyct'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {copy.okyctModeLabel}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {yellowMode === 'naive' ? (
              <button
                className="px-5 py-2 rounded-lg text-xs font-bold shadow-xs cursor-not-allowed"
                style={{ backgroundColor: naiveYellow, color: '#ffffff' }}
              >
                {copy.confirmPayment}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-xs font-bold shadow-xs"
                  style={{ backgroundColor: okyctYellowPrimary, color: '#ffffff' }}
                >
                  {copy.primaryButtonLabel}
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-xs font-bold"
                  style={{ backgroundColor: okyctYellowContainer, color: '#221B00' }}
                >
                  {copy.primaryContainerLabel}
                </button>
              </div>
            )}
          </div>

          <div className="text-xs font-mono">
            {yellowMode === 'naive' ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" />
                {copy.naiveContrast(naiveContrastWithWhite.toFixed(2))}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {copy.okyctContrast(okyctContrastWithWhite.toFixed(2))}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
