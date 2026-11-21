const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),channel=process.env.REBORN_BROWSER||'chrome',out=path.join(root,'docs/reborn-phase5');
(async()=>{const browser=await chromium.launch({channel,headless:true});try{
 const ctx=await browser.newContext({viewport:{width:1366,height:900}});await ctx.setOffline(true);const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href);
 await p.locator('[data-action="encounter"][data-enemy="slime"]').click();await p.keyboard.down('j');await p.waitForTimeout(30);await p.keyboard.up('j');await p.keyboard.down('j');
 await p.waitForFunction(()=>RebornApp.game.state.player.comboBuffered);await p.waitForFunction(()=>RebornApp.game.state.player.comboIndex===2);await p.waitForTimeout(900);await p.keyboard.up('j');
 assert.equal(await p.evaluate(()=>RebornApp.game.state.player.comboIndex),0);assert.equal(await p.evaluate(()=>RebornApp.game.state.stats.battlefield.missedAttacks),2);
 await p.keyboard.press('Escape');await p.locator('details.settings>summary').click();for(const k of ['music','ambient']){await p.locator(`[data-volume="${k}"]`).focus();await p.locator(`[data-volume="${k}"]`).press('End');}
 await p.locator('#reduced').check();await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>RebornApp.audio.diagnostics.activeNodes),0);
 const before=await p.evaluate(()=>({time:RebornApp.game.state.time,hp:RebornApp.game.state.player.hp}));await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>({time:RebornApp.game.state.time,hp:RebornApp.game.state.player.hp})),before);
 await p.locator('[data-action="resume"]').click();await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>RebornApp.audio.diagnostics.contextCreated),true);assert.ok(await p.evaluate(()=>RebornApp.audio.diagnostics.activeNodes<=96));
 await p.locator('[data-action="pause"]').click();await p.setViewportSize({width:360,height:800});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.screenshot({path:path.join(out,`${channel}-polish-controls.png`),fullPage:true});assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,`${channel}-polish-controls.json`),JSON.stringify({browser:channel,version:browser.version(),realBufferedInput:true,heldKeyNoLoop:true,pausedNodes:0,reducedMotion:true,width:360,errors},null,2));console.log('PASS',channel,'buffer, held-key, pause, ambient cleanup, reduced-motion, 360px');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
