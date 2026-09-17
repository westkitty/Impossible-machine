import { projectMachineState } from './machine-state.js';

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
  const orientationFrame = new THREE.Group();
  const cage = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const r = ring(0.92 + i * 0.16, i % 2 ? C.bone : C.brass);
    r.rotation.set(Math.PI / 2, i * 0.42, i * 0.2);
    cage.add(r);
  }

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), mat(C.bone, 0.75, 0.22));
  cage.add(core);
  orientationFrame.add(cage);
  group.add(orientationFrame);

  const safeBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.9, 0.42),
    mat(C.iron, 0.62, 0.5)
  );
  safeBody.position.set(1.45, -0.15, -0.05);
  group.add(safeBody);

  const safeDoorPivot = new THREE.Group();
  safeDoorPivot.position.set(1.06, -0.15, 0.2);
  const safeDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.78, 0.08),
    mat(C.brass, 0.58, 0.34)
  );
  safeDoor.position.x = 0.35;
  const safeHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.018, 8, 24),
    mat(C.bone, 0.72, 0.3)
  );
  safeHandle.position.set(0.53, 0, 0.06);
  safeDoorPivot.add(safeDoor, safeHandle);
  group.add(safeDoorPivot);

  const targets = {
    orientation: 0,
    safeDoor: 0
  };

  animate.push((t) => {
    orientationFrame.rotation.z += (targets.orientation - orientationFrame.rotation.z) * 0.085;
    cage.rotation.x = Math.sin(t * 0.55) * 0.08;
    cage.rotation.y = Math.sin(t * 0.31) * 0.05;
    core.rotation.y = -t * 0.6;
    safeDoorPivot.rotation.y += (targets.safeDoor - safeDoorPivot.rotation.y) * 0.11;
  });

  return {
    applyState(projection) {
      targets.orientation = -projection.orientationRadians;
      targets.safeDoor = projection.safeOpen ? -1.22 : 0;
      safeBody.material.emissive?.setHex?.(projection.triggerAligned ? C.green : 0x000000);
      safeBody.material.emissiveIntensity = projection.triggerAligned ? 0.12 : 0;
    }
  };
}

