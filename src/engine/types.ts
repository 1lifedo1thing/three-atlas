import type { Camera, Object3D, WebGLRenderer, WebGLRenderTarget } from 'three'

export type Lang = 'en' | 'zh'
export type Localized = Record<Lang, string>

/** Contents of works/<dir>/work.json — the plate's catalogue entry. */
export interface WorkMeta {
  slug: string
  plate: number
  title: Localized
  summary: Localized
  medium: Localized[]
  year: number
  /** How the work's linear output is mapped to the screen. Default 'neutral'. */
  toneMapping?: 'neutral' | 'aces' | 'none'
  exposure?: number
  /** Short control hint shown in the work HUD. */
  controls?: Localized
  /** Hex colour that tints the work HUD. */
  accent?: string
  draft?: boolean
}

export type Quality = 'low' | 'high'

/** What the Atlas hands to a work. A work never creates its own renderer or canvas. */
export interface WorkContext {
  renderer: WebGLRenderer
  /** Element that receives pointer input while the work is active (full screen). */
  dom: HTMLElement
  quality: Quality
  /** Respect prefers-reduced-motion inside the work. */
  reducedMotion: boolean
}

export interface WorkInstance {
  scene: Object3D
  camera: Camera
  /** Called every frame the plate is visible. `active` is true while the work is full screen and interactive. */
  update(time: number, delta: number, active: boolean): void
  /** Pixel size of the plate the work is drawn into (CSS px × pixel ratio). */
  resize(width: number, height: number): void
  /** Full screen + interactive: attach controls / listeners here. */
  activate?(): void
  deactivate?(): void
  /** Optional custom render (multi-pass, own post-processing). Must draw into `target`. */
  render?(renderer: WebGLRenderer, target: WebGLRenderTarget): void
  dispose(): void
}

export interface WorkModule {
  create(ctx: WorkContext): WorkInstance | Promise<WorkInstance>
}

export const defineWork = (create: WorkModule['create']): WorkModule => ({ create })
