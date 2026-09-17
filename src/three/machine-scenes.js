import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.min.js';

const MACHINE_CLASSES = [
  'deimos',
  'chronostat',
  'atlas',
  'archive',
  'oracle',
  'verboten',
  'sundial'
];

const ACTIVE = new WeakMap();
const BRASS = 0xc8a25a;
const BONE = 0xd8d4c5;
const GREEN = 0x6a8a4f;
const OXIDE = 0xb14a3a;
const DARK = 0x15170f;
const DIM = 0x514d3e;

function machineIdFor(root) {
  for (const id of MACHINE_CLASSES) {
    if (root.classList.contains(`machine-${id}`)) return id;
  }
  return null;
}

function material(color = BRASS, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.62,
    metalness: options.metalness ?? 0.34,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    wireframe: options.wireframe ?? false,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide
  });
}

function lineMaterial(color = BRASS, opacity = 0.55) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

function makeRing(radius, tube, color = BRASS) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 10, 64),
    material(color, { roughness: 0.38, metalness: 0.7 })
  );
}

function addFloor(scene) {
  const grid = new THREE.GridHelper(9, 18, DIM, 0x2f3029);
  grid.position.y = -1.55;
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  scene.add(grid);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.6, 64),
    material(0x171913, { roughness: 1, metalness: 0, transparent: true, opacity: 0.7 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.57;
  scene.add(floor);
}

function deimosModel(group, animators) {
  const cage = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const ring = makeRing(1.08 + i * 0.18, 0.025, i % 2 ? BONE : BRASS);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = (i / 4) * Math.PI;
    cage.add(ring);
  }

  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.54, 1),
    material(BONE, { roughness: 0.2, metalness: 0.72, emissive: BRASS, emissiveIntensity: 0.045 })
  );
  cage.add(core);

  const axis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 3.15, 12),
    material(BRASS, { metalness: 0.78, roughness: 0.25 })
  );
  axis.rotation.z = Math.PI / 2;
  cage.add(axis);

  group.add(cage);
  animators.push((t) => {
    cage.rotation.z = Math.sin(t * 0.34) * 0.44;
    cage.rotation.x = t * 0.09;
    core.rotation.y = -t * 0.5;
  });
}

function chronostatModel(group, animators) {
  const rings = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const ring = makeRing(0.48 + i * 0.22, 0.018, i === 2 ? OXIDE : BRASS);
    ring.rotation.x = Math.PI / 2 + i * 0.2;
    ring.rotation.z = i * 0.42;
    rings.add(ring);
  }

  const pendulum = new THREE.Group();
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 1.62, 0.05),
    material(BONE, { metalness: 0.55, roughness: 0.35 })
  );
  arm.position.y = -0.42;
  pendulum.add(arm);
  const bob = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 22, 14),
    material(BRASS, { metalness: 0.82, roughness: 0.28 })
  );
  bob.position.y = -1.22;
  pendulum.add(bob);
  pendulum.position.y = 0.75;

  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 10),
    material(OXIDE, { emissive: OXIDE, emissiveIntensity: 0.45, roughness: 0.4 })
  );

  group.add(rings, pendulum, pulse);
  animators.push((t) => {
    rings.rotation.y = t * 0.18;
    rings.rotation.z = Math.sin(t * 0.25) * 0.14;
    pendulum.rotation.z = Math.sin(t * 1.35) * 0.52;
    const beat = 0.78 + Math.max(0, Math.sin(t * 4.5)) * 0.34;
    pulse.scale.setScalar(beat);
  });
}

function atlasModel(group, animators) {
  const globe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 3),
    material(0x1d2119, { roughness: 0.85, metalness: 0.05 })
  );
  group.add(globe);

  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.08, 2)),
    lineMaterial(BRASS, 0.66)
  );
  group.add(wire);

  const orbit = makeRing(1.48, 0.018, BONE);
  orbit.rotation.x = 1.08;
  orbit.rotation.z = 0.42;
  group.add(orbit);

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 8),
    material(OXIDE, { emissive: OXIDE, emissiveIntensity: 0.4 })
  );
  group.add(marker);

  animators.push((t) => {
    globe.rotation.y = t * 0.08;
    wire.rotation.y = t * 0.08;
    orbit.rotation.z = 0.42 + t * 0.12;
    marker.position.set(Math.cos(t * 0.55) * 1.32, Math.sin(t * 0.37) * 0.72, Math.sin(t * 0.55) * 1.32);
  });
}

