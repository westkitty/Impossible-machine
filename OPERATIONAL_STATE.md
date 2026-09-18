# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 11,
  "last_updated": "2026-09-18T01:00:00Z",
  "current_baseline": {
    "identity": "main 4bd988b1035c998dbe1ceabe89d19cc555d2f20b merged and deployed with S9-verified DEIMOS lifecycle/runtime path and tablet inspection repair",
    "state": "partially-verified",
    "last_verified": "main QA 35293268314; Pages 35293268213; S9 Ultra Chrome 152 WebGL2 Adreno 740 acceptance"
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

`main` at `4bd988b1035c998dbe1ceabe89d19cc555d2f20b` is deployed and passes the full QA matrix. It contains the seven state-driven Three.js machine projections, state-driven Facility 7-B atmosphere, semantic facility navigation, presentation-only apparatus inspection, adaptive ECO/STANDARD/HIGH rendering policy, offscreen suspension, and local runtime telemetry.

Real-device evidence now exists for the deployed DEIMOS path on a Galaxy Tab S9 Ultra (`SM-X910`) running Chrome `152.0.7977.82`, WebGL 2, and Adreno 740. In that bounded scenario, HIGH tier at DPR cap 1.75 sustained an approximately 16.7 ms frame cadence, 20 repeated room-entry/exit cycles showed no monotonic geometry/program growth, forced WebGL context loss paused rendering and restored cleanly, offscreen suspension halted rendering, and touch inspection entered, dragged visibly, and closed successfully after the tablet-toolbar repair.

This does **not** establish all-seven-machine visual correctness, long-session thermal stability, or every device/browser combination. Those remain explicit follow-up evidence requirements.

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
- **State:** `verified-S9-DEIMOS`
- CI covers bounded rotation/zoom/reset/close helpers, keyboard mapping, reduced-motion behavior, fallback disabling, and listener cleanup paths.
- Galaxy Tab S9 Ultra deployed-browser evidence proves touch entry, visible touch-drag response, and touch CLOSE on DEIMOS.
- A real-device defect was found before promotion: RESET/CLOSE were below the current tablet viewport after expansion. PR #9 moved the toolbar to the top edge and centers the host on entry; deployed acceptance on `4bd988b` passed.

### VFY-011 — Adaptive rendering and diagnostics policy
- **State:** `verified-S9-DEIMOS`
- Deterministic ECO/STANDARD/HIGH selection, DPR caps, cadence policy, pause-reason composition, fallback diagnostics, and disconnected-view pruning are covered by CI.
- On S9 Ultra DEIMOS, runtime selected HIGH at DPR 1.75. A 175-frame sample measured approximately 16.7 ms p50/p95/p99, 25 ms max, and 16.619 ms mean.
- Twenty enter/leave cycles held activation resources at 9 geometries / 1 texture / 2 programs and deactivation resources at 0 geometries / 1 renderer-owned texture / 0 programs, with no monotonic growth.
- Forced `WEBGL_lose_context` produced zero rendered frames while lost and restored to the same 9/1/2 envelope. Offscreen suspension likewise held frame count constant until visible again.
- Long thermal runs and other machine scenes remain unverified.

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

Real GPU evidence is now available for the deployed DEIMOS path on Galaxy Tab S9 Ultra, including frame cadence, 20-cycle resource lifecycle, context loss/restoration, offscreen suspension, and touch inspection. Equivalent visual/runtime evidence is still missing for CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL, and no long-duration thermal/session test has been completed.

## 8. Unknown or Evidence-Stale State

Cross-machine GPU visual correctness, sustained long-session thermal behavior, and non-S9 device/browser performance remain unknown. DEIMOS on S9 Ultra is no longer unknown: that bounded deployed path has real WebGL, lifecycle, recovery, offscreen, cadence, and touch evidence.

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
- **State:** `verified-for-S9-DEIMOS; broader-proof-pending`
- Galaxy Tab S9 Ultra DEIMOS now satisfies the 20-cycle traversal/resource test, real context-loss recovery, offscreen pause/resume, real touch inspection, and short frame-cadence evidence.
- Still required before a full navigable Facility 7-B shell: equivalent real-GPU observation across the remaining six machine scenes plus a longer sustained/thermal session.

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
| INV-011 | Inspection does not own gameplay | verified-S9-DEIMOS | CI + deployed S9 touch enter/drag/close | repeat on remaining machine scenes |
| INV-012 | Adaptive telemetry local/non-authoritative | verified-S9-DEIMOS | lifecycle QA + deployed S9 runtime measurements | broader device/machine coverage |
| PEND-003 | GPU lifecycle/performance | verified-S9-DEIMOS; broader-proof-pending | 20-cycle 9/1/2 stable envelope, context loss, offscreen pause, ~16.7 ms cadence | six remaining scenes + long thermal run |

## 12. Current Change Scope and Impact Radius

Tablet/runtime proof found one bounded presentation defect: inspection RESET/CLOSE controls could fall below the S9 viewport after expansion. PR #9 changed only `src/three/machine-scenes.js` and `qa/three-inspection.mjs`, moving the toolbar to the top edge and centering the host on inspection entry. Main `4bd988b` passes QA `35293268314`, Pages `35293268213`, and the post-deploy S9 touch acceptance path. Canonical puzzle state, machine rules, saves, gates, endings, renderer ownership, and quality policy were not changed.

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

- **r11 — 2026-09-18:** Added real Galaxy Tab S9 Ultra / Chrome 152 / WebGL2 Adreno 740 evidence for the deployed DEIMOS path: HIGH tier at DPR 1.75, ~16.7 ms short-run cadence, stable 20-cycle 9/1/2 resource envelope, successful real context-loss recovery, offscreen suspension, and touch inspection. Found and repaired offscreen inspection controls through PR #9; deployed acceptance passed on `4bd988b`. Broader six-machine and long thermal proof remain pending.
