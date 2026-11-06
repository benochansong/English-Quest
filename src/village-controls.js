function villageIntent(b){
  if(Engine.golemBreak(b))return '룬 발동 · 문장 복원';
  if(Engine.diving(b))return '날개를 접습니다 · 급강하 예고';
  if(Engine.pulsing(b))return '메아리 파동 예고';
  if(b.stage===6&&b.turn%3===2)return '다음 턴 · 부서진 문장';
  return '일반 반격';
}
function villageTactic(b){
  if(b.training)return '검격으로 틀렸던 표현을 다시 풀어 보세요. 세 번 정도 적중하면 연습이 끝납니다.';
  if(Engine.golemBreak(b))return '부서진 문장! 기술을 고르고 단어를 이으면 골렘의 공격을 끊습니다.';
  if(Engine.diving(b))return '까마귀가 높이 솟았습니다. 이번 급강하는 방패로 피해를 줄일 수 있어요.';
  if(Engine.pulsing(b))return '메아리 파동이 다가옵니다. 검격을 고르면 듣기 문제에 도전합니다.';
  return ({4:'시장에서 배운 말을 떠올리세요. 까마귀는 세 번째 턴마다 급강하합니다.',5:'여관의 표현이 메아리칩니다. 정령은 두 번째 턴마다 파동을 보냅니다.',6:'세 번째 턴마다 골렘이 문장을 흩뜨립니다. 단어를 이어 룬을 잠재우세요.'})[b.stage];
}
function villageAbilityTask(b,id){
  if(b.training)return '오답 복습';
  if(Engine.golemBreak(b))return '부서진 문장 배열';
  if(id==='sword'&&(Engine.pulsing(b)||b.stage===6&&b.turn%3===2))return '듣고 이해하기';
  return {sword:'회화 표현의 뜻',fire:'문장 완성',guard:'회화 표현의 뜻',heal:'단어 배열'}[id];
}
function enterVillage(location='square'){
  game.location=location;game.battle=null;game.offer=null;game.purchaseNotice='';
  game.dialogue=null;game.dialogueResult=null;
  change(location==='square'?'VILLAGE':'LOCATION');
}
function showTalk(stage){
  const session=VillageEngine.dialogue(game.profile,stage);
  if(!session)return;
  game.dialogue=session;game.dialogueResult=null;change('DIALOGUE');
}
function useVillageItem(id){
  const b=game.battle,p=game.profile,before=[b.hp,b.enemyHp];
  const used=Engine.useItem(p,b,id);
  if(!used)return;
  save();game.guarded=false;
  const potion=id==='potion';
  AudioFX.play(potion?'heal':'guard',p.settings);
  animateAction('PLAYER_ACTION',potion?'heal':'guard',before,potion?'+'+used.healing:'',
    potion?'물약으로 체력을 '+used.healing+' 회복했습니다.':'부적이 빛납니다. 이번 전투에서 받는 피해가 3 줄어듭니다.',
    null,()=>resolveEnemyTurn(b,p));
}
// Returns true when this chapter handles the action. Restrict actions to their live scene.
function villageAction(action,id){
  const p=game.profile,s=game.screen;
  if(action==='chapters'&&['MAP','CHAPTER_COMPLETE','VILLAGE','VILLAGE_END'].includes(s)){change('CHAPTERS');return true;}
  if(s==='CHAPTERS'&&action==='chapter'){
    if(VillageEngine.selectChapter(p,Number(id))){save();if(+id===2)enterVillage();else change('MAP');}
    return true;
  }
  if(s==='PLAYER_SELECT'&&action==='item-use'){useVillageItem(id);return true;}
  if(s==='ANSWER_FEEDBACK'&&action==='broken-retry'){
    const task=Engine.retryBroken(p,game.battle);
    if(task){game.task=task;game.order=[];game.feedback=null;change('QUESTION_ACTIVE');}
    return true;
  }
  if(p.currentChapter!==2)return false;
  if(action==='map'&&['BOOK','DASHBOARD','DEFEAT'].includes(s)){enterVillage();return true;}
  if(action==='village-home'&&['QUESTS','LOCATION','SHOP','BAG','DIALOGUE','VILLAGE_END'].includes(s)){enterVillage();return true;}
  if(action==='quests'&&['VILLAGE','LOCATION'].includes(s)){change('QUESTS');return true;}
  if(action==='inventory'&&['VILLAGE','LOCATION'].includes(s)){game.purchaseNotice='';change('BAG');return true;}
  if(action==='destination'&&['VILLAGE','QUESTS','LOCATION'].includes(s)){
    const place=villagePlaces[id];if(place?.stage&&questStatus(place.stage)!=='locked')enterVillage(id);
    return true;
  }
  if(s==='VILLAGE'){
    if(action==='dashboard'){change('DASHBOARD');return true;}
    if(action==='book'){change('BOOK');return true;}
    if(action==='review'){openReview();return true;}
    if(action==='ending-village'&&p.village.progress[6].completed){change('VILLAGE_END');return true;}
    if(action==='train'){game.stage=4;startBattle(true);return true;}
  }
  if(s==='LOCATION'){
    const stage=villagePlaces[game.location].stage;
    if(action==='accept-quest'&&+id===stage&&VillageEngine.accept(p,stage)){save();change('LOCATION');return true;}
    if(action==='talk'&&+id===stage){showTalk(stage);return true;}
    if(action==='village-fight'&&+id===stage){game.stage=stage;startBattle();return true;}
    if(action==='shop'&&game.location==='market'){game.shopGear=false;game.offer=null;game.purchaseNotice='';change('SHOP');return true;}
  }
  if(s==='VILLAGE_END'&&action==='talk'&&id==='scenario'){showTalk('scenario');return true;}
  if(s==='DIALOGUE'){
    const session=game.dialogue;
    if(action==='reply'&&!game.dialogueResult&&session){
      const result=VillageEngine.reply(p,session,session.choices[Number(id)]);
      if(result){game.dialogueResult=result;save();change('DIALOGUE');AudioFX.play(result.correct?'correct':'wrong',p.settings);}
      return true;
    }
    if(action==='dialogue-next'&&game.dialogueResult){
      if(game.dialogueResult.done){if(session.stage==='scenario')change('VILLAGE_END');else enterVillage(villageQuest(session.stage).location);}
      else showTalk(session.stage);
      return true;
    }
  }
  if(s==='SHOP'){
    if(action==='shop-back'){enterVillage('market');return true;}
    if(action==='purchase'&&!game.offer){
      game.offer=VillageEngine.offer(p,id);game.purchaseNotice='';
      if(game.offer)change('SHOP');return true;
    }
    if(action==='buy-cancel'){game.offer=null;change('SHOP');return true;}
    if(action==='buy-confirm'&&game.offer){
      const offer=game.offer;game.offer=null;
      const purchased=VillageEngine.buy(p,offer);
      game.purchaseNotice=purchased?VillageEngine.items.find(i=>i.id===offer.id).name+' 구매 완료.':'가격이나 보유량이 달라졌어요. 다시 확인해 주세요.';
      if(purchased)save();
      change('SHOP');return true;
    }
  }
  if(s==='REWARD'&&action==='onwards'&&game.stage>=4){
    if(game.battle.training){enterVillage();return true;}
    if(game.stage===6){game.battle=null;change('VILLAGE_END');return true;}
    enterVillage(villageQuest(game.stage).location);return true;
  }
  return false;
}
