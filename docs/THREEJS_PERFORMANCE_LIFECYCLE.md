# Three.js Performance & Lifecycle Certificate

## Verdict

**PASS for the bounded Galaxy Tab S9 Ultra DEIMOS scenario.** The evidence does not yet justify a project-wide performance PASS because six machine scenes and long-session thermal behavior remain unmeasured.

## Tested baseline

- Repository: `westkitty/Impossible-machine`
- Deployed runtime commit: `4bd988b1035c998dbe1ceabe89d19cc555d2f20b`
- Pages: `https://westkitty.github.io/Impossible-machine/`
- Post-merge QA: `35293268314` — PASS
- Post-merge Pages: `35293268213` — PASS
- Device: Galaxy Tab S9 Ultra `SM-X910`
- Chrome: `152.0.7977.82`
- WebGL: WebGL 2 via ANGLE / Qualcomm Adreno 740
- Browser-reported hardware: 8 logical processors, 8 GB device memory
- CSS viewport during acceptance: 1244 × 630
- Browser DPR: ~2.378; runtime HIGH-tier DPR cap: 1.75

## Frame evidence

A short 175-frame retained requestAnimationFrame sample in DEIMOS measured:

| Metric | Result |
| --- | ---: |
| p50 | ~16.7 ms |
| p95 | ~16.7 ms |
| p99 | ~16.8 ms |
| max | 25 ms |
| mean | ~16.619 ms |

This supports smooth approximately 60 Hz behavior for the measured scenario. It is **not** evidence of long-session thermal stability.

## Resource lifecycle

Twenty real DEIMOS → corridor → DEIMOS cycles were executed on the deployed tablet browser.

| State | Geometries | Textures | Programs |
| --- | ---: | ---: | ---: |
| Active DEIMOS, every cycle | 9 | 1 | 2 |
| Deactivated, every cycle | 0 | 1 | 0 |

No monotonic geometry, texture, or program growth was observed. The single remaining texture was stable renderer-owned state.

## Context-loss recovery

Using the live WebGL context's `WEBGL_lose_context` extension:

- runtime reported `context-lost`;
- rendering paused with zero new frames during the lost interval;
- restoration cleared the lost state;
- rendering resumed;
- the resource envelope returned to 9 geometries / 1 texture / 2 programs;
- host status returned to `ready`.

**Result: PASS for the measured DEIMOS scenario.**

## Offscreen suspension

The live 3D host was moved outside the viewport to exercise the deployed IntersectionObserver path.

- runtime reported pause reason `offscreen`;
- frame count remained unchanged during the offscreen interval;
- rendering resumed after the host became visible.

**Result: PASS.**

## Touch inspection defect and repair

The first real-device inspection run found a concrete tablet defect:

- inspection entry worked;
- touch drag changed the actual rendered canvas;
- but the bottom-positioned RESET/CLOSE toolbar fell below the 630 px current viewport after the host expanded.

PR #9 repaired only the presentation path:

- toolbar moved from `bottom:10px` to `top:8px`;
- inspection entry now centers the expanded host in the viewport;
- regression assertions lock both behaviors.

After deployment of `4bd988b`, the same S9 Ultra touch test measured:

- expanded host: top ~168.65, bottom ~534.47;
- toolbar: top ~177.48, bottom ~212.74;
- canvas screenshot hash changed after touch drag, proving visible rendered movement;
- CLOSE center y ~172.83, inside the 630 px viewport;
- touch CLOSE returned `inspecting:false`;
- host returned to 218 px height;
- renderer remained healthy at 9 geometries / 1 texture / 2 programs.

**Result: repaired and verified on deployed S9 Ultra.**

## Remaining proof

Before treating a continuous navigable 3D Facility 7-B as fully performance-cleared:

1. exercise CHRONOSTAT, ATLAS, ARCHIVE, ORACLE, VERBOTEN, and SUNDIAL on real GPU paths;
2. inspect their resource envelopes under repeated traversal;
3. run a longer sustained session to observe thermal/frame-cadence drift;
4. repeat on another representative browser/device tier if broader support is required.

## Evidence artifact

Machine-readable measurements: `docs/evidence/S9_ULTRA_DEIMOS_RUNTIME_2026-09-18.json`.
