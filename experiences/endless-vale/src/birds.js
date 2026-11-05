// A small flock that keeps ahead of the flight by day.
import { BufferAttribute, BufferGeometry, DoubleSide, DynamicDrawUsage, InstancedMesh, Matrix4, Quaternion, ShaderMaterial, Vector3 } from 'three';
import { ATMOSPHERE, atmosphere } from './atmosphere.js';
import { hash3 } from './noise.js';
import { pathX, pathSlope } from './world.js';

function birdGeometry() {
  // Body along -Z, wings along ±X; aWing marks how far a vertex is from the body.
  const p = [0, 0, -0.9, 0.12, 0, 0.3, -0.12, 0, 0.3, // body
    0, 0, -0.25, 1.5, 0.05, 0.25, 0.1, 0, 0.35, // right wing
    0, 0, -0.25, -0.1, 0, 0.35, -1.5, 0.05, 0.25]; // left wing
  const w = [0, 0, 0, 0, 1, 0.1, 0, 0.1, 1];
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(p), 3));
  g.setAttribute('aWing', new BufferAttribute(new Float32Array(w), 1));
  return g;
}

export function createFlock(count = 26) {
  const material = new ShaderMaterial({
    side: DoubleSide,
    uniforms: { ...atmosphere },
    vertexShader: /* glsl */ `
      attribute float aWing;
      uniform float uTime;
      varying vec3 vWorldPos;
      void main() {
        vec3 p = position;
        float phase = uTime * 7.5 + float(gl_InstanceID) * 1.37;
        p.y += sin(phase) * aWing * 0.7;
        p.x *= 1.0 - 0.18 * aWing * (0.5 + 0.5 * sin(phase));
        vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
        vWorldPos = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vWorldPos;
      ${ATMOSPHERE}
      void main() {
        vec3 c = mix(vec3(0.03, 0.025, 0.035), uFogColor * 0.25, 0.3);
        gl_FragColor = vec4(applyAtmosphere(c, vWorldPos), 1.0);
      }`,
  });
  const mesh = new InstancedMesh(birdGeometry(), material, count);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.frustumCulled = false;
  const offsets = Array.from({ length: count }, (_, i) => [hash3(i, 1) - 0.5, hash3(i, 2) - 0.5, hash3(i, 3) - 0.5, hash3(i, 4)]);
  let center = 160, lap = 0;
  const m = new Matrix4(), q = new Quaternion(), pos = new Vector3(), scale = new Vector3(), up = new Vector3(0, 1, 0);
  return {
    mesh,
    update(s, time, night, dt) {
      center += dt * 17;
      if (center < s + 40 || center > s + 700) { lap++; center = s + 260 + hash3(lap, 9) * 200; }
      const visible = 1 - Math.min(Math.max((night - 0.3) / 0.4, 0), 1);
      mesh.visible = visible > 0.01;
      if (!mesh.visible) return;
      for (let i = 0; i < count; i++) {
        const [ox, oy, oz, k] = offsets[i];
        const t = center + oz * 46 + Math.sin(time * 0.4 + k * 9) * 3;
        const yaw = -Math.atan(pathSlope(t)) + Math.sin(time * 0.7 + k * 20) * 0.25;
        pos.set(pathX(t) + ox * 34 + Math.sin(time * 0.33 + k * 5) * 5, 30 + oy * 10 + Math.sin(time * 0.5 + k * 12) * 2.5 + Math.sin(center * 0.004) * 6, -t);
        q.setFromAxisAngle(up, yaw);
        const sz = (0.75 + k * 0.5) * visible;
        m.compose(pos, q, scale.set(sz, sz, sz));
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
