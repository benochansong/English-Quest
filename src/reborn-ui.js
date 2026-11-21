/* Standalone lab shell. No access to campaign storage. A single fixed-step RAF. */
const RebornApp=(()=>{
  const game=RebornCombat.create();
  const settings={master:.7,voice:.85,sfx:.65,music:0,muted:false,shake:true,reducedMotion:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false};
  const audio=RebornAudio.create(settings);
  document.body.dataset.reducedMotion=String(settings.reducedMotion);
  let voiceSession=0,voiceChallenge=null,hintChallenge=null,visibleMode='',overlayKey='',lastFrame=0,accumulator=0,lastHud=0,words=[],showEnglish=false,showKorean=false;
  const held=new Set(),pointerActions=new Map();
  const escape=text=>String(text??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const labels={left:'← 왼쪽',right:'오른쪽 →',attack:'검 공격',dodge:'회피',magic:'마법'};
  const button=(action,text,extra='')=>`<button type="button" data-action="${action}" ${extra}>${text}</button>`;
  document.getElementById('app').innerHTML=`<div class="shell">
    <header class="topbar"><div class="brand"><span class="eyebrow">ENGLISH QUEST / COMBAT LAB</span><h1>REBORN <span>THE AWAKENING</span></h1></div><span class="badge">PHASE 01 · 독립 전투 실험실</span>${button('pause','Ⅱ 일시정지','aria-label="일시정지 또는 계속하기"')}</header>
    <section class="hud" aria-label="전투 상태"><div class="hero-hp"><div class="meter-label"><b>숲의 수호자</b><span id="hero-health"></span></div><div class="hp-track"><div id="hero-bar" class="hp-fill"></div></div></div><div class="objective" id="objective" role="status"></div><div class="enemy-hp"><div class="meter-label"><b id="enemy-name">ENCHANTED FOREST</b><span id="enemy-health"></span></div><div class="hp-track"><div id="enemy-bar" class="hp-fill"></div></div></div></section>
    <section class="arena" aria-label="숲 전투장"><canvas id="battle" width="1000" height="560" aria-label="좌우 이동, 검 공격, 회피로 싸우는 실시간 숲 전투장"></canvas><div id="overlay" class="overlay" hidden></div></section>
    <div class="arena-caption"><span id="scene-label">THE WHISPERING WOODS</span><span id="combat-feedback" role="status"></span><span id="charge">마법 수정 발견 전</span></div>
    <section class="toolbar" aria-label="조작과 음성"><div class="control-pad">${button('left','<strong>←</strong><small>A · 이동</small>','aria-label="왼쪽 이동"')}${button('right','<strong>→</strong><small>D · 이동</small>','aria-label="오른쪽 이동"')}${button('attack','<strong>검</strong><small>J · 공격</small>','aria-label="검 공격"')}${button('dodge','<strong>회피</strong><small>K · 피하기</small>','aria-label="회피"')}${button('magic','<strong>마법</strong><small>L · 문장</small>','aria-label="영어 마법"')}</div>
    <div class="voice-panel"><div class="button-row">${button('replay','▶ 듣기 / 다시 듣기 <kbd>R</kbd>')}${button('english','영어 원문')}${button('korean','한국어 뜻 <kbd>H</kbd>')}</div><div class="audio-options"><label><input id="slow" type="checkbox"> 느리게 0.75×</label><label><input id="fallback" type="checkbox"> 기기 음성 대안 (합성)</label></div><p id="voice-status" class="voice-status" role="status"></p><p id="hint-text" class="hint-text" hidden></p></div></section>
    <details class="settings"><summary>소리·화면 설정</summary><div class="settings-grid">${[['master','전체',70],['voice','영어 음성',85],['sfx','전투 효과음',65],['music','숲의 화음',0]].map(([id,label,val])=>`<label>${label}<input type="range" data-volume="${id}" min="0" max="100" value="${val}" aria-label="${label} 음량"></label>`).join('')}<label><input id="muted" type="checkbox"> 전체 음소거</label><label><input id="shake" type="checkbox" checked> 큰 충격의 화면 흔들림</label><label><input id="reduced" type="checkbox" ${settings.reducedMotion?'checked':''}> 움직임 줄이기</label></div><p class="muted">음성 파일 미포함 · 기기 합성 음성은 선택 사항입니다. 음악 없이도 모든 조작이 가능합니다.</p></details>
    <details class="expression-practice"><summary>30개 표현 미리 듣기·복습</summary><p>전투 중 열면 안전하게 멈춥니다. 제작 음성 파일은 아직 제공되지 않았습니다.</p><div class="expression-list">${RebornVoiceManifest.utterances.map(x=>button('phrase',`<b>${escape(x.en)}</b><span>${escape(x.ko)}</span>`,`data-voice="${x.id}"`)).join('')}</div></details>
    <footer class="footer"><span>직접 움직이고, 듣고, 행동하세요.</span><span>v0.8 모험·아카데미 저장과 완전히 분리된 연습입니다.</span></footer></div>`;
  const $=id=>document.getElementById(id),canvas=$('battle'),ctx=canvas.getContext('2d'),overlay=$('overlay');
  const voice=RebornVoice.create(RebornVoiceManifest,audio,{
    onStatus(status){$('voice-status').textContent=status.message;},
    onHeard(event){if(game.state.session===voiceSession&&game.state.challenge===voiceChallenge&&voiceChallenge?.voiceId===event.id)game.heard(event.source);}
  });
  $('voice-status').textContent=voice.status.message;
  function playVoice(id){voiceSession=game.state.session;voiceChallenge=game.state.challenge;voice.play(id);renderHints();}
  function renderHints(){const item=voice.getItem(game.state.challenge?.voiceId||voice.currentId);$('hint-text').hidden=!(item&&(showEnglish||showKorean));$('hint-text').textContent=item?[showEnglish?item.en:'',showKorean?item.ko:''].filter(Boolean).join(' — '):'';}
  function reveal(kind){game.assist(kind);if(kind==='english')showEnglish=true;else showKorean=true;renderHints();}
  function release(){held.clear();pointerActions.clear();for(const action of Object.keys(labels))game.input(action,false);document.querySelectorAll('.pressed').forEach(x=>x.classList.remove('pressed'));}
  function pause(){release();game.pause();voice.stop();audio.stop();sync();}
  function drain(){for(const event of game.drainEvents()){if(event.type==='sfx')audio.sfx(event.id);if(event.type==='voice')playVoice(event.id);}}
  function act(action,element){
    audio.unlock();
    if(action==='start'||action==='skip'){release();voice.stop();game.start(action==='skip');}
    else if(action==='proceed')game.proceed();
    else if(action==='restart'){release();voice.stop();game.restart();showEnglish=showKorean=false;}
    else if(action==='pause'){if(game.state.mode==='PAUSED')game.resume();else pause();}
    else if(action==='resume')game.resume();
    else if(action==='replay')playVoice(game.state.challenge?.voiceId||voice.currentId||game.state.lastVoiceId||'VO_HELLO');
    else if(action==='english'||action==='korean')reveal(action);
    else if(action==='phrase'){game.assist('hint');pause();showEnglish=showKorean=true;playVoice(element.dataset.voice);}
    else if(action==='answer')game.answer(element.dataset.answer);
    else if(action==='word'){words.push(element.dataset.word);renderSentence();}
    else if(action==='clear'){words=[];renderSentence();}
    else if(action==='cast')game.answer(words.slice());
    else if(labels[action]){game.input(action,true);if(action!=='left'&&action!=='right')game.input(action,false);}
    drain();sync();
  }
  function renderSentence(){const cast=document.querySelector('[data-action="cast"]');if(cast)cast.disabled=words.length!==3;const sentence=$('sentence');if(sentence)sentence.textContent=words.join(' ')||'단어를 순서대로 눌러 주세요';document.querySelectorAll('[data-action="word"]').forEach(b=>{b.disabled=words.includes(b.dataset.word);});}
  function card(content){return `<div class="dialog-card" role="region" aria-label="현재 게임 안내">${content}</div>`;}
  function renderOverlay(){
    const s=game.state,c=s.challenge,t=s.tutorial;
    if(c?.id!==hintChallenge){hintChallenge=c?.id;showEnglish=showKorean=false;const library=document.querySelector('.expression-practice');if(c&&library.open){game.assist('hint');library.open=false;}renderHints();}
    const key=[s.session,s.mode,s.stage,t?.index,c?.id,c?.phase,c?.attempts,c?.feedback,s.awaitingProceed].join('|');
    if(key===overlayKey)return;overlayKey=key;words=[];
    let html='';
    if(s.mode==='INTRO')html=card(`<span class="eyebrow">THE AWAKENING</span><h2>깨어나는 숲</h2><p>검을 들고 직접 싸우세요.<br>동료의 영어를 이해하면 마법의 힘이 열립니다.</p><p class="muted">A / D 이동 · J 공격 · K 회피 · L 마법<br>음성 파일은 준비 중입니다. 원문 도움으로도 끝까지 플레이할 수 있습니다.</p><div class="button-row">${button('start','처음부터 배우기','class="primary"')}${button('skip','조작을 알아요 · 바로 시작')}</div>`);
    else if(s.mode==='TUTORIAL')html=card(`<span class="eyebrow">짧은 연습 ${Number(t?.index||0)+1} / ${t?.total||3}</span><h2>${escape(t?.english||'직접 움직여 보세요')}</h2><p>${escape(t?.ko||'')}</p><p>${escape(t?.text||'A / D 이동 · J 공격 · K 회피')}</p><div class="button-row">${button('replay','▶ 표현 듣기')}${button('proceed','알겠어요','class="primary"')}${button('skip','설명 건너뛰기')}</div>`);
    else if(s.mode==='PAUSED')html=card(`<span class="eyebrow">A MOMENT OF QUIET</span><h2>숲도 잠깐 쉬어갑니다</h2><p>전투와 피해가 멈췄습니다. 아래에서 음량과 표현을 확인할 수 있습니다.</p><div class="button-row">${button('resume','계속하기','class="primary"')}${button('restart','처음으로')}</div>`);
    else if(c&&(s.mode==='LISTENING_CHALLENGE'||s.mode==='MAGIC_CHALLENGE')){
      const feedback=c.phase==='feedback';
      html=card(`<span class="eyebrow">${c.kind==='magic'?'SENTENCE MAGIC':'LISTEN & ACT'} · 적은 기다립니다</span><h2>${c.kind==='magic'?'불꽃을 깨우는 문장':'동료의 말을 듣고 행동하세요'}</h2><p>${escape(c.prompt||'소리를 듣고 알맞은 행동을 골라 주세요.')}</p>${feedback?`<p class="feedback" role="status">${escape(c.feedback||s.feedback)}</p>${button('proceed',c.completed?'전투로 돌아가기':'다시 시도','class="primary"')}`:c.kind==='magic'?`<p id="sentence" class="sentence">단어를 순서대로 눌러 주세요</p><div class="word-bank">${(c.words||['fire','I','need']).map(w=>button('word',escape(w),`data-word="${escape(w)}"`)).join('')}</div><div class="button-row">${button('clear','다시 배열')}${button('cast','Fire Burst 시전','class="primary" disabled')}</div>`:`<div class="choices">${(c.choices||['left','right','attack','dodge','magic']).map(x=>button('answer',labels[x]||escape(x),`data-answer="${escape(x)}"`)).join('')}</div>`}<p class="muted">다시 듣기 R · 영어 원문 · 한국어 뜻 H는 아래에서 선택하세요.<br>소리가 없거나 도움이 필요하면 원문을 볼 수 있습니다.</p>`);
    }else if(s.mode==='VICTORY'||s.mode==='DEFEAT'){
      const win=s.mode==='VICTORY',st=s.stats||{};
      html=card(`<span class="eyebrow">${win?'THE FOREST REMEMBERS':'A NEW ATTEMPT'}</span><h2>${win?'숲의 목소리를 깨웠습니다':'다시 일어설 수 있어요'}</h2><div class="button-row">${button('restart','다시 도전','class="primary"')}${button('phrase','표현 복습: I need fire.','data-voice="VO_NEED_FIRE"')}</div><p>${win?'Slime Champion 격파 · 연습용 '+escape(s.reward?.title||'숲의 첫빛')+' 표식':'붉은 예고를 보고 거리를 벌리거나 K로 피하세요.'}</p><div class="result-grid"><span>정답 <b>${st.correct||0}</b></span><span>다시 연습 <b>${st.wrong||0}</b></span><span>도움 정답 <b>${st.assisted||0}</b></span><span>독립 듣기 <b>${st.listening?.independent||0}</b></span></div><p class="muted">듣고 행동하기: 정답 ${st.listening?.correct||0}회 · 다시 연습 ${st.listening?.wrong||0}회</p><details class="practiced-expressions"><summary>이번에 연습한 표현 ${(st.expressions||[]).length}개</summary><p>${(st.expressions||[]).map(escape).join('<br>')||'아직 완료한 표현이 없습니다.'}</p></details><p class="muted">이번 연습 결과만 표시합니다. 기존 모험의 경험치·금화·아이템은 바뀌지 않습니다.</p>`);
    }else if(s.awaitingProceed||s.mode==='EXPLORATION'&&s.stage==='crystal')html=card(`<span class="eyebrow">WORD CRYSTAL</span><h2>불꽃의 문장을 발견했습니다</h2><p>I need fire. — 나는 불이 필요해.</p><p>적을 공격하면 마법이 충전됩니다. L을 눌러 문장을 완성하면 Fire Burst가 발동합니다.</p>${button('proceed','마법 문장 배우기','class="primary"')}`);
    overlay.hidden=!html;overlay.innerHTML=html;
    if(html){release();const first=overlay.querySelector('button');if(first&&visibleMode!==s.mode)first.focus({preventScroll:true});}
    visibleMode=s.mode;
  }
  function sync(){
    const s=game.state,p=s.player,e=s.enemy;renderOverlay();
    $('hero-health').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;$('hero-bar').style.width=(100*p.hp/p.maxHp)+'%';
    $('enemy-name').textContent=e?(e.kind==='boss'?'SLIME CHAMPION · '+(e.phase===2?'Ⅱ':'Ⅰ'):'GREEN SLIME'):'ENCHANTED FOREST';
    $('enemy-health').textContent=e?`${Math.ceil(e.hp)} / ${e.maxHp}`:'';$('enemy-bar').style.width=e?(100*e.hp/e.maxHp)+'%':'0%';
    $('objective').textContent=s.objective||'숲의 목소리를 따라가세요';$('scene-label').textContent=({entrance:'01 / FOREST ENTRANCE',slime:'02 / THE FIRST ENCOUNTER',crystal:'03 / WORD CRYSTAL',boss:'04 / SLIME CHAMPION',complete:'05 / THE AWAKENING'})[s.stage]||'THE WHISPERING WOODS';
    $('charge').textContent=s.magicUnlocked?`마법 ${Math.floor(p.magicCharge||0)}% · ${(p.magicCooldown||0)>0?Number(p.magicCooldown).toFixed(1)+'초':'L'}`:'마법 수정 발견 전';
    $('combat-feedback').textContent=s.feedback||'';
  }
  document.addEventListener('click',event=>{const b=event.target.closest('button[data-action]');if(!b)return;if(b.dataset.action==='left'||b.dataset.action==='right'){if(event.detail===0){act(b.dataset.action,b);game.input(b.dataset.action,false);}return;}act(b.dataset.action,b);});
  document.addEventListener('pointerdown',event=>{const b=event.target.closest('[data-action="left"],[data-action="right"]');if(!b)return;event.preventDefault();audio.unlock();pointerActions.set(event.pointerId,b.dataset.action);b.setPointerCapture?.(event.pointerId);b.classList.add('pressed');game.input(b.dataset.action,true);drain();sync();});
  function pointerRelease(event){const action=pointerActions.get(event.pointerId);pointerActions.delete(event.pointerId);if(action&&!Array.from(pointerActions.values()).includes(action)&&!held.has(action))game.input(action,false);event.target.closest?.('button')?.classList.remove('pressed');}
  document.addEventListener('pointerup',pointerRelease);document.addEventListener('pointercancel',pointerRelease);
  const keymap={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyJ:'attack',KeyK:'dodge',KeyL:'magic',KeyR:'replay',KeyH:'korean',Escape:'pause'};
  document.addEventListener('keydown',event=>{const action=keymap[event.code];if(!action||event.ctrlKey||event.altKey||event.metaKey||event.target.matches('input,select,textarea'))return;event.preventDefault();if(event.repeat)return;if(action==='left'||action==='right')held.add(action);act(action);});
  document.addEventListener('keyup',event=>{const action=keymap[event.code];if(!action)return;held.delete(action);if(labels[action])game.input(action,false);});
  globalThis.addEventListener('blur',()=>{if(!['INTRO','VICTORY','DEFEAT'].includes(game.state.mode))pause();else release();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  document.addEventListener('change',event=>{const el=event.target;if(el.id==='slow'||el.id==='fallback'){voice.configure({slow:$('slow').checked,fallback:$('fallback').checked});}if(el.id==='muted'){settings.muted=el.checked;audio.configure({muted:el.checked});voice.stop();}if(el.id==='shake')settings.shake=el.checked;if(el.id==='reduced'){settings.reducedMotion=el.checked;document.body.dataset.reducedMotion=String(el.checked);}});
  document.addEventListener('input',event=>{const key=event.target.dataset.volume;if(key){settings[key]=Number(event.target.value)/100;audio.configure({[key]:settings[key]});if(key==='voice'||key==='master')voice.stop();}});
  document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>{if(el.open&&el.classList.contains('expression-practice'))game.assist('hint');if(el.open&&!['INTRO','PAUSED','VICTORY','DEFEAT'].includes(game.state.mode))pause();}));
  function frame(now){const elapsed=lastFrame?Math.min(.15,(now-lastFrame)/1000):0;lastFrame=now;accumulator+=elapsed;let steps=0;while(accumulator>=1/60&&steps++<9){game.update(1/60);accumulator-=1/60;}drain();RebornArt.draw(ctx,game.state,now/1000,settings);if(now-lastHud>80){sync();lastHud=now;}requestAnimationFrame(frame);}
  sync();requestAnimationFrame(frame);
  return{game,audio,voice,settings,keymap,release,sync};
})();
