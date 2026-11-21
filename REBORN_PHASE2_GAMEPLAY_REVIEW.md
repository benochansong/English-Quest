# REBORN Phase 2 — gameplay review

Reviewed 2026-11-21 on the final 157714-byte bundle, SHA-256 `240BF1EE091A4E686E9919B873911B989DDE6A53E1960D898FFFABD1E0509E0D`.

Evidence comprises real-input Chrome/Edge journeys, inspected captures, deterministic tests and measured production RAF callbacks. **No external player has been observed.** This report evaluates implemented behavior and likely design risks, not human enjoyment. Production English recordings remain **0/34**, and no physical speaker listening was performed.

## Combat responsiveness

Repeated J presses now form a three-hit chain, with one buffered continuation during an active strike and a 650 ms continuation window after recovery. Holding J does not create a loop. Both browser actors landed all three strikes; highest-combo statistics count actual hits rather than three animations. Acceleration, braking and reversal are consistent in 30/60/120 Hz rule tests. Pointer actions now begin on press, and keyboard aliases release independently. These are concrete control improvements over Phase 1, but human input-to-photon feel has not been measured.

## Sword impact satisfaction

The sequence changes damage from 8 to 10 to 16, enlarges reach, strengthens knockback and uses distinct swing/impact cues. Contact hit-stop is 50/60/90 ms across the three tiers; it pauses simulation without blocking the browser. Active hit windows, upward/reaching motion, damage numbers and original layered sounds now correspond to actual contact. A whiff generates no fabricated impact damage, and overkill numbers are clamped. Finisher contact sheets show distinct poses, while real-game captures show the sequence in context. Whether the hit feels satisfying still needs a player and audible review.

## Dodge responsiveness

The 180 ms iframe and 650 ms cooldown remain predictable. A Perfect Dodge requires actual enemy contact during that iframe; the browser actor earned it by waiting at a jump target and pressing K shortly before landing. Each final run recorded three successful contacts avoided, out of nine dodge activations. The blue cue, charge reward and goal provide observable feedback. Dodging out of danger without a collision does not increment this counter, so human testing should check whether the label matches player expectations. The mechanic remains optional for winning.

## Enemy attack readability

Slime selection now responds deterministically to spacing instead of only repeating one fixed interval. Telegraphs still lock their target, and stagger pauses attacks while preserving the surrounding pattern. The boss has heavy jump, forward rush, crystal charge and a warned triple-bounce sequence in phase II. Both final browser runs observed every attack type. A late audit corrected a real mismatch between airborne knockback and the landing marker: it now predicts remaining recoil and matches the eventual collision center in both directions. Warning circles and visible core exposure make the rules inspectable; color-vision accessibility and first-attempt comprehension have not been established by that observation alone.

## Boss excitement

The concise introduction now waits for an explicit ready action, giving a beginner time to read the crystal instruction. Its upper-left banner leaves the crown and silhouette visible. Crystal charge creates a safe language opportunity, then a finite 3.6-second window for one 1.5× sword hit and an interrupt. Both actors used that opening exactly once. Phase II combines patterns rather than simply doubling all damage. These changes create more decisions than the Phase 1 health race; they do not prove that a player finds the boss exciting.

## Visual clarity

The forest, differentiated combo arcs, grounded shadows, blue dodge feedback, runes and physical fire projectile make important actions visually distinct. Final layouts keep combat controls visible on a 1366×768 laptop. A phone layout places long learning panels below the arena while combat is paused; choices remain readable. Results place replay/practice/menu before their scrollable metrics and review. The hero is still small on a narrow phone, and the amount of result content can require scrolling. Real-device and low-vision testing are still needed.

## English voice quality

**Not evaluable as a delivered voice experience.** The manifest now has 34 distinct scripts, three planned speakers, normal/optional-slow paths, licensing fields and explicit pending review. There are no production recordings. Real browsers decoded an ephemeral WAV tone; this establishes playback events and rate support only. Optional local browser synthesis is labeled synthetic and is not a substitute for the requested natural performances. Obtain authorized voices before making claims about pronunciation, character identity, warmth or intelligibility.

