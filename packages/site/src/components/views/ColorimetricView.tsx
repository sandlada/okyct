/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  OKYCT,
  findGamutCusp,
  findP3GamutCusp,
  findMaxChromaForTone,
  findMaxP3ChromaForTone,
  isInSrgbGamut,
  isInDisplayP3Gamut,
  okyctToHex,
  okyctToDisplayP3Css,
} from '../../color/math.ts';
import { DynamicSchemeColors } from '../../color/scheme.ts';
import { Crosshair, Activity, Copy as CopyIcon, Check } from 'lucide-react';
import { useI18n } from '../../i18n/index.tsx';

const EnglishCopy = {
  heading: 'Chroma–Tone Cross-Section & Gamut Boundaries',
  subtitle: (hue: string) => `Hue H=${hue}° · sRGB standard gamut vs. Display P3 wide-gamut cusp comparison`,
  inSrgb: 'Inside sRGB gamut',
  inP3: 'Display P3 wide-gamut region',
  outOfP3: 'Clipped beyond P3',
  crossSectionTitle: (hue: string) => `OKYCT (Tone, Chroma) cross-section (Hue: ${hue}°)`,
  axisY: 'Y-axis: Tone [0 – 100]',
  p3GainBand: (gain: number) => `Cyan band: net chroma gain of Display P3 over sRGB (+${gain}%)`,
  axisX: 'X-axis: Chroma [0.0 – 0.36]',
  gamutHeading: 'sRGB vs. Display P3 Wide-Gamut Capacity',
  srgbCusp: 'sRGB standard gamut cusp',
  p3Cusp: 'Display P3 cusp',
  p3CuspTone: (tone: number, gain: number) => `T${tone} (+${gain}% capacity)`,
  cssSyntaxHeading: 'CSS Color 4 Wide-Gamut Syntax',
  copied: 'Copied',
  copyP3: 'Copy P3',
  footerNote: 'The P3 linear matrix extends saturated chroma capacity while locking CIE relative luminance Y and contrast with zero drift.',
}

