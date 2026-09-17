const THREE_MODULE_URL = new URL('./vendor/three.module.js', import.meta.url).href;
const MACHINE_IDS = ['deimos', 'chronostat', 'atlas', 'archive', 'oracle', 'verboten', 'sundial'];
const mounted = new WeakMap();
const entries = new Set();

const C = {
  brass: 0xc8a25a,
  bone: 0xd8d4c5,
  oxide: 0xb14a3a,
  green: 0x6a8a4f,
  dark: 0x15170f,
  iron: 0x34372d
};

const runtime = {
  THREE: null,
  renderer: null,
  canvas: null,
  active: null,
  observer: null,
  started: false,
  contextLost: false,
  unavailableReason: null,
  onContextLost: null,
  onContextRestored: null,
  onPageHide: null
};

let THREE = null;

const mat = (color, metalness = 0.45, roughness = 0.5, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });

const ring = (radius, color = C.brass, tube = 0.025) =>
  new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 64), mat(color, 0.72, 0.3));

function idFor(root) {
  return MACHINE_IDS.find((id) => root.classList.contains(`machine-${id}`)) || null;
}

function addDeimos(group, animate) {
  const cage = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const r = ring(0.92 + i * 0.16, i % 2 ? C.bone : C.brass);
    r.rotation.set(Math.PI / 2, i * 0.42, i * 0.2);
    cage.add(r);
  }
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), mat(C.bone, 0.75, 0.22));
  cage.add(core);
  group.add(cage);
  animate.push((t) => {
    cage.rotation.x = t * 0.12;
    cage.rotation.z = Math.sin(t * 0.38) * 0.4;
    core.rotation.y = -t * 0.6;
  });
}

function addChronostat(group, animate) {
  const assembly = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const r = ring(0.42 + i * 0.18, i === 2 ? C.oxide : C.brass, 0.018);
    r.rotation.set(Math.PI / 2 + i * 0.12, 0, i * 0.45);
    assembly.add(r);
  }
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.55, 0.05), mat(C.bone, 0.6, 0.35));
  arm.position.y = -0.42;
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), mat(C.brass, 0.8, 0.24));
  bob.position.y = -1.16;
  const pendulum = new THREE.Group();
  pendulum.position.y = 0.68;
  pendulum.add(arm, bob);
  group.add(assembly, pendulum);
  animate.push((t) => {
    assembly.rotation.y = t * 0.2;
    pendulum.rotation.z = Math.sin(t * 1.4) * 0.5;
  });
}

function addAtlas(group, animate) {
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 3), mat(0x1d2119, 0.05, 0.85));
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.99, 2)),
    new THREE.LineBasicMaterial({ color: C.brass, transparent: true, opacity: 0.72 })
  );
  const orbit = ring(1.35, C.bone, 0.018);
  orbit.rotation.x = 1.05;
  orbit.rotation.z = 0.4;
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 8),
    mat(C.oxide, 0.2, 0.5, { emissive: C.oxide, emissiveIntensity: 0.35 })
  );
  group.add(globe, wire, orbit, marker);
  animate.push((t) => {
    globe.rotation.y = wire.rotation.y = t * 0.1;
    orbit.rotation.z = 0.4 + t * 0.12;
    marker.position.set(Math.cos(t * 0.6) * 1.22, Math.sin(t * 0.45) * 0.62, Math.sin(t * 0.6) * 1.22);
  });
}

function addArchive(group, animate) {
  const cabinet = new THREE.Group();
  cabinet.add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.15, 0.72), mat(C.iron, 0.3, 0.78)));
  const drawers = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 3; x++) {
      const drawer = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.36, 0.12),
        mat(y === 1 && x === 2 ? C.oxide : 0x25281f, 0.28, 0.72)
      );
      drawer.position.set((x - 1) * 0.65, 0.72 - y * 0.47, 0.41);
      cabinet.add(drawer);
      drawers.push(drawer);
    }
  }
  group.add(cabinet);
  animate.push((t) => {
    cabinet.rotation.y = Math.sin(t * 0.22) * 0.13;
    drawers[5].position.z = 0.41 + (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.35;
  });
}

function addOracle(group, animate) {
  const balance = new THREE.Group();
  balance.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.1, 12), mat(C.brass, 0.75, 0.3)));
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.07, 0.07), mat(C.bone, 0.55, 0.38));
  beam.position.y = 0.68;
  balance.add(beam);
  for (const side of [-1, 1]) {
    const pan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.3, 0.11, 28),
      mat(side < 0 ? C.green : C.oxide, 0.25, 0.65)
    );
    pan.position.set(side * 1.0, -0.2, 0);
    balance.add(pan);
  }
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 18, 12),
    mat(C.dark, 0.2, 0.35, { emissive: C.brass, emissiveIntensity: 0.16 })
  );
  eye.position.y = 1.18;
  balance.add(eye);
  group.add(balance);
  animate.push((t) => {
    balance.rotation.z = Math.sin(t * 0.55) * 0.07;
    eye.scale.y = 0.65 + Math.abs(Math.sin(t * 0.42)) * 0.42;
  });
}

