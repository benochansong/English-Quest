/* Complete file:// journey through the forest, the village and the final shop conversation. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {
  chapter, checkLayout, ctl, click, wait, visible, rapidClick, createOfflinePage, continueSaved,
  profile, encounter, attempts, answerReview
} = require('./browser.cjs');
const captureDir = process.argv.includes('--village-screenshots')
  ? path.resolve(__dirname,'../docs/screenshots') : null;

async function capture(page,name,width=1366,height=768) {
  if (!captureDir) return;
  const before = page.viewportSize();
  await page.setViewportSize({width,height});
  await page.evaluate(async () => {
    window.scrollTo(0,0);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.locator('.world').screenshot({path:path.join(captureDir,'village-'+name+'.png')});
  await page.setViewportSize(before);
}

async function conversation(page,stage,wrongFirst=false) {
  await click(page,'talk',stage);
  let replies = 0, correctReplies = 0, missed = '';
  while (await visible(page,'reply') && replies++ < 20) {
    const session = await page.evaluate(() => game.dialogue);
    const before = await profile(page);
    const correct = !(wrongFirst && replies===1);
    const index = session.choices.findIndex(choice => (choice === session.question.answer) === correct);
    assert.ok(index >= 0);
    if (stage===5 && replies===1) {
      await checkLayout(page,'inn-conversation');
      await capture(page,'inn-conversation',390,844);
    }
    if (stage===4 && replies===1) await capture(page,'clara');
    if(stage===5 && replies===1) {
      await page.setViewportSize({width:390,height:844});
      await ctl(page,'reply',index).tap();
      await page.setViewportSize({width:1366,height:768});
    } else await rapidClick(page,ctl(page,'reply',index));
    await wait(page,'dialogue-next');
    if(correct){
      const translation = session.line.options.find(option=>option.text===session.choices[index]).ko;
      assert.ok(translation, 'the correct NPC reply needs a Korean translation');
      assert.ok((await page.locator('.speech-tools').innerText()).includes(translation));
    }
    const after = await profile(page);
    assert.equal(attempts(after),attempts(before)+session.question.tags.length);
    assert.equal(after.gold,before.gold);
    if (stage !== 'scenario') {
      assert.equal(after.village.progress[stage].step,before.village.progress[stage].step + Number(correct));
    }
    if (!correct) {
      missed = session.question.id;
      assert.ok(after.mistakes[missed] > 0);
      assert.ok((await page.locator('body').innerText()).includes(session.question.answer));
    } else correctReplies++;
    await click(page,'dialogue-next');
    if(stage===4 && correct && correctReplies===1) {
      await page.reload();
      await click(page,'continue');
      await click(page,'destination','market');
      await click(page,'talk',stage);
      assert.equal(await page.evaluate(() => game.dialogue.step),after.village.progress[stage].step);
    }
  }
  assert.ok(correctReplies >= 2, 'NPC needs multiple correct exchanges');
  return missed;
}

async function buy(page,id,price) {
  const before = await profile(page);
  await click(page,'purchase',id);
  await rapidClick(page,ctl(page,'buy-confirm'));
  const after = await profile(page);
  assert.equal(after.gold,before.gold-price);
  assert.equal(after.village.inventory[id],before.village.inventory[id]+1);
}

async function stockUp(page) {
  await click(page,'shop');
  await checkLayout(page,'market-shop');
  await capture(page,'shop');
  await page.setViewportSize({width:360,height:800});
  for(let n=0;n<3;n++) await buy(page,'potion',20);
  await page.setViewportSize({width:1366,height:768});
  assert.ok(await ctl(page,'purchase','potion').isDisabled());
  await buy(page,'charm',50);
  assert.ok(await ctl(page,'purchase','charm').isDisabled());
  assert.ok(await ctl(page,'purchase','cloak').isDisabled());
  assert.equal((await profile(page)).gold,5);
  const receipt = await profile(page);
  await page.reload();
  await click(page,'continue');
  assert.deepEqual((await profile(page)).village.inventory,receipt.village.inventory);
  assert.equal((await profile(page)).gold,receipt.gold);
  await click(page,'destination','market');
}

async function answerQuestion(page,correct) {
  const {question,choices} = await page.evaluate(() => game.task);
  if (question.type === 'order') {
    const ordered=[...question.choices];
    if (!correct) ordered.reverse();
    const used = new Set();
    for (const token of ordered) {
      const index = choices.findIndex((choice,i) => choice===token && !used.has(i));
      assert.ok(index >= 0,'all required tokens must be available');
      used.add(index);
      await ctl(page,'word',index).tap();
      assert.ok(await page.evaluate(i=>game.order.includes(i),index),
        'the first rapid token tap after retry must be accepted');
    }
    await rapidClick(page,ctl(page,'submit-order'));
  } else {
    const index = choices.findIndex(choice => (choice===question.answer)===correct);
    assert.ok(index >= 0,'question must have a valid option');
    await rapidClick(page,ctl(page,'choice',index));
  }
  return question;
}

async function settle(page) {
  await page.waitForFunction(() => ['ability','rewards','retry'].some(action =>
    document.querySelector('[data-act="'+action+'"]:not(:disabled)')));
}

async function battleItem(page,id) {
  const before = await profile(page);
  const start = await encounter(page);
  const applied = await ctl(page,'item-use',id).evaluate(button=>{
    button.click(); button.click();
    return {hp:game.battle.hp,charm:game.battle.charm,max:Engine.stats(game.profile).maxHp};
  });
  if(id==='potion') assert.equal(applied.hp,Math.min(applied.max,start.hp+30));
  if(id==='charm') assert.equal(applied.charm,true);
  await settle(page);
  const end = await encounter(page);
  assert.equal((await profile(page)).village.inventory[id],before.village.inventory[id]-1);
  assert.equal(end.turn,start.turn+1);
  assert.equal(end.enemyHp,start.enemyHp);
  if (id==='potion') assert.ok(end.hp <= start.hp+30 && end.hp>0);
}

async function villageBattle(page,stage,training=false,replay=false) {
  if(training) await click(page,'train');
  else await click(page,'village-fight',stage);
  await click(page,'fight');
  await wait(page,'ability');
  if (!training && !replay && stage<6) await capture(page,stage===4?'shadow-crow':'echo-wisp');
  const before = await profile(page);
  let attemptedBreak = false, interrupted = false;
  const types = new Set();
  for (let turns=0; turns<60 && await visible(page,'ability'); turns++) {
    const active = await encounter(page);
    if (stage===4 && !training && !replay && turns===1) { await battleItem(page,'charm'); continue; }
    if (stage===4 && !training && !replay && turns===2 && await ctl(page,'item-use','potion').isEnabled()) {
      await battleItem(page,'potion'); continue;
    }
    const broken = stage===6 && active.turn%3===0;
    let skill = 'sword';
    if (!training && !broken && turns%3===1 && await ctl(page,'ability','fire').isEnabled()) skill='fire';
    if (!training && active.hp < 55 && !broken && await ctl(page,'ability','heal').isEnabled()) skill='heal';
    await click(page,'ability',skill);
    const q = await page.evaluate(() => game.task.question);
    types.add(q.type);
    if (q.type==='listening') assert.ok((await page.locator('body').innerText()).includes(q.phrase));
    if (broken && !attemptedBreak) {
      await checkLayout(page,'broken-sentence');
      await capture(page,'sentence-golem');
      await answerQuestion(page,false);
      await click(page,'broken-retry');
      attemptedBreak = true;
    }
    const question = await answerQuestion(page,true);
    await wait(page,'resolve');
    assert.ok((await page.locator('body').innerText()).includes(question.explanation));
    await rapidClick(page,ctl(page,'resolve'));
    await settle(page);
    if (broken) {
      assert.equal((await encounter(page)).hp,active.hp,'successful reconstruction should interrupt the attack');
      interrupted = true;
    }
  }
  await wait(page,'rewards');
  await rapidClick(page,ctl(page,'rewards'));
  await wait(page,'onwards');
  const after = await profile(page);
  if(training || replay) {
    assert.equal(after.gold,before.gold); assert.equal(after.xp,before.xp);
    assert.ok(attempts(after)>attempts(before));
  } else {
    assert.equal(after.village.progress[stage].completed,true);
    assert.ok(after.gold>before.gold);
    if(stage===6) assert.ok(attemptedBreak && interrupted);
    if(stage===6) assert.ok(after.rpg.collection.includes('runicSword'));
  }
  console.log('village',training?'training':stage,'completed, question types', [...types].join(', '));
  await click(page,'onwards');
}

async function atSquare(page) {
  if(await visible(page,'village-home')) await click(page,'village-home');
  await wait(page,'destination');
}

async function checkChapterLock(page) {
  await click(page,'chapters');
  assert.ok(await ctl(page,'chapter',2).isDisabled());
  await checkLayout(page,'chapter-selection');
  await click(page,'chapter',1);
}

async function changeRate(page,value) {
  await click(page,'settings');
  const setting = page.locator('[data-setting=speechRate]');
  await setting.selectOption(value);
  await click(page,'close');
  assert.equal((await profile(page)).settings.speechRate,value);
}

async function playVillage(page) {
  if(process.argv.includes('--from-v02')) {
    await loadLegacyProfile(page);
  } else {
    await chapter(page,{stayAtEnding:true,onFreshMap:checkChapterLock});
  }
  const forest = await profile(page);
  await click(page,'chapters');
  await click(page,'chapter',2);
  await wait(page,'destination');
  const arrival = await profile(page);
  assert.equal(arrival.currentChapter,2);
  for(const field of ['level','xp','gold','completed','learning','mistakes']) {
    assert.deepEqual(arrival[field],forest[field]);
  }
  assert.ok(await ctl(page,'destination','gate').isDisabled());
  await checkLayout(page,'village-square');
  await capture(page,'square');
  await changeRate(page,'slow');
  await changeRate(page,'normal');
  await click(page,'quests');
  await checkLayout(page,'quest-journal');
  await atSquare(page);
  let missed = '';
  for(const [stage,location] of [[4,'market'],[5,'inn'],[6,'gate']]) {
    await click(page,'destination',location);
    if (stage===4) await stockUp(page);
    await checkLayout(page,'location-'+location);
    await click(page,'accept-quest',stage);
    const state = (await profile(page)).village.progress[stage];
    assert.ok(state.accepted && !state.completed);
    const mistaken = await conversation(page,stage,true);
    if(mistaken) missed=mistaken;
    await villageBattle(page,stage);
    const finished = await profile(page);
    assert.ok(finished.village.progress[stage].wrong>0);
    assert.ok(finished.village.progress[stage].correct>0);
    assert.ok(finished.village.progress[stage].reviewTags.length>0);
    if (stage!==6) await atSquare(page);
  }
  const cleared = await profile(page);
  assert.equal(cleared.village.inventory.potion,2);
  assert.equal(cleared.village.inventory.charm,0);
  await conversation(page,'scenario',true);
  const ending = await profile(page);
  assert.equal(ending.village.scenarioComplete,true);
  assert.ok(ending.achievements.includes('villageVoice'));
  await capture(page,'ending');
  await atSquare(page);
  await click(page,'destination','market');
  await click(page,'shop');
  await buy(page,'cloak',80);
  assert.ok(await ctl(page,'purchase','cloak').isDisabled());
  await click(page,'shop-back');
  await villageBattle(page,4,false,true);
  await atSquare(page);
  await click(page,'inventory');
  await checkLayout(page,'inventory');
  assert.ok((await page.locator('body').innerText()).includes('탐험가의 망토'));
  await atSquare(page);
  await villageBattle(page,4,true);
  await atSquare(page);
  await click(page,'review');
  await click(page,'review-one',missed);
  await answerReview(page,missed,true);
  await click(page,'review-back');
  const last = await profile(page);
  await page.reload();
  await click(page,'continue');
  await wait(page,'destination');
  assert.deepEqual(await profile(page),last);
  await click(page,'chapters');
  await click(page,'chapter',1);
  await wait(page,'stage');
  assert.equal((await profile(page)).village.scenarioComplete,true);
  console.log('fresh forest → village → golem → practical scenario; inventory, review and return to forest passed');
}

async function loadLegacyProfile(page) {
  // Captured by playing commit 80e713d through its published v0.2 UI, then
  // completing one missed question in its journal. No real player data is used.
  const source = await fs.readFile(path.join(__dirname,'fixtures/v02-completed.json'),'utf8');
  await page.evaluate(text => localStorage.setItem('EnglishQuest.chapter1.v2',text),source);
  await page.reload();
  await continueSaved(page);
  return source;
}

async function migration(browser) {
  const {page,context,problems,network} = await createOfflinePage(browser);
  try {
    // Headless Windows can have no local English voice. Simulate native start/end
    // callbacks for this one test; the actual journey above runs without speech.
    await page.addInitScript(()=>{
      const voice = {name:'Offline QA English',lang:'en-US',localService:true};
      window.testSpeech = {rates:[],current:null};
      Object.defineProperty(window,'SpeechSynthesisUtterance',{
        configurable:true,value:class {constructor(text){this.text=text;}}
      });
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:Object.assign(new EventTarget(),{
        getVoices:()=>[voice],
        speak(utterance){window.testSpeech.current=utterance;window.testSpeech.rates.push(utterance.rate);utterance.onstart?.();},
        cancel(){window.testSpeech.current?.onend?.();window.testSpeech.current=null;}
      })});
    });
    const source = await loadLegacyProfile(page);
    const old = JSON.parse(source);
    const migrated = await page.evaluate(() => game.profile);
    assert.equal(migrated.version,7);
    for(const field of ['level','xp','hp','gold','completed','chapterComplete','mistakes','learning','history','schedule']) {
      assert.deepEqual(migrated[field],old[field],'v0.2 '+field+' was changed');
    }
    assert.deepEqual([...migrated.marked].sort(),[...old.marked].sort());
    for(const id of old.achievements) assert.ok(migrated.achievements.includes(id));
    for(const [key,value] of Object.entries(old.settings)) assert.equal(migrated.settings[key],value);
    await click(page,'chapters');
    await click(page,'chapter',2);
    await wait(page,'destination');
    const raw = await page.evaluate(() => localStorage.getItem('EnglishQuest.chapter1.v2'));
    assert.equal(raw,source);
    await click(page,'destination','market');
    for (const rate of ['normal','slow']) {
      await changeRate(page,rate);
      await click(page,'speak');
      await page.locator('.spoken-word.speaking').first().waitFor();
      await page.evaluate(()=>window.testSpeech.current.onend());
      assert.equal(await page.locator('.speaking').count(),0);
    }
    const rates = await page.evaluate(()=>window.testSpeech.rates);
    assert.equal(rates.length,2);
    assert.ok(rates[0]>rates[1] && rates[1]>0);
    assert.deepEqual(problems,[]); assert.deepEqual(network,[]);
    console.log('actual v0.2 checkpoint → current version and Chapter 2 entry passed, original bytes preserved');
  } finally { await context.close(); }
}

async function main() {
  if(captureDir) await fs.mkdir(captureDir,{recursive:true});
  const channel = process.env.QUEST_QA_BROWSER || 'chrome';
  const browser = await chromium.launch({channel,headless:true});
  try {
    console.log(channel,browser.version(),'village offline test');
    await migration(browser);
    const {context,page,problems,network} = await createOfflinePage(browser,{disableSpeech:true});
    try {
      page.on('console',msg=>{if(msg.type()==='error')problems.push(msg.text());});
      await playVillage(page);
      assert.deepEqual(problems,[]); assert.deepEqual(network,[]);
      console.log('No page errors or HTTP(S) requests.');
    } catch(error) {
      console.error('Failure at', await page.evaluate(()=>({
        screen:game.screen,stage:game.stage,
        actions:Array.from(document.querySelectorAll('button[data-act]:not(:disabled)')).map(b=>b.dataset.act)
      })),problems);
      throw error;
    } finally { await context.close(); }
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