function archiveModel(group, animators) {
  const cabinet = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 2.25, 0.72),
    material(0x34372d, { roughness: 0.82, metalness: 0.24 })
  );
  cabinet.add(shell);

  const drawers = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 3; x++) {
      const drawer = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.38, 0.12),
        material(y === 1 && x === 2 ? OXIDE : 0x24271f, { roughness: 0.76, metalness: 0.26 })
      );
      drawer.position.set((x - 1) * 0.69, 0.72 - y * 0.48, 0.41);
      cabinet.add(drawer);
      drawers.push(drawer);

      const label = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.08, 0.025),
        material(BONE, { metalness: 0.05, roughness: 1 })
      );
      label.position.set(drawer.position.x, drawer.position.y, 0.485);
      cabinet.add(label);
    }
  }

  group.add(cabinet);
  animators.push((t) => {
    cabinet.rotation.y = Math.sin(t * 0.22) * 0.12;
    drawers[5].position.z = 0.41 + (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.38;
  });
}

function oracleModel(group, animators) {
  const balance = new THREE.Group();
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, 2.25, 12),
    material(BRASS, { metalness: 0.78, roughness: 0.3 })
  );
  balance.add(column);

  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.08, 0.08),
    material(BONE, { metalness: 0.48, roughness: 0.4 })
  );
  beam.position.y = 0.72;
  balance.add(beam);

  for (const side of [-1, 1]) {
    const cordGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(side * 1.05, 0.72, 0),
      new THREE.Vector3(side * 1.05, -0.15, 0)
    ]);
    balance.add(new THREE.Line(cordGeo, lineMaterial(BONE, 0.72)));
    const pan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.32, 0.12, 28),
      material(side < 0 ? GREEN : OXIDE, { roughness: 0.65, metalness: 0.25 })
    );
    pan.position.set(side * 1.05, -0.2, 0);
    balance.add(pan);
  }

  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 20, 14),
    material(DARK, { emissive: BRASS, emissiveIntensity: 0.11, roughness: 0.32 })
  );
  eye.position.y = 1.25;
  balance.add(eye);
  group.add(balance);

  animators.push((t) => {
    balance.rotation.z = Math.sin(t * 0.56) * 0.07;
    eye.scale.y = 0.72 + Math.abs(Math.sin(t * 0.38)) * 0.34;
  });
}

function verbotenModel(group, animators) {
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 2.45, 36, 1, true),
    material(BONE, { transparent: true, opacity: 0.15, roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide })
  );
  group.add(cylinder);

  const caps = [-1.22, 1.22].map((y) => {
    const ring = makeRing(0.72, 0.055, BRASS);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    group.add(ring);
    return ring;
  });

  const tape = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.05, 0.06),
    material(BONE, { roughness: 0.92, metalness: 0.02 })
  );
  tape.position.z = 0.74;
  group.add(tape);

  const inner = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.38, 0.08, 80, 10, 2, 3),
    material(OXIDE, { emissive: OXIDE, emissiveIntensity: 0.15, metalness: 0.55, roughness: 0.3 })
  );
  group.add(inner);

  animators.push((t) => {
    inner.rotation.x = t * 0.45;
    inner.rotation.y = -t * 0.34;
    tape.rotation.z = Math.sin(t * 0.48) * 0.04;
    caps[0].rotation.z = t * 0.08;
    caps[1].rotation.z = -t * 0.08;
  });
}

function sundialModel(group, animators) {
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.28, 1.28, 0.15, 48),
    material(0x313329, { roughness: 0.82, metalness: 0.2 })
  );
  disc.rotation.x = Math.PI / 2;
  group.add(disc);

  const rim = makeRing(1.28, 0.045, BRASS);
  group.add(rim);

  const gnomon = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 1.62, 4),
    material(BONE, { metalness: 0.55, roughness: 0.32 })
  );
  gnomon.position.y = 0.72;
  gnomon.rotation.z = -0.38;
  group.add(gnomon);

  const shadowGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.03, 0),
    new THREE.Vector3(1.35, 0.03, 0)
  ]);
  const shadow = new THREE.Line(shadowGeo, lineMaterial(OXIDE, 0.8));
  group.add(shadow);

  const ticks = new THREE.Group();
  for (let i = 0; i < 24; i++) {
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.02, i % 6 === 0 ? 0.22 : 0.12),
      material(i % 6 === 0 ? BONE : BRASS, { roughness: 0.5, metalness: 0.4 })
    );
    const a = (i / 24) * Math.PI * 2;
    tick.position.set(Math.cos(a) * 1.08, 0.08, Math.sin(a) * 1.08);
    tick.rotation.y = -a + Math.PI / 2;
    ticks.add(tick);
  }
  group.add(ticks);

  animators.push((t) => {
    shadow.rotation.y = t * 0.16;
    rim.rotation.z = Math.sin(t * 0.2) * 0.08;
  });
}

