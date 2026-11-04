import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points,
  ShaderMaterial, Vector3,
} from 'three';
import { random, TAU } from './math.js';

export function sampleSwarmCenter(t, flock, target = new Vector3()) {
  const phase = flock * 1.71;
  const angle = phase + t * (flock % 2 ? -.22 : .25);
  const radius = 3.65 + Math.sin(t * .38 + phase) * .42;
  return target.set(
    Math.cos(angle) * radius,
    .7 + flock * .43 + Math.sin(t * .62 + phase) * .55,
    Math.sin(angle) * radius * .8,
  );
}

export function sampleFirefly(t, flock, seed, target = new Vector3()) {
  sampleSwarmCenter(t, flock, target);
  // A shared moving center keeps each flock together. The breathing spread and
  // individual curls let it gather, scatter, double back and gather again.
  const spread = .24 + Math.pow(.5 + .5 * Math.sin(t * .8 + flock * 1.7), 2) * .48;
  const phase = seed * TAU;
  target.x += Math.sin(t * (1.5 + seed * .6) + phase) * spread;
  target.y += Math.sin(t * 1.9 + phase * 2.4) * spread * .65;
  target.z += Math.cos(t * (1.3 + seed * .5) + phase * 1.7) * spread;
  return target;
}

export function createFireflies({ compact, pixelRatio, breath = { value: .5 } }) {
  const rng = random(623), members = compact ? 18 : 30, flocks = 4, trails = 3;
  const count = members * flocks * trails;
  const positions = new Float32Array(count * 3);
  const colors = [], sizes = [], phases = [], tails = [], insects = [];
  for (let flock = 0; flock < flocks; flock++) {
    for (let i = 0; i < members; i++) {
      const seed = rng(), color = new Color(i % 5 ? '#bda2ff' : '#ffd3a0');
      insects.push({ flock, seed });
      for (let tail = 0; tail < trails; tail++) {
        colors.push(color.r, color.g, color.b);
        sizes.push((tail ? 4 : 9.5) + rng() * 2.5);
        phases.push(seed * TAU); tails.push(tail);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  for (const [name, values, size] of [
    ['color', colors, 3], ['aSize', sizes, 1], ['aPhase', phases, 1], ['aTail', tails, 1],
  ]) geometry.setAttribute(name, new BufferAttribute(new Float32Array(values), size));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, vertexColors: true,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio }, uBreath: breath },
    vertexShader: /* glsl */`
      uniform float uTime,uPixelRatio,uBreath;
      attribute float aSize,aPhase,aTail;
      varying vec3 vColor; varying float vOpacity;
      void main() {
        vColor=color*(.72+.48*uBreath);
        float sparkle=.86+.14*pow(.5+.5*sin(uTime*2.+aPhase*2.),2.);
        vOpacity=(.38+.62*uBreath)*sparkle*(aTail<.5 ? 1. : .27/(aTail+.5));
        vec4 mv=modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=aSize*(.88+.24*uBreath)*uPixelRatio*min(1.8,16./max(.1,-mv.z));
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3 vColor; varying float vOpacity;
      void main() {
        float r=length(gl_PointCoord-.5)*2.;
        float core=exp(-r*r*32.);
        float halo=exp(-r*r*4.)*.23;
        gl_FragColor=vec4(vColor*(2.1+core*2.2),(core+halo)*vOpacity);
      }
    `,
  });
  const points = new Points(geometry, material);
  points.name = 'four-chasing-firefly-swarms';
  points.frustumCulled = false;
  const point = new Vector3();
  function update(t) {
    material.uniforms.uTime.value = t;
    let index = 0;
    for (const insect of insects) {
      for (let tail = 0; tail < trails; tail++) {
        sampleFirefly(t - tail * .065, insect.flock, insect.seed, point);
        positions[index++] = point.x; positions[index++] = point.y; positions[index++] = point.z;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  }
  update(0);
  return { points, update, setPixelRatio(value) { material.uniforms.uPixelRatio.value = value; } };
}
