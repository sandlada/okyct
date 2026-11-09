/**
 * 语言切换器：在保留当前页面结构的前提下替换语言前缀。
 */

import { useI18n, SupportedLocales, LocaleLabels } from '../../../i18n/index.tsx'
import { Link, useRouter } from '../../../router/index.tsx'
import { pathForLocale } from '../../../router/routes.ts'
import type { Locale } from '../../../i18n/locales.ts'

const ShortLabels: Record<Locale, string> = {
  en: 'EN',
  'zh-Hant': '繁',
}

export function LocaleSwitcher({ compact = false }: { readonly compact?: boolean }) {
  const { locale, t } = useI18n()
  const { pathname } = useRouter()

  if (compact) {
    return (
      <div
        className="flex items-center gap-0.5 rounded-full border border-neutral-200 p-0.5 dark:border-neutral-800"
        role="group"
        aria-label={t('language.label')}
      >
        {SupportedLocales.map((candidate) => {
          const isActive = candidate === locale
          return (
            <Link
              key={candidate}
              to={pathForLocale(pathname, candidate)}
              hrefLang={candidate}
              aria-current={isActive ? 'true' : undefined}
              title={LocaleLabels[candidate]}
              className={`rounded-full px-2 py-1 text-[11px] font-semibold leading-none transition-colors ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              {ShortLabels[candidate]}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="inline-flex w-fit items-center gap-1 rounded-full border border-neutral-200 p-1 dark:border-neutral-800"
      role="group"
      aria-label={t('language.label')}
    >
      {SupportedLocales.map((candidate) => {
        const isActive = candidate === locale
        return (
          <Link
            key={candidate}
            to={pathForLocale(pathname, candidate)}
            hrefLang={candidate}
            aria-current={isActive ? 'true' : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            {ShortLabels[candidate]}
            <span className="sr-only">{LocaleLabels[candidate]}</span>
          </Link>
        )
      })}
    </div>
  )
}