const BUILDERS = {
  deimos: deimosModel,
  chronostat: chronostatModel,
  atlas: atlasModel,
  archive: archiveModel,
  oracle: oracleModel,
  verboten: verbotenModel,
  sundial: sundialModel
};

function disposeTree(root) {
  root.traverse((object) => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) {
      object.material.forEach((m) => m.dispose?.());
    } else {
      object.material?.dispose?.();
    }
  });
}

function mountMachineScene(root) {
  if (ACTIVE.has(root) || root.querySelector(':scope > .machine-three-view')) return;
  const id = machineIdFor(root);
  if (!id || !BUILDERS[id]) return;

  const host = document.createElement('section');
  host.className = 'machine-three-view';
  host.dataset.machine = id;
  host.setAttribute('aria-label', `${id} three-dimensional machine visualization`);

  const badge = document.createElement('div');
  badge.className = 'machine-three-badge';
  badge.textContent = '3D INSTRUMENT VIEW';
  host.appendChild(badge);

  const canvas = document.createElement('canvas');
  canvas.className = 'machine-three-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const title = root.querySelector('h2');
  if (title?.nextSibling) root.insertBefore(host, title.nextSibling);
  else root.prepend(host);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(DARK, 0.085);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.25, 5.15);

  scene.add(new THREE.HemisphereLight(0xd8d4c5, 0x191b16, 1.3));
  const key = new THREE.DirectionalLight(0xc8a25a, 2.25);
  key.position.set(3, 4, 4);
  scene.add(key);
  const rimLight = new THREE.PointLight(0x6a8a4f, 5.5, 8, 2);
  rimLight.position.set(-2.5, 1.2, -1.8);
  scene.add(rimLight);

  const group = new THREE.Group();
  scene.add(group);
  addFloor(scene);

  const animators = [];
  BUILDERS[id](group, animators);

  const pointer = new THREE.Vector2();
  let disposed = false;
  let raf = 0;
  let width = 0;
  let height = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === width && h === height) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const onPointer = (event) => {
    const rect = host.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };
  host.addEventListener('pointermove', onPointer, { passive: true });
  host.addEventListener('pointerleave', () => pointer.set(0, 0), { passive: true });

  const clock = new THREE.Clock();
  const render = () => {
    if (disposed) return;
    if (!root.isConnected) {
      cleanup();
      return;
    }

    resize();
    const t = clock.getElapsedTime();
    const motionScale = reducedMotion.matches ? 0.12 : 1;
    for (const animate of animators) animate(t * motionScale);

    camera.position.x += ((pointer.x * 0.42) - camera.position.x) * 0.035;
    camera.position.y += ((0.25 + pointer.y * 0.22) - camera.position.y) * 0.035;
    camera.lookAt(0, -0.04, 0);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  };

  function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    host.removeEventListener('pointermove', onPointer);
    disposeTree(scene);
    renderer.dispose();
    renderer.forceContextLoss?.();
    ACTIVE.delete(root);
  }

  ACTIVE.set(root, { cleanup });
  resize();
  render();
}

function scan(scope = document) {
  scope.querySelectorAll?.('.machine').forEach(mountMachineScene);
}

function installStyles() {
  if (document.getElementById('impossible-machine-three-styles')) return;
  const style = document.createElement('style');
  style.id = 'impossible-machine-three-styles';
  style.textContent = `
    .machine-three-view {
      position: relative;
      width: 100%;
      height: clamp(220px, 34vh, 340px);
      margin: 8px 0 18px;
      overflow: hidden;
      border: 1px solid var(--rule);
      background:
        radial-gradient(circle at 50% 46%, rgba(200,162,90,.07), transparent 46%),
        #11130f;
      isolation: isolate;
    }
    .machine-three-view::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      box-shadow: inset 0 0 70px rgba(0,0,0,.66);
      border: 1px solid rgba(216,212,197,.035);
      z-index: 2;
    }
    .machine-three-canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: pan-y;
    }
    .machine-three-badge {
      position: absolute;
      top: 9px;
      left: 10px;
      z-index: 3;
      padding: 4px 7px;
      border: 1px solid rgba(200,162,90,.36);
      background: rgba(17,19,15,.78);
      color: var(--accent);
      font: 9px/1.1 var(--mono);
      letter-spacing: .14em;
      pointer-events: none;
    }
    @media (max-width: 900px) {
      .machine-three-view { height: 240px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .machine-three-view { cursor: default; }
    }
  `;
  document.head.appendChild(style);
}

installStyles();

const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches('.machine')) mountMachineScene(node);
      scan(node);
    }
  }
});

function boot() {
  scan();
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
