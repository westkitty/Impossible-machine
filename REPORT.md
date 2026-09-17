# THE DEPARTMENT OF IMPOSSIBLE MACHINES — Final Report

A six-section writeup of what was built, how it's organized, what the seven machines do, what was verified, what is unfinished, and how to launch it.

---

## 1. What was created

A complete, self-contained, browser-based interactive mystery in the spirit of a late-1970s government research wing that was sealed overnight and never reopened. The player inherits the keys, walks through a domed foyer into two corridors, and finds:

- **Four locked / sealed doors** that open in response to specific machine interactions.
- **Seven distinct machines**, each with its own interaction model (rotary dial, drawing canvas, telegraph key, tape printer, wall printer, brass scale, armillary sphere).
- **A research archive** of documents, staff dossiers, experiment logs, and diagrams — searchable by free text.
- **An experiment notebook** that accepts manual entries and auto-appends its own observations; every entry is tagged as either observation or inference.
- **Persistent state** (auto-saved to `localStorage`) with full export, import, and reset.
- **Multiple endings** based on how much of the mystery the player has resolved by the time they reach the Director's Office.

The whole game is a single HTML page, ~30 source files, ~4,800 lines of JavaScript, one CSS file, and one zero-dependency Node static server. There is no build step, no client-side dependency, no framework.

---

## 2. Architecture

### Code organization

```
src/
  core/         bus.js, dom.js, util.js, ending.js
  state/        store.js           (in-memory store + persistence)
  facility/     rooms.js           (room graph + canTraverse())
  archive/      documents.js, search.js
  notebook/     notebook.js
  machines/     deimos.js, atlas.js, chronostat.js, verboten.js,
                archive.js, oracle.js, sundial.js
  ui/           machines.js, styles.css
  app.js        (controller: routing, view orchestration)
qa/
  setup.mjs, load-jsdom.mjs, run.mjs, browser.mjs, playthrough.mjs
server/
  serve.mjs     (zero-dep static server)
```

### Strict rules followed

- **Plain ES modules** everywhere; no bundler, no transpiler.
- **One CSS file**, hand-authored with a deliberate post-war-institutional art direction (cold greens, brass, paper, monospace metadata).
- **No `node_modules`** at the project root. jsdom (the only QA dependency) is installed into `.qa/node_modules` and is gitignored.
- **No client-side dependency at all.** The page that ships has zero `<script src="https://…">`.

### State architecture

A single `store` object holds the entire game state. Every state change goes through `store.set(updater)`. The store:

