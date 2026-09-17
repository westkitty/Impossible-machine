import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const threeRoot = path.join(root, 'node_modules', 'three');
const source = path.join(threeRoot, 'build', 'three.module.js');
const packageFile = path.join(threeRoot, 'package.json');
const destinationDir = path.join(root, 'src', 'three', 'vendor');
const destination = path.join(destinationDir, 'three.module.js');
const expectedVersion = '0.186.0';

if (!fs.existsSync(packageFile) || !fs.existsSync(source)) {
  console.error('[three] local Three.js package is missing. Run npm install first.');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
if (packageJson.version !== expectedVersion) {
  console.error(`[three] expected three@${expectedVersion}, found ${packageJson.version || 'unknown'}`);
  process.exit(1);
}

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(source, destination);
console.log(`[three] prepared three@${expectedVersion} -> ${path.relative(root, destination)}`);
