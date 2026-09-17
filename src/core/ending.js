// src/core/ending.js
// Determines ending based on player's progress.

import { STAFF, staffRestorationScore } from '../archive/documents.js';

export function computeEnding(state) {
  if (state.meta.ending) return state.meta.ending;

  // Refused: player walked out via the foyer exit before any progress.
  // (We don't have a hard "exit" button right now; the foyer has no exit,
  // but we'll honor an explicit player choice later. For now: refused is only
  // triggered by an explicit UI action that we don't expose, OR by a partial
  // restoration failure.)

  // Partial: at least one machine has done meaningful work but not all.
  const m = state.machines;
  const progressSignals = [
    m.deimos.safeOpen,
    m.chronostat.roundTrips > 0,
    m.atlas.lockedShapes > 0,
    m.archive.revealed.length > 0,
    m.oracle.placed.length > 0,
    m.verboten.wordsPrinted.length > 0,
    !!m.sundial.accessCode
  ];
  const progressCount = progressSignals.filter(Boolean).length;

  const scores = staffRestorationScore(state);
  const restoredTotal = Object.values(scores).reduce((a, b) => a + Math.min(b, 1), 0);
  // Each of the 6 staff members must have at least 1 score to be "restored".

  // Full: all 6 restored, archive solved, sundial code used (or available).
  if (state.machines.archive.solved && state.machines.sundial.accessCode) {
    const allRestored = ['harker', 'pell', 'doss', 'mora', 'vance', 'yuen']
      .every(id => scores[id] >= 1);
    // Yuen requires archive solved + sundial code, which we have here.
    if (allRestored || (state.machines.archive.solved && state.machines.sundial.accessCode)) {
      // Full ending also requires the player to step into DEIMOS at SAFE UP.
      // We treat that as triggered when they try to "leave" via the Director's office.
      if (state.machines.oracle.openedDirector && state.machines.verboten.openedDirector) {
        return 'full';
      }
    }
  }

  // Partial: progress in 2+ systems but not all.
  if (progressCount >= 2) return 'partial';

  return null;
}

export function commitEnding(state, ending, bus) {
  if (state.meta.ending === ending) return;
  state.meta.ending = ending;
  if (ending === 'full') {
    state.discoveries.ending_full = true;
    bus?.emit('notebook:auto', {
      title: 'ENDING — Full Restoration',
      body: 'The doors open. You step out into the corridor. The facility hums behind you, ' +
            'and a single fresh polaroid lies on the floor, dated today, with your name on it: ' +
            '"I. YUEN — RETURNED."'
    });
  } else if (ending === 'partial') {
    state.discoveries.ending_partial = true;
    bus?.emit('notebook:auto', {
      title: 'ENDING — Partial Restoration',
      body: 'Power fails. The lights die in sequence. The CHRONOSTAT plate emits a final ' +
            'phrase you cannot decode. You are locked in.'
    });
  } else if (ending === 'refused') {
    state.discoveries.ending_refused = true;
    bus?.emit('notebook:auto', {
      title: 'ENDING — Refused',
      body: 'You leave the facility without engaging. The doors reseal themselves.'
    });
  }
  bus?.emit('ending', ending);
}
