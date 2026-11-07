/* Drive the packaged file offline, with separate profiles for new and returning heroes. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {createOfflinePage,checkLayout,ctl,click,wait,visible,rapidClick,profile,encounter,enterStage,playTurn}=require('./browser.cjs');
const screenshots=process.argv.includes('--screenshots')?path.resolve(__dirname,'../docs/screenshots'):null;
const classNames=['vanguard','arcanist','pathfinder'];
const bonuses=id=>({words:['guardianArmor',20],sentences:['enchantedRobe',25],echoes:['echoSigil',30]})[id];

async function capture(page,id,width=1366,height=768){
  if(!screenshots)return;
  const prev=page.viewportSize();
  await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
  await page.locator('.world').screenshot({path:path.join(screenshots,'rpg-'+id+'.png')});
  await page.setViewportSize(prev);
}
async function reloadHub(page){
  await page.reload();await click(page,'continue');await wait(page,'profile');
  assert.ok(!await visible(page,'class-confirm'),'one-time offer reopened');
}
async function returnHub(page){
  if(await visible(page,'rpg-home'))await click(page,'rpg-home');
  await wait(page,'profile');
}
const stats=page=>page.evaluate(()=>Engine.stats(game.profile));
const keyStats=s=>Object.fromEntries(['maxHp','attack','magic','defense'].map(k=>[k,s[k]]));
const learning=p=>({learning:p.learning,mistakes:p.mistakes,voice:p.voice,history:p.history,schedule:p.schedule});
async function confirmClass(page,id){
  await click(page,'class-preview',id);await rapidClick(page,ctl(page,'class-confirm'));
  assert.equal((await profile(page)).rpg.classId,id);
}
async function newHero(page){
  await click(page,'new');await click(page,'intro-skip');await wait(page,'class-preview');
  const base=await stats(page);
  for(const id of classNames){
    await click(page,'class-preview',id);
    assert.equal((await profile(page)).rpg.classId,null,'preview mutated the profile');
    assert.deepEqual(keyStats(await stats(page)),keyStats(base));
  }
  await checkLayout(page,'class-selection');
  await capture(page,'classes');
  await confirmClass(page,'vanguard');
  const p=await profile(page);
  assert.equal(p.rpg.availablePoints,0);assert.ok(p.achievements.includes('firstAdventurer'));
  assert.equal((await stats(page)).maxHp,base.maxHp+10);
  await reloadHub(page);await click(page,'trials');
  await click(page,'trial-select','sentences');
  assert.ok(await ctl(page,'trial-start').isDisabled(),'sentence guardian unlocked before the first guardian');
  await click(page,'trial-select','words');
  assert.ok(await ctl(page,'trial-start').isEnabled());
  console.log('new player can preview three classes, confirm once and enter the first optional trial');
}

async function loadLegacy(page){
  // Captured by completing the actual 6efb022 UI, never taken from a player.
  const raw=await fs.readFile(path.join(__dirname,'fixtures/v04-completed.json'),'utf8');
  const old=JSON.parse(raw);
  await page.evaluate(value=>localStorage.setItem('EnglishQuest.v4',value),raw);
  await page.reload();await click(page,'continue');await wait(page,'class-preview');
  const migrated=await profile(page);
  assert.equal(migrated.version,7);
  for(const field of ['level','xp','hp','gold','unlocked','completed','chapterComplete','currentChapter','village','learning','mistakes','history','schedule','voice','settings']){
    assert.deepEqual(migrated[field],old[field],'v4 migration changed '+field);
  }
  for(const id of old.achievements)assert.ok(migrated.achievements.includes(id));
  assert.equal(migrated.rpg.classId,null);
  assert.equal(migrated.rpg.availablePoints,old.level-1);
  for (const id of ['travelerSword','crystalBlade','runicSword'])assert.ok(migrated.rpg.collection.includes(id));
  // Deferring the prompt is durable and never consumes historical skill points.
  await click(page,'class-later');await reloadHub(page);
  assert.equal((await profile(page)).rpg.availablePoints,old.level-1);
  await click(page,'profile');await click(page,'class-open');await confirmClass(page,'pathfinder');
  await reloadHub(page);await click(page,'profile');
  await checkLayout(page,'hero-profile');await capture(page,'profile');
  assert.equal(await page.evaluate(()=>localStorage.getItem('EnglishQuest.v4')),raw);
  return old;
}

async function learn(page,id){
  const before=await profile(page);
  await click(page,'skill-node',id);await rapidClick(page,ctl(page,'skill-learn'));
  const after=await profile(page);
  assert.equal(after.rpg.availablePoints,before.rpg.availablePoints-1);
  assert.equal(after.rpg.spentPoints,before.rpg.spentPoints+1);
  assert.ok(after.rpg.skills.includes(id));
}
async function refund(page){
  const before=await profile(page);
  await click(page,'skill-reset');await rapidClick(page,ctl(page,'skill-reset-confirm'));
  const after=await profile(page);
  assert.equal(after.rpg.availablePoints,before.rpg.availablePoints+before.rpg.spentPoints);
  assert.equal(after.rpg.spentPoints,0);assert.deepEqual(after.rpg.skills,[]);
  assert.deepEqual(learning(after),learning(before));assert.equal(after.gold,before.gold);
}
async function tree(page){
  await click(page,'skills');
  await checkLayout(page,'skill-tree');
  await click(page,'skill-node','bladeMastery');
  assert.ok(await ctl(page,'skill-learn').isDisabled());
  const initial=await stats(page);
  await learn(page,'swordTraining');await learn(page,'bladeMastery');await learn(page,'ironDefense');
  assert.equal((await stats(page)).defense,initial.defense+1);
  await click(page,'skill-node','healingKnowledge');
  assert.ok(await ctl(page,'skill-learn').isDisabled());
  await capture(page,'skills');
  await click(page,'skill-reset');await click(page,'skill-reset-cancel');
  assert.equal((await profile(page)).rpg.spentPoints,3);
  await refund(page);assert.deepEqual(keyStats(await stats(page)),keyStats(initial));
  await learn(page,'magicTraining');await learn(page,'flameMastery');await refund(page);
  await learn(page,'ironDefense');await learn(page,'healingKnowledge');await refund(page);
  await reloadHub(page);assert.equal((await profile(page)).rpg.availablePoints,3);
  console.log('six skill nodes, prerequisite and point locks, cancel/refund and reload passed');
}

async function equipment(page){
  await click(page,'profile');await click(page,'equipment');
}
async function equip(page,id,slot){
  if(!await visible(page,'gear-inspect',id)) await click(page,'gear-slot',slot);
  await click(page,'gear-inspect',id);await rapidClick(page,ctl(page,'gear-equip'));
  assert.equal((await profile(page)).rpg.equipped[slot],id);
}
async function removeGear(page,id,slot){
  if(!await visible(page,'gear-inspect',id)) await click(page,'gear-slot',slot);
  await click(page,'gear-inspect',id);await click(page,'gear-unequip');
  assert.equal((await profile(page)).rpg.equipped[slot],null);
}

async function shownStats(page){
  const real=await stats(page);
  for(const [key,label] of Object.entries({maxHp:'최대 체력',attack:'공격',magic:'마력',defense:'방어'})){
    const row=page.locator('.stats-table tbody tr').filter({has:page.getByRole('rowheader',{name:label,exact:true})});
    const shown=await row.locator('td').last().innerText();
    assert.equal(Number(shown.trim()),real[key],'profile displayed wrong '+key);
  }
}

async function market(page){
  await click(page,'chapters');await click(page,'chapter',2);
  await click(page,'destination','market');await click(page,'shop');await click(page,'shop-gear');
  await checkLayout(page,'gear-shop');
  assert.ok(await ctl(page,'purchase','scholarAmulet').isDisabled());
  for(const [id,price] of [['leatherArmor',35],['forestCharm',25]]){
    const old=await profile(page);
    await click(page,'purchase',id);await click(page,'buy-cancel');
    assert.deepEqual(await profile(page),old,'cancel charged or equipped an item');
    await click(page,'purchase',id);await rapidClick(page,ctl(page,'buy-confirm'));
    const paid=await profile(page);
    assert.equal(paid.gold,old.gold-price);
    assert.equal(paid.rpg.collection.filter(gearId=>gearId===id).length,1);
    assert.ok(await ctl(page,'purchase',id).isDisabled());
  }
  await reloadHub(page);
  assert.equal((await profile(page)).gold,20);
  await click(page,'inventory');await click(page,'equipment');
  const baseline=await stats(page);
  await equip(page,'leatherArmor','armor');await equip(page,'forestCharm','accessory');
  const fullyEquipped=await stats(page);
  assert.equal(fullyEquipped.defense,baseline.defense+2);assert.equal(fullyEquipped.maxHp,baseline.maxHp+5);
  assert.ok((await profile(page)).achievements.includes('wellEquipped'));
  await checkLayout(page,'equipment');await capture(page,'equipment');
  await returnHub(page);await click(page,'profile');await shownStats(page);
  await returnHub(page);
  console.log('shop confirmation, insufficient gold, equip/unequip, simultaneous slots and actual profile totals passed');
}

async function trialAnswer(page,correct){
  const {q,choices}=await page.evaluate(()=>({q:game.trial.question,choices:game.trial.choices}));
  if(q.type==='order'){
    const tokens=[...q.choices],used=new Set();
    if(!correct)tokens.reverse();
    for(const word of tokens){
      const index=choices.findIndex((item,i)=>item===word&&!used.has(i));assert.ok(index>=0);
      used.add(index);await ctl(page,'trial-tile',index).tap();
      assert.ok(await page.evaluate(i=>game.trial.order.includes(i),index),'tap ignored');
    }
    await rapidClick(page,ctl(page,'trial-submit'));
  }else{
    const index=choices.findIndex(value=>(value===q.answer)===correct);
    assert.ok(index>=0);await rapidClick(page,ctl(page,'trial-choice',index));
  }
  return q;
}

async function trial(page,id,replay=false){
  const before=await profile(page),[item,amount]=bonuses(id);
  await click(page,'trial-select',id);await click(page,'trial-start');
  const questions=[];
  for(let i=0;i<5;i++){
    if(i===0&&!replay){
      await checkLayout(page,'trial-'+id);
      await capture(page,'trial-'+id,id==='sentences'?390:1366,id==='sentences'?844:768);
      if(id==='sentences')await page.setViewportSize({width:390,height:844});
      if(id==='echoes')assert.ok(await page.evaluate(()=>game.trial.aids.has('fallback')));
      const missed=await trialAnswer(page,false);
      assert.equal(await page.evaluate(()=>game.trial.seals),0);
      assert.ok((await page.locator('body').innerText()).includes(missed.explanation));
      await click(page,'trial-next');
      assert.equal(await page.evaluate(()=>game.trial.question.id),missed.id);
    }
    const q=await trialAnswer(page,true);
    assert.ok(!questions.includes(q.id),'trial repeated a question');questions.push(q.id);
    assert.equal(await page.evaluate(()=>game.trial.seals),i+1);
    await click(page,'trial-next');
    if(id==='sentences'&&i===0&&!replay)await page.setViewportSize({width:1366,height:768});
  }
  const end=await profile(page),result=end.rpg.dungeons[id];
  assert.equal(end.gold,before.gold+(replay?0:amount));
  assert.deepEqual(result.lastIds,questions);assert.equal(result.clears,before.rpg.dungeons[id].clears+1);
  assert.equal(result.best,replay?5:4);
  assert.equal(end.rpg.collection.filter(x=>x===item).length,1);
  assert.equal(end.xp,before.xp);
  assert.ok(end.achievements.includes('crystalGuardian'));
  if(id==='echoes'&&!replay) await capture(page,'trial-rewards');
  await reloadHub(page);assert.deepEqual((await profile(page)).rpg,end.rpg);
  await click(page,'trials');
}

async function dungeons(page){
  await click(page,'trials');await checkLayout(page,'trial-entrance');
  for(const id of ['words','sentences','echoes']){
    await trial(page,id);
    await trial(page,id,true);
  }
  await returnHub(page);await equipment(page);
  await equip(page,'guardianArmor','armor');await equip(page,'echoSigil','accessory');
  await click(page,'gear-slot','armor');
  await click(page,'gear-inspect','enchantedRobe');await capture(page,'rare-comparison');
  await reloadHub(page);
  await click(page,'destination','market');await click(page,'shop');await click(page,'shop-gear');
  assert.equal((await profile(page)).gold,95);
  await click(page,'purchase','scholarAmulet');await rapidClick(page,ctl(page,'buy-confirm'));
  assert.equal((await profile(page)).gold,0);
  assert.ok((await profile(page)).rpg.collection.includes('scholarAmulet'));
  console.log('all three rooms, English corrections, mobile word order, offline echoes and replay reward locks passed');
}

async function run(browser,journey){
  const {page,context,problems,network}=await createOfflinePage(browser,{disableSpeech:true});
  try{
    page.on('console',msg=>{if(msg.type()==='error')problems.push(msg.text());});
    await journey(page);assert.deepEqual(network,[]);assert.deepEqual(problems,[]);
  }catch(error){
    console.error(await page.evaluate(()=>({screen:game.screen,actions:[...document.querySelectorAll('button[data-act]:not(:disabled)')].map(b=>[b.dataset.act,b.dataset.id]).slice(0,23)})),problems);
    throw error;
  }finally{await context.close();}
}

async function main(){
  if(screenshots)await fs.mkdir(screenshots,{recursive:true});
  const channel=process.env.QUEST_QA_BROWSER||'chrome',browser=await chromium.launch({channel,headless:true});
  try{
    console.log(channel,browser.version(),'offline character / trials');
    await run(browser,newHero);
    await run(browser,async page=>{
      await loadLegacy(page);await tree(page);await swapping(page);await market(page);await dungeons(page);
    });
    console.log('All RPG browser checks passed without external requests or browser errors.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
async function firstStrike(page,correct=true){
  await enterStage(page,1);
  const before=await encounter(page);
  await playTurn(page,'sword',correct,new Set());
  const damage=before.enemyHp-(await encounter(page)).enemyHp;
  await reloadHub(page);
  return damage;
}

async function swapping(page){
  const baseline=await stats(page);
  const unequippedDamage=await firstStrike(page);
  await equipment(page);
  await equip(page,'travelerSword','weapon');
  assert.equal((await stats(page)).attack,baseline.attack+2);
  await equip(page,'crystalBlade','weapon');
  assert.equal((await stats(page)).attack,baseline.attack+5);
  await equip(page,'runicSword','weapon');
  const runic=await stats(page);
  assert.equal(runic.attack,baseline.attack+3);assert.equal(runic.magic,baseline.magic+3);
  await removeGear(page,'runicSword','weapon');
  assert.deepEqual(keyStats(await stats(page)),keyStats(baseline));
  await equip(page,'crystalBlade','weapon');await reloadHub(page);
  const equippedDamage=await firstStrike(page);
  assert.ok(equippedDamage>unequippedDamage,'changing actual weapon must change combat');
  await click(page,'profile');await click(page,'skills');
  await learn(page,'swordTraining');await learn(page,'bladeMastery');await reloadHub(page);
  const trainedDamage=await firstStrike(page);
  assert.ok(trainedDamage>equippedDamage,'the skill tree must change an otherwise identical correct sword hit');
  assert.equal(await firstStrike(page,false),0,'gear and skills must never turn a wrong answer into damage');
  await click(page,'profile');await click(page,'skills');await refund(page);await reloadHub(page);
  await click(page,'profile');await click(page,'class-open');
  await confirmClass(page,'arcanist');await reloadHub(page);
  const changed=await stats(page);
  assert.equal((await profile(page)).rpg.equipped.weapon,'crystalBlade');
  assert.equal(changed.magic,baseline.magic+3);
  assert.equal(changed.attack,baseline.attack-2+5);
  console.log('three weapon swaps, removal and class change update actual damage and retain equipment');
}
