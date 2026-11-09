
import React, { useState } from 'react';
import {
  DynamicSchemeColors,
  ResolvedCustomColor,
  auditSchemeContrast,
  SystemColorTokens,
} from '../../color/scheme.ts';
import { CvdType, simulateCvd } from '../../color/benchmark.ts';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Palette,
} from 'lucide-react';
import { useI18n } from '../../i18n/index.tsx'

const EnglishCopy = {
  wcagGuardPassRate: 'WCAG Guard Pass Rate',
  primaryButtonContrast: 'Primary Button Contrast',
  aaaCompliant: 'AAA Compliant',
  aaCompliant: 'AA Compliant',
  apcaLcContrast: 'APCA Lc Contrast',
  activeTokenCount: 'Active Tokens',
  tokenCount: (count: number) => `${count} tokens`,
  extendedCount: (count: number) => `+${count} extended`,
  sandboxTitle: 'Production UI Component Live Sandbox',
  sandboxDescription:
    'Every component renders live from semantic tokens derived by the OKYCT engine and the O(1) algebraic contrast guard.',
  surfaceHierarchyTitle: 'MD3 Five-Level Surface Container Hierarchy',
  actionGroupTitle: 'Core Actions & State Buttons (Primary, Secondary, Tertiary, Semantic)',
  primaryAction: 'Primary Action (Primary)',
  primaryContainerAction: 'Primary Container (Tonal)',
  secondaryAction: 'Secondary Button (Secondary)',
  tertiaryAction: 'Tertiary Accent (Tertiary)',
  outlinedAction: 'Outlined Button (Outlined)',
  errorAction: 'Destructive / Delete (Error)',
  successAction: 'Confirm / Pass (Success)',
  customColorsTitle: 'Custom Extended Semantic Color 4-Tuples',
  customColorsHint: 'Auto-harmonized toward the primary hue + O(1) algebraic contrast guard',
  hueShift: (degrees: number) => `Hue harmony shift ${degrees}°`,
  hueLocked: 'Original hue locked',
  errorAlertTitle: 'Critical System Block',
  errorAlertBody:
    'Gamut shell out-of-bounds detected. Cusp-anchored gamut mapping engaged automatically.',
  warningAlertTitle: 'Dynamic Hue Shift Warning',
  warningAlertBody:
    'Semantic hue harmonization is active for the current primary; warning and extended colors ease toward it.',
  successAlertTitle: 'Contrast Constraints Fully Met',
  successAlertBody:
    'All semantic text and container pairs pass the O(1) closed-form algebraic contrast solve.',
  searchPlaceholder: 'Search chromaticity metrics and tokens...',
  filterMode: 'Filter Mode',
  exportCsv: 'Export Dataset (CSV)',
  columnForegroundBackground: 'Foreground / Background',
  columnToneDelta: 'Tone Delta (ΔT)',
  columnWcagContrast: 'WCAG Contrast',
  columnApca: 'APCA',
  columnStatus: 'Status',
  statusAaa: 'AAA',
  statusAa: 'AA',
  statusFail: 'Fail',
}

