/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 站点级 SEO 常量。部署时可通过 VITE_SITE_URL 覆盖，
 * 用于 canonical、hreflang 与 sitemap 的绝对地址生成。
 */

export const SiteName = 'OKYCT'

export const SiteOwner = 'Sandlada'

export const SiteUrl: string = (import.meta.env.VITE_SITE_URL ?? 'https://okyct.sandlada.dev').replace(/\/+$/, '')

export const ThemeColors = {
  light: '#ffffff',
  dark: '#0a0a0a',
} as const

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${SiteUrl}${path.startsWith('/') ? path : `/${path}`}`
}
