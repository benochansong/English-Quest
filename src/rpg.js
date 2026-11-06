// Durable state contains choices and owned item IDs. All combat values are derived.
const RPG = (() => {
  const classes = [
    {id:'vanguard',name:'수호 기사',en:'Vanguard',role:'전열을 지키는 방패와 검',bonus:'최대 체력 +10 · 방어 +1',
      strength:'큰 반격을 막으며 검격을 이어 가요.',limitation:'화염 마법에는 직업 보너스가 없어요.',
      abilities:[{en:'Steel Resolve',name:'강철의 결의',description:'방어 +1. 수호 방패로 반격 피해를 65% 줄여요.'},
        {en:'Guardian Strike',name:'수호자의 검격',description:'정답 검격의 위력이 2 증가해요.'}]},
    {id:'arcanist',name:'원소 마법사',en:'Arcanist',role:'룬과 화염을 다루는 마법 전문가',bonus:'마력 +3',
      strength:'화염과 대화의 폭발을 더 강하게 사용해요.',limitation:'직업에 따른 추가 체력과 방어는 없어요.',
      abilities:[{en:'Arcane Focus',name:'비전 집중',description:'성공한 화염 마법과 대화의 폭발의 위력이 1 증가해요.'},
        {en:'Flame Resonance',name:'화염 공명',description:'연속 정답 3회 이상에서 성공한 화염은 다음 한 턴만 쉬어요.'}]},
    {id:'pathfinder',name:'숲의 정찰자',en:'Pathfinder',role:'검술과 회복을 겸하는 정찰병',bonus:'공격 +2 · 방어 +1',
      strength:'검격과 언어의 일격, 위기에서의 회복에 능해요.',limitation:'마력과 최대 체력에는 직업 보너스가 없어요.',
      abilities:[{en:'Precision',name:'정밀 타격',description:'성공한 검격과 언어의 일격의 위력이 1 증가해요.'},
        {en:'Second Wind',name:'다시 고른 숨',description:'현재 체력이 절반 이하라면 치유 마법의 회복량이 4 증가해요.'}]}
  ];
  const skills = [
    ['swordTraining','검술 훈련','Sword Training','sword','sword',null,'검격과 언어의 일격 피해 +5%.'],
    ['bladeMastery','검날 숙련','Blade Mastery','sword','sword','swordTraining','정답 검격의 피해 +5%. 검술 훈련과 합해 +10%.'],
    ['magicTraining','마력 훈련','Magic Training','arcane','fire',null,'화염 마법과 대화의 폭발 피해 +5%.'],
    ['flameMastery','화염 숙련','Flame Mastery','arcane','fire','magicTraining','정답 화염 마법 피해 +5%. 마력 훈련과 합해 +10%.'],
    ['ironDefense','철벽 방어','Iron Defense','survival','shield',null,'방어 +1. 적의 공격에서 방어를 차감해 피해를 정해요.'],
    ['healingKnowledge','치유 지식','Healing Knowledge','survival','heal','ironDefense','성공한 치유 마법의 회복량 +5. 최대 체력을 넘지 않아요.']
  ].map(([id,name,en,branch,icon,requires,description])=>({id,name,en,branch,icon,requires,description,cost:1}));
  const gear = [
    ['travelerSword','여행자의 검',"Traveler's Sword",'weapon','common',{attack:2},null,'시작 장비','균형이 잘 잡힌 여행용 검이에요.'],
    ['crystalBlade','수정 칼날','Crystal Blade','weapon','uncommon',{attack:5},null,'슬라임 왕 첫 승리','숲에서 되찾은 수정 조각으로 칼날을 다듬었어요.'],
    ['runicSword','룬 문자검','Runic Sword','weapon','rare',{attack:3,magic:3},null,'문장 골렘 첫 승리','검신의 문자가 검술과 마법을 함께 보강해요.'],
    ['leatherArmor','가죽 갑옷','Leather Armor','armor','common',{defense:2},35,'클라라의 상점','단단한 가죽판이 적의 반격을 막아 줘요.'],
    ['guardianArmor','수호자의 갑옷','Guardian Armor','armor','uncommon',{defense:4,maxHp:10},null,'단어의 방 첫 완료','수정 수호자의 흉갑은 오래 버티는 데 알맞아요.'],
    ['enchantedRobe','마법 깃든 로브','Enchanted Robe','armor','rare',{defense:2,magic:5},null,'문장의 방 첫 완료','은실로 수놓은 문장이 마력을 더해 줘요.'],
    ['forestCharm','숲의 호부','Forest Charm','accessory','common',{maxHp:5},25,'클라라의 상점','착용하는 동안 최대 체력이 늘어나는 나무 장식이에요.'],
    ['crystalPendant','수정 펜던트','Crystal Pendant','accessory','uncommon',{magic:2},40,'클라라의 상점','작은 푸른 수정이 마법에 힘을 보태요.'],
    ['scholarAmulet','학자의 목걸이',"Scholar's Amulet",'accessory','rare',{attack:2,magic:2},95,'클라라의 상점','작은 책 모양의 장식이 두 공격을 모두 보강해요.'],
    ['echoSigil','메아리의 인장','Echo Sigil','accessory','epic',{defense:2,magic:3},null,'메아리의 방 첫 완료','울림을 간직한 인장이 마력과 방어를 보강해요.']
  ].map(([id,name,en,slot,rarity,bonuses,price,source,description])=>({id,name,en,slot,rarity,bonuses,price,source,description,limit:1}));
  const dungeonPrizes = {words:{gearId:'guardianArmor',gold:20},sentences:{gearId:'enchantedRobe',gold:25},echoes:{gearId:'echoSigil',gold:30}};
  const achievements = [
    ['firstAdventurer','첫 모험가','처음으로 직업 선택하기'],
    ['swordApprentice','검술 수련생','검술 훈련 배우기'],
    ['crystalGuardian','수정의 수호자','언어 수정의 시련 한 곳 완료하기'],
    ['wellEquipped','빈틈없는 채비','무기·방어구·장신구를 동시에 착용하기'],
    ['wordExplorer','표현 탐험가','서로 다른 영어 표현 12개 만나기'],
    ['villageRestored','되살아난 목소리','문장 골렘을 쓰러뜨리고 마을의 목소리 되찾기']
  ].map(([id,name,description])=>({id,name,description}));
  const slots=['weapon','armor','accessory'];
  const statKeys=['maxHp','attack','magic','defense'];
  const emptyStats=()=>({maxHp:0,attack:0,magic:0,defense:0});
  const item=id=>gear.find(g=>g.id===id);
  const job=id=>classes.find(c=>c.id===id);
  const node=id=>skills.find(s=>s.id===id);
  const knownChallenge=id=>Q.some(q=>q.id===id)||VoiceData.activities.some(a=>a.id===id);
  const budget=p=>Math.max(0,Math.min(9999,p.level)-1);
  function fresh() {
    return {classId:null,promptSeen:false,skills:[],availablePoints:0,spentPoints:0,collection:['travelerSword'],
      equipped:{weapon:null,armor:null,accessory:null},dungeons:Object.fromEntries(
        Object.keys(dungeonPrizes).map(id=>[id,{clears:0,best:0,lastIds:[]}]))};
  }
  function syncPoints(p) {
    p.rpg.spentPoints=p.rpg.skills.length;
    p.rpg.availablePoints=budget(p)-p.rpg.spentPoints;
  }
  function grant(p,id) {
    if(!item(id) || p.rpg.collection.includes(id)) return false;
    p.rpg.collection.push(id);
    return true;
  }
  function hydrate(p,raw) {
    const r=p.rpg=fresh();
    if(raw && typeof raw==='object'){
      r.classId=job(raw.classId)?.id || null;
      r.promptSeen=raw.promptSeen===true || !!r.classId;
      if(Array.isArray(raw.collection)) for(const g of gear) if(raw.collection.includes(g.id)) grant(p,g.id);
      for(const slot of slots){
        const g=item(raw.equipped?.[slot]);
        if(g?.slot===slot && r.collection.includes(g.id)) r.equipped[slot]=g.id;
      }
      for(const s of skills){
        if(Array.isArray(raw.skills) && raw.skills.includes(s.id) && r.skills.length<budget(p)
          && (!s.requires || r.skills.includes(s.requires))) r.skills.push(s.id);
      }
      for(const [id,state] of Object.entries(r.dungeons)){
        const saved=raw.dungeons?.[id];
        if(!Number.isSafeInteger(saved?.clears) || saved.clears<1) continue;
        state.clears=Math.min(saved.clears,999999);
        state.best=Number.isInteger(saved.best)?Math.max(0,Math.min(5,saved.best)):0;
        state.lastIds=Array.isArray(saved.lastIds)?[...new Set(saved.lastIds.filter(knownChallenge))].slice(-5):[];
        grant(p,dungeonPrizes[id].gearId);
      }
    }
    if(p.chapterComplete)grant(p,'crystalBlade');
    if(p.village?.progress[6]?.completed)grant(p,'runicSword');
    syncPoints(p);
  }
  function breakdown(p, equipped=p.rpg?.equipped) {
    const steps=Math.max(0,Math.min(9999,p.level)-1);
    const base={maxHp:100+12*steps,attack:12+2*steps,magic:18+3*steps,defense:3};
    const classBonus=emptyStats(),equipment=emptyStats(),permanent=emptyStats(),skillStats=emptyStats();
    const cls=p.rpg?.classId;
    if(cls==='vanguard'){classBonus.maxHp=10;classBonus.defense=1;}
    if(cls==='arcanist')classBonus.magic=3;
    if(cls==='pathfinder'){classBonus.attack=2;classBonus.defense=1;}
    permanent.maxHp=p.village?.inventory.cloak?6:0;
    skillStats.defense=p.rpg?.skills.includes('ironDefense')?1:0;
    for(const slot of slots){
      const g=item(equipped?.[slot]);
      if(g?.slot===slot) for(const [k,n] of Object.entries(g.bonuses))equipment[k]+=n;
    }
    const total=Object.fromEntries(statKeys.map(k=>[k,base[k]+classBonus[k]+equipment[k]+permanent[k]+skillStats[k]]));
    return {base,classBonus,equipment,permanent,skills:skillStats,total};
  }
  function refresh(p) {
    const unlock=id=>{if(!p.achievements.includes(id))p.achievements.push(id);};
    if(p.rpg.classId)unlock('firstAdventurer');
    if(p.rpg.skills.includes('swordTraining'))unlock('swordApprentice');
    if(slots.every(slot=>p.rpg.equipped[slot]))unlock('wellEquipped');
    if(Object.values(p.rpg.dungeons).some(d=>d.clears))unlock('crystalGuardian');
    if(p.village.progress[6].completed)unlock('villageRestored');
    if(!p.achievements.includes('wordExplorer')){
      const expressions=new Set(lessons.filter(l=>p.learning[l.id]?.seen).map(l=>VoiceLearning.normalize(l.en)));
      for(const a of VoiceData.activities) if(p.voice.introduced.includes(a.id))expressions.add(VoiceLearning.normalize(a.english));
      if(expressions.size>=12)unlock('wordExplorer');
    }
    if(Object.values(p.voice.records).some(r=>r.reviewDay))unlock('firstReview');
  }
  function chooseClass(p,id) {
    if(!job(id) || p.rpg.classId===id)return false;
    p.rpg.classId=id;p.rpg.promptSeen=true;
    // Changing gear or class may reduce remaining HP but cannot be used to heal.
    p.hp=Math.min(p.hp,breakdown(p).total.maxHp);
    refresh(p);
    return true;
  }
  function canLearn(p,id) {
    const s=node(id);
    return !!s && p.rpg.availablePoints>=s.cost && !p.rpg.skills.includes(id)
      && (!s.requires || p.rpg.skills.includes(s.requires));
  }
  function learn(p,id) {
    if(!canLearn(p,id))return false;
    p.rpg.skills.push(id);syncPoints(p);refresh(p);
    return true;
  }
  function resetSkills(p) {
    if(!p.rpg.skills.length)return false;
    p.rpg.skills=[];syncPoints(p);
    return true;
  }
  function equip(p,id,slot=item(id)?.slot) {
    if(!slots.includes(slot) || item(id)?.slot!==slot || !p.rpg.collection.includes(id) || p.rpg.equipped[slot]===id)return false;
    p.rpg.equipped[slot]=id;p.hp=Math.min(p.hp,breakdown(p).total.maxHp);refresh(p);
    return true;
  }
  function unequip(p,slot) {
    if(!slots.includes(slot) || !p.rpg.equipped[slot])return false;
    p.rpg.equipped[slot]=null;p.hp=Math.min(p.hp,breakdown(p).total.maxHp);
    return true;
  }
  function preview(p,id) {
    const g=item(id);
    if(!g)return null;
    const before=breakdown(p).total,after=breakdown(p,{...p.rpg.equipped,[g.slot]:id}).total;
    const delta=Object.fromEntries(statKeys.map(k=>[k,after[k]-before[k]]));
    return {before,after,delta};
  }
  function combat(p,ability,combo,hp) {
    const cls=p.rpg.classId,has=id=>p.rpg.skills.includes(id);
    const physical=ability==='sword'||ability==='voice', magical=ability==='fire'||ability==='burst';
    let flat=0;
    if(cls==='vanguard' && ability==='sword')flat=2;
    if((cls==='arcanist' && magical) || (cls==='pathfinder' && physical))flat=1;
    const percent=5*(Number(physical&&has('swordTraining'))+Number(ability==='sword'&&has('bladeMastery'))+
      Number(magical&&has('magicTraining'))+Number(ability==='fire'&&has('flameMastery')));
    const extraHeal=(has('healingKnowledge')?5:0)+(cls==='pathfinder'&&hp<=breakdown(p).total.maxHp/2?4:0);
    return {flat,percent,heal:20+extraHeal,guardFactor:ability==='echo'?.3:cls==='vanguard'?.35:.4,
      resonance:cls==='arcanist'&&ability==='fire'&&combo>=3};
  }
  function bossLoot(p,stage) {
    const id=stage===3?'crystalBlade':stage===6?'runicSword':null;
    return id&&grant(p,id)?id:null;
  }
  function finishDungeon(p,id,correct,questionIds) {
    if(!Object.hasOwn(dungeonPrizes,id)||!Number.isInteger(correct)||correct<0||correct>5
      || !Array.isArray(questionIds)||questionIds.length!==5||new Set(questionIds).size!==5
      || !questionIds.every(knownChallenge))return null;
    const state=p.rpg.dungeons[id],prize=dungeonPrizes[id],first=state.clears===0;
    state.clears=Math.min(999999,state.clears+1);state.best=Math.max(state.best,correct);
    state.lastIds=[...questionIds];
    const gearId=first&&grant(p,prize.gearId)?prize.gearId:null;
    const gold=first?Math.min(prize.gold,Number.MAX_SAFE_INTEGER-p.gold):0;
    p.gold+=gold;refresh(p);
    return {first,gearId,gold};
  }
  return {classes,skills,gear,achievements,dungeonPrizes,fresh,hydrate,syncPoints,grant,breakdown,refresh,
    chooseClass,canLearn,learn,resetSkills,equip,unequip,preview,combat,bossLoot,finishDungeon};
})();
