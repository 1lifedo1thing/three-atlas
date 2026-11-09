import '../../../src/shared/experience-nav.css';
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Soundscape } from './audio.js';
import * as shaders from './shaders.js';
import { t, getLanguage, setLanguage, applyTranslations } from './i18n.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#universe');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {time:0,direction:1,speed:1,paused:reducedMotion,pulse:0,charge:0,chapter:0,collected:new Set(),started:false,uiHidden:false,quality:1,frameMs:16};
const center = new THREE.Vector3(3,3.7,0);
const TAU = Math.PI*2;
let renderer, scene, camera, controls, composer, bloom, finalPass, water, sky;
let lastTime=0, frame=0, idleAt=0, cameraTween=null, lastUI=0, mobileLayout=innerWidth<641, keyboardHoldStart=null;
const animated = [], uniforms = [], relics = [], raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(9,9), screen = new THREE.Vector3();
const sound = new Soundscape();
let memoryView=null, toastKey=null, fatalKey='fatalDefault';
const pointerState={down:false,moved:false,start:0,x:0,y:0,clientX:0,clientY:0};
const initialCamera=new THREE.Vector3(1.1,5.3,25.5), initialTarget=new THREE.Vector3(1.1,2.1,0);
let seed=1627;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const rand=(min,max)=>min+(max-min)*random();
const color=(v)=>new THREE.Color(v);
const memories=[
  {color:0xffc981}, {color:0xbac5ff}, {color:0xffe6be}
];
const chapters=[
 {position:[1.1,5.3,25.5],target:[1.1,2.1,0]},
 {position:[15.8,8.2,17.8],target:[3,3.3,0]},
 {position:[-10,2.1,17],target:[3,3.7,0]}
];

function fail(error){
 console.error(error);document.body.classList.add('has-error');$('#loading')?.classList.add('done');$('#fatal').hidden=false;
 fatalKey=error?.message?.includes('WebGL')?'fatalWebgl':'fatalLoad';
 $('#fatal-message').textContent=t(fatalKey);
}
window.addEventListener('error',(event)=>{if(!state.started)fail(event.error);});
window.addEventListener('unhandledrejection',(event)=>{if(!state.started)fail(event.reason);});

function init(){
 $('#loading-progress').style.width='15%';
 renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.5:1.75));
 renderer.setSize(innerWidth,innerHeight);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.13;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.info.autoReset=false;
 scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0a0e1b,.009);
 camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,650);
 camera.position.copy(initialCamera);
 controls=new OrbitControls(camera,canvas);controls.target.copy(initialTarget);
 controls.enableDamping=!reducedMotion;controls.dampingFactor=.045;controls.enablePan=false;
 controls.minDistance=8.5;controls.maxDistance=48;controls.minPolarAngle=.23;controls.maxPolarAngle=Math.PI*.51;
 controls.rotateSpeed=.45;controls.zoomSpeed=.65;
 controls.addEventListener('start',()=>{cameraTween=null;idleAt=performance.now();});
 controls.addEventListener('end',()=>{idleAt=performance.now();});
 controls.addEventListener('change',()=>{if(camera.position.y<-2.7)camera.position.y=-2.7;});
 controls.update();
 if(innerWidth<641){camera.position.set(3,8.4,44);controls.target.set(3,4.8,0);controls.update();}
 const pmrem=new THREE.PMREMGenerator(renderer);
 const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.03);
 scene.environment=environment.texture;scene.environmentIntensity=.48;
 room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0x899fcf,0x15101a,1.2));
 const warm=new THREE.DirectionalLight(0xffd2a1,4.2);warm.position.set(-4,10,7);scene.add(warm);
 const rim=new THREE.DirectionalLight(0x859ccf,3.4);rim.position.set(7,4,-8);scene.add(rim);
 const light=new THREE.PointLight(0xffa64a,130,30,2);light.position.copy(center).add(new THREE.Vector3(0,-1,2));scene.add(light);
 makeSky();makeSingularity();makeAstrolabe();makeDisks();makeLandscape();makeRelics();makeRays();
 $('#loading-progress').style.width='75%';
 const renderTarget=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:2});
 composer=new EffectComposer(renderer,renderTarget);composer.addPass(new RenderPass(scene,camera));
 bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.58,.62,.82);composer.addPass(bloom);
 finalPass=new ShaderPass(shaders.finalShader);finalPass.uniforms.uCenter.value=new THREE.Vector2(.6,.5);finalPass.uniforms.uResolution.value=new THREE.Vector2(innerWidth,innerHeight);finalPass.uniforms.uAspect.value=innerWidth/innerHeight;
 composer.addPass(finalPass);composer.addPass(new OutputPass());
 bindUI();resize();
 $('#loading-progress').style.width='100%';
 state.started=true;
 document.body.classList.add('ready');
 renderer.compile(scene,camera);
 requestAnimationFrame(animate);
 setTimeout(()=>{$('#loading').classList.add('done');canvas.focus({preventScroll:true});},650);
 setTimeout(()=>$('#loading').remove(),2100);
 updateTimeUI();
}

