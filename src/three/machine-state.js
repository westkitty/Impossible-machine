// Read-only projections from canonical game state into Three.js presentation state.
// This module must never mutate gameplay state. Three.js consumes these values;
// puzzle rules remain owned by src/state and src/machines.

const DEIMOS_ORIENTATION_COUNT = 8;
const QUARTER_TURN = Math.PI / 4;
const CHRONOSTAT_MAX_ROUND_TRIPS = 6;
const CHRONOSTAT_PHASE_COUNT = 7;

function boundedInteger(value, min, max, fallback = min) {
  if (!Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0;
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

export function projectMachineState(machineId, state) {
  switch (machineId) {
    case 'deimos':
      return projectDeimosState(state);
    case 'chronostat':
      return projectChronostatState(state);
    default:
      return Object.freeze({ machineId, phase: 'idle' });
  }
}
