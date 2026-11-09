/**
 * 共享 8-bit 量化（主榜 nearest）
 */

import type { RGB } from '@sandlada/okyct'

export function quantizeNearest(rgb: RGB): string {
  const q = (v: number) => Math.max(0, Math.min(255, Math.round(Math.max(0, Math.min(1, v)) * 255)))
  const r = q(rgb.r)
  const g = q(rgb.g)
  const b = q(rgb.b)
  return (
    '#' +
    [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()
  )
}
