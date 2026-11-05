import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MESSAGES,stateLabels,normalizeLanguage} from '../src/copy.js';

test('both languages cover the full interface and preserve source and license links',()=>{
 assert.deepEqual(Object.keys(MESSAGES.en).sort(),Object.keys(MESSAGES.zh).sort());
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const [,key] of html.matchAll(/data-i18n(?:-html|-aria|-title)?="([^"]+)"/g))for(const language of ['zh','en'])assert(MESSAGES[language][key],`Missing ${language} translation: ${key}`);
 for(const value of Object.values(MESSAGES.en)){assert(value.trim());assert(!/\p{Script=Han}/u.test(value),'Untranslated Chinese in English catalog');}
 for(const key of ['aboutDescription','aboutReferences','aboutLicense']){
  const links=language=>[...MESSAGES[language][key].matchAll(/href="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(links('en'),links('zh'),`${key} loses an attribution link`);
 }
});

test('changing language uses the current paused, focus and observation state',()=>{
 const state={paused:true,clean:true,view:'trails'};
 assert.deepEqual(stateLabels('en',state),{motion:'Resume',motionLabel:'Resume drift',clean:'Back',note:'04 / Volumetric tentacles'});
 assert.deepEqual(stateLabels('zh',state),{motion:'继续',motionLabel:'继续漂游',clean:'返回',note:'04 / 立体触须'});
 assert.equal(normalizeLanguage('invalid'),'zh');
});
