// Authored exercises for the Hall of Voices. Korean answers and English replies are intentional.
const VoiceData = (function voiceCollection() {
  const activities = [];
  const missions = [];
  const spoken = [
    ['greet','rowan',1,'친구를 반갑게 맞이하기','Hello, my friend.','안녕, 친구야.',['Hi, my friend.'],'friend는 친구예요. 가까운 사이에서는 Hello나 Hi로 인사할 수 있어요.','greeting','Hello, Rowan.'],
    ['seat','thomas',2,'빈자리인지 물어보기','Is this seat taken?','이 자리에 누가 앉나요?',[],'seat는 자리예요. Is this seat taken?은 앉기 전에 이미 쓰는 자리인지 물을 때 써요.','seat','No, you can sit here.'],
    ['price','clara',1,'물건 하나의 가격 묻기','How much is this?','이것은 얼마인가요?',[],'How much로 가격을 물어요. this는 가리키는 물건 하나예요.','price','It is five gold.'],
    ['water','thomas',1,'물을 공손하게 요청하기','I would like some water, please.','물 좀 부탁합니다.',["I'd like some water, please.","Some water, please."],'I would like은 공손한 요청이에요. 줄여서 I’d like이라고 해도 좋아요.','ordering','Here is your water.'],
    ['locate','elena',2,'마을 문 위치 묻기','Where is the village gate?','마을 문은 어디인가요?',["Where's the village gate?"],'Where is 뒤에 찾는 장소를 붙이면 위치를 물을 수 있어요.','directions','The gate is near the inn.'],
    ['repeat','rowan',2,'못 들은 말을 다시 부탁하기','Could you say that again?','다시 한 번 말씀해 주시겠어요?',['Could you repeat that?'],'again은 다시라는 뜻이에요. Could you로 정중하게 부탁해요.','repeat','Of course. Go straight.'],
    ['pay','clara',3,'카드로 결제할 수 있는지 묻기','Can I pay by card?','카드로 결제해도 되나요?',['Can I pay with a card?'],'pay by card는 카드로 결제하다예요. Can I로 가능한지 물어보세요.','payment','Yes, you can pay by card.'],
    ['thanks','elena',2,'도움을 받은 뒤 감사 인사하기','Thank you for your help.','도와주셔서 감사합니다.',['Thanks for your help.'],'Thank you for 다음에 감사한 이유를 말할 수 있어요.','thanks',"You're welcome."]
  ];
  for (const [key,npc,difficulty,objective,english,ko,alternatives,explanation,tag,example] of spoken) {
    activities.push({id:'vs-'+key,kind:'speak',mode:'repeat',npc,difficulty,objective,english,ko,
      answer:english,alternatives,choices:[],explanation,tags:[tag],example,requiredInput:'repeat-or-type',
      fallback:'한국어 뜻을 보고 영어로 입력하세요. 도움이 필요하면 예문을 다시 확인하세요.'});
  }
  const listening = [
    ['inn','elena','meaning',1,'장소를 묻는 말 알아듣기','Where is the inn?','여관은 어디인가요?','여관은 어디인가요?',['여관은 언제 여나요?','이건 얼마인가요?'],'Where는 어디를 물어요. inn은 여관이에요.','directions'],
    ['change','clara','meaning',2,'거스름돈을 줄 때 하는 말 알아듣기',"Here's your change.",'여기 거스름돈입니다.','여기 거스름돈입니다.',['계산은 어디서 하나요?','이것은 제 가방이에요.'],'계산을 마친 상황에서 change는 거스름돈을 뜻해요.','payment'],
    ['across','elena','meaning',3,'길 건너편이라는 뜻 알아듣기',"It's across the street.",'그곳은 길 건너편에 있어요.','그곳은 길 건너편에 있어요.',['그곳은 길 끝에 있어요.','그곳은 문 바로 옆에 있어요.'],'across the street는 길을 건넌 맞은편을 말해요.','directions'],
    ['morning','rowan','identify',1,'들린 아침 인사를 영어로 찾기','Good morning.','좋은 아침이에요.','Good morning.',['Good evening.','Good night.'],'morning은 아침이에요. 아침에 만난 사람에게 건네는 인사예요.','greeting'],
    ['right','elena','identify',1,'들린 방향 지시를 영어로 찾기','Turn right.','오른쪽으로 도세요.','Turn right.',['Turn left.','Go straight.'],'right는 오른쪽, left는 왼쪽이에요.','directions'],
    ['bag','clara','identify',2,'봉투가 필요한지 묻는 표현 찾기','Do you need a bag?','봉투가 필요하세요?','Do you need a bag?',['Do you have a card?','Do you want a receipt?'],'need는 필요하다는 뜻이에요. a bag은 봉투 하나예요.','shopping'],
    ['drink','thomas','respond',1,'음료 질문을 듣고 물 주문하기','What would you like to drink?','무엇을 마시고 싶으세요?', "I'd like some water.",["I'd like some bread.","The gate is near the inn."],'drink를 물었으니 원하는 음료를 말해요.','ordering'],
    ['company','rowan','respond',2,'자리를 권할 때 기꺼이 수락하기','Would you like to sit here?','여기 앉으시겠어요?','Yes, thank you.',['No, thank you.','It is my book.'],'앉겠다는 뜻을 전할 때는 Yes, thank you.가 자연스러워요.','seat']
  ];
  for (const [key,npc,mode,difficulty,objective,english,ko,answer,others,explanation,tag] of listening) {
    const fallback = mode==='identify'
      ? '한국어 뜻을 읽고 이에 맞는 영어 표현을 고르세요.'
      : mode==='meaning' ? '영어 문장을 읽고 뜻을 고르세요.' : '영어 질문을 읽고 상황에 맞는 대답을 고르세요.';
    activities.push({id:'vl-'+key,kind:'listen',mode,npc,difficulty,objective,english,ko,answer,
      alternatives:[],choices:[answer,...others],explanation,tags:[tag],requiredInput:'listen-or-read-and-choose',fallback});
  }
  function mission(id,npc,name,location,objective,kind) {
    const value={id,npc,name,location,objective,kind,ids:[]};
    missions.push(value);
    return value;
  }
  // Each branch includes the character's actual response and specific guidance for that choice.
  function turn(m,difficulty,objective,english,ko,tag,branches,explanation,options={}) {
    const step=m.ids.length;
    const id=m.id+'-'+(step+1);
    const answer=branches[0][0];
    const replies=Object.fromEntries(branches.map(([choice,says,translation,why])=>[choice,{english:says,ko:translation,why:why||explanation}]));
    activities.push({id,kind:m.kind,mode:options.mode||'respond',missionId:m.id,step,npc:m.npc,
      objective,difficulty,english,ko,answer,alternatives:options.alternatives||[],
      choices:branches.map(row=>row[0]),explanation,replies,tags:[tag],
      requiredInput:options.mode==='route'?'choose-route':options.mode==='meaning'?'listen-or-read-and-choose':'choose-or-say-response',
      fallback:options.mode==='route'?'길 안내 문장을 읽고 알맞은 경로를 선택하세요.':options.mode==='meaning'?'안내 문장을 읽고 먼저 할 행동을 고르세요.':'대화와 상황을 읽고 영어 대답을 선택하세요.'});
    m.ids.push(id);
  }
  const rowan=mission('vc-rowan','rowan','로완과의 첫 만남','숲길 쉼터','가상의 여행자 Alex가 되어 이름과 인사를 주고받으세요.','conversation');
  turn(rowan,1,'여행자 이름 Alex로 자신을 소개하기','Hello! What is your name?','안녕하세요! 이름이 무엇인가요?','introduction',[
    ['My name is Alex.','Nice to meet you, Alex.','만나서 반가워요, 알렉스.'],
    ['I am at the inn.','I see. And your name?','그렇군요. 이름은요?','at the inn은 있는 장소예요. 이름을 소개해 보세요.'],
    ['Good night.','Leaving already? I was asking your name.','벌써 가나요? 이름을 물었어요.','Good night은 밤에 헤어지거나 잠들기 전 하는 인사예요.']
  ],'My name is 뒤에 이름을 붙여요. 여기서는 가상의 이름 Alex를 써요.',{alternatives:["I'm Alex.","I am Alex."]});
  turn(rowan,1,'만나서 반갑다는 인사에 화답하기','Nice to meet you, Alex.','만나서 반가워요, 알렉스.','greeting',[
    ['Nice to meet you, too.','Welcome to our village.','우리 마을에 온 걸 환영해요.'],
    ['How much is this?','Are you looking for the market?','시장을 찾고 있나요?','그 표현은 가격을 묻는 말이에요. 지금은 첫인사에 답하세요.'],
    ['No, thank you.','Oh, I was just saying hello.','아, 그냥 인사를 건넨 거예요.','제안을 거절하는 말이에요. 여기서는 반가움을 전해요.']
  ],'too를 덧붙여 나도 반갑다는 마음을 전해요.');
  turn(rowan,1,'마을에 처음 왔다고 답하기','Is this your first visit?','이곳에 처음 오셨나요?','introduction',[
    ["Yes, it's my first visit.","Then let me show you around.",'그럼 제가 안내해 드릴게요.'],
    ["No, I've been here before.",'Oh, you know this place already.','아, 이미 아는 곳이군요.','자연스러운 답이지만 전에 와 봤다는 뜻이에요. 오늘은 첫 방문이에요.'],
    ['My name is Alex.','Yes, Alex. Have you visited us before?','네, 알렉스. 전에 우리 마을에 온 적이 있나요?','이름은 이미 소개했어요. 첫 방문인지 답하세요.']
  ],'first visit은 첫 방문이에요.',{alternatives:['Yes, this is my first visit.']});
  const clara=mission('vc-clara','clara','클라라의 빵 가게','상인의 시장','빵을 부탁하고 가격을 물은 뒤 물건을 받으세요.','conversation');
  turn(clara,1,'빵을 사고 싶다고 말하기','Hello! Can I help you?','안녕하세요! 무엇을 도와드릴까요?','shopping',[
    ["Yes, I'd like some bread.",'This loaf is fresh.','이 빵은 갓 구웠어요.'],
    ["No, I'm just looking.",'Take your time.','천천히 둘러보세요.','구경만 한다는 뜻이에요. 이번에는 빵을 사겠다고 말해요.'],
    ['Where is the gate?','The gate is up the road.','문은 이 길 위쪽에 있어요.','길을 묻는 표현이에요. 지금 필요한 물건은 빵이에요.']
  ],'I’d like 다음에 원하는 물건을 붙여요.',{alternatives:['Yes, I would like some bread.']});
  turn(clara,2,'가리킨 빵 한 덩이의 가격 묻기','This loaf is fresh.','이 빵은 갓 구웠어요.','price',[
    ['How much is it?',"It's three gold.",'3골드예요.'],
    ['Where is the inn?','Near the square. What about the bread?','광장 근처예요. 빵은 어떻게 할까요?','Where는 위치를 묻는 말이에요. 가격은 How much로 물어요.'],
    ['What time is it?',"It's nearly noon.",'거의 정오예요.','시간을 물었어요. 빵 값을 물으려면 How much를 써요.']
  ],'앞에서 말한 빵을 it으로 가리킬 수 있어요.',{alternatives:['How much is this?']});
  turn(clara,1,'클라라가 건네는 빵을 받으며 감사하기','Here is your bread.','여기 주문한 빵이에요.','thanks',[
    ['Thank you.','You’re welcome. Enjoy it!','천만에요. 맛있게 드세요!'],
    ['I do not need any bread.','Would you like me to put it back?','도로 놓아 드릴까요?','빵이 필요 없다는 뜻이에요. 물건을 받을 때는 감사 인사를 건네요.'],
    ['I am looking for the inn.','I can show you after this.','이 일이 끝나면 알려 드릴게요.','다른 화제로 넘어갔어요. 먼저 빵을 건넨 사람에게 감사해요.']
  ],'물건을 받을 때 Thank you.로 고마움을 표현해요.',{alternatives:['Thanks.','Thank you very much.']});
  const thomas=mission('vc-thomas','thomas','토머스의 저녁 식탁','등불 여관','수프와 물을 주문하고 식탁에서 요청하세요.','conversation');
  turn(thomas,1,'저녁으로 수프 주문하기','What would you like to eat?','무엇을 드시겠어요?','ordering',[
    ["I'd like some soup, please.",'A bowl of soup. Of course.','수프 한 그릇이요. 물론이죠.'],
    ["I'd like some tea.",'Tea to drink. What would you like to eat?','마시는 차군요. 무엇을 드실 건가요?','eat는 먹는 것을 물어요. 이 식사에서는 수프를 주문해요.'],
    ["I'm just looking.",'Take a look at the menu.','메뉴를 살펴보세요.','잠깐 둘러보겠다는 말이에요. 지금은 주문할 음식을 말해요.']
  ],'some soup는 수프를 뜻해요. please를 붙이면 더 정중해요.',{alternatives:['I would like some soup, please.']});
  turn(thomas,1,'물도 함께 부탁하기','Would you like anything to drink?','마실 것도 필요하세요?','ordering',[
    ['Yes, some water, please.','I’ll bring your water.','물을 가져다드릴게요.'],
    ['No, thank you.','All right, just the soup.','네, 수프만 드릴게요.','정중한 거절이에요. 이번에는 물을 달라고 해요.'],
    ['A spoon, please.','A spoon, certainly. Anything to drink?','숟가락이요, 물론이죠. 마실 것은요?','식기와 음료는 달라요. water를 말해 보세요.']
  ],'some water, please는 물을 부탁할 때 쓰는 짧은 표현이에요.');
  turn(thomas,2,'수프를 먹을 숟가락 하나 부탁하기','Here is your soup. Do you need anything else?','여기 수프예요. 더 필요한 게 있나요?','request',[
    ['Could I have a spoon, please?','Of course. Here is a spoon.','물론이죠. 여기 숟가락이에요.'],
    ['Could I have the bill, please?','Are you ready to pay?','계산하시겠어요?','bill은 계산서예요. 아직 수프를 먹을 숟가락이 필요해요.'],
    ['No, that is all.','Enjoy your meal.','맛있게 드세요.','더 필요한 게 없다는 뜻이에요. 이번에는 숟가락을 요청해요.']
  ],'Could I have a spoon?은 숟가락을 정중히 부탁하는 말이에요.',{alternatives:['May I have a spoon, please?','A spoon, please.']});
  const elena=mission('vc-elena','elena','엘레나의 이정표','북쪽 마을 문','찾는 장소를 말하고 방향을 확인하세요.','conversation');
  turn(elena,2,'마을 문이 어디인지 정중하게 묻기','You look lost. Can I help?','길을 잃으신 것 같네요. 도와드릴까요?','directions',[
    ['Yes. Where is the village gate?','Go straight and turn left.','곧장 가다가 왼쪽으로 도세요.'],
    ['Yes. Where is the market?','The market is near the bridge.','시장은 다리 근처예요.','market은 시장이에요. 목적지는 village gate예요.'],
    ['No, I know the way.','All right. Safe travels!','네. 조심히 가세요!','길을 안다고 했어요. 이번에는 안내를 부탁해요.']
  ],'Where is 뒤에 가려는 장소를 붙여요.');
  turn(elena,2,'안내받은 왼쪽 방향 다시 확인하기','Go straight and turn left.','곧장 가다가 왼쪽으로 도세요.','directions',[
    ['Turn left?','That’s right. The gate is on your left.','맞아요. 문은 왼쪽에 있어요.'],
    ['Turn right?','No, turn left.','아니요, 왼쪽으로 도세요.','right는 오른쪽이에요. 이번에는 left를 확인해요.'],
    ['Go back?','No, keep going straight first.','아니요. 먼저 곧장 가세요.','Go back은 돌아가라는 말이에요. 안내받은 회전 방향을 확인해요.']
  ],'상대가 말한 방향을 짧은 질문으로 되물을 수 있어요.');
  turn(elena,1,'길을 알려 준 사람에게 감사하기','You’ll see the gate on your left.','왼쪽에 문이 보일 거예요.','thanks',[
    ['Thank you for your help.','You’re welcome. Have a good trip!','천만에요. 좋은 여행 되세요!'],
    ['Do you need help?','I’m all right, thanks.','저는 괜찮아요, 고마워요.','도움을 주겠다는 말이에요. 여기서는 안내받은 데 감사해요.'],
    ['Nice to meet you.','It was nice meeting you as well.','저도 만나서 반가웠어요.','첫인사도 가능하지만, 길을 알려 준 데 대한 감사를 직접 전해요.']
  ],'for your help로 어떤 도움에 고마운지 말할 수 있어요.',{alternatives:['Thanks for your help.']});
  const cafe=mission('vp-cafe','thomas','카페에서 한 잔','등불 여관','아침에 따뜻한 차를 주문해 매장에서 마시세요.','scenario');
  turn(cafe,1,'아침에 카페 직원에게 인사하기','Good morning! Welcome in.','좋은 아침이에요! 어서 오세요.','greeting',[
    ['Good morning!','What can I get for you?','무엇을 드릴까요?'],
    ['Good evening!','It’s still morning here.','여긴 아직 아침이에요.','evening은 저녁이에요. 시간에 맞는 인사를 골라요.'],
    ['Good night!','Are you leaving already?','벌써 가시나요?','Good night은 보통 밤에 작별할 때 쓰는 말이에요.']
  ],'아침에 만나면 Good morning!으로 인사해요.');
  turn(cafe,1,'따뜻한 차 한 잔 주문하기','What can I get for you?','무엇을 드릴까요?','ordering',[
    ['A hot tea, please.','One hot tea.','따뜻한 차 한 잔이요.'],
    ['An iced tea, please.','An iced tea?','아이스티 한 잔이요?','iced는 차갑다는 뜻이에요. 오늘은 hot tea를 주문해요.'],
    ['A coffee, please.','One coffee?','커피 한 잔이요?','coffee는 커피예요. 오늘 주문할 음료는 차예요.']
  ],'A hot tea는 가게에서 따뜻한 차 한 잔을 주문하는 자연스러운 표현이에요.',{alternatives:["I'd like a hot tea, please."]});
  turn(cafe,2,'차를 매장에서 마시겠다고 답하기','For here or to go?','매장에서 드시나요, 가져가시나요?','ordering',[
    ['For here, please.','Take a seat. I’ll bring it over.','앉으세요. 가져다드릴게요.'],
    ['To go, please.','I’ll put it in a takeaway cup.','포장 컵에 담아 드릴게요.','to go는 포장이라는 뜻이에요. 매장에서 마실 때는 for here예요.'],
    ['Hot, please.','Of course. Will you stay here?','네. 여기서 드시나요?','온도는 이미 말했어요. 이번에는 마실 장소를 답해요.']
  ],'For here는 매장에서, to go는 가지고 간다는 뜻이에요.');
  turn(cafe,1,'차를 받은 뒤 감사하기','Here is your tea.','주문하신 차 나왔어요.','thanks',[
    ['Thank you very much.','You’re welcome. Enjoy your tea.','천만에요. 차 맛있게 드세요.'],
    ['I would like a menu.','I can bring a menu as well.','메뉴도 가져다드릴 수 있어요.','지금은 더 주문하는 상황이 아니에요. 받은 차에 대한 감사를 전해요.'],
    ['No tea, please.','Would you like me to take it back?','다시 가져갈까요?','차를 원하지 않는다는 말이에요. 주문한 차를 받는 상황이에요.']
  ],'음료를 받을 때 Thank you라고 말하면 충분해요.',{alternatives:['Thank you.','Thanks.']});
  const route=mission('vp-route','elena','다리를 건너 시장으로','마을 광장','길을 물어 다리 건너편 시장까지 가세요.','scenario');
  turn(route,2,'시장이 어디인지 물어보기','Can I help you find something?','찾는 곳이 있나요?','directions',[
    ['Where is the market?','Cross the bridge and turn right.','다리를 건너 오른쪽으로 도세요.'],
    ['Where is the inn?','The inn is beside the square.','여관은 광장 옆에 있어요.','inn은 여관이에요. 오늘 찾는 곳은 market이에요.'],
    ['When does the market open?','It opens at nine.','아홉 시에 열어요.','When은 시간을 물어요. 위치를 알려면 Where를 써요.']
  ],'Where is the market?은 시장이 어디인지 묻는 말이에요.');
  turn(route,2,'길 안내에서 먼저 할 행동 알아듣기','First, cross the bridge. Then turn right.','먼저 다리를 건너세요. 그런 다음 오른쪽으로 도세요.','directions',[
    ['먼저 다리를 건넌다.','Yes. Cross the bridge first.','맞아요. 먼저 다리를 건너요.'],
    ['먼저 오른쪽으로 돈다.','Turn right after you cross.','건넌 다음에 오른쪽으로 도세요.','First는 먼저, then은 그다음이에요. 순서를 확인해요.'],
    ['먼저 광장으로 되돌아간다.','Stay on the road to the bridge.','다리로 가는 길을 따라가세요.','돌아가라는 안내는 없어요. cross the bridge에 귀 기울여요.']
  ],'cross the bridge는 다리를 건너라는 뜻이에요.',{mode:'meaning'});
  turn(route,2,'다리를 건넌 뒤 이어지는 올바른 경로 선택하기','At the end of the bridge, turn right.','다리를 다 건너면 오른쪽으로 도세요.','directions',[
    ['다리 끝 → 오른쪽 길','That’s the road to the market.','맞아요. 그 길이 시장으로 가는 길이에요.'],
    ['다리 끝 → 왼쪽 길','The left road goes to the inn.','왼쪽 길은 여관으로 가요.','right는 오른쪽이에요. 시장은 다리 끝에서 오른쪽에 있어요.'],
    ['다리 앞 → 왼쪽 길','Cross the bridge before you turn.','돌기 전에 다리를 건너세요.','at the end는 다리 끝이에요. 다리 앞에서 돌면 안 돼요.']
  ],'다리를 건너 끝에서 오른쪽 길을 고르면 돼요.',{mode:'route'});
  turn(route,2,'도착할 시장 위치를 확인하기','You’ll see the market just past the bridge, on the right.','다리를 지나면 바로 오른쪽에 시장이 보여요.','directions',[
    ['Just past the bridge, on the right?','Exactly. You’ve found it!','정확해요. 잘 찾아왔어요!'],
    ['Before the bridge, on the left?','Past the bridge, on the right.','다리를 지나서 오른쪽이에요.','before는 전, past는 지난 뒤예요. 두 장소를 구분해요.'],
    ['Inside the inn?','No, the market is outside.','아니요, 시장은 밖에 있어요.','inside는 안쪽이에요. 안내받은 위치를 되짚어 보세요.']
  ],'장소 정보를 짧게 되풀이하면 이해한 내용이 맞는지 확인할 수 있어요.');
  const market=mission('vp-shop','clara','시장에서 지도 사기','상인의 시장','작은 지도의 가격을 확인하고 한 장을 구입하는 대화를 연습하세요.','scenario');
  turn(market,2,'작은 지도 한 장의 가격 묻기','These small maps are for sale.','이 작은 지도들을 판매하고 있어요.','price',[
    ['How much is a small map?','A small map is two gold.','작은 지도 한 장은 2골드예요.'],
    ['Where is the map?','It’s right here on the table.','바로 여기 탁자 위에 있어요.','Where는 위치를 물어요. 가격을 묻는 How much를 써요.'],
    ['Do you have bread?','Bread is at the next stall.','빵은 옆 가판대에 있어요.','지금 살 물건은 지도예요. 지도 한 장의 가격을 물어요.']
  ],'How much is a small map?은 작은 지도 한 장의 가격을 묻는 말이에요.');
  turn(market,1,'두 크기 중 작은 지도 선택하기','Would you like the small map or the large one?','작은 지도와 큰 지도 중 어느 것을 드릴까요?','shopping',[
    ['The small map, please.','Here is the small map.','여기 작은 지도예요.'],
    ['The large map, please.','Here is the large one.','여기 큰 지도예요.','large는 크다는 뜻이에요. 찾는 물건은 작은 지도예요.'],
    ['Both, please.','One of each?','하나씩 다 드릴까요?','both는 둘 다예요. 한 장만 골라요.']
  ],'small은 작은, large는 큰이라는 뜻이에요.');
  turn(market,2,'보여 준 지도를 사겠다고 결정하기','This one is two gold. Would you like it?','이건 2골드예요. 이걸로 하시겠어요?','purchase',[
    ["Yes, I'll take it.",'Great. Let me wrap it for you.','좋아요. 포장해 드릴게요.'],
    ["No, I'll think about it.",'Of course. Take your time.','물론이죠. 천천히 생각하세요.','생각해 보겠다는 말이에요. 지금 구매를 결정해요.'],
    ['Could I see a different one?','I can show you another map.','다른 지도도 보여드릴게요.','다른 물건을 보는 요청이에요. 이미 고른 지도를 사겠다고 말해요.']
  ],'I’ll take it.은 가게에서 이걸 사겠다고 말할 때 쓰는 표현이에요.',{alternatives:['Yes, I will take it.']});
  turn(market,1,'장을 마치고 정중히 작별하기','Here you are. Have a good day!','여기 있어요. 좋은 하루 보내세요!','farewell',[
    ['Thank you. You too!','Goodbye!','안녕히 가세요!'],
    ['How much is the large map?','Would you like to keep shopping?','쇼핑을 계속하시겠어요?','새로운 물건을 묻는 말이에요. 지금은 대화를 마쳐요.'],
    ['Can you show me another map?','Certainly. What size?','물론이죠. 어떤 크기로요?','다른 지도를 요청하는 말이에요. 마무리 인사를 골라요.']
  ],'상대방이 좋은 하루를 빌어 줄 때 You too!로 화답해요.',{alternatives:['Thanks. You too!']});
  // Link existing notebook cards only when their expression is useful for this exact turn.
  const notebookLinks = {
    'vs-greet':['hello'], 'vs-price':['village-price'], 'vs-water':['village-water'],
    'vs-locate':['village-inn'], 'vs-repeat':['village-repeat'], 'vs-thanks':['village-thanks'],
    'vl-inn':['village-inn'], 'vl-morning':['village-morning'], 'vl-right':['village-right'],
    'vl-drink':['village-water'], 'vc-rowan-1':['hello'], 'vc-clara-1':['village-bread'],
    'vc-clara-2':['village-price'], 'vc-clara-3':['village-thanks'], 'vc-thomas-2':['village-water'],
    'vc-elena-1':['village-inn'], 'vc-elena-2':['village-left','village-straight'],
    'vc-elena-3':['village-thanks'], 'vp-cafe-1':['village-morning'], 'vp-cafe-4':['village-thanks'],
    'vp-route-1':['village-inn'], 'vp-route-3':['village-right'], 'vp-route-4':['village-right'],
    'vp-shop-1':['village-price'], 'vp-shop-3':['village-buy'], 'vp-shop-4':['village-thanks']
  };
  for (const activity of activities) activity.tags.push(...(notebookLinks[activity.id] || []));
  return Object.freeze({activities,missions});
})();
