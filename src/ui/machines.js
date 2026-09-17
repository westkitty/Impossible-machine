// src/ui/machines.js
// Machine-specific UI builders. Each returns a DOM element.

import { el, clear } from '../core/dom.js';
import { sendMorse, chronostatView } from '../machines/chronostat.js';
import { deimosView, setOrientation } from '../machines/deimos.js';
import { atlasView, beginStroke, pushPoint, lockStroke, cullExpired } from '../machines/atlas.js';
import { archiveView, printPolaroid, setOrder } from '../machines/archive.js';
import { oracleView, place, remove, readingOf } from '../machines/oracle.js';
import { verbotenView, actuate, witness } from '../machines/verboten.js';
import { sundialView, tick, enterAccessCode } from '../machines/sundial.js';

// ───────────────────────── DEIMOS ─────────────────────────

export function buildDeimosUI(state, store) {
  const view = deimosView(state);
  const readout = el('div', { class: 'readout' }, [
    el('div', { text: `Orientation: ${view.orientationLabel} (idx ${view.orientationIndex})` }),
    el('div', { text: `Safe: ${view.safeOpen ? 'OPEN' : 'SEALED'}` })
  ]);
  const root = el('div', { class: 'machine machine-deimos' }, [
    el('h2', { text: 'DEIMOS' }),
    el('div', { class: 'machine-meta', text: 'ORIENTATION CHAMBER · GRAVITY VECTOR 0..7' }),
    el('div', { class: 'rule' }),
    el('p', { text: 'Rotate the dial. Eight discrete orientations. The chamber obeys.' }),

    buildDial(state, store, readout),

    el('div', { class: 'rule' }),
    readout
  ]);

  return root;
}

function buildDial(state, store, readout) {
  const dial = el('div', { class: 'deimos-dial' });
  const knob = el('div', { class: 'knob' });
  dial.appendChild(knob);
  // 8 labels at 45deg increments
  const labels = ['N','NE','E','SE','S','SW','W','NW'];
  for (let i = 0; i < 8; i++) {
    const ang = (i * 45 - 90) * Math.PI / 180;
    const x = 100 + Math.cos(ang) * 78;
    const y = 100 + Math.sin(ang) * 78;
    dial.appendChild(el('div', {
      class: 'label',
      style: { left: `${x}px`, top: `${y}px` },
      text: labels[i]
    }));
  }
  const safe = el('div', { class: 'safe ' + (state.machines.deimos.safeOpen ? 'open' : '') }, [
    el('span', { text: state.machines.deimos.safeOpen ? 'SAFE\nOPEN' : 'SAFE\nSEALED' })
  ]);
  dial.appendChild(safe);

  const updateKnob = () => {
    const deg = (state.machines.deimos.orientation * 45);
    knob.style.transform = `translate(-50%, -50%) rotate(${deg}deg) translateY(-86px) rotate(${-deg}deg)`;
  };
  updateKnob();

  // Click cycles through orientations
  dial.addEventListener('click', () => {
    store.set(s => {
      setOrientation(s, (s.machines.deimos.orientation + 1) % 8, store.bus);
    });
  });

  store.bus.on('change', () => {
    const s = store.get();
    updateKnob();
    safe.className = 'safe ' + (s.machines.deimos.safeOpen ? 'open' : '');
    const view = deimosView(s);
    if (readout) {
      readout.children[0].textContent = `Orientation: ${view.orientationLabel} (idx ${view.orientationIndex})`;
      readout.children[1].textContent = `Safe: ${view.safeOpen ? 'OPEN' : 'SEALED'}`;
    }
  });
  return dial;
}

// ───────────────────────── CHRONOSTAT ─────────────────────────

