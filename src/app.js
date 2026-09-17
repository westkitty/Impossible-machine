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
  // Read-only integration handle for presentation systems such as Three.js.
  // Canonical mutations still flow through the store and machine commands.
  window.__impossibleStore = store;

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
          store.bus.emit('notebook:auto', {
            title: `MAP — can't reach ${r.name}`,
            body: explainLock(ok)
          });
          return;
        }
        store.set(s => { s.player.roomId = id; }, { silent: true });
        showRoom(store);
      }
    }, [document.createTextNode(visited || here ? r.name.toUpperCase() : '· · · · · · · ·')]);
    list.appendChild(row);
  }
  return list;
}

function buildDiscoveries(state) {
  const list = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--ink-dim)', letterSpacing: '0.08em' } });
  const items = [
    ['GRAVITY FLIPPED',       state.discoveries.gravity_flip],
    ['SAFE OPENED',           state.discoveries.safe_opened],
    ['CHRONOSTAT — SENT',     state.discoveries.chronostat_sent],
    ['CHRONOSTAT — DRIFT',    state.discoveries.chronostat_drift],
    ['ATLAS — DRAWN',         state.discoveries.atlas_drawn],
    ['ATLAS — LOCKED',        state.discoveries.atlas_lock],
    ['ATLAS — ERASE SEEN',    state.discoveries.atlas_erase],
    ['ARCHIVE — POLAROID',    state.discoveries.archive_polaroid],
    ['ARCHIVE — SOLVED',      state.discoveries.archive_solved],
    ['ORACLE — PLACED',       state.discoveries.oracle_place],
    ['ORACLE — INVERSE',      state.discoveries.oracle_inverse],
    ['ORACLE — RULE',         state.discoveries.oracle_significance],
    ['VERBOTEN — FURNACE',    state.discoveries.verboten_furnace],
    ['VERBOTEN — CAPTURE',    state.discoveries.verboten_capture],
    ['VERBOTEN — SECRET',     state.discoveries.verboten_secret],
    ['SUNDIAL — SHADOW',      state.discoveries.sundial_shadow],
    ['SUNDIAL — CODE',        state.discoveries.sundial_code]
  ];
  for (const [label, on] of items) {
    list.appendChild(el('div', {
      text: (on ? '◉ ' : '◯ ') + label,
      style: { color: on ? 'var(--accent)' : 'var(--ink-dim)' }
    }));
  }
  return list;
}

function buildNotebookMini(store) {
  const wrap = el('div', { class: 'notebook-list' });
  const entries = notebookView(store.get()).slice(0, 6);
  if (entries.length === 0) {
    wrap.appendChild(el('div', { class: 'readout', text: 'Empty notebook.' }));
    return wrap;
  }
  for (const e of entries) {
    wrap.appendChild(el('div', { class: 'notebook-entry kind-' + e.kind }, [
      el('div', { class: 'head' }, [
        el('span', { text: e.kind }),
        el('span', { text: new Date(e.ts).toLocaleTimeString() })
      ]),
      el('div', { class: 'title', text: e.title }),
      el('div', { class: 'body', text: e.body })
    ]));
  }
  return wrap;
}

function showArchive(store) {
  setActive('ARCHIVE');
  const main = qs('#main');
  clear(main);
  window.__archiveViewActive = true;
  const state = store.get();
  const list = el('div', { class: 'archive-list' });
  const reader = el('div', { class: 'archive-reader' });

  const search = el('input', { type: 'text', placeholder: 'Search documents…' });
  search.addEventListener('input', () => {
    refreshList();
  });

  const refreshList = () => {
    clear(list);
    list.appendChild(el('div', { class: 'search' }, [search]));
    const docs = allDocumentsForState(state);
    let filtered = docs;
    const q = search.value.trim();
    if (q) {
      const ranked = searchDocuments(state, q);
      filtered = ranked;
    }
    if (filtered.length === 0) {
      list.appendChild(el('div', { class: 'doc-row', text: '(no documents found)' }));
      return;
    }
    for (const d of filtered) {
      const row = el('div', {
        class: 'doc-row',
        onClick: () => {
          qsa('.doc-row', list).forEach(r => r.classList.remove('active'));
          row.classList.add('active');
          renderReader(reader, d, store);
        }
      }, [
        el('div', { text: d.title }),
        el('div', { class: 'doc-kind', text: (d.kind || 'doc') + ' · ' + (d.room || '').toUpperCase() })
      ]);
      list.appendChild(row);
    }
  };
  refreshList();

  if (allDocumentsForState(state).length > 0) {
    renderReader(reader, allDocumentsForState(state)[0], store);
    // mark first active
    setTimeout(() => {
      const first = list.querySelector('.doc-row');
      if (first) first.classList.add('active');
    }, 0);
  } else {
    reader.appendChild(el('div', { text: 'No documents available.' }));
  }

  const wrap = el('div', { class: 'archive-grid' }, [list, reader]);
  main.appendChild(wrap);

  store.bus.on('change', () => refreshList(), { once: false });
}