function makeSky(){
 const material=new THREE.ShaderMaterial({vertexShader:shaders.skyVertex,fragmentShader:shaders.skyFragment,side:THREE.BackSide,depthWrite:false,uniforms:{uTime:{value:0}}});
 sky=new THREE.Mesh(new THREE.SphereGeometry(280,40,24),material);sky.renderOrder=-10;scene.add(sky);uniforms.push(material.uniforms);
 const count=3500,positions=new Float32Array(count*3),colors=new Float32Array(count*3),data=new Float32Array(count*4);
 for(let i=0;i<count;i++){
   const v=new THREE.Vector3(rand(-1,1),rand(-.23,1),rand(-1,1)).normalize().multiplyScalar(rand(95,245));
   positions.set(v.toArray(),i*3);
   const c=color(i%9===0?0xa5b9ed:i%7===0?0xe9bd83:0xd4d5df).multiplyScalar(rand(.32,1.2));colors.set(c.toArray(),i*3);
   data.set([rand(0,TAU),rand(0,100),0,0],i*4);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('aData',new THREE.BufferAttribute(data,4));geo.setAttribute('aColor',new THREE.BufferAttribute(colors,3));
 const mat=particleMaterial(1);mat.depthTest=true;
 const stars=new THREE.Points(geo,mat);stars.frustumCulled=false;scene.add(stars);
}

function makeSingularity(){
 const black=new THREE.Mesh(new THREE.SphereGeometry(3.34,96,64),new THREE.MeshBasicMaterial({color:0x010104,fog:false}));
 black.position.copy(center);scene.add(black);
 const mat=new THREE.ShaderMaterial({vertexShader:shaders.coronaVertex,fragmentShader:shaders.coronaFragment,uniforms:{uTime:{value:0},uPulse:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 const corona=new THREE.Mesh(new THREE.SphereGeometry(3.44,112,72),mat);corona.position.copy(center);scene.add(corona);uniforms.push(mat.uniforms);
 // An outer, dimmer corona gives the photon ring a soft physical falloff.
 const outerMat=mat.clone();outerMat.uniforms.uTime=mat.uniforms.uTime;outerMat.uniforms.uPulse=mat.uniforms.uPulse;
 const outer=new THREE.Mesh(new THREE.SphereGeometry(3.52,80,48),outerMat);outer.position.copy(center);scene.add(outer);
}

function arcGeometry(inner,outer,start,length,depth){
 const shape=new THREE.Shape();
 shape.absarc(0,0,outer,start,start+length,false);
 shape.lineTo(Math.cos(start+length)*inner,Math.sin(start+length)*inner);
 shape.absarc(0,0,inner,start+length,start,true);shape.closePath();
 return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,curveSegments:10,steps:1});
}

function makeAstrolabe(){
 const assembly=new THREE.Group();assembly.position.copy(center);assembly.rotation.set(.1,-.22,-.23);scene.add(assembly);
 const bronze=new THREE.MeshStandardMaterial({color:0x9b7040,metalness:.91,roughness:.3});
 const pale=new THREE.MeshStandardMaterial({color:0xddbf88,metalness:.84,roughness:.24});
 const dark=new THREE.MeshStandardMaterial({color:0x37303a,metalness:.84,roughness:.35});
 const luminous=new THREE.MeshBasicMaterial({color:0xffd397,toneMapped:false});
 const fragments=[];
 for(let i=0;i<36;i++){
   if(i===6||i===7||i===21||i===30)continue;
   const a=i/36*TAU,len=TAU/36*rand(.77,.94),r=4.74;
   const mesh=new THREE.Mesh(arcGeometry(r,r+rand(.22,.36),a,len,rand(.1,.24)),i%4===0?pale:bronze);
   const offset=i%5===0?rand(.18,.65):rand(0,.1);
   const base=new THREE.Vector3(Math.cos(a)*offset,Math.sin(a)*offset,rand(-.1,.15));
   mesh.position.copy(base);assembly.add(mesh);fragments.push({mesh,base,a,amp:rand(.01,.055)});
   const lip=new THREE.Mesh(new THREE.TorusGeometry(r+.02,.009,4,12,len),luminous);lip.rotation.z=a;lip.position.z=.14;mesh.add(lip);
 }
 for(let layer=0;layer<3;layer++){
   const radius=[5.27,5.92,6.17][layer];
   for(let i=0;i<8;i++){
     if(random()<.16)continue;
     const a=i/8*TAU+layer*.3,len=rand(.28,.67);
     const mesh=new THREE.Mesh(arcGeometry(radius,radius+(layer===1?.09:.032),a,len,.04),layer===1?dark:pale);mesh.position.z=-.1-layer*.12;assembly.add(mesh);
     if(layer===2){const line=new THREE.Mesh(new THREE.TorusGeometry(radius,.006,3,28,len*.7),luminous);line.rotation.z=a;line.position.z=.02;mesh.add(line);}
   }
 }
 const count=180;const ticks=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),pale,count);
 let tick=0;const temp=new THREE.Object3D();
 for(let i=0;i<count;i++){
   const a=i/count*TAU;
   if((a>1.02&&a<1.37)||(a>3.57&&a<3.93)||(a>5.15&&a<5.43))continue;
   const major=i%5===0;const r=4.43;
   temp.position.set(Math.cos(a)*r,Math.sin(a)*r,.07);temp.rotation.set(0,0,a-Math.PI/2);temp.scale.set(major?.031:.014,major?.23:.09,.037);temp.updateMatrix();ticks.setMatrixAt(tick++,temp.matrix);
 }
 ticks.count=tick;assembly.add(ticks);
 // Cut radial ribs and floating pieces make the clock read as a ruin, not a flat dial.
 for(let i=0;i<48;i++){
   const a=rand(0,TAU),r=rand(5.3,8.6),geo=i%4===0?new THREE.OctahedronGeometry(rand(.08,.19),0):new THREE.BoxGeometry(rand(.04,.17),rand(.13,.54),rand(.05,.18));
   const mesh=new THREE.Mesh(geo,i%3===0?pale:bronze);const base=new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,rand(-1.2,1.8));mesh.position.copy(base);mesh.rotation.set(rand(0,3),rand(0,3),a);assembly.add(mesh);
   fragments.push({mesh,base,a,amp:rand(.035,.13)});
 }
 const etchingColor=0xb9a27d;
 for(let i=0;i<12;i++){
   const a=i/12*TAU;if(i===2||i===7||i===10)continue;
   const label=makeText(['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'][i],etchingColor);
   label.position.set(Math.sin(a)*4.03,Math.cos(a)*4.03,.2);label.scale.set(.5,.25,1);assembly.add(label);
 }
 animated.push((t)=>{
   assembly.rotation.z=-.23+t*.006;
   assembly.rotation.y=-.22+Math.sin(t*.017)*.055;
   fragments.forEach(({mesh,base,a,amp})=>{mesh.position.copy(base);mesh.position.z+=Math.sin(t*.12+a*3.)*amp;mesh.position.x+=Math.cos(a)*Math.sin(t*.08+a)*amp;mesh.position.y+=Math.sin(a)*Math.sin(t*.08+a)*amp;});
 });
}

