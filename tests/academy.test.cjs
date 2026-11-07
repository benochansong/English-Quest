const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'../src');
const names=['questions.js','village-data.js','voice-data.js','exploration-data.js','curriculum-data.js',
  ...fs.readdirSync(path.join(dir,'curriculum-packs')).filter(n=>n.endsWith('.js')).sort().map(n=>'curriculum-packs/'+n),
  'rpg.js','engine.js','village-engine.js','voice-learning.js','exploration-engine.js','academy-engine.js'];
const source=names.map(n=>fs.readFileSync(path.join(dir,n),'utf8')).join('\n');
const copy=o=>JSON.parse(JSON.stringify(o));
const noon=date=>new Date(date+'T12:00:00').getTime();
function setup(){const data=new Map(),localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const api=vm.runInNewContext(source+'\n;({a:Academy,c:Curriculum,e:Engine})',{localStorage});const p=api.e.fresh();p.started=true;return {...api,p,data};}
function exact(ctx,id,now=noon('2026-12-31'),options={}){
  const {a,p}=ctx,h=a.startExact(p,id,{now});assert.ok(h);assert.equal(h.phase,'preview');assert.ok(a.advance(p,h));
  if(h.activity.skill==='listening'&&options.audio!==false)a.hear(p,h);
  if(options.aid)a.assist(p,h,options.aid);
  const value=options.wrong?(h.activity.type==='order'?[...h.activity.choices].reverse().join(' '):h.choices.find(s=>s!==h.activity.answer)):h.activity.answer;
  const result=a.answer(p,h,value,{now});assert.ok(result);return {h,result};
}
function complete(ctx,h,now=noon('2026-12-31'),wrong=false){
  const {a,p}=ctx;assert.ok(a.advance(p,h));
  while(h.phase==='question'){
    const activity=h.activity;if(activity.skill==='listening')a.hear(p,h);
    if(wrong){const value=activity.type==='order'?[...activity.choices].reverse().join(' '):h.choices.find(s=>s!==activity.answer);
      assert.equal(a.answer(p,h,value,{now}).correct,false);assert.ok(a.retry(p,h));}
    assert.ok(a.answer(p,h,activity.answer,{now}).correct);assert.ok(a.advance(p,h));
  }
  assert.equal(h.phase,'results');return a.summary(p,h);
}
function diagnosticForms(ctx){
  assert.equal(ctx.c.diagnostics.length,2,'both production assessment forms must be loaded');
}
function diagnose(ctx,answerRule=()=>true,aidRule=()=>null){
  diagnosticForms(ctx);const {a,p}=ctx,h=a.startDiagnostic(p,{now:noon('2026-12-31')});assert.ok(a.advance(p,h));
  while(h.phase==='question'){
    const q=h.activity,aid=aidRule(q,h.index);
    if(q.skill==='listening')a.hear(p,h);if(aid)a.assist(p,h,aid);
    const value=answerRule(q,h.index)?q.answer:h.choices.find(s=>s!==q.answer);
    a.answer(p,h,value);assert.equal(a.retry(p,h),false);assert.ok(a.advance(p,h));
  }
  return a.summary(p,h).diagnostic;
}

test('Academy has an empty honest dashboard and every registered activity is independently reachable without RPG changes',()=>{
  const ctx=setup(),{a,c,p}=ctx;assert.ok(c.activities.length>=500);
  const empty=a.dashboard(p);assert.equal(empty.totalAttempts,0);assert.equal(empty.uniqueCompleted,0);assert.equal(empty.overall.accuracy,null);
  const original=copy({gold:p.gold,level:p.level,xp:p.xp,completed:p.completed,rpg:p.rpg,exploration:p.exploration});
  for(const item of c.activities){const {h,result}=exact(ctx,item.id);assert.equal(result.correct,true,item.id);assert.equal(h.assisted,false,item.id);a.close(p);}
  const d=a.dashboard(p);assert.equal(d.uniqueCompleted,c.activities.length);assert.equal(d.totalAttempts,c.activities.length);
  assert.deepEqual(copy({gold:p.gold,level:p.level,xp:p.xp,completed:p.completed,rpg:p.rpg,exploration:p.exploration}),original);
});

