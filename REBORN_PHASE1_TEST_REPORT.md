# REBORN Phase 1 — verification report

Tested 2026-11-21 on Windows. The isolated combat slice passes its automated rules, offline browser journeys, and audio plumbing checks. **The requested English voice recordings are not delivered: 0/30 files.** File playback support and text access are working, but this is not a completed recorded-voice release.

## Exact builds and baseline

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Original `EnglishQuest.html`, before and after | 794176 | `E0F49C2BB74125F16828C0A1D9F5B448B0FEA1831C6AF9117290668FEDA0CBAD` |
| Final `EnglishQuest_REBORN.html` | 108727 | `6A97F8E8E8E800D4BA32728396E6A80C606B839E59C4645F873DE89B8D0D5BC2` |
| Initial integration build, diagnostic run only | 107720 | `831BC5F9FB62EE4ED7EC1785CC0BCBCD19ACA0DE8D18C8B4AAAF8F4A125C6FC8` |

Before implementation, the branch was `feature/english-quest-reborn-phase1` at `df8ac9f`, with a clean working tree. Existing tests: **94 passed, 0 failed, 0 skipped, process exit 0**. The original renderer, campaign/audio/storage architecture, README and prior test report were inspected. Reborn uses its own entry point and source modules.

## Final executions

| Run | Actual result | Evidence |
| --- | --- | --- |
| `node --test tests/*.test.cjs` | **135/135 passed**, 0 skipped, exit **0** | [Unit log](docs/reborn/unit-tests.log) |
| Chrome **157.0.8103.79**, final bundle | Full offline journey, exit **0** | [Chrome log](docs/reborn/chrome-final.log) |
| Microsoft Edge **157.0.4341.60**, final bundle | Full offline journey, exit **0** | [Edge log](docs/reborn/edge-final.log) |
| Chrome, initial integration build | Full journey, exit **0**; subsequently superseded by final run | [Initial log](docs/reborn/chrome-initial.log) |

The 135 tests comprise 94 existing tests, 32 combat/learning tests and 9 audio/manifest tests. Node version: 24.14.0. Edge initially failed to launch inside the Windows sandbox, before any page loaded; its successful run used an isolated temporary profile outside that sandbox. At most two browsers ran concurrently. No real user browser profile or real saved game was opened or changed.

Both final browsers opened the standalone file through `file://` with the browser context offline. The gameplay runner issued actual keyboard, mouse and touch inputs. It read state to choose actions, but did not set HP, positions, cooldowns, enemy state or learning results, call `answer()` directly, or advance simulation time. Separate deterministic unit tests intentionally set up edge-case fixtures.

Each final journey covered tutorial → walking into slime combat → four listening milestones → word crystal → sentence magic → boss → victory. It deliberately waited for **Heavy Jump, Triple Bounce and Crystal Charge to enter their attack states** before finishing the boss, and observed phase II. It deliberately answered one listening action and one sentence incorrectly, retried, and completed all five taught expressions. Results were 7 correct responses, 2 incorrect responses, 7 assisted correct responses and **0 independent listening responses**. No missing recording was counted as heard.

The input actor completed that path in 35.700 seconds in Chrome and 31.651 seconds in Edge, including automated screenshots/layout checks and deliberate pattern observation. These are fast automated paths with answers known to the runner, not beginner completion times. The 5–10 minute design target remains unmeasured.

## Required test coverage

| # | Category | Evidence and practical scope |
| ---: | --- | --- |
| 1 | Movement | Actual A/D input and held touch movement; deterministic 30/60/120 Hz equivalence. |
| 2 | World boundaries | Actual left-edge stop; deterministic both bounds and opposing inputs. |
| 3 | Attack collision | Real repeated sword hits; unit tests ensure one damage application per swing and airborne hitbox correctness. |
| 4 | Attack range/facing | Browser attacks outside range and facing away do not damage slime; engine checks exact reach. |
| 5 | Attack cooldown | Repeated real attacks work; unit tests enforce anticipation, swing, follow-through and cooldown without duplication. |
| 6 | Dodge cooldown | Real keyboard/touch dodge; deterministic cooldown and bounded movement. |
| 7 | Dodge invulnerability | Deterministic attacks inside and outside the finite iframe window; actual evasive combat in both browsers. |
| 8 | Enemy patterns | Slime jump/rush unit cases; initial Chrome observed both. Final browsers observe all three actual boss attack states. |
| 9 | Enemy/body collision | Browser idle run takes real collision damage; unit cases cover grounded body blocking, dodge crossing and locked targets. |
| 10 | HP bounds | Actual victory HP 0 for boss and defeat HP 0 for player; deterministic clamping. |
| 11 | Player/enemy death | Actual slime death reveals crystal; boss death wins; an idle player dies from normal attacks, without state manipulation. |
| 12 | Boss phase change | Both final browsers reach phase II; deterministic exact half-HP threshold. |
| 13 | Magic charge/cooldown | Browser unlocks and casts repeatedly through normal attacks; deterministic charge consumption/cooldown prevents rapid bypass. |
| 14 | Sentence validation | Actual wrong and correct token orders; malformed/extraneous answers rejected in unit cases. |
| 15 | Listening validation | Actual wrong/right action responses, frozen enemy during prompt, explicit retry, no wrong-answer HP penalty; strict assistance/heard accounting. |
| 16 | Voice replay | Browser retry replays the instruction ID; unit tests reject stale/repeated playback evidence. |
| 17 | Missing audio | Honest missing-file UI, opt-in fallback settings and text assistance; all encounters remain completable. Recordings themselves remain missing. |
| 18 | Input and settings | Real keyboard, mouse choices, touch movement/attack/repeat/dodge/pause; all four native volume ranges, mute, slow, fallback, shake and reduced motion. |
| 19 | Pause | Actual pause freezes enemy position, player position and HP while input is attempted; unit tests include learning and timers. |
| 20 | Restart | Actual restart after pause/victory/defeat resets stage, HP, answers and challenge; unit tests invalidate old handles. |
| 21 | Victory | Actual boss defeat and results in both browsers; deterministic terminal state blocks late damage/rewards. |
| 22 | Rapid/stale input | Repeated touch attacks remain reusable; rapid input on feedback cannot resubmit; unit tests cover held attack and stale challenge/audio callbacks. |
| 23 | Focus loss | Browser-dispatched blur while a real movement key is held pauses and clears it; no drift after resume. OS focus switching was not manually tested. |
| 24 | Existing save preservation | Isolated pre-existing v8/v7 and unrelated localStorage strings remain byte-for-byte identical after full play/restart/settings. Real user storage was never accessed. |
| 25 | v0.8 compatibility | Original HTML hash/size unchanged; original 94 rule tests pass; both browsers start the original game and reach its 500-item academy offline. Full old campaign browser journeys were not repeated in this phase. |

