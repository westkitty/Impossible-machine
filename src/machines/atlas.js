// src/machines/atlas.js
// ATLAS OF FALSE COASTS — a wall-mounted map. Strokes fade. Locking strokes
// alters the room. Mechanically we treat the "room alteration" as door-unlock
// gating: locking exactly one of three specific shapes opens one of three doors.
//
// Three target shapes (recognized as locked): "Sundial outline" → sundial door,
// "Director outline" → director door (only after sundial). We embed this as a
// shape-similarity heuristic: strokes whose bounding box matches the target.

import { uid } from '../core/util.js';

const ERASE_MS = 90000; // 90s
// Targets are described in normalized (0..1) units. The sundial outline is a
// roughly closed loop. We use length and bounding-box aspect heuristics.
const TARGET_SUNDIAL = {
  minLen: 0.8, maxLen: 6.0, minAspect: 0.5, maxAspect: 2.0
};

// Strokes are arrays of points (0..1 normalized). They expire after ERASE_MS
// unless locked.

export function beginStroke(state) {
  return { id: uid(), points: [], locked: false, t0: Date.now() };
}

export function pushPoint(stroke, x, y) {
  stroke.points.push({ x: clamp01(x), y: clamp01(y) });
  return stroke;
}

function clamp01(n) { return Math.max(0, Math.min(1, n)); }

export function lockStroke(state, stroke, bus) {
  if (!stroke || !stroke.points || stroke.points.length < 4) return false;
  if (stroke.locked) return false;
  stroke.locked = true;
  state.machines.atlas.strokes.push({ ...stroke });
  state.machines.atlas.lockedShapes += 1;
  state.discoveries.atlas_drawn = true;
  state.discoveries.atlas_lock = true;
  bus?.emit('notebook:auto', {
    title: 'ATLAS — stroke locked',
    body: 'A click, then silence. The canvas holds the line. The room around you ' +
          'feels briefly different — as if you\'ve drawn the *idea* of it rather than its ' +
          'photograph.'
  });
  bus?.emit('discovery', { id: 'atlas_lock' });

  // After at least one locked stroke, see if it matches the sundial outline.
  if (!state.machines.atlas.openedSundial) {
    const score = shapeScore(stroke, TARGET_SUNDIAL);
    if (score > 0.7) {
      state.machines.atlas.openedSundial = true;
      bus?.emit('notebook:auto', {
        title: 'ATLAS — sundial outline accepted',
        body: 'The east door of the Gravity Chamber has unsealed. The Counterfeit Sundial ' +
              'is reachable.'
      });
      bus?.emit('discovery', { id: 'atlas_drawn' });
    }
  }
  return true;
}

// Sweep expired (unlocked) strokes. Call periodically.
export function cullExpired(state) {
  const cutoff = Date.now() - ERASE_MS;
  const before = state.machines.atlas.strokes.length;
  state.machines.atlas.strokes = state.machines.atlas.strokes.filter(s => {
    if (s.locked) return true;
    return s.t0 > cutoff;
  });
  const culled = before - state.machines.atlas.strokes.length;
  if (culled > 0) {
    // We don't flag discovery every time; only the first time.
    if (!state.discoveries.atlas_erase) {
      state.discoveries.atlas_erase = true;
    }
  }
  return culled;
}

function shapeScore(stroke, target) {
  const pts = stroke.points;
  if (!pts || pts.length < 4) return 0;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      const dx = p.x - pts[i-1].x, dy = p.y - pts[i-1].y;
      len += Math.hypot(dx, dy);
    }
  }
  const w = maxX - minX, h = maxY - minY;
  if (w < 0.05 || h < 0.05) return 0;
  const aspect = Math.max(w, h) / Math.min(w, h);
  if (aspect < target.minAspect || aspect > target.maxAspect) return 0;
  if (len < target.minLen || len > target.maxLen) return 0;
  const start = pts[0], end = pts[pts.length - 1];
  const closed = Math.hypot(start.x - end.x, start.y - end.y) < 0.08;
  let s = 0.6;
  if (closed) s += 0.3;
  if (closed && aspect < 1.6) s += 0.1;
  return Math.min(1, s);
}

export function atlasView(state) {
  return {
    strokes: state.machines.atlas.strokes,
    lockedShapes: state.machines.atlas.lockedShapes,
    openedSundial: state.machines.atlas.openedSundial
  };
}
