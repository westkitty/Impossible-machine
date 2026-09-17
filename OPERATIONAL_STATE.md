# Operational State

<!-- operational-state:metadata
{
  "schema_version": 1,
  "project_id": "impossible-machine",
  "project_name": "The Department of Impossible Machines",
  "project_root": ".",
  "artifact_path": "",
  "state_revision": 1,
  "last_updated": "2026-09-17T20:55:00Z",
  "current_baseline": {
    "identity": "main at a624e6fb412a167acba614b070bf4d93d6c75975",
    "state": "implemented-unverified",
    "last_verified": null
  },
  "scope_boundaries": ["Browser mystery application and GitHub Pages deployment"],
  "linked_parent_state": null
}
-->

## 1. Project Identity and Scope

The Department of Impossible Machines is a browser mystery set in Facility 7-B. This state file governs the repository `westkitty/Impossible-machine` and its GitHub Pages deployment.

## 2. Current Baseline

`main` includes the original application controller and puzzle behavior plus a Three.js visualization layer for the seven machine interfaces.

## 3. Artifact Contract

Preserve the existing mystery, room traversal, state persistence, archive, notebook, endings, and machine puzzle controls. Three-dimensional rendering is an enhancement layer, not a replacement for puzzle logic or semantic DOM controls.

## 4. Active Invariants

<!-- operational-state:entry
{"id":"INV-001","title":"Preserve existing game behavior","state":"requested","rule":"Three.js upgrades must not replace or alter the existing puzzle/state/navigation logic unless explicitly requested.","scope":"Application controller, room traversal, machines, archive, notebook, endings","authority":"User request interpreted against existing project purpose","evidence":"Three.js upgrade requested for the existing live project","validation_method":"Compare controller diff to pre-upgrade baseline and run existing QA/user paths","last_checked":"revision 1","status":"active","recheck_trigger":"Any controller, machine logic, navigation, storage, archive, notebook, or ending change"}
-->
### INV-001 — Preserve existing game behavior
- **State:** `requested`
- **Rule:** Three.js upgrades must not replace or alter the existing puzzle/state/navigation logic unless explicitly requested.
- **Scope:** Application controller, room traversal, machines, archive, notebook, endings
- **Authority:** User request interpreted against existing project purpose
- **Evidence:** Three.js upgrade requested for the existing live project
- **Validation method:** Compare controller diff to pre-upgrade baseline and run existing QA/user paths
- **Last checked:** revision 1
- **Status:** active
- **Recheck trigger:** Any controller, machine logic, navigation, storage, archive, notebook, or ending change
<!-- /operational-state:entry -->

## 5. Verified Working Behavior

None promoted in this revision; prior behavior was preserved by source diff but not re-executed in a real browser during this change.

## 6. Known Not Working

None established from current evidence.

## 7. Implemented but Unverified

<!-- operational-state:entry
{"id":"UNV-001","title":"Seven Three.js machine views","state":"implemented-unverified","capability":"Procedural WebGL views are mounted for DEIMOS, CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL while their DOM controls remain intact.","scope":"src/three/machine-scenes.js","evidence":"Source implementation at main; Three.js 0.186.0 browser module path externally verified","validation_method":"Load deployed GitHub Pages build, visit each machine room, confirm WebGL render and existing controls","last_checked":"revision 1","status":"active","recheck_trigger":"Three.js version, visualization code, machine DOM structure, or deployment change"}
-->
### UNV-001 — Seven Three.js machine views
- **State:** `implemented-unverified`
- **Capability:** Procedural WebGL views are mounted for all seven machines while existing controls remain intact.
- **Scope:** `src/three/machine-scenes.js`
- **Evidence:** Source implementation at `main`; Three.js 0.186.0 browser module path externally verified
- **Validation method:** Load deployed GitHub Pages build, visit each machine room, confirm WebGL render and existing controls
- **Last checked:** revision 1
- **Status:** active
- **Recheck trigger:** Three.js version, visualization code, machine DOM structure, or deployment change
<!-- /operational-state:entry -->

## 8. Unknown or Evidence-Stale State

Browser/GPU runtime behavior on the deployed Pages build remains unknown until the final deployment completes and a real rendered path is observed.

## 9. Pending Work

<!-- operational-state:entry
{"id":"PEND-001","title":"Runtime browser validation","state":"pending","task":"Validate the deployed GitHub Pages build across the seven machine rooms and existing interaction paths.","reason_pending":"Current connector can verify source and deployment workflow state but not execute the full interactive browser QA path.","dependency":"Latest Pages deployment available","priority":"high","validation_needed":"WebGL scene presence, no console-fatal module load errors, machine controls remain usable","blocks_completion":true}
-->
### PEND-001 — Runtime browser validation
- **State:** `pending`
- **Task:** Validate the deployed GitHub Pages build across the seven machine rooms and existing interaction paths.
- **Reason pending:** Current evidence does not include full interactive browser execution.
- **Dependency:** Latest Pages deployment available
- **Priority:** high
- **Validation needed:** WebGL scene presence, no fatal module-load errors, machine controls remain usable
- **Blocks completion:** true
<!-- /operational-state:entry -->

## 10. Active Decisions, Defaults, and Prohibitions

- Use Three.js as a visualization layer over the existing application rather than rewriting the puzzle engine.
- Preserve the institutional dark-green, bone, brass, and oxide visual language.
- Respect `prefers-reduced-motion` by dramatically slowing ambient 3D motion.
- Current Three.js delivery uses the version-pinned jsDelivr ES module `three@0.186.0/build/three.module.js`; this introduces a network dependency for 3D rendering.

## 11. Validation and Evidence Matrix

| ID | Capability / invariant | State | Evidence | Required validation | Recheck trigger |
| --- | --- | --- | --- | --- | --- |
| INV-001 | Existing game behavior preserved | partially-verified | Baseline-to-head source comparison shows controller changed only to import 3D layer | Existing QA plus representative browser paths | Logic/controller change |
| UNV-001 | Seven Three.js machine views | implemented-unverified | Source present; module URL verified | Visit all seven machine rooms on deployed Pages build | 3D/deploy change |
| PEND-001 | Runtime browser validation | pending | Not yet observed | Full deployed browser path | Latest deployment |

## 12. Current Change Scope and Impact Radius

Allowed change: add a Three.js visualization module and import it from `src/app.js`. Protected area: all existing application/game logic. Impact radius: machine DOM rendering lifecycle, browser GPU/WebGL availability, Pages asset loading, reduced-motion behavior, and performance while navigating between rooms.

## 13. Compact Revision Log

- **r1 — 2026-09-17:** Bootstrapped operational state for the Three.js upgrade. Recorded source-level preservation evidence, 3D implementation state, CDN dependency, and outstanding browser validation.
