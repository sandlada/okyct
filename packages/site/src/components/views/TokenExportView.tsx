
import React, { useState } from 'react';
import { PaletteSet } from '../../color/palettes.ts';
import { DynamicSchemeColors, ResolvedCustomColor } from '../../color/scheme.ts';
import {
  exportCssVariables,
  exportTailwindV4,
  exportW3cDesignTokens,
  exportTypeScriptTokens,
  type CssSchemeMode,
  type TailwindFallbackMode,
} from '../../color/exporter.ts';
import { Copy, Check, Terminal, FileCode, Sliders } from 'lucide-react';
import { useI18n } from '../../i18n/index.tsx'

const EnglishCopy = {
  pageTitle: 'Token matrix & production code export',
  pageDescription:
    'Export bundles every MD3 system token plus the custom semantic color quadruplets.',
  copiedToClipboard: 'Copied to clipboard',
  copyFullCode: 'Copy full code',
  cssClass: 'Classes',
  cssLightDark: 'light-dark()',
  twNoFallback: 'No fallback',
  twFallback: 'With fallback',
}

const TraditionalCopy: typeof EnglishCopy = {
  pageTitle: 'Token 矩陣與生產程式碼匯出',
  pageDescription:
    '匯出內容自動包含全部 MD3 系統 Token 與自訂擴充語意色四元組。',
  copiedToClipboard: '已複製到剪貼簿',
  copyFullCode: '複製整段程式碼',
  cssClass: '類名',
  cssLightDark: 'light-dark()',
  twNoFallback: '無 fallback',
  twFallback: '有 fallback',
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
  const [cssSchemeMode, setCssSchemeMode] = useState<CssSchemeMode>('light-dark');
  const [tailwindFallback, setTailwindFallback] = useState<TailwindFallbackMode>('light-dark');
  const [copiedCode, setCopiedCode] = useState(false);

  const getExportCode = () => {
    switch (activeFormat) {
      case 'css':
        return exportCssVariables(
          lightScheme,
          darkScheme,
          palettes,
          customColorsLight,
          customColorsDark,
          cssSchemeMode
        );
      case 'tailwind':
        return exportTailwindV4(
          lightScheme,
          darkScheme,
          customColorsLight,
          customColorsDark,
          tailwindFallback
        );
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getExportCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-6 sm:gap-8 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 relative">
      {/* 头部标题 */}
      <div>
        <h2 className="text-base sm:text-lg font-bold font-display tracking-tight">
          {copy.pageTitle}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {copy.pageDescription}
        </p>
      </div>

      {/* 生产级多格式代码导出器 */}
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
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
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

        {activeFormat === 'css' && (
          <div className="flex items-center gap-1 p-0.5 w-fit bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
            {([
              ['class', copy.cssClass],
              ['light-dark', copy.cssLightDark],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCssSchemeMode(id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  cssSchemeMode === id
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {activeFormat === 'tailwind' && (
          <div className="flex items-center gap-1 p-0.5 w-fit bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
            {([
              ['none', copy.twNoFallback],
              ['light-dark', copy.twFallback],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTailwindFallback(id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  tailwindFallback === id
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* 代码显示区 */}
        <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100 p-4 font-mono text-xs max-h-96 overflow-y-auto">
          <pre className="whitespace-pre">{getExportCode()}</pre>
        </div>
      </section>
    </div>
  );
};
