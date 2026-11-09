
import { Copy, Check, Terminal, FileCode, Sliders } from 'lucide-react'
import { useI18n } from '../../../i18n/index.tsx'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { copyExportCode } from '../actions.ts'
import { selectExportCode } from '../selectors.ts'
import { setCssSchemeMode, setExportFormat, setTailwindFallback } from '../slice.ts'
import { Tabs } from '../../../ui/Tabs.tsx'

const EnglishCopy = {
  pageTitle: 'Token matrix & production code export',
  pageDescription:
    'Export bundles every MD3 system token plus the custom semantic color quadruplets.',
  copiedToClipboard: 'Copied to clipboard',
  copyFullCode: 'Copy full code',
  cssClass: 'Classes',
  cssLightDark: 'light-dark()',
  twNoFallback: 'No fallback',
  twFallback: 'With fallback',
}

const TraditionalCopy: typeof EnglishCopy = {
  pageTitle: 'Token 矩陣與生產程式碼匯出',
  pageDescription:
    '匯出內容自動包含全部 MD3 系統 Token 與自訂擴充語意色四元組。',
  copiedToClipboard: '已複製到剪貼簿',
  copyFullCode: '複製整段程式碼',
  cssClass: '類名',
  cssLightDark: 'light-dark()',
  twNoFallback: '無 fallback',
  twFallback: '有 fallback',
}

const CopyByLocale = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

export function TokenExportView() {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]
  const dispatch = useAppDispatch()
  const activeFormat = useAppSelector((state) => state.export.format)
  const cssSchemeMode = useAppSelector((state) => state.export.cssSchemeMode)
  const tailwindFallback = useAppSelector((state) => state.export.tailwindFallback)
  const copiedCode = useAppSelector((state) => state.export.copied)
  const exportCode = useAppSelector(selectExportCode)

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-6 sm:gap-8 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 relative">
      {/* 头部标题 */}
      <div>
        <h2 className="text-base sm:text-lg font-bold font-display tracking-tight">
          {copy.pageTitle}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {copy.pageDescription}
        </p>
      </div>

      {/* 生产级多格式代码导出器 */}
      <section className="p-4 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            label={copy.pageTitle}
            appearance="pill"
            size="md"
            wrap
            value={activeFormat}
            onChange={(id) => dispatch(setExportFormat(id))}
            options={[
              { id: 'css', label: 'CSS Variables', icon: FileCode },
              { id: 'tailwind', label: 'Tailwind v4', icon: Terminal },
              { id: 'w3c', label: 'W3C Tokens', icon: Sliders },
              { id: 'ts', label: 'TypeScript', icon: FileCode },
            ]}
          />

          <button
            onClick={() => dispatch(copyExportCode())}
            className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shrink-0"
          >
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedCode ? copy.copiedToClipboard : copy.copyFullCode}</span>
          </button>
        </div>

        {activeFormat === 'css' && (
          <Tabs
            label={copy.cssClass}
            appearance="pill"
            size="sm"
            value={cssSchemeMode}
            onChange={(id) => dispatch(setCssSchemeMode(id))}
            options={[
              { id: 'class', label: copy.cssClass },
              { id: 'light-dark', label: copy.cssLightDark },
            ]}
          />
        )}

        {activeFormat === 'tailwind' && (
          <Tabs
            label={copy.twNoFallback}
            appearance="pill"
            size="sm"
            value={tailwindFallback}
            onChange={(id) => dispatch(setTailwindFallback(id))}
            options={[
              { id: 'none', label: copy.twNoFallback },
              { id: 'light-dark', label: copy.twFallback },
            ]}
          />
        )}

        {/* 代码显示区 */}
        <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100 p-4 font-mono text-xs max-h-96 overflow-y-auto">
          <pre className="whitespace-pre">{exportCode}</pre>
        </div>
      </section>
    </div>
  )
}
