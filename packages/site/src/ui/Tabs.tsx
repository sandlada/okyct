import { Tab, TabGroup, TabList } from '@headlessui/react'
import { useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'

export const TabSizes = ['sm', 'md'] as const
export type TabSize = (typeof TabSizes)[number]

export const TabAppearances = ['pill', 'soft', 'underline', 'dock', 'outline', 'ghost'] as const
export type TabAppearance = (typeof TabAppearances)[number]

export interface TabOption<Id extends string> {
  id: Id
  label: ReactNode
  icon?: ComponentType<{ className?: string }>
}

interface TabsProps<Id extends string> {
  label: string
  value: Id
  options: readonly TabOption<Id>[]
  onChange: (id: Id) => void
  size?: TabSize
  wrap?: boolean
  columns?: 2 | 4
  appearance?: TabAppearance
  className?: string
}

const SizeClass: Record<TabSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs',
}

const SelectedClass: Record<TabAppearance, string> = {
  pill: 'data-selected:bg-neutral-900 data-selected:text-white data-selected:font-medium dark:data-selected:bg-neutral-100 dark:data-selected:text-neutral-900',
  soft: 'data-selected:bg-white data-selected:text-neutral-900 data-selected:shadow-xs data-selected:font-bold dark:data-selected:bg-neutral-700 dark:data-selected:text-neutral-100',
  underline:
    'border-b-2 border-transparent data-selected:border-neutral-900 data-selected:text-neutral-900 data-selected:font-semibold dark:data-selected:border-neutral-100 dark:data-selected:text-neutral-100',
  dock: 'data-selected:text-neutral-900 data-selected:font-bold dark:data-selected:text-neutral-100',
  outline:
    'border border-neutral-200 bg-white data-selected:border-neutral-900 data-selected:bg-neutral-900 data-selected:text-white dark:border-neutral-800 dark:bg-neutral-800/40 dark:data-selected:border-white dark:data-selected:bg-white dark:data-selected:text-neutral-900',
  ghost:
    'border border-neutral-200 bg-white text-neutral-800 data-selected:border-neutral-900 data-selected:bg-neutral-900/5 data-selected:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-200 dark:data-selected:border-white dark:data-selected:bg-white/10 dark:data-selected:text-neutral-100',
}

function listClass(appearance: TabAppearance, wrap: boolean, columns?: 2 | 4, balanced = false): string {
  if (appearance === 'dock') {
    return 'grid grid-cols-4 w-full'
  }
  if (balanced) {
    const track = appearance === 'outline' || appearance === 'ghost'
      ? ''
      : 'rounded-lg bg-neutral-100 dark:bg-neutral-800'
    const padding = appearance === 'pill' ? 'p-1' : appearance === 'soft' ? 'p-0.5' : ''
    return `grid w-full gap-1 ${padding} ${track}`
  }
  if (columns === 4 || columns === 2) {
    const cols = columns === 4 ? 'grid-cols-4' : 'grid-cols-2'
    const track = appearance === 'pill' || appearance === 'soft'
      ? 'rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800'
      : ''
    return `grid w-full gap-1 ${cols} ${track}`
  }
  if (appearance === 'outline' || appearance === 'ghost') {
    if (!wrap) return 'flex flex-nowrap items-center gap-1 overflow-x-auto'
    return 'flex flex-wrap gap-1'
  }
  const flow = wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto'
  if (appearance === 'underline') {
    return `flex items-center gap-3 lg:gap-4 text-xs lg:text-sm font-medium ${flow}`
  }
  const padding = appearance === 'pill' && wrap ? 'p-1' : 'p-0.5'
  return `flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 ${padding} ${flow}`
}

function trackFor(widths: readonly number[], columns: number, gap: number): { columns: number[]; width: number } {
  const cols = Array.from({ length: columns }, () => 0)
  widths.forEach((width, index) => {
    const column = index % columns
    cols[column] = Math.max(cols[column] ?? 0, width)
  })
  const width = cols.reduce((sum, column) => sum + column, 0) + gap * Math.max(0, columns - 1)
  return { columns: cols, width }
}

function chooseBalancedTrack(widths: readonly number[], gap: number, available: number): { columns: number[]; width: number } {
  const count = widths.length
  for (let columns = count; columns >= 1; columns -= 1) {
    if (count % columns !== 0) continue
    const track = trackFor(widths, columns, gap)
    if (track.width <= available + 1) return track
  }
  return trackFor(widths, 1, gap)
}

function slotWidth(group: HTMLElement): number {
  const parent = group.parentElement
  if (!parent) return group.clientWidth
  const style = getComputedStyle(parent)
  const pad = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
  if (style.flexDirection.startsWith('column') || style.display === 'block') {
    return parent.clientWidth - pad
  }
  let siblings = 0
  let siblingCount = 0
  for (const child of parent.children) {
    if (child === group) continue
    siblings += child.getBoundingClientRect().width
    siblingCount += 1
  }
  const gap = Number.parseFloat(style.columnGap) || Number.parseFloat(style.gap) || 0
  return parent.clientWidth - pad - siblings - gap * siblingCount
}