export function buildChronostatUI(state, store) {
  const view = chronostatView(state);
  const plate = el('div', { class: 'chronostat-plate ' + (view.inbox.length === 0 ? 'dark' : ''),
    text: view.inbox.length ? view.inbox[view.inbox.length - 1].fromFuture : 'Plate dark. Send a letter.' });

  let keyBuffer = '';
  let keyTimer = null;

  const key = el('div', { class: 'morse-key' }, [
    el('div', { class: 'dot' })
  ]);

  const onDown = (e) => {
    e.preventDefault();
    key.classList.add('pressed');
    key._startTime = Date.now();
    key._timer = setTimeout(() => {
      key._long = true;
    }, 240);
  };
  const onUp = (e) => {
    e.preventDefault();
    key.classList.remove('pressed');
    clearTimeout(key._timer);
    if (!key._startTime) return;
    const dt = Date.now() - key._startTime;
    keyBuffer += dt > 240 ? '-' : '.';
    key._startTime = null;
    key._long = false;
    clearTimeout(keyTimer);
    keyTimer = setTimeout(() => {
      commitBuffer();
    }, 800);
  };

  const commitBuffer = () => {
    const buf = keyBuffer.trim();
    keyBuffer = '';
    if (!buf) return;
    // Allow up to 4 dots/dashes; we map known Morse codes only.
    const known = {
      '.': 'E', '-': 'T',
      '..': 'I', '.-': 'A', '-.': 'N', '--': 'M',
      '...': 'S', '..-': 'U', '.-.': 'R', '.--': 'W', '-..': 'D', '-.-': 'K', '--.': 'G', '---': 'O',
      '....': 'H', '...-': 'V', '..-.': 'F', '.-..': 'L', '.--.': 'P', '.---': 'J',
      '-...': 'B', '-..-': 'X', '-.-.': 'C', '-.--': 'Y', '--..': 'Z', '--.-': 'Q'
    };
    const letter = known[buf];
    if (letter) {
      store.set(s => sendMorse(s, letter, store.bus, store));
    } else {
      store.bus.emit('notebook:auto', {
        title: 'CHRONOSTAT — undecoded',
        body: `Sequence "${buf}" did not resolve. (Try canonical Morse: 1-4 dots/dashes.)`
      });
    }
    keyBuffer = '';
  };

  key.addEventListener('mousedown', onDown);
  key.addEventListener('mouseup', onUp);
  key.addEventListener('mouseleave', onUp);
  key.addEventListener('touchstart', onDown, { passive: false });
  key.addEventListener('touchend', onUp, { passive: false });

  const root = el('div', { class: 'machine machine-chronostat' }, [
    el('h2', { text: 'CHRONOSTAT' }),
    el('div', { class: 'machine-meta', text: `TELEGRAPH KEY · ROUND-TRIPS ${view.roundTrips}/6 · DRIFT +${view.shift}` }),
    el('div', { class: 'rule' }),
    el('p', { text: 'Hold the key. Short tap for a dot, long press for a dash. Pause between letters.' }),
    key,
    el('div', { text: 'Current buffer: ', class: 'machine-meta' }),
    bufferDisplay(),
    plate,
    el('div', { class: 'rule' }),
    buildInboxList(state, store)
  ]);

  const bufDisplay = root.querySelectorAll('.machine-meta')[1];
  let lastBuf = '';
  function bufferDisplay() {
    return el('div', { class: 'readout', id: 'chronostat-buffer', text: '(empty)' });
  }
  const bufEl = root.querySelector('#chronostat-buffer');

  // refresh on change
  store.bus.on('change', () => {
    const v = chronostatView(store.get());
    plate.className = 'chronostat-plate ' + (v.inbox.length === 0 ? 'dark' : '');
    plate.textContent = v.inbox.length ? v.inbox[v.inbox.length - 1].fromFuture : 'Plate dark. Send a letter.';
    const meta = root.querySelector('.machine-meta');
    if (meta) meta.textContent = `TELEGRAPH KEY · ROUND-TRIPS ${v.roundTrips}/6 · DRIFT +${v.shift}`;
    bufEl.textContent = keyBuffer || '(empty)';
    const oldInbox = root.querySelector('.chronostat-inbox');
    if (oldInbox) oldInbox.replaceWith(buildInboxList(store.get(), store));
  });

  return root;
}

function buildInboxList(state, store) {
  const v = chronostatView(state);
  const wrap = el('div', { class: 'chronostat-inbox' });
  wrap.appendChild(el('div', { class: 'machine-meta', text: 'INBOX' }));
  if (v.inbox.length === 0) {
    wrap.appendChild(el('div', { class: 'readout', text: 'No messages yet.' }));
    return wrap;
  }
  for (const m of v.inbox.slice().reverse()) {
    wrap.appendChild(el('div', { class: 'readout' }, [
      el('div', { text: `#${m.rt + 1}  ECHO: ${m.echo}   ·   DECODED: ${m.fromFuture}` }),
      el('div', { text: `RAW FROM FUTURE: ${m.rawFuture}`, style: { color: 'var(--ink-dim)', fontSize: '11px' } })
    ]));
  }
  return wrap;
}

// ───────────────────────── ATLAS ─────────────────────────

