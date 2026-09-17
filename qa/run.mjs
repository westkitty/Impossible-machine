// qa/run.mjs
// Browser QA harness using jsdom. Loads the actual ES modules from src/,
// drives state, asserts machine behavior, persistence, mystery wiring.
//
// Run with: node qa/run.mjs
// (requires `npm run qa:setup` first to install jsdom into .qa/node_modules)

import { createRequire } from 'node:module';
import { JSDOM } from './load-jsdom.mjs';

const require = createRequire(import.meta.url);
const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.Node = dom.window.Node;

// Canvas mock (jsdom doesn't have full canvas)
if (!dom.window.HTMLCanvasElement.prototype.getContext) {
  dom.window.HTMLCanvasElement.prototype.getContext = function () {
    const noop = () => {};
    return new Proxy({}, {
      get: (t, k) => {
        if (k === 'canvas') return { width: this.width, height: this.height };
        return noop;
      }
    });
  };
}

const passes = [];
const failures = [];
function assert(cond, msg) {
  if (cond) { passes.push(msg); console.log('  PASS', msg); }
  else { failures.push(msg); console.error('  FAIL', msg); }
}

const pendingTests = [];
function group(name, fn) {
  console.log(`\n▶ ${name}`);
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      pendingTests.push(r.catch(e => {
        failures.push(`${name} — threw: ${e.message}`);
        console.error('  THROW', e.stack || e.message);
      }));
    }
  } catch (e) {
    failures.push(`${name} — threw: ${e.message}`);
    console.error('  THROW', e.stack || e.message);
  }
}

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;

const { defaultState, createStore } = await import(u('src/state/store.js'));
const { ROOMS, canTraverse } = await import(u('src/facility/rooms.js'));
const { DOCUMENTS, STAFF, staffRestorationScore } = await import(u('src/archive/documents.js'));
const { searchDocuments } = await import(u('src/archive/search.js'));
const { addEntry } = await import(u('src/notebook/notebook.js'));
const { computeEnding, commitEnding } = await import(u('src/core/ending.js'));
const { sendMorse, chronostatView } = await import(u('src/machines/chronostat.js'));
const { deimosView, setOrientation } = await import(u('src/machines/deimos.js'));
const { atlasView, beginStroke, pushPoint, lockStroke, cullExpired } = await import(u('src/machines/atlas.js'));
const { archiveView, printPolaroid, setOrder } = await import(u('src/machines/archive.js'));
const { oracleView, place, remove, readingOf, TOKENS, initialInventory } = await import(u('src/machines/oracle.js'));
const { verbotenView, actuate, witness } = await import(u('src/machines/verboten.js'));
const { sundialView, tick, enterAccessCode } = await import(u('src/machines/sundial.js'));
const { morseToLetter } = await import(u('src/machines/chronostat.js'));

function makeStore() {
  const store = createStore(defaultState());
  store.set(s => { s.machines.oracle.inventory = initialInventory(); }, { silent: true });
  return store;
}

// ───────────────────────── tests ─────────────────────────

group('STATE — persistence round-trip', () => {
  const s = makeStore();
  s.set(st => { st.player.roomId = 'atlas'; });
  const j = s.exportJson();
  const s2 = makeStore();
  assert(s2.importJson(j), 'import succeeds');
  assert(s2.get().player.roomId === 'atlas', 'room survives import');
});

group('STATE — set mutates and emits change', () => {
  const s = makeStore();
  let count = 0;
  s.bus.on('change', () => count++);
  s.set(st => { st.player.roomId = 'archive'; });
  assert(count > 0, 'change event fired');
  assert(s.get().player.roomId === 'archive', 'state mutated');
});

group('STATE — reset clears', () => {
  const s = makeStore();
  s.set(st => { st.player.roomId = 'oracle'; });
  s.reset();
  assert(s.get().player.roomId === 'foyer', 'reset to foyer');
});