test('Unit flow contains guided, independent and application questions; all five practice modes return valid distinct decks',()=>{
  const ctx=setup(),{a,p,c}=ctx;const h=a.startUnit(p,'u01');assert.equal(h.total,6);assert.equal(new Set(h.activityIds).size,6);
  assert.ok(h.preview.length);assert.ok(a.advance(p,h));const stages=[];
  while(h.phase==='question'){stages.push(h.stage);if(h.activity.skill==='listening')a.hear(p,h);a.answer(p,h,h.activity.answer);a.advance(p,h);}
  assert.deepEqual(stages,['guided','guided','independent','independent','application','application']);
  const result=a.summary(p,h);assert.equal(result.assisted,2);assert.equal(result.independentCorrect,4);assert.equal(result.reward.gold,5);
  const progress=a.unitProgress(p,'u01');assert.equal(progress.completed,6);assert.equal(progress.total,c.activities.filter(q=>q.unitId==='u01').length);assert.ok(progress.percent<100);
  for(const mode of ['vocabulary','grammar','listening','conversation','mixed']){const run=a.startMode(p,mode);assert.ok(run,mode);assert.ok(run.total>0);assert.equal(new Set(run.activityIds).size,run.total);complete(ctx,run);}
});

test('Private session locks reject rapid, stale, cross-profile and malformed input; correction retries count assistance',()=>{
  const ctx=setup(),{a,c,p,e}=ctx,id=c.activities.find(q=>q.type==='choice').id;
  let h=a.startExact(p,id);assert.equal(a.answer(p,h,h.activity.answer),null);a.advance(p,h);
  const before=copy(p.academy);assert.equal(a.answer(p,h,'unknown option'),null);assert.equal(a.answer(e.fresh(),h,h.activity.answer),null);
  assert.equal(a.answer(p,h,h.activity.answer,{now:NaN}),null);assert.equal(a.startExact(p,id,{now:NaN}),null);assert.deepEqual(copy(p.academy),before);
  const wrong=h.choices.find(s=>s!==h.activity.answer);assert.equal(a.answer(p,h,wrong).correct,false);assert.equal(a.answer(p,h,h.activity.answer),null);assert.equal(a.advance(p,h),false);
  assert.ok(a.retry(p,h));assert.equal(a.retry(p,h),false);assert.equal(a.answer(p,h,h.activity.answer).correct,true);assert.equal(p.academy.records[id].assistedCorrect,1);
  assert.equal(a.retry(p,h),false);const stale=h;h=a.startExact(p,id);a.advance(p,h);assert.equal(a.answer(p,stale,stale.activity.answer),null);
  a.close(p);assert.equal(a.answer(p,h,h.activity.answer),null);
  const order=c.activities.find(q=>q.type==='order');h=a.startExact(p,order.id);a.advance(p,h);
  assert.equal(a.answer(p,h,h.choices.slice(1).join(' ')),null);assert.equal(a.answer(p,h,[h.choices[0],...h.choices].join(' ')),null);
  assert.ok(a.answer(p,h,order.answer).correct);assert.equal(a.answer(p,h,order.answer),null);
});

