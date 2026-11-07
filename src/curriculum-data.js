// Authored academy content is deliberately separate from the adventure question pool.
const Curriculum = (() => {
  const skills=['vocabulary','grammar','reading','listening','order','conversation'];
  const skillNames={vocabulary:'표현의 뜻 이해',grammar:'문장 형태 선택',reading:'짧은 글의 정보 이해',listening:'짧은 말의 정보 이해',order:'문장 순서 구성',conversation:'상황에 맞게 응답'};
  const themes=[
    ['인사와 공손한 표현','Greetings and Politeness','상황에 맞게 인사하고 감사·사과·부탁을 전해요.'],
    ['자기소개','Introductions','이름, 출신, 사는 곳과 직업을 소개해요.'],
    ['하루의 일과','Daily Routines','매일 하는 일과 습관을 설명해요.'],
    ['음식과 카페','Food and Cafés','음식과 음료를 공손하게 주문해요.'],
    ['쇼핑과 돈','Shopping and Money','물건, 가격, 크기와 결제 방법을 확인해요.'],
    ['길 찾기와 교통','Directions and Transport','길 안내를 이해하고 대중교통 정보를 물어요.'],
    ['시간과 일정','Time and Schedules','요일, 날짜와 약속 시간을 확인해요.'],
    ['여행과 호텔','Travel and Hotels','숙박과 여행에 필요한 정보를 주고받아요.'],
    ['직장 영어','Workplace English','일터에서 소개하고 부탁과 지시를 확인해요.'],
    ['건강과 일상의 필요','Health and Daily Needs','몸 상태와 필요한 도움을 간단히 표현해요.'],
    ['짧은 대화','Short Conversations','앞뒤 말을 살피며 자연스럽게 대화를 이어 가요.'],
    ['실전 영어 미션','Practical Missions','카페, 길 찾기, 시장과 일터의 일을 영어로 해결해요.']
  ];
  const units=themes.map(([name,en,description],i)=>({id:`u${String(i+1).padStart(2,'0')}`,name,en,description,order:i+1,targetCount:i<10?45:25,objectives:skills.map(s=>`u${String(i+1).padStart(2,'0')}.${s}`)}));
  const objectives=units.flatMap(u=>skills.map(skill=>({id:`${u.id}.${skill}`,unitId:u.id,skill,name:`${u.name} · ${skillNames[skill]}`,description:`${u.description} ${skillNames[skill]}을 연습합니다.`})));
  const activities=[],expressions=[],diagnostics=[],missions=[];
  let cached;
  function register(pack) {
    const targets={units,objectives,activities,expressions,diagnostics,missions};
    for(const [key,target] of Object.entries(targets)) {
      const ids=new Set(target.map(x=>x.id));
      for(const entry of pack[key]||[]) {if(!entry?.id||ids.has(entry.id))throw new Error(`Curriculum duplicate or missing ${key} ID: ${entry?.id}`);ids.add(entry.id);}
    }
    for(const [key,target] of Object.entries(targets))target.push(...(pack[key]||[]));
    cached=undefined;
  }
  function index() {
    if(!cached)cached=Object.fromEntries(Object.entries({units,objectives,activities,expressions,diagnostics,missions}).map(([key,list])=>[key,Object.assign(Object.create(null),Object.fromEntries(list.map(x=>[x.id,x])))]));
    return cached;
  }
  const get=id=>index().activities[id];
  // Each row is a single authored task, never a template expanded into numerical variants.
  // code | expression key(s) | tier | English stimulus | Korean task | answer | distractors/tokens | explanation | hint | optional accepted responses
  const codes={V:'vocabulary',G:'grammar',R:'reading',L:'listening',O:'order',C:'conversation'};
  function definePack(unitId,expressionText,rowText,start=1) {
    const ex=expressionText.trim()?expressionText.trim().split(/\r?\n/).filter(Boolean).map(row=>{const [id,english,ko]=row.split('|');return {id:`${unitId}.${id}`,unitId,english,ko};}):[];
    const rows=rowText.trim().split(/\r?\n/).filter(Boolean).map((row,i)=>{
      const [code,keys,tier,english,instruction,answer,options,explanation,hint,accepted='']=row.split('|');
      if(!codes[code]||hint===undefined)throw new Error(`Malformed authored row ${unitId}:${start+i}`);
      const skill=codes[code],type=code==='O'?'order':'choice',expressionIds=keys.split(',').map(k=>k.includes('.')?k:`${unitId}.${k}`);
      return {id:`${unitId}-${String(start+i).padStart(3,'0')}`,unitId,objectiveId:`${unitId}.${skill}`,objective:instruction,skill,tier:Number(tier),type,english,instruction,answer,
        alternatives:accepted?accepted.split('~'):[],choices:type==='order'?options.split('~'):[answer,...options.split('~')],distractors:type==='order'?[]:options.split('~'),
        explanation,expressionIds,audioText:skill==='listening'?english:'',fallback:skill==='listening'?{type:'text',text:english}:null,hint,contentVersion:1};
    });
    register({expressions:ex,activities:rows});
  }
  return {units,activities,expressions,objectives,diagnostics,missions,skills,register,index,get,definePack};
})();
