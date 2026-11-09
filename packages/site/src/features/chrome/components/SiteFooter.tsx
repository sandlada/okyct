
import { useI18n } from '../../../i18n/index.tsx'
import { Link } from '../../../router/index.tsx'
import { landingPath, studioPath } from '../../../router/routes.ts'
import { BrandMark } from './BrandMark.tsx'
import { DefaultBrandColors } from '../brand-colors.ts'
import { LocaleSwitcher } from './LocaleSwitcher.tsx'

export function SiteFooter({ brandColors = DefaultBrandColors }: { readonly brandColors?: readonly [string, string, string] }) {
  const { locale, t } = useI18n()

  return (
    <footer className="relative z-10 border-t border-neutral-900/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/80">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-neutral-900 dark:text-neutral-50">
              <BrandMark colors={brandColors} size={26} />
              <span className="font-display text-[15px] font-bold tracking-tight">{t('brand.name')}</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
              {t('footer.explore')}
            </span>
            <Link to={landingPath(locale)} className="text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50">
              {t('nav.product')}
            </Link>
            <Link to={studioPath(locale)} className="text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50">
              {t('nav.studio')}
            </Link>
            <a href="#palette" className="text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50">
              {t('nav.palette')}
            </a>
          </div>

          <div className="flex flex-col gap-2.5 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
              {t('footer.model')}
            </span>
            <a href="#model" className="text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50">
              {t('model.eyebrow')}
            </a>
            <a href="#displays" className="text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50">
              {t('nav.displays')}
            </a>
            <a href="#palette" className="text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-50">
              {t('palette.eyebrow')}
            </a>
          </div>

          <div className="flex flex-col gap-2.5 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
              {t('footer.license')}
            </span>
            <span className="text-neutral-600 dark:text-neutral-400">{t('footer.licenseValue')}</span>
            <LocaleSwitcher />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-neutral-900/10 pt-6 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-neutral-500">
          <span>{t('footer.rights')}</span>
          <span>{t('footer.builtWith')}</span>
        </div>
      </div>
    </footer>
  )
}