test('Listening separates real playback, transcript/fallback, and answers submitted without audio; speech mismatches are not wrong marks',()=>{
  const ctx=setup(),{a,c,p}=ctx,q=c.activities.find(q=>q.skill==='listening');
  exact(ctx,q.id,undefined,{aid:'fallback'});exact(ctx,q.id,undefined,{audio:false});exact(ctx,q.id);
  const r=p.academy.records[q.id];assert.equal(r.correct,3);assert.equal(r.assistedCorrect,1);assert.equal(r.readingAssisted,1);assert.equal(r.audioCorrect,1);assert.equal(r.independentCorrect,1);
  const h=a.startExact(p,q.id);a.advance(p,h);assert.ok(a.assist(p,h,'transcript'));assert.ok(a.assist(p,h,'transcript'));a.hear(p,h);a.answer(p,h,q.answer);
  assert.equal(r.transcript,1);assert.equal(r.audioCorrect,1);
  const talk=c.activities.find(q=>q.skill==='conversation'&&/[a-z]/i.test(q.answer)),session=a.startExact(p,talk.id);a.advance(p,session);
  assert.equal(a.answer(p,session,'recognition did not match',{mode:'speech'}).retrySpeech,true);assert.equal(p.academy.records[talk.id],undefined);
  assert.ok(a.answer(p,session,talk.answer,{mode:'text'}).correct);assert.equal(p.academy.records[talk.id].wrong,0);
  assert.equal(JSON.stringify(p).includes('recognition did not match'),false);
});

test('Civil-day SRS uses 0/1/3/7/14/30, resists same-day farming and tolerates missed days without erasing evidence',()=>{
  const ctx=setup(),{a,c,p}=ctx,q=c.activities.find(q=>q.skill==='vocabulary'),id=q.expressionIds[0];
  exact(ctx,q.id,noon('2026-12-31'));let r=p.academy.expressions[id];assert.equal(r.dueDay,'2027-01-01');assert.equal(r.step,1);
  exact(ctx,q.id,noon('2026-12-31'));assert.equal(r.dueDay,'2027-01-01');assert.equal(r.step,1);
  let date='2027-01-01';for(const interval of [3,7,14,30]){exact(ctx,q.id,noon(date));assert.equal(r.dueDay,a.day(noon(date),interval));date=r.dueDay;}
  assert.equal(r.step,5);const good=r.correct;
  assert.equal(a.today(p,noon('2028-01-01')).due.some(d=>d.expressionId===id),true);assert.equal(r.correct,good);
  exact(ctx,q.id,noon('2028-01-01'),{wrong:true});assert.equal(r.step,0);assert.equal(r.dueDay,'2028-01-01');assert.equal(r.correct,good);
  const h=a.current(p);a.retry(p,h);a.answer(p,h,q.answer,{now:noon('2028-01-01')});assert.equal(r.dueDay,'2028-01-02');
  assert.equal(a.day(noon('2027-03-13'),1),'2027-03-14');assert.equal(a.day(noon('2027-11-06'),1),'2027-11-07');
});

test('DST review intervals follow local calendar dates across the spring and autumn clock changes',()=>{
  for(const [date,next,third] of [['2027-03-13','2027-03-14','2027-03-17'],['2027-11-06','2027-11-07','2027-11-10']]){
    const ctx=setup(),q=ctx.c.activities.find(q=>q.skill==='vocabulary'),id=q.expressionIds[0];
    exact(ctx,q.id,noon(date));assert.equal(ctx.p.academy.expressions[id].dueDay,next);
    exact(ctx,q.id,noon(next));assert.equal(ctx.p.academy.expressions[id].dueDay,third);
    assert.equal(ctx.a.today(ctx.p,noon(third)).due.some(row=>row.expressionId===id),true);
  }
  if(process.env.TZ==='America/New_York'){
    assert.equal((noon('2027-03-14')-noon('2027-03-13'))/3600000,23);
    assert.equal((noon('2027-11-07')-noon('2027-11-06'))/3600000,25);
  }
});

test('Expression states require independent successes across dates and formats; a fresh miss requests review',()=>{
  const ctx=setup(),{a,c,p}=ctx;
  const expression=c.expressions.find(e=>new Set(c.activities.filter(q=>q.expressionIds.includes(e.id)).map(q=>q.skill+':'+q.type)).size>=2);
  const qs=c.activities.filter(q=>q.expressionIds.includes(expression.id)),one=qs[0],two=qs.find(q=>q.skill!==one.skill||q.type!==one.type);
  assert.equal(a.expressionStatus(p,expression.id),'New');exact(ctx,one.id,noon('2026-12-01'));assert.equal(a.expressionStatus(p,expression.id),'Learning');
  exact(ctx,two.id,noon('2026-12-01'));exact(ctx,one.id,noon('2026-12-01'));assert.equal(a.expressionStatus(p,expression.id),'Learning');
  exact(ctx,two.id,noon('2026-12-02'));assert.equal(a.expressionStatus(p,expression.id),'Familiar');
  exact(ctx,one.id,noon('2026-12-03'));exact(ctx,two.id,noon('2026-12-03'));assert.equal(a.expressionStatus(p,expression.id),'Consistently Correct');
  exact(ctx,one.id,noon('2026-12-04'),{wrong:true});assert.equal(a.expressionStatus(p,expression.id),'Review Needed');
});

