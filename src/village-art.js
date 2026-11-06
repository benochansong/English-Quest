// The village is drawn from reusable hand-authored vector scenery. All coordinates are local.
const VillageArt = (function VillageIllustrations() {
  let serial=0;
  const path=(d,fill,attrs='')=>`<path d="${d}" fill="${fill}" ${attrs}/>`;
  const line=(d,color,width=1,opacity=1)=>path(d,'none',`stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"`);
  const dot=(x,y,r,fill,opacity=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
  const oval=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  const rect=(x,y,w,h,color,rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${color}"/>`;
  const g=(x,y,s,body)=>`<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
  const series=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
  const svg=(box,classes,body,fit='xMidYMid meet')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" preserveAspectRatio="${fit}" class="${classes}" aria-hidden="true" focusable="false">${body}</svg>`;
  const grad=(id,a,b,c)=>`<linearGradient id="${id}" x1="0" y1="0" x2=".19" y2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
  const halo=(id,color)=>`<radialGradient id="${id}"><stop stop-color="${color}" stop-opacity=".81"/><stop offset=".25" stop-color="${color}" stop-opacity=".32"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  const swatch=id=>`url(#${id})`;
  const stone='#676c77',gold='#e7c483',ink='#37434e';
  function lamp(x,y,s,id){
    return g(x,y,s,`<g class="v-lantern">${dot(0,0,44,swatch(id+'light'))}
      ${path('M-11 -10l4 -7 7 -4 7 4 4 7 -2 19 -8 6 -9 -6Z','#67513e','stroke="#3e3c38" stroke-width="1.5"')}
      ${path('M-7 -8l13 -1 -2 15 -5 4 -5 -4Z','#f7ce83')}${line('M0 -9v17 M-8 -7l15 -1 M-2 -20v-6', '#96805d',1.5)}</g>`);
  }
  function windowArch(x,y,s,id) {
    return g(x,y,s,`${path('M-13 0v-26q0 -10 13 -18 13 8 13 18V0Z','#4e524e','stroke="#c6b28b" stroke-width="3"')}
      ${path('M-9 -3v-23q0 -7 9 -13 9 6 9 13v23Z',swatch(id+'window'))}${line('M0 -38v35 M-9 -19H9','#766853',2)}`);
  }
  function house(x,y,s,id,roof='#486768',warm=false){
    return g(x,y,s,`${path('M-80 -85l55 -67 101 13 34 65 -77 10Z',roof,'stroke="#444e50" stroke-width="2"')}
      ${path('M48 -141l-7 -29 13 -3 8 34Z','#876d5b')}${path('M39 -171l18 -4 3 7 -19 4Z','#a98a68')}
      ${path('M-73 -80l51 -59 57 72v65l-106 -4Z',warm?'#d6b68d':'#c0b99c')}
      ${path('M35 -67l67 -10v68L35 -2Z',warm?'#9c8873':'#93978c')}
      ${path('M-85 -83l62 -73 63 80 72 -9 -1 8 -76 12 -59 -73 -54 64Z','#4b5353')}${line('M-83 -84l61 -70 60 77 71 -10','#d0ad7e',3)}
      ${line('M-67 -77v71 M-21 -133v129 M30 -71v68 M-66 -46l95 4 M-65 -47l39 -41 M-17 -87l43 44 M45 -68v63 M96 -73v62','#706557',5)}
      ${windowArch(-44,-55,.56,id)}${windowArch(3,-52,.57,id)}
      ${path('M-10 -4v-28q3 -13 14 -14 13 2 15 15v28Z','#595650','stroke="#b7a78a" stroke-width="2"')}
      ${rect(54,-52,16,23,'#64726c')}${rect(57,-50,10,17,swatch(id+'window'))}
      ${series(5,i=>line(`M${14+i*12} ${-135+i*1.5}l27 42`, '#b5aa8b',1.3,.46))}
      ${line('M-72 -5l104 4 71 -10','#65675d',4)}`);
  }
  function gatehouse(x,y,s,id) {
    const tower=(at,h)=>g(at,0,1,`${path(`M-22 0v-${h}h44V0Z`,swatch(id+'tower'),'stroke="#525e63" stroke-width="2"')}
      ${path(`M-26 -${h}v-12h9v6h10v-7H4v7h11v-7h11v14l-4 5h-43Z`,'#87958d')}
      ${rect(-8,-h+14,5,14,'#495766')}${rect(6,-h+39,4,14,'#4f616b')}${line(`M-21 -${h-6}h41 M-20 -17h42`,'#c1b7a0',2)}`);
    return g(x,y,s,`${tower(-55,96)}${tower(55,108)}
      ${path('M-39 0v-66l38 -25 40 23V0H20v-31q-2 -18 -21 -28 -19 11 -20 28V0Z',swatch(id+'tower'),'stroke="#53636a" stroke-width="2"')}
      ${path('M-45 -65l43 -32 45 28 -4 6 -41 -24 -37 28Z','#61777a')}${line('M-27 0v-31q0 -19 27 -35 26 14 27 35V0','#d0c3a3',3)}`);
  }
  function background(id,dusk=false){
    return `${rect(0,0,1000,560,swatch(id+'sky'))}${dot(697,dusk?103:90,155,swatch(id+'light'))}${dot(697,dusk?103:90,19,dusk?'#ecdac2':'#fae7b6')}
      ${path('M0 221l57 -45 61 -9 54 -58 39 14 48 -44 77 68 55 -29 77 71 62 -34 33 8 71 -85 44 35 40 -13 63 53 83 -74 75 48 61 -24V280H0Z',dusk?'#74768c':'#96a9a1')}
      ${path('M0 248l96 -43 71 -8 74 -37 48 17 55 -22 82 45 64 -24 63 30 72 -52 47 19 41 -13 63 32 75 -38 53 7 55 -37 42 15V309H0Z',dusk?'#5f6579':'#788f87')}
      ${series(15,i=>{const x=i*77-18,y=250-Math.round(Math.sin(i*1.8)*11),s=.3+((i*13)%7)/27;return house(x,y,s,id,i%3===0?'#8e7666':'#6a8180');})}`;
  }
  function ivy(x,y,s) {
    return g(x,y,s,`${line('M-3 -45q4 30 32 40t48 40 M17 -13q9 17 2 37','#587465',2)}
      ${series(13,i=>{const t=i/12,px=Math.round(t*75),py=Math.round(-38+t*69+6*Math.sin(t*7));return path(`M${px} ${py}q-10 1 -14 -7 11 -3 14 7 m2 1q8 -10 15 -9 -3 9 -15 9Z`,i%3?'#69876d':'#8c9b73');})}`);
  }
  function flowerBox(x,y,s) {
    return g(x,y,s,`${path('M-29 -7h58l-3 16h-49Z','#9b745a','stroke="#705c4c" stroke-width="1.6"')}
      ${series(13,i=>{const px=(i*19)%53-26,py=-11-(i*7)%13;return `${line(`M${px+3} -5l-3 ${py+5}`,'#536f55',1.2)}${dot(px,py,3+(i%2),i%3?'#be8a75':'#d3b97d')}${dot(px-3,py+4,3,'#779068')}`;})}
      ${line('M-29 -5h57','#c69f72',2)}`);
  }
  function planeTree(x,y,s,id) {
    return g(x,y,s,`${path('M-17 0q12 -21 9 -42 -1 -14 -18 -27l-6 -18 16 16 12 6 -2 -37 7 11 3 24q10 -23 29 -34L19 -76l-11 25q-2 40 9 49Z','#776856')}
      ${line('M-4 -3q7 -28 2 -47 M1 -53l5 -21','#a99975',2)}
      ${path('M-59 -77q-9 -17 5 -27 -2 -18 16 -20 2 -22 26 -20 10 -18 31 -6 25 -7 29 16 23 4 20 25 10 18 -9 26 -8 16 -26 10 -10 14 -25 5 -12 12 -27 0 -21 5 -23 -9Z','#69846c')}
      ${path('M-53 -106q5 -16 19 -13 0 -16 17 -19 12 -10 23 -3l15 -6 17 10 -19 3 -11 12 -17 -4 -14 12 -11 -3Z','#93a17c')}
      ${path('M-32 -88q9 6 21 0l13 5 21 -6 16 1 -12 13 -14 1 -11 6 -12 -6 -14 1Z','#597865')}
      ${flowerBox(1,-1,1.1)}`);
  }
  function fountain(x,y,s,id) {
    return g(x,y,s,`${oval(0,8,51,11,'#968e79','stroke="#cabda0" stroke-width="2"')}${oval(0,4,47,7,'#72948c')}
      ${path('M-5 0l4 -17 -15 -5 -5 -7 44 -1 -6 8 -15 5 4 16Z','#b1ab8e','stroke="#7d8276" stroke-width="1.6"')}
      ${oval(1,-30,21,4,'#82aaa1')}${line('M-18 -25q-11 -2 -15 22 M18 -26q13 2 16 21 M0 -30q-3 -10 3 -17','#d2ddc3',1.7)}
      ${path('M0 -49l5 -8 5 9 -6 11Z','#abcfba')}`);
  }
  function piazza(id) {
    return `${background(id)}${gatehouse(526,202,.73,id)}
      ${path('M0 276q205 -74 419 -41t581 -18v343H0Z',swatch(id+'pave'))}
      ${path('M517 205q-28 56 -76 77t-133 58q-33 22 51 36 61 9 109 45l89 -1q-31 -37 -122 -61 -40 -12 -2 -32t57 -24q59 -33 52 -98Z','#cfbd96')}
      ${house(118,323,1.07,id,'#ab765f',true)}${house(359,264,.70,id,'#637e78')}${house(647,238,.69,id,'#69767d')}
      ${house(762,303,1.15,id,'#5e7180',true)}${house(957,307,.96,id,'#a38269')}
      ${stall(225,344,.79,id)}${lamp(803,263,.7,id)}
      ${path('M713 219h12v26h-12Z','#695640')}${path('M702 212h32v23h-32Z','#88684d','stroke="#cdb787" stroke-width="2"')}${dot(718,224,5,'#edc88a')}
      ${series(23,i=>{const x=(i*123+17)%965,y=344+(i*21)%75;return line(`M${x} ${y}l19 -2 13 2`,'#d6c8aa',2,.54);})}
      ${path('M-12 474q165 -54 323 -19t348 6q188 -41 353 -9v108H0Z',swatch(id+'canal'))}
      <g class="v-water">${series(16,i=>line(`M${(i*137)%968} ${476+(i*9)%65}q22 -3 46 0`,'#bdd3bc',2,.58))}</g>
      ${path('M-4 458q173 -62 311 -26l-3 22Q130 424 0 483Z M630 450q208 -52 374 -22v21q-156 -32 -371 21Z','#888777','stroke="#c6b895" stroke-width="3"')}
      ${path('M260 450q100 -72 248 -62 90 -3 164 41l-1 42 -35 4q-23 -37 -72 -35 -52 4 -65 49l-40 4q-14 -55 -71 -55 -71 -1 -102 52l-27 -5Z','#ab9c80','stroke="#716e61" stroke-width="2"')}
      ${line('M260 452q108 -72 248 -60 88 -3 164 39','#e3cda2',6)}
      ${g(496,413,.83,noticeBoard())}
      ${planeTree(49,366,.69,id)}${planeTree(885,332,.6,id)}${flowerBox(711,305,.75)}${flowerBox(801,307,.62)}${fountain(393,334,.72,id)}${ivy(322,199,.46)}
      ${path('M0 541q41 -55 93 -39 21 -26 58 -16 33 -6 52 15 32 -3 57 20l28 39H0Z M1000 470q-40 1 -53 25 -34 -8 -54 15 -42 -5 -72 50h179Z','#516e60')}
      ${path('M12 532l22 -23 12 0 17 -13 13 4 -25 20 -13 1 -8 11Z M848 546l25 -23 14 0 12 -11 17 0 -18 16 -20 3 -9 16Z','#849574')}
      ${g(270,355,.34,silhouette('#576a62'))}${g(742,321,.3,silhouette('#866651'))}${g(550,210,.19,silhouette('#4c6064'))}
      ${bunting(154,148,377,163)}${bunting(653,136,866,140)}`;
  }
  function noticeBoard(){
    return `${path('M-21 -4v-52h5v52 M16 -4v-52h5v52','#584535')}${path('M-31 -54l30 -10 31 10 -1 5h-60Z','#5b625a')}${rect(-24,-49,49,34,'#8b7152',2)}${rect(-18,-44,16,18,'#dfc89a')}${rect(3,-43,13,12,'#cdbb95')}${line('M-15 -39h9 M-15 -34h6 M6 -39h7','#997f61',1.2)}`;
  }
  function silhouette(color){
    return `${dot(0,-58,8,color)}${path('M-7 -49q7 -5 14 0l10 21 -6 4 -7 -10 3 26 -3 9 -5 -1 -1 -20 -5 20 -6 1 5 -31 -4 8 -5 -4Z',color)}`;
  }
  function bunting(x1,y1,x2,y2){
    const width=x2-x1;
    const flags=series(8,i=>{const t=(i+.5)/8,x=x1+width*t,y=(1-t)*y1+t*y2+Math.sin(Math.PI*t)*17;return path(`M${x-7} ${y}l15 0 -6 15Z`,['#b57562','#d7bc82','#617f78'][i%3]);});
    return `${line(`M${x1} ${y1}q${width/2} 37 ${width} ${y2-y1}`,'#685c4d',2)}<g class="v-pennants">${flags}</g>`;
  }
  function stall(x,y,s,id){
    return g(x,y,s,`${rect(-74,-88,5,88,'#6e5645')}${rect(68,-89,5,89,'#664f43')}
      ${path('M-90 -84l31 -42h114l34 40 -6 8 -170 1Z','#c88876','stroke="#7d6158" stroke-width="2"')}
      ${series(4,i=>path(`M${-58+i*29} -125h14l${-13+i*6} 39h-22Z`,'#e1c6a1'))}
      <g class="v-awning">${series(10,i=>path(`M${-88+i*17.5} -86h18v8q-8 11 -18 0Z`,i%2?'#d9bb94':'#aa7164'))}</g>
      ${rect(-71,-32,143,29,'#8f7359')}${line('M-71 -32H73 M-68 -3H71','#c6a376',4)}
      ${series(3,i=>`<g transform="translate(${-46+i*44} -35)">${path('M-20 -4h40l-4 11h-31Z','#7a614b','stroke="#ab905e" stroke-width="1.4"')}${series(6,j=>dot(-13+(j%3)*11,-5-Math.floor(j/3)*6,5,['#c77c5d','#abb679','#cf9e65'][i]))}</g>`)}
      ${lamp(60,-64,.5,id)}`);
  }
  function townMarket(id) {
    return `${background(id)}${path('M0 336q254 -43 470 -14t530 -11v249H0Z',swatch(id+'pave'))}
      ${house(56,319,1.78,id,'#657d75')}${house(324,317,1.29,id,'#a37669',true)}
      ${house(690,297,1.29,id,'#7d7a77')}${house(941,316,1.64,id,'#9c735f',true)}
      ${bunting(20,111,382,142)}${bunting(382,142,700,130)}${bunting(700,130,986,86)}
      ${stall(134,361,1.28,id)}${stall(798,339,.93,id)}
      ${g(479,306,.78,noticeBoard())}${g(599,312,.45,silhouette('#6e7264'))}
      ${series(36,i=>{const x=(i*191)%995,y=363+(i*37)%183;return path(`M${x} ${y}l12 -3 28 2 3 3 -41 2Z`,i%2?'#b1a58a':'#c6b998','opacity=".82"');})}
      ${g(37,390,.88,crates())}${g(858,360,.86,crates())}
      ${ivy(269,184,.53)}${flowerBox(365,312,.63)}${planeTree(693,310,.51,id)}
      ${path('M0 495l66 -25 144 16 29 29 -20 45H0Z M1000 407l-70 -3 -151 64 -35 51 38 41h218Z','#755d4d')}
      ${path('M0 470l57 -14 144 15 38 23 -15 15 -152 -16 -72 23Z M1000 390l-59 0 -171 65 -12 30 25 8 151 -49 66 -7Z','#b68e67','stroke="#7a624e" stroke-width="2"')}
      ${series(11,i=>{const x=812+i*17,y=454-i*6;return g(x,y,1,`${path('M-9 0q0 -11 8 -14l4 4 5 -2q7 6 3 14 -4 5 -10 3Z',i%3?'#bb795f':'#c5a06b')}${line('M0 -10l2 -7 5 -1','#60775b',2)}`);})}
      ${series(8,i=>g(i*20-6,466+(i%2)*4,1,`${path('M-6 2q-1 -12 9 -19 8 -4 10 2l-7 20Z','#caa574','stroke="#a47e58" stroke-width="1.5"')}${line('M1 -6l5 2 M5 -12l5 2','#e1c491',1.8)}`))}
      ${path('M0 0h393l-41 22 -46 34 -66 6 -36 32 -58 -1 -39 26 -107 -7Z','#846456')}
      ${series(6,i=>path(`M${i*59} 0h25l-96 83 -28 5Z`,'#c5a581','opacity=".77"'))}
      ${path('M1000 0h-187l14 27 51 22 21 19 23 -3 49 22 29 -2Z','#38554f')}`;
  }
  function crates(){
    const box=(x,y)=>g(x,y,1,`${path('M0 0l44 -5 19 5v31l-46 4 -17 -7Z','#846b52','stroke="#5f544a" stroke-width="2"')}${line('M3 3l15 4 43 -5 M18 8v24 M23 8l29 18 M53 6l-27 23','#b6966e',2.5)}`);
    return box(0,0)+box(39,13)+box(17,-26);
  }
  function tavern(id) {
    const beams=path('M0 0h1000v49L740 69 514 49 255 73 0 56Z','#4b4241')+
      path('M136 0l126 180 30 -8L182 0Z M838 0L729 169l24 17L880 0Z M0 179l261 -29 252 12 240 -22 247 5v22l-247 -3 -238 24 -251 -10L0 203Z','#655144')+
      series(8,i=>rect(i*144-12,24,10,346,'#77614e'));
    const fireplace=path('M308 337l15 -35 19 -5V153l27 -20h98l23 20v144l21 6 11 35Z',swatch(id+'tower'),'stroke="#64574c" stroke-width="3"')+
      path('M346 331v-63q0 -44 70 -70 66 27 66 70v63Z','#554942','stroke="#b39a77" stroke-width="7"')+
      path('M361 330v-60q0 -32 55 -55 52 25 52 55v59Z','#382f32')+
      path('M320 183l25 -9h148l13 11 -1 8H322Z','#a49077','stroke="#665948" stroke-width="2"')+
      dot(415,304,97,swatch(id+'light'))+
      `<g class="v-hearth">${path('M373 322q-7 -19 5 -38 2 15 9 16 -2 -25 18 -51 -3 22 8 29l7 -36q18 21 11 48l12 -12q18 24 7 44Z','#dd9866')}${path('M390 323q-3 -11 11 -28l2 8 12 -23q15 21 7 30l13 -11q3 20 -7 24Z','#f6cf85')}</g>`+
      line('M376 326l64 -8 M394 319l53 8','#725746',5);
    const table=(x,y,s)=>g(x,y,s,`${path('M-73 -41l151 0 17 9 -180 0Z','#b3976d')}${path('M-85 -31H95v8H-85Z','#7b604c')}${path('M-62 -23h13l-3 46h-12Z M67 -23h12l4 45h-12Z','#644e42')}
      ${path('M-24 -47l17 0 -1 10 -13 0Z','#c8ba99')}${path('M8 -40q6 -19 23 -14l14 8 -5 6Z','#d8aa73')}${line('M22 -50l-2 7 M31 -49l-3 7','#a37d54',2)}`);
    const plates=series(8,i=>{const x=714+i%4*37,y=194+Math.floor(i/4)*47;return g(x,y,.7,`${path('M-8 -2l1 -8 4 -5 -1 -11h6v10l5 8v8H-8Z',i%2?'#ad8666':'#77918a')}${line('M-4 -13l1 -10','#d1bb94',2)}`);});
    return `${rect(0,0,1000,560,swatch(id+'sky'))}${rect(0,104,1000,246,'#a18b70')}${beams}
      ${windowArch(180,287,2.35,id)}${windowArch(617,271,1.9,id)}
      ${rect(688,194,225,7,'#735b4c')}${rect(688,241,225,8,'#735b4c')}${plates}
      ${path('M0 341q250 -24 335 -5t235 -1q180 -16 430 -10v235H0Z',swatch(id+'pave'))}
      ${series(9,i=>line(`M${i*166-170} 560L${290+i*61} 337`,'#866f59',2,.78))}${series(3,i=>line(`M0 ${375+i*63}l1000 -7`,'#9a8467',2,.8))}
      ${fireplace}${table(144,346,.91)}${table(865,342,.93)}
      ${g(270,276,1,`${path('M-16 -44q17 -13 32 0v34l-15 9 -17 -9Z','#8b6957','stroke="#cfb084" stroke-width="2"')}${path('M-4 -17l-1 -12 8 -3 9 4 -8 3 1 8Z','#cbb88f')}`)}
      ${table(934,491,1.46)}${path('M0 471l56 -9 128 18 28 21 -10 8L0 492Z','#8a6d53','stroke="#574c42" stroke-width="2"')}
      ${path('M27 464l4 -31 -6 -19 3 -12 9 -1 5 12 -3 19 4 32Z','#ac9471','stroke="#675c4f" stroke-width="2"')}
      ${dot(32,406,24,swatch(id+'light'))}${path('M29 405q-2 -8 3 -16 7 10 3 16Z','#f2cc8a')}
      ${line('M527 0v103 M118 0v99 M910 0v89','#514839',3)}${lamp(527,136,1.31,id)}${lamp(118,119,.82,id)}${lamp(910,109,.83,id)}
      ${g(930,366,.76,crates())}${path('M0 0h52l21 56 -12 101 14 165 -18 63 -9 175H0Z M1000 0h-62l-10 41 11 110 -6 193 19 216h48Z','#51483f')}`;
  }
  function northGate(id) {
    const tower=(x)=>g(x,0,1,`${path('M-95 356l16 -236 9 -61h137l16 66 12 230Z',swatch(id+'tower'),'stroke="#46515e" stroke-width="3"')}
      ${path('M-78 124l10 -64 21 0 -8 290 -34 6Z','#8a8b89')}
      ${path('M-83 64V35h20v13h26V32h23v13h29V29h22v13h26V26h18v40l-8 10 -140 8Z','#819092','stroke="#4b5d65" stroke-width="3"')}
      ${line('M-81 100l158 -9 M-84 178l166 -8 M-87 254l175 -5','#a6a497',3,.58)}
      ${series(7,i=>line(`M${-70+(i%3)*52} ${112+Math.floor(i/3)*69}l-3 23 28 -1`,'#555f67',2,.74))}
      ${path('M-9 153v-31q3 -11 10 -12l7 7v36Z','#424755')}${path('M-14 185h29v71l-14 -8 -15 11Z','#586e83','stroke="#a5aaa1" stroke-width="2"')}
      ${path('M-6 203l7 -10 7 9 -8 12Z','#dec492')}`);
    return `${background(id,true)}
      ${path('M0 334l17 -127 193 -43 569 -10 221 26v159Z','#5f707b')}
      ${tower(249)}${tower(751)}
      ${path('M310 352V135l62 -28 17 -30 111 -38 110 37 21 34 62 29v214h-81v-111q-6 -68 -112 -123 -100 55 -111 124v110Z',swatch(id+'tower'),'stroke="#4a5361" stroke-width="4"')}
      ${path('M373 350V242q5 -74 127 -142 128 66 129 142v107h-18v-107q-7 -65 -111 -122 -103 58 -110 122v108Z','#aaac9e','stroke="#566575" stroke-width="3"')}
      ${path('M399 231q9 -58 101 -106 91 45 102 106l-8 26 -11 -20 -11 18 -10 -25 -11 16 -10 -21 -10 15 -9 -22 -10 16 -13 -20 -13 18 -10 -21 -11 21 -11 -16 -10 23 -11 -17 -10 23 -10 -15Z','#3e515c')}
      ${line('M398 219q25 -55 102 -94 70 32 99 87','#d4c395',3)}
      ${path('M472 93l28 -36 28 36 -28 20Z','#50636c','stroke="#c5b788" stroke-width="3"')}${path('M487 92l13 -20 13 20 -13 11Z','#f5d799')}
      ${path('M0 353l184 -28 129 24 79 -11 112 11 101 -13 156 -12 139 12 100 -7v231H0Z',swatch(id+'pave'))}
      ${series(6,i=>line(`M${i*270-198} 560L${346+i*57} 349`,'#9b9d9d',2,.63))}
      ${series(4,i=>line(`M0 ${369+i*51}q491 19 1000 -3`,'#a1a39e',2,.5))}
      ${g(350,344,1.04,runePlinth(id))}${g(647,345,1.04,runePlinth(id))}${dot(500,236,83,swatch(id+'magic'))}
      ${series(12,i=>{const t=(i%6+.5)/6,side=i<6?-1:1,x=500+side*(108-104*t*t),y=236-127*t;return line(`M${x} ${y}l${side*14} -9`,'#69777b',2,.8);})}
      ${g(106,326,1,`${path('M-21 0l5 -8 7 -3 4 -40 -9 -8 -2 -8h34l-3 9 -10 8 3 39 7 4 5 8Z','#66727a','stroke="#a5a394" stroke-width="2"')}${dot(0,-73,47,swatch(id+'light'))}${path('M-10 -67q-6 -11 3 -23l3 9 7 -19q13 17 7 33Z','#e7bc86')}`)}
      ${g(889,328,1,`${path('M-15 0l5 -12 3 -41 -9 -9 -1 -8h33l-1 8 -11 10 4 41 8 11Z','#69757b','stroke="#aaa797" stroke-width="2"')}${dot(0,-73,47,swatch(id+'light'))}${path('M-9 -69q-6 -14 6 -22l2 10 5 -20q13 17 6 32Z','#e8bf8b')}`)}
      <g fill="none" stroke="#c8c3ba" opacity=".69"><ellipse cx="504" cy="396" rx="167" ry="21"/><ellipse cx="504" cy="396" rx="153" ry="17" stroke-dasharray="4 7"/></g>
      <g class="v-gate-mist">${path('M0 330q132 -26 273 -6t243 6q168 -27 286 -11t205 -1q-119 28 -212 15t-266 10q-158 13 -274 -2T0 346Z','#c6d2d0','opacity=".24"')}</g>`;
  }
  function runePlinth(id){
    return `${path('M-26 0l5 -13 7 -6 6 -62 17 -13 11 15 -2 63 9 5 4 11Z',swatch(id+'tower'),'stroke="#566675" stroke-width="2"')}
      ${dot(3,-62,30,swatch(id+'magic'))}${line('M-4 -59l9 -14 5 8 -10 12 5 7','#afebee',2.4)}`;
  }
function outskirts(id) {
  const blade = angle => `<g transform="rotate(${angle})">${path('M-3 -2v-79h4v82Z','#765f49')}
    ${path('M-2 -18l-17 -12 0 -44 17 -4Z','#d1c59f','stroke="#95886c" stroke-width="1.7"')}
    ${line('M-17 -38l14 -2 M-17 -51l14 -2 M-17 -65l14 -2 M-12 -32v-40','#a99b7d',1.4)}</g>`;
  const mill=g(424,279,1.03,`${path('M-28 2l12 -99 34 -6 19 102Z','#b8ad8f','stroke="#7f8273" stroke-width="2"')}
    ${path('M-19 -100l10 -31 23 -6 18 28 -2 11 -49 6Z','#657e79','stroke="#596e67" stroke-width="2"')}
    ${path('M-29 0l35 -5 10 -89 7 2 14 88Z','#8b967e')}${windowArch(3,-33,.39,id)}
    <g transform="translate(3 -101)"><g class="mill-sails">${[8,98,188,278].map(blade).join('')}${dot(0,0,5,'#977656')}${dot(0,0,2.6,'#d1bb8c')}</g></g>`);
  const wheat=series(17,i=>{const x=i*68-14,y=315+(i%4)*5;return g(x,y,.85,`${line('M0 6q-1 -17 -11 -37 M-4 -11l-12 -7 M-7 -23l5 -7','#a79565',1.7)}
    ${path('M-12 -30l-6 -4 3 6 6 1 -4 -8 2 -3 2 7 2 0Z','#d2bc80')}`);});
  const wagon=g(797,336,1.02,`${path('M-76 -18l150 -5 -6 14 -133 9Z','#80604a')}${line('M53 -14l42 -8','#77614c',4)}
    ${[-44,44].map(x=>`<g transform="translate(${x} 0)">${dot(0,0,17,'#666156')}${dot(0,0,12,'#b1a686')}${line('M-13 0h26 M0 -13v26 M-9 -9l18 18 M-9 9L9 -9','#746451',2.5)}${dot(0,0,3.5,'#877b64')}</g>`).join('')}
    ${path('M-66 -22v-33l12 -17 21 -6 27 7 13 23 56 -1 3 24Z','#ae8d63','stroke="#786f59" stroke-width="2"')}
    ${path('M-68 -49q-1 -29 21 -44 25 -9 46 4 18 15 20 39l-24 3 -14 -30 -18 -3 -8 32Z','#d7c7a1','stroke="#9b9077" stroke-width="2"')}
    ${path('M-35 -84l12 0 14 29 5 9 -10 0Z','#a47869')}${line('M-58 -34l109 -4 M-57 -27l109 -4','#d9b887',2.1)}`);
  return `${background(id)}${path('M0 280q180 -63 354 -35t320 -3q181 -29 326 -6v171H0Z','#97a68a')}
    ${mill}${path('M0 313q195 -63 348 -25t326 -4q161 -40 326 -14v99H0Z','#adad7c')}
    ${path('M0 325q161 -34 364 -17t306 2q153 -35 330 -25v89H0Z','#c9bd8f')}
    ${series(6,i=>line(`M${i*123-180} 353q141 -42 275 -42`,'#a79a73',2,.65))}${wheat}
    ${path('M0 378q139 -28 256 -26l148 -7q113 -16 176 -54l30 0q-41 39 -122 69 153 9 253 -3 125 -25 259 -27v230H0Z',swatch(id+'pave'))}
    ${path('M-10 378q146 -29 268 -26l145 -7 71 -12 -64 26 -155 1q-139 1 -265 33Z','#8c9e7a')}
    ${series(10,i=>{const x=39+i*99,y=327+Math.floor(Math.sin(i*.52)*13);return `${path(`M${x} ${y}l3 -27 5 -5 1 31Z`,'#776950')}${line(`M${x-6} ${y-18}l96 -5`,'#9d8867',3.7)}`;})}
    ${planeTree(88,344,.88,id)}${planeTree(874,309,.56,id)}${wagon}
    ${series(19,i=>{const x=(i*131)%970,y=373+(i*17)%140;return line(`M${x} ${y}l16 -2 14 1`,'#cfbf9f',2,.71);})}
    ${path('M0 451q50 -26 83 -15t64 0q59 -3 82 32l-15 92H0Z M1000 425q-49 -18 -103 7t-76 66l-8 62h187Z','#7b9677')}
    ${path('M0 490q54 -38 96 -23l61 21 60 12 40 60H0Z M1000 484q-74 -32 -131 2t-88 74h219Z','#607c67')}
    ${series(12,i=>{const x=i<6?i*33:800+(i-6)*38,y=455+(i%4)*12;return `${line(`M${x} ${y+8}l6 -16`,'#819d76',2)}${dot(x+6,y-9,3,'#dfc08d')}`;})}`;
}
function courtyard(id) {
  const lodge=g(485,332,1.07,`${path('M-184 -96l90 -111 170 -13 107 98 -18 9 -337 33Z','#526974','stroke="#445564" stroke-width="3"')}
    ${path('M40 -199l-2 -43 17 -7 8 42Z','#887c71')}${path('M34 -246l24 -6 4 8 -25 7Z','#b19b82')}
    ${path('M-166 -88l64 -91 96 83v82l-162 11Z','#a29b87')}${path('M-7 -97l169 -19v96L-4 -14Z','#8d9083')}
    ${line('M-175 -89l76 -102 101 88 169 -19','#c3ad86',5)}
    ${line('M-155 -85v78 M-99 -171V-9 M-13 -90v76 M-154 -55l140 -8 M-136 -60l32 -42 M-90 -104l63 38 M16 -98v80 M84 -106v81 M151 -113v90 M0 -68l159 -18','#625d54',5.4)}
    ${windowArch(-123,-68,.65,id)}${windowArch(-59,-70,.67,id)}${windowArch(31,-78,.63,id)}${windowArch(121,-85,.65,id)}
    ${path('M-3 -13v-52q4 -14 18 -17 15 4 17 16v49Z','#505650','stroke="#a89e84" stroke-width="2"')}${lamp(47,-56,.67,id)}
    ${path('M-179 0l344 -24 6 9 -350 24Z','#959890','stroke="#777769" stroke-width="2"')}
    ${line('M104 -128l47 -5v35','#62533e',3)}${path('M126 -97h37v24l-18 8 -19 -8Z','#795b49','stroke="#d4b58a" stroke-width="2.1"')}${path('M135 -87l8 -3 7 2 -1 8 -12 1Z','#f2cd91')}
    ${ivy(-146,-69,.41)}`);
  const stringLights=(x1,y1,x2,y2)=>`${line(`M${x1} ${y1}q${(x2-x1)/2} 38 ${x2-x1} ${y2-y1}`,'#6d7068',2)}
    ${series(5,i=>{const t=(i+.65)/5.4,x=x1+(x2-x1)*t,y=(1-t)*y1+t*y2+Math.sin(t*Math.PI)*16;return `${line(`M${x} ${y}v10`,'#69685e',1.2)}${lamp(x,y+15,.3,id)}`;})}`;
  return `${rect(0,0,1000,560,swatch(id+'evening'))}${dot(711,106,93,swatch(id+'light'))}${dot(711,106,14,'#e6d7b4')}
    ${series(24,i=>dot((i*89+11)%988,28+(i*37)%110,i%4?1:1.7,'#e8dfc5',.7))}
    ${path('M0 242l63 -61 49 16 51 -46 27 16 53 -42 73 47 42 -16 49 41 70 -29 40 19 62 -52 64 21 51 -42 64 25 54 -21 48 33 44 -23 56 14v170H0Z','#687988')}
    ${path('M0 280l61 -31 49 9 69 -49 53 25 39 -18 87 26 79 -43 61 22 91 -11 65 17 40 -31 68 17 57 -32 80 21 101 -30v164H0Z','#566d73')}
    ${house(113,310,1.19,id,'#586c77')}${house(805,291,1.1,id,'#596c79')}
    ${path('M0 324q200 -25 391 4t609 -21v253H0Z',swatch(id+'courtFloor'))}${lodge}
    ${stringLights(0,140,359,185)}${stringLights(638,154,1000,111)}
    ${g(124,334,1,`${path('M-20 3l4 -8 6 -4 4 -135h6l6 137 7 4 4 7Z','#4f534f','stroke="#82806b" stroke-width="2"')}${path('M-3 -147q21 -23 39 -5l-5 5 -3 -6 -10 -1 -13 12Z','#67665c')}${line('M30 -151v10','#685d49',2)}${lamp(30,-124,.7,id)}`)}
    ${path('M0 358l221 -15 2 17 -222 24Z M708 339l292 -23v29l-284 21Z','#8c9488','stroke="#b7b49b" stroke-width="2"')}
    ${flowerBox(713,337,1.3)}${flowerBox(783,330,.89)}${planeTree(923,334,.93,id)}
    ${series(20,i=>{const x=(i*113)%990,y=365+(i*23)%151;return line(`M${x} ${y}l31 -3 12 1`,'#b0b3a4',2,.58);})}
    ${path('M38 405q133 -45 261 -10l208 38q119 14 239 -8 -37 33 -160 34l-267 -24q-162 -33 -268 -6Z','#91aaa5','opacity=".58"')}
    ${line('M69 407q81 -18 160 -11 M227 414l27 3 M467 442l43 4 M554 449l31 -1 M622 440l31 -1','#dae0c8',2,.7)}
    ${path('M0 495q67 -57 144 -28l77 44 49 49H0Z M1000 463q-108 -39 -206 74l-18 23h224Z','#526b62')}`;
}
  function scene(location,arena=false,fit=arena?'xMidYMid slice':'xMidYMid meet'){
    const id=`vLand${++serial}`,inn=location==='inn',gate=location==='gate';
    const defs=`<defs>${grad(id+'sky',...(inn?['#534740','#ab8764','#e1c599']:gate?['#41455d','#777d94','#c7bcad']:['#779da1','#d1c6a5','#eed3a1']))}
      ${grad(id+'pave',...(inn?['#b29a79','#aa8e70','#806651']:gate?['#858b90','#727d86','#4c5a65']:['#d8c9a5','#b5aa8b','#8b8b78']))}
      ${grad(id+'window','#f9df9c','#debb82','#ad9171')}${grad(id+'tower','#a6a69a','#838989','#59646d')}
      ${grad(id+'canal','#5f928d','#789f93','#466a6b')}${grad(id+'evening','#42516d','#817e94','#c8b398')}${grad(id+'courtFloor','#9ba39a','#818d90','#626e77')}${halo(id+'magic','#a8dde3')}${halo(id+'light','#ffe4a6')}</defs>`;
    const locations={square:piazza,market:arena?outskirts:townMarket,inn:arena?courtyard:tavern,gate:northGate};
    const sceneBody=(locations[location]||piazza)(id);
    return svg('0 0 1000 560',arena?'arena-bg village-battle-bg':'village-panorama location-scene',defs+sceneBody,fit);
  }
  function clara(id) {
    const hair='#493d39',skin='#bf8568';
    return `${path('M23 153q-4 -29 13 -45 -9 -38 7 -68 16 -28 45 -22 28 2 36 35l-1 40 12 25 -14 33Z',hair)}
      ${path('M32 120l21 -23 16 1 8 9 20 -10 18 10 15 26 -1 18 -49 28 -55 -27Z','#297b73','stroke="#36534d" stroke-width="2"')}
      ${path('M56 99l21 11 18 -10 -5 22 -13 17 -17 -14Z','#e8cda0')}
      ${path('M42 111l14 -8 7 19 17 12 16 -17 4 -16 10 5 -4 30 7 17 -35 17 -37 -15 7 -22Z','#9c6357')}
      ${path('M58 122l18 20 21 -26 M46 151q31 12 62 -5','none','stroke="#e9ba81" stroke-width="2"')}
      ${path('M59 84l5 18 16 12 12 -17 -1 -14Z','#a57258')}
      ${path('M48 54q5 -26 28 -26 29 -4 36 30l-3 17 -10 16 -16 9 -15 -4 -14 -14 -5 -9Z',skin,'stroke="#745344" stroke-width="1.8"')}
      ${path('M48 54q-4 -20 18 -33 29 -15 46 14l4 23 -8 8 -4 -21 -10 -9 -9 9 -20 6 8 -7q-13 1 -18 20l-4 14 -8 -6Z','#554338')}
      ${path('M42 64q-7 -24 3 -38 10 -18 32 -19 25 2 42 30 -20 -16 -39 -10 -24 4 -38 37Z','#bc7363','stroke="#724b43" stroke-width="2"')}
      ${path('M47 44q23 -26 53 -19l14 9 -17 -3q-29 -1 -50 20Z','#e4b37d')}
      ${path('M107 27l16 -8 10 -15q-1 21 -9 29l11 6 -17 3Z','#bb7361')}
      <g class="expression-clara">${line('M57 64q5 -5 12 -2 M86 57q7 -5 15 0 M61 70l6 -1 M89 65l6 -1 M77 66l-2 10 5 2 M73 85q9 4 16 -3','#5b433b',2.2)}</g>
      ${dot(54,80,4.2,'#dfbe79')}${dot(105,72,3.8,'#e2c387')}${dot(80,139,5,'#d5ae72')}
      ${line('M47 121l-8 19 M109 122l9 11 M52 73q-4 9 1 17','#8f6651',1.5)}`;
  }
  function thomas(id) {
    return `${path('M16 149q7 -30 39 -44l7 -12h27l5 11q30 4 47 44l-59 28Z','#648787','stroke="#425758" stroke-width="2"')}
      ${path('M55 103l22 15 16 -15 10 6 -9 21 -15 -6 -11 11 -18 -23Z','#e4cfa5')}
      ${path('M42 113l8 -4 16 25 24 1 12 -29 8 6 -9 34 11 13 -33 14 -31 -13 8 -23Z','#94705a','stroke="#775a46" stroke-width="1.5"')}
      ${path('M47 70q-10 -33 7 -45 18 -17 39 -10 18 7 23 28l-5 34 -19 25 -21 8 -22 -13Z','#70543f')}
      ${path('M50 54q7 -25 29 -24 24 -1 31 19l-2 33 -13 18 -21 5 -20 -14 -7 -19Z','#d6a17b','stroke="#82634d" stroke-width="2"')}
      ${path('M42 54q-1 -26 22 -36 27 -9 48 7l5 18 -12 -7 -1 11 -6 -7 -4 -10 -12 7 -17 2 -12 10 -1 14 -8 3Z','#534a40')}
      ${path('M46 49q-5 -18 9 -32 16 -10 37 -6l19 5 3 11q-21 -12 -41 -5l-19 12Z','#dbd7bf','stroke="#a89f89" stroke-width="2"')}
      ${path('M50 80q7 8 14 5l8 -6 9 4 10 -5 10 1 7 -7 -3 22 -14 16 -11 4 -16 -3 -16 -16Z','#715a49')}
      ${path('M58 83q7 -8 17 -6l6 4 6 -5 12 -1 5 5 -7 6 -12 -1 -5 3 -10 -2 -13 5Z','#55493f')}
      <g class="expression-thomas">${line('M54 60q7 -6 17 -3 M88 56q7 -5 16 -1 M58 68q6 3 11 -2 M90 64q5 4 10 -1 M79 61l-3 11 7 2 M72 95l10 4 10 -6','#715948',2.3)}</g>
      ${path('M44 136l13 8 -3 14 -13 -6Z','#d3b88d')}${dot(64,135,2.6,'#d9bb87')}${dot(93,135,2.6,'#d9bb87')}
      ${line('M67 146h24l-2 12 -21 -1 M65 101l7 6 M84 108l5 -5','#b29373',1.5)}`;
  }
  function elena(id) {
    return `${path('M35 113q3 -17 17 -28 -9 -18 -6 -37 5 -25 32 -27l24 8 9 21 -6 26 8 27 -22 25Z','#393c41')}
      ${path('M16 148l15 -34 27 -16 16 -4 23 6 24 9 23 38 -64 28Z','#4f6374','stroke="#3b4b55" stroke-width="2"')}
      ${path('M53 102l23 12 25 -15 11 18 -27 38 -18 -8 -21 -23Z',swatch(id+'steel'),'stroke="#4f616b" stroke-width="2"')}
      ${path('M54 120l22 13 24 -13 -18 23 -14 -7Z','#61737c')}${line('M55 117l22 12 24 -13 M76 135l1 15','#e4ce96',2.2)}
      ${path('M29 116l17 -11 14 5 -8 14 -28 12 -4 -7Z',swatch(id+'steel'),'stroke="#526269" stroke-width="2"')}${line('M24 131l26 -10 7 -10','#e0c58d',3)}
      ${path('M99 103l17 -2 14 10 4 13 -22 -4Z',swatch(id+'steel'),'stroke="#526269" stroke-width="2"')}
      ${path('M48 106l8 -8 17 8 20 -9 11 5 -14 16 -20 5Z','#8b5356','stroke="#a77a6d" stroke-width="1.3"')}
      ${path('M63 80l-2 18 16 10 14 -11 -1 -16Z','#966953')}
      ${path('M48 60q0 -29 27 -30 24 -2 35 21l-2 19 -8 17 -15 12 -13 -3 -15 -16 -4 -9Z','#b88971','stroke="#795d50" stroke-width="1.7"')}
      ${path('M44 64q-7 -20 5 -32 11 -18 34 -16 22 2 29 24l2 17 -13 -16 -6 -7q-8 13 -26 19l8 -9q-18 6 -19 24l-5 8Z','#454246')}
      ${path('M44 48q3 -23 15 -33L82 7l18 8 15 24 -5 5q-15 -14 -29 -12 -19 0 -37 16Z',swatch(id+'steel'),'stroke="#4e5961" stroke-width="2"')}
      ${path('M40 49q26 -23 46 -22 18 1 33 14l-4 9q-18 -14 -32 -13 -21 2 -40 18Z','#939c9b','stroke="#535f65" stroke-width="1.6"')}${path('M72 32l8 -15 8 12 -7 9Z','#dec486')}
      <g class="expression-elena">${line('M59 65l12 -3 M88 60l12 1 M63 70l6 -1 M90 67l7 -1 M80 66l-2 10 5 1 M74 86l13 -3','#55423c',2.1)}</g>
      ${line('M95 74l6 -7 M105 85l-4 9 M45 64l-2 15','#c7a18a',1.4)}
      ${path('M109 159l4 -30 8 -4 4 6 -4 24Z','#6b5846','stroke="#bfaa75" stroke-width="2"')}`;
  }
  function npc(name) {
    const id=`vFace${++serial}`;
    const portraits={clara,thomas,elena}, maker=portraits[name]||clara;
    const defs=`<defs>${grad(id+'fr', '#7e9182','#506e68','#344d51')}${grad(id+'steel','#e1d9b7','#a3afaa','#637783')}</defs>`;
    return svg('0 0 160 184','village-portrait',`${defs}${path('M80 4q67 13 70 71v67q-26 27 -70 38 -45 -11 -70 -38V75Q12 19 80 4Z',swatch(id+'fr'),'stroke="#bcaa7e" stroke-width="2.5"')}
      ${oval(81,74,43,47,'none','stroke="#c2b584" stroke-opacity=".52"')}${oval(81,74,48,52,'none','stroke="#c2b584" stroke-opacity=".32" stroke-dasharray="2 5"')}
      ${maker(id)}${path('M18 144q22 21 62 33 39 -10 61 -32','none','stroke="#ddc790" stroke-width="1.5"')}`);
  }
  function item(name){
    const id=`vItem${++serial}`;
    const defs=`<defs>${grad(id+'glass','#d5e6c9','#91c0ae','#4f8d83')}${grad(id+'cloth','#8eaa95','#4e847b','#345d60')}</defs>`;
    const potion=`${path('M29 17h14v15l10 11q8 14 -1 22 -9 7 -21 4 -15 0 -17 -9 -2 -8 3 -16l12 -13Z',swatch(id+'glass'),'stroke="#a7c6b4" stroke-width="2"')}
      ${path('M19 48q8 -5 17 -1t17 -2q7 14 0 18 -7 7 -21 5 -16 -1 -13 -20Z','#849f71')}${path('M32 51l6 -1 1 5 6 -1v5l-6 1 -1 5 -5 0v-6h-6v-5l5 0Z','#e0e4ab')}
      ${path('M26 18l19 -1 -1 7 -17 1Z','#c4a472')}${path('M29 10l13 -1 1 9 -14 1Z','#987451')}${line('M22 44l7 -10 1 -8','#e9f0d1',2.5)}`;
    const charm=`${line('M20 10q-10 14 5 27l11 10 12 -11q19 -18 7 -27','#c3a979',3)}
      ${path('M36 29l19 18 -6 16 -13 8 -16 -10 -5 -14Z','#c6ab72','stroke="#eee0a7" stroke-width="1.7"')}${path('M36 36l12 12 -4 12 -8 5 -10 -8 -2 -10Z',swatch(id+'glass'))}${path('M36 40l3 8 7 2 -7 3 -4 7 -2 -8 -6 -2 7 -4Z','#f7e8b2')}`;
    const cloak=`${path('M28 11l11 -5 13 11 3 14 15 31 -11 -2 -10 6 -14 -5 -13 7 -17 -4q13 -14 16 -34Z',swatch(id+'cloth'),'stroke="#9eaf94" stroke-width="2"')}
      ${path('M30 16l9 -6 8 10 -3 9 -12 -1 -8 5Z','#42595b')}${line('M25 33l-7 22 M39 32l-1 20 8 9 M50 32l8 20 M9 61l12 2 15 -7 15 5 10 -6','#c5b180',2)}${dot(38,29,3.8,'#e0c688')}`;
    return svg('0 0 76 78','village-item-icon',defs+({potion,charm,cloak}[name]||charm));
  }
  function crow(id){
    const feather=(x,y,s,rotation)=>`<g transform="translate(${x} ${y}) rotate(${rotation}) scale(${s})">
      ${path('M0 0q13 -19 25 -49 1 29 -7 41l-6 -2 -3 9Z',swatch(id+'wing'),'stroke="#576785" stroke-width="1.2"')}
      ${line('M4 -1q11 -17 16 -35','#8792b1',1,.8)}</g>`;
    return `${oval(121,207,50,5,'#1c2730','opacity=".39"')}
      <g class="crow-flight"><g class="crow-rear-wing">
      ${path('M110 112Q118 64 95 27q29 11 42 46l6 30 -9 33Z','#465677','stroke="#2e384c" stroke-width="2"')}
      ${path('M108 53l17 29 7 24 -13 -15Z','#6d769d')}</g>
      ${path('M109 133l52 23 42 36 -35 -12 11 12 -42 -14 4 8 -40 -26Z',swatch(id+'wing'),'stroke="#2c394e" stroke-width="2.3"')}
      ${line('M126 146l56 34 M117 151l44 28','#7182a0',1.4)}
      ${path('M93 138q-11 15 3 28l13 10 3 -4 -12 -13 8 -15Z','#7b7580')}${path('M119 151l-2 12 9 8 3 -3 -6 -9 3 -7Z','#8b8291')}
      ${line('M109 173l8 2 4 6 M110 174l-3 6 3 4 M126 169l9 0 4 4','#b4a797',2.4)}
      ${path('M52 92q8 -19 24 -22 19 -4 30 17l11 11 25 17 18 29 -24 -4 8 9 -26 -6 6 10 -18 -5 -4 8 -15 -12q-31 -5 -31 -36l-11 5Z',swatch(id+'wing'),'stroke="#2b3549" stroke-width="2.7"')}
      ${path('M48 92q-9 0 -20 5l13 2 -21 15q18 0 39 -11l8 -14Z','#34384c','stroke="#242d41" stroke-width="1.8"')}${path('M29 100l25 -8 5 2 -17 8Z','#8a91a4')}
      ${path('M48 89l9 -14 12 -7 -2 -5 17 3 10 -1 9 12 -8 -1 6 11 -8 -4Z','#2d3e56')}
      ${path('M51 90l14 -11 16 1 -9 8 -13 4Z','#697799')}${dot(63,87,7,swatch(id+'glow'))}${path('M55 87q7 -7 14 -4l-4 6 -7 0Z','#c5e6e5')}${dot(63,85,2,'#68609e')}
      ${path('M62 104l10 -5 3 7 8 -4 -3 11 -7 5 -1 -7 -7 4Z','#657897')}
      <g class="crow-front-wing">${path('M92 111q31 -20 49 -43l17 -27 20 -18 -5 33 10 -12 -5 24 13 -9 -9 29 -12 10 7 -2q-12 24 -33 33l-13 -1 2 6 -22 -3 -11 -7Z',swatch(id+'wing'),'stroke="#313d56" stroke-width="2"')}
      ${feather(157,80,.99,5)}${feather(164,84,.82,14)}${feather(166,90,.72,19)}
      ${path('M102 108q18 -15 34 -24l21 -30q-3 29 -17 43l-8 2 4 -8 -13 14 -5 -1 -6 9Z','#697593')}
      ${path('M100 112l11 -4 -4 8 12 -6 -4 9 11 -4 -2 6 -16 4Z','#4a5d77')}
      ${line('M135 108l17 -16 M140 113l21 -16 M132 116l-8 2','#8c91af',1.5)}</g>
      ${series(6,i=>g(155+i*8,133+(i%3)*11,.4+(i%3)*.15,`<g class="v-feather-mote" style="--lag:-${i*.4}s">${path('M0 0q7 -12 15 -12 -2 12 -15 12Z','#857ba9','opacity=".7"')}</g>`))}
      </g>`;
  }
  function wisp(id){
    return `${oval(111,204,45,5,swatch(id+'glow'))}${dot(113,111,84,swatch(id+'glow'),.73)}
      <g class="wisp-flight">
      ${path('M94 151q-25 10 -50 -4 9 21 29 26l-18 0q20 16 46 8 -6 12 -23 19 31 -1 51 -25 17 -4 27 -22 -14 8 -21 5Z','#84b6c3','opacity=".65"')}
      ${path('M60 121q1 -28 33 -47 25 -14 25 -49 26 14 25 46l10 -12q15 17 9 40 20 14 13 42 -4 17 -16 28 -14 -5 -24 -1 -19 11 -34 8l-12 10q-1 -12 -10 -16 -27 -7 -26 -31 -10 4 -14 13 -2 -23 21 -31Z',swatch(id+'spirit'),'stroke="#ade5e5" stroke-width="2" fill-opacity=".92"')}
      ${path('M86 106q8 -16 28 -34 16 -18 9 -34 17 17 8 37 -7 16 -21 23l12 -2 -13 13Z','#d0eee2','opacity=".82"')}
      ${path('M64 134q14 19 37 14 19 -5 31 -1t34 -7q-7 15 -23 18l-14 -1 -21 7 -16 -1 -6 6 -11 -12Z','#73a8bf','opacity=".77"')}
      ${path('M66 121q8 -12 20 -10l-2 10 -7 6 -8 -1Z M104 110q9 -9 18 -5 -2 12 -10 15l-7 -3Z','#3e788b')}${path('M70 118l7 -3 -4 6Z M109 109l7 -2 -5 7Z','#edffeb')}
      ${path('M89 131q4 4 9 -2','none','stroke="#568796" stroke-width="2.5" stroke-linecap="round"')}
      ${path('M118 126l7 -8 8 6 -6 9Z','#e1f3d8','opacity=".83"')}
      <g class="wisp-orbit">${oval(112,133,66,18,'none','stroke="#c0eff4" stroke-width="2" stroke-dasharray="36 7 9 6 38 61" transform="rotate(-19 112 133)"')}</g>
      ${series(8,i=>g(41+(i*71)%153,66+(i*29)%109,1,`<g class="v-wisp-note" style="--lag:-${i*.4}s">${path('M0 -5l2 4 4 1 -4 2 -2 5 -1 -5 -4 -2 4 -1Z','#ddf6f0')}</g>`))}
      </g>`;
  }
  function golem(id){
    const plate=(outline,highlight,shadow)=>`${path(outline,swatch(id+'stone'),'stroke="#444f59" stroke-width="2.5" stroke-linejoin="round"')}${path(highlight,'#b4b5a4')}${path(shadow,'#53656c')}`;
    const rune=(d)=>line(d,'#96e4e1',2.8);
    return `${oval(116,212,83,7,'#29343c','opacity=".52"')}
      <g class="stone-rig">
      ${plate('M124 151l30 -4 15 20 -9 19 6 14 15 5 -1 8 -38 0 -10 -9 3 -17 -15 -18Z','M126 154l21 -2 12 11 -16 4Z','M145 169l18 -4 -7 22 7 12 -14 -3Z')}
      ${plate('M75 150l39 4 -2 24 -11 12 -2 15 -13 8 -36 -1 -3 -8 16 -9 5 -17 -5 -10Z','M76 155l23 3 -13 9 -16 -2Z','M99 165l12 -7 -3 19 -11 12 -3 11 -11 3 6 -23Z')}
      ${path('M61 196l26 -3 12 5 -6 12 -42 1 -4 -8Z','#81918d','stroke="#52636a" stroke-width="2"')}
      ${line('M58 199l12 1 5 7 M143 202l15 3 12 -2','#b8b8a4',2)}
      <g class="stone-trunk">
      ${plate('M74 133l56 -13 24 14 -5 23 -28 10 -34 -4 -20 -17Z','M75 133l52 -9 13 7 -55 13Z','M99 148l45 -12 -1 18 -22 8 -23 -6Z')}
      ${plate('M68 74l25 -12 39 -2 24 12 11 32 -15 30 -32 14 -32 -6 -24 -23Z','M70 77l24 -12 36 -2 13 8 -45 14 -27 6Z','M134 77l23 1 8 27 -15 27 -20 8 10 -27Z')}
      ${plate('M75 84l29 -9 34 4 13 14 -13 31 -28 14 -28 -10 -10 -23Z','M77 86l26 -8 28 3 -14 9 -33 4Z','M125 96l23 -6 -13 32 -22 12 -4 -7Z')}
      ${path('M92 95l18 -11 16 7 5 15 -9 19 -15 5 -15 -12 -4 -12Z','#52646a','stroke="#d6bf88" stroke-width="3"')}
      <g class="golem-core">${dot(109,107,30,swatch(id+'glow'))}${path('M100 98l12 -9 12 8 -3 17 -13 10 -12 -11Z','#96d6cb','stroke="#ebd48d" stroke-width="2"')}${path('M112 89l-3 18 12 7 3 -17Z','#bce6d7')}${path('M109 107l-1 17 -12 -11 4 -15Z','#70aaaa')}${line('M104 109l6 -8 4 4 -4 9','#fcdea0',2)}</g>
      ${rune('M77 101l4 7 -2 7 8 3 M137 94l5 -7 5 6 -8 7')}
      <g class="stone-shoulder">${plate('M133 77l8 -23 28 -6 15 12 9 21 -16 21 -29 -4Z','M142 62l24 -10 13 8 -23 12 -19 3Z','M160 77l26 -11 6 15 -16 18 -19 -4Z')}
      ${plate('M155 98l24 1 9 15 -13 18 -17 -4 -7 -14Z','M156 100l17 2 5 6 -20 3Z','M176 110l11 5 -13 16 -4 -7Z')}
      ${plate('M152 126l26 0 12 14 -1 20 -12 10 -23 -6 -9 -15Z','M155 130l21 -1 9 9 -21 5 -13 -5Z','M174 145l14 -6 -1 20 -12 9 -6 -4Z')}
      ${rune('M157 148l8 -4 3 7 -7 7')}</g>
      ${plate('M43 83l11 -21 20 -5 14 11 -6 21 -12 9 -25 -3Z','M48 80l9 -15 15 -4 7 5 -14 12Z','M68 84l15 -13 -4 17 -10 7 -13 -1Z')}
      ${plate('M45 97l20 3 3 15 -16 14 -16 -8 0 -11Z','M45 100l13 1 -8 9 -12 0Z','M54 112l10 -7 2 10 -14 11Z')}
      ${plate('M30 123l24 4 6 18 -8 18 -19 4 -17 -13 2 -19Z','M23 132l8 -6 17 3 -9 9 -19 6Z','M43 147l15 -10 -1 14 -6 11 -16 2Z')}
      ${rune('M22 147l8 -7 6 4 -5 7')}
      ${plate('M82 62l-2 -21 10 -15 28 -6 21 11 5 18 -12 22 -26 7 -18 -6Z','M84 43l8 -14 26 -6 15 9 -24 7Z','M112 42l23 -10 8 17 -14 20 -19 4Z')}
      ${path('M82 46l18 -7 26 -1 7 3 -9 12 -12 1 -9 -3 -16 6Z','#4e6066')}${path('M86 48l14 -4 1 5 -12 4Z M108 44l18 -4 -5 8 -12 2Z','#c1ede5')}
      ${path('M83 60l8 -4 12 1 8 10 -6 6 -15 -4Z','#98a29a')}${line('M90 49l7 -2 M110 46l11 -2','#f8e0a6',1.5)}
      </g></g>
      <g class="floating-runes">${[[35,77,'M-4 -4l4 -5 4 5 -4 7Z'],[183,39,'M-5 4l1 -10 10 4 -6 4 4 2'],[207,134,'M-5 -6l10 0 -6 6 3 5'],[56,36,'M-4 -4l5 -4 5 5 -5 6Z']].map(([x,y,d],i)=>g(x,y,1,`<g class="golem-rune" style="--lag:-${i*.5}s">${dot(0,0,14,swatch(id+'glow'),.6)}${line(d,'#f1d59a',2.1)}<text x="0" y="13" text-anchor="middle" fill="#d8d9b9" font-family="Georgia,serif" font-size="6.5">${['can','you','help','me'][i]}</text></g>`)).join('')}</g>`;
  }
  function enemy(stage) {
    const id=`vFoe${++serial}`;
    const defs=`<defs>${grad(id+'wing','#8886a9','#505e82','#343b56')}${grad(id+'spirit','#e0f4df','#93cdcc','#5f97b1')}${grad(id+'stone','#b2b5a6','#829293','#616e76')}${halo(id+'glow',stage===4?'#ab9dcc':'#a2e3d9')}</defs>`;
    const creatures={4:crow,5:wisp,6:golem};
    return svg('0 0 220 220','village-foe-art',defs+(creatures[stage]||crow)(id));
  }
  return Object.freeze({scene,npc,item,enemy});
})();
