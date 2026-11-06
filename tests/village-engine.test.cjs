const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = ['questions','village-data','voice-data','engine','village-engine','voice-learning']
  .map(file => fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8')).join('\n');
function setup() {
  const storage = new Map();
  const localStorage = {getItem:key=>storage.get(key) ?? null, setItem:(k,v)=>storage.set(k,v)};
  const api = vm.runInNewContext(source+'\n;({e:Engine,v:VillageEngine,content:VillageData,Q,lessons})',{localStorage});
  return {...api,p:api.e.fresh(),storage};
}
function turn(ctx, b, ability = 'sword', wrong = false, random) {
  const {e,p} = ctx;
  const task = e.select(p,b,ability,random);
  assert.ok(task);
  const {question,choices} = task;
  const mistake = question.type === 'order' ? [...question.choices].reverse().join(' ') : choices.find(c=>c!==question.answer);
  const result = e.answer(p,b,wrong ? mistake : question.answer);
  assert.equal(result.correct,!wrong);
  if (result.retry) return {question,result};
  const player = e.playerAction(p,b);
  const enemy = player.won ? null : e.enemyAction(p,b);
  return {question,result,player,enemy};
}
function win(ctx, b) {
  while (b.phase === 'PLAYER_SELECT' && b.turn < 100) turn(ctx,b);
  assert.equal(b.phase,'VICTORY');
  return ctx.e.reward(ctx.p,b);
}
function clearForest(ctx) {
  ctx.p.started = true;
  for (const stage of [1,2,3]) win(ctx,ctx.e.battle(ctx.p,stage));
  assert.ok(ctx.v.selectChapter(ctx.p,2));
}
function talk(ctx, stage) {
  let result;
  do {
    const session = ctx.v.dialogue(ctx.p,stage);
    assert.ok(session);
    result = ctx.v.reply(ctx.p,session,session.question.answer);
  } while (!result.done);
}
function unlock(ctx, stage) {
  assert.ok(ctx.v.accept(ctx.p,stage));
  talk(ctx,stage);
}
test('A new adventurer finishes both chapters, resumes mid-dialogue, practices wrong replies and earns each quest once', () => {
  const ctx = setup(), {e,v,content} = ctx;
  assert.equal(v.selectChapter(ctx.p,2),false);
  assert.equal(e.battle(ctx.p,4),null);
  clearForest(ctx);
  assert.equal(ctx.p.gold,115);
  const wrongIds=[];
  for (const quest of content.quests) {
    const {stage} = quest;
    assert.equal(v.status(ctx.p,stage),'available');
    assert.equal(v.status(ctx.p,stage+1),'locked');
    assert.equal(v.dialogue(ctx.p,stage),null);
    assert.equal(v.accept(ctx.p,stage),true);
    assert.equal(v.accept(ctx.p,stage),false);
    const expired = v.dialogue(ctx.p,stage);
    const first = v.dialogue(ctx.p,stage);
    assert.equal(v.reply(ctx.p,expired,expired.question.answer),null);
    const wrong = first.choices.find(x=>x!==first.question.answer);
    const result = v.reply(ctx.p,first,wrong);
    assert.equal(result.correct,false);
    assert.equal(result.option.text,wrong);
    assert.ok(result.option.reply && result.option.why);
    assert.equal(v.reply(ctx.p,first,first.question.answer),null);
    assert.equal(v.summary(ctx.p,stage).wrong,1);
    assert.equal(e.battle(ctx.p,stage),null);
    wrongIds.push(first.question.id);
    const retry = v.dialogue(ctx.p,stage);
    assert.equal(retry.step,0);
    assert.ok(v.reply(ctx.p,retry,retry.question.answer).correct);
    assert.ok(e.save(ctx.p)); ctx.p=e.load();
    assert.equal(v.dialogue(ctx.p,stage).step,1);
    talk(ctx,stage);
    assert.equal(v.status(ctx.p,stage),'ready');
    const before = ctx.p.gold;
    const b = e.battle(ctx.p,stage), prize = win(ctx,b);
    assert.equal(prize.gold,quest.gold);
    assert.equal(prize.xp,quest.xp);
    assert.equal(e.reward(ctx.p,b),null);
    const summary = v.summary(ctx.p,stage);
    assert.ok(summary.correct > 3 && summary.tags.length >= 2);
    assert.equal(summary.reviewTags.includes(first.question.tags[0]),true);
    assert.equal(v.status(ctx.p,stage),'complete');
    const replay = win(ctx,e.battle(ctx.p,stage));
    assert.equal(replay.xp+replay.gold,0);
    talk(ctx,stage);
    assert.deepEqual(v.summary(ctx.p,stage),summary);
    assert.equal(ctx.p.gold,before+quest.gold);
  }
  assert.equal(ctx.p.completed.join(','),'1,2,3');
  assert.equal(ctx.p.chapterComplete,true);
  for (const id of wrongIds) assert.ok(e.startReview(ctx.p,id));
  talk(ctx,'scenario'); talk(ctx,'scenario');
  e.save(ctx.p); ctx.p = e.load();
  assert.ok(ctx.p.village.scenarioComplete);
  assert.equal(ctx.p.achievements.filter(a=>a==='villageVoice').length,1);
  assert.ok(v.selectChapter(ctx.p,1));
  assert.equal(e.battle(ctx.p,6),null);
  assert.equal(e.battle(ctx.p,1).phase,'PLAYER_SELECT');
});
test('All 36 fresh battle questions can actually be drawn, evaluated and solved during unlocked battles', () => {
  const ctx=setup(), {Q,lessons,e,p,v}=ctx;
  const curriculum = Q.filter(q=>q.chapter===2 && q.type!=='dialogue');
  assert.equal(new Set(Q.map(q=>q.id)).size,Q.length);
  assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
  for (const [type,n] of [['vocab',10],['sentence',10],['order',8],['listening',8]]) {
    assert.equal(curriculum.filter(q=>q.type===type).length,n);
  }
  for (const q of curriculum) {
    assert.ok(q.tags.every(tag=>lessons.some(l=>l.id===tag)));
    assert.ok(q.instruction && q.explanation && q.difficulty);
    if (q.type !== 'order') assert.equal(q.choices.filter(x=>x===q.answer).length,1);
  }
  clearForest(ctx);
  let seed=41;
  const random=()=>{ seed=(Math.imul(1664525,seed)+1013904223) >>> 0; return seed / 4294967296; };
  const observed=new Set();
  for (const stage of [4,5,6]) {
    unlock(ctx,stage);
    for (let attempt=0;attempt<24;attempt++) {
      const b=e.battle(p,stage);
      while (b.phase==='PLAYER_SELECT' && b.turn<65) {
        const abilities=['sword','sword','fire','heal','guard'].filter(a=>e.available(b,a));
        const ability=abilities[Math.floor(random()*abilities.length)];
        const {question}=turn(ctx,b,ability,false,random);
        observed.add(question.id);
      }
      if (b.phase==='VICTORY') e.reward(p,b);
    }
    assert.equal(v.status(p,stage),'complete');
  }
  assert.deepEqual([...observed].sort(),Array.from(curriculum,q=>q.id).sort());
});
test('Dives, pulses, and Broken Sentence use distinct predictable turn rules and safe retries', () => {
  const ctx=setup(),{p,e}=ctx;
  clearForest(ctx);
  unlock(ctx,4);
  const crow=e.battle(p,4);
  assert.equal(turn(ctx,crow).enemy.damage,8);
  turn(ctx,crow);
  assert.equal(e.diving(crow),true);
  assert.equal(turn(ctx,crow).enemy.damage,12);
  win(ctx,crow);
  unlock(ctx,5);
  const wisp=e.battle(p,5);
  turn(ctx,wisp);
  const pulse=turn(ctx,wisp);
  assert.equal(pulse.question.type,'listening');
  assert.ok(pulse.enemy.pulse);
  win(ctx,wisp);
  unlock(ctx,6);
  const b=e.battle(p,6);
  turn(ctx,b); turn(ctx,b);
  const hp=b.hp, foe=b.enemyHp;
  assert.ok(e.golemBreak(b));
  const miss=turn(ctx,b,'sword',true);
  assert.equal(miss.question.type,'order');
  assert.ok(miss.result.retry);
  assert.equal(e.playerAction(p,b),null);
  assert.equal(e.enemyAction(p,b),null);
  assert.equal(b.turn,3);
  assert.equal(b.hp,hp);
  assert.equal(b.enemyHp,foe);
  const retry=e.retryBroken(p,b);
  assert.equal(retry.question.id,miss.question.id);
  assert.equal(e.retryBroken(p,b),null);
  assert.ok(e.answer(p,b,retry.question.choices.join(' ')).correct);
  assert.ok(e.playerAction(p,b).damage>0);
  const response=e.enemyAction(p,b);
  assert.ok(response.interrupted);
  assert.equal(response.damage,0);
  assert.equal(b.turn,4);
  assert.ok(e.startReview(p,miss.question.id));
});
test('A purchase is a single-use quote; carry limits, insufficient funds, effect duration and HP caps hold', () => {
  const ctx=setup(), {e,v,p}=ctx;
  assert.equal(v.offer(p,'potion'),null);
  clearForest(ctx);
  const first=v.offer(p,'potion'), stale=v.offer(p,'potion');
  assert.ok(v.buy(p,first));
  assert.equal(v.buy(p,first),false);
  assert.equal(v.buy(p,stale),false);
  for(let i=0;i<2;i++) assert.ok(v.buy(p,v.offer(p,'potion')));
  assert.equal(v.offer(p,'potion'),null);
  assert.ok(v.buy(p,v.offer(p,'charm')));
  assert.equal(v.offer(p,'charm'),null);
  assert.equal(v.offer(p,'cloak'),null);
  assert.equal(p.gold,5);
  unlock(ctx,4);
  const b=e.battle(p,4);
  assert.equal(e.useItem(p,b,'potion'),null);
  turn(ctx,b);
  assert.equal(e.useItem(p,b,'potion').healing,8);
  assert.equal(b.hp,e.stats(p).maxHp);
  assert.equal(e.useItem(p,b,'potion'),null);
  assert.equal(p.village.inventory.potion,2);
  e.enemyAction(p,b);
  assert.ok(e.useItem(p,b,'charm').guard);
  assert.equal(e.enemyAction(p,b).damage,9);
  assert.equal(turn(ctx,b).enemy.damage,5);
  win(ctx,b);
  const replay=e.battle(p,4);
  assert.equal(replay.charm,false);
  assert.equal(turn(ctx,replay).enemy.damage,8);
  unlock(ctx,5);win(ctx,e.battle(p,5));
  const oldMax=e.stats(p).maxHp;
  assert.ok(v.buy(p,v.offer(p,'cloak')));
  assert.equal(e.stats(p).maxHp,oldMax+6);
  assert.equal(v.offer(p,'cloak'),null);
  e.save(p);
  const saved=e.load();
  assert.equal(saved.village.inventory.cloak,1);
  assert.equal(saved.village.inventory.potion,2);
  assert.equal(e.stats(saved).maxHp,oldMax+6);
});
test('A missed-question training battle reinforces learning without quest progress or loot', () => {
  const ctx=setup(), {p,e,v,Q}=ctx;
  clearForest(ctx);
  assert.equal(e.training(p),null);
  const q=Q.find(q=>q.id==='clara-price');
  e.record(p,q,false);
  const before = [p.gold,p.xp,p.level,p.hp];
  const practice=e.training(p);
  assert.equal(practice.stage,4);
  assert.ok(practice.training);
  while(practice.phase==='PLAYER_SELECT') {
    const {question}=turn(ctx,practice);
    assert.equal(question.id,q.id);
  }
  assert.equal(e.reward(p,practice).gold,0);
  assert.equal(e.reward(p,practice),null);
  assert.deepEqual([p.gold,p.xp,p.level,p.hp],before);
  assert.ok(p.learning[q.tags[0]].correct>=3);
  assert.equal(v.status(p,4),'available');
});
test('Actual v2 shape migrates ahead of v1, missing/invalid v3 fields are repaired and old bytes are never rewritten', () => {
  const {e,storage,v}=setup();
  const legacy={version:2,started:true,level:3,xp:5,gold:115,hp:53,completed:[1,2,3],
    unlocked:3,chapterComplete:true,learning:{water:{seen:true,correct:2,wrong:1,streak:2}},mistakes:{v3:1},
    marked:['water'],schedule:{v3:{step:1,dueAt:1794048840000}},history:[{id:'v3',correct:true}],
    achievements:['firstVictory','firstSpell','forestClear'],settings:{sound:false,voice:false,volume:.27}};
  const bytes=JSON.stringify(legacy);
  storage.set(e.legacyKey,JSON.stringify({version:1,gold:3}));
  storage.set(e.v2Key,bytes);
  const migrated=e.load();
  assert.equal(migrated.version,4);
  for (const [key,value] of Object.entries(legacy)) {
    if (key==='version') continue;
    const expected=key==='settings' ? {...value,speechRate:'normal',speechVolume:1} : value;
    assert.deepEqual(JSON.parse(JSON.stringify(migrated[key])),expected);
  }
  assert.equal(migrated.currentChapter,1);
  assert.equal(v.status(migrated,4),'available');
  migrated.currentChapter=2;
  migrated.village.inventory={potion:50,charm:-1,cloak:'false'};
  migrated.village.progress[6].completed=true;
  migrated.village.scenarioComplete=true;
  migrated.settings.speechRate='slow';
  e.save(migrated);
  const repaired=e.load();
  assert.equal(repaired.village.inventory.potion,3);
  assert.equal(repaired.village.inventory.charm,0);
  assert.equal(repaired.village.inventory.cloak,0);
  assert.equal(v.status(repaired,6),'locked');
  assert.equal(repaired.village.scenarioComplete,false);
  assert.equal(repaired.settings.speechRate,'slow');
  assert.equal(storage.get(e.v2Key),bytes);
  assert.equal(JSON.parse(storage.get(e.legacyKey)).gold,3);
});