test('Adaptive tier needs ten new independent samples, eight distinct activities and multiple skills; manual tier stays stable',()=>{
  const ctx=setup(),{a,c,p}=ctx;
  const ids=[...c.activities.filter(q=>q.skill==='vocabulary').slice(0,5),...c.activities.filter(q=>q.skill==='grammar').slice(0,5)].map(q=>q.id);
  p.level=500;exact(ctx,ids[0]);assert.equal(p.academy.tier,1);
  for(const id of ids.slice(1,9))exact(ctx,id);assert.equal(p.academy.tier,1);
  exact(ctx,ids[9]);assert.equal(p.academy.tier,2);assert.equal(a.recommendation(p).tier,2);
  for(let i=0;i<9;i++)exact(ctx,ids[0]);assert.equal(p.academy.tier,2,'repeating one easy item cannot raise the tier');
  assert.ok(a.setTier(p,3,'manual'));for(const id of ids)exact(ctx,id,undefined,{wrong:true});assert.equal(p.academy.tier,3);
  assert.equal(p.level,500);assert.equal(a.setTier(p,9),false);
});

test('Selection is deterministic, spaces recent work and favors due misses while all manual tiers remain accessible',()=>{
  const ctx=setup(),{a,c,p}=ctx;a.setTier(p,3,'manual');const now=noon('2027-02-01');
  assert.deepEqual(Array.from(a.select(p,{mode:'mixed',now})),Array.from(a.select(p,{mode:'mixed',now})));
  const first=a.startMode(p,'vocabulary',{now});const firstIds=Array.from(first.activityIds);complete(ctx,first,now);
  const second=a.startMode(p,'vocabulary',{now});assert.ok(second.activityIds.some(id=>!firstIds.includes(id)));
  const target=c.activities.filter(q=>q.skill==='vocabulary').at(-1);exact(ctx,target.id,noon('2027-01-01'),{wrong:true});
  p.academy.recent=[];assert.ok(a.select(p,{mode:'vocabulary',now}).includes(target.id));
  a.setTier(p,1,'manual');assert.ok(a.startExact(p,c.activities.find(q=>q.tier===3).id));
  const override=setup(),deck=override.a.startMode(override.p,'mixed',{tier:3});
  assert.ok(deck.activityIds.some(id=>override.c.get(id).tier===3));assert.equal(override.p.academy.tier,1);
});

test('Practicing easier catalog material cannot alone promote beyond its demonstrated tier',()=>{
  const ctx=setup(),{a,c,p}=ctx;
  const pool=skill=>c.activities.filter(q=>q.skill===skill&&q.tier===1);
  const first=[...pool('vocabulary').slice(0,5),...pool('grammar').slice(0,5)];
  for(const q of first)exact(ctx,q.id);assert.equal(p.academy.tier,2);
  const easier=[...pool('vocabulary').filter(q=>!first.includes(q)).slice(0,5),...pool('grammar').filter(q=>!first.includes(q)).slice(0,5)];
  assert.equal(easier.length,10);for(const q of easier)exact(ctx,q.id);assert.equal(p.academy.tier,2);assert.ok(a.recommendation(p).reason.includes('쉬운 표현'));
  const harder=[...c.activities.filter(q=>q.skill==='vocabulary'&&q.tier===2).slice(0,5),...c.activities.filter(q=>q.skill==='grammar'&&q.tier===2).slice(0,5)];
  assert.equal(harder.length,10);for(const q of harder)exact(ctx,q.id);assert.equal(p.academy.tier,3);
});

