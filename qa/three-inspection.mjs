// qa/three-inspection.mjs
import { readFileSync } from 'node:fs';

import {
  INSPECTION_LIMITS,
  normalizeInspectionState,
  inspectionCommandForKey,
  applyInspectionDelta,
  interpolateInspectionState
} from '../src/three/inspection.js';

const source = readFileSync(new URL('../src/three/machine-scenes.js', import.meta.url), 'utf8');

const failures = [];
const assert = (condition, message) => {
  if (condition) console.log('  PASS', message);
  else { failures.push(message); console.error('  FAIL', message); }
};

const bounded = normalizeInspectionState({ yaw: Math.PI * 5, pitch: 99, distance: -20 });
assert(bounded.yaw >= -Math.PI && bounded.yaw <= Math.PI, 'yaw wraps into a bounded turn');
assert(bounded.pitch === INSPECTION_LIMITS.maxPitch, 'pitch clamps to safe maximum');
assert(bounded.distance === INSPECTION_LIMITS.minDistance, 'distance clamps to near inspection limit');

const zoomOut = applyInspectionDelta(
  { yaw: 0, pitch: 0, distance: INSPECTION_LIMITS.maxDistance },
  inspectionCommandForKey('-')
);
assert(zoomOut.distance === INSPECTION_LIMITS.maxDistance, 'keyboard zoom cannot exceed far limit');

const rotate = applyInspectionDelta(
  { yaw: 0, pitch: 0, distance: 4.8 },
  inspectionCommandForKey('ArrowRight')
);
assert(rotate.yaw > 0, 'keyboard arrow produces deterministic yaw delta');

const smooth = interpolateInspectionState(
  { yaw: 0, pitch: 0, distance: 4.8 },
  { yaw: 1, pitch: 0.5, distance: 3.2 },
  false
);
assert(smooth.yaw > 0 && smooth.yaw < 1, 'normal inspection interpolation is gradual');
assert(smooth.distance < 4.8 && smooth.distance > 3.2, 'normal camera distance interpolates gradually');

const reduced = interpolateInspectionState(
  { yaw: 0, pitch: 0, distance: 4.8 },
  { yaw: 1, pitch: 0.5, distance: 3.2 },
  true
);
assert(Math.abs(reduced.yaw - 1) < 1e-12, 'reduced-motion inspection reaches yaw target immediately');
assert(Math.abs(reduced.pitch - 0.5) < 1e-12, 'reduced-motion inspection reaches pitch target immediately');
assert(Math.abs(reduced.distance - 3.2) < 1e-12, 'reduced-motion inspection reaches distance target immediately');
assert(inspectionCommandForKey('Escape')?.action === 'close', 'Escape maps to close action');
assert(inspectionCommandForKey('R')?.action === 'reset', 'R maps to reset action');
assert(inspectionCommandForKey('x') === null, 'unrelated keys are ignored');
assert(
  source.includes('.machine-three-inspection-toolbar{display:none;position:absolute;z-index:5;right:10px;top:8px;'),
  'inspection toolbar is pinned to the visible top edge'
);
assert(
  !source.includes('.machine-three-inspection-toolbar{display:none;position:absolute;z-index:5;right:10px;bottom:10px;'),
  'inspection toolbar no longer depends on an offscreen bottom edge'
);
assert(
  source.includes("scrollIntoView?.({ block: 'center', inline: 'nearest'"),
  'inspection entry centers the expanded host in the viewport'
);

if (failures.length) {
  console.error(`THREE INSPECTION QA: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('THREE INSPECTION QA: all checks passed.');
