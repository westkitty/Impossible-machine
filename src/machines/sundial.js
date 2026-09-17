// src/machines/sundial.js
// COUNTERFEIT SUNDIAL — moves retrograde. At each hour boundary, reveals
// a glyph from the 7-character access code. Full code opens the Director's
// door (combined with other gates).
//
// Mechanic: a "tick" button (and an automatic slow tick) decreases the hour
// from 24 → 0. At each whole hour crossing (24→23, 23→22, ..., 1→0), a glyph
// is appended to sundial.glyphs. After 24 ticks, the player has the full code.
//
// We model the access code as the staff names' initials in canonical order:
// H, P, D, M, V, Y, plus a final sentinel 'K' for the lab (K-12).
// So the code spells HPDM VYK — but it's not for the player to *read* literally;
// it's mechanically entered into the Director's safe panel.

const ACCESS_CODE = ['H', 'P', 'D', 'M', 'V', 'Y', 'K'];

export function tick(state, bus) {
  const before = state.machines.sundial.hour;
  const next = (before - 1 + 24) % 24;
  state.machines.sundial.hour = next;
  state.discoveries.sundial_shadow = true;

  // If we crossed a "glyph boundary" (i.e. we just moved to a whole-hour mark from
  // a different whole hour, meaning the integer hour changed), append a glyph.
  // We simply append on each tick for the first 7 ticks since that's how many
  // glyphs there are.
  if (state.machines.sundial.glyphs.length < ACCESS_CODE.length) {
    state.machines.sundial.glyphs.push(ACCESS_CODE[state.machines.sundial.glyphs.length]);
    if (state.machines.sundial.glyphs.length === ACCESS_CODE.length) {
      state.machines.sundial.accessCode = ACCESS_CODE.join('');
      state.discoveries.sundial_reversal = true;
      state.discoveries.sundial_code = true;
      bus?.emit('notebook:auto', {
        title: 'SUNDIAL — full access code assembled',
        body: 'The shadow completes its retrograde cycle. Seven glyphs appear around the ' +
              'pedestal: ' + ACCESS_CODE.join('') + '. The Director\'s safe panel is ready ' +
              'to accept this code.'
      });
      bus?.emit('discovery', { id: 'sundial_code' });
    }
  }
  return { before, after: next };
}

export function enterAccessCode(state, code, bus) {
  const want = state.machines.sundial.accessCode;
  if (!want) return { ok: false, reason: 'no-code' };
  const ok = (code || '').toUpperCase() === want;
  if (ok) {
    state.machines.sundial.used = true;
    bus?.emit('notebook:auto', {
      title: 'SUNDIAL — code entered',
      body: 'The Director\'s safe panel accepts the code. The door is now accessible from ' +
            'the Verboten Engine if other gates are also satisfied.'
    });
    bus?.emit('discovery', { id: 'sundial_code' });
  }
  return { ok };
}

export function sundialView(state) {
  return {
    hour: state.machines.sundial.hour,
    glyphs: state.machines.sundial.glyphs,
    accessCode: state.machines.sundial.accessCode,
    used: state.machines.sundial.used
  };
}
