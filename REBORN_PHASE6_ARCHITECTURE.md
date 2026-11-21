# Phase 6 integration boundaries

## Reused engines and source ownership

`build-integrated.mjs` reads the verified original campaign HTML, Phase 5 voice manifest embedded in the standalone artifact, and existing modular REBORN sources. It emits only `EnglishQuest_REBORN_INTEGRATED.html`. Original campaign code executes inside one lexical closure with a scoped storage facade. Adapter hooks extend existing screens and dispatch; the original engine/source and both original artifacts are unchanged.

The same offline document creates a temporary `srcdoc` combat iframe for one encounter. This isolates existing global symbols/styles and keyboard targets without a second application save. The 36 voice data URLs exist once in the parent manifest and are shared with the child. No server, external request, service worker, domain, credential, or paid API is used.

## Bridge state and authority

`CampaignCombatBridge` owns private per-run handles, generated run IDs, eligibility and checkpoint validation. Entry is Chapter 1 forest MAP with a started profile and accepted quest. Its encounter definition carries enemy, objective whitelist, location and quest metadata. Results come from the child's engine snapshot, never visible victory text. Enemy kind, max HP, terminal state, total damage and run identity must match. The processed ledger and cleared private handle reject duplicate/stale completion.

Quest states: `new → accepted → ready → complete`. Ready requires victory plus at least one successful **actual** language action. Safe introductory quiz answers alone do not qualify. Assistance is permitted; independent credit additionally requires heard=true and no assistance. Acknowledgment adds a boolean, not gold/XP/items. Replaying completed training cannot repeat recognition. Failed-frame abort, cancel, defeat and reload cannot grant completion. Defeat retry restores the last committed learning memory, clearing attempt evidence.

## Save isolation and atomicity

`IntegratedStore` holds one versioned envelope (`format=EnglishQuestIntegrated`, version 1): unchanged-format v8 profile plus integration extension. Scoped campaign key `EnglishQuest.v8` maps into that profile; all staging/recovery/legacy accesses are namespaced under `EnglishQuest.integrated.aux.v1.`. Native original keys are untouched. No automatic import occurs.

Every write checks the previous raw value, increments revision, verifies readback and restores prior bytes on failure where storage permits. Conflicting tabs must reload. Unknown/corrupt envelopes are retained with writes locked. Result commit failure keeps the run retryable. Existing Backup validation and explicit confirmation are reused for v0.8 JSON imports in a store transaction; successful import resets integration extension. Integrated backups retain profile and extension but reject an unresolved active battle. Full original backup validators remain in the campaign. Browser profile clearing is outside application control; download backups before moving a file or browser.

## Learning evidence

Mappings are `left/VO_MOVE_LEFT`, `dodge/VO_WATCH_OUT`, `fire/VO_NEED_FIRE`; all campaign IDs intentionally null. No fuzzy semantic match or Academy mastery mutation. Successful and unsuccessful actual opportunities come from engine flow outcomes, deduplicated by run + opportunity ID. Presentation/audio/action-assistance counters are separate bounded child adapter evidence. Explicit review receives a count only after local recorded audio ends, not from clicking play. Persistence and display do not call Academy grading or schedule APIs.

## Lifecycle

Entry stops campaign voice and microphone sessions, unmounts exploration, clears pending campaign timer, hides/inerts the campaign shell and suspends parent AudioContexts. The active frame owns gameplay keys and the single REBORN RAF. Parent key capture prevents Escape opening campaign settings behind the battle. Child teardown releases held inputs, stops voice and oscillator buses, cancels tracked RAF IDs, closes child AudioContexts and removes the frame. Return resumes parent contexts and restores the original map selection. New frame per entry prevents accumulated handlers. Original campaign ambient effects are procedural; no claim of a new campaign music engine.

Integration adapters: `integrated-store.js`, `campaign-combat-bridge.js`, `integrated-lifecycle.js`, `integrated-campaign.js`, `integrated-combat.js`, `integrated.css`. Automated tests distinguish pure persistence failures/authority validation from actual browser input routes. This is one optional forest training slice, not a general replacement for every encounter.
