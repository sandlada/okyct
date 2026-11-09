
import React, { useState, useMemo, useDeferredValue } from 'react'
import { createPalettesFromSource, PaletteVariant } from './color/palettes.ts'
import {
  buildDynamicScheme,
  CustomColorConfig,
  resolveCustomColors,
} from './color/scheme.ts'
import { EmissivePanelType } from './color/emissive.ts'
import { CvdType } from './color/benchmark.ts'
import { TopNav } from './components/TopNav.tsx'
import { MobileBottomNav } from './components/MobileBottomNav.tsx'
import { SidebarControls } from './components/SidebarControls.tsx'
import { TokensView } from './components/views/TokensView.tsx'
import { OledView } from './components/views/OledView.tsx'
import { TokenExportView } from './components/views/TokenExportView.tsx'
import { FpPlaygroundView } from './components/views/FpPlaygroundView.tsx'
import { useTheme } from './theme/index.tsx'
import type { StudioView } from './router/routes.ts'

interface StudioAppProps {
  readonly view: StudioView
  readonly onViewChange: (view: StudioView) => void
}

export default function App({ view, onViewChange }: StudioAppProps) {
  const { isDark, toggleTheme, setTheme } = useTheme()
  const [sourceHex, setSourceHex] = useState<string>('#1A73E8')
  const [variant, setVariant] = useState<PaletteVariant>('tonalSpot')
  const [contrastLevel, setContrastLevel] = useState<number>(0.0)
  const [harmonize, setHarmonize] = useState<boolean>(true)
  const [cvdType, setCvdType] = useState<CvdType>('none')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false)

  // 自发光面板 (OLED / AMOLED / MicroOLED) 物理调校状态
  const [emissiveProfile, setEmissiveProfile] = useState<EmissivePanelType>('amoled-anti-smear');
  const [burnInGuard, setBurnInGuard] = useState<boolean>(true);
  const [antiFringing, setAntiFringing] = useState<boolean>(true);

  // 自定义扩展品牌/业务语义色（默认空；由侧边栏「Add semantic」添加）
  const [customColors, setCustomColors] = useState<CustomColorConfig[]>([]);

  const deferredSourceHex = useDeferredValue(sourceHex)
  const deferredContrastLevel = useDeferredValue(contrastLevel)

  // Palettes derive from seed + variant (OKYCT coords stay in engine / views).
  const palettes = useMemo(
    () => createPalettesFromSource(deferredSourceHex, variant, harmonize),
    [deferredSourceHex, variant, harmonize]
  );

  // 3. 推导当前界面的动态语义方案 (融合自发光面板物理参数)
  const emissiveOpts = useMemo(
    () => ({ profile: emissiveProfile, burnInGuard, antiFringing }),
    [emissiveProfile, burnInGuard, antiFringing]
  );

  const scheme = useMemo(
    () => buildDynamicScheme(palettes, isDark, deferredContrastLevel, emissiveOpts),
    [palettes, isDark, deferredContrastLevel, emissiveOpts]
  );

  // 4. 同步生成明暗两套方案用于导出
  const lightScheme = useMemo(
    () => buildDynamicScheme(palettes, false, deferredContrastLevel, emissiveOpts),
    [palettes, deferredContrastLevel, emissiveOpts]
  );
  const darkScheme = useMemo(
    () => buildDynamicScheme(palettes, true, deferredContrastLevel, emissiveOpts),
    [palettes, deferredContrastLevel, emissiveOpts]
  );

  // 5. 推导自定义扩展语义色四元组 (明/暗双模式)
  const resolvedCustomLight = useMemo(
    () => resolveCustomColors(customColors, deferredSourceHex, false, deferredContrastLevel),
    [customColors, deferredSourceHex, deferredContrastLevel]
  );
  const resolvedCustomDark = useMemo(
    () => resolveCustomColors(customColors, deferredSourceHex, true, deferredContrastLevel),
    [customColors, deferredSourceHex, deferredContrastLevel]
  );

  const schemeRecomputing =
    sourceHex !== deferredSourceHex || contrastLevel !== deferredContrastLevel
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 relative">
      {/* 顶部单行三区契约导航栏 */}
      <TopNav
        activeTab={view}
        onTabChange={onViewChange}
        isDark={isDark}
        onToggleDark={toggleTheme}
        onOpenExport={() => onViewChange('export')}
        onOpenMobileControls={() => setMobileDrawerOpen(true)}
      />

      {/* 主体布局 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 桌面端常驻左侧控制塔 */}
        <div className="hidden md:flex h-full">
          <SidebarControls
            sourceHex={sourceHex}
            onSourceHexChange={setSourceHex}
            variant={variant}
            onVariantChange={setVariant}
            contrastLevel={contrastLevel}
            onContrastLevelChange={setContrastLevel}
            harmonize={harmonize}
            onHarmonizeChange={setHarmonize}
            cvdType={cvdType}
            onCvdTypeChange={setCvdType}
            customColors={customColors}
            onCustomColorsChange={setCustomColors}
            emissiveProfile={emissiveProfile}
            onEmissiveProfileChange={setEmissiveProfile}
            burnInGuard={burnInGuard}
            onBurnInGuardChange={setBurnInGuard}
            antiFringing={antiFringing}
            onAntiFringingChange={setAntiFringing}
          />
        </div>

        {/* 移动端参数抽屉弹窗 (Drawer Modal) */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
            />
            <div className="relative w-full max-w-sm h-full max-h-screen bg-neutral-50 dark:bg-neutral-900 shadow-2xl z-10 flex flex-col overflow-hidden">
              <SidebarControls
                sourceHex={sourceHex}
                onSourceHexChange={setSourceHex}
                variant={variant}
                onVariantChange={setVariant}
                contrastLevel={contrastLevel}
                onContrastLevelChange={setContrastLevel}
                harmonize={harmonize}
                onHarmonizeChange={setHarmonize}
                cvdType={cvdType}
                onCvdTypeChange={setCvdType}
                customColors={customColors}
                onCustomColorsChange={setCustomColors}
                emissiveProfile={emissiveProfile}
                onEmissiveProfileChange={setEmissiveProfile}
                burnInGuard={burnInGuard}
                onBurnInGuardChange={setBurnInGuard}
                antiFringing={antiFringing}
                onAntiFringingChange={setAntiFringing}
                onCloseMobile={() => setMobileDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* 主视口工作区 */}
        <main
          className={`flex-1 flex flex-col overflow-hidden relative transition-opacity duration-150 ${
            schemeRecomputing ? 'opacity-[0.92]' : 'opacity-100'
          }`}
        >
          {view === 'tokens' && (
            <TokensView
              palettes={palettes}
              scheme={scheme}
              lightScheme={lightScheme}
              darkScheme={darkScheme}
              customColorsLight={resolvedCustomLight}
              customColorsDark={resolvedCustomDark}
              cvdType={cvdType}
            />
          )}

          {view === 'oled' && (
            <OledView
              palettes={palettes}
              scheme={scheme}
              contrastLevel={deferredContrastLevel}
              burnInGuard={burnInGuard}
              onBurnInGuardChange={setBurnInGuard}
              antiFringing={antiFringing}
              onAntiFringingChange={setAntiFringing}
              isDark={isDark}
              onForceDarkMode={() => setTheme('dark')}
            />
          )}

          {view === 'fp' && (
            <FpPlaygroundView scheme={scheme} isDark={isDark} />
          )}

          {view === 'export' && (
            <TokenExportView
              palettes={palettes}
              lightScheme={lightScheme}
              darkScheme={darkScheme}
              customColorsLight={resolvedCustomLight}
              customColorsDark={resolvedCustomDark}
            />
          )}
        </main>
      </div>

      {/* 移动端底部固定导航栏 */}
      <MobileBottomNav activeTab={view} onTabChange={onViewChange} />
    </div>
  );
}

