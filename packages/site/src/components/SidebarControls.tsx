
import React, { useRef, useState, useEffect } from 'react';
import { PaletteVariant } from '../color/palettes.ts';
import { OKYCT } from '../color/math.ts';
import { CvdType } from '../color/benchmark.ts';
import { CustomColorConfig } from '../color/scheme.ts';
import {
  PRESET_ART_SCENES,
  extractSeedsFromImageData,
  ExtractedSeedColor,
} from '../color/imageQuantizer.ts';
import { EmissivePanelType, EMISSIVE_PANEL_SPECS } from '../color/emissive.ts';
import { Eye, Wand2, X, Image as ImageIcon, Upload, Plus, Trash2, Palette, Cpu } from 'lucide-react';
import { useI18n } from '../i18n/index.tsx'

interface SidebarControlsProps {
  sourceHex: string;
  onSourceHexChange: (hex: string) => void;
  okyct: OKYCT;
  variant: PaletteVariant;
  onVariantChange: (v: PaletteVariant) => void;
  contrastLevel: number;
  onContrastLevelChange: (val: number) => void;
  harmonize: boolean;
  onHarmonizeChange: (val: boolean) => void;
  cvdType: CvdType;
  onCvdTypeChange: (val: CvdType) => void;
  customColors: CustomColorConfig[];
  onCustomColorsChange: (configs: CustomColorConfig[]) => void;
  emissiveProfile: EmissivePanelType;
  onEmissiveProfileChange: (p: EmissivePanelType) => void;
  burnInGuard: boolean;
  onBurnInGuardChange: (val: boolean) => void;
  antiFringing: boolean;
  onAntiFringingChange: (val: boolean) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onCloseMobile?: () => void;
}

const PRESET_SEEDS = [
  { id: 'googleBlue', hex: '#1A73E8' },
  { id: 'highLuminanceYellow', hex: '#FFD600' },
  { id: 'md3DefaultPurple', hex: '#6750A4' },
  { id: 'forestGreen', hex: '#0F9D58' },
  { id: 'sunsetMagenta', hex: '#D81B60' },
  { id: 'coolTeal', hex: '#00ACC1' },
];

const VARIANTS: { id: PaletteVariant; label: string }[] = [
  { id: 'tonalSpot', label: 'Tonal Spot' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'expressive', label: 'Expressive' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'monochrome', label: 'Monochrome' },
  { id: 'fidelity', label: 'Fidelity' },
];