export function buildAtlasUI(state, store) {
  const view = atlasView(state);
  const canvas = document.createElement('canvas');
  canvas.className = 'atlas-canvas';
  canvas.width = 360;
  canvas.height = 360;
  canvas.style.width = '360px';
  canvas.style.height = '360px';

  let current = null;
  let drawing = false;

  const ctx = canvas.getContext('2d');
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ece6d3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Subtle grid for cartographic feel
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = i * canvas.width / 10;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      const y = i * canvas.height / 10;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    // existing strokes
    for (const s of view.strokes) {
      drawStroke(ctx, s, canvas);
    }
    if (current) drawStroke(ctx, current, canvas);
  }

  function drawStroke(ctx, s, c) {
    if (!s.points || s.points.length < 1) return;
    ctx.strokeStyle = s.locked ? '#8f6f3a' : '#1a1c17';
    ctx.lineWidth = s.locked ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x * c.width, s.points[0].y * c.height);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x * c.width, s.points[i].y * c.height);
    }
    if (s.locked) ctx.lineTo(s.points[0].x * c.width, s.points[0].y * c.height);
    ctx.stroke();
  }

  redraw();

  const getXY = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x: cx / rect.width, y: cy / rect.height };
  };

  const onDown = (e) => {
    e.preventDefault();
    drawing = true;
    const { x, y } = getXY(e);
    store.set(s => {
      current = beginStroke(s);
      pushPoint(current, x, y);
    });
    redraw();
  };
  const onMove = (e) => {
    if (!drawing || !current) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    pushPoint(current, x, y);
    redraw();
  };
  const onUp = (e) => {
    if (!drawing) return;
    drawing = false;
    if (current && current.points.length >= 4) {
      store.set(s => {
        // push into state's atlas.strokes as unlocked first
        s.machines.atlas.strokes.push({ ...current, locked: false });
      });
    }
    current = null;
  };

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('mouseleave', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp, { passive: false });

  const lockBtn = el('button', { text: 'LOCK LAST STROKE', onClick: () => {
    store.set(s => {
      // lock the most recent unlocked stroke
      const target = [...s.machines.atlas.strokes].reverse().find(st => !st.locked);
      if (target) lockStroke(s, target, store.bus);
    });
  } });
  const cullBtn = el('button', { text: 'CULL EXPIRED', onClick: () => {
    store.set(s => cullExpired(s));
    redraw();
  } });
  const clearBtn = el('button', { text: 'CLEAR UNLOCKED', class: 'danger', onClick: () => {
    store.set(s => {
      s.machines.atlas.strokes = s.machines.atlas.strokes.filter(st => st.locked);
    });
    redraw();
  } });

  const root = el('div', { class: 'machine machine-atlas' }, [
    el('h2', { text: 'ATLAS OF FALSE COASTS' }),
    el('div', { class: 'machine-meta', text: `WALL-MOUNTED MAP · LOCKED ${view.lockedShapes} · SUNDIAL DOOR ${view.openedSundial ? 'OPEN' : 'SEALED'}` }),
    el('div', { class: 'rule' }),
    el('p', { text: 'Draw a coastline. Lock it before the canvas forgets. The room will rearrange to match.' }),
    canvas,
    el('div', { style: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' } }, [lockBtn, cullBtn, clearBtn])
  ]);

  store.bus.on('change', () => {
    const v = atlasView(store.get());
    root.querySelector('.machine-meta').textContent = `WALL-MOUNTED MAP · LOCKED ${v.lockedShapes} · SUNDIAL DOOR ${v.openedSundial ? 'OPEN' : 'SEALED'}`;
    redraw();
  });

  return root;
}

// ───────────────────────── ARCHIVE ─────────────────────────

export function buildArchiveUI(state, store) {
  const view = archiveView(state);
  const board = el('div', { class: 'archive-board', id: 'archive-board' });
  const polaroids = [];
  for (const sid of view.revealed) {
    const staff = ['harker','pell','doss','mora','vance','yuen'].map(id => {
      return { id, name: id.toUpperCase(), role: '?' };
    }).find(s => s.id === sid);
    // We use the documents.js STAFF data through the bus.
  }
  // Use canonical staff data via documents.
  import('../archive/documents.js').then(({ STAFF }) => {
    for (const sid of view.revealed) {
      const s = STAFF.find(x => x.id === sid);
      if (!s) continue;
      const date = '19' + (40 + s.order * 3).toString().padStart(2, '0') + '-0' + (s.order % 9 + 1) + '-1' + (s.order % 7);
      polaroids.push(makePolaroid(s, date));
    }
    renderBoard(board, polaroids, store, view);
  });

  const printBtn = el('button', { text: 'PRINT POLAROID', onClick: () => {
    store.set(s => printPolaroid(s, store.bus));
  } });

  const orderBtn = el('button', { text: 'CHECK ORDER', onClick: () => {
    const ids = [...board.querySelectorAll('.polaroid')].map(p => p.dataset.id);
    store.set(s => {
      const r = setOrder(s, ids, store.bus);
      if (!r.ok && r.reason === 'wrong-order') {
        store.bus.emit('notebook:auto', {
          title: 'ARCHIVE — wrong order',
          body: 'The polaroids do not click into place. Try again.'
        });
      }
    });
  } });

  const root = el('div', { class: 'machine machine-archive' }, [
    el('h2', { text: 'ARCHIVE OF FORGOTTEN CHILDREN' }),
    el('div', { class: 'machine-meta', text: `REVEALED ${view.revealed.length}/6 · SOLVED ${view.solved ? 'YES' : 'NO'}` }),
    el('div', { class: 'rule' }),
    el('p', { text: 'Print polaroids. Drag them into the order they should appear. The printer slot hums when you approach.' }),
    el('div', { style: { display: 'flex', gap: '8px' } }, [printBtn, orderBtn]),
    board
  ]);

  return root;
}

function makePolaroid(staff, date) {
  return el('div', {
    class: 'polaroid draggable',
    attrs: { draggable: 'true', 'data-id': staff.id }
  }, [
    el('div', { class: 'photo', text: 'STILL PHOTO' }),
    el('div', { class: 'name', text: staff.name }),
    el('span', { class: 'role', text: staff.role }),
    el('span', { class: 'date', text: date })
  ]);
}

function renderBoard(board, polaroids, store, view) {
  clear(board);
  // desired canonical order
  const canonical = ['harker','pell','doss','mora','vance','yuen'];
  // current order on the board
  const existingIds = [...board.children].map(c => c.dataset.id).filter(Boolean);
  const currentOrder = existingIds.length === polaroids.length ? existingIds : canonical.slice(0, polaroids.length);
  // arrange polaroids in currentOrder
  for (const id of currentOrder) {
    const p = polaroids.find(x => x.dataset.id === id);
    if (p) board.appendChild(p);
  }
  // make draggable
  for (const p of polaroids) {
    p.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', p.dataset.id);
    });
  }
  board.addEventListener('dragover', e => e.preventDefault());
  board.addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const target = e.target.closest('.polaroid');
    if (!target) return;
    const dragged = board.querySelector(`[data-id="${id}"]`);
    if (!dragged || dragged === target) return;
    board.insertBefore(dragged, target);
  });
}

