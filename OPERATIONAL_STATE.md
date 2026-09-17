# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 2,
  "last_updated": "2026-09-17T21:48:00Z",
  "current_baseline": {
    "identity": "upgrade/threejs-phase1-runtime at 90b3a8e53d095122ea739e7629195b8b49548035",
    "state": "partially-verified",
    "last_verified": "GitHub Actions QA run 35278558524"
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs the repository `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

The active upgrade branch preserves the original mystery application while replacing the first experimental Three.js delivery path with a pinned local runtime preparation step, one managed renderer/animation-loop owner, explicit WebGL fallback behavior, context-loss handling, and CI coverage.

## 3. Artifact Contract

Preserve the existing mystery, room traversal, state persistence, archive, notebook, endings, and machine puzzle controls. Three-dimensional rendering is an enhancement and physical projection layer, not a replacement for puzzle logic or semantic DOM controls. Canonical gameplay state remains outside Three.js.

## 4. Active Invariants

<!-- operational-state:entry
{"id":"INV-001","title":"Preserve existing game behavior","state":"verified","rule":"Three.js upgrades must not replace or alter the existing puzzle/state/navigation logic unless explicitly requested.","scope":"Application controller, room traversal, machines, archive, notebook, endings","authority":"User request interpreted against existing project purpose","evidence":"GitHub Actions run 35278558524: core QA 74/74 and browser QA 29/29 passed at 90b3a8e53d095122ea739e7629195b8b49548035","validation_method":"Run core QA and representative browser playthrough on the exact candidate SHA","last_checked":"revision 2","status":"active","recheck_trigger":"Any controller, machine logic, navigation, storage, archive, notebook, or ending change"}
-->
### INV-001 — Preserve existing game behavior
- **State:** `verified`
- **Rule:** Three.js upgrades must not replace or alter the existing puzzle/state/navigation logic unless explicitly requested.
- **Scope:** Application controller, room traversal, machines, archive, notebook, endings
- **Authority:** User request interpreted against existing project purpose
- **Evidence:** GitHub Actions run `35278558524`: core QA **74/74** and browser QA **29/29** passed at `90b3a8e53d095122ea739e7629195b8b49548035`
- **Validation method:** Run core QA and representative browser playthrough on the exact candidate SHA
- **Last checked:** revision 2
- **Status:** active
- **Recheck trigger:** Any controller, machine logic, navigation, storage, archive, notebook, or ending change
<!-- /operational-state:entry -->

<!-- operational-state:entry
{"id":"INV-002","title":"Canonical state remains outside Three.js","state":"requested","rule":"Three.js objects, transforms, materials, and animations are derived presentation state and must never become the sole authority for puzzle progress, navigation gates, saves, discoveries, or endings.","scope":"Three.js runtime and all future machine-state adapters","authority":"Approved Three.js architecture direction","evidence":"Existing state/store and machine modules already own puzzle truth","validation_method":"Trace machine actions through canonical store/modules and add focused projection tests for each 3D adapter","last_checked":"revision 2","status":"active","recheck_trigger":"Any state-driven 3D interaction or 3D-to-gameplay action"}
-->
### INV-002 — Canonical state remains outside Three.js
- **State:** `requested`
- **Rule:** Three.js objects, transforms, materials, and animations are derived presentation state and must never become the sole authority for puzzle progress, navigation gates, saves, discoveries, or endings.
- **Scope:** Three.js runtime and all future machine-state adapters
- **Authority:** Approved Three.js architecture direction
- **Evidence:** Existing `state/store.js` and machine modules already own puzzle truth
- **Validation method:** Trace machine actions through canonical store/modules and add focused projection tests for each 3D adapter
- **Last checked:** revision 2
- **Status:** active
- **Recheck trigger:** Any state-driven 3D interaction or 3D-to-gameplay action
<!-- /operational-state:entry -->

## 5. Verified Working Behavior

<!-- operational-state:entry
{"id":"VFY-001","title":"Three.js runtime preparation and graceful fallback","state":"verified","capability":"Pinned three@0.186.0 is prepared locally with both three.module.js and its three.core.js dependency; the browser app retains original controls when WebGL is unavailable; one managed renderer path owns animation.","scope":"package.json, scripts/prepare-three.mjs, src/three/machine-scenes.js, CI and Pages workflows","evidence":"GitHub Actions run 35278558524 completed successfully including Three.js resilience QA","validation_method":"Clean CI install, prepare local Three runtime, core QA, browser QA, and Three.js fallback QA","last_checked":"revision 2","status":"active","recheck_trigger":"Three.js version, runtime preparation, renderer lifecycle, fallback, or deployment workflow change"}
-->
### VFY-001 — Three.js runtime preparation and graceful fallback
- **State:** `verified`
- **Capability:** Pinned `three@0.186.0` is prepared locally with both `three.module.js` and its `three.core.js` dependency; the browser app retains original controls when WebGL is unavailable; one managed renderer path owns animation.
- **Scope:** `package.json`, `scripts/prepare-three.mjs`, `src/three/machine-scenes.js`, CI and Pages workflows
- **Evidence:** GitHub Actions run `35278558524` completed successfully including Three.js resilience QA
- **Validation method:** Clean CI install, prepare local Three runtime, core QA, browser QA, and Three.js fallback QA
- **Last checked:** revision 2
- **Status:** active
- **Recheck trigger:** Three.js version, runtime preparation, renderer lifecycle, fallback, or deployment workflow change
<!-- /operational-state:entry -->

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

<!-- operational-state:entry
{"id":"UNV-001","title":"Seven Three.js machine views on real GPU path","state":"implemented-unverified","capability":"Procedural WebGL views exist for DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL while their DOM controls remain intact.","scope":"src/three/machine-scenes.js","evidence":"Source implementation and CI module-loading/fallback proof exist; CI does not provide real GPU/WebGL rendering proof","validation_method":"Load deployed GitHub Pages build in a real WebGL browser, visit all seven machine rooms, confirm rendered scene and existing controls","last_checked":"revision 2","status":"active","recheck_trigger":"Three.js version, visualization code, machine DOM structure, or deployment change"}
-->
### UNV-001 — Seven Three.js machine views on real GPU path
- **State:** `implemented-unverified`
- **Capability:** Procedural WebGL views exist for all seven machines while existing controls remain intact.
- **Scope:** `src/three/machine-scenes.js`
- **Evidence:** Source implementation and CI module-loading/fallback proof exist; CI does not provide real GPU/WebGL rendering proof
- **Validation method:** Load deployed GitHub Pages build in a real WebGL browser, visit all seven machine rooms, confirm rendered scene and existing controls
- **Last checked:** revision 2
- **Status:** active
- **Recheck trigger:** Three.js version, visualization code, machine DOM structure, or deployment change
<!-- /operational-state:entry -->

## 8. Unknown or Evidence-Stale State

Real GPU rendering, visual correctness, frame-time behavior, and context restoration on the deployed Pages build remain unverified. Local Mac execution is also unavailable from the current runtime, so local working-copy identity and device-side browser behavior are not claimed.

## 9. Pending Work

<!-- operational-state:entry
{"id":"PEND-001","title":"Runtime browser validation","state":"pending","task":"Validate the deployed GitHub Pages build across the seven machine rooms and existing interaction paths on a real WebGL browser.","reason_pending":"CI verifies module loading and no-WebGL fallback but not actual GPU rendering.","dependency":"Candidate merged and deployed to Pages","priority":"high","validation_needed":"WebGL scene presence, no console-fatal errors, controls remain usable, context-loss path behaves correctly","blocks_completion":true}
-->
### PEND-001 — Runtime browser validation
- **State:** `pending`
- **Task:** Validate the deployed GitHub Pages build across the seven machine rooms and existing interaction paths on a real WebGL browser.
- **Reason pending:** CI verifies module loading and no-WebGL fallback but not actual GPU rendering.
- **Dependency:** Candidate merged and deployed to Pages
- **Priority:** high
- **Validation needed:** WebGL scene presence, no fatal errors, controls remain usable, context-loss path behaves correctly
- **Blocks completion:** true
<!-- /operational-state:entry -->

<!-- operational-state:entry
{"id":"PEND-002","title":"State-driven Three.js projection","state":"pending","task":"Make DEIMOS the reference implementation for canonical game state projecting into physical Three.js state without moving gameplay authority into the renderer.","reason_pending":"Phase 1 runtime foundation is now verified in CI and the next approved architecture step is the MachineState-to-PhysicalState bridge.","dependency":"VFY-001","priority":"high","validation_needed":"Focused projection tests plus unchanged core/browser QA","blocks_completion":false}
-->
### PEND-002 — State-driven Three.js projection
- **State:** `pending`
- **Task:** Make DEIMOS the reference implementation for canonical game state projecting into physical Three.js state without moving gameplay authority into the renderer.
- **Reason pending:** Phase 1 runtime foundation is now verified in CI and the next approved architecture step is the MachineState → PhysicalState bridge.
- **Dependency:** VFY-001
- **Priority:** high
- **Validation needed:** Focused projection tests plus unchanged core/browser QA
- **Blocks completion:** false
<!-- /operational-state:entry -->

## 10. Active Decisions, Defaults, and Prohibitions

- Use Three.js as a physical projection layer over the existing application rather than rewriting the puzzle engine.
- Preserve the institutional dark-green, bone, brass, and oxide visual language.
- Respect `prefers-reduced-motion` by dramatically slowing ambient 3D motion.
- Pin runtime Three.js to `0.186.0` until a deliberate version migration is separately validated.
- Prepare and serve Three.js runtime files locally from the deployed artifact. Do not hotlink third-party runtime modules.
- Maintain one renderer and one animation-loop owner.
- Canonical puzzle/state/navigation truth remains in the existing store and machine modules; Three.js may consume projections and request semantic actions, but may not become the sole state authority.

## 11. Validation and Evidence Matrix

| ID | Capability / invariant | State | Evidence | Required validation | Recheck trigger |
| --- | --- | --- | --- | --- | --- |
| INV-001 | Existing game behavior preserved | verified | CI core QA 74/74; browser QA 29/29 at `90b3a8e` | Re-run affected QA on every logic/controller change | Logic/controller change |
| INV-002 | Canonical state remains outside Three.js | requested | Architecture contract + existing store ownership | Projection tests and source trace | 3D state/action bridge change |
| VFY-001 | Local Three runtime + graceful fallback | verified | CI run `35278558524` including resilience QA | Re-run Three runtime QA | Runtime/deploy change |
| UNV-001 | Seven real GPU machine views | implemented-unverified | Source + module load proof | Real WebGL browser traversal | 3D/deploy change |
| PEND-001 | Deployed real-browser validation | pending | Not yet observed | Full deployed browser path | Candidate deployment |
| PEND-002 | State-driven DEIMOS projection | pending | Approved next architecture slice | Focused adapter + browser regression tests | State projection implementation |

## 12. Current Change Scope and Impact Radius

Current verified Phase 1 scope: local Three.js runtime preparation, one managed renderer/animation-loop owner, graceful WebGL fallback, context-loss handling, CI coverage, and Pages preparation. Next allowed slice: add a read-only canonical-state projection bridge and make DEIMOS physically reflect orientation and safe state. Protected area: puzzle rules, persistence schema, room gating, archive, notebook, endings, and semantic controls.

## 13. Compact Revision Log

- **r1 — 2026-09-17:** Bootstrapped operational state for the first Three.js visualization upgrade. Recorded source-level preservation evidence, 3D implementation state, CDN dependency, and outstanding browser validation.
- **r2 — 2026-09-17:** Promoted Phase 1 runtime foundation to CI-verified after run `35278558524`; removed obsolete CDN delivery assumption; added canonical-state authority invariant and queued DEIMOS as the reference state-driven 3D projection.
