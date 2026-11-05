// Frame pipeline: scene (MSAA, with depth) → sun shafts at half resolution → bloom → grade, tone map, output.
import { DepthTexture, HalfFloatType, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget, Color } from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const QUAD_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

export class Pipeline {
  constructor(renderer, { samples = 4, rays = true, bloom = { strength: 0.6, radius: 0.55, threshold: 0.92 } } = {}) {
    this.renderer = renderer;
    this.scene = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples, depthTexture: new DepthTexture(1, 1) });
    this.rays = rays ? new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false }) : null;
    this.bloom = new UnrealBloomPass(new Vector2(1, 1), bloom.strength, bloom.radius, bloom.threshold);
    this.raysQuad = new FullScreenQuad(new ShaderMaterial({
      uniforms: { tColor: { value: this.scene.texture }, tDepth: { value: this.scene.depthTexture }, uSun: { value: new Vector2(0.5, 0.5) }, uAspect: { value: 1 }, uTime: { value: 0 } },
      defines: { SAMPLES: 40 },
      vertexShader: QUAD_VERTEX,
      fragmentShader: /* glsl */ `
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform vec2 uSun;
        uniform float uAspect;
        uniform float uTime;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec2 delta = (uSun - vUv) / float(SAMPLES) * 0.92;
          vec2 uv = vUv + delta * hash(vUv * 917.0 + fract(uTime));
          vec3 sum = vec3(0.0);
          float weight = 1.0;
          for (int i = 0; i < SAMPLES; i++) {
            uv += delta;
            vec2 c = clamp(uv, 0.0, 1.0);
            float sky = step(0.99999, texture2D(tDepth, c).x);
            vec3 col = texture2D(tColor, c).rgb;
            sum += sky * max(min(col, vec3(6.0)) - 0.9, 0.0) * weight;
            weight *= 0.962;
          }
          float d = length((uSun - vUv) * vec2(uAspect, 1.0));
          gl_FragColor = vec4(sum / float(SAMPLES) * exp(-d * 1.6), 1.0);
        }`,
    }));
    this.finalQuad = new FullScreenQuad(new ShaderMaterial({
      uniforms: {
        tScene: { value: this.scene.texture }, tRays: { value: this.rays?.texture ?? null },
        uRays: { value: 0 }, uRayColor: { value: new Color(1, 0.7, 0.4) },
        uVignette: { value: 0.32 }, uAberration: { value: 0.003 }, uSpeed: { value: 0 }, uSaturation: { value: 1.14 }, uTime: { value: 0 },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: /* glsl */ `
        uniform sampler2D tScene;
        uniform sampler2D tRays;
        uniform float uRays;
        uniform vec3 uRayColor;
        uniform float uVignette;
        uniform float uAberration;
        uniform float uSpeed;
        uniform float uSaturation;
        uniform float uTime;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec2 c = vUv - 0.5;
          float r2 = dot(c, c);
          vec2 off = c * (uAberration + uSpeed * 0.01) * (0.4 + r2 * 2.0);
          vec3 col = vec3(texture2D(tScene, vUv - off).r, texture2D(tScene, vUv).g, texture2D(tScene, vUv + off).b);
          // Speed: a light zoom blur toward the edges when the flight is fast.
          if (uSpeed > 0.01) {
            vec3 streak = vec3(0.0);
            for (int i = 1; i <= 6; i++) streak += texture2D(tScene, vUv - c * float(i) * 0.012 * uSpeed).rgb;
            col = mix(col, streak / 6.0, smoothstep(0.02, 0.22, r2) * uSpeed * 0.85);
          }
          if (uRays > 0.0) col += texture2D(tRays, vUv).rgb * uRayColor * uRays;
          float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
          col = max(mix(vec3(l), col, uSaturation), 0.0);
          col *= 1.0 - uVignette * smoothstep(0.08, 0.6, r2 * 1.5);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
        }`,
    }));
    this._sun = new Vector3();
  }

  setSize(width, height, pixelRatio) {
    const w = Math.max(1, Math.round(width * pixelRatio)), h = Math.max(1, Math.round(height * pixelRatio));
    this.scene.setSize(w, h);
    this.rays?.setSize(Math.ceil(w / 2), Math.ceil(h / 2));
    this.bloom.setSize(w, h);
    this.raysQuad.material.uniforms.uAspect.value = w / h;
  }

  /** Screen position of the sun and how strongly it should cast shafts. */
  sunOnScreen(camera, sunDir) {
    const p = this._sun.copy(camera.position).addScaledVector(sunDir, 1000).project(camera);
    const inFront = new Vector3().copy(sunDir).dot(camera.getWorldDirection(new Vector3())) > 0;
    const edge = Math.max(Math.abs(p.x), Math.abs(p.y));
    return { x: p.x * 0.5 + 0.5, y: p.y * 0.5 + 0.5, strength: inFront ? 1 - Math.min(Math.max((edge - 1) / 0.6, 0), 1) : 0 };
  }

  render(scene, camera, { time = 0, sunDir, sunColor, rays = 0, bloom = 0.6, speed = 0 }) {
    const r = this.renderer;
    r.setRenderTarget(this.scene);
    r.clear();
    r.render(scene, camera);
    const final = this.finalQuad.material.uniforms;
    let shafts = 0;
    if (this.rays && rays > 0.001) {
      const sun = this.sunOnScreen(camera, sunDir);
      shafts = rays * sun.strength;
      if (shafts > 0.001) {
        const u = this.raysQuad.material.uniforms;
        u.uSun.value.set(sun.x, sun.y); u.uTime.value = time;
        r.setRenderTarget(this.rays);
        this.raysQuad.render(r);
      }
    }
    this.bloom.strength = bloom;
    if (bloom > 0.001) this.bloom.render(r, null, this.scene, 0, false);
    final.uRays.value = shafts; final.uRayColor.value.copy(sunColor); final.uSpeed.value = speed; final.uTime.value = time;
    r.setRenderTarget(null);
    this.finalQuad.render(r);
  }

  dispose() {
    this.scene.dispose(); this.scene.depthTexture.dispose(); this.rays?.dispose(); this.bloom.dispose();
    this.raysQuad.material.dispose(); this.raysQuad.dispose(); this.finalQuad.material.dispose(); this.finalQuad.dispose();
  }
}
