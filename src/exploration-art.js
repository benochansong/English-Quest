// Original vector environments and small articulated actors. Coordinates are world units.
// Art is decorative; all labels, hit targets, puzzle rules and collision belong to the renderer/engine.
const ExploreArt = (() => {
  let serial = 0;
  const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const l = (d, color, w = 1, alpha = 1) => p(d, 'none', `stroke="${color}" stroke-width="${w}" opacity="${alpha}" stroke-linecap="round" stroke-linejoin="round"`);
  const c = (x, y, r, fill, alpha = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${alpha}"/>`;
  const e = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  const r = (x, y, w, h, fill, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
  const g = (x, y, body, scale = 1, angle = 0) => `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${body}</g>`;
  const many = (n, fn) => Array.from({length:n}, (_, i) => fn(i)).join('');
  const ink = '#182c37', gold = '#cfb886', cream = '#e9e5c8';
  const rim = (color = ink, w = 1.3) => `stroke="${color}" stroke-width="${w}" stroke-linejoin="round"`;
  const grad = (id, a, b, d) => `<linearGradient id="${id}" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></linearGradient>`;
  const halo = (id, color) => `<radialGradient id="${id}"><stop stop-color="${color}" stop-opacity=".38"/><stop offset=".5" stop-color="${color}" stop-opacity=".12"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  const url = id => `url(#${id})`;
  const palette = {
    vanguard:{cape:'#356386', fold:'#24405d', rim:'#91bfd3', armor:'#aabac0', skin:'#d7aa85', hair:'#60453a', gem:'#a2dfe4'},
    arcanist:{cape:'#63578c', fold:'#393c66', rim:'#b4a2d8', armor:'#776b9e', skin:'#d7aa85', hair:'#60453a', gem:'#c5b7f2'},
    pathfinder:{cape:'#4d7458', fold:'#2b5145', rim:'#a4bd8b', armor:'#896e51', skin:'#d7aa85', hair:'#60453a', gem:'#c7db9a'},
    mira:{cape:'#6864a3', fold:'#354d7c', rim:'#aebfea', armor:'#537caa', skin:'#e3b99a', hair:'#303d62', gem:'#a3e0f5'},
    bram:{cape:'#587c55', fold:'#2c4e42', rim:'#b5c894', armor:'#8b704e', skin:'#c8946b', hair:'#6c4f34', gem:'#c7dd9c'}
  };

  function crystal(x, y, scale = 1, color = 'blue', tilt = 0) {
    const colors = {blue:['#a2e9ee','#4aa3bf','#2e627e'],green:['#b7e5b9','#61a88a','#35645f'],red:['#f5bcb4','#c9708b','#764d75'],violet:['#dbcbf5','#9b83c7','#585881'],gold:['#f9e5a8','#bdac66','#77724d'],amber:['#f6dca1','#bd9159','#6e6653']};
    const k = colors[color] || colors.blue;
    return g(x,y,`${p('M-10 -5l-2 -24 10 -16 11 13 4 24L3 2Z',k[1],rim(k[2],1))}${p('M-2 -45l1 33 4 14 -13 -7 -2 -24Z',k[0])}${p('M-1 -12l10 -20 4 24L3 2Z',k[2])}${l('M-2 -44l1 32 13 4 M-11 -29l10 17 -8 7',k[0],.8,.9)}`,scale,tilt);
  }
  function mushrooms(x,y,scale=1) {
    return g(x,y,`${p('M-7 1l1 -10 3 -1 -1 11 M5 1l-1 -6 2 -1 1 7Z','#c7d8b8')}${p('M-13 -8q6 -15 14 -1 -7 4 -14 1Z','#8bc6bb',rim('#3f756e',.7))}${p('M0 -5q6 -10 10 0 -6 3 -10 0Z','#b0dbd0',rim('#3f756e',.7))}${c(-8,-10,1.2,'#dce9be')}${c(5,-7,.8,'#e7f6d8')}` ,scale);
  }
  function tuft(x,y,scale=1,color='#4c7868') {
    return g(x,y,p('M-10 3q3 -9 2 -13 8 6 8 11 0 -11 4 -15 1 8 -1 13 5 -8 10 -8 -3 8 -8 12Z',color),scale);
  }
  function stone(x,y,scale=1,color='#60767b') {
    return g(x,y,`${e(0,3,19,8,'#102d37','opacity=".38"')}${p('M-18 1l5 -15 17 -4 15 11 -5 12 -21 2Z',color,rim('#354d58',.8))}${p('M-13 -14l17 -4 15 11 -20 2Z','#879a99','opacity=".55"')}${l('M-12 -13l10 9 -5 10 M-2 -4l19 -3','#c3c8ac',1,.4)}`,scale);
  }
  function tree(x,y,scale=1,variant=0) {
    const tint = variant%2 ? ['#254b51','#386267','#547d79'] : ['#214550','#315862','#507578'];
    return g(x,y,`${e(5,7,43,15,'#0a1c2b','opacity=".48"')}${p('M-25 5l13 -10 3 -37 -11 -24 9 8 9 14 7 -21 10 -9 -11 28 7 37 18 17 -26 -6 -9 10 -5 -8Z','#42575a',rim('#1c373f',1.4))}${l('M-6 -41l1 31 -6 12 M6 -34l3 25 10 12 M-13 -16l6 7','#7a8981',1.5,.65)}
      ${p('M-40 -45q-19 -10 -9 -29 -13 -21 9 -30 -4 -21 21 -24 15 -24 34 -6 29 -5 33 20 24 3 22 25 13 14 -1 30 -4 22 -31 20 -22 18 -43 -2Z',tint[0],rim('#183844',1.1))}
      ${p('M-46 -75q-6 -16 14 -24 -5 -20 17 -23 17 -20 31 -4 23 -7 27 19 20 1 20 21 -18 -4 -27 6 -15 -13 -33 0 -27 -7 -49 5Z',tint[1])}
      ${p('M-36 -94q6 -13 24 -11 2 -17 23 -17 12 0 17 15 -20 -9 -29 8 -13 -5 -35 5Z',tint[2])}
      ${l('M-42 -70q12 -12 25 -5 M4 -58q15 -10 27 -5 M30 -92q8 -4 16 1 M-25 -112q8 -4 13 0','#91b6a1',1.3,.4)}
      ${many(5,i=>e(-27+i*13,-75+(i%2)*20,4,1.5,'#7ca6a0','opacity=".36"'))}`,scale);
  }
  function column(x,y,scale=1,broken=false) {
    return g(x,y,`${e(0,4,24,9,'#162b39','opacity=".5"')}${p('M-23 0v-7l20 -7 26 7v8L0 9Z','#6d7d82',rim('#344d5a'))}${p('M-15 -9v-58l15 -7 15 7v58L0 -3Z','#8b9b9c',rim('#3e5664'))}${p('M0 -73l15 6v58L0 -3Z','#5a717d')}${l('M-10 -16v-48 M-5 -12v-52 M5 -14v-51','#c1c4b0',1,.6)}${broken?p('M-17 -64l4 -10 8 5 6 -13 6 7 11 3 -2 9 -16 5Z','#a7b1a9',rim('#45616b')):p('M-21 -68v-12l22 -7 20 7v12L0 -61Z','#9baaa5',rim('#45616b'))}${p('M-17 -20q9 -17 10 -30l5 -9 -2 22 -7 20Z','#476f62')}`,scale);
  }

  function actor(id, direction = 'down') {
    id=Object.hasOwn(palette,id)?id:'vanguard';
    const k=palette[id], mage=id==='mira'||id==='arcanist', ranger=id==='bram'||id==='pathfinder';
    const dir=['up','down','left','right'].includes(direction)?direction:'down', side=dir==='left'||dir==='right', back=dir==='up';
    const legs=`<g class="eq-leg-left">${p('M-7 -13l5 1 -1 10 -6 1 -1 -3Z','#40505b',rim(ink,.7))}${p('M-8 -4l5 0 1 4 -8 0Z','#393c3c',rim(ink,.7))}</g><g class="eq-leg-right">${p('M2 -12l5 -1 2 10 -6 1Z','#40505b',rim(ink,.7))}${p('M3 -4l5 -1 3 4 -8 1Z','#393c3c',rim(ink,.7))}</g>`;
    const staff=mage?`<g class="eq-staff">${l('M15 -2L14 -39','#d4b584',2.3)}${p('M10 -37l-1 -7 5 -6 6 6 -2 7 -4 2Z',k.rim,rim('#3c4d68',.8))}${c(14,-43,3.5,k.gem)}${l('M14 -48v10 M10 -43h8','#edf7e9',.7)}</g>`:'';
    const bow=ranger?`${l('M13 -34q18 17 1 32','#bba779',2.4)}${l('M13 -34l1 32','#dcd5b0',.6)}${p('M10 -32l-3 -7 4 0 3 7Z','#c1cfb2')}`:'';
    const sword=!mage&&!ranger?`${p('M14 -9l-1 -22 3 -5 3 5 -2 22Z','#b7c9ca',rim('#3c5967',.6))}${l('M16 -32v22','#e3e8d4',.7)}${l('M11 -10h10 M16 -9v7',gold,2)}`:'';
    const backGear=ranger?`${p('M-11 -32l5 -2 10 23 -6 3Z','#78613e',rim(ink,.8))}${l('M-6 -29l-6 -11 M-3 -29l-5 -12','#dfcdb0',1.1)}${p('M-13 -39l-1 -5 4 3 M-9 -40l0 -5 3 4Z','#a8b98a')}`:'';
    const cape=side?'M-5 -34q-8 10 -6 24l11 -4 5 -15Z':'M-10 -32q-3 10 -5 22l14 3 15 -4 -5 -21Z';
    const body=side?'M-7 -31l12 -2 5 20 -15 2Z':'M-8 -31l15 0 4 19 -21 0Z';
    const face=side?`${e(1,-38,7.2,8.1,k.skin,rim(ink,.8))}${p('M-6 -39q-3 -11 7 -10 9 0 7 8l-5 -2 -3 4Z',k.hair)}${p('M7 -39l3 4 -3 1Z',k.skin)}${l('M5 -39h1',ink,1.2)}${l('M5 -33h2','#9e6e59',.7)}`:`${e(0,-39,8,8.8,k.skin,rim(ink,.9))}${p('M-8 -38q-3 -13 7 -13 12 0 10 13l-4 -7 -5 3 -4 -1Z',k.hair)}${l('M-4 -39h1 M3 -39h1',ink,1.4)}${l('M-2 -34q2 2 4 0','#a57563',.7)}`;
    const hood=mage||ranger?`${p(side?'M-7 -38q-4 -14 6 -16 13 3 10 16l-5 -9 -9 2Z':'M-10 -36q-4 -15 10 -19 14 4 11 19l-5 -10 -7 -1 -6 6Z',k.cape,rim(k.fold,.8))}${l(side?'M-5 -46q6 -7 10 1':'M-6 -45l6 -5 7 6',k.rim,.8,.7)}`:`${p(side?'M-7 -41q-1 -12 8 -11 10 2 9 12l-5 -5 -11 4Z':'M-9 -40q-2 -13 9 -14 12 1 11 14l-10 -5Z','#a4b8c1',rim('#365166',1))}${p(side?'M-1 -52l1 -5 3 1 2 6Z':'M-2 -54l2 -4 3 4 -1 10Z',k.rim)}${l('M-7 -42l7 -5 8 5','#e1e5d4',.8)}`;
    const head=back?`${p('M-10 -36q-3 -15 10 -19 13 3 11 19l-11 6Z',mage||ranger?k.cape:'#94aebb',rim(k.fold,.9))}${l('M0 -51v19',k.rim,1,.5)}`:`${face}${hood}`;
    const offhand=!mage&&!ranger&&!back?`${p('M-16 -29l9 -2 6 5 -4 13 -7 -3Z','#729bac',rim('#c0c9b7',1))}${l('M-10 -28l1 11 M-13 -23l7 -1','#d8d7b5',1.1)}`:'';
    const inner=`${backGear}<g class="eq-cape">${p(cape,k.cape,rim(k.fold,.9))}${l(side?'M-7 -29l-1 16':'M-7 -27l-3 16 M6 -26l4 14',k.rim,.8,.5)}</g>${legs}<g class="eq-body">${p(body,k.armor,rim(ink,.9))}${mage?p('M-8 -24l-4 14 22 0 -4 -16Z',k.cape,rim(k.fold,.7)):''}${l('M-7 -18l15 0',gold,1.4)}${p('M-1 -21h4v5h-4Z',gold)}${!back?l('M-5 -29l4 6 6 -6',k.rim,1):''}<g class="eq-arm-left">${p('M-10 -29l-4 10 3 4 4 -4 3 -9Z',k.cape,rim(ink,.7))}${c(-11,-16,2.6,k.skin)}${offhand}</g><g class="eq-arm-right">${p('M9 -28l5 9 -2 4 -4 -2 -3 -10Z',k.cape,rim(ink,.7))}${c(12,-16,2.6,k.skin)}${staff}${bow}${sword}</g><g class="eq-head">${head}</g>${!back?c(0,-29,1.7,k.gem):''}</g>`;
    return `<g class="eq-actor-art eq-${id in palette?id:'vanguard'} eq-facing-${dir}">${e(0,1,13,5,'#081c28','opacity=".44"')}<g${dir==='left'?' transform="scale(-1 1)"':''}>${inner}</g></g>`;
  }

  function portrait(name) {
    const id=name==='bram'?'bram':'mira', k=palette[id], uid=`eqp${++serial}`, mage=id==='mira';
    const face= mage ?
      `${p('M60 87q-15 -47 9 -58 33 -24 57 6 11 14 5 49l-18 21 -48 -5Z',k.hair,rim('#24304d',1.8))}${p('M72 59q10 -21 34 -11l14 17 -3 27q-7 20 -22 21 -20 -4 -26 -23Z',k.skin,rim('#886b6c',1))}${p('M68 73q-9 -17 6 -33 26 -20 45 8l4 24 -12 -19q-11 14 -33 12Z',k.hair)}${p('M61 60q0 34 12 43l-12 21 -7 -34Z','#3c4971')}${p('M118 64q-2 32 7 49l10 -17 -6 -36Z','#3c4971')}${l('M76 77q7 -5 12 0 M100 77q7 -4 12 1','#4e4965',2)}${e(83,80,2.8,3.8,'#526f94')}${e(106,80,2.8,3.8,'#526f94')}${c(83.5,79,1,cream)}${c(106.5,79,1,cream)}${l('M96 82l-2 9 4 1','#b98278',1)}${l('M85 98q9 6 18 -1','#a96d76',1.8)}${e(77,89,5,2,'#da9c91','opacity=".55"')}${e(110,89,5,2,'#da9c91','opacity=".55"')}` :
      `${p('M61 57q-2 -24 25 -29 31 -9 43 20l-4 39 -12 19 -49 -11Z',k.hair,rim('#3b4237',1.5))}${p('M71 57l38 -6 14 17 -5 31 -18 16 -24 -9 -12 -24Z',k.skin,rim('#8d684c',1))}${p('M64 71q-9 -18 11 -31 22 -13 40 1l9 23 -14 -10 -13 10 -13 -5 -13 16Z',k.hair)}${p('M71 86l7 17 20 8 18 -12 -1 -10 -9 9 -18 0 -8 -9Z','#71523d','opacity=".65"')}${l('M76 76q6 -4 12 -1 M101 73q7 -4 13 0','#674b36',2.5)}${e(83,79,2.7,3,'#364c42')}${e(108,77,2.7,3,'#364c42')}${c(83.5,78,.8,cream)}${c(108.5,76,.8,cream)}${l('M96 80l-2 10 5 0','#986a4a',1.2)}${l('M86 97q8 5 17 -2','#704a38',1.7)}`;
    const prop=mage?`${l('M155 182L156 54','#bdad7c',6)}${l('M154 177L154 58','#eee0ae',1.5)}${p('M146 55l-8 -17 18 -22 16 22 -9 19 -8 5Z','#7f92c4',rim('#c7c9e1',1.8))}${p('M155 20l-7 20 7 15 8 -18Z','#b4e5ec')}${c(155,39,20,url(uid+'light'))}${l('M144 37l22 2 M155 22l-1 30','#f0f0d4',.9)}`:`${l('M151 169q41 -65 4 -127','#bdab77',5)}${l('M155 42l-4 127','#e6d9ad',1)}${l('M149 80L137 34 M143 80l-9 -46','#c8b794',2)}${p('M135 37l-9 -11 7 1 5 10 M140 37l-1 -15 6 7 -2 10Z','#a6bf94')}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="eq-portrait eq-portrait-${id}" viewBox="0 0 200 200" role="img" aria-label="${mage?'미라 — 푸른 로브의 견습 마법사':'브람 — 초록 망토의 숲 순찰자'}"><defs>${grad(uid+'sky',mage?'#253e61':'#2b4a48',mage?'#3f4b71':'#405b4d','#172c3a')}${grad(uid+'cloth',k.rim,k.cape,k.fold)}${halo(uid+'light',k.gem)}<clipPath id="${uid}clip"><rect x="3" y="3" width="194" height="194" rx="24"/></clipPath></defs><g clip-path="url(#${uid}clip)">${r(0,0,200,200,url(uid+'sky'))}${c(98,88,79,'none')}${l('M98 9a79 79 0 1 0 .1 0 M98 17a71 71 0 1 0 .1 0',k.rim,.7,.25)}${many(9,i=>c(19+(i*37)%167,17+(i*51)%151,1+(i%2)*.4,k.gem,.45))}${mage?l('M32 44l5 -8 5 8 -5 9Z M159 99l4 8 -4 8 -4 -8Z M29 123l7 -4 6 5 -6 7Z','#b4bde3',1,.6):`${l('M-4 155Q15 80 37 28 M20 115l-10 -16 M26 89l13 -16 M183 154q-1 -52 -6 -80','#a2b799',2,.35)}`}${p('M19 207l10 -58q7 -24 45 -29l7 -18 30 0 8 19q41 9 47 36l14 50Z',url(uid+'cloth'),rim(k.fold,2))}${p('M79 107l-7 30 21 30 24 -34 -6 -26Z',k.skin)}${p('M72 120l23 42 -16 40 -35 -2 -9 -57Z',k.cape)}${p('M118 120l-22 42 8 40 50 -1 -4 -57Z',k.fold)}${p('M49 140l20 -15 26 37 -15 20Z',k.cape,rim(k.rim,1.2))}${p('M142 140l-25 -16 -22 38 24 16Z',k.cape,rim(k.rim,1.2))}${mage?`${l('M57 151l16 38 M65 145l16 41 M130 147l-12 41',gold,1,.8)}${p('M90 160l7 -7 8 9 -9 10Z',k.gem,rim(gold,1.8))}`:`${p('M58 136l13 -5 67 72 -18 0Z','#8d7751',rim('#bba57b',1.2))}${p('M86 159l10 -8 11 13 -10 9Z',gold)}${p('M90 160l6 -4 6 8 -6 5Z','#55634a')}`}${face}${prop}${mage?`${p('M147 133q-7 -12 -10 -6 -1 7 5 12l-1 7 10 6 6 -7 -1 -14 -5 -3Z',k.skin,rim('#886b6c',.8))}`:''}</g><rect x="3" y="3" width="194" height="194" rx="24" fill="none" stroke="${k.rim}" stroke-opacity=".55" stroke-width="1.4"/></svg>`;
  }

  function bridge(open) {
    const boards=many(8,i=>`${p(`M${-32+i*8} -24l8 -2 0 44 -8 2Z`,i%2?'#849795':'#9caaa0',rim('#445e66',.8))}${l(`M${-29+i*8} -19v32`,'#c3c4a8',.7,.6)}`);
    return `<g class="${open?'eq-solved':''}">${e(0,4,43,14,'#0d2632','opacity=".38"')}<g class="eq-bridge-whole">${boards}${l('M-38 -25l76 -5 M-38 22l76 -5','#bdc5af',3)}${[-33,33].map(x=>`${l(`M${x} -27v-14 M${x} 22V9`,'#5e777d',4)}${c(x,-42,3,'#c3ceb8')}${c(x,8,3,'#c3ceb8')}`).join('')}</g><g class="eq-bridge-gap">${p('M-36 -25l17 -1 6 17 -9 9 9 19 -23 3Z','#82948e',rim('#435c62'))}${p('M36 -29l-16 1 -4 14 9 10 -11 20 22 3Z','#82948e',rim('#435c62'))}${l('M-33 -20v32 M31 -21v30','#c4c7ac',1,.5)}${c(0,-5,3,'#a7e2e7',.75)}${c(-5,11,1.5,'#a7e2e7',.5)}${c(5,-20,1.5,'#a7e2e7',.5)}</g></g>`;
  }
  function worldObject(obj,state) {
    const oid=String(obj.id||''), type=obj.type||'quest', uid=`eqo${++serial}`;
    const solved=!!(state.solved||state.complete||state.completed), open=!!(state.open||state.opened), k=solved?'#c1e2bd':'#a2d8e6';
    const base=`<defs>${halo(uid+'glow',k)}</defs><ellipse class="eq-sense-ring" cx="0" cy="0" rx="30" ry="17" fill="none" stroke="#dbc68e" stroke-width="1.5"/>`;
    let body='';
    if(type==='npc') {
      const who=obj.npc||obj.companion||(['mira','bram'].find(x=>oid.includes(x)));
      body=who==='mira'||who==='bram'?actor(who,'down'):who==='spirit'?`${e(0,0,19,7,'#1c354b')}<g class="eq-ambient-mote">${c(0,-25,37,url(uid+'glow'))}${p('M-13 -4q5 -9 1 -23 -2 -19 13 -20 15 1 14 18 -4 15 4 23l-10 -3 -9 8 -7 -9Z','#a0bccc','opacity=".75"')}${l('M-5 -31h2 M5 -31h2 M-3 -25q4 3 7 0','#334b6b',1.6)}${p('M-15 -17l15 3 15 -5 0 13 -15 5 -15 -3Z','#cdd3b5',rim('#68818d',.7))}</g>`:`<g class="eq-idle">${actor('arcanist','down')}${who==='rowan'?`${p('M-7 -35q7 4 14 0l-2 12 -5 5 -5 -6Z','#c3cbc4',rim('#5b7179',.7))}${l('M-3 -32l1 8 M3 -32l-1 10','#e0e0ce',.6)}`:`${p('M-11 -20l11 -2 11 2v10l-11 -2 -11 2Z','#c8d1b1',rim('#566f77',.7))}`}</g>`;
    } else if(oid.includes('bridge')||obj.appearance==='bridge') {
      body=`${g(68,0,`<g transform="scale(1 1.8)">${bridge(solved||open)}</g>`)}${p('M-15 1l3 -25 23 -2 5 27Z','#718b8c',rim('#395966',1))}${l('M-7 -17l6 -6 7 6 M-7 -9h14 M-6 -3h12',k,1.3)}${l('M15 -5h20',k,1,.4)}`;
    } else if(oid==='r-gate'||oid==='c-door') {
      const vertical=oid==='r-gate';
      body=`${e(0,2,20,7,'#112b3a')}${p('M-15 1l4 -24 22 0 5 24Z','#79909a',rim('#3f586c',1))}${l('M-7 -16l7 -5 7 5 -7 7Z',k,1.3)}${g(vertical?62:0,vertical?0:-43,`<g class="eq-door-leaf">${r(vertical?-17:-60,vertical?-70:-17,vertical?35:120,vertical?155:35,'#6d91a2',2)}${r(vertical?-13:-58,vertical?-70:-13,vertical?27:116,vertical?155:27,'#83bec7',2)}${many(6,i=>l(vertical?`M-10 ${-58+i*25}l10 7 10 -7 -10 -7Z`:`M${-51+i*19} -10l6 10 -6 10 -6 -10Z`,'#c7e9e4',1.2,.8))}${c(0,0,66,url(uid+'glow'))}</g>${vertical?`${l('M-23 -70h45 M-23 85h45','#c3d0b9',4)}`:`${l('M-60 -24v48 M60 -24v48','#c3d0b9',4)}`}`)}`;
    } else if(type==='chest') {
      body=`${e(0,2,25,9,'#0a202a','opacity=".45"')}<g class="eq-chest-treasure">${c(0,-23,38,url(uid+'glow'))}${crystal(-4,-8,.46,'gold',-12)}${c(8,-13,5,'#d7be75')}${c(12,-6,4,'#eddb97')}</g>${p('M-21 -17l42 -2 -1 24 -18 7 -22 -6Z','#705542',rim('#292e32',1.5))}${p('M1 -14l20 -5 -1 24 -18 7Z','#4c4341')}${p('M-17 -15l5 0 0 23 -5 -2 M11 -17l5 -1 -1 25 -5 2Z',gold)}${l('M-19 1l18 4 21 -6','#a1845c',1.1)}<g class="eq-chest-lid">${p('M-21 -18q1 -15 20 -15 19 -1 22 14l-20 7Z','#8d6a48',rim('#29343b',1.5))}${p('M1 -33q16 1 20 14l-20 7Z','#6e5542')}${p('M-17 -23q1 -6 5 -7l1 14 -6 -2 M11 -31q4 2 5 5l0 12 -5 2Z',gold)}${l('M-20 -18l21 6 20 -7','#e3c88e',1.5)}</g>${p('M-3 -17h8v11h-8Z','#c3aa70',rim('#74684e',.7))}${c(1,-12,1.3,'#34404a')}`;
    } else if(type==='door') {
      const secret=oid.includes('grove')||oid.includes('vault')||obj.to==='grove'||obj.to==='vault';
      body=`${e(0,4,36,12,'#0a202a','opacity=".5"')}${p('M-31 2v-42q1 -23 31 -34 30 11 31 34V2l-10 5 -2 -43Q16 -49 0 -57q-16 8 -19 21v43Z',secret?'#547571':'#77878e',rim('#2c4758',1.4))}${p('M-19 3v-40q3 -12 19 -20 17 9 19 20V3Z','#122a3b')}${l('M-26 -2v-36q1 -22 26 -30 26 9 26 30V0','#b3bca7',1.3,.75)}${l('M-29 -35l10 -2 M-23 -54l9 6 M-6 -70l3 12 M16 -62l-6 9 M29 -37l-10 0','#3f5866',1.8)}<g class="eq-door-leaf">${p('M-17 1v-37q2 -11 17 -18 16 9 17 18V1Z',secret?'#365b61':'#4c5b75',rim('#9bb4b6',.8))}${l('M0 -52V0 M-15 -35h30 M-16 -11h32',gold,1,.65)}${p('M-9 -29l9 -12 9 12 -9 12Z','#233f57',rim('#a3bfc5',1))}</g><g class="eq-door-sigil eq-rune-glow">${l('M-6 -28l6 -8 6 8 -6 7Z M0 -36v16',k,1.5)}${c(0,-28,17,url(uid+'glow'))}</g>${secret?`${tuft(-26,4,1.25)}${tuft(28,2,.8)}`:''}`;
    } else if(type==='sign') {
      const cross=oid.includes('cross')||obj.choiceId==='crossroad';
      body=`${e(0,2,20,7,'#0a202a','opacity=".4"')}${p('M-3 -30l6 -1 -1 33 -5 0Z','#8e8266',rim('#344850',.8))}${p(cross?'M-26 -40h41l10 8 -10 8h-41Z':'M-27 -40l49 -2 5 27 -49 2Z','#647878',rim('#b1bc9e',1))}${l('M-18 -31h28 M-16 -25h18','#dce2bd',1.5,.85)}${cross?`${p('M-21 -19h44v14h-44l-9 -7Z','#566e70',rim('#a6b398',.8))}${l('M-15 -12h31','#cfd9b9',1)}`:''}${tuft(-12,5,.6)}`;
    } else if(type==='crystal'||oid==='c-choice') {
      const color=obj.color||(['red','green','blue','violet'].find(x=>oid.includes(x)))||'blue';
      const big=oid.includes('final')||oid.includes('word')||oid.includes('restore')||oid==='c-choice';
      const size=obj.size==='tall'?1.7:obj.size==='small'?.55:1;
      const shape={red:'M-5 -23l5 -8 5 8Z',green:'M-5 -29h10v10h-10Z',blue:'M0 -32l6 8 -6 8 -6 -8Z',violet:'M-6 -24h12 M0 -30v12',amber:'M-5 -29h10l-2 10h-6Z'}[color]||'M0 -32l6 8 -6 8 -6 -8Z';
      body=`${e(0,3,big?38:23,big?13:8,'#0a202a','opacity=".4"')}${p(big?'M-29 -3l10 -15 36 0 13 15 -9 13 -43 0Z':'M-17 0l7 -11 21 0 7 11 -8 6 -21 0Z','#5e7281',rim('#314b5d',1))}<g class="eq-crystal-light">${c(0,-22,big?65:40,url(uid+'glow'))}</g>${big?`${crystal(-20,-7,.7,'violet',-18)}${crystal(19,-5,.8,'blue',18)}${crystal(0,0,1.45,color)}`:crystal(0,0,size,color)}${g(0,0,p(shape,'none',`stroke="#f0edd2" stroke-width="1.5" stroke-linejoin="round"`),size)}${big?l('M-36 8q36 22 72 0 M-28 15q28 14 56 0',k,1,.5):''}`;
    } else if(type==='book') {
      const tablet=oid.includes('inscription')||oid.includes('tablet')||oid.includes('stone');
      body=tablet?`${e(0,3,24,8,'#0a202a','opacity=".4"')}${p('M-22 1l2 -39 12 -13 25 2 6 17 -2 34Z','#7e9397',rim('#3b5463',1.2))}${p('M-19 -36l12 -12 21 2 4 10Z','#a2afaa')}${l('M-13 -28h24 M-12 -21h23 M-11 -14h17 M-10 -7h20',k,1.5,.8)}${l('M5 -47l-5 9 4 4','#4a6770',1)}${tuft(17,4,.7)}`:`${e(0,3,23,8,'#0a202a','opacity=".4"')}${p('M-15 -5l5 -18 19 0 7 18 -3 10 -25 0Z','#6a7e84',rim('#334f5d',1))}${p('M-23 -29q13 -8 23 -2 13 -8 24 -2l-3 20q-14 -3 -21 1 -10 -4 -22 0Z','#bcc9ae',rim('#425c64',1))}${p('M-21 -30q11 -5 21 -1v18q-11 -5 -21 0Z','#dfdec1')}${p('M1 -31q11 -6 21 -2l-3 18q-9 -3 -18 2Z','#c7d2bc')}${l('M-17 -25l12 -1 M-17 -21h11 M7 -25l10 -2 M7 -20l9 -2','#788f81',1)}${l('M0 -30v17',gold,1.3)}`;
    } else if(obj.appearance==='mushroom') {
      body=`${e(0,2,19,7,'#102c36')}${c(0,-11,30,url(uid+'glow'))}${mushrooms(0,0,2)}${p('M-6 0l6 -3 7 3 -7 4Z','#729394')}${c(0,0,1.8,k)}`;
    } else if(type==='switch') {
      body=`${e(0,3,20,8,'#0a202a','opacity=".4"')}${p('M-16 -3l5 -10 20 0 8 9 -4 10 -26 0Z','#708c8c',rim('#375360',1))}<g class="eq-switch-lever">${l('M0 -4l-8 -22','#adb6a3',4)}${c(-8,-26,5,gold)}${c(-8,-26,2,'#e9ddb4')}</g>${c(7,-3,2,k)}${tuft(-18,6,.6)}`;
    } else if(oid==='f-tracks') {
      body=`${e(-9,-10,4,7,'#b2c2ab','transform="rotate(-18 -9 -10)"')}${e(5,0,4,7,'#b2c2ab','transform="rotate(-18 5 0)"')}${c(-11,-19,2,'#c6d6bb')}${c(3,-9,2,'#c6d6bb')}${l('M-16 -19l4 -5 M-1 -9l4 -5','#87b4aa',1,.55)}`;
    } else if(obj.size==='small'||obj.size==='large'||oid==='f-tree-front'||oid==='r-front') {
      body=stone(0,0,obj.size==='large'?1.65:obj.size==='small'?.6:.9);
    } else if(oid.includes('pillar')) {
      body=`${e(0,1,18,8,'#3e626a')}${p('M-13 -3l13 -9 13 8 -12 8Z','#9aaca3',rim('#45636a',1))}${l('M-6 -3h12 M0 -8v11','#d4ddbc',1)}`;
    } else if(oid.includes('statue')) {
      body=`${column(0,3,.55,true)}${p('M-12 -29l2 -22 10 -9 10 9 3 22Z','#879b99',rim('#3b5961',1))}${e(0,-58,7,8,'#a9b7aa')}${l('M-7 -48l7 9 7 -9','#c5cbb3',1)}${p('M-4 -37l-6 17 12 0 8 -17Z','#617a7c')}`;
    } else if(oid.includes('key')) {
      body=`${e(0,2,18,5,'#0a202a','opacity=".35"')}${c(0,-12,26,url(uid+'glow'))}${l('M-6 -17L10 0 M4 -6l-4 4 M8 -2l-4 4',gold,3)}${c(-10,-21,6,'none')}${p('M-15 -21a5 5 0 1 0 10 0 5 5 0 1 0 -10 0Z','none',`stroke="${gold}" stroke-width="3"`)}`;
    } else if(oid.includes('map')||oid.includes('scroll')) {
      body=`${e(0,2,22,7,'#0a202a','opacity=".3"')}${p('M-20 -28l34 -3 5 29 -34 3Z','#d4d2b0',rim('#6a7867',1))}${p('M-22 -28q-3 -5 3 -5l34 -2q6 1 3 6 M-16 0q-4 7 2 7l35 -5q5 -2 0 -5Z','#b3bb9a',rim('#6a7867',1))}${l('M-12 -21l10 2 5 -7 9 3 M-8 -2l1 -12 10 5 9 -5','#78988c',1.2)}${l('M-6 -19l9 11 M-6 -8l9 -11','#b37567',1.5)}`;
    } else if(oid.includes('light')||oid.includes('trail')) {
      body=`${c(0,-6,30,url(uid+'glow'))}${e(0,2,13,5,'#5a7880')}${crystal(0,0,.55,'blue')}`;
    } else {
      body=`${e(0,2,20,7,'#0a202a','opacity=".35"')}${c(0,-18,32,url(uid+'glow'))}${p('M-18 1l5 -14 28 -2 5 16Z','#71868a',rim('#3c5663',1))}${crystal(0,-6,.85,oid.includes('fragment')?'violet':'gold')}`;
    }
    return `<g class="eq-object-art${open?' eq-open':''}${solved?' eq-solved':''}${state.sensed?' eq-sense':''}${state.available===false?' eq-object-unavailable':''}">${base}${body}</g>`;
  }

  const fallbackObstacles={
    forest:[[70,75,210,95],[610,55,220,95],[40,560,240,35],[700,495,150,100],[470,0,36,475],[470,565,36,75],[470,475,36,90,'f-bridge']],
    ruins:[[450,0,35,245],[450,400,35,240],[450,245,35,155,'r-gate'],[600,190,60,60],[160,105,40,50],[310,105,40,50],[665,435,35,60],[800,435,35,60]],
    cavern:[[0,245,420,35],[540,245,420,35],[420,245,120,35,'c-door'],[60,70,70,110],[570,380,70,85],[860,340,60,90]],
    grove:[[70,65,240,120],[650,70,200,120],[420,280,80,160]],
    vault:[[250,130,75,170],[640,130,75,170],[410,410,130,60]]
  };
  function floor(uid, theme) {
    const scheme={forest:['#213f48','#294e55','#172f3b'],grove:['#284b4c','#416356','#203d42'],ruins:['#334552','#45575c','#293846'],cavern:['#26364f','#344862','#222d45'],vault:['#35404e','#48535d','#253344']}[theme];
    return `<defs>${grad(uid+'floor',...scheme)}${halo(uid+'moon',theme==='grove'?'#bde4b7':theme==='cavern'?'#a8acdf':'#a4d7e2')}${halo(uid+'water','#5eabb7')}${grad(uid+'path','#718274','#667c73','#526b67')}${grad(uid+'waterfill','#245466','#367d87','#244b60')}${halo(uid+'gold','#e0cc9c')}</defs>${r(0,0,960,640,url(uid+'floor'))}
      ${e(430,305,510,350,url(uid+'moon'))}${many(145,i=>{
        const x=24+(i*137)%912,y=23+(i*173)%592;
        return i%3===0?l(`M${x} ${y}l5 -2 5 1`,scheme[1],.9,.4):e(x,y,1.7+(i%4),.65,theme==='grove'?'#a1b99b':'#96a7a0','opacity=".12"');
      })}`;
  }
  function pathWay(d, width=66, stony=false) {
    return `${l(d,'#152d35',width+8,.2)}${l(d,stony?'#69787a':'#637f78',width,.42)}${l(d,stony?'#98a29a':'#96a88d',width-8,.1)}`;
  }
  function water(x,y,w,h,uid) {
    return `${r(x-3,y,w+6,h,'#1b3540')}${r(x,y,w,h,url(uid+'waterfill'))}${l(`M${x+2} ${y}v${h} M${x+w-2} ${y}v${h}`,'#a0c6ba',1,.45)}${many(Math.ceil(h/35),i=>`<g class="eq-water-line" style="--delay:${-(i%6)}s">${l(`M${x+8+(i%3)*3} ${y+12+i*35}q7 -3 13 -1 M${x+9} ${y+20+i*35}h8`,'#a3e2de',.9,.6)}</g>`)}`;
  }
  function forestBlock(o,uid,secret=false) {
    let body=`${r(o.x,o.y,o.w,o.h,'#1b3941',12)}${r(o.x+3,o.y+2,o.w-6,o.h-4,'#2b514f',10)}`;
    if(o.h<50) {
      body+=many(Math.floor(o.w/26),i=>`${g(o.x+15+i*26,o.y+18,`${e(0,0,19,13,'#325955')}${e(-3,-4,13,8,'#527b6b')}${l('M-9 0l9 -4 9 4','#87a388',.8,.45)}`)}${tuft(o.x+12+i*26,o.y+o.h-2,.7)}`);
    } else {
      body+=many(Math.max(2,Math.floor(o.w/59)),i=>tree(o.x+35+i*((o.w-65)/Math.max(1,Math.floor(o.w/59)-1)),o.y+o.h-9,.69+(i%2)*.12,i));
      body+=many(Math.floor(o.w/30),i=>tuft(o.x+14+i*30,o.y+o.h-1,.6+(i%3)*.15));
    }
    return body+`${mushrooms(o.x+o.w-11,o.y+o.h-3,.85)}${secret?c(o.x+o.w/2,o.y+o.h/2,90,url(uid+'gold')):''}`;
  }
  function masonry(o) {
    const vertical=o.h>o.w, count=Math.ceil((vertical?o.h:o.w)/26);
    return `${r(o.x+3,o.y+4,o.w,o.h,'#142733')}${r(o.x,o.y,o.w,o.h,'#6c7f86')}${r(o.x+4,o.y+3,o.w-8,o.h-6,'#879491')}${l(vertical?`M${o.x+o.w-5} ${o.y}v${o.h}`:`M${o.x} ${o.y+o.h-4}h${o.w}`,'#bdc4ae',1.4,.6)}${many(count,i=>l(vertical?`M${o.x+2} ${o.y+11+i*26}l${o.w-4} -3`:`M${o.x+10+i*26} ${o.y+2}l-2 ${o.h-4}`,'#3f5866',1.7,.8))}${many(Math.floor(count/3),i=>p(vertical?`M${o.x+3} ${o.y+12+i*74}l12 3 -6 14 9 3 -3 15 -12 -7Z`:`M${o.x+12+i*74} ${o.y+3}l17 4 -3 9 -15 -3Z`,'#466d66','opacity=".8"'))}`;
  }
  function crystalRidge(o) {
    const horizontal=o.w>o.h, count=Math.max(2,Math.floor((horizontal?o.w:o.h)/29));
    return `${r(o.x,o.y,o.w,o.h,'#19293d',6)}${many(count,i=>{
      const x=horizontal?o.x+13+i*(o.w-25)/(count-1):o.x+o.w/2+(i%2?11:-11), y=horizontal?o.y+o.h-2:o.y+30+i*(o.h-32)/(count-1);
      return `${p(`M${x-14} ${y}l-2 -18 11 -13 20 9 5 17 -9 8Z`,i%2?'#52647b':'#465c75',rim('#283c54',1))}${l(`M${x-3} ${y-28}l5 14 12 -5 M${x+2} ${y-14}l-2 16`,'#91a8b8',1,.5)}${i%3===0?crystal(x-2,y,.45+(i%2)*.12,'violet',-10):''}`;
    })}`;
  }
  function runeCircle(x,y,size=1,color='#acc6b5') {
    return g(x,y,`${e(0,0,67,43,'none',`stroke="${color}" stroke-width="1.1" opacity=".32"`)}${e(0,0,58,36,'none',`stroke="${color}" stroke-width=".8" opacity=".25"`)}${many(8,i=>{
      const angle=i*Math.PI/4,rx=Math.cos(angle)*61,ry=Math.sin(angle)*39;
      return l(`M${rx-2} ${ry-4}l4 0 0 7 -4 0 4 -7`,color,.8,.48);
    })}${l('M0 -26l33 26 -33 25 -33 -25Z M-33 0h66 M0 -26v51',color,.8,.18)}`,size);
  }
  function ambient(uid,theme) {
    const points=theme==='forest'?[[96,218],[280,84],[376,150],[534,315],[657,205],[856,245],[658,530],[775,387],[298,484],[553,82]]:theme==='grove'?[[122,258],[205,218],[315,440],[516,193],[685,240],[820,400],[602,455],[393,511],[815,96],[725,578],[350,155],[566,74]]:[[140,220],[360,88],[560,325],[787,330],[724,149],[869,577],[435,536],[179,589]];
    return points.map(([x,y],i)=>`<g class="eq-ambient-mote" style="--duration:${4+(i%4)}s;--delay:${-i*.72}s">${c(x,y,5,i%3?'#99d8df':'#c8d7a2',.09)}${c(x,y,1.25,i%3?'#b6e7e5':'#e5eab8',.7)}</g>`).join('');
  }
  function groundDetail(theme) {
    // These are flush ground markings and lighting, never extra collision features.
    const forest=theme==='forest'||theme==='grove';
    if(forest) return `<g opacity=".12">${p('M595 0L920 0 555 640 265 640Z','#aedaca')}${p('M170 0h57L0 392V267Z','#a6d5d4')}</g>${many(90,i=>{
      const x=21+(i*163)%917,y=22+(i*97)%594;
      return `<g opacity="${.14+(i%3)*.04}" transform="translate(${x} ${y}) rotate(${i*37%180})">${p('M-5 0q3 -5 8 -2 -1 5 -8 2Z',i%3?'#8db19b':'#c3be8b')}${l('M-6 2l9 -4','#9eb8a5',.5)}</g>`;
    })}${many(12,i=>{
      const x=i%2?922:32,y=70+Math.floor(i/2)*100;
      return g(x,y,`${l('M0 16q8 -21 0 -38','#608e79',1,.5)}${many(5,j=>`${p(`M${j%2?-1:3} ${12-j*6}q-14 -2 -16 -9 13 0 16 9Z`,'#52816b','opacity=".36"')}${p(`M${j%2?0:4} ${10-j*6}q12 -3 15 -11 -11 2 -15 11Z`,'#6a9578','opacity=".33"')}`)}`,.7);
    })}`;
    if(theme==='cavern') return `${many(8,i=>l(`M${12+i*4} ${22+i*12}Q205 ${89+i*13} 361 ${32+i*11}T${940-i*3} ${80+i*10}`,'#8196b3',.8,.07))}${many(7,i=>l(`M${26+i*4} ${590-i*15}Q237 ${535-i*11} 412 ${586-i*12}T${932-i*8} ${568-i*9}`,'#9da9bf',.8,.08))}${many(28,i=>{
      const x=30+(i*173)%900,y=28+(i*109)%570;
      return l(`M${x} ${y}l8 -4 18 3 8 -4 M${x+11} ${y-2}l-4 7`,'#b3bac5',.8,.14);
    })}`;
    return `${many(16,i=>{
      const x=58+(i%4)*243,y=62+Math.floor(i/4)*171;
      return g(x,y,`${p('M0 -17l29 17 -29 17 -29 -17Z','none','stroke="#a9b6ad" stroke-width=".8" opacity=".14"')}${p('M0 -11l18 11 -18 11 -18 -11Z','none','stroke="#a9b6ad" stroke-width=".7" opacity=".12"')}${c(0,0,2,'#c5c7ab',.15)}`);
    })}${many(20,i=>{
      const x=46+(i*137)%880,y=44+(i*191)%555;
      return l(`M${x} ${y}l9 5 -2 8 13 4 M${x+7} ${y+13}l-5 4`,'#0e2637',.9,.27);
    })}`;
  }
  function worldBackground(name,area) {
    const theme=Object.hasOwn(fallbackObstacles,name)?name:'forest', uid=`eqw${++serial}`;
    const canonical=area || (typeof ExplorationData!=='undefined'?ExplorationData.areas[theme]:null);
    const obstacles=canonical?.obstacles||fallbackObstacles[theme].map(([x,y,w,h,requires])=>({x,y,w,h,requires}));
    let body=floor(uid,theme)+groundDetail(theme);
    if(theme==='forest') {
      body+=`${pathWay('M65 448Q167 462 243 419T305 323Q301 258 343 223L409 192',63)}${pathWay('M145 273Q183 221 210 206',45)}${pathWay('M99 458Q126 373 109 350Q124 317 211 322L273 333',48,true)}${pathWay('M285 405Q298 480 369 509L535 523Q594 520 642 436Q707 331 877 315',72)}${pathWay('M541 525Q579 492 593 422',44)}${pathWay('M352 197Q338 138 350 88L426 92',39)}
        ${e(177,130,154,111,url(uid+'moon'))}${e(703,280,222,152,url(uid+'moon'))}`;
      body+=obstacles.filter(o=>!o.requires).map(o=>o.x===470?water(o.x,o.y,o.w,o.h,uid):forestBlock(o,uid)).join('');
      body+=`${water(470,475,36,90,uid)}${tree(175,166,.96,0)}${many(9,i=>g(114+(i%3)*16,352+Math.floor(i/3)*24,p('M-7 -3l12 -2 4 5 -12 4Z','#8b9b8d','opacity=".3"')))}
        ${many(7,i=>`${tuft(530+i*47,570+(i%2)*24,.6)}${mushrooms(550+i*43,590+(i%2)*16,.5)}`)}${mushrooms(310,68,.85)}${mushrooms(860,464,1.1)}${mushrooms(50,261,.8)}${tuft(601,190,1.4)}${tuft(846,181,1)}
        ${l('M515 33q19 28 7 55 M513 230q15 24 4 48 M454 320q-12 23 -5 38','#79a09c',1,.32)}${many(6,i=>e(460,70+i*77,3,9,'#527b70','opacity=".65"'))}
        ${runeCircle(758,311,.7,'#9dbdb7')}${p('M20 20h920v600H20Z','none','stroke="#9fbeb6" stroke-opacity=".08" stroke-width="1"')}`;
    } else if(theme==='ruins') {
      body+=`${pathWay('M45 330L401 315Q464 315 536 315L811 315Q851 279 839 182L885 66',76,true)}${pathWay('M250 315L253 225M255 323L245 431Q242 503 306 534',54,true)}${pathWay('M550 317L554 418Q637 479 751 466L879 548',60,true)}${runeCircle(279,318,1.65)}${runeCircle(689,326,1.2)}
        ${many(32,i=>{
          const x=39+(i*79)%870,y=48+(i*113)%548;
          return `<g opacity=".15">${p(`M${x} ${y}l35 -4 3 21 -35 4Z`,'#a0afa4',rim('#172c3c',1))}${l(`M${x+5} ${y+3}l26 -2`,'#e1d9b7',.8)}</g>`;
        })}`;
      body+=obstacles.filter(o=>!o.requires).map(o=>{
        if(o.w===35&&o.x===450)return masonry(o);
        if(o.x===600)return `${r(o.x,o.y,o.w,o.h,'#677c80',4)}${p('M605 199l25 -8 25 8v39l-25 9 -25 -9Z','#8a9c97',rim('#3b5664'))}${g(630,238,`${p('M-17 0l5 -35 9 -11 13 9 10 33Z','#91a4a0',rim('#4d6870',1.2))}${e(1,-47,10,12,'#b1c0b1')}${p('M-7 -50l-5 -15 17 -3 10 17Z','#8ba19e')}${l('M-6 -34l5 17 12 -18 M-2 -16l-3 15','#c1c8b1',1.6)}${p('M6 -12l9 -10 3 14 -4 7Z','#698780')}`)}`;
        return `${r(o.x,o.y,o.w,o.h,'#314a54',5)}${column(o.x+o.w/2,o.y+o.h-5,o.w/49,o.y>400)}`;
      }).join('');
      body+=`${l('M425 245h84 M425 400h84','#9daea4',4,.75)}${l('M452 242v-12 M480 242v-12 M452 401v12 M480 401v12','#c2cab0',4,.8)}${tuft(486,437,.8)}${tuft(484,127,.7)}${tuft(210,99,1.1)}${tuft(668,251,.8)}
        ${l('M57 594q97 -22 150 -5 M676 41l51 3 12 -11 M757 576l-27 5 -18 -9','#a7b2a1',1,.2)}${mushrooms(51,205,.8)}${mushrooms(905,404,.8)}`;
    } else if(theme==='cavern') {
      body+=`${pathWay('M56 546Q165 529 211 449Q263 383 348 376L480 307L480 242Q483 166 540 145L806 170',70,true)}${pathWay('M218 452Q402 518 678 555L833 509',70,true)}${pathWay('M475 174Q393 135 214 156',50,true)}
        ${e(742,439,190,135,url(uid+'moon'))}${e(472,118,236,133,url(uid+'moon'))}${runeCircle(540,145,1.2,'#c8c8e2')}
        ${p('M0 607Q125 584 218 610T444 612Q577 599 726 624L960 612v28H0Z','#29495e')}${l('M7 620q123 -25 213 -3t213 10 M607 624q71 -1 104 7 M802 630l125 -7','#8cbcc9',1,.3)}
        ${l('M68 19Q212 34 309 14 M718 23l66 14 97 -16 M922 85q-5 66 15 118','#748aaf',1.4,.25)}`;
      body+=obstacles.filter(o=>!o.requires).map(o=>crystalRidge(o)).join('');
      body+=`${crystal(99,157,1.75,'blue',-8)}${crystal(80,164,.9,'violet',-20)}${crystal(115,173,.95,'blue',16)}${crystal(607,450,1.6,'violet',8)}${crystal(586,457,.8,'blue',-14)}${crystal(891,412,1.8,'blue',-8)}${crystal(911,421,.75,'violet',22)}
        ${g(330,145,`${e(0,0,20,8,'#1d3046')}${l('M0 0v-43','#80969e',4)}${p('M-10 -44l3 -13 15 0 4 13 -4 16 -13 0Z','#8ba4ac',rim('#3a5068',1.4))}${p('M-6 -43l13 0 -2 11 -9 0Z','#e3d3a1')}${c(1,-39,45,url(uid+'gold'))}${l('M-11 -44h24 M-4 -28v-15 M6 -28v-15','#b9bba1',1)}`)}
        ${crystal(777,183,.85,'blue')}${e(774,172,44,28,url(uid+'moon'))}${l('M423 241l-6 -12 M538 242l6 -12 M421 282l-8 12 M538 282l8 12','#bfc8c7',3,.65)}
        ${many(16,i=>e(31+i*59,300+(i%3)*5,5,1.6,'#a7b9c2','opacity=".16"'))}`;
    } else if(theme==='grove') {
      body+=`${pathWay('M65 502Q160 491 232 328Q288 237 351 224Q497 203 579 227L731 302',70)}${pathWay('M246 384Q284 524 470 536L613 508Q753 485 738 321',65)}${e(533,291,307,206,url(uid+'gold'))}${runeCircle(730,300,1.25,'#d1d9b1')}`;
      body+=obstacles.map(o=>{
        if(o.x===420)return `${r(o.x,o.y,o.w,o.h,'#20463f',17)}${p('M423 424l12 -23 0 -83 12 -27 38 -9 11 26 -7 99 10 24 -24 -9 -12 16 -12 -16Z','#4e6b58',rim('#243e40',1.4))}${l('M447 310l-3 80 8 30 M475 304l-4 102 13 16','#99a27b',2,.65)}${p('M438 333l8 -9 4 13 -6 14Z','#25443e')}${g(460,316,`${e(0,-30,47,33,'#385f4d')}${e(-7,-41,37,23,'#557c5d')}${l('M-30 -38q14 -13 29 -8 M3 -29l22 -7','#a3ba8f',1.5,.45)}`)}${mushrooms(428,436,1.15)}${mushrooms(485,439,.75)}`;
        return forestBlock(o,uid,true);
      }).join('');
      body+=`${many(9,i=>mushrooms(110+i*91,587+(i%2)*17,.55+(i%3)*.15))}${tuft(365,89,1.2)}${tuft(608,104,1)}${tuft(830,481,1.2)}${l('M406 171q54 -13 105 0 M277 568q80 19 124 10','#c2c5a0',1,.25)}`;
    } else {
      body+=`${pathWay('M54 479L187 483Q220 386 202 315L167 191',62,true)}${pathWay('M196 481L387 503Q557 535 786 480L790 216',75,true)}${pathWay('M481 491L478 339',60,true)}${runeCircle(480,247,2.6,'#a8bdc6')}
        ${many(5,i=>`${l(`M40 ${60+i*118}H920`,'#8fa2a6',.9,.12)}${l(`M${80+i*195} 30v580`,'#a6b4ae',.9,.13)}`)}
        ${p('M29 25h902v590H29Z','none','stroke="#8b9ba3" stroke-width="6" stroke-opacity=".22"')}${p('M43 39h874v562H43Z','none','stroke="#c5c8b5" stroke-width="1" stroke-opacity=".25"')}`;
      body+=obstacles.map(o=>{
        if(o.y===410)return `${r(o.x+3,o.y+5,o.w,o.h,'#1c3040',4)}${r(o.x,o.y,o.w,o.h,'#786d64',4)}${r(o.x+5,o.y+5,o.w-10,o.h-12,'#a99a7c',2)}${l(`M${o.x+9} ${o.y+19}h${o.w-18} M${o.x+8} ${o.y+38}h${o.w-17}`,'#6f7269',1.3,.6)}${g(465,436,`${p('M-17 -11l35 -1 -2 21 -34 1Z','#c9c8a4',rim('#837e67',.7))}${l('M-12 -7l20 0 M-12 -2l16 0 M-11 3l22 0','#87957a',1)}`)}${g(508,440,`${c(-4,-3,4,'none')}${l('M-4 -7q-7 4 0 8 7 -4 0 -8 M0 1l10 9 3 -3',gold,2)}`)}`;
        return `${r(o.x+3,o.y+4,o.w,o.h,'#1a2d3e',3)}${r(o.x,o.y,o.w,o.h,'#586b78',3)}${r(o.x+5,o.y+5,o.w-10,o.h-10,'#87959b',2)}${many(5,i=>`${r(o.x+9,o.y+10+i*30,o.w-18,24,'#334b60',2)}${many(6,j=>r(o.x+12+j*9,o.y+13+i*30,5,17,j%3?'#73938f':'#ae9b79',1))}${l(`M${o.x+8} ${o.y+35+i*30}h${o.w-16}`,'#c4c6af',1,.8)}`)}${crystal(o.x+o.w/2,o.y+3,.58,'violet')}`;
      }).join('');
      body+=`${[91,870].map(x=>g(x,61,`${c(0,0,51,url(uid+'gold'))}${p('M-10 7l4 -17 13 0 5 17Z','#748c94',rim('#405567',1))}${p('M-6 -10q-6 -14 6 -24 13 12 8 24Z','#d8d1a2')}${c(1,-15,4,'#f4e9c3')}`)).join('')}${l('M379 63h203 M379 73h203 M377 566h205 M377 576h205',gold,1,.25)}`;
    }
    return `<g class="eq-scenery eq-scenery-${theme}">${body}${ambient(uid,theme)}${r(0,0,960,640,'none')}</g>`;
  }

  function background(area) {
    return worldBackground(typeof area==='string'?area:area?.id||'forest', typeof area==='object'?area:null);
  }
  function object(obj = {}, state = {}) {
    return worldObject(obj,state);
  }
  return {background, object, hero:(id,direction)=>actor(id,direction), companion:(id,direction)=>actor(id==='bram'?'bram':'mira',direction), portrait};
})();
