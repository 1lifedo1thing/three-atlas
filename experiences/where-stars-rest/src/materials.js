import { Color, DoubleSide, MeshStandardMaterial } from 'three';

export function rockMaterial() {
  const material = new MeshStandardMaterial({ color: '#a1a9c3', vertexColors: true, roughness: 0.89, metalness: 0.12 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vStonePosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvStonePosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vStonePosition;
      float stoneHash(vec3 p) { p=fract(p*.3183099+vec3(.1,.3,.7)); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float stoneNoise(vec3 p) { vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(stoneHash(i),stoneHash(i+vec3(1,0,0)),f.x),mix(stoneHash(i+vec3(0,1,0)),stoneHash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(stoneHash(i+vec3(0,0,1)),stoneHash(i+vec3(1,0,1)),f.x),mix(stoneHash(i+vec3(0,1,1)),stoneHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float broad = stoneNoise(vStonePosition*3.8);
      float fine = stoneNoise(vStonePosition*32.);
      float strata = smoothstep(.08,.24,abs(sin(vStonePosition.y*18.+broad*3.)));
      diffuseColor.rgb *= (.66 + broad*.46 + fine*.12) * (.77 + .23*strata);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      vec3 grain = vec3(dFdx(fine),dFdy(fine),0.);
      normal = normalize(normal + grain*.22);
    `);
  };
  return material;
}

export function windMaterial({ color = '#ffffff', emissive = '#000000', intensity = 0, leaf = false, time, breath = { value: .5 } }) {
  const material = new MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: leaf ? 0.48 : 0.86, metalness: leaf ? 0.13 : 0, side: DoubleSide });
  // Three.js cannot infer shader differences captured in a JavaScript closure.
  // Without this key, the grass program can replace the leaves' colored emission.
  material.customProgramCacheKey = () => `last-island-wind-v3-${leaf ? 'leaf' : 'grass'}`;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.uniforms.uBreath = breath;
    shader.uniforms.uBloomPulse = { value: 0 };
    material.userData.shader = shader;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying float vLifePhase;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec3 anchor = instanceMatrix[3].xyz;
      vLifePhase = anchor.x*1.3+anchor.y*.9+anchor.z*1.1;
      float wind = sin(uTime*.9+anchor.x*1.5+anchor.z*.7) + .35*sin(uTime*1.7+anchor.z*2.);
      ${leaf ? 'transformed.x += wind*.17*position.y; transformed.z += cos(uTime*.7+vLifePhase)*.09*position.y;' : 'transformed.x += wind*position.y*position.y*1.5; transformed.z += sin(uTime+anchor.x)*position.y*position.y*.6;'}
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uBreath;\nuniform float uBloomPulse;\nvarying float vLifePhase;');
    if (leaf) shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float shimmer = .96 + .04*sin(uTime*1.25+vLifePhase*2.);
      totalEmissiveRadiance *= diffuseColor.rgb * ((.56+.64*uBreath)*shimmer+uBloomPulse*.45);
    `);
  };
  return material;
}

export const palette = {
  cyan: new Color('#81dcf5'),
  violet: new Color('#9977ed'),
  pink: new Color('#e9a4df'),
};