function makeText(text,tint){
 const c=document.createElement('canvas');c.width=256;c.height=128;
 const ctx=c.getContext('2d');ctx.font='46px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#'+new THREE.Color(tint).getHexString();ctx.fillText(text,128,67);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 return new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:.72}));
}

function particleMaterial(mode){
 const material=new THREE.ShaderMaterial({vertexShader:shaders.particleVertex,fragmentShader:shaders.particleFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPixelRatio:{value:renderer.getPixelRatio()},uPulse:{value:0},uMode:{value:mode}}});uniforms.push(material.uniforms);return material;
}

function makeDisks(){
 const diskGroup=new THREE.Group();diskGroup.position.copy(center);diskGroup.rotation.set(1.24,-.13,-.3);scene.add(diskGroup);
 const mat=new THREE.ShaderMaterial({vertexShader:shaders.diskVertex,fragmentShader:shaders.diskFragment,uniforms:{uTime:{value:0},uPulse:{value:0}},side:THREE.DoubleSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 const disk=new THREE.Mesh(new THREE.RingGeometry(3.44,9,192,1),mat);diskGroup.add(disk);uniforms.push(mat.uniforms);
 const count=innerWidth<700?19000:34000;const positions=new Float32Array(count*3),data=new Float32Array(count*4),colors=new Float32Array(count*3);
 for(let i=0;i<count;i++){
   const r=3.7+Math.pow(random(),1.55)*7.8,a=rand(0,TAU);
   data.set([a,r,rand(-.10,.10)*(r/5),rand(.045,.09)/Math.pow(r/4,1.7)],i*4);
   const c=color(i%11===0?0xffedd1:i%7===0?0xadc2e6:0xe6a35c).multiplyScalar(rand(.3,1.45)*(1-(r-3.7)/12));colors.set(c.toArray(),i*3);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('aData',new THREE.BufferAttribute(data,4));geometry.setAttribute('aColor',new THREE.BufferAttribute(colors,3));
 const dust=new THREE.Points(geometry,particleMaterial(0));dust.frustumCulled=false;diskGroup.add(dust);
 // Two long, thin orbits pass in front of and behind the monument.
 for(let j=0;j<3;j++){
   const path=[];const r=7.2+j*1.4;
   for(let i=0;i<=300;i++){const a=i/300*TAU;path.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0));}
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(path),new THREE.LineBasicMaterial({color:j===1?0x778bb9:0xab8b59,transparent:true,opacity:j===1?.18:.24}));
   line.position.copy(center);line.rotation.set(.6+j*.4,.3+j*.16,-.4+j*.3);scene.add(line);
   animated.push((t)=>{line.rotation.z=-.4+j*.3+t*(j%2?.005:-.003);});
 }
 const count2=1600,p2=new Float32Array(count2*3),c2=new Float32Array(count2*3),d2=new Float32Array(count2*4);
 for(let i=0;i<count2;i++){
   p2.set([rand(-40,40),rand(-2,28),rand(-35,26)],i*3);
   c2.set(color(i%3===0?0xb6c9ed:0xc4a16c).multiplyScalar(rand(.12,.6)).toArray(),i*3);d2.set([rand(0,TAU),rand(0,40),0,0],i*4);
 }
 const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.BufferAttribute(p2,3));g2.setAttribute('aData',new THREE.BufferAttribute(d2,4));g2.setAttribute('aColor',new THREE.BufferAttribute(c2,3));
 const motes=new THREE.Points(g2,particleMaterial(1));motes.frustumCulled=false;scene.add(motes);
 animated.push((t)=>{diskGroup.rotation.z=-.3+Math.sin(t*.008)*.06;});
}

