const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'../src');
const files=['questions.js','village-data.js','voice-data.js','exploration-data.js','curriculum-data.js',
  ...fs.readdirSync(path.join(dir,'curriculum-packs')).filter(n=>n.endsWith('.js')).sort().map(n=>'curriculum-packs/'+n),
  'rpg.js','engine.js','village-engine.js','voice-learning.js','exploration-engine.js','academy-engine.js','backup.js'];
const source=files.map(n=>fs.readFileSync(path.join(dir,n),'utf8')).join('\n');
const copy=value=>JSON.parse(JSON.stringify(value));
function setup(){
  const data=new Map(),fault={mode:null,used:false},localStorage={
    getItem:key=>data.get(key)??null,
    setItem(key,value){
      if(fault.mode==='stage'&&key==='EnglishQuest.import.pending.v1')throw Error('quota');
      if(key==='EnglishQuest.v8'&&!fault.used){
        if(fault.mode==='write'){fault.used=true;throw Error('write denied');}
        if(fault.mode==='corrupt'){fault.used=true;data.set(key,'broken write');return;}
        if(fault.mode==='ignore'){fault.used=true;return;}
      }
      data.set(key,value);
    },removeItem:key=>data.delete(key)};
  const api=vm.runInNewContext(source+'\n;({b:Backup,e:Engine,a:Academy,c:Curriculum})',{localStorage});
  const p=api.e.fresh();p.started=true;api.e.save(p);return {...api,p,data,fault};
}
function fixture(name){return JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures',name),'utf8'));}

test('Export writes no storage, includes validated progression and drops keys, transcripts and unrelated personal fields',()=>{
  const {b,e,p,a,c,data}=setup();const h=a.startExact(p,c.activities[0].id);a.advance(p,h);a.answer(p,h,h.activity.answer);
  p.apiKey='private-key';p.transcript='private-spoken-words';p.unrelated={email:'private-email'};
  p.settings.apiKey='private-setting-key';p.academy.records[c.activities[0].id].recognized='private-recognition';
  p.academy.extra={secret:'private-extra'};const before=[...data.entries()];
  const out=b.export(p,new Date('2026-12-31T12:00:00Z').getTime());assert.ok(out);assert.ok(out.filename.endsWith('2026-12-31.json'));
  const json=JSON.parse(out.text);assert.equal(json.format,'EnglishQuestBackup');assert.equal(json.schemaVersion,1);assert.equal(json.saveVersion,8);assert.equal(json.profile.version,8);
  assert.equal(json.profile.academy.records[c.activities[0].id].correct,1);assert.equal(out.summary.academyCompleted,1);
  assert.equal(/private-/.test(out.text),false);assert.deepEqual([...data.entries()],before);assert.equal(e.load().academy.records[c.activities[0].id],undefined);
});

test('Malformed, oversized UTF-8, wrong-schema, future and structurally invalid imports never change the active save',()=>{
  const {b,e,p,data}=setup(),before=data.get(e.saveKey);
  const invalid=['','not json','null','[]','{}',JSON.stringify({...p,version:9}),JSON.stringify({...p,version:6}),
    JSON.stringify({...p,gold:'10'}),JSON.stringify({...p,hp:-1}),JSON.stringify({...p,completed:'all'}),JSON.stringify({...p,academy:{records:[]}}),
    JSON.stringify({format:'other',schemaVersion:1,saveVersion:8,profile:p}),
    JSON.stringify({format:'EnglishQuestBackup',schemaVersion:2,saveVersion:8,profile:p}),
    JSON.stringify({format:'EnglishQuestBackup',schemaVersion:1,saveVersion:7,profile:p}),
    ' '.repeat(b.maxBytes+1),JSON.stringify({text:'한'.repeat(750000)})];
  for(const text of invalid){const result=b.preview(text);assert.equal(result.ok,false,text.slice(0,50));assert.equal(data.get(e.saveKey),before);}
});

test('Preview is read-only, cancellation is harmless, and confirmation uses an opaque captured candidate once',()=>{
  const {b,e,p,data}=setup(),original=data.get(e.saveKey),incoming=copy(p);incoming.gold=57;
  const first=b.preview(JSON.stringify(incoming));assert.ok(first.ok);assert.equal(first.profile.gold,57);assert.equal(first.summary.gold,57);assert.equal(data.get(e.saveKey),original);
  assert.equal(b.commit(first.handle).ok,false);assert.equal(data.get(e.saveKey),original);
  assert.ok(b.cancel(first.handle));assert.equal(b.commit(first.handle,{confirm:true}).ok,false);assert.equal(data.get(e.saveKey),original);
  const second=b.preview(JSON.stringify(incoming));second.profile.gold=999999;second.summary.gold=999999;
  assert.equal(b.commit({}, {confirm:true}).ok,false);const result=b.commit(second.handle,{confirm:true});assert.ok(result.ok);assert.equal(result.profile.gold,57);
  assert.equal(e.load().gold,57);assert.equal(b.commit(second.handle,{confirm:true}).ok,false);
  assert.equal([...data.keys()].some(k=>k.startsWith('EnglishQuest.import.')),false);
});

test('Changed current progress invalidates a preview; a future save slot is never overwritten',()=>{
  const {b,e,p,data}=setup(),incoming=copy(p);incoming.gold=50;
  const preview=b.preview(JSON.stringify(incoming));p.gold=7;e.save(p);
  assert.equal(b.commit(preview.handle,{confirm:true}).ok,false);assert.equal(e.load().gold,7);
  data.set(e.saveKey,JSON.stringify({version:9,marker:'future-state'}));const future=b.preview(JSON.stringify(incoming));assert.ok(future.ok);
  assert.equal(b.commit(future.handle,{confirm:true}).ok,false);assert.equal(JSON.parse(data.get(e.saveKey)).marker,'future-state');
});

test('Quota, rejected writes, silent no-ops and failed verification all preserve exact prior bytes',()=>{
  for(const mode of ['stage','write','ignore','corrupt']){
    const {b,e,p,data,fault}=setup(),original=data.get(e.saveKey),incoming=copy(p);incoming.gold=42;
    const preview=b.preview(JSON.stringify(incoming));fault.mode=mode;
    const result=b.commit(preview.handle,{confirm:true});assert.equal(result.ok,false,mode);assert.equal(data.get(e.saveKey),original,mode);
    assert.equal(e.load().gold,0,mode);assert.equal(b.commit(preview.handle,{confirm:true}).ok,false,mode);
  }
});

test('Supported historical profiles migrate without rewriting their original slots or existing chapters and equipment',()=>{
  for(const version of [1,2,3,4,5,7]){
    const {b,e,p,data}=setup();const old=version===1?{...copy(p),version:1}:fixture('v'+String(version).padStart(2,'0')+'-completed.json');
    const key=({1:e.legacyKey,2:e.v2Key,3:e.v3Key,4:e.v4Key,5:e.v5Key,7:e.v7Key})[version],text=JSON.stringify(old);data.set(key,text);
    const preview=b.preview(text);assert.ok(preview.ok,'version '+version);assert.equal(preview.profile.version,8);
    assert.equal(preview.profile.level,old.level);assert.equal(preview.profile.gold,old.gold);
    const expected=e.hydrate(old),result=b.commit(preview.handle,{confirm:true});assert.ok(result.ok);assert.deepEqual(copy(result.profile),copy(expected));
    assert.equal(data.get(key),text);assert.equal(e.load().gold,old.gold);
  }
});

test('Round-trip backup keeps v7 adventures plus academy records and SRS while rejecting mismatched nested structures',()=>{
  const {b,e,a,c,data}=setup();let p=e.hydrate(fixture('v07-completed.json'));
  const h=a.startExact(p,c.activities.find(q=>q.skill==='listening').id,{now:new Date('2026-12-31T12:00:00').getTime()});a.advance(p,h);a.assist(p,h,'fallback');a.answer(p,h,h.activity.answer);
  e.save(p);const expected=copy(e.hydrate(p)),out=b.export(p),preview=b.preview(out.text);assert.ok(preview.ok);
  assert.equal(preview.profile.academy.records[h.activity.id].fallback,1);assert.equal(preview.profile.exploration.completedChapter,true);
  const result=b.commit(preview.handle,{confirm:true});assert.ok(result.ok);assert.deepEqual(copy(result.profile),expected);assert.deepEqual(copy(e.load()),expected);
  const malformed=JSON.parse(out.text);malformed.profile.voice.records=[];const current=data.get(e.saveKey);
  assert.equal(b.preview(JSON.stringify(malformed)).ok,false);assert.equal(data.get(e.saveKey),current);
});

test('Import failure with no current slot does not leave an invented replacement behind',()=>{
  const {b,e,p,data,fault}=setup();data.delete(e.saveKey);const preview=b.preview(JSON.stringify(p));fault.mode='corrupt';
  assert.equal(b.commit(preview.handle,{confirm:true}).ok,false);assert.equal(data.has(e.saveKey),false);
});
