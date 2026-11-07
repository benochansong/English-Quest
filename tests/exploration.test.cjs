const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=['questions','village-data','voice-data','exploration-data','rpg','engine','village-engine','voice-learning','exploration-engine','trials']
  .map(n=>fs.readFileSync(path.join(__dirname,'../src',n+'.js'),'utf8')).join('\n');
const copy=value=>JSON.parse(JSON.stringify(value));
function setup(open=true){
  const storage=new Map(),localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  const api=vm.runInNewContext(source+'\n;({e:Engine,x:Exploration,d:ExplorationData,r:RPG,q:Q,l:lessons,v:VoiceLearning,t:Trials,village:VillageEngine})',{localStorage});
  const p=api.e.fresh();
  if(open){
    p.started=true;p.completed=[1,2,3];p.chapterComplete=true;p.unlocked=3;
    for(const q of [4,5,6])Object.assign(p.village.progress[q],{accepted:true,step:3,completed:true});
    assert.ok(api.x.enter(p));
  }
  return {...api,p,storage};
}
// Navigation deliberately uses the public collision/movement API rather than teleporting to puzzle sources.
function walk(ctx,id){
  const {x,d,p}=ctx,o=d.objects.find(o=>o.id===id),s=p.exploration;
  assert.equal(s.area,o.area,'target must be in the current area: '+id);
  if(Math.hypot(s.x-o.x,s.y-o.y)<=o.radius-5)return;
  const ox=s.x,oy=s.y,step=10,queue=[[0,0]],prev=new Map([['0,0',null]]);
  let end=null;
  for(let i=0;i<queue.length;i++){
    const [gx,gy]=queue[i],wx=ox+gx*step,wy=oy+gy*step;
    if(Math.hypot(wx-o.x,wy-o.y)<=o.radius-5){end=[gx,gy];break;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=gx+dx,ny=gy+dy,key=nx+','+ny;
      if(prev.has(key)||!x.walkable(p,s.area,ox+nx*step,oy+ny*step))continue;
      prev.set(key,[gx,gy]);queue.push([nx,ny]);
    }
  }
  assert.ok(end,'walkable route to '+id);
  const route=[];while(end){route.push(end);end=prev.get(end.join(','));}route.reverse();
  for(const [gx,gy] of route.slice(1)){
    const dx=ox+gx*step-s.x,dy=oy+gy*step-s.y,dist=Math.hypot(dx,dy);
    assert.ok(x.move(p,dx/dist,dy/dist,dist/d.speed),'movement towards '+id);
    assert.ok(Math.hypot(s.x-(ox+gx*step),s.y-(oy+gy*step))<.001,'no path tunneling: '+id);
  }
}
function interact(ctx,id){walk(ctx,id);const h=ctx.x.interact(ctx.p,id);assert.ok(h,'interaction '+id);return h;}
function solve(ctx,id){
  const {x,p}=ctx,h=interact(ctx,id),a=h.activity;assert.ok(a,'activity '+id);
  let result;
  if(a.physical&&!h.practice){walk(ctx,a.answer);assert.equal(x.interact(p,a.answer),h);result=h.feedback;}
  else result=x.answer(p,h,h.practice&&a.physical?a.reviewAnswer:a.answer);
  assert.equal(result?.correct,true,'solved '+id);assert.equal(x.answer(p,h,a.answer),null,'one answer only '+id);
  x.close(p);return result;
}
function choose(ctx,objectId,option){const h=interact(ctx,objectId);assert.equal(h.phase,'choice');assert.ok(ctx.x.choose(ctx.p,h,option));ctx.x.close(ctx.p);}
function portal(ctx,id){const h=interact(ctx,id);assert.equal(h.phase,'transition');assert.equal(ctx.x.current(ctx.p),null);}
function forest(ctx,branch='moon'){
  for(const id of ['f-map','f-rowan','f-directions','f-mira','f-bram'])solve(ctx,id);
  choose(ctx,'f-crossroad',branch);solve(ctx,'f-'+branch);solve(ctx,'f-bridge');portal(ctx,'f-ruins');
}
function ruins(ctx){for(const id of ['r-gate','r-inscription','r-door','r-fragment'])solve(ctx,id);portal(ctx,'r-cavern');}
function finish(ctx,companion='mira'){
  for(const id of ['c-listen','c-door','c-switch'])solve(ctx,id);
  choose(ctx,'c-choice',companion);return solve(ctx,'c-final-'+companion);
}
function reload(ctx){const raw=copy(ctx.p);ctx.p=ctx.e.hydrate(raw);assert.equal(ctx.p.currentChapter,3);return ctx.p;}