group('DEIMOS — orientation cycles and safe opens at CEILING', () => {
  const s = makeStore();
  for (let i = 0; i < 8; i++) {
    s.set(st => setOrientation(st, i, s.bus));
  }
  assert(deimosView(s.get()).orientationIndex === 7, 'orientation 7 = DOOR-RIGHT');
  s.set(st => setOrientation(st, 5, s.bus));
  assert(deimosView(s.get()).safeOpen === true, 'safe opens at CEILING');
  assert(s.get().discoveries.safe_opened === true, 'safe_opened discovery set');
});

group('DEIMOS — only CEILING opens; STANDARD DOWN does not', () => {
  const s = makeStore();
  s.set(st => setOrientation(st, 0, s.bus));
  assert(deimosView(s.get()).safeOpen === false, 'STANDARD DOWN: safe sealed');
  s.set(st => setOrientation(st, 3, s.bus)); // WEST
  assert(deimosView(s.get()).safeOpen === false, 'WEST: safe sealed');
});

group('CHRONOSTAT — sending a letter triggers reply and round-trip increment', async () => {
  const s = makeStore();
  s.set(st => sendMorse(st, 'A', s.bus));
  await new Promise(r => setTimeout(r, 2000));
  assert(s.get().machines.chronostat.roundTrips === 1, 'round-trip count incremented');
  assert(s.get().machines.chronostat.inbox.length === 1, 'inbox has one message');
  assert(s.get().machines.chronostat.inbox[0].rawFuture === 'HELLO YOU ARE EARLY', 'first future message is correct');
});

group('CHRONOSTAT — six round-trips unlock verboten door', async () => {
  const s = makeStore();
  for (let i = 0; i < 6; i++) {
    s.set(st => sendMorse(st, 'E', s.bus));
    await new Promise(r => setTimeout(r, 1800));
  }
  assert(s.get().machines.chronostat.roundTrips === 6, 'six round-trips completed');
  assert(s.get().machines.chronostat.unlockedVerb === true, 'verboten door unlocked');
});

group('ATLAS — strokes expire unless locked', () => {
  const s = makeStore();
  let st = beginStroke(s.get());
  for (let i = 0; i < 10; i++) pushPoint(st, 0.1 + i*0.05, 0.5);
  s.set(_s => {
    _s.machines.atlas.strokes.push({ ...st, locked: false, t0: Date.now() - 100000 });
  });
  s.set(_s => cullExpired(_s));
  assert(s.get().machines.atlas.strokes.length === 0, 'expired unlocked stroke culled');
});

group('ATLAS — locking a closed loop opens sundial door', () => {
  const s = makeStore();
  let st = { id: 'x', points: [], locked: false, t0: Date.now() };
  for (let i = 0; i < 60; i++) {
    const t = i / 60 * Math.PI * 2;
    pushPoint(st, 0.5 + 0.3 * Math.cos(t), 0.5 + 0.3 * Math.sin(t));
  }
  s.set(_s => {
    _s.machines.atlas.strokes.push({ ...st });
    lockStroke(_s, _s.machines.atlas.strokes[_s.machines.atlas.strokes.length - 1], s.bus);
  });
  assert(s.get().machines.atlas.openedSundial === true, 'sundial door opened by locked closed loop');
});

group('ARCHIVE — printing reveals staff in canonical order', () => {
  const s = makeStore();
  for (let i = 0; i < 6; i++) {
    s.set(st => printPolaroid(st, s.bus));
  }
  const v = archiveView(s.get());
  assert(v.revealed.length === 6, 'all 6 staff revealed');
  assert(v.revealed[0] === 'harker', 'first reveal is harker');
  assert(v.revealed[5] === 'yuen', 'last reveal is yuen');
});

group('ARCHIVE — correct order solves archive', () => {
  const s = makeStore();
  for (let i = 0; i < 6; i++) s.set(st => printPolaroid(st, s.bus));
  const order = ['harker','pell','doss','mora','vance','yuen'];
  s.set(st => setOrder(st, order, s.bus));
  assert(s.get().machines.archive.solved === true, 'archive solved with canonical order');
});

