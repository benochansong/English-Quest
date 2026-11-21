# Phase 5 검증 보고서

플레이어가 시작 버튼을 누르면 로컬 엔진이 입력·충돌·학습을 판정하고, 내장 음성과 화면을 갱신하며 세 전투 뒤 결과로 연결되는 오프라인 흐름을 검증했습니다. API·DB·서버는 이 경로에 없습니다.

기준 211개 → 최종 **220/220 단위 검사 통과**. 기존 전투·Phase 3·Phase 4·v0.8 검사를 유지하고 입력 예약, 히트스톱 자세/소리, 유효 반격/만료/정지, 새 공격 회피 자격, 골렘 밀림, 현재 전투 재도전, 파일별 음량, 경고 ducking과 중복 gain 예약 검사를 추가했습니다. 단위 검사의 고립 fixture는 상태를 설정하지만 실제 브라우저 흐름은 HP·좌표·진행 상태를 쓰지 않습니다.

| 브라우저 | 새 여정 | 터치·필드 패턴 | Phase 3·음성 실패 | 기존 보스·v0.8 |
|---|---|---|---|---|
| Chrome 157.0.8103.79 | 정상 2회 + 음소거 1회 + 비교 경로 1회 | 통과 | 통과 | 통과 |
| Edge 157.0.4341.60 | 정상 2회 + 음소거 1회 + 비교 경로 1회 | 통과 | 통과 | 통과 |

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

- HTML 2414911 bytes, SHA-256 842317fa8892998b6206482584260defbc831a333c3a126f0c1f87192d1e91bd.
- v0.8 원본과 Phase 1 보존본 검증 통과. Phase 4 브랜치/PR #11 미병합 보존.
- 36 WAV와 생성 영수증/manifest 변경 없음. 무료 로컬 합성 모델 하나, 인간 녹음 아님.
- 엔진 단일 프레임 구동, 1/120초 고정 스텝, effects 최대64 / events100 / audio source96 / field path cache256. 브라우저 전체 heap과 장시간 메모리 프로파일은 측정하지 않았으며 누수 부재를 보증하지 않습니다.

전체 여정·전후 측정의 HTML 해시는 18c28194fc46d9b3534bbfd62c7cdf919232439f4c4bae7e51cd0bb596ec1866입니다. 마지막에 적별 HP 색상의 CSS 우선순위만 수정했습니다. [비교 증명](docs/reborn-phase5/final-style-proof.json)에서 style 블록을 제외한 HTML(실행 JavaScript와 내장 음성 포함)이 바이트 단위로 같음을 확인했습니다. 최종 해시로 두 브라우저의 네 적 선택·색상·360px 표시와 전체 기존 보스 회귀를 다시 실행했습니다. 이미 통과한 동일 실행 코드의 전체 여정은 중복 실행하지 않았습니다.

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

