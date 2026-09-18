import { projectMachineState } from './machine-state.js';
import { INSPECTION_LIMITS, normalizeInspectionState, inspectionCommandForKey, applyInspectionDelta, interpolateInspectionState } from './inspection.js';
import { selectQualityTier, pixelRatioForTier, targetFrameMsForTier, parallaxScaleForTier, composePauseReasons } from './runtime-policy.js';

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
  onPageHide: null,
  qualityTier: 'STANDARD',
  pixelRatio: 1,
  viewportVisible: true,
  frameMsEma: null,
  framesRendered: 0,
  lastFrameTime: null,
  lastRenderedAt: null
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

  const targets = { orientation: 0, safeDoor: 0 };

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

  const plateMaterial = mat(C.dark, 0.18, 0.32, { emissive: C.brass, emissiveIntensity: 0.02 });
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
    const markerMaterial = mat(C.iron, 0.3, 0.52, { emissive: C.brass, emissiveIntensity: 0.02 });
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), markerMaterial);
    marker.position.set(-0.5 + i * 0.2, 1.34, 0.02);
    markers.push(marker);
    group.add(marker);
  }

  group.add(assembly, pendulum, plate, keyBase, keyPivot);
  const targets = { phaseOffset: 0, signalStrength: 0, waiting: false, unlocked: false, roundTrips: 0 };

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
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.99, 2)), wireMaterial);

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
  const targets = { topologyStrength: 0, lockedShapeCount: 0, draftStrokeCount: 0, openedSundial: false };

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
  const unsolvedPositions = [[-0.72,0.52],[0.04,0.7],[0.73,0.43],[-0.58,-0.34],[0.16,-0.55],[0.71,-0.26]];
  const solvedPositions = [[-0.7,0.48],[0,0.48],[0.7,0.48],[-0.7,-0.28],[0,-0.28],[0.7,-0.28]];
  const drawers = [];
  const progressPins = [];

  for (let i = 0; i < 6; i++) {
    const drawerGroup = new THREE.Group();
    const [x, y] = unsolvedPositions[i];
    drawerGroup.position.set(x, y, 0.38);
    const drawerMaterial = mat(0x25281f, 0.32, 0.68, { emissive: C.brass, emissiveIntensity: 0.01 });
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

  const alignmentRailMaterial = mat(C.brass, 0.58, 0.36, { emissive: C.green, emissiveIntensity: 0 });
  const alignmentRail = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.045, 0.055), alignmentRailMaterial);
  alignmentRail.position.set(0, -0.98, 0.39);
  cabinet.add(alignmentRail);
  group.add(cabinet);
  const targets = { revealedCount: 0, completion: 0, allRevealed: false, solved: false };

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
      if (!targets.solved && revealed) entry.group.rotation.z = Math.sin(t * (0.31 + index * 0.025) + index) * 0.018;
      else entry.group.rotation.z += (0 - entry.group.rotation.z) * 0.1;
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
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 2.05, 18), mat(C.brass, 0.72, 0.32));
  pedestal.position.y = -0.22;
  const beamPivot = new THREE.Group();
  beamPivot.position.y = 0.72;
  const beamMaterial = mat(C.bone, 0.55, 0.38, { emissive: C.green, emissiveIntensity: 0 });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.07, 0.07), beamMaterial);
  beamPivot.add(beam);

  const pans = [];
  for (const side of [-1, 1]) {
    const panGroup = new THREE.Group();
    panGroup.position.x = side * 1.0;
    const chain = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.65, 0.025), mat(C.bone, 0.35, 0.5));
    chain.position.y = -0.34;
    const pan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.3, 0.11, 28),
      mat(side < 0 ? C.green : C.oxide, 0.25, 0.65, { emissive: 0x000000, emissiveIntensity: 0 })
    );
    pan.position.y = -0.72;
    panGroup.add(chain, pan);
    beamPivot.add(panGroup);
    pans.push({ group: panGroup, pan });
  }

  const apertureMaterial = mat(C.dark, 0.2, 0.35, { emissive: C.brass, emissiveIntensity: 0.16 });
  const aperture = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), apertureMaterial);
  aperture.position.y = 1.2;
  const inverseHalo = ring(0.34, C.oxide, 0.018);
  inverseHalo.position.y = 1.2;
  inverseHalo.visible = false;

  const tokenMarkers = [];
  for (let i = 0; i < 9; i++) {
    const tokenMaterial = mat(C.brass, 0.38, 0.5, { emissive: C.brass, emissiveIntensity: 0.03 });
    const marker = new THREE.Mesh(
      i % 3 === 0 ? new THREE.OctahedronGeometry(0.075, 0)
        : i % 3 === 1 ? new THREE.BoxGeometry(0.11, 0.11, 0.11)
          : new THREE.SphereGeometry(0.07, 12, 8),
      tokenMaterial
    );
    marker.visible = false;
    marker.position.set(0.78 + (i % 3) * 0.18, 0.1 + Math.floor(i / 3) * 0.12, -0.1 + (i % 2) * 0.18);
    group.add(marker);
    tokenMarkers.push(marker);
  }

  const zeroMarkers = [];
  for (let i = 0; i < 3; i++) {
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(0.1 + i * 0.025, 0.012, 8, 24),
      mat(C.bone, 0.18, 0.5, { emissive: C.green, emissiveIntensity: 0.02, transparent: true, opacity: 0.5 })
    );
    marker.rotation.x = Math.PI / 2;
    marker.visible = false;
    marker.position.set(-1.0 + i * 0.18, -0.04 + i * 0.09, 0.18);
    group.add(marker);
    zeroMarkers.push(marker);
  }
  group.add(pedestal, beamPivot, aperture, inverseHalo);
  const targets = { balanceSignal: 0, placedCount: 0, readings: [], zeroReadingCount: 0, negativeReadingCount: 0, inverseObserved: false, ruleLearned: false, openedDirector: false };

  animate.push((t) => {
    const targetTilt = targets.openedDirector ? 0 : targets.balanceSignal * 0.34;
    beamPivot.rotation.z += (targetTilt - beamPivot.rotation.z) * 0.075;
    const unsettled = targets.inverseObserved && !targets.openedDirector;
    pans[0].group.rotation.z = unsettled ? Math.sin(t * 0.8) * 0.035 : 0;
    pans[1].group.rotation.z = unsettled ? -Math.sin(t * 0.8) * 0.035 : 0;
    tokenMarkers.forEach((marker, index) => {
      if (!marker.visible) return;
      const entry = targets.readings[index];
      const normalized = entry?.normalized || 0;
      const zeroFloat = entry?.polarity === 'zero' ? 0.16 + Math.sin(t * 1.2 + index) * 0.035 : 0;
      const targetY = 0.04 - normalized * 0.48 + zeroFloat;
      marker.position.y += (targetY - marker.position.y) * 0.11;
      marker.rotation.y += 0.006 + Math.abs(normalized) * 0.014;
      marker.rotation.x += entry?.polarity === 'negative' ? 0.011 : 0.003;
    });
    zeroMarkers.forEach((marker, index) => {
      if (!marker.visible) return;
      marker.rotation.z = t * (0.3 + index * 0.08);
      marker.position.y += Math.sin(t * (0.7 + index * 0.1) + index) * 0.0015;
    });
    inverseHalo.rotation.z = t * (targets.ruleLearned ? 0.18 : 0.48);
    const apertureTargetScale = targets.ruleLearned ? 1.28 : 0.72 + Math.abs(Math.sin(t * 0.42)) * 0.35;
    aperture.scale.y += (apertureTargetScale - aperture.scale.y) * 0.06;
  });

  return {
    applyState(projection) {
      targets.balanceSignal = projection.balanceSignal;
      targets.placedCount = projection.placedCount;
      targets.readings = projection.readingEntries;
      targets.zeroReadingCount = projection.zeroReadingCount;
      targets.negativeReadingCount = projection.negativeReadingCount;
      targets.inverseObserved = projection.inverseObserved;
      targets.ruleLearned = projection.ruleLearned;
      targets.openedDirector = projection.openedDirector;
      inverseHalo.visible = projection.inverseObserved;
      inverseHalo.material.color.setHex(projection.ruleLearned ? C.green : C.oxide);
      apertureMaterial.emissive.setHex(projection.openedDirector ? C.green : projection.ruleLearned ? C.green : C.brass);
      apertureMaterial.emissiveIntensity = projection.openedDirector ? 0.62 : projection.ruleLearned ? 0.38 : 0.16;
      beamMaterial.emissive.setHex(C.green);
      beamMaterial.emissiveIntensity = projection.openedDirector ? 0.12 : 0;
      pans.forEach(({ pan }) => {
        pan.material.emissive.setHex(projection.openedDirector ? C.green : 0x000000);
        pan.material.emissiveIntensity = projection.openedDirector ? 0.08 : 0;
      });
      tokenMarkers.forEach((marker, index) => {
        const entry = projection.readingEntries[index];
        marker.visible = !!entry;
        if (!entry) return;
        const color = entry.polarity === 'negative' ? C.oxide : entry.polarity === 'zero' ? (projection.ruleLearned ? C.green : C.bone) : C.brass;
        marker.material.color.setHex(color);
        marker.material.emissive.setHex(color);
        marker.material.emissiveIntensity = entry.polarity === 'zero' ? 0.3 : 0.08;
      });
      zeroMarkers.forEach((marker, index) => {
        marker.visible = index < projection.zeroReadingCount;
        marker.material.emissiveIntensity = projection.ruleLearned ? 0.42 : 0.08;
      });
    }
  };
}

