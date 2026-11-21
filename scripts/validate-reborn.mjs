import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root));
const original=await read('EnglishQuest.html');
const expected='e0f49c2bb74125f16828c0a1d9f5b448b0fea1831c6af9117290668feda0cbad';
if(createHash('sha256').update(original).digest('hex')!==expected)throw Error('Original verified v0.8 HTML changed');
const manifest=JSON.parse(await read('REBORN_VOICE_MANIFEST.json'));
const ids=new Set(),missing=[];
for(const x of manifest.utterances){
  if(ids.has(x.id)||!/^VO_[A-Z_0-9]+$/.test(x.id))throw Error('Invalid/duplicate voice ID');ids.add(x.id);
  for(const field of ['en','ko','usage','voiceCharacter','accent','path'])if(!x[field])throw Error('Missing '+field+': '+x.id);
  try{await stat(new URL(x.path,root));if(!x.license.redistributionAllowed||!x.license.source||!x.license.type)throw Error('Unlicensed audio: '+x.id);}catch(error){if(error.code==='ENOENT')missing.push(x.path);else throw error;}
}
for(const file of ['src/reborn-combat.js','src/reborn-learning.js','src/reborn-ui.js']){
  const source=(await read(file)).toString();
  for(const [id] of source.matchAll(/VO_[A-Z_0-9]+/g))if(!ids.has(id))throw Error(file+' references unknown voice '+id);
  if(/localStorage|sessionStorage|indexedDB/.test(source))throw Error('Lab must not access campaign storage: '+file);
}
const bundle=await read('EnglishQuest_REBORN.html');
console.log(JSON.stringify({originalPreserved:true,originalBytes:original.length,voiceCount:ids.size,available:ids.size-missing.length,missing,rebornBytes:bundle.length,sha256:createHash('sha256').update(bundle).digest('hex')},null,2));
