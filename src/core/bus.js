// src/core/bus.js
// Tiny event bus. No deps. Pub/sub. Used everywhere.

export function createBus() {
  const listeners = new Map(); // event -> Set<fn>
  return {
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event).delete(fn);
    },
    off(event, fn) {
      listeners.get(event)?.delete(fn);
    },
    emit(event, payload) {
      const set = listeners.get(event);
      if (!set) return;
      // copy so handlers can unsubscribe mid-iteration
      for (const fn of [...set]) {
        try { fn(payload); } catch (e) { console.error(`[bus] handler for ${event} threw:`, e); }
      }
    },
    clear() { listeners.clear(); }
  };
}