function addVerboten(group, animate) {
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.68, 0.68, 2.3, 36, 1, true),
    mat(C.bone, 0.05, 0.2, { transparent: true, opacity: 0.16, side: THREE.DoubleSide })
  );
  const top = ring(0.68, C.brass, 0.05);
  const bottom = ring(0.68, C.brass, 0.05);
  top.rotation.x = bottom.rotation.x = Math.PI / 2;
  top.position.y = 1.15;
  bottom.position.y = -1.15;
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.36, 0.075, 80, 10),
    mat(C.oxide, 0.58, 0.3, { emissive: C.oxide, emissiveIntensity: 0.13 })
  );
  group.add(shell, top, bottom, knot);
  animate.push((t) => {
    knot.rotation.x = t * 0.46;
    knot.rotation.y = -t * 0.35;
    top.rotation.z = t * 0.08;
    bottom.rotation.z = -t * 0.08;
  });
}

function addSundial(group, animate) {
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.14, 48), mat(0x303329, 0.24, 0.82));
  disc.rotation.x = Math.PI / 2;
  const rim = ring(1.2, C.brass, 0.04);
  const gnomon = new THREE.Mesh(new THREE.ConeGeometry(0.13, 1.5, 4), mat(C.bone, 0.6, 0.3));
  gnomon.position.y = 0.68;
  gnomon.rotation.z = -0.38;
  const shadow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.018, 0.035), mat(C.oxide, 0.15, 0.8));
  shadow.position.x = 0.65;
  shadow.position.y = 0.09;
  group.add(disc, rim, gnomon, shadow);
  animate.push((t) => {
    shadow.rotation.y = t * 0.16;
    rim.rotation.z = Math.sin(t * 0.2) * 0.08;
  });
}

const builders = {
  deimos: addDeimos,
  chronostat: addChronostat,
  atlas: addAtlas,
  archive: addArchive,
  oracle: addOracle,
  verboten: addVerboten,
  sundial: addSundial
};

function disposeObject(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose?.();
    if (Array.isArray(obj.material)) obj.material.forEach((material) => material.dispose?.());
    else obj.material?.dispose?.();
  });
}

function injectStyles() {
  if (document.getElementById('three-machine-styles')) return;
  const style = document.createElement('style');
  style.id = 'three-machine-styles';
  style.textContent = `
    .machine-three-view{position:relative;width:100%;height:clamp(220px,34vh,340px);margin:8px 0 18px;overflow:hidden;border:1px solid var(--rule);background:radial-gradient(circle at 50% 45%,rgba(200,162,90,.08),transparent 48%),#11130f;isolation:isolate}
    .machine-three-view:after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 70px rgba(0,0,0,.68);z-index:2}
    .machine-three-canvas{display:block;width:100%;height:100%;touch-action:pan-y}
    .machine-three-badge{position:absolute;z-index:3;top:9px;left:10px;padding:4px 7px;border:1px solid rgba(200,162,90,.4);background:rgba(17,19,15,.8);color:var(--accent);font:9px/1.1 var(--mono);letter-spacing:.14em;pointer-events:none}
    .machine-three-status{position:absolute;z-index:4;inset:auto 14px 14px 14px;padding:8px 10px;border:1px solid rgba(200,162,90,.26);background:rgba(17,19,15,.9);color:var(--ink-soft);font:10px/1.35 var(--mono);letter-spacing:.08em;text-transform:uppercase}
    .machine-three-view[data-three-status="ready"] .machine-three-status{display:none}
    .machine-three-view[data-three-status="context-lost"] .machine-three-status{color:var(--accent)}
    @media(max-width:900px){.machine-three-view{height:240px}}
  `;
  document.head.appendChild(style);
}

function setStatus(entry, status, message) {
  entry.host.dataset.threeStatus = status;
  const statusEl = entry.host.querySelector('.machine-three-status');
  if (statusEl && message) statusEl.textContent = message;
}

