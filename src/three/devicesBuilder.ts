import * as THREE from 'three';
import { DeviceId } from '../types/twin';
import { ProceduralTextureSet } from './materials';

export interface ExplodablePart {
  group: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeOffset: THREE.Vector3;
  deviceId: DeviceId;
  componentId: string;
}

export interface DevicesRig {
  root: THREE.Group;
  deviceGroups: Record<DeviceId, THREE.Group>;
  deviceWorldAnchors: Record<DeviceId, THREE.Vector3>;
  parts: ExplodablePart[];
  selectableMeshes: THREE.Mesh[];
  // Dynamic animation handles
  speakerCone: THREE.Object3D;
  speakerWaves: THREE.Mesh[];
  speakerTapIndicator: THREE.Mesh;
  micPttLedMat: THREE.MeshStandardMaterial;
  micChimeRing: THREE.Mesh;
  mixerChannel1Fader: THREE.Object3D;
  mixerMainFader: THREE.Object3D;
  mixerLedBars: THREE.Mesh[];
  tempProbeMat: THREE.MeshStandardMaterial;
  airFanRotor: THREE.Object3D;
  airLaserBeamMat: THREE.MeshBasicMaterial;
  currentCoreGlowMat: THREE.MeshStandardMaterial;
  beacons: Record<DeviceId, THREE.MeshStandardMaterial>;
  beaconMeshes: Record<DeviceId, THREE.Mesh>;
}

