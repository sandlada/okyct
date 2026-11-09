/**
 * 协议 v2 三模型公平评测矩阵（Studio + 落地页共用）
 */

import { useI18n } from '../../../i18n/index.tsx'
import type { BenchmarkMatrix } from '../matrix.ts'

export interface BenchmarkFairMatrixTableProps {
  readonly matrix: BenchmarkMatrix
}

export function BenchmarkFairMatrixTable({ matrix }: BenchmarkFairMatrixTableProps) {
  const { t } = useI18n()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th
              scope="col"
              className="w-[26%] min-w-[220px] pb-3 pr-4 align-bottom text-[13px] font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {t('benchmarks.column.benchmark')}
            </th>
            <th
              scope="col"
              className="min-w-[170px] pb-3 pr-4 align-bottom text-[13px] font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {t('benchmarks.column.condition')}
            </th>
            {matrix.columns.map((column) => (
              <th key={column.id} scope="col" className="min-w-[110px] pb-3 pr-4 align-bottom">
                <span className="block text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  {column.name}
                </span>
                <span className="mt-0.5 block text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
                  {column.sub}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr
              key={row.labelKey}
              className="border-b border-neutral-200/80 last:border-b-0 dark:border-neutral-800"
            >
              <th scope="row" className="py-4 pr-4 align-top">
                <span className="block text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  {t(row.labelKey)}
                </span>
                <span className="mt-0.5 block text-[11px] font-normal leading-relaxed text-neutral-400 dark:text-neutral-500">
                  {t(row.descKey)}
                </span>
                {row.criteriaKeys.length > 0 ? (
                  <ul className="mt-2 max-w-[min(100%,280px)] list-disc space-y-0.5 pl-3.5 text-[10px] font-normal leading-snug text-neutral-400 dark:text-neutral-500">
                    {row.criteriaKeys.map((key) => (
                      <li key={key}>{t(key)}</li>
                    ))}
                  </ul>
                ) : null}
              </th>
              <td className="whitespace-nowrap py-4 pr-4 align-top text-[12px] text-neutral-500 dark:text-neutral-400">
                {t(row.condKey)}
              </td>
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.labelKey}-${matrix.columns[index].id}`}
                  className={`whitespace-nowrap py-4 pr-4 align-top tabular-nums text-[13px] ${
                    index === row.bestIndex
                      ? 'font-bold text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
