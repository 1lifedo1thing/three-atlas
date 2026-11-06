// The river: a planar mirror of the valley, rippled by layered waves, with shallow banks that fade to sand.
import { HalfFloatType, Matrix4, PerspectiveCamera, Plane, ShaderMaterial, Vector3, Vector4, WebGLRenderTarget } from 'three';
import { ATMOSPHERE, atmosphere } from './atmosphere.js';
import { lighting } from './materials.js';
import { WATER_Y } from './world.js';

export const LAYER_NO_REFLECTION = 1;

/** Mirror camera and render target for the water plane (after three's Reflector, simplified to y = WATER_Y). */
export class Reflection {
  constructor({ scale = 0.5 } = {}) {
    this.scale = scale;
    this.target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: true });
    this.camera = new PerspectiveCamera();
    this.camera.layers.set(0);
    this.matrix = new Matrix4();
    this.enabled = scale > 0;
    this._plane = new Plane(); this._clip = new Vector4(); this._q = new Vector4();
    this._view = new Vector3(); this._look = new Vector3(); this._target = new Vector3(); this._rot = new Matrix4(); this._camPos = new Vector3();
  }

  setSize(width, height) {
    this.target.setSize(Math.max(1, Math.round(width * this.scale)), Math.max(1, Math.round(height * this.scale)));
  }

  render(renderer, scene, camera) {
    if (!this.enabled) return;
    const normal = new Vector3(0, 1, 0), point = new Vector3(0, WATER_Y, 0);
    this._camPos.setFromMatrixPosition(camera.matrixWorld);
    if (this._camPos.y <= WATER_Y + 0.05) return;
    this._view.subVectors(point.set(this._camPos.x, WATER_Y, this._camPos.z), this._camPos).reflect(normal).negate().add(point);
    this._rot.extractRotation(camera.matrixWorld);
    this._look.set(0, 0, -1).applyMatrix4(this._rot).add(this._camPos);
    this._target.subVectors(point, this._look).reflect(normal).negate().add(point);
    const vc = this.camera;
    vc.position.copy(this._view);
    vc.up.set(0, 1, 0).applyMatrix4(this._rot).reflect(normal);
    vc.lookAt(this._target);
    vc.far = camera.far; vc.near = camera.near;
    vc.updateMatrixWorld();
    vc.projectionMatrix.copy(camera.projectionMatrix);
    this.matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
    // Oblique near plane so nothing under the water leaks into the mirror.
    this._plane.setFromNormalAndCoplanarPoint(normal, point).applyMatrix4(vc.matrixWorldInverse);
    this._clip.set(this._plane.normal.x, this._plane.normal.y, this._plane.normal.z, this._plane.constant);
    const e = vc.projectionMatrix.elements, q = this._q;
    q.x = (Math.sign(this._clip.x) + e[8]) / e[0];
    q.y = (Math.sign(this._clip.y) + e[9]) / e[5];
    q.z = -1; q.w = (1 + e[10]) / e[14];
    this._clip.multiplyScalar(2 / this._clip.dot(q));
    e[2] = this._clip.x; e[6] = this._clip.y; e[10] = this._clip.z + 1 - 0.003; e[14] = this._clip.w;
    vc.projectionMatrixInverse.copy(vc.projectionMatrix).invert();
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, vc);
    renderer.setRenderTarget(previous);
  }

  dispose() { this.target.dispose(); }
}

