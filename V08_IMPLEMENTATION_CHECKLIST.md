# English Quest v0.8 — Implementation checklist

검증 전 항목은 체크하지 않습니다. 근거는 TEST_REPORT.md, CONTENT_REVIEW.md, CONTENT_REVIEW_QA.md 및 자동 테스트를 함께 확인합니다.

## A. Preparation

- [x] Inspect repository and branches.
- [x] Identify latest stable version.
- [x] Read project documentation.
- [x] Run existing tests.
- [x] Record baseline test results.
- [x] Create dedicated feature branch.
- [x] Protect existing save compatibility.

## B. Curriculum Architecture

- [x] Define curriculum data schema.
- [x] Define 12 curriculum units.
- [x] Define learning objectives.
- [x] Define question difficulty metadata.
- [x] Create content pack structure.
- [x] Create content validation tool.
- [x] Integrate content packs into offline build.

## C. Content Expansion

- [x] Complete first 100 validated activities.
- [x] Test all question categories.
- [x] Reach 250 validated activities.
- [x] Check for duplicates and unreachable content.
- [x] Reach 500 validated activities.
- [x] Review translations and grammar.
- [x] Validate answer choices and explanations.
- [x] Confirm every activity is playable.

## D. English Placement

- [x] Create 24 diagnostic questions.
- [x] Implement assessment interface.
- [x] Implement scoring.
- [x] Implement skill-category results.
- [x] Implement starting-tier recommendations.
- [x] Add skip and retest options.
- [x] Save assessment results.
- [x] Handle listening fallbacks honestly.

## E. Academy

- [x] Create Academy of Words environment.
- [x] Implement vocabulary training.
- [x] Implement sentence workshop.
- [x] Implement listening chamber.
- [x] Implement conversation practice.
- [x] Implement mixed challenges.
- [x] Connect academy to existing game navigation.

## F. Adaptive Learning

- [x] Implement adaptive question selection.
- [x] Implement difficulty adjustments.
- [x] Prevent excessive repetition.
- [x] Add appropriate hints.
- [x] Track assistance usage.
- [x] Allow manual difficulty selection.
- [x] Test recommendation thresholds.

## G. Spaced Repetition

- [x] Define review intervals.
- [x] Implement next-review scheduling.
- [x] Implement review-due selection.
- [x] Create review interface.
- [x] Persist review results.
- [x] Handle missed review dates.
- [x] Test date and time-zone behavior.

## H. Progress Tracking

- [x] Create learning progress map.
- [x] Create learning dashboard.
- [x] Track per-skill accuracy.
- [x] Track curriculum completion.
- [x] Show due reviews.
- [x] Add grounded learning recommendations.
- [x] Clearly separate learning and RPG levels.

## I. Practical Missions

- [x] Implement café mission.
- [x] Implement directions mission.
- [x] Implement shopping mission.
- [x] Implement workplace mission.
- [x] Validate mission dialogue.
- [x] Integrate mission completion records.
- [x] Prevent duplicated first-time rewards.

## J. Backup and Compatibility

- [x] Implement save export.
- [x] Implement save import.
- [x] Validate imported files.
- [x] Add import confirmation.
- [x] Implement save migration.
- [x] Test older progress records.
- [x] Test corrupted backup files.

## K. Final Quality Assurance

- [x] Run existing regression tests.
- [x] Run content validation.
- [x] Verify all learning modes.
- [x] Verify diagnostic scoring.
- [x] Verify adaptive selection.
- [x] Verify review scheduling.
- [x] Verify progress calculations.
- [x] Test complete offline play.
- [x] Test Chrome.
- [x] Test Edge.
- [x] Test responsive layouts.
- [x] Verify no major console errors.
- [x] Rebuild standalone HTML.
- [x] Update README and test report.
- [x] Update changelog.
- [x] Prepare GitHub pull request.

---


## 검증 근거와 품질 게이트

모든 체크는 구현과 실행 확인을 마친 항목입니다. GitHub 항목은 전용 브랜치와 최종 PR 본문 준비를 포함하며, 공개 PR 링크는 최종 전달에 첨부합니다.

| 게이트 | 확인한 결과 | 근거 |
| --- | --- | --- |
| 1. 안정 기준 | v0.7 원본 고정, 65/65 규칙 검사와 Chrome/Edge 기존 흐름 | TEST_REPORT.md, 실제 v07-completed.json |
| 2. 교육 구조 | 12개 단원, 72개 기능 목표, 독립 팩·인덱스·검사기 | curriculum-data.js, validate-content.mjs |
| 3. 첫 100개 | 구조·언어 검토, 수업 전 단계와 다섯 모드, 100개 진입 버튼 | 671,334바이트 UI 검사 종료 0 |
| 4. 진단 | 대체 형식 두 개, 각 24문항과 4영역×6, 영역별 기준·제한·저장·재진단 | academy.test.cjs, 두 브라우저 실제 48문항 |
| 5. 배움터 | 여섯 배움터와 다섯 연습 모드, 세 장에서 진입 | academy-browser.cjs |
| 6. 적응 학습 | 새 독립 표본 10개·서로 다른 활동 8개·복수 영역, 현재 난도 근거, 수동 설정 | academy.test.cjs |
| 7. 250→500개 | 중간 250개 UI 통과 후 확장, 최종 500개·151개 표현·예문·복수 형식 연결 | CONTENT_VALIDATION_REPORT.json, 저자 및 독립 언어 검토 |
| 8. 기록 | 실제 전체/독립/도움 응답 분모, 고유 완료, 단원 진행·복습·다음 활동 | 엔진 산술 검사와 브라우저 기록 대조 |
| 9. 미션 | 카페 5, 길 4, 시장 4, 직장 4단계; 중단·재개·재시도·일회 보상 | 실제 네 미션의 엔진·Chrome·Edge 검사 |
| 10. 백업·이전 | v1–5·v7 보존, 실제 JSON 파일 다운로드·검증·취소·확정 복원, 실패 시 원본 보존 | backup.test.cjs, academy-browser.cjs |
| 11. 전체 검사 | 94/94, 건너뜀 0; 서울·뉴욕 날짜 검사 각 3/3; 최종 Chrome/Edge 종료 0 | TEST_REPORT.md |
| 12. 최종 파일 | 794,176바이트의 오프라인 HTML, 한국어 설명서·변경 기록·보고서, 기능 브랜치·PR 본문 준비 | EnglishQuest.html, README_KO.md, CHANGELOG.md |

최종 파일 SHA-256: `E0F49C2BB74125F16828C0A1D9F5B448B0FEA1831C6AF9117290668FEDA0CBAD`. 브라우저에서는 500개 카탈로그 ID 전체와 69개 단원/영역 대표를 검증하고, 엔진에서는 500개 모두를 실제 정답 처리했습니다. 이전 모험 전체 회귀의 중간 빌드와 최종 아카데미 빌드를 구분한 범위는 TEST_REPORT.md에 기록했습니다.

외부 교육 전문가 인증, 실제 학습 효과 실험, 실제 마이크 서비스의 발음·인식 정확도 평가는 수행하지 않았습니다. 선택 음성 입력은 수명주기와 오류 처리를 모의 이벤트로 검사했습니다.
