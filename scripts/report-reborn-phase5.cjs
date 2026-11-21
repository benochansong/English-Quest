/* Build reports from completed, hash-matched evidence; fails before writing if a suite is incomplete. */
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),dir='docs/reborn-phase5/';
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p)),write=(p,s)=>fs.writeFileSync(path.join(root,p),s+'\n');
const artifact=json(dir+'artifact-validation.json'),audio=json(dir+'audio-audit.json'),style=json(dir+'final-style-proof.json');
if(!style.onlyStyleChanged||style.finalSha256!==artifact.sha256)throw Error('Invalid final style provenance');
const totals=[],encounters=[],actions=[],windows=[],sound=[],browserRows=[];
const round=n=>Number(n||0).toFixed(2),change=(a,b)=>`${round(a)} → ${round(b)} (${b-a>=0?'+':''}${round(b-a)})`;
for(const browser of ['chrome','msedge']){
 for(const suffix of ['polish-controls','final','journey','muted-journey','field-controls','phase3-flow','failure-cases','regression'])if(!read(dir+browser+'-'+suffix+'.log').includes('PASS'))throw Error('Incomplete '+browser+' '+suffix);
 const a=json(dir+browser+'-baseline-metrics.json'),b=json(dir+browser+'-final-metrics.json'),j=json(dir+browser+'-journey.json'),m=json(dir+browser+'-muted-journey.json');
 for(const x of [b,j,m])if(![artifact.sha256,style.gameplaySha256].includes(x.sha256||x.hash))throw Error('Artifact mismatch '+browser);
 if(json(dir+browser+'-final-visual.json').hash!==artifact.sha256||!read(dir+browser+'-final-visual.log').includes('PASS'))throw Error('Final visual mismatch');
 if(m.runs[0].stats.flow.independentActions!==0)throw Error('Muted credit');
 const name=browser==='chrome'?'Chrome':'Edge';browserRows.push(`| ${name} ${b.version} | 정상 2회 + 음소거 1회 + 비교 경로 1회 | 통과 | 통과 | 통과 |`);
 for(const [label,old,now]of [['첫 조작 ms',a.firstControlMs,b.firstControlMs],['첫 검 적중 ms',a.firstSwordHitMs,b.firstSwordHitMs],['입력→관찰 자세 p95 ms',a.inputToPoseMs.p95,b.inputToPoseMs.p95],['RAF p50 ms',a.frameMs.p50,b.frameMs.p50],['RAF p95 ms',a.frameMs.p95,b.frameMs.p95],['RAF p99 ms',a.frameMs.p99,b.frameMs.p99]])totals.push(`| ${name} | ${label} | ${change(old,now)} |`);
 for(let i=0;i<3;i++){
  const x=a.history[i],y=b.history[i],kind=y.kind,n={slime:'슬라임',raven:'까마귀',golem:'골렘'}[kind],xc=x.stats.combat,yc=y.stats.combat;
  encounters.push(`| ${name} ${n} | ${change(x.durationSeconds,y.durationSeconds)} | ${change(xc.damageReceived,yc.damageReceived)} | ${change(xc.swordHits,yc.swordHits)} | ${change(xc.highestCombo,yc.highestCombo)} | ${change(x.metrics.interruptions,y.metrics.interruptions)} | ${change(x.metrics.interruptionSeconds,y.metrics.interruptionSeconds)} |`);
  actions.push(`| ${name} ${n} | ${change(xc.dodges,yc.dodges)} | ${change(xc.successfulDodges,yc.successfulDodges)} | ${change(xc.counterattacks||0,yc.counterattacks||0)} | ${change(x.metrics.missedAttacks,y.metrics.missedAttacks)} | ${change(x.metrics.groundings+x.metrics.shieldBreaks,y.metrics.groundings+y.metrics.shieldBreaks)} | ${change(xc.weaknessHits,yc.weaknessHits)} |`);
  windows.push(`| ${name} ${n} | ${change(a.scenes[kind].inactiveMs/1000,b.scenes[kind].inactiveMs/1000)} | ${change(a.scenes[kind].reachableMs/1000,b.scenes[kind].reachableMs/1000)} | ${change(a.scenes[kind].coreMs/1000,b.scenes[kind].coreMs/1000)} |`);
 }
 sound.push(`| ${name} | ${a.audio.playing} → ${b.audio.playing} | ${a.audio.error+a.audio.missing+a.audio.blocked} → ${b.audio.error+b.audio.missing+b.audio.blocked} | ${a.peakAudioNodes} → ${b.peakAudioNodes} |`);
}
const low=Math.min(...audio.rows.map(x=>x.rmsDb)),high=Math.max(...audio.rows.map(x=>x.rmsDb)),afterHigh=20*Math.log10(.126);
write('REBORN_PHASE5_GAMEPLAY_REVIEW.md',`# Phase 5 전후 게임플레이 측정

비교는 같은 상태 읽기 배우와 입력 경로, 브라우저별 한 여정입니다. 실제 키·버튼만 사용하며 적 HP를 쓰지 않습니다. 서로 다른 실행의 부하·스케줄링 변동이 있으므로 수치 차이를 인과적 개선으로 주장하지 않습니다. 정의와 우선순위는 [기준 감사](REBORN_PHASE5_BASELINE_REPORT.md)에 있습니다. 사람 플레이는 미실시입니다.

| 브라우저 | 지표 | 기준 → 최종 (차이) |
|---|---|---|
${totals.join('\n')}

## 전투와 중단

시간은 초입니다. 전투 경과는 학습 창을 포함합니다. 자동 배우는 상태와 정답을 알고 있으며 초보자 예상 시간이 아닙니다.

| 전투 | 경과 초 | 받은 피해 | 검 적중 | 최고 연격 | 학습 창 | 중단 초 |
|---|---|---|---|---|---|---|
${encounters.join('\n')}

| 전투 | 회피 사용 | 실제 성공 회피 | 반격 성공 | 빗나간 검 | 착지+방어막 파괴 | 약점 적중 |
|---|---|---|---|---|---|---|
${actions.join('\n')}

| 전투 | IDLE/PATROL 초 | 검 높이 도달 초 | 핵/착지 노출 초 |
|---|---|---|---|
${windows.join('\n')}

검 높이 도달 시간은 거리·공격 자세까지 검증한 횟수가 아닙니다. 각 종류의 구간은 겹치며 합계로 쓰지 않습니다. 반격이 0인 자동 경로는 이 기능의 재미를 평가하지 못합니다. 별도 충돌 단위 검사와 기존 보스 브라우저 검사는 정확한 회피의 유효성을 확인합니다.

## 음성·자원

| 브라우저 | 실제 playing 시작 | 오류/누락/차단 | 최대 효과음 source nodes |
|---|---|---|---|
${sound.join('\n')}

36개 원본 RMS 범위 ${round(low)}~${round(high)}dBFS → 파일별 감쇠 후 계산상 ${round(low)}~${round(afterHigh)}dBFS. 범위는 ${round(high-low)} → ${round(afterHigh-low)}dB입니다. 이는 PCM RMS이며 LUFS나 지각 음량의 동일함을 보증하지 않습니다. 사용자 전체/영어 gain 적용 전 값입니다. 작은 파일은 증폭하지 않고 큰 파일만 낮춥니다. 음성 중 music 16%, sfx 35%, warning 75%, ui 45%, ambient 12%로 감쇠합니다. 경고를 완전히 덮지 않도록 별도 bus로 라우팅했습니다. 실제 스피커에서 명료도 향상은 사람 평가 대기입니다.

입력 예약 시작은 1타 65ms/2타 75ms → 공통 25ms. [동일 고정 스텝 비교](docs/reborn-phase5/input-comparison.json)에서 기준은 25/50ms 입력 거부, 최종은 수용을 확인했습니다. 공격 시작·피해·쿨다운은 동일합니다. 연격 마지막 타는 다음 자동 연격을 예약하지 않습니다. 히트스톱의 길이를 늘리지 않고 접촉 자세·칼날 소리 시점만 정렬했습니다. 골렘의 검 밀림은 8/14/32px → 2.4/4.2/9.6px입니다. 반격은 유효한 Perfect Dodge 뒤 전투 시뮬레이션 1.2초 내 안전한 검 적중 한 번, 충전 +8이며 추가 피해·무적·학습 점수는 없습니다. 안내·정지·히트스톱 동안 이 기회는 줄지 않습니다.

현재 측정만으로 더 재미있다거나 모든 컴퓨터에서 60FPS라고 말할 수 없습니다. 학습 창 개수를 억지로 줄이지 않고 기존 익숙함 규칙을 보존했습니다. 정상 반복 여정에서 창 감소는 기존 학습 규칙의 회귀 확인입니다.

## 다음 우선순위

Phase 6는 [사람 플레이 양식](REBORN_PHASE5_HUMAN_PLAYTEST.md)을 실제로 시행하는 것부터 시작합니다. 우선 36문장 발음·혼합 명료도, 타격감/회피 공정성, 까마귀 대기, 골렘 수정의 이해도를 확인하고 가장 많이 막힌 한 구간을 수정합니다. 새 장·경제 시스템보다 증거가 있는 불편을 먼저 다룹니다.
`);
write('REBORN_PHASE5_TEST_REPORT.md',`# Phase 5 검증 보고서

플레이어가 시작 버튼을 누르면 로컬 엔진이 입력·충돌·학습을 판정하고, 내장 음성과 화면을 갱신하며 세 전투 뒤 결과로 연결되는 오프라인 흐름을 검증했습니다. API·DB·서버는 이 경로에 없습니다.

기준 211개 → 최종 **220/220 단위 검사 통과**. 기존 전투·Phase 3·Phase 4·v0.8 검사를 유지하고 입력 예약, 히트스톱 자세/소리, 유효 반격/만료/정지, 새 공격 회피 자격, 골렘 밀림, 현재 전투 재도전, 파일별 음량, 경고 ducking과 중복 gain 예약 검사를 추가했습니다. 단위 검사의 고립 fixture는 상태를 설정하지만 실제 브라우저 흐름은 HP·좌표·진행 상태를 쓰지 않습니다.

| 브라우저 | 새 여정 | 터치·필드 패턴 | Phase 3·음성 실패 | 기존 보스·v0.8 |
|---|---|---|---|---|
${browserRows.join('\n')}

두 브라우저 모두 실제 빠른 별도 입력 예약, held-key 자동 반복 없음, 환경음 정지 후 source nodes 0, 작은 360px와 reduced motion을 추가 확인했습니다. 기존 검사는 실제 Perfect Dodge, 챔피언 단계·패턴, 실제 투사체 마법, 패배·재시작, 포커스 해제, 음량·재생 속도, 1920/1366/768/390/360 레이아웃, v0.8 아카데미 500항목을 확인합니다. 음소거·재생 거절·텍스트 도움은 독립 듣기 행동을 만들지 않고 진행 가능합니다.

## 경계별 증거

| 경계 | 상태 | 증거 |
|---|---|---|
| 버튼/키/터치 → 엔진 | 통과 | polish-controls, field-controls, regression 로그 |
| 엔진 → 충돌/세 적 결과 | 통과 | journey JSON의 세 전투 피해 70/110/170, 총 350 |
| 엔진 → 음성·학습 | 통과 | failure-cases, phase3-flow, 음소거 여정 독립 0 |
| 승리 → 다음 장소/최종 결과 | 통과 | 정상 2회·음소거 1회 완주, 전후 동일 경로 |
| 자원 → 오프라인 패키지 | 통과 | 네트워크 요청·pageerror 없음, 36 내장 음성 |
| 기존 데이터 | 통과 | 원본/Phase 1 해시, 격리 프로필의 기존 저장 sentinel 보존 |

## 실행 파일

- HTML ${artifact.rebornBytes} bytes, SHA-256 ${artifact.sha256}.
- v0.8 원본과 Phase 1 보존본 검증 통과. Phase 4 브랜치/PR #11 미병합 보존.
- 36 WAV와 생성 영수증/manifest 변경 없음. 무료 로컬 합성 모델 하나, 인간 녹음 아님.
- 엔진 단일 프레임 구동, 1/120초 고정 스텝, effects 최대64 / events100 / audio source96 / field path cache256. 브라우저 전체 heap과 장시간 메모리 프로파일은 측정하지 않았으며 누수 부재를 보증하지 않습니다.

전체 여정·전후 측정의 HTML 해시는 ${style.gameplaySha256}입니다. 마지막에 적별 HP 색상의 CSS 우선순위만 수정했습니다. [비교 증명](docs/reborn-phase5/final-style-proof.json)에서 style 블록을 제외한 HTML(실행 JavaScript와 내장 음성 포함)이 바이트 단위로 같음을 확인했습니다. 최종 해시로 두 브라우저의 네 적 선택·색상·360px 표시와 전체 기존 보스 회귀를 다시 실행했습니다. 이미 통과한 동일 실행 코드의 전체 여정은 중복 실행하지 않았습니다.

Edge 초기 회귀는 실제 다시 연습 2회를 고정 1회로 기대하는 테스트에서 실패했습니다. 게임은 승리했고 pageerror는 없었습니다. 결과 문구를 실제 엔진의 정답/다시 연습/독립 횟수와 모두 정확히 비교하도록 수정한 후 Chrome·Edge에서 다시 통과했습니다. 초기 실패 로그도 보존했습니다.

원자료는 [docs/reborn-phase5](docs/reborn-phase5)에 있습니다. *-final-metrics.json, *-journey.json, *-muted-journey.json, *-field-controls.json, *-flow.json, *-learning.json 및 같은 이름 로그를 보세요. [전후 표](REBORN_PHASE5_GAMEPLAY_REVIEW.md)와 [사람 검토](REBORN_PHASE5_HUMAN_PLAYTEST.md)를 분리했습니다.

## 재현

~~~powershell
node build-reborn.mjs
node --test tests/*.test.cjs
node scripts/validate-reborn.mjs
# Playwright와 해당 브라우저 필요. 테스트는 별도 프로필에서 실행됩니다.
$env:REBORN_BROWSER='chrome' # msedge도 반복
$env:REBORN_QA_OUT='docs/reborn-phase5'
node tests/reborn-feel-controls-browser.cjs
node tests/reborn-feel-browser.cjs
node tests/reborn-adventure-browser.cjs
node tests/reborn-adventure-browser.cjs --muted
node tests/reborn-field-controls-browser.cjs
node tests/reborn-flow-browser.cjs
node tests/piper-learning-browser.cjs
node tests/reborn-browser.cjs
python scripts/audit-reborn-audio.py
~~~

기준 비교는 Phase 4 커밋의 HTML을 .phase3-baseline/phase4-verified.html로 추출한 뒤 feel-browser에 --baseline을 붙입니다. 전체 증거가 준비되면 node scripts/report-reborn-phase5.cjs가 해시와 PASS를 확인하고 전후 보고서를 생성합니다.

## 한계

사람 평가 0명·음성 승인 0/36. 재미, 실제 이해도, 원어민 수준 자연스러움, 초보자 플레이 시간은 미검증입니다. 기존 선택 난이도 구조가 없어 새 난이도를 추가하지 않았습니다. 현재 자동 경로에서 막힘은 없지만 모든 기기·입력 조합의 무결함을 의미하지 않습니다. 음성 RMS 감쇠는 기술적 균형만 보장하며 실제 청취 검토가 필요합니다.
`);
console.log('Reports verified and written:',artifact.sha256);
