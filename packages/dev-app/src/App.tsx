import React, { useState, useMemo } from 'react'
import {
  type PaletteVariant,
  type EmissivePanelType,
  createPalettesFromSource,
  buildDynamicScheme,
} from '@sandlada/okyct'
import { Controls } from './components/Controls.tsx'
import { TransparencyView } from './components/TransparencyView.tsx'
import { ComplianceView } from './components/ComplianceView.tsx'
import { HueDriftView } from './components/HueDriftView.tsx'
import { analyzeSeedColor } from './utils/audit-runner.ts'

export const App: React.FC = () => {
  const [seedHex, setSeedHex] = useState('#2563EB')
  const [variant, setVariant] = useState<PaletteVariant>('tonalSpot')
  const [contrastLevel, setContrastLevel] = useState<number>(0.0)
  const [panelType, setPanelType] = useState<EmissivePanelType>('amoled-anti-smear')
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'split'>('dark')
  const [activeTab, setActiveTab] = useState<'transparency' | 'compliance' | 'drift'>('transparency')

  // 1. 深度解析种子色色度指标
  const seedMetrics = useMemo(() => {
    try {
      return analyzeSeedColor(seedHex)
    } catch {
      return analyzeSeedColor('#2563EB')
    }
  }, [seedHex])

  // 2. 生成全套 TonalPalette 集合
  const palettes = useMemo(() => {
    try {
      return createPalettesFromSource(seedHex, { variant })
    } catch {
      return createPalettesFromSource('#2563EB', { variant })
    }
  }, [seedHex, variant])

  // 3. 分别求解浅色与深色方案
  const lightScheme = useMemo(() => {
    return buildDynamicScheme(palettes, {
      mode: 'light',
      contrastLevel,
      emissive: { profile: panelType },
    })
  }, [palettes, contrastLevel, panelType])

  const darkScheme = useMemo(() => {
    return buildDynamicScheme(palettes, {
      mode: 'dark',
      contrastLevel,
      emissive: { profile: panelType },
    })
  }, [palettes, contrastLevel, panelType])

  // 当前激活方案（根据单选 light / dark 决定）
  const currentScheme = themeMode === 'light' ? lightScheme : darkScheme
  const isDark = themeMode !== 'light'

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 核心控制栏 */}
      <Controls
        seedHex={seedHex}
        onSeedHexChange={setSeedHex}
        variant={variant}
        onVariantChange={setVariant}
        contrastLevel={contrastLevel}
        onContrastLevelChange={setContrastLevel}
        panelType={panelType}
        onPanelTypeChange={setPanelType}
        themeMode={themeMode}
        onThemeModeChange={setThemeMode}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
      />

      {/* 主视图内容区域 */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {themeMode === 'split' && activeTab === 'compliance' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="font-bold text-sm font-mono text-white">浅色模式 (Light Scheme) 合规审计</h3>
              </div>
              <ComplianceView
                scheme={lightScheme}
                isDark={false}
                panelType={panelType}
                seedMetrics={seedMetrics}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <h3 className="font-bold text-sm font-mono text-white">深色模式 (Dark Scheme) 合规审计</h3>
              </div>
              <ComplianceView
                scheme={darkScheme}
                isDark={true}
                panelType={panelType}
                seedMetrics={seedMetrics}
              />
            </div>
          </div>
        ) : activeTab === 'transparency' ? (
          <TransparencyView
            seedMetrics={seedMetrics}
            palettes={palettes}
            lightScheme={lightScheme}
            darkScheme={darkScheme}
          />
        ) : activeTab === 'compliance' ? (
          <ComplianceView
            scheme={currentScheme}
            isDark={isDark}
            panelType={panelType}
            seedMetrics={seedMetrics}
          />
        ) : (
          <HueDriftView
            seedHex={seedHex}
            onSeedHexChange={setSeedHex}
          />
        )}
      </main>
    </div>
  )
}