function refreshArchiveView(store) {
  if (!window.__archiveViewActive) return;
  const main = qs('#main');
  if (!main) return;
  // simple: re-render the archive view
  showArchive(store);
}

function renderReader(reader, doc, store) {
  clear(reader);
  if (!doc) return;
  // mark read
  store?.set(s => { s.archive_seen[doc.id] = true; }, { silent: true });
  reader.appendChild(el('h1', { text: doc.title }));
  reader.appendChild(el('div', { text: `${(doc.kind||'').toUpperCase()} · ${(doc.room||'').toUpperCase()}`, class: 'machine-meta' }));
  const tags = el('div', { class: 'doc-tags' });
  for (const t of (doc.tags || [])) tags.appendChild(el('span', { class: 'tag', text: t }));
  reader.appendChild(tags);
  for (const para of doc.body.split('\n')) {
    reader.appendChild(el('p', { text: para }));
  }
}

function showNotebook(store) {
  setActive('NOTEBOOK');
  const main = qs('#main');
  clear(main);
  window.__archiveViewActive = false;
  const state = store.get();

  const left = el('aside', { class: 'panel' }, [
    el('div', { class: 'machine-meta', text: 'NOTEBOOK' }),
    el('p', { text: 'Your observations and inferences. Auto-entries are recorded automatically; you can add observations (what you saw) and inferences (what you think it means) by hand.' })
  ]);

  const stage = el('section', { class: 'stage', style: { padding: '24px', overflow: 'auto' } });
  const list = el('div', { class: 'notebook-list' });
  const entries = notebookView(state);
  if (entries.length === 0) {
    list.appendChild(el('div', { class: 'readout', text: 'Notebook is empty.' }));
  } else {
    for (const e of entries) {
      list.appendChild(el('div', { class: 'notebook-entry kind-' + e.kind }, [
        el('div', { class: 'head' }, [
          el('span', { text: e.kind.toUpperCase() }),
          el('span', { text: new Date(e.ts).toLocaleString() })
        ]),
        el('div', { class: 'title', text: e.title }),
        el('div', { class: 'body', text: e.body })
      ]));
    }
  }

  const form = el('div', { class: 'notebook-form' }, [
    el('label', { text: 'NEW ENTRY' }),
    el('select', { id: 'nb-kind' }, [
      el('option', { value: 'observation', text: 'Observation (what you saw)' }),
      el('option', { value: 'inference',   text: 'Inference (what you think it means)' })
    ]),
    el('input', { id: 'nb-title', type: 'text', placeholder: 'Title' }),
    el('textarea', { id: 'nb-body', placeholder: 'Note…', rows: 4 }),
    el('button', { text: 'RECORD', onClick: () => {
      const kind = qs('#nb-kind').value;
      const title = qs('#nb-title').value || '(untitled)';
      const body = qs('#nb-body').value || '';
      store.set(s => addEntry(s, kind, title, body));
      qs('#nb-title').value = '';
      qs('#nb-body').value = '';
      showNotebook(store);
    } })
  ]);

  stage.appendChild(list);
  stage.appendChild(form);

  const wrap = el('div', { class: 'room' }, [left, stage, el('aside', { class: 'panel right' }, [
    el('div', { class: 'machine-meta', text: 'SUMMARY' }),
    el('div', { style: { fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink-soft)' } }, [
      el('div', { text: `Auto: ${entries.filter(e => e.kind === 'auto').length}` }),
      el('div', { text: `Observation: ${entries.filter(e => e.kind === 'observation').length}` }),
      el('div', { text: `Inference: ${entries.filter(e => e.kind === 'inference').length}` }),
      el('div', { text: `Total entries: ${entries.length}` })
    ])
  ])]);
  main.appendChild(wrap);
}

function showOptions(store) {
  setActive('OPTIONS');
  const main = qs('#main');
  clear(main);
  window.__archiveViewActive = false;
  const stage = el('section', { class: 'stage', style: { padding: '32px', overflow: 'auto' } });
  stage.appendChild(el('h1', { text: 'OPTIONS', class: 'room-title' }));
  stage.appendChild(el('p', { text: 'Persistent state lives in your browser. Export it for backup, or reset to begin a new investigation.' }));

  const expBtn = el('button', { text: 'EXPORT STATE (JSON)', onClick: () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'impossible-machines-' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } });
  const impBtn = el('button', { text: 'IMPORT STATE', onClick: () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const text = await file.text();
      if (store.importJson(text)) {
        showRoom(store);
      }
    };
    input.click();
  } });
  const resetBtn = el('button', { text: 'NEW INVESTIGATION (RESET)', class: 'danger', onClick: () => {
    if (confirm('Begin a new investigation? This will erase current progress.')) {
      store.reset();
      showIntro(store);
    }
  } });

  stage.appendChild(el('div', { style: { display: 'flex', gap: '8px' } }, [expBtn, impBtn, resetBtn]));
  main.appendChild(el('div', { class: 'room' }, [
    el('aside', { class: 'panel' }, [el('div', { class: 'machine-meta', text: 'FILE' })]),
    stage,
    el('aside', { class: 'panel right' })
  ]));
}

