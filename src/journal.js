// Notebook, practice and learning statistics share the same authored expressions as combat.
const usageNotes = {
  hello: '상대를 만났을 때 건네는 인사예요.', thanks: '도움을 받았을 때 써 보세요.',
  apple: '여러 개의 사과를 말할 때는 apples라고 해요.', water: '물 한 잔은 a glass of water라고 해요.',
  bread: '빵 한 조각은 a slice of bread라고 해요.', book: '책 한 권은 a book이라고 해요.',
  sword: 'sword의 w는 소리 내지 않아요.', forest: '숲 안에 있다는 말은 in the forest예요.',
  iam: 'I 뒤에는 am을 써요. 줄여서 I’m이라고도 해요.', ihave: 'have 뒤에 가지고 있는 것을 놓아요.',
  ilike: '좋아하는 것을 like 뒤에 놓아요.', iwant: '원하는 것을 want 뒤에 놓아요.',
  ieat: 'eat 뒤에 먹는 음식을 놓아요.', idrink: 'drink 뒤에 마시는 것을 놓아요.'
};
function lessonCard(lesson) {
  const {id,en,ko,example}=lesson;
  const revealed=game.flipped.has(id);
  const marked=game.profile.marked.includes(id);
  const face=revealed
    ? '<p class="translation">'+ko+'</p><p class="card-note">'+usageNotes[id]+'</p><blockquote><span lang="en">'+example+'</span><small>'+koreanExamples[id]+'</small></blockquote>'
    : '<p class="recall-hint">뜻을 먼저 떠올려 보세요.</p><blockquote lang="en">'+example+'</blockquote>';
  return '<article class="rune-card '+(revealed?'revealed':'')+'"><div class="rune-header">'+
    icon('leaf')+'<span>'+labels[Engine.status(game.profile.learning[id])]+'</span></div>'+
    '<h3 lang="en">'+en+'</h3><div class="card-face">'+face+'</div><div class="card-actions">'+
    button('lesson-flip',revealed?'앞면 보기':'뜻·해설 보기',{id,cl:'flip',pressed:revealed})+
    (speakButton(en)||button('speak',icon('sound')+(game.profile.settings.voice?' 음성 미지원':' 발음 꺼짐'),{cl:'speak',disabled:true,aria:'영어 음성 사용 불가'}))+button('lesson-mark',marked?'복습 표시 해제':'복습 표시',{id,pressed:marked,cl:'flag'+(marked?' marked':''),aria:en+' '+(marked?'복습 표시 해제':'복습 표시')})+'</div></article>';
}
function lessonView() {
  const cards=stageCards[game.stage-1], first=game.page*2;
  const last=first+2>=cards.length;
  return '<section class="notebook"><header class="notebook-heading"><div class="eyebrow">ROWAN’S FIELD NOTES</div>'+
    '<h2>로완의 마법 수첩</h2><p>'+zones[game.stage-1]+' · 전투에 쓰는 표현</p></header>'+
    '<div class="paper-spread">'+cards.slice(first,first+2).map(lessonCard).join('')+'</div>'+
    '<div class="notebook-footer"><div>'+button('lesson-prev','이전 쪽',{disabled:!game.page})+
    ' <span class="page-count">'+(game.page+1)+' / '+Math.ceil(cards.length/2)+'쪽</span></div><div>'+
    button('map','지도')+' '+button('lesson-next',last?'전투 준비':'다음 쪽',{cl:'primary'})+'</div></div></section>';
}
function reviewDate(timestamp) {
  return new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric'}).format(new Date(timestamp));
}
function reviewView() {
  const session=game.reviewSession;
  const header=heading('FIELD JOURNAL  /  PRACTICE','표현 복습');
  if(session) {
    const result=game.reviewResult;
    const content=result
      ? feedbackView(session.question,result.correct)+'<p>'+(result.correct?'다음 복습 · '+reviewDate(result.dueAt):'지금 다시 연습할 수 있어요.')+'</p>'+button('review-list','목록으로',{cl:'primary'})
      : questionView('복습 문제');
    return header+'<section class="panel battle-panel practice-panel" aria-live="polite">'+content+'</section><div class="actions">'+button('review-back','돌아가기')+'</div>';
  }
  const entries=Engine.reviewList(game.profile);
  const groups=[['지금 복습',entries.filter(e=>e.due)],['다음 복습',entries.filter(e=>!e.due)]];
  const list=groups.filter(([,rows])=>rows.length).map(([name,rows])=>
    '<section class="review-group"><h3>'+name+' <small>'+rows.length+'</small></h3><div class="panel book">'+rows.map(({question,due,dueAt,misses,marked})=>{
      const tags=question.tags.map(id=>lessons.find(l=>l.id===id)?.en).filter(Boolean).join(' · ');
      return '<div class="practice-row"><div><span class="eyebrow">'+safe(tags)+'</span><strong>'+safe(question.instruction)+'</strong>'+
        '<small>'+(misses?'오답 '+misses+'회':'수첩에 표시한 표현')+(marked?' · 복습 표시':'')+(due?'':' · '+reviewDate(dueAt))+'</small></div>'+
        button('review-one','풀어보기',{id:question.id})+'</div>';
    }).join('')+'</div></section>').join('');
  return header+'<p class="journal-intro">틀린 문제와 수첩에 표시한 표현을 연습하세요. 정답을 기억하면 다음 복습까지의 간격이 늘어납니다.</p>'+
    (list||'<div class="panel empty-journal">'+icon('book')+'<p>아직 복습할 표현이 없어요. 수첩에서 표현에 복습 표시를 해 보세요.</p></div>')+
    '<div class="actions">'+button('review-back','돌아가기')+'</div>';
}
function dashboardView() {
  const p=game.profile, d=Engine.dashboard(p);
  const recent=d.recentChange===null?'최근 10회 응답 후 표시':d.recentChange===0?'변화 없음':(d.recentChange>0?'+':'')+d.recentChange+'%p';
  const cards=[['만난 표현',d.encountered+' / '+d.total],['누적 정답률',d.accuracy===null?'아직 기록 없음':d.accuracy+'%'],
    ['복습할 표현',d.reviewNeeded+'개'],['익숙한 표현',d.familiar+'개']];
  return heading('FIELD JOURNAL  /  PROGRESS','학습 기록','이 모험에서 읽고 답한 기록입니다. 실제 영어 실력을 평가하는 점수와는 다릅니다.')+
    '<div class="metric-grid">'+cards.map(([label,value])=>'<div class="panel metric"><small>'+label+'</small><strong>'+value+'</strong></div>').join('')+'</div>'+
    '<div class="trend panel"><div><b>최근 정답률 변화</b><small>최근 5회와 직전 5회 비교</small></div><strong>'+recent+'</strong></div>'+
    '<div class="trend panel"><div><b>속삭이는 숲</b><small>챕터 진행</small></div><strong>'+d.completedStages+' / 3</strong></div>'+
    (p.chapterComplete?'<div class="trend panel"><div><b>목소리를 되찾은 마을</b><small>완료한 의뢰</small></div><strong>'+VillageData.quests.filter(q=>p.village.progress[q.stage].completed).length+' / 3</strong></div>':'')+
    '<h3 class="ledger-heading">모험 업적 <small>'+p.achievements.length+' / '+Engine.achievements.length+'</small></h3>'+
    '<div class="achievement-list">'+Engine.achievements.map(a=>{
      const earned=p.achievements.includes(a.id);
      return '<div class="achievement '+(earned?'earned':'')+'">'+icon(earned?'star':'lock')+'<div><strong>'+safe(a.name)+'</strong><small>'+safe(a.description)+'</small></div><span>'+(earned?'획득':'미획득')+'</span></div>';
    }).join('')+'</div><div class="actions">'+button('map','지도',{cl:'primary'})+button('review','표현 복습')+'</div>';
}
