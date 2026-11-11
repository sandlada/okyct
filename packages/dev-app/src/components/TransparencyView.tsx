import React, { useState } from 'react'
import {
  type PaletteSet,
  SystemColorTokens,
  type SystemColorToken,
  type DynamicSchemeColors,
  type StandardTone,
  StandardTones,
} from '@sandlada/okyct'
import {
  type SeedColorMetrics,
  analyzePaletteStops,
  type PaletteStopDetail,
} from '../utils/audit-runner.ts'
import { Layers, ArrowRight, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

export interface TransparencyViewProps {
  seedMetrics: SeedColorMetrics
  palettes: PaletteSet
  lightScheme: DynamicSchemeColors
  darkScheme: DynamicSchemeColors
}

export const TransparencyView: React.FC<TransparencyViewProps> = ({
  seedMetrics,
  palettes,
  lightScheme,
  darkScheme,
}) => {
  const [selectedPaletteKey, setSelectedPaletteKey] = useState<keyof PaletteSet>('primary')

  const activePalette = palettes[selectedPaletteKey]
  const stops: PaletteStopDetail[] = analyzePaletteStops(activePalette, selectedPaletteKey)

  return (
    <div className="space-y-8">
      {/* 1. 种子色全量色度参数与求解器指标透明解构 */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">
            种子色色度空间参数解构
          </h2>
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded border border-white/20"
              style={{ backgroundColor: seedMetrics.hex }}
            />
            <span className="font-mono text-sm font-bold text-neutral-200">
              {seedMetrics.hex}
            </span>
          </div>
        </div>

        {/* 关键参数仪表盘 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3">
            <span className="text-[11px] text-neutral-500 font-mono block">Tone</span>
            <span className="text-lg font-bold font-mono text-amber-400">{seedMetrics.hct.t}</span>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3">
            <span className="text-[11px] text-neutral-500 font-mono block">Hue</span>
            <span className="text-lg font-bold font-mono text-indigo-400">{seedMetrics.hct.h}°</span>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3">
            <span className="text-[11px] text-neutral-500 font-mono block">Chroma</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{seedMetrics.hct.c}</span>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3">
            <span className="text-[11px] text-neutral-500 font-mono block">CIE Y</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{seedMetrics.cieY}</span>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3">
            <span className="text-[11px] text-neutral-500 font-mono block">求解耗时</span>
            <span className="text-lg font-bold font-mono text-purple-400">{seedMetrics.solveDurationUs} μs</span>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3">
            <span className="text-[11px] text-neutral-500 font-mono block">功耗</span>
            <span className="text-lg font-bold font-mono text-rose-400">{seedMetrics.pixelPower}%</span>
          </div>
        </div>

        {/* 详细坐标分解表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3 flex items-center justify-between">
            <span className="text-neutral-400">sRGB:</span>
            <span className="text-neutral-200">
              [{seedMetrics.rgb.r}, {seedMetrics.rgb.g}, {seedMetrics.rgb.b}]
            </span>
          </div>
          <div className="bg-neutral-950/40 border border-neutral-800/60 rounded-xl p-3 flex items-center justify-between">
            <span className="text-neutral-400">OKLab:</span>
            <span className="text-neutral-200">
              [{seedMetrics.oklab.l}, {seedMetrics.oklab.a}, {seedMetrics.oklab.b}]
            </span>
          </div>
        </div>
      </section>

      {/* 2. 调色板阶梯全息矩阵 (Tonal Palette Matrix Trace) */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">
            13 级色阶物理计算细节
          </h2>

          {/* 调色板选择器 */}
          <div className="flex flex-wrap gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
            {(Object.keys(palettes) as Array<keyof PaletteSet>).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedPaletteKey(key)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  selectedPaletteKey === key
                    ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* 调色板当前基础参数 */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-neutral-950/40 p-3 rounded-xl border border-neutral-800/60">
          <span className="text-neutral-400">
            调色板基准色相: <strong className="text-indigo-400">{activePalette.hue.toFixed(2)}°</strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-400">
            目标色度模长: <strong className="text-emerald-400">{activePalette.targetChroma.toFixed(4)}</strong>
          </span>
        </div>

        {/* 13 阶详细数据表格 */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-2 px-3">色阶</th>
                <th className="py-2 px-3">色样</th>
                <th className="py-2 px-3">HEX</th>
                <th className="py-2 px-3">Tone</th>
                <th className="py-2 px-3">目标 C</th>
                <th className="py-2 px-3">Cmax</th>
                <th className="py-2 px-3">实际 C</th>
                <th className="py-2 px-3">折返</th>
                <th className="py-2 px-3">ΔH</th>
                <th className="py-2 px-3">CIE Y</th>
                <th className="py-2 px-3">功耗</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {stops.map((s) => (
                <tr key={s.tone} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-2 px-3 font-bold text-white">T{s.tone}</td>
                  <td className="py-2 px-3">
                    <div
                      className="w-6 h-4 rounded border border-white/20 shadow-sm"
                      style={{ backgroundColor: s.hex }}
                    />
                  </td>
                  <td className="py-2 px-3 font-semibold text-neutral-200">{s.hex}</td>
                  <td className="py-2 px-3 text-amber-400">{s.actualTone}</td>
                  <td className="py-2 px-3 text-neutral-400">{s.targetChroma}</td>
                  <td className="py-2 px-3 text-neutral-400">{s.maxGamutChroma}</td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">{s.appliedChroma}</td>
                  <td className="py-2 px-3">
                    {s.isCuspClamped ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                        折返
                      </span>
                    ) : (
                      <span className="text-neutral-600">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span className={s.hueDriftDeg < 0.1 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {s.hueDriftDeg.toFixed(3)}°
                    </span>
                  </td>
                  <td className="py-2 px-3 text-cyan-400">{s.cieY}</td>
                  <td className="py-2 px-3 text-rose-400">{s.pixelPower}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 53 个系统 Token 派生映射明细表 */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">
            53 系统 Token 派生映射图谱
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SystemColorTokens.map((token) => {
            const lightHex = lightScheme[token]
            const darkHex = darkScheme[token]
            const lightTone = lightScheme.tones[token]
            const darkTone = darkScheme.tones[token]

            return (
              <div
                key={token}
                className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col justify-between space-y-2"
              >
                <span className="font-mono font-bold text-xs text-white">{token}</span>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* Light */}
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div
                      className="w-4 h-4 rounded-md border border-black/20 shrink-0"
                      style={{ backgroundColor: lightHex }}
                    />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-amber-400 block">L: T{lightTone}</span>
                      <span className="text-[11px] text-neutral-200 block truncate">{lightHex}</span>
                    </div>
                  </div>

                  {/* Dark */}
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
                    <div
                      className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                      style={{ backgroundColor: darkHex }}
                    />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-indigo-400 block">D: T{darkTone}</span>
                      <span className="text-[11px] text-neutral-200 block truncate">{darkHex}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
