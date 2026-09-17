#!/usr/bin/env node
// qa/setup.mjs — installs the QA-only dependency (jsdom) into a side directory.
// This is invoked by `npm run qa`. The dependency is not part of the runtime
// app, which has zero deps.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const target = path.join(ROOT, '.qa', 'node_modules');

if (fs.existsSync(path.join(target, 'jsdom'))) {
  console.log('[qa] jsdom already installed at', target);
  process.exit(0);
}

fs.mkdirSync(path.join(ROOT, '.qa'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.qa', 'package.json'), JSON.stringify({
  name: 'impossible-machines-qa', private: true, type: 'module'
}, null, 2));

console.log('[qa] installing jsdom into .qa/node_modules');
execSync('npm install --no-fund --no-audit --prefix .qa jsdom@24', { stdio: 'inherit', cwd: ROOT });
console.log('[qa] done.');
