/* Final CSS check on actual encounter selection; simulation is never altered. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/reborn-phase5'),channel=process.env.REBORN_BROWSER||'chrome';
(async()=>{const browser=await chromium.launch({channel,headless:true});try{
 const context=await browser.newContext({viewport:{width:1366,height:900}});await context.setOffline(true);const p=await context.newPage(),rows=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const [kind,color]of [['slime',null],['raven','120, 98, 148'],['golem','82, 141, 154'],['boss','162, 126, 171']]){
  await p.goto(pathToFileURL(path.join(root,'EnglishQuest_REBORN.html')).href);await p.locator(`[data-action="encounter"][data-enemy="${kind}"]`).click();await p.waitForTimeout(900);
  const gradient=await p.locator('#enemy-bar').evaluate(e=>getComputedStyle(e).backgroundImage);if(color)assert.ok(gradient.includes(color),kind+' '+gradient);
  rows.push({kind,gradient});if(kind==='raven'||kind==='golem')await p.screenshot({path:path.join(out,`${channel}-${kind}-final-visual.png`),fullPage:true});
 }
 await p.setViewportSize({width:360,height:800});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
 const hash=crypto.createHash('sha256').update(await fs.readFile(path.join(root,'EnglishQuest_REBORN.html'))).digest('hex');await fs.writeFile(path.join(out,`${channel}-final-visual.json`),JSON.stringify({browser:channel,hash,rows,errors},null,2));console.log('PASS',channel,'final encounter HP colors and 360px');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
