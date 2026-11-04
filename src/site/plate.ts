import {
  Color, HalfFloatType, LinearFilter, Mesh, PlaneGeometry, Quaternion, ShaderMaterial, Vector2, Vector3,
  WebGLRenderTarget, type Texture, type TextureDataType,
} from 'three'
import type { WorkInstance } from '@engine'
import type { Entry } from './registry'

const vertex = /* glsl */ `
uniform float uBend;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  p.z -= sin(uv.x * 3.14159) * sin(uv.y * 3.14159) * uBend;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const fragment = /* glsl */ `
uniform sampler2D tMap;
uniform float uHasMap;
uniform vec2 uSize;
uniform float uRadius;
uniform float uHover;
uniform vec2 uMouse;
uniform float uReveal;
uniform float uFull;
uniform float uOpacity;
uniform float uTime;
uniform float uTone;
uniform float uExposure;
uniform vec3 uPaper;
uniform vec3 uSignal;
uniform vec3 uInk;
varying vec2 vUv;

float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

vec3 neutral(vec3 c) {
  const float start = 0.8 - 0.04, desat = 0.15;
  float x = min(c.r, min(c.g, c.b));
  float off = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c -= off;
  float peak = max(c.r, max(c.g, c.b));
  if (peak < start) return c;
  float d = 1.0 - start;
  float np = 1.0 - d * d / (peak + d - start);
  c *= np / peak;
  float g = 1.0 - 1.0 / (desat * (peak - np) + 1.0);
  return mix(c, vec3(np), g);
}
vec3 aces(vec3 c) {
  c *= 0.6;
  return clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
}
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }

vec3 work(vec2 uv) {
  vec2 off = (uv - 0.5) * 0.0025 * uHover * (1.0 - uFull);
  vec3 c = vec3(texture2D(tMap, uv + off).r, texture2D(tMap, uv).g, texture2D(tMap, uv - off).b);
  c *= uExposure;
  if (uTone < 0.5) c = neutral(c); else if (uTone < 1.5) c = aces(c);
  return clamp(c, 0.0, 1.0);
}

vec3 uncharted(vec2 px) {
  vec3 c = uInk * 1.35;
  vec2 g = abs(fract(px / 28.0 + 0.5) - 0.5) * 28.0;
  float grid = 1.0 - smoothstep(0.0, 1.0, min(g.x, g.y));
  vec2 p = px - uSize * 0.5;
  float cross = (1.0 - smoothstep(0.0, 1.0, abs(p.x))) * step(abs(p.y), 14.0) + (1.0 - smoothstep(0.0, 1.0, abs(p.y))) * step(abs(p.x), 14.0);
  float ring = 1.0 - smoothstep(0.0, 1.2, abs(length(p) - 44.0));
  float sweep = smoothstep(0.985, 1.0, fract(atan(p.y, p.x) / 6.2832 - uTime * 0.05)) * step(length(p), min(uSize.x, uSize.y) * 0.42);
  c = mix(c, uPaper, grid * 0.05 + cross * 0.4 + ring * 0.14 + sweep * 0.05);
  return c;
}

