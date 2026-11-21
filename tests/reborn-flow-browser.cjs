/* Read-only state-guided actor; all gameplay changes use real keys/buttons. */
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),channel=process.env.REBORN_BROWSER||'chrome',baseline=process.argv.includes('--baseline');
const out=path.join(root,process.env.REBORN_QA_OUT||'docs/reborn-phase3');
const file=path.join(root,baseline?'.phase3-baseline/EnglishQuest_REBORN.html':'EnglishQuest_REBORN.html');
const state=p=>p.evaluate(()=>JSON.parse(JSON.stringify(RebornApp.game.state)));
const click=(p,a)=>p.locator(`[data-action="${a}"]:visible`).first().click();
async function journey(p){
 let held=null,lastAttack=0,lastStage=null;const started=Date.now();
 async function move(key){if(held===key)return;if(held)await p.keyboard.up(held);held=key;if(key)await p.keyboard.down(key);}
 for(let n=0;n<4000;n++){
  const s=await state(p),e=s.enemy,h=s.challenge,c=s.flowCue;
  if(s.stage!==lastStage){await move(null);lastStage=s.stage;}
  if(s.mode==='VICTORY'){await move(null);return{elapsedSeconds:(Date.now()-started)/1000,stats:s.stats,learning:s.learning||null,measure:await p.evaluate(()=>__flowMeasure)};}
  if(s.mode==='DEFEAT')throw Error('Actor defeated '+JSON.stringify({hp:s.player.hp,stats:s.stats,learning:s.learning}));
  if(h){
   await move(null);
   if(h.phase==='feedback'){await click(p,'proceed');await p.waitForTimeout(100);continue;}
   await p.waitForFunction(()=>RebornApp.game.state.challenge?.heard,null,{timeout:5000});
   await p.waitForTimeout(1300); // actually allow the short normal-speed sentence to finish
   if(h.kind==='magic'){for(const word of ['I','need','fire'])await p.locator(`[data-action="word"][data-word="${word}"]`).click();await click(p,'cast');}
   else await p.locator(`[data-action="answer"][data-answer="${h.target}"]`).click();
   await p.waitForTimeout(100);await click(p,'proceed');await p.waitForTimeout(100);continue;
  }
  if(s.mode==='BOSS_INTRO'){await move(null);if(!s.bossIntro?.automatic)await click(p,'proceed');await p.waitForTimeout(100);continue;}
  if(s.stage==='crystal'){await move(null);await click(p,'proceed');await p.waitForTimeout(100);continue;}
  if(s.mode==='EXPLORATION'&&!e){await move('d');await p.waitForTimeout(100);continue;}
  if(s.mode==='PAUSED'){await click(p,'resume');held=null;continue;}
  if(!e){await p.waitForTimeout(100);continue;}
  const dist=e.x-s.player.x;
  if(c?.expressionId==='dodge'&&!c.heard){await move(null);await p.waitForTimeout(60);continue;}
  if(e.ai==='TELEGRAPH'||e.ai==='ATTACK'){
   const safeX=e.landingTargetX??e.attackTargetX;
   // Move away from the locked warning; stop once well clear so we don't stay pinned to an edge.
   const away=e.x>=s.player.x?'a':'d';
   if(Math.abs(s.player.x-safeX)<175)await move(away);else await move(null);
   if(e.ai==='ATTACK'&&Math.abs(dist)<100&&s.player.dodgeCooldown===0)await p.keyboard.press('k');
   await p.waitForTimeout(80);continue;
  }
  if(c?.expressionId==='crystal'&&!c.heard){await move(null);await p.waitForTimeout(60);continue;}
  const coreReady=e.coreExposed&&s.player.weaknessCharge===1;
  const needCore=e.kind==='boss'&&s.stats.combat.weaknessHits<1;
  if(needCore&&!coreReady){
   // Hold a playable distance while waiting for the same real first crystal opening in both builds.
   if(Math.abs(dist)>160)await move(dist>0?'d':'a');else await move(null);
   await p.waitForTimeout(100);continue;
  }
  if(e.kind==='boss'&&!coreReady&&s.magicUnlocked&&s.player.magicCharge>=100&&s.player.magicCooldown===0&&s.stats.combat.magicHits<2){
   await move(null);await p.keyboard.press('l');await p.waitForTimeout(120);continue;
  }
  if(s.cast){await move(null);await p.waitForTimeout(100);continue;}
  if(Math.abs(dist)>85){await move(dist>0?'d':'a');await p.waitForTimeout(100);continue;}
  await move(null);
  if(s.player.facing!==(dist>0?1:-1)){await p.keyboard.down(dist>0?'d':'a');await p.waitForTimeout(50);await p.keyboard.up(dist>0?'d':'a');}
  if(Date.now()-lastAttack>530&&s.player.attackCooldown===0&&(await state(p)).mode==='COMBAT'){
   await p.keyboard.press('j');lastAttack=Date.now();await p.waitForTimeout(250);
  }
  await p.waitForTimeout(80);
 }
 throw Error('journey timeout '+JSON.stringify(await state(p)));
}
(async()=>{
 const browser=await chromium.launch({channel,headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:768}});await context.setOffline(true);
  await context.addInitScript(()=>{
   const raf=requestAnimationFrame.bind(window);window.__flowMeasure={screens:0,forcedMs:0,arrangements:0,ids:[],audio:[]};let previous=0,lastForced=false;
   window.requestAnimationFrame=fn=>raf(function(t){fn(t);if(fn.name!=='frame'||typeof RebornApp==='undefined')return;const s=RebornApp.game.state,m=__flowMeasure,h=s.challenge,forced=['LISTENING_CHALLENGE','MAGIC_CHALLENGE'].includes(s.mode);
    if(lastForced&&forced&&previous)m.forcedMs+=Math.min(150,t-previous);if(h&&!m.ids.includes(h.id)){m.ids.push(h.id);m.screens++;if(h.kind==='magic')m.arrangements++;}previous=t;lastForced=forced;
   });
   const NativeAudio=Audio;window.Audio=function(src){const a=new NativeAudio(src);for(const type of ['playing','ended','pause','error'])a.addEventListener(type,()=>{const m=__flowMeasure;if(m.audio.length<600)m.audio.push({type,time:a.currentTime,at:performance.now()});});return a;};
  });
  const p=await context.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await p.goto(pathToFileURL(file).href);await p.evaluate(()=>localStorage.setItem('EnglishQuest.v8','unchanged-flow-sentinel'));
  const runs=[];
  for(let run=0;run<(baseline?1:3);run++){
   if(run===0)await click(p,'skip');else await click(p,'restart');
   const before=await p.evaluate(()=>({screens:__flowMeasure.screens,forcedMs:__flowMeasure.forcedMs,arrangements:__flowMeasure.arrangements}));
   const result=await journey(p);result.measure={screens:result.measure.screens-before.screens,forcedSeconds:Number(((result.measure.forcedMs-before.forcedMs)/1000).toFixed(3)),arrangements:result.measure.arrangements-before.arrangements};runs.push(result);
   console.log(channel,baseline?'baseline':'flow','run',run+1,JSON.stringify({measure:result.measure,actions:result.stats.flow?.outcomes,learning:result.learning,damage:result.stats.combat.damageDealt}));
   assert.equal(result.stats.combat.damageDealt,230);assert.ok(result.stats.combat.weaknessHits>=1);assert.ok(result.stats.combat.magicHits>=1);
  }
  if(!baseline){assert.ok(runs[2].measure.screens<runs[0].measure.screens,'real learned run has fewer mandatory screens');assert.ok(runs[2].measure.arrangements<runs[0].measure.arrangements);assert.ok(runs.some(r=>r.stats.flow.independentActions>0));
   await p.locator('.dialog-card').screenshot({path:path.join(out,`${channel}-results.png`)});
   await p.locator('.flow-review').first().locator('summary').click();await p.locator('.flow-review').first().scrollIntoViewIfNeeded();
   await p.locator('.dialog-card').screenshot({path:path.join(out,`${channel}-expression-results.png`)});
   for(const width of [1920,1366,768,390,360]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
   await p.setViewportSize({width:1366,height:768});await click(p,'restart');
   await p.keyboard.down('d');await p.waitForTimeout(1400);await p.keyboard.up('d');
   await p.waitForFunction(()=>RebornApp.game.state.flowCue?.expressionId==='dodge',null,{timeout:12000});
   await p.locator('#flow-banner').waitFor({state:'visible'});
   await p.screenshot({path:path.join(out,`${channel}-live-cue.png`),fullPage:true});
   await click(p,'help');const paused=await state(p);assert.equal(paused.mode,'PAUSED');assert.equal(paused.flowCue.assisted,true);
   await p.waitForTimeout(350);assert.equal((await state(p)).enemy.telegraphRemaining,paused.enemy.telegraphRemaining);assert.equal((await state(p)).flowCue.age,paused.flowCue.age);
   await p.locator('#slow').check();await click(p,'replay');await p.waitForFunction(()=>RebornApp.voice.status.state==='ended');assert.equal((await state(p)).flowCue.heard,true);
   assert.ok((await p.locator('#hint-text').textContent()).includes('Watch out!'));
   await p.locator('.settings > summary').click();await p.locator('#muted').check();assert.equal((await state(p)).flowCue.heard,false);await click(p,'replay');assert.equal(await p.evaluate(()=>RebornApp.voice.status.state),'muted');
   await p.locator('#muted').uncheck();await p.locator('#slow').uncheck();await click(p,'replay');await p.waitForFunction(()=>RebornApp.voice.status.state==='ended');await click(p,'resume');
   assert.equal((await state(p)).flowCue.id,paused.flowCue.id);assert.equal((await state(p)).flowCue.assisted,true);
  }
  assert.equal(await p.evaluate(()=>localStorage.getItem('EnglishQuest.v8')),'unchanged-flow-sentinel');assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const bytes=await fs.readFile(file);const report={browser:channel,version:browser.version(),baseline,artifactSha256:createHash('sha256').update(bytes).digest('hex'),offline:true,runs,errors,requests};
  await fs.writeFile(path.join(out,`${channel}-${baseline?'baseline':'flow'}.json`),JSON.stringify(report,null,2)+'\n');console.log('PASS',channel,baseline?'baseline':'three real learning runs');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
