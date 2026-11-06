const trialRoom=id=>Trials.rooms.find(r=>r.id===id);
function trialList(){
  const p=game.profile,selected=trialRoom(game.trialSelection)||Trials.rooms[0];
  const doors=Trials.rooms.map(room=>{
    const status=p.rpg.dungeons[room.id],open=Trials.unlocked(p,room.id);
    return button('trial-select','<span class="door-image">'+RpgArt.room(room.id)+'<span class="door-watcher">'+RpgArt.guardian(room.id)+'</span></span>'+
      '<span class="door-caption"><small>'+room.en+'</small><strong>'+room.name+'</strong><span>'+icon(!open?'lock':status.clears?'check':'crystal')+' '+
      (open?status.clears?'완료 '+status.clears+'회 · 최고 '+status.best+' / 5':room.focus:trialRoom(room.previous).name+' 완료 후 개방')+'</span></span>',
      {id:room.id,cl:'trial-door room-'+room.id,pressed:room.id===selected.id});
  }).join('');
  const reward=RPG.dungeonPrizes[selected.id],cleared=p.rpg.dungeons[selected.id].clears>0;
  return rpgNav('trials')+heading('TRIALS OF THE WORD CRYSTAL','언어 수정의 시련','다섯 표현으로 수호자의 봉인을 풀어 보세요. 틀린 말은 해설을 읽고 다시 시도할 수 있어요.')+
    '<div class="trial-doors">'+doors+'</div><section class="panel trial-brief"><div><span class="eyebrow">'+selected.en.toUpperCase()+'</span><h3>'+selected.name+'</h3>'+
    '<p>'+selected.description+'</p><small>다섯 문제 · 시간 제한 없음 · 첫 답변 기준으로 기록</small></div><div><b>'+ (cleared?'첫 완료 보상 수령함':'첫 완료 보상')+'</b><p>'+
    gearInfo(reward.gearId).name+' · 금화 '+reward.gold+'</p>'+button('trial-start',!Trials.unlocked(p,selected.id)?'앞 시련 완료 필요':cleared?'다시 도전':'시련 입장',{cl:'primary',disabled:!Trials.unlocked(p,selected.id)})+'</div></section>'+
    helpNote('시련 안내','틀려도 체력은 줄지 않아요. 정답을 찾아야 봉인이 풀리며, 다섯 봉인을 모두 풀면 다음 방이 열려요. 전투력과 장비는 정답을 대신하지 않아요. 완료 전 떠나면 봉인은 처음부터, 답한 학습 기록은 그대로입니다.');
}
function trialArena(run){
  const room=trialRoom(run.id),fx=run.phase==='victory'?'win':run.feedback?.correct?'hit':'';
  return '<div class="trial-arena room-'+run.id+'" data-fx="'+fx+'">'+RpgArt.room(run.id)+'<div class="trial-vignette"></div>'+
    '<div class="trial-fighter">'+RpgArt.hero(game.profile.rpg.classId)+'</div><div class="trial-guardian">'+RpgArt.guardian(run.id)+'</div>'+
    '<div class="trial-scene-label"><span>'+room.en+'</span><h2>'+room.name+'</h2></div>'+
    '<div class="seal-strip" aria-label="해제한 봉인 '+run.seals+'개"><b>'+room.guardian+'</b><span>'+Array.from({length:5},(_,i)=>'<i class="'+(i<run.seals?'released':'')+'"></i>').join('')+'</span><small>봉인 해제 '+run.seals+' / 5</small></div></div>';
}
function trialAnswerView(run){
  const q=run.question,isOrder=q.type==='order',voice=q.type==='listening';
  const play=AudioFX.canSpeak(game.profile.settings);
  let context='';
  if(voice){
    context='<div class="actions">'+button('trial-play',icon('sound')+' 다시 듣기',{id:'normal',disabled:!play})+
      button('trial-play','천천히 듣기',{id:'slow',disabled:!play})+button('trial-transcript','원문 보기',{pressed:run.showTranscript})+'</div>'+
      (run.showTranscript||!play?'<p class="trial-cue">'+(play?'원문':'글로 푸는 듣기')+' · <span lang="en">'+safe(q.phrase)+'</span></p>':'');
  }else if(q.type==='sentence'&&q.instruction.includes('___')&&q.chapter!==2){
    context='<p>'+safe(koreanExamples[q.tags[0]])+'</p>';
  }
  const controls=isOrder?'<div class="answer-line" aria-live="polite">'+(run.order.length?run.order.map(i=>safe(run.choices[i])).join(' '):'단어를 눌러 문장을 만드세요.')+
    '</div><div class="words">'+run.choices.map((v,i)=>button('trial-tile',safe(v),{id:i,cl:'word',disabled:run.order.includes(i)})).join('')+
    '</div><div class="actions">'+button('trial-submit','문장 확인',{cl:'primary',disabled:run.order.length!==run.choices.length})+
    button('trial-undo','한 단어 되돌리기',{disabled:!run.order.length})+'</div>':
    '<div class="choices">'+run.choices.map((v,i)=>button('trial-choice','<span class="choice-index">'+String.fromCharCode(65+i)+'</span>'+safe(v),{id:i,cl:'choice'})).join('')+'</div>';
  return '<span class="eyebrow">'+(run.index+1)+' / 5 · '+trialRoom(run.id).focus+'</span><h3>'+safe(q.instruction)+'</h3>'+context+controls;
}
function trialView(){
  const run=game.trial,q=run.question;
  const feedback=run.phase==='question'?trialAnswerView(run):
    '<div class="trial-feedback" aria-live="polite"><b>'+(run.feedback.correct?run.phase==='victory'?'마지막 봉인이 풀렸어요!':'수정 봉인을 하나 풀었어요.':'다시 이어 볼까요?')+
    '</b><h3>'+safe(q.type==='listening'?q.phrase:expression(q))+'</h3><p>정답 · '+safe(q.answer)+'</p><p>'+safe(q.explanation)+'</p>'+speakButton(q.type==='listening'?q.phrase:expression(q))+
    '<div class="actions">'+button('trial-next',run.phase==='victory'?'시련 결과 보기':run.feedback.correct?'다음 봉인':'같은 표현 다시 풀기',{cl:'primary'})+'</div></div>';
  return '<section class="trial-play">'+trialArena(run)+'<div class="panel trial-console">'+feedback+'</div>'+
    '<div class="actions">'+button('trial-leave','시련에서 나가기')+'</div>'+
    (game.trialLeaving?'<div class="panel respec-confirm"><p>시련에서 나갈까요? 지금까지 답한 학습 기록은 남습니다.</p>'+button('trial-stay','계속 도전')+' '+button('trial-leave-confirm','나가기 확정')+'</div>':'')+'</section>';
}
function trialResults(){
  const run=game.trial,room=trialRoom(run.id),score=run.results.filter(r=>r.firstCorrect).length;
  return '<section class="panel trial-results"><div class="eyebrow">TRIAL COMPLETE</div><h2>'+room.name+' · 다섯 봉인 해제</h2>'+
    '<div class="trial-tally"><b>첫 시도 정답 '+score+' / 5</b><span>다시 익힌 표현 '+(5-score)+'개</span></div>'+
    (run.reward?.first?lootReveal(run.reward.gearId)+'<p class="purse">첫 완료 · 금화 +'+run.reward.gold+'</p>':'<p>연습 기록이 갱신되었습니다. 첫 완료 보상은 이미 받았어요.</p>')+
    '<ol class="trial-recap">'+run.results.map((r,i)=>{
      const q=run.questions[i];
      return '<li><div><small>'+(r.firstCorrect?'첫 답 정답':'복습할 표현')+(r.assisted?' · 도움 사용':'')+'</small><strong>'+safe(expression(q))+
        '</strong><span>정답 · '+safe(q.answer)+'</span><p>'+safe(q.explanation)+'</p></div>'+speakButton(expression(q))+'</li>';
    }).join('')+'</ol><div class="actions">'+button('trials','시련 목록',{cl:'primary'})+button('trial-again','같은 방 다시 도전')+
    button('equipment','획득 장비 보기')+button('rpg-home','지도로')+'</div></section>';
}
