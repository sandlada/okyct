
import { useRef } from 'react'
import { X, Upload, Plus, Trash2, Palette } from 'lucide-react'
import { useI18n } from '../../../i18n/index.tsx'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { selectEmissiveChoices } from '../selectors.ts'
import {
  addCustomColor,
  removeCustomColor,
  setAntiFringing,
  setBurnInGuard,
  setContrastLevel,
  setCvdType,
  setEmissiveProfile,
  setHarmonize,
  setMobileDrawerOpen,
  setSourceHex,
  setVariant,
  updateCustomColor,
  type CvdType,
  type PaletteVariant,
} from '../slice.ts'
import { useQuantizer } from '../use-quantizer.ts'
import { Tabs } from '../../../ui/Tabs.tsx'

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
  imageQuantizer: 'From image',
  uploadImage: 'Upload',
  sceneNames: {
    aurora: 'Aurora',
    'sunset-amber': 'Molten',
    botanical: 'Tropics',
    'cyber-atelier': 'Neon',
  } as Record<string, string>,
  generationVariant: 'Variant',
  contrastLevel: 'Contrast',
  emissivePanel: 'Display profile',
  panelShortNames: {
    'standard-lcd': 'LCD baseline',
    'oled-true-black': 'OLED true black',
    'amoled-anti-smear': 'AMOLED anti-smear',
    'micro-oled-xr': 'MicroOLED XR',
  } as Record<string, string>,
  burnInGuard: 'Burn-in guard',
  fringingGuard: 'Anti-fringing',

  customColorsTitle: (count: number) => `Custom colors (${count})`,
  addSemantic: 'Add semantic',
  customColorLabel: (index: number) => `Extended semantic ${index}`,
  removeCustomColor: 'Remove this extended color',
  harmonizeTowardPrimary: 'Harmonize',
  harmonizeSemantic: 'Semantic harmonize',
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
  imageQuantizer: '從影像取色',
  uploadImage: '上傳',
  sceneNames: {
    aurora: '極光冰川',
    'sunset-amber': '落日熔金',
    botanical: '熱帶雨林',
    'cyber-atelier': '霓虹賽博',
  },
  generationVariant: '變體',
  contrastLevel: '對比度',
  emissivePanel: '顯示設定',
  panelShortNames: {
    'standard-lcd': 'LCD 標準參照',
    'oled-true-black': 'OLED 純黑省電',
    'amoled-anti-smear': 'AMOLED 防拖影',
    'micro-oled-xr': 'MicroOLED XR',
  },
  burnInGuard: '防燒屏',
  fringingGuard: '防眩光',

  customColorsTitle: (count: number) => `自訂色（${count}）`,
  addSemantic: '新增語意',
  customColorLabel: (index: number) => `擴展語意 ${index}`,
  removeCustomColor: '移除此擴展色',
  harmonizeTowardPrimary: '和諧',
  harmonizeSemantic: '語意和諧',
  cvdStandard: '正常視覺',
  cvdProtanopia: '紅色盲（Protanopia）',
  cvdDeuteranopia: '綠色盲（Deuteranopia）',
  cvdTritanopia: '藍色盲（Tritanopia）',
  cvdAchromatopsia: '全色盲（Achromatopsia）',
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

