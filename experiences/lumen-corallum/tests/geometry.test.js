import assert from 'node:assert/strict';
import {createOrganism} from '../src/model.js';
import test from 'node:test';
test('geometry stays finite with rounded, outward-facing soft arms',()=>{
const model=createOrganism();let vertices=0,triangles=0,meshes=0;
model.root.traverse(o=>{
 if(!o.geometry)return;meshes++;const g=o.geometry,p=g.getAttribute('position');vertices+=p.count;triangles+=(g.index?g.index.count:p.count)/3;
 for(const name of ['position','normal','uv'])for(const value of g.getAttribute(name).array)assert(Number.isFinite(value),`${o.name}: non-finite ${name}`);
 for(const i of g.index?.array||[])assert(i<p.count,'Out-of-bounds triangle index');
 g.computeBoundingBox();assert(g.boundingBox.min.y>-4.5&&g.boundingBox.max.y<3.5,'Unexpected vertical extent');assert(g.boundingBox.min.x>-4&&g.boundingBox.max.x<4,'Unexpected branch extent');
});
assert(meshes>=14);assert(triangles>250000);assert(triangles<1500000);
let roundProfiles=0;
model.trails.traverse(o=>{
 const g=o.geometry;if(!g?.userData.roundProfiles)return;
 const p=g.getAttribute('position');
 for(const profile of g.userData.roundProfiles){
  roundProfiles++;
  for(const fraction of [.15,.5,.85]){
   const ring=profile.offset+Math.round(profile.segments*fraction)*(profile.sides+1),center=[0,0,0];
   for(let j=0;j<profile.sides;j++){center[0]+=p.getX(ring+j)/profile.sides;center[1]+=p.getY(ring+j)/profile.sides;center[2]+=p.getZ(ring+j)/profile.sides;}
   const radii=[];for(let j=0;j<profile.sides;j++)radii.push(Math.hypot(p.getX(ring+j)-center[0],p.getY(ring+j)-center[1],p.getZ(ring+j)-center[2]));
   assert(Math.min(...radii)/Math.max(...radii)>.90,'Soft arm cross section has collapsed or flattened');
  }
 }
 let volume=0;
 for(let k=0;k<g.index.count;k+=3){
  const a=g.index.getX(k),b=g.index.getX(k+1),c=g.index.getX(k+2);
  volume+=p.getX(a)*(p.getY(b)*p.getZ(c)-p.getZ(b)*p.getY(c))+p.getY(a)*(p.getZ(b)*p.getX(c)-p.getX(b)*p.getZ(c))+p.getZ(a)*(p.getX(b)*p.getY(c)-p.getY(b)*p.getX(c));
 }
 assert(volume>0,'Soft arms have inward-facing surfaces');
});
assert.equal(roundProfiles,26,'Expected ten primary and sixteen secondary volume arms');
for(const t of [0,1,100,10000]){model.setTime(t,.5);assert(Number.isFinite(model.root.position.y));}
});
