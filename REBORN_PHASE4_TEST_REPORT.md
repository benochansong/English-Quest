# Phase 4 — 검증 보고서

검증일: 2026-11-21 (Asia/Seoul). Windows, Node 24.14.0, 로컬 Piper 1.8.0, 설치된 Chrome·Edge와 Playwright의 별도 프로필을 사용했습니다.

## 사전 게이트

기준 커밋 `6377f07b7b03ce5090cbd3117b4c2307a11a55c6`과 Phase 3 보고서·엔진·음성·HTML을 확인했습니다. 작업 트리는 깨끗했고 기존 189개 자동 검사가 통과했습니다. 브라우저 회귀에서 결과 문구를 기대하는 테스트 한 곳이 최종 한국어 라벨을 반영하지 못한 것을 확인해 테스트를 수정했습니다. 게임 동작을 바꾸지 않고 두 브라우저 회귀를 다시 통과한 뒤 새 적 구현을 시작했습니다.

[사전 단위 검사](docs/reborn-phase4/baseline-tests.log) · [Phase 3 Chrome 재검증](docs/reborn-phase4/phase3-chrome-regression.log) · [Phase 3 Edge 재검증](docs/reborn-phase4/phase3-msedge-regression.log).

## 자동 규칙 검사

`node --test tests/*.test.cjs`: **211/211 통과**. 기존 189개에 새 전투·여정 21개, 원래 음성 바이트 보존 1개를 추가했습니다. 기존 음성 수와 표현 목록 검사는 두 새 항목을 반영하되 이전 항목을 그대로 확인합니다.

- 까마귀 고도·검 충돌·급강하·쓸기·깃털·착지·자연 회복 취약점·E 거리·정지·재시작
- 골렘 세 패턴·이동 충격파·방어막·수정 충전 전 입력 거부·정답/오선택·회복·핵 1.5배 피해
- 안전한 첫 안내·실제 음성과 행동 연결·텍스트 도움·음소거·최근 연속 성공·중복 방지·오래된 콜백
- 패배 후 학습 창이 잘못 열리지 않음·30/60/120 업데이트 일치·세 전투 순서·전환 중 정지·중복 진행 거부·현재 전투 재도전·최종 승리
- 기존 검 3연격·Perfect Dodge·문장 마법·Phase 3 흐름·원본 게임 회귀

단위 검사는 위치·고도·기존 학습 또는 마지막 한 번의 타격 상태를 준비하는 결정적 fixture를 사용합니다. 특히 여정 전환 검사에서 적 체력을 1로 준비한 것은 전환 자체를 격리하는 검사이며, 완주 증거는 아래의 실제 브라우저 입력입니다.

## 브라우저 검사

| 브라우저 | 실제 세 전투 완주 | 터치·도움·오선택·새 적 전체 패턴 | Phase 3 반복 흐름 | 기존 전투·원본 회귀 |
|---|---|---|---|---|
| Chrome 157.0.8103.79 | 정상 여정 2회 + 음소거 여정 1회 | 통과 | 통과 | 통과 |
| Edge 157.0.4341.60 | 정상 여정 2회 + 음소거 여정 1회 | 통과 | 통과 | 통과 |

[Chrome 여정 로그](docs/reborn-phase4/chrome-journey.log) · [Edge 여정 로그](docs/reborn-phase4/msedge-journey.log) · [Chrome 새 조작](docs/reborn-phase4/chrome-field-controls.json) · [Edge 새 조작](docs/reborn-phase4/msedge-field-controls.json) · [Chrome 기존 회귀](docs/reborn-phase4/chrome-regression.log) · [Edge 기존 회귀](docs/reborn-phase4/msedge-regression.log).

`reborn-adventure-browser.cjs`는 실제 키보드·마우스로 세 전투를 각각 두 번 연속 완료합니다. 별도 새 페이지에서는 음소거·한국어 도움으로 세 전투를 모두 끝내고 독립 실전 듣기 0회를 확인합니다. 각 전투에서 실제 총 피해 70/110/170, 실제 마법 적중·까마귀 착지·골렘 방어막 파괴·핵 타격, 다음 장소 이동과 최종 승리를 확인합니다.

`reborn-field-controls-browser.cjs`는 실제 터치로 이동·수정 상호작용·오선택 후 재시도·도움·느린 재생·음소거/해제·안전한 정지·재시작을 수행합니다. 별도 까마귀 전투에서는 급강하·가로 쓸기·깃털 투사체를 모두 관찰한 뒤 실제로 승리합니다. 상태를 읽어 행동을 고르지만 게임 체력·위치·진행·학습 기록을 직접 쓰지 않습니다.