test('Chapter 3 requires restored forest and all three village quests; the optional shop scenario is independent',()=>{
  const c=setup(false),{p,x}=c;
  assert.equal(x.available(p),false);assert.equal(x.enter(p),false);
  p.started=true;p.chapterComplete=true;
  for(const n of [4,6])p.village.progress[n].completed=true;
  assert.equal(x.available(p),false);
  p.village.progress[5].completed=true;assert.ok(x.available(p));assert.ok(x.enter(p));
  assert.equal(p.currentChapter,3);assert.equal(p.village.scenarioComplete,false);
  assert.equal(p.exploration.completed.length,0);assert.equal(p.exploration.quests.map,'active');
});

test('Authored content has 37 reachable source objects, eight object types, complete language metadata and valid targets',()=>{
  const {d,q,l}=setup();assert.equal(d.activities.length,37);assert.equal(Object.keys(d.areas).length,5);
  assert.equal(new Set(d.objects.map(o=>o.id)).size,d.objects.length);
  assert.equal(new Set(d.activities.map(a=>a.id)).size,37);
  assert.equal(new Set(d.objects.map(o=>o.type)).size,8);
  assert.ok(d.activities.filter(a=>a.physical).length>=8);
  for(const a of d.activities){
    for(const key of ['id','english','ko','objective','explanation','hint','answer'])assert.ok(a[key],a.id+' '+key);
    assert.equal(a.chapter,3);assert.ok(d.objects.some(o=>o.activityId===a.id&&o.area===a.area));
    assert.ok(a.tags.every(id=>l.some(item=>item.id===id)));
    const shared=q.find(item=>item.id===a.id);assert.equal(shared.stage,7);assert.equal(shared.chapter,3);
    if(a.physical)assert.ok(a.choices.every(id=>d.objects.some(o=>o.id===id&&o.area===a.area)));
    if(a.kind==='order')assert.equal(a.words.join(' ').replace(/[.!?]/g,''),a.answer.replace(/[.!?]/g,''));
    else assert.ok(a.choices.includes(a.answer));
  }
});

test('Movement is frame-rate independent, diagonal speed normalized, bounded and collision-safe',()=>{
  function travel(fps,dx,dy){const c=setup();c.p.exploration.x=560;c.p.exploration.y=320;
    for(let i=0;i<fps;i++)c.x.move(c.p,dx,dy,1/fps);return c.p.exploration;}
  const low=travel(30,1,0),high=travel(144,1,0),diagonal=travel(60,1,-1);
  assert.ok(Math.abs(low.x-high.x)<1e-8);assert.ok(Math.abs(low.x-740)<1e-8);
  assert.ok(Math.abs(Math.hypot(diagonal.x-560,diagonal.y-320)-180)<1e-8);
  const c=setup(),{x,p}=c,s=p.exploration;
  s.x=430;s.y=350;
  for(let i=0;i<300;i++)x.move(p,1,0,1/30);
  assert.ok(s.x<=456);assert.ok(x.walkable(p,'forest',s.x,s.y));
  for(let i=0;i<300;i++)x.move(p,-1,0,1/30);
  assert.ok(s.x>=14&&s.x<20);
  const before=copy(s);assert.equal(x.move(p,NaN,1,.1),false);assert.equal(x.move(p,1,0,-1),false);assert.equal(x.move(p,Infinity,0,.1),false);
  assert.deepEqual(copy(s),before);x.move(p,1,0,100);assert.ok(s.x-before.x<=18.001,'background delta is limited');
});

