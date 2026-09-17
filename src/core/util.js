// src/core/util.js
// Tiny utilities. No deps.

export const uid = () => Math.random().toString(36).slice(2, 10);

export function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export function debounce(fn, ms = 250) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function now() { return Date.now(); }

export function deepClone(x) {
  if (x == null || typeof x !== 'object') return x;
  if (Array.isArray(x)) return x.map(deepClone);
  const out = {};
  for (const k of Object.keys(x)) out[k] = deepClone(x[k]);
  return out;
}

// Fisher–Yates with seedable RNG (mulberry32) so we can rewind.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A Vigenère-style cipher used by CHRONOSTAT.
export function shiftLetter(ch, shift) {
  const code = ch.toUpperCase().charCodeAt(0);
  if (code < 65 || code > 90) return ch;
  return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
}

export function shiftString(s, shift) {
  return s.split('').map(c => shiftLetter(c, shift)).join('');
}
