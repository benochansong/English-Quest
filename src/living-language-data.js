/* Quest instructions are authored separately; curriculum IDs are never invented. */
const LivingLanguageData=(()=>{
 const lines={
  help:['Hello! Can you help me?','안녕하세요! 저를 도와주실 수 있나요?','CLARA'],
  yes:['Of course!','물론이죠!','PLAYER'],
  supplies:['I need three apples and some bread.','사과 세 개와 빵이 좀 필요해요.','CLARA'],
  book:["That's a book. I need bread.",'그건 책이에요. 저는 빵이 필요해요.','CLARA'],
  hand:['Here you are.','여기 있습니다.','PLAYER'],
  thanks:['Thank you! You helped me a lot.','고마워요! 정말 많은 도움이 되었어요.','CLARA'],
  welcome:["You're welcome!",'천만에요!','PLAYER'],
  lost:['A traveler is lost near the forest.','여행자가 숲 근처에서 길을 잃었어요.','ELENA'],
  where:['Where should I go?','어디로 가야 하나요?','PLAYER'],
  straight:['Go straight.','곧장 가세요.','ELENA'],
  left:['Turn left at the tree.','나무에서 왼쪽으로 도세요.','ELENA'],
  right:['Turn right at the tree.','나무에서 오른쪽으로 도세요.','ELENA'],
  bridge:['Cross the bridge.','다리를 건너세요.','ELENA'],
  river:['Look near the river.','강 근처를 살펴보세요.','ELENA'],
  found:['Thank you for finding me!','저를 찾아 주셔서 고마워요!','TRAVELER'],
  home:['We are safe now.','이제 우리는 안전해요.','ELENA'],
  power:['The crystal is losing its power.','수정이 힘을 잃고 있어요.','ROWAN'],
  do:['What should I do?','무엇을 해야 하나요?','PLAYER'],
  find:['Find the glowing crystal.','빛나는 수정을 찾으세요.','ROWAN'],
  blue:['Touch the blue crystal.','파란 수정을 만지세요.','ROWAN'],
  glowing:['The crystal is glowing.','수정이 빛나고 있어요.','ROWAN'],
  done:['We did it!','우리가 해냈어요!','ROWAN'],
  apples:['Three apples.','사과 세 개예요.','CLARA'],
  bread:['Some bread.','빵이 좀 있어요.','CLARA'],
  retry:['Listen again and try another path.','다시 듣고 다른 길로 가 보세요.','ELENA']
 };
 const quests={clara:{id:'clara',title:'상인의 잃어버린 물건',npc:'clara',home:'market',previous:null,opening:'help',reward:'마을의 도움꾼'},elena:{id:'elena',title:'길을 잃은 여행자',npc:'elena',home:'gate',previous:'clara',opening:'lost',reward:'길을 잇는 안내자'},rowan:{id:'rowan',title:'수정의 이상 현상',npc:'rowan',home:'square',previous:'elena',opening:'power',reward:'수정의 벗'}};
 const locations={square:{name:'마을 광장',source:'square'},market:{name:'클라라의 시장',source:'market'},inn:{name:'등불 여관',source:'inn'},gate:{name:'마을 북문',source:'gate'},tree:{name:'오래된 나무',source:'f-north'},stone:{name:'돌길',source:'f-stone'},bridge:{name:'오래된 다리',source:'f-bridge'},river:{name:'강가',source:'f-river'},ruins:{name:'기억의 유적',source:'ruins'}};
 const objects=[['apple-1','market','사과 바구니 · 1','apple'],['apple-2','square','사과 바구니 · 2','apple'],['apple-3','inn','사과 바구니 · 3','apple'],['bread','inn','빵 바구니','bread'],['water','market','물병','water'],['book','square','책','book'],['sword','market','검','sword'],['blue-crystal','ruins','파란 수정 ◆','crystal'],['red-crystal','ruins','붉은 수정 ●','crystal']].map(([id,location,label,type])=>({id,location,label,type,range:'current-location',questId:type==='crystal'?'rowan':'clara',objective:type==='crystal'?'blue':'supplies',animation:type==='crystal'?'glow':'collect',completion:type==='crystal'?'activate':'collect-once'}));
 const voiceId=key=>key==='follow'?'VO_FOLLOW':key==='try'?'VO_TRY_AGAIN':'P7_'+key.toUpperCase();
 return{lines,quests,locations,objects,voiceId};
})();
