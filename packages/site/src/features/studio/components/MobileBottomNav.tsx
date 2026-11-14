import { Activity, Code2, Cpu, Layers, LayoutTemplate, Palette } from 'lucide-react'
import { useI18n, type MessageKey } from '../../../i18n/index.tsx'
import { useRouter } from '../../../router/index.tsx'
import { studioPath, StudioViewIds, type StudioView } from '../../../router/routes.ts'
import { Tabs } from '../../../ui/Tabs.tsx'

const MobileTabs: readonly { id: StudioView; key: MessageKey; icon: typeof Palette }[] = [
  { id: StudioViewIds.Tokens, key: 'studio.mobile.tokens', icon: Palette },
  { id: StudioViewIds.Oled, key: 'studio.mobile.oled', icon: Cpu },
  { id: StudioViewIds.Composition, key: 'studio.mobile.fp', icon: Layers },
  { id: StudioViewIds.Delta, key: 'studio.mobile.delta', icon: Activity },
  { id: StudioViewIds.Page, key: 'studio.mobile.page', icon: LayoutTemplate },
  { id: StudioViewIds.Export, key: 'studio.mobile.export', icon: Code2 },
]

export function MobileBottomNav() {
  const { t, locale } = useI18n()
  const { route, navigate } = useRouter()
  if (route.kind !== 'studio') {
    throw new Error('MobileBottomNav is only rendered on studio routes')
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-0.5 pb-safe select-none">
      <Tabs
        label="Mobile Navigation"
        appearance="dock"
        size="sm"
        value={route.view}
        onChange={(view) => navigate(studioPath(locale, view))}
        className="h-full"
        options={MobileTabs.map((tab) => ({
          id: tab.id,
          label: t(tab.key),
          icon: tab.icon,
        }))}
      />
    </nav>
  )
}
