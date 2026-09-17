// src/archive/documents.js
// The Research Archive. Documents are gated by discoveries.
// Some are decoys (the false hypothesis). Some are fragmentary.
// Together, they encode the mystery.

export const DOCUMENTS = [
  // ───── Manual-style system docs (always available, flavor) ─────
  {
    id: 'doc_deimos_manual',
    room: 'deimos',
    title: 'DEIMOS — Operating Notes',
    kind: 'manual',
    tags: ['deimos', 'gravity', 'system'],
    body:
      'DEIMOS is a self-contained orientation chamber. The dial selects one of eight discrete ' +
      'gravity vectors (think of a cube\'s corners). Physical objects in the chamber reorient ' +
      'accordingly, including the operator. Lockable fixtures (e.g. the north safe) require ' +
      'their handle to align with the local vertical. The intended safe orientation is recorded ' +
      'on the handle: "STANDARD DOWN".',
    unlock: () => true
  },
  {
    id: 'doc_chronostat_manual',
    room: 'chronostat',
    title: 'CHRONOSTAT — Operator Brief',
    kind: 'manual',
    tags: ['chronostat', 'telegraph', 'morse'],
    body:
      'CHRONOSTAT operates as a one-way-asynchronous link. Send a Morse letter; the link ' +
      'echoes a transformed letter after a brief delay. The transformation is not noise — ' +
      'it is a Caesar shift, indexed by the cumulative number of round-trips completed. ' +
      'Shift +0 means no change. Shift +6 means letters are six positions ahead in the alphabet. ' +
      'Most importantly: the link is a closed loop. Whatever you send eventually returns to you, ' +
      'shifted. Whatever you receive, you will one day send.',
    unlock: () => true
  },
  {
    id: 'doc_atlas_manual',
    room: 'atlas',
    title: 'ATLAS OF FALSE COASTS — Field Procedure',
    kind: 'manual',
    tags: ['atlas', 'cartography', 'system'],
    body:
      'ATLAS draws the world, and the world draws itself to match. The canvas accepts freehand ' +
      'input. Each stroke is recorded for a fixed interval, after which the canvas fades. To ' +
      'preserve a stroke, hold the "LOCK" gesture (long-press) until the canvas emits a click. ' +
      'Locked strokes become part of the facility. Unlocked strokes are erased. The facility is ' +
      'responsive to the *locked* cartography only.',
    unlock: () => true
  },
  {
    id: 'doc_archive_manual',
    room: 'archive',
    title: 'ARCHIVE — Personnel Recovery Procedure',
    kind: 'manual',
    tags: ['archive', 'personnel', 'identity'],
    body:
      'The ARCHIVE printer issues a polaroid for every staff member listed in the recovery ' +
      'index. Each polaroid is dated BEFORE the facility\'s founding date. This is intentional. ' +
      'The dates are not biographical; they are anchor points. A staff member is identified ' +
      'by the *order* in which their polaroids surface relative to the others.',
    unlock: () => true
  },
  {
    id: 'doc_oracle_manual',
    room: 'oracle',
    title: 'ORACLE — Calibration Log',
    kind: 'manual',
    tags: ['oracle', 'weight', 'calibration'],
    body:
      'ORACLE measures mass in grams. It is calibrated against a tungsten reference (200.0g). ' +
      'Recent readings have deviated by as much as -100% on personal effects. Investigation ' +
      'pending. Note from Dr. Yuen: "The scale is not broken. It is honest."',
    unlock: () => true
  },
  {
    id: 'doc_verboten_manual',
    room: 'verboten',
    title: 'VERBOTEN ENGINE — Safety Bulletin',
    kind: 'manual',
    tags: ['verboten', 'safety', 'furnace'],
    body:
      'The engine prints a single word per cycle on thermal paper. The word is selected from ' +
      'an internal ledger of forbidden terms. The paper advances into the furnace immediately ' +
      'after printing. Operators are reminded that photographic equipment is permitted in ' +
      'this chamber. The engine does not object to witnesses.',
    unlock: () => true
  },
  {
    id: 'doc_sundial_manual',
    room: 'sundial',
    title: 'COUNTERFEIT SUNDIAL — Chronometry Notice',
    kind: 'manual',
    tags: ['sundial', 'time', 'solar'],
    body:
      'The sundial casts a shadow only when the local solar frame is non-physical. The shadow ' +
      'tracks "solar noon" within the dial\'s internal clock. The clock runs retrograde. ' +
      'At each hour boundary (24, 23, 22, …, 1, 0), a glyph from the access code is revealed. ' +
      'The full access code opens the Director\'s safe.',
    unlock: () => true
  },

  // ───── Personnel notes (found in archive, gated by archive progress) ─────
  {
    id: 'doc_note_yuen',
    room: 'archive',
    title: 'Handwritten note — Dr. I. Yuen',
    kind: 'note',
    tags: ['yuen', 'private', 'identity'],
    body:
      'I have tried to be honest about who I am. The Chronicle tells me I was the seventh. ' +
      'I have not yet recovered the other six. I have only just learned my own name.',
    unlock: (state) => state.discoveries.archive_match
  },
  {
    id: 'doc_note_harker',
    room: 'archive',
    title: 'Handwritten note — M. Harker (recovery index #2)',
    kind: 'note',
    tags: ['harker', 'private', 'identity'],
    body:
      'It is the gravity. The dial is for the safe, but the chamber remembers all of us. ' +
      'When DEIMOS is rotated, the rest of the facility shifts imperceptibly. I have measured ' +
      'this with a plumb line. Don\'t let the Director know.',
    unlock: (state) => state.discoveries.archive_polaroid
  },
  {
    id: 'doc_note_pell',
    room: 'archive',
    title: 'Memo — R. Pell (recovery index #3)',
    kind: 'memo',
    tags: ['pell', 'engineering'],
    body:
      'ORACLE calibration log is corrupted. The scale reads 0.0g on my ring, 0.0g on my ' +
      'spectacles, 0.0g on my daughter\'s photograph. This is impossible. I am filing a ' +
      'maintenance request.',
    unlock: (state) => state.discoveries.oracle_place
  },
  {
    id: 'doc_note_doss',
    room: 'archive',
    title: 'Memo — T. Doss (recovery index #4)',
    kind: 'memo',
    tags: ['doss', 'chronology'],
    body:
      'CHRONOSTAT reply on shift +6: "YOU ARE THE SEVENTH YOU WILL RETURN WHEN YOU HAVE NAMED THE SIX". ' +
      'I do not understand. Yuen says this is exactly what she expected to receive.',
    unlock: (state) => state.discoveries.chronostat_round_trip
  },
  {
    id: 'doc_note_mora',
    room: 'archive',
    title: 'Memo — A. Mora (recovery index #5)',
    kind: 'memo',
    tags: ['mora', 'cartography'],
    body:
      'ATLAS has been locked at three distinct shapes since the inversion. Each shape corresponds ' +
      'to a room we no longer recognize. I am leaving the unlocked canvas running, just in case ' +
      'someone else wants to redraw.',
    unlock: (state) => state.discoveries.atlas_lock
  },
  {
    id: 'doc_note_vance',
    room: 'archive',
    title: 'Memo — C. Vance (recovery index #6)',
    kind: 'memo',
    tags: ['vance', 'safety', 'verboten'],
    body:
      'VERBOTEN ENGINE printed "YUEN" today. The Director was furious. I told him the engine ' +
      'only prints what is *true*, and Yuen is, in fact, forbidden. He told me to take a walk.',
    unlock: (state) => state.discoveries.verboten_capture
  },
  {
    id: 'doc_director_log',
    room: 'director',
    title: 'Director\'s Log — Excerpt',
    kind: 'log',
    tags: ['director', 'conspiracy', 'coverup'],
    body:
      'I am writing this for whoever finds it. The staff did not die. They did not leave. ' +
      'They were *distributed* across the seven machines during the Quiet Inversion. ' +
      'They are present in every reading the ORACLE returns. Their names live in the ARCHIVE. ' +
      'Their secrets are burned into the VERBOTEN ENGINE. Their futures are already on the ' +
      'CHRONOSTAT. If you are reading this, you are the seventh, returned. Name them. Restore ' +
      'them. The door will open. The sundial will turn. The map will redraw itself around you.',
    unlock: (state) => !!state.machines.sundial.accessCode && !!state.machines.archive.solved
  },

  // ───── FALSE HYPOTHESIS documents — these mislead. They are still real. ─────
  {
    id: 'doc_incident_83',
    room: 'foyer',
    title: 'Newspaper clipping — April 1983',
    kind: 'clipping',
    tags: ['incident', '1983', 'coverup', 'false-hypothesis'],
    body:
      'SIX SCIENTISTS MISSING AFTER "EQUIPMENT FAILURE" AT FEDERAL LAB. ' +
      'A government laboratory south of the city has been placed under indefinite quarantine ' +
      'following what officials are calling an "equipment malfunction". Six of seven staff ' +
      'members are unaccounted for. The seventh, Dr. I. Yuen, was found at the scene and is ' +
      'reported to be in stable condition. Cause of the malfunction is under investigation.',
    unlock: () => true
  },
  {
    id: 'doc_maintenance_log',
    room: 'foyer',
    title: 'Maintenance Log — Concession K-12',
    kind: 'log',
    tags: ['maintenance', 'coverup', 'false-hypothesis'],
    body:
      'Equipment failure 1983-04-12. Cause: simultaneous transient surge across all primary ' +
      'circuits. Origin unknown. All seven machines reported "actuating without input". ' +
      'Insurance assessment: total loss of operating staff (except Dr. Yuen). ' +
      'Recommendation: seal and abandon.',
    unlock: (state) => state.machines.chronostat.roundTrips >= 1
  },

  // ───── Final reveal — Director's contingency blueprint ─────
  {
    id: 'doc_quiet_inversion',
    room: 'director',
    title: 'QUIET INVERSION — Contingency Blueprint',
    kind: 'diagram',
    tags: ['quiet-inversion', 'reveal', 'blueprint'],
    body:
      'On 1983-04-12 11:59:59 (local), Dr. I. Yuen initiated CONTINGENCY K-12: a self-targeted ' +
      'CHRONOSTAT feedback loop with shift +6, designed to retrieve the operator\'s own ' +
      'identity from six hours in the future. The contingency worked, with side effects. ' +
      'The other six staff, present in the chamber, were *partially pulled into the loop*. ' +
      'They did not die. They were not erased. They were *filed*. Their names in the ARCHIVE. ' +
      'Their weight in the ORACLE. Their secrets in the VERBOTEN ENGINE. Their letters on the ' +
      'CHRONOSTAT. Their faces on the ATLAS. Their time on the SUNDIAL. To reverse K-12: ' +
      'a successor operator must reassemble each staff member\'s file using its corresponding ' +
      'machine, then step into DEIMOS at orientation 7 (SAFE UP). The successor is Yuen, ' +
      'returned.',
    unlock: (state) => state.rooms.director.unlocked
  }
];

