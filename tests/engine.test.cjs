const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(storage) {
  const items = new Map();
  const localStorage = storage || {getItem:key => items.get(key) ?? null,
    setItem:(key, value) => items.set(key,value)};
  const source = ['questions','engine','audio'].map(name =>
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
  assert.equal(Q.length,30);
  assert.equal(new Set(Q.map(q=>q.id)).size,30);
  for (const q of Q) {
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
  assert.equal(replay.xp,100);
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
  assert.equal(takeTurn(e,p,b,'fire').player.damage,17);
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
  assert.equal(turn.player.damage,20);
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
