const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=['questions','village-data','voice-data','rpg','engine','village-engine','voice-learning']
  .map(n=>fs.readFileSync(path.join(__dirname,'../src',n+'.js'),'utf8')).join('\n');
function setup(){
  const store=new Map();
  const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  return {...vm.runInNewContext(source+'\n;({r:RPG,e:Engine,v:VillageEngine,l:VoiceLearning,Q,lessons})',{localStorage}),store};
}
function turn(ctx,p,b,id='sword',correct=true){
  const task=ctx.e.select(p,b,id);
  assert.ok(task);
  const {question,choices,voiceHandle}=task;
  if(voiceHandle)ctx.l.submit(p,voiceHandle,voiceHandle.activity.answer,{mode:'text'});
  else {
    const value=correct?question.answer:choices.find(c=>c!==question.answer);
    assert.equal(ctx.e.answer(p,b,value).correct,correct);
  }
  const player=ctx.e.playerAction(p,b);
  const enemy=player.won?null:ctx.e.enemyAction(p,b);
  return {player,enemy};
}
function ready(e,level=7){return e.hydrate({version:4,started:true,level,completed:[1]});}
function clear(ctx,p,b){
  while(b.phase==='PLAYER_SELECT' && b.turn<100)turn(ctx,p,b);
  assert.equal(b.phase,'VICTORY');
  return ctx.e.reward(p,b);
}
test('Selecting and changing classes alters actual stats, clamps HP and cannot heal or erase study progress',()=>{
  const {r,e,Q}=setup(),p=e.fresh();
  assert.equal(p.rpg.classId,null);
  assert.deepEqual([...p.rpg.collection],['travelerSword']);
  assert.equal(e.stats(p).attack,12);
  e.record(p,Q[0],true);
  assert.equal(r.chooseClass(p,'unknown'),false);
  assert.ok(r.chooseClass(p,'vanguard'));
  assert.equal(p.rpg.promptSeen,true);
  assert.equal(e.stats(p).maxHp,110);assert.equal(e.stats(p).defense,4);
  p.hp=110;
  assert.ok(r.chooseClass(p,'arcanist'));
  assert.equal(p.hp,100);assert.equal(e.stats(p).magic,21);
  assert.ok(r.chooseClass(p,'pathfinder'));
  assert.equal(e.stats(p).attack,14);assert.equal(e.stats(p).defense,4);
  r.chooseClass(p,'vanguard');
  assert.equal(p.hp,100);assert.equal(p.learning.hello.correct,1);
  assert.equal(p.achievements.filter(x=>x==='firstAdventurer').length,1);
});
test('Each class has observable passives on actual successful actions; misses remain misses',()=>{
  const ctx=setup(),{r,e}=ctx;
  function encounter(id){
    const p=ready(e,1);r.chooseClass(p,id);return {p,b:e.battle(p,2)};
  }
  const knight=encounter('vanguard');
  assert.equal(turn(ctx,knight.p,knight.b,'sword',false).player.damage,0);
  assert.equal(turn(ctx,knight.p,knight.b).player.damage,13);
  assert.equal(turn(ctx,knight.p,knight.b,'guard').enemy.damage,2);
  const mage=encounter('arcanist');
  turn(ctx,mage.p,mage.b,'guard');turn(ctx,mage.p,mage.b,'guard');
  assert.equal(turn(ctx,mage.p,mage.b,'fire').player.damage,23);
  assert.equal(mage.b.cooldowns.fire,1);
  const scout=encounter('pathfinder');
  assert.equal(turn(ctx,scout.p,scout.b).player.damage,14);
  while(scout.b.hp>50)turn(ctx,scout.p,scout.b,'sword',false);
  assert.equal(turn(ctx,scout.p,scout.b,'heal').player.healing,24);
});
test('All six skills require real points, alter the corresponding combat outcomes and refund exactly once',()=>{
  const ctx=setup(),{r,e}=ctx,p=ready(e);
  assert.equal(p.rpg.availablePoints,6);
  assert.equal(r.learn(p,'flameMastery'),false);
  function hit(id){return turn(ctx,p,e.battle(p,2),id);}
  assert.equal(hit('sword').player.damage,23);
  assert.ok(r.learn(p,'swordTraining'));assert.equal(hit('voice').player.damage,27);
  assert.equal(hit('sword').player.damage,24);
  assert.ok(r.learn(p,'bladeMastery'));assert.equal(hit('sword').player.damage,25);
  assert.equal(hit('fire').player.damage,35);
  assert.ok(r.learn(p,'magicTraining'));assert.equal(hit('burst').player.damage,41);
  assert.equal(hit('fire').player.damage,37);
  assert.ok(r.learn(p,'flameMastery'));assert.equal(hit('fire').player.damage,39);
  assert.equal(hit('sword').enemy.damage,8);
  assert.ok(r.learn(p,'ironDefense'));assert.equal(hit('sword').enemy.damage,7);
  assert.ok(r.learn(p,'healingKnowledge'));
  const b=e.battle(p,2);
  for(let i=0;i<4;i++)turn(ctx,p,b,'sword',false);
  assert.equal(turn(ctx,p,b,'heal').player.healing,25);
  assert.equal(p.rpg.availablePoints,0);assert.equal(p.rpg.spentPoints,6);
  assert.equal(r.learn(p,'swordTraining'),false);
  r.chooseClass(p,'arcanist');assert.equal(p.rpg.spentPoints,6);
  assert.ok(r.resetSkills(p));assert.equal(r.resetSkills(p),false);
  assert.equal(p.rpg.availablePoints,6);assert.equal(p.rpg.spentPoints,0);
  assert.equal(hit('sword').player.damage,23);
  assert.ok(p.achievements.includes('swordApprentice'));
});
test('Equipment has valid slots, exact comparison and non-stacking stats; the shared shop commits each purchase once',()=>{
  const {r,e,v}=setup();
  const p=e.hydrate({version:4,level:4,gold:80,completed:[1,2,3],currentChapter:2});
  assert.equal(r.preview(p,'travelerSword').delta.attack,2);
  assert.equal(r.equip(p,'travelerSword','armor'),false);
  assert.equal(r.equip(p,'echoSigil'),false);
  assert.ok(r.equip(p,'travelerSword'));
  assert.equal(r.equip(p,'travelerSword'),false);
  const base=r.breakdown(p).base;
  assert.equal(e.stats(p).attack,base.attack+2);
  assert.equal(r.preview(p,'crystalBlade').delta.attack,3);
  assert.ok(r.equip(p,'crystalBlade'));assert.equal(e.stats(p).attack,base.attack+5);
  assert.equal(v.offer(p,'crystalBlade'),null);
  const first=v.offer(p,'leatherArmor'),stale=v.offer(p,'leatherArmor');
  assert.ok(v.buy(p,first));assert.equal(v.buy(p,first),false);assert.equal(v.buy(p,stale),false);
  assert.equal(p.gold,45);assert.equal(v.quantity(p,'leatherArmor'),1);
  assert.equal(v.offer(p,'leatherArmor'),null);assert.equal(v.offer(p,'scholarAmulet'),null);
  assert.ok(r.equip(p,'leatherArmor'));
  assert.ok(v.buy(p,v.offer(p,'forestCharm')));assert.ok(r.equip(p,'forestCharm'));
  assert.equal(p.gold,20);assert.ok(p.achievements.includes('wellEquipped'));
  const max=e.stats(p).maxHp;p.hp=max;
  assert.ok(r.unequip(p,'accessory'));assert.equal(p.hp,max-5);
  r.equip(p,'forestCharm');assert.equal(p.hp,max-5);
  e.save(p);
  const loaded=e.load();assert.deepEqual(e.stats(loaded),e.stats(p));
  assert.equal(loaded.rpg.equipped.weapon,'crystalBlade');
  assert.ok(v.buy(loaded,v.offer(loaded,'potion')));assert.equal(loaded.gold,0);
  assert.equal(loaded.village.inventory.potion,1);
  const veteran=e.hydrate({version:4,level:4,gold:135,completed:[1,2,3],currentChapter:2});
  for(const id of ['crystalPendant','scholarAmulet']){
    assert.ok(v.buy(veteran,v.offer(veteran,id)));
    assert.ok(r.equip(veteran,id));
    assert.equal(v.offer(veteran,id),null);
  }
  assert.equal(veteran.gold,0);
  assert.equal(r.breakdown(veteran).equipment.magic,2);
});
test('Authentic v4 campaign migrates once, older keys stay intact, and corrupted builds cannot invent points or loot',()=>{
  const {r,e,store,Q}=setup();
  const raw=fs.readFileSync(path.join(__dirname,'fixtures/v04-completed.json'),'utf8');
  const old=JSON.parse(raw);store.set(e.v4Key,raw);
  const p=e.load();
  for(const [key,value] of Object.entries(old)){
    if(key==='version')continue;
    if(key==='achievements'){assert.ok(value.every(id=>p.achievements.includes(id)));continue;}
    assert.deepEqual(JSON.parse(JSON.stringify(p[key])),value);
  }
  assert.equal(p.rpg.promptSeen,false);assert.equal(p.rpg.availablePoints,3);
  assert.ok(p.rpg.collection.includes('runicSword'));assert.ok(p.rpg.collection.includes('crystalBlade'));
  assert.ok(p.achievements.includes('wordExplorer'));assert.ok(p.achievements.includes('villageRestored'));
  r.learn(p,'swordTraining');e.save(p);
  for(let i=0;i<3;i++){const loaded=e.load();assert.equal(loaded.rpg.availablePoints,2);e.save(loaded);}
  assert.equal(store.get(e.v4Key),raw);
  const bad={...p,level:2,rpg:{availablePoints:Infinity,spentPoints:-99,skills:['bladeMastery','ironDefense','ironDefense','healingKnowledge'],
    equipped:{weapon:'echoSigil',accessory:'runicSword'},collection:{includes:4},
    dungeons:{words:{clears:-1,best:999},echoes:{clears:2,best:99,lastIds:['bad',Q[0].id]}}}};
  const repaired=e.hydrate(bad);
  assert.deepEqual([...repaired.rpg.skills],['ironDefense']);
  assert.equal(repaired.rpg.spentPoints,1);assert.equal(repaired.rpg.availablePoints,0);
  assert.equal(repaired.rpg.equipped.accessory,null);assert.equal(repaired.rpg.equipped.weapon,null);
  assert.equal(repaired.rpg.dungeons.words.clears,0);assert.equal(repaired.rpg.dungeons.echoes.best,5);
  assert.deepEqual([...repaired.rpg.dungeons.echoes.lastIds],[Q[0].id]);
});
test('All classes can earn campaign boss loot, gain points normally and remain unable to farm repeat currency',()=>{
  const ctx=setup(),{r,e,v}=ctx;
  for(const cls of r.classes){
    const p=e.fresh();r.chooseClass(p,cls.id);r.equip(p,'travelerSword');
    for(const stage of [1,2,3]){
      const first=clear(ctx,p,e.battle(p,stage));
      assert.equal(first.gearId,stage===3?'crystalBlade':null);
    }
    assert.equal(p.rpg.availablePoints,2);assert.equal(p.gold,115);
    const repeat=clear(ctx,p,e.battle(p,3));assert.equal(repeat.gearId,null);assert.equal(repeat.gold,0);
    v.selectChapter(p,2);
    for(const stage of [4,5,6]){
      v.accept(p,stage);let response;
      do{const session=v.dialogue(p,stage);response=v.reply(p,session,session.question.answer);}while(!response.done);
      const first=clear(ctx,p,e.battle(p,stage));
      assert.equal(first.gearId,stage===6?'runicSword':null);
    }
    assert.equal(p.rpg.availablePoints,p.level-1);
    assert.ok(p.achievements.includes('villageRestored'));
    const repeatBoss=clear(ctx,p,e.battle(p,6));assert.equal(repeatBoss.gold,0);assert.equal(repeatBoss.gearId,null);
  }
});
test('Dungeon checkpoints keep five authored challenges and pay only the first settlement for each room',()=>{
  const {r,e,Q}=setup(),p=e.fresh(),ids=Array.from(Q.slice(0,5),q=>q.id);
  assert.equal(r.finishDungeon(p,'words',4,['bad']),null);
  for(const key of Object.keys(r.dungeonPrizes)){
    const prize=r.dungeonPrizes[key], first=r.finishDungeon(p,key,4,ids);
    assert.ok(first.first);assert.equal(first.gearId,prize.gearId);assert.equal(first.gold,prize.gold);
    e.save(p);
    const loaded=e.load(),replay=r.finishDungeon(loaded,key,5,ids);
    assert.equal(replay.gold,0);assert.equal(replay.gearId,null);assert.equal(replay.first,false);
    assert.equal(loaded.rpg.dungeons[key].clears,2);assert.equal(loaded.rpg.dungeons[key].best,5);
    assert.equal(loaded.rpg.collection.filter(id=>id===prize.gearId).length,1);
  }
  assert.equal(p.gold,75);assert.equal(p.xp,0);
  assert.equal(p.achievements.filter(id=>id==='crystalGuardian').length,1);
});
test('Voice-only study also unlocks the expression badge and a completed dedicated review remains recognized',()=>{
  const {l,e}=setup(),p=e.fresh();
  const ids=['vs-greet','vs-seat','vs-price','vs-water','vs-locate','vs-repeat','vs-pay','vs-thanks','vc-clara-1','vc-clara-2','vc-elena-1','vl-inn'];
  for(const id of ids) assert.ok(l.introduce(p,id));
  assert.ok(p.achievements.includes('wordExplorer'));
  assert.equal(p.achievements.includes('firstReview'),false);
  const h=l.start(p,'vs-greet',{review:true});
  assert.ok(l.submit(p,h,h.activity.answer,{mode:'text'}).correct);
  assert.ok(p.achievements.includes('firstReview'));
  assert.equal(p.xp+p.gold,0);
  e.save(p);
  assert.equal(e.load().achievements.filter(id=>id==='wordExplorer').length,1);
});
