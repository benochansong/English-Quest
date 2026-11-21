/* Deterministic fixtures seed positions/prior evidence. Browser actors never do. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=['reborn-learning.js','reborn-combat.js'].map(f=>fs.readFileSync(path.join(__dirname,'../src',f),'utf8')).join('\n');
const api=()=>vm.runInNewContext(source+';({l:RebornLearning,c:RebornCombat})');
const step=(g,t)=>{for(let n=0;n<Math.round(t*120);n++)g.update(1/120);};
const tap=(g,k)=>{const r=g.input(k);g.input(k,false);return r;};
const setup=()=>{const a=api(),g=a.c.create();g.start(true);g.proceed();return{...a,g};};
function seed(g,key,stage='practice'){Object.assign(g.state.learning[key],{introduced:true,stage,streak:stage==='familiar'?2:0,actual:stage==='familiar'?1:0});}
function solve(g){const h=g.state.challenge;g.heard('asset',h.id);g.answer(h.target);g.proceed();}
function boss(){const a=setup(),g=a.g;for(let n=0;n<30&&g.state.stage==='slime';n++){if(g.state.challenge){solve(g);continue;}g.state.player.invulnerable=10;g.state.player.x=400;g.state.enemy.x=470;g.state.player.facing=1;tap(g,'attack');step(g,.7);}assert.equal(g.state.stage,'crystal');g.proceed();solve(g);g.proceed();return a;}
function wait(g,fn,t=30){for(let n=0;n<t*120;n++){if(fn())return;g.update(1/120);}assert.fail('timeout '+g.state.mode+' '+g.state.enemy?.ai);}
test('Two distinct independent opportunities plus real action are required for representative phrases',()=>{
 const p=api().l.createProgress();p.record('dodge','one',{success:true,heard:true});assert.equal(p.entries.dodge.stage,'practice');
 assert.equal(p.record('dodge','one',{success:true,heard:true,actual:true}),false);assert.equal(p.entries.dodge.independent,1);
 p.record('dodge','two',{success:true,heard:true});assert.equal(p.entries.dodge.stage,'practice');p.record('dodge','three',{success:true,heard:true,actual:true});assert.ok(p.ready('dodge'));
});
test('Silence, assistance and recent mistakes cannot promote familiarity or retry the same evidence',()=>{
 const p=api().l.createProgress();for(const [id,extra]of [['silent',{}],['help',{heard:true,assisted:true}]])p.record('fire',id,{success:true,actual:true,...extra});assert.equal(p.ready('fire'),false);
 p.record('fire','a',{success:true,heard:true,actual:true});p.record('fire','b',{success:true,heard:true,actual:true});assert.ok(p.ready('fire'));p.record('fire','miss',{success:false});assert.equal(p.entries.fire.stage,'practice');
 p.record('fire','miss',{success:true,heard:true,actual:true});assert.equal(p.entries.fire.streak,0);
});
test('Default flow retains session learning across restart/menu but a new instance starts fresh',()=>{
 const {g,c}=setup();assert.equal(g.state.flowEnabled,true);seed(g,'dodge','familiar');g.restart();assert.equal(g.state.learning.dodge.stage,'familiar');assert.equal(g.state.stats.flow.actionOpportunities,0);g.mainMenu();assert.equal(g.state.learning.dodge.stage,'familiar');assert.equal(c.create().state.learning.dodge.stage,'guided');
});
test('First guided instruction stays safe, counts forced time, and rejects stale playback tokens',()=>{
 const {g}=setup();g.state.player.x=500;g.state.enemy.x=570;tap(g,'attack');step(g,.5);tap(g,'attack');step(g,.15);const h=g.state.challenge;assert.ok(h);assert.equal(g.heard('asset','old'),false);
 const hp=g.state.player.hp,x=g.state.enemy.x;step(g,2);assert.equal(g.state.player.hp,hp);assert.equal(g.state.enemy.x,x);assert.ok(g.state.stats.flow.forcedSeconds>=2);g.heard('asset',h.id);g.assist('english');g.answer(h.target);assert.equal(g.state.stats.listening.independent,0);
});
test('Warned attacks allow2.2seconds before release and carry a unique speech context',()=>{
 const {g}=setup();seed(g,'dodge');g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>g.state.enemy.ai==='TELEGRAPH');const c=g.state.flowCue;assert.equal(c.expressionId,'dodge');assert.ok(g.state.enemy.telegraphRemaining>=2.19);
 const voices=g.drainEvents().filter(e=>e.type==='voice'&&e.id==='VO_WATCH_OUT');assert.equal(voices.length,1);assert.equal(voices[0].opportunityId,c.id);step(g,1);assert.equal(g.state.enemy.ai,'TELEGRAPH');
});
test('Real movement out of a warned landing after speech counts once without Perfect Dodge',()=>{
 const {g}=setup();seed(g,'dodge');g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>!!g.state.flowCue);const id=g.state.flowCue.id;g.heard('asset',id);g.input('left');step(g,.8);g.input('left',false);wait(g,()=>!g.state.flowCue,5);
 const o=g.state.stats.flow.outcomes.at(-1);assert.equal(o.success,true);assert.equal(o.independent,true);assert.equal(g.state.stats.combat.perfectDodges,0);assert.equal(g.heard('asset',id),false);
});
test('Standing in a warned attack cannot manufacture a listening success',()=>{
 const {g}=setup();seed(g,'dodge');g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>!!g.state.flowCue);g.heard('asset');wait(g,()=>!g.state.flowCue,5);assert.equal(g.state.stats.flow.independentActions,0);assert.equal(g.state.stats.flow.outcomes.at(-1).success,false);assert.ok(g.state.player.hp<100);
});
test('Visible avoidance while muted succeeds without independent listening credit',()=>{
 const {g}=setup();seed(g,'dodge');g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>!!g.state.flowCue);g.input('left');step(g,.8);g.input('left',false);wait(g,()=>!g.state.flowCue,5);assert.equal(g.state.stats.flow.outcomes.at(-1).success,true);assert.equal(g.state.stats.flow.independentActions,0);
});
test('Help freezes the same cue and records assistance on safe resume',()=>{
 const {g}=setup();seed(g,'dodge');g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>!!g.state.flowCue);const id=g.state.flowCue.id;assert.ok(g.assist('english'));g.pause();const age=g.state.flowCue.age,remaining=g.state.enemy.telegraphRemaining;step(g,10);assert.equal(g.state.flowCue.age,age);assert.equal(g.state.enemy.telegraphRemaining,remaining);g.heard('asset',id);g.resume();g.input('left');step(g,.8);g.input('left',false);wait(g,()=>!g.state.flowCue,5);assert.equal(g.state.stats.flow.independentActions,0);
});
test('Known crystal instruction stays live and only a real in-range sword hit consumes the bonus',()=>{
 const {g}=boss();seed(g,'crystal');g.state.player.invulnerable=100;wait(g,()=>g.state.flowCue?.expressionId==='crystal');assert.equal(g.state.mode,'COMBAT');const before=g.state.stats.combat.weaknessHits;g.heard('asset');g.answer('attack');assert.equal(g.state.stats.combat.weaknessHits,before);
 g.state.player.x=g.state.enemy.x-200;g.state.player.facing=1;tap(g,'attack');step(g,.5);assert.equal(g.state.player.weaknessCharge,1);g.state.player.x=g.state.enemy.x-70;tap(g,'attack');step(g,.15);assert.equal(g.state.stats.combat.weaknessHits,before+1);assert.equal(g.state.stats.flow.outcomes.at(-1).actual,true);
});
test('Missed crystal exposure expires without a mandatory modal or permanent combat lock',()=>{
 const {g}=boss();seed(g,'crystal');g.state.player.invulnerable=100;wait(g,()=>g.state.flowCue?.expressionId==='crystal');g.heard('asset');step(g,3.7);assert.equal(g.state.player.weaknessCharge,0);assert.equal(g.state.challenge,null);assert.equal(g.state.learning.crystal.stage,'practice');
});
test('Familiar fire skips arrangement but preserves charge, cooldown and collision-only32damage',()=>{
 const {g,c}=boss();seed(g,'fire','familiar');g.state.player.x=300;g.state.enemy.x=740;g.state.player.magicCharge=100;g.state.player.magicCooldown=0;const hp=g.state.enemy.hp,count=g.state.stats.flow.sentenceArrangements;assert.ok(tap(g,'magic'));assert.equal(g.state.challenge,null);assert.equal(g.state.player.magicCharge,0);assert.equal(g.state.player.magicCooldown,8);assert.equal(g.state.enemy.hp,hp);assert.equal(tap(g,'magic'),false);g.heard('asset');step(g,.4);assert.equal(g.state.enemy.hp,hp);step(g,.7);assert.equal(g.state.enemy.hp,hp-c.CONFIG.magic.damage);assert.equal(g.state.stats.flow.sentenceArrangements,count);assert.equal(g.state.learning.fire.stage,'familiar');assert.equal(g.state.stats.flow.independentActions,0);
});
test('Voluntary sentence review is safe and never grants a free projectile or charge',()=>{
 const {g}=boss();g.state.player.magicCharge=0;const used=g.state.stats.combat.magicUsed;assert.ok(g.learnAgain());g.heard('asset');g.answer('I need fire.');g.proceed();assert.equal(g.state.stats.combat.magicUsed,used);assert.equal(g.state.player.magicCharge,0);assert.equal(g.state.cast,null);
});
test('Restart invalidates live tokens and clears per-run action rewards',()=>{
 const {g}=setup();seed(g,'dodge');g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>!!g.state.flowCue);const id=g.state.flowCue.id;g.restart();assert.equal(g.state.flowCue,null);assert.equal(g.heard('asset',id),false);assert.equal(g.state.stats.flow.actionSuccesses,0);
});

test('Muting an already-started opportunity invalidates hearing until another audible playback',()=>{
 const {g}=setup();seed(g,'dodge');g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>!!g.state.flowCue);g.heard('asset');assert.equal(g.state.flowCue.heard,true);g.audioEvent('muted');assert.equal(g.state.flowCue.heard,false);g.input('left');step(g,.8);g.input('left',false);wait(g,()=>!g.state.flowCue,5);assert.equal(g.state.stats.flow.independentActions,0);
});

test('Delayed speech before release leaves1.6seconds to react; speech after attack starts is rejected',()=>{
 const {g}=setup();seed(g,'dodge');g.state.player.x=500;g.state.enemy.x=620;wait(g,()=>!!g.state.flowCue);step(g,2);assert.equal(g.state.enemy.ai,'TELEGRAPH');assert.ok(g.heard('asset'));assert.ok(g.state.enemy.telegraphRemaining>=1.59);step(g,1);assert.equal(g.state.enemy.ai,'TELEGRAPH');
 const b=setup().g;seed(b,'dodge');b.state.player.x=500;b.state.enemy.x=620;wait(b,()=>!!b.state.flowCue);wait(b,()=>b.state.enemy.ai==='ATTACK');assert.equal(b.heard('asset'),false);assert.equal(b.state.flowCue.heard,false);
});