test('Physical gates, interaction range and prerequisite messages prevent skipping progression',()=>{
  const c=setup(),{x,p}=c;
  assert.equal(x.interact(p,'f-ruins'),null);assert.equal(x.transition(p,'f-ruins'),false);
  let h=interact(c,'f-rowan');assert.equal(h.phase,'info');assert.ok(h.text.includes('지도'));x.close(p);
  h=interact(c,'f-bridge');assert.equal(h.phase,'info');assert.ok(h.text.includes('미라'));x.close(p);
  assert.equal(x.walkable(p,'forest',485,520),false);
  for(const id of ['f-map','f-rowan','f-directions','f-mira','f-bram'])solve(c,id);
  choose(c,'f-crossroad','stone');h=interact(c,'f-bridge');assert.equal(h.phase,'info');assert.ok(h.text.includes('돌길'));x.close(p);
  solve(c,'f-stone');solve(c,'f-bridge');assert.ok(x.walkable(p,'forest',485,520));
  assert.equal(p.exploration.quests.bridge,'active','must also enter ruins');portal(c,'f-ruins');assert.equal(p.exploration.quests.bridge,'complete');
  assert.equal(x.walkable(p,'ruins',465,320),false);solve(c,'r-gate');assert.ok(x.walkable(p,'ruins',465,320));
});

test('Question handles reject invalid, repeated, cross-profile, stale and remotely completed physical answers',()=>{
  const c=setup(),{x,p,e}=c,h=interact(c,'f-map');
  const before=copy(p);assert.equal(x.answer(p,h,'not a choice'),null);assert.equal(x.answer(e.fresh(),h,h.activity.answer),null);
  assert.equal(x.interact(p,'f-map'),null);assert.equal(x.move(p,1,0,.1),false);assert.deepEqual(copy(p),before);
  assert.ok(x.answer(p,h,h.activity.choices[1]));assert.equal(x.answer(p,h,h.activity.answer),null);
  assert.ok(x.retry(p,h));assert.equal(x.retry(p,h),false);assert.ok(x.hint(p,h));assert.ok(x.assist(p,h,'translation'));
  assert.ok(x.answer(p,h,h.activity.answer).correct);assert.equal(p.voice.records['f-map'].wrong,1);
  assert.equal(p.voice.records['f-map'].correct,1);assert.equal(p.voice.records['f-map'].assistedCorrect,1);assert.equal(p.voice.records['f-map'].translation,1);
  x.close(p);assert.equal(x.answer(p,h,h.activity.answer),null);solve(c,'f-rowan');
  const seek=interact(c,'f-directions');assert.equal(seek.phase,'seek');assert.equal(x.answer(p,seek,seek.activity.answer),null);
  const count=p.voice.records['f-directions'];assert.equal(count,undefined);
  walk(c,'f-south');assert.equal(x.interact(p,'f-south'),seek);assert.equal(seek.feedback.correct,false);
  assert.equal(x.interact(p,'f-south'),null);assert.ok(x.retry(p,seek));walk(c,'f-north');x.interact(p,'f-north');
  assert.equal(seek.feedback.correct,true);assert.equal(p.voice.records['f-directions'].assistedCorrect,1);
  x.close(p);const stale=x.practice(p,'r-book');x.close(p);const newHandle=x.practice(p,'r-book');
  assert.equal(x.answer(p,stale,stale.activity.answer),null);assert.equal(x.answer(p,newHandle,'Look old door'),null);
  assert.equal(x.answer(p,newHandle,'Look Look the old door'),null);assert.equal(x.answer(p,newHandle,newHandle.activity.answer).correct,true);
  assert.equal(p.exploration.completed.includes('r-book'),false,'journal practice cannot open a world puzzle');
});

