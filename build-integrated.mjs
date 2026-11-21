import {readFile,writeFile,rename,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=n=>readFile(new URL(n,import.meta.url),'utf8');
const original=await read('EnglishQuest.html'),standalone=await read('EnglishQuest_REBORN.html');
const manifest=JSON.parse(standalone.match(/const RebornVoiceManifest=(.*?);\s*\n/)[1]);
if(manifest.utterances.filter(x=>x.available&&x.embedded).length!==36)throw Error('Expected the 36 verified Phase 5 voices');
const scripts=await Promise.all(['reborn-learning','reborn-battlefield','reborn-journey','reborn-combat','reborn-field-art','reborn-art','reborn-audio','reborn-voice','reborn-ui','integrated-combat'].map(n=>read('src/'+n+'.js')));
const tracking=await read('src/integrated-lifecycle.js');
const frame=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>로완의 숲 훈련</title><style>${await read('src/reborn.css')}\n[data-action="menu"], [data-action="encounter"], .session-note, .audio-diagnostic {display:none!important} .topbar .badge{display:none} .topbar h1{font-size:30px} .shell{padding-top:12px}</style><body class="reborn"><main id="app"></main><script>'use strict';${tracking};const RebornVoiceManifest=parent.IntegratedAssets.manifest;${scripts.join('\n;\n')}</script></body></html>`;
const campaign=original.match(/<script>([\s\S]*)<\/script>/)[1];
const assets=JSON.stringify({manifest,frame}).replace(/</g,'\\u003c');
const js=[await read('src/integrated-store.js'),await read('src/campaign-combat-bridge.js'),tracking,`window.IntegratedAssets=${assets};`,await read('src/reborn-audio.js'),await read('src/reborn-voice.js'),`(()=>{const WorldStore=IntegratedStore.create(window.localStorage);const localStorage=WorldStore.campaignStorage;\n${campaign}\n${await read('src/integrated-campaign.js')}\n})();`].join('\n;\n');
const html=original.replace(/<title>[\s\S]*?<\/title>/,'<title>English Quest REBORN · One World, One Adventure</title>').replace('</style>',(await read('src/integrated.css'))+'</style>').replace(/<script>[\s\S]*<\/script>/,()=>`<script>${js}</script>`);
const temp=new URL('.integrated-'+process.pid+'.tmp',import.meta.url),target=new URL('EnglishQuest_REBORN_INTEGRATED.html',import.meta.url);
try{await writeFile(temp,html,{flag:'wx'});await rename(temp,target);}finally{await rm(temp,{force:true});}
console.log(JSON.stringify({bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex'),voices:36,originalUntouched:true,standaloneUntouched:true}));
