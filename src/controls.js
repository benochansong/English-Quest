// Keep modal inputs outside the scene so opening settings preserves the current question.
function showSettings(){
 const p=game.profile, cfg=p.settings;
 const confirmLabel=game.confirm==='reset'?'저장 기록을 지울까요?':'새 모험으로 교체할까요?';
 const actions=game.confirm?'<h2>'+confirmLabel+'</h2><p>현재 모험과 학습 기록이 초기화됩니다.</p><div class="actions">'+button('confirm','초기화하고 계속',{cl:'primary'})+button('cancel-confirm','취소')+'</div>':
 '<div class="eyebrow">'+(game.pausedFrom==='TITLE'?'MAIN MENU':'PAUSED')+'</div><h2>설정</h2><label class="setting">효과음<input type="checkbox" data-setting="sound" '+(cfg.sound?'checked':'')+'></label><label class="setting">효과음 크기<input type="range" data-setting="volume" value="'+Math.round(cfg.volume*100)+'" min="0" max="100"></label><label class="setting">영어 발음<input type="checkbox" data-setting="voice" '+(cfg.voice?'checked':'')+'></label><label class="setting">음성 크기<input type="range" data-setting="speechVolume" value="'+Math.round(cfg.speechVolume*100)+'" min="0" max="100"></label><label class="setting">발음 속도<select data-setting="speechRate"><option value="normal" '+(cfg.speechRate!=='slow'?'selected':'')+'>보통</option><option value="slow" '+(cfg.speechRate==='slow'?'selected':'')+'>천천히</option></select></label><div class="actions">'+button('close',game.pausedFrom==='TITLE'?'닫기':'계속하기',{cl:'primary'})+(game.pausedFrom!=='TITLE'?button('to-title','타이틀로'):'')+(p.started?button('reset','진행 초기화'):'')+'</div>';
 pauseDialog.innerHTML='<section class="modal">'+actions+'</section>';
 if(!pauseDialog.open)pauseDialog.showModal();
 if(game.confirm)pauseDialog.querySelector('[data-act="cancel-confirm"]').focus();
}
function openSettings(mode=''){
 if(game.screen==='ACADEMY_BACKUP'&&typeof academyCancelImport==='function')academyCancelImport(false);
 if(game.screen.startsWith('ACADEMY')&&typeof academySilence==='function')academySilence();
 if(['PLAYER_ACTION','ENEMY_ACTION','PAUSED'].includes(game.screen))return;
 if(game.voice)silenceVoice();
 if(typeof ExploreView!=='undefined')ExploreView.unmount();
 game.pausedFrom=game.screen;game.confirm=mode;AudioFX.stop();game.screen='PAUSED';showSettings();
}
function closeSettings(){
 game.confirm='';game.screen=game.pausedFrom;pauseDialog.close();
 if(game.screen==='ACADEMY_RUN'){
  const h=Academy.current(game.profile);
  if(h?.phase==='question'&&h.activity.skill==='listening'&&!AudioFX.canSpeak(game.profile.settings)){
   Academy.assist(game.profile,h,'fallback');AcademyUI.transcript=true;
  }
 }
 if(game.screen==='TRIAL_RUN'&&game.trial?.question.type==='listening'&&!AudioFX.canSpeak(game.profile.settings)){
  Trials.assist(game.profile,game.trial,'fallback');
 }
 if(!game.voice&&['QUESTION_ACTIVE','REVIEW'].includes(game.screen)&&game.task?.question.type==='listening'&&!AudioFX.canSpeak(game.profile.settings)){
  game.speechFallback=true;markQuestionAssist('fallback');
 }
 render();
 const focusButton=app.querySelector('[data-act="settings"]');
 if(focusButton)focusButton.focus({preventScroll:true});
 if(game.voice?.stage==='active'&&!game.voice.result&&isAural(game.voice.activity)&&!AudioFX.canSpeak(game.profile.settings))voiceFallback(game.voice);
}
function startNew(){
 const settings={...game.profile.settings};
 game.profile=Engine.fresh();game.profile.settings=settings;game.profile.started=true;
 game.page=0;game.mapSelection=0;game.battle=null;save();change('INTRO');
}
function startBattle(training=false){
 const b=training?Engine.training(game.profile):Engine.battle(game.profile,game.stage);if(!b)return;
 game.battle=b;game.task=null;game.effect='ready';game.amount='';game.displayHp=null;
 game.guarded=false;game.battleIntent='normal';
 game.battleMaxHp=Engine.stats(game.profile).maxHp;game.battleLevel=game.profile.level;
 game.achievementStart=[...game.profile.achievements];change('BATTLE_READY');
}
function listen(rate=game.profile.settings.speechRate){
 const q=game.task?.question;
 if(!q||q.type!=='listening')return;
 const fallback=()=>{if(['QUESTION_ACTIVE','REVIEW'].includes(game.screen)&&game.task?.question===q){game.speechFallback=true;markQuestionAssist('fallback');render();}};
 if(!readAloud(q.phrase,fallback,rate))fallback();
}
function selectAbility(ability){
 const task=Engine.select(game.profile,game.battle,ability);
 if(!task)return;
 game.ability=ability;game.task=task;game.speechFallback=false;game.order=[];game.questionAssists=[];game.showKo=false;
 if(task.voiceHandle){setupVoice(task.voiceHandle,'battle');return;}
 change('QUESTION_ACTIVE');
 if(task.question.type==='listening')listen();
}
function markQuestionAssist(aid){
 if(!game.questionAssists.includes(aid))game.questionAssists.push(aid);
}
function questionHelp(){
 const aids=game.questionAssists.slice();
 if(game.task?.question.type==='listening'&&!AudioFX.canSpeak(game.profile.settings)&&!aids.includes('fallback'))aids.push('fallback');
 return {assisted:aids.length>0,aids};
}
function submitAnswer(value){
 if(game.screen==='REVIEW'){
  const result=Engine.answerReview(game.profile,game.reviewSession,value,Date.now(),questionHelp());
  if(!result)return;
  game.reviewResult=result;AudioFX.stop();save();render();
  AudioFX.play(result.correct?'correct':'wrong',game.profile.settings);
  return;
 }
 const result=Engine.answer(game.profile,game.battle,value,questionHelp());
 if(!result)return;
 game.feedback=result;save();change('ANSWER_FEEDBACK');
 AudioFX.play(result.correct?'correct':'wrong',game.profile.settings);
}
function currentIntent(b){
 if(Engine.golemBreak(b))return 'break';
 return Engine.charging(b)?'charge':Engine.heavy(b)||Engine.diving(b)||Engine.pulsing(b)?'heavy':'normal';
}
// Commit the engine result first. Only the presentation waits for the weapon to make contact.
function animateAction(screen, effect, before, amount, message, impactSound, done){
 const fast=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const impactTime=fast?12:({sword:360,fire:580,enemy:370,heavy:370,heal:280,voice:480,burst:480,echo:280}[effect]||240);
 const endTime=fast?75:effect==='fire'?1050:900;
 game.displayHp=before;game.effect=effect;game.amount='';game.message=message;
 change(screen);
 game.timer=setTimeout(()=>{
  game.displayHp=null;game.amount=amount;
  if(impactSound)AudioFX.play(impactSound,game.profile.settings);
  updateBattle(app.querySelector('.battle'));
  game.timer=setTimeout(()=>{game.amount='';done();},endTime-impactTime);
 },impactTime);
}
function resolveTurn(){
 const b=game.battle,p=game.profile;
 const before=[b.hp,b.enemyHp];
 const result=Engine.playerAction(p,b);
 if(!result)return;
 const effect=b.correct?b.ability:'miss';
 const amount=result.damage?'−'+result.damage:effect==='heal'?'+'+result.healing:'';
 game.guarded=result.guard;
 let message='말의 빛이 흩어집니다.';
 if(result.damage)message=abilityInfo[b.ability][0]+'이 적중했습니다!'+(result.counterBonus?' 방패 반격 보너스 발동.':'');
 if(result.guard)message=effect==='echo'?'메아리 방패를 펼쳤습니다. 다음 반격 피해가 줄어듭니다.':'수호 방패를 펼쳤습니다.';
 if(effect==='heal')message='치유의 빛이 체력을 '+result.healing+' 회복합니다.';
 if(result.won)game.reward=Engine.reward(p,b);
 save();
 AudioFX.play(b.correct?b.ability:'wrong',p.settings);
 animateAction('PLAYER_ACTION',effect,before,amount,message,result.damage?'impact':null,()=>{
  if(result.won){
   game.effect='win';change('VICTORY');AudioFX.play(b.stage===3||b.stage===6?'bossWin':'victory',p.settings);return;
  }
  resolveEnemyTurn(b,p);
 });
}
function resolveEnemyTurn(b,p){
 const enemyBefore=[b.hp,b.enemyHp];
 const hit=Engine.enemyAction(p,b);
 if(!hit)return;
 let nextEffect=hit.charging?'charge':hit.heavy||hit.dive||hit.pulse?'heavy':'enemy';
 if(hit.interrupted)nextEffect='interrupt';
 let message=Engine.enemies[b.stage-1].name+'의 반격 · 피해 '+hit.damage;
 if(hit.interrupted)message='문장을 복원했습니다. 골렘의 룬이 꺼져 공격이 중단됐어요.';
 else if(hit.charging)message='왕이 마력을 모읍니다. 다음 턴 강타에 대비하세요!';
 else if(hit.guarded)message='방패로 피해 '+hit.prevented+' 감소 · 받은 피해 '+hit.damage+(hit.counterReady?' · 반격 준비 완료':'');
 else if(hit.heavy||hit.dive||hit.pulse)message=(hit.dive?'그림자 급강하':hit.pulse?'메아리 파동':'왕관 강타')+' · 피해 '+hit.damage;
 if(hit.lost)save();
 if(hit.charging)AudioFX.play('charge',p.settings);
 const cue=hit.interrupted?'runeBreak':hit.guarded?'shieldHit':b.stage>=4?['crow','wisp','golem'][b.stage-4]:hit.heavy?'heavy':'enemy';
 animateAction('ENEMY_ACTION',nextEffect,enemyBefore,hit.damage?'−'+hit.damage:'',message,hit.charging?null:cue,()=>{
   game.effect=hit.lost?'lose':'';game.guarded=false;game.battleIntent=currentIntent(b);
   if(hit.lost)AudioFX.play('defeat',p.settings);
   change(hit.lost?'DEFEAT':'PLAYER_SELECT');
 });
}
function readAloud(text,onError,rate=game.profile.settings.speechRate){
 const matches=[...app.querySelectorAll('[lang="en"],.spoken-word')].filter(el=>el.textContent.trim()===text);
 if(!matches.length){
   const player=app.querySelector('[data-act="replay"]');
   if(player)matches.push(player);
 }
 return AudioFX.speak(text,game.profile.settings,onError,{
   rate,onStart:()=>matches.forEach(el=>el.classList.add('speaking')),
   onEnd:()=>matches.forEach(el=>el.classList.remove('speaking'))
 });
}
function openReview(){
 game.dailyLegacy=false;game.reviewFrom=game.screen;game.reviewSession=null;game.reviewResult=null;change('REVIEW');
}
function openReviewQuestion(id){
 const session=Engine.startReview(game.profile,id);
 if(!session)return;
 game.reviewSession=session;game.reviewResult=null;game.task=session;game.order=[];game.speechFallback=false;game.showKo=false;game.questionAssists=[];
 change('REVIEW');
 if(session.question.type==='listening')listen();
}
function focusControl(action,id){
 const match=Array.from(app.querySelectorAll('button[data-act]')).find(b=>b.dataset.act===action&&b.dataset.id===id);
 match?.focus({preventScroll:true});
}
function handleQuestionControl(action,id){
 const index=Number(id), task=game.task;
 if(!task)return;
 const choices=task.choices;
 if(action==='choice'&&task.question.type!=='order'&&Object.hasOwn(choices,index))submitAnswer(choices[index]);
 if(action==='word'&&task.question.type==='order'&&Object.hasOwn(choices,index)&&!game.order.includes(index)){
  game.order.push(index);render();app.querySelector('[data-act="word"]:not(:disabled),[data-act="submit-order"]:not(:disabled)')?.focus({preventScroll:true});
 }
 if(action==='undo'){game.order.pop();render();app.querySelector('[data-act="word"]:not(:disabled)')?.focus({preventScroll:true});}
 if(action==='submit-order'&&task.question.type==='order'&&game.order.length===choices.length)submitAnswer(game.order.map(i=>choices[i]).join(' '));
 if(action==='replay')listen(id==='slow'?'slow':'normal');
 if(action==='legacy-ko'){game.showKo=true;markQuestionAssist('translation');render();focusControl(action,id);}
 if(action==='transcript'){game.speechFallback=true;markQuestionAssist('transcript');render();focusControl(action,id);}
}
function dispatch(action,id){
 const p=game.profile;
 // Detached controls cannot reach this function. Validate each transition as well.
 if(action==='speak'){readAloud(id);return;}
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
 if(typeof academyAction==='function'&&academyAction(action,id))return;
 if(typeof exploreAction==='function'&&exploreAction(action,id))return;
 if(rpgAction(action,id))return;
 if(voiceAction(action,id))return;
 if(villageAction(action,id))return;
 if(action==='map'&&['BOOK','DEFEAT','CHAPTER_COMPLETE','LEARNING','DASHBOARD'].includes(game.screen)){game.battle=null;change('MAP');return;}
 if(action==='book'&&['MAP','CHAPTER_COMPLETE'].includes(game.screen)){change('BOOK');return;}
 if(action==='review'&&['MAP','DEFEAT','BOOK','CHAPTER_COMPLETE','DASHBOARD'].includes(game.screen)){openReview();return;}
 switch(game.screen){
 case 'TITLE':
  if(action==='new'){if(p.started)openSettings('new');else startNew();}
  if(action==='continue'&&p.started)offerClass();
  break;
 case 'INTRO':
  if(action==='intro-skip'||(action==='intro-next'&&game.page===2))offerClass();
  else if(action==='intro-next'){game.page++;render();}
  break;
 case 'MAP':
  if(action==='dashboard')change('DASHBOARD');
  if(action==='map-pin'&&[1,2,3].includes(+id)){game.mapSelection=+id;render();focusControl(action,id);}
  if(action==='stage'&&Number.isInteger(+id)&&+id>=1&&+id<=p.unlocked){game.stage=+id;game.page=0;game.flipped.clear();change('LEARNING');}
  if(action==='ending'&&p.chapterComplete)change('CHAPTER_COMPLETE');
  break;
 case 'LEARNING':{
  const cards=stageCards[game.stage-1];
  if(['lesson-flip','lesson-mark'].includes(action)&&cards.slice(game.page*2,game.page*2+2).some(c=>c.id===id)){
   if(action==='lesson-mark'){Engine.mark(p,id);save();}
   else if(game.flipped.has(id))game.flipped.delete(id);
   else{game.flipped.add(id);Engine.teach(p,[id]);save();}
   render();focusControl(action,id);
  }
  if(action==='lesson-prev'&&game.page>0){game.page--;render();}
  if(action==='lesson-next'){
   Engine.teach(p,cards.slice(game.page*2,game.page*2+2).map(item=>item.id));save();
   if((game.page+1)*2>=cards.length)startBattle();else{game.page++;render();}
  }break;}
 case 'BATTLE_READY':if(action==='fight'){game.effect='';change('PLAYER_SELECT');}break;
 case 'PLAYER_SELECT':if(action==='ability')selectAbility(id);break;
 case 'QUESTION_ACTIVE':handleQuestionControl(action,id);break;
 case 'ANSWER_FEEDBACK':if(action==='resolve')resolveTurn();break;
 case 'VICTORY':if(action==='rewards'){change('REWARD');if(game.reward.levelUp)AudioFX.play('level',p.settings);}break;
 case 'REWARD':if(action==='onwards'){game.mapSelection=0;game.battle=null;change(game.stage===3?'CHAPTER_COMPLETE':'MAP');}break;
 case 'DEFEAT':if(action==='retry')startBattle(!!game.battle.training);break;
 case 'REVIEW':
  if(action==='review-one'&&!game.reviewSession)openReviewQuestion(id);
  else if(action==='review-list'){AudioFX.stop();game.reviewSession=null;game.reviewResult=null;render();}
  else if(action==='review-back'){game.reviewSession=null;change(game.reviewFrom);}
  else if(game.reviewSession&&!game.reviewResult)handleQuestionControl(action,id);
  break;
 }
}
function handleClick(event){
 const el=event.target.closest('button[data-act]');
 if(!el||!el.isConnected||el.disabled||(event.detail>1&&!['word','trial-tile','explore-word','academy-word'].includes(el.dataset.act)))return;
 if(game.screen==='PAUSED'&&!pauseDialog.contains(el))return;
 AudioFX.play('ui',game.profile.settings);dispatch(el.dataset.act,el.dataset.id);
}
app.tabIndex=-1;app.addEventListener('click',handleClick);pauseDialog.addEventListener('click',handleClick);
pauseDialog.setAttribute('aria-label','게임 설정');
pauseDialog.addEventListener('cancel',e=>{e.preventDefault();if(game.confirm==='reset'){game.confirm='';showSettings();}else closeSettings();});
pauseDialog.addEventListener('change',e=>{
 const setting=e.target.dataset.setting;
 if(setting==='speechVolume'){game.profile.settings.speechVolume=Math.max(0,Math.min(1,Number(e.target.value)/100));AudioFX.stop();save();}
 if(setting==='speechRate'){game.profile.settings.speechRate=e.target.value==='slow'?'slow':'normal';AudioFX.stop();save();}
 if(['sound','volume','voice'].includes(setting)){
  game.profile.settings[setting]=setting==='volume'?Number(e.target.value)/100:e.target.checked;
  if(setting==='voice'&&!e.target.checked)AudioFX.stop();save();
 }
});
document.addEventListener('keydown',e=>{if(e.defaultPrevented)return;if(e.key==='Escape'&&!e.repeat&&game.screen!=='PAUSED'){e.preventDefault();openSettings();}});
render();
