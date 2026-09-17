// src/machines/chronostat.js
// CHRONOSTAT — telegraph key, future self echoes back.
// Encoding: Morse letter in. Caesar-shifted letter out, with shift = round-trips mod 7.
// Round-trip = player sends a Morse letter; after a delay, the machine "replies" with
// a letter that's the player's input shifted by +shift. Each reply increments shift.
// After 6 round-trips the chronostat unlocks the verboten door (the engine door).
//
// Mechanic: player types a Morse letter using short/long keypresses. The letter is
// added to sent. Then the engine schedules a "future" reply which arrives after ~2s.
//
// The future self's reply is, deterministically, the player's message shifted by N
// positions ahead. The puzzle: discover that the shift drifts. Discover that
// any letter you send will eventually come back. The door unlocks after 6.

import { shiftString } from '../core/util.js';

const DELAY_MS = 1600;

// Future self messages, scheduled in order they will be received if the player
// sends the corresponding query. These are pre-written mysteries.
// Index = round-trip count when they arrive.
const FUTURE_MESSAGES = [
  // rt 1: shifts +1
  'HELLO YOU ARE EARLY',
  // rt 2: shift +2
  'THE OTHERS ARE LOST',
  // rt 3: shift +3
  'FIND THE SIX NAMES',
  // rt 4: shift +4
  'THE ENGINE BURNS TRUTH',
  // rt 5: shift +5
  'THE SCALE READS CARE',
  // rt 6: shift +6 (the unlock)
  'YOU ARE THE SEVENTH YOU WILL RETURN WHEN YOU HAVE NAMED THE SIX'
];

// Player-facing replies are FUTURE_MESSAGES shifted by the current round-trip count.
function computeReply(rt, playerText) {
  const future = FUTURE_MESSAGES[rt] || `LOOP ${rt}`;
  const playerShifted = shiftString(playerText.toUpperCase(), rt);
  const fromFuture = shiftString(future, -rt);
  return {
    echo: playerShifted,
    fromFuture,
    rawFuture: future,
    rt
  };
}

export function sendMorse(state, morseLetter, bus, store) {
  const ch = (morseLetter || '').toUpperCase();
  if (!/^[A-Z]$/.test(ch)) return;
  state.machines.chronostat.sent.push({ ts: Date.now(), ch, rt: state.machines.chronostat.roundTrips });
  state.discoveries.chronostat_sent = true;
  bus?.emit('notebook:auto', {
    title: `CHRONOSTAT sent: ${ch}`,
    body: `You tapped Morse for "${ch}". The plate flickered. (Round-trip #${state.machines.chronostat.roundTrips + 1}.)`
  });
  bus?.emit('discovery', { id: 'chronostat_sent' });

  // Schedule reply. The reply must be applied to the *current* store state,
  // not the captured closure state — between now and DELAY_MS the player
  // may have triggered other sets that deepCloned state, orphaning `state`.
  setTimeout(() => {
    if (store) {
      store.set(s => deliverReply(s, bus));
    } else {
      deliverReply(state, bus);
    }
  }, DELAY_MS);
}

function deliverReply(state, bus) {
  const rt = state.machines.chronostat.roundTrips;
  if (rt >= FUTURE_MESSAGES.length) return;
  const lastSent = state.machines.chronostat.sent[state.machines.chronostat.sent.length - 1];
  const playerText = lastSent ? lastSent.ch : 'X';
  const reply = computeReply(rt, playerText);
  state.machines.chronostat.inbox.push({ ts: Date.now(), ...reply });
  state.machines.chronostat.roundTrips = rt + 1;
  state.discoveries.chronostat_round_trip = true;
  state.machines.chronostat.shift = (rt + 1) % 7;

  if (!state.chron_mem.shifts[rt]) state.chron_mem.shifts[rt] = [];
  state.chron_mem.shifts[rt].push({ ts: Date.now(), from: 'future', text: reply.rawFuture });

  if (state.machines.chronostat.roundTrips >= 6 && !state.machines.chronostat.unlockedVerb) {
    state.machines.chronostat.unlockedVerb = true;
    state.discoveries.chronostat_drift = true;
    bus?.emit('notebook:auto', {
      title: 'CHRONOSTAT — door unlocked',
      body: 'After six round-trips the chronostat emits a steady tone. The south corridor ' +
            'door to the Verboten Engine is now unsealed. The drift across shifts is consistent. ' +
            'You begin to suspect the future self is you.'
    });
    bus?.emit('discovery', { id: 'chronostat_drift' });
    bus?.emit('notebook:auto', {
      title: 'CHRONOSTAT drift hypothesis',
      body: 'Each reply, the letter you sent appears shifted by one more position. ' +
            'This is consistent with a closed loop running six steps ahead. You are talking ' +
            'to your future self, six round-trips older.'
    });
  }

  bus?.emit('notebook:auto', {
    title: `CHRONOSTAT reply #${rt + 1}`,
    body: `Plate glows: "${reply.fromFuture}". (Raw from the future: "${reply.rawFuture}".)`
  });
  bus?.emit('discovery', { id: 'chronostat_round_trip' });
  bus?.emit('chronostat:reply', reply);
}

export function chronostatView(state) {
  return {
    sent: state.machines.chronostat.sent,
    inbox: state.machines.chronostat.inbox,
    roundTrips: state.machines.chronostat.roundTrips,
    shift: state.machines.chronostat.shift,
    unlockedVerb: state.machines.chronostat.unlockedVerb,
    drift: state.machines.chronostat.shift > 0
  };
}

// Translate a Morse code string ('.-' etc) to a letter.
const MORSE = {
  '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
  '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
  '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
  '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
  '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
  '--..': 'Z'
};
export function morseToLetter(code) {
  return MORSE[(code || '').trim()] || null;
}
