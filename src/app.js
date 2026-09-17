// src/app.js
// The main application controller. Builds the layout, wires navigation,
// instantiates machines, archive, notebook, intro, ending.

import './three/machine-scenes.js';
import { el, clear, qs, qsa } from './core/dom.js';
import { createStore, defaultState } from './state/store.js';
import { ROOMS, canTraverse } from './facility/rooms.js';
import { addEntry, notebookView } from './notebook/notebook.js';
import { allDocumentsForState, documentById, searchDocuments } from './archive/search.js';
import { DOCUMENTS } from './archive/documents.js';
import { computeEnding, commitEnding } from './core/ending.js';
import { initialInventory } from './machines/oracle.js';
import {
  buildDeimosUI, buildChronostatUI, buildAtlasUI,
  buildArchiveUI, buildOracleUI, buildVerbotenUI, buildSundialUI
} from './ui/machines.js';

function init() {
  const store = createStore(defaultState());

  // Seed oracle inventory
  store.set(s => {
    s.machines.oracle.inventory = initialInventory();
  }, { silent: true, noPersist: true });

  // Wire auto-notebook: any bus 'notebook:auto' becomes an entry.
  // We defer the inner set() via queueMicrotask so it runs after the
  // outer mutator has finished committing its clone (preventing clobber).
  store.bus.on('notebook:auto', (e) => {
    queueMicrotask(() => {
      store.set(s => addEntry(s, 'auto', e.title || 'Note', e.body || '', e.refs || []), { silent: true });
    });
  });
  store.bus.on('discovery', (e) => {
    // optional — could chain additional effects here
  });

  // Try to load prior session.
  const hadPrior = store.load();
  if (!hadPrior) {
    // First run. Make sure oracle inventory is seeded.
    store.set(s => { s.machines.oracle.inventory = initialInventory(); });
  }

  // Build shell
  buildShell(store);

  // Listen for ending transitions
  store.bus.on('change', () => {
    const ending = computeEnding(store.get());
    if (ending) commitEnding(store.get(), ending, store.bus);
    renderEndingOverlay(store);
  });

  // Initial ending overlay check
  renderEndingOverlay(store);

  // Listen for full-document unlock checks (so the archive view refreshes)
  store.bus.on('change', () => {
    if (window.__archiveViewActive) refreshArchiveView(store);
  });
}

function buildShell(store) {
  const app = qs('#app');
  clear(app);

  // Title bar
  const titleBar = el('div', { class: 'title-bar' }, [
    el('div', { class: 'wordmark' }, [
      document.createTextNode('THE DEPARTMENT OF IMPOSSIBLE MACHINES'),
      el('small', { text: 'FACILITY 7-B · FILE K-12 · UNDERGRADE' })
    ]),
    el('nav', {}, [
      el('button', { text: 'FACILITY', class: 'active', onClick: () => showRoom(store) }),
      el('button', { text: 'ARCHIVE',  onClick: () => showArchive(store) }),
      el('button', { text: 'NOTEBOOK', onClick: () => showNotebook(store) }),
      el('button', { text: 'OPTIONS', onClick: () => showOptions(store) })
    ])
  ]);

  const main = el('div', { class: 'main', id: 'main' });
  const statusBar = el('div', { class: 'status-bar' }, [
    el('div', { class: 'stats', id: 'status-stats' }, [
      el('span', { text: `ROOM ${store.get().player.roomId.toUpperCase()}` }),
      el('span', { text: `SEED 0x${store.get().meta.rngSeed.toString(16).toUpperCase()}` })
    ]),
    el('div', {}, [
      el('span', { text: 'STATE ', style: { color: 'var(--ink-dim)' } }),
      el('span', { id: 'autosave', text: 'AUTOSAVED', style: { color: 'var(--accent)' } })
    ])
  ]);

  app.appendChild(titleBar);
  app.appendChild(main);
  app.appendChild(statusBar);

  showRoom(store);

  // intro
  if (!store.hydrated()) {
    showIntro(store);
  }
}

