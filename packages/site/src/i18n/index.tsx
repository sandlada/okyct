/**
 * 区域性语言上下文。仅注册英文与繁体中文两套目录，
 * 通过 Context 向 React 树注入当前语言与消息表。
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { EnglishMessages, type MessageKey } from './messages/en.ts'
import { TraditionalChineseMessages } from './messages/zh-Hant.ts'
import { DefaultLocale, type Locale } from './locales.ts'

export type { Locale, MessageKey }
export { DefaultLocale, SupportedLocales, LocaleLabels, HtmlLang, LocaleSlugs, OpenGraphLocales, isLocale, localeFromSlug } from './locales.ts'

export const MessagesByLocale: Record<Locale, Record<MessageKey, string>> = {
  en: EnglishMessages,
  'zh-Hant': TraditionalChineseMessages,
}

export interface I18nValue {
  readonly locale: Locale
  readonly messages: Record<MessageKey, string>
  readonly t: (key: MessageKey) => string
}

const I18nContext = createContext<I18nValue | null>(null)

interface I18nProviderProps {
  readonly locale: Locale
  readonly children: ReactNode
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const value = useMemo<I18nValue>(() => {
    const messages = MessagesByLocale[locale] ?? MessagesByLocale[DefaultLocale]
    return {
      locale,
      messages,
      t: (key: MessageKey) => messages[key],
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (value === null) {
    throw new Error('useI18n must be used inside an <I18nProvider>')
  }
  return value
}
