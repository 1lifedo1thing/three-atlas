import * as THREE from 'three';

const TAU = Math.PI * 2;
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
function rng(seed=81261){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// Indexed, variable-radius tubes: the branch really tapers, including its silhouette.
function tube(points,radius,segments=36,sides=7){
  const curve=new THREE.CatmullRomCurve3(points), frames=curve.computeFrenetFrames(segments,false);
  const pos=[],uv=[],idx=[],color=[];
  const c1=new THREE.Color('#b4c8e8'),c2=new THREE.Color('#e4c1d5');
  for(let i=0;i<=segments;i++){
    const t=i/segments,p=curve.getPointAt(t),r=radius(t)*(1+.035*Math.sin(t*165));
    const tint=c1.clone().lerp(c2,.25+.35*Math.sin(t*2.8));
    for(let j=0;j<=sides;j++){
      const a=j/sides*TAU,b=frames.normals[i].clone().multiplyScalar(Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r).add(p);
      pos.push(b.x,b.y,b.z);uv.push(j/sides,t);color.push(tint.r,tint.g,tint.b);
      if(i<segments&&j<sides){const k=i*(sides+1)+j;idx.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
function surface(fn,nu,nv){
  const p=[],uv=[],idx=[];
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const v=fn(i/nu,j/nv);p.push(v.x,v.y,v.z);uv.push(i/nu,j/nv);if(i<nu&&j<nv){const k=j*(nu+1)+i;idx.push(k,k+1,k+nu+1,k+1,k+nu+2,k+nu+1);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function merge(items){
  let nv=0,ni=0;for(const g of items){nv+=g.attributes.position.count;ni+=g.index.count;}
  const p=new Float32Array(nv*3),n=new Float32Array(nv*3),u=new Float32Array(nv*2),c=new Float32Array(nv*3),ix=new Uint32Array(ni);let v=0,k=0;
  for(const g of items){const count=g.attributes.position.count;p.set(g.attributes.position.array,v*3);n.set(g.attributes.normal.array,v*3);u.set(g.attributes.uv.array,v*2);if(g.attributes.color)c.set(g.attributes.color.array,v*3);else c.fill(1,v*3,(v+count)*3);for(const i of g.index.array)ix[k++]=i+v;v+=count;g.dispose();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(n,3));g.setAttribute('uv',new THREE.BufferAttribute(u,2));g.setAttribute('color',new THREE.BufferAttribute(c,3));g.setIndex(new THREE.BufferAttribute(ix,1));g.computeBoundingSphere();return g;
}

const deform=`
uniform float uBreath;
vec3 drift(vec3 p){
 float breath=uBreath;
 float mantle=smoothstep(.1,1.1,p.y);
 p.xz*=1.+.016*breath*mantle;
 p.y+=.025*breath*mantle;
 float trail=clamp(-p.y*.32,0.,1.);
 p.x+=sin(uTime*.68+p.y*1.5+p.z)*.16*trail*trail;
 p.z+=cos(uTime*.53+p.y*1.8+p.x)*.13*trail*trail;
 return p;
}`;
const vertex=`
uniform float uTime;varying vec3 vNormal;varying vec3 vWorld;varying vec2 vUv;varying vec3 vLocal;
${deform}
void main(){vUv=uv;vLocal=position;vec3 p=drift(position);vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}
`;

function membrane(uniforms,{opacity=.48,kind=0}={}){
 return new THREE.ShaderMaterial({uniforms:{...uniforms,uOpacity:{value:opacity},uKind:{value:kind}},vertexShader:vertex,fragmentShader:`
uniform float uTime,uWake,uLight,uOpacity,uKind;varying vec3 vNormal,vWorld,vLocal;varying vec2 vUv;
void main(){
 vec3 N=normalize(vNormal);vec3 E=normalize(cameraPosition-vWorld);
 float facing=abs(dot(N,E));float fresnel=pow(1.-facing,2.8);
 float a=vUv.x*6.2831853;
 float large=pow(.5+.5*cos(a*24.+.15*sin(vUv.y*16.)),14.);
 float fine=pow(.5+.5*cos(a*192.+.45*sin(vUv.y*45.+a*8.)),28.);
 float cell=pow(.5+.5*sin(a*86.+sin(vUv.y*190.))*sin(vUv.y*145.+sin(a*24.)),8.);
 if(uKind>1.5){large=0.;fine=pow(.5+.5*cos(vUv.x*28.+vUv.y*4.),5.)*.18;cell=0.;}
 float edge=pow(vUv.y,8.);
 float wave=exp(-pow((vUv.y-fract(uTime*.13)) * 11.,2.));
 vec3 blue=vec3(.12,.36,.65),violet=vec3(.37,.19,.64),pink=vec3(.65,.31,.49);
 vec3 film=mix(blue,violet,.5+.5*sin(a*3.+vUv.y*5.+facing*6.));film=mix(film,pink,pow(fresnel,1.5)*.35);
 if(uKind>.5&&uKind<1.5)film=mix(vec3(.67,.22,.12),vec3(.91,.56,.33),fresnel);
 float light=.52+fresnel*.75+large*.12+fine*.07+cell*.03;
 float alpha=(.17+fresnel*.50+large*.10+fine*.045+cell*.025+edge*.09)*uOpacity;
 vec3 result=film*light*uLight + vec3(.23,.45,.77)*edge*.13 + vec3(.48,.66,1.)*wave*uWake*.3;
 vec3 rimColor=(uKind>.5&&uKind<1.5)?vec3(1.55,.65,.28):vec3(.38,.78,1.65);
 result+=rimColor*pow(fresnel,5.)*(uKind>1.5?.22:.72);
 gl_FragColor=vec4(result,clamp(alpha,0.,.8));
}`,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
}
function luminous(uniforms,{color='#9bd1ed',power=.75,opacity=1}={}){
 return new THREE.ShaderMaterial({uniforms:{...uniforms,uColor:{value:new THREE.Color(color)},uPower:{value:power},uOpacity:{value:opacity}},vertexShader:vertex,fragmentShader:`
uniform float uTime,uWake,uLight,uPower,uOpacity;uniform vec3 uColor;varying vec3 vNormal,vWorld,vLocal;varying vec2 vUv;
void main(){
 vec3 N=normalize(vNormal);float E=abs(dot(N,normalize(cameraPosition-vWorld)));
 float front=max(0.,dot(N,normalize(vec3(-.7,1.,1.))));
 float pulse=pow(.5+.5*sin(vUv.y*15.-uTime*2.2+vLocal.y*1.3),12.);
 float ridge=pow(1.-E,2.);
 vec3 c=uColor*(.20+front*.34+ridge*.43+pulse*.16+uWake*.50)*(uPower+.10)*uLight;
 gl_FragColor=vec4(c,uOpacity);
}`,transparent:opacity<1,depthWrite:opacity===1,side:THREE.DoubleSide});
}

function bellPoint(a,t,inner=0){
 const th=t*1.78;
 const r=(1.93-inner)*Math.sin(th)*(1+.065*Math.cos(a*12.)*Math.pow(Math.sin(th),4));
 const y=1.03+1.39*Math.cos(th)+.066*Math.cos(a*24.)*Math.pow(Math.sin(th),7)-inner*.35;
 return V(r*Math.cos(a),y,r*Math.sin(a));
}

// Closed circular cross sections, outward winding, and capped tips.
// These are volumes all the way around, rather than two-sided strips.
function softTube(points,baseRadius,phase,segments=208,sides=28){
 const curve=new THREE.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(segments,false);
 const positions=[],uvs=[],along=[],phases=[],indices=[];
 for(let i=0;i<=segments;i++){
  const t=i/segments,center=curve.getPointAt(t);
  const radius=.0008+baseRadius*Math.pow(1-t,1.18)*(1+.075*Math.sin(t*Math.PI));
  for(let j=0;j<=sides;j++){
   const a=j/sides*TAU,r=radius*(1+.018*Math.cos(a*6+t*4));
   const point=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);
   positions.push(point.x,point.y,point.z);uvs.push(j/sides,t);along.push(t);phases.push(phase);
   if(i<segments&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
  }
 }
 for(const end of [0,1]){
  const point=curve.getPointAt(end),center=positions.length/3;
  positions.push(point.x,point.y,point.z);uvs.push(.5,end);along.push(end);phases.push(phase);
  const ring=end?segments*(sides+1):0;
  for(let j=0;j<sides;j++){if(end)indices.push(center,ring+j+1,ring+j);else indices.push(center,ring+j,ring+j+1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('aAlong',new THREE.Float32BufferAttribute(along,1));g.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));g.setIndex(indices);g.computeVertexNormals();
 g.userData.profile={segments,sides,ringVertices:(segments+1)*(sides+1)};return g;
}
function mergeSoftTubes(items){
 const count=items.reduce((n,g)=>n+g.attributes.position.count,0),along=new Float32Array(count),phase=new Float32Array(count),profiles=[];
 let offset=0;
 for(const g of items){along.set(g.attributes.aAlong.array,offset);phase.set(g.attributes.aPhase.array,offset);profiles.push({offset,...g.userData.profile});offset+=g.attributes.position.count;}
 const result=merge(items);result.setAttribute('aAlong',new THREE.BufferAttribute(along,1));result.setAttribute('aPhase',new THREE.BufferAttribute(phase,1));result.userData.roundProfiles=profiles;return result;
}
function createSoftArms(uniforms){
 const group=new THREE.Group();group.name='V2 立体软触腕';const rand=rng(47319),primary=[],secondary=[];
 const material=new THREE.ShaderMaterial({uniforms:{...uniforms,uGel:{value:new THREE.Color('#8199d3')}},vertexShader:`
 uniform float uTime;attribute float aAlong,aPhase;
 varying vec3 vN,vW;varying vec2 vTex;varying float vPhase;
 ${deform}
 void main(){
  float weight=pow(aAlong,1.65);
  vec3 p=position;
  p.x+=weight*(.13*sin(uTime*.72-aAlong*5.2+aPhase)+.035*sin(uTime*1.12+aAlong*9.+aPhase*1.3));
  p.z+=weight*(.11*cos(uTime*.61-aAlong*5.8+aPhase)+.025*sin(uTime*.94+aAlong*7.+aPhase));
  p.y+=weight*.055*sin(uTime*.67-aAlong*4.+aPhase);
  p+=normal*.005*sin(uTime*.9-aAlong*11.+aPhase)*sin(aAlong*3.14159265);
  p=drift(p);vec4 world=modelMatrix*vec4(p,1.);
  vN=normalize(mat3(modelMatrix)*normal);vW=world.xyz;vTex=uv;vPhase=aPhase;
  gl_Position=projectionMatrix*viewMatrix*world;
 }`,fragmentShader:`
 uniform float uTime,uWake,uLight;uniform vec3 uGel;
 varying vec3 vN,vW;varying vec2 vTex;varying float vPhase;
 void main(){
  vec3 N=normalize(vN),E=normalize(cameraPosition-vW),L=normalize(vec3(-.55,.65,1.));
  float facing=max(dot(N,E),0.);
  float diffuse=.38*max(dot(N,L),0.)+.62*pow(facing,.75);
  float rim=pow(1.-max(dot(N,E),0.),3.2);
  float highlight=pow(max(dot(N,normalize(L+E)),0.),46.)+pow(facing,18.)*.34;
  float velvet=pow(max(dot(N,normalize(L+E)),0.),9.);
  float vein=pow(.5+.5*cos(vTex.x*18.84956+vTex.y*2.5),24.);
  float pulse=pow(.5+.5*sin(vTex.y*12.-uTime*1.25+vPhase),5.);
  vec3 gel=mix(uGel,vec3(.24,.16,.39),vTex.y*.38);
  vec3 c=gel*(.19+diffuse*.67)+vec3(.13,.12,.28)*(.32+rim*.46);
  c+=vec3(.38,.51,.78)*highlight*.52+vec3(.09,.13,.23)*velvet;
  c+=vec3(.21,.25,.52)*vein*(.12+pulse*.25+uWake*.7);
  c+=vec3(.23,.35,.67)*rim*.32;
  float alpha=clamp(.40+.20*facing+.20*rim+highlight*.035,.35,.78);
  gl_FragColor=vec4(c*uLight,alpha);
 }`,transparent:true,depthWrite:false,side:THREE.FrontSide});
 for(let i=0;i<10;i++){
  const a=i/10*TAU,phase=i*2.399+.3,points=[],length=2.65+rand()*.72;
  for(let j=0;j<=52;j++){
   const t=j/52,tip=Math.max(0,(t-.66)/.34),curl=tip*tip;
   const angle=a+.24*Math.sin(t*5.+phase)*t+(i%2?1:-1)*curl*.85;
   const radial=.38+(.56+.055*Math.sin(i*1.7))*Math.sin(t*1.9)+t*.20;
   points.push(V(Math.cos(angle)*radial+.16*Math.sin(t*6.2+phase)*t,.25-t*length+.17*curl*Math.sin(tip*Math.PI),Math.sin(angle)*radial+.13*Math.cos(t*6.+phase)*t));
  }
  primary.push(softTube(points,.115+.035*Math.sin(i*2.17+.8),phase,224,32));
 }
 for(let i=0;i<16;i++){
  const a=i/16*TAU+.13,phase=i*1.731+1,points=[],length=2.15+rand()*.95;
  for(let j=0;j<=42;j++){
   const t=j/42,angle=a+.22*Math.sin(t*4.7+phase)*t,radial=.53+t*.61+.13*Math.sin(t*6+phase)*t;
   points.push(V(Math.cos(angle)*radial+.10*Math.sin(t*8.+phase)*t,.30-t*length,Math.sin(angle)*radial+.12*Math.cos(t*7+phase)*t));
  }
  secondary.push(softTube(points,.023+rand()*.015,phase,176,14));
 }
 const arms=new THREE.Mesh(mergeSoftTubes(primary),material);arms.name='10 条圆截面主触腕';group.add(arms);
 const tendrils=new THREE.Mesh(mergeSoftTubes(secondary),material);tendrils.name='16 条凝胶细触须';group.add(tendrils);
 return group;
}

export function createOrganism(){
 const rand=rng(),root=new THREE.Group(),bell=new THREE.Group(),skeleton=new THREE.Group(),seed=new THREE.Group(),trails=new THREE.Group();
 root.name='Lumen corallum';bell.name='双层瓣膜与放射脉';skeleton.name='渐细珊瑚分枝';seed.name='螺旋种核';trails.name='触须与褶带';root.add(bell,skeleton,seed,trails);
 const uniforms={uTime:{value:0},uWake:{value:0},uLight:{value:1},uBreath:{value:.5}};
 const outer=membrane(uniforms,{opacity:.72}),inner=membrane(uniforms,{opacity:.30});
 bell.add(new THREE.Mesh(surface((u,v)=>bellPoint(u*TAU,v),384,104),outer));
 bell.add(new THREE.Mesh(surface((u,v)=>bellPoint(u*TAU,v,.065),288,80),inner));

 // Separate contour, twenty-four large radial vessels, and forked capillaries.
 const veins=[],capillaries=[];
 for(let i=0;i<24;i++){
  const a=i/24*TAU,pts=[];for(let k=0;k<=48;k++)pts.push(bellPoint(a,k/48*.99+.005,-.005));
  veins.push(tube(pts,t=>.0035+.0035*Math.sin(t*Math.PI),60,6));
  for(let b=0;b<3;b++)for(const side of [-1,1]){
   const pp=[];for(let k=0;k<=18;k++){const t=k/18,v=.30+b*.21+t*.20;pp.push(bellPoint(a+side*.085*Math.sin(t*Math.PI*.65),v,-.008));}
   capillaries.push(tube(pp,t=>.0032*(1-t*.7),22,4));
  }
 }
 const ring=[];for(let k=0;k<=384;k++)ring.push(bellPoint(k/384*TAU,1,-.009));
 bell.add(new THREE.Mesh(tube(ring,()=>.007,384,7),luminous(uniforms,{color:'#9bcafa',power:2.1})));
 bell.add(new THREE.Mesh(merge(veins),luminous(uniforms,{color:'#a3cdf6',power:.58})));
 bell.add(new THREE.Mesh(merge(capillaries),luminous(uniforms,{color:'#b7b6ed',power:.34,opacity:.58})));

 const frills=[];
 for(let i=0;i<12;i++){
  const center=i/12*TAU;
  const g=surface((u,v)=>{
   const a=center+(u-.5)*TAU/12*1.08;
   const r=1.9-.23*v+.06*Math.sin(u*Math.PI*10)*Math.sin(v*Math.PI);
   const y=.75-v*(.26+.11*Math.sin(u*Math.PI))+.045*Math.cos(a*24)+.03*Math.sin(u*40)*v;
   return V(Math.cos(a)*r,y,Math.sin(a)*r);
  },48,18);frills.push(g);
 }
 bell.add(new THREE.Mesh(merge(frills),membrane(uniforms,{opacity:.72})));

 const branchGeo=[],tips=[],polypPoints=[];
 function branch(start,angle,length,width,depth,up=.55){
  const end=start.clone().add(V(Math.cos(angle)*length,up*length,Math.sin(angle)*length));
  const points=[start,start.clone().lerp(end,.28).add(V(0,-.12*length,0)),start.clone().lerp(end,.68).add(V(0,.05*length,0)),end];
  branchGeo.push(tube(points,t=>Math.max(.002,width*Math.pow(1-t,.85)),22+depth*3,8));
  if(depth>0){
   const curve=new THREE.CatmullRomCurve3(points);
   for(let j=0;j<3;j++){
    const t=.40+j*.17,p=curve.getPoint(t),s=j%2?1:-1;
    branch(p,angle+s*(.4+rand()*.5),length*(.35+rand()*.14),width*.46,depth-1,.25+rand()*.85);
   }
  }else{
   tips.push({p:end,r:.016+rand()*.016});
   for(let k=0;k<5;k++){
    const a=k/5*TAU+rand()*.5;
    const p=end.clone().add(V(Math.cos(a)*.022,.02+rand()*.032,Math.sin(a)*.022));polypPoints.push(p);
   }
  }
 }
 for(let i=0;i<10;i++){
  const a=i/10*TAU+.05*Math.sin(i*3);const p=V(.17*Math.cos(a),.21+rand()*.11,.17*Math.sin(a));
  branch(p,a,1.32+rand()*.25,.060,3,.08+rand()*.18);
 }
 const coralMat=new THREE.MeshPhysicalMaterial({color:'#6b86aa',roughness:.32,metalness:.08,clearcoat:1,clearcoatRoughness:.23,iridescence:.18,iridescenceIOR:1.3,iridescenceThicknessRange:[290,360],emissive:'#314365',emissiveIntensity:.18,vertexColors:true});
 coralMat.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='uniform float uTime;\n'+deform+'\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','vec3 transformed=drift(position);');
  shader.fragmentShader='uniform float uTime,uWake,uLight;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance *= (1.+uWake*2.)*uLight;');
 };
 skeleton.add(new THREE.Mesh(merge(branchGeo),coralMat));

 function beads(points,color,power,baseRadius){
  const geo=new THREE.SphereGeometry(1,10,8),mat=luminous(uniforms,{color,power}),items=[];
  // Merge into one indexed mesh so the same deformation applies to beads and branches.
  for(const item of points){const p=item.p||item,r=item.r||baseRadius,g=geo.clone();g.scale(r,r*1.3,r);g.translate(p.x,p.y,p.z);items.push(g);}
  geo.dispose();return new THREE.Mesh(merge(items),mat);
 }
 skeleton.add(beads(tips,'#cbb8eb',.95,.02));
 skeleton.add(beads(polypPoints,'#e5cddf',.28,.006));

 // A luminous seed enclosed in eight overlapping, twisted, leaf-like valves.
 const kernelGeometry=surface((u,v)=>{
   const a=u*TAU,th=v*Math.PI,r=.245*Math.sin(th)*(1+.13*Math.cos(a*7+v*4)+.028*Math.cos(a*35+v*14))*(1+.025*Math.sin(v*70));
   return V(Math.cos(a)*r,.79+Math.cos(th)*.48,Math.sin(a)*r);
 },192,144);
 const kernelMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:`
 uniform float uTime,uWake,uLight;varying vec3 vNormal,vWorld,vLocal;varying vec2 vUv;
 void main(){
  float a=vUv.x*6.2831853;float h=vUv.y;
  float f=pow(1.-abs(dot(normalize(vNormal),normalize(cameraPosition-vWorld))),2.);
  float seam=pow(.5+.5*cos(a*7.+h*4.),30.);
  float stria=pow(.5+.5*cos(a*35.+h*26.+sin(h*34.)*.4),20.);
  float flow=pow(.5+.5*sin(h*17.-uTime*.95),5.);
  vec3 c=vec3(.43,.105,.028)*(1.+f*.8)+vec3(1.55,.58,.18)*seam*(.6+flow*.6)+vec3(.3,.14,.065)*stria;
  c+=vec3(1.6,.62,.22)*uWake*.55;
  gl_FragColor=vec4(c*uLight,1.);
 }`});
 const seedCore=new THREE.Mesh(kernelGeometry,kernelMaterial);seed.add(seedCore);
 const petalGeos=[],seams=[];
 for(let i=0;i<8;i++){
  const theta=i/8*TAU;
  const fn=(u,v)=>{
   const th=v*Math.PI,r=.43*Math.sin(th)*(1+.05*Math.cos(v*32));
   const a=theta+(u-.5)*(.85*Math.sin(th)+.08)+v*.95;
   const p=V(Math.cos(a)*r,.80+Math.cos(th)*.70,Math.sin(a)*r);
   p.x+=.018*Math.sin(v*30)*Math.sin(u*Math.PI);return p;
  };
  petalGeos.push(surface(fn,24,72));
  for(const u of [.04,.5,.96]){const pts=[];for(let k=0;k<=80;k++)pts.push(fn(u,k/80));seams.push(tube(pts,t=>.004+.003*Math.sin(t*Math.PI),80,5));}
 }
 const seedMat=membrane(uniforms,{opacity:.75,kind:1});
 seed.add(new THREE.Mesh(merge(petalGeos),seedMat));
 seed.add(new THREE.Mesh(merge(seams),luminous(uniforms,{color:'#ffc8a7',power:1.4})));
 const orbit=[];
 for(let i=0;i<3;i++){
  const points=[];for(let k=0;k<=192;k++){
   const a=k/192*TAU;points.push(V(.53*Math.cos(a),.78+.13*Math.sin(a*2+i),.53*Math.sin(a)));
  }
  orbit.push(tube(points,()=>.0027,192,4));
 }
 seed.add(new THREE.Mesh(merge(orbit),luminous(uniforms,{color:'#f6c9d6',power:.8,opacity:.65})));

 // V2 replaces every lower ribbon with a closed, round soft arm.
 const softArms=createSoftArms(uniforms);
 trails.add(softArms);
 trails.name='圆润软触腕与细触须';

 const tentacles=[],shortFilaments=[],glints=[];
 for(let i=0;i<64;i++){
  const a=i/64*TAU,rad=1.86+.045*Math.cos(a*12),length=1.9+rand()*2.1;
  const pts=[];
  for(let k=0;k<=100;k++){
   const t=k/100,dr=.18*Math.sin(t*5+i)+.30*t;
   const ang=a+.17*Math.sin(t*7+i)*t;
   pts.push(V(Math.cos(ang)*(rad+dr)+.19*Math.sin(t*10+i)*t,.72-t*length,Math.sin(ang)*(rad+dr)+.14*Math.cos(t*9+i)*t));
  }
  tentacles.push(tube(pts,t=>(i%4===0?.009:.004)*(1-t*.95),100,i%4===0?6:4));
  if(i%2===0)for(let j=0;j<9;j++){const k=12+j*9,p=pts[k];glints.push({p,r:.007+rand()*.006});}
 }
 for(let i=0;i<96;i++){
  const a=i/96*TAU,p=bellPoint(a,1),pts=[p];
  for(let k=1;k<=12;k++){const t=k/12;pts.push(p.clone().add(V(Math.cos(a)*.1*t+.05*Math.sin(t*7+i)*t,-t*(.20+rand()*.06),Math.sin(a)*.1*t)));}
  shortFilaments.push(tube(pts,t=>.0035*(1-t*.9),14,4));
 }
 trails.add(new THREE.Mesh(merge(tentacles),luminous(uniforms,{color:'#9eaccf',power:.25,opacity:.78})));
 bell.add(new THREE.Mesh(merge(shortFilaments),luminous(uniforms,{color:'#d1cced',power:.32,opacity:.72})));
 trails.add(beads(glints,'#b7c3e9',.65,.009));

 // Tiny living nodules sit on the membrane rather than drifting as screen noise.
 const nodules=[];
 for(let i=0;i<100;i++){
  const a=rand()*TAU,t=.18+rand()*.79,p=bellPoint(a,t,-.012);nodules.push({p,r:.002+rand()*.006});
 }
 bell.add(beads(nodules,'#c6cbe9',.28,.005));
 root.rotation.set(.02,.16,-.065);
 return {root,bell,skeleton,seed,trails,uniforms,materials:{outer,inner},setTime(t,wake,breath){uniforms.uTime.value=t;uniforms.uWake.value=wake;uniforms.uBreath.value=breath?.pulse??.5;uniforms.uLight.value=breath?.light??1;root.scale.set(breath?.scaleXZ??1,breath?.scaleY??1,breath?.scaleXZ??1);root.position.y=.045*Math.sin(t*.55);root.rotation.z=-.065+.022*Math.sin(t*.31);seed.rotation.y=.12*Math.sin(t*.22);}};
}
