// src/facility/rooms.js
// Static room data. Doors, machines, ambient description.

export const ROOMS = {
  foyer: {
    id: 'foyer',
    name: 'The Foyer',
    subtitle: 'Reception. Or what remains of it.',
    description:
      'A circular antechamber with a domed ceiling and a single dead fluorescent ring. ' +
      'Dust has settled in concentric patterns. A reception desk sits unattended. ' +
      'Two corridors branch north and south; a service passage leads east toward the Archive.',
    doors: [
      { id: 'corridor_n', dir: 'n', label: 'North Corridor' },
      { id: 'corridor_s', dir: 's', label: 'South Corridor' },
      { id: 'archive',    dir: 'e', label: 'Service Passage' }
    ],
    ambience: 'low hum',
    machines: []
  },
  corridor_n: {
    id: 'corridor_n',
    name: 'North Corridor',
    subtitle: 'Cold. Long. The lights don\'t flicker so much as hesitate.',
    description:
      'A long hall lined with riveted steel panels. At the far end, a heavy door marked ' +
      '"GRAVITY CHAMBER — DEIMOS". Beside it, a smaller door marked "CHRONOSTAT". ' +
      'Neither yields easily.',
    doors: [
      { id: 'foyer',   dir: 's', label: 'Return to Foyer' },
      { id: 'deimos',  dir: 'n', label: 'Gravity Chamber' },
      // The Chronostat door is unlocked from the start — it lets the player
      // *try* to send messages, which is how they discover the round-trip loop.
      { id: 'chronostat', dir: 'e', label: 'Chronostat Bay' }
    ],
    ambience: 'metallic echo'
  },
  corridor_s: {
    id: 'corridor_s',
    name: 'South Corridor',
    subtitle: 'Warmer here. The walls are slightly damp.',
    description:
      'Corkboard lines one wall — half-collapsed, with paper cones still pinned. ' +
      'To the west, a side chamber marked "ATLAS". To the east, a curtained alcove ' +
      'marked "ORACLE OF WEIGHTLESS OBJECTS". At the corridor\'s southern end, a steel door ' +
      'marked "VERBOTEN ENGINE — PERSONNEL ONLY".',
    doors: [
      { id: 'foyer',    dir: 'n', label: 'Return to Foyer' },
      { id: 'atlas',    dir: 'w', label: 'Atlas Chamber' },
      { id: 'oracle',   dir: 'e', label: 'Oracle Alcove' },
      { id: 'verboten', dir: 's', label: 'Verboten Engine', requires: { machine: 'chronostat', flag: 'unlockedVerb' } }
    ],
    ambience: 'soft drip'
  },
  archive: {
    id: 'archive',
    name: 'The Archive of Forgotten Children',
    subtitle: 'Not what it sounds like. Probably.',
    description:
      'A corkboard runs the length of the room. Dozens of polaroids are pinned to it, ' +
      'some torn, some face-down, some missing. A small printer slot hums in the wall: ' +
      'the only functional object in the room. Cards of names, dates, and brief bios print ' +
      'from it as you approach.',
    doors: [
      { id: 'foyer', dir: 'w', label: 'Back to Foyer' }
    ],
    machines: ['archive']
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas of False Coasts',
    subtitle: 'A wall-mounted map. Mostly blank. Suspiciously blank.',
    description:
      'A roughly 1m by 1m canvas mounted on an articulated arm. It currently shows ' +
      'nothing. A small easel beside it holds stylus-like instruments. The room around it ' +
      'is ordinary. Ordinary, ordinary, ordinary. (For now.)',
    doors: [
      { id: 'corridor_s', dir: 'e', label: 'Back to Corridor' }
    ],
    machines: ['atlas']
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle of Weightless Objects',
    subtitle: 'A pedestal. A scale. A small drawer of tokens.',
    description:
      'A short marble pillar carries a brass scale pan. Beside it, a drawer labelled ' +
      '"PERSONAL EFFECTS — DO NOT REMOVE". The drawer slides open with a click.',
    doors: [
      { id: 'corridor_s', dir: 'w', label: 'Back to Corridor' }
    ],
    machines: ['oracle']
  },
  deimos: {
    id: 'deimos',
    name: 'Gravity Chamber — DEIMOS',
    subtitle: 'A steel-walled chamber with a leather-upholstered dial at its center.',
    description:
      'The dial rotates. The chamber obeys. A reinforced safe is bolted to the north wall, ' +
      'its handle currently pointed upward. (Note: "upward" is negotiable.)',
    doors: [
      { id: 'corridor_n', dir: 's', label: 'Return to Corridor' },
      { id: 'sundial',    dir: 'e', label: 'Sundial Atrium', requires: { machine: 'atlas', flag: 'openedSundial' } }
    ],
    machines: ['deimos']
  },
  chronostat: {
    id: 'chronostat',
    name: 'Chronostat Bay',
    subtitle: 'A telegraph key. A brass plate. The future, calling.',
    description:
      'A wooden desk, polished to a shine, with a vintage Morse key and a slanted ' +
      'translucent plate. The plate is currently dark. Sometimes it glows.',
    doors: [
      { id: 'corridor_n', dir: 'w', label: 'Return to Corridor' }
    ],
    machines: ['chronostat']
  },
  verboten: {
    id: 'verboten',
    name: 'Verboten Engine',
    subtitle: 'A glass cylinder. A copper coil. A small iron slug. A furnace.',
    description:
      'The cylinder stands three feet tall. Inside, paper tape feeds from a spool, ' +
      'through a print head, and into a small opening that glows like a mouth. A small ' +
      'plate reads: "PRINT, WITNESS, FORGET."',
    doors: [
      { id: 'corridor_s', dir: 'n', label: 'Return to Corridor' },
      { id: 'director',   dir: 's', label: 'Director\'s Office', requires: 'multi' }
    ],
    machines: ['verboten']
  },
  sundial: {
    id: 'sundial',
    name: 'Counterfeit Sundial',
    subtitle: 'A pedestal sundial under electric lights. The sun is wrong.',
    description:
      'The sundial is a brass armillary sphere on a granite plinth. Its shadow, cast by ' +
      'no visible sun, points steadily at a mark on the floor. The mark moves. The shadow ' +
      'doesn\'t.',
    doors: [
      { id: 'deimos', dir: 'w', label: 'Back to Gravity Chamber' }
    ],
    machines: ['sundial']
  },
  director: {
    id: 'director',
    name: 'Director\'s Office',
    subtitle: 'A wooden desk. A swivel chair. One drawer left open.',
    description:
      'The desk is bare. The chair is facing the wall. The drawer contains a single ' +
      'blueprint labeled "QUIET INVERSION — CONTINGENCY".',
    doors: [
      { id: 'verboten', dir: 'n', label: 'Return to Verboten Engine' }
    ],
    machines: []
  }
};

// "multi" requirements resolved at runtime by canTraverse below.
export function canTraverse(fromId, toId, state) {
  const room = ROOMS[fromId];
  if (!room) return { ok: false, reason: 'no-from' };
  const door = (room.doors || []).find(d => d.id === toId);
  if (!door) return { ok: false, reason: 'no-door' };

  const targetRoom = state.rooms[toId];
  if (!targetRoom?.unlocked) return { ok: false, reason: 'locked' };

  if (door.requires && door.requires !== 'multi') {
    const m = state.machines[door.requires.machine];
    if (!m || !m[door.requires.flag]) return { ok: false, reason: 'requires-machine-flag', need: door.requires };
  }
  if (door.requires === 'multi') {
    // Director requires: sundial code known, oracle openedDirector, archive solved, verboten openedDirector.
    const need = {
      sundial: !!state.machines.sundial.accessCode,
      oracle:  !!state.machines.oracle.openedDirector,
      archive: !!state.machines.archive.solved,
      verboten:!!state.machines.verboten.openedDirector
    };
    const all = Object.values(need).every(Boolean);
    if (!all) return { ok: false, reason: 'requires-multi', need };
  }
  return { ok: true, door };
}