const EnglishCopy = {
  parametersConsole: 'Parameter console',
  closeParameterPanel: 'Close parameter panel',

  sourceSeed: 'Source seed',
  pickColor: 'Pick a color',
  presetSeedNames: {
    googleBlue: 'Google classic blue',
    highLuminanceYellow: 'High-luminance yellow (trade-off probe)',
    md3DefaultPurple: 'MD3 default purple',
    forestGreen: 'Natural forest green',
    sunsetMagenta: 'Vivid sunset magenta',
    coolTeal: 'Modern cool teal',
  } as Record<string, string>,
  okyctCoordinates: 'OKYCT perceptual coordinates',
  hueAxis: 'Hue H',
  chromaAxis: 'Chroma C',
  toneAxis: 'Tone T',

  imageQuantizer: 'Image quantizer',
  uploadImageHint: 'Upload a local image and extract colors',
  uploadImage: 'Upload image',
  sceneNames: {
    aurora: 'Aurora',
    'sunset-amber': 'Molten',
    botanical: 'Tropics',
    'cyber-atelier': 'Neon',
  } as Record<string, string>,
  sceneSubtitles: {
    aurora: 'Teal aurora over a deep night violet',
    'sunset-amber': 'Crimson dusk on an amber-gold coast',
    botanical: 'Emerald broadleaf and bird-of-paradise orange',
    'cyber-atelier': 'Electric magenta in cobalt night',
  } as Record<string, string>,
  salienceCandidates: 'Salience candidates (click to apply):',
  seedTooltip: (hue: string, salience: number) => `Hue H:${hue}° | Salience score: ${salience}`,

  generationVariant: 'Generation variant',
  variantDescriptions: {
    tonalSpot: 'Classic MD3 with a focused primary',
    vibrant: 'High saturation, lively contrast',
    expressive: 'Hue leaps, maximum expression',
    neutral: 'Low saturation, restrained and steady',
    monochrome: 'Single-hue grayscale, minimal and pure',
    fidelity: 'Source-faithful, hue locked',
  } as Record<string, string>,

  contrastLevel: 'Accessibility contrast level',
  contrastStandard: 'Standard 0.0',
  contrastMedium: 'Medium +0.5',
  contrastHigh: 'High +1.0',
  contrastLow: 'Low -0.5',

  emissivePanel: 'Emissive panel tuning (OLED/XR)',
  panelShortNames: {
    'standard-lcd': 'LCD baseline',
    'oled-true-black': 'OLED true black',
    'amoled-anti-smear': 'AMOLED anti-smear',
    'micro-oled-xr': 'MicroOLED XR',
  } as Record<string, string>,
  panelBadges: {
    'standard-lcd': 'Global backlight',
    'oled-true-black': 'T=0 zero-power cutoff',
    'amoled-anti-smear': 'T=4 pre-biased lift',
    'micro-oled-xr': 'Anti-halation + ABL guard',
  } as Record<string, string>,
  panelDescriptions: {
    'standard-lcd':
      'A constant backlight diffused through liquid-crystal molecules; power draw is nearly independent of image color and brightness, with no subpixel shutdown or burn-in.',
    'oled-true-black':
      'Drives the base surface to pure black #000000 (T=0) so the organic diodes switch off completely, maximizing the pixel-off ratio and static battery life; waking from T=0 to a low gray level still takes about 18 ms and produces black smearing.',
    'amoled-anti-smear':
      'Tuned for 120 Hz mobile panels: anchors the darkest surface at the subpixel turn-on potential T=4 (#0B0B0E), keeping a faint bias that removes scrolling black smearing and purple trails while suppressing PenTile fringing.',
    'micro-oled-xr':
      'For XR headsets and silicon micro-displays: lifts the dark base to a velvet gray T=8 and softly caps peak white at T=92, removing pancake-lens halation while avoiding ABL dimming on the silicon backplane.',
  } as Record<string, string>,
  emissiveTones: (darkTone: number, peakTone: number) =>
    `Dark base T${darkTone} / Peak T${peakTone}`,
  burnInGuard: 'Blue-light burn-in guard',
  burnInGuardBody: 'Tone-locked chroma falloff for high-energy blue-violet (wB=2.40)',
  fringingGuard: 'PenTile fringing & XR glare suppression',
  fringingGuardBody: 'Removes diamond-subpixel fringes and lens halation',

  customColorsTitle: (count: number) => `Extended semantic colors (${count})`,
  addSemantic: 'Add semantic',
  customColorLabel: (index: number) => `Extended semantic ${index}`,
  removeCustomColor: 'Remove this extended color',
  harmonizeTowardPrimary: 'Harmonize toward primary',

  perceptionTuning: 'Perception & accessibility tuning',
  harmonizeSemantic: 'Built-in semantic hue harmonization',
  harmonizeSemanticBody: 'Shifts error and warning hues slightly toward the primary',
  cvdTitle: 'Color vision deficiency simulation (CVD)',
  cvdStandard: 'Standard vision',
  cvdProtanopia: 'Protanopia (red-blind)',
  cvdDeuteranopia: 'Deuteranopia (green-blind)',
  cvdTritanopia: 'Tritanopia (blue-blind)',
  cvdAchromatopsia: 'Achromatopsia (monochrome)',
}

