import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useAppSelector } from '../../../app/store.ts'
import { useI18n } from '../../../i18n/index.tsx'
import { selectPalettes } from '../../studio/selectors.ts'
import type { StandardPaletteKey } from '../../../color/palettes.ts'

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

const FineTones: readonly number[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
  91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
]

const TotalTrackUnits = 21

const ToneUnitCenters: readonly number[] = FineTones.map((_, idx) => {
  if (idx < 10) return (idx + 0.5) * 0.2
  if (idx < 27) return 2 + (idx - 10 + 0.5)
  return 19 + (idx - 27 + 0.5) * 0.2
})

function findNearestToneIndex(unitPos: number): number {
  let bestIdx = 0
  let bestDist = Math.abs(unitPos - ToneUnitCenters[0])
  for (let i = 1; i < ToneUnitCenters.length; i += 1) {
    const dist = Math.abs(unitPos - ToneUnitCenters[i])
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  }
  return bestIdx
}

const RampGridTemplate =
  'repeat(10, minmax(0, 0.2fr)) repeat(17, minmax(0, 1fr)) repeat(10, minmax(0, 0.2fr))'

const CopyByLocale = {
  en: {
    title: 'Tonal Palettes (PSTENNVSIW)',
    subtitle: '37-stop perceptual ramps across 9 semantic & brand palettes. Drag the aligned selector or click any swatch.',
    focusTitle: (tone: number) => `Focused Column — Tone ${tone}`,
    selectorLabel: 'Tone Column Selector',
    copied: (msg: string) => `Copied ${msg}`,
  },
  'zh-Hant': {
    title: 'Tonal Palettes 色階矩陣 (PSTENNVSIW)',
    subtitle: '涵蓋 9 組色盤、37 級精細明度停靠點。拖動下方對齊拉條或點擊色塊即可聚焦檢視該欄位。',
    focusTitle: (tone: number) => `聚焦欄位 — Tone ${tone}`,
    selectorLabel: 'Tone 欄位選擇器',
    copied: (msg: string) => `已複製 ${msg}`,
  },
} as const

export function PalettesView() {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]
  const palettes = useAppSelector(selectPalettes)
  const [selectedIndex, setSelectedIndex] = useState<number>(16) // Tone 40
  const [toast, setToast] = useState<string | null>(null)

  const selectedTone = FineTones[selectedIndex] ?? 40
  const sliderUnitValue = ToneUnitCenters[selectedIndex] ?? 8.5

  const copyHex = async (hex: string, label: string) => {
    await navigator.clipboard.writeText(hex)
    setToast(copy.copied(`${label}: ${hex}`))
    setTimeout(() => setToast(null), 1500)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-100 dark:bg-neutral-950">
      {toast ? (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toast}</span>
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto flex flex-col gap-4">
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
                      {entry.label} ({entry.code})
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
                      const isNarrow = tone <= 9 || tone >= 91
                      return (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => {
                            setSelectedIndex(idx)
                            void copyHex(hex, `${entry.label} T${tone}`)
                          }}
                          title={`${entry.label} T${tone}: ${hex}`}
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
                            className={`text-center leading-none tabular-nums ${
                              isNarrow ? 'text-[8px] tracking-tighter' : 'text-[10px]'
                            } ${
                              isSelected
                                ? 'font-bold text-neutral-900 dark:text-white'
                                : 'font-medium text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            {tone}
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
              max={TotalTrackUnits}
              step={0.05}
              value={sliderUnitValue}
              onChange={(e) => setSelectedIndex(findNearestToneIndex(Number(e.target.value)))}
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

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {PaletteEntries.map((entry) => {
              const hex = palettes[entry.key].tone(selectedTone).toUpperCase()
              const lightText = selectedTone < 55
              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => void copyHex(hex, `${entry.label} T${selectedTone}`)}
                  className="group rounded-xl p-3 flex flex-col justify-between min-h-[84px] border border-neutral-200/70 dark:border-neutral-700/70 text-left cursor-pointer transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: hex,
                    color: lightText ? '#FFFFFF' : '#111111',
                  }}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-[11px] font-bold truncate">
                      {entry.label}
                    </span>
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-80 transition-opacity shrink-0" />
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