function makeLandscape(){
 const reflectionShader={...shaders.waterShader,uniforms:THREE.UniformsUtils.clone(shaders.waterShader.uniforms)};
 reflectionShader.uniforms.color.value=color(0x101829);reflectionShader.uniforms.textureMatrix.value=new THREE.Matrix4();reflectionShader.uniforms.uOrigin.value=center.clone();
 water=new Reflector(new THREE.PlaneGeometry(350,350),{textureWidth:Math.min(1536,Math.floor(innerWidth*.75)),textureHeight:Math.min(1024,Math.floor(innerHeight*.75)),color:0x111620,clipBias:.003,shader:reflectionShader});
 water.rotation.x=-Math.PI/2;water.position.y=-3.65;scene.add(water);
 const stone=new THREE.MeshStandardMaterial({color:0x0c101a,metalness:.38,roughness:.56,envMapIntensity:.24});
 const edgeStone=new THREE.MeshStandardMaterial({color:0x24212a,metalness:.45,roughness:.46,envMapIntensity:.3});
 const cube=new THREE.BoxGeometry(1,1,1);const mesh=new THREE.InstancedMesh(cube,stone,242);const temp=new THREE.Object3D();
 for(let i=0;i<242;i++){
   let x,z,w,h,d;
   if(i<98){
     const a=rand(0,TAU),r=rand(12,33);x=center.x+Math.cos(a)*r;z=Math.sin(a)*r-13;w=rand(.25,1.4);d=rand(.4,2.);h=rand(.12,.65)*(random()<.09?3.4:1);
   }else{
     const row=Math.floor((i-98)/6),col=(i-98)%6;
     z=5+row*.76;x=3+(col-2.5)*.47+rand(-.09,.09);w=rand(.34,.43);d=rand(.53,.67);h=rand(.06,.19);
     if(random()<.14)h=.025;
   }
   temp.position.set(x,-3.66+h*.45,z);temp.scale.set(w,h,d);temp.rotation.set(rand(-.07,.07),rand(-.12,.12),rand(-.06,.06));temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);
 }
 scene.add(mesh);
 // A half-submerged, ruined observatory platform anchors the impossible object.
 for(let layer=0;layer<3;layer++){
   const geo=new THREE.CylinderGeometry(5.3+layer*.65,5.4+layer*.65,.14,96,1,true,0,TAU*.91);
   const ring=new THREE.Mesh(geo,layer===0?edgeStone:stone);ring.position.set(3,-3.4-layer*.09,-.3);ring.rotation.y=layer*.4;scene.add(ring);
 }
 const columns=[[-9,-3.65,1.5,3.1],[-11,-3.65,-8,5.8],[13,-3.65,-5,4.8],[15,-3.65,6,2.1],[-18,-3.65,-17,7.2],[21,-3.65,-20,8.6]];
 columns.forEach(([x,y,z,h],i)=>{
   const column=new THREE.Group();column.position.set(x,y,z);column.rotation.z=i%2?-.045:.025;
   const body=new THREE.Mesh(new THREE.BoxGeometry(.34,h,.5),stone);body.position.y=h/2;column.add(body);
   const inlay=new THREE.Mesh(new THREE.BoxGeometry(.016,h*.64,.008),new THREE.MeshBasicMaterial({color:i%2?0xa7b7d3:0xc8a56f,transparent:true,opacity:.38}));inlay.position.set(-.03,h*.56,.255);column.add(inlay);
   const crown=new THREE.Mesh(new THREE.BoxGeometry(.48,.08,.63),edgeStone);crown.position.y=h;column.add(crown);scene.add(column);
 });
 const horizon=new THREE.Group();
 const ridgeMat=new THREE.MeshBasicMaterial({color:0x0b101b,fog:true});
 for(let i=0;i<80;i++){
   const a=i/80*TAU;const r=rand(105,145),h=rand(.8,3.4);const shard=new THREE.Mesh(new THREE.ConeGeometry(rand(5,15),h,5),ridgeMat);shard.position.set(Math.cos(a)*r,-3.5+h/2,Math.sin(a)*r);shard.rotation.y=rand(0,TAU);horizon.add(shard);
 }scene.add(horizon);
}

