/* Real file:// inputs, isolated browser context, no combat/state mutation.
   NODE_PATH=<Playwright installation> node tests/reborn-browser.cjs
   REBORN_BROWSER=msedge; --screenshots writes only docs/reborn-phase2/*.png. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.REBORN_QA_OUT||'docs/reborn-phase2');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
const originalHash='E0F49C2BB74125F16828C0A1D9F5B448B0FEA1831C6AF9117290668FEDA0CBAD';
const phase1Hash='6A97F8E8E8E800D4BA32728396E6A80C606B839E59C4645F873DE89B8D0D5BC2';
const url=pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href;
const sizes=[[1920,1080],[1366,768],[768,1024],[390,844],[360,800]];
const channel=process.env.REBORN_BROWSER||'chrome';
const capture=process.argv.includes('--screenshots');
const rewardStats=x=>{const y=structuredClone(x);if(y.flow)delete y.flow.audio;return y;};
const state=p=>p.evaluate(()=>JSON.parse(JSON.stringify(RebornApp.game.state)));
const button=(p,id)=>p.locator('[data-action="'+id+'"]:visible').first();
const click=(p,id)=>button(p,id).click();
const delay=(p,ms)=>p.waitForTimeout(ms);
async function waitMode(p,mode){await p.waitForFunction(m=>RebornApp.game.state.mode===m,mode,{timeout:10000});}
async function shot(p,name){if(capture){await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});}}
async function frameReport(p){
  const samples=await p.evaluate(()=>window.__qaFrameSamples),quantile=(a,q)=>a[Math.min(a.length-1,Math.floor(a.length*q))];
  assert.ok(samples.length>=120,'enough actual combat frames for a descriptive sample');
  const frame=samples.map(x=>x.dt).sort((a,b)=>a-b),work=samples.map(x=>x.work).sort((a,b)=>a-b);
  const metrics={scope:'Headless file:// automated combat with screenshot/input overhead; descriptive sample, not a hardware FPS certification',browser:channel,samples:samples.length,frameMs:{p50:quantile(frame,.5),p95:quantile(frame,.95),max:frame.at(-1),over25:frame.filter(x=>x>25).length,over50:frame.filter(x=>x>50).length,over100:frame.filter(x=>x>100).length},callbackMs:{p50:quantile(work,.5),p95:quantile(work,.95),max:work.at(-1)},maxEffects:Math.max(...samples.map(x=>x.effects)),maxProjectiles:Math.max(...samples.map(x=>x.projectiles)),maxAudioNodes:Math.max(...samples.map(x=>x.audioNodes||0))};
  assert.ok(metrics.maxEffects<=64);assert.ok(metrics.maxProjectiles>0&&metrics.maxProjectiles<=3,'a bounded real projectile was observed');assert.ok(metrics.maxAudioNodes<=96);
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,channel+'-frame-times.json'),JSON.stringify(metrics,null,2)+'\n');console.log('actual production RAF sample',JSON.stringify(metrics));
}
async function layout(p,label){
  const saved=p.viewportSize();
  for(const [width,height] of sizes){
    await p.setViewportSize({width,height});await delay(p,100);
    const v=await p.evaluate(()=>({w:document.documentElement.scrollWidth,clipped:[...document.querySelectorAll('button,input,summary')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.left<-.5||r.right>innerWidth+.5);}).map(e=>e.textContent.trim())}));
    assert.ok(v.w<=width+1,label+' horizontal overflow at '+width);assert.deepEqual(v.clipped,[],label+' clipped controls at '+width);
    if(label==='victory'){
      await p.locator('.dialog-card').evaluate(e=>{e.scrollTop=0;});
      const card=await p.locator('.dialog-card').boundingBox(),restart=await button(p,'restart').boundingBox();
      assert.ok(restart.y>=card.y&&restart.y+restart.height<=card.y+card.height,'restart visible without result scrolling at '+width);
    }
    if(label==='listening'&&width===390)await shot(p,'reborn-mobile');
  }
  await p.setViewportSize(saved);console.log('layout',label,'five viewports passed');
}
async function keyHold(p,key,ms){await p.keyboard.down(key);await delay(p,ms);await p.keyboard.up(key);}
async function create(browser,options={}){
  const context=await browser.newContext({viewport:{width:1366,height:768},acceptDownloads:false,...options});
  await context.addInitScript(()=>{
    // Observe the production frame callback without starting another RAF loop.
    const raf=window.requestAnimationFrame.bind(window);window.__qaFrameSamples=[];let previous=null;
    window.requestAnimationFrame=function(callback){return raf(function(time){
      if(callback.name!=='frame'){callback(time);return;}
      const s=typeof RebornApp==='undefined'?null:RebornApp.game.state;
      const combat=s&&['COMBAT','PLAYER_HIT'].includes(s.mode);const begin=performance.now();callback(time);const work=performance.now()-begin;
      if(combat&&previous!==null&&window.__qaFrameSamples.length<12000)window.__qaFrameSamples.push({dt:time-previous,work,effects:s.effects?.length||0,projectiles:s.projectiles?.length||0,audioNodes:RebornApp.audio.diagnostics.activeNodes});
      previous=combat?time:null;
    });};
  });
  await context.setOffline(true);const page=await context.newPage(),errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await page.goto(url);await page.waitForFunction(()=>typeof RebornApp!=='undefined');
  return{context,page,errors,network};
}
async function solve(p,seen,wrongOnce=true){
  const s=await state(p),c=s.challenge;assert.ok(c);
  if(c.phase==='feedback'){await click(p,'proceed');return;}
  const first=!seen.has(c.expressionId);seen.add(c.expressionId);
  const before=[s.player.hp,s.enemy?.hp,s.enemy?.x];await delay(p,first?350:40);const frozen=await state(p);
  assert.deepEqual([frozen.player.hp,frozen.enemy?.hp,frozen.enemy?.x],before,'challenge must freeze combat');
  if(first){
    await click(p,'english');assert.ok((await p.locator('#hint-text').textContent()).includes(c.english));
    const aided=await state(p);assert.ok(aided.challenge.assisted,'English help must be recorded');
    if(c.expressionId==='left'){await layout(p,'listening');await shot(p,'reborn-listening');}
    if(c.kind==='magic')await shot(p,'reborn-magic');
  }
  if(first&&wrongOnce&&(c.expressionId==='left'||c.kind==='magic')){
    if(c.kind==='magic'){
      for(const w of ['I','fire','need'])await p.locator('[data-action="word"][data-word="'+w+'"]').click();
      await click(p,'cast');
    }else await p.locator('[data-action="answer"][data-answer="right"]').click();
    const wrong=await state(p);assert.equal(wrong.challenge.completed,false);assert.equal(wrong.player.hp,s.player.hp);
    const count=wrong.stats.wrong;await p.keyboard.press('j');assert.equal((await state(p)).stats.wrong,count,'feedback rapid inputs cannot submit twice');
    await click(p,'proceed');await click(p,'replay');assert.equal(await p.evaluate(()=>RebornApp.voice.currentId),c.voiceId,'retry replays instruction');
    await click(p,'english');assert.ok((await p.locator('#hint-text').textContent()).includes(c.english));
  }
  if(c.kind==='magic'){
    for(const w of ['I','need','fire'])await p.locator('[data-action="word"][data-word="'+w+'"]').click();
    await click(p,'cast');
  }else if(c.expressionId==='left')await p.keyboard.press('a');
  else await p.locator('[data-action="answer"][data-answer="'+c.action+'"]').click();
  const correct=await state(p);assert.equal(correct.challenge.completed,true);assert.equal(correct.player.hp,s.player.hp);
  await click(p,'proceed');
  if(c.kind==='magic'&&s.stage==='boss'){
    const charging=await state(p);assert.equal(charging.enemy.hp,correct.enemy.hp,'successful sentence starts charge, not instant damage');assert.equal(charging.cast?.phase,'charge');assert.equal(charging.player.magicCharge,0);assert.ok(charging.player.magicCooldown>0);console.log('sentence accepted → resource consumed → visible charge before projectile damage');
  }
}
async function playthrough(p){
  const start=Date.now(),seen=new Set(),patterns=new Set(),phases=new Set(),poses=new Set();let direction=null,lastStage=null,lastAttack=0,lastDodge=0,capturedSlime=false,capturedBoss=false,capturedCharge=false,capturedCombo=false,capturedCore=false,capturedSpell=false,checkedFacing=false,damage=false;
  async function move(next){if(direction===next)return;if(direction)await p.keyboard.up(direction);direction=next;if(next)await p.keyboard.down(next);}
  for(let n=0;n<2200;n++){
    const s=await state(p);if(s.stage!==lastStage){await move(null);lastStage=s.stage;}poses.add(s.player.pose);if(s.enemy){if(s.enemy.ai==='ATTACK')patterns.add(s.enemy.pattern);phases.add(s.enemy.phase);}if(s.player.hp<100)damage=true;
    if(s.mode==='VICTORY'){
      await move(null);await delay(p,300);await shot(p,'reborn-victory');await layout(p,'victory');
      const learned=p.locator('details.practiced-expressions');assert.ok((await learned.locator('summary').textContent()).includes('6개'));await learned.locator('summary').click();
      for(const phrase of s.stats.expressions)assert.ok((await learned.locator('p').innerText()).includes(phrase));
      assert.ok((await p.locator('.dialog-card').textContent()).includes(`안내 과제: 정답 ${s.stats.listening.correct}회 · 다시 연습 ${s.stats.listening.wrong}회 · 도움 없이 응답 ${s.stats.listening.independent}회`));await learned.locator('p').scrollIntoViewIfNeeded();const learnedBox=await learned.locator('p').boundingBox(),resultBox=await p.locator('.dialog-card').boundingBox();assert.ok(learnedBox.y>=resultBox.y&&learnedBox.y+learnedBox.height<=resultBox.y+resultBox.height,'all six learned expressions can be brought into view');await shot(p,'reborn-learned');await learned.locator('summary').click();
      console.log('real input victory',JSON.stringify({elapsedSeconds:(Date.now()-start)/1000,stats:s.stats,patterns:[...patterns],phases:[...phases],poses:[...poses],damage}));assert.deepEqual([...seen].sort(),['attack','crystal','dodge','fire','left','magic']);for(const name of ['heavy_jump','forward_rush','triple_bounce','crystal_charge'])assert.ok(patterns.has(name),'observed actual boss attack '+name);assert.ok(checkedFacing);assert.ok(phases.has(2));assert.equal(s.enemy.hp,0);assert.equal(s.stats.listening.independent,0,'guided answers with text help are not independent listening');assert.equal(s.stats.combat.highestCombo,3);assert.ok(s.stats.combat.perfectDodges>0);assert.ok(s.stats.combat.weaknessHits>=1);assert.ok(s.stats.combat.magicUsed>0);assert.ok(s.stats.combat.magicHits>0);assert.equal(s.stats.combat.damageDealt,230);assert.equal(new Set(s.stats.goals).size,s.stats.goals.length);
      const values=await p.locator('.combat-stats .stat b').allTextContents();assert.deepEqual(values.map(Number),[s.stats.combat.damageReceived,s.stats.combat.successfulDodges,s.stats.combat.dodges,s.stats.combat.highestCombo,s.stats.combat.magicUsed,s.stats.combat.weaknessHits]);assert.equal(await p.locator('[data-goal="independent-listening"]').count(),0);
      const review=p.locator('details.review-expressions');await review.locator('summary').click();assert.equal(await review.locator('li').count(),s.stats.reviewExpressions.length);await review.locator('[data-action="phrase"]').first().click();assert.deepEqual(rewardStats((await state(p)).stats),rewardStats(s.stats),'review playback cannot farm results or goals');
      await click(p,'practice');assert.equal(await p.locator('.expression-practice[open] [data-action="phrase"]').count(),36);assert.deepEqual(rewardStats((await state(p)).stats),rewardStats(s.stats));await click(p,'menu');await waitMode(p,'INTRO');const reset=await state(p);assert.equal(reset.stats.goals.length,0);assert.equal(reset.projectiles.length,0);assert.equal(reset.enemy,null);console.log('measured result values, review replay, unique goals and main menu cleanup passed');return s;
    }
    assert.notEqual(s.mode,'DEFEAT','real input actor died');
    if(s.mode==='PAUSED'){await click(p,'resume');continue;}
    if(s.mode==='BOSS_INTRO'){await move(null);await shot(p,'reborn-boss-intro');if(await button(p,'proceed').isVisible())await click(p,'proceed');await delay(p,60);continue;}
    if(s.challenge){await move(null);await solve(p,seen);continue;}
    // Capturing can span a strike resolving and opening a prompt. Re-read the
    // current scene before issuing any further combat input after that await.
    if(s.player.comboIndex===3&&!capturedCombo){await shot(p,'reborn-finisher');capturedCombo=true;continue;}
    if(s.enemy?.coreExposed&&s.player.weaknessCharge&&!capturedCore){await shot(p,'reborn-exposed-core');capturedCore=true;continue;}
    if(s.cast&&!capturedSpell){await shot(p,'reborn-cast');capturedSpell=true;continue;}
    if(s.stage==='crystal'){await move(null);await shot(p,'reborn-crystal');await click(p,'proceed');continue;}
    if(s.stage==='entrance'){await move('d');await delay(p,300);continue;}
    if(s.enemy?.kind==='slime'&&!capturedSlime){await shot(p,'reborn-slime');capturedSlime=true;continue;}
    if(s.enemy?.kind==='boss'&&!capturedBoss){await shot(p,'reborn-boss');capturedBoss=true;continue;}
    const e=s.enemy,hero=s.player;
    if(e&&s.mode==='COMBAT'){
      if(e.kind==='slime'&&s.stats.combat.perfectDodges===0){
        const dist=e.x-hero.x;
        if(Math.abs(dist)>190&&['IDLE','APPROACH'].includes(e.ai)){await move(dist<0?'a':'d');await delay(p,85);continue;}
        await move(null);
        await p.waitForFunction(()=>{const s=RebornApp.game.state,e=s.enemy;return s.mode==='DEFEAT'||(e?.ai==='ATTACK'&&e.pattern==='jump'&&e.attackProgress>=.89&&Math.abs(e.attackTargetX-s.player.x)<14&&s.player.dodgeCooldown===0);},null,{timeout:18000,polling:'raf'});
        assert.notEqual((await state(p)).mode,'DEFEAT');await p.keyboard.press('k');await delay(p,200);if((await state(p)).stats.combat.perfectDodges>0){await shot(p,'reborn-perfect-dodge');console.log('actual landing contact within dodge iframe earned Perfect Dodge');}continue;
      }
      if(e.pattern==='crystal_charge'&&e.ai==='TELEGRAPH'&&!capturedCharge){await shot(p,'reborn-crystal-charge');capturedCharge=true;continue;}
      const coreReady=e.coreExposed&&hero.weaknessCharge===1;
      const canAttack=e.kind!=='boss'||coreReady||(e.phase===1?['crystal_charge','heavy_jump','forward_rush'].every(x=>patterns.has(x)):patterns.has('triple_bounce'));
      if(canAttack&&!coreReady&&s.magicUnlocked&&hero.magicCharge>=100&&hero.magicCooldown<=0){await move(null);await p.keyboard.press('l');continue;}
      const dist=e.x-hero.x,near=Math.abs(dist)<=100;
      if(near&&!checkedFacing&&e.kind==='slime'&&e.hp===70){
        await move(null);await keyHold(p,dist<0?'d':'a',25);await p.keyboard.press('j');await delay(p,110);assert.equal((await state(p)).enemy.hp,70,'sword facing away cannot hit behind');checkedFacing=true;continue;
      }
      if(e.ai==='TELEGRAPH'&&e.telegraphRemaining<.50){
        const target=e.landingTargetX??e.attackTargetX;
        const side=hero.x<target?-1:hero.x>target?1:(hero.x<500?-1:1);
        const outside=Math.abs(hero.x-target)>130;
        await move(outside?null:side<0?'a':'d');
        if(!outside&&hero.dodgeCooldown<=0&&Date.now()-lastDodge>700){await p.keyboard.press('k');lastDodge=Date.now();}
      }else if(e.ai==='ATTACK'){
        const away=hero.x<(e.landingTargetX??e.attackTargetX)?'a':'d';await move(away);
        if(Math.abs(dist)<110&&hero.dodgeCooldown<=0&&Date.now()-lastDodge>700){await p.keyboard.press('k');lastDodge=Date.now();}
      }else{
        if(!near)await move(dist<0?'a':'d');
        else{
          await move(null);
          if(hero.facing!==(dist<0?-1:1)){await keyHold(p,dist<0?'a':'d',25);if((await state(p)).player.facing!==(dist<0?-1:1)){await delay(p,40);continue;}}
          if(canAttack&&Date.now()-lastAttack>120&&(await state(p)).mode==='COMBAT'){await p.keyboard.press('j');lastAttack=Date.now();}
        }
      }
    }
    await delay(p,85);
  }
  throw Error('playthrough timed out after '+(Date.now()-start)/1000+' sec');
}
async function controls(p){
  assert.equal(await p.evaluate(()=>RebornApp.audio.unlocked),false,'no audio unlock before gesture');
  await shot(p,'reborn-title');await layout(p,'intro');
  const laptop=await p.locator('.control-pad').boundingBox();assert.ok(laptop.y+laptop.height<=768,'laptop combat controls must fit with arena');
  await click(p,'start');
  for(let i=0;i<3;i++){const s=await state(p);assert.equal(s.tutorial.index,i);await click(p,'proceed');}
  await waitMode(p,'EXPLORATION');const x=(await state(p)).player.x;await keyHold(p,'a',180);assert.ok((await state(p)).player.x<x);
  await keyHold(p,'a',350);assert.equal((await state(p)).stage,'slime','walking enters first combat');
  await keyHold(p,'a',1000);assert.equal((await state(p)).player.x,60,'left boundary');
  const hp=(await state(p)).enemy.hp;await p.keyboard.press('j');await delay(p,110);assert.equal((await state(p)).enemy.hp,hp,'out-of-range sword cannot hit');
  await p.keyboard.press('Escape');await waitMode(p,'PAUSED');const paused=await state(p);await keyHold(p,'d',300);await p.keyboard.press('j');await delay(p,300);const after=await state(p);assert.equal(after.player.x,paused.player.x);assert.equal(after.player.hp,paused.player.hp);assert.equal(after.enemy.x,paused.enemy.x);
  await p.keyboard.press('Escape');await waitMode(p,'COMBAT');
  await p.keyboard.down('d');await delay(p,120);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.keyboard.up('d');await waitMode(p,'PAUSED');await click(p,'resume');const resumed=(await state(p)).player.x;await delay(p,200);assert.equal((await state(p)).player.x,resumed,'blur releases held movement');
  await click(p,'pause');await click(p,'restart');await waitMode(p,'EXPLORATION');
  console.log('tutorial, real movement/boundary/range, pause, focus release, restart passed');
}
async function death(p){
  if((await state(p)).mode==='INTRO')await click(p,'skip');else await click(p,'restart');await keyHold(p,'d',1600);let defeated=false;const start=Date.now();
  while(Date.now()-start<100000){const s=await state(p);if(s.mode==='DEFEAT'){defeated=true;break;}await delay(p,500);}
  assert.ok(defeated,'standing in actual attacks should reach defeat');const dead=await state(p);assert.equal(dead.player.hp,0);await p.keyboard.press('j');await p.keyboard.press('k');await delay(p,150);assert.equal((await state(p)).player.hp,0);await shot(p,'reborn-defeat');
  await click(p,'restart');const fresh=await state(p);assert.equal(fresh.player.hp,100);assert.equal(fresh.stats.correct,0);assert.equal(fresh.stats.wrong,0);assert.equal(fresh.challenge,null);assert.equal(fresh.stage,'entrance');console.log('actual collision damage → defeat → clean restart passed',Math.round((Date.now()-start)/1000)+'s');
}
async function audioRender(p){
  await p.keyboard.press('Escape');
  const pipeline=await p.evaluate(async()=>{
    // Ephemeral codec probe, not an English recording or a production voice asset.
    const rate=22050,count=4410,bytes=new Uint8Array(44+count*2),v=new DataView(bytes.buffer);
    const chars=(offset,s)=>[...s].forEach((c,i)=>bytes[offset+i]=c.charCodeAt(0));
    chars(0,'RIFF');v.setUint32(4,36+count*2,true);chars(8,'WAVE');chars(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);chars(36,'data');v.setUint32(40,count*2,true);
    for(let i=0;i<count;i++)v.setInt16(44+i*2,Math.round(Math.sin(i/rate*440*Math.PI*2)*1800),true);
    let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
    const probe={utterances:[{id:'QA_TONE_NOT_VOICE',en:'Codec test tone',ko:'검사 신호',available:true,embedded:'data:audio/wav;base64,'+btoa(binary)}]};
    const heard=[],rates=[],statuses=[];let settle;
    function AudioProbe(src){const a=new Audio(src);a.addEventListener('playing',()=>rates.push(a.playbackRate));return a;}
    const voice=RebornVoice.create(probe,RebornApp.audio,{Audio:AudioProbe,onHeard:e=>heard.push(e),onStatus:s=>{statuses.push(s.state);if(['ended','error','missing'].includes(s.state))settle?.(s);}});
    const once=async slow=>{voice.configure({slow});const done=new Promise(r=>settle=r);voice.play('QA_TONE_NOT_VOICE');return await Promise.race([done,new Promise(r=>setTimeout(()=>r({state:'timeout'}),4000))]);};
    const normal=await once(false),slow=await once(true);voice.stop();return{normal:normal.state,slow:slow.state,rates,heard,statuses};
  });
  assert.equal(pipeline.normal,'ended');assert.equal(pipeline.slow,'ended');assert.deepEqual(pipeline.rates,[1,.75]);assert.equal(pipeline.heard.length,2);console.log('native HTMLAudio embedded WAV codec probe (test tone, not English voice)',JSON.stringify(pipeline));
  const peaks=await p.evaluate(async()=>{
    const Original=window.AudioContext,result={};
    try{for(const id of Object.keys(RebornAudio.presets)){
      const ctx=new OfflineAudioContext(1,44100,44100);Object.defineProperty(ctx,'resume',{value:()=>Promise.resolve()});
      window.AudioContext=function(){return ctx;};const m=RebornAudio.create({master:1,sfx:1});m.unlock();m.sfx(id);const b=await ctx.startRendering();let peak=0;for(const v of b.getChannelData(0))peak=Math.max(peak,Math.abs(v));result[id]=peak;
    }}finally{window.AudioContext=Original;}return result;
  });
  assert.ok(Object.keys(peaks).length>=20);for(const [id,peak]of Object.entries(peaks))assert.ok(peak>0&&peak<1,id+' finite non-clipping waveform');console.log('native OfflineAudioContext layered cue peaks (not speaker listening)',JSON.stringify(peaks));
}
async function musicRender(p){
  const result=await p.evaluate(async()=>{
    const original=window.AudioContext,ctx=new OfflineAudioContext(2,88200,44100),gainEvents=[],scenes=[];let contexts=0,gainIndex=0;
    const createGain=ctx.createGain.bind(ctx);ctx.createGain=function(){const g=createGain(),index=gainIndex++,set=g.gain.setTargetAtTime.bind(g.gain);Object.defineProperty(g.gain,'setTargetAtTime',{value(value,time,constant){gainEvents.push({index,value,time,constant});return set(value,time,constant);}});return g;};
    window.AudioContext=function(){contexts++;return ctx;};
    try{
      const m=RebornAudio.create({master:1,music:1,sfx:1,ui:1});m.unlock();m.setScene('exploration');m.tick();scenes.push({...m.diagnostics,time:0});
      const waits=[];for(let i=1;i<20;i++)waits.push(ctx.suspend(i/10).then(async()=>{
        if(i===4){m.setScene('combat');scenes.push({...m.diagnostics,time:ctx.currentTime});}
        if(i===11){m.setScene('boss',2);scenes.push({...m.diagnostics,time:ctx.currentTime});}
        if(i===6)m.duck(true);if(i===9)m.duck(false);m.tick();await ctx.resume();
      }));
      const buffer=await ctx.startRendering();await Promise.all(waits);const values=buffer.getChannelData(0);let peak=0,finite=true;for(const v of values){peak=Math.max(peak,Math.abs(v));if(!Number.isFinite(v))finite=false;}
      const rms=(a,b)=>{let energy=0,count=0;for(let i=Math.round(a*44100);i<Math.round(b*44100);i++){energy+=values[i]*values[i];count++;}return Math.sqrt(energy/count);};
      m.stop();return{contexts,scenes,gainEvents,peak,finite,rms:{exploration:rms(.05,.35),combat:rms(.45,1.05),boss:rms(1.2,1.95)}};
    }finally{window.AudioContext=original;}
  });
  assert.equal(result.contexts,1);assert.equal(result.finite,true);assert.ok(result.peak>0&&result.peak<1);for(const v of Object.values(result.rms))assert.ok(v>.0001);
  assert.deepEqual(result.scenes.map(x=>x.musicScene),['exploration','combat','boss']);assert.equal(result.scenes.at(-1).phase,2);
  for(const index of [4,5,6])assert.ok(result.gainEvents.some(x=>x.index===index&&x.value===1&&x.constant===.25),'native crossfade bus '+index);
  assert.ok(result.gainEvents.some(x=>x.index===2&&x.value===.16),'music ducks for voice priority');assert.ok(result.gainEvents.some(x=>x.index===2&&x.time>=.9&&x.value===1),'music gain restores');
  await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,channel+'-native-music.json'),JSON.stringify(result,null,2)+'\n');console.log('native three-state procedural music render (not speaker listening)',JSON.stringify({contexts:result.contexts,scenes:result.scenes,peak:result.peak,rms:result.rms}));
}
async function touch(browser){
  const {context,page:p,errors,network}=await create(browser,{viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  try{
    await click(p,'skip');const cdp=await context.newCDPSession(p),target=button(p,'right');await target.scrollIntoViewIfNeeded();const r=await target.boundingBox();const x=(await state(p)).player.x;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});await delay(p,300);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok((await state(p)).player.x>x,'held real touch moves player');
    await button(p,'attack').tap();await delay(p,80);assert.ok((await state(p)).player.attackCooldown>0);await delay(p,400);await button(p,'attack').tap();await delay(p,80);assert.ok((await state(p)).player.attackCooldown>0,'touch attack releases and can repeat');
    await button(p,'dodge').tap();await delay(p,40);assert.ok((await state(p)).player.dodgeCooldown>0);assert.equal(await p.evaluate(()=>RebornApp.settings.reducedMotion),true);
    await button(p,'pause').tap();await waitMode(p,'PAUSED');await shot(p,'reborn-touch');assert.deepEqual(errors,[]);assert.deepEqual(network,[]);console.log('mobile real touch move/attack/repeat/dodge/pause, reduced motion passed');
  }finally{await context.close();}
}
async function settings(p){
  await p.locator('details.settings>summary').click();
  for(const key of ['master','voice','sfx','music','ui','ambient']){const slider=p.locator('[data-volume="'+key+'"]');await slider.focus();await slider.press('Home');assert.equal(await p.evaluate(k=>RebornApp.audio.settings[k],key),0);await slider.press('End');assert.equal(await p.evaluate(k=>RebornApp.audio.settings[k],key),1);}
  await p.locator('#muted').check();await click(p,'replay');assert.equal(await p.evaluate(()=>RebornApp.voice.status.state),'muted');assert.equal(await p.evaluate(()=>RebornApp.audio.voiceVolume),0);await p.locator('#muted').uncheck();
  await p.locator('#slow').check();await p.locator('#fallback').check();assert.deepEqual(await p.evaluate(()=>({slow:RebornApp.voice.slow,fallback:RebornApp.voice.fallback})),{slow:true,fallback:true});await p.locator('#fallback').uncheck();
  await p.locator('#reduced').check();assert.equal(await p.evaluate(()=>document.body.dataset.reducedMotion),'true');for(const level of ['off','low','normal']){await p.locator('#shake').selectOption(level);assert.equal(await p.evaluate(()=>RebornApp.settings.shakeIntensity),level);}
  await click(p,'replay');
  if(await p.evaluate(()=>RebornApp.voice.availableCount>0))await p.waitForFunction(()=>['playing','ended'].includes(RebornApp.voice.status.state));
  else assert.equal(await p.evaluate(()=>RebornApp.voice.status.state),'missing');
  console.log('six native range controls, mute, slow, explicit fallback, shake and reduced motion settings passed');
}
async function originalSmoke(browser){
  const context=await browser.newContext();await context.setOffline(true);const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{await p.goto(pathToFileURL(path.join(root,'EnglishQuest.html')).href);await p.locator('[data-act="new"]').waitFor();await p.locator('[data-act="new"]').click();await p.locator('[data-act="intro-skip"]').click();
    if(await p.locator('[data-act="class-later"]').count())await p.locator('[data-act="class-later"]').click();
    await p.locator('[data-act="academy-enter"]').click();await p.waitForFunction(()=>game.screen==='ACADEMY');
    assert.equal(await p.evaluate(()=>Curriculum.activities.length),500);assert.deepEqual(errors,[]);console.log('unchanged v0.8 new game → map → 500-item academy offline smoke passed');
  }finally{await context.close();}
}
async function main(){
  const original=await fs.readFile(path.join(root,'EnglishQuest.html'));assert.equal(original.length,794176);assert.equal(hash(original),originalHash);
  const archive=await fs.readFile(path.join(root,'releases/EnglishQuest_REBORN_PHASE1.html'));assert.equal(archive.length,108727);assert.equal(hash(archive),phase1Hash);
  const bundle=await fs.readFile(path.join(root,'EnglishQuest_REBORN.html'));if(capture)await fs.mkdir(out,{recursive:true});console.log('bundle',bundle.length,hash(bundle));
  const browser=await chromium.launch({channel,headless:true});console.log(channel,browser.version());
  try{
    const {context,page,errors,network}=await create(browser);
    try{
      const slots={'EnglishQuest.v8':'{"qaSentinel":"current v08 existing bytes preserved"}','EnglishQuest.v7':'{"qaSentinel":"legacy bytes preserved"}','unrelated-setting':'keep me'};
      await page.evaluate(x=>{for(const[k,v]of Object.entries(x))localStorage.setItem(k,v);},slots);
      if(process.argv.includes('--music-only')){await click(page,'skip');await click(page,'pause');await musicRender(page);}else{
        await controls(page);await page.evaluate(()=>{window.__qaFrameSamples=[];});await playthrough(page);await frameReport(page);if(!process.argv.includes('--results-only')){await death(page);await audioRender(page);await settings(page);}
      }
      assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(slots)),slots);assert.deepEqual(errors,[]);assert.deepEqual(network,[]);console.log('all pre-existing isolated storage bytes unchanged; no uncaught errors or HTTP(S) requests');
    }catch(e){console.error('STATE',JSON.stringify(await state(page)));console.error('ERRORS',errors);await shot(page,'reborn-failure');throw e;}finally{await context.close();}
    if(!process.argv.includes('--results-only')&&!process.argv.includes('--music-only')){await touch(browser);await originalSmoke(browser);}
  }finally{await browser.close();}
  assert.equal(hash(await fs.readFile(path.join(root,'EnglishQuest.html'))),originalHash);assert.equal(hash(await fs.readFile(path.join(root,'releases/EnglishQuest_REBORN_PHASE1.html'))),phase1Hash);console.log('PASS',channel,'original v08 and archived Phase1 HTML unchanged');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