test('Both crossroad and restoration routes finish all five quests, checkpoint immediately and preserve RPG progression',()=>{
  for(const [branch,companion] of [['moon','mira'],['stone','bram']]){
    const c=setup(),{x,p,r}=c;p.level=4;p.xp=65;p.gold=7;r.syncPoints(p);r.chooseClass(p,'arcanist');r.learn(p,'magicTraining');r.equip(p,'travelerSword');
    const old={rpg:copy(p.rpg),xp:p.xp,hp:p.hp,level:p.level};
    forest(c,branch);assert.equal(p.exploration.quests.bridge,'complete');ruins(c);const result=finish(c,companion);
    assert.equal(result.completedChapter,true);assert.ok(p.exploration.completedChapter);assert.equal(result.reward.cosmetic,companion==='mira'?'runeGlow':'leafGlow');
    assert.ok(Object.values(p.exploration.quests).every(status=>status==='complete'));
    assert.equal(p.exploration.choices.crossroad,branch);assert.equal(p.exploration.choices.restoration,companion);
    assert.equal(p.gold,77);assert.equal(p.xp,old.xp);assert.equal(p.hp,old.hp);assert.equal(p.level,old.level);assert.deepEqual(copy(p.rpg),old.rpg);
    const saved=reload(c);assert.ok(saved.exploration.completedChapter);assert.equal(saved.gold,77);
    walk(c,'c-choice');const once=copy(saved.exploration);const h=interact(c,'c-choice');assert.equal(h.phase,'info');x.close(saved);
    assert.deepEqual(copy(saved.exploration),once);solve(c,'c-final-'+companion);assert.equal(saved.gold,77);
  }
});

test('Both companions recruit independently, one follows, switching does not trap actors and hints never solve puzzles',()=>{
  const c=setup(),{x,p}=c;for(const id of ['f-map','f-rowan','f-directions'])solve(c,id);
  assert.equal(x.selectCompanion(p,'bram'),false);solve(c,'f-mira');assert.deepEqual(Array.from(p.exploration.recruited),['mira']);
  const h=interact(c,'f-bram');assert.ok(x.hint(p,h).startsWith('미라:'));assert.equal(p.exploration.completed.includes('f-bram'),false);
  walk(c,'f-tracks');x.interact(p,'f-tracks');x.close(p);assert.deepEqual(Array.from(p.exploration.recruited),['mira','bram']);
  assert.ok(x.selectCompanion(p,'bram'));let f=x.follow(p,1/60);assert.equal(f.id,'bram');assert.ok(x.walkable(p,p.exploration.area,f.x,f.y));
  walk(c,'f-river-mushroom');f=x.follow(p,.1);assert.ok(Math.hypot(f.x-p.exploration.x,f.y-p.exploration.y)<=150);
  assert.ok(x.sense(p).includes('f-river-mushroom'));assert.ok(x.companionDialogue(p).english);
  assert.ok(x.selectCompanion(p,'mira'));assert.deepEqual(Array.from(x.sense(p)),[]);f=x.follow(p,.1);assert.equal(f.id,'mira');
  const restored=reload(c);assert.equal(restored.exploration.activeCompanion,'mira');assert.equal(restored.exploration.recruited.length,2);
});

test('Secret areas use environmental clues and checkpoint common, rare and educational rewards exactly once',()=>{
  const c=setup(),{x,p}=c;for(const id of ['f-map','f-rowan','f-directions'])solve(c,id);
  const locked=interact(c,'f-grove');assert.equal(locked.phase,'info');x.close(p);solve(c,'f-secret');portal(c,'f-grove');
  assert.ok(p.exploration.discovered.includes('grove'));const prize=solve(c,'g-order');
  assert.equal(prize.reward.gold,12);assert.equal(prize.reward.potions,1);assert.equal(prize.reward.note,'grove-scroll');
  assert.ok(p.exploration.notes.includes('grove-scroll'));const gold=p.gold;reload(c);solve(c,'g-order');assert.equal(c.p.gold,gold);
  solve(c,'g-listen');solve(c,'g-read');portal(c,'g-forest');
  solve(c,'f-mira');solve(c,'f-bram');choose(c,'f-crossroad','moon');solve(c,'f-moon');solve(c,'f-bridge');portal(c,'f-ruins');
  solve(c,'r-gate');solve(c,'r-vault');portal(c,'r-vault-door');
  for(const id of ['v-order','v-read','v-response'])solve(c,id);
  const h=interact(c,'v-cache');assert.equal(h.phase,'reward');assert.equal(h.feedback.reward.gearId,'scholarAmulet');
  assert.equal(x.interact(c.p,'v-cache'),null);x.close(c.p);const balance=c.p.gold;reload(c);
  const again=interact(c,'v-cache');assert.equal(again.phase,'info');assert.equal(c.p.gold,balance);
  assert.equal(c.p.rpg.collection.filter(id=>id==='scholarAmulet').length,1);assert.ok(c.p.exploration.discovered.includes('vault'));
});

