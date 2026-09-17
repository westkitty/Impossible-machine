// src/archive/search.js
// Document search. Tokenizes unlocked documents and returns ranked matches.

import { DOCUMENTS, visibleDocuments } from './documents.js';

const STOP = new Set(['the','a','an','of','to','and','or','is','it','in','on','at','as','be','by','for','with','that','this']);

function tokens(s) {
  return (s || '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

function indexDoc(doc) {
  const text = (doc.title + ' ' + doc.body + ' ' + (doc.tags||[]).join(' ')).toLowerCase();
  const toks = tokens(text);
  const map = new Map();
  for (const t of toks) {
    if (STOP.has(t)) continue;
    map.set(t, (map.get(t) || 0) + 1);
  }
  return map;
}

export function searchDocuments(state, query) {
  const qTokens = tokens(query).filter(t => !STOP.has(t));
  if (qTokens.length === 0) return [];
  const visible = visibleDocuments(state);
  const out = [];
  for (const doc of visible) {
    const idx = indexDoc(doc);
    let score = 0;
    for (const qt of qTokens) {
      score += idx.get(qt) || 0;
    }
    if (score > 0) out.push({ doc, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out.map(o => o.doc);
}

export function allDocumentsForState(state) {
  return visibleDocuments(state);
}

export function documentById(id) {
  return DOCUMENTS.find(d => d.id === id) || null;
}