function makeRelics(){
 const locations=[[-3.1,.8,4.4],[9.6,4.8,2.6],[4.4,10.8,-.2]];
 memories.forEach((memory,i)=>{
   const group=new THREE.Group();group.position.fromArray(locations[i]);const base=group.position.clone();
   const material=new THREE.MeshPhysicalMaterial({color:memory.color,emissive:memory.color,emissiveIntensity:1.1,metalness:.55,roughness:.17,transparent:true,opacity:.95});
   const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.17,0),material);crystal.scale.set(.8,1.8,.8);group.add(crystal);
   const orbit=new THREE.Mesh(new THREE.TorusGeometry(.34,.006,4,48),new THREE.MeshBasicMaterial({color:memory.color,transparent:true,opacity:.56}));orbit.rotation.x=.9;orbit.rotation.y=.3;group.add(orbit);
   const hit=new THREE.Mesh(new THREE.SphereGeometry(.65,12,8),new THREE.MeshBasicMaterial({visible:false}));hit.userData.memory=i;group.add(hit);
   scene.add(group);relics.push({group,hit,crystal,orbit,base,index:i});
   animated.push((t)=>{group.position.y=base.y+Math.sin(t*.22+i*2)*.17;crystal.rotation.y=t*.24;crystal.rotation.z=Math.sin(t*.12+i)*.15;orbit.rotation.z=t*.14+i;});
 });
}

function makeRays(){
 // Delicate world-space filaments: the remaining paths of distant light.
 const positions=[],colors=[];
 for(let i=0;i<90;i++){
   const a=rand(0,TAU),r=rand(8,14),x=center.x+Math.cos(a)*r,y=center.y+Math.sin(a)*r,z=rand(-7,-2);
   const len=rand(.2,1.6);positions.push(x,y,z,x+Math.cos(a)*len,y+Math.sin(a)*len,z-.3);
   const c=color(i%4?0x6a718b:0xc5a16a).multiplyScalar(rand(.13,.35));colors.push(...c.toArray(),...c.toArray());
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const rays=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.5}));scene.add(rays);
}

function toast(key){
 toastKey=key;
 const el=$('#toast');el.textContent=t(key);el.classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>el.classList.remove('visible'),3200);
}

function refreshLanguage(){
 applyTranslations();
 $('#chapter-kicker').textContent=t(`chapters.${state.chapter}.name`);
 $('#chapter-poem').innerHTML=t(`chapters.${state.chapter}.poem`);
 updateTimeUI();updateAudioUI();updateFullscreenUI();
 $('#fatal-message').textContent=t(fatalKey);
 if(memoryView!==null)renderMemory();
 if(toastKey&&$('#toast').classList.contains('visible'))$('#toast').textContent=t(toastKey);
}
function updateAudioUI(){
 $('#audio').setAttribute('aria-pressed',String(sound.enabled));
 $('#audio').setAttribute('aria-label',t(sound.enabled?'audioDisable':'audioEnable'));
 $('.audio-label').textContent=t(sound.enabled?'audioOn':'audioOff');
}
function updateFullscreenUI(){
 $('#fullscreen').setAttribute('aria-label',t(document.fullscreenElement?'fullscreenExit':'fullscreenEnter'));
}

