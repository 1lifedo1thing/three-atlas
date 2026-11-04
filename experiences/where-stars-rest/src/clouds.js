import { BufferAttribute, BufferGeometry, Points, ShaderMaterial, Vector3 } from 'three';
import { random, TAU } from './math.js';

// Soft, depth-tested billboards form separated wisps below the island.
// Points are excluded from GTAO's normal pass, so translucent clouds never turn
// into invisible solid planes or add spurious ambient shadows.
export function createClouds(time, pixelRatio) {
  const rng = random(383), positions = [], sizes = [], phases = [], opacities = [];
  const banks = [
    [-3.45, -3.85, -.6, 4.1, .22], [3.6, -3.95, -1.2, 4.5, .24],
    [-2.6, -4.2, 1.5, 3.5, .18], [2.5, -4.3, 1.5, 3.8, .20],
    [0, -4.65, -.4, 5.2, .24], [.2, -4.15, -3.2, 4.3, .20],
  ];
  for (const [x, y, z, size, opacity] of banks) {
    for (let i = 0; i < 3; i++) {
      positions.push(x + (rng() - .5) * 1.4, y + (rng() - .5) * .45, z + (rng() - .5) * .9);
      sizes.push(size * (.72 + rng() * .34));
      phases.push(rng() * TAU);
      opacities.push(opacity * (.7 + rng() * .45));
    }
  }
  const geometry = new BufferGeometry();
  for (const [name, values, size] of [
    ['position', positions, 3], ['aSize', sizes, 1], ['aPhase', phases, 1], ['aOpacity', opacities, 1],
  ]) geometry.setAttribute(name, new BufferAttribute(new Float32Array(values), size));

  const material = new ShaderMaterial({
    transparent: true, depthTest: true, depthWrite: false,
    uniforms: {
      uTime: time, uViewportHeight: { value: 800 * pixelRatio }, uGlow: { value: .55 },
      uCameraUpY: { value: .94 },
      uSources: { value: Array.from({ length: 4 }, () => new Vector3(0, 0, -30)) },
    },
    vertexShader: /* glsl */`
      uniform float uTime, uViewportHeight;
      attribute float aSize, aPhase, aOpacity;
      varying float vPhase, vOpacity, vSize, vCenterHeight;
      varying vec3 vViewCenter;
      void main() {
        vec3 p = position;
        p.x += sin(uTime*.037+aPhase)*.45;
        p.z += cos(uTime*.029+aPhase)*.25;
        p.y += sin(uTime*.052+aPhase)*.09;
        vPhase = aPhase;
        vOpacity = aOpacity * (.78+.22*sin(uTime*.06+aPhase));
        vec4 mv = modelViewMatrix*vec4(p,1.);
        vViewCenter=mv.xyz; vSize=aSize; vCenterHeight=p.y;
        gl_Position = projectionMatrix*mv;
        gl_PointSize = min(510., aSize*uViewportHeight*.5*projectionMatrix[1][1]/max(.1,-mv.z));
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime,uGlow,uCameraUpY;
      uniform vec3 uSources[4];
      varying float vPhase, vOpacity, vSize, vCenterHeight;
      varying vec3 vViewCenter;
      float hash(vec2 p) {
        p=fract(p*vec2(123.34,456.21));
        p+=dot(p,p+45.32); return fract(p.x*p.y);
      }
      float noise(vec2 p) {
        vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
          mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
      }
      void main() {
        vec2 p=(gl_PointCoord-.5)*2.;
        vec2 q=p*vec2(1.,1.85);
        vec2 drift=vec2(uTime*.012+vPhase, vPhase*.7);
        float n=noise(q*2.1+drift)*.68+noise(q*4.2-drift*.3)*.32;
        vec2 left=(q-vec2(-.27,-.02))*vec2(1.15,1.05);
        vec2 right=(q-vec2(.29,.08))*vec2(1.3,1.15);
        float body=max(exp(-dot(left,left)*3.),exp(-dot(right,right)*3.3)*.9);
        float edges=smoothstep(1.,.48,length(p));
        float density=body*(.45+.55*smoothstep(.12,.78,n))*edges;
        float fragmentHeight=vCenterHeight-p.y*vSize*.5*uCameraUpY;
        float belowIsland=1.-smoothstep(-3.45,-3.1,fragmentHeight);
        float alpha=density*vOpacity*belowIsland;
        if(alpha<.0008) discard;
        vec3 tint=mix(vec3(.085,.10,.18),vec3(.21,.23,.31),smoothstep(-.5,.6,q.y));
        vec3 viewPoint=vViewCenter+vec3(p.x,-p.y,0.)*vSize*.5;
        for(int i=0;i<4;i++) {
          float distanceToLight=length(viewPoint-uSources[i]);
          float scatter=exp(-distanceToLight*.42)/(1.+distanceToLight*.22);
          vec3 violet=i==1 ? vec3(.68,.16,1.) : vec3(.34,.07,1.);
          float lightGain=i<3 ? .35 : .8;
          tint+=violet*scatter*(.4+uGlow*.9)*lightGain;
        }
        gl_FragColor=vec4(tint,alpha);
      }
    `,
  });
  const clouds = new Points(geometry, material);
  clouds.name = 'ambient-cloud-wisps';
  clouds.frustumCulled = false;
  clouds.renderOrder = 1;
  return clouds;
}
