Curriculum.definePack('u11',`
greet|How have you been?|어떻게 지냈어요?
order|What would you like?|무엇을 원하세요?
shopping|I'm just looking, thanks.|그냥 둘러보고 있어요, 고마워요.
direction|Could you show me on the map?|지도에서 보여 주시겠어요?
introduce|Have we met before?|전에 만난 적 있나요?
offer|Would you like some tea?|차 좀 드시겠어요?
clarify|Do you mean this one?|이것을 말씀하시는 건가요?
permission|May I sit here?|여기 앉아도 되나요?
invite|Would you like to join us?|함께하시겠어요?
problem|There is a problem with my order.|제 주문에 문제가 있어요.
`, `
G|greet|3|A: How have you ___? B: Very well, thanks.|최근 어떻게 지냈는지 묻는 질문을 완성하세요.|been|be~being|How have you been?은 최근 어떻게 지냈는지 묻는 안부 표현이에요.|have 뒤에는 과거분사 been을 써요.
G|order|1|A: What would you like? B: I ___ like tea.|차를 주문하는 대답을 완성하세요.|would|am~does|I would like로 원하는 것을 공손하게 말해요.|상대 질문의 would like를 활용해요.
G|shopping|2|A: Can I help you? B: I'm just ___, thanks.|그냥 둘러본다는 대답을 완성하세요.|looking|look~looks|I'm just looking은 구경 중이라는 쇼핑 표현이에요.|am 뒤에는 ing형이에요.
G|direction|2|A: Is the café far? B: No, it is ___ here.|카페가 가까운 곳이라는 답을 완성하세요.|near|inside~under|near here는 이 근처라는 뜻이에요.|멀지 않다는 말과 연결해요.
G|introduce|2|A: Where do you work? B: I ___ at a bank.|직장을 답하는 문장을 완성하세요.|work|works~working|I와 현재형 일반동사 work를 써요.|주어는 I예요.
G|offer|2|A: Tea or coffee? B: Tea ___ milk, please.|우유를 넣은 차를 요청하세요.|with|without~before|with milk는 우유를 넣어서라는 뜻이에요.|‘넣은’이라는 조건을 확인해요.
G|clarify|2|A: Send it to Lee. B: ___ you mean Anna Lee?|어느 이 씨인지 확인하세요.|Do|Are~Is|Do you mean...?은 ~을 뜻하나요라는 질문이에요.|mean은 일반동사예요.
G|permission|2|A: May I sit here? B: Yes, you ___.|앉아도 된다고 허락하세요.|may|not~does|May I...?에 Yes, you may.로 허락할 수 있어요.|질문에 쓰인 may로 답해요.
G|invite|3|A: Would you like to join us? B: I'd love ___.|초대를 기쁘게 받아들이세요.|to|for~at|I'd love to는 그러고 싶다는 자연스러운 수락이에요.|앞의 행동을 반복하지 않아도 돼요.
G|problem|3|A: Is everything okay? B: The soup is ___ cold.|너무 차가운 수프에 대해 말하세요.|too|to~two|too cold는 지나치게 차갑다는 뜻이에요.|정도가 지나침을 나타내요.
O|greet|3|How have you been since we last met?|지난 만남 이후 어떻게 지냈는지 물으세요.|How have you been since we last met?|last~you~met?~have~since~How~we~been|How have you been은 어떻게 지냈는지 묻고 since we last met은 마지막 만남 이후라는 뜻이에요.|How have you been 다음에 기간의 시작을 말해요.
O|direction|2|Could you show me on the map?|지도에서 길을 보여 달라고 부탁하세요.|Could you show me on the map?|on~Could~me~map?~show~the~you|show me on the map은 지도에서 보여 달라는 뜻이에요.|Could you show me를 먼저 만들어요.
O|clarify|2|Do you mean the blue one?|파란 물건을 뜻하는지 확인하세요.|Do you mean the blue one?|blue~mean~one?~Do~the~you|one은 앞에 나온 물건을 대신할 수 있어요.|Do you mean 다음에 대상을 말해요.
O|permission|2|Is it okay if I open the window?|창문을 열어도 되는지 물으세요.|Is it okay if I open the window?|if~the~okay~window?~Is~open~it~I|Is it okay if...?는 어떤 행동을 해도 괜찮은지 묻는 표현이에요.|Is it okay 다음에 할 행동을 붙여요.
O|problem|3|There is a problem with my booking.|예약에 문제가 있다고 알리세요.|There is a problem with my booking.|booking.~a~There~my~with~problem~is|a problem with는 ~에 관한 문제라는 뜻이에요.|There is로 문제의 존재를 말해요.
C|greet|3|An old friend asks, “How have you been?”|지난번 만난 뒤 잘 지냈다고 답하세요.|I've been well, thanks.|We have never met before.~Could I pay by card?|How have you been?에는 최근 지낸 상태를 답해요. I have been well은 잘 지냈다는 뜻이에요.|현재 인사뿐 아니라 그동안의 안부를 물어요.|I have been doing well, thank you.
C|order|2|A server says, “Would you like soup or salad?” You prefer salad.|샐러드를 선택하세요.|Salad, please.|Soup, please.~The bill was wrong yesterday.|주어진 두 메뉴 중 원하는 샐러드를 말해요.|선호 메뉴를 확인해요.|I'd like the salad, please.
C|shopping|2|A clerk asks whether you need help. You want to browse alone for now.|지금은 둘러보겠다고 공손히 답하세요.|I'm just looking, thank you.|Please find me a larger size.~I am ready to pay for this.|당장 도움이 필요하지 않으므로 구경 중이라고 말해요.|for now는 지금은이라는 뜻이에요.|I'm only browsing, thanks.
C|direction|2|A traveler asks where the station is. It is across the street.|길 건너편이라고 알려 주세요.|It's across the street.|It leaves at ten.~It's twenty dollars.|where에 대한 답으로 위치를 알려 줘요.|across는 건너편이에요.|The station is just across the road.
C|introduce|2|Someone asks if you have met before. You remember meeting at a conference.|어디에서 만났는지 답하세요.|Yes, we met at the conference.|No, I've never seen you before.~I live near a conference room.|기억하는 만남이 있으므로 긍정하고 장소를 말해요.|met은 meet의 과거형이에요.|Yes, at the conference.
C|offer|2|A host offers tea. You do not want any.|차를 공손히 거절하세요.|No, thank you.|Yes, please.~More tea, please.|원하지 않는 제안에는 No, thank you로 정중히 답해요.|거절하라는 조건이에요.|No thanks, I'm fine.
C|clarify|3|A coworker says, “Bring the papers.” There are two piles, and you are unsure which one.|어느 서류인지 확인하세요.|Which papers do you mean?|I already know which ones.~I will throw them all away.|종류가 불분명하므로 Which papers로 대상을 확인해요.|추측하지 않고 구체적으로 물어요.|Could you tell me which papers to bring?
C|permission|2|You ask to open a window. The host says, “Of course. Go ahead.”|허락을 받아 이제 창문을 열겠다고 답하세요.|Thanks, I will open it now.|Thanks, I will keep it closed.~Please print three copies.|Go ahead는 요청한 행동을 해도 된다는 허락이에요. 감사를 전하고 허락받은 행동을 하겠다고 답해요.|허락받은 행동은 창문 열기예요.|Thank you. I will open the window.
C|invite|3|A friend invites you to dinner tonight. You would like to go but must work.|이유를 말하며 초대를 거절하세요.|I'd love to, but I have to work.|Yes, I will be there at seven.~No, dinner is always bad.|가고 싶지만 일이 있어 못 간다는 조건을 모두 반영해야 해요.|but로 사정이 다름을 설명해요.|Thank you, but I have to work tonight.
C|problem|3|A cashier charges for two coffees, but you ordered only one.|수량 오류를 공손히 바로잡으세요.|Excuse me, I ordered one coffee, not two.|Thank you, both coffees were great.~I'd like two more coffees.|실제 주문 한 잔과 계산된 두 잔의 차이를 알려야 해요.|one과 two를 비교해요.|Sorry, I only ordered one coffee.
`);