function setChapter(index){
 state.chapter=index;
 document.querySelectorAll('.chapter').forEach((button,i)=>{button.classList.toggle('active',i===index);if(i===index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
 $('#chapter-kicker').textContent=t(`chapters.${index}.name`);$('#chapter-poem').innerHTML=t(`chapters.${index}.poem`);
 $('#observation-index').textContent=String(index+1).padStart(2,'0');$('#observation-dot').style.transform=`translateY(${index*30}px)`;
 const target=new THREE.Vector3().fromArray(chapters[index].target);
 const pos=new THREE.Vector3().fromArray(chapters[index].position);
 if(innerWidth<641){pos.sub(target).multiplyScalar(1.75);target.set(3,4.8,0);pos.add(target);if(index===0)pos.set(3,8.4,44);}
 tweenCamera(pos,target);
 $('#experience').classList.remove('immersed');
}

function tweenCamera(position,target,duration=2300){
 if(reducedMotion){
   cameraTween=null;controls.autoRotate=false;camera.position.copy(position);controls.target.copy(target);controls.update(0);idleAt=performance.now();return;
 }
 cameraTween={from:camera.position.clone(),to:position,fromTarget:controls.target.clone(),target,start:performance.now(),duration};idleAt=performance.now()+duration;
}

function stepCamera({azimuth=0,polar=0,zoom=1}){
 const orbit=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
 orbit.theta+=azimuth;orbit.phi=THREE.MathUtils.clamp(orbit.phi+polar,controls.minPolarAngle,controls.maxPolarAngle);
 orbit.radius=THREE.MathUtils.clamp(orbit.radius*zoom,controls.minDistance,controls.maxDistance);orbit.makeSafe();
 cameraTween=null;controls.autoRotate=false;idleAt=performance.now();
 camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));controls.update(0);
}

function collectNextMemory(){
 const next=relics.find(relic=>!state.collected.has(relic.index));
 if(next)collectMemory(next.index);else memoryArchive();
}

function updateTimeUI(){
 const direction=state.paused?0:state.direction;
 $('#time-label').textContent=t(direction===0?'frozen':direction<0?'reversing':'flowing');
 $('#pause').setAttribute('aria-pressed',String(state.paused));$('#pause').setAttribute('aria-label',t(state.paused?'resume':'pause'));
 $('#pause-icon').setAttribute('d',state.paused?'m9 6 9 6-9 6V6Z':'M9 6v12M15 6v12');
 $('#reverse').classList.toggle('active',direction<0);$('#reverse').setAttribute('aria-pressed',String(direction<0));
 $('#forward').classList.toggle('active',direction>0);$('#forward').setAttribute('aria-pressed',String(direction>0));
}

function togglePause(){state.paused=!state.paused;updateTimeUI();}
function toggleReverse(){state.direction=state.direction<0?1:-1;state.paused=false;updateTimeUI();toast(state.direction<0?'toastReverse':'toastForward');}

function collectMemory(index){
 if(state.collected.has(index)){showMemory(index);return;}
 state.collected.add(index);sound.chime(index);state.pulse=1;
 $('#memory-count').textContent=String(state.collected.size).padStart(2,'0');
 relics[index].crystal.material.emissiveIntensity=.25;relics[index].orbit.material.opacity=.2;
 showMemory(index);
}
function showMemory(index){
 memoryView=index;renderMemory();
 openDialog($('#memory-dialog'));
}
function memoryArchive(){
 memoryView='archive';renderMemory();
 openDialog($('#memory-dialog'));
}
function renderMemory(){
 if(typeof memoryView==='number'){
   const index=memoryView;
   $('#memory-kicker').textContent=t(`memoryEntries.${index}.label`);
   $('#memory-content').innerHTML=`<article class="memory-entry"><small>${t('memoryFragment',{number:index+1})}</small><h2>${t(`memoryEntries.${index}.title`)}</h2><p>${t(`memoryEntries.${index}.text`)}</p>${state.collected.size===3?`<p style="color:#d4b580">${t('memoryEnding')}</p>`:''}</article>`;
 }else{
   $('#memory-kicker').textContent=t('memoryKicker');
   $('#memory-content').innerHTML=state.collected.size===0?`<article class="memory-entry"><h2>${t('memoryEmptyTitle')}</h2><p>${t('memoryEmptyText')}</p></article>`:memories.map((m,i)=>`<article class="memory-entry${state.collected.has(i)?'':' locked'}"><small>${t(`memoryEntries.${i}.label`)}</small><h3>${state.collected.has(i)?t(`memoryEntries.${i}.title`):t('memoryLocked')}</h3><p>${state.collected.has(i)?t(`memoryEntries.${i}.text`):t('memoryLockedText')}</p></article>`).join('');
 }
}
function openDialog(dialog){if(!dialog.open)dialog.showModal();controls.enabled=false;}
function closeDialog(dialog){dialog.close();controls.enabled=true;idleAt=performance.now();}

function bindUI(){
 const cameraKeys={ArrowLeft:{azimuth:.1},ArrowRight:{azimuth:-.1},ArrowUp:{polar:-.08},ArrowDown:{polar:.08},Equal:{zoom:.92},Minus:{zoom:1.08},NumpadAdd:{zoom:.92},NumpadSubtract:{zoom:1.08}};
 const positionHold=(x,y)=>{const indicator=$('#hold-indicator');indicator.style.left=x+'px';indicator.style.top=y+'px';};
 const cancelHold=()=>{pointerState.down=false;keyboardHoldStart=null;state.charge=0;$('#hold-indicator').classList.remove('active');};
 $('#language-toggle').addEventListener('click',()=>{setLanguage(getLanguage()==='en'?'zh':'en');refreshLanguage();});
 $('#pause').addEventListener('click',togglePause);$('#reverse').addEventListener('click',()=>{state.direction=-1;state.paused=false;updateTimeUI();});
 $('#forward').addEventListener('click',()=>{state.direction=1;state.paused=false;updateTimeUI();});
 $('#speed').addEventListener('input',(event)=>{state.speed=+event.target.value;$('#speed-value').value=state.speed.toFixed(2)+'×';});
 document.querySelectorAll('.chapter').forEach(button=>button.addEventListener('click',()=>setChapter(+button.dataset.chapter)));
 $('#explore').addEventListener('click',()=>{
   $('#experience').classList.add('immersed');tweenCamera(new THREE.Vector3(7.4,5.8,14.2),center.clone(),2700);
   toast('toastExplore');
 });
 $('#brand').addEventListener('click',(event)=>{event.preventDefault();setChapter(0);});
 $('#help').addEventListener('click',()=>openDialog($('#guide')));
 $('#guide-enter').addEventListener('click',()=>closeDialog($('#guide')));
 $('#memory-return').addEventListener('click',()=>closeDialog($('#memory-dialog')));
 $('#memories').addEventListener('click',memoryArchive);
 document.querySelectorAll('.modal').forEach(dialog=>{
   dialog.querySelector('.close-modal').addEventListener('click',()=>closeDialog(dialog));
   dialog.addEventListener('close',()=>{controls.enabled=true;});
   dialog.addEventListener('click',(event)=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});
 });
 $('#audio').addEventListener('click',async()=>{
   try{await sound.toggle();updateAudioUI();}catch{toast('toastAudioFailed');}
 });
 $('#fullscreen').addEventListener('click',async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('toastFullscreenUnsupported');}catch{toast('toastFullscreenFailed');}
 });
 document.addEventListener('fullscreenchange',updateFullscreenUI);
 window.addEventListener('keydown',(event)=>{
   if(event.ctrlKey||event.metaKey||event.altKey||document.querySelector('dialog[open]')||['INPUT','TEXTAREA'].includes(event.target.tagName))return;
   if(cameraKeys[event.code]){event.preventDefault();stepCamera(cameraKeys[event.code]);}
   if(event.code==='KeyC'&&!event.repeat){event.preventDefault();collectNextMemory();}
   if(event.code==='KeyG'&&!event.repeat){
     event.preventDefault();keyboardHoldStart=performance.now();pointerState.moved=false;
     screen.copy(center).project(camera);positionHold((screen.x*.5+.5)*innerWidth,(-screen.y*.5+.5)*innerHeight);
   }
   if(event.code==='Space'&&event.target.tagName!=='BUTTON'){event.preventDefault();togglePause();}
   if(event.code==='KeyR')toggleReverse();
   if(event.code==='KeyH'){state.uiHidden=!state.uiHidden;$('#experience').classList.toggle('ui-hidden',state.uiHidden);if(state.uiHidden)toast('toastRestore');}
   if(['Digit1','Digit2','Digit3'].includes(event.code))setChapter(+event.code.slice(-1)-1);
   if(event.code==='Escape'){state.uiHidden=false;$('#experience').classList.remove('ui-hidden','immersed');}
 });
 canvas.addEventListener('pointerdown',(event)=>{
   if(event.button!==0)return;
   pointerState.down=true;pointerState.moved=false;pointerState.start=performance.now();pointerState.x=event.clientX;pointerState.y=event.clientY;
   pointerState.clientX=event.clientX;pointerState.clientY=event.clientY;
   positionHold(event.clientX,event.clientY);
 });
 canvas.addEventListener('pointermove',(event)=>{
   pointer.x=(event.clientX/innerWidth)*2-1;pointer.y=-(event.clientY/innerHeight)*2+1;pointerState.clientX=event.clientX;pointerState.clientY=event.clientY;
   if(pointerState.down&&Math.hypot(event.clientX-pointerState.x,event.clientY-pointerState.y)>7){pointerState.moved=true;state.charge=0;$('#hold-indicator').classList.remove('active');}
 });
 const release=()=>{
   if((pointerState.down||keyboardHoldStart!==null)&&state.charge>.15&&!pointerState.moved){state.pulse=Math.max(state.pulse,state.charge*1.7);if(state.charge>.75)toast('toastPulse');}
   cancelHold();
 };
 window.addEventListener('pointerup',release);window.addEventListener('pointercancel',cancelHold);
 window.addEventListener('keyup',event=>{if(event.code==='KeyG'&&keyboardHoldStart!==null)release();});
 window.addEventListener('blur',cancelHold);
 canvas.addEventListener('pointerleave',()=>{pointer.set(9,9);$('#relic-label').hidden=true;});
 canvas.addEventListener('dblclick',(event)=>{
   pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);
   const hit=raycaster.intersectObjects(relics.map(r=>r.hit));if(hit.length)collectMemory(hit[0].object.userData.memory);
 });
 // Touch browsers may not dispatch dblclick. Recognize only short, stationary taps.
 let lastTap=0,lastTapX=0,lastTapY=0;
 canvas.addEventListener('pointerup',(event)=>{
   if(event.pointerType!=='touch'||pointerState.moved||performance.now()-pointerState.start>350)return;
   const now=performance.now();
   if(now-lastTap<320&&Math.hypot(event.clientX-lastTapX,event.clientY-lastTapY)<25){
     pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(relics.map(r=>r.hit));if(hits.length)collectMemory(hits[0].object.userData.memory);lastTap=0;
   }else{lastTap=now;lastTapX=event.clientX;lastTapY=event.clientY;}
 });
 window.addEventListener('resize',resize);
 document.addEventListener('visibilitychange',()=>{lastTime=performance.now();if(document.hidden)cancelHold();});
 canvas.addEventListener('webglcontextlost',(event)=>{event.preventDefault();toast('toastContextLost');});
 canvas.addEventListener('webglcontextrestored',()=>location.reload());
}