1. Clones the state (so mutations don't leak between views).
2. Calls the updater function.
3. Emits a `change` event on a small pub/sub `bus`.
4. Persists to `localStorage`.

UI builders subscribe to `change` and re-render. Machine modules are pure functions over `state`; they never touch the DOM. The DOM only ever calls `store.set(s => machineFn(s))`.

### Door-gating

Doors can require either a specific machine flag (`{ machine: 'atlas', flag: 'openedSundial' }`) or a multi-flag aggregate (`'multi'`, resolved at runtime — used only for the Director's Office). `canTraverse(from, to, state)` is the single chokepoint.

### Persistence

`localStorage` key `impossible-machines.v1`. Schema-versioned for future-proofing. Export produces a JSON download; import accepts the same JSON; reset clears storage and re-seeds the default state.

### Multi-agent workflow

The codebase was built in agentic phases — modules were drafted in parallel where independent (the seven machine files, the archive data, the room graph), then integrated through the single `store` + `app.js` controller. The QA phase then ran in adversarial mode: a "new investigator" harness plays the game without knowing the solution and verifies all paths are reachable.

---

## 3. The seven machine concepts

What makes each of the seven machines substantially different — different input modality, different output modality, different "rule."

### 1. DEIMOS — Gravity Chamber
A leather-upholstered dial at the center of a steel-walled room. Rotating it changes what the chamber considers "down" — and the reinforced safe on the wall responds. To open the safe the player must rotate the dial to a particular orientation under the chamber's current gravity. **Affects facility: opens a path to other chambers** depending on the orientation.

### 2. ATLAS — Wall-Mounted Map
A one-meter canvas on an articulated arm. Currently blank. The player draws on it with a stylus; the canvas scores closed-shape similarity against a hidden target. When a closed shape is locked, coastlines are revealed, the sundial door unlocks, and the map becomes a navigable artifact. **Affects facility: unlocks the Sundial Atrium.**

### 3. CHRONOSTAT — Telegraph Bay
A Morse key and a brass plate. The plate is dark until you send a letter; then a reply comes back from the future after a constant lag. Round-trips (your letters and their replies) build the chronology — and after six round-trips, the Verboten Engine door unlocks. **Affects facility: unlocks Verboten.**

### 4. VERBOTEN ENGINE — Print, Witness, Forget
A glass cylinder, a copper coil, a small iron slug, and a furnace. Prints words on paper tape that fades in real time after the print head passes. The player must *witness* the words before they fade — and notice that some words are not what they seem. After enough evidence the Director's Office opens. **Affects facility: unlocks the Director's Office.**

### 5. ARCHIVE — Printer Slot
A wall-mounted printer in the Archive of Forgotten Children. Cards of names, dates, and brief bios print from it as you approach. The printer spits its cards in a shuffled order; the player must reconcile the order. The printer will not repeat cards out of order. **Affects facility: contributes to the multi-flag for the Director's Office.**

### 6. ORACLE OF WEIGHTLESS OBJECTS — Brass Scale
Eight tokens, eight owners. A brass scale pan accepts them one at a time; the rule of significance is *not* mass. The rule is asymmetric — and the eight tokens include staff belongings, instruments, safety gear, the Director's journal, and one anomalous cinder from the engine. The Oracle teaches its rule by signaling significance (high/low) rather than mass. **Interacts with player: teaches a rule used elsewhere.**

### 7. COUNTERFEIT SUNDIAL — Armillary Sphere
A brass armillary on a granite plinth, lit by no visible sun. Its shadow points steadily at a mark on the floor. The mark moves; the shadow doesn't. The Sundial is *meant to be broken* in the conventional sense — its shadow follows a misaligned convention. Each backwards tick of its dial reveals one glyph of a seven-character access code; after seven ticks the full code is exposed. **Affects facility: contributes to the Director's multi-flag.**

### How they cohere

The four "facility-affecting" machines (DEIMOS, ATLAS, CHRONOSTAT, VERBOTEN) each open one downstream door or path. The three "interact" machines (ARCHIVE, ORACLE, SUNDIAL) each produce an artifact or a piece of evidence used in the final multi-flag unlock of the Director's Office. Sundial is the deliberately broken one; DEIMOS, VERBOTEN, and ORACLE are the ones that bend language; ARCHIVE and CHRONOSTAT are the "evidence" machines.

---

## 4. Validations

### Three independent QA suites, all green at delivery

| Suite | Result | Purpose |
|-------|--------|---------|
| `qa/run.mjs`          | **74 PASS / 0 FAIL** | Unit tests across all 7 machines, archive search, notebook, state store, bus, util, ending calc. |
| `qa/browser.mjs`      | **29 PASS / 0 FAIL** | "New investigator" playthrough in jsdom: starts from cold state, walks through all 12 phases of a real play session, asserts no console errors and that every machine is reachable. |
| `qa/playthrough.mjs`  | **14 PASS / 0 FAIL** | Full-mystery playthrough validation: navigates facility, draws on Atlas, sends Chronostat round-trips, operates Verboten, ticks Sundial, enters access code. |

### Bugs found and fixed during QA

Adversarial QA exposed a handful of real production bugs:

1. **`buildDial` `root is not defined`** — a UI builder referenced an outer-scope variable from inside a `bus.on('change')` handler. Fixed by parameterizing the helper with `readout`.
2. **Stale-state closure pattern across all six machines** — every UI listener was reading from a `state` parameter captured at *first build*, not from `store.get()`. Every listener was rewritten to call `store.get()` at fire time.
3. **Stale-state closure in `setTimeout(deliverReply)`** — `sendMorse(state, …)` captured the first-build clone, but the round-trip reply was applied to the orphan. Fixed by passing `store` and calling `store.set(s => deliverReply(s, bus))` at fire time.
4. **Atlas QA test was wrong, not the production code** — drawing a stroke starting at the canvas center never closed the shape, so the score check failed in the test. Fixed by starting the stroke on the circumference. (Real players naturally start on the curve.)
5. **DEIMOS unlocked from the start** — the Chronostat door test originally asserted it was locked; corrected the test, not the door.

### Adversarial validation

The "new investigator" harness (`qa/browser.mjs`) plays through the entire UI without any knowledge of the solution and validates that:

- All four views (FACILITY / ARCHIVE / NOTEBOOK / OPTIONS) are reachable.
- All seven machines are reachable through their corresponding rooms.
- No console errors fire during a normal play session.
- Search works in the Archive.
- Notebook entries persist.
- localStorage persistence survives across page reloads.

---

## 5. Unresolved limits

A list of things that are *known* limitations of the current build, not bugs per se:

1. **No images, no audio.** All rendering is text + CSS + a small SVG (the sundial and Atlas canvas). Audio and richer illustration were out of scope.
2. **Single ending with four variants, not branching.** Variants are scored at the moment the player enters the Director's Office based on which signals they've accumulated. No true branching narrative.
3. **No mobile-specific layout.** The CSS works at desktop sizes; phones get a usable but cramped layout.
4. **Atlas drawing is canvas-based; touch input is not specially handled** (mouse events only). A touch-device player can draw with their finger via the synthetic mouse events jsdom produces, but real-world mobile drawing quality is unverified.
5. **Archive search is literal-substring + scored.** It returns results in score order; there's no relevance ranking tuned beyond the basic weights in `archive/search.js`.
6. **No localization.** All copy is English.
7. **No accessibility audit.** The UI uses semantic HTML and aria-friendly button text, but has not been formally audited against WCAG.
8. **The seven-machine facility affects are deterministic.** No randomized outcomes across play sessions; the mystery is the same every time.
9. **`qa/setup.mjs` installs jsdom by spawning `npm install`** into `.qa/node_modules/` — this requires `npm` on the host. The QA harness is jsdom-only; no real-browser QA was performed.
10. **Playwright/Puppeteer would have caught some bugs earlier** — they were not used to keep the dependency surface zero.

---

## 6. How to launch

### Requirements

- Node.js (any modern version).
- A browser.
- No npm install at the project root.
- No internet connection required after the page loads.

### Launch the game

```bash
# from the repo root
node server/serve.mjs
# or
npm start
```

The server prints the port (default `8123`, override with `PORT=…`). Open `http://localhost:<port>/` in any modern browser. The page loads, you see the intro overlay, and the game begins.

### Run the QA suite

```bash
# one-time, downloads jsdom into .qa/node_modules (gitignored)
node qa/setup.mjs

# the three suites
node qa/run.mjs          # unit tests
node qa/browser.mjs      # new-investigator playthrough
node qa/playthrough.mjs  # full-mystery playthrough
```

All three should print `All … checks passed.` at the bottom.

### Reset a session

Inside the game: OPTIONS → RESET INVESTIGATION. This clears `localStorage` and re-seeds the default state.

Or in your browser devtools: `localStorage.removeItem('impossible-machines.v1')`.

### Files of interest

- `index.html` — the page shell.
- `src/app.js` — the controller (start here when reading the code).
- `src/state/store.js` — the state store.
- `src/facility/rooms.js` — the room graph.
- `src/machines/*.js` — the seven machines.
- `src/ui/machines.js` — the per-machine DOM builders.
- `src/ui/styles.css` — the art direction.
- `qa/run.mjs`, `qa/browser.mjs`, `qa/playthrough.mjs` — the three QA harnesses.

---

*The mystery's solution is not described in this report. The player discovers it.*
