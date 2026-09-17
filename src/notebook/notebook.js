// src/notebook/notebook.js
// The Experiment Notebook. Auto-records discoveries and lets the player
// add their own notes. Distinguishes observation from inference.

import { uid } from '../core/util.js';

export function addEntry(state, kind, title, body, refs = []) {
  const entry = {
    id: uid(),
    ts: Date.now(),
    kind,  // 'observation' | 'inference' | 'auto'
    title,
    body,
    refs
  };
  state.notebook.entries.push(entry);
  return entry;
}

export function notebookView(state) {
  return state.notebook.entries.slice().sort((a, b) => b.ts - a.ts);
}
