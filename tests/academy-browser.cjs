/* Offline academy UI tests. Answers are looked up in authored data, but all
   navigation, selection, word ordering, downloads and uploads use real controls. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {createOfflinePage,rapidClick,profile,checkLayout}=require('./browser.cjs');
const shots=process.argv.includes('--screenshots')?path.resolve(__dirname,'../docs/screenshots'):null;
const ctl=(page,act,id)=>page.locator('[data-act="'+act+'"]'+(id===undefined?'':'[data-id="'+id+'"]')+':not([inert] *)').first();
const click=(page,act,id)=>ctl(page,act,id).click({timeout:12000});
const visible=(page,act,id)=>ctl(page,act,id).isVisible();
const task=page=>page.evaluate(()=>JSON.parse(JSON.stringify(Academy.current(game.profile))));
const summary=page=>page.evaluate(()=>Academy.summary(game.profile,Academy.current(game.profile)));
const normalize=s=>s.toLowerCase().replace(/[‘’]/g,"'").replace(/[.!?,;:]/g,' ').replace(/\s+/g,' ').trim();

async function capture(page,id,width=1366,height=768){
  if(!shots)return;
  const old=page.viewportSize();await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:path.join(shots,'academy-'+id+'.png'),fullPage:true});await page.setViewportSize(old);
}
async function home(page){await click(page,'academy-home');await ctl(page,'academy-unit','u01').waitFor();}
async function startQuestions(page){
  if((await task(page)).phase==='preview')await ctl(page,'academy-next').press('Enter');
  assert.equal((await task(page)).phase,'question');
}
async function answer(page,right=true){
  const h=await task(page),a=h.activity;assert.equal(h.phase,'question');
  if(a.type==='order'){
    const target=normalize(a.answer).split(' '),used=[];
    for(const token of target){const index=h.choices.findIndex((word,i)=>!used.includes(i)&&normalize(word)===token);assert.ok(index>=0,'missing word '+token);used.push(index);}
    if(!right)used.reverse();
    for(const i of used)await click(page,'academy-word',i);
    await rapidClick(page,ctl(page,'academy-submit'));
  }else{
    const index=h.choices.findIndex(value=>right?value===a.answer:value!==a.answer);assert.ok(index>=0);
    await rapidClick(page,ctl(page,'academy-answer',index));
  }
  const feedback=await task(page);assert.equal(feedback.phase,'feedback');assert.equal(feedback.feedback.correct,right,a.id);
  assert.ok((await page.locator('.academy-feedback').innerText()).includes(a.explanation));
  return {before:h,after:feedback};
}
async function finish(page,{wrongFirst=false,shot=null}={}){
  const stages=new Set(),ids=[],skills=new Set();await startQuestions(page);
  const initialIndex=(await task(page)).index;
  for(let i=0;i<100&&(await task(page)).phase!=='results';i++){
    const h=await task(page);assert.equal(h.phase,'question');stages.add(h.stage);ids.push(h.activity.id);skills.add(h.activity.skill);
    if(shot&&i===0)await capture(page,shot);
    if(h.activity.type==='order'){
      const visibleEnglish=await page.locator('.academy-question [lang="en"]').allTextContents();
      assert.ok(!visibleEnglish.some(text=>normalize(text)===normalize(h.activity.answer)),'independent order question leaked the complete answer');
    }
    if(i===0&&wrongFirst){
      await answer(page,false);
      if(h.kind==='diagnostic'){await click(page,'academy-next');continue;}
      const saved=await profile(page);await click(page,'academy-retry');assert.equal((await task(page)).activity.id,h.activity.id);
      assert.deepEqual(await profile(page),saved,'retry itself altered saved learning totals');
    }
    await answer(page,true);await rapidClick(page,ctl(page,'academy-next'));
  }
  assert.equal((await task(page)).phase,'results','session failed to terminate');
  const s=await summary(page);assert.equal(s.total,ids.length+initialIndex);return {stages:[...stages],ids,skills:[...skills],summary:s};
}
async function newStudent(page){
  await click(page,'new');await click(page,'intro-skip');await click(page,'class-later');await click(page,'academy-enter');
  assert.equal(await page.evaluate(()=>game.screen),'ACADEMY');
  const p=await profile(page);assert.equal(p.academy.tier,1);assert.deepEqual(p.academy.diagnostics,[]);
  await checkLayout(page,'academy-hall');await capture(page,'hall');
  await click(page,'academy-progress');
  const text=await page.locator('.world').innerText();assert.ok(!/NaN|undefined/.test(text));assert.ok(text.includes('아직 없음'));
  await home(page);
}
async function performanceSnapshot(page){
  const data=await page.evaluate(()=>{
    const timed=fn=>{const start=performance.now();fn();return Math.round((performance.now()-start)*100)/100;};
    const navigation=performance.getEntriesByType('navigation')[0];
    return {activities:Curriculum.activities.length,loadMs:Math.round(navigation.duration*100)/100,
      selectionMs:timed(()=>Academy.select(game.profile,{mode:'mixed'})),
      dashboardMs:timed(()=>Academy.dashboard(game.profile)),hallRenderMs:timed(()=>render())};
  });console.log('single local timing snapshot (ms, not a benchmark):',JSON.stringify(data));
}
async function lessonFlow(page){
  await click(page,'academy-skip','u01');
  assert.equal((await task(page)).phase,'preview');assert.ok((await task(page)).preview.length>0);
  await checkLayout(page,'academy-preview');await capture(page,'preview');
  const first=await finish(page,{wrongFirst:true,shot:'guided'});
  assert.deepEqual(first.stages,['guided','independent','application']);
  assert.equal((await profile(page)).academy.diagnostics.length,0,'skip fabricated a placement result');
  await checkLayout(page,'academy-results');await capture(page,'results');
  await home(page);await click(page,'academy-tier',3);
  assert.equal((await profile(page)).academy.tier,3);assert.equal((await profile(page)).academy.tierMode,'manual');
  const before=await profile(page);await click(page,'academy-unit','u01');await click(page,'academy-lesson','u01');await finish(page);
  const after=await profile(page);assert.ok(after.gold-before.gold<=5);assert.equal(after.xp,before.xp);
  await home(page);await click(page,'academy-unit','u01');await click(page,'academy-lesson','u01');await finish(page);
  assert.equal((await profile(page)).gold,after.gold,'repeating a paid unit farmed gold');await home(page);
  console.log('skip, preview/guided/independent/application/results, correction, manual tier and unit reward lock passed');
}
async function modes(page){
  const allowed={vocabulary:['vocabulary'],grammar:['grammar','order'],listening:['listening'],conversation:['conversation'],mixed:['vocabulary','grammar','order','listening','conversation','reading']};
  for(const mode of Object.keys(allowed)){
    const before=await profile(page);await click(page,'academy-mode',mode);
    await startQuestions(page);
    if(mode==='vocabulary'){await click(page,'academy-hint');await click(page,'academy-translation');}
    if(mode==='listening'){
      const h=await task(page);assert.ok(h.aids.includes('fallback'));assert.ok((await page.locator('.academy-session').innerText()).includes('읽기 보조'));
      await checkLayout(page,'academy-listening-fallback');await capture(page,'listening',390,844);
    }
    const result=await finish(page,{wrongFirst:mode==='grammar'});
    assert.ok(result.skills.every(skill=>allowed[mode].includes(skill)));
    const after=await profile(page);assert.equal(after.gold,before.gold);assert.equal(after.xp,before.xp);
    if(mode==='listening')for(const id of result.ids){const r=after.academy.records[id];assert.ok(r.readingAssisted>0);assert.equal(r.audioCorrect,0);}
    await home(page);
  }
  console.log('all five practice modes, hints, text listening evidence and no practice reward farming passed');
}
async function catalog(page,minCount){
  const data=await page.evaluate(()=>({units:Curriculum.units.map(u=>u.id),activities:Curriculum.activities.map(a=>({id:a.id,unitId:a.unitId,skill:a.skill,type:a.type}))}));
  assert.ok(data.activities.length>=minCount);const rendered=[],sampled=[];
  for(const id of data.units){
    await click(page,'academy-unit',id);
    const ids=await page.locator('[data-act="academy-exact"]').evaluateAll(els=>els.map(e=>e.dataset.id));
    assert.deepEqual(ids,data.activities.filter(a=>a.unitId===id).map(a=>a.id));rendered.push(...ids);
    const candidates=data.activities.filter(a=>a.unitId===id),seen=new Set();
    for(const a of candidates){
      if(seen.has(a.skill))continue;seen.add(a.skill);await click(page,'academy-exact',a.id);
      const shot=id==='u01'&&['order','conversation'].includes(a.skill)?a.skill:null;
      const result=await finish(page,{shot});assert.deepEqual(result.ids,[a.id]);sampled.push(a.id);
      await home(page);await click(page,'academy-unit',id);
    }
    await home(page);
  }
  assert.equal(new Set(rendered).size,data.activities.length);
  console.log('catalog:',rendered.length,'distinct reachable controls;',sampled.length,'representative unit/skill activities answered via UI');
}
async function legacy(page){
  const raw=await fs.readFile(path.join(__dirname,'fixtures/v07-completed.json'),'utf8'),old=JSON.parse(raw);
  assert.equal(old.version,7);assert.ok(old.exploration.completedChapter);
  await page.evaluate(value=>{localStorage.clear();localStorage.setItem('EnglishQuest.v7',value);},raw);
  await page.reload();await click(page,'continue');
  const migrated=await profile(page);assert.equal(migrated.version,8);
  for(const key of ['level','xp','hp','gold','unlocked','completed','chapterComplete','currentChapter','village','rpg','exploration','learning','mistakes','history','schedule','voice','settings'])assert.deepEqual(migrated[key],old[key],'v7 migration changed '+key);
  assert.equal(await page.evaluate(()=>localStorage.getItem('EnglishQuest.v7')),raw);
  await click(page,'academy-enter');await click(page,'academy-exit');
  assert.equal(await page.evaluate(()=>game.screen),'EXPLORE');
  assert.deepEqual((await profile(page)).exploration,migrated.exploration);
  await click(page,'academy-enter');
  console.log('authentic completed v7 migrates with old bytes and three chapters/position/skills preserved');
  return raw;
}
async function diagnostic(page){
  const before=await profile(page),forms=[];
  for(let run=0;run<2;run++){
    await click(page,'academy-diagnostic');const h=await task(page);assert.equal(h.total,24);forms.push(h.formId);
    const result=await finish(page,{wrongFirst:run===0});
    assert.equal(result.summary.total,24);const d=result.summary.diagnostic;
    assert.equal(d.total,24);assert.equal(Object.keys(d.bySkill).length,4);
    for(const row of Object.values(d.bySkill))assert.equal(row.total,6);
    assert.equal(d.bySkill.listening.independentCorrect,0);
    assert.ok(d.limited,'missing speech output must limit placement evidence');assert.ok(d.recommendedTier<3);
    assert.equal((await profile(page)).gold,before.gold);assert.equal((await profile(page)).xp,before.xp);
    if(run===0){await checkLayout(page,'academy-placement');await capture(page,'diagnostic');}
    await home(page);
  }
  assert.notEqual(forms[0],forms[1],'retest repeated the exact form');
  await click(page,'academy-auto-tier');assert.equal((await profile(page)).academy.tierMode,'auto');
  console.log('two alternate 24-item diagnostics, four skill results, honest no-audio placement and automatic/manual tier passed');
}
async function missions(page){
  const missions=await page.evaluate(()=>Curriculum.missions.map(m=>({id:m.id,ids:m.activityIds})));
  assert.equal(missions.length,4);
  for(const [i,m] of missions.entries()){
    const before=await profile(page);await click(page,'academy-mission',m.id);await startQuestions(page);
    if(i===0){await answer(page,true);await click(page,'academy-next');const next=(await task(page)).activity.id;await home(page);await click(page,'academy-mission',m.id);await startQuestions(page);assert.equal((await task(page)).activity.id,next,'mission did not resume next stage');}
    await finish(page,{wrongFirst:true,shot:i===0?'mission':null});
    assert.equal((await profile(page)).academy.missions[m.id].completed,true);
    assert.equal((await profile(page)).xp,before.xp);await home(page);
    await click(page,'academy-mission',m.id);await finish(page);const paid=await profile(page);
    assert.equal(paid.gold-before.gold,3,'a completed text-fallback mission must earn its small first reward');await home(page);
    await click(page,'academy-mission',m.id);await finish(page);assert.equal((await profile(page)).gold,paid.gold,'replayed mission duplicated gold');await home(page);
  }
  console.log('four missions: wrong/retry, resume, completion, replay and one-time small gold rewards passed');
}
async function reviewAndAnalytics(page){
  await click(page,'academy-unit','u01');await click(page,'academy-exact','u01-001');await startQuestions(page);await answer(page,false);await home(page);
  const today=await page.evaluate(()=>Academy.today(game.profile));assert.ok(today.count>0);
  await click(page,'academy-review');await finish(page);await click(page,'academy-progress');
  const d=await page.evaluate(()=>Academy.dashboard(game.profile)),p=await profile(page);
  assert.equal(d.totalAttempts,Object.values(p.academy.records).reduce((n,r)=>n+r.correct+r.wrong,0));
  assert.equal(d.uniqueCompleted,Object.values(p.academy.records).filter(r=>r.correct>0).length);
  assert.ok(!/NaN|undefined/.test(await page.locator('.world').innerText()));
  assert.equal(await page.locator('.academy-table').first().locator('tbody tr').count(),6);
  await checkLayout(page,'academy-analytics');await capture(page,'progress');await home(page);
  console.log('due review and analytics agree with saved independent/assisted records');
}
async function backups(page){
  await click(page,'academy-backup');await checkLayout(page,'academy-backup');
  const before=await profile(page),oldBytes=await page.evaluate(()=>localStorage.getItem('EnglishQuest.v7'));
  const pending=page.waitForEvent('download');await click(page,'academy-export');const download=await pending;
  assert.match(download.suggestedFilename(),/^EnglishQuest-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const text=await fs.readFile(await download.path(),'utf8'),envelope=JSON.parse(text);
  assert.equal(envelope.format,'EnglishQuestBackup');assert.equal(envelope.saveVersion,8);
  const sortedMissionSets=p=>{const value=structuredClone(p);for(const m of Object.values(value.academy.missions))for(const key of ['independentIds','rewardEligibleIds'])if(m[key])m[key].sort();return value;};
  assert.deepEqual(sortedMissionSets(envelope.profile),sortedMissionSets(before),'backup changed saved values beyond canonical set ordering');
  async function upload(value,name='qa-backup.json'){
    await page.locator('#academy-import-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(value)});
    await page.waitForFunction(()=>!AcademyUI.importBusy);
  }
  await upload(text);await ctl(page,'academy-import-confirm').waitFor();assert.deepEqual(await profile(page),before);await capture(page,'backup');
  await click(page,'academy-import-cancel');assert.deepEqual(await profile(page),before);
  // Only the browser's file-read promise is delayed; navigation and file selection remain real UI operations.
  await page.evaluate(value=>{window.qaOriginalFileText=File.prototype.text;File.prototype.text=function(){return new Promise(resolve=>{window.qaReleaseFile=()=>resolve(value);});};},text);
  await page.locator('#academy-import-file').setInputFiles({name:'delayed.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await page.waitForFunction(()=>typeof qaReleaseFile==='function');await home(page);await click(page,'academy-backup');
  await page.evaluate(()=>{qaReleaseFile();File.prototype.text=qaOriginalFileText;});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await visible(page,'academy-import-confirm'),false);assert.deepEqual(await profile(page),before,'late file read changed the checkpoint after leaving backup');
  for(const bad of ['{',JSON.stringify({...envelope,saveVersion:9,profile:{...before,version:9}}),JSON.stringify({...before,version:6}),JSON.stringify({...before,academy:{records:[]}}),'x'.repeat(2*1024*1024+1)]){
    await upload(bad);assert.equal(await visible(page,'academy-import-confirm'),false);assert.deepEqual(await profile(page),before);
  }
  await upload(text);await ctl(page,'academy-import-confirm').waitFor();await click(page,'settings');
  await page.locator('[data-setting="volume"]').press('Home');await page.locator('[data-setting="volume"]').press('ArrowRight');await click(page,'close');
  const intervening=await profile(page);assert.notDeepEqual(intervening,before);
  await click(page,'academy-import-confirm');assert.deepEqual(await profile(page),intervening,'stale import overwrote a newer settings checkpoint');
  // Change a real checkpoint after export, then restore it via the visible preview/confirmation flow.
  await home(page);await click(page,'academy-tier',1);await click(page,'academy-unit','u01');await click(page,'academy-exact','u01-001');await finish(page);await click(page,'academy-backup');
  assert.notDeepEqual(await profile(page),before);await upload(text);await ctl(page,'academy-import-confirm').waitFor();
  await rapidClick(page,ctl(page,'academy-import-confirm'));assert.deepEqual(await profile(page),envelope.profile);
  assert.equal(await page.evaluate(()=>localStorage.getItem('EnglishQuest.v7')),oldBytes);
  await page.reload();await click(page,'continue');await click(page,'academy-enter');assert.deepEqual(await profile(page),envelope.profile);await home(page);
  console.log('actual JSON download, preview/cancel, malformed/future/oversized rejection, stale checkpoint protection, confirmed snapshot restore and reload passed');
}
function installSpeechDouble(){
  window.academyQa={sessions:[],utterances:[]};
  const set=(name,value)=>Object.defineProperty(window,name,{configurable:true,value});
  set('SpeechRecognition',class {
    start(){const handlers={};for(const k of ['audiostart','speechend','result','error'])handlers[k]=this['on'+k];academyQa.sessions.push({instance:this,handlers});}
    abort(){this.aborted=true;}
  });set('webkitSpeechRecognition',undefined);
  set('SpeechSynthesisUtterance',class {constructor(text){this.text=text;}});
  set('speechSynthesis',Object.assign(new EventTarget(),{getVoices:()=>[{lang:'en-US',name:'QA mock English',localService:true}],speak(u){academyQa.utterances.push({text:u.text,rate:u.rate});u.onstart?.();},cancel(){}}));
}
async function optionalInput(browser){
  const {page,context,problems,network}=await createOfflinePage(browser);
  try{
    await page.addInitScript(installSpeechDouble);await page.reload();await newStudent(page);
    const conversation=await page.evaluate(()=>Curriculum.activities.find(a=>a.skill==='conversation'&&a.alternatives.length)?.id);assert.ok(conversation);
    async function expand(){if(!await page.locator('#academy-text-answer').isVisible())await page.locator('.academy-question details summary').click();}
    async function mic(){await expand();await click(page,'academy-mic-start');}
    async function open(){await click(page,'academy-unit',conversation.split('-')[0]);await click(page,'academy-exact',conversation);await startQuestions(page);await expand();}
    const emit=(type,data,index=-1)=>page.evaluate(({type,data,index})=>academyQa.sessions.at(index).handlers[type]?.(type==='result'?{results:[Object.assign([{transcript:data}],{isFinal:true})]}:type==='error'?{error:data}:{}),{type,data,index});
    await open();assert.equal(await page.evaluate(()=>academyQa.sessions.length),0);await checkLayout(page,'academy-optional-input');
    await page.locator('#academy-text-answer').fill('QA private typed phrase');await rapidClick(page,ctl(page,'academy-text-submit'));
    assert.equal((await task(page)).feedback.correct,false);assert.ok(!JSON.stringify(await profile(page)).includes('QA private typed phrase'));
    await click(page,'academy-retry');await page.locator('.academy-question details summary').click();
    const a=(await task(page)).activity;await page.locator('#academy-text-answer').fill(a.alternatives[0]);await click(page,'academy-text-submit');assert.equal((await task(page)).feedback.correct,true);await home(page);
    await open();await page.locator('#academy-text-answer').fill('private cancelled draft');await mic();assert.equal(await page.evaluate(()=>AcademyUI.micState),'requesting');
    await emit('audiostart');assert.equal(await page.evaluate(()=>AcademyUI.micState),'listening');
    await emit('speechend');assert.equal(await page.evaluate(()=>AcademyUI.micState),'processing');await click(page,'academy-mic-stop');
    const stopped=await profile(page);await emit('result',a.answer);assert.deepEqual(await profile(page),stopped);assert.equal((await task(page)).phase,'question');
    await mic();await home(page);await emit('result',a.answer);assert.deepEqual(await profile(page),stopped);await open();assert.equal(await page.locator('#academy-text-answer').inputValue(),'');
    await mic();const hiddenBefore=await profile(page);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});});
    await emit('result',a.answer);assert.deepEqual(await profile(page),hiddenBefore);assert.equal(await page.evaluate(()=>AcademyUI.micState),'ready');
    await mic();await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await emit('result',a.answer);assert.deepEqual(await profile(page),hiddenBefore);
    await mic();await emit('result','QA private unrecognized speech');assert.equal((await task(page)).phase,'question');assert.equal((await profile(page)).academy.records[conversation].wrong,stopped.academy.records[conversation].wrong);
    for(const [code,state] of [['not-allowed','denied'],['audio-capture','unavailable'],['no-speech','timeout']]){await mic();await emit('error',code);assert.equal(await page.evaluate(()=>AcademyUI.micState),state);}
    await mic();await emit('audiostart');await emit('result',a.answer);assert.equal((await task(page)).feedback.correct,true);
    const answered=await profile(page);await emit('result',a.answer);assert.deepEqual(await profile(page),answered);
    assert.ok(!JSON.stringify(answered).includes('QA private'));assert.ok(!JSON.stringify(answered).includes('private cancelled'));await home(page);
    const listening=await page.evaluate(()=>Curriculum.activities.find(a=>a.skill==='listening').id);
    await click(page,'academy-unit',listening.split('-')[0]);await click(page,'academy-exact',listening);await startQuestions(page);
    assert.ok(!(await task(page)).aids.includes('fallback'));await click(page,'academy-listen','normal');await click(page,'academy-listen','slow');
    const rates=await page.evaluate(()=>academyQa.utterances.slice(-2).map(u=>u.rate));assert.ok(rates[1]<rates[0]);await answer(page,true);
    assert.equal((await profile(page)).academy.records[listening].audioCorrect,1);await home(page);
    await click(page,'academy-unit',listening.split('-')[0]);await click(page,'academy-exact',listening);await startQuestions(page);
    await click(page,'settings');await page.locator('[data-setting="voice"]').uncheck();await click(page,'close');
    assert.ok((await task(page)).aids.includes('fallback'));await answer(page,true);assert.equal((await profile(page)).academy.records[listening].audioCorrect,1);
    assert.deepEqual(problems,[]);assert.deepEqual(network,[]);
    console.log('optional authored text, recognition mock lifecycle/errors/stale events/privacy, TTS rates and active mute fallback passed (no physical microphone or speaker claim)');
  }finally{await context.close();}
}
async function run(browser){
  const session=await createOfflinePage(browser,{disableSpeech:true}),{page,context,problems,network}=session;
  try{
    page.on('console',msg=>{if(msg.type()==='error')problems.push(msg.text());});
    if(process.argv.includes('--backup-only')){
      await newStudent(page);await legacy(page);await backups(page);assert.deepEqual(problems,[]);assert.deepEqual(network,[]);return;
    }
    await newStudent(page);await performanceSnapshot(page);await lessonFlow(page);await modes(page);
    await catalog(page,process.argv.includes('--milestone')?100:process.argv.includes('--gate250')?250:500);
    await legacy(page);
    if(!process.argv.includes('--milestone')){await diagnostic(page);if(!process.argv.includes('--gate250'))await missions(page);await reviewAndAnalytics(page);await backups(page);}
    assert.deepEqual(problems,[]);assert.deepEqual(network,[]);
    console.log('Academy milestone UI passed without external requests or uncaught errors.');
  }catch(error){console.error('Academy failure',await page.evaluate(()=>({screen:game.screen,h:typeof Academy==='undefined'?null:Academy.current(game.profile)})),problems);throw error;}
  finally{await context.close();}
}
async function main(){
  if(shots)await fs.mkdir(shots,{recursive:true});
  const channel=process.env.QUEST_QA_BROWSER||'chrome',browser=await chromium.launch({channel,headless:true});
  try{console.log(channel,browser.version(),'offline academy');if(!process.argv.includes('--input-only'))await run(browser);if(!process.argv.includes('--milestone')&&!process.argv.includes('--backup-only'))await optionalInput(browser);}finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