test('Every authored activity is solvable in the physical world, including both branch discoveries after reconnecting',()=>{
  const c=setup();forest(c,'moon');ruins(c);finish(c,'mira');
  for(const id of ['c-final-bram','c-quiet','c-tall','c-response','c-read'])solve(c,id);
  assert.equal(c.p.exploration.choices.restoration,'mira');assert.deepEqual(Array.from(c.p.exploration.cosmetics),['runeGlow']);
  portal(c,'c-ruins');for(const id of ['r-vault','r-book','r-open','r-help','r-listen','r-near'])solve(c,id);
  portal(c,'r-vault-door');for(const id of ['v-order','v-read','v-response'])solve(c,id);portal(c,'v-ruins');portal(c,'r-forest');
  for(const id of ['f-stone','f-secret','f-camp','f-river','f-together'])solve(c,id);
  portal(c,'f-grove');for(const id of ['g-order','g-listen','g-read'])solve(c,id);
  assert.equal(c.p.exploration.completed.length,37);assert.equal(c.p.exploration.observed.length,37);
  for(const a of c.d.activities){assert.equal(c.p.voice.records[a.id].correct,1,a.id);assert.ok(c.p.learning[a.tags[0]].seen,a.id);}
});

test('Listening text assistance is recorded honestly; practice stays independent of physical gates and rewards',()=>{
  const c=setup(),{x,p}=c,h=x.practice(p,'c-listen');assert.equal(h.phase,'question');
  assert.ok(x.assist(p,h,'fallback'));assert.ok(x.assist(p,h,'fallback'));assert.ok(x.assist(p,h,'transcript'));
  assert.equal(x.assist(p,h,'unknown'),false);const result=x.answer(p,h,h.activity.reviewAnswer);assert.ok(result.correct);
  const record=p.voice.records['c-listen'];assert.equal(record.assistedCorrect,1);assert.equal(record.fallback,1);assert.equal(record.transcript,1);
  assert.equal(p.gold,0);assert.equal(p.exploration.completed.includes('c-listen'),false);assert.equal(p.exploration.completedChapter,false);
  assert.equal(p.exploration.quests.path,'locked');x.close(p);
});

test('Hydration validates positions, locks contradictory flags and never credits already-earned rewards',()=>{
  const c=setup(),{e,x,p}=c;let raw=copy(p);
  Object.assign(raw.exploration,{area:'cavern',x:500,y:150,completed:['c-final-bram','r-fragment'],recruited:['ghost'],activeCompanion:'ghost',completedChapter:true,
    choices:{crossroad:'bad',restoration:'bram'},opened:['v-cache'],cosmetics:['leafGlow']});
  let restored=e.hydrate(raw);assert.equal(restored.exploration.area,'forest');assert.equal(restored.exploration.completed.length,0);
  assert.equal(restored.exploration.completedChapter,false);assert.equal(restored.exploration.opened.length,0);assert.equal(restored.exploration.recruited.length,0);
  for(const point of [{x:100,y:100},{x:700,y:300},{x:-1,y:20},{x:Infinity,y:NaN}]){
    raw=copy(p);Object.assign(raw.exploration,point);restored=e.hydrate(raw);
    assert.equal(restored.exploration.x,100);assert.equal(restored.exploration.y,450);assert.ok(x.walkable(restored,'forest',100,450));
  }
  forest(c,'stone');const gold=c.p.gold;raw=copy(c.p);raw.exploration.rewarded=[];
  restored=e.hydrate(raw);assert.equal(restored.gold,gold);assert.ok(restored.exploration.rewarded.includes('quest-bridge'));
  assert.equal(x.answer(restored,{phase:'question'},'forged'),null);
});