export function waterMaterial(reflection) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...atmosphere, ...lighting,
      tReflect: { value: reflection.target.texture },
      uReflectMatrix: { value: reflection.matrix },
      uHasReflection: { value: reflection.enabled ? 1 : 0 },
    },
    vertexShader: /* glsl */ `
      attribute float depth;
      uniform mat4 uReflectMatrix;
      varying vec3 vWorldPos;
      varying float vDepth;
      varying vec4 vReflectUv;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPos = world.xyz;
        vDepth = depth;
        vReflectUv = uReflectMatrix * world;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tReflect;
      uniform float uHasReflection;
      uniform vec3 uKeyLight;
      uniform vec3 uSkyFill;
      varying vec3 vWorldPos;
      varying float vDepth;
      varying vec4 vReflectUv;
      ${ATMOSPHERE}

      float wHash(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
      float wNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), f.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      // Irregular ripples: three noise layers drifting downstream at different speeds and angles.
      float waveHeight(vec2 p, float t) {
        return wNoise(p * 0.32 + vec2(0.13 * t, 0.42 * t)) * 0.55
             + wNoise(mat2(0.8, -0.6, 0.6, 0.8) * p * 0.83 + vec2(-0.21 * t, 0.66 * t)) * 0.3
             + wNoise(mat2(0.6, 0.8, -0.8, 0.6) * p * 2.1 + vec2(0.35 * t, 1.1 * t)) * 0.15;
      }
      vec2 waveGradient(vec2 p, float t) {
        const float e = 0.12;
        float h = waveHeight(p, t);
        return vec2(waveHeight(p + vec2(e, 0.0), t) - h, waveHeight(p + vec2(0.0, e), t) - h) / e;
      }

      void main() {
        vec3 toFrag = vWorldPos - cameraPosition;
        float dist = length(toFrag);
        vec3 view = toFrag / dist;
        vec2 g = waveGradient(vWorldPos.xz, uTime) * mix(1.0, 0.2, smoothstep(30.0, 420.0, dist));
        vec3 n = normalize(vec3(-g.x * 0.16, 1.0, -g.y * 0.16));
        float cosTheta = max(dot(-view, n), 0.0);
        float fresnel = 0.1 + 0.9 * pow(1.0 - cosTheta, 4.0);
        vec3 reflected = reflect(view, n);
        reflected.y = abs(reflected.y);
        vec3 mirror = skyColor(reflected);
        if (uHasReflection > 0.5) {
          vec2 uv = vReflectUv.xy / vReflectUv.w + n.xz * 0.06;
          mirror = texture2D(tReflect, uv).rgb;
        }
        // Light through the water body: dusky indigo depths, warmer over the shallows.
        float absorb = 1.0 - exp(-max(vDepth, 0.0) * 0.55);
        vec3 deep = uSkyFill * vec3(0.07, 0.08, 0.13) + uFogColor * 0.03;
        // Highlights: a sharp sun glint plus a broad sheen, and a soft moon path at night.
        float sunDot = max(dot(reflected, uSunDir), 0.0);
        vec3 glint = uKeyLight * (pow(sunDot, 1400.0) * 9.0 + pow(sunDot, 120.0) * 0.12) * smoothstep(-0.05, 0.05, uSunDir.y);
        glint += vec3(0.55, 0.65, 1.0) * pow(max(dot(reflected, uMoonDir), 0.0), 220.0) * 2.5 * uNight;
        // Foam where the river meets the bank.
        float foamNoise = wNoise(vWorldPos.xz * 1.4 + vec2(0.0, uTime * 0.8));
        float foam = smoothstep(0.42, 0.0, vDepth) * (0.35 + 0.65 * foamNoise) * smoothstep(-0.25, 0.04, vDepth);
        vec3 foamColor = (uKeyLight * max(uSunDir.y, 0.08) * 0.32 + uSkyFill * 0.5);
        float alpha = 1.0 - (1.0 - absorb) * (1.0 - fresnel);
        vec3 color = (deep * absorb * (1.0 - fresnel) + mirror * fresnel) / max(alpha, 1e-3);
        color += glint;
        color = mix(color, foamColor, foam * 0.55);
        alpha = max(alpha, foam * 0.5);
        alpha *= smoothstep(-0.3, 0.08, vDepth);
        gl_FragColor = vec4(applyAtmosphere(color, vWorldPos), clamp(alpha, 0.0, 1.0));
      }`,
  });
}
