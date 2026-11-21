const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url'),crypto=require('node:crypto');
const {play}=require('./reborn-battlefield-browser.cjs');
const channel=process.env.REBORN_BROWSER||'chrome',out=path.resolve('docs/reborn-phase6'),url=pathToFileURL(path.resolve('EnglishQuest_REBORN_INTEGRATED.html')).href;
const click=(p,a)=>p.locator('[data-act="'+a+'"]:visible').first().click();
const state=p=>p.evaluate(()=>IntegratedWorld.state);
async function solve(p,f,muted=false){const h=await f.evaluate(()=>RebornApp.game.state.challenge);if(!h)return;if(h.phase==='feedback'){await f.locator('[data-action="proceed"]:visible').click();return;}if(muted)await f.locator('[data-action="korean"]').click();else await f.waitForFunction(()=>RebornApp.game.state.challenge?.heard,null,{timeout:6000});if(h.kind==='magic'){for(const w of ['I','need','fire'])await f.locator('[data-action="word"][data-word="'+w+'"]').click();await f.locator('[data-action="cast"]').click();}else if(h.kind==='action')await f.locator('[data-action="proceed"]:visible').click();else await f.locator('[data-action="answer"][data-answer="'+h.target+'"]').click();}
async function perfect(p,f){const deadline=Date.now()+45000;while(Date.now()<deadline){const s=await f.evaluate(()=>RebornApp.game.state);if(s.stats.combat.perfectDodges)return;if(s.challenge){await solve(p,f);continue;}assert.notEqual(s.mode,'DEFEAT');if(Math.abs(s.enemy.x-s.player.x)>180&&['IDLE','APPROACH'].includes(s.enemy.ai)){await p.keyboard.down('d');await p.waitForTimeout(120);await p.keyboard.up('d');continue;}
 await f.waitForFunction(()=>{const s=RebornApp.game.state,e=s.enemy;return s.challenge||s.mode==='DEFEAT'||e.ai==='ATTACK'&&e.pattern==='jump'&&e.attackProgress>=.89&&Math.abs(e.attackTargetX-s.player.x)<14&&s.player.dodgeCooldown===0;},null,{timeout:18000,polling:'raf'});if((await f.evaluate(()=>RebornApp.game.state)).challenge)continue;await p.keyboard.press('k');await p.waitForTimeout(200);
 }throw Error('Perfect dodge not observed');}
