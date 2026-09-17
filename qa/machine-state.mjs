import { defaultState } from '../src/state/store.js';
import {
  projectArchiveState,
  projectAtlasState,
  projectChronostatState,
  projectDeimosState,
  projectMachineState,
  projectOracleState,
  projectSundialState,
  projectVerbotenState
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

// ARCHIVE
const archive = defaultState();
const archiveBefore = JSON.stringify(archive);
const archiveInitial = projectArchiveState(archive);
assert(archiveInitial.revealedCount === 0, 'ARCHIVE begins with no projected identities');
assert(archiveInitial.completion === 0, 'ARCHIVE begins at zero physical completion');
assert(archiveInitial.solved === false, 'ARCHIVE begins unsolved');
assert(archiveInitial.phase === 'dormant', 'ARCHIVE initial phase is dormant');

archive.machines.archive.revealed.push('harker', 'pell', 'unknown', 'pell');
const archivePartial = projectArchiveState(archive);
assert(archivePartial.revealedCount === 2, 'ARCHIVE projector keeps only unique known revealed identities');
assert(archivePartial.revealedIds.join(',') === 'harker,pell', 'ARCHIVE preserves canonical reveal identity order without inventing drag order');
assert(Math.abs(archivePartial.completion - (2 / 6)) < 1e-12, 'ARCHIVE completion reflects revealed identity count');
assert(archivePartial.allRevealed === false, 'ARCHIVE partial reveal does not project all-revealed state');
assert(archivePartial.phase === 'engaged', 'ARCHIVE partial reveal projects as engaged');
assert(Object.isFrozen(archivePartial.revealedIds), 'ARCHIVE revealed identity projection is immutable');

archive.machines.archive.revealed = ['harker', 'pell', 'doss', 'mora', 'vance', 'yuen'];
const archiveAll = projectArchiveState(archive);
assert(archiveAll.revealedCount === 6, 'ARCHIVE all six canonical identities project as revealed');
assert(archiveAll.allRevealed === true, 'ARCHIVE projects all-revealed state independently of solved order');
assert(archiveAll.completion === 1, 'ARCHIVE all six identities project full reveal completion');
assert(archiveAll.solved === false, 'ARCHIVE all-revealed does not falsely imply the ordering puzzle is solved');

archive.machines.archive.solved = true;
const archiveSolved = projectMachineState('archive', archive);
assert(archiveSolved.solved === true, 'ARCHIVE canonical solved state projects into Three.js state');
assert(archiveSolved.phase === 'aftermath', 'ARCHIVE solved state projects as aftermath');
assert(Object.isFrozen(archiveSolved), 'ARCHIVE projection object is immutable');
assert(archiveBefore !== JSON.stringify(archive), 'ARCHIVE test fixture itself changed as expected');

// ORACLE
const oracle = defaultState();
const oracleBefore = JSON.stringify(oracle);
const oracleInitial = projectOracleState(oracle);
assert(oracleInitial.placedCount === 0, 'ORACLE begins with no projected objects on the scale');
assert(oracleInitial.readingCount === 0, 'ORACLE begins with no projected readings');
assert(oracleInitial.balanceSignal === 0, 'ORACLE begins with a neutral physical balance signal');
assert(oracleInitial.phase === 'dormant', 'ORACLE initial phase is dormant');

oracle.machines.oracle.placed = ['ring', 'pulse', 'cinder', 'unknown', 'ring'];
oracle.machines.oracle.readings = {
  ring: 25,
  pulse: -50,
  cinder: 0,
  unknown: 999,
  specs: Number.NaN
};
const oracleReadings = projectOracleState(oracle);
assert(oracleReadings.placedIds.join(',') === 'ring,pulse,cinder', 'ORACLE projects only unique known placed IDs');
assert(oracleReadings.placedCount === 3, 'ORACLE placed count follows canonical placed IDs');
assert(oracleReadings.readingCount === 3, 'ORACLE counts only finite readings for placed IDs');
assert(oracleReadings.positiveReadingCount === 1, 'ORACLE projects positive reading count');
assert(oracleReadings.negativeReadingCount === 1, 'ORACLE projects negative reading count');
assert(oracleReadings.zeroReadingCount === 1, 'ORACLE projects zero reading count');
assert(Math.abs(oracleReadings.balanceSignal - (-0.25 / 3)) < 1e-12, 'ORACLE derives a bounded physical balance signal from stored readings only');
assert(oracleReadings.readingEntries[0].polarity === 'positive', 'ORACLE reading entry preserves positive polarity');
assert(oracleReadings.readingEntries[1].polarity === 'negative', 'ORACLE reading entry preserves negative polarity');
assert(oracleReadings.readingEntries[2].polarity === 'zero', 'ORACLE reading entry preserves zero polarity');
assert(Object.isFrozen(oracleReadings.placedIds), 'ORACLE placed-ID projection is immutable');
assert(Object.isFrozen(oracleReadings.readingEntries), 'ORACLE reading-entry array is immutable');
assert(Object.isFrozen(oracleReadings.readingEntries[0]), 'ORACLE individual reading entries are immutable');

oracle.discoveries.oracle_inverse = true;
oracle.discoveries.oracle_significance = true;
oracle.machines.oracle.openedDirector = true;
const oracleSolved = projectMachineState('oracle', oracle);
assert(oracleSolved.inverseObserved === true, 'ORACLE canonical inverse discovery projects into Three.js state');
assert(oracleSolved.ruleLearned === true, 'ORACLE canonical significance discovery projects into Three.js state');
assert(oracleSolved.openedDirector === true, 'ORACLE canonical Director unlock projects into Three.js state');
assert(oracleSolved.phase === 'aftermath', 'ORACLE Director unlock projects as aftermath');
assert(Object.isFrozen(oracleSolved), 'ORACLE projection object is immutable');
assert(oracleBefore !== JSON.stringify(oracle), 'ORACLE test fixture itself changed as expected');


// VERBOTEN
const verboten = defaultState();
const verbotenBefore = JSON.stringify(verboten);
const verbotenInitial = projectVerbotenState(verboten);
assert(verbotenInitial.printedCount === 0, 'VERBOTEN begins with zero anonymous print progress');
assert(verbotenInitial.capturedCount === 0, 'VERBOTEN begins with zero anonymous witness progress');
assert(verbotenInitial.spent === false, 'VERBOTEN begins unspent');
assert(verbotenInitial.phase === 'dormant', 'VERBOTEN initial phase is dormant');

verboten.machines.verboten.wordsPrinted = [
  { ts: 1, word: 'ACCIDENT' },
  { ts: 2, word: 'MALFUNCTION' },
  { ts: 3, word: 'HARKER' }
];
verboten.machines.verboten.captures = { HARKER: 10, PELL: 20, INVALID: Number.NaN };
const verbotenProgress = projectVerbotenState(verboten);
assert(verbotenProgress.printedCount === 3, 'VERBOTEN projects anonymous print count without word content');
assert(verbotenProgress.capturedCount === 2, 'VERBOTEN projects anonymous finite capture count');
assert(Math.abs(verbotenProgress.printCompletion - 0.25) < 1e-12, 'VERBOTEN print completion is bounded to the 12-step ledger');
assert(!JSON.stringify(verbotenProgress).includes('ACCIDENT'), 'VERBOTEN projection does not leak printed words');
assert(!JSON.stringify(verbotenProgress).includes('HARKER'), 'VERBOTEN projection does not leak captured identity keys');

verboten.machines.verboten.wordsPrinted = Array.from({ length: 20 }, (_, index) => ({ ts: index + 1, word: `SECRET-${index}` }));
verboten.machines.verboten.openedDirector = true;
const verbotenSolved = projectMachineState('verboten', verboten);
assert(verbotenSolved.printedCount === 12, 'VERBOTEN invalid excess print history is bounded before rendering');
assert(verbotenSolved.spent === true, 'VERBOTEN full anonymous print progress projects spent state');
assert(verbotenSolved.openedDirector === true, 'VERBOTEN canonical Director unlock projects into Three.js state');
assert(verbotenSolved.phase === 'aftermath', 'VERBOTEN Director unlock projects as aftermath');
assert(Object.isFrozen(verbotenSolved), 'VERBOTEN projection object is immutable');
assert(verbotenBefore !== JSON.stringify(verboten), 'VERBOTEN test fixture itself changed as expected');

// SUNDIAL
const sundial = defaultState();
const sundialBefore = JSON.stringify(sundial);
const sundialInitial = projectSundialState(sundial);
assert(sundialInitial.hour === 12, 'SUNDIAL begins at canonical hour 12');
assert(sundialInitial.glyphCount === 0, 'SUNDIAL begins with zero anonymous glyph progress');
assert(sundialInitial.codeReady === false, 'SUNDIAL begins without a completed access code');
assert(sundialInitial.used === false, 'SUNDIAL begins unused');
assert(sundialInitial.phase === 'dormant', 'SUNDIAL initial phase is dormant');

sundial.machines.sundial.hour = 9;
sundial.machines.sundial.glyphs = ['H', 'P', 'D'];
const sundialProgress = projectSundialState(sundial);
assert(sundialProgress.hour === 9, 'SUNDIAL projects canonical retrograde hour');
assert(Math.abs(sundialProgress.shadowAngleRadians - (9 * Math.PI * 2 / 24)) < 1e-12, 'SUNDIAL hour projects to expected dial angle');
assert(sundialProgress.glyphCount === 3, 'SUNDIAL projects glyph count without glyph content');
assert(Math.abs(sundialProgress.glyphCompletion - (3 / 7)) < 1e-12, 'SUNDIAL projects normalized anonymous glyph completion');
assert(!('glyphs' in sundialProgress), 'SUNDIAL projection does not expose glyph characters');
assert(sundialProgress.phase === 'engaged', 'SUNDIAL earned progress projects as engaged');

sundial.machines.sundial.glyphs = ['H', 'P', 'D', 'M', 'V', 'Y', 'K'];
sundial.machines.sundial.accessCode = 'HPDMVYK';
sundial.discoveries.sundial_reversal = true;
const sundialReady = projectSundialState(sundial);
assert(sundialReady.glyphCount === 7, 'SUNDIAL full glyph progress projects as seven anonymous apertures');
assert(sundialReady.codeReady === true, 'SUNDIAL completed canonical code projects as a boolean ready state');
assert(sundialReady.reversalObserved === true, 'SUNDIAL canonical reversal discovery projects into Three.js state');
assert(!JSON.stringify(sundialReady).includes('HPDMVYK'), 'SUNDIAL projection does not leak the access-code string');
assert(!JSON.stringify(sundialReady).includes('"H"'), 'SUNDIAL projection does not leak individual glyph characters');

sundial.machines.sundial.used = true;
const sundialUsed = projectMachineState('sundial', sundial);
assert(sundialUsed.used === true, 'SUNDIAL canonical successful code use projects into Three.js state');
assert(sundialUsed.phase === 'aftermath', 'SUNDIAL successful code use projects as aftermath');
assert(Object.isFrozen(sundialUsed), 'SUNDIAL projection object is immutable');

sundial.machines.sundial.hour = 99;
sundial.machines.sundial.glyphs = Array.from({ length: 20 }, () => 'X');
const sundialBounded = projectSundialState(sundial);
assert(sundialBounded.hour === 23, 'SUNDIAL invalid high hour is bounded before rendering');
assert(sundialBounded.glyphCount === 7, 'SUNDIAL invalid excess glyph history is bounded before rendering');
assert(sundialBefore !== JSON.stringify(sundial), 'SUNDIAL test fixture itself changed as expected');

const unknown = projectMachineState('unknown-machine', base);
assert(unknown.phase === 'idle', 'unknown machines receive inert projection state');

const fresh = defaultState();
const freshBefore = JSON.stringify(fresh);
projectDeimosState(fresh);
projectChronostatState(fresh);
projectAtlasState(fresh);
projectArchiveState(fresh);
projectOracleState(fresh);
projectVerbotenState(fresh);
projectSundialState(fresh);
assert(JSON.stringify(fresh) === freshBefore, 'machine projections do not mutate canonical state');
assert(chronBefore !== JSON.stringify(chron), 'CHRONOSTAT test fixture itself changed as expected');

console.log(`MACHINE STATE QA: ${failures.length} failure(s)`);
if (failures.length) process.exit(1);