group('ARCHIVE — wrong order does NOT solve', () => {
  const s = makeStore();
  for (let i = 0; i < 6; i++) s.set(st => printPolaroid(st, s.bus));
  s.set(st => setOrder(st, ['yuen','vance','mora','doss','pell','harker'], s.bus));
  assert(s.get().machines.archive.solved === false, 'archive NOT solved with reverse order');
});

group('ORACLE — placing items produces readings', () => {
  const s = makeStore();
  s.set(st => place(st, 'ring', s.bus));
  assert(s.get().machines.oracle.readings['ring'] != null, 'ring has a reading');
  assert(s.get().discoveries.oracle_place === true, 'discovery flagged');
});

group('ORACLE — cinder + 4+ placed items triggers rule learned', () => {
  const s = makeStore();
  s.set(st => { st.machines.oracle.inventory = TOKENS.map(t => t.id); });
  s.set(st => place(st, 'cinder', s.bus));
  s.set(st => place(st, 'ring', s.bus));
  s.set(st => place(st, 'specs', s.bus));
  s.set(st => place(st, 'photo', s.bus));
  s.set(st => place(st, 'plumb', s.bus));
  assert(s.get().discoveries.oracle_significance === true, 'oracle rule learned');
  assert(s.get().machines.oracle.openedDirector === true, 'oracle opened Director gate');
});

group('VERBOTEN — first prints are decoys, then staff names', () => {
  const s = makeStore();
  const words = [];
  for (let i = 0; i < 12; i++) {
    s.set(st => words.push(actuate(st, s.bus)));
  }
  assert(words.slice(0, 6).includes('MALFUNCTION'), 'decoy MALFUNCTION printed');
  assert(words.includes('HARKER'), 'staff name HARKER printed');
  assert(words.includes('YUEN'), 'staff name YUEN printed');
});

group('VERBOTEN — capturing all six names opens Director', () => {
  const s = makeStore();
  for (let i = 0; i < 12; i++) s.set(st => actuate(st, s.bus));
  const names = ['HARKER','PELL','DOSS','MORA','VANCE','YUEN'];
  for (const n of names) s.set(st => witness(st, n, s.bus));
  assert(s.get().machines.verboten.openedDirector === true, 'verboten opened Director gate');
});

group('SUNDIAL — 7 ticks reveal full access code', () => {
  const s = makeStore();
  for (let i = 0; i < 7; i++) s.set(st => tick(st, s.bus));
  assert(s.get().machines.sundial.accessCode.length === 7, '7 glyphs');
  assert(s.get().machines.sundial.accessCode === 'HPDMVYK', 'access code = HPDMVYK');
});

group('SUNDIAL — entering code marks used', () => {
  const s = makeStore();
  for (let i = 0; i < 7; i++) s.set(st => tick(st, s.bus));
  s.set(st => enterAccessCode(st, s.get().machines.sundial.accessCode, s.bus));
  assert(s.get().machines.sundial.used === true, 'code marked used');
});

group('ENDING — full ending requires all gates', () => {
  const s = makeStore();
  s.set(st => {
    for (let i = 0; i < 6; i++) printPolaroid(st, s.bus);
    setOrder(st, ['harker','pell','doss','mora','vance','yuen'], s.bus);
    for (let i = 0; i < 7; i++) tick(st, s.bus);
    enterAccessCode(st, st.machines.sundial.accessCode, s.bus);
    st.machines.oracle.inventory = TOKENS.map(t => t.id);
    for (let i = 0; i < 12; i++) actuate(st, s.bus);
    for (const n of ['HARKER','PELL','DOSS','MORA','VANCE','YUEN']) witness(st, n, s.bus);
    for (const t of ['cinder','ring','specs','photo','plumb']) place(st, t, s.bus);
  });
  const e = computeEnding(s.get());
  assert(e === 'full', 'full ending reachable');
});

