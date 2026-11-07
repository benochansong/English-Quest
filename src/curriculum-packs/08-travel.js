Curriculum.definePack('u08',`
checkin|I'd like to check in.|체크인하고 싶어요.
reservation|I have a reservation.|예약했어요.
passport|Here is my passport.|여기 제 여권이 있어요.
ticket|boarding pass|탑승권
luggage|Where is my luggage?|제 짐은 어디에 있나요?
help|Could you help me with this bag?|이 가방을 드는 것을 도와주시겠어요?
checkout|What time is check-out?|체크아웃은 몇 시인가요?
room|room|객실
key|room key|객실 열쇠
breakfast|Is breakfast included?|아침 식사가 포함되어 있나요?
wifi|What is the Wi-Fi password?|와이파이 비밀번호가 무엇인가요?
available|Do you have any rooms available?|이용 가능한 방이 있나요?
cancel|I'd like to cancel my booking.|예약을 취소하고 싶어요.
stay|for two nights|이틀 밤 동안
lift|Where is the lift?|엘리베이터는 어디에 있나요?
`, `
V|checkin|1|check in|호텔에 도착해 하는 절차의 뜻을 고르세요.|입실 등록하기|식사 계산하기~표 환불하기|check in은 호텔 등에서 도착 사실을 알리고 등록하는 것이에요.|숙박을 시작하는 절차예요.
V|reservation|1|reservation|미리 자리를 확보한 상태를 나타내는 말을 고르세요.|예약|출국~수하물|reservation은 방이나 좌석 등의 예약이에요.|가기 전에 미리 정해 두었어요.
V|passport|1|passport|국제 여행에서 신분과 국적을 확인하는 문서를 고르세요.|여권|메뉴~영수증|passport는 여권이에요.|국경을 넘는 여행에 쓰는 문서예요.
V|ticket|2|boarding pass|비행기에 탑승할 때 제시하는 것을 고르세요.|탑승권|명함~호텔 지도|boarding pass는 탑승권으로 좌석과 탑승 정보가 표시돼요.|board는 탑승하다예요.
V|luggage|1|luggage|여행할 때 가져가는 물건들을 뜻하는 말을 고르세요.|짐|일정~가격표|luggage는 여행 짐을 통틀어 말해요.|가방과 여행 물건을 떠올려요.
V|help|1|Could you help me with this bag?|무엇을 부탁하는 말인가요?|가방에 관한 도움|방 청소 취소~새 여권 발급|help me with this bag은 이 가방을 다루는 일을 도와 달라는 뜻이에요.|help와 bag을 연결해요.
V|checkout|1|check out|호텔에서 숙박을 마칠 때 하는 절차를 고르세요.|퇴실 수속|입실 등록~방 예약|호텔에서 check out은 떠나며 퇴실 수속을 하는 것이에요.|숙박의 마지막 단계예요.
V|room|1|a single room|보통 누구를 위한 객실인가요?|한 사람|네 사람~단체 회의|single room은 보통 한 사람이 쓰도록 마련된 방이에요.|single은 하나의라는 뜻이에요.
V|key|1|room key|무엇을 여는 데 쓰나요?|객실 문|여권~항공권|room key는 객실 열쇠예요.|room은 방이에요.
V|breakfast|2|Breakfast is included.|아침 식사 비용에 대해 어떤 뜻인가요?|기본 요금에 포함돼요.|반드시 별도로 내요.~제공하지 않아요.|included는 이미 포함되어 있다는 뜻이에요.|추가 비용이라는 말이 아니에요.
V|wifi|1|password|와이파이에 연결할 때 입력하는 정보의 뜻을 고르세요.|비밀번호|우편번호~객실 수|password는 접근을 허용받기 위해 입력하는 비밀번호예요.|연결 권한을 확인하는 정보예요.
V|available|2|available rooms|객실 상태는 어떤가요?|이용 가능한 방|이미 모두 사용 중인 방~청소가 금지된 방|available은 쓸 수 있거나 이용 가능하다는 뜻이에요.|예약할 수 있는 상태예요.
V|cancel|2|cancel a booking|예약을 어떻게 하겠다는 뜻인가요?|취소하기|연장하기~확인하기|cancel은 예정된 일을 취소하다는 뜻이에요.|기존 계획을 하지 않기로 해요.
V|stay|1|for two nights|숙박 기간은 얼마인가요?|이틀 밤|두 시간~두 달|호텔 숙박은 nights로 밤 수를 세요.|nights의 수를 확인해요.
V|lift|1|lift|호텔에서 층을 오르내리는 시설을 고르세요.|엘리베이터|프런트 데스크~식당|영국 영어의 lift는 미국 영어의 elevator와 같은 시설이에요.|계단 대신 이용할 수 있어요.
G|reservation|1|I ___ a reservation under Kim.|김이라는 이름으로 예약했다고 말하세요.|have|has~having|I have a reservation은 예약이 있다는 기본 표현이에요.|주어 I에 맞춰요.
G|room|1|I'd like ___ single room.|1인실 하나를 요청하세요.|a|an~two|single은 자음 소리로 시작하고 방 하나이므로 a를 써요.|single 앞의 관사를 고르세요.
G|stay|2|We are staying ___ three nights.|사흘 밤의 기간을 말하세요.|for|at~on|for는 이어지는 기간을 나타내요.|밤 수는 기간이에요.
G|checkin|2|I'd like to ___ in, please.|입실 수속을 시작하겠다고 말하세요.|check|checks~checking|would like to 뒤에는 동사원형 check를 써요.|to 뒤에 원형을 놓아요.
G|checkout|2|What time ___ we need to check out?|퇴실해야 하는 시각을 물으세요.|do|does~are|일반동사 need와 주어 we에는 조동사 do를 써요.|we에 맞는 질문 형태예요.
G|breakfast|2|___ breakfast included in the price?|아침 식사 포함 여부를 물으세요.|Is|Are~Do|Breakfast is included를 질문으로 바꾸면 Is breakfast included?가 돼요.|breakfast는 여기서 단수 취급해요.
G|luggage|2|My luggage ___ missing.|짐이 보이지 않는다고 말하세요.|is|are~be|luggage는 보통 셀 수 없는 명사로 단수 동사를 써요.|가방 수가 많아도 luggage는 단수 취급해요.
G|passport|2|Here ___ my passport.|여권 하나를 건네며 말하세요.|is|are~am|뒤에 오는 my passport가 단수라 Here is를 써요.|여권은 하나예요.
G|available|2|Do you have ___ rooms for tonight?|오늘 밤 빈방이 있는지 물으세요.|any|a~an|복수 rooms의 유무를 물을 때 any를 쓸 수 있어요.|하나의 방이 아니라 이용 가능 여부를 물어요.
G|wifi|2|Could you ___ down the password?|비밀번호를 적어 달라고 부탁하세요.|write|writes~writing|Could you 뒤에는 동사원형 write가 와요.|write down은 적다예요.
G|cancel|3|I need to cancel ___ reservation.|내 예약을 취소한다고 말하세요.|my|me~I|reservation 앞에는 소유를 나타내는 my를 써요.|누구의 예약인지 나타내요.
G|help|2|Could you help ___ with these bags?|우리의 짐을 도와 달라고 부탁하세요.|us|we~our|help 뒤에는 도움받는 대상을 나타내는 us가 와요.|‘우리에게’라는 목적어예요.
O|reservation|1|I have a booking under Lee.|예약자 이름을 알려 주세요.|I have a booking under Lee.|under~booking~Lee.~I~a~have|under Lee는 Lee라는 이름으로라는 예약 표현이에요.|예약이 있다는 말부터 해요.
O|passport|1|Here is my passport.|여권을 건네는 문장을 만드세요.|Here is my passport.|my~Here~passport.~is|Here is로 물건을 건넬 수 있어요.|Here is를 먼저 이어요.
O|room|2|Could I have a quiet room?|조용한 객실을 부탁하세요.|Could I have a quiet room?|quiet~room?~Could~a~have~I|quiet room은 조용한 방이에요.|Could I have 뒤에 원하는 방을 말해요.
O|key|2|My room key does not work.|열쇠가 작동하지 않는다고 알리세요.|My room key does not work.|not~room~work.~My~does~key|does not work는 제대로 작동하지 않는다는 뜻이에요.|주어는 My room key예요.
O|wifi|2|What is the password for the Wi-Fi?|와이파이 비밀번호를 물으세요.|What is the password for the Wi-Fi?|for~password~the~What~Wi-Fi?~is~the|password for the Wi-Fi는 와이파이용 비밀번호예요.|What is 뒤에 알고 싶은 정보를 놓아요.
O|lift|2|The lift is next to the stairs.|엘리베이터 위치를 설명하세요.|The lift is next to the stairs.|the~next~lift~stairs.~The~is~to|next to the stairs는 계단 옆이라는 뜻이에요.|next to를 함께 이어요.
O|stay|3|Can we stay for one more night?|하룻밤 더 머물 수 있는지 물으세요.|Can we stay for one more night?|night?~stay~Can~more~we~one~for|one more night는 하룻밤 더라는 뜻이에요.|Can we stay 뒤에 연장 기간을 말해요.
O|ticket|2|Where can I print my boarding pass?|탑승권 인쇄 장소를 물으세요.|Where can I print my boarding pass?|boarding~Where~print~pass?~I~my~can|boarding pass를 print하는 장소를 Where로 물어요.|Where can I 다음에 행동을 말해요.
L|room|1|Your room is number two hundred and four.|객실 번호는 무엇인가요?|204호|240호~214호|two hundred and four는 204예요.|hundred 뒤의 수를 확인해요.
L|breakfast|1|Breakfast is served from seven to nine.|아침 식사는 몇 시에 끝나나요?|9시|7시~10시|from seven to nine은 7시부터 9시까지예요.|to 뒤가 끝 시각이에요.
L|checkout|2|Check-out is at eleven. You may leave your bags with us after that.|짐은 체크아웃 후에 어떻게 할 수 있나요?|호텔에 맡길 수 있어요.|반드시 버려야 해요.~객실로만 가져가야 해요.|leave your bags with us는 직원에게 짐을 맡길 수 있다는 뜻이에요.|after that은 체크아웃 뒤예요.
L|reservation|2|I booked a double room for two nights, starting on Friday.|언제 숙박을 시작하나요?|금요일|토요일~일요일|starting on Friday가 입실일을 알려 줘요.|기간 two nights와 시작 요일을 구분해요.
L|lift|2|The lift is out of order. Please use the stairs.|지금 이용하라는 시설은 무엇인가요?|계단|엘리베이터~수영장|out of order는 고장 난 상태이며 stairs 이용을 부탁했어요.|Please use 뒤를 들어요.
L|available|3|We have no single rooms, but a double room is available.|지금 이용 가능한 객실은 무엇인가요?|2인실|1인실~모든 객실이 없어요.|but 뒤에서 double room은 가능하다고 설명해요.|no single과 available double을 구분해요.
L|help|2|Could you call a taxi for six tomorrow morning?|택시를 요청한 시각은 언제인가요?|내일 아침 6시|오늘 저녁 6시~내일 정오|six tomorrow morning이 날짜와 시간대를 알려 줘요.|tomorrow morning을 놓치지 마세요.
R|cancel|3|You can cancel without a fee until Monday. Cancellations on Tuesday or later cost twenty dollars.|무료 취소가 가능한 마지막 날은 언제인가요?|월요일|화요일~수요일|until Monday와 Tuesday or later를 비교하면 월요일까지 무료예요.|무료와 유료의 경계를 읽어요.
C|checkin|1|You arrive at a hotel and already have a booking under Park.|예약자 이름을 말하며 체크인하세요.|I'd like to check in. I have a booking under Park.|I'd like to check out. I stayed last week.~I need a train ticket to Park.|도착했으므로 check in을 하고 예약 이름을 알려 줘요.|퇴실은 check out이에요.|I have a reservation under Park. May I check in?
C|key|2|Your room key will not open the door.|프런트에 문제를 알리고 도움을 청하세요.|My key doesn't work. Could you help me?|My key works well, thank you.~Could I order another breakfast?|작동하지 않는 열쇠라는 문제를 구체적으로 말해요.|doesn't work가 고장이나 작동 실패를 나타내요.|I cannot open my door with this key. Could you help?
`);
