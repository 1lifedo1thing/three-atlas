import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createOrganism} from './model.js';

import {createBioluminescence,sampleBreath} from './bioluminescence.js';

import {createI18n} from './copy.js';

let languageStorage;try{languageStorage=window.localStorage;}catch{}
const i18n=createI18n(document,languageStorage);
function initScene(){
const stage=document.querySelector('#stage');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}
catch(error){
 const message=document.createElement('p');message.dataset.i18n='rendererError';message.textContent=i18n.t('rendererError');
 const back=document.createElement('a');back.href='../../';back.className='atlas-error-return';back.textContent=i18n.t('homeLabel');back.dataset.i18n='homeLabel';
 document.querySelector('#loader').replaceChildren(message,back);document.body.classList.add('has-error');return;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('data-i18n-aria','canvasLabel');renderer.domElement.setAttribute('aria-label',i18n.t('canvasLabel'));
const scene=new THREE.Scene();scene.background=new THREE.Color('#060b15');
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.05,130);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.enablePan=false;controls.minDistance=1.6;controls.maxDistance=22;controls.rotateSpeed=.55;controls.zoomSpeed=.6;controls.autoRotate=!reduced;controls.autoRotateSpeed=.22;controls.listenToKeyEvents(renderer.domElement);
const env=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const envTarget=pmrem.fromScene(env,.03);scene.environment=envTarget.texture;scene.environmentIntensity=.65;env.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight('#cddfff','#543c66',.70));
const key=new THREE.DirectionalLight('#a0caff',1.65);key.position.set(-4,6,5);scene.add(key);
const rim=new THREE.DirectionalLight('#c39cff',1.6);rim.position.set(4,1,-4);scene.add(rim);
const warm=new THREE.PointLight('#ffc8a9',1.2,4,2);warm.position.set(0,.8,.1);scene.add(warm);
const organism=createOrganism();scene.add(organism.root);
const field=createBioluminescence();scene.add(field.outer,field.halo);organism.root.add(field.inner);

