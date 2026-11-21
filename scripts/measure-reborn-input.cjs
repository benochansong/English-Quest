/* Deterministic reference timing, distinct from OS/browser input latency. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),baseline='5187950abfdea0d694aed981a27fb821e09d7fed';
const learning=fs.readFileSync(path.join(root,'src/reborn-learning.js'),'utf8');
const before=execFileSync('git',['show',baseline+':src/reborn-combat.js'],{cwd:root,encoding:'utf8'}),after=fs.readFileSync(path.join(root,'src/reborn-combat.js'),'utf8');
function measure(source){const api=vm.runInNewContext(learning+'\n'+source+';RebornCombat'),presses=[];
 for(const ms of [0,25,50,75]){const g=api.create({flow:false});g.selectEncounter('slime');g.input('attack');g.input('attack',false);for(let i=0;i<ms/1000*120;i++)g.update(1/120);presses.push({atMs:ms,accepted:g.input('attack')});}
 return{buffer:presses,strikes:JSON.parse(JSON.stringify(api.CONFIG.sword.strikes)),dodge:JSON.parse(JSON.stringify(api.CONFIG.dodge))};}
const result={definition:'Fixed-step simulation accepts a distinct second press, not hardware latency',baseline, before:measure(before),after:measure(after)};
fs.writeFileSync(path.join(root,'docs/reborn-phase5/input-comparison.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({before:result.before.buffer,after:result.after.buffer}));
