import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useAppSelector } from '../../../app/store.ts'
import { useI18n } from '../../../i18n/index.tsx'
import { selectPalettes } from '../../studio/selectors.ts'
import type { StandardPaletteKey } from '../../../color/palettes.ts'
import {
  getContrastRatio,
  getDeltaE2000,
  hexToOkyct,
  shortestHueDelta,
  toneToY,
} from '../../../color/math.ts'

const PaletteEntries: readonly { key: StandardPaletteKey; code: string; label: string }[] = [
  { key: 'primary', code: 'P', label: 'Primary' },
  { key: 'secondary', code: 'S', label: 'Secondary' },
  { key: 'tertiary', code: 'T', label: 'Tertiary' },
  { key: 'error', code: 'E', label: 'Error' },
  { key: 'neutral', code: 'N', label: 'Neutral' },
  { key: 'neutralVariant', code: 'NV', label: 'Neutral Variant' },
  { key: 'success', code: 'S', label: 'Success' },
  { key: 'info', code: 'I', label: 'Info' },
  { key: 'warning', code: 'W', label: 'Warning' },
]

const FineTones: readonly number[] = Array.from({ length: 101 }, (_, i) => i)

const RampGridTemplate = 'repeat(101, minmax(0, 1fr))'

const CopyByLocale = {
  en: {
    title: 'Tonal Palettes (PSTENNVSIW)',
    subtitle: '101-stop perceptual ramps (0–100, step 1) across 9 semantic & brand palettes. Drag the aligned selector or click any swatch.',
    focusTitle: (tone: number) => `Focused Column — Tone ${tone}`,
    selectorLabel: 'Tone Column Selector',
    copied: (msg: string) => `Copied ${msg}`,
    metrics: {
      tone: 'Tone',
      luminance: 'Lum Y',
      deltaE: 'Step ΔE₀₀',
      hueDrift: 'Hue ΔH',
      chroma: 'Chroma',
      contrast: 'WCAG',
    },
    paletteLabels: {
      primary: 'Primary',
      secondary: 'Secondary',
      tertiary: 'Tertiary',
      error: 'Error',
      neutral: 'Neutral',
      neutralVariant: 'Neutral Variant',
      success: 'Success',
      info: 'Info',
      warning: 'Warning',
    } as Record<StandardPaletteKey, string>,
  },
  'zh-Hant': {
    title: 'Tonal Palettes 色階矩陣 (PSTENNVSIW)',
    subtitle: '涵蓋 9 組色盤、0–100（步長 1）共 101 級精細明度停靠點。拖動下方對齊拉條或點擊色塊即可聚焦檢視該欄位。',
    focusTitle: (tone: number) => `聚焦欄位 — Tone ${tone}`,
    selectorLabel: 'Tone 欄位選擇器',
    copied: (msg: string) => `已複製 ${msg}`,
    metrics: {
      tone: '明度 T',
      luminance: '亮度 Y',
      deltaE: '階差 ΔE₀₀',
      hueDrift: '色相漂移',
      chroma: '色度 C',
      contrast: '對比度',
    },
    paletteLabels: {
      primary: '主色 Primary',
      secondary: '次色 Secondary',
      tertiary: '第三色 Tertiary',
      error: '錯誤 Error',
      neutral: '中性 Neutral',
      neutralVariant: '中性變體 Neutral Variant',
      success: '成功 Success',
      info: '資訊 Info',
      warning: '警告 Warning',
    } as Record<StandardPaletteKey, string>,
  },
} as const

