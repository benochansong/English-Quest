/* Offline state-reading actor: gameplay uses real keys/buttons, never injected HP/state. */
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/reborn-phase4'),channel=process.env.REBORN_BROWSER||'chrome';
const read=p=>p.evaluate(()=>JSON.parse(JSON.stringify(RebornApp.game.state)));
const click=(p,a)=>p.locator(`[data-action="${a}"]:visible`).first().click();
async function play(p,{stopAtClear=false,muted=false,observe}={}){
 let held=null,lastAttack=0;const started=Date.now(),patterns=new Set(),states=new Set(),screens=new Set();
 const move=async key=>{if(key===held)return;if(held)await p.keyboard.up(held);held=key;if(key)await p.keyboard.down(key);};
 for(let n=0;n<6000;n++){
  const s=await read(p),e=s.enemy,h=s.challenge;
  if(observe)await observe(s,p);
  if(['VICTORY','ENCOUNTER_CLEAR'].includes(s.mode)){
   await move(null);return {duration:(Date.now()-started)/1000,mode:s.mode,kind:e.kind,stats:s.stats,learning:s.learning,report:s.encounterReport,patterns:[...patterns],states:[...states],screens:[...screens]};
  }
  if(s.mode==='DEFEAT')throw Error('Actor defeated '+JSON.stringify({kind:e?.kind,stats:s.stats,ai:e?.ai}));
  if(h){
   await move(null);screens.add(h.id);
   if(h.phase==='feedback'){await click(p,'proceed');continue;}
   if(muted){await click(p,'korean');}else{await p.waitForFunction(()=>RebornApp.game.state.challenge?.heard,null,{timeout:6000});await p.waitForTimeout(h.expressionId==='blue'?1700:1300);}
   if(h.kind==='action')await click(p,'proceed');
   else if(h.kind==='magic'){for(const w of ['I','need','fire'])await p.locator(`[data-action="word"][data-word="${w}"]`).click();await click(p,'cast');}
   else await p.locator(`[data-action="answer"][data-answer="${h.target}"]`).click();
   await p.waitForTimeout(100);continue;
  }
  if(s.mode==='PAUSED'){await click(p,'resume');continue;}
  if(!e){await p.waitForTimeout(50);continue;}
  patterns.add(e.pattern);states.add(e.ai);
  if(e.ai.startsWith('TELEGRAPH')||['DIVE_ATTACK','SWEEP_ATTACK','FIST_ATTACK','GROUND_SLAM','CRYSTAL_PULSE','ATTACK'].includes(e.ai)){
   const target=e.landingTargetX??e.attackTargetX;
   const direction=target<500?'d':'a';
   if(e.pattern==='sweep'){
    await move(null);if(e.ai==='SWEEP_ATTACK'&&Math.abs(e.x-s.player.x)<155&&s.player.dodgeCooldown===0)await p.keyboard.press('k');
   }else if(Math.abs(s.player.x-target)<210)await move(direction);else await move(null);
   await p.waitForTimeout(45);continue;
  }
  if(e.kind==='raven'){
   if(e.ai==='RECOVERY'&&e.objects[0].ready){
    const dx=e.objects[0].x-s.player.x;
    if(Math.abs(dx)>45)await move(dx>0?'d':'a');else {await move(null);if(!muted&&s.flowCue&&!s.flowCue.heard){await p.waitForTimeout(60);continue;}await p.keyboard.press('e');}
    await p.waitForTimeout(70);continue;
   }
   if(e.lift>85){await move(null);if(e.ai==='FEATHER_BURST')await move(s.player.x<500?'d':'a');await p.waitForTimeout(70);continue;}
  }
  if(e.kind==='golem'&&e.shieldActive){
   const dx=420-s.player.x;if(Math.abs(dx)>40)await move(dx>0?'d':'a');else{await move(null);if(!muted&&s.flowCue?.expressionId==='blue'&&!s.flowCue.heard){await p.waitForTimeout(60);continue;}await p.keyboard.press('e');}
   await p.waitForTimeout(60);continue;
  }
  if(e.kind==='raven'&&e.ai==='GROUNDED'&&s.player.magicCharge>=100&&s.player.magicCooldown===0&&s.stats.combat.magicUsed===0){await move(null);await p.keyboard.press('l');await p.waitForTimeout(100);continue;}
  if(s.cast){await move(null);await p.waitForTimeout(60);continue;}
  const dist=e.x-s.player.x;
  if(Math.abs(dist)>78){await move(dist>0?'d':'a');await p.waitForTimeout(60);continue;}
  await move(null);
  if(s.player.facing!==(dist>0?1:-1)){await p.keyboard.down(dist>0?'d':'a');await p.waitForTimeout(30);await p.keyboard.up(dist>0?'d':'a');}
  if(Date.now()-lastAttack>360&&s.player.attackCooldown===0){await p.keyboard.press('j');lastAttack=Date.now();}
  await p.waitForTimeout(60);
 }
 throw Error('Actor timeout '+JSON.stringify(await read(p)));
}
async function main(){
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({channel,headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900}});await context.setOffline(true);const p=await context.newPage(),errors=[],requests=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await p.goto(pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href);
  const kind=process.argv.includes('--golem')?'golem':'raven';
  await p.locator(`[data-action="encounter"][data-enemy="${kind}"]`).click();
  await p.screenshot({path:path.join(out,`${channel}-${kind}-arena.png`),fullPage:true});
  const result=await play(p);assert.equal(result.mode,'VICTORY');assert.equal(result.kind,kind);
  if(kind==='raven'){assert.ok(result.stats.battlefield.groundings>=1);assert.ok(result.learning.wind.actual>=1);}
  if(kind==='golem'){assert.ok(result.stats.battlefield.shieldBreaks>=1);assert.ok(result.stats.combat.weaknessHits>=1);assert.ok(result.learning.blue.actual>=1);}
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  await p.screenshot({path:path.join(out,`${channel}-${kind}-victory.png`),fullPage:true});
  const hash=crypto.createHash('sha256').update(await fs.readFile(path.join(root,'EnglishQuest_REBORN.html'))).digest('hex');
  await fs.writeFile(path.join(out,`${channel}-${kind}-slice.json`),JSON.stringify({browser:channel,version:browser.version(),hash,offline:true,errors,requests,result},null,2)+'\n');
  console.log('PASS',channel,kind,JSON.stringify({duration:result.duration,combat:result.stats.combat,field:result.stats.battlefield,patterns:result.patterns}));
 }finally{await browser.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={play,read,click};