export function buildAllDevices(textures: ProceduralTextureSet): DevicesRig {
  const root = new THREE.Group();
  root.name = 'pa-devices-root';

  const parts: ExplodablePart[] = [];
  const selectableMeshes: THREE.Mesh[] = [];
  const beacons = {} as Record<DeviceId, THREE.MeshStandardMaterial>;
  const beaconMeshes = {} as Record<DeviceId, THREE.Mesh>;

  const registerPart = (
    parent: THREE.Group,
    group: THREE.Object3D,
    deviceId: DeviceId,
    componentId: string,
    explodeOffset: THREE.Vector3,
  ) => {
    const basePos = group.position.clone();
    parent.add(group);
    parts.push({ group, basePos, explodeOffset, deviceId, componentId });

    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.userData.deviceId = deviceId;
        mesh.userData.componentId = componentId;
        mesh.layers.enable(1);
        selectableMeshes.push(mesh);
      }
    });
  };

  const addDeviceBeacon = (
    parent: THREE.Group,
    deviceId: DeviceId,
    pos: THREE.Vector3,
  ) => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.45,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 12), mat);
    mesh.position.copy(pos);
    parent.add(mesh);
    beacons[deviceId] = mat;
    beaconMeshes[deviceId] = mesh;
  };

  // Shared materials with realistic roughness/metalness deltas
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.28,
    metalness: 0.86,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.72,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.25,
    metalness: 0.9,
  });
  const pcbMat = new THREE.MeshStandardMaterial({
    map: textures.pcbTex,
    roughness: 0.52,
    metalness: 0.15,
  });

  // =========================================================================
  // 1. GENESIS PA CEILING SPEAKER (Installed on Ceiling Grid [1.8, 3.54, 1.2])
  // =========================================================================
  const speakerGroup = new THREE.Group();
  speakerGroup.position.set(1.8, 3.54, 1.2);
  // Scale slightly generous for effortless visibility & explosion inspection in room
  speakerGroup.scale.setScalar(1.35);
  root.add(speakerGroup);

  // 1a. Baffle / Backcan Housing
  const spkBaffle = new THREE.Group();
  const backcan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.22, 0.18, 32),
    darkMetalMat.clone(),
  );
  backcan.position.y = 0.09;
  spkBaffle.add(backcan);
  const rimFlange = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.31, 32),
    new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.4,
      metalness: 0.5,
      side: THREE.DoubleSide,
    }),
  );
  rimFlange.rotation.x = Math.PI / 2;
  spkBaffle.add(rimFlange);
  registerPart(speakerGroup, spkBaffle, 'speaker', 'baffle', new THREE.Vector3(0, 0.38, 0));

  // 1b. Terminal Block & DC Blocking Capacitor
  const spkTerm = new THREE.Group();
  spkTerm.position.set(0.14, 0.16, 0);
  const termBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.05, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.55, metalness: 0.1 }),
  );
  spkTerm.add(termBlock);
  const dcCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.055, 16),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.35, metalness: 0.3 }),
  );
  dcCap.rotation.z = Math.PI / 2;
  dcCap.position.set(-0.05, 0.01, 0.015);
  spkTerm.add(dcCap);
  registerPart(
    speakerGroup,
    spkTerm,
    'speaker',
    'terminal_block',
    new THREE.Vector3(0.32, 0.28, 0),
  );

  // 1c. Wattage Tap Selector Switch (1/4W, 1/2W, 1W, 2W)
  const spkTap = new THREE.Group();
  spkTap.position.set(-0.14, 0.15, 0.04);
  const tapBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.045, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.2 }),
  );
  spkTap.add(tapBody);
  const speakerTapIndicator = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.025, 0.022),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    }),
  );
  speakerTapIndicator.position.set(0, 0.025, 0);
  spkTap.add(speakerTapIndicator);
  registerPart(
    speakerGroup,
    spkTap,
    'speaker',
    'tap_switch',
    new THREE.Vector3(-0.32, 0.24, 0.12),
  );

  // 1d. 25V/70V/100V Line Matching Transformer
  const spkTrans = new THREE.Group();
  spkTrans.position.set(0, 0.12, -0.05);
  const xfmrCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.09, 0.09),
    steelMat.clone(),
  );
  const xfmrCoil = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.07, 0.105),
    copperMat.clone(),
  );
  spkTrans.add(xfmrCore, xfmrCoil);
  registerPart(
    speakerGroup,
    spkTrans,
    'speaker',
    'transformer',
    new THREE.Vector3(0, 0.16, -0.22),
  );

  // 1e. Permanent Magnet Assembly & Yoke
  const spkMagnet = new THREE.Group();
  spkMagnet.position.set(0, 0.02, 0);
  const ferriteRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.045, 28),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.65, metalness: 0.35 }),
  );
  const yokePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.015, 28),
    steelMat.clone(),
  );
  yokePlate.position.y = 0.03;
  spkMagnet.add(ferriteRing, yokePlate);
  registerPart(
    speakerGroup,
    spkMagnet,
    'speaker',
    'magnet',
    new THREE.Vector3(0, -0.1, 0),
  );

  // 1f. Voice Coil
  const spkCoil = new THREE.Group();
  spkCoil.position.set(0, -0.03, 0);
  const coilBobbin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.05, 24, 1, true),
    copperMat.clone(),
  );
  spkCoil.add(coilBobbin);
  registerPart(
    speakerGroup,
    spkCoil,
    'speaker',
    'voice_coil',
    new THREE.Vector3(0, -0.26, 0),
  );

  // 1g. Full-Range Speaker Cone
  const spkConeGroup = new THREE.Group();
  spkConeGroup.position.set(0, -0.06, 0);
  const coneMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.09, 32, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x27303f,
      roughness: 0.78,
      metalness: 0.06,
      side: THREE.DoubleSide,
    }),
  );
  coneMesh.rotation.x = Math.PI;
  const dustCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }),
  );
  dustCap.rotation.x = Math.PI;
  dustCap.position.y = -0.02;
  spkConeGroup.add(coneMesh, dustCap);
  registerPart(
    speakerGroup,
    spkConeGroup,
    'speaker',
    'cone',
    new THREE.Vector3(0, -0.46, 0),
  );

  // 1h. Low-Profile Perforated Ceiling Grille (Twist-Lock Cover)
  const spkGrille = new THREE.Group();
  spkGrille.position.set(0, -0.11, 0);
  const grilleDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.014, 36),
    new THREE.MeshStandardMaterial({
      map: textures.perforatedGrilleTex,
      roughness: 0.42,
      metalness: 0.55,
    }),
  );
  spkGrille.add(grilleDisc);
  const twistBezel = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.015, 10, 36),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.3 }),
  );
  twistBezel.rotation.x = Math.PI / 2;
  spkGrille.add(twistBezel);
  registerPart(
    speakerGroup,
    spkGrille,
    'speaker',
    'grille',
    new THREE.Vector3(0, -0.7, 0),
  );

  // Acoustic Sound Wave Rings radiating downward from speaker
  const speakerWaves: THREE.Mesh[] = [];
  for (let w = 0; w < 4; w++) {
    const wave = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.009, 8, 36),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0,
      }),
    );
    wave.rotation.x = Math.PI / 2;
    wave.position.y = -0.25 - w * 0.35;
    wave.visible = false;
    speakerGroup.add(wave);
    speakerWaves.push(wave);
  }
  addDeviceBeacon(speakerGroup, 'speaker', new THREE.Vector3(0.29, -0.05, 0.1));

  // =========================================================================
  // 2. MIKROFON PAGING (Installed on Operator Console Desk [-1.05, 0.80, -1.05])
  // =========================================================================
  const micGroup = new THREE.Group();
  micGroup.position.set(-1.05, 0.8, -1.05);
  micGroup.scale.setScalar(1.35);
  root.add(micGroup);

  // 2a. Dudukan Meja Pemberat (Weighted Desk Base)
  const micBase = new THREE.Group();
  const baseBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.048, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 }),
  );
  baseBody.position.y = 0.024;
  baseBody.castShadow = true;
  micBase.add(baseBody);
  registerPart(micGroup, micBase, 'mic', 'base', new THREE.Vector3(0, -0.05, 0));

  // 2b. Papan Sirkuit Internal (PCB)
  const micPcb = new THREE.Group();
  micPcb.position.set(0, 0.026, 0);
  const micPcbBoard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.16), pcbMat);
  micPcb.add(micPcbBoard);
  registerPart(micGroup, micPcb, 'mic', 'pcb', new THREE.Vector3(0, 0.12, 0));

  // 2c. Sirkuit Penguat Awal (Preamp)
  const micPreamp = new THREE.Group();
  micPreamp.position.set(-0.03, 0.036, -0.02);
  const opAmpChip = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.014, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.2 }),
  );
  micPreamp.add(opAmpChip);
  registerPart(micGroup, micPreamp, 'mic', 'preamp', new THREE.Vector3(-0.16, 0.18, 0));

  // 2d. Generator Nada Bel (Chime Generator) & Kontrol Relay
  const micChime = new THREE.Group();
  micChime.position.set(0.035, 0.04, -0.02);
  const relayBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.028, 0.032),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.2 }),
  );
  micChime.add(relayBox);
  const micChimeRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.005, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0 }),
  );
  micChimeRing.rotation.x = Math.PI / 2;
  micChimeRing.position.y = 0.02;
  micChime.add(micChimeRing);
  registerPart(
    micGroup,
    micChime,
    'mic',
    'chime_relay',
    new THREE.Vector3(0.18, 0.18, 0),
  );

  // 2e. Sakelar Tekan Bicara (PTT Switch)
  const micPtt = new THREE.Group();
  micPtt.position.set(0, 0.052, 0.068);
  const pttButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.018, 0.042),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.4 }),
  );
  const micPttLedMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.25,
    roughness: 0.2,
  });
  const pttLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.01), micPttLedMat);
  pttLed.position.set(0, 0.01, -0.01);
  micPtt.add(pttButton, pttLed);
  registerPart(micGroup, micPtt, 'mic', 'ptt_switch', new THREE.Vector3(0, 0.16, 0.22));

  // 2f. Konektor Keluaran Multi-Pin (XLR 5-pin) & Kabel Output Seimbang
  const micConn = new THREE.Group();
  micConn.position.set(0, 0.026, -0.115);
  const xlrBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.045, 16),
    steelMat.clone(),
  );
  xlrBarrel.rotation.x = Math.PI / 2;
  micConn.add(xlrBarrel);
  registerPart(
    micGroup,
    micConn,
    'mic',
    'connector',
    new THREE.Vector3(0, 0.06, -0.22),
  );

  // 2g. Kabel Internal Terlindung (coax core inside gooseneck)
  const gooseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.048, -0.03),
    new THREE.Vector3(0, 0.19, -0.02),
    new THREE.Vector3(0, 0.31, 0.04),
    new THREE.Vector3(0, 0.37, 0.11),
  ]);
  const micShield = new THREE.Group();
  const shieldCore = new THREE.Mesh(
    new THREE.TubeGeometry(gooseCurve, 24, 0.0045, 8, false),
    copperMat.clone(),
  );
  micShield.add(shieldCore);
  registerPart(
    micGroup,
    micShield,
    'mic',
    'internal_shield_cable',
    new THREE.Vector3(-0.14, 0.28, 0.08),
  );

  // 2h. Leher Angsa Fleksibel (Gooseneck)
  const micGoose = new THREE.Group();
  const gooseShell = new THREE.Mesh(
    new THREE.TubeGeometry(gooseCurve, 28, 0.011, 12, false),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.7 }),
  );
  micGoose.add(gooseShell);
  registerPart(
    micGroup,
    micGoose,
    'mic',
    'gooseneck',
    new THREE.Vector3(0.06, 0.28, 0.06),
  );

  // 2i. Kapsul Mikrofon
  const micCap = new THREE.Group();
  micCap.position.set(0, 0.375, 0.12);
  micCap.rotation.x = 0.9;
  const capsuleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.013, 0.042, 18),
    steelMat.clone(),
  );
  micCap.add(capsuleMesh);
  registerPart(micGroup, micCap, 'mic', 'capsule', new THREE.Vector3(0, 0.44, 0.2));

  // 2j. Busa Pelindung (Windscreen)
  const micWind = new THREE.Group();
  micWind.position.set(0, 0.39, 0.142);
  micWind.rotation.x = 0.9;
  const foam = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.022, 0.036, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.94, metalness: 0.02 }),
  );
  micWind.add(foam);
  registerPart(micGroup, micWind, 'mic', 'windscreen', new THREE.Vector3(0, 0.56, 0.3));

  addDeviceBeacon(micGroup, 'mic', new THREE.Vector3(-0.08, 0.06, 0.09));

  // =========================================================================
  // 3. 12-CHANNEL ANALOG AUDIO MIXER (Desk Center [0.05, 0.80, -1.05])
  // =========================================================================
  const mixerGroup = new THREE.Group();
  mixerGroup.position.set(0.05, 0.8, -1.05);
  mixerGroup.scale.setScalar(1.2);
  root.add(mixerGroup);

  // 3a. Chassis & Bodi Modular
  const mixChassis = new THREE.Group();
  const chassisBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.09, 0.54),
    new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.48, metalness: 0.65 }),
  );
  chassisBody.position.y = 0.045;
  chassisBody.castShadow = true;
  chassisBody.receiveShadow = true;
  mixChassis.add(chassisBody);
  registerPart(mixerGroup, mixChassis, 'mixer', 'chassis', new THREE.Vector3(0, -0.08, 0));

  // 3b. Catu Daya Internal (PSU +48V Phantom)
  const mixPsu = new THREE.Group();
  mixPsu.position.set(0.32, 0.05, -0.14);
  const psuBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.06, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 }),
  );
  const toroidal = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.015, 10, 20),
    copperMat.clone(),
  );
  toroidal.rotation.x = Math.PI / 2;
  toroidal.position.y = 0.036;
  mixPsu.add(psuBlock, toroidal);
  registerPart(mixerGroup, mixPsu, 'mixer', 'psu', new THREE.Vector3(0.32, 0.18, -0.22));

  // 3c. Jalur Kabel Pita & Konektor
  const mixRibbon = new THREE.Group();
  mixRibbon.position.set(0, 0.072, -0.02);
  const ribbonMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.008, 0.065),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6, metalness: 0.1 }),
  );
  mixRibbon.add(ribbonMesh);
  registerPart(
    mixerGroup,
    mixRibbon,
    'mixer',
    'ribbon_cable',
    new THREE.Vector3(0, 0.14, 0),
  );

  // 3d. Panel Input/Output Belakang (XLR & TRS 1/4")
  const mixIo = new THREE.Group();
  mixIo.position.set(0, 0.065, -0.275);
  const ioPlate = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 0.02), darkMetalMat.clone());
  mixIo.add(ioPlate);
  for (let i = 0; i < 12; i++) {
    const xlrPort = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.025, 12),
      steelMat.clone(),
    );
    xlrPort.rotation.x = Math.PI / 2;
    xlrPort.position.set(-0.37 + i * 0.054, 0.008, -0.01);
    mixIo.add(xlrPort);
  }
  registerPart(mixerGroup, mixIo, 'mixer', 'io_panel', new THREE.Vector3(0, 0.1, -0.28));

  // 3e. Modul Saluran Vertikal (12 Channel Strips Faceplate & EQ/Gain Knobs)
  const mixStrips = new THREE.Group();
  mixStrips.position.set(0, 0.095, 0.02);
  const faceplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.015, 0.44),
    new THREE.MeshStandardMaterial({
      map: textures.mixerFaceplateTex,
      roughness: 0.5,
      metalness: 0.35,
    }),
  );
  mixStrips.add(faceplate);
  // Instanced EQ/Gain knobs across 12 channels (48 knobs!)
  const knobGeo = new THREE.CylinderGeometry(0.0085, 0.0095, 0.016, 12);
  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    roughness: 0.4,
    metalness: 0.3,
  });
  const knobInstances = new THREE.InstancedMesh(knobGeo, knobMat, 48);
  const kDummy = new THREE.Object3D();
  let kIdx = 0;
  for (let ch = 0; ch < 12; ch++) {
    for (let row = 0; row < 4; row++) {
      kDummy.position.set(-0.39 + ch * 0.055, 0.015, -0.15 + row * 0.052);
      kDummy.updateMatrix();
      knobInstances.setMatrixAt(kIdx++, kDummy.matrix);
    }
  }
  knobInstances.instanceMatrix.needsUpdate = true;
  knobInstances.computeBoundingSphere();
  mixStrips.add(knobInstances);
  registerPart(
    mixerGroup,
    mixStrips,
    'mixer',
    'channel_strips',
    new THREE.Vector3(0, 0.24, 0),
  );

  // 3f. Penggeser Saluran (12 Channel Faders)
  const mixFaders = new THREE.Group();
  mixFaders.position.set(-0.09, 0.115, 0.145);
  let mixerChannel1Fader: THREE.Object3D = new THREE.Object3D();
  for (let ch = 0; ch < 12; ch++) {
    const faderCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.018, 0.032),
      new THREE.MeshStandardMaterial({
        color: ch === 0 ? 0x22d3ee : 0xe2e8f0,
        roughness: 0.35,
        metalness: 0.25,
      }),
    );
    faderCap.position.set(-0.3 + ch * 0.055, 0, 0.01);
    mixFaders.add(faderCap);
    if (ch === 0) mixerChannel1Fader = faderCap;
  }
  registerPart(mixerGroup, mixFaders, 'mixer', 'faders', new THREE.Vector3(0, 0.34, 0.12));

  // 3g. Bagian Master & Grup
  const mixMaster = new THREE.Group();
  mixMaster.position.set(0.35, 0.115, 0.12);
  const masterBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.016, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.5 }),
  );
  mixMaster.add(masterBase);
  const mixerMainFader = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.022, 0.036),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.2 }),
  );
  mixerMainFader.position.set(0.03, 0.014, 0.01);
  mixMaster.add(mixerMainFader);
  registerPart(
    mixerGroup,
    mixMaster,
    'mixer',
    'master_section',
    new THREE.Vector3(0.24, 0.34, 0.12),
  );

  // 3h. LED Meter Bridge & Indikator
  const mixMeter = new THREE.Group();
  mixMeter.position.set(0, 0.145, -0.22);
  const bridgeHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.085, 0.065),
    darkMetalMat.clone(),
  );
  bridgeHousing.rotation.x = 0.28;
  mixMeter.add(bridgeHousing);

  const mixerLedBars: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const col = i < 6 ? 0x10b981 : i < 8 ? 0xf59e0b : 0xef4444;
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.018, 0.012),
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.12,
        roughness: 0.2,
      }),
    );
    led.position.set(-0.28 + i * 0.062, 0.005, 0.035);
    mixMeter.add(led);
    mixerLedBars.push(led);
  }
  registerPart(
    mixerGroup,
    mixMeter,
    'mixer',
    'meter_bridge',
    new THREE.Vector3(0, 0.42, -0.15),
  );

  addDeviceBeacon(mixerGroup, 'mixer', new THREE.Vector3(-0.42, 0.11, 0.22));

  // =========================================================================
  // 4. SENSOR SUHU (Near Mixer PSU Hotspot [0.95, 0.86, -1.25])
  // =========================================================================
  const tempGroup = new THREE.Group();
  tempGroup.position.set(0.95, 0.86, -1.25);
  tempGroup.scale.setScalar(1.45);
  root.add(tempGroup);

  // Pedestal bracket on desk facing mixer PSU
  const bracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.06, 0.11),
    darkMetalMat.clone(),
  );
  bracket.position.y = -0.03;
  tempGroup.add(bracket);

  // 4a. Outer Protective Casing
  const tmpCasing = new THREE.Group();
  const casingBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.16, 20),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.8 }),
  );
  casingBody.rotation.z = Math.PI / 2;
  tmpCasing.add(casingBody);
  registerPart(
    tempGroup,
    tmpCasing,
    'temp_sensor',
    'casing',
    new THREE.Vector3(0, 0.18, 0),
  );

  // 4b. Internal Signal Conditioning PCB
  const tmpPcb = new THREE.Group();
  const tmpBoard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.06), pcbMat);
  tmpPcb.add(tmpBoard);
  registerPart(
    tempGroup,
    tmpPcb,
    'temp_sensor',
    'conditioning_pcb',
    new THREE.Vector3(0, 0.08, 0.12),
  );

  // 4c. Sensing Element (NTC / RTD Bead)
  const tmpElem = new THREE.Group();
  tmpElem.position.set(-0.07, 0, 0);
  const ntcBead = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 16, 14),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.25, metalness: 0.4 }),
  );
  tmpElem.add(ntcBead);
  registerPart(
    tempGroup,
    tmpElem,
    'temp_sensor',
    'sensing_element',
    new THREE.Vector3(-0.14, 0.12, 0),
  );

  // 4d. Thermal Probe / Heat-Transfer Tip
  const tmpProbe = new THREE.Group();
  tmpProbe.position.set(-0.14, 0, 0);
  const tempProbeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.15,
    roughness: 0.2,
    metalness: 0.92,
  });
  const probeRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 0.12, 16),
    tempProbeMat,
  );
  probeRod.rotation.z = Math.PI / 2;
  tmpProbe.add(probeRod);
  registerPart(
    tempGroup,
    tmpProbe,
    'temp_sensor',
    'thermal_probe',
    new THREE.Vector3(-0.28, 0, 0),
  );

  // 4e. Terminal / Connector & Wiring Harness
  const tmpWire = new THREE.Group();
  tmpWire.position.set(0.11, 0, 0);
  const termPlug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.06, 14),
    copperMat.clone(),
  );
  termPlug.rotation.z = Math.PI / 2;
  tmpWire.add(termPlug);
  registerPart(
    tempGroup,
    tmpWire,
    'temp_sensor',
    'wiring_harness',
    new THREE.Vector3(0.22, 0, 0),
  );

  addDeviceBeacon(tempGroup, 'temp_sensor', new THREE.Vector3(0, 0.09, 0.05));

  // =========================================================================
  // 5. SENSOR UDARA (Wall near HVAC & Equipment Zone [-2.35, 2.55, -2.55])
  // =========================================================================
  const airGroup = new THREE.Group();
  airGroup.position.set(-2.35, 2.55, -2.55);
  airGroup.scale.setScalar(1.45);
  root.add(airGroup);

  // 5a. Signal Processor PCB & Output Interface
  const airPcb = new THREE.Group();
  airPcb.position.set(0, 0, -0.04);
  const airBoard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.02), pcbMat);
  airPcb.add(airBoard);
  registerPart(
    airGroup,
    airPcb,
    'air_sensor',
    'processor_pcb',
    new THREE.Vector3(0, 0, -0.24),
  );

  // 5b. Optical / Laser Particulate Element
  const airLaser = new THREE.Group();
  airLaser.position.set(-0.05, 0.02, 0.01);
  const laserDiode = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.05, 14),
    copperMat.clone(),
  );
  laserDiode.rotation.z = Math.PI / 2;
  const airLaserBeamMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.75,
  });
  const laserBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, 0.1, 8),
    airLaserBeamMat,
  );
  laserBeam.rotation.z = Math.PI / 2;
  laserBeam.position.x = 0.05;
  airLaser.add(laserDiode, laserBeam);
  registerPart(
    airGroup,
    airLaser,
    'air_sensor',
    'laser_pm_element',
    new THREE.Vector3(-0.22, 0.12, 0.08),
  );

  // 5c. Airflow / Thermal Anemometer Element
  const airFlow = new THREE.Group();
  airFlow.position.set(0.06, 0.04, 0.02);
  const anemometer = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.05, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    }),
  );
  airFlow.add(anemometer);
  registerPart(
    airGroup,
    airFlow,
    'air_sensor',
    'airflow_element',
    new THREE.Vector3(0.22, 0.14, 0.08),
  );

  // 5d. Micro-Fan / Convection Guide
  const airFanGroup = new THREE.Group();
  airFanGroup.position.set(0, -0.04, 0.03);
  const fanShroud = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.008, 8, 20),
    darkMetalMat.clone(),
  );
  const airFanRotor = new THREE.Group();
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, 0.014, 0.004),
      steelMat.clone(),
    );
    blade.rotation.z = (b * Math.PI) / 4;
    airFanRotor.add(blade);
  }
  airFanGroup.add(fanShroud, airFanRotor);
  registerPart(
    airGroup,
    airFanGroup,
    'air_sensor',
    'micro_fan',
    new THREE.Vector3(0, -0.18, 0.16),
  );

  // 5e. Intake Louver / Sampling Chamber
  const airLouver = new THREE.Group();
  airLouver.position.set(0, 0, 0.075);
  const frameBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.21, 0.028),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.6 }),
  );
  airLouver.add(frameBox);
  for (let s = -2; s <= 2; s++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.012, 0.034),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }),
    );
    slat.position.y = s * 0.032;
    airLouver.add(slat);
  }
  registerPart(
    airGroup,
    airLouver,
    'air_sensor',
    'intake_louver',
    new THREE.Vector3(0, 0, 0.34),
  );

  addDeviceBeacon(airGroup, 'air_sensor', new THREE.Vector3(0.11, 0.11, 0.09));

  // =========================================================================
  // 6. SENSOR ARUS (Clamped on 70V/100V Distribution Conduit [-0.55, 2.15, -2.52])
  // =========================================================================
  const currGroup = new THREE.Group();
  currGroup.position.set(-0.55, 2.15, -2.52);
  currGroup.scale.setScalar(1.45);
  root.add(currGroup);

  // 6a. Primary Conductor Feedthrough (70V/100V cable passing through toroid)
  const curFeed = new THREE.Group();
  const conductor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.34, 16),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.4 }),
  );
  conductor.rotation.z = Math.PI / 2;
  curFeed.add(conductor);
  registerPart(
    currGroup,
    curFeed,
    'current_sensor',
    'feedthrough',
    new THREE.Vector3(0, 0, 0.28),
  );

  // 6b. Current Sensing Core (Ferrite Toroid)
  const curCore = new THREE.Group();
  const currentCoreGlowMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.15,
    roughness: 0.45,
    metalness: 0.55,
  });
  const toroidCore = new THREE.Mesh(
    new THREE.TorusGeometry(0.072, 0.026, 16, 32),
    currentCoreGlowMat,
  );
  toroidCore.rotation.y = Math.PI / 2;
  curCore.add(toroidCore);
  registerPart(
    currGroup,
    curCore,
    'current_sensor',
    'sensing_core',
    new THREE.Vector3(-0.18, 0.14, 0),
  );

  // 6c. Hall Effect / Secondary Winding Element
  const curHall = new THREE.Group();
  curHall.position.set(0, 0.075, 0);
  const hallChip = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.028, 0.04),
    copperMat.clone(),
  );
  curHall.add(hallChip);
  registerPart(
    currGroup,
    curHall,
    'current_sensor',
    'hall_element',
    new THREE.Vector3(0, 0.28, 0),
  );

  // 6d. Amplifier & Isolation / Conditioning PCB
  const curIso = new THREE.Group();
  curIso.position.set(0, -0.11, 0);
  const isoHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.07, 0.11),
    darkMetalMat.clone(),
  );
  const isoBoard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.015, 0.085), pcbMat);
  isoBoard.position.y = 0.04;
  curIso.add(isoHousing, isoBoard);
  registerPart(
    currGroup,
    curIso,
    'current_sensor',
    'isolation_pcb',
    new THREE.Vector3(0, -0.16, 0),
  );

  // 6e. Output Terminals & Signal Cable
  const curOut = new THREE.Group();
  curOut.position.set(0.11, -0.11, 0);
  const outBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.075),
    new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5, metalness: 0.15 }),
  );
  curOut.add(outBlock);
  registerPart(
    currGroup,
    curOut,
    'current_sensor',
    'output_terminals',
    new THREE.Vector3(0.24, -0.18, 0),
  );

  addDeviceBeacon(currGroup, 'current_sensor', new THREE.Vector3(-0.1, -0.06, 0.07));

  const deviceGroups: Record<DeviceId, THREE.Group> = {
    speaker: speakerGroup,
    mic: micGroup,
    mixer: mixerGroup,
    temp_sensor: tempGroup,
    air_sensor: airGroup,
    current_sensor: currGroup,
  };

  const deviceWorldAnchors: Record<DeviceId, THREE.Vector3> = {
    speaker: new THREE.Vector3(1.8, 3.25, 1.2),
    mic: new THREE.Vector3(-1.05, 1.38, -1.05),
    mixer: new THREE.Vector3(0.05, 1.22, -1.05),
    temp_sensor: new THREE.Vector3(0.95, 1.15, -1.25),
    air_sensor: new THREE.Vector3(-2.35, 2.85, -2.55),
    current_sensor: new THREE.Vector3(-0.55, 2.45, -2.52),
  };

  return {
    root,
    deviceGroups,
    deviceWorldAnchors,
    parts,
    selectableMeshes,
    speakerCone: spkConeGroup,
    speakerWaves,
    speakerTapIndicator,
    micPttLedMat,
    micChimeRing,
    mixerChannel1Fader,
    mixerMainFader,
    mixerLedBars,
    tempProbeMat,
    airFanRotor,
    airLaserBeamMat,
    currentCoreGlowMat,
    beacons,
    beaconMeshes,
  };
}
