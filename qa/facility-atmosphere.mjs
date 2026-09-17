// qa/facility-atmosphere.mjs
import { defaultState } from '../src/state/store.js';
import { ROOMS } from '../src/facility/rooms.js';
import { projectFacilityAtmosphere } from '../src/ui/facility-atmosphere.js';

const failures = [];
const assert = (condition, message) => {
  if (condition) console.log('  PASS', message);
  else { failures.push(message); console.error('  FAIL', message); }
};

const base = defaultState();
const before = JSON.stringify(base);
const dormant = projectFacilityAtmosphere(base, ROOMS.foyer);
assert(dormant.roomId === 'foyer', 'foyer room id is projected');
assert(dormant.restorationLevel === 0, 'fresh facility has zero restoration');
assert(dormant.anomalyLevel === 0, 'fresh facility has zero anomaly');
assert(dormant.tone === 'dormant', 'fresh facility tone is dormant');
assert(JSON.stringify(base) === before, 'atmosphere projection does not mutate canonical state');

const engagedState = defaultState();
engagedState.machines.deimos.orientation = 1;
const engaged = projectFacilityAtmosphere(engagedState, ROOMS.deimos);
assert(engaged.engagedMachineCount === 1, 'local engaged machine is counted');
assert(engaged.anomalyLevel > 0, 'engaged machine increases presentation-only anomaly');
assert(engaged.tone === 'active', 'engaged room becomes active without implying solution');

const aftermathState = defaultState();
aftermathState.machines.deimos.safeOpen = true;
const aftermath = projectFacilityAtmosphere(aftermathState, ROOMS.deimos);
assert(aftermath.aftermathMachineCount === 1, 'local aftermath machine is counted');
assert(aftermath.restorationLevel > 0, 'aftermath increases presentation-only restoration');
assert(aftermath.tone === 'restored', 'local aftermath settles room presentation');

const terminalState = defaultState();
terminalState.meta.ending = 'full';
const terminal = projectFacilityAtmosphere(terminalState, ROOMS.foyer);
assert(terminal.tone === 'terminal', 'ending locks facility into terminal tone');
assert(terminal.restorationLevel === 1, 'full ending projects complete restoration');

const secretState = defaultState();
secretState.machines.verboten.wordsPrinted = [{ word: 'NEVER_RENDER_THIS', ts: 1 }];
secretState.machines.verboten.captures = { HIDDEN_NAME: 1 };
secretState.machines.sundial.glyphs = ['S', 'E', 'C', 'R', 'E', 'T', '!'];
secretState.machines.sundial.accessCode = 'SECRET!';
const serialized = JSON.stringify(projectFacilityAtmosphere(secretState, ROOMS.sundial));
assert(!serialized.includes('NEVER_RENDER_THIS'), 'VERBOTEN word content does not cross atmosphere projection');
assert(!serialized.includes('HIDDEN_NAME'), 'VERBOTEN capture keys do not cross atmosphere projection');
assert(!serialized.includes('SECRET!'), 'SUNDIAL access code does not cross atmosphere projection');

const malformed = projectFacilityAtmosphere({ machines: null, rooms: null, meta: null }, null);
assert(malformed.roomId === 'unknown', 'malformed room safely falls back');
assert(malformed.restorationLevel >= 0 && malformed.restorationLevel <= 1, 'restoration stays bounded');
assert(malformed.anomalyLevel >= 0 && malformed.anomalyLevel <= 1, 'anomaly stays bounded');

if (failures.length) {
  console.error(`FACILITY ATMOSPHERE QA: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('FACILITY ATMOSPHERE QA: all checks passed.');
