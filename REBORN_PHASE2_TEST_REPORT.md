# REBORN Phase 2 — verification report

Verified on Windows, 2026-11-21. The enhanced combat slice passes its automated rules and complete offline Chrome/Edge journeys. **Production English voice files remain unavailable: 0/34.** Audio loading, optional synthesis, text assistance and original procedural sound are implemented; no recorded-English quality approval or human enjoyment result is claimed.

## Baseline and protected artifacts

Before production edits, branch `feature/english-quest-reborn-phase2` was at Phase 1 commit `6c6a303`. The only initial untracked directory was the newly prepared `releases/` archive. The existing suite passed **135/135, 0 skipped, actual process exit 0**. Both the current Phase 1 entry and archived copy were identical. Evidence: [baseline tests](docs/reborn-phase2/baseline-tests.log), [baseline hashes](docs/reborn-phase2/baseline-hashes.json).

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Original v0.8 `EnglishQuest.html`, unchanged | 794176 | `E0F49C2BB74125F16828C0A1D9F5B448B0FEA1831C6AF9117290668FEDA0CBAD` |
| `releases/EnglishQuest_REBORN_PHASE1.html`, unchanged | 108727 | `6A97F8E8E8E800D4BA32728396E6A80C606B839E59C4645F873DE89B8D0D5BC2` |
| Final Phase 2 `EnglishQuest_REBORN.html` | 157714 | `240BF1EE091A4E686E9919B873911B989DDE6A53E1960D898FFFABD1E0509E0D` |

The final browser runner verifies the protected hashes before and after execution. Pre-existing isolated v8, v7 and unrelated localStorage strings remain byte-identical after combat, review, restart and settings. No real browser profile or user save was accessed.

The [final run summary](docs/reborn-phase2/final-run-summary.json) records the actual process exit codes, final artifact hashes and parsed gameplay results. Both browser processes closed after their completed runs.

## Executed checks

| Execution | Result | Evidence |
| --- | --- | --- |
| `node --test tests/*.test.cjs` | **165/165 passed**, 0 failed/skipped, exit **0** | [Unit log](docs/reborn-phase2/unit-tests.log) |
| Chrome **157.0.8103.79**, final bundle, screenshots | Complete offline journey, exit **0** | [Chrome log](docs/reborn-phase2/chrome-final.log) |
| Edge **157.0.4341.60**, final bundle | Complete offline journey, exit **0** | [Edge log](docs/reborn-phase2/edge-final.log) |
| Chrome native music probe, pre-marker build; audio unchanged | Three scene transitions, native waveform and gain automation, exit **0** | [Music log](docs/reborn-phase2/chrome-music.log), [native measurements](docs/reborn-phase2/chrome-native-music.json) |
| Chrome + Edge pre-marker full journeys | Both exit **0**, superseded by corrected final runs | [Chrome](docs/reborn-phase2/chrome-pre-marker.log), [Edge](docs/reborn-phase2/edge-pre-marker.log) |
| Chrome initial integration build | Full journey, exit **0**, superseded by final runs | [Initial log](docs/reborn-phase2/chrome-initial.log) |

The initial build was 156282 bytes, SHA-256 `25914BC51CF51C72473FBB11EA7628C0FFDCBFE7CB975A33BB6E4845BD21FDD8`. It preceded the final explicit boss-start/charge timing and layout refinements.

The 165 tests comprise **94 unchanged original tests, 32 adapted combat tests, 27 new Phase 2 combat tests, and 12 audio/manifest tests**. Intentional changes to earlier expectations include tiered 8/10/16 sword hits, buffered chains, physical delayed magic, the revised boss rotation, a safe explicit boss start, 34 manifest entries, layered effects and a fifth mixer control. Phase 1 behavior is preserved in its archived HTML rather than asserted as the intended behavior of the new combat engine.

Node version: 24.14.0. Both browsers used `file://`, fresh temporary contexts and offline mode. Edge ran outside the Windows sandbox because this environment previously prevented its isolated browser launch; it still used a temporary profile. At most two browsers ran simultaneously. Final runs recorded **no uncaught page errors and no HTTP(S) requests**.