// Personnel recovery index. Six staff members, in canonical order.
export const STAFF = [
  { id: 'harker', name: 'M. Harker',  role: 'Mechanical Engineer', order: 2, anchor: 'gravity' },
  { id: 'pell',   name: 'R. Pell',    role: 'Instrumentation',     order: 3, anchor: 'weight' },
  { id: 'doss',   name: 'T. Doss',    role: 'Chronology Specialist', order: 4, anchor: 'time' },
  { id: 'mora',   name: 'A. Mora',    role: 'Cartographer',        order: 5, anchor: 'cartography' },
  { id: 'vance',  name: 'C. Vance',   role: 'Safety Officer',      order: 6, anchor: 'safety' },
  { id: 'yuen',   name: 'I. Yuen',    role: 'Director (you)',      order: 7, anchor: 'self' }
];

// A staff member is "restored" when:
//   1. Their polaroid is recovered (Archive discovery).
//   2. Their secret is captured (Verboten capture or Oracle rule).
//   3. Their cipher (Chronostat) or anchor mechanic (other machines) has been activated.
// The Director's door opens when all six are restored.

export function staffRestorationScore(state) {
  const out = {};
  for (const s of STAFF) {
    let score = 0;
    // Archive presence
    if (state.machines.archive.revealed.includes(s.id)) score += 1;
    // Verboten capture mentioning this staff
    if ((state.machines.verboten.captures[s.name.split(' ').slice(-1)[0].toUpperCase()] ||
         state.machines.verboten.captures[s.name.split(' ')[0].toUpperCase()])) score += 1;
    // Oracle rule learned is universal — counts once globally
    if (s.id === 'pell' && state.discoveries.oracle_significance) score += 1;
    // Chronostat round-trips
    if (s.id === 'doss' && state.discoveries.chronostat_round_trip) score += 1;
    // Atlas lock
    if (s.id === 'mora' && state.discoveries.atlas_lock) score += 1;
    // Verboten secret capture
    if (s.id === 'vance' && state.discoveries.verboten_capture) score += 1;
    // Yuen's identity is restored only at the very end (full ending)
    if (s.id === 'yuen') {
      if (state.machines.archive.solved && state.machines.sundial.accessCode) score += 2;
    }
    out[s.id] = Math.min(score, 3);
  }
  return out;
}

// Sanitized document listing for the search index. Returns docs the player has access to.
export function visibleDocuments(state) {
  return DOCUMENTS.filter(d => {
    try { return !!d.unlock(state); } catch { return false; }
  });
}
