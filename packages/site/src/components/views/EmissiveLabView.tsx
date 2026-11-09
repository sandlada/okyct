
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PaletteSet } from '../../color/palettes.ts';
import { DynamicSchemeColors, buildDynamicScheme } from '../../color/scheme.ts';
import {
  EmissivePanelType,
  EMISSIVE_PANEL_SPECS,
  analyzeEmissiveSchemeMetrics,
  computeColorEmissiveTelemetry,
  SubpixelGeometry,
} from '../../color/emissive.ts';
import { hexToRgb } from '../../color/math.ts';
import {
  Cpu,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Eye,
  Activity,
  Gauge,
  BatteryCharging,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../../i18n/index.tsx';

const EnglishCopy = {
  heading: 'Emissive Panel Physics Simulation & Power Telemetry',
  subtitle:
    'OLED true-black cutoff · AMOLED anti-smear pre-charge (T=4) · MicroOLED XR glare suppression · Spectral subpixel power analysis',
  switchToDark: 'Switch to dark mode to see emissive power savings',
  hardwareMatrixHeading:
    'Physical power and longevity across four display hardware types (click a card to switch the global panel mode)',
  burnInGuard: 'Blue-light burn-in guard (Burn-in Guard)',
  antiFringing: 'PenTile color fringing & XR glare suppression',
  panels: {
    'standard-lcd': {
      shortName: 'LCD reference',
      badge: 'Global backlight',
      description:
        'Renders color by deflecting liquid crystal molecules through a constant backlight; power is nearly independent of picture color and brightness, with no subpixel cutoff and no burn-in.',
    },
    'oled-true-black': {
      shortName: 'OLED true black',
      badge: 'T=0 zero-power cutoff',
      description:
        'Drives the base background to pure black #000000 (T=0) so the organic light-emitting diodes shut off completely, maximizing pixel-off ratio and static battery life — but waking from T=0 to low gray levels still carries an 18ms capacitive-charge black smear.',
    },
    'amoled-anti-smear': {
      shortName: 'AMOLED anti-smear',
      badge: 'T=4 pre-bias emission',
      description:
        'Tuned for 120Hz mobile high-refresh panels: the darkest surface is anchored at the subpixel emission potential T=4 (#0B0B0E) to keep a faint conduction, eliminating scrolling jelly black smear and purple fringing while suppressing PenTile color fringing.',
    },
    'micro-oled-xr': {
      shortName: 'MicroOLED XR',
      badge: 'Anti-halation + ABL resistant',
      description:
        'Built for XR headsets and silicon microdisplays: the dark base is raised to T=8 velvet gray and peak white is softly capped at T=92, removing Pancake lens internal-reflection halation and preventing the silicon driver backplane ABL from dropping out.',
    },
  },
  surfaceToneLadder: (lowest: number, highest: number) =>
    `Dark surface Tone ladder (T${lowest} → T${highest}):`,
  estimatedTotalPower: 'Estimated full-screen power',
  riseResponse120: '120Hz rise response',
  blueBurnInStress: 'Blue-light burn-in stress',
  pixelOffRatio: 'Pixel-off ratio',
  smearTitle: '120Hz black smear simulation',
  smearSubtitle: 'Left: OLED true-black cutoff (T=0) vs. right: AMOLED pre-charge bias (T=4)',
  pauseFrames: 'Pause frames',
  resumeScroll: 'Resume scroll',
  scrollSlow: 'Slow scroll (2px/f)',
  scrollStandard: 'Standard scroll (5px/f)',
  scrollFast: 'Fast scroll (9px/f)',
  oledSmearBadge: 'OLED T=0: 18.5ms lag',
  oledSmearBody: 'Parasitic capacitance dead zone; scrolling drags a violet-black smear behind it',
  amoledSmearBadge: 'AMOLED T=4: 1.6ms fast step',
  amoledSmearBody: 'Sub-threshold pre-charge removes high-refresh jelly smear',
  subpixelTitle: 'Subpixel micro-layout view',
  subpixelSubtitle: (hex: string) =>
    `Micro subpixel lighting pattern along the Primary (${hex}) and Surface edge`,
  microOledSilicon: 'MicroOLED silicon',
  primaryBreakdown: (hex: string) => `Current Primary (${hex}) subpixel power breakdown`,
  canvasOledLabel: 'OLED T=0 cutoff (18.5ms rise smear)',
  canvasAmoledLabel: 'AMOLED T=4 pre-charge (1.6ms, zero smear)',
}

const TraditionalCopy: typeof EnglishCopy = {
  heading: '自發光面板物理模擬與功耗遙測',
  subtitle:
    'OLED 純黑斷電 · AMOLED 防拖影微起輝 (T=4) · MicroOLED XR 眩光抑制 · 光譜子像素功耗分析',
  switchToDark: '切換至深色模式體驗自發光省電',
  hardwareMatrixHeading: '四類顯示硬體物理功耗與壽命同屏對比（點擊卡片直接切換全域面板模式）',
  burnInGuard: '藍光防烙印壽命守衛 (Burn-in Guard)',
  antiFringing: 'PenTile 彩邊與 XR 眩光抑制',
  panels: {
    'standard-lcd': {
      shortName: 'LCD 標準參照',
      badge: '全域背光',
      description:
        '依靠恆定背光層透過液晶分子偏轉顯色，功耗幾乎與畫面顏色、明暗無關，無子像素斷電與烙印現象。',
    },
    'oled-true-black': {
      shortName: 'OLED 純黑省電',
      badge: 'T=0 零功耗關斷',
      description:
        '將底層背景壓至純黑 #000000 (T=0) 使有機發光二極體完全斷電，最大化像素關斷率與靜態續航，但從 T=0 喚醒至低灰階仍有 18ms 電容充電黑拖影。',
    },
    'amoled-anti-smear': {
      shortName: 'AMOLED 防拖影',
      badge: 'T=4 預偏壓起輝',
      description:
        '專為 120Hz 行動裝置高刷新率面板調校：將最暗表面錨定在子像素起輝電位 T=4 (#0B0B0E)，保持微弱導通，徹底消除捲動果凍黑拖影與紫邊，並抑制 PenTile 彩邊。',
    },
    'micro-oled-xr': {
      shortName: 'MicroOLED XR',
      badge: '防光暈 + 抗 ABL',
      description:
        '面向 XR 頭戴裝置與矽基微顯示：將暗底抬升至 T=8 絲絨灰並將峰值白光柔和收斂至 T=92，消除 Pancake 透鏡內反射光暈 (Halation) 並防止觸發矽基驅動背板 ABL 驟暗。',
    },
  },
  surfaceToneLadder: (lowest: number, highest: number) =>
    `深色表面 Tone 階梯 (T${lowest} → T${highest}):`,
  estimatedTotalPower: '預估整屏功耗',
  riseResponse120: '120Hz 起輝響應',
  blueBurnInStress: '藍光烙印應力',
  pixelOffRatio: '斷電像素佔比',
  smearTitle: '120Hz 黑拖影模擬',
  smearSubtitle: '左側 OLED 純黑截止 (T=0) vs 右側 AMOLED 微起輝偏壓 (T=4)',
  pauseFrames: '暫停影格',
  resumeScroll: '繼續捲動',
  scrollSlow: '慢速滑動 (2px/f)',
  scrollStandard: '標準滑動 (5px/f)',
  scrollFast: '急速滑動 (9px/f)',
  oledSmearBadge: 'OLED T=0: 18.5ms 延遲',
  oledSmearBody: '寄生電容死區，滑動伴隨紫黑拖影',
  amoledSmearBadge: 'AMOLED T=4: 1.6ms 快速階躍',
  amoledSmearBody: '次臨界預起輝，消除高刷新率果凍拖影',
  subpixelTitle: '子像素微觀排列檢視',
  subpixelSubtitle: (hex: string) => `Primary (${hex}) 與 Surface 邊緣微觀子像素點亮形態`,
  microOledSilicon: 'MicroOLED 矽基',
  primaryBreakdown: (hex: string) => `目前 Primary (${hex}) 子像素功耗拆解`,
  canvasOledLabel: 'OLED T=0 斷電 (18.5ms 起輝拖影)',
  canvasAmoledLabel: 'AMOLED T=4 預起輝 (1.6ms 零拖影)',
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

interface EmissiveLabViewProps {
  palettes: PaletteSet;
  scheme: DynamicSchemeColors;
  contrastLevel: number;
  emissiveProfile: EmissivePanelType;
  onEmissiveProfileChange: (p: EmissivePanelType) => void;
  burnInGuard: boolean;
  onBurnInGuardChange: (val: boolean) => void;
  antiFringing: boolean;
  onAntiFringingChange: (val: boolean) => void;
  isDark: boolean;
  onForceDarkMode: () => void;
}

const PANEL_ORDER: EmissivePanelType[] = [
  'standard-lcd',
  'oled-true-black',
  'amoled-anti-smear',
  'micro-oled-xr',
];

export const EmissiveLabView: React.FC<EmissiveLabViewProps> = ({
  palettes,
  scheme,
  contrastLevel,
  emissiveProfile,
  onEmissiveProfileChange,
  burnInGuard,
  onBurnInGuardChange,
  antiFringing,
  onAntiFringingChange,
  isDark,
  onForceDarkMode,
}) => {
  const { locale } = useI18n()
  const copy = Copy[locale]

  // 1. 同屏计算 4 种显示面板在深色模式下的物理功耗、APL、蓝光应力与黑拖影报告
  const panelComparisons = useMemo(() => {
    return PANEL_ORDER.map((prof) => {
      const darkTestScheme = buildDynamicScheme(palettes, true, contrastLevel, {
        profile: prof,
        burnInGuard,
        antiFringing,
      });
      return {
        profile: prof,
        scheme: darkTestScheme,
        report: analyzeEmissiveSchemeMetrics(darkTestScheme, prof),
      };
    });
  }, [palettes, contrastLevel, burnInGuard, antiFringing]);

  const currentTelemetry = useMemo(
    () => computeColorEmissiveTelemetry(scheme.primary),
    [scheme.primary]
  );

  // -----------------------------------------------------------------
  // 2. 120Hz 滚动黑拖影 (Black Smearing) 实时物理仿真器
  // -----------------------------------------------------------------
  const smearCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scrollSpeed, setScrollSpeed] = useState<number>(5);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);

  useEffect(() => {
    const canvas = smearCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let offset = 0;

    // 预取两种模式的表面与卡片色彩
    const oledBlackScheme = panelComparisons.find((p) => p.profile === 'oled-true-black')?.scheme;
    const amoledScheme = panelComparisons.find((p) => p.profile === 'amoled-anti-smear')?.scheme;

    const cardHexOled = oledBlackScheme?.surfaceContainerHigh || '#222228';
    const bgHexAmoled = amoledScheme?.surface || '#0B0B0E';
    const cardHexAmoled = amoledScheme?.surfaceContainerHigh || '#24242A';
    const accentHex = scheme.primary;

    const renderFrame = () => {
      if (isSimRunning) {
        offset = (offset + scrollSpeed) % 110;
      }

      const w = canvas.width;
      const h = canvas.height;
      const halfW = w / 2;

      // 左侧：OLED True-Black (#000000 T=0 完全断电，带电容充电延迟紫黑拖影)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, halfW, h);

      // 右侧：AMOLED Anti-Smear (T=4 #0B0B0E 预偏置起辉，零黑拖影)
      ctx.fillStyle = bgHexAmoled;
      ctx.fillRect(halfW, 0, halfW, h);

      // 绘制滚动卡片列
      for (let row = -1; row < 3; row++) {
        const cardY = row * 110 - offset + 25;
        const cardH = 68;

        // 1. 左侧 OLED T=0 唤醒黑拖影尾迹模拟 (由于蓝/红子像素从 0V 起辉比绿色慢，底部边缘拖拽出紫黑梯度残影)
        if (scrollSpeed > 0) {
          const smearTailLen = scrollSpeed * 4.2;
          const grad = ctx.createLinearGradient(0, cardY + cardH, 0, cardY + cardH + smearTailLen);
          grad.addColorStop(0, 'rgba(18, 8, 28, 0.92)');
          grad.addColorStop(0.5, 'rgba(38, 12, 56, 0.55)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(20, cardY + cardH - 2, halfW - 40, smearTailLen);
        }

        // 左侧卡片本体
        ctx.fillStyle = cardHexOled;
        ctx.beginPath();
        ctx.roundRect(20, cardY, halfW - 40, cardH, 10);
        ctx.fill();

        // 左侧色标与标题条
        ctx.fillStyle = accentHex;
        ctx.fillRect(32, cardY + 16, 28, 8);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(32, cardY + 32, halfW - 90, 7);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(32, cardY + 46, halfW - 130, 6);

        // 2. 右侧 AMOLED T=4 预起辉卡片 (仅极微弱 1.6ms 正常像素响应，无断电黑拖影)
        ctx.fillStyle = cardHexAmoled;
        ctx.beginPath();
        ctx.roundRect(halfW + 20, cardY, halfW - 40, cardH, 10);
        ctx.fill();

        ctx.fillStyle = accentHex;
        ctx.fillRect(halfW + 32, cardY + 16, 28, 8);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(halfW + 32, cardY + 32, halfW - 90, 7);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(halfW + 32, cardY + 46, halfW - 130, 6);
      }

      // 中间分界线与顶部 HUD 标签
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, h);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(12, 8, 225, 22);
      ctx.fillRect(halfW + 12, 8, 240, 22);

      ctx.font = 'bold 11px JetBrains Mono';
      ctx.fillStyle = '#fb7185';
      ctx.fillText(copy.canvasOledLabel, 18, 23);
      ctx.fillStyle = '#34d399';
      ctx.fillText(copy.canvasAmoledLabel, halfW + 18, 23);

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [scrollSpeed, isSimRunning, panelComparisons, scheme.primary, copy]);

  // -----------------------------------------------------------------
  // 3. 子像素微观几何排列放大镜 (RGB Stripe vs Diamond PenTile vs MicroOLED)
  // -----------------------------------------------------------------
  const subpixelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [inspectGeometry, setInspectGeometry] = useState<SubpixelGeometry>(
    EMISSIVE_PANEL_SPECS[emissiveProfile].subpixelGeometry
  );

  // 当外部面板预设变化时，同步放大镜默认几何结构
  useEffect(() => {
    setInspectGeometry(EMISSIVE_PANEL_SPECS[emissiveProfile].subpixelGeometry);
  }, [emissiveProfile]);

  useEffect(() => {
    const canvas = subpixelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#08080c';
    ctx.fillRect(0, 0, w, h);

    const fgRgb = hexToRgb(scheme.primary);
    const bgRgb = hexToRgb(scheme.surface);

    const cols = 10;
    const rows = 5;
    const cellW = w / cols;
    const cellH = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 模拟一条斜向高对比度 UI 边界 (左上是前景按钮色，右下是背景 Surface)
        const isForeground = c + r * 1.4 < 7.5;
        const isEdgePixel = Math.abs(c + r * 1.4 - 7.5) < 1.1;

        let pixR = isForeground ? fgRgb.r : bgRgb.r;
        let pixG = isForeground ? fgRgb.g : bgRgb.g;
        let pixB = isForeground ? fgRgb.b : bgRgb.b;

        // 若在边缘且开启了抗彩边/抗光晕补偿，注入平滑过渡亮度
        if (isEdgePixel && antiFringing) {
          pixR = pixR * 0.65 + bgRgb.r * 0.35;
          pixG = pixG * 0.72 + bgRgb.g * 0.28 + 0.08;
          pixB = pixB * 0.65 + bgRgb.b * 0.35;
        }

        const x0 = c * cellW;
        const y0 = r * cellH;

        if (inspectGeometry === 'rgb-stripe') {
          // 标准 RGB 竖条子像素排列
          const subW = (cellW - 8) / 3;
          ctx.fillStyle = `rgb(${Math.round(pixR * 255)}, 0, 0)`;
          ctx.fillRect(x0 + 3, y0 + 4, subW - 2, cellH - 8);

          ctx.fillStyle = `rgb(0, ${Math.round(pixG * 255)}, 0)`;
          ctx.fillRect(x0 + 3 + subW, y0 + 4, subW - 2, cellH - 8);

          ctx.fillStyle = `rgb(0, 0, ${Math.round(pixB * 255)})`;
          ctx.fillRect(x0 + 3 + subW * 2, y0 + 4, subW - 2, cellH - 8);
        } else if (inspectGeometry === 'diamond-pentile') {
          // AMOLED Diamond PenTile (RG-BG 菱形借用排列：奇偶列交替缺失红/蓝子像素)
          const cx = x0 + cellW * 0.5;
          const cy = y0 + cellH * 0.5;

          // 绿色子像素 (每个像素均有小椭圆绿色发光点)
          ctx.fillStyle = `rgb(0, ${Math.round(pixG * 255)}, 0)`;
          ctx.beginPath();
          ctx.arc(x0 + cellW * 0.28, cy, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // 奇偶交错的大菱形红或蓝子像素
          if ((r + c) % 2 === 0) {
            ctx.fillStyle = `rgb(${Math.round(pixR * 255)}, 0, 0)`;
          } else {
            ctx.fillStyle = `rgb(0, 0, ${Math.round(pixB * 255)})`;
          }
          ctx.beginPath();
          ctx.moveTo(cx + 6, cy - 8);
          ctx.lineTo(cx + 14, cy);
          ctx.lineTo(cx + 6, cy + 8);
          ctx.lineTo(cx - 2, cy);
          ctx.closePath();
          ctx.fill();
        } else {
          // MicroOLED Silicon Tandem Hex (硅基微腔高密度六角紧凑排列 + 近眼透镜微光晕模拟)
          const cx = x0 + cellW * 0.5;
          const cy = y0 + cellH * 0.5;

          if (!antiFringing && isForeground) {
            // 未开启防眩光时模拟 Pancake 光学漫射光晕
            const halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, cellW * 0.65);
            halo.addColorStop(
              0,
              `rgba(${Math.round(pixR * 255)}, ${Math.round(pixG * 255)}, ${Math.round(pixB * 255)}, 0.38)`
            );
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(cx, cy, cellW * 0.65, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = `rgb(${Math.round(pixR * 255)}, 0, 0)`;
          ctx.beginPath();
          ctx.arc(cx - 6, cy - 4, 4.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgb(0, ${Math.round(pixG * 255)}, 0)`;
          ctx.beginPath();
          ctx.arc(cx + 6, cy - 4, 4.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgb(0, 0, ${Math.round(pixB * 255)})`;
          ctx.beginPath();
          ctx.arc(cx, cy + 6, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [scheme.primary, scheme.surface, inspectGeometry, antiFringing]);

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-6 sm:gap-8 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6">
      {/* 顶部标题与深色模式联动提示 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-neutral-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold font-display tracking-tight">
              {copy.heading}
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {copy.subtitle}
          </p>
        </div>

        {!isDark && (
          <button
            onClick={onForceDarkMode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{copy.switchToDark}</span>
          </button>
        )}
      </div>

      {/* 1. 四类显示面板同屏物理遥测矩阵 */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {copy.hardwareMatrixHeading}
            </h3>
          </div>

          {/* 蓝光防烧屏与抗彩边快捷开关 */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={burnInGuard}
                onChange={(e) => onBurnInGuardChange(e.target.checked)}
                className="w-3.5 h-3.5 accent-neutral-900 dark:accent-neutral-100"
              />
              <span className="font-medium">{copy.burnInGuard}</span>
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={antiFringing}
                onChange={(e) => onAntiFringingChange(e.target.checked)}
                className="w-3.5 h-3.5 accent-neutral-900 dark:accent-neutral-100"
              />
              <span className="font-medium">{copy.antiFringing}</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {panelComparisons.map(({ profile, scheme: profScheme, report }) => {
            const isSelected = emissiveProfile === profile;
            return (
              <div
                key={profile}
                onClick={() => onEmissiveProfileChange(profile)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-white/10 ring-1 ring-neutral-900 dark:ring-white'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/30 hover:border-neutral-400'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{copy.panels[profile].shortName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-700 font-semibold">
                      {copy.panels[profile].badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {copy.panels[profile].description}
                  </p>
                </div>

                {/* 五级深色表面阶梯预览条 */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono text-neutral-400">
                    {copy.surfaceToneLadder(profScheme.tones.surfaceContainerLowest, profScheme.tones.surfaceContainerHighest)}
                  </span>
                  <div className="grid grid-cols-5 h-6 rounded overflow-hidden border border-neutral-300 dark:border-neutral-700 font-mono text-[9px]">
                    {[
                      { label: `T${profScheme.tones.surfaceContainerLowest}`, hex: profScheme.surfaceContainerLowest },
                      { label: `T${profScheme.tones.surface}`, hex: profScheme.surface },
                      { label: `T${profScheme.tones.surfaceContainer}`, hex: profScheme.surfaceContainer },
                      { label: `T${profScheme.tones.surfaceContainerHigh}`, hex: profScheme.surfaceContainerHigh },
                      { label: `T${profScheme.tones.surfaceContainerHighest}`, hex: profScheme.surfaceContainerHighest },
                    ].map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-center text-white/85"
                        style={{ backgroundColor: s.hex }}
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 核心物理指标表 */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/80 dark:border-neutral-700/60 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-neutral-400 font-sans">{copy.estimatedTotalPower}</div>
                    <div className="font-bold tabular-nums mt-0.5">
                      {report.estimatedTotalPowerMw} mW
                      {report.powerSavingsVsLcdPct > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] ml-1">
                          (-{report.powerSavingsVsLcdPct}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-400 font-sans">{copy.riseResponse120}</div>
                    <div
                      className={`font-bold tabular-nums mt-0.5 ${
                        report.smearRiseTimeMs > 10
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {report.smearRiseTimeMs} ms
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-400 font-sans">{copy.blueBurnInStress}</div>
                    <div className="font-bold tabular-nums mt-0.5">
                      {report.blueSubpixelStressIndex} / 100
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-400 font-sans">{copy.pixelOffRatio}</div>
                    <div className="font-bold tabular-nums mt-0.5">
                      {report.pixelOffRatioPct}% (APL {report.aplPercent}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. 120Hz 滚动黑拖影仿真器 + 子像素微观几何放大镜 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：120Hz 动态滚动黑拖影模拟器 */}
        <section className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-neutral-500" />
                <span>{copy.smearTitle}</span>
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {copy.smearSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
              <button
                onClick={() => setIsSimRunning((prev) => !prev)}
                className="px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {isSimRunning ? copy.pauseFrames : copy.resumeScroll}
              </button>
              <select
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value={2}>{copy.scrollSlow}</option>
                <option value={5}>{copy.scrollStandard}</option>
                <option value={9}>{copy.scrollFast}</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-black flex justify-center">
            <canvas
              ref={smearCanvasRef}
              width={560}
              height={250}
              className="w-full h-auto block"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
              <span className="font-bold">{copy.oledSmearBadge}</span>
              <p className="text-[10px] opacity-80 mt-0.5">{copy.oledSmearBody}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <span className="font-bold">{copy.amoledSmearBadge}</span>
              <p className="text-[10px] opacity-80 mt-0.5">{copy.amoledSmearBody}</p>
            </div>
          </div>
        </section>

        {/* 右侧：子像素微观排列与蓝光功耗拆解 */}
        <section className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
                <span>{copy.subpixelTitle}</span>
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {copy.subpixelSubtitle(scheme.primary)}
              </p>
            </div>
          </div>

          {/* 子像素排列几何切换 */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[11px] font-mono">
            {[
              { id: 'rgb-stripe', label: 'RGB Stripe' },
              { id: 'diamond-pentile', label: 'AMOLED PenTile' },
              { id: 'micro-oled-hex', label: copy.microOledSilicon },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setInspectGeometry(g.id as SubpixelGeometry)}
                className={`py-1 px-2 rounded transition-colors ${
                  inspectGeometry === g.id
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-black flex justify-center">
            <canvas
              ref={subpixelCanvasRef}
              width={400}
              height={175}
              className="w-full h-auto block"
            />
          </div>

          {/* 当前主色 R/G/B 子像素光谱功耗分解 */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">
                {copy.primaryBreakdown(scheme.primary)}
              </span>
              <span className="font-mono font-bold tabular-nums">
                {currentTelemetry.powerMw} mW
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                <div className="text-[10px] opacity-75">Red (wR=1.45)</div>
                <div className="font-bold tabular-nums mt-0.5">
                  {currentTelemetry.channelPowerMw.r} mW
                </div>
              </div>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <div className="text-[10px] opacity-75">Green (wG=1.00)</div>
                <div className="font-bold tabular-nums mt-0.5">
                  {currentTelemetry.channelPowerMw.g} mW
                </div>
              </div>
              <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300">
                <div className="text-[10px] opacity-75">Blue (wB=2.40)</div>
                <div className="font-bold tabular-nums mt-0.5">
                  {currentTelemetry.channelPowerMw.b} mW
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
