# v0.7 구현·검증 체크리스트

기준: 2026-11-07 · v0.5 `cd99bf5`에서 `feature/english-quest-exploration-v07` 분기. 원격·로컬 모두 v0.6 구현이 없어 저작된 오프라인 동료 대사를 사용했습니다. 아래 항목은 규칙 테스트, 실제 브라우저 입력, 그림·화면 확인으로 검증했습니다.

## A. Repository Preparation

- [x] Inspect the repository and active branches.
- [x] Read project documentation.
- [x] Run baseline tests.
- [x] Identify stable functionality.
- [x] Protect existing save data.
- [x] Create the Version 0.7 development branch.

## B. Exploration Engine

- [x] Implement player movement.
- [x] Implement idle and walking animations.
- [x] Implement character direction changes.
- [x] Implement collision detection.
- [x] Implement interaction range.
- [x] Implement scene transitions.
- [x] Implement safe spawn points.
- [x] Implement mobile movement controls.
- [x] Prevent movement during blocking overlays.
- [x] Test movement on different frame rates.

## C. World Creation

- [x] Create Moonlit Forest.
- [x] Create Ruins of Memory.
- [x] Create Crystal Cavern.
- [x] Add area transitions.
- [x] Add environmental decorations.
- [x] Add interaction indicators.
- [x] Add environmental animations.
- [x] Test map boundaries and exits.

## D. English Puzzles

- [x] Implement direction puzzles.
- [x] Implement sentence-order puzzles.
- [x] Implement listening crystals.
- [x] Implement inscription puzzles.
- [x] Implement magical door puzzles.
- [x] Create at least eight complete puzzles.
- [x] Add Korean hints and explanations.
- [x] Integrate learning records.
- [x] Test every puzzle solution.

## E. Treasure and Secrets

- [x] Implement treasure chest interaction.
- [x] Implement common rewards.
- [x] Implement rare rewards.
- [x] Implement educational rewards.
- [x] Create two hidden areas.
- [x] Save opened chest states.
- [x] Prevent duplicate rewards.
- [x] Test reload after treasure discovery.

## F. Companions

- [x] Create Mira.
- [x] Create Bram.
- [x] Implement recruitment.
- [x] Implement companion selection.
- [x] Implement following behavior.
- [x] Implement companion dialogue.
- [x] Implement hint or discovery abilities.
- [x] Prevent companions from blocking movement.
- [x] Save recruited companion states.
- [x] Test companion switching.

## G. Story and Quests

- [x] Implement Chapter 3 story.
- [x] Implement all five main quests.
- [x] Implement crossroads choice.
- [x] Implement crystal restoration choice.
- [x] Implement branching dialogue.
- [x] Save story decisions.
- [x] Prevent contradictory quest states.
- [x] Implement chapter completion.
- [x] Test all story routes.

## H. Polish

- [x] Improve exploration animations.
- [x] Add atmospheric lighting.
- [x] Add interactive object effects.
- [x] Add treasure animations.
- [x] Add environmental audio.
- [x] Improve mobile layout.
- [x] Verify reduced-motion behavior.
- [x] Verify readable Korean and English text.

## I. Final Verification

- [x] Existing chapters remain playable.
- [x] Existing combat still works.
- [x] Existing saves migrate safely.
- [x] All three regions are explorable.
- [x] All mandatory puzzles are solvable.
- [x] Companions work.
- [x] All five quests can be completed.
- [x] Branching paths reconnect correctly.
- [x] Treasure rewards cannot be duplicated.
- [x] The game runs offline.
- [x] Chrome and Edge are tested.
- [x] Mobile-sized layouts are tested.
- [x] No critical runtime errors remain.
- [x] Documentation is updated.
- [x] Standalone HTML is rebuilt.

## 검증 근거

| 범위 | 확인한 근거 |
| --- | --- |
| 기존 기반 | 수정 전 v0.5 HTML을 별도 폴더에 보존하고 Chrome/Edge에서 기존 브라우저 검사 네 종류를 모두 실행했습니다. 실제 날짜와 고정 날짜를 혼용하던 복습 테스트를 교정했습니다. |
| 규칙·저장 | `node --test tests/*.test.cjs` — 65/65 통과. 탐험 15개에는 30/144 FPS 이동, 충돌·경계·잘못된 좌표, 세션·거리 검증, 모든 활동·보상·동료·분기, 복습·시련 연동, 기존 전투 승리·패배·재도전 후 복귀가 포함됩니다. |
| 실제 탐험 | Chrome/Edge에서 키보드·포인터 입력으로 달빛 길→미라, 돌길→브람을 각각 완주했습니다. 선택하지 않은 경로도 엔딩 후 방문하여 37개 활동을 모두 현장에서 해결했습니다. 이어서 37개 수첩 복습을 검사했습니다. |
| 유지되는 진행 | 퍼즐, 보물, 동료 영입, 이야기 선택, 지역 전환, 의뢰 완료와 엔딩 후 새로고침했습니다. 기존 v0.5 슬롯 원문이 변하지 않는지 비교했습니다. |
| 그림·접근성 | 185개 SVG 변형을 검사했습니다. Chrome에서 걷기·대기·상자·다리·문 상태와 모션 감소를 확인했습니다. 1920, 1366, 768, 390, 360px 너비에서 레이아웃을 검사했습니다. |
| 오프라인·음향 | 새 장 완주 중 외부 HTTP(S) 요청과 실행 오류가 없었습니다. 최종 파일에서 새 효과음 일곱 종류를 실제 WebAudio 컨텍스트로 실행하고 음소거·음량 0 동작을 점검했습니다. 소리 없는 환경에서는 영어 원문으로 진행했습니다. |
| 최종 보완 | 학습 두루마리의 미보유/보유 화면과 복습, 거리 안내 갱신, 수첩의 학습 표시를 최종 HTML에서 별도 확인했습니다. 전체 경로 검사와 마지막 보완 검사에 사용한 파일 버전은 `TEST_REPORT.md`에 구분합니다. |

## 범위와 한계

- 필수 기능 중 남겨 둔 미완성 항목은 없습니다. 세 지역과 두 비밀 장소, 동료 두 명, 다섯 의뢰, 두 이야기 선택을 끝까지 플레이할 수 있습니다.
- 모바일은 데스크톱의 화면 크기·터치 에뮬레이션으로 검사했습니다. 실제 휴대폰의 성능과 배터리 사용량을 측정하지 않았습니다.
- 새 장은 저작된 대사와 퍼즐로 진행합니다. AI 서비스, 새로운 전투·제작 시스템, 동료 전투 보너스는 추가하지 않았습니다.
- 동료는 가까운 위치를 따라가며 장애물에 걸리면 안전한 위치로 복귀합니다. 복잡한 경로 탐색 알고리즘을 사용하지 않습니다.
- 실제 마이크, 음성 인식 정확도와 스피커에서 들리는 소리의 품질은 검증하지 않았습니다. 필수 진행에는 마이크나 오디오가 필요하지 않습니다.
- 일반 노트북 전체에 대한 FPS 벤치마크나 장시간 메모리 스트레스 검사는 하지 않았습니다. 시간 기반 이동과 단일 루프·리스너 해제는 코드 및 기능 검사로 확인했습니다.
