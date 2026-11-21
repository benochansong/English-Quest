const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=['reborn-learning.js','reborn-combat.js'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
const plain=x=>JSON.parse(JSON.stringify(x));
function setup(extra={}){const api=vm.runInNewContext(source+'\n;({combat:RebornCombat,learning:RebornLearning})',extra);return {...api,g:api.combat.create()};}
function advance(g,seconds,fps=60){for(let i=0;i<Math.round(seconds*fps);i++)g.update(1/fps);}
function tap(g,key){const r=g.input(key,true);g.input(key,false);return r;}
function fight(){const c=setup();c.g.start(true);c.g.proceed();return c;}
function solve(g,{heard=true,aid=null,wrong=false}={}){
  const h=g.state.challenge;assert.ok(h);
  if(heard)assert.ok(g.heard('browser-fallback'));
  if(aid)assert.ok(g.assist(aid));
  if(wrong){const bad=h.kind==='listen'?(h.target==='left'?'right':'left'):'fire need I';assert.equal(g.answer(bad).correct,false);assert.ok(g.proceed());}
  assert.equal(g.answer(h.target).correct,true);assert.ok(g.proceed());
}
function strikeAt(g,x=500,facing=1){g.state.player.x=x;g.state.player.facing=facing;g.state.enemy.x=x+80;tap(g,'attack');advance(g,.1);}
function slimeChallenge(){const c=fight();strikeAt(c.g);advance(c.g,.3);strikeAt(c.g);return c;}
function completeSlime(g){
  for(let i=0;i<20&&g.state.stage==='slime';i++){
    if(g.state.challenge){solve(g);continue;}
    advance(g,.4);strikeAt(g);
  }
  assert.equal(g.state.stage,'crystal');
}
function boss(){const c=fight();completeSlime(c.g);c.g.proceed();solve(c.g);assert.equal(c.g.state.stage,'boss');return c;}
function wait(g,predicate,max=30){for(let i=0;i<max*120;i++){if(predicate())return;g.update(1/120);}assert.fail('condition not reached: '+g.state.mode+'/'+g.state.enemy?.ai);}

test('Initial isolated state is valid without any DOM, storage, timer or audio globals',()=>{
  let accessed=0;const {g}=setup({get localStorage(){accessed++;throw Error('campaign storage forbidden');}});
  assert.equal(accessed,0);assert.equal(g.state.mode,'INTRO');assert.equal(g.state.player.hp,100);assert.equal(g.state.enemy,null);
  const before=plain(g.state);g.update(5);assert.deepEqual(plain(g.state),before);assert.equal(tap(g,'attack'),false);
});
test('Short tutorial teaches all five phrases, supports skip, and preserves challenge encounters',()=>{
  const {g,learning}=setup();assert.ok(g.start());assert.equal(g.state.mode,'TUTORIAL');assert.equal(g.state.tutorial.index,0);
  g.proceed();g.proceed();assert.equal(g.state.tutorial.index,2);g.proceed();assert.equal(g.state.mode,'EXPLORATION');assert.equal(g.state.awaitingProceed,false);
  assert.equal(Object.keys(learning.expressions).length,5);
  const other=setup().g;other.start();assert.ok(other.start(true));assert.equal(other.state.mode,'EXPLORATION');other.proceed();assert.equal(other.state.enemy.hp,70);
});
test('Movement is responsive and equivalent at 30, 60 and 120 updates per second',()=>{
  const positions=[30,60,120].map(fps=>{const {g}=fight();g.input('left');advance(g,.4,fps);g.input('left',false);const x=g.state.player.x;advance(g,.2,fps);assert.equal(g.state.player.x,x);return x;});
  assert.ok(Math.abs(positions[0]-82)<1e-8);assert.deepEqual(positions,[positions[0],positions[0],positions[0]]);
});
test('Movement boundaries and opposing held inputs are enforced',()=>{
  const {g}=fight();g.input('left');g.input('right');advance(g,.2);assert.equal(g.state.player.x,170);g.input('right',false);advance(g,2);assert.equal(g.state.player.x,60);
  g.state.enemy=null;g.input('left',false);g.input('right');advance(g,6);assert.equal(g.state.player.x,940);
});
test('Walking through the entrance starts the slime once without a timed wait',()=>{
  const {g}=setup();g.start(true);g.input('right');advance(g,.3);assert.equal(g.state.stage,'slime');assert.equal(g.state.enemy.hp,70);assert.equal(g.state.mode,'COMBAT');
  assert.equal(g.proceed(),false);assert.equal(g.state.enemy.hp,70);
});
test('Sword hitbox requires correct facing and actual range',()=>{
  const {g}=fight();g.state.player.x=400;g.state.enemy.x=480;g.state.player.facing=-1;tap(g,'attack');advance(g,.1);assert.equal(g.state.enemy.hp,70);
  advance(g,.3);g.state.player.facing=1;g.state.enemy.x=520;tap(g,'attack');advance(g,.1);assert.equal(g.state.enemy.hp,70);
  advance(g,.3);g.state.enemy.x=480;tap(g,'attack');advance(g,.1);assert.equal(g.state.enemy.hp,62);
});
test('Sword anticipation, swing, follow-through, once-only damage and cooldown are deterministic',()=>{
  const {g,combat}=fight();g.state.player.x=500;g.state.enemy.x=580;assert.ok(tap(g,'attack'));assert.equal(g.state.player.pose,'attack_anticipation');
  advance(g,.05);assert.equal(g.state.enemy.hp,70);advance(g,.05);assert.equal(g.state.enemy.hp,62);assert.equal(g.state.player.pose,'attack_swing');
  assert.equal(tap(g,'attack'),false);advance(g,.1);assert.equal(g.state.player.pose,'attack_follow');advance(g,.15);assert.equal(g.state.enemy.hp,62);assert.ok(g.state.player.attackCooldown<1e-8);
  assert.equal(combat.CONFIG.sword.damage,8);assert.equal(combat.CONFIG.sword.cooldown,.35);
});
test('Held or rapid repeated attack presses never duplicate attacks',()=>{
  const {g}=fight();g.state.player.x=500;g.state.enemy.x=580;assert.ok(g.input('attack'));for(let i=0;i<50;i++)assert.equal(g.input('attack'),false);
  advance(g,.5);assert.equal(g.state.enemy.hp,62);assert.equal(g.input('attack'),false);g.input('attack',false);assert.ok(g.input('attack'));
});
test('Dodge has bounded distance, finite iframes and a separate cooldown',()=>{
  const {g,combat}=fight();g.state.player.x=200;assert.ok(tap(g,'dodge'));assert.equal(g.state.player.pose,'dodge');assert.equal(g.state.player.invulnerable,.18);
  advance(g,.15);assert.ok(g.state.player.invulnerable>0);assert.equal(tap(g,'dodge'),false);advance(g,.05);assert.equal(g.state.player.invulnerable,0);
  advance(g,.1);assert.equal(g.state.player.pose,'idle');assert.ok(Math.abs(g.state.player.x-(200+combat.CONFIG.dodge.speed*.3))<1e-6);
  assert.equal(tap(g,'dodge'),false);advance(g,.35);assert.ok(tap(g,'dodge'));
});
test('Body collision blocks walking through a grounded enemy; dodging can cross',()=>{
  const {g}=fight();g.state.player.x=400;g.state.enemy.x=500;g.input('right');advance(g,.3);assert.equal(g.state.player.x,444);g.input('right',false);
  tap(g,'dodge');advance(g,.3);assert.ok(g.state.player.x>500);
});
test('Slime uses predictable jump and rush patterns with locked telegraphs',()=>{
  const {g}=fight();g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>g.state.enemy.ai==='TELEGRAPH');assert.equal(g.state.enemy.pattern,'jump');const target=g.state.enemy.attackTargetX;
  g.input('left');advance(g,.2);g.input('left',false);assert.equal(g.state.enemy.attackTargetX,target);
  wait(g,()=>g.state.enemy.ai==='ATTACK');wait(g,()=>g.state.enemy.ai==='RECOVERY');wait(g,()=>g.state.enemy.ai==='TELEGRAPH');assert.equal(g.state.enemy.pattern,'rush');
});
test('Moving out of a jump target avoids damage; landing collision applies one hit',()=>{
  const safe=fight().g;safe.state.player.x=500;safe.state.enemy.x=620;wait(safe,()=>safe.state.enemy.ai==='TELEGRAPH');safe.input('left');advance(safe,.5);safe.input('left',false);wait(safe,()=>safe.state.enemy.ai==='RECOVERY');assert.equal(safe.state.player.hp,100);
  const hit=fight().g;hit.state.player.x=500;hit.state.enemy.x=620;wait(hit,()=>hit.state.enemy.ai==='RECOVERY');assert.equal(hit.state.player.hp,92);advance(hit,.2);assert.equal(hit.state.player.hp,92);
});
test('A correctly timed dodge prevents a collision; expired iframes do not',()=>{
  const {g}=fight();g.state.player.x=60;g.state.player.facing=-1;g.state.enemy.x=180;wait(g,()=>g.state.enemy.ai==='ATTACK');advance(g,.4);tap(g,'dodge');wait(g,()=>g.state.enemy.ai==='RECOVERY');assert.equal(g.state.player.hp,100);
  const h=fight().g;h.state.player.x=60;h.state.player.facing=-1;h.state.enemy.x=180;wait(h,()=>h.state.enemy.ai==='TELEGRAPH');tap(h,'dodge');wait(h,()=>h.state.enemy.ai==='RECOVERY');assert.equal(h.state.player.hp,92);
});
test('Enemy death clamps HP, stops damage, and reveals the crystal safely',()=>{
  const {g}=fight();completeSlime(g);assert.equal(g.state.enemy.hp,0);assert.equal(g.state.enemy.ai,'DEFEATED');assert.equal(g.state.mode,'EXPLORATION');assert.equal(g.state.player.hp,100);
  const hp=g.state.player.hp;advance(g,10);assert.equal(g.state.player.hp,hp);assert.equal(tap(g,'attack'),false);assert.equal(g.state.stage,'crystal');
});
test('Scripted listening occurs at meaningful milestones and freezes hostile timers',()=>{
  const {g}=slimeChallenge();assert.equal(g.state.challenge.target,'left');assert.equal(g.state.mode,'LISTENING_CHALLENGE');const before=plain({p:g.state.player,e:g.state.enemy});advance(g,15);
  assert.deepEqual(plain({p:g.state.player,e:g.state.enemy}),before);assert.equal(g.state.stats.correct,0);solve(g);assert.equal(g.state.enemy.ai,'RECOVERY');assert.equal(g.state.player.magicCharge,53);
});
test('Listening wrong answer explains, requires explicit retry, and never causes damage',()=>{
  const {g}=slimeChallenge();const hp=g.state.player.hp;assert.equal(g.answer('right').correct,false);assert.match(g.state.challenge.feedback,/left/);assert.equal(g.answer('right'),false);assert.equal(g.answer('left'),false);
  assert.equal(g.state.stats.wrong,1);assert.equal(g.state.player.hp,hp);assert.ok(g.proceed());assert.equal(g.answer('left').correct,true);assert.equal(g.state.stats.assisted,1);assert.ok(g.proceed());assert.equal(g.state.mode,'COMBAT');assert.equal(g.proceed(),false);
});
test('Listening rejects malformed values and input routes only the selected action',()=>{
  const {g}=slimeChallenge();for(const value of [null,undefined,{},'move left','LEFT',[],1])assert.equal(g.answer(value),false);
  assert.equal(g.state.stats.wrong,0);assert.equal(tap(g,'left').correct,true);assert.equal(g.state.stats.correct,1);assert.equal(tap(g,'left'),false);
});
test('Actual heard audio, subtitles, Korean assistance and silent fallback have honest denominators',()=>{
  const a=slimeChallenge().g;a.heard('asset');a.answer('left');assert.equal(a.state.stats.listening.independent,1);assert.equal(a.state.stats.listening.asset,1);
  const b=slimeChallenge().g;b.heard('browser-fallback');b.assist('english');b.answer('left');assert.equal(b.state.stats.listening.independent,0);assert.equal(b.state.stats.listening.fallback,1);assert.equal(b.state.stats.assisted,1);
  const c=slimeChallenge().g;c.assist('korean');c.answer('left');assert.equal(c.state.stats.listening.unheard,1);assert.equal(c.state.stats.listening.independent,0);
  const d=slimeChallenge().g;d.answer('left');assert.equal(d.state.stats.independent,0);assert.equal(d.heard('asset'),false);
});
test('Voice replay emits stable IDs without changing learning records or combat',()=>{
  const {g}=slimeChallenge();g.drainEvents();const before=plain(g.state.stats);for(let i=0;i<3;i++)assert.ok(tap(g,'replay'));const ev=g.drainEvents();assert.equal(ev.length,3);assert.ok(ev.every(e=>e.type==='voice'&&e.id==='VO_MOVE_LEFT'));
  assert.deepEqual(plain(g.state.stats),before);assert.equal(g.state.challenge.heard,false);assert.equal(g.drainEvents().length,0);
});
test('Sentence magic validates only the taught sentence or its exact token order',()=>{
  const {learning}=setup();for(const value of ['I need fire.','  I   need FIRE ',['I','need','fire']])assert.equal(learning.evaluate('fire',value).correct,true);
  for(const value of ['I fire need.','I need fire and ice.','I do not need fire.'])assert.equal(learning.evaluate('fire',value).correct,false);
  for(const value of [null,{},[],['I','need','fire','fire'],['I','I','fire']])assert.equal(learning.evaluate('fire',value).valid,false);
});
test('Discovery teaches magic before the boss and fully restores a beginner',()=>{
  const {g}=fight();completeSlime(g);assert.equal(g.state.magicUnlocked,false);assert.ok(g.proceed());assert.equal(g.state.challenge.kind,'magic');assert.deepEqual(Array.from(g.state.challenge.words),['fire','I','need']);
  solve(g,{heard:false,wrong:true});assert.equal(g.state.magicUnlocked,true);assert.equal(g.state.enemy.kind,'boss');assert.equal(g.state.enemy.hp,160);assert.equal(g.state.player.hp,100);assert.equal(g.state.player.magicCharge,100);
});
test('Fire Burst consumes charge once and cannot bypass its cooldown by repeated input',()=>{
  const {g}=boss();assert.ok(tap(g,'magic'));assert.equal(g.answer('I need fire.').correct,true);assert.equal(g.answer('I need fire.'),false);assert.ok(g.proceed());assert.equal(g.state.enemy.hp,128);assert.equal(g.state.player.magicCharge,0);assert.equal(g.state.player.magicCooldown,8);
  assert.equal(tap(g,'magic'),false);assert.equal(g.proceed(),false);assert.equal(g.state.enemy.hp,128);g.state.player.magicCharge=100;assert.equal(tap(g,'magic'),false);
  advance(g,8.2);assert.ok(tap(g,'magic'));
});
test('Boss cycles heavy jump, triple bounce with three warned landings, and crystal charge',()=>{
  const {g}=boss();g.state.player.x=60;g.state.enemy.x=250;const patterns=[],tripleLandings=[];let last='';
  for(let n=0;n<50*120&&patterns.length<3;n++){
    const e=g.state.enemy;g.state.player.invulnerable=1;g.update(1/120);
    const mark=e.pattern+':'+e.ai;if(mark!==last){if(e.ai==='TELEGRAPH'&&!patterns.includes(e.pattern))patterns.push(e.pattern);if(e.pattern==='triple_bounce'&&e.ai==='RECOVERY')tripleLandings.push(e.x);last=mark;}
  }
  assert.deepEqual(patterns,['heavy_jump','triple_bounce','crystal_charge']);assert.equal(tripleLandings.length,3);
});
test('Sword misses the boss above its actual vertical reach and hits on descent',()=>{
  const {g,combat}=boss();g.state.player.x=480;g.state.enemy.x=600;wait(g,()=>g.state.enemy.ai==='ATTACK'&&g.state.enemy.lift>110);
  assert.ok(g.state.enemy.lift>combat.CONFIG.sword.height);g.state.player.x=g.state.enemy.x-60;g.state.player.facing=1;tap(g,'attack');advance(g,.1);assert.equal(g.state.enemy.hp,160);
  const h=boss().g;h.state.player.x=480;h.state.enemy.x=600;wait(h,()=>h.state.enemy.ai==='ATTACK'&&h.state.enemy.attackProgress>.5&&h.state.enemy.lift<85);
  h.state.player.x=h.state.enemy.x-95;h.state.player.facing=1;assert.ok(tap(h,'attack'));advance(h,.08);assert.equal(h.state.enemy.hp,152);assert.ok(h.state.enemy.lift>0,'hit while descending, before landing');
});
test('Boss phase switches at exactly half HP, with modestly faster telegraphs',()=>{
  const {g,combat}=boss();g.state.enemy.hp=88;strikeAt(g);assert.equal(g.state.enemy.hp,80);assert.equal(g.state.enemy.phase,2);assert.equal(g.state.challenge.target,'attack');solve(g);
  advance(g,.4);strikeAt(g);assert.equal(g.state.challenge.target,'magic');solve(g);wait(g,()=>g.state.enemy.ai==='TELEGRAPH');
  const pattern=combat.CONFIG.boss.patterns.find(p=>p.id===g.state.enemy.pattern);assert.ok(g.state.enemy.telegraphRemaining<=pattern.telegraph*combat.CONFIG.boss.phaseSpeed+1e-8);
});
test('Pause freezes timers, enemies, input and learning; resume clears held movement',()=>{
  const {g}=fight();g.input('left');advance(g,.1);assert.ok(g.pause());const snapshot=plain(g.state);advance(g,3);assert.deepEqual(plain(g.state),snapshot);assert.equal(tap(g,'attack'),false);g.input('right');assert.ok(g.resume());const x=g.state.player.x;advance(g,.2);assert.equal(g.state.player.x,x);
  const h=slimeChallenge().g;h.heard('asset');h.pause();assert.equal(h.answer('left'),false);assert.equal(h.heard('asset'),false);assert.ok(h.assist('korean'));h.resume();assert.equal(h.answer('left').correct,true);assert.equal(h.state.stats.independent,0);
});
test('Clear-input handles focus loss and restart invalidates old challenge submissions',()=>{
  const {g}=slimeChallenge();const old=g.state.challenge,session=g.state.session;g.input('left',false);g.restart();assert.ok(g.state.session>session);assert.equal(g.state.challenge,null);assert.equal(g.answer(old.target),false);assert.equal(g.state.stats.correct,0);assert.equal(g.state.magicUnlocked,false);
  g.input('right');g.input('clear',false);const x=g.state.player.x;advance(g,.1);assert.equal(g.state.player.x,x);
});
test('Defeat clamps health, blocks attacks, and restart resets the entire temporary run',()=>{
  const {g}=fight();g.state.player.hp=1;g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>g.state.mode==='DEFEAT');assert.equal(g.state.player.hp,0);assert.equal(g.state.player.pose,'defeat');assert.equal(tap(g,'attack'),false);const hp=g.state.enemy.hp;advance(g,5);assert.equal(g.state.enemy.hp,hp);
  g.restart();assert.equal(g.state.player.hp,100);assert.equal(g.state.enemy,null);assert.equal(g.state.stage,'entrance');assert.equal(g.state.player.attackCooldown,0);assert.equal(g.state.stats.wrong,0);
});
test('Victory is immediate, finite and temporary; no repeated rewards or late damage',()=>{
  const {g}=boss();g.state.enemy.hp=8;strikeAt(g);assert.equal(g.state.mode,'VICTORY');assert.equal(g.state.enemy.hp,0);assert.equal(g.state.enemy.ai,'DEFEATED');assert.equal(g.state.player.pose,'victory');assert.equal(g.state.reward.title,'숲의 첫빛');
  const hp=g.state.player.hp,reward=plain(g.state.reward);advance(g,20);assert.equal(g.state.player.hp,hp);assert.ok(g.state.enemy.aiTime>=19.9);assert.ok(g.state.player.poseTime>=19.9);assert.equal(tap(g,'attack'),false);assert.equal(g.proceed(),false);assert.deepEqual(plain(g.state.reward),reward);
});
test('Malformed delta and long-background catch-up cannot teleport or skip damage rules',()=>{
  const {g}=fight();g.input('left');for(const dt of [NaN,Infinity,-1,0,'1'])g.update(dt);assert.equal(g.state.player.x,170);g.update(1000);assert.ok(g.state.player.x>=115-1e-6);assert.ok(g.state.time<=.25+1e-8);
});
test('Every emitted tutorial and combat voice exists in the actual production manifest',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../REBORN_VOICE_MANIFEST.json'),'utf8'));const ids=new Set(manifest.utterances.map(v=>v.id));
  const {g}=fight();const events=g.drainEvents();completeSlime(g);events.push(...g.drainEvents());g.proceed();solve(g);events.push(...g.drainEvents());g.state.enemy.hp=8;strikeAt(g);events.push(...g.drainEvents());
  for(const event of events.filter(e=>e.type==='voice'))assert.ok(ids.has(event.id),event.id);
});
test('A complete no-audio run wins through real movement, sword, dodge and sentence magic without state mutation',()=>{
  const {g}=setup();g.start(true);g.input('right');const used=new Set(),phases=new Set();
  for(let i=0;i<180*60&&!['VICTORY','DEFEAT'].includes(g.state.mode);i++){
    const s=g.state,p=s.player,e=s.enemy;
    if(s.challenge){solve(g,{heard:false});continue;}
    if(s.stage==='crystal'){g.proceed();continue;}
    if(s.mode==='COMBAT'||s.mode==='PLAYER_HIT'){
      phases.add(e.phase);const dx=e.x-p.x,dir=dx<0?'left':'right';
      g.input('left',false);g.input('right',false);
      if(e.ai==='TELEGRAPH'&&e.telegraphRemaining<.3&&p.dodgeCooldown<=0){
        tap(g,dir==='left'?'right':'left');if(tap(g,'dodge'))used.add('dodge');
      }else if(Math.abs(dx)>85){g.input(dir);}
      else {tap(g,dir);if(tap(g,'attack'))used.add('attack');}
      if(p.magicCharge===100&&p.magicCooldown<=0&&s.magicUnlocked&&tap(g,'magic'))used.add('magic');
    }
    g.update(1/60);
  }
  assert.equal(g.state.mode,'VICTORY');assert.ok(g.state.player.hp>0);assert.deepEqual([...used].sort(),['attack','dodge','magic']);assert.ok(phases.has(2));
  assert.equal(g.state.stats.listening.correct,4);assert.equal(g.state.stats.independent,0);assert.equal(g.state.stats.expressions.length,5);
});
