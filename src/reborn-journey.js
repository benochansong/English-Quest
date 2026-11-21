/* Route and comparable encounter snapshots; no storage or browser dependencies. */
const RebornJourney=(()=>{
  const encounters=['slime','raven','golem'];
  const scenes={slime:{name:'숲길',text:'왕국을 지키던 수정이 흔들립니다. 로완과 함께 숲길의 흔적을 따라가세요.'},raven:{name:'바람 절벽',text:'검은 깃털이 절벽으로 이어집니다. 날개 아래의 틈을 찾아 길을 여세요.'},golem:{name:'수정 유적',text:'수정의 소란은 오래된 수호자에게 닿았습니다. 빛의 연결을 되살리세요.'}};
  function snapshot(s){
    const now=s.stats,base=s.encounterBase||now,delta=(part,key)=>(now[part]?.[key]||0)-(base[part]?.[key]||0);
    const stats=JSON.parse(JSON.stringify(now));
    for(const part of ['combat','listening','magic','battlefield'])for(const key of Object.keys(stats[part]))stats[part][key]=delta(part,key);
    stats.combat.highestCombo=s.encounterPeakCombo;
    const outcomes=now.flow.outcomes.slice(s.encounterOutcomeStart||0);
    stats.flow={...stats.flow,forcedScreens:delta('flow','forcedScreens'),forcedSeconds:delta('flow','forcedSeconds'),sentenceArrangements:delta('flow','sentenceArrangements'),actionOpportunities:delta('flow','actionOpportunities'),actionSuccesses:delta('flow','actionSuccesses'),independentActions:delta('flow','independentActions'),outcomes,
      heardExpressions:[...s.encounterHeard],independentExpressions:[...s.encounterIndependent],helpExpressions:[...s.encounterHelp]};
    stats.reviewExpressions=now.reviewExpressions.filter(r=>s.encounterReview.includes(r.id));
    stats.expressions=s.encounterExpressions.map(k=>RebornLearning.expressions[k].english);
    return {kind:s.enemy.kind,durationSeconds:Number(s.encounterTime.toFixed(3)),stats,
      metrics:{damageReceived:stats.combat.damageReceived,successfulDodges:stats.combat.successfulDodges,missedAttacks:stats.battlefield.missedAttacks,highestCombo:stats.combat.highestCombo,groundings:stats.battlefield.groundings,shieldBreaks:stats.battlefield.shieldBreaks,weaknessHits:stats.combat.weaknessHits,
        spokenRequests:now.flow.audio.requested-base.flow.audio.requested,listeningOpportunities:stats.flow.actionOpportunities,independentActions:stats.flow.independentActions,
        assistedActions:s.encounterActionCounts.assisted,textOnlyActions:s.encounterActionCounts.text,
        helpExpressions:[...s.encounterHelp],interruptions:stats.flow.forcedScreens,interruptionSeconds:Number(stats.flow.forcedSeconds.toFixed(3))}};
  }
  return {encounters,scenes,snapshot};
})();
