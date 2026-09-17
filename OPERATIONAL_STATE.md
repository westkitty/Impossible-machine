# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 4,
  "last_updated": "2026-09-17T22:03:00Z",
  "current_baseline": {
    "identity": "main ad29de85584abf6d86aa1f4a67f3657354f79c50 deployed; active branch upgrade/threejs-chronostat-state with Chronostat code verified at 933648f75a7c4a71b0b6fc6978bbf01c0080cfc8",
    "state": "partially-verified",
    "last_verified": "main QA 35279353127; Pages 35279353108; Chronostat branch QA 35279661877"
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

`main` at `ad29de85584abf6d86aa1f4a67f3657354f79c50` contains the verified Three.js runtime foundation and state-driven DEIMOS checkpoint. GitHub Actions QA run `35279353127` and Pages deployment `35279353108` both completed successfully on that exact SHA.

Active development branch `upgrade/threejs-chronostat-state` adds the second canonical-state-driven machine, CHRONOSTAT. The code head `933648f75a7c4a71b0b6fc6978bbf01c0080cfc8` passed the complete existing CI gate in run `35279661877`.

## 3. Artifact Contract

Preserve the existing mystery, room traversal, state persistence, archive, notebook, endings, and machine puzzle controls. Three.js is a physical projection layer over canonical gameplay state, not a replacement puzzle engine. Semantic DOM controls remain usable when Three.js or WebGL is unavailable.

## 4. Active Invariants

### INV-001 — Preserve existing game behavior
- **State:** `verified`
- **Rule:** Three.js work must not replace or alter existing puzzle/state/navigation behavior unless explicitly required.
- **Scope:** application controller, room traversal, machines, archive, notebook, persistence, endings
- **Evidence:** post-merge `main` QA run `35279353127` passed; Chronostat branch QA run `35279661877` also passed
- **Validation:** core QA + representative browser QA on the exact candidate SHA
- **Recheck trigger:** any gameplay/controller/state/navigation change

### INV-002 — Canonical state remains outside Three.js
- **State:** `partially-verified`
- **Rule:** Three.js transforms, materials, animation state, scene-local flags, and raycast state may not become sole authority for puzzle progress, saves, discoveries, gates, or endings.
- **Evidence:** DEIMOS and CHRONOSTAT use immutable read-only projectors in `src/three/machine-state.js`; focused state-projection QA passes
- **Validation:** every new machine gets a pure projector, immutability test, and unchanged core/browser/runtime QA
- **Recheck trigger:** any state-driven 3D integration or future 3D-to-gameplay action

### INV-003 — One renderer and one frame-loop owner
- **State:** `verified-by-source-and-CI`
- **Rule:** machine scenes must not create independent renderers or animation loops.
- **Evidence:** managed runtime owns the renderer and `setAnimationLoop`; DEIMOS and CHRONOSTAT controllers only contribute scene animation callbacks
- **Validation:** source inspection now; lifecycle measurement required before full-facility phase
- **Recheck trigger:** renderer, scene lifecycle, or animation-loop changes

### INV-004 — 3D failure remains non-fatal
- **State:** `verified`
- **Rule:** WebGL/Three.js failure must leave the original semantic machine controls available.
- **Evidence:** Three.js resilience QA passes on `main` and Chronostat branch
- **Recheck trigger:** runtime loading, renderer creation, fallback, or machine DOM changes

## 5. Verified Working Behavior

### VFY-001 — Local pinned Three.js runtime
- **State:** `verified`
- `three@0.186.0` is pinned.
- `three.module.js` and its `three.core.js` dependency are prepared locally for runtime/Pages delivery.
- Runtime no longer hotlinks a third-party CDN.
- Evidence: `main` QA `35279353127`; Pages deployment `35279353108`.

### VFY-002 — DEIMOS canonical projection contract
- **State:** `verified`
- Canonical `orientation` projects into eight 45-degree physical orientations.
- Canonical `safeOpen` projects into a persistent physical safe-door target.
- CEILING alignment is derived from canonical orientation index `5`.
- Projector is immutable/read-only.
- Evidence: focused projection QA + unchanged core/browser/runtime QA on the merged checkpoint.

### VFY-003 — CHRONOSTAT canonical projection contract
- **State:** `verified-nonGPU`
- Canonical `sent`, `inbox`, `roundTrips`, `shift`, and `unlockedVerb` project into presentation-only timing state.
- Derived state includes `waitingForReply`, seven-phase angular offset, normalized signal strength, drift, and `dormant|unstable|engaged|aftermath` phase.
- The projector does not expose future-message text and does not mutate canonical state.
- Evidence: full branch QA run `35279661877` passed at code head `933648f75a7c4a71b0b6fc6978bbf01c0080cfc8`.

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

### UNV-001 — Real GPU path for all seven machine views
- **State:** `implemented-unverified`
- CI proves module loading/fallback, not actual WebGL visual correctness.
- **Required proof:** real WebGL browser traversal of all seven rooms.

### UNV-002 — DEIMOS physical GPU presentation
- **State:** `implemented-unverified`
- Source contains state-driven orientation frame, safe body/door/handle, persistent open target, and CEILING cue.
- **Required proof:** real WebGL browser interaction across orientations and persistent safe-open behavior.

### UNV-003 — CHRONOSTAT physical GPU presentation
- **State:** `implemented-unverified`
- Source contains state-driven phase rings, quantized waiting motion, temporal echo pendulums, telegraph-key motion, six round-trip markers, progress signal plate, and final stabilized unlock state.
- **Required proof:** real WebGL browser observation through send → waiting → reply → drift → six-round-trip unlock states.

## 8. Unknown or Evidence-Stale State

Real GPU rendering, visual correctness, sustained frame-time behavior, lifecycle recovery under repeated room traversal, and context restoration on the deployed Pages build remain unverified. Local Mac execution is unavailable from the current runtime, so local working-copy and device-side browser claims are intentionally not made.

## 9. Pending Work

### PEND-001 — Real deployed browser validation
- **State:** `pending`
- **Priority:** high
- **Blocks full visual completion:** yes
- Validate the merged Pages build in a real WebGL browser.
- Check seven machine views, DEIMOS physical state, CHRONOSTAT physical state once deployed, existing controls, console errors, and context-loss behavior.

### PEND-002 — Complete state-driven projections
- **State:** `partially-verified`
- **Progress:** 2/7 machines have read-only canonical projection contracts: DEIMOS and CHRONOSTAT.
- **Remaining:** ATLAS, ARCHIVE, ORACLE, VERBOTEN, SUNDIAL.
- Each must receive focused projector tests plus unchanged core/browser/runtime QA before merge.

### PEND-003 — Lifecycle/performance evidence
- **State:** `deferred`
- Run repeated load/unload and renderer/resource instrumentation after the seven state-driven machines exist, before building the full navigable Facility 7-B.

## 10. Active Decisions, Defaults, and Prohibitions

- Preserve the existing mystery engine as canonical authority.
- Three.js consumes read-only projections; future 3D interactions must request semantic actions through existing machine/store commands.
- Preserve institutional dark green, bone, aged brass, and oxide-red visual language.
- Respect `prefers-reduced-motion`.
- Pin Three.js `0.186.0` until a separately validated migration.
- Never hotlink third-party runtime assets.
- Maintain one renderer and one animation-loop owner.
- Do not leak unsolved puzzle text through decorative 3D feedback.
- `docs/THREEJS_STATE_CONTRACT.md` is the controlling state-projection/authority contract.

## 11. Validation Matrix

| ID | Capability / invariant | State | Evidence | Next proof |
| --- | --- | --- | --- | --- |
| INV-001 | Existing game behavior preserved | verified | main QA `35279353127`; branch QA `35279661877` | re-run on every affected checkpoint |
| INV-002 | Canonical state outside Three.js | partially-verified | DEIMOS + CHRONOSTAT immutable projectors | repeat for 5 remaining machines |
| INV-003 | One renderer/loop owner | verified-by-source-and-CI | managed runtime path | lifecycle measurement later |
| INV-004 | 3D failure non-fatal | verified | resilience QA | re-run on runtime changes |
| VFY-001 | Local Three runtime + Pages preparation | verified | main QA + Pages deploy | recheck on runtime/deploy changes |
| VFY-002 | DEIMOS projection contract | verified | focused + regression QA | real GPU visual proof |
| VFY-003 | CHRONOSTAT projection contract | verified-nonGPU | branch QA `35279661877` | real GPU visual proof after deployment |
| PEND-002 | All seven projections | 2/7 | two verified contracts | five machine checkpoints remain |

## 12. Current Change Scope and Impact Radius

Current branch changes are bounded to CHRONOSTAT presentation projection, its focused projection tests, the shared Three.js scene controller, state-contract documentation, and this operational-state update. No canonical CHRONOSTAT puzzle rules, room gates, persistence schema, archive, notebook, or ending logic are authorized to change in this checkpoint.

## 13. Compact Revision Log

- **r1 — 2026-09-17:** Bootstrapped state for the first Three.js visualization upgrade.
- **r2 — 2026-09-17:** Promoted the production-safe local Three.js runtime foundation after CI evidence.
- **r3 — 2026-09-17:** Promoted DEIMOS read-only state projection after focused + regression QA and recorded real-GPU proof as pending.
- **r4 — 2026-09-17:** Recorded successful merged/deployed DEIMOS checkpoint and promoted CHRONOSTAT's read-only projection contract after full branch QA; real GPU CHRONOSTAT presentation remains unverified pending deployment/browser observation.
