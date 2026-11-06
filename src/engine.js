// A profile is the saved checkpoint. Encounter state and pending actions stay in memory.
const Engine = (() => {
  const legacyKey = 'EnglishQuest.chapter1.v1';
  const v2Key = 'EnglishQuest.chapter1.v2';
  const saveKey = 'EnglishQuest.v3';
  const active = new WeakMap();
  const reviews = new WeakMap();
  const day = 86400000;
  const achievements = [
    {id:'firstVictory', name:'첫 승리', description:'첫 전투에서 승리하기'},
    {id:'firstSpell', name:'불꽃의 시작', description:'화염 마법에 처음 성공하기'},
    {id:'combo3', name:'이어지는 말', description:'한 전투에서 세 번 연속 정답 맞히기'},
    {id:'firstReview', name:'다시 만난 표현', description:'복습 문제에 처음 답하기'},
    {id:'forestClear', name:'숲의 목소리', description:'슬라임 왕을 물리치기'},
    {id:'villageVoice', name:'마을의 통역사', description:'문장 골렘 격파 후 실전 대화를 마치기'}
  ];
  function unlock(profile, id) {
    if (!profile.achievements.includes(id)) profile.achievements.push(id);
  }
  const enemies = [
    {name:'숲 슬라임', en:'Forest Slime', hp:55, attack:8, defense:0, xp:35, gold:15},
    {name:'수정 슬라임', en:'Crystal Slime', hp:85, attack:11, defense:1, xp:50, gold:25},
    {name:'슬라임 왕', en:'Slime King', hp:150, attack:14, defense:2, xp:100, gold:75},
    {name:'그림자 까마귀', en:'Shadow Crow', hp:84, attack:11, defense:1},
    {name:'메아리 정령', en:'Echo Wisp', hp:105, attack:12, defense:1},
    {name:'문장 골렘', en:'Sentence Golem', hp:165, attack:15, defense:3}
  ];
  const cooldown = {sword:0, fire:2, guard:0, heal:3};
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const integer = (value, fallback, max) => Number.isSafeInteger(value)
    ? clamp(value, 0, max) : fallback;
  const emptyRecord = () => ({seen:false, correct:0, wrong:0, streak:0});
  function fresh() {
    return {version:3, started:false, currentChapter:1, level:1, xp:0, gold:0, hp:100,
      completed:[], unlocked:1, chapterComplete:false, learning:{}, mistakes:{},
      marked:[], schedule:{}, history:[], achievements:[], village:VillageEngine.fresh(),
      settings:{sound:true, voice:true, volume:0.45, speechRate:'normal'}};
  }
  function stats(profile) {
    const steps = profile.level - 1;
    return {maxHp:100 + 12*steps + (profile.village?.inventory.cloak ? 6 : 0), attack:12 + 2*steps, magic:18 + 3*steps,
      defense:3, nextXp:100 + 30*steps};
  }
  function hydrate(raw) {
    const profile = fresh();
    if (!raw || ![1, 2, 3].includes(raw.version)) return profile;
    profile.started = raw.started === true;
    profile.level = Math.max(1, integer(raw.level, 1, 9999));
    profile.gold = integer(raw.gold, 0, Number.MAX_SAFE_INTEGER);
    for (let stage = 1; stage <= 3; stage++) {
      if (!Array.isArray(raw.completed) || !raw.completed.includes(stage)) break;
      profile.completed.push(stage);
    }
    profile.unlocked = Math.min(3, profile.completed.length + 1);
    profile.chapterComplete = profile.completed.length === 3;
    if (raw.version === 3) {
      profile.village = VillageEngine.hydrate(raw.village, profile.chapterComplete);
      if (profile.chapterComplete && raw.currentChapter === 2) profile.currentChapter = 2;
    }
    const {maxHp, nextXp} = stats(profile);
    profile.hp = integer(raw.hp, maxHp, maxHp);
    profile.xp = integer(raw.xp, 0, nextXp - 1);
    for (const {id} of lessons) {
      const item = raw.learning?.[id];
      if (!item || typeof item !== 'object') continue;
      const correct = integer(item.correct, 0, Number.MAX_SAFE_INTEGER);
      const wrong = integer(item.wrong, 0, Number.MAX_SAFE_INTEGER);
      profile.learning[id] = {correct, wrong, seen:item.seen === true || correct + wrong > 0,
        streak:integer(item.streak, 0, correct)};
    }
    for (const {id} of Q) {
      const count = integer(raw.mistakes?.[id], 0, Number.MAX_SAFE_INTEGER);
      if (count) profile.mistakes[id] = count;
    }
    const settings = raw.settings || {};
    for (const toggle of ['sound', 'voice']) {
      if (typeof settings[toggle] === 'boolean') profile.settings[toggle] = settings[toggle];
    }
    if (Number.isFinite(settings.volume)) profile.settings.volume = clamp(settings.volume, 0, 1);
    if (settings.speechRate === 'slow') profile.settings.speechRate = 'slow';
    if (raw.version >= 2) {
      profile.marked = lessons.filter(l => Array.isArray(raw.marked) && raw.marked.includes(l.id)).map(l => l.id);
      profile.achievements = achievements.filter(a => Array.isArray(raw.achievements) && raw.achievements.includes(a.id)).map(a => a.id);
      if (Array.isArray(raw.history)) {
        profile.history = raw.history.slice(-10).filter(entry =>
          entry && typeof entry.correct === 'boolean' && Q.some(q => q.id === entry.id)
        ).map(({id, correct}) => ({id, correct}));
      }
      for (const {id} of Q) {
        const timing = raw.schedule?.[id];
        if (timing && typeof timing === 'object') profile.schedule[id] = {
          step:integer(timing.step, 0, 3), dueAt:integer(timing.dueAt, 0, 8640000000000000)
        };
      }
    }
    // These two milestones can also be established with certainty from v1.
    if (profile.completed.length) unlock(profile, 'firstVictory');
    if (profile.chapterComplete) unlock(profile, 'forestClear');
    if (profile.village.scenarioComplete) unlock(profile,'villageVoice');
    return profile;
  }
  function stored(key) {
    const text = localStorage.getItem(key);
    try { return text ? JSON.parse(text) : null; }
    catch { return null; }
  }
  function load() {
    try {
      const current = stored(saveKey);
      if (current?.version === 3) return hydrate(current);
      for (const legacy of [stored(v2Key),stored(legacyKey),current]) {
        if (![1,2].includes(legacy?.version)) continue;
        const profile = hydrate(legacy);
        save(profile);
        return profile;
      }
      return fresh();
    }
    catch { return fresh(); }
  }
  function save(profile) {
    try {
      if (profile.version !== 3 || stored(saveKey)?.version > 3) return false;
      localStorage.setItem(saveKey, JSON.stringify(profile));
      return true;
    }
    catch { return false; }
  }
  function teach(profile, tags) {
    for (const id of tags) {
      if (!lessons.some(lesson => lesson.id === id)) continue;
      const record = profile.learning[id] ||= emptyRecord();
      record.seen = true;
    }
  }
  function record(profile, question, correct) {
    teach(profile, question.tags);
    for (const id of question.tags) {
      const item = profile.learning[id];
      if (correct) { item.correct++; item.streak++; }
      else { item.wrong++; item.streak = 0; }
    }
    profile.history.push({id:question.id, correct});
    if (profile.history.length > 10) profile.history.shift();
    if (!correct) {
      profile.mistakes[question.id] = (profile.mistakes[question.id] || 0) + 1;
      profile.schedule[question.id] = {step:0, dueAt:0};
    }
  }
  function status(item) {
    if (!item?.seen) return 'New';
    if (item.wrong > 0 && item.streak < 2) return 'Review Needed';
    if (item.streak >= 3) return 'Familiar';
    return 'Learning';
  }
  function mark(profile, tag) {
    if (!lessons.some(l => l.id === tag)) return false;
    if (profile.marked.includes(tag)) {
      profile.marked = profile.marked.filter(id => id !== tag);
      return false;
    }
    teach(profile, [tag]);
    profile.marked.push(tag);
    return true;
  }
  function reviewList(profile, now = Date.now()) {
    // A bookmark adds one introductory question per expression.
    const bookmarkedIds = new Set(profile.marked.map(tag => Q.find(q => q.tags.includes(tag))?.id));
    return Q.filter(q => profile.mistakes[q.id] || bookmarkedIds.has(q.id)).map(question => {
      const misses = profile.mistakes[question.id] || 0;
      const dueAt = profile.schedule[question.id]?.dueAt || 0;
      return {question, misses, dueAt, due:dueAt <= now, marked:bookmarkedIds.has(question.id)};
    }).sort((a, b) => a.dueAt - b.dueAt || b.misses - a.misses);
  }
  function dashboard(profile) {
    const records = Object.values(profile.learning).filter(r => r.seen);
    const attempts = records.reduce((total, r) => total + r.correct + r.wrong, 0);
    const correct = records.reduce((total, r) => total + r.correct, 0);
    const countRight = entries => entries.filter(entry => entry.correct).length;
    let recentChange = null;
    if (profile.history.length === 10) {
      recentChange = 20*(countRight(profile.history.slice(5)) - countRight(profile.history.slice(0,5)));
    }
    return {encountered:records.length, total:lessons.length, attempts,
      accuracy:attempts ? Math.round(100*correct/attempts) : null, recentChange,
      reviewNeeded:lessons.filter(l => profile.marked.includes(l.id) || status(profile.learning[l.id]) === 'Review Needed').length,
      familiar:records.filter(r => status(r) === 'Familiar').length, completedStages:profile.completed.length};
  }
  function battle(profile, stage) {
    if (!Number.isInteger(stage) || stage < 1 || stage > enemies.length) return null;
    if (stage <= 3 && stage > profile.unlocked) return null;
    if (stage >= 4 && (profile.currentChapter !== 2 || !['ready','complete'].includes(VillageEngine.status(profile,stage)))) return null;
    return createEncounter(profile,stage,false);
  }
  function training(profile) {
    if (!profile.chapterComplete || profile.currentChapter !== 2 || !Q.some(q => profile.mistakes[q.id])) return null;
    return createEncounter(profile,4,true);
  }
  function createEncounter(profile, stage, training) {
    const enemy = enemies[stage - 1];
    const hero = stats(profile);
    const baseline = stats({level:3});
    const replay = stage <= 3 ? profile.completed.includes(stage) : profile.village.progress[stage].completed;
    const scaled = profile.level > 3 && replay && !training;
    const durability = scaled ? (hero.attack - enemy.defense) / (baseline.attack - enemy.defense) : 1;
    const enemyMaxHp = training ? 3*Math.max(1,hero.attack-enemy.defense) : Math.round(enemy.hp * durability);
    const encounter = {stage, training, turn:1, phase:'PLAYER_SELECT', hp:hero.maxHp,
      enemyHp:enemyMaxHp, enemyMaxHp, incomingScale:scaled ? hero.maxHp / baseline.maxHp : 1,
      cooldowns:{sword:0,fire:0,guard:0,heal:0},
      counts:{}, lastId:null, question:null, choices:[], ability:null, correct:false,
      combo:0, bossPhase:1, counterReady:false, charm:false};
    active.set(profile, encounter);
    return encounter;
  }
  function inPhase(profile, encounter, phase) {
    return !!encounter && active.get(profile) === encounter && encounter.phase === phase;
  }
  const exposed = encounter => encounter.stage === 3 && encounter.turn % 3 === 0;
  const charging = encounter => encounter.stage === 3 && encounter.turn % 3 === 2;
  const heavy = exposed;
  const golemBreak = encounter => encounter.stage === 6 && encounter.turn % 3 === 0;
  const diving = encounter => encounter.stage === 4 && !encounter.training && encounter.turn % 3 === 0;
  const pulsing = encounter => encounter.stage === 5 && encounter.turn % 2 === 0;
  const bonusPercent = combo => 5*clamp(combo - 1, 0, 3);
  function available(encounter, ability) {
    return encounter?.phase === 'PLAYER_SELECT' && Object.hasOwn(cooldown, ability)
      && (!encounter.training || ability === 'sword')
      && (encounter.stage > 1 || ability === 'sword') && encounter.cooldowns[ability] === 0;
  }
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i+1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function candidates(encounter, ability) {
    if (encounter.stage >= 4) {
      const villageQuestions = Q.filter(q => q.chapter === 2 && q.stage <= encounter.stage && q.type !== 'dialogue');
      let type = 'vocab';
      if (golemBreak(encounter) || ability === 'heal') type = 'order';
      else if (ability === 'fire') type = 'sentence';
      else if (ability === 'sword' && (pulsing(encounter) || encounter.stage === 6 && encounter.turn % 3 === 2)) type = 'listening';
      return villageQuestions.filter(q => q.type === type);
    }
    const stageQuestions = Q.filter(q => q.stage <= encounter.stage);
    if (ability === 'heal') return stageQuestions.filter(q => q.type === 'order');
    if (ability === 'fire') return stageQuestions.filter(q => q.type === 'sentence' && q.instruction.includes('___'));
    if (ability === 'guard') return stageQuestions.filter(q => q.type === 'vocab' && q.phrase.includes(' '));
    if (exposed(encounter)) return stageQuestions.filter(q => q.type === 'listening');
    if (encounter.stage >= 2 && encounter.turn % 2 === 0) {
      return stageQuestions.filter(q => q.type === 'sentence' && !q.instruction.includes('___'));
    }
    return stageQuestions.filter(q => q.type === 'vocab');
  }
  function makeChoices(question, random) {
    const choices = shuffle(question.choices, random);
    if (question.type === 'order' && choices.join(' ') === question.choices.join(' ')) {
      choices.push(choices.shift());
    }
    return choices;
  }
  function priority(profile, encounter, question, now) {
    const id = question.id;
    const timing = profile.schedule[id];
    const misses = profile.mistakes[id] || 0;
    const due = !timing || timing.dueAt <= now;
    const needsPractice = question.tags.some(tag => profile.marked.includes(tag));
    const recallWeight = due ? Math.min(6, misses * 2) + (needsPractice ? 2 : 0) : 0;
    const unfamiliar = question.tags.some(tag => status(profile.learning[tag]) !== 'Familiar');
    // Repetition costs eventually outweigh any review priority.
    return recallWeight + (unfamiliar ? 1 : 0) - 4*(encounter.counts[id] || 0);
  }
  function select(profile, encounter, ability, random = Math.random) {
    if (!inPhase(profile, encounter,'PLAYER_SELECT') || !available(encounter,ability)) return null;
    let pool = encounter.training ? Q.filter(q => profile.mistakes[q.id]) : candidates(encounter, ability);
    if (!pool.length) return null;
    const seen = pool.filter(q => q.tags.every(tag => profile.learning[tag]?.seen));
    if (seen.length && encounter.stage <= 3) pool = seen;
    const other = pool.filter(q => q.id !== encounter.lastId);
    if (other.length) pool = other;
    const recentIds = profile.history.slice(-2).map(item => item.id);
    const rested = pool.filter(q => !recentIds.includes(q.id));
    if (rested.length) pool = rested;
    const now = Date.now();
    const ranked = pool.map(q => ({q, score:priority(profile,encounter,q,now)}));
    const best = Math.max(...ranked.map(entry => entry.score));
    const next = ranked.filter(entry => entry.score === best).map(entry => entry.q);
    const question = next[Math.floor(random()*next.length)];
    const choices = makeChoices(question, random);
    encounter.counts[question.id] = (encounter.counts[question.id] || 0) + 1;
    Object.assign(encounter, {ability, question, choices, lastId:question.id, phase:'QUESTION_ACTIVE'});
    return {question, choices};
  }
  const normalize = text => text.trim().replace(/[.?!]$/, '').trim().replace(/\s+/g,' ');
  function evaluate(task, value) {
    if (typeof value !== 'string') return null;
    const {question} = task;
    if (question.type !== 'order' && !task.choices.includes(value)) return null;
    if (question.type === 'order') {
      // Terminal punctuation may travel with a tile when a valid attempt is
      // arranged incorrectly (for example, "me? Can you help").
      const tokens = value.trim().split(/\s+/).map(normalize).sort();
      const expected = question.choices.map(normalize).sort();
      if (tokens.join(' ') !== expected.join(' ')) return null;
    }
    return normalize(value) === normalize(question.answer);
  }
  function answer(profile, encounter, value) {
    if (!inPhase(profile, encounter,'QUESTION_ACTIVE')) return null;
    const {question} = encounter;
    const correct = evaluate(encounter,value);
    if (correct === null) return null;
    encounter.combo = correct ? Math.min(4, encounter.combo + 1) : 0;
    if (encounter.combo === 3) unlock(profile,'combo3');
    Object.assign(encounter, {correct, phase:'ANSWER_FEEDBACK'});
    record(profile, question, correct);
    if (!encounter.training && encounter.stage >= 4) VillageEngine.track(profile,encounter.stage,question,correct);
    return {correct, question, combo:encounter.combo, retry:!correct && golemBreak(encounter)};
  }
  function retryBroken(profile, encounter) {
    if (!inPhase(profile,encounter,'ANSWER_FEEDBACK') || !golemBreak(encounter) || encounter.correct) return null;
    encounter.phase = 'QUESTION_ACTIVE';
    return {question:encounter.question, choices:encounter.choices};
  }
  function startReview(profile, id, random = Math.random) {
    const entry = reviewList(profile).find(item => item.question.id === id);
    if (!entry) return null;
    const question = entry.question;
    const session = {question, choices:makeChoices(question,random), answered:false};
    reviews.set(profile, session);
    return session;
  }
  function answerReview(profile, session, value, now = Date.now()) {
    if (!session || reviews.get(profile) !== session || session.answered) return null;
    const correct = evaluate(session, value);
    if (correct === null) return null;
    const {question} = session;
    session.answered = true;
    reviews.delete(profile);
    record(profile, question, correct);
    const previous = profile.schedule[question.id]?.step || 0;
    const step = correct ? Math.min(previous + 1, 3) : 0;
    const dueAt = now + [0,1,3,7][step]*day;
    profile.schedule[question.id] = {step, dueAt};
    unlock(profile,'firstReview');
    return {correct, question, dueAt};
  }
  function playerAction(profile, encounter) {
    if (!inPhase(profile, encounter, 'ANSWER_FEEDBACK')) return null;
    if (golemBreak(encounter) && !encounter.correct) return null;
    const {ability, correct, stage} = encounter;
    const hero = stats(profile);
    let damage = 0, healing = 0, comboBonus = 0, counterBonus = 0;
    if (correct && (ability === 'sword' || ability === 'fire')) {
      const power = ability === 'fire' ? hero.magic : hero.attack;
      const strike = Math.max(1, power - enemies[stage-1].defense) * (exposed(encounter) ? 2 : 1);
      const boosted = Math.round(strike*(100+bonusPercent(encounter.combo))/100);
      comboBonus = Math.min(encounter.enemyHp, boosted) - Math.min(encounter.enemyHp, strike);
      const beforeCounter = Math.min(encounter.enemyHp, boosted);
      damage = Math.min(encounter.enemyHp, boosted + (encounter.counterReady ? 12 : 0));
      counterBonus = damage - beforeCounter;
      encounter.counterReady = false;
      encounter.enemyHp -= damage;
      if (ability === 'fire') unlock(profile,'firstSpell');
    }
    if (correct && ability === 'heal') {
      healing = Math.min(20, hero.maxHp - encounter.hp);
      encounter.hp += healing;
    }
    const won = encounter.enemyHp === 0;
    encounter.phase = won ? 'VICTORY' : 'ENEMY_ACTION';
    return {damage, healing, guard:correct && ability === 'guard', won, comboBonus, counterBonus};
  }
  function useItem(profile, encounter, id) {
    if (!inPhase(profile,encounter,'PLAYER_SELECT') || golemBreak(encounter) || encounter.training) return null;
    if (!['potion','charm'].includes(id) || !profile.village.inventory[id]) return null;
    const healing = id === 'potion' ? Math.min(30, stats(profile).maxHp-encounter.hp) : 0;
    if (id === 'potion' && !healing || id === 'charm' && encounter.charm) return null;
    profile.village.inventory[id]--;
    encounter.hp += healing;
    if (id === 'charm') encounter.charm = true;
    Object.assign(encounter,{phase:'ENEMY_ACTION',ability:id,correct:false,question:null});
    return {healing, guard:id === 'charm'};
  }
  function enemyAction(profile, encounter) {
    if (!inPhase(profile, encounter, 'ENEMY_ACTION')) return null;
    const charge = charging(encounter);
    const powerful = heavy(encounter);
    const guard = encounter.correct && encounter.ability === 'guard';
    const dive = diving(encounter), pulse = pulsing(encounter), interrupted = golemBreak(encounter) && encounter.correct;
    const extraPower = powerful ? (encounter.bossPhase === 2 ? 6 : 4) : dive ? 4 : pulse ? 2 : 0;
    const rawHit = enemies[encounter.stage-1].attack + extraPower - stats(profile).defense;
    const hit = Math.max(1, Math.round(rawHit * encounter.incomingScale) - (encounter.charm ? 3 : 0));
    const stopped = charge || interrupted;
    const unguarded = stopped ? 0 : Math.min(encounter.hp, hit);
    const damage = stopped ? 0 : Math.min(encounter.hp, Math.max(1, Math.round(hit*(guard ? 0.4 : 1))));
    if (guard && powerful) encounter.counterReady = true;
    encounter.hp -= damage;
    const lost = encounter.hp === 0;
    for (const id of Object.keys(cooldown)) {
      encounter.cooldowns[id] = Math.max(0, encounter.cooldowns[id] - 1);
    }
    if (encounter.correct) encounter.cooldowns[encounter.ability] = cooldown[encounter.ability];
    encounter.phase = lost ? 'DEFEAT' : 'PLAYER_SELECT';
    if (lost) { if (!encounter.training) profile.hp = 0; }
    else encounter.turn++;
    if (encounter.stage === 3 && encounter.enemyHp <= encounter.enemyMaxHp/2) encounter.bossPhase = 2;
    return {damage, lost, charging:charge, heavy:powerful, interrupted, dive, pulse, guarded:guard && !stopped,
      prevented:unguarded - damage, counterReady:encounter.counterReady};
  }
  function reward(profile, encounter) {
    if (!inPhase(profile, encounter, 'VICTORY')) return null;
    const {stage} = encounter;
    const enemy = enemies[stage - 1];
    const bonus = stage === 3 && !profile.chapterComplete ? 50 : 0;
    const replay = encounter.training || (stage <= 3 ? profile.completed.includes(stage) : profile.village.progress[stage].completed);
    const prize = stage <= 3 ? enemy : VillageData.quests.find(q => q.stage === stage);
    const xp = replay ? 0 : prize.xp + bonus;
    const gold = replay ? 0 : prize.gold;
    const oldLevel = profile.level;
    profile.xp += xp;
    profile.gold += gold;
    while (profile.xp >= stats(profile).nextXp) {
      profile.xp -= stats(profile).nextXp;
      profile.level++;
    }
    const levelUp = profile.level > oldLevel;
    if (!encounter.training) profile.hp = Math.min(stats(profile).maxHp, encounter.hp + (levelUp ? 30 : 0));
    if (!replay && stage <= 3) profile.completed.push(stage);
    if (!replay && stage >= 4) profile.village.progress[stage].completed = true;
    profile.unlocked = Math.min(3, profile.completed.length + 1);
    profile.chapterComplete = profile.completed.length === 3;
    unlock(profile,'firstVictory');
    if (profile.chapterComplete) unlock(profile,'forestClear');
    encounter.phase = 'REWARD';
    return {xp, gold, levelUp, bonus, replay};
  }
  return {saveKey, legacyKey, v2Key, enemies, fresh, stats, hydrate, load, save, teach, record, status, battle,
    achievements, mark, reviewList, startReview, answerReview, dashboard, heavy, bonusPercent,
    training, golemBreak, diving, pulsing, retryBroken, useItem,
    available, charging, exposed, shuffle, select, answer, playerAction, enemyAction, reward};
})();
