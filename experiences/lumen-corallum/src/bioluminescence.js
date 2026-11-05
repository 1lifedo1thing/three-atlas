import * as THREE from 'three';

export const BREATH_PERIOD=8;
export function sampleBreath(time){
 const pulse=.5-.5*Math.cos(time*Math.PI*2/BREATH_PERIOD);
 return {pulse,scaleXZ:.965+.065*pulse,scaleY:.985+.03*pulse,light:.73+.62*pulse,haloDiameter:5.2+1.5*pulse,particleSpread:1+.09*pulse};
}
function random(seed=62023){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};}

function particleGeometry(interior){
 const rand=random(interior?9912:17343),positions=[],colors=[],sizes=[],seeds=[];
 const palette=['#ffd6a5','#b2cfff','#d6b9fa'].map(x=>new THREE.Color(x));
 const count=interior?88:84;
 for(let i=0;i<count;i++){
  let x,y,z;
  if(interior){
   if(i<72){
    do{x=rand()*2-1;y=rand()*2-1;z=rand()*2-1;}while(x*x+y*y+z*z>.83);
    x*=1.40;y=1.40+y*.58;z*=1.40;
   }else{
    const angle=rand()*Math.PI*2,r=.47+rand()*.13;
    x=Math.cos(angle)*r;y=.43+rand()*1.10;z=Math.sin(angle)*r;
   }
  }else{
   const angle=rand()*Math.PI*2,r=2.65+rand()*2.80;
   x=Math.cos(angle)*r;y=-3.3+rand()*7.3;z=Math.sin(angle)*r*.74;
  }
  positions.push(x,y,z);
  const color=palette[(i+(interior?1:0))%palette.length];colors.push(color.r,color.g,color.b);
  sizes.push(interior?.035+rand()*.035:i<36?.105+rand()*.085:.035+rand()*.035);
  seeds.push(rand()*Math.PI*2);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('aColor',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));g.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));g.computeBoundingSphere();return g;
}

function particleMaterial(shared,interior){
 return new THREE.ShaderMaterial({uniforms:{...shared,uInside:{value:interior?1:0}},vertexShader:`
 uniform float uTime,uPulse,uSpread,uPointScale,uInside;
 attribute vec3 aColor;attribute float aSize,aSeed;
 varying vec3 vColor;varying float vBlink;
 void main(){
  vec3 p=position;
  if(uInside>.5){
   float a=uTime*.045;mat2 rotate=mat2(cos(a),-sin(a),sin(a),cos(a));p.xz=rotate*p.xz;
   p.x+=.050*sin(uTime*.29+aSeed);p.z+=.045*cos(uTime*.25+aSeed*1.6);
   p.y+=.038*sin(uTime*.35+aSeed*2.);
   p.xz*=1.+uPulse*.018;
  }else{
   p.x+=.26*sin(uTime*.21+aSeed)+.08*sin(uTime*.58+aSeed*2.);
   p.y+=.30*sin(uTime*.17+aSeed*1.6)+.09*sin(uTime*.49+aSeed);
   p.z+=.23*cos(uTime*.19+aSeed)+.07*sin(uTime*.43+aSeed*3.);
   p.xz*=uSpread;p.y=(p.y+.3)*(1.+uPulse*.025)-.3;
  }
  vec4 mv=modelViewMatrix*vec4(p,1.);
  float twinkle=.5+.5*sin(uTime*(uInside>.5?.66:.93)+aSeed*2.);
  vBlink=.48+.52*pow(twinkle,1.4);vColor=aColor;
  gl_PointSize=clamp(aSize*uPointScale/max(.2,-mv.z),1.2,uInside>.5?16.:28.);
  gl_Position=projectionMatrix*mv;
 }`,fragmentShader:`
 uniform float uPulse,uWake,uInside;varying vec3 vColor;varying float vBlink;
 void main(){
  vec2 q=gl_PointCoord-.5;float r=length(q)*2.;if(r>1.)discard;
  float core=exp(-r*r*48.),halo=exp(-r*r*5.0);
  float gain=(.70+uPulse*.75+uWake*.45)*vBlink;
  vec3 c=vColor*(core*3.8+halo*.50)*gain;
  float alpha=(core*.94+halo*.28)*(uInside>.5?.84:.92);
  gl_FragColor=vec4(c,alpha);
 }`,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
}

function auraMaterial(shared,warm=false){
 return new THREE.ShaderMaterial({uniforms:{...shared,uWarm:{value:warm?1:0}},vertexShader:`
 uniform float uDiameter;varying vec2 vUv;
 void main(){
  vUv=uv;vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.);center.xy+=position.xy*uDiameter;
  gl_Position=projectionMatrix*center;
 }`,fragmentShader:`
 uniform float uPulse,uWake,uWarm;varying vec2 vUv;
 void main(){
  float r=length(vUv-.5)*2.;if(r>1.)discard;
  float fog=exp(-r*r*5.8)*(1.-smoothstep(.70,1.,r));
  float wave=exp(-pow((r-(.23+uPulse*.52))/.13,2.))*(1.-smoothstep(.75,1.,r));
  vec3 color=mix(vec3(.18,.30,.65),vec3(.95,.46,.19),uWarm);
  float alpha=fog*(.09+uPulse*.09+uWake*.04)+wave*.016*(1.-uWarm);
  gl_FragColor=vec4(color,alpha);
 }`,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
}

export function createBioluminescence(){
 const shared={uTime:{value:0},uPulse:{value:0},uWake:{value:0},uSpread:{value:1},uPointScale:{value:1000},uDiameter:{value:5.2}};
 const outer=new THREE.Points(particleGeometry(false),particleMaterial(shared,false));outer.name='外围萤火与漂游微光';outer.renderOrder=2;outer.frustumCulled=false;
 const inner=new THREE.Points(particleGeometry(true),particleMaterial(shared,true));inner.name='体内悬浮光粒';inner.renderOrder=1;inner.frustumCulled=false;
 const halo=new THREE.Group();halo.name='随呼吸扩散的光晕';
 const broad=new THREE.Mesh(new THREE.PlaneGeometry(1,1),auraMaterial(shared));broad.position.y=.65;broad.renderOrder=-8;broad.frustumCulled=false;halo.add(broad);
 const coreUniforms={...shared,uDiameter:{value:1.7}};
 const core=new THREE.Mesh(new THREE.PlaneGeometry(1,1),auraMaterial(coreUniforms,true));core.position.y=.82;core.renderOrder=3;core.frustumCulled=false;halo.add(core);
 return {outer,inner,halo,uniforms:shared,
  resize(height,pixelRatio,fov){shared.uPointScale.value=height*pixelRatio/(2*Math.tan(fov*Math.PI/360));},
  setView(name){outer.visible=name==='whole';inner.visible=name==='whole';halo.visible=name==='whole';},
  update(time,breath,wake=0){shared.uTime.value=time;shared.uPulse.value=breath.pulse;shared.uWake.value=wake;shared.uSpread.value=breath.particleSpread;shared.uDiameter.value=breath.haloDiameter;coreUniforms.uDiameter.value=1.7+breath.pulse*.65;}
 };
}
