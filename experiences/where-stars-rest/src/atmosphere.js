import {
  AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, Group,
  Line, LineBasicMaterial, Mesh, Points, ShaderMaterial,
  SphereGeometry, Vector3,
} from 'three';
import { random, TAU } from './math.js';
import { createClouds } from './clouds.js';
import { createFireflies } from './fireflies.js';

function createNebula(time) {
  const material = new ShaderMaterial({
    side: BackSide, depthWrite: false,
    uniforms: { uTime: time },
    vertexShader: `varying vec3 vDirection; void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      uniform float uTime; varying vec3 vDirection;
      void main(){
        vec3 d=normalize(vDirection);
        vec3 base=vec3(.006,.009,.022);
        float violet=pow(max(0.,dot(d,normalize(vec3(-.3,.12,-1.)))),8.);
        float blue=pow(max(0.,dot(d,normalize(vec3(.7,-.05,-.8)))),13.);
        float mist=.5+.5*sin(d.x*10.+d.y*13.+sin(d.z*8.+d.x*9.)*.7);
        float silk=.5+.5*sin(d.y*22.+sin(d.x*13.)*1.5+d.z*8.);
        base+=vec3(.026,.014,.055)*violet*(.48+mist*.23+silk*.12);
        base+=vec3(.009,.027,.047)*blue;
        gl_FragColor=vec4(base,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const sphere = new Mesh(new SphereGeometry(85, 32, 24), material);
  sphere.renderOrder = -10; sphere.frustumCulled = false;
  return sphere;
}

function createStars(time, compact, pixelRatio) {
  const rng = random(81), count = compact ? 1200 : 2100;
  const positions = [], sizes = [], phases = [], colors = [];
  const blue = new Color('#9fb3dc'), pink = new Color('#cbafdc'), white = new Color('#d2deed'), color = new Color();
  for (let i = 0; i < count; i++) {
    const a = rng() * TAU, b = Math.acos(rng() * 2 - 1), r = 55 + rng() * 20;
    positions.push(Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r, Math.sin(b) * Math.sin(a) * r);
    sizes.push(.65 + Math.pow(rng(), 5) * 2.3); phases.push(rng() * TAU);
    color.copy(i % 6 === 0 ? pink : i % 3 ? blue : white).multiplyScalar(.3 + rng() * .55);
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('aSize', new BufferAttribute(new Float32Array(sizes), 1));
  geometry.setAttribute('aPhase', new BufferAttribute(new Float32Array(phases), 1));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, vertexColors: true,
    uniforms: { uTime: time, uPixelRatio: { value: pixelRatio } },
    vertexShader: `uniform float uTime,uPixelRatio; attribute float aSize,aPhase; varying vec3 vColor; varying float vBrightness;
      void main(){vColor=color; vBrightness=.72+.28*sin(uTime*.3+aPhase); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_PointSize=aSize*uPixelRatio;}`,
    fragmentShader: `varying vec3 vColor; varying float vBrightness;
      void main(){float d=length(gl_PointCoord-.5)*2.; float a=pow(max(0.,1.-d),1.5); gl_FragColor=vec4(vColor*vBrightness,a);}`,
  });
  return new Points(geometry, material);
}

function createMotes(time, pixelRatio, breath) {
  const rng = random(91), count = 68, positions = [], phases = [], sizes = [], colors = [];
  const color = new Color();
  for (let i = 0; i < count; i++) {
    const a = rng() * TAU, inner = i < count * .65;
    const r = inner ? .6 + rng() * 2.3 : 2.6 + rng() * 2.2;
    positions.push(Math.cos(a) * r, inner ? 1.5 + rng() * 3.1 : .1 + rng() * 4.6, Math.sin(a) * r * .75);
    phases.push(rng() * TAU); sizes.push(1.6 + rng() * 3.6);
    color.set(i % 3 ? '#83c8ed' : '#bba0f2').multiplyScalar(.9 + rng() * .9);
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('aPhase', new BufferAttribute(new Float32Array(phases), 1));
  geometry.setAttribute('aSize', new BufferAttribute(new Float32Array(sizes), 1));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, vertexColors: true,
    uniforms: { uTime: time, uBreath: breath, uPixelRatio: { value: pixelRatio }, uPulse: { value: 0 } },
    vertexShader: `uniform float uTime,uBreath,uPixelRatio,uPulse; attribute float aPhase,aSize; varying vec3 vColor; varying float vOpacity;
      void main(){vec3 p=position; float orbit=uTime*(.022+.008*sin(aPhase));
        p.xz=mat2(cos(orbit),-sin(orbit),sin(orbit),cos(orbit))*p.xz;
        p.xz*=1.+uBreath*.04;
        p.x+=sin(uTime*.17+aPhase)*.25; p.y+=sin(uTime*.3+aPhase)*.35; p.z+=cos(uTime*.2+aPhase)*.25;
        vColor=color*(.75+.55*uBreath)*(1.+uPulse*.4);
        vOpacity=(.18+.68*uBreath)*(.9+.1*sin(uTime*2.+aPhase));
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=aSize*(.75+.4*uBreath)*uPixelRatio*min(1.8,16./-mv.z);}`,
    fragmentShader: `varying vec3 vColor; varying float vOpacity;
      void main(){float d=length(gl_PointCoord-.5)*2.; float glow=exp(-d*d*5.); float core=exp(-d*d*25.); gl_FragColor=vec4(vColor*(.7+core*1.8),glow*vOpacity);}`,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function createPetals(time, pixelRatio, breath) {
  const rng = random(72), count = 25, positions = [], phases = [];
  for (let i = 0; i < count; i++) {
    positions.push((rng() - .5) * 4, 0, (rng() - .5) * 3);
    phases.push(rng() * TAU);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('aPhase', new BufferAttribute(new Float32Array(phases), 1));
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uTime: time, uBreath: breath, uPixelRatio: { value: pixelRatio } },
    vertexShader: `uniform float uTime,uBreath,uPixelRatio; attribute float aPhase; varying float vPhase,vFade;
      void main(){vec3 p=position; float life=fract(uTime*.025+aPhase/6.28318); p.y=3.8-life*4.; p.x+=sin(life*7.+aPhase)*.35; p.z+=cos(life*5.+aPhase)*.28;
        vPhase=aPhase+uTime*.7; vFade=sin(life*3.14159)*(.4+.6*uBreath); vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=5.*uPixelRatio*min(1.6,16./-mv.z);}`,
    fragmentShader: `varying float vPhase,vFade; void main(){vec2 p=gl_PointCoord-.5; float a=vPhase; p=mat2(cos(a),-sin(a),sin(a),cos(a))*p; float shape=abs(p.x)*1.7+abs(p.y); float alpha=smoothstep(.5,.19,shape)*vFade*.6; gl_FragColor=vec4(.75,.38,1.1,alpha);}`,
  });
  const points = new Points(geometry, material); points.frustumCulled = false;
  return points;
}

function createOrbits(parent) {
  const points = [];
  for (let i = 0; i <= 220; i++) {
    const a = i / 220 * TAU;
    points.push(new Vector3(Math.cos(a) * 5.7, -.9 + Math.sin(a) * .28, Math.sin(a) * 3.5));
  }
  const orbit = new Line(new BufferGeometry().setFromPoints(points), new LineBasicMaterial({ color: '#67719f', transparent: true, opacity: .115, depthWrite: false }));
  orbit.rotation.z = -.15;
  parent.add(orbit);

}

export function createAtmosphere({ time, compact, pixelRatio, breath = { value: .5 } }) {
  const space = new Group(), local = new Group();
  const nebula = createNebula(time), stars = createStars(time, compact, pixelRatio);
  const motes = createMotes(time, pixelRatio, breath), petals = createPetals(time, pixelRatio, breath);
  const clouds = createClouds(time, pixelRatio);
  const fireflies = createFireflies({ compact, pixelRatio, breath });
  space.add(nebula, stars); local.add(motes, petals, fireflies.points, clouds); createOrbits(local);
  return {
    space, local,
    update(t, pulse, glow = .55, sources = [], camera) {
      fireflies.update(t);
      clouds.material.uniforms.uGlow.value = glow;
      if (camera) clouds.material.uniforms.uCameraUpY.value = camera.matrixWorld.elements[5];
      sources.forEach((source, i) => clouds.material.uniforms.uSources.value[i].copy(source));
      stars.rotation.y = t * .001;
      motes.material.uniforms.uPulse.value = pulse;
    },
    setPixelRatio(value, viewportHeight = 800) {
      for (const points of [stars, motes, petals]) points.material.uniforms.uPixelRatio.value = value;
      clouds.material.uniforms.uViewportHeight.value = viewportHeight * value;
      fireflies.setPixelRatio(value);
    },
  };
}
