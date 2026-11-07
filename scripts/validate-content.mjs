import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),position=args.indexOf('--expect');
const expected=position>=0?Number(args[position+1]):500;
const ctx=vm.createContext({});
const files=['src/curriculum-data.js',...fs.readdirSync(path.join(root,'src/curriculum-packs')).filter(f=>f.endsWith('.js')).sort().map(f=>'src/curriculum-packs/'+f)];
for(const f of files)vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f,timeout:3000});
const C=vm.runInContext('Curriculum',ctx),errors=[],warnings=[];
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[’]/g,"'").replace(/[^\p{L}\p{N}' ]/gu,' ').replace(/\s+/g,' ').trim();
const tokens=s=>norm(s).split(' ').filter(Boolean).sort().join('|');
const fail=(id,message)=>errors.push(`${id}: ${message}`);
for(const key of ['units','objectives','activities','expressions','diagnostics','missions']){
  const ids=new Set();for(const item of C[key]){if(ids.has(item.id))fail(item.id,'duplicate '+key+' ID');ids.add(item.id);}
}
if(C.activities.length!==expected)fail('count',`expected ${expected}, found ${C.activities.length}`);
const ix=C.index(),seen=new Map(),skills=Object.fromEntries(C.skills.map(s=>[s,0]));
for(const a of C.activities){
  for(const field of ['id','unitId','objectiveId','objective','skill','type','english','instruction','answer','explanation','hint'])if(typeof a[field]!=='string'||!a[field].trim())fail(a.id,'missing '+field);
  if(!ix.units[a.unitId])fail(a.id,'unknown unit');
  if(!ix.objectives[a.objectiveId]||ix.objectives[a.objectiveId]?.unitId!==a.unitId)fail(a.id,'unknown/mismatched objective');
  if(!C.skills.includes(a.skill))fail(a.id,'unknown skill');else skills[a.skill]++;
  if(![1,2,3].includes(a.tier))fail(a.id,'invalid tier');
  if(a.contentVersion!==1)fail(a.id,'invalid contentVersion');
  if(!Array.isArray(a.alternatives)||!Array.isArray(a.distractors)||!Array.isArray(a.choices))fail(a.id,'missing answer arrays');
  if(!a.expressionIds?.length||a.expressionIds.some(id=>!ix.expressions[id]))fail(a.id,'unknown/missing expression reference');
  if(!['choice','order'].includes(a.type))fail(a.id,'unsupported renderer type');
  const accepted=[a.answer,...a.alternatives].map(norm);
  if(a.type==='choice'){
    if(a.choices.length<3||a.choices.length>4)fail(a.id,'choice count must be3or4');
    if(new Set(a.choices.map(norm)).size!==a.choices.length)fail(a.id,'duplicate normalized choices');
    if(a.choices.filter(x=>accepted.includes(norm(x))).length!==1)fail(a.id,'requires exactly one accepted choice');
    if(a.distractors.some(x=>accepted.includes(norm(x))))fail(a.id,'correct answer included as distractor');
    if(tokens(a.distractors.join(' '))!==tokens(a.choices.filter(x=>!accepted.includes(norm(x))).join(' ')))fail(a.id,'distractors do not match choices');
  }else{
    if(tokens(a.choices.join(' '))!==tokens(a.answer))fail(a.id,'answer cannot be constructed from tokens');
    if(a.choices.length<3)fail(a.id,'sentence-order item too short');
    if(a.distractors.length)fail(a.id,'ordering uses no unused distractor tokens');
  }
  if(a.skill==='listening'&&(!a.audioText?.trim()||a.fallback?.type!=='text'||a.fallback.text!==a.audioText||a.audioText!==a.english))fail(a.id,'missing audio/text fallback');
  const fingerprint=[a.skill,a.type,norm(a.english),norm(a.instruction)].join('::');
  if(seen.has(fingerprint))fail(a.id,'duplicate normalized prompt with '+seen.get(fingerprint));else seen.set(fingerprint,a.id);
}
const unitCounts=C.units.map(u=>({id:u.id,count:C.activities.filter(a=>a.unitId===u.id).length,target:u.targetCount}));
if(expected>=500){
  for(const u of unitCounts)if(u.count!==u.target)fail(u.id,`unit target ${u.target}, found ${u.count}`);
  for(const u of C.units)for(const tier of [1,2,3])if(!C.activities.some(a=>a.unitId===u.id&&a.tier===tier))fail(u.id,'missing tier '+tier);
  for(const [skill,count] of Object.entries(skills))if(count<(skill==='reading'?15:35))fail(skill,'insufficient skill coverage');
  if(C.diagnostics.length!==2)fail('diagnostics','expected2alternate forms');
  if(C.missions.length!==4)fail('missions','expected4practical missions');
  for(const expression of C.expressions){
    const linked=C.activities.filter(a=>a.expressionIds.includes(expression.id));
    if(new Set(linked.map(a=>a.skill+':'+a.type)).size<2)fail(expression.id,'mastery unreachable: fewer than2skill/type formats');
    if(!expression.example?.trim()||/_{2,}/.test(expression.example))fail(expression.id,'missing complete usage example');
    if(expression.exampleSource!=='authored-context'&&!linked.some(a=>a.id===expression.exampleSource&&a.answer===expression.example))fail(expression.id,'invalid example source');
  }
}
for(const d of C.diagnostics){
  if(d.activityIds.length!==24||new Set(d.activityIds).size!==24)fail(d.id,'diagnostic must contain24unique activities');
  for(const id of d.activityIds)if(!ix.activities[id])fail(d.id,'unknown question '+id);
  for(const skill of ['vocabulary','grammar','reading','listening'])if(d.activityIds.filter(id=>ix.activities[id]?.skill===skill).length!==6)fail(d.id,'requires6 '+skill+' questions');
  const tiers=d.activityIds.map(id=>ix.activities[id]?.tier);if(tiers.some((v,i)=>i>0&&v<tiers[i-1]))fail(d.id,'diagnostic is not ordered easy to hard');
}
if(C.diagnostics.length===2&&C.diagnostics[0].activityIds.some(id=>C.diagnostics[1].activityIds.includes(id)))fail('diagnostics','alternate forms overlap');
for(const m of C.missions){
  const target=m.id==='cafe'?5:4;
  if(m.activityIds.length!==target)fail(m.id,'incorrect mission length');
  m.activityIds.forEach((id,step)=>{const a=ix.activities[id];if(!a||a.unitId!=='u12'||a.missionId!==m.id||a.step!==step||!a.context||!a.npc||!a.scene)fail(m.id,'invalid/unreachable step '+id);});
}
// Same stimulus in different formats is expected retrieval practice, reported separately.
const reuse=new Map();for(const a of C.activities){const k=norm(a.english);if(!reuse.has(k))reuse.set(k,[]);reuse.get(k).push(a);}
const repeatedStimuli=[...reuse.values()].filter(group=>group.length>1).map(group=>group.map(a=>a.id));
for(let i=0;i<C.activities.length;i++)for(let j=i+1;j<C.activities.length;j++){
  const a=C.activities[i],b=C.activities[j];if(a.skill!==b.skill||a.type!==b.type)continue;
  const at=new Set(norm(a.english+' '+a.instruction).split(' ')),bt=new Set(norm(b.english+' '+b.instruction).split(' '));
  const shared=[...at].filter(t=>bt.has(t)).length,score=shared/(at.size+bt.size-shared);
  if(score>=.8)warnings.push(`${a.id} / ${b.id} (${score.toFixed(2)})`);
}
const report={expected,actual:C.activities.length,units:unitCounts,skills,tiers:[1,2,3].map(t=>({tier:t,count:C.activities.filter(a=>a.tier===t).length})),expressions:C.expressions.length,diagnostics:C.diagnostics.length,missions:C.missions.length,errors,warnings,repeatedStimuli};
if(args.includes('--json'))console.log(JSON.stringify(report,null,2));
else{console.log(`CONTENT ${errors.length?'FAIL':'PASS'}: ${C.activities.length}/${expected} authored activities; ${C.expressions.length} expressions; ${errors.length} errors.`);console.log('Units: '+unitCounts.map(u=>`${u.id}=${u.count}`).join(', '));console.log('Skills: '+JSON.stringify(skills));console.log(`Near-duplicate review flags: ${warnings.length}; repeated stimuli across formats: ${repeatedStimuli.length}.`);for(const x of [...errors,...warnings.slice(0,30)])console.log(x);}
process.exitCode=errors.length?1:0;
