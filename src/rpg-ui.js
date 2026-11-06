// Hero record, loadout and skill inspection share the values used by the combat engine.
const statNames={maxHp:'최대 체력',attack:'공격',magic:'마력',defense:'방어'};
const slotNames={weapon:'무기',armor:'방어구',accessory:'장신구'};
const rarityNames={common:'일반',uncommon:'고급',rare:'희귀',epic:'영웅'};
const branchNames={sword:'검술',arcane:'마법',survival:'생존'};
const classInfo=id=>RPG.classes.find(c=>c.id===id);
const gearInfo=id=>RPG.gear.find(g=>g.id===id);
const signed=n=>n>0?'+'+n:String(n);
function rpgHubLinks(){
  return '<nav class="camp-links" aria-label="모험가 성장과 시련">'+button('profile',icon('hero')+' 영웅 기록')+button('trials',icon('crystal')+' 언어 수정의 시련')+'</nav>';
}
function bonusText(bonuses){
  return Object.entries(statNames).filter(([k])=>bonuses[k]).map(([k,label])=>label+' '+signed(bonuses[k])).join(' · ')||'변화 없음';
}
function helpNote(title,description){
  return '<details class="rpg-help"><summary>'+title+'</summary><p>'+description+'</p></details>';
}
function rpgNav(active){
  const links=[['profile','hero','영웅 기록'],['skills','star','스킬 트리'],['equipment','shield','장비'],['trials','crystal','수정 시련']];
  return '<nav class="rpg-nav" aria-label="모험가 메뉴">'+links.map(([act,glyph,label])=>
    button(act,icon(glyph)+' '+label,{pressed:act===active})).join('')+button('rpg-home','지도로')+'</nav>';
}
function gearLabel(g){
  return '<span class="rarity-tag '+g.rarity+'">'+rarityNames[g.rarity]+'</span> <span>'+slotNames[g.slot]+'</span>';
}
function classView(){
  const p=game.profile, selected=classInfo(game.classPreview)||RPG.classes[0],old=classInfo(p.rpg.classId);
  const tiles=RPG.classes.map(c=>button('class-preview',
    '<span class="class-stage tone-'+c.id+'"><span class="halo" aria-hidden="true"></span>'+RpgArt.hero(c.id)+'</span>'+
    '<span class="class-caption"><i>'+c.en+'</i><strong>'+c.name+'</strong><small>'+c.role+'</small></span>',
    {id:c.id,cl:'class-card '+(c.id===selected.id?'chosen':''),pressed:c.id===selected.id,aria:c.name+' 미리보기'})).join('');
  return heading('HEROES OF THE WORD CRYSTAL','모험가의 직업','세 모습을 눌러 전투 방식을 비교하세요. 모든 직업으로 같은 영어 문제와 이야기를 플레이할 수 있어요.')+
    '<div class="class-gallery">'+tiles+'</div><section class="panel class-inspector"><div><span class="eyebrow">'+selected.en.toUpperCase()+'</span><h3>'+selected.name+'</h3>'+
    '<p class="stat-gain">'+selected.bonus+'</p><p>'+selected.strength+' '+selected.limitation+'</p></div><div class="passives">'+selected.abilities.map(a=>
    '<div>'+icon('crystal')+'<span><b>'+a.name+'</b><small>'+a.description+'</small></span></div>').join('')+'</div></section>'+
    '<div class="class-decision"><p>'+(old?'현재 직업 · '+old.name+'<br>':'')+'직업 변경은 무료이며 스킬·장비·학습 기록을 유지합니다.</p><div class="actions">'+
    button('class-confirm',selected.name+(old?'로 변경 확정':' 선택 확정'),{cl:'primary',disabled:old?.id===selected.id})+
    button('class-later',game.classOrigin==='arrival'?'나중에 선택':'영웅 기록으로')+'</div></div>';
}
function profileView(){
  const p=game.profile,s=Engine.stats(p),c=classInfo(p.rpg.classId),parts=RPG.breakdown(p);
  const stats=Object.entries(statNames).map(([key,label])=>'<tr data-stat="'+key+'"><th scope="row">'+label+'</th>'+
    ['base','classBonus','equipment','skills','permanent'].map(part=>'<td>'+((parts[part]?.[key])||'—')+'</td>').join('')+'<td><strong>'+s[key]+'</strong></td></tr>').join('');
  const slots=Object.entries(slotNames).map(([slot,name])=>{
    const g=gearInfo(p.rpg.equipped[slot]);
    return button('gear-slot','<span class="slot-symbol">'+(g?RpgArt.gear(g.id):icon(slot==='weapon'?'sword':slot==='armor'?'shield':'crystal'))+
      '</span><span><small>'+name+'</small><b>'+(g?g.name:'빈 슬롯')+'</b></span>',{id:slot,cl:'slot-button'});
  }).join('');
  const achievements=Engine.achievements.filter(a=>p.achievements.includes(a.id));
  return rpgNav('profile')+'<div class="hero-record"><section class="panel hero-portrait tone-'+(c?.id||'vanguard')+'"><div class="halo" aria-hidden="true"></div>'+
    '<span class="eyebrow">ADVENTURER</span><div class="hero-figure">'+RpgArt.hero(c?.id)+'</div><div class="hero-identity"><small>Lv. '+p.level+' · '+(c?.name||'직업 미선택')+'</small>'+
    '<h2>알렉스 <i>Alex</i></h2>'+button('class-open',c?'직업 변경':'직업 선택')+'</div></section>'+
    '<div class="hero-ledger"><section class="panel stat-ledger"><div class="rpg-heading"><div><span class="eyebrow">CHARACTER RECORD</span><h2>영웅 기록</h2></div><b class="purse">금화 '+p.gold+'</b></div>'+
    '<div class="hero-meter"><label>체력 <b>'+p.hp+' / '+s.maxHp+'</b></label><progress aria-label="체력" value="'+p.hp+'" max="'+s.maxHp+'"></progress></div>'+
    '<div class="hero-meter xp"><label>경험치 <b>'+p.xp+' / '+s.nextXp+'</b></label><progress aria-label="경험치" value="'+p.xp+'" max="'+s.nextXp+'"></progress></div>'+
    '<table class="stats-table"><caption>능력치 구성</caption><thead><tr><th>능력</th><th>기본</th><th>직업</th><th>장비</th><th>스킬</th><th>망토</th><th>합계</th></tr></thead><tbody>'+stats+'</tbody></table>'+
    (c?'<div class="class-techniques">'+c.abilities.map(a=>'<p><b>'+a.name+'</b> '+a.description+'</p>').join('')+'</div>':'')+
    '<div class="points-band"><span>사용할 스킬 포인트 <b>'+p.rpg.availablePoints+' SP</b></span>'+button('skills','스킬 트리 열기')+'</div></section>'+
    '<section class="panel slots-panel"><h3>착용 장비</h3><div class="slot-row">'+slots+'</div></section></div></div>'+
    '<details class="rpg-help"><summary>모험 업적 · '+achievements.length+' / '+Engine.achievements.length+'</summary><div class="achievement-list">'+
    Engine.achievements.map(a=>'<div class="achievement '+(p.achievements.includes(a.id)?'earned':'')+'">'+icon(p.achievements.includes(a.id)?'star':'lock')+
    '<div><strong>'+safe(a.name)+'</strong><small>'+safe(a.description)+'</small></div></div>').join('')+'</div></details>'+
    helpNote('능력치 읽는 법','이 수치는 전투에서 쓰는 힘입니다. 검격에만 적용되는 추가 피해와 스킬의 백분율 효과는 해당 기술을 쓸 때 계산해요. 영어 연습량은 나의 영어 성장 기록에서 볼 수 있어요.');
}
function skillView(){
  const p=game.profile,r=p.rpg,inspected=RPG.skills.find(s=>s.id===game.skillInspect)||RPG.skills[0];
  const learned=r.skills.includes(inspected.id),pre=RPG.skills.find(s=>s.id===inspected.requires);
  const glyph=s=>s.branch==='arcane'?'flame':s.branch==='survival'?(s.requires?'leaf':'shield'):'sword';
  const trees=Object.entries(branchNames).map(([branch,title])=>{
    const nodes=RPG.skills.filter(s=>s.branch===branch).map(s=>{
      const has=r.skills.includes(s.id),can=RPG.canLearn(p,s.id),status=has?'습득':can?'습득 가능':s.requires&&!r.skills.includes(s.requires)?'선행 스킬 필요':'포인트 필요';
      return button('skill-node','<span class="skill-stone">'+icon(glyph(s))+'</span><b>'+s.name+'</b><small>'+status+'</small>',{id:s.id,cl:'skill-node '+(has?'learned':can?'available':'locked'),pressed:s.id===inspected.id});
    }).join('<div class="skill-link" aria-hidden="true"></div>');
    return '<div class="skill-branch branch-'+branch+'"><h3>'+title+'</h3><div class="node-chain">'+nodes+'</div></div>';
  }).join('');
  return rpgNav('skills')+heading('CRYSTAL CONSTELLATIONS','스킬 트리','레벨 2부터 레벨당 1포인트를 얻어요. 별을 눌러 효과를 먼저 살펴보세요.')+
    '<div class="points-band panel"><span>사용 가능 <b>'+r.availablePoints+' SP</b> · 사용한 포인트 '+r.spentPoints+'</span>'+
    button('skill-reset','스킬 초기화',{disabled:!r.spentPoints})+'</div>'+
    (game.resetPending?'<div class="panel respec-confirm" role="group"><h3>스킬을 초기화할까요?</h3><p>배운 스킬을 해제하고 '+r.spentPoints+' SP를 돌려받습니다. 레벨, 장비, 학습 기록은 유지됩니다.</p>'+button('skill-reset-cancel','취소')+' '+button('skill-reset-confirm','초기화 확정',{cl:'primary'})+'</div>':'')+
    '<div class="skill-layout"><div class="panel constellation">'+trees+'</div><section class="panel skill-inspector"><span class="eyebrow">'+inspected.en.toUpperCase()+'</span><h3>'+inspected.name+'</h3>'+
    '<p>'+inspected.description+'</p><p>비용 '+inspected.cost+' SP · 선행 '+(pre?pre.name:'없음')+'</p>'+
    button('skill-learn',learned?'이미 습득':!RPG.canLearn(p,inspected.id)?(pre&&!r.skills.includes(pre.id)?pre.name+' 먼저 습득':'포인트 부족'):'1 SP로 습득',{cl:'primary',disabled:!RPG.canLearn(p,inspected.id)||game.resetPending})+
    messageBox()+'</section></div>'+helpNote('스킬과 직업의 차이','여섯 스킬은 어느 직업이든 배울 수 있어요. 직업 고유 효과는 직업과 함께 바뀌고, 이곳에서 배운 스킬은 전직 후에도 남아요.');
}
function messageBox(){return game.rpgMessage?'<p class="rpg-message" role="status">'+safe(game.rpgMessage)+'</p>':'';}
function compareGear(p,g){
  const current=gearInfo(p.rpg.equipped[g.slot]),preview=RPG.preview(p,g.id);
  const changes=Object.entries(statNames).filter(([key])=>preview.delta[key]).map(([key,label])=>
    '<span>'+label+' '+preview.before[key]+' → <strong>'+preview.after[key]+'</strong> ('+signed(preview.delta[key])+')</span>'
  ).join('');
  return '<div class="gear-comparison"><small>현재 '+slotNames[g.slot]+' · '+(current?current.name:'미착용')+'</small><b>착용 시 변화</b>'+
    '<p>'+ (changes||'변화 없음')+'</p></div>';
}
function equipmentView(){
  const p=game.profile,r=p.rpg,slot=game.gearSlot||'weapon';
  const g=gearInfo(game.gearInspect)||RPG.gear.find(g=>g.slot===slot);
  const owned=r.collection.includes(g.id),worn=r.equipped[g.slot]===g.id;
  const slots=Object.entries(slotNames).map(([key,label])=>{
    const item=gearInfo(r.equipped[key]);
    return button('gear-slot','<span class="slot-symbol">'+(item?RpgArt.gear(item.id):icon(key==='weapon'?'sword':key==='armor'?'shield':'crystal'))+'</span><span><b>'+label+'</b><small>'+(item?item.name:'미착용')+'</small></span>',{id:key,cl:'slot-button',pressed:slot===key});
  }).join('');
  const tiles=RPG.gear.filter(i=>i.slot===slot).map(i=>button('gear-inspect','<span class="gear-mini">'+RpgArt.gear(i.id)+'</span><span><small>'+rarityNames[i.rarity]+' · '+(r.equipped[slot]===i.id?'착용 중':r.collection.includes(i.id)?'보유':'미보유')+'</small><b>'+i.name+'</b></span>',
    {id:i.id,cl:'gear-tile rare-'+i.rarity,pressed:i.id===g.id})).join('');
  return rpgNav('equipment')+heading('ARMORY','장비 보관함','슬롯을 고른 뒤 장비를 눌러 착용 전후의 차이를 확인하세요.')+
    '<div class="armory-layout"><aside class="panel loadout"><div class="loadout-figure">'+RpgArt.hero(r.classId)+'</div><div class="worn-slots">'+slots+'</div></aside>'+
    '<section class="panel gear-picker"><h3>'+slotNames[slot]+' 도감</h3><div class="gear-tiles">'+tiles+'</div></section>'+
    '<section class="panel gear-detail rare-'+g.rarity+'"><div class="gear-display">'+RpgArt.gear(g.id)+'</div><div class="gear-kicker">'+gearLabel(g)+'</div><i>'+g.en+'</i>'+
    '<h3>'+g.name+'</h3><p>'+g.description+'</p><strong class="stat-gain">'+bonusText(g.bonuses)+'</strong>'+compareGear(p,g)+
    '<p>획득 · '+g.source+(g.price!==null?' · '+g.price+' 금화':'')+'</p>'+
    (worn?button('gear-unequip','장착 해제'):owned?button('gear-equip','장착하기',{cl:'primary'}):
     (p.currentChapter===2&&g.price!==null?button('gear-market','시장 상점으로'):'<small>획득하면 장착할 수 있어요.</small>'))+messageBox()+'</section></div>';
}
function gearShopCard(p,g){
  const n=VillageEngine.quantity(p,g.id),poor=p.gold<g.price;
  return '<article class="panel shop-item rare-'+g.rarity+'"><div class="item-art">'+RpgArt.gear(g.id)+'</div>'+gearLabel(g)+'<h3>'+g.name+'</h3><p>'+g.description+'</p>'+
    '<b>'+bonusText(g.bonuses)+'</b>'+compareGear(p,g)+'<div class="stock"><b>'+g.price+' 금화</b><small>보유 '+n+' / 1</small></div>'+
    button('purchase',n?'보유 중':poor?'금화 부족':'구매하기',{id:g.id,disabled:n>0||poor,cl:'primary'})+'</article>';
}
function lootReveal(id){
  const gear=gearInfo(id);if(!gear)return '';
  return '<div class="rpg-loot-reveal rare-'+gear.rarity+'">'+RpgArt.gear(id)+'<div><small>'+rarityNames[gear.rarity]+' 장비 획득</small><strong>'+gear.name+'</strong><span>'+bonusText(gear.bonuses)+'</span></div></div>';
}
