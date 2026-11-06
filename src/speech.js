// Browser-owned optional recognition. Transcripts live only in the caller for one attempt.
const SpeechInput = (function recognitionAdapter() {
  // No constructor, permission prompt or audio access until the user explicitly starts a turn.
  const permissionWindow = 12000;
  const listeningWindow = 16000;
  const processingWindow = 5500;
  let active = null;
  let generation = 0;

  function constructorForBrowser() {
    try { return globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition; }
    catch { return null; }
  }
  function available() { return typeof constructorForBrowser() === 'function'; }

  function release(session, abort) {
    globalThis.clearTimeout(session.timer);
    const recognizer = session.recognizer;
    if (!recognizer) return;
    for (const event of ['start','audiostart','speechstart','speechend','audioend','result','error','nomatch','end']) {
      recognizer['on'+event] = null;
    }
    if (abort) {
      try { recognizer.abort(); } catch { /* The browser may already have released its capture. */ }
    }
  }

  function cancel() {
    generation++;
    const session = active;
    active = null;
    if (session) release(session,true);
  }

  function stop() {
    const session = active;
    cancel();
    session?.onState?.('ready','stopped');
  }

  function errorState(code) {
    if (['not-allowed','service-not-allowed','NotAllowedError','SecurityError'].includes(code)) return 'denied';
    if (code === 'no-speech') return 'timeout';
    if (code === 'aborted' || code === 'no-match') return 'ready';
    return 'unavailable';
  }

  function start({onState, onResult, lang='en-US'} = {}) {
    if (active) return false;
    const Recognition = constructorForBrowser();
    if (typeof Recognition !== 'function') {
      onState?.('unavailable','unsupported');
      return false;
    }
    const session = {onState,recognizer:null,timer:null,state:'',generation:++generation};
    active = session;
    const current = () => session === active && session.generation === generation;

    function finish(state, reason, abort=true, text='') {
      if (!current()) return;
      active = null;
      release(session,abort);
      onState?.(state,reason);
      // The state callback can close this screen or begin another exercise.
      if (state === 'result' && generation === session.generation) onResult?.(text);
    }
    function phase(state, duration) {
      if (!current() || state === session.state) return;
      session.state = state;
      globalThis.clearTimeout(session.timer);
      session.timer = globalThis.setTimeout(()=>finish('timeout',state),duration);
      onState?.(state,'');
    }
    function listen() {
      if (session.state === 'requesting') phase('listening',listeningWindow);
    }
    function process() {
      if (session.state === 'requesting' || session.state === 'listening') phase('processing',processingWindow);
    }
    try {
      const recognizer = session.recognizer = new Recognition();
      recognizer.lang = lang;
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
      // The service starting doesn't by itself establish that the microphone is capturing.
      recognizer.onaudiostart = listen;
      recognizer.onspeechstart = listen;
      recognizer.onspeechend = process;
      recognizer.onaudioend = process;
      recognizer.onresult = event => {
        if (!current()) return;
        const chunks = [];
        for (const result of Array.from(event?.results || [])) {
          const text = result?.[0]?.transcript;
          if (result?.isFinal === true && typeof text === 'string' && text.trim()) chunks.push(text.trim());
        }
        if (chunks.length) finish('result','',true,chunks.join(' ').slice(0,320));
      };
      recognizer.onerror = event => {
        const code = typeof event?.error === 'string' ? event.error : 'service-error';
        finish(errorState(code),code);
      };
      recognizer.onnomatch = () => finish('ready','no-match');
      recognizer.onend = () => finish('ready','no-match',false);
      phase('requesting',permissionWindow);
      if (!current()) return false;
      recognizer.start();
      return true;
    } catch (error) {
      const code = error?.name || 'start-failed';
      finish(errorState(code),code);
      return false;
    }
  }

  return Object.freeze({available,start,stop,cancel});
})();
