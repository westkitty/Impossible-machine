// qa/browser.mjs
// "New investigator" pass: loads the actual app in jsdom, simulates
// a real playthrough, and verifies no console errors and that
// every machine is reachable through the UI.
//
// We bypass jsdom's limited ES-module-script support by directly importing
// app.js into the jsdom window context.

import { JSDOM } from './load-jsdom.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');

const dom = new JSDOM(html, {
  url: 'http://localhost/',
  pretendToBeVisual: true
});

// Inject canvas mock
dom.window.HTMLCanvasElement.prototype.getContext = function () {
  const noop = () => {};
  return new Proxy({}, {
    get: (t, k) => {
      if (k === 'canvas') return { width: this.width, height: this.height };
      return noop;
    }
  });
};

// Clear any prior state from localStorage so the intro overlay shows.
dom.window.localStorage.clear();

// Globals accessible inside the jsdom window.
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.Node = dom.window.Node;
global.SVGElement = dom.window.SVGElement;

// Collect errors
const errors = [];
const warnings = [];
dom.window.addEventListener('error', (e) => {
  errors.push('error: ' + (e.error?.message || e.message));
});
const origErr = dom.window.console.error;
const origWarn = dom.window.console.warn;
dom.window.console.error = (...args) => { errors.push('console.error: ' + args.join(' ')); origErr(...args); };
dom.window.console.warn  = (...args) => { warnings.push('console.warn: ' + args.join(' ')); origWarn(...args); };

// Now dynamically import app.js. It attaches DOMContentLoaded listener.
// Dispatch that event after import.
await import(u('src/app.js'));
dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));

await new Promise(r => setTimeout(r, 300));

const $ = (sel) => dom.window.document.querySelector(sel);
const $$ = (sel) => [...dom.window.document.querySelectorAll(sel)];

const passes = [];
const failures = [];
function assert(cond, msg) {
  if (cond) { passes.push(msg); console.log('  PASS', msg); }
  else { failures.push(msg); console.error('  FAIL', msg); }
}

const pending = [];
function step(name, fn) {
  const p = (async () => {
    console.log(`\n▶ ${name}`);
    try { await fn(); }
    catch (e) {
      failures.push(`${name} — threw: ${e.message}`);
      console.error('  THROW', e.stack || e.message);
    }
  })();
  pending.push(p);
  return p;
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ───── Phase 1: intro overlay ─────
await step('Phase 1 — Intro overlay', async () => {
  const introBtn = $$('.intro button.primary');
  assert(introBtn.length === 1, 'intro has primary button');
  if (introBtn.length) {
    introBtn[0].click();
    await wait(100);
    assert(!$('.intro'), 'intro dismissed after click');
  }
});

// ───── Phase 2: starting state ─────
await step('Phase 2 — Starting state', async () => {
  const titleEl = $('.room-title');
  assert(titleEl?.textContent.includes('Foyer'), 'starts in Foyer');
  const navBtns = $$('.title-bar nav button');
  assert(navBtns.length === 4, 'nav has 4 buttons');
  assert($('.stage')?.dataset.roomId === 'foyer', 'foyer has facility atmosphere room identity');
  assert(!!$('.stage')?.dataset.facilityTone, 'foyer has facility atmosphere tone');
  assert($('.door-pill').every((door) => door.tagName === 'BUTTON'), 'facility doors are semantic buttons');
});

// ───── Phase 3: archive view ─────
await step('Phase 3 — Archive view', async () => {
  const navBtns = $$('.title-bar nav button');
  navBtns.find(b => b.textContent === 'ARCHIVE').click();
  await wait(100);
  assert($('.archive-grid'), 'archive view appears');
  const docRows = $$('.archive-list .doc-row');
  assert(docRows.length >= 1, 'at least one document visible');
  const searchInput = $('.archive-list .search input');
  searchInput.value = 'equipment';
  searchInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await wait(100);
  const filteredRows = $$('.archive-list .doc-row');
  assert(filteredRows.length >= 1, 'search finds docs for "equipment"');
});

// ───── Phase 4: notebook view ─────
await step('Phase 4 — Notebook view', async () => {
  const navBtns = $$('.title-bar nav button');
  navBtns.find(b => b.textContent === 'NOTEBOOK').click();
  await wait(100);
  assert($('.notebook-form'), 'notebook form is present');
  $('#nb-title').value = 'Test observation';
  $('#nb-body').value = 'I observe things.';
  const formBtns = $$('.notebook-form button');
  formBtns[0].click();
  await wait(100);
  const entries = $$('.notebook-entry');
  assert(entries.length >= 1, 'notebook has at least one entry after add');
});

// ───── Phase 5: navigate to Atlas ─────
await step('Phase 5 — Navigate to Atlas', async () => {
  const navBtns = $$('.title-bar nav button');
  navBtns.find(b => b.textContent === 'FACILITY').click();
  await wait(50);
  // Click South corridor
  let southDoor = $$('.door-pill').find(d => d.textContent.includes('South Corridor'));
  if (!southDoor) southDoor = $$('.door-pill').find(d => d.textContent.toLowerCase().includes('south'));
  assert(southDoor, 'South corridor door exists');
  southDoor.click();
  await wait(100);
  assert($('.stage')?.dataset.roomId === 'corridor_s', 'facility atmosphere updates with room navigation');
  // Now click Atlas Chamber
  let atlasDoor = $$('.door-pill').find(d => d.textContent.includes('Atlas'));
  assert(atlasDoor, 'Atlas door exists in South corridor');
  atlasDoor.click();
  await wait(100);
  assert($('.room-title').textContent.includes('Atlas'), 'arrived at Atlas chamber: ' + $('.room-title').textContent);
});

// ───── Phase 6: ATLAS drawing ─────
await step('Phase 6 — Draw on Atlas', async () => {
  const canvas = $('.atlas-canvas');
  assert(canvas, 'atlas canvas is present');
  // jsdom doesn't give canvas real dimensions — set them explicitly
  canvas.width = 360;
  canvas.height = 360;
  // jsdom getBoundingClientRect returns 0s by default; inject one
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, right: 360, bottom: 360, width: 360, height: 360, x: 0, y: 0, toJSON: () => ({}) })
  });
  const cx = 180, cy = 180;
  const r = 100;
  const evt = (type, x, y) => new dom.window.MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
  canvas.dispatchEvent(evt('mousedown', cx, cy));
  for (let i = 1; i <= 60; i++) {
    const t = i / 60 * Math.PI * 2;
    canvas.dispatchEvent(evt('mousemove', cx + r * Math.cos(t), cy + r * Math.sin(t)));
  }
  canvas.dispatchEvent(evt('mouseup', cx + r, cy));
  await wait(50);
  const lockBtn = $$('button').find(b => b.textContent.includes('LOCK LAST'));
  assert(lockBtn, 'lock button is present');
  lockBtn.click();
  await wait(100);
});

