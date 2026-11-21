/* Adapter only; the standalone REBORN files and combat rules are unchanged. */
(()=>{
 const entry=parent.IntegratedEntry,app=RebornApp,g=app.game,evidence={};
 const row=key=>evidence[key]||=( {audioPlayed:0,attempted:0,text:0,translation:0,replay:0} );
 const op=()=>g.state.challenge||g.state.flowCue;
 for(const name of ['input','answer','assist','heard']){const original=g[name];g[name]=function(...args){const current=op(),key=current?.expressionId;const result=original(...args);if(key&&result!==false){const r=row(key);if(name==='heard')r.audioPlayed++;if(name==='answer'||name==='input'&&args[1]!==false&&({left:'left',dodge:'dodge',fire:'magic'})[key]===args[0])r.attempted++;if(name==='assist'){if(['english','subtitle','hint'].includes(args[0]))r.text++;if(['korean','translation'].includes(args[0]))r.translation++;}}return result;};}
 document.addEventListener('click',e=>{if(e.target.closest('[data-action="replay"]')){const key=op()?.expressionId;if(key)row(key).replay++;}},true);
 const restore=()=>{const fresh=RebornLearning.createProgress().entries;for(const key of Object.keys(g.state.learning))Object.assign(g.state.learning[key],fresh[key],entry.memory[key]||{});};
 const restart=g.restart;g.restart=()=>{for(const k of Object.keys(evidence))delete evidence[k];const result=restart();restore();return result;};
 Object.assign(app.settings,entry.settings);app.audio.configure(app.settings);app.voice.configure({slow:entry.slow});
 document.querySelector('#slow').checked=!!entry.slow;
 for(const el of document.querySelectorAll('[data-volume]'))el.value=Math.round(app.settings[el.dataset.volume]*100);
 document.querySelector('#muted').checked=app.settings.muted;document.querySelector('#reduced').checked=app.settings.reducedMotion;document.querySelector('#shake').value=app.settings.shakeIntensity;
 document.body.dataset.reducedMotion=String(app.settings.reducedMotion);
 g.selectEncounter('slime');restore();
 const quest=entry.encounterId==='crystal-disturbance';
 document.querySelector('.eyebrow').textContent=quest?'ENGLISH QUEST / 수정의 이상 현상':'ENGLISH QUEST / 로완의 숲 훈련';
 document.querySelector('.footer').innerHTML=quest?'<span>수정을 지키고 조사 장소로 돌아가세요.</span>':'<span>다시 깨어난 숲 · 완료 후 위의 버튼으로 로완에게 돌아가세요.</span>';
 app.sync();app.audio.unlock();
 let stopped=false;
 window.IntegratedCombat=Object.freeze({
  capture(){if(stopped)throw Error('Closed combat');return JSON.parse(JSON.stringify({runId:entry.runId,state:g.state,evidence,settings:app.settings,slow:document.querySelector('#slow').checked}));},
  stop(){if(stopped)return;stopped=true;app.release();app.voice.stop();app.audio.stop();IntegratedLifecycle.stop();},
  get lifecycle(){return IntegratedLifecycle.state;}
 });
})();
