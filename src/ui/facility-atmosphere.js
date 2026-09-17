// src/ui/facility-atmosphere.js
// Read-only presentation projection for Facility 7-B.
// This module derives atmosphere from already-public machine phases only.

import { projectMachineState } from '../three/machine-state.js';

const MACHINE_IDS = Object.freeze(['deimos', 'chronostat', 'atlas', 'archive', 'oracle', 'verboten', 'sundial']);
const ENDINGS = new Set(['full', 'partial', 'refused']);

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

function safePhase(machineId, state) {
  try {
    const phase = projectMachineState(machineId, state)?.phase;
    return ['dormant', 'engaged', 'unstable', 'aftermath'].includes(phase) ? phase : 'dormant';
  } catch {
    return 'dormant';
  }
}

export function projectFacilityAtmosphere(state = {}, room = {}) {
  const phases = MACHINE_IDS.map((id) => safePhase(id, state));
  const localIds = Array.isArray(room?.machines)
    ? room.machines.filter((id) => MACHINE_IDS.includes(id))
    : [];
  const localPhases = localIds.map((id) => safePhase(id, state));

  const aftermathCount = phases.filter((phase) => phase === 'aftermath').length;
  const engagedCount = phases.filter((phase) => phase === 'engaged').length;
  const unstableCount = phases.filter((phase) => phase === 'unstable').length;

  let restorationLevel = clamp01(aftermathCount / MACHINE_IDS.length);
  let anomalyLevel = clamp01((unstableCount + engagedCount * 0.38) / MACHINE_IDS.length);

  const endingState = ENDINGS.has(state?.meta?.ending) ? state.meta.ending : null;
  if (endingState === 'full') restorationLevel = 1;
  if (endingState === 'partial') anomalyLevel = 1;
  if (endingState === 'refused') anomalyLevel = Math.max(anomalyLevel, 0.72);

  const directorOpen = state?.discoveries?.director_unlocked === true
    || state?.machines?.oracle?.openedDirector === true
    || state?.machines?.verboten?.openedDirector === true;

  const localEngaged = localPhases.filter((phase) => phase === 'engaged' || phase === 'unstable').length;
  const localAftermath = localPhases.filter((phase) => phase === 'aftermath').length;
  const localUnstable = localPhases.some((phase) => phase === 'unstable');

  let tone = 'dormant';
  if (endingState) tone = 'terminal';
  else if (localUnstable || anomalyLevel >= 0.42) tone = 'unstable';
  else if (localAftermath > 0 || restorationLevel >= 0.42) tone = 'restored';
  else if (localEngaged > 0 || engagedCount > 0 || directorOpen) tone = 'active';

  return Object.freeze({
    roomId: typeof room?.id === 'string' ? room.id : 'unknown',
    visited: state?.rooms?.[room?.id]?.visited === true,
    localMachineCount: localIds.length,
    engagedMachineCount: localEngaged,
    aftermathMachineCount: localAftermath,
    restorationLevel,
    anomalyLevel,
    directorOpen,
    endingState,
    tone
  });
}

export function applyFacilityAtmosphere(stage, projection) {
  if (!stage || !projection) return;
  stage.dataset.roomId = projection.roomId;
  stage.dataset.facilityTone = projection.tone;
  stage.dataset.directorOpen = projection.directorOpen ? 'true' : 'false';
  stage.style.setProperty('--facility-restoration', projection.restorationLevel.toFixed(3));
  stage.style.setProperty('--facility-anomaly', projection.anomalyLevel.toFixed(3));
  stage.style.setProperty('--facility-brass-alpha', (0.018 + projection.restorationLevel * 0.13).toFixed(3));
  stage.style.setProperty('--facility-oxide-alpha', (projection.anomalyLevel * 0.12).toFixed(3));
}
