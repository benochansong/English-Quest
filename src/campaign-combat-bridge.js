/* Authority boundary: private run handles plus engine snapshots, never result DOM text. */
const CampaignCombatBridge=(()=>{
 const definitions=Object.freeze({'forest-awakens':Object.freeze({enemy:'slime',hp:70,chapter:1,location:'forest-map',quest:'forest-awakens',objectives:['left','dodge','fire']}),'crystal-disturbance':Object.freeze({enemy:'slime',hp:70,chapter:null,location:'ruins',quest:'rowan',objectives:['left','dodge','fire']})});
 const mapping=Object.freeze({left:{voiceId:'VO_MOVE_LEFT',english:'Move left!',campaignId:null},dodge:{voiceId:'VO_WATCH_OUT',english:'Watch out!',campaignId:null},fire:{voiceId:'VO_NEED_FIRE',english:'I need fire.',campaignId:null}});
 const copy=x=>JSON.parse(JSON.stringify(x)),number=x=>Number.isFinite(x)&&x>=0&&x<=1000000;
 function learning(raw){const result={};for(const key of Object.keys(mapping)){const r=raw?.[key];if(!r||!['independent','streak','actual','misses'].every(k=>Number.isSafeInteger(r[k])&&number(r[k]))||r.streak>r.independent||r.actual>r.independent)continue;const introduced=r.introduced===true;result[key]={introduced,independent:r.independent,streak:r.streak,actual:r.actual,misses:r.misses,lastResult:['independent','assisted','review'].includes(r.lastResult)?r.lastResult:null,stage:!introduced?'guided':r.streak>=2&&(key==='left'||r.actual>0)?'familiar':'practice'};}return result;}
 function create(store,{id=()=>crypto.randomUUID()}={}){
  let active=null;
  function accept(){if(store.snapshot.extension.quest!=='new')return true;return store.update(d=>{d.extension.quest='accepted';});}
  function start({encounterId='forest-awakens',profile,returnLocation}){
   const def=definitions[encounterId],ext=store.snapshot.extension;
   const quest=encounterId==='crystal-disturbance',a=ext.adventure?.active;
   if(active||ext.active||!def||!profile?.started||![1,2,3].includes(profile.currentChapter)||!Number.isInteger(returnLocation?.mapSelection)||returnLocation.mapSelection<0||returnLocation.mapSelection>3)return null;
   if(quest?(a?.quest!=='rowan'||a.stage!=='combat'||ext.adventure.location!=='ruins'||returnLocation.screen!=='LANGUAGE_WORLD'||returnLocation.location!=='ruins'):(profile.currentChapter!==1||returnLocation.screen!=='MAP'||ext.quest==='new'))return null;
   const runId=id(),checkpoint={screen:quest?'LANGUAGE_WORLD':'MAP',chapter:profile.currentChapter,mapSelection:returnLocation.mapSelection,location:def.location};
   if(!store.update(d=>{d.extension.active={runId,encounterId,checkpoint};d.extension.checkpoint=checkpoint;}))return null;
   const handle=Object.freeze({});active={handle,runId,encounterId,def,checkpoint,questRunId:quest?a.runId:null};return{handle,entry:{runId,encounterId,campaignChapter:profile.currentChapter,campaignLocation:def.location,returnLocation:checkpoint,difficulty:'normal',playerDisplayName:'숲의 모험가',supportedLearningObjectives:[...def.objectives],optionalQuestId:def.quest,memory:learning(ext.memory)}};
  }
  function finish(handle,status,capture){
   if(!active||handle!==active.handle||!['victory','defeat','cancel'].includes(status))return{ok:false,error:'현재 전투와 일치하지 않는 결과입니다.'};
   const run=active,ext=store.snapshot.extension;if(run.questRunId&&ext.adventure?.active?.runId!==run.questRunId)return{ok:false,error:'이전 의뢰의 전투 결과는 적용하지 않았어요.'};if(ext.active?.runId!==run.runId||ext.processed.includes(run.runId))return{ok:false,error:'이미 처리되었거나 만료된 전투입니다.'};
   let packet;try{packet=capture();}catch{return{ok:false,error:'전투 상태를 확인하지 못했습니다. 다시 시도하거나 안전하게 나가세요.'};}
   const s=packet?.state;if(packet?.runId!==run.runId||!s||s.stage!==run.def.enemy||s.enemy?.kind!==run.def.enemy||s.enemy.maxHp!==run.def.hp)return{ok:false,error:'전투의 적 또는 실행 ID가 다릅니다.'};
   if(status==='victory'&&(s.mode!=='VICTORY'||s.enemy.hp!==0||s.enemy.ai!=='DEFEATED'||s.stats?.combat?.damageDealt!==run.def.hp))return{ok:false,error:'실제 승리 근거가 없습니다.'};
   if(status==='defeat'&&(s.mode!=='DEFEAT'||s.player?.hp!==0))return{ok:false,error:'실제 패배 근거가 없습니다.'};
   if(status==='victory'&&(!Array.isArray(s.stats?.flow?.outcomes)||!Array.isArray(s.encounterExpressions)))return{ok:false,error:'학습 결과 형식이 올바르지 않습니다.'};
   const seen=new Set(),events=[];
   if(status==='victory')for(const o of s.stats.flow.outcomes){if(!o||!Object.hasOwn(mapping,o.key)||typeof o.id!=='string'||seen.has(o.id))continue;seen.add(o.id);events.push({id:run.runId+':'+o.id,key:o.key,completed:o.success===true&&o.actual===true,heard:o.heard===true,independent:o.success===true&&o.actual===true&&o.independent===true&&o.heard===true&&!o.assisted,assisted:o.assisted===true});}
   const meaningful=events.filter(e=>e.completed).length;
   const summary={runId:run.runId,encounterId:run.encounterId,status,enemyDefeated:status==='victory',meaningful,independent:events.filter(e=>e.independent).length,assisted:events.filter(e=>e.completed&&!e.independent).length,audioPlayed:events.filter(e=>e.heard).length};
   const ok=store.update(d=>{const x=d.extension;x.active=null;x.checkpoint=run.checkpoint;x.lastOutcome=status;x.processed.push(run.runId);x.processed=x.processed.slice(-200);x.runs.push(summary);x.runs=x.runs.slice(-40);
    const settings=packet.settings;if(settings&&['master','voice','sfx','music','ui','ambient'].every(k=>Number.isFinite(settings[k])&&settings[k]>=0&&settings[k]<=1)&&typeof settings.muted==='boolean'&&typeof settings.reducedMotion==='boolean'&&['off','low','normal'].includes(settings.shakeIntensity)){x.settings=copy(settings);if(d.profile?.settings)Object.assign(d.profile.settings,{sound:!settings.muted,voice:settings.voice>0,volume:settings.master,speechVolume:settings.voice,speechRate:packet.slow?'slow':'normal'});}
    if(status!=='victory')return;
    if(run.encounterId==='crystal-disturbance')LivingAdventure.combat(x.adventure,summary);
    if(run.encounterId==='forest-awakens'&&meaningful&&x.quest==='accepted')x.quest='ready';x.memory=learning(s.learning);
    for(const key of run.def.objectives){const relevant=events.filter(o=>o.key===key),telemetry=packet.evidence?.[key]||{},encountered=s.encounterExpressions.includes(key);if(!encountered&&!relevant.length)continue;
     const row=x.records[key]||={encountered:0,audioPlayed:0,attempted:0,completed:0,independent:0,assisted:0,text:0,translation:0,replay:0,missed:0,reviews:0};
     row.encountered+=encountered?1:0;for(const name of ['audioPlayed','attempted','text','translation','replay'])row[name]+=Number.isSafeInteger(telemetry[name])&&number(telemetry[name])?Math.min(telemetry[name],200):0;
     row.completed+=relevant.filter(o=>o.completed).length;row.independent+=relevant.filter(o=>o.independent).length;row.assisted+=relevant.filter(o=>o.completed&&!o.independent).length;row.missed+=relevant.filter(o=>!o.completed).length;
    }
   });if(!ok)return{ok:false,error:store.error};active=null;return{ok:true,summary,returnLocation:copy(run.checkpoint),quest:store.snapshot.extension.quest};
  }
  function acknowledge(){if(store.snapshot.extension.quest!=='ready')return false;return store.update(d=>{d.extension.quest='complete';d.extension.recognition=true;});}
  function recover(){if(!store.snapshot.extension.active)return false;return store.update(d=>{d.extension.active=null;d.extension.lastOutcome='recovered';});}
  function abort(handle){if(!active||active.handle!==handle)return{ok:false,error:'만료된 전투입니다.'};const checkpoint=copy(active.checkpoint);if(!store.update(d=>{d.extension.active=null;d.extension.lastOutcome='cancel';}))return{ok:false,error:store.error};active=null;return{ok:true,returnLocation:checkpoint};}
  return{accept,start,finish,abort,acknowledge,recover,get active(){return active?{runId:active.runId,encounterId:active.encounterId}:null;}};
 }
 return{create,definitions,mapping,learning};
})();
