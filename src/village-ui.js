// Chapter navigation and village scenes. Rules and persistent mutations live in VillageEngine.
const villagePlaces = {
  square:{name:'마을 광장',en:'The Village of Voices'},
  market:{name:'상인의 시장',en:'Merchant’s Market',direction:'시장으로',stage:4,npc:'클라라',role:'지도 상인'},
  inn:{name:'등불 여관',en:'Lantern Inn',direction:'여관으로',stage:5,npc:'토머스',role:'여관 주인'},
  gate:{name:'마을 북문',en:'Northern Village Gate',direction:'북문으로',stage:6,npc:'엘레나',role:'북문 경비대장'}
};
const questStateLabels={locked:'잠김',available:'수락 가능',active:'대화 중',ready:'전투 가능',complete:'완료'};
const villageEnemies=['그림자 까마귀','메아리 정령','문장 골렘'];
const practiceNames=['시장 변두리','여관의 샘','북문의 룬 제단'];
function villageQuest(stage){return VillageData.quests.find(q=>q.stage===stage);}
function questStatus(stage){return VillageEngine.status(game.profile,stage);}
function currentQuest(){return VillageData.quests.find(q=>!game.profile.village.progress[q.stage].completed);}
function questObjective(q){
  const state=questStatus(q.stage);
  if(state==='locked')return '앞선 의뢰를 마치면 길이 열립니다.';
  if(state==='available')return villagePlaces[q.location].npc+'의 의뢰를 수락하세요.';
  if(state==='active')return villagePlaces[q.location].npc+'와 대화를 이어 가세요.';
  if(state==='ready')return villageEnemies[q.stage-4]+'에게 도전하세요.';
  return '완료한 대화와 전투를 다시 연습할 수 있어요.';
}
function villageNav(){
  return rpgHubLinks()+'<nav class="village-nav" aria-label="마을 수첩">'+
    button('quests',icon('book')+' 의뢰 일지')+button('inventory',icon('shield')+' 소지품')+
    button('book',icon('leaf')+' 단어 도감')+button('review','표현 복습')+
    button('voice-hall',icon('mic')+' 메아리의 전당',{cl:'hall-link'})+button('today','오늘의 복습')+button('dashboard','학습 기록')+button('chapters','장 선택')+'</nav>';
}
function chaptersView(){
  const p=game.profile;
  return heading('ATLAS OF WORDS','어느 곳으로 떠날까요?')+
    '<div class="chapter-picker">'+[
      [1,'속삭이는 숲','The Whispering Forest',Art.forest(1,true),p.chapterComplete?'첫 장 완료 · 다시 탐험':'숲의 수정 '+p.completed.length+' / 3'],
      [2,'목소리를 되찾은 마을','The Village of Voices',VillageArt.scene('square'),p.chapterComplete?'마을 의뢰 '+VillageData.quests.filter(q=>p.village.progress[q.stage].completed).length+' / 3':'숲의 슬라임 왕을 물리치면 열립니다.']
    ].map(([n,ko,en,art,sub])=>'<article class="panel chapter-entry"><div class="chapter-scene">'+art+'</div><div class="chapter-body"><span class="eyebrow">CHAPTER 0'+n+'</span><h2>'+ko+'</h2><i>'+en+'</i><p>'+sub+'</p>'+
      button('chapter',n===1?'숲 지도 펼치기':p.chapterComplete?'마을로 들어가기':'잠긴 챕터',{id:n,cl:'primary',disabled:n===2&&!p.chapterComplete})+'</div></article>').join('')+'</div>';
}
function villageView(){
  const p=game.profile,q=currentQuest(),finished=3-(VillageData.quests.filter(q=>!p.village.progress[q.stage].completed).length);
  const pins=VillageData.quests.map(quest=>{
    const state=questStatus(quest.stage),place=villagePlaces[quest.location];
    return button('destination',icon(state==='locked'?'lock':state==='complete'?'check':'pin')+' '+place.name,{id:quest.location,cl:'v-pin pin-'+quest.location+' '+state,disabled:state==='locked',aria:place.name+' · '+questStateLabels[state]});
  }).join('');
  return heading('CHAPTER II  /  THE VILLAGE OF VOICES','목소리를 되찾은 마을',q?'숲 너머 마을에는 낱말만 남았습니다. 문장 골렘이 흩뜨린 대화를 다시 이어 주세요.':'시장의 인사와 여관의 주문이 다시 오가는 마을입니다.')+
    '<div class="village-hub"><section class="panel painted-map"><header><b>마을 광장</b><span>완료 의뢰 '+finished+' / 3</span></header>'+
    '<div class="square-scene">'+VillageArt.scene('square')+pins+button('quests',icon('book')+' 의뢰 게시판',{cl:'v-pin pin-board'})+'</div></section>'+
    '<aside class="panel quest-compass"><span class="eyebrow">QUEST BOARD</span><h3>'+(q?q.title:'다시 이어진 목소리')+'</h3><p>'+(q?q.story:'골렘의 마지막 룬이 풀렸습니다. 되찾은 표현으로 시장에서 실전 대화를 해 보세요.')+'</p>'+
    (q?'<div class="objective">'+icon('pin')+' '+questObjective(q)+'</div>'+button('destination',villagePlaces[q.location].direction,{id:q.location,cl:'primary'}):button('ending-village','마을의 결말',{cl:'primary'}))+
    '<hr><div class="purse">'+icon('crystal')+' 금화 '+p.gold+' · 모험가 Lv. '+p.level+'</div>'+
    button('train','오답 연습 전투',{disabled:!Object.keys(p.mistakes).length})+
    (!Object.keys(p.mistakes).length?'<small>틀린 문제가 생기면 열립니다.</small>':'<small>틀린 문제를 검격으로 다시 풀어요. 연습 보상 없음.</small>')+
    '</aside></div>'+villageNav();
}
function utterance(text){
  return '<span lang="en" class="spoken-word">'+safe(text)+'</span>';
}
function audioChip(text){
  return AudioFX.canSpeak(game.profile.settings)?speakButton(text):'<small class="voice-note">'+(game.profile.settings.voice?'영어 음성 미지원 · 글로 읽기':'발음 꺼짐')+'</small>';
}
function goalsList(q){
  return '<div class="quest-lexicon">'+q.tags.map(id=>{
    const l=lessons.find(item=>item.id===id);
    return '<div><div>'+utterance(l.en)+'<small>'+safe(l.ko)+'</small></div>'+audioChip(l.en)+'</div>';
  }).join('')+'</div>';
}
function locationHero(location){
  const q=villageQuest(villagePlaces[location].stage),place=villagePlaces[location];
  return '<header class="location-hero panel"><div class="location-art">'+VillageArt.scene(location,false,'xMidYMid slice')+'</div><div class="location-shade"></div>'+
    '<div class="location-title"><div class="eyebrow">'+place.en.toUpperCase()+'</div><h2>'+place.name+'</h2><span>'+place.role+' · '+place.npc+'</span></div>'+
    '<div class="location-portrait">'+VillageArt.npc(q.npc)+'</div></header>';
}
function locationView(){
  const q=villageQuest(villagePlaces[game.location].stage),state=questStatus(q.stage),place=villagePlaces[q.location];
  const controls=[];
  if(state==='available')controls.push(button('accept-quest','의뢰 수락',{id:q.stage,cl:'primary'}));
  else{
    controls.push(button('talk',place.npc+'와 '+(state==='active'?'대화하기':'대화 연습'),{id:q.stage,cl:state==='active'?'primary':''}));
    if(state==='ready'||state==='complete')controls.push(button('village-fight',villageEnemies[q.stage-4]+(state==='complete'?' · 재도전':'에게 도전'),{id:q.stage,cl:'primary'}));
  }
  if(state!=='available')controls.push(button('voice-mission',icon('chat')+' '+place.npc+'의 회화 미션',{id:'vc-'+q.npc}));
  const next=currentQuest();
  if(state==='complete'&&next)controls.push(button('destination','다음 의뢰 · '+villagePlaces[next.location].direction,{id:next.location}));
  if(q.location==='market')controls.push(button('shop',icon('crystal')+' 물품 상점'));
  return locationHero(q.location)+'<div class="location-panels"><section class="panel quest-letter"><span class="eyebrow">의뢰 0'+(q.stage-3)+' · '+questStateLabels[state]+'</span>'+
    '<h2>'+q.title+'</h2><p>'+q.story+'</p><p class="objective">'+questObjective(q)+'</p><div class="actions">'+controls.join('')+'</div></section>'+
    '<section class="panel goals"><h3>이번 의뢰에서 쓸 표현</h3>'+goalsList(q)+'</section></div>'+
    '<div class="actions">'+button('village-home','광장으로')+button('quests','의뢰 일지')+button('inventory','소지품')+'</div>';
}
function questsView(){
  return heading('VILLAGE JOURNAL','의뢰 일지')+'<div class="quest-ledger">'+VillageData.quests.map((q,i)=>{
    const state=questStatus(q.stage),progress=game.profile.village.progress[q.stage];
    return '<article class="panel quest-letter"><span class="eyebrow">0'+(i+1)+' / '+questStateLabels[state]+'</span><h3>'+q.title+'</h3><p>'+q.story+'</p><p class="objective">'+questObjective(q)+'</p>'+
      '<small>대화 '+progress.step+' / '+VillageData.dialogues[q.npc].length+' · 전투 '+(progress.completed?'1':'0')+' / 1</small>'+
      '<p class="purse">첫 완료 · '+q.xp+' XP · 금화 '+q.gold+'</p>'+button('destination',villagePlaces[q.location].direction,{id:q.location,disabled:state==='locked'})+'</article>';
  }).join('')+'</div><div class="actions">'+button('village-home','광장으로')+'</div>';
}
function dialogueView(){
  const session=game.dialogue,result=game.dialogueResult,scenario=session.stage==='scenario';
  const q=scenario?VillageData.quests[0]:villageQuest(session.stage),place=villagePlaces[q.location],line=session.line;
  const lines=result?'<div class="dialogue-result '+(result.correct?'correct':'retry')+'"><b>'+(result.correct?'대화가 이어졌어요.':'이 상황에서는 이렇게 말해 보세요.')+'</b>'+
    '<p>내가 한 말 · '+utterance(result.option.text)+'</p>'+
    (!result.correct?'<p>알맞은 답 · '+utterance(session.question.answer)+' '+audioChip(session.question.answer)+'</p>':'')+'<p>'+safe(result.option.why)+'</p>'+
    button('dialogue-next',result.correct?(result.done?'대화 마치기':'다음 말 듣기'):'다시 답하기',{cl:'primary'})+'</div>':
    '<h3 class="dialogue-goal">'+safe(line.goal)+'</h3><div class="dialogue-options">'+session.choices.map((text,i)=>button('reply','<span class="choice-index">'+String.fromCharCode(65+i)+'</span>'+utterance(text),{id:i,cl:'choice'})).join('')+'</div>';
  const spoken=result?result.option.reply:line.english;
  return '<section class="dialogue-stage panel"><div class="dialogue-setting">'+VillageArt.scene(q.location,false,'xMidYMid slice')+'</div><div class="v-speaker">'+VillageArt.npc(q.npc)+'</div>'+
    '<div class="speech-panel"><div class="eyebrow">'+(scenario?'실전 대화 · 시장에서':'대화 · '+place.name)+' · '+(session.step+1)+' / '+session.total+'</div><h2>'+place.npc+'</h2>'+
    '<div class="speech-text">'+utterance(spoken)+'</div><div class="speech-tools">'+(!result||result.option.ko?'<span>'+safe(result?result.option.ko:line.korean)+'</span>':'')+audioChip(spoken)+'</div></div></section>'+
    '<section class="panel reply-panel">'+lines+'</section><div class="actions">'+button('village-home','광장으로')+'</div>';
}
function itemView(shop){
  const p=game.profile;
  if(shop&&game.offer){
    const item=VillageEngine.items.find(it=>it.id===game.offer.id);
    const gear=gearInfo(item.id);
    return heading('MERCHANT’S MARKET','구매 확인')+'<section class="panel receipt">'+(gear?RpgArt.gear(item.id):VillageArt.item(item.id))+'<h2>'+item.name+'</h2><p>'+item.description+'</p>'+
      (gear?compareGear(p,gear):'')+
      '<div class="receipt-cost"><span>가격 <b>'+item.price+' 금화</b></span><span>구매 후 잔액 <b>'+(p.gold-item.price)+' 금화</b></span></div>'+
      '<div class="actions">'+button('buy-confirm','구매 확정',{cl:'primary'})+button('buy-cancel','취소')+'</div></section>';
  }
  return heading(shop?'MERCHANT’S MARKET':'TRAVELER’S PACK',shop?'클라라의 물품 상점':'모험가의 소지품','보유 금화 '+p.gold)+
    (game.purchaseNotice?'<p role="status" class="objective">'+safe(game.purchaseNotice)+'</p>':'')+
    (shop?'<nav class="rpg-nav" aria-label="상점 분류">'+button('shop-supplies','여행용품',{pressed:!game.shopGear})+button('shop-gear','전투 장비',{pressed:!!game.shopGear})+'</nav>':
      '<div class="actions">'+button('equipment','장비 보관함 · '+p.rpg.collection.length+'종')+'</div>')+
    '<div class="item-shelf">'+VillageEngine.items.filter(item=>!!gearInfo(item.id)===!!(shop&&game.shopGear)).map(item=>{
      if(gearInfo(item.id))return gearShopCard(p,gearInfo(item.id));
      const n=VillageEngine.quantity(p,item.id),full=n>=item.limit,poor=p.gold<item.price;
      return '<article class="panel shop-item"><div class="item-art">'+VillageArt.item(item.id)+'</div><h3>'+item.name+'</h3><p>'+item.description+'</p>'+
        '<div class="stock"><b>'+item.price+' 금화</b><span>보유 '+n+' / '+item.limit+'</span></div>'+
        (shop?button('purchase',full?'보유 한도 도달':poor?'금화 부족':'구매하기',{id:item.id,cl:'primary',disabled:full||poor}):'<small>'+(item.id==='cloak'?(n?'장착 중':'구매 즉시 장착'):'전투 명령에서 사용')+'</small>')+'</article>';
    }).join('')+'</div><div class="actions">'+(shop?button('shop-back','시장으로'):'')+button('village-home','광장으로')+'</div>';
}
function villageReward(){
  const r=game.reward,b=game.battle,q=villageQuest(game.stage),s=VillageEngine.summary(game.profile,game.stage);
  const title=b.training?'연습 전투 완료':q.title+' 완료';
  const heard=s.tags.map(id=>lessons.find(l=>l.id===id)).filter(Boolean);
  const nameOf=id=>lessons.find(l=>l.id===id)?.en||id;
  return '<section class="panel quest-results"><div class="eyebrow">'+(r.replay?'PRACTICE COMPLETE':'QUEST COMPLETE')+'</div><h2>'+title+'</h2>'+
    (r.replay?'<p>이번 답변이 학습 기록에 반영되었습니다. 연습 전투 보상은 없습니다.</p>':
    '<p>되찾은 말이 마을에 울려 퍼집니다.</p><div class="reward-tally"><strong>+'+r.xp+' XP</strong><strong>금화 +'+r.gold+'</strong></div>'+
    (r.levelUp?'<p>레벨 상승 · Lv. '+game.profile.level+' · 사용 가능 '+game.profile.rpg.availablePoints+' SP</p>':'')+lootReveal(r.gearId)+
    '<h3>의뢰에서 연습한 표현</h3><p>대화와 전투 · 정답 '+s.correct+'회 / 오답 '+s.wrong+'회</p>'+
    '<div class="summary-words">'+heard.map(l=>'<div>'+utterance(l.en)+' <small>'+safe(l.ko)+'</small>'+audioChip(l.en)+'</div>').join('')+'</div>'+
    '<p>다시 볼 표현 · '+(s.reviewTags.length?s.reviewTags.map(nameOf).map(safe).join(' / '):'없음')+'</p>')+
    button('onwards',!b.training&&game.stage===6?'마을의 결말':'마을로 돌아가기',{cl:'primary'})+'</section>';
}
function villageEnding(){
  const complete=game.profile.village.scenarioComplete;
  return '<div class="village-finale"><div class="finale-art">'+VillageArt.scene('square',false,'xMidYMid slice')+'</div><section class="panel"><div class="eyebrow">CHAPTER II COMPLETE</div>'+
    '<h2>다시 이어진 목소리</h2><p>성문을 짓누르던 룬이 한 줄의 문장으로 풀립니다. 광장에서는 클라라의 인사에 토머스가 답하고, 엘레나는 길을 묻는 여행자에게 손짓합니다.</p>'+
    '<h3>'+(complete?'획득 업적 · 마을의 통역사':'마지막 실전 · 처음 가는 가게에서')+'</h3><p>가게에 들어가 말을 걸고, 물을 주문하고, 가격을 물은 뒤 감사 인사를 해 보세요.</p>'+
    '<div class="actions">'+button('talk',complete?'실전 대화 다시 하기':'실전 대화 시작',{id:'scenario',cl:'primary'})+button('village-home','광장으로')+'</div></section></div>';
}
function combatItemButtons(b){
  if(b.training)return '';
  const p=game.profile, usable=VillageEngine.items.filter(i=>i.id!=='cloak'&&p.village.inventory[i.id]>0);
  if(!usable.length)return '';
  return '<div class="field-items">'+usable.map(i=>button('item-use',safe(i.name)+' ×'+p.village.inventory[i.id],
    {id:i.id,disabled:Engine.golemBreak(b)||(i.id==='potion'&&b.hp>=game.battleMaxHp)||(i.id==='charm'&&b.charm)})).join('')+'</div>';
}
