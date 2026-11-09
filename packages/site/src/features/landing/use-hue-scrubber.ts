import { useEffect, useRef, useState } from 'react'
import { hexToOkyct } from '../../color/math.ts'
import { useAppDispatch, useAppSelector } from '../../app/store.ts'
import { buildAbsoluteHueGradient, measureHueSeedPerformance } from './seedPerf.ts'
import { setLandingSeed } from './slice.ts'

export function useHueScrubber() {
  const dispatch = useAppDispatch()
  const seedHex = useAppSelector((state) => state.landing.seedHex)
  const [liveHue, setLiveHue] = useState<number | null>(null)
  const [liveHex, setLiveHex] = useState<string | null>(null)
  const pendingHueRef = useRef<number | null>(null)
  const rafRef = useRef(0)
  const gradient = buildAbsoluteHueGradient()

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

  return {
    displayHex: liveHex ?? seedHex,
    isLive: liveHue !== null,
    sliderValue: liveHue ?? hexToOkyct(seedHex).h,
    gradient,
    onLive(hue: number) {
      setLiveHue(hue)
      pendingHueRef.current = hue
      if (rafRef.current !== 0) {
        return
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0
        const pending = pendingHueRef.current
        pendingHueRef.current = null
        if (pending === null) {
          return
        }
        setLiveHex(measureHueSeedPerformance(pending).hex)
      })
    },
    onCommit(hue: number) {
      if (rafRef.current !== 0) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      pendingHueRef.current = null
      const finalHex = measureHueSeedPerformance(hue).hex
      setLiveHue(null)
      setLiveHex(null)
      dispatch(setLandingSeed(finalHex))
    },
  }
}