## Actual gameplay path

The runner uses real keyboard presses, mouse controls and native touch events. State is read for the automated actor's strategy; no player/enemy HP, position, cooldown, result, combo or reward is assigned, and it does not call the combat manager's answer/update shortcuts. Deterministic unit fixtures separately test exact timing boundaries.

Both final journeys completed tutorial → entrance movement → slime → four original listening milestones plus the new crystal instruction → sentence discovery → boss introduction → both boss phases → victory. All four boss patterns entered their actual attack state. A deliberate wrong action and wrong sentence order were corrected without HP penalties. Each run completed six expressions, five listening answers and three sentence answers, with two total wrong attempts. **Independent listening remained zero**, because no production recording was heard and text help was used.

| Measured run result | Chrome | Edge |
| --- | ---: | ---: |
| Automated path duration, including capture/layout overhead | 46.977 s | 41.018 s |
| Highest consecutive landed combo | 3 | 3 |
| Dodge activations | 9 | 9 |
| Actual contacts avoided / Perfect Dodges | 3 | 3 |
| Sword core bonuses | 1 | 1 |
| Magic uses / actual projectile hits | 2 / 2 | 2 / 2 |
| Actual damage dealt | 230 | 230 |
| Cumulative damage received | 7 | 7 |

Damage dealt equals the enemies' actual 70 + 160 HP; overkill is not fabricated in the result. The crystal restores health between encounters, so cumulative received damage need not equal missing final HP. Successful dodge counts require an actual enemy contact avoided by the dodge iframe; simply moving away or pressing dodge in empty space does not count.

The actor deliberately waits for attack patterns and uses known answers/state. These durations are **not beginner completion times**. Each browser also let a new player stand in normal enemy attacks until actual defeat, then verified a clean restart. That separate defeat path took 46 seconds in Chrome and 45 seconds in Edge.

## Required 25-category coverage

| # | Requirement | Verified scope |
| ---: | --- | --- |
| 1 | Three-hit combo | Real browser chain reached highest landed combo 3; unit sequence verifies 8/10/16 damage. |
| 2 | Combo timing | Early input rejection, one buffered continuation, generous window expiration, no held-key loop, no infinite finisher buffer. |
| 3 | Hitboxes | Real wrong-facing and out-of-range misses; deterministic horizontal/vertical active-window and airborne checks. |
| 4 | Repeated damage | Each active hit resolves once; whiffs do not inflate highest combo; actual total damage is clamped. |
| 5 | Hit-stop | Deterministic simulation pause accepts a buffer without blocking input/event processing; native frame timings measured separately. |
| 6 | Knockback/bounds | Distinct tier knockback and both arena bounds; real movement stops at the edge. Late airborne finisher recoil updates the predicted landing warning in both directions. |
| 7 | Stagger | Deterministic no-attack stagger, recovery and preserved pattern progress; core interrupt seen in the full journey. |
| 8 | Dodge iframe | Finite 180 ms iframe; collision inside/outside, cooldown, empty-space and ordinary hit-protection cases. |
| 9 | Perfect Dodge | Both browsers time a real jump landing contact within the iframe; one reward per attack; no state fabrication. |
| 10 | Slime AI | Distance-aware deterministic jump/rush, readable telegraphs, recovery, contact damage, defeat. |
| 11 | Boss patterns | Both final browsers observe crystal charge, heavy jump, forward rush and triple bounce attacks. |
| 12 | Boss phases | Actual phase II in browser; exact half-HP and limited timing adjustment in unit cases. |
| 13 | Weakness window | Actual crystal lesson opens one 3.6 s sword bonus; a real hit consumes it once; unit cases cover miss/expiration/interrupt. |
| 14 | Listening | Safe pause, correct/incorrect actions, explicit retry, aid tracking, recorded/unheard denominators and review evidence. |
| 15 | Sentence Magic | Actual wrong/right ordering; resource consumed at charge start, no immediate damage; a bounded projectile is observed and later hits. |
| 16 | Voice manifest | 34 unique utterances, three speakers, normal/optional-slow metadata, paths, honest license/duration/quality status. |
| 17 | Missing voices | Both full paths finish with 0 recordings; no unassisted listening achievement is awarded. |
| 18 | Voice interruption | Stop/replay/channel replacement, stale callbacks after errors/timeouts, rejected playback and optional synthesis exceptions. |
| 19 | Independent audio | Five real controls and native mute/slow/fallback checks; music/SFX/UI duck separately; native music crossfades verified. |
| 20 | Scene cleanup | Main menu/restart remove enemies, projectiles, cast and goals; old handles/callbacks cannot settle a fresh run. |
| 21 | Pause/resume | Real input/HP/enemy freeze and focus-loss release; deterministic projectile pause/resume and buffered-input cleanup. |
| 22 | Victory/defeat | Both actual outcomes and exact result values; terminal-state damage/reward guards. |
| 23 | Restart | Real restart from pause and defeat, complete transient-state reset and fresh progress. |
| 24 | Duplicate rewards | Unique actual-event goals per run; review/replay does not change results. These lab goals are not persistent campaign rewards. |
| 25 | v0.8 compatibility | Original 94 tests pass; original bytes unchanged; both browsers start the original game and enter its 500-item academy offline. Full older campaigns were not replayed again in this phase. |

