function academyResetQuestion(){academySilence();AcademyUI.words=[];AcademyUI.hint=false;AcademyUI.translation=false;AcademyUI.transcript=false;AudioFX.stop();const h=Academy.current(game.profile);if(h?.phase==='question'&&h.activity.skill==='listening'&&!AudioFX.canSpeak(game.profile.settings)){AcademyUI.transcript=true;Academy.assist(game.profile,h,'fallback');}}
function academySilence(){SpeechInput.cancel();AcademyUI.draft='';AcademyUI.micState='ready';AcademyUI.micNotice='';const input=document.getElementById('academy-text-answer'),status=document.getElementById('academy-mic-status');if(input)input.value='';if(status)status.textContent='';}
function academyFocus(selector='.academy-question h3,.academy-session .screen-heading h2'){const el=app.querySelector(selector);if(el){el.tabIndex=-1;el.focus({preventScroll:true});el.scrollIntoView({block:'start'});}}
function academyStart(h){if(!h){AcademyUI.notice='지금 선택할 활동이 없어요. 다른 단원이나 난이도를 선택해 주세요.';render();return;}AcademyUI.notice='';academyResetQuestion();save();change('ACADEMY_RUN');}
function academyCancelImport(dropPreview=true){AcademyUI.importEpoch=(AcademyUI.importEpoch||0)+1;AcademyUI.importBusy=false;if(AcademyUI.notice==='백업 내용을 검사하고 있어요.')AcademyUI.notice='파일 읽기를 취소했어요.';if(dropPreview){if(AcademyUI.backup)Backup.cancel(AcademyUI.backup.handle);AcademyUI.backup=null;}}
function academyAction(action,id){
 if(!action.startsWith('academy-'))return false;
 const p=game.profile,h=Academy.current(p),a=action.slice(8);
 if(a==='enter'){if(!p.started)return true;AcademyUI.returnTo=game.screen;AcademyUI.notice='';change('ACADEMY');return true;}
 if(!game.screen.startsWith('ACADEMY'))return true;
 if(a==='home'){change(p.started?'ACADEMY':'TITLE');return true;}
 if(a==='exit'){if(p.started)rpgHub();else change('TITLE');return true;}
 if(a==='progress'){change('ACADEMY_PROGRESS');return true;}
 if(a==='backup'){AcademyUI.notice='';change('ACADEMY_BACKUP');return true;}
 if(a==='tier'){Academy.setTier(p,Number(id),'manual');save();render();return true;}
 if(a==='auto-tier'){Academy.setTier(p,Academy.recommendation(p).tier,'auto');save();render();return true;}
 if(a==='unit'){if(Curriculum.units.some(u=>u.id===id)){AcademyUI.unitId=id;change('ACADEMY_UNIT');}return true;}
 if(a==='lesson'||a==='skip'){academyStart(Academy.startUnit(p,id));return true;}
 if(a==='mode'){academyStart(Academy.startMode(p,id));return true;}
 if(a==='exact'){academyStart(Academy.startExact(p,id));return true;}
 if(a==='diagnostic'){academyStart(Academy.startDiagnostic(p));return true;}
 if(a==='mission'){academyStart(Academy.startMission(p,id));return true;}
 if(a==='review'){academyStart(Academy.startReview(p));return true;}
 if(a==='export'&&game.screen==='ACADEMY_BACKUP'){
  try{const out=Backup.export(p),url=URL.createObjectURL(new Blob([out.text],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=out.filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);AcademyUI.notice='백업 파일 다운로드를 요청했어요. 브라우저의 다운로드 목록을 확인해 주세요.';}catch{AcademyUI.notice='백업 파일을 만들지 못했어요. 기존 기록은 유지됩니다.';}render();return true;
 }
 if(a==='import-cancel'){academyCancelImport();AcademyUI.notice='가져오기를 취소했어요. 현재 기록은 그대로입니다.';render();return true;}
 if(a==='import-confirm'&&game.screen==='ACADEMY_BACKUP'&&AcademyUI.backup){const result=Backup.commit(AcademyUI.backup.handle,{confirm:true});academyCancelImport();if(result.ok){Academy.close(p);game.profile=result.profile;game.battle=null;game.task=null;game.voice=null;game.trial=null;AcademyUI.notice='기록을 가져왔고 저장된 내용까지 확인했어요.';}else AcademyUI.notice=result.error;render();return true;}
 if(game.screen!=='ACADEMY_RUN'||!h)return true;
 if(a==='next'){if(Academy.advance(p,h)){academyResetQuestion();save();render();academyFocus();}return true;}
 if(a==='retry'){if(Academy.retry(p,h)){academyResetQuestion();render();academyFocus();}return true;}
 if(h.phase!=='question')return true;
 if(a==='mic-stop'){SpeechInput.stop();AcademyUI.micState='ready';AcademyUI.micNotice='마이크를 중지했어요.';render();return true;}
 if(a==='mic-start'&&h.activity.skill==='conversation'){
  if(['requesting','listening','processing'].includes(AcademyUI.micState))return true;
  AudioFX.stop();
  const current=()=>game.screen==='ACADEMY_RUN'&&Academy.current(p)===h&&h.phase==='question';
  SpeechInput.start({onState(state){if(!current())return;AcademyUI.micState=state;AcademyUI.micNotice=({requesting:'마이크 권한을 기다리고 있어요.',listening:'말씀해 주세요.',processing:'음성을 확인하고 있어요.',denied:'마이크 권한이 없어요. 보기나 글로 답할 수 있어요.',unavailable:'음성을 사용할 수 없어요. 보기나 글로 답해 주세요.',timeout:'음성이 들리지 않았어요. 다시 시도할 수 있어요.'})[state]||'';const el=document.getElementById('academy-mic-status');if(el)el.textContent=AcademyUI.micNotice;},onResult(text){if(!current())return;const result=Academy.answer(p,h,text.slice(0,240),{mode:'speech'});if(result?.retrySpeech){AcademyUI.micNotice='저작된 답변과 일치하지 않았어요. 오답으로 기록하지 않았습니다. 다시 말하거나 보기를 사용해 주세요.';render();}else if(result){academySilence();save();render();academyFocus('.academy-feedback h3');AudioFX.play(result.correct?'correct':'wrong',p.settings);}}});return true;
 }
 if(a==='text-submit'&&h.activity.skill==='conversation'){
  const value=document.getElementById('academy-text-answer')?.value?.trim();if(!value)return true;
  const result=Academy.answer(p,h,value,{mode:'text'});if(result){academySilence();save();render();academyFocus('.academy-feedback h3');AudioFX.play(result.correct?'correct':'wrong',p.settings);}return true;
 }
 if(['hint','translation','transcript'].includes(a)){Academy.assist(p,h,a);AcademyUI[a]=true;render();app.querySelector('[data-act="'+action+'"]')?.focus();return true;}
 if(a==='listen'&&h.activity.skill==='listening'){
  const fallback=()=>{if(Academy.current(p)===h&&h.phase==='question'){Academy.assist(p,h,'fallback');AcademyUI.transcript=true;render();}};
  if(!AudioFX.speak(h.activity.audioText,p.settings,fallback,{rate:id,onStart:()=>{if(Academy.current(p)===h)Academy.hear(p,h);}}))fallback();return true;
 }
 if(a==='word'&&h.activity.type==='order'){const i=Number(id);if(Number.isInteger(i)&&i>=0&&i<h.choices.length&&!AcademyUI.words.includes(i)){AcademyUI.words.push(i);render();app.querySelector('[data-act="academy-word"]:not(:disabled),[data-act="academy-submit"]:not(:disabled)')?.focus();}return true;}
 if(a==='undo'){const index=AcademyUI.words.pop();render();app.querySelector('[data-act="academy-word"][data-id="'+index+'"]')?.focus();return true;}
 let value;
 if(a==='answer'&&h.activity.type!=='order'){const i=Number(id);if(Number.isInteger(i)&&i>=0&&i<h.choices.length)value=h.choices[i];}
 if(a==='submit'&&h.activity.type==='order'&&AcademyUI.words.length===h.choices.length)value=AcademyUI.words.map(i=>h.choices[i]).join(' ');
 if(value!==undefined){const result=Academy.answer(p,h,value);if(result){academySilence();AudioFX.stop();save();render();academyFocus('.academy-feedback h3');AudioFX.play(result.correct?'correct':'wrong',p.settings);}}
 return true;
}
document.addEventListener('input',event=>{if(event.target.id==='academy-text-answer')AcademyUI.draft=event.target.value.slice(0,240);});
document.addEventListener('change',async event=>{
 const input=event.target;if(input.id!=='academy-import-file'||game.screen!=='ACADEMY_BACKUP')return;
 const file=input.files?.[0];if(!file)return;
 academyCancelImport();const epoch=AcademyUI.importEpoch,profile=game.profile;
 if(file.size>2*1024*1024){AcademyUI.notice='파일이 너무 커요. 2 MiB 이하의 English Quest 백업을 선택해 주세요.';render();return;}
 AcademyUI.importBusy=true;AcademyUI.notice='백업 내용을 검사하고 있어요.';render();
 try{const text=await file.text();if(game.screen!=='ACADEMY_BACKUP'||epoch!==AcademyUI.importEpoch||profile!==game.profile)return;const preview=Backup.preview(text);if(preview.ok){AcademyUI.backup=preview;AcademyUI.notice='아래 내용을 확인한 뒤 가져오기를 선택해 주세요.';}else AcademyUI.notice=preview.error;}catch{if(epoch===AcademyUI.importEpoch)AcademyUI.notice='파일을 읽지 못했어요. 현재 기록은 그대로입니다.';}finally{if(epoch===AcademyUI.importEpoch){AcademyUI.importBusy=false;if(game.screen==='ACADEMY_BACKUP')render();}}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.screen.startsWith('ACADEMY')){academySilence();AudioFX.stop();}});
window.addEventListener('pagehide',()=>{if(game.screen.startsWith('ACADEMY')){academySilence();AudioFX.stop();}});
