# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 3,
  "last_updated": "2026-09-17T21:54:00Z",
  "current_baseline": {
    "identity": "upgrade/threejs-phase1-runtime at c398ddb28dfea997d602c6854a21146bade4e2d8",
    "state": "partially-verified",
    "last_verified": "GitHub Actions QA run 35279064703"
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs the repository `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

The active upgrade branch preserves the original mystery application while providing a pinned local Three.js runtime, one managed renderer/animation-loop owner, explicit WebGL fallback behavior, context-loss handling, CI coverage, and the first canonical-state-driven physical machine implementation: DEIMOS.

## 3. Artifact Contract

Preserve the existing mystery, room traversal, state persistence, archive, notebook, endings, and machine puzzle controls. Three-dimensional rendering is an enhancement and physical projection layer, not a replacement for puzzle logic or semantic DOM controls. Canonical gameplay state remains outside Three.js.

## 4. Active Invariants

<!-- operational-state:entry
{"id":"INV-001","title":"Preserve existing game behavior","state":"verified","rule":"Three.js upgrades must not replace or alter the existing puzzle/state/navigation logic unless explicitly requested.","scope":"Application controller, room traversal, machines, archive, notebook, endings","authority":"User request interpreted against existing project purpose","evidence":"GitHub Actions run 35279064703: core QA 74/74 and browser QA 29/29 passed at c398ddb28dfea997d602c6854a21146bade4e2d8","validation_method":"Run core QA and representative browser playthrough on the exact candidate SHA","last_checked":"revision 3","status":"active","recheck_trigger":"Any controller, machine logic, navigation, storage, archive, notebook, or ending change"}
-->
### INV-001 — Preserve existing game behavior
- **State:** `verified`
- **Rule:** Three.js upgrades must not replace or alter the existing puzzle/state/navigation logic unless explicitly requested.
- **Scope:** Application controller, room traversal, machines, archive, notebook, endings
- **Authority:** User request interpreted against existing project purpose
- **Evidence:** GitHub Actions run `35279064703`: core QA **74/74** and browser QA **29/29** passed at `c398ddb28dfea997d602c6854a21146bade4e2d8`
- **Validation method:** Run core QA and representative browser playthrough on the exact candidate SHA
- **Last checked:** revision 3
- **Status:** active
- **Recheck trigger:** Any controller, machine logic, navigation, storage, archive, notebook, or ending change
<!-- /operational-state:entry -->

<!-- operational-state:entry
{"id":"INV-002","title":"Canonical state remains outside Three.js","state":"partially-verified","rule":"Three.js objects, transforms, materials, and animations are derived presentation state and must never become the sole authority for puzzle progress, navigation gates, saves, discoveries, or endings.","scope":"Three.js runtime and all machine-state adapters","authority":"Approved Three.js architecture direction","evidence":"DEIMOS uses src/three/machine-state.js as a frozen read-only projection; qa/machine-state.mjs proves projection does not mutate canonical state; core/browser QA remain green in run 35279064703","validation_method":"Repeat the same read-only projection contract and focused tests for every added machine adapter and any future 3D-to-gameplay action","last_checked":"revision 3","status":"active","recheck_trigger":"Any state-driven 3D interaction or 3D-to-gameplay action"}
-->
### INV-002 — Canonical state remains outside Three.js
- **State:** `partially-verified`
- **Rule:** Three.js objects, transforms, materials, and animations are derived presentation state and must never become the sole authority for puzzle progress, navigation gates, saves, discoveries, or endings.
- **Scope:** Three.js runtime and all machine-state adapters
- **Authority:** Approved Three.js architecture direction
- **Evidence:** DEIMOS uses `src/three/machine-state.js` as a frozen read-only projection; `qa/machine-state.mjs` proves projection does not mutate canonical state; core/browser QA remain green in run `35279064703`
- **Validation method:** Repeat the same read-only projection contract and focused tests for every added machine adapter and any future 3D-to-gameplay action
- **Last checked:** revision 3
- **Status:** active
- **Recheck trigger:** Any state-driven 3D interaction or 3D-to-gameplay action
<!-- /operational-state:entry -->

## 5. Verified Working Behavior

<!-- operational-state:entry
{"id":"VFY-001","title":"Three.js runtime preparation and graceful fallback","state":"verified","capability":"Pinned three@0.186.0 is prepared locally with both three.module.js and its three.core.js dependency; the browser app retains original controls when WebGL is unavailable; one managed renderer path owns animation.","scope":"package.json, scripts/prepare-three.mjs, src/three/machine-scenes.js, CI and Pages workflows","evidence":"GitHub Actions run 35279064703 completed successfully including Three.js resilience QA","validation_method":"Clean CI install, prepare local Three runtime, core QA, browser QA, and Three.js fallback QA","last_checked":"revision 3","status":"active","recheck_trigger":"Three.js version, runtime preparation, renderer lifecycle, fallback, or deployment workflow change"}
-->
### VFY-001 — Three.js runtime preparation and graceful fallback
- **State:** `verified`
- **Capability:** Pinned `three@0.186.0` is prepared locally with both `three.module.js` and its `three.core.js` dependency; the browser app retains original controls when WebGL is unavailable; one managed renderer path owns animation.
- **Scope:** `package.json`, `scripts/prepare-three.mjs`, `src/three/machine-scenes.js`, CI and Pages workflows
- **Evidence:** GitHub Actions run `35279064703` completed successfully including Three.js resilience QA
- **Validation method:** Clean CI install, prepare local Three runtime, core QA, browser QA, and Three.js fallback QA
- **Last checked:** revision 3
- **Status:** active
- **Recheck trigger:** Three.js version, runtime preparation, renderer lifecycle, fallback, or deployment workflow change
<!-- /operational-state:entry -->

<!-- operational-state:entry
{"id":"VFY-002","title":"DEIMOS canonical state projection contract","state":"verified","capability":"DEIMOS orientation and persistent safe-open state are converted by a pure read-only projector into immutable presentation state; the Three.js controller consumes that projection rather than owning puzzle truth.","scope":"src/three/machine-state.js, src/three/machine-scenes.js, src/app.js, qa/machine-state.mjs","evidence":"GitHub Actions run 35279064703: Three.js state projection QA passed all 14 checks; core QA 74/74, browser QA 29/29, and Three.js resilience QA also passed","validation_method":"Projection-unit checks plus unchanged core/browser/runtime QA","last_checked":"revision 3","status":"active","recheck_trigger":"DEIMOS projection, canonical store bridge, or state authority change"}
-->
### VFY-002 — DEIMOS canonical state projection contract
- **State:** `verified`
- **Capability:** DEIMOS orientation and persistent safe-open state are converted by a pure read-only projector into immutable presentation state; the Three.js controller consumes that projection rather than owning puzzle truth.
- **Scope:** `src/three/machine-state.js`, `src/three/machine-scenes.js`, `src/app.js`, `qa/machine-state.mjs`
- **Evidence:** GitHub Actions run `35279064703`: Three.js state projection QA passed all **14** checks; core QA **74/74**, browser QA **29/29**, and Three.js resilience QA also passed
- **Validation method:** Projection-unit checks plus unchanged core/browser/runtime QA
- **Last checked:** revision 3
- **Status:** active
- **Recheck trigger:** DEIMOS projection, canonical store bridge, or state authority change
<!-- /operational-state:entry -->

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

<!-- operational-state:entry
{"id":"UNV-001","title":"Seven Three.js machine views on real GPU path","state":"implemented-unverified","capability":"Procedural WebGL views exist for DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL while their DOM controls remain intact.","scope":"src/three/machine-scenes.js","evidence":"Source implementation and CI module-loading/fallback proof exist; CI does not provide real GPU/WebGL rendering proof","validation_method":"Load deployed GitHub Pages build in a real WebGL browser, visit all seven machine rooms, confirm rendered scene and existing controls","last_checked":"revision 3","status":"active","recheck_trigger":"Three.js version, visualization code, machine DOM structure, or deployment change"}
-->
### UNV-001 — Seven Three.js machine views on real GPU path
- **State:** `implemented-unverified`
- **Capability:** Procedural WebGL views exist for all seven machines while existing controls remain intact.
- **Scope:** `src/three/machine-scenes.js`
- **Evidence:** Source implementation and CI module-loading/fallback proof exist; CI does not provide real GPU/WebGL rendering proof
- **Validation method:** Load deployed GitHub Pages build in a real WebGL browser, visit all seven machine rooms, confirm rendered scene and existing controls
- **Last checked:** revision 3
- **Status:** active
- **Recheck trigger:** Three.js version, visualization code, machine DOM structure, or deployment change
<!-- /operational-state:entry -->

<!-- operational-state:entry
{"id":"UNV-002","title":"DEIMOS physical GPU presentation","state":"implemented-unverified","capability":"DEIMOS has a state-driven orientation frame, modeled safe body/door/handle, persistent open-door target, and restrained CEILING-alignment cue in the real Three.js scene.","scope":"src/three/machine-scenes.js","evidence":"Source implementation is present and all non-GPU CI gates pass at c398ddb28dfea997d602c6854a21146bade4e2d8","validation_method":"Observe DEIMOS in a real WebGL browser while cycling orientation through 0..7 and opening the safe at CEILING; verify the door remains open after later orientation changes","last_checked":"revision 3","status":"active","recheck_trigger":"DEIMOS scene geometry, animation, projection, renderer, or deployed asset change"}
-->
### UNV-002 — DEIMOS physical GPU presentation
- **State:** `implemented-unverified`
- **Capability:** DEIMOS has a state-driven orientation frame, modeled safe body/door/handle, persistent open-door target, and restrained CEILING-alignment cue in the real Three.js scene.
- **Scope:** `src/three/machine-scenes.js`
- **Evidence:** Source implementation is present and all non-GPU CI gates pass at `c398ddb28dfea997d602c6854a21146bade4e2d8`
- **Validation method:** Observe DEIMOS in a real WebGL browser while cycling orientation through `0..7` and opening the safe at CEILING; verify the door remains open after later orientation changes
- **Last checked:** revision 3
- **Status:** active
- **Recheck trigger:** DEIMOS scene geometry, animation, projection, renderer, or deployed asset change
<!-- /operational-state:entry -->

## 8. Unknown or Evidence-Stale State

Real GPU rendering, visual correctness, frame-time behavior, and context restoration on the deployed Pages build remain unverified. Local Mac execution is also unavailable from the current runtime, so local working-copy identity and device-side browser behavior are not claimed.

## 9. Pending Work

<!-- operational-state:entry
{"id":"PEND-001","title":"Runtime browser validation","state":"pending","task":"Validate the deployed GitHub Pages build across the seven machine rooms and existing interaction paths on a real WebGL browser.","reason_pending":"CI verifies module loading, canonical state projection, and no-WebGL fallback but not actual GPU rendering.","dependency":"Candidate merged and deployed to Pages","priority":"high","validation_needed":"WebGL scene presence, DEIMOS state-driven motion/safe persistence, no console-fatal errors, controls remain usable, context-loss path behaves correctly","blocks_completion":true}
-->
### PEND-001 — Runtime browser validation
- **State:** `pending`
- **Task:** Validate the deployed GitHub Pages build across the seven machine rooms and existing interaction paths on a real WebGL browser.
- **Reason pending:** CI verifies module loading, canonical state projection, and no-WebGL fallback but not actual GPU rendering.
- **Dependency:** Candidate merged and deployed to Pages
- **Priority:** high
- **Validation needed:** WebGL scene presence, DEIMOS state-driven motion/safe persistence, no fatal errors, controls remain usable, context-loss path behaves correctly
- **Blocks completion:** true
<!-- /operational-state:entry -->

<!-- operational-state:entry
{"id":"PEND-002","title":"State-driven Three.js projection","state":"partially-verified","task":"Extend the verified DEIMOS read-only projection architecture to CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL without moving gameplay authority into the renderer.","reason_pending":"DEIMOS reference contract is CI-verified; six machines still use presentation-only procedural motion.","dependency":"VFY-002","priority":"high","validation_needed":"Focused projector tests per machine plus unchanged core/browser/runtime QA and later real GPU validation","blocks_completion":false}
-->
### PEND-002 — State-driven Three.js projection
- **State:** `partially-verified`
- **Task:** Extend the verified DEIMOS read-only projection architecture to CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL without moving gameplay authority into the renderer.
- **Reason pending:** DEIMOS reference contract is CI-verified; six machines still use presentation-only procedural motion.
- **Dependency:** VFY-002
- **Priority:** high
- **Validation needed:** Focused projector tests per machine plus unchanged core/browser/runtime QA and later real GPU validation
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
- Use `docs/THREEJS_STATE_CONTRACT.md` as the explicit authority graph and projection contract for future machine integrations.

## 11. Validation and Evidence Matrix

| ID | Capability / invariant | State | Evidence | Required validation | Recheck trigger |
| --- | --- | --- | --- | --- | --- |
| INV-001 | Existing game behavior preserved | verified | CI core QA 74/74; browser QA 29/29 at `c398ddb` | Re-run affected QA on every logic/controller change | Logic/controller change |
| INV-002 | Canonical state remains outside Three.js | partially-verified | DEIMOS immutable projector + 14/14 projection QA | Repeat projector contract for each machine/action bridge | 3D state/action bridge change |
| VFY-001 | Local Three runtime + graceful fallback | verified | CI run `35279064703` including resilience QA | Re-run Three runtime QA | Runtime/deploy change |
| VFY-002 | DEIMOS canonical projection contract | verified | CI run `35279064703`, all state-projection checks green | Re-run projection + browser QA | DEIMOS/store bridge change |
| UNV-001 | Seven real GPU machine views | implemented-unverified | Source + module-load proof | Real WebGL browser traversal | 3D/deploy change |
| UNV-002 | DEIMOS physical GPU presentation | implemented-unverified | Source + non-GPU CI proof | Real WebGL DEIMOS interaction | DEIMOS 3D/deploy change |
| PEND-001 | Deployed real-browser validation | pending | Not yet observed | Full deployed browser path | Candidate deployment |
| PEND-002 | All seven state-driven projections | partially-verified | DEIMOS complete; six remain | Focused adapters/tests for remaining machines | New machine projection |

## 12. Current Change Scope and Impact Radius

Verified in CI on this branch: pinned local Three.js runtime preparation, one managed renderer/animation-loop owner, graceful WebGL fallback, context-loss handling, CI coverage, explicit source-of-truth contract, immutable machine-state projection infrastructure, and DEIMOS canonical state projection. Protected area remains puzzle rules, persistence schema, room gating, archive, notebook, endings, and semantic controls. The next bounded implementation slice after this checkpoint is CHRONOSTAT state projection, not the full facility rewrite.

## 13. Compact Revision Log

- **r1 — 2026-09-17:** Bootstrapped operational state for the first Three.js visualization upgrade. Recorded source-level preservation evidence, 3D implementation state, CDN dependency, and outstanding browser validation.
- **r2 — 2026-09-17:** Promoted Phase 1 runtime foundation to CI-verified after run `35278558524`; removed obsolete CDN delivery assumption; added canonical-state authority invariant and queued DEIMOS as the reference state-driven 3D projection.
- **r3 — 2026-09-17:** Promoted the DEIMOS read-only state projection contract after run `35279064703`; added explicit source-of-truth documentation and focused projection regression coverage; kept the real GPU visual path unverified pending deployed-browser observation.
