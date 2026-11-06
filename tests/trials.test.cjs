const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=['questions','village-data','voice-data','rpg','engine','village-engine','voice-learning','trials']
  .map(n=>fs.readFileSync(path.join(__dirname,'../src',n+'.js'),'utf8')).join('\n');
function setup(){
  const data=new Map();
  const localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const api=vm.runInNewContext(source+'\n;({e:Engine,t:Trials,r:RPG,l:VoiceLearning})',{localStorage});
  return {...api,p:api.e.fresh()};
}
const deterministic=()=>0.382;
function correct(t,p,run){
  const q=run.question;
  return t.answer(p,run,q.type==='order'?q.choices.join(' '):q.answer);
}
function complete(ctx,id){
  const {t,p}=ctx,run=t.start(p,id,deterministic);
  assert.ok(run);
  for(let i=0;i<5;i++){
    assert.ok(correct(t,p,run).correct);
    assert.equal(run.seals,i+1);
    if(i<4)assert.ok(t.next(p,run));
  }
  assert.equal(run.phase,'victory');
  return run;
}
test('Rooms open in sequence for a started player; a later room cannot bypass an uncleared earlier room',()=>{
  const ctx=setup(),{p,t}=ctx;
  assert.equal(t.start(p,'words'),null);
  p.started=true;
  assert.ok(t.unlocked(p,'words'));assert.equal(t.unlocked(p,'sentences'),false);assert.equal(t.unlocked(p,'echoes'),false);
  assert.equal(t.unlocked(p,'unknown'),false);assert.equal(t.start(p,'sentences'),null);
  p.rpg.dungeons.sentences.clears=1; // Inconsistent imported state does not open the final door.
  assert.equal(t.unlocked(p,'echoes'),false);p.rpg.dungeons.sentences.clears=0;
  complete(ctx,'words');
  assert.ok(t.unlocked(p,'sentences'));assert.equal(t.unlocked(p,'echoes'),false);
  complete(ctx,'sentences');assert.ok(t.unlocked(p,'echoes'));
  assert.equal(p.completed.length,0);assert.equal(p.chapterComplete,false);
});
test('Room decks draw five unique, solvable prompts, rotate vocabulary on replay and retain the meaning/response pattern',()=>{
  const ctx=setup(),{p,t}=ctx;p.started=true;
  const words=complete(ctx,'words');
  assert.ok(words.questions.every(q=>q.type==='vocab'&&q.chapter!==2));
  assert.equal(new Set(words.questions.map(q=>q.id)).size,5);
  const replay=t.start(p,'words',deterministic);
  assert.ok(replay.questions.every(q=>!p.rpg.dungeons.words.lastIds.includes(q.id)));
  const fragments=complete(ctx,'sentences');
  assert.deepEqual(Array.from(fragments.questions,q=>q.type),['order','sentence','order','sentence','order']);
  assert.ok(fragments.questions.filter(q=>q.type==='sentence').every(q=>q.phrase.includes('___')));
  assert.equal(new Set(fragments.questions.map(q=>q.id)).size,5);
  const echo=complete(ctx,'echoes');
  assert.equal(new Set(echo.questions.map(q=>q.id)).size,5);
  assert.deepEqual(Array.from(echo.questions,q=>q.voiceActivity?.mode||'meaning'),['meaning','respond','meaning','respond','meaning']);
  const offer=echo.questions.find(q=>q.phrase==='Would you like to sit here?');
  assert.ok(offer.instruction.includes('수락'));
  assert.ok(offer.choices.includes('No, thank you.')&&offer.choices.includes('Yes, thank you.'));
  assert.equal(offer.answer,'Yes, thank you.');
  const next=t.start(p,'echoes',deterministic);
  assert.notEqual(next.question.id,echo.questions.at(-1).id);
});
test('Stale or invalid moves never mutate the run; abandonment preserves actual answers but grants no loot',()=>{
  const ctx=setup(),{p,t,e}=ctx;p.started=true;
  const abandoned=t.start(p,'words',deterministic);
  assert.equal(t.next(p,abandoned),false);
  assert.equal(t.assist(p,abandoned,'unrecognized-aid'),false);
  assert.equal(t.answer(p,abandoned,null),null);assert.equal(t.answer(p,abandoned,'forged choice'),null);
  assert.equal(abandoned.results.length,0);
  correct(t,p,abandoned);assert.equal(correct(t,p,abandoned),null);
  const id=abandoned.question.id;
  const replacement=t.start(p,'words',deterministic);
  assert.equal(t.next(p,abandoned),false);assert.equal(t.assist(p,abandoned,'translation'),false);
  assert.equal(t.answer(e.fresh(),replacement,replacement.question.answer),null);
  t.leave(p);assert.equal(correct(t,p,replacement),null);
  assert.equal(p.voice.records[id].correct,1);
  assert.ok(e.save(p));
  const loaded=e.load();assert.equal(loaded.rpg.dungeons.words.clears,0);
  assert.equal(loaded.gold,0);assert.equal(loaded.rpg.collection.includes('guardianArmor'),false);
});
test('Unanswered, missing and repeated word tiles are rejected; valid wrong arrangements earn no seals',()=>{
  const ctx=setup(),{t,p}=ctx;p.started=true;
  complete(ctx,'words');
  const run=t.start(p,'sentences',deterministic),q=run.question;
  assert.equal(q.type,'order');
  assert.equal(t.answer(p,run,q.choices[0]),null);
  assert.equal(t.answer(p,run,q.choices.map(()=>q.choices[0]).join(' ')),null);
  assert.equal(run.results.length,0);
  const wrong=[...q.choices].reverse().join(' ');
  for(let i=0;i<5;i++){
    assert.equal(t.answer(p,run,wrong).correct,false);assert.equal(run.seals,0);
    assert.equal(correct(t,p,run),null);
    assert.ok(t.next(p,run));assert.equal(t.next(p,run),false);
    assert.equal(run.index,0);assert.equal(run.question.id,q.id);
  }
  assert.equal(p.rpg.dungeons.sentences.clears,0);assert.equal(run.reward,null);
  assert.equal(p.voice.records[q.id].wrong,5);
  assert.ok(correct(t,p,run).correct);assert.equal(run.seals,1);
  assert.equal(run.results[0].attempts,6);assert.equal(run.results[0].firstCorrect,false);
  assert.equal(p.voice.records[q.id].assistedCorrect,1);
});
test('Assisted Echo answers and correction retries update the corresponding authored activity exactly once',()=>{
  const ctx=setup(),{t,p}=ctx;p.started=true;
  complete(ctx,'words');complete(ctx,'sentences');
  const run=t.start(p,'echoes',deterministic);
  correct(t,p,run);t.next(p,run);
  const q=run.question;assert.equal(q.voiceActivity.mode,'respond');
  t.assist(p,run,'fallback');t.assist(p,run,'fallback');assert.ok(run.showTranscript);
  t.assist(p,run,'translation');assert.ok(run.showHint);
  assert.equal(t.answer(p,run,run.choices.find(c=>c!==q.answer)).correct,false);
  assert.equal(t.assist(p,run,'transcript'),false);
  assert.equal(t.answer(p,run,q.answer),null);
  let record=p.voice.records[q.id];
  assert.equal(record.wrong,1);assert.equal(record.assistedWrong,1);
  assert.equal(record.fallback,1);assert.equal(record.translation,1);
  t.next(p,run);assert.equal(run.question.id,q.id);
  assert.ok(correct(t,p,run).correct);assert.equal(correct(t,p,run),null);
  record=p.voice.records[q.id];
  assert.equal(record.correct,1);assert.equal(record.assistedCorrect,1);
  assert.equal(run.results[1].attempts,2);assert.equal(run.results[1].assisted,true);
  assert.ok(p.voice.introduced.includes(q.id));
});
test('Fifth solved question checkpoints the reward before results; reload/replay leaves XP, skills and currency intact',()=>{
  const ctx=setup(),{e,t,r}=ctx;
  ctx.p=e.hydrate({version:4,level:3,xp:11,gold:35,started:true});
  const p=ctx.p;r.chooseClass(p,'arcanist');r.learn(p,'magicTraining');r.equip(p,'travelerSword');
  const savedSkills=JSON.stringify(p.rpg.skills),snapshot=[p.level,p.xp,p.rpg.spentPoints,p.rpg.availablePoints];
  const run=t.start(p,'words',deterministic);
  t.answer(p,run,run.choices.find(c=>c!==run.question.answer));t.next(p,run);
  for(let i=0;i<5;i++){
    correct(t,p,run);
    if(i<4){assert.equal(p.gold,35);assert.equal(run.reward,null);t.next(p,run);}
  }
  assert.equal(run.phase,'victory');assert.equal(run.reward.first,true);
  assert.equal(run.reward.gold,20);assert.equal(run.reward.gearId,'guardianArmor');
  assert.equal(p.gold,55);assert.equal(p.rpg.dungeons.words.best,4);
  assert.equal(correct(t,p,run),null);assert.equal(t.assist(p,run,'fallback'),false);
  e.save(p);ctx.p=e.load();
  assert.equal(t.next(ctx.p,run),false);assert.equal(ctx.p.gold,55);
  assert.equal(ctx.p.rpg.dungeons.words.clears,1);assert.equal(ctx.p.rpg.equipped.weapon,'travelerSword');
  assert.deepEqual(Array.from(ctx.p.rpg.dungeons.words.lastIds),Array.from(run.questions,q=>q.id));
  const replay=complete(ctx,'words');
  assert.equal(replay.reward.first,false);assert.equal(replay.reward.gold,0);assert.equal(replay.reward.gearId,null);
  assert.ok(t.next(ctx.p,replay));assert.equal(t.next(ctx.p,replay),false);
  assert.equal(ctx.p.gold,55);assert.equal(ctx.p.rpg.dungeons.words.best,5);
  assert.equal(ctx.p.rpg.dungeons.words.clears,2);assert.equal(JSON.stringify(ctx.p.rpg.skills),savedSkills);
  assert.deepEqual([ctx.p.level,ctx.p.xp,ctx.p.rpg.spentPoints,ctx.p.rpg.availablePoints],snapshot);
  assert.equal(ctx.p.rpg.collection.filter(id=>id==='guardianArmor').length,1);
});