void main() {
  vec2 px = vUv * uSize;
  float r = uRadius * (1.0 - uFull);
  float d = sdRound(px - uSize * 0.5, uSize * 0.5, r);
  float aa = max(fwidth(d), 0.0001);
  float shape = clamp(0.5 - d / aa, 0.0, 1.0);

  float zoom = 1.0 + (0.06 * uHover + 0.12 * (1.0 - uReveal)) * (1.0 - uFull);
  vec2 uv = (vUv - 0.5) / zoom + 0.5 + uMouse * 0.012 * uHover * (1.0 - uFull);
  vec3 col = uHasMap > 0.5 ? toSRGB(work(uv)) : uncharted(px);

  // Develop from the bottom edge, like a plate coming out of the bath.
  float edge = uReveal * 1.3 - 0.15;
  float n = hash12(floor(px / 3.0)) * 0.04;
  float m = 1.0 - smoothstep(edge - 0.16, edge, vUv.y + n);
  float scan = exp(-pow((vUv.y - edge + 0.05) * 26.0, 2.0)) * (1.0 - uReveal) * 4.0;
  col = mix(uInk, col, m) + uSignal * scan * 0.35;

  // Hairline frame + vignette for previews only.
  float inner = 1.0 - smoothstep(0.0, aa * 1.5, abs(d + 0.5));
  col = mix(col, uPaper, inner * 0.12 * (1.0 - uFull));
  vec2 q = vUv - 0.5;
  col *= mix(1.0, 1.0 - dot(q, q) * 0.55, 1.0 - uFull);
  col += (hash12(px + fract(uTime) * 91.0) - 0.5) * 0.018;

  gl_FragColor = vec4(col, shape * uOpacity);
}`

export interface Pose { pos: Vector3; quat: Quaternion; scale: Vector2 }
export const pose = (): Pose => ({ pos: new Vector3(), quat: new Quaternion(), scale: new Vector2(1, 1) })

const geometry = new PlaneGeometry(1, 1, 24, 24)
const TONE = { neutral: 0, aces: 1, none: 2 } as const

export class Plate {
  static rtType: TextureDataType = HalfFloatType
  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>
  readonly uniforms
  rt: WebGLRenderTarget | null = null
  instance: WorkInstance | null = null
  loading = false
  /** DOM frame this plate follows in the index. */
  frame: HTMLElement | null = null
  card: HTMLElement | null = null
  label: HTMLElement | null = null
  /** Transition: from snapshot → live target, eased by `t`. */
  from = pose()
  current = pose()
  t = 1
  start = -Infinity
  fromFull = 0
  seen = false
  delay = 0
  duration = 1
  target: 'index' | 'atlas' | 'full' = 'index'
  hover = 0
  hoverTarget = 0
  reveal = 0
  revealTarget = 0
  opacity = 1
  opacityTarget = 1
  visible = false
  atlas = pose()
  aspect = 4 / 3

  constructor(readonly entry: Entry | null, readonly plateNo: number) {
    this.uniforms = {
      tMap: { value: null as Texture | null },
      uHasMap: { value: 0 },
      uSize: { value: new Vector2(400, 300) },
      uRadius: { value: 6 },
      uHover: { value: 0 },
      uMouse: { value: new Vector2() },
      uReveal: { value: 0 },
      uFull: { value: 0 },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
      uBend: { value: 0 },
      uTone: { value: TONE[entry?.meta.toneMapping ?? 'neutral'] },
      uExposure: { value: entry?.meta.exposure ?? 1 },
      uPaper: { value: new Color('#ece6da') },
      uSignal: { value: new Color('#ff5b37') },
      uInk: { value: new Color('#07090b') },
    }
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    // Uniform colours are set in sRGB; the shader works in display space.
    for (const k of ['uPaper', 'uSignal', 'uInk'] as const) this.uniforms[k].value.convertLinearToSRGB()
    this.mesh = new Mesh(geometry, material)
    this.mesh.frustumCulled = false
  }

  get live() { return this.entry !== null }

  ensureTarget(w: number, h: number) {
    w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h))
    if (!this.rt) {
      this.rt = new WebGLRenderTarget(w, h, { type: Plate.rtType, samples: 4, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: true })
      this.uniforms.tMap.value = this.rt.texture
      this.uniforms.uHasMap.value = 1
      this.instance?.resize(w, h)
    } else if (Math.abs(this.rt.width - w) > 6 || Math.abs(this.rt.height - h) > 6) {
      this.rt.setSize(w, h)
      this.instance?.resize(w, h)
    }
  }

  dispose() {
    this.instance?.dispose()
    this.rt?.dispose()
    this.mesh.material.dispose()
  }
}
