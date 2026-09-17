import { defaultState } from '../src/state/store.js';
import { projectDeimosState, projectMachineState } from '../src/three/machine-state.js';

const failures = [];
function assert(condition, message) {
  if (condition) console.log('  PASS', message);
  else {
    failures.push(message);
    console.error('  FAIL', message);
  }
}

const base = defaultState();
const before = JSON.stringify(base);

const initial = projectDeimosState(base);
assert(initial.orientationIndex === 0, 'DEIMOS initial orientation projects as 0');
assert(initial.orientationRadians === 0, 'DEIMOS initial physical rotation is zero');
assert(initial.safeOpen === false, 'DEIMOS safe begins closed');
assert(initial.phase === 'dormant', 'DEIMOS initial phase is dormant');

base.machines.deimos.orientation = 5;
const aligned = projectDeimosState(base);
assert(aligned.triggerAligned === true, 'orientation 5 projects as the CEILING trigger alignment');
assert(Math.abs(aligned.orientationRadians - (5 * Math.PI / 4)) < 1e-12, 'orientation 5 projects to the expected physical angle');
assert(aligned.phase === 'engaged', 'aligned-but-unopened DEIMOS remains engaged');

base.machines.deimos.safeOpen = true;
const opened = projectMachineState('deimos', base);
assert(opened.safeOpen === true, 'persistent safe-open state projects into Three.js state');
assert(opened.phase === 'aftermath', 'opened DEIMOS projects into aftermath phase');
assert(Object.isFrozen(opened), 'projection object is immutable');

base.machines.deimos.orientation = 999;
const bounded = projectDeimosState(base);
assert(bounded.orientationIndex === 7, 'invalid high orientation is bounded before rendering');

const unknown = projectMachineState('unknown-machine', base);
assert(unknown.phase === 'idle', 'unknown machines receive inert projection state');

assert(before !== JSON.stringify(base), 'test fixture itself changed as expected');
const fresh = defaultState();
const freshBefore = JSON.stringify(fresh);
projectDeimosState(fresh);
assert(JSON.stringify(fresh) === freshBefore, 'projection does not mutate canonical state');

console.log(`MACHINE STATE QA: ${failures.length} failure(s)`);
if (failures.length) process.exit(1);
