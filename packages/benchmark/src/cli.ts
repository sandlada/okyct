/**
 * @license
 * MIT License
 * Copyright (c) 2026 Kai-Orion & Sandlada
 *
 * OKYCT Multi-Model CLI Benchmark Runner
 */

import {
  runModelBenchmark,
  runThroughputBenchmark,
  runSpectrumSweep,
} from './runners.ts'

function main() {
  console.log('\n================================================================================')
  console.log('  OKYCT 5-Model Benchmark Suite (OKYCT vs Google MCU vs culori vs AntD vs HSL)')
  console.log('================================================================================\n')

  const testHex = '#2563EB'
  console.log(`[1/3] 种子色评估 (${testHex})：色阶质量与色相漂移实测`)
  console.log('--------------------------------------------------------------------------------')
  const results = runModelBenchmark(testHex)

  const qualityTable = results.map((r) => ({
    '模型名称': r.modelName,
    '单次耗时 (ms)': r.computeTimeMs,
    '最大 ΔH': `${r.maxHueDriftDeg}°`,
    '平均 ΔH': `${r.meanHueDriftDeg}°`,
    '最大 ΔTone': r.maxToneDelta,
    '≤0.5° 达标率': `${r.complianceRate}%`,
    '相对加速比': `${r.relativeSpeedup}x`,
  }))
  console.table(qualityTable)

  console.log('\n[2/3] 吞吐量性能排行榜 (生成 10 阶色板，迭代 200 轮)')
  console.log('--------------------------------------------------------------------------------')
  const throughput = runThroughputBenchmark(testHex, 200)
  const throughputTable = throughput.map((t) => ({
    '模型名称': t.modelName,
    '总耗时 (ms)': t.totalMs,
    '单次耗时 (μs)': t.usPerOp,
    '吞吐量 (ops/sec)': t.opsPerSec.toLocaleString(),
    '加速比 (vs MCU)': `${t.relativeSpeedup}x`,
  }))
  console.table(throughputTable)

  console.log('\n[3/3] 360° 全色相环色相漂移扫描 (采样步长 15°，共 24 采样点)')
  console.log('--------------------------------------------------------------------------------')
  const sweep = runSpectrumSweep(0.30, 50)
  const sweepSummary = sweep.map((p) => {
    const isBlueRisk = p.targetHue >= 225 && p.targetHue <= 300
    return {
      '目标 H': `${p.targetHue}°`,
      'OKYCT ΔH': `${p.okyct.drift}°`,
      'MCU ΔH': `${p.googleMcu.drift}°`,
      'culori ΔH': `${p.culori.drift}°`,
      'AntD ΔH': `${p.antdColors.drift}°`,
      'HSL ΔH': `${p.hsl.drift}°`,
      '相对优势 (MCU - OKYCT)': p.advantageOverMcu > 0 ? `+${p.advantageOverMcu}°` : `${p.advantageOverMcu}°`,
      '风险区': isBlueRisk ? '蓝紫高危区' : '-',
    }
  })
  console.table(sweepSummary)

  console.log('\n✔ 5 模型基准测试完成。\n')
}

main()
