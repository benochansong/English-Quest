/* Actual input listening evidence and native playback-rejection recovery. No game state mutation. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),channel=process.env.REBORN_BROWSER||'chrome';
const url=pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href;
const state=p=>p.evaluate(()=>JSON.parse(JSON.stringify(RebornApp.game.state)));
const click=(p,a)=>p.locator(`[data-action="${a}"]:visible`).first().click();
async function firstLesson(p){
 await click(p,'skip');let held=null;
 for(let n=0;n<500;n++){
  const s=await state(p);
  if(s.mode==='LISTENING_CHALLENGE'){if(held)await p.keyboard.up(held);assert.equal(s.challenge.phase,'answer',JSON.stringify(s.challenge));return s;}
  const dist=s.enemy?s.enemy.x-s.player.x:200;
  const desired=Math.abs(dist)>80?(dist>0?'d':'a'):null;
  if(held!==desired){if(held)await p.keyboard.up(held);held=desired;if(held)await p.keyboard.down(held);}
  if(s.enemy&&Math.abs(dist)<=80&&s.mode==='COMBAT'){
   if(s.player.facing!==(dist>0?1:-1)){await p.keyboard.press(dist>0?'d':'a');}
   if((await state(p)).mode==='COMBAT'){
    await p.keyboard.press('j');
    // Let this one physical swing settle before issuing any more movement/attacks.
    // A second key can otherwise answer a lesson that opened during the swing.
    await p.waitForTimeout(650);
   }
  }
  await p.waitForTimeout(100);
 }
 throw Error('Real keyboard actor did not reach first listening lesson');
}
(async()=>{
 const browser=await chromium.launch({channel,headless:true});const cases=[];
 try{
  for(const kind of ['audible','muted-text','rejected-media']){
   const context=await browser.newContext();await context.setOffline(true);
   if(kind==='rejected-media')await context.addInitScript(()=>{const NativeAudio=window.Audio;window.Audio=function(src){const a=new NativeAudio(src);a.play=()=>Promise.reject(new DOMException('Simulated browser permission denial','NotAllowedError'));return a;};});
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
   if(kind==='muted-text'){await p.locator('.settings > summary').click();await p.locator('#muted').check();}
   await firstLesson(p);
   if(kind==='audible'){
    await p.waitForFunction(()=>RebornApp.game.state.challenge.heard);
    assert.equal((await state(p)).challenge.assisted,false);assert.equal(await p.locator('#hint-text').isVisible(),false);
    assert.equal(await p.locator('#audio-expression').textContent(),'테스트 표현: Hello!','diagnostics never reveal the instruction automatically');
    await click(p,'replay');await p.waitForFunction(()=>RebornApp.voice.status.state==='ended');
    assert.equal((await state(p)).challenge.source,'asset');
   }else{
    await p.waitForFunction(()=>['muted','missing','error'].includes(RebornApp.voice.status.state));
    assert.equal((await state(p)).challenge.heard,false);await click(p,'english');assert.equal((await state(p)).challenge.assisted,true);
   }
   await p.locator('[data-action="answer"][data-answer="left"]').click();
   const s=await state(p);assert.equal(s.challenge.completed,true);assert.equal(s.stats.listening.independent,kind==='audible'?1:0);
   await click(p,'proceed');assert.ok(['COMBAT','PLAYER_HIT'].includes((await state(p)).mode),'audio failure never permanently blocks combat');assert.deepEqual(errors,[]);
   cases.push({kind,heard:s.challenge.heard,assisted:s.challenge.assisted,independent:s.stats.listening.independent,continued:true});await context.close();
  }
  await fs.writeFile(path.join(root,process.env.REBORN_QA_OUT||'docs/piper',`${channel}-learning.json`),JSON.stringify({browser:channel,version:browser.version(),cases},null,2)+'\n');console.log('PASS',channel,JSON.stringify(cases));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
