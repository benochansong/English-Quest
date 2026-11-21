/* Reborn Combat Lab: deterministic simulation, deliberately separate from v0.8. */
const RebornCombat = (() => {
  const freeze = x => { Object.values(x).forEach(v=>{if(v && typeof v==='object') freeze(v);}); return Object.freeze(x); };
  const CONFIG = freeze({
    width:1000,height:560,ground:425,minX:60,maxX:940,step:1/120,maxDelta:.25,
    player:{hp:100,startX:170,speed:220,acceleration:1900,deceleration:2300,reversal:2800,radius:18,hitTime:.24,hitInvulnerability:.55,knockback:18},
    sword:{damage:8,range:104,height:85,cooldown:.35,anticipation:.065,swing:.09,follow:.15,charge:14,knockback:8,comboWindow:.65,bufferStart:.025,
      strikes:[{damage:8,range:104,height:85,anticipation:.065,swing:.09,follow:.15,cooldown:.35,knockback:8,charge:14},
        {damage:10,range:112,height:100,anticipation:.075,swing:.11,follow:.17,cooldown:.39,knockback:14,charge:16},
        {damage:16,range:126,height:105,anticipation:.11,swing:.14,follow:.24,cooldown:.52,knockback:32,charge:20}]},
    feel:{contactPoseFraction:.35,counterWindow:1.2,counterCharge:8,entry:.65,victory:.7,recoil:.22,golemKnockback:.3},
    dodge:{duration:.30,invulnerability:.18,cooldown:.65,speed:490,perfectCharge:20,perfectDisplay:.7},
    magic:{damage:32,charge:100,cooldown:8,chargeTime:.5,release:.38,projectileSpeed:740,projectileRadius:13,projectileLife:2.5,maxProjectiles:3},
    learning:{charge:25,stun:.9,coreWindow:3.6,coreMultiplier:1.5,coreStagger:.7},
    feedback:{lightStop:.05,mediumStop:.06,finisherStop:.09,magicStop:.095,bossStop:.11,lightShake:.035,heavyShake:.16,knockbackDecay:180,maxEffects:64,maxEvents:100},
    slime:{hp:70,startX:690,radius:38,speed:43,approachRange:215,idle:.55,recovery:.85,hitReaction:.12,
      patterns:[{id:'jump',telegraph:.85,duration:.55,damage:8,radius:46,lift:74},{id:'rush',telegraph:1.05,duration:.42,damage:7,radius:42,lift:0}]},
    boss:{hp:160,startX:740,radius:58,speed:50,approachRange:290,idle:.45,recovery:1.05,hitReaction:.10,phaseSpeed:.87,intro:.9,
      phaseA:['crystal_charge','heavy_jump','forward_rush'],phaseB:['heavy_jump','triple_bounce','crystal_charge','forward_rush'],
      patterns:[{id:'heavy_jump',telegraph:1.05,duration:.62,damage:16,radius:70,lift:126},{id:'forward_rush',telegraph:.95,duration:.46,damage:11,radius:53,lift:0},{id:'triple_bounce',telegraph:.8,duration:.32,damage:8,radius:54,lift:72,repeat:3,repeatTelegraph:.5},{id:'crystal_charge',telegraph:1.2,duration:.52,damage:14,radius:58,lift:0}]}
  });
  const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
  const countdown=(value,dt)=>value-dt<1e-8?0:value-dt;
  const approach=(value,target,amount)=>value<target?Math.min(value+amount,target):Math.max(value-amount,target);
  const rushPatterns=new Set(['rush','forward_rush','crystal_charge']);
  const activeModes=new Set(['EXPLORATION','COMBAT','PLAYER_HIT']);
  const field=typeof RebornBattlefield==='undefined'?null:RebornBattlefield;
  const journey=typeof RebornJourney==='undefined'?null:RebornJourney;
  const enemyConfig=kind=>CONFIG[kind]||field?.configs[kind];
  function create({flow=true}={}) {
    const progress=RebornLearning.createProgress();
    let generation=0,accumulator=0,events=[],held=new Set(),attack=null,dodge=null,enemyData=null,pending=null,pausedMode=null,moved=0,scripted=new Set(),serial=0,comboHits=0,cast=null,shots=[],goals=new Set();
    const state={};
    const emit=(type,extra={})=>{events.push({type,...extra,session:state.session});if(events.length>CONFIG.feedback.maxEvents)events.shift();};
    const soundIds={sword_swing:'sword',sword_impact:'impact',slime_bounce:'bounce',slime_warning:'slimeAttack',slime_rush:'slimeAttack',slime_jump:'bounce',slime_land:'impact',slime_defeat:'impact',player_hit:'playerHit',magic_charge:'magicCharge',magic_explosion:'magicExplosion',boss_entrance:'bossEntrance',boss_defeat:'bossDeath',boss_phase:'charge',crystal_charge:'charge',correct:'magic',incorrect:'bounce',defeat:'bossDeath'};
    const sfx=id=>emit('sfx',{id:soundIds[id]||id});
    const voice=(id,extra={})=>{state.lastVoiceId=id;emit('voice',{id,priority:20,...extra});};
    const currentOpportunity=()=>state.challenge||state.flowCue;
    function cancelCue(stopVoice=true){if(stopVoice&&state.flowCue)emit('voice-cancel',{opportunityId:state.flowCue.id});state.flowCue=null;}
    function cue(key,extra={}){
      if(!flow)return null;
      cancelCue();const phrase=RebornLearning.expressions[key];
      const c={id:`${state.session}:action:${++serial}`,expressionId:key,voiceId:phrase.voiceId,heard:false,source:null,assisted:false,aids:[],age:0,ttl:6,startX:state.player.x,heardX:state.player.x,acted:false,damaged:false,...extra};
      state.flowCue=c;state.stats.flow.actionOpportunities++;
      if(!state.encounterExpressions.includes(key))state.encounterExpressions.push(key);
      voice(c.voiceId,{priority:key==='crystal'?95:key==='dodge'?90:85,opportunityId:c.id});return c;
    }
    function finishCue(success,reason='missed'){
      const c=state.flowCue;if(!c)return;
      const independent=!!(success&&c.heard&&!c.assisted&&c.acted&&!c.shortcut&&(c.expressionId==='dodge'||c.intentAfterHeard));
      if(!c.shortcut||!success)progress.record(c.expressionId,c.id,{success,heard:c.heard,assisted:!independent,actual:success&&c.acted});
      const f=state.stats.flow;f.actionSuccesses+=success?1:0;f.independentActions+=independent?1:0;
      if(independent&&!f.independentExpressions.includes(c.expressionId))f.independentExpressions.push(c.expressionId);
      if(independent&&!state.encounterIndependent.includes(c.expressionId))state.encounterIndependent.push(c.expressionId);
      if(success&&c.assisted)state.encounterActionCounts.assisted++;
      if(success&&!c.heard)state.encounterActionCounts.text++;
      if(success&&!state.stats.expressions.includes(RebornLearning.expressions[c.expressionId].english))state.stats.expressions.push(RebornLearning.expressions[c.expressionId].english);
      if(!independent&&!(success&&c.shortcut))review(c.expressionId,success?'hint':reason);
      f.outcomes.push({id:c.id,key:c.expressionId,success,heard:c.heard,assisted:c.assisted,independent,actual:c.acted,reason:success?'action':reason});if(f.outcomes.length>128)f.outcomes.shift();
      state.flowFeedback={text:success?(independent?'소리를 듣고 행동했어요 · ':'행동 성공 · ')+({dodge:'반격할 틈이에요',crystal:'수정 약점 적중',fire:'불꽃 적중'}[c.expressionId]||'좋아요'):'놓쳐도 괜찮아요 · 도움 버튼으로 안전하게 다시 들어요',remaining:2.4};
      if(success)emit('voice-release',{opportunityId:c.id});
      cancelCue(!success);
    }
    function audioEvent(value){
      if(!flow)return;const a=state.stats.flow.audio;if(Object.hasOwn(a,value))a[value]++;
      if(value==='muted'){const op=currentOpportunity();if(op){op.heard=false;op.source=null;}if(pending){pending.heard=false;pending.source=null;}}
    }
    function learnAgain(){
      if(!flow||!state.magicUnlocked)return false;
      if(state.mode==='PAUSED')resume();if(state.mode!=='COMBAT')return false;
      cancelCue();openChallenge('fire','review');assist('hint');return true;
    }
    function mode(value) { state.mode=value;emit('scene',{mode:value,stage:state.stage}); }
    function effect(type,x,y,life,value=0,meta={}) {state.effects.push({type,x,y,life,ttl:life,value,...meta});if(state.effects.length>CONFIG.feedback.maxEffects)state.effects.shift();}
    function pose(value,duration=0) {state.player.pose=value;state.player.poseTime=0;state.player.poseDuration=duration;}
    function clearInput() {held.clear();}
    function resetCombo(){attack=null;comboHits=0;Object.assign(state.player,{comboIndex:0,comboNext:1,comboWindowRemaining:0,comboBuffered:false});}
    function clearTransient(){resetCombo();dodge=null;cast=null;shots=[];state.cast=null;state.projectiles=shots;state.player.vx=0;state.player.counterRemaining=0;clearInput();}
    function goal(id){if(goals.has(id))return;goals.add(id);state.stats.goals.push(id);emit('goal',{id});}
    function review(key,reason){const e=RebornLearning.expressions[key];if(!state.encounterReview.includes(key))state.encounterReview.push(key);let r=state.stats.reviewExpressions.find(x=>x.id===key);if(!r){r={id:key,voiceId:e.voiceId,english:e.english,ko:e.ko,reasons:[]};state.stats.reviewExpressions.push(r);}if(!r.reasons.includes(reason))r.reasons.push(reason);}
    function reset() {
      generation++;accumulator=0;events=[];held.clear();attack=null;dodge=null;enemyData=null;pending=null;pausedMode=null;moved=0;scripted=new Set();serial=0;comboHits=0;cast=null;shots=[];goals=new Set();
      Object.assign(state,{mode:'INTRO',stage:'entrance',time:0,session:generation,
        player:{x:CONFIG.player.startX,y:CONFIG.ground,vx:0,runPhase:0,facing:1,hp:CONFIG.player.hp,maxHp:CONFIG.player.hp,pose:'idle',poseTime:0,poseDuration:0,attackCooldown:0,dodgeCooldown:0,invulnerable:0,magicCharge:0,magicCooldown:0,comboIndex:0,comboNext:1,comboWindowRemaining:0,comboBuffered:false,perfectDodge:0,counterRemaining:0,weaknessCharge:0},
        enemy:null,effects:[],projectiles:[],cast:null,bossIntro:null,challenge:null,tutorial:null,magicUnlocked:false,awaitingProceed:true,lastVoiceId:'VO_HELLO',feedback:'',hitStop:0,shake:0,shakePower:0,
        flowEnabled:flow,learning:progress.entries,flowCue:null,flowFeedback:null,lastWarningAt:-10,route:'lab',selection:null,adventure:null,encounterReport:null,fieldNotice:'',encounterTime:0,
        stats:{correct:0,wrong:0,assisted:0,independent:0,expressions:[],reviewExpressions:[],goals:[],combat:{damageDealt:0,damageReceived:0,dodges:0,successfulDodges:0,perfectDodges:0,highestCombo:0,magicUsed:0,magicHits:0,weaknessHits:0,swordHits:0,counterattacks:0},listening:{correct:0,wrong:0,assisted:0,independent:0,asset:0,fallback:0,unheard:0},magic:{correct:0,wrong:0,assisted:0,independent:0}},
        objective:'로완과 함께 숲의 첫 시험을 시작해요.',reward:null});
      state.stats.flow={forcedScreens:0,forcedSeconds:0,sentenceArrangements:0,actionOpportunities:0,actionSuccesses:0,independentActions:0,heardExpressions:[],independentExpressions:[],helpExpressions:[],outcomes:[],audio:{requested:0,playing:0,ended:0,stopped:0,error:0,missing:0,muted:0,blocked:0,ignored:0}};
      state.stats.battlefield={missedAttacks:0,groundings:0,shieldBreaks:0,wrongCrystals:0};
      Object.assign(state,{encounterExpressions:[],encounterHeard:[],encounterHelp:[],encounterReview:[],encounterIndependent:[],encounterActionCounts:{assisted:0,text:0},encounterBase:null,encounterPeakCombo:0,encounterOutcomeStart:0,transition:null,presentationRemaining:0});
      return state;
    }
    reset();
    function tutorial(index) {
      const item=RebornLearning.tutorial[index];
      state.tutorial={...item,index,total:RebornLearning.tutorial.length};state.objective=item.text;
      mode('TUTORIAL');voice(item.voiceId);
    }
    function exploration() {
      state.tutorial=null;state.awaitingProceed=false;state.objective='A / D 또는 ← / →로 숲을 걸어 보세요. J 검 · K 회피';mode('EXPLORATION');
    }
    function start(skipTutorial=false) {
      if(state.mode==='TUTORIAL'&&skipTutorial){clearInput();exploration();return true;}
      if(state.mode!=='INTRO') return false;
      clearInput();if(skipTutorial) exploration();else tutorial(0);return true;
    }
    function spawn(kind) {
      cancelCue();
      const c=enemyConfig(kind);state.stage=kind;state.awaitingProceed=false;state.challenge=null;pending=null;state.encounterTime=0;
      Object.assign(state,{encounterBase:JSON.parse(JSON.stringify(state.stats)),encounterPeakCombo:0,encounterOutcomeStart:state.stats.flow.outcomes.length,encounterExpressions:[],encounterHeard:[],encounterHelp:[],encounterReview:[],encounterIndependent:[],encounterActionCounts:{assisted:0,text:0},encounterReport:null,fieldNotice:''});
      clearTransient();pose('idle');
      state.player.x=kind==='boss'?230:state.player.x;
      state.player.invulnerable=0;
      if(field?.configs[kind]){
        state.player.x=170;state.player.weaknessCharge=0;state.enemy=field.create(kind,state.player);state.enemy.entryRemaining=CONFIG.feel.entry;enemyData={perfect:false,hit:false,staggerTime:0};
        mode('COMBAT');objectiveCombat();return;
      }
      state.enemy={id:kind==='boss'?'slime-champion':'green-slime',kind,x:c.startX,y:CONFIG.ground,lift:0,hp:c.hp,maxHp:c.hp,ai:'IDLE',aiTime:0,pattern:c.patterns[0].id,phase:1,facing:-1,telegraphRemaining:0,attackTargetX:state.player.x,landingTargetX:state.player.x,attackDuration:0,attackProgress:0,attackRadius:c.patterns[0].radius,coreExposed:false,coreRemaining:0,attackSerial:0,entryRemaining:CONFIG.feel.entry};
      enemyData={patternIndex:0,pattern:null,originX:c.startX,hit:false,repeats:0,resume:null,recovery:c.recovery,staggerTime:0,perfect:false,phaseIndex:0};
      state.objective=kind==='boss'?'슬라임 챔피언: 공격 예고를 피하고 빈틈에 반격해요.':'초록 슬라임: 가까이 다가가 J로 공격하고, 공격 예고를 보고 K로 회피해요.';
      if(kind==='boss'){state.bossIntro={...RebornLearning.bossLesson,remaining:c.intro,duration:c.intro,automatic:flow&&progress.introduced('crystal')};state.enemy.ai='ENTRANCE';mode('BOSS_INTRO');voice(state.bossIntro.automatic?'VO_BOSS':'VO_ATTACK_CRYSTAL');}
      else {mode('COMBAT');voice('VO_SLIME_COMING');}
      sfx(kind==='boss'?'boss_entrance':'slime_bounce');
    }
    function openChallenge(key,context) {
      cancelCue();
      clearInput();resetCombo();dodge=null;state.player.vx=0;state.player.invulnerable=0;
      const h=RebornLearning.challenge(key,`${state.session}:${++serial}`);
      if(!state.encounterExpressions.includes(key))state.encounterExpressions.push(key);
      state.challenge=h;pending={h,key,context,locked:false,correct:false,aids:new Set(),heard:false,source:null};
      state.awaitingProceed=false;state.objective=h.prompt;pose(key==='fire'?'magic_charge':'idle');
      state.stats.flow.forcedScreens++;if(key==='fire')state.stats.flow.sentenceArrangements++;
      mode(key==='fire'?'MAGIC_CHALLENGE':'LISTENING_CHALLENGE');voice(h.voiceId,{priority:100,opportunityId:h.id});
      if(key==='fire') sfx('magic_charge');
    }
    function fieldOpportunity(key,ttl){
      if(!activeModes.has(state.mode))return;
      if(state.flowCue)finishCue(false,'expired');
      if(!progress.introduced(key)){
        if(key==='crystal'){openChallenge(key,'combat');return;}
        openChallenge(key,'field');state.challenge.kind='action';state.challenge.prompt='지시를 듣고 환경을 활용해요. 수정 곁에서 E 또는 상호작용 버튼을 누를 수 있어요.';pending.ttl=ttl;return;
      }
      cue(key,{ttl});
    }
    function fieldWarning(){
      enemyData.perfect=false;
      if(!activeModes.has(state.mode)||state.flowCue)return;
      if(!progress.introduced('dodge')){openChallenge('dodge','combat');return;}
      if(!state.flowCue&&state.time-state.lastWarningAt>=6){state.lastWarningAt=state.time;cue('dodge',{attackSerial:state.enemy.attackSerial,ttl:5,enemyId:state.enemy.id});}
    }
    function settleWarning(safe){
      const c=state.flowCue;if(c?.expressionId!=='dodge')return;
      c.acted=Math.abs(state.player.x-(c.heard?c.heardX:c.startX))>=30||enemyData.perfect;finishCue(!c.damaged&&(safe||enemyData.perfect)&&c.acted);
    }
    const fieldAPI={effect,sfx,contact:enemyContact,warning:fieldWarning,opportunity:fieldOpportunity,settleWarning,metric:key=>state.stats.battlefield[key]++,core:open=>{state.player.weaknessCharge=open?1:0;}};
    function interact(){
      if(!activeModes.has(state.mode)||!field?.configs[state.enemy?.kind])return false;
      const result=field.interact(state.enemy,state.player,fieldAPI);state.fieldNotice=result.message||'바람이 까마귀를 붙잡았어요! 가까이 다가가 검으로 반격하세요.';
      if(result.wrong){state.stats.battlefield.wrongCrystals++;assist('correction');if(state.flowCue)progress.record('blue',state.flowCue.id+':miss',{success:false});}
      if(result.ok){if(result.key==='wind')state.stats.battlefield.groundings++;const c=state.flowCue;if(c?.expressionId===result.key){c.acted=true;c.intentAfterHeard=c.heard;finishCue(true);}if(result.key==='blue')field.breakShield(state.enemy,fieldAPI,'crystal');}
      return result.ok;
    }
    function selectEncounter(kind){
      if(!['INTRO','VICTORY','DEFEAT'].includes(state.mode)||!['slime','raven','golem','boss'].includes(kind))return false;
      reset();state.route='practice';state.selection=kind;state.magicUnlocked=true;state.player.magicCharge=100;spawn(kind);return true;
    }
    function startStory(){
      if(!journey||!['INTRO','VICTORY','DEFEAT'].includes(state.mode))return false;
      reset();state.route='story';state.adventure={index:0,history:[]};state.magicUnlocked=true;state.player.magicCharge=100;spawn('slime');state.fieldNotice=journey.scenes.slime.text;return true;
    }
    function advanceEncounter(){
      if(state.mode!=='ENCOUNTER_CLEAR'||state.route!=='story'||state.adventure.index>=2)return false;
      clearTransient();cancelCue();state.adventure.index++;const next=journey.encounters[state.adventure.index];state.transition={next,remaining:1.2,text:journey.scenes[next].text};mode('TRANSITION');voice('VO_FOLLOW');return true;
    }
    function retryEncounter(){
      if(!['DEFEAT','ENCOUNTER_CLEAR'].includes(state.mode)||state.route!=='story')return false;
      const index=state.adventure.index,history=state.adventure.history.slice(0,index);reset();state.route='story';state.adventure={index,history};state.magicUnlocked=true;state.player.magicCharge=100;spawn(journey.encounters[index]);return true;
    }
    function ai(value) { const e=state.enemy;if(!e)return;e.ai=value;e.aiTime=0;e.attackProgress=0;e.lift=0; }
    function stagger(duration,interrupt=false){
      const e=state.enemy;if(!e||e.hp<=0)return;
      if(interrupt){enemyData.resume=null;enemyData.repeats=0;enemyData.recovery=.5;}
      else if(e.ai!=='HIT_REACTION'&&e.ai!=='STAGGER')enemyData.resume={ai:e.ai,time:e.aiTime,lift:e.lift};
      enemyData.staggerTime=duration;ai('STAGGER');
    }
    function stun() { if(state.enemy?.kind==='boss')stagger(CONFIG.learning.stun);else if(state.enemy?.hp>0){enemyData.recovery=CONFIG.learning.stun;enemyData.repeats=0;enemyData.resume=null;ai('RECOVERY');} }
    function objectiveCombat() { state.objective=state.stage==='golem'?'수정 골렘 · 예고를 피하고, 동료가 말한 수정 곁에서 E로 방어막을 깨세요.':state.stage==='raven'?'그림자 까마귀 · 급강하를 피하고, 낮아지는 틈에 바람 수정 E로 반격 기회를 만드세요.':state.stage==='boss'?'슬라임 챔피언: 경고 지점을 벗어나고, 회복 중 반격해요. L 마법도 사용해요.':'J 검 · K 회피 — 슬라임이 몸을 움츠리면 공격 예고예요.'; }
    function proceed() {
      if(state.mode==='PAUSED') return false;
      if(pending?.context==='field'&&state.challenge===pending.h){
        const {key,h,ttl}=pending;progress.entries[key].introduced=true;progress.entries[key].stage=progress.ready(key)?'familiar':'practice';pending=null;state.challenge=null;
        mode('COMBAT');objectiveCombat();cue(key,{id:h.id,heard:h.heard,source:h.source,assisted:h.assisted,aids:[...h.aids],ttl});return true;
      }
      if(state.mode==='BOSS_INTRO'){state.bossIntro=null;ai('IDLE');mode('COMBAT');objectiveCombat();return true;}
      if(state.mode==='TUTORIAL') {const n=state.tutorial.index+1;if(n<RebornLearning.tutorial.length)tutorial(n);else exploration();return true;}
      if(state.mode==='EXPLORATION' && state.stage==='entrance'){spawn('slime');return true;}
      if(state.mode==='EXPLORATION' && state.stage==='crystal'){
        if(flow&&progress.ready('fire')){state.magicUnlocked=true;state.player.magicCharge=CONFIG.magic.charge;state.player.magicCooldown=0;spawn('boss');}
        else openChallenge('fire','discovery');return true;
      }
      if(!pending || state.challenge!==pending.h || !pending.locked) return false;
      if(!pending.correct) {
        pending.locked=false;pending.h.phase='answer';pending.h.feedback='한 번 더 해 보세요. 틀려도 체력은 줄지 않아요.';
        pending.aids.add('correction');pending.h.assisted=true;pending.h.aids=[...pending.aids];return true;
      }
      const {key,context,h}=pending,quality=pending.h.resultQuality;pending=null;state.challenge=null;clearInput();
      if(context==='discovery') {
        state.magicUnlocked=true;state.player.hp=state.player.maxHp;state.player.magicCharge=CONFIG.magic.charge;
        state.player.attackCooldown=0;state.player.dodgeCooldown=0;state.player.magicCooldown=0;spawn('boss');return true;
      }
      mode('COMBAT');objectiveCombat();
      if(context==='review')return true;
      if(key==='fire') {if(flow)cue('fire',{id:h.id,heard:h.heard,source:h.source,assisted:h.assisted,aids:[...h.aids],intentAfterHeard:h.heard});castMagic(quality);}
      else if(key==='crystal'){const window=state.enemy.kind==='golem'?6.5:CONFIG.learning.coreWindow;state.player.weaknessCharge=1;state.enemy.coreExposed=true;state.enemy.coreRemaining=window;state.player.magicCharge=clamp(state.player.magicCharge+CONFIG.learning.charge,0,CONFIG.magic.charge);if(state.enemy.kind!=='golem')stun();pose('idle');if(flow)cue('crystal',{id:h.id,heard:h.heard,source:h.source,assisted:h.assisted,aids:[...h.aids],ttl:window});}
      else {state.player.magicCharge=clamp(state.player.magicCharge+CONFIG.learning.charge,0,CONFIG.magic.charge);if(!field?.configs[state.enemy?.kind])stun();pose('idle');}
      return true;
    }
    function answer(value) {
      if(!pending || state.mode==='PAUSED' || state.challenge!==pending.h || pending.locked || !['LISTENING_CHALLENGE','MAGIC_CHALLENGE'].includes(state.mode)) return false;
      const result=RebornLearning.evaluate(pending.key,value);if(!result.valid)return false;
      const h=pending.h;pending.locked=true;pending.correct=result.correct;h.attempts++;h.phase='feedback';h.completed=result.correct;
      const independent=pending.aids.size===0 && pending.heard;
      const category=h.kind==='listen'?state.stats.listening:state.stats.magic;
      if(result.correct){state.stats.correct++;category.correct++;if(independent){state.stats.independent++;category.independent++;}else{state.stats.assisted++;category.assisted++;}
        if(flow){
          progress.entries[pending.key].introduced=true;
          if(pending.key==='crystal'||pending.key==='fire'&&pending.context==='combat')progress.entries[pending.key].stage=progress.ready(pending.key)?'familiar':'practice';
          else progress.record(pending.key,h.id,{success:true,heard:pending.heard,assisted:!independent,actual:false});
        }
        if(!state.stats.expressions.includes(h.english))state.stats.expressions.push(h.english);
        h.resultQuality=pending.aids.has('correction')?'corrected':independent?'independent':'assisted';
        h.feedback=`${h.resultQuality==='corrected'?'다시 익혔어요!':independent?'듣고 이해했어요!':'도움을 활용해 완성했어요!'} ${h.english} — ${h.ko}`;emit('ui',{id:'correct'});voice('VO_GOOD_JOB');
        if(h.kind==='listen'&&independent)goal('independent-listening');
        if(!independent)review(pending.key,pending.aids.size?'hint':'text');
      }else{state.stats.wrong++;category.wrong++;if(flow)progress.record(pending.key,h.id+':miss',{success:false});review(pending.key,'wrong');h.feedback=`다시 해 봐요. ${h.explanation}`;pending.aids.add('correction');h.assisted=true;h.aids=[...pending.aids];emit('ui',{id:'incorrect'});voice('VO_TRY_AGAIN');}
      if(h.kind==='listen'){if(!pending.heard)category.unheard++;else if(pending.source==='asset')category.asset++;else category.fallback++;}
      return {correct:result.correct,independent:result.correct&&independent,feedback:h.feedback};
    }
    function assist(kind='translation') {
      kind=({english:'subtitle',korean:'translation'})[kind]||kind;
      const key=currentOpportunity()?.expressionId;if(key&&!state.encounterHelp.includes(key))state.encounterHelp.push(key);
      if(flow&&state.flowCue){const c=state.flowCue;c.assisted=true;if(!c.aids.includes(kind))c.aids.push(kind);review(c.expressionId,'hint');if(!state.stats.flow.helpExpressions.includes(c.expressionId))state.stats.flow.helpExpressions.push(c.expressionId);}
      if(!pending || !['subtitle','translation','hint','fallback','correction'].includes(kind))return !!state.flowCue;
      pending.aids.add(kind);pending.h.assisted=true;pending.h.aids=[...pending.aids];review(pending.key,'hint');return true;
    }
    function heard(source='asset',opportunityId=currentOpportunity()?.id) {
      if(!['asset','browser-fallback'].includes(source))return false;
      if(flow&&state.flowCue&&opportunityId===state.flowCue.id&&!['INTRO','DEFEAT','VICTORY'].includes(state.mode)){
        const c=state.flowCue;
        if(c.expressionId==='dodge'){
          const e=state.enemy;if(!e||e.attackSerial!==c.attackSerial||['ATTACK','DIVE_ATTACK','SWEEP_ATTACK','FEATHER_BURST','FIST_ATTACK','GROUND_SLAM','CRYSTAL_PULSE'].includes(e.ai))return false;
          if(field?.configs[e.kind]&&!c.heard&&e.ai.startsWith('TELEGRAPH_')){e.telegraphTotal=Math.max(e.telegraphTotal,e.aiTime+1.6);e.telegraphRemaining=e.telegraphTotal-e.aiTime;c.ttl=Math.max(c.ttl,c.age+4);}
          if(!c.heard){const telegraphTime=e.ai==='TELEGRAPH'?e.aiTime:enemyData.resume?.ai==='TELEGRAPH'?enemyData.resume.time:null;
            if(telegraphTime!==null){enemyData.telegraphDuration=Math.max(enemyData.telegraphDuration,telegraphTime+1.6);e.telegraphRemaining=enemyData.telegraphDuration-telegraphTime;c.ttl=Math.max(c.ttl,c.age+1.6+e.attackDuration+.3);}}
        }
        if(!c.heard){c.heardX=state.player.x;c.heardAt=c.age;}c.heard=true;c.source=source;
        if(!state.stats.flow.heardExpressions.includes(c.expressionId))state.stats.flow.heardExpressions.push(c.expressionId);if(!state.encounterHeard.includes(c.expressionId))state.encounterHeard.push(c.expressionId);return true;
      }
      if(opportunityId!==pending?.h.id)return false;
      if(!pending || pending.locked || state.mode==='PAUSED' || !['asset','browser-fallback'].includes(source))return false;
      if(flow&&!state.stats.flow.heardExpressions.includes(pending.key))state.stats.flow.heardExpressions.push(pending.key);
      if(!state.encounterHeard.includes(pending.key))state.encounterHeard.push(pending.key);
      pending.heard=true;pending.source=source;pending.h.heard=true;pending.h.source=source;return true;
    }
    function enemyDefeated() {
      cancelCue();
      const e=state.enemy;ai('DEFEATED');e.hp=0;e.coreExposed=false;e.coreRemaining=0;clearTransient();state.player.weaknessCharge=0;state.hitStop=0;pending=null;state.challenge=null;
      effect('burst',e.x,e.y-30,1.1);sfx(e.kind==='boss'?'boss_defeat':'slime_defeat');
      if(state.route!=='lab'){
        e.hazards=[];state.presentationRemaining=CONFIG.feel.victory;state.awaitingProceed=false;state.encounterReport=journey?journey.snapshot(state):{kind:e.kind,durationSeconds:state.encounterTime,stats:JSON.parse(JSON.stringify(state.stats))};
        if(state.adventure)state.adventure.history.push(state.encounterReport);
        pose('victory');const final=state.route!=='story'||state.adventure.index===2;mode(final?'VICTORY':'ENCOUNTER_CLEAR');
        state.objective=final?(state.route==='story'?'왕국의 수정이 다시 빛납니다. 사냥꾼의 길 완료!':'전투 완료 · 다른 적을 연습하거나 다시 도전하세요.'):'길이 열렸습니다. 다음 장소로 이동하세요.';
        state.reward={title:field?.names[e.kind]||e.kind};sfx('victory');voice(final?'VO_VICTORY':'VO_GOOD_JOB');return;
      }
      if(e.kind==='slime') {
        state.stage='crystal';state.awaitingProceed=true;state.objective='빛나는 단어 수정 발견! “I need fire.”를 배우고 마법을 깨워요.';
        state.player.hp=state.player.maxHp;pose('idle');mode('EXPLORATION');voice('VO_CHARGE');
      } else {
        effect('core_collapse',e.x,e.y-60,.9);goal('forest-clear');
        state.stage='complete';state.awaitingProceed=false;pose('victory');mode('VICTORY');sfx('victory');voice('VO_VICTORY');
        state.objective='숲의 첫 시험 완료! 배운 표현을 다시 듣고 새로 도전해 보세요.';
        state.reward={title:'숲의 첫빛',description:'이번 실험실 도전의 기념 휘장 — 기존 게임 보상과 별개예요.',expressions:[...state.stats.expressions],goals:[...state.stats.goals]};
      }
    }
    function checkScript() {
      const e=state.enemy;if(!e || e.hp<=0)return;
      if(field?.configs[e.kind])return;
      const list=e.kind==='slime'?[['slime-left',54,'left'],['slime-dodge',30,'dodge']]:[['boss-attack',120,'attack'],['boss-magic',80,'magic']];
      for(const [id,hp,key] of list)if(e.hp<=hp&&!scripted.has(id)){scripted.add(id);if(flow&&(key==='dodge'?progress.introduced(key):progress.ready(key)))continue;openChallenge(key,'combat');return;}
    }
    function hitFeedback(target,amount,{source='sword',tier=1,direction=1,weak=false}={}){
      const enemy=target===state.enemy,heavy=tier===3||source==='magic'||weak;
      const stop=enemy?(source==='magic'?CONFIG.feedback.magicStop:weak?CONFIG.feedback.finisherStop:[CONFIG.feedback.lightStop,CONFIG.feedback.mediumStop,CONFIG.feedback.finisherStop][tier-1]):state.enemy?.kind==='boss'?CONFIG.feedback.bossStop:CONFIG.feedback.lightStop;
      state.hitStop=Math.max(state.hitStop,stop);state.shake=Math.max(state.shake,heavy?CONFIG.feedback.heavyShake:CONFIG.feedback.lightShake);state.shakePower=heavy?1:(enemy ? .25 : .6);
      if(enemy){target.recoilRemaining=CONFIG.feel.recoil;target.recoilDirection=direction;target.recoilTier=tier;}
      const meta={tier,heavy,direction,targetKind:enemy?target.kind:'player',quality:source};
      effect('damage',target.x,target.y-(target.lift||0)-90,.8,enemy?amount:-amount,meta);effect('impact',target.x,target.y-(target.lift||0)-32,.26,enemy?amount:-amount,meta);
      if(enemy){sfx(weak?'coreHit':source==='magic'?'magic_explosion':'impact'+tier);effect(weak?'core_hit':'droplets',target.x,target.y-(target.lift||0)-35,.45,amount,meta);}else sfx('player_hit');
    }
    function landingWarning(){
      const e=state.enemy;if(!e)return;
      e.landingTargetX=e.attackTargetX;
      if(e.ai!=='ATTACK'||rushPatterns.has(e.pattern))return;
      // Predict the same final fixed step used by collision, including late recoil.
      // The locked movement target remains unchanged; only its warning is corrected.
      const steps=Math.ceil(Math.max(0,e.attackDuration-e.aiTime-1e-8)/CONFIG.step);
      const residual=approach(enemyData.knockback||0,0,CONFIG.feedback.knockbackDecay*steps*CONFIG.step);
      e.landingTargetX=clamp(e.attackTargetX+residual,CONFIG.minX,CONFIG.maxX);
    }
    function damageEnemy(amount,source,{tier=1,direction=state.player.facing}={}) {
      const e=state.enemy;if(!e || e.hp<=0)return false;
      const fieldCore=e.kind==='golem'&&e.coreExposed&&source==='sword';
      const weak=fieldCore||source==='sword'&&e.coreExposed&&state.player.weaknessCharge===1;
      if(e.kind==='golem'&&e.shieldActive&&source==='sword')amount=Math.max(1,Math.round(amount*.25));
      if(weak){amount=Math.round(amount*CONFIG.learning.coreMultiplier);if(!fieldCore){state.player.weaknessCharge=0;e.coreRemaining=0;e.coreExposed=false;}state.stats.combat.weaknessHits++;goal('crystal-break');if(state.flowCue?.expressionId==='crystal'){state.flowCue.acted=true;finishCue(true);}}
      if(source==='sword'&&state.player.counterRemaining>0&&!/ATTACK|TELEGRAPH|BURST|PULSE|SLAM/.test(e.ai)){state.player.counterRemaining=0;state.stats.combat.counterattacks++;state.player.magicCharge=clamp(state.player.magicCharge+CONFIG.feel.counterCharge,0,CONFIG.magic.charge);effect('counter',e.x,e.y-e.lift-60,.55);sfx('perfectDodge');}
      const dealt=Math.min(e.hp,amount);e.hp=clamp(e.hp-dealt,0,e.maxHp);state.stats.combat.damageDealt+=dealt;hitFeedback(e,dealt,{source,tier,direction,weak});
      const strike=CONFIG.sword.strikes[tier-1],knockback=source==='magic'?38:strike.knockback;
      e.x=clamp(e.x+direction*knockback*(e.kind==='golem'?CONFIG.feel.golemKnockback:1),CONFIG.minX,CONFIG.maxX);if(e.ai==='ATTACK')enemyData.knockback=(enemyData.knockback||0)+direction*knockback;
      landingWarning();
      if(source==='sword'){state.player.magicCharge=clamp(state.player.magicCharge+strike.charge,0,CONFIG.magic.charge);state.stats.combat.swordHits++;comboHits++;state.stats.combat.highestCombo=Math.max(state.stats.combat.highestCombo,comboHits);state.encounterPeakCombo=Math.max(state.encounterPeakCombo,comboHits);if(comboHits===3)goal('combo-three');}
      if(e.hp<=0){enemyDefeated();return true;}
      if(field?.configs[e.kind]){field.hit(e,tier,fieldAPI,source);return true;}
      if(e.kind==='boss'&&e.phase===1&&e.hp<=e.maxHp*.5){e.phase=2;enemyData.phaseIndex=0;effect('charge',e.x,e.y-35,.65);sfx('bossPhase');}
      // Brief recoil preserves a telegraph's progress; repeated sword hits cannot restart it forever.
      if(weak)stagger(CONFIG.learning.coreStagger,true);
      else if(tier===3&&e.ai!=='ATTACK')stagger(.36);
      else if(e.ai!=='ATTACK'&&e.ai!=='HIT_REACTION'&&e.ai!=='STAGGER'){enemyData.resume={ai:e.ai,time:e.aiTime};ai('HIT_REACTION');}
      checkScript();return true;
    }
    function castMagic(quality='assisted') {
      const p=state.player;if(cast||!state.magicUnlocked||p.magicCharge<CONFIG.magic.charge||p.magicCooldown>0||!state.enemy||state.enemy.hp<=0)return false;
      p.magicCharge=0;p.magicCooldown=CONFIG.magic.cooldown;resetCombo();pose('magic_charge',CONFIG.magic.chargeTime);state.stats.combat.magicUsed++;
      cast={phase:'charge',time:0,duration:CONFIG.magic.chargeTime,quality,session:state.session,enemy:state.enemy};state.cast={phase:cast.phase,time:0,duration:cast.duration,quality,session:state.session};
      effect('runes',p.x,p.y-40,CONFIG.magic.chargeTime,0,{quality});sfx('magic_charge');return true;
    }
    function startStrike(index){
      if(state.flowCue?.expressionId==='crystal')state.flowCue.intentAfterHeard=state.flowCue.heard;
      const p=state.player,c=CONFIG.sword.strikes[index-1];p.attackCooldown=c.cooldown;p.comboIndex=index;p.comboNext=index<3?index+1:1;p.comboBuffered=false;p.comboWindowRemaining=0;
      if(index===1)comboHits=0;attack={time:0,facing:p.facing,hit:false,started:false,index,buffered:false};pose('attack_anticipation',c.anticipation);return true;
    }
    function beginAttack() {
      const p=state.player;if(!activeModes.has(state.mode)||state.stage==='crystal'||dodge||cast||state.mode==='PLAYER_HIT')return false;
      if(attack){const c=CONFIG.sword.strikes[attack.index-1];if(attack.index>=3||attack.buffered||attack.time<CONFIG.sword.bufferStart)return false;attack.buffered=true;p.comboBuffered=true;return true;}
      if(p.attackCooldown>0)return false;
      return startStrike(p.comboWindowRemaining>0?p.comboNext:1);
    }
    function beginDodge() {
      const p=state.player;if(!activeModes.has(state.mode)||state.stage==='crystal'||p.dodgeCooldown>0||dodge||cast?.phase==='charge')return false;
      p.dodgeCooldown=CONFIG.dodge.cooldown;p.invulnerable=Math.max(p.invulnerable,CONFIG.dodge.invulnerability);dodge={time:0,direction:p.facing};resetCombo();p.vx=0;state.stats.combat.dodges++;pose('dodge',CONFIG.dodge.duration);
      if(state.mode==='PLAYER_HIT')mode('COMBAT');effect('dodge',p.x,p.y-20,.3);sfx('dodge');return true;
    }
    function beginMagic() {
      const p=state.player;if(state.mode!=='COMBAT'||cast||!state.magicUnlocked||p.magicCharge<CONFIG.magic.charge||p.magicCooldown>0||dodge)return false;
      if(flow&&progress.ready('fire')){cue('fire',{shortcut:true});return castMagic('practiced');}
      openChallenge('fire','combat');return true;
    }
    function tickCast(dt){
      if(!cast)return;
      if(cast.session!==state.session||cast.enemy!==state.enemy||state.enemy.hp<=0){cast=null;state.cast=null;return;}
      cast.time+=dt;
      if(cast.phase==='charge'&&cast.time>=CONFIG.magic.chargeTime){
        const p=state.player,e=state.enemy,direction=e.x>=p.x?1:-1;
        shots.push({id:`${state.session}:fire:${++serial}`,kind:'fire',x:p.x+direction*26,y:p.y-60,vx:direction*CONFIG.magic.projectileSpeed,vy:0,radius:CONFIG.magic.projectileRadius,life:CONFIG.magic.projectileLife,ttl:CONFIG.magic.projectileLife,session:state.session,enemyId:e.id,quality:cast.quality});
        if(shots.length>CONFIG.magic.maxProjectiles)shots.shift();state.projectiles=shots;
        cast.phase='release';cast.time=0;cast.duration=CONFIG.magic.release;if(state.mode!=='PLAYER_HIT')pose('magic_release',CONFIG.magic.release);sfx('fireLaunch');
      }else if(cast.phase==='release'&&cast.time>=CONFIG.magic.release){cast=null;state.cast=null;if(state.player.pose==='magic_release')pose('idle');return;}
      Object.assign(state.cast,{phase:cast.phase,time:cast.time,duration:cast.duration});
    }
    function tickProjectiles(dt){
      const e=state.enemy;if(!e||e.hp<=0){shots=[];state.projectiles=shots;return;}
      for(const shot of [...shots]){
        if(shot.session!==state.session||shot.enemyId!==e.id||shot.life<=0){shots=shots.filter(x=>x!==shot);continue;}
        const tx=e.x,ty=e.y-e.lift-35,dx=tx-shot.x,dy=ty-shot.y,length=Math.hypot(dx,dy)||1;
        shot.vx=dx/length*CONFIG.magic.projectileSpeed;shot.vy=dy/length*CONFIG.magic.projectileSpeed;
        const nx=shot.x+shot.vx*dt,ny=shot.y+shot.vy*dt;
        const rx=enemyConfig(e.kind).radius*.8+shot.radius,ry=(e.kind==='boss'?42:30)+shot.radius;
        const ax=(shot.x-tx)/rx,ay=(shot.y-ty)/ry,bx=(nx-shot.x)/rx,by=(ny-shot.y)/ry;
        const ratio=clamp(-(ax*bx+ay*by)/(bx*bx+by*by||1),0,1);
        const hit=(ax+bx*ratio)**2+(ay+by*ratio)**2<=1;
        shot.x=nx;shot.y=ny;shot.life=countdown(shot.life,dt);
        if(hit){shots=shots.filter(x=>x!==shot);state.projectiles=shots;state.stats.combat.magicHits++;if(state.flowCue?.expressionId==='fire'){state.flowCue.acted=true;finishCue(true);}effect('fire',e.x,e.y-e.lift-35,.7,0,{quality:shot.quality,heavy:true});damageEnemy(CONFIG.magic.damage,'magic',{direction:shot.vx>=0?1:-1});break;}
      }
      shots=shots.filter(x=>x.life>0);state.projectiles=shots;
    }
    function input(action,pressed=true) {
      if(action==='clear'){clearInput();state.player.vx=0;state.player.comboBuffered=false;if(attack)attack.buffered=false;return true;}
      if(!['left','right','attack','dodge','magic','interact','replay','hint'].includes(action))return false;
      if(!pressed){held.delete(action);return true;}
      if(held.has(action))return false;
      held.add(action);
      if(action==='replay') {if(state.mode==='PAUSED')return false;voice(state.challenge?.voiceId||state.tutorial?.voiceId||state.lastVoiceId);return true;}
      if(action==='hint')return assist('translation');
      if(action==='interact')return interact();
      if(state.mode==='LISTENING_CHALLENGE')return answer(action);
      if(!activeModes.has(state.mode))return false;
      if(action==='left'||action==='right'){if(!attack&&!dodge)state.player.facing=action==='left'?-1:1;return true;}
      if(action==='attack')return beginAttack();if(action==='dodge')return beginDodge();if(action==='magic')return beginMagic();return false;
    }
    function damagePlayer(amount) {
      const p=state.player;if(p.invulnerable>1e-8||p.hp<=0||!['COMBAT','PLAYER_HIT'].includes(state.mode))return false;
      const dealt=Math.min(p.hp,amount);p.hp=clamp(p.hp-dealt,0,p.maxHp);p.counterRemaining=0;p.invulnerable=CONFIG.player.hitInvulnerability;resetCombo();dodge=null;p.vx=0;state.stats.combat.damageReceived+=dealt;
      if(state.flowCue)state.flowCue.damaged=true;
      const direction=p.x<state.enemy.x?-1:1;p.x=clamp(p.x+direction*CONFIG.player.knockback,CONFIG.minX,CONFIG.maxX);
      hitFeedback(p,dealt,{source:'enemy',direction});
      if(p.hp===0){cancelCue();clearTransient();pose('defeat');mode('DEFEAT');state.objective='잠깐 쉬어도 괜찮아요. 경고 지점에서 벗어나 다시 도전해 보세요.';sfx('defeat');}
      else {pose('hit',CONFIG.player.hitTime);mode('PLAYER_HIT');}
      return true;
    }
    function enemyContact(amount){
      if(dodge&&dodge.time<CONFIG.dodge.invulnerability-1e-8&&state.player.invulnerable>0&&!enemyData.perfect){
        enemyData.perfect=true;state.stats.combat.perfectDodges++;state.stats.combat.successfulDodges++;state.player.perfectDodge=CONFIG.dodge.perfectDisplay;state.player.counterRemaining=CONFIG.feel.counterWindow;
        state.player.magicCharge=clamp(state.player.magicCharge+CONFIG.dodge.perfectCharge,0,CONFIG.magic.charge);effect('perfect_dodge',state.player.x,state.player.y-35,.6);sfx('perfectDodge');goal('perfect-dodge');if(state.enemy.kind==='boss')goal('boss-dodge');return false;
      }
      return damagePlayer(amount);
    }
    function startTelegraph(repeat=false) {
      const e=state.enemy,c=CONFIG[e.kind];
      if(!repeat){
        if(e.kind==='boss'){const sequence=e.phase===2?c.phaseB:c.phaseA;const index=e.phase===2?enemyData.phaseIndex++:enemyData.patternIndex++;enemyData.pattern=c.patterns.find(x=>x.id===sequence[index%sequence.length]);}
        else {const far=Math.abs(state.player.x-e.x)>180,id=far&&e.pattern!=='rush'?'rush':['jump','rush','jump'][enemyData.patternIndex++%3];enemyData.pattern=c.patterns.find(x=>x.id===id);}
        enemyData.repeats=enemyData.pattern.repeat||1;
      }
      const pat=enemyData.pattern;const speed=e.phase===2?CONFIG.boss.phaseSpeed:1;
      e.pattern=pat.id;e.facing=state.player.x<e.x?-1:1;e.attackRadius=pat.radius;
      const overshoot=rushPatterns.has(pat.id)?60*e.facing:0;
      e.attackTargetX=clamp(state.player.x+overshoot,CONFIG.minX,CONFIG.maxX);
      e.landingTargetX=e.attackTargetX;
      e.telegraphRemaining=(repeat?pat.repeatTelegraph:pat.telegraph)*speed;
      enemyData.telegraphDuration=e.telegraphRemaining;e.attackDuration=pat.duration*speed;enemyData.originX=e.x;enemyData.hit=false;enemyData.perfect=false;enemyData.knockback=0;e.attackSerial++;ai('TELEGRAPH');
      if(flow&&!repeat&&!state.flowCue&&progress.introduced('dodge')&&state.time-state.lastWarningAt>=6){
        e.telegraphRemaining=Math.max(e.telegraphRemaining,2.2);enemyData.telegraphDuration=e.telegraphRemaining;state.lastWarningAt=state.time;
        cue('dodge',{attackSerial:e.attackSerial,enemyId:e.id,ttl:4.5,threatX:e.attackTargetX});
      }
      sfx(pat.id==='crystal_charge'?'crystal_charge':'slime_warning');
    }
    function tickEnemy(dt) {
      // Paid Sentence Magic gets a brief safe rune-charge, then hostile time resumes.
      const e=state.enemy;if(!e||e.hp<=0||cast?.phase==='charge'||!['COMBAT','PLAYER_HIT'].includes(state.mode))return;
      if(field?.configs[e.kind]){field.tick(e,state.player,dt,fieldAPI);return;}
      const c=CONFIG[e.kind];e.aiTime+=dt;
      if(e.coreRemaining>0){e.coreRemaining=countdown(e.coreRemaining,dt);if(e.coreRemaining===0){e.coreExposed=false;state.player.weaknessCharge=0;if(state.flowCue?.expressionId==='crystal')finishCue(false);}}
      if(e.ai==='STAGGER'){if(e.aiTime>=enemyData.staggerTime){const r=enemyData.resume;ai(r?.ai||'RECOVERY');e.aiTime=r?.time||0;e.lift=r?.lift||0;enemyData.resume=null;}return;}
      if(e.ai==='HIT_REACTION'){if(e.aiTime>=c.hitReaction){const r=enemyData.resume;ai(r?.ai||'RECOVERY');e.aiTime=r?.time||0;enemyData.resume=null;}return;}
      if(e.ai==='IDLE'){if(e.aiTime>=c.idle)ai('APPROACH');return;}
      if(e.ai==='APPROACH'){
        const dx=state.player.x-e.x;e.facing=dx<0?-1:1;
        if(Math.abs(dx)>c.approachRange)e.x=clamp(e.x+e.facing*c.speed*dt,CONFIG.minX,CONFIG.maxX);
        else startTelegraph();return;
      }
      if(e.ai==='TELEGRAPH'){
        e.telegraphRemaining=Math.max(0,enemyData.telegraphDuration-e.aiTime);
        if(e.telegraphRemaining<=1e-8){ai('ATTACK');sfx(rushPatterns.has(e.pattern)?'slime_rush':'slime_jump');}return;
      }
      if(e.ai==='ATTACK'){
        const pat=enemyData.pattern,oldX=e.x,t=clamp(e.aiTime/e.attackDuration,0,1);e.attackProgress=t;e.lift=Math.sin(t*Math.PI)*pat.lift;
        enemyData.knockback=approach(enemyData.knockback||0,0,CONFIG.feedback.knockbackDecay*dt);e.x=clamp(enemyData.originX+(e.attackTargetX-enemyData.originX)*t+enemyData.knockback,CONFIG.minX,CONFIG.maxX);landingWarning();
        if(rushPatterns.has(pat.id)){
          const lo=Math.min(oldX,e.x)-pat.radius,hi=Math.max(oldX,e.x)+pat.radius;
          if(!enemyData.hit&&state.player.x>=lo&&state.player.x<=hi){enemyData.hit=true;enemyContact(pat.damage);}
        }
        if(t>=1){
          if(!enemyData.hit&&!rushPatterns.has(pat.id)&&Math.abs(state.player.x-e.x)<=pat.radius){enemyData.hit=true;enemyContact(pat.damage);}
          effect('shockwave',e.x,e.y,.35,pat.radius);effect('dust',e.x,e.y,.4);sfx('slime_land');enemyData.repeats--;
          const w=state.flowCue;
          if(w?.expressionId==='dodge'&&w.attackSerial===e.attackSerial){
            w.acted=Math.abs(state.player.x-(w.heard?w.heardX:w.startX))>=30||enemyData.perfect;
            const safe=!w.damaged&&(enemyData.perfect||!enemyData.hit);
            finishCue(safe&&w.acted);
          }
          enemyData.recovery=enemyData.repeats>0?.20:c.recovery;ai('RECOVERY');
          if(pat.id==='crystal_charge'&&e.hp>0&&state.mode!=='DEFEAT'){
            e.coreExposed=true;e.coreRemaining=CONFIG.learning.coreWindow;effect('charge',e.x,e.y-55,.7);
            if(flow&&progress.introduced('crystal')){state.player.weaknessCharge=1;cue('crystal',{ttl:CONFIG.learning.coreWindow});}
            else if(!scripted.has('core-listening')){scripted.add('core-listening');openChallenge('crystal','combat');}
          }
        }return;
      }
      if(e.ai==='RECOVERY'&&e.aiTime>=enemyData.recovery){if(enemyData.repeats>0)startTelegraph(true);else ai('IDLE');}
    }
    function movePlayer(dx,bypass=false) {
      const p=state.player,e=state.enemy;let next=clamp(p.x+dx,CONFIG.minX,CONFIG.maxX);
      if(!bypass&&e&&e.hp>0&&e.ai!=='ATTACK'&&e.lift<100){
        const gap=CONFIG.player.radius+enemyConfig(e.kind).radius;
        if(p.x<=e.x-gap&&next>e.x-gap)next=e.x-gap;
        else if(p.x>=e.x+gap&&next<e.x+gap)next=e.x+gap;
        else if(Math.abs(p.x-e.x)<gap&&Math.abs(next-e.x)<Math.abs(p.x-e.x))next=p.x;
      }
      const distance=Math.abs(next-p.x);p.x=clamp(next,CONFIG.minX,CONFIG.maxX);return distance;
    }
    function tick(dt) {
      if(state.mode==='PAUSED'||state.mode==='INTRO')return;
      state.time+=dt;state.presentationRemaining=countdown(state.presentationRemaining,dt);
      if(state.mode==='TRANSITION'){state.transition.remaining-=dt;if(state.transition.remaining<=0){const next=state.transition.next;state.transition=null;state.player.hp=state.player.maxHp;state.player.magicCharge=100;state.player.magicCooldown=0;state.player.attackCooldown=0;state.player.dodgeCooldown=0;spawn(next);}return;}
      if(state.enemy?.hp>0&&state.mode!=='BOSS_INTRO')state.encounterTime+=dt;
      if(flow){
        if(['LISTENING_CHALLENGE','MAGIC_CHALLENGE'].includes(state.mode))state.stats.flow.forcedSeconds+=dt;
        if(state.flowFeedback){state.flowFeedback.remaining-=dt;if(state.flowFeedback.remaining<=0)state.flowFeedback=null;}
        if(state.flowCue&&activeModes.has(state.mode)){state.flowCue.age+=dt;if(state.flowCue.age>state.flowCue.ttl)finishCue(false);}
      }
      state.effects.forEach(e=>e.life-=dt);state.effects=state.effects.filter(e=>e.life>0);
      state.shake=Math.max(0,state.shake-dt);
      if(state.shake===0)state.shakePower=0;
      if(state.enemy?.ai==='DEFEATED')state.enemy.aiTime+=dt;
      if(state.mode==='VICTORY'||state.mode==='DEFEAT')state.player.poseTime+=dt;
      if(state.mode==='BOSS_INTRO'){state.enemy.aiTime+=dt;state.bossIntro.remaining=countdown(state.bossIntro.remaining,dt);if(state.bossIntro.automatic&&state.bossIntro.remaining===0)proceed();return;}
      if(!activeModes.has(state.mode))return;
      if(state.hitStop>0){state.hitStop=Math.max(0,state.hitStop-dt);return;}
      const p=state.player;
      p.attackCooldown=countdown(p.attackCooldown,dt);p.dodgeCooldown=countdown(p.dodgeCooldown,dt);p.magicCooldown=countdown(p.magicCooldown,dt);p.invulnerable=countdown(p.invulnerable,dt);p.perfectDodge=countdown(p.perfectDodge,dt);p.poseTime+=dt;p.counterRemaining=countdown(p.counterRemaining,dt);
      if(state.enemy){state.enemy.entryRemaining=countdown(state.enemy.entryRemaining||0,dt);state.enemy.recoilRemaining=countdown(state.enemy.recoilRemaining||0,dt);}
      if(!attack&&p.comboWindowRemaining>0){p.comboWindowRemaining=countdown(p.comboWindowRemaining,dt);if(p.comboWindowRemaining===0){p.comboNext=1;comboHits=0;}}
      if(state.mode==='PLAYER_HIT'&&p.poseTime>=CONFIG.player.hitTime){mode('COMBAT');pose('idle');}
      if(dodge){dodge.time+=dt;movePlayer(dodge.direction*CONFIG.dodge.speed*dt,true);if(dodge.time>=CONFIG.dodge.duration-1e-8){dodge=null;pose('idle');}}
      else if(state.mode!=='PLAYER_HIT'&&state.stage!=='crystal'){
        const direction=(held.has('right')?1:0)-(held.has('left')?1:0);
        const scale=cast?.phase==='charge'?.35:attack?.55:1,target=direction*CONFIG.player.speed*scale;
        const acceleration=!direction?CONFIG.player.deceleration:p.vx*direction<0?CONFIG.player.reversal:CONFIG.player.acceleration;
        p.vx=approach(p.vx,target,acceleration*dt);
        if(direction&&!attack&&!cast)p.facing=direction;
        if(Math.abs(p.vx)>1e-8){const distance=movePlayer(p.vx*dt);moved+=distance;p.runPhase=(p.runPhase+distance/16)%(Math.PI*2);if(distance<Math.abs(p.vx*dt)-1e-8)p.vx=0;if(!attack&&!cast&&p.pose!=='run')pose('run');}
        else if(!attack&&!cast&&p.pose==='run')pose('idle');
      }
      if(attack){
        attack.time+=dt;const a=attack,t=attack.time,c=CONFIG.sword.strikes[a.index-1];
        if(t>=c.anticipation&&!a.started){a.started=true;sfx('sword'+a.index);pose('attack_swing',c.swing);effect('slash',p.x+a.facing*48,p.y-35,c.swing+.04,a.facing,{tier:a.index,heavy:a.index===3,direction:a.facing});}
        if(t>=c.anticipation&&t<=c.anticipation+c.swing&&!a.hit){
          const e=state.enemy;if(e&&e.hp>0&&(e.x-p.x)*a.facing>=0&&Math.abs(e.x-p.x)<=c.range&&e.lift<=c.height){a.hit=true;p.poseTime=Math.max(p.poseTime,c.swing*CONFIG.feel.contactPoseFraction);damageEnemy(c.damage,'sword',{tier:a.index,direction:a.facing});}
        }
        if(attack===a&&t>=c.anticipation+c.swing&&p.pose!=='attack_follow')pose('attack_follow',c.follow);
        if(attack===a&&t>=c.cooldown-1e-8){
          if(!a.hit){comboHits=0;state.stats.battlefield.missedAttacks++;}attack=null;p.comboIndex=0;p.comboBuffered=false;
          if(a.buffered&&a.index<3)startStrike(a.index+1);
          else {p.comboNext=a.index<3?a.index+1:1;p.comboWindowRemaining=a.index<3?CONFIG.sword.comboWindow:0;if(a.index===3)comboHits=0;pose('idle');}
        }
      }
      if(state.mode==='EXPLORATION'&&state.stage==='entrance'&&moved>=55)spawn('slime');
      if(!activeModes.has(state.mode))return;
      tickCast(dt);
      tickEnemy(dt);
      if(activeModes.has(state.mode))tickProjectiles(dt);
    }
    function update(dtSeconds) {
      if(!Number.isFinite(dtSeconds)||dtSeconds<=0||state.mode==='PAUSED')return state;
      accumulator+=Math.min(CONFIG.maxDelta,dtSeconds);
      while(accumulator>=CONFIG.step-1e-10){accumulator-=CONFIG.step;tick(CONFIG.step);}
      return state;
    }
    function pause(){if(['PAUSED','INTRO','VICTORY','DEFEAT','ENCOUNTER_CLEAR'].includes(state.mode))return false;pausedMode=state.mode;clearInput();state.player.vx=0;state.player.comboBuffered=false;if(attack)attack.buffered=false;mode('PAUSED');return true;}
    function resume(){if(state.mode!=='PAUSED'||!pausedMode)return false;const previous=pausedMode;pausedMode=null;clearInput();mode(previous);return true;}
    function restart(){const selected=state.selection,route=state.route;reset();if(route==='story')startStory();else if(route==='practice')selectEncounter(selected);else start(true);return state;}
    function mainMenu(){reset();return state;}
    function drainEvents(){const out=events;events=[];return out;}
    return {state,skipPresentation(){state.presentationRemaining=0;},update,input,start,proceed,pause,resume,restart,mainMenu,answer,assist,heard,drainEvents,audioEvent,learnAgain,selectEncounter,startStory,advanceEncounter,retryEncounter};
  }
  return Object.freeze({CONFIG,create});
})();
