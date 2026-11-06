// Village checkpoints contain durable facts only. Replies and purchases use
// single-use, profile-bound handles so stale buttons cannot advance a quest.
const VillageEngine = (() => {
  const conversations = new WeakMap();
  const practice = new WeakMap();
  const offers = new WeakMap();
  const items = [
    {id:'potion', name:'작은 회복 물약', price:20, limit:3, description:'한 턴을 사용해 체력을 30까지 회복해요.'},
    {id:'charm', name:'여행자의 부적', price:50, limit:1, description:'한 턴을 사용해 이번 전투가 끝날 때까지 받는 피해를 3 줄여요. 중첩되지 않아요.'},
    {id:'cloak', name:'탐험가의 망토', price:80, limit:1, description:'구입 즉시 장착하여 최대 체력이 영구히 6 늘어요.'}
  ];
  const count = value => Number.isSafeInteger(value) ? Math.max(0,value) : 0;
  function fresh() {
    const progress = {};
    for (const {stage} of VillageData.quests) {
      progress[stage] = {accepted:false, step:0, completed:false, correct:0, wrong:0, tags:[], reviewTags:[]};
    }
    return {progress, inventory:{potion:0,charm:0,cloak:0}, scenarioStep:0, scenarioComplete:false};
  }
  function hydrate(raw, open) {
    const village = fresh();
    if (!open || !raw || typeof raw !== 'object') return village;
    for (const item of items) village.inventory[item.id] = Math.min(item.limit,count(raw.inventory?.[item.id]));
    for (const {stage,npc} of VillageData.quests) {
      const saved = raw.progress?.[stage];
      if (!saved?.accepted) break;
      const state = village.progress[stage];
      state.accepted = true;
      const total = VillageData.dialogues[npc].length;
      state.step = Math.min(total,count(saved.step));
      state.completed = saved.completed === true && state.step === total;
      state.correct = count(saved.correct);
      state.wrong = count(saved.wrong);
      for (const field of ['tags','reviewTags']) {
        state[field] = lessons.filter(l => Array.isArray(saved[field]) && saved[field].includes(l.id)).map(l => l.id);
      }
      if (!state.completed) break;
    }
    if (village.progress[6].completed) {
      const total = VillageData.dialogues.scenario.length;
      village.scenarioStep = Math.min(total,count(raw.scenarioStep));
      village.scenarioComplete = village.scenarioStep === total;
    }
    return village;
  }
  function selectChapter(profile, n) {
    if (n !== 1 && !(n === 2 && profile.chapterComplete)) return false;
    profile.currentChapter = n;
    conversations.delete(profile);
    practice.delete(profile);
    return true;
  }
  function status(profile, stage) {
    const q = VillageData.quests.find(q => q.stage === stage);
    if (!profile.chapterComplete || !q || (stage > 4 && !profile.village.progress[stage-1].completed)) return 'locked';
    const state = profile.village.progress[stage];
    if (state.completed) return 'complete';
    if (!state.accepted) return 'available';
    return state.step === VillageData.dialogues[q.npc].length ? 'ready' : 'active';
  }
  function accept(profile, stage) {
    if (profile.currentChapter !== 2 || status(profile, stage) !== 'available') return false;
    profile.village.progress[stage].accepted = true;
    Engine.teach(profile, VillageData.quests.find(q => q.stage === stage).tags);
    return true;
  }
  function track(profile, stage, question, correct) {
    const state = profile.village.progress[stage];
    if (!state?.accepted || state.completed) return;
    if (correct) state.correct++;
    else state.wrong++;
    for (const tag of question.tags) {
      if (!state.tags.includes(tag)) state.tags.push(tag);
      if (!correct && !state.reviewTags.includes(tag)) state.reviewTags.push(tag);
    }
  }
  function summary(profile, stage) {
    const state = profile.village.progress[stage];
    if (!state) return null;
    return {correct:state.correct, wrong:state.wrong, tags:[...state.tags], reviewTags:[...state.reviewTags]};
  }
  function dialogue(profile, stage) {
    if (profile.currentChapter !== 2 || !profile.chapterComplete) return null;
    const village = profile.village;
    const scenario = stage === 'scenario';
    if (scenario ? !village.progress[6].completed : !['active','complete','ready'].includes(status(profile,stage))) return null;
    const npc = scenario ? 'scenario' : VillageData.quests.find(q => q.stage === stage).npc;
    const lines = VillageData.dialogues[npc];
    const persistentStep = scenario ? village.scenarioStep : village.progress[stage].step;
    const replay = persistentStep === lines.length;
    const cursor = practice.get(profile);
    const step = replay ? (cursor?.stage === stage ? cursor.step : 0) : persistentStep;
    const line = lines[step];
    const question = Q.find(q => q.id === line.id);
    const session = {stage, replay, line, question, choices:Engine.shuffle(question.choices), step, total:lines.length, answered:false};
    conversations.set(profile,session);
    return session;
  }
  function reply(profile, session, value) {
    if (profile.currentChapter !== 2 || !session || conversations.get(profile) !== session || session.answered) return null;
    const {question, line, stage, replay, step, total} = session;
    const option = line.options.find(o => o.text === value);
    if (!option || !session.choices.includes(value)) return null;
    session.answered = true;
    conversations.delete(profile);
    const correct = value === question.answer;
    Engine.record(profile,question,correct);
    const done = correct && step + 1 === total;
    if (replay) {
      practice.set(profile,{stage,step:done ? 0 : step + Number(correct)});
    } else if (stage === 'scenario') {
      if (correct) profile.village.scenarioStep++;
      if (done) {
        profile.village.scenarioComplete = true;
        if (!profile.achievements.includes('villageVoice')) profile.achievements.push('villageVoice');
      }
    } else {
      track(profile,stage,question,correct);
      if (correct) profile.village.progress[stage].step++;
    }
    return {correct, question, option, done, replay};
  }
  function offer(profile,id) {
    const item = items.find(i => i.id === id);
    if (profile.currentChapter !== 2 || !profile.chapterComplete || !item
      || profile.village.inventory[id] >= item.limit || profile.gold < item.price) return null;
    const token = Object.freeze({id, price:item.price});
    offers.set(token,{profile, gold:profile.gold, quantity:profile.village.inventory[id]});
    return token;
  }
  function buy(profile,token) {
    const quoted = offers.get(token);
    if (!quoted || quoted.profile !== profile) return false;
    offers.delete(token);
    const item = items.find(i => i.id === token.id);
    const quantity = profile.village.inventory[item.id];
    if (profile.currentChapter !== 2 || !profile.chapterComplete || quantity !== quoted.quantity
      || profile.gold !== quoted.gold || profile.gold < item.price || quantity >= item.limit) return false;
    profile.gold -= item.price;
    profile.village.inventory[item.id]++;
    return true;
  }
  return {items,fresh,hydrate,selectChapter,status,accept,track,summary,dialogue,reply,offer,buy};
})();
