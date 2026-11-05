import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleBreath,BREATH_PERIOD,createBioluminescence} from '../src/bioluminescence.js';
import {createOrganism} from '../src/model.js';

test('inhale expands body, light reach and particle field together, and exhale returns continuously',()=>{
 const low=sampleBreath(0),high=sampleBreath(BREATH_PERIOD/2),end=sampleBreath(BREATH_PERIOD);
 for(const key of ['scaleXZ','scaleY','light','haloDiameter','particleSpread']){
  assert(high[key]>low[key],`${key} does not expand`);assert(Math.abs(end[key]-low[key])<1e-10);
  let last=low[key];for(let i=1;i<=20;i++){const current=sampleBreath(i*BREATH_PERIOD/40)[key];assert(current>=last);last=current;}
 }
 const before=sampleBreath(BREATH_PERIOD-1e-5),after=sampleBreath(BREATH_PERIOD+1e-5);assert(Math.abs(before.light-after.light)<1e-8);
});

test('inner particles occupy a bounded inner volume and exterior lights surround it in depth',()=>{
 const field=createBioluminescence(),inside=field.inner.geometry.getAttribute('position'),outside=field.outer.geometry.getAttribute('position');
 for(let i=0;i<inside.count;i++){const x=inside.getX(i),y=inside.getY(i),z=inside.getZ(i);assert(Math.hypot(x,z)<1.5);assert(y>.4&&y<2.05);}
 const range=axis=>{const values=Array.from({length:outside.count},(_,i)=>outside.array[i*3+axis]);return Math.max(...values)-Math.min(...values);};
 assert(range(0)>8);assert(range(1)>6);assert(range(2)>5);
 for(const object of [field.inner,field.outer])for(const attr of Object.values(object.geometry.attributes))for(const value of attr.array)assert(Number.isFinite(value));
});

test('reusing a frozen animation time freezes breathing and particle phase',()=>{
 const model=createOrganism(),field=createBioluminescence(),time=3.1,b=sampleBreath(time);
 model.setTime(time,0,b);field.update(time,b);
 const scale=model.root.scale.toArray(),light=model.uniforms.uLight.value;
 assert.equal(model.root.scale.x,b.scaleXZ);assert.equal(model.root.scale.y,b.scaleY);assert.equal(light,b.light);assert.equal(model.uniforms.uBreath.value,b.pulse);
 model.setTime(time,0,sampleBreath(time));field.update(time,sampleBreath(time));
 assert.deepEqual(model.root.scale.toArray(),scale);assert.equal(model.uniforms.uLight.value,light);assert.equal(field.uniforms.uTime.value,time);
 let arms=0;model.trails.traverse(o=>{if(o.geometry?.userData.roundProfiles){arms++;assert(o.material.transparent);assert.equal(o.material.depthWrite,false);}});assert.equal(arms,2);
});
