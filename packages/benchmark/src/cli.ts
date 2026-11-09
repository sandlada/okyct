/**
 * 三模型公平评测 CLI
 */

import {
  runModelBenchmark,
  runThroughputBenchmark,
  runSpectrumSweep,
  BenchmarkProtocolVersion,
} from './runners.ts'

function main() {
  console.log('\n================================================================================')
  console.log(`  OKYCT Fair Benchmark (protocol ${BenchmarkProtocolVersion}): OKYCT · MCU · culori`)
  console.log('================================================================================\n')

  const testHex = '#2563EB'
  console.log(`[1/3] CIE L* 对齐色阶评测 — 种子 ${testHex}`)
  console.log('--------------------------------------------------------------------------------')
  const results = runModelBenchmark(testHex)

  const qualityTable = results.map((r) => ({
    模型: r.shortName,
    'ΔL* mean': r.deltaLStarMean,
    'ΔL* p95': r.deltaLStarP95,
    '加权色相 mean (CIELAB)': r.weightedHueMean.cielab,
    '加权色相 p95 (OKLab)': r.weightedHueP95.oklab,
    '色相排除': r.hueExcluded ? '近中性' : '否',
    '耗时中位 ms': r.computeTimeMedianMs,
    '浅色角色 AA': `${r.semanticContrast.light.passCount}/${r.semanticContrast.light.pairCount}`,
    '深色角色 AA': `${r.semanticContrast.dark.passCount}/${r.semanticContrast.dark.pairCount}`,
  }))
  console.table(qualityTable)
  if (results[0]?.hueSpaceDependent) {
    console.log('  ℹ 三空间色相排名不一致 — 标记 space-dependent\n')
  }

  console.log('\n[2/3] 吞吐（单种子 10 档 × 200 轮）')
  console.log('--------------------------------------------------------------------------------')
  const throughput = runThroughputBenchmark(testHex, 200)
  console.table(
    throughput.map((t) => ({
      模型: t.modelName,
      '总 ms': t.totalMs,
      '每轮 ms': t.medianMsPerRamp,
    })),
  )

  console.log('\n[3/3] 系统色相扫描（L*=50，24 种子）')
  console.log('--------------------------------------------------------------------------------')
  const sweep = runSpectrumSweep(0.3, 50)
  console.table(
    sweep.map((p) => ({
      种子: p.seedHex,
      目标H: `${p.targetHue}°`,
      'OKYCT wΔH': p.okyct.drift,
      'MCU wΔH': p.googleMcu.drift,
      'culori wΔH': p.culori.drift,
      'OKYCT ΔL*': p.okyct.deltaLStar,
    })),
  )

  console.log('\n✔ 三模型公平评测完成。\n')
}

main()