## Frame-time measurements

The test wraps the game's existing RAF callback. It does not start another simulation or render loop. Only combat/player-hit samples are retained. The interval includes browser scheduling; callback work measures synchronous game/audio/render/UI code and excludes deferred GPU/compositor work. Runs were headless, used automated inputs, and were not a benchmark on representative consumer hardware.

| Metric | Chrome, screenshots enabled | Edge, screenshots omitted |
| --- | ---: | ---: |
| Combat samples | 7385 | 8033 |
| RAF interval p50 / p95 | 4.2 / 8.3 ms | 4.2 / 4.4 ms |
| Maximum interval | 358.4 ms | 41.6 ms |
| Intervals >25 / >50 / >100 ms | 9 / 6 / 6 | 2 / 0 / 0 |
| Callback work p50 / p95 / max | 0.7 / 1.2 / 9.6 ms | 0.7 / 1.2 / 9.2 ms |
| Maximum observed effects / projectiles / active audio sources | 8 / 1 / 14 | 8 / 1 / 14 |

Raw data: [Chrome](docs/reborn-phase2/chrome-frame-times.json), [Edge](docs/reborn-phase2/msedge-frame-times.json). Chrome's capture run included larger scheduling intervals; these samples were not removed. This comparison cannot uniquely attribute every spike to screenshots, and frequent callbacks here are not a claim of equivalent FPS on another device. The simulation's 30/60/120 Hz equivalence is covered separately. Unit stress checks enforce 64 effects, 3 projectiles and 96 active audio sources. Human input-to-photon responsiveness and broad hardware performance remain unmeasured.

## Audio evidence and unfinished voice production

Both browsers decoded an ephemeral generated WAV test tone through native HTMLAudio and the real file-first adapter. `playing` and `ended` occurred at 1× and 0.75×. The tone was never saved as an English asset. Separate slow-recording selection is covered by a test double: a supplied slow take plays at 1×; an absent one uses pitch-preserving 0.75× playback.

All **25 original layered sound cues** rendered through native OfflineAudioContext with finite, nonzero individual outputs. Peaks at maximum configured gain ranged from **0.0912963 to 0.1820039**, without individual-cue clipping. This does not certify every possible simultaneous mix or perceptual sound quality.

A separate native Chrome music test rendered two seconds with real OfflineAudioContext suspensions and scheduler ticks: exploration → combat at 0.400544 s → boss phase II at 1.100045 s. It captured native gain automation, 0.25 s scene crossfades, voice-priority ducking/restoration and **one context**. Output peak was **0.0548853**; exploration/combat/boss windows each had nonzero RMS. This verifies the original procedural score is functional, rather than only a volume control. Full gameplay runs kept music at its default zero; the music test is separate and reproducible with `--music-only`.

