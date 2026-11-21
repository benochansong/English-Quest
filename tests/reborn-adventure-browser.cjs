/* Complete offline journeys with real input. No writes to gameplay state. */
const {play,read,click}=require('./reborn-battlefield-browser.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.REBORN_QA_OUT||'docs/reborn-phase4'),channel=process.env.REBORN_BROWSER||'chrome',muted=process.argv.includes('--muted');
(async()=>{
 const browser=await chromium.launch({channel,headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900}});await context.setOffline(true);const p=await context.newPage(),errors=[],requests=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await p.goto(pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href);await p.evaluate(()=>localStorage.setItem('EnglishQuest.v8','phase4-original-save-sentinel'));
  if(muted){await p.locator('.settings > summary').click();await p.locator('#muted').check();await p.locator('.settings > summary').click();}
  const runs=[];
  for(let run=0;run<(muted?1:2);run++){
   await click(p,run?'restart':'story');const reports=[],captures=new Set();
   for(const kind of ['slime','raven','golem']){
    await p.waitForFunction(k=>RebornApp.game.state.stage===k,kind);
    const result=await play(p,{muted,observe:async s=>{
     if(!muted&&run===0&&s.mode==='COMBAT'&&!s.challenge&&!captures.has(s.stage)){
      captures.add(s.stage);await p.screenshot({path:path.join(out,`${channel}-${s.stage}-gameplay.png`),fullPage:true});
     }
    }});reports.push(result);
    assert.equal(result.kind,kind);assert.equal(result.report.stats.combat.damageDealt,{slime:70,raven:110,golem:170}[kind]);
    if(kind!=='golem'){assert.equal(result.mode,'ENCOUNTER_CLEAR');await click(p,'advance');}
    else assert.equal(result.mode,'VICTORY');
   }
   const s=await read(p);assert.equal(s.adventure.history.length,3);assert.equal(s.stats.combat.damageDealt,350);assert.ok(s.stats.battlefield.groundings>=1);assert.ok(s.stats.battlefield.shieldBreaks>=1);assert.ok(s.stats.combat.magicHits>=1);
   if(muted)assert.equal(s.stats.flow.independentActions,0);else{assert.ok(s.learning.wind.actual>=1);assert.ok(s.learning.blue.actual>=1);}
   runs.push({reports,history:s.adventure.history,learning:s.learning,stats:s.stats});
   console.log(channel,muted?'muted':'audible','journey',run+1,JSON.stringify(s.adventure.history.map(x=>({kind:x.kind,duration:x.durationSeconds,metrics:x.metrics}))));
  }
  if(!muted){assert.ok(runs[1].stats.flow.forcedScreens<runs[0].stats.flow.forcedScreens);assert.equal(runs[1].learning.wind.stage,'familiar');}
  for(const width of [1920,1366,768,390,360]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await p.setViewportSize({width:1366,height:900});await p.screenshot({path:path.join(out,`${channel}-${muted?'muted-':''}journey-victory.png`),fullPage:true});
  assert.equal(await p.evaluate(()=>localStorage.getItem('EnglishQuest.v8')),'phase4-original-save-sentinel');assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const hash=crypto.createHash('sha256').update(await fs.readFile(path.join(root,'EnglishQuest_REBORN.html'))).digest('hex');
  await fs.writeFile(path.join(out,`${channel}-${muted?'muted-':''}journey.json`),JSON.stringify({browser:channel,version:browser.version(),hash,offline:true,muted,errors,requests,runs},null,2)+'\n');console.log('PASS',channel,muted?'muted journey':'two complete journeys');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
