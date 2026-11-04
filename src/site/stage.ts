import {
  Euler, Frustum, HalfFloatType, Matrix4, PerspectiveCamera, Raycaster, Scene, Sphere, UnsignedByteType,
  Vector2, Vector3, WebGLRenderer,
} from 'three'
import type { WorkContext } from '@engine'
import { Plate, pose, type Pose } from './plate'
import { chartPosition, type Entry } from './registry'
import { createSky } from './sky'
import { createArmillary } from './armillary'

export type Mode = 'index' | 'atlas' | 'work'

const FOV = 36
const D = 10 // depth of the index plane
const ATLAS_R = 16
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2)
const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

export interface StageHooks {
  onHover(plate: Plate | null): void
  onEnter(plate: Plate): void
  onSettled(): void
  onHeading(az: number, el: number): void
}

export class Stage {
  readonly renderer: WebGLRenderer
  readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 400)
  readonly scene = new Scene()
  readonly sky = createSky()
  readonly armillary = createArmillary()
  private armFade = 0
  private mouse = new Vector2()
  private mouseS = new Vector2()
  private hero = document.querySelector<HTMLElement>('.hero')
  readonly plates: Plate[] = []
  mode: Mode = 'index'
  origin: 'index' | 'atlas' = 'index'
  active: Plate | null = null
  private ctx: WorkContext
  private vw = innerWidth
  private vh = innerHeight
  private yaw = 0
  private pitch = 0
  private yawTarget = 0
  private pitchTarget = 0
  private drag: { x: number; y: number; moved: number } | null = null
  private pointer = new Vector2(-9, -9)
  private hovered: Plate | null = null
  private ray = new Raycaster()
  private frustum = new Frustum()
  private sphere = new Sphere()
  private clock = 0
  private last = performance.now()
  private settled = true
  private skyPresence = 0
  private rects = new Map<Plate, DOMRect>()

  constructor(readonly canvas: HTMLCanvasElement, entries: Entry[], private hooks: StageHooks, cards: HTMLElement[], labels: HTMLElement[]) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setClearColor('#07090b', 1)
    const ext = this.renderer.extensions
    Plate.rtType = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float') ? HalfFloatType : UnsignedByteType
    const coarse = matchMedia('(pointer: coarse)').matches
    this.ctx = { renderer: this.renderer, dom: canvas, quality: coarse || devicePixelRatio > 2.5 ? 'low' : 'high', reducedMotion: reduced }

    this.scene.add(this.sky.group, this.armillary.group)
    const count = Math.max(labels.length, cards.length)
    for (let i = 0; i < count; i++) {
      const p = new Plate(entries[i] ?? null, i + 1)
      p.card = cards[i] ?? null
      p.frame = p.card?.querySelector('.plate__frame') ?? null
      p.label = labels[i] ?? null
      if (!p.card) { p.opacity = p.opacityTarget = 0; p.target = 'atlas' }
      this.plates.push(p)
      this.scene.add(p.mesh)
    }
    this.layoutAtlas()
    this.bind()
    this.resize()
  }

  // ── Layout ──────────────────────────────────────────────
  private layoutAtlas() {
    for (const p of this.plates) {
      const { az, el } = chartPosition(p.plateNo)
      const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180
      p.atlas.pos.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).multiplyScalar(ATLAS_R)
      const m = new Matrix4().lookAt(new Vector3(), p.atlas.pos, new Vector3(0, 1, 0))
      p.atlas.quat.setFromRotationMatrix(m)
      const h = p.live ? 4.6 : 3.4
      p.aspect = p.frame ? p.frame.clientWidth / Math.max(1, p.frame.clientHeight) : 4 / 5
      p.atlas.scale.set(h * p.aspect, h)
    }
  }

  private viewHeightAt(d: number) { return 2 * d * Math.tan((FOV * Math.PI) / 360) }

  private poseFor(p: Plate, out: Pose) {
    const q = this.camera.quaternion
    if (p.target === 'atlas') {
      out.pos.copy(p.atlas.pos); out.quat.copy(p.atlas.quat); out.scale.copy(p.atlas.scale)
    } else if (p.target === 'full') {
      const h = this.viewHeightAt(D)
      out.pos.set(0, 0, -D).applyQuaternion(q); out.quat.copy(q); out.scale.set(h * (this.vw / this.vh), h)
    } else {
      const r = this.rects.get(p)
      const k = this.viewHeightAt(D) / this.vh
      if (!r) { out.pos.copy(p.atlas.pos); out.quat.copy(p.atlas.quat); out.scale.copy(p.atlas.scale); return }
      out.pos.set((r.left + r.width / 2 - this.vw / 2) * k, -(r.top + r.height / 2 - this.vh / 2) * k, -D).applyQuaternion(q)
      out.quat.copy(q)
      out.scale.set(r.width * k, r.height * k)
    }
  }

  /** Pixel size a plate should be rendered at, given where it is headed. */
  private restSize(p: Plate): [number, number] {
    const pr = this.renderer.getPixelRatio()
    if (p === this.active && this.mode === 'work') return [this.vw * pr, this.vh * pr]
    const prev = Math.min(pr, 1.5)
    let w: number, h: number
    if (p.frame) { w = p.frame.clientWidth; h = p.frame.clientHeight }
    else { h = (p.atlas.scale.y / this.viewHeightAt(ATLAS_R)) * this.vh; w = h * p.aspect }
    const s = Math.min(1, 1280 / Math.max(w * prev, h * prev))
    return [w * prev * s, h * prev * s]
  }

  resize() {
    this.vw = innerWidth; this.vh = innerHeight
    this.renderer.setSize(this.vw, this.vh, false)
    this.camera.aspect = this.vw / this.vh
    this.camera.updateProjectionMatrix()
    this.layoutAtlas()
    for (const p of this.plates) if (p.rt) p.ensureTarget(...this.restSize(p))
  }

  // ── Modes ───────────────────────────────────────────────
  setMode(mode: Mode, active: Plate | null = null, instant = false) {
    const prev = this.mode
    const prevActive = this.active
    if (mode === 'work' && prev !== 'work') this.origin = prev
    if (mode !== 'work') this.origin = mode
    this.mode = mode
    this.active = mode === 'work' ? active : null
    prevActive?.instance?.deactivate?.()

    if (mode === 'atlas' && prev === 'index') {
      const live = this.plates.filter((p) => p.live)
      const mean = live.length ? live.reduce((s, p) => s + chartPosition(p.plateNo).az, 0) / live.length : 0
      this.yawTarget = (-Math.min(mean, 40) * Math.PI) / 180
      this.pitchTarget = 0.02
    }
    if (mode === 'index') {
      const tau = Math.PI * 2
      this.yaw = ((this.yaw % tau) + tau * 1.5) % tau - Math.PI
      this.yawTarget = 0; this.pitchTarget = 0
    }

    this.readRects()
    const now = this.clock
    this.plates.forEach((p, i) => {
      let target: Plate['target']
      let opacity = 1
      if (mode === 'work') {
        target = p === active ? 'full' : p === prevActive ? 'full' : p.target
        opacity = p === active ? 1 : 0
      } else if (mode === 'atlas') target = 'atlas'
      else { target = p.card ? 'index' : 'atlas'; opacity = p.card ? 1 : 0 }

      const changed = target !== p.target || (p === active && prevActive !== active)
      if (changed) {
        p.from.pos.copy(p.current.pos); p.from.quat.copy(p.current.quat); p.from.scale.copy(p.current.scale)
        p.fromFull = p.uniforms.uFull.value
        p.target = target
        if (mode === 'work' && p === active && prev === 'work') {
          // Work → work: grow in place from slightly smaller.
          this.poseFor(p, p.from)
          p.from.scale.multiplyScalar(0.9); p.opacity = 0; p.fromFull = 1
        }
        p.t = instant ? 1 : 0
        const order = mode === 'atlas' ? i : Math.abs(i - (this.plates.indexOf(prevActive ?? active ?? this.plates[0])))
        p.delay = mode === 'work' || prev === 'work' ? 0 : Math.min(order, 12) * 0.045
        p.duration = mode === 'work' || prev === 'work' ? 1.25 : 1.5
        if (reduced) p.duration = 0.01
        p.start = now
      }
      if (instant) p.start = -Infinity
      p.opacityTarget = opacity
      if (instant) p.opacity = opacity
      p.mesh.renderOrder = p === active ? 10 : p === prevActive ? 9 : 1
      if (mode !== 'index') p.revealTarget = 1
    })
    if (instant) { this.yaw = this.yawTarget; this.pitch = this.pitchTarget }
    // The plate leaving full screen keeps its full-size target until it lands.
    for (const p of this.plates) if (p.rt && p !== prevActive) p.ensureTarget(...this.restSize(p))
    this.settled = false
    this.setHover(null)
  }

  /** Called when an index card scrolls into view. */
  markSeen(p: Plate) { p.seen = true; if (!p.live || p.instance) p.revealTarget = 1 }

  setCardHover(p: Plate | null, mx = 0, my = 0) {
    for (const q of this.plates) q.hoverTarget = q === p ? 1 : 0
    if (p) p.uniforms.uMouse.value.set(mx, my)
  }

  private setHover(p: Plate | null) {
    if (p === this.hovered) return
    this.hovered = p
    this.hooks.onHover(p)
    if (this.mode === 'atlas') for (const q of this.plates) q.hoverTarget = q === p ? 1 : 0
  }

  // ── Input (atlas only; works bring their own) ──────────
  private bind() {
    const c = this.canvas
    c.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'atlas') return
      this.drag = { x: e.clientX, y: e.clientY, moved: 0 }
      c.setPointerCapture(e.pointerId)
      c.classList.add('is-dragging')
    })
    c.addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / this.vw) * 2 - 1, -(e.clientY / this.vh) * 2 + 1)
      if (!this.drag || this.mode !== 'atlas') return
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y
      this.drag.x = e.clientX; this.drag.y = e.clientY
      this.drag.moved += Math.abs(dx) + Math.abs(dy)
      const k = (FOV * Math.PI) / 180 / this.vh
      this.yawTarget += dx * k * 1.15
      this.pitchTarget = Math.max(-0.75, Math.min(0.75, this.pitchTarget + dy * k * 1.15))
    })
    const end = (e: PointerEvent) => {
      if (!this.drag) return
      const click = this.drag.moved < 6
      this.drag = null
      c.classList.remove('is-dragging')
      if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId)
      if (click && this.mode === 'atlas') {
        this.pickAt(e.clientX, e.clientY)
        if (this.hovered?.live) this.hooks.onEnter(this.hovered)
      }
    }
    c.addEventListener('pointerup', end)
    c.addEventListener('pointercancel', end)
    c.addEventListener('pointerleave', () => { this.pointer.set(-9, -9) })
    addEventListener('pointermove', (e) => { this.mouse.set((e.clientX / this.vw) * 2 - 1, -(e.clientY / this.vh) * 2 + 1) }, { passive: true })
    addEventListener('wheel', (e) => {
      if (this.mode !== 'atlas') return
      this.yawTarget -= (e.deltaY + e.deltaX) * 0.0012
    }, { passive: true })
    addEventListener('keydown', (e) => {
      if (this.mode !== 'atlas') return
      if (e.key === 'ArrowLeft') this.yawTarget += 0.25
      if (e.key === 'ArrowRight') this.yawTarget -= 0.25
    })
  }

  private pickAt(x: number, y: number) {
    this.pointer.set((x / this.vw) * 2 - 1, -(y / this.vh) * 2 + 1)
    this.ray.setFromCamera(this.pointer, this.camera)
    const hits = this.ray.intersectObjects(this.plates.filter((p) => p.opacity > 0.5).map((p) => p.mesh), false)
    this.setHover(this.plates.find((p) => p.mesh === hits[0]?.object) ?? null)
  }

  // ── Frame ───────────────────────────────────────────────
  private readRects() {
    this.rects.clear()
    for (const p of this.plates) if (p.frame) this.rects.set(p, p.frame.getBoundingClientRect())
  }

  private async instantiate(p: Plate) {
    if (!p.entry || p.loading || p.instance) return
    p.loading = true
    try {
      const mod = await p.entry.load()
      p.instance = await mod.create(this.ctx)
      p.ensureTarget(...this.restSize(p))
      p.instance.resize(p.rt!.width, p.rt!.height)
      if (this.mode === 'work' && this.active === p && p.t >= 1) p.instance.activate?.()
    } catch (err) {
      console.error(`[atlas] plate ${p.plateNo} failed`, err)
    }
  }

  tick() {
    const now = performance.now()
    const dt = Math.min((now - this.last) / 1000, 0.1)
    this.last = now
    this.clock += dt
    const time = this.clock

    // Camera
    if (this.mode === 'atlas' && !this.drag && !reduced) this.yawTarget -= dt * 0.012
    this.yaw = damp(this.yaw, this.yawTarget, 4, dt)
    this.pitch = damp(this.pitch, this.pitchTarget, 4, dt)
    this.camera.quaternion.setFromEuler(new Euler(this.pitch, this.yaw, 0, 'YXZ'))
    this.camera.updateMatrixWorld()
    this.frustum.setFromProjectionMatrix(new Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse))
    if (this.mode === 'atlas') this.hooks.onHeading((-this.yaw * 180) / Math.PI, (this.pitch * 180) / Math.PI)

    // Sky
    const atlasness = this.mode === 'atlas' ? 1 : 0
    this.skyPresence = damp(this.skyPresence, this.mode === 'work' ? 0 : atlasness, 2.5, dt)
    this.sky.setPresence(this.skyPresence)
    this.sky.group.rotation.y = time * 0.003 + (this.mode === 'index' ? scrollY * 0.00012 : 0)
    this.sky.group.rotation.x = this.mode === 'index' ? scrollY * 0.00004 : damp(this.sky.group.rotation.x, 0, 2, dt)
    this.sky.update(time, this.renderer.getPixelRatio())

    // Armillary (hero centrepiece)
    if (this.hero) {
      const r = this.hero.getBoundingClientRect()
      const wide = this.vw > 900
      const dz = 12, k = this.viewHeightAt(dz) / this.vh
      const radius = Math.min(this.vh * 0.33, wide ? this.vw * 0.2 : this.vw * 0.4)
      const x = wide ? this.vw * 0.7 : this.vw * 0.62, y = r.top + r.height * (wide ? 0.47 : 0.36)
      this.armillary.group.position.set((x - this.vw / 2) * k, -(y - this.vh / 2) * k, -dz)
      this.armillary.group.scale.setScalar(radius * k)
      const want = this.mode === 'index' && time > 0.5 && r.bottom > 0 ? (wide ? 1 : 0.45) : 0
      this.armFade = damp(this.armFade, want, want > this.armFade ? 1.6 : 5, dt)
      this.mouseS.x = damp(this.mouseS.x, this.mouse.x, 2.5, dt); this.mouseS.y = damp(this.mouseS.y, this.mouse.y, 2.5, dt)
      this.armillary.update(time, this.armFade, this.mouseS.x, this.mouseS.y, -dz, radius * k)
    }

    // Plates
    this.readRects()
    if (this.mode === 'atlas' && !this.drag && this.pointer.x > -2) this.pickAt(((this.pointer.x + 1) / 2) * this.vw, ((1 - this.pointer.y) / 2) * this.vh)
    let busy = false
    const target = pose()
    for (const p of this.plates) {
      p.t = Math.min(1, Math.max(0, (time - p.start - p.delay) / p.duration))
      if (p.t < 1) busy = true
      const e = ease(p.t)
      this.poseFor(p, target)
      p.current.pos.lerpVectors(p.from.pos, target.pos, e)
      p.current.quat.slerpQuaternions(p.from.quat, target.quat, e)
      p.current.scale.lerpVectors(p.from.scale, target.scale, e)
      if (p.t >= 1) { p.current.pos.copy(target.pos); p.current.quat.copy(target.quat); p.current.scale.copy(target.scale) }
      p.mesh.position.copy(p.current.pos)
      p.mesh.quaternion.copy(p.current.quat)
      p.mesh.scale.set(p.current.scale.x, p.current.scale.y, 1)

      p.opacity = damp(p.opacity, p.opacityTarget, p.opacityTarget > p.opacity ? 5 : 7, dt)
      p.hover = damp(p.hover, p.hoverTarget, 6, dt)
      p.reveal = damp(p.reveal, p.revealTarget, 2.2, dt)
      const dist = p.current.pos.length()
      const pxH = (p.current.scale.y / this.viewHeightAt(dist)) * this.vh
      const u = p.uniforms
      u.uSize.value.set(pxH * (p.current.scale.x / p.current.scale.y), pxH)
      u.uRadius.value = 6
      u.uHover.value = p.hover
      u.uReveal.value = p.reveal
      u.uOpacity.value = p.opacity
      u.uTime.value = time
      u.uFull.value = p.fromFull + ((p.target === 'full' ? 1 : 0) - p.fromFull) * e
      u.uBend.value = Math.sin(e * Math.PI) * (p.t < 1 ? 0.6 : 0) * Math.min(1, p.current.scale.y / 4)
      p.mesh.visible = p.opacity > 0.004

      this.sphere.set(p.current.pos, 0.75 * Math.max(p.current.scale.x, p.current.scale.y))
      p.visible = p.mesh.visible && this.frustum.intersectsSphere(this.sphere)
      const near = p.visible || (p.frame && this.rects.get(p)!.top < this.vh * 2.5)
      if (p.live && near && !p.instance) this.instantiate(p)
      if (p.instance && p.rt && p.visible) {
        const active = this.mode === 'work' && p === this.active && p.t >= 1
        p.instance.update(time, dt, active)
        if (p.instance.render) p.instance.render(this.renderer, p.rt)
        else { this.renderer.setRenderTarget(p.rt); this.renderer.render(p.instance.scene, p.instance.camera) }
        if (p.seen || this.mode !== 'index') p.revealTarget = 1
      }
    }
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)

    // Atlas labels follow their plates.
    const v = new Vector3(), down = new Vector3()
    const fwd = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)
    for (const p of this.plates) {
      if (!p.label) continue
      if (this.mode !== 'atlas') { p.label.style.opacity = '0'; continue }
      down.set(0, -0.5 * p.current.scale.y - 0.35, 0).applyQuaternion(p.current.quat)
      v.copy(p.current.pos).add(down).project(this.camera)
      const facing = p.current.pos.clone().normalize().dot(fwd)
      const x = (v.x * 0.5 + 0.5) * this.vw, y = (-v.y * 0.5 + 0.5) * this.vh
      p.label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateX(-50%)`
      p.label.style.opacity = String(Math.max(0, Math.min(1, (facing - 0.55) * 4)) * (p.t >= 1 ? 1 : 0))
      p.label.classList.toggle('is-hover', p === this.hovered)
    }

    if (!busy && !this.settled) {
      this.settled = true
      for (const p of this.plates) if (p.rt) p.ensureTarget(...this.restSize(p))
      if (this.mode === 'work' && this.active?.instance) this.active.instance.activate?.()
      this.hooks.onSettled()
    }
  }

  get isSettled() { return this.settled }
}
