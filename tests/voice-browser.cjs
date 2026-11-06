/* Offline file UI regression. Recognition and optional local TTS are test doubles;
   no physical device is requested and no speech service is contacted. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {checkLayout,createOfflinePage,enterStage,ctl,click,wait,visible,rapidClick,profile,encounter,continueSaved} = require('./browser.cjs');
const pictures = process.argv.includes('--screenshots') ? path.resolve(__dirname,'../docs/screenshots') : null;

function installVoiceDoubles({recognition,output}) {
  const lab = window.voiceQa = {sessions:[],utterances:[],captureRequests:0,permissionRequests:0};
  function set(name,value){Object.defineProperty(window,name,{configurable:true,value});}
  class Recognizer {
    start() {
      lab.permissionRequests++;
      const handlers = {};
      for (const type of ['start','audiostart','speechstart','speechend','audioend','error','result','end']) {
        handlers[type] = this['on'+type];
      }
      lab.sessions.push({instance:this,handlers});
    }
    abort(){this.aborted=true;}
    stop(){this.stopped=true;}
  }
  set('SpeechRecognition',recognition ? Recognizer : undefined);
  set('webkitSpeechRecognition',undefined);
  if(navigator.mediaDevices) Object.defineProperty(navigator.mediaDevices,'getUserMedia',{
    configurable:true,value:()=>{lab.captureRequests++;return Promise.reject(new Error('QA prohibits real capture'));}
  });
  const voices = [{lang:'en-US',name:'Offline QA English',localService:true}];
  set('SpeechSynthesisUtterance',class {constructor(text){this.text=text;}});
  set('speechSynthesis',output ? Object.assign(new EventTarget(),{
    getVoices:()=>voices,
    speak(utterance){lab.utterances.push({text:utterance.text,rate:utterance.rate,volume:utterance.volume});
      lab.playing=utterance;if(!lab.silentOutput)utterance.onstart?.();},
    cancel(){const previous=lab.playing;lab.playing=null;previous?.onend?.();}
  }) : undefined);
}

async function loadMigrated(browser,options) {
  const session=await createOfflinePage(browser);
  const {page} = session;
  await page.addInitScript(installVoiceDoubles,options);
  const source=await fs.readFile(path.join(__dirname,'fixtures/v03-completed.json'),'utf8');
  const old=JSON.parse(source);
  await page.evaluate(raw=>localStorage.setItem('EnglishQuest.v3',raw),source);
  await page.reload();
  await continueSaved(page);
  const migrated=await profile(page);
  assert.equal(migrated.version,5);
  for(const key of ['level','hp','gold','xp','completed','chapterComplete','currentChapter','learning','mistakes','history','schedule','village']) {
    assert.deepEqual(migrated[key],old[key],'v0.3 migration lost '+key);
  }
  assert.deepEqual([...migrated.marked].sort(),[...old.marked].sort());
  for(const id of old.achievements) assert.ok(migrated.achievements.includes(id));
  for(const [key,value] of Object.entries(old.settings)) assert.equal(migrated.settings[key],value);
  assert.equal(await page.evaluate(()=>localStorage.getItem('EnglishQuest.v3')),source);
  assert.equal(await page.evaluate(()=>voiceQa.permissionRequests),0,'no recognition on boot');
  return session;
}

async function capture(page,name,width=1366,height=768) {
  if(!pictures) return;
  const previous=page.viewportSize();
  await page.setViewportSize({width,height});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.locator('.world').screenshot({path:path.join(pictures,'voice-'+name+'.png')});
  await page.setViewportSize(previous);
}

async function events(page,type,data,session=-1) {
  // Call the handlers captured at start even when the browser has since cleared
  // the live properties. This reproduces a late event queued by an old session.
  return page.evaluate(({type,data,index})=>{
    const record=voiceQa.sessions.at(index);
    if(!record) throw Error('missing mock recognition session');
    const event=type==='result'?{resultIndex:0,results:[Object.assign([{transcript:data}],{isFinal:true})]}
      : type==='error'?{error:data}:{};
    record.handlers[type]?.(event);
  },{type,data,index:session});
}
async function checkStatus(page,expected) {
  const status=page.locator('[data-mic-state]');
  await page.waitForFunction(value=>document.querySelector('[data-mic-state]')?.getAttribute('data-mic-state')===value,expected);
  assert.ok((await status.innerText()).trim(),'microphone status must include visible text');
}
async function openActivity(page,tab,index=0) {
  await click(page,'voice-tab',tab);
  const card=page.locator('[data-act=voice-lesson]').nth(index);
  await card.click();
  await click(page,'voice-begin');
}
async function goMap(page) {
  await page.reload();
  await click(page,'continue');
  await wait(page,'stage');
}

async function task(page) {
  return page.evaluate(()=>{
    const {activity,handle}=game.voice;
    return {id:activity.id,answer:activity.answer,choices:handle.choices,kind:activity.kind};
  });
}

async function answerWithoutMic(page,correct=true,preferText=false) {
  const item=await task(page), old=(await profile(page)).voice.records[item.id];
  if (!preferText && await visible(page,'voice-choice')) {
    const index=item.choices.findIndex(value=>(value===item.answer)===correct);
    assert.ok(index>=0);
    await rapidClick(page,ctl(page,'voice-choice',index));
  } else {
    if(!await page.locator('#voice-answer').isVisible()) await click(page,'voice-text');
    await page.locator('#voice-answer').fill(correct ? '  '+item.answer.toUpperCase()+'  ' : 'wrong practice response');
    await rapidClick(page,ctl(page,'voice-submit'));
  }
  const key=correct?'correct':'wrong',p=await profile(page);
  assert.equal(p.voice.records[item.id]?.[key],(old?.[key]||0)+1,'one answer should produce one learning attempt');
  return item;
}

async function openHall(page) {
  if(await visible(page,'voice-tab')) return;
  if(await visible(page,'voice-exit')){
    await click(page,'voice-exit');
    if(await visible(page,'voice-tab'))return;
  }
  if(await visible(page,'voice-hall')){
    await click(page,'voice-hall');await wait(page,'voice-tab');return;
  }
  await goMap(page);
  await click(page,'voice-hall');
  await wait(page,'voice-tab');
}

async function practiceAndDaily(page) {
  await openHall(page);
  await checkLayout(page,'voice-hall');
  await capture(page,'hall');
  await openActivity(page,'speak');
  assert.equal(await page.evaluate(()=>voiceQa.permissionRequests),0);
  await checkLayout(page,'speaking-field');
  await capture(page,'speaking-field',390,844);
  await answerWithoutMic(page,true,true);
  await openHall(page);
  await openActivity(page,'listen');
  const missed=await answerWithoutMic(page,false);
  let p=await profile(page);
  assert.ok(p.voice.records[missed.id].assistedWrong,'text listening should count as assisted');
  await goMap(page);
  await click(page,'today');
  await checkLayout(page,'daily-voice-review');
  await click(page,'daily-review',missed.id);
  if(await visible(page,'voice-begin')) await click(page,'voice-begin');
  await answerWithoutMic(page,true);
  p=await profile(page);
  const memory=p.voice.records[missed.id];
  assert.equal(memory.lastDay,memory.reviewDay);
  assert.ok(memory.dueDay>memory.lastDay);
  await goMap(page);await click(page,'today');
  assert.ok(!await visible(page,'daily-review',missed.id));
  console.log('speaking text fallback, assisted listening and daily reschedule passed');
}

async function missions(page) {
  const authored=await page.evaluate(()=>VoiceData.missions.map(m=>({id:m.id,kind:m.kind,ids:m.ids})));
  assert.ok(authored.length>=7);
  let testedBranch=false;
  for(const mission of authored){
    await openHall(page);
    await click(page,'voice-tab',mission.kind);
    await click(page,'voice-mission',mission.id);
    await click(page,'voice-begin');
    let step=0,tries=0;
    while(step<mission.ids.length && tries++<mission.ids.length+3){
      const before=await task(page);
      assert.equal(before.id,mission.ids[step]);
      const correct=testedBranch || step>0;
      await answerWithoutMic(page,correct);
      if(pictures && mission.id==='vp-cafe' && step===1) await capture(page,'cafe');
      const saved=await profile(page);
      assert.ok((await page.locator('.voice-response').innerText()).trim());
      if(correct)step++; else testedBranch=true;
      assert.equal(saved.voice.missions[mission.id]||0,step,'wrong branch advanced or right branch blocked');
      await click(page,step===mission.ids.length?'voice-exit':'voice-next');
    }
    assert.equal(step,mission.ids.length);
  }
  await goMap(page); await click(page,'dashboard');
  const text=await page.locator('body').innerText();
  assert.ok(text.includes('나의 영어 성장 기록'));
  await checkLayout(page,'voice-dashboard'); await capture(page,'growth');
  console.log('completed all '+authored.length+' authored NPC/scenario missions without recognition');
}

async function dashboardAction(page) {
  // Generate two recent, independent misses rather than relying on old or
  // assisted listening results to produce a recommendation.
  let missed;
  for (const id of ['vs-greet','vs-water']) {
    await openHall(page);await click(page,'voice-lesson',id);await click(page,'voice-begin');
    missed=await answerWithoutMic(page,false,true);
  }
  await goMap(page);await click(page,'dashboard');
  await click(page,'recommended-review');
  if(await visible(page,'voice-begin'))await click(page,'voice-begin');
  assert.equal((await task(page)).id,missed.id);
  await answerWithoutMic(page,true,true);
}

async function battleAbilities(page) {
  await goMap(page);
  await enterStage(page,3);
  for(const skill of ['voice','echo','burst']){
    const before=await encounter(page);
    await click(page,'ability',skill);
    await click(page,'voice-begin');
    await answerWithoutMic(page,true,skill==='voice');
    await wait(page,'resolve');
    const waiting=await encounter(page);
    assert.equal(waiting.enemyHp,before.enemyHp,'feedback must precede damage');
    await rapidClick(page,ctl(page,'resolve'));
    await wait(page,'ability');
    const after=await encounter(page);
    assert.equal(after.turn,before.turn+1);
    if(skill==='echo')assert.equal(after.enemyHp,before.enemyHp);
    else assert.ok(after.enemyHp<before.enemyHp);
    assert.ok(await ctl(page,'ability',skill).isDisabled(),'new skill should enter cooldown');
  }
  console.log('three voice battle commands, turn locking and cooldowns passed via offline controls');
}

async function microphone(page) {
  await openHall(page);await openActivity(page,'speak');
  await page.clock.install();
  const example=await task(page);
  async function start() {
    await click(page,'mic-start');await checkStatus(page,'requesting');
  }
  // Permission/service start is not evidence that capture is active.
  await start(); await events(page,'start');await checkStatus(page,'requesting');
  await events(page,'audiostart');await checkStatus(page,'listening');
  await events(page,'speechend');await checkStatus(page,'processing');
  await events(page,'result','PRIVATE_UTTERANCE_SENTINEL');
  await checkStatus(page,'result');
  assert.ok((await page.locator('body').innerText()).includes('PRIVATE_UTTERANCE_SENTINEL'));
  await click(page,'mic-confirm');
  assert.ok(!(await profile(page)).voice.records[example.id]?.wrong,'recognizer mismatch must permit a neutral retry');
  if(await visible(page,'mic-dispute')) await click(page,'mic-dispute');
  await start();await events(page,'error','not-allowed');await checkStatus(page,'denied');
  await start();await events(page,'error','audio-capture');await checkStatus(page,'unavailable');
  await start();await events(page,'error','no-speech');await checkStatus(page,'timeout');
  await start();await events(page,'error','network');await checkStatus(page,'unavailable');
  await start();await page.clock.fastForward(13000);await checkStatus(page,'timeout');
  await start();await events(page,'audiostart');await click(page,'mic-stop');await checkStatus(page,'ready');
  await events(page,'result','STALE_PRIVATE_RESULT');
  assert.ok(!(await page.locator('body').innerText()).includes('STALE_PRIVATE_RESULT'));
  await start();await events(page,'audiostart');await page.keyboard.press('Escape');await wait(page,'close');
  assert.ok(await page.evaluate(()=>voiceQa.sessions.at(-1).instance.aborted));
  await events(page,'result','STALE_PRIVATE_RESULT');
  await click(page,'close');
  assert.ok(!(await page.locator('body').innerText()).includes('STALE_PRIVATE_RESULT'));
  await start();await events(page,'audiostart');
  await click(page,'voice-exit'); // A queued result cannot target the hall or a newer exercise.
  const beforeExit=await profile(page);
  await events(page,'result','STALE_PRIVATE_RESULT');
  assert.deepEqual(await profile(page),beforeExit);
  await openActivity(page,'speak',1);
  const active=await task(page);
  await start();
  await events(page,'result','STALE_PRIVATE_RESULT',-2);
  await checkStatus(page,'requesting');
  assert.ok(!(await page.locator('body').innerText()).includes('STALE_PRIVATE_RESULT'));
  await events(page,'speechstart');await events(page,'result',active.answer.toUpperCase());
  await checkStatus(page,'result');await rapidClick(page,ctl(page,'mic-confirm'));
  const after=await profile(page);
  await events(page,'result',active.answer);
  assert.deepEqual(await profile(page),after);
  const data=await page.evaluate(()=>({
    raw:Object.values(localStorage).join('\n'),gum:voiceQa.captureRequests,
    lang:voiceQa.sessions.at(-1).instance.lang,aborted:voiceQa.sessions.at(-1).instance.aborted
  }));
  assert.ok(!data.raw.includes('PRIVATE_'));assert.equal(data.gum,0);
  assert.equal(data.lang,'en-US');assert.equal(data.aborted,true);
  console.log('mock recognition permission, lifecycle, timeout, success, late events and no raw storage passed');
}

async function standaloneCatalog(page) {
  for(const kind of ['speak','listen']){
    const ids=await page.evaluate(kind=>VoiceData.activities.filter(a=>a.kind===kind).map(a=>a.id),kind);
    for(const id of ids){
      await openHall(page);
      await click(page,'voice-tab',kind);
      await click(page,'voice-lesson',id);await click(page,'voice-begin');
      await answerWithoutMic(page,true,kind==='speak');
    }
  }
}

async function realPlaybackPath(page) {
  await openHall(page);await click(page,'voice-tab','listen');
  const modes=await page.evaluate(()=>['meaning','identify','respond'].map(mode=>
    VoiceData.activities.find(a=>a.kind==='listen'&&a.mode===mode).id));
  for(const [i,id] of modes.entries()){
    await click(page,'voice-tab','listen');await click(page,'voice-lesson',id);await click(page,'voice-begin');
    assert.equal(await page.locator('.audio-clue').count(),0,'working output should keep transcript hidden');
    if(i===0) await capture(page,'listening');
    if(i===1){
      await page.locator('.speech-mixer summary').click();
      await page.locator('[data-speech-volume]').press('End');
      await page.locator('[data-speech-volume]').press('ArrowLeft');
      assert.equal((await profile(page)).settings.speechVolume,.99);
    }
    await click(page,'voice-play','normal');await click(page,'voice-play','slow');
    const rates=await page.evaluate(()=>voiceQa.utterances.slice(-2).map(u=>u.rate));
    assert.ok(rates[1]>0&&rates[1]<rates[0]);
    if(i===1)assert.equal(await page.evaluate(()=>voiceQa.utterances.at(-1).volume),.99);
    if(i>0) {
      await click(page,i===1?'voice-transcript':'voice-translation');
      assert.ok(await page.locator('.audio-clue').first().isVisible());
    }
    await answerWithoutMic(page,true);
    const record=(await profile(page)).voice.records[id];
    assert.equal(record.assistedCorrect,Number(i>0));
    await click(page,'voice-next');
  }
  await page.evaluate(()=>{voiceQa.silentOutput=true;});
  await click(page,'voice-tab','listen');await click(page,'voice-lesson',modes[0]);await click(page,'voice-begin');
  await page.clock.fastForward(6000);
  assert.ok(await page.locator('.assist-notice').isVisible(),'silent native output must enable a text fallback');
  await answerWithoutMic(page,true);
  console.log('three listening modes, replay rates, hidden transcript and recorded assistance passed');
}

async function recognizedBattle(page) {
  await goMap(page);await enterStage(page,3);
  if(pictures) await page.emulateMedia({reducedMotion:'no-preference'});
  const pre=await encounter(page);
  await click(page,'ability','voice');await click(page,'voice-begin');
  await click(page,'mic-start');await events(page,'error','not-allowed');await checkStatus(page,'denied');
  let current=await encounter(page);
  assert.equal(current.hp,pre.hp);assert.equal(current.enemyHp,pre.enemyHp);assert.equal(current.turn,pre.turn);
  const {answer}=await task(page);
  await click(page,'mic-start');await events(page,'audiostart');await events(page,'result',answer);
  await rapidClick(page,ctl(page,'mic-confirm'));
  await events(page,'result',answer);
  await wait(page,'resolve');
  assert.equal((await encounter(page)).enemyHp,pre.enemyHp);
  await capture(page,'strike');
  await page.evaluate(()=>{
    const watch = new MutationObserver(()=>{
      const number=document.querySelector('.arena[data-fx=voice] .float');
      if(number){window.voiceQa.strike=number.textContent;watch.disconnect();}
    });
    watch.observe(document.querySelector('.battle'),{subtree:true,childList:true,attributes:true});
  });
  await rapidClick(page,ctl(page,'resolve'));
  await wait(page,'ability');
  current=await encounter(page);
  assert.ok(current.enemyHp<pre.enemyHp && current.turn===pre.turn+1);
  assert.equal(await page.evaluate(()=>voiceQa.strike),'−'+(pre.enemyHp-current.enemyHp));
  await events(page,'result',answer);
  assert.deepEqual(await encounter(page),current);
  console.log('denied combat microphone costs no turn, confirmed recognition resolves damage once');
}

async function linkedQuest(browser) {
  const {page,context,network,problems}=await createOfflinePage(browser,{disableSpeech:true});
  try{
    const raw=await fs.readFile(path.join(__dirname,'fixtures/v02-completed.json'),'utf8');
    await page.evaluate(source=>localStorage.setItem('EnglishQuest.chapter1.v2',source),raw);
    await page.reload();await continueSaved(page);
    await click(page,'chapters');await click(page,'chapter',2);await click(page,'destination','market');
    await click(page,'accept-quest',4);await click(page,'village-home');await click(page,'voice-hall');
    const before=await profile(page);
    await click(page,'voice-tab','conversation');
    const mission=await page.evaluate(()=>VoiceData.missions.find(m=>m.npc==='clara'&&m.kind==='conversation'));
    await click(page,'voice-mission',mission.id);await click(page,'voice-begin');
    for(let i=0;i<mission.ids.length;i++){
      await answerWithoutMic(page,true);
      await click(page,i===mission.ids.length-1?'voice-exit':'voice-next');
    }
    const end=await profile(page);
    assert.equal(end.gold,before.gold);assert.equal(end.xp,before.xp);
    assert.ok(end.village.progress[4].step>before.village.progress[4].step);
    await page.reload();await click(page,'continue');await click(page,'destination','market');
    assert.ok(await visible(page,'village-fight',4));
    await click(page,'village-home');await click(page,'voice-hall');await click(page,'voice-tab','scenario');
    await click(page,'voice-mission','vp-shop');await click(page,'voice-begin');
    const shopping=await page.evaluate(()=>VoiceData.missions.find(m=>m.id==='vp-shop'));
    for(let i=0;i<shopping.ids.length;i++){
      await answerWithoutMic(page,true);
      if(i<shopping.ids.length-1) await click(page,'voice-next');
    }
    await click(page,'voice-market');
    assert.ok(await visible(page,'purchase','potion'));
    assert.equal((await profile(page)).gold,before.gold,'practice only opens the shop; purchasing is separate');
    assert.deepEqual(network,[]);assert.deepEqual(problems,[]);
    console.log('Clara mission advances accepted village quest and unlocks crow without extra loot');
  }finally{await context.close();}
}

async function runContext(browser,options,run) {
  const {context,page,network,problems}=await loadMigrated(browser,options);
  try{
    page.on('console',message=>{if(message.type()==='error')problems.push(message.text());});
    await run(page);
    assert.deepEqual(network,[]);assert.deepEqual(problems,[]);
  }catch(error){
    console.error('Failure in',await page.evaluate(()=>({
      screen:game.screen,stage:game.voice?.stage,activity:game.voice?.activity?.id,mic:game.voice?.micState,
      buttons:[...document.querySelectorAll('button[data-act]:not(:disabled)')].map(b=>[b.dataset.act,b.dataset.id]).slice(0,22)
    })),problems);
    throw error;
  }finally{await context.close();}
}

async function main(){
  if(pictures)await fs.mkdir(pictures,{recursive:true});
  const channel=process.env.QUEST_QA_BROWSER||'chrome';
  const browser=await chromium.launch({channel,headless:true});
  try {
    console.log(channel,browser.version(),'v0.4 offline + controlled recognition UI');
    if(!process.argv.includes('--text-only')) await runContext(browser,{recognition:true,output:true},async page=>{
      await microphone(page);await realPlaybackPath(page);await recognizedBattle(page);
    });
    await linkedQuest(browser);
    await runContext(browser,{recognition:false,output:false},async page=>{
      await practiceAndDaily(page);await standaloneCatalog(page);await missions(page);await dashboardAction(page);await battleAbilities(page);
      assert.equal(await page.evaluate(()=>voiceQa.permissionRequests),0);
    });
    console.log('v0.4 UI checks complete. No website requests, uncaught errors or physical capture.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
