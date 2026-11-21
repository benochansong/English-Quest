# Phase 3 — 검증 보고서

검증일: 2026-11-21 (Asia/Seoul). Windows, Node 24.14.0, 설치된 Chrome·Edge, Playwright의 별도 임시 프로필을 사용했습니다. 기존 개인 브라우저 저장은 검사에 사용하지 않았습니다.

## 자동 규칙 검사

`node --test tests/*.test.cjs`: **189/189 통과**. [최종 로그](docs/reborn-phase3/unit-tests.log).

- 기존 171개 검사에 Phase 3 규칙 16개와 음성 우선순위·완료 후 양보 2개를 추가했습니다.
- 상태 전환, 최근 연속 성공, 대표 표현의 실제 행동 필수, 같은 기회 중복 방지, 도움·무음·실패 구분, 세션 기억과 재시작을 검사했습니다.
- 실제 위험 이탈, 서 있기 실패, 도움 중 타이머 정지, 수정 실제 타격·만료, 마법 자원·충돌 피해, 자발적 복습의 무료 시전 방지, 오래된 콜백, 재생 후 음소거, 지연 경고를 검사했습니다.
- 결정적 단위 검사는 위치·이전 학습·적 상태를 준비한 뒤 시뮬레이션합니다. 이 결과를 실제 플레이로 표시하지 않습니다.
- 기존 전투·Phase 2의 59개 단위 검사는 명시적 `flow:false`로 이전 규칙의 기준 동작을 보존합니다. 현재 기본값 `flow:true`는 새 16개 검사와 아래 실제 브라우저 입력으로 별도 검증합니다.

## 실제 브라우저 입력

| 브라우저 | 버전 | 3회 연속 승리·도움 | 음소거·재생 실패 | 전투·터치·원본 회귀 |
|---|---|---|---|---|
| Chrome | 157.0.8103.79 | 통과 | 통과 | 통과 |
| Edge | 157.0.4341.60 | 통과 | 통과 | 통과 |

최종 문구 정리 전 동일 동작 빌드(`0abe123d652785654db044091afed2c51ce2c7def83ce60794b49022b7f7f875`)에서 두 브라우저의 실패 사례와 전체 회귀를 완료했습니다. 이후 변경은 튜토리얼의 첫 학습/실전 구분과 결과의 안내 과제 라벨, 두 한국어 문구뿐입니다. 최종 배포 파일에서 189개 자동 검사와 두 브라우저의 3회 반복 승리·도움·결과 화면 검사를 다시 통과했습니다.

로그: [Chrome 흐름](docs/reborn-phase3/chrome-flow.log) · [Edge 흐름](docs/reborn-phase3/msedge-flow.log) · [Chrome 실패 사례](docs/reborn-phase3/chrome-failure-cases.log) · [Edge 실패 사례](docs/reborn-phase3/msedge-failure-cases.log) · [Chrome 회귀](docs/reborn-phase3/chrome-regression.log) · [Edge 회귀](docs/reborn-phase3/msedge-regression.log).

세 검증 스크립트는 모두 `file://`로 단일 HTML을 열고 오프라인 컨텍스트에서 진행합니다. 실제 입력 흐름은 상태를 읽되 게임 상태·체력·위치·학습 기록을 강제로 수정하지 않습니다. 원본 저장 보존 검사는 별도 프로필의 테스트용 sentinel을 미리 넣고 바이트가 그대로인지 비교합니다.

| 검사 | 범위 |
|---|---|
| `reborn-flow-browser.cjs` | 새 페이지부터 3회 실제 승리, 자연스러운 표현 기억과 배열 감소, 실제 230 피해·약점·마법 적중, 결과 분류 화면, 재도전 후 실전 도움·느린 재생·음소거·해제·같은 기회 재개 |
| `piper-learning-browser.cjs` | 실제 내장 Piper 재생 후 독립 응답 1회, 음소거+텍스트 0회, 미디어 재생 거부 주입+텍스트 0회, 세 경우 모두 전투 계속 가능 |
| `reborn-browser.cjs` | 튜토리얼, 실제 이동·경계·검 사거리·3연격·Perfect Dodge·모든 보스 패턴/단계·마법 시전 및 충돌·승리, 충돌 피해에 따른 실제 패배와 재시작, 결과 복습, 음량·음소거·느린 재생·명시적 대안 설정, 터치·축소 동작 설정, 원본 v0.8 새 게임→지도→500개 아카데미 진입 |

