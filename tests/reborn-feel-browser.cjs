/* Comparable real-input route. Observer reads state; never alters gameplay. */
const {play,read,click}=require('./reborn-battlefield-browser.cjs');
const {chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),channel=process.env.REBORN_BROWSER||'chrome',baseline=process.argv.includes('--baseline'),tag=baseline?'baseline':'final',out=path.join(root,'docs/reborn-phase5');
(async()=>{await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({channel,headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1366,height:900}});await ctx.setOffline(true);const p=await ctx.newPage(),errors=[],requests=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 const file=baseline?'.phase3-baseline/phase4-verified.html':'EnglishQuest_REBORN.html';await p.goto(pathToFileURL(path.join(root,file)).href);
 await p.evaluate(()=>{window.feelProbe={frames:[],responses:[],firstControl:null,firstHit:null,origin:0,scenes:{},nodes:0};const q=window.feelProbe;let last=0,pending=null;
 document.addEventListener('keydown',e=>{if(e.code==='KeyJ'&&!e.repeat&&RebornApp.game.state.mode==='COMBAT'&&!RebornApp.game.state.player.comboIndex)pending=performance.now();},true);
 function observe(t){const s=RebornApp.game.state;if(q.origin){if(last&&q.frames.length<30000)q.frames.push(t-last);if(q.firstControl===null&&s.mode==='COMBAT')q.firstControl=t-q.origin;if(q.firstHit===null&&s.stats.combat.swordHits)q.firstHit=t-q.origin;
 if(pending&&s.player.comboIndex){q.responses.push(t-pending);pending=null;}if(pending&&t-pending>600)pending=null;
 if(s.enemy&&['COMBAT','PLAYER_HIT'].includes(s.mode)){const z=q.scenes[s.stage]||=( {activeMs:0,inactiveMs:0,reachableMs:0,coreMs:0});const dt=last?Math.min(t-last,100):0;z.activeMs+=dt;if(['IDLE','PATROL'].includes(s.enemy.ai))z.inactiveMs+=dt;if(s.enemy.lift<=85)z.reachableMs+=dt;if(s.enemy.coreExposed||s.enemy.ai==='GROUNDED')z.coreMs+=dt;}
 q.nodes=Math.max(q.nodes,RebornApp.audio.diagnostics.activeNodes);}
 last=t;requestAnimationFrame(observe);}requestAnimationFrame(observe);});
 await p.evaluate(()=>window.feelProbe.origin=performance.now());await click(p,'story');const routes=[];
 for(const kind of ['slime','raven','golem']){await p.waitForFunction(k=>RebornApp.game.state.stage===k,kind);routes.push(await play(p));if(kind!=='golem')await click(p,'advance');}
 const state=await read(p),probe=await p.evaluate(()=>window.feelProbe);assert.equal(state.mode,'VICTORY');assert.equal(state.stats.combat.damageDealt,350);assert.ok(probe.firstHit<30000);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const percentile=(a,n)=>[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*n))]||0;
 const result={tag,browser:channel,version:browser.version(),sha256:crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex'),firstControlMs:probe.firstControl,firstSwordHitMs:probe.firstHit,inputToPoseMs:{samples:probe.responses.length,p50:percentile(probe.responses,.5),p95:percentile(probe.responses,.95)},frameMs:{samples:probe.frames.length,p50:percentile(probe.frames,.5),p95:percentile(probe.frames,.95),p99:percentile(probe.frames,.99)},scenes:probe.scenes,peakAudioNodes:probe.nodes,history:state.adventure.history,audio:state.stats.flow.audio,errors,requests};
 await fs.writeFile(path.join(out,`${channel}-${tag}-metrics.json`),JSON.stringify(result,null,2)+'\n');await p.waitForTimeout(800);await p.screenshot({path:path.join(out,`${channel}-${tag}-results.png`),fullPage:true});console.log('PASS',channel,tag,JSON.stringify({firstHit:result.firstSwordHitMs,input:result.inputToPoseMs,frames:result.frameMs}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