// ───────────────────────── ORACLE ─────────────────────────

export function buildOracleUI(state, store) {
  const view = oracleView(state);
  const grid = el('div', { class: 'token-grid' });
  const scaleReadout = el('div', { class: 'readout' });

  function renderGrid() {
    clear(grid);
    for (const t of view.tokens) {
      const owned = state.machines.oracle.inventory.includes(t.id);
      const placed = state.machines.oracle.placed.includes(t.id);
      const r = state.machines.oracle.readings[t.id];
      const chip = el('div', { class: 'token-chip' + (placed ? ' placed' : '') }, [
        el('div', { text: t.name }),
        el('div', { text: owned ? `${(r != null ? r + 'g' : (placed ? '...' : 'not placed'))}` : 'locked', style: { color: 'var(--ink-dim)', fontSize: '10px' } })
      ]);
      if (owned) {
        chip.addEventListener('click', () => {
          store.set(s => {
            if (s.machines.oracle.placed.includes(t.id)) remove(s, t.id, store.bus);
            else place(s, t.id, store.bus);
          });
        });
      }
      grid.appendChild(chip);
    }
  }

  function renderScale() {
    clear(scaleReadout);
    if (view.placed.length === 0) {
      scaleReadout.appendChild(el('div', { text: 'Scale idle.' }));
      return;
    }
    for (const id of view.placed) {
      const t = view.tokens.find(t => t.id === id);
      const r = state.machines.oracle.readings[id];
      scaleReadout.appendChild(el('div', { text: `${t.name}: ${r}g (true ${t.trueMass}g)` }));
    }
  }

  renderGrid();
  renderScale();

  // SVG scale visualization
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.innerHTML = `
    <defs>
      <radialGradient id="brass" cx="30%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#e8c97a"/>
        <stop offset="100%" stop-color="#8f6f3a"/>
      </radialGradient>
    </defs>
    <rect x="40" y="160" width="120" height="20" fill="#3a3a30"/>
    <rect x="90" y="60" width="20" height="100" fill="url(#brass)"/>
    <line x1="100" y1="60" x2="100" y2="40" stroke="#c8a25a" stroke-width="2"/>
    <ellipse cx="100" cy="40" rx="50" ry="6" fill="url(#brass)" stroke="#3a3a30"/>
  `;
  const wrap = el('div', { class: 'oracle-scale' }, [svg]);

  const root = el('div', { class: 'machine machine-oracle' }, [
    el('h2', { text: 'ORACLE OF WEIGHTLESS OBJECTS' }),
    el('div', { class: 'machine-meta', text: `INVENTORY ${state.machines.oracle.inventory.length} · PLACED ${view.placed.length} · RULE ${view.ruleLearned ? 'LEARNED' : 'UNKNOWN'}` }),
    el('div', { class: 'rule' }),
    el('p', { text: 'Open the drawer. Take objects. Place them on the scale. The reading is not what you expect.' }),
    wrap,
    scaleReadout,
    el('div', { class: 'rule' }),
    el('div', { class: 'machine-meta', text: 'INVENTORY' }),
    grid
  ]);

  store.bus.on('change', () => {
    const s = store.get();
    const v = oracleView(s);
    root.querySelector('.machine-meta').textContent = `INVENTORY ${s.machines.oracle.inventory.length} · PLACED ${v.placed.length} · RULE ${v.ruleLearned ? 'LEARNED' : 'UNKNOWN'}`;
    renderGrid();
    renderScale();
  });

  return root;
}

