/* Isolated Reborn lesson definitions. No campaign records, browser APIs or audio. */
const RebornLearning = (() => {
  const expressions = Object.freeze({
    left: Object.freeze({id:'left',voiceId:'VO_MOVE_LEFT',english:'Move left!',ko:'왼쪽으로 이동해요!',action:'left',explanation:'Move는 이동하다, left는 왼쪽이에요. 왼쪽 이동을 선택해 보세요.'}),
    dodge: Object.freeze({id:'dodge',voiceId:'VO_WATCH_OUT',english:'Watch out!',ko:'조심해요!',action:'dodge',explanation:'Watch out!은 위험을 조심하라는 말이에요. 여기서는 회피로 위험을 피할 수 있어요.'}),
    attack: Object.freeze({id:'attack',voiceId:'VO_ATTACK_SLIME',english:'Attack the slime!',ko:'슬라임을 공격해요!',action:'attack',explanation:'Attack은 공격하다예요. the slime은 지금 앞에 있는 슬라임을 가리켜요.'}),
    magic: Object.freeze({id:'magic',voiceId:'VO_USE_MAGIC',english:'Use your magic!',ko:'마법을 사용해요!',action:'magic',explanation:'Use는 사용하다, your magic은 여러분의 마법이에요. 마법을 선택해 보세요.'}),
    fire: Object.freeze({id:'fire',voiceId:'VO_NEED_FIRE',english:'I need fire.',ko:'나는 불이 필요해요.',action:null,explanation:'I(나는) + need(필요해요) + fire(불)의 순서예요. I need …로 필요한 것을 말할 수 있어요.'}),
    crystal: Object.freeze({id:'crystal',voiceId:'VO_ATTACK_CRYSTAL',english:'Attack the crystal!',ko:'수정을 공격해요!',action:'attack',explanation:'Attack은 공격하다, the crystal은 빛나는 수정이에요. 노출된 수정에 검을 맞히면 한 번 더 강하게 공격할 수 있어요.'})
  });
  const tutorial = Object.freeze([
    Object.freeze({english:'Move left!',ko:'왼쪽으로 이동해요!',voiceId:'VO_MOVE_LEFT',text:'A / ←, D / →로 이동해요. J를 차례로 눌러 3연격을 잇고, K로 바라보는 방향으로 회피해요. 누르고 있기만 하면 연격이 나가지 않아요.'}),
    Object.freeze({english:'Watch out! · Attack the slime!',ko:'조심해요! · 슬라임을 공격해요!',voiceId:'VO_WATCH_OUT',text:'슬라임이 몸을 움츠리면 공격 예고예요. 경고 지점에서 벗어나고, 공격 뒤 빈틈에 검을 사용해요.'}),
    Object.freeze({english:'Use your magic! · I need fire.',ko:'마법을 사용해요! · 나는 불이 필요해요.',voiceId:'VO_USE_MAGIC',text:'영어를 처음 배울 때는 적이 멈춰요. 익힌 표현은 전투에서 듣고 행동해요. 소리를 놓치면 도움을 눌러 안전하게 멈출 수 있어요. 숲의 수정에서 L 마법을 배워요.'})
  ]);
  const actions = Object.freeze(['left','right','attack','dodge','magic']);
  const normalize = value => typeof value === 'string' ? value.trim().toLowerCase().replace(/[.!?]+$/,'').replace(/\s+/g,' ') : '';
  function challenge(key, id) {
    const e = expressions[key];
    if (!e) return null;
    return {id,kind:key==='fire'?'magic':'listen',expressionId:key,voiceId:e.voiceId,
      target:key==='fire'?'I need fire.':e.action,action:e.action,
      prompt:key==='fire'?'“나는 불이 필요해요.”를 영어로 완성해 보세요.':'안내를 듣고 알맞은 행동을 선택해 보세요.',
      english:e.english,ko:e.ko,choices:key==='fire'?['I fire need.','I need fire.','Need fire I.']:[...actions],
      words:key==='fire'?['fire','I','need']:null,feedback:'',explanation:e.explanation,
      assisted:false,aids:[],heard:false,source:null,attempts:0,completed:false,phase:'answer'};
  }
  function evaluate(key, value) {
    if (!expressions[key]) return {valid:false,correct:false};
    if (key==='fire') {
      if (Array.isArray(value)) {
        if (value.length!==3 || value.some(x=>typeof x!=='string') || [...value].map(normalize).sort().join('|')!=='fire|i|need') return {valid:false,correct:false};
        value=value.join(' ');
      }
      if (typeof value!=='string' || value.length>80 || !normalize(value)) return {valid:false,correct:false};
      // Accept only the taught three-word sentence, not a substring or fuzzy match.
      return {valid:true,correct:normalize(value)==='i need fire'};
    }
    if (!actions.includes(value)) return {valid:false,correct:false};
    return {valid:true,correct:value===expressions[key].action};
  }
  const bossLesson=Object.freeze({english:'Attack the crystal!',ko:'수정을 공격해요!',voiceId:'VO_ATTACK_CRYSTAL',text:'챔피언이 수정 돌진을 마치면 중심 수정이 열려요. 안내를 이해한 뒤 빛나는 수정에 검을 맞히면 한 번 더 강한 공격과 경직이 생겨요.'});
  // Session-only evidence. Replay and re-answering the same opportunity cannot advance it.
  function createProgress(){
    const entries=Object.fromEntries(Object.keys(expressions).map(key=>[key,{introduced:false,stage:'guided',independent:0,streak:0,actual:0,misses:0,lastResult:null}]));
    const settled=new Set();
    function record(key,id,{success,heard=false,assisted=false,actual=false}={}){
      const row=entries[key];if(!row||!id||settled.has(id))return false;settled.add(id);
      if(success)row.introduced=true;
      if(success&&heard&&!assisted){row.independent++;row.streak++;if(actual)row.actual++;row.lastResult='independent';}
      else {row.streak=0;row.lastResult=success?'assisted':'review';if(!success)row.misses++;}
      const needsAction=['dodge','crystal','fire'].includes(key);
      row.stage=!row.introduced?'guided':row.streak>=2&&(!needsAction||row.actual>0)?'familiar':'practice';
      return true;
    }
    return{entries,record,ready:key=>entries[key]?.stage==='familiar',introduced:key=>!!entries[key]?.introduced};
  }
  return Object.freeze({expressions,tutorial,bossLesson,actions,challenge,evaluate,createProgress});
})();
