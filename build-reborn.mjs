import {readFile, writeFile, rename, rm} from 'node:fs/promises';
import {resolve, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('.',import.meta.url));
const read=name=>readFile(new URL(name,import.meta.url),'utf8');
const manifest=JSON.parse(await read('REBORN_VOICE_MANIFEST.json'));
async function embed(path,item){
  if(!path)return null;
  const file=resolve(root,path), rel=relative(root,file);
  if(rel.startsWith('..')||isAbsolute(rel)||!/^assets[\\/]reborn[\\/]voice[\\/]/.test(rel)) throw Error('Unsafe audio path: '+item.id);
  try {
    const bytes=await readFile(file);
    if(!item.license?.redistributionAllowed||!item.license?.source||!item.license?.type) throw Error('Audio needs verified redistribution metadata: '+item.id);
    if(item.voiceModel&&(!item.verification||item.verification.status!=='Technically verified'||item.verification.sha256!==createHash('sha256').update(bytes).digest('hex')))throw Error('Piper asset is unverified or modified: '+item.id);
    const ext=file.split('.').pop().toLowerCase(), mime={mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',opus:'audio/ogg',m4a:'audio/mp4'}[ext];
    if(!mime||!bytes.length) throw Error('Invalid audio asset: '+item.id);
    return 'data:'+mime+';base64,'+bytes.toString('base64');
  } catch(error){if(error.code!=='ENOENT') throw error;return null;}
}
for(const item of manifest.utterances){
  item.embedded=await embed(item.normalSpeedAsset||item.path,item);
  item.embeddedSlow=await embed(item.slowSpeedAsset,item);
  item.available=!!item.embedded;
}
const names=['reborn-learning.js','reborn-combat.js','reborn-art.js','reborn-audio.js','reborn-voice.js','reborn-ui.js'];
const scripts=await Promise.all(names.map(n=>read('src/'+n)));
const style=await read('src/reborn.css');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#102c2d"><title>English Quest REBORN · The Battle Awakens</title><style>${style}</style></head><body class="reborn"><main id="app"></main><noscript>JavaScript를 켜 주세요.</noscript><script>'use strict';\nconst RebornVoiceManifest=${JSON.stringify(manifest).replace(/</g,'\\u003c')};\n${scripts.join('\n;\n')}</script></body></html>`;
const target=new URL('EnglishQuest_REBORN.html',import.meta.url), temp=new URL('.reborn-'+process.pid+'.tmp',import.meta.url);
try{await writeFile(temp,html,{flag:'wx'});await rename(temp,target);}finally{await rm(temp,{force:true});}
console.log(`Reborn built: ${Buffer.byteLength(html)} bytes; licensed voice assets ${manifest.utterances.filter(x=>x.available).length}/${manifest.utterances.length}. Original EnglishQuest.html untouched.`);
