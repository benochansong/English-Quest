/* Deterministic enemy/environment controllers. No rendering, audio or browser state. */
const RebornBattlefield=(()=>{
  const clamp=(x,a=60,b=940)=>Math.max(a,Math.min(b,x));
  const configs={raven:{hp:110,startX:700,radius:36,hitReaction:.12},golem:{hp:170,startX:720,radius:59,hitReaction:.12}};
  const names={slime:'숲 슬라임',raven:'그림자 까마귀',golem:'수정 골렘',boss:'슬라임 챔피언'};
  function set(e,ai){e.ai=ai;e.aiTime=0;e.attackProgress=0;}
  function create(kind,p){
    const c=configs[kind];
    if(kind==='golem')return {id:kind,kind,x:c.startX,y:425,lift:0,hp:c.hp,maxHp:c.hp,ai:'SHIELD_ACTIVATE',aiTime:0,phase:1,facing:-1,
      pattern:'fist',cycle:0,attackSerial:0,attackTargetX:p.x,landingTargetX:p.x,attackRadius:85,attackDuration:.55,attackProgress:0,
      telegraphRemaining:0,coreExposed:false,coreRemaining:0,hitFlash:0,hazards:[],hazardSerial:0,hit:false,staggerUsed:false,
      shieldActive:true,shieldHealth:3,shieldBreaks:0,shieldFlash:0,needsInstruction:true,environmentMistakes:0,groundedCount:0,
      objects:[{id:'red',x:180,color:'#f5a18c',symbol:'triangle',label:'빨강 · △',ready:false,flash:0},{id:'blue',x:420,color:'#94d6f4',symbol:'circle',label:'파랑 · ○',ready:false,flash:0},{id:'green',x:640,color:'#a1dcad',symbol:'diamond',label:'초록 · ◇',ready:false,flash:0}]};
    return {id:kind,kind,x:c.startX,y:425,lift:190,hp:c.hp,maxHp:c.hp,ai:'PATROL',aiTime:0,phase:1,facing:-1,
      pattern:'dive',cycle:0,attackSerial:0,attackTargetX:p.x,landingTargetX:p.x,attackRadius:46,attackDuration:.7,attackProgress:0,
      telegraphRemaining:0,coreExposed:false,coreRemaining:0,hitFlash:0,hazards:[],hazardSerial:0,hit:false,staggerUsed:false,
      objects:[{id:'wind',x:210,color:'#a7eee4',symbol:'spiral',label:'바람 수정',ready:false,flash:0}],
      groundedCount:0,shieldBreaks:0,environmentMistakes:0,groundedRemaining:0};
  }
  function attackStart(e,p,api){
    e.pattern=['dive','sweep','feathers'][e.cycle++%3];e.attackSerial++;e.hit=false;e.staggerUsed=false;
    e.originX=e.x;e.originLift=e.lift;e.attackTargetX=clamp(p.x);e.landingTargetX=e.attackTargetX;
    e.facing=p.x<e.x?-1:1;e.attackRadius=e.pattern==='dive'?48:38;e.attackDuration=e.pattern==='sweep'?1.1:.7;
    e.telegraphTotal=2.2;e.telegraphRemaining=2.2;set(e,e.pattern==='dive'?'TELEGRAPH_DIVE':e.pattern==='sweep'?'TELEGRAPH_SWEEP':'TELEGRAPH_FEATHERS');
    api.warning();api.sfx('slimeAttack');
  }
  function finishAttack(e,api){
    api.settleWarning(!e.hit);set(e,'RECOVERY');e.lift=60;e.objects[0].ready=true;e.recoveryTotal=6;
    api.opportunity('wind',6);api.effect('dust',e.x,425,.4);
  }
  function hazard(e,x,y,vx,vy,kind='feather',radius=12){
    e.hazards.push({id:++e.hazardSerial,x,y,vx,vy,kind,radius,life:4,hit:false});if(e.hazards.length>8)e.hazards.shift();
  }
  function tickHazards(e,p,dt,api){
    for(const h of e.hazards){
      if(h.hit)continue;const ox=h.x,oy=h.y;h.x+=h.vx*dt;h.y+=h.vy*dt;h.life-=dt;
      const dx=h.x-ox,dy=h.y-oy,t=clamp(((p.x-ox)*dx+(p.y-35-oy)*dy)/(dx*dx+dy*dy||1),0,1);
      if(Math.abs(ox+dx*t-p.x)<h.radius+16&&Math.abs(oy+dy*t-(p.y-35))<h.radius+35){h.hit=true;api.contact(h.kind==='wave'?10:6);}
    }
    e.hazards=e.hazards.filter(h=>!h.hit&&h.life>0&&h.x>-50&&h.x<1050&&h.y<480);
  }
  function tick(e,p,dt,api){
    if(e.hp<=0||e.ai==='DEFEATED')return;
    if(e.kind==='golem'){tickGolem(e,p,dt,api);return;}
    e.aiTime+=dt;e.hitFlash=Math.max(0,e.hitFlash-dt);e.objects.forEach(o=>o.flash=Math.max(0,o.flash-dt));
    if(e.ai==='STAGGER'){if(e.aiTime>=.18){set(e,e.resume.ai);e.aiTime=e.resume.time;e.resume=null;}return;}
    if(e.ai==='GROUNDED'){e.groundedRemaining=Math.max(0,e.groundedRemaining-dt);e.lift=12;if(!e.groundedRemaining){set(e,'PATROL');e.hazards=[];}return;}
    tickHazards(e,p,dt,api);
    if(p.hp<=0)return;
    if(e.ai==='PATROL'){e.lift=Math.min(190,e.lift+150*dt);e.x=clamp(e.x+Math.sin(e.aiTime*2)*40*dt);if(e.aiTime>=1.2)set(e,'APPROACH');return;}
    if(e.ai==='APPROACH'){e.facing=p.x<e.x?-1:1;e.x=clamp(e.x+e.facing*70*dt);if(e.aiTime>=.7)attackStart(e,p,api);return;}
    if(e.ai.startsWith('TELEGRAPH_')){
      e.lift=Math.min(230,e.lift+65*dt);e.telegraphRemaining=Math.max(0,e.telegraphTotal-e.aiTime);
      if(e.telegraphRemaining===0){
        e.originX=e.x;e.originLift=e.lift;
        if(e.pattern==='feathers'){
          set(e,'FEATHER_BURST');for(const offset of [-85,0,85]){const dx=clamp(e.attackTargetX+offset)-e.x,dy=390-(425-e.lift-35),len=Math.hypot(dx,dy);hazard(e,e.x,425-e.lift-35,dx/len*240,dy/len*240);}
        }else{set(e,e.pattern==='dive'?'DIVE_ATTACK':'SWEEP_ATTACK');if(e.pattern==='sweep'){e.originX=p.x<500?920:80;e.x=e.originX;e.attackTargetX=p.x<500?80:920;}}
      }return;
    }
    if(e.ai==='DIVE_ATTACK'||e.ai==='SWEEP_ATTACK'){
      const old=e.x,t=clamp(e.aiTime/e.attackDuration,0,1);e.attackProgress=t;
      e.x=e.originX+(e.attackTargetX-e.originX)*t;e.lift=e.ai==='DIVE_ATTACK'?e.originLift*(1-t):45;
      if(!e.hit&&e.lift<95&&p.x>=Math.min(old,e.x)-e.attackRadius&&p.x<=Math.max(old,e.x)+e.attackRadius){e.hit=true;api.contact(e.ai==='DIVE_ATTACK'?12:10);}
      if(t===1&&p.hp>0)finishAttack(e,api);return;
    }
    if(e.ai==='FEATHER_BURST'){if(e.aiTime>=2.2)finishAttack(e,api);return;}
    if(e.ai==='RECOVERY'){e.lift=60+Math.sin(e.aiTime*2)*5+Math.min(110,Math.max(0,e.aiTime-1.8)*85);if(e.aiTime>=e.recoveryTotal){e.objects[0].ready=false;set(e,'PATROL');}return;}
  }
  function interact(e,p,api){
    const o=e.objects.find(o=>Math.abs(o.x-p.x)<=76);
    if(!o)return {ok:false,message:'수정 가까이에서 E 또는 상호작용을 누르세요.'};
    if(e.kind==='golem'){
      if(!e.shieldActive)return {ok:false,message:'방어막이 열렸어요. 빛나는 핵을 공격하세요.'};
      if(!o.ready)return {ok:false,message:'골렘의 공격을 먼저 피하세요. 공격 뒤 환경 수정이 충전됩니다.'};
      if(o.id!=='blue'){o.flash=.5;e.environmentMistakes++;return {ok:false,wrong:true,message:'이 수정은 방어막과 연결되지 않아요. 다시 듣거나 한국어 도움을 확인하세요.'};}
      o.flash=1;return {ok:true,key:'blue',message:'파란 원 수정의 빛이 방어막을 깼어요! 핵을 공격하세요.'};
    }
    if(e.ai!=='RECOVERY'||!o.ready)return {ok:false,message:'까마귀가 낮게 회복할 때 바람 수정이 빛나요. 다음 틈을 기다리세요.'};
    o.ready=false;o.flash=1;e.hazards=[];e.groundedRemaining=3.8;e.groundedCount++;set(e,'GROUNDED');e.lift=12;
    api.effect('vortex',e.x,370,1.2);api.sfx('magicExplosion');return {ok:true,key:'wind'};
  }
  function breakShield(e,api,source){
    if(!e.shieldActive||e.hp<=0)return false;
    e.shieldActive=false;e.shieldHealth=0;e.coreExposed=true;e.coreRemaining=6.5;e.shieldBreaks++;e.staggerUsed=false;e.hazards=[];
    e.objects.forEach(o=>o.ready=false);set(e,'SHIELD_BREAK');api.metric('shieldBreaks');api.effect('core_hit',e.x,340,1.1);api.sfx('coreHit');api.core(true);api.opportunity('crystal',6.5);return true;
  }
  function tickGolem(e,p,dt,api){
    if(e.needsInstruction){e.needsInstruction=false;api.opportunity('blue',60);return;}
    e.aiTime+=dt;e.hitFlash=Math.max(0,e.hitFlash-dt);e.shieldFlash=Math.max(0,e.shieldFlash-dt);e.objects.forEach(o=>o.flash=Math.max(0,o.flash-dt));
    if(e.coreRemaining>0){
      e.coreRemaining=Math.max(0,e.coreRemaining-dt);
      if(e.coreRemaining===0){e.coreExposed=false;e.shieldActive=true;e.shieldHealth=3;e.objects.forEach(o=>o.ready=false);set(e,'SHIELD_ACTIVATE');api.core(false);api.opportunity('blue',60);return;}
    }
    if(e.ai==='STAGGER'){if(e.aiTime>=.25){set(e,'RECOVERY');}return;}
    if(e.ai==='SHIELD_BREAK'){if(e.aiTime>=.65)set(e,'RECOVERY');return;}
    tickHazards(e,p,dt,api);
    if(p.hp<=0)return;
    if(e.ai==='SHIELD_ACTIVATE'){if(e.aiTime>=1)set(e,'IDLE');return;}
    if(e.ai==='IDLE'){if(e.aiTime>=.8)set(e,'APPROACH');return;}
    if(e.ai==='APPROACH'){
      e.facing=p.x<e.x?-1:1;if(Math.abs(p.x-e.x)>220)e.x=clamp(e.x+e.facing*32*dt);
      if(e.aiTime<1.2)return;
      e.pattern=['fist','slam','pulse'][e.cycle++%3];e.attackTargetX=e.pattern==='pulse'?e.x:clamp(p.x);e.landingTargetX=e.attackTargetX;e.attackSerial++;e.hit=false;
      e.attackRadius=e.pattern==='pulse'?150:85;e.telegraphTotal=2.2;e.telegraphRemaining=2.2;set(e,'TELEGRAPH_'+e.pattern.toUpperCase());api.warning();api.sfx('charge');return;
    }
    if(e.ai.startsWith('TELEGRAPH_')){
      e.telegraphRemaining=Math.max(0,e.telegraphTotal-e.aiTime);
      if(e.telegraphRemaining===0){
        set(e,e.pattern==='fist'?'FIST_ATTACK':e.pattern==='slam'?'GROUND_SLAM':'CRYSTAL_PULSE');
        if(e.pattern==='slam'){hazard(e,e.x,410,-240,0,'wave',16);hazard(e,e.x,410,240,0,'wave',16);api.effect('shockwave',e.x,425,.65,160);}
      }return;
    }
    if(['FIST_ATTACK','GROUND_SLAM','CRYSTAL_PULSE'].includes(e.ai)){
      e.attackProgress=clamp(e.aiTime/.7,0,1);
      if(!e.hit&&e.aiTime>=.12&&e.pattern!=='slam'&&Math.abs(p.x-e.attackTargetX)<=e.attackRadius){e.hit=true;api.contact(e.pattern==='fist'?16:12);api.effect('impact',e.attackTargetX,405,.4);}
      if(e.aiTime>=.7&&p.hp>0){api.settleWarning(!e.hit);set(e,'RECOVERY');if(e.shieldActive)e.objects.forEach(o=>o.ready=true);if(e.pattern==='pulse'&&e.shieldActive)breakShield(e,api,'overload');}return;
    }
    if(e.ai==='RECOVERY'&&e.aiTime>=1.4)set(e,'IDLE');
  }
  function hit(e,tier,api,source){
    e.hitFlash=.16;
    if(e.kind==='golem'){
      if(e.shieldActive){e.shieldFlash=.25;e.shieldHealth=Math.max(0,e.shieldHealth-(source==='magic'?.6:tier===3?.4:.2));if(e.shieldHealth<.001)breakShield(e,api,'wear');}
      else if(!e.staggerUsed){e.staggerUsed=true;set(e,'STAGGER');}return;
    }
    if(tier===3&&e.ai==='RECOVERY'&&!e.staggerUsed){e.staggerUsed=true;e.resume={ai:e.ai,time:e.aiTime};set(e,'STAGGER');}
  }
  return {configs,names,create,tick,interact,hit,breakShield};
})();
