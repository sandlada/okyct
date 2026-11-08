/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 支持的语言清单与 URL 形态约定。
 * 默认语言 en 不带前缀；其余语言使用小写 slug 前缀（zh-Hant -> /zh-hant）。
 */

export const SupportedLocales = ['en', 'zh-Hant'] as const

export type Locale = (typeof SupportedLocales)[number]

export const DefaultLocale: Locale = 'en'

export const LocaleSlugs: Record<Locale, string> = {
  en: '',
  'zh-Hant': 'zh-hant',
}

export const HtmlLang: Record<Locale, string> = {
  en: 'en',
  'zh-Hant': 'zh-Hant',
}

export const OpenGraphLocales: Record<Locale, string> = {
  en: 'en_US',
  'zh-Hant': 'zh_TW',
}

export const LocaleLabels: Record<Locale, string> = {
  en: 'English',
  'zh-Hant': '繁體中文',
}

export function isLocale(value: string): value is Locale {
  return (SupportedLocales as readonly string[]).includes(value)
}

export function localeFromSlug(slug: string): Locale | null {
  const normalized = slug.toLowerCase()
  for (const locale of SupportedLocales) {
    if (LocaleSlugs[locale] !== '' && LocaleSlugs[locale] === normalized) {
      return locale
    }
  }
  return null
}
