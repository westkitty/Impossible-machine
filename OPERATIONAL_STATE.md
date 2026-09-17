# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 6,
  "last_updated": "2026-09-17T22:15:00Z",
  "current_baseline": {
    "identity": "main 4e34f00c320533c124cf1cbdd86eb572d35939c1 deployed; active branch upgrade/threejs-archive-state with ARCHIVE code verified at e265c55bc3ceb8885e5279fa2a14873325aaeb68",
    "state": "partially-verified",
    "last_verified": "main QA 35280484758; Pages 35280484823; ARCHIVE branch QA 35280838761"
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

`main` at `4e34f00c320533c124cf1cbdd86eb572d35939c1` contains the production-safe Three.js runtime plus state-driven DEIMOS, CHRONOSTAT, and ATLAS checkpoints. GitHub Actions QA run `35280484758` and Pages deployment `35280484823` both completed successfully on that exact SHA.

Active branch `upgrade/threejs-archive-state` adds the fourth canonical-state-driven machine, ARCHIVE. Its physical-code head `e265c55bc3ceb8885e5279fa2a14873325aaeb68` passed the complete CI gate in run `35280838761` before documentation/state promotion.

## 3. Artifact Contract

Preserve the existing mystery, room traversal, state persistence, archive, notebook, endings, and machine puzzle controls. Three.js is a physical projection layer over canonical gameplay state, not a replacement puzzle engine. Semantic DOM controls remain usable when Three.js or WebGL is unavailable.

## 4. Active Invariants

### INV-001 — Preserve existing game behavior
- **State:** `verified`
- Three.js work must not replace or alter existing puzzle/state/navigation behavior unless explicitly required.
- Evidence: post-merge `main` QA `35280484758`; ARCHIVE branch QA `35280838761`.
- Recheck on any gameplay/controller/state/navigation change.

### INV-002 — Canonical state remains outside Three.js
- **State:** `partially-verified`
- Three.js transforms, materials, animation state, scene-local flags, and raycast state may not become sole authority for puzzle progress, saves, discoveries, gates, or endings.
- DEIMOS, CHRONOSTAT, ATLAS, and ARCHIVE use immutable read-only projectors in `src/three/machine-state.js` with focused projection tests.
- Recheck on every new state-driven 3D integration or future 3D-to-gameplay action.

### INV-003 — One renderer and one frame-loop owner
- **State:** `verified-by-source-and-CI`
- Machine scenes contribute animation callbacks only; the managed runtime owns the renderer and `setAnimationLoop`.
- Lifecycle measurement remains mandatory before the full-facility phase.

### INV-004 — 3D failure remains non-fatal
- **State:** `verified`
- WebGL/Three.js failure leaves original semantic controls available.
- Evidence: resilience QA remains green through the ARCHIVE checkpoint.

### INV-005 — Player-authored geometry crossing into Three.js is bounded
- **State:** `verified-nonGPU`
- ATLAS copies/clamps canonical locked-stroke coordinates and samples the physical path to at most 48 immutable points.
- Three.js never runs the canonical Sundial shape-recognition heuristic.

### INV-006 — ARCHIVE revelation does not imply solution
- **State:** `verified-nonGPU`
- The ARCHIVE projector exposes revealed identities/count and canonical solved state, but does not invent or persist a drag order the gameplay model does not store.
- All six identities may be revealed while `solved=false`.
- Evidence: focused projection tests plus full branch QA `35280838761`.

## 5. Verified Working Behavior

### VFY-001 — Local pinned Three.js runtime
- **State:** `verified`
- `three@0.186.0` is pinned and locally prepared with `three.module.js` + `three.core.js`.
- No runtime CDN hotlink.
- One managed renderer/animation loop with graceful fallback and context-loss handling.

### VFY-002 — DEIMOS canonical projection contract
- **State:** `verified`
- Canonical orientation and persistent safe state drive physical presentation through a pure projector.

### VFY-003 — CHRONOSTAT canonical projection contract
- **State:** `verified-nonGPU`
- Canonical sent/inbox/round-trip/shift/unlock state drives temporal presentation without exposing future-message text.

### VFY-004 — ATLAS canonical topology projection contract
- **State:** `verified-nonGPU`
- Canonical strokes, locked-shape count, and Sundial unlock drive bounded 3D topology state.
- Merged checkpoint `4e34f00` passed both post-merge QA and Pages deployment.

### VFY-005 — ARCHIVE revelation-versus-solution projection contract
- **State:** `verified-nonGPU`
- Canonical `revealed` is filtered to unique known IDs and copied immutably.
- Reveal completion is represented separately from canonical `solved`.
- Physical drawers may emerge as identities are revealed, but only canonical `solved=true` aligns and stabilizes the cabinet.
- Evidence: full branch QA `35280838761` at `e265c55bc3ceb8885e5279fa2a14873325aaeb68`.

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

### UNV-001 — Real GPU path for all seven machine views
- **State:** `implemented-unverified`
- CI proves module loading/fallback, not actual WebGL visual correctness.

### UNV-002 — DEIMOS physical GPU presentation
- **State:** `implemented-unverified`
- Requires real-browser orientation/safe persistence observation.

### UNV-003 — CHRONOSTAT physical GPU presentation
- **State:** `implemented-unverified`
- Requires real-browser send → wait → reply → drift → unlock observation.

### UNV-004 — ATLAS physical GPU presentation
- **State:** `implemented-unverified`
- Requires real-browser draw → lock → coastline → Sundial unlock observation.

### UNV-005 — ARCHIVE physical GPU presentation
- **State:** `implemented-unverified`
- Source contains six anonymous drawers, reveal-progress lighting/extension, deliberately irregular pre-solve geometry, all-revealed unresolved state, and canonical post-solve alignment/stabilization.
- Requires real-browser reveal → all revealed/unsolved → solved observation.

## 8. Unknown or Evidence-Stale State

Real GPU rendering, visual correctness, sustained frame-time behavior, lifecycle recovery under repeated room traversal, and context restoration on the deployed Pages build remain unverified. Local Mac execution is unavailable from the current runtime, so local working-copy and device-side browser claims are not made.

## 9. Pending Work

### PEND-001 — Real deployed browser validation
- **State:** `pending`
- **Priority:** high
- **Blocks full visual completion:** yes
- Validate merged Pages build in a real WebGL browser across all seven machine rooms and state-driven machine transitions.

### PEND-002 — Complete state-driven projections
- **State:** `partially-verified`
- **Progress:** 4/7 machines: DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE.
- **Remaining:** ORACLE, VERBOTEN, SUNDIAL.
- Each requires focused projector tests plus unchanged core/browser/runtime QA before merge.

### PEND-003 — Lifecycle/performance evidence
- **State:** `deferred`
- Run repeated load/unload, renderer/resource instrumentation, and matched performance capture after seven state-driven machines exist and before full navigable Facility 7-B.

## 10. Active Decisions, Defaults, and Prohibitions

- Preserve the existing mystery engine as canonical authority.
- Three.js consumes read-only projections; future 3D interactions must request semantic actions through existing machine/store commands.
- Preserve institutional dark green, bone, aged brass, and oxide-red visual language.
- Respect `prefers-reduced-motion`.
- Pin Three.js `0.186.0` until a separately validated migration.
- Never hotlink third-party runtime assets.
- Maintain one renderer and one animation-loop owner.
- Do not leak unsolved puzzle text through decorative 3D feedback.
- Bound player-authored geometry before it enters high-frequency rendering paths.
- Do not invent transient state that the canonical model does not persist; ARCHIVE drag order is the reference example.
- `docs/THREEJS_STATE_CONTRACT.md` is the controlling state-projection/authority contract.

## 11. Validation Matrix

| ID | Capability / invariant | State | Evidence | Next proof |
| --- | --- | --- | --- | --- |
| INV-001 | Existing game behavior preserved | verified | main QA `35280484758`; ARCHIVE QA `35280838761` | re-run each checkpoint |
| INV-002 | Canonical state outside Three.js | partially-verified | 4 immutable machine projectors | repeat for 3 remaining machines |
| INV-003 | One renderer/loop owner | verified-by-source-and-CI | managed runtime | lifecycle measurement later |
| INV-004 | 3D failure non-fatal | verified | resilience QA | re-run on runtime changes |
| INV-005 | ATLAS geometry bounded | verified-nonGPU | focused projection QA | real GPU coastline observation |
| INV-006 | ARCHIVE revealed != solved | verified-nonGPU | focused projection QA | real GPU cabinet observation |
| VFY-001 | Local Three runtime + Pages | verified | main QA + Pages deploy | recheck runtime/deploy changes |
| VFY-002 | DEIMOS projection | verified | focused + regression QA | real GPU proof |
| VFY-003 | CHRONOSTAT projection | verified-nonGPU | merged checkpoint | real GPU proof |
| VFY-004 | ATLAS projection | verified-nonGPU | merged checkpoint | real GPU proof |
| VFY-005 | ARCHIVE projection | verified-nonGPU | branch QA `35280838761` | merge/deploy + real GPU proof |
| PEND-002 | All seven projections | 4/7 | four verified contracts | ORACLE, VERBOTEN, SUNDIAL remain |

## 12. Current Change Scope and Impact Radius

Current branch changes are bounded to ARCHIVE presentation projection, focused projection tests, shared Three.js scene presentation, state-contract documentation, and this operational-state update. No canonical ARCHIVE printing/order rule, room gate, persistence schema, notebook, or ending logic is authorized to change in this checkpoint.

## 13. Compact Revision Log

- **r1 — 2026-09-17:** Bootstrapped state for first Three.js visualization upgrade.
- **r2 — 2026-09-17:** Promoted production-safe local Three.js runtime foundation.
- **r3 — 2026-09-17:** Promoted DEIMOS read-only state projection.
- **r4 — 2026-09-17:** Promoted CHRONOSTAT read-only state projection.
- **r5 — 2026-09-17:** Promoted ATLAS bounded player-authored topology projection.
- **r6 — 2026-09-17:** Recorded merged/deployed ATLAS baseline and promoted ARCHIVE revelation-versus-solution projection after full branch QA; real GPU proof remains pending.
