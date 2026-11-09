/**
 * 基准区种子拉杆：T60 色相连续试探，rAF 节流即时预览、松手提交。
 * 重型基准矩阵只在提交后重算，拖动中仅更新滑杆与 hex 读数。
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/index.tsx'
import { hexToOkyct } from '../color/math.ts'
import { HuePerfSlider } from './HuePerfSlider.tsx'
import { buildAbsoluteHueGradient, measureHueSeedPerformance } from './seedPerf.ts'

export interface HueSeedScrubberProps {
  readonly seedHex: string
  readonly onCommit: (hex: string) => void
}

export function HueSeedScrubber({ seedHex, onCommit }: HueSeedScrubberProps) {
  const { t } = useI18n()
  const [liveHue, setLiveHue] = useState<number | null>(null)
  const [liveHex, setLiveHex] = useState<string | null>(null)
  const pendingHueRef = useRef<number | null>(null)
  const rafRef = useRef(0)

  const seedHue = useMemo(() => hexToOkyct(seedHex).h, [seedHex])
  const gradient = useMemo(() => buildAbsoluteHueGradient(), [])

  useEffect(() => {
    return () => {
      if (rafRef.current !== 0) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setLiveHue(null)
    setLiveHex(null)
    pendingHueRef.current = null
  }, [seedHex])

  const handleLive = (hue: number) => {
    setLiveHue(hue)
    if (rafRef.current !== 0) {
      pendingHueRef.current = hue
      return
    }
    pendingHueRef.current = hue
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0
      const pending = pendingHueRef.current
      pendingHueRef.current = null
      if (pending === null) {
        return
      }
      setLiveHex(measureHueSeedPerformance(pending).hex)
    })
  }

  const handleCommit = (hue: number) => {
    if (rafRef.current !== 0) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    pendingHueRef.current = null
    const final = measureHueSeedPerformance(hue)
    setLiveHue(null)
    setLiveHex(null)
    onCommit(final.hex)
  }

  const displayHex = liveHex ?? seedHex
  const isLive = liveHue !== null

  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px] tabular-nums tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
        <span className="text-sm font-semibold tracking-normal text-neutral-900 dark:text-neutral-100">
          {displayHex.toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {isLive ? (
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
          value={liveHue ?? seedHue}
          gradient={gradient}
          label={t('hero.inspector.sliderLabel')}
          onLiveChange={handleLive}
          onCommit={handleCommit}
        />
      </div>
    </div>
  )
}
