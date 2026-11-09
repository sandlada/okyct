/**
 * OKYCT 落地页。
 *
 * 视觉母题参考现代「悬浮粒子 + 巨幅排版 + 大留白」的产品站语言，
 * 但所有颜色、色阶与数值均由 @sandlada/okyct 实时推导，
 * 页面结构本身以可预渲染的语义化 HTML 呈现，服务于 SEO 与无障碍阅读。
 */

import { lazy, Suspense, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Cpu,
  Layers,
  Palette,
  Scale,
  Sparkles,
} from 'lucide-react'
import { useI18n, type MessageKey } from '../i18n/index.tsx'
import { useTheme } from '../theme/index.tsx'
import { Link } from '../router/index.tsx'
import { studioPath, type StudioView } from '../router/routes.ts'
import { runModelBenchmark } from '../color/benchmark.ts'
import { buildBenchmarkMatrix } from '../landing/modelBenchmarks.ts'
import { BenchmarkFairMatrixTable } from '../components/benchmark/BenchmarkFairMatrixTable.tsx'
import { HueSeedScrubber } from '../landing/HueSeedScrubber.tsx'
import {
  DefaultLandingSeed,
  buildLandingPalette,
  buildPanelSwatches,
  buildTerrainRoleRamps,
} from '../landing/palette.ts'
import { SiteHeader } from '../components/site/SiteHeader.tsx'
import { SiteFooter } from '../components/site/SiteFooter.tsx'

const ParticleTerrain = lazy(() =>
  import('../landing/ParticleTerrain.tsx').then((module) => ({ default: module.ParticleTerrain })),
)

const FeatureCards = [
  { index: '01', titleKey: 'model.perceptual.title', bodyKey: 'model.perceptual.body' },
  { index: '02', titleKey: 'model.solver.title', bodyKey: 'model.solver.body' },
  { index: '03', titleKey: 'model.gamut.title', bodyKey: 'model.gamut.body' },
  { index: '04', titleKey: 'model.contrast.title', bodyKey: 'model.contrast.body' },
] as const

const PanelCards = [
  { index: 0, nameKey: 'displays.oled.name', toneKey: 'displays.oled.tone', bodyKey: 'displays.oled.body' },
  { index: 1, nameKey: 'displays.amoled.name', toneKey: 'displays.amoled.tone', bodyKey: 'displays.amoled.body' },
  { index: 2, nameKey: 'displays.micro.name', toneKey: 'displays.micro.tone', bodyKey: 'displays.micro.body' },
] as const

type StudioCardLink =
  | { kind: 'studio'; view: StudioView }
  | { kind: 'landing'; hash: string }

const StudioCards: readonly {
  link: StudioCardLink
  titleKey: MessageKey
  bodyKey: MessageKey
  icon: typeof Palette
}[] = [
  { link: { kind: 'studio', view: 'tokens' }, titleKey: 'studio.tokens.title', bodyKey: 'studio.tokens.body', icon: Palette },
  { link: { kind: 'studio', view: 'oled' }, titleKey: 'studio.oled.title', bodyKey: 'studio.oled.body', icon: Cpu },
  { link: { kind: 'studio', view: 'fp' }, titleKey: 'studio.fp.title', bodyKey: 'studio.fp.body', icon: Layers },
  { link: { kind: 'landing', hash: 'benchmarks' }, titleKey: 'studio.benchmark.title', bodyKey: 'studio.benchmark.body', icon: Scale },
  { link: { kind: 'studio', view: 'export' }, titleKey: 'studio.export.title', bodyKey: 'studio.export.body', icon: Code2 },
]

