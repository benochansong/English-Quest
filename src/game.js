// Scene controller. Only controls from the currently rendered scene may dispatch.
const app = document.querySelector('#app');
const pauseDialog = document.querySelector('#pause');
const game = {
  profile: Engine.load() || Engine.fresh(), screen: 'TITLE', stage: 1, page: 0,
  battle: null, task: null, order: [], feedback: null, reward: null,
  effect: '', amount: '', pausedFrom: '', confirm: '', reviewFrom: 'MAP',
  reviewId: '', reviewResult: null, hint: '', timer: 0, speechFallback: false
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
const stageCards = [lessons.slice(0,10), lessons.slice(8), lessons.slice(9)];
const koreanExamples = {hello:'안녕, 친구야.',thanks:'고마워요, 로완.',apple:'나는 사과를 좋아해요.',water:'나는 물을 마셔요.',bread:'나는 빵을 먹어요.',book:'나는 책을 가지고 있어요.',sword:'나는 검을 가지고 있어요.',forest:'숲은 조용해요.',iam:'나는 학생이에요.',ihave:'나는 책을 가지고 있어요.',ilike:'나는 사과를 좋아해요.',iwant:'물을 좀 원해요.',ieat:'나는 빵을 먹어요.',idrink:'나는 물을 마셔요.'};
const labels = {'New':'새 표현','Learning':'익히는 중','Review Needed':'복습 필요','Familiar':'익숙한 표현'};
const paths = {
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
function button(action,label,{id='',cl='',disabled=false,aria=''}={}){
  return '<button type="button" class="btn '+cl+'" data-act="'+action+'" data-id="'+safe(id)+'" '+(disabled?'disabled ':'')+(aria?'aria-label="'+safe(aria)+'"':'')+'>'+label+'</button>';
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
  return '<section class="title">'+Art.forest(1,true)+'<div class="title-veil"></div><div class="title-frame"></div><div class="title-content"><div class="crest">'+icon('crystal')+'</div><h1>English Quest</h1><div class="subtitle">The Lost Kingdom of Words</div><p class="title-copy">잃어버린 말의 왕국</p><div class="title-buttons">'+button('new',icon('sword')+' 게임 시작',{cl:'primary'})+button('continue','이어하기',{disabled:!game.profile.started})+button('settings','설정',{cl:'title-settings'})+'</div></div><div class="title-foot">제1장 <span>◆</span> 속삭이는 숲</div></section>';
}
function introView(){
  const item=saga[game.page];
  return '<section class="panel center-card story">'+heading('PROLOGUE',item[0])+'<div class="dialogue"><div class="portrait">'+Art.rowan()+'</div><div><b class="npc">숲의 안내자 · 로완</b><p class="dialogue-text">'+item[1]+'</p></div></div><div class="actions">'+button('intro-next',game.page===2?'숲 지도 펼치기':'다음 이야기',{cl:'primary'})+button('intro-skip','건너뛰기')+'</div></section>';
}
function mapView(){
  const p=game.profile, stats=Engine.stats(p);
  return heading('CHAPTER I','속삭이는 숲','숲길을 따라 세 조각의 말의 수정을 되찾으세요.')+'<div class="map-grid"><section class="map-illustration panel">'+Art.map()+'<div class="map-overlay"><div class="eyebrow">THE WHISPERING FOREST</div><h3>수정 조각 '+p.completed.length+' / 3</h3></div></section><section><div class="stages">'+zones.map((zone,i)=>{
    const n=i+1, cleared=p.completed.includes(n), locked=n>p.unlocked;
    return button('stage','<span class="stage-number">0'+n+'</span><span><strong>'+zone+'</strong><small>'+Engine.enemies[i].name+' · '+(locked?'앞 스테이지 완료 후 개방':cleared?'완료 · 다시 도전':'도전 가능')+'</small></span>'+icon(locked?'shield':'arrow'),{id:n,cl:'stage',disabled:locked});
  }).join('')+'</div><div class="stats-band"><b>모험가 Lv. '+p.level+'</b><span>경험치 '+p.xp+' / '+stats.nextXp+'</span><span>금화 '+p.gold+'</span></div><div class="actions">'+button('book',icon('book')+' 단어 도감')+button('review','오답 복습')+(p.chapterComplete?button('ending','챕터 결말'): '')+'</div></section></div>';
}
function lessonView(){
  const cards=stageCards[game.stage-1], page=game.page, last=(page+1)*2>=cards.length;
  return '<section class="center-card panel">'+heading('STAGE 0'+game.stage+' / '+stagesEN[game.stage-1],zones[game.stage-1],'로완의 수첩을 읽고 이번 전투에 쓸 말을 익히세요.')+'<div class="lesson-grid">'+cards.slice(page*2,page*2+2).map(l=>'<article class="lesson"><strong lang="en">'+l.en+'</strong><p>'+l.ko+'</p><hr><p lang="en">'+l.example+'</p><small>'+koreanExamples[l.id]+'</small>'+speakButton(l.en)+'</article>').join('')+'</div><div class="page-count">수첩 '+(page+1)+' / '+Math.ceil(cards.length/2)+'</div><div class="actions">'+button('lesson-next',last?'전투 준비':'다음 쪽',{cl:'primary'})+button('lesson-prev','이전 쪽',{disabled:!page})+button('map','지도')+'</div></section>';
}
function statBar(label,hp,max,right=false){
  return '<div class="stat '+(right?'right':'')+'"><strong>'+label+'</strong><div class="hp" role="meter" aria-label="'+label+' 체력" aria-valuenow="'+hp+'" aria-valuemin="0" aria-valuemax="'+max+'"><span style="width:'+100*hp/max+'%"></span></div><b>'+hp+' / '+max+' HP</b></div>';
}
function arena(){
  const b=game.battle,n=game.stage,foe=Engine.enemies[n-1],stats=Engine.stats(game.profile);
  return '<div class="arena" data-fx="'+game.effect+'">'+Art.forest(n)+'<div class="arena-shade"></div><div class="combatant hero">'+Art.hero()+'</div><div class="combatant enemy '+(n===3?'boss':'')+'">'+Art.slime(n)+'</div><div class="fx"></div><div class="arena-status">'+statBar('모험가 · Lv. '+game.profile.level,b.hp,stats.maxHp)+statBar(foe.name,b.enemyHp,foe.hp,true)+'</div>'+(game.amount?'<div class="float '+(['enemy','heal'].includes(game.effect)?'on-hero':'')+'">'+game.amount+'</div>':'')+'</div>';
}
function abilitiesView(){
 const b=game.battle;
 const tip=Engine.charging(b)?'왕이 마력을 모읍니다. 이번 턴에는 반격하지 않아요.':Engine.exposed(b)?'수정핵이 열렸어요! 이번 공격은 두 배 피해를 줍니다.':'사용할 기술을 고르세요.';
 return '<div class="battle-title"><h2>'+tip+'</h2><span class="hint">'+b.turn+'번째 턴</span></div><div class="abilities">'+Object.entries(abilityInfo).map(([id,[name,desc,glyph]])=>{
   const swordTask=Engine.exposed(b)?'듣기 도전':b.stage>=2&&b.turn%2===0?'한국어를 영어로':'단어의 뜻';
   const enabled=Engine.available(b,id),cd=b.cooldowns[id],note=enabled?(id==='sword'?swordTask:desc):cd?cd+'턴 후 사용':'두 번째 숲길에서 개방';
   return button('ability',icon(glyph)+'<strong>'+name+'</strong><small>'+note+'</small>',{id,cl:'ability',disabled:!enabled});
 }).join('')+'</div>';
}
function questionView(){
 const q=game.task.question, order=q.type==='order', listen=q.type==='listening';
 const hint=q.type==='sentence'&&q.instruction.includes('___')?'<p>'+koreanExamples[q.tags[0]]+'</p>':'';
 const listenUI=listen?'<div class="actions">'+button('replay',icon('sound')+' 다시 듣기',{disabled:!AudioFX.canSpeak(game.profile.settings)})+button('transcript','문장 보기')+'</div>'+(!AudioFX.canSpeak(game.profile.settings)||game.speechFallback?'<p>듣기 대체 문장 · <b lang="en">'+safe(q.phrase)+'</b></p>':''):'';
 const chosen=game.order.map(i=>game.task.choices[i]);
 return '<span class="eyebrow">'+abilityInfo[game.battle.ability || game.ability][0]+' · '+game.battle.turn+'번째 턴</span><h2 class="question">'+safe(q.instruction)+'</h2>'+hint+listenUI+(order?'<div class="answer-line" aria-live="polite">'+(chosen.map(safe).join(' ')||'여기에 문장이 만들어져요.')+'</div><div class="words">'+game.task.choices.map((word,i)=>button('word',safe(word),{id:i,cl:'word',disabled:game.order.includes(i)})).join('')+'</div><div class="actions">'+button('submit-order','문장 확인',{cl:'primary',disabled:chosen.length!==q.choices.length})+button('undo','한 단어 되돌리기',{disabled:!chosen.length})+'</div>':'<div class="choices">'+game.task.choices.map((answer,i)=>button('choice','<span class="choice-index">'+String.fromCharCode(65+i)+'</span>'+safe(answer),{id:i,cl:'choice'})).join('')+'</div>');
}
function expression(q){
 if(q.type==='sentence'&&q.instruction.includes('___'))return q.phrase.replace('___',q.answer);
 if(q.type==='sentence'||q.type==='order')return q.answer;
 return q.phrase;
}
function feedbackView(q,correct){
 const translation=q.type==='sentence'?'<div>'+safe(koreanExamples[q.tags[0]])+'</div>':'';
 return '<div class="feedback"><strong>'+(correct?'정답이에요!':'다시 익혀 볼까요?')+'</strong><h3 lang="en">'+safe(expression(q))+'</h3>'+translation+'<p>정답 · '+safe(q.answer)+'<br>'+safe(q.explanation)+'</p>'+speakButton(expression(q))+'</div>';
}
function battlePanel(){
 const b=game.battle, name=Engine.enemies[game.stage-1].name;
 let panel='';
 switch(game.screen){
 case 'BATTLE_READY':panel='<h2>'+name+' 등장</h2><p>'+(game.stage===1?'검격을 고르고 영어 단어의 뜻을 맞혀 보세요. 설명을 읽고 계속하면 공격합니다.':game.stage===2?'화염, 방어, 치유가 열렸습니다. 치유는 단어를 순서대로 눌러 사용하세요.':'왕이 힘을 모은 다음 턴에는 수정핵이 열려요. 소리를 듣거나 문장을 읽고 공격하세요.')+'</p>'+button('fight','전투 시작',{cl:'primary'});break;
 case 'PLAYER_SELECT':panel=abilitiesView();break;
 case 'QUESTION_ACTIVE':panel=questionView();break;
 case 'ANSWER_FEEDBACK':panel=feedbackView(game.task.question,game.feedback.correct)+button('resolve','계속 · 행동 실행',{cl:'primary'});break;
 case 'PLAYER_ACTION':panel='<h2>'+game.message+'</h2>';break;
 case 'ENEMY_ACTION':panel='<h2>'+game.message+'</h2>';break;
 case 'VICTORY':panel='<div class="eyebrow">VICTORY</div><h2>'+name+' 격파</h2><p>숲에 목소리가 돌아옵니다.</p>'+button('rewards','보상 확인',{cl:'primary'});break;
 case 'DEFEAT':panel='<h2>잠시 숨을 고르세요</h2><p>배운 표현은 수첩에 남아 있어요. 체력을 회복하고 다시 도전할 수 있습니다.</p><div class="actions">'+button('retry','다시 도전',{cl:'primary'})+button('review','오답 복습')+button('map','지도')+'</div>';break;
 }
 return panel;
}
function battleView(){
 return '<section class="battle" data-stage="'+game.stage+'"><div class="battle-heading"><span class="eyebrow">STAGE 0'+game.stage+'</span><h2>'+zones[game.stage-1]+'</h2></div>'+arena()+'<section class="panel battle-panel" aria-live="polite">'+battlePanel()+'</section></section>';
}
// Keep character art and HP bars mounted throughout a fight. The turn panel changes independently.
function updateBattle(scene){
 const arenaNode=scene.querySelector('.arena'), b=game.battle;
 const max=[Engine.stats(game.profile).maxHp, Engine.enemies[b.stage-1].hp];
 arenaNode.dataset.fx=game.effect;
 scene.querySelectorAll('.stat').forEach((node,i)=>{
  const hp=i===0?b.hp:b.enemyHp;
  const bar=node.querySelector('.hp');
  bar.setAttribute('aria-valuenow',hp);bar.setAttribute('aria-valuemax',max[i]);
  bar.firstElementChild.style.width=(100*hp/max[i])+'%';
  node.querySelector('b').textContent=hp+' / '+max[i]+' HP';
  if(i===0)node.querySelector('strong').textContent='모험가 · Lv. '+game.profile.level;
 });
 arenaNode.querySelector('.float')?.remove();
 if(game.amount){
  const number=document.createElement('div');
  number.className='float '+(['heal','enemy'].includes(game.effect)?'on-hero':'');
  number.textContent=game.amount;arenaNode.append(number);
 }
 scene.querySelector('.battle-panel').innerHTML=battlePanel();
 app.querySelector('[data-act="settings"]').disabled=['PLAYER_ACTION','ENEMY_ACTION'].includes(game.screen);
}
function rewardView(){
 const r=game.reward;
 return '<section class="center-card panel reward '+(r.levelUp?'level-up':'')+'"><div class="reward-crystal">'+icon('crystal')+'</div>'+heading('QUEST REWARD',zones[game.stage-1]+' 탐험 완료')+'<div class="reward-number">+'+r.xp+' XP</div><p>금화 +'+r.gold+(r.bonus?' · 챕터 보너스 경험치 '+r.bonus+' 포함':'')+'</p>'+(r.levelUp?'<h3>레벨 상승! 모험가 Lv. '+game.profile.level+'</h3>':'')+button('onwards',game.stage===3?'로완에게 돌아가기':'지도 펼치기',{cl:'primary'})+'</section>';
}
function endingView(){
 return '<section class="center-card panel reward"><div class="reward-crystal">'+icon('star')+'</div>'+heading('CHAPTER COMPLETE','숲이 다시 속삭입니다')+'<div class="dialogue"><div class="portrait">'+Art.rowan()+'</div><p>“들리나요? 물가에서도, 나뭇잎에서도 말이 되살아나고 있어요. 고마워요, 모험가여. <b lang="en">Thank you.</b>”<br>— 로완</p></div><p>획득 칭호 · <strong>Word Apprentice</strong></p><div class="actions">'+button('book','단어 도감',{cl:'primary'})+button('review','오답 복습')+button('map','숲 지도')+'</div></section>';
}
function bookView(){
 return heading('FIELD JOURNAL','단어 도감','수첩에서 읽은 표현과 정답·오답 횟수를 확인하세요.')+'<section class="panel book">'+lessons.map(l=>{
 const r=game.profile.learning[l.id];
 return '<article class="book-row"><div><strong lang="en">'+l.en+'</strong><small>'+l.ko+'</small></div><div>'+l.example+'<small>'+labels[Engine.status(r)]+' · 정답 '+(r?.correct||0)+' / 오답 '+(r?.wrong||0)+'</small></div>'+speakButton(l.en)+'</article>';
 }).join('')+'</section><div class="actions">'+button('map','지도')+button('review','오답 복습')+'</div>';
}
function reviewView(){
 const entries=Q.filter(q=>game.profile.mistakes[q.id]>0);
 const q=entries.find(x=>x.id===game.reviewId);
 return heading('FIELD JOURNAL','오답 복습','기억을 먼저 떠올린 뒤 정답과 예문을 확인하세요.')+(q?'<section class="panel center-card"><h3>'+safe(q.instruction)+'</h3>'+(q.type==='listening'?'<p>'+safe(q.phrase)+'</p>':'')+(game.reviewResult?feedbackView(q,true).replace('정답이에요!','표현 확인')+button('review-list','목록으로',{cl:'primary'}):button('reveal','정답과 해설 보기',{cl:'primary'}))+'</section>':'<div class="panel book">'+(entries.length?entries.map(q=>'<div class="book-row"><strong>'+safe(q.instruction)+'</strong><span>오답 '+game.profile.mistakes[q.id]+'회</span>'+button('review-one','복습',{id:q.id})+'</div>').join(''):'<p>아직 기록된 오답이 없어요.</p>')+'</div>')+'<div class="actions">'+button('review-back','돌아가기')+'</div>';
}
const screens={TITLE:titleView,INTRO:introView,MAP:mapView,LEARNING:lessonView,REWARD:rewardView,CHAPTER_COMPLETE:endingView,BOOK:bookView,REVIEW:reviewView};
function render(){
 if(game.screen==='PAUSED'){showSettings();return;}
 const scene=app.querySelector('.battle');
 if(!screens[game.screen]&&scene?.dataset.stage===String(game.stage)){updateBattle(scene);return;}
 const view=(screens[game.screen]||battleView)();
 const shell='<div class="shell"><nav class="topbar" aria-label="게임 메뉴"><div class="brand">'+icon('crystal')+' English Quest</div><div class="nav-right"><span class="topmeta">제1장 · 속삭이는 숲</span>'+button('settings',icon('menu'),{cl:'iconbtn',aria:'일시 정지 및 설정',disabled:['PLAYER_ACTION','ENEMY_ACTION'].includes(game.screen)})+'</div></nav>'+view+'</div>';
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
