/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PaletteSet, STANDARD_TONES } from '../../color/palettes.ts';
import { DynamicSchemeColors, ResolvedCustomColor } from '../../color/scheme.ts';
import {
  exportCssVariables,
  exportTailwindV4,
  exportW3cDesignTokens,
  exportTypeScriptTokens,
} from '../../color/exporter.ts';
import { Copy, Check, Terminal, FileCode, Sliders } from 'lucide-react';
import { useI18n } from '../../i18n/index.tsx'

const EnglishCopy = {
  pageTitle: 'Token matrix & production code export',
  pageDescription:
    'Click any ramp swatch to copy its HEX code. The export bundles every MD3 system token plus the custom semantic color quadruplets.',
  paletteSectionTitle: 'Full 13-step tonal palette ramps (Tone 0 → 100)',
  copiedToast: (label: string) => `Copied ${label}`,
  copiedToClipboard: 'Copied to clipboard',
  copyFullCode: 'Copy full code',
  paletteNames: {
    primary: 'Primary (Main palette)',
    secondary: 'Secondary (Secondary palette)',
    tertiary: 'Tertiary (Tertiary accent)',
    neutral: 'Neutral (Warm-neutral palette)',
    neutralVariant: 'Neutral Variant (Variant neutral palette)',
    error: 'Error (Semantic error palette)',
    warning: 'Warning (Semantic warning palette)',
    success: 'Success (Semantic success palette)',
    info: 'Info (Semantic info palette)',
  },
}

const TraditionalCopy: typeof EnglishCopy = {
  pageTitle: 'Token 矩陣與生產程式碼匯出',
  pageDescription:
    '點擊任意色階區塊即可一鍵複製 Hex 碼，匯出內容自動包含全部 MD3 系統 Token 與自訂擴充語意色四元組。',
  paletteSectionTitle: '全套 13 級 Tonal Palettes 物理色階（Tone 0 → 100）',
  copiedToast: (label: string) => `已複製 ${label}`,
  copiedToClipboard: '已複製到剪貼簿',
  copyFullCode: '複製整段程式碼',
  paletteNames: {
    primary: 'Primary（主要調色盤）',
    secondary: 'Secondary（次要調色盤）',
    tertiary: 'Tertiary（第三強調盤）',
    neutral: 'Neutral（冷暖中性盤）',
    neutralVariant: 'Neutral Variant（變體中性盤）',
    error: 'Error（語意錯誤盤）',
    warning: 'Warning（語意警告盤）',
    success: 'Success（語意成功盤）',
    info: 'Info（語意資訊盤）',
  },
}

const CopyByLocale = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

interface TokenExportViewProps {
  palettes: PaletteSet;
  lightScheme: DynamicSchemeColors;
  darkScheme: DynamicSchemeColors;
  customColorsLight: ResolvedCustomColor[];
  customColorsDark: ResolvedCustomColor[];
}

type ExportFormat = 'css' | 'tailwind' | 'w3c' | 'ts';

export const TokenExportView: React.FC<TokenExportViewProps> = ({
  palettes,
  lightScheme,
  darkScheme,
  customColorsLight,
  customColorsDark,
}) => {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]

  const [activeFormat, setActiveFormat] = useState<ExportFormat>('css');
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const paletteKeys: Array<{ key: keyof PaletteSet }> = [
    { key: 'primary' },
    { key: 'secondary' },
    { key: 'tertiary' },
    { key: 'neutral' },
    { key: 'neutralVariant' },
    { key: 'error' },
    { key: 'warning' },
    { key: 'success' },
    { key: 'info' },
  ];

  const getExportCode = () => {
    switch (activeFormat) {
      case 'css':
        return exportCssVariables(
          lightScheme,
          darkScheme,
          palettes,
          customColorsLight,
          customColorsDark
        );
      case 'tailwind':
        return exportTailwindV4(lightScheme, darkScheme, customColorsLight);
      case 'w3c':
        return exportW3cDesignTokens(
          lightScheme,
          darkScheme,
          customColorsLight,
          customColorsDark
        );
      case 'ts':
        return exportTypeScriptTokens(
          lightScheme,
          darkScheme,
          customColorsLight,
          customColorsDark
        );
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(copy.copiedToast(label));
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getExportCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-6 sm:gap-8 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 relative">
      {/* 复制 Toast 提示 */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 头部标题 */}
      <div>
        <h2 className="text-base sm:text-lg font-bold font-display tracking-tight">
          {copy.pageTitle}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {copy.pageDescription}
        </p>
      </div>

      {/* 1. 13级 Tonal Palettes 完整色阶全景 */}
      <section className="p-4 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 sm:gap-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {copy.paletteSectionTitle}
        </h3>

        <div className="flex flex-col gap-3">
          {paletteKeys.map((p) => (
            <div key={p.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300 text-[11px] sm:text-xs">
                  {copy.paletteNames[p.key]}
                </span>
                <span className="font-mono text-[10px] text-neutral-400 tabular-nums">
                  {palettes[p.key].hue.toFixed(1)}°
                </span>
              </div>

              <div className="overflow-x-auto w-full">
                <div className="grid grid-cols-13 h-8 sm:h-9 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 min-w-[340px]">
                  {STANDARD_TONES.map((t) => {
                    const hex = palettes[p.key].tone(t);
                    return (
                      <button
                        key={t}
                        onClick={() => copyToClipboard(hex, `${copy.paletteNames[p.key]} T${t} (${hex})`)}
                        className="group relative flex flex-col items-center justify-center text-[10px] font-mono transition-transform hover:scale-110 hover:z-10 min-w-[24px]"
                        style={{
                          backgroundColor: hex,
                          color: t > 55 ? '#000000' : '#ffffff',
                        }}
                        title={`T${t}: ${hex}`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[9px] tabular-nums">
                          {t}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 生产级多格式代码导出器 */}
      <section className="p-4 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
            {[
              { id: 'css', label: 'CSS Variables', icon: FileCode },
              { id: 'tailwind', label: 'Tailwind v4', icon: Terminal },
              { id: 'w3c', label: 'W3C Tokens', icon: Sliders },
              { id: 'ts', label: 'TypeScript', icon: FileCode },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setActiveFormat(fmt.id as ExportFormat)}
                className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-colors ${
                  activeFormat === fmt.id
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <fmt.icon className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">{fmt.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shrink-0"
          >
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedCode ? copy.copiedToClipboard : copy.copyFullCode}</span>
          </button>
        </div>

        {/* 代码显示区 */}
        <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100 p-4 font-mono text-xs max-h-96 overflow-y-auto">
          <pre className="whitespace-pre">{getExportCode()}</pre>
        </div>
      </section>
    </div>
  );
};
