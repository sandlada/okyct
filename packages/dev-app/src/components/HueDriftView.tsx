import React, { useState, useMemo } from 'react'
import {
  analyzeRampHueDrift,
  scanSpectrumHueDrift,
  StressPresets,
  type RampAnalysisResult,
} from '../utils/drift-analyzer.ts'
import type { SpectrumSweepPoint } from '@sandlada/benchmark'

export interface HueDriftViewProps {
  seedHex: string
  onSeedHexChange: (hex: string) => void
}

export const HueDriftView: React.FC<HueDriftViewProps> = ({
  seedHex,
  onSeedHexChange,
}) => {
  // 1. 当前种子色阶分析
  const rampAnalysis: RampAnalysisResult = useMemo(() => {
    try {
      return analyzeRampHueDrift(seedHex)
    } catch {
      return analyzeRampHueDrift('#2563EB')
    }
  }, [seedHex])

  // 2. 360° 全色相环扫描参数控制
  const [sweepChroma, setSweepChroma] = useState<number>(0.30)
  const [sweepTone, setSweepTone] = useState<number>(50)

  const sweepPoints: SpectrumSweepPoint[] = useMemo(() => {
    return scanSpectrumHueDrift(sweepChroma, sweepTone)
  }, [sweepChroma, sweepTone])

  // 漂移颜色徽章辅助
  const renderDriftBadge = (drift: number) => {
    if (drift <= 0.5) {
      return (
        <span className="text-emerald-400 font-bold font-mono text-xs">
          {drift.toFixed(2)}°
        </span>
      )
    }
    if (drift <= 2.5) {
      return (
        <span className="text-amber-400 font-bold font-mono text-xs">
          {drift.toFixed(2)}°
        </span>
      )
    }
    return (
      <span className="text-rose-400 font-bold font-mono text-xs">
        {drift.toFixed(2)}°
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 压力测试预设选择条 */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-xs font-mono text-neutral-400">
          压力场景:
        </span>
        <div className="flex flex-wrap gap-2">
          {StressPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSeedHexChange(preset.hex)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                seedHex.toUpperCase() === preset.hex.toUpperCase()
                  ? 'bg-neutral-800 text-white border-neutral-600 font-bold'
                  : 'bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full border border-white/20"
                style={{ backgroundColor: preset.hex }}
              />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. 当前种子色阶五模型实测指标卡 */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-mono font-bold text-white">
              五模型色阶实测与漂移对标
            </h2>
            <span className="text-xs font-mono text-neutral-400">
              H: <strong className="text-indigo-400">{rampAnalysis.sourceHue}°</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded border border-white/20"
              style={{ backgroundColor: rampAnalysis.sourceHex }}
            />
            <span className="font-mono text-xs text-neutral-300 font-bold">
              {rampAnalysis.sourceHex}
            </span>
          </div>
        </div>

        {/* 关键统计指标五列横比卡 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {rampAnalysis.summaries.map((summary) => (
            <div
              key={summary.modelId}
              className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 space-y-2 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
                <span className="font-bold text-white truncate" title={summary.modelName}>
                  {summary.shortName}
                </span>
                <span className="text-[10px] text-neutral-500">{summary.computeTimeMs} ms</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div>
                  <span className="text-neutral-500 block text-[10px]">最大 ΔH</span>
                  <span
                    className={
                      summary.maxHueDriftDeg <= 0.5
                        ? 'text-emerald-400 font-bold'
                        : summary.maxHueDriftDeg <= 2.5
                        ? 'text-amber-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {summary.maxHueDriftDeg}°
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">平均 ΔH</span>
                  <span className="text-neutral-300 font-semibold">{summary.meanHueDriftDeg}°</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">最大 ΔT</span>
                  <span
                    className={
                      summary.maxToneDelta <= 1.0
                        ? 'text-emerald-400 font-bold'
                        : summary.maxToneDelta <= 4.0
                        ? 'text-amber-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {summary.maxToneDelta}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">≤0.5° 达标</span>
                  <span
                    className={
                      summary.complianceRate >= 90
                        ? 'text-emerald-400 font-bold'
                        : 'text-neutral-400 font-bold'
                    }
                  >
                    {summary.complianceRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 逐阶实测横向数据对比表格 */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-2 px-2.5">色阶</th>
                <th className="py-2 px-2.5" colSpan={3}>OKYCT</th>
                <th className="py-2 px-2.5" colSpan={3}>Google MCU</th>
                <th className="py-2 px-2.5" colSpan={3}>culori</th>
                <th className="py-2 px-2.5" colSpan={3}>AntD</th>
                <th className="py-2 px-2.5" colSpan={3}>HSL</th>
              </tr>
              <tr className="text-[10px] text-neutral-500 border-b border-neutral-800/60 bg-neutral-950">
                <th className="py-1 px-2.5">Tone</th>
                <th className="py-1 px-2.5">色样</th>
                <th className="py-1 px-2.5">H</th>
                <th className="py-1 px-2.5">ΔH</th>
                <th className="py-1 px-2.5">色样</th>
                <th className="py-1 px-2.5">H</th>
                <th className="py-1 px-2.5">ΔH</th>
                <th className="py-1 px-2.5">色样</th>
                <th className="py-1 px-2.5">H</th>
                <th className="py-1 px-2.5">ΔH</th>
                <th className="py-1 px-2.5">色样</th>
                <th className="py-1 px-2.5">H</th>
                <th className="py-1 px-2.5">ΔH</th>
                <th className="py-1 px-2.5">色样</th>
                <th className="py-1 px-2.5">H</th>
                <th className="py-1 px-2.5">ΔH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {rampAnalysis.stops.map((stop) => (
                <tr key={stop.tone} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-2 px-2.5 font-bold text-white">T{stop.tone}</td>

                  {/* OKYCT */}
                  <td className="py-2 px-2.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: stop.okyct.hex }}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-neutral-300">{stop.okyct.hue}°</td>
                  <td className="py-2 px-2.5">{renderDriftBadge(stop.okyct.drift)}</td>

                  {/* Google MCU */}
                  <td className="py-2 px-2.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: stop.googleMcu.hex }}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-neutral-300">{stop.googleMcu.hue}°</td>
                  <td className="py-2 px-2.5">{renderDriftBadge(stop.googleMcu.drift)}</td>

                  {/* culori */}
                  <td className="py-2 px-2.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: stop.culori.hex }}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-neutral-300">{stop.culori.hue}°</td>
                  <td className="py-2 px-2.5">{renderDriftBadge(stop.culori.drift)}</td>

                  {/* antd */}
                  <td className="py-2 px-2.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: stop.antdColors.hex }}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-neutral-300">{stop.antdColors.hue}°</td>
                  <td className="py-2 px-2.5">{renderDriftBadge(stop.antdColors.drift)}</td>

                  {/* HSL */}
                  <td className="py-2 px-2.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: stop.hsl.hex }}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-neutral-300">{stop.hsl.hue}°</td>
                  <td className="py-2 px-2.5">{renderDriftBadge(stop.hsl.drift)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. 360° 全色相环全息扫描对比表 */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">
            360° 色相环五模型全域扫描
          </h2>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">色度 C:</span>
              <select
                value={sweepChroma}
                onChange={(e) => setSweepChroma(parseFloat(e.target.value))}
                className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-neutral-200"
              >
                <option value={0.20}>0.20</option>
                <option value={0.30}>0.30</option>
                <option value={0.38}>0.38</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">Tone:</span>
              <select
                value={sweepTone}
                onChange={(e) => setSweepTone(parseInt(e.target.value, 10))}
                className="bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-neutral-200"
              >
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={70}>70</option>
              </select>
            </div>
          </div>
        </div>

        {/* 扫描数据表格 */}
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60 max-h-96">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3">目标 H</th>
                <th className="py-2 px-3">OKYCT</th>
                <th className="py-2 px-3">ΔH</th>
                <th className="py-2 px-3">MCU</th>
                <th className="py-2 px-3">ΔH</th>
                <th className="py-2 px-3">culori</th>
                <th className="py-2 px-3">ΔH</th>
                <th className="py-2 px-3">AntD</th>
                <th className="py-2 px-3">ΔH</th>
                <th className="py-2 px-3">HSL</th>
                <th className="py-2 px-3">ΔH</th>
                <th className="py-2 px-3">优势 (vs MCU)</th>
                <th className="py-2 px-3">风险区</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {sweepPoints.map((pt) => {
                const isBlueRiskZone = pt.targetHue >= 225 && pt.targetHue <= 300

                return (
                  <tr
                    key={pt.targetHue}
                    className={`hover:bg-neutral-800/30 transition-colors ${
                      isBlueRiskZone ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-white">{pt.targetHue}°</td>

                    {/* OKYCT */}
                    <td className="py-2 px-3">
                      <div
                        className="w-4 h-4 rounded border border-white/20"
                        style={{ backgroundColor: pt.okyct.hex }}
                      />
                    </td>
                    <td className="py-2 px-3">{renderDriftBadge(pt.okyct.drift)}</td>

                    {/* Google MCU */}
                    <td className="py-2 px-3">
                      <div
                        className="w-4 h-4 rounded border border-white/20"
                        style={{ backgroundColor: pt.googleMcu.hex }}
                      />
                    </td>
                    <td className="py-2 px-3">{renderDriftBadge(pt.googleMcu.drift)}</td>

                    {/* culori */}
                    <td className="py-2 px-3">
                      <div
                        className="w-4 h-4 rounded border border-white/20"
                        style={{ backgroundColor: pt.culori.hex }}
                      />
                    </td>
                    <td className="py-2 px-3">{renderDriftBadge(pt.culori.drift)}</td>

                    {/* AntD */}
                    <td className="py-2 px-3">
                      <div
                        className="w-4 h-4 rounded border border-white/20"
                        style={{ backgroundColor: pt.antdColors.hex }}
                      />
                    </td>
                    <td className="py-2 px-3">{renderDriftBadge(pt.antdColors.drift)}</td>

                    {/* HSL */}
                    <td className="py-2 px-3">
                      <div
                        className="w-4 h-4 rounded border border-white/20"
                        style={{ backgroundColor: pt.hsl.hex }}
                      />
                    </td>
                    <td className="py-2 px-3">{renderDriftBadge(pt.hsl.drift)}</td>

                    {/* 相对优势 */}
                    <td className="py-2 px-3">
                      {pt.advantageOverMcu > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          - {pt.advantageOverMcu.toFixed(2)}°
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>

                    {/* 区间标注 */}
                    <td className="py-2 px-3">
                      {isBlueRiskZone ? (
                        <span className="text-[10px] text-indigo-400 font-bold">
                          蓝紫高危
                        </span>
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
