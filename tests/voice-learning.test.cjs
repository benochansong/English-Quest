const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=['questions','village-data','voice-data','engine','village-engine','voice-learning']
  .map(n=>fs.readFileSync(path.join(__dirname,'../src',n+'.js'),'utf8')).join('\n');
function setup() {
  const store=new Map();
  const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  const api=vm.runInNewContext(source+'\n;({e:Engine,l:VoiceLearning,d:VoiceData,v:VillageEngine,Q})',{localStorage});
  return {...api,p:api.e.fresh(),store};
}
function answer(l,p,h,mode='choice',now=Date.now()) {
  return l.submit(p,h,h.activity.answer,{mode,now});
}
test('Forty authored activities and seven valid multi-turn missions can be completed offline',()=>{
  const {l,d,p}=setup();
  assert.equal(new Set(d.activities.map(a=>a.id)).size,40);
  for(const a of d.activities) {
    assert.ok(a.objective && a.ko && a.explanation && a.fallback && a.tags.length);
    const h=l.start(p,a.id);
    if(h.choices.length) assert.equal(h.choices.filter(c=>c===a.answer).length,1);
    const result=answer(l,p,h,h.choices.length?'choice':'text');
    assert.ok(result.correct);
    assert.equal(answer(l,p,h,'text'),null);
  }
  for(const m of d.missions) {
    for(const [step,id] of Array.from(m.ids).entries()) {
      assert.equal(l.missionStep(p,m.id),step);
      const h=l.startMission(p,m.id);
      assert.equal(h.activity.id,id);
      const miss=l.submit(p,h,h.choices.find(c=>c!==h.activity.answer));
      assert.equal(miss.correct,false);
      assert.ok(miss.reply?.english && miss.reply?.why);
      const retry=l.startMission(p,m.id);
      assert.equal(retry.step,step);
      assert.equal(answer(l,p,retry).done,step===m.ids.length-1);
    }
    assert.equal(l.startMission(p,m.id).step,0);
  }
  assert.equal(l.dashboard(p).missionsCompleted,7);
  assert.equal(p.gold+p.xp,0);
});
test('An unmatched transcript permits another attempt without a wrong mark, stored words, or duplicate success',()=>{
  const {l,p,e,store}=setup();
  const h=l.start(p,'vs-water');
  assert.ok(l.matches(h.activity,'  I’D   LIKE Some water, PLEASE!  '));
  assert.ok(l.matches(h.activity,'Some water, please.'));
  assert.equal(l.matches(h.activity,'I would like some bread, please.'),false);
  assert.equal(l.submit(p,h,'PRIVATE TRANSCRIPT',{mode:'speech'}).retrySpeech,true);
  assert.equal(p.voice.records['vs-water'],undefined);
  assert.equal(h.answered,false);
  assert.ok(l.submit(p,h,"I'd like some water, please!",{mode:'speech'}).correct);
  assert.equal(l.submit(p,h,'Some water, please.',{mode:'speech'}),null);
  assert.equal(l.dashboard(p).speakingAttempts,1);
  assert.equal(l.dashboard(p).categories.speaking.spoken,1);
  const stale=l.start(p,'vs-greet');
  const current=l.start(p,'vs-greet');
  assert.equal(answer(l,p,stale,'text'),null);
  assert.ok(answer(l,p,current,'text').correct);
  assert.equal(l.dashboard(p).categories.speaking.text,1);
  assert.equal(p.voice.speechAttempts,1);
  l.cancel(p);
  e.save(p);
  const raw=store.get(e.saveKey);
  assert.ok(!raw.includes('PRIVATE TRANSCRIPT') && !raw.includes('Some water, please.'));
});
test('Assisted and independent listening, older exercises and text practice retain separate counts',()=>{
  const {l,p,e,Q}=setup();
  const h=l.start(p,'vl-inn');
  assert.equal(l.assist(p,h,'translation'),true);
  l.assist(p,h,'transcript');l.assist(p,h,'transcript');
  answer(l,p,h);
  assert.equal(l.assist(p,h,'fallback'),false);
  e.record(p,Q.find(q=>q.type==='listening'),true);
  e.record(p,Q.find(q=>q.type==='vocab'),false);
  e.record(p,Q.find(q=>q.type==='order'),true);
  const listening=l.dashboard(p).categories.listening;
  assert.equal(listening.correct,2);
  assert.equal(listening.assistedCorrect,1);
  assert.equal(listening.transcript,1);
  assert.equal(listening.translation,1);
  assert.equal(l.dashboard(p).categories.order.correct,1);
  assert.equal(l.dashboard(p).categories.vocab.wrong,1);
  e.save(p);
  assert.deepEqual(l.dashboard(e.load()),l.dashboard(p));
});
test('Civil-date intervals span month and year boundaries; optional early practice does not push a review back',()=>{
  const {p,l}=setup();
  const id='vs-greet';
  function run(stamp,right=true,assisted=false) {
    const h=l.start(p,id,{review:true});
    if(assisted) l.assist(p,h,'translation');
    l.submit(p,h,right?h.activity.answer:'not the answer',{mode:'text',now:new Date(stamp).getTime()});
    return p.voice.records[id].dueDay;
  }
  assert.equal(run('2026-12-30T23:59:00'),'2026-12-31');
  assert.equal(run('2026-12-30T23:59:59'),'2026-12-31');
  assert.equal(l.today(p,new Date('2026-12-30T23:59:59')).count,0);
  assert.equal(l.today(p,new Date('2026-12-31T00:00:01')).due[0].id,id);
  assert.equal(run('2026-12-31T01:00:00'),'2027-01-03');
  assert.equal(run('2027-01-03T12:00:00'),'2027-01-10');
  assert.equal(run('2027-01-10T06:30:00'),'2027-01-24');
  assert.equal(run('2027-01-23T17:45:00',false),'2027-01-23');
  assert.equal(l.today(p,new Date('2027-01-23T23:00:00')).count,1);
  assert.equal(run('2027-01-23T23:01:00',true,true),'2027-01-24');
  assert.equal(l.today(p,new Date('2027-01-23T23:02:00')).completed,1);
});
test('Battle voice/text parity, damage and shields use normal turn locks and actual cooldowns',()=>{
  const {l,e,p}=setup();
  function skill(b,id,mode='choice') {
    const task=e.select(p,b,id), h=task.voiceHandle;
    assert.ok(e.voicePending(p,b,h));
    assert.equal(e.answer(p,b,h.activity.answer),null);
    if(mode==='speech') {
      assert.ok(l.submit(p,h,'MISHEARD',{mode}).retrySpeech);
      assert.equal(b.combo,0); assert.equal(e.playerAction(p,b),null);
    }
    const result=answer(l,p,h,mode);
    assert.ok(result.correct);
    assert.equal(answer(l,p,h,mode),null);
    const player=e.playerAction(p,b);
    assert.equal(e.playerAction(p,b),null);
    const enemy=player.won?null:e.enemyAction(p,b);
    assert.equal(e.enemyAction(p,b),null);
    return {player,enemy};
  }
  const b=e.battle(p,1);
  const first=skill(b,'voice','speech');
  assert.equal(first.player.damage,15);
  assert.equal(b.cooldowns.voice,1);
  assert.equal(e.select(p,b,'voice'),null);
  const echo=skill(b,'echo');
  assert.equal(echo.player.guard,true);
  assert.equal(echo.enemy.damage,2);
  assert.equal(b.cooldowns.echo,1);
  assert.equal(b.cooldowns.voice,0);
  assert.equal(skill(b,'burst').player.damage,24);
  assert.equal(b.cooldowns.burst,3);
  const last=skill(b,'voice','text');
  assert.equal(last.player.damage,16);
  assert.ok(last.player.won); assert.equal(last.enemy,null);
  assert.equal(e.reward(p,b).gold,15); assert.equal(e.reward(p,b),null);
  const stale=e.battle(p,1), task=e.select(p,stale,'voice');
  const replacement=e.battle(p,1);
  assert.equal(answer(l,p,task.voiceHandle,'text'),null);
  assert.equal(skill(replacement,'voice','text').player.damage,15);
  assert.equal(e.available({...replacement,stage:6,turn:3},'burst'),false);
  assert.equal(e.available({...replacement,training:true},'echo'),false);
});
test('Adaptation spaces recent work and successful active NPC missions advance dialogue only, without loot',()=>{
  const {l,e,p,v}=setup();
  const suggested=l.recommend(p,'speak');
  assert.equal(suggested.difficulty,1);
  answer(l,p,l.start(p,suggested.id),'text');
  assert.notEqual(l.recommend(p,'speak').id,suggested.id);
  p.chapterComplete=true;p.completed=[1,2,3];p.unlocked=3;
  assert.ok(v.selectChapter(p,2));
  assert.ok(v.accept(p,4));
  let result;
  do {result=answer(l,p,l.startMission(p,'vc-clara'));} while(!result.done);
  assert.equal(v.status(p,4),'ready');
  assert.equal(v.status(p,5),'locked');
  assert.equal(p.village.progress[4].completed,false);
  assert.equal(p.gold+p.xp,0);
  assert.ok(e.battle(p,4));
});
test('A completed v3 fixture migrates through v4 without replacing earlier slots or inventing audio history',()=>{
  const {e,l,store}=setup();
  const text=fs.readFileSync(path.join(__dirname,'fixtures/v03-completed.json'),'utf8');
  const old=JSON.parse(text);
  store.set(e.v3Key,text); store.set(e.v2Key,JSON.stringify({version:2,gold:9}));
  const p=e.load();
  assert.equal(p.version,4);
  for(const [key,val] of Object.entries(old)){
    if(key==='version')continue;
    assert.deepEqual(JSON.parse(JSON.stringify(p[key])),key==='settings'?{...val,speechVolume:1}:val);
  }
  assert.equal(l.dashboard(p).speakingAttempts,0);
  assert.ok(l.today(p).due.length>0);
  const h=l.startMission(p,'vc-rowan');answer(l,p,h);e.save(p);
  assert.equal(l.startMission(e.load(),'vc-rowan').step,1);
  assert.equal(store.get(e.v3Key),text);
  const malformed=JSON.parse(store.get(e.saveKey));
  malformed.voice.recent=[{id:'vs-greet',day:'junk',transcript:'private'}];
  malformed.voice.missions={'vc-clara':-5};
  malformed.voice.records={'vs-greet':{correct:-3,dueDay:'9999-96-67',rawAudio:'oops'}};
  const cleaned=e.hydrate(malformed);
  assert.equal(cleaned.voice.records['vs-greet'].correct,0);
  assert.equal(cleaned.voice.records['vs-greet'].dueDay,'');
  assert.equal(cleaned.voice.recent.length,0);
  assert.equal(cleaned.voice.missions['vc-clara'],undefined);
  assert.ok(!JSON.stringify(cleaned).includes('oops'));
});

test('Recommendations use unresolved evidence and remove a corrected expression immediately',()=>{
  const {l,p}=setup();
  for(let i=0;i<2;i++) {
    const h=l.start(p,'vs-greet');
    l.submit(p,h,'I am a visitor.',{mode:'text'});
    assert.equal(l.dashboard(p).recommendation?.id || null,i===0?null:'vs-greet');
  }
  const before=l.dashboard(p);
  assert.equal(before.reviewNeeded,1);
  // The briefing introduces both the "Hello" notebook card and the full phrase.
  assert.equal(before.encountered,2);
  assert.ok(before.total>before.encountered);
  answer(l,p,l.start(p,'vs-greet',{review:true}),'text');
  const after=l.dashboard(p);
  assert.equal(after.recommendation,null);
  assert.equal(after.reviewNeeded,0);
  assert.equal(after.recent.at(-1).correct,true);
});
