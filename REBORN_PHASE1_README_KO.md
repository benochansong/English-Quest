# English Quest REBORN — The Awakening

> 이 문서는 Phase 1 당시의 기록입니다. Phase 2 브랜치에서는 보존본 `releases/EnglishQuest_REBORN_PHASE1.html`을 열면 Phase 1을 실행할 수 있습니다. 루트의 `EnglishQuest_REBORN.html`은 Phase 2이며 새 안내는 `REBORN_PHASE2_README_KO.md`를 참고하세요.

기존 v0.8과 분리된 숲 전투 실험실입니다. `EnglishQuest.html`은 기존 모험, `EnglishQuest_REBORN.html`은 새 실시간 전투입니다. 두 파일을 혼동하지 마세요.

## Windows 실행

1. 받은 ZIP을 압축 해제합니다.
2. `EnglishQuest_REBORN.html`을 우클릭 → **연결 프로그램 → Google Chrome 또는 Microsoft Edge**로 엽니다.
3. **처음부터 배우기** 또는 **조작을 알아요 · 바로 시작**을 누릅니다.
4. 키보드나 화면 아래 버튼을 사용합니다. 서버·설치·로그인·마이크·인터넷은 필요 없습니다.

이 작업 공간에서는 `E:\Documents\ChatGPT\English Quest\EnglishQuest_REBORN.html`을 여세요. 기존 저장은 같은 브라우저에서 기존 `EnglishQuest.html`을 열면 계속 이용할 수 있습니다.

| 입력 | 행동 |
|---|---|
| A / ←, D / → | 좌우 이동 |
| J | 바라보는 방향으로 검 공격 |
| K | 짧은 회피 |
| L | 충전된 문장 마법 |
| R | 현재 표현 다시 듣기 |
| H | 한국어 뜻 도움 |
| Esc | 일시정지 / 계속 |

상대의 붉은 공격 예고를 보고 거리를 벌리거나 회피하세요. 검은 가까운 적에게만 맞습니다. 버튼을 연타해도 재사용 시간과 회피 무적 시간이 늘어나지 않습니다. 창을 벗어나면 자동으로 멈추며, 돌아온 뒤 **계속하기**를 누릅니다.

## 한 번의 모험

짧은 조작 안내 → 숲 입구 → Green Slime → 말의 수정 → Slime Champion → 결과와 표현 복습 순서입니다. 듣고 행동하기에서는 적이 기다립니다. 틀려도 피해 없이 설명을 읽고 다시 시도할 수 있습니다. 영어 원문·한국어 뜻·재생 여부를 도움 기록과 구분합니다.

수정 발견 후 검으로 마법을 충전하세요. L을 누르면 `I / need / fire`를 순서대로 배열할 수 있습니다. 정답은 Fire Burst를 발동합니다. 마법에는 충전량과 재사용 시간이 있어 같은 문장을 반복해서 무료 피해를 줄 수 없습니다. 결과의 표식과 기록은 이번 연습용이며 기존 모험 보상으로 전송하지 않습니다. 새로고침하면 실험실 진행과 설정은 초기화됩니다.

## 영어 음성의 현재 상태

**제작 음성 파일은 0/30개입니다.** 승인된 녹음·고품질 합성 파일이 제공되지 않았으며 유료 음성 생성은 실행하지 않았습니다. 음성 재생기를 구현한 것과 원어민 수준의 제작 음성을 납품한 것은 다릅니다.

- 실제 파일이 추가되면 빌드가 HTML에 포함하고 파일 재생을 우선합니다. 네트워크 주소를 요청하지 않습니다.
- 개발 중에는 **기기 음성 대안 (합성)**을 직접 선택할 수 있습니다. 설치된 로컬 영어 음성만 사용하며 녹음 파일로 표시하지 않습니다. 기기에 따라 음질·사용 가능 여부가 다릅니다.
- 소리가 없으면 **영어 원문 / 한국어 뜻**을 눌러 진행할 수 있습니다. 도움 응답을 독립 듣기 정답으로 간주하지 않습니다.
- 보이스는 한 번에 하나만 재생합니다. 새 재생·설정 변경·중단 시 이전 것을 취소합니다. 음성 재생 중 효과음과 음악을 낮춥니다.
- 느리게 0.75×, 전체·영어 음성·효과음·음악 음량, 전체 음소거를 지원합니다. 음악은 기본 0이며 짧은 원작 화음만 사용합니다.

`REBORN_VOICE_SCRIPT.md`에는 제작 대본과 누락 파일 30개가, `REBORN_VOICE_MANIFEST.json`에는 각 표현의 사용 위치·목표 억양·출처와 재배포 허가 상태가 있습니다. HeyGen 등의 제작 서비스 연결 및 비용 승인이 필요할 수 있습니다. 현재 연결되거나 제작됐다고 가정하지 않습니다.

## 소스와 빌드

```powershell
node build-reborn.mjs
node scripts/validate-reborn.mjs
node --test tests/*.test.cjs
```

`build-reborn.mjs`는 기존 `build.mjs`와 독립적이며 `EnglishQuest_REBORN.html`만 원자적으로 교체합니다. 원본 HTML은 수정하지 않습니다.

브라우저 검사는 개발용 Playwright와 로컬 Chrome/Edge가 있는 환경에서 `node tests/reborn-browser.cjs --screenshots`로 실행합니다. Edge는 PowerShell에서 `$env:REBORN_BROWSER='msedge'`를 지정합니다. 테스트는 별도 브라우저 프로필과 차단된 네트워크를 사용합니다. 게임을 플레이하는 데 이 개발 도구는 필요하지 않습니다.

| 모듈 | 책임 |
|---|---|
| `src/reborn-combat.js` | 전투 상태·이동·충돌·적 AI·고정 간격 시뮬레이션 |
| `src/reborn-learning.js` | 명령·문장·도움·응답 검증 |
| `src/reborn-art.js` | 원작 Canvas 환경·관절 동작·전투 효과 |
| `src/reborn-audio.js` | 원작 절차적 효과음·오디오 믹스 |
| `src/reborn-voice.js` | 실제 파일 우선 재생·취소·명시적 대안 |
| `src/reborn-ui.js`, `src/reborn.css` | 단일 RAF·키보드/터치·HUD·학습 화면 |

전투 수치는 `RebornCombat.CONFIG`에서 조절합니다. 렌더러·음성 콜백은 직접 피해를 주지 않습니다. 입력 매핑은 `RebornApp.keymap`에 모여 있습니다. 실험실은 저장소 API를 사용하지 않으며 `EnglishQuest.v8`과 이전 저장 슬롯에 접근하지 않습니다.

라이선스가 확인된 MP3/WAV/OGG/M4A를 manifest 경로에 넣고 출처·유형·재배포 허가를 기록한 후 빌드하세요. 파일이 있는데 라이선스 메타데이터가 없으면 빌드가 실패합니다. 실제 파일 없이 `available` 값만 바꿔도 빌드는 파일 존재를 다시 확인합니다. 배포 전 30개 전부의 발음·음량·일반/느린 속도를 사람이 들어야 합니다.

## 검증과 한계

실행 결과는 `REBORN_PHASE1_TEST_REPORT.md`, 게임성 평가는 `REBORN_PHASE1_GAMEPLAY_REVIEW.md`, 요구사항 상태는 `REBORN_PHASE1_CHECKLIST.md`에 기록합니다. 브라우저 자동화의 통과는 재미나 실제 스피커 음질을 증명하지 않습니다. 초보자의 5–10분 플레이 시간과 반복 플레이 의향은 사람을 대상으로 확인해야 합니다.
