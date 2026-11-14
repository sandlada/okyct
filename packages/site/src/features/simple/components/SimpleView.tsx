import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  Wand2,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { okyctToHex } from '../../../color/math.ts'
import { useI18n } from '../../../i18n/index.tsx'
import { selectScheme } from '../../studio/selectors.ts'
import { setSourceHex } from '../../studio/slice.ts'
import {
  compareTwoColorsPlainly,
  describeColorInPlainLanguage,
  evaluateReadability,
  normalizeHexInput,
  type BrightnessDiffKind,
  type HueDiffKind,
  type HueFamilyId,
  type LightnessLevel,
  type ReadabilityGrade,
  type ScreenComfortLevel,
  type SimilarityBand,
  type TemperatureId,
  type VividnessDiffKind,
  type VividnessLevel,
} from '../translators.ts'

const SimpleCopy = {
  en: {
    title: 'Simple Color Helper',
    subtitle:
      'No Tone, Chroma, or ΔE jargon — plain-language verdicts, readability previews, and one-click fixes.',
    syncSeed: 'Use Studio seed',
    applyToStudio: 'Set as Studio seed',
    copied: (hex: string) => `Copied ${hex}`,
    checkup: {
      title: '1. Color Checkup',
      subtitle: 'What this color feels like and how it behaves on real screens',
      hueSlider: 'Color angle',
      vividnessSlider: 'Vividness',
      lightnessSlider: 'Lightness',
      familyLabel: 'Color family',
      vividnessLabel: 'Vividness',
      lightnessLabel: 'Brightness',
      comfortLabel: 'Screen & eye comfort',
      families: {
        neutral: 'Neutral gray',
        red: 'Red',
        orange: 'Orange',
        yellow: 'Yellow',
        green: 'Green',
        teal: 'Teal / Cyan',
        blue: 'Blue',
        purple: 'Purple',
        pink: 'Pink / Magenta',
      } as Record<HueFamilyId, string>,
      temps: {
        warm: 'Warm tone',
        cool: 'Cool tone',
        neutral: 'Neutral tone',
      } as Record<TemperatureId, string>,
      vividnessLevels: {
        muted: 'Muted & calm',
        soft: 'Soft & natural',
        vivid: 'Rich & vivid',
        intense: 'Very intense',
      } as Record<VividnessLevel, string>,
      lightnessLevels: {
        'very-dark': 'Very dark',
        dark: 'Deep / dark',
        medium: 'Balanced midtone',
        light: 'Bright / light',
        'very-light': 'Very pale',
      } as Record<LightnessLevel, string>,
      comforts: {
        'power-saving': 'OLED battery-friendly & easy on the eyes',
        balanced: 'Balanced brightness — works well for both UI & cards',
        'bright-intense': 'High visual punch — great for buttons or badges, avoid huge backgrounds',
      } as Record<ScreenComfortLevel, string>,
      blueTip: 'Blue-heavy colors age OLED pixels faster when kept at full brightness all day.',
      blackTip: 'Near-pure black saves power, though fast scrolling on 120Hz OLED can show slight dark smearing.',
    },
    readability: {
      title: '2. Can People Read This Text?',
      subtitle: 'Pick a text color and background color to check real-world legibility',
      textLabel: 'Text color',
      bgLabel: 'Background color',
      swap: 'Swap',
      useSeedBg: 'Seed as bg',
      useSeedText: 'Seed as text',
      grades: {
        great: {
          title: 'Easy to read everywhere',
          desc: 'Clear for body paragraphs, small labels, and headings.',
        },
        'large-only': {
          title: 'Only safe for large headings',
          desc: 'Small body text will feel tiring to read. Consider darkening or lightening.',
        },
        poor: {
          title: 'Too faint — hard to read',
          desc: 'Text blends into the background. Use the one-click fix below.',
        },
      } as Record<ReadabilityGrade, { title: string; desc: string }>,
      cvdSafe: 'Color-blindness friendly',
      cvdWarn: 'Hard to tell apart with red-green color blindness',
      fixButton: 'Auto-fix text to readable (keeps same color vibe)',
      fixApplied: (hex: string) => `Fixed to ${hex}`,
      previewHeading: 'Clear, comfortable headline',
      previewBody:
        'This is how regular paragraph text looks at normal reading size. If you can scan it effortlessly, your contrast is in a healthy spot.',
      previewBadge: 'Small tag · Button text',
    },
    compare: {
      title: '3. Are These Two Colors Too Similar?',
      subtitle: 'Plain-English comparison instead of raw ΔE numbers',
      colorA: 'Color A',
      colorB: 'Color B',
      useSeedA: 'Use active color',
      bands: {
        identical: {
          title: 'Virtually identical',
          desc: 'Human eyes cannot tell these two colors apart in normal use.',
        },
        'very-close': {
          title: 'Very close',
          desc: 'Only a tiny difference when placed side by side — avoid using them to show different states.',
        },
        'same-family': {
          title: 'Harmonious shade pair',
          desc: 'Clearly related, like a button and its hover state or a card and its border.',
        },
        distinct: {
          title: 'Clearly different',
          desc: 'Easy to tell apart at a glance — good for separating categories or tags.',
        },
        'strong-contrast': {
          title: 'Strong visual contrast',
          desc: 'Completely distinct colors with high visual separation.',
        },
      } as Record<SimilarityBand, { title: string; desc: string }>,
      brightnessLabel: 'Brightness',
      vividnessLabel: 'Vividness',
      hueLabel: 'Color family',
      cvdLabel: 'Color-blindness check',
      brightness: {
        same: 'About the same brightness',
        'a-brighter': 'Color A is noticeably brighter',
        'b-brighter': 'Color B is noticeably brighter',
      } as Record<BrightnessDiffKind, string>,
      vividness: {
        same: 'Similar vividness',
        'a-more-vivid': 'Color A is more saturated',
        'b-more-vivid': 'Color B is more saturated',
      } as Record<VividnessDiffKind, string>,
      hue: {
        same: 'Same color family (no hue shift)',
        slight: 'Slightly shifted hue',
        different: 'Different color families',
      } as Record<HueDiffKind, string>,
      cvdOk: 'Still easy to distinguish for color-blind users',
      cvdRisk: 'May look similar for red-green color-blind users',
    },
    kit: {
      title: '4. 5 Ready-to-Use Everyday Colors',
      subtitle: 'Auto-picked from your active Studio theme — click any swatch to copy HEX',
      roles: {
        primaryBtn: { name: 'Main Button', usage: 'Primary CTAs & active tabs' },
        primaryText: { name: 'Button Text', usage: 'Readable text on Main Button' },
        softBg: { name: 'Soft Tag Background', usage: 'Badges, pills & gentle highlights' },
        softText: { name: 'Soft Tag Text', usage: 'Readable text inside Soft Tag' },
        pageBg: { name: 'Page Background', usage: 'Clean canvas for cards & content' },
      },
    },
  },
  'zh-Hant': {
    title: '小白色彩助手',
    subtitle: '不看 Tone、Chroma 或 ΔE 專業數字——直接給你大白話結論、真實文字預覽與一鍵修復。',
    syncSeed: '同步工作台種子色',
    applyToStudio: '設為工作台種子色',
    copied: (hex: string) => `已複製 ${hex}`,
    checkup: {
      title: '1. 顏色體檢卡',
      subtitle: '一眼看懂這個顏色的性格，以及在真實螢幕上的表現',
      hueSlider: '色系方向',
      vividnessSlider: '濃淡（鮮豔度）',
      lightnessSlider: '明暗（深淺）',
      familyLabel: '色系與冷暖',
      vividnessLabel: '鮮豔度',
      lightnessLabel: '明暗度',
      comfortLabel: '螢幕與護眼建議',
      families: {
        neutral: '中性灰階',
        red: '紅色系',
        orange: '橙色系',
        yellow: '黃色系',
        green: '綠色系',
        teal: '青綠 / 青色系',
        blue: '藍色系',
        purple: '紫色系',
        pink: '粉紅 / 洋紅系',
      } as Record<HueFamilyId, string>,
      temps: {
        warm: '暖色調',
        cool: '冷色調',
        neutral: '中性調',
      } as Record<TemperatureId, string>,
      vividnessLevels: {
        muted: '素雅灰調',
        soft: '柔和自然',
        vivid: '飽滿鮮明',
        intense: '極高飽和（較刺眼）',
      } as Record<VividnessLevel, string>,
      lightnessLevels: {
        'very-dark': '極深暗色',
        dark: '深沉偏暗',
        medium: '居中適中',
        light: '明亮輕盈',
        'very-light': '極淺淡色',
      } as Record<LightnessLevel, string>,
      comforts: {
        'power-saving': 'OLED 螢幕省電友好，長時間看也不易疲勞',
        balanced: '明暗與純度適中，按鈕、卡片或大面積都很穩妥',
        'bright-intense': '視覺衝擊力強，適合做按鈕或重點標籤，不建議大面積鋪底',
      } as Record<ScreenComfortLevel, string>,
      blueTip: '高亮度藍紫色在 OLED 螢幕上較費電，常駐滿亮度顯示會加速藍光像素老化。',
      blackTip: '接近純黑最省電，但在 120Hz 手機快速滑動時容易出現輕微深色拖影。',
    },
    readability: {
      title: '2. 字放上去看得清嗎？',
      subtitle: '選好文字色與背景色，直接看大字、正文與按鈕的真實效果',
      textLabel: '文字顏色',
      bgLabel: '背景顏色',
      swap: '互換前背景',
      useSeedBg: '目前色當背景',
      useSeedText: '目前色當文字',
      grades: {
        great: {
          title: '清晰好讀（安全過關）',
          desc: '無論是大標題還是正文小字，大家都能輕鬆看清楚。',
        },
        'large-only': {
          title: '只適合大字或粗體',
          desc: '當正文小字會看得很吃力，建議把文字調深或調亮一點。',
        },
        poor: {
          title: '看不清（對比太弱）',
          desc: '文字快融進背景裡了，點下方按鈕可自動調到剛剛好能看清。',
        },
      } as Record<ReadabilityGrade, { title: string; desc: string }>,
      cvdSafe: '色覺障礙用戶也能看清',
      cvdWarn: '紅綠色弱用戶可能難以辨認',
      fixButton: '幫我調到剛剛好能看清（不偏色）',
      fixApplied: (hex: string) => `已微調為 ${hex}`,
      previewHeading: '清楚舒適的標題文字',
      previewBody:
        '這是一段正常閱讀大小的內文示範。如果你掃一眼就能毫不費力地讀完，代表這組文字與背景的深淺搭配非常健康。',
      previewBadge: '小標籤 · 按鈕文字',
    },
    compare: {
      title: '3. 這兩個顏色像不像？',
      subtitle: '把枯燥的 ΔE 數值翻譯成肉眼真實感受',
      colorA: '顏色 A',
      colorB: '顏色 B',
      useSeedA: '套用目前顏色',
      bands: {
        identical: {
          title: '幾乎一模一樣',
          desc: '肉眼在正常使用下幾乎分不出這兩個顏色的差別。',
        },
        'very-close': {
          title: '非常接近',
          desc: '只有並排細看才有一點點不同，不適合用來區分兩種不同狀態。',
        },
        'same-family': {
          title: '同色系和諧深淺差',
          desc: '看得出差別又很搭，適合做按鈕懸停態、卡片邊框或次要層級。',
        },
        distinct: {
          title: '明顯是兩個顏色',
          desc: '一眼就能區分開來，很適合用來區分不同分類或狀態標籤。',
        },
        'strong-contrast': {
          title: '對比強烈',
          desc: '視覺反差很大，能立刻抓住注意力。',
        },
      } as Record<SimilarityBand, { title: string; desc: string }>,
      brightnessLabel: '明暗差異',
      vividnessLabel: '濃淡差異',
      hueLabel: '色相方向',
      cvdLabel: '色盲辨識度',
      brightness: {
        same: '明暗差不多',
        'a-brighter': '顏色 A 明顯更亮',
        'b-brighter': '顏色 B 明顯更亮',
      } as Record<BrightnessDiffKind, string>,
      vividness: {
        same: '鮮豔度差不多',
        'a-more-vivid': '顏色 A 更鮮豔',
        'b-more-vivid': '顏色 B 更鮮豔',
      } as Record<VividnessDiffKind, string>,
      hue: {
        same: '同一色系，沒有偏色',
        slight: '色相稍微偏了一點',
        different: '屬於不同色系',
      } as Record<HueDiffKind, string>,
      cvdOk: '紅綠色弱用戶也能輕鬆區分',
      cvdRisk: '紅綠色弱用戶可能會覺得這兩色很像',
    },
    kit: {
      title: '4. 直接拿去用的 5 個日常配色',
      subtitle: '根據目前 Studio 主題自動挑好用途，點擊色塊即可複製 HEX',
      roles: {
        primaryBtn: { name: '主按鈕色', usage: '重要操作按鈕、選中狀態' },
        primaryText: { name: '按鈕上的字', usage: '放在主按鈕上的清晰文字' },
        softBg: { name: '標籤淡底色', usage: '徽章、膠囊標籤、溫和提示底色' },
        softText: { name: '標籤文字色', usage: '放在淡底色上的清晰文字' },
        pageBg: { name: '頁面背景底色', usage: '乾淨不刺眼的內容大背景' },
      },
    },
  },
} as const

