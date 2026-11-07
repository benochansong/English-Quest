/* Standalone Chapter 3 QA: route planning is read-only; every move uses browser
   keyboard/touch input and every answer uses the displayed game controls. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {createOfflinePage,rapidClick,profile}=require('./browser.cjs');
// Blocking exploration panels keep the map mounted but inert. Select the active
// control if a dialog intentionally shares a navigation action with that map.
const ctl=(page,act,id)=>page.locator('[data-act="'+act+'"]'+(id===undefined?'':'[data-id="'+id+'"]')+':not([inert] *)').first();
const click=(page,act,id)=>ctl(page,act,id).click({timeout:12000});
const visible=(page,act,id)=>ctl(page,act,id).isVisible();
const wait=(page,act)=>ctl(page,act).waitFor({timeout:5000});
const shots=process.argv.includes('--screenshots')?path.resolve(__dirname,'../docs/screenshots'):null;
const live=page=>page.evaluate(()=>JSON.parse(JSON.stringify(game.profile.exploration)));
const handle=page=>page.evaluate(()=>{
  const h=Exploration.current(game.profile);
  return h?JSON.parse(JSON.stringify(h)):null;
});
const point=s=>({area:s.area,x:s.x,y:s.y});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const canonical=p=>{
  const copy=JSON.parse(JSON.stringify(p));
  for(const key of ['completed','observed','opened','discovered','recruited','cosmetics','notes','rewarded'])copy.exploration[key]?.sort();
  return copy;
};

async function capture(page,id,width=1366,height=768){
  if(!shots)return;
  const old=page.viewportSize();
  await page.setViewportSize({width,height});
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(150);
  await page.locator('.world').screenshot({path:path.join(shots,'exploration-'+id+'.png')});
  await page.setViewportSize(old);
}
async function layout(page,name){
  for(const [width,height] of [[1920,1080],[1366,768],[768,1024],[390,844],[360,800]]){
    await page.setViewportSize({width,height});
    await page.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,[width,height]);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const result=await page.evaluate(()=>{
      const els=[...document.querySelectorAll('button,input,select')]
        .filter(e=>!e.closest('[inert]')&&e.getBoundingClientRect().width&&getComputedStyle(e).visibility==='visible');
      const pairs=[];
      for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){
        const a=els[i].getBoundingClientRect(),b=els[j].getBoundingClientRect();
        const w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
        if(w>0&&h>0&&w*h>Math.min(a.width*a.height,b.width*b.height)/3)pairs.push([els[i].dataset.act,els[j].dataset.act]);
      }
      return {width:document.documentElement.scrollWidth,pairs,clipped:els.filter(e=>{
        const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;
      }).map(e=>e.textContent)};
    });
    assert.ok(result.width<=width+1,`${name} horizontal overflow at ${width}`);
    assert.deepEqual(result.clipped,[],`${name} clipped controls at ${width}`);
    assert.deepEqual(result.pairs,[],`${name} overlapping controls at ${width}`);
  }
  await page.setViewportSize({width:1366,height:768});
  console.log('layout:',name,'passed at five viewports');
}
async function hold(page,key,ms){
  await page.keyboard.down(key);
  try{await page.waitForTimeout(ms);}finally{await page.keyboard.up(key);}
}
async function touchHold(page,direction,ms){
  const node=page.locator('[data-move="'+direction+'"]');
  await node.scrollIntoViewIfNeeded();
  const box=await node.boundingBox();assert.ok(box);
  const session=await page.context().newCDPSession(page);
  try{
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,radiusX:5,radiusY:5,id:1}]});
    await page.waitForTimeout(ms);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }finally{await session.detach();}
}
async function pathTo(page,id){
  return page.evaluate(targetId=>{
    const p=game.profile,s=p.exploration,a=ExplorationData.areas[s.area];
    const target=a.objects.find(o=>o.id===targetId);if(!target)throw Error('Wrong map for '+targetId);
    const step=16,columns=59,rows=39;
    const pos=(x,y)=>({x:16+x*step,y:16+y*step});
    const free=(x,y)=>{
      if(x<0||y<0||x>=columns||y>=rows)return false;
      const pt=pos(x,y);
      // Real-time key release lands between grid coordinates. Keep a 6px margin
      // rather than planning a route exactly tangent to a solid rectangle.
      return [[0,0],[-6,-6],[-6,6],[6,-6],[6,6]].every(([dx,dy])=>Exploration.walkable(p,s.area,pt.x+dx,pt.y+dy));
    };
    const line=(from,to)=>{
      const n=Math.ceil(Math.hypot(from.x-to.x,from.y-to.y)/4);
      for(let t=0;t<=n;t++)if(!Exploration.walkable(p,s.area,from.x+(to.x-from.x)*t/(n||1),from.y+(to.y-from.y)*t/(n||1)))return false;
      return true;
    };
    if(Math.hypot(s.x-target.x,s.y-target.y)<48)return [];
    let start=null,best=Infinity;
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      const pt=pos(x,y),d=Math.hypot(s.x-pt.x,s.y-pt.y);
      if(d<best&&free(x,y)&&line(s,pt)){best=d;start={x,y};}
    }
    if(!start)throw Error('No safe route start');
    const key=(x,y)=>y*columns+x,queue=[start],parents=new Map([[key(start.x,start.y),null]]);
    let found=null;
    for(let cursor=0;cursor<queue.length;cursor++){
      const n=queue[cursor],pt=pos(n.x,n.y);
      if(Math.hypot(pt.x-target.x,pt.y-target.y)<44){found=n;break;}
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=n.x+dx,y=n.y+dy,k=key(x,y);
        if(!parents.has(k)&&free(x,y)&&line(pt,pos(x,y))){parents.set(k,n);queue.push({x,y});}
      }
    }
    if(!found)throw Error('No reachable route to '+targetId+' in '+s.area);
    const route=[];for(let n=found;n;n=parents.get(key(n.x,n.y)))route.push(pos(n.x,n.y));
    return route.reverse();
  },id);
}
async function approach(page,id){
  assert.equal(await page.evaluate(()=>ExploreUI.panel),null,'movement requested through a blocking panel');
  for(let attempt=0;attempt<10;attempt++){
    const route=await pathTo(page,id);if(!route.length)return;
    // Collapse straight segments. Read the actual position after every held key.
    const turns=route.filter((p,i)=>i===0||i===route.length-1||
      (p.x-route[i-1].x)!==(route[i+1].x-p.x)||(p.y-route[i-1].y)!==(route[i+1].y-p.y));
    for(const waypoint of turns){
      for(let n=0;n<12;n++){
        const p=await live(page),dx=waypoint.x-p.x,dy=waypoint.y-p.y;
        if(Math.abs(dx)<4&&Math.abs(dy)<4)break;
        const horizontal=Math.abs(dx)>=Math.abs(dy),delta=horizontal?dx:dy;
        await hold(page,horizontal?(delta>0?'ArrowRight':'ArrowLeft'):(delta>0?'ArrowDown':'ArrowUp'),Math.max(18,Math.min(650,Math.abs(delta)/180*1000)));
      }
    }
  }
  throw Error('Movement failed to reach '+id+' at '+JSON.stringify(await live(page)));
}
async function interact(page,id,{keyboard=false}={}){
  await approach(page,id);
  if(keyboard){
    await page.locator('#eq-stage').focus();await page.keyboard.press('e');
  }else if(process.argv.includes('--keyboard-objects')){
    await page.locator('[data-world-object="'+id+'"]').focus();await page.keyboard.press('Enter');
  }else await page.locator('[data-world-object="'+id+'"] > rect[pointer-events="all"]').click();
  await page.waitForTimeout(35);
}
async function close(page){if(await visible(page,'explore-close'))await click(page,'explore-close');}
async function reload(page,label,legacy){
  await click(page,'explore-journal');await close(page); // normal UI checkpoints the last move
  const before=await profile(page);
  await page.reload();await click(page,'continue');await page.waitForSelector('#eq-stage');
  assert.deepEqual(canonical(await profile(page)),canonical(before),'reload changed '+label);
  assert.equal(await page.evaluate(()=>localStorage.getItem('EnglishQuest.v5')),legacy,'rewrote old save');
  assert.ok(await page.evaluate(()=>{const p=game.profile,s=p.exploration;return Exploration.walkable(p,s.area,s.x,s.y);}),label+' restored inside geometry');
}
async function answer(page,correct=true){
  const h=await handle(page);assert.ok(h?.activity,'missing active activity');
  const a=h.activity;
  if(h.phase==='seek'){
    await click(page,'explore-seek');
    const target=correct?a.answer:a.choices.find(x=>x!==a.answer);
    await interact(page,target);
  }else if(a.kind==='order'){
    const words=[...h.words],indices=[];
    for(const word of a.words){const index=words.findIndex((x,i)=>x===word&&!indices.includes(i));assert.ok(index>=0);indices.push(index);}
    if(!correct)indices.reverse();
    for(const i of indices)await click(page,'explore-word',i);
    await rapidClick(page,ctl(page,'explore-submit'));
  }else{
    const expected=h.practice?a.reviewAnswer:a.answer;
    const index=h.choices.findIndex(x=>correct?x===expected:x!==expected);assert.ok(index>=0,'no answer for '+a.id);
    await rapidClick(page,ctl(page,'explore-answer',index));
  }
  const result=await handle(page);
  assert.equal(result.phase,'feedback',a.id+' missing feedback');
  assert.equal(result.feedback.correct,correct,a.id+' answer verdict');
  assert.ok((await page.locator('.eq-feedback').first().innerText()).includes(a.explanation));
}
async function solve(page,id,{wrong=false,hint=false,shot=null}={}){
  await interact(page,id);
  assert.equal((await handle(page))?.activity?.id,id,'wrong activity at '+id);
  if(id==='f-directions'&&wrong){
    const frozen=point(await live(page));await hold(page,'d',120);assert.deepEqual(point(await live(page)),frozen);
    await click(page,'explore-seek');await click(page,'explore-reread');await click(page,'explore-abandon');
    assert.equal(await handle(page),null,'abandoned clue still blocks input');
    assert.ok(!(await live(page)).completed.includes(id));
    await interact(page,id);
  }
  if(id==='f-secret'){
    await click(page,'explore-seek');await click(page,'explore-companions');
    await click(page,'explore-companion','bram');await close(page);
    assert.equal((await live(page)).activeCompanion,'bram');
    assert.equal((await handle(page)).activity.id,id,'companion switch dropped the physical clue');
    assert.equal((await handle(page)).phase,'seek');await click(page,'explore-reread');
  }
  if(hint){await click(page,'explore-hint');assert.ok(await page.locator('.eq-hint').innerText());}
  if(shot)await capture(page,shot);
  if(wrong){await answer(page,false);await click(page,'explore-retry');assert.equal((await handle(page)).activity.id,id);}
  await answer(page,true);await close(page);
  assert.ok((await live(page)).completed.includes(id),id+' did not persist completion');
  console.log('field puzzle solved:',id);
}
async function treasure(page,id,legacy){
  await interact(page,id);await close(page);
  const first=await profile(page);assert.ok(first.exploration.opened.includes(id));
  await reload(page,'treasure '+id,legacy);
  await interact(page,id);await close(page);
  const repeated=await profile(page);
  for(const key of ['gold','xp','level','rpg','village'])assert.deepEqual(repeated[key],first[key],id+' duplicate reward '+key);
}
async function transition(page,id,to){await interact(page,id);assert.equal((await live(page)).area,to);assert.equal(await page.evaluate(()=>ExploreUI.panel),null);}
async function loadV5(page){
  const raw=await fs.readFile(path.join(__dirname,'fixtures/v05-completed.json'),'utf8'),old=JSON.parse(raw);
  assert.equal(old.version,5);
  await page.evaluate(value=>localStorage.setItem('EnglishQuest.v5',value),raw);
  await page.reload();await click(page,'continue');await wait(page,'explore-enter');
  const current=await profile(page);assert.equal(current.version,7);
  for(const key of ['level','xp','hp','gold','unlocked','completed','chapterComplete','currentChapter','village','learning','mistakes','history','schedule','voice','settings','rpg'])assert.deepEqual(current[key],old[key],'migration changed '+key);
  for(const id of old.achievements)assert.ok(current.achievements.includes(id));
  assert.equal(await page.evaluate(()=>localStorage.getItem('EnglishQuest.v5')),raw);
  await click(page,'explore-enter');await wait(page,'explore-tutorial-done');
  return raw;
}
async function controls(page){
  const initial=point(await live(page));
  await hold(page,'d',160);
  assert.deepEqual(point(await live(page)),initial,'tutorial allowed movement');
  await layout(page,'exploration-tutorial');await click(page,'explore-tutorial-done');
  await page.locator('[data-world-object="f-ruins"]').focus();await page.keyboard.press('Enter');
  assert.equal(await handle(page),null,'out-of-range object activated');
  assert.deepEqual((await live(page)).completed,[]);
  const svg=await page.locator('.eq-world').elementHandle();
  await page.emulateMedia({reducedMotion:'no-preference'});
  const start=await live(page);
  await hold(page,'d',350);const moved=await live(page);
  assert.ok(moved.x>start.x+20&&moved.x<start.x+90,'WASD movement not delta based');
  assert.equal(moved.direction,'right');
  assert.ok(await svg.evaluate(el=>el.isConnected),'movement rebuilt the scene DOM');
  await page.waitForTimeout(80);assert.ok(await page.locator('#eq-hero').evaluate(el=>el.classList.contains('eq-idle')));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});
  const beforeTouch=await live(page);await touchHold(page,'down',300);
  assert.ok((await live(page)).y>beforeTouch.y+20,'held touchscreen direction did not move');
  const released=point(await live(page));await page.waitForTimeout(160);
  assert.ok(distance(await live(page),released)<2,'touch release left movement running');
  await capture(page,'mobile',390,844);await page.setViewportSize({width:1366,height:768});
  await click(page,'explore-journal');
  const menu=point(await live(page));await hold(page,'ArrowRight',160);assert.deepEqual(point(await live(page)),menu);
  assert.ok(!(await page.locator('.eq-dialog').innerText()).includes('undefined'));
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>ExploreUI.panel),null);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.querySelector('#pause').open);
  const paused=point(await live(page));await hold(page,'ArrowLeft',160);assert.deepEqual(point(await live(page)),paused);
  await click(page,'close');
  await layout(page,'exploration-forest');await capture(page,'forest');
  console.log('keyboard, touch hold/release, reduced motion, stable SVG, range and blocking overlays passed');
}
async function companions(page,legacy){
  await click(page,'explore-companions');await layout(page,'exploration-companions');
  await click(page,'explore-companion','bram');await close(page);
  assert.equal((await live(page)).activeCompanion,'bram');
  await hold(page,'ArrowUp',500); // Behind the old tree, test the northern world boundary.
  assert.ok((await live(page)).y>=14);
  await hold(page,'ArrowRight',180);await page.waitForTimeout(250);
  const follower=await page.locator('#eq-follower').getAttribute('transform');
  assert.match(follower,/translate\(/);
  await click(page,'explore-companions');await click(page,'explore-talk','bram');
  await click(page,'explore-talk-help');assert.ok((await page.locator('.eq-dialog').innerText()).includes('Of course.'));
  await click(page,'explore-companions');await click(page,'explore-companion','mira');
  await capture(page,'companions');await close(page);
  assert.equal((await live(page)).activeCompanion,'mira');
  await reload(page,'recruited companions',legacy);
}
async function choose(page,id,value,legacy){
  await interact(page,id);assert.equal((await handle(page)).phase,'choice');
  await rapidClick(page,ctl(page,'explore-choose',value));await close(page);
  const key=id==='f-crossroad'?'crossroad':'restoration';
  assert.equal((await live(page)).choices[key],value);
  await reload(page,'story choice '+key,legacy);
}
async function allNotes(page){
  const before=await profile(page);
  const ids=await page.evaluate(()=>ExplorationData.activities.map(a=>a.id));
  assert.ok(ids.length>=30);
  for(const [i,id] of ids.entries()){
    await click(page,'explore-notes');await click(page,'explore-practice',id);
    if(i===0){await answer(page,false);await click(page,'explore-retry');}
    await answer(page,true);await close(page);
  }
  const after=await profile(page);
  for(const id of ids)assert.ok(after.voice.records[id]?.correct>0,'activity unreachable in notes: '+id);
  for(const key of ['area','completed','opened','discovered','recruited','activeCompanion','choices','quests','completedChapter','cosmetics','notes','rewarded'])
    assert.deepEqual(after.exploration[key],before.exploration[key],'notebook bypassed world state: '+key);
  for(const field of ['gold','xp','level','rpg','village'])assert.deepEqual(after[field],before[field],'notebook farmed '+field);
  await reload(page,'all '+ids.length+' activities',await page.evaluate(()=>localStorage.getItem('EnglishQuest.v5')));
  console.log('all',ids.length,'authored activities accessible, recorded and durable without puzzle/reward bypass');
}
async function oldChapters(page){
  const location=point(await live(page));
  await click(page,'explore-bag');await click(page,'explore-equipment');await wait(page,'gear-slot');
  await click(page,'rpg-home');await page.waitForSelector('#eq-stage');
  assert.deepEqual(point(await live(page)),location,'equipment lost exploration checkpoint');
  await click(page,'explore-chapters');await click(page,'chapter',1);await wait(page,'stage');
  await click(page,'chapters');await click(page,'chapter',2);await wait(page,'destination');
  await click(page,'explore-enter');await page.waitForSelector('#eq-stage');
  assert.deepEqual(point(await live(page)),location,'chapter return lost exploration checkpoint');
}
async function journey(page,crossroad,restoration,completeExtras){
  const legacy=await loadV5(page);
  if(completeExtras)await controls(page);else await click(page,'explore-tutorial-done');
  await solve(page,'f-map',{wrong:completeExtras});await reload(page,'first puzzle',legacy);
  await solve(page,'f-rowan');
  await solve(page,'f-directions',{wrong:completeExtras,shot:completeExtras?'direction':null});
  await solve(page,'f-mira');await reload(page,'Mira recruitment',legacy);
  await solve(page,'f-bram');
  assert.deepEqual((await live(page)).recruited.slice().sort(),['bram','mira']);
  if(completeExtras)await companions(page,legacy);
  await choose(page,'f-crossroad',crossroad,legacy);
  await solve(page,crossroad==='moon'?'f-moon':'f-stone',{hint:completeExtras});
  if(completeExtras){
    await solve(page,'f-camp');await treasure(page,'f-cache',legacy);
    await solve(page,'f-secret');await transition(page,'f-grove','grove');
    await solve(page,'g-order');await solve(page,'g-listen');await solve(page,'g-read');
    await capture(page,'secret-grove');await transition(page,'g-forest','forest');
  }
  await approach(page,'f-bridge');
  if(completeExtras){
    await hold(page,'ArrowRight',700);
    assert.ok((await live(page)).x<=456.1,'crossed an unrepaired bridge collision');
    await hold(page,'ArrowLeft',200);
  }
  await solve(page,'f-bridge',{wrong:completeExtras,shot:completeExtras?'bridge-puzzle':null});
  await reload(page,'bridge quest',legacy);
  if(completeExtras){await solve(page,'f-river');await solve(page,'f-together');}
  await transition(page,'f-ruins','ruins');
  if(completeExtras){
    await layout(page,'exploration-ruins');await capture(page,'ruins');
    for(const id of ['r-book','r-open','r-help','r-listen','r-near'])await solve(page,id);
  }
  await solve(page,'r-gate');await solve(page,'r-inscription');await solve(page,'r-door');await solve(page,'r-fragment');
  if(completeExtras){
    await solve(page,'r-vault');await transition(page,'r-vault-door','vault');
    for(const id of ['v-order','v-read','v-response'])await solve(page,id);
    await treasure(page,'v-cache',legacy);await capture(page,'hidden-vault');
    await transition(page,'v-ruins','ruins');
  }
  await transition(page,'r-cavern','cavern');
  if(completeExtras){
    await layout(page,'exploration-cavern');await capture(page,'cavern');
    for(const id of ['c-quiet','c-response','c-read','c-tall'])await solve(page,id);
  }
  await solve(page,'c-listen',{wrong:completeExtras,shot:completeExtras?'listening-fallback':null});
  await solve(page,'c-door');await solve(page,'c-switch');
  if(completeExtras)await treasure(page,'c-cache',legacy);
  await choose(page,'c-choice',restoration,legacy);
  await solve(page,'c-final-'+restoration,{shot:completeExtras?'final-puzzle':null});
  const end=await live(page);assert.equal(end.completedChapter,true);assert.equal(end.choices.restoration,restoration);
  const quests=await page.evaluate(()=>Exploration.questStatus(game.profile));
  assert.equal(quests.length,5);assert.ok(quests.every(q=>q.status==='complete'));
  await reload(page,'chapter ending',legacy);
  await click(page,'explore-journal');await capture(page,'ending-'+restoration);
  if(completeExtras)await capture(page,'ending');
  await close(page);
  if(completeExtras){
    assert.ok(end.discovered.includes('grove')&&end.discovered.includes('vault'));
    const settled=await profile(page);
    // The unchosen discoveries remain physical activities after the main route.
    // Completing them must not rewrite the ending or award a second chapter prize.
    await solve(page,'c-final-bram');
    await transition(page,'c-ruins','ruins');await transition(page,'r-forest','forest');
    await solve(page,'f-stone');
    const all=await profile(page),ids=await page.evaluate(()=>ExplorationData.activities.map(a=>a.id));
    assert.equal(all.exploration.completed.length,ids.length);
    assert.ok(ids.every(id=>all.exploration.completed.includes(id)),'not every activity had a physical world solution');
    assert.equal(all.gold,settled.gold);assert.equal(all.xp,settled.xp);
    assert.deepEqual(all.exploration.choices,settled.exploration.choices);
    assert.deepEqual(all.exploration.cosmetics,settled.exploration.cosmetics);
    await allNotes(page);await oldChapters(page);
  }
  console.log('Complete Chapter 3 route:',crossroad,'→',restoration,'all five quests, persistent choices and old save preserved');
}
async function run(browser,route){
  const {context,page,problems,network}=await createOfflinePage(browser,{disableSpeech:true});
  try{
    page.on('console',msg=>{if(msg.type()==='error')problems.push(msg.text());});
    await journey(page,...route);
    assert.deepEqual(problems,[]);assert.deepEqual(network,[]);
  }catch(error){
    console.error('Exploration failure',await page.evaluate(()=>({screen:game.screen,panel:ExploreUI.panel,state:game.profile.exploration,task:Exploration.current(game.profile)})),problems);
    throw error;
  }finally{await context.close();}
}
async function entryChecks(browser){
  const fresh=await createOfflinePage(browser,{disableSpeech:true});
  try{
    await click(fresh.page,'new');await click(fresh.page,'intro-skip');await click(fresh.page,'class-later');
    await click(fresh.page,'chapters');
    assert.ok(await ctl(fresh.page,'chapter',3).isDisabled(),'new hero could skip to Chapter 3');
    assert.deepEqual(fresh.problems,[]);assert.deepEqual(fresh.network,[]);
  }finally{await fresh.context.close();}
  const damaged=await createOfflinePage(browser,{disableSpeech:true});
  try{
    const raw=await loadV5(damaged.page);await click(damaged.page,'explore-tutorial-done');
    // Deliberately corrupt only this isolated automated profile, never a user's slot.
    await damaged.page.evaluate(()=>{
      const saved=JSON.parse(localStorage.getItem(Engine.saveKey));
      saved.exploration.x=100;saved.exploration.y=100;
      localStorage.setItem(Engine.saveKey,JSON.stringify(saved));
    });
    await damaged.page.reload();await click(damaged.page,'continue');await damaged.page.waitForSelector('#eq-stage');
    assert.deepEqual(point(await live(damaged.page)),{area:'forest',x:100,y:450});
    assert.equal(await damaged.page.evaluate(()=>localStorage.getItem('EnglishQuest.v5')),raw);
    assert.deepEqual(damaged.problems,[]);assert.deepEqual(damaged.network,[]);
  }finally{await damaged.context.close();}
  console.log('new-player chapter lock and invalid-position safe restore passed');
}
async function finalPolish(browser){
  const audio=await createOfflinePage(browser,{disableSpeech:true});
  try{
    await audio.page.addInitScript(()=>{
      const Native=window.AudioContext;
      window.qaAudioContexts=[];
      window.AudioContext=class extends Native{
        constructor(){super();this.qaNodes=0;window.qaAudioContexts.push(this);}
        createOscillator(){this.qaNodes++;return super.createOscillator();}
        createBufferSource(){this.qaNodes++;return super.createBufferSource();}
      };
    });
    await audio.page.reload();await wait(audio.page,'new');await audio.page.mouse.click(10,10);
    for(const effect of ['footstep','forestAir','caveAir','doorOpen','treasure','puzzleSolve','companionJoin']){
      const counts=await audio.page.evaluate(cue=>{
        const before=qaAudioContexts.reduce((n,c)=>n+c.qaNodes,0);
        AudioFX.play(cue,{sound:true,volume:.3});
        return {before,after:qaAudioContexts.reduce((n,c)=>n+c.qaNodes,0)};
      },effect);
      assert.ok(counts.after>counts.before,effect+' created no native audio nodes');
      await audio.page.waitForTimeout(130);
    }
    await audio.page.waitForFunction(()=>qaAudioContexts.length===1&&qaAudioContexts[0].state==='running');
    const muted=await audio.page.evaluate(()=>{
      const before=qaAudioContexts[0].qaNodes;
      AudioFX.play('treasure',{sound:false,volume:1});AudioFX.play('puzzleSolve',{sound:true,volume:0});
      return qaAudioContexts[0].qaNodes===before;
    });
    assert.ok(muted);assert.deepEqual(audio.problems,[]);assert.deepEqual(audio.network,[]);
    console.log('all seven exploration cues scheduled real Web Audio nodes after gesture; mute and zero volume respected (no hearing claim)');
  }finally{await audio.context.close();}
  const {context,page,problems,network}=await createOfflinePage(browser,{disableSpeech:true});
  try{
    const legacy=await loadV5(page);await click(page,'explore-tutorial-done');
    await page.locator('[data-world-object="f-ruins"]').focus();await page.keyboard.press('Enter');
    assert.ok((await page.locator('#eq-status').innerText()).includes('조금 더 가까이'));
    await hold(page,'ArrowRight',420);
    await page.waitForFunction(()=>!document.querySelector('#eq-status').textContent.includes('조금 더 가까이'));
    for(const key of ['e','Space']){
      await page.locator('#eq-stage').focus();await page.keyboard.press(key);
      assert.equal((await handle(page)).objectId,'f-rowan',key+' failed to interact with the nearest NPC');await close(page);
    }
    await capture(page,'forest');await capture(page,'mobile',390,844);
    await click(page,'explore-bag');assert.equal(await visible(page,'explore-scroll'),false);await close(page);
    await click(page,'explore-notes');assert.equal(await visible(page,'explore-scroll'),false);
    await click(page,'explore-practice','f-map');await answer(page,true);await close(page);
    await click(page,'explore-notes');
    assert.ok((await page.locator('.eq-lesson-row').filter({has:page.locator('[data-act="explore-practice"][data-id="f-map"]')}).innerText()).includes('학습한 표현'));
    await close(page);
    // A narrowly seeded checkpoint for the last UI-only treasure panel. Full
    // physical earning of this scroll is covered by the two complete journeys.
    await page.evaluate(()=>{
      const saved=JSON.parse(localStorage.getItem(Engine.saveKey)),s=saved.exploration;
      s.completed=['f-map','f-rowan','f-directions','f-secret','g-order'];
      s.observed=[...s.completed];s.opened=['g-order'];s.notes=['grove-scroll'];s.discovered=['forest','grove'];
      s.x=100;s.y=450;s.area='forest';
      localStorage.setItem(Engine.saveKey,JSON.stringify(saved));
    });
    await page.reload();await click(page,'continue');await wait(page,'explore-bag');
    await click(page,'explore-bag');await click(page,'explore-scroll');
    const text=await page.locator('.eq-dialog').innerText();
    for(const word of ['find','found','small','large','quiet','loud'])assert.ok(text.includes(word));
    await layout(page,'exploration-vocabulary-scroll');await capture(page,'scroll');
    const before=await profile(page);
    await click(page,'explore-practice','g-order');await answer(page,true);await close(page);
    const after=await profile(page);
    assert.equal(after.voice.records['g-order'].correct,(before.voice.records['g-order']?.correct||0)+1);
    for(const key of ['gold','xp','level','rpg','village','exploration'])assert.deepEqual(after[key],before[key],'scroll practice changed '+key);
    await reload(page,'educational scroll',legacy);
    await click(page,'explore-notes');assert.ok(await visible(page,'explore-scroll'));await click(page,'explore-scroll');
    assert.deepEqual(problems,[]);assert.deepEqual(network,[]);
    console.log('final range warning, notebook wording, owned/unowned scroll, genuine practice counts and no duplicate reward passed');
  }finally{await context.close();}
}
async function main(){
  if(shots)await fs.mkdir(shots,{recursive:true});
  const channel=process.env.QUEST_QA_BROWSER||'chrome',browser=await chromium.launch({channel,headless:true});
  try{
    console.log(channel,browser.version(),'offline Chapter 3 exploration');
    if(process.argv.includes('--polish-only')){await finalPolish(browser);return;}
    await entryChecks(browser);
    await run(browser,['moon','mira',true]);
    await run(browser,['stone','bram',false]);
    console.log('Exploration browser journeys passed without external requests or uncaught errors.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