`reborn-flow-browser.cjs`는 보존된 전투 실험실을 세 번 반복하고, `reborn-browser.cjs`는 기존 콤보·실제 접촉 Perfect Dodge·보스 전체 패턴·승리·패배·재시작·설정·터치·원본 v0.8 아카데미 진입을 확인합니다. `piper-learning-browser.cjs`는 실제 Piper 재생, 음소거, 미디어 재생 거부 주입을 구분합니다. 새 여정의 패배 후 현재 전투 재도전은 결정적 단위 검사로 확인했습니다.

1920·1366·768·390·360 너비에서 가로 넘침을 검사하고 새 E 터치 버튼은 44px 이상의 누름 영역을 확인합니다. 기존 프로필 대신 테스트 전용 저장 sentinel을 사용해 원래 저장 키의 바이트가 바뀌지 않는지 확인합니다. 모든 게임 검사는 `file://`와 오프라인 컨텍스트에서 수행하며 HTTP(S) 요청과 uncaught 예외를 확인합니다.

## 음성과 보존

**기존 34개 + 새 2개 = 36/36 내장 음성, 누락 0개.** Bring it down! 약 0.998초, Activate the blue crystal! 약 1.498초. 같은 해시의 공개 도메인 LJSpeech 모델로 로컬 합성하고 PCM 형식·길이·비무음·SHA-256·생성 영수증을 검사했습니다. 기존 WAV 34개는 기준 커밋에서 추출한 [해시 목록](docs/reborn-phase4/original-voice-hashes.json)과 모두 일치합니다. 믹서 소스와 원래 수동 청취 체크리스트도 유지했습니다.

기술 검증은 실제 사람의 발음·억양 승인과 다릅니다. 승인 상태는 기존 34개와 새 2개 모두 미완료입니다. 유료 API·다운로드·외부 음성 서비스·마이크를 사용하지 않았습니다. Python과 모델은 개발 폴더에만 있고 배포 HTML에는 WAV만 들어 있습니다.

| 산출물 | 바이트 | SHA-256 |
|---|---:|---|
| Phase 4 EnglishQuest_REBORN.html | 2407781 | `06687b708fc4a61b1e47972b63eedcae494617eeae649da797cae36acc64bb50` |
| 보존 Phase 3 기준 커밋의 HTML | 2220738 | `1b54f089111d3ab91fee24faa4b71573544838aa56decc3db207c60a9a226970` |
| 보존 EnglishQuest.html | 794176 | `e0f49c2bb74125f16828c0a1d9f5b448b0fea1831c6af9117290668feda0cbad` |
| 보존 Phase 1 HTML | 108727 | `6a97f8e8e8e800d4ba32728396e6a80c606b839e59c4645f873de89b8d0d5bc2` |

[패키징 검사](docs/reborn-phase4/artifact-validation.json) · [211개 자동 검사](docs/reborn-phase4/unit-tests.log) · [추가 음성 생성 기록](docs/reborn-phase4/voice-production.json).

## 재현

```powershell
node build-reborn.mjs
node --test tests/*.test.cjs
node scripts/validate-reborn.mjs
# Playwright 모듈과 해당 브라우저 설치가 필요합니다.
$env:REBORN_BROWSER='chrome' # msedge에서도 반복
$env:REBORN_QA_OUT='docs/reborn-phase4'
node tests/reborn-adventure-browser.cjs
node tests/reborn-adventure-browser.cjs --muted
node tests/reborn-field-controls-browser.cjs
node tests/reborn-flow-browser.cjs
node tests/piper-learning-browser.cjs
node tests/reborn-browser.cjs
```

선택적 음성 재생성은 `scripts/generate-reborn-voices.py --ids VO_BRING_DOWN VO_ACTIVATE_BLUE --update-manifest --report docs/reborn-phase4/voice-production.json`으로 필요한 항목만 처리합니다. 기본 실행에는 Python이 필요 없습니다. `--force` 없이 유효한 기존 음성은 재사용합니다.

## 남은 한계

사람의 재미·몰입·학습 효과·발음·출력 장치 명료도와 초보자 10–15분 목표는 미검증입니다. 자동 조작기는 답과 상태를 알고 움직이며 자동 시간은 초보자 예상 시간이 아닙니다. 각 역할의 음성은 같은 합성 화자이고 별도 배우 연기가 아닙니다. 진행은 페이지 메모리 전용이며 장기 저장·새 난이도·새 경제 시스템은 추가하지 않았습니다. 모든 기기와 모든 입력 순서를 검증한 것은 아닙니다.
