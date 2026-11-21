# Phase 7 architecture and evidence boundaries

Baseline: Phase 6 commit `dbeb47fb8dbae3cfa91a61b5af7957079653397d`, Draft PR #13, 232 passing tests and full Chrome/Edge bridge routes. Original campaign and Phase 5 standalone artifacts stay unchanged; the integrated artifact is updated. Previous integrated release is preserved on its dedicated branch and an ignored local baseline snapshot.

## Quest state and interaction

`living-language-data.js` declares 3 connected quests, 25 new voiced lines, location references and objects with unique IDs, current-location range, quest ID, objective, animation and completion rule. `living-language-engine.js` is pure state logic; `living-language-ui.js` adapts existing screens, dispatch, NPC art, village scenery and `ExploreArt` forest/ruins backgrounds. Existing exploration landmarks (`f-north`, `f-stone`, `f-bridge`, `f-river`) identify the locations. This uses explicit location selection, not a new continuous movement engine; objects can only be collected at the current selected location.

Clara: intro → collect four distinct items in any order → return and deliver. Elena: intro → straight → chosen left/right route → cross → find traveler → conversation → escort return. Rowan: intro → find ruins → blue crystal → combat → report. The three mechanics differ; contextual dialogue choices are limited to conversation rather than replacing physical collection/navigation/combat.

Each active quest has a monotonic run ID, bounded state, temporary inventory, route choice, per-stage evidence and a baseline for per-run result deltas. Wrong events cannot move the player or advance the stage. Duplicate item collection, old quest IDs, out-of-location objects and stale audio are rejected. Completion history is capped at 30; recognition is one-time per quest. No new gold/XP/item economy or competing level system is added.

## Curriculum mapping

`REBORN_PHASE7_CURRICULUM_MAP.json` selects 30 original activities from 15 expressions in the unchanged 500-activity, 151-expression, 12-unit curriculum. Each row includes activity ID, expression ID, exact expression English/Korean, original activity English, objective, quest, interaction, exact-text voice match where available, supported evidence and the relationship to original grading. Runtime and tests validate IDs/text/membership. Punctuation or meaning similarity is not used to invent an exact recording match.

These are contextual practice/review mappings. Quest actions are not equivalent to answering every mapped Academy task. The optional review button invokes the existing `Academy.startExact` flow; only that flow grades an original activity. Quest evidence stays in a separate versioned extension and never fabricates Academy mastery or schedule changes.

## Audio and learning authority

The original 36-entry voice manifest remains unchanged. `REBORN_PHASE7_VOICE_MANIFEST.json` adds 25 recorded assets and provenance. The existing Piper generator now accepts an explicit root-level manifest argument; its default behavior is preserved. Same reviewed model/config hashes, no network generation, no paid service. Build verifies new asset hashes and redistribution metadata, embeds all 61 voices once, and filters the child combat manifest back to its original 36 lines.

Quest audio start records playback. Only the **ended** event for the exact active run, stage, expected voice ID and recorded source marks the instruction heard for independent credit. An interrupted, unrelated, missing or failed clip cannot do so. Text, translation and wrong attempts persist separately. Success requires the real stage action and no prior assistance/wrong attempt for independent classification. Two distinct independent opportunities permit Familiar; repeated play does not. Combat retains the existing Phase 5 cue/outcome semantics and is reported separately.

One NPC voice channel stops old audio before speaking, ducks its mixer, restores levels and cancels on scene change/settings/blur. Failure automatically exposes text. No microphone is required. Human voice quality remains unapproved.

## Save and combat bridge

The same isolated envelope gains `extension.adventure.version=1` lazily and during confirmed Phase 6 backup import. Existing profile bytes remain untouched by migration. Future/invalid quest schemas, malformed histories/inventories and impossible completion order are rejected with prior raw data preserved. Original v0.8 keys remain inaccessible to the scoped storage facade. Atomic verified writes, cross-tab conflict detection and rollback continue from Phase 6.

`CampaignCombatBridge` adds an allowlisted `crystal-disturbance` definition using the verified Slime. Entry requires an active Rowan quest at combat stage in ruins. It binds both combat run and quest run, and stores the original chapter, map selection and `LANGUAGE_WORLD/ruins` checkpoint. Only authoritative terminal combat state plus an actual successful English outcome advances to reporting. Cancel, defeat and reload retain investigation state. Stale results cannot complete a replacement quest.

Campaign-to-combat still stops speech/microphone, inerts parent controls, suspends parent AudioContexts and creates one temporary frame. Teardown releases held input, cancels child RAF, closes contexts and removes the frame. Outside combat, the quest UI has no continuous gameplay RAF. Returning to original continuous exploration uses its existing lifecycle and saved coordinates.

## Packaging and intentional limits

`build-integrated.mjs` emits one offline HTML. No server, domain, API key, remote image, streaming audio or account. Original builds are not regenerated. Quest duration and beginner experience are targets pending actual human testing. Higher-tier enemies and free movement are intentionally not newly integrated. Automated tests cover state rules, content references, voice provenance, real UI routes, recovery, assistance and compatibility; they do not certify enjoyment, pronunciation or long-term retention.