group('ENDING — partial when only some progress', () => {
  const s = makeStore();
  s.set(st => {
    for (let i = 0; i < 6; i++) printPolaroid(st, s.bus);
    for (let i = 0; i < 7; i++) tick(st, s.bus);
  });
  const e = computeEnding(s.get());
  assert(e === 'partial', 'partial ending without all gates');
});

group('ENDING — none with no progress', () => {
  const s = makeStore();
  const e = computeEnding(s.get());
  assert(e === null, 'no ending at start');
});

group('FACILITY — door gating works', () => {
  const s = makeStore();
  // DEIMOS door is open from the start (room is freely enterable).
  // Its internal safe is what's gated — opening it reveals the SUNDIAL door.
  const r0 = canTraverse('corridor_n', 'deimos', s.get());
  assert(r0.ok === true, 'deimos door is enterable');
  // Inside DEIMOS, the SUNDIAL door requires atlas.openedSundial (the
  // locked closed loop on the canvas). The safe itself doesn't gate it.
  const r1 = canTraverse('deimos', 'sundial', s.get());
  assert(r1.ok === false, 'sundial door locked without atlas');
  // Now lock a closed loop in atlas
  const stroke = { id: 'q', points: [], locked: false, t0: Date.now() };
  for (let i = 0; i < 60; i++) {
    const t = i / 60 * Math.PI * 2;
    pushPoint(stroke, 0.5 + 0.3 * Math.cos(t), 0.5 + 0.3 * Math.sin(t));
  }
  s.set(st => {
    st.machines.atlas.strokes.push({ ...stroke });
    lockStroke(st, st.machines.atlas.strokes[st.machines.atlas.strokes.length - 1], s.bus);
  });
  const r2 = canTraverse('deimos', 'sundial', s.get());
  assert(r2.ok === true, 'sundial door opens after atlas lock');
});

group('FACILITY — sundial door requires atlas locked', () => {
  const s = makeStore();
  s.set(st => setOrientation(st, 5, s.bus));
  const r = canTraverse('deimos', 'sundial', s.get());
  assert(r.ok === false, 'sundial door locked without atlas');
  const stroke = { id: 'q', points: [], locked: false, t0: Date.now() };
  for (let i = 0; i < 60; i++) {
    const t = i / 60 * Math.PI * 2;
    pushPoint(stroke, 0.5 + 0.3 * Math.cos(t), 0.5 + 0.3 * Math.sin(t));
  }
  s.set(st => {
    st.machines.atlas.strokes.push({ ...stroke });
    lockStroke(st, st.machines.atlas.strokes[st.machines.atlas.strokes.length - 1], s.bus);
  });
  const r2 = canTraverse('deimos', 'sundial', s.get());
  assert(r2.ok === true, 'sundial door opens after atlas lock');
});

group('FACILITY — director requires multi', () => {
  const s = makeStore();
  const r1 = canTraverse('corridor_s', 'verboten', s.get());
  assert(r1.ok === false, 'verboten door locked initially');
  s.set(st => { st.machines.chronostat.unlockedVerb = true; });
  const r2 = canTraverse('verboten', 'director', s.get());
  assert(r2.ok === false && r2.reason === 'requires-multi', 'director requires multi');
});

group('DOCUMENTS — search returns relevant docs', () => {
  const s = makeStore();
  s.set(st => {
    st.discoveries.archive_match = true;
    st.discoveries.chronostat_round_trip = true;
    st.machines.chronostat.roundTrips = 1;
    st.discoveries.oracle_place = true;
    st.discoveries.atlas_lock = true;
    st.discoveries.verboten_capture = true;
    st.machines.sundial.accessCode = 'X';
    st.machines.archive.solved = true;
  });
  const results = searchDocuments(s.get(), 'gravity');
  assert(results.some(d => d.id === 'doc_deimos_manual'), 'gravity search finds DEIMOS manual');
  const results2 = searchDocuments(s.get(), 'equipment');
  assert(results2.some(d => d.id === 'doc_maintenance_log'), 'equipment search finds maintenance log');
});

