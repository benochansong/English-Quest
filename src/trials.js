// Trial rooms use authored questions from the same dictionaries as story battles.
const Trials = (() => {
  const rooms = [
    {id:'words',name:'단어의 방',en:'Chamber of Words',focus:'단어와 뜻',guardian:'숲빛 수정지기',previous:null,
      description:'수정 속에 잠든 단어를 읽고 알맞은 뜻을 찾아 초록 봉인을 풀어 보세요.'},
    {id:'sentences',name:'문장의 방',en:'Chamber of Sentences',focus:'문장 배열과 빈칸',guardian:'서고의 파수꾼',previous:'words',
      description:'공중에 흩어진 문장 조각을 잇고, 빈칸에 꼭 맞는 말을 고르세요.'},
    {id:'echoes',name:'메아리의 방',en:'Chamber of Echoes',focus:'듣기와 대답',guardian:'잔향의 수호령',previous:'sentences',
      description:'수정에 남은 목소리를 듣고 뜻과 대답을 찾아보세요. 소리가 없으면 글로 도전할 수 있어요.'}
  ];
  const open=new WeakMap();
  function unlocked(p,id){
    const index=rooms.findIndex(r=>r.id===id);
    return index>=0 && p.started && rooms.slice(0,index).every(room=>p.rpg.dungeons[room.id].clears>0);
  }
  function echoed(activity){
    return {id:activity.id, type:'listening', phrase:activity.english, answer:activity.answer,
      choices:activity.choices, tags:activity.tags, instruction:activity.objective,
      explanation:activity.explanation, voiceActivity:activity, difficulty:activity.difficulty};
  }
  function deck(p,id,random){
    const questions=Q.filter(q=>(q.chapter!==2||p.chapterComplete)
      &&(q.chapter!==3||p.exploration?.observed.includes(q.id)));
    const familiar=q=>q.tags.some(t=>p.learning[t]?.seen);
    const last=p.rpg.dungeons[id].lastIds||[];
    const selected=[];
    const phrases=new Set();
    function select(pool){
      const candidates=Engine.shuffle(pool,random).filter(q=>!selected.some(s=>s.id===q.id));
      function priority(q){
        const key=q.type==='order'?q.answer:q.phrase;
        return (phrases.has(key)?-32:0) - (last.includes(q.id)?13:0) +
          (p.mistakes[q.id]||p.voice.records[q.id]?.wrong>p.voice.records[q.id]?.correct?5:0) +
          (familiar(q)?2:0) - Math.min(2,(q.difficulty||1)-1);
      }
      const next=candidates.sort((a,b)=>priority(b)-priority(a))[0];
      if(!next)throw Error('시련 문항 목록을 확인해 주세요.');
      selected.push(next);phrases.add(next.type==='order'?next.answer:next.phrase);
    }
    if(id==='words'){
      const pool=questions.filter(q=>q.type==='vocab');
      for(let i=0;i<5;i++)select(pool);
    }else if(id==='sentences'){
      for(const type of ['order','sentence','order','sentence','order']){
        select(questions.filter(q=>q.type===type && (type!=='sentence'||q.phrase.includes('___'))));
      }
    }else{
      const meaning=questions.filter(q=>q.type==='listening').concat(VoiceData.activities.filter(a=>a.kind==='listen'&&a.mode==='meaning').map(echoed));
      const response=VoiceData.activities.filter(a=>a.kind==='listen'&&a.mode==='respond').map(echoed);
      for(const pool of [meaning,response,meaning,response,meaning])select(pool);
    }
    // Reordering the first two of the same type is safe even in mixed rooms.
    if(selected[0].id===last.at(-1)){
      const swap=selected.findIndex((q,i)=>i>0&&q.type===selected[0].type);
      if(swap>0)[selected[0],selected[swap]]=[selected[swap],selected[0]];
    }
    return selected;
  }
  function prepare(run){
    const q=run.questions[run.index];
    run.question=q;
    run.choices=Engine.shuffle(q.choices,run.random);
    if(q.type==='order' && run.choices.join(' ')===q.choices.join(' '))run.choices.push(run.choices.shift());
    run.order=[];run.phase='question';run.feedback=null;
    run.aids=new Set();run.showTranscript=false;run.showHint=false;
  }
  function start(p,id,random=Math.random){
    if(!unlocked(p,id))return null;
    const run={id,random,questions:deck(p,id,random),index:0,seals:0,results:[],reward:null};
    open.set(p,run);prepare(run);return run;
  }
  function inPhase(p,run,phase){return !!run&&open.get(p)===run&&run.phase===phase;}
  function normal(value){return value.trim().replace(/\s+/g,' ').replace(/[.!?]$/,'').toLowerCase();}
  function answer(p,run,value){
    if(!inPhase(p,run,'question')||typeof value!=='string')return null;
    const q=run.question;
    if(q.type==='order'){
      const tokenBag=words=>words.map(normal).sort().join(' ');
      if(tokenBag(value.trim().split(/\s+/))!==tokenBag(q.choices))return null;
    }else if(!run.choices.includes(value))return null;
    const correct=normal(value)===normal(q.answer);
    let row=run.results[run.index];
    if(!row){row={id:q.id,firstCorrect:correct,attempts:0,assisted:false};run.results.push(row);}
    if(row.attempts>0)run.aids.add('correction');
    row.attempts++;row.assisted ||= run.aids.size>0;
    const options={assisted:run.aids.size>0,aids:[...run.aids]};
    if(q.voiceActivity){
      VoiceLearning.introduce(p,q.id);VoiceLearning.note(p,q.voiceActivity,correct,options);
    }else Engine.record(p,q,correct,options);
    run.feedback={correct};run.phase='feedback';
    if(correct){
      run.seals++;
      if(run.seals===5){
        const score=run.results.filter(r=>r.firstCorrect).length;
        run.reward=RPG.finishDungeon(p,run.id,score,run.questions.map(x=>x.id));
        run.phase='victory';
      }
    }
    return run.feedback;
  }
  function next(p,run){
    if(inPhase(p,run,'victory')){run.phase='results';open.delete(p);return true;}
    if(!inPhase(p,run,'feedback'))return false;
    if(run.feedback.correct)run.index++;
    prepare(run);return true;
  }
  function assist(p,run,reason){
    if(!inPhase(p,run,'question')||!['transcript','fallback','translation'].includes(reason))return false;
    run.aids.add(reason);
    if(reason==='translation')run.showHint=true;
    else run.showTranscript=true;
    return true;
  }
  function leave(p){open.delete(p);}
  return {rooms,unlocked,start,answer,next,assist,leave};
})();