export function SidebarControls({ closable = false }: { readonly closable?: boolean }) {
  const { locale } = useI18n()
  const copy = Copy[locale]
  const dispatch = useAppDispatch()
  const sourceHex = useAppSelector((state) => state.studio.sourceHex)
  const variant = useAppSelector((state) => state.studio.variant)
  const contrastLevel = useAppSelector((state) => state.studio.contrastLevel)
  const harmonize = useAppSelector((state) => state.studio.harmonize)
  const cvdType = useAppSelector((state) => state.studio.cvdType)
  const customColors = useAppSelector((state) => state.studio.customColors)
  const emissiveProfile = useAppSelector((state) => state.studio.emissiveProfile)
  const burnInGuard = useAppSelector((state) => state.studio.burnInGuard)
  const antiFringing = useAppSelector((state) => state.studio.antiFringing)
  const quantCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const quantizer = useQuantizer(quantCanvasRef)
  const { scenes, activeSceneId, seeds: extractedSeeds, selectScene, upload } = quantizer

  const handleAddCustomColor = () => {
    dispatch(addCustomColor(copy.customColorLabel(customColors.length + 1)))
  }

  return (
    <aside className="w-full md:w-72 h-full flex-1 min-h-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4 flex flex-col gap-4 overflow-y-auto text-neutral-900 dark:text-neutral-100 pb-28 md:pb-5 overscroll-contain">
      {/* 移动端抽屉专属顶栏 */}
      {closable && (
        <div className="md:hidden flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <span className="font-bold text-sm">{copy.parametersConsole}</span>
          <button
            onClick={() => dispatch(setMobileDrawerOpen(false))}
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
              onChange={(e) => dispatch(setSourceHex(e.target.value))}
              className="absolute -top-3 -left-3 w-20 h-20 cursor-pointer border-0 p-0"
              title={copy.pickColor}
            />
          </div>
          <input
            type="text"
            value={sourceHex}
            onChange={(e) => dispatch(setSourceHex(e.target.value))}
            className="flex-1 px-3 py-2 text-sm font-mono border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            placeholder="#1A73E8"
          />
        </div>

        {/* 经典预设色块 */}
        <div className="grid grid-cols-6 gap-1.5 pt-1">
          {PRESET_SEEDS.map((preset) => (
            <button
              key={preset.hex}
              onClick={() => dispatch(setSourceHex(preset.hex))}
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

      </section>

      <section className="flex flex-col gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {copy.imageQuantizer}
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-medium flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span>{copy.uploadImage}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file !== undefined) {
                upload(file)
              }
            }}
            className="hidden"
          />
        </div>

        <Tabs
          label={copy.imageQuantizer}
          appearance="pill"
          size="sm"
          wrap
          columns={4}
          value={scenes.some((scene) => scene.id === activeSceneId) ? activeSceneId : scenes[0].id}
          onChange={selectScene}
          options={scenes.map((scene) => ({
            id: scene.id,
            label: copy.sceneNames[scene.id] ?? scene.name,
          }))}
        />

        <div className="flex items-center gap-2">
          <canvas
            ref={quantCanvasRef}
            width={72}
            height={48}
            className="w-16 h-11 rounded border border-neutral-200 dark:border-neutral-700 shrink-0 object-cover"
          />
          <div className="flex flex-wrap gap-1.5 flex-1">
            {extractedSeeds.map((seed) => (
              <button
                key={seed.hex}
                type="button"
                onClick={() => dispatch(setSourceHex(seed.hex))}
                className={`w-7 h-7 rounded-md border transition-all ${
                  sourceHex.toLowerCase() === seed.hex.toLowerCase()
                    ? 'border-neutral-900 dark:border-white ring-1 ring-neutral-900 dark:ring-white'
                    : 'border-neutral-200 dark:border-neutral-700 hover:scale-105'
                }`}
                style={{ backgroundColor: seed.hex }}
                title={seed.hex}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {copy.generationVariant}
        </label>
        <Tabs
          label={copy.generationVariant}
          appearance="outline"
          size="md"
          wrap
          columns={2}
          value={variant}
          onChange={(id) => dispatch(setVariant(id))}
          options={VARIANTS.map((item) => ({ id: item.id, label: item.label }))}
        />
      </section>

      <section className="flex flex-col gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {copy.contrastLevel}
          </label>
          <span className="text-xs font-mono tabular-nums text-neutral-600 dark:text-neutral-300">
            {contrastLevel > 0 ? `+${contrastLevel.toFixed(1)}` : contrastLevel.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="-0.5"
          max="1.0"
          step="0.1"
          value={contrastLevel}
          onChange={(e) => dispatch(setContrastLevel(parseFloat(e.target.value)))}
          className="w-full accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
        />
      </section>

      <section className="flex flex-col gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {copy.emissivePanel}
        </label>
        <Tabs
          label={copy.emissivePanel}
          appearance="pill"
          size="sm"
          wrap
          columns={2}
          value={emissiveProfile}
          onChange={(id) => dispatch(setEmissiveProfile(id))}
          options={selectEmissiveChoices.map((choice) => ({
            id: choice.id,
            label: copy.panelShortNames[choice.id],
          }))}
        />

        <div className="flex flex-col gap-1">
          <label className="flex items-center justify-between gap-2 text-[11px] cursor-pointer">
            <span>{copy.burnInGuard}</span>
            <input
              type="checkbox"
              checked={burnInGuard}
              onChange={(e) => dispatch(setBurnInGuard(e.target.checked))}
              className="w-3.5 h-3.5 accent-neutral-900 dark:accent-neutral-100"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-[11px] cursor-pointer">
            <span>{copy.fringingGuard}</span>
            <input
              type="checkbox"
              checked={antiFringing}
              onChange={(e) => dispatch(setAntiFringing(e.target.checked))}
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
                    onChange={(e) => dispatch(updateCustomColor({ id: item.id, patch: { sourceHex: e.target.value } }))}
                    className="w-5 h-5 rounded border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      dispatch(updateCustomColor({
                        id: item.id,
                        patch: { name: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') },
                      }))
                    }
                    className="text-xs font-mono font-semibold bg-transparent border-b border-transparent focus:border-neutral-400 outline-none w-24 truncate"
                    placeholder="roleName"
                  />
                </div>
                <button
                  onClick={() => dispatch(removeCustomColor(item.id))}
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
                      dispatch(updateCustomColor({ id: item.id, patch: { harmonize: e.target.checked } }))
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

      <section className="flex flex-col gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-800">
        <label className="flex items-center justify-between gap-2 text-[11px] cursor-pointer">
          <span>{copy.harmonizeSemantic}</span>
          <input
            type="checkbox"
            checked={harmonize}
            onChange={(e) => dispatch(setHarmonize(e.target.checked))}
            className="w-3.5 h-3.5 accent-neutral-900 dark:accent-neutral-100"
          />
        </label>
        <select
          value={cvdType}
          onChange={(e) => dispatch(setCvdType(e.target.value as CvdType))}
          className="w-full px-2 py-1.5 text-[11px] border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
        >
          <option value="none">{copy.cvdStandard}</option>
          <option value="protanopia">{copy.cvdProtanopia}</option>
          <option value="deuteranopia">{copy.cvdDeuteranopia}</option>
          <option value="tritanopia">{copy.cvdTritanopia}</option>
          <option value="achromatopsia">{copy.cvdAchromatopsia}</option>
        </select>
      </section>
    </aside>
  )
}

