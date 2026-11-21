/* One isolated, verified envelope. Never reads or writes the original v0.8 slots. */
const IntegratedStore=(()=>{
 const KEY='EnglishQuest.integrated.v1',PREFIX='EnglishQuest.integrated.aux.v1.';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const extension=()=>({version:1,quest:'new',recognition:false,records:{},memory:{},runs:[],processed:[],active:null,checkpoint:null,settings:null,lastOutcome:null});
 const fresh=()=>({format:'EnglishQuestIntegrated',version:1,revision:0,profile:null,extension:extension()});
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 function valid(x){
  if(!object(x)||x.format!=='EnglishQuestIntegrated'||x.version!==1||!Number.isSafeInteger(x.revision)||x.revision<0||x.profile!==null&&(!object(x.profile)||x.profile.version!==8))return false;
  const e=x.extension;if(!object(e)||e.version!==1||!['new','accepted','ready','complete'].includes(e.quest)||typeof e.recognition!=='boolean'||e.recognition!==(e.quest==='complete')||!Array.isArray(e.processed)||e.processed.length>200||e.processed.some(v=>typeof v!=='string')||!Array.isArray(e.runs)||e.runs.length>40||!object(e.records)||!object(e.memory))return false;
  const checkpoint=c=>object(c)&&c.screen==='MAP'&&c.chapter===1&&Number.isInteger(c.mapSelection)&&c.mapSelection>=0&&c.mapSelection<=3;
  if(e.active!==null&&(!object(e.active)||typeof e.active.runId!=='string'||e.active.encounterId!=='forest-awakens'||!checkpoint(e.active.checkpoint)))return false;
  if(e.checkpoint!==null&&!checkpoint(e.checkpoint))return false;
  for(const [key,r]of Object.entries(e.records)){if(!['left','dodge','fire'].includes(key)||!object(r)||!['encountered','audioPlayed','attempted','completed','independent','assisted','text','translation','replay','missed','reviews'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0)||r.independent+r.assisted!==r.completed)return false;}
  if(e.settings!==null&&(!object(e.settings)||!['master','voice','sfx','music','ui','ambient'].every(k=>Number.isFinite(e.settings[k])&&e.settings[k]>=0&&e.settings[k]<=1)||typeof e.settings.muted!=='boolean'||typeof e.settings.reducedMotion!=='boolean'||!['off','low','normal'].includes(e.settings.shakeIntensity)))return false;
  return true;
 }
 function create(storage){
  let data=fresh(),raw=null,locked=false,error='',batch=false;
  try{raw=storage.getItem(KEY);if(raw){const x=JSON.parse(raw);if(!valid(x))throw Error('Unsupported integrated save');data=x;}}
  catch{locked=true;error='통합 저장을 읽을 수 없어 원문을 보존했습니다. 원래 v0.8 저장은 바뀌지 않았습니다.';}
  function persist(next){
   if(locked)return false;if(!valid(next)){error='통합 저장 형식이 올바르지 않습니다.';return false;}
   try{if(storage.getItem(KEY)!==raw){error='다른 창에서 통합 기록이 바뀌었습니다. 새로고침 후 다시 시도하세요.';return false;}
    const text=JSON.stringify({...next,revision:data.revision+1});storage.setItem(KEY,text);if(storage.getItem(KEY)!==text)throw Error('verify');data=JSON.parse(text);raw=text;error='';return true;
   }catch{try{if(raw===null)storage.removeItem(KEY);else storage.setItem(KEY,raw);}catch{}error='저장을 확인하지 못해 진행을 확정하지 않았습니다. 기존 기록을 보존하고 다시 시도하세요.';return false;}
  }
  function update(fn){const next=clone(data);fn(next);if(batch){data=next;return true;}return persist(next);}
  function transaction(fn){const before=clone(data);batch=true;try{const result=fn();batch=false;if(!result?.ok){data=before;return result;}const next=data;data=before;if(!persist(next))return{ok:false,error};return result;}catch{batch=false;data=before;return{ok:false,error:error||'변경을 저장하지 못했습니다.'};}}
  const campaignStorage={
   getItem(key){if(key==='EnglishQuest.v8')return data.profile?JSON.stringify(data.profile):null;return storage.getItem(PREFIX+key);},
   setItem(key,value){if(key==='EnglishQuest.v8'){const p=JSON.parse(value);if(p?.version!==8||!update(d=>{d.profile=p;}))throw Error(error||'Invalid campaign');}else storage.setItem(PREFIX+key,String(value));},
   removeItem(key){if(key==='EnglishQuest.v8'){if(!update(d=>{d.profile=null;}))throw Error(error);}else storage.removeItem(PREFIX+key);}
  };
  return{get snapshot(){return clone(data);},get error(){return error;},get locked(){return locked;},update,transaction,campaignStorage,replace(value){if(!valid(value)||value.extension.active)return false;return persist(clone(value));},resetExtension(){return update(d=>{d.extension=extension();});}};
 }
 return {KEY,PREFIX,create,extension,valid};
})();
