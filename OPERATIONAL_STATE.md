# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 9,
  "last_updated": "2026-09-17T23:07:00Z",
  "current_baseline": {
    "identity": "main bd3de1ae9e3ee49dc094cc3a8d8bfa18663ab68a merged and deployed with all seven state-driven Three.js machine projections",
    "state": "partially-verified",
    "last_verified": "main QA 35285227690; Pages 35285227621; final branch QA 35285129004"
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

`main` at `bd3de1ae9e3ee49dc094cc3a8d8bfa18663ab68a` contains the production-safe local Three.js runtime plus state-driven DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL projections. GitHub Actions QA run `35285227690` and Pages deployment `35285227621` both completed successfully on that exact SHA.

The seven-machine projection architecture is complete at the non-GPU evidence level. Canonical puzzle rules remain in the existing state/machine modules; Three.js consumes immutable read-only projections. Real WebGL visual correctness, lifecycle behavior under repeated traversal, and target-device performance remain pending evidence rather than assumed completion.

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

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

Real GPU visual behavior remains unverified for all seven state-driven views: DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL. CI proves source behavior, browser fallback, and immutable projection contracts; it does not prove actual WebGL visual correctness, device performance, or long-session lifecycle behavior.

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
| INV-001 | Existing game behavior preserved | verified | main QA `35282123826`; final branch QA `35285007495` | re-run on future gameplay changes |
| INV-002 | Canonical state outside Three.js | verified-nonGPU | 7 immutable machine projectors | real GPU observation |
| INV-003 | One renderer/loop owner | verified-by-source-and-CI | managed runtime | lifecycle measurement |
| INV-004 | 3D failure non-fatal | verified | resilience QA through final branch | real browser fallback spot-check |
| INV-005 | ATLAS geometry bounded | verified-nonGPU | focused projection QA | real GPU coastline observation |
| INV-006 | ARCHIVE revealed != solved | verified-nonGPU | focused projection QA | real GPU cabinet observation |
| INV-007 | ORACLE hidden formula stays canonical | verified-nonGPU | focused projection QA | real GPU scale observation |
| INV-008 | VERBOTEN content remains secret | verified-nonGPU | anti-leakage assertions + QA `35285007495` | real GPU progress observation |
| INV-009 | SUNDIAL code remains secret | verified-nonGPU | anti-leakage assertions + QA `35285007495` | real GPU retrograde/code-ready observation |
| PEND-002 | All seven projections | verified-nonGPU | merged/deployed `bd3de1a`; QA `35285227690`; Pages `35285227621` | real GPU proof |

## 12. Current Change Scope and Impact Radius

The seven-machine projection implementation is merged and deployed. This revision is a control-plane reconciliation only: it records the final `main` baseline and release evidence. No runtime code, canonical machine logic, traversal, persistence, notebook behavior, or endings change in this state-only revision.

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
