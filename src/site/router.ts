export type Route = { mode: 'index' } | { mode: 'atlas' } | { mode: 'work'; slug: string } | { mode: 'lost' }

const BASE = import.meta.env.BASE_URL

export function parse(pathname = location.pathname): Route {
  const rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '')
  const parts = rel.split('/').filter(Boolean)
  if (parts.length === 0 || parts[0] === 'index.html') return { mode: 'index' }
  if (parts[0] === 'atlas' && parts.length === 1) return { mode: 'atlas' }
  if (parts[0] === 'works' && parts.length === 2) return { mode: 'work', slug: parts[1] }
  return { mode: 'lost' }
}

export const href = (r: Route) =>
  BASE + (r.mode === 'atlas' ? 'atlas/' : r.mode === 'work' ? `works/${r.slug}/` : '')

export function listen(apply: (r: Route, pushed: boolean) => void) {
  history.scrollRestoration = 'manual'
  addEventListener('popstate', () => apply(parse(), false))
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.('a[data-link]') as HTMLAnchorElement | null
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(parse(new URL(a.href).pathname))
  })
  const go = (r: Route) => {
    const url = href(r) + location.search
    if (url !== location.pathname + location.search) history.pushState(null, '', url)
    apply(r, true)
  }
  return go
}
