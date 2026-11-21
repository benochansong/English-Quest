/* Touch, assisted environmental actions, and real aerial attack coverage. */
const {play,read,click}=require('./reborn-battlefield-browser.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/reborn-phase4'),channel=process.env.REBORN_BROWSER||'chrome';
(async()=>{
 const browser=await chromium.launch({channel,headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});await context.setOffline(true);const p=await context.newPage(),errors=[],requests=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  const tap=a=>p.locator(`[data-action="${a}"]:visible`).first().tap();
  await p.goto(pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href);await p.locator('[data-action="encounter"][data-enemy="golem"]').tap();
  await p.waitForFunction(()=>RebornApp.game.state.challenge?.expressionId==='blue');await tap('korean');await tap('replay');await p.waitForFunction(()=>RebornApp.voice.status.state==='ended');await tap('proceed');
  await tap('help');const paused=await read(p);assert.equal(paused.mode,'PAUSED');await p.waitForTimeout(300);assert.equal((await read(p)).enemy.aiTime,paused.enemy.aiTime);
  await p.locator('#slow').check();await tap('replay');await p.waitForFunction(()=>RebornApp.voice.status.state==='ended');assert.equal((await read(p)).flowCue.heard,true);
  await p.locator('.settings > summary').tap();await p.locator('#muted').check();assert.equal((await read(p)).flowCue.heard,false);await p.locator('#muted').uncheck();await p.locator('#slow').uncheck();await tap('replay');await p.waitForFunction(()=>RebornApp.voice.status.state==='ended');await tap('resume');
  await p.waitForFunction(()=>RebornApp.game.state.enemy.objects[1].ready,null,{timeout:12000});await tap('interact');assert.equal((await read(p)).stats.battlefield.wrongCrystals,1);
  const right=p.locator('[data-action="right"]');await right.scrollIntoViewIfNeeded();const box=await right.boundingBox(),cdp=await context.newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await p.waitForTimeout(1150);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.ok(Math.abs((await read(p)).player.x-420)<76);await tap('interact');assert.equal((await read(p)).stats.battlefield.shieldBreaks,1);assert.equal((await read(p)).learning.blue.independent,0);assert.equal((await read(p)).learning.blue.lastResult,'assisted');
  await p.waitForFunction(()=>RebornApp.game.state.challenge?.heard);await p.locator('[data-action="answer"][data-answer="attack"]').tap();await tap('proceed');await tap('pause');
  const frozen=(await read(p)).enemy.coreRemaining;await p.waitForTimeout(300);assert.equal((await read(p)).enemy.coreRemaining,frozen);
  await tap('restart');await p.waitForTimeout(200);assert.equal((await read(p)).challenge,null);assert.equal((await read(p)).flowCue.expressionId,'blue');assert.equal((await read(p)).stats.battlefield.shieldBreaks,0);assert.equal((await read(p)).enemy.hp,170);
  await tap('help');await p.setViewportSize({width:360,height:800});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const control=await p.locator('#interact-control').boundingBox();assert.ok(control.width>=44&&control.height>=44);await p.screenshot({path:path.join(out,`${channel}-touch-help.png`),fullPage:true});
  await context.close();
  const aerial=await browser.newContext({viewport:{width:1366,height:900}});await aerial.setOffline(true);const r=await aerial.newPage();r.on('pageerror',e=>errors.push(e.message));r.on('request',req=>{if(/^https?:/.test(req.url()))requests.push(req.url());});await r.goto(pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href);await r.locator('[data-action="encounter"][data-enemy="raven"]').click();
  const states=new Set();let feathers=false;
  for(let i=0;i<1200;i++){
   const s=await read(r);states.add(s.enemy.ai);assert.notEqual(s.mode,'DEFEAT');
   if(s.challenge){if(s.challenge.phase==='feedback')await click(r,'proceed');else{await r.waitForFunction(()=>RebornApp.game.state.challenge?.heard);if(s.challenge.kind==='action')await click(r,'proceed');else await r.locator(`[data-action="answer"][data-answer="${s.challenge.target}"]`).click();}continue;}
   if(s.enemy.ai==='FEATHER_BURST'&&s.enemy.hazards.length){feathers=true;await r.screenshot({path:path.join(out,`${channel}-raven-feathers.png`),fullPage:true});break;}
   if(s.enemy.ai==='SWEEP_ATTACK'&&Math.abs(s.enemy.x-s.player.x)<150&&s.player.dodgeCooldown===0)await r.keyboard.press('k');
   await r.waitForTimeout(50);
  }
  assert.ok(feathers);for(const ai of ['DIVE_ATTACK','SWEEP_ATTACK','FEATHER_BURST'])assert.ok(states.has(ai));const result=await play(r);assert.equal(result.mode,'VICTORY');
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);await fs.writeFile(path.join(out,`${channel}-field-controls.json`),JSON.stringify({browser:channel,version:browser.version(),touch:true,assistedBlue:true,muteInvalidation:true,safePause:true,rangeAndWrongSelection:true,repeatLessonSkipped:true,aerialStates:[...states],finalCombat:result.stats.combat,errors,requests},null,2)+'\n');
  console.log('PASS',channel,'touch environment, help/replay/mute/pause/restart, all three aerial attacks then real victory');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
