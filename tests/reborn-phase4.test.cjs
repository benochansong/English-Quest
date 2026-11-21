/* Deterministic fixtures may seed state; full browser journeys use actual input only. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=['reborn-learning.js','reborn-battlefield.js','reborn-journey.js','reborn-combat.js'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
const api=()=>vm.runInNewContext(source+';({field:RebornBattlefield,combat:RebornCombat,learning:RebornLearning})');
const step=(g,t)=>{for(let i=0;i<Math.round(t*120);i++)g.update(1/120);};
const tap=(g,k)=>{const result=g.input(k);g.input(k,false);return result;};
function solve(g,heard=true){const h=g.state.challenge;if(heard)g.heard('asset',h.id);if(h.kind!=='action')g.answer(h.target);g.proceed();}
function raven(){const a=api(),g=a.combat.create();g.selectEncounter('raven');return{...a,g};}
function until(g,predicate,seconds=30){for(let i=0;i<seconds*120;i++){if(predicate())return;if(g.state.challenge)solve(g);g.update(1/120);}assert.fail('Timed out '+g.state.enemy?.ai+' '+g.state.mode);}
test('Raven flies above sword height and ordinary sword swings miss',()=>{
 const {g}=raven();const e=g.state.enemy;g.state.player.x=e.x-65;g.state.player.facing=1;const hp=e.hp;tap(g,'attack');step(g,.5);assert.equal(e.hp,hp);assert.equal(g.state.stats.battlefield.missedAttacks,1);assert.ok(e.lift>85);
});
test('Raven deterministically telegraphs dive, sweep and moderate feather burst',()=>{
 const {g}=raven();g.state.player.invulnerable=100;const patterns=new Set(),states=new Set();for(let i=0;i<55*120;i++){if(g.state.challenge)solve(g);g.update(1/120);patterns.add(g.state.enemy.pattern);states.add(g.state.enemy.ai);assert.ok(g.state.enemy.hazards.length<=3);}
 for(const p of ['dive','sweep','feathers'])assert.ok(patterns.has(p));for(const s of ['PATROL','APPROACH','TELEGRAPH_DIVE','DIVE_ATTACK','SWEEP_ATTACK','FEATHER_BURST','RECOVERY'])assert.ok(states.has(s));
});
test('Wind first lesson freezes danger and becomes an actual interaction opportunity',()=>{
 const {g}=raven();until(g,()=>g.state.challenge?.expressionId==='wind');const time=g.state.enemy.aiTime;step(g,2);assert.equal(g.state.enemy.aiTime,time);solve(g);assert.equal(g.state.flowCue.expressionId,'wind');assert.equal(g.state.learning.wind.stage,'practice');assert.equal(g.state.learning.wind.independent,0);
 g.state.player.x=210;assert.equal(tap(g,'interact'),true);assert.equal(g.state.enemy.ai,'GROUNDED');assert.equal(g.state.learning.wind.independent,1);assert.equal(g.state.learning.wind.actual,1);assert.equal(g.state.stats.battlefield.groundings,1);
 assert.equal(tap(g,'interact'),false);assert.equal(g.state.stats.battlefield.groundings,1);
});
test('Grounded window gives real sword hits then flight resumes without permanent stun',()=>{
 const {g}=raven();until(g,()=>g.state.challenge?.expressionId==='wind');solve(g);g.state.player.x=210;tap(g,'interact');const e=g.state.enemy;g.state.player.x=e.x-70;g.state.player.facing=1;const hp=e.hp;tap(g,'attack');step(g,.4);assert.ok(e.hp<hp);step(g,6.2);assert.notEqual(e.ai,'GROUNDED');assert.ok(e.lift>85);
});
test('Missed wind instruction retains normal low recovery vulnerability and retry',()=>{
 const {g}=raven();until(g,()=>g.state.challenge?.expressionId==='wind');solve(g,false);const e=g.state.enemy;g.state.player.x=e.x-70;g.state.player.facing=1;const hp=e.hp;tap(g,'attack');step(g,.4);assert.ok(e.hp<hp);assert.equal(g.state.stats.flow.independentActions,0);step(g,7);assert.equal(g.state.learning.wind.stage,'practice');
});
test('Text help and mute cannot manufacture an independent environmental action',()=>{
 for(const muted of [false,true]){const {g}=raven();until(g,()=>g.state.challenge?.expressionId==='wind');solve(g);if(muted)g.audioEvent('muted');else g.assist('translation');g.state.player.x=210;tap(g,'interact');assert.equal(g.state.learning.wind.independent,0);assert.equal(g.state.learning.wind.lastResult,'assisted');}
});
test('Environment input is range checked and rejected after defeat, pause or restart',()=>{
 const {g}=raven();until(g,()=>g.state.challenge?.expressionId==='wind');solve(g);const id=g.state.flowCue.id;g.state.player.x=800;assert.equal(tap(g,'interact'),false);g.pause();g.state.player.x=210;assert.equal(tap(g,'interact'),false);g.restart();assert.equal(g.heard('asset',id),false);assert.equal(g.state.stage,'raven');assert.equal(g.state.stats.battlefield.groundings,0);
});
function golem(){const a=api(),g=a.combat.create();g.selectEncounter('golem');step(g,.02);return {...a,g};}
test('Golem starts shielded with three distinct colors and symbols; first instruction is safe',()=>{
 const {g}=golem(),e=g.state.enemy;assert.equal(e.shieldActive,true);assert.equal(g.state.challenge.expressionId,'blue');assert.equal(new Set(e.objects.map(o=>o.color)).size,3);assert.equal(new Set(e.objects.map(o=>o.symbol)).size,3);const x=e.x,t=e.aiTime;step(g,5);assert.equal(e.x,x);assert.equal(e.aiTime,t);
});
test('Blue activation breaks once, retains actual evidence and exposes an attackable core',()=>{
 const {g}=golem();solve(g);until(g,()=>g.state.enemy.objects[1].ready);g.state.player.x=420;assert.equal(tap(g,'interact'),true);assert.equal(g.state.stats.battlefield.shieldBreaks,1);assert.equal(g.state.enemy.shieldActive,false);assert.equal(g.state.enemy.coreExposed,true);assert.equal(g.state.learning.blue.actual,1);assert.equal(g.state.learning.blue.independent,1);assert.equal(g.state.challenge.expressionId,'crystal');solve(g);assert.equal(tap(g,'interact'),false);assert.equal(g.state.stats.battlefield.shieldBreaks,1);
});
test('Wrong color allows retry but separates corrected action from independent listening',()=>{
 const {g}=golem();solve(g);until(g,()=>g.state.enemy.objects[1].ready);g.state.player.x=180;assert.equal(tap(g,'interact'),false);assert.equal(g.state.stats.battlefield.wrongCrystals,1);assert.ok(g.state.enemy.shieldActive);g.state.player.x=420;assert.ok(tap(g,'interact'));assert.equal(g.state.learning.blue.independent,0);assert.equal(g.state.learning.blue.lastResult,'assisted');assert.equal(g.state.stats.battlefield.shieldBreaks,1);
});
test('Shielded sword has reduced nonzero damage, exposed sword gets defined bonus',()=>{
 const a=golem().g;solve(a);a.state.player.x=a.state.enemy.x-80;a.state.player.facing=1;const before=a.state.enemy.hp;tap(a,'attack');step(a,.3);assert.equal(before-a.state.enemy.hp,2);
 const b=golem().g;solve(b);until(b,()=>b.state.enemy.objects[1].ready);b.state.player.x=420;tap(b,'interact');solve(b);b.state.player.x=b.state.enemy.x-80;b.state.player.facing=1;const hp=b.state.enemy.hp;tap(b,'attack');step(b,.3);assert.equal(hp-b.state.enemy.hp,12);assert.equal(b.state.stats.combat.weaknessHits,1);assert.equal(b.state.learning.crystal.actual,1);
});
test('Shield window expires, restores state, and creates a fresh opportunity without a repeated lesson',()=>{
 const {g}=golem();solve(g);until(g,()=>g.state.enemy.objects[1].ready);g.state.player.x=420;tap(g,'interact');solve(g);const old=g.state.flowCue.id;g.state.player.invulnerable=100;step(g,7);assert.ok(g.state.enemy.shieldActive);assert.equal(g.state.enemy.coreExposed,false);assert.equal(g.state.player.weaknessCharge,0);assert.equal(g.state.challenge,null);assert.equal(g.state.flowCue.expressionId,'blue');assert.notEqual(g.state.flowCue.id,old);assert.equal(g.heard('asset',old),false);
});
test('Golem cycles fist, traveling shockwaves and pulse with automatic overload weakness',()=>{
 const {g}=golem();solve(g,false);g.state.player.invulnerable=100;const patterns=new Set(),states=new Set();let wave=false;
 for(let i=0;i<32*120;i++){if(g.state.challenge)solve(g,false);g.update(1/120);patterns.add(g.state.enemy.pattern);states.add(g.state.enemy.ai);wave||=g.state.enemy.hazards.some(h=>h.kind==='wave');}
 for(const key of ['fist','slam','pulse'])assert.ok(patterns.has(key));assert.ok(wave);assert.ok(states.has('SHIELD_BREAK'));assert.ok(g.state.stats.battlefield.shieldBreaks>=1);
});
test('Two distinct heard environmental actions promote familiarity; replay alone cannot',()=>{
 const {learning}=api(),p=learning.createProgress();p.record('blue','a',{success:true,heard:true,actual:true});assert.equal(p.entries.blue.stage,'practice');for(let i=0;i<10;i++)p.record('blue','a',{success:true,heard:true,actual:true});assert.equal(p.entries.blue.independent,1);p.record('blue','b',{success:true,heard:true,actual:true});assert.equal(p.entries.blue.stage,'familiar');
});
test('Lethal new-enemy collision cannot reopen a lesson or perform damage after defeat',()=>{
 const {g}=raven();g.state.player.hp=1;until(g,()=>g.state.enemy.ai==='DIVE_ATTACK');g.state.player.x=g.state.enemy.attackTargetX;until(g,()=>g.state.mode==='DEFEAT');const hp=g.state.player.hp;step(g,10);assert.equal(g.state.mode,'DEFEAT');assert.equal(g.state.challenge,null);assert.equal(g.state.flowCue,null);assert.equal(g.state.player.hp,hp);assert.equal(tap(g,'interact'),false);
});
function finishFixture(g){
 // Transition fixture only: isolate a final legal hit, not an end-to-end completion claim.
 if(g.state.challenge)solve(g);const e=g.state.enemy;e.hp=1;e.lift=0;e.ai='RECOVERY';e.aiTime=0;e.recoveryTotal=6;e.x=500;g.state.player.x=420;g.state.player.facing=1;g.state.player.invulnerable=100;tap(g,'attack');step(g,.3);
}
test('Story connects slime, raven and golem with one guarded advance and final victory',()=>{
 const g=api().combat.create();assert.ok(g.startStory());assert.equal(g.state.stage,'slime');assert.equal(g.advanceEncounter(),false);
 for(const [i,kind] of ['slime','raven','golem'].entries()){
  assert.equal(g.state.stage,kind);if(kind==='golem'){step(g,.02);solve(g);}finishFixture(g);assert.equal(g.state.adventure.history.length,i+1);assert.equal(g.state.encounterReport.kind,kind);
  if(i<2){assert.equal(g.state.mode,'ENCOUNTER_CLEAR');assert.ok(g.advanceEncounter());assert.equal(g.advanceEncounter(),false);g.pause();const remaining=g.state.transition.remaining;step(g,2);assert.equal(g.state.transition.remaining,remaining);g.resume();step(g,1.3);}
 }
 assert.equal(g.state.mode,'VICTORY');assert.equal(g.advanceEncounter(),false);const count=g.state.adventure.history.length;step(g,4);assert.equal(g.state.adventure.history.length,count);assert.equal(tap(g,'attack'),false);
});
test('Encounter transitions retain learning but reset health, transient attacks and local metrics',()=>{
 const g=api().combat.create();g.startStory();Object.assign(g.state.learning.wind,{introduced:true,stage:'familiar',streak:2,actual:2});g.state.player.hp=25;finishFixture(g);g.advanceEncounter();step(g,1.3);
 assert.equal(g.state.learning.wind.stage,'familiar');assert.equal(g.state.player.hp,100);assert.equal(g.state.flowCue,null);assert.equal(g.state.player.comboIndex,0);assert.equal(g.state.projectiles.length,0);assert.equal(g.state.encounterPeakCombo,0);assert.equal(g.state.encounterBase.combat.damageDealt,1);
});
test('Story restart preserves expression memory and clears journey history and stale evidence',()=>{
 const g=api().combat.create();g.startStory();finishFixture(g);g.advanceEncounter();step(g,1.3);until(g,()=>g.state.challenge?.expressionId==='wind');solve(g);const id=g.state.flowCue.id;g.restart();assert.equal(g.state.stage,'slime');assert.equal(g.state.adventure.history.length,0);assert.equal(g.state.learning.wind.introduced,true);assert.equal(g.heard('asset',id),false);
});
test('Story defeat retries the current encounter while preserving earlier completed encounters',()=>{
 const g=api().combat.create();g.startStory();finishFixture(g);g.advanceEncounter();step(g,1.3);g.state.player.hp=1;g.state.player.invulnerable=0;until(g,()=>g.state.enemy.ai==='DIVE_ATTACK');g.state.player.x=g.state.enemy.attackTargetX;until(g,()=>g.state.mode==='DEFEAT');assert.ok(g.retryEncounter());assert.equal(g.state.stage,'raven');assert.equal(g.state.adventure.index,1);assert.equal(g.state.adventure.history.length,1);assert.equal(g.state.player.hp,100);assert.equal(g.retryEncounter(),false);
});
test('New enemy movement is identical at30,60,120 updates per second',()=>{
 const positions=[30,60,120].map(fps=>{const {g}=raven();for(let i=0;i<fps;i++)g.update(1/fps);return[g.state.enemy.x,g.state.enemy.lift,g.state.enemy.ai];});assert.deepEqual(positions[0],positions[1]);assert.deepEqual(positions[1],positions[2]);
});
test('Golem crystals cannot be spammed before an attack has charged them',()=>{
 const {g}=golem();solve(g);g.state.player.x=420;for(let i=0;i<8;i++)assert.equal(tap(g,'interact'),false);assert.equal(g.state.stats.battlefield.shieldBreaks,0);until(g,()=>g.state.enemy.objects[1].ready);assert.ok(tap(g,'interact'));assert.equal(g.state.stats.battlefield.shieldBreaks,1);
});
