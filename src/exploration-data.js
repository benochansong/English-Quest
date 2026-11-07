// Chapter 3 is authored offline. Coordinates and collision geometry share the 960 × 640 world.
const ExplorationData = (() => {
  const activities=[];
  function activity(id,area,kind,english,ko,objective,answer,choices,explanation,hint,extra={}) {
    activities.push({id,chapter:3,stage:7,area,kind,type:kind==='listening'?'listening':kind==='order'?'order':'sentence',
      difficulty:area==='forest'||area==='grove'?1:2,english,ko,objective,answer,choices,explanation,hint,
      alternatives:[],tags:['explore-'+id],...extra});
  }
  function order(id,area,en,ko,explanation,extra={}) {
    activity(id,area,'order',en,ko,'단어 조각을 순서대로 이어 문장을 완성하세요.',en,[],explanation,
      '명령문은 보통 행동을 나타내는 동사로 시작해요.',{words:en.replace(/[.!?]/g,'').split(' '),...extra});
  }
  activity('f-map','forest','reading','Look at the map.','지도를 보세요.','낡은 지도에 적힌 첫 안내를 읽으세요.','지도를 보세요.',
    ['지도를 보세요.','지도를 덮으세요.','강에서 기다리세요.'],'look at은 ~을 보라는 뜻이에요. 지도에는 숲, 유적, 동굴이 이어져 있어요.','map은 길을 찾을 때 보는 물건이에요.');
  activity('f-rowan','forest','response','Can you find the old bridge?','오래된 다리를 찾을 수 있나요?','로완에게 다리를 찾아보겠다고 답하세요.','Yes, I can.',
    ['Yes, I can.','No, thank you.','It is a book.'],'Can you ...?로 가능 여부를 물으면 Yes, I can.으로 답할 수 있어요.','질문에 쓰인 can을 답에도 쓸 수 있어요.',{requires:['f-map']});
  activity('f-directions','forest','direction','Go north to the old tree.','오래된 나무가 있는 북쪽으로 가세요.','화면 위쪽이 북쪽이에요. 안내를 읽고 북쪽 표식까지 걸어가세요.','f-north',
    ['f-north','f-south'],'north는 북쪽이에요. 이 지도에서는 화면 위쪽으로 이동해요.','방향 표식 N은 north를 줄인 글자예요.',{requires:['f-rowan']});
  activity('f-mira','forest','response','Can you help me read this map?','이 지도를 읽는 것을 도와주시겠어요?','지도 읽기를 도와주겠다고 답하면 미라가 동료가 됩니다.',"Yes, let's read it together.",
    ["Yes, let's read it together.",'No, I cannot help.','The water is cold.'],"Let's ... together.는 함께 ~하자고 제안하는 말이에요. 미라는 글을 읽을 때 작은 힌트를 줄 수 있어요.",'help는 도와주다, together는 함께라는 뜻이에요.',{requires:['f-directions'],recruit:'mira'});
  activity('f-bram','forest','locate','Look behind the old tree.','오래된 나무 뒤를 보세요.','브람의 안내를 읽고 발자국 표식을 찾아 상호작용하세요.','f-tracks',
    ['f-tracks','f-tree-front'],'behind는 ~뒤에라는 뜻이에요. 큰 나무 위쪽의 발자국을 찾으면 브람이 합류해요.','나무 앞과 뒤를 비교해 보세요. 지도에서 뒤는 나무 위쪽이에요.',{requires:['f-directions'],recruit:'bram'});
  activity('f-moon','forest','listening','Follow the blue lights.','파란 불빛을 따라가세요.','소리를 듣거나 글을 읽고 달빛 길의 불빛 표식까지 이동하세요.','f-blue-lights',
    ['f-blue-lights','f-amber-lights'],'blue lights는 파란 불빛이에요. 표식에는 색 이름도 함께 적혀 있어요.','lights는 여러 개의 불빛이에요.',{choice:'crossroad'});
  order('f-stone','forest','Follow the stone road.','돌길을 따라가세요.','follow는 따라가다, stone road는 돌길이에요.',{choice:'crossroad'});
  order('f-bridge','forest','Cross the bridge.','다리를 건너세요.','Cross the bridge.는 다리를 건너라는 뜻이에요. 문장이 완성되면 다리가 이어집니다.',{gate:'bridge'});
  activity('f-secret','forest','locate','Touch the mushroom beside the river.','강 옆의 버섯을 만지세요.','문장을 읽고 안내에 맞는 버섯 표식을 찾아보세요.','f-river-mushroom',
    ['f-river-mushroom','f-path-mushroom'],'beside는 바로 옆이라는 뜻이에요. 강 옆 버섯의 작은 장치가 비밀 숲길을 열었어요.','river는 지도 가운데의 물길이에요.',{requires:['f-directions']});
  activity('f-camp','forest','reading','Wait here.','여기서 기다리세요.','캠프 표지판이 부탁하는 행동을 고르세요.','여기서 기다리기',
    ['여기서 기다리기','다리를 건너기','나무를 찾기'],'wait는 기다리다, here는 여기예요.','here는 말하는 사람이 있는 이곳을 가리켜요.');
  activity('f-river','forest','reading','The water is cold.','물이 차가워요.','강가 기록에 쓰인 물의 상태를 읽으세요.','물이 차가워요.',
    ['물이 차가워요.','물이 따뜻해요.','물이 없어요.'],'cold는 차가운, 추운이라는 뜻이에요.','물의 온도를 설명하는 문장이에요.');
  order('f-together','forest',"Let's go together.",'함께 가요.',"Let's 뒤에 동사를 놓아 함께 할 일을 제안해요.");

  order('g-order','grove','We found the treasure.','우리는 보물을 찾았어요.','found는 find의 과거형이에요. 보물을 이미 찾았을 때 쓰는 말이에요.');
  activity('g-listen','grove','listening','Touch the small stone.','작은 돌을 만지세요.','안내를 듣거나 읽고 두 돌 중 알맞은 표식까지 걸어가세요.','g-small',
    ['g-small','g-large'],'small은 작은, large는 큰이라는 뜻이에요. 돌 이름에도 크기가 적혀 있어요.','크기를 나타내는 말을 들어 보세요.');
  activity('g-read','grove','reading','The forest is quiet.','숲이 조용해요.','비밀 숲의 분위기를 설명하는 뜻을 고르세요.','숲이 조용해요.',
    ['숲이 조용해요.','숲이 시끄러워요.','숲이 밝아요.'],'quiet는 조용한이라는 뜻이에요.','소리가 거의 없는 상태를 떠올려 보세요.');

  order('r-gate','ruins','Open the ancient gate.','고대의 문을 여세요.','open은 열다, ancient는 아주 오래된이라는 뜻이에요. 완성한 말이 유적의 안쪽 문을 엽니다.');
  activity('r-inscription','ruins','locate','The key is behind the statue.','열쇠는 조각상 뒤에 있어요.','비문을 읽고 열쇠의 위치를 찾아보세요.','r-key',
    ['r-key','r-front'],'behind the statue는 조각상 뒤에라는 뜻이에요. 찾아낸 열쇠로 다음 문의 질문에 답할 수 있어요.','statue는 사람 모양의 돌 조각이에요. 뒤는 지도 위쪽이에요.',{requires:['r-gate']});
  activity('r-door','ruins','response','Where is the key?','열쇠는 어디에 있나요?','방금 열쇠를 찾은 위치를 문에게 알려 주세요.','It is behind the statue.',
    ['It is behind the statue.','It is under the water.','It is in the forest.'],'Where is ...?는 장소나 위치를 묻는 질문이에요. It is ...로 답할 수 있어요.','조각상에서 열쇠를 찾은 위치를 떠올려 보세요.',{requires:['r-inscription']});
  activity('r-fragment','ruins','reading','The crystal is inside the chest.','수정은 상자 안에 있어요.','상자에 적힌 수정 조각의 위치를 읽으세요.','상자 안에 있어요.',
    ['상자 안에 있어요.','상자 위에 있어요.','상자 뒤에 있어요.'],'inside는 ~안에라는 뜻이에요. 상자를 열어 잃어버린 수정 조각을 얻었어요.','상자 겉과 안을 구분해 보세요.',{requires:['r-door']});
  activity('r-vault','ruins','locate','Press the switch between the two pillars.','두 기둥 사이의 스위치를 누르세요.','비문을 읽고 알맞은 위치의 작은 장치를 찾으세요.','r-middle',
    ['r-middle','r-outside'],'between A and B 또는 between the two ...는 둘 사이를 뜻해요. 지하 보관실 길이 열렸어요.','기둥 두 개를 먼저 찾고 그 사이를 살펴보세요.',{requires:['r-gate']});
  order('r-book','ruins','Look at the old door.','오래된 문을 보세요.','look at 뒤에 보는 대상을 놓아요. old door는 오래된 문이에요.');
  activity('r-open','ruins','reading','The door is open.','문이 열려 있어요.','문에 대한 설명을 읽으세요.','문이 열려 있어요.',
    ['문이 열려 있어요.','문이 닫혀 있어요.','문이 작아요.'],'여기서 open은 열린 상태를 설명해요. Open the door.와 형태를 비교해 보세요.','is 뒤의 open은 상태를 나타내요.');
  activity('r-help','ruins','response','I cannot read this. Can you help me?','이것을 읽을 수 없어요. 도와주시겠어요?','기록을 읽으려는 여행자에게 도움을 제안하세요.',"Of course. Let's read it.",
    ["Of course. Let's read it.",'No, I cannot help.','It is a red crystal.'],'Of course.는 물론이죠라는 뜻이에요. 이어서 함께 읽자고 제안해요.','도움을 기꺼이 주겠다고 답해 보세요.');
  activity('r-listen','ruins','listening','Walk to the left pillar.','왼쪽 기둥으로 걸어가세요.','화면을 바라보는 방향을 기준으로 안내에 맞는 기둥 표식까지 이동하세요.','r-left-pillar',
    ['r-left-pillar','r-right-pillar'],'left는 왼쪽이에요. 길을 안내할 때 기준 방향을 확인하면 좋아요.','두 기둥 중 화면 왼쪽의 것을 찾아보세요.');
  activity('r-near','ruins','reading','The bridge is near the river.','다리는 강 근처에 있어요.','안내문의 두 장소 사이 관계를 읽으세요.','다리가 강 근처에 있어요.',
    ['다리가 강 근처에 있어요.','다리가 강에서 멀리 있어요.','강이 다리 안에 있어요.'],'near는 ~근처에라는 뜻이에요.','near의 반대는 far from(~에서 멀리)이에요.');

  order('v-order','vault','Put the key on the table.','열쇠를 탁자 위에 놓으세요.','put은 놓다, on the table은 탁자 위에라는 뜻이에요.');
  activity('v-read','vault','reading','Keep the book dry.','책이 젖지 않게 하세요.','보관실 책을 돌보는 방법을 읽으세요.','책이 젖지 않게 하기',
    ['책이 젖지 않게 하기','책을 물에 넣기','책을 바닥에 버리기'],'dry는 마른 상태예요. Keep ... dry.는 젖지 않도록 유지하라는 뜻이에요.','dry는 wet(젖은)의 반대예요.');
  activity('v-response','vault','response','May I look at this book?','이 책을 봐도 될까요?','책을 보아도 좋다고 허락하세요.','Yes, you may.',
    ['Yes, you may.','No, you may not.','It is cold.'],'May I ...?로 허락을 구하면 Yes, you may.로 허락할 수 있어요.','상대의 may를 답에도 쓸 수 있어요.');

  activity('c-listen','cavern','listening','Find the red crystal.','빨간 수정을 찾으세요.','말을 듣거나 글을 읽고 색 이름이 적힌 수정까지 걸어가세요.','c-red',
    ['c-red','c-blue','c-green'],'red는 빨간색이에요. 소리를 듣지 않아도 영문 안내와 색 이름으로 해결할 수 있어요.','수정 아래의 영문 색 이름도 읽어 보세요.');
  order('c-door','cavern','Open the crystal door.','수정 문을 여세요.','Open 뒤에 여는 대상을 놓아요. crystal door는 수정 문이에요.',{requires:['c-listen']});
  activity('c-switch','cavern','locate','The switch is under the lamp.','스위치는 등불 아래에 있어요.','안쪽 기록을 읽고 알맞은 위치의 장치까지 이동하세요.','c-under-lamp',
    ['c-under-lamp','c-over-lamp'],'under는 ~아래에라는 뜻이에요. 숨은 장치가 마지막 수정 받침을 밝혀 줍니다.','등불의 위와 아래를 비교해 보세요.',{requires:['c-door']});
  order('c-final-mira','cavern','Bring the words together.','말들을 하나로 모으세요.','bring은 가져오다, together는 함께라는 뜻이에요. 미라와 비문을 완성하여 수정의 말을 되살렸어요.',{final:'mira',requires:['c-switch']});
  activity('c-final-bram','cavern','locate','Press the switch beside the blue crystal.','파란 수정 옆의 스위치를 누르세요.','브람의 안내를 읽고 장치를 찾아 잊혀진 길을 복원하세요.','c-blue-switch',
    ['c-blue-switch','c-far-switch'],'beside는 바로 옆이에요. 브람과 찾은 장치가 수정 조각을 하나로 이어 줬어요.','blue crystal의 바로 옆에 있는 스위치를 찾아보세요.',{final:'bram',requires:['c-switch']});
  activity('c-quiet','cavern','reading','Please be quiet.','조용히 해 주세요.','동굴 입구의 정중한 부탁을 읽으세요.','조용히 해 주세요.',
    ['조용히 해 주세요.','빨리 달려 주세요.','크게 말해 주세요.'],'Please를 붙이면 부탁을 좀 더 정중하게 말할 수 있어요.','quiet는 소리가 작은 상태예요.');
  activity('c-tall','cavern','listening','Stand beside the tall crystal.','높은 수정 옆에 서세요.','수정의 높이를 비교하여 안내에 맞는 수정 표식까지 걸어가세요.','c-tall-target',
    ['c-tall-target','c-short-target'],'tall은 높이가 높은 것을 뜻해요. beside는 옆이에요.','tall과 short는 높이를 비교하는 말이에요.');
  activity('c-response','cavern','response','We found all the pieces!','우리는 조각을 모두 찾았어요!','이제 수정을 복원하자고 제안하세요.',"Let's restore the crystal.",
    ["Let's restore the crystal.","Let's leave the pieces here.",'The water is cold.'],'restore는 원래 모습으로 되돌리다는 뜻이에요. 모두 모은 조각을 하나로 이어 봐요.','찾은 조각으로 할 다음 행동을 말해 보세요.');
  activity('c-read','cavern','reading','The light is bright.','불빛이 밝아요.','수정의 빛에 대한 설명을 읽으세요.','불빛이 밝아요.',
    ['불빛이 밝아요.','불빛이 어두워요.','불빛이 없어요.'],'bright는 밝은이라는 뜻이에요.','dark(어두운)의 반대말이에요.');

  const object=(id,type,name,x,y,extra={})=>({id,type,name,x,y,radius:64,...extra});
  const source=(id,type,name,x,y,extra={})=>object(id,type,name,x,y,{activityId:id,...extra});
  const target=(id,type,name,x,y,extra={})=>object(id,type,name,x,y,{target:true,...extra});
  const areas={
    forest:{id:'forest',name:'달빛 숲',en:'Moonlit Forest',spawn:{x:100,y:450},
      obstacles:[{x:70,y:75,w:210,h:95},{x:610,y:55,w:220,h:95},{x:40,y:560,w:240,h:35},{x:700,y:495,w:150,h:100},
        {x:470,y:0,w:36,h:475},{x:470,y:565,w:36,h:75},{x:470,y:475,w:36,h:90,requires:'f-bridge'}],
      objects:[source('f-map','quest','낡은 지도',90,440),source('f-rowan','npc','로완',200,455,{npc:'rowan'}),
        source('f-directions','sign','북쪽 안내',290,420),target('f-north','sign','N · 북쪽 나무 표식',175,205),target('f-south','sign','S · 남쪽 캠프 표식',325,545),
        source('f-mira','npc','미라',145,265,{npc:'mira'}),source('f-bram','npc','브람',315,200,{npc:'bram'}),
        target('f-tracks','quest','나무 뒤 발자국',175,40),target('f-tree-front','quest','나무 앞 돌무더기',245,200),
        object('f-crossroad','sign','잊혀진 갈림길',270,330,{choiceId:'crossroad'}),
        source('f-moon','crystal','달빛 길의 메아리',330,265,{color:'blue'}),target('f-blue-lights','crystal','Blue · 파란 불빛',405,195,{color:'blue'}),target('f-amber-lights','crystal','Amber · 호박색 불빛',405,280,{color:'amber'}),
        source('f-stone','book','돌길의 글 조각',115,350),source('f-bridge','door','끊어진 문장 다리',420,520,{appearance:'bridge'}),
        source('f-secret','book','강가의 작은 글',350,95),target('f-river-mushroom','switch','강 옆 버섯',415,385,{hidden:true,appearance:'mushroom'}),target('f-path-mushroom','switch','길 옆 버섯',335,385,{appearance:'mushroom'}),
        source('f-camp','sign','캠프 안내',100,520),source('f-river','book','강가 기록',590,425),source('f-together','book','여행자의 쪽지',600,525),
        object('f-cache','chest','달빛 보급 상자',365,575,{requires:['f-rowan'],reward:{gold:10,potions:1}}),
        object('f-grove','door','나뭇잎 사이 통로',420,95,{to:'grove',requires:['f-secret']}),
        object('f-ruins','door','기억의 유적으로',875,315,{to:'ruins',requires:['f-bridge']})]},
    ruins:{id:'ruins',name:'기억의 유적',en:'Ruins of Memory',spawn:{x:95,y:330},
      obstacles:[{x:450,y:0,w:35,h:245},{x:450,y:400,w:35,h:240},{x:450,y:245,w:35,h:155,requires:'r-gate'},
        {x:600,y:190,w:60,h:60},{x:160,y:105,w:40,h:50},{x:310,y:105,w:40,h:50},{x:665,y:435,w:35,h:60},{x:800,y:435,w:35,h:60}],
      objects:[object('r-forest','door','달빛 숲으로',55,330,{to:'forest',spawn:{x:810,y:315}}),source('r-gate','door','고대의 문',405,315),
        source('r-inscription','book','조각상의 비문',545,300),target('r-key','quest','조각상 뒤 열쇠',630,150),target('r-front','quest','조각상 앞 자갈',630,290),
        source('r-door','door','열쇠의 질문',820,170),source('r-fragment','chest','수정 조각 상자',820,310,{reward:{gold:20}}),
        source('r-vault','book','두 기둥의 기록',555,415),target('r-middle','switch','두 기둥 사이 장치',750,465,{hidden:true}),target('r-outside','switch','기둥 바깥 장치',580,485),
        source('r-book','book','오래된 문 기록',240,430),source('r-open','sign','열린 문의 말',300,535),source('r-help','npc','길을 잃은 기록관',120,455,{npc:'scribe'}),
        source('r-listen','crystal','기둥의 메아리',255,240),target('r-left-pillar','quest','Left · 왼쪽 기둥 표식',180,180),target('r-right-pillar','quest','Right · 오른쪽 기둥 표식',330,180),
        source('r-near','sign','옛길 안내',120,555),object('r-vault-door','door','지하 보관실로',875,550,{to:'vault',requires:['r-vault']}),
        object('r-cavern','door','수정 동굴로',885,65,{to:'cavern',requires:['r-fragment']})]},
    cavern:{id:'cavern',name:'수정 동굴',en:'Crystal Cavern',spawn:{x:95,y:540},
      obstacles:[{x:0,y:245,w:420,h:35},{x:540,y:245,w:420,h:35},{x:420,y:245,w:120,h:35,requires:'c-door'},
        {x:60,y:70,w:70,h:110},{x:570,y:380,w:70,h:85},{x:860,y:340,w:60,h:90}],
      objects:[object('c-ruins','door','기억의 유적으로',55,545,{to:'ruins',spawn:{x:820,y:90}}),source('c-listen','crystal','색의 목소리',195,445),
        target('c-blue','crystal','Blue · 파란 수정',190,330,{color:'blue'}),target('c-red','crystal','Red · 빨간 수정',330,330,{color:'red'}),target('c-green','crystal','Green · 초록 수정',475,350,{color:'green'}),
        source('c-door','door','수정 문',480,305),source('c-switch','book','등불 기록',195,155),target('c-under-lamp','switch','등불 아래 장치',330,195,{appearance:'lamp-below'}),target('c-over-lamp','switch','등불 위 장치',330,90,{appearance:'lamp-above'}),
        object('c-choice','quest','고대의 말 수정',540,145,{choiceId:'restoration'}),source('c-final-mira','book','미라의 복원 비문',660,95,{npc:'mira'}),source('c-final-bram','switch','브람의 기계 기록',660,200,{npc:'bram'}),
        target('c-blue-switch','switch','파란 수정 옆 장치',815,190,{color:'blue'}),target('c-far-switch','switch','파란 수정에서 먼 장치',815,65),
        source('c-quiet','sign','조용한 동굴 안내',100,430),source('c-tall','crystal','높이의 목소리',680,555),target('c-tall-target','crystal','Tall · 높은 수정',735,430,{size:'tall'}),target('c-short-target','crystal','Short · 낮은 수정',835,510,{size:'small'}),
        source('c-response','book','수정 수집가의 말',300,550),source('c-read','book','빛의 기록',415,585),
        object('c-cache','chest','성소의 보급 상자',160,70,{requires:['c-switch'],reward:{gold:15,potions:1}})]},
    grove:{id:'grove',name:'숨은 반딧불 숲',en:'Secret Grove',spawn:{x:100,y:500},
      obstacles:[{x:70,y:65,w:240,h:120},{x:650,y:70,w:200,h:120},{x:420,y:280,w:80,h:160}],
      objects:[object('g-forest','door','달빛 숲으로',55,500,{to:'forest',spawn:{x:365,y:130}}),source('g-order','chest','반딧불 보물',730,300,{reward:{gold:12,potions:1,note:'grove-scroll'}}),
        source('g-listen','crystal','작은 돌의 노래',230,325),target('g-small','quest','Small · 작은 돌',350,225,{size:'small'}),target('g-large','quest','Large · 큰 돌',580,225,{size:'large'}),source('g-read','book','고요한 숲 기록',610,510)]},
    vault:{id:'vault',name:'잊힌 수정 보관실',en:'Hidden Crystal Vault',spawn:{x:100,y:480},
      obstacles:[{x:250,y:130,w:75,h:170},{x:640,y:130,w:75,h:170},{x:410,y:410,w:130,h:60}],
      objects:[object('v-ruins','door','기억의 유적으로',55,480,{to:'ruins',spawn:{x:860,y:500}}),source('v-order','book','탁자의 글 조각',475,340),
        source('v-read','book','책 보관 안내',165,190),source('v-response','npc','보관실의 기록 정령',790,215,{npc:'spirit'}),
        object('v-cache','chest','학자의 오래된 보물',780,480,{requires:['v-order','v-read','v-response'],reward:{gold:18,gearId:'scholarAmulet'}})]}
  };
  const companions=[
    {id:'mira',name:'미라',en:'Mira',role:'견습 마법사',ability:'Arcane Insight',description:'선택한 퍼즐의 영어를 이해하도록 작은 힌트를 줍니다.',
      english:'Look at the old door.',ko:'오래된 문을 보세요.',cosmetic:'runeGlow',cosmeticName:'룬빛 수정'},
    {id:'bram',name:'브람',en:'Bram',role:'숲의 정찰자',ability:"Explorer's Sense",description:'주변의 숨은 장치에 작은 표시를 보여 줍니다.',
      english:'Look near the river.',ko:'강 근처를 살펴보세요.',cosmetic:'leafGlow',cosmeticName:'잎빛 수정'}
  ];
  const quests=[
    {id:'map',title:'고대의 지도',objective:'낡은 지도를 읽고 로완과 대화한 뒤 북쪽 나무를 찾으세요.',reward:{gold:5}},
    {id:'companions',title:'두 명의 동료',objective:'미라의 부탁에 답하고 브람의 발자국을 찾아 두 동료를 맞이하세요.',reward:{gold:5}},
    {id:'bridge',title:'끊어진 다리',objective:'갈림길에서 길을 선택하고 해당 도전을 마친 뒤 문장 다리를 복원하세요.',reward:{gold:10}},
    {id:'fragments',title:'숨겨진 수정',objective:'유적의 문, 비문, 열쇠 질문을 풀고 상자에서 수정 조각을 찾으세요.',reward:{gold:10}},
    {id:'path',title:'잊혀진 길',objective:'동굴의 소리와 문장을 이해하고 동료와 함께 말 수정을 복원하세요.',reward:{gold:20}}
  ];
  const objects=Object.values(areas).flatMap(area=>area.objects.map(o=>{o.area=area.id;return o;}));
  for(const a of activities){
    a.sourceId=objects.find(o=>o.activityId===a.id).id;
    a.physical=['direction','locate','listening'].includes(a.kind);
    a.reviewChoices=a.physical?a.choices.map(id=>objects.find(o=>o.id===id).name):[...a.choices];
    a.reviewAnswer=a.physical?objects.find(o=>o.id===a.answer).name:a.answer;
    lessons.push({id:a.tags[0],chapter:3,stage:7,en:a.english,ko:a.ko,example:a.english,exampleKo:a.ko,note:a.explanation});
    Q.push({id:a.id,chapter:3,stage:7,type:a.type,difficulty:a.difficulty,instruction:a.physical?'안내에 맞는 장소나 표식을 고르세요.':a.objective,
      phrase:a.english,pronunciation:a.english,choices:a.kind==='order'?[...a.words]:a.reviewChoices,answer:a.reviewAnswer,explanation:a.explanation,tags:a.tags});
  }
  return {width:960,height:640,playerRadius:14,speed:180,areas,activities,objects,companions,quests};
})();
