# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 7,
  "last_updated": "2026-09-17T22:21:00Z",
  "current_baseline": {
    "identity": "main 5606d53fd3cab8096af28d90744af820299ee28f deployed; active branch upgrade/threejs-oracle-state with ORACLE code verified at d596f0c145d5600d52f6c8e4be0bb1dbb1331dba",
    "state": "partially-verified",
    "last_verified": "main QA 35281031936; Pages 35281031946; ORACLE branch QA 35281321909"
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

`main` at `5606d53fd3cab8096af28d90744af820299ee28f` contains the production-safe Three.js runtime plus state-driven DEIMOS, CHRONOSTAT, ATLAS, and ARCHIVE checkpoints. GitHub Actions QA run `35281031936` and Pages deployment `35281031946` both completed successfully on that exact SHA.

Active branch `upgrade/threejs-oracle-state` adds the fifth canonical-state-driven machine, ORACLE. Its physical-code head `d596f0c145d5600d52f6c8e4be0bb1dbb1331dba` passed the complete CI gate in run `35281321909` before documentation/state promotion.

## 3. Artifact Contract

Preserve the existing mystery, room traversal, persistence, archive, notebook, endings, and machine controls. Three.js is a physical projection of canonical gameplay state, not a replacement puzzle engine. Semantic DOM controls remain usable when Three.js or WebGL is unavailable.

## 4. Active Invariants

### INV-001 — Preserve existing game behavior
- **State:** `verified`
- Three.js work must not replace or alter existing puzzle/state/navigation behavior unless explicitly required.
- Evidence: post-merge `main` QA `35281031936`; ORACLE branch QA `35281321909`.

### INV-002 — Canonical state remains outside Three.js
- **State:** `partially-verified`
- DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, and ORACLE use immutable read-only projectors.
- Three.js may not become sole authority for puzzle progress, saves, discoveries, gates, or endings.

### INV-003 — One renderer and one frame-loop owner
- **State:** `verified-by-source-and-CI`
- Machine scenes contribute animation callbacks only; managed runtime owns renderer and `setAnimationLoop`.

### INV-004 — 3D failure remains non-fatal
- **State:** `verified`
- WebGL/Three.js failure leaves original semantic controls available.

### INV-005 — Player-authored geometry crossing into Three.js is bounded
- **State:** `verified-nonGPU`
- ATLAS samples the physical path to at most 48 immutable points and never runs the canonical recognition heuristic.

### INV-006 — ARCHIVE revelation does not imply solution
- **State:** `verified-nonGPU`
- All six identities may be revealed while `solved=false`; Three.js does not invent transient drag order.

### INV-007 — ORACLE hidden significance logic stays canonical
- **State:** `verified-nonGPU`
- Three.js consumes canonical placed IDs, persisted reading results, discovery flags, and Director unlock only.
- It does not duplicate true-mass data, significance scores, or the hidden reading formula from `src/machines/oracle.js`.
- Evidence: focused ORACLE projection tests plus full QA run `35281321909`.

## 5. Verified Working Behavior

### VFY-001 — Local pinned Three.js runtime
- **State:** `verified`
- `three@0.186.0` is locally prepared; no runtime CDN; one managed renderer/loop with graceful fallback and context-loss handling.

### VFY-002 — DEIMOS projection contract
- **State:** `verified`
- Canonical orientation and persistent safe state drive physical presentation.

### VFY-003 — CHRONOSTAT projection contract
- **State:** `verified-nonGPU`
- Canonical temporal progress drives physical timing without exposing future-message text.

### VFY-004 — ATLAS topology projection contract
- **State:** `verified-nonGPU`
- Canonical locked player geometry drives bounded 3D topology; recognition remains canonical.

### VFY-005 — ARCHIVE revelation-versus-solution contract
- **State:** `verified-nonGPU`
- Merged checkpoint `5606d53` passed post-merge QA and Pages deployment.

### VFY-006 — ORACLE stored-reading projection contract
- **State:** `verified-nonGPU`
- Canonical placed IDs and stored readings project into immutable reading entries and bounded balance signal.
- Positive, negative, and zero readings remain distinguishable; rule-learning and Director unlock are canonical flags only.
- Evidence: full branch QA `35281321909` at `d596f0c145d5600d52f6c8e4be0bb1dbb1331dba`.

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

Real GPU visual behavior remains unverified for all seven views. Specifically unverified state-driven paths now include DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, and ORACLE. ORACLE requires real-browser placed-object/readings/rule-learned/Director-unlock observation.

## 8. Unknown or Evidence-Stale State

Real GPU rendering, visual correctness, sustained frame-time behavior, lifecycle recovery under repeated room traversal, and context restoration on deployed Pages remain unverified. Local Mac execution is unavailable from the current runtime, so local working-copy and device-side browser claims are not made.

## 9. Pending Work

### PEND-001 — Real deployed browser validation
- **State:** `pending`
- **Priority:** high
- **Blocks full visual completion:** yes
- Validate merged Pages in a real WebGL browser across all seven machine rooms and state transitions.

### PEND-002 — Complete state-driven projections
- **State:** `partially-verified`
- **Progress:** 5/7: DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, ORACLE.
- **Remaining:** VERBOTEN, SUNDIAL.

### PEND-003 — Lifecycle/performance evidence
- **State:** `deferred`
- Run repeated load/unload and renderer/resource instrumentation after seven state-driven machines exist and before full navigable Facility 7-B.

## 10. Active Decisions, Defaults, and Prohibitions

- Preserve the existing mystery engine as canonical authority.
- Three.js consumes read-only projections; future 3D actions must route through existing semantic commands.
- Preserve institutional dark green, bone, aged brass, and oxide-red visual language.
- Respect `prefers-reduced-motion`.
- Pin Three.js `0.186.0` until separately validated migration.
- Never hotlink third-party runtime assets.
- Maintain one renderer and one animation-loop owner.
- Do not leak unsolved puzzle text through 3D feedback.
- Bound player-authored geometry before high-frequency rendering.
- Do not invent transient state the canonical model does not persist.
- Do not duplicate hidden puzzle formulas in Three.js; ORACLE is the reference case.
- `docs/THREEJS_STATE_CONTRACT.md` is the controlling projection contract.

## 11. Validation Matrix

| ID | Capability / invariant | State | Evidence | Next proof |
| --- | --- | --- | --- | --- |
| INV-001 | Existing game behavior preserved | verified | main QA `35281031936`; ORACLE QA `35281321909` | re-run each checkpoint |
| INV-002 | Canonical state outside Three.js | partially-verified | 5 immutable machine projectors | repeat for 2 remaining machines |
| INV-003 | One renderer/loop owner | verified-by-source-and-CI | managed runtime | lifecycle measurement later |
| INV-004 | 3D failure non-fatal | verified | resilience QA | re-run runtime changes |
| INV-005 | ATLAS geometry bounded | verified-nonGPU | focused projection QA | real GPU proof |
| INV-006 | ARCHIVE revealed != solved | verified-nonGPU | focused projection QA | real GPU proof |
| INV-007 | ORACLE hidden formula stays canonical | verified-nonGPU | focused + full QA | real GPU proof |
| VFY-006 | ORACLE projection | verified-nonGPU | branch QA `35281321909` | merge/deploy + real GPU proof |
| PEND-002 | All seven projections | 5/7 | five verified contracts | VERBOTEN, SUNDIAL remain |

## 12. Current Change Scope and Impact Radius

Current branch changes are bounded to ORACLE presentation projection, focused projection tests, shared Three.js scene presentation, state-contract documentation, and this operational-state update. No canonical ORACLE significance formula, token data, gate logic, persistence schema, notebook, or ending logic is authorized to change in this checkpoint.

## 13. Compact Revision Log

- **r1 — 2026-09-17:** Bootstrapped first Three.js upgrade state.
- **r2:** Promoted production-safe local Three.js runtime.
- **r3:** Promoted DEIMOS state projection.
- **r4:** Promoted CHRONOSTAT state projection.
- **r5:** Promoted ATLAS bounded topology projection.
- **r6:** Promoted ARCHIVE revelation-versus-solution projection.
- **r7 — 2026-09-17:** Recorded merged/deployed ARCHIVE baseline and promoted ORACLE stored-reading projection after full branch QA; hidden significance logic remains exclusively canonical.
