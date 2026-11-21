/* File-first, single-channel voice adapter. Its events never change combat rules. */
const RebornVoice=(()=>{
  function create(manifest,mixer,options={}){
    const table=new Map(manifest.utterances.map(x=>[x.id,x]));
    const AudioClass=options.Audio||globalThis.Audio, synth=options.speechSynthesis||globalThis.speechSynthesis;
    const Utterance=options.SpeechSynthesisUtterance||globalThis.SpeechSynthesisUtterance;
    const timer=options.setTimeout||globalThis.setTimeout,clear=options.clearTimeout||globalThis.clearTimeout;
    let generation=0,active=null,timeout=null,currentId=null,slow=false,fallback=false;
    const availableCount=manifest.utterances.filter(x=>x.available&&x.embedded).length;
    let status={state:'idle',source:null,message:`영어 음성 ${availableCount}/${manifest.utterances.length}개 · 듣기 버튼을 눌러 주세요.`};
    function report(state,source,message){status={state,source,message,id:currentId};options.onStatus?.(status);}
    function stop(){generation++;if(timeout!==null){clear(timeout);timeout=null;}if(active){active.onplaying=active.onended=active.onerror=null;active.pause?.();active=null;}synth?.cancel?.();mixer.duck(false);if(status.state==='playing'||status.state==='loading')report('stopped',null,'음성이 멈췄습니다. 다시 듣기로 재생할 수 있습니다.');}
    function configure(values){if('slow'in values)slow=!!values.slow;if('fallback'in values)fallback=!!values.fallback;stop();report('idle',null,'재생 설정 변경됨 · 다시 듣기를 누르세요.');}
    function refreshVolume(){
      if(mixer.voiceVolume<=0){stop();report('muted',null,'음량이 0이거나 음소거 상태입니다. 소리를 켠 뒤 다시 듣기를 누르세요.');}
      else if(active)active.volume=mixer.voiceVolume;
    }
    function play(id){
      stop();currentId=id;const item=table.get(id),token=generation;
      const live=()=>generation===token;let heard=false;
      const started=source=>{if(!heard&&live()&&mixer.voiceVolume>0){heard=true;options.onHeard?.({id,source});}};
      if(!item){report('missing',null,'음성 대본을 찾지 못했습니다.');return false;}
      if(!mixer.unlocked){report('blocked',null,'먼저 시작 또는 듣기 버튼을 눌러 주세요.');return false;}
      if(mixer.voiceVolume<=0){report('muted',null,'음성이 꺼져 있습니다. 소리를 켜거나 원문 도움을 이용하세요.');return false;}
      const finish=(state,source,message)=>{if(!live())return;generation++;clear(timeout);timeout=null;if(active){active.onplaying=active.onended=active.onerror=null;active.pause?.();active=null;}mixer.duck(false);report(state,source,message);};
      function browserFallback(reason){
        if(!live())return;
        if(!fallback){finish('missing',null,reason+' · 원문 도움 또는 「기기 음성 대안」을 선택하세요.');return false;}
        const voices=synth?.getVoices?.()||[],voice=voices.find(v=>v.localService&&/^en-US$/i.test(v.lang))||voices.find(v=>v.localService&&/^en[-_]/i.test(v.lang));
        if(!voice||!Utterance){finish('missing',null,'설치된 로컬 영어 음성이 없습니다. 원문 도움으로 진행할 수 있습니다.');return false;}
        const utterance=new Utterance(item.en);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=slow?.75:1;utterance.volume=mixer.voiceVolume;
        utterance.onstart=()=>{if(!live())return;mixer.duck(true);report('playing','browser-fallback','기기 합성 음성 재생 중 · 제작 음성 파일 아님');started('browser-fallback');};
        utterance.onend=()=>finish('ended','browser-fallback','기기 음성 재생 완료');utterance.onerror=()=>finish('error','browser-fallback','기기 음성을 재생하지 못했습니다. 원문 도움을 사용하세요.');
        timeout=timer(()=>{if(live()){synth.cancel();finish('error','browser-fallback','음성 응답 시간이 초과되었습니다. 다시 듣거나 원문을 보세요.');}},15000);
        report('loading','browser-fallback','기기 합성 음성 준비 중');
        try{synth.speak(utterance);return true;}catch{finish('error','browser-fallback','기기 음성을 재생하지 못했습니다. 원문 도움을 사용하세요.');return false;}
      }
      if(!item.available||!item.embedded)return browserFallback('제작 음성 파일 미포함');
      try{
        const slowTake=slow&&item.embeddedSlow;
        active=new AudioClass(slowTake||item.embedded);const media=active;active.volume=mixer.voiceVolume;active.playbackRate=(slow&&!slowTake)?0.75:1;active.preservesPitch=true;
        active.onplaying=()=>{if(!live()||active!==media)return;mixer.duck(true);report('playing','asset',item.voiceModel?'Piper AI 영어 음성 재생 중':'음성 파일 재생 중');started('asset');};
        active.onended=()=>{if(active===media)finish('ended','asset','음성 파일 재생 완료');};
        active.onerror=()=>{if(!live()||active!==media)return;active?.pause?.();active=null;clear(timeout);timeout=null;browserFallback('음성 파일 오류');};
        timeout=timer(()=>{if(live()){active?.pause?.();finish('error','asset','음성 파일 재생 시간이 초과되었습니다.');}},15000);
        report('loading','asset','음성 파일 준비 중');const pending=active.play();pending?.catch?.(()=>{if(live()&&active===media){active?.pause?.();active=null;clear(timeout);timeout=null;browserFallback('브라우저에서 음성 재생을 거부했습니다');}});return true;
      }catch{return browserFallback('음성 재생 장치를 사용할 수 없습니다');}
    }
    return{play,replay:()=>currentId?play(currentId):false,stop,configure,refreshVolume,get availableCount(){return availableCount;},get status(){return status;},get currentId(){return currentId;},get slow(){return slow;},get fallback(){return fallback;},getItem:id=>table.get(id)};
  }
  return{create};
})();
