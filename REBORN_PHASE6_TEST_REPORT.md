# Phase 6 verification report

Story: original campaign → Rowan optional training → actual Slime combat → validated result → same forest map → Rowan acknowledgment → persistent learning review. Offline file; server/API/environment-variable boundaries are not applicable.

Baseline: Phase 5 commit 628c8f395e0213eba1cdc07b7dc56d7d57ae1cda; original v0.8 branch df8ac9fc967148ab4231fac5cc6af322124f3a12. Baseline tests 220/220; final tests **232/232 PASS**. The 12 new tests cover run authority, deduplication, real-action gating, assisted evidence, malformed snapshots, cancellation/recovery, failed writes, cross-tab conflicts, corrupt/future saves, transactions and learning sanitization.

## Final artifacts

- EnglishQuest.html · 794176 bytes · SHA-256 e0f49c2bb74125f16828c0a1d9f5b448b0fea1831c6af9117290668feda0cbad
- EnglishQuest_REBORN.html · 2414911 bytes · SHA-256 842317fa8892998b6206482584260defbc831a333c3a126f0c1f87192d1e91bd
- EnglishQuest_REBORN_INTEGRATED.html · 3262877 bytes · SHA-256 9ea2c05a2980950f054178bc3945d743b16537f11e427d207a40e3939aa084cd

## Actual browser input

| Browser | Version | Route | Offline requests / errors |
|---|---|---|---|
| chrome | 157.0.8103.79 | PASS | 0 / 0 |
| msedge | 157.0.4341.60 | PASS | 0 / 0 |
 
Both final artifact runs use only real buttons/keys/file chooser/download for game progression. State is read for assertions and timing; HP, learning, quests and enemy state are not injected. Each run verifies:
- New campaign/class, forest entry, acceptance, one active child RAF and suspended parent audio.
- A collision-timed Perfect Dodge, sword combo, heard sentence magic and actual victory.
- Private result commit, child RAF stopped, frame removed, same map, Rowan acknowledgment, unchanged gold/XP.
- Reload persistence, repeat entry/cancel, interrupted-battle reload recovery.
- Recorded phrase review completion and the same field records in Academy progress.
- Actual defeat, restart, muted/translated magic victory, no repeated recognition or economy reward.
- Integrated backup download/confirmed restore, original-format campaign import with Academy dates/state retained.
- 390px mobile map and paused combat screenshots, no horizontal map overflow.

Original v0.8 Academy full regression passes in both browsers, including actual JSON download/import, invalid/future/oversized file rejection, stale checkpoint, reload, optional text and recognition lifecycle mocks, and five viewports. Standalone Phase 5 Raven battle real-input regression passes in both browsers. Both original artifact hashes match the baseline exactly.

## Evidence and limits

docs/reborn-phase6 contains browser JSON, screenshots, original/standalone regression logs, baseline/final unit logs and baseline voice validator output. Run `node scripts/report-reborn-phase6.cjs` to check evidence hashes and regenerate this report.

The tests validate a single optional Chapter 1 training route, not conversion of the full campaign. Browser audio playback events verify the recorded source, not physical speaker quality. Physical microphone, mobile hardware touch, human enjoyment, pronunciation/naturalness and long-term language learning are not signed off. Human voice review remains 0/36. No fabricated ratings or speed improvement claims.

Late fixes: backup-return navigation now follows the imported profile chapter; integrated backup profile is checked using the existing campaign Backup validator. Final full routes were rerun after these changes.