test('Unit and mission rewards require first-answer comprehension and are one-time, including after reload',()=>{
  const ctx=setup(),{a,c,p,e}=ctx;let result=complete(ctx,a.startUnit(p,'u01'),undefined,true);assert.equal(result.reward.gold,0);assert.equal(p.gold,0);
  result=complete(ctx,a.startUnit(p,'u01'));assert.equal(result.reward.gold,5);assert.equal(p.gold,5);
  result=complete(ctx,a.startUnit(p,'u01'));assert.equal(result.reward.gold,0);ctx.p=e.hydrate(copy(p));
  result=complete(ctx,a.startUnit(ctx.p,'u01'));assert.equal(result.reward.gold,0);assert.equal(ctx.p.gold,5);
  assert.equal(c.missions.length,4);
  const m=c.missions[0],h=a.startMission(ctx.p,m.id);a.advance(ctx.p,h);a.answer(ctx.p,h,h.activity.answer);assert.equal(ctx.p.academy.missions[m.id].step,1);
  a.close(ctx.p);ctx.p=e.hydrate(copy(ctx.p));const resumed=a.startMission(ctx.p,m.id);assert.equal(resumed.activityIds[0],m.activityIds[1]);
  const reward=complete(ctx,resumed);assert.equal(reward.reward.gold,3);assert.equal(ctx.p.academy.missions[m.id].completed,true);
  assert.equal(complete(ctx,a.startMission(ctx.p,m.id)).reward.gold,0);assert.equal(ctx.p.gold,8);
});

test('Diagnostics use per-skill floors, distinguish fallback from audio, permit manual override and rotate forms',()=>{
  const full=setup(),high=diagnose(full);assert.equal(high.total,24);assert.equal(high.recommendedTier,3);assert.equal(high.limited,false);
  assert.ok(Object.values(high.bySkill).every(r=>r.total===6));
  const form=high.formId,second=diagnose(full);assert.notEqual(second.formId,form);
  const weak=setup(),weakResult=diagnose(weak,q=>q.skill!=='grammar');assert.equal(weakResult.correct,18);assert.equal(weakResult.recommendedTier,1);
  const fallback=setup(),reading=diagnose(fallback,()=>true,q=>q.skill==='listening'?'fallback':null);
  assert.equal(reading.correct,24);assert.equal(reading.recommendedTier,2);assert.equal(reading.bySkill.listening.independentAnswered,0);assert.equal(reading.bySkill.listening.readingAssisted,6);assert.equal(reading.limited,true);
  fallback.a.setTier(fallback.p,3,'manual');diagnose(fallback,()=>false);assert.equal(fallback.p.academy.tier,3);
});

test('Analytics expose correct denominators, true unique counts, recent assistance and evidence-based weak-skill guidance',()=>{
  const ctx=setup(),{a,c,p}=ctx,items=c.activities.filter(q=>q.skill==='vocabulary').slice(0,4);
  for(const item of items)exact(ctx,item.id,undefined,{wrong:true});
  exact(ctx,items[0].id,undefined,{aid:'hint'});exact(ctx,items[0].id);
  const d=a.dashboard(p);assert.equal(d.totalAttempts,6);assert.equal(d.uniqueAttempted,4);assert.equal(d.uniqueCompleted,1);
  assert.equal(d.overall.correct,2);assert.equal(d.overall.independentAnswered,5);assert.equal(d.overall.independentCorrect,1);assert.equal(d.overall.assistedAnswered,1);
  assert.equal(d.recommendation.skill,'vocabulary');assert.ok(d.recommendation.text.includes('5'));
  assert.equal(d.recent.at(-1).id,items[0].id);assert.equal(d.recent.at(-1).assisted,false);
  assert.ok(a.unitProgress(p,items[0].unitId,noon('2027-02-01')).dueCount>=4);
});

