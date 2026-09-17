// qa/three-lifecycle.mjs
import {
  selectQualityTier,
  pixelRatioForTier,
  targetFrameMsForTier,
  parallaxScaleForTier,
  composePauseReasons
} from '../src/three/runtime-policy.js';

const failures = [];
const assert = (condition, message) => {
  if (condition) console.log('  PASS', message);
  else { failures.push(message); console.error('  FAIL', message); }
};

assert(
  selectQualityTier({ reducedMotion: true, devicePixelRatio: 3, hardwareConcurrency: 16, deviceMemory: 16, pixelArea: 1_000_000 }) === 'ECO',
  'reduced motion deterministically selects ECO'
);
assert(
  selectQualityTier({ devicePixelRatio: 2, pixelArea: 600_000 }) === 'STANDARD',
  'unknown hardware falls back to STANDARD rather than guessing HIGH'
);
assert(
  selectQualityTier({ devicePixelRatio: 2, hardwareConcurrency: 4, deviceMemory: 8, pixelArea: 500_000 }) === 'ECO',
  'constrained CPU selects ECO'
);
assert(
  selectQualityTier({ devicePixelRatio: 1.5, hardwareConcurrency: 12, deviceMemory: 16, pixelArea: 800_000 }) === 'HIGH',
  'strong hardware with moderate viewport can select HIGH'
);
assert(pixelRatioForTier('ECO', 3) === 1, 'ECO caps DPR at 1.0');
assert(pixelRatioForTier('STANDARD', 3) === 1.25, 'STANDARD caps DPR at 1.25');
assert(pixelRatioForTier('HIGH', 3) === 1.75, 'HIGH caps DPR at 1.75');
assert(targetFrameMsForTier('ECO') > 30, 'ECO targets approximately 30 fps');
assert(targetFrameMsForTier('STANDARD') === 0, 'STANDARD does not impose a lower cadence');
assert(parallaxScaleForTier('ECO') < parallaxScaleForTier('HIGH'), 'ECO reduces incidental parallax work');

const paused = composePauseReasons({ contextLost: true, documentHidden: true, viewportVisible: false });
assert(paused.length === 3, 'pause reasons compose rather than overwrite each other');
assert(paused.includes('context-lost'), 'context loss is a pause reason');
assert(paused.includes('document-hidden'), 'document visibility is a pause reason');
assert(paused.includes('offscreen'), 'offscreen visibility is a pause reason');
assert(composePauseReasons({ viewportVisible: true }).length === 0, 'visible healthy runtime has no pause reasons');

if (failures.length) {
  console.error(`THREE LIFECYCLE QA: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('THREE LIFECYCLE QA: all checks passed.');
