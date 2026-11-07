// Local backup import is a preview followed by an explicitly confirmed, verified transaction.
const Backup = (() => {
  const maxBytes=2*1024*1024,handles=new WeakMap(),versions=[1,2,3,4,5,7,8];
  const stagingKey='EnglishQuest.import.pending.v1',recoveryKey='EnglishQuest.import.recovery.v1';
  const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
  function bytes(text){let size=0;for(const character of text){const n=character.codePointAt(0);size+=n<=0x7f?1:n<=0x7ff?2:n<=0xffff?3:4;}return size;}
  function structure(p){
    if(!object(p)||!versions.includes(p.version))return '지원하는 저장 버전이 아니에요.';
    if(typeof p.started!=='boolean'||!Number.isSafeInteger(p.level)||p.level<1||!Array.isArray(p.completed)
      ||p.completed.some(n=>!Number.isInteger(n)||n<1||n>3))return '게임 진행 정보의 형식이 올바르지 않아요.';
    for(const key of ['xp','gold','hp'])if(!Number.isSafeInteger(p[key])||p[key]<0)return '능력치와 금화는 올바른 정수여야 해요.';
    for(const key of ['learning','mistakes','settings','schedule','village','voice','rpg'])if(p[key]!==undefined&&!object(p[key]))return key+' 정보의 형식이 올바르지 않아요.';
    for(const key of ['exploration','academy'])if(p[key]!=null&&!object(p[key]))return key+' 정보의 형식이 올바르지 않아요.';
    for(const key of ['marked','history','achievements'])if(p[key]!==undefined&&!Array.isArray(p[key]))return key+' 목록의 형식이 올바르지 않아요.';
    const maps=[[p.academy,'records'],[p.academy,'expressions'],[p.academy,'units'],[p.academy,'missions'],
      [p.voice,'records'],[p.voice,'missions'],[p.village,'progress'],[p.village,'inventory'],[p.rpg,'equipped'],[p.rpg,'dungeons']];
    for(const [container,key] of maps)if(container?.[key]!==undefined&&!object(container[key]))return key+' 저장 구조를 확인해 주세요.';
    for(const key of ['recent','diagnostics','rewarded','badges'])if(p.academy?.[key]!==undefined&&!Array.isArray(p.academy[key]))return '아카데미 목록의 형식이 올바르지 않아요.';
    return '';
  }
  function describe(p){return {version:p.version,level:p.level,gold:p.gold,currentChapter:p.currentChapter,
    chapters:{forest:p.chapterComplete,village:!!p.village.progress[6].completed,exploration:!!p.exploration?.completedChapter},
    academyAttempts:p.academy?Object.values(p.academy.records).reduce((n,r)=>n+r.correct+r.wrong,0):0,
    academyCompleted:p.academy?Object.values(p.academy.records).filter(r=>r.correct>0).length:0,
    expressions:p.academy?Object.values(p.academy.expressions).filter(r=>r.seen).length:0};}
  function exportBackup(profile,now=Date.now()){
    if(structure(profile))return null;
    const safe=Engine.hydrate(profile),date=new Date(now);
    if(safe.version!==8||!Number.isFinite(date.getTime()))return null;
    const envelope={format:'EnglishQuestBackup',schemaVersion:1,saveVersion:8,exportedAt:date.toISOString(),profile:safe};
    const text=JSON.stringify(envelope,null,2);if(bytes(text)>maxBytes)return null;
    return {filename:'EnglishQuest-backup-'+date.toISOString().slice(0,10)+'.json',text,summary:describe(safe)};
  }
  function preview(text){
    if(typeof text!=='string'||!text.trim())return {ok:false,error:'내용이 있는 JSON 백업 파일을 선택해 주세요.'};
    if(bytes(text)>maxBytes)return {ok:false,error:'백업 파일은 2 MiB 이하여야 해요.'};
    let parsed;try{parsed=JSON.parse(text);}catch{return {ok:false,error:'JSON 파일을 읽을 수 없어요. 원본 백업 파일을 확인해 주세요.'};}
    let candidate=parsed;
    if(object(parsed)&&Object.hasOwn(parsed,'format')){
      if(parsed.format!=='EnglishQuestBackup'||parsed.schemaVersion!==1||!versions.includes(parsed.saveVersion)
        ||!object(parsed.profile)||parsed.profile.version!==parsed.saveVersion)return {ok:false,error:'알 수 없거나 맞지 않는 백업 형식이에요.'};
      candidate=parsed.profile;
    }
    const invalid=structure(candidate);if(invalid)return {ok:false,error:invalid};
    try{
      const profile=Engine.hydrate(candidate);if(profile.version!==8)return {ok:false,error:'현재 게임 버전으로 변환할 수 없어요.'};
      const baseline=localStorage.getItem(Engine.saveKey),serialized=JSON.stringify(profile),handle=Object.freeze({});
      handles.set(handle,{serialized,baseline});
      return {ok:true,handle,profile:JSON.parse(serialized),summary:describe(profile),
        warnings:candidate.version!==8?['이전 버전의 기록을 버전 8로 변환합니다. 원래 저장 슬롯은 유지됩니다.']:[]};
    }catch{return {ok:false,error:'백업을 검증할 수 없어요. 현재 기록은 바뀌지 않았어요.'};}
  }
  function clean(){for(const key of [stagingKey,recoveryKey])try{localStorage.removeItem(key);}catch{/* Cleanup does not determine commit success. */}}
  function cancel(handle){return !!handle&&handles.delete(handle);}
  function commit(handle,options={}){
    const pending=handle&&handles.get(handle);if(!pending)return {ok:false,error:'유효한 가져오기 미리보기를 먼저 열어 주세요.'};
    if(options.confirm!==true)return {ok:false,error:'현재 기록을 바꾸려면 명시적으로 확인해 주세요.'};
    handles.delete(handle);
    let before;
    try{
      before=localStorage.getItem(Engine.saveKey);
      if(before!==pending.baseline)return {ok:false,error:'미리보기 후 현재 기록이 바뀌었어요. 파일을 다시 검토해 주세요.'};
      if(before){try{if(JSON.parse(before)?.version>8)return {ok:false,error:'더 새로운 버전의 기록은 덮어쓸 수 없어요.'};}catch{/* A validated import can replace a malformed current slot. */}}
      // Stage and verify before touching the active checkpoint. Keep an exact rollback copy until verification succeeds.
      localStorage.setItem(stagingKey,pending.serialized);
      if(localStorage.getItem(stagingKey)!==pending.serialized)throw Error('stage');
      localStorage.setItem(recoveryKey,JSON.stringify({key:Engine.saveKey,previous:before}));
      if(localStorage.getItem(recoveryKey)!==JSON.stringify({key:Engine.saveKey,previous:before}))throw Error('recovery');
      const profile=JSON.parse(pending.serialized);
      if(!Engine.save(profile)||localStorage.getItem(Engine.saveKey)!==pending.serialized)throw Error('verify');
      clean();return {ok:true,profile};
    }catch{
      let restored=false;
      try{
        if(localStorage.getItem(Engine.saveKey)!==before){
          if(before===null)localStorage.removeItem(Engine.saveKey);else if(before!==undefined)localStorage.setItem(Engine.saveKey,before);
        }
        restored=before!==undefined&&localStorage.getItem(Engine.saveKey)===before;
      }catch{/* Keep the recovery copy if storage itself cannot restore the prior slot. */}
      if(restored)clean();
      return {ok:false,error:restored?'가져온 기록의 저장을 확인할 수 없어 이전 기록을 유지했어요.':
        '저장 공간을 사용할 수 없어 가져오기를 마치지 못했어요. 남아 있는 이전 기록과 복구 사본을 보존했어요.'};
    }
  }
  return {maxBytes,export:exportBackup,preview,commit,cancel};
})();