const TraditionalCopy: typeof EnglishCopy = {
  parametersConsole: '參數設定主控台',
  closeParameterPanel: '關閉參數面板',

  sourceSeed: '種子源色',
  pickColor: '選取顏色',
  presetSeedNames: {
    googleBlue: 'Google 經典藍',
    highLuminanceYellow: '高光亮黃（取捨驗證）',
    md3DefaultPurple: 'MD3 預設紫',
    forestGreen: '自然森林綠',
    sunsetMagenta: '活力晚霞洋紅',
    coolTeal: '現代冷調青',
  },
  okyctCoordinates: 'OKYCT 感知座標',
  hueAxis: '色相 H',
  chromaAxis: '彩度 C',
  toneAxis: '視明度 T',

  imageQuantizer: '影像量化提色（Quantizer）',
  uploadImageHint: '上傳本機影像並擷取色彩',
  uploadImage: '上傳影像',
  sceneNames: {
    aurora: '極光冰川',
    'sunset-amber': '落日熔金',
    botanical: '熱帶雨林',
    'cyber-atelier': '霓虹賽博',
  },
  sceneSubtitles: {
    aurora: '青綠極光與深邃夜空紫',
    'sunset-amber': '緋紅晚霞與琥珀金海岸',
    botanical: '翡翠闊葉與鶴望蘭橙花',
    'cyber-atelier': '電光洋紅與鈷藍暗夜',
  },
  salienceCandidates: '顯著性評分候選（點選套用）：',
  seedTooltip: (hue: string, salience: number) => `色相 H：${hue}°｜顯著性得分：${salience}`,

  generationVariant: '生成策略變體（Variant）',
  variantDescriptions: {
    tonalSpot: '經典 MD3，主色聚焦',
    vibrant: '高飽和，對比鮮活',
    expressive: '色相跳躍，表現力豐富',
    neutral: '低飽和，克制穩健',
    monochrome: '單色灰階，極簡純淨',
    fidelity: '原色保真，色相鎖定',
  },

  contrastLevel: '無障礙對比度等級',
  contrastStandard: '標準 0.0',
  contrastMedium: '中等 +0.5',
  contrastHigh: '高強 +1.0',
  contrastLow: '低對齊 -0.5',

  emissivePanel: '自發光面板最佳化（OLED/XR）',
  panelShortNames: {
    'standard-lcd': 'LCD 標準參照',
    'oled-true-black': 'OLED 純黑省電',
    'amoled-anti-smear': 'AMOLED 防拖影',
    'micro-oled-xr': 'MicroOLED XR',
  },
  panelBadges: {
    'standard-lcd': '全域背光',
    'oled-true-black': 'T=0 零功耗關斷',
    'amoled-anti-smear': 'T=4 預偏壓起輝',
    'micro-oled-xr': '防光暈與抗 ABL',
  },
  panelDescriptions: {
    'standard-lcd':
      '依靠固定背光層透過液晶分子偏轉顯色，功耗幾乎與畫面色彩及明暗無關，沒有子像素斷電與烙印現象。',
    'oled-true-black':
      '將底層背景壓至純黑 #000000（T=0），使有機發光二極體完全斷電，最大化像素關斷率與靜態續航；但從 T=0 喚醒至低灰階仍需約 18 ms 的電容充電黑拖影。',
    'amoled-anti-smear':
      '專為 120 Hz 行動裝置高刷新率面板調校：將最暗表面錨定在子像素起輝電位 T=4（#0B0B0E），維持微弱導通，徹底消除捲動果凍黑拖影與紫邊，並抑制 PenTile 彩邊。',
    'micro-oled-xr':
      '面向 XR 頭戴裝置與矽基微顯示：將暗底抬升至絲絨灰 T=8，並將峰值白光柔和收斂至 T=92，消除 Pancake 透鏡內反射光暈（Halation），並避免觸發矽基驅動背板 ABL 驟暗。',
  },
  emissiveTones: (darkTone: number, peakTone: number) =>
    `暗底 T${darkTone}／峰值 T${peakTone}`,
  burnInGuard: '藍光防烙印壽命守衛',
  burnInGuardBody: '等明度衰減高能耗藍紫彩度（wB=2.40）',
  fringingGuard: 'PenTile 彩邊與 XR 眩光抑制',
  fringingGuardBody: '消除菱形子像素彩邊與透鏡光暈',

  customColorsTitle: (count: number) => `擴展語意色（${count}）`,
  addSemantic: '新增語意',
  customColorLabel: (index: number) => `擴展語意 ${index}`,
  removeCustomColor: '移除此擴展色',
  harmonizeTowardPrimary: '向主色和諧偏移',

  perceptionTuning: '感知與無障礙微調',
  harmonizeSemantic: '內建語意色相和諧',
  harmonizeSemanticBody: '將錯誤／警告色向主色適度偏移',
  cvdTitle: '色覺障礙模擬（CVD）',
  cvdStandard: '正常視知覺（Standard）',
  cvdProtanopia: '紅色盲（Protanopia）',
  cvdDeuteranopia: '綠色盲（Deuteranopia）',
  cvdTritanopia: '藍色盲（Tritanopia）',
  cvdAchromatopsia: '全色盲（Achromatopsia）',
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  sourceHex,
  onSourceHexChange,
  okyct,
  variant,
  onVariantChange,
  contrastLevel,
  onContrastLevelChange,
  harmonize,
  onHarmonizeChange,
  cvdType,
  onCvdTypeChange,
  customColors,
  onCustomColorsChange,
  emissiveProfile,
  onEmissiveProfileChange,
  burnInGuard,
  onBurnInGuardChange,
  antiFringing,
  onAntiFringingChange,
  onCloseMobile,
}) => {
  const { locale } = useI18n()
  const copy = Copy[locale]

  const quantCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string>(PRESET_ART_SCENES[0].id);
  const [extractedSeeds, setExtractedSeeds] = useState<ExtractedSeedColor[]>([]);

  // 渲染指定预设场景并执行 OKYCT 像素量化与显著性打分
  useEffect(() => {
    const canvas = quantCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scene = PRESET_ART_SCENES.find((s) => s.id === activeSceneId);
    if (!scene) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scene.drawScene(ctx, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const seeds = extractSeedsFromImageData(imgData, 4);
    setExtractedSeeds(seeds);
  }, [activeSceneId]);

  // 处理本地图片上传量化
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = quantCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setActiveSceneId('uploaded');

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const seeds = extractSeedsFromImageData(imgData, 4);
        setExtractedSeeds(seeds);
        if (seeds.length > 0) {
          onSourceHexChange(seeds[0].hex);
        }
      };
      if (typeof ev.target?.result === 'string') {
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // 自定义扩展色管理动作
  const handleAddCustomColor = () => {
    const idx = customColors.length + 1;
    const presetPool = ['#7E57C2', '#00897B', '#EC407A', '#5C6BC0'];
    const nextHex = presetPool[(idx - 1) % presetPool.length];
    onCustomColorsChange([
      ...customColors,
      {
        id: `custom-${Date.now()}`,
        name: `customRole${idx}`,
        label: copy.customColorLabel(idx),
        sourceHex: nextHex,
        harmonize: true,
      },
    ]);
  };

  const handleUpdateCustomColor = (id: string, patch: Partial<CustomColorConfig>) => {
    onCustomColorsChange(
      customColors.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const handleRemoveCustomColor = (id: string) => {
    onCustomColorsChange(customColors.filter((c) => c.id !== id));
  };

  return (
    <aside className="w-full md:w-80 h-full flex-1 min-h-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-5 flex flex-col gap-6 overflow-y-auto text-neutral-900 dark:text-neutral-100 pb-28 md:pb-6 overscroll-contain">
      {/* 移动端抽屉专属顶栏 */}
      {onCloseMobile && (
        <div className="md:hidden flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <span className="font-bold text-sm">{copy.parametersConsole}</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label={copy.closeParameterPanel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 1. 种子色拾取区 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
            {copy.sourceSeed}
          </label>
          <span className="text-xs font-mono font-medium text-neutral-600 dark:text-neutral-300 tabular-nums">
            {sourceHex.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-12 h-10 rounded-md overflow-hidden border border-neutral-300 dark:border-neutral-700 shrink-0 shadow-xs">
            <input
              type="color"
              value={sourceHex}
              onChange={(e) => onSourceHexChange(e.target.value)}
              className="absolute -top-3 -left-3 w-20 h-20 cursor-pointer border-0 p-0"
              title={copy.pickColor}
            />
          </div>
          <input
            type="text"
            value={sourceHex}
            onChange={(e) => onSourceHexChange(e.target.value)}
            className="flex-1 px-3 py-2 text-sm font-mono border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            placeholder="#1A73E8"
          />
        </div>

        {/* 经典预设色块 */}
        <div className="grid grid-cols-6 gap-1.5 pt-1">
          {PRESET_SEEDS.map((preset) => (
            <button
              key={preset.hex}
              onClick={() => onSourceHexChange(preset.hex)}
              title={`${copy.presetSeedNames[preset.id]} (${preset.hex})`}
              className={`h-7 rounded-sm border transition-transform hover:scale-105 ${
                sourceHex.toLowerCase() === preset.hex.toLowerCase()
                  ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900 dark:ring-white'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: preset.hex }}
            />
          ))}
        </div>

        {/* OKYCT 坐标读数 HUD */}
        <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-md border border-neutral-200 dark:border-neutral-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{copy.okyctCoordinates}</span>
            <span className="font-mono text-[10px]">CIE Y: {(Math.pow((okyct.t + 16) / 116, 3)).toFixed(3)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-center">
            <div className="bg-neutral-100 dark:bg-neutral-900/60 p-1.5 rounded">
              <span className="block text-[10px] text-neutral-400">{copy.hueAxis}</span>
              <span className="text-xs font-semibold tabular-nums">{okyct.h.toFixed(1)}°</span>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900/60 p-1.5 rounded">
              <span className="block text-[10px] text-neutral-400">{copy.chromaAxis}</span>
              <span className="text-xs font-semibold tabular-nums">{okyct.c.toFixed(3)}</span>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-900/60 p-1.5 rounded">
              <span className="block text-[10px] text-neutral-400">{copy.toneAxis}</span>
              <span className="text-xs font-semibold tabular-nums">{okyct.t.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 图像像素量化与主题显著性提色器 (Image Quantizer & Salience Scorer) */}
      <section className="flex flex-col gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{copy.imageQuantizer}</span>
          </label>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-medium flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            title={copy.uploadImageHint}
          >
            <Upload className="w-3 h-3" />
            <span>{copy.uploadImage}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* 4 幅内置艺术场景切换 */}
        <div className="grid grid-cols-4 gap-1">
          {PRESET_ART_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setActiveSceneId(scene.id)}
              className={`py-1 px-1.5 text-[11px] font-medium rounded border transition-colors truncate ${
                activeSceneId === scene.id
                  ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100'
              }`}
              title={copy.sceneSubtitles[scene.id] ?? scene.subtitle}
            >
              {copy.sceneNames[scene.id] ?? scene.name}
            </button>
          ))}
        </div>

        {/* 缩略图画布 + 显著性 Top-4 候选种子色 */}
        <div className="p-2.5 bg-white dark:bg-neutral-800/70 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
          <canvas
            ref={quantCanvasRef}
            width={88}
            height={56}
            className="w-20 h-14 rounded border border-neutral-200 dark:border-neutral-700 shrink-0 object-cover"
          />
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[10px] text-neutral-400 font-mono">
              {copy.salienceCandidates}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {extractedSeeds.map((seed) => (
                <button
                  key={seed.hex}
                  onClick={() => onSourceHexChange(seed.hex)}
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded border text-left transition-all ${
                    sourceHex.toLowerCase() === seed.hex.toLowerCase()
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-700/60 font-bold'
                      : 'border-neutral-200 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                  title={copy.seedTooltip(seed.okyct.h.toFixed(0), seed.salienceScore)}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-xs border border-black/15 shrink-0"
                    style={{ backgroundColor: seed.hex }}
                  />
                  <span className="text-[10px] font-mono tabular-nums truncate">
                    {seed.hex}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 主题生成策略变体 */}
      <section className="flex flex-col gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
          {copy.generationVariant}
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => onVariantChange(v.id)}
              className={`p-2.5 text-left rounded-md border transition-colors flex flex-col ${
                variant === v.id
                  ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-900/5 dark:bg-white/10'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <span className="text-xs font-semibold">{v.label}</span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{copy.variantDescriptions[v.id]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. 对比度调节系数 */}
      <section className="flex flex-col gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
            {copy.contrastLevel}
          </label>
          <span className="text-xs font-mono font-medium tabular-nums">
            {contrastLevel > 0 ? `+${contrastLevel.toFixed(1)}` : contrastLevel.toFixed(1)}
          </span>
        </div>

        {/* 预设档位 */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-200/60 dark:bg-neutral-800 rounded-md">
          {[
            { label: copy.contrastStandard, val: 0.0 },
            { label: copy.contrastMedium, val: 0.5 },
            { label: copy.contrastHigh, val: 1.0 },
          ].map((lvl) => (
            <button
              key={lvl.val}
              onClick={() => onContrastLevelChange(lvl.val)}
              className={`py-1 text-xs font-medium rounded transition-colors ${
                Math.abs(contrastLevel - lvl.val) < 0.05
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        <input
          type="range"
          min="-0.5"
          max="1.0"
          step="0.1"
          value={contrastLevel}
          onChange={(e) => onContrastLevelChange(parseFloat(e.target.value))}
          className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
          <span>{copy.contrastLow}</span>
          <span>AA 4.5:1</span>
          <span>AAA 7.0:1</span>
        </div>
      </section>

      {/* 4.5 自发光屏幕物理调校 (OLED / AMOLED / MicroOLED) */}
      <section className="flex flex-col gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>{copy.emissivePanel}</span>
          </label>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            {copy.panelBadges[emissiveProfile] ?? EMISSIVE_PANEL_SPECS[emissiveProfile].badge}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              'standard-lcd',
              'oled-true-black',
              'amoled-anti-smear',
              'micro-oled-xr',
            ] as EmissivePanelType[]
          ).map((prof) => {
            const spec = EMISSIVE_PANEL_SPECS[prof];
            const active = emissiveProfile === prof;
            return (
              <button
                key={prof}
                onClick={() => onEmissiveProfileChange(prof)}
                className={`p-2 rounded-md border text-left transition-colors flex flex-col gap-0.5 ${
                  active
                    ? 'border-neutral-900 dark:border-white bg-neutral-900/5 dark:bg-white/10 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 hover:bg-neutral-100'
                }`}
                title={copy.panelDescriptions[prof] ?? spec.description}
              >
                <span className="text-[11px] font-semibold truncate">{copy.panelShortNames[prof] ?? spec.shortName}</span>
                <span className="text-[10px] font-mono text-neutral-400 truncate">
                  {copy.emissiveTones(spec.darkSurfaceTones.surface, spec.lightPeakToneCap)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1.5 pt-0.5">
          <label className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 cursor-pointer text-xs">
            <div className="flex flex-col">
              <span className="font-medium text-[11px]">{copy.burnInGuard}</span>
              <span className="text-[10px] text-neutral-400">{copy.burnInGuardBody}</span>
            </div>
            <input
              type="checkbox"
              checked={burnInGuard}
              onChange={(e) => onBurnInGuardChange(e.target.checked)}
              className="w-3.5 h-3.5 accent-neutral-900 dark:accent-neutral-100"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-md bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 cursor-pointer text-xs">
            <div className="flex flex-col">
              <span className="font-medium text-[11px]">{copy.fringingGuard}</span>
              <span className="text-[10px] text-neutral-400">{copy.fringingGuardBody}</span>
            </div>
            <input
              type="checkbox"
              checked={antiFringing}
              onChange={(e) => onAntiFringingChange(e.target.checked)}
              className="w-3.5 h-3.5 accent-neutral-900 dark:accent-neutral-100"
            />
          </label>
        </div>
      </section>

      {/* 5. 自定义扩展语义色 (Custom Extended Colors) */}
      <section className="flex flex-col gap-2.5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span>{copy.customColorsTitle(customColors.length)}</span>
          </label>
          <button
            onClick={handleAddCustomColor}
            className="text-[11px] font-medium flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" />
            <span>{copy.addSemantic}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {customColors.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-lg bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    type="color"
                    value={item.sourceHex}
                    onChange={(e) => handleUpdateCustomColor(item.id, { sourceHex: e.target.value })}
                    className="w-5 h-5 rounded border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateCustomColor(item.id, {
                        name: e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''),
                      })
                    }
                    className="text-xs font-mono font-semibold bg-transparent border-b border-transparent focus:border-neutral-400 outline-none w-24 truncate"
                    placeholder="roleName"
                  />
                </div>
                <button
                  onClick={() => handleRemoveCustomColor(item.id)}
                  className="text-neutral-400 hover:text-rose-500 p-0.5"
                  title={copy.removeCustomColor}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="font-mono">{item.sourceHex.toUpperCase()}</span>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={item.harmonize}
                    onChange={(e) =>
                      handleUpdateCustomColor(item.id, { harmonize: e.target.checked })
                    }
                    className="w-3 h-3 accent-neutral-900 dark:accent-neutral-100"
                  />
                  <span>{copy.harmonizeTowardPrimary}</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. 色相和谐与色觉障碍模拟 */}
      <section className="flex flex-col gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <label className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
          {copy.perceptionTuning}
        </label>

        {/* 和谐开关 */}
        <label className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <div className="flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5 text-neutral-500" />
            <div className="flex flex-col">
              <span className="text-xs font-medium">{copy.harmonizeSemantic}</span>
              <span className="text-[10px] text-neutral-400">{copy.harmonizeSemanticBody}</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={harmonize}
            onChange={(e) => onHarmonizeChange(e.target.checked)}
            className="w-4 h-4 rounded text-neutral-900 accent-neutral-900 dark:accent-neutral-100"
          />
        </label>

        {/* 色觉缺陷模拟 (CVD) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{copy.cvdTitle}</span>
          </div>
          <select
            value={cvdType}
            onChange={(e) => onCvdTypeChange(e.target.value as CvdType)}
            className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          >
            <option value="none">{copy.cvdStandard}</option>
            <option value="protanopia">{copy.cvdProtanopia}</option>
            <option value="deuteranopia">{copy.cvdDeuteranopia}</option>
            <option value="tritanopia">{copy.cvdTritanopia}</option>
            <option value="achromatopsia">{copy.cvdAchromatopsia}</option>
          </select>
        </div>
      </section>
    </aside>
  );
};