export function SimpleView() {
  const { locale } = useI18n()
  const copy = SimpleCopy[locale]
  const dispatch = useAppDispatch()
  const studioSeedHex = useAppSelector((state) => state.studio.settledSourceHex)
  const scheme = useAppSelector(selectScheme)

  const [activeHex, setActiveHex] = useState(studioSeedHex)
  const [hexDraft, setHexDraft] = useState(studioSeedHex)
  const [fgHex, setFgHex] = useState('#FFFFFF')
  const [bgHex, setBgHex] = useState(studioSeedHex)
  const [compareA, setCompareA] = useState(studioSeedHex)
  const [compareB, setCompareB] = useState(scheme.secondary)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    setActiveHex(studioSeedHex)
    setHexDraft(studioSeedHex)
    setBgHex(studioSeedHex)
    setCompareA(studioSeedHex)
  }, [studioSeedHex])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(timer)
  }, [toast])

  const copyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex)
    setToast(copy.copied(hex))
  }

  const updateActiveHex = (nextHex: string) => {
    const normalized = normalizeHexInput(nextHex)
    if (!normalized) return
    setActiveHex(normalized)
    setHexDraft(normalized)
  }

  const profile = describeColorInPlainLanguage(activeHex)
  const readability = evaluateReadability(fgHex, bgHex)
  const comparison = compareTwoColorsPlainly(compareA, compareB)

  const handleSliderChange = (nextHue: number, nextVividnessPct: number, nextLightnessPct: number) => {
    const targetChroma = (nextVividnessPct / 100) * 0.28
    const nextHex = okyctToHex({ h: nextHue, c: targetChroma, t: nextLightnessPct })
    updateActiveHex(nextHex)
  }

  const kitItems = [
    { key: 'primaryBtn', hex: scheme.primary, ...copy.kit.roles.primaryBtn },
    { key: 'primaryText', hex: scheme.onPrimary, ...copy.kit.roles.primaryText },
    { key: 'softBg', hex: scheme.primaryContainer, ...copy.kit.roles.softBg },
    { key: 'softText', hex: scheme.onPrimaryContainer, ...copy.kit.roles.softText },
    { key: 'pageBg', hex: scheme.surface, ...copy.kit.roles.pageBg },
  ]

  const readabilityBadgeStyle =
    readability.grade === 'great'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : readability.grade === 'large-only'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-display tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neutral-500 shrink-0" />
            {copy.title}
          </h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {copy.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => updateActiveHex(studioSeedHex)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {copy.syncSeed}
          </button>
          <button
            type="button"
            onClick={() => dispatch(setSourceHex(activeHex))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Palette className="w-3.5 h-3.5" />
            {copy.applyToStudio}
          </button>
        </div>
      </header>

        {/* Card 1: Color Checkup */}
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                {copy.checkup.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{copy.checkup.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-pointer">
                <span
                  className="w-5 h-5 rounded-md border border-black/10 dark:border-white/15 shrink-0"
                  style={{ backgroundColor: activeHex }}
                />
                <input
                  type="color"
                  value={activeHex}
                  onChange={(e) => updateActiveHex(e.target.value)}
                  className="sr-only"
                  aria-label="Pick color"
                />
                <input
                  type="text"
                  value={hexDraft}
                  onChange={(e) => {
                    setHexDraft(e.target.value)
                    const norm = normalizeHexInput(e.target.value)
                    if (norm) setActiveHex(norm)
                  }}
                  className="w-20 bg-transparent font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none uppercase"
                  maxLength={7}
                />
              </label>
              <button
                type="button"
                onClick={() => copyHex(activeHex)}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title={activeHex}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Visual swatch + plain-language sliders */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-4">
              <div
                className="h-28 sm:h-32 w-full rounded-xl border border-black/10 dark:border-white/10 flex items-end justify-between p-3.5 transition-colors"
                style={{ backgroundColor: activeHex }}
              >
                <span
                  className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs"
                  style={{
                    color: profile.lightnessPct > 55 ? '#111827' : '#F9FAFB',
                    backgroundColor: profile.lightnessPct > 55 ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)',
                  }}
                >
                  {activeHex}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md backdrop-blur-xs"
                  style={{
                    color: profile.lightnessPct > 55 ? '#111827' : '#F9FAFB',
                    backgroundColor: profile.lightnessPct > 55 ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.45)',
                  }}
                >
                  {copy.checkup.families[profile.hueFamily]} · {copy.checkup.temps[profile.temperature]}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600 dark:text-neutral-400">{copy.checkup.hueSlider}</span>
                    <span className="font-mono text-neutral-500">{Math.round(profile.hue)}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={359}
                    value={Math.round(profile.hue)}
                    onChange={(e) => handleSliderChange(Number(e.target.value), profile.vividnessPct, profile.lightnessPct)}
                    className="w-full accent-neutral-900 dark:accent-neutral-100"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600 dark:text-neutral-400">{copy.checkup.vividnessSlider}</span>
                    <span className="font-mono text-neutral-500">{profile.vividnessPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={profile.vividnessPct}
                    onChange={(e) => handleSliderChange(profile.hue, Number(e.target.value), profile.lightnessPct)}
                    className="w-full accent-neutral-900 dark:accent-neutral-100"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-600 dark:text-neutral-400">{copy.checkup.lightnessSlider}</span>
                    <span className="font-mono text-neutral-500">{profile.lightnessPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={98}
                    value={Math.max(2, Math.min(98, profile.lightnessPct))}
                    onChange={(e) => handleSliderChange(profile.hue, profile.vividnessPct, Number(e.target.value))}
                    className="w-full accent-neutral-900 dark:accent-neutral-100"
                  />
                </div>
              </div>
            </div>

            {/* Plain-language metrics */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-3.5">
                <div className="text-[11px] font-medium text-neutral-500">{copy.checkup.familyLabel}</div>
                <div className="mt-1 text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {copy.checkup.families[profile.hueFamily]}
                </div>
                <div className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                  {copy.checkup.temps[profile.temperature]}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-3.5">
                <div className="flex justify-between text-[11px] font-medium text-neutral-500">
                  <span>{copy.checkup.vividnessLabel}</span>
                  <span>{profile.vividnessPct}%</span>
                </div>
                <div className="mt-1 text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {copy.checkup.vividnessLevels[profile.vividnessLevel]}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100 transition-all"
                    style={{ width: `${profile.vividnessPct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-3.5">
                <div className="flex justify-between text-[11px] font-medium text-neutral-500">
                  <span>{copy.checkup.lightnessLabel}</span>
                  <span>{profile.lightnessPct}%</span>
                </div>
                <div className="mt-1 text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {copy.checkup.lightnessLevels[profile.lightnessLevel]}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100 transition-all"
                    style={{ width: `${profile.lightnessPct}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-3.5">
                <div className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5" />
                  {copy.checkup.comfortLabel}
                </div>
                <div className="mt-1 text-xs font-semibold leading-relaxed text-neutral-900 dark:text-neutral-100">
                  {copy.checkup.comforts[profile.screenComfort]}
                </div>
                {(profile.isBlueHeavy || profile.isNearPureBlack) && (
                  <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                    {profile.isBlueHeavy ? copy.checkup.blueTip : copy.checkup.blackTip}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Card 2 & Card 3 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 2: Text Readability */}
          <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-xs flex flex-col gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                {copy.readability.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{copy.readability.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-pointer text-xs">
                <span className="text-neutral-500">{copy.readability.textLabel}</span>
                <span className="w-4 h-4 rounded border border-black/15" style={{ backgroundColor: fgHex }} />
                <span className="font-mono font-semibold">{fgHex}</span>
                <input
                  type="color"
                  value={fgHex}
                  onChange={(e) => setFgHex(e.target.value.toUpperCase())}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setFgHex(bgHex)
                  setBgHex(fgHex)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {copy.readability.swap}
              </button>

              <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-pointer text-xs">
                <span className="text-neutral-500">{copy.readability.bgLabel}</span>
                <span className="w-4 h-4 rounded border border-black/15" style={{ backgroundColor: bgHex }} />
                <span className="font-mono font-semibold">{bgHex}</span>
                <input
                  type="color"
                  value={bgHex}
                  onChange={(e) => setBgHex(e.target.value.toUpperCase())}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={() => setBgHex(activeHex)}
                className="px-2 py-1 rounded-md text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                {copy.readability.useSeedBg}
              </button>
              <button
                type="button"
                onClick={() => setFgHex(activeHex)}
                className="px-2 py-1 rounded-md text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                {copy.readability.useSeedText}
              </button>
            </div>

            {/* Live realistic preview */}
            <div
              className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-2 transition-colors"
              style={{ backgroundColor: bgHex, color: fgHex }}
            >
              <div className="text-base sm:text-lg font-bold leading-snug">{copy.readability.previewHeading}</div>
              <p className="text-xs sm:text-sm leading-relaxed opacity-95">{copy.readability.previewBody}</p>
              <div className="pt-1">
                <span
                  className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                  style={{ borderColor: 'currentColor' }}
                >
                  {copy.readability.previewBadge}
                </span>
              </div>
            </div>

            {/* Verdict + Auto-fix */}
            <div className={`rounded-xl border p-3.5 space-y-2 ${readabilityBadgeStyle}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {readability.grade === 'great' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  {copy.readability.grades[readability.grade].title}
                </div>
                <span className="font-mono text-xs opacity-80">{readability.contrastRatio.toFixed(1)}:1</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {copy.readability.grades[readability.grade].desc}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  {readability.cvdSafe ? copy.readability.cvdSafe : copy.readability.cvdWarn}
                </span>

                {readability.suggestedFgHex && (
                  <button
                    type="button"
                    onClick={() => {
                      const fixed = readability.suggestedFgHex!
                      setFgHex(fixed)
                      setToast(copy.readability.fixApplied(fixed))
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    {copy.readability.fixButton}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Card 3: Two-Color Plain Comparison */}
          <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-xs flex flex-col gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                {copy.compare.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{copy.compare.subtitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{copy.compare.colorA}</span>
                  <button
                    type="button"
                    onClick={() => setCompareA(activeHex)}
                    className="text-[11px] underline hover:text-neutral-800 dark:hover:text-neutral-200"
                  >
                    {copy.compare.useSeedA}
                  </button>
                </div>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-pointer">
                  <span className="w-8 h-8 rounded-lg border border-black/10 shrink-0" style={{ backgroundColor: compareA }} />
                  <span className="font-mono text-xs font-semibold">{compareA}</span>
                  <input
                    type="color"
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value.toUpperCase())}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs text-neutral-500">{copy.compare.colorB}</div>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-pointer">
                  <span className="w-8 h-8 rounded-lg border border-black/10 shrink-0" style={{ backgroundColor: compareB }} />
                  <span className="font-mono text-xs font-semibold">{compareB}</span>
                  <input
                    type="color"
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value.toUpperCase())}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Side-by-side split */}
            <div className="h-14 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 grid grid-cols-2">
              <div style={{ backgroundColor: compareA }} />
              <div style={{ backgroundColor: compareB }} />
            </div>

            {/* Verdict */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-3.5 space-y-3">
              <div>
                <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {copy.compare.bands[comparison.band].title}
                </div>
                <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                  {copy.compare.bands[comparison.band].desc}
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <div>
                  <dt className="text-[11px] text-neutral-500">{copy.compare.brightnessLabel}</dt>
                  <dd className="font-medium text-neutral-800 dark:text-neutral-200">
                    {copy.compare.brightness[comparison.brightnessDiff]}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-neutral-500">{copy.compare.vividnessLabel}</dt>
                  <dd className="font-medium text-neutral-800 dark:text-neutral-200">
                    {copy.compare.vividness[comparison.vividnessDiff]}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-neutral-500">{copy.compare.hueLabel}</dt>
                  <dd className="font-medium text-neutral-800 dark:text-neutral-200">
                    {copy.compare.hue[comparison.hueDiff]}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-neutral-500">{copy.compare.cvdLabel}</dt>
                  <dd className="font-medium text-neutral-800 dark:text-neutral-200">
                    {comparison.cvdDistinct ? copy.compare.cvdOk : copy.compare.cvdRisk}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        {/* Card 4: 5 Ready-to-Use Everyday Colors */}
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
              {copy.kit.title}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{copy.kit.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {kitItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => copyHex(item.hex)}
                className="group text-left rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
              >
                <div className="h-16 w-full border-b border-black/5 dark:border-white/5" style={{ backgroundColor: item.hex }} />
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{item.name}</span>
                    <Copy className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 shrink-0" />
                  </div>
                  <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">{item.hex}</div>
                  <p className="text-[11px] text-neutral-500 leading-snug">{item.usage}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold shadow-lg">
          <Check className="w-3.5 h-3.5" />
          {toast}
        </div>
      )}
    </div>
  )
}
