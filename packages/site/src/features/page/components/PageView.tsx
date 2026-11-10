import { LayoutTemplate } from 'lucide-react'
import { useI18n } from '../../../i18n/index.tsx'
import { useAppSelector } from '../../../app/store.ts'
import { selectPagePreviewSrcDoc } from '../selectors.ts'
import { PagePreviewStringsByLocale } from '../page-preview-strings.ts'

const ShellCopy = {
  en: {
    pageTitle: 'Page',
    pageHint: 'Product-style dashboard preview — HTML/CSS only',
  },
  'zh-Hant': {
    pageTitle: '頁面',
    pageHint: '產品化儀表板預覽 — 僅 HTML/CSS',
  },
} as const

export function PageView() {
  const { locale } = useI18n()
  const shell = ShellCopy[locale]
  const previewStrings = PagePreviewStringsByLocale[locale]
  const srcDoc = useAppSelector((state) => selectPagePreviewSrcDoc(state, previewStrings))

  return (
    <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-6 gap-4 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 max-w-[1600px] mx-auto w-full">
      <div className="px-4 sm:px-5 shrink-0">
        <h2 className="text-base sm:text-lg font-bold font-display tracking-tight flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-neutral-500 shrink-0" />
          {shell.pageTitle}
        </h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{shell.pageHint}</p>
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-5">
        <iframe
          title={shell.pageTitle}
          srcDoc={srcDoc}
          sandbox=""
          className="h-full min-h-[min(42rem,85vh)] w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white shadow-sm"
        />
      </div>
    </div>
  )
}
