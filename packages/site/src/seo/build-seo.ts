/**
 * 将强类型路由编译为完整的 SEO 描述对象。
 * 该模块为纯函数，可同时运行于浏览器、SSR 构建与 prerender 脚本。
 */

import { EnglishMessages, type MessageKey } from '../i18n/messages/en.ts'
import { TraditionalChineseMessages } from '../i18n/messages/zh-Hant.ts'
import { HtmlLang, OpenGraphLocales, type Locale } from '../i18n/locales.ts'
import { landingPath, studioPath, withLocale, type AppRoute } from '../router/routes.ts'
import { absoluteUrl, SiteName, SiteOwner, SiteUrl } from './site.ts'

export interface SeoAlternate {
  readonly hreflang: string
  readonly href: string
}

export interface SeoDescriptor {
  readonly title: string
  readonly description: string
  readonly canonical: string
  readonly robots: string
  readonly lang: string
  readonly ogLocale: string
  readonly alternates: readonly SeoAlternate[]
  readonly jsonLd: string | null
}

function message(locale: Locale, key: MessageKey): string {
  const catalogue: Record<Locale, Record<MessageKey, string>> = {
    en: EnglishMessages,
    'zh-Hant': TraditionalChineseMessages,
  }
  return catalogue[locale][key]
}

function buildSoftwareApplicationJsonLd(locale: Locale): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SiteUrl}/#website`,
        url: `${SiteUrl}/`,
        name: SiteName,
        description: message(locale, 'seo.description'),
        inLanguage: [HtmlLang.en, HtmlLang['zh-Hant']],
        publisher: {
          '@type': 'Organization',
          name: SiteOwner,
          url: SiteUrl,
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${SiteUrl}/#software`,
        name: SiteName,
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'Color engine',
        operatingSystem: 'Web, Node.js',
        url: `${SiteUrl}/`,
        description: message(locale, 'seo.description'),
        programmingLanguage: ['TypeScript', 'Dart', 'Rust'],
        license: 'https://opensource.org/licenses/MIT',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'OKLab polar hue with CIE 1931 Y tone',
          'Single-variable Newton tone solver',
          'Cusp-anchored gamut mapping with zero hue drift',
          'O(1) WCAG 2.1 and APCA contrast inversion',
          'OLED, AMOLED and MicroOLED hardware profiles',
        ],
        publisher: {
          '@type': 'Organization',
          name: SiteOwner,
          url: SiteUrl,
        },
      },
    ],
  }
  return JSON.stringify(graph)
}

function landingAlternates(): SeoAlternate[] {
  const en = absoluteUrl(landingPath('en'))
  const zh = absoluteUrl(landingPath('zh-Hant'))
  return [
    { hreflang: HtmlLang.en, href: en },
    { hreflang: HtmlLang['zh-Hant'], href: zh },
    { hreflang: 'x-default', href: en },
  ]
}

export function buildSeo(route: AppRoute): SeoDescriptor {
  const locale = route.locale
  const ogLocale = OpenGraphLocales[locale]
  const lang = HtmlLang[locale]

  if (route.kind === 'studio') {
    const canonicalPath = studioPath(locale, route.view)
    const enPath = studioPath('en', route.view)
    const zhPath = studioPath('zh-Hant', route.view)
    return {
      title: message(locale, 'seo.studio.title'),
      description: message(locale, 'seo.studio.description'),
      canonical: absoluteUrl(canonicalPath),
      robots: 'noindex, follow',
      lang,
      ogLocale,
      alternates: [
        { hreflang: HtmlLang.en, href: absoluteUrl(enPath) },
        { hreflang: HtmlLang['zh-Hant'], href: absoluteUrl(zhPath) },
        { hreflang: 'x-default', href: absoluteUrl(enPath) },
      ],
      jsonLd: null,
    }
  }

  if (route.kind === 'not-found') {
    return {
      title: message(locale, 'seo.notFound.title'),
      description: message(locale, 'seo.notFound.description'),
      canonical: absoluteUrl(withLocale(locale, '/')),
      robots: 'noindex, follow',
      lang,
      ogLocale,
      alternates: landingAlternates(),
      jsonLd: null,
    }
  }

  return {
    title: message(locale, 'seo.title'),
    description: message(locale, 'seo.description'),
    canonical: absoluteUrl(landingPath(locale)),
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    lang,
    ogLocale,
    alternates: landingAlternates(),
    jsonLd: buildSoftwareApplicationJsonLd(locale),
  }
}