function resize(){
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
 finalPass.uniforms.uAspect.value=innerWidth/innerHeight;finalPass.uniforms.uResolution.value.set(innerWidth,innerHeight);
 const isMobile=innerWidth<641;
 if(isMobile!==mobileLayout){mobileLayout=isMobile;setChapter(state.chapter);}
}

function updateLabels(){
 const label=$('#object-label');screen.copy(center).add(new THREE.Vector3(3,-3.5,0)).project(camera);
 const visible=screen.z<1&&Math.abs(screen.x)<.84&&Math.abs(screen.y)<.6;
 label.style.opacity=visible?'1':'0';label.style.left=Math.max(20,Math.min((screen.x*.5+.5)*innerWidth,innerWidth-label.offsetWidth-45))+'px';label.style.top=(-screen.y*.5+.5)*innerHeight+'px';
 raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(relics.map(r=>r.hit));
 const hint=$('#relic-label');hint.hidden=!hits.length||pointerState.down;
 if(hits.length){const id=hits[0].object.userData.memory;hint.textContent=t(state.collected.has(id)?'revisit':'collect');hint.style.left=Math.max(8,Math.min(innerWidth-hint.offsetWidth-12,pointerState.clientX+17))+'px';hint.style.top=(pointerState.clientY-38)+'px';canvas.style.cursor='pointer';}else canvas.style.cursor=pointerState.down?'grabbing':'grab';
}

