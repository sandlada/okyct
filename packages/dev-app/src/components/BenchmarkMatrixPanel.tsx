/**
 * 协议 v2 公平评测矩阵（与 Studio 落地页指标一致）
 */

import { buildBenchmarkMatrix, type BenchmarkMatrixRowId } from '@sandlada/benchmark'
import type { ModelComparisonResult } from '@sandlada/benchmark'

const RowMeta: Record<
  BenchmarkMatrixRowId,
  { title: string; desc: string; criteria: readonly string[] }
> = {
  toneDelta: {
    title: '明度准确度',
    desc: '与共用 L* 目标最大偏差',
    criteria: [
      '共用 CIE L* 色阶：10、20、…、95（协议 v2）。',
      '以 p95 |实测 L* − 目标| 排名；越小越好。',
      'OKYCT/culori：共用最近邻 sRGB 量化；MCU：原生 8-bit ARGB。',
    ],
  },
  meanDrift: {
    title: '平均色相漂移',
    desc: '10 级色阶平均值',
    criteria: [
      '相对种子色的 OKLab Δh，权重 c/(c+0.1)。',
      '各级色阶算术平均；近中性种子（CIELAB C* < 2）不参与色相排名。',
      '加权漂移越小越好。',
    ],
  },
  maxDrift: {
    title: '最大色相漂移',
    desc: 'OKLab 加权漂移 p95',
    criteria: [
      '与平均漂移相同的 OKLab 加权公式。',
      '取 10 级色阶漂移的 95 分位。',
      'p95 越小越好。',
    ],
  },
  semanticContrast: {
    title: '语义角色 AA',
    desc: '浅/深 MD3 字底角色对（各 11 对）',
    criteria: [
      '共用 MD3 角色 Tone 契约；culori 使用基准提供的 token 表。',
      '输出 hex 上字压底的 WCAG 2.1 对比度 ≥ 4.5:1（分浅/深）。',
      '仅作门槛：统计通过对数，不参与色相排名。',
    ],
  },
  solveTime: {
    title: '求解耗时',
    desc: '每 10 级色阶',
    criteria: [
      '当前种子下生成一整条 L* 色阶的中位墙钟时间。',
      '3 次预热 + 20 次计时样本。',
      '中位毫秒越小越好。',
    ],
  },
}

export interface BenchmarkMatrixPanelProps {
  readonly summaries: readonly ModelComparisonResult[]
}

export function BenchmarkMatrixPanel({ summaries }: BenchmarkMatrixPanelProps) {
  const matrix = buildBenchmarkMatrix(summaries)

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs font-mono">
        <thead>
          <tr className="border-b border-neutral-800 text-neutral-400">
            <th className="w-[28%] py-2.5 px-3 align-bottom text-[11px]">评测项</th>
            <th className="py-2.5 px-3 align-bottom text-[11px]">条件</th>
            {matrix.columns.map((col) => (
              <th key={col.id} className="py-2.5 px-3 align-bottom">
                <span className="block text-[11px] font-bold text-white">{col.name}</span>
                <span className="mt-0.5 block text-[10px] font-normal text-neutral-500">{col.sub}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => {
            const meta = RowMeta[row.id]
            return (
              <tr key={row.id} className="border-b border-neutral-800/60 last:border-b-0">
                <th scope="row" className="py-3 px-3 align-top font-sans">
                  <span className="block text-[12px] font-bold text-white">{meta.title}</span>
                  <span className="mt-0.5 block text-[10px] font-normal text-neutral-500">{meta.desc}</span>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-3.5 text-[9px] leading-snug text-neutral-500">
                    {meta.criteria.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </th>
                <td className="py-3 px-3 align-top text-[10px] text-neutral-500 whitespace-nowrap">{row.cond}</td>
                {row.cells.map((cell, index) => (
                  <td
                    key={`${row.id}-${matrix.columns[index].id}`}
                    className={`py-3 px-3 align-top tabular-nums text-[11px] ${
                      index === row.bestIndex ? 'font-bold text-emerald-400' : 'text-neutral-300'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