## Audio verification and its limits

Nine automated tests cover gesture gating, independent volume buses, clamp/mute controls, duck/restore, single-channel replacement, explicit fallback, native event accounting, rejected assets, timeouts and stale callbacks. A synchronous speech-service exception found during QA was fixed and is regression-tested. All combat sound event names resolve to one of eleven original procedural cues.

Both real browsers also decoded and played an **ephemeral generated WAV test tone**, via the actual file-first voice adapter and native HTMLAudio. Native `playing` and `ended` events occurred at normal and 0.75 playback rate. This in-memory tone was never saved to the voice asset directory and is not an English recording. Separately, each of eleven effects was rendered by native OfflineAudioContext: peak magnitudes ranged from **0.1089518 to 0.2498250** at maximum configured volume, with no clipping. These are signal/API checks, not speaker listening or production sound-quality evaluation.

The production manifest contains 30 unique English/Korean scripts, safe local paths and explicit missing-license status for the absent assets. No paid generation, recording or unlicensed voice redistribution was represented as completed. Actual pronunciation, timbre, accent, pacing, intelligibility, licensing of future recordings, and real speaker output still need validation once authorized recordings exist. Headless browser runs do not establish audible quality. Optional installed local browser synthesis is labeled separately and is not a substitute for the requested recorded voices.

## Visual inspection and fixes

Intro, listening and victory layouts passed horizontal overflow/control clipping checks at **1920×1080, 1366×768, 768×1024, 390×844 and 360×800** in both browsers. Real touch checks used a 390×844 mobile context with reduced motion. The initial laptop layout placed combat controls below the arena viewport; the final responsive canvas sizing now keeps the main combat controls visible at 1366×768, and the browser runner asserts that condition.

Reviewed captures include [title](docs/reborn/reborn-title.png), [slime](docs/reborn/reborn-slime.png), [listening](docs/reborn/reborn-listening.png), [mobile](docs/reborn/reborn-mobile.png), [sentence magic](docs/reborn/reborn-magic.png), [boss](docs/reborn/reborn-boss.png), [crystal charge](docs/reborn/reborn-crystal-charge.png), [victory](docs/reborn/reborn-victory.png), [practiced expressions](docs/reborn/reborn-learned.png) and [defeat](docs/reborn/reborn-defeat.png). UI text and mobile choices are readable. Long laptop result cards scroll internally. The initial low-positioned restart button was moved above the statistics; the final runner verifies it is fully visible inside the card at all five sizes. Results expose all five actually practiced expressions and separate listening correct/retry counts, verified through the real details control.

Other QA findings fixed before the final runs: keyboard/mouse action latch prevented repeated attacks; UI help IDs did not match learning assistance; snake-case sound names lacked mixer aliases; retry replay selected feedback rather than the current instruction. The final runs exercise those corrected integrations. No final uncaught page errors or HTTP(S) requests were recorded.

## Reproduction

Use Node with Playwright resolvable through the environment's module installation and installed Chrome/Edge. Run `node --test tests/*.test.cjs`, then `node tests/reborn-browser.cjs --screenshots`. Set `REBORN_BROWSER=msedge` for Edge (omit `--screenshots` to retain the canonical Chrome captures). Tests use temporary browser contexts and close them on success or failure.

Outstanding acceptance work: licensed English voice assets and physical listening review, beginner playtesting/time measurement, and human evaluation of enjoyment and replay motivation. See [gameplay review](REBORN_PHASE1_GAMEPLAY_REVIEW.md).
