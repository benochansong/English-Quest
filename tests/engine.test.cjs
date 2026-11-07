const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(storage) {
  const items = new Map();
  const localStorage = storage || {getItem:key => items.get(key) ?? null,
    setItem:(key, value) => items.set(key,value)};
  const source = ['questions','village-data','voice-data','rpg','engine','village-engine','voice-learning','audio'].map(name =>
    fs.readFileSync(path.join(__dirname, '../src', name+'.js'),'utf8')).join('\n');
  const api = vm.runInNewContext(source+'\n;({Engine, AudioFX, Q, lessons})', {localStorage});
  return {...api, profile:api.Engine.fresh(), items};
}
function takeTurn(engine, profile, battle, ability, right = true) {
  const {question, choices} = engine.select(profile, battle, ability);
  const wrong = question.type === 'order' ? [...question.choices].reverse().join(' ')
    : choices.find(choice => choice !== question.answer);
  const result = engine.answer(profile, battle, right ? question.answer : wrong);
  const player = engine.playerAction(profile, battle);
  const enemy = player.won ? null : engine.enemyAction(profile, battle);
  return {result, player, enemy};
}
function clear(engine, profile, stage) {
  const b = engine.battle(profile,stage);
  while (b.phase === 'PLAYER_SELECT' && b.turn <= 100) takeTurn(engine, profile, b, 'sword');
  assert.equal(b.phase,'VICTORY');
  assert.equal(b.enemyHp,0);
  assert.ok(b.hp > 0);
  return b;
}
test('All 30 questions have distinct ids, existing lesson tags and a single valid answer', () => {
  const {Q, lessons} = setup();
  const forest = Q.filter(q=>q.stage<=3);
  assert.equal(forest.length,30);
  assert.equal(new Set(forest.map(q=>q.id)).size,30);
  for (const q of forest) {
    assert.ok(q.tags.every(tag=>lessons.some(l=>l.id===tag)));
    assert.equal(q.choices.length,new Set(q.choices).size);
    if (q.type === 'order') assert.equal(q.choices.join(' ')+'.',q.answer);
    else assert.equal(q.choices.filter(c=>c===q.answer).length,1);
  }
});
test('A first-time sword-only run survives all three stages and earns the chapter bonus exactly once', () => {
  const {Engine:e, profile:p} = setup();
  p.started = true;
  assert.equal(e.battle(p,2),null);
  let last;
  for (const stage of [1,2,3]) {
    const b = clear(e,p,stage);
    assert.equal(e.enemyAction(p,b),null);
    last = e.reward(p,b);
    assert.equal(e.reward(p,b),null);
    assert.equal(e.save(p),true);
    Object.assign(p,e.load());
    assert.equal(p.unlocked,Math.min(stage+1,3));
  }
  assert.equal(last.levelUp,true);
  assert.equal(last.bonus,50);
  assert.equal(last.xp,150);
  assert.equal(p.chapterComplete,true);
  assert.equal(p.gold,115);
  assert.equal(p.level,3);
  assert.equal(p.xp,5);
  const replay = e.reward(p,clear(e,p,3));
  assert.equal(replay.bonus,0);
  assert.equal(replay.xp,0);
  assert.equal(replay.gold,0);
  assert.equal(replay.replay,true);
  assert.equal(p.xp,5);
  assert.equal(p.gold,115);
});
test('Input locking, stale encounters, fair question rotation, defeat and retry', () => {
  const {Engine:e,profile:p} = setup();
  e.teach(p,['apple','bread']);
  const stale = e.battle(p,1);
  const b = e.battle(p,1);
  assert.equal(e.select(p,stale,'sword'),null);
  assert.equal(e.select(p,b,'heal'),null);
  let last;
  while (b.phase === 'PLAYER_SELECT') {
    const {question,choices} = e.select(p,b,'sword');
    assert.notEqual(question.id,last);
    last = question.id;
    assert.ok(question.tags.includes('apple') || question.tags.includes('bread'));
    assert.equal(e.select(p,b,'sword'),null);
    assert.equal(e.answer(p,b,'arbitrary'),null);
    assert.equal(e.answer(p,b,choices.find(x=>x!==question.answer)).correct,false);
    assert.equal(e.answer(p,b,question.answer),null);
    assert.equal(e.playerAction(p,b).damage,0);
    assert.equal(e.playerAction(p,b),null);
    assert.equal(e.enemyAction(p,b).damage,5);
    assert.equal(e.enemyAction(p,b),null);
  }
  assert.equal(b.phase,'DEFEAT');
  assert.equal(p.hp,0);
  assert.equal(e.reward(p,b),null);
  assert.equal(e.save(p),true);
  assert.equal(e.load().hp,0);
  const retry = e.battle(p,1);
  assert.equal(retry.hp,100);
  assert.equal(e.status(p.learning.apple),'Review Needed');
  assert.equal(Object.keys(p.mistakes).length,2);
});
test('Healing is capped, guard reduces damage, and cooldowns count whole intervening turns', () => {
  const {Engine:e,profile:p} = setup();
  e.reward(p,clear(e,p,1));
  const b = e.battle(p,2);
  assert.equal(takeTurn(e,p,b,'heal').player.healing,0);
  assert.equal(b.cooldowns.heal,3);
  assert.equal(takeTurn(e,p,b,'fire').player.damage,18);
  assert.equal(b.cooldowns.fire,2);
  assert.equal(e.select(p,b,'fire'),null);
  assert.equal(takeTurn(e,p,b,'guard').enemy.damage,3);
  assert.equal(b.cooldowns.fire,1);
  takeTurn(e,p,b,'sword');
  assert.equal(b.cooldowns.fire,0);
  assert.equal(b.cooldowns.heal,0);
  assert.equal(takeTurn(e,p,b,'heal').player.healing,20);
  takeTurn(e,p,b,'fire',false);
  assert.equal(b.cooldowns.fire,0);
});
test('Different encounter commands select every learning format, including boss listening', () => {
  const {Engine:e,profile:p} = setup();
  e.reward(p,clear(e,p,1));
  const b = e.battle(p,2);
  const fire = takeTurn(e,p,b,'fire').result.question;
  assert.ok(fire.instruction.includes('___'));
  const translate = takeTurn(e,p,b,'sword').result.question;
  assert.ok(translate.instruction.includes('영어로'));
  const order = e.select(p,b,'heal').question;
  assert.equal(order.type,'order');
  assert.equal(e.answer(p,b,order.choices[0]),null);
  assert.ok(e.answer(p,b,order.choices.join(' ')).correct);
  e.reward(p,clear(e,p,2));
  const boss = e.battle(p,3);
  takeTurn(e,p,boss,'sword');
  assert.equal(takeTurn(e,p,boss,'sword').enemy.damage,0);
  const turn = takeTurn(e,p,boss,'sword');
  assert.equal(turn.result.question.type,'listening');
  assert.equal(turn.player.damage,22);
});
test('A reviewed mistake can become familiar, and combat statistics are independent', () => {
  const {Engine:e,Q,profile:p} = setup();
  const q = Q[0];
  assert.equal(e.status(p.learning.hello),'New');
  e.record(p,q,false);
  e.record(p,q,true);
  assert.equal(e.status(p.learning.hello),'Review Needed');
  e.record(p,q,true);
  assert.equal(e.status(p.learning.hello),'Learning');
  e.record(p,q,true);
  assert.equal(e.status(p.learning.hello),'Familiar');
  assert.equal(p.mistakes[q.id],1);
  assert.equal(p.xp,0);
});
test('Malformed, missing, invalid and unavailable saves return a safe checkpoint', () => {
  const {Engine:e, items} = setup();
  assert.equal(e.load().started,false);
  items.set(e.saveKey,'{');
  assert.equal(e.load().level,1);
  items.set(e.saveKey,JSON.stringify({version:1,hp:9999,level:0,unlocked:3,completed:[3],
    xp:-1,gold:'coins',settings:{volume:4,voice:'false'},learning:{water:{wrong:-50}}}));
  const p = e.load();
  assert.equal(p.unlocked,1); assert.equal(p.chapterComplete,false); assert.equal(p.hp,100);
  assert.equal(p.gold,0); assert.equal(p.xp,0); assert.equal(p.settings.volume,1);
  assert.equal(p.learning.water.wrong,0); assert.equal(p.settings.voice,true);
  const inaccessible = setup({getItem(){throw Error();},setItem(){throw Error();}}).Engine;
  assert.equal(inaccessible.load().level,1);
  assert.equal(inaccessible.save(inaccessible.fresh()),false);
});
test('Offline audio has a safe text fallback when voices and sound output are absent', () => {
  const {AudioFX:a,profile:p} = setup();
  assert.equal(a.canSpeak(p.settings),false);
  assert.equal(a.speak('Hello',p.settings),false);
  a.play('fire',p.settings);
  a.stop();
});