// ───────────────────────── VERBOTEN ─────────────────────────

export function buildVerbotenUI(state, store) {
  const view = verbotenView(state);
  const cyl = el('div', { class: 'verboten-cyl' }, [
    el('div', { class: 'furnace', text: 'FURNACE' }),
    el('div', { class: 'tape', id: 'verboten-tape', text: view.wordsPrinted.length ? view.wordsPrinted[view.wordsPrinted.length - 1].word : '---' })
  ]);

  let pendingWord = null;
  let pendingTimer = null;

  function actuateClick() {
    store.set(s => {
      const w = actuate(s, store.bus);
      if (w) {
        pendingWord = w;
        const tape = cyl.querySelector('#verboten-tape');
        tape.textContent = w;
        clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => {
          tape.textContent = '---';
          pendingWord = null;
        }, 1800);
      }
    });
  }

  const actuateBtn = el('button', { text: 'ACTUATE', onClick: actuateClick });
  const witnessBtn = el('button', { text: 'WITNESS (CAPTURE)', class: 'primary', onClick: () => {
    if (!pendingWord) {
      store.bus.emit('notebook:auto', {
        title: 'VERBOTEN — no pending word',
        body: 'You try to witness nothing. The engine is unmoved.'
      });
      return;
    }
    store.set(s => witness(s, pendingWord, store.bus));
  } });

  const recent = el('div', { class: 'readout' });
  function refreshRecent() {
    clear(recent);
    const v = verbotenView(store.get());
    const cur = store.get();
    if (v.wordsPrinted.length === 0) {
      recent.appendChild(el('div', { text: 'Tape dry.' }));
    } else {
      recent.appendChild(el('div', { text: 'Recent prints:' }));
      const last = v.wordsPrinted.slice(-8);
      for (const w of last) {
        const captured = cur.machines.verboten.captures[w.word];
        recent.appendChild(el('div', { text: `${w.word}${captured ? '  (captured)' : ''}` }));
      }
    }
  }
  refreshRecent();

  const root = el('div', { class: 'machine machine-verboten' }, [
    el('h2', { text: 'VERBOTEN ENGINE' }),
    el('div', { class: 'machine-meta', text: `PRINTS ${view.wordsPrinted.length} · CAPTURES ${Object.keys(view.captures).length} · DIRECTOR DOOR ${view.openedDirector ? 'OPEN' : 'SEALED'}` }),
    el('div', { class: 'rule' }),
    el('p', { text: 'Press ACTUATE to drop the slug. The engine prints a forbidden word. The tape feeds into the furnace. Witness the word before it burns.' }),
    cyl,
    el('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } }, [actuateBtn, witnessBtn]),
    recent
  ]);

  store.bus.on('change', () => {
    const v = verbotenView(store.get());
    root.querySelector('.machine-meta').textContent = `PRINTS ${v.wordsPrinted.length} · CAPTURES ${Object.keys(v.captures).length} · DIRECTOR DOOR ${v.openedDirector ? 'OPEN' : 'SEALED'}`;
    refreshRecent();
  });

  return root;
}

