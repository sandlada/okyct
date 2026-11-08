import { createRoot, hydrateRoot } from 'react-dom/client'
import { Root } from './Root.tsx'
import './index.css'

const container = document.getElementById('root')

if (container === null) {
  throw new Error('Root container #root was not found in index.html')
}

// 生产构建由 prerender 脚本注入静态标记，此时必须接管 hydration；
// 开发模式或工作台路由则走常规客户端渲染。
if (container.firstElementChild !== null) {
  hydrateRoot(container, <Root />)
} else {
  createRoot(container).render(<Root />)
}
