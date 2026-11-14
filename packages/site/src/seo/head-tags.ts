/**
 * SEO 头部标记的字符串渲染（供 SSR / prerender 使用）
 * 与浏览器端的增量应用。两端共享同一套渲染逻辑，避免描述漂移。
 */

import type { SeoDescriptor } from './build-seo.ts'
import { absoluteUrl } from './site.ts'

const SeoAttribute = 'data-okyct-seo'

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function meta(name: string, content: string, property = false): string {
  const key = property ? 'property' : 'name'
  return `<meta ${key}="${escapeHtml(name)}" content="${escapeHtml(content)}" ${SeoAttribute} />`
}

export function renderHeadTags(seo: SeoDescriptor): string {
  const tags: string[] = []
  tags.push(`<title ${SeoAttribute}>${escapeHtml(seo.title)}</title>`)
  tags.push(meta('description', seo.description))
  tags.push(meta('robots', seo.robots))
  tags.push(meta('author', 'Sandlada'))
  tags.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}" ${SeoAttribute} />`)

  for (const alternate of seo.alternates) {
    tags.push(
      `<link rel="alternate" hreflang="${escapeHtml(alternate.hreflang)}" href="${escapeHtml(alternate.href)}" ${SeoAttribute} />`,
    )
  }

  tags.push(meta('og:type', 'website', true))
  tags.push(meta('og:site_name', 'OKYCT', true))
  tags.push(meta('og:title', seo.title, true))
  tags.push(meta('og:description', seo.description, true))
  tags.push(meta('og:url', seo.canonical, true))
  tags.push(meta('og:locale', seo.ogLocale, true))
  for (const alternateLocale of seo.ogAlternateLocales) {
    tags.push(meta('og:locale:alternate', alternateLocale, true))
  }
  tags.push(meta('og:image', absoluteUrl('/og-cover.svg'), true))
  tags.push(meta('og:image:width', '1200', true))
  tags.push(meta('og:image:height', '630', true))
  tags.push(meta('og:image:alt', seo.title, true))

  tags.push(meta('twitter:card', 'summary_large_image'))
  tags.push(meta('twitter:title', seo.title))
  tags.push(meta('twitter:description', seo.description))
  tags.push(meta('twitter:image', absoluteUrl('/og-cover.svg')))
  tags.push(meta('twitter:image:alt', seo.title))

  if (seo.jsonLd !== null) {
    tags.push(`<script type="application/ld+json" ${SeoAttribute}>${seo.jsonLd.replaceAll('<', '\\u003c')}</script>`)
  }

  return tags.join('\n    ')
}

/**
 * 客户端路由切换时同步 <html lang>、标题与全部 SEO 标签。
 */
export function applySeoToDocument(seo: SeoDescriptor): void {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.lang = seo.lang
  document.documentElement.dir = 'ltr'

  const head = document.head
  for (const node of Array.from(head.querySelectorAll(`[${SeoAttribute}]`))) {
    node.remove()
  }

  const template = document.createElement('template')
  template.innerHTML = renderHeadTags(seo)

  for (const node of Array.from(template.content.children)) {
    if (node instanceof HTMLElement) {
      node.setAttribute(SeoAttribute, 'true')
    }
    head.appendChild(node)
  }
}

export { SeoAttribute }