function addChronostat(group, animate) {
  const assembly = new THREE.Group();
  const rings = [];
  for (let i = 0; i < 5; i++) {
    const r = ring(0.42 + i * 0.18, i === 2 ? C.oxide : C.brass, 0.018);
    r.rotation.set(Math.PI / 2 + i * 0.12, 0, i * 0.45);
    assembly.add(r);
    rings.push({ mesh: r, baseZ: r.rotation.z });
  }

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.55, 0.05), mat(C.bone, 0.6, 0.35));
  arm.position.y = -0.42;
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), mat(C.brass, 0.8, 0.24));
  bob.position.y = -1.16;
  const pendulum = new THREE.Group();
  pendulum.position.y = 0.68;
  pendulum.add(arm, bob);

  const echoes = [];
  for (let i = 1; i <= 2; i++) {
    const echoMaterial = mat(C.bone, 0.05, 0.7, { transparent: true, opacity: 0.06 + i * 0.025 });
    const echoArm = new THREE.Mesh(new THREE.BoxGeometry(0.032, 1.48, 0.032), echoMaterial);
    echoArm.position.y = -0.42;
    const echoBob = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 10),
      mat(C.brass, 0.05, 0.65, { transparent: true, opacity: 0.06 + i * 0.025 })
    );
    echoBob.position.y = -1.14;
    const echo = new THREE.Group();
    echo.position.y = 0.68;
    echo.add(echoArm, echoBob);
    echo.visible = false;
    echoes.push(echo);
    group.add(echo);
  }

  const plateMaterial = mat(C.dark, 0.18, 0.32, {
    emissive: C.brass,
    emissiveIntensity: 0.02
  });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.62, 0.08), plateMaterial);
  plate.position.set(0, 0.18, -0.92);

  const keyBase = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.46), mat(C.iron, 0.42, 0.62));
  keyBase.position.set(-1.26, -1.12, 0.14);
  const keyPivot = new THREE.Group();
  keyPivot.position.set(-1.26, -1.02, 0.14);
  const keyArm = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.07, 0.08), mat(C.brass, 0.7, 0.3));
  keyArm.position.x = 0.25;
  const keyCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 18), mat(C.bone, 0.3, 0.5));
  keyCap.rotation.x = Math.PI / 2;
  keyCap.position.set(0.58, 0.02, 0);
  keyPivot.add(keyArm, keyCap);

  const markers = [];
  for (let i = 0; i < 6; i++) {
    const markerMaterial = mat(C.iron, 0.3, 0.52, {
      emissive: C.brass,
      emissiveIntensity: 0.02
    });
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), markerMaterial);
    marker.position.set(-0.5 + i * 0.2, 1.34, 0.02);
    markers.push(marker);
    group.add(marker);
  }

  group.add(assembly, pendulum, plate, keyBase, keyPivot);

  const targets = {
    phaseOffset: 0,
    signalStrength: 0,
    waiting: false,
    unlocked: false,
    roundTrips: 0
  };

  animate.push((t) => {
    const steppedTime = targets.waiting ? Math.floor(t * 8) / 8 : t;
    const pendulumTime = targets.waiting ? Math.floor(t * 7) / 7 : t;
    const frequency = targets.unlocked ? 1.4 : 1.4 + targets.roundTrips * 0.045;

    assembly.rotation.y = steppedTime * 0.2 + targets.phaseOffset;
    rings.forEach(({ mesh, baseZ }, index) => {
      mesh.rotation.z = baseZ + Math.sin(steppedTime * (0.18 + index * 0.025)) * 0.035;
    });

    pendulum.rotation.z = Math.sin(pendulumTime * frequency) * 0.5;
    echoes.forEach((echo, index) => {
      const delay = (index + 1) * 0.085;
      echo.rotation.z = Math.sin((pendulumTime - delay) * frequency) * 0.5;
    });

    const keyTarget = targets.waiting ? -0.22 : 0.02;
    keyPivot.rotation.z += (keyTarget - keyPivot.rotation.z) * 0.18;

    const pulse = targets.waiting ? 0.12 + Math.abs(Math.sin(t * 6)) * 0.24 : 0;
    plateMaterial.emissiveIntensity = 0.03 + targets.signalStrength * 0.48 + pulse;
  });

  return {
    applyState(projection) {
      targets.phaseOffset = projection.phaseOffsetRadians;
      targets.signalStrength = projection.signalStrength;
      targets.waiting = projection.waitingForReply;
      targets.unlocked = projection.unlockedVerb;
      targets.roundTrips = projection.roundTrips;

      plateMaterial.emissive.setHex(projection.unlockedVerb ? C.green : C.brass);
      plateMaterial.color.setHex(projection.unlockedVerb ? 0x182118 : C.dark);

      echoes.forEach((echo, index) => {
        echo.visible = projection.roundTrips > index || projection.waitingForReply;
      });

      markers.forEach((marker, index) => {
        const active = index < projection.roundTrips;
        marker.material.color.setHex(active ? C.brass : C.iron);
        marker.material.emissive.setHex(projection.unlockedVerb ? C.green : C.brass);
        marker.material.emissiveIntensity = active ? 0.68 : 0.02;
      });
    }
  };
}