export function PalettesView() {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]
  const palettes = useAppSelector(selectPalettes)
  const [selectedIndex, setSelectedIndex] = useState<number>(40) // Tone 40
  const [toast, setToast] = useState<string | null>(null)

  const selectedTone = FineTones[selectedIndex] ?? 40

  const copyHex = async (hex: string, label: string) => {
    await navigator.clipboard.writeText(hex)
    setToast(copy.copied(`${label}: ${hex}`))
    setTimeout(() => setToast(null), 1500)
  }

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 max-w-[1600px] mx-auto w-full">
      {toast ? (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toast}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
              {copy.title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {copy.subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {PaletteEntries.map((entry) => {
              const palette = palettes[entry.key]
              return (
                <div key={entry.key} className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2 text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {copy.paletteLabels[entry.key]} ({entry.code})
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400 tabular-nums">
                      {palette.hue.toFixed(1)}°
                    </span>
                  </div>

                  <div
                    className="grid w-full items-start"
                    style={{ gridTemplateColumns: RampGridTemplate }}
                  >
                    {FineTones.map((tone, idx) => {
                      const hex = palette.tone(tone).toUpperCase()
                      const isSelected = idx === selectedIndex
                      const showLabel = tone % 5 === 0
                      return (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => {
                            setSelectedIndex(idx)
                            void copyHex(hex, `${copy.paletteLabels[entry.key]} T${tone}`)
                          }}
                          title={`${copy.paletteLabels[entry.key]} T${tone}: ${hex}`}
                          className="group flex flex-col items-stretch gap-1 p-0 border-0 bg-transparent cursor-pointer focus:outline-none"
                        >
                          <span
                            className={`block h-7 w-full transition-transform ${
                              idx === 0 ? 'rounded-l-md' : ''
                            } ${idx === FineTones.length - 1 ? 'rounded-r-md' : ''} ${
                              isSelected
                                ? 'ring-2 ring-neutral-900 dark:ring-white z-10 scale-y-110'
                                : 'group-hover:scale-y-105'
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                          <span
                            className={`text-center leading-none tabular-nums text-[9px] whitespace-nowrap ${
                              isSelected
                                ? 'font-bold text-neutral-900 dark:text-white'
                                : 'font-medium text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            {showLabel ? tone : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Full-width Tone Column Slider aligned with the ramp grid */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                {copy.selectorLabel}
              </span>
              <span className="font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 tabular-nums">
                Tone {selectedTone}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
              aria-label={copy.selectorLabel}
            />
          </div>
        </section>

        {/* Focused Swatches for the Selected Tone Column */}
        <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
          <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {copy.focusTitle(selectedTone)}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
            {PaletteEntries.map((entry) => {
              const palette = palettes[entry.key]
              const hex = palette.tone(selectedTone).toUpperCase()
              const lightText = selectedTone < 55
              const textHex = lightText ? '#FFFFFF' : '#111111'
              const actual = hexToOkyct(hex)
              const luminance = toneToY(actual.t)
              const refTone = selectedTone > 0 ? selectedTone - 1 : 1
              const stepDeltaE = getDeltaE2000(palette.tone(refTone), hex)
              const hueDrift = actual.c < 0.002 ? 0 : shortestHueDelta(palette.hue, actual.h)
              const contrast = getContrastRatio(textHex, hex)
              const toneDrift = actual.t - selectedTone

              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => void copyHex(hex, `${copy.paletteLabels[entry.key]} T${selectedTone}`)}
                  className="group rounded-xl p-3 flex flex-col justify-between gap-2.5 border border-neutral-200/70 dark:border-neutral-700/70 text-left cursor-pointer transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: hex,
                    color: textHex,
                  }}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-[11px] font-bold truncate">
                      {copy.paletteLabels[entry.key]}
                    </span>
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-80 transition-opacity shrink-0" />
                  </div>

                  <div className="flex flex-col gap-0.5 border-y border-current/15 py-1.5 font-mono text-[10px] leading-tight tabular-nums">
                    <div className="flex items-center justify-between gap-1">
                      <span className="opacity-70">{copy.metrics.tone}</span>
                      <span className="font-semibold">
                        {actual.t.toFixed(1)}
                        {Math.abs(toneDrift) >= 0.05 ? ` (${toneDrift >= 0 ? '+' : ''}${toneDrift.toFixed(1)})` : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="opacity-70">{copy.metrics.luminance}</span>
                      <span className="font-semibold">{(luminance * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="opacity-70">{copy.metrics.deltaE}</span>
                      <span className="font-semibold">{stepDeltaE.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="opacity-70">{copy.metrics.hueDrift}</span>
                      <span className="font-semibold">
                        {hueDrift >= 0 ? '+' : ''}
                        {hueDrift.toFixed(2)}°
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="opacity-70">{copy.metrics.chroma}</span>
                      <span className="font-semibold">{actual.c.toFixed(3)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="opacity-70">{copy.metrics.contrast}</span>
                      <span className="font-semibold">{contrast.toFixed(2)}:1</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-1 w-full">
                    <span className="font-mono text-[11px] font-semibold opacity-90">
                      {hex}
                    </span>
                    <span className="text-[10px] font-bold opacity-75">
                      {entry.code}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
