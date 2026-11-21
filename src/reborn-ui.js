/* Standalone lab shell. No access to campaign storage. A single fixed-step RAF. */
const RebornApp=(()=>{
  const game=RebornCombat.create();
  const settings={master:.7,voice:.85,sfx:.65,music:0,ui:.5,muted:false,shakeIntensity:'low',reducedMotion:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false};
  const audio=RebornAudio.create(settings);
  const voiceCount=RebornVoiceManifest.utterances.filter(x=>x.available&&x.embedded).length;
  document.body.dataset.reducedMotion=String(settings.reducedMotion);
  let hintChallenge=null,visibleMode='',lastEventMode='',overlayKey='',lastFrame=0,accumulator=0,lastHud=0,words=[],showEnglish=false,showKorean=false;
  const held=new Set(),pointerActions=new Map();
  const escape=text=>String(text??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const labels={left:'← 왼쪽',right:'오른쪽 →',attack:'검 공격',dodge:'회피',magic:'마법',interact:'상호작용'};
  const button=(action,text,extra='')=>`<button type="button" data-action="${action}" ${extra}>${text}</button>`;
  document.getElementById('app').innerHTML=`<div class="shell">
    <header class="topbar"><div class="brand"><span class="eyebrow">ENGLISH QUEST / THE LIVING BATTLEFIELD</span><h1>REBORN <span>THE BATTLE AWAKENS</span></h1></div><span class="badge">PHASE 04 · 사냥꾼의 길</span>${button('pause','Ⅱ 일시정지','aria-label="일시정지 또는 계속하기"')}</header>
    <section class="hud" aria-label="전투 상태"><div class="hero-hp"><div class="meter-label"><b>숲의 수호자</b><span id="hero-health"></span></div><div class="hp-track"><div id="hero-bar" class="hp-fill"></div></div></div><div class="objective" id="objective" role="status"></div><div class="enemy-hp"><div class="meter-label"><b id="enemy-name">ENCHANTED FOREST</b><span id="enemy-health"></span></div><div class="hp-track"><div id="enemy-bar" class="hp-fill"></div></div></div></section>
    <section class="arena" aria-label="숲 전투장"><canvas id="battle" width="1000" height="560" aria-label="좌우 이동, 검 공격, 회피로 싸우는 실시간 숲 전투장"></canvas><div id="overlay" class="overlay" hidden></div></section>
    <div class="arena-caption"><span id="scene-label">THE WHISPERING WOODS</span><span id="combo-status" class="combo-status">J · 3연속 공격</span><span id="dodge-status" class="dodge-status">K · 회피</span><span id="combat-feedback" role="status"></span><span id="charge">마법 수정 발견 전</span></div>
    <div class="flow-banner" id="flow-banner" hidden><span id="flow-message" role="status"></span>${button('help','잠깐 멈추고 도움 받기')}</div>
    <section class="toolbar" aria-label="조작과 음성"><div class="control-pad">${button('left','<strong>←</strong><small>A · 이동</small>','aria-label="왼쪽 이동"')}${button('right','<strong>→</strong><small>D · 이동</small>','aria-label="오른쪽 이동"')}${button('attack','<strong>검</strong><small>J · 공격</small>','aria-label="검 공격"')}${button('dodge','<strong>회피</strong><small>K · 피하기</small>','aria-label="회피"')}${button('magic','<strong>마법</strong><small>L · 문장</small>','aria-label="영어 마법"')}${button('interact','<strong>수정</strong><small>E · 상호작용</small>','id="interact-control" aria-label="수정 상호작용" hidden')}</div>
    <div class="voice-panel"><div class="button-row">${button('replay','▶ 듣기 / 다시 듣기 <kbd>R</kbd>')}${button('english','영어 원문')}${button('korean','한국어 뜻 <kbd>H</kbd>')}</div><div class="audio-options"><label><input id="slow" type="checkbox"> 느리게 0.75×</label><label><input id="fallback" type="checkbox"> 기기 음성 대안 (합성)</label></div><p id="voice-status" class="voice-status" role="status"></p><p id="hint-text" class="hint-text" hidden></p></div></section>
    <details class="settings"><summary>소리·화면 설정</summary><div class="settings-grid">${[['master','전체',70],['voice','영어 음성',85],['sfx','전투 효과음',65],['music','장면별 음악',0],['ui','안내 효과음',50]].map(([id,label,val])=>`<label>${label}<input type="range" data-volume="${id}" min="0" max="100" value="${val}" aria-label="${label} 음량"></label>`).join('')}<label><input id="muted" type="checkbox"> 전체 음소거</label><label>화면 흔들림<select id="shake" aria-label="화면 흔들림 강도"><option value="off">끄기</option><option value="low" selected>낮게</option><option value="normal">보통</option></select></label><label><input id="reduced" type="checkbox" ${settings.reducedMotion?'checked':''}> 움직임 줄이기</label></div><p class="muted">제작 음성 ${voiceCount}/${RebornVoiceManifest.utterances.length}개 · 기기 합성 음성은 선택 사항입니다. 음악은 원작 절차적 패턴이며 기본 꺼짐입니다.</p></details>
    <section class="audio-diagnostic" aria-labelledby="audio-test-title"><h2 id="audio-test-title">영어 음성 테스트</h2><p id="audio-source"></p><p id="audio-level"></p><p id="audio-playback" role="status" aria-live="polite"></p><p id="audio-expression">테스트 표현: Hello!</p><div class="button-row">${button('test-voice','▶ 영어 음성 듣기','class="primary"')}${button('voice-replay','다시 듣기')}${button('voice-normal','보통 속도')}${button('voice-slow','느리게 듣기')}${button('stop-voice','■ 음성 정지')}</div><p class="muted">무료 로컬 합성 음성입니다. 발음·억양은 사람의 듣기 검토가 남아 있습니다. 음량은 위의 소리·화면 설정에서 조절하세요.</p></section>
    <details class="input-help"><summary>조작 도움말 · 연속 공격과 회피</summary><p>A / D 또는 ← / → 이동 · J를 차례로 눌러 빠른 베기 → 올려 베기 → 마무리 공격. 누르고 있기만 하면 연속 공격하지 않습니다.</p><p>K는 바라보는 방향으로 회피합니다. 적의 공격이 닿는 순간 무적 시간 안에 있으면 Perfect Dodge와 마법 충전을 얻습니다. 성공 회피는 필수가 아닙니다.</p><p>E는 가까운 수정 상호작용 · L은 충전된 문장 마법 · R 다시 듣기 · H 한국어 도움 · Esc 일시정지. 일반 공격에는 영어 문제가 없습니다.</p></details>
    <details class="expression-practice"><summary>${RebornVoiceManifest.utterances.length}개 표현 미리 듣기·복습</summary><p>전투 중 열면 안전하게 멈춥니다. 제작 음성 ${voiceCount}/${RebornVoiceManifest.utterances.length}개, 누락된 표현은 원문 도움을 이용하세요.</p><div class="expression-list">${RebornVoiceManifest.utterances.map(x=>button('phrase',`<b>${escape(x.en)}</b><span>${escape(x.ko)} · ${escape(x.speaker)}</span>`,`data-voice="${x.id}"`)).join('')}</div></details>
    <div class="session-note"><p>이번 창에서 익힌 표현은 다시 도전할 때 이어집니다. 창을 새로고침하면 처음부터 배워요.</p>${button('relearn-fire','마법 문장 다시 연습','id="relearn-fire" hidden')}</div>
    <footer class="footer"><span>직접 움직이고, 듣고, 행동하세요.</span><span>v0.8 모험·아카데미 저장과 완전히 분리된 연습입니다.</span></footer></div>`;
  const $=id=>document.getElementById(id),canvas=$('battle'),ctx=canvas.getContext('2d'),overlay=$('overlay');
  const voice=RebornVoice.create(RebornVoiceManifest,audio,{
    onStatus(status){$('voice-status').textContent=status.message;renderAudioDiagnostic(status);game.audioEvent(status.state);},
    onIgnored(){game.audioEvent('ignored');},
    onHeard(event){const op=game.state.challenge||game.state.flowCue;if(op?.id===event.context&&op.voiceId===event.id){const accepted=game.heard(event.source,event.context);if(!accepted&&op.expressionId==='dodge'&&game.state.flowCue)voice.stop();}}
  });
  $('voice-status').textContent=voice.status.message;
  function renderAudioDiagnostic(status=voice.status){
    const source=status.source==='browser-fallback'?'기기 합성 음성 대안':voiceCount?'Piper AI 영어 음성':'사용 가능한 음성 파일 없음';
    $('audio-source').textContent=`음성 출처: ${source} · 검증된 파일 ${voiceCount} / ${RebornVoiceManifest.utterances.length}`;
    $('audio-level').textContent=`영어 음량 ${Math.round(settings.voice*100)}% · 전체 ${Math.round(settings.master*100)}% · ${settings.muted?'음소거':'소리 켜짐'} · ${$('slow').checked?'느리게 0.75×':'보통 1×'}`;
    $('audio-playback').textContent=status.message;
  }
  renderAudioDiagnostic();
  function playVoice(id,request={}){const op=game.state.challenge||game.state.flowCue;game.audioEvent('requested');voice.play(id,{context:op?.voiceId===id?op.id:null,...request});renderHints();}
  function renderHints(){const item=voice.getItem(game.state.challenge?.voiceId||game.state.flowCue?.voiceId||voice.currentId);$('hint-text').hidden=!(item&&(showEnglish||showKorean));$('hint-text').textContent=item?[showEnglish?item.en:'',showKorean?item.ko:''].filter(Boolean).join(' — '):'';}
  function reveal(kind){game.assist(kind);if(game.state.flowCue)pause();if(kind==='english')showEnglish=true;else showKorean=true;renderHints();}
  function release(){held.clear();pointerActions.clear();for(const action of Object.keys(labels))game.input(action,false);document.querySelectorAll('.pressed').forEach(x=>x.classList.remove('pressed'));}
  function pause(){release();game.pause();voice.stop();audio.stop();sync();}
  function drain(){for(const event of game.drainEvents()){
    if(event.type==='scene'){if(!['COMBAT','PLAYER_HIT'].includes(event.mode)||!['COMBAT','PLAYER_HIT'].includes(lastEventMode))voice.stop();lastEventMode=event.mode;}
    if(event.type==='voice-cancel'&&voice.status.context===event.opportunityId)voice.stop();
    if(event.type==='voice-release')voice.releaseContext(event.opportunityId);
    if(event.type==='sfx')audio.sfx(event.id);if(event.type==='ui')audio.ui(event.id);
    if(event.type==='voice'){
      const op=game.state.challenge||game.state.flowCue;
      if(event.opportunityId&&event.opportunityId!==op?.id)continue;
      playVoice(event.id,{priority:event.priority,context:event.opportunityId||null});
    }
  }}
  function act(action,element){
    audio.unlock();
    if(!labels[action]&&!['replay','pause','resume'].includes(action))audio.ui('select');
    if(action==='start'||action==='skip'){release();voice.stop();game.start(action==='skip');}
    else if(action==='proceed')game.proceed();
    else if(action==='story'){release();voice.stop();game.startStory();}
    else if(action==='advance'){release();voice.stop();game.advanceEncounter();}
    else if(action==='retry'){release();voice.stop();game.retryEncounter();}
    else if(action==='encounter'){release();voice.stop();game.selectEncounter(element.dataset.enemy);}
    else if(action==='restart'){release();voice.stop();game.restart();showEnglish=showKorean=false;}
    else if(action==='menu'){release();voice.stop();audio.stop();game.mainMenu();showEnglish=showKorean=false;}
    else if(action==='practice'){game.assist('hint');pause();const library=document.querySelector('.expression-practice');library.open=true;library.scrollIntoView({block:'start',behavior:'instant'});}
    else if(action==='pause'){if(game.state.mode==='PAUSED')game.resume();else pause();}
    else if(action==='resume')game.resume();
    else if(action==='help'){game.assist('hint');pause();showEnglish=showKorean=true;playVoice(game.state.challenge?.voiceId||game.state.flowCue?.voiceId||'VO_HELLO');renderHints();}
    else if(action==='relearn-fire'){release();voice.stop();game.learnAgain();}
    else if(action==='replay'){if(game.state.flowCue&&!game.state.challenge)pause();playVoice(game.state.challenge?.voiceId||game.state.flowCue?.voiceId||voice.currentId||game.state.lastVoiceId||'VO_HELLO');}
    else if(['test-voice','voice-replay','voice-normal','voice-slow'].includes(action)){
      const id=action==='test-voice'?'VO_HELLO':voice.currentId||'VO_HELLO';
      game.assist('hint');pause();
      if(action==='voice-normal'||action==='voice-slow'){$('slow').checked=action==='voice-slow';voice.configure({slow:$('slow').checked});}
      playVoice(id);showEnglish=showKorean=true;renderHints();
      const item=voice.getItem(id);$('audio-expression').textContent=`테스트 표현: ${item.en} · ${item.ko}`;
    }
    else if(action==='stop-voice')voice.stop();
    else if(action==='english'||action==='korean')reveal(action);
    else if(action==='phrase'||action==='phrase-slow'){game.assist('hint');pause();if(action==='phrase-slow'){$('slow').checked=true;voice.configure({slow:true});}showEnglish=showKorean=true;playVoice(element.dataset.voice);}
    else if(action==='answer')game.answer(element.dataset.answer);
    else if(action==='word'){words.push(element.dataset.word);renderSentence();}
    else if(action==='clear'){words=[];renderSentence();}
    else if(action==='cast')game.answer(words.slice());
    else if(labels[action]){game.input(action,true);if(action!=='left'&&action!=='right')game.input(action,false);}
    drain();sync();
  }
  function renderSentence(){const cast=document.querySelector('[data-action="cast"]');if(cast)cast.disabled=words.length!==3;const sentence=$('sentence');if(sentence)sentence.textContent=words.join(' ')||'단어를 순서대로 눌러 주세요';document.querySelectorAll('[data-action="word"]').forEach(b=>{b.disabled=words.includes(b.dataset.word);});}
  function card(content){return `<div class="dialog-card" role="region" aria-label="현재 게임 안내">${content}</div>`;}
  function resultCard(s){
    const win=['VICTORY','ENCOUNTER_CLEAR'].includes(s.mode),st=s.encounterReport?.stats||s.stats,combat=st.combat||{};
    const goals={'forest-clear':'숲의 시험 완주','combo-three':'검 3연속 적중','perfect-dodge':'Perfect Dodge','boss-dodge':'보스 공격 정확히 회피','crystal-break':'수정 약점 적중','independent-listening':'도움 없이 듣고 행동'};
    const values=[['받은 피해',combat.damageReceived],['성공 회피',combat.successfulDodges],['회피 사용',combat.dodges],['최고 연속 적중',combat.highestCombo],['마법 사용',combat.magicUsed],['수정 약점 적중',combat.weaknessHits]];
    const f=st.flow,groups=[['이번에 소리가 재생된 표현',f.heardExpressions],['듣고 실제로 행동한 표현',f.independentExpressions],['도움을 사용한 표현',[...new Set([...f.helpExpressions,...st.reviewExpressions.filter(x=>x.reasons.includes('hint')).map(x=>x.id)])]]];
    const flowReview=groups.map(([label,keys])=>`<details class="flow-review"><summary>${label} ${keys.length}개</summary>${keys.map(key=>{const e=RebornLearning.expressions[key];return `<div class="button-row">${button('phrase',escape(e.english),`data-voice="${e.voiceId}"`)}${button('phrase-slow','느리게 듣기',`data-voice="${e.voiceId}"`)}</div>`;}).join('')||'<p>이번 도전에서는 기록이 없어요.</p>'}</details>`).join('');
    return card(`<span class="eyebrow">${win?'THE FOREST REMEMBERS':'A NEW ATTEMPT'}</span><h2>${win?(s.route==='story'?(s.mode==='ENCOUNTER_CLEAR'?'길이 열렸습니다':'왕국의 수정이 다시 빛납니다'):s.route==='practice'?(RebornBattlefield.names[s.selection]+' 공략 완료'):'숲의 목소리를 깨웠습니다'):'다시 일어설 수 있어요'}</h2>
      <div class="button-row">${s.mode==='ENCOUNTER_CLEAR'?button('advance',s.adventure.index===0?'다음 장소 · 바람 절벽':'다음 장소 · 수정 유적','class="primary"'):s.route==='story'&&s.mode==='DEFEAT'?button('retry','이 전투 다시 도전','class="primary"'):button('restart',s.route==='story'?'여정 다시 하기':'전투 다시 하기','class="primary"')}${button('practice','표현 연습')}${button('menu','처음 화면')}</div>
      <p>${win?(s.route!=='lab'?escape(s.reward?.title)+' 격파':'Slime Champion 격파 · 연습용 '+escape(s.reward?.title||'숲의 첫빛')+' 표식'):'붉은 예고를 보고 거리를 벌리거나 K로 피하세요.'}</p>
      <div class="combat-stats">${values.map(([label,value])=>`<div class="stat"><b>${value||0}</b><span>${label}</span></div>`).join('')}</div>
      <p class="muted">안내 과제: 정답 ${st.listening?.correct||0}회 · 다시 연습 ${st.listening?.wrong||0}회 · 도움 없이 응답 ${st.listening?.independent||0}회</p>
      ${s.route!=='lab'?`<p>듣고 실제 행동 ${f.independentActions}회 · 도움을 받은 실전 행동 ${s.encounterReport?.metrics?.assistedActions||0}회</p>`:''}${flowReview}<p class="muted">재생 후 행동한 기록이며, 실제 이해도나 완전 숙달을 보증하지는 않습니다.</p>
      <div class="goal-list">${(st.goals||[]).map(id=>`<span class="pill" data-goal="${escape(id)}">✓ ${escape(goals[id]||id)}</span>`).join('')||'<span class="muted">다음에는 검 3연속 적중에 도전해 보세요.</span>'}</div>
      <details class="practiced-expressions"><summary>이번에 연습한 표현 ${(st.expressions||[]).length}개</summary><p>${(st.expressions||[]).map(escape).join('<br>')||'아직 완료한 표현이 없습니다.'}</p></details>
      <details class="review-expressions"><summary>다시 들으면 좋은 표현 ${(st.reviewExpressions||[]).length}개</summary><ul class="review-list">${(st.reviewExpressions||[]).map(x=>`<li>${button('phrase',escape(x.english),`data-voice="${escape(x.voiceId)}"`)}<span>${escape(x.ko)} · ${x.reasons.map(r=>({wrong:'다시 시도',hint:'도움 사용',text:'텍스트로 연습'}[r]||r)).map(escape).join(', ')}</span></li>`).join('')||'<li>이번 기록에서 복습할 표현이 없습니다.</li>'}</ul></details>
      <p class="muted">목표는 이번 도전에서 실제로 일어난 행동만 표시합니다. 기존 모험 경험치·금화·아이템은 바뀌지 않습니다.</p>`);
  }
  function renderOverlay(){
    const s=game.state,c=s.challenge,t=s.tutorial,op=c||s.flowCue;
    if(op?.id!==hintChallenge){hintChallenge=op?.id;showEnglish=showKorean=false;$('audio-expression').textContent='테스트 표현: Hello!';const library=document.querySelector('.expression-practice');if(op&&library.open){game.assist('hint');library.open=false;}renderHints();}
    const key=[s.session,s.mode,s.stage,t?.index,c?.id,c?.phase,c?.attempts,c?.feedback,s.awaitingProceed].join('|');
    if(key===overlayKey)return;overlayKey=key;words=[];
    let html='';
    if(s.mode==='INTRO')html=card(`<span class="eyebrow">THE HUNTER'S TRAIL · 세 전투로 이어지는 모험</span><h2>사냥꾼의 길</h2><p>왕국을 지키던 수정이 흔들립니다.<br>로완과 함께 숲길, 바람 절벽, 수정 유적을 지나 근원을 찾아가세요.</p><p class="muted">A / D 이동 · J 3연격 · K 회피 · L 문장 마법 · E 수정 상호작용<br>새 영어는 안전하게 배우고, 익힌 표현은 전투에서 활용해요.</p><div class="button-row">${button('story','사냥꾼의 길 시작','class="primary"')}</div><p class="muted">개별 전투 연습</p><div class="button-row">${[['slime','숲 슬라임'],['raven','그림자 까마귀'],['golem','수정 골렘'],['boss','슬라임 챔피언']].map(([id,name])=>button('encounter',name,`data-enemy="${id}"`)).join('')}</div><p class="muted">기존 전투 실험실 · 슬라임에서 챔피언까지</p><div class="button-row">${button('start','조작부터 배우기')}${button('skip','조작을 알아요 · 바로 시작')}</div><p class="muted">Piper 음성 ${voiceCount}/${RebornVoiceManifest.utterances.length}개 내장 · 음소거와 텍스트 도움으로도 진행할 수 있습니다.</p>`);
    else if(s.mode==='TUTORIAL')html=card(`<span class="eyebrow">짧은 연습 ${Number(t?.index||0)+1} / ${t?.total||3}</span><h2>${escape(t?.english||'직접 움직여 보세요')}</h2><p>${escape(t?.ko||'')}</p><p>${escape(t?.text||'A / D 이동 · J 공격 · K 회피')}</p><div class="button-row">${button('replay','▶ 표현 듣기')}${button('proceed','알겠어요','class="primary"')}${button('skip','설명 건너뛰기')}</div>`);
    else if(s.mode==='BOSS_INTRO')html=card(`<span class="eyebrow">SLIME CHAMPION</span><h2>수정의 수호자</h2>${s.bossIntro?.automatic?'<p>익힌 표현을 전투에서 활용해 보세요.</p>':`<p>${escape(s.bossIntro?.english||'Attack the crystal!')} — ${escape(s.bossIntro?.ko||'수정을 공격해요!')}</p><p>${escape(s.bossIntro?.text||'수정 돌진이 끝나면 빛나는 중심의 빈틈을 노리세요.')}</p>`}<div class="button-row">${button('replay','▶ 표현 듣기')}${button('proceed','준비됐어요 · 전투 시작','class="primary"')}</div>`);
    else if(s.mode==='PAUSED')html=card(`<span class="eyebrow">A MOMENT OF QUIET</span><h2>숲도 잠깐 쉬어갑니다</h2><p>전투와 피해가 멈췄습니다. 아래에서 음량과 표현을 확인할 수 있습니다.</p><div class="button-row">${button('resume','계속하기','class="primary"')}${button('restart','처음으로')}</div>`);
    else if(c&&(s.mode==='LISTENING_CHALLENGE'||s.mode==='MAGIC_CHALLENGE')){
      const feedback=c.phase==='feedback';
      html=card(`<span class="eyebrow">${c.kind==='magic'?'SENTENCE MAGIC':'LISTEN & ACT'} · 적은 기다립니다</span><h2>${c.kind==='magic'?'불꽃을 깨우는 문장':'동료의 말을 듣고 행동하세요'}</h2><p>${escape(c.prompt||'소리를 듣고 알맞은 행동을 골라 주세요.')}</p>${c.kind==='action'?`<p class="muted">새 지시는 안전하게 배워요. 듣기를 반복하거나 아래 원문·한국어 도움을 볼 수 있어요.</p>${button('replay','▶ 다시 듣기')}${button('proceed','직접 해보기 · 전투로','class="primary"')}`:feedback?`<p class="feedback" role="status">${escape(c.feedback||s.feedback)}</p>${button('proceed',c.completed?'전투로 돌아가기':'다시 시도','class="primary"')}`:c.kind==='magic'?`<p id="sentence" class="sentence">단어를 순서대로 눌러 주세요</p><div class="word-bank">${(c.words||['fire','I','need']).map(w=>button('word',escape(w),`data-word="${escape(w)}"`)).join('')}</div><div class="button-row">${button('clear','다시 배열')}${button('cast','Fire Burst 시전','class="primary" disabled')}</div>`:`<div class="choices">${(c.choices||['left','right','attack','dodge','magic']).map(x=>button('answer',labels[x]||escape(x),`data-answer="${escape(x)}"`)).join('')}</div>`}<p class="muted">다시 듣기 R · 영어 원문 · 한국어 뜻 H는 아래에서 선택하세요.<br>소리가 없거나 도움이 필요하면 원문을 볼 수 있습니다.</p>`);
    }else if(s.mode==='TRANSITION')html=card(`<span class="eyebrow">길은 계속됩니다</span><h2>${escape(RebornJourney.scenes[s.transition.next].name)}</h2><p>${escape(s.transition.text)}</p>`);
    else if(['VICTORY','DEFEAT','ENCOUNTER_CLEAR'].includes(s.mode)){
      html=resultCard(s);
    }else if(s.awaitingProceed||s.mode==='EXPLORATION'&&s.stage==='crystal')html=card(`<span class="eyebrow">WORD CRYSTAL</span><h2>불꽃의 문장을 발견했습니다</h2><p>I need fire. — 나는 불이 필요해.</p><p>적을 공격하면 마법이 충전됩니다. L을 눌러 문장을 완성하면 Fire Burst가 발동합니다.</p>${button('proceed','마법 문장 배우기','class="primary"')}`);
    overlay.hidden=!html;overlay.innerHTML=html;overlay.classList.toggle('boss-intro',s.mode==='BOSS_INTRO');if(s.mode==='BOSS_INTRO')overlay.querySelector('.dialog-card')?.classList.add('boss-banner');
    if(html){release();const first=overlay.querySelector('button');if(first&&visibleMode!==s.mode)first.focus({preventScroll:true});}
    visibleMode=s.mode;
  }
  function sync(){
    const s=game.state,p=s.player,e=s.enemy;renderOverlay();
    $('flow-banner').hidden=!(s.flowCue||s.flowFeedback)||['VICTORY','DEFEAT','INTRO','ENCOUNTER_CLEAR','TRANSITION'].includes(s.mode);
    $('flow-message').textContent=s.flowFeedback?.text||(s.flowCue?.heard?'동료의 신호 · 직접 행동해 보세요':'동료가 알려주고 있어요 · 시각적 경고도 함께 확인하세요');
    $('interact-control').hidden=!s.enemy?.objects;document.querySelector('.control-pad').classList.toggle('has-environment',!!s.enemy?.objects);
    $('relearn-fire').hidden=!s.magicUnlocked||!['COMBAT','PLAYER_HIT','PAUSED'].includes(s.mode);
    $('hero-health').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('hero-bar').style.width=(100*p.hp/p.maxHp)+'%';
    $('enemy-name').textContent=e?(e.kind==='boss'?'SLIME CHAMPION · '+(e.phase===2?'Ⅱ':'Ⅰ'):e.kind==='raven'?'SHADOW RAVEN':e.kind==='golem'?'CRYSTAL GOLEM':'GREEN SLIME'):'ENCHANTED FOREST';
    $('enemy-health').textContent=e?`${Math.ceil(e.hp)} / ${e.maxHp}`:'';$('enemy-bar').style.width=e?(100*e.hp/e.maxHp)+'%':'0%';
    const objective=s.objective||'숲의 목소리를 따라가세요';if($('objective').textContent!==objective)$('objective').textContent=objective;
    $('scene-label').textContent=({raven:'02 / WINDY CLIFF',golem:'03 / CRYSTAL RUINS',entrance:'01 / FOREST ENTRANCE',slime:'02 / THE FIRST ENCOUNTER',crystal:'03 / WORD CRYSTAL',boss:'04 / SLIME CHAMPION',complete:'05 / THE AWAKENING'})[s.stage]||'THE WHISPERING WOODS';
    $('charge').textContent=s.magicUnlocked?`마법 ${Math.floor(p.magicCharge||0)}% · ${(p.magicCooldown||0)>0?Number(p.magicCooldown).toFixed(1)+'초':'L'}`:'마법 수정 발견 전';
    $('combo-status').textContent=p.comboBuffered?'다음 검격 준비됨':p.comboIndex?`검 ${p.comboIndex}/3 · ${p.comboWindowRemaining>0?'J로 이어가기':'연속 공격'}`:'J · 3연속 공격';
    $('dodge-status').textContent=p.perfectDodge>0?'PERFECT DODGE':p.dodgeCooldown>0?`회피 ${p.dodgeCooldown.toFixed(1)}초`:'K · 회피 준비';
    const feedback=s.fieldNotice|| (p.weaknessCharge>0?'빛나는 수정에 다음 검격 강화':e?.coreExposed?'수정 노출 · 반격 기회':s.feedback||'');if($('combat-feedback').textContent!==feedback)$('combat-feedback').textContent=feedback;
    const quiet=['PAUSED','LISTENING_CHALLENGE','MAGIC_CHALLENGE','VICTORY','DEFEAT','ENCOUNTER_CLEAR'].includes(s.mode);
    audio.setScene(quiet?'silent':s.stage==='boss'?'boss':['slime','raven','golem'].includes(s.stage)?'combat':'exploration',e?.phase||1);
  }
  document.addEventListener('click',event=>{const b=event.target.closest('button[data-action]');if(!b)return;if(labels[b.dataset.action]&&event.detail>0)return;if(b.dataset.action==='left'||b.dataset.action==='right'){act(b.dataset.action,b);game.input(b.dataset.action,false);return;}act(b.dataset.action,b);});
  document.addEventListener('pointerdown',event=>{const b=event.target.closest('.control-pad button[data-action]');if(!b)return;event.preventDefault();audio.unlock();if(b.dataset.action!=='left'&&b.dataset.action!=='right'){act(b.dataset.action,b);return;}pointerActions.set(event.pointerId,b.dataset.action);b.setPointerCapture?.(event.pointerId);b.classList.add('pressed');game.input(b.dataset.action,true);drain();sync();});
  function pointerRelease(event){const action=pointerActions.get(event.pointerId);pointerActions.delete(event.pointerId);if(action&&!Array.from(pointerActions.values()).includes(action)&&![...held].some(code=>keymap[code]===action))game.input(action,false);event.target.closest?.('button')?.classList.remove('pressed');}
  document.addEventListener('pointerup',pointerRelease);document.addEventListener('pointercancel',pointerRelease);
  const keymap={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyJ:'attack',KeyK:'dodge',KeyL:'magic',KeyE:'interact',KeyR:'replay',KeyH:'korean',Escape:'pause'};
  document.addEventListener('keydown',event=>{const action=keymap[event.code];if(!action||event.ctrlKey||event.altKey||event.metaKey||event.target.matches('input,select,textarea'))return;event.preventDefault();if(event.repeat)return;held.add(event.code);act(action);});
  document.addEventListener('keyup',event=>{const action=keymap[event.code];if(!action)return;held.delete(event.code);if(labels[action]&&![...held].some(code=>keymap[code]===action)&&!Array.from(pointerActions.values()).includes(action))game.input(action,false);});
  globalThis.addEventListener('blur',()=>{if(!['INTRO','VICTORY','DEFEAT'].includes(game.state.mode))pause();else release();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('change',event=>{const el=event.target;if(el.id==='slow'||el.id==='fallback'){if(game.state.flowCue)pause();voice.configure({slow:$('slow').checked,fallback:$('fallback').checked});}if(el.id==='muted'){settings.muted=el.checked;audio.configure({muted:el.checked});voice.refreshVolume();}if(el.id==='shake')settings.shakeIntensity=el.value;if(el.id==='reduced'){settings.reducedMotion=el.checked;document.body.dataset.reducedMotion=String(el.checked);}renderAudioDiagnostic();});
  document.addEventListener('input',event=>{const key=event.target.dataset.volume;if(key){audio.unlock();settings[key]=Number(event.target.value)/100;audio.configure({[key]:settings[key]});if(key==='voice'||key==='master')voice.refreshVolume();renderAudioDiagnostic();}});
  document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>{if(el.open&&el.classList.contains('expression-practice'))game.assist('hint');if(el.open&&!['INTRO','PAUSED','VICTORY','DEFEAT'].includes(game.state.mode))pause();}));
  function frame(now){const elapsed=lastFrame?Math.min(.15,(now-lastFrame)/1000):0;lastFrame=now;accumulator+=elapsed;let steps=0;while(accumulator>=1/60&&steps++<9){game.update(1/60);accumulator-=1/60;}drain();audio.tick();RebornArt.draw(ctx,game.state,now/1000,settings);if(now-lastHud>80){sync();lastHud=now;}requestAnimationFrame(frame);}
  sync();requestAnimationFrame(frame);
  return{game,audio,voice,settings,keymap,release,sync};
})();