// ───────────────────────── SUNDIAL ─────────────────────────

export function buildSundialUI(state, store) {
  const view = sundialView(state);
  const stage = el('div', { class: 'sundial-stage' });
  // SVG sundial
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 220 220');
  svg.innerHTML = `
    <defs>
      <radialGradient id="granite" cx="30%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#3a3a30"/>
        <stop offset="100%" stop-color="#1a1c17"/>
      </radialGradient>
      <radialGradient id="brass2" cx="30%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#e8c97a"/>
        <stop offset="100%" stop-color="#8f6f3a"/>
      </radialGradient>
    </defs>
    <circle cx="110" cy="110" r="100" fill="url(#granite)" stroke="#3a3a30"/>
    <g id="sundial-rings">
      <circle cx="110" cy="110" r="80" fill="none" stroke="#c8a25a" stroke-width="1.5"/>
      <circle cx="110" cy="110" r="60" fill="none" stroke="#c8a25a" stroke-width="1"/>
      <circle cx="110" cy="110" r="40" fill="none" stroke="#c8a25a" stroke-width="1"/>
      <circle cx="110" cy="110" r="20" fill="none" stroke="#c8a25a" stroke-width="0.8"/>
    </g>
    <g id="sundial-arm" transform="rotate(${ (12 - view.hour) * 15 + 90} 110 110)">
      <line x1="110" y1="110" x2="110" y2="40" stroke="url(#brass2)" stroke-width="3"/>
      <circle cx="110" cy="110" r="6" fill="url(#brass2)"/>
    </g>
    <text x="110" y="20" text-anchor="middle" fill="#d8d4c5" font-family="monospace" font-size="10" id="sundial-hour">${String(view.hour).padStart(2,'0')}:00</text>
  `;
  stage.appendChild(svg);

  const tickBtn = el('button', { text: 'TICK -1h', onClick: () => {
    store.set(s => tick(s, store.bus));
  } });
  const accessInput = el('input', { type: 'text', placeholder: 'Access code', maxlength: 7 });
  const enterBtn = el('button', { text: 'ENTER CODE', onClick: () => {
    const v = accessInput.value;
    store.set(s => {
      const r = enterAccessCode(s, v, store.bus);
      if (!r.ok) {
        store.bus.emit('notebook:auto', {
          title: 'SUNDIAL — code rejected',
          body: 'The Director\'s safe panel flashes red.'
        });
      }
    });
  } });

  const glyphDisplay = el('div', { class: 'readout' });
  function refresh() {
    const v = sundialView(store.get());
    glyphDisplay.textContent = `Hour ${String(v.hour).padStart(2,'0')}:00 · Glyphs revealed: ${v.glyphs.join('') || '(none)'} · Code: ${v.accessCode || '(incomplete)'}`;
    const arm = stage.querySelector('#sundial-arm');
    if (arm) arm.setAttribute('transform', `rotate(${(12 - v.hour) * 15 + 90} 110 110)`);
    const txt = stage.querySelector('#sundial-hour');
    if (txt) txt.textContent = `${String(v.hour).padStart(2,'0')}:00`;
  }
  refresh();

  const root = el('div', { class: 'machine machine-sundial' }, [
    el('h2', { text: 'COUNTERFEIT SUNDIAL' }),
    el('div', { class: 'machine-meta', text: `RETROGRADE CLOCK · GLYPHS ${view.glyphs.length}/7 · USED ${view.used ? 'YES' : 'NO'}` }),
    el('div', { class: 'rule' }),
    el('p', { text: 'Tick the dial. Time runs backward. Each hour-crossing reveals a glyph. The full glyph sequence opens the Director\'s safe.' }),
    stage,
    el('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } }, [tickBtn]),
    glyphDisplay,
    el('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } }, [
      accessInput,
      enterBtn
    ])
  ]);

  store.bus.on('change', () => {
    const v = sundialView(store.get());
    root.querySelector('.machine-meta').textContent = `RETROGRADE CLOCK · GLYPHS ${v.glyphs.length}/7 · USED ${v.used ? 'YES' : 'NO'}`;
    refresh();
  });

  return root;
}
