/* Real PCM assets through the offline game UI. Native media events are observations, not listening approval. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),channel=process.env.REBORN_BROWSER||'chrome';
const samples=process.argv.includes('--samples');
const ids=['VO_HELLO','VO_MOVE_LEFT','VO_WATCH_OUT','VO_ATTACK_CRYSTAL','VO_NEED_FIRE'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const click=(p,action)=>p.locator(`[data-action="${action}"]:visible`).first().click();
(async()=>{
 const browser=await chromium.launch({channel,headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900}});await context.setOffline(true);
  await context.addInitScript(()=>{
   const NativeAudio=window.Audio;window.__piperMedia=[];
   window.Audio=function(src){const a=new NativeAudio(src),r={a,events:[]};window.__piperMedia.push(r);
    for(const event of ['playing','timeupdate','ended','pause','error'])a.addEventListener(event,()=>r.events.push({event,time:a.currentTime,rate:a.playbackRate,volume:a.volume}));return a;};
  });
  const p=await context.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await p.goto(pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href);
  await p.waitForFunction(()=>typeof RebornApp!=='undefined');
  const manifest=JSON.parse(await fs.readFile(path.join(root,'REBORN_VOICE_MANIFEST.json'),'utf8'));
  const rows=manifest.utterances.filter(x=>samples?ids.includes(x.id):true);
  assert.equal(rows.length,samples?5:34);assert.ok(rows.every(x=>x.available));
  assert.match(await p.locator('#audio-source').textContent(),new RegExp(`${rows.length} / 34`));
  await p.evaluate(()=>{localStorage.setItem('__piper_save_preservation__','existing-save-sentinel');});
  const before=await p.evaluate(()=>JSON.stringify({...localStorage}));
  async function played(id,action){
   const previous=await p.evaluate(()=>__piperMedia.length);await action();
   await p.waitForFunction(n=>__piperMedia.length>n&&__piperMedia.at(-1).a.currentTime>0.03&&__piperMedia.at(-1).events.some(e=>e.event==='playing'),previous,{timeout:7000});
   const info=await p.evaluate(id=>{const r=__piperMedia.at(-1),item=RebornVoiceManifest.utterances.find(x=>x.id===id);return{id:RebornApp.voice.currentId,matched:r.a.src===item.embedded,rate:r.a.playbackRate,pitch:r.a.preservesPitch,volume:r.a.volume,duration:r.a.duration,ducked:RebornApp.audio.diagnostics.ducked,source:RebornApp.voice.status.source};},id);
   assert.equal(info.id,id);assert.equal(info.matched,true);assert.equal(info.pitch,true);assert.equal(info.source,'asset');assert.equal(info.ducked,true);assert.ok(info.volume>0);assert.ok(info.duration>.2);
   await p.waitForFunction(()=>__piperMedia.at(-1).events.some(e=>e.event==='ended'),null,{timeout:10000});
   assert.equal(await p.evaluate(()=>RebornApp.voice.status.state),'ended');assert.equal(await p.evaluate(()=>RebornApp.audio.diagnostics.ducked),false);
   return info;
  }
  const results=[];
  await played('VO_HELLO',()=>click(p,'test-voice'));
  await p.locator('.expression-practice > summary').click();
  for(const row of rows){
   if(await p.locator('#slow').isChecked())await p.locator('#slow').uncheck();
   const normal=await played(row.id,()=>p.locator(`.expression-list [data-voice="${row.id}"]`).click());assert.equal(normal.rate,1);
   const replay=await played(row.id,()=>click(p,'voice-replay'));assert.equal(replay.rate,1);
   const slow=await played(row.id,()=>click(p,'voice-slow'));assert.equal(slow.rate,.75);
   results.push({id:row.id,normal,replay:true,slow:true});console.log(channel,row.id,'normal/replay/slow passed');
  }
  // Real sliders update active HTMLAudio volume, and explicit mute/stop interrupt it.
  await p.locator('.settings > summary').click();
  const setVolume=async(key,value)=>{const slider=p.locator(`[data-volume="${key}"]`);await slider.focus();await slider.press('Home');if(value)await slider.press('ArrowRight',{delay:0}).then(async()=>{for(let i=1;i<value;i++)await slider.press('ArrowRight');});};
  await setVolume('master',80);await setVolume('voice',50);await setVolume('music',40);
  await p.locator('#slow').check();await click(p,'test-voice');
  await p.waitForFunction(()=>RebornApp.voice.status.state==='playing');
  assert.ok(Math.abs(await p.evaluate(()=>__piperMedia.at(-1).a.volume)-.4)<1e-9);
  await p.locator('[data-volume="voice"]').focus();await p.locator('[data-volume="voice"]').press('ArrowLeft');
  assert.ok(Math.abs(await p.evaluate(()=>__piperMedia.at(-1).a.volume)-.392)<1e-9);
  await p.locator('#muted').check();assert.equal(await p.evaluate(()=>__piperMedia.at(-1).a.paused),true);
  const mutedCount=await p.evaluate(()=>__piperMedia.length);await click(p,'test-voice');assert.equal(await p.evaluate(()=>__piperMedia.length),mutedCount);assert.equal(await p.evaluate(()=>RebornApp.voice.status.state),'muted');
  await p.locator('#muted').uncheck();
  await setVolume('voice',0);await click(p,'test-voice');assert.equal(await p.evaluate(()=>RebornApp.voice.status.state),'muted');
  await setVolume('voice',85);await click(p,'test-voice');await p.waitForFunction(()=>RebornApp.voice.status.state==='playing');await click(p,'stop-voice');assert.equal(await p.evaluate(()=>__piperMedia.at(-1).a.paused),true);
  await click(p,'test-voice');await p.waitForFunction(()=>RebornApp.voice.status.state==='playing');await click(p,'voice-replay');
  assert.equal(await p.evaluate(()=>__piperMedia.at(-2).a.paused),true);
  await click(p,'stop-voice');
  // Start/restart use real UI and stop obsolete media; no campaign storage touched.
  await click(p,'start');await p.waitForTimeout(150);await click(p,'pause');
  assert.ok(await p.evaluate(()=>__piperMedia.every(r=>r.a.paused)));
  await click(p,'restart');await p.waitForTimeout(150);
  const after=await p.evaluate(()=>JSON.stringify({...localStorage}));assert.equal(after,before);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  for(const width of [1366,390,360]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await p.setViewportSize({width:1366,height:900});await p.locator('.audio-diagnostic').scrollIntoViewIfNeeded();
  await fs.mkdir(path.join(root,'docs/piper'),{recursive:true});
  const artifact=await fs.readFile(path.join(root,'EnglishQuest_REBORN.html'));
  const report={browser:channel,version:browser.version(),stage:samples?'initial-five':'full-production',count:results.length,offline:true,errors,requests,artifactSha256:hash(artifact),artifactBytes:artifact.length,results,controls:'volume/mute/zero/stop/interruption/scene cleanup passed',savePreserved:true,humanListening:'Not performed'};
  await fs.writeFile(path.join(root,`docs/piper/${channel}-${samples?'samples':'full'}.json`),JSON.stringify(report,null,2)+'\n');
  await p.screenshot({path:path.join(root,`docs/piper/${channel}-audio-panel.png`),fullPage:true});
  console.log('PASS',channel,report.stage,results.length,'offline native voice resources');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
