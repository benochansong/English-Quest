// Two deliberately selected alternate forms. Each has6items per assessed skill and
// the same internal difficulty mix (9foundation,10beginner,5developing).
// These are designated curriculum items, not extra items counted toward500.
(() => {
  const forms=[
    {id:'placement-a',name:'출발점 찾기 · A',activityIds:[
      'u01-001','u02-005','u03-002','u04-011','u05-011','u06-011',
      'u01-013','u02-014','u03-017','u04-018','u05-019','u06-022',
      'u03-038','u05-038','u01-036','u02-037','u03-040','u04-040',
      'u01-029','u02-029','u03-033','u04-034','u05-034','u03-037'
    ]},
    {id:'placement-b',name:'출발점 찾기 · B',activityIds:[
      'u01-006','u02-007','u03-010','u04-009','u05-012','u06-012',
      'u01-015','u02-013','u03-018','u04-019','u05-017','u05-022',
      'u04-038','u02-036','u03-039','u01-037','u02-038','u05-039',
      'u01-030','u02-030','u03-034','u04-035','u05-035','u05-037'
    ]}
  ];
  for(const form of forms){
    form.activityIds.sort((a,b)=>Curriculum.get(a).tier-Curriculum.get(b).tier);
    form.skillScope=['vocabulary','grammar','reading','listening'];
    form.description='시간 제한 없이 풀고 학습 출발점을 추천받아요. 공식 영어 등급 시험이 아닙니다.';
    form.listeningNote='원문을 보거나 음성을 이용하지 못한 문항은 듣기 능력의 근거로 해석하지 않습니다.';
  }
  Curriculum.register({diagnostics:forms});
})();
