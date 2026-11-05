// Standard PBR materials, extended with the valley's atmosphere, wind, foliage light and evening glow.
// Built on MeshStandardMaterial so terrain and props keep real-time shadows.
import { Color, MeshStandardMaterial, Vector3 } from 'three';
import { ATMOSPHERE, atmosphere } from './atmosphere.js';

/** Shared light uniforms (intensity-scaled colours) updated every frame. */
export const lighting = {
  uKeyLight: { value: new Color(3, 2.4, 1.6) },
  uLightDir: { value: new Vector3(0, 0.3, -1).normalize() },
  uSkyFill: { value: new Color(0.5, 0.55, 0.8) },
  uGroundFill: { value: new Color(0.3, 0.22, 0.15) },
};

const VERTEX_HEAD = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uSwayAmount;
uniform float uBob;
attribute vec3 aProp;
varying vec3 vProp;
varying vec3 vWorldPos;
`;

const FRAGMENT_HEAD = /* glsl */ `
varying vec3 vProp;
varying vec3 vWorldPos;
uniform vec3 uKeyLight;
uniform vec3 uGlowColor;
uniform float uGlowFromInstance;
uniform float uGlowDay;
uniform float uGlowNight;
uniform float uTranslucency;
${ATMOSPHERE}
`;

const WORLD_POSITION = /* glsl */ `
#include <project_vertex>
{
  vec4 wp = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp;
  #endif
  vWorldPos = (modelMatrix * wp).xyz;
}
`;

/** Material for instanced props. `look` comes from props.js LOOKS. */
export function propMaterial(look = {}) {
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: look.roughness ?? 0.85, metalness: look.metalness ?? 0 });
  const uniforms = {
    uSwayAmount: { value: (look.sway ?? 0) * 0.32 },
    uBob: { value: look.bob ?? 0 },
    uGlowColor: { value: new Color(look.glowColor ?? '#ffffff') },
    uGlowFromInstance: { value: look.glowFromInstance ?? 0 },
    uGlowDay: { value: look.glowDay ?? 0 },
    uGlowNight: { value: look.glowNight ?? 0 },
    uTranslucency: { value: look.translucency ?? 0 },
  };
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, atmosphere, lighting, uniforms);
    shader.vertexShader = VERTEX_HEAD + shader.vertexShader
      .replace('#include <color_vertex>', /* glsl */ `#include <color_vertex>
        vProp = aProp;
        #if defined( USE_INSTANCING_COLOR ) && defined( USE_COLOR )
          vColor.rgb = mix(color.rgb, color.rgb * instanceColor.rgb, aProp.x);
        #endif`)
      .replace('#include <begin_vertex>', /* glsl */ `#include <begin_vertex>
        {
          #ifdef USE_INSTANCING
            vec3 origin = instanceMatrix[3].xyz;
          #else
            vec3 origin = vec3(0.0);
          #endif
          float phase = uTime * 1.35 + origin.x * 0.07 + origin.z * 0.05;
          float gust = 0.55 + 0.45 * sin(uTime * 0.42 + origin.x * 0.013 - origin.z * 0.009);
          float amount = aProp.y * uSwayAmount * gust * uWind;
          transformed.x += sin(phase) * amount;
          transformed.z += cos(phase * 0.83 + 1.3) * amount * 0.6;
          transformed.y += uBob * sin(uTime * 0.32 + origin.x * 0.011 + origin.z * 0.007) * 1.8;
        }`)
      .replace('#include <project_vertex>', WORLD_POSITION);
    shader.fragmentShader = FRAGMENT_HEAD + shader.fragmentShader
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
        {
          vec3 glowTint = mix(uGlowColor, vColor.rgb * 1.8, uGlowFromInstance);
          totalEmissiveRadiance += glowTint * vProp.z * (uGlowDay + uGlow * uGlowNight);
        }`)
      .replace('#include <lights_fragment_end>', /* glsl */ `#include <lights_fragment_end>
        {
          // Sunlight through leaves when looking toward the sun.
          vec3 viewRay = normalize(vWorldPos - cameraPosition);
          float back = pow(max(dot(viewRay, uSunDir), 0.0), 3.0);
          float rim = pow(1.0 - max(dot(-viewRay, normal * (gl_FrontFacing ? 1.0 : -1.0)), 0.0), 2.0);
          reflectedLight.indirectDiffuse += diffuseColor.rgb * uKeyLight * (back * 0.55 + rim * back * 0.6) * uTranslucency;
        }`)
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb = applyAtmosphere(gl_FragColor.rgb, vWorldPos);');
  };
  material.customProgramCacheKey = () => 'endless-vale-prop';
  return material;
}

/** Terrain: vertex-coloured ground with fine grain, wet banks and depth beneath the river. */
export function terrainMaterial() {
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0 });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, atmosphere, lighting);
    shader.vertexShader = 'varying vec3 vWorldPos;\n' + shader.vertexShader
      .replace('#include <project_vertex>', WORLD_POSITION);
    shader.fragmentShader = /* glsl */ `varying vec3 vWorldPos;
      ${ATMOSPHERE}
      float grainHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float grainNoise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(grainHash(i), grainHash(i + vec2(1, 0)), f.x), mix(grainHash(i + vec2(0, 1)), grainHash(i + vec2(1, 1)), f.x), f.y);
      }
      ` + shader.fragmentShader
      .replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
        {
          float dist = length(vWorldPos - cameraPosition);
          float fade = 1.0 - smoothstep(60.0, 320.0, dist);
          float grain = grainNoise(vWorldPos.xz * 0.45) * 0.6 + grainNoise(vWorldPos.xz * 1.9) * 0.4;
          diffuseColor.rgb *= mix(1.0, 0.84 + 0.3 * grain, fade);
          float under = smoothstep(0.1, -2.6, vWorldPos.y);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.28, 0.34, 0.52), under);
        }`)
      .replace('#include <roughnessmap_fragment>', /* glsl */ `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.35, smoothstep(0.9, 0.05, vWorldPos.y) * smoothstep(-1.0, 0.0, vWorldPos.y));`)
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb = applyAtmosphere(gl_FragColor.rgb, vWorldPos);');
  };
  material.customProgramCacheKey = () => 'endless-vale-terrain';
  return material;
}