function addAtlas(group, animate) {
  const atlasFrame = new THREE.Group();
  const globeMaterial = mat(0x1d2119, 0.05, 0.85, { emissive: 0x000000, emissiveIntensity: 0 });
  const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 3), globeMaterial);
  const wireMaterial = new THREE.LineBasicMaterial({ color: C.brass, transparent: true, opacity: 0.72 });
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.99, 2)),
    wireMaterial
  );

  const topologyRings = [];
  for (let i = 0; i < 3; i++) {
    const topologyRing = ring(1.22 + i * 0.16, i === 1 ? C.bone : C.brass, 0.016);
    topologyRing.rotation.set(0.72 + i * 0.31, i * 0.38, 0.35 + i * 0.44);
    topologyRing.visible = false;
    topologyRings.push(topologyRing);
    atlasFrame.add(topologyRing);
  }

  const coastPositions = new Float32Array(48 * 3);
  const coastGeometry = new THREE.BufferGeometry();
  const coastAttribute = new THREE.BufferAttribute(coastPositions, 3);
  coastGeometry.setAttribute('position', coastAttribute);
  coastGeometry.setDrawRange(0, 0);
  const coastMaterial = new THREE.LineBasicMaterial({ color: C.brass, transparent: true, opacity: 0.82 });
  const coastLine = new THREE.Line(coastGeometry, coastMaterial);
  coastLine.visible = false;

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 8),
    mat(C.oxide, 0.2, 0.5, { emissive: C.oxide, emissiveIntensity: 0.35 })
  );

  atlasFrame.add(globe, wire, coastLine, marker);
  group.add(atlasFrame);

  const targets = {
    topologyStrength: 0,
    lockedShapeCount: 0,
    draftStrokeCount: 0,
    openedSundial: false
  };

  animate.push((t) => {
    const stability = targets.openedSundial ? 0.35 : 1;
    globe.rotation.y = t * (0.075 + targets.topologyStrength * 0.05) * stability;
    wire.rotation.y = globe.rotation.y;
    wire.rotation.z = Math.sin(t * 0.26) * targets.topologyStrength * 0.16 * stability;

    topologyRings.forEach((topologyRing, index) => {
      if (!topologyRing.visible) return;
      const direction = index % 2 === 0 ? 1 : -1;
      topologyRing.rotation.z += direction * (0.0018 + targets.topologyStrength * 0.0024) * stability;
      topologyRing.rotation.x += Math.sin(t * (0.19 + index * 0.035)) * 0.0007 * targets.topologyStrength;
    });

    const orbitRate = targets.openedSundial ? 0.18 : 0.56 + targets.draftStrokeCount * 0.035;
    marker.position.set(
      Math.cos(t * orbitRate) * 1.22,
      Math.sin(t * orbitRate * 0.73) * (0.38 + targets.topologyStrength * 0.28),
      Math.sin(t * orbitRate) * 1.22
    );

    const breathe = 1 + Math.sin(t * 0.9) * targets.topologyStrength * 0.018 * stability;
    atlasFrame.scale.setScalar(breathe);
  });

  return {
    applyState(projection) {
      targets.topologyStrength = projection.topologyStrength;
      targets.lockedShapeCount = projection.lockedShapeCount;
      targets.draftStrokeCount = projection.draftStrokeCount;
      targets.openedSundial = projection.openedSundial;

      topologyRings.forEach((topologyRing, index) => {
        topologyRing.visible = projection.lockedShapeCount > index;
        topologyRing.material.color.setHex(projection.openedSundial ? C.green : (index === 1 ? C.bone : C.brass));
      });

      const path = projection.latestLockedPath || [];
      coastGeometry.setDrawRange(0, Math.min(path.length, 48));
      coastLine.visible = path.length >= 2;
      for (let i = 0; i < Math.min(path.length, 48); i++) {
        const point = path[i];
        const longitude = (point.x - 0.5) * Math.PI * 2;
        const latitude = (0.5 - point.y) * Math.PI * 0.9;
        const radius = 1.025 + projection.topologyStrength * 0.035;
        const cosLat = Math.cos(latitude);
        coastPositions[i * 3] = radius * cosLat * Math.cos(longitude);
        coastPositions[i * 3 + 1] = radius * Math.sin(latitude);
        coastPositions[i * 3 + 2] = radius * cosLat * Math.sin(longitude);
      }
      coastAttribute.needsUpdate = true;

      const solvedColor = projection.openedSundial ? C.green : C.brass;
      coastMaterial.color.setHex(solvedColor);
      coastMaterial.opacity = projection.openedSundial ? 1 : 0.82;
      wireMaterial.color.setHex(solvedColor);
      wireMaterial.opacity = projection.openedSundial ? 0.92 : 0.72;
      globeMaterial.emissive.setHex(projection.openedSundial ? C.green : 0x000000);
      globeMaterial.emissiveIntensity = projection.openedSundial ? 0.08 : 0;
      marker.material.emissive.setHex(projection.openedSundial ? C.green : C.oxide);
      marker.material.emissiveIntensity = projection.openedSundial ? 0.55 : 0.35;
    }
  };
}