The music probe ran on the 156873-byte pre-marker build, SHA-256 `45397F8E5513EA3BA30122543087AF94281E981172DCBBA179FB3817D82D437F`. The final change touched landing prediction and its drawing only; the audio implementation is identical. Final full-browser runs independently repeated native file playback and all individual sound-cue renders.

The 34 scripts and Korean meanings were inspected, including the new crystal, exposure, dodge and combo lines. Rowan, Announcer and Crystal are **planned voice identities, not produced performances**. Every missing recording retains unknown duration/source/reviewer and an explicit pending-quality status. No paid generation or licensed recording is claimed. Physical speakers/headphones, naturalness, pronunciation, emotional delivery and future recording rights require later review. See [human playtest checklist](HUMAN_PLAYTEST_CHECKLIST.md).

## Layout, captures and diagnostic history

Both browsers passed intro/listening/victory layout checks at **1920×1080, 1366×768, 768×1024, 390×844 and 360×800**. Main combat controls fit the laptop viewport; result restart remains visible inside its card at all five sizes. The mobile context uses real touch movement, repeated attack, dodge and pause, with reduced motion. Shake Off/Low/Normal and five volume ranges were exercised. Longer result content scrolls internally.

Final captures include [third-strike pose](docs/reborn-phase2/reborn-finisher.png), [Perfect Dodge](docs/reborn-phase2/reborn-perfect-dodge.png), [exposed core](docs/reborn-phase2/reborn-exposed-core.png), [cast](docs/reborn-phase2/reborn-cast.png), [boss introduction](docs/reborn-phase2/reborn-boss-intro.png), [mobile](docs/reborn-phase2/reborn-mobile.png), [victory](docs/reborn-phase2/reborn-victory.png) and [reviewed expressions](docs/reborn-phase2/reborn-learned.png). Dedicated renderer contact sheets are art fixtures, distinct from these real-game captures. Real captures can show overlapping characters during close-range casting; they are not staged pose arrangements.

One final Chrome attempt reached victory but exited 1 on an expected-wrong-count assertion. A screenshot awaited a finisher landing/opening the left prompt, after which the runner issued J using an outdated COMBAT snapshot and caused an extra wrong answer. This was a **test harness stale-read race**, not a duplicate engine hit or an uncaught game error. The runner now re-reads state after combat captures and before issuing buffered J. Production code was unchanged; the same frozen build then passed the complete Chrome run. The failed evidence is retained in [capture-race log](docs/reborn-phase2/chrome-capture-race.log). Whether real players would benefit from a brief keyboard transition grace is a human-playtest question, not an observed player finding.

A separate production audit found a real warning mismatch: a late third sword strike could leave residual recoil at a heavy-jump landing, shifting actual collision away from its displayed target. The final build predicts that residual displacement without changing physics or damage. A new deterministic test covers both directions, and an actual engine/renderer fixture verified locked target 500 → drawn/landed center 527.5 on the right and 472.5 on the left. The [landing-marker proof](docs/reborn-phase2/landing-marker-proof.png) was visually inspected. Both complete browser journeys were rerun on the corrected final artifact.

## Reproduction and remaining acceptance work

Use Node with Playwright available and installed Chrome/Edge. Run `node --test tests/*.test.cjs`, then `node tests/reborn-browser.cjs --screenshots`; set `REBORN_BROWSER=msedge` for Edge. `--music-only` runs the native three-scene music probe without a campaign journey. `--results-only` retains actual gameplay to victory but skips the separate defeat/audio/settings/touch/original-game tail. All contexts close on completion or failure.

Remaining work is explicit: obtain authorized English recordings; review real audible quality; run external beginner playtests; measure beginner completion time, enjoyment and voluntary replay; and test representative physical devices. Automated reliability and this machine's measurements do not establish those outcomes.