function animate(now){
 requestAnimationFrame(animate);
 if(document.hidden){lastTime=now;return;}
 const rawDelta=lastTime?Math.min((now-lastTime)/1000,.08):.016;lastTime=now;
 state.frameMs=state.frameMs*.97+rawDelta*1000*.03;
 const dt=rawDelta;
 if(!state.paused)state.time+=dt*state.direction*state.speed;
 state.pulse=Math.max(0,state.pulse-dt*.48);
 const holdStart=pointerState.down&&!pointerState.moved?pointerState.start:keyboardHoldStart;
 if(holdStart!==null){
   const elapsed=(now-holdStart)/1000;
   if(elapsed>.35){state.charge=Math.min(1,(elapsed-.35)/1.5);$('#hold-indicator').classList.add('active');$('#hold-progress').style.strokeDashoffset=151*(1-state.charge);}
 }
 const pulse=state.pulse+state.charge*.7;
 animated.forEach(fn=>fn(state.time));
 uniforms.forEach(u=>{if(u.uTime)u.uTime.value=state.time;if(u.uPulse)u.uPulse.value=pulse;});
 water.material.uniforms.uTime.value=state.time;water.material.uniforms.uPulse.value=pulse;
 if(cameraTween){
   const p=Math.min(1,(now-cameraTween.start)/cameraTween.duration),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
   camera.position.lerpVectors(cameraTween.from,cameraTween.to,e);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.target,e);
   if(p===1)cameraTween=null;
 }
 // The very slow opening drift stops as soon as the observer takes control.
 controls.autoRotate=!reducedMotion&&!cameraTween&&!pointerState.down&&keyboardHoldStart===null&&now-idleAt>16000&&!document.querySelector('dialog[open]');controls.autoRotateSpeed=.12*(state.paused?0:state.direction);
 controls.update(dt);
 screen.copy(center).project(camera);finalPass.uniforms.uCenter.value.set(screen.x*.5+.5,-screen.y*.5+.5);finalPass.uniforms.uTime.value=state.time;finalPass.uniforms.uPulse.value=pulse;
 // Projected world coordinates use Y-up, matching texture coordinates in the post pass.
 finalPass.uniforms.uCenter.value.y=screen.y*.5+.5;
 bloom.strength=.56+pulse*.16;
 if(frame%12===0){sound.update(state.paused?0:state.direction,pulse);updateLabels();}
 if(now-lastUI>100){
   $('#time-number').textContent=(state.time<0?'− ':'+ ')+Math.abs(state.time).toFixed(2).padStart(6,'0');
   const secs=Math.floor(Math.abs(state.time));$('#coordinates').textContent=`∞ / ${String(Math.floor(secs/3600)).padStart(2,'0')}:${String(Math.floor(secs/60)%60).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
   lastUI=now;
 }
 renderer.info.reset();composer.render(dt);
 frame++;
 // Reduce only pixel density, preserving every object and interaction on slower GPUs.
 if(frame===180&&state.frameMs>36&&renderer.getPixelRatio()>1){
   state.quality=.8;renderer.setPixelRatio(Math.max(1,renderer.getPixelRatio()*.75));composer.setPixelRatio(renderer.getPixelRatio());uniforms.forEach(u=>{if(u.uPixelRatio)u.uPixelRatio.value=renderer.getPixelRatio();});resize();
 }
}

// A read-only diagnostics surface supports reproducible rendering and interaction checks.
window.__END_OF_TIME__={
 getSnapshot(){
   return {ready:state.started,language:getLanguage(),time:state.time,direction:state.direction,paused:state.paused,speed:state.speed,pulse:state.pulse,charge:state.charge,chapter:state.chapter,collected:[...state.collected],uiHidden:state.uiHidden,audio:{enabled:sound.enabled,context:sound.context?.state??'not-created'},camera:camera?.position.toArray(),target:controls?.target.toArray(),drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,frameMs:state.frameMs,pixelRatio:renderer?.getPixelRatio(),quality:state.quality,relics:relics.map(r=>{const p=r.group.position.clone().project(camera);return {index:r.index,x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight,visible:Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1};})};
 }
};
try{refreshLanguage();init();}catch(error){fail(error);}
