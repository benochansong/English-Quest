/* End-to-end checks for the finished, standalone file. Requires Playwright and a
   locally installed Chrome or Edge. No application server or network is used. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const gameUrl = pathToFileURL(path.resolve(__dirname, '..', 'EnglishQuest.html')).href;
const screenshots = process.env.QUEST_QA_SCREENSHOTS;
const releaseScreenshots = process.argv.includes('--screenshots')
  ? path.resolve(__dirname, '..', 'docs', 'screenshots') : null;
const selectedScenes = process.env.QUEST_QA_SCENES?.split(',');
const sizes = [[1920,1080],[1366,768],[768,1024],[390,844],[360,800]];
const selector = (action, id) => '[data-act="' + action + '"]' +
  (id === undefined ? '' : '[data-id="' + id + '"]');
const ctl = (page, action, id) => page.locator(selector(action, id)).first();
const click = (page, action, id) => ctl(page, action, id).click({ timeout: 12000 });
const visible = (page, action, id) => ctl(page, action, id).isVisible();
const wait = (page, action) => ctl(page, action).waitFor({ timeout: 5000 });

async function capture(page, name, width = 1366, height = 768) {
  if (!releaseScreenshots || (selectedScenes && !selectedScenes.includes(name))) return;
  const originalSize = page.viewportSize();
  await page.setViewportSize({width, height});
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({path:path.join(releaseScreenshots, name + '.png'), fullPage:true});
  await page.setViewportSize(originalSize);
}

async function checkLayout(page, name) {
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.waitForFunction(([w,h]) => window.innerWidth === w && window.innerHeight === h, [width,height]);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const layout = await page.evaluate(() => {
      const visibleControls = Array.from(document.querySelectorAll('button, input, select'))
        .map(el => ({el, rect:el.getBoundingClientRect()}))
        .filter(({el, rect}) => rect.width && rect.height && getComputedStyle(el).visibility === 'visible');
      const overlaps = [];
      for (const [index,a] of visibleControls.entries()) {
        for (const b of visibleControls.slice(index+1)) {
          const w = Math.min(a.rect.right,b.rect.right) - Math.max(a.rect.left,b.rect.left);
          const h = Math.min(a.rect.bottom,b.rect.bottom) - Math.max(a.rect.top,b.rect.top);
          const smaller = Math.min(a.rect.width*a.rect.height,b.rect.width*b.rect.height);
          if (w>0 && h>0 && w*h > smaller/3) overlaps.push([a.el.dataset.act,b.el.dataset.act]);
        }
      }
      return {
        scrollWidth: document.documentElement.scrollWidth,
        overlaps,
        clipped: visibleControls.filter(({rect}) => rect.left < -1 || rect.right > innerWidth + 1)
          .map(({el}) => el.textContent.trim())
      };
    });
    assert.ok(layout.scrollWidth <= width + 1, name + ' overflows horizontally at ' + width);
    assert.deepEqual(layout.clipped, [], name + ' clips controls at ' + width);
    assert.deepEqual(layout.overlaps, [], name + ' overlaps controls at ' + width);
    if (screenshots && (width === 1366 || width === 390)) {
      await page.screenshot({path: path.join(screenshots, name + '-' + width + '.png'), fullPage:true});
    }
  }
  await page.setViewportSize({width:1366,height:768});
  console.log('layout:', name, 'passed at five viewports');
}

async function enterStage(page, stage) {
  await click(page, 'stage', stage);
  if (stage === 1 && !(await profile(page)).completed.length) {
    const flip = ctl(page, 'lesson-flip');
    await flip.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.act),'lesson-flip');
    await wait(page, 'lesson-mark');
    const bookmark = ctl(page,'lesson-mark');
    const tag = await bookmark.getAttribute('data-id');
    await bookmark.click();
    assert.ok((await profile(page)).marked.includes(tag));
    await checkLayout(page,'notebook');
    await capture(page, 'notebook');
  }
  for (let n = 0; n < 25 && await visible(page, 'lesson-next'); n++) {
    await click(page, 'lesson-next');
  }
  await click(page, 'fight');
  await wait(page, 'ability');
}

async function newGame(page) {
  await ctl(page, 'new').focus();
  await page.keyboard.press('Enter');
  await ctl(page, 'intro-next').press('Space');
  await click(page, 'intro-skip');
  await click(page,'class-preview','arcanist');
  await click(page,'class-confirm');
  await wait(page, 'stage');
}

// Returning heroes can defer their first class choice and continue unchanged.
async function continueSaved(page) {
  await click(page,'continue');
  if(await visible(page,'class-later')) await click(page,'class-later');
}

async function rapidClick(page, button) {
  // A queued double click on a stale, detached button must be harmless.
  await button.evaluate(el => { el.click(); el.click(); });
}

async function createOfflinePage(browser, options = {}) {
  const context = await browser.newContext({ viewport:{width:1366, height:768}, reducedMotion:'reduce', hasTouch:true });
  const problems = [];
  const network = [];
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', err => problems.push(err.message));
  page.on('request', req => {
    if (/^https?:/.test(req.url())) network.push(req.url());
  });
  if (options.disableSpeech) {
    await page.addInitScript(() => {
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:undefined});
    });
  }
  await context.setOffline(true);
  await page.goto(options.url || gameUrl);
  await wait(page, 'new');
  return { context, page, problems, network };
}

const profile = page => page.evaluate(() => JSON.parse(localStorage.getItem(Engine.saveKey)));
// Voice exercises have a live, cyclic link back to their battle. Snapshot only
// the gameplay fields used for UI assertions.
const encounter = page => page.evaluate(() => JSON.parse(JSON.stringify(game.battle,
  (key,value)=>key==='voiceHandle' ? undefined : value)));
const attempts = data => Object.values(data.learning)
  .reduce((sum, item) => sum + item.correct + item.wrong, 0);

async function playTurn(page, ability, correct, seenTypes, checkQuestionLayout = false) {
  await click(page, 'ability', ability);
  const active = await encounter(page);
  const question = active.question;
  const type = question.type === 'sentence' && !question.instruction.includes('___') ?
    'translation' : question.type;
  seenTypes.add(type);
  if (checkQuestionLayout) await checkLayout(page, 'question-' + type);
  if (type === 'listening') assert.ok((await page.locator('body').innerText()).includes(question.phrase),
    'a listening question without an English voice needs a transcript');
  const before = await profile(page);
  if (type === 'order') {
    const words = question.answer.replace(/\.$/,'').split(' ');
    if (!correct) words.reverse();
    assert.ok(await ctl(page, 'submit-order').isDisabled());
    await page.setViewportSize({width:390,height:844});
    await capture(page, 'mobile-battle',390,844);
    for (const word of words) await ctl(page, 'word', active.choices.indexOf(word)).tap();
    await rapidClick(page, ctl(page, 'submit-order'));
    await page.setViewportSize({width:1366,height:768});
  } else {
    const index = active.choices.findIndex(choice => (choice === question.answer) === correct);
    await rapidClick(page, ctl(page, 'choice', index));
  }
  await wait(page, 'resolve');
  assert.ok((await page.locator('body').innerText()).includes(question.explanation));
  const answered = await encounter(page);
  assert.equal(answered.correct, correct);
  assert.equal(answered.enemyHp, active.enemyHp, 'damage should wait until feedback is acknowledged');
  const windup = await ctl(page,'resolve').evaluate(button => {
    button.click();
    button.click();
    return {
      standard:!matchMedia('(prefers-reduced-motion:reduce)').matches,
      fx:document.querySelector('.arena').dataset.fx,
      enemyMeter:Number(document.querySelector('.arena .right [role=meter]').getAttribute('aria-valuenow'))
    };
  });
  if (windup.standard) {
    assert.equal(windup.fx,correct ? ability : 'miss');
    assert.equal(windup.enemyMeter,active.enemyHp,'HP dropped before the attack reached the enemy');
    if (correct && ability === 'sword') {
      await page.locator('.float').waitFor({state:'visible',timeout:1200});
      const points = await page.locator('.float').allTextContents();
      const immediate = await encounter(page);
      assert.equal(points[0], '−' + (active.enemyHp-immediate.enemyHp));
      const motion = await page.locator('.arena').evaluate(el => el.getAnimations({subtree:true}).length);
      assert.ok(motion > 0, 'standard motion should animate the arena');
    }
    if (correct && ability === 'fire' && releaseScreenshots && active.stage === 2) {
      await page.locator('.arena[data-fx=fire] .float').waitFor({state:'visible',timeout:1600});
      await capture(page,'crystal-slime');
    }
  }
  await page.waitForFunction(() => ['ability','rewards','retry'].some(
    action => document.querySelector('[data-act="' + action + '"]:not(:disabled)')));
  const resolved = await encounter(page);
  assert.ok(resolved.hp >= 0 && resolved.enemyHp >= 0);
  const meters = await page.locator('.arena [role=meter]').evaluateAll(nodes => nodes.map(el => ({
    hp:Number(el.getAttribute('aria-valuenow')), max:Number(el.getAttribute('aria-valuemax')),
    percent:parseFloat(el.querySelector('span').style.width)
  })));
  assert.deepEqual(meters.map(m=>m.hp), [resolved.hp,resolved.enemyHp]);
  for(const meter of meters) assert.ok(Math.abs(meter.percent-100*meter.hp/meter.max) < 0.001);
  if (correct && ['fire','sword'].includes(ability)) assert.ok(resolved.enemyHp < active.enemyHp);
  else assert.equal(resolved.enemyHp, active.enemyHp);
  if (resolved.enemyHp === 0) assert.equal(resolved.hp, active.hp, 'defeated enemy retaliated');
  const after = await profile(page);
  assert.equal(attempts(after), attempts(before) + question.tags.length, 'double-click changed attempt counts');
  return {correct, question, resolved};
}

async function chapter(page, { stayAtEnding = false, onFreshMap } = {}) {
  await checkLayout(page, 'title');
  await capture(page, 'title');
  assert.ok(await ctl(page,'continue').isDisabled());
  await newGame(page);
  if(onFreshMap) await onFreshMap(page);
  await click(page,'map-pin',3);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.id),'3');
  assert.ok(await ctl(page,'stage',3).isDisabled());
  assert.ok((await page.locator('.atlas-caption').innerText()).includes('고요한 왕의 정원'));
  await click(page,'map-pin',1);
  await checkLayout(page, 'map');
  await capture(page, 'forest-map');
  const seenTypes = new Set();
  for (let stage = 1; stage <= 3; stage++) {
    if (stage < 3) assert.ok(await ctl(page, 'stage', stage+1).isDisabled());
    await enterStage(page, stage);
    await capture(page, ['forest-slime','crystal-slime','slime-king'][stage-1]);
    await page.keyboard.press('Escape');
    await wait(page, 'close');
    await click(page, 'close');
    for (let step = 0; step < 40 && await visible(page,'ability'); step++) {
      const battle = await encounter(page);
      let ability = 'sword';
      if (stage === 2 && step < 3) ability = ['guard','fire','heal'][step];
      if (stage === 3 && battle.turn % 3 !== 0 && battle.cooldowns.fire === 0) ability = 'fire';
      const correct = !(stage === 1 && step === 0);
      if (releaseScreenshots && stage === 2 && ability === 'fire') {
        await page.emulateMedia({reducedMotion:'no-preference'});
      }
      if (stage === 3 && battle.turn === 3) await capture(page,'slime-king');
      if (stage === 3 && battle.turn === 3) await checkLayout(page,'boss-warning');
      await playTurn(page, ability, correct, seenTypes, (stage===1 && step===0) || ability==='heal');
      await page.emulateMedia({reducedMotion:'reduce'});
    }
    await wait(page, 'rewards');
    assert.ok((await page.locator('.battle-intent').innerText()).includes('전투 종료 · 승리'));
    if(stage===3) {
      await checkLayout(page,'victory');
      await capture(page,'victory');
    }
    await rapidClick(page, ctl(page, 'rewards'));
    await wait(page, 'onwards');
    const awarded = await profile(page);
    assert.equal(awarded.rpg.availablePoints+awarded.rpg.spentPoints,awarded.level-1,'one skill point per earned level');
    if(stage===3) assert.ok(awarded.rpg.collection.includes('crystalBlade'));
    assert.deepEqual(awarded.completed, Array.from({length:stage},(_,i)=>i+1));
    assert.equal(awarded.gold, [15,40,115][stage-1]);
    assert.equal(awarded.xp, [35,85,5][stage-1]);
    if (stage === 1) {
      await page.reload();
      await click(page,'continue');
      assert.deepEqual(await profile(page),awarded);
    } else {
      await click(page,'onwards');
    }
    console.log('stage', stage, 'complete, saved level / XP / gold:', awarded.level, awarded.xp, awarded.gold);
  }
  assert.deepEqual([...seenTypes].sort(), ['vocab','sentence','translation','order','listening'].sort());
  await checkLayout(page, 'chapter-complete');
  const completed = await profile(page);
  assert.equal(completed.chapterComplete,true);
  assert.equal(completed.level,3);
  for (const id of ['firstVictory','firstSpell','combo3','forestClear']) {
    assert.ok(completed.achievements.includes(id), 'missing achievement ' + id);
  }
  assert.ok(Object.keys(completed.mistakes).length >= 1);
  if (!stayAtEnding) {
    await page.reload();
    await click(page, 'continue');
    assert.deepEqual(await profile(page),completed);
  }
  return completed;
}

async function checkLibraryAndRetry(page, completed) {
  await click(page, 'dashboard');
  await checkLayout(page,'dashboard');
  const correct = Object.values(completed.learning).reduce((sum,item) => sum + item.correct,0);
  const percent = Math.round(100*correct/attempts(completed));
  assert.ok((await page.locator('body').innerText()).includes(percent + '%'));
  await click(page, 'map');
  await click(page,'book');
  assert.ok((await page.locator('body').innerText()).includes('I drink water.'));
  await click(page, 'review');
  const mistake = Object.keys(completed.mistakes)[0];
  await click(page,'review-one',mistake);
  await answerReview(page,mistake,true);
  await click(page,'review-back');
  if (await visible(page,'map')) await click(page,'map');
  await enterStage(page,1);
  const seen = new Set();
  for (let n = 0; n < 10 && await visible(page,'ability'); n++) {
    await playTurn(page,'sword',true,seen);
  }
  await click(page,'rewards');
  const replay = await profile(page);
  assert.equal(replay.xp, completed.xp);
  assert.equal(replay.gold, completed.gold);
  assert.equal(replay.level, completed.level);
  assert.ok(attempts(replay) > attempts(completed));
  await click(page,'onwards');
  await enterStage(page,1);
  for (let n = 0; n < 35 && await visible(page,'ability'); n++) {
    await playTurn(page,'sword',false,seen);
  }
  await wait(page,'retry');
  assert.ok((await page.locator('.battle-intent').innerText()).includes('전투 종료 · 패배'));
  const lost = await encounter(page);
  assert.equal(lost.hp,0);
  const recordAtDefeat = await profile(page);
  assert.equal(recordAtDefeat.gold, completed.gold);
  await click(page,'review');
  assert.ok(await visible(page,'review-one'));
  await click(page,'review-back');
  await click(page,'retry');
  if (await visible(page,'fight')) await click(page,'fight');
  await wait(page,'ability');
  const retry = await encounter(page);
  assert.ok(retry.hp > 0);
  assert.equal(retry.enemyHp,55);
  assert.deepEqual((await profile(page)).mistakes,recordAtDefeat.mistakes);
  await page.keyboard.press('Escape');
  await wait(page,'close');
  const sound = page.locator('#pause input[type=checkbox]').first();
  const volume = page.locator('#pause input[data-setting=volume]');
  await sound.uncheck();
  await volume.focus();
  await volume.press('Home');
  await click(page,'close');
  await page.reload();
  const settings = (await profile(page)).settings;
  assert.equal(settings.sound,false);
  assert.equal(settings.volume,0);
  await click(page,'settings');
  await click(page,'reset');
  await click(page,'confirm');
  await wait(page,'new');
  assert.ok(await ctl(page,'continue').isDisabled());
  await page.reload();
  assert.ok(await ctl(page,'continue').isDisabled());
  assert.ok((await profile(page))?.gold === 0 || !(await profile(page)));
  console.log('book, mistake review, defeat, retry, settings, confirmed reset and reload passed');
}

async function answerReview(page,id,correct) {
  const previous = await profile(page);
  const task = await page.evaluate(() => game.task);
  assert.equal(task.question.id, id);
  const q = task.question;
  if(q.type === 'order') {
    const words = q.answer.replace(/\.$/,'').split(' ');
    if(!correct) words.reverse();
    for (const word of words) await click(page,'word',task.choices.indexOf(word));
    await rapidClick(page,ctl(page,'submit-order'));
  } else {
    const answer = task.choices.findIndex(choice => (choice === q.answer) === correct);
    assert.ok(answer >= 0);
    await rapidClick(page,ctl(page,'choice',answer));
  }
  await wait(page, 'review-list');
  assert.ok((await page.locator('body').innerText()).includes(q.explanation));
  const reviewed = await profile(page);
  assert.equal(attempts(reviewed), attempts(previous) + q.tags.length);
  assert.ok(reviewed.achievements.includes('firstReview'));
  assert.equal(reviewed.achievements.length,new Set(reviewed.achievements).size);
  if (correct) assert.ok(reviewed.schedule[id].dueAt > Date.now());
  for(const field of ['level','xp','gold','hp','completed']) {
    assert.deepEqual(reviewed[field], previous[field], 'review modified combat ' + field);
  }
  return reviewed;
}

async function checkMigration(browser) {
  const old = {
    version:1, started:true, level:5, xp:5, gold:315, hp:62, completed:[1,2,3],
    unlocked:3, chapterComplete:true, settings:{sound:false, voice:false, volume:.27},
    learning:{hello:{seen:true,correct:3,wrong:2,streak:1},iwant:{seen:true,correct:1,wrong:1,streak:0}},
    mistakes:{v0:2,o0:1}
  };
  const {page,context,problems,network} = await createOfflinePage(browser,{disableSpeech:true});
  try {
    await page.evaluate(save => localStorage.setItem('EnglishQuest.chapter1.v1',JSON.stringify(save)),old);
    await page.reload();
    await continueSaved(page);
    const migrated = await page.evaluate(() => game.profile);
    for(const key of ['level','xp','gold','hp','completed','unlocked','chapterComplete']) {
      assert.deepEqual(migrated[key],old[key], 'legacy field changed: '+key);
    }
    for(const [id,stats] of Object.entries(old.learning)) {
      for(const [key,value] of Object.entries(stats)) assert.equal(migrated.learning[id][key],value);
    }
    for (const [id,count] of Object.entries(old.mistakes)) assert.equal(migrated.mistakes[id],count);
    for (const [key,value] of Object.entries(old.settings)) assert.equal(migrated.settings[key],value);
    await click(page,'review');
    await click(page,'review-one','o0');
    await answerReview(page,'o0',false);
    await click(page,'review-list');
    await click(page,'review-one','o0');
    const reviewed = await answerReview(page,'o0',true);
    await page.reload();
    await click(page,'continue');
    const saved = await profile(page);
    assert.deepEqual(saved,reviewed);
    const legacyText = await page.evaluate(() => localStorage.getItem('EnglishQuest.chapter1.v1'));
    assert.equal(legacyText,JSON.stringify(old),'legacy save was overwritten');
    await enterStage(page,3);
    const scaled = await encounter(page);
    const maxMeter = await page.locator('.arena .right [role=meter]').getAttribute('aria-valuemax');
    assert.ok(scaled.enemyMaxHp > 150,'leveled-up replay must use the new boss maximum');
    assert.equal(Number(maxMeter),scaled.enemyMaxHp);
    await playTurn(page,'sword',true,new Set());
    assert.deepEqual(problems,[]);
    assert.deepEqual(network,[]);
    console.log('legacy completed save, failed/successful review, persistent settings and backup passed');
  } finally { await context.close(); }
}

async function main() {
  const channel = process.env.QUEST_QA_BROWSER || 'chrome';
  if (screenshots) await fs.mkdir(screenshots, {recursive:true});
  if (releaseScreenshots) await fs.mkdir(releaseScreenshots,{recursive:true});
  const browser = await chromium.launch({channel, headless:true});
  try {
    console.log(channel, browser.version(), 'offline file test');
    const {context, page, problems, network} = await createOfflinePage(browser,{disableSpeech:true});
    page.on('console', message => {
      if (message.type() === 'error') problems.push(message.text());
    });
    if (process.argv.includes('--smoke')) {
      await page.emulateMedia({reducedMotion:'no-preference'});
      await newGame(page);
      await enterStage(page,1);
      await playTurn(page,'sword',true,new Set());
      const checkpoint = await profile(page);
      await page.reload();
      await click(page,'continue');
      assert.deepEqual(await profile(page), checkpoint);
      console.log('start, lesson, battle, answer, reload, continue passed');
    } else {
      const completed = await chapter(page);
      await checkLibraryAndRetry(page, completed);
      await checkMigration(browser);
    }
    assert.deepEqual(network, [], 'standalone file requested remote resources');
    assert.deepEqual(problems, [], 'browser errors');
    await context.close();
    console.log('Browser journey passed.');
  } finally {
    await browser.close();
  }
}
module.exports = {
  chapter, enterStage, checkLayout, ctl, click, wait, visible, rapidClick, continueSaved,
  createOfflinePage, profile, encounter, attempts, answerReview, playTurn
};
if (require.main === module) main().catch(error => {console.error(error);process.exitCode=1;});
