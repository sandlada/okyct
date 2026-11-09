
import { Sun, Moon, Code2 } from 'lucide-react'
import { useI18n, type MessageKey } from '../i18n/index.tsx'
import { Link } from '../router/index.tsx'
import { landingPath, type StudioView } from '../router/routes.ts'
import { LocaleSwitcher } from './site/LocaleSwitcher.tsx'

const NavItems: readonly { view: StudioView; key: MessageKey }[] = [
  { view: 'tokens', key: 'studio.tab.tokens' },
  { view: 'oled', key: 'studio.tab.oled' },
  { view: 'fp', key: 'studio.tab.fp' },
  { view: 'export', key: 'studio.tab.export' },
]

interface TopNavProps {
  activeTab: StudioView
  onTabChange: (tab: StudioView) => void
  isDark: boolean
  onToggleDark: () => void
  onOpenExport: () => void
  onOpenMobileControls?: () => void
}

export function TopNav({
  activeTab,
  onTabChange,
  isDark,
  onToggleDark,
  onOpenExport,
  onOpenMobileControls,
}: TopNavProps) {
  const { locale, t } = useI18n()

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 md:px-6 flex items-center justify-between gap-4 md:gap-6 shrink-0 select-none z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={landingPath(locale)}
          title={t('studio.nav.backToSite')}
          className="font-display font-bold text-sm md:text-base tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap transition-opacity hover:opacity-70"
        >
          {t('brand.studio')}
        </Link>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-3 lg:gap-4 text-xs lg:text-sm font-medium overflow-x-auto">
        {NavItems.map((item) => {
          const isActive = activeTab === item.view
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onTabChange(item.view)}
              aria-current={isActive ? 'page' : undefined}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isActive
                  ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {t(item.key)}
            </button>
          )
        })}
      </nav>

      {/* Zone 3: Actions & Mobile Drawer Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onOpenMobileControls && (
          <button
            type="button"
            onClick={onOpenMobileControls}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 min-h-[38px]"
            title={t('studio.nav.parameters')}
          >
            <span>{t('studio.nav.parameters')}</span>
          </button>
        )}

        <LocaleSwitcher compact />

        <button
          type="button"
          onClick={onToggleDark}
          title={isDark ? t('theme.toLight') : t('theme.toDark')}
          className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('studio.nav.export')}</span>
          <span className="sm:hidden">{t('studio.nav.exportShort')}</span>
        </button>
      </div>
    </header>
  )
}
