/* Original vector illustrations for the new battlefield. Rendering is read-only. */
const RebornFieldArt=(()=>{
  const TAU=Math.PI*2,paths=new Map();
  function oval(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
  function path(c,d,fill,stroke='#242238',width=2){let p=paths.get(d);if(!p){p=new Path2D(d);if(paths.size<256)paths.set(d,p);}c.fillStyle=fill;c.fill(p);if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p);}}
  function line(c,x,y,x2,y2,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
  function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'80');g.addColorStop(1,color+'00');oval(c,x,y,r,r,g);}
  function background(c,s,t,reduced){
    if(!['raven','golem'].includes(s.stage))return false;
    if(s.stage==='golem'){ruins(c,t,reduced);return true;}
    const sky=c.createLinearGradient(0,0,0,560);sky.addColorStop(0,'#172239');sky.addColorStop(.65,'#6d8495');sky.addColorStop(1,'#263c46');c.fillStyle=sky;c.fillRect(0,0,1000,560);
    glow(c,750,100,180,'#abbad9');oval(c,750,100,33,33,'#c4d6d4');
    for(let layer=0;layer<3;layer++){
      c.save();c.translate(0,layer*52);path(c,'M-20 310L80 170L155 238L267 108L350 239L458 145L570 289L708 129L822 245L920 155L1030 304L1030 420H-20Z',['#34445f','#3e566b','#496675'][layer],null);c.restore();
    }
    for(let i=0;i<5;i++){const x=(i*239+(reduced?0:t*8))%1240-120;c.save();c.globalAlpha=.14;oval(c,x,85+(i%3)*46,130,15,'#e5eddf');oval(c,x+40,78+(i%3)*46,60,20,'#e5eddf');c.restore();}
    path(c,'M0 425L60 410L148 420L259 407L378 419L480 413L604 422L711 410L848 420L940 408L1000 422V560H0Z','#344f53','#799184');
    path(c,'M0 430L120 420L215 431L340 422L470 428L600 425L735 430L850 422L1000 430V448L0 448Z','#9b9e88','#bec1a2');
    for(let i=0;i<12;i++){const x=i*92;path(c,`M${x} 453L${x+32} 464L${x+22} 520L${x+8} 540Z`,'#253c49',null);line(c,x+35,451,x+65,490,'#5d7474');}
    for(let i=0;i<6;i++){const x=(i*183+(reduced?0:t*90))%1100-50,y=200+(i%3)*65;c.save();c.globalAlpha=.26;line(c,x,y,x+70,y-8,'#d3e6e0',1);line(c,x+15,y+5,x+45,y+2,'#c1e3dc',1);c.restore();}
    // Cracked waystones visually connect the forest's sanctuary to the ruins.
    for(const x of [65,940]){path(c,`M${x-16} 419L${x-14} 349L${x+6} 331L${x+20} 351L${x+14} 421Z`,'#536976','#91a5a3');line(c,x,350,x-4,391,'#b7d9cb');}
    return true;
  }
  function ruins(c,t,reduced){
    const sky=c.createLinearGradient(0,0,0,560);sky.addColorStop(0,'#101e35');sky.addColorStop(.7,'#2b5365');sky.addColorStop(1,'#17343d');c.fillStyle=sky;c.fillRect(0,0,1000,560);
    glow(c,500,230,270,'#5bafbe');
    for(let i=0;i<5;i++){const x=100+i*200;c.save();c.globalAlpha=.3;path(c,`M${x-55} 420V130L${x-35} 108H${x+25}L${x+50} 130V420Z`,'#324d65','#678c99');for(let j=0;j<5;j++)line(c,x-30,170+j*42,x+20,170+j*42,'#7d9eab');c.restore();}
    path(c,'M355 412V210Q355 110 500 73Q645 110 645 210V412H615V214Q610 142 500 103Q390 142 385 214V412Z','#587c86','#8fa99f');
    path(c,'M428 410V247L500 184L572 247V410Z','#274b60','#7babb1');glow(c,500,292,90,'#8adad1');path(c,'M500 245L522 276L515 323L500 340L485 323L478 276Z','#74b9be','#c7ead7');
    for(const x of [38,930]){path(c,`M${x} 425L${x+8} 172L${x+49} 155L${x+59} 425Z`,'#48616c','#869994');path(c,`M${x-5} 167L${x+5} 149L${x+51} 142L${x+66} 158L${x+59} 180Z`,'#7a8c8c','#a5b2a1');for(let i=0;i<4;i++)line(c,x+18,200+i*43,x+35,213+i*43,'#9dc1bc');}
    path(c,'M0 425H1000V560H0Z','#40575f','#9daf9d');
    for(let row=0;row<4;row++){const y=435+row*36;line(c,0,y,1000,y,'#223f4c',2);for(let col=0;col<9;col++)line(c,col*135+(row%2)*65,y,col*135+(row%2)*65-20,y+36,'#293f4c');}
    oval(c,500,458,270,34,null,'#729e9e');oval(c,500,458,240,25,null,'#a3c1b24a');
    for(let i=0;i<9;i++){const a=i*TAU/9;line(c,500+Math.cos(a)*245,458+Math.sin(a)*27,500+Math.cos(a)*266,458+Math.sin(a)*32,'#c1cfac',2);}
    for(let i=0;i<12;i++){const x=25+i*83,y=505+(i%3)*15;path(c,`M${x} ${y}L${x+10} ${y-10}L${x+25} ${y-7}L${x+30} ${y+3}Z`,'#708583','#98aaa0',1);}
    if(!reduced)for(let i=0;i<15;i++){const x=70+i*63,y=150+(i*47+t*9)%240;oval(c,x,y,1.3,1.3,'#9cdac16b');}
  }
  function objects(c,s,t,reduced){
    for(const o of s.enemy?.objects||[]){
      const near=Math.abs(s.player.x-o.x)<=76;const bright=o.ready||o.flash>0;
      glow(c,o.x,393,bright?55:28,o.color);oval(c,o.x,430,35,7,'#0d26377a',bright?o.color:'#718c93');
      path(c,`M${o.x-20} 425L${o.x-12} 406L${o.x+12} 406L${o.x+20} 425Z`,'#5b7079','#93a7a3');
      c.save();c.translate(o.x,391+(reduced?0:Math.sin(t*2)*2));path(c,'M0 -34L16 -16L11 12L0 23L-11 12L-16 -16Z',bright?o.color:o.color+'99','#cce8d8');
      c.strokeStyle='#102d44';c.lineWidth=2.5;c.beginPath();
      if(o.symbol==='circle')c.arc(0,-4,8,0,TAU);
      else if(o.symbol==='triangle'){c.moveTo(0,-14);c.lineTo(9,4);c.lineTo(-9,4);c.closePath();}
      else if(o.symbol==='diamond'){c.moveTo(0,-15);c.lineTo(8,-4);c.lineTo(0,7);c.lineTo(-8,-4);c.closePath();}
      else for(let i=0;i<40;i++){const a=i*.25,r=i*.23;const x=Math.cos(a)*r,y=Math.sin(a)*r-4;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.restore();
      if(o.id==='blue'&&o.flash>0){line(c,o.x,390,s.enemy.x,335,'#c2f0ef',5);glow(c,s.enemy.x,335,85,'#9de3ef');}
      c.font='bold 12px sans-serif';c.textAlign='center';c.fillStyle='#ecf1d7';c.fillText(o.label,o.x,467);if(near){c.fillStyle='#f7d799';c.fillText('E · 상호작용',o.x,486);}
    }
  }
  function raven(c,e,t,reduced){
    const dead=e.ai==='DEFEATED',ground=e.ai==='GROUNDED',dive=e.ai==='DIVE_ATTACK',anticipation=e.ai==='TELEGRAPH_DIVE';
    const y=425-e.lift-38,flap=reduced?0:Math.sin(t*(ground?3:10))*.55;
    oval(c,e.x,430,ground?43:28,7,'#10203366');
    c.save();c.translate(e.x,y);c.scale(e.facing||-1,1);
    if(dead){c.globalAlpha=Math.max(0,1-e.aiTime/.7);c.rotate(reduced?0:Math.min(1,e.aiTime)*.8);for(let i=0;i<8;i++){c.save();c.translate((i-4)*(10+e.aiTime*55),-i*8);path(c,'M-9 -3L12 0L-8 7L-3 0Z','#a18bbb',null);c.restore();}}
    if(e.recoilRemaining>0){c.rotate((e.recoilDirection||1)*e.recoilRemaining*(reduced?.1:.5));}
    if(e.entryRemaining>0){c.globalAlpha*=1-e.entryRemaining*.7;}
    if(dive)c.rotate(.55);else if(anticipation)c.rotate(-.25);else if(ground)c.rotate(.12);
    glow(c,0,-10,65,'#9071cd');
    for(const side of [-1,1]){c.save();c.scale(side,1);c.translate(-4,-10);c.rotate(ground?.65:anticipation?-.9:flap-.25);
      path(c,'M0 0Q-37 -52 -94 -59L-86 -29L-76 -38L-68 -16L-60 -25L-49 -6L-40 -14L-22 10Z','#423551','#b194bc');
      path(c,'M-6 -3Q-40 -39 -81 -46L-68 -26L-53 -13L-28 1Z','#655078',null);
      for(let i=0;i<4;i++)line(c,-23-i*14,-10-i*7,-35-i*13,-5-i*7,'#9c80ac',1);c.restore();}
    path(c,'M-13 17L-46 51L-31 45L-21 56L-10 43L1 47L15 19Z','#332b45','#89709f');
    oval(c,0,1,25,34,e.hitFlash>0?'#d1c3e0':'#3c2e50','#b49ac3');path(c,'M-12 -18Q7 -7 13 23L-4 28Q-15 10 -12 -18Z','#6b527c',null);
    oval(c,18,-29,23,21,'#473451','#b79ebf');path(c,'M33 -35L59 -25L35 -18Z','#c0a77c','#4d4652');path(c,'M7 -40L-10 -48L-1 -39L-9 -34L8 -32Z','#67517a','#342c43');
    oval(c,25,-32,6,5,'#c2f5ed');oval(c,27,-32,2,4,'#243b4e');line(c,16,-39,33,-38,'#d1b4d4',2);
    for(const x of [-11,10]){line(c,x,27,x+3,39,'#b6a582',3);line(c,x+3,39,x+13,43,'#d8c6a0',2);}
    if(!reduced)for(let i=0;i<5;i++){const a=t*1.5+i*1.8;oval(c,Math.cos(a)*50,Math.sin(a)*33,2,4,'#ac91d580');}
    c.restore();
    if(ground){c.strokeStyle='#aae5d6';c.lineWidth=2;c.beginPath();for(let i=0;i<60;i++){const a=i*.22+(reduced?0:t*4);const x=e.x+Math.cos(a)*(25+i*.3),yy=y-30+i*.9;i?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();}
  }
  function telegraph(c,e){
    if(!e)return;
    if(e.ai.startsWith('TELEGRAPH_')){
      const x=e.attackTargetX;c.save();c.globalAlpha=.5;
      if(e.pattern==='sweep'){c.fillStyle='#ce7a96';c.fillRect(60,355,880,50);line(c,70,405,930,405,'#ffd8b0',3);}
      else if(e.kind==='golem'){oval(c,x,425,e.attackRadius,12,'#e9a775','#ffe4af');if(e.pattern==='slam'){line(c,60,420,940,420,'#ffcc93',4);}}
      else {oval(c,x,426,e.attackRadius+18,10,'#e57f6c','#ffe6b1');line(c,e.x,425-e.lift-35,x,416,'#f6b7be',2);}
      c.restore();c.font='bold 13px sans-serif';c.textAlign='center';c.fillStyle='#ffe5bb';c.fillText(({dive:'급강하 예고',sweep:'가로 쓸기 예고',feathers:'깃털 방향을 피하세요',fist:'주먹이 내려옵니다',slam:'충격파 · K로 통과하거나 멀리 피하세요',pulse:'수정 파동 · 원 밖으로 이동'})[e.pattern]||'',x,451);
    }
    for(const h of e.hazards||[]){c.save();c.translate(h.x,h.y);if(h.kind==='wave'){oval(c,0,8,22,9,null,'#d7e9b1');line(c,0,-32,0,12,'#a2dfe6',5);line(c,-7,-20,-7,8,'#e5e9b4',2);}else{c.rotate(Math.atan2(h.vy,h.vx));path(c,'M-19 -4L10 0L-19 5L-11 0Z','#ac91cb','#e0bee5',1);}c.restore();}
  }
  function golem(c,e,t,reduced){
    const dead=e.ai==='DEFEATED',walk=e.ai==='APPROACH',windup=e.ai.startsWith('TELEGRAPH'),strike=['FIST_ATTACK','GROUND_SLAM'].includes(e.ai),pulse=e.ai==='CRYSTAL_PULSE';
    const sway=reduced?0:walk?Math.sin(t*5)*4:Math.sin(t*1.2)*1.5;
    oval(c,e.x,431,78,12,'#0e283b99');c.save();c.translate(e.x,425+sway);c.scale(e.facing||-1,1);
    if(e.recoilRemaining>0){c.rotate((e.recoilDirection||1)*e.recoilRemaining*(reduced?.025:.12));}
    if(e.entryRemaining>0){for(let i=0;i<6;i++){const x=(i-3)*24;path(c,`M${x} -5L${x+10} -17L${x+22} -3Z`,'#b1c6bb',null);}}
    if(dead){for(let i=0;i<7;i++){const x=(i-3)*(16+e.aiTime*25);path(c,`M${x} -10L${x+12} -30L${x+25} -16L${x+22} 0Z`,'#8fa7a4','#cad5b5');}c.globalAlpha=Math.max(0,1-e.aiTime/.8);c.translate(0,Math.min(30,e.aiTime*35));c.scale(1,Math.max(.3,1-e.aiTime*.35));}
    for(const side of [-1,1]){c.save();c.translate(side*29,walk?(reduced?0:Math.sin(t*5+side)*4):0);path(c,'M-20 0L-24 -34L-15 -66L12 -66L23 -36L26 -1Z','#657b7f','#b7b9a1');path(c,'M-18 -36L14 -40L13 -20L-17 -17Z','#8b9c95',null);line(c,-10,-31,7,-25,'#bdd6b4');c.restore();}
    path(c,'M-50 -57L-64 -108L-42 -144L39 -144L65 -107L48 -58L15 -40L-17 -40Z',e.hitFlash>0?'#b9c9c2':'#607a85','#b5c0af',3);
    path(c,'M-42 -139L-18 -154L17 -154L40 -139L22 -125H-24Z','#93a9a6','#c8cfb6');
    for(const side of [-1,1]){c.save();c.translate(side*62,-116);c.rotate(side*(windup?1.8:strike?-.5:.15));path(c,'M-24 -15L19 -22L31 3L24 43L-21 45L-32 12Z','#657d86','#a9b8b0',3);path(c,'M-27 39L23 34L37 72L22 99L-27 94L-39 65Z','#82958f','#c1c5aa',3);for(let i=0;i<3;i++)line(c,-22+i*16,72,-18+i*16,89,'#495f67',2);c.restore();}
    path(c,'M-25 -151L-29 -183L-11 -204L20 -198L33 -171L23 -147Z','#7f9697','#b6c4b6',2);path(c,'M-23 -181L26 -178L19 -166L-18 -167Z','#263e50',null);line(c,-16,-176,14,-174,'#a7f0e2',4);
    glow(c,0,-98,e.coreExposed||pulse?75:36,'#8ee0f0');path(c,'M0 -129L24 -107L17 -76L0 -62L-17 -76L-24 -107Z',e.coreExposed?'#d4f4df':'#74b8d2','#e0f1cd',2);path(c,'M0 -129V-62L17 -76L24 -107Z','#4f97b8',null);
    for(const side of [-1,1]){line(c,side*32,-118,side*44,-106,'#a6cdb8');line(c,side*44,-106,side*33,-89,'#a6cdb8');}
    if(e.shieldActive){c.save();c.globalAlpha=e.shieldFlash>0?.85:.32;oval(c,0,-106,101,119,'#8dcde622','#acdfe7');for(let i=0;i<Math.ceil(3-e.shieldHealth);i++){line(c,-60+i*42,-165,-48+i*42,-126,'#eff7e2',3);line(c,-48+i*42,-126,-64+i*42,-100,'#eff7e2',2);}for(let i=0;i<6;i++){const a=i*TAU/6;line(c,Math.cos(a)*96,-106+Math.sin(a)*112,Math.cos(a+.4)*96,-106+Math.sin(a+.4)*112,'#b6ecde',3);}c.restore();}
    if(e.ai==='SHIELD_BREAK')for(let i=0;i<8;i++){const a=i*TAU/8,r=65+e.aiTime*90;c.save();c.translate(Math.cos(a)*r,-106+Math.sin(a)*r);c.rotate(a);path(c,'M0 -10L9 2L1 14L-5 3Z','#b7e4e3','#edf0cc',1);c.restore();}
    c.restore();c.textAlign='center';c.font='bold 12px sans-serif';c.fillStyle='#def3d8';c.fillText(e.shieldActive?'방어막 '+Math.ceil(e.shieldHealth/3*100)+'%':'핵 노출 · '+e.coreRemaining.toFixed(1)+'초',e.x,190);
  }
  function draw(c,e,t,reduced){if(e.kind==='raven'){raven(c,e,t,reduced);return true;}if(e.kind==='golem'){golem(c,e,t,reduced);return true;}return false;}
  return {background,objects,telegraph,draw};
})();
