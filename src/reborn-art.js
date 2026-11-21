// Original Canvas illustration. Rendering never changes combat state or owns a frame loop.
// Caller provides a 1000×560 logical viewport and time in seconds; DPR scaling is preserved.
const RebornArt = (() => {
  const W=1000,H=560,FLOOR=425,TAU=Math.PI*2;
  const cache=new Map(); let scenery=null;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number(x)||0));
  const mix=(a,b,t)=>a+(b-a)*clamp(t), ease=t=>1-(1-clamp(t))**3;
  const palette={ink:'#142e3c',gold:'#cbb886',light:'#e6e8d0',steel:'#b2c9ce',cape:'#367b83'};
  function shape(c,d,fill,stroke,width=1){
    let p=cache.get(d);if(!p){p=new Path2D(d);if(cache.size<240)cache.set(d,p);}
    if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke(p);}
  }
  function ellipse(c,x,y,rx,ry,fill,stroke,width=1){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function line(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function local(c,x,y,angle,fn,sx=1,sy=sx){c.save();c.translate(x,y);c.rotate(angle||0);c.scale(sx,sy);fn();c.restore();}
  function gradient(c,x,y,x2,y2,stops){const gr=c.createLinearGradient(x,y,x2,y2);stops.forEach(([at,color])=>gr.addColorStop(at,color));return gr;}
  function glow(c,x,y,r,color,alpha=.3){c.save();c.globalAlpha*=alpha;const gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,color);gr.addColorStop(.3,color+'80');gr.addColorStop(1,color+'00');ellipse(c,x,y,r,r,gr);c.restore();}
  function leaf(c,x,y,s,color,angle=0){local(c,x,y,angle,()=>shape(c,'M-14 0Q-4 -13 13 -3Q7 9 -14 0Z',color),s);}
  function bush(c,x,y,s,colors){local(c,x,y,0,()=>{shape(c,'M-72 9Q-89 -13 -61 -28Q-67 -51 -37 -48Q-23 -69 1 -49Q31 -65 45 -38Q79 -37 75 -13Q94 8 62 21L-59 23Z',colors[0]);shape(c,'M-66 -23Q-52 -44 -35 -39Q-20 -61 1 -44Q27 -55 39 -33Q65 -33 67 -17Q33 -24 22 -10Q0 -25 -20 -11Q-43 -27 -66 -23Z',colors[1]);for(let i=0;i<9;i++)leaf(c,-53+i*14,-14-(i%3)*10,.55,colors[2],i*.2);},s);}
  function tree(c,x,y,s,front=false){local(c,x,y,0,()=>{
    const bark=front?'#193a42':'#294a55',lit=front?'#38605b':'#436873';
    shape(c,'M-69 9Q-35 -4 -27 -44L-30 -193Q-35 -250 -74 -289L-101 -311L-85 -317L-34 -277L-47 -362L-27 -358L-6 -275Q16 -305 49 -316L69 -314L17 -273Q1 -241 13 -202L23 -43Q27 -9 70 9L27 9L-2 -7L-31 12Z',bark);
    shape(c,'M-20 -298Q-9 -226 -10 -177L-7 -47Q-9 -19 -28 4L-11 2Q7 -25 4 -57L0 -202Q-5 -235 -20 -298Z',lit);
    line(c,[[-32,-252],[-19,-193],[-22,-69],[-39,-9]],front?'#709078':'#64888b',2);
    line(c,[[13,-214],[6,-167],[14,-100],[14,-49],[32,-7]],'#5c7c72',1.2);
    line(c,[[-43,-292],[-28,-267],[-16,-232]],'#8ba18b',1.4);
    shape(c,'M-28 -92L-19 -110L-18 -67L-26 -50Z','#102e39');
    bush(c,-52,-296,1.25,front?['#163c42','#265653','#4b7b65']:['#2b5360','#3a6971','#578789']);
    bush(c,59,-300,1.33,front?['#193f44','#2d5a56','#527e66']:['#2b5360','#3a6971','#578789']);
    bush(c,-2,-359,1.22,front?['#173a40','#2c5752','#56846a']:['#2b5360','#3a6971','#578789']);
  },s);}
  function mushroom(c,x,y,s=1){local(c,x,y,0,()=>{shape(c,'M-2 0L-1 -17L3 -17L4 0Z','#a6c5af');shape(c,'M-15 -16Q-11 -33 1 -32Q12 -31 17 -17Q4 -10 -15 -16Z','#78b8b4','#396e78',.8);shape(c,'M-12 -19Q-7 -30 2 -29Q9 -28 13 -21Q-2 -25 -12 -19Z','#c1e0cc');ellipse(c,-5,-21,2,1,'#e4edcf');ellipse(c,6,-19,1.2,.8,'#e4edcf');},s);}
  function stone(c,x,y,s=1){local(c,x,y,0,()=>{shape(c,'M-25 0L-17 -15L2 -24L26 -13L31 -2L11 7L-17 6Z','#59797b','#284d58');shape(c,'M-17 -15L2 -24L26 -13L6 -7Z','#90a59a');line(c,[[2,-23],[6,-8],[11,6]],'#bed0ae',.8);},s);}
  function crystal(c,x,y,s=1,color='#9ddfe3',angle=0){local(c,x,y,angle,()=>{shape(c,'M0 -43L10 -29L8 -6L0 2L-10 -7L-9 -29Z',color,'#4b899f',1);shape(c,'M0 -43L1 -12L8 -6L10 -29Z','#6fa6c4');shape(c,'M0 -43L-9 -29L1 -12Z','#ddf5e8');line(c,[[1,-12],[0,2]],'#cbe9ed',.7);},s);}
  function buildScenery(c){
    c.fillStyle=gradient(c,0,0,0,H,[[0,'#081923'],[.43,'#1e4351'],[.75,'#527879'],[1,'#1a424a']]);c.fillRect(0,0,W,H);
    glow(c,647,105,207,'#b7ddd5',.3);glow(c,435,293,260,'#82c8cc',.16);
    ellipse(c,650,98,36,36,'#d4e4cf');ellipse(c,662,89,34,34,'#c7dcd0');ellipse(c,637,104,8,5,'#bbd3c6');ellipse(c,654,120,4,3,'#b5cec5');
    c.save();c.globalAlpha=.09;shape(c,'M605 0L697 0L925 425L529 425Z','#d2f3dc');shape(c,'M562 0L583 0L454 425L333 425Z','#a8e6de');c.restore();
    shape(c,'M0 237Q108 199 180 223Q282 170 375 211Q495 169 608 209Q742 180 827 220Q938 176 1000 221L1000 420H0Z','#214753');
    for(let i=0;i<18;i++){
      const x=18+i*58,base=371+(i%3)*9,height=185+(i*37)%110;
      c.save();c.globalAlpha=.34;shape(c,`M${x-8} ${base}L${x-5} ${base-height}L${x+5} ${base-height-12}L${x+10} ${base}Z`,'#547d82');line(c,[[x,base-height+75],[x-23,base-height+48],[x-37,base-height+44]],'#547d82',5);line(c,[[x+2,base-height+110],[x+27,base-height+70]],'#547d82',4);c.restore();
    }
    // A distant sanctuary belongs to the scenery, not the combat collision plane.
    c.save();c.globalAlpha=.65;
    shape(c,'M419 368L419 253Q420 206 489 167Q558 208 559 253V368H541V256Q536 219 489 190Q443 219 437 256V368Z','#597b80','#789b95',2);
    shape(c,'M432 368V264Q439 221 489 190Q535 221 546 264V368Z','#284e5a');
    for(let i=0;i<7;i++){line(c,[[420,268+i*15],[436,268+i*15]],'#294e5c',2);line(c,[[542,268+i*15],[558,268+i*15]],'#294e5c',2);}
    line(c,[[429,250],[434,229],[450,207],[489,180],[528,207],[545,231],[549,250]],'#acc2ae',1.3);
    shape(c,'M466 361L466 283L489 263L511 283L511 361Z','#547b7a');
    line(c,[[489,278],[489,335]],'#b7cdb3',1);ellipse(c,489,302,10,15,null,'#a4c7bd',1);crystal(c,489,345,.65,'#a8d8d1');
    c.restore();
    tree(c,223,395,.72,false);tree(c,785,404,.81,false);tree(c,87,415,.65,false);tree(c,934,411,.65,false);
    shape(c,'M0 375Q90 359 187 383Q283 366 370 384Q473 363 576 383Q691 365 793 379Q888 359 1000 381V444H0Z','#3b6867');
    // The soft mist sits behind the floor and never obscures the silhouettes.
    const mist=c.createLinearGradient(0,340,0,420);mist.addColorStop(0,'#acd9c100');mist.addColorStop(.6,'#acd9c12a');mist.addColorStop(1,'#acd9c100');c.fillStyle=mist;c.fillRect(0,340,W,80);
    tree(c,17,435,1.12,true);tree(c,991,440,1.15,true);
    bush(c,-2,434,.95,['#173d43','#295c55','#56856b']);bush(c,1010,439,1.03,['#163d43','#2b5f58','#56866c']);
    shape(c,'M0 432Q84 405 185 414Q302 425 407 414Q518 402 615 417Q737 407 849 414Q929 410 1000 433V560H0Z','#244b50');
    shape(c,'M0 431Q147 409 249 424Q384 412 498 418Q652 409 792 421Q910 411 1000 432L1000 458Q842 448 729 453Q569 441 452 453Q281 443 177 455Q72 446 0 463Z','#7b8b74');
    shape(c,'M0 439Q173 423 310 435Q509 422 668 434Q869 422 1000 443V452Q835 436 675 444Q504 433 323 445Q178 435 0 454Z','#acaa87');
    line(c,[[0,429],[97,419],[215,425],[329,420],[438,422],[540,415],[649,422],[752,417],[881,423],[1000,434]],'#c6c5a0',1.2);
    for(let i=0;i<65;i++){const x=18+i*15.7,y=438+(i*13)%35;c.save();c.globalAlpha=.18;ellipse(c,x,y,2+(i%4),.8,'#d7cda2');c.restore();}
    shape(c,'M0 494Q99 466 217 493L362 485Q478 513 594 485Q736 463 857 489Q938 464 1000 481V560H0Z','#153c44');
    shape(c,'M0 533Q118 492 239 528Q369 506 487 537Q662 506 775 527Q899 496 1000 522V560H0Z','#102e39');
    for(let i=0;i<19;i++){const x=(i*67)%1000,y=479+(i%3)*24;local(c,x,y,0,()=>{shape(c,'M-10 7Q-17 -13 -16 -18Q-5 -12 0 3Q-3 -16 6 -26Q11 -10 6 3Q14 -13 25 -12Q15 1 10 9Z',i%2?'#406c59':'#305b52');line(c,[[1,7],[4,-17]],'#73906a',1);},.8+(i%3)*.15);}
    stone(c,105,468,1.1);stone(c,922,460,.95);stone(c,736,490,.55);stone(c,354,481,.4);
    for(const [x,y,s]of[[56,467,.72],[77,474,.5],[871,473,.9],[900,477,.5],[953,497,.65],[208,499,.5]]){glow(c,x,y-12,27,'#9cdce0',.23);mushroom(c,x,y,s);}
    crystal(c,825,404,.9,'#9ed8d6',-.16);crystal(c,845,407,.64,'#b3c9e5',.25);glow(c,833,385,65,'#9bd9d7',.22);
    // Hanging vines frame the upper field but leave the active arena unobstructed.
    for(const [x,y,bend]of[[147,21,13],[178,0,-9],[851,5,12],[883,0,-11]]){c.save();c.strokeStyle='#557e66';c.lineWidth=1.6;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+bend,y+40,x-bend,y+70,x+4,y+113);c.stroke();for(let j=1;j<6;j++)leaf(c,x+(j%2?4:-5),y+j*18,.4,'#6e9677',(j%2?1:-1)*.55);c.restore();}
    c.strokeStyle='#c8c7a51c';c.lineWidth=1;c.strokeRect(13,13,974,534);
  }
  function background(c){
    if(!scenery){const surface=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(W,H):typeof document!=='undefined'?document.createElement('canvas'):null;
      if(surface){surface.width=W;surface.height=H;const sc=surface.getContext('2d');if(sc){buildScenery(sc);scenery=surface;}}
    }
    if(scenery)c.drawImage(scenery,0,0);else buildScenery(c);
  }

  function sword(c,angle,glowing=false){local(c,0,0,angle,()=>{
    shape(c,'M-4 -12L-5 -58L0 -74L6 -58L4 -12Z',gradient(c,-5,0,6,0,[[0,'#7a9eaf'],[.42,'#eff1d8'],[.6,'#bed5d7'],[1,'#668ba3']]),'#476576',.8);
    line(c,[[0,-68],[0,-14]],'#739da8',1);line(c,[[1,-52],[3,-47],[0,-42],[2,-37]],glowing?'#d9f7e7':'#b3d9d7',1);
    shape(c,'M-13 -13L-8 -8L-2 -10L2 -10L9 -7L15 -13L12 -5L5 -3L0 -5L-7 -3L-12 -5Z',palette.gold,'#665e4b',1);
    shape(c,'M-2 -4L3 -4L2 8L-2 8Z','#5b4b3c','#b3a379',1);line(c,[[-2,0],[3,1],[-2,4],[2,5]],'#c9b282',1);
    shape(c,'M-4 9L0 6L5 10L0 14Z','#a8c6bc','#847857',1);ellipse(c,0,-8,2.4,2.4,'#79c9c5');
  });}
  function segment(c,x1,y1,x2,y2,width,color,edge){
    const dx=x2-x1,dy=y2-y1,len=Math.max(.01,Math.hypot(dx,dy)),nx=-dy/len*width/2,ny=dx/len*width/2;
    c.beginPath();c.moveTo(x1+nx,y1+ny);c.lineTo(x2+nx*.75,y2+ny*.75);c.lineTo(x2-nx*.75,y2-ny*.75);c.lineTo(x1-nx,y1-ny);c.closePath();c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=1.1;c.stroke();}
  }
  function leg(c,x,hipY,thigh,shin,front){
    const kx=x+Math.sin(thigh)*18,ky=hipY+Math.cos(thigh)*18,fx=kx+Math.sin(shin)*18,fy=ky+Math.cos(shin)*18;
    segment(c,x,hipY,kx,ky,11,front?'#637c86':'#3c5967',palette.ink);ellipse(c,kx,ky,5.5,4.3,front?'#a3b8b9':'#698c96',palette.ink,.7);
    segment(c,kx,ky,fx,fy,9,front?'#69868e':'#395b67',palette.ink);
    local(c,fx,fy,0,()=>{shape(c,'M-5 -5L5 -5L8 0L13 2L12 6L-6 6Z',front?'#3e4c4e':'#293c43',palette.ink,.9);line(c,[[-3,-3],[4,-3]],palette.gold,1);});
  }
  function arm(c,x,y,a,b,front,weapon,weaponAngle){
    const ex=x+Math.sin(a)*15,ey=y+Math.cos(a)*15,hx=ex+Math.sin(b)*16,hy=ey+Math.cos(b)*16;
    segment(c,x,y,ex,ey,11,front?'#91acb5':'#4f7788',palette.ink);ellipse(c,ex,ey,5,5,front?'#bdcbc5':'#6a929e',palette.ink,1);
    segment(c,ex,ey,hx,hy,9,front?'#7696a3':'#3b6576',palette.ink);ellipse(c,hx,hy,4.5,4.5,'#d4a883','#6f6c60',.8);
    if(weapon)local(c,hx,hy,0,()=>sword(c,weaponAngle,weapon==='magic'));
    return [hx,hy];
  }
  function hero(c,p,time,reduced){
    const aliases={attack_anticipation:'anticipation',attack_swing:'swing',attack_follow:'followthrough',magic_charge:'magiccharge',magic_release:'magicrelease'};
    const pose=aliases[p.pose]||p.pose||'idle',elapsed=Math.max(0,p.poseTime||0),face=p.facing===-1?-1:1;
    const cycle=(reduced?0:time)*13;
    let lean=0,bodyY=0,crouch=0,l1=-.12,l2=.09,r1=.16,r2=-.07,aa=.45,ab=.15,blade=.67,backA=-.25,backB=-.12;
    if(pose==='idle'){bodyY=reduced?0:Math.sin(time*2.5)*1.1;}
    if(pose==='run'){const z=Math.sin(cycle);bodyY=-Math.abs(Math.cos(cycle))*2.5;lean=.09;l1=z*.64;l2=-z*.4;r1=-z*.64;r2=z*.4;aa=.32+z*.45;ab=.4-z*.4;backA=-z*.65;backB=.2+z*.4;blade=.9;}
    if(pose==='anticipation'){const q=ease(elapsed/(p.poseDuration||.065));lean=-.09*q;aa=mix(.45,-2.05,q);ab=mix(.15,-2.45,q);blade=mix(.67,-1.1,q);l1=-.3;r1=.35;bodyY=1.5;}
    if(pose==='swing'){const q=ease(elapsed/(p.poseDuration||.12));lean=.14;aa=mix(-2.05,1.15,q);ab=mix(-2.45,.9,q);blade=mix(-1.1,2.02,q);l1=-.3;r1=.44;r2=-.25;backA=-.55;bodyY=-1;}
    if(pose==='followthrough'){const q=ease(elapsed/(p.poseDuration||.14));lean=mix(.14,0,q);aa=mix(1.15,.45,q);ab=mix(.9,.15,q);blade=mix(2.02,.67,q);l1=-.3+q*.18;r1=.44-q*.28;}
    if(pose==='dodge'){crouch=11;lean=.3;l1=-.9;l2=.75;r1=1;r2=-.6;aa=-.65;ab=-1.2;blade=-1.7;backA=.8;backB=1.5;bodyY=3;}
    if(pose==='magiccharge'){const q=clamp(elapsed/.45);lean=-.08;aa=.3;ab=.6;blade=1.1;backA=-1.05;backB=1.6;bodyY=reduced?0:-Math.sin(q*Math.PI)*1.5;}
    if(pose==='magicrelease'){lean=.12;aa=.4;ab=.7;blade=1.2;backA=1.1;backB=1.7;l1=-.35;r1=.4;}
    if(pose==='hit'){lean=-.17;bodyY=2;aa=-.2;ab=.7;blade=.2;backA=-.6;l1=-.4;r1=.5;}
    if(pose==='victory'){lean=-.04;aa=-2.7;ab=-2.95;blade=.12;backA=-.2;bodyY=reduced?0:Math.sin(time*2)*.6;}
    if(pose==='defeat'){crouch=15;lean=.38;l1=-1.15;l2=1;r1=1.1;r2=-.4;aa=.4;ab=1.2;blade=1.75;backA=.4;backB=1.4;bodyY=6;}
    const invulnerable=!!p.invulnerable||p.invuln>0;
    ellipse(c,p.x,FLOOR+5,24+(pose==='dodge'?8:0),6,'#071f2d70');
    if(pose==='dodge'&&!reduced){for(let i=1;i<=3;i++){c.save();c.globalAlpha=.12*(1-i/4);local(c,p.x-face*i*19,p.y||FLOOR,lean,()=>shape(c,'M-24 -68Q-12 -94 7 -83L19 -58L25 -18L-4 -12L-25 -25Z','#b2efdf'),face,1);c.restore();}}
    if(invulnerable){ellipse(c,p.x,FLOOR+3,30,8,null,'#b4f0df',1.4);glow(c,p.x,(p.y||FLOOR)-47,68,'#9cdfdc',.13);}
    local(c,p.x,p.y||FLOOR,0,()=>{
      if(pose==='defeat')c.globalAlpha*=.78;
      local(c,0,bodyY,lean,()=>{
        // The cape is a deforming cloth layer, not part of a flattened actor image.
        const trail=pose==='run'||pose==='dodge'?12:pose==='swing'?8:0,wave=reduced?0:Math.sin(time*5)*3;
        c.beginPath();c.moveTo(-10,-72+crouch);c.bezierCurveTo(-29,-67+crouch,-37-trail,-44+crouch,-35-trail+wave,-13+crouch);c.lineTo(-14-wave,-19+crouch);c.lineTo(5,-27+crouch);c.quadraticCurveTo(-7,-51+crouch,-10,-72+crouch);c.fillStyle=gradient(c,-30,-70,0,-10,[[0,'#4f9699'],[.45,'#286471'],[1,'#173d56']]);c.fill();c.strokeStyle='#173847';c.lineWidth=1.3;c.stroke();
        line(c,[[-17,-64+crouch],[-26-trail*.6,-41+crouch],[-26-trail+wave,-19+crouch]],'#81b3a9',1.1);
        line(c,[[-10,-60+crouch],[-15,-31+crouch],[-11,-22+crouch]],'#477f83',1);
        leg(c,-5,-35+crouch,l1,l2,false);
        arm(c,-9,-68+crouch,backA,backB,false,false,0);
        leg(c,7,-35+crouch,r1,r2,true);
        shape(c,`M-12 ${-70+crouch}L7 ${-74+crouch}L16 ${-62+crouch}L12 ${-36+crouch}L-10 ${-36+crouch}L-17 ${-54+crouch}Z`,gradient(c,-15,-70,18,-30,[[0,'#d0d9cb'],[.36,'#9db8bc'],[.6,'#6c96a3'],[1,'#395f77']]),palette.ink,1.4);
        line(c,[[-7,-65+crouch],[1,-54+crouch],[9,-65+crouch]],'#e8e3bd',1.2);line(c,[[1,-55+crouch],[1,-43+crouch]],'#c6cfb4',1);
        shape(c,`M-13 ${-42+crouch}L14 ${-42+crouch}L15 ${-35+crouch}L-12 ${-34+crouch}Z`,'#5d5240',palette.ink,1);
        local(c,2,-38+crouch,0,()=>{shape(c,'M-4 -4H4V4H-4Z',palette.gold);shape(c,'M-2 -2H2V2H-2Z','#3b585c');});
        shape(c,`M-11 ${-34+crouch}L-13 ${-25+crouch}L-2 ${-22+crouch}L0 ${-33+crouch} M3 ${-34+crouch}L5 ${-22+crouch}L17 ${-26+crouch}L13 ${-34+crouch}Z`,'#6f95a0',palette.ink,1);
        local(c,0,-79+crouch,pose==='hit'?-.12:pose==='defeat'?.25:0,()=>{
          shape(c,'M-7 -12Q-11 -28 3 -28Q15 -25 12 -8L7 2L-3 2Z','#d8ae88','#4a5360',1);
          shape(c,'M-8 -12Q-15 -26 -2 -32Q11 -37 16 -24L14 -13L10 -21L3 -21L-2 -16Z','#4c4038',palette.ink,1);
          shape(c,'M-11 -20Q-12 -34 1 -35Q12 -35 16 -24L9 -26L0 -24Z','#a7c0c5',palette.ink,1);
          shape(c,'M-1 -34L3 -42L6 -34L5 -26Z','#4d9caa','#31596e',.7);line(c,[[-8,-26],[0,-29],[10,-28]],'#e4e1bf',1);
          line(c,[[6,-14],[10,-14]],'#263c47',1.5);line(c,[[12,-10],[15,-8],[12,-6]],'#ad896c',.9);
          line(c,[[7,-2],[11,-3]],pose==='hit'?'#7f584b':'#91624e',.8);
          shape(c,'M-9 0L8 1L11 7L-5 8L-11 5Z','#4f8e8c',palette.ink,.8);line(c,[[-5,4],[5,5]],'#a5c6b0',.8);
        });
        // Front shoulder and weapon arm are separately articulated for every attack phase.
        ellipse(c,12,-67+crouch,9,7,'#afc3bf',palette.ink,1.3);line(c,[[6,-69+crouch],[15,-71+crouch],[19,-67+crouch]],'#d7d4aa',1);
        arm(c,13,-66+crouch,aa,ab,true,pose.startsWith('magic')?'magic':true,blade);
        if(pose==='magiccharge'||pose==='magicrelease'){
          const q=pose==='magiccharge'?clamp(elapsed/.45):1,ox=pose==='magicrelease'?38:19,oy=-62+crouch;
          glow(c,ox,oy,35+q*15,'#ffd492',.4);ellipse(c,ox,oy,5+q*4,5+q*4,'#f5e7ba');ellipse(c,ox,oy,11+q*6,11+q*6,null,'#dcb879',1.2);
          for(let i=0;i<5;i++){const a=i*TAU/5+(reduced?0:time*2);ellipse(c,ox+Math.cos(a)*21,oy+Math.sin(a)*21,1.3,1.3,'#fff2c7');}
        }
      });
    },face,1);
    if(pose==='hit'){glow(c,p.x,(p.y||FLOOR)-55,42,'#f0aa91',.18);}
    if(pose==='swing'){
      const q=clamp(elapsed/(p.poseDuration||.12));c.save();c.globalAlpha=.72*Math.sin(q*Math.PI);local(c,p.x,p.y||FLOOR,0,()=>{c.strokeStyle='#e5f7dd';c.lineWidth=6;c.beginPath();c.ellipse(20,-55,76,64,0,-1.6+q*.2,1.2+q*.2);c.stroke();c.strokeStyle='#79d3d1';c.lineWidth=2;c.beginPath();c.ellipse(20,-55,83,70,0,-1.55,1.1);c.stroke();},face,1);c.restore();
    }
  }

  function attackDuration(enemy){
    return enemy.attackDuration||({jump:.55,rush:.42,heavy_jump:.62,triple_bounce:.32,crystal_charge:.52})[enemy.pattern]||.5;
  }
  function telegraph(c,e,time,reduced){
    if(e.ai!=='TELEGRAPH'&&!(e.ai==='ATTACK'&&e.pattern!=='rush'&&e.pattern!=='crystal_charge'))return;
    const boss=e.kind==='boss',target=Number.isFinite(e.attackTargetX)?e.attackTargetX:e.x;
    const radius=({jump:46,rush:42,heavy_jump:70,triple_bounce:54,crystal_charge:58})[e.pattern]||(boss?70:46);
    const alpha=e.ai==='ATTACK'?.28:reduced?.55:.4+.13*Math.sin(time*12);
    c.save();c.globalAlpha=alpha;ellipse(c,target,FLOOR+2,radius,11,'#e77e653e','#f3ad89',2);
    line(c,[[target-radius+8,FLOOR+2],[target+radius-8,FLOOR+2]],'#f8b38d',1.2);
    for(let i=-1;i<=1;i++)line(c,[[target+i*17-4,FLOOR-4],[target+i*17,FLOOR],[target+i*17+4,FLOOR-4]],'#ffe1a2',1.6);
    if(e.pattern==='rush'||e.pattern==='crystal_charge'){
      const dir=target>=e.x?1:-1;line(c,[[e.x,FLOOR+7],[target,FLOOR+7]],'#d8b57e',2);line(c,[[target-dir*12,FLOOR],[target,FLOOR+7],[target-dir*12,FLOOR+14]],'#f5d59d',2);
    }
    c.restore();
  }
  function slime(c,e,time,reduced){
    const boss=e.kind==='boss',size=boss?1.75:1.04,ai=e.ai||'IDLE',t=e.aiTime||0,phase2=e.phase===2;
    let sx=1,sy=1,lift=0,tilt=0,opacity=1;
    if(ai==='IDLE'){sx=1+(reduced?0:Math.sin(time*3)*.025);sy=1-(sx-1)*.7;}
    if(ai==='APPROACH'){const b=Math.abs(Math.sin(t*5));lift=reduced?0:b*12;sx=1+(1-b)*.08;sy=1-(1-b)*.09;}
    if(ai==='TELEGRAPH'){const q=clamp(t/(t+(e.telegraphRemaining||.3)));sx=1+.24*q;sy=1-.27*q;tilt=e.pattern==='crystal_charge'?(e.facing===-1?-.04:.04):0;}
    if(ai==='ATTACK'){
      const q=clamp(Number.isFinite(e.attackProgress)?e.attackProgress:t/attackDuration(e));
      if(e.pattern==='rush'||e.pattern==='crystal_charge'){sx=1.19;sy=.87;tilt=(e.facing===-1?-1:1)*.08;}
      else{lift=Number.isFinite(e.lift)?e.lift:Math.sin(q*Math.PI)*(boss?(e.pattern==='heavy_jump'?126:72):74);sx=.9+.08*Math.sin(q*Math.PI);sy=1.11-.05*Math.sin(q*Math.PI);}
    }
    if(ai==='RECOVERY'){const q=clamp(t/.35);sx=mix(1.2,1,q);sy=mix(.75,1,q);}
    if(ai==='HIT_REACTION'){sx=1.15;sy=.79;tilt=(e.facing===-1?1:-1)*.09;}
    if(ai==='DEFEATED'){const q=clamp(t/.7);sx=1+q*.35;sy=1-q*.86;opacity=1-q;}
    ellipse(c,e.x,FLOOR+5,(boss?48:31)*(1-lift/450),boss?9:6,'#08253066');
    c.save();c.globalAlpha=opacity;
    local(c,e.x,(e.y||FLOOR)-lift,tilt,()=>{
      const body=gradient(c,-28,-61,25,3,[[0,boss?'#b7d5a0':'#c1df8d'],[.3,boss?'#81bd97':'#8fc96b'],[.7,boss?'#4c9f8b':'#50a771'],[1,boss?'#3a7c83':'#3b8070']]);
      shape(c,'M-37 -5Q-43 -24 -30 -40Q-24 -65 -3 -65Q18 -68 29 -47Q46 -30 39 -10Q28 5 2 3Q-25 6 -37 -5Z',body,boss?'#b3d5ad':'#a2c789',1.15);
      shape(c,'M-33 -13Q-23 -3 -3 -7Q22 -9 34 -21Q39 -7 21 -3L-18 -1Z',boss?'#4b8d8b':'#549c70');
      shape(c,'M-27 -39Q-22 -55 -7 -57Q1 -58 6 -54Q-15 -51 -19 -35Z','#e4efba');
      ellipse(c,-25,-23,3,7,'#c7e9ad');ellipse(c,20,-11,5,2.4,'#d2e6a0');ellipse(c,25,-35,2,3,'#c1dca2');
      if(boss){
        glow(c,1,-32,30,phase2?'#e9c6ec':'#b2e7e4',.4);
        local(c,0,-14,0,()=>crystal(c,0,0,.62,phase2?'#c3b3e0':'#a8dae0'));
        ellipse(c,1,-31,12,15,null,phase2?'#e7d6e7':'#d5ecd0',.7);
        line(c,[[-8,-31],[1,-42],[10,-31],[1,-20],[-8,-31]],'#e9e9c1',.65);
      }
      const look=(e.facing===-1?-1:1)*2,ey=boss?-38:-30;
      ellipse(c,-13+look,ey,4.6,boss?6:7,'#193e4a');ellipse(c,13+look,ey,4.6,boss?6:7,'#193e4a');ellipse(c,-14+look,ey-2,1.2,1.8,'#f0edcc');ellipse(c,12+look,ey-2,1.2,1.8,'#f0edcc');
      if(ai==='TELEGRAPH'||ai==='ATTACK'||phase2){line(c,[[-20,ey-10],[-9,ey-6]],'#3d6655',2);line(c,[[8,ey-6],[20,ey-10]],'#3d6655',2);}
      if(ai==='HIT_REACTION'){line(c,[[-4,-18],[0,-23],[4,-18],[0,-13],[-4,-18]],'#2a5860',1.4);}
      else{c.beginPath();c.moveTo(-6,-17);c.quadraticCurveTo(0,ai==='ATTACK'?-22:-10,7,-17);c.strokeStyle='#2c5c60';c.lineWidth=1.6;c.stroke();}
      if(boss){local(c,0,-63,ai==='DEFEATED'?.2:reduced?0:Math.sin(time*2)*.02,()=>{
        shape(c,'M-24 -3L-28 -24L-15 -17L-7 -32L3 -19L14 -31L20 -15L31 -22L25 -2Z','#b6a276','#586f65',1.2);
        shape(c,'M-20 -5L-23 -17L-14 -12L-7 -24L2 -13L13 -23L18 -10L25 -15L21 -5Z','#dfca8d');line(c,[[-23,-1],[25,-1]],'#f3e1a8',2);
        crystal(c,2,-5,.3,phase2?'#dabce0':'#93cbd5');ellipse(c,-15,-6,2,2,'#83b7b4');ellipse(c,17,-6,2,2,'#83b7b4');
      });}
      if(ai==='TELEGRAPH'&&e.pattern==='crystal_charge'){ellipse(c,0,-31,43,43,null,'#d8d5f3',1.5);for(let i=0;i<5;i++){const a=i*TAU/5+(reduced?0:time*3);ellipse(c,Math.cos(a)*42,-31+Math.sin(a)*42,2,2,'#e0e9ef');}}
    },size*sx,size*sy);
    c.restore();
  }

  const effectDuration={slash:.22,impact:.3,damage:.85,dodge:.32,fire:.65,burst:.8,shockwave:.55,charge:.6};
  function effects(c,state,time,reduced){
    for(const f of (state.effects||[]).slice(-48)){
      const duration=f.ttl||f.initialLife||effectDuration[f.type]||.6,q=clamp(1-(f.life||0)/duration),a=1-q;
      const x=f.x??500,y=f.y??FLOOR;
      c.save();c.globalAlpha=a;
      if(f.type==='damage'){
        const yy=(y>FLOOR-20?y-75:y)-(reduced?8:q*30),value=typeof f.value==='number'?Math.round(f.value):f.value||'';
        c.font='700 25px Georgia, serif';c.textAlign='center';c.lineJoin='round';c.strokeStyle='#122d3d';c.lineWidth=4;c.strokeText(String(value),x,yy);c.fillStyle=(f.target==='player'||Number(f.value)<0)?'#efb19a':'#f3e8b8';c.fillText(String(value),x,yy);
      }else if(f.type==='impact'){
        const yy=y>FLOOR-15?y-35:y;
        for(let i=0;i<7;i++){const angle=i*TAU/7+.25,r=9+q*27;line(c,[[x+Math.cos(angle)*r*.35,yy+Math.sin(angle)*r*.35],[x+Math.cos(angle)*r,yy+Math.sin(angle)*r]],i%2?'#d6efdd':'#e9c68b',2);}
        ellipse(c,x,yy,4+a*4,4+a*4,'#f3f0c8');
      }else if(f.type==='fire'||f.type==='burst'){
        const yy=y>FLOOR-20?y-43:y,rad=18+ease(q)*(f.type==='burst'?80:58);
        glow(c,x,yy,rad*1.4,'#efc681',.46);ellipse(c,x,yy,rad,rad*.75,null,'#e6c790',2+a*2);ellipse(c,x,yy,rad*.68,rad*.5,null,'#a9dddb',1.5);
        for(let i=0;i<12;i++){const angle=i*TAU/12+.3,r=rad*(.5+q);const xx=x+Math.cos(angle)*r,y2=yy+Math.sin(angle)*r*.7;local(c,xx,y2,angle,()=>shape(c,'M-3 0L0 -9L3 0L0 5Z',i%2?'#efdeb0':'#b5dfd7'),.6+a*.7);}
        if(f.type==='fire'&&state.player){const px=state.player.x+state.player.facing*25;line(c,[[px,FLOOR-65],[(px+x)/2,yy-16],[x,yy]],'#f2d898',a*4+.5);}
      }else if(f.type==='shockwave'){
        const rad=12+q*105;ellipse(c,x,FLOOR+3,rad,rad*.15,null,'#d5d9bd',2);ellipse(c,x,FLOOR+5,rad*.8,rad*.11,null,'#8bbcb9',1);
      }else if(f.type==='charge'){
        const yy=y>FLOOR-20?y-65:y;ellipse(c,x,yy,28-q*13,28-q*13,null,'#e3d2ac',1.3);glow(c,x,yy,38,'#e4c790',.2);
      }else if(f.type==='slash'){
        const dir=f.facing||state.player?.facing||1;local(c,x,y>FLOOR-20?y-45:y,0,()=>{c.beginPath();c.ellipse(0,0,30+q*23,37+q*18,.4,-1.1,1.1);c.strokeStyle='#d6eee0';c.lineWidth=a*4+.5;c.stroke();},dir,1);
      }else if(f.type==='dodge'){ellipse(c,x,FLOOR+3,18+q*30,5,null,'#9bd6ce',1.2);}
      c.restore();
    }
  }
  function draw(ctx,state={},visualTime=0,settings={}){
    if(!ctx)return;
    const t=Number.isFinite(visualTime)?visualTime:0,reduced=!!settings.reducedMotion;
    ctx.save();ctx.clearRect(0,0,W,H);ctx.fillStyle='#102e39';ctx.fillRect(0,0,W,H);
    const shake=!reduced&&settings.shake!==false?Math.min(4.5,(state.shake||0)*15):0;
    if(shake)ctx.translate(Math.sin(t*73)*shake,Math.cos(t*59)*shake*.55);
    background(ctx);
    if(!reduced){for(let i=0;i<17;i++){const x=100+(i*137)%811+Math.sin(t*.6+i)*11,y=125+(i*71)%259+Math.sin(t*.7+i*2)*7;ctx.save();ctx.globalAlpha=.2+.35*(.5+.5*Math.sin(t*1.4+i));ellipse(ctx,x,y,1.3,1.3,i%3?'#d1e6c1':'#9bdee5');ctx.restore();}}
    if(state.stage==='crystal'){
      const bob=reduced?0:Math.sin(t*2)*4;
      glow(ctx,550,345+bob,78,'#b5e8de',.45);
      ellipse(ctx,550,FLOOR+2,38,8,null,'#b8d7be',1);
      local(ctx,550,367+bob,0,()=>{crystal(ctx,0,0,1.25,'#bce5dd');ellipse(ctx,0,-24,32,39,null,'#b3dcd1',.8);});
    }
    if(state.enemy)telegraph(ctx,state.enemy,t,reduced);
    if(state.player)hero(ctx,state.player,t,reduced);
    if(state.enemy)slime(ctx,state.enemy,t,reduced);
    effects(ctx,state,t,reduced);
    ctx.restore();
  }
  return {draw,width:W,height:H,ground:FLOOR};
})();
