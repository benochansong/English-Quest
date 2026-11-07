// Scene markup is rebuilt for meaningful actions; the animation loop only moves SVG groups.
const ExploreUI = {panel:null,words:[],hint:'',transcript:false,notice:'',tutorial:false};
function eqButton(action,label,options={}){return button('explore-'+action,label,options);}
function eqActivity(){return Exploration.current(game.profile)?.activity;}
function eqAudioActivity(a){return a&&(a.type==='listening'||a.kind==='listening'||a.kind==='listen');}
function eqObject(id){return ExplorationData.areas[game.profile.exploration.area].objects.find(o=>o.id===id);}
function eqCompanion(id){const data=ExplorationData.companions;return Array.isArray(data)?data.find(c=>c.id===id):data[id];}
function eqName(id){return eqCompanion(id)?.name||({mira:'미라',bram:'브람'})[id]||'혼자 걷는 중';}
function eqHeroMarkup(p,direction){
 const cosmetic=p.exploration.cosmetics[0],glow=cosmetic==='runeGlow'?'#a7a5ff':cosmetic==='leafGlow'?'#a7e9b2':'#f6dea0';
 return '<ellipse cx="0" cy="0" rx="17" ry="8" fill="'+(cosmetic?glow:'none')+'" fill-opacity=".13" stroke="'+glow+'" stroke-opacity=".8" stroke-width="1.5"/>'+(cosmetic?'<path d="M-22-3l-3-5 3-5 3 5Zm44 0-3-5 3-5 3 5Z" fill="'+glow+'" opacity=".8"/>':'')+ExploreArt.hero(p.rpg.classId,direction)+'<path d="M-5-67H5L0-61Z" fill="#fff1b5"/>';
}
function eqWorld(){
 const p=game.profile,s=p.exploration,a=ExplorationData.areas[s.area];
 const objects=a.objects.filter(o=>Exploration.objectState(p,o).visible).map(o=>{
  const state=Exploration.objectState(p,o);
  return '<g class="eq-object '+(state.complete?'eq-solved ':'')+(s.opened.includes(o.id)?'eq-open':'')+'" data-world-object="'+safe(o.id)+'" role="button" tabindex="0" aria-label="'+safe(o.name)+' · 가까이 가서 상호작용" transform="translate('+o.x+' '+o.y+')"><rect x="-30" y="-64" width="60" height="94" fill="transparent" pointer-events="all"/><ellipse class="eq-focus-ring" cx="0" cy="0" rx="31" ry="16"/>'+ExploreArt.object(o,{...state,solved:state.complete,open:s.opened.includes(o.id),available:!state.locked})+'<text class="eq-label" y="28">'+safe(o.name)+'</text></g>';
 }).join('');
 return '<div class="eq-stage" id="eq-stage" tabindex="0" role="region" aria-label="'+safe(a.name)+' 탐험 지도. WASD나 방향키로 이동, E로 상호작용"><svg class="eq-world" viewBox="0 0 960 640" aria-label="'+safe(a.name)+'"><g class="eq-background">'+ExploreArt.background(a)+'</g><g class="eq-world-objects">'+objects+'</g><g id="eq-follower" aria-hidden="true"></g><g id="eq-hero" aria-label="모험가" transform="translate('+s.x+' '+s.y+')">'+eqHeroMarkup(p,s.direction)+'</g></svg><span class="eq-map-tag">'+safe(a.en.toUpperCase())+'</span><span class="eq-compass" aria-hidden="true">N</span></div>';
}
function exploreView(){
 const p=game.profile,s=p.exploration,a=ExplorationData.areas[s.area],q=Exploration.objective(p),stats=Engine.stats(p);
 const companion=s.activeCompanion;
 const modal=ExploreUI.panel;
 return '<section class="exploration"><div class="eq-main" '+(modal?'inert':'')+'><header class="eq-heading"><div><span class="eyebrow">CHAPTER III · THE FORGOTTEN PATH</span><h2>'+safe(a.name)+'</h2><p>말을 읽고, 길을 발견하세요.</p></div><div class="eq-vitals"><b>Lv. '+p.level+'</b> <span>HP '+p.hp+' / '+stats.maxHp+'</span><br>금화 '+p.gold+'</div></header><div class="eq-layout"><div>'+eqWorld()+
 '<div class="eq-controlbar"><div class="eq-pad" role="group" aria-label="터치 또는 마우스 이동"><button class="btn" data-move="up" aria-label="위로 이동">↑</button><button class="btn" data-move="left" aria-label="왼쪽으로 이동">←</button><button class="btn" data-move="down" aria-label="아래로 이동">↓</button><button class="btn" data-move="right" aria-label="오른쪽으로 이동">→</button></div><div><div id="eq-nearby" class="eq-nearby">가까운 물체를 찾아보세요.</div>'+eqButton('interact','E · 상호작용',{cl:'primary eq-interact'})+'<p>WASD / 방향키 · E 상호작용 · Esc 일시 정지</p></div></div><p class="eq-status" id="eq-status" role="status">'+safe(ExploreUI.notice)+'</p></div><aside class="eq-side"><section class="eq-card"><span class="eyebrow">CURRENT QUEST</span><h3>'+safe(q.title)+'</h3><p>'+safe(q.text)+'</p><div class="eq-progress" aria-label="완료 의뢰">'+Exploration.questStatus(p).map(t=>'<i class="'+(t.status==='complete'?'done':'')+'"></i>').join('')+'</div>'+eqButton('journal',icon('book')+' 탐험 일지')+'</section><section class="eq-card eq-companion-summary"><span class="eyebrow">TRAVELING WITH</span>'+(companion?'<div class="eq-small-portrait">'+ExploreArt.portrait(companion)+'</div>':'')+'<h3>'+eqName(companion)+'</h3><p>'+(companion==='mira'?'미라는 어려운 표현을 이해하도록 단서를 줍니다.':companion==='bram'?'브람은 가까운 숨은 물체의 기척을 알아챕니다.':'숲에 있는 두 여행자에게 말을 걸어 보세요.')+'</p>'+eqButton('companions','동료와 이야기')+'</section><section class="eq-card eq-location-card"><span class="eyebrow">THE ANCIENT MAP</span><ol class="eq-area-list">'+Object.values(ExplorationData.areas).filter(t=>['forest','ruins','cavern'].includes(t.id)||s.discovered.includes(t.id)).map(t=>'<li class="'+(s.area===t.id?'current':'')+'">'+safe(t.name)+(s.discovered.includes(t.id)?'':' · 미발견')+'</li>').join('')+'</ol></section></aside></div><nav class="eq-toolbar" aria-label="탐험 메뉴">'+button('academy-enter',icon('book')+' 말의 아카데미')+eqButton('notes',icon('book')+' 영어 수첩')+eqButton('bag',icon('shield')+' 소지품')+eqButton('companions',icon('chat')+' 동료')+eqButton('instructions','조작 안내')+eqButton('chapters','장 선택')+(Exploration.current(p)?.phase==='seek'?eqButton('reread','진행 중인 단서',{cl:'primary'}):'')+'</nav></div>'+(modal?eqPanel():'')+'</section>';
}
function eqPanelShell(title,content,kicker='FIELD JOURNAL'){
 return '<div class="eq-modal-shade"><section class="eq-dialog" role="dialog" aria-modal="true" aria-labelledby="eq-dialog-title" tabindex="-1"><div class="eq-dialog-top"><span class="eyebrow">'+safe(kicker)+'</span>'+eqButton('close','×',{aria:'탐험으로 돌아가기'})+'</div><h2 id="eq-dialog-title">'+safe(title)+'</h2>'+content+'</section></div>';
}
function eqPanel(){
 const p=game.profile,s=p.exploration,panel=ExploreUI.panel;
 if(panel==='tutorial')return eqPanelShell('잊혀진 길을 걷는 법','<p>영어는 길을 여는 열쇠입니다. 시간 제한 없이 천천히 탐험하세요.</p><div class="eq-tutorial-grid"><p><b>01 · 걸어 보기</b><kbd>WASD</kbd> 또는 방향키. 화면 아래 화살표를 눌러서도 움직일 수 있어요.</p><p><b>02 · 가까이 가기</b>표지판·상자·인물 가까이에 가서 <kbd>E</kbd> 또는 상호작용을 누르세요.</p><p><b>03 · 단서를 따라가기</b>영어 지시를 읽고 물체를 찾아 걸어가세요. 문장은 단어 타일을 눌러 조립해요.</p><p><b>04 · 함께 모험하기</b>두 여행자의 부탁을 풀어 동료로 맞이하세요. 동료 메뉴에서 도움과 대화를 선택해요.</p></div><p class="eq-explanation">소리가 없어도 원문으로 모든 퍼즐을 풀 수 있습니다. 설정·대화·일지를 열면 이동이 멈춥니다.</p><div class="actions">'+eqButton('tutorial-done','탐험 시작',{cl:'primary'})+eqButton('tutorial-done','안내 건너뛰기')+'</div>','WELCOME TO CHAPTER III');
 if(panel==='journal'){
  const choices=s.choices;
  return eqPanelShell('잊혀진 길 · 탐험 일지',Exploration.questStatus(p).map(q=>'<article class="eq-quest-row"><h3>'+(q.status==='complete'?'✓ ':q.status==='locked'?'◇ ':'◆ ')+safe(q.title)+'</h3><p>'+safe(q.objective||q.text||q.description||'')+'</p><small>'+({complete:'완료',active:'진행 중',locked:'아직 시작하지 않음'})[q.status]+'</small></article>').join('')+'<h3>내가 선택한 이야기</h3><p>갈림길 · '+(({moon:'달빛 오솔길',stone:'고대 돌길'})[choices.crossroad]||'아직 선택하지 않음')+'<br>수정 복원 · '+(choices.restoration?eqName(choices.restoration)+'의 방법':'아직 선택하지 않음')+'</p><p>완성한 퍼즐 '+s.completed.length+' · 발견한 보물 '+s.opened.length+' · 영입한 동료 '+s.recruited.length+' / 2</p>');
 }
 if(panel==='notes'){
  return eqPanelShell('탐험자의 영어 수첩','<p>현장에서 만난 표현을 다시 읽고 연습하세요. 수첩 연습은 지도 장치나 보물을 대신 열지 않습니다.</p>'+(s.notes.includes('grove-scroll')?eqButton('scroll','발견한 두루마리 펼치기',{cl:'primary'}):'')+ExplorationData.activities.map(a=>{
   const r=p.voice.records[a.id];const seen=!!r||s.observed.includes(a.id)||s.completed.includes(a.id);
   return '<article class="eq-lesson-row"><strong lang="en">'+safe(a.english)+'</strong><p>'+safe(a.ko)+'</p><small>'+safe(a.objective)+' · 정답 '+(r?.correct||0)+' / 오답 '+(r?.wrong||0)+(r?.assistedCorrect?' · 도움받은 정답 '+r.assistedCorrect:'')+'</small>'+eqButton('practice','연습하기',{id:a.id})+eqButton('note-speak','듣기',{id:a.id})+(seen?'<small>학습한 표현</small>':'')+'</article>';
  }).join(''),'CHAPTER III · ENGLISH NOTES');
 }
 if(panel==='bag')return eqPanelShell('탐험 소지품','<p class="eq-reward">금화 '+p.gold+'</p><p>회복 물약 '+(p.village.inventory.potion||0)+' · 수호 부적 '+(p.village.inventory.charm||0)+'</p><p>장비 '+p.rpg.collection.length+'종 · 발견한 보물 '+s.opened.length+'개</p><p>이야기 기념품 · '+(s.cosmetics.map(x=>safe(({runeGlow:'룬빛 수정',leafGlow:'잎빛 수정'})[x]||x)).join(', ')||'아직 없음')+'</p><p>학습 두루마리 · '+((s.notes||[]).length?'반딧불 숲의 어휘 두루마리':'아직 없음')+'</p>'+(s.notes.includes('grove-scroll')?eqButton('scroll','두루마리 읽기',{cl:'primary'}):'')+'<p>물약과 부적은 기존 전투에서 사용할 수 있어요. 장비의 능력치는 모든 전투에 적용됩니다.</p><div class="actions">'+eqButton('equipment','장비 확인',{cl:'primary'})+eqButton('profile','영웅 기록')+'</div>');
 if(panel==='scroll'&&s.notes.includes('grove-scroll'))return eqPanelShell('반딧불 숲의 어휘 두루마리','<p>보물 속에는 먼저 이 길을 걸었던 여행자의 작은 영어 기록이 있었습니다.</p><div class="eq-hint"><strong>find → found</strong><p>find는 찾다, found는 찾았다는 뜻이에요. 발견한 뒤에는 “We found the treasure.”라고 말할 수 있어요.</p><strong>small ↔ large · quiet ↔ loud</strong><p>small은 작은, large는 큰. quiet는 조용한, loud는 소리가 큰이라는 뜻이에요. 크기와 소리를 서로 구분해 보세요.</p></div><p>숲에서 만난 세 표현을 다시 풀어 보세요. 복습 결과는 영어 학습 기록에 남습니다.</p><div class="actions">'+eqButton('practice','보물을 찾았어요',{id:'g-order'})+eqButton('practice','작은 돌의 지시',{id:'g-listen'})+eqButton('practice','숲의 모습',{id:'g-read'})+'</div>','DISCOVERED TREASURE · VOCABULARY SCROLL');
 if(panel==='companions')return eqPanelShell('함께 걷는 여행자',['mira','bram'].map(id=>{
  const recruited=s.recruited.includes(id),dialogue=Exploration.companionDialogue(p,id);
  return '<article class="eq-companion-card"><div>'+ExploreArt.portrait(id)+'</div><div><h3>'+eqName(id)+' · '+(id==='mira'?'견습 마법사':'숲의 순찰자')+'</h3><p lang="en">'+safe(dialogue?.english||'Let’s go together.')+'</p><p>'+safe(dialogue?.ko||'함께 가요.')+'</p><small>'+safe(dialogue?.ability||'숲에서 만나 부탁을 들어주세요.')+'</small><div class="actions">'+eqButton('companion',s.activeCompanion===id?'동행 중':recruited?'함께 걷기':'숲에서 만나기',{id,disabled:!recruited||s.activeCompanion===id})+(recruited?eqButton('talk','영어로 대화',{id}):'')+'</div></div></article>';
 }).join('')+'<p class="eq-explanation">동료는 이동을 막지 않습니다. 미라는 힌트를, 브람은 가까운 숨은 물체의 기척을 알려 줍니다.</p>');
 if(panel==='conversation'){
  const id=s.activeCompanion||s.recruited[0],c=Exploration.companionDialogue(p,id);
  return eqPanelShell(eqName(id)+'와 잠깐 이야기','<div class="eq-dialog-portrait">'+ExploreArt.portrait(id)+'</div><p class="eq-english" lang="en">'+safe(c.english)+'</p><p>'+safe(c.ko)+'</p><p>'+safe(c.ability)+'</p><div class="actions">'+eqButton('talk-help','Can you help me?')+eqButton('talk-where','Where is the bridge?')+eqButton('talk-describe','What can you see?')+'</div>'+(ExploreUI.notice?'<p class="eq-hint">'+safe(ExploreUI.notice)+'</p>':'')+'<div class="actions">'+eqButton('companions','동료 선택')+'</div>','COMPANION CONVERSATION');
 }
 return eqInteractionPanel();
}
function eqInteractionPanel(){
 const p=game.profile,h=Exploration.current(p);
 if(!h)return eqPanelShell('여행자의 기록','<p>'+safe(ExploreUI.notice||'다시 길을 걸어 보세요.')+'</p>');
 const a=h.activity,o=eqObject(h.objectId)||{},title=o.name||(h.practice?'표현 다시 연습':'잊혀진 길');
 let body='';
 if(h.phase==='choice'){
  const final=h.choiceId==='restoration'||o.choice==='restoration'||o.id.includes('restore')||o.id.includes('final');
  const ids=h.options?.map(x=>typeof x==='string'?x:x.id)||(final?['mira','bram']:['moon','stone']);
  body='<p>'+safe(h.text||'이 선택에 따라 만나는 단서와 대화가 달라집니다. 두 길 모두 수정으로 이어집니다.')+'</p><div class="eq-options">'+ids.map(id=>eqButton('choose',({moon:'The Moonlit Trail · 달빛 오솔길',stone:'The Ancient Stone Road · 고대 돌길',mira:'Ask Mira · 미라와 비문 해석하기',bram:'Ask Bram · 브람과 장치 찾아보기'})[id],{id})).join('')+'</div>';
 }else if(a){
  const isListening=eqAudioActivity(a),isOrder=a.kind==='order',showText=!isListening||ExploreUI.transcript||!AudioFX.canSpeak(p.settings)||h.phase==='feedback';
  body='<span class="eyebrow">'+safe(a.objective)+(h.practice?' · 수첩 연습':'')+'</span>'+(isListening?'<div class="actions">'+eqButton('play','보통 속도로 듣기')+eqButton('play','천천히 듣기',{id:'slow'})+eqButton('transcript','영어 원문 보기')+'</div>':'')+(isOrder&&h.phase!=='feedback'?'':showText?'<p class="eq-english" lang="en">'+safe(a.english)+'</p>':'<p class="eq-english">수정이 전하는 짧은 지시를 들어 보세요.</p>');
  if(h.phase==='feedback'){
   const f=h.feedback||{};
   body+='<div class="eq-feedback '+(f.correct?'':'wrong')+'" role="status"><strong>'+(f.correct?'말의 뜻이 이어졌습니다.':'괜찮아요. 단서를 다시 살펴보세요.')+'</strong><p>'+safe(a.explanation)+'</p><p>'+safe(a.ko)+'</p>'+(f.text?'<p>'+safe(f.text)+'</p>':'')+(f.reward&&Object.values(f.reward).some(Boolean)?'<p class="eq-reward">'+safe(eqRewardText(f.reward))+'</p>':'')+(f.recruited?'<p>'+eqName(f.recruited)+'가 동료가 되었습니다.</p>':'')+'</div><div class="actions">'+(f.correct?eqButton('close','계속 탐험',{cl:'primary'}):eqButton('retry','다시 도전',{cl:'primary'}))+'</div>';
  }else if(h.phase==='seek'){
   body+='<p>지시를 읽고 지도에서 해당 물체 가까이 걸어가 상호작용하세요.</p><div class="actions">'+eqButton('seek','직접 찾아보기',{cl:'primary'})+eqButton('hint',p.exploration.activeCompanion==='mira'?'미라의 통찰':'한국어 힌트')+eqButton('abandon','단서 탐색 중단')+'</div>';
  }else if(a.kind==='order'||a.type==='order'){
   body+='<p>'+safe(a.ko)+'</p><div class="eq-sentence" aria-live="polite">'+(ExploreUI.words.map(i=>safe(h.words[i])).join(' ')||'단어를 눌러 문장을 이으세요.')+'</div><div class="eq-wordbank">'+h.words.map((word,i)=>eqButton('word',safe(word),{id:i,disabled:ExploreUI.words.includes(i)})).join('')+'</div><div class="actions">'+eqButton('undo','한 단어 되돌리기',{disabled:!ExploreUI.words.length})+eqButton('submit','문장 확인',{cl:'primary',disabled:ExploreUI.words.length!==h.words.length})+eqButton('hint','문장 힌트')+'</div>';
  }else{
   body+='<div class="eq-options">'+h.choices.map((choice,i)=>eqButton('answer',safe(choice),{id:i})).join('')+'</div>'+eqButton('hint','한국어 힌트');
  }
  if(ExploreUI.hint)body+='<p class="eq-hint">'+safe(ExploreUI.hint)+'</p>';
 }else{
  const reward=h.reward||h.feedback?.reward;
  body=(h.phase==='reward'?'<div class="eq-reward-reveal" aria-hidden="true"><svg viewBox="-70 -65 140 90">'+ExploreArt.object(o,{open:true,solved:true})+'</svg></div>':'')+'<p>'+safe(h.feedback?.explanation||h.text||h.feedback?.text||o.text||'길에 남은 이야기를 발견했습니다.')+'</p>'+(reward&&Object.values(reward).some(Boolean)?'<p class="eq-reward">'+safe(eqRewardText(reward))+'</p>':'')+'<div class="actions">'+eqButton('close','계속 탐험',{cl:'primary'})+'</div>';
 }
 if(p.exploration.completedChapter&&a?.final&&!h.practice&&h.phase==='feedback'&&h.feedback?.correct)body+='<div class="eq-feedback"><h3>제3장 완료 · 되살아난 수정</h3><p>세 지역의 말이 하나의 빛으로 이어졌습니다. 두 동료와 남은 비밀을 자유롭게 탐험할 수 있어요.</p></div>';
 return eqPanelShell(title,body,h.practice?'ENGLISH PRACTICE':'THE FORGOTTEN PATH');
}
function eqRewardText(r){return typeof r==='string'?r:[r.gold?'금화 +'+r.gold:'',r.gearId?gearInfo(r.gearId)?.name:'',r.potions?'물약 +'+r.potions:'',r.note?'새 학습 두루마리':'',r.cosmetic?({runeGlow:'룬빛 수정',leafGlow:'잎빛 수정'})[r.cosmetic]:''].filter(Boolean).join(' · ')||'발견을 기록했습니다.';}
screens.EXPLORE=exploreView;