const TraditionalCopy: typeof EnglishCopy = {
  wcagGuardPassRate: 'WCAG 守衛達標率',
  primaryButtonContrast: '主按鈕對比度',
  aaaCompliant: 'AAA 合規',
  aaCompliant: 'AA 合規',
  apcaLcContrast: 'APCA Lc 反差',
  activeTokenCount: '活躍 Token 總數',
  tokenCount: (count: number) => `${count} 組`,
  extendedCount: (count: number) => `+${count} 組擴充`,
  sandboxTitle: '生產級 UI 元件即時沙盒',
  sandboxDescription:
    '全部元件皆由目前自研 OKYCT 推導的語意 Token 及 O(1) 代數對比度守衛即時渲染。',
  surfaceHierarchyTitle: 'MD3 五級表面容器階層',
  actionGroupTitle: '核心動作與狀態按鈕群組 (Primary, Secondary, Tertiary, Semantic)',
  primaryAction: '主要操作 (Primary)',
  primaryContainerAction: '主要容器 (Tonal)',
  secondaryAction: '次要按鈕 (Secondary)',
  tertiaryAction: '第三強調 (Tertiary)',
  outlinedAction: '線框按鈕 (Outlined)',
  errorAction: '危險/刪除 (Error)',
  successAction: '確認通過 (Success)',
  customColorsTitle: '自訂擴充語意色四元組',
  customColorsHint: '支援自動向主色和諧偏移 + O(1) 代數對比度守衛',
  hueShift: (degrees: number) => `色相和諧偏移 ${degrees}°`,
  hueLocked: '原色相鎖定',
  errorAlertTitle: '系統關鍵阻斷提示',
  errorAlertBody: '色域外殼越界偵測已觸發，自動啟用 Cusp 尖峰色域折返裁剪演算法。',
  warningAlertTitle: '動態色相偏移預警',
  warningAlertBody: '目前主色調已啟用語意色相和諧，警示與擴充色平滑向主色靠攏。',
  successAlertTitle: '對比度約束完全合規',
  successAlertBody: '全部語意文字與容器配對均通過 O(1) 代數閉式對比度求解。',
  searchPlaceholder: '搜尋色度指標與 Token...',
  filterMode: '篩選模式',
  exportCsv: '匯出資料集 (CSV)',
  columnForegroundBackground: '前景 / 背景',
  columnToneDelta: 'Tone 差 (ΔT)',
  columnWcagContrast: 'WCAG 對比度',
  columnApca: 'APCA',
  columnStatus: '狀態',
  statusAaa: 'AAA',
  statusAa: 'AA',
  statusFail: '未通過',
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

interface SandboxViewProps {
  scheme: DynamicSchemeColors;
  customColors: ResolvedCustomColor[];
  isDark: boolean;
  cvdType: CvdType;
}

export const SandboxView: React.FC<SandboxViewProps> = ({
  scheme,
  customColors,
  isDark,
  cvdType,
}) => {
  const { locale } = useI18n()
  const copy = Copy[locale]
  const [inspectToken, setInspectToken] = useState<{ role: string; hex: string; tone: number } | null>(null);

  // 颜色安全转换 (应用 CVD 滤镜)
  const c = (hex: string) => simulateCvd(hex, cvdType);

  const audits = auditSchemeContrast(scheme);
  const aaPassCount = audits.filter((a) => a.wcagPassAA).length;
  const passRate = Math.round((aaPassCount / audits.length) * 100);
  const totalTokenCount = SystemColorTokens.length + customColors.length * 4;

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6">
      {/* 顶部横幅：实时无障碍指标 */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div
          className="p-3 sm:p-4 rounded-xl border flex items-center justify-between"
          style={{
            backgroundColor: c(scheme.surfaceContainer),
            borderColor: c(scheme.outlineVariant),
            color: c(scheme.onSurface),
          }}
        >
          <div>
            <div className="text-[11px] sm:text-xs uppercase font-medium tracking-wider opacity-70">
              {copy.wcagGuardPassRate}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-0.5">
              {passRate}%
            </div>
          </div>
          <ShieldCheck
            className="w-6 h-6 sm:w-8 sm:h-8 opacity-60 shrink-0"
            style={{ color: c(scheme.primary) }}
          />
        </div>

        <div
          className="p-3 sm:p-4 rounded-xl border flex items-center justify-between"
          style={{
            backgroundColor: c(scheme.surfaceContainer),
            borderColor: c(scheme.outlineVariant),
            color: c(scheme.onSurface),
          }}
        >
          <div>
            <div className="text-[11px] sm:text-xs uppercase font-medium tracking-wider opacity-70">
              {copy.primaryButtonContrast}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-0.5">
              {audits[0]?.wcagRatio.toFixed(1)}:1
            </div>
          </div>
          <div
            className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold rounded font-mono shrink-0"
            style={{
              backgroundColor: c(scheme.primaryContainer),
              color: c(scheme.onPrimaryContainer),
            }}
          >
            {audits[0]?.wcagPassAAA ? copy.aaaCompliant : copy.aaCompliant}
          </div>
        </div>

        <div
          className="p-3 sm:p-4 rounded-xl border flex items-center justify-between"
          style={{
            backgroundColor: c(scheme.surfaceContainer),
            borderColor: c(scheme.outlineVariant),
            color: c(scheme.onSurface),
          }}
        >
          <div>
            <div className="text-[11px] sm:text-xs uppercase font-medium tracking-wider opacity-70">
              {copy.apcaLcContrast}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-0.5">
              {(audits.reduce((acc, a) => acc + a.apcaLc, 0) / audits.length).toFixed(0)}
            </div>
          </div>
          <TrendingUp
            className="w-6 h-6 sm:w-8 sm:h-8 opacity-60 shrink-0"
            style={{ color: c(scheme.tertiary) }}
          />
        </div>

        <div
          className="p-3 sm:p-4 rounded-xl border flex items-center justify-between"
          style={{
            backgroundColor: c(scheme.surfaceContainer),
            borderColor: c(scheme.outlineVariant),
            color: c(scheme.onSurface),
          }}
        >
          <div>
            <div className="text-[11px] sm:text-xs uppercase font-medium tracking-wider opacity-70">
              {copy.activeTokenCount}
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-0.5">
              {copy.tokenCount(totalTokenCount)}
            </div>
          </div>
          <div className="text-[11px] sm:text-xs font-mono opacity-60 shrink-0">
            {copy.extendedCount(customColors.length)}
          </div>
        </div>
      </section>

      {/* 核心工作沙盒面板 */}
      <section
        className="rounded-2xl border p-4 sm:p-6 flex flex-col gap-6 sm:gap-8 shadow-xs transition-colors"
        style={{
          backgroundColor: c(scheme.surface),
          borderColor: c(scheme.outlineVariant),
          color: c(scheme.onSurface),
        }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4"
          style={{ borderColor: c(scheme.outlineVariant) }}
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display tracking-tight">
              {copy.sandboxTitle}
            </h2>
            <p className="text-xs opacity-75 mt-0.5">
              {copy.sandboxDescription}
            </p>
          </div>
          {inspectToken && (
            <div
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 self-start sm:self-auto"
              style={{
                backgroundColor: c(scheme.surfaceContainerHigh),
                borderColor: c(scheme.outline),
              }}
            >
              <span
                className="w-3 h-3 rounded-full border border-black/20"
                style={{ backgroundColor: c(inspectToken.hex) }}
              />
              <span className="font-semibold">{inspectToken.role}</span>
              <span className="opacity-80 tabular-nums">T: {inspectToken.tone}</span>
            </div>
          )}
        </div>

        {/* 1. MD3 五级表面容器层次 (Surface Container Hierarchy) */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-80">
              {copy.surfaceHierarchyTitle}
            </h3>
            <span className="text-[10px] sm:text-[11px] font-mono opacity-60 tabular-nums">
              Tone: {scheme.tones.surfaceContainerLowest} → {scheme.tones.surfaceContainerHighest}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {[
              {
                name: 'Lowest',
                hex: scheme.surfaceContainerLowest,
                tone: scheme.tones.surfaceContainerLowest,
                role: 'surfaceContainerLowest',
              },
              {
                name: 'Low',
                hex: scheme.surfaceContainerLow,
                tone: scheme.tones.surfaceContainerLow,
                role: 'surfaceContainerLow',
              },
              {
                name: 'Normal',
                hex: scheme.surfaceContainer,
                tone: scheme.tones.surfaceContainer,
                role: 'surfaceContainer',
              },
              {
                name: 'High',
                hex: scheme.surfaceContainerHigh,
                tone: scheme.tones.surfaceContainerHigh,
                role: 'surfaceContainerHigh',
              },
              {
                name: 'Highest',
                hex: scheme.surfaceContainerHighest,
                tone: scheme.tones.surfaceContainerHighest,
                role: 'surfaceContainerHighest',
              },
              {
                name: 'Bright/Dim',
                hex: isDark ? scheme.surfaceBright : scheme.surfaceDim,
                tone: isDark ? scheme.tones.surfaceBright : scheme.tones.surfaceDim,
                role: isDark ? 'surfaceBright' : 'surfaceDim',
              },
            ].map((surf) => (
              <div
                key={surf.name}
                onMouseEnter={() =>
                  setInspectToken({ role: surf.role, hex: surf.hex, tone: surf.tone })
                }
                className="p-3.5 rounded-xl border flex flex-col justify-between h-24 cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all"
                style={{
                  backgroundColor: c(surf.hex),
                  borderColor: c(scheme.outlineVariant),
                  color: c(scheme.onSurface),
                }}
              >
                <span className="text-xs font-semibold">{surf.name}</span>
                <div className="font-mono text-[11px] opacity-75 tabular-nums">
                  <div>{surf.hex}</div>
                  <div>T: {surf.tone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. 交互操作按钮群 */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-3">
            {copy.actionGroupTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onMouseEnter={() =>
                setInspectToken({ role: 'primary', hex: scheme.primary, tone: scheme.tones.primary })
              }
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95 shadow-xs"
              style={{
                backgroundColor: c(scheme.primary),
                color: c(scheme.onPrimary),
              }}
            >
              {copy.primaryAction}
            </button>

            <button
              onMouseEnter={() =>
                setInspectToken({
                  role: 'primaryContainer',
                  hex: scheme.primaryContainer,
                  tone: scheme.tones.primaryContainer,
                })
              }
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95"
              style={{
                backgroundColor: c(scheme.primaryContainer),
                color: c(scheme.onPrimaryContainer),
              }}
            >
              {copy.primaryContainerAction}
            </button>

            <button
              onMouseEnter={() =>
                setInspectToken({
                  role: 'secondaryContainer',
                  hex: scheme.secondaryContainer,
                  tone: scheme.tones.secondaryContainer,
                })
              }
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95"
              style={{
                backgroundColor: c(scheme.secondaryContainer),
                color: c(scheme.onSecondaryContainer),
              }}
            >
              {copy.secondaryAction}
            </button>

            <button
              onMouseEnter={() =>
                setInspectToken({
                  role: 'tertiaryContainer',
                  hex: scheme.tertiaryContainer,
                  tone: scheme.tones.tertiaryContainer,
                })
              }
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95"
              style={{
                backgroundColor: c(scheme.tertiaryContainer),
                color: c(scheme.onTertiaryContainer),
              }}
            >
              {copy.tertiaryAction}
            </button>

            <button
              onMouseEnter={() =>
                setInspectToken({ role: 'outline', hex: scheme.outline, tone: scheme.tones.outline })
              }
              className="px-4 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                borderColor: c(scheme.outline),
                color: c(scheme.primary),
              }}
            >
              {copy.outlinedAction}
            </button>

            <button
              onMouseEnter={() =>
                setInspectToken({ role: 'error', hex: scheme.error, tone: scheme.tones.error })
              }
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95"
              style={{
                backgroundColor: c(scheme.error),
                color: c(scheme.onError),
              }}
            >
              {copy.errorAction}
            </button>

            <button
              onMouseEnter={() =>
                setInspectToken({ role: 'success', hex: scheme.success, tone: scheme.tones.success })
              }
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-transform active:scale-95"
              style={{
                backgroundColor: c(scheme.success),
                color: c(scheme.onSuccess),
              }}
            >
              {copy.successAction}
            </button>
          </div>
        </div>

        {/* 3. 自定义扩展语义色四元组实时预览 (Custom Extended Semantic Colors) */}
        {customColors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>{copy.customColorsTitle}</span>
              </h3>
              <span className="text-[11px] font-mono opacity-60">
                {copy.customColorsHint}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {customColors.map((cc) => (
                <div
                  key={cc.id}
                  className="p-3.5 rounded-xl border flex flex-col gap-3"
                  style={{
                    backgroundColor: c(scheme.surfaceContainerLow),
                    borderColor: c(scheme.outlineVariant),
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-xs border border-black/20"
                        style={{ backgroundColor: c(cc.harmonizedHex) }}
                      />
                      <span className="font-mono font-bold">--md-custom-color-{cc.name}</span>
                    </div>
                    <span className="font-mono text-[11px] opacity-75 tabular-nums">
                      {cc.hueShiftDeg > 0 ? copy.hueShift(cc.hueShiftDeg) : copy.hueLocked}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div
                      className="p-2.5 rounded-lg flex flex-col justify-between text-xs shadow-2xs"
                      style={{
                        backgroundColor: c(cc.color),
                        color: c(cc.onColor),
                      }}
                    >
                      <div className="font-bold">{cc.name} / on-{cc.name}</div>
                      <div className="font-mono text-[10px] opacity-85 mt-1 tabular-nums">
                        {cc.color} ({cc.wcagRatioColor}:1)
                      </div>
                    </div>

                    <div
                      className="p-2.5 rounded-lg flex flex-col justify-between text-xs"
                      style={{
                        backgroundColor: c(cc.colorContainer),
                        color: c(cc.onColorContainer),
                      }}
                    >
                      <div className="font-bold">{cc.name}Container</div>
                      <div className="font-mono text-[10px] opacity-85 mt-1 tabular-nums">
                        {cc.colorContainer} ({cc.wcagRatioContainer}:1)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. 语义提示横幅与卡片群 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: c(scheme.errorContainer),
              borderColor: c(scheme.error),
              color: c(scheme.onErrorContainer),
            }}
          >
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold">{copy.errorAlertTitle}</div>
              <div className="text-xs mt-1 opacity-85 leading-relaxed">
                {copy.errorAlertBody}
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: c(scheme.warningContainer),
              borderColor: c(scheme.warning),
              color: c(scheme.onWarningContainer),
            }}
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold">{copy.warningAlertTitle}</div>
              <div className="text-xs mt-1 opacity-85 leading-relaxed">
                {copy.warningAlertBody}
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: c(scheme.successContainer),
              borderColor: c(scheme.success),
              color: c(scheme.onSuccessContainer),
            }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold">{copy.successAlertTitle}</div>
              <div className="text-xs mt-1 opacity-85 leading-relaxed">
                {copy.successAlertBody}
              </div>
            </div>
          </div>
        </div>

        {/* 5. 生产级数据表格与交互控件展示 */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: c(scheme.surfaceContainerLow),
            borderColor: c(scheme.outlineVariant),
          }}
        >
          <div
            className="p-3.5 border-b flex flex-wrap items-center justify-between gap-3"
            style={{ borderColor: c(scheme.outlineVariant) }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
                style={{
                  backgroundColor: c(scheme.surfaceContainerLowest),
                  borderColor: c(scheme.outlineVariant),
                  color: c(scheme.onSurface),
                }}
              >
                <Search className="w-3.5 h-3.5 opacity-60" />
                <input
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  className="bg-transparent border-0 outline-none w-48 text-xs"
                />
              </div>
              <button
                className="px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                style={{
                  backgroundColor: c(scheme.surfaceContainerLowest),
                  borderColor: c(scheme.outlineVariant),
                  color: c(scheme.onSurface),
                }}
              >
                <Filter className="w-3.5 h-3.5 opacity-60" />
                <span>{copy.filterMode}</span>
              </button>
            </div>

            <button
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              style={{
                backgroundColor: c(scheme.primary),
                color: c(scheme.onPrimary),
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{copy.exportCsv}</span>
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[540px]">
              <thead>
                <tr
                  className="border-b font-mono text-[11px] opacity-70"
                  style={{
                    backgroundColor: c(scheme.surfaceContainer),
                    borderColor: c(scheme.outlineVariant),
                  }}
                >
                  <th className="py-2.5 px-3 sm:px-4 font-semibold whitespace-nowrap">{copy.columnForegroundBackground}</th>
                  <th className="py-2.5 px-3 sm:px-4 font-semibold whitespace-nowrap">{copy.columnToneDelta}</th>
                  <th className="py-2.5 px-3 sm:px-4 font-semibold whitespace-nowrap">{copy.columnWcagContrast}</th>
                  <th className="py-2.5 px-3 sm:px-4 font-semibold whitespace-nowrap">{copy.columnApca}</th>
                  <th className="py-2.5 px-3 sm:px-4 font-semibold text-right whitespace-nowrap">{copy.columnStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono" style={{ borderColor: c(scheme.outlineVariant) }}>
                {audits.map((a) => (
                  <tr
                    key={`${a.fgRole}/${a.bgRole}`}
                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    onMouseEnter={() =>
                      setInspectToken({
                        role: a.fgRole,
                        hex: scheme[a.fgRole as keyof DynamicSchemeColors] as string,
                        tone: a.fgTone,
                      })
                    }
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                      {a.fgRole} / {a.bgRole}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 tabular-nums whitespace-nowrap">
                      Δ{Math.abs(a.fgTone - a.bgTone)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold tabular-nums whitespace-nowrap">
                      {a.wcagRatio.toFixed(2)}:1
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 tabular-nums whitespace-nowrap">
                      Lc {a.apcaLc}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-bold"
                        style={{
                          backgroundColor: a.wcagPassAA
                            ? c(scheme.successContainer)
                            : c(scheme.errorContainer),
                          color: a.wcagPassAA
                            ? c(scheme.onSuccessContainer)
                            : c(scheme.onErrorContainer),
                        }}
                      >
                        {a.wcagPassAAA ? copy.statusAaa : a.wcagPassAA ? copy.statusAa : copy.statusFail}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
