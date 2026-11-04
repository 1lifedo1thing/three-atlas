import type { WorkMeta, WorkModule } from '@engine'

const metas = import.meta.glob<WorkMeta>('/works/*/work.json', { eager: true, import: 'default' })
const modules = import.meta.glob<{ default: WorkModule }>('/works/*/index.ts')

export interface Entry {
  meta: WorkMeta
  no: string
  load: () => Promise<WorkModule>
}

export const entries: Entry[] = Object.entries(metas)
  .filter(([, m]) => !(import.meta.env.PROD && m.draft))
  .map(([path, meta]) => {
    const mod = modules[path.replace('work.json', 'index.ts')]
    if (!mod) throw new Error(`Missing index.ts next to ${path}`)
    return { meta, no: String(meta.plate).padStart(3, '0'), load: () => mod().then((m) => m.default) }
  })
  .sort((a, b) => a.meta.plate - b.meta.plate)

export const bySlug = (slug: string) => entries.find((e) => e.meta.slug === slug)

/** Stable position of a plate number on the celestial sphere (degrees). */
export function chartPosition(plate: number) {
  const k = plate - 1
  const perRing = 13
  const ring = Math.floor(k / perRing)
  const step = 360 / perRing
  const az = ((k % perRing) * step + ring * step * 0.5) % 360
  const band = [0, 24, -24, 46, -46][ring % 5]
  const el = band + Math.sin(plate * 2.39) * 5
  return { az, el }
}

export function coordLabel(plate: number) {
  const { az, el } = chartPosition(plate)
  const ra = (az / 15 + 24) % 24
  const h = Math.floor(ra), m = Math.round((ra - h) * 60) % 60
  const dec = Math.round(el)
  return `RA ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m · Dec ${dec >= 0 ? '+' : '−'}${String(Math.abs(dec)).padStart(2, '0')}°`
}
