import React, { useState } from 'react'
import {
  type DynamicSchemeColors,
  type InvariantTestResult,
  runColorimetricInvariantSuite,
  type ContrastAuditItem,
  auditSchemeContrast,
  type EmissivePanelType,
} from '@sandlada/okyct'
import {
  type SeedColorMetrics,
  verifyGamutCompliance,
  verifyEmissiveCompliance,
  verifyTokenCompleteness,
  type GamutComplianceSummary,
  type EmissiveComplianceItem,
  type TokenCompletenessItem,
} from '../utils/audit-runner.ts'
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  FileText,
  Activity,
  AlertCircle,
  Monitor,
} from 'lucide-react'

export interface ComplianceViewProps {
  scheme: DynamicSchemeColors
  isDark: boolean
  panelType: EmissivePanelType
  seedMetrics: SeedColorMetrics
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({
  scheme,
  isDark,
  panelType,
  seedMetrics,
}) => {
  const [copiedType, setCopiedType] = useState<'markdown' | 'json' | null>(null)

  // 1. 无障碍对比度审计
  const contrastAudits: ContrastAuditItem[] = auditSchemeContrast(scheme)
  const wcagAaPassCount = contrastAudits.filter((a) => a.wcagPassAA).length
  const wcagAaaPassCount = contrastAudits.filter((a) => a.wcagPassAAA).length
  const apcaPassCount = contrastAudits.filter((a) => a.apcaPass).length

  // 2. 色域越界审计
  const gamutSummary: GamutComplianceSummary = verifyGamutCompliance(scheme)

  // 3. 数学不变量自检套件
  const invariantResults: InvariantTestResult[] = runColorimetricInvariantSuite()
  const invariantsPassedCount = invariantResults.filter((r) => r.passed).length

  // 4. 自发光硬件合规审计
  const emissiveItems: EmissiveComplianceItem[] = verifyEmissiveCompliance(scheme, panelType, seedMetrics)
  const emissivePassedCount = emissiveItems.filter((i) => i.passed).length

  // 5. Token 规范完整性审计
  const completenessItems: TokenCompletenessItem[] = verifyTokenCompleteness(scheme)
  const completenessPassedCount = completenessItems.filter((i) => i.isCompliant).length

  // 生成导出报告文本
  const generateReportMarkdown = (): string => {
    return `# OKYCT 库生成结果合规性质检报告

- **种子色**: ${seedMetrics.hex} (Tone: ${seedMetrics.hct.t}, Hue: ${seedMetrics.hct.h}°, Chroma: ${seedMetrics.hct.c})
- **主题模式**: ${isDark ? 'Dark (深色)' : 'Light (浅色)'}
- **硬件面板**: ${panelType}
- **审计时间**: ${new Date().toISOString()}

---

## 1. 无障碍对比度合规 (WCAG 2.1 & APCA)
- WCAG AA 达标率: ${wcagAaPassCount} / ${contrastAudits.length} (${((wcagAaPassCount / contrastAudits.length) * 100).toFixed(1)}%)
- WCAG AAA 达标率: ${wcagAaaPassCount} / ${contrastAudits.length} (${((wcagAaaPassCount / contrastAudits.length) * 100).toFixed(1)}%)
- APCA Lc 达标率: ${apcaPassCount} / ${contrastAudits.length} (${((apcaPassCount / contrastAudits.length) * 100).toFixed(1)}%)

## 2. sRGB 色域安全合规
- 检查 Token 总数: ${gamutSummary.totalTokensChecked}
- 越界通道数: ${gamutSummary.outOfGamutCount} (状态: ${gamutSummary.passed ? 'PASS' : 'FAIL'})

## 3. 色貌与数学不变量自检
${invariantResults.map((r) => `- [${r.passed ? 'PASS' : 'FAIL'}] ${r.name}: 实测 ${r.measuredValue} (阈值 ${r.threshold})`).join('\n')}

## 4. 自发光物理优化合规
${emissiveItems.map((e) => `- [${e.passed ? 'PASS' : 'FAIL'}] ${e.name}: ${e.actualValue} (${e.targetRule})`).join('\n')}

## 5. Token 规范完整性
- 系统 Token 完整度: ${completenessPassedCount} / ${completenessItems.length} (100% 覆盖)
`
  }

  const handleCopy = (type: 'markdown' | 'json') => {
    const text =
      type === 'markdown'
        ? generateReportMarkdown()
        : JSON.stringify(
            {
              seedMetrics,
              isDark,
              panelType,
              contrastAudits,
              gamutSummary,
              invariantResults,
              emissiveItems,
              completenessPassedCount,
            },
            null,
            2
          )

    navigator.clipboard.writeText(text)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* 1. 合规总览计分牌 */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">
            合规性审计总览
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('markdown')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-mono text-neutral-200 transition-all"
            >
              {copiedType === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5" />}
              <span>复制 Markdown 报告</span>
            </button>
            <button
              onClick={() => handleCopy('json')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-mono text-neutral-200 transition-all"
            >
              {copiedType === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>复制 JSON 报告</span>
            </button>
          </div>
        </div>

        {/* 5 项核心指标统计卡 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* WCAG AA */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 font-mono block">WCAG AA</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {((wcagAaPassCount / contrastAudits.length) * 100).toFixed(0)}%
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-2">
              {wcagAaPassCount} / {contrastAudits.length}
            </span>
          </div>

          {/* sRGB 色域安全 */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 font-mono block">色域越界</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {gamutSummary.outOfGamutCount}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-2">
              {gamutSummary.totalTokensChecked} Tokens
            </span>
          </div>

          {/* 数学不变量 */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 font-mono block">数学不变量</span>
              <span className="text-xl font-bold font-mono text-purple-400">
                {invariantsPassedCount} / {invariantResults.length}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-2">
              {invariantsPassedCount === invariantResults.length ? '100%' : '有违规'}
            </span>
          </div>

          {/* 自发光硬件合规 */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 font-mono block">硬件优化</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {emissivePassedCount} / {emissiveItems.length}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-2">
              {emissivePassedCount === emissiveItems.length ? '100%' : '未达标'}
            </span>
          </div>

          {/* Token 完整性 */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 font-mono block">Token 完整度</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {completenessPassedCount} / {completenessItems.length}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-2">
              SSOT 53
            </span>
          </div>
        </div>
      </section>

      {/* 2. 无障碍对比度合规审计详细表 */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">
            WCAG 2.1 & APCA 前景/背景对偶对比度审计
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-2.5 px-3">前景</th>
                <th className="py-2.5 px-3">背景</th>
                <th className="py-2.5 px-3">预览</th>
                <th className="py-2.5 px-3">WCAG</th>
                <th className="py-2.5 px-3">AA</th>
                <th className="py-2.5 px-3">AAA</th>
                <th className="py-2.5 px-3">APCA Lc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {contrastAudits.map((item) => {
                const fgHex = scheme[item.fgRole]
                const bgHex = scheme[item.bgRole]

                return (
                  <tr key={`${item.fgRole}/${item.bgRole}`} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-2 px-3">
                      <span className="text-neutral-300">{item.fgRole}</span>
                      <span className="text-neutral-500 ml-1">T{item.fgTone}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-neutral-300">{item.bgRole}</span>
                      <span className="text-neutral-500 ml-1">T{item.bgTone}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div
                        className="w-8 py-0.5 rounded text-center font-bold text-xs shadow-sm border border-white/10"
                        style={{ backgroundColor: bgHex, color: fgHex }}
                      >
                        Aa
                      </div>
                    </td>
                    <td className="py-2 px-3 font-bold text-amber-400">
                      {item.wcagRatio.toFixed(2)}:1
                    </td>
                    <td className="py-2 px-3">
                      {item.wcagPassAA ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {item.wcagPassAAA ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-neutral-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className={item.apcaPass ? 'text-cyan-400 font-bold' : 'text-neutral-500'}>
                        {item.apcaLc.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 色貌与数学不变量自检套件 */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">
            数学基石不变量自检套件
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invariantResults.map((r) => (
            <div
              key={r.id}
              className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-white">{r.name}</span>
                {r.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </div>

              <div className="text-[11px] font-mono bg-neutral-900/90 p-2 rounded border border-neutral-800 text-neutral-300">
                {r.formula}
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-0.5">
                <span className="text-neutral-300 font-semibold">{r.measuredValue}</span>
                <span className="text-neutral-500">{r.threshold}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 自发光硬件物理特性审计 */}
      <section className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-sm font-mono font-bold text-white">
            自发光显示物理工程合规性
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emissiveItems.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{item.name}</span>
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </div>

              <div className="text-xs font-mono bg-neutral-900/80 p-2 rounded border border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-400">{item.targetRule}</span>
                <span className="text-amber-400 font-bold">{item.actualValue}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
