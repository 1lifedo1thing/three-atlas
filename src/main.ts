import './site/styles.css'
import { entries, bySlug } from './site/registry'
import { lang, l, onLang, setLang, t } from './site/i18n'
import { listen, parse, href, type Route } from './site/router'
import { buildUI, refreshWorkText } from './site/ui'
import { Stage } from './site/stage'
import type { Plate } from './site/plate'

const root = document.getElementById('app')!
const ui = buildUI(root)
const body = document.body
document.documentElement.lang = lang

let stage: Stage | null = null
try {
  stage = new Stage(ui.canvas, entries, {
    onHover: (p) => cursorLabel(p),
    onEnter: (p) => p.entry && go({ mode: 'work', slug: p.entry.meta.slug }),
    onSettled: () => body.classList.add('is-settled'),
    onHeading: (az, el) => {
      const ra = (((az / 15) % 24) + 24) % 24
      ui.compass.textContent = `RA ${String(Math.floor(ra)).padStart(2, '0')}h ${String(Math.floor((ra % 1) * 60)).padStart(2, '0')}m · Dec ${el >= 0 ? '+' : '−'}${Math.abs(el).toFixed(0).padStart(2, '0')}°`
    },
  }, ui.cards, ui.labels)
} catch (err) {
  console.warn('[atlas] WebGL unavailable, falling back to static index', err)
  document.documentElement.classList.add('no-webgl')
}

// ── Cursor ───────────────────────────────────────────────
const cursorText = ui.cursor.querySelector('span')!
let cx = -100, cy = -100, tx = -100, ty = -100
addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY }, { passive: true })
function cursorLabel(p: Plate | null) {
  ui.cursor.classList.toggle('is-on', !!p)
  ui.cursor.classList.toggle('is-muted', !!p && !p.live)
  if (p) cursorText.textContent = p.live ? `${t('enter')} · PL. ${p.entry!.no}` : t('notYet')
}

// ── Index cards ──────────────────────────────────────────
const plateOf = (card: Element) => stage?.plates.find((p) => p.card === card) ?? null
const io = new IntersectionObserver((list) => {
  for (const e of list) if (e.isIntersecting) {
    e.target.classList.add('is-seen')
    const p = plateOf(e.target)
    if (p) stage!.markSeen(p)
    io.unobserve(e.target)
  }
}, { threshold: 0.18 })
for (const card of ui.cards) {
  io.observe(card)
  if (card.classList.contains('is-uncharted')) continue
  const frame = card.querySelector('.plate__frame')!
  card.addEventListener('pointerenter', () => { const p = plateOf(card); stage?.setCardHover(p); cursorLabel(p) })
  card.addEventListener('pointerleave', () => { stage?.setCardHover(null); cursorLabel(null) })
  card.addEventListener('pointermove', (e) => {
    const r = frame.getBoundingClientRect()
    stage?.setCardHover(plateOf(card), ((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
  })
}

// ── Mode switch thumb ────────────────────────────────────
function placeThumb(mode: string) {
  const links = [...ui.modes.querySelectorAll<HTMLElement>('a[data-mode]')]
  const thumb = ui.modes.querySelector<HTMLElement>('.modes__thumb')!
  const cur = links.find((a) => a.dataset.mode === mode) ?? links[0]
  links.forEach((a) => a.setAttribute('aria-current', String(a === cur)))
  thumb.style.width = `${cur.offsetWidth}px`
  thumb.style.transform = `translateX(${cur.offsetLeft}px)`
}

// ── HUD ──────────────────────────────────────────────────
let current: Route = parse()
function fillHud() {
  if (current.mode !== 'work') return
  const e = bySlug(current.slug)
  if (!e) return
  const m = e.meta
  ui.hudNo.textContent = `PL. ${e.no} · ${m.year}`
  ui.hudTitle.textContent = l(m.title)
  ui.hudSummary.textContent = l(m.summary)
  ui.hudMedium.innerHTML = m.medium.map((x) => `<li>${l(x)}</li>`).join('')
  ui.hudHint.textContent = m.controls ? l(m.controls) : ''
  const origin = stage?.origin ?? 'index'
  ui.hudBackLabel.textContent = t(origin === 'atlas' ? 'atlas' : 'index')
  ui.hudBack.href = href({ mode: origin })
  ui.hud.style.setProperty('--accent', m.accent ?? '#ff5b37')
  document.title = `${l(m.title)} — PL. ${e.no} — Three Atlas`
}
ui.hudToggle.addEventListener('click', () => {
  const open = ui.hud.classList.toggle('is-open')
  ui.hudToggle.setAttribute('aria-expanded', String(open))
})
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current.mode === 'work') go({ mode: stage?.origin ?? 'index' })
})

// ── Language ─────────────────────────────────────────────
const paintLang = () => ui.lang.querySelectorAll<HTMLElement>('[data-l]').forEach((s) => s.setAttribute('aria-current', String(s.dataset.l === lang)))
ui.lang.addEventListener('click', () => setLang(lang === 'en' ? 'zh' : 'en'))
onLang(() => { paintLang(); refreshWorkText(root); fillHud(); placeThumb(current.mode === 'atlas' ? 'atlas' : 'index'); cursorLabel(null) })
paintLang()

// ── Routing ──────────────────────────────────────────────
let first = true
function apply(r: Route) {
  if (r.mode === 'work' && !bySlug(r.slug)) r = { mode: 'lost' }
  const leavingIndex = (current.mode === 'index' || current.mode === 'lost') && r.mode !== 'index' && r.mode !== 'lost'
  current = r
  const mode = r.mode === 'lost' ? 'index' : r.mode
  body.dataset.mode = mode
  body.classList.toggle('is-lost', r.mode === 'lost')
  body.classList.remove('is-settled')
  ui.hud.classList.remove('is-open')
  document.documentElement.classList.toggle('is-locked', mode !== 'index')
  placeThumb(mode === 'work' ? (stage?.origin ?? 'index') : mode)
  if (mode !== 'work') document.title = mode === 'atlas' ? 'The Atlas — Three Atlas' : 'Three Atlas — A world of worlds'

  if (stage) {
    const active = r.mode === 'work' ? stage.plates.find((p) => p.entry?.meta.slug === r.slug) ?? null : null
    if (mode === 'index' && !first && !leavingIndex) {
      // Coming back: make sure the plate we left is in view before it flies home.
      const card = stage.active?.card
      if (card) {
        const b = card.getBoundingClientRect()
        if (b.top < 80 || b.bottom > innerHeight - 40) scrollTo({ top: scrollY + b.top - (innerHeight - b.height) / 2, behavior: 'instant' })
      }
    }
    stage.setMode(mode, active, first)
  }
  if (r.mode === 'index' && first) scrollTo(0, 0)
  fillHud()
  first = false
}
const go = listen((r) => apply(r))
apply(current)

// ── Loop ─────────────────────────────────────────────────
addEventListener('resize', () => { stage?.resize(); placeThumb(current.mode === 'work' ? (stage?.origin ?? 'index') : current.mode === 'atlas' ? 'atlas' : 'index') })
let readyAt = 0
let lastT = performance.now()
const loop = () => {
  const now = performance.now(), k = 1 - Math.exp(-(now - lastT) / 1000 * 14)
  lastT = now
  cx += (tx - cx) * k; cy += (ty - cy) * k
  ui.cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
  stage?.tick()
  if (!readyAt) readyAt = performance.now()
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)

const ready = () => body.classList.add('is-ready')
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1800))]).then(() => setTimeout(ready, 250))