function showRoom(store) {
  setActive('FACILITY');
  const main = qs('#main');
  clear(main);
  const state = store.get();

  const room = ROOMS[state.player.roomId];
  if (!room) {
    store.set(s => { s.player.roomId = 'foyer'; });
    return showRoom(store);
  }

  // Mark visited
  store.set(s => { s.rooms[s.player.roomId].visited = true; }, { silent: true });

  const left = el('aside', { class: 'panel' }, [
    el('div', { class: 'machine-meta', text: 'FACILITY MAP' }),
    buildMap(store),
    el('div', { class: 'rule' }),
    el('div', { class: 'machine-meta', text: 'DISCOVERIES' }),
    buildDiscoveries(state)
  ]);

  const stage = el('section', { class: 'stage' });
  const ambient = el('div', { class: 'ambient', text: room.ambience || '' });
  const title = el('h1', { class: 'room-title', text: room.name });
  const subtitle = el('div', { class: 'room-subtitle', text: room.subtitle || '' });
  const desc = el('div', { class: 'room-desc', text: room.description || '' });

  const doors = el('div', { class: 'doors' });
  for (const d of room.doors || []) {
    const ok = canTraverse(state.player.roomId, d.id, state);
    const pill = el('div', {
      class: 'door-pill ' + (ok.ok ? '' : 'locked'),
      onClick: () => {
        if (!ok.ok) {
          store.bus.emit('notebook:auto', {
            title: `DOOR — ${d.label} locked`,
            body: explainLock(ok)
          });
          return;
        }
        store.set(s => { s.player.roomId = d.id; }, { silent: true });
        showRoom(store);
      }
    }, [
      el('span', { class: 'dir', text: arrow(d.dir) }),
      document.createTextNode(d.label)
    ]);
    doors.appendChild(pill);
  }

  const machineFrame = el('div', { class: 'machine-frame' });

  stage.appendChild(ambient);
  stage.appendChild(title);
  stage.appendChild(subtitle);
  stage.appendChild(desc);
  stage.appendChild(doors);
  stage.appendChild(machineFrame);

  // Insert machine UI(s) for this room
  for (const m of room.machines || []) {
    machineFrame.appendChild(buildMachineUI(m, store));
  }
  if ((room.machines || []).length === 0) {
    machineFrame.appendChild(el('div', { class: 'readout', text: 'No machine in this room.' }));
  }

  const right = el('aside', { class: 'panel right' }, [
    el('div', { class: 'machine-meta', text: 'NOTEBOOK — RECENT' }),
    buildNotebookMini(store)
  ]);

  const wrap = el('div', { class: 'room' }, [left, stage, right]);
  main.appendChild(wrap);
}

function buildMachineUI(machineId, store) {
  switch (machineId) {
    case 'deimos': return buildDeimosUI(store.get(), store);
    case 'chronostat': return buildChronostatUI(store.get(), store);
    case 'atlas': return buildAtlasUI(store.get(), store);
    case 'archive': return buildArchiveUI(store.get(), store);
    case 'oracle': return buildOracleUI(store.get(), store);
    case 'verboten': return buildVerbotenUI(store.get(), store);
    case 'sundial': return buildSundialUI(store.get(), store);
    default: return el('div', { class: 'readout', text: `Unknown machine: ${machineId}` });
  }
}

function buildMap(store) {
  const state = store.get();
  const list = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } });
  const order = ['foyer','corridor_n','corridor_s','deimos','chronostat','atlas','archive','oracle','verboten','sundial','director'];
  for (const id of order) {
    const r = ROOMS[id];
    if (!r) continue;
    const here = state.player.roomId === id;
    const visited = state.rooms[id]?.visited;
    const unlocked = state.rooms[id]?.unlocked;
    const row = el('div', {
      style: {
        fontFamily: 'var(--mono)',
        fontSize: '12px',
        padding: '6px 8px',
        cursor: unlocked ? 'pointer' : 'default',
        color: here ? 'var(--accent)' : (visited ? 'var(--ink)' : 'var(--ink-dim)'),
        borderLeft: here ? '3px solid var(--accent)' : '3px solid transparent',
        background: here ? 'var(--bg-room)' : 'transparent'
      },
      onClick: () => {
        if (!unlocked || here) return;
        const ok = canTraverse(state.player.roomId, id, state);
        if (!ok.ok) {
          store.bus.emit('notebook:auto', { title: `MAP — ${r.name} inaccessible`, body: explainLock(ok) });
          return;
        }
        store.set(s => { s.player.roomId = id; }, { silent: true });
        showRoom(store);
      }
    }, [
      document.createTextNode(`${here ? '▸' : visited ? '·' : '×'} ${r.name}`)
    ]);
    list.appendChild(row);
  }
  return list;
}

function buildDiscoveries(state) {
  const entries = Object.entries(state.discoveries || {}).filter(([, v]) => v);
  if (!entries.length) return el('div', { class: 'machine-meta', text: 'None logged.' });
  return el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
    entries.map(([k]) => el('div', { class: 'machine-meta', text: `• ${k.replaceAll('_', ' ')}` }))
  );
}

