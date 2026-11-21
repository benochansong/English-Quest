# Phase 5 verification checklist

기준 Phase 4: `5187950abfdea0d694aed981a27fb821e09d7fed`. 기능 검증과 실제 사람 평가는 별도입니다.

## A. Preparation

- [x] Verify Phase 4 implementation.
- [x] Run baseline tests.
- [x] Preserve original v0.8.
- [x] Create Phase 5 branch.
- [x] Record current gameplay measurements.

## B. Combat

- [x] Audit sword responsiveness.
- [x] Improve combo animation.
- [x] Improve hit feedback.
- [x] Improve dodge reaction.
- [x] Verify Perfect Dodge.
- [x] Improve counterattack windows.
- [x] Balance enemy recovery states. (기존 회복 시간 유지, 골렘 밀림·한정 반격 창 조정)

## C. Enemies

- [x] Refine Forest Slime.
- [x] Refine Shadow Raven.
- [x] Refine Crystal Golem.
- [x] Refine Slime Champion.
- [x] Improve enemy-specific hit reactions.
- [x] Verify attack telegraphs.
- [x] Verify vulnerability windows.

## D. Audio

- [x] Audit all Piper recordings.
- [x] Verify voice manifest.
- [x] Verify audio level consistency.
- [x] Check pronunciation-review status.
- [x] Fix confirmed defective recordings. (확정된 녹음 결함 없음; 원본 유지, 재생 음량만 감쇠)
- [x] Improve voice playback priority.
- [x] Improve music ducking.
- [x] Prevent stale spoken instructions.

## E. Immersion

- [x] Improve encounter introductions.
- [x] Improve environmental effects.
- [x] Improve enemy defeat sequences.
- [x] Improve victory transitions.
- [x] Reduce unnecessary dialogue. (첫 화면은 이동·검·회피 중심, 새 필수 대화 없음)
- [x] Improve first-minute engagement.

## F. English Learning

- [x] Preserve Guided → Practice → Familiar.
- [x] Reduce repetitive forced prompts.
- [x] Preserve safe learning pauses.
- [x] Verify independent listening records.
- [x] Verify assisted response records.
- [x] Verify missed-action recovery.
- [x] Keep audio/text accessibility alternatives.

## G. Technical Quality

- [x] Profile frame times.
- [x] Check memory behavior. (bounded nodes/effects/cache 및 pause cleanup; 장시간 heap 프로파일 미실시)
- [x] Verify audio resource cleanup.
- [x] Verify collision accuracy.
- [x] Verify pause and resume.
- [x] Verify restart.
- [x] Verify all encounters can finish.

## H. Testing

- [x] Run automated tests.
- [x] Run Chrome tests.
- [x] Run Edge tests.
- [x] Test offline playback.
- [x] Test keyboard inputs.
- [x] Test touch controls.
- [x] Test reduced-motion settings.
- [x] Compare baseline and final metrics.
- [x] Prepare real player test instructions.
- [x] Document unfinished human evaluations.


## Human approval and delivery

- [ ] 실제 사람 플레이 평가 (현재 참가자 0명)
- [ ] 36개 음성 발음·자연스러움 듣기 승인 (현재 0/36)
- [ ] Dedicated branch pushed and separate Draft PR opened; no merge.

확정된 녹음 결함은 없어 재생성·교체하지 않았습니다. 해당 검사 항목은 전수 기술 감사와 미승인 상태 확인을 뜻하며 주관적 품질 승인을 뜻하지 않습니다.
