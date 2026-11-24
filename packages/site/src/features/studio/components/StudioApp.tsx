import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { FpPlaygroundView } from '../../composition/components/FpPlaygroundView.tsx'
import { DeltaView } from '../../delta/components/DeltaView.tsx'
import { TokenExportView } from '../../export/components/TokenExportView.tsx'
import { PageView } from '../../page/components/PageView.tsx'
import { OledView } from '../../oled/components/OledView.tsx'
import { PalettesView } from '../../palettes/components/PalettesView.tsx'
import { SimpleView } from '../../simple/components/SimpleView.tsx'
import { TokensView } from '../../tokens/components/TokensView.tsx'
import { VariantView } from '../../variant/components/VariantView.tsx'
import { selectSchemePending } from '../selectors.ts'
import { setMobileDrawerOpen } from '../slice.ts'
import { MobileBottomNav } from './MobileBottomNav.tsx'
import { SidebarControls } from './SidebarControls.tsx'
import { TopNav } from './TopNav.tsx'
import { useRouter } from '../../../router/index.tsx'
import { StudioViewIds } from '../routes.ts'

export default function StudioApp() {
  const { route } = useRouter()
  const dispatch = useAppDispatch()
  const mobileDrawerOpen = useAppSelector((state) => state.studio.mobileDrawerOpen)
  const schemeRecomputing = useAppSelector(selectSchemePending)

  if (route.kind !== 'studio') {
    throw new Error('StudioApp rendered outside a studio route')
  }

  const view = route.view

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 relative">
      <TopNav />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="hidden md:flex h-full">
          <SidebarControls />
        </div>

        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              onClick={() => dispatch(setMobileDrawerOpen(false))}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />
            <div className="relative w-full max-w-sm h-full max-h-screen bg-neutral-50 dark:bg-neutral-900 shadow-2xl z-10 flex flex-col overflow-hidden">
              <SidebarControls closable />
            </div>
          </div>
        )}

        <main
          className={`flex-1 flex flex-col overflow-hidden relative transition-opacity duration-150 ${
            schemeRecomputing ? 'opacity-[0.92]' : 'opacity-100'
          }`}
        >
          {view === StudioViewIds.Tokens && <TokensView />}
          {view === StudioViewIds.Palettes && <PalettesView />}
          {view === StudioViewIds.Variant && <VariantView />}
          {view === StudioViewIds.Oled && <OledView />}
          {view === StudioViewIds.Composition && <FpPlaygroundView />}
          {view === StudioViewIds.Delta && <DeltaView />}
          {view === StudioViewIds.Simple && <SimpleView />}
          {view === StudioViewIds.Page && <PageView />}
          {view === StudioViewIds.Export && <TokenExportView />}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
