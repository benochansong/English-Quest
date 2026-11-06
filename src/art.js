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
function sanctuary(stage,id) {
  const court=stage===3;
  const paint=name=>`url(#${id}${name})`;
  const grad=(name,a,b,c)=>`<linearGradient id="${id}${name}" x2=".16" y2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
  const line=(d,color,w=1,opacity=1)=>path(d,'none',`stroke="${color}" stroke-width="${w}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"`);
  const aura=(name,color)=>`<radialGradient id="${id}${name}"><stop stop-color="${color}" stop-opacity=".64"/><stop offset=".4" stop-color="${color}" stop-opacity=".19"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  const defs=`<defs>${grad('sky',...(court?['#171c38','#545076','#a59ab2']:['#172f48','#427f88','#a6d6bd']))}${grad('rock',...(court?['#81798d','#495067','#30384c']:['#728c87','#365f65','#1d414a']))}${grad('floor',...(court?['#707084','#465263','#222e3e']:['#819084','#465d62','#273d46']))}${grad('gem',...(court?['#e1c5f4','#b59cd8','#70689d']:['#e1f8e4','#81d6d8','#438baf']))}${grad('fall','#b1dee5','#85d5dc','#76b7b4')}${grad('water','#54928c','#77bebe','#325b6c')}${aura('halo',court?'#d1b3f8':'#b9f6dc')}${aura('lamp','#ffc873')}</defs>`;
  const gem=(x,y,size,tilt=0)=>`<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${size})">
    ${path('M0 0L-16 -32 -10 -86 4 -111 19 -79 22 -33 9 -2Z',paint('gem'),'stroke="#d1f7f1" stroke-opacity=".53" stroke-width="1"')}
    ${path('M-10 -86L4 -111l-1 45 -4 64 -15 -30Z',court?'#b89bcd':'#77bec7')}
    ${path('M4 -111l15 32 -16 13Z','#e3f4eb','opacity=".86"')}
    ${path('M3 -66l16 -13 3 46 -13 31 -10 2Z',court?'#61578d':'#397f9d','opacity=".82"')}
    ${line('M4 -110L3 -66 -1 -2 M-10 -86l13 20 16 -13 M-15 -35l15 13 21 -11',court?'#e2ccee':'#d1fcf0',1,.85)}
    ${path('M-8 -75l5 8 -4 23 -3 -7Z','#fffee7','opacity=".76"')}</g>`;
  function stone(x,y,size,lean=0) {
    return `<g transform="translate(${x} ${y}) rotate(${lean}) scale(${size})">
      ${path('M-24 0l4 -77 10 -25 16 -6 15 17 7 81 -10 10Z',paint('rock'),'stroke="#45565d" stroke-width="2"')}
      ${path('M-20 -77l10 -25 16 -6 -4 21 -16 77 -10 10Z',court?'#989199':'#8aa196')}
      ${path('M-7 -67l10 -12 9 10 -8 9z M2 -60l-3 15 9 9 M1 -45l-9 6', 'none',`stroke="${court?'#d3b7e7':'#a5e2cc'}" stroke-width="2" opacity=".8"`)}
      ${line('M11 -37l4 5 -5 7 3 9 M-12 -76l4 -6', '#405159',1.8)}
      ${path('M-29 2l9 -8 12 3 12 -4 14 5 13 6Z',court?'#58586d':'#5c7b6c')}</g>`;
  }
  const stars=many(40,i=>circle(Math.round(noise(i+8)*1400),Math.round(noise(i+493)*330),i%6?1:2,'#e0f5e0',`opacity="${.26+noise(i+11)*.42}"`));
  function spring() {
    const cliff=path('M0 0h350q40 41 24 92l46 21 -39 34 13 32 -64 20 -29 37 -73 8 -26 58 -89 -10 -40 23 -73 -1Z','#31545e')+
      path('M1400 0h-291l-38 27 -10 48 -56 12 -37 52 3 48 -58 14 -26 61 -82 12 -28 45h623Z','#43686d')+
      path('M0 0h228l-22 66 -55 30 -14 45 -47 17 -36 67 -54 6Z','#203f4b')+
      line('M168 90l-42 46 -36 15 M282 117l-28 33 -57 9 M1050 113l-43 51 -30 7 M951 208l-24 45 -63 14','#84a59a',4,.42);
    const distant=path('M221 313l67 -60 89 10 47 -50 61 6 73 -49 54 11 66 -32 67 17 44 -24 51 27 44 -13 48 22 74 -10 91 51 100 17 57 67v53H221Z','#527b7d')+
      path('M214 342l101 -59 71 4 48 -29 66 2 39 -36 60 15 52 -26 59 4 34 -19 55 15 40 -13 75 25 49 -6 47 28 79 -4 57 79Z','#3b6669')+
      path('M532 250l69 -27 71 8 32 -15 60 -3 31 -15 51 12 -28 15 -63 8 -53 19 -106 2 -20 11Z','#8ba69c');
    const ledge=path('M418 277l61 -34 53 -4 38 -18 41 5 39 -10 45 1 26 -14 56 -5 38 12 -17 19 -52 3 -54 20 -50 10 -32 1 -39 17 -47 -2 -38 16Z',paint('rock'))+
      line('M429 274l51 -27 51 -4 39 -17 41 5 39 -10 45 1 24 -13 57 -6 23 6','#a2b7a8',2,.8);
    const waterfall=`<g>${path('M611 244q12 1 38 -3l55 -13 56 -5q-24 43 -21 81t-19 66H585q26 -50 26 -126Z',paint('fall'))}
      ${path('M632 246q12 16 0 58t-12 65h23q-7 -30 4 -65t2 -65Z M686 234q3 23 -14 65t-13 66h12q-2 -29 16 -68t13 -65Z','#ddf5e7','opacity=".4"')}
      <g class="water-threads">${many(9,i=>{const x=616+i*14,y=246-i*2;return line(`M${x} ${y}q7 17 -6 58t-10 61`,'#d8fbef',i%3+1,.34);})}</g></g>`;
    const pool=path('M0 358q101 -21 216 -2t219 -7q150 -30 276 -15t301 -6q181 -21 388 12v135H0Z',paint('water'))+
      `<g class="spring-ripples">${many(34,i=>{const x=Math.round(noise(i+71)*1350),y=Math.round(356+noise(i+4)*84),w=10+Math.round(noise(i+920)*62);return line(`M${x} ${y}q${w*.45} -3 ${w} 0`,'#cceddb',1.1,.3);})}
      <ellipse cx="664" cy="356" rx="89" ry="6" fill="none" stroke="#ccede5" stroke-width="2" opacity=".65"/><ellipse cx="660" cy="363" rx="113" ry="9" fill="none" stroke="#bbecd9" opacity=".34"/></g>`;
    const shores=path('M0 394l135 3 82 19 124 6 98 16 174 -1 83 20 136 -9 101 -19 111 7 80 -21 140 -20 136 -3v208H0Z',paint('floor'))+
      line('M0 399l135 3 82 19 124 6 98 16 174 -1 83 20 136 -9 101 -19 111 7 80 -21 140 -20 136 -3','#a4c5ad',3,.75)+
      many(21,i=>{const x=Math.round(noise(i+187)*1400),y=Math.round(noise(i+134)*97+461);return path(`M${x} ${y}l21 -7 28 4 8 4 -41 3Z`,'#91a698','opacity=".33"');});
    const reeds=many(18,i=>{const x=60+i*76,y=401+noise(i)*14;if(x>486&&x<960)return '';return path(`M${x} ${y}q-2 -24 -18 -35 10 20 13 35 -12 -16 -22 -17 9 16 21 20 16 -6 19 -28 -12 9 -15 22 7 -24 5 -38 -8 15 -6 40Z`,'#395956');});
    return `${circle(725,185,240,paint('halo'))}${cliff}${distant}${ledge}${waterfall}${pool}${stone(376,356,1.35,-9)}${stone(431,350,.95,7)}${stone(919,342,1.06,9)}${gem(967,344,.92,18)}${gem(944,343,.56,-9)}${gem(999,343,.54,25)}${shores}${reeds}
      ${path('M35 449l14 -11 22 -1 12 -12 28 3 15 -7 17 14 21 -3 22 13 -23 9 -58 -1 -34 3Z M1122 422l21 -9 19 -4 13 -10 18 4 18 -7 21 15 16 -2 21 12 -31 7 -50 -2 -31 4Z','#425d64','stroke="#83938d" stroke-width="2"')}
      ${gem(109,436,1.48,-13)}${gem(140,439,.97,12)}${gem(80,444,.72,-29)}${gem(1176,417,1.21,11)}${gem(1201,420,.68,24)}${gem(1154,421,.75,-9)}
      ${line('M32 453l48 2 29 -3 46 -1 M1123 430l36 2 33 -4 46 3','#8ea8a0',2,.5)}
      ${many(4,i=>circle(617+i*33,355,31+i*4,paint('halo')))}
      ${path('M0 0h213q-21 30 -66 50t-85 64l-62 8z M1400 0h-152q21 44 64 58t88 55Z','#1f3e47')}`;
  }
  function courtHall() {
    const pillar=(x,y,scale,broken=false)=>`<g transform="translate(${x} ${y}) scale(${scale})">
      ${path(broken?'M-26 -147l13 -17 13 8 14 -12 9 18 1 149h-51Z':'M-27 -217H26V0h-53Z',paint('rock'),'stroke="#434858" stroke-width="2"')}
      ${path(broken?'M-22 -145l9 -12 3 2v151h-13Z':'M-22 -212h12V-3h-12Z','#929199','opacity=".65"')}
      ${line(broken?'M-5 -145V-12 M9 -147V-12':'M-5 -205V-12 M9 -205V-12','#343d50',3)}
      ${line('M-16 -92l12 10 -5 13 10 7 -8 11','#474957',1.8)}
      ${broken?'':path('M-36 -232h71l-5 13 -8 5h-45l-8 -5Z','#7a7b8b','stroke="#424a5c" stroke-width="2"')}
      ${path('M-29 -14h59l4 9 10 4v11h-89V0l11 -5Z','#666a7a','stroke="#414855" stroke-width="2"')}${line('M-42 0h83','#bbb0af',2,.7)}</g>`;
    const gate=path('M530 325V184Q534 99 699 28Q868 96 871 182v144h-22V182Q844 115 699 52Q555 114 551 184v141Z',paint('rock'),'stroke="#a497a6" stroke-width="3"')+
      path('M558 298V188Q561 122 699 62Q840 121 842 188v110h-12V190Q831 131 699 73Q570 131 570 190v108Z','#31364f')+
      line('M562 172Q591 110 699 67Q812 112 837 174','#d0b4ce',2,.8);
    const medallion=`<g transform="translate(700 178)"><circle r="79" fill="${paint('halo')}"/><g fill="none" stroke="#dbc7de" opacity=".65"><circle r="56"/><circle r="48" stroke-dasharray="2 6"/><path d="M-52 0h104 M0 -52v104 M-39 -36l78 72 M-39 36l78 -72" opacity=".5"/></g>${path('M-30 -10l16 9 14 -26 14 26 16 -9 -8 29h-44Z','#e1c8c1','opacity=".88"')}${path('M-22 25h44','none','stroke="#dfc6bf" stroke-width="2"')}</g>`;
    const archFeet=path('M511 325h53l4 9 11 4v7h-75v-8l9 -4Z M837 325h46l4 8 12 5v7h-71v-7l9 -5Z','#6c7080','stroke="#aaa2ab" stroke-width="2"');
    const voussoirs=many(12,i=>{const left=i<6,t=(i%6+1)/7;const x=left?530+167*t*t:868-167*t*t,y=180-150*t;
      return line(`M${x} ${y}l${left?18:-18} 10`,'#555369',2.7,.75);});
    const arches=path('M-16 -8h147q41 94 149 142 133 -46 172 -137h76q-15 140 -242 182Q65 140 -16 -8Z M900 -5h72q38 103 153 141 112 -38 154 -141h121q-33 127 -270 187Q954 141 900 -5Z',paint('rock'))+
      line('M95 3q44 104 188 155 160 -42 203 -157 M931 2q60 119 194 156 163 -48 207 -156','#a79da3',4,.65);
    const rubble=many(16,i=>{const left=i%2===0,x=left?85+noise(i)*392:883+noise(i)*400,y=335+noise(i+149)*51,w=17+noise(i+325)*26;return path(`M${x} ${y}l${w/4} -11 ${w*.68} -4 ${w*.28} 7 -4 8 -${w*.68} 4Z`,i%3?'#5f6471':'#85848b','stroke="#414957" stroke-width="1"');});
    const dais=path('M0 390Q283 361 552 375T995 365Q1214 350 1400 375v225H0Z',paint('floor'))+
      many(6,i=>line(`M${-150+i*300} 600L${530+i*64} 365`,'#9492a0',2,.32))+
      many(3,i=>line(`M0 ${406+i*59} Q648 ${432+i*78} 1400 ${400+i*64}`,'#a4a1a7',2,.25))+
      `<g fill="none" stroke="#dcc3ed" opacity=".58"><ellipse cx="699" cy="450" rx="326" ry="47" stroke-width="2.4"/><ellipse cx="699" cy="450" rx="310" ry="41"/><ellipse cx="699" cy="450" rx="270" ry="32" stroke-dasharray="5 11"/><path d="M442 449l257 -38 254 38 -254 38Z M504 430l387 39 M891 430l-387 39"/></g>`;
    return `${circle(700,200,274,paint('halo'))}
      ${path('M0 331l96 -125 81 8 68 -86 64 54 35 -23 89 85 102 -59 42 40 60 -21 68 26 94 -42 45 17 69 -73 54 42 46 -35 95 66 94 -56 98 54v159H0Z','#4a4864')}
      ${pillar(435,337,.69,true)}${pillar(966,337,.69,true)}${gate}${voussoirs}${archFeet}${medallion}${arches}${pillar(275,356,.91)}${pillar(1124,357,.91)}
      ${pillar(116,389,1.51,true)}${pillar(1284,389,1.48,true)}
      ${path('M548 338h303l21 12H525Z M525 354h346l28 12H497Z M498 369h398l29 13H465Z','#747886','stroke="#b1a7ab" stroke-width="1.3"')}
      ${rubble}${dais}${gem(441,369,1.16,-11)}${gem(417,368,.63,-30)}${gem(461,369,.66,13)}${gem(944,368,1.11,12)}${gem(964,369,.8,24)}
      ${[310,1081].map(x=>`<g transform="translate(${x} 357)">${circle(0,-63,51,paint('lamp'))}${path('M-13 0l7 -11 1 -31 -13 -13 1 -5h34l-1 7 -13 11 1 32 9 10Z','#554e57','stroke="#b8a596" stroke-width="2"')}${path('M-9 -60q-8 -11 1 -20l2 7q7 -10 5 -18 14 15 8 31Z','#efd2a1')}</g>`).join('')}`;
  }
  return svg('0 0 1400 600',`${defs}<rect width="1400" height="600" fill="${paint('sky')}"/>${stars}${court?courtHall():spring()}
    <g class="forest-mist">${path('M-25 354Q291 307 536 344T986 331Q1195 310 1430 332Q1170 322 1004 345T539 358Q296 327 -25 376Z',court?'#e4d8ef':'#e3f1dc','opacity=".14"')}</g>
    ${many(15,i=>{const x=170+Math.round(noise(i+127)*1060),y=199+Math.round(noise(i+41)*169);return `<g class="firefly" style="--delay:-${i%6}s">${circle(x,y,5,paint('halo'))}${circle(x,y,1.4,court?'#f2d6ff':'#bdffff')}</g>`;})}`,`arena-bg ${court?'hollow-court':'crystal-spring'}`,'xMidYMid slice');
}
function dewfallGrove(id){
  const gold='#edca80';
  const bark=(x,y,scale)=>`<g transform="translate(${x} ${y}) scale(${scale})">
    ${path('M-60 0q22 -31 26 -65 9 -86 -2 -164l-26 -50 -48 -34 39 14 32 28 -8 -56 -32 -57 39 35 18 52 9 27q11 -63 -14 -114l28 39 8 39 17 -47 28 -29 -15 32 -5 42 -23 72q3 30 28 40l39 -21 41 -47 -14 39 -54 51 -39 9q-11 83 21 109l52 15 -41 5 -36 -6 -15 7 -41 -5 -47 15Z','#38564b')}
    ${path('M-32 -12q38 -73 21 -172 -16 -42 -9 -86 19 52 30 73 -1 -26 13 -54 -8 46 1 70 24 -2 51 -23 -15 31 -60 36 -8 90 13 134l30 23 -48 -13 -23 9 -16 8Z','#75826a')}
    ${path('M-16 -12q26 -57 11 -121l-4 -41 11 27 1 38 5 -32q7 57 -7 103Z','#aba981','opacity=".67"')}
  </g>`;
  const mushrooms=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M-3 1q2 -10 -2 -18h5q6 10 4 18Z','#ced2a4')}${path('M-18 -18q8 -16 19 -15 9 1 17 14 -17 5 -36 1Z','#7fc4ae','stroke="#dbe5ba" stroke-width="1.7"')}${circle(-6,-25,2,'#e6eed4')}${circle(4,-29,1.5,'#e6eed4')}</g>`;
  const oakCrown=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})">
    ${path('M-106 4q6 -19 24 -16 -8 -22 17 -33 10 -22 30 -10 6 -30 28 -23 17 -17 37 1 29 -5 31 17 27 -2 27 19 23 -5 35 15l-10 16 -17 1 -7 9 -16 -3 -20 11 -11 -6 -27 4 -17 -7 -19 7 -23 -7 -18 3Z','#56745b')}
    ${path('M-101 -3q8 -12 25 -10l-6 -5 20 -12 9 4 10 -13 17 6 16 -7 -11 14 -17 3 -7 12 -22 0 -10 8Z','#849569')}
    ${path('M-5 -36q8 -14 21 -12l10 -9 12 6 20 -1 7 13 16 2 -1 7 -21 -4 -13 6 -16 -8 -16 5Z','#778e65')}
    ${path('M-62 7l21 -7 18 2 18 -9 -4 12 -19 8 -13 -4 -10 4Z M44 -13l11 2 8 -7 12 3 -5 7 -16 3Z','#42654e')}
    </g>`;
  return `${bark(423,387,.83)}${bark(998,377,.72)}
    ${oakCrown(341,133,.76)}${oakCrown(457,117,.96)}${oakCrown(402,103,.81)}${oakCrown(991,117,.84)}${oakCrown(1045,145,.84)}${oakCrown(946,139,.61)}
    ${many(16,i=>{const x=i<8?87+i*59:831+(i-8)*66,y=35+noise(i+15)*73;return path(`M${x-83} ${y-35}q19 -41 51 -33 18 -48 51 -31 46 -20 84 15l29 25 -14 15 12 4 -43 18 -18 -5 -21 12 -27 -4 -19 12 -66 -13Z`,i%3===0?'#54745c':'#456956',`opacity="${.5+noise(i)*.23}"`);})}
    ${path('M0 0h454l-36 46 -19 -3 -16 17 -39 -3 -26 17 -48 -9 -16 16 -42 -9 -31 16 -32 -8 -47 24 -29 -11 -38 15 -35 -9Z M1400 0h-374l28 31 39 6 12 19 40 -1 20 13 34 -4 26 12 32 -6 22 15 43 -2 40 19 38 -1Z','#294c42')}
    <g opacity=".65">${many(7,i=>path(`M${351+i*19} 10l${8+i*2} 0 ${260+i*4} ${347-i*17} -${16+i} 4Z`,gold,'opacity=".075"'))}</g>
    ${many(27,i=>{const x=i<14?16+i*25:1064+(i-14)*27,y=48+noise(i+9)*28;return path(`M${x} ${y} q-5 16 -15 19 1 -13 15 -19 m0 0 q9 2 10 12 -10 -1 -10 -12Z`,'#a8b77c','opacity=".75"');})}
    ${mushrooms(389,452,.68)}${mushrooms(402,453,.4)}${mushrooms(1000,438,.56)}${mushrooms(1021,440,.82)}
    ${many(19,i=>{const x=45+i*72,y=450+noise(i+20)*58;return path(`M${x} ${y}q-6 -19 -18 -27 5 18 13 27 -13 -14 -23 -13 9 15 26 16 10 -9 13 -27 -11 9 -11 19 4 -25 -1 -32 -5 12 1 37Z`,i%2?'#6d8962':'#4b7157','opacity=".78"');})}`;
}
  function forest(stage=1,title=false){
    if (!title && stage > 1) return sanctuary(stage, `stage${++serial}`);
    const id=`land${++serial}`, [sky,mid,horizon,hill,far,wood,trunk,dark,leaf,glow] = title ? palettes[0] : ['#526c71','#94a995','#f1d3a0','#84998a','#658779','#426955','#23473d','#153731','#a3ad76','#f2d79b'];
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
    const moonX=title?967:705,moonY=title?130:109;
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
    return svg('0 0 1400 600',`${defs}<rect width="1400" height="600" fill="${ref('sky')}"/>${title?stars+stars4:''}<g class="painted-moon">${circle(moonX,moonY,190,ref('moon'))}${circle(moonX,moonY,25,'#f2e3b1','opacity=".93"')}${circle(moonX,moonY,35,'none',`stroke="${glow}" stroke-opacity=".33" stroke-width="1"`)}</g>${ridges}<g class="painted-keep">${castle(castleX,289,.86)}</g>${banks}${turf}${title?'':dewfallGrove(id)}<g class="forest-mist">${path('M-30 361 Q220 330 437 363 T862 351 Q1057 325 1430 344 Q1138 335 895 365 T447 379 Q217 352 -30 376Z',glow,'opacity=".09"')}${path('M484 400Q711 371 874 379T1213 359Q1106 393 879 387T484 400Z',glow,'opacity=".12"')}</g>${path('M255 0h60l405 470 -90 -10Z M358 0h21l304 315Z M1044 0h32L801 409 740 448Z',ref('ray'))}${bottom}<g class="painted-traveler">${traveler}</g><g class="painted-left">${foregroundTree(0,1)}</g><g class="painted-right">${foregroundTree(1400,-.95)}</g>${herbs(90,482,1)}${herbs(1260,476,1.14,-1)}${herbs(1300,507,.67)}${crystal(title?1169:1060,455,.6)}${crystal(title?1184:1077,458,.35)}${crystal(176,472,.5)}${motes}`,title?'title-art':'arena-bg','xMidYMid slice');
  }
  function hero(outfit={}){
    const id=`hero${++serial}`,paint=x=>`url(#${id}${x})`;
    const defs=`<defs><linearGradient id="${id}blue" x2="1" y2="1"><stop stop-color="#58808a"/><stop offset=".42" stop-color="#294b60"/><stop offset="1" stop-color="#112236"/></linearGradient><linearGradient id="${id}metal" x2=".8" y2="1"><stop stop-color="#ebdfaf"/><stop offset=".4" stop-color="#a0b6b2"/><stop offset=".55" stop-color="#596b70"/><stop offset="1" stop-color="#293c4b"/></linearGradient><linearGradient id="${id}cape" x2=".9" y2=".8"><stop stop-color="#294251"/><stop offset=".63" stop-color="#22786f"/><stop offset="1" stop-color="#172b39"/></linearGradient></defs>`;
    return svg('0 0 230 264',`${defs}${outfit.defs||''}${outfit.aura||''}<ellipse cx="105" cy="255" rx="68" ry="6" fill="#071817" opacity=".48"/>
      <g stroke-linejoin="round" stroke-linecap="round">
      <g class="hero-cape">${outfit.cape||`
      ${path('M76 86 Q54 98 51 126 Q46 152 20 170 Q42 172 47 166 Q35 181 22 186 Q60 190 83 167 L99 131Z',paint('cape'),'stroke="#162c39" stroke-width="2"')}
      ${path('M85 87q-17 -8 -33 4 -17 13 -47 6 12 16 39 13 -10 8 -27 8 26 10 48 -9l21 -10Z','#2e776d','stroke="#214b4c" stroke-width="1.3"')}
      ${path('M9 100q24 11 41 -1t34 -10 M23 118q19 5 35 -8','none','stroke="#baaa77" stroke-width="1.5"')}
      ${path('M77 98Q62 121 59 146T36 177 M73 116Q66 149 53 158','none','stroke="#72b3a0" opacity=".52" stroke-width="2"')}
      ${path('M68 108Q53 156 26 170q15 -2 28 -13 -4 13 -28 28 26 -7 46 -26Z','#34695f')}
      ${path('M27 183q26 -6 41 -32 M69 103l-7 26','none','stroke="#d6be80" stroke-width="1.5"')}`}</g>
      ${path('M84 154 L112 157 120 195 135 230 129 238 119 233 99 208 91 195 72 177Z','#243440','stroke="#12222c" stroke-width="3"')}
      ${path('M113 196l10 -4 14 34 -9 8 -12 -13z','#536168')}${path('M122 227l13 -7 6 15 12 7q3 6 -3 7l-26 -8z','#573d32','stroke="#263036" stroke-width="2"')}
      ${path('M77 157l26 6 -7 38 -20 36 -16 -3 8 -39z',paint('blue'),'stroke="#15242a" stroke-width="3"')}
      ${path('M71 202l18 4 -12 28 -16 -1z',paint('metal'))}${path('M62 224l18 5 -7 16 -1 9 -30 1 -1 -5 14 -8z','#503b33','stroke="#222c30" stroke-width="2"')}
      ${path('M70 197l10 -6 15 4 -9 13 -18 -4Z',paint('metal'),'stroke="#475860" stroke-width="1.3"')}
      ${path('M61 227l17 4 M57 235l18 5 M120 217l12 -5 M123 224l12 -5','none','stroke="#b18d62" stroke-width="2.5"')}
      <g class="hero-torso">
      ${path('M111 69l-1 15 13 9 -13 18 -34 -14 11 -17 7 -12Z','#ba8465')}
      ${path('M79 87l16 -9 16 8 7 1 8 12 -9 35 6 24 -16 13 -33 -6 -8 -8 7 -28 -6 -23Z',paint('blue'),'stroke="#162d35" stroke-width="3"')}
      ${path('M83 92l12 4 19 -5 7 9 -9 26 -17 8 -18 -13 -4 -21Z',paint('metal'),'stroke="#273f47" stroke-width="2"')}
      ${path('M78 105l18 13 20 -9 -4 12 -17 9 -16 -11Z','#354f58')}${path('M80 101l15 10 22 -12','none','stroke="#e3cf96" stroke-width="2"')}
      ${path('M90 100l6 4 8 -6 -4 10 -5 5 -4 -5Z','#e3c581','stroke="#5c6662" stroke-width=".9"')}
      ${path('M76 123l17 10 18 -7 -1 5 -16 7 -18 -9Z M74 133l18 7 18 -6 -1 4 -16 6 -19 -6Z','#668087','stroke="#334953" stroke-width="1"')}
      ${path('M82 82l11 5 18 -5 6 4 -8 11 -15 4 -21 -9Z','#32796f','stroke="#244a47" stroke-width="2"')}
      ${path('M73 87Q59 88 57 102l1 9 17 4 13 -13 -1 -10Z',paint('metal'),'stroke="#293e47" stroke-width="2"')}
      ${path('M58 105l17 5 10 -10','none','stroke="#e5c37d" stroke-width="3"')}
      ${path('M62 99l4 -6 9 -2 6 3 -6 1 -2 3 -3 -1 -1 4Z','#f1d599')}
      <g class="spell-arm">
      ${path('M58 111l17 3 -6 23 -6 10 -10 -3 -1 -12Z','#394e55','stroke="#1d3039" stroke-width="2"')}
      ${path('M52 131l17 3 -5 21 -13 -3z',paint('metal'),'stroke="#31434c" stroke-width="2"')}${path('M49 148l13 2 1 11 -5 6 -10 -3 -2 -8z','#82654a')}
      ${path('M50 140l6 -7 6 8 -6 8z','#70e0d8','stroke="#c0d4a7" stroke-width="2"')}
      ${path('M50 151l10 3 -1 3 -10 -3Z','#b99f74')}${outfit.offhand||''}</g>
      ${path('M67 142l48 -3 2 10 -48 4Z','#70513e','stroke="#352f2b" stroke-width="2"')}${path('M89 142l13 -1 1 9 -13 1Z','#b89754','stroke="#f3d595" stroke-width="1.5"')}
      ${path('M73 149l11 1 -5 26 -9 7 -6 -5Z','#496263','stroke="#9f9a73" stroke-width="1.5"')}
      ${path('M103 149l11 -2 5 24 -9 9 -7 -8Z','#294751','stroke="#b19b6b" stroke-width="1.5"')}
      ${path('M72 150l-13 -1 -6 23 16 7 7 -26Z','#693f30','stroke="#392e2b" stroke-width="1.7"')}
      ${path('M60 151l11 3 -3 13 -11 -3Z','#855637','stroke="#c29b66" stroke-width="1"')}
      ${path('M64 153l3 1 -3 11 -3 -1Z','#d0b478')}
      ${path('M106 150l3 17 4 4 3 -5 -2 -16Z','#477578','stroke="#bea778" stroke-width="1"')}
      ${outfit.armor||''}
      <g class="sword-arm">
      ${path('M117 92q12 -4 17 7l-1 11 -10 6 -11 -8Z',paint('metal'),'stroke="#263e44" stroke-width="2"')}
      ${path('M125 109l10 -5 8 13 17 -3 4 11 -23 9 -10 -5Z','#40525b','stroke="#253642" stroke-width="2"')}
      ${path('M144 117l15 -5 5 15 -17 5Z',paint('metal'),'stroke="#293943" stroke-width="2"')}
      ${path('M158 113l7 -5 7 4 3 8 -9 6 -7 -2Z','#9e7956')}
      <g class="weapon">${outfit.weapon||`${path('M161 126l-4 -3 16 -30 5 3Z','#584239','stroke="#d4bb81" stroke-width="1.5"')}${path('M161 94q7 1 13 6l11 -1 4 -4 -4 10 -9 2 -11 -7 -9 -1Z','#c6a459','stroke="#4b4436" stroke-width="1.6"')}${path('M173 96L207 22l16 -17 -4 23 -39 71Z','#c4d8d4','stroke="#576b76" stroke-width="1.5"')}${path('M223 5l-13 24 -34 69 4 1 39 -71Z','#8097a0')}${path('M209 28l-33 67','none','stroke="#f8f6db" stroke-width="1.4"')}${path('M176 91l9 -22 3 1 -9 23Z','#e8ebcd')}${path('M183 69l5 -6 -1 10 -5 6Z','#f4d39b')}${path('M158 101q-8 -4 -4 -12l5 7 10 1 6 4 9 -2 7 -10q2 13 -9 16l-10 2 -7 -7Z','#c7a258','stroke="#725c40" stroke-width="1"')}${path('M166 109l6 3 M164 115l5 2','none','stroke="#dbc08b" stroke-width="1.5"')}`}</g>
      ${path('M154 122l-6 -3 -2 2 4 7 9 -2Z','#6b828a','stroke="#b2c5c1" stroke-width=".9"')}
      ${path('M162 124l-3 2 -3 -4 3 -4 4 1Z','#8ed1d0','stroke="#dac18a" stroke-width="1.4"')}
      </g><g class="hero-head">
      ${path('M87 48q0 -22 20 -23 20 -1 25 20l-2 11 5 6 -6 3 -2 9 -7 5 -14 -3 -11 -10 -6 -2Z','#d5a783','stroke="#594338" stroke-width="2"')}
      ${path('M87 55l-7 -7 3 -8 -6 2 7 -13 -4 -2 14 -5 -2 -5 17 2 11 -1 10 8 5 2 -4 11 -4 5 -6 -4 -4 -7 -5 7 -10 4 -3 14 -6 1 -2 -9z','#3b3635','stroke="#292d31" stroke-width="2"')}
      ${path('M89 47q4 3 7 0l2 5 -2 8 -4 -3Z','#be9374')}${path('M99 48l10 -3 2 -8 6 6 6 -6 7 4 2 -5 -9 -9 -14 5 -10 11Z','#544236')}
      ${path('M98 29l12 -6 -6 6 12 -4 -11 9 -6 2Z','#79604b')}
      ${path('M101 57q7 7 15 6l-3 6 -10 -3Z','#c29474')}
      ${path('M119 54q4 -2 8 -1l-2 3 -5 1Z','#e8d5bb')}${circle(123.4,54.8,1.45,'#354a45')}
      ${path('M88 35q11 -16 30 -12 M99 37l16 -12','none','stroke="#8d7155" stroke-width="2.3"')}${path('M117 50l9 -2 M123 58l1 -4 M125 69l-7 1','none','stroke="#473a34" stroke-width="2"')}${path('M101 65q7 9 15 10l9 -3 -4 7 -11 -2Z','#8b6450')}
      ${outfit.head||''}</g></g></g>`,outfit.id?'hero-art rpg-hero rpg-'+outfit.id:'hero-art');
  }
  function slime(stage=1){
    const id=`jelly${++serial}`,ref=k=>`url(#${id}${k})`;
    const colors=[['#c2ed99','#67ae79','#216255','#b3f69a'],['#c2f3ed','#5ab7c9','#335275','#87f3ff'],['#dcc8f4','#a180c5','#4a4874','#bde5ff']][stage-1]||['#c2ed99','#67ae79','#216255','#b3f69a'];
    const [shine,body,base,gem]=colors;
    const auraRing=stage===3?`<g class="boss-aura" transform="translate(104 109)" fill="none" stroke="#d6b8f0"><ellipse rx="94" ry="47" stroke-dasharray="3 10" opacity=".55"/><ellipse rx="83" ry="40" transform="rotate(-27)" opacity=".34"/></g>`:'';
    const satellites=stage===2?many(5,i=>`<g transform="translate(${25+i*40} ${78+(i%3)*21})"><g class="crystal-orbit" style="--delay:-${i*.71}s">${path('M0 -5l3 5 -3 5 -3 -5Z',gem,'opacity=".8"')}</g></g>`):'';
    const crystal=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M0 0l-11 -26 5 -29 15 19 3 23Z',gem,'stroke="#55758e" stroke-width="1.5"')}${path('M-6 -55l6 35 12 7 -3 -23Z',shine)}${path('M0 -20l-11 -6 11 26 12 -13Z',body)}</g>`;
    const crown=`<g transform="rotate(-3 123 63)">${path('M85 39l18 12 7 -26 13 18 13 -34 10 27 19 -19 -8 39 -65 12Z','#efd091','stroke="#997642" stroke-width="3"')}${path('M91 60l63 -12 2 10 -64 13Z','#be9751','stroke="#f6db99" stroke-width="2"')}${path('M120 55l5 -9 7 5 -5 9Z','#74c5ca')}${path('M96 56l10 4 6 -10 10 3 5 -11 7 5 9 -9 6 1','none','stroke="#9c7744" stroke-width="1.3"')}${circle(110,25,2.4,'#fff0b9')}${circle(136,9,3,'#fff0b9')}${circle(164,17,2,'#fbe7ac')}${many(5,i=>circle(99+i*12,62-i*2,1.6,'#ffecb3'))}</g>`;
    return svg('0 0 210 191',`<defs><radialGradient id="${id}gel" cx=".35" cy=".22" r=".86"><stop stop-color="${shine}"/><stop offset=".45" stop-color="${body}"/><stop offset="1" stop-color="${base}"/></radialGradient><radialGradient id="${id}core"><stop stop-color="#faffcf"/><stop offset=".4" stop-color="${gem}" stop-opacity=".8"/><stop offset="1" stop-color="${gem}" stop-opacity="0"/></radialGradient></defs><ellipse cx="106" cy="179" rx="76" ry="7" fill="#0b1720" opacity=".5"/>
      ${auraRing}${satellites}<g class="gel-body">${stage===2?crystal(125,77,1.03)+crystal(145,88,.83)+crystal(153,100,.61):''}
      ${path('M15 145 Q15 130 31 115 Q35 107 39 92 Q52 49 93 44 Q128 39 146 64 Q161 81 166 102 Q170 118 187 133 Q204 150 190 165 Q181 173 166 171 Q151 185 131 177 Q113 183 98 177 Q72 185 53 174 Q28 178 20 165 Q11 159 15 145Z',ref('gel'),`stroke="${body}" stroke-width="2.4" fill-opacity=".91"`)}
      ${path('M22 149q8 18 32 15 14 11 34 6 15 7 36 1 23 8 38 -4 15 1 26 -8 -4 11 -22 12 -15 14 -35 6 -17 8 -32 0 -29 9 -45 -3 -25 5 -34 -9Z',base,'opacity=".62"')}
      ${path('M38 112 Q51 64 88 54 Q104 51 110 54 Q85 56 67 71 Q52 83 45 105Z','#f3ffe5','opacity=".52"')}
      ${path('M123 57q11 3 15 11 -12 -6 -18 -6Z','#f0fff4','opacity=".47"')}
      ${path('M39 145q5 -40 24 -57 -11 20 -12 40 -1 18 -12 17Z','#deffdf','opacity=".16"')}
      ${path('M22 150q26 16 61 6 28 -9 54 -1 18 5 36 -2 -13 11 -40 8 -24 -6 -49 0 -35 13 -62 -7Z',shine,'opacity=".28"')}
      <g class="jelly-core">
      ${circle(119,135,27,ref('core'))}
      ${stage>1?path('M114 133l6 -11 8 8 -3 13 -8 2Z',gem,'opacity=".8"'):path('M113 135q7 -11 15 -8 -5 10 -15 8Z',gem,'opacity=".73"')}
      ${stage>1?path('M109 135l8 -17 10 -4 8 13 -6 16 -11 5Z',gem,'opacity=".8"')+path('M117 118l3 15 -2 15 11 -5 -8 -10 14 -6 -8 -13Z',shine,'opacity=".8"'):''}</g>
      <g class="jelly-eyes">
      <g fill="#192f35"><ellipse cx="66" cy="108" rx="${stage===3?8:7}" ry="11" transform="rotate(7 66 108)"/><ellipse cx="100" cy="106" rx="7" ry="11"/></g>
      ${circle(64,104,2.4,'#fffbdb')}${circle(98,102,2.5,'#fffbdb')}
      </g>
      ${stage===3?path('M55 94l19 6 M92 95l18 -9','none','stroke="#49415a" stroke-width="4" stroke-linecap="round"'):''}
      ${path(stage===3?'M76 124q6 -6 14 -3':'M77 120q6 5 12 -2','none','stroke="#33494a" stroke-width="3" stroke-linecap="round"')}
      ${many(12,i=>{const x=142+noise(i)*19,y=103+noise(i+121)*43;return circle(x,y,1.2+noise(i+563)*2,shine,'opacity=".65"');})}
      ${stage===1?`<g>${path('M102 46q-6 -14 -18 -18 18 -6 24 16 1 -15 16 -21 1 15 -17 23Z','#88b87c','stroke="#55836a" stroke-width="1.6"')}${path('M85 29l21 16 16 -20','none','stroke="#d3dfa2" stroke-width="1.2"')}</g>`:''}
      ${stage===3?path('M138 86q21 0 30 33l17 26 -9 8 -12 -6 -8 -32Z','#625684','stroke="#c4a9be" stroke-width="1.5"')+path('M135 90q18 18 27 42 M146 95q14 9 20 26','none','stroke="#c9af81" stroke-width="2"')+circle(138,92,5,'#dabe81')+circle(138,92,2.5,'#9de5ef'):''}
      ${stage===3?crown:''}${stage===2?crystal(155,157,.5)+crystal(165,159,.33):''}</g>`,'slime-art');
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
      <g class="expression-rowan">${path('M55 56q5 -5 13 -1 M80 54q8 -6 14 -1 M58 61q4 3 7 0 M81 61q5 3 9 -1 M74 60l-3 10 5 1 M67 84q7 3 14 -1 M49 87q4 14 13 20 M86 92l-10 20','none','stroke="#776a57" stroke-width="2.3" stroke-linecap="round"')}</g>
      ${path('M16 125q17 -22 29 -25l8 35 -20 -4Z','#365951')}${path('M44 106l5 -5 9 5 -3 9 -8 -1Z','#d4b56e')}
      ${path('M106 133l5 -63 -4 -6 3 -10 10 -4 5 10 -7 14 -7 57Z','#795e43','stroke="#574435" stroke-width="2"')}${path('M110 64l0 -10 7 -9 6 10 -6 10Z','#93cfbc','stroke="#d5d393" stroke-width="1.5"')}`,'rowan-art');
  }
  function map(){
    const id=`map${++serial}`;
    const ridge=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M-49 12l15 -20 7 4 17 -28 8 6 8 -14 28 41 12 2 13 14Z','#5a7567','stroke="#abae83" stroke-width="1.4"')}${path('M-10 -32l0 24 -9 9 8 -4 -5 14 -18 -1Z M6 -40l-1 22 9 10 -1 -6 15 21 5 -5Z','#2a514a')}${path('M-17 -21l7 -11 8 6 -7 -1 -2 4 -3 -1Z M-2 -26l8 -14 11 17 -9 -5 -2 2 -3 -5Z','#d2c99b')}</g>`;
    const trees=(x,y,qty)=>many(qty,i=>{const tx=x+Math.round(noise(i+53)*80),ty=y+Math.round(i/qty*48),s=(.46+noise(i+88)*.36).toFixed(2);return `<g transform="translate(${tx} ${ty}) scale(${s})">${path('M0 -30l-5 11 3 -1 -8 12 5 -1 -8 11h11v5h4V2h11L5 -9l4 1 -7 -12 3 1Z','#234c44','stroke="#79947c" stroke-width="1"')}</g>`;});
    const compass=`<g transform="translate(75 77)" fill="none" stroke="#ddd09a"><circle r="24" opacity=".5"/><circle r="18" opacity=".45"/>${path('M0 -34l5 28 21 6 -21 4 -5 28 -5 -27 -23 -5 22 -6Z','#9ba383','stroke="#d4c390"')}${path('M0 -34v34l5 -6Z M0 32V0l-5 5Z','#ece0aa')}${circle(0,0,3,'#f3df9e')}</g>`;
    const atlasLandmarks=`<g stroke-linejoin="round">
      ${path('M96 262q-5 -18 -2 -33l-20 -14 13 1 -8 -10 20 9 6 -16 5 13 18 -13 -8 14 13 -1 -19 13q-5 19 4 35l10 6 -16 -2 -9 3 3 -5Z','#5e8167','stroke="#b9b48a" stroke-width="1.6"')}
      ${path('M298 184q8 -17 22 -13l11 -12 10 9 14 -6 12 9 14 5q-12 8 -31 7l-24 5Z','#68979b','stroke="#bfc79c" stroke-width="1.4"')}
      ${path('M339 172l-5 -17 4 -15 7 11 -2 20Z M346 171l3 -12 7 -7 -1 14 -6 7Z','#b6d6c8','stroke="#397477" stroke-width="1.1"')}
      ${path('M453 91l-3 -21 7 -3 3 21 7 -1 -1 -35 8 -5 10 7 -1 29 7 -2 1 -26 7 3 2 26 9 6 -17 1 -23 6Z','#667278','stroke="#c4b892" stroke-width="1.4"')}
      ${path('M451 70l-4 1 5 -14 9 10 -4 2 M463 54l9 -18 15 16 -5 2 -9 -5 -8 6Z M488 57l8 -12 6 15Z','#a0a493','stroke="#c9b88e" stroke-width="1.1"')}
      </g>`;
    return svg('0 0 600 390',`<defs><radialGradient id="${id}"><stop stop-color="#547664"/><stop offset="1" stop-color="#1e413e"/></radialGradient><pattern id="${id}grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M0 36V0H36" fill="none" stroke="#d9d19e" stroke-opacity=".09"/></pattern></defs><rect width="600" height="390" fill="url(#${id})"/><rect width="600" height="390" fill="url(#${id}grid)"/>
      ${many(6,i=>path(`M-25 ${125+i*6}q86 -48 152 -59t136 -48 M${354+i*11} 390q22 -64 100 -91t160 -78`,'none','stroke="#b4ba8c" opacity=".2" stroke-width="1.1"'))}
      ${path('M196 -10q-21 48 30 75t24 81q-14 29 19 61t-17 65q-79 39 -118 132','none','stroke="#acc2a0" opacity=".85" stroke-width="9"')}${path('M196 -10q-21 48 30 75t24 81q-14 29 19 61t-17 65q-79 39 -118 132','none','stroke="#506e76" stroke-width="6"')}
      ${ridge(358,53,.87)}${ridge(302,76,.76)}${ridge(379,89,.95)}${ridge(545,66,.69)}${ridge(551,132,.6)}
      ${trees(66,174,17)}${trees(150,113,15)}${trees(286,258,21)}${trees(420,210,23)}${trees(44,332,15)}
      ${path('M137 273Q167 239 213 242T287 216Q306 194 330 192Q382 188 385 158T431 130Q469 130 482 100','none','stroke="#2c493e" stroke-width="8" stroke-linecap="round"')}${path('M137 273Q167 239 213 242T287 216Q306 194 330 192Q382 188 385 158T431 130Q469 130 482 100','none','stroke="#dbc58c" stroke-width="2.8" stroke-dasharray="3 6" stroke-linecap="round"')}${atlasLandmarks}${compass}
      <rect x="13" y="13" width="574" height="364" rx="3" fill="none" stroke="#cebb88" stroke-opacity=".5"/><path d="M19 46V19h27 M554 19h27v27 M581 344v27h-27 M46 371H19v-27" fill="none" stroke="#d5c390" stroke-width="2"/>`,'atlas-art','xMidYMid meet');
  }
  return Object.freeze({forest,hero,slime,map,rowan});
})();
