
import { Code2, Layers, Cpu, Palette } from 'lucide-react'
import { useI18n, type MessageKey } from '../i18n/index.tsx'
import type { StudioView } from '../router/routes.ts'

interface MobileBottomNavProps {
  activeTab: StudioView
  onTabChange: (tab: StudioView) => void
}

const MobileTabs: readonly { id: StudioView; key: MessageKey; icon: typeof Palette }[] = [
  { id: 'tokens', key: 'studio.mobile.tokens', icon: Palette },
  { id: 'oled', key: 'studio.mobile.oled', icon: Cpu },
  { id: 'fp', key: 'studio.mobile.fp', icon: Layers },
  { id: 'export', key: 'studio.mobile.export', icon: Code2 },
]

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const { t } = useI18n()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-4 items-center px-0.5 pb-safe select-none"
      aria-label="Mobile Navigation"
    >
      {MobileTabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors ${
              isActive
                ? 'text-neutral-900 dark:text-neutral-100 font-bold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
            <span className="text-[10px] mt-1 tracking-tight">{t(tab.key)}</span>
          </button>
        )
      })}
    </nav>
  )
}
