# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 10,
  "last_updated": "2026-09-18T00:04:00Z",
  "current_baseline": {
    "identity": "main 5df51a05b7baa8f1666d2518b8030a654a026e9c merged and deployed with seven state-driven machines plus dynamic Facility 7-B presentation/runtime expansion",
    "state": "partially-verified",
    "last_verified": "main QA 35289439286; Pages 35289439168; PR QA 35289340094"
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

`main` at `5df51a05b7baa8f1666d2518b8030a654a026e9c` contains the production-safe local Three.js runtime, all seven canonical-state-driven machine projections, state-driven Facility 7-B atmosphere, semantic facility navigation, presentation-only apparatus inspection, adaptive ECO/STANDARD/HIGH rendering policy, offscreen rendering suspension, and local runtime telemetry.

GitHub Actions QA run `35289439286` and Pages deployment `35289439168` both completed successfully on that exact SHA. The QA matrix now includes core tests, browser flow, full-mystery playthrough, Three.js fallback, seven-machine projection tests, facility-atmosphere tests, apparatus-inspection helper tests, and lifecycle/runtime-policy tests.

Real WebGL appearance, pointer/touch inspection behavior on a GPU-backed browser, repeated GPU resource lifecycle behavior, context restoration under real WebGL, and target-device performance remain pending evidence rather than assumed completion.

## 3. Artifact Contract

Preserve the existing mystery, room traversal, persistence, archive, notebook, endings, and machine controls. Three.js is a physical projection of canonical gameplay state, not a replacement puzzle engine. Semantic DOM controls remain usable when Three.js or WebGL is unavailable.

## 4. Active Invariants

### INV-001 — Preserve existing game behavior
- **State:** `verified`
- Three.js work must not replace or alter existing puzzle/state/navigation behavior unless explicitly required.
- Evidence: post-merge `main` QA `35281031936`; ORACLE branch QA `35281321909`.

### INV-002 — Canonical state remains outside Three.js
- **State:** `verified-nonGPU`
- All seven machines use immutable read-only projectors.
- Three.js may not become sole authority for puzzle progress, saves, discoveries, gates, or endings.
- Evidence: focused projection coverage through SUNDIAL plus full branch QA `35285007495`.

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

### INV-008 — VERBOTEN secret words stay outside Three.js
- **State:** `verified-nonGPU`
- The projector exposes anonymous print/capture counts only; printed words, capture keys, names, and ledger order do not cross into rendering.
- Evidence: focused anti-leakage assertions plus full QA `35285007495`.

### INV-009 — SUNDIAL code content stays outside Three.js
- **State:** `verified-nonGPU`
- The projector exposes retrograde hour, glyph count/completion, code-ready boolean, reversal discovery, and used state only.
- Glyph characters and the access-code string do not cross into rendering or DOM datasets.
- Evidence: focused anti-leakage assertions plus full QA `35285007495`.

### INV-010 — Facility atmosphere remains presentation-only
- **State:** `verified-nonGPU`
- Room atmosphere derives from sanitized machine phases and public consequences only.
- Atmosphere may write CSS custom properties and safe `data-*` attributes but never gates traversal, endings, saves, or puzzle logic.
- Focused tests prove VERBOTEN word/capture content and SUNDIAL glyph/code content do not cross the atmosphere projection.

### INV-011 — Apparatus inspection cannot become puzzle authority
- **State:** `verified-nonGPU`
- Inspection yaw, pitch, zoom, drag, reset, and close state are presentation-only.
- Existing semantic DOM machine controls remain the gameplay interaction authority.
- No raycast-driven canonical puzzle command is included in this release.

### INV-012 — Adaptive runtime telemetry stays local and non-authoritative
- **State:** `verified-by-source-and-CI`
- ECO/STANDARD/HIGH policy affects DPR, cadence, and incidental parallax only.
- Offscreen/document/context pause reasons affect rendering work only.
- Runtime counters are local diagnostics; they are not persisted or transmitted.

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

### VFY-007 — VERBOTEN anonymous-progress projection contract
- **State:** `verified-nonGPU`
- Print/capture progress drives spool, tape, furnace, containment, and anonymous markers without word leakage.
- Merged checkpoint `538e44d` passed post-merge QA and Pages deployment.

### VFY-008 — SUNDIAL retrograde/access-progress projection contract
- **State:** `verified-nonGPU`
- Canonical hour, anonymous glyph progress, reversal discovery, code-ready state, and successful use drive the 3D sundial without code leakage.
- Merged/deployed checkpoint `bd3de1a` passed post-merge QA `35285227690` and Pages deployment `35285227621`.

### VFY-009 — State-driven Facility 7-B atmosphere and semantic navigation
- **State:** `verified-nonGPU`
- Rooms receive bounded restoration/anomaly presentation from sanitized canonical consequences.
- Door and facility-map navigation use semantic buttons while preserving locked-door explanation behavior.
- Evidence: main QA `35289439286` and full-mystery playthrough.

### VFY-010 — Presentation-only apparatus inspection contract
- **State:** `verified-nonGPU`
- Bounded rotation/zoom/reset/close helpers, keyboard mapping, reduced-motion behavior, fallback disabling, and listener cleanup paths are covered by CI.
- Actual GPU-backed drag/zoom visual behavior remains unverified.

### VFY-011 — Adaptive rendering and diagnostics policy
- **State:** `verified-nonGPU`
- Deterministic ECO/STANDARD/HIGH selection, DPR caps, cadence policy, pause-reason composition, fallback diagnostics, and disconnected-view pruning are covered by CI.
- Actual device performance and GPU resource stability remain unverified.

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

Real GPU visual behavior remains unverified for all seven state-driven machine views and the new inspection/quality systems. CI proves source behavior, semantic browser flows, full-mystery progression, fallback behavior, immutable presentation contracts, quality-policy logic, and cleanup bookkeeping; it does not prove actual WebGL visual correctness, touch/pointer feel, sustained frame-time behavior, GPU resource recovery, or target-device performance.

## 8. Unknown or Evidence-Stale State

Real GPU rendering, visual correctness, sustained frame-time behavior, lifecycle recovery under repeated room traversal, and context restoration on deployed Pages remain unverified. Local Mac execution is unavailable from the current runtime, so local working-copy and device-side browser claims are not made.

## 9. Pending Work

### PEND-001 — Real deployed browser validation
- **State:** `pending`
- **Priority:** high
- **Blocks full visual completion:** yes
- Validate merged Pages in a real WebGL browser across all seven machine rooms and state transitions.

### PEND-002 — Complete state-driven projections
- **State:** `verified-nonGPU`
- **Progress:** 7/7 complete: DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, SUNDIAL.
- Focused projector coverage now includes the previously missing VERBOTEN anti-leakage cases plus SUNDIAL anti-code-leakage cases.

### PEND-003 — Lifecycle/performance evidence
- **State:** `partially-verified`
- Pure runtime policy, pause composition, fallback diagnostics, disconnected-view pruning, and observer/listener cleanup paths are CI-covered.
- Still required before full navigable Facility 7-B: real WebGL repeated traversal (target: 20 cycles), `renderer.info` resource-envelope observation, context-loss recovery, sustained frame cadence, and Galaxy Tab S9 Ultra evidence.

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
| INV-001 | Existing game behavior preserved | verified | main QA `35289439286`; full-mystery playthrough | re-run on future gameplay changes |
| INV-002 | Canonical state outside Three.js | verified-nonGPU | 7 immutable machine projectors | real GPU observation |
| INV-003 | One renderer/loop owner | verified-by-source-and-CI | managed runtime + final QA | lifecycle measurement |
| INV-004 | 3D failure non-fatal | verified | resilience QA on `5df51a0` | real browser fallback spot-check |
| INV-005 | ATLAS geometry bounded | verified-nonGPU | focused projection QA | real GPU coastline observation |
| INV-006 | ARCHIVE revealed != solved | verified-nonGPU | focused projection QA | real GPU cabinet observation |
| INV-007 | ORACLE hidden formula stays canonical | verified-nonGPU | focused projection QA | real GPU scale observation |
| INV-008 | VERBOTEN content remains secret | verified-nonGPU | anti-leakage projection QA | real GPU progress observation |
| INV-009 | SUNDIAL code remains secret | verified-nonGPU | anti-leakage projection QA | real GPU retrograde observation |
| INV-010 | Facility atmosphere presentation-only | verified-nonGPU | facility-atmosphere QA + browser/full playthrough | real visual observation |
| INV-011 | Inspection does not own gameplay | verified-nonGPU | inspection helper + fallback QA | real pointer/touch inspection |
| INV-012 | Adaptive telemetry local/non-authoritative | verified-by-source-and-CI | lifecycle policy QA | target-device measurements |
| PEND-003 | GPU lifecycle/performance | partially-verified | pure policy/bookkeeping tests | 20-cycle GPU/resource/device run |

## 12. Current Change Scope and Impact Radius

Dynamic expansion is merged and deployed at `5df51a0`. This revision is a control-plane reconciliation only. The implementation changed presentation/runtime/UI and QA surfaces; canonical machine rules, state schema, room gating, archive canon, notebook persistence, and ending logic were not changed. Future expansion must preserve the same boundaries until real GPU/lifecycle evidence justifies a continuous 3D Facility 7-B shell.

## 13. Compact Revision Log

- **r1 — 2026-09-17:** Bootstrapped first Three.js upgrade state.
- **r2:** Promoted production-safe local Three.js runtime.
- **r3:** Promoted DEIMOS state projection.
- **r4:** Promoted CHRONOSTAT state projection.
- **r5:** Promoted ATLAS bounded topology projection.
- **r6:** Promoted ARCHIVE revelation-versus-solution projection.
- **r7 — 2026-09-17:** Recorded merged/deployed ARCHIVE baseline and promoted ORACLE stored-reading projection after full branch QA; hidden significance logic remains exclusively canonical.
- **r8 — 2026-09-17:** Recorded merged/deployed VERBOTEN baseline, repaired missing focused VERBOTEN anti-leakage coverage, and promoted SUNDIAL as the seventh state-driven projection after full branch QA.
- **r9 — 2026-09-17:** Reconciled the final merged/deployed seven-machine baseline at `bd3de1a`; post-merge QA and Pages both passed. Real GPU, lifecycle, and device-performance proof remain pending.
- **r10 — 2026-09-18:** Merged/deployed dynamic expansion at `5df51a0`: state-driven facility atmosphere, semantic navigation, presentation-only apparatus inspection, adaptive rendering tiers, offscreen suspension, local telemetry, and full-mystery CI gating. Main QA `35289439286` and Pages `35289439168` passed; GPU/device proof remains pending.
