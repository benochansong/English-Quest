/* Controlled audio lifecycle tests. These validate events/mixing, not audible quality. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=['reborn-audio.js','reborn-voice.js'].map(n=>fs.readFileSync(path.join(__dirname,'../src',n),'utf8')).join('\n');
const manifest={utterances:[{id:'move',en:'Move left!',ko:'왼쪽으로 이동하세요.',available:false,embedded:null},{id:'fire',en:'I need fire.',ko:'나는 불이 필요해요.',available:true,embedded:'data:audio/wav;base64,VEVTVA=='}]};
function environment(extra={}){
  const lab={contexts:[],gains:[],oscillators:[],timers:new Map(),id:0};
  const param=()=>({value:0,calls:[],setTargetAtTime(...args){this.calls.push(['target',...args]);},setValueAtTime(...args){this.calls.push(['value',...args]);},exponentialRampToValueAtTime(...args){this.calls.push(['ramp',...args]);}});
  class Context {
    constructor(){this.currentTime=0;this.state='suspended';this.destination={};lab.contexts.push(this);}
    resume(){this.state='running';return Promise.resolve();}
    createGain(){const node={gain:param(),connect(){},disconnect(){this.disconnected=true;}};lab.gains.push(node);return node;}
    createOscillator(){const node={frequency:param(),connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};lab.oscillators.push(node);return node;}
  }
  const context={AudioContext:Context,setTimeout:fn=>{const id=++lab.id;lab.timers.set(id,fn);return id;},clearTimeout:id=>lab.timers.delete(id),...extra};
  const api=vm.runInNewContext(source+'\n;({RebornAudio,RebornVoice})',context);return {...api,lab,context};
}
function voiceLab(options={}){
  const e=environment(),files=[],utterances=[],heard=[],ducks=[],statuses=[];
  class AudioDouble {constructor(src){this.src=src;files.push(this);}play(){this.playCalls=(this.playCalls||0)+1;return Promise.resolve();}pause(){this.paused=true;}}
  class Utterance {constructor(text){this.text=text;}}
  const synth={getVoices:()=>[{lang:'en-US',name:'Local test voice',localService:true}],speak:u=>utterances.push(u),cancel(){this.cancelled=(this.cancelled||0)+1;}};
  const mixer={unlocked:true,voiceVolume:.6,duck:value=>ducks.push(value)};
  const voice=e.RebornVoice.create(manifest,mixer,{Audio:AudioDouble,speechSynthesis:synth,SpeechSynthesisUtterance:Utterance,onStatus:s=>statuses.push({...s}),onHeard:r=>heard.push({...r}),...options});
  return {...e,voice,mixer,files,utterances,heard,ducks,statuses,synth};
}
test('Reborn mixer is gesture-gated, has eleven distinct original cues and separate clamped volumes',()=>{
  const {RebornAudio,lab}=environment(),m=RebornAudio.create();
  assert.equal(lab.contexts.length,0);assert.equal(m.sfx('sword'),false);
  assert.equal(m.unlock(),true);assert.equal(lab.contexts.length,1);assert.equal(m.contextState,'running');
  assert.equal(Object.keys(RebornAudio.presets).length,11);
  for(const id of Object.keys(RebornAudio.presets))assert.equal(m.sfx(id),true,id);
  assert.equal(lab.oscillators.length,11);assert.ok(lab.oscillators.every(o=>o.started&&o.stopped));
  for(const o of lab.oscillators)o.onended();assert.ok(lab.oscillators.every(o=>o.disconnected));
  m.configure({master:.4,voice:.3,sfx:.2,music:0});assert.equal(m.voiceVolume,.12);
  m.configure({master:4,voice:-2,sfx:NaN,music:-1});assert.equal(m.settings.master,1);assert.equal(m.voiceVolume,0);assert.equal(m.settings.sfx,0);assert.equal(m.settings.music,0);
  m.configure({muted:true});assert.equal(m.voiceVolume,0);assert.equal(m.sfx('impact'),false);assert.equal(m.sfx('nonexistent'),false);
});
test('Reborn mixer ducks effects/ambience, restores gains and stops owned sound nodes',()=>{
  const {RebornAudio,lab}=environment(),m=RebornAudio.create({music:.5,sfx:.8});m.unlock();m.configure({music:.5});
  assert.equal(lab.oscillators.length,3);m.duck(true);assert.ok(Math.abs(lab.gains[1].gain.calls.at(-1)[1]-.28)<1e-9);
  m.duck(false);assert.equal(lab.gains[1].gain.calls.at(-1)[1],.8);
  m.sfx('dodge');m.stop();assert.ok(lab.oscillators.every(o=>o.stopped));assert.doesNotThrow(()=>m.stop());
});
test('Missing voice files remain honestly unavailable and never create listening evidence or automatic TTS',()=>{
  const {voice,mixer,files,utterances,heard}=voiceLab();assert.equal(voice.currentId,null);assert.equal(files.length,0);assert.equal(utterances.length,0);
  mixer.unlocked=false;assert.equal(voice.play('move'),false);assert.equal(voice.status.state,'blocked');
  mixer.unlocked=true;assert.equal(voice.play('move'),false);assert.equal(voice.status.state,'missing');assert.equal(voice.currentId,'move');
  assert.equal(voice.replay(),false);assert.equal(files.length,0);assert.equal(utterances.length,0);assert.deepEqual(heard,[]);
  assert.equal(voice.play('unknown'),false);assert.equal(voice.status.state,'missing');
  mixer.voiceVolume=0;voice.play('fire');assert.equal(voice.status.state,'muted');assert.equal(files.length,0);
});
test('File playback uses one channel; only playing marks heard; restart and stop invalidate captured old callbacks',()=>{
  const {voice,files,heard,ducks}=voiceLab();assert.equal(voice.play('fire'),true);assert.equal(voice.status.state,'loading');assert.deepEqual(heard,[]);
  const old=files[0],late=old.onplaying;assert.equal(old.volume,.6);assert.equal(old.playbackRate,1);assert.equal(old.preservesPitch,true);
  old.onplaying();assert.equal(voice.status.source,'asset');assert.equal(heard.length,1);assert.equal(ducks.at(-1),true);
  assert.equal(voice.replay(),true);assert.equal(old.paused,true);late();assert.equal(heard.length,1);
  const next=files[1],lateEnd=next.onended;next.onplaying();assert.equal(heard.length,2);voice.stop();lateEnd();assert.equal(ducks.at(-1),false);assert.equal(next.paused,true);
});
test('Slow and optional local browser fallback are labeled separately, respect volume, and restore ducking',()=>{
  const {voice,files,utterances,heard,ducks}=voiceLab();voice.configure({slow:true});voice.play('fire');assert.equal(files[0].playbackRate,.75);voice.stop();
  voice.configure({fallback:true});assert.equal(voice.play('move'),true);const u=utterances[0];assert.equal(u.text,'Move left!');assert.equal(u.rate,.75);assert.equal(u.volume,.6);assert.deepEqual(heard,[]);
  u.onstart();assert.equal(voice.status.source,'browser-fallback');assert.equal(heard[0].source,'browser-fallback');assert.equal(ducks.at(-1),true);
  u.onend();assert.equal(voice.status.state,'ended');assert.equal(ducks.at(-1),false);
  voice.configure({slow:false});voice.replay();assert.equal(utterances[1].rate,1);
});
test('Rejected/broken assets and playback timeouts clean up without inventing successful playback',async()=>{
  class Rejected {play(){return Promise.reject(new Error('not allowed'));}pause(){this.paused=true;}}
  const first=voiceLab({Audio:Rejected});first.voice.play('fire');await Promise.resolve();assert.equal(first.voice.status.state,'missing');assert.equal(first.heard.length,0);
  const second=voiceLab();second.voice.play('fire');second.files[0].onerror();assert.equal(second.voice.status.state,'missing');assert.equal(second.files[0].paused,true);assert.equal(second.heard.length,0);
  const third=voiceLab();third.voice.play('fire');const latePlaying=third.files[0].onplaying;for(const fn of [...third.lab.timers.values()])fn();assert.equal(third.voice.status.state,'error');assert.equal(third.files[0].paused,true);assert.equal(third.ducks.at(-1),false);assert.equal(third.heard.length,0);latePlaying();assert.equal(third.heard.length,0,'a late native callback after timeout cannot invent hearing');
  const fourth=voiceLab();fourth.voice.configure({fallback:true});fourth.voice.play('move');const lateStart=fourth.utterances[0].onstart;fourth.utterances[0].onerror();lateStart();assert.equal(fourth.heard.length,0,'late speech start after error is stale');
});
test('Fallback rejects remote-only voices and handles unavailable or throwing speech services safely',()=>{
  for(const synth of [undefined,{getVoices:()=>[{lang:'en-US',localService:false}],cancel(){},speak(){throw Error('remote voice must not be called');}},{getVoices:()=>[{lang:'en-US',localService:true}],cancel(){},speak(){throw Error('device unavailable');}}]){
    const a=voiceLab({speechSynthesis:synth});a.voice.configure({fallback:true});assert.doesNotThrow(()=>a.voice.play('move'));assert.equal(a.heard.length,0);assert.ok(['missing','error'].includes(a.voice.status.state));
  }
});

test('Production manifest has thirty honest, unique, licensed-or-missing file records',()=>{
  const actual=JSON.parse(fs.readFileSync(path.join(__dirname,'../REBORN_VOICE_MANIFEST.json'),'utf8'));
  assert.equal(actual.utterances.length,30);assert.equal(new Set(actual.utterances.map(x=>x.id)).size,30);
  for(const row of actual.utterances){
    assert.ok(row.en&&row.ko&&row.usage&&row.voiceCharacter&&row.accent,row.id);
    assert.ok(row.path.startsWith('assets/reborn/voice/')&&!row.path.includes('..'),row.id);
    assert.deepEqual(row.speedOptions,[1,.75]);
    const present=fs.existsSync(path.join(__dirname,'..',row.path));assert.equal(row.available,present,row.id+' availability');
    if(present)assert.ok(row.license.redistributionAllowed&&row.license.source&&row.license.type,row.id+' license');
    else assert.equal(row.license.redistributionAllowed,false,'absent audio is never represented as licensed/delivered');
  }
});

test('All combat event cue names route to an actual sound preset',()=>{
  const {RebornAudio}=environment(),m=RebornAudio.create();m.unlock();
  for(const id of ['sword_swing','sword_impact','slime_bounce','slime_warning','slime_jump','slime_rush','slime_land','slime_defeat','player_hit','magic_charge','magic_explosion','crystal_charge','boss_entrance','boss_defeat','boss_phase','correct','incorrect','defeat','dodge','victory'])assert.equal(m.sfx(id),true,id);
});
