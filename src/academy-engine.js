// Curriculum learning is independent from character levels and chapter flags.
// Answers, interaction locks and reward settlement live in private, profile-bound sessions.
const Academy = (() => {
  const skills=['vocabulary','grammar','reading','listening','order','conversation'];
  const intervals=[0,1,3,7,14,30], runs=new WeakMap();
  const modes={vocabulary:['vocabulary'],grammar:['grammar','order'],listening:['listening'],conversation:['conversation'],mixed:skills};
  const aidNames=['hint','translation','transcript','fallback'];
  const get=id=>Curriculum.get(id),unit=id=>Curriculum.units.find(u=>u.id===id),mission=id=>Curriculum.missions.find(m=>m.id===id);
  const integer=(n,max=1000000)=>Number.isSafeInteger(n)?Math.max(0,Math.min(max,n)):0;
  const add=(array,value)=>{if(!array.includes(value))array.push(value);};
  function day(now=Date.now(),delta=0){const d=new Date(now);d.setDate(d.getDate()+delta);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&day(new Date(s+'T12:00:00'))===s;
  const normal=s=>typeof s==='string'?s.normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'").replace(/[.!?,;:]/g,' ').replace(/\s+/g,' ').trim():'';
  const blank=()=>({correct:0,wrong:0,assistedCorrect:0,assistedWrong:0,independentCorrect:0,independentWrong:0,comprehensionCorrect:0,
    hint:0,translation:0,transcript:0,fallback:0,audioCorrect:0,audioWrong:0,readingAssisted:0,lastDay:'',streak:0});
  const expressionBlank=()=>({...blank(),seen:false,step:0,dueDay:'',days:[],formats:[]});
  function fresh(){return {tier:1,tierMode:'auto',records:{},expressions:{},recent:[],units:{},missions:{},diagnostics:[],
    diagnosticRuns:0,rewarded:[],badges:[],sessions:0,evidenceCount:0,adjustedAt:0,speechAttempts:0};}
  function recordShape(raw){
    const r=blank();if(!raw||typeof raw!=='object')return r;
    for(const k of Object.keys(r))if(k!=='lastDay')r[k]=integer(raw[k]);
    r.assistedCorrect=Math.min(r.assistedCorrect,r.correct);r.assistedWrong=Math.min(r.assistedWrong,r.wrong);
    r.independentCorrect=Math.min(r.independentCorrect,r.correct-r.assistedCorrect);r.independentWrong=Math.min(r.independentWrong,r.wrong-r.assistedWrong);
    r.comprehensionCorrect=Math.max(r.independentCorrect,Math.min(r.comprehensionCorrect,r.correct));
    r.audioCorrect=Math.min(r.audioCorrect,r.independentCorrect);r.audioWrong=Math.min(r.audioWrong,r.independentWrong);
    for(const key of [...aidNames,'readingAssisted'])r[key]=Math.min(r[key],r.correct+r.wrong);
    r.streak=Math.min(r.streak,r.independentCorrect);if(validDay(raw.lastDay))r.lastDay=raw.lastDay;
    return r;
  }
  function hydrate(raw){
    const s=fresh();if(!raw||typeof raw!=='object')return s;
    if([1,2,3].includes(raw.tier))s.tier=raw.tier;s.tierMode=raw.tierMode==='manual'?'manual':'auto';
    for(const a of Curriculum.activities)if(raw.records?.[a.id])s.records[a.id]=recordShape(raw.records[a.id]);
    for(const e of Curriculum.expressions){
      const v=raw.expressions?.[e.id];if(!v||typeof v!=='object')continue;
      const r={...expressionBlank(),...recordShape(v)};r.seen=v.seen===true||r.correct+r.wrong>0;r.step=integer(v.step,5);
      r.dueDay=validDay(v.dueDay)?v.dueDay:r.lastDay;
      r.days=Array.isArray(v.days)?[...new Set(v.days.filter(validDay))].sort().slice(-Math.min(30,r.independentCorrect)):[];
      const possibleFormats=Curriculum.activities.filter(a=>a.expressionIds.includes(e.id)).map(a=>a.skill+':'+a.type);
      r.formats=Array.isArray(v.formats)?[...new Set(v.formats.filter(f=>possibleFormats.includes(f)))].slice(0,r.independentCorrect):[];
      if(!r.independentCorrect){r.days=[];r.formats=[];}s.expressions[e.id]=r;
    }
    if(Array.isArray(raw.recent))for(const row of raw.recent.slice(-80)){
      if(!get(row?.id)||typeof row.correct!=='boolean'||!validDay(row.day))continue;
      s.recent.push({id:row.id,correct:row.correct,assisted:row.assisted===true,first:row.first===true,audio:row.audio===true,
        day:row.day,tier:[1,2,3].includes(row.tier)?row.tier:1});
    }
    for(const u of Curriculum.units){
      const saved=raw.units?.[u.id],solved=Curriculum.activities.filter(a=>a.unitId===u.id&&s.records[a.id]?.correct).length;
      if(saved&&solved)s.units[u.id]={lessons:integer(saved.lessons),rewarded:saved.rewarded===true};
    }
    for(const m of Curriculum.missions){
      const saved=raw.missions?.[m.id];if(!saved)continue;
      let step=0;while(step<Math.min(integer(saved.step),m.activityIds.length)&&s.records[m.activityIds[step]]?.correct)step++;
      s.missions[m.id]={step,completed:step===m.activityIds.length,rewarded:saved.rewarded===true&&step===m.activityIds.length,
        independentIds:m.activityIds.filter(id=>Array.isArray(saved.independentIds)&&saved.independentIds.includes(id)&&s.records[id]?.independentCorrect>0),
        rewardEligibleIds:m.activityIds.filter(id=>(Array.isArray(saved.rewardEligibleIds)?saved.rewardEligibleIds:Array.isArray(saved.independentIds)?saved.independentIds:[]).includes(id)&&s.records[id]?.comprehensionCorrect>0)};
    }
    const rewardIds=[...Curriculum.units.map(u=>'unit-'+u.id),...Curriculum.missions.map(m=>'mission-'+m.id)];
    s.rewarded=rewardIds.filter(id=>Array.isArray(raw.rewarded)&&raw.rewarded.includes(id));
    for(const [id,u] of Object.entries(s.units))if(u.rewarded)add(s.rewarded,'unit-'+id);
    for(const [id,m] of Object.entries(s.missions))if(m.rewarded)add(s.rewarded,'mission-'+id);
    s.badges=[...s.rewarded,...(Array.isArray(raw.badges)&&raw.badges.includes('first-review')?['first-review']:[])];
    s.sessions=integer(raw.sessions);s.diagnosticRuns=integer(raw.diagnosticRuns);s.speechAttempts=integer(raw.speechAttempts);
    s.evidenceCount=Object.values(s.records).reduce((n,r)=>n+r.independentCorrect+r.independentWrong,0);s.adjustedAt=Math.min(s.evidenceCount,integer(raw.adjustedAt));
    if(Array.isArray(raw.diagnostics))for(const saved of raw.diagnostics.slice(-6)){
      const form=Curriculum.diagnostics.find(d=>d.id===saved?.formId);
      if(!form||!validDay(saved.date)||!Array.isArray(saved.rows)||saved.rows.length!==form.activityIds.length)continue;
      if(saved.rows.some((r,i)=>r.id!==form.activityIds[i]||typeof r.correct!=='boolean'))continue;
      const rows=saved.rows.map(r=>({id:r.id,correct:r.correct,assisted:r.assisted===true,audio:r.audio===true,readingAssisted:r.readingAssisted===true}));
      s.diagnostics.push(diagnosticResult(form.id,rows,saved.date));
    }
    s.diagnosticRuns=Math.max(s.diagnosticRuns,s.diagnostics.length);return s;
  }
  function state(p){return p.academy;}
  function usable(p){return !!p?.started&&!!state(p);}
  function setTier(p,tier,mode='manual'){
    if(!usable(p)||![1,2,3].includes(tier)||!['manual','auto'].includes(mode))return false;
    state(p).tier=tier;state(p).tierMode=mode;state(p).adjustedAt=state(p).evidenceCount;return true;
  }
  function expressionStatus(p,id){
    const r=state(p).expressions[id];if(!r?.seen)return 'New';
    if(r.wrong&&r.streak<2)return 'Review Needed';
    if(r.independentCorrect>=6&&r.streak>=4&&r.days.length>=3&&r.formats.length>=2&&r.assistedCorrect<=r.correct/4)return 'Consistently Correct';
    if(r.independentCorrect>=3&&r.streak>=2&&r.days.length>=2&&r.formats.length>=2)return 'Familiar';
    return 'Learning';
  }
  function markSeen(p,ids,now){for(const id of ids){const r=state(p).expressions[id] ||= expressionBlank();r.seen=true;if(!r.dueDay)r.dueDay=day(now);}}
  function evidence(p){return state(p).recent.filter(r=>r.first&&!r.assisted&&(get(r.id).skill!=='listening'||r.audio)).slice(-10);}
  function recommendation(p){
    const s=state(p),rows=evidence(p),distinct=new Set(rows.map(r=>r.id)).size,categories=new Set(rows.map(r=>get(r.id).skill)).size;
    const correct=rows.filter(r=>r.correct).length;
    if(rows.length<10||distinct<8||categories<2||s.evidenceCount-s.adjustedAt<10)return {tier:s.tier,reason:'서로 다른 문제와 영역에서 새 독립 답변 10회를 모으면 난이도를 제안해요.',evidence:rows.length,distinct,correct,limited:true};
    const by=Object.fromEntries(skills.map(k=>[k,rows.filter(r=>get(r.id).skill===k)]));
    const stable=Object.values(by).filter(r=>r.length>=2).every(r=>r.filter(x=>x.correct).length/r.length>=.75);
    const atCurrent=rows.filter(r=>get(r.id).tier>=s.tier).length;
    const tier=correct>=9&&stable&&atCurrent>=8?Math.min(3,s.tier+1):correct<=5?Math.max(1,s.tier-1):s.tier;
    return {tier,reason:tier>s.tier?'최근 독립 답변 10회 중 9회 이상 맞혔고, 8회 이상이 현재 난이도 이상의 활동이에요. 두 번 이상 연습한 영역도 75% 이상이에요.':tier<s.tier?'최근 독립 답변 10회에서 다섯 번 이상 어려움이 있었어요. 짧은 표현을 다시 연습해 보세요.':correct>=9&&atCurrent<8?
      '쉬운 표현을 되짚는 연습은 난이도를 올리지 않아요. 최근 10회 중 현재 난이도 이상의 활동이 '+atCurrent+'회이며, 8회 이상 필요해요.':'최근 답변을 바탕으로 현재 난이도를 유지하며 연습해요.',evidence:rows.length,distinct,correct,atCurrent,limited:false};
  }
  function adjust(p){const s=state(p);if(s.tierMode!=='auto'||s.evidenceCount-s.adjustedAt<10)return;
    const rec=recommendation(p);if(rec.limited||rec.tier===s.tier)return;s.tier=rec.tier;s.adjustedAt=s.evidenceCount;}
  function ranked(p,pool,now,selected=[],target=state(p).tier){
    const s=state(p),today=day(now),recent=s.recent.slice(-8);
    function score(a){
      const r=s.records[a.id],expressions=a.expressionIds.map(id=>s.expressions[id]);
      return (expressions.some(e=>e?.dueDay&&e.dueDay<=today)?14:0)+(r&&r.wrong>r.independentCorrect?8:0)+(!r?3:0)
        -(recent.some(e=>e.id===a.id)?24:0)-Math.abs(a.tier-target)*4-selected.filter(id=>get(id).skill===a.skill).length*3;
    }
    return [...pool].filter(a=>!selected.includes(a.id)).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
  }
  function select(p,options={}){
    const mode=options.mode||'mixed',allowed=modes[mode];if(!allowed)return [];
    const tier=options.tier||state(p).tier;
    const available=Curriculum.activities.filter(a=>(!options.unitId||a.unitId===options.unitId)&&allowed.includes(a.skill));
    const threshold=available.some(a=>a.tier<=tier)?tier:Math.min(...available.map(a=>a.tier));
    const pool=available.filter(a=>a.tier<=threshold);
    const chosen=[],count=Math.min(6,pool.length),preferred=mode==='mixed'?['vocabulary','grammar','order','listening','conversation','reading']:[];
    for(let i=0;i<count;i++){
      const target=preferred[i],filtered=target?pool.filter(a=>a.skill===target&&!chosen.includes(a.id)):[];
      const best=ranked(p,filtered.length?filtered:pool,options.now,chosen,tier)[0];if(best)chosen.push(best.id);
    }
    return chosen;
  }
  function shuffle(values,seed){const a=[...values];let n=seed+1;for(let i=a.length-1;i>0;i--){n=(n*1664525+1013904223)>>>0;const j=n%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
  function stage(m,index){if(m.kind==='diagnostic')return 'diagnostic';if(m.kind==='review')return 'review';if(m.kind==='mission')return 'application';
    return m.kind==='unit'?(index<2?'guided':index<4?'independent':'application'):'independent';}
  function publish(m){
    const h=m.h;h.phase=m.phase;h.stage=m.phase==='preview'?'preview':m.phase==='results'?'review':stage(m,m.index);
    h.index=m.index;h.activity=get(m.ids[m.index])||null;h.assisted=m.aids.size>0||(m.phase==='feedback'?m.attempts>1:m.attempts>0);h.aids=[...m.aids];
    h.results=m.rows.map(r=>({...r}));return h;
  }
  function prepare(m){
    m.phase='question';m.attempts=0;m.heard=false;m.speechTried=false;m.aids=new Set();m.h.feedback=null;
    const a=get(m.ids[m.index]);m.h.choices=shuffle(a.choices,m.serial+m.index);m.h.words=a.type==='order'?[...m.h.choices]:[];
    if(a.type==='order'&&normal(m.h.words.join(' '))===normal(a.answer))m.h.words.push(m.h.words.shift());
    if(a.type==='order')m.h.choices=[...m.h.words];
    if(stage(m,m.index)==='guided')m.aids.add('hint');publish(m);
  }
  function start(p,kind,ids,options={}){
    if(!usable(p)||!ids.length||ids.some(id=>!get(id))||options.now!==undefined&&!Number.isFinite(new Date(options.now).getTime()))return null;
    const s=state(p);s.sessions=Math.min(1000000,s.sessions+1);
    const expressionIds=[...new Set(ids.flatMap(id=>get(id).expressionIds))];
    const h={kind,phase:'preview',stage:'preview',unitId:options.unitId||null,missionId:options.missionId||null,
      formId:options.formId||null,activityIds:[...ids],index:0,total:ids.length,activity:get(ids[0]),choices:[],words:[],
      preview:kind==='diagnostic'?[]:expressionIds.map(id=>Curriculum.expressions.find(e=>e.id===id)),feedback:null,results:[],assisted:false,aids:[]};
    const m={h,kind,ids:[...ids],index:0,phase:'preview',rows:[],aids:new Set(),attempts:0,serial:s.sessions,now:options.now,
      unitId:options.unitId,missionId:options.missionId,formId:options.formId,missionReplay:options.missionReplay===true,reward:null};
    if(kind!=='diagnostic')markSeen(p,expressionIds,options.now);runs.set(p,m);return h;
  }
  function startUnit(p,id,options={}){if(!usable(p)||!unit(id))return null;return start(p,'unit',select(p,{...options,unitId:id}),{...options,unitId:id});}
  function startMode(p,mode,options={}){if(!usable(p)||!modes[mode])return null;return start(p,'mode',select(p,{...options,mode}),options);}
  function startExact(p,id,options={}){return get(id)?start(p,'exact',[id],options):null;}
  function startMission(p,id,options={}){
    const m=mission(id);if(!usable(p)||!m)return null;const s=state(p).missions[id];
    return start(p,'mission',m.activityIds.slice(s?.completed?0:s?.step||0),{...options,missionId:id,missionReplay:!!s?.completed});
  }
  function today(p,now=Date.now()){
    const date=day(now),due=[];
    for(const e of Curriculum.expressions){const r=state(p).expressions[e.id];if(!r?.dueDay||r.dueDay>date)continue;
      const pool=Curriculum.activities.filter(a=>a.expressionIds.includes(e.id)),a=ranked(p,pool,now)[0];
      if(a)due.push({expressionId:e.id,english:e.english||e.en,ko:e.ko,dueDay:r.dueDay,activityId:a.id,status:expressionStatus(p,e.id)});
    }
    due.sort((a,b)=>a.dueDay.localeCompare(b.dueDay)||a.expressionId.localeCompare(b.expressionId));
    return {date,count:due.length,due,activityIds:[...new Set(due.map(r=>r.activityId))],estimatedMinutes:due.length?Math.max(1,Math.ceil(Math.min(due.length,6)*.75)):0};
  }
  function startReview(p,options={}){if(!usable(p))return null;return start(p,'review',today(p,options.now).activityIds.slice(0,6),options);}
  function startDiagnostic(p,options={}){
    if(!usable(p)||!Curriculum.diagnostics.length)return null;
    const form=Curriculum.diagnostics[state(p).diagnosticRuns%Curriculum.diagnostics.length];
    return start(p,'diagnostic',form.activityIds,{...options,formId:form.id});
  }
  function current(p){return runs.get(p)?.h||null;}
  function close(p){return runs.delete(p);}
  function valid(p,h,phases){const m=runs.get(p);return usable(p)&&m?.h===h&&phases.includes(m.phase)?m:null;}
  function assist(p,h,reason){const m=valid(p,h,['question']);if(!m||!aidNames.includes(reason))return false;m.aids.add(reason);publish(m);return true;}
  function hear(p,h){const m=valid(p,h,['question']);if(!m||get(m.ids[m.index]).skill!=='listening')return false;m.heard=true;return true;}
  function updateRecord(r,correct,assisted,aids,audio,reading,now,independent){
    r[correct?'correct':'wrong']++;if(assisted)r[correct?'assistedCorrect':'assistedWrong']++;
    if(independent)r[correct?'independentCorrect':'independentWrong']++;
    for(const aid of aids)if(aidNames.includes(aid))r[aid]++;
    if(audio)r[correct?'audioCorrect':'audioWrong']++;if(reading)r.readingAssisted++;
    r.lastDay=day(now);if(!correct)r.streak=0;else if(independent)r.streak++;
  }
  function note(p,m,a,correct,now){
    const s=state(p),assisted=m.aids.size>0||m.attempts>0,first=m.attempts===0,
      reading=a.skill==='listening'&&(m.aids.has('transcript')||m.aids.has('fallback')||m.aids.has('translation')),
      audio=a.skill==='listening'&&m.heard&&!assisted,independent=first&&!assisted&&(a.skill!=='listening'||audio),
      rewardEligible=correct&&first&&!m.aids.has('hint')&&!m.aids.has('translation')
        &&(a.skill!=='listening'||m.heard||m.aids.has('transcript')||m.aids.has('fallback'));
    const r=s.records[a.id] ||= blank();updateRecord(r,correct,assisted,[...m.aids],audio,reading,now,independent);
    if(rewardEligible)r.comprehensionCorrect++;
    for(const id of a.expressionIds){
      const e=s.expressions[id] ||= expressionBlank();e.seen=true;
      updateRecord(e,correct,assisted,[...m.aids],audio,reading,now,independent);
      if(rewardEligible)e.comprehensionCorrect++;
      const date=day(now);
      if(!correct){e.step=0;e.dueDay=date;}
      else if(assisted||!independent){e.step=Math.min(e.step,1);e.dueDay=day(now,1);}
      else if(!e.dueDay||e.dueDay<=date){e.step=Math.min(5,e.step+1);e.dueDay=day(now,intervals[e.step]);}
      if(correct&&independent){add(e.days,date);e.days=e.days.sort().slice(-30);add(e.formats,a.skill+':'+a.type);}
    }
    const row={id:a.id,correct,assisted,first,audio,day:day(now),tier:a.tier};s.recent.push(row);if(s.recent.length>80)s.recent.shift();
    if(independent)s.evidenceCount++;adjust(p);
    return {assisted,first,audio,readingAssisted:reading,independent,rewardEligible};
  }
  function claim(p,id,gold){
    const s=state(p);if(s.rewarded.includes(id))return {gold:0,badge:null};
    s.rewarded.push(id);add(s.badges,id);const paid=Math.min(gold,Number.MAX_SAFE_INTEGER-p.gold);p.gold+=paid;
    return {gold:paid,badge:id};
  }
  function settle(p,m,now){
    if(m.reward)return;
    const s=state(p);m.reward={gold:0,badge:null};
    if(m.kind==='unit'){
      const u=s.units[m.unitId] ||= {lessons:0,rewarded:false};u.lessons=Math.min(1000000,u.lessons+1);
      if(m.ids.length>=6&&m.rows.filter(r=>r.rewardEligible).length>=3){m.reward=claim(p,'unit-'+m.unitId,5);u.rewarded=s.rewarded.includes('unit-'+m.unitId);}
    }
    if(m.kind==='mission'){
      const definition=mission(m.missionId),progress=s.missions[m.missionId];
      if(progress.completed&&definition.activityIds.every(id=>progress.rewardEligibleIds.includes(id))){m.reward=claim(p,'mission-'+m.missionId,3);progress.rewarded=true;}
    }
    if(m.kind==='review'){const first=!s.badges.includes('first-review');add(s.badges,'first-review');if(first)m.reward.badge='first-review';}
    if(m.kind==='diagnostic'){
      const rows=m.rows.map(r=>({id:r.id,correct:r.firstCorrect,assisted:r.assisted,audio:r.audio,readingAssisted:r.readingAssisted}));
      const result=diagnosticResult(m.formId,rows,day(now));s.diagnostics.push(result);if(s.diagnostics.length>6)s.diagnostics.shift();
      s.diagnosticRuns=Math.min(1000000,s.diagnosticRuns+1);m.diagnostic=result;
      if(s.tierMode==='auto'){s.tier=result.recommendedTier;s.adjustedAt=s.evidenceCount;}
    }
  }
  function answer(p,h,value,options={}){
    const m=valid(p,h,['question']);if(!m||typeof value!=='string'||!value.trim())return null;
    const a=get(m.ids[m.index]),mode=options.mode||'choice',now=options.now??m.now??Date.now();
    if(!['choice','text','speech'].includes(mode)||!Number.isFinite(new Date(now).getTime()))return null;
    if(a.type==='order'){
      if(mode==='speech'||normal(value).split(' ').sort().join('|')!==a.choices.map(normal).sort().join('|'))return null;
    }else if(mode==='choice'&&!a.choices.includes(value))return null;
    else if(mode!=='choice'&&a.skill!=='conversation')return null;
    const correct=[a.answer,...a.alternatives].some(answer=>normal(answer)===normal(value));
    if(mode==='speech'){
      if(!m.speechTried){state(p).speechAttempts++;m.speechTried=true;}
      if(!correct)return {correct:false,retrySpeech:true};
    }
    const result=note(p,m,a,correct,now);
    let row=m.rows[m.index];
    if(!row){row={id:a.id,firstCorrect:correct,independent:result.independent,assisted:result.assisted,audio:result.audio,
      readingAssisted:result.readingAssisted,rewardEligible:result.rewardEligible,attempts:0,solved:false};m.rows[m.index]=row;}
    row.attempts++;row.solved ||= correct;row.assisted ||= result.assisted;m.attempts++;m.correct=correct;m.phase='feedback';
    if(m.kind==='mission'&&correct){
      const definition=mission(m.missionId),progress=state(p).missions[m.missionId] ||= {step:0,completed:false,rewarded:false,independentIds:[],rewardEligibleIds:[]};
      if(result.independent)add(progress.independentIds,a.id);
      if(result.rewardEligible)add(progress.rewardEligibleIds,a.id);
      if(!m.missionReplay&&definition.activityIds[progress.step]===a.id)progress.step++;
      progress.completed=progress.step===definition.activityIds.length;
    }
    const final=m.index===m.ids.length-1&&(correct||m.kind==='diagnostic');if(final)settle(p,m,now);
    h.feedback={correct,explanation:a.explanation,answer:a.answer,ko:a.ko,assisted:result.assisted,audioEvidence:result.audio,
      readingAssisted:result.readingAssisted,reward:final?{...m.reward}:null,final};publish(m);return h.feedback;
  }
  function retry(p,h){const m=valid(p,h,['feedback']);if(!m||m.correct||m.kind==='diagnostic')return false;m.phase='question';m.aids.add('correction');publish(m);return true;}
  function advance(p,h){
    const m=valid(p,h,['preview','feedback']);if(!m)return false;
    if(m.phase==='preview'){prepare(m);return true;}
    if(!m.correct&&m.kind!=='diagnostic')return false;
    if(m.index===m.ids.length-1){m.phase='results';publish(m);return true;}
    m.index++;prepare(m);return true;
  }
  function diagnosticResult(formId,rows,date){
    const bySkill={};
    for(const skill of ['vocabulary','grammar','reading','listening']){
      const list=rows.filter(r=>get(r.id).skill===skill),eligible=list.filter(r=>!r.assisted&&(skill!=='listening'||r.audio));
      bySkill[skill]={total:list.length,correct:list.filter(r=>r.correct).length,independentAnswered:eligible.length,
        independentCorrect:eligible.filter(r=>r.correct).length,readingAssisted:list.filter(r=>r.readingAssisted).length};
    }
    const audio=bySkill.listening,limited=audio.independentAnswered<audio.total||Object.values(bySkill).some(r=>r.independentAnswered<r.total);
    const assessed=Object.entries(bySkill).filter(([key])=>key!=='listening'||audio.independentAnswered>=4).map(([,r])=>r);
    const score=assessed.reduce((n,r)=>n+r.independentCorrect,0),total=assessed.reduce((n,r)=>n+r.total,0);
    let recommendedTier=1;
    if(assessed.length>=3&&assessed.every(r=>r.independentCorrect>=Math.ceil(r.total*.5))&&score>=Math.ceil(total*.6))recommendedTier=2;
    if(!limited&&assessed.length===4&&assessed.every(r=>r.independentCorrect>=Math.ceil(r.total*.8))&&score>=Math.ceil(total*.875))recommendedTier=3;
    return {formId,date,rows,bySkill,total:rows.length,correct:rows.filter(r=>r.correct).length,
      independentCorrect:Object.values(bySkill).reduce((n,r)=>n+r.independentCorrect,0),recommendedTier,limited,
      reason:limited?'도움 또는 소리 없이 푼 항목은 독립 듣기 근거에서 제외했어요. 읽기 중심의 잠정 추천이며 원하는 난이도를 직접 고를 수 있어요.':
        '영역별 독립 정답 비율을 함께 사용한 게임 안의 시작점 추천이에요. 공식 영어 능력 인증이 아니에요.'};
  }
  function summary(p,h){
    const m=valid(p,h,['feedback','results']);if(!m)return null;
    return {kind:m.kind,total:m.ids.length,solved:m.rows.filter(r=>r.solved).length,firstCorrect:m.rows.filter(r=>r.firstCorrect).length,
      independentCorrect:m.rows.filter(r=>r.firstCorrect&&r.independent).length,attempts:m.rows.reduce((n,r)=>n+r.attempts,0),
      comprehensionCorrect:m.rows.filter(r=>r.rewardEligible).length,
      assisted:m.rows.filter(r=>r.assisted).length,expressionIds:[...new Set(m.ids.flatMap(id=>get(id).expressionIds))],
      reviewExpressionIds:[...new Set(m.rows.filter(r=>!r.firstCorrect||r.assisted).flatMap(r=>get(r.id).expressionIds))],
      reward:m.reward?{...m.reward}:null,diagnostic:m.diagnostic||null,recommendation:recommendation(p)};
  }
  function unitProgress(p,id,now=Date.now()){
    const pool=Curriculum.activities.filter(a=>a.unitId===id),s=state(p),expressions=[...new Set(pool.flatMap(a=>a.expressionIds))];
    const attempted=pool.filter(a=>s.records[a.id]?.correct+s.records[a.id]?.wrong>0).length,completed=pool.filter(a=>s.records[a.id]?.correct>0).length;
    return {unitId:id,total:pool.length,attempted,completed,percent:pool.length?Math.round(100*completed/pool.length):0,
      reviewNeeded:expressions.filter(id=>expressionStatus(p,id)==='Review Needed').length,
      dueCount:expressions.filter(id=>s.expressions[id]?.dueDay&&s.expressions[id].dueDay<=day(now)).length,
      lessons:s.units[id]?.lessons||0,rewarded:s.rewarded.includes('unit-'+id)};
  }
  function aggregate(records){
    const total=records.reduce((n,r)=>n+r.correct+r.wrong,0),correct=records.reduce((n,r)=>n+r.correct,0),
      independentCorrect=records.reduce((n,r)=>n+r.independentCorrect,0),independentAnswered=records.reduce((n,r)=>n+r.independentCorrect+r.independentWrong,0),
      assistedCorrect=records.reduce((n,r)=>n+r.assistedCorrect,0),assistedAnswered=records.reduce((n,r)=>n+r.assistedCorrect+r.assistedWrong,0);
    return {total,correct,accuracy:total?Math.round(correct*100/total):null,independentCorrect,independentAnswered,
      independentAccuracy:independentAnswered?Math.round(independentCorrect*100/independentAnswered):null,assistedCorrect,assistedAnswered,
      assistedAccuracy:assistedAnswered?Math.round(assistedCorrect*100/assistedAnswered):null,
      audioCorrect:records.reduce((n,r)=>n+r.audioCorrect,0),audioAnswered:records.reduce((n,r)=>n+r.audioCorrect+r.audioWrong,0),
      readingAssisted:records.reduce((n,r)=>n+r.readingAssisted,0),hints:records.reduce((n,r)=>n+r.hint+r.translation,0),
      fallback:records.reduce((n,r)=>n+r.fallback,0),transcript:records.reduce((n,r)=>n+r.transcript,0)};
  }
  function dashboard(p,now=Date.now()){
    const s=state(p),records=Object.values(s.records),bySkill=Object.fromEntries(skills.map(skill=>[skill,aggregate(Curriculum.activities
      .filter(a=>a.skill===skill&&s.records[a.id]).map(a=>s.records[a.id]))]));
    const weak=skills.filter(skill=>bySkill[skill].independentAnswered>=4&&bySkill[skill].independentAccuracy<60)
      .sort((a,b)=>bySkill[a].independentAccuracy-bySkill[b].independentAccuracy)[0];
    const due=today(p,now),recommendationText=weak?weak+' 영역의 독립 답변 '+bySkill[weak].independentAnswered+'회 중 정답 비율이 '+bySkill[weak].independentAccuracy+'%예요. 짧은 표현을 복습해 보세요.':
      due.count?'복습할 표현 '+due.count+'개가 있어요. 오늘의 복습에서 다시 만나 보세요.':records.length?'현재 난이도로 여러 표현과 문제 형식을 고르게 연습해 보세요.':'원하는 단원을 골라 첫 학습을 시작하세요.';
    return {totalActivities:Curriculum.activities.length,totalAttempts:records.reduce((n,r)=>n+r.correct+r.wrong,0),
      uniqueAttempted:records.filter(r=>r.correct+r.wrong>0).length,uniqueCompleted:records.filter(r=>r.correct>0).length,
      overall:aggregate(records),bySkill,expressions:Curriculum.expressions.length,seenExpressions:Object.values(s.expressions).filter(r=>r.seen).length,
      statuses:Object.fromEntries(['New','Learning','Review Needed','Familiar','Consistently Correct'].map(name=>[name,Curriculum.expressions.filter(e=>expressionStatus(p,e.id)===name).length])),
      dueCount:due.count,units:Curriculum.units.map(u=>unitProgress(p,u.id,now)),missionsCompleted:Object.values(s.missions).filter(m=>m.completed).length,
      recent:s.recent.slice(-12).map(r=>({...r,skill:get(r.id).skill})),recommendation:{skill:weak||null,text:recommendationText},tier:recommendation(p),
      latestDiagnostic:s.diagnostics.at(-1)||null};
  }
  return {skills,intervals,day,normal,fresh,hydrate,setTier,expressionStatus,recommendation,select,startUnit,startMode,startExact,startMission,
    today,startReview,startDiagnostic,current,close,assist,hear,answer,retry,advance,summary,unitProgress,dashboard};
})();
