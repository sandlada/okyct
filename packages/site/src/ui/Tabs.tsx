import { Tab, TabGroup, TabList } from '@headlessui/react'
import type { ComponentType, ReactNode } from 'react'

export const TabSizes = ['sm', 'md'] as const
export type TabSize = (typeof TabSizes)[number]

export const TabAppearances = ['pill', 'soft', 'underline', 'dock'] as const
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
}

function listClass(appearance: TabAppearance, wrap: boolean): string {
  if (appearance === 'dock') {
    return 'grid grid-cols-4 w-full'
  }
  const flow = wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto'
  if (appearance === 'underline') {
    return `flex items-center gap-3 lg:gap-4 text-xs lg:text-sm font-medium ${flow}`
  }
  const padding = appearance === 'pill' && wrap ? 'p-1' : 'p-0.5'
  return `flex items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 ${padding} ${flow}`
}

function tabClass(appearance: TabAppearance, size: TabSize): string {
  const focus = 'focus:outline-none data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-neutral-900 dark:data-focus:outline-neutral-100'
  const idle = 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
  if (appearance === 'dock') {
    return `flex flex-col items-center justify-center h-full min-h-12 py-1 font-medium transition-colors ${focus} ${idle} ${SelectedClass.dock}`
  }
  const shape = appearance === 'underline' ? 'py-1 shrink-0 whitespace-nowrap' : `rounded-md ${SizeClass[size]}`
  return `flex items-center justify-center gap-1.5 transition-colors ${focus} ${idle} ${shape} ${SelectedClass[appearance]}`
}

export function Tabs<Id extends string>({
  label,
  value,
  options,
  onChange,
  size = 'md',
  wrap = false,
  appearance = 'pill',
  className,
}: TabsProps<Id>) {
  const selectedIndex = options.findIndex((option) => option.id === value)
  if (selectedIndex < 0) {
    throw new Error(`Tabs value "${value}" is not one of the options`)
  }

  return (
    <TabGroup
      selectedIndex={selectedIndex}
      onChange={(index) => {
        const next = options[index]
        if (!next) {
          throw new Error(`Tabs index ${index} is outside the option list`)
        }
        onChange(next.id)
      }}
      className={className}
    >
      <TabList aria-label={label} className={listClass(appearance, wrap)}>
        {options.map((option) => {
          const Icon = option.icon
          return (
            <Tab key={option.id} className={tabClass(appearance, size)}>
              {Icon && (
                <Icon
                  className={
                    appearance === 'dock'
                      ? 'w-4 h-4'
                      : size === 'sm'
                        ? 'w-3 h-3'
                        : 'w-3.5 h-3.5'
                  }
                />
              )}
              <span className={appearance === 'dock' ? 'text-[10px] leading-tight mt-0.5' : undefined}>
                {option.label}
              </span>
            </Tab>
          )
        })}
      </TabList>
    </TabGroup>
  )
}
