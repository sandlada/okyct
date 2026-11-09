/**
 * SSR / 预渲染入口。构建期由 scripts/prerender.mjs 调用：
 * - 落地页输出完整的静态 HTML（利于爬虫与首屏）；
 * - 工作台为 noindex 工具页，仅输出 SEO 头部与空挂载点。
 */

import { renderToString } from 'react-dom/server'
import { Root } from './Root.tsx'
import { matchRoute } from './router/routes.ts'
import { buildSeo, renderHeadTags } from './seo/index.ts'
import { SiteUrl } from './seo/site.ts'

export interface PrerenderResult {
  readonly html: string
  readonly head: string
  readonly lang: string
}

export function renderPage(url: string): PrerenderResult {
  const route = matchRoute(url)
  const seo = buildSeo(route)
  const head = renderHeadTags(seo)

  if (route.kind === 'studio') {
    return { html: '', head, lang: seo.lang }
  }

  const html = renderToString(<Root url={url} />)
  return { html, head, lang: seo.lang }
}

export { SiteUrl } from './seo/site.ts'
export { StudioViews } from './router/routes.ts'
