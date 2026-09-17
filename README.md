# THE DEPARTMENT OF IMPOSSIBLE MACHINES

An interactive browser mystery. You inherit the keys to a sealed government research wing abandoned some forty years ago, after a single night no one will discuss. Inside: seven impossible machines, four locked doors, an archive that mostly remembers, and an experiment notebook that decides for itself what you observed.

There is one solution. It is not the obvious one. The notebook will not tell you which inference is right.

## How to launch

There are no dependencies, no build step, and no package install. You only need Node.js (any modern version).

```bash
# from the repo root
node server/serve.mjs
# or, equivalently
npm start
```

Then open `http://localhost:8123/` (or whatever port the server prints) in any modern browser. No internet connection is required after the page loads; the entire game is client-side.

For QA:

```bash
node qa/setup.mjs   # one-time: installs jsdom into .qa/node_modules
node qa/run.mjs     # unit tests
node qa/browser.mjs # "new investigator" playthrough
node qa/playthrough.mjs # full-mystery playthrough validation
```

## How to play

- The four buttons in the title bar — **FACILITY / ARCHIVE / NOTEBOOK / OPTIONS** — are the four views.
- FACILITY: walk through doors, manipulate machines.
- ARCHIVE: search documents, staff records, experiment logs, diagrams.
- NOTEBOOK: add manual entries (observations vs inferences); automatic entries are appended when you do things.
- OPTIONS: export / import / reset a save.

State is auto-saved to `localStorage`. The game is designed to be played across many short sessions.

## The seven machines

1. **DEIMOS — Gravity Chamber** — a leather-upholstered dial in a riveted steel room. Rotating it tilts the chamber's "down." A safe responds accordingly. (Affects facility.)
2. **ATLAS — Wall-Mounted Map** — a one-meter canvas on an articulated arm. Draws of the right shape reveal coastlines and unlock a sealed side door. (Affects facility.)
3. **CHRONOSTAT — Telegraph Bay** — a Morse key, a brass plate. Send a letter to the future; the reply arrives with a constant lag. (Affects facility.)
4. **VERBOTEN ENGINE — Print, Witness, Forget** — a glass cylinder, a copper coil, a small iron slug, a furnace. Prints words onto tape that fade in real time. (Interacts with facility: unlocks the Director's Office.)
5. **ARCHIVE OF FORGOTTEN CHILDREN — Printer Slot** — a wall printer that spits polaroids, name cards, and bios of children who passed through the program. Reconcile the order. (Affects facility.)
6. **ORACLE OF WEIGHTLESS OBJECTS — Brass Scale** — eight tokens, eight owners, one mass balance. The rule of significance is asymmetric: it's not what the tokens weigh that matters, but how they relate to the people they belonged to. (Interacts with player.)
7. **COUNTERFEIT SUNDIAL — Armillary Sphere** — a brass armillary on a granite plinth, lit by no visible sun. The shadow is wrong, but it carries a code anyway. The machine is *meant* to be "broken" in the conventional sense; it obeys a misunderstood rule the player has to discover.

## Architecture

```
src/
  core/         # bus, DOM helpers, mulberry32, Vigenère, ending calc
  state/        # store + defaultState + localStorage rehydrate + import/export
  facility/     # rooms + door graph + canTraverse() (gating logic)
  archive/      # DOCS, STAFF, search index
  notebook/     # addEntry() (observation / inference / auto)
  machines/     # one file per machine (deimos, atlas, chronostat,
                #   verboten, archive, oracle, sundial) — pure functions
                #   over state, no UI
  ui/           # per-machine DOM builders, single CSS file
  app.js        # controller: routes, view orchestration, renderers
qa/
  setup.mjs     # installs jsdom into .qa/node_modules (not committed)
  run.mjs       # unit tests (74 assertions)
  browser.mjs   # "new investigator" playthrough (29 assertions)
  playthrough.mjs # full-mystery playthrough validation (14 assertions)
server/
  serve.mjs     # zero-dep static file server
```

Strict rules followed: no framework, no build step, no client-side dependency. Plain ES modules. One CSS file. State changes flow through a single in-memory store that emits `change` events; nothing mutates state outside the store.

## Validation

Three independent QA suites, all green at delivery:

| Suite                    | Result          |
|--------------------------|-----------------|
| `qa/run.mjs` (units)     | 74 PASS / 0 FAIL|
| `qa/browser.mjs` (new investigator) | 29 PASS / 0 FAIL |
| `qa/playthrough.mjs` (full mystery)  | 14 PASS / 0 FAIL |

The "new investigator" harness plays through the UI without any knowledge of the solution, simulating clicks and asserting the facility is navigable, every machine is reachable, and no console errors fire.

## License

Private project. All rights reserved.
