// Read-only projections from canonical game state into Three.js presentation state.
// This module must never mutate gameplay state. Three.js consumes these values;
// puzzle rules remain owned by src/state and src/machines.

const DEIMOS_ORIENTATION_COUNT = 8;
const QUARTER_TURN = Math.PI / 4;
const CHRONOSTAT_MAX_ROUND_TRIPS = 6;
const CHRONOSTAT_PHASE_COUNT = 7;
const ATLAS_MAX_PATH_POINTS = 48;
const ARCHIVE_STAFF_IDS = ['harker', 'pell', 'doss', 'mora', 'vance', 'yuen'];

function boundedInteger(value, min, max, fallback = min) {
  if (!Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function freezePoint(point) {
  return Object.freeze({ x: clamp01(point?.x), y: clamp01(point?.y) });
}

function sampleAtlasPath(points, maxPoints = ATLAS_MAX_PATH_POINTS) {
  const valid = Array.isArray(points)
    ? points.filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
    : [];

  if (valid.length === 0) return Object.freeze([]);
  if (valid.length <= maxPoints) return Object.freeze(valid.map(freezePoint));

  const sampled = [];
  const lastIndex = valid.length - 1;
  for (let i = 0; i < maxPoints; i++) {
    const sourceIndex = Math.round((i / (maxPoints - 1)) * lastIndex);
    sampled.push(freezePoint(valid[sourceIndex]));
  }
  return Object.freeze(sampled);
}

function projectKnownIds(value, allowedIds) {
  const allowed = new Set(allowedIds);
  const seen = new Set();
  const projected = [];
  if (Array.isArray(value)) {
    for (const id of value) {
      if (typeof id !== 'string' || !allowed.has(id) || seen.has(id)) continue;
      seen.add(id);
      projected.push(id);
    }
  }
  return Object.freeze(projected);
}

export function projectDeimosState(state) {
  const machine = state?.machines?.deimos || {};
  const orientationIndex = boundedInteger(
    machine.orientation,
    0,
    DEIMOS_ORIENTATION_COUNT - 1,
    0
  );
  const safeOpen = machine.safeOpen === true;

  return Object.freeze({
    machineId: 'deimos',
    orientationIndex,
    orientationRadians: orientationIndex * QUARTER_TURN,
    triggerAligned: orientationIndex === 5,
    safeOpen,
    phase: safeOpen ? 'aftermath' : orientationIndex === 0 ? 'dormant' : 'engaged'
  });
}

export function projectChronostatState(state) {
  const machine = state?.machines?.chronostat || {};
  const roundTrips = boundedInteger(machine.roundTrips, 0, CHRONOSTAT_MAX_ROUND_TRIPS, 0);
  const shift = boundedInteger(machine.shift, 0, CHRONOSTAT_PHASE_COUNT - 1, 0);
  const sentCount = arrayLength(machine.sent);
  const inboxCount = arrayLength(machine.inbox);
  const unlockedVerb = machine.unlockedVerb === true;
  const waitingForReply = !unlockedVerb && sentCount > inboxCount;

  return Object.freeze({
    machineId: 'chronostat',
    roundTrips,
    shift,
    sentCount,
    inboxCount,
    waitingForReply,
    unlockedVerb,
    drift: shift > 0,
    phaseOffsetRadians: shift * ((Math.PI * 2) / CHRONOSTAT_PHASE_COUNT),
    signalStrength: roundTrips / CHRONOSTAT_MAX_ROUND_TRIPS,
    phase: unlockedVerb
      ? 'aftermath'
      : waitingForReply
        ? 'unstable'
        : roundTrips === 0
          ? 'dormant'
          : 'engaged'
  });
}

export function projectAtlasState(state) {
  const machine = state?.machines?.atlas || {};
  const strokes = Array.isArray(machine.strokes) ? machine.strokes : [];
  const lockedStrokes = strokes.filter((stroke) => stroke?.locked === true);
  const latestLocked = lockedStrokes[lockedStrokes.length - 1] || null;
  const lockedShapeCount = boundedInteger(machine.lockedShapes, 0, 999, 0);
  const openedSundial = machine.openedSundial === true;
  const draftStrokeCount = strokes.reduce((count, stroke) => count + (stroke?.locked === true ? 0 : 1), 0);
  const latestLockedPath = sampleAtlasPath(latestLocked?.points);

  return Object.freeze({
    machineId: 'atlas',
    strokeCount: strokes.length,
    draftStrokeCount,
    lockedStrokeCount: lockedStrokes.length,
    lockedShapeCount,
    openedSundial,
    latestLockedPath,
    topologyStrength: Math.min(1, lockedShapeCount / 3),
    phase: openedSundial
      ? 'aftermath'
      : strokes.length > 0 || lockedShapeCount > 0
        ? 'engaged'
        : 'dormant'
  });
}

export function projectArchiveState(state) {
  const machine = state?.machines?.archive || {};
  const revealedIds = projectKnownIds(machine.revealed, ARCHIVE_STAFF_IDS);
  const revealedCount = revealedIds.length;
  const solved = machine.solved === true;

  return Object.freeze({
    machineId: 'archive',
    revealedIds,
    revealedCount,
    allRevealed: revealedCount === ARCHIVE_STAFF_IDS.length,
    completion: revealedCount / ARCHIVE_STAFF_IDS.length,
    solved,
    phase: solved ? 'aftermath' : revealedCount > 0 ? 'engaged' : 'dormant'
  });
}

export function projectMachineState(machineId, state) {
  switch (machineId) {
    case 'deimos':
      return projectDeimosState(state);
    case 'chronostat':
      return projectChronostatState(state);
    case 'atlas':
      return projectAtlasState(state);
    case 'archive':
      return projectArchiveState(state);
    default:
      return Object.freeze({ machineId, phase: 'idle' });
  }
}