function createHost(root, id) {
  const host = document.createElement('section');
  host.className = 'machine-three-view';
  host.dataset.threeStatus = 'loading';
  host.setAttribute('aria-label', `${id} three-dimensional instrument view`);
  host.innerHTML = [
    '<div class="machine-three-badge">3D INSTRUMENT VIEW</div>',
    '<div class="machine-three-status" role="status">INITIALIZING LOCAL 3D INSTRUMENT…</div>'
  ].join('');

  const title = root.querySelector('h2');
  if (title?.nextSibling) root.insertBefore(host, title.nextSibling);
  else root.prepend(host);

  const entry = { root, id, host };
  mounted.set(root, entry);
  entries.add(entry);
  return entry;
}

function getOrCreateEntry(root) {
  const existing = mounted.get(root);
  if (existing) return existing;
  const id = idFor(root);
  if (!id) return null;
  return createHost(root, id);
}

function ensureCanvas() {
  if (runtime.canvas) return runtime.canvas;
  const canvas = document.createElement('canvas');
  canvas.className = 'machine-three-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  runtime.onContextLost = (event) => {
    event.preventDefault();
    runtime.contextLost = true;
    runtime.renderer?.setAnimationLoop?.(null);
    if (runtime.active) {
      setStatus(runtime.active.entry, 'context-lost', '3D SIGNAL LOST — RESTORING CONTEXT…');
    }
  };

  runtime.onContextRestored = () => {
    runtime.contextLost = false;
    if (runtime.active && runtime.renderer) {
      setStatus(runtime.active.entry, 'ready', '3D INSTRUMENT ONLINE');
      runtime.renderer.setAnimationLoop(renderFrame);
    }
  };

  canvas.addEventListener('webglcontextlost', runtime.onContextLost, false);
  canvas.addEventListener('webglcontextrestored', runtime.onContextRestored, false);
  runtime.canvas = canvas;
  return canvas;
}

function ensureRenderer() {
  if (runtime.renderer) return runtime.renderer;
  if (!THREE) throw new Error('Three.js module not loaded');
  if (!window.WebGLRenderingContext && !window.WebGL2RenderingContext) {
    throw new Error('WebGL is not available in this browser');
  }

  const canvas = ensureCanvas();
  const attrs = { alpha: true, antialias: true, powerPreference: 'high-performance' };
  const context = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs);
  if (!context) throw new Error('Unable to create a WebGL context');

  const renderer = new THREE.WebGLRenderer({ canvas, context, ...attrs });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  runtime.renderer = renderer;
  return renderer;
}

function createScene(id) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C.dark, 0.09);
  scene.add(new THREE.HemisphereLight(C.bone, 0x171913, 1.25));

  const key = new THREE.DirectionalLight(C.brass, 2.2);
  key.position.set(3, 4, 4);
  scene.add(key);

  const fill = new THREE.PointLight(C.green, 5, 8, 2);
  fill.position.set(-2.5, 1.1, -1.6);
  scene.add(fill);

  const grid = new THREE.GridHelper(8, 16, 0x514d3e, 0x2f3029);
  grid.position.y = -1.45;
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  scene.add(grid);

  const group = new THREE.Group();
  scene.add(group);
  const animators = [];
  builders[id](group, animators);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0.2, 4.8);

  return {
    scene,
    camera,
    animators,
    pointer: new THREE.Vector2(),
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)') || { matches: false }
  };
}

