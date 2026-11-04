import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, CylinderGeometry,
  Group, IcosahedronGeometry, Mesh, MeshStandardMaterial, PointLight, Points,
  ShaderMaterial, Vector3,
} from 'three';

export const UNDERLIGHT_POSITIONS = [
  [-1.55, -1.25, 1.95],
  [1.75, -1.55, 1.38],
  [.12, -2.92, .36],
];

// Real lights illuminate the rock. Small emissive crystals locate each source;
// depth-tested, colored halos describe the light suspended in the surrounding air.
export function createLightRig(time, breath = { value: .5 }) {
  const group = new Group();
  group.name = 'violet-light-sources';
  const colors = ['#9d4dff', '#b65eff', '#8637ff'];
  const lights = [], cores = [], shells = [];
  const crystalGeometry = new CylinderGeometry(0, .065, .31, 5);
  const coreGeometry = new IcosahedronGeometry(.075, 1);
  UNDERLIGHT_POSITIONS.forEach((position, i) => {
    const source = new Group();
    source.position.set(...position);
    const coreMaterial = new MeshStandardMaterial({
      color: '#ad88da', emissive: colors[i], emissiveIntensity: .9,
      roughness: .25, metalness: .12,
    });
    const shellMaterial = new MeshStandardMaterial({
      color: colors[i], emissive: colors[i], emissiveIntensity: .5,
      roughness: .38, metalness: .3,
    });
    const core = new Mesh(coreGeometry, coreMaterial);
    source.add(core);
    for (let j = 0; j < 4; j++) {
      const angle = j * Math.PI * .5 + i * .7;
      const shard = new Mesh(crystalGeometry, shellMaterial);
      shard.position.set(Math.cos(angle) * .085, -.06 + j * .018, Math.sin(angle) * .085);
      shard.rotation.set(Math.sin(angle) * .4, angle, Math.PI + Math.cos(angle) * .35);
      source.add(shard);
    }
    const light = new PointLight(colors[i], 4.5, 4.2, 2);
    source.add(light); group.add(source);
    lights.push(light); cores.push(coreMaterial); shells.push(shellMaterial);
  });

  const positions = [], sizes = [], tints = [], weights = [];
  const aura = [
    ...UNDERLIGHT_POSITIONS.map((p, i) => ({ p, size: i === 2 ? 1.8 : 1.45, color: colors[i], weight: .12 })),
    { p: [-.85, 3.5, -.35], size: 3.9, color: '#9140f2', weight: .32 },
    { p: [.85, 3.45, -.45], size: 3.9, color: '#a24fff', weight: .32 },
    { p: [-.05, 3.95, -.6], size: 3.5, color: '#bd65ff', weight: .27 },
    { p: [-.18, 1.2, -.05], size: 1.7, color: '#8b4afb', weight: .2 },
  ];
  for (const item of aura) {
    const color = new Color(item.color);
    positions.push(...item.p); sizes.push(item.size); weights.push(item.weight);
    tints.push(color.r, color.g, color.b);
  }
  const geometry = new BufferGeometry();
  for (const [name, values, size] of [
    ['position', positions, 3], ['color', tints, 3], ['aSize', sizes, 1], ['aWeight', weights, 1],
  ]) geometry.setAttribute(name, new BufferAttribute(new Float32Array(values), size));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true,
    blending: AdditiveBlending, vertexColors: true,
    uniforms: { uBreath: breath, uGlow: { value: .55 }, uViewportHeight: { value: 800 } },
    vertexShader: /* glsl */`
      uniform float uViewportHeight,uBreath;
      attribute float aSize,aWeight;
      varying vec3 vColor; varying float vWeight;
      void main() {
        vColor=color; vWeight=aWeight;
        vec4 mv=modelViewMatrix*vec4(position,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=min(510.,aSize*(.94+.1*uBreath)*uViewportHeight*.5*projectionMatrix[1][1]/max(.1,-mv.z));
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uBreath,uGlow;
      varying vec3 vColor; varying float vWeight;
      void main() {
        float r=length(gl_PointCoord-.5)*2.;
        float atmosphere=exp(-r*r*3.8)*smoothstep(1.,.62,r);
        float breathingLight=.58+.62*uBreath;
        gl_FragColor=vec4(vColor*(1.4+uGlow),atmosphere*vWeight*uGlow*breathingLight);
      }
    `,
  });
  const halos = new Points(geometry, material);
  halos.name = 'purple-light-in-air';
  halos.frustumCulled = false;
  group.add(halos);
  const viewPositions = lights.map(() => new Vector3());
  return {
    group,
    lights,
    update(t, glow) {
      material.uniforms.uGlow.value = glow;
      lights.forEach((light, i) => {
        const softBreath = .9 + breath.value * .1;
        light.intensity = (1 + glow * 3.5) * softBreath;
        cores[i].emissiveIntensity = (.18 + glow * .65) * (.85 + breath.value * .15);
        shells[i].emissiveIntensity = .12 + glow * .45;
      });
    },
    setViewport(height) { material.uniforms.uViewportHeight.value = height; },
    getViewPositions(camera) {
      lights.forEach((light, i) => light.getWorldPosition(viewPositions[i]).applyMatrix4(camera.matrixWorldInverse));
      return viewPositions;
    },
  };
}
