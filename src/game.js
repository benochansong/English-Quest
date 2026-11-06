// Scene controller. Only controls from the currently rendered scene may dispatch.
const app = document.querySelector('#app');
const pauseDialog = document.querySelector('#pause');
const game = {
  profile: Engine.load() || Engine.fresh(), screen: 'TITLE', stage: 1, page: 0,
  battle: null, task: null, order: [], feedback: null, reward: null,
  effect: '', amount: '', pausedFrom: '', confirm: '', reviewFrom: 'MAP',
  reviewSession: null, reviewResult: null, hint: '', timer: 0, speechFallback: false,
  mapSelection: 0, flipped: new Set(), impactPending: false, displayHp: null, guarded: false,
  battleIntent: 'normal', achievementStart: [], location:'square', dialogue:null, dialogueResult:null, offer:null, purchaseNotice:''
};
const saga = [
  ['사라진 인사', '아침마다 종소리처럼 울리던 “Hello”가, 오늘은 들리지 않는군요. 숲에서 시작된 침묵이 왕국의 이름까지 지우고 있답니다.'],
  ['세 조각의 수정', '슬라임들이 말의 수정을 삼켰어요. 모험가여, 숲에서 배운 말을 기억해 주세요. 바르게 떠올린 말은 그대의 검과 마법에 힘을 싣습니다.'],
  ['첫 번째 부탁', '“Hello”는 처음 만난 이에게 건네는 인사예요. 첫 숲길에서 그 말의 빛을 찾아 주세요. 틀려도 괜찮아요. 천천히 다시 익히면 됩니다.']
];
const zones = ['이슬 맺힌 숲길','푸른 수정 샘','고요한 왕의 정원'];
const stagesEN = ['Dewfall Trail','The Crystal Spring','Court of the Hollow Crown'];
const abilityInfo = {
  sword:['검격','단어의 뜻','sword'], fire:['화염 마법','문장 완성','flame'],
  guard:['수호 방패','표현의 뜻','shield'], heal:['치유 마법','단어 배열','leaf']
};
const forestLessons = lessons.filter(l=>l.chapter!==2);
const stageCards = [forestLessons.slice(0,10), forestLessons.slice(8), forestLessons.slice(9)];
const koreanExamples = {hello:'안녕, 친구야.',thanks:'고마워요, 로완.',apple:'나는 사과를 좋아해요.',water:'나는 물을 마셔요.',bread:'나는 빵을 먹어요.',book:'나는 책을 가지고 있어요.',sword:'나는 검을 가지고 있어요.',forest:'숲은 조용해요.',iam:'나는 학생이에요.',ihave:'나는 책을 가지고 있어요.',ilike:'나는 사과를 좋아해요.',iwant:'물을 좀 원해요.',ieat:'나는 빵을 먹어요.',idrink:'나는 물을 마셔요.'};
const labels = {'New':'새 표현','Learning':'익히는 중','Review Needed':'복습 필요','Familiar':'익숙한 표현'};
const paths = {
  lock:'M6 10h12v11H6Zm3 0V7a3 3 0 0 1 6 0v3',
  crown:'m3 7 5 4 4-7 4 7 5-4-2 12H5Zm2 9h14',
  check:'m4 12 5 5L20 6',
  sword:'M5 19 18 6l3-3-1 6L8 21m-5-8 8 8M3 21l4-4',
  flame:'M12 2c2 6 7 7 7 13a7 7 0 1 1-14 0c0-4 3-7 5-9 0 4 1 5 2 5 2-3 1-6 0-9Z',
  shield:'M12 2 3.5 5v6c0 5 4 8.6 8.5 11 4.5-2.4 8.5-6 8.5-11V5ZM12 6v11',
  leaf:'M3 20c4-2 6-8 10-11m-8 9C1 8 13 5 21 3c-1 10-3 18-13 15',
  crystal:'M12 2 20 9l-8 13L4 9Zm0 0-3 7 3 13 3-13Zm-8 7h16',
  book:'M3 4q5-1 9 2 4-3 9-2v15q-5-1-9 2-4-3-9-2Zm9 2v15',
  sound:'M3 9h4l5-4v14l-5-4H3Zm12-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14',
  menu:'M5 6h14M5 12h14M5 18h14', arrow:'m9 5 7 7-7 7', pin:'M12 22s7-8 7-13a7 7 0 0 0-14 0c0 5 7 13 7 13Zm0-16a3 3 0 1 0 0 6 3 3 0 1 0 0-6',
  star:'m12 2 2.5 7 7 2.5-7 2.5-2.5 8-2.5-8L2 11.5 9.5 9Z'
};
function icon(name){return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';}
function safe(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);}
function button(action,label,{id='',cl='',disabled=false,aria='',pressed}={}){
  return '<button type="button" class="btn '+cl+'" data-act="'+action+'" data-id="'+safe(id)+'" '+(disabled?'disabled ':'')+(aria?'aria-label="'+safe(aria)+'"':'')+(typeof pressed==='boolean'?' aria-pressed="'+pressed+'"':'')+'>'+label+'</button>';
}
function save(){
  game.hint = Engine.save(game.profile) ? '' : '이 브라우저에서 저장할 수 없어요. 창을 닫기 전까지는 계속 플레이할 수 있어요.';
}
function change(screen){
  if (game.screen === 'PAUSED') pauseDialog.close();
  AudioFX.stop(); game.screen=screen; render(); window.scrollTo(0,0);
  if(screen !== 'TITLE') app.focus({preventScroll:true});
}
function heading(kicker,title,desc=''){return '<header class="screen-heading"><div class="eyebrow">'+kicker+'</div><h2>'+title+'</h2>'+(desc?'<p>'+desc+'</p>':'')+'</header>';}
function speakButton(en){return AudioFX.canSpeak(game.profile.settings)?button('speak',icon('sound')+' 발음',{cl:'speak',id:en,aria:en+' 발음 듣기'}):'';}
function titleView(){
  const hasSave=game.profile.started;
  const begin=button('new',icon('sword')+' 게임 시작',{cl:hasSave?'':'primary'});
  const resume=button('continue','이어하기',{cl:hasSave?'primary':'',disabled:!hasSave});
  return '<section class="title">'+Art.forest(1,true)+'<div class="title-veil"></div><div class="title-frame"></div><div class="title-content"><div class="title-chapter">'+icon('crystal')+' 잃어버린 말의 연대기</div><h1><span>English</span> <span>Quest</span></h1><div class="subtitle">The Lost Kingdom of Words</div><p class="title-copy">잃어버린 말의 왕국</p><div class="title-buttons">'+(hasSave?resume+begin:begin+resume)+button('settings','설정',{cl:'title-settings'})+'</div></div><div class="title-foot">English Quest <span>◆</span> v0.3</div></section>';
}
function introView(){
  const item=saga[game.page];
  return '<section class="panel center-card story">'+heading('PROLOGUE',item[0])+'<div class="dialogue"><div class="portrait">'+Art.rowan()+'</div><div><b class="npc">숲의 안내자 · 로완</b><p class="dialogue-text">'+item[1]+'</p></div></div><div class="actions">'+button('intro-next',game.page===2?'숲 지도 펼치기':'다음 이야기',{cl:'primary'})+button('intro-skip','건너뛰기')+'</div></section>';
}
const stageNotes = [
  '이슬이 걷히기 전, 길을 잃은 숲 슬라임에게 첫인사를 건네세요.',
  '샘바닥에 잠든 두 번째 수정은 문장의 마법에 반응합니다.',
  '무너진 왕좌에서 마지막 수정이 빛납니다. 왕의 반격을 잘 살피세요.'
];
function mapView(){
  const p = game.profile;
  const selected = game.mapSelection || p.unlocked;
  const stats = Engine.stats(p);
  const stateOf = n => p.completed.includes(n) ? 'cleared' : n > p.unlocked ? 'locked' : 'current';
  const stateText = {cleared:'완료 · 연습 가능', locked:'아직 닫힌 길', current:'현재 퀘스트'};
  const pins = zones.map((zone,i) => {
    const n = i+1, state = stateOf(n);
    return button('map-pin',icon(n===3?'crown':state==='cleared'?'check':'pin'), {
      id:n, pressed:n===selected, cl:'atlas-pin pin-'+n+' '+state+(n===selected?' selected':''),
      aria:zone+' · '+stateText[state]+' · 장소 정보'
    });
  }).join('');
  const routes = zones.map((zone,i) => {
    const n=i+1, state=stateOf(n);
    return button('stage','<span class="stage-number">0'+n+'</span><span><strong>'+zone+
      '</strong><small>'+Engine.enemies[i].name+' · '+stateText[state]+'</small></span>'+icon(state==='locked'?'lock':'arrow'),
      {id:n,cl:'stage '+state,disabled:state==='locked'});
  }).join('');
  return heading('CHAPTER I  /  FOREST ATLAS','속삭이는 숲')+
    '<div class="map-grid"><section class="atlas panel"><div class="atlas-heading"><span class="eyebrow">THE WHISPERING FOREST</span><span>'+icon('crystal')+' '+p.completed.length+' / 3</span></div>'+
    '<div class="atlas-plate">'+Art.map()+pins+'</div><div class="atlas-caption" aria-live="polite"><div><small>'+stagesEN[selected-1]+'</small><strong>'+zones[selected-1]+'</strong></div><p>'+
    stageNotes[selected-1]+' '+(selected>p.unlocked?'앞 숲길을 완료하면 열립니다.':'')+'</p></div></section>'+
    '<section class="route-column"><h3>탐험 경로</h3><div class="stages">'+routes+'</div>'+
    '<div class="stats-band"><b>모험가 Lv. '+p.level+'</b><span>경험치 '+p.xp+' / '+stats.nextXp+'</span><span>금화 '+p.gold+'</span></div>'+
    '<div class="actions journal-links">'+button('book',icon('book')+' 단어 도감')+button('review',icon('leaf')+' 복습')+
    button('dashboard',icon('star')+' 학습 기록')+button('chapters',p.chapterComplete?'제2장 · 마을로':'장 선택')+(p.chapterComplete?button('ending','챕터 결말'):'')+'</div></section></div>';
}
function statBar(label,hp,max,right=false){
  return '<div class="stat '+(right?'right':'')+'"><strong>'+label+'</strong><div class="hp" role="meter" aria-label="'+label+' 체력" aria-valuenow="'+hp+'" aria-valuemin="0" aria-valuemax="'+max+'"><span style="width:'+100*hp/max+'%"></span></div><b>'+hp+' / '+max+' HP</b></div>';
}
function battleRibbon() {
  const b=game.battle, bonus=Engine.bonusPercent(b.combo);
  let intent='일반 반격';
  if(b.stage===3 && game.battleIntent==='charge')intent='왕의 마력 충전';
  if(b.stage===3 && game.battleIntent==='heavy')intent='강타 예고 · 수정핵 노출';
  let status=(b.stage===3?'왕관 '+b.bossPhase+'단계 · ':'')+intent;
  if(b.stage>=4)status=(b.charm?'부적 방어 · ':'')+(b.training?'오답 연습':villageIntent(b));
  if(game.screen==='VICTORY')status='전투 종료 · 승리';
  if(game.screen==='DEFEAT')status='전투 종료 · 패배';
  return '<span class="combo '+(b.combo>1?'active':'')+'">'+icon('star')+' 연속 정답 <b>×'+b.combo+'</b>'+
    (bonus?' <small>공격 +'+bonus+'%</small>':'')+'</span><span class="battle-intent">'+status+'</span>';
}
function arena(){
  const b=game.battle,n=game.stage,foe=Engine.enemies[n-1];
  return '<div class="arena" data-stage="'+n+'" data-phase="'+b.bossPhase+'" data-intent="'+game.battleIntent+'" data-fx="'+game.effect+'">'+
    (n>3?VillageArt.scene(b.training?'square':villageQuest(n).location,true):Art.forest(n))+'<div class="arena-shade"></div><div class="combatant hero">'+Art.hero()+'</div><div class="combatant enemy '+(n===3||n===6?'boss':'')+'">'+(n>3?VillageArt.enemy(n):Art.slime(n))+
    '</div><div class="fx"></div><div class="arena-status">'+statBar('모험가 · Lv. '+game.battleLevel,b.hp,game.battleMaxHp)+statBar(foe.name,b.enemyHp,b.enemyMaxHp,true)+'</div></div>';
}
function abilitiesView(){
 const b=game.battle;
 const tip=b.stage>=4?villageTactic(b):Engine.charging(b)?'왕이 마력을 모읍니다. 이번 턴에는 반격이 없어요.':
   Engine.heavy(b)?'왕의 강타 예고! 방패로 막아 다음 공격을 강화하거나, 열린 수정핵을 노리세요.':
   b.counterReady?'반격 준비 완료 · 다음 검격 또는 화염에 피해 +12':'사용할 기술을 고르세요.';
 return '<div class="battle-title"><h2>'+tip+'</h2><span class="hint">'+b.turn+'번째 턴</span></div><div class="abilities">'+Object.entries(abilityInfo).map(([id,[name,desc,glyph]])=>{
   const swordTask=Engine.exposed(b)?'듣기 도전':b.stage>=2&&b.turn%2===0?'한국어를 영어로':'단어의 뜻';
   const enabled=Engine.available(b,id),cd=b.cooldowns[id],note=enabled?(b.stage>=4?villageAbilityTask(b,id):id==='sword'?swordTask:desc):cd?cd+'턴 후 사용':b.training?'연습은 검격으로 진행':'두 번째 숲길에서 개방';
   return button('ability',icon(glyph)+'<strong>'+name+'</strong><small>'+note+'</small>',{id,cl:'ability',disabled:!enabled});
 }).join('')+'</div>'+combatItemButtons(b);
}
function questionView(context=''){
 const q=game.task.question, order=q.type==='order', listen=q.type==='listening';
 const hint=q.chapter!==2&&q.type==='sentence'&&q.instruction.includes('___')?'<p>'+koreanExamples[q.tags[0]]+'</p>':'';
 const listenUI=listen?'<div class="actions">'+button('replay',icon('sound')+' 다시 듣기',{disabled:!AudioFX.canSpeak(game.profile.settings)})+button('transcript','문장 보기')+'</div>'+(!AudioFX.canSpeak(game.profile.settings)||game.speechFallback?'<p>듣기 대체 문장 · <b lang="en">'+safe(q.phrase)+'</b></p>':''):'';
 const chosen=game.order.map(i=>game.task.choices[i]);
 const legend=context || (abilityInfo[game.battle.ability][0]+' · '+game.battle.turn+'번째 턴');
 return '<span class="eyebrow">'+legend+'</span><h2 class="question">'+safe(q.instruction)+'</h2>'+hint+listenUI+(order?'<div class="answer-line" aria-live="polite">'+(chosen.map(safe).join(' ')||'여기에 문장이 만들어져요.')+'</div><div class="words">'+game.task.choices.map((word,i)=>button('word',safe(word),{id:i,cl:'word',disabled:game.order.includes(i)})).join('')+'</div><div class="actions">'+button('submit-order','문장 확인',{cl:'primary',disabled:chosen.length!==q.choices.length})+button('undo','한 단어 되돌리기',{disabled:!chosen.length})+'</div>':'<div class="choices">'+game.task.choices.map((answer,i)=>button('choice','<span class="choice-index">'+String.fromCharCode(65+i)+'</span>'+safe(answer),{id:i,cl:'choice'})).join('')+'</div>');
}
function expression(q){
 if(q.type==='sentence'&&q.instruction.includes('___'))return q.phrase.replace('___',q.answer);
 if(['dialogue','sentence','order'].includes(q.type))return q.answer;
 return q.phrase;
}
function feedbackView(q,correct){
 const translation=q.type==='sentence'?'<div>'+safe(q.chapter===2?lessons.find(l=>l.id===q.tags[0]).ko:koreanExamples[q.tags[0]])+'</div>':'';
 return '<div class="feedback"><strong>'+(correct?'정답이에요!':'다시 익혀 볼까요?')+'</strong><h3 lang="en">'+safe(expression(q))+'</h3>'+translation+'<p>정답 · '+safe(q.answer)+'<br>'+safe(q.explanation)+'</p>'+speakButton(expression(q))+'</div>';
}
function battlePanel(){
 const b=game.battle, name=Engine.enemies[game.stage-1].name;
 let panel='';
 switch(game.screen){
 case 'BATTLE_READY':panel='<h2>'+name+' 등장</h2><p>'+(game.stage>=4?villageTactic(b):game.stage===1?'검격을 고르고 영어 단어의 뜻을 맞혀 보세요. 설명을 읽고 계속하면 공격합니다.':game.stage===2?'화염, 방어, 치유가 열렸습니다. 치유는 단어를 순서대로 눌러 사용하세요.':'왕이 마력을 충전한 다음 턴에는 강타를 씁니다. 방패를 맞히면 피해가 줄고 다음 공격이 강해져요. 열린 수정핵을 바로 공격해도 좋아요.')+'</p>'+button('fight','전투 시작',{cl:'primary'});break;
 case 'PLAYER_SELECT':panel=abilitiesView();break;
 case 'QUESTION_ACTIVE':panel=questionView();break;
 case 'ANSWER_FEEDBACK':if(game.feedback.retry){panel=feedbackView(game.task.question,false)+'<p>문장 첫 단어는 <b>'+safe(game.task.question.choices[0])+'</b>예요. 다시 이어 보세요. 다시 시도하는 동안 골렘은 기다립니다.</p>'+button('broken-retry','문장 복원 다시 하기',{cl:'primary'});break;}panel=feedbackView(game.task.question,game.feedback.correct)+(game.feedback.correct&&b.combo>1?'<p class="streak-line">'+icon('star')+' 연속 정답 '+b.combo+'회'+(b.combo===4?' · 최대 보너스':'')+'</p>':'')+button('resolve','계속 · 행동 실행',{cl:'primary'});break;
 case 'PLAYER_ACTION':panel='<h2>'+game.message+'</h2>';break;
 case 'ENEMY_ACTION':panel='<h2>'+game.message+'</h2>';break;
 case 'VICTORY':panel='<div class="eyebrow">VICTORY</div><h2>'+name+' 격파</h2><p>'+(b.training?'오답 연습을 마쳤습니다.':game.stage>=4?'마을에 말소리가 되살아납니다.':'숲에 목소리가 돌아옵니다.')+'</p>'+button('rewards','보상 확인',{cl:'primary'});break;
 case 'DEFEAT':panel='<h2>잠시 숨을 고르세요</h2><p>배운 표현은 수첩에 남아 있어요. 체력을 회복하고 다시 도전할 수 있습니다.</p><div class="actions">'+button('retry','다시 도전',{cl:'primary'})+button('review','오답 복습')+button('map','지도')+'</div>';break;
 }
 return panel;
}
function battleView(){
 return '<section class="battle" data-stage="'+game.stage+'"><div class="battle-heading"><span class="eyebrow">STAGE 0'+game.stage+'</span><h2>'+(game.stage>3?(game.battle.training?'광장 · 연습 전투':practiceNames[game.stage-4]):zones[game.stage-1])+'</h2></div>'+arena()+'<div class="battle-ribbon">'+battleRibbon()+'</div><section class="panel battle-panel" aria-live="polite">'+battlePanel()+'</section></section>';
}
// Keep character art and HP bars mounted throughout a fight. The turn panel changes independently.
function updateBattle(scene){
 const arenaNode=scene.querySelector('.arena'), b=game.battle;
 const max=[game.battleMaxHp,b.enemyMaxHp];
 const shown=game.displayHp || [b.hp,b.enemyHp];
 arenaNode.dataset.phase=b.bossPhase;
 arenaNode.dataset.intent=game.battleIntent;
 arenaNode.dataset.guarded=String(game.guarded);
 scene.querySelector('.battle-ribbon').innerHTML=battleRibbon();
 arenaNode.dataset.fx=game.effect;
 scene.querySelectorAll('.stat').forEach((node,i)=>{
  const hp=shown[i];
  const bar=node.querySelector('.hp');
  bar.setAttribute('aria-valuenow',hp);bar.setAttribute('aria-valuemax',max[i]);
  bar.firstElementChild.style.width=(100*hp/max[i])+'%';
  node.querySelector('b').textContent=hp+' / '+max[i]+' HP';
  if(i===0)node.querySelector('strong').textContent='모험가 · Lv. '+game.battleLevel;
 });
 arenaNode.querySelector('.float')?.remove();
 if(game.amount){
  const number=document.createElement('div');
  number.className='float '+(['heal','enemy','heavy'].includes(game.effect)?'on-hero':'');
  number.textContent=game.amount;arenaNode.append(number);
 }
 scene.querySelector('.battle-panel').innerHTML=battlePanel();
 app.querySelector('[data-act="settings"]').disabled=['PLAYER_ACTION','ENEMY_ACTION'].includes(game.screen);
}
function rewardView(){
 if(game.stage>=4)return villageReward();
 const r=game.reward, stage=game.stage;
 const story=['잎끝의 물방울이 다시 숲의 이름을 속삭입니다.','샘의 물결을 따라 마지막 왕좌로 가는 길이 열렸습니다.','세 수정의 목소리가 하나로 겹쳐 숲을 깨웁니다.'];
 const earned=Engine.achievements.filter(a=>game.profile.achievements.includes(a.id)&&!game.achievementStart.includes(a.id));
 return '<section class="center-card panel reward '+(r.levelUp?'level-up':'')+'"><div class="reward-crystal">'+icon('crystal')+'</div>'+
   heading(r.replay?'PRACTICE COMPLETE':'QUEST COMPLETE',zones[stage-1]+' 탐험 완료')+'<p>'+(r.replay?'복습 전투를 마쳤어요. 이번 답변을 학습 기록에 더했습니다.':story[stage-1])+'</p>'+
   (r.replay?'':'<div class="reward-tally"><strong>+'+r.xp+' XP</strong><strong>금화 +'+r.gold+'</strong></div>')+
   (r.bonus?'<p>챕터 완주 보너스 '+r.bonus+' XP 포함</p>':'')+(r.levelUp?'<h3>레벨 상승 · Lv. '+game.profile.level+'</h3>':'')+
   (earned.length?'<p class="earned-names">'+icon('star')+' 획득 · '+earned.map(a=>safe(a.name)).join(' / ')+'</p>':'')+
   (!r.replay&&stage<3?'<p>새로 열린 길 · '+zones[stage]+'</p>':'')+button('onwards',stage===3?'로완에게 돌아가기':'지도 펼치기',{cl:'primary'})+'</section>';
}
function endingView(){
 return '<section class="center-card panel reward"><div class="reward-crystal">'+icon('star')+'</div>'+heading('CHAPTER COMPLETE','숲이 다시 속삭입니다')+'<div class="dialogue"><div class="portrait">'+Art.rowan()+'</div><p>“들리나요? 물가에서도, 나뭇잎에서도 말이 되살아나고 있어요. 고마워요, 모험가여. <b lang="en">Thank you.</b>”<br>— 로완</p></div><p>획득 칭호 · <strong>Word Apprentice</strong></p><div class="actions">'+button('chapters','다음 장 · 마을로',{cl:'primary'})+button('book','단어 도감')+button('review','오답 복습')+button('map','숲 지도')+'</div></section>';
}
function bookView(){
 return heading('FIELD JOURNAL','단어 도감','수첩에서 읽은 표현과 정답·오답 횟수를 확인하세요.')+'<section class="panel book">'+lessons.filter(l=>game.profile.currentChapter===2?l.chapter===2:l.chapter!==2).map(l=>{
 const r=game.profile.learning[l.id];
 return '<article class="book-row"><div><strong lang="en">'+l.en+'</strong><small>'+l.ko+'</small></div><div>'+l.example+'<small>'+labels[Engine.status(r)]+' · 정답 '+(r?.correct||0)+' / 오답 '+(r?.wrong||0)+'</small></div>'+speakButton(l.en)+'</article>';
 }).join('')+'</section><div class="actions">'+button('map','지도')+button('review','오답 복습')+'</div>';
}
const screens={TITLE:titleView,INTRO:introView,MAP:mapView,LEARNING:lessonView,REWARD:rewardView,CHAPTER_COMPLETE:endingView,BOOK:bookView,REVIEW:reviewView,DASHBOARD:dashboardView,CHAPTERS:chaptersView,VILLAGE:villageView,LOCATION:locationView,QUESTS:questsView,SHOP:()=>itemView(true),BAG:()=>itemView(false),DIALOGUE:dialogueView,VILLAGE_END:villageEnding};
function render(){
 if(game.screen==='PAUSED'){showSettings();return;}
 const scene=app.querySelector('.battle');
 if(!screens[game.screen]&&scene?.dataset.stage===String(game.stage)){updateBattle(scene);return;}
 const view=(screens[game.screen]||battleView)();
 const shell='<div class="shell"><nav class="topbar" aria-label="게임 메뉴"><div class="brand">'+icon('crystal')+' English Quest</div><div class="nav-right"><span class="topmeta">'+(game.profile.currentChapter===2?'제2장 · 목소리의 마을':'제1장 · 속삭이는 숲')+'</span>'+button('settings',icon('menu'),{cl:'iconbtn',aria:'일시 정지 및 설정',disabled:['PLAYER_ACTION','ENEMY_ACTION'].includes(game.screen)})+'</div></nav>'+view+'</div>';
 app.innerHTML='<div class="world">'+(game.screen==='TITLE'?view:shell)+(game.hint?'<p role="status" class="storage-note">'+game.hint+'</p>':'')+'</div>';
 if(game.screen==='INTRO')revealDialogue();
}

function revealDialogue(){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const paragraph=app.querySelector('.dialogue-text');
 const fullText=paragraph.textContent;
 const reading=document.createElement('span');
 const ink=document.createElement('span');
 reading.className='dialogue-reserve';
 reading.textContent=fullText;
 ink.className='dialogue-ink';
 ink.setAttribute('aria-hidden','true');
 paragraph.replaceChildren(reading,ink);
 const start=performance.now();
 function frame(time){
  if(!ink.isConnected)return;
  const count=Math.min(fullText.length,Math.ceil((time-start)/19));
  ink.textContent=fullText.slice(0,count);
  if(count<fullText.length)requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