function addVerboten(group, animate) {
  const machine = new THREE.Group();
  const shellMaterial = mat(C.bone, 0.05, 0.2, { transparent: true, opacity: 0.16, side: THREE.DoubleSide, emissive: 0x000000, emissiveIntensity: 0 });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 2.3, 36, 1, true), shellMaterial);
  const top = ring(0.68, C.brass, 0.05);
  const bottom = ring(0.68, C.brass, 0.05);
  top.rotation.x = bottom.rotation.x = Math.PI / 2;
  top.position.y = 1.15;
  bottom.position.y = -1.15;

  const knotMaterial = mat(C.oxide, 0.58, 0.3, { emissive: C.oxide, emissiveIntensity: 0.13 });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.36, 0.075, 80, 10), knotMaterial);

  const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.26, 24), mat(C.iron, 0.48, 0.5));
  spool.rotation.z = Math.PI / 2;
  spool.position.set(-1.05, 0.72, 0);

  const tapeMaterial = mat(C.bone, 0.02, 0.92, { emissive: C.brass, emissiveIntensity: 0.01 });
  const tape = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.07, 0.025), tapeMaterial);
  tape.position.set(-0.35, 0.72, 0.05);

  const furnaceMaterial = mat(0x23140f, 0.2, 0.8, { emissive: C.oxide, emissiveIntensity: 0.08 });
  const furnace = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.48), furnaceMaterial);
  furnace.position.set(1.15, -0.58, 0);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.05), mat(C.dark, 0.1, 0.9, { emissive: C.oxide, emissiveIntensity: 0.18 }));
  mouth.position.set(1.15, -0.56, 0.265);

  const coils = [];
  for (let i = 0; i < 6; i++) {
    const coil = ring(0.82 + i * 0.045, i % 2 ? C.bone : C.brass, 0.014);
    coil.rotation.set(Math.PI / 2, 0.15 + i * 0.13, i * 0.24);
    coils.push(coil);
    machine.add(coil);
  }

  const printMarkers = [];
  for (let i = 0; i < 12; i++) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.035, 0.035),
      mat(C.iron, 0.25, 0.62, { emissive: C.brass, emissiveIntensity: 0.01 })
    );
    marker.position.set(-0.66 + (i % 6) * 0.265, 1.36 - Math.floor(i / 6) * 0.14, 0.04);
    machine.add(marker);
    printMarkers.push(marker);
  }

  const captureMarkers = [];
  for (let i = 0; i < 12; i++) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 10, 8),
      mat(C.iron, 0.25, 0.62, { emissive: C.bone, emissiveIntensity: 0.01 })
    );
    marker.position.set(-0.66 + (i % 6) * 0.265, -1.38 + Math.floor(i / 6) * 0.14, 0.04);
    machine.add(marker);
    captureMarkers.push(marker);
  }

  machine.add(shell, top, bottom, knot, spool, tape, furnace, mouth);
  group.add(machine);
  const targets = { printedCount: 0, capturedCount: 0, printCompletion: 0, captureDensity: 0, spent: false, openedDirector: false };

  animate.push((t) => {
    const aftermath = targets.openedDirector;
    const rate = aftermath ? 0.12 : 0.32 + targets.printCompletion * 0.42;
    knot.rotation.x = t * rate;
    knot.rotation.y = -t * (rate * 0.82);
    top.rotation.z = t * (aftermath ? 0.025 : 0.06 + targets.printCompletion * 0.08);
    bottom.rotation.z = -top.rotation.z;
    spool.rotation.x = -t * (0.16 + targets.printCompletion * 0.72);
    tape.scale.x += ((0.3 + targets.printCompletion * 0.7) - tape.scale.x) * 0.06;
    tape.position.x = -0.7 + targets.printCompletion * 0.36;

    coils.forEach((coil, index) => {
      const compression = 1 - targets.captureDensity * (0.035 + index * 0.006);
      const pulse = aftermath ? 0 : Math.sin(t * (0.35 + index * 0.04) + index) * 0.012 * targets.captureDensity;
      coil.scale.setScalar(compression + pulse);
    });

    const heatPulse = targets.spent ? 0.08 : Math.abs(Math.sin(t * 2.4)) * (0.1 + targets.printCompletion * 0.36);
    furnaceMaterial.emissiveIntensity = aftermath ? 0.03 : 0.08 + heatPulse;
    mouth.material.emissiveIntensity = aftermath ? 0.05 : 0.18 + heatPulse * 0.8;
  });

  return {
    applyState(projection) {
      targets.printedCount = projection.printedCount;
      targets.capturedCount = projection.capturedCount;
      targets.printCompletion = projection.printCompletion;
      targets.captureDensity = projection.captureDensity;
      targets.spent = projection.spent;
      targets.openedDirector = projection.openedDirector;

      const aftermathColor = projection.openedDirector ? C.green : C.brass;
      shellMaterial.emissive.setHex(projection.openedDirector ? C.green : 0x000000);
      shellMaterial.emissiveIntensity = projection.openedDirector ? 0.08 : 0;
      knotMaterial.color.setHex(projection.openedDirector ? C.green : C.oxide);
      knotMaterial.emissive.setHex(projection.openedDirector ? C.green : C.oxide);
      knotMaterial.emissiveIntensity = projection.openedDirector ? 0.32 : 0.13 + projection.captureDensity * 0.16;
      tapeMaterial.emissive.setHex(aftermathColor);
      tapeMaterial.emissiveIntensity = projection.printedCount > 0 ? 0.08 : 0.01;

      printMarkers.forEach((marker, index) => {
        const active = index < projection.printedCount;
        marker.material.color.setHex(active ? (projection.openedDirector ? C.green : C.brass) : C.iron);
        marker.material.emissive.setHex(aftermathColor);
        marker.material.emissiveIntensity = active ? 0.48 : 0.01;
      });
      captureMarkers.forEach((marker, index) => {
        const active = index < projection.capturedCount;
        marker.material.color.setHex(active ? (projection.openedDirector ? C.green : C.bone) : C.iron);
        marker.material.emissive.setHex(projection.openedDirector ? C.green : C.bone);
        marker.material.emissiveIntensity = active ? 0.42 : 0.01;
      });
      coils.forEach((coil) => {
        coil.material.color.setHex(projection.openedDirector ? C.green : C.brass);
      });
    }
  };
}

