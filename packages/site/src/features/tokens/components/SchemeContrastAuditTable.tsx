/**
 * 语义角色前景/背景 WCAG · APCA 审计表（原 Components 沙盒）
 */

import { useI18n } from '../../../i18n/index.tsx'
import { useAppSelector } from '../../../app/store.ts'
import { selectContrastAudits } from '../selectors.ts'

const EnglishCopy = {
  sectionTitle: 'Contrast audit (foreground on background)',
  sectionHint: 'O(1) algebraic solve · pairs from auditSchemeContrast',
  columnForegroundBackground: 'Foreground / Background',
  columnToneDelta: 'Tone delta (ΔT)',
  columnWcagContrast: 'WCAG contrast',
  columnApca: 'APCA',
  columnStatus: 'Status',
  statusAaa: 'AAA',
  statusAa: 'AA',
  statusFail: 'Fail',
}

const TraditionalCopy: typeof EnglishCopy = {
  sectionTitle: '对比度审计（字压在底上）',
  sectionHint: 'O(1) 代数求解 · auditSchemeContrast 角色对',
  columnForegroundBackground: '前景 / 背景',
  columnToneDelta: 'Tone 差 (ΔT)',
  columnWcagContrast: 'WCAG 对比度',
  columnApca: 'APCA',
  columnStatus: '状态',
  statusAaa: 'AAA',
  statusAa: 'AA',
  statusFail: '未通过',
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

export function SchemeContrastAuditTable() {
  const { locale } = useI18n()
  const copy = Copy[locale]
  const audits = useAppSelector(selectContrastAudits)

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="px-3.5 sm:px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
          {copy.sectionTitle}
        </h3>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{copy.sectionHint}</p>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs min-w-[540px]">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800 font-mono text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950/80">
              <th className="py-2.5 px-3 sm:px-4 font-semibold whitespace-nowrap">
                {copy.columnForegroundBackground}
              </th>
              <th className="py-2.5 px-3 sm:px-4 font-semibold whitespace-nowrap">{copy.columnToneDelta}</th>
              <th className="py-2.5 px-3 sm:px-4 font-semibold whitespace-nowrap">{copy.columnWcagContrast}</th>
              <th className="py-2.5 px-3 sm:px-4 font-semibold whitespace-nowrap">{copy.columnApca}</th>
              <th className="py-2.5 px-3 sm:px-4 font-semibold text-right whitespace-nowrap">{copy.columnStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
            {audits.map((a) => (
              <tr
                key={`${a.fgRole}/${a.bgRole}`}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                  {a.fgRole} / {a.bgRole}
                </td>
                <td className="py-2.5 sm:py-3 px-3 sm:px-4 tabular-nums text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                  Δ{Math.abs(a.fgTone - a.bgTone)}
                </td>
                <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold tabular-nums text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                  {a.wcagRatio.toFixed(2)}:1
                </td>
                <td className="py-2.5 sm:py-3 px-3 sm:px-4 tabular-nums text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                  Lc {a.apcaLc}
                </td>
                <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                      a.wcagPassAA
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {a.wcagPassAAA ? copy.statusAaa : a.wcagPassAA ? copy.statusAa : copy.statusFail}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
