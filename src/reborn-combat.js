/* Reborn Combat Lab: deterministic simulation, deliberately separate from v0.8. */
const RebornCombat = (() => {
  const freeze = x => { Object.values(x).forEach(v=>{if(v && typeof v==='object') freeze(v);}); return Object.freeze(x); };
  const CONFIG = freeze({
    width:1000,height:560,ground:425,minX:60,maxX:940,step:1/120,maxDelta:.25,
    player:{hp:100,startX:170,speed:220,radius:18,hitTime:.24,hitInvulnerability:.55,knockback:18},
    sword:{damage:8,range:104,height:85,cooldown:.35,anticipation:.065,swing:.09,follow:.15,charge:14,knockback:8},
    dodge:{duration:.30,invulnerability:.18,cooldown:.65,speed:490},
    magic:{damage:32,charge:100,cooldown:8,release:.38},
    learning:{charge:25,stun:.9},
    slime:{hp:70,startX:690,radius:38,speed:43,approachRange:215,idle:.55,recovery:.85,hitReaction:.12,
      patterns:[{id:'jump',telegraph:.85,duration:.55,damage:8,radius:46,lift:74},{id:'rush',telegraph:1.05,duration:.42,damage:7,radius:42,lift:0}]},
    boss:{hp:160,startX:740,radius:58,speed:50,approachRange:290,idle:.65,recovery:1.05,hitReaction:.10,phaseSpeed:.87,
      patterns:[{id:'heavy_jump',telegraph:1.05,duration:.62,damage:16,radius:70,lift:126},{id:'triple_bounce',telegraph:.8,duration:.32,damage:8,radius:54,lift:72,repeat:3,repeatTelegraph:.5},{id:'crystal_charge',telegraph:1.2,duration:.52,damage:14,radius:58,lift:0}]}
  });
  const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
  const countdown=(value,dt)=>value-dt<1e-8?0:value-dt;
  const activeModes=new Set(['EXPLORATION','COMBAT','PLAYER_HIT']);
  function create() {
    let generation=0,accumulator=0,events=[],held=new Set(),attack=null,dodge=null,enemyData=null,pending=null,pausedMode=null,moved=0,scripted=new Set(),serial=0;
    const state={};
    const emit=(type,extra={})=>events.push({type,...extra,session:state.session});
    const soundIds={sword_swing:'sword',sword_impact:'impact',slime_bounce:'bounce',slime_warning:'slimeAttack',slime_rush:'slimeAttack',slime_jump:'bounce',slime_land:'impact',slime_defeat:'impact',player_hit:'playerHit',magic_charge:'magicCharge',magic_explosion:'magicExplosion',boss_entrance:'bossEntrance',boss_defeat:'bossDeath',boss_phase:'charge',crystal_charge:'charge',correct:'magic',incorrect:'bounce',defeat:'bossDeath'};
    const sfx=id=>emit('sfx',{id:soundIds[id]||id});
    const voice=id=>{state.lastVoiceId=id;emit('voice',{id});};
    function mode(value) { state.mode=value;emit('scene',{mode:value,stage:state.stage}); }
    function effect(type,x,y,life,value=0) {state.effects.push({type,x,y,life,ttl:life,value});}
    function pose(value,duration=0) {state.player.pose=value;state.player.poseTime=0;state.player.poseDuration=duration;}
    function clearInput() {held.clear();}
    function reset() {
      generation++;accumulator=0;events=[];held.clear();attack=null;dodge=null;enemyData=null;pending=null;pausedMode=null;moved=0;scripted=new Set();serial=0;
      Object.assign(state,{mode:'INTRO',stage:'entrance',time:0,session:generation,
        player:{x:CONFIG.player.startX,y:CONFIG.ground,facing:1,hp:CONFIG.player.hp,maxHp:CONFIG.player.hp,pose:'idle',poseTime:0,poseDuration:0,attackCooldown:0,dodgeCooldown:0,invulnerable:0,magicCharge:0,magicCooldown:0},
        enemy:null,effects:[],challenge:null,tutorial:null,magicUnlocked:false,awaitingProceed:true,lastVoiceId:'VO_HELLO',feedback:'',hitStop:0,shake:0,
        stats:{correct:0,wrong:0,assisted:0,independent:0,expressions:[],listening:{correct:0,wrong:0,assisted:0,independent:0,asset:0,fallback:0,unheard:0},magic:{correct:0,wrong:0,assisted:0,independent:0}},
        objective:'로완과 함께 숲의 첫 시험을 시작해요.',reward:null});
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
      const c=CONFIG[kind];state.stage=kind;state.awaitingProceed=false;state.challenge=null;pending=null;
      attack=null;dodge=null;clearInput();pose('idle');
      state.player.x=kind==='boss'?230:state.player.x;
      state.player.invulnerable=0;
      state.enemy={id:kind==='boss'?'slime-champion':'green-slime',kind,x:c.startX,y:CONFIG.ground,lift:0,hp:c.hp,maxHp:c.hp,ai:'IDLE',aiTime:0,pattern:c.patterns[0].id,phase:1,facing:-1,telegraphRemaining:0,attackTargetX:state.player.x,attackDuration:0,attackProgress:0};
      enemyData={patternIndex:0,pattern:null,originX:c.startX,hit:false,repeats:0,resume:null,recovery:c.recovery};
      state.objective=kind==='boss'?'슬라임 챔피언: 공격 예고를 피하고 빈틈에 반격해요.':'초록 슬라임: 가까이 다가가 J로 공격하고, 공격 예고를 보고 K로 회피해요.';
      mode('COMBAT');sfx(kind==='boss'?'boss_entrance':'slime_bounce');
      voice(kind==='boss'?'VO_BE_CAREFUL':'VO_SLIME_COMING');
    }
    function openChallenge(key,context) {
      clearInput();attack=null;dodge=null;state.player.invulnerable=0;
      const h=RebornLearning.challenge(key,`${state.session}:${++serial}`);
      state.challenge=h;pending={h,key,context,locked:false,correct:false,aids:new Set(),heard:false,source:null};
      state.awaitingProceed=false;state.objective=h.prompt;pose(key==='fire'?'magic_charge':'idle');
      mode(key==='fire'?'MAGIC_CHALLENGE':'LISTENING_CHALLENGE');voice(h.voiceId);
      if(key==='fire') sfx('magic_charge');
    }
    function ai(value) { const e=state.enemy;if(!e)return;e.ai=value;e.aiTime=0;e.attackProgress=0;e.lift=0; }
    function stun() { if(state.enemy && state.enemy.hp>0){enemyData.recovery=CONFIG.learning.stun;enemyData.repeats=0;enemyData.resume=null;ai('RECOVERY');} }
    function objectiveCombat() { state.objective=state.stage==='boss'?'슬라임 챔피언: 경고 지점을 벗어나고, 회복 중 반격해요. L 마법도 사용해요.':'J 검 · K 회피 — 슬라임이 몸을 움츠리면 공격 예고예요.'; }
    function proceed() {
      if(state.mode==='PAUSED') return false;
      if(state.mode==='TUTORIAL') {const n=state.tutorial.index+1;if(n<RebornLearning.tutorial.length)tutorial(n);else exploration();return true;}
      if(state.mode==='EXPLORATION' && state.stage==='entrance'){spawn('slime');return true;}
      if(state.mode==='EXPLORATION' && state.stage==='crystal'){openChallenge('fire','discovery');return true;}
      if(!pending || state.challenge!==pending.h || !pending.locked) return false;
      if(!pending.correct) {
        pending.locked=false;pending.h.phase='answer';pending.h.feedback='한 번 더 해 보세요. 틀려도 체력은 줄지 않아요.';
        pending.aids.add('correction');pending.h.assisted=true;pending.h.aids=[...pending.aids];return true;
      }
      const {key,context}=pending;pending=null;state.challenge=null;clearInput();
      if(context==='discovery') {
        state.magicUnlocked=true;state.player.hp=state.player.maxHp;state.player.magicCharge=CONFIG.magic.charge;
        state.player.attackCooldown=0;state.player.dodgeCooldown=0;state.player.magicCooldown=0;spawn('boss');return true;
      }
      mode('COMBAT');objectiveCombat();
      if(key==='fire') castMagic();
      else {state.player.magicCharge=clamp(state.player.magicCharge+CONFIG.learning.charge,0,CONFIG.magic.charge);stun();pose('idle');}
      return true;
    }
    function answer(value) {
      if(!pending || state.mode==='PAUSED' || state.challenge!==pending.h || pending.locked || !['LISTENING_CHALLENGE','MAGIC_CHALLENGE'].includes(state.mode)) return false;
      const result=RebornLearning.evaluate(pending.key,value);if(!result.valid)return false;
      const h=pending.h;pending.locked=true;pending.correct=result.correct;h.attempts++;h.phase='feedback';h.completed=result.correct;
      const independent=pending.aids.size===0 && pending.heard;
      const category=h.kind==='listen'?state.stats.listening:state.stats.magic;
      if(result.correct){state.stats.correct++;category.correct++;if(independent){state.stats.independent++;category.independent++;}else{state.stats.assisted++;category.assisted++;}
        if(!state.stats.expressions.includes(h.english))state.stats.expressions.push(h.english);
        h.feedback=`좋아요! ${h.english} — ${h.ko}`;sfx('correct');voice('VO_GOOD_JOB');
      }else{state.stats.wrong++;category.wrong++;h.feedback=`다시 해 봐요. ${h.explanation}`;pending.aids.add('correction');h.assisted=true;h.aids=[...pending.aids];sfx('incorrect');voice('VO_TRY_AGAIN');}
      if(h.kind==='listen'){if(!pending.heard)category.unheard++;else if(pending.source==='asset')category.asset++;else category.fallback++;}
      return {correct:result.correct,independent:result.correct&&independent,feedback:h.feedback};
    }
    function assist(kind='translation') {
      kind=({english:'subtitle',korean:'translation'})[kind]||kind;
      if(!pending || !['subtitle','translation','hint','fallback','correction'].includes(kind))return false;
      pending.aids.add(kind);pending.h.assisted=true;pending.h.aids=[...pending.aids];return true;
    }
    function heard(source='asset') {
      if(!pending || pending.locked || state.mode==='PAUSED' || !['asset','browser-fallback'].includes(source))return false;
      pending.heard=true;pending.source=source;pending.h.heard=true;pending.h.source=source;return true;
    }
    function enemyDefeated() {
      const e=state.enemy;ai('DEFEATED');e.hp=0;attack=null;dodge=null;clearInput();state.hitStop=0;pending=null;state.challenge=null;
      effect('burst',e.x,e.y-30,1.1);sfx(e.kind==='boss'?'boss_defeat':'slime_defeat');
      if(e.kind==='slime') {
        state.stage='crystal';state.awaitingProceed=true;state.objective='빛나는 단어 수정 발견! “I need fire.”를 배우고 마법을 깨워요.';
        state.player.hp=state.player.maxHp;pose('idle');mode('EXPLORATION');voice('VO_CHARGE');
      } else {
        state.stage='complete';state.awaitingProceed=false;pose('victory');mode('VICTORY');sfx('victory');voice('VO_VICTORY');
        state.objective='숲의 첫 시험 완료! 배운 표현을 다시 듣고 새로 도전해 보세요.';
        state.reward={title:'숲의 첫빛',description:'이번 실험실 도전의 기념 휘장 — 기존 게임 보상과 별개예요.',expressions:[...state.stats.expressions]};
      }
    }
    function checkScript() {
      const e=state.enemy;if(!e || e.hp<=0)return;
      const list=e.kind==='slime'?[['slime-left',54,'left'],['slime-dodge',30,'dodge']]:[['boss-attack',120,'attack'],['boss-magic',80,'magic']];
      for(const [id,hp,key] of list)if(e.hp<=hp&&!scripted.has(id)){scripted.add(id);openChallenge(key,'combat');return;}
    }
    function damageEnemy(amount,source) {
      const e=state.enemy;if(!e || e.hp<=0)return false;
      e.hp=clamp(e.hp-amount,0,e.maxHp);effect('damage',e.x,e.y-90,.7,amount);effect('impact',e.x,e.y-32,.23,amount);sfx(source==='magic'?'magic_explosion':'sword_impact');
      if(source==='sword'){state.player.magicCharge=clamp(state.player.magicCharge+CONFIG.sword.charge,0,CONFIG.magic.charge);e.x=clamp(e.x+state.player.facing*CONFIG.sword.knockback,CONFIG.minX,CONFIG.maxX);}
      if(source==='magic'){state.hitStop=.045;state.shake=.16;}
      if(e.hp<=0){enemyDefeated();return true;}
      if(e.kind==='boss'&&e.phase===1&&e.hp<=e.maxHp*.5){e.phase=2;effect('charge',e.x,e.y-35,.65);sfx('boss_phase');}
      // Brief recoil preserves a telegraph's progress; repeated sword hits cannot restart it forever.
      if(e.ai!=='ATTACK'&&e.ai!=='HIT_REACTION') {enemyData.resume={ai:e.ai,time:e.aiTime};ai('HIT_REACTION');}
      checkScript();return true;
    }
    function castMagic() {
      const p=state.player;if(!state.magicUnlocked||p.magicCharge<CONFIG.magic.charge||p.magicCooldown>0||!state.enemy||state.enemy.hp<=0)return false;
      p.magicCharge=0;p.magicCooldown=CONFIG.magic.cooldown;pose('magic_release',CONFIG.magic.release);
      effect('fire',state.enemy.x,CONFIG.ground-40,.7);damageEnemy(CONFIG.magic.damage,'magic');return true;
    }
    function beginAttack() {
      const p=state.player;if(!activeModes.has(state.mode)||state.stage==='crystal'||p.attackCooldown>0||dodge||state.mode==='PLAYER_HIT'||p.pose==='magic_release')return false;
      p.attackCooldown=CONFIG.sword.cooldown;attack={time:0,facing:p.facing,hit:false};pose('attack_anticipation',CONFIG.sword.anticipation);sfx('sword_swing');return true;
    }
    function beginDodge() {
      const p=state.player;if(!activeModes.has(state.mode)||state.stage==='crystal'||p.dodgeCooldown>0||dodge)return false;
      p.dodgeCooldown=CONFIG.dodge.cooldown;p.invulnerable=Math.max(p.invulnerable,CONFIG.dodge.invulnerability);dodge={time:0,direction:p.facing};attack=null;pose('dodge',CONFIG.dodge.duration);
      if(state.mode==='PLAYER_HIT')mode('COMBAT');effect('dodge',p.x,p.y-20,.3);sfx('dodge');return true;
    }
    function beginMagic() {
      const p=state.player;if(state.mode!=='COMBAT'||!state.magicUnlocked||p.magicCharge<CONFIG.magic.charge||p.magicCooldown>0||dodge)return false;
      openChallenge('fire','combat');return true;
    }
    function input(action,pressed=true) {
      if(action==='clear'){clearInput();return true;}
      if(!['left','right','attack','dodge','magic','replay','hint'].includes(action))return false;
      if(!pressed){held.delete(action);return true;}
      if(held.has(action))return false;
      held.add(action);
      if(action==='replay') {if(state.mode==='PAUSED')return false;voice(state.challenge?.voiceId||state.tutorial?.voiceId||state.lastVoiceId);return true;}
      if(action==='hint')return assist('translation');
      if(state.mode==='LISTENING_CHALLENGE')return answer(action);
      if(!activeModes.has(state.mode))return false;
      if(action==='left'||action==='right'){if(!attack&&!dodge)state.player.facing=action==='left'?-1:1;return true;}
      if(action==='attack')return beginAttack();if(action==='dodge')return beginDodge();if(action==='magic')return beginMagic();return false;
    }
    function damagePlayer(amount) {
      const p=state.player;if(p.invulnerable>1e-8||p.hp<=0||!['COMBAT','PLAYER_HIT'].includes(state.mode))return false;
      p.hp=clamp(p.hp-amount,0,p.maxHp);p.invulnerable=CONFIG.player.hitInvulnerability;attack=null;dodge=null;
      const direction=p.x<state.enemy.x?-1:1;p.x=clamp(p.x+direction*CONFIG.player.knockback,CONFIG.minX,CONFIG.maxX);
      effect('damage',p.x,p.y-90,.7,-amount);effect('impact',p.x,p.y-28,.22,-amount);sfx('player_hit');state.shake=.12;
      if(p.hp===0){clearInput();pose('defeat');mode('DEFEAT');state.objective='잠깐 쉬어도 괜찮아요. 경고 지점에서 벗어나 다시 도전해 보세요.';sfx('defeat');}
      else {pose('hit',CONFIG.player.hitTime);mode('PLAYER_HIT');}
      return true;
    }
    function startTelegraph(repeat=false) {
      const e=state.enemy,c=CONFIG[e.kind];
      if(!repeat){enemyData.pattern=c.patterns[enemyData.patternIndex%c.patterns.length];enemyData.patternIndex++;enemyData.repeats=enemyData.pattern.repeat||1;}
      const pat=enemyData.pattern;const speed=e.phase===2?CONFIG.boss.phaseSpeed:1;
      e.pattern=pat.id;e.facing=state.player.x<e.x?-1:1;
      const overshoot=['rush','crystal_charge'].includes(pat.id)?60*e.facing:0;
      e.attackTargetX=clamp(state.player.x+overshoot,CONFIG.minX,CONFIG.maxX);
      e.telegraphRemaining=(repeat?pat.repeatTelegraph:pat.telegraph)*speed;
      enemyData.telegraphDuration=e.telegraphRemaining;e.attackDuration=pat.duration*speed;enemyData.originX=e.x;enemyData.hit=false;ai('TELEGRAPH');
      sfx(pat.id==='crystal_charge'?'crystal_charge':'slime_warning');
    }
    function tickEnemy(dt) {
      const e=state.enemy;if(!e||e.hp<=0||!['COMBAT','PLAYER_HIT'].includes(state.mode))return;
      const c=CONFIG[e.kind];e.aiTime+=dt;
      if(e.ai==='HIT_REACTION'){if(e.aiTime>=c.hitReaction){const r=enemyData.resume;ai(r?.ai||'RECOVERY');e.aiTime=r?.time||0;enemyData.resume=null;}return;}
      if(e.ai==='IDLE'){if(e.aiTime>=c.idle)ai('APPROACH');return;}
      if(e.ai==='APPROACH'){
        const dx=state.player.x-e.x;e.facing=dx<0?-1:1;
        if(Math.abs(dx)>c.approachRange)e.x=clamp(e.x+e.facing*c.speed*dt,CONFIG.minX,CONFIG.maxX);
        else startTelegraph();return;
      }
      if(e.ai==='TELEGRAPH'){
        e.telegraphRemaining=Math.max(0,enemyData.telegraphDuration-e.aiTime);
        if(e.telegraphRemaining<=1e-8){ai('ATTACK');sfx(['rush','crystal_charge'].includes(e.pattern)?'slime_rush':'slime_jump');}return;
      }
      if(e.ai==='ATTACK'){
        const pat=enemyData.pattern,oldX=e.x,t=clamp(e.aiTime/e.attackDuration,0,1);e.attackProgress=t;e.lift=Math.sin(t*Math.PI)*pat.lift;
        e.x=enemyData.originX+(e.attackTargetX-enemyData.originX)*t;
        if(['rush','crystal_charge'].includes(pat.id)){
          const lo=Math.min(oldX,e.x)-pat.radius,hi=Math.max(oldX,e.x)+pat.radius;
          if(!enemyData.hit&&state.player.x>=lo&&state.player.x<=hi){enemyData.hit=true;damagePlayer(pat.damage);}
        }
        if(t>=1){
          if(!enemyData.hit&&!['rush','crystal_charge'].includes(pat.id)&&Math.abs(state.player.x-e.x)<=pat.radius){enemyData.hit=true;damagePlayer(pat.damage);}
          effect('shockwave',e.x,e.y,.35,pat.radius);sfx('slime_land');enemyData.repeats--;
          enemyData.recovery=enemyData.repeats>0?.20:c.recovery;ai('RECOVERY');
        }return;
      }
      if(e.ai==='RECOVERY'&&e.aiTime>=enemyData.recovery){if(enemyData.repeats>0)startTelegraph(true);else ai('IDLE');}
    }
    function movePlayer(dx,bypass=false) {
      const p=state.player,e=state.enemy;let next=clamp(p.x+dx,CONFIG.minX,CONFIG.maxX);
      if(!bypass&&e&&e.hp>0&&e.ai!=='ATTACK'){
        const gap=CONFIG.player.radius+CONFIG[e.kind].radius;
        if(p.x<=e.x-gap&&next>e.x-gap)next=e.x-gap;
        else if(p.x>=e.x+gap&&next<e.x+gap)next=e.x+gap;
        else if(Math.abs(p.x-e.x)<gap&&Math.abs(next-e.x)<Math.abs(p.x-e.x))next=p.x;
      }
      const distance=Math.abs(next-p.x);p.x=clamp(next,CONFIG.minX,CONFIG.maxX);return distance;
    }
    function tick(dt) {
      if(state.mode==='PAUSED'||state.mode==='INTRO')return;
      state.time+=dt;
      state.effects.forEach(e=>e.life-=dt);state.effects=state.effects.filter(e=>e.life>0);
      state.shake=Math.max(0,state.shake-dt);
      if(state.enemy?.ai==='DEFEATED')state.enemy.aiTime+=dt;
      if(state.mode==='VICTORY'||state.mode==='DEFEAT')state.player.poseTime+=dt;
      if(!activeModes.has(state.mode))return;
      if(state.hitStop>0){state.hitStop=Math.max(0,state.hitStop-dt);return;}
      const p=state.player;
      p.attackCooldown=countdown(p.attackCooldown,dt);p.dodgeCooldown=countdown(p.dodgeCooldown,dt);p.magicCooldown=countdown(p.magicCooldown,dt);p.invulnerable=countdown(p.invulnerable,dt);p.poseTime+=dt;
      if(state.mode==='PLAYER_HIT'&&p.poseTime>=CONFIG.player.hitTime){mode('COMBAT');pose('idle');}
      if(dodge){dodge.time+=dt;movePlayer(dodge.direction*CONFIG.dodge.speed*dt,true);if(dodge.time>=CONFIG.dodge.duration-1e-8){dodge=null;pose('idle');}}
      else if(state.mode!=='PLAYER_HIT'&&state.stage!=='crystal'){
        const direction=(held.has('right')?1:0)-(held.has('left')?1:0);
        if(direction){if(!attack)p.facing=direction;moved+=movePlayer(direction*CONFIG.player.speed*dt*(attack?.55:1));if(!attack&&p.pose!=='magic_release'&&p.pose!=='run')pose('run');}
        else if(!attack&&p.pose==='run')pose('idle');
      }
      if(attack){
        attack.time+=dt;const a=attack,t=attack.time;
        if(t>=CONFIG.sword.anticipation&&!a.hit){
          a.hit=true;pose('attack_swing',CONFIG.sword.swing);effect('slash',p.x+a.facing*48,p.y-35,.15,a.facing);
          const e=state.enemy;if(e&&e.hp>0&&(e.x-p.x)*a.facing>=0&&Math.abs(e.x-p.x)<=CONFIG.sword.range&&e.lift<=CONFIG.sword.height)damageEnemy(CONFIG.sword.damage,'sword');
        }
        if(attack&&t>=CONFIG.sword.anticipation+CONFIG.sword.swing&&p.pose!=='attack_follow')pose('attack_follow',CONFIG.sword.follow);
        if(attack&&t>=CONFIG.sword.anticipation+CONFIG.sword.swing+CONFIG.sword.follow){attack=null;pose('idle');}
      }
      if(p.pose==='magic_release'&&p.poseTime>=CONFIG.magic.release)pose('idle');
      if(state.mode==='EXPLORATION'&&state.stage==='entrance'&&moved>=55)spawn('slime');
      tickEnemy(dt);
    }
    function update(dtSeconds) {
      if(!Number.isFinite(dtSeconds)||dtSeconds<=0||state.mode==='PAUSED')return state;
      accumulator+=Math.min(CONFIG.maxDelta,dtSeconds);
      while(accumulator>=CONFIG.step-1e-10){accumulator-=CONFIG.step;tick(CONFIG.step);}
      return state;
    }
    function pause(){if(['PAUSED','INTRO','VICTORY','DEFEAT'].includes(state.mode))return false;pausedMode=state.mode;clearInput();mode('PAUSED');return true;}
    function resume(){if(state.mode!=='PAUSED'||!pausedMode)return false;const previous=pausedMode;pausedMode=null;clearInput();mode(previous);return true;}
    function restart(){reset();start(true);return state;}
    function drainEvents(){const out=events;events=[];return out;}
    return {state,update,input,start,proceed,pause,resume,restart,answer,assist,heard,drainEvents};
  }
  return Object.freeze({CONFIG,create});
})();
