
import { useEffect, useRef } from 'react'
import { Cpu, Zap } from 'lucide-react'
import { useI18n } from '../../../i18n/index.tsx'
import { useAppDispatch, useAppSelector } from '../../../app/store.ts'
import { commitTheme } from '../../theme/use-theme.ts'
import { ScrollSpeeds, toggleOledRunning, setOledSpeed, type ScrollSpeedId } from '../slice.ts'
import { selectOledScreen, type ScrollColumnColors } from '../selectors.ts'

const EnglishCopy = {
  heading: 'OLED',
  hintDark: 'Use dark theme for power metrics',
  scrollLab: '120 Hz scroll',
  scrollLabHint: 'One continuous list. OLED gaps are T=0; AMOLED gaps stay at the T=4 bias.',
  pause: 'Pause',
  play: 'Play',
  speeds: { slow: 'Slow', standard: 'Standard', fast: 'Fast' },
  canvasOled: (ms: number) => `OLED T=0 · τ rise ${ms} ms`,
  canvasAmoled: (ms: number) => `AMOLED T=4 · τ rise ${ms} ms`,
}

const TraditionalCopy: typeof EnglishCopy = {
  heading: 'OLED',
  hintDark: '深色模式查看功耗',
  scrollLab: '120 Hz 捲動',
  scrollLabHint: '同一條無限列表。OLED 行距為 T=0；AMOLED 行距保持 T=4 偏壓。',
  pause: '暫停',
  play: '播放',
  speeds: { slow: '慢', standard: '標準', fast: '快' },
  canvasOled: (ms: number) => `OLED T=0 · τ 起輝 ${ms} ms`,
  canvasAmoled: (ms: number) => `AMOLED T=4 · τ 起輝 ${ms} ms`,
}

const Copy = { en: EnglishCopy, 'zh-Hant': TraditionalCopy } as const

const ScrollRowCount = 6

function drawInfiniteScrollColumn(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: number,
  colors: ScrollColumnColors,
) {
  const pitch = height / ScrollRowCount
  const rowH = pitch * 0.82
  const firstIndex = Math.floor(offset / pitch) - 1
  const lastIndex = firstIndex + ScrollRowCount + 3
  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, width, height)
  for (let index = firstIndex; index <= lastIndex; index++) {
    const y = index * pitch - offset
    ctx.fillStyle = index % 2 === 0 ? colors.row : colors.rowAlt
    ctx.fillRect(0, y, width, rowH)
    ctx.fillStyle = colors.accent
    ctx.fillRect(0, y, Math.max(2, width * 0.012), rowH)
  }
}

export function OledView() {
  const { locale } = useI18n()
  const copy = Copy[locale]
  const dispatch = useAppDispatch()
  const screen = useAppSelector(selectOledScreen)
  const smearCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const smearStageRef = useRef<HTMLDivElement | null>(null)
  const scrollSpeedRef = useRef(140)
  scrollSpeedRef.current = ScrollSpeeds.find((speed) => speed.id === screen.speedId)?.pxPerSec ?? 140

  useEffect(() => {
    const canvas = smearCanvasRef.current
    const stage = smearStageRef.current
    if (!canvas || !stage) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let animId = 0
    let offset = 0
    let logicalW = 720
    let logicalH = 300
    let canvasDpr = 1
    let lastTimestamp = 0
    let pageVisible = document.visibilityState === 'visible'
    const oledColors = screen.oledColors
    const amoledColors = screen.amoledColors
    const running = screen.running

    const syncCanvasSize = () => {
      const cssW = Math.max(stage.clientWidth, 320)
      const cssH = cssW * (300 / 720)
      canvasDpr = Math.min(window.devicePixelRatio || 1, 2)
      logicalW = cssW
      logicalH = cssH
      canvas.width = Math.round(cssW * canvasDpr)
      canvas.height = Math.round(cssH * canvasDpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
    }
    const onVisibility = () => {
      pageVisible = document.visibilityState === 'visible'
      if (pageVisible) lastTimestamp = 0
    }
    syncCanvasSize()
    const resizeObserver = new ResizeObserver(syncCanvasSize)
    resizeObserver.observe(stage)
    document.addEventListener('visibilitychange', onVisibility)
    const renderFrame = (timestamp: number) => {
      if (!pageVisible) {
        animId = requestAnimationFrame(renderFrame)
        return
      }
      const dtMs = lastTimestamp === 0 ? 1000 / 120 : Math.min(48, timestamp - lastTimestamp)
      lastTimestamp = timestamp
      if (running) offset += scrollSpeedRef.current * (dtMs / 1000)
      const halfW = logicalW / 2
      ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0)
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, halfW, logicalH)
      ctx.clip()
      drawInfiniteScrollColumn(ctx, halfW, logicalH, offset, oledColors)
      ctx.restore()
      ctx.save()
      ctx.beginPath()
      ctx.rect(halfW, 0, halfW, logicalH)
      ctx.clip()
      ctx.translate(halfW, 0)
      drawInfiniteScrollColumn(ctx, halfW, logicalH, offset, amoledColors)
      ctx.restore()
      animId = requestAnimationFrame(renderFrame)
    }
    animId = requestAnimationFrame(renderFrame)
    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [screen])

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-5 sm:gap-6 bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-24 md:pb-6 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm sm:text-base font-bold font-display tracking-tight flex items-center gap-2">
          <Cpu className="w-4 h-4 text-neutral-500 shrink-0" />
          {copy.heading}
        </h2>
        {!screen.isDark && (
          <button
            type="button"
            onClick={() => dispatch(commitTheme('dark'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {copy.hintDark}
          </button>
        )}
      </div>
      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {copy.scrollLab}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">{copy.scrollLabHint}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => dispatch(toggleOledRunning())}
              className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-mono hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {screen.running ? copy.pause : copy.play}
            </button>
            <select
              value={screen.speedId}
              onChange={(event) => dispatch(setOledSpeed(event.target.value as ScrollSpeedId))}
              aria-label={copy.scrollLab}
              className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono"
            >
              {ScrollSpeeds.map((speed) => (
                <option key={speed.id} value={speed.id}>
                  {copy.speeds[speed.id]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 px-0.5">
          <span className="text-rose-600 dark:text-rose-400">{copy.canvasOled(screen.oledRiseMs)}</span>
          <span className="text-emerald-600 dark:text-emerald-400 sm:text-right">
            {copy.canvasAmoled(screen.amoledRiseMs)}
          </span>
        </div>
        <div
          ref={smearStageRef}
          className="rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-black w-full shadow-[inset_-1px_0_0_rgba(255,255,255,0.12)]"
        >
          <canvas ref={smearCanvasRef} className="block max-w-full" />
        </div>
      </section>
    </div>
  )
}
