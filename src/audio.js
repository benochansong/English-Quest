// Original short cues, synthesized on demand after a gesture.
const AudioFX = (() => {
  let context;
  const cues = {
    ui:      ['sine',     [392],              .06],
    correct: ['sine',     [523, 784],         .12],
    wrong:   ['sine',     [330, 294],         .13],
    sword:   ['sawtooth', [420, 170, 92],      .045],
    fire:    ['triangle', [175, 349, 587],     .085],
    guard:   ['sine',     [392, 523],          .1],
    enemy:   ['triangle', [147, 98],           .1],
    heal:    ['sine',     [392, 494, 587, 784],.1],
    victory: ['triangle', [392, 494, 587, 784],.16],
    level:   ['sine',     [523, 659, 784,1047],.14],
    defeat:  ['sine',     [392, 330, 262],     .18]
  };
  const aliases = {select:'ui', incorrect:'wrong', hit:'enemy', magic:'fire',
    healing:'heal', win:'victory', lose:'defeat', levelUp:'level', 'level-up':'level'};
  function play(effect, settings) {
    if (!settings?.sound || settings.volume <= 0) return;
    try {
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContext) return;
      context ||= new AudioContext();
      if (context.state === 'suspended') context.resume().catch(() => {});
      const [wave, notes, duration] = cues[aliases[effect] || effect] || cues.ui;
      const start = context.currentTime;
      for (const [i, frequency] of notes.entries()) {
        const at = start + i*duration;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002, .13*settings.volume), at+.012);
        gain.gain.exponentialRampToValueAtTime(.0001, at+duration+.04);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at);
        oscillator.stop(at+duration+.05);
      }
    } catch { /* A disabled audio device should never interrupt a turn. */ }
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
