import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translations, t, setLanguage } from '../src/i18n.js';

test('同名作品保留独立路由，并准确区分两种制作工具与模型',()=>{
 const works=JSON.parse(readFileSync(new URL('../../../content/works.json',import.meta.url),'utf8'));
 const sol=works.find(w=>w.id==='end-of-time-sol');
 const opus=works.find(w=>w.id==='end-of-time');
 assert.deepEqual(sol.production,{tool:'Codex',model:'6.1 sol'});
 assert.deepEqual(opus.production,{tool:'Claude Code',model:'opus5.5'});
 assert.notEqual(sol.entry,opus.entry);
 for(const language of ['zh','en']){
   assert.match(sol.subtitle[language],/Codex 6\.1 sol/);
   assert.match(opus.subtitle[language],/Claude Code opus5\.5/);
 }
});

test('两个语言字典的结构一致，所有场景与记忆文本都有对应译文',()=>{
 function paths(object,prefix=''){
   return Object.entries(object).flatMap(([key,value])=>typeof value==='string'?[prefix+key]:paths(value,prefix+key+'.')).sort();
 }
 assert.deepEqual(paths(translations.zh),paths(translations.en));
 for(const language of ['zh','en']){
   setLanguage(language);
   for(const key of paths(translations[language]))assert.ok(t(key).trim(),key);
   assert.ok(t('memoryFragment',{number:3}).includes('3'));
   assert.ok(!t('memoryFragment',{number:3}).includes('{number}'));
 }
 setLanguage('zh');
});
