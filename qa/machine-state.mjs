import { defaultState } from '../src/state/store.js';
import {
  projectAtlasState,
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

// ATLAS
const atlas = defaultState();
const atlasBefore = JSON.stringify(atlas);
const atlasInitial = projectAtlasState(atlas);
assert(atlasInitial.strokeCount === 0, 'ATLAS begins with no projected strokes');
assert(atlasInitial.lockedShapeCount === 0, 'ATLAS begins with no locked topology');
assert(atlasInitial.latestLockedPath.length === 0, 'ATLAS begins without a physical coastline path');
assert(atlasInitial.phase === 'dormant', 'ATLAS initial phase is dormant');

atlas.machines.atlas.strokes.push({
  id: 'draft',
  locked: false,
  t0: Date.now(),
  points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
});
const atlasDraft = projectAtlasState(atlas);
assert(atlasDraft.strokeCount === 1, 'ATLAS projects canonical draft stroke count');
assert(atlasDraft.draftStrokeCount === 1, 'ATLAS distinguishes unlocked draft strokes');
assert(atlasDraft.latestLockedPath.length === 0, 'ATLAS draft strokes do not become permanent coastline paths');
assert(atlasDraft.phase === 'engaged', 'ATLAS drawing activity projects as engaged');

const lockedPoints = Array.from({ length: 100 }, (_, index) => ({
  x: index === 0 ? -1 : index / 99,
  y: index === 99 ? 2 : (Math.sin(index / 99 * Math.PI * 2) + 1) / 2
}));
atlas.machines.atlas.strokes.push({
  id: 'locked',
  locked: true,
  t0: Date.now(),
  points: lockedPoints
});
atlas.machines.atlas.lockedShapes = 1;
const atlasLocked = projectAtlasState(atlas);
assert(atlasLocked.lockedStrokeCount === 1, 'ATLAS projects locked canonical stroke count');
assert(atlasLocked.lockedShapeCount === 1, 'ATLAS projects canonical locked shape count');
assert(atlasLocked.latestLockedPath.length === 48, 'ATLAS bounds the physical coastline sample to 48 points');
assert(atlasLocked.latestLockedPath[0].x === 0, 'ATLAS clamps projected coastline coordinates');
assert(atlasLocked.latestLockedPath[atlasLocked.latestLockedPath.length - 1].y === 1, 'ATLAS clamps projected coastline end coordinates');
assert(Object.isFrozen(atlasLocked.latestLockedPath), 'ATLAS projected coastline array is immutable');
assert(Object.isFrozen(atlasLocked.latestLockedPath[0]), 'ATLAS projected coastline points are immutable');
assert(Math.abs(atlasLocked.topologyStrength - (1 / 3)) < 1e-12, 'ATLAS one locked shape projects to one-third topology strength');

atlas.machines.atlas.openedSundial = true;
const atlasSolved = projectMachineState('atlas', atlas);
assert(atlasSolved.openedSundial === true, 'ATLAS canonical Sundial unlock projects into Three.js state');
assert(atlasSolved.phase === 'aftermath', 'ATLAS Sundial unlock projects as aftermath');
assert(Object.isFrozen(atlasSolved), 'ATLAS projection object is immutable');
assert(atlasBefore !== JSON.stringify(atlas), 'ATLAS test fixture itself changed as expected');

const unknown = projectMachineState('unknown-machine', base);
assert(unknown.phase === 'idle', 'unknown machines receive inert projection state');

const fresh = defaultState();
const freshBefore = JSON.stringify(fresh);
projectDeimosState(fresh);
projectChronostatState(fresh);
projectAtlasState(fresh);
assert(JSON.stringify(fresh) === freshBefore, 'machine projections do not mutate canonical state');
assert(chronBefore !== JSON.stringify(chron), 'CHRONOSTAT test fixture itself changed as expected');

console.log(`MACHINE STATE QA: ${failures.length} failure(s)`);
if (failures.length) process.exit(1);
