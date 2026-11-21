/* Original procedural score and layered cues. One context, bounded scheduled voices. */
const RebornAudio=(()=>{
  const presets={
    sword:[420,160,.12,'sawtooth'],sword1:[480,180,.13,'triangle'],sword2:[340,760,.17,'triangle'],sword3:[210,80,.24,'sawtooth'],
    impact:[120,45,.16,'triangle'],impact1:[150,60,.16,'triangle'],impact2:[125,42,.22,'triangle'],impact3:[92,30,.34,'sawtooth'],
    bounce:[170,270,.11,'sine'],slimeAttack:[180,70,.25,'triangle'],enemyRecoil:[220,95,.14,'sine'],playerHit:[160,65,.24,'sawtooth'],
    dodge:[450,900,.12,'sine'],perfectDodge:[784,1568,.35,'sine'],magicCharge:[260,920,.5,'sine'],fireLaunch:[720,240,.3,'triangle'],magicExplosion:[90,35,.5,'sawtooth'],
    coreHit:[880,440,.45,'sine'],bossEntrance:[100,65,.8,'triangle'],bossPhase:[146,73,.7,'triangle'],bossDeath:[330,880,.8,'sine'],victory:[523,1046,.8,'sine'],
    select:[660,880,.08,'sine'],correct:[659,988,.28,'sine'],incorrect:[294,220,.18,'sine']
  };
  const aliases={swing:'sword',hit:'impact',attack:'slimeAttack',hurt:'playerHit',magic:'magicExplosion',charge:'magicCharge',boss:'bossEntrance',win:'victory',sword_swing:'sword',sword_impact:'impact',slime_bounce:'bounce',slime_warning:'bounce',slime_jump:'slimeAttack',slime_rush:'slimeAttack',slime_land:'impact',slime_defeat:'magicExplosion',player_hit:'playerHit',magic_charge:'magicCharge',magic_explosion:'magicExplosion',crystal_charge:'magicCharge',boss_entrance:'bossEntrance',boss_defeat:'bossDeath',boss_phase:'bossPhase',perfect_dodge:'perfectDodge',core_hit:'coreHit',fire_launch:'fireLaunch',defeat:'playerHit'};
  const scores={
    exploration:{bpm:68,notes:[293.66,440,392,329.63,293.66,220,261.63,329.63],bass:146.83},
    combat:{bpm:96,notes:[293.66,349.23,440,392,293.66,440,523.25,392],bass:146.83},
    boss:{bpm:108,notes:[220,261.63,329.63,293.66,220,392,329.63,261.63],bass:110}
  };
  function create(initial={}){
    const settings={master:.7,voice:.85,sfx:.65,music:0,ui:.5,ambient:.16,muted:false,...initial};
    const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
    let context,master,sfxBus,musicBus,uiBus,noiseSample,unlocked=false,ducked=false,musicScene='exploration',phase=1,nextBeat=0,beat=0,ambientBus,warningBus,nextAmbient=0;
    const active=new Set(),musicLayers={};
    const LIMIT=96;
    function mix(){
      if(!context)return;const t=context.currentTime;
      master.gain.setTargetAtTime(settings.muted?0:settings.master,t,.025);
      sfxBus.gain.setTargetAtTime(settings.sfx*(ducked?.35:1),t,.025);
      uiBus.gain.setTargetAtTime(settings.ui*(ducked?.45:1),t,.025);
      musicBus.gain.setTargetAtTime(settings.music*(ducked?.16:1),t,.08);
      warningBus.gain.setTargetAtTime(settings.sfx*(ducked?.75:1),t,.025);
      ambientBus.gain.setTargetAtTime(settings.ambient*(ducked?.12:1),t,.1);
      for(const [name,bus]of Object.entries(musicLayers))bus.gain.setTargetAtTime(name===musicScene?1:0,t,.25);
    }
    function unlock(){
      unlocked=true;
      try{
        if(!context){
          const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return false;context=new C();
          master=context.createGain();sfxBus=context.createGain();musicBus=context.createGain();uiBus=context.createGain();
          master.connect(context.destination);sfxBus.connect(master);musicBus.connect(master);uiBus.connect(master);
          for(const name of Object.keys(scores)){musicLayers[name]=context.createGain();musicLayers[name].gain.value=name===musicScene?1:0;musicLayers[name].connect(musicBus);}
          warningBus=context.createGain();warningBus.connect(master);ambientBus=context.createGain();ambientBus.connect(master);
          if(context.createBuffer){noiseSample=context.createBuffer(1,Math.floor(context.sampleRate*.4),context.sampleRate);const data=noiseSample.getChannelData(0);let seed=10321;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}}
        }
        if(context.state==='suspended')context.resume().catch(()=>{});mix();return true;
      }catch{return false;}
    }
    function envelope(source,node,bus,at,length,level){
      if(active.size>=LIMIT){source.disconnect();node.disconnect();return false;}
      const g=context.createGain();g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,level),at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+length);
      node.connect(g);g.connect(bus);active.add(source);
      source.onended=()=>{active.delete(source);source.disconnect();if(node!==source)node.disconnect();g.disconnect();};source.start(at);source.stop(at+length+.025);return true;
    }
    function tone(freq,to,length,level,bus,type='sine',at=context.currentTime){
      if(active.size>=LIMIT)return false;
      const o=context.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(to,at+length);return envelope(o,o,bus,at,length,level);
    }
    function noise(freq,length,level,bus){
      if(!noiseSample||!context.createBufferSource||!context.createBiquadFilter)return;
      const source=context.createBufferSource(),filter=context.createBiquadFilter();source.buffer=noiseSample;filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.7;source.connect(filter);envelope(source,filter,bus,context.currentTime,length,level);
    }
    function cue(id,bus){
      const key=aliases[id]||id,p=presets[key];if(!p||!unlocked||!context||settings.muted||active.size>=LIMIT)return false;
      const [f,to,duration,type]=p;const result=tone(f,to,duration,.105,bus,type);
      if(/^sword/.test(key)){noise(key==='sword3'?620:1400,duration,.055,bus);tone(f*1.8,to*1.6,duration*.65,.028,bus,'sine');}
      else if(/^impact|Explosion|playerHit|slimeAttack/.test(key)){tone(f*.55,to*.65,duration*.8,.09,bus,'sine');noise(key==='impact3'?700:1100,duration*.65,.06,bus);}
      else if(['perfectDodge','coreHit','victory','bossDeath','correct'].includes(key)){tone(f*1.5,to*1.5,duration*.7,.055,bus,'sine',context.currentTime+.035);tone(f*2,to*2,duration*.45,.027,bus,'sine',context.currentTime+.07);}
      else if(['bossEntrance','bossPhase','magicCharge'].includes(key)){tone(f*1.5,to*1.5,duration,.045,bus,'triangle');}
      return result;
    }
    function setScene(name,nextPhase=1){
      if(!Object.hasOwn(scores,name)&&name!=='silent')return false;
      const next=nextPhase===2?2:1;if(name===musicScene&&phase===next)return true;
      if(name!==musicScene){musicScene=name;beat=0;nextBeat=context?.currentTime||0;nextAmbient=0;}phase=next;mix();return true;
    }
    function tick(){
      if(context&&unlocked&&!settings.muted&&musicScene!=='silent'&&settings.ambient>0&&context.currentTime>=nextAmbient){
        noise(musicScene==='boss'?220:500,.38,.03,ambientBus);nextAmbient=context.currentTime+2.5;
      }
      if(!context||!unlocked||settings.music<=0||settings.muted||musicScene==='silent')return;
      const score=scores[musicScene],bus=musicLayers[musicScene],now=context.currentTime;
      if(nextBeat<now-.25)nextBeat=now;const interval=60/(score.bpm+(musicScene==='boss'&&phase===2?10:0));
      // One scheduler, called by the existing RAF; no unbounded timers or hidden contexts.
      for(let n=0;n<2&&nextBeat<=now+.10;n++){
        const f=score.notes[beat%score.notes.length];tone(f,f,interval*.8,.035,bus,'sine',nextBeat);
        if(beat%2===0)tone(score.bass,score.bass,interval*1.6,.038,bus,'triangle',nextBeat);
        if(musicScene!=='exploration')tone(65,40,.1,.035,bus,'sine',nextBeat);
        if(musicScene==='boss'&&phase===2&&beat%2===1)tone(f*2,f*2,interval*.35,.018,bus,'sine',nextBeat+.12);
        beat++;nextBeat+=interval;
      }
    }
    function configure(values){for(const key of ['master','voice','sfx','music','ui','ambient'])if(key in values)settings[key]=clamp(values[key]);if('muted'in values)settings.muted=!!values.muted;mix();}
    function stop(){for(const o of active){try{o.stop();}catch{}}nextBeat=0;nextAmbient=0;}
    return{settings,unlock,configure,sfx:id=>cue(id,['slimeAttack','slime_warning','slime_rush','slime_jump','bossPhase','charge'].includes(id)?warningBus:sfxBus),ui:id=>cue(id,uiBus),setScene,tick,stop,duck(value){ducked=!!value;mix();},
      get voiceVolume(){return settings.muted?0:settings.master*settings.voice;},get unlocked(){return unlocked;},get contextState(){return context?.state||'unavailable';},
      get diagnostics(){return{warningDuck:ducked?.75:1,ambientDuck:ducked?.12:1,activeNodes:active.size,nodeLimit:LIMIT,musicScene,phase,ducked,contextCreated:!!context};}};
  }
  return{create,presets,scores};
})();
