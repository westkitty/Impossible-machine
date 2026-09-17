import { defaultState } from '../src/state/store.js';
import {
  projectChronostatState,
  projectDeimosState,
  projectMachineState
} from '../src/three/machine-state.js';

const failures = [];
function assert(condition, message) {
  if (condition) console.log('  PASS', message);
  else {
    failures.push(message);
    console.error('  FAIL', message);
  }
}

// DEIMOS
const base = defaultState();
const initial = projectDeimosState(base);
assert(initial.orientationIndex === 0, 'DEIMOS initial orientation projects as 0');
assert(initial.orientationRadians === 0, 'DEIMOS initial physical rotation is zero');
assert(initial.safeOpen === false, 'DEIMOS safe begins closed');
assert(initial.phase === 'dormant', 'DEIMOS initial phase is dormant');

base.machines.deimos.orientation = 5;
const aligned = projectDeimosState(base);
assert(aligned.triggerAligned === true, 'DEIMOS orientation 5 projects as the CEILING trigger alignment');
assert(Math.abs(aligned.orientationRadians - (5 * Math.PI / 4)) < 1e-12, 'DEIMOS orientation 5 projects to the expected physical angle');
assert(aligned.phase === 'engaged', 'DEIMOS aligned-but-unopened state remains engaged');

base.machines.deimos.safeOpen = true;
const opened = projectMachineState('deimos', base);
assert(opened.safeOpen === true, 'DEIMOS persistent safe-open state projects into Three.js state');
assert(opened.phase === 'aftermath', 'DEIMOS opened state projects into aftermath phase');
assert(Object.isFrozen(opened), 'DEIMOS projection object is immutable');

base.machines.deimos.orientation = 999;
const bounded = projectDeimosState(base);
assert(bounded.orientationIndex === 7, 'DEIMOS invalid high orientation is bounded before rendering');

// CHRONOSTAT
const chron = defaultState();
const chronBefore = JSON.stringify(chron);
const chronInitial = projectChronostatState(chron);
assert(chronInitial.roundTrips === 0, 'CHRONOSTAT begins with zero completed round trips');
assert(chronInitial.shift === 0, 'CHRONOSTAT begins at shift zero');
assert(chronInitial.waitingForReply === false, 'CHRONOSTAT begins without a reply in flight');
assert(chronInitial.signalStrength === 0, 'CHRONOSTAT begins with zero projected signal strength');
assert(chronInitial.phase === 'dormant', 'CHRONOSTAT initial phase is dormant');

chron.machines.chronostat.sent.push({ ch: 'A' });
const waiting = projectChronostatState(chron);
assert(waiting.waitingForReply === true, 'CHRONOSTAT sent-without-reply projects as waiting');
assert(waiting.phase === 'unstable', 'CHRONOSTAT reply-in-flight projects as unstable');

chron.machines.chronostat.inbox.push({ rawFuture: 'HELLO YOU ARE EARLY' });
chron.machines.chronostat.roundTrips = 3;
chron.machines.chronostat.shift = 3;
const drifted = projectChronostatState(chron);
assert(drifted.waitingForReply === false, 'CHRONOSTAT matched send/inbox counts clear reply-in-flight state');
assert(drifted.drift === true, 'CHRONOSTAT nonzero shift projects as temporal drift');
assert(Math.abs(drifted.signalStrength - 0.5) < 1e-12, 'CHRONOSTAT three round trips project to half signal strength');
assert(Math.abs(drifted.phaseOffsetRadians - (3 * Math.PI * 2 / 7)) < 1e-12, 'CHRONOSTAT shift projects to the expected seven-phase angle');
assert(drifted.phase === 'engaged', 'CHRONOSTAT completed round trips project as engaged');

chron.machines.chronostat.roundTrips = 6;
chron.machines.chronostat.shift = 6;
chron.machines.chronostat.unlockedVerb = true;
const unlocked = projectMachineState('chronostat', chron);
assert(unlocked.unlockedVerb === true, 'CHRONOSTAT canonical Verboten unlock projects into Three.js state');
assert(unlocked.signalStrength === 1, 'CHRONOSTAT six round trips project to full signal strength');
assert(unlocked.phase === 'aftermath', 'CHRONOSTAT unlocked state projects into aftermath phase');
assert(Object.isFrozen(unlocked), 'CHRONOSTAT projection object is immutable');

chron.machines.chronostat.roundTrips = 999;
chron.machines.chronostat.shift = 999;
const chronBounded = projectChronostatState(chron);
assert(chronBounded.roundTrips === 6, 'CHRONOSTAT invalid high round-trip count is bounded before rendering');
assert(chronBounded.shift === 6, 'CHRONOSTAT invalid high shift is bounded before rendering');

const unknown = projectMachineState('unknown-machine', base);
assert(unknown.phase === 'idle', 'unknown machines receive inert projection state');

const fresh = defaultState();
const freshBefore = JSON.stringify(fresh);
projectDeimosState(fresh);
projectChronostatState(fresh);
assert(JSON.stringify(fresh) === freshBefore, 'machine projections do not mutate canonical state');
assert(chronBefore !== JSON.stringify(chron), 'CHRONOSTAT test fixture itself changed as expected');

console.log(`MACHINE STATE QA: ${failures.length} failure(s)`);
if (failures.length) process.exit(1);
