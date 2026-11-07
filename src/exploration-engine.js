// Authoritative exploration rules. Pending interactions and followers are never saved.
const Exploration = (() => {
  const D=ExplorationData, sessions=new WeakMap(),followers=new WeakMap();
  const area=id=>D.areas[id], activity=id=>D.activities.find(a=>a.id===id),object=id=>D.objects.find(o=>o.id===id);
  const has=(s,id)=>s.completed.includes(id), all=(s,ids)=>ids.every(id=>has(s,id));
  const normalize=s=>s.toLowerCase().replace(/[.!?]/g,'').replace(/\s+/g,' ').trim();
  const add=(items,id)=>{if(!items.includes(id))items.push(id);};
  const blankReward=()=>({gold:0,gearId:null,potions:0,cosmetic:null,note:null});
  function fresh(){return {area:'forest',x:100,y:450,direction:'down',completed:[],observed:[],opened:[],
    discovered:['forest'],recruited:[],activeCompanion:null,choices:{crossroad:null,restoration:null},
    quests:{map:'active',companions:'locked',bridge:'locked',fragments:'locked',path:'locked'},
    completedChapter:false,cosmetics:[],notes:[],rewarded:[],tutorialSeen:false};}
  function available(p){return !!p?.started&&p.chapterComplete&&[4,5,6].every(n=>p.village?.progress[n]?.completed);}
  function areaUnlocked(s,id){return id==='forest'||id==='ruins'&&has(s,'f-bridge')||id==='cavern'&&has(s,'r-fragment')
    ||id==='grove'&&has(s,'f-secret')||id==='vault'&&has(s,'r-vault');}
  function ready(s,a){
    if(!a||!areaUnlocked(s,a.area)||!all(s,a.requires||[]))return false;
    if(a.choice&&!s.choices[a.choice])return false;
    if(a.gate==='bridge'&&(!all(s,['f-mira','f-bram'])||!s.choices.crossroad||!has(s,'f-'+s.choices.crossroad)))return false;
    if(a.final&&(!s.choices.restoration||(!s.completedChapter&&s.choices.restoration!==a.final)))return false;
    return true;
  }
  function derive(s){
    s.recruited=D.companions.filter(c=>has(s,'f-'+c.id)).map(c=>c.id);
    if(!s.recruited.includes(s.activeCompanion))s.activeCompanion=s.recruited[0]||null;
    s.completedChapter=!!s.choices.restoration&&has(s,'c-final-'+s.choices.restoration);
    const complete=[all(s,['f-map','f-rowan','f-directions']),all(s,['f-mira','f-bram']),
      has(s,'f-bridge')&&s.discovered.includes('ruins'),has(s,'r-fragment'),s.completedChapter];
    let previous=true;
    D.quests.forEach((q,i)=>{s.quests[q.id]=previous?(complete[i]?'complete':'active'):'locked';previous=previous&&complete[i];});
    if(s.completedChapter)add(s.cosmetics,s.choices.restoration==='mira'?'runeGlow':'leafGlow');
  }
  function solids(p,id){return (area(id)?.obstacles||[]).filter(r=>!r.requires||!has(p.exploration,r.requires));}
  function walkable(p,id,x,y){
    const r=D.playerRadius;
    return !!area(id)&&Number.isFinite(x)&&Number.isFinite(y)&&x>=r&&x<=D.width-r&&y>=r&&y<=D.height-r
      &&!solids(p,id).some(o=>x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h);
  }
  function safePosition(p,id,x,y){
    const s=p.exploration;
    if(!walkable(p,id,x,y))return false;
    // A valid point must also be on the reachable side of an unopened physical gate.
    if(id==='forest'&&!has(s,'f-bridge')&&x>456)return false;
    if(id==='ruins'&&!has(s,'r-gate')&&x>436)return false;
    if(id==='cavern'&&!has(s,'c-door')&&y<294)return false;
    return true;
  }
  function hydrate(raw,p){
    const s=fresh();
    if(!available(p)||!raw||typeof raw!=='object')return s;
    const valid=id=>Array.isArray(raw.completed)&&raw.completed.includes(id);
    const candidates=D.activities.filter(a=>valid(a.id));
    // Establish only causally valid completions; an imported late flag cannot open an earlier gate.
    for(let pass=0;pass<D.activities.length;pass++){
      if(all(s,['f-mira','f-bram'])&&['moon','stone'].includes(raw.choices?.crossroad))s.choices.crossroad=raw.choices.crossroad;
      if(has(s,'c-switch')&&all(s,['f-mira','f-bram'])&&['mira','bram'].includes(raw.choices?.restoration))s.choices.restoration=raw.choices.restoration;
      let changed=false;
      for(const a of candidates)if(!has(s,a.id)&&ready(s,a)){add(s.completed,a.id);changed=true;derive(s);}
      if(!changed)break;
    }
    s.observed=D.activities.filter(a=>Array.isArray(raw.observed)&&raw.observed.includes(a.id)||has(s,a.id)).map(a=>a.id);
    s.discovered=Object.keys(D.areas).filter(id=>id==='forest'||Array.isArray(raw.discovered)&&raw.discovered.includes(id)&&areaUnlocked(s,id));
    if(has(s,'r-gate')||has(s,'r-fragment'))add(s.discovered,'ruins');
    if(has(s,'c-listen'))add(s.discovered,'cavern');
    s.opened=D.objects.filter(o=>o.type==='chest'&&areaUnlocked(s,o.area)&&all(s,o.requires||[])
      &&(o.activityId?has(s,o.activityId):Array.isArray(raw.opened)&&raw.opened.includes(o.id))).map(o=>o.id);
    s.activeCompanion=raw.activeCompanion;derive(s);
    // Hydration never credits currency. Completion itself consumes the corresponding one-time claim.
    if(s.opened.includes('g-order'))s.notes=['grove-scroll'];
    s.tutorialSeen=raw.tutorialSeen===true;
    s.area=Object.hasOwn(D.areas,raw.area)&&areaUnlocked(s,raw.area)?raw.area:'forest';
    add(s.discovered,s.area);derive(s);
    s.rewarded=[...D.quests.filter(q=>s.quests[q.id]==='complete').map(q=>'quest-'+q.id),...s.opened.map(id=>'chest-'+id)];
    const temporary={...p,exploration:s};
    const point=safePosition(temporary,s.area,raw.x,raw.y)?raw:area(s.area).spawn;
    s.x=point.x;s.y=point.y;
    s.direction=['up','down','left','right'].includes(raw.direction)?raw.direction:'down';
    return s;
  }
  function playable(p){return available(p)&&p.currentChapter===3&&!!p.exploration&&areaUnlocked(p.exploration,p.exploration.area);}
  function enter(p){
    if(!available(p))return false;
    if(!p.exploration)p.exploration=fresh();
    p.currentChapter=3;close(p);
    const s=p.exploration;
    if(!areaUnlocked(s,s.area))s.area='forest';
    if(!safePosition(p,s.area,s.x,s.y))Object.assign(s,area(s.area).spawn);
    add(s.discovered,s.area);derive(s);return true;
  }
  function current(p){return sessions.get(p)?.h||null;}
  function close(p){const existed=sessions.delete(p);return existed;}
  function inRange(p,o){return !!o&&p.exploration.area===o.area&&Math.hypot(p.exploration.x-o.x,p.exploration.y-o.y)<=o.radius;}
  function move(p,dx,dy,dt){
    if(!playable(p)||!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(dt)||dt<=0)return false;
    const pending=sessions.get(p);
    if(pending&&pending.phase!=='seek')return false;
    const length=Math.hypot(dx,dy);if(!length)return false;
    dx/=Math.max(1,length);dy/=Math.max(1,length);dt=Math.min(dt,.1);
    const s=p.exploration,steps=Math.max(1,Math.ceil(D.speed*dt/4)),x=s.x,y=s.y;
    s.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
    for(let i=0;i<steps;i++){
      const nx=s.x+dx*D.speed*dt/steps,ny=s.y+dy*D.speed*dt/steps;
      if(walkable(p,s.area,nx,s.y))s.x=nx;
      if(walkable(p,s.area,s.x,ny))s.y=ny;
    }
    return x!==s.x||y!==s.y;
  }
  function requirementsText(p,o){
    const s=p.exploration,a=activity(o.activityId);
    if(o.choiceId==='crossroad'&&!all(s,['f-mira','f-bram']))return '먼저 미라와 브람의 부탁을 마치고 두 동료를 맞이하세요.';
    if(o.choiceId==='restoration'&&!has(s,'c-switch'))return '먼저 수정 문의 문장을 완성하고 등불 아래 장치를 찾아보세요.';
    if(a?.gate==='bridge'&&!ready(s,a))return !all(s,['f-mira','f-bram'])?'미라와 브람을 모두 만난 뒤 갈림길로 가세요.':
      !s.choices.crossroad?'갈림길에서 달빛 길 또는 돌길을 선택하세요.':'선택한 '+(s.choices.crossroad==='moon'?'달빛 길의 불빛':'돌길의 문장')+' 도전을 먼저 해결하세요.';
    if(a?.final&&!ready(s,a))return !s.choices.restoration?'고대의 말 수정에서 복원을 도와줄 동료를 선택하세요.':'이번 복원은 '+(s.choices.restoration==='mira'?'미라의 비문':'브람의 장치')+'에서 이어집니다. 완성한 뒤 다른 도전도 살펴볼 수 있어요.';
    const missing=[...(o.requires||[]),...(a?.requires||[])].find(id=>!has(s,id));
    if(missing)return '먼저 '+object(activity(missing)?.sourceId)?.name+'에서 안내를 해결하세요.';
    if(a?.choice&&!s.choices[a.choice])return '두 동료를 맞이한 뒤 갈림길에서 먼저 길을 선택하세요.';
    return '';
  }
  function objectState(p,o){
    o=typeof o==='string'?object(o):o;
    if(!o)return {visible:false,locked:true,complete:false,text:''};
    const s=p.exploration,a=activity(o.activityId),text=requirementsText(p,o);
    return {visible:true,locked:!!text||!!a&&!ready(s,a),complete:s.opened.includes(o.id)||!!a&&has(s,a.id)
      ||!!o.choiceId&&!!s.choices[o.choiceId]||!!o.to&&s.discovered.includes(o.to),text};
  }
  function nearby(p){return playable(p)?area(p.exploration.area).objects.filter(o=>inRange(p,o)).sort((a,b)=>
    Math.hypot(p.exploration.x-a.x,p.exploration.y-a.y)-Math.hypot(p.exploration.x-b.x,p.exploration.y-b.y)):[];}
  function baseHandle(o,phase){return {phase,objectId:o?.id||null,name:o?.name||'표현 연습',text:'',activity:null,
    choices:[],words:[],feedback:null,assisted:false,practice:false};}
  function install(p,h,extra={}){sessions.set(p,{h,phase:h.phase,area:p.exploration.area,objectId:h.objectId,attempts:0,aids:[],...extra});return h;}
  function info(p,o,text){const h=baseHandle(o,'info');h.text=text;return install(p,h);}
  function begin(p,a,o,practice=false){
    Engine.teach(p,a.tags);add(p.exploration.observed,a.id);
    const h=baseHandle(o,a.physical&&!practice?'seek':'question');
    h.activity=a;h.name=o?.name||a.english;h.text=a.objective;h.practice=practice;
    h.choices=Engine.shuffle(a.physical&&practice?a.reviewChoices:a.choices);
    h.words=Engine.shuffle(a.words||[]);
    return install(p,h,{activityId:a.id,practice});
  }
  function award(p,key,prize){
    const reward=blankReward(),s=p.exploration;
    if(s.rewarded.includes(key))return reward;
    add(s.rewarded,key);
    reward.gold=Math.max(0,Math.min(prize?.gold||0,Number.MAX_SAFE_INTEGER-p.gold));p.gold+=reward.gold;
    if(prize?.gearId&&RPG.grant(p,prize.gearId))reward.gearId=prize.gearId;
    if(prize?.potions){reward.potions=Math.max(0,Math.min(prize.potions,3-p.village.inventory.potion));p.village.inventory.potion+=reward.potions;}
    if(prize?.note&&!s.notes.includes(prize.note)){add(s.notes,prize.note);reward.note=prize.note;}
    return reward;
  }
  function mergeReward(a,b){a.gold+=b.gold;a.potions+=b.potions;for(const key of ['gearId','cosmetic','note'])if(b[key])a[key]=b[key];return a;}
  function questRewards(p){
    derive(p.exploration);const reward=blankReward();
    for(const q of D.quests)if(p.exploration.quests[q.id]==='complete')mergeReward(reward,award(p,'quest-'+q.id,q.reward));
    return reward;
  }
  function complete(p,a,o){
    const s=p.exploration,reward=blankReward(),first=!has(s,a.id);
    if(!first)return {reward,recruited:null};
    add(s.completed,a.id);
    if(o?.type==='chest'){add(s.opened,o.id);mergeReward(reward,award(p,'chest-'+o.id,o.reward));}
    const recruited=a.recruit&&!s.recruited.includes(a.recruit)?a.recruit:null;
    if(recruited&&!s.activeCompanion)s.activeCompanion=recruited;
    const alreadyComplete=s.completedChapter;derive(s);
    if(s.completedChapter&&!alreadyComplete)reward.cosmetic=s.choices.restoration==='mira'?'runeGlow':'leafGlow';
    mergeReward(reward,questRewards(p));return {reward,recruited};
  }
  function validSession(p,h,phases){const m=sessions.get(p);return playable(p)&&m&&m.h===h&&m.area===p.exploration.area
    &&phases.includes(m.phase)?m:null;}
  function settle(p,m,correct){
    const a=activity(m.activityId),h=m.h;
    m.attempts++;m.phase='feedback';m.correct=correct;h.phase='feedback';
    const assisted=m.aids.length>0||m.attempts>1;
    Engine.record(p,Q.find(q=>q.id===a.id),correct,{assisted,aids:[...m.aids],review:m.practice,mode:'choice'});
    if(m.practice)RPG.refresh(p);
    const outcome=correct&&!m.practice?complete(p,a,object(m.objectId)):{reward:blankReward(),recruited:null};
    h.feedback={correct,explanation:a.explanation,...outcome,completedChapter:p.exploration.completedChapter};
    return h.feedback;
  }
  function interact(p,id){
    if(!playable(p))return null;
    const o=object(id);if(!inRange(p,o))return null;
    const pending=sessions.get(p);
    if(pending){
      const a=activity(pending.activityId);
      if(pending.phase==='seek'&&a?.choices.includes(o.id)){settle(p,pending,o.id===a.answer);return pending.h;}
      return null;
    }
    const state=objectState(p,o);
    if(state.locked)return info(p,o,state.text||'먼저 현재 퀘스트의 안내를 따라가세요.');
    if(o.to){
      const reward=transition(p,o.id);
      return reward?{...baseHandle(o,'transition'),area:p.exploration.area,feedback:{correct:true,reward}}:null;
    }
    if(o.choiceId){
      const s=p.exploration;
      if(s.choices[o.choiceId])return info(p,o,'이미 선택한 길: '+(s.choices[o.choiceId]==='moon'?'달빛 길':s.choices[o.choiceId]==='stone'?'돌길':s.choices[o.choiceId]==='mira'?'미라의 비문':'브람의 장치')+'. 다른 도전은 탐험과 복습으로 다시 만날 수 있어요.');
      const h=baseHandle(o,'choice');h.choiceId=o.choiceId;
      h.options=o.choiceId==='crossroad'?[{id:'moon',name:'달빛 길',english:'Follow the blue lights.',ko:'파란 불빛을 따라가세요.'},
        {id:'stone',name:'고대의 돌길',english:'Follow the stone road.',ko:'돌길을 따라가세요.'}]:
        [{id:'mira',name:'미라와 비문 읽기',english:'Bring the words together.',ko:'말들을 하나로 모으세요.'},{id:'bram',name:'브람과 장치 찾기',english:'Look beside the blue crystal.',ko:'파란 수정 옆을 보세요.'}];
      h.choices=h.options.map(option=>option.id);h.text=o.choiceId==='crossroad'?'두 길은 다리 앞에서 다시 만나요. 선택한 길의 도전을 먼저 해결하세요.':'두 동료 모두 방법을 제안합니다. 원하는 동료와 수정을 복원하세요.';
      return install(p,h,{choiceId:o.choiceId});
    }
    const a=activity(o.activityId);
    if(a)return begin(p,a,o,has(p.exploration,a.id));
    if(o.type==='chest'){
      if(p.exploration.opened.includes(o.id))return info(p,o,'이미 연 보물 상자예요. 보상은 한 번만 받을 수 있어요.');
      add(p.exploration.opened,o.id);const reward=award(p,'chest-'+o.id,o.reward);
      const h=baseHandle(o,'reward');h.text='보물 상자를 열었어요.';h.feedback={correct:true,reward,explanation:h.text};return install(p,h);
    }
    return info(p,o,o.hidden?'작은 장치가 보여요. 주변 기록에서 단서를 찾아보세요.':'주변 안내를 읽으면 이 표식의 의미를 알 수 있어요.');
  }
  function answer(p,h,value){
    const m=validSession(p,h,['question']);if(!m||typeof value!=='string')return null;
    const a=activity(m.activityId);if(!a||!m.practice&&!inRange(p,object(m.objectId)))return null;
    const expected=m.practice&&a.physical?a.reviewAnswer:a.answer;
    if(a.kind==='order'){
      const tokens=normalize(value).split(' ').sort(),required=a.words.map(w=>normalize(w)).sort();
      if(tokens.length!==required.length||tokens.some((token,i)=>token!==required[i]))return null;
    }else if(!(m.practice&&a.physical?a.reviewChoices:a.choices).includes(value))return null;
    return settle(p,m,normalize(value)===normalize(expected));
  }
  function retry(p,h){
    const m=validSession(p,h,['feedback']);if(!m||m.correct||!m.activityId)return false;
    m.phase=activity(m.activityId).physical&&!m.practice?'seek':'question';h.phase=m.phase;h.feedback=null;h.assisted=true;
    return true;
  }
  function assist(p,h,reason='transcript'){
    const m=validSession(p,h,['question','seek']);
    if(!m||!m.activityId||!['transcript','fallback','translation'].includes(reason))return false;
    if(!m.aids.includes(reason))m.aids.push(reason);h.assisted=true;return true;
  }
  function hint(p,h){
    if(!assist(p,h,'translation'))return null;
    const a=activity(sessions.get(p).activityId);
    return (p.exploration.activeCompanion==='mira'?'미라: ':'힌트: ')+a.hint;
  }
  function choose(p,h,id){
    const m=validSession(p,h,['choice']),s=p.exploration;
    if(!m||!inRange(p,object(m.objectId))||s.choices[m.choiceId]||!(m.choiceId==='crossroad'?['moon','stone']:['mira','bram']).includes(id))return null;
    if(m.choiceId==='crossroad'&&!all(s,['f-mira','f-bram'])||m.choiceId==='restoration'&&(!has(s,'c-switch')||!s.recruited.includes(id)))return null;
    s.choices[m.choiceId]=id;if(m.choiceId==='restoration')s.activeCompanion=id;
    m.phase='feedback';h.phase='feedback';h.feedback={correct:true,reward:blankReward(),
      explanation:m.choiceId==='crossroad'?(id==='moon'?'파란 불빛의 메아리를 찾아 달빛 길을 탐험하세요.':'돌길의 글 조각을 찾아 문장을 완성하세요.'):
        (id==='mira'?'미라: I can read the words. 비문에서 말들을 하나로 이어 봐요.':'브람: I can find the switch. 파란 수정 옆 장치를 찾아봐요.')};
    return h;
  }
  function transition(p,objectId){
    if(!playable(p)||sessions.has(p))return false;
    const o=object(objectId),s=p.exploration;
    if(!o?.to||!inRange(p,o)||!all(s,o.requires||[])||!areaUnlocked(s,o.to))return false;
    s.area=o.to;Object.assign(s,o.spawn||area(o.to).spawn);
    if(!safePosition(p,s.area,s.x,s.y))Object.assign(s,area(s.area).spawn);
    s.direction='down';add(s.discovered,s.area);followers.delete(p);
    return questRewards(p);
  }
  function practice(p,id){
    const a=activity(id);if(!playable(p)||!a||sessions.has(p))return null;
    return begin(p,a,null,true);
  }
  function selectCompanion(p,id){
    if(!playable(p)||!p.exploration.recruited.includes(id)||sessions.has(p)&&sessions.get(p).phase!=='seek')return false;
    p.exploration.activeCompanion=id;followers.delete(p);return true;
  }
  function follow(p,dt){
    const s=p.exploration;
    if(!playable(p)||!s.activeCompanion){followers.delete(p);return null;}
    let f=followers.get(p);
    const offsets={up:[0,36],down:[0,-36],left:[36,0],right:[-36,0]},[dx,dy]=offsets[s.direction];
    const target=walkable(p,s.area,s.x+dx,s.y+dy)?{x:s.x+dx,y:s.y+dy}:{x:s.x,y:s.y};
    if(!f||f.area!==s.area||f.id!==s.activeCompanion||Math.hypot(f.x-s.x,f.y-s.y)>150||!walkable(p,s.area,f.x,f.y)){
      f={...target,id:s.activeCompanion,area:s.area,direction:s.direction};followers.set(p,f);
    }else{
      const t=Number.isFinite(dt)?1-Math.exp(-Math.max(0,Math.min(dt,.1))*8):0;
      const x=f.x+(target.x-f.x)*t,y=f.y+(target.y-f.y)*t;
      if(walkable(p,s.area,x,y)){f.x=x;f.y=y;}else Object.assign(f,target);
      f.direction=s.direction;
    }
    return {...f};
  }
  function sense(p){return playable(p)&&p.exploration.activeCompanion==='bram'?area(p.exploration.area).objects
    .filter(o=>o.hidden&&Math.hypot(p.exploration.x-o.x,p.exploration.y-o.y)<=160).map(o=>o.id):[];}
  function companionDialogue(p,id=p.exploration.activeCompanion){
    const c=D.companions.find(c=>c.id===id);if(!c||!p.exploration.recruited.includes(id))return null;
    const s=p.exploration;
    if(s.completedChapter)return {...c,english:'We found the forgotten path.',ko:'우리는 잊혀진 길을 찾았어요.'};
    if(s.area==='cavern')return {...c,english:id==='mira'?'Listen to the crystal.':'Look beside the blue crystal.',ko:id==='mira'?'수정의 말을 들어 보세요.':'파란 수정 옆을 보세요.'};
    if(s.area==='ruins'||s.area==='vault')return {...c,english:id==='mira'?'Can I help you read?':'Look behind the statue.',ko:id==='mira'?'읽는 것을 도와줄까요?':'조각상 뒤를 살펴보세요.'};
    return {...c};
  }
  function questStatus(p){return D.quests.map(q=>({...q,status:p.exploration.quests[q.id]}));}
  function objective(p){
    const s=p.exploration,m=sessions.get(p);
    const q=D.quests.find(q=>s.quests[q.id]==='active')||D.quests.at(-1);
    const result={questId:q.id,title:q.title,text:q.objective,targetId:null,area:s.area};
    if(m?.phase==='seek'){result.text=activity(m.activityId).objective;return result;}
    let target;
    if(q.id==='map')target=['f-map','f-rowan','f-directions'].find(id=>!has(s,id));
    if(q.id==='companions')target=['f-mira','f-bram'].find(id=>!has(s,id));
    if(q.id==='bridge')target=!s.choices.crossroad?'f-crossroad':!has(s,'f-'+s.choices.crossroad)?'f-'+s.choices.crossroad:!has(s,'f-bridge')?'f-bridge':'f-ruins';
    if(q.id==='fragments')target=['r-gate','r-inscription','r-door','r-fragment'].find(id=>!has(s,id));
    if(q.id==='path')target=s.completedChapter?null:!s.discovered.includes('cavern')?'r-cavern':
      ['c-listen','c-door','c-switch'].find(id=>!has(s,id))||(!s.choices.restoration?'c-choice':'c-final-'+s.choices.restoration);
    if(target){const o=object(target);result.targetId=target;result.area=o.area;result.text=o.name+'에서 다음 안내를 확인하세요.';}
    else result.text='말 수정을 복원했어요. 다른 길과 비밀 장소에서 남은 표현을 찾아보세요.';
    return result;
  }
  function dismissTutorial(p){if(!p.exploration)return false;p.exploration.tutorialSeen=true;return true;}
  return {fresh,hydrate,available,enter,move,walkable,solids,nearby,interact,answer,retry,hint,assist,close,current,
    choose,transition,practice,selectCompanion,follow,sense,companionDialogue,objectState,questStatus,objective,dismissTutorial};
})();
