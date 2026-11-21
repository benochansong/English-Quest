/* Original procedural sound design; no external samples, no campaign state. */
const RebornAudio=(()=>{
  const presets={
    sword:[420,160,.12,'sawtooth'],impact:[120,45,.16,'triangle'],bounce:[170,270,.11,'sine'],slimeAttack:[180,70,.25,'triangle'],
    playerHit:[160,65,.24,'sawtooth'],dodge:[450,900,.12,'sine'],magicCharge:[260,920,.5,'sine'],magicExplosion:[90,35,.5,'sawtooth'],
    bossEntrance:[100,65,.8,'triangle'],bossDeath:[330,880,.8,'sine'],victory:[523,1046,.8,'sine']
  };
  function create(initial={}){
    const settings={master:.7,voice:.85,sfx:.65,music:0,muted:false,...initial};
    let context,master,sfxBus,musicBus,unlocked=false,ducked=false,musicNodes=[],active=new Set();
    const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
    function mix(){
      if(!context)return;
      const t=context.currentTime;
      master.gain.setTargetAtTime(settings.muted?0:settings.master,t,.025);
      sfxBus.gain.setTargetAtTime(settings.sfx*(ducked?.35:1),t,.025);
      musicBus.gain.setTargetAtTime(settings.music*(ducked?.18:1)*.045,t,.08);
    }
    function unlock(){
      unlocked=true;
      try{
        if(!context){const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return false;context=new C();master=context.createGain();sfxBus=context.createGain();musicBus=context.createGain();master.connect(context.destination);sfxBus.connect(master);musicBus.connect(master);}
        if(context.state==='suspended')context.resume().catch(()=>{});
        mix();music();return true;
      }catch{return false;}
    }
    function music(){
      if(!context||!unlocked)return;
      if(settings.music>0&&!musicNodes.length){
        // An original, quiet open fifth; optional ambience rather than a borrowed score.
        [146.83,220,293.66].forEach((f,i)=>{const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=f;g.gain.value=i===0?.6:.25;o.connect(g);g.connect(musicBus);o.start();musicNodes.push({o,g});});
      }else if(settings.music===0){for(const {o,g} of musicNodes){o.stop();o.disconnect();g.disconnect();}musicNodes=[];}
    }
    function configure(values){for(const key of ['master','voice','sfx','music'])if(key in values)settings[key]=clamp(values[key]);if('muted'in values)settings.muted=!!values.muted;mix();music();}
    function sfx(id){
      const aliases={swing:'sword',hit:'impact',attack:'slimeAttack',hurt:'playerHit',magic:'magicExplosion',charge:'magicCharge',boss:'bossEntrance',win:'victory',sword_swing:'sword',sword_impact:'impact',slime_bounce:'bounce',slime_warning:'bounce',slime_jump:'slimeAttack',slime_rush:'slimeAttack',slime_land:'impact',slime_defeat:'magicExplosion',player_hit:'playerHit',magic_charge:'magicCharge',magic_explosion:'magicExplosion',crystal_charge:'magicCharge',boss_entrance:'bossEntrance',boss_defeat:'bossDeath',boss_phase:'bossEntrance',correct:'victory',incorrect:'bounce',defeat:'playerHit'};
      const p=presets[aliases[id]||id];if(!p||!unlocked||!context||settings.muted)return false;
      const [f,to,duration,type]=p,t=context.currentTime,o=context.createOscillator(),g=context.createGain();
      o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(to,t+duration);
      g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(type==='sawtooth'?.12:.25,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+duration);
      o.connect(g);g.connect(sfxBus);active.add(o);o.onended=()=>{active.delete(o);o.disconnect();g.disconnect();};o.start();o.stop(t+duration+.02);return true;
    }
    function stop(){for(const o of active){try{o.stop();}catch{}}for(const {o,g} of musicNodes){o.stop();o.disconnect();g.disconnect();}musicNodes=[];}
    return{settings,unlock,configure,sfx,stop,duck(value){ducked=!!value;mix();},get voiceVolume(){return settings.muted?0:settings.master*settings.voice;},get unlocked(){return unlocked;},get contextState(){return context?.state||'unavailable';}};
  }
  return{create,presets};
})();
