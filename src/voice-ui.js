// Views for the resonance hall. Portraits and stage navigation belong to the existing world.
const voiceNpcs = {
  rowan:{name:'로완',place:'속삭이는 숲',scene:'forest'},
  clara:{name:'클라라',place:'상인의 시장',scene:'market'},
  thomas:{name:'토머스',place:'등불 여관',scene:'inn'},
  elena:{name:'엘레나',place:'마을 북문',scene:'gate'}
};
const voiceTabs={speak:'말하기',listen:'듣기',conversation:'주민 대화',scenario:'실전 영어 미션'};
const voiceGlyphs={speak:'mic',listen:'ear',conversation:'chat',scenario:'compass'};
const skillNames={voice:'언어의 일격',echo:'메아리 방패',burst:'대화의 폭발'};
// Short cues introduce a listening topic without printing the line to be heard.
const listeningCues={
  directions:'where · 어디 / across · 건너편 / bridge · 다리',
  ordering:'drink · 마실 것 / eat · 먹다 / please · 부탁할 때 쓰는 말',
  greeting:'morning · 아침 / evening · 저녁 / night · 밤',
  shopping:'bag · 봉투 / receipt · 영수증 / price · 가격',
  payment:'pay · 지불하다 / change · 거스름돈',
  seat:'seat · 자리 / sit · 앉다'
};
const scenarioNotes={
  'vp-cafe':'음료를 주문하고 “For here”로 매장에서 마시겠다고 답했어요. 포장이라면 “To go”라고 할 수 있어요.',
  'vp-route':'“First”와 “then”을 구분해 다리를 먼저 건너고, 그다음 지시한 방향으로 이동했어요.',
  'vp-shop':'가격을 묻고 물건을 고른 뒤 계산과 인사까지 마쳤어요. 실제 게임 물품은 시장의 물품 상점에서 구매할 수 있어요.'
};
const micLabels={ready:'준비됨',requesting:'권한 요청 중',listening:'듣는 중',processing:'인식 처리 중',result:'인식 결과 도착',unavailable:'인식 사용 불가',denied:'마이크 권한 거부됨',timeout:'시간 초과'};
function voicePortrait(npc){
  return npc==='rowan'?Art.rowan():VillageArt.npc(npc);
}
function voiceActivity(id){return VoiceData.activities.find(a=>a.id===id);}
function voiceMission(id){return VoiceData.missions.find(m=>m.id===id);}
function isAural(a){return a.kind==='listen'||['meaning','route','identify'].includes(a.mode);}
function isSpeakingTurn(a){return !isAural(a)&&['speak','conversation','scenario'].includes(a.kind);}
function voiceSpellButtons(b){
  const tasks={voice:'말하기 또는 글로 따라 쓰기',echo:'듣고 뜻 찾기',burst:'대화에 답하기'};
  const glyph={voice:'mic',echo:'ear',burst:'chat'};
  if(b.training)return '';
  return '<div class="resonance-skills">'+Object.entries(skillNames).map(([id,name])=>{
    const ready=Engine.available(b,id);
    const hint=ready?tasks[id]:Engine.golemBreak(b)?'문장 복원 중':b.cooldowns[id]+'턴 후 사용';
    return button('ability',icon(glyph[id])+'<span><strong>'+name+'</strong><small>'+hint+'</small></span>',{id,cl:'rune-skill',disabled:!ready});
  }).join('')+'</div>';
}
function signedTitle(en,ko){return '<span class="voice-script" lang="en">'+safe(en)+'</span><h2>'+safe(ko)+'</h2>';}
function hallView(){
  const p=game.profile,tab=game.voiceTab||'speak';
  const today=VoiceLearning.today(p);
  const suggested=VoiceLearning.recommend(p,tab==='listen'?'listen':'speak');
  const tabs=Object.entries(voiceTabs).map(([id,label])=>button('voice-tab',icon(voiceGlyphs[id])+' '+label,{id,cl:'hall-tab',pressed:tab===id})).join('');
  const missions=tab==='conversation'||tab==='scenario';
  const catalog=missions?VoiceData.missions.filter(m=>m.kind===tab):VoiceData.activities.filter(a=>a.kind===tab);
  const entries=catalog.map((entry,i)=>{
    const n=voiceNpcs[entry.npc];
    const completed=missions?VoiceLearning.missionStep(p,entry.id):0;
    const heading=missions?entry.name:entry.kind==='speak'?entry.english:entry.objective;
    const description=missions?entry.objective:entry.kind==='speak'?entry.ko:({meaning:'듣고 한국어 뜻 고르기',identify:'들은 영어 표현 찾기',respond:'듣고 영어로 답하기'}[entry.mode]||'듣고 답하기');
    const detail=missions?(completed>=entry.ids.length?'완료 · 다시 연습':completed+' / '+entry.ids.length+'차례'):n.name+' · '+n.place;
    const art=missions?'<span class="entry-portrait">'+voicePortrait(entry.npc)+'</span>':'<span class="entry-stone">'+icon(voiceGlyphs[tab])+'</span>';
    return button(missions?'voice-mission':'voice-lesson',art+'<span class="entry-copy"><small>'+safe(detail)+'</small><strong>'+safe(heading)+'</strong><span>'+safe(description)+'</span></span>'+icon('arrow'),{id:entry.id,cl:'hall-entry',aria:heading+' 연습'});
  }).join('');
  return '<section class="hall-banner panel"><div class="hall-landscape">'+Art.forest(1,true)+'</div><div class="hall-light"></div><div class="hall-welcome">'+signedTitle('The Power of Spoken Words','메아리의 전당')+
    '<p>로완에게 한마디를 배우고, 마을 사람들과 주고받아 보세요.</p><div class="actions">'+
    button('today',icon('book')+' 오늘의 영어 복습'+(today.count?' · '+today.count+'개':''))+
    button('dashboard',icon('star')+' 나의 영어 성장 기록')+'</div></div><div class="hall-rowan">'+Art.rowan()+'</div></section>'+
    '<nav class="hall-tabs" aria-label="전당 연습 종류">'+tabs+'</nav><div class="hall-section"><h3>'+voiceTabs[tab]+'</h3>'+
    (!missions&&suggested?button('voice-lesson','맞춤 연습 시작 '+icon('arrow'),{id:suggested.id,cl:'study-link'}):'')+'</div>'+
    '<div class="hall-catalog">'+entries+'</div><div class="actions">'+button('voice-home',p.currentChapter===2?'광장으로':'숲 지도로')+'</div>';
}
function voicePlayback(){
  const noVoice=!AudioFX.canSpeak(game.profile.settings);
  return '<div class="voice-playback">'+button('voice-play',icon('sound')+' 보통 속도',{id:'normal',disabled:noVoice})+
    button('voice-play','천천히 듣기',{id:'slow',disabled:noVoice})+
    (noVoice?'<small>영어 음성 없이 글로 연습합니다.</small>':'')+'</div>'+
    '<details class="speech-mixer"><summary>음성 크기</summary><label>모델 음성 <input type="range" data-speech-volume min="0" max="100" value="'+Math.round(game.profile.settings.speechVolume*100)+'"></label></details>';
}
function audioClues(v){
  const a=v.activity,available=AudioFX.canSpeak(game.profile.settings);
  const canHear=available&&!v.noAudio;
  let text=v.transcriptHint?'<p class="audio-clue"><b>영어 원문</b> '+utterance(a.english)+'</p>':'';
  if(v.translationHint)text+='<p class="audio-clue"><b>한국어 뜻</b> '+safe(a.ko)+'</p>';
  return '<div class="listen-sigil">'+icon('ear')+'</div><h3>'+safe(a.objective)+'</h3>'+
    (!canHear?'<p class="assist-notice">글 읽기 대체 연습 · 음성 없이도 계속할 수 있어요.</p>':'')+
    voicePlayback()+'<div class="hint-actions">'+button('voice-transcript','영어 원문 보기',{pressed:v.transcriptHint})+button('voice-translation','한국어 뜻 보기',{pressed:v.translationHint})+'</div>'+text;
}
function speakerCard(v){
  const a=v.activity,n=voiceNpcs[a.npc];
  let prompt;
  if(v.stage==='brief'){
    prompt='<div class="voice-script">Lesson</div><h3>'+safe(a.objective)+'</h3><p>'+safe(a.kind==='speak'?a.ko:a.kind==='listen'?'먼저 듣고 답해 보세요. 필요하면 원문과 뜻을 펼칠 수 있어요.':v.mission?.objective||a.fallback)+'</p>';
  }else if(v.result){
    const reply=v.result.reply;
    prompt='<div class="voice-script">'+(reply?'Reply':'Expression')+'</div><h3 lang="en">'+safe(reply?.english||a.english)+'</h3>'+
      '<p>'+safe(reply?.ko||a.ko)+'</p>'+voicePlayback();
  }else if(isAural(a)){
    prompt=audioClues(v);
  }else{
    prompt='<div class="voice-script">'+(a.kind==='speak'?'Model expression':'Conversation')+'</div><h3 class="spoken-word" lang="en">'+safe(a.english)+'</h3><p>'+safe(a.ko)+'</p>'+voicePlayback();
  }
  return '<div class="voice-speaker"><div class="voice-medallion">'+voicePortrait(a.npc)+'</div>'+
    '<div class="voice-prompt"><div class="npc-signature">'+safe(n.name)+' <span>· '+safe(n.place)+'</span></div>'+prompt+'</div></div>';
}
function voiceTrialHead(v){
  const a=v.activity,mission=v.mission;
  const title=v.origin==='battle'?skillNames[game.battle.ability]:mission?mission.name:voiceTabs[a.kind]+' 연습';
  const step=mission?' · '+(mission.ids.indexOf(a.id)+1)+' / '+mission.ids.length:'';
  return '<header class="voice-trial-head"><div><span class="eyebrow">'+(v.origin==='battle'?'BATTLE ART':'ECHO HALL')+'</span><h2>'+safe(title)+'</h2></div><span>'+safe(voiceTabs[a.kind]+step)+'</span></header>';
}
function micPanel(v){
  const state=v.micState,active=['requesting','listening','processing'].includes(state);
  const text=v.transcript;
  const micButton=active?button('mic-stop','마이크 중지',{cl:'mic-stop'}):button('mic-start',icon('mic')+' '+(state==='result'||v.micTried?'다시 말하기':'마이크로 말하기'),{cl:'mic-start',disabled:!SpeechInput.available()});
  const reason=v.micMessage||(state==='unavailable'?'이 환경에서는 텍스트로 연습할 수 있어요.':state==='denied'?'권한이 없어도 같은 문제를 글로 풀 수 있어요.':state==='timeout'?'응답 시간이 지났어요. 다시 시도하거나 글로 답해 보세요.':'');
  return '<section class="mic-panel" data-mic-state="'+safe(state)+'"><div class="mic-controls">'+micButton+
    '<span class="mic-state" role="status"><i aria-hidden="true"></i>'+safe(micLabels[state]||state)+'</span></div>'+
    '<small>누르면 브라우저의 음성 인식이 시작됩니다. 브라우저가 외부 서비스에서 음성을 처리할 수 있어요. 게임은 녹음과 인식 문장을 저장하지 않습니다.</small>'+
    (reason?'<p class="mic-note" role="status">'+safe(reason)+'</p>':'')+
    (text?'<div class="heard-text" aria-live="polite"><small>브라우저가 인식한 말</small><span lang="en">'+safe(text)+'</span></div><div class="actions">'+
      button('mic-confirm','이 말로 답하기',{cl:'primary',disabled:v.mismatch})+button('mic-dispute','인식이 잘못됐어요')+'</div>':'')+'</section>';
}
function textPanel(v){
  if(!v.textMode)return button('voice-text',icon('pen')+' 텍스트로 연습',{cl:'text-mode'});
  return '<div class="typed-answer"><label for="voice-answer">영어로 답하기</label><div><input id="voice-answer" lang="en" type="text" maxlength="240" autocomplete="off" autocapitalize="none" spellcheck="false" value="'+safe(v.draft)+'">'+
    button('voice-submit','답 확인',{cl:'primary'})+'</div><small>'+safe(v.activity.fallback)+'</small></div>';
}
function answerOptions(v){
  const indices=v.handle.choices||[];
  if(!indices.length||v.activity.kind==='speak')return '';
  return '<div class="voice-choices">'+indices.map((c,i)=>button('voice-choice','<span class="choice-index">'+String.fromCharCode(65+i)+'</span>'+safe(c),{id:i,cl:'choice'})).join('')+'</div>';
}
function voiceHistory(v){
  if(!v.history?.length)return '';
  return '<details class="talk-history"><summary>주고받은 대화 · '+v.history.length+'차례</summary>'+v.history.map(h=>
    '<p><b>'+safe(voiceNpcs[h.npc].name)+'</b> '+safe(h.prompt)+'</p><p><b>모험가</b> '+safe(h.answer)+'</p><p><b>'+safe(voiceNpcs[h.npc].name)+'</b> '+safe(h.reply)+'</p>'
  ).join('')+'</details>';
}
function voicePracticeView(){
  const v=game.voice,a=v.activity,battle=v.origin==='battle';
  let control='';
  if(v.stage==='brief'){
    const keywords=isAural(a)?[]:VoiceLearning.lessonTags(a).map(id=>lessons.find(l=>l.id===id)).filter(Boolean);
    const cue=isAural(a)?a.tags.map(tag=>listeningCues[tag]).find(Boolean):null;
    control='<p class="trial-instruction">'+safe(a.fallback)+'</p>'+
      (cue?'<p class="key-expressions">먼저 익힐 낱말 · '+safe(cue)+'</p>':'')+
      (keywords.length?'<p class="key-expressions">관련 표현 · '+keywords.map(l=>safe(l.en)+' <small>'+safe(l.ko)+'</small>').join('　')+'</p>':'')+
      button('voice-begin',battle?'기술 연습 시작':'연습 시작',{cl:'primary'});
  }else if(v.result){
    const r=v.result;
    const status=r.correct?(v.answerMode==='speech'?'문장이 잘 인식되었어요!':v.answerMode==='text'?'텍스트 연습을 마쳤어요.':'알맞게 답했어요!'):'이 표현으로 다시 익혀 보세요.';
    control='<div class="voice-response" aria-live="polite"><strong>'+safe(status)+'</strong>'+
      '<p>연습 답 · '+safe(a.answer)+'</p><p>'+safe(r.reply?.why||a.explanation)+'</p>'+
      (v.mission&&r.done?'<p class="mission-seal">'+icon('star')+' 미션 완료 · '+safe(v.mission.name)+'</p>'+
        (scenarioNotes[v.mission.id]?'<p>'+safe(scenarioNotes[v.mission.id])+'</p>':''):'')+'</div>'+
      (battle?button('resolve','계속 · 행동 실행',{cl:'primary'}):v.mission&&r.done?button('voice-exit','연습 마치기',{cl:'primary'}):
        button('voice-next',!r.correct?'다시 풀기':v.mission?'다음 대화':v.origin==='today'?'오늘의 복습으로':'연습 목록으로',{cl:'primary'}))+
      (r.done&&v.mission?.id==='vp-shop'&&game.profile.currentChapter===2?' '+button('voice-market','클라라의 물품 상점으로'):'');
  }else{
    const canSpeak=isSpeakingTurn(a);
    control=(a.kind==='speak'?'<h3>모델 표현을 영어로 말하거나 입력하세요.</h3>':isAural(a)?'':'<h3>'+safe(a.objective)+'</h3>')+
      answerOptions(v)+(canSpeak?micPanel(v)+textPanel(v):'');
    const previous=game.profile.voice.records[a.id];
    if(previous?.wrong>previous?.correct&&!isAural(a))control+='<aside class="adaptive-hint">'+
      '<b>로완의 도움말</b><p>'+safe(a.explanation)+'</p>'+(a.example?'<p lang="en">'+safe(a.example)+'</p>':'')+'</aside>';
  }
  return '<section class="voice-trial '+(battle?'in-battle':'panel')+'">'+voiceTrialHead(v)+speakerCard(v)+
    '<div class="voice-input">'+control+'</div>'+voiceHistory(v)+(!battle&&!(v.mission&&v.result?.done)?'<div class="voice-end">'+button('voice-exit','돌아가기')+'</div>':'')+'</section>';
}
function todayView(){
  const t=VoiceLearning.today(game.profile);
  const rows=t.due.map(entry=>button('daily-review','<div><small>'+safe(learningCategory(entry.kind))+'</small><strong>'+safe(entry.label||entry.id)+'</strong></div>'+icon('arrow'),{id:entry.id,cl:'daily-row'})).join('');
  return heading('FIELD JOURNAL  /  TODAY','오늘의 영어 복습')+
    '<div class="daily-summary panel"><div>'+icon('book')+' 오늘 풀 문제 <b>'+t.count+'</b></div><div>오늘 복습한 문제 <b>'+t.completed+'</b></div></div>'+
    (rows?'<div class="daily-list">'+rows+'</div>':'<div class="empty-journal panel">'+icon('leaf')+'<p>오늘 예정된 복습을 모두 마쳤거나 아직 예정된 표현이 없어요.</p></div>')+
    '<div class="actions">'+button('voice-hall','말하기 연습',{id:'speak'})+button('voice-hall','듣기 연습',{id:'listen'})+button('voice-home','지도로')+'</div>';
}
function learningCategory(kind){
  return ({vocab:'어휘 인식',sentence:'문장 이해',listening:'듣기 이해',listen:'듣기 이해',order:'문장 배열',speaking:'말하기 연습',speak:'말하기 연습',conversation:'주민 대화',scenario:'실전 영어 미션',dialogue:'대화 이해'})[kind]||'표현 복습';
}
function voiceAnalytics(){
  const d=VoiceLearning.dashboard(game.profile);
  const meters=['vocab','sentence','order','listening'].map(kind=>{
    const c=d.categories[kind];
    const right=c.correct-c.assistedCorrect,wrong=c.wrong-c.assistedWrong,total=right+wrong;
    const percent=total?Math.round(100*right/total):null;
    const helpTotal=c.assistedCorrect+c.assistedWrong;
    return '<div class="analytics-row"><div><b>'+learningCategory(kind)+'</b><small>도움 없이 '+right+' / '+total+'회 정답'+(helpTotal?' · 도움 사용 '+c.assistedCorrect+' / '+helpTotal+'회 정답':'')+'</small></div>'+
      '<div class="learning-bar" aria-hidden="true"><i style="width:'+(percent||0)+'%"></i></div><strong>'+(percent===null?'—':percent+'%')+'</strong></div>';
  }).join('');
  const rec=d.recommendation;
  const recent=d.recent.slice(-5).reverse().map(x=>'<li><time>'+safe(x.day)+'</time> '+learningCategory(x.kind)+' · '+(x.correct?'완료':'재연습')+(x.assisted?' · 도움 사용':'')+'</li>').join('');
  return '<section class="panel voice-stats"><h3>활동별 연습 기록</h3><p>0.4에서 기록한 답변을 기준으로 계산해요.</p>'+meters+
    '<p class="spoken-totals">인식 결과를 확인한 말하기 시도 <b>'+d.speakingAttempts+'회</b> · 글로 한 말하기 연습 <b>'+d.categories.speaking.text+'회</b> · 완료한 미션 <b>'+d.missionsCompleted+'개</b></p>'+
    '<small>말하기 횟수는 연습량입니다. 브라우저가 받아쓴 단어로 발음 점수를 매기지 않아요.</small>'+
    (recent?'<details><summary>최근 학습 활동</summary><ul>'+recent+'</ul></details>':'')+
    '<div class="actions">'+(rec?button('recommended-review',learningCategory(rec.kind)+' 다시 연습',{cl:'primary'}):'')+button('today','오늘의 영어 복습')+button('voice-hall','메아리의 전당')+'</div></section>';
}
