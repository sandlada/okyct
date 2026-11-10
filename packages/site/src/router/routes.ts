/**
 * 路由表与路径构建器（单一事实来源）。
 *
 * URL 形态：
 * - /                       英文落地页
 * - /zh-hant               繁體中文落地頁
 * - /studio/:view          英文工作台（view 省略时回到默认视图）
 * - /zh-hant/studio/:view  繁體中文工作台
 *
 * 默认语言 en 不占用路径前缀，非默认语言使用小写 slug 前缀，
 * 以此同时满足可读性、hreflang 与 canonical 的唯一性要求。
 */

import { DefaultLocale, LocaleSlugs, localeFromSlug, type Locale } from '../i18n/locales.ts'
import { isLandingPath } from '../features/landing/routes.ts'
import {
  DefaultStudioView,
  isStudioLegacyId,
  StudioLegacyRedirects,
  StudioViewIds,
  StudioViews,
  type StudioView,
} from '../features/studio/routes.ts'

export { DefaultStudioView, StudioViewIds, StudioViews }
export type { StudioView }

export type AppRoute =
  | { readonly kind: 'landing'; readonly locale: Locale }
  | { readonly kind: 'studio'; readonly locale: Locale; readonly view: StudioView }
  | { readonly kind: 'not-found'; readonly locale: Locale }

export function isStudioView(value: string): value is StudioView {
  return (StudioViews as readonly string[]).includes(value)
}

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split('?')[0].split('#')[0]
  const collapsed = withoutQuery.replace(/\/{2,}/g, '/')
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1)
  }
  return collapsed === '' ? '/' : collapsed
}

/**
 * 把任意 pathname 解析为强类型路由对象。
 */
export function matchRoute(pathname: string): AppRoute {
  const normalized = normalizePathname(pathname)
  const segments = normalized.split('/').filter((segment) => segment !== '')

  let locale: Locale = DefaultLocale
  const first = segments[0]
  if (first !== undefined) {
    const detected = localeFromSlug(first)
    if (detected !== null) {
      locale = detected
      segments.shift()
    }
  }

  if (isLandingPath(segments)) {
    return { kind: 'landing', locale }
  }

  if (segments[0] === 'studio') {
    const rawView = segments[1]
    if (rawView === undefined) {
      return { kind: 'studio', locale, view: DefaultStudioView }
    }
    if (isStudioLegacyId(rawView)) {
      return { kind: 'studio', locale, view: StudioLegacyRedirects[rawView] }
    }
    if (isStudioView(rawView)) {
      return { kind: 'studio', locale, view: rawView }
    }
    return { kind: 'not-found', locale }
  }

  return { kind: 'not-found', locale }
}

/**
 * 为默认语言加上空前缀；非默认语言加上 slug 前缀。
 */
export function withLocale(locale: Locale, path: string): string {
  const slug = LocaleSlugs[locale]
  const suffix = path === '/' ? '' : path
  if (slug === '') {
    return suffix === '' ? '/' : suffix
  }
  return `/${slug}${suffix}`
}

export function landingPath(locale: Locale): string {
  return withLocale(locale, '/')
}

export function studioPath(locale: Locale, view: StudioView = DefaultStudioView): string {
  return withLocale(locale, `/studio/${view}`)
}

/**
 * 保留当前页面结构、仅替换语言前缀，用于语言切换器。
 */
export function pathForLocale(pathname: string, locale: Locale): string {
  const route = matchRoute(pathname)
  switch (route.kind) {
    case 'studio':
      return studioPath(locale, route.view)
    case 'landing':
      return landingPath(locale)
    case 'not-found':
      return landingPath(locale)
  }
}
