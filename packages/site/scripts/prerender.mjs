/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 构建后处理：
 * 1. 使用 SSR 入口预渲染每个落地页路由为静态 HTML；
 * 2. 为工作台路由生成带独立 SEO 头的静态壳；
 * 3. 生成 sitemap.xml、robots.txt 与静态托管用的 404.html。
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(projectRoot, 'dist')
const ssrDir = join(projectRoot, 'dist-ssr')

const { renderPage, SiteUrl, StudioViews } = await import(
  pathToFileURL(join(ssrDir, 'entry-server.js')).href
)

const template = await readFile(join(distDir, 'index.html'), 'utf8')

const SeoStart = '<!--seo:start-->'
const SeoEnd = '<!--seo:end-->'
const RootPlaceholder = '<div id="root"></div>'

function inject(templateHtml, head, html, lang) {
  const startIndex = templateHtml.indexOf(SeoStart)
  const endIndex = templateHtml.indexOf(SeoEnd)
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('index.html is missing the <!--seo:start--> / <!--seo:end--> markers')
  }
  if (!templateHtml.includes(RootPlaceholder)) {
    throw new Error('index.html is missing the <div id="root"></div> mount point')
  }
  const withHead =
    templateHtml.slice(0, startIndex) + head + templateHtml.slice(endIndex + SeoEnd.length)
  return withHead
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(RootPlaceholder, `<div id="root">${html}</div>`)
}

function outputFileFor(route) {
  if (route === '/') {
    return join(distDir, 'index.html')
  }
  return join(distDir, ...route.split('/').filter(Boolean), 'index.html')
}

const routes = [
  '/',
  '/zh-hant',
  '/studio',
  '/zh-hant/studio',
  ...StudioViews.flatMap((view) => [`/studio/${view}`, `/zh-hant/studio/${view}`]),
]

let rendered = 0
for (const route of routes) {
  const { html, head, lang } = renderPage(route)
  const outputFile = outputFileFor(route)
  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, inject(template, head, html, lang), 'utf8')
  rendered += 1
}

const today = new Date().toISOString().slice(0, 10)

function alternateLinks() {
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="${SiteUrl}/" />`,
    `    <xhtml:link rel="alternate" hreflang="zh-Hant" href="${SiteUrl}/zh-hant" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SiteUrl}/" />`,
  ].join('\n')
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${SiteUrl}/</loc>
${alternateLinks()}
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SiteUrl}/zh-hant</loc>
${alternateLinks()}
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`

const robots = `# OKYCT — ${SiteUrl}
User-agent: *
Allow: /
Disallow: /studio
Disallow: /zh-hant/studio

Sitemap: ${SiteUrl}/sitemap.xml
`

await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf8')
await writeFile(join(distDir, 'robots.txt'), robots, 'utf8')

// 静态托管的 SPA 兜底页：未知路径交给客户端路由渲染 404。
const notFound = await readFile(join(distDir, 'index.html'), 'utf8')
await writeFile(join(distDir, '404.html'), notFound, 'utf8')

await rm(ssrDir, { recursive: true, force: true })

console.log(
  `Prerendered ${rendered} routes · sitemap.xml + robots.txt written to dist/ (base: ${SiteUrl})`,
)