test('Review sessions settle learning without farming gold and keep already answered items after abandonment',()=>{
  const ctx=setup(),{a,c,p}=ctx;for(const item of c.activities.slice(0,6))exact(ctx,item.id,noon('2026-12-01'),{wrong:true});
  const h=a.startReview(p,{now:noon('2026-12-02')});assert.ok(h);const result=complete(ctx,h,noon('2026-12-02'));
  assert.equal(result.reward.gold,0);assert.equal(p.gold,0);assert.ok(p.academy.badges.includes('first-review'));
  const run=a.startMode(p,'mixed');a.advance(p,run);a.answer(p,run,run.activity.answer);const id=run.activity.id;a.close(p);
  assert.ok(p.academy.records[id].correct);assert.equal(a.answer(p,run,run.activity.answer),null);
});

test('Academy hydration strips unknown state, repairs bounded counters and preserves authentic v7 data separately',()=>{
  const ctx=setup(),{a,c,e}=ctx,q=c.activities[0],id=q.expressionIds[0];
  const raw={tier:99,tierMode:'bad',records:{[q.id]:{correct:2,wrong:1,assistedCorrect:99,independentCorrect:99,audioCorrect:Infinity,hint:99,fallback:99},unknown:{correct:999}},
    expressions:{[id]:{seen:true,correct:1,streak:99,step:99,dueDay:'2027-02-30',days:['not-date'],formats:['made-up']}},recent:[{id:'unknown',day:'2026-01-01',correct:true}],apiKey:'secret'};
  const clean=a.hydrate(raw);assert.equal(clean.tier,1);assert.equal(clean.records.unknown,undefined);assert.equal(clean.records[q.id].assistedCorrect,2);
  assert.equal(clean.records[q.id].independentCorrect,0);assert.equal(clean.expressions[id].step,5);assert.equal(clean.expressions[id].streak,0);assert.equal(clean.expressions[id].dueDay,'');assert.equal(clean.apiKey,undefined);
  assert.equal(clean.records[q.id].hint,3);assert.equal(clean.records[q.id].fallback,3);
  const old=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/v07-completed.json'),'utf8')),text=JSON.stringify(old);
  ctx.data.set(e.v7Key,text);const migrated=e.load();assert.equal(migrated.version,8);assert.equal(ctx.data.get(e.v7Key),text);assert.deepEqual(copy(migrated.academy),copy(a.fresh()));
  for(const key of ['level','xp','gold','hp','rpg','voice','village','learning'])assert.deepEqual(copy(migrated[key]),old[key],key);
});

test('Catalog practice cannot manufacture independent mission credit during hydration',()=>{
  const ctx=setup(),{a,c,e}=ctx;
  assert.equal(c.missions.length,4);
  const m=c.missions[0];for(const id of m.activityIds)exact(ctx,id);
  assert.equal(complete(ctx,a.startMission(ctx.p,m.id),undefined,true).reward.gold,0);
  assert.equal(ctx.p.academy.missions[m.id].independentIds.length,0);ctx.p=e.hydrate(copy(ctx.p));
  assert.equal(ctx.p.academy.missions[m.id].independentIds.length,0);
  assert.equal(complete(ctx,a.startMission(ctx.p,m.id),undefined,true).reward.gold,0);
  assert.equal(ctx.p.gold,0);assert.equal(complete(ctx,a.startMission(ctx.p,m.id)).reward.gold,3);
});