function addArchive(group, animate) {
  const cabinet = new THREE.Group();
  const cabinetMaterial = mat(C.iron, 0.34, 0.72, { emissive: 0x000000, emissiveIntensity: 0 });
  const cabinetBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.05, 0.72), cabinetMaterial);
  cabinet.add(cabinetBody);

  const unsolvedPositions = [
    [-0.72, 0.52],
    [0.04, 0.7],
    [0.73, 0.43],
    [-0.58, -0.34],
    [0.16, -0.55],
    [0.71, -0.26]
  ];
  const solvedPositions = [
    [-0.7, 0.48],
    [0, 0.48],
    [0.7, 0.48],
    [-0.7, -0.28],
    [0, -0.28],
    [0.7, -0.28]
  ];

  const drawers = [];
  const progressPins = [];
  for (let i = 0; i < 6; i++) {
    const drawerGroup = new THREE.Group();
    const [x, y] = unsolvedPositions[i];
    drawerGroup.position.set(x, y, 0.38);

    const drawerMaterial = mat(0x25281f, 0.32, 0.68, {
      emissive: C.brass,
      emissiveIntensity: 0.01
    });
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, 0.2), drawerMaterial);
    const labelPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.12, 0.025),
      mat(C.brass, 0.62, 0.32, { emissive: C.brass, emissiveIntensity: 0.01 })
    );
    labelPlate.position.z = 0.115;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.05), mat(C.bone, 0.52, 0.42));
    handle.position.set(0, -0.1, 0.13);
    drawerGroup.add(drawer, labelPlate, handle);
    cabinet.add(drawerGroup);
    drawers.push({ group: drawerGroup, drawer, labelPlate, base: unsolvedPositions[i], solved: solvedPositions[i] });

    const pinMaterial = mat(C.iron, 0.28, 0.6, { emissive: C.brass, emissiveIntensity: 0.01 });
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), pinMaterial);
    pin.position.set(-0.48 + i * 0.19, 1.18, 0.12);
    cabinet.add(pin);
    progressPins.push(pin);
  }

  const alignmentRailMaterial = mat(C.brass, 0.58, 0.36, {
    emissive: C.green,
    emissiveIntensity: 0
  });
  const alignmentRail = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.045, 0.055), alignmentRailMaterial);
  alignmentRail.position.set(0, -0.98, 0.39);
  cabinet.add(alignmentRail);

  group.add(cabinet);

  const targets = {
    revealedCount: 0,
    completion: 0,
    allRevealed: false,
    solved: false
  };

  animate.push((t) => {
    const drift = targets.solved ? 0 : Math.sin(t * 0.22) * (0.045 + targets.completion * 0.035);
    cabinet.rotation.y += (drift - cabinet.rotation.y) * 0.04;

    drawers.forEach((entry, index) => {
      const destination = targets.solved ? entry.solved : entry.base;
      entry.group.position.x += (destination[0] - entry.group.position.x) * 0.08;
      entry.group.position.y += (destination[1] - entry.group.position.y) * 0.08;

      const revealed = index < targets.revealedCount;
      const targetZ = targets.solved ? 0.38 : revealed ? 0.62 + index * 0.012 : 0.38;
      entry.group.position.z += (targetZ - entry.group.position.z) * 0.11;

      if (!targets.solved && revealed) {
        entry.group.rotation.z = Math.sin(t * (0.31 + index * 0.025) + index) * 0.018;
      } else {
        entry.group.rotation.z += (0 - entry.group.rotation.z) * 0.1;
      }
    });

    const railPulse = targets.allRevealed && !targets.solved ? 0.08 + Math.abs(Math.sin(t * 1.1)) * 0.1 : 0;
    alignmentRailMaterial.emissiveIntensity = targets.solved ? 0.5 : railPulse;
  });

  return {
    applyState(projection) {
      targets.revealedCount = projection.revealedCount;
      targets.completion = projection.completion;
      targets.allRevealed = projection.allRevealed;
      targets.solved = projection.solved;

      cabinetMaterial.emissive.setHex(projection.solved ? C.green : 0x000000);
      cabinetMaterial.emissiveIntensity = projection.solved ? 0.055 : 0;
      alignmentRailMaterial.color.setHex(projection.solved ? C.green : C.brass);
      alignmentRailMaterial.emissive.setHex(projection.solved ? C.green : C.brass);

      drawers.forEach((entry, index) => {
        const revealed = index < projection.revealedCount;
        entry.drawer.material.color.setHex(revealed ? 0x303329 : 0x22251e);
        entry.drawer.material.emissive.setHex(projection.solved ? C.green : C.brass);
        entry.drawer.material.emissiveIntensity = revealed ? (projection.solved ? 0.14 : 0.06) : 0.01;
        entry.labelPlate.material.color.setHex(revealed ? (projection.solved ? C.green : C.brass) : C.iron);
        entry.labelPlate.material.emissive.setHex(projection.solved ? C.green : C.brass);
        entry.labelPlate.material.emissiveIntensity = revealed ? (projection.solved ? 0.6 : 0.16) : 0.01;
      });

      progressPins.forEach((pin, index) => {
        const active = index < projection.revealedCount;
        pin.material.color.setHex(active ? (projection.solved ? C.green : C.brass) : C.iron);
        pin.material.emissive.setHex(projection.solved ? C.green : C.brass);
        pin.material.emissiveIntensity = active ? 0.58 : 0.01;
      });
    }
  };
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
  const controller = builders[id](group, animators) || null;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0.2, 4.8);

  return {
    scene,
    camera,
    animators,
    controller,
    projectionKey: null,
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

function applyCanonicalProjection(active = runtime.active) {
  if (!active?.controller?.applyState) return;
  const store = window.__impossibleStore;
  if (!store?.get) return;

  const projection = projectMachineState(active.entry.id, store.get());
  const key = JSON.stringify(projection);
  if (key === active.projectionKey) return;
  active.projectionKey = key;
  active.controller.applyState(projection);
  active.entry.host.dataset.machinePhase = projection.phase || 'idle';
  if (projection.orientationIndex != null) {
    active.entry.host.dataset.orientationIndex = String(projection.orientationIndex);
  }
  if (projection.safeOpen != null) {
    active.entry.host.dataset.safeOpen = projection.safeOpen ? 'true' : 'false';
  }
  if (projection.roundTrips != null) {
    active.entry.host.dataset.roundTrips = String(projection.roundTrips);
  }
  if (projection.shift != null) {
    active.entry.host.dataset.temporalShift = String(projection.shift);
  }
  if (projection.waitingForReply != null) {
    active.entry.host.dataset.waitingForReply = projection.waitingForReply ? 'true' : 'false';
  }
  if (projection.unlockedVerb != null) {
    active.entry.host.dataset.verbotenUnlocked = projection.unlockedVerb ? 'true' : 'false';
  }
  if (projection.strokeCount != null) {
    active.entry.host.dataset.strokeCount = String(projection.strokeCount);
  }
  if (projection.lockedShapeCount != null) {
    active.entry.host.dataset.lockedShapes = String(projection.lockedShapeCount);
  }
  if (projection.openedSundial != null) {
    active.entry.host.dataset.sundialOpened = projection.openedSundial ? 'true' : 'false';
  }
  if (projection.revealedCount != null) {
    active.entry.host.dataset.revealedCount = String(projection.revealedCount);
  }
  if (projection.solved != null && active.entry.id === 'archive') {
    active.entry.host.dataset.archiveSolved = projection.solved ? 'true' : 'false';
  }
}

function renderFrame(time = 0) {
  const active = runtime.active;
  if (!active || !runtime.renderer || runtime.contextLost) return;
  if (!active.entry.root.isConnected) {
    deactivateActive();
    return;
  }
  if (document.hidden) return;

  applyCanonicalProjection(active);

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
  applyCanonicalProjection(runtime.active);
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
          if (node instanceof window.Element) scan(node);
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
    projectedPhase: runtime.active?.entry?.host?.dataset?.machinePhase || null,
    unavailableReason: runtime.unavailableReason
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}