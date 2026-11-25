import * as THREE from 'three';
import { ProceduralTextureSet } from './materials';

export interface RoomHandles {
  root: THREE.Group;
  ceilingGroup: THREE.Group;
  wallGroup: THREE.Group;
  signalPulseBeads: Array<{
    mesh: THREE.Mesh;
    curve: THREE.CatmullRomCurve3;
    phase: number;
    kind: 'mic_to_mixer' | 'mixer_to_speaker' | 'sensor_bus';
  }>;
  wallBeaconMesh: THREE.Mesh;
  wallBeaconMat: THREE.MeshStandardMaterial;
  ampMeterBars: THREE.Mesh[];
  xrayTargets: Array<{
    material: THREE.MeshStandardMaterial;
    baseOpacity: number;
    baseTransparent: boolean;
  }>;
}

export function buildAirportRoom(textures: ProceduralTextureSet): RoomHandles {
  const root = new THREE.Group();
  root.name = 'airport-pa-room';

  const xrayTargets: RoomHandles['xrayTargets'] = [];
  const signalPulseBeads: RoomHandles['signalPulseBeads'] = [];

  const trackXray = (mat: THREE.MeshStandardMaterial) => {
    xrayTargets.push({
      material: mat,
      baseOpacity: mat.opacity,
      baseTransparent: mat.transparent,
    });
  };

  // 1. Floor Slab (10m x 7m)
  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.floorTex,
    roughness: 0.58,
    metalness: 0.12,
  });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.16, 7.2), floorMat);
  floor.position.set(0, -0.08, 0);
  floor.receiveShadow = true;
  root.add(floor);

  // Zone Divider Stripe on Floor (Operator Zone vs Terminal Gate A12 Zone)
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.45,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const zoneLine = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 0.06), stripeMat);
  zoneLine.rotation.x = -Math.PI / 2;
  zoneLine.position.set(0, 0.015, 0.2);
  root.add(zoneLine);

  // Subtle floor grid accent border
  const borderMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x0e7490,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const zoneGlowLine = new THREE.Mesh(
    new THREE.PlaneGeometry(9.6, 0.025),
    borderMat,
  );
  zoneGlowLine.rotation.x = -Math.PI / 2;
  zoneGlowLine.position.set(0, 0.018, 0.27);
  root.add(zoneGlowLine);

  // 2. Back & Left Cutaway Architectural Walls
  const wallGroup = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a2230,
    roughness: 0.82,
    metalness: 0.08,
  });
  trackXray(wallMat);

  // Back wall (with large observation window opening framed cleanly)
  const backLower = new THREE.Mesh(new THREE.BoxGeometry(10.2, 1.35, 0.18), wallMat);
  backLower.position.set(0, 0.675, -3.5);
  backLower.receiveShadow = true;
  wallGroup.add(backLower);

  const backUpper = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.9, 0.18), wallMat);
  backUpper.position.set(0, 3.25, -3.5);
  wallGroup.add(backUpper);

  const backLeftPillar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.5, 0.18), wallMat);
  backLeftPillar.position.set(-3.8, 2.05, -3.5);
  wallGroup.add(backLeftPillar);

  const backRightPillar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.18), wallMat);
  backRightPillar.position.set(3.9, 2.05, -3.5);
  wallGroup.add(backRightPillar);

  // Observation window into airport concourse
  const windowBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 1.5),
    new THREE.MeshBasicMaterial({ map: textures.concourseWindowTex }),
  );
  windowBackdrop.position.set(0.1, 2.05, -3.6);
  wallGroup.add(windowBackdrop);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xa5f3fc,
    roughness: 0.08,
    metalness: 0.0,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.5), glassMat);
  windowGlass.position.set(0.1, 2.05, -3.45);
  wallGroup.add(windowGlass);

  // Window aluminum mullion frame
  const mullionMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.35,
    metalness: 0.78,
  });
  const winTopFrame = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.08, 0.22), mullionMat);
  winTopFrame.position.set(0.1, 2.8, -3.48);
  const winBotFrame = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.08, 0.22), mullionMat);
  winBotFrame.position.set(0.1, 1.32, -3.48);
  wallGroup.add(winTopFrame, winBotFrame);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.7, 7.2), wallMat);
  leftWall.position.set(-5.0, 1.85, 0);
  leftWall.receiveShadow = true;
  wallGroup.add(leftWall);

  // Acoustic vertical slats on left wall (InstancedMesh for crisp geometry + zero GC)
  const slatGeo = new THREE.BoxGeometry(0.04, 2.9, 0.08);
  const slatMat = new THREE.MeshStandardMaterial({
    color: 0x263144,
    roughness: 0.75,
    metalness: 0.15,
  });
  const slatCount = 26;
  const slats = new THREE.InstancedMesh(slatGeo, slatMat, slatCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < slatCount; i++) {
    dummy.position.set(-4.88, 1.65, -3.0 + i * 0.24);
    dummy.updateMatrix();
    slats.setMatrixAt(i, dummy.matrix);
  }
  slats.instanceMatrix.needsUpdate = true;
  slats.computeBoundingSphere();
  wallGroup.add(slats);

  // Wall Alarm Beacon near Back-Right Pillar
  const beaconBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 0.05, 20),
    mullionMat,
  );
  beaconBase.rotation.x = Math.PI / 2;
  beaconBase.position.set(3.3, 2.95, -3.38);
  wallGroup.add(beaconBase);

  const wallBeaconMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.1,
  });
  const wallBeaconMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 20, 16),
    wallBeaconMat,
  );
  wallBeaconMesh.position.set(3.3, 2.95, -3.32);
  wallGroup.add(wallBeaconMesh);

  // HVAC Air Duct along upper left/back wall (feeds Air Sensor area)
  const ductMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.36,
    metalness: 0.72,
  });
  const hvacDuct = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.36, 0.42), ductMat);
  hvacDuct.position.set(-3.1, 3.18, -3.05);
  wallGroup.add(hvacDuct);

  const hvacGrille = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.24, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.5 }),
  );
  hvacGrille.position.set(-2.35, 3.16, -2.83);
  wallGroup.add(hvacGrille);

  // Equipment Wall Conduit Board (back wall under window where Current & Air Sensors tie in)
  const conduitTrayMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.65,
  });
  const verticalConduit = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 2.9, 0.06),
    conduitTrayMat,
  );
  verticalConduit.position.set(-0.55, 1.85, -3.36);
  wallGroup.add(verticalConduit);

  const horizontalWallTray = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.1, 0.08),
    conduitTrayMat,
  );
  horizontalWallTray.position.set(-1.55, 2.55, -3.35);
  wallGroup.add(horizontalWallTray);

  root.add(wallGroup);

  // 3. Acoustic Ceiling Grid (y = 3.62)
  const ceilingGroup = new THREE.Group();
  const ceilingMat = new THREE.MeshStandardMaterial({
    map: textures.ceilingGridTex,
    roughness: 0.85,
    metalness: 0.1,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  });
  trackXray(ceilingMat);

  const ceilingPlane = new THREE.Mesh(
    new THREE.BoxGeometry(10.0, 0.06, 7.0),
    ceilingMat,
  );
  ceilingPlane.position.set(0, 3.64, 0);
  ceilingGroup.add(ceilingPlane);

  // Recessed LED troffer strips on ceiling
  const ledStripMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0xbae6fd,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  [-2.2, 1.8].forEach((xPos) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.26), ledStripMat);
    strip.position.set(xPos, 3.6, -1.1);
    ceilingGroup.add(strip);
  });

  // Overhead cable tray from back wall conduit to Genesis Speaker
  const ceilingTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.05, 4.4),
    conduitTrayMat,
  );
  ceilingTray.position.set(0.65, 3.55, -1.0);
  ceilingTray.rotation.y = 0.5;
  ceilingGroup.add(ceilingTray);

  root.add(ceilingGroup);

  // 4. Operator Console Desk (Center-Back-Left)
  const deskGroup = new THREE.Group();
  const deskTopMat = new THREE.MeshStandardMaterial({
    color: 0x1e2532,
    roughness: 0.62,
    metalness: 0.18,
  });
  const deskFrameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.78,
  });
  const desktop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 1.25), deskTopMat);
  desktop.position.set(-0.2, 0.77, -1.15);
  desktop.castShadow = true;
  desktop.receiveShadow = true;
  deskGroup.add(desktop);

  // Desk metal edge trim
  const trim = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.02, 0.03), borderMat);
  trim.position.set(-0.2, 0.77, -0.52);
  deskGroup.add(trim);

  // Desk legs (4 angled steel legs)
  [
    [-1.65, -1.65],
    [1.25, -1.65],
    [-1.65, -0.65],
    [1.25, -0.65],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.75, 0.07), deskFrameMat);
    leg.position.set(lx, 0.375, lz);
    leg.castShadow = true;
    deskGroup.add(leg);
  });

  // Dual Operator Monitors on raised shelf at back of desk
  const riser = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.28), deskFrameMat);
  riser.position.set(-0.35, 0.84, -1.6);
  deskGroup.add(riser);

  const buildMonitor = (x: number, rotY: number, tex: THREE.CanvasTexture) => {
    const mon = new THREE.Group();
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.24, 12), deskFrameMat);
    stand.position.y = 0.12;
    mon.add(stand);

    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.46, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.5 }),
    );
    bezel.position.y = 0.34;
    mon.add(bezel);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.71, 0.41),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    screen.position.set(0, 0.34, 0.019);
    mon.add(screen);

    mon.position.set(x, 0.86, -1.62);
    mon.rotation.y = rotY;
    return mon;
  };
  deskGroup.add(buildMonitor(-0.82, 0.14, textures.monitorLeftTex));
  deskGroup.add(buildMonitor(0.08, -0.1, textures.monitorRightTex));

  // Ergonomic Operator Chair (facing desk)
  const chairGroup = new THREE.Group();
  const chairMat = new THREE.MeshStandardMaterial({
    color: 0x161b26,
    roughness: 0.75,
    metalness: 0.15,
  });
  const chairPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.42, 12),
    deskFrameMat,
  );
  chairPedestal.position.y = 0.22;
  chairGroup.add(chairPedestal);
  const chairBaseStar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.04, 5),
    deskFrameMat,
  );
  chairBaseStar.position.y = 0.04;
  chairGroup.add(chairBaseStar);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.46), chairMat);
  seat.position.y = 0.45;
  chairGroup.add(seat);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.54, 0.06), chairMat);
  backrest.position.set(0, 0.74, 0.22);
  backrest.rotation.x = -0.08;
  chairGroup.add(backrest);
  chairGroup.position.set(-0.45, 0, -0.2);
  deskGroup.add(chairGroup);

  root.add(deskGroup);

  // 5. 19" PA Power Amplifier & Supervision Rack (Left of Desk)
  const rackGroup = new THREE.Group();
  const rackCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 1.55, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x161c26, roughness: 0.55, metalness: 0.45 }),
  );
  rackCabinet.position.set(-2.55, 0.775, -1.65);
  rackCabinet.castShadow = true;
  rackCabinet.receiveShadow = true;
  rackGroup.add(rackCabinet);

  // Rack faceplates + 70V/100V Amp module with glowing bars
  const ampMeterBars: THREE.Mesh[] = [];
  for (let u = 0; u < 5; u++) {
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.22, 0.03),
      new THREE.MeshStandardMaterial({
        color: u === 1 ? 0x1e293b : 0x0f172a,
        roughness: 0.38,
        metalness: 0.68,
      }),
    );
    face.position.set(-2.55, 0.32 + u * 0.26, -1.28);
    rackGroup.add(face);
  }
  for (let b = 0; b < 6; b++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.035, 0.02),
      new THREE.MeshStandardMaterial({
        color: b < 4 ? 0x22d3ee : 0xf59e0b,
        emissive: b < 4 ? 0x22d3ee : 0xf59e0b,
        emissiveIntensity: 0.15,
      }),
    );
    bar.position.set(-2.72 + b * 0.075, 1.1, -1.255);
    rackGroup.add(bar);
    ampMeterBars.push(bar);
  }
  root.add(rackGroup);

  // 6. Terminal Announcement Zone (Gate A12 Bench & Boarding Sign under Genesis Speaker)
  const terminalZone = new THREE.Group();

  // Stainless steel & leather 3-seat waiting bench
  const benchFrameMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.28,
    metalness: 0.85,
  });
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.78,
    metalness: 0.05,
  });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.08), benchFrameMat);
  beam.position.set(1.8, 0.38, 1.35);
  terminalZone.add(beam);
  [0.9, 2.7].forEach((bx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.38, 0.42), benchFrameMat);
    leg.position.set(bx, 0.19, 1.35);
    leg.castShadow = true;
    terminalZone.add(leg);
  });
  for (let s = 0; s < 3; s++) {
    const sx = 1.15 + s * 0.65;
    const sSeat = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.07, 0.46), cushionMat);
    sSeat.position.set(sx, 0.45, 1.38);
    sSeat.castShadow = true;
    const sBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 0.06), cushionMat);
    sBack.position.set(sx, 0.7, 1.16);
    sBack.rotation.x = -0.12;
    sBack.castShadow = true;
    terminalZone.add(sSeat, sBack);
  }

  // Gate A12 Signage Stand
  const signPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 2.15, 16),
    benchFrameMat,
  );
  signPost.position.set(3.45, 1.075, 1.15);
  signPost.castShadow = true;
  terminalZone.add(signPost);

  const signBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.04, 24),
    benchFrameMat,
  );
  signBase.position.set(3.45, 0.02, 1.15);
  terminalZone.add(signBase);

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.44, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 }),
  );
  signBoard.position.set(3.45, 2.05, 1.15);
  signBoard.rotation.y = -0.35;
  terminalZone.add(signBoard);

  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.08, 0.38),
    new THREE.MeshBasicMaterial({ map: textures.gateSignTex }),
  );
  signFace.position.set(0, 0, 0.032);
  signBoard.add(signFace);

  root.add(terminalZone);

  // 7. Operational Signal Cables & Conduits Connecting All 6 Devices
  const addCableWithPulses = (
    points: THREE.Vector3[],
    color: number,
    radius: number,
    kind: 'mic_to_mixer' | 'mixer_to_speaker' | 'sensor_bus',
    beadCount: number,
  ) => {
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 48, radius, 10, false),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.45,
        metalness: 0.25,
      }),
    );
    root.add(tube);

    const beadColor =
      kind === 'mic_to_mixer'
        ? 0x22d3ee
        : kind === 'mixer_to_speaker'
          ? 0xf59e0b
          : 0x34d399;
    for (let i = 0; i < beadCount; i++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.65, 10, 8),
        new THREE.MeshBasicMaterial({ color: beadColor }),
      );
      bead.visible = false;
      root.add(bead);
      signalPulseBeads.push({
        mesh: bead,
        curve,
        phase: i / beadCount,
        kind,
      });
    }
  };

  // Cable 1: Mic Paging -> 12-Channel Mixer (Balanced 5-pin XLR)
  addCableWithPulses(
    [
      new THREE.Vector3(-1.05, 0.83, -1.2),
      new THREE.Vector3(-0.82, 0.81, -1.36),
      new THREE.Vector3(-0.48, 0.81, -1.38),
      new THREE.Vector3(-0.26, 0.86, -1.28),
    ],
    0x0e7490,
    0.011,
    'mic_to_mixer',
    4,
  );

  // Cable 2: Mixer -> 19" Amplifier Rack -> Wall Conduit (through Current Sensor) -> Ceiling Tray -> Genesis Ceiling Speaker
  addCableWithPulses(
    [
      new THREE.Vector3(0.35, 0.85, -1.38),
      new THREE.Vector3(-0.45, 0.72, -1.78),
      new THREE.Vector3(-2.35, 1.1, -1.75),
      new THREE.Vector3(-2.25, 1.35, -2.55),
      new THREE.Vector3(-0.85, 2.15, -2.55),
      new THREE.Vector3(-0.2, 2.15, -2.55),
      new THREE.Vector3(-0.2, 3.5, -2.55),
      new THREE.Vector3(0.75, 3.52, -0.8),
      new THREE.Vector3(1.8, 3.55, 1.2),
    ],
    0xb45309,
    0.014,
    'mixer_to_speaker',
    10,
  );

  // Cable 3: Sensor Monitoring Bus (Temp Sensor -> Air Sensor -> Current Sensor -> Rack)
  addCableWithPulses(
    [
      new THREE.Vector3(0.95, 0.86, -1.35),
      new THREE.Vector3(0.95, 0.86, -2.45),
      new THREE.Vector3(-0.55, 1.98, -2.52),
      new THREE.Vector3(-2.35, 2.4, -2.55),
      new THREE.Vector3(-2.55, 1.45, -2.05),
    ],
    0x065f46,
    0.009,
    'sensor_bus',
    6,
  );

  return {
    root,
    ceilingGroup,
    wallGroup,
    signalPulseBeads,
    wallBeaconMesh,
    wallBeaconMat,
    ampMeterBars,
    xrayTargets,
  };
}
