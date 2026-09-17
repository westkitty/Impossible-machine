// src/machines/verboten.js
// VERBOTEN ENGINE — iron slug, copper coil, paper tape, furnace.
// On each press of the actuator, the engine prints a single word on paper tape
// and the paper advances into a furnace. The word is "consumed" but can be
// captured by the player via a snapshot (UI provides a "witness" button that
// records the word into state).
//
// The engine has a small ledger of forbidden words. It cycles through them
// based on press count. The first 6 presses reveal, in order, the six staff
// surnames in canonical order: HARKER, PELL, DOSS, MORA, VANCE, YUEN.
// (This is the "secret" mechanic — staff secrets live here.)

// We deliberately include false-hypothesis words first to seed the player's
// misreading: 'ACCIDENT', 'MALFUNCTION', 'POWER', 'BURNOUT', 'UNSTABLE',
// then the actual staff names. This supports the false hypothesis about what
// happened, then corrects it.

const LEDGER = [
  'ACCIDENT',
  'MALFUNCTION',
  'BURNOUT',
  'UNSTABLE',
  'POWER',
  'OVERLOAD',  // last decoy
  'HARKER',
  'PELL',
  'DOSS',
  'MORA',
  'VANCE',
  'YUEN'
];

export function actuate(state, bus) {
  const n = state.machines.verboten.wordsPrinted.length;
  if (n >= LEDGER.length) {
    bus?.emit('notebook:auto', {
      title: 'VERBOTEN ENGINE — spent',
      body: 'The slug is cold. The coil does not click. The furnace is quiet.'
    });
    return null;
  }
  const word = LEDGER[n];
  state.machines.verboten.wordsPrinted.push({ ts: Date.now(), word });
  // If the player captures, record it.
  // The paper is consumed into the furnace after ~1.5s.
  state.discoveries.verboten_furnace = true;
  bus?.emit('notebook:auto', {
    title: `VERBOTEN printed: ${word}`,
    body: `The print head strikes once. The word "${word}" appears on the tape. ` +
          `The tape advances toward the furnace. (Use the WITNESS button to capture it ` +
          `before it burns.)`
  });
  bus?.emit('discovery', { id: 'verboten_furnace' });
  bus?.emit('verboten:printed', { word, n });
  return word;
}

export function witness(state, word, bus) {
  if (!word) return;
  const w = word.toUpperCase();
  if (!state.machines.verboten.captures[w]) {
    state.machines.verboten.captures[w] = Date.now();
  }
  bus?.emit('notebook:auto', {
    title: `VERBOTEN witness: ${w}`,
    body: `You have captured the word "${w}" before the furnace consumed the tape.`
  });
  bus?.emit('discovery', { id: 'verboten_capture' });

  // Check: have all 6 staff names been captured? If yes, open the Director.
  const allNames = ['HARKER', 'PELL', 'DOSS', 'MORA', 'VANCE', 'YUEN'];
  const captures = Object.keys(state.machines.verboten.captures);
  const allCaptured = allNames.every(n => captures.includes(n));
  if (allCaptured && !state.machines.verboten.openedDirector) {
    state.machines.verboten.openedDirector = true;
    state.discoveries.verboten_secret = true;
    bus?.emit('notebook:auto', {
      title: 'VERBOTEN — Director gate opened',
      body: 'All six names captured. The Director\'s door, accessible from this chamber, ' +
            'has unsealed.'
    });
    bus?.emit('discovery', { id: 'verboten_secret' });
  }
}

export function verbotenView(state) {
  return {
    wordsPrinted: state.machines.verboten.wordsPrinted,
    captures: state.machines.verboten.captures,
    openedDirector: state.machines.verboten.openedDirector
  };
}
