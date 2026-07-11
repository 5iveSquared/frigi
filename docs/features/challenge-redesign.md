---
status: complete
priority: p1
tags: [backend, mobile, game-design, generator, scoring]
last_updated: 2026-07-08
---

# Challenge Redesign — Why Levels Felt Flat and How Generation Works Now

Related: [[frigi]], `backend/app/services/carve_generator.py`,
`backend/app/services/pack_solver.py`, `backend/app/services/progression_model.py`,
`mobile/src/engine/scoring.ts`, `mobile/src/engine/constraints.ts`

## Original diagnosis (all fixed)

The game felt flat because there was no puzzle and no scoring pressure:

1. **Constraint points were free** — `calculateScore` summed constraint points
   unconditionally; satisfaction was never checked, and the only constraints
   generated restated zone requirements that placement already enforced.
2. **The score was a constant per level** — submit required placing every item,
   so the efficiency component was fixed at generation time. Only time/moves
   varied → a drag-and-drop speed test.
3. **Levels always had huge slack** — fill capped at 0.70 with tiny 1–4-cell
   pieces; greedy placement always worked first try.
4. **The fridge topology never changed** — same zone layout every level.
5. **Difficulty scaled quantity, not search complexity** — nothing measured how
   hard a level actually was.
6. **No decisions, no fail state.**

## Design principle

**Generate backwards from a solved pack, measure difficulty with a solver,
and score decisions the player actually makes.**

## Phase 1 — Real scoring ✅

- [x] **Constraints are evaluated at submit** on both sides with identical
      semantics: `mobile/src/engine/constraints.ts` mirrors
      `backend/app/services/constraint_engine.py`. Four checkable types:
      `zone` (item fully in zone), `adjacency` (together/apart),
      `exclusion` (keep N zone cells free), `count` (max N items in zone).
      Live goal badges show on the game screen; results show a ✓/✗ checklist.
- [x] **Decoy items + submit anytime.** Levels above L7 carry more items than
      fit; the score is `packed item points × 10`, so choosing the best subset
      is the strategy layer. Submit unlocks after the first placement.
- [x] **Expanded item catalog** (`backend/app/content/item_catalog.py`):
      turkey, pizza box, watermelon, cake, lasagna, soda crate, ice cream,
      fish sticks — large/awkward shapes used as decoys.
- [x] **Stars vs an honest par.** `optimal_score` = solution packing points +
      all constraint points + par time/move bonuses. A verified perfect run
      scores 1.03–1.06× par; thresholds stay 0.80 / 0.92.
- [x] **Server-side score parity + anti-forge**: `scoring_service` validates
      every reported placement (real item, real rotation, in bounds, zone ok,
      no overlap/blocked cells) and recomputes packing + constraints from the
      level definition, ignoring client-reported points.

## Phase 2 — Carve generation + solver validation ✅

`backend/app/services/carve_generator.py`:

1. Pick grid size + one of 4 zone topologies (classic, side freezer,
   bottom drawer, top freezer) — the fridge finally varies.
2. Block cells with leftovers (🥡, rendered dark, unplaceable).
3. Reserve slack cells (≈38% of packable at easy → 0 at exact-cover levels).
4. Partition the rest into polyomino pieces (snake-growth probability and
   min/max piece size scale with difficulty) — the partition IS the solution,
   so every level is tight and solvable by construction.
5. Zone-lock pieces that sit fully inside a special zone; map pieces to foods
   from zone-appropriate name pools; add decoys whose area exceeds the slack
   (so a full pack + decoy is impossible and par stays exact).
6. Emit constraints derived from the known solution — always satisfiable.

`backend/app/services/pack_solver.py`: bitmask DFS with
most-constrained-item-first ordering; counts deduped solutions (interchangeable
same-shape items collapse) and backtracks. `measured_difficulty` blends
tightness, solution scarcity, search effort, zone locks, decoys, constraints
into 0–1. The generator retries up to 8 sub-seeds until measured lands within
±0.06 of target and keeps the closest attempt.

The progression curve in `progression_model.py` was **recalibrated onto the
measured scale** (L1 0.26 → L20 0.85 max). `game_master.py` gates every seed:
solvable, unique signature, monotonic difficulty, measured-vs-target ≤ 0.15
(error) / 0.08 (warning). Current audit: 50 levels, 0 errors, avg gap 0.036.

## Phase 3 — Mechanic schedule ✅

`progression_model.mechanics_for_level`:

- L1–3: pure packing, generous slack
- L4: blocked cells appear (1 → 2 at L8 → 4 bigger clusters at L13)
- L7: first decoy (2 from L12)
- L10: constraints (1, then 2 from L15)
- L16+: every 3rd level is exact cover (zero slack)
- Daily: carve at 0.62 difficulty with 2 blocked, 2 decoys, 2 constraints

Note: "pre-placed items you cannot move" from the original plan is realised as
the larger blocked-leftover clusters at L13+ rather than a separate system.

## Operational notes

- **Existing DB seeds are stale.** Run
  `cd backend && PYTHONPATH=. .venv/bin/python scripts/seed_campaign_levels.py`
  (with prod env) to upsert `campaign-seed-01…50` with carved levels.
- The GPT-4o structural generation path was removed from the level flow;
  `app/mcp/` remains but is unused. AI should never be the difficulty source.
- `Cell.blocked` was added to shared types; old clients treat blocked cells as
  plain occupied cells (`occupied` is also set), so payloads stay compatible.
- Known pre-existing failure: `tests/test_sessions.py` expects 403 vs 401 —
  tied to in-flight auth changes on main, unrelated to this work.
