// Recognition belongs to a single open activity. A transcript is never put on the profile.
function voiceContextScreen(){
  return ['VOICE_PRACTICE','QUESTION_ACTIVE','ANSWER_FEEDBACK'].includes(game.screen);
}
function voiceReturnHome(){return game.profile.currentChapter===2?'VILLAGE':'MAP';}
function silenceVoice(clearInput=true){
  SpeechInput.cancel();AudioFX.stop();
  const v=game.voice;
  if(!v)return;
  v.micState=SpeechInput.available()?'ready':'unavailable';
  v.micMessage='';v.transcript='';v.mismatch=false;
  if(clearInput)v.draft='';
}
function discardVoice(){
  silenceVoice();
  VoiceLearning.cancel(game.profile);
  game.voice=null;
}
function setupVoice(handle,origin,mission=null,history=[]){
  if(!handle)return false;
  SpeechInput.cancel();AudioFX.stop();
  if(mission&&handle.step>0&&!history.length){
    history=mission.ids.slice(0,handle.step).map(id=>{
      const a=voiceActivity(id);
      return {npc:a.npc,prompt:a.english,answer:a.answer,reply:a.replies[a.answer].english};
    });
  }
  game.voice={handle,activity:handle.activity,origin,mission,history,stage:'brief',result:null,
    micState:SpeechInput.available()?'ready':'unavailable',micTried:false,mismatch:false,micMessage:'',
    transcript:'',textMode:false,draft:'',noAudio:false,transcriptHint:false,translationHint:false};
  save();
  change(origin==='battle'?'QUESTION_ACTIVE':'VOICE_PRACTICE');
  return true;
}
function voiceFallback(v){
  if(v!==game.voice||!voiceContextScreen()||v.stage!=='active'||v.result)return;
  v.noAudio=true;
  VoiceLearning.assist(game.profile,v.handle,'fallback');
  if(v.activity.mode==='identify')v.translationHint=true;
  else v.transcriptHint=true;
  render();
}
function voicePlay(rate='normal'){
  const v=game.voice;
  if(!v||!voiceContextScreen())return;
  if(['requesting','listening','processing'].includes(v.micState)){
    SpeechInput.stop();
  }
  const spoken=v.result?(v.result.reply?.english||v.activity.english):v.activity.english;
  const nodes=[...app.querySelectorAll('.voice-prompt [lang="en"],.voice-playback button')]
    .filter(el=>el.textContent.trim()===spoken||el.dataset.id===rate);
  const ok=AudioFX.speak(spoken,game.profile.settings,()=>{if(isAural(v.activity))voiceFallback(v);},{
    rate,onStart:()=>nodes.forEach(el=>el.classList.add('speaking')),onEnd:()=>nodes.forEach(el=>el.classList.remove('speaking'))
  });
  if(!ok&&isAural(v.activity))voiceFallback(v);
}
function beginVoice(){
  const v=game.voice;
  if(!v||v.stage!=='brief')return;
  v.stage='active';
  if(isAural(v.activity)&&!AudioFX.canSpeak(game.profile.settings))voiceFallback(v);
  else {
    render();
    if(isAural(v.activity))voicePlay(game.profile.settings.speechRate);
  }
  app.querySelector('.voice-input button:not(:disabled)')?.focus({preventScroll:true});
}
function voiceMicStart(){
  const v=game.voice;
  if(!v||v.stage!=='active'||v.result||!isSpeakingTurn(v.activity))return;
  if(['requesting','listening','processing'].includes(v.micState))return;
  AudioFX.stop();v.transcript='';v.micMessage='';v.mismatch=false;v.micTried=true;
  const current=()=>game.voice===v&&voiceContextScreen()&&v.stage==='active'&&!v.result;
  SpeechInput.start({
    onState(state,reason){
      if(!current())return;
      v.micState=state;
      v.micMessage=({'audio-capture':'마이크를 찾을 수 없어요. 글로 답하거나 연결 후 다시 시도하세요.',
        network:'브라우저 음성 서비스에 연결하지 못했어요. 글로 계속할 수 있어요.',
        'no-match':'단어를 인식하지 못했어요. 다시 말하거나 글로 답해 주세요.',
        'no-speech':'음성이 들리지 않았어요. 다시 시도하거나 글로 답해 주세요.',
        stopped:'마이크를 중지했어요.'})[reason]||'';
      // Keep the prompt, typed response and keyboard focus intact on async status updates.
      const panel=app.querySelector('.mic-panel');
      const hadFocus=panel?.contains(document.activeElement);
      if(panel)panel.outerHTML=micPanel(v);
      const live=document.getElementById('voice-live');
      if(live)live.textContent=(micLabels[state]||state)+' '+v.micMessage;
      if(hadFocus)app.querySelector('[data-act="mic-stop"],[data-act="mic-start"]')?.focus({preventScroll:true});
    },
    onResult(transcript){
      if(!current())return;
      v.transcript=transcript.slice(0,360);v.micState='result';v.mismatch=false;
      const panel=app.querySelector('.mic-panel');
      if(panel)panel.outerHTML=micPanel(v);
      app.querySelector('[data-act="mic-confirm"]')?.focus({preventScroll:true});
    }
  });
}
function submitVoice(value,mode){
  const v=game.voice,p=game.profile;
  if(!v||v.stage!=='active'||v.result||typeof value!=='string'||!value.trim())return;
  SpeechInput.cancel();AudioFX.stop();
  const r=VoiceLearning.submit(p,v.handle,value,{mode});
  if(!r)return;
  save();
  if(r.retrySpeech){
    v.mismatch=true;v.micMessage='일부 단어가 다르게 인식되었어요. 천천히 다시 말하거나 글로 답해 보세요.';
    render();return;
  }
  v.result=r;v.stage='feedback';v.answerMode=mode;v.draft='';v.transcript='';
  if(v.mission){
    // History is constructed from authored lines, never from raw speech or free text.
    const authoredAnswer=mode==='choice'?value:r.correct?v.activity.answer:'다시 연습';
    v.history.push({npc:v.activity.npc,prompt:v.activity.english,answer:authoredAnswer,
      reply:r.reply?.english||v.activity.answer});
    if(v.history.length>20)v.history.shift();
  }
  if(v.origin==='battle'){
    game.feedback=r;change('ANSWER_FEEDBACK');
  }else change('VOICE_PRACTICE');
  AudioFX.play(r.correct?'correct':'wrong',p.settings);
}
function exitVoice(){
  const origin=game.voice?.origin;
  if(origin==='battle')return;
  discardVoice();
  change(origin==='today'?'TODAY':origin==='location'?'LOCATION':origin==='dashboard'?'DASHBOARD':'VOICE_HALL');
}
function voiceNext(){
  const v=game.voice;
  if(!v?.result||v.origin==='battle')return;
  if(v.mission&&!v.result.done){
    const handle=VoiceLearning.startMission(game.profile,v.mission.id);
    if(setupVoice(handle,v.origin,v.mission,v.history))beginVoice();
  }else if(!v.result.correct){
    if(setupVoice(VoiceLearning.start(game.profile,v.activity.id,{review:v.origin==='today'}),v.origin))beginVoice();
  }else exitVoice();
}
function launchReviewEntry(id,origin='today'){
  const a=voiceActivity(id);
  if(a){setupVoice(VoiceLearning.start(game.profile,id,{review:true}),origin);return;}
  game.reviewFrom=origin==='today'?'TODAY':'DASHBOARD';
  game.dailyLegacy=true;
  openReviewQuestion(id);
}
function voiceAction(action,id){
  const s=game.screen,p=game.profile,v=game.voice;
  const menuScreens=['MAP','VILLAGE','DASHBOARD','VOICE_HALL','TODAY','LOCATION','REVIEW','BOOK','CHAPTER_COMPLETE','VILLAGE_END'];
  if(action==='voice-hall'&&menuScreens.includes(s)){
    game.voiceTab=Object.hasOwn(voiceTabs,id)?id:'speak';change('VOICE_HALL');return true;
  }
  if(action==='today'&&menuScreens.includes(s)){change('TODAY');return true;}
  if(action==='voice-home'&&['VOICE_HALL','TODAY'].includes(s)){change(voiceReturnHome());return true;}
  if(action==='dashboard'&&['VOICE_HALL','TODAY'].includes(s)){change('DASHBOARD');return true;}
  if(s==='VOICE_HALL'){
    if(action==='voice-tab'&&Object.hasOwn(voiceTabs,id)){game.voiceTab=id;render();focusControl(action,id);return true;}
    if(action==='voice-lesson'&&voiceActivity(id)){setupVoice(VoiceLearning.start(p,id),'hall');return true;}
  }
  if(action==='voice-mission'&&['VOICE_HALL','LOCATION'].includes(s)){
    const m=voiceMission(id);
    if(m)setupVoice(VoiceLearning.startMission(p,id),s==='LOCATION'?'location':'hall',m);
    return true;
  }
  if(s==='TODAY'&&action==='daily-review'){
    if(VoiceLearning.today(p).due.some(entry=>entry.id===id))launchReviewEntry(id);
    return true;
  }
  if(s==='DASHBOARD'&&action==='recommended-review'){
    const recommendation=VoiceLearning.dashboard(p).recommendation;
    if(recommendation)launchReviewEntry(recommendation.id,'dashboard');
    return true;
  }
  if(s==='REVIEW'&&game.dailyLegacy&&['review-list','review-back'].includes(action)){
    game.dailyLegacy=false;game.reviewSession=null;change(game.reviewFrom);return true;
  }
  if(!voiceContextScreen()||!v)return false;
  if(action==='voice-market'&&v.result?.done&&v.mission?.id==='vp-shop'&&p.currentChapter===2){
    discardVoice();game.location='market';game.offer=null;game.purchaseNotice='';change('SHOP');return true;
  }
  if(action==='voice-exit'){exitVoice();return true;}
  if(action==='voice-begin'){beginVoice();return true;}
  if(action==='voice-next'){voiceNext();return true;}
  if(action==='voice-play'&&['normal','slow'].includes(id)){voicePlay(id);return true;}
  if(v.result||v.stage!=='active')return false;
  switch(action){
  case 'mic-start':voiceMicStart();break;
  case 'mic-stop':SpeechInput.stop();break;
  case 'mic-confirm':if(v.micState==='result'&&!v.mismatch)submitVoice(v.transcript,'speech');break;
  case 'mic-dispute':
    silenceVoice(false);v.textMode=true;render();document.getElementById('voice-answer')?.focus();break;
  case 'voice-text':
    silenceVoice(false);v.textMode=true;render();document.getElementById('voice-answer')?.focus();break;
  case 'voice-submit':submitVoice(document.getElementById('voice-answer')?.value,'text');break;
  case 'voice-choice':submitVoice(v.handle.choices[Number(id)],'choice');break;
  case 'voice-transcript':
    v.transcriptHint=!v.transcriptHint;
    if(v.transcriptHint)VoiceLearning.assist(p,v.handle,'transcript');
    render();focusControl(action,id);break;
  case 'voice-translation':
    v.translationHint=!v.translationHint;
    if(v.translationHint)VoiceLearning.assist(p,v.handle,'translation');
    render();focusControl(action,id);break;
  default:return false;
  }
  return true;
}
function leaveWhenHidden(){
  if(game.voice){
    silenceVoice();
    if(voiceContextScreen())render();
  }
}
app.addEventListener('input',event=>{
  if(event.target.id==='voice-answer'&&game.voice)game.voice.draft=event.target.value;
});
app.addEventListener('change',event=>{
  if(!event.target.hasAttribute('data-speech-volume'))return;
  game.profile.settings.speechVolume=Math.max(0,Math.min(1,Number(event.target.value)/100));
  save();
  if(!game.profile.settings.speechVolume)AudioFX.stop();
  if(game.voice?.stage==='active'&&isAural(game.voice.activity)&&!AudioFX.canSpeak(game.profile.settings))voiceFallback(game.voice);
  else if(game.voice&&voiceContextScreen())render();
  const mixer=app.querySelector('.speech-mixer');
  if(mixer){mixer.open=true;mixer.querySelector('input').focus({preventScroll:true});}
});
app.addEventListener('keydown',event=>{
  if(event.target.id==='voice-answer'&&event.key==='Enter'&&!event.isComposing){event.preventDefault();submitVoice(event.target.value,'text');}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)leaveWhenHidden();});
window.addEventListener('pagehide',leaveWhenHidden);