test('v1 progress migrates to a separate v7 checkpoint and never changes the legacy bytes', () => {
  const {Engine:e,items} = setup();
  const legacy = {version:1, started:true, level:5, xp:78, gold:844, hp:36,
    completed:[1,2,3], unlocked:3, chapterComplete:true,
    learning:{hello:{seen:true, correct:12, wrong:2, streak:4}}, mistakes:{v0:2},
    settings:{sound:false, voice:true, volume:.15}};
  const original = JSON.stringify(legacy);
  items.set(e.legacyKey, original);
  const profile = e.load();
  assert.equal(profile.version,7);
  for (const [key, value] of Object.entries(legacy)) {
    if (key === 'settings') assert.deepEqual(JSON.parse(JSON.stringify(profile.settings)),{...value,speechRate:'normal',speechVolume:1});
    else if (key !== 'version') assert.deepEqual(JSON.parse(JSON.stringify(profile[key])), value);
  }
  assert.equal(profile.achievements.join(','),'firstVictory,forestClear');
  assert.equal(e.reviewList(profile)[0].due,true);
  assert.equal(JSON.parse(items.get(e.saveKey)).version,7);
  profile.gold++;
  e.save(profile);
  assert.equal(e.load().gold,845);
  assert.equal(items.get(e.legacyKey),original);
  items.set(e.saveKey,'damaged');
  assert.equal(e.load().gold,844);
  assert.equal(items.get(e.legacyKey),original);
  const future = JSON.stringify({version:8, gold:9999});
  items.set(e.saveKey,future);
  const fallback = e.load();
  assert.equal(e.save(fallback),false);
  assert.equal(items.get(e.saveKey),future);
  assert.equal(items.get(e.legacyKey),original);
});

