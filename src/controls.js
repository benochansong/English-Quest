// Keep modal inputs outside the scene so opening settings preserves the current question.
function showSettings(){
 const p=game.profile, cfg=p.settings;
 const confirmLabel=game.confirm==='reset'?'저장 기록을 지울까요?':'새 모험으로 교체할까요?';
 const actions=game.confirm?'<h2>'+confirmLabel+'</h2><p>현재 모험과 학습 기록이 초기화됩니다.</p><div class="actions">'+button('confirm','초기화하고 계속',{cl:'primary'})+button('cancel-confirm','취소')+'</div>':
 '<div class="eyebrow">'+(game.pausedFrom==='TITLE'?'MAIN MENU':'PAUSED')+'</div><h2>설정</h2><label class="setting">효과음<input type="checkbox" data-setting="sound" '+(cfg.sound?'checked':'')+'></label><label class="setting">효과음 크기<input type="range" data-setting="volume" value="'+Math.round(cfg.volume*100)+'" min="0" max="100"></label><label class="setting">영어 발음<input type="checkbox" data-setting="voice" '+(cfg.voice?'checked':'')+'></label><div class="actions">'+button('close',game.pausedFrom==='TITLE'?'닫기':'계속하기',{cl:'primary'})+(game.pausedFrom!=='TITLE'?button('to-title','타이틀로'):'')+(p.started?button('reset','진행 초기화'):'')+'</div>';
 pauseDialog.innerHTML='<section class="modal">'+actions+'</section>';
 if(!pauseDialog.open)pauseDialog.showModal();
 if(game.confirm)pauseDialog.querySelector('[data-act="cancel-confirm"]').focus();
}
function openSettings(mode=''){
 if(['PLAYER_ACTION','ENEMY_ACTION','PAUSED'].includes(game.screen))return;
 game.pausedFrom=game.screen;game.confirm=mode;AudioFX.stop();game.screen='PAUSED';showSettings();
}
function closeSettings(){
 game.confirm='';game.screen=game.pausedFrom;pauseDialog.close();render();
 const focusButton=app.querySelector('[data-act="settings"]');
 if(focusButton)focusButton.focus({preventScroll:true});
}
function startNew(){
 const settings={...game.profile.settings};
 game.profile=Engine.fresh();game.profile.settings=settings;game.profile.started=true;
 game.page=0;game.battle=null;save();change('INTRO');
}
function startBattle(){
 const b=Engine.battle(game.profile,game.stage);if(!b)return;
 game.battle=b;game.task=null;game.effect='ready';game.amount='';change('BATTLE_READY');
}
function listen(){
 const q=game.task?.question;
 if(!q||q.type!=='listening')return;
 const fallback=()=>{if(game.screen==='QUESTION_ACTIVE'&&game.task.question===q){game.speechFallback=true;render();}};
 if(!AudioFX.speak(q.phrase,game.profile.settings,fallback))fallback();
}
function selectAbility(ability){
 const task=Engine.select(game.profile,game.battle,ability);
 if(!task)return;
 game.ability=ability;game.task=task;game.speechFallback=false;game.order=[];change('QUESTION_ACTIVE');
 if(task.question.type==='listening')listen();
}
function submitAnswer(value){
 const result=Engine.answer(game.profile,game.battle,value);if(!result)return;
 game.feedback=result;save();change('ANSWER_FEEDBACK');AudioFX.play(result.correct?'correct':'wrong',game.profile.settings);
}
function afterEffect(fn){
 const fast=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 game.timer=window.setTimeout(fn,fast?80:850);
}
function resolveTurn(){
 const b=game.battle,p=game.profile;
 const result=Engine.playerAction(p,b);if(!result)return;
 game.effect=b.correct?b.ability:'miss';game.amount='';
 if(result.damage)game.amount='−'+result.damage;
 if(game.effect==='heal')game.amount='+'+result.healing;
 game.message=b.correct?abilityInfo[b.ability][0]+' 발동'+(result.guard?' · 다음 피해 60% 감소':''):'말의 빛이 흩어집니다.';
 // Claim at the same checkpoint as the killing blow. No pending reward is saved.
 if(result.won){game.reward=Engine.reward(p,b);save();}
 change('PLAYER_ACTION');AudioFX.play(b.correct?b.ability:'wrong',p.settings);
 afterEffect(()=>{
  game.amount='';
  if(result.won){game.effect='win';change('VICTORY');AudioFX.play('victory',p.settings);return;}
  const enemy=Engine.enemyAction(p,b);if(!enemy)return;
  game.effect=enemy.charging?'charge':'enemy';game.amount=enemy.damage?'−'+enemy.damage:'';
  game.message=enemy.charging?'슬라임 왕이 힘을 모읍니다. 다음 턴에 수정핵을 노리세요!':Engine.enemies[b.stage-1].name+'의 반격 · 피해 '+enemy.damage;
  change('ENEMY_ACTION');if(!enemy.charging)AudioFX.play('enemy',p.settings);
  afterEffect(()=>{
   game.amount='';game.effect=enemy.lost?'lose':'';
   if(enemy.lost){save();AudioFX.play('defeat',p.settings);}
   change(enemy.lost?'DEFEAT':'PLAYER_SELECT');
  });
 });
}
function openReview(){
 game.reviewFrom=game.screen;game.reviewId='';game.reviewResult=null;change('REVIEW');
}
function dispatch(action,id){
 const p=game.profile;
 // Detached controls cannot reach this function. Validate each transition as well.
 if(action==='speak'){AudioFX.speak(id,p.settings);return;}
 if(action==='settings'){openSettings();return;}
 if(game.screen==='PAUSED'){
  if(action==='close')closeSettings();
  if(action==='reset'){game.confirm='reset';showSettings();}
  if(action==='cancel-confirm'){if(game.confirm==='new')closeSettings();else{game.confirm='';showSettings();}}
  if(action==='confirm'&&game.confirm){
   const mode=game.confirm;game.confirm='';
   if(mode==='new')startNew();
   else{const cfg=p.settings;game.profile=Engine.fresh();game.profile.settings=cfg;game.battle=null;save();change('TITLE');}
  }
  if(action==='to-title'){game.battle=null;change('TITLE');}
  return;
 }
 if(action==='map'&&['BOOK','DEFEAT','CHAPTER_COMPLETE','LEARNING'].includes(game.screen)){game.battle=null;change('MAP');return;}
 if(action==='book'&&['MAP','CHAPTER_COMPLETE'].includes(game.screen)){change('BOOK');return;}
 if(action==='review'&&['MAP','DEFEAT','BOOK','CHAPTER_COMPLETE'].includes(game.screen)){openReview();return;}
 switch(game.screen){
 case 'TITLE':
  if(action==='new'){if(p.started)openSettings('new');else startNew();}
  if(action==='continue'&&p.started)change('MAP');
  break;
 case 'INTRO':
  if(action==='intro-skip'||(action==='intro-next'&&game.page===2))change('MAP');
  else if(action==='intro-next'){game.page++;render();}
  break;
 case 'MAP':
  if(action==='stage'&&Number.isInteger(+id)&&+id>=1&&+id<=p.unlocked){game.stage=+id;game.page=0;change('LEARNING');}
  if(action==='ending'&&p.chapterComplete)change('CHAPTER_COMPLETE');
  break;
 case 'LEARNING':{
  const cards=stageCards[game.stage-1];
  if(action==='lesson-prev'&&game.page>0){game.page--;render();}
  if(action==='lesson-next'){
   Engine.teach(p,cards.slice(game.page*2,game.page*2+2).map(item=>item.id));save();
   if((game.page+1)*2>=cards.length)startBattle();else{game.page++;render();}
  }break;}
 case 'BATTLE_READY':if(action==='fight'){game.effect='';change('PLAYER_SELECT');}break;
 case 'PLAYER_SELECT':if(action==='ability')selectAbility(id);break;
 case 'QUESTION_ACTIVE':{
  const index=Number(id),choices=game.task.choices;
  if(action==='choice'&&game.task.question.type!=='order'&&Object.hasOwn(choices,index))submitAnswer(choices[index]);
  if(action==='word'&&game.task.question.type==='order'&&Object.hasOwn(choices,index)&&!game.order.includes(index)){game.order.push(index);render();}
  if(action==='undo'){game.order.pop();render();}
  if(action==='submit-order'&&game.task.question.type==='order'&&game.order.length===choices.length)submitAnswer(game.order.map(i=>choices[i]).join(' '));
  if(action==='replay')listen();
  if(action==='transcript'){game.speechFallback=true;render();}
  break;}
 case 'ANSWER_FEEDBACK':if(action==='resolve')resolveTurn();break;
 case 'VICTORY':if(action==='rewards'){change('REWARD');if(game.reward.levelUp)AudioFX.play('level',p.settings);}break;
 case 'REWARD':if(action==='onwards'){game.battle=null;change(game.stage===3?'CHAPTER_COMPLETE':'MAP');}break;
 case 'DEFEAT':if(action==='retry')startBattle();break;
 case 'REVIEW':
  if(action==='review-one'&&p.mistakes[id]){game.reviewId=id;game.reviewResult=false;render();}
  if(action==='reveal'){game.reviewResult=true;render();}
  if(action==='review-list'){game.reviewId='';render();}
  if(action==='review-back')change(game.reviewFrom);
  break;
 }
}
function handleClick(event){
 const el=event.target.closest('button[data-act]');
 if(!el||!el.isConnected||el.disabled||event.detail>1)return;
 if(game.screen==='PAUSED'&&!pauseDialog.contains(el))return;
 AudioFX.play('ui',game.profile.settings);dispatch(el.dataset.act,el.dataset.id);
}
app.tabIndex=-1;app.addEventListener('click',handleClick);pauseDialog.addEventListener('click',handleClick);
pauseDialog.setAttribute('aria-label','게임 설정');
pauseDialog.addEventListener('cancel',e=>{e.preventDefault();if(game.confirm==='reset'){game.confirm='';showSettings();}else closeSettings();});
pauseDialog.addEventListener('change',e=>{
 const setting=e.target.dataset.setting;
 if(['sound','volume','voice'].includes(setting)){
  game.profile.settings[setting]=setting==='volume'?Number(e.target.value)/100:e.target.checked;
  if(setting==='voice'&&!e.target.checked)AudioFX.stop();save();
 }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.repeat&&game.screen!=='PAUSED'){e.preventDefault();openSettings();}});
render();
