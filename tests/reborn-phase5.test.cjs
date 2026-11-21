/* Isolated deterministic fixtures; browser journeys never seed combat state. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=['reborn-learning.js','reborn-battlefield.js','reborn-journey.js','reborn-combat.js'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
const api=()=>vm.runInNewContext(source+';RebornCombat');
const step=(g,t)=>{for(let i=0;i<Math.round(t*120);i++)g.update(1/120);};
const tap=(g,k)=>{const ok=g.input(k);g.input(k,false);return ok;};
function arena(){const g=api().create({flow:false});g.selectEncounter('slime');g.state.player.x=400;g.state.enemy.x=480;g.state.enemy.hp=g.state.enemy.maxHp=500;return g;}
function until(g,p){for(let i=0;i<6000;i++){if(p())return;g.update(1/120);}assert.fail('not reached');}
test('P5: a distinct press at25ms buffers exactly one next strike, holds and finisher cannot loop',()=>{
 const g=arena();g.input('attack');step(g,.025);assert.equal(g.input('attack'),false);g.input('attack',false);assert.ok(tap(g,'attack'));assert.equal(tap(g,'attack'),false);step(g,1.4);assert.equal(g.state.stats.combat.swordHits,2);assert.equal(g.state.player.comboIndex,0);
});
test('P5: sound starts with the active arc and contact freezes a visible blade pose with exact damage',()=>{
 const g=arena();g.drainEvents();tap(g,'attack');assert.ok(!g.drainEvents().some(e=>e.id==='sword1'));step(g,.05);assert.equal(g.state.stats.combat.damageDealt,0);until(g,()=>g.state.hitStop>0);
 assert.equal(g.state.stats.combat.damageDealt,8);assert.ok(g.state.player.poseTime>0);assert.ok(g.drainEvents().some(e=>e.id==='sword1'));const pose=g.state.player.poseTime;step(g,.025);assert.equal(g.state.player.poseTime,pose);assert.equal(g.state.stats.combat.swordHits,1);
});
test('P5: empty dodge creates no counter; a real collision opens a bounded single counter opportunity',()=>{
 const g=api().create({flow:false});g.selectEncounter('slime');tap(g,'dodge');step(g,.8);assert.equal(g.state.player.counterRemaining,0);
 g.state.player.x=60;g.state.player.facing=-1;g.state.enemy.x=180;until(g,()=>g.state.enemy.ai==='ATTACK');step(g,.4);tap(g,'dodge');until(g,()=>g.state.enemy.ai==='RECOVERY');assert.ok(g.state.player.counterRemaining>0);
 const remaining=g.state.player.counterRemaining;g.pause();step(g,2);assert.equal(g.state.player.counterRemaining,remaining);g.resume();step(g,.16);
 g.state.enemy.x=g.state.player.x+70;g.state.player.facing=1;tap(g,'attack');step(g,.1);assert.equal(g.state.stats.combat.counterattacks,1);assert.equal(g.state.player.counterRemaining,0);step(g,.4);tap(g,'attack');step(g,.1);assert.equal(g.state.stats.combat.counterattacks,1);
});
test('P5: missed counter expires and scene reset removes it without changing dodge invulnerability',()=>{
 const g=arena();g.state.player.counterRemaining=1.2;step(g,1.3);assert.equal(g.state.player.counterRemaining,0);assert.equal(api().CONFIG.dodge.invulnerability,.18);g.state.player.counterRemaining=1;g.restart();assert.equal(g.state.player.counterRemaining,0);
});
test('P5: each new golem attack resets perfect-dodge eligibility even while the blue instruction remains active',()=>{
 const g=api().create();g.selectEncounter('golem');step(g,.02);g.proceed();assert.equal(g.state.flowCue.expressionId,'blue');
 for(let n=1;n<=2;n++){
  const e=g.state.enemy;Object.assign(e,{ai:'APPROACH',aiTime:1.2,cycle:0});Object.assign(g.state.player,{x:60,facing:-1,dodgeCooldown:0});
  until(g,()=>e.ai==='FIST_ATTACK');tap(g,'dodge');step(g,.16);assert.equal(g.state.stats.combat.perfectDodges,n);step(g,.6);
 }
 assert.equal(g.state.player.hp,100);assert.equal(g.state.stats.flow.independentActions,0);
});
test('P5: golem absorbs70% of sword displacement while actual shield damage stays correct',()=>{
 const g=api().create();g.selectEncounter('golem');step(g,.02);g.proceed();g.state.enemy.ai='RECOVERY';g.state.enemy.aiTime=0;g.state.player.x=650;g.state.enemy.x=720;g.state.player.facing=1;tap(g,'attack');step(g,.075);
 assert.ok(Math.abs(g.state.enemy.x-722.4)<.01);assert.equal(g.state.stats.combat.damageDealt,2);assert.equal(g.state.enemy.recoilTier,1);
});
test('P5: clear replay replaces the current story result, preserves earlier history and creates no duplicate reward',()=>{
 const g=api().create();g.startStory();g.state.player.x=620;g.state.enemy.x=690;g.state.enemy.hp=1;tap(g,'attack');step(g,.1);assert.equal(g.state.adventure.history.length,1);assert.ok(g.state.presentationRemaining>0);g.skipPresentation();assert.equal(g.state.presentationRemaining,0);assert.ok(g.retryEncounter());assert.equal(g.state.adventure.history.length,0);assert.equal(g.state.stage,'slime');assert.equal(g.state.stats.combat.damageDealt,0);assert.equal(g.retryEncounter(),false);
});
