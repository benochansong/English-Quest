/* Runs inside the campaign closure, against an explicitly isolated storage facade. */
const World=(()=>{
 const bridge=CampaignCombatBridge.create(WorldStore),nativeDispatch=dispatch,nativeNew=startNew,nativeCommit=Backup.commit;
 let run=null,frame=null,importPreview=null,notice='',reviewKey=null,entering=false,leaving=false;
 const sound={master:.7,voice:.85,sfx:.65,music:0,ui:.5,ambient:.16,muted:false,shakeIntensity:'low',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
 const mixer=RebornAudio.create(sound),voice=RebornVoice.create(IntegratedAssets.manifest,mixer,{onStatus(s){const el=document.getElementById('world-voice-status');if(el)el.textContent=s.message;if(s.state==='ended'&&s.source==='asset'&&reviewKey){const key=reviewKey;reviewKey=null;WorldStore.update(d=>{if(d.extension.records[key])d.extension.records[key].reviews++;});}}});
 const stopVoice=()=>{reviewKey=null;voice.stop();mixer.stop();};
 const card=(title,body)=>'<section class="world-card"><h3>'+title+'</h3>'+body+'</section>';
 const actions=html=>'<div class="world-actions">'+html+'</div>';
 const message=()=>notice?'<p role="status" class="world-error">'+safe(notice)+'</p>':'';
 const questLabel=()=>({new:'로완의 새 부탁',accepted:'훈련 중',ready:'로완에게 보고하기',complete:'숲의 첫 훈련 완료'})[WorldStore.snapshot.extension.quest];
 function records(){const rows=WorldStore.snapshot.extension.records;return card('숲에서 듣고 행동한 표현','<p>기존 학습 기록에 연결된 실전 훈련 노트입니다. 정확히 일치하는 아카데미 표현 ID가 없어, 아카데미 숙련도와 복습 날짜는 바꾸지 않습니다.</p><div class="world-evidence">'+Object.entries(rows).map(([key,r])=>'<article><h4>'+safe(CampaignCombatBridge.mapping[key]?.english||key)+'</h4><p>만남 '+r.encountered+' · 음성 재생 '+r.audioPlayed+' · 시도 '+r.attempted+'<br>실제 행동 '+r.completed+' · 듣고 독립 성공 '+r.independent+' · 도움/텍스트 성공 '+r.assisted+'<br>원문 도움 '+r.text+' · 번역 '+r.translation+' · 다시 듣기 '+r.replay+' · 복습 완료 '+r.reviews+'</p>'+button('world-review','표현 다시 듣기',{id:key})+'</article>').join('')+'</div>'+(!Object.keys(rows).length?'<p>아직 확정된 전투 기록이 없습니다.</p>':'')+'<p id="world-voice-status" role="status"></p>');}
 const oldMap=screens.MAP;screens.MAP=()=>card('다시 깨어난 숲 · '+questLabel(),'<p>로완과 대화하고 실시간 전투 훈련에 참여하세요. 아래의 기존 전투와 모험도 계속할 수 있어요.</p>'+actions(button('world-rowan','로완과 대화',{cl:'primary'})+button('world-records','실전 훈련 기록')+button('world-backup','통합 저장 · 백업'))+message())+oldMap();
 const oldTitle=screens.TITLE;screens.TITLE=()=>oldTitle()+card('ONE WORLD · ONE ADVENTURE','<p>Phase 6 통합판 · 기존 저장은 자동으로 가져오지 않습니다. 새 모험을 시작하거나 백업 파일을 직접 가져오세요.</p>'+actions(button('world-backup','저장 가져오기 · 백업'))+message());
 for(const key of ['DASHBOARD','ACADEMY_PROGRESS']){const old=screens[key];screens[key]=()=>old()+records();}
 screens.WORLD_RECORDS=()=>heading('FIELD JOURNAL','실전 훈련 기록')+records()+actions(button('world-map','숲 지도로'));
 screens.WORLD_QUEST=()=>{const q=WorldStore.snapshot.extension.quest;return card('다시 깨어난 숲 · The Forest Awakens','<div class="world-rowan">'+Art.rowan()+'<div><p>숲의 안내자 · 로완</p><p class="world-quote">The forest is changing.</p><p>숲이 변하고 있단다. 이 문장은 자막으로 안내해요.</p><p>Listen carefully. 잘 듣고, Watch out! 위험에 반응해 보렴.</p>'+actions(button('world-line','▶ Listen carefully.',{id:'VO_LISTEN'})+button('world-line','▶ Watch out!',{id:'VO_WATCH_OUT'}))+'<p id="world-voice-status" role="status"></p></div></div><p>'+(q==='complete'?'네가 숲의 경고를 듣고 행동한 일을 기억하고 있단다. 언제든 다시 연습하렴.':q==='ready'?'수고했구나! 말이 실제 행동으로 이어졌어. 네 첫 훈련을 기억해 두마.':'Green Slime을 이기고 영어 행동을 한 번 완료하세요. L로 문장 마법을 만들어 실제로 맞히거나, 배운 경고에 맞춰 회피하세요. 원문과 한국어 도움을 써도 완료할 수 있습니다.')+'</p><p>이 훈련은 선택 사항입니다. 기존 HP·장비·경험치·골드는 바뀌지 않습니다.</p>'+message()+actions(q==='new'?button('world-accept','훈련 부탁 받기',{cl:'primary'}):q==='ready'?button('world-ack','로완에게 보고하기',{cl:'primary'}):button('world-enter','실시간 전투 훈련',{cl:'primary'}))+actions(button('world-map','기존 모험으로 돌아가기')+button('world-records','실전 훈련 기록')));};
 screens.WORLD_BACKUP=()=>card('통합 저장 · 백업','<p>원래 게임의 저장 키는 읽거나 덮어쓰지 않습니다. v0.8 백업을 가져오면 이 통합판의 캠페인만 교체되고 훈련 기록은 새로 시작합니다. 통합 백업은 훈련 기록까지 보존합니다.</p><label>JSON 백업 선택 <input id="world-import" type="file" accept=".json,application/json"></label>'+message()+(importPreview?'<p>미리보기: '+safe(importPreview.label)+' · 확인하면 현재 통합 기록을 교체합니다.</p>'+button('world-import-confirm','확인하고 가져오기'):'')+actions(button('world-export','통합 전체 백업 내보내기')+button('world-home','돌아가기')));
 screens.WORLD_COMBAT=()=>'';
 const host=document.createElement('section');host.id='world-combat';host.hidden=true;host.innerHTML='<div class="world-combat-bar"><p id="world-combat-status" role="status">로완의 훈련 · J 검 / K 회피 / L 문장 마법. 전투 종료 후 결과를 가지고 돌아가세요.</p><button id="world-return">결과 확인 · 로완에게 돌아가기</button><button id="world-cancel">훈련 그만두기</button></div>';document.body.append(host);
 function settings(){const p=game.profile.settings;return{...sound,...WorldStore.snapshot.extension.settings,master:p.volume,voice:p.voice?p.speechVolume:0,muted:!p.sound};}
 async function enter(){if(entering||run||game.screen!=='WORLD_QUEST')return;entering=true;const checkpoint={screen:'MAP',mapSelection:game.mapSelection};const started=bridge.start({profile:game.profile,returnLocation:checkpoint});if(!started){notice=WorldStore.error||'현재 위치에서는 훈련을 시작할 수 없어요.';render();entering=false;return;}
  run=started;stopVoice();AudioFX.stop();SpeechInput.cancel();academySilence();clearTimeout(game.timer);change('WORLD_COMBAT');app.inert=true;app.hidden=true;host.hidden=false;
  await IntegratedLifecycle.suspend();if(run!==started){entering=false;return;}window.IntegratedEntry={...run.entry,settings:settings(),slow:game.profile.settings.speechRate==='slow'};
  frame=document.createElement('iframe');frame.id='world-frame';frame.title='로완의 실시간 숲 훈련';frame.srcdoc=IntegratedAssets.frame;frame.addEventListener('load',()=>{if(frame?.contentWindow.IntegratedCombat){frame.contentWindow.focus();}else{document.getElementById('world-combat-status').textContent='전투를 열지 못했어요. 훈련 그만두기로 안전하게 돌아갈 수 있습니다.';}});host.append(frame);entering=false;
 }
 async function leave(cancel=false){if(!run||leaving)return;const api=frame?.contentWindow.IntegratedCombat;let packet;try{packet=api?.capture();}catch{}
  const mode=packet?.state.mode,status=cancel?'cancel':mode==='VICTORY'?'victory':mode==='DEFEAT'?'defeat':null;
  if(!status){document.getElementById('world-combat-status').textContent='아직 전투 중입니다. 끝까지 도전하거나 훈련 그만두기를 선택하세요.';return;}
  const result=api?bridge.finish(run.handle,status,()=>packet):bridge.abort(run.handle);
  if(!result.ok){document.getElementById('world-combat-status').textContent=result.error;return;}
  leaving=true;api?.stop();frame?.remove();frame=null;run=null;window.IntegratedEntry=null;host.hidden=true;app.hidden=false;app.inert=false;game.profile=Engine.load()||game.profile;
  await IntegratedLifecycle.resume();game.mapSelection=result.returnLocation.mapSelection;
  notice=status==='victory'?(result.summary.meaningful?'훈련 결과를 저장했어요. 로완에게 보고하세요.':'슬라임을 이겼어요. 훈련 완료에는 실제 영어 행동이 한 번 필요해요. 다시 도전해 보세요.'):status==='defeat'?'이번 훈련은 패배했어요. 캠페인 HP와 진행은 그대로예요. 다시 도전할 수 있습니다.':'훈련을 중단했어요. 이번 시도의 학습 결과는 확정하지 않았습니다.';
  change('MAP');app.querySelector('[data-act="world-rowan"]')?.focus();leaving=false;
 }
 host.querySelector('#world-return').addEventListener('click',()=>leave());host.querySelector('#world-cancel').addEventListener('click',()=>leave(true));
 document.addEventListener('keydown',e=>{if(run){e.preventDefault();e.stopImmediatePropagation();}},true);
 Backup.commit=(handle,options)=>WorldStore.transaction(()=>{const result=nativeCommit(handle,options);if(result.ok)WorldStore.resetExtension();return result;});
 startNew=()=>{if(WorldStore.locked){notice=WorldStore.error;render();return;}const before=game.profile;const result=WorldStore.transaction(()=>{WorldStore.resetExtension();nativeNew();return{ok:!!WorldStore.snapshot.profile};});if(!result?.ok){game.profile=before;notice=WorldStore.error;change('TITLE');}};
 const previousChange=change;change=screen=>{stopVoice();previousChange(screen);};
 function checkedBackup(value){if(!IntegratedStore.valid(value)||value.extension.active)throw Error('안전한 통합 백업이 아닙니다.');if(value.profile){const preview=Backup.preview(JSON.stringify(value.profile));if(!preview.ok)throw Error(preview.error);value.profile=preview.profile;Backup.cancel(preview.handle);}return value;}
 function play(id,key=null){stopVoice();Object.assign(sound,settings());reviewKey=key;voice.configure({slow:game.profile.settings.speechRate==='slow'});mixer.unlock();voice.play(id);}
 dispatch=(action,id)=>{
  if(!action.startsWith('world-'))return nativeDispatch(action,id);
  if(run)return;
  if(action==='world-rowan'&&game.profile.started&&game.profile.currentChapter===1){notice='';change('WORLD_QUEST');}
  if(action==='world-map')change('MAP');
  if(action==='world-home'){if(game.profile.started)rpgHub();else change('TITLE');}
  if(action==='world-accept'&&game.screen==='WORLD_QUEST'){if(!bridge.accept())notice=WorldStore.error;render();}
  if(action==='world-ack'&&game.screen==='WORLD_QUEST'){if(bridge.acknowledge())notice='로완이 첫 훈련을 기억합니다. 이 인정은 한 번만 기록됩니다.';else notice=WorldStore.error;render();}
  if(action==='world-enter')void enter();
  if(action==='world-records')change('WORLD_RECORDS');
  if(action==='world-review'&&WorldStore.snapshot.extension.records[id])play(CampaignCombatBridge.mapping[id].voiceId,id);
  if(action==='world-line'&&game.screen==='WORLD_QUEST'&&['VO_LISTEN','VO_WATCH_OUT'].includes(id))play(id);
  if(action==='world-backup'){importPreview=null;notice='';change('WORLD_BACKUP');}
  if(action==='world-export'){stopVoice();const blob=new Blob([JSON.stringify(WorldStore.snapshot,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='EnglishQuest-integrated-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  if(action==='world-import-confirm'&&game.screen==='WORLD_BACKUP'&&importPreview){let result;if(importPreview.integrated){result={ok:WorldStore.replace(importPreview.integrated)};}else result=Backup.commit(importPreview.handle,{confirm:true});importPreview=null;if(result.ok){game.profile=Engine.load()||Engine.fresh();notice='백업을 가져왔어요. 원래 게임의 저장은 그대로입니다.';}else notice=result.error||WorldStore.error;render();}
 };
 app.addEventListener('change',async e=>{if(e.target.id!=='world-import'||game.screen!=='WORLD_BACKUP')return;importPreview=null;const file=e.target.files[0];if(!file)return;if(file.size>Backup.maxBytes){notice='백업 파일이 너무 큽니다.';render();return;}try{const text=await file.text();if(game.screen!=='WORLD_BACKUP')return;const value=JSON.parse(text);if(value.format==='EnglishQuestIntegrated'){checkedBackup(value);importPreview={integrated:value,label:'통합 모험 · 훈련 '+value.extension.runs.length+'회'};}else{const preview=Backup.preview(text);if(!preview.ok)throw Error(preview.error);importPreview={handle:preview.handle,label:'기존 v0.8 모험'};}notice='';}catch(e){notice=e.message||'백업을 읽지 못했어요.';}render();});
 if(WorldStore.locked)notice=WorldStore.error;
 else if(bridge.recover()){const cp=WorldStore.snapshot.extension.checkpoint;game.mapSelection=cp?.mapSelection||0;notice='중단된 훈련에서 안전하게 돌아왔어요. 미완료 결과는 저장하지 않았습니다.';game.screen=game.profile.started?'MAP':'TITLE';}
 render();
 return Object.freeze({get state(){return{save:WorldStore.snapshot,error:WorldStore.error,active:bridge.active,lifecycle:IntegratedLifecycle.state,screen:game.screen};}});
})();
window.IntegratedWorld=World;