const TraditionalCopy: typeof EnglishCopy = {
  heading: '色度－明度切面與色域邊界',
  subtitle: (hue: string) => `色相 H=${hue}° · sRGB 標準色域與 Display P3 廣色域尖峰 Cusp 對比`,
  inSrgb: 'sRGB 色域內',
  inP3: 'Display P3 廣色域區',
  outOfP3: '超出 P3 截斷',
  crossSectionTitle: (hue: string) => `OKYCT (Tone, Chroma) 剖面（色相：${hue}°）`,
  axisY: '縱軸：Tone [0 - 100]',
  p3GainBand: (gain: number) => `青色半透明帶：Display P3 相比 sRGB 淨增色度區間 (+${gain}%)`,
  axisX: '橫軸：Chroma [0.0 - 0.36]',
  gamutHeading: 'sRGB 與 Display P3 廣色域容量對標',
  srgbCusp: 'sRGB 標準色域尖峰',
  p3Cusp: 'Display P3 尖峰',
  p3CuspTone: (tone: number, gain: number) => `T${tone} (+${gain}% 容量)`,
  cssSyntaxHeading: 'CSS Color 4 廣色域語法',
  copied: '已複製',
  copyP3: '複製 P3',
  footerNote: 'P3 線性矩陣擴展高飽和色度容量，同時鎖定 CIE 相對亮度 Y 與對比度零漂移。',
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

interface ColorimetricViewProps {
  okyct: OKYCT;
  scheme: DynamicSchemeColors;
  isDark: boolean;
}

export const ColorimetricView: React.FC<ColorimetricViewProps> = ({ okyct, scheme, isDark }) => {
  const { locale } = useI18n();
  const copy = Copy[locale];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{
    c: number;
    t: number;
    inSrgb: boolean;
    inP3: boolean;
    hex: string;
    p3Css: string;
  } | null>(null);
  const [copiedP3, setCopiedP3] = useState(false);

  const srgbCusp = findGamutCusp(okyct.h);
  const p3Cusp = findP3GamutCusp(okyct.h);
  const p3ChromaGainPct = srgbCusp.chroma > 0
    ? Math.round(((p3Cusp.chroma - srgbCusp.chroma) / srgbCusp.chroma) * 100)
    : 0;

  const currentP3Css = okyctToDisplayP3Css(okyct);

  // 绘制 2D (Chroma, Tone) 切面 Canvas (含 sRGB 实线与 Display P3 虚线双色域边界)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const maxChroma = 0.36;
    const padLeft = 45;
    const padBottom = 30;
    const padTop = 15;
    const padRight = 15;

    const plotW = width - padLeft - padRight;
    const plotH = height - padBottom - padTop;

    const toScreenX = (c: number) => padLeft + (c / maxChroma) * plotW;
    const toScreenY = (t: number) => padTop + ((100 - t) / 100) * plotH;

    // 1. 扫描绘制切面网格颜色像素图 (区分 sRGB 内、P3 广色域扩展区、以及色域外)
    const stepT = 2;
    const stepC = 0.008;

    for (let t = 0; t <= 100; t += stepT) {
      const maxSrgbC = findMaxChromaForTone(okyct.h, t);
      const maxP3C = findMaxP3ChromaForTone(okyct.h, t);
      for (let c = 0; c <= maxChroma; c += stepC) {
        const inSrgb = c <= maxSrgbC;
        const inP3 = c <= maxP3C;
        const colorHex = okyctToHex({ h: okyct.h, c, t });

        if (inSrgb) {
          ctx.fillStyle = colorHex;
        } else if (inP3) {
          // P3 扩展色度区：使用半透明网格纹理叠底提示此区域仅在 Display P3 屏幕可完整呈现
          ctx.fillStyle = colorHex;
        } else {
          ctx.fillStyle = isDark ? '#16161e' : '#f1f2f6';
        }

        const x = toScreenX(c);
        const y = toScreenY(t);
        const nextX = toScreenX(c + stepC);
        const nextY = toScreenY(t + stepT);
        ctx.fillRect(x, nextY, Math.ceil(nextX - x), Math.ceil(y - nextY));

        if (!inSrgb && inP3) {
          ctx.fillStyle = isDark ? 'rgba(6, 182, 212, 0.16)' : 'rgba(6, 182, 212, 0.14)';
          ctx.fillRect(x, nextY, Math.ceil(nextX - x), Math.ceil(y - nextY));
        }
      }
    }

    // 2. 绘制 sRGB 色域外壳边界多边形 (实线)
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.lineWidth = 2;
    for (let t = 0; t <= 100; t += 2) {
      const maxC = findMaxChromaForTone(okyct.h, t);
      const x = toScreenX(maxC);
      const y = toScreenY(t);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. 绘制 Display P3 广色域外壳边界多边形 (青色虚线)
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.2;
    for (let t = 0; t <= 100; t += 2) {
      const maxP3C = findMaxP3ChromaForTone(okyct.h, t);
      const x = toScreenX(maxP3C);
      const y = toScreenY(t);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. 绘制 sRGB Cusp (琥珀圆点) 与 Display P3 Cusp (青色菱形/圆点)
    const srgbCuspX = toScreenX(srgbCusp.chroma);
    const srgbCuspY = toScreenY(srgbCusp.tone);
    ctx.beginPath();
    ctx.arc(srgbCuspX, srgbCuspY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const p3CuspX = toScreenX(p3Cusp.chroma);
    const p3CuspY = toScreenY(p3Cusp.tone);
    ctx.beginPath();
    ctx.arc(p3CuspX, p3CuspY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. 绘制网格线与坐标轴标定
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

    for (let t = 0; t <= 100; t += 20) {
      const y = toScreenY(t);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText(`T${t}`, 8, y + 3);
    }

    for (let c = 0; c <= maxChroma + 0.001; c += 0.09) {
      const x = toScreenX(c);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();
      ctx.fillText(c.toFixed(2), x - 10, height - 12);
    }

    // 6. 投影标记当前方案的重点 Token
    const tokensToPlot = [
      { name: 'Primary', tone: scheme.tones.primary, chroma: okyct.c, hex: scheme.primary },
      { name: 'PrimaryContainer', tone: scheme.tones.primaryContainer, chroma: okyct.c * 0.4, hex: scheme.primaryContainer },
      { name: 'Surface', tone: scheme.tones.surface, chroma: 0.015, hex: scheme.surface },
      { name: 'Secondary', tone: scheme.tones.secondary, chroma: okyct.c * 0.5, hex: scheme.secondary },
      { name: 'Error', tone: scheme.tones.error, chroma: 0.18, hex: scheme.error },
    ];

    tokensToPlot.forEach((token) => {
      const px = toScreenX(Math.min(token.chroma, findMaxChromaForTone(okyct.h, token.tone)));
      const py = toScreenY(token.tone);

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = token.hex;
      ctx.fill();
      ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.fillText(token.name, px + 8, py + 3);
    });
  }, [okyct, scheme, isDark, srgbCusp, p3Cusp]);

  // 鼠标与触控悬停切面拾色与坐标换算
  const updateCoordFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const padLeft = 45;
    const padBottom = 30;
    const padTop = 15;
    const padRight = 15;
    const maxChroma = 0.36;
    const plotW = canvas.width - padLeft - padRight;
    const plotH = canvas.height - padBottom - padTop;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const scaledX = mouseX * scaleX;
    const scaledY = mouseY * scaleY;

    const c = Math.max(0, Math.min(maxChroma, ((scaledX - padLeft) / plotW) * maxChroma));
    const t = Math.max(0, Math.min(100, 100 - ((scaledY - padTop) / plotH) * 100));

    const srgbCheck = isInSrgbGamut(okyct.h, c, t);
    const p3Check = isInDisplayP3Gamut(okyct.h, c, t);
    const hex = okyctToHex({ h: okyct.h, c, t });
    const p3Css = okyctToDisplayP3Css({ h: okyct.h, c, t });

    setHoverCoord({
      c: parseFloat(c.toFixed(3)),
      t: Math.round(t),
      inSrgb: srgbCheck.inGamut,
      inP3: p3Check.inGamut,
      hex,
      p3Css,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    updateCoordFromEvent(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      updateCoordFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleCopyP3 = (cssStr: string) => {
    navigator.clipboard.writeText(cssStr);
    setCopiedP3(true);
    setTimeout(() => setCopiedP3(false), 1800);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold font-display tracking-tight">
            {copy.heading}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {copy.subtitle(okyct.h.toFixed(1))}
          </p>
        </div>
        {hoverCoord && (
          <div className="flex flex-wrap items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-mono self-start sm:self-auto">
            <span className="w-3.5 h-3.5 rounded border border-black/10 shrink-0" style={{ backgroundColor: hoverCoord.hex }} />
            <span className="tabular-nums">T:{hoverCoord.t}</span>
            <span className="tabular-nums">C:{hoverCoord.c}</span>
            <span
              className={
                hoverCoord.inSrgb
                  ? 'text-emerald-600 font-semibold'
                  : hoverCoord.inP3
                  ? 'text-cyan-600 dark:text-cyan-400 font-semibold'
                  : 'text-amber-600 font-semibold'
              }
            >
              {hoverCoord.inSrgb ? copy.inSrgb : hoverCoord.inP3 ? copy.inP3 : copy.outOfP3}
            </span>
          </div>
        )}
      </div>

      {/* 2D Canvas 舞台 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 p-3.5 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center">
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">
                {copy.crossSectionTitle(okyct.h.toFixed(1))}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> sRGB Cusp: T{srgbCusp.tone}/C{srgbCusp.chroma.toFixed(2)}
              </span>
              <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> P3 Cusp: T{p3Cusp.tone}/C{p3Cusp.chroma.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-neutral-900 dark:bg-white inline-block" /> sRGB
              </span>
              <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                <span className="w-2.5 h-0.5 border-b-2 border-dashed border-cyan-500 inline-block" /> Display P3
              </span>
            </div>
          </div>

          <div className="w-full flex justify-center relative border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden cursor-crosshair touch-none">
            <canvas
              ref={canvasRef}
              width={640}
              height={380}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverCoord(null)}
              onTouchStart={handleTouchMove}
              onTouchMove={handleTouchMove}
              className="block w-full max-w-full h-auto aspect-[16/9.5]"
            />
          </div>

          <div className="w-full mt-2.5 flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 font-mono">
            <span>{copy.axisY}</span>
            <span>{copy.p3GainBand(p3ChromaGainPct)}</span>
            <span>{copy.axisX}</span>
          </div>
        </div>

        {/* 右侧：双色域尖峰对标与 CSS Color 4 广色域输出 */}
        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">{copy.gamutHeading}</h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-sans font-bold">{copy.srgbCusp}</div>
              <div className="text-sm font-bold mt-1 tabular-nums">C = {srgbCusp.chroma.toFixed(3)}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">Tone = {srgbCusp.tone}</div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60">
              <div className="text-[10px] text-cyan-700 dark:text-cyan-400 font-sans font-bold">{copy.p3Cusp}</div>
              <div className="text-sm font-bold mt-1 tabular-nums">C = {p3Cusp.chroma.toFixed(3)}</div>
              <div className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-0.5 tabular-nums">
                {copy.p3CuspTone(p3Cusp.tone, p3ChromaGainPct)}
              </div>
            </div>
          </div>

          {/* CSS Color Level 4 声明式输出 */}
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-neutral-600 dark:text-neutral-300">{copy.cssSyntaxHeading}</span>
              <button
                onClick={() => handleCopyP3(hoverCoord ? hoverCoord.p3Css : currentP3Css)}
                className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:opacity-85"
              >
                {copiedP3 ? <Check className="w-3 h-3 text-emerald-500" /> : <CopyIcon className="w-3 h-3" />}
                <span>{copiedP3 ? copy.copied : copy.copyP3}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] text-cyan-700 dark:text-cyan-300 break-all">
              {hoverCoord ? hoverCoord.p3Css : currentP3Css}
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {copy.footerNote}
          </div>
        </div>
      </div>
    </div>
  );
};
