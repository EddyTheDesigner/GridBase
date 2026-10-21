# GridBase 1.2 verification — EffectCraft 0.11.1

Measured on the user's installed desktop app on 2026-10-20. These are observations for the 12-layer demo, not guarantees for arbitrary projects.

## Correctness

- 630 existing engine assertions, separate-process save/reopen (8 members), and 51 additional feature assertions passed.
- Migration matched 624 sampled animation components, including the user's radial-to-rectangle animation.
- Actual desktop input passed Ctrl/Shift selection, All/Clear, exact slot swapping, bulk replacement from one outside source, source preservation, manual numeric entry, numeric dragging, and single-step Undo for GridBase gestures.
- Final checks passed edge scrolling to an offscreen slot, value synchronization on panel interaction, reopening the settings dialog, reset numeric controls, and single-step Undo for reset.
- Native Effect Controls numeric entry and dragging update the grid without Refresh.

## Interaction stability

A fresh desktop process completed four runs of 200 timeline selection clicks each (800 total) while stepping frames. Every cycle verified selections of 1, 2, and 12 layers. No crash or timeout occurred.

| Run | Median click round trip | Maximum | Working set before → after |
| --- | ---: | ---: | ---: |
| Fresh range | 54 ms | 324 ms | 821,980 → 1,138,240 KB |
| Second range | 40 ms | 318 ms | 1,202,044 → 1,391,144 KB |
| Restored values, cache warming | 57 ms | 316 ms | 1,490,604 → 1,670,876 KB |
| Same unchanged frame range | 58 ms | 318 ms | 1,672,180 → 1,672,220 KB |

Working set grew while new frames were cached, then stayed effectively flat (+40 KB) when revisiting the unchanged range. This is a bounded stability test, not proof that no host memory issue can occur.

## Rendering tradeoff

Five uncached half-size frames per sample:

| Demo time/layout | Lean 1.1 | Native controls 1.2 |
| --- | ---: | ---: |
| 0 s, radial | 14.81 ms | 38.08 ms |
| 1 s, morph | 15.74 ms | 40.43 ms |
| 2 s, rectangle | 15.67 ms | 42.29 ms |

Live native controls cost more than 1.1's lean static expressions. They remain much cheaper than the original implementation's approximately 437–462 ms measurements. Batched expression reads avoid resolving each independent nested property through a separate replay. No background expression recompilation is required.

## Host limitations

- EffectCraft's native scrub gesture created 8 Undo steps in the tested drag. GridBase panel scrubs and layer operations use one step.
- Generic native Reset does not reset a preset-defined nested tree. Use Name & presets → Reset numeric controls.
- The installed desktop build exposes scheduleTask but repeating tasks did not execute, including an isolated counter probe. Final GridBase uses no timer. Panel values refresh on pointer movement (throttled to 750 ms); grid expressions themselves remain live independently of the panel. Edge scrolling advances with pointer movement.
- The adapter uses EffectCraft 0.11 expression-host property addressing. Future host releases need compatibility verification.

Published verification output: [results.txt](results.txt), [features-v12-results.txt](features-v12-results.txt), and [migration-v12-results.txt](migration-v12-results.txt). Detailed desktop logs remain local.
