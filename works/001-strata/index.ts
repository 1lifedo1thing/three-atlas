import {
  BufferGeometry, Color, Float32BufferAttribute, LineBasicMaterial, LineSegments, Mesh, PerspectiveCamera,
  Plane, PlaneGeometry, Raycaster, Scene, ShaderMaterial, Vector2, Vector3,
} from 'three'
import { createOrbit, defineWork, simplex3 } from '@engine'

const RADIUS = 12

const vertex = /* glsl */ `
uniform float uTime;
uniform vec3 uPointer;
varying float vH;
varying vec3 vWorld;
${simplex3}
float terrain(vec2 p, float t) {
  float r = length(p) / ${RADIUS.toFixed(1)};
  float fall = smoothstep(1.02, 0.28, r);
  float n = 0.0, a = 0.5, f = 1.0;
  for (int i = 0; i < 5; i++) {
    n += a * snoise(vec3(p * 0.105 * f, t * 0.03 + float(i) * 1.7));
    f *= 2.07; a *= 0.5;
  }
  float ridge = 1.0 - abs(snoise(vec3(p * 0.055, t * 0.018 + 9.0)));
  float h = (n * 0.7 + ridge * ridge * 0.75 + 0.18) * fall;
  vec2 d = p - uPointer.xy;
  h += uPointer.z * 0.9 * exp(-dot(d, d) * 0.06);
  return h * 4.2 - (1.0 - fall) * 1.2;
}
void main() {
  vec3 p = position.xzy * vec3(1.0, 1.0, -1.0);
  float h = terrain(p.xz, uTime);
  vH = h;
  p.y = max(h, -0.25);
  vWorld = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`

const fragment = /* glsl */ `
uniform float uTime;
uniform float uSweep;
uniform vec3 uPointer;
uniform vec3 uInk;
uniform vec3 uLine;
uniform vec3 uAccent;
varying float vH;
varying vec3 vWorld;
float contour(float k, float width) {
  float w = fwidth(k);
  float d = 0.5 - abs(fract(k) - 0.5);
  return 1.0 - smoothstep(0.0, w * width, d);
}
void main() {
  float r = length(vWorld.xz) / ${RADIUS.toFixed(1)};
  if (r > 1.0) discard;
  vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  float light = clamp(dot(n, normalize(vec3(-0.5, 0.8, 0.35))), 0.0, 1.0);
  float land = smoothstep(-0.05, 0.25, vH);

  float k = vH * 3.2;
  float minor = contour(k, 1.1);
  float major = contour(k / 5.0, 1.6);
  float lines = max(minor * 0.42, major);

  vec3 low = uInk * 1.6;
  vec3 high = vec3(0.058, 0.054, 0.047);
  vec3 col = mix(low, high, clamp(vH / 4.0, 0.0, 1.0)) * (0.35 + light * 0.9) * land;
  col += uInk * 0.6 * (1.0 - land);

  float band = exp(-pow((vH - uSweep) * 6.0, 2.0));
  vec2 dp = vWorld.xz - uPointer.xy;
  float lens = uPointer.z * exp(-dot(dp, dp) * 0.05);

  vec3 lineCol = mix(uLine * 0.55, uLine, land);
  lineCol = mix(lineCol, uAccent * 2.2, band * land * 0.85);
  float a = lines * mix(0.38, 1.0, land) * (0.55 + 0.45 * light + lens * 1.5);
  col = mix(col, lineCol * (1.0 + lens * 0.8), clamp(a, 0.0, 1.0));
  col += uAccent * band * land * 0.05;

  float rim = smoothstep(1.0, 0.86, r);
  gl_FragColor = vec4(mix(uInk, col, rim), 1.0);
}`

