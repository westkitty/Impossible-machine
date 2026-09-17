// src/machines/deimos.js
// DEIMOS — Gravity chamber. Rotate the dial; the world reorients.
// The "safe" handle reads "STANDARD DOWN". When the local "down" points
// along the safe's handle axis, the safe opens.

import { ROOMS } from '../facility/rooms.js';

const ORIENTATIONS = [
  // [vector name, gravity axis (sx, sy), safe handle axis (hx, hy)]
  ['STANDARD DOWN',   { sx:  0, sy:  1 }, { hx: 0, hy:  1 }], // 0 — initial
  ['EAST',            { sx:  1, sy:  0 }, { hx: 0, hy:  1 }],
  ['SOUTH',           { sx:  0, sy: -1 }, { hx: 0, hy:  1 }],
  ['WEST',            { sx: -1, sy:  0 }, { hx: 0, hy:  1 }],
  ['NORTH',           { sx:  0, sy:  1 }, { hx: 0, hy:  1 }], // duplicated (cube corner)
  ['CEILING',         { sx:  0, sy: -1 }, { hx: 0, hy: -1 }], // safe upside down
  ['DOOR-LEFT',       { sx: -1, sy:  0 }, { hx: -1, hy: 0 }], // handle horizontal
  ['DOOR-RIGHT',      { sx:  1, sy:  0 }, { hx: 1,  hy: 0 }],
];

// The safe opens when local-down == handle-up (handle axis points opposite to gravity).
// Equivalently: dot(gravity, handle) == -1 (handle "up" against gravity).
// But the safe handle physically stays at the same room-relative orientation —
// it's the chamber's frame that flips. So the *relative* angle matters.
//
// We model this with a single orientation index 0..7.
export function isSafeOpen(state) {
  const o = ORIENTATIONS[state.machines.deimos.orientation];
  if (!o) return false;
  // 'SAFE UP' (orientation 5) points the handle opposite to local-down.
  return o[0] === 'CEILING';
}

export function setOrientation(state, idx, bus) {
  if (idx < 0 || idx >= ORIENTATIONS.length) return;
  state.machines.deimos.orientation = idx;
  // auto open safe if orientation is right
  if (isSafeOpen(state) && !state.machines.deimos.safeOpen) {
    state.machines.deimos.safeOpen = true;
    state.discoveries.gravity_flip = true;
    state.discoveries.safe_opened = true;
    bus?.emit('discovery', { id: 'safe_opened' });
    bus?.emit('notebook:auto', {
      title: 'DEIMOS safe opened',
      body: 'The chamber\'s gravity was set to CEILING. The safe handle, now pointing ' +
            '"down" relative to local vertical, released. There is a small notebook inside. ' +
            'It contains a single sentence: "Return the others before you return yourself."'
    });
  }
}

export function deimosView(state, bus) {
  const o = ORIENTATIONS[state.machines.deimos.orientation] || ORIENTATIONS[0];
  const safeOpen = isSafeOpen(state);
  return {
    orientationIndex: state.machines.deimos.orientation,
    orientationLabel: o[0],
    safeOpen,
    orientations: ORIENTATIONS.map((x, i) => ({ i, label: x[0] }))
  };
}
