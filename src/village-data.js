// The village curriculum is shared by quest briefings, dialogue, combat and offline review.
const VillageData = (() => {
  const entries = [
    [4,'morning','Good morning.','좋은 아침이에요.','Good morning, Clara.','좋은 아침이에요, 클라라.','아침에 사람을 만날 때 건네는 인사예요.'],
    [4,'excuse','Excuse me.','실례합니다.','Excuse me. How much is this?','실례합니다. 이것은 얼마인가요?','말을 걸기 전에 상대의 주의를 끌어요.'],
    [4,'price','How much is this?','이것은 얼마인가요?','How much is this book?','이 책은 얼마인가요?','how much로 가격을 물을 수 있어요.'],
    [4,'buy','I want to buy this.','이것을 사고 싶어요.','I want to buy this map.','이 지도를 사고 싶어요.','buy 뒤에 사고 싶은 물건을 놓아요.'],
    [4,'here','Here you are.','여기 있습니다.','Here you are. Your map.','여기 있어요. 손님 지도예요.','물건이나 돈을 건넬 때 쓰는 말이에요.'],
    [4,'thanks','Thank you.','감사합니다.','Thank you for the map.','지도를 주셔서 감사합니다.','받은 물건이나 도움에 감사를 전해요.'],
    [5,'water',"I'd like some water.",'물을 좀 주세요.',"I'd like some water, please.",'물 좀 부탁드립니다.','주문할 때 I would like를 줄여서 I’d like라고 해요.'],
    [5,'bread',"I'd like some bread.",'빵을 좀 주세요.',"I'd like some bread, please.",'빵 좀 부탁드립니다.','양을 딱 정하지 않고 부탁할 때 some을 써요.'],
    [5,'repeat','Could you repeat that?','다시 말씀해 주시겠어요?','Sorry, could you repeat that?','죄송하지만 다시 말씀해 주시겠어요?','잘 듣지 못한 말을 정중하게 다시 부탁해요.'],
    [5,'welcome',"You're welcome.",'천만에요.',"You're welcome, Thomas.",'천만에요, 토머스.','상대가 고맙다고 했을 때 답하는 말이에요.'],
    [5,'all',"That's all, thank you.",'이게 전부예요, 감사합니다.',"That's all, thank you.",'이게 전부예요, 감사합니다.','더 주문할 것이 없다고 부드럽게 답해요.'],
    [6,'help','Can you help me?','저를 도와주시겠어요?','Excuse me. Can you help me?','실례합니다. 저를 도와주시겠어요?','can you 다음에 동사를 놓아 부탁할 수 있어요.'],
    [6,'need','I need help.','도움이 필요해요.','I need help with this map.','이 지도를 보는 데 도움이 필요해요.','need 뒤에 필요한 것을 놓아요.'],
    [6,'inn','Where is the inn?','여관은 어디에 있나요?','Excuse me. Where is the inn?','실례합니다. 여관은 어디에 있나요?','Where is 다음에 찾는 장소를 놓아요.'],
    [6,'left','Turn left.','왼쪽으로 도세요.','Turn left at the inn.','여관에서 왼쪽으로 도세요.','turn은 방향을 바꾸라는 뜻이에요.'],
    [6,'right','Turn right.','오른쪽으로 도세요.','Turn right at the gate.','성문에서 오른쪽으로 도세요.','right는 여기서 오른쪽을 뜻해요.'],
    [6,'straight','Go straight.','곧장 가세요.','Go straight to the gate.','성문까지 곧장 가세요.','방향을 바꾸지 않고 앞으로 갈 때 써요.'],
    [6,'near',"It's near the gate.",'그곳은 성문 근처에 있어요.',"The inn is near the gate.",'여관은 성문 근처에 있어요.','near 다음에 기준이 되는 장소를 말해요.']
  ].map(([stage,key,en,ko,example,exampleKo,note])=>({chapter:2,stage,id:'village-'+key,key,en,ko,example,exampleKo,note}));
  lessons.push(...entries);
  const find = key => entries.find(l=>l.key===key);
  function question(id,type,key,instruction,phrase,choices,answer,explanation){
    const l=find(key);
    Q.push({id,chapter:2,stage:l.stage,type,difficulty:l.stage-3,instruction,phrase,choices,answer,explanation,tags:[l.id],pronunciation:l.en});
  }
  const meanings=[
    ['morning','저녁에 뵐게요.','성문은 어디예요?','이게 전부예요.'],
    ['excuse','잘 먹겠습니다.','천만에요.','나중에 봐요.'],
    ['price','이것은 누구 물건인가요?','몇 시인가요?','그곳은 어디인가요?'],
    ['here','저를 따라오세요.','곧 돌아올게요.','도와주세요.'],
    ['bread','물을 좀 주세요.','빵이 얼마예요?','여관을 찾고 있어요.'],
    ['welcome','어서 주문하세요.','다시 뵙겠습니다.','실례합니다.'],
    ['repeat','계산해 주시겠어요?','길을 건너시겠어요?','문을 열어 주시겠어요?'],
    ['help','어디서 사나요?','계산해 주세요.','다시 올게요.'],
    ['left','오른쪽으로 도세요.','곧장 가세요.','여기서 기다리세요.'],
    ['near','성문을 지나세요.','성문은 닫혔어요.','성문에서 멀어요.']
  ];
  meanings.forEach(([key,...others],i)=>{
    const l=find(key);
    const context=key==='welcome'?'감사 인사에 답하는 표현입니다. ':key==='here'?'물건을 건네는 상황입니다. ':'';
    question('c2v'+i,'vocab',key,context+'“'+l.en+'”의 뜻을 고르세요.',l.en,[l.ko,...others],l.ko,l.note);
  });
  const gaps=[
    ['morning','Good ___.','morning','evening','night','afternoon'],
    ['price','How ___ is this?','much','long','far','old'],
    ['buy','I want to ___ this.','buy','read','carry','open'],
    ['water',"I'd like some ___.",'water','bread','tea','rice'],
    ['bread',"I'd like some ___.",'bread','water','milk','soup'],
    ['repeat','Could you ___ that?','repeat','carry','write','buy'],
    ['all',"That's ___, thank you.",'all','mine','new','here'],
    ['inn','___ is the inn?','Where','When','Why','What'],
    ['right','Turn ___.','right','left','back','around'],
    ['need','I ___ help.','need','offer','give','refuse']
  ];
  gaps.forEach(([key,phrase,answer,...others],i)=>{
    const l=find(key);
    question('c2s'+i,'sentence',key,'“'+l.ko+'”에 맞게 완성하세요. '+phrase,phrase,[answer,...others],answer,l.note);
  });
  ['price','buy','water','bread','repeat','help','inn','straight'].forEach((key,i)=>{
    const l=find(key);
    question('c2o'+i,'order',key,'단어를 눌러 표현하세요. '+l.ko,l.en,l.en.replace(/\.$/,'').split(' '),l.en,l.note);
  });
  const listens=[
    ['excuse','다시 와 주세요.','잘 먹겠습니다.','이것은 얼마예요?'],
    ['thanks','미안합니다.','어서 오세요.','길을 알려 주세요.'],
    ['water','빵을 좀 주세요.','차를 마실까요?','물은 얼마예요?'],
    ['all','빵을 더 주세요.','가격을 알려 주세요.','다시 말씀해 주세요.'],
    ['welcome','죄송합니다.','반갑습니다.','천천히 가세요.'],
    ['straight','왼쪽으로 도세요.','오른쪽으로 도세요.','여기서 멈추세요.'],
    ['right','왼쪽으로 도세요.','곧장 가세요.','저를 도와주세요.'],
    ['inn','여관은 얼마인가요?','여관에서 기다리세요.','여관으로 돌아가세요.']
  ];
  listens.forEach(([key,...others],i)=>{
    const l=find(key);
    question('c2l'+i,'listening',key,'들은 표현과 같은 뜻을 고르세요.',l.en,[l.ko,...others],l.ko,l.note);
  });
  const makeQuest=(id,stage,location,npc,title,story,xp,gold)=>({
    id,stage,location,npc,title,story,xp,gold,tags:entries.filter(l=>l.stage===stage).map(l=>l.id)
  });
  const quests=[
    makeQuest('greeting',4,'market','clara','잃어버린 아침 인사','클라라는 지도 한 장을 팔고 싶지만, 손님에게 인사한 다음 말이 이어지지 않습니다. 시장의 대화를 잇고 변두리의 그림자 까마귀를 쫓아내세요.',65,35),
    makeQuest('inn',5,'inn','thomas','침묵하는 등불 여관','토머스의 주문은 우물가의 메아리에 섞여 사라집니다. 물과 빵을 주문하고, 들리지 않은 말은 한 번 더 부탁해 보세요.',85,45),
    makeQuest('gate',6,'gate','elena','깨어진 문장','북문에 선 골렘이 이정표의 단어를 흩뜨렸습니다. 엘레나와 길을 확인하고 문장을 다시 이어 마을의 목소리를 돌려주세요.',145,75)
  ];
  // Each response gets a different, context-specific NPC reply and Korean coaching.
  const option=(text,reply,why,ko='')=>({text,reply,why,ko});
  const exchange=(id,key,english,korean,goal,options,answer=0)=>({id,tag:find(key).id,english,korean,goal,options,answer});
  const dialogues={
    clara:[
      exchange('clara-hello','morning','Good morning! Welcome to my market.','좋은 아침이에요! 제 가게에 오신 걸 환영해요.','아침 인사로 답하세요.',[
        option('Good morning!','A friendly voice at last! Are you looking for a map?','아침에 만난 사람에게 같은 인사로 답해요.','드디어 반가운 목소리가 들리네요! 지도를 찾으세요?'),
        option('Good night.','Going to bed? The market just opened!','Good night는 잠자리 인사예요.'),
        option("You're welcome.",'Oh, I haven’t thanked you yet.','고맙다는 말을 들었을 때 쓰는 답이에요.')]),
      exchange('clara-price','price','This map shows the way to the inn.','이 지도에 여관으로 가는 길이 나와요.','지도를 가리키며 가격을 물으세요.',[
        option('How much is this?','It’s five gold coins.','가격을 물을 때 How much를 써요.','금화 다섯 닢이에요.'),
        option('Where is the inn?','It’s on the map. Do you want to know the price?','Where는 장소를 물어요. 지금은 가격을 확인해요.'),
        option('Can I have some bread?','Thomas sells bread at the inn.','빵을 주문하는 말이에요. 지금은 지도 가격을 물어요.')]),
      exchange('clara-buy','buy','Would you like to buy the map?','지도를 사시겠어요?','사고 싶다고 대답하세요. 이 대화는 연습 거래예요.',[
        option('I want to buy this.','Here you are! Listen—the market bell is ringing again.','want to buy는 사고 싶다는 뜻이에요.','여기 있어요! 들어 보세요. 시장의 종이 다시 울려요.'),
        option('No, thank you.','That’s all right. I can keep it here.','정중한 거절이에요. 구매 의사를 말해 보세요.'),
        option('Could you repeat that?','Would you like the map?','다시 말해 달라는 부탁이에요.')])
    ],
    thomas:[
      exchange('thomas-drink','water','Welcome! What would you like to drink?','어서 오세요! 무엇을 마시겠어요?','물을 주문하세요.',[
        option("I'd like some water.",'Of course. A glass of water for you.','음료를 주문할 때 I’d like를 써요.','물론이죠. 여기 물 한 잔 드세요.'),
        option("I'd like some tea.",'Tea? I can make that. Did you want water instead?','tea는 차예요. 이번에는 물을 부탁해요.'),
        option("I'd like a room.",'A room? Let’s talk after your drink.','room은 객실이에요.')]),
      exchange('thomas-repeat','repeat','Would you like something to eat?','드실 것도 필요하세요?','메아리 때문에 잘 듣지 못했어요. 한 번 더 말해 달라고 부탁하세요.',[
        option('Could you repeat that?','Of course! Would you like something to eat?','여기서 repeat는 “다시 말하다”라는 뜻이에요.','물론이죠! 뭐 좀 드실래요?'),
        option('Here you are.','For me? I haven’t ordered anything.','물건을 건넬 때 쓰는 표현이에요.'),
        option('How much is this?','The price? Let’s choose your food first.','가격을 묻기 전에 못 들은 말을 확인해요.')]),
      exchange('thomas-bread','bread','We have bread and soup. What would you like?','빵과 수프가 있어요. 무엇을 드릴까요?','빵을 주문하세요.',[
        option("I'd like some bread.",'Here’s your bread. The echo is getting quieter!','bread 앞에 some을 붙여 빵을 좀 달라고 해요.','주문하신 빵이에요. 메아리 소리가 점점 작아지네요!'),
        option("I'd like some soup.",'Soup is on the stove. Did you want bread?','soup는 수프예요.'),
        option("That's all, thank you.",'Just the water, then?','주문을 끝내는 말이에요. 아직 빵을 주문해야 해요.')])
    ],
    elena:[
      exchange('elena-help','help','You look lost. What do you need?','길을 잃으셨나요? 무엇이 필요하세요?','도움을 부탁하세요.',[
        option('Can you help me?','Yes. Show me your map.','Can you help me?라고 하면 상대에게 도움을 부탁해요.','네. 가지고 계신 지도를 보여 주세요.'),
        option('I can help you.','Thank you, but you’re the one with the map.','내가 상대를 돕겠다는 뜻이에요.'),
        option("That's all, thank you.",'All right. Do you know the way?','대화를 마무리하는 말이에요.')]),
      exchange('elena-inn','inn','Which place are you looking for on the map?','지도에서 어느 장소를 찾고 있나요?','여관이 어디인지 물으세요.',[
        option('Where is the inn?','It’s near the gate. Go straight, then turn left.','Where is 다음에 찾는 장소가 나와요.','성문 근처에 있어요. 곧장 가다가 왼쪽으로 도세요.'),
        option('How much is the room?','Thomas knows the room prices. Which place do you need?','숙박 요금을 묻는 말이에요.'),
        option('Where is the market?','The market is across the square.','market은 시장이에요. 지금 찾는 곳은 여관이에요.')]),
      exchange('elena-turn','left','Go straight. Then which way do you turn?','곧장 가세요. 그다음 어느 쪽으로 돌죠?','엘레나가 방금 알려 준 두 번째 방향을 말하세요.',[
        option('Turn left.','Exactly! Now we can read the sign at the gate.','left는 왼쪽이에요.','맞아요! 이제 성문의 이정표를 읽을 수 있겠어요.'),
        option('Turn right.','That leads out of the village. The inn is on the other side.','right는 오른쪽이에요.'),
        option('Go straight.','That’s the first step. What comes next?','직진 다음의 방향을 말해요.')])
    ],
    scenario:[
      exchange('scenario-ask','excuse','Welcome! Take your time.','어서 오세요! 천천히 보세요.','처음 들른 가게에서 정중하게 말을 거세요.',[
        option('Excuse me.','Yes? How can I help you?','낯선 사람에게 말을 걸 때 쓰기 좋아요.','네? 무엇을 도와드릴까요?'),
        option("You're welcome.",'Thank you? We’ve only just met.','감사에 답할 때 쓰는 말이에요.'),
        option('Goodbye.','Leaving already?','가게를 떠나며 하는 인사예요.')]),
      exchange('scenario-water','water','What would you like?','무엇을 드릴까요?','물을 부탁하세요.',[
        option("I'd like some water.",'Certainly. One bottle of water.','I’d like 다음에 원하는 것을 말해요.','네, 물 한 병이요.'),
        option("I'd like some bread.",'Bread? The bakery is next door.','빵 대신 물을 골라요.'),
        option('I need a map.','Maps are on the other shelf.','지도가 필요하다는 말이에요.')]),
      exchange('scenario-price','price','Here’s your bottle of water.','주문하신 물 한 병입니다.','값을 물으세요.',[
        option('How much is this?','It’s two dollars.','How much는 가격을 물을 때 쓰는 말이에요.','2달러예요.'),
        option('Where is the inn?','It’s near the gate. Are you ready to pay?','위치가 아니라 가격을 물어보세요.'),
        option('Could you repeat that?','Your bottle of water.','다시 말해 달라는 부탁이에요.')]),
      exchange('scenario-thanks','thanks','Here’s your change. Have a nice day!','거스름돈입니다. 좋은 하루 보내세요!','거스름돈을 받고 감사 인사를 하세요.',[
        option('Thank you!','You’re welcome. Come back anytime!','받은 도움에 감사를 전하며 거래를 마쳐요.','천만에요. 언제든 또 오세요!'),
        option('Turn left.','Directions? I work here.','길을 알려 주는 표현이에요.'),
        option('I want to buy this.','You’ve already paid.','이미 계산했으니 감사 인사를 전해요.')])
    ]
  };
  for(const [npc,lines] of Object.entries(dialogues)){
    const stage=quests.find(q=>q.npc===npc)?.stage||6;
    for(const line of lines){
      Q.push({id:line.id,chapter:2,stage,type:'dialogue',difficulty:stage-3,tags:[line.tag],
        instruction:line.english+' — '+line.goal,phrase:line.english,choices:line.options.map(o=>o.text),
        answer:line.options[line.answer].text,explanation:line.options[line.answer].why,pronunciation:line.english});
    }
  }
  return {entries,quests,dialogues};
})();