test('Bookmarks and missed questions support one answer per review with offline 1/3/7/14-day scheduling', () => {
  const {Engine:e,profile:p,Q} = setup();
  const start = Date.UTC(2026,10,6,13,30);
  const q = Q.find(item => item.id === 'o0');
  // Keep the first mistake on the same simulated clock as the later reviews.
  // A real current date would make this an early review after November 6, 2026.
  e.record(p,q,false,{now:start});
  assert.equal(e.mark(p,'water'),true);
  assert.equal(e.reviewList(p,start).length,2);
  assert.equal(e.mark(p,'water'),false);
  assert.equal(e.reviewList(p,start).length,1);
  assert.equal(e.startReview(p,'v0'),null);
  const stale = e.startReview(p,q.id);
  const current = e.startReview(p,q.id);
  assert.equal(e.answerReview(p,stale,q.answer,start),null);
  assert.equal(e.answerReview(p,current,'I',start),null);
  let now = start;
  for (const [index, days] of [1,3,7,14].entries()) {
    const session = index === 0 ? current : e.startReview(p,q.id);
    const result = e.answerReview(p,session,q.choices.join(' '),now);
    assert.equal(result.correct,true);
    assert.equal(e.answerReview(p,session,q.answer,now),null);
    const expected=new Date(now);
    expected.setDate(expected.getDate()+days); expected.setHours(0,0,0,0);
    assert.equal(result.dueAt,expected.getTime());
    assert.equal(e.reviewList(p,result.dueAt-1)[0].due,false);
    assert.equal(e.reviewList(p,result.dueAt)[0].due,true);
    now = result.dueAt;
  }
  const retry = e.startReview(p,q.id);
  assert.equal(e.answerReview(p,retry,[...q.choices].reverse().join(' '),now).dueAt,now);
  e.save(p);
  const loaded = e.load();
  assert.equal(loaded.learning.iwant.correct,4);
  assert.equal(loaded.learning.iwant.wrong,2);
  assert.equal(loaded.schedule.o0.step,0);
  assert.equal(loaded.achievements.join(','),'firstReview');
  assert.equal(loaded.xp+loaded.gold,0);
});

test('Combo bonuses round once, cap at four, reset on mistakes, and never exceed remaining HP', () => {
  const {Engine:e,profile:p} = setup();
  const b = e.battle(p,1);
  for (const [i, damage] of [12,13,13,14].entries()) {
    const before = b.enemyHp;
    const turn = takeTurn(e,p,b,'sword');
    assert.equal(b.combo,i+1);
    assert.equal(turn.player.damage,damage);
    assert.equal(turn.player.comboBonus,damage-12);
    assert.equal(before-b.enemyHp,damage);
  }
  assert.equal(e.bonusPercent(5),15);
  const end = takeTurn(e,p,b,'sword');
  assert.equal(b.combo,4);
  assert.equal(end.player.comboBonus,0);
  assert.equal(end.player.damage,3);
  const next = e.battle(p,1);
  for (let i=0;i<3;i++) takeTurn(e,p,next,'sword');
  takeTurn(e,p,next,'sword',false);
  assert.equal(next.combo,0);
  assert.equal(takeTurn(e,p,next,'sword').player.damage,12);
  assert.equal(p.achievements.filter(id=>id==='combo3').length,1);
});

