// src/machines/archive.js
// The Archive — polaroids pinned to a corkboard. The printer slot prints new
// polaroids on demand. Each polaroid contains a staff name and a date.
// Six staff members, in canonical order: HARKER, PELL, DOSS, MORA, VANCE, YUEN.
//
// Mechanic: player prints polaroids. Each polaroid reveals one staff ID.
// To "solve" the archive, the player must print at least 6 polaroids AND
// place them in the correct order on the corkboard (drag-and-drop ordering).
// When correctly ordered, archive.solved = true.
//
// We provide a 'matchAndOrder' action that the UI invokes. It checks current
// ordering against STAFF order and reveals partial credit.

import { STAFF } from '../archive/documents.js';
import { uid } from '../core/util.js';

// The polaroids that get printed, one at a time, in pseudo-random order.
// The player can re-print as many times as they want — duplicates ignored.
// Discovery of all 6 IDs is the goal; ordering is the puzzle.
const PRINT_ORDER = ['harker', 'pell', 'doss', 'mora', 'vance', 'yuen'];

// We expose a stable random selection keyed off a counter so subsequent
// presses eventually reveal all 6.
export function printPolaroid(state, bus) {
  const revealed = state.machines.archive.revealed;
  const next = PRINT_ORDER.find(id => !revealed.includes(id));
  if (!next) {
    bus?.emit('notebook:auto', {
      title: 'ARCHIVE — printer cycle complete',
      body: 'The printer slot is silent. Every polaroid that could be printed has been printed.'
    });
    return null;
  }
  const staff = STAFF.find(s => s.id === next);
  const polaroid = {
    id: uid(),
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    // Anchor dates are deliberately BEFORE the lab's founding.
    date: '19' + (40 + staff.order * 3).toString().padStart(2, '0') + '-0' + (staff.order % 9 + 1) + '-1' + (staff.order % 7)
  };
  revealed.push(staff.id);
  state.discoveries.archive_polaroid = true;
  bus?.emit('notebook:auto', {
    title: `ARCHIVE — polaroid: ${staff.name}`,
    body: `Printed. Dated ${polaroid.date}. Role: ${staff.role}. (Recovery index #${staff.order}.)`
  });
  bus?.emit('discovery', { id: 'archive_polaroid' });
  bus?.emit('archive:polaroid', polaroid);
  return polaroid;
}

// Order array: player drags polaroids into the canonical order.
// If matches canonical order, archive.solved flips to true and the Director
// requirement is partially satisfied.
export function setOrder(state, orderedIds, bus) {
  const want = PRINT_ORDER;
  if (orderedIds.length !== want.length) {
    state.discoveries.archive_match = false;
    return { ok: false, reason: 'wrong-count' };
  }
  const matches = orderedIds.every((id, i) => id === want[i]);
  if (matches) {
    state.machines.archive.solved = true;
    state.discoveries.archive_solved = true;
    state.discoveries.archive_match = true;
    bus?.emit('notebook:auto', {
      title: 'ARCHIVE — solved',
      body: 'The polaroids click into place. The corkboard vibrates briefly. ' +
            'Six names in order. The composite identity resolves: Harker, Pell, Doss, ' +
            'Mora, Vance, Yuen. The Director\'s office is closer.'
    });
    bus?.emit('discovery', { id: 'archive_solved' });
    return { ok: true };
  } else {
    state.discoveries.archive_match = true;
    return { ok: false, reason: 'wrong-order' };
  }
}

export function archiveView(state) {
  return {
    revealed: state.machines.archive.revealed,
    solved: state.machines.archive.solved,
    staffOrder: PRINT_ORDER
  };
}
