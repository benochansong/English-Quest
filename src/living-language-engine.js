/* Pure quest state: every accepted event carries the active run identity. */
const LivingAdventure=(()=>{
 const D=LivingLanguageData,clone=x=>JSON.parse(JSON.stringify(x));
 const fresh=()=>({version:1,serial:0,active:null,completed:[],rewards:[],records:{},history:[],location:'square'});
 const stages={clara:['intro','collect','deliver'],elena:['intro','straight','turn','bridge','river','talk','escort'],rowan:['intro','find','blue','combat','report']};
 const counters=['encountered','played','attempted','completed','independent','assisted','text','translation','replay','missed','reviews'];
 const owns=(o,k)=>Object.hasOwn(o,k);
 const validRecords=rows=>rows&&typeof rows==='object'&&!Array.isArray(rows)&&Object.entries(rows).every(([key,r])=>[...Object.keys(D.lines),'follow','combat'].includes(key)&&r&&counters.every(k=>Number.isSafeInteger(r[k])&&r[k]>=0&&r[k]<=1000000000)&&r.independent+r.assisted===r.completed);
 function valid(x){if(!x||x.version!==1||!Number.isSafeInteger(x.serial)||x.serial<0||!owns(D.locations,x.location)||!Array.isArray(x.completed)||!Array.isArray(x.rewards)||new Set(x.completed).size!==x.completed.length||new Set(x.rewards).size!==x.rewards.length||x.completed.some(k=>!owns(D.quests,k))||x.rewards.some(k=>!x.completed.includes(k))||!validRecords(x.records)||!Array.isArray(x.history)||x.history.length>30||x.history.some(r=>!r||!owns(D.quests,r.quest)||typeof r.runId!=='string'||typeof r.first!=='boolean'||!validRecords(r.records)))return false;
  if(x.completed.includes('elena')&&!x.completed.includes('clara')||x.completed.includes('rowan')&&!x.completed.includes('elena'))return false;
  if(x.active){const a=x.active;if(!owns(D.quests,a.quest)||!stages[a.quest].includes(a.stage)||a.runId!=='quest-'+x.serial||!Array.isArray(a.items)||new Set(a.items).size!==a.items.length||a.items.some(id=>!D.objects.some(o=>o.id===id&&['apple','bread'].includes(o.type)))||!['river','stone'].includes(a.route)||!a.evidence||typeof a.evidence!=='object'||Array.isArray(a.evidence)||!validRecords(a.baseline)||D.quests[a.quest].previous&&!x.completed.includes(D.quests[a.quest].previous))return false;for(const [stage,e]of Object.entries(a.evidence))if(!stages[a.quest].includes(stage)||!e||!['heard','played','text','translation','wrong','done'].every(k=>typeof e[k]==='boolean')||!Number.isSafeInteger(e.attempts)||e.attempts<0)return false;if(a.quest==='clara'&&a.stage==='deliver'&&a.items.length!==4)return false;if(a.quest==='rowan'&&['blue','combat','report'].includes(a.stage)&&x.location!=='ruins')return false;}
  for(const [key,r]of Object.entries(x.records))if(![...Object.keys(D.lines),'follow','combat'].includes(key)||!r||!counters.every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)||r.independent+r.assisted!==r.completed)return false;
  return true;
 }
 function migrate(ext){if(ext.adventure===undefined)ext.adventure=fresh();return valid(ext.adventure);}
 function instruction(x){const a=x.active;if(!a)return null;if(a.stage==='intro')return D.quests[a.quest].opening;return({collect:'supplies',deliver:'hand',straight:'straight',turn:a.route==='river'?'left':'right',bridge:'bridge',river:'river',talk:'found',escort:'follow',find:'find',blue:'blue',combat:'glowing',report:'done'})[a.stage]||null;}
 function row(x,key){return x.records[key]||=(Object.fromEntries(counters.map(k=>[k,0])));}
 function evidence(x){const a=x.active,key=instruction(x);if(!a||!key)return null;if(!a.evidence[a.stage]){a.evidence[a.stage]={heard:false,played:false,text:false,translation:false,wrong:false,done:false,attempts:0};row(x,key).encountered++;}return a.evidence[a.stage];}
 function mark(x,kind,runId,stage){const a=x.active;if(!a||a.runId!==runId||a.stage!==stage)return false;const e=evidence(x),r=row(x,instruction(x));if(kind==='played'||kind==='heard'){if(!e.played){e.played=true;r.played++;}if(kind==='heard')e.heard=true;}else if(kind==='text'||kind==='translation'){if(!e[kind]){e[kind]=true;r[kind]++;}}else if(kind==='replay')r.replay++;else return false;return true;}
 function attempt(x,correct){const e=evidence(x),r=row(x,instruction(x));e.attempts++;r.attempted++;if(!correct){e.wrong=true;r.missed++;return;}if(e.done)return;e.done=true;r.completed++;if(e.heard&&!e.text&&!e.translation&&!e.wrong)r.independent++;else r.assisted++;}
 function next(x,stage){x.active.stage=stage;evidence(x);}
 function start(x,quest,route='river'){if(x.active||!owns(D.quests,quest)||D.quests[quest].previous&&!x.completed.includes(D.quests[quest].previous))return{ok:false,message:'앞선 의뢰를 먼저 마쳐 주세요.'};x.serial++;x.active={quest,runId:'quest-'+x.serial,stage:'intro',items:[],route:route==='stone'?'stone':'river',evidence:{},baseline:clone(x.records)};x.location=D.quests[quest].home;evidence(x);return{ok:true};}
 function finish(x){const a=x.active,first=!x.completed.includes(a.quest);if(first){x.completed.push(a.quest);x.rewards.push(a.quest);}const records={};for(const [key,r]of Object.entries(x.records)){const delta=Object.fromEntries(counters.map(k=>[k,r[k]-(a.baseline[key]?.[k]||0)]));if(delta.encountered||delta.completed)records[key]=delta;}const result={quest:a.quest,runId:a.runId,first,records};x.history.push(result);x.history=x.history.slice(-30);x.active=null;return{ok:true,complete:true,result,message:first?'마을이 당신의 도움을 기억합니다.':'다시 연습했어요. 첫 보상은 중복되지 않습니다.'};}
 function action(x,{runId,type,id}){const a=x.active;if(!a||a.runId!==runId)return{ok:false,message:'지난 의뢰의 입력은 적용하지 않았어요.'};
  if(type==='cancel'){x.active=null;x.location='square';return{ok:true,message:'의뢰를 내려놓았어요. 모은 의뢰 물건은 반납했고, 완료 기록은 그대로예요.'};}
  if(type==='reply'&&a.stage==='intro'){const answer=a.quest==='clara'?'Of course!':a.quest==='elena'?'Where should I go?':'What should I do?';const good=id===answer;attempt(x,good);if(!good)return{ok:false,message:'지금 필요한 부탁에 답해 볼까요? 다시 듣거나 도움을 사용해도 괜찮아요.'};next(x,a.quest==='clara'?'collect':a.quest==='elena'?'straight':'find');return{ok:true,message:'부탁을 받았어요. 안내를 듣고 직접 행동하세요.'};}
  if(type==='move'){
   if(!owns(D.locations,id))return{ok:false};
   if(a.quest==='clara'){if(!['market','square','inn','gate'].includes(id))return{ok:false};x.location=id;return{ok:true};}
   if(a.quest==='elena'){
    const target={straight:'tree',turn:a.route==='river'?'bridge':'stone',bridge:'river',escort:'gate'}[a.stage];
    if(!target)return{ok:false,message:'주변의 사람이나 물건을 먼저 살펴보세요.'};if(id!==target){attempt(x,false);return{ok:false,message:'이 길은 안내와 달라요. 현재 위치에서 다시 선택할 수 있어요.',voice:'retry'};}
    attempt(x,true);x.location=id;if(a.stage==='escort')return finish(x);if(a.stage==='straight')next(x,'turn');else if(a.stage==='turn')next(x,'bridge');else next(x,'river');return{ok:true,message:'안내에 맞춰 길을 찾았어요.'};
   }
   if(a.quest==='rowan'&&a.stage==='find'){if(id!=='ruins'){attempt(x,false);return{ok:false,message:'빛나는 수정이 보이는 유적을 찾아보세요.'};}attempt(x,true);x.location='ruins';next(x,'blue');return{ok:true,message:'유적의 두 수정이 반응합니다.'};}
   if(a.quest==='rowan'&&a.stage==='report'&&id==='square'){x.location=id;return finish(x);}
  }
  if(type==='object'){
   const o=D.objects.find(o=>o.id===id);if(!o||o.location!==x.location||o.questId!==a.quest)return{ok:false,message:'현재 장소에 있는 물건만 선택할 수 있어요.'};
   if(a.quest==='clara'&&a.stage==='collect'){if(a.items.includes(id))return{ok:false,message:'이미 챙긴 물건이에요.'};if(!['apple','bread'].includes(o.type)){attempt(x,false);return{ok:false,message:o.type==='book'?'book은 책, bread는 빵이에요. 요청한 물건을 다시 찾아보세요.':'요청한 식료품을 다시 들어 보세요.',voice:o.type==='book'?'book':'try'};}a.items.push(id);if(a.items.filter(i=>i.startsWith('apple')).length===3&&a.items.includes('bread')){attempt(x,true);next(x,'deliver');}else{evidence(x).attempts++;row(x,'supplies').attempted++;}return{ok:true,message:o.label+'을 의뢰 가방에 넣었어요.'};}
   if(a.quest==='rowan'&&a.stage==='blue'){const good=id==='blue-crystal';attempt(x,good);if(!good)return{ok:false,message:'붉은 수정은 반응하지 않아요. 색 이름과 모양을 확인하세요.'};next(x,'combat');return{ok:true,message:'파란 수정이 빛나고 숲 슬라임이 나타났어요.'};}
  }
  if(type==='reply'&&a.quest==='clara'&&a.stage==='deliver'&&x.location==='market'){const good=id==='Here you are.';attempt(x,good);if(good)return finish(x);return{ok:false,message:'가져온 물건을 건네는 표현을 골라 보세요.'};}
  if(type==='inspect'&&a.quest==='elena'&&a.stage==='river'){const good=id==='traveler';attempt(x,good);if(good)next(x,'talk');return{ok:good,message:good?'강가에서 여행자를 찾았어요.':'돌 뒤에는 아무도 없어요. 강 가까이를 살펴보세요.'};}
  if(type==='reply'&&a.quest==='elena'&&a.stage==='talk'){const good=id==="You're welcome!";attempt(x,good);if(good)next(x,'escort');return{ok:good,message:good?'여행자가 동행합니다. 함께 마을 북문으로 돌아가세요.':'감사 인사에 자연스럽게 답해 보세요.'};}
  return{ok:false,message:'지금 목표에 맞는 장소나 행동을 선택하세요.'};
 }
 function combat(x,result){if(x.active?.quest!=='rowan'||x.active.stage!=='combat')return false;if(result.status==='victory'&&result.meaningful>0){const r=row(x,'combat');r.encountered++;r.played+=result.audioPlayed||0;r.attempted++;r.completed++;r.independent+=result.independent>0?1:0;r.assisted+=result.independent>0?0:1;next(x,'report');return true;}return false;}
 function level(r){return !r?.completed?'Guided':r.independent>=2?'Familiar':'Practice';}
 return{fresh,valid,migrate,instruction,mark,start,action,combat,level};
})();