function contentWidth(tab: HTMLElement): number {
  const style = getComputedStyle(tab)
  const pad = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
  const border = (Number.parseFloat(style.borderLeftWidth) || 0) + (Number.parseFloat(style.borderRightWidth) || 0)
  const gap = Number.parseFloat(style.columnGap) || Number.parseFloat(style.gap) || 0
  let inner = 0
  for (const child of tab.children) {
    inner += child.getBoundingClientRect().width
  }
  const gaps = Math.max(0, tab.children.length - 1) * gap
  return Math.ceil(inner + gaps + pad + border)
}

function tabClass(appearance: TabAppearance, size: TabSize, wrap: boolean, columns?: 2 | 4): string {
  const focus = 'focus:outline-none data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-neutral-900 dark:data-focus:outline-neutral-100'
  const idle = 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
  if (appearance === 'dock') {
    return `flex flex-col items-center justify-center h-full min-h-12 py-1 font-medium transition-colors ${focus} ${idle} ${SelectedClass.dock}`
  }
  if (appearance === 'outline' || appearance === 'ghost') {
    const grow = columns ? 'min-w-0' : 'shrink-0'
    const pad = size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-2 py-1.5 text-[11px]'
    const fill = wrap ? 'w-full' : ''
    return `flex items-center truncate rounded-md text-left font-medium ${grow} ${fill} ${pad} ${focus} ${idle} ${SelectedClass[appearance]}`
  }
  const shape = appearance === 'underline' ? 'py-1 shrink-0 whitespace-nowrap' : `rounded-md ${SizeClass[size]}`
  const fill = columns || wrap ? 'w-full' : ''
  return `flex items-center justify-center gap-1.5 transition-colors ${focus} ${idle} ${shape} ${fill} ${SelectedClass[appearance]}`
}

export function Tabs<Id extends string>({
  label,
  value,
  options,
  onChange,
  size = 'md',
  wrap = false,
  columns,
  appearance = 'pill',
  className,
}: TabsProps<Id>) {
  const selectedIndex = options.findIndex((option) => option.id === value)
  if (selectedIndex < 0) {
    throw new Error(`Tabs value "${value}" is not one of the options`)
  }
  const groupRef = useRef<HTMLElement>(null)
  const balanceWrap = wrap && columns === undefined && appearance !== 'dock' && appearance !== 'underline'
  const [wrapLayout, setWrapLayout] = useState<{ columns: number[]; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!balanceWrap) return
    const group = groupRef.current
    if (!group) return
    const measure = () => {
      const list = group.querySelector('[role="tablist"]')
      if (!(list instanceof HTMLElement)) return
      const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')]
      if (tabs.length === 0) return
      const styles = getComputedStyle(list)
      const gap = Number.parseFloat(styles.columnGap) || Number.parseFloat(styles.gap) || 0
      const pad = (Number.parseFloat(styles.paddingLeft) || 0) + (Number.parseFloat(styles.paddingRight) || 0)
      const widths = tabs.map((tab) => contentWidth(tab))
      const available = Math.max(0, slotWidth(group) - pad)
      const track = chooseBalancedTrack(widths, gap, available)
      const width = Math.ceil(track.width + pad)
      setWrapLayout((current) => {
        const sameColumns = current?.columns.join(',') === track.columns.join(',')
        if (current && sameColumns && Math.abs(current.width - width) < 1) return current
        return { columns: track.columns, width }
      })
    }
    measure()
    const parent = group.parentElement
    const observer = new ResizeObserver(measure)
    observer.observe(parent ?? group)
    return () => observer.disconnect()
  }, [balanceWrap, options, size, appearance])

  const groupWidth = appearance === 'dock' || columns !== undefined
    ? 'w-full'
    : wrapLayout
      ? 'max-w-full'
      : 'w-max max-w-full'

  return (
    <TabGroup
      ref={groupRef}
      selectedIndex={selectedIndex}
      onChange={(index) => {
        const next = options[index]
        if (!next) {
          throw new Error(`Tabs index ${index} is outside the option list`)
        }
        onChange(next.id)
      }}
      className={`${groupWidth} ${className ?? ''}`}
      style={wrapLayout ? { width: wrapLayout.width } : undefined}
    >
      <TabList
        aria-label={label}
        className={listClass(appearance, wrap, columns, wrapLayout !== null)}
        style={wrapLayout ? { gridTemplateColumns: wrapLayout.columns.map((column) => `${column}px`).join(' ') } : undefined}
      >
        {options.map((option) => {
          const Icon = option.icon
          return (
            <Tab key={option.id} className={tabClass(appearance, size, wrap, columns)}>
              {Icon && (
                <Icon
                  className={
                    appearance === 'dock'
                      ? 'w-4 h-4 shrink-0'
                      : size === 'sm'
                        ? 'w-3 h-3 shrink-0'
                        : 'w-3.5 h-3.5 shrink-0'
                  }
                />
              )}
              <span className={appearance === 'dock' ? 'text-[10px] leading-tight mt-0.5' : 'whitespace-nowrap shrink-0'}>
                {option.label}
              </span>
            </Tab>
          )
        })}
      </TabList>
    </TabGroup>
  )
}
