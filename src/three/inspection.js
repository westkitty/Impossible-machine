// src/three/inspection.js
// Pure presentation-only helpers for apparatus inspection.

export const INSPECTION_LIMITS = Object.freeze({
  minPitch: -1.05,
  maxPitch: 1.05,
  minDistance: 2.6,
  maxDistance: 6.4,
  defaultDistance: 4.8
});

const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function wrapInspectionYaw(value) {
  const tau = Math.PI * 2;
  let yaw = finite(value, 0) % tau;
  if (yaw > Math.PI) yaw -= tau;
  if (yaw < -Math.PI) yaw += tau;
  return yaw;
}

export function normalizeInspectionState(value = {}) {
  return Object.freeze({
    yaw: wrapInspectionYaw(value.yaw),
    pitch: clamp(finite(value.pitch, 0), INSPECTION_LIMITS.minPitch, INSPECTION_LIMITS.maxPitch),
    distance: clamp(
      finite(value.distance, INSPECTION_LIMITS.defaultDistance),
      INSPECTION_LIMITS.minDistance,
      INSPECTION_LIMITS.maxDistance
    )
  });
}

export function inspectionCommandForKey(key) {
  switch (key) {
    case 'ArrowLeft': return Object.freeze({ yawDelta: -0.14 });
    case 'ArrowRight': return Object.freeze({ yawDelta: 0.14 });
    case 'ArrowUp': return Object.freeze({ pitchDelta: -0.11 });
    case 'ArrowDown': return Object.freeze({ pitchDelta: 0.11 });
    case '+':
    case '=': return Object.freeze({ distanceDelta: -0.28 });
    case '-':
    case '_': return Object.freeze({ distanceDelta: 0.28 });
    case 'Escape': return Object.freeze({ action: 'close' });
    case 'r':
    case 'R':
    case '0': return Object.freeze({ action: 'reset' });
    default: return null;
  }
}

export function applyInspectionDelta(state = {}, delta = {}) {
  if (delta?.action) return normalizeInspectionState(state);
  return normalizeInspectionState({
    yaw: finite(state.yaw, 0) + finite(delta.yawDelta, 0),
    pitch: finite(state.pitch, 0) + finite(delta.pitchDelta, 0),
    distance: finite(state.distance, INSPECTION_LIMITS.defaultDistance) + finite(delta.distanceDelta, 0)
  });
}

export function interpolateInspectionState(current = {}, target = {}, reducedMotion = false) {
  const a = normalizeInspectionState(current);
  const b = normalizeInspectionState(target);
  const factor = reducedMotion ? 1 : 0.14;
  let yawDelta = b.yaw - a.yaw;
  yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
  return Object.freeze({
    yaw: wrapInspectionYaw(a.yaw + yawDelta * factor),
    pitch: a.pitch + (b.pitch - a.pitch) * factor,
    distance: a.distance + (b.distance - a.distance) * factor
  });
}
