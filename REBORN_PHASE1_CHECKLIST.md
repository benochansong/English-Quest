# REBORN Phase 1 implementation checklist

2026-11-21 verification: original v0.8 preserved; 135 deterministic tests pass. Chrome and Edge final offline journeys both passed with actual exit 0 on the 108727-byte bundle (SHA-256 6A97F8E8E8E800D4BA32728396E6A80C606B839E59C4645F873DE89B8D0D5BC2). See REBORN_PHASE1_TEST_REPORT.md for scope.

Unchecked English-audio items refer to real production English files: 0/30 are supplied. File-first playback controls, normal/slow speed, replay, cancellation and explicit fallback are implemented and tested, including a native temporary WAV tone probe. A test tone is not an English recording. No human speaker/listening or enjoyment test has been performed.

## A. Project Protection

- [x] Inspect v0.8 implementation.
- [x] Run baseline regression tests.
- [x] Preserve original files and saves.
- [x] Create isolated development branch.
- [x] Define the combat laboratory entry point.

## B. Real-Time Combat

- [x] Player movement
- [x] Player idle animation
- [x] Player run animation
- [x] Sword attack
- [x] Attack hitbox
- [x] Damage calculation
- [x] Dodge animation
- [x] Dodge invulnerability
- [x] Combat cooldowns
- [x] Enemy AI state machine
- [x] Enemy hit reactions
- [x] Enemy death

## C. Boss Combat

- [x] Slime Champion artwork
- [x] Boss entrance
- [x] Heavy Jump attack
- [x] Triple Bounce attack
- [x] Crystal Charge attack
- [x] Boss phase change
- [x] Boss defeat sequence

## D. English Voice

- [x] Create English voice script.
- [x] Create voice manifest.
- [ ] Prepare authorized audio assets.
- [ ] Verify actual playback.
- [x] Add normal-speed playback.
- [x] Add slow-speed playback.
- [x] Add replay control.
- [x] Add subtitle controls.
- [x] Add Korean hint controls.
- [x] Add missing-audio fallback.
- [x] Verify no unwanted audio overlap.

## E. English Gameplay

- [x] Implement Listen and Act.
- [x] Implement Sentence Magic.
- [ ] Add actual English audio triggers.
- [x] Connect correct responses to meaningful actions.
- [x] Add Korean explanations.
- [x] Add optional hints.
- [x] Add learning activity tracking.
- [x] Test incorrect response handling.

## F. Visual and Audio Polish

- [x] Improve hero animation.
- [x] Improve slime animation.
- [x] Add sword effects.
- [x] Add hit feedback.
- [x] Add magical effects.
- [x] Add boss effects.
- [x] Add sound effects.
- [x] Add HP UI.
- [x] Add victory effects.
- [x] Support reduced motion.

## G. Final Verification

- [x] Full vertical slice playable.
- [x] No critical combat bugs.
- [x] No duplicate damage.
- [x] No unreachable boss state.
- [x] No mandatory audio dependency without fallback.
- [x] Offline execution works.
- [x] Chrome tested.
- [x] Edge tested.
- [x] Original v0.8 remains functional.
- [x] Documentation completed.
- [x] Gameplay review report completed.

Mark tasks complete only after verification.

Document unavailable audio generation tools or other blockers honestly.