function addSundial(group, animate) {
  const machine = new THREE.Group();
  const discMaterial = mat(0x303329, 0.24, 0.82, { emissive: 0x000000, emissiveIntensity: 0 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.14, 48), discMaterial);
  disc.rotation.x = Math.PI / 2;

  const rim = ring(1.2, C.brass, 0.04);
  const gnomonMaterial = mat(C.bone, 0.6, 0.3, { emissive: 0x000000, emissiveIntensity: 0 });
  const gnomon = new THREE.Mesh(new THREE.ConeGeometry(0.13, 1.5, 4), gnomonMaterial);
  gnomon.position.y = 0.68;
  gnomon.rotation.z = -0.38;

  const shadowPivot = new THREE.Group();
  const shadowMaterial = mat(C.oxide, 0.15, 0.8, { emissive: C.oxide, emissiveIntensity: 0.12 });
  const shadow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.018, 0.035), shadowMaterial);
  shadow.position.x = 0.65;
  shadowPivot.add(shadow);

  const reversalGhostMaterial = mat(C.bone, 0.02, 0.95, { transparent: true, opacity: 0.16, emissive: C.bone, emissiveIntensity: 0.06 });
  const reversalGhost = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.012, 0.024), reversalGhostMaterial);
  reversalGhost.position.x = 0.54;
  reversalGhost.visible = false;
  shadowPivot.add(reversalGhost);

  const hourPins = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const material = mat(C.iron, 0.28, 0.62, { emissive: C.brass, emissiveIntensity: 0.01 });
    const pin = new THREE.Mesh(new THREE.SphereGeometry(i % 6 === 0 ? 0.045 : 0.026, 10, 8), material);
    pin.position.set(Math.cos(angle) * 1.03, Math.sin(angle) * 1.03, 0.11);
    machine.add(pin);
    hourPins.push(pin);
  }

  const glyphMarkers = [];
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI * 0.78 + i * (Math.PI * 1.56 / 6);
    const material = mat(C.iron, 0.28, 0.62, { emissive: C.brass, emissiveIntensity: 0.01 });
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.055, 0.045), material);
    marker.position.set(Math.cos(angle) * 1.48, Math.sin(angle) * 1.48, 0.02);
    marker.rotation.z = angle + Math.PI / 2;
    machine.add(marker);
    glyphMarkers.push(marker);
  }

  const irisMaterial = mat(C.dark, 0.34, 0.5, { emissive: C.brass, emissiveIntensity: 0.02 });
  const iris = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.055, 12, 42), irisMaterial);
  iris.position.z = 0.12;

  machine.add(disc, rim, gnomon, shadowPivot, iris);
  group.add(machine);

  const targets = { shadowAngle: Math.PI, hour: 12, glyphCount: 0, glyphCompletion: 0, reversalObserved: false, codeReady: false, used: false };

  animate.push((t) => {
    const stability = targets.used ? 0.2 : 1;
    let delta = targets.shadowAngle - shadowPivot.rotation.z;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    shadowPivot.rotation.z += delta * 0.085;
    rim.rotation.z = Math.sin(t * 0.22) * 0.035 * stability;
    iris.rotation.z = -t * (targets.codeReady ? 0.08 : 0.03 + targets.glyphCompletion * 0.08) * stability;
    reversalGhost.rotation.z = targets.reversalObserved ? Math.sin(t * 0.9) * 0.035 : 0;
    reversalGhost.material.opacity = targets.reversalObserved ? 0.12 + Math.abs(Math.sin(t * 1.3)) * 0.13 : 0;
    glyphMarkers.forEach((marker, index) => {
      if (index >= targets.glyphCount) return;
      const pulse = targets.used ? 1 : 1 + Math.sin(t * 1.1 + index * 0.7) * 0.06;
      marker.scale.setScalar(pulse);
    });
  });

  return {
    applyState(projection) {
      targets.shadowAngle = -projection.shadowAngleRadians;
      targets.hour = projection.hour;
      targets.glyphCount = projection.glyphCount;
      targets.glyphCompletion = projection.glyphCompletion;
      targets.reversalObserved = projection.reversalObserved;
      targets.codeReady = projection.codeReady;
      targets.used = projection.used;
      reversalGhost.visible = projection.reversalObserved;

      hourPins.forEach((pin, index) => {
        const active = index === projection.hour;
        const color = projection.used ? C.green : active ? C.oxide : C.iron;
        pin.material.color.setHex(color);
        pin.material.emissive.setHex(projection.used ? C.green : active ? C.oxide : C.brass);
        pin.material.emissiveIntensity = active ? 0.62 : projection.used ? 0.08 : 0.01;
      });

      glyphMarkers.forEach((marker, index) => {
        const active = index < projection.glyphCount;
        const color = projection.used ? C.green : projection.codeReady && active ? C.bone : active ? C.brass : C.iron;
        marker.material.color.setHex(color);
        marker.material.emissive.setHex(projection.used ? C.green : C.brass);
        marker.material.emissiveIntensity = active ? (projection.codeReady ? 0.72 : 0.38) : 0.01;
      });

      rim.material.color.setHex(projection.used ? C.green : C.brass);
      shadowMaterial.color.setHex(projection.used ? C.green : C.oxide);
      shadowMaterial.emissive.setHex(projection.used ? C.green : C.oxide);
      shadowMaterial.emissiveIntensity = projection.used ? 0.28 : 0.12 + projection.glyphCompletion * 0.12;
      irisMaterial.color.setHex(projection.codeReady ? (projection.used ? C.green : C.bone) : C.dark);
      irisMaterial.emissive.setHex(projection.used ? C.green : C.brass);
      irisMaterial.emissiveIntensity = projection.used ? 0.55 : projection.codeReady ? 0.42 : 0.02;
      discMaterial.emissive.setHex(projection.used ? C.green : 0x000000);
      discMaterial.emissiveIntensity = projection.used ? 0.055 : 0;
      gnomonMaterial.emissive.setHex(projection.used ? C.green : 0x000000);
      gnomonMaterial.emissiveIntensity = projection.used ? 0.08 : 0;
    }
  };
}

