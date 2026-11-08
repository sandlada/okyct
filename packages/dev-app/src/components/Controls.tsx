import React from 'react'
import {
  PaletteVariant,
  EmissivePanelType,
} from '@sandlada/okyct'
import { Eye, ShieldAlert, Sun, Moon, Split, Sliders, Monitor, Compass } from 'lucide-react'

export interface ControlsProps {
  seedHex: string
  onSeedHexChange: (hex: string) => void
  variant: PaletteVariant
  onVariantChange: (v: PaletteVariant) => void
  contrastLevel: number
  onContrastLevelChange: (c: number) => void
  panelType: EmissivePanelType
  onPanelTypeChange: (p: EmissivePanelType) => void
  themeMode: 'light' | 'dark' | 'split'
  onThemeModeChange: (m: 'light' | 'dark' | 'split') => void
  activeTab: 'transparency' | 'compliance' | 'drift'
  onActiveTabChange: (t: 'transparency' | 'compliance' | 'drift') => void
}

const PresetColors: ReadonlyArray<{ name: string; hex: string; note: string }> = [
  { name: '经典蓝', hex: '#2563EB', note: '标准基准色' },
  { name: '极限亮黄', hex: '#FFD600', note: '传统可读性灾难' },
  { name: '纯深蓝', hex: '#0000FF', note: 'Abney效应与蓝光高危' },
  { name: '高纯品红', hex: '#FF00FF', note: '极值色度折返边界' },
  { name: '鲜亮赤红', hex: '#EF4444', note: '语义报警核心色' },
  { name: '翠绿', hex: '#10B981', note: '高量子效率色' },
]

export const Controls: React.FC<ControlsProps> = ({
  seedHex,
  onSeedHexChange,
  variant,
  onVariantChange,
  contrastLevel,
  onContrastLevelChange,
  panelType,
  onPanelTypeChange,
  themeMode,
  onThemeModeChange,
  activeTab,
  onActiveTabChange,
}) => {
  return (
    <div className="bg-neutral-900 border-b border-neutral-800 p-6 space-y-6">
      {/* 顶层主选项卡与显示模式 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 透明度 vs 合规性 两大主标签 */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-neutral-400 px-2 py-1 bg-neutral-800 rounded border border-neutral-700">
            dev-app
          </span>
          <div className="inline-flex p-1 rounded-xl bg-neutral-950 border border-neutral-800">
            <button
              onClick={() => onActiveTabChange('transparency')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'transparency'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>过程透明</span>
            </button>
            <button
              onClick={() => onActiveTabChange('compliance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'compliance'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>结果合规</span>
            </button>
            <button
              onClick={() => onActiveTabChange('drift')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === 'drift'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>色相漂移</span>
            </button>
          </div>
        </div>

        {/* 浅色/深色/左右并排模式切换 */}
        <div className="flex items-center gap-1">
          <div className="inline-flex p-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
            <button
              onClick={() => onThemeModeChange('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                themeMode === 'light' ? 'bg-neutral-800 text-amber-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> 浅色
            </button>
            <button
              onClick={() => onThemeModeChange('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                themeMode === 'dark' ? 'bg-neutral-800 text-indigo-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> 深色
            </button>
            <button
              onClick={() => onThemeModeChange('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                themeMode === 'split' ? 'bg-neutral-800 text-emerald-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" /> 并排
            </button>
          </div>
        </div>
      </div>

      {/* 参数调控控制网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {/* 1. 种子色输入与预设 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
            <span>种子色</span>
            <span className="font-mono text-indigo-400">{seedHex}</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={seedHex}
                onChange={(e) => onSeedHexChange(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                placeholder="#2563EB"
              />
            </div>
            <input
              type="color"
              value={seedHex.startsWith('#') && seedHex.length === 7 ? seedHex : '#2563EB'}
              onChange={(e) => onSeedHexChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-neutral-700 bg-neutral-950 cursor-pointer p-0.5"
            />
          </div>
          {/* 快速极端色预设 */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PresetColors.map((p) => (
              <button
                key={p.hex}
                onClick={() => onSeedHexChange(p.hex)}
                className="group relative flex items-center gap-1 px-2 py-1 rounded bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-xs font-mono transition-all"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.hex }} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. 调色策略 Variant */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            变体策略
          </label>
          <select
            value={variant}
            onChange={(e) => onVariantChange(e.target.value as PaletteVariant)}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="tonalSpot">tonalSpot</option>
            <option value="vibrant">vibrant</option>
            <option value="expressive">expressive</option>
            <option value="fidelity">fidelity</option>
            <option value="content">content</option>
            <option value="neutral">neutral</option>
            <option value="monochrome">monochrome</option>
          </select>
        </div>

        {/* 3. 对比度级别 Contrast Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> 对比度
            </span>
            <span className="font-mono text-amber-400">
              {contrastLevel > 0 ? `+${contrastLevel.toFixed(2)}` : contrastLevel.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="-1.0"
            max="1.0"
            step="0.05"
            value={contrastLevel}
            onChange={(e) => onContrastLevelChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-950 rounded-lg border border-neutral-800"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
            <span>-1.0</span>
            <span>0.0</span>
            <span>+1.0</span>
          </div>
        </div>

        {/* 4. 自发光硬件物理模式 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            显示面板
          </label>
          <select
            value={panelType}
            onChange={(e) => onPanelTypeChange(e.target.value as EmissivePanelType)}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="standard-lcd">standard-lcd</option>
            <option value="oled-true-black">oled-true-black (T=0)</option>
            <option value="amoled-anti-smear">amoled-anti-smear (T=4)</option>
            <option value="micro-oled-xr">micro-oled-xr (T=8~92)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