// Smooth, spatial background illumination; no film grain or dithering texture.
const sky=new THREE.Mesh(new THREE.SphereGeometry(55,40,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uTime:{value:0}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
varying vec3 vP;uniform float uTime;
void main(){vec3 n=normalize(vP);float glow=pow(max(0.,dot(n,normalize(vec3(-.08,.18,-1.)))),6.);float blue=pow(max(0.,dot(n,normalize(vec3(.2,.65,-1.)))),24.);vec3 c=vec3(.0018,.0035,.008)+glow*vec3(.009,.019,.033)+blue*vec3(.002,.007,.014);gl_FragColor=vec4(c,1.);}` }));scene.add(sky);

renderer.info.autoReset=false;
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.7,.68,.8);composer.addPass(bloom);composer.addPass(new OutputPass());

let paused=reduced,time=0,last=performance.now(),wakeAt=-100,view='whole',transition=null,hiddenAt=null;
i18n.updateState({paused});
const home=new THREE.Vector3(5.1,1.65,10.4);
const targets={whole:{position:home,target:new THREE.Vector3(0,-.40,0)},skeleton:{position:new THREE.Vector3(3.6,1.8,5.8),target:new THREE.Vector3(0,.40,0)},seed:{position:new THREE.Vector3(1.3,1.1,2.4),target:new THREE.Vector3(0,.8,0)},trails:{position:new THREE.Vector3(3.5,-.7,6.4),target:new THREE.Vector3(0,-1.35,0)}};
camera.position.copy(home);controls.target.copy(targets.whole.target);controls.update();
function scaledPosition(name){
 const spec=targets[name],factor=innerWidth<=650?Math.max(1.05,({whole:.75,skeleton:1.12,seed:.86,trails:1.08}[name])/camera.aspect):1;
 return spec.position.clone().sub(spec.target).multiplyScalar(factor).add(spec.target);
}
function resize(){
 const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.clearViewOffset();
 if(w>650)camera.setViewOffset(w,h,-w*.09,0,w,h);
 else camera.setViewOffset(w,h,-w*.035,-h*.055,w,h);
 camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);field.resize(h,renderer.getPixelRatio(),camera.fov);
 if(!transition){camera.position.copy(scaledPosition(view));controls.target.copy(targets[view].target);controls.update();}
}
resize();window.addEventListener('resize',resize);

function chooseView(name){
 if(!targets[name])return;view=name;field.setView(name);
 organism.bell.visible=name==='whole';organism.trails.visible=name==='whole'||name==='trails';organism.skeleton.visible=name==='whole'||name==='skeleton';organism.seed.visible=name!=='trails';
 const target=targets[name],end=scaledPosition(name);
 transition={start:performance.now(),p0:camera.position.clone(),p1:end,t0:controls.target.clone(),t1:target.target.clone()};
 document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 i18n.updateState({view:name});
}
function toggleMotion(){paused=!paused;controls.autoRotate=!paused;const btn=document.querySelector('#motion');i18n.updateState({paused});btn.querySelector('path').setAttribute('d',paused?'M7 4l8 6-8 6Z':'M7 5v10M13 5v10');}
if(paused){const btn=document.querySelector('#motion');btn.querySelector('path').setAttribute('d','M7 4l8 6-8 6Z');}
function wake(){wakeAt=performance.now();}
function clean(){const active=document.body.classList.toggle('clean');i18n.updateState({clean:active});}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>chooseView(b.dataset.view)));
document.querySelector('#motion').addEventListener('click',toggleMotion);document.querySelector('#wake').addEventListener('click',wake);document.querySelector('#clean').addEventListener('click',clean);
const dialog=document.querySelector('#sources');document.querySelector('#about').addEventListener('click',()=>dialog.showModal());document.querySelector('#close-about').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
window.addEventListener('keydown',e=>{if(dialog.open)return;if(e.code==='Space'&&!e.target.closest?.('button,a,input,select,textarea,[contenteditable]')){e.preventDefault();toggleMotion();}if(e.key.toLowerCase()==='h')clean();if(['1','2','3','4'].includes(e.key))chooseView(['whole','skeleton','seed','trails'][Number(e.key)-1]);});
let down=null;renderer.domElement.addEventListener('pointerdown',e=>{renderer.domElement.focus({preventScroll:true});down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5)wake();down=null;});controls.addEventListener('start',()=>{transition=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=performance.now();else{last=performance.now();hiddenAt=null;}});

let frames=0,totalFrame=0,stats=null;
function animate(now){
 requestAnimationFrame(animate);const rawDt=(now-last)/1000,dt=Math.min(rawDt,.04);last=now;if(hiddenAt!==null)return;
 if(!paused)time+=dt;
 const age=(now-wakeAt)/1000,wakeValue=age>=0&&age<4?Math.sin(Math.min(age/4,1)*Math.PI)*Math.exp(-age*.22):0;
 const breath=sampleBreath(time);
 organism.setTime(time,wakeValue,breath);field.update(time,breath,wakeValue);
 warm.intensity=.70+breath.pulse*1.1+wakeValue*2.;warm.distance=3.8+breath.pulse*1.4;
 bloom.strength=.54+breath.pulse*.28+wakeValue*.12;bloom.radius=.57+breath.pulse*.13;
 const membraneTarget=view==='skeleton'?.14:view==='seed'?.20:.72;
 organism.materials.outer.uniforms.uOpacity.value+=(membraneTarget-organism.materials.outer.uniforms.uOpacity.value)*.055;
 organism.materials.inner.uniforms.uOpacity.value=view==='whole'?.30:.08;
 if(transition){
  const p=Math.min((now-transition.start)/1600,1),e=p*p*(3-2*p);
  camera.position.lerpVectors(transition.p0,transition.p1,e);controls.target.lerpVectors(transition.t0,transition.t1,e);if(p===1)transition=null;
 }
 controls.update();renderer.info.reset();composer.render();
 frames++;totalFrame+=rawDt;if(frames%90===0){
  stats={frames,time,view,paused,breathPulse:breath.pulse,light:breath.light,haloDiameter:breath.haloDiameter,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,averageFps:Math.round(90/totalFrame)};totalFrame=0;
  stage.dataset.renderStats=JSON.stringify(stats);
 }
 if(frames===3){document.querySelector('#loader').classList.add('done');document.body.dataset.ready='true';document.body.classList.add('ready');}
}
requestAnimationFrame(animate);
window.addEventListener('pagehide',e=>{if(e.persisted)return;controls.dispose();composer.dispose();envTarget.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});renderer.dispose();},{once:true});

}
initScene();
