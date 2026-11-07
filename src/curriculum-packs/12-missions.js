Curriculum.definePack('u12',`
care|Handle with care.|조심히 다루세요.
stock|out of stock|품절인
`, `
C|u01.morning|1|Thomas: Good morning! Welcome to the Lantern Café.|카페 주인에게 아침 인사로 답하세요.|Good morning, Thomas.|Good night, Thomas.~Sorry, I missed the train.|아침에 만나는 장면이므로 Good morning으로 인사를 돌려줘요.|주인의 인사 시간대를 확인해요.|Good morning!~Good morning. It's nice to see you.
C|u04.coffee,u04.iced|1|Thomas: What would you like to drink today?|작은 아이스커피 한 잔을 주문하세요.|A small iced coffee, please.|A large hot tea, please.~Two orange juices, please.|크기 small, 온도 iced, 음료 coffee를 모두 맞춰 주문해요.|세 가지 주문 조건을 함께 확인해요.|I'd like a small iced coffee, please.~Can I have a small iced coffee?
L|u04.milk|2|Would you like your coffee without milk?|주인이 제안한 커피는 어떤 커피인가요?|우유를 넣지 않은 커피|우유를 추가한 커피~얼음을 뺀 커피|without milk는 우유를 넣지 않은 상태를 뜻해요.|without 뒤의 재료가 빠져 있어요.
C|u04.milk|2|Thomas: Shall I add milk, or would you prefer it without milk?|주문한 커피에 우유를 넣지 말아 달라고 답하세요.|No milk, please.|Extra milk, please.~Yes, two more coffees.|우유를 빼겠다는 요청에는 No milk 또는 without milk를 써요.|커피의 수량을 바꾸는 질문이 아니에요.|Without milk, please.~I'd prefer it without milk.
C|u01.thanks|1|Thomas: Here is your small iced coffee without milk. Enjoy!|감사하고 좋은 하루를 빌며 주문을 마무리하세요.|Thank you. Have a nice day.|Excuse me, where is the airport?~I'd like to cancel my hotel room.|주문이 완성되었으므로 감사와 작별 인사로 마무리해요.|원한 음료를 받은 상황이에요.|Thanks! Have a good day.~Thank you, and have a lovely day.
C|u06.where|2|Rowan: You look lost. Can I help?|로완에게 도서관 가는 길을 물으세요.|Could you tell me how to get to the library?|Could you tell me the price of tea?~Could you spell your surname?|목적지가 도서관이므로 how to get to the library로 경로를 물어요.|장소의 철자보다 가는 길이 필요해요.|How do I get to the library?~Could you show me the way to the library?
L|u06.left|2|Go straight to the bank. Turn left there. The library is the next building.|은행에 도착하면 어느 방향으로 돌아야 하나요?|왼쪽|오른쪽~다시 돌아가요.|Turn left there에서 there는 앞의 은행을 가리켜요.|there가 어떤 장소를 대신하는지 들어요.
R|u06.left,u06.straight|2|Rowan's note: Walk straight to the bank, then turn left. The library is next door.|안내와 일치하는 경로를 고르세요.|직진 → 은행 → 좌회전 → 도서관|직진 → 은행 → 우회전 → 도서관~도서관 → 우회전 → 은행|은행까지 직진한 다음 왼쪽으로 돌아야 해요. 행동 순서를 함께 읽어야 해요.|then은 그다음 행동을 이어요.
C|u06.near|2|Rowan: Turn left at the bank. The library is very near the bank.|도서관이 은행 근처에 있는지 확인하세요.|So the library is near the bank?|So I should go to the airport?~So the bank is inside the library?|library가 은행 근처에 있다는 위치 관계를 확인해요.|near는 가까운 곳이라는 뜻이에요.|The library is close to the bank, right?
C|u05.price|1|Clara: Welcome to the market. Which scarf do you like?|파란 스카프의 가격을 물으세요.|How much is the blue scarf?|Where is the blue bus?~When does the library close?|물건을 선택하기 전에 How much로 그 스카프의 가격을 물어요.|색과 물건 이름을 함께 말해요.|What is the price of the blue scarf?
V|u06.left|1|Clara: The blue scarf is on the left. The red one is on the right. Both cost ten gold.|파란 스카프가 있는 쪽을 고르세요.|왼쪽|오른쪽~색 설명이 없어요.|blue scarf와 on the left가 연결돼요. 가격은 두 물건이 같아요.|가격 대신 위치를 묻고 있어요.
O|u05.buy|2|I would like to buy that scarf.|앞에서 찾은 스카프를 구매하겠다는 문장을 만드세요.|I would like to buy that scarf.|that~would~scarf.~I~buy~to~like|would like to buy로 공손하게 구매 의사를 말해요.|I would like 다음에 사고 싶다는 행동을 붙여요.
C|u01.thanks|1|Clara: Here is your blue scarf and your receipt. Thank you!|물건과 영수증을 받았으니 감사 인사로 답하세요.|Thank you. Goodbye!|No, I ordered a train ticket.~Please bring a different customer.|구매가 마무리되었으므로 감사하고 작별할 수 있어요.|받은 상품은 선택했던 파란 스카프예요.|Thanks. Have a nice day.~Thank you very much.
C|u02.job,u02.name|1|Elena: Welcome to the office. Could you introduce yourself?|이름이 민이고 새 보조 직원이라고 소개하세요.|I'm Min, the new assistant.|I'm Mina, the hotel manager.~This is your old receipt.|이름 Min과 역할 new assistant를 모두 정확히 말해야 해요.|이름과 역할 두 가지를 알려 주세요.|My name is Min. I'm the new assistant.~I'm the new assistant, Min.
L|u09.document|2|Please print two copies of the meeting agenda and bring them to room three.|인쇄해야 하는 문서는 무엇인가요?|회의 안건|카페 메뉴~객실 예약 확인서|meeting agenda가 인쇄할 문서예요. room three는 가져갈 장소예요.|무엇과 어디를 구분해요.
C|u09.clarify|2|Elena: Use the final agenda. There are two versions in the folder.|최종본 파일이 어느 것인지 확인하세요.|Which file is the final agenda?|How many cafés are nearby?~Should I throw away both files?|두 버전 중 어느 파일이 최종 안건인지 물어야 해요.|Which file로 구체적인 대상을 확인해요.|Could you show me the final agenda file?
C|u09.print|2|Elena: The file called Agenda Final is the right one. Please bring two copies to room three.|확인한 지시를 정확히 되말하세요.|I'll print two copies and bring them to room three.|I'll print three copies for room two.~I'll send one copy to the hotel.|부수 two와 장소 room three를 모두 유지해 확인해요.|수량과 회의실 번호를 바꾸지 않아요.|I will bring two printed copies to room three.
V|care|2|Handle with care.|소포에 적힌 주의 문구의 뜻을 고르세요.|조심히 다루세요.|즉시 버리세요.~빠르게 흔드세요.|handle with care는 깨지거나 손상되지 않게 조심히 다루라는 뜻이에요.|care는 여기서 주의를 뜻해요.
V|stock|2|This item is out of stock.|상품의 현재 상태를 고르세요.|품절이에요.|무료예요.~새 색상이 나왔어요.|out of stock은 판매할 재고가 없다는 뜻이에요.|당장 살 수 있는 수량이 없어요.
G|stock|2|The blue scarf is ___ of stock today.|오늘 파란 스카프가 품절이라고 말하세요.|out|off~under|out of stock은 판매할 재고가 없다는 정해진 표현이에요.|out of stock을 한 덩어리로 기억해요.
G|care|2|Please ___ this glass bottle carefully.|유리병을 조심히 다루라는 부탁을 완성하세요.|handle|handles~handling|Please 뒤의 지시는 동사원형 handle로 말해요. carefully는 조심스럽게라는 뜻이에요.|지시문에는 동사원형을 써요.
G|u06.where|3|Could you show me ___ the library is on this map?|지도에서 도서관의 위치를 보여 달라고 물으세요.|where|who~when|위치를 묻기 때문에 where를 써요. who는 사람, when은 시점을 물어요.|알고 싶은 것은 장소예요.
G|u06.where|3|Could you tell me where the station ___?|간접적으로 역 위치를 물으세요.|is|does~are|Could you tell me 뒤의 간접 질문은 where the station is 순서예요.|station은 단수 장소예요.
O|care|2|Please handle this glass bottle with care.|유리병을 조심히 다루라는 안내를 만드세요.|Please handle this glass bottle with care.|glass~Please~care.~this~with~bottle~handle|handle with care는 조심히 다루다는 뜻이에요. this glass bottle이 다룰 대상이에요.|행동, 물건, 조심히라는 말을 이어요.
O|u09.send|2|I will send the document by email.|문서를 이메일로 보내겠다고 말하세요.|I will send the document by email.|the~will~email.~I~document~by~send|will send는 앞으로 보내겠다는 뜻이고 by email은 보낼 방법이에요.|할 행동과 전송 방법을 차례로 이어요.
`);
(() => {
  const missions=[
    {id:'cafe',unitId:'u12',name:'등불 카페에서 주문하기',npc:'thomas',scene:'cafe',context:'아침에 등불 카페에 들렀습니다. 작은 아이스커피 한 잔을 우유 없이 주문하고 공손히 마무리하세요.',ids:[1,2,3,4,5]},
    {id:'directions',unitId:'u12',name:'길 잃은 여행자',npc:'rowan',scene:'crossroads',context:'낯선 마을에서 도서관을 찾습니다. 로완의 안내를 듣고 은행을 기준으로 길을 확인하세요.',ids:[6,7,8,9]},
    {id:'market',unitId:'u12',name:'마을 시장의 파란 스카프',npc:'clara',scene:'market',context:'클라라의 가게에서 파란 스카프를 사려고 합니다. 가격과 위치를 확인한 뒤 구매를 마무리하세요.',ids:[10,11,12,13]},
    {id:'work',unitId:'u12',name:'첫 출근의 작은 업무',npc:'elena',scene:'office',context:'새 보조 직원 민의 첫 출근입니다. 자신을 소개하고 회의 안건 두 부를 3번 방으로 가져가는 지시를 확인하세요.',ids:[14,15,16,17]}
  ];
  for(const mission of missions){
    mission.activityIds=mission.ids.map(n=>`u12-${String(n).padStart(3,'0')}`);delete mission.ids;
    mission.activityIds.forEach((id,step)=>Object.assign(Curriculum.get(id),{missionId:mission.id,step,npc:mission.npc,scene:mission.scene,context:mission.context}));
    mission.objective=mission.context;
  }
  Curriculum.register({missions});
})();