test('Authentic v5 migration preserves existing state and slots; fresh exploration cannot overwrite future version data',()=>{
  const c=setup(false),{e,storage}=c;
  const old=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/v05-completed.json'),'utf8'));
  const text=JSON.stringify(old);storage.set(e.v5Key,text);const migrated=e.load();
  assert.equal(migrated.version,7);assert.equal(storage.get(e.v5Key),text);
  for(const key of ['level','xp','gold','hp','currentChapter','chapterComplete'])assert.equal(migrated[key],old[key],key);
  for(const key of ['rpg','village','voice','learning','settings'])assert.deepEqual(copy(migrated[key]),old[key],key);
  assert.equal(migrated.exploration.area,'forest');assert.equal(migrated.exploration.completed.length,0);assert.ok(c.x.available(migrated));
  storage.set(e.saveKey,JSON.stringify({version:8,marker:'future'}));assert.equal(e.save(migrated),false);assert.equal(JSON.parse(storage.get(e.saveKey)).marker,'future');
});

test('All exploration misses survive shared hydration and can be reviewed by the original notebook without world progression',()=>{
  const c=setup(),{x,e,d,v}=c;
  for(const a of d.activities){
    const h=x.practice(c.p,a.id);
    const wrong=a.kind==='order'?[...a.words].reverse().join(' '):h.choices.find(choice=>choice!==(a.physical?a.reviewAnswer:a.answer));
    assert.equal(x.answer(c.p,h,wrong).correct,false,a.id);x.close(c.p);
  }
  assert.equal(c.p.exploration.completed.length,0);assert.equal(c.p.gold,0);
  reload(c);const p=c.p;
  assert.equal(e.reviewList(p).filter(entry=>entry.question.chapter===3).length,37);
  assert.equal(v.today(p).due.filter(entry=>d.activities.some(a=>a.id===entry.id)).length,37);
  const before=copy(p.exploration);
  for(const a of d.activities){
    assert.equal(p.mistakes[a.id],1);assert.equal(p.voice.records[a.id].wrong,1);assert.equal(p.learning[a.tags[0]].wrong,1);
    const h=e.startReview(p,a.id,()=>.5);assert.ok(h);
    const value=h.question.type==='order'?h.question.choices.join(' '):h.question.answer;
    assert.equal(e.answerReview(p,h,value).correct,true,a.id);assert.equal(e.answerReview(p,h,value),null);
  }
  assert.deepEqual(copy(p.exploration),before);assert.equal(p.gold,0);assert.equal(p.xp,0);
  assert.ok(p.achievements.includes('firstReview'));assert.equal(v.dashboard(p).categories.listening.wrong,d.activities.filter(a=>a.type==='listening').length);
  assert.ok(v.today(p).completed>=37);reload(c);
  for(const a of d.activities)assert.equal(c.p.voice.records[a.id].correct,1,a.id);
});