function buildNotebookMini(store) {
  const state = store.get();
  const entries = (state.notebook?.entries || []).slice(-5).reverse();
  if (!entries.length) return el('div', { class: 'machine-meta', text: 'Notebook empty.' });
  return el('div', {}, entries.map(entry =>
    el('div', { style: { marginBottom: '10px' } }, [
      el('div', { class: 'machine-meta', text: entry.title || 'UNTITLED' }),
      el('div', { text: entry.body || '', style: { fontSize: '12px', color: 'var(--ink-soft)' } })
    ])
  ));
}

function explainLock(ok) {
  if (!ok) return 'Access denied.';
  if (ok.reason) return ok.reason;
  if (ok.missing) return `Missing requirement: ${ok.missing}`;
  return 'Access denied by facility state.';
}

function arrow(dir) {
  return ({ n: '↑', s: '↓', e: '→', w: '←', u: '↟', d: '↡' })[dir] || '·';
}

function setActive(label) {
  for (const button of qsa('.title-bar nav button')) {
    button.classList.toggle('active', button.textContent === label);
  }
}

function showArchive(store) {
  setActive('ARCHIVE');
  const main = qs('#main');
  clear(main);
  window.__archiveViewActive = true;

  const state = store.get();
  const shell = el('div', { class: 'archive-shell' });
  const search = el('input', { placeholder: 'Search archive…', value: '' });
  const results = el('div');

  const render = () => {
    clear(results);
    const query = search.value.trim();
    const docs = query ? searchDocuments(store.get(), query) : allDocumentsForState(store.get());
    for (const doc of docs) {
      results.appendChild(el('button', {
        class: 'archive-row',
        text: `${doc.id} · ${doc.title}`,
        onClick: () => showDocument(store, doc.id)
      }));
    }
    if (!docs.length) results.appendChild(el('div', { class: 'machine-meta', text: 'No matching records.' }));
  };

  search.addEventListener('input', render);
  shell.append(
    el('h1', { text: 'ARCHIVE' }),
    el('div', { class: 'machine-meta', text: `${DOCUMENTS.length} catalogued records · visibility depends on state` }),
    search,
    results
  );
  main.appendChild(shell);
  render();
}

function refreshArchiveView(store) {
  if (!window.__archiveViewActive) return;
  showArchive(store);
}

function showDocument(store, id) {
  const doc = documentById(store.get(), id);
  if (!doc) return;
  const main = qs('#main');
  clear(main);
  const body = el('article', { class: 'document-view' }, [
    el('button', { text: '← ARCHIVE', onClick: () => showArchive(store) }),
    el('div', { class: 'machine-meta', text: doc.id }),
    el('h1', { text: doc.title }),
    el('pre', { text: doc.body || '' })
  ]);
  main.appendChild(body);
}

function showNotebook(store) {
  setActive('NOTEBOOK');
  window.__archiveViewActive = false;
  const main = qs('#main');
  clear(main);
  main.appendChild(notebookView(store.get(), store));
}

function showOptions(store) {
  setActive('OPTIONS');
  window.__archiveViewActive = false;
  const main = qs('#main');
  clear(main);
  main.appendChild(el('div', { class: 'options-shell' }, [
    el('h1', { text: 'OPTIONS' }),
    el('p', { text: 'Facility state is stored locally in this browser.' }),
    el('button', {
      class: 'danger',
      text: 'RESET FACILITY STATE',
      onClick: () => {
        localStorage.clear();
        location.reload();
      }
    })
  ]));
}

function renderEndingOverlay(store) {
  const existing = qs('#ending-overlay');
  const ending = store.get().ending;
  if (!ending) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const overlay = el('div', { id: 'ending-overlay', class: 'ending-overlay' }, [
    el('div', { class: 'ending-card' }, [
      el('div', { class: 'machine-meta', text: 'FACILITY TERMINAL CONDITION' }),
      el('h1', { text: ending.title || ending.id || 'ENDING' }),
      el('p', { text: ending.body || 'The department records your decision.' }),
      el('button', { text: 'RETURN TO FACILITY', onClick: () => document.getElementById('ending-overlay')?.remove() })
    ])
  ]);
  document.body.appendChild(overlay);
}

function showIntro(store) {
  const overlay = el('div', { class: 'intro-overlay' }, [
    el('div', { class: 'intro-card' }, [
      el('div', { class: 'machine-meta', text: 'DEPARTMENT OF IMPOSSIBLE MACHINES' }),
      el('h1', { text: 'FACILITY 7-B' }),
      el('p', { text: 'The building has been abandoned. The machines have not.' }),
      el('button', {
        class: 'primary',
        text: 'ENTER',
        onClick: () => {
          store.set(s => { s.meta.hydrated = true; });
          overlay.remove();
        }
      })
    ])
  ]);
  document.body.appendChild(overlay);
}

init();