function resizeActive() {
  if (!runtime.active || !runtime.renderer) return;
  const { entry, camera } = runtime.active;
  const rect = entry.host.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  runtime.renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function renderFrame(time = 0) {
  const active = runtime.active;
  if (!active || !runtime.renderer || runtime.contextLost) return;
  if (!active.entry.root.isConnected) {
    deactivateActive();
    return;
  }
  if (document.hidden) return;

  const speed = active.reducedMotion.matches ? 0.12 : 1;
  const t = (time / 1000) * speed;
  active.animators.forEach((animate) => animate(t));
  active.camera.position.x += (active.pointer.x * 0.38 - active.camera.position.x) * 0.035;
  active.camera.position.y += (0.2 + active.pointer.y * 0.2 - active.camera.position.y) * 0.035;
  active.camera.lookAt(0, -0.04, 0);
  runtime.renderer.render(active.scene, active.camera);
}

function deactivateActive() {
  const active = runtime.active;
  if (!active) return;
  runtime.renderer?.setAnimationLoop?.(null);
  active.resizeObserver?.disconnect?.();
  if (active.onWindowResize) window.removeEventListener('resize', active.onWindowResize);
  active.entry.host.removeEventListener('pointermove', active.onMove);
  active.entry.host.removeEventListener('pointerleave', active.onLeave);
  disposeObject(active.scene);
  runtime.canvas?.remove();
  runtime.active = null;
}

function activate(entry) {
  if (!entry?.root?.isConnected) return;
  if (runtime.active?.entry === entry && runtime.renderer) return;
  if (runtime.unavailableReason) {
    setStatus(entry, 'unavailable', '3D VIEW UNAVAILABLE — INSTRUMENT CONTROLS REMAIN ACTIVE');
    return;
  }
  if (!THREE) {
    setStatus(entry, 'loading', 'INITIALIZING LOCAL 3D INSTRUMENT…');
    return;
  }

  deactivateActive();

  let renderer;
  try {
    renderer = ensureRenderer();
  } catch (error) {
    runtime.unavailableReason = error instanceof Error ? error.message : String(error);
    setStatus(entry, 'unavailable', '3D VIEW UNAVAILABLE — INSTRUMENT CONTROLS REMAIN ACTIVE');
    return;
  }

  const canvas = ensureCanvas();
  const statusEl = entry.host.querySelector('.machine-three-status');
  entry.host.insertBefore(canvas, statusEl || null);

  let sceneState;
  try {
    sceneState = createScene(entry.id);
  } catch (error) {
    runtime.unavailableReason = error instanceof Error ? error.message : String(error);
    canvas.remove();
    setStatus(entry, 'unavailable', '3D VIEW UNAVAILABLE — INSTRUMENT CONTROLS REMAIN ACTIVE');
    return;
  }

  const onMove = (event) => {
    const rect = entry.host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    sceneState.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    sceneState.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };
  const onLeave = () => sceneState.pointer.set(0, 0);
  entry.host.addEventListener('pointermove', onMove, { passive: true });
  entry.host.addEventListener('pointerleave', onLeave, { passive: true });

  let resizeObserver = null;
  let onWindowResize = null;
  if (window.ResizeObserver) {
    resizeObserver = new window.ResizeObserver(resizeActive);
    resizeObserver.observe(entry.host);
  } else {
    onWindowResize = resizeActive;
    window.addEventListener('resize', onWindowResize, { passive: true });
  }

  runtime.active = {
    entry,
    ...sceneState,
    onMove,
    onLeave,
    resizeObserver,
    onWindowResize
  };

  resizeActive();
  setStatus(entry, 'ready', '3D INSTRUMENT ONLINE');
  renderer.setAnimationLoop(renderFrame);
}

function pruneEntries() {
  for (const entry of entries) {
    if (!entry.root.isConnected) entries.delete(entry);
  }
}

function scan(scope = document) {
  if (scope.matches?.('.machine')) {
    const entry = getOrCreateEntry(scope);
    if (entry && THREE) activate(entry);
  }
  scope.querySelectorAll?.('.machine').forEach((root) => {
    const entry = getOrCreateEntry(root);
    if (entry && THREE) activate(entry);
  });
  pruneEntries();
}

function markUnavailable() {
  pruneEntries();
  for (const entry of entries) {
    setStatus(entry, 'unavailable', '3D VIEW UNAVAILABLE — INSTRUMENT CONTROLS REMAIN ACTIVE');
  }
}

async function loadThree() {
  try {
    runtime.THREE = await import(THREE_MODULE_URL);
    THREE = runtime.THREE;
    runtime.unavailableReason = null;
    scan();
  } catch (error) {
    runtime.unavailableReason = error instanceof Error ? error.message : String(error);
    markUnavailable();
  }
}

function shutdown() {
  runtime.observer?.disconnect?.();
  runtime.observer = null;
  deactivateActive();
  if (runtime.renderer) {
    runtime.renderer.dispose();
    runtime.renderer.forceContextLoss?.();
    runtime.renderer = null;
  }
  if (runtime.canvas) {
    if (runtime.onContextLost) runtime.canvas.removeEventListener('webglcontextlost', runtime.onContextLost);
    if (runtime.onContextRestored) runtime.canvas.removeEventListener('webglcontextrestored', runtime.onContextRestored);
    runtime.canvas.remove();
    runtime.canvas = null;
  }
  entries.clear();
}

function boot() {
  if (runtime.started) return;
  runtime.started = true;
  injectStyles();
  scan();

  if (window.MutationObserver) {
    runtime.observer = new window.MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) scan(node);
        }
      }
    });
    runtime.observer.observe(document.body, { childList: true, subtree: true });
  }

  runtime.onPageHide = shutdown;
  window.addEventListener('pagehide', runtime.onPageHide, { once: true });
  void loadThree();
}

export function startMachineThreeEnhancement() {
  boot();
}

export function getThreeRuntimeStatus() {
  pruneEntries();
  return {
    started: runtime.started,
    moduleLoaded: !!runtime.THREE,
    rendererCreated: !!runtime.renderer,
    activeMachine: runtime.active?.entry?.id || null,
    mountedViews: entries.size,
    contextLost: runtime.contextLost,
    unavailableReason: runtime.unavailableReason
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
