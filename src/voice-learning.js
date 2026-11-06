// Only authored identifiers, counters, flags and civil dates enter the save.
// The open exercise and any recognized/typed words stay in memory.
const VoiceLearning = (() => {
  const open = new WeakMap();
  const replay = new WeakMap();
  const intervals = [0,1,3,7,14];
  const categories = ['vocab','sentence','listening','order','speaking'];
  const knownKinds = {vocab:'vocab', sentence:'sentence', dialogue:'sentence', order:'order',
    listening:'listening', speak:'speaking', listen:'listening', conversation:'sentence', scenario:'sentence'};
  const category = item => knownKinds[item.kind || item.type];
  const activity = id => VoiceData.activities.find(a => a.id === id);
  const mission = id => VoiceData.missions.find(m => m.id === id);
  const question = id => Q.find(q => q.id === id);
  const whole = n => Number.isSafeInteger(n) ? Math.max(0,n) : 0;
  const validDay = day => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
    && localDay(new Date(day+'T12:00:00')) === day;
  function localDay(now = Date.now(), delta = 0) {
    const d = new Date(now);
    d.setDate(d.getDate()+delta);
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  }
  function nextDay(now, step) { return localDay(now, intervals[step]); }
  function blank() {
    return {correct:0,wrong:0,assistedCorrect:0,assistedWrong:0,spoken:0,text:0,
      transcript:0,translation:0,fallback:0,
      step:0,lastDay:'',dueDay:'',reviewDay:''};
  }
  function fresh() {
    return {introduced:[], records:{}, recent:[], missions:{}, speechAttempts:0};
  }
  function hydrate(raw) {
    const data=fresh();
    if (!raw || typeof raw !== 'object') return data;
    data.speechAttempts=whole(raw.speechAttempts);
    data.introduced=VoiceData.activities.filter(a=>Array.isArray(raw.introduced)&&raw.introduced.includes(a.id)).map(a=>a.id);
    for (const m of VoiceData.missions) {
      const step=Math.min(m.ids.length,whole(raw.missions?.[m.id]));
      if(step) data.missions[m.id]=step;
    }
    for (const {id} of [...Q,...VoiceData.activities]) {
      const saved=raw.records?.[id];
      if (!saved || typeof saved !== 'object') continue;
      const r=blank();
      for(const key of ['correct','wrong','spoken','text','transcript','translation','fallback']) r[key]=whole(saved[key]);
      r.assistedCorrect=Math.min(r.correct,whole(saved.assistedCorrect));
      r.assistedWrong=Math.min(r.wrong,whole(saved.assistedWrong));
      r.step=Math.min(4,whole(saved.step));
      for(const key of ['lastDay','dueDay','reviewDay']) if(validDay(saved[key])) r[key]=saved[key];
      data.records[id]=r;
    }
    if(Array.isArray(raw.recent)) {
      for(const entry of raw.recent.slice(-20)) {
        if (!entry || !data.records[entry.id] || !validDay(entry.day) || typeof entry.correct!=='boolean') continue;
        data.recent.push({id:entry.id, day:entry.day, correct:entry.correct, assisted:entry.assisted===true});
      }
    }
    return data;
  }
  function normalize(value) {
    if (typeof value !== 'string') return '';
    return value.normalize('NFKC').toLowerCase().replace(/[‘’]/g,"'")
      .replace(/\bi'd(?=\s+like\b)/g,'i would').replace(/\bi'm\b/g,'i am')
      .replace(/\byou're\b/g,'you are').replace(/\bit's\b/g,'it is')
      .replace(/\bthat's\b/g,'that is').replace(/\bi'll\b/g,'i will')
      .replace(/\bcan't\b/g,'cannot').replace(/\bdon't\b/g,'do not')
      .replace(/[.,!?;:…“”"]/g,' ').replace(/\s+/g,' ').trim();
  }
  function matches(a,value) {
    const normalized=normalize(value);
    return !!normalized && [a.answer,...a.alternatives].some(s=>normalize(s)===normalized);
  }
  function introduce(p,id) {
    const a=activity(id);
    if(!a) return false;
    if(!p.voice.introduced.includes(id)) p.voice.introduced.push(id);
    Engine.teach(p,lessonTags(a));
    return true;
  }
  function lessonTags(a) {
    const forms=[normalize(a.english),normalize(a.answer)];
    return lessons.filter(l=>a.tags.includes(l.id) || forms.includes(normalize(l.en))).map(l=>l.id);
  }
  function note(p,item,correct,{assisted=false,aids=[],mode='choice',review=false,now=Date.now()}={}) {
    const r=p.voice.records[item.id] ||= {...blank(),step:p.schedule[item.id]?.step || 0};
    r[correct?'correct':'wrong']++;
    if(assisted) r[correct?'assistedCorrect':'assistedWrong']++;
    for(const reason of ['transcript','translation','fallback']) if(aids.includes(reason)) r[reason]++;
    if(mode==='speech') r.spoken++;
    if(mode==='text' || (mode==='choice' && item.kind==='speak')) r.text++;
    r.lastDay=localDay(now);
    if(!correct || assisted || !r.dueDay || r.dueDay<=r.lastDay) {
      r.step=correct ? (assisted ? 1 : Math.min(r.step+1,4)) : 0;
      r.dueDay=nextDay(now,r.step);
    }
    if(review && correct) r.reviewDay=r.lastDay;
    p.voice.recent.push({id:item.id,day:r.lastDay,correct,assisted:!!assisted});
    if(p.voice.recent.length>20) p.voice.recent.shift();
    return r;
  }
  function missionStep(p,id) {return p.voice.missions[id] || 0;}
  function start(p,id,options={}) {
    const a=activity(id);
    if(!a) return null;
    const m=options.mission && mission(options.mission);
    if(options.mission && !m) return null;
    const progress=m ? missionStep(p,m.id) : 0;
    const isReplay=!!m && progress===m.ids.length;
    const cursor=replay.get(p);
    const step=isReplay ? (cursor?.id===m.id ? cursor.step : 0) : progress;
    if(m && m.ids[step]!==id) return null;
    introduce(p,id);
    const h={activity:a, choices:Engine.shuffle(a.choices), answered:false,assisted:false,
      aids:[],missionId:m?.id || '',step,replay:isReplay,review:!!options.review};
    Object.defineProperty(h,'battle',{value:options.battle||null});
    open.set(p,h);
    return h;
  }
  function startMission(p,id) {
    const m=mission(id);
    if(!m) return null;
    const cursor=replay.get(p);
    const index=missionStep(p,id)===m.ids.length ? (cursor?.id===id ? cursor.step : 0) : missionStep(p,id);
    return start(p,m.ids[index],{mission:id});
  }
  function assist(p,h,reason) {
    if (!h || open.get(p)!==h || h.answered || !['transcript','translation','fallback'].includes(reason)) return false;
    if (!h.aids.includes(reason)) h.aids.push(reason);
    h.assisted=true;
    return true;
  }
  function finishStep(p,h,correct) {
    if (!h.missionId || !correct) return false;
    const m=mission(h.missionId), next=h.step+1, done=next===m.ids.length;
    if(h.replay) replay.set(p,{id:m.id,step:done?0:next});
    else p.voice.missions[m.id]=next;
    if(done && m.kind==='conversation' && p.currentChapter===2) {
      const q=VillageData.quests.find(q=>q.npc===m.npc);
      if(q && VillageEngine.status(p,q.stage)==='active') p.village.progress[q.stage].step=VillageData.dialogues[q.npc].length;
    }
    return done;
  }
  function submit(p,h,value,{mode='choice',now=Date.now()}={}) {
    if(!h || h!==open.get(p) || h.answered || !['text','choice','speech'].includes(mode)) return null;
    const a=h.activity;
    if(h.battle && !Engine.voicePending(p,h.battle,h)) return null;
    if(typeof value!=='string' || !value.trim()) return null;
    if(mode==='choice' && !h.choices.includes(value)) return null;
    if(mode==='speech' && !/[a-z]/i.test(a.answer)) return null;
    const correct=mode==='choice' ? value===a.answer : matches(a,value);
    if(mode==='speech' && !h.speechTried) {p.voice.speechAttempts++; h.speechTried=true;}
    if(mode==='speech' && !correct) return {correct:false,activity:a,retrySpeech:true,done:false};
    h.answered=true;
    open.delete(p);
    if(h.battle) Engine.voiceResult(p,h.battle,h,correct);
    note(p,a,correct,{assisted:h.assisted,aids:h.aids,mode,review:h.review,now});
    if(h.review)RPG.refresh(p);
    const m=h.missionId && mission(h.missionId);
    if(m?.kind==='conversation' && p.currentChapter===2 && !h.replay) {
      const q=VillageData.quests.find(q=>q.npc===m.npc);
      if(q && VillageEngine.status(p,q.stage)==='active') VillageEngine.track(p,q.stage,{tags:lessonTags(a)},correct);
    }
    const done=finishStep(p,h,correct);
    const reply=a.replies && Object.hasOwn(a.replies,value) ? a.replies[value] : (correct ? a.replies?.[a.answer] : null);
    return {correct,activity:a,question:h.battle?.question,reply,
      combo:h.battle?.combo || 0, done, retrySpeech:false};
  }
  function recommend(p,kind,filter=()=>true,now=Date.now()) {
    const pool=VoiceData.activities.filter(a=>(!kind || a.kind===kind) && filter(a));
    if(!pool.length) return null;
    const known=pool.filter(a=>p.voice.introduced.includes(a.id));
    const recent=p.voice.recent.slice(-5);
    const successes=recent.filter(r=>r.correct && !r.assisted).length;
    const target=successes===5 && p.voice.recent.length>=10 ? 3 : successes>=4 ? 2 : 1;
    // An unseen activity always opens with a briefing. Step up one level at a time.
    const entryLevel=Math.min(...pool.map(a=>a.difficulty));
    const eligible=pool.filter(a=>known.includes(a) || a.difficulty<=Math.max(entryLevel,target));
    const previous=p.voice.recent.at(-1);
    function priority(a) {
      const r=p.voice.records[a.id], practiced=!!r;
      const due=practiced && r.dueDay<=localDay(now);
      let score=due?12:0;
      if(practiced && r.wrong>r.correct) score+=6;
      if(!practiced) score+=5;
      if(known.includes(a)) score+=2;
      if(lessonTags(a).some(tag=>p.learning[tag]?.seen)) score+=1;
      score-=Math.abs(a.difficulty-target)*3;
      if(a.id===previous?.id) score-=35;
      if(recent.some(entry=>entry.id===a.id)) score-=8;
      if(previous && activity(previous.id)?.kind===a.kind) score-=1;
      return score;
    }
    return eligible.sort((a,b)=>priority(b)-priority(a)||a.id.localeCompare(b.id))[0];
  }
  function today(p,now=Date.now()) {
    const date=localDay(now), due=[], ids=new Set();
    let completed=0;
    function add(item,source,dueDay) {
      if(ids.has(item.id) || dueDay>date) return;
      ids.add(item.id);
      due.push({id:item.id,source,kind:item.kind||item.type,day:dueDay,label:item.objective||item.instruction});
    }
    for(const [id,r] of Object.entries(p.voice.records)) {
      const a=activity(id),q=question(id);
      if(r.reviewDay===date && r.dueDay>date) completed++;
      if(r.dueDay && (a||q)) add(a||q,a?'activity':'question',r.dueDay);
    }
    for(const entry of Engine.reviewList(p,now)) {
      if(!p.voice.records[entry.question.id]?.dueDay && entry.due) add(entry.question,'question',entry.dueAt?localDay(entry.dueAt):date);
    }
    due.sort((a,b)=>a.day.localeCompare(b.day)||a.id.localeCompare(b.id));
    return {due,count:due.length,completed,date};
  }
  function dashboard(p) {
    const totals=Object.fromEntries(categories.map(k=>[k,blank()]));
    for(const [id,r] of Object.entries(p.voice.records)) {
      const item=activity(id)||question(id), row=item && totals[category(item)];
      if(!row) continue;
      for(const key of ['correct','wrong','assistedCorrect','assistedWrong','spoken','text','transcript','translation','fallback']) row[key]+=r[key];
    }
    const recent=p.voice.recent.slice(-8).map(e=>({...e,kind:category(activity(e.id)||question(e.id))}));
    const weak=p.voice.recent.filter(e=>!e.correct && !e.assisted && p.voice.records[e.id].step===0);
    let recommendation=null;
    if(weak.length>=2) {
      const id=weak.at(-1).id, a=activity(id);
      recommendation={id,source:a?'activity':'question',kind:category(a||question(id))};
    }
    const encountered = new Set(lessons.filter(l=>p.learning[l.id]?.seen).map(l=>normalize(l.en)));
    for(const id of p.voice.introduced) encountered.add(normalize(activity(id).english));
    const expressions = new Set([...lessons.map(l=>normalize(l.en)),...VoiceData.activities.map(a=>normalize(a.english))]);
    const pending=new Set(lessons.filter(l=>p.marked.includes(l.id)||Engine.status(p.learning[l.id])==='Review Needed')
      .map(l=>normalize(l.en)));
    for(const entry of today(p).due) {
      if(entry.source==='activity') pending.add(normalize(activity(entry.id).english));
      else for(const tag of question(entry.id).tags) {
        const l=lessons.find(l=>l.id===tag);
        if(l) pending.add(normalize(l.en));
      }
    }
    return {categories:totals,encountered:encountered.size,total:expressions.size,reviewNeeded:pending.size,
      missionsCompleted:VoiceData.missions.filter(m=>missionStep(p,m.id)===m.ids.length).length,
      speakingAttempts:p.voice.speechAttempts,recent,recommendation};
  }
  function cancel(p) {open.delete(p);}
  return {fresh,hydrate,normalize,matches,introduce,lessonTags,localDay,nextDay,note,start,startMission,missionStep,
    assist,submit,cancel,recommend,today,dashboard};
})();
