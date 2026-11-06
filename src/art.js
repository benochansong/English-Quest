// Original inline vector illustrations for English Quest. No asset downloads.
const Art = (function illustrationLibrary() {
  // Each drawing has its own paint servers, including when two portraits share a screen.
  let serial = 0;
  const svg = (box, body, css = '', fit = 'xMidYMid meet') =>
    `<svg xmlns="http://www.w3.org/2000/svg" class="${css}" viewBox="${box}" preserveAspectRatio="${fit}" aria-hidden="true" focusable="false">${body}</svg>`;
  const circle = (x,y,r,paint,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${paint}" ${extra}/>`;
  const path = (d,fill,extra='') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const many = (count, draw) => Array.from({length:count},(_,i)=>draw(i)).join('');
  const use = (id,transform,extra='') => `<use href="#${id}" transform="${transform}" ${extra}/>`;
  const noise = i => {const x = Math.sin(i*17.341+0.7)*937.171;return x-Math.floor(x);};
  const palettes = [
    ['#111f32','#346363','#e3bb77','#526f60','#314f4b','#193d38','#0e2928','#091c20','#87ad81','#f2ce82'],
    ['#101e38','#3e6a81','#b8d8da','#44718a','#325964','#214649','#15323b','#0c202e','#64b9c4','#a2f3ff'],
    ['#191b35','#50496e','#d6b3a4','#6e6177','#454862','#323348','#222533','#111c2a','#b48cab','#edc3f3']
  ];
  function forest(stage=1,title=false){
    const id=`land${++serial}`, [sky,mid,horizon,hill,far,wood,trunk,dark,leaf,glow] = palettes[stage-1]||palettes[0];
    const ref=n=>`url(#${id}${n})`;
    const tree=id+'pine';
    const treeShape=`<g id="${tree}">${path('M-2 0 L-1 -83 L0 -114 L3 -11 L5 0Z','currentColor')}${
      many(8,i=>{const y=-111+i*12,w=4+i*2.75;return path(`M0 ${y-4} Q${-w*.26} ${y+11} ${-w} ${y+19} Q${-w*.5} ${y+20} -3 ${y+16} L-4 ${y+21} L2 ${y+16} Q${w*.46} ${y+21} ${w+2} ${y+19} Q${w*.39} ${y+12} 0 ${y-4}Z`,'currentColor');})
    }</g>`;
    const branch=id+'sprig';
    const leafSprig=`<g id="${branch}">${path('M0 0 Q38 -13 70 -7','none','stroke="#abb487" stroke-width="1.3"')}${
      many(7,i=>{const x=7+i*9;return path(`M${x} -6 q-5 -12 -14 -13 q3 11 14 13Z M${x+4} -6 q2 9 -6 13 q1 -8 6 -13Z`,i%3===0?'#71866b':'#426456');})
    }</g>`;
    const defs=`<defs>
      <linearGradient id="${id}sky" x2=".1" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="${sky}"/><stop offset=".49" stop-color="${mid}"/><stop offset=".8" stop-color="${horizon}"/><stop offset="1" stop-color="${wood}"/></linearGradient>
      <radialGradient id="${id}moon"><stop stop-color="#ffffd1" stop-opacity=".56"/><stop offset=".22" stop-color="${glow}" stop-opacity=".23"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}soil" x2="0" y2="1"><stop stop-color="${wood}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <linearGradient id="${id}trail" x2="0" y2="1"><stop stop-color="${glow}" stop-opacity=".56"/><stop offset="1" stop-color="${leaf}" stop-opacity=".15"/></linearGradient>
      <linearGradient id="${id}ray" x2="0" y2="1"><stop stop-color="${glow}" stop-opacity=".19"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></linearGradient>
      ${treeShape}${leafSprig}</defs>`;
    const moonX=title?967:734,moonY=title?130:118;
    const stars=many(65,i=>circle(Math.round(noise(i)*1400),Math.round(noise(i+327)*290),i%7===0?1.8:1,'#f8e8c1',`opacity="${.24+noise(i+415)*.65}"`));
    const stars4=many(7,i=>{const x=300+i*133,y=35+noise(i)*164;return path(`M${x-4} ${y} l3 -1 1 -5 1 5 4 1 -4 1 -1 5 -1 -5Z`,glow,'opacity=".7"');});
    // Ridgelines use graded silhouettes and exposed facets to keep the landscape legible at small sizes.
    const ridges= path('M0 329 L65 290 125 302 243 205 276 214 322 176 385 231 429 197 506 235 595 181 653 251 709 210 782 247 869 158 923 212 992 164 1024 197 1077 183 1186 278 1273 214 1400 264 V500 H0Z',hill,'opacity=".73"')+
      path('M184 262l59 -57 33 9 46 -38 -46 64 11 -22z M542 222l53 -41 29 34 -31 -20z M808 221l61 -63 53 54 -48 -31 -17 28 3 -17z M946 207l46 -43 32 33 -40 -19z',glow,'opacity=".22"')+
      path('M0 338 Q90 287 173 329 T314 320 Q397 262 457 295 T610 338 Q706 259 770 295 T895 290 Q1025 223 1118 281 T1286 285 Q1345 273 1400 304 V470 H0Z',far);
    function castle(x,y,scale){
      const tower=(tx,ty,w,h)=>`<g transform="translate(${tx} ${ty})">${path(`M0 0 h${w} v${h} H0Z`,far)}${path(`M-4 1 L${w/2} ${-w*.98} ${w+4} 1Z`,wood)}${path(`M${w/2} ${-w*.98} l${w/2+4} ${w*.98+1} h-5Z`,glow,'opacity=".7"')}${path(`M${w*.5} ${-w*.98} v-12 l10 3 -10 4`,glow)}${path(`M${w*.36} 14 q2 -7 4 0v9h-4Z`,glow)}</g>`;
      return `<g transform="translate(${x} ${y}) scale(${scale})">${tower(-52,-29,16,63)}${tower(30,-39,20,74)}${tower(-21,-66,25,96)}${path('M-48 1h65v32h-65z',far)}${path('M-52 2l37 -22 38 22Z',wood)}${tower(1,-12,16,47)}${tower(-69,-10,13,51)}${path('M-77 32h136v12H-77Z',wood)}${many(8,i=>path(`M${-71+i*17} 31v-7h6v7`,wood))}${path('M-31 33v-9q5 -11 10 0v9Z',glow)}</g>`;
    }
    const cluster=(offset,y,s,n,color,step)=>`<g color="${color}">${many(n,i=>use(tree,`translate(${Math.round(offset+i*step)} ${Math.round(y+Math.cos(i*1.33)*13)}) scale(${(s*(.58+noise(i+step)*.75)).toFixed(2)})`))}</g>`;
    const castleX=title?1010:850;
    const banks=path('M0 338 Q156 293 320 365 Q456 424 600 386 Q775 350 924 315 Q1092 276 1211 321 Q1300 337 1400 308 V490 H0Z',wood)+
      cluster(-15,371,.94,24,wood,18)+cluster(827,349,.62,36,wood,16)+
      path('M0 397 Q188 358 370 405 Q495 438 661 413 Q809 377 1011 385 Q1195 414 1400 359 V610 H0Z',ref('soil'))+
      path('M839 370 Q762 393 689 405 Q618 419 750 427 Q833 429 763 455 Q662 488 574 510 Q497 538 534 600 H214 Q274 533 424 503 Q621 471 648 450 Q669 440 610 438 Q506 432 600 413 Q671 395 839 370Z',ref('trail'));
    const turf=many(45,i=>{const x=Math.round(noise(i+802)*1400),y=Math.round(422+noise(i+943)*171),w=3+noise(i+190)*20;return path(`M${x} ${y} q${w} -5 ${w*2} -1 q${-w} -1 ${-w*2} 1Z`,leaf,'opacity=".19"');});
    const foregroundTree=(x,s)=>`<g transform="translate(${x} 0) scale(${s} 1)">
      ${path('M-10 -5 H145 Q136 70 115 139 Q145 115 192 99 Q229 80 270 39 L288 29 Q246 89 211 108 Q172 127 122 166 L96 222 Q83 311 97 395 Q106 447 145 489 L160 510 Q131 493 109 485 L123 513 Q98 500 72 491 Q64 495 39 516 L38 498 Q9 504 -9 523Z',trunk)}
      ${path('M87 476 Q61 336 83 211 Q94 153 108 114 M16 396 Q34 318 32 265 T65 129 M128 147 Q188 112 212 100 M103 447 Q83 449 89 417','none',`stroke="${leaf}" opacity=".22" stroke-width="3"`)}
      ${path('M0 91 Q83 114 142 89 Q179 78 218 66 L305 47 365 8 407 -10 H0Z',dark)}
      ${many(29,i=>{const bx=Math.round(noise(i+124)*344),by=Math.round(73-bx*.2+noise(i+78)*24);return use(branch,`translate(${bx} ${by}) rotate(${Math.round(noise(i)*75-54)}) scale(${(.4+noise(i+138)*.58).toFixed(2)})`);})}
    </g>`;
    const herbs=(x,y,s,flip=1)=>`<g transform="translate(${x} ${y}) scale(${s*flip} ${s})">${path('M0 0 Q-10 -26 -43 -46 Q-34 -20 -4 0 Q-15 -44 -6 -70 Q7 -44 2 -3 Q20 -39 50 -50 Q38 -22 6 -2 Q39 -23 60 -19 Q46 -4 8 0Z',leaf,'opacity=".58"')}${path('M-4 -2l-25 -31 M3 -4l30 -33 M0 -4l-5 -47','none',`stroke="${dark}" stroke-width="1.5"`)}</g>`;
    const crystal=(x,y,size)=>`<g transform="translate(${x} ${y}) scale(${size})">${path('M0 0L-6 -30 2 -45 11 -28 6 -2Z',glow)}${path('M2 -45l2 33 -4 12 -6 -30Z',leaf)}${path('M4 -12l7 -16 -5 26Z','#fff6d2','opacity=".8"')}</g>`;
    const motes=many(19,i=>{const x=Math.round(noise(i+41)*1250+75),y=Math.round(noise(i+65)*265+215);return `<g class="firefly" style="--delay:-${i%7}s">${circle(x,y,3.5,glow,'opacity=".15"')}${circle(x,y,1.1,glow)}</g>`;});
    const traveler=title?`<g transform="translate(226 445) scale(1.17)" fill="#0b1e23" stroke="#9cae84" stroke-width=".8">${path('M16 -61q3 -15 14 -14l7 7 -3 11 -4 3 17 14 -7 10 -6 -4 4 25 -5 8 -8 -1 -2 -22 -5 20 -5 4 -10 -1 5 -12 3 -22 -15 13 -13 -3q14 -12 17 -37l14 -8Z','#0b1e23')}${path('M37 -36l33 22 8 3 -3 -6 -33 -23z','#9bad88')}${path('M11 -52q10 -8 22 -3q-13 9 -15 28l-18 12Z','#1b3433')}</g>`:'';
    const bottom=path('M0 456 Q89 428 166 439 T295 451 Q379 467 426 520 Q490 563 562 600 H0Z M1400 416 Q1345 435 1295 435 Q1212 430 1170 475 Q1096 549 998 600 H1400Z',dark);
    return svg('0 0 1400 600',`${defs}<rect width="1400" height="600" fill="${ref('sky')}"/>${stars}${stars4}<g class="painted-moon">${circle(moonX,moonY,190,ref('moon'))}${circle(moonX,moonY,25,'#f2e3b1','opacity=".93"')}${circle(moonX,moonY,35,'none',`stroke="${glow}" stroke-opacity=".33" stroke-width="1"`)}</g>${ridges}<g class="painted-keep">${castle(castleX,289,.86)}</g>${banks}${turf}<g class="forest-mist">${path('M-30 361 Q220 330 437 363 T862 351 Q1057 325 1430 344 Q1138 335 895 365 T447 379 Q217 352 -30 376Z',glow,'opacity=".09"')}${path('M484 400Q711 371 874 379T1213 359Q1106 393 879 387T484 400Z',glow,'opacity=".12"')}</g>${path('M255 0h60l405 470 -90 -10Z M358 0h21l304 315Z M1044 0h32L801 409 740 448Z',ref('ray'))}${bottom}<g class="painted-traveler">${traveler}</g><g class="painted-left">${foregroundTree(0,1)}</g><g class="painted-right">${foregroundTree(1400,-.95)}</g>${herbs(90,482,1)}${herbs(1260,476,1.14,-1)}${herbs(1300,507,.67)}${crystal(title?1169:1060,455,.6)}${crystal(title?1184:1077,458,.35)}${crystal(176,472,.5)}${motes}`,title?'title-art':'arena-bg','xMidYMid slice');
  }
  function hero(){
    const id=`hero${++serial}`,paint=x=>`url(#${id}${x})`;
    const defs=`<defs><linearGradient id="${id}blue" x2="1" y2="1"><stop stop-color="#58808a"/><stop offset=".42" stop-color="#294b60"/><stop offset="1" stop-color="#112236"/></linearGradient><linearGradient id="${id}metal" x2=".8" y2="1"><stop stop-color="#ebdfaf"/><stop offset=".4" stop-color="#a0b6b2"/><stop offset=".55" stop-color="#596b70"/><stop offset="1" stop-color="#293c4b"/></linearGradient><linearGradient id="${id}cape" x2=".9" y2=".8"><stop stop-color="#294251"/><stop offset=".63" stop-color="#22786f"/><stop offset="1" stop-color="#172b39"/></linearGradient></defs>`;
    return svg('0 0 230 264',`${defs}<ellipse cx="105" cy="255" rx="68" ry="6" fill="#071817" opacity=".48"/>
      <g stroke-linejoin="round" stroke-linecap="round">
      ${path('M76 86 Q54 98 51 126 Q46 152 20 170 Q42 172 47 166 Q35 181 22 186 Q60 190 83 167 L99 131Z',paint('cape'),'stroke="#162c39" stroke-width="2"')}
      ${path('M77 98Q62 121 59 146T36 177 M73 116Q66 149 53 158','none','stroke="#72b3a0" opacity=".52" stroke-width="2"')}
      ${path('M84 154 L112 157 120 195 135 230 129 238 119 233 99 208 91 195 72 177Z','#243440','stroke="#12222c" stroke-width="3"')}
      ${path('M113 196l10 -4 14 34 -9 8 -12 -13z','#536168')}${path('M122 227l13 -7 6 15 12 7q3 6 -3 7l-26 -8z','#573d32','stroke="#263036" stroke-width="2"')}
      ${path('M77 157l26 6 -7 38 -20 36 -16 -3 8 -39z',paint('blue'),'stroke="#15242a" stroke-width="3"')}
      ${path('M71 202l18 4 -12 28 -16 -1z',paint('metal'))}${path('M62 224l18 5 -7 16 -1 9 -30 1 -1 -5 14 -8z','#503b33','stroke="#222c30" stroke-width="2"')}
      ${path('M111 69l-1 15 13 9 -13 18 -34 -14 11 -17 7 -12Z','#ba8465')}
      ${path('M79 87l16 -9 16 8 7 1 8 12 -9 35 6 24 -16 13 -33 -6 -8 -8 7 -28 -6 -23Z',paint('blue'),'stroke="#162d35" stroke-width="3"')}
      ${path('M83 92l12 4 19 -5 7 9 -9 26 -17 8 -18 -13 -4 -21Z',paint('metal'),'stroke="#273f47" stroke-width="2"')}
      ${path('M78 105l18 13 20 -9 -4 12 -17 9 -16 -11Z','#354f58')}${path('M80 101l15 10 22 -12','none','stroke="#e3cf96" stroke-width="2"')}
      ${path('M82 82l11 5 18 -5 6 4 -8 11 -15 4 -21 -9Z','#32796f','stroke="#244a47" stroke-width="2"')}
      ${path('M73 87Q59 88 57 102l1 9 17 4 13 -13 -1 -10Z',paint('metal'),'stroke="#293e47" stroke-width="2"')}
      ${path('M58 105l17 5 10 -10','none','stroke="#e5c37d" stroke-width="3"')}
      ${path('M58 111l17 3 -6 23 -6 10 -10 -3 -1 -12Z','#394e55','stroke="#1d3039" stroke-width="2"')}
      ${path('M52 131l17 3 -5 21 -13 -3z',paint('metal'),'stroke="#31434c" stroke-width="2"')}${path('M49 148l13 2 1 11 -5 6 -10 -3 -2 -8z','#82654a')}
      ${path('M50 140l6 -7 6 8 -6 8z','#70e0d8','stroke="#c0d4a7" stroke-width="2"')}
      ${path('M67 142l48 -3 2 10 -48 4Z','#70513e','stroke="#352f2b" stroke-width="2"')}${path('M89 142l13 -1 1 9 -13 1Z','#b89754','stroke="#f3d595" stroke-width="1.5"')}
      ${path('M73 149l11 1 -5 26 -9 7 -6 -5Z','#496263','stroke="#9f9a73" stroke-width="1.5"')}
      ${path('M103 149l11 -2 5 24 -9 9 -7 -8Z','#294751','stroke="#b19b6b" stroke-width="1.5"')}
      ${path('M117 92q12 -4 17 7l-1 11 -10 6 -11 -8Z',paint('metal'),'stroke="#263e44" stroke-width="2"')}
      ${path('M125 109l10 -5 8 13 17 -3 4 11 -23 9 -10 -5Z','#40525b','stroke="#253642" stroke-width="2"')}
      ${path('M144 117l15 -5 5 15 -17 5Z',paint('metal'),'stroke="#293943" stroke-width="2"')}
      ${path('M158 113l7 -5 7 4 3 8 -9 6 -7 -2Z','#9e7956')}
      <g class="weapon">${path('M161 126l-4 -3 16 -30 5 3Z','#584239','stroke="#d4bb81" stroke-width="1.5"')}${path('M161 94q7 1 13 6l11 -1 4 -4 -4 10 -9 2 -11 -7 -9 -1Z','#c6a459','stroke="#4b4436" stroke-width="1.6"')}${path('M173 96L207 22l16 -17 -4 23 -39 71Z','#c4d8d4','stroke="#576b76" stroke-width="1.5"')}${path('M223 5l-13 24 -34 69 4 1 39 -71Z','#8097a0')}${path('M209 28l-33 67','none','stroke="#f8f6db" stroke-width="1.4"')}</g>
      ${path('M87 48q0 -22 20 -23 20 -1 25 20l-2 11 5 6 -6 3 -2 9 -7 5 -14 -3 -11 -10 -6 -2Z','#d5a783','stroke="#594338" stroke-width="2"')}
      ${path('M87 55l-7 -7 3 -8 -6 2 7 -13 -4 -2 14 -5 -2 -5 17 2 11 -1 10 8 5 2 -4 11 -4 5 -6 -4 -4 -7 -5 7 -10 4 -3 14 -6 1 -2 -9z','#3b3635','stroke="#292d31" stroke-width="2"')}
      ${path('M88 35q11 -16 30 -12 M99 37l16 -12','none','stroke="#8d7155" stroke-width="2.3"')}${path('M117 50l9 -2 M123 58l1 -4 M125 69l-7 1','none','stroke="#473a34" stroke-width="2"')}${path('M101 65q7 9 15 10l9 -3 -4 7 -11 -2Z','#8b6450')}
      </g>`,'hero-art');
  }
  function slime(stage=1){
    const id=`jelly${++serial}`,ref=k=>`url(#${id}${k})`;
    const colors=[['#c2ed99','#67ae79','#216255','#b3f69a'],['#c2f3ed','#5ab7c9','#335275','#87f3ff'],['#dcc8f4','#a180c5','#4a4874','#bde5ff']][stage-1]||['#c2ed99','#67ae79','#216255','#b3f69a'];
    const [shine,body,base,gem]=colors;
    const crystal=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M0 0l-11 -26 5 -29 15 19 3 23Z',gem,'stroke="#55758e" stroke-width="1.5"')}${path('M-6 -55l6 35 12 7 -3 -23Z',shine)}${path('M0 -20l-11 -6 11 26 12 -13Z',body)}</g>`;
    const crown=`<g transform="rotate(9 123 63)">${path('M87 45l15 7 10 -22 9 16 14 -26 6 22 18 -16 -4 29 -64 11Z','#efd091','stroke="#997642" stroke-width="3"')}${path('M91 60l63 -12 2 10 -64 13Z','#be9751','stroke="#f6db99" stroke-width="2"')}${path('M120 55l5 -9 7 5 -5 9Z','#74c5ca')}${circle(112,31,3,'#fff0b9')}${circle(135,20,3,'#fff0b9')}</g>`;
    return svg('0 0 210 191',`<defs><radialGradient id="${id}gel" cx=".35" cy=".22" r=".86"><stop stop-color="${shine}"/><stop offset=".45" stop-color="${body}"/><stop offset="1" stop-color="${base}"/></radialGradient><radialGradient id="${id}core"><stop stop-color="#faffcf"/><stop offset=".4" stop-color="${gem}" stop-opacity=".8"/><stop offset="1" stop-color="${gem}" stop-opacity="0"/></radialGradient></defs><ellipse cx="106" cy="179" rx="76" ry="7" fill="#0b1720" opacity=".5"/>
      ${stage===2?crystal(129,81,.8)+crystal(143,87,.57):''}
      ${path('M15 145 Q15 130 31 115 Q35 107 39 92 Q52 49 93 44 Q128 39 146 64 Q161 81 166 102 Q170 118 187 133 Q204 150 190 165 Q181 173 166 171 Q151 185 131 177 Q113 183 98 177 Q72 185 53 174 Q28 178 20 165 Q11 159 15 145Z',ref('gel'),`stroke="${body}" stroke-width="3"`)}
      ${path('M22 149q8 18 32 15 14 11 34 6 15 7 36 1 23 8 38 -4 15 1 26 -8 -4 11 -22 12 -15 14 -35 6 -17 8 -32 0 -29 9 -45 -3 -25 5 -34 -9Z',base,'opacity=".62"')}
      ${path('M38 112 Q51 64 88 54 Q104 51 110 54 Q85 56 67 71 Q52 83 45 105Z','#f3ffe5','opacity=".52"')}
      ${path('M123 57q11 3 15 11 -12 -6 -18 -6Z','#f0fff4','opacity=".47"')}
      ${circle(119,135,27,ref('core'))}
      ${stage>1?path('M114 133l6 -11 8 8 -3 13 -8 2Z',gem,'opacity=".8"'):path('M113 135q7 -11 15 -8 -5 10 -15 8Z',gem,'opacity=".73"')}
      <g fill="#192f35"><ellipse cx="66" cy="108" rx="${stage===3?8:7}" ry="11" transform="rotate(7 66 108)"/><ellipse cx="100" cy="106" rx="7" ry="11"/></g>
      ${circle(64,104,2.4,'#fffbdb')}${circle(98,102,2.5,'#fffbdb')}
      ${stage===3?path('M55 94l19 6 M92 95l18 -9','none','stroke="#49415a" stroke-width="4" stroke-linecap="round"'):''}
      ${path(stage===3?'M76 124q6 -6 14 -3':'M77 120q6 5 12 -2','none','stroke="#33494a" stroke-width="3" stroke-linecap="round"')}
      ${many(12,i=>{const x=142+noise(i)*19,y=103+noise(i+121)*43;return circle(x,y,1.2+noise(i+563)*2,shine,'opacity=".65"');})}
      ${stage===1?`<g>${path('M102 46q-6 -14 -18 -18 18 -6 24 16 1 -15 16 -21 1 15 -17 23Z','#88b87c','stroke="#55836a" stroke-width="1.6"')}${path('M85 29l21 16 16 -20','none','stroke="#d3dfa2" stroke-width="1.2"')}</g>`:''}
      ${stage===3?crown:''}${stage===2?crystal(155,157,.5)+crystal(165,159,.33):''}`,'slime-art');
  }
  function rowan(){
    const id=`rowan${++serial}`;
    return svg('0 0 140 160',`<defs><linearGradient id="${id}" x2="1" y2="1"><stop stop-color="#839578"/><stop offset=".6" stop-color="#39594e"/><stop offset="1" stop-color="#213b3c"/></linearGradient></defs>
      <path d="M70 4Q128 12 130 76v44q-21 26 -60 36 -38 -10 -60 -36V76Q12 17 70 4Z" fill="#20383d" stroke="#bba672" stroke-width="2"/>
      ${circle(69,67,44,'#b6ab77','opacity=".2"')}
      ${path('M15 125q6 -23 32 -28l40 -3q33 4 40 31 -23 24 -58 30 -33 -10 -54 -30Z',`url(#${id})`)}
      ${path('M37 106l20 -12 19 10 23 -9 12 6 -31 31 -15 20Z','#52745e','stroke="#abac78" stroke-width="2"')}
      ${path('M44 55q-1 -28 23 -31 25 -5 34 19l-1 26 -6 17 -20 20 -20 -15 -10 -14Z','#bc9270','stroke="#6d5346" stroke-width="2"')}
      ${path('M40 72q-8 -11 -4 -21l-5 2 6 -15q-3 -15 10 -20l10 2q10 -8 23 -4l10 6 8 1 8 12 -1 13 5 9 -8 15 -7 -6 -2 -21 -9 -13 -9 9 -15 5 -12 -3 -4 24Z','#c1beb1','stroke="#777e74" stroke-width="2"')}
      ${path('M42 72l7 -7 6 11 8 4 10 -6 11 4 13 -11 4 -4 2 19 -7 18 -12 9 -6 17 -11 -5 -14 -8 -11 -18Z','#c9c5aa','stroke="#8d9485" stroke-width="2"')}
      ${path('M56 72q6 -7 15 0l4 3 8 -7 10 4 -4 8 -14 4 -12 -3Z','#dcd4b9')}
      ${path('M55 56q5 -5 13 -1 M80 54q8 -6 14 -1 M58 61q4 3 7 0 M81 61q5 3 9 -1 M74 60l-3 10 5 1 M67 84q7 3 14 -1 M49 87q4 14 13 20 M86 92l-10 20','none','stroke="#776a57" stroke-width="2.3" stroke-linecap="round"')}
      ${path('M16 125q17 -22 29 -25l8 35 -20 -4Z','#365951')}${path('M44 106l5 -5 9 5 -3 9 -8 -1Z','#d4b56e')}
      ${path('M106 133l5 -63 -4 -6 3 -10 10 -4 5 10 -7 14 -7 57Z','#795e43','stroke="#574435" stroke-width="2"')}${path('M110 64l0 -10 7 -9 6 10 -6 10Z','#93cfbc','stroke="#d5d393" stroke-width="1.5"')}`,'rowan-art');
  }
  function map(){
    const id=`map${++serial}`;
    const ridge=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M-49 12l15 -20 7 4 17 -28 8 6 8 -14 28 41 12 2 13 14Z','#5a7567','stroke="#abae83" stroke-width="1.4"')}${path('M-10 -32l0 24 -9 9 8 -4 -5 14 -18 -1Z M6 -40l-1 22 9 10 -1 -6 15 21 5 -5Z','#2a514a')}${path('M-17 -21l7 -11 8 6 -7 -1 -2 4 -3 -1Z M-2 -26l8 -14 11 17 -9 -5 -2 2 -3 -5Z','#d2c99b')}</g>`;
    const trees=(x,y,qty)=>many(qty,i=>{const tx=x+Math.round(noise(i+53)*80),ty=y+Math.round(i/qty*48),s=(.46+noise(i+88)*.36).toFixed(2);return `<g transform="translate(${tx} ${ty}) scale(${s})">${path('M0 -30l-5 11 3 -1 -8 12 5 -1 -8 11h11v5h4V2h11L5 -9l4 1 -7 -12 3 1Z','#234c44','stroke="#79947c" stroke-width="1"')}</g>`;});
    const compass=`<g transform="translate(75 77)" fill="none" stroke="#ddd09a"><circle r="24" opacity=".5"/><circle r="18" opacity=".45"/>${path('M0 -34l5 28 21 6 -21 4 -5 28 -5 -27 -23 -5 22 -6Z','#9ba383','stroke="#d4c390"')}${path('M0 -34v34l5 -6Z M0 32V0l-5 5Z','#ece0aa')}${circle(0,0,3,'#f3df9e')}</g>`;
    const dots=[[137,273],[330,192],[482,100]].map(([x,y],i)=>`<g transform="translate(${x} ${y})">${circle(0,0,12,'#263f40','stroke="#ddc68c" stroke-width="2"')}${circle(0,0,5,i===2?'#baa5cc':'#e1ca88')}</g>`).join('');
    return svg('0 0 600 390',`<defs><radialGradient id="${id}"><stop stop-color="#547664"/><stop offset="1" stop-color="#1e413e"/></radialGradient><pattern id="${id}grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M0 36V0H36" fill="none" stroke="#d9d19e" stroke-opacity=".09"/></pattern></defs><rect width="600" height="390" fill="url(#${id})"/><rect width="600" height="390" fill="url(#${id}grid)"/>
      ${many(6,i=>path(`M-25 ${125+i*6}q86 -48 152 -59t136 -48 M${354+i*11} 390q22 -64 100 -91t160 -78`,'none','stroke="#b4ba8c" opacity=".2" stroke-width="1.1"'))}
      ${path('M196 -10q-21 48 30 75t24 81q-14 29 19 61t-17 65q-79 39 -118 132','none','stroke="#acc2a0" opacity=".85" stroke-width="9"')}${path('M196 -10q-21 48 30 75t24 81q-14 29 19 61t-17 65q-79 39 -118 132','none','stroke="#506e76" stroke-width="6"')}
      ${ridge(358,53,.87)}${ridge(302,76,.76)}${ridge(379,89,.95)}${ridge(545,66,.69)}${ridge(551,132,.6)}
      ${trees(66,174,17)}${trees(150,113,15)}${trees(286,258,21)}${trees(420,210,23)}${trees(44,332,15)}
      ${path('M137 273Q167 239 213 242T287 216Q306 194 330 192Q382 188 385 158T431 130Q469 130 482 100','none','stroke="#2c493e" stroke-width="8" stroke-linecap="round"')}${path('M137 273Q167 239 213 242T287 216Q306 194 330 192Q382 188 385 158T431 130Q469 130 482 100','none','stroke="#dbc58c" stroke-width="2.8" stroke-dasharray="3 6" stroke-linecap="round"')}${dots}${compass}
      <rect x="13" y="13" width="574" height="364" rx="3" fill="none" stroke="#cebb88" stroke-opacity=".5"/><path d="M19 46V19h27 M554 19h27v27 M581 344v27h-27 M46 371H19v-27" fill="none" stroke="#d5c390" stroke-width="2"/>`,'atlas-art','xMidYMid slice');
  }
  return Object.freeze({forest,hero,slime,map,rowan});
})();