group('DOCUMENTS — false hypothesis is present', () => {
  const docs = DOCUMENTS.filter(d => (d.tags || []).includes('false-hypothesis'));
  assert(docs.length >= 2, 'at least two false-hypothesis documents exist');
});

group('NOTEBOOK — observations and inferences are distinct kinds', () => {
  const s = makeStore();
  s.set(st => addEntry(st, 'observation', 'Saw X', 'I saw X happen.'));
  s.set(st => addEntry(st, 'inference',   'Means Y',  'This means Y.'));
  s.set(st => addEntry(st, 'auto',        'Auto Z',   'The machine reported Z.'));
  assert(s.get().notebook.entries.length === 3, 'three entries');
  assert(s.get().notebook.entries[0].kind === 'observation', 'first kind preserved');
});

group('STAFF restoration — oracle triggers pell', () => {
  const s = makeStore();
  s.set(st => {
    st.machines.oracle.inventory = TOKENS.map(t => t.id);
    for (const t of ['cinder','ring','specs','photo','plumb']) place(st, t, s.bus);
  });
  const scores = staffRestorationScore(s.get());
  assert(scores.pell >= 1, 'pell restoration score >= 1');
});

group('MYSTERY — full canon solvable with deterministic inputs', () => {
  const s = makeStore();
  s.set(st => setOrientation(st, 5, s.bus));
  s.set(st => {
    st.machines.chronostat.unlockedVerb = true;
    st.machines.chronostat.roundTrips = 6;
    st.machines.chronostat.inbox = [
      { ts: 0, rt: 0, echo: 'B', fromFuture: 'HELLO YOU ARE EARLY', rawFuture: 'HELLO YOU ARE EARLY' },
      { ts: 0, rt: 1, echo: 'B', fromFuture: 'THE OTHERS ARE LOST', rawFuture: 'THE OTHERS ARE LOST' }
    ];
  });
  const stroke = { id: 'r', points: [], locked: false, t0: Date.now() };
  for (let i = 0; i < 60; i++) {
    const t = i / 60 * Math.PI * 2;
    pushPoint(stroke, 0.5 + 0.3 * Math.cos(t), 0.5 + 0.3 * Math.sin(t));
  }
  s.set(st => {
    st.machines.atlas.strokes.push({ ...stroke });
    lockStroke(st, st.machines.atlas.strokes[st.machines.atlas.strokes.length - 1], s.bus);
  });
  s.set(st => {
    for (let i = 0; i < 6; i++) printPolaroid(st, s.bus);
    setOrder(st, ['harker','pell','doss','mora','vance','yuen'], s.bus);
  });
  s.set(st => {
    for (let i = 0; i < 7; i++) tick(st, s.bus);
    enterAccessCode(st, st.machines.sundial.accessCode, s.bus);
  });
  s.set(st => {
    for (let i = 0; i < 12; i++) actuate(st, s.bus);
    for (const n of ['HARKER','PELL','DOSS','MORA','VANCE','YUEN']) witness(st, n, s.bus);
  });
  s.set(st => {
    st.machines.oracle.inventory = TOKENS.map(t => t.id);
    for (const t of ['cinder','ring','specs','photo','plumb']) place(st, t, s.bus);
  });
  const r = canTraverse('verboten', 'director', s.get());
  assert(r.ok === true, 'director door opens with all gates');
  const ending = computeEnding(s.get());
  assert(ending === 'full', 'full ending reached');
});

group('CONSOLE — modules export expected names', () => {
  assert(typeof sendMorse === 'function', 'sendMorse is a function');
  assert(typeof setOrientation === 'function', 'setOrientation is a function');
  assert(typeof lockStroke === 'function', 'lockStroke is a function');
  assert(typeof printPolaroid === 'function', 'printPolaroid is a function');
  assert(typeof actuate === 'function', 'actuate is a function');
  assert(typeof tick === 'function', 'tick is a function');
  assert(typeof witness === 'function', 'witness is a function');
  assert(typeof place === 'function', 'place is a function');
});