test('Text fallback can earn comprehension rewards without creating independent listening evidence',()=>{
  const ctx=setup(),{a,c,p,e}=ctx;
  assert.equal(c.missions.length,4);
  function withoutAudio(h){a.advance(ctx.p,h);while(h.phase==='question'){
    if(h.activity.skill==='listening')a.assist(ctx.p,h,'fallback');a.answer(ctx.p,h,h.activity.answer);a.advance(ctx.p,h);
  }return a.summary(ctx.p,h);}
  const m=c.missions.find(m=>m.activityIds.some(id=>c.get(id).skill==='listening'))||c.missions[0];
  const result=withoutAudio(a.startMission(p,m.id));assert.equal(result.reward.gold,3);
  const state=p.academy.missions[m.id];assert.equal(state.rewardEligibleIds.length,m.activityIds.length);
  for(const id of m.activityIds.filter(id=>c.get(id).skill==='listening')){
    assert.equal(p.academy.records[id].audioCorrect,0);assert.equal(p.academy.records[id].independentCorrect,0);
    assert.equal(p.academy.records[id].readingAssisted,1);assert.equal(p.academy.records[id].comprehensionCorrect,1);
  }
  ctx.p=e.hydrate(copy(p));assert.equal(ctx.p.academy.missions[m.id].rewardEligibleIds.length,m.activityIds.length);
  assert.equal(withoutAudio(a.startMission(ctx.p,m.id)).reward.gold,0);
  assert.equal(withoutAudio(a.startUnit(ctx.p,'u01')).reward.gold,5);assert.equal(ctx.p.gold,8);
});

test('Final solved answer checkpoints the one-time reward before results, even if the results screen is abandoned',()=>{
  const ctx=setup(),{a,p,e}=ctx,h=a.startUnit(p,'u01');a.advance(p,h);
  while(h.index<h.total-1){if(h.activity.skill==='listening')a.assist(p,h,'fallback');a.answer(p,h,h.activity.answer);a.advance(p,h);}
  if(h.activity.skill==='listening')a.assist(p,h,'fallback');const result=a.answer(p,h,h.activity.answer);
  assert.equal(h.phase,'feedback');assert.equal(result.final,true);assert.equal(result.reward.gold,5);assert.equal(p.gold,5);
  a.close(p);assert.ok(e.save(p));ctx.p=e.load();assert.equal(ctx.p.gold,5);assert.ok(ctx.p.academy.rewarded.includes('unit-u01'));
  assert.equal(complete(ctx,a.startUnit(ctx.p,'u01')).reward.gold,0);assert.equal(ctx.p.gold,5);
});

test('Authored conversation alternatives work in text mode without storing typed wording',()=>{
  const ctx=setup(),{a,c,p}=ctx,item=c.activities.find(q=>q.skill==='conversation'&&q.alternatives.length);
  assert.ok(item,'content offers explicit accepted alternatives');const h=a.startExact(p,item.id);a.advance(p,h);
  assert.ok(a.answer(p,h,item.alternatives[0],{mode:'text'}).correct);
  assert.equal(p.academy.records[item.id].independentCorrect,1);assert.equal(JSON.stringify(p).includes(item.alternatives[0]),false);
});

test('Production diagnostic banks contain 48 distinct referenced items with six questions per assessed skill',()=>{
  const base=setup();
  assert.equal(base.c.diagnostics.length,2);
  const ids=base.c.diagnostics.flatMap(form=>form.activityIds);assert.equal(ids.length,48);assert.equal(new Set(ids).size,48);
  for(const form of base.c.diagnostics)for(const skill of ['vocabulary','grammar','reading','listening'])
    assert.equal(form.activityIds.filter(id=>base.c.get(id).skill===skill).length,6);
});

test('All four production missions complete, reload and replay without duplicate rewards',()=>{
  const base=setup();
  assert.equal(base.c.missions.length,4);
  for(const definition of base.c.missions){
    const ctx=setup(),m=ctx.c.missions.find(m=>m.id===definition.id),{a,p,e}=ctx;
    assert.ok(m.activityIds.length>=4);const run=a.startMission(p,m.id),result=complete(ctx,run);
    assert.equal(result.solved,m.activityIds.length);assert.equal(result.reward.gold,3,m.id);assert.equal(p.academy.missions[m.id].completed,true);
    ctx.p=e.hydrate(copy(p));assert.equal(complete(ctx,a.startMission(ctx.p,m.id)).reward.gold,0,m.id);
    assert.equal(ctx.p.gold,3);assert.equal(ctx.p.xp,0);assert.equal(ctx.p.completed.length,0);
  }
});