function graticule(radius: number) {
  const pts: number[] = []
  const seg = 256
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2
    pts.push(Math.cos(a0) * radius, 0, Math.sin(a0) * radius, Math.cos(a1) * radius, 0, Math.sin(a1) * radius)
  }
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    const len = i % 6 === 0 ? 0.9 : 0.35
    pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius, Math.cos(a) * (radius + len), 0, Math.sin(a) * (radius + len))
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pts, 3))
  return g
}

export default defineWork((ctx) => {
  const scene = new Scene()
  const ink = new Color('#07090b')
  scene.background = ink

  const camera = new PerspectiveCamera(30, 1, 0.1, 200)
  const home = new Vector3().setFromSphericalCoords(36, Math.PI * 0.33, Math.PI * 0.18)
  camera.position.copy(home)
  const target = new Vector3(0, 0.6, 0)
  camera.lookAt(target)

  const seg = ctx.quality === 'high' ? 420 : 220
  const uniforms = {
    uTime: { value: 0 },
    uSweep: { value: 0 },
    uPointer: { value: new Vector3(0, 0, 0) },
    uInk: { value: ink.clone() },
    uLine: { value: new Color('#ece4d4') },
    uAccent: { value: new Color('#ff5b37') },
  }
  const land = new Mesh(new PlaneGeometry(RADIUS * 2, RADIUS * 2, seg, seg), new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms }))
  land.frustumCulled = false
  scene.add(land)

  const ring = new LineSegments(graticule(RADIUS + 0.8), new LineBasicMaterial({ color: new Color('#ece4d4'), transparent: true, opacity: 0.22 }))
  ring.position.y = -0.25
  scene.add(ring)

  const orbit = createOrbit(ctx, camera, { target, minDistance: 16, maxDistance: 60, maxPolarAngle: 1.32, drift: 0.05 })

  // Pointer → ground plane, eased.
  const ray = new Raycaster(), ndc = new Vector2(), hit = new Vector3(), ground = new Plane(new Vector3(0, 1, 0), -1.2)
  const pointerTarget = new Vector3()
  let hovering = false
  const onMove = (e: PointerEvent) => {
    const r = ctx.dom.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    if (ray.ray.intersectPlane(ground, hit) && hit.length() < RADIUS) { pointerTarget.set(hit.x, hit.z, 1); hovering = true }
    else hovering = false
  }
  const onLeave = () => { hovering = false }

  let aspect = 1
  return {
    scene, camera,
    resize(w, h) {
      aspect = w / h
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    },
    activate() {
      orbit.activate()
      ctx.dom.addEventListener('pointermove', onMove)
      ctx.dom.addEventListener('pointerleave', onLeave)
    },
    deactivate() {
      orbit.deactivate()
      ctx.dom.removeEventListener('pointermove', onMove)
      ctx.dom.removeEventListener('pointerleave', onLeave)
      hovering = false
    },
    update(time, delta, active) {
      const t = ctx.reducedMotion ? 20 : time
      uniforms.uTime.value = t
      uniforms.uSweep.value = ((t * 0.32) % 6.5) - 0.8
      const p = uniforms.uPointer.value
      const s = 1 - Math.exp(-delta * 6)
      if (hovering) { p.x += (pointerTarget.x - p.x) * s; p.y += (pointerTarget.y - p.y) * s }
      p.z += ((hovering ? 1 : 0) - p.z) * (1 - Math.exp(-delta * 2.5))
      if (!active) {
        // Frame the island for the plate's aspect while it is a preview.
        const fit = aspect < 1 ? 1 / Math.pow(aspect, 0.85) : 1
        const dist = 36 * fit
        const cur = camera.position.clone().sub(target)
        cur.setLength(cur.length() + (dist - cur.length()) * s)
        camera.position.copy(target).add(cur)
      }
      orbit.update(delta)
    },
    dispose() {
      orbit.dispose()
      land.geometry.dispose(); (land.material as ShaderMaterial).dispose()
      ring.geometry.dispose(); (ring.material as LineBasicMaterial).dispose()
    },
  }
})
