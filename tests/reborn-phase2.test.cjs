const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=['reborn-learning.js','reborn-combat.js'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
const copy=x=>JSON.parse(JSON.stringify(x));
function setup(extra={}){const api=vm.runInNewContext(source+'\n;({c:RebornCombat,l:RebornLearning})',extra);return {...api,g:api.c.create()};}
function tap(g,k){const r=g.input(k);g.input(k,false);return r;}
function step(g,seconds,fps=120){for(let i=0;i<Math.round(seconds*fps);i++)g.update(1/fps);}
function solve(g,{audio=false,aid=null,wrong=false}={}){
  const h=g.state.challenge;assert.ok(h);if(audio)g.heard('browser-fallback');if(aid)g.assist(aid);
  if(wrong){assert.equal(g.answer(h.kind==='magic'?'fire need I':h.target==='left'?'right':'left').correct,false);g.proceed();}
  assert.equal(g.answer(h.target).correct,true);g.proceed();
}
function until(g,fn,{seconds=30,learn=false,protect=false}={}){
  for(let i=0;i<seconds*120;i++){if(fn())return;if(learn&&g.state.challenge)solve(g);if(protect)g.state.player.invulnerable=1;g.update(1/120);}
  assert.fail('not reached: '+g.state.mode+'/'+g.state.enemy?.ai+'/'+g.state.enemy?.pattern);
}
function start(){const a=setup();a.g.start(true);a.g.proceed();return a;}
// Stationary high-HP collision fixture isolates combo timing from scripted teaching.
function arena(){const a=start(),s=a.g.state;s.player.x=400;s.enemy.x=480;s.enemy.hp=s.enemy.maxHp=500;return a;}
function boss({intro=false}={}){
  const a=start(),g=a.g;
  for(let i=0;i<30&&g.state.stage==='slime';i++){
    if(g.state.challenge){solve(g);continue;}step(g,.6);if(g.state.challenge)continue;
    g.state.player.x=400;g.state.player.facing=1;g.state.enemy.x=480;tap(g,'attack');step(g,.18);
  }
  assert.equal(g.state.stage,'crystal');g.proceed();solve(g);assert.equal(g.state.mode,'BOSS_INTRO');if(!intro)g.proceed();return a;
}
function combo(g){
  assert.ok(tap(g,'attack'));until(g,()=>g.state.player.pose==='attack_swing');assert.ok(tap(g,'attack'));
  until(g,()=>g.state.player.comboIndex===2&&g.state.player.pose==='attack_swing');assert.ok(tap(g,'attack'));
  until(g,()=>g.state.player.comboIndex===3&&g.state.player.pose==='attack_swing');
}
function core(){const a=boss(),g=a.g;until(g,()=>g.state.challenge?.expressionId==='crystal',{protect:true});return a;}

test('P2: the three connected sword strikes deal 8/10/16 and award a real three-hit chain once',()=>{
  const {g}=arena();combo(g);assert.equal(g.state.enemy.hp,466);assert.equal(g.state.stats.combat.damageDealt,34);assert.equal(g.state.stats.combat.swordHits,3);assert.equal(g.state.stats.combat.highestCombo,3);
  assert.deepEqual(Array.from(g.state.stats.goals),['combo-three']);step(g,.8);assert.equal(g.state.stats.goals.filter(x=>x==='combo-three').length,1);
});
test('P2: a single buffer opens with the swing, ignores early or duplicate input, and never repeats a held key',()=>{
  const {g}=arena();assert.ok(g.input('attack'));g.input('attack',false);assert.equal(tap(g,'attack'),false);step(g,.075);assert.ok(g.input('attack'));assert.equal(g.state.player.comboBuffered,true);
  for(let i=0;i<50;i++)assert.equal(g.input('attack'),false);until(g,()=>g.state.player.comboIndex===2);step(g,1.5);assert.equal(g.state.stats.combat.swordHits,2);assert.equal(g.state.player.comboIndex,0);
});
test('P2: the generous continuation window expires and a finisher cannot buffer an infinite new chain',()=>{
  const {g,c}=arena();tap(g,'attack');until(g,()=>g.state.player.comboWindowRemaining>0);assert.equal(g.state.player.comboNext,2);step(g,c.CONFIG.sword.comboWindow+.02);assert.ok(tap(g,'attack'));assert.equal(g.state.player.comboIndex,1);
  const h=arena().g;combo(h);assert.equal(tap(h,'attack'),false);step(h,.8);assert.equal(h.state.player.comboNext,1);assert.equal(h.state.player.comboWindowRemaining,0);
});
test('P2: highest combo counts landed strikes rather than three performed whiffs',()=>{
  const {g}=arena();g.state.enemy.x=900;combo(g);assert.equal(g.state.stats.combat.highestCombo,0);assert.equal(g.state.stats.combat.swordHits,0);assert.equal(g.state.enemy.hp,500);assert.equal(g.state.stats.goals.includes('combo-three'),false);
});
test('P2: each active hitbox can catch an entering enemy once, with independent facing and vertical checks',()=>{
  const {g}=arena();g.state.enemy.x=530;tap(g,'attack');step(g,.075);assert.equal(g.state.enemy.hp,500);g.state.enemy.x=485;step(g,.025);assert.equal(g.state.enemy.hp,492);step(g,.3);assert.equal(g.state.enemy.hp,492);
  const h=arena().g;h.state.enemy.lift=120;tap(h,'attack');step(h,.15);assert.equal(h.state.enemy.hp,500);
});
test('P2: contact hit-stop freezes simulation timers while accepting a buffer and emitting events',()=>{
  const {g}=arena();tap(g,'attack');until(g,()=>g.state.hitStop>0);const cooldown=g.state.player.attackCooldown,aiTime=g.state.enemy.aiTime,time=g.state.time;
  assert.ok(tap(g,'attack'));tap(g,'replay');step(g,.025);assert.equal(g.state.player.attackCooldown,cooldown);assert.equal(g.state.enemy.aiTime,aiTime);assert.ok(g.state.time>time);assert.ok(g.drainEvents().some(e=>e.type==='voice'));until(g,()=>g.state.player.comboIndex===2);
});
test('P2: finishing contact is stronger feedback and floating numbers equal actual clamped HP loss',()=>{
  const {g,c}=arena();combo(g);assert.ok(g.state.hitStop>c.CONFIG.feedback.lightStop);assert.ok(g.state.effects.some(e=>e.type==='damage'&&e.value===16&&e.heavy));
  const h=arena().g;h.state.enemy.hp=3;tap(h,'attack');step(h,.075);const n=h.state.effects.find(e=>e.type==='damage');assert.equal(n.value,3);assert.equal(h.state.stats.combat.damageDealt,3);assert.equal(h.state.enemy.hp,0);
});
test('P2: directional knockback is stronger for the finisher and clamps both arena edges',()=>{
  const {g}=arena();combo(g);assert.ok(g.state.enemy.x>=530);assert.ok(g.state.enemy.x<=940);
  const a=arena().g;a.state.player.x=860;a.state.enemy.x=935;tap(a,'attack');step(a,.075);assert.equal(a.state.enemy.x,940);
  const b=arena().g;b.state.player.x=140;b.state.player.facing=-1;b.state.enemy.x=65;tap(b,'attack');step(b,.075);assert.equal(b.state.enemy.x,60);
});
test('P2: STAGGER prevents enemy attacks and resumes its existing pattern instead of resetting all progress',()=>{
  const {g}=arena();combo(g);assert.equal(g.state.enemy.ai,'STAGGER');const hp=g.state.player.hp;step(g,.2);assert.equal(g.state.enemy.ai,'STAGGER');assert.equal(g.state.player.hp,hp);until(g,()=>g.state.enemy.ai!=='STAGGER');assert.ok(['TELEGRAPH','APPROACH','IDLE','RECOVERY'].includes(g.state.enemy.ai));
});
test('P2: acceleration, braking and reversal give identical positions at 30/60/120 FPS',()=>{
  const values=[30,60,120].map(fps=>{const {g}=start();g.state.enemy.x=900;g.input('right');step(g,.2,fps);assert.ok(g.state.player.vx>0);g.input('right',false);g.input('left');step(g,.3,fps);assert.ok(g.state.player.vx<0);g.input('left',false);step(g,.3,fps);return [g.state.player.x,g.state.player.vx,g.state.player.runPhase];});
  assert.deepEqual(values[0],values[1]);assert.deepEqual(values[1],values[2]);assert.equal(values[0][1],0);
});
test('P2: Perfect Dodge requires a real collision in the original 180ms iframe and rewards that attack once',()=>{
  const {g,c}=start();g.state.player.x=60;g.state.player.facing=-1;g.state.enemy.x=180;until(g,()=>g.state.enemy.ai==='ATTACK');step(g,.4);tap(g,'dodge');until(g,()=>g.state.enemy.ai==='RECOVERY');
  assert.equal(g.state.player.hp,100);assert.equal(g.state.stats.combat.perfectDodges,1);assert.equal(g.state.stats.combat.successfulDodges,1);assert.equal(g.state.player.magicCharge,20);assert.ok(g.state.effects.some(x=>x.type==='perfect_dodge'));step(g,.2);assert.equal(g.state.stats.combat.perfectDodges,1);
  assert.equal(c.CONFIG.dodge.duration,.3);assert.equal(c.CONFIG.dodge.invulnerability,.18);assert.equal(c.CONFIG.dodge.cooldown,.65);
});
test('P2: dodging empty space, an expired iframe, or ordinary hit protection never invents Perfect Dodge',()=>{
  const a=start().g;tap(a,'dodge');step(a,.3);assert.equal(a.state.stats.combat.perfectDodges,0);
  const b=start().g;b.state.player.x=60;b.state.player.facing=-1;b.state.enemy.x=180;until(b,()=>b.state.enemy.ai==='TELEGRAPH');tap(b,'dodge');until(b,()=>b.state.enemy.ai==='RECOVERY');assert.equal(b.state.player.hp,92);assert.equal(b.state.stats.combat.perfectDodges,0);
  const d=start().g;d.state.player.x=500;d.state.enemy.x=620;until(d,()=>d.state.enemy.ai==='ATTACK');d.state.player.invulnerable=1;until(d,()=>d.state.enemy.ai==='RECOVERY');assert.equal(d.state.stats.combat.perfectDodges,0);
});
test('P2: normal slime chooses readable distance-aware patterns deterministically',()=>{
  const picks=[];for(const distance of [120,200,120]){const {g}=start();g.state.player.x=400;g.state.enemy.x=400+distance;until(g,()=>g.state.enemy.ai==='TELEGRAPH');picks.push(g.state.enemy.pattern);assert.ok(g.state.enemy.telegraphRemaining>=.8);const target=g.state.enemy.attackTargetX;g.input('left');step(g,.2);assert.equal(g.state.enemy.attackTargetX,target);}
  assert.deepEqual(picks,['jump','rush','jump']);
});
test('P2: boss introduction teaches the core phrase safely and waits for a skippable explicit start',()=>{
  const {g}=boss({intro:true});assert.equal(g.state.bossIntro.voiceId,'VO_ATTACK_CRYSTAL');assert.equal(g.state.enemy.ai,'ENTRANCE');step(g,5);assert.equal(g.state.mode,'BOSS_INTRO');assert.equal(g.state.bossIntro.remaining,0);assert.equal(tap(g,'attack'),false);assert.equal(g.state.enemy.hp,160);assert.ok(g.proceed());assert.equal(g.state.mode,'COMBAT');
});
test('P2: both boss phases contain distinct patterns and all three bounce landings have their own warnings',()=>{
  const {g}=boss();g.state.enemy.phase=2;const seen=[],serials=new Set();let landings=0,last='';
  for(let i=0;i<60*120&&seen.length<4;i++){
    if(g.state.challenge){solve(g);continue;}g.state.player.invulnerable=1;g.update(1/120);const e=g.state.enemy,mark=e.pattern+e.ai;
    if(mark!==last){if(e.ai==='TELEGRAPH'){if(!seen.includes(e.pattern))seen.push(e.pattern);if(e.pattern==='triple_bounce')serials.add(e.attackSerial);assert.ok(e.telegraphRemaining>.4);assert.ok(e.attackRadius>0);}if(e.ai==='RECOVERY'&&e.pattern==='triple_bounce')landings++;last=mark;}
  }
  assert.deepEqual(seen,['heavy_jump','triple_bounce','crystal_charge','forward_rush']);assert.equal(landings,3);assert.equal(serials.size,3);
});
test('P2: phase transition stays at half HP and modestly speeds only timing, not all damage',()=>{
  const {g,c}=boss();g.state.player.x=400;g.state.enemy.x=480;g.state.enemy.hp=88;tap(g,'attack');step(g,.08);assert.equal(g.state.enemy.hp,80);assert.equal(g.state.enemy.phase,2);assert.equal(c.CONFIG.boss.phaseSpeed,.87);assert.equal(c.CONFIG.boss.patterns.find(x=>x.id==='heavy_jump').damage,16);
});
test('P2: the core opens after actual crystal charge, safely teaches a retry, and freezes its finite window',()=>{
  const {g}=core();assert.equal(g.state.enemy.pattern,'crystal_charge');assert.equal(g.state.enemy.ai,'RECOVERY');assert.equal(g.state.challenge.target,'attack');const before=copy(g.state.enemy);step(g,8);assert.deepEqual(copy(g.state.enemy),before);const hp=g.state.player.hp;
  assert.equal(g.answer('left').correct,false);assert.match(g.state.challenge.feedback,/crystal/);assert.equal(g.answer('attack'),false);g.proceed();g.assist('korean');assert.equal(g.answer('attack').correct,true);g.proceed();assert.equal(g.state.player.weaknessCharge,1);assert.equal(g.state.player.hp,hp);assert.equal(g.state.enemy.coreRemaining,3.6);
});
test('P2: a learned core opening gives exactly one collision bonus and a real interrupt',()=>{
  const {g}=core();solve(g);g.state.player.x=g.state.enemy.x-85;g.state.player.facing=1;const before=g.state.enemy.hp;tap(g,'attack');step(g,.08);assert.equal(before-g.state.enemy.hp,12);assert.equal(g.state.stats.combat.weaknessHits,1);assert.equal(g.state.player.weaknessCharge,0);assert.equal(g.state.enemy.ai,'STAGGER');assert.equal(g.state.enemy.coreExposed,false);assert.ok(g.state.effects.some(x=>x.type==='core_hit'));
  step(g,.4);g.state.player.x=g.state.enemy.x-85;tap(g,'attack');step(g,.12);assert.equal(g.state.stats.combat.weaknessHits,1);
});
test('P2: a miss does not consume the core charge, but expiration removes the advantage',()=>{
  const {g}=core();solve(g);g.state.player.x=60;g.state.player.facing=-1;tap(g,'attack');step(g,.3);assert.equal(g.state.player.weaknessCharge,1);step(g,4);assert.equal(g.state.player.weaknessCharge,0);assert.equal(g.state.enemy.coreExposed,false);assert.equal(g.state.stats.combat.weaknessHits,0);
});
test('P2: Sentence Magic retains strict validation, feedback quality and one-answer settlement',()=>{
  const {g}=boss();tap(g,'magic');assert.equal(g.answer(['I','I','fire']),false);assert.equal(g.answer('I fire need.').correct,false);assert.equal(g.answer('I need fire.'),false);g.proceed();assert.equal(g.answer(['I','need','fire']).correct,true);assert.equal(g.state.challenge.resultQuality,'corrected');g.proceed();assert.equal(g.state.cast.quality,'corrected');assert.equal(g.proceed(),false);assert.equal(g.state.stats.combat.magicUsed,1);
});
test('P2: magic charges safely, launches a physical projectile, and damages only its actual impact once',()=>{
  const {g,c}=boss();until(g,()=>g.state.enemy.ai==='TELEGRAPH');tap(g,'magic');solve(g);const e=copy(g.state.enemy),hp=g.state.player.hp;
  step(g,.4);assert.equal(g.state.cast.phase,'charge');assert.equal(g.state.projectiles.length,0);assert.equal(g.state.enemy.hp,160);assert.equal(g.state.enemy.aiTime,e.aiTime);assert.equal(g.state.player.hp,hp);assert.equal(tap(g,'dodge'),false);
  until(g,()=>g.state.projectiles.length===1);assert.equal(g.state.enemy.hp,160);assert.ok(Math.abs(g.state.projectiles[0].y-(c.CONFIG.ground-60))<=c.CONFIG.magic.projectileSpeed*c.CONFIG.step);until(g,()=>g.state.stats.combat.magicHits===1);assert.equal(g.state.enemy.hp,128);step(g,.2);assert.equal(g.state.stats.combat.magicHits,1);assert.equal(g.state.player.magicCharge,0);
});
test('P2: pause freezes a projectile in flight and resumes the same single collision',()=>{
  const {g}=boss();tap(g,'magic');solve(g);until(g,()=>g.state.projectiles.length===1);g.pause();const shot=copy(g.state.projectiles),hp=g.state.enemy.hp;step(g,10);assert.deepEqual(copy(g.state.projectiles),shot);assert.equal(g.state.enemy.hp,hp);g.resume();until(g,()=>g.state.stats.combat.magicHits===1);assert.equal(g.state.enemy.hp,128);
});
test('P2: restart, main menu and fresh scene generations discard cast, projectiles, buffers and old answers',()=>{
  const {g}=boss();tap(g,'magic');const old=g.state.challenge;solve(g);until(g,()=>g.state.projectiles.length===1);const session=g.state.session;g.restart();assert.ok(g.state.session>session);assert.equal(g.state.projectiles.length,0);assert.equal(g.state.cast,null);assert.equal(g.answer(old.target),false);g.proceed();step(g,1);assert.equal(g.state.enemy.hp,70);g.mainMenu();assert.equal(g.state.mode,'INTRO');assert.equal(g.state.stats.combat.magicUsed,0);assert.equal(g.state.player.comboBuffered,false);
});
test('P2: review entries reflect wrong/help/text evidence, and independent listening goals require actual playback',()=>{
  const a=core().g;solve(a,{wrong:true,aid:'english'});assert.ok(a.state.stats.reviewExpressions.some(x=>x.id==='crystal'&&x.reasons.includes('wrong')&&x.reasons.includes('hint')));assert.equal(a.state.stats.goals.includes('independent-listening'),false);
  const b=core().g;solve(b,{audio:true});assert.equal(b.state.stats.goals.filter(x=>x==='independent-listening').length,1);assert.equal(b.state.stats.listening.independent,1);assert.equal(b.state.stats.reviewExpressions.some(x=>x.id==='crystal'),false);
});
test('P2: result bookkeeping uses actual damage and achievements cannot duplicate within a run',()=>{
  const {g}=arena();combo(g);step(g,.8);g.state.enemy.x=g.state.player.x+80;combo(g);assert.equal(g.state.stats.goals.filter(x=>x==='combo-three').length,1);assert.equal(g.state.stats.combat.damageDealt,68);
  const h=start().g;h.state.player.hp=3;h.state.player.x=500;h.state.enemy.x=620;until(h,()=>h.state.mode==='DEFEAT');assert.equal(h.state.stats.combat.damageReceived,3);assert.ok(h.state.effects.some(x=>x.type==='damage'&&x.value===-3));assert.equal(h.state.stats.goals.includes('forest-clear'),false);
});
test('P2: effect/event/projectile containers are bounded and no browser or campaign storage is required',()=>{
  const {g,c}=setup({get localStorage(){throw Error('campaign storage access');}});g.start(true);g.proceed();for(let i=0;i<1000;i++)tap(g,'replay');assert.equal(g.drainEvents().length,c.CONFIG.feedback.maxEvents);assert.ok(g.state.effects.length<=c.CONFIG.feedback.maxEffects);assert.ok(g.state.projectiles.length<=c.CONFIG.magic.maxProjectiles);g.mainMenu();assert.equal(g.state.effects.length,0);assert.equal(g.state.projectiles.length,0);
});
test('P2: a late finisher keeps the airborne landing warning aligned with actual collision in either direction',()=>{
  for(const direction of [1,-1]){
    const {g}=boss();g.state.enemy.hp=g.state.enemy.maxHp=1000;g.state.player.x=500;g.state.enemy.x=500+direction*120;
    until(g,()=>g.state.enemy.ai==='TELEGRAPH'&&g.state.enemy.pattern==='heavy_jump'&&g.state.enemy.telegraphRemaining<=.8,{learn:true,protect:true});
    const locked=g.state.enemy.attackTargetX;assert.equal(g.state.enemy.landingTargetX,locked);
    g.state.player.x=direction===1?880:120;g.state.player.facing=direction;
    tap(g,'attack');until(g,()=>g.state.player.pose==='attack_swing');tap(g,'attack');until(g,()=>g.state.player.comboIndex===2&&g.state.player.pose==='attack_swing');until(g,()=>g.state.player.comboIndex===0);
    until(g,()=>g.state.enemy.ai==='ATTACK'&&g.state.enemy.attackProgress>=.79);
    g.state.player.x=g.state.enemy.x-direction*110;g.state.player.facing=direction;assert.equal(g.state.player.comboNext,3);assert.ok(tap(g,'attack'));
    const hp=g.state.enemy.hp;until(g,()=>g.state.enemy.hp<hp);assert.equal(hp-g.state.enemy.hp,16);assert.equal(g.state.enemy.attackTargetX,locked,'trajectory stays locked');
    const predicted=g.state.enemy.landingTargetX;assert.ok((predicted-locked)*direction>20,'late recoil visibly changes the true landing point');
    until(g,()=>g.state.enemy.ai==='RECOVERY');assert.ok(Math.abs(g.state.enemy.x-predicted)<1e-8);assert.equal(g.state.enemy.attackTargetX,locked);
  }
});
