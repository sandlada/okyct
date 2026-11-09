/**
 * T60 色相彩色拉杆：原生 range 保证键盘与指针无障碍，
 * 父组件负责 rAF 节流与松手提交，这里只做即时透传。
 */

import type { ChangeEvent, KeyboardEvent, PointerEvent } from 'react'

export interface HuePerfSliderProps {
  readonly value: number
  readonly gradient: string
  readonly label: string
  readonly onLiveChange: (hue: number) => void
  readonly onCommit: (hue: number) => void
}

export function HuePerfSlider({ value, gradient, label, onLiveChange, onCommit }: HuePerfSliderProps) {
  const handleLive = (event: ChangeEvent<HTMLInputElement>) => {
    onLiveChange(Number(event.target.value))
  }

  const handlePointerUp = (event: PointerEvent<HTMLInputElement>) => {
    onCommit(Number(event.currentTarget.value))
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    onCommit(Number(event.currentTarget.value))
  }

  return (
    <div className="w-full">
      <input
        type="range"
        min={0}
        max={360}
        step={0.5}
        value={value}
        aria-label={label}
        aria-valuetext={`H ${value.toFixed(1)}°`}
        onChange={handleLive}
        onPointerUp={handlePointerUp}
        onKeyUp={handleKeyUp}
        style={{ background: gradient }}
        className="h-3 w-full cursor-pointer appearance-none rounded-full outline-none ring-1 ring-inset ring-black/10 transition-shadow focus-visible:ring-2 focus-visible:ring-neutral-900 dark:ring-white/20 dark:focus-visible:ring-white [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-neutral-900 [&::-moz-range-thumb]:shadow-lg dark:[&::-moz-range-thumb]:border-neutral-900 dark:[&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-neutral-900 [&::-webkit-slider-thumb]:shadow-lg dark:[&::-webkit-slider-thumb]:border-neutral-900 dark:[&::-webkit-slider-thumb]:bg-white"
      />
    </div>
  )
}
