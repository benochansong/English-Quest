// Original class outfits, relic illustrations and trial chambers for the offline gallery.
const RpgArt = (function crystalGallery() {
  let serial=0;
  const svg=(box,classes,body,fit='xMidYMid meet')=>`<svg xmlns="http://www.w3.org/2000/svg" class="${classes}" viewBox="${box}" preserveAspectRatio="${fit}" aria-hidden="true" focusable="false">${body}</svg>`;
  const path=(d,fill,attrs='')=>`<path d="${d}" fill="${fill}" ${attrs}/>`;
  const line=(d,stroke,width=1,alpha=1)=>path(d,'none',`stroke="${stroke}" stroke-width="${width}" stroke-opacity="${alpha}" stroke-linecap="round" stroke-linejoin="round"`);
  const dot=(x,y,r,color,alpha=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${alpha}"/>`;
  const oval=(x,y,rx,ry,fill,attrs='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${attrs}/>`;
  const rect=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
  const at=(x,y,s,body,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})">${body}</g>`;
  const many=(n,draw)=>Array.from({length:n},(_,i)=>draw(i)).join('');
  const paint=id=>`url(#${id})`;
  const grad=(id,a,b,c)=>`<linearGradient id="${id}" x2=".73" y2="1"><stop stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
  const aura=(id,color)=>`<radialGradient id="${id}"><stop stop-color="${color}" stop-opacity=".55"/><stop offset=".38" stop-color="${color}" stop-opacity=".21"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
  const rim=(color='#333f47',w=1.6)=>`stroke="${color}" stroke-width="${w}" stroke-linejoin="round"`;
  const gold='#d6b577', glint='#f9eaca';
  const themes={
    words:{night:'#173b3d',sky:'#4d8878',wall:'#4d675f',face:'#779681',shadow:'#274646',base:'#253b3b',stone:'#75877a',rim:'#b5be93',light:'#a3e6ba',gem:'#6eb69e',darkGem:'#38867d'},
    sentences:{night:'#25324f',sky:'#577b92',wall:'#526374',face:'#89929a',shadow:'#35445d',base:'#29364e',stone:'#758191',rim:'#c2beae',light:'#a9d9ec',gem:'#77b7ce',darkGem:'#487eaa'},
    echoes:{night:'#332d50',sky:'#78698d',wall:'#685f79',face:'#9e8e99',shadow:'#443c59',base:'#363348',stone:'#878292',rim:'#d2bfbd',light:'#e5c3ef',gem:'#b19acb',darkGem:'#7d6aab'}
  };
  function gem(x,y,s,tilt,shade){
    return at(x,y,s,`${path('M0 0l-9 -12 2 -26 9 -17 10 19 -1 24 -7 12Z',shade.gem,rim(shade.light,.95))}
      ${path('M2 -55l-1 23 -8 -6Z',shade.light)}${path('M1 -32l11 -4 -1 24 -7 12 -4 -14Z',shade.darkGem)}
      ${line('M2 -54l-1 22 -1 18 4 14 M1 -32l10 -4 M-8 -14l8 5 10 -6',shade.light,.9,.9)}`,tilt);
  }
  function blade(type) {
    const crystal=type==='crystal', rune=type==='rune';
    const silver=crystal?'#9be3da':rune?'#bbc8de':'#d9e0d1';
    const edge=crystal?'#52a6aa':rune?'#7284aa':'#85989c';
    const tip=crystal?-43:rune?-49:-47,wide=crystal?7:4.5;
    return `<g>${path(`M-3 0l${-wide+3} -7 ${wide*.38} ${tip+13} L0 ${tip-8}l${wide} 12 -.5 ${-tip-15} -3 10Z`,silver,rim('#5e707a',1.1))}
      ${path(`M0 ${tip-7}l${wide} 12 -.5 ${-tip-15} -3 10 -2 -3Z`,edge)}
      ${line(`M-2 -7L0 ${tip+2}`,glint,1)}
      ${rune?line('M-1 -35l2 3 -3 3 2 3 M-2 -22l3 2 -3 3','#bff0e5',1.5):''}
      ${crystal?line('M-4 -22l5 4 3 -4 M-5 -10l6 3 3 -4','#e2f9e9',1.2):''}
      ${path('M-11 -6l6 4 4 -2 3 0 4 3 7 -5 -3 8 -7 1 -3 -3 -4 3 -5 -1Z',gold,rim('#745f45',1.1))}
      ${path('M-2 2l5 0 -1 14 -4 0Z','#69544a',rim('#635342',1))}
      ${line('M-2 5l4 1 M-2 9l4 1 M-2 13l4 1','#bc9d73',1)}
      ${path('M-4 16l4 -2 4 3 -4 5Z',rune?'#8ebcbd':crystal?'#7cbeb4':gold,rim('#756c52',1))}</g>`;
  }
  function classPaint(id,palette) {
    return `<defs>${grad(id+'cloth',...palette.cloth)}${grad(id+'metal',...palette.metal)}${aura(id+'halo',palette.light)}</defs>`;
  }
  function vanguard(id) {
    return {
      cape:path('M81 83q-24 2 -31 29l-8 32q-11 37 -33 51 17 4 30 -4l-8 15q38 -7 56 -40l18 -55Z',paint(id+'cloth'),rim('#334d63',2))+
        line('M14 193q30 -3 49 -51 M38 200q25 -19 33 -44','#c3a56c',2),
      armor:path('M76 91q13 -2 19 5l19 -7 13 15 -14 22 -16 11 -23 -15 -5 -17Z',paint(id+'metal'),rim('#4f6574',2))+
        path('M76 100l19 10 25 -13 -6 12 -19 13 -18 -9Z','#9eafa9')+
        line('M77 101l18 10 23 -11 M76 117l20 13 17 -10','#e6c98c',2)+
        path('M93 103l4 -5 5 4 -5 8Z','#81b7cf',rim('#e4ca93',1.2))+
        path('M74 147l39 -2 5 25 -11 12 -9 -7 -6 4 -8 -10 -10 2Z',paint(id+'metal'),rim('#5c717b',1.7))+
        path('M88 149l14 -1 0 42 -9 8 -8 -10Z','#436a86',rim('#c4aa73',1.2))+
        line('M91 158v22l3 5 4 -5v-23','#d1b576',1.1),
      offhand:path('M54 110l22 8 -4 25 -24 32 -18 -19 3 -30Z','#4d6e86',rim('#e1c68f',3))+
        path('M53 116l18 5 -5 23 -16 22 -15 -12 3 -25Z',paint(id+'metal'),rim('#6b7c80',1.5))+
        path('M53 122l10 5 -2 14 -12 17 -9 -8 2 -17Z','#436882')+
        path('M53 126l2 9 6 2 -6 2 -6 10 1 -10 -5 -3 5 -2Z','#edcd88'),
      head:path('M81 51q-2 -22 13 -32l12 -6 23 14 8 15 -8 0q-11 -10 -22 -9l-12 6 -6 20Z',paint(id+'metal'),rim('#4b6069',1.8))+
        path('M85 43q21 -21 47 -8l7 8 -10 -2 -13 -5 -18 10 -7 17 -6 -6Z','#bdc7bc',rim('#726c58',1.2))+
        path('M94 24l10 -16 13 -5 -6 12 14 -5 -7 9 -14 4Z','#6592a7')+
        line('M87 43q15 -15 33 -12','#e8cd8a',2),
      weapon:at(170,102,1.52,blade('rune'),26)+line('M179 84l27 -58','#d6f7f1',1.6)
    };
  }
  function arcanist(id) {
    return {
      cape:path('M81 83q-24 1 -27 29l-8 31q-6 37 -30 58 13 5 28 -3l-4 16q31 -12 41 -34l22 -66Z',paint(id+'cloth'),rim('#433b60',2))+
        line('M20 199q27 -8 41 -46 M45 205l13 -20','#bfac82',1.8),
      armor:path('M76 89l16 -8 15 7 10 -6 11 14 -8 28 -9 17 8 27 24 50 -13 7 -20 -6 -8 15 -18 -10 -19 3 -14 -10 21 -60 5 -29 -9 -15Z',paint(id+'cloth'),rim('#38334f',2.2))+
        path('M90 86l10 13 13 -14 4 3 -15 20 -13 23 -4 -8 10 -23 -10 -11Z','#c0b18d')+
        path('M80 128l31 -4 2 10 -35 6Z','#857795',rim('#c3ad7d',1.3))+
        path('M93 137l12 -2 -7 41 7 37 -7 13 -9 -9 -6 -45Z','#697293',rim('#bca77b',1.2))+
        line('M77 150l-15 60 7 8 M109 149l15 59 9 10 M92 153l6 -6 1 7 -5 7 -4 -4 M90 182l6 -5 4 10 -5 7 -3 -5','#c8b58b',1.3),
      offhand:path('M50 129l16 4 -3 15 -7 7 -9 -4Z','#6b6587',rim('#c5ae82',1.2))+
        dot(53,145,10,paint(id+'halo'))+dot(53,145,3,'#ddd7f6'),
      head:path('M79 49q-3 -17 10 -28l18 -17 11 -2 2 13 9 11 11 13 -7 8 -7 -9 -15 -7 -14 8 -5 14 -6 9 -7 -5Z',paint(id+'cloth'),rim('#49405a',1.8))+
        line('M83 56q5 -24 27 -29l17 7 8 10','#c8b58a',1.7)+
        path('M108 23l4 -10 4 6 -2 7Z','#d3c299'),
      weapon:at(166,117,1,`${path('M-3 80l-1 -148 4 -12 4 11 0 146Z','#8c7664',rim('#564e4c',1.5))}
        ${line('M0 68l0 -123','#d9be8d',1.2)}
        ${path('M-1 -57q-18 -12 -12 -28l2 -9 3 15 9 10 8 -12 2 -11 5 13 -8 19Z','#c0aca1',rim('#756a75',1.6))}
        <g class="staff-crystal">${dot(1,-87,21,paint(id+'halo'))}${path('M-8 -85l7 -18 9 15 -2 13 -6 5Z','#b9a4df',rim('#eee1bb',1.5))}${path('M-1 -103l0 21 7 7 2 -13Z','#786fba')}</g>
        ${line('M-3 -45l6 2 M-3 -40l6 2 M-3 31l6 2','#d1b37a',2)}`,20)
    };
  }
  function pathfinder(id) {
    return {
      cape:path('M74 83q-22 5 -26 24l-10 26 -25 23 13 2 -8 9 12 1 -4 10 20 -5 1 6 18 -12 13 -30Z',paint(id+'cloth'),rim('#314d49',2))+
        path('M37 148l-8 12 10 -3 2 5 14 -11 5 -12Z','#7c9a75')+
        at(60,114,1,`${path('M-7 22l7 -39 14 4 -8 43Z','#785841',rim('#4e4f41',1.5))}
        ${many(3,i=>line(`M${i*4} -10l${6+i*2} -37 M${7+i*5} -40l-2 -7 -4 4`,'#a6a67a',1.8))}`,-19),
      armor:path('M76 90l16 -7 15 8 10 -6 9 10 -8 26 -9 20 -33 3 -4 -23 -5 -17Z',paint(id+'metal'),rim('#465747',2))+
        path('M73 89q14 -12 24 -7l12 5 13 -3 -6 12 -18 5 -11 -4 -10 6 -13 -1Z',paint(id+'cloth'),rim('#54634f',1.5))+
        path('M78 103l8 -3 24 43 -8 2Z','#8d694c',rim('#5a503b',1.1))+
        path('M78 142l32 -3 4 8 -36 7Z','#976e4d',rim('#65503d',1.4))+
        path('M92 142l9 -1 1 8 -8 2Z','#d3b880')+
        path('M74 151l14 -1 -8 30 -9 4 -5 -7Z',paint(id+'cloth'),rim('#777d5c',1.1))+
        path('M111 149l9 9 -7 13 -12 -5 2 -12Z','#947457',rim('#584c3f',1.4)),
      offhand:path('M53 126l15 5 -4 18 -13 -1Z','#725b48',rim('#879076',1.4))+
        line('M54 131l11 9 M53 138l10 6','#b49f75',1.5),
      head:path('M80 56q-1 -26 10 -36 16 -15 33 -8l12 19 7 7 -10 4 -7 -10 -10 -2 -14 8 -5 17 -9 12Z',paint(id+'cloth'),rim('#39554f',2))+
        path('M88 49q9 -20 26 -22l15 4 8 7 -13 -4 -9 -4 -18 12 -8 17Z','#9ba882')+
        path('M94 25q-17 -10 -23 -23 14 2 22 10l-4 -9q10 8 11 18Z','#bbad76',rim('#788066',1.1)),
      weapon:at(169,105,1.07,`${path('M-3 -1l-4 -14 4 -25 15 -17 -6 22 0 16 -5 14Z','#d3dbbc',rim('#667d71',1.3))}
        ${path('M12 -57l-9 28 -3 24 4 -4 2 -14v-16Z','#879e90')}${path('M-9 -4l8 2 7 -2 4 -8 2 4 -3 10 -10 3 -10 -5Z','#c7ad74',rim('#756749',1.1))}
        ${path('M-3 2h5l-1 18 -4 1Z','#705844')}${line('M-2 6l4 2 M-2 12l3 2','#c0a576',1.4)}`,35)
    };
  }
  const outfits={
    vanguard:{cloth:['#7fa9b4','#416e8c','#284654'],metal:['#ebe5c9','#aac0c1','#667b89'],light:'#a2d8ee',make:vanguard},
    arcanist:{cloth:['#a091b5','#615b82','#33374f'],metal:['#bdb7c7','#878caa','#4b526f'],light:'#cdc1ff',make:arcanist},
    pathfinder:{cloth:['#a3b695','#658469','#375854'],metal:['#aa9d79','#748467','#516154'],light:'#c7dda2',make:pathfinder}
  };
  function hero(classId) {
    if (!Object.hasOwn(outfits,classId)) return Art.hero();
    const id=`outfit${++serial}`, palette=outfits[classId];
    return Art.hero({...palette.make(id), id:classId, defs:classPaint(id,palette),
      aura:`<g class="class-orbit">${dot(101,102,91,paint(id+'halo'),.44)}
        ${many(6,i=>path(`M${[40,55,141,170,62,153][i]} ${[69,36,21,79,201,173][i]}l2 4 4 1 -4 2 -2 4 -1 -4 -3 -2 3 -1Z`,palette.light,`opacity="${.28+i*.055}"`))}</g>`});
  }
  function cuirass(id,heavy) {
    const material=heavy?paint(id+'steel'):paint(id+'hide');
    return `${path('M21 24l12 -11 11 7 10 0 12 -8 14 14 -10 14 -3 17 5 15 -18 13 -25 -5 -6 -12 4 -23Z',material,rim())}
      ${path('M32 15q13 14 32 -1l3 8 -17 12 -16 -7Z',heavy?'#89999d':'#815e49')}
      ${path('M27 30l20 13 24 -14 -7 17 -17 10 -16 -8Z',heavy?'#afbbb4':'#a28460')}
      ${line('M29 30l18 12 23 -14 M33 48l15 7 15 -8 M33 60l14 6 17 -7',heavy?gold:'#c09c72',2)}
      ${path('M23 61l44 -4 2 9 -43 6Z','#755d49',rim('#4d473d',1.2))}
      ${path('M43 60l10 -1 1 9 -11 1Z',gold,rim('#806b4e',1.2))}
      ${heavy?path('M22 19l9 -9 9 5 -7 11 -15 9 -7 -6Z',material,rim())+path('M62 15l7 -8 13 5 7 14 -6 6 -17 -9Z',material,rim()):line('M31 23l6 3 -5 8 M66 24l-5 3 5 6 M33 74l8 -1 M58 72l7 -1','#ccb187',2)}`;
  }
  function robe(id) {
    return `${path('M36 15l10 -8 12 4 8 8 10 10 10 24 -14 7 -8 -16 2 18 11 22 -27 7 -12 -8 -18 3 8 -27 2 -14 -8 11 -12 -7 13 -27Z',paint(id+'violet'),rim('#4b465c',2))}
      ${path('M35 19l10 9 16 -12 3 5 -19 22 -5 13 -8 -6 8 -15 -9 -11Z','#b0aab2')}
      ${line('M14 49l10 6 M76 54l8 -4 M28 80l10 -3 12 8 19 -5 M49 56l-4 16 5 7 4 -7 -2 -12',gold,2)}
      ${path('M35 48l25 -5 2 7 -28 7Z','#998b9d',rim('#b8a27d',1.2))}${dot(48,48,3.2,'#d4c8e4')}`;
  }
  function necklace(id,name) {
    const epic=name==='echoSigil',scholar=name==='scholarAmulet',leaf=name==='forestCharm';
    const chain=epic?'#e8cba6':gold;
    let pendant;
    if (leaf) pendant=path('M45 78q-14 -16 -9 -29 6 -10 24 -9 -4 26 -15 38Z','#8eae80',rim('#c1b782',2))+line('M45 74l10 -28 M48 67l-7 -10 M51 60l7 -7','#d9d6a4',1.5);
    else if (scholar) pendant=path('M26 44q10 -5 20 0 12 -8 24 -5l1 26q-11 -2 -23 7 -10 -6 -21 -3Z','#b59b73',rim('#66594c',2))+path('M30 44q8 -3 17 2v21q-10 -6 -18 -3Z','#e1d7b4')+path('M49 46q11 -7 17 -5l1 20q-9 0 -17 6Z','#c7b990')+line('M33 50l10 2 M54 51l8 -4 M54 56l9 -4','#928368',1.2);
    else if (epic) pendant=`${dot(48,59,24,paint(id+'glow'))}${oval(48,57,18,22,'none','stroke="#bdb0d1" stroke-width="2.5"')}${path('M47 33l6 14 15 8 -12 9 -9 16 -8 -17 -13 -8 15 -9Z','#a493bf',rim('#e9cda1',2))}${path('M48 45l9 11 -10 12 -8 -12Z','#e2d8ed',rim('#b99885',1.4))}${line('M44 56l3 -6 4 5 -4 6','#9385aa',1.7)}`;
    else pendant=gem(48,77,.72,-5,themes.sentences);
    return `${line('M20 11q-8 13 5 25l19 13 M76 11q7 14 -6 25L53 48',chain,2.8)}${line('M20 13q-3 13 7 20 M73 15q2 9 -5 14','#e7dfb4',1.2)}
      ${pendant}${oval(48,42,3.5,4.4,'none',`stroke="${chain}" stroke-width="2"`)}`;
  }
  function gear(name) {
    const id=`item${++serial}`;
    const defs=`<defs>${grad(id+'steel','#eee5c9','#abbabc','#627987')}${grad(id+'hide','#c29e76','#987052','#695549')}${grad(id+'violet','#ac9fb6','#746f92','#444b65')}${aura(id+'glow','#d8c2eb')}</defs>`;
    const blades={travelerSword:'plain',crystalBlade:'crystal',runicSword:'rune'};
    let body;
    if (Object.hasOwn(blades,name)) body=at(35,63,1.15,blade(blades[name]),35);
    else if (name==='guardianArmor'||name==='leatherArmor') body=cuirass(id,name==='guardianArmor');
    else if (name==='enchantedRobe') body=robe(id);
    else body=necklace(id,name);
    return svg('0 0 96 94','gear-art gear-'+name,defs+body);
  }
  const shapeText=(x,y,text,color,size=13)=>`<text x="${x}" y="${y}" fill="${color}" text-anchor="middle" font-family="Georgia,serif" font-size="${size}" letter-spacing="1">${text}</text>`;
  function slab(x,y,s,t,rune='diamond'){
    const glyphs={diamond:'M-7 -78l9 -11 8 10 -8 12Z M1 -66v10',fork:'M-8 -74l7 9 10 -14 M-1 -65v14',branch:'M-3 -84v29 M-3 -73l10 -10 M-3 -63l-7 -5'};
    return at(x,y,s,`${path('M-22 0l4 -105 11 -18 21 2 11 21 3 99Z',t.wall,rim(t.shadow,2))}
      ${path('M-17 -105l11 -17 15 1 -11 14 -8 102 -10 5Z',t.face)}
      ${path('M8 -111l8 -6 9 19 3 93 -13 -6Z',t.shadow)}
      ${line(glyphs[rune],t.light,2.3,.85)}${line('M6 -45l-5 9 6 5 -2 14',t.shadow,1.5)}
      ${path('M-31 1l9 -9 14 2 12 -5 23 7 11 7 -30 3Z',t.stone)}`);
  }
  function floor(id,t){
    return `${path('M0 359Q310 344 597 353t603 -4v211H0Z',paint(id+'floor'))}
      ${many(7,i=>line(`M${-165+i*226} 560l${(3-i)*144} -206`,t.rim,1.8,.21))}
      ${many(4,i=>line(`M0 ${380+i*47}q584 ${18+i*4} 1200 -7`,t.rim,1.6,.19))}
      ${oval(606,436,274,40,'none',`stroke="${t.light}" stroke-width="1.5" opacity=".57"`)}
      ${oval(606,436,259,35,'none',`stroke="${t.rim}" stroke-dasharray="4 10" opacity=".57"`)}
      ${path('M401 436l204 -29 205 29 -205 30Z','none',`stroke="${t.light}" opacity=".31"`)}`;
  }
  function runeWheel(x,y,r,t) {
    return at(x,y,r/100,`${oval(0,0,99,99,'none',`stroke="${t.rim}" stroke-width="2" opacity=".68"`)}
      ${oval(0,0,90,90,'none',`stroke="${t.light}" stroke-dasharray="2 8" stroke-width="2" opacity=".8"`)}
      ${many(12,i=>`<g transform="rotate(${i*30})">${path('M0 -102l3 5 -3 5 -3 -5Z',i%3===0?t.light:t.rim)}</g>`)}
      ${line('M-87 0H87 M0 -87V87 M-61 -61l122 122 M-61 61L61 -61',t.rim,1,.22)}`);
  }
  function wordsChamber(id,t) {
    const bough=(x,flip)=>`<g transform="translate(${x} 0) scale(${flip} 1)">
      ${path('M-18 0h144q-5 38 -26 67 40 -28 72 -27l43 -30 40 -10h42l-48 24 -49 44 -61 17 -40 39q-27 60 -11 129l24 46 36 23 -30 1 -24 -12 9 31 -30 -11 -18 -28 -13 22 -32 8 12 -25 -36 10 -6 -28 20 -30 14 -56 -2 -66Z',t.shadow)}
      ${path('M60 286q21 -56 5 -123 -14 -48 8 -93l16 -24 -5 29q-21 30 -4 69 5 -29 27 -45 39 -35 82 -48l33 -21 -25 30 -56 23 -33 30 -19 43 8 95 17 37 -30 -21 -4 -40Z',t.wall)}
      ${line('M94 294q-23 -41 -17 -96 M55 183l-2 -38 9 -29 M119 99l44 -31',t.face,2.2,.65)}
      ${many(8,i=>at(112+i*18,55-(i%4)*8,.73,`${path('M0 0q-9 -9 -25 -6 8 11 24 9 -13 6 -11 18 12 -4 15 -18Z','#698976')}`))}
    </g>`;
    const arch=path('M345 346V228q24 -109 119 -148l37 -39 87 -31 91 25 47 42q113 27 143 141v127h-61v-88q-4 -111 -118 -164l-100 -37 -110 46q-89 46 -92 149v95Z',paint(id+'wall'),rim(t.shadow,4))+
      path('M393 346V245q5 -107 102 -152l95 -39 110 41q93 45 101 150v99h-14v-98q-8 -98 -95 -138L591 69l-91 40q-88 38 -93 138v99Z',t.face)+
      many(10,i=>{const side=i<5?-1:1,k=(i%5+1)/6;return line(`M${590+side*(186-137*k*k)} ${236-144*k}l${side*25} -13`,t.shadow,3,.7);});
    return `${rect(0,0,1200,560,paint(id+'sky'))}
      ${dot(598,182,240,paint(id+'halo'))}${runeWheel(590,183,92,t)}
      ${gem(593,238,1.82,1,t)}${arch}
      ${slab(280,353,1.18,t,'fork')}${slab(910,351,1.32,t,'branch')}${slab(421,353,.67,t)}${slab(773,351,.71,t,'branch')}
      ${path('M487 332h200l24 10H463Z M461 346h251l42 15H427Z',t.face,rim(t.shadow,1.8))}
      ${floor(id,t)}${bough(0,1)}${bough(1200,-1)}
      ${gem(153,379,2.17,-13,t)}${gem(180,380,1.43,14,t)}${gem(127,384,1.08,-30,t)}
      ${gem(1007,370,2.04,15,t)}${gem(978,373,1.18,-8,t)}${gem(1031,373,1.23,24,t)}
      ${[['oak',451,164],['dew',736,151],['leaf',500,262]].map(([word,x,y],i)=>gFloatingTablet(x,y,.85,i,t,word)).join('')}
      ${path('M287 0h33l277 327 -61 15Z M360 0h13l201 203Z M898 0h32L726 284l-50 26Z',t.light,'opacity=".065"')}`;
  }
  function gFloatingTablet(x,y,s,i,t,word){
    return at(x,y,s,`<g class="trial-float" style="--lag:-${i*.8}s">${path('M-23 -14l38 -3 8 7 -4 18 -35 5 -10 -7Z',t.wall,rim(t.rim,1.2))}${shapeText(0,3,word,t.light,12)}</g>`,i%2?9:-7);
  }
  function book(x,y,s,angle,t){
    return at(x,y,s,`${path('M-25 -8q12 -4 25 1 12 -8 27 -5l2 23q-18 -2 -28 5 -13 -6 -26 -2Z','#7c7365',rim(t.shadow,1.7))}
      ${path('M-22 -11q11 -4 22 3v20q-11 -6 -22 -4Z','#e0d8b5')}${path('M1 -8q12 -8 22 -6l1 21q-13 -1 -23 6Z','#b9b695')}
      ${line('M-17 -5l12 3 M-17 0l10 3 M5 -4l14 -4 M5 2l12 -3','#8b8e80',1.4)}`,angle);
  }
  function sentenceChamber(id,t){
    const libraryWing=(x,flip)=>`<g transform="translate(${x} 0) scale(${flip} 1)">
      ${path('M0 0h363l50 26 -15 285 -27 46L0 390Z',paint(id+'wall'),rim(t.shadow,3))}
      ${[0,1,2].map(bay=>{const x=25+bay*126;return at(x,0,.98,`${path('M0 317V90q2 -38 51 -65 50 21 51 61v202Z',t.shadow,rim(t.face,3))}
        ${[0,1,2,3].map(row=>{const y=126+row*46;return `<g>${many(8,i=>{const bx=i*10+11,ht=14+(i*13+row*11+bay*3)%22;return `${path(`M${bx} ${y}l-1 -${ht} 6 -2 2 ${ht}Z`,['#7f8989','#a98d76','#899ca2','#829486'][i%4])}${line(`M${bx} ${y-7}l5 -1`,t.rim,1,.65)}`;})}${line(`M4 ${y+1}l92 -6`,t.face,4)}</g>`;}).join('')}
        ${path('M-4 321l3 -235 6 -19 2 248 8 8Z',t.face)}`);}).join('')}
      ${line('M0 337l376 -33 M0 350l382 -33',t.rim,2,.55)}
      ${path('M0 0h414l-14 24 -39 24 -47 -6 -37 -16L0 46Z',t.shadow)}
    </g>`;
    const ladder=at(195,343,.98,`${line('M-18 0l37 -168 M-1 -1l37 -169','#b6a38a',4)}
      ${many(8,i=>line(`M${-14+i*4.3} ${-13-i*20}l16 -1`,'#c4b79a',2.4))}`);
    return `${rect(0,0,1200,560,paint(id+'sky'))}${dot(600,135,221,paint(id+'halo'))}
      ${path('M397 306V130q2 -62 60 -101 63 38 67 101v176Z M677 307V126q6 -67 63 -99 63 36 73 98v179Z',t.wall,'opacity=".73"')}
      ${path('M421 297V137q-1 -45 38 -80 36 34 39 81v159Z M701 294V126q7 -43 38 -69 46 32 46 71v166Z',t.sky)}
      ${libraryWing(0,1)}${libraryWing(1200,-1)}${ladder}${runeWheel(606,167,76,t)}
      <g class="trial-float">${book(608,173,2,-4,t)}</g>
      ${book(817,112,1.02,18,t)}${book(430,235,.92,-18,t)}
      ${gFloatingTablet(500,149,.7,1,t,'May')}${gFloatingTablet(703,213,.75,2,t,'I')}${gFloatingTablet(748,162,.7,3,t,'read')}
      ${path('M479 342l25 -16 46 -9 10 -38h91l12 35 52 13 16 16Z',t.stone,rim(t.shadow,2))}${book(606,276,1.83,0,t)}
      ${floor(id,t)}${gem(127,371,1.64,-13,t)}${gem(150,375,.95,10,t)}${gem(1037,367,1.63,11,t)}
      ${line('M381 -4q20 54 76 105 M818 -5q-25 53 -72 94',t.rim,1.7,.7)}
      ${dot(459,108,24,paint(id+'halo'))}${dot(745,100,24,paint(id+'halo'))}
      ${path('M452 102l7 -7 7 7 -5 13 -6 -1Z M739 93l7 -7 6 7 -5 13 -5 -1Z',t.light)}
      ${path('M0 513l121 -30 88 17 82 60H0Z M1200 473l-96 13 -72 52 -49 22h217Z',t.shadow)}`;
  }
  function echoChamber(id,t){
    const pipe=(x,y,s)=>at(x,y,s,`${path('M-15 0l-4 -144 7 -24 18 -6 12 13 -6 149Z',paint(id+'wall'),rim(t.shadow,2))}
      ${oval(-1,-157,13,9,t.shadow,`stroke="${t.rim}" stroke-width="2"`)}
      ${line('M-10 -143v122 M4 -143L-1 -20 M-14 -36l28 -3',t.rim,1.7,.7)}`);
    const bell=(x,y,s)=>at(x,y,s,`${line('M0 -90v64',t.rim,2)}
      <g class="echo-bell">${path('M-20 6q8 -11 9 -22 1 -10 11 -16 12 6 14 18l6 17 6 5 -46 4Z','#a39a8b',rim(t.shadow,2))}
      ${line('M-17 6l36 -4 M-4 -22l7 -2','#e1cc9f',1.8)}${dot(2,10,4.4,gold)}</g>`);
    const fork=(x,y,s,flip)=>`<g transform="translate(${x} ${y}) scale(${flip*s} ${s})">
      ${path('M-30 0l10 -12 10 -7v-68q-28 -17 -31 -46l-6 -76 12 -38 5 116q3 14 20 22l15 -6q14 -10 17 -26l9 -107 10 30 -3 81q-3 30 -29 49l-1 69 9 8 10 5Z',paint(id+'wall'),rim(t.shadow,3))}
      ${line('M-39 -212l4 81q5 24 32 32 29 -9 34 -37l5 -77 M-4 -92v70',t.rim,2.2)}
      ${gem(0,-112,.85,1,t)}${path('M-37 1h75l10 8h-93Z',t.stone)}</g>`;
    return `${rect(0,0,1200,560,paint(id+'sky'))}
      ${many(37,i=>dot((i*179+31)%1190,30+(i*67)%227,i%5?1.2:2.2,t.light,.5))}
      ${path('M0 0h1200v28l-118 12 -50 46 -113 -14 -54 39 -51 -35 -63 1 -37 -31 -81 12 -50 -23 -67 35 -90 -7 -57 62 -74 -28 -52 44 -48 -20 -99 30 -66 -21Z',t.shadow)}
      ${many(9,i=>pipe(85+i*32,337,.67+(i%4)*.2))}${many(9,i=>pipe(838+i*32,332,.7+((i+1)%4)*.19))}
      ${dot(599,183,209,paint(id+'halo'))}
      <g class="echo-resonance">${oval(605,181,125,79,'none',`stroke="${t.rim}" stroke-width="2.1" opacity=".59" transform="rotate(-12 605 181)"`)}
      ${oval(605,181,104,65,'none',`stroke="${t.light}" stroke-dasharray="2 7" opacity=".7" transform="rotate(-12 605 181)"`)}
      ${oval(605,181,81,51,'none',`stroke="${t.rim}" stroke-width="1.4" opacity=".57" transform="rotate(-12 605 181)"`)}</g>
      ${bell(606,178,1.64)}${bell(488,124,1.02)}${bell(736,119,.91)}
      ${path('M0 325q166 -23 353 1t351 -8q257 -24 496 -1v88H0Z',t.gem,'opacity=".72"')}
      ${many(21,i=>line(`M${(i*127)%1150} ${335+(i*13)%33}q23 -2 47 -1`,t.light,1.3,.45))}
      ${floor(id,t)}${fork(348,350,1.19,1)}${fork(860,344,1.12,-1)}
      ${gem(172,376,2.23,-24,t)}${gem(197,383,1.64,6,t)}${gem(1047,373,2.16,15,t)}${gem(1022,376,1.43,-7,t)}
      ${path('M-10 334q147 -22 307 -4t315 -3q195 -22 361 -2 109 15 240 0 -87 30 -252 15t-347 4q-175 12 -318 -1t-303 7Z',t.light,'class="echo-haze" opacity=".17"')}`;
  }
  function room(dungeonId,fit='xMidYMid slice') {
    const id=`trial${++serial}`, t=themes[dungeonId]||themes.words;
    const defs=`<defs>${grad(id+'sky',t.night,t.sky,t.shadow)}${grad(id+'floor',t.stone,t.wall,t.base)}${grad(id+'wall',t.face,t.wall,t.shadow)}${aura(id+'halo',t.light)}</defs>`;
    const draw=({words:wordsChamber,sentences:sentenceChamber,echoes:echoChamber})[dungeonId]||wordsChamber;
    const motes=many(18,i=>`<g class="trial-mote" style="--lag:-${i%7}s">${dot(135+(i*151)%951,89+(i*73)%282,i%4?1.6:2.5,t.light,.75)}</g>`);
    return svg('0 0 1200 560','trial-room-art trial-room-'+dungeonId,defs+draw(id,t)+motes,fit);
  }
  function greenStag(id,t){
    const horn=(x,y,s,tilt)=>at(x,y,s,`${path('M-3 2q7 -15 4 -36l-7 -21 2 -17 7 28 3 9 9 -16 3 -24 3 20 -7 29 17 -9 15 -18 -7 18 -22 17 -13 4 -3 17Z','#baae81',rim('#686d59',1.4))}
      ${line('M2 -4l7 -21 11 -21 M9 -21l22 -13','#e3d795',1.1)}`,tilt);
    const leg=(x,y,s,lean,near)=>at(x,y,s,`${path('M-7 -9l15 1 1 24 -10 24 1 18 -9 13 -7 0 4 -12 3 -22 5 -26Z',near?paint(id+'shell'):t.darkGem,rim(t.shadow,1.6))}
      ${path('M-8 54l9 3 -4 10 -11 4 -2 -3Z',t.base)}${line('M3 1v12l-8 19',t.light,1.4,.7)}`,lean);
    return `${oval(117,217,82,6,'#112c28','opacity=".4"')}
      ${leg(111,150,.85,-5,false)}${leg(167,151,.87,-13,false)}
      <g class="stag-spine">
      ${path('M77 102q13 -6 34 4l36 10 24 -8 17 7 9 22 -11 20 -24 12 -40 -1 -24 -9 -18 -19 -15 -5Z',paint(id+'body'),rim(t.shadow,2.6))}
      ${path('M94 111l29 0 22 11 29 -7 14 6 -13 15 -40 4 -22 -4Z','#84ad91')}${path('M132 142l37 -3 23 -12 -6 28 -21 12 -36 -3Z','#579588')}
      ${path('M179 117l14 -10 13 1 -8 14 -12 6Z',t.gem,rim(t.shadow,1.4))}
      ${path('M83 93l-7 24 11 28 20 13 12 -7 -10 -25 -11 -24Z',paint(id+'shell'),rim(t.shadow,2))}
      ${path('M91 108l12 15 7 22 -11 -2 -10 -11Z','#bad7ab')}${line('M99 128l3 7 6 3',gold,1.5)}
      ${leg(96,151,.96,12,true)}${leg(164,156,.9,5,true)}
      <g class="stag-head">${horn(95,82,.78,17)}${horn(70,82,.82,-12)}
      ${path('M60 80l-13 -17 6 -2 17 6 12 9 13 -8 17 -2 -9 16 -13 7 -6 20 -16 10 -12 -5 -13 1 -8 -6 11 -16Z',paint(id+'shell'),rim(t.shadow,2.1))}
      ${path('M58 84l12 -9 14 6 -6 13 -12 6 -18 7 -5 -4 11 -12Z','#c3d6ac')}
      ${path('M61 89l11 -4 7 1 -8 8 -10 1Z','#365f59')}${dot(69,89.5,2.4,'#e4f1bd')}
      ${path('M39 103l9 -2 3 7 -8 4 -8 -4Z','#507d72')}
      ${line('M84 84l8 -7 9 -3 M47 112l12 -3 M67 107l11 -5',gold,1.5)}
      </g>
      ${gem(124,118,.74,-12,t)}${gem(141,122,.63,11,t)}${gem(154,121,.44,17,t)}
      ${path('M123 145l8 -8 10 8 -9 12Z','#a7d5ae',rim(gold,1.8))}${line('M131 140v11 M127 144l4 4 5 -5','#578a78',1.2)}</g>`;
  }
  function vellumOwl(id,t){
    const wing=(x,y,flip)=>`<g transform="translate(${x} ${y}) scale(${flip} 1)"><g class="folio-wing">
      ${path('M3 -1q-32 -24 -49 -59l-16 -12 -1 27 -12 -17 0 25 -10 -13 1 33 -9 -9 4 23 14 22 42 10Z','#929b9e',rim(t.shadow,2.3))}
      ${path('M-8 2q-30 -14 -47 -51 0 26 19 48l-12 -6 16 16Z','#d8d7bd')}
      ${path('M-40 -2l-19 -20 3 18 -13 -13 4 19 14 18 23 1Z','#b8bdae')}
      ${line('M-11 4l-24 -14 M-15 11l-17 -8 M-50 -27l-5 -13 M-48 -2l-11 -13','#7e8889',1.4)}
      ${path('M-5 5l-18 -1 -9 6 16 6 16 0Z',t.gem)}
      </g></g>`;
    return `${oval(110,210,69,5,'#20333e','opacity=".33"')}
      <g class="owl-hover">${wing(97,109,1)}${wing(136,106,-1)}
      ${path('M80 118q0 -36 36 -54 30 -4 39 33l-9 55 -18 34 -16 -8 -8 9 -26 -33Z',paint(id+'shell'),rim(t.shadow,2.4))}
      ${path('M78 148q12 7 24 3l7 10 14 -11 16 -6 -9 26 -16 9 -19 -5Z','#b9bdaf')}
      ${path('M81 166l8 5 11 0 -3 8 -18 3 -7 -4Z M119 173l8 -6 6 5 11 -5 -2 8 -15 8 -11 -3Z','#c4a77c',rim('#776d60',1.2))}
      ${path('M82 121q13 -4 27 5 15 -14 33 -13l-4 39q-14 0 -27 10 -14 -9 -31 -9Z','#817f79',rim('#5c6570',2))}
      ${path('M85 120q13 -2 23 7v28q-10 -8 -24 -7Z','#e0d9b6')}${path('M111 127q14 -12 27 -13l-4 32q-14 0 -23 9Z','#c9c6a7')}
      ${line('M90 128l13 4 M90 135l13 5 M116 131l15 -7 M116 138l14 -6','#9a9a88',1.2)}
      <g class="owl-head">${path('M65 71l-5 -33q22 2 40 19l17 -3 14 -12 25 -12 -2 28q14 13 10 31 -6 29 -44 38 -35 -2 -52 -22l-7 -17Z',paint(id+'body'),rim(t.shadow,2.4))}
      ${path('M64 45l22 13 9 9 -21 -6Z M137 53l13 -15 -2 21 -13 6Z',t.light)}
      ${path('M68 76q15 -15 37 -5l9 9q10 -22 32 -22l12 5 -3 22 -16 20 -24 11 -23 -3 -19 -17Z','#d3d0b6')}
      ${oval(90,86,15,13,'#71848c')}${oval(135,78,15,13,'#748794')}${oval(91,86,10,9,t.base)}${oval(135,78,10,9,t.base)}
      <g class="guardian-eyes">${dot(91,85,4.1,t.light)}${dot(134,77,4.1,t.light)}${dot(90,83,1.5,'#fff2cb')}${dot(133,75,1.5,'#fff2cb')}</g>
      ${path('M103 92l10 -9 9 4 -8 16Z','#ccb17c',rim('#8b8165',1.4))}
      ${line('M74 75q16 -12 32 0 M122 69q9 -11 25 -10 M87 103l8 4 9 -1 M130 99l8 -5',gold,1.7)}
      ${path('M111 66l-5 -25 15 -20 13 -5 -3 16 -11 17 3 12Z',t.gem,rim(t.shadow,1.4))}${line('M114 58l13 -31',t.light,1.4)}</g></g>`;
  }
  function resonanceRay(id,t) {
    const antenna=(x,y,flip)=>`<g transform="translate(${x} ${y}) scale(${flip} 1)">${line('M0 0q-13 -24 -8 -45t22 -33q-13 14 -9 24','#c4b49c',4)}
      ${line('M-7 -40q-14 -20 -7 -37','#e1c795',1.8)}${dot(4,-50,4,t.light)}${dot(4,-50,10,paint(id+'halo'))}</g>`;
    const fin=(x,y,flip)=>`<g transform="translate(${x} ${y}) scale(${flip} 1)"><g class="echo-fin">
      ${path('M1 -3q-16 -37 -48 -53l-24 -22q0 36 15 59 -2 9 -19 2 18 27 40 29l-4 6q17 4 36 -10Z',paint(id+'shell'),rim(t.shadow,2))}
      ${path('M-63 -65q10 27 27 42l26 15 -12 -20 -25 -21Z',t.light,'opacity=".65"')}
      ${line('M-59 -50q15 35 43 47 M-47 -10q11 10 23 11',gold,1.4)}
      </g></g>`;
    return `${oval(110,211,70,6,paint(id+'halo'))}
      <g class="ray-drift">${path('M120 142q-2 27 21 30 31 -1 27 18 -5 17 -37 12 39 1 30 -16 -5 -5 -23 -3 -29 2 -36 -29Z',t.darkGem,rim(t.gem,1.5))}
      ${fin(81,121,1)}${fin(141,119,-1)}
      ${antenna(95,87,1)}${antenna(133,86,-1)}
      ${path('M74 124q-2 -35 22 -52l16 -13 12 6 12 15q23 15 22 43l-12 25 -29 18 -32 -18Z',paint(id+'body'),rim(t.darkGem,2.3))}
      ${path('M76 115l23 -26 13 -18 11 4 22 27 6 13 -16 -4 -15 8 -10 10 -15 -9Z',paint(id+'shell'),rim(t.light,1.35))}
      ${path('M88 119q10 -3 18 5l-2 6 -9 -1Z M125 115q8 -10 19 -9l-4 9 -10 6Z',t.shadow)}
      ${line('M92 120l8 4 M131 115l7 -5',t.light,2.6)}
      ${path('M108 133l7 -4 7 3 -6 5Z','#d6b9c9')}
      ${path('M94 146l17 6 7 7 8 -9 15 -10 -8 17 -16 11 -18 -12Z',t.darkGem)}
      ${line('M82 116q16 -19 28 -21l8 -14 16 16 M102 144l13 6 15 -9',gold,1.8)}
      ${dot(116,96,17,paint(id+'halo'))}${path('M109 95l7 -11 7 9 -7 10Z',t.light,rim(gold,1.4))}
      <g class="echo-resonance">${oval(115,148,68,17,'none',`stroke="${t.light}" stroke-width="1.8" stroke-dasharray="47 8 5 8 22 94" transform="rotate(-12 115 148)"`)}</g>
      </g>`;
  }
  function guardian(dungeonId) {
    const id=`trialGuardian${++serial}`, t=themes[dungeonId]||themes.words;
    const defs=`<defs>${grad(id+'shell',t.light,t.gem,t.darkGem)}${grad(id+'body',t.face,t.gem,t.shadow)}${aura(id+'halo',t.light)}</defs>`;
    const maker=({words:greenStag,sentences:vellumOwl,echoes:resonanceRay})[dungeonId]||greenStag;
    return svg('0 0 226 225','trial-guardian-art guardian-'+dungeonId,defs+maker(id,t));
  }
  return Object.freeze({hero,gear,room,guardian});
})();
