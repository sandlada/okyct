/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../i18n/index.tsx'
import { Link } from '../router/index.tsx'
import { landingPath } from '../router/routes.ts'
import { SiteHeader } from '../components/site/SiteHeader.tsx'
import { SiteFooter } from '../components/site/SiteFooter.tsx'
import { DefaultLandingSeed, buildLandingPalette } from '../landing/palette.ts'

const NotFoundAccents = buildLandingPalette(DefaultLandingSeed).accents

export function NotFoundPage() {
  const { t, locale } = useI18n()

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <SiteHeader showSectionLinks={false} />

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-24">
        <div className="flex max-w-xl flex-col items-center text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-neutral-400">
            404 · OUT OF GAMUT
          </span>
          <h1
            className="mt-6 bg-clip-text font-display text-[clamp(2rem,6vw,4rem)] font-medium leading-[1.02] tracking-[-0.04em] text-transparent"
            style={{ backgroundImage: `linear-gradient(96deg, ${NotFoundAccents.primary}, ${NotFoundAccents.secondary}, ${NotFoundAccents.tertiary})` }}
          >
            {t('notFound.title')}
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400">
            {t('notFound.body')}
          </p>
          <Link
            to={landingPath(locale)}
            className="mt-9 inline-flex h-11 items-center gap-2 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('notFound.cta')}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