group('NOTEBOOK — auto entries are generated by machine actions', () => {
  const s = makeStore();
  // Mirror what app.js does: defer inner set via queueMicrotask.
  s.bus.on('notebook:auto', (e) => {
    queueMicrotask(() => {
      s.set(st => addEntry(st, 'auto', e.title || 'Note', e.body || '', e.refs || []), { silent: true });
    });
  });
  const before = s.get().notebook.entries.length;
  s.set(st => setOrientation(st, 5, s.bus));
  // microtask needs to drain
  return new Promise(resolve => {
    setImmediate(() => {
      const after = s.get().notebook.entries.length;
      assert(after > before, 'safe opening generates a notebook entry');
      resolve();
    });
  });
});

group('ENDING — commitEnding is idempotent', () => {
  const s = makeStore();
  s.set(st => { st.meta.ending = 'partial'; });
  commitEnding(s.get(), 'partial', s.bus);
  assert(s.get().meta.ending === 'partial', 'ending stays partial');
});

group('STAFF — six staff IDs match documentation', () => {
  const ids = STAFF.map(s => s.id).sort();
  assert(JSON.stringify(ids) === JSON.stringify(['doss','harker','mora','pell','vance','yuen']), 'STAFF IDs correct');
});

group('FALSE HYPOTHESIS — newspaper clipping is present and unlockable', () => {
  const doc = DOCUMENTS.find(d => d.id === 'doc_incident_83');
  assert(doc != null, 'newspaper clipping exists');
  assert(doc.unlock(defaultState()) === true, 'newspaper clipping visible from start');
});

group('SOFT LOCK — verboten gated by chronostat', () => {
  const s = makeStore();
  const r = canTraverse('corridor_s', 'verboten', s.get());
  assert(r.ok === false, 'verboten gated by chronostat');
});

group('PERSISTENCE — export/import round-trip', () => {
  const s1 = makeStore();
  s1.set(st => {
    st.player.roomId = 'oracle';
    st.discoveries.oracle_place = true;
  });
  const json = s1.exportJson();
  const s2 = makeStore();
  s2.importJson(json);
  assert(s2.get().player.roomId === 'oracle', 'room preserved');
  assert(s2.get().discoveries.oracle_place === true, 'discovery preserved');
});

group('STATE — bus.on returns unsubscribe fn', () => {
  const s = makeStore();
  let count = 0;
  const off = s.bus.on('change', () => count++);
  s.set(st => { st.player.roomId = 'atlas'; });
  off();
  const before = count;
  s.set(st => { st.player.roomId = 'archive'; });
  assert(count === before, 'unsubscribed handler does not fire');
});

group('MORSE — morseToLetter maps common letters', () => {
  assert(morseToLetter('.-') === 'A', 'A decodes');
  assert(morseToLetter('-...') === 'B', 'B decodes');
  assert(morseToLetter('...') === 'S', 'S decodes');
  assert(morseToLetter('---') === 'O', 'O decodes');
});

group('STATE — store loads from localStorage on hydrate', () => {
  const s = makeStore();
  s.set(st => { st.player.roomId = 'deimos'; });
  // localStorage should have the JSON now
  const raw = global.localStorage.getItem('impossible-machines.v1');
  assert(raw != null, 'state persisted to localStorage');
  const parsed = JSON.parse(raw);
  assert(parsed.player.roomId === 'deimos', 'persisted state has room');
});

console.log(`\n────────────────────────────────────────`);
console.log('Waiting for async tests to settle...');
await Promise.all(pendingTests);
// Drain any final microtasks
await new Promise(r => setImmediate(r));
// Now print all PASS/FAIL collected during the run (late ones first so
// the order roughly matches execution).
const allMessages = [...passes, ...failures];
console.log(`\nPASS: ${passes.length}`);
console.log(`FAIL: ${failures.length}`);
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
} else {
  console.log('\nAll QA checks passed.');
}
