// src/machines/oracle.js
// ORACLE — pedestal scale. Six objects. Each has a true mass in grams.
// Scale reads inverse significance: a more significant-to-the-player object
// reads LOWER. The rule inverts near a threshold (objects above "high significance"
// read -grams).
//
// Staff belongings all read 0g. That is the false-hypothesis-breaker: the staff
// is *present* (their significance is off the scale), not dead.
//
// Discovery rule: after placing ≥ 3 objects and observing the inverse pattern,
// `ruleLearned` flips. After recognizing that staff belongings → 0g, the Director
// door requirement is satisfied.

import { uid } from '../core/util.js';

// Token catalog. Each has a true mass (g) and a "significance to player" score
// derived from the player's progress: a token becomes more significant as more
// of the staff is restored (so the scale reads more inverse as the game progresses).
export const TOKENS = [
  { id: 'ring',      name: 'Brass Ring',         trueMass: 12.4, kind: 'personal',   owner: 'pell' },
  { id: 'specs',     name: 'Spectacles',         trueMass: 24.7, kind: 'personal',   owner: 'pell' },
  { id: 'photo',     name: 'Photograph',         trueMass:  3.1, kind: 'personal',   owner: 'pell' },
  { id: 'plumb',     name: 'Plumb Line',         trueMass: 88.0, kind: 'instrument', owner: 'harker' },
  { id: 'pulse',     name: 'Pulse Counter',      trueMass: 152.0, kind: 'instrument', owner: 'doss' },
  { id: 'compass',   name: 'Drafting Compass',   trueMass: 36.5, kind: 'instrument', owner: 'mora' },
  { id: 'glove',     name: 'Asbestos Glove',     trueMass: 96.0, kind: 'safety',     owner: 'vance' },
  { id: 'journal',   name: 'Yuen\'s Journal',    trueMass: 220.0, kind: 'director',   owner: 'yuen' },
  { id: 'cinder',    name: 'Cinder from Engine', trueMass:  0.4, kind: 'mystery' }
];

// Player inventory starts with three items (the ones most obviously "theirs").
// The rest become available as staff is restored. (In practice, all are in the drawer.)
export function initialInventory() {
  return TOKENS.slice(0, 3).map(t => t.id);
}

// Compute significance for a token given current state.
// Significance is 0..1. Staff belongings (kind=personal) score high as their
// owner's restoration progresses. Director's journal spikes at high progress.
// Cinder is always high (it's a piece of evidence).
function significanceOf(token, state) {
  if (token.kind === 'mystery') return 0.95;
  if (token.kind === 'director') {
    return state.machines.archive.solved ? 0.99 : 0.55;
  }
  if (token.kind === 'personal') {
    // Pell's belongings: 1.0 if Pell restored (we use oracle_significance)
    if (token.owner === 'pell') return state.discoveries.oracle_significance ? 1.0 : 0.4;
    // other staff belongings — for flavor, return low (not yet)
    return 0.2;
  }
  if (token.kind === 'instrument') {
    // instruments gain significance as their owner's machine is engaged.
    if (token.owner === 'harker' && state.machines.deimos.safeOpen) return 0.7;
    if (token.owner === 'doss' && state.machines.chronostat.roundTrips >= 3) return 0.75;
    if (token.owner === 'mora' && state.discoveries.atlas_lock) return 0.7;
    return 0.25;
  }
  if (token.kind === 'safety') {
    return state.discoveries.verboten_capture ? 0.65 : 0.2;
  }
  return 0.1;
}

// Inverse-weight reading in grams. We display the "true mass" multiplied by
// (1 - 2 * significance), so significance=0 → true mass (no inversion);
// significance=1 → -true mass (full inversion). Significance above a threshold
// (0.95) reads 0g exactly (the staff belongings 0g pattern).
export function readingOf(token, state) {
  const sig = significanceOf(token, state);
  if (sig >= 0.95) return 0.0;
  const factor = 1 - 2 * sig;
  return Math.round(token.trueMass * factor * 10) / 10;
}

export function place(state, tokenId, bus) {
  const token = TOKENS.find(t => t.id === tokenId);
  if (!token) return { ok: false, reason: 'no-token' };
  if (!state.machines.oracle.inventory.includes(tokenId)) {
    return { ok: false, reason: 'not-in-inventory' };
  }
  if (!state.machines.oracle.placed.includes(tokenId)) {
    state.machines.oracle.placed.push(tokenId);
    state.machines.oracle.readings[tokenId] = readingOf(token, state);
    state.discoveries.oracle_place = true;
    bus?.emit('notebook:auto', {
      title: `ORACLE — placed ${token.name}`,
      body: `Scale reads ${state.machines.oracle.readings[tokenId]}g. ` +
            `(True mass ${token.trueMass}g.)`
    });
    bus?.emit('discovery', { id: 'oracle_place' });
  }
  evaluate(state, bus);
  return { ok: true };
}

export function remove(state, tokenId, bus) {
  state.machines.oracle.placed = state.machines.oracle.placed.filter(id => id !== tokenId);
  delete state.machines.oracle.readings[tokenId];
}

export function unlockAll(state) {
  // for testing — not exposed to UI
  state.machines.oracle.inventory = TOKENS.map(t => t.id);
}

function evaluate(state, bus) {
  // If the player has placed at least 3 objects and observed at least one
  // inversion, they learn the rule.
  const placed = state.machines.oracle.placed;
  if (placed.length >= 3) {
    let inverted = 0;
    for (const id of placed) {
      const r = state.machines.oracle.readings[id];
      const t = TOKENS.find(t => t.id === id);
      if (t && r < t.trueMass) inverted++;
    }
    if (inverted >= 1) {
      if (!state.discoveries.oracle_inverse) {
        state.discoveries.oracle_inverse = true;
      }
    }
  }

  // Rule learned: placed ≥ 3 with inversion pattern AND a cinder (or staff belonging)
  // placed reading 0g.
  const cinderReading = state.machines.oracle.readings['cinder'];
  if (placed.length >= 4 && cinderReading === 0 && !state.discoveries.oracle_significance) {
    state.discoveries.oracle_significance = true;
    state.machines.oracle.openedDirector = true;
    bus?.emit('notebook:auto', {
      title: 'ORACLE — rule learned',
      body: 'The scale reads 0.0g for the cinder from the Verboten Engine, the same way ' +
            'Pell\'s belongings read 0.0g. You understand: the ORACLE does not measure mass. ' +
            'It measures how much an object *matters*. Beyond a threshold, that registers as zero. ' +
            'The staff is *present* — their significance has saturated the scale.'
    });
    bus?.emit('discovery', { id: 'oracle_significance' });
  }
}

export function oracleView(state) {
  return {
    inventory: state.machines.oracle.inventory,
    placed: state.machines.oracle.placed,
    readings: state.machines.oracle.readings,
    tokens: TOKENS,
    ruleLearned: state.discoveries.oracle_significance,
    openedDirector: state.machines.oracle.openedDirector
  };
}
