// src/state/store.js
// Central state for the entire game. Subsystems read from it and emit commands.
// Persistence is localStorage by default, JSON export/import available.

import { deepClone, now, uid } from '../core/util.js';
import { createBus } from '../core/bus.js';

const STORAGE_KEY = 'impossible-machines.v1';

export function createStore(initial = {}) {
  const bus = createBus();
  let state = initial;
  let hydrated = false;

  function get() { return state; }
  function set(mutator, opts = {}) {
    // Allow mutator to return either nothing, or { result, events } where
    // events is an array of { name, payload } for the bus. Events are emitted
    // AFTER the state has been committed, so listeners that call set() again
    // don't clobber the in-progress mutation.
    const next = deepClone(state);
    const out = mutator(next);
    state = next;
    if (!opts.silent) bus.emit('change', state);
    if (!opts.noPersist) persist();
    if (out && Array.isArray(out.events)) {
      for (const e of out.events) bus.emit(e.name, e.payload);
    } else if (out && typeof out === 'object' && out.event) {
      bus.emit(out.event.name, out.event.payload);
    }
    return out && Object.prototype.hasOwnProperty.call(out, 'result') ? out.result : out;
  }
  function replace(next, opts = {}) {
    state = next;
    if (!opts.silent) bus.emit('change', state);
    if (!opts.noPersist) persist();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[state] persist failed', e);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        state = parsed;
        hydrated = true;
        bus.emit('hydrate', state);
        bus.emit('change', state);
        return true;
      }
    } catch (e) {
      console.warn('[state] load failed', e);
    }
    return false;
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    state = initial;
    bus.emit('reset', state);
    bus.emit('change', state);
  }

  function exportJson() {
    return JSON.stringify(state, null, 2);
  }

  function importJson(text) {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
      state = parsed;
      persist();
      bus.emit('hydrate', state);
      bus.emit('change', state);
      return true;
    } catch (e) {
      console.warn('[state] import failed', e);
      return false;
    }
  }

  return { get, set, replace, load, reset, exportJson, importJson, bus, hydrated: () => hydrated };
}

// Default initial state factory.
export function defaultState() {
  return {
    meta: {
      version: 1,
      created: now(),
      lastTick: now(),
      // Determines ending variant at the end of the run.
      ending: null, // 'partial' | 'full' | 'refused' | null
      rngSeed: 0xC0FFEE
    },
    // Facility: which room is the player in?
    player: {
      roomId: 'foyer'
    },
    // Rooms: each has a definition (id, name, doors, contents).
    rooms: {
      foyer:        { unlocked: true,  visited: true,  flags: {} },
      corridor_n:   { unlocked: true,  visited: false, flags: {} },
      corridor_s:   { unlocked: true,  visited: false, flags: {} },
      // The following rooms start "unlocked" because their *doors* gate access,
      // not the room's existence. The room metadata tracks whether you've entered.
      deimos:       { unlocked: true,  visited: false, flags: {} },
      chronostat:   { unlocked: true,  visited: false, flags: {} },
      atlas:        { unlocked: true,  visited: false, flags: {} },
      archive:      { unlocked: true,  visited: false, flags: {} },
      oracle:       { unlocked: true,  visited: false, flags: {} },
      verboten:     { unlocked: true,  visited: false, flags: {} },
      sundial:      { unlocked: true,  visited: false, flags: {} },
      director:     { unlocked: true,  visited: false, flags: {} }
    },
    // Each machine has its own little state blob.
    machines: {
      deimos:   { orientation: 0, safeOpen: false },
      chronostat: {
        // sequence of morse taps the player has sent.
        sent: [],
        // current shift (starts at 0, increments by 1 each round-trip until 6).
        shift: 0,
        // messages received from "future self".
        inbox: [],
        // number of completed round-trips.
        roundTrips: 0,
        // whether the player has heard the door-unlock phrase.
        unlockedVerb: false
      },
      atlas: {
        // strokes: array of { id, points:[{x,y}], locked:boolean }
        strokes: [],
        // locked shape count, used as a gate.
        lockedShapes: 0,
        // the locked outline that opens the sundial door.
        openedSundial: false
      },
      archive: {
        // revealed staff IDs, in order of discovery.
        revealed: [],
        // the final composite identity the player has assembled.
        composite: { a: 0, b: 0, c: 0 }, // filled in via 'analysis' action
        // Has the player solved the Archive's puzzle?
        solved: false
      },
      oracle: {
        // inventory: object ids the player is holding.
        inventory: [],
        // placed: which objects are on the scale.
        placed: [],
        // readings: { objId: grams } inverse-weight reading
        readings: {},
        // has the player discovered the significance-reading rule?
        ruleLearned: false,
        // has the Oracle opened the Director's door?
        openedDirector: false
      },
      verboten: {
        // printed forbidden words (consumed by furnace; the player "captures" them)
        wordsPrinted: [],
        // captures: word -> first time player snapshot it
        captures: {},
        // has the engine revealed enough for the Director door?
        openedDirector: false
      },
      sundial: {
        // time of day on the in-game clock, in hours 0..24. Moves backward.
        hour: 12,
        // glyphs: the 7 access code chars revealed at hour boundaries.
        glyphs: [],
        // full access code assembled?
        accessCode: null,
        // has the player used the access code successfully?
        used: false
      }
    },
    // Documents the player has unlocked/read.
    archive_seen: {},   // docId -> boolean
    archive_search_index_built: false,
    // Notebook: player-written observations and auto-recorded discoveries.
    notebook: {
      entries: [] // { id, ts, kind: 'observation'|'inference'|'auto', title, body, refs: [] }
    },
    // Discovery ledger: each machine has flags for "you discovered X".
    discoveries: {
      gravity_flip: false,
      safe_opened: false,
      chronostat_sent: false,
      chronostat_round_trip: false,
      chronostat_drift: false,
      atlas_drawn: false,
      atlas_erase: false,
      atlas_lock: false,
      archive_polaroid: false,
      archive_match: false,
      archive_solved: false,
      oracle_place: false,
      oracle_inverse: false,
      oracle_significance: false,
      verboten_furnace: false,
      verboten_capture: false,
      verboten_secret: false,
      sundial_shadow: false,
      sundial_reversal: false,
      sundial_code: false,
      director_unlocked: false,
      ending_partial: false,
      ending_full: false,
      ending_refused: false,
    },
    // Used by the chronostat future-self engine to remember messages sent at shift=N.
    chron_mem: {
      // shift -> [{ ts, from: 'us'|'future', text }]
      shifts: {}
    }
  };
}
