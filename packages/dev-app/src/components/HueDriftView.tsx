import React, { useState, useMemo } from 'react'
import {
  analyzeRampHueDrift,
  scanSpectrumHueDrift,
  StressPresets,
  type RampAnalysisResult,
} from '../utils/drift-analyzer.ts'
import type { SpectrumSweepPoint } from '@sandlada/benchmark'
import { BenchmarkMatrixPanel } from './BenchmarkMatrixPanel.tsx'

export interface HueDriftViewProps {
  seedHex: string
  onSeedHexChange: (hex: string) => void
}

export const HueDriftView: React.FC<HueDriftViewProps> = ({
  seedHex,
  onSeedHexChange,
}) => {
  const rampAnalysis: RampAnalysisResult = useMemo(() => {
    try {
      return analyzeRampHueDrift(seedHex)
    } catch {
      return analyzeRampHueDrift('#2563EB')
    }
  }, [seedHex])

  const [sweepTone, setSweepTone] = useState<number>(50)

  const sweepPoints: SpectrumSweepPoint[] = useMemo(() => {
    return scanSpectrumHueDrift(0.3, sweepTone)
  }, [sweepTone])

  const renderDriftBadge = (drift: number) => (
    <span className="text-neutral-200 font-bold font-mono text-xs">{drift.toFixed(2)}° w</span>
  )

  const renderMetricCell = (drift: number, deltaLStar: number) => (
    <td className="py-2 px-2.5">
      <div className="flex flex-col gap-0.5">
        {renderDriftBadge(drift)}
        <span className="text-[9px] font-mono text-neutral-500">ΔL* {deltaLStar.toFixed(2)}</span>
      </div>
    </td>
  )

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-xs font-mono text-neutral-400">协议 {rampAnalysis.protocolVersion} · CIE L* 轴</span>
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

      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
          <RampHeader
            title="三模型色阶实测（CIE L*）"
            hue={rampAnalysis.sourceHue}
            spaceDependent={rampAnalysis.hueSpaceDependent}
          />
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded border border-white/20"
              style={{ backgroundColor: rampAnalysis.sourceHex }}
            />
            <span className="font-mono text-xs text-neutral-300 font-bold">{rampAnalysis.sourceHex}</span>
          </div>
        </div>

        <BenchmarkMatrixPanel summaries={rampAnalysis.summaries} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rampAnalysis.summaries.map((summary) => (
            <div
              key={summary.modelId}
              className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 space-y-2 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
                <span className="font-bold text-white truncate">{summary.shortName}</span>
                <span className="text-[10px] text-neutral-500">{summary.computeTimeMedianMs} ms</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div>
                  <span className="text-neutral-500 block text-[10px]">ΔL* p95</span>
                  <span className="text-emerald-400 font-bold">{summary.deltaLStarP95}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">ΔL* mean</span>
                  <span className="text-neutral-300 font-semibold">{summary.deltaLStarMean}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">wΔH p95 (OKLab)</span>
                  <span className="text-neutral-300 font-semibold">
                    {summary.weightedHueP95.oklab}°
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">角色 AA</span>
                  <span className="text-neutral-300 font-semibold">
                    L {summary.semanticContrast.light.passCount}/{summary.semanticContrast.light.pairCount}
                    {' · '}
                    D {summary.semanticContrast.dark.passCount}/{summary.semanticContrast.dark.pairCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-2 px-2.5">L*</th>
                <th className="py-2 px-2.5" colSpan={3}>
                  OKYCT
                </th>
                <th className="py-2 px-2.5" colSpan={3}>
                  Google MCU
                </th>
                <th className="py-2 px-2.5" colSpan={3}>
                  culori
                </th>
              </tr>
              <tr className="text-[10px] text-neutral-500 border-b border-neutral-800/60 bg-neutral-950">
                <th className="py-1 px-2.5">Tone</th>
                <th className="py-1 px-2.5">色样</th>
                <th className="py-1 px-2.5">H</th>
                <th className="py-1 px-2.5">wΔH/ΔL*</th>
                <th className="py-1 px-2.5">色样</th>
                <th className="py-1 px-2.5">H</th>
                <th className="py-1 px-2.5">wΔH/ΔL*</th>
                <th className="py-1 px-2.5">色样</th>
                <th className="py-1 px-2.5">H</th>
                <th className="py-1 px-2.5">wΔH/ΔL*</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {rampAnalysis.stops.map((stop) => (
                <tr key={stop.tone} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-2 px-2.5 font-bold text-white">T{stop.tone}</td>
                  <td className="py-2 px-2.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: stop.okyct.hex }}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-neutral-300">{stop.okyct.hue}°</td>
                  {renderMetricCell(stop.okyct.drift, stop.okyct.deltaLStar)}
                  <td className="py-2 px-2.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: stop.googleMcu.hex }}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-neutral-300">{stop.googleMcu.hue}°</td>
                  {renderMetricCell(stop.googleMcu.drift, stop.googleMcu.deltaLStar)}
                  <td className="py-2 px-2.5">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: stop.culori.hex }}
                    />
                  </td>
                  <td className="py-2 px-2.5 text-neutral-300">{stop.culori.hue}°</td>
                  {renderMetricCell(stop.culori.drift, stop.culori.deltaLStar)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">系统色相种子扫描（固定 L*）</h2>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-neutral-400">L*:</span>
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

        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60 max-h-96">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3">种子</th>
                <th className="py-2 px-3">H</th>
                <th className="py-2 px-3">OKYCT</th>
                <th className="py-2 px-3">wΔH</th>
                <th className="py-2 px-3">MCU</th>
                <th className="py-2 px-3">wΔH</th>
                <th className="py-2 px-3">culori</th>
                <th className="py-2 px-3">wΔH</th>
                <th className="py-2 px-3">ΔL*</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {sweepPoints.map((pt) => (
                <tr key={pt.seedHex} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-2 px-3 font-bold text-white">{pt.seedHex}</td>
                  <td className="py-2 px-3">{pt.targetHue}°</td>
                  <td className="py-2 px-3">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: pt.okyct.hex }}
                    />
                  </td>
                  <td className="py-2 px-3">{renderDriftBadge(pt.okyct.drift)}</td>
                  <td className="py-2 px-3">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: pt.googleMcu.hex }}
                    />
                  </td>
                  <td className="py-2 px-3">{renderDriftBadge(pt.googleMcu.drift)}</td>
                  <td className="py-2 px-3">
                    <div
                      className="w-4 h-4 rounded border border-white/20"
                      style={{ backgroundColor: pt.culori.hex }}
                    />
                  </td>
                  <td className="py-2 px-3">{renderDriftBadge(pt.culori.drift)}</td>
                  <td className="py-2 px-3 text-[10px] text-neutral-500">
                    O {pt.okyct.deltaLStar.toFixed(2)} · M {pt.googleMcu.deltaLStar.toFixed(2)} · C{' '}
                    {pt.culori.deltaLStar.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function RampHeader({
  title,
  hue,
  spaceDependent,
}: {
  title: string
  hue: number
  spaceDependent: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-sm font-mono font-bold text-white">{title}</h2>
      <span className="text-xs font-mono text-neutral-400">
        种子 H: <strong className="text-indigo-400">{hue}°</strong>
        {spaceDependent ? ' · space-dependent' : ''}
      </span>
    </div>
  )
}
