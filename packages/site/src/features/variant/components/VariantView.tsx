import { useMemo, useState } from 'react'
import { Check, Copy, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { hexToOkyct, okyctToHex } from '../../../color/math.ts'
import { PaletteVariants, StandardTones, type PaletteVariant } from '../../../color/palettes.ts'
import { useI18n } from '../../../i18n/index.tsx'
import {
  VariantEditableRoles,
  isSourceWarmHue,
  type ResolvedVariantRoleCoord,
  type VariantEditableRole,
} from '../presets.ts'
import {
  selectCustomVariantPaletteSet,
  selectCustomVariantRoleCoords,
  selectCustomVariantSchemes,
} from '../selectors.ts'
import {
  loadVariantPreset,
  resetAllRoleOffsets,
  setCustomVariantEnabled,
  updateRoleOffset,
} from '../slice.ts'

const HueWheelSteps = 72
const QuickHueOffsets = [-60, -30, 0, 15, 30, 60, 90, 180] as const

const RoleLabels: Record<VariantEditableRole, { readonly en: string; readonly 'zh-Hant': string; readonly short: string }> = {
  primary: { en: 'Primary', 'zh-Hant': '主色 Primary', short: 'P' },
  secondary: { en: 'Secondary', 'zh-Hant': '次色 Secondary', short: 'S' },
  tertiary: { en: 'Tertiary', 'zh-Hant': '第三色 Tertiary', short: 'T' },
  neutral: { en: 'Neutral', 'zh-Hant': '中性 Neutral', short: 'N' },
  neutralVariant: { en: 'Neutral Variant', 'zh-Hant': '中性變體 NV', short: 'NV' },
}

const PresetLabels: Record<PaletteVariant, { readonly en: string; readonly 'zh-Hant': string }> = {
  tonalSpot: { en: 'Tonal Spot', 'zh-Hant': 'Tonal Spot' },
  vibrant: { en: 'Vibrant', 'zh-Hant': 'Vibrant' },
  expressive: { en: 'Expressive', 'zh-Hant': 'Expressive' },
  neutral: { en: 'Neutral', 'zh-Hant': 'Neutral' },
  monochrome: { en: 'Monochrome', 'zh-Hant': 'Monochrome' },
  fidelity: { en: 'Fidelity', 'zh-Hant': 'Fidelity' },
}

const CopyByLocale = {
  en: {
    title: 'Custom Variant Offset Studio',
    subtitle:
      'Fine-tune OKLab hue offsets (ΔH) and chroma envelopes for each palette role relative to the seed color.',
    presetLabel: 'Load Preset',
    applyToStudio: 'Apply to Studio',
    applyActive: 'Active across Studio',
    applyInactive: 'Preview only',
    reset: 'Reset',
    copyJson: 'Copy JSON',
    copied: (msg: string) => `Copied ${msg}`,
    wheelTitle: 'OKLab Polar Hue & Chroma Map',
    seedLabel: 'Seed',
    hueOffset: 'Hue Offset (ΔH)',
    chromaScale: 'Chroma Scale',
    chromaMin: 'Min C',
    chromaMax: 'Max C',
    resolved: 'Resolved',
    previewTitle: 'Live Scheme Preview',
    lightLabel: 'Light Mode',
    darkLabel: 'Dark Mode',
  },
  'zh-Hant': {
    title: '自定義變體角色偏移調校',
    subtitle:
      '在 OKLab 極座標平面上微調各調色盤角色相對於種子色的色相偏移角（ΔH）與色度縮放區間，並即時檢視明暗配色結果。',
    presetLabel: '載入預設變體',
    applyToStudio: '套用至 Studio',
    applyActive: '已全域同步',
    applyInactive: '僅頁面預覽',
    reset: '重設',
    copyJson: '複製 JSON',
    copied: (msg: string) => `已複製 ${msg}`,
    wheelTitle: 'OKLab 極座標色相與色度分佈',
    seedLabel: '種子色',
    hueOffset: '色相偏移 (ΔH)',
    chromaScale: '色度倍率',
    chromaMin: '最小色度',
    chromaMax: '最大色度',
    resolved: '實際座標',
    previewTitle: '即時配色方案預覽',
    lightLabel: '淺色模式',
    darkLabel: '深色模式',
  },
} as const

function PolarHueWheel({
  seedHue,
  coords,
  seedLabel,
}: {
  readonly seedHue: number
  readonly coords: Record<VariantEditableRole, ResolvedVariantRoleCoord>
  readonly seedLabel: string
}) {
  const ringDots = useMemo(() => {
    return Array.from({ length: HueWheelSteps }, (_, index) => {
      const angle = (index * 360) / HueWheelSteps
      const rad = ((angle - 90) * Math.PI) / 180
      const x = 120 + Math.cos(rad) * 96
      const y = 120 + Math.sin(rad) * 96
      const fill = okyctToHex({ h: angle, c: 0.13, t: 66 })
      return { angle, x, y, fill }
    })
  }, [])

  const seedRad = ((seedHue - 90) * Math.PI) / 180
  const seedX = 120 + Math.cos(seedRad) * 96
  const seedY = 120 + Math.sin(seedRad) * 96

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto select-none">
      <circle cx="120" cy="120" r="82" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
      <circle cx="120" cy="120" r="46" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
      <circle cx="120" cy="120" r="3" fill="currentColor" fillOpacity="0.4" />

      {ringDots.map((dot) => (
        <circle key={dot.angle} cx={dot.x} cy={dot.y} r="3.4" fill={dot.fill} />
      ))}

      <line
        x1="120"
        y1="120"
        x2={seedX}
        y2={seedY}
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <circle cx={seedX} cy={seedY} r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <text
        x="120"
        y="228"
        textAnchor="middle"
        className="text-[10px] font-mono fill-neutral-500 dark:fill-neutral-400"
      >
        {seedLabel} H = {seedHue.toFixed(1)}°
      </text>

      {VariantEditableRoles.map((role) => {
        const coord = coords[role]
        const rad = ((coord.hue - 90) * Math.PI) / 180
        const radius = Math.max(18, Math.min(84, (coord.chroma / 0.25) * 84))
        const px = 120 + Math.cos(rad) * radius
        const py = 120 + Math.sin(rad) * radius
        const swatch = okyctToHex({ h: coord.hue, c: Math.max(0.04, coord.chroma), t: 58 })
        return (
          <g key={role}>
            <line x1="120" y1="120" x2={px} y2={py} stroke={swatch} strokeWidth="2" strokeOpacity="0.8" />
            <circle cx={px} cy={py} r="7.5" fill={swatch} stroke="#ffffff" strokeWidth="1.5" />
            <text
              x={px}
              y={py + 3}
              textAnchor="middle"
              className="text-[8px] font-bold fill-white pointer-events-none"
            >
              {RoleLabels[role].short}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function VariantView() {
  const { locale } = useI18n()
  const copy = CopyByLocale[locale]
  const dispatch = useAppDispatch()

  const sourceHex = useAppSelector((state) => state.studio.settledSourceHex)
  const enabled = useAppSelector((state) => state.variant.enabled)
  const basePreset = useAppSelector((state) => state.variant.basePreset)
  const roles = useAppSelector((state) => state.variant.roles)

  const coords = useAppSelector(selectCustomVariantRoleCoords)
  const palettes = useAppSelector(selectCustomVariantPaletteSet)
  const schemes = useAppSelector(selectCustomVariantSchemes)

  const [toast, setToast] = useState<string | null>(null)
  const seedHue = hexToOkyct(sourceHex).h
  const warmHue = isSourceWarmHue(sourceHex)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 1600)
  }

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    showToast(copy.copied(label))
  }

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-4 sm:gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 max-w-[1600px] mx-auto w-full">
      {toast ? (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{toast}</span>
        </div>
      ) : null}

      <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <SlidersHorizontal className="w-5 h-5 mt-0.5 text-neutral-500 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight">{copy.title}</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{copy.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(setCustomVariantEnabled(!enabled))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                enabled
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              {copy.applyToStudio}: {enabled ? copy.applyActive : copy.applyInactive}
            </button>

            <button
              type="button"
              onClick={() => dispatch(resetAllRoleOffsets({ warmHue }))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{copy.reset}</span>
            </button>

            <button
              type="button"
              onClick={() => copyText(JSON.stringify(roles, null, 2), 'Variant JSON')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copy.copyJson}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mr-1">
            {copy.presetLabel}:
          </span>
          {PaletteVariants.map((preset) => {
            const active = basePreset === preset
            return (
              <button
                key={preset}
                type="button"
                onClick={() => dispatch(loadVariantPreset({ variant: preset, warmHue }))}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {PresetLabels[preset][locale]}
              </button>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        <section className="xl:col-span-4 p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">{copy.wheelTitle}</h2>
          <PolarHueWheel seedHue={seedHue} coords={coords} seedLabel={copy.seedLabel} />

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs font-mono">
            {VariantEditableRoles.map((role) => {
              const c = coords[role]
              const swatch = palettes[role].tone(50)
              return (
                <div key={role} className="py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: swatch }} />
                    <span className="font-sans font-medium">{RoleLabels[role][locale]}</span>
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400">
                    ΔH {c.hueOffset >= 0 ? `+${c.hueOffset}` : c.hueOffset}° · H {c.hue.toFixed(1)}° · C{' '}
                    {c.chroma.toFixed(3)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="xl:col-span-8 flex flex-col gap-4">
          {VariantEditableRoles.map((role) => {
            const cfg = roles[role]
            const coord = coords[role]
            const palette = palettes[role]

            return (
              <div
                key={role}
                className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-md border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: palette.tone(40) }}
                    />
                    <span className="text-sm font-semibold">{RoleLabels[role][locale]}</span>
                  </div>
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {copy.resolved}: H {coord.hue.toFixed(1)}° / C {coord.chroma.toFixed(3)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">{copy.hueOffset}</span>
                      <span className="font-mono font-semibold">
                        {cfg.hueOffset >= 0 ? `+${cfg.hueOffset}` : cfg.hueOffset}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={cfg.hueOffset}
                      onChange={(e) =>
                        dispatch(updateRoleOffset({ role, patch: { hueOffset: Number(e.target.value) } }))
                      }
                      className="w-full accent-neutral-900 dark:accent-neutral-100"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">{copy.chromaScale}</span>
                      <span className="font-mono font-semibold">{cfg.chromaScale.toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.05}
                      value={cfg.chromaScale}
                      onChange={(e) =>
                        dispatch(updateRoleOffset({ role, patch: { chromaScale: Number(e.target.value) } }))
                      }
                      className="w-full accent-neutral-900 dark:accent-neutral-100"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">{copy.chromaMin}</span>
                      <span className="font-mono font-semibold">{cfg.chromaMin.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.3}
                      step={0.005}
                      value={cfg.chromaMin}
                      onChange={(e) =>
                        dispatch(updateRoleOffset({ role, patch: { chromaMin: Number(e.target.value) } }))
                      }
                      className="w-full accent-neutral-900 dark:accent-neutral-100"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">{copy.chromaMax}</span>
                      <span className="font-mono font-semibold">{cfg.chromaMax.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.4}
                      step={0.005}
                      value={cfg.chromaMax}
                      onChange={(e) =>
                        dispatch(updateRoleOffset({ role, patch: { chromaMax: Number(e.target.value) } }))
                      }
                      className="w-full accent-neutral-900 dark:accent-neutral-100"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-1">
                  {QuickHueOffsets.map((offset) => (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => dispatch(updateRoleOffset({ role, patch: { hueOffset: offset } }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                        cfg.hueOffset === offset
                          ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {offset >= 0 ? `+${offset}` : offset}°
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-13 rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
                  {StandardTones.map((tone) => {
                    const hex = palette.tone(tone)
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => copyText(hex, `${RoleLabels[role].short}${tone}: ${hex}`)}
                        title={`T${tone}: ${hex}`}
                        className="h-7 flex items-center justify-center text-[10px] font-mono transition-transform hover:scale-105"
                        style={{
                          backgroundColor: hex,
                          color: tone >= 50 ? '#111111' : '#ffffff',
                        }}
                      >
                        {tone}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      </div>

      <section className="p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{copy.previewTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { label: copy.lightLabel, scheme: schemes.light },
            { label: copy.darkLabel, scheme: schemes.dark },
          ] as const).map(({ label, scheme }) => (
            <div
              key={label}
              className="p-4 rounded-xl border flex flex-col gap-3"
              style={{
                backgroundColor: scheme.surface,
                color: scheme.onSurface,
                borderColor: scheme.outlineVariant,
              }}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{label}</span>
                <span className="font-mono opacity-75">{scheme.surface}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: scheme.primary, color: scheme.onPrimary }}
                >
                  Primary
                </div>
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: scheme.secondary, color: scheme.onSecondary }}
                >
                  Secondary
                </div>
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: scheme.tertiary, color: scheme.onTertiary }}
                >
                  Tertiary
                </div>
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: scheme.primaryContainer, color: scheme.onPrimaryContainer }}
                >
                  Primary Ctn
                </div>
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: scheme.secondaryContainer, color: scheme.onSecondaryContainer }}
                >
                  Secondary Ctn
                </div>
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: scheme.tertiaryContainer, color: scheme.onTertiaryContainer }}
                >
                  Tertiary Ctn
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
