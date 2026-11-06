'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const speech=fs.readFileSync(path.join(__dirname,'../src/speech.js'),'utf8');
const audio=fs.readFileSync(path.join(__dirname,'../src/audio.js'),'utf8');
function clock(){
  let sequence=0;
  const jobs=new Map();
  return {
    setTimeout(fn,delay){jobs.set(++sequence,{fn,delay});return sequence;},
    clearTimeout(id){jobs.delete(id);},
    next(){const entry=jobs.entries().next().value;
      assert.ok(entry,'expected a pending deadline');jobs.delete(entry[0]);entry[1].fn();},
    count(){return jobs.size;}
  };
}
function fixture({prefix=false,startError=null,unsupported=false}={}) {
  const time=clock(),instances=[],states=[],transcripts=[];
  class MockRecognition {
    constructor(){this.aborts=0;this.starts=0;instances.push(this);}
    start(){this.starts++;if(startError)throw Object.assign(new Error(),{name:startError});}
    abort(){this.aborts++;}
  }
  const env={...time};
  if(!unsupported)env[prefix?'webkitSpeechRecognition':'SpeechRecognition']=MockRecognition;
  const api=vm.runInNewContext(speech+';SpeechInput',env);
  const handlers={onState:(state,reason)=>states.push([state,reason]),onResult:text=>transcripts.push(text)};
  const latest=()=>instances.at(-1);
  const state=()=>states.at(-1)?.[0];
  return {api,time,instances,states,transcripts,handlers,start:()=>api.start(handlers),latest,state};
}
const event=(transcript,isFinal=true)=>({resultIndex:0,results:[Object.assign([{transcript}],{isFinal})]});
test('Detect capability without constructing or starting a recognizer; only explicit start asks',()=>{
  for(const prefix of [false,true]){
    const f=fixture({prefix});
    assert.equal(f.api.available(),true);
    assert.equal(f.instances.length,0);
    assert.equal(f.start(),true);
    assert.equal(f.state(),'requesting');
    assert.equal(f.latest().starts,1);
    assert.equal(f.latest().lang,'en-US');
    assert.equal(f.latest().interimResults,false);
    assert.equal(f.start(),false);
    assert.equal(f.instances.length,1);
    f.api.stop();
    assert.equal(f.latest().aborts,1);
    assert.equal(f.state(),'ready');
    assert.equal(f.time.count(),0);
  }
});
test('Capture and processing states reflect native events; one final result releases capture',()=>{
  const f=fixture();
  f.start();
  const rec=f.latest(),lateResult=rec.onresult,lateEnd=rec.onend;
  rec.onstart?.();
  assert.equal(f.state(),'requesting');
  rec.onaudiostart();
  rec.onspeechstart();
  assert.equal(f.state(),'listening');
  lateResult(event('wrong partial',false));
  assert.deepEqual(f.transcripts,[]);
  rec.onspeechend();
  rec.onaudioend();
  assert.equal(f.state(),'processing');
  lateResult(event('   Can you help me?  '));
  lateResult(event('duplicate'));
  lateEnd();
  assert.equal(f.state(),'result');
  assert.deepEqual(f.transcripts,['Can you help me?']);
  assert.deepEqual(f.states.map(row=>row[0]),['requesting','listening','processing','result']);
  assert.equal(rec.aborts,1);
  assert.equal(rec.onresult,null);
  assert.equal(f.time.count(),0);
});
test('Recover from permission, unsupported, device, silent-input and service failures',()=>{
  const missing=fixture({unsupported:true});
  assert.equal(missing.api.available(),false);
  assert.equal(missing.start(),false);
  assert.deepEqual(missing.states,[['unavailable','unsupported']]);
  const sync=fixture({startError:'NotAllowedError'});
  assert.equal(sync.start(),false);
  assert.equal(sync.state(),'denied');
  for(const [error,expected] of [['not-allowed','denied'],['service-not-allowed','denied'],
    ['audio-capture','unavailable'],['network','unavailable'],['no-speech','timeout'],['aborted','ready']]){
    const f=fixture();f.start();f.latest().onerror({error});
    assert.equal(f.state(),expected);
    assert.deepEqual(f.transcripts,[]);
    assert.equal(f.time.count(),0);
    assert.equal(f.start(),true,'a failure allows a fresh explicit attempt');
  }
});
test('Deadlines cover pending permission, open mic and waiting for a result, without committing answers',()=>{
  for(const phase of ['requesting','listening','processing']){
    const f=fixture();f.start();const rec=f.latest();
    if(phase!=='requesting')rec.onaudiostart();
    if(phase==='processing')rec.onspeechend();
    assert.equal(f.time.count(),1);
    f.time.next();
    assert.deepEqual(f.states.at(-1),['timeout',phase]);
    assert.equal(f.time.count(),0);
    assert.equal(rec.aborts,1);
    assert.deepEqual(f.transcripts,[]);
  }
});
test('Stopping and leaving invalidate late callbacks even after a new attempt starts',()=>{
  const f=fixture();
  f.start();
  const old=f.latest(),late=old.onresult,lateError=old.onerror;
  f.api.cancel();assert.equal(old.aborts,1);
  f.start();f.latest().onaudiostart();
  late(event('old words'));lateError({error:'network'});
  assert.equal(f.state(),'listening');assert.deepEqual(f.transcripts,[]);
  const pending=f.latest().onresult;
  f.api.stop();pending(event('after stop'));assert.equal(f.state(),'ready');
  assert.deepEqual(f.transcripts,[]);
  f.api.start({onState:s=>{if(s==='result')f.api.cancel();},onResult:()=>assert.fail('page was closed')});
  f.latest().onresult(event('discard this'));
});
test('No-match and empty end can be retried without retaining an interim transcript',()=>{
  for(const name of ['onend','onnomatch']){
    const f=fixture();f.start();f.latest().onresult(event('temporary',false));f.latest()[name]();
    assert.deepEqual(f.states.at(-1),['ready','no-match']);
    assert.equal(f.time.count(),0);
    assert.deepEqual(f.transcripts,[]);
  }
});
test('Speech synthesis respects per-play speed and speech volume; muted audio selects text fallback',()=>{
  const time=clock(),utterances=[];
  const api=vm.runInNewContext(audio+';AudioFX',{...time,
    SpeechSynthesisUtterance:class {constructor(text){this.text=text;}},
    speechSynthesis:{getVoices:()=>[{lang:'en-US',localService:true}],cancel(){},speak:u=>utterances.push(u)}
  });
  const cfg={voice:true,speechRate:'normal',speechVolume:.37};
  assert.equal(api.canSpeak({...cfg,speechVolume:0}),false);
  assert.equal(api.speak('Hello',{...cfg,speechVolume:0}),false);
  assert.equal(utterances.length,0);
  let started=0,ended=0,failed=0;
  const callbacks={rate:'slow',onStart:()=>started++,onEnd:()=>ended++};
  api.speak('Excuse me.',cfg,()=>failed++,callbacks);
  let spoken=utterances.at(-1);
  assert.equal(spoken.rate,.71);assert.equal(spoken.volume,.37);
  spoken.onstart();assert.equal(started,1);
  const oldEnd=spoken.onend;
  api.speak('Please.',{...cfg,speechRate:'slow'},()=>failed++,{...callbacks,rate:'normal'});
  assert.equal(ended,1);oldEnd();assert.equal(ended,1);
  spoken=utterances.at(-1);assert.equal(spoken.rate,1);
  spoken.onstart();spoken.onend();
  assert.equal(ended,2);assert.equal(time.count(),0);assert.equal(failed,0);
  api.speak('Stopped engine',cfg,()=>failed++,callbacks);
  utterances.at(-1).onstart();time.next();assert.equal(failed,1);assert.equal(ended,3);
});
