// qa/load-jsdom.mjs
// Helper that locates jsdom whether it's installed via the side directory
// (.qa/node_modules) or via the main project node_modules. Re-exports JSDOM.

import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const candidates = [
  path.join(ROOT, '.qa', 'node_modules', 'jsdom'),
  path.join(ROOT, 'node_modules', 'jsdom')
];

const found = candidates.find(p => fs.existsSync(p));
if (!found) {
  throw new Error(`jsdom not found. Run 'npm run qa:setup' first.`);
}

const require = createRequire(import.meta.url);
const mod = require(found);
const JSDOM = mod.JSDOM || mod.default?.JSDOM || mod;
const ResourceLoader = mod.ResourceLoader || mod.default?.ResourceLoader;
export { JSDOM, ResourceLoader };