test('Shared trials can reuse introduced exploration language and settle only their own rewards',()=>{
  const beginner=setup(false);beginner.p.started=true;
  beginner.p.rpg.dungeons.words.clears=1;beginner.p.rpg.dungeons.sentences.clears=1;
  for(const seed of [0,.13,.5,.87,.999])for(const room of ['sentences','echoes']){
    const run=beginner.t.start(beginner.p,room,()=>seed);
    assert.ok(run.questions.every(q=>q.chapter!==3),'unseen world instructions do not enter beginner trial decks');
    assert.ok(run.questions.every(q=>q.chapter!==2),'village content remains gated');
  }
  beginner.p.exploration=null;
  assert.ok(beginner.t.start(beginner.p,'echoes',()=>.5),'older callers without exploration state remain supported');
  const c=setup(),{p,e,t,d}=c;
  const originals=d.activities.filter(a=>a.type==='order'||a.type==='listening');
  for(const a of originals){e.record(p,c.q.find(q=>q.id===a.id),false);p.exploration.observed.push(a.id);}
  // The existing first trial is complete, so both mixed decks are reachable.
  p.rpg.dungeons.words.clears=1;
  const before=copy(p.exploration),seen=new Set();
  for(const room of ['sentences','echoes']){
    for(let runNo=0;runNo<4;runNo++){
      const run=t.start(p,room,()=>.321);
      for(let i=0;i<5;i++){
        const q=run.question;if(q.chapter===3)seen.add(q.id);
        const value=q.type==='order'?q.choices.join(' '):q.answer;
        assert.equal(t.answer(p,run,value).correct,true);assert.equal(t.answer(p,run,value),null);
        if(i<4)assert.ok(t.next(p,run));
      }
      assert.equal(run.reward.gold,runNo===0?(room==='sentences'?25:30):0);t.next(p,run);
    }
  }
  assert.ok(seen.size>=8,'mixed decks actually selected several new authored entries');
  assert.deepEqual(copy(p.exploration),before);assert.equal(p.gold,55);assert.equal(p.xp,0);
});

test('Leaving exploration for a legacy battle preserves the exact checkpoint after victory, defeat, reload and retry',()=>{
  const c=setup(),{e,x,village}=c;
  forest(c,'moon');solve(c,'r-gate');solve(c,'r-inscription');
  function checkpoint(){const s=c.p.exploration;return copy({area:s.area,x:s.x,y:s.y,direction:s.direction,
    completed:[...s.completed].sort(),opened:[...s.opened].sort(),quests:s.quests,choices:s.choices,
    recruited:[...s.recruited].sort(),activeCompanion:s.activeCompanion});}
  const remembered=checkpoint(),spawn=c.d.areas.ruins.spawn;
  assert.equal(remembered.area,'ruins');assert.ok(Math.hypot(remembered.x-spawn.x,remembered.y-spawn.y)>100);
  const originalGold=c.p.gold,originalXp=c.p.xp;
  function fight(b,right){
    for(let turn=0;b.phase==='PLAYER_SELECT'&&turn<100;turn++){
      const task=e.select(c.p,b,'sword',()=>.37);assert.ok(task);assert.notEqual(task.question.chapter,3);
      const value=right?task.question.answer:task.choices.find(choice=>choice!==task.question.answer);
      assert.equal(e.answer(c.p,b,value).correct,right);
      const action=e.playerAction(c.p,b);if(!action.won)e.enemyAction(c.p,b);
    }
    assert.equal(b.phase,right?'VICTORY':'DEFEAT');
  }
  assert.ok(village.selectChapter(c.p,1));const victory=e.battle(c.p,1);fight(victory,true);
  const prize=e.reward(c.p,victory);assert.equal(prize.gold,0);assert.equal(prize.xp,0);
  assert.ok(x.enter(c.p));assert.deepEqual(checkpoint(),remembered);

  assert.ok(village.selectChapter(c.p,1));const defeat=e.battle(c.p,1);fight(defeat,false);
  assert.equal(c.p.hp,0);assert.equal(e.reward(c.p,defeat),null);assert.deepEqual(checkpoint(),remembered);
  assert.ok(e.save(c.p));c.p=e.load();assert.equal(c.p.currentChapter,1);assert.equal(c.p.hp,0);
  assert.ok(x.enter(c.p));assert.deepEqual(checkpoint(),remembered);assert.equal(c.p.hp,0,'returning to the map does not invent healing');

  assert.ok(village.selectChapter(c.p,1));const retry=e.battle(c.p,1);
  assert.equal(retry.hp,e.stats(c.p).maxHp);fight(retry,true);assert.equal(e.reward(c.p,retry).replay,true);
  assert.ok(x.enter(c.p));assert.deepEqual(checkpoint(),remembered);assert.ok(c.p.hp>0);
  assert.equal(c.p.gold,originalGold);assert.equal(c.p.xp,originalXp);
});
