# REBORN Phase 1 — gameplay review

Reviewed 2026-11-21 against the final 108727-byte build, SHA-256 `6A97F8E8E8E800D4BA32728396E6A80C606B839E59C4645F873DE89B8D0D5BC2`.

This review combines real-input browser playthroughs, inspected screenshots, rule tests and source timing measurements. It is an agent evaluation, not a beginner user study or a claim that a human found the game fun. No physical speaker listening was performed. The recorded-English component is still missing (0/30 assets).

## Combat responsiveness

Movement, facing, sword and dodge respond through actual keyboard and touch inputs. The early action-latch defect was fixed: repeated attacks now work after release, rather than becoming unavailable after the first press. Simulated movement stays consistent at 30/60/120 updates per second. Sword anticipation is 65 ms and its cooldown is 350 ms; browser interactions confirm the resulting sequence, but input-to-photon latency has not been measured with hardware.

## Sword impact satisfaction

Swings have anticipation, a visible arc, follow-through, impact effects, damage numbers, recoil and a procedural cue. Correct facing and reach matter; a sword pointed away from a nearby slime misses. The boss cannot be struck above the sword's real vertical reach. These are useful ingredients for impact, but satisfaction itself needs a human playtest. The cue palette is compact and synthesized, so repeated hits may become sonically uniform.

## Dodge responsiveness

Dodge travels in the facing direction, has a 300 ms motion window, 180 ms invulnerability and 650 ms cooldown. The tests distinguish a successful timed dodge from contact after its iframe window. Touch dodge works after repeated attacks. Facing is therefore consequential; a beginner can dodge toward danger if they turn the wrong way, so the tutorial's direction explanation is valuable.

## Enemy attack readability

Slime compresses before jumping or rushing. The boss uses distinct heavy jump, three warned bounces, and crystal charge. Ground targets are locked during telegraph, giving movement a clear purpose. The final browser actor deliberately waited until all three boss patterns entered attack state. The visible charge ring and landing markings support that rule. Human peripheral readability, color-vision accessibility and first-attempt comprehension remain unmeasured.

## Boss excitement

The crown, greater scale, crystal and phase-II status distinguish the champion from the first slime. The half-health phase changes telegraph speed modestly rather than introducing an opaque surprise. However, optimal play can kill it before every pattern is seen: the initial fast run saw only two patterns, so the final verification deliberately delayed attacking to see the third. This is a concrete risk for encounter variety, not evidence that the boss is exciting to a player.

## Visual clarity

The illustrated forest, grounded characters and bright crystal give the scene a coherent setting. Mobile choices remain readable, and reduced motion is available. The initial laptop controls were below the visible fight; this was fixed with viewport-aware canvas sizing. Main controls now fit alongside the arena at 1366×768. Longer result panels still require internal scrolling, but restart was moved to the top and remains fully visible at all five tested sizes. Small character scale on a narrow phone is a tradeoff worth testing on a real device.

## English voice quality

**Blocked by absent recordings.** There are 30 authored manifest entries and a file-first adapter, but no production English voice files. Real browsers played an in-memory WAV test tone at normal/slow speed; that proves codec/event plumbing only. It does not establish pronunciation, naturalness or intelligibility. Optional local browser synthesis is visibly labeled as synthetic and is never presented as a delivered recording. The requested high-quality voice experience cannot yet be evaluated.

## English listening usefulness

The five taught phrases have direct situational meaning: move left, watch out/dodge, attack the slime, use magic, and “I need fire.” “Watch out!” is explained as a warning whose useful response here is dodging, not a literal dictionary equivalence. A correct action grants a brief safe opening and charge; sentence magic causes a visible fire effect and damage. This makes the language relevant to combat. In the actual no-recording runs, all answers were assisted/unheard and independent listening stayed at zero. Learning effectiveness and retention have not been demonstrated.

## Learning interruption frequency

Normal movement and sword strikes do not open quizzes. Four fixed listening milestones pause danger, and the crystal teaches one sentence before the boss. Each later Fire Burst asks for that same three-word sentence again. The verified path had seven successful language submissions (four listening, three magic) and two deliberately wrong attempts. Wrong answers cost no HP and require an explicit retry. This is gentle, but repeated identical spell assembly may interrupt combat once the sentence is already understood.

## Replay motivation

Restart is immediate, resets the temporary run, and preserves the original campaign. Results distinguish correct, retry, assisted and independent listening counts. Replay can support cleaner dodges or less assistance, but the slice has one fixed route, one basic enemy and one boss, with the same language prompts every time. There is no observed long-term progression or varied objective within this isolated lab. Human desire to replay remains untested.

## What Still Feels Boring?

- **The route is short and deterministic.** Final automated combat paths took 35.700 seconds in Chrome and 31.651 seconds in Edge, despite deliberately waiting for all boss patterns. The actor already knew answers and read state, so these are not beginner times; nevertheless, simply padding HP or adding waits would not solve repetition. Have beginners play once before tuning toward the 5–10 minute target.
- **The boss's third pattern can be missed by efficient play.** Consider a focused encounter sequence or clearer reason to observe/react to each pattern before expanding content. Avoid extending every fight through excess HP alone.
- **One spell uses the same sentence repeatedly.** Once “I need fire.” is understood, repeated tile ordering may feel like a toll on using magic. A later design pass could test less frequent checks or a small meaningful choice of already-taught spells; that is a recommendation, not implemented Phase 2 work.
- **The main intended listening reward is silent without recordings.** Deliver and listen to the authorized voices before judging the central experience. A technically correct missing-file message cannot replace the emotional and educational value of a clear companion voice.
- **Replay offers execution improvement rather than discovery.** Test whether players voluntarily retry for fewer hits or less help. If they do not, add one clear replay goal before adding broad menus or more worksheet-style content.

The next acceptance step should be a short observed beginner session with real audio: record completion time, damage/deaths, misunderstood telegraphs, assistance/replay use, and whether the player chooses a second attempt. The current automation establishes reliability; it does not establish fun.