function setActive(label) {
  const nav = document.querySelector('.title-bar nav');
  if (!nav) return;
  for (const b of nav.children) {
    b.classList.toggle('active', b.textContent === label);
  }
}

function arrow(dir) {
  return { n: '↑', s: '↓', e: '→', w: '←', ne: '↗', nw: '↖', se: '↘', sw: '↙' }[dir] || '·';
}

function explainLock(ok) {
  if (!ok) return 'You cannot proceed.';
  if (ok.reason === 'locked') return 'The door is locked.';
  if (ok.reason === 'requires-machine-flag') {
    return `Requires: ${ok.need.machine} to be ${ok.need.flag}.`;
  }
  if (ok.reason === 'requires-multi') {
    return 'Multiple gates required: ' + Object.entries(ok.need).map(([k,v]) => `${k}=${v ? 'ok' : '?'}`).join(', ');
  }
  return 'Locked.';
}

function showIntro(store) {
  const overlay = el('div', { class: 'intro' });
  overlay.appendChild(el('div', { class: 'panel' }, [
    el('div', { class: 'pre', text: 'CASE FILE K-12 · UNREDACTED' }),
    el('div', { class: 'stamp', text: 'SEALED — 1983 · REOPENED — TODAY' }),
    el('h1', { text: 'THE DEPARTMENT OF IMPOSSIBLE MACHINES' }),
    el('p', { text: 'You have inherited an underground government laboratory containing seven impossible machines. Nobody knows what all of them do. The previous staff disappeared.' }),
    el('p', { text: 'Investigate the facility. Experiment with machines. Find internal documentation. Discover the relationships between systems. Determine what happened.' }),
    el('div', { class: 'actions' }, [
      el('button', { text: 'BEGIN INVESTIGATION', class: 'primary', onClick: () => {
        document.body.removeChild(overlay);
      } })
    ])
  ]));
  document.body.appendChild(overlay);
}

function renderEndingOverlay(store) {
  const state = store.get();
  if (!state.meta.ending) {
    const ex = document.querySelector('.ending');
    if (ex) ex.remove();
    return;
  }
  if (document.querySelector('.ending')) return;
  const overlay = el('div', { class: 'ending' });
  let body;
  if (state.meta.ending === 'full') {
    body = el('div', { class: 'panel' }, [
      el('h1', { text: 'ENDING I — FULL RESTORATION' }),
      el('p', { text: 'The lab hums. The seven machines settle into a low chorus. The polaroids on the corkboard click softly, in sequence. Harker. Pell. Doss. Mora. Vance. Yuen. The Director\'s office is empty. On the floor, a single fresh polaroid, dated today, with your name: I. YUEN — RETURNED.' }),
      el('p', { text: 'You step out into the corridor. The doors do not close behind you.' }),
      el('div', { style: { marginTop: '24px', display: 'flex', gap: '8px' } }, [
        el('button', { text: 'CONTINUE INVESTIGATING', onClick: () => document.body.removeChild(overlay) }),
        el('button', { text: 'NEW INVESTIGATION', class: 'danger', onClick: () => {
          document.body.removeChild(overlay);
          store.reset();
          showIntro(store);
        } })
      ])
    ]);
  } else if (state.meta.ending === 'partial') {
    body = el('div', { class: 'panel' }, [
      el('h1', { text: 'ENDING II — PARTIAL RESTORATION' }),
      el('p', { text: 'Power fails. The lights die in sequence. The CHRONOSTAT plate emits a final phrase you cannot decode. You are locked in.' }),
      el('div', { style: { marginTop: '24px', display: 'flex', gap: '8px' } }, [
        el('button', { text: 'CONTINUE INVESTIGATING', onClick: () => document.body.removeChild(overlay) }),
        el('button', { text: 'NEW INVESTIGATION', class: 'danger', onClick: () => {
          document.body.removeChild(overlay);
          store.reset();
          showIntro(store);
        } })
      ])
    ]);
  } else if (state.meta.ending === 'refused') {
    body = el('div', { class: 'panel' }, [
      el('h1', { text: 'ENDING III — REFUSED' }),
      el('p', { text: 'You leave the facility without engaging. The doors reseal themselves. The machines keep humming, but for whom, now?' }),
      el('div', { style: { marginTop: '24px', display: 'flex', gap: '8px' } }, [
        el('button', { text: 'CONTINUE INVESTIGATING', onClick: () => document.body.removeChild(overlay) }),
        el('button', { text: 'NEW INVESTIGATION', class: 'danger', onClick: () => {
          document.body.removeChild(overlay);
          store.reset();
          showIntro(store);
        } })
      ])
    ]);
  }
  overlay.appendChild(body);
  document.body.appendChild(overlay);
}

document.addEventListener('DOMContentLoaded', init);