## English listening usefulness

The new “Attack the crystal!” instruction opens a real collision bonus rather than only displaying a congratulatory message. The six taught phrases connect movement, warning, attack, magic and the exposed core. The core prompt pauses danger, and Korean explanation clarifies the target. Five listening answers were completed in each final run, but all were text-assisted/unheard and independent listening remained zero. This demonstrates fair accessibility and accurate accounting; it does not demonstrate auditory comprehension or retention.

## Learning interruption frequency

Ordinary movement and sword combinations remain free of quizzes. The actual path had five listening prompts, one sentence discovery and two later spell solutions: eight successful submissions, plus two deliberate wrong attempts. Magic now gathers runes for 0.5 seconds, releases a physical projectile and damages only on impact; the resource/cooldown is consumed once at charge start. The short paid charge safely pauses hostile AI, then action resumes. Repeating the same “I need fire.” ordering still adds a recurring interruption after the phrase is already understood.

## Replay motivation

Results now show actual received damage, dodge activations and successes, highest landed combo, magic use and weak-core hits. Review entries reflect real wrong/help/text evidence. Goals are awarded once per temporary run, and reviewing expressions cannot farm them or alter campaign currency. Replay, expression practice and main menu all work through real controls. This gives execution improvement a clearer target than Phase 1, but the encounter route and taught language remain fixed. There is no observed evidence yet that a human voluntarily chooses another attempt.

## Measured observations

The final automated paths took **46.977 seconds in Chrome** and **41.018 seconds in Edge**, including deliberate pattern observation and test overhead. The actor knows answers and reads combat state, so these are not beginner times. Both landed a three-hit chain, one core bonus and two physical magic impacts; total dealt damage was the actual 230 enemy HP. Each received 7 cumulative damage, with health restored at the crystal.

Production RAF samples had interval p95 **8.3/4.4 ms** and synchronous callback-work p95 **1.2/1.2 ms**. Chrome also had six intervals over 100 ms in its screenshot run, including a 358.4 ms maximum; Edge had none over 50 ms. These headless scheduling samples, with different capture overhead, do not certify 60 FPS on ordinary hardware or physical input latency. No second simulation loop was introduced for measurement.

Original procedural music has three functional scene states and native gain crossfades; a separate native render verified finite nonzero output and duck/restore in one context. Full gameplay tests kept music at its default zero. Individual effects also rendered without clipping. None of these checks substitutes for listening to the mix.

## What Still Feels Boring?

- **The encounter is still one fixed route.** Combo, dodge and core exploitation add execution goals, but discovery diminishes after one successful run. Test whether the existing result goals motivate voluntary replay before adding more menus or content.
- **The same spell sentence repeats.** The projectile makes the consequence clearer, yet assembling an already-known three-word sentence before every cast may still feel like a toll. Ask beginners where repetition helps and where it interrupts them; avoid assuming that visual effects alone solve it.
- **The intended companion voices are absent.** More manifest fields cannot replace the emotional and educational value of a clear performance. Voice production and real listening review remain the largest missing part of the intended experience.
- **The ideal actor clears it quickly.** It would be misleading to inflate HP or add waiting solely to make an automation take five minutes. Measure real beginner learning, mistakes and recovery before tuning duration or difficulty.
- **Counter labels need human interpretation checks.** Successful/Perfect Dodge credit is tied to an actual collision inside the iframe. A player who dashes completely outside danger may reasonably believe they succeeded even when that metric does not increase. Test the wording before changing the rule.
- **Transition input deserves observation, not an invented defect claim.** One QA capture delayed the actor's next key until a listening prompt had opened, producing an unintended answer. Refreshing the harness's state resolved it without a production change. Observe whether real combo mashers experience a similar surprise before considering a short keyboard grace on prompt entry.

Focused next steps are authorized voice production, a short observed beginner session, and a decision about repeated magic checks based on that session. The [human playtest checklist](HUMAN_PLAYTEST_CHECKLIST.md) is prepared with actual results marked **Pending**. Do not describe the slice as exciting or the voice as natural until player/listening evidence supports those claims.