재생 거부 검사는 미디어 `play()` 실패를 주입합니다. 기기 음성 대안 설정 검사는 특정 사용자의 설치된 영어 음성 품질을 검증하지 않습니다. 별도 코덱 검사의 테스트 톤과 Web Audio 파형 측정도 영어 발음이나 스피커 청취 검사가 아닙니다.

1920·1366·768·390·360 너비에서 안내와 결과의 가로 넘침을 검사했습니다. 결과 카드는 내부 스크롤을 사용합니다. 터치 검사는 이동·공격·회피·재생·일시정지를 실제 포인터 입력으로 실행했습니다. 콘솔 예외 및 HTTP(S) 요청이 없는지 확인했습니다. 프레임 기록은 headless 자동화 환경의 설명용 표본이며 사용자 기기 FPS 보증은 아닙니다.

## 보존과 패키징

`node scripts/validate-reborn.mjs`로 원본·Phase 1 해시, 34개 음성 포함과 누락 없음, 최종 HTML을 확인합니다. 기존 음성 WAV·매니페스트·생성 영수증·믹서 소스·수동 청취 체크리스트는 이번 브랜치에서 변경하지 않았습니다. 유료 API, 마이크, 외부 런타임 서비스, 신규 음성 생성은 없습니다.

| 파일 | 바이트 | SHA-256 |
|---|---:|---|
| 최종 EnglishQuest_REBORN.html | 2220738 | `1b54f089111d3ab91fee24faa4b71573544838aa56decc3db207c60a9a226970` |
| 이전 Piper EnglishQuest_REBORN.html | 2207690 | `32efdd50a9e434750d1ab3b6e8ce28424f8da5322252224901f8f4ce6cd87899` |
| 보존 EnglishQuest.html | 794176 | `e0f49c2bb74125f16828c0a1d9f5b448b0fea1831c6af9117290668feda0cbad` |
| 보존 releases/EnglishQuest_REBORN_PHASE1.html | 108727 | `6a97f8e8e8e800d4ba32728396e6a80c606b839e59c4645f873de89b8d0d5bc2` |

[최종 패키징 검사 결과](docs/reborn-phase3/artifact-validation.json).

## 재현

```powershell
node build-reborn.mjs
node --test tests/*.test.cjs
node scripts/validate-reborn.mjs
# Node에서 playwright 모듈을 사용할 수 있어야 합니다.
$env:REBORN_BROWSER='chrome' # 다음 실행에서 msedge로 변경
$env:REBORN_QA_OUT='docs/reborn-phase3'
node tests/reborn-flow-browser.cjs
node tests/piper-learning-browser.cjs
node tests/reborn-browser.cjs
```

이전 버전 비교를 다시 실행하려면 커밋 `699de8a`의 `EnglishQuest_REBORN.html`을 `.phase3-baseline/EnglishQuest_REBORN.html`에 바이트 그대로 준비하고 `node tests/reborn-flow-browser.cjs --baseline`을 실행합니다. 이 로컬 비교 복사본은 Git에서 제외합니다. 일반 플레이에는 Node·Playwright·Python이 필요 없습니다.

## 한계

검사 통과는 전투 재미·몰입·영어 이해·발음 자연스러움의 사람 검증이 아닙니다. 자동 조작기는 정답과 상태를 알고 있습니다. 수동 Piper 청취 승인 0/34와 [사람 플레이 체크리스트](REBORN_PHASE3_PLAYTEST_CHECKLIST.md)는 미완료로 유지합니다. 다른 장치·브라우저 버전·출력 장치 및 모든 가능한 플레이 순서를 검증한 것은 아닙니다.
