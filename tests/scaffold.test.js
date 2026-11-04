import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, cp, rm} from 'node:fs/promises';import{tmpdir}from'node:os';import{join}from'node:path';
const scaffold=await import('../scripts/new-work.mjs').catch(()=>null);
test('脚手架安全追加新作，保留旧条目并拒绝覆盖与越界',async()=>{
 assert.ok(scaffold?.newWork,'缺少脚手架');const root=await mkdtemp(join(tmpdir(),'atlas-scaffold-'));
 try{await mkdir(join(root,'content'));await mkdir(join(root,'experiences'));await cp('experiences/_template',join(root,'experiences/_template'),{recursive:true});await writeFile(join(root,'content/works.json'),'[]\n');
 await assert.rejects(()=>scaffold.newWork({root,id:'../escape',title:'Test',subtitle:'测试'}));
 await scaffold.newWork({root,id:'test-world',title:'A <WORLD> "quoted"',subtitle:'一个测试'});
 const works=JSON.parse(await readFile(join(root,'content/works.json'),'utf8'));assert.equal(works.length,1);assert.equal(works[0].entry,'experiences/test-world/index.html');
 const html=await readFile(join(root,works[0].entry),'utf8');assert.ok(html.includes('&lt;WORLD&gt;'));assert.ok(!html.includes('<WORLD>'));assert.ok(!html.includes('__WORK_JSON__'));
 await assert.rejects(()=>scaffold.newWork({root,id:'test-world',title:'Other',subtitle:'其它'}));assert.equal(JSON.parse(await readFile(join(root,'content/works.json'),'utf8')).length,1);
 }finally{await rm(root,{recursive:true,force:true})}
});
