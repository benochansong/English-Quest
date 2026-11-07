// Complete reviewed order sentences supply examples where available. These rows fill
// the remaining gaps with authored contextual examples; they are NOT extra activities.
(() => {
  const authored=`
u01.hello|Hello, I'm your new neighbor.|안녕하세요, 저는 새로 이사 온 이웃이에요.
u01.afternoon|Good afternoon, everyone. Welcome to the workshop.|여러분, 안녕하세요. 오후 워크숍에 오신 것을 환영해요.
u01.night|Good night, Dad. Sleep well.|아빠, 안녕히 주무세요. 푹 주무세요.
u01.welcome|You're welcome. I'm glad I could help.|천만에요. 도울 수 있어서 기뻐요.
u01.excuse|Excuse me, is anyone sitting here?|실례합니다, 여기 누가 앉아 있나요?
u01.please|Please wait here for a moment.|여기서 잠시 기다려 주세요.
u01.later|See you later, after class.|수업이 끝난 뒤 나중에 봐요.
u02.job|What do you do for work?|무슨 일을 하세요?
u02.teacher|I'm a teacher at a primary school.|저는 초등학교 교사예요.
u02.nurse|My sister is a nurse at the city hospital.|제 여자 형제는 도시에 있는 병원의 간호사예요.
u02.student|We are students at the same language school.|우리는 같은 언어 학교의 학생들이에요.
u02.age|My father is sixty years old.|제 아버지는 예순 살이세요.
u02.language|I speak Korean and a little English.|저는 한국어와 약간의 영어를 해요.
u02.family|I have two sisters and one brother.|저는 여자 형제가 두 명, 남자 형제가 한 명 있어요.
u03.home|I go home after my English class.|저는 영어 수업 후에 집에 가요.
u03.shower|I take a shower before breakfast.|저는 아침 식사 전에 샤워해요.
u03.usually|I usually cook dinner, but today I am eating out.|저는 보통 저녁을 요리하지만 오늘은 외식해요.
u03.lunch|We have lunch together on Fridays.|우리는 금요일마다 함께 점심을 먹어요.
u04.bread|Could I have two slices of bread?|빵 두 조각 주시겠어요?
u04.iced|I'd like an iced coffee without sugar.|설탕 없는 아이스커피 한 잔 주세요.
u04.sugar|No sugar in my tea, please.|제 차에는 설탕을 넣지 말아 주세요.
u04.lunch|What is today's lunch special?|오늘의 점심 특별 메뉴는 무엇인가요?
u05.cheap|The green bag is cheaper than the red one.|초록 가방이 빨간 가방보다 저렴해요.
u05.color|Do you have these shoes in blue?|이 신발의 파란색이 있나요?
u05.pay|Can I pay at this counter?|이 계산대에서 결제해도 되나요?
u05.cash|I would like to pay in cash.|현금으로 결제하고 싶어요.
u06.left|Turn left when you reach the bridge.|다리에 도착하면 왼쪽으로 도세요.
u06.train|The next train leaves in ten minutes.|다음 기차는 10분 뒤에 출발해요.
u06.station|Let's meet outside the station.|역 밖에서 만나요.
u06.airport|How do I get to the airport by bus?|버스로 공항에 어떻게 가나요?
u06.far|Is the museum far from here?|박물관이 여기에서 먼가요?
u07.number|We need twenty-one chairs for the class.|수업에 의자 스물한 개가 필요해요.
u07.day|The office is open on Monday.|사무실은 월요일에 문을 열어요.
u07.week|I'm going to Busan next week.|저는 다음 주에 부산에 가요.
u07.yesterday|I called you yesterday afternoon.|어제 오후에 전화했어요.
u07.early|Please arrive five minutes early.|5분 일찍 도착해 주세요.
u07.minute|The train will arrive in ten minutes.|기차가 10분 뒤에 도착해요.
u07.hour|The journey takes two hours.|그 여정은 두 시간이 걸려요.
u07.date|What is the date of the next meeting?|다음 회의 날짜는 언제인가요?
u08.checkin|I'd like to check in. My name is Song.|체크인하고 싶어요. 제 이름은 송이에요.
u08.luggage|Can I leave my luggage here until three?|3시까지 여기에 짐을 맡겨도 되나요?
u08.help|Could you help me carry this suitcase?|이 여행 가방을 드는 것을 도와주시겠어요?
u08.checkout|What time do we need to check out tomorrow?|내일 몇 시에 체크아웃해야 하나요?
u08.breakfast|Breakfast is included in the room price.|객실 요금에 아침 식사가 포함되어 있어요.
u08.available|Is a double room available for tonight?|오늘 밤 이용할 수 있는 2인실이 있나요?
u08.cancel|I need to cancel my booking for Friday.|금요일 예약을 취소해야 해요.
u09.job|I work in sales, and Mina works in design.|저는 영업 부서에서 일하고 미나는 디자인 부서에서 일해요.
u09.email|Could you check my email address?|제 이메일 주소를 확인해 주시겠어요?
u09.clarify|What do you mean by the final version?|최종본이라는 말은 어떤 것을 뜻하나요?
u09.document|Please read this document before the meeting.|회의 전에 이 문서를 읽어 주세요.
u09.break|Let's take a break after this task.|이 일을 마친 뒤 잠깐 쉬어요.
u09.finish|I have finished the report, but I haven't sent it yet.|보고서는 끝냈지만 아직 보내지는 않았어요.
u10.sick|I feel sick and need to sit down.|몸이 안 좋아서 앉아야겠어요.
u10.tired|I'm tired after the long journey.|긴 여행 후라 피곤해요.
u10.hospital|Could you show me the nearest hospital on the map?|지도에서 가장 가까운 병원을 보여 주시겠어요?
u10.water|Could I have a glass of still water?|탄산이 없는 물 한 잔 주시겠어요?
u10.cold|I have a cold, so I cannot join you today.|감기에 걸려서 오늘 함께할 수 없어요.
u10.fever|I have a fever and would like to make an appointment.|열이 있어서 진료 예약을 하고 싶어요.
u10.dizzy|I feel dizzy when I stand up.|일어설 때 어지러워요.
u11.order|What would you like for lunch?|점심으로 무엇을 드시겠어요?
u11.shopping|I'm just looking at the coats, thanks.|코트를 그냥 둘러보고 있어요, 고마워요.
u11.introduce|Have we met before, perhaps at the workshop?|전에 만난 적 있나요? 혹시 워크숍에서요?
u11.offer|Would you like some tea with your cake?|케이크와 함께 차 좀 드시겠어요?
u11.invite|Would you like to join us for dinner?|저녁 식사에 함께하시겠어요?
u12.stock|The blue notebook is out of stock, but we have green ones.|파란 공책은 품절이지만 초록 공책은 있어요.
`.trim().split('\n').map(row=>row.split('|'));
  const authoredMap=Object.fromEntries(authored.map(([id,example,exampleKo])=>[id,{example,exampleKo,exampleSource:'authored-context'}]));
  for(const expression of Curriculum.expressions){
    const order=Curriculum.activities.find(a=>a.type==='order'&&a.expressionIds.includes(expression.id));
    if(order)Object.assign(expression,{example:order.answer,exampleSource:order.id});
    else if(authoredMap[expression.id])Object.assign(expression,authoredMap[expression.id]);
    else throw new Error('Missing authored expression example: '+expression.id);
  }
})();
