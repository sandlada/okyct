
import { Sun, Moon, Code2, Menu } from 'lucide-react'
import { useI18n, type MessageKey } from '../../../i18n/index.tsx'
import { Link, useRouter } from '../../../router/index.tsx'
import { landingPath, studioPath, StudioViewIds, type StudioView } from '../../../router/routes.ts'
import { useTheme } from '../../theme/use-theme.ts'
import { useAppDispatch } from '../../../app/store.ts'
import { setMobileDrawerOpen } from '../slice.ts'
import { LocaleSwitcher } from '../../chrome/components/LocaleSwitcher.tsx'
import { Tabs } from '../../../ui/Tabs.tsx'

const NavItems: readonly { view: StudioView; key: MessageKey }[] = [
  { view: StudioViewIds.Tokens, key: 'studio.tab.tokens' },
  { view: StudioViewIds.Oled, key: 'studio.tab.oled' },
  { view: StudioViewIds.Composition, key: 'studio.tab.fp' },
  { view: StudioViewIds.Page, key: 'studio.tab.page' },
  { view: StudioViewIds.Export, key: 'studio.tab.export' },
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
      <div className="flex min-w-0 items-center gap-2 md:gap-6">
        <button
          type="button"
          onClick={() => dispatch(setMobileDrawerOpen(true))}
          className="md:hidden flex items-center justify-center min-h-[38px] min-w-[38px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
          title={t('studio.nav.parameters')}
          aria-label={t('studio.nav.parameters')}
        >
          <Menu className="w-4 h-4" />
        </button>

        <Link
          to={landingPath(locale)}
          title={t('studio.nav.backToSite')}
          className="shrink-0 font-display font-bold text-sm md:text-base tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap transition-opacity hover:opacity-70"
        >
          {t('brand.studio')}
        </Link>

        <Tabs
          label={t('brand.studio')}
          appearance="underline"
          size="md"
          value={activeTab}
          onChange={onTabChange}
          className="hidden md:flex"
          options={NavItems.map((item) => ({ id: item.view, label: t(item.key) }))}
        />
      </div>

      {/* Zone 3: Actions & Mobile Drawer Toggle */}
      <div className="flex items-center gap-2 shrink-0">
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
          onClick={() => onTabChange(StudioViewIds.Export)}
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