async function enter(p){await click(p,'world-rowan');if(await p.locator('[data-act="world-accept"]').count())await click(p,'world-accept');await click(p,'world-enter');await p.waitForFunction(()=>document.querySelector('#world-frame')?.contentWindow.IntegratedCombat);const f=p.frames().find(f=>f.parentFrame());return f;}
async function win(p,f,{muted=false}={}){
 const proxy=new Proxy(f,{get:(t,k)=>k==='keyboard'?p.keyboard:k==='waitForTimeout'?p.waitForTimeout.bind(p):typeof t[k]==='function'?t[k].bind(t):t[k]});
 // Use sentence magic through controls while the enemy is alive; actor handles the rest.
 for(let n=0;n<150;n++){const s=await f.evaluate(()=>RebornApp.game.state);if(s.challenge?.expressionId==='fire')break;if(s.mode==='PAUSED'){await f.locator('[data-action="resume"]').click();continue;}if(s.challenge){await solve(p,f,muted);continue;}if(s.mode==='COMBAT')await f.locator('[data-action="magic"]').click();await p.waitForTimeout(60);}assert.equal(await f.evaluate(()=>RebornApp.game.state.challenge?.expressionId),'fire');
 if(muted)await f.locator('[data-action="korean"]').click();else await f.waitForFunction(()=>RebornApp.game.state.challenge?.heard,null,{timeout:6000});
 for(const w of ['I','need','fire'])await f.locator('[data-action="word"][data-word="'+w+'"]').click();await f.locator('[data-action="cast"]').click();await f.locator('[data-action="proceed"]:visible').click();
 const result=await play(proxy,{muted});assert.equal(result.mode,'VICTORY');assert.ok(result.stats.combat.magicHits>0);return result;
}
(async()=>{await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({channel,headless:true});try{
 const context=await browser.newContext({viewport:{width:1366,height:900}});await context.setOffline(true);const p=await context.newPage(),errors=[],requests=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await p.goto(url);await click(p,'new');await click(p,'intro-skip');await click(p,'class-confirm');
 assert.equal((await state(p)).screen,'MAP');const initial=(await state(p)).save.profile;
 await p.screenshot({path:path.join(out,channel+'-map.png'),fullPage:true});
 let f=await enter(p);assert.ok((await state(p)).lifecycle.contexts.every(x=>x!=='running'));assert.equal((await state(p)).lifecycle.frames,0);assert.equal(await f.evaluate(()=>IntegratedCombat.lifecycle.frames),1);await perfect(p,f);
 const result=await win(p,f);await p.waitForTimeout(850);await p.screenshot({path:path.join(out,channel+'-victory.png'),fullPage:true});
 await p.evaluate(()=>window.qaPreviousCombat=document.querySelector('#world-frame').contentWindow.IntegratedCombat);await p.locator('#world-return').click();await p.waitForFunction(()=>IntegratedWorld.state.screen==='MAP');let after=await state(p);assert.equal(after.screen,'MAP');assert.equal(after.save.extension.quest,'ready');assert.equal(after.save.profile.xp,initial.xp);assert.equal(after.save.profile.gold,initial.gold);assert.equal(p.frames().length,1);assert.deepEqual(await p.evaluate(()=>({stopped:qaPreviousCombat.lifecycle.stopped,frames:qaPreviousCombat.lifecycle.frames})),{stopped:true,frames:0});
 await click(p,'world-rowan');await click(p,'world-ack');assert.equal((await state(p)).save.extension.recognition,true);
 await click(p,'world-map');await p.reload();await click(p,'continue');assert.equal((await state(p)).save.extension.quest,'complete');
 f=await enter(p);await p.locator('#world-cancel').click();await p.waitForFunction(()=>IntegratedWorld.state.screen==='MAP');assert.equal((await state(p)).save.extension.quest,'complete');
 f=await enter(p);await p.reload();assert.equal((await state(p)).screen,'MAP');assert.equal((await state(p)).save.extension.active,null);
 await click(p,'world-records');assert.ok(await p.locator('[data-act="world-review"]').count());await p.screenshot({path:path.join(out,channel+'-records.png'),fullPage:true});
 await click(p,'world-review');await p.waitForTimeout(3000);assert.ok(Object.values((await state(p)).save.extension.records).some(r=>r.reviews>0));
 await click(p,'world-map');await click(p,'academy-enter');await click(p,'academy-progress');assert.ok(await p.locator('[data-act="world-review"]').count());await click(p,'academy-exit');
 // Real defeat, then restart in the same integration session; no campaign penalty.
 f=await enter(p);const defeatDeadline=Date.now()+120000;while(Date.now()<defeatDeadline){const s=await f.evaluate(()=>RebornApp.game.state);if(s.mode==='DEFEAT')break;if(s.challenge)await solve(p,f);else await p.waitForTimeout(500);}assert.equal(await f.evaluate(()=>RebornApp.game.state.mode),'DEFEAT');
 await f.locator('[data-action="restart"]:visible').click();assert.equal(await f.evaluate(()=>RebornApp.game.state.player.hp),100);
 await f.locator('details.settings>summary').click();await f.locator('#muted').check();const mutedResult=await win(p,f,{muted:true});await p.locator('#world-return').click();await p.waitForFunction(()=>IntegratedWorld.state.screen==='MAP');
 assert.equal((await state(p)).save.extension.recognition,true);assert.ok((await state(p)).save.extension.runs.at(-1).assisted>0);assert.equal((await state(p)).save.profile.gold,initial.gold);
 // Integrated backup uses visible download/upload controls and explicit confirmation.
 await click(p,'world-backup');const downloadPromise=p.waitForEvent('download');await click(p,'world-export');const download=await downloadPromise;const backupPath=path.join(out,channel+'-backup.json');await download.saveAs(backupPath);const saved=(await state(p)).save;
 await p.locator('#world-import').setInputFiles(backupPath);await click(p,'world-import-confirm');assert.deepEqual((await state(p)).save.extension,saved.extension);
 // Existing v0.8 profile import retains Academy schedules and resets only integration data.
 await p.locator('#world-import').setInputFiles({name:'campaign.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(initial))});await click(p,'world-import-confirm');assert.equal((await state(p)).save.extension.quest,'new');assert.deepEqual((await state(p)).save.profile.academy,initial.academy);
 await click(p,'world-home');await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(out,channel+'-mobile-map.png'),fullPage:true});f=await enter(p);await f.locator('[data-action="pause"]').click();assert.equal(await f.evaluate(()=>RebornApp.game.state.mode),'PAUSED');await p.screenshot({path:path.join(out,channel+'-mobile-combat.png'),fullPage:true});await p.locator('#world-cancel').click();await p.waitForFunction(()=>IntegratedWorld.state.screen==='MAP');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const report={browser:channel,version:browser.version(),sha256:crypto.createHash('sha256').update(await fs.readFile('EnglishQuest_REBORN_INTEGRATED.html')).digest('hex'),offline:true,errors,requests,result,mutedResult,completedSave:saved,save:(await state(p)).save};await fs.writeFile(path.join(out,channel+'-integration.json'),JSON.stringify(report,null,2));console.log('PASS',channel,'campaign → perfect dodge → magic → Rowan → reload → cancel → recovery → review → defeat/retry → muted victory → backups → mobile');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
