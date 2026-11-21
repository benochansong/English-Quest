/* Isolated Reborn lesson definitions. No campaign records, browser APIs or audio. */
const RebornLearning = (() => {
  const expressions = Object.freeze({
    left: Object.freeze({id:'left',voiceId:'VO_MOVE_LEFT',english:'Move left!',ko:'왼쪽으로 이동해요!',action:'left',explanation:'Move는 이동하다, left는 왼쪽이에요. 왼쪽 이동을 선택해 보세요.'}),
    dodge: Object.freeze({id:'dodge',voiceId:'VO_WATCH_OUT',english:'Watch out!',ko:'조심해요!',action:'dodge',explanation:'Watch out!은 위험을 조심하라는 말이에요. 여기서는 회피로 위험을 피할 수 있어요.'}),
    attack: Object.freeze({id:'attack',voiceId:'VO_ATTACK_SLIME',english:'Attack the slime!',ko:'슬라임을 공격해요!',action:'attack',explanation:'Attack은 공격하다예요. the slime은 지금 앞에 있는 슬라임을 가리켜요.'}),
    magic: Object.freeze({id:'magic',voiceId:'VO_USE_MAGIC',english:'Use your magic!',ko:'마법을 사용해요!',action:'magic',explanation:'Use는 사용하다, your magic은 여러분의 마법이에요. 마법을 선택해 보세요.'}),
    fire: Object.freeze({id:'fire',voiceId:'VO_NEED_FIRE',english:'I need fire.',ko:'나는 불이 필요해요.',action:null,explanation:'I(나는) + need(필요해요) + fire(불)의 순서예요. I need …로 필요한 것을 말할 수 있어요.'})
  });
  const tutorial = Object.freeze([
    Object.freeze({english:'Move left!',ko:'왼쪽으로 이동해요!',voiceId:'VO_MOVE_LEFT',text:'A / ←, D / →로 이동해요. J로 검을 휘두르고 K로 바라보는 방향으로 회피해요.'}),
    Object.freeze({english:'Watch out! · Attack the slime!',ko:'조심해요! · 슬라임을 공격해요!',voiceId:'VO_WATCH_OUT',text:'슬라임이 몸을 움츠리면 공격 예고예요. 경고 지점에서 벗어나고, 공격 뒤 빈틈에 검을 사용해요.'}),
    Object.freeze({english:'Use your magic! · I need fire.',ko:'마법을 사용해요! · 나는 불이 필요해요.',voiceId:'VO_USE_MAGIC',text:'영어를 듣는 동안 적은 멈춰요. 소리가 없으면 자막이나 한국어 도움을 볼 수 있어요. 숲의 수정에서 L 마법을 배워요.'})
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
  return Object.freeze({expressions,tutorial,actions,challenge,evaluate});
})();
