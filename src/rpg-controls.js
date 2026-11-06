function rpgHub(){
  if(game.profile.currentChapter===2)enterVillage();else change('MAP');
}
function offerClass(){
  const r=game.profile.rpg;
  if(!r.classId&&!r.promptSeen){
    r.promptSeen=true;game.classOrigin='arrival';game.classPreview='vanguard';save();change('CLASSES');
  }else rpgHub();
}
function rpgMessage(text){game.rpgMessage=text;save();render();}
function openGear(slot='weapon',itemId=''){
  const r=game.profile.rpg;
  game.gearSlot=slot;
  game.gearInspect=itemId||r.equipped[slot]||RPG.gear.find(g=>g.slot===slot).id;
  game.rpgMessage='';change('EQUIPMENT');
}
function setTrialAudioFallback(run,q,turn){
  if(game.screen!=='TRIAL_RUN'||game.trial!==run||run.question!==q||run.phase!=='question'||turn!==game.trialAudio)return;
  Trials.assist(game.profile,run,'fallback');refreshTrialQuestion();
}
function playTrial(rate=game.profile.settings.speechRate){
  const run=game.trial,q=run.question;
  if(q.type!=='listening'||run.phase!=='question')return;
  const turn=++game.trialAudio;
  const fallback=()=>setTrialAudioFallback(run,q,turn);
  if(!readAloud(q.phrase,fallback,rate))fallback();
}
function refreshTrialQuestion(){
  const panel=app.querySelector('.trial-console');
  if(panel&&game.trial.phase==='question')panel.innerHTML=trialAnswerView(game.trial);else render();
}
function startTrial(id){
  const run=Trials.start(game.profile,id);
  if(!run)return;
  game.trial=run;game.trialLeaving=false;game.trialAudio=0;game.trialSelection=id;
  change('TRIAL_RUN');playTrial();
}
function submitTrial(value){
  const p=game.profile,run=game.trial;
  if(run.question.type==='listening'&&!AudioFX.canSpeak(p.settings))Trials.assist(p,run,'fallback');
  const feedback=Trials.answer(p,run,value);
  if(!feedback)return;
  game.trialAudio++;AudioFX.stop();save();render();
  AudioFX.play(run.phase==='victory'?'victory':feedback.correct?'correct':'wrong',p.settings);
  app.querySelector('[data-act="trial-next"]')?.focus({preventScroll:true});
}
function trialAction(action,id){
  const p=game.profile,run=game.trial;
  if(!run)return false;
  if(action==='trial-leave'){game.trialLeaving=true;AudioFX.stop();render();return true;}
  if(game.trialLeaving){
    if(action==='trial-stay'){game.trialLeaving=false;render();}
    if(action==='trial-leave-confirm'){Trials.leave(p);game.trial=null;game.trialLeaving=false;change('TRIALS');}
    return true;
  }
  if(action==='trial-next'){
    if(Trials.next(p,run)){
      if(run.phase==='results')change('TRIAL_RESULTS');
      else{change('TRIAL_RUN');playTrial();}
    }
    return true;
  }
  if(run.phase!=='question')return true;
  const index=Number(id);
  if(action==='trial-choice'&&run.question.type!=='order'&&Number.isInteger(index))submitTrial(run.choices[index]);
  if(action==='trial-tile'&&run.question.type==='order'&&Number.isInteger(index)&&index>=0&&index<run.choices.length&&!run.order.includes(index)){
    run.order.push(index);refreshTrialQuestion();
    app.querySelector('[data-act="trial-tile"]:not(:disabled),[data-act="trial-submit"]:not(:disabled)')?.focus({preventScroll:true});
  }
  if(action==='trial-undo'&&run.question.type==='order'){run.order.pop();refreshTrialQuestion();}
  if(action==='trial-submit'&&run.question.type==='order'&&run.order.length===run.choices.length)submitTrial(run.order.map(i=>run.choices[i]).join(' '));
  if(action==='trial-transcript'){Trials.assist(p,run,'transcript');refreshTrialQuestion();}
  if(action==='trial-play')playTrial(id==='slow'?'slow':'normal');
  return true;
}
function rpgAction(action,id){
  const s=game.screen,p=game.profile,r=p.rpg;
  const sheets=['PROFILE','SKILLS','EQUIPMENT','TRIALS','TRIAL_RESULTS'];
  const hub=['MAP','VILLAGE',...sheets];
  if(action==='rpg-home'&&sheets.includes(s)){game.rpgMessage='';rpgHub();return true;}
  if(action==='profile'&&hub.includes(s)){game.rpgMessage='';change('PROFILE');return true;}
  if(action==='skills'&&hub.includes(s)){game.rpgMessage='';game.resetPending=false;change('SKILLS');return true;}
  if(action==='equipment'&&[...hub,'BAG','SHOP'].includes(s)){openGear();return true;}
  if(action==='trials'&&hub.includes(s)){game.trialSelection=game.trialSelection||'words';change('TRIALS');return true;}
  if(action==='class-open'&&s==='PROFILE'){game.classOrigin='profile';game.classPreview=r.classId||'vanguard';change('CLASSES');return true;}
  if(s==='CLASSES'){
    if(action==='class-preview'&&classInfo(id)){game.classPreview=id;render();focusControl(action,id);}
    if(action==='class-confirm'&&RPG.chooseClass(p,game.classPreview)){save();AudioFX.play('level',p.settings);if(game.classOrigin==='arrival')rpgHub();else change('PROFILE');}
    if(action==='class-later'){if(game.classOrigin==='arrival')rpgHub();else change('PROFILE');}
    return true;
  }
  if(s==='SKILLS'){
    if(action==='skill-node'&&!game.resetPending&&RPG.skills.some(t=>t.id===id)){game.skillInspect=id;game.rpgMessage='';render();focusControl(action,id);}
    if(action==='skill-learn'&&!game.resetPending){
      const skill=RPG.skills.find(t=>t.id===(game.skillInspect||RPG.skills[0].id));
      if(skill&&RPG.learn(p,skill.id)){AudioFX.play('level',p.settings);rpgMessage(skill.name+' 습득 · 남은 포인트 '+r.availablePoints+' SP');}
    }
    if(action==='skill-reset'&&r.spentPoints){game.resetPending=true;render();app.querySelector('[data-act="skill-reset-cancel"]')?.focus();}
    if(action==='skill-reset-cancel'){game.resetPending=false;render();}
    if(action==='skill-reset-confirm'&&game.resetPending){
      game.resetPending=false;
      if(RPG.resetSkills(p))rpgMessage('스킬 포인트를 돌려받았어요. 사용 가능 '+r.availablePoints+' SP');else render();
    }
    return true;
  }
  if(action==='gear-slot'&&['PROFILE','EQUIPMENT'].includes(s)&&Object.hasOwn(slotNames,id)){openGear(id);focusControl(action,id);return true;}
  if(s==='EQUIPMENT'){
    const selected=gearInfo(game.gearInspect);
    if(action==='gear-inspect'&&gearInfo(id)?.slot===game.gearSlot){game.gearInspect=id;game.rpgMessage='';render();focusControl(action,id);}
    if(action==='gear-equip'&&selected&&RPG.equip(p,selected.id,game.gearSlot))rpgMessage(selected.name+' 장착 완료');
    if(action==='gear-unequip'&&selected&&r.equipped[game.gearSlot]===selected.id&&RPG.unequip(p,game.gearSlot))rpgMessage(selected.name+' 장착 해제');
    if(action==='gear-market'&&p.currentChapter===2){game.location='market';game.shopGear=true;game.offer=null;game.purchaseNotice='';change('SHOP');}
    return true;
  }
  if(s==='SHOP'&&!game.offer&&['shop-gear','shop-supplies'].includes(action)){game.shopGear=action==='shop-gear';game.purchaseNotice='';render();return true;}
  if(s==='TRIALS'){
    if(action==='trial-select'&&trialRoom(id)){game.trialSelection=id;render();focusControl(action,id);}
    if(action==='trial-start')startTrial(game.trialSelection||'words');
    return true;
  }
  if(s==='TRIAL_RUN')return trialAction(action,id);
  if(s==='TRIAL_RESULTS'&&action==='trial-again'){startTrial(game.trial.id);return true;}
  return false;
}
