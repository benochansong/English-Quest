// A profile is the saved checkpoint. Encounter state and pending actions stay in memory.
const Engine = (() => {
  const saveKey = 'EnglishQuest.chapter1.v1';
  const active = new WeakMap();
  const enemies = [
    {name:'숲 슬라임', en:'Forest Slime', hp:55, attack:8, defense:0, xp:35, gold:15},
    {name:'수정 슬라임', en:'Crystal Slime', hp:85, attack:11, defense:1, xp:50, gold:25},
    {name:'슬라임 왕', en:'Slime King', hp:150, attack:14, defense:2, xp:100, gold:75}
  ];
  const cooldown = {sword:0, fire:2, guard:0, heal:3};
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const integer = (value, fallback, max) => Number.isSafeInteger(value)
    ? clamp(value, 0, max) : fallback;
  const emptyRecord = () => ({seen:false, correct:0, wrong:0, streak:0});
  function fresh() {
    return {version:1, started:false, level:1, xp:0, gold:0, hp:100,
      completed:[], unlocked:1, chapterComplete:false, learning:{}, mistakes:{},
      settings:{sound:true, voice:true, volume:0.45}};
  }
  function stats(profile) {
    const steps = profile.level - 1;
    return {maxHp:100 + 12*steps, attack:12 + 2*steps, magic:18 + 3*steps,
      defense:3, nextXp:100 + 30*steps};
  }
  function hydrate(raw) {
    const profile = fresh();
    if (!raw || raw.version !== 1) return profile;
    profile.started = raw.started === true;
    profile.level = Math.max(1, integer(raw.level, 1, 9999));
    const {maxHp, nextXp} = stats(profile);
    profile.hp = integer(raw.hp, maxHp, maxHp);
    profile.gold = integer(raw.gold, 0, Number.MAX_SAFE_INTEGER);
    profile.xp = integer(raw.xp, 0, nextXp - 1);
    for (let stage = 1; stage <= 3; stage++) {
      if (!Array.isArray(raw.completed) || !raw.completed.includes(stage)) break;
      profile.completed.push(stage);
    }
    profile.unlocked = Math.min(3, profile.completed.length + 1);
    profile.chapterComplete = profile.completed.length === 3;
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
    return profile;
  }
  function load() {
    try { return hydrate(JSON.parse(localStorage.getItem(saveKey))); }
    catch { return fresh(); }
  }
  function save(profile) {
    try { localStorage.setItem(saveKey, JSON.stringify(profile)); return true; }
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
    if (!correct) profile.mistakes[question.id] = (profile.mistakes[question.id] || 0) + 1;
  }
  function status(item) {
    if (!item?.seen) return 'New';
    if (item.wrong > 0 && item.streak < 2) return 'Review Needed';
    if (item.streak >= 3) return 'Familiar';
    return 'Learning';
  }
  function battle(profile, stage) {
    if (!Number.isInteger(stage) || stage < 1 || stage > profile.unlocked) return null;
    const encounter = {stage, turn:1, phase:'PLAYER_SELECT', hp:stats(profile).maxHp,
      enemyHp:enemies[stage-1].hp, cooldowns:{sword:0,fire:0,guard:0,heal:0},
      counts:{}, lastId:null, question:null, choices:[], ability:null, correct:false};
    active.set(profile, encounter);
    return encounter;
  }
  function inPhase(profile, encounter, phase) {
    return !!encounter && active.get(profile) === encounter && encounter.phase === phase;
  }
  const exposed = encounter => encounter.stage === 3 && encounter.turn % 3 === 0;
  const charging = encounter => encounter.stage === 3 && encounter.turn % 3 === 2;
  function available(encounter, ability) {
    return encounter?.phase === 'PLAYER_SELECT' && Object.hasOwn(cooldown, ability)
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
  function select(profile, encounter, ability, random = Math.random) {
    if (!inPhase(profile, encounter,'PLAYER_SELECT') || !available(encounter,ability)) return null;
    let pool = candidates(encounter, ability);
    const seen = pool.filter(q => q.tags.every(tag => profile.learning[tag]?.seen));
    if (seen.length) pool = seen;
    const other = pool.filter(q => q.id !== encounter.lastId);
    if (other.length) pool = other;
    const lowest = Math.min(...pool.map(q => encounter.counts[q.id] || 0));
    const next = pool.filter(q => (encounter.counts[q.id] || 0) === lowest);
    const question = next[Math.floor(random()*next.length)];
    const choices = shuffle(question.choices, random);
    if (question.type === 'order' && choices.join(' ') === question.choices.join(' ')) {
      choices.push(choices.shift());
    }
    encounter.counts[question.id] = (encounter.counts[question.id] || 0) + 1;
    Object.assign(encounter, {ability, question, choices, lastId:question.id, phase:'QUESTION_ACTIVE'});
    return {question, choices};
  }
  const normalize = text => text.trim().replace(/[.]$/, '').replace(/\s+/g,' ');
  function answer(profile, encounter, value) {
    if (!inPhase(profile, encounter,'QUESTION_ACTIVE') || typeof value !== 'string') return null;
    const {question} = encounter;
    if (question.type !== 'order' && !encounter.choices.includes(value)) return null;
    if (question.type === 'order') {
      const tokens = normalize(value).split(' ').sort();
      if (tokens.join(' ') !== [...question.choices].sort().join(' ')) return null;
    }
    const correct = normalize(value) === normalize(question.answer);
    Object.assign(encounter, {correct, phase:'ANSWER_FEEDBACK'});
    record(profile, question, correct);
    return {correct, question};
  }
  function playerAction(profile, encounter) {
    if (!inPhase(profile, encounter, 'ANSWER_FEEDBACK')) return null;
    const {ability, correct, stage} = encounter;
    const hero = stats(profile);
    let damage = 0, healing = 0;
    if (correct && (ability === 'sword' || ability === 'fire')) {
      const power = ability === 'fire' ? hero.magic : hero.attack;
      const strike = Math.max(1, power - enemies[stage-1].defense) * (exposed(encounter) ? 2 : 1);
      damage = Math.min(encounter.enemyHp, strike);
      encounter.enemyHp -= damage;
    }
    if (correct && ability === 'heal') {
      healing = Math.min(20, hero.maxHp - encounter.hp);
      encounter.hp += healing;
    }
    const won = encounter.enemyHp === 0;
    encounter.phase = won ? 'VICTORY' : 'ENEMY_ACTION';
    return {damage, healing, guard:correct && ability === 'guard', won};
  }
  function enemyAction(profile, encounter) {
    if (!inPhase(profile, encounter, 'ENEMY_ACTION')) return null;
    const charge = charging(encounter);
    const guard = encounter.correct && encounter.ability === 'guard';
    const hit = Math.max(1, enemies[encounter.stage-1].attack - stats(profile).defense);
    const damage = charge ? 0 : Math.min(encounter.hp, Math.max(1, Math.round(hit*(guard ? 0.4 : 1))));
    encounter.hp -= damage;
    const lost = encounter.hp === 0;
    for (const id of Object.keys(cooldown)) {
      encounter.cooldowns[id] = Math.max(0, encounter.cooldowns[id] - 1);
    }
    if (encounter.correct) encounter.cooldowns[encounter.ability] = cooldown[encounter.ability];
    encounter.phase = lost ? 'DEFEAT' : 'PLAYER_SELECT';
    if (lost) profile.hp = 0;
    else encounter.turn++;
    return {damage, lost, charging:charge};
  }
  function reward(profile, encounter) {
    if (!inPhase(profile, encounter, 'VICTORY')) return null;
    const {stage} = encounter;
    const enemy = enemies[stage - 1];
    const bonus = stage === 3 && !profile.chapterComplete ? 50 : 0;
    const xp = enemy.xp + bonus;
    const oldLevel = profile.level;
    profile.xp += xp;
    profile.gold += enemy.gold;
    while (profile.xp >= stats(profile).nextXp) {
      profile.xp -= stats(profile).nextXp;
      profile.level++;
    }
    const levelUp = profile.level > oldLevel;
    profile.hp = Math.min(stats(profile).maxHp, encounter.hp + (levelUp ? 30 : 0));
    if (!profile.completed.includes(stage)) profile.completed.push(stage);
    profile.unlocked = Math.min(3, profile.completed.length + 1);
    profile.chapterComplete = profile.completed.length === 3;
    encounter.phase = 'REWARD';
    return {xp, gold:enemy.gold, levelUp, bonus};
  }
  return {saveKey, enemies, fresh, stats, hydrate, load, save, teach, record, status, battle,
    available, charging, exposed, shuffle, select, answer, playerAction, enemyAction, reward};
})();
