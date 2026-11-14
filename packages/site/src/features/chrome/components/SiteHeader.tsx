
import { useI18n } from '../../../i18n/index.tsx'
import { Link } from '../../../router/index.tsx'
import { landingPath, studioPath } from '../../../router/routes.ts'
import { BrandMark } from './BrandMark.tsx'
import { DefaultBrandColors } from '../brand-colors.ts'
import { LocaleSwitcher } from './LocaleSwitcher.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'

const SectionLinks = [
  { href: '#model', key: 'nav.model' },
  { href: '#displays', key: 'nav.displays' },
  { href: '#palette', key: 'nav.palette' },
  { href: '#tokens', key: 'nav.tokens' },
] as const

interface SiteHeaderProps {
  readonly brandColors?: readonly [string, string, string]
  readonly showSectionLinks?: boolean
}

export function SiteHeader({ brandColors = DefaultBrandColors, showSectionLinks = true }: SiteHeaderProps) {
  const { locale, t } = useI18n()

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-900/5 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/70">
      <div className="mx-auto flex h-10 w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-7">
          <Link
            to={landingPath(locale)}
            aria-label={t('nav.home')}
            className="flex items-center gap-2.5 text-neutral-900 transition-opacity hover:opacity-70 dark:text-neutral-50"
          >
            <BrandMark colors={brandColors} size={26} />
            <span className="font-display text-[15px] font-bold tracking-tight">{t('brand.name')}</span>
          </Link>

          {showSectionLinks && (
            <nav className="hidden items-center gap-6 text-[13px] font-medium text-neutral-600 md:flex dark:text-neutral-400">
              {SectionLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-neutral-950 dark:hover:text-neutral-50"
                >
                  {t(item.key)}
                </a>
              ))}
              <Link
                to={studioPath(locale)}
                className="transition-colors hover:text-neutral-950 dark:hover:text-neutral-50"
              >
                {t('nav.studio')}
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <LocaleSwitcher compact />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
