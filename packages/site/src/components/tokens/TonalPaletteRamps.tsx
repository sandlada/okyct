import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { PaletteSet, STANDARD_TONES } from '../../color/palettes.ts'
import { useI18n } from '../../i18n/index.tsx'

type PaletteRampKey = keyof Pick<
  PaletteSet,
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'neutral'
  | 'neutralVariant'
  | 'error'
  | 'warning'
  | 'success'
  | 'info'
>

const PaletteFamilies = [
  {
    id: 'brand',
    keys: ['primary', 'secondary', 'tertiary'] as const satisfies readonly PaletteRampKey[],
  },
  {
    id: 'neutral',
    keys: ['neutral', 'neutralVariant'] as const satisfies readonly PaletteRampKey[],
  },
  {
    id: 'semantic',
    keys: ['error', 'warning', 'success', 'info'] as const satisfies readonly PaletteRampKey[],
  },
] as const

type PaletteFamilyId = (typeof PaletteFamilies)[number]['id']

const EnglishCopy = {
  paletteSectionTitle: 'Full 13-step tonal palette ramps (Tone 0 → 100)',
  copiedToast: (label: string) => `Copied ${label}`,
  familyTitles: {
    brand: 'Brand',
    neutral: 'Neutral',
    semantic: 'Semantic',
  } as Record<PaletteFamilyId, string>,
  paletteNames: {
    primary: 'Primary',
    secondary: 'Secondary',
    tertiary: 'Tertiary',
    neutral: 'Neutral',
    neutralVariant: 'Neutral variant',
    error: 'Error',
    warning: 'Warning',
    success: 'Success',
    info: 'Info',
  } as Record<PaletteRampKey, string>,
}

const TraditionalCopy: typeof EnglishCopy = {
  paletteSectionTitle: '全套 13 級 Tonal Palettes 物理色階（Tone 0 → 100）',
  copiedToast: (label: string) => `已複製 ${label}`,
  familyTitles: {
    brand: '品牌色族',
    neutral: '中性色族',
    semantic: '語意色族',
  },
  paletteNames: {
    primary: 'Primary',
    secondary: 'Secondary',
    tertiary: 'Tertiary',
    neutral: 'Neutral',
    neutralVariant: 'Neutral variant',
    error: 'Error',
    warning: 'Warning',
    success: 'Success',
    info: 'Info',
  },
}

const CopyByLocale = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

export const TonalPaletteRamps: React.FC<{ palettes: PaletteSet }> = ({ palettes }) => {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setToastMessage(copy.copiedToast(label))
    setTimeout(() => setToastMessage(null), 2000)
  }

  const renderRamp = (key: PaletteRampKey) => (
    <div key={key} className="flex flex-col gap-1.5 min-w-0 w-full">
      <div className="flex items-baseline gap-2 text-xs min-w-0">
        <span className="font-medium text-neutral-700 dark:text-neutral-300 text-[11px] sm:text-xs truncate">
          {copy.paletteNames[key]}
        </span>
        <span className="font-mono text-[10px] text-neutral-400 tabular-nums shrink-0">
          {palettes[key].hue.toFixed(1)}°
        </span>
      </div>
      <div className="w-full min-w-0 overflow-hidden">
        <div className="grid grid-cols-13 h-8 sm:h-9 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 w-full min-w-0">
          {STANDARD_TONES.map((t) => {
            const hex = palettes[key].tone(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() =>
                  copyToClipboard(hex, `${copy.paletteNames[key]} T${t} (${hex})`)
                }
                className="group relative flex min-w-0 flex-col items-center justify-center text-[10px] font-mono transition-transform hover:scale-105 hover:z-10"
                style={{
                  backgroundColor: hex,
                  color: t > 55 ? '#000000' : '#ffffff',
                }}
                title={`T${t}: ${hex}`}
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[9px] tabular-nums">
                  {t}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {toastMessage ? (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {copy.paletteSectionTitle}
        </h3>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start min-w-0">
          {PaletteFamilies.map((family) => (
            <div key={family.id} className="flex flex-col gap-3 min-w-0">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {copy.familyTitles[family.id]}
              </h4>
              <div className="flex flex-col gap-3">
                {family.keys.map((key) => renderRamp(key))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
