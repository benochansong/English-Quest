# REBORN Phase 2 checklist

Verified 2026-11-21: 165/165 rules pass with no skips; Chrome and Edge full offline journeys both exit 0 on 157714 bytes, SHA-256 240BF1EE091A4E686E9919B873911B989DDE6A53E1960D898FFFABD1E0509E0D. Original v0.8 and archived Phase 1 remain byte-for-byte unchanged. See REBORN_PHASE2_TEST_REPORT.md for the exact scope.

The two unchecked voice items mean production English recordings and their actual listening review: **0/34 supplied**. Native embedded WAV playback, slow/replay/cancellation, all 25 original procedural SFX, and three-state procedural music were verified separately. Test tones and browser synthesis are not production English recordings. Human playtesting, pronunciation/naturalness review and enjoyment remain pending; use HUMAN_PLAYTEST_CHECKLIST.md.

## A. Project Preparation

- [x] Verify the Phase 1 implementation.
- [x] Preserve the original game.
- [x] Run baseline tests.
- [x] Create the Phase 2 development branch.

## B. Combat Improvements

- [x] Implement three-hit sword combo.
- [x] Add combo timing and input buffering.
- [x] Improve sword animations.
- [x] Implement hit-stop.
- [x] Implement knockback.
- [x] Implement damage-number animation.
- [x] Implement camera feedback.
- [x] Add impact particles.

## C. Movement and Dodge

- [x] Improve movement responsiveness.
- [x] Improve running animation.
- [x] Improve dodge animation.
- [x] Implement Perfect Dodge.
- [x] Verify cooldown and invulnerability rules.

## D. Enemy AI

- [x] Improve Slime idle behavior.
- [x] Improve Slime approach behavior.
- [x] Add attack anticipation.
- [x] Improve jump attack.
- [x] Improve rush attack.
- [x] Add recovery windows.
- [x] Improve hit and defeat reactions.

## E. Boss Combat

- [x] Improve boss entrance.
- [x] Add distinct attack patterns.
- [x] Add phase transition.
- [x] Add weakness exposure.
- [x] Integrate English listening opportunities.
- [x] Improve boss defeat animation.

## F. English Voice

- [x] Audit existing audio assets.
- [x] Create voice production list.
- [x] Create voice manifest.
- [ ] Integrate authorized high-quality voices.
- [ ] Verify actual audio playback.
- [x] Add normal-speed playback.
- [x] Add slow playback.
- [x] Add subtitle controls.
- [x] Add Korean hints.
- [x] Test missing-asset fallback.

## G. Audio and Visual Polish

- [x] Improve sword sound effects.
- [x] Improve hit effects.
- [x] Improve magic sound effects.
- [x] Improve enemy attack sounds.
- [x] Improve boss audio.
- [x] Implement audio mixing.
- [x] Add appropriate music transitions.
- [x] Improve forest lighting.
- [x] Improve visual clarity.
- [x] Support reduced motion.

## H. Final Verification

- [x] Complete combat slice playable.
- [x] Combo system functional.
- [x] Boss fight completable.
- [x] English learning fully integrated.
- [x] Required voice assets verified or accurately reported missing.
- [x] No critical combat errors.
- [x] Offline package works.
- [x] Original v0.8 remains intact.
- [x] Browser tests completed.
- [x] Gameplay evaluation documented.

Only mark an item complete after implementation and verification.
