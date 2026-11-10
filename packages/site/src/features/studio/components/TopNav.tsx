
import { Sun, Moon, Code2 } from 'lucide-react'
import { useI18n, type MessageKey } from '../../../i18n/index.tsx'
import { Link, useRouter } from '../../../router/index.tsx'
import { landingPath, studioPath, type StudioView } from '../../../router/routes.ts'
import { useTheme } from '../../theme/use-theme.ts'
import { useAppDispatch } from '../../../app/store.ts'
import { setMobileDrawerOpen } from '../slice.ts'
import { LocaleSwitcher } from '../../chrome/components/LocaleSwitcher.tsx'
import { Tabs } from '../../../ui/Tabs.tsx'

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

export function TopNav() {
  const { locale, t } = useI18n()
  const { route, navigate } = useRouter()
  const { isDark, toggleTheme } = useTheme()
  const dispatch = useAppDispatch()
  if (route.kind !== 'studio') {
    throw new Error('TopNav is only rendered on studio routes')
  }
  const activeTab = route.view
  const onTabChange = (view: StudioView) => navigate(studioPath(locale, view))

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 flex items-center justify-between gap-4 shrink-0 select-none z-30">
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
      <Tabs
        label={t('brand.studio')}
        appearance="underline"
        size="md"
        value={activeTab}
        onChange={onTabChange}
        className="hidden md:flex"
        options={NavItems.map((item) => ({ id: item.view, label: t(item.key) }))}
      />

      {/* Zone 3: Actions & Mobile Drawer Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {true && (
          <button
            type="button"
            onClick={() => dispatch(setMobileDrawerOpen(true))}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 min-h-[38px]"
            title={t('studio.nav.parameters')}
          >
            <span>{t('studio.nav.parameters')}</span>
          </button>
        )}

        <LocaleSwitcher compact />

        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? t('theme.toLight') : t('theme.toDark')}
          className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('export')}
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
