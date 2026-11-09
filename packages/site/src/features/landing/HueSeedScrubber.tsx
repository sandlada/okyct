/**
 * 基准区种子拉杆：T60 色相连续试探，rAF 节流即时预览、松手提交。
 * 重型基准矩阵只在提交后重算，拖动中仅更新滑杆与 hex 读数。
 */

import { useI18n } from '../../i18n/index.tsx'
import { HuePerfSlider } from './HuePerfSlider.tsx'
import { useHueScrubber } from './use-hue-scrubber.ts'

export function HueSeedScrubber() {
  const { t } = useI18n()
  const scrub = useHueScrubber()

  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
        <span className="text-sm font-semibold tracking-normal text-neutral-900 dark:text-neutral-100">
          {scrub.displayHex.toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {scrub.isLive ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              {t('hero.inspector.live')}
            </>
          ) : (
            t('hero.inspector.sliderHint')
          )}
        </span>
      </div>
      <div className="mt-2">
        <HuePerfSlider
          value={scrub.sliderValue}
          gradient={scrub.gradient}
          label={t('hero.inspector.sliderLabel')}
          onLiveChange={scrub.onLive}
          onCommit={scrub.onCommit}
        />
      </div>
    </div>
  )
}
