// Chapter 1 content. Each entry is also a teachable vocabulary-book card.
const lessons = [
 ['hello','Hello','안녕하세요','Hello, friend.'],['thanks','Thank you','감사합니다','Thank you, Rowan.'],
 ['apple','apple','사과','I like apples.'],['water','water','물','I drink water.'],
 ['bread','bread','빵','I eat bread.'],['book','book','책','I have a book.'],
 ['sword','sword','검','I have a sword.'],['forest','forest','숲','The forest is quiet.'],
 ['iam','I am','나는 ~입니다','I am a student.'],['ihave','I have','나는 ~을 가지고 있어요','I have a book.'],
 ['ilike','I like','나는 ~을 좋아해요','I like apples.'],['iwant','I want','나는 ~을 원해요','I want some water.'],
 ['ieat','I eat','나는 ~을 먹어요','I eat bread.'],['idrink','I drink','나는 ~을 마셔요','I drink water.']
].map(([id,en,ko,example])=>({id,en,ko,example}));
const Q = [];
function add(id,stage,type,prompt,phrase,choices,answer,explanation,tags){Q.push({id,stage,type,difficulty:stage,instruction:prompt,phrase,choices,answer,explanation,tags});}
[
 ['hello','Hello','안녕하세요',['감사합니다','숲','물']],['thanks','Thank you','감사합니다',['안녕하세요','사과','책']],
 ['apple','apple','사과',['바나나','빵','물']],['water','water','물',['검','책','빵']],
 ['bread','bread','빵',['물','사과','숲']],['book','book','책',['검','물','사과']],
 ['sword','sword','검',['숲','책','빵']],['forest','forest','숲',['물','검','책']],
 ['iam','I am','나는 ~입니다',['나는 ~을 원해요','나는 ~을 먹어요','감사합니다']],
 ['ihave','I have','나는 ~을 가지고 있어요',['나는 ~을 좋아해요','나는 ~을 마셔요','안녕하세요']]
].forEach(([tag,en,ko,wrong],i)=>add('v'+i,1,'vocab',`“${en}”의 뜻은 무엇일까요?`,en,[ko,...wrong],ko,`“${en}”은 “${ko}”라는 뜻이에요.`,[tag]));
[
 ['I ___ a student.','am',['is','are','be'],'I와 함께 현재 상태를 나타낼 때는 am을 써요.','iam'],
 ['I ___ water.','drink',['eat','am','book'],'drink는 마시다라는 뜻이에요.','idrink'],
 ['I ___ bread.','eat',['drink','am','forest'],'eat은 먹다라는 뜻이에요.','ieat'],
 ['I ___ a book.','have',['am','drink','hello'],'have는 가지고 있다는 뜻이에요.','ihave'],
 ['I ___ apples.','like',['am','water','hello'],'like는 좋아하다는 뜻이에요.','ilike'],
 ['I ___ some water.','want',['am','forest','hello'],'want는 원하다는 뜻이에요.','iwant'],
 ['“나는 물을 마셔요”를 영어로 고르세요.','I drink water.',['I eat water.','I am water.','I have a book.'],'drink water는 물을 마시다라는 뜻이에요.','idrink'],
 ['“나는 빵을 먹어요”를 영어로 고르세요.','I eat bread.',['I drink bread.','I am bread.','I like water.'],'eat bread는 빵을 먹다라는 뜻이에요.','ieat'],
 ['“나는 책을 가지고 있어요”를 영어로 고르세요.','I have a book.',['I am a book.','I drink a book.','I like water.'],'have a book은 책을 가지고 있다는 뜻이에요.','ihave'],
 ['“나는 사과를 좋아해요”를 영어로 고르세요.','I like apples.',['I eat bread.','I drink water.','I have a sword.'],'like apples는 사과를 좋아한다는 뜻이에요.','ilike']
].forEach(([prompt,answer,wrong,explanation,tag],i)=>add('s'+i,2,'sentence',prompt,prompt,[answer,...wrong],answer,explanation,[tag]));
[
 ['I want some water.','물을 좀 원해요.','iwant'],['I have a book.','나는 책을 가지고 있어요.','ihave'],
 ['I drink water.','나는 물을 마셔요.','idrink'],['I eat bread.','나는 빵을 먹어요.','ieat'],['I like apples.','나는 사과를 좋아해요.','ilike']
].forEach(([answer,ko,tag],i)=>add('o'+i,2,'order',`단어를 눌러 문장을 완성하세요: ${ko}`,answer,answer.replace('.','').split(' '),answer,`“${answer}”는 “${ko}”라는 뜻이에요.`,[tag]));
[
 ['I like apples.','나는 사과를 좋아해요.',['나는 빵을 먹어요.','나는 물을 마셔요.','나는 책을 가지고 있어요.'],'ilike'],
 ['I drink water.','나는 물을 마셔요.',['나는 사과를 좋아해요.','나는 빵을 먹어요.','나는 책을 가지고 있어요.'],'idrink'],
 ['I eat bread.','나는 빵을 먹어요.',['나는 물을 마셔요.','나는 사과를 좋아해요.','나는 책을 가지고 있어요.'],'ieat'],
 ['I have a book.','나는 책을 가지고 있어요.',['나는 빵을 먹어요.','나는 물을 마셔요.','나는 사과를 좋아해요.'],'ihave'],
 ['I want some water.','물을 좀 원해요.',['나는 책을 가지고 있어요.','나는 빵을 먹어요.','나는 사과를 좋아해요.'],'iwant']
].forEach(([phrase,answer,wrong,tag],i)=>add('l'+i,3,'listening','들은 문장의 뜻을 고르세요.',phrase,[answer,...wrong],answer,`“${phrase}”는 “${answer}”라는 뜻이에요.`,[tag]));