export function LandingPage() {
  const { t, locale } = useI18n()
  const { isDark } = useTheme()
  const [seedHex, setSeedHex] = useState<string>(DefaultLandingSeed)

  const palette = useMemo(() => buildLandingPalette(seedHex), [seedHex])
  const terrainRoles = useMemo(() => buildTerrainRoleRamps(seedHex, isDark), [seedHex, isDark])
  const panels = useMemo(() => buildPanelSwatches(seedHex), [seedHex])
  const modelBenchmarks = useMemo(() => runModelBenchmark(seedHex), [seedHex])
  const benchmarkMatrix = useMemo(
    () => buildBenchmarkMatrix(modelBenchmarks),
    [modelBenchmarks],
  )

  const brandColors = [
    palette.accents.primary,
    palette.accents.secondary,
    palette.accents.tertiary,
  ] as const

  const gradient = `linear-gradient(96deg, ${palette.accents.primary} 0%, ${palette.accents.secondary} 42%, ${palette.accents.tertiary} 78%, ${palette.accents.primary} 100%)`

  return (
    <div id="top" className="relative min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white dark:bg-neutral-950 dark:text-neutral-50 dark:selection:bg-neutral-100 dark:selection:text-neutral-950">
      <SiteHeader brandColors={brandColors} />

      <main className="relative z-10">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative isolate flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden border-b border-neutral-900/5 dark:border-white/5">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1180px] sm:h-[1280px]">
            <Suspense fallback={null}>
              <ParticleTerrain
                key={`${seedHex}-${isDark ? 'dark' : 'light'}`}
                roleRamps={terrainRoles}
                isDark={isDark}
              />
            </Suspense>
            <div
              className="absolute inset-0"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse 64% 42% at 50% 34%, rgba(10,10,10,0.68) 0%, rgba(10,10,10,0.3) 48%, rgba(10,10,10,0) 76%)'
                  : 'radial-gradient(ellipse 64% 42% at 50% 34%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.32) 48%, rgba(255,255,255,0) 76%)',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-white dark:to-neutral-950" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-14 pt-20 sm:px-8 sm:pt-28 lg:pt-36">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-900/10 bg-white/60 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600 backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-neutral-300">
              <Sparkles className="h-3.5 w-3.5" style={{ color: palette.accents.primary }} />
              {t('hero.eyebrow')}
            </span>

            <h1 className="mt-7 font-display text-[clamp(2.55rem,7.2vw,6.1rem)] font-medium leading-[0.95] tracking-[-0.045em] text-balance">
              {t('hero.titleLineOne')}
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: gradient }}
              >
                {t('hero.titleLineTwo')}
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 sm:text-[17px] dark:text-neutral-400">
              {t('hero.subtitle')}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                to={studioPath(locale)}
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-white"
              >
                {t('hero.primaryCta')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#model"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-neutral-900/15 px-6 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-900/30 hover:bg-neutral-900/5 dark:border-white/20 dark:text-neutral-100 dark:hover:bg-white/5"
              >
                {t('hero.secondaryCta')}
              </a>
            </div>

            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
              {t('hero.meta')}
            </p>
          </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Model guarantees                                                  */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative py-24 sm:py-32">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
            <div className="flex flex-col gap-4 pl-7 sm:flex-row sm:items-end sm:justify-between sm:pl-9">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
                  {t('model.eyebrow')}
                </span>
                <h2 className="mt-4 max-w-2xl font-display text-[clamp(1.7rem,3.4vw,2.9rem)] font-medium leading-[1.08] tracking-[-0.03em] text-balance">
                  {t('model.title')}
                </h2>
              </div>
            </div>

            <div className="mt-12 grid gap-3 sm:gap-4 md:grid-cols-2">
              {FeatureCards.map((feature, index) => (
                <article
                  key={feature.index}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-neutral-900/10 bg-white/70 p-7 backdrop-blur-sm transition-colors hover:border-neutral-900/20 sm:p-9 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                >
                  <div
                    className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
                    style={{
                      background:
                        index % 2 === 0 ? palette.accents.primary : palette.accents.tertiary,
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
                      {feature.index}
                    </span>
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: index % 2 === 0 ? palette.accents.primary : palette.accents.tertiary }}
                    />
                  </div>
                  <h3 className="mt-8 font-display text-xl font-semibold tracking-tight sm:text-[22px]">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {t(feature.bodyKey)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Benchmarks · five-model matrix                                   */}
        {/* ---------------------------------------------------------------- */}
        <section id="benchmarks" className="relative scroll-mt-24 border-t border-neutral-900/10 py-24 sm:py-32 dark:border-white/10">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
            <div className="flex flex-col gap-4 pl-7 sm:pl-9">
              <div className="max-w-2xl">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
                  {t('benchmarks.eyebrow')}
                </span>
                <h2 className="mt-4 font-display text-[clamp(1.7rem,3.4vw,2.9rem)] font-medium leading-[1.08] tracking-[-0.03em] text-balance">
                  {t('benchmarks.title')}
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">
                  {t('benchmarks.body')}
                </p>
              </div>
            </div>
            <p className="mt-6 flex items-center gap-2 pl-7 font-mono text-[11px] tracking-[0.14em] text-neutral-400 sm:pl-9 dark:text-neutral-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400" />
              {t('benchmarks.liveNote')} · {seedHex.toUpperCase()}
            </p>
            <div className="mt-6">
              <HueSeedScrubber seedHex={seedHex} onCommit={setSeedHex} />
            </div>
            <div className="mt-6">
              <BenchmarkFairMatrixTable matrix={benchmarkMatrix} />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Statement                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section id="model" className="relative scroll-mt-24 border-t border-neutral-900/10 py-24 sm:py-32 dark:border-white/10">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
            <div className="pl-7 sm:pl-9">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
              {t('statement.eyebrow')}
            </span>
            <h2 className="mt-6 max-w-5xl font-display text-[clamp(1.9rem,4.6vw,4rem)] font-medium leading-[1.04] tracking-[-0.035em] text-balance">
              {t('statement.title')}
            </h2>
            <p className="mt-8 max-w-3xl text-pretty text-base leading-relaxed text-neutral-600 sm:text-[17px] dark:text-neutral-400">
              {t('statement.body')}
            </p>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Emissive displays                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section id="displays" className="relative scroll-mt-24 pb-24 sm:pb-32">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-neutral-950 px-7 py-14 text-white sm:rounded-[2.5rem] sm:px-9 sm:py-20">
              <div className="flex flex-col gap-12">
                <div className="max-w-3xl">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
                    {t('displays.eyebrow')}
                  </span>
                  <h2 className="mt-5 font-display text-[clamp(1.8rem,4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.03em] text-balance">
                    {t('displays.title')}
                  </h2>
                  <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
                    {t('displays.body')}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {PanelCards.map((panel) => {
                    const swatch = panels[panel.index]
                    return (
                      <article
                        key={panel.nameKey}
                        className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                      >
                        <div
                          className="relative h-28 w-full ring-1 ring-inset ring-white/10"
                          style={{
                            backgroundColor: swatch.hex,
                            boxShadow: `inset 0 0 60px ${palette.accents.primary}22`,
                          }}
                        >
                          <span className="absolute bottom-2 left-3 font-mono text-[10px] tracking-[0.12em] text-white/60">
                            {swatch.hex.toUpperCase()}
                          </span>
                          <span className="absolute bottom-2 right-3 font-mono text-[10px] tracking-[0.12em] text-white/45">
                            T{swatch.tone}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-5">
                          <div className="flex items-baseline justify-between gap-3">
                            <h3 className="font-display text-[15px] font-semibold tracking-tight">
                              {t(panel.nameKey)}
                            </h3>
                            <span className="font-mono text-[10px] tracking-[0.12em] text-white/40">
                              {t(panel.toneKey)}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-white/50">{t(panel.bodyKey)}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="grid gap-6 border-t border-white/10 pt-8 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {t('displays.power.title')}
                    </h3>
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/50">
                      {t('displays.power.body')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-[11px] tracking-[0.06em] text-white/70">
                    P<sub>pixel</sub> = 1.05·R<sup>γ</sup> + 0.85·G<sup>γ</sup> + 2.40·B<sup>γ</sup>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Palette lab                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section id="palette" className="relative scroll-mt-24 border-t border-neutral-900/10 py-24 sm:py-32 dark:border-white/10">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
            <div className="flex flex-col gap-10 pl-7 lg:flex-row lg:items-end lg:justify-between sm:pl-9">
              <div className="max-w-2xl">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
                  {t('palette.eyebrow')}
                </span>
                <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-balance">
                  {t('palette.title')}
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">
                  {t('palette.body')}
                </p>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-3 rounded-2xl border border-neutral-900/10 bg-white/70 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                <input
                  type="color"
                  value={seedHex}
                  onChange={(event) => setSeedHex(event.target.value)}
                  aria-label={t('palette.seedLabel')}
                  className="h-9 w-9 cursor-pointer appearance-none rounded-lg border-0 bg-transparent p-0"
                />
                <span className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
                    {t('palette.seedLabel')}
                  </span>
                  <span className="font-mono text-sm tabular-nums">{seedHex.toUpperCase()}</span>
                </span>
              </label>
            </div>

            <div className="mt-12 flex flex-col gap-5">
              {palette.rows.map((row) => (
                <div key={row.key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
                  <span className="w-32 shrink-0 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {t(row.labelKey)}
                  </span>
                  <div className="grid flex-1 grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
                    {row.swatches.map((swatch) => (
                      <div
                        key={`${row.key}-${swatch.tone}`}
                        title={`T${swatch.tone} · ${swatch.hex.toUpperCase()}`}
                        className="group relative h-9 rounded-md ring-1 ring-inset ring-black/10 transition-transform hover:scale-[1.06] sm:h-10 dark:ring-white/10"
                        style={{ backgroundColor: swatch.hex }}
                      >
                        <span className="pointer-events-none absolute inset-x-0 -bottom-4 hidden text-center font-mono text-[9px] text-neutral-400 group-hover:block dark:text-neutral-500">
                          {swatch.tone}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-neutral-400 dark:text-neutral-500">
              <span className="font-mono uppercase tracking-[0.16em]">{t('palette.toneAxis')}</span>
              <span className="font-mono">0 · 10 · 20 · 30 · 40 · 50 · 60 · 70 · 80 · 90 · 95 · 99 · 100</span>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Studio                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section id="studio" className="relative scroll-mt-24 pb-24 sm:pb-32">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
            <div className="flex flex-col gap-6 pl-5 sm:flex-row sm:items-end sm:justify-between sm:pl-5">
              <div className="max-w-2xl">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 dark:text-neutral-500">
                  {t('studio.eyebrow')}
                </span>
                <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.035em] text-balance">
                  {t('studio.title')}
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">
                  {t('studio.body')}
                </p>
              </div>
              <Link
                to={studioPath(locale)}
                className="group inline-flex h-11 w-fit items-center gap-2 rounded-full border border-neutral-900/15 px-5 text-sm font-semibold transition-colors hover:border-neutral-900/35 hover:bg-neutral-900/5 dark:border-white/20 dark:hover:bg-white/5"
              >
                {t('studio.cta')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {StudioCards.map((card) => {
                const Icon = card.icon
                const cardTo =
                  card.link.kind === 'studio'
                    ? studioPath(locale, card.link.view)
                    : `#${card.link.hash}`
                return (
                  <Link
                    key={card.titleKey}
                    to={cardTo}
                    className="group relative flex flex-col gap-5 rounded-2xl border border-neutral-900/10 bg-white/70 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-neutral-900/25 hover:shadow-lg hover:shadow-neutral-900/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/25"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${palette.accents.primary}14`,
                          color: palette.accents.primary,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-neutral-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:text-neutral-600 dark:group-hover:text-neutral-100" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold tracking-tight">{t(card.titleKey)}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {t(card.bodyKey)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Closing CTA                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative pb-24 sm:pb-32">
          <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-[2rem] border border-neutral-900/10 bg-neutral-50 px-6 py-20 text-center sm:rounded-[2.5rem] sm:px-12 sm:py-28 dark:border-white/10 dark:bg-white/[0.03]">
              <div
                className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
                style={{ background: palette.accents.primary }}
              />
              <div
                className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
                style={{ background: palette.accents.tertiary }}
              />
              <h2 className="relative mx-auto max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.04em] text-balance">
                {t('cta.title')}
              </h2>
              <p className="relative mx-auto mt-5 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">
                {t('cta.body')}
              </p>
              <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to={studioPath(locale)}
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-white"
                >
                  {t('cta.primary')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#top"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-neutral-900/15 px-6 text-sm font-semibold transition-colors hover:border-neutral-900/35 hover:bg-neutral-900/5 dark:border-white/20 dark:hover:bg-white/5"
                >
                  {t('cta.secondary')}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter brandColors={brandColors} />
    </div>
  )
}