test('A level-one player can defeat both boss phases with no accuracy combo', () => {
  const {Engine:e,profile:p} = setup();
  e.reward(p,clear(e,p,1)); e.reward(p,clear(e,p,2));
  const b = e.battle(p,3);
  assert.equal(p.level,1);
  const moves = ['fire','wrong','guard','wrong','fire','wrong','heal','wrong','fire',
    'wrong','heal','wrong','sword','wrong','fire','wrong','wrong','fire'];
  const hitPhases = new Set();
  for (const [index, move] of moves.entries()) {
    const turn = index + 1;
    const phase = b.bossPhase;
    assert.equal(e.charging(b),turn%3 === 2);
    assert.equal(e.heavy(b),turn%3 === 0);
    const result = takeTurn(e,p,b,move === 'wrong' ? 'sword' : move,move !== 'wrong');
    assert.ok(b.combo <= 1);
    if (result.enemy?.charging) assert.equal(result.enemy.damage,0);
    if (result.enemy?.heavy) hitPhases.add(phase);
    if (turn === 3) {
      assert.equal(result.enemy.prevented,9);
      assert.equal(result.enemy.damage,6);
      assert.equal(b.counterReady,true);
    }
    if (turn === 5) assert.equal(result.player.counterBonus,12);
  }
  assert.equal(b.phase,'VICTORY');
  assert.ok(b.hp>0);
  assert.equal(hitPhases.size,2);
  assert.equal(p.achievements.filter(id=>id==='firstSpell').length,1);
});

test('Adaptive selection favors a due mistake without sacrificing spacing or fresh questions', () => {
  const {Engine:e,profile:p,Q} = setup();
  const vocabulary = Q.filter(q => q.type === 'vocab');
  e.teach(p,vocabulary.flatMap(q=>q.tags));
  for (let i=0;i<4;i++) e.record(p,vocabulary[3],false);
  e.record(p,vocabulary[0],true);
  e.record(p,vocabulary[1],true);
  const b=e.battle(p,1);
  const observed=[];
  for (let i=0;i<5;i++) {
    const {question} = e.select(p,b,'sword',()=>0);
    if (!i) assert.equal(question.id,vocabulary[3].id);
    assert.ok(!observed.slice(-2).includes(question.id));
    observed.push(question.id);
    e.answer(p,b,question.answer);
    e.playerAction(p,b); e.enemyAction(p,b);
  }
  assert.ok(new Set(observed).size>=4);
});

test('Dashboard separates in-game answer history from RPG rewards and persists the trend', () => {
  const {Engine:e,profile:p,Q} = setup();
  assert.equal(e.dashboard(p).accuracy,null);
  for (const correct of [false,false,false,true,true,true,true,true,true,true]) e.record(p,Q[0],correct);
  e.mark(p,'bread');
  e.save(p);
  const progress = e.dashboard(e.load());
  assert.equal(progress.encountered,2);
  assert.equal(progress.attempts,10);
  assert.equal(progress.accuracy,70);
  assert.equal(progress.recentChange,60);
  assert.equal(progress.reviewNeeded,1);
  assert.equal(progress.familiar,1);
  assert.equal(progress.completedStages,0);
});

test('A migrated level-25 hero gets a scaled replay with the correct phase threshold and no new rewards', () => {
  const {Engine:e, items} = setup();
  const old = {version:1, started:true, level:25, xp:32, gold:9088, hp:275, completed:[1,2,3]};
  items.set(e.legacyKey,JSON.stringify(old));
  const p = e.load();
  const b = e.battle(p,3);
  assert.equal(b.enemyMaxHp,621);
  assert.equal(b.enemyHp,b.enemyMaxHp);
  assert.equal(takeTurn(e,p,b,'sword').enemy.damage,34);
  assert.equal(takeTurn(e,p,b,'sword').enemy.damage,0);
  assert.equal(takeTurn(e,p,b,'sword').enemy.damage,47);
  assert.equal(b.bossPhase,1);
  takeTurn(e,p,b,'sword');
  assert.ok(b.enemyHp <= b.enemyMaxHp/2 && b.enemyHp > e.enemies[2].hp/2);
  assert.equal(b.bossPhase,2);
  takeTurn(e,p,b,'sword');
  assert.equal(takeTurn(e,p,b,'guard').enemy.damage,21);
  while (b.phase === 'PLAYER_SELECT') takeTurn(e,p,b,'sword');
  const rewards = e.reward(p,b);
  assert.ok(rewards.replay);
  assert.equal(rewards.xp+rewards.gold,0);
  e.save(p);
  assert.equal(e.load().level,old.level);
  assert.equal(e.load().gold,old.gold);
  assert.equal(e.load().xp,old.xp);
  assert.equal(items.get(e.legacyKey),JSON.stringify(old));
  const firstAttempt = e.battle(e.hydrate({...old, completed:[1,2]}),3);
  assert.equal(firstAttempt.enemyMaxHp,150);
  assert.equal(firstAttempt.incomingScale,1);
});
