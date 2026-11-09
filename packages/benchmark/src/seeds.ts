/**
 * 固定种子套件（协议 v2）
 */

export const StressSeedHexes = [
  '#0000FF',
  '#FF0000',
  '#FFD600',
  '#F97316',
  '#FF00FF',
  '#2563EB',
] as const

export const NeutralSeedHexes = ['#808080', '#A0A0A0', '#404040'] as const

export const BrandSeedHexes = [
  '#1A73E8',
  '#6750A4',
  '#B3261E',
  '#006A6A',
  '#7D5260',
] as const

export const SystemHueSeedHexes: readonly string[] = (() => {
  const out: string[] = []
  for (let h = 0; h < 360; h += 15) {
    out.push(oklchHexFromSystem(h, 0.3, 50))
  }
  return out
})()

function oklchHexFromSystem(h: number, c: number, lStar: number): string {
  const l = lStar / 100
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)
  const okl: { L: number; a: number; b: number } = { L: l, a, b }
  const l_ = okl.L + 0.3963377774 * okl.a + 0.2158037573 * okl.b
  const m_ = okl.L - 0.1055613458 * okl.a - 0.0638541728 * okl.b
  const s_ = okl.L - 0.0894841775 * okl.a - 1.2914855480 * okl.b
  const lx = l_ * l_ * l_
  const mx = m_ * m_ * m_
  const sx = s_ * s_ * s_
  const x = 1.2270138511 * lx - 0.5577999807 * mx + 0.281256149 * sx
  const y = -0.0405801784 * lx + 1.1122568696 * mx - 0.0716766787 * sx
  const z = -0.0763812845 * lx - 0.4214819784 * mx + 1.5861632204 * sx
  const r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
  const g = -0.969266 * x + 1.8760108 * y + 0.041556 * z
  const bLin = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z
  const linToSrgb = (c0: number) =>
    c0 <= 0.0031308 ? 12.92 * c0 : 1.055 * Math.pow(Math.max(0, c0), 1 / 2.4) - 0.055
  const clamp = (v: number) => Math.max(0, Math.min(1, linToSrgb(v)))
  const q = (v: number) => Math.max(0, Math.min(255, Math.round(clamp(v) * 255)))
  const cr = q(r)
  const cg = q(g)
  const cb = q(bLin)
  return `#${[cr, cg, cb].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

export function buildSeedSuite(): string[] {
  const all = [
    ...SystemHueSeedHexes,
    ...StressSeedHexes,
    ...NeutralSeedHexes,
    ...BrandSeedHexes,
  ]
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const hex of all) {
    const key = hex.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    ordered.push(key)
  }
  return ordered
}

export function seedSuiteHash(seeds: readonly string[]): string {
  let hash = 2166136261
  const payload = seeds.join('|')
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