const builders = { deimos: addDeimos, chronostat: addChronostat, atlas: addAtlas, archive: addArchive, oracle: addOracle, verboten: addVerboten, sundial: addSundial };

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
    .machine-three-inspect{position:absolute;z-index:5;top:8px;right:10px;padding:5px 8px;background:rgba(17,19,15,.88);border:1px solid rgba(200,162,90,.45);font:9px/1.1 var(--mono);letter-spacing:.12em}
    .machine-three-view:not([data-three-status="ready"]) .machine-three-inspect{display:none}
    .machine-three-view[data-inspecting="true"]{height:clamp(320px,58vh,620px)}
    .machine-three-view[data-inspecting="true"] .machine-three-inspect{display:none}
    .machine-three-view[data-inspecting="true"] .machine-three-canvas{touch-action:none;cursor:grab}
    .machine-three-view[data-inspecting="true"][data-dragging="true"] .machine-three-canvas{cursor:grabbing}
    .machine-three-inspection-toolbar{display:none;position:absolute;z-index:5;right:10px;bottom:10px;gap:6px;padding:6px;border:1px solid rgba(200,162,90,.28);background:rgba(17,19,15,.88)}
    .machine-three-view[data-inspecting="true"] .machine-three-inspection-toolbar{display:flex}
    .machine-three-inspection-toolbar button{padding:5px 7px;font:9px/1.1 var(--mono);letter-spacing:.1em}
    .machine-three-announcer{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .machine-three-view:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    @media(prefers-reduced-motion:reduce){.machine-three-view{transition:none}}
    @media(max-width:900px){.machine-three-view{height:240px}.machine-three-view[data-inspecting="true"]{height:clamp(300px,52vh,500px)}}
  `;
  document.head.appendChild(style);
}

function setStatus(entry, status, message) {
  entry.host.dataset.threeStatus = status;
  const statusEl = entry.host.querySelector('.machine-three-status');
  if (statusEl && message) statusEl.textContent = message;
  const inspectButton = entry.host.querySelector('.machine-three-inspect');
  if (inspectButton) inspectButton.disabled = status !== 'ready';
}

function createHost(root, id) {
  const host = document.createElement('section');
  host.className = 'machine-three-view';
  host.dataset.threeStatus = 'loading';
  host.dataset.inspecting = 'false';
  host.dataset.dragging = 'false';
  host.tabIndex = 0;
  host.setAttribute('aria-label', `${id} three-dimensional instrument view`);
  host.innerHTML = [
    '<div class="machine-three-badge">3D INSTRUMENT VIEW</div>',
    '<button type="button" class="machine-three-inspect" aria-pressed="false" disabled>INSPECT APPARATUS</button>',
    '<div class="machine-three-inspection-toolbar" aria-label="Apparatus inspection controls">',
    '<button type="button" data-three-action="reset">RESET VIEW</button>',
    '<button type="button" data-three-action="close">CLOSE</button>',
    '</div>',
    '<div class="machine-three-announcer" role="status" aria-live="polite"></div>',
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
    if (runtime.active) setStatus(runtime.active.entry, 'context-lost', '3D SIGNAL LOST — RESTORING CONTEXT…');
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
  if (!window.WebGLRenderingContext && !window.WebGL2RenderingContext) throw new Error('WebGL is not available in this browser');
  const canvas = ensureCanvas();
  const attrs = { alpha: true, antialias: true, powerPreference: 'high-performance' };
  const context = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs);
  if (!context) throw new Error('Unable to create a WebGL context');
  const renderer = new THREE.WebGLRenderer({ canvas, context, ...attrs });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(runtime.pixelRatio);
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
  camera.position.set(0, 0.2, INSPECTION_LIMITS.defaultDistance);
  const inspection = {
    enabled: false,
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    distance: INSPECTION_LIMITS.defaultDistance,
    targetDistance: INSPECTION_LIMITS.defaultDistance,
    dragging: false,
    lastX: 0,
    lastY: 0
  };
  return {
    scene,
    camera,
    animators,
    controller,
    inspectionRig: group,
    inspection,
    projectionKey: null,
    pointer: new THREE.Vector2(),
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)') || { matches: false }
  };
}

function resizeActive() {
  if (!runtime.active || !runtime.renderer) return;
  const { entry, camera, reducedMotion } = runtime.active;
  const rect = entry.host.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const navigatorInfo = window.navigator || {};
  runtime.qualityTier = selectQualityTier({
    reducedMotion: reducedMotion?.matches === true,
    devicePixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: navigatorInfo.hardwareConcurrency,
    deviceMemory: navigatorInfo.deviceMemory,
    pixelArea: width * height
  });
  runtime.pixelRatio = pixelRatioForTier(runtime.qualityTier, window.devicePixelRatio || 1);
  entry.host.dataset.qualityTier = runtime.qualityTier;
  runtime.renderer.setPixelRatio(runtime.pixelRatio);
  runtime.renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function resetInspection(active, immediate = false) {
  if (!active?.inspection) return;
  active.inspection.targetYaw = 0;
  active.inspection.targetPitch = 0;
  active.inspection.targetDistance = INSPECTION_LIMITS.defaultDistance;
  if (immediate) {
    active.inspection.yaw = 0;
    active.inspection.pitch = 0;
    active.inspection.distance = INSPECTION_LIMITS.defaultDistance;
    active.inspectionRig.rotation.set(0, 0, 0);
    active.camera.position.z = INSPECTION_LIMITS.defaultDistance;
  }
}

function setInspectionMode(active, enabled) {
  if (!active?.entry?.host || !active.inspection) return;
  active.inspection.enabled = enabled === true;
  active.inspection.dragging = false;
  active.entry.host.dataset.inspecting = active.inspection.enabled ? 'true' : 'false';
  active.entry.host.dataset.dragging = 'false';
  const button = active.entry.host.querySelector('.machine-three-inspect');
  if (button) button.setAttribute('aria-pressed', active.inspection.enabled ? 'true' : 'false');
  const announcer = active.entry.host.querySelector('.machine-three-announcer');
  if (announcer) announcer.textContent = active.inspection.enabled ? 'Apparatus inspection mode entered.' : 'Apparatus inspection mode closed.';
  if (!active.inspection.enabled) resetInspection(active);
  if (active.inspection.enabled) active.entry.host.focus?.({ preventScroll: true });
  resizeActive();
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
  if (projection.orientationIndex != null) active.entry.host.dataset.orientationIndex = String(projection.orientationIndex);
  if (projection.safeOpen != null) active.entry.host.dataset.safeOpen = projection.safeOpen ? 'true' : 'false';
  if (projection.roundTrips != null) active.entry.host.dataset.roundTrips = String(projection.roundTrips);
  if (projection.shift != null) active.entry.host.dataset.temporalShift = String(projection.shift);
  if (projection.waitingForReply != null) active.entry.host.dataset.waitingForReply = projection.waitingForReply ? 'true' : 'false';
  if (projection.unlockedVerb != null) active.entry.host.dataset.verbotenUnlocked = projection.unlockedVerb ? 'true' : 'false';
  if (projection.strokeCount != null) active.entry.host.dataset.strokeCount = String(projection.strokeCount);
  if (projection.lockedShapeCount != null) active.entry.host.dataset.lockedShapes = String(projection.lockedShapeCount);
  if (projection.openedSundial != null) active.entry.host.dataset.sundialOpened = projection.openedSundial ? 'true' : 'false';
  if (projection.revealedCount != null) active.entry.host.dataset.revealedCount = String(projection.revealedCount);
  if (projection.solved != null && active.entry.id === 'archive') active.entry.host.dataset.archiveSolved = projection.solved ? 'true' : 'false';
  if (projection.placedCount != null) active.entry.host.dataset.placedCount = String(projection.placedCount);
  if (projection.zeroReadingCount != null) active.entry.host.dataset.zeroReadings = String(projection.zeroReadingCount);
  if (projection.ruleLearned != null && active.entry.id === 'oracle') active.entry.host.dataset.oracleRuleLearned = projection.ruleLearned ? 'true' : 'false';
  if (projection.openedDirector != null && active.entry.id === 'oracle') active.entry.host.dataset.oracleDirectorOpened = projection.openedDirector ? 'true' : 'false';
  if (projection.printedCount != null) active.entry.host.dataset.printedCount = String(projection.printedCount);
  if (projection.capturedCount != null) active.entry.host.dataset.capturedCount = String(projection.capturedCount);
  if (projection.spent != null) active.entry.host.dataset.verbotenSpent = projection.spent ? 'true' : 'false';
  if (projection.openedDirector != null && active.entry.id === 'verboten') active.entry.host.dataset.verbotenDirectorOpened = projection.openedDirector ? 'true' : 'false';
  if (projection.hour != null && active.entry.id === 'sundial') active.entry.host.dataset.sundialHour = String(projection.hour);
  if (projection.glyphCount != null && active.entry.id === 'sundial') active.entry.host.dataset.sundialGlyphCount = String(projection.glyphCount);
  if (projection.codeReady != null && active.entry.id === 'sundial') active.entry.host.dataset.sundialCodeReady = projection.codeReady ? 'true' : 'false';
  if (projection.used != null && active.entry.id === 'sundial') active.entry.host.dataset.sundialUsed = projection.used ? 'true' : 'false';
}

function renderFrame(time = 0) {
  const active = runtime.active;
  if (!active || !runtime.renderer) return;
  if (!active.entry.root.isConnected) { deactivateActive(); return; }

  const pauseReasons = composePauseReasons({
    contextLost: runtime.contextLost,
    documentHidden: document.hidden === true,
    viewportVisible: runtime.viewportVisible
  });
  if (pauseReasons.length) return;

  const targetFrameMs = targetFrameMsForTier(runtime.qualityTier);
  if (targetFrameMs > 0 && runtime.lastRenderedAt != null && time - runtime.lastRenderedAt < targetFrameMs) return;

  applyCanonicalProjection(active);
  const speed = active.reducedMotion.matches ? 0.12 : 1;
  const t = (time / 1000) * speed;
  active.animators.forEach((animate) => animate(t));

  const nextInspection = interpolateInspectionState(
    {
      yaw: active.inspection.yaw,
      pitch: active.inspection.pitch,
      distance: active.inspection.distance
    },
    {
      yaw: active.inspection.targetYaw,
      pitch: active.inspection.targetPitch,
      distance: active.inspection.targetDistance
    },
    active.reducedMotion.matches
  );
  active.inspection.yaw = nextInspection.yaw;
  active.inspection.pitch = nextInspection.pitch;
  active.inspection.distance = nextInspection.distance;
  active.inspectionRig.rotation.x = nextInspection.pitch;
  active.inspectionRig.rotation.y = nextInspection.yaw;
  active.camera.position.z = nextInspection.distance;

  const parallaxScale = parallaxScaleForTier(runtime.qualityTier);
  const cameraX = active.inspection.enabled ? 0 : active.pointer.x * 0.38 * parallaxScale;
  const cameraY = active.inspection.enabled ? 0.2 : 0.2 + active.pointer.y * 0.2 * parallaxScale;
  active.camera.position.x += (cameraX - active.camera.position.x) * 0.035;
  active.camera.position.y += (cameraY - active.camera.position.y) * 0.035;
  active.camera.lookAt(0, -0.04, 0);
  runtime.renderer.render(active.scene, active.camera);

  if (runtime.lastFrameTime != null) {
    const frameMs = Math.max(0, time - runtime.lastFrameTime);
    runtime.frameMsEma = runtime.frameMsEma == null ? frameMs : runtime.frameMsEma * 0.9 + frameMs * 0.1;
  }
  runtime.lastFrameTime = time;
  runtime.lastRenderedAt = time;
  runtime.framesRendered += 1;
}

function deactivateActive() {
  const active = runtime.active;
  if (!active) return;
  runtime.renderer?.setAnimationLoop?.(null);
  active.resizeObserver?.disconnect?.();
  if (active.onWindowResize) window.removeEventListener('resize', active.onWindowResize);
  active.entry.host.removeEventListener('pointermove', active.onMove);
  active.entry.host.removeEventListener('pointerleave', active.onLeave);
  active.entry.host.removeEventListener('pointerdown', active.onPointerDown);
  active.entry.host.removeEventListener('pointerup', active.onPointerUp);
  active.entry.host.removeEventListener('pointercancel', active.onPointerUp);
  active.entry.host.removeEventListener('wheel', active.onWheel);
  active.entry.host.removeEventListener('keydown', active.onKeyDown);
  active.inspectButton?.removeEventListener('click', active.onInspectClick);
  active.resetButton?.removeEventListener('click', active.onResetClick);
  active.closeButton?.removeEventListener('click', active.onCloseClick);
  active.intersectionObserver?.disconnect?.();
  disposeObject(active.scene);
  runtime.canvas?.remove();
  runtime.active = null;
  runtime.viewportVisible = true;
  runtime.lastFrameTime = null;
  runtime.lastRenderedAt = null;
}

function activate(entry) {
  if (!entry?.root?.isConnected) return;
  if (runtime.active?.entry === entry && runtime.renderer) return;
  if (runtime.unavailableReason) { setStatus(entry, 'unavailable', '3D VIEW UNAVAILABLE — INSTRUMENT CONTROLS REMAIN ACTIVE'); return; }
  if (!THREE) { setStatus(entry, 'loading', 'INITIALIZING LOCAL 3D INSTRUMENT…'); return; }
  deactivateActive();
  let renderer;
  try { renderer = ensureRenderer(); }
  catch (error) {
    runtime.unavailableReason = error instanceof Error ? error.message : String(error);
    setStatus(entry, 'unavailable', '3D VIEW UNAVAILABLE — INSTRUMENT CONTROLS REMAIN ACTIVE');
    return;
  }
  const canvas = ensureCanvas();
  const statusEl = entry.host.querySelector('.machine-three-status');
  entry.host.insertBefore(canvas, statusEl || null);
  let sceneState;
  try { sceneState = createScene(entry.id); }
  catch (error) {
    runtime.unavailableReason = error instanceof Error ? error.message : String(error);
    canvas.remove();
    setStatus(entry, 'unavailable', '3D VIEW UNAVAILABLE — INSTRUMENT CONTROLS REMAIN ACTIVE');
    return;
  }
  const inspectButton = entry.host.querySelector('.machine-three-inspect');
  const resetButton = entry.host.querySelector('[data-three-action="reset"]');
  const closeButton = entry.host.querySelector('[data-three-action="close"]');
  const activeForEntry = () => runtime.active?.entry === entry ? runtime.active : null;

  const setTargets = (next) => {
    const active = activeForEntry();
    if (!active) return;
    const normalized = normalizeInspectionState(next);
    active.inspection.targetYaw = normalized.yaw;
    active.inspection.targetPitch = normalized.pitch;
    active.inspection.targetDistance = normalized.distance;
  };

  const onMove = (event) => {
    const active = activeForEntry();
    if (active?.inspection.enabled && active.inspection.dragging) {
      const dx = event.clientX - active.inspection.lastX;
      const dy = event.clientY - active.inspection.lastY;
      active.inspection.lastX = event.clientX;
      active.inspection.lastY = event.clientY;
      setTargets({
        yaw: active.inspection.targetYaw + dx * 0.008,
        pitch: active.inspection.targetPitch + dy * 0.006,
        distance: active.inspection.targetDistance
      });
      event.preventDefault?.();
      return;
    }
    const rect = entry.host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    sceneState.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    sceneState.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const onPointerDown = (event) => {
    const active = activeForEntry();
    if (!active?.inspection.enabled) return;
    active.inspection.dragging = true;
    active.inspection.lastX = event.clientX;
    active.inspection.lastY = event.clientY;
    entry.host.dataset.dragging = 'true';
    entry.host.setPointerCapture?.(event.pointerId);
    entry.host.focus?.({ preventScroll: true });
    event.preventDefault?.();
  };

  const onPointerUp = (event) => {
    const active = activeForEntry();
    if (!active) return;
    active.inspection.dragging = false;
    entry.host.dataset.dragging = 'false';
    entry.host.releasePointerCapture?.(event.pointerId);
  };

  const onWheel = (event) => {
    const active = activeForEntry();
    if (!active?.inspection.enabled) return;
    setTargets({
      yaw: active.inspection.targetYaw,
      pitch: active.inspection.targetPitch,
      distance: active.inspection.targetDistance + Math.sign(event.deltaY || 0) * 0.28
    });
    event.preventDefault?.();
  };

  const onKeyDown = (event) => {
    const active = activeForEntry();
    if (!active?.inspection.enabled) return;
    const command = inspectionCommandForKey(event.key);
    if (!command) return;
    if (command.action === 'close') setInspectionMode(active, false);
    else if (command.action === 'reset') resetInspection(active, active.reducedMotion.matches);
    else {
      const next = applyInspectionDelta({
        yaw: active.inspection.targetYaw,
        pitch: active.inspection.targetPitch,
        distance: active.inspection.targetDistance
      }, command);
      setTargets(next);
    }
    event.preventDefault?.();
  };

  const onInspectClick = () => {
    const active = activeForEntry();
    if (active) setInspectionMode(active, true);
  };
  const onResetClick = () => {
    const active = activeForEntry();
    if (active) resetInspection(active, active.reducedMotion.matches);
  };
  const onCloseClick = () => {
    const active = activeForEntry();
    if (active) setInspectionMode(active, false);
  };
  const onLeave = () => {
    sceneState.pointer.set(0, 0);
    const active = activeForEntry();
    if (active?.inspection.dragging) {
      active.inspection.dragging = false;
      entry.host.dataset.dragging = 'false';
    }
  };

  entry.host.addEventListener('pointermove', onMove, { passive: false });
  entry.host.addEventListener('pointerleave', onLeave, { passive: true });
  entry.host.addEventListener('pointerdown', onPointerDown, { passive: false });
  entry.host.addEventListener('pointerup', onPointerUp, { passive: true });
  entry.host.addEventListener('pointercancel', onPointerUp, { passive: true });
  entry.host.addEventListener('wheel', onWheel, { passive: false });
  entry.host.addEventListener('keydown', onKeyDown);
  inspectButton?.addEventListener('click', onInspectClick);
  resetButton?.addEventListener('click', onResetClick);
  closeButton?.addEventListener('click', onCloseClick);
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
    onPointerDown,
    onPointerUp,
    onWheel,
    onKeyDown,
    onInspectClick,
    onResetClick,
    onCloseClick,
    inspectButton,
    resetButton,
    closeButton,
    resizeObserver,
    onWindowResize,
    intersectionObserver: null
  };

  runtime.viewportVisible = true;
  if (window.IntersectionObserver) {
    const intersectionObserver = new window.IntersectionObserver((records) => {
      const record = records.find((item) => item.target === entry.host);
      if (!record || runtime.active?.entry !== entry) return;
      runtime.viewportVisible = record.isIntersecting !== false && record.intersectionRatio !== 0;
    }, { threshold: 0.01 });
    intersectionObserver.observe(entry.host);
    runtime.active.intersectionObserver = intersectionObserver;
  }

  resizeActive();
  applyCanonicalProjection(runtime.active);
  setStatus(entry, 'ready', '3D INSTRUMENT ONLINE');
  renderer.setAnimationLoop(renderFrame);
}

function pruneEntries() {
  for (const entry of entries) if (!entry.root.isConnected) entries.delete(entry);
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
  for (const entry of entries) setStatus(entry, 'unavailable', '3D VIEW UNAVAILABLE — INSTRUMENT CONTROLS REMAIN ACTIVE');
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
  runtime.viewportVisible = true;
  runtime.lastFrameTime = null;
  runtime.lastRenderedAt = null;
}

function rendererInfoSnapshot() {
  const info = runtime.renderer?.info;
  if (!info) {
    return {
      geometries: 0,
      textures: 0,
      programs: 0,
      calls: 0,
      triangles: 0,
      points: 0,
      lines: 0
    };
  }
  return {
    geometries: info.memory?.geometries || 0,
    textures: info.memory?.textures || 0,
    programs: Array.isArray(info.programs) ? info.programs.length : 0,
    calls: info.render?.calls || 0,
    triangles: info.render?.triangles || 0,
    points: info.render?.points || 0,
    lines: info.render?.lines || 0
  };
}

function boot() {
  if (runtime.started) return;
  runtime.started = true;
  injectStyles();
  scan();
  if (window.MutationObserver) {
    runtime.observer = new window.MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) if (node instanceof window.Element) scan(node);
    });
    runtime.observer.observe(document.body, { childList: true, subtree: true });
  }
  runtime.onPageHide = shutdown;
  window.addEventListener('pagehide', runtime.onPageHide, { once: true });
  void loadThree();
}

export function startMachineThreeEnhancement() { boot(); }

export function getThreeRuntimeStatus() {
  pruneEntries();
  const pauseReasons = composePauseReasons({
    contextLost: runtime.contextLost,
    documentHidden: document.hidden === true,
    viewportVisible: runtime.viewportVisible
  });
  return {
    started: runtime.started,
    moduleLoaded: !!runtime.THREE,
    rendererCreated: !!runtime.renderer,
    activeMachine: runtime.active?.entry?.id || null,
    mountedViews: entries.size,
    contextLost: runtime.contextLost,
    inspecting: runtime.active?.inspection?.enabled === true,
    qualityTier: runtime.qualityTier,
    pixelRatio: runtime.pixelRatio,
    viewportVisible: runtime.viewportVisible,
    paused: pauseReasons.length > 0,
    pauseReasons,
    frameMsEma: runtime.frameMsEma,
    framesRendered: runtime.framesRendered,
    rendererInfo: rendererInfoSnapshot(),
    projectedPhase: runtime.active?.entry?.host?.dataset?.machinePhase || null,
    unavailableReason: runtime.unavailableReason
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
