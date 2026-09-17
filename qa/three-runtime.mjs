// qa/three-runtime.mjs
// Verifies that the 3D enhancement is optional: when WebGL is unavailable,
// the machine DOM controls remain present and the runtime reports fallback state.

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from './load-jsdom.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const u = (p) => pathToFileURL(path.join(ROOT, p)).href;

const dom = new JSDOM(`<!doctype html><html><head></head><body>
  <div class="machine machine-atlas">
    <h2>ATLAS</h2>
    <button id="original-control">LOCK LAST STROKE</button>
  </div>
</body></html>`, {
  url: 'http://localhost/',
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.HTMLElement = dom.window.HTMLElement;

// Deliberately leave WebGLRenderingContext/WebGL2RenderingContext absent.
// The enhancement must fall back rather than taking down the machine UI.
const module = await import(u('src/three/machine-scenes.js'));
dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));
await new Promise((resolve) => setTimeout(resolve, 150));

const failures = [];
const assert = (condition, message) => {
  if (condition) console.log('  PASS', message);
  else {
    failures.push(message);
    console.error('  FAIL', message);
  }
};

const host = dom.window.document.querySelector('.machine-three-view');
const originalControl = dom.window.document.querySelector('#original-control');
const status = module.getThreeRuntimeStatus();

assert(!!host, '3D enhancement host is mounted');
assert(!!originalControl, 'original machine control remains present');
assert(host?.dataset.threeStatus === 'unavailable', 'host enters explicit unavailable fallback state');
assert(host?.textContent.includes('INSTRUMENT CONTROLS REMAIN ACTIVE'), 'fallback tells the user controls remain active');
assert(status.moduleLoaded === true, 'local Three.js module loads');
assert(status.rendererCreated === false, 'renderer is not created without WebGL');
assert(status.mountedViews === 1, 'exactly one machine view is mounted');
assert(!!status.unavailableReason, 'runtime exposes the fallback reason for diagnostics');

if (failures.length) {
  console.error(`THREE RUNTIME QA: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log('THREE RUNTIME QA: all checks passed.');