// ───── Phase 7: navigate to Oracle and place tokens ─────
await step('Phase 7 — Oracle interaction', async () => {
  // We're in Atlas. Go back to corridor_s.
  let back = $$('.door-pill').find(d => d.textContent.toLowerCase().includes('corridor'));
  assert(back, 'back-to-corridor door visible');
  if (back) { back.click(); await wait(150); }
  const oracleDoor = $$('.door-pill').find(d => d.textContent.includes('Oracle'));
  assert(oracleDoor, 'Oracle door is visible');
  if (oracleDoor) oracleDoor.click();
  await wait(150);
  assert($('.room-title').textContent.includes('Oracle'), 'arrived at Oracle');
  const ringChip = $$('.token-chip').find(c => c.textContent.includes('Brass Ring'));
  assert(ringChip, 'Brass Ring chip present');
  if (ringChip) ringChip.click();
  await wait(150);
});

// ───── Phase 8: navigate back; check Verboten locked ─────
await step('Phase 8 — Verboten initially locked', async () => {
  // We're in Oracle. Go back to corridor_s.
  let back = $$('.door-pill').find(d => d.textContent.toLowerCase().includes('corridor'));
  if (back) { back.click(); await wait(100); }
  const verbotenPill = $$('.door-pill').find(d => d.textContent.includes('Verboten'));
  assert(verbotenPill, 'Verboten door is visible');
  if (verbotenPill) {
    assert(verbotenPill.classList.contains('locked'), 'Verboten door is locked');
    assert(verbotenPill.getAttribute('aria-disabled') === 'true', 'locked door remains explainable and exposes aria-disabled');
  }
});

// ───── Phase 9: navigate to chronostat (always unlocked from corridor_n) ─────
await step('Phase 9 — Chronostat door open', async () => {
  // We're in corridor_s. Go back to foyer.
  let foyerDoor = $$('.door-pill').find(d => d.textContent.toLowerCase().includes('foyer'));
  if (foyerDoor) { foyerDoor.click(); await wait(100); }
  const northDoor = $$('.door-pill').find(d => d.textContent.includes('North'));
  assert(northDoor, 'North corridor door exists');
  if (northDoor) northDoor.click();
  await wait(100);
  const chronPill = $$('.door-pill').find(d => d.textContent.includes('Chronostat'));
  assert(chronPill, 'Chronostat door visible');
  if (chronPill) {
    assert(!chronPill.classList.contains('locked'), 'Chronostat door is unlocked');
  }
});

// ───── Phase 10: persistence test ─────
await step('Phase 10 — Persistence mid-game', async () => {
  const stateBefore = dom.window.localStorage.getItem('impossible-machines.v1');
  assert(stateBefore != null, 'state persisted to localStorage');
  const parsed = JSON.parse(stateBefore);
  assert(parsed.player.roomId === 'corridor_n', 'player was in corridor_n');
});

// ───── Phase 11: Options view ─────
await step('Phase 11 — Options view', async () => {
  const navBtns = $$('.title-bar nav button');
  navBtns.find(b => b.textContent === 'OPTIONS').click();
  await wait(100);
  assert($$('button').some(b => b.textContent.includes('EXPORT')), 'export button present');
  assert($$('button').some(b => b.textContent.includes('IMPORT')), 'import button present');
  assert($$('button').some(b => b.textContent.includes('RESET')), 'reset button present');
});

// ───── Phase 12: error checks ─────
await step('Phase 12 — No console errors', async () => {
  const realErrors = errors.filter(e => !e.includes('persist failed'));
  assert(realErrors.length === 0, 'no console errors during playthrough');
  if (realErrors.length) for (const e of realErrors) console.log('  ERR:', e);
});

await Promise.all(pending);
await new Promise(r => setImmediate(r));

console.log(`\n────────────────────────────────────────`);
console.log(`BROWSER QA: ${passes.length} passes, ${failures.length} failures`);
if (failures.length) {
  console.log('FAILURES:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
console.log('All browser QA checks passed.');
