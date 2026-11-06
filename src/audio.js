// Original short cues, synthesized on demand after a gesture.
const AudioFX = (() => {
  // Effects share one short noise sample and a quiet output bus, allocated on first use.
  let context, master, noiseSample;
  let lastUi = -Infinity;
  const aliases = {select:'ui',incorrect:'wrong',hit:'impact',magic:'fire',healing:'heal',win:'victory',
    lose:'defeat',levelUp:'level','level-up':'level',bossVictory:'bossWin',bossHit:'heavy'};
  function prepare(settings) {
    if (!settings?.sound || !(settings.volume > 0) || globalThis.navigator?.userActivation?.hasBeenActive === false) return false;
    if (!context) {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return false;
      context = new Context();
      master = context.createGain();
      master.connect(context.destination);
      const count = Math.ceil(context.sampleRate * .4);
      noiseSample = context.createBuffer(1,count,context.sampleRate);
      const channel = noiseSample.getChannelData(0);
      let seed = 761928;
      for (let i=0; i<count; i++) {
        seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
        channel[i] = seed / 2147483648 - 1;
      }
    }
    if (context.state === 'suspended') context.resume().catch(()=>{});
    master.gain.setValueAtTime(Math.min(1,settings.volume) * .54,context.currentTime);
    return true;
  }
  function envelope(source, node, at, length, level, attack=.008) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at+attack);
    gain.gain.exponentialRampToValueAtTime(.0001, at+length);
    node.connect(gain);
    gain.connect(master);
    source.onended = () => {
      gain.disconnect();
      node.disconnect();
      if (node!==source) source.disconnect();
    };
    source.start(at);
    source.stop(at+length+.01);
  }
  function tone(freq, to, at, length, level, type='sine', attack=.01) {
    const osc = context.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (to!==freq) osc.frequency.exponentialRampToValueAtTime(to,at+length);
    envelope(osc,osc,at,length,level,attack);
  }
  function noise(freq,to,at,length,level) {
    const source = context.createBufferSource();
    source.buffer = noiseSample;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(freq,at);
    filter.frequency.exponentialRampToValueAtTime(to,at+length);
    source.connect(filter);
    envelope(source,filter,at,length,level,.018);
  }
  function bell(pitch, at, length=.36, level=.12) {
    tone(pitch,pitch,at,length,level);
    tone(pitch*2.01,pitch*2.01,at,length*.47,level*.3,'sine',.004);
  }
  function arpeggio(notes, start, interval, length=.35, level=.12) {
    notes.forEach((note,i)=>bell(note,start+i*interval,length,level));
  }
  function play(effect,settings) {
    try {
      if (!prepare(settings)) return;
      const at=context.currentTime+.003;
      switch (aliases[effect]||effect) {
        case 'ui':
          if (at-lastUi<.06) return;
          lastUi=at;
          tone(580,470,at,.075,.075);
          break;
        case 'correct': arpeggio([587,880],at,.087,.32,.11); break;
        case 'wrong': tone(350,312,at,.22,.11,'triangle'); break;
        case 'sword': noise(780,3280,at+.17,.17,.29); break;
        case 'impact': noise(1850,260,at,.13,.23); tone(188,80,at,.14,.17,'triangle'); break;
        case 'fire': tone(132,485,at,.31,.1,'triangle',.06); noise(690,1850,at+.2,.32,.3); break;
        case 'guard': arpeggio([392,587,784],at,.079,.31,.1); break;
        case 'shieldHit': noise(630,1480,at,.09,.19); bell(659,at,.41,.12); bell(990,at+.024,.22,.06); break;
        case 'enemy': tone(173,77,at,.16,.17,'triangle'); noise(640,240,at,.11,.12); break;
        case 'heavy': tone(125,48,at,.39,.24,'triangle'); noise(1100,140,at,.25,.25); bell(247,at+.045,.35,.09); break;
        case 'charge': tone(143,226,at,.52,.12,'triangle',.13); tone(219,332,at+.11,.42,.09,'sine',.11); break;
        case 'heal': arpeggio([392,494,587,784],at,.085,.4,.095); break;
        case 'victory': arpeggio([392,494,587,784],at,.105,.47,.1); bell(392,at+.32,.52,.095); break;
        case 'level': arpeggio([523,659,784,1047],at,.105,.48,.105); bell(659,at+.32,.4,.07); break;
        case 'bossWin':
          tone(147,147,at,.9,.13,'triangle',.06);
          arpeggio([294,440,587,740,880],at,.116,.46,.11);
          bell(587,at+.57,.63,.10);
          bell(1174,at+.58,.58,.075);
          break;
        case 'defeat': arpeggio([392,330,262],at,.135,.36,.09); break;
      }
    } catch { /* Device or context unavailable: gameplay continues. */ }
  }
  function voice(settings) {
    if (!settings?.voice || !globalThis.SpeechSynthesisUtterance) return null;
    try {
      const voices = globalThis.speechSynthesis?.getVoices() || [];
      return voices.find(v => v.localService && /^en[-_]US$/i.test(v.lang))
        || voices.find(v => v.localService && /^en(?:[-_]|$)/i.test(v.lang)) || null;
    } catch { return null; }
  }
  function stop() {
    try { globalThis.speechSynthesis?.cancel(); } catch { /* optional */ }
  }
  function speak(text, settings, onError) {
    const english = voice(settings);
    if (!english) return false;
    try {
      stop();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = english;
      utterance.lang = english.lang;
      utterance.rate = .83;
      utterance.onerror = event => {
        if (!['canceled','interrupted'].includes(event.error)) onError?.();
      };
      globalThis.speechSynthesis.speak(utterance);
      return true;
    } catch { return false; }
  }
  return {play, speak, canSpeak:settings => !!voice(settings), stop};
})();
