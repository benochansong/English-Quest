/* Context-local owner: unloading a combat frame also cancels its one RAF and audio. */
const IntegratedLifecycle=(()=>{
 const contexts=new Set(),frames=new Set(),raf=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
 let stopped=false;
 window.requestAnimationFrame=fn=>{if(stopped)return 0;let id=raf(t=>{frames.delete(id);if(!stopped)fn(t);});frames.add(id);return id;};
 window.cancelAnimationFrame=id=>{frames.delete(id);cancel(id);};
 for(const name of ['AudioContext','webkitAudioContext']){const Base=window[name];if(Base)window[name]=class extends Base{constructor(...args){super(...args);contexts.add(this);}};}
 return{async suspend(){await Promise.all([...contexts].filter(c=>c.state==='running').map(c=>c.suspend().catch(()=>{})));},async resume(){await Promise.all([...contexts].filter(c=>c.state==='suspended').map(c=>c.resume().catch(()=>{})));},stop(){stopped=true;for(const id of frames)cancel(id);frames.clear();for(const c of contexts)if(c.state!=='closed')c.close().catch(()=>{});},get state(){return{frames:frames.size,contexts:[...contexts].map(c=>c.state),stopped};}};
})();
