'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'REBORN_VOICE_MANIFEST.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function pcm(bytes){
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
 let format,data;
 for(let n=12;n+8<=bytes.length;){const tag=bytes.toString('ascii',n,n+4),length=bytes.readUInt32LE(n+4);assert.ok(n+8+length<=bytes.length);if(tag==='fmt ')format=bytes.subarray(n+8,n+8+length);if(tag==='data')data=bytes.subarray(n+8,n+8+length);n+=8+length+(length%2);}
 assert.ok(format&&data);assert.equal(format.readUInt16LE(0),1);assert.equal(format.readUInt16LE(2),1);assert.equal(format.readUInt32LE(4),22050);assert.equal(format.readUInt16LE(14),16);
 let energy=0,active=0,peak=0;for(let n=0;n<data.length;n+=2){const v=data.readInt16LE(n);energy+=v*v;if(Math.abs(v)>164)active++;peak=Math.max(peak,Math.abs(v));}
 return{duration:data.length/44100,rms:Math.sqrt(energy/(data.length/2))/32768,active:active/(data.length/2),peak:peak/32768};
}
test('All34 exact script entries map to genuine verified mono PCM speech files and immutable receipts',()=>{
 const script=fs.readFileSync(path.join(root,'REBORN_VOICE_SCRIPT.md'),'utf8');
 const originalRows=[...script.matchAll(/^\| (VO_[A-Z_]+) \| [^|]+ \| ([^|]+) \| ([^|]+) \|/gm)];assert.equal(originalRows.length,34);
 assert.equal(manifest.utterances.length,34);
 for(const x of manifest.utterances){const original=originalRows.find(r=>r[1]===x.id);assert.ok(original);assert.equal(x.en,original[2].trim());assert.equal(x.ko,original[3].trim());
  const file=path.join(root,x.path),bytes=fs.readFileSync(file),data=pcm(bytes),receipt=JSON.parse(fs.readFileSync(file.replace(/\.wav$/,'.json'),'utf8'));
  assert.equal(x.path,`assets/reborn/voice/${x.id}.wav`);assert.equal(x.normalSpeedAsset,x.path);assert.equal(x.available,true);assert.equal(x.verification.sha256,sha(bytes));assert.equal(receipt.sha256,sha(bytes));assert.equal(receipt.en,x.en);assert.equal(receipt.id,x.id);
  assert.ok(data.duration>.2&&data.duration<12);assert.ok(Math.abs(data.duration-x.durationSeconds)<.000001);assert.ok(data.rms>.001&&data.active>.01);assert.ok(data.peak<1);
  assert.equal(x.license.redistributionAllowed,true);assert.equal(x.voiceModel,'en_US-ljspeech-medium');assert.match(x.audioSource,/Piper synthetic/);assert.equal(x.qualityReview.reviewer,null);assert.equal(x.qualityReview.status,'Needs listening review');
 }
});
test('The standalone game embeds the exact34 approved files without an engine or model runtime',()=>{
 const html=fs.readFileSync(path.join(root,'EnglishQuest_REBORN.html'),'utf8');
 const data=JSON.parse(html.match(/const RebornVoiceManifest=(.*);\n/)[1]);assert.equal(data.utterances.filter(x=>x.available&&x.embedded).length,34);
 for(const x of data.utterances){assert.match(x.embedded,/^data:audio\/wav;base64,/);assert.equal(sha(Buffer.from(x.embedded.split(',')[1],'base64')),x.verification.sha256);assert.equal(x.embeddedSlow,null);}
 assert.ok(!html.includes('en_US-lessac-medium'));assert.ok(!/<(?:script|audio)[^>]+src=["']https?:/i.test(html));
});
test('Downloaded model identity matches official LFS metadata and all receipts, with no Lessac distribution',()=>{
 const source=JSON.parse(fs.readFileSync(path.join(root,'docs/piper/ljspeech-source-files.json'),'utf8'));
 const lfs=source.find(x=>x.path.endsWith('.onnx')).lfs.oid;
 for(const x of manifest.utterances)assert.equal(x.license.modelSha256,lfs);
 assert.ok(!fs.readdirSync(path.join(root,'assets/reborn/voice')).some(x=>/onnx|lessac/i.test(x)));
 const original=fs.readFileSync(path.join(root,'EnglishQuest.html'));assert.equal(sha(original),'e0f49c2bb74125f16828c0a1d9f5b448b0fea1831c6af9117290668feda0cbad');
});

test('Packaging rejects changed or unapproved audio, while genuinely missing files stay unavailable',()=>{
 const os=require('node:os'),{spawnSync}=require('node:child_process'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'reborn-piper-build-'));
 try{
  fs.copyFileSync(path.join(root,'build-reborn.mjs'),path.join(temp,'build-reborn.mjs'));fs.cpSync(path.join(root,'src'),path.join(temp,'src'),{recursive:true});
  const row=structuredClone(manifest.utterances[0]),testManifest={...manifest,utterances:[row]},file=path.join(temp,row.path);
  fs.mkdirSync(path.dirname(file),{recursive:true});const bytes=fs.readFileSync(path.join(root,row.path));
  const save=()=>fs.writeFileSync(path.join(temp,'REBORN_VOICE_MANIFEST.json'),JSON.stringify(testManifest));
  const build=()=>spawnSync(process.execPath,['build-reborn.mjs'],{cwd:temp,encoding:'utf8'});
  save();const changed=Buffer.from(bytes);changed[changed.length-1]^=1;fs.writeFileSync(file,changed);
  let result=build();assert.notEqual(result.status,0);assert.match(result.stderr,/unverified or modified/);
  fs.writeFileSync(file,bytes);row.license.redistributionAllowed=false;save();result=build();assert.notEqual(result.status,0);assert.match(result.stderr,/redistribution metadata/);
  fs.unlinkSync(file);save();result=build();assert.equal(result.status,0,result.stderr);
  const html=fs.readFileSync(path.join(temp,'EnglishQuest_REBORN.html'),'utf8'),built=JSON.parse(html.match(/const RebornVoiceManifest=(.*);\n/)[1]);assert.equal(built.utterances[0].available,false);assert.equal(built.utterances[0].embedded,null);
 }finally{
  const target=path.resolve(temp),allowed=path.resolve(os.tmpdir())+path.sep;
  assert.ok(target.startsWith(allowed)&&path.basename(target).startsWith('reborn-piper-build-'),'cleanup must stay inside the named temporary build directory');
  fs.rmSync(target,{recursive:true,force:true});
 }
});
