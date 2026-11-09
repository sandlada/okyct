/**
 * 轻量级、强类型的 History API 路由运行时。
 *
 * 设计取舍：
 * - 不引入第三方路由依赖，保持工作台零外部运行时依赖的工程约束；
 * - 路由状态由 pathname 派生，刷新、直链与浏览器前进/后退天然一致；
 * - 静态构建阶段可在 Node 中以同一套 matchRoute 预渲染任意路径。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { matchRoute, type AppRoute } from './routes.ts'

interface NavigateOptions {
  readonly replace?: boolean
}

export interface RouterValue {
  readonly route: AppRoute
  readonly pathname: string
  readonly navigate: (to: string, options?: NavigateOptions) => void
}

const RouterContext = createContext<RouterValue | null>(null)

function readPathname(): string {
  if (typeof window === 'undefined') {
    return '/'
  }
  return window.location.pathname
}

function scrollToHash(): void {
  if (typeof window === 'undefined') {
    return
  }
  const hash = window.location.hash.replace(/^#/, '')
  if (hash === '') {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    return
  }
  const target = document.getElementById(hash)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

interface RouterProviderProps {
  readonly initialPath?: string
  readonly children: ReactNode
}

export function RouterProvider({ initialPath, children }: RouterProviderProps) {
  const [pathname, setPathname] = useState<string>(() => initialPath ?? readPathname())

  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    if (typeof window === 'undefined') {
      return
    }
    const url = new URL(to, window.location.origin)
    const nextPath = url.pathname === '' ? '/' : url.pathname
    const samePath = nextPath === window.location.pathname

    if (samePath) {
      if (url.hash !== window.location.hash) {
        window.history.pushState(null, '', `${url.pathname}${url.hash}${url.search}`)
        window.requestAnimationFrame(scrollToHash)
      }
      return
    }

    if (options?.replace === true) {
      window.history.replaceState(null, '', `${url.pathname}${url.hash}${url.search}`)
    } else {
      window.history.pushState(null, '', `${url.pathname}${url.hash}${url.search}`)
    }
    setPathname(nextPath)
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setPathname(readPathname())
      window.requestAnimationFrame(scrollToHash)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (window.location.hash === '') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [pathname])

  const value = useMemo<RouterValue>(() => ({
    route: matchRoute(pathname),
    pathname,
    navigate,
  }), [pathname, navigate])

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext)
  if (value === null) {
    throw new Error('useRouter must be used inside a <RouterProvider>')
  }
  return value
}

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  readonly to: string
  readonly replace?: boolean
}

export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter()

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    navigate(to, { replace })
  }

  return <a href={to} onClick={handleClick} {...rest} />
}
