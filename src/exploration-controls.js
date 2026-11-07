// One owner for the animation frame and scene listeners. Overlay/pause/focus loss clears input.
const ExploreView=(()=>{
 let frameId=0,abort=null,last=0,lastSave=0,lastStep=0,lastAmbience=0,dirty=false,actorDirection='',followerDirection='',lastNearby='';
 const keys=new Set(),pointers=new Map();
 const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 const keyDirection={w:'up',a:'left',s:'down',d:'right',ArrowUp:'up',ArrowLeft:'left',ArrowDown:'down',ArrowRight:'right'};
 function resetInput(){keys.clear();pointers.clear();app.querySelectorAll('[data-move]').forEach(b=>b.classList.remove('is-held'));}
 function checkpoint(){if(dirty){save();dirty=false;}}
 function unmount(){
  if(frameId)cancelAnimationFrame(frameId);frameId=0;
  abort?.abort();abort=null;resetInput();checkpoint();last=0;
 }
 function beforeChange(screen){
  unmount();
  if(game.screen==='EXPLORE'&&!['EXPLORE','PAUSED'].includes(screen)){
   Exploration.close(game.profile);ExploreUI.panel=null;ExploreUI.words=[];
  }
 }
 function announce(message){ExploreUI.notice=message;const node=app.querySelector('#eq-status');if(node)node.textContent=message;}
 function blocked(){return game.screen!=='EXPLORE'||!!ExploreUI.panel||document.hidden||pauseDialog.open;}
 function keydown(e){
  if(game.screen!=='EXPLORE')return;
  if(ExploreUI.panel){
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)closeExplorePanel();return;}
   if(e.key==='Tab'){
    const dialog=app.querySelector('.eq-dialog'),nodes=[...dialog.querySelectorAll('button:not(:disabled),[href],input,select,[tabindex="0"]')];
    const first=nodes[0],end=nodes.at(-1);
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();end?.focus();}
    else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first?.focus();}
   }
   return;
  }
  if(blocked())return;
  const direction=keyDirection[e.key]||keyDirection[e.key.toLowerCase()];
  if(direction){e.preventDefault();keys.add(direction);return;}
  if((e.key.toLowerCase()==='e'||e.code==='Space')&&!e.repeat){
   if(e.code==='Space'&&document.activeElement?.matches('button,[role="button"]'))return;
   e.preventDefault();exploreInteract();
  }
 }
 function update(timestamp){
  frameId=0;
  if(game.screen!=='EXPLORE')return;
  const dt=last?Math.min(.1,Math.max(0,(timestamp-last)/1000)):0;last=timestamp;
  const p=game.profile,s=p.exploration;
  let moved=false;
  if(!blocked()){
   const pressed=new Set([...keys,...pointers.values()]);let x=0,y=0;
   for(const d of pressed){x+=vectors[d][0];y+=vectors[d][1];}
   if(x||y){moved=Exploration.move(p,x,y,dt);dirty ||= moved;}
   if(moved&&timestamp-lastStep>380){AudioFX.play('footstep',p.settings);lastStep=timestamp;}
   if(timestamp-lastAmbience>6000){AudioFX.play(s.area==='forest'||s.area==='grove'?'forestAir':'caveAir',p.settings);lastAmbience=timestamp;}
   const follow=Exploration.follow(p,dt),follower=app.querySelector('#eq-follower');
   if(follower&&follow&&s.activeCompanion){
    const facing=s.activeCompanion+':'+follow.direction;
    if(facing!==followerDirection){follower.innerHTML=ExploreArt.companion(s.activeCompanion,follow.direction);followerDirection=facing;}
    follower.setAttribute('transform','translate('+follow.x.toFixed(2)+' '+follow.y.toFixed(2)+')');
    follower.classList.toggle('eq-walking',moved);follower.classList.toggle('eq-idle',!moved);
   }
  }
  const hero=app.querySelector('#eq-hero');
  if(hero){
   if(actorDirection!==s.direction){hero.innerHTML=eqHeroMarkup(p,s.direction);actorDirection=s.direction;}
   hero.setAttribute('transform','translate('+s.x.toFixed(2)+' '+s.y.toFixed(2)+')');
   hero.classList.toggle('eq-walking',moved);hero.classList.toggle('eq-idle',!moved);
  }
  const svg=app.querySelector('.eq-world');
  if(svg){
   const mobile=window.innerWidth<=820,w=mobile?600:960,h=mobile?400:Math.min(640,Math.max(320,960*svg.clientHeight/Math.max(1,svg.clientWidth)));
   svg.setAttribute('viewBox',[Math.max(0,Math.min(960-w,s.x-w/2)),Math.max(0,Math.min(640-h,s.y-h/2)),w,h].join(' '));
  }
  if(!blocked()){
   const near=Exploration.nearby(p),first=near[0],target=first?.id||'',sensed=Exploration.sense(p);
   app.querySelectorAll('.eq-object').forEach(n=>{n.classList.toggle('eq-near',n.dataset.worldObject===target);n.classList.toggle('eq-sense',sensed.includes(n.dataset.worldObject));});
   if(target!==lastNearby){
    lastNearby=target;const label=app.querySelector('#eq-nearby'),control=app.querySelector('[data-act="explore-interact"]');
    if(target&&/^(조금 더 가까이|인물이나 표지판)/.test(ExploreUI.notice))announce('');
    if(label)label.textContent=first?first.name+' · 가까이 있습니다.':'표지판이나 인물 가까이 걸어가세요.';
    if(control){control.disabled=!first;control.textContent=first?'E · '+first.name:'E · 상호작용';}
   }
  }
  if(timestamp-lastSave>2000){checkpoint();lastSave=timestamp;}
  frameId=requestAnimationFrame(update);
 }
 function mount(){
  unmount();if(game.screen!=='EXPLORE')return;
  abort=new AbortController();const signal=abort.signal;actorDirection='';followerDirection='';lastNearby='__initial';
  document.addEventListener('keydown',keydown,{signal,capture:true});
  document.addEventListener('keyup',e=>{const d=keyDirection[e.key]||keyDirection[e.key.toLowerCase()];if(d){keys.delete(d);e.preventDefault();}},{signal});
  window.addEventListener('blur',()=>{resetInput();checkpoint();},{signal});
  document.addEventListener('visibilitychange',()=>{resetInput();last=0;checkpoint();AudioFX.stop();},{signal});
  window.addEventListener('pagehide',()=>{resetInput();checkpoint();},{signal});
  app.addEventListener('pointerdown',e=>{
   const el=e.target.closest('[data-move]');if(!el||blocked())return;
   e.preventDefault();el.setPointerCapture(e.pointerId);pointers.set(e.pointerId,el.dataset.move);el.classList.add('is-held');
  },{signal});
  const release=e=>{const direction=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(direction)app.querySelector('[data-move="'+direction+'"]')?.classList.remove('is-held');};
  app.addEventListener('pointerup',release,{signal});app.addEventListener('pointercancel',release,{signal});app.addEventListener('lostpointercapture',release,{signal});
  app.addEventListener('click',e=>{
   const obj=e.target.closest('[data-world-object]');if(obj&&!blocked()){exploreInteract(obj.dataset.worldObject);return;}
   const pad=e.target.closest('[data-move]');if(pad&&e.detail===0&&!blocked()){
    const [x,y]=vectors[pad.dataset.move];const moved=Exploration.move(game.profile,x,y,.1);dirty ||= moved;checkpoint();
   }
  },{signal});
  app.addEventListener('keydown',e=>{
   const obj=e.target.closest('[data-world-object]');if(obj&&!blocked()&&(e.key==='Enter'||e.code==='Space')){e.preventDefault();if(!e.repeat)exploreInteract(obj.dataset.worldObject);}
  },{signal});
  frameId=requestAnimationFrame(update);
  if(ExploreUI.panel)app.querySelector('.eq-dialog')?.focus({preventScroll:true});
 }
 return {mount,unmount,beforeChange,announce,resetInput};
})();
function openExploration(){
 if(!Exploration.enter(game.profile))return;
 ExploreUI.panel=game.profile.exploration.tutorialSeen?null:'tutorial';ExploreUI.words=[];ExploreUI.hint='';ExploreUI.notice='';save();change('EXPLORE');
}
function closeExplorePanel(){
 if(ExploreUI.panel==='tutorial')Exploration.dismissTutorial(game.profile);
 const h=Exploration.current(game.profile);
 if(h&&h.phase!=='seek')Exploration.close(game.profile);
 ExploreUI.panel=null;ExploreUI.words=[];ExploreUI.hint='';AudioFX.stop();save();render();app.querySelector('#eq-stage')?.focus({preventScroll:true});
}
function presentExploreHandle(h){
 if(!h)return;
 if(h.phase==='transition'){
  ExploreUI.panel=null;ExploreUI.notice='새 지역 · '+ExplorationData.areas[game.profile.exploration.area].name;AudioFX.play('doorOpen',game.profile.settings);save();render();return;
 }
 ExploreUI.panel='interaction';ExploreUI.words=[];ExploreUI.hint='';ExploreUI.transcript=false;
 if(eqAudioActivity(h.activity)&&!AudioFX.canSpeak(game.profile.settings)){Exploration.assist(game.profile,h,'fallback');ExploreUI.transcript=true;}
 save();render();
 if(h.phase==='reward')AudioFX.play('treasure',game.profile.settings);
}
function exploreInteract(id){
 if(game.screen!=='EXPLORE'||ExploreUI.panel)return;
 id ||= Exploration.nearby(game.profile)[0]?.id;
 if(!id){ExploreView.announce('인물이나 표지판 가까이에 가서 상호작용하세요.');return;}
 const h=Exploration.interact(game.profile,id);
 if(h)presentExploreHandle(h);else ExploreView.announce('조금 더 가까이 다가가세요. 진행 중인 단서도 확인해 보세요.');
}
function submitExplore(value){
 const h=Exploration.current(game.profile);if(!h)return;
 const r=Exploration.answer(game.profile,h,value);if(!r)return;
 AudioFX.stop();save();render();AudioFX.play(r.correct?'puzzleSolve':'wrong',game.profile.settings);
}
function exploreAction(action,id){
 const p=game.profile,s=game.screen;
 if(action==='chapter'&&id==='3'&&s==='CHAPTERS'){openExploration();return true;}
 if(action==='explore-enter'&&['MAP','VILLAGE','VILLAGE_END','CHAPTERS'].includes(s)){openExploration();return true;}
 if(!action.startsWith('explore-'))return false;
 if(s!=='EXPLORE')return true;
 const act=action.slice(8),h=Exploration.current(p);
 if(act==='close'){closeExplorePanel();return true;}
 if(act==='tutorial-done'){Exploration.dismissTutorial(p);closeExplorePanel();return true;}
 if(act==='instructions'){ExploreUI.panel='tutorial';render();return true;}
 if(['journal','notes','bag','companions'].includes(act)){ExploreUI.panel=act;AudioFX.stop();render();return true;}
 if(act==='scroll'&&p.exploration.notes.includes('grove-scroll')){ExploreUI.panel='scroll';render();return true;}
 if(act==='chapters'){change('CHAPTERS');return true;}
 if(act==='equipment'){change('EQUIPMENT');openGear();return true;}
 if(act==='profile'){game.rpgMessage='';change('PROFILE');return true;}
 if(act==='interact'){exploreInteract();return true;}
 if(act==='companion'){if(Exploration.selectCompanion(p,id)){save();render();AudioFX.play('companionJoin',p.settings);}return true;}
 if(act==='talk'&&p.exploration.recruited.includes(id)){Exploration.selectCompanion(p,id);ExploreUI.panel='conversation';ExploreUI.notice='';save();render();return true;}
 if(act.startsWith('talk-')&&ExploreUI.panel==='conversation'){
  const c=Exploration.companionDialogue(p);
  ExploreUI.notice=act==='talk-help'?'Of course. Read the words slowly. — 물론이죠. 단어를 천천히 읽어 보세요.':act==='talk-where'?'The bridge is in the east of the forest. — 다리는 숲 동쪽에 있어요.':c.english+' — '+c.ko;
  render();return true;
 }
 if(act==='note-speak'){const a=ExplorationData.activities.find(t=>t.id===id);if(a)readAloud(a.english);return true;}
 if(act==='practice'){if(h?.phase==='seek')Exploration.close(p);const task=Exploration.practice(p,id);if(task)presentExploreHandle(task);return true;}
 if(act==='reread'&&h){ExploreUI.panel='interaction';render();return true;}
 if(!h)return true;
 if(act==='seek'&&h.phase==='seek'){ExploreUI.panel=null;AudioFX.stop();save();render();app.querySelector('#eq-stage')?.focus();return true;}
 if(act==='abandon'&&h.phase==='seek'){Exploration.close(p);closeExplorePanel();return true;}
 if(act==='choose'&&h.phase==='choice'){const result=Exploration.choose(p,h,id);if(result)presentExploreHandle(result);return true;}
 if(act==='retry'&&Exploration.retry(p,h)){ExploreUI.words=[];ExploreUI.hint='';save();render();return true;}
 if(act==='hint'){ExploreUI.hint=Exploration.hint(p,h)||'문장의 동작과 장소를 차례로 살펴보세요.';save();render();return true;}
 if(act==='transcript'){Exploration.assist(p,h,'transcript');ExploreUI.transcript=true;save();render();return true;}
 if(act==='play'&&h.activity){
  const fallback=()=>{if(game.screen==='EXPLORE'&&Exploration.current(p)===h){Exploration.assist(p,h,'fallback');ExploreUI.transcript=true;save();render();}};
  if(!readAloud(h.activity.english,fallback,id==='slow'?'slow':'normal'))fallback();return true;
 }
 if(h.phase!=='question')return true;
 if(act==='answer'&&Number.isInteger(+id)&&h.choices[+id]!==undefined)submitExplore(h.choices[+id]);
 if(act==='word'&&Number.isInteger(+id)&&h.words[+id]!==undefined&&!ExploreUI.words.includes(+id)){ExploreUI.words.push(+id);render();app.querySelector('[data-act="explore-word"]:not(:disabled),[data-act="explore-submit"]:not(:disabled)')?.focus({preventScroll:true});}
 if(act==='undo'){ExploreUI.words.pop();render();}
 if(act==='submit'&&ExploreUI.words.length===h.words.length)submitExplore(ExploreUI.words.map(i=>h.words[i]).join(' '));
 return true;
}
