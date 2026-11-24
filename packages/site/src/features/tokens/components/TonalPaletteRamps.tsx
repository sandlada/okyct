import { Check } from 'lucide-react'
import { useI18n } from '../../../i18n/index.tsx'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { copyTokenText } from '../actions.ts'
import { selectRampFamilies } from '../selectors.ts'

type PaletteRampKey = 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'neutralVariant' | 'error' | 'warning' | 'success' | 'info'
type PaletteFamilyId = 'brand' | 'neutral' | 'semantic' | 'custom'

const EnglishCopy = {
  paletteSectionTitle: 'Full 13-step tonal palette ramps (Tone 0 → 100)',
  copiedToast: (label: string) => `Copied ${label}`,
  familyTitles: {
    brand: 'Brand',
    neutral: 'Neutral',
    semantic: 'Semantic',
    custom: 'Custom',
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
    custom: '自訂色族',
  },
  paletteNames: {
    primary: '主色 Primary',
    secondary: '次色 Secondary',
    tertiary: '第三色 Tertiary',
    neutral: '中性 Neutral',
    neutralVariant: '中性變體 Neutral Variant',
    error: '錯誤 Error',
    warning: '警告 Warning',
    success: '成功 Success',
    info: '資訊 Info',
  },
}

const CopyByLocale = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

export function TonalPaletteRamps() {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]
  const dispatch = useAppDispatch()
  const families = useAppSelector(selectRampFamilies)
  const toastMessage = useAppSelector((state) => state.tokens.toast)

  const copyToClipboard = (text: string, label: string) => {
    dispatch(copyTokenText(text, copy.copiedToast(label)))
  }

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
          {families.map((family) => (
            <div key={family.id} className={`flex flex-col gap-3 min-w-0 ${family.id === 'custom' ? 'lg:col-span-3' : ''}`}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {copy.familyTitles[family.id as PaletteFamilyId]}
              </h4>
              <div className={family.id === 'custom' ? 'grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3'}>
                {family.rows.map((row) => (
                  <div key={row.key} className="flex flex-col gap-1.5 min-w-0 w-full">
                    <div className="flex items-baseline gap-2 text-xs min-w-0">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300 text-[11px] sm:text-xs truncate">
                        {row.label ?? copy.paletteNames[row.key as PaletteRampKey]}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400 tabular-nums shrink-0">
                        {row.hue.toFixed(1)}°
                      </span>
                    </div>
                    <div className="w-full min-w-0 overflow-hidden">
                      <div className="grid grid-cols-13 h-8 sm:h-9 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 w-full min-w-0">
                        {row.swatches.map((swatch) => (
                          <button
                            key={swatch.tone}
                            type="button"
                            onClick={() =>
                              copyToClipboard(swatch.hex, `${row.label ?? copy.paletteNames[row.key as PaletteRampKey]} T${swatch.tone} (${swatch.hex})`)
                            }
                            className="group relative flex min-w-0 flex-col items-center justify-center text-[10px] font-mono transition-transform hover:scale-105 hover:z-10"
                            style={{
                              backgroundColor: swatch.hex,
                              color: swatch.tone > 55 ? '#000000' : '#ffffff',
                            }}
                            title={`T${swatch.tone}: ${swatch.hex}`}
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[9px] tabular-nums">
                              {swatch.tone}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
