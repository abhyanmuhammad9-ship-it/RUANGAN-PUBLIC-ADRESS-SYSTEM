import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CAMERA_PRESETS, DEVICE_SPECS } from '../data/devices';
import { createProceduralTextures } from '../three/materials';
import { buildAirportRoom } from '../three/roomBuilder';
import { buildAllDevices } from '../three/devicesBuilder';
import {
  AlarmLevel,
  CameraPresetId,
  DeviceId,
  SimulationControls,
  TelemetrySnapshot,
} from '../types/twin';

interface Viewport3DProps {
  selectedDevice: DeviceId | null;
  selectedComponentId: string | null;
  explodePercent: number;
  explodeScope: 'selected' | 'all';
  xrayMode: boolean;
  showLabels: boolean;
  cameraPreset: CameraPresetId;
  cameraTriggerNonce: number;
  controlsState: SimulationControls;
  telemetry: TelemetrySnapshot;
  onSelectPart: (deviceId: DeviceId, componentId: string | null) => void;
  onSelectDeviceLabel: (deviceId: DeviceId) => void;
}

const _vec3 = new THREE.Vector3();
const _targetVec3 = new THREE.Vector3();
const _projVec = new THREE.Vector3();

function alarmColorHex(level: AlarmLevel): number {
  if (level === 'critical') return 0xef4444;
  if (level === 'warning') return 0xf59e0b;
  return 0x10b981;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  selectedDevice,
  selectedComponentId,
  explodePercent,
  explodeScope,
  xrayMode,
  showLabels,
  cameraPreset,
  cameraTriggerNonce,
  controlsState,
  telemetry,
  onSelectPart,
  onSelectDeviceLabel,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Record<DeviceId, HTMLButtonElement | null>>({
    speaker: null,
    mic: null,
    mixer: null,
    temp_sensor: null,
    air_sensor: null,
    current_sensor: null,
  });

  const [contextLost, setContextLost] = useState(false);

  // Mutable state bridge so WebGL loop never restarts on React state updates
  const stateRef = useRef({
    selectedDevice,
    selectedComponentId,
    explodePercent,
    explodeScope,
    xrayMode,
    showLabels,
    controlsState,
    telemetry,
    onSelectPart,
  });
  stateRef.current = {
    selectedDevice,
    selectedComponentId,
    explodePercent,
    explodeScope,
    xrayMode,
    showLabels,
    controlsState,
    telemetry,
    onSelectPart,
  };

  // Camera transition target ref
  const cameraAnimRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS.overview.position),
    target: new THREE.Vector3(...CAMERA_PRESETS.overview.target),
  });

  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset];
    cameraAnimRef.current.pos.set(...preset.position);
    cameraAnimRef.current.target.set(...preset.target);
    cameraAnimRef.current.active = true;
  }, [cameraPreset, cameraTriggerNonce]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Software WebGL guard
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12161f);
    scene.fog = new THREE.FogExp2(0x12161f, 0.032);

    // Studio reflection environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    scene.environment = envTex;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 80);
    camera.position.set(...CAMERA_PRESETS.overview.position);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.overview.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 0.65;
    controls.maxDistance = 14.5;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();

    const onControlStart = () => {
      cameraAnimRef.current.active = false;
    };
    controls.addEventListener('start', onControlStart);

    // Balanced 3-point studio + interior lighting rig
    const hemiLight = new THREE.HemisphereLight(0xcbd5e1, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.85);
    keyLight.position.set(4.5, 6.8, 5.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    const d = 6;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x22d3ee, 0.55);
    rimLight.position.set(-5.5, 4.0, -4.5);
    scene.add(rimLight);

    // Subtle interior ceiling fill light
    const consoleSpot = new THREE.PointLight(0xe0f2fe, 1.4, 9, 1.5);
    consoleSpot.position.set(-0.2, 3.1, -0.8);
    scene.add(consoleSpot);

    // Build textures, room, and all 6 operational devices
    const textures = createProceduralTextures(
      renderer.capabilities.getMaxAnisotropy(),
    );
    const room = buildAirportRoom(textures);
    scene.add(room.root);

    const devicesRig = buildAllDevices(textures);
    scene.add(devicesRig.root);

    // Pre-warm shaders on hardware GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for component inspection & hover
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let pointerDownX = 0;
    let pointerDownY = 0;
    let lastHoverCheck = 0;
    let hoveredMesh: THREE.Mesh | null = null;
    const originalEmissiveMap = new WeakMap<
      THREE.MeshStandardMaterial,
      { hex: number; intensity: number }
    >();

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const setHighlight = (mesh: THREE.Mesh | null, on: boolean) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat || !mat.emissive) return;
      if (on) {
        if (!originalEmissiveMap.has(mat)) {
          originalEmissiveMap.set(mat, {
            hex: mat.emissive.getHex(),
            intensity: mat.emissiveIntensity,
          });
        }
        mat.emissive.setHex(0x22d3ee);
        mat.emissiveIntensity = 0.55;
      } else {
        const orig = originalEmissiveMap.get(mat);
        if (orig) {
          mat.emissive.setHex(orig.hex);
          mat.emissiveIntensity = orig.intensity;
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 45) return;
      lastHoverCheck = now;
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(devicesRig.selectableMeshes, false);

      if (hoveredMesh && (!hits.length || hits[0].object !== hoveredMesh)) {
        setHighlight(hoveredMesh, false);
        hoveredMesh = null;
        renderer.domElement.style.cursor = 'grab';
      }
      if (hits.length > 0) {
        const hitMesh = hits[0].object as THREE.Mesh;
        if (hitMesh !== hoveredMesh) {
          hoveredMesh = hitMesh;
          setHighlight(hoveredMesh, true);
          renderer.domElement.style.cursor = 'pointer';
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (dist > 6) return; // Dragged camera, not a click
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(devicesRig.selectableMeshes, false);
      if (hits.length > 0) {
        const hit = hits[0].object;
        const devId = hit.userData.deviceId as DeviceId | undefined;
        const compId = (hit.userData.componentId as string | undefined) || null;
        if (devId) {
          stateRef.current.onSelectPart(devId, compId);
        }
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop state
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let currentXrayAlpha = 0;
    const partExplodeProgress = new Float32Array(devicesRig.parts.length);

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;
      const tel = st.telemetry;

      // 1. Smooth Camera Preset Interpolation
      if (cameraAnimRef.current.active) {
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          cameraAnimRef.current.pos.x,
          5.5,
          delta,
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          cameraAnimRef.current.pos.y,
          5.5,
          delta,
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          cameraAnimRef.current.pos.z,
          5.5,
          delta,
        );
        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          cameraAnimRef.current.target.x,
          6.0,
          delta,
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          cameraAnimRef.current.target.y,
          6.0,
          delta,
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          cameraAnimRef.current.target.z,
          6.0,
          delta,
        );

        if (
          camera.position.distanceTo(cameraAnimRef.current.pos) < 0.025 &&
          controls.target.distanceTo(cameraAnimRef.current.target) < 0.025
        ) {
          cameraAnimRef.current.active = false;
        }
      }
      controls.update();

      // 2. Smooth Exploded View per device / all devices
      const explodeRatio = st.explodePercent / 100;
      for (let i = 0; i < devicesRig.parts.length; i++) {
        const part = devicesRig.parts[i];
        const shouldExplode =
          st.explodeScope === 'all' ||
          (st.selectedDevice !== null && part.deviceId === st.selectedDevice);
        const targetFactor = shouldExplode ? explodeRatio : 0;
        partExplodeProgress[i] = THREE.MathUtils.damp(
          partExplodeProgress[i],
          targetFactor,
          8,
          delta,
        );
        const f = partExplodeProgress[i];
        part.group.position.set(
          part.basePos.x + part.explodeOffset.x * f,
          part.basePos.y + part.explodeOffset.y * f,
          part.basePos.z + part.explodeOffset.z * f,
        );
      }

      // 3. Smooth X-Ray / Cutaway Mode for architectural walls & ceiling
      currentXrayAlpha = THREE.MathUtils.damp(
        currentXrayAlpha,
        st.xrayMode ? 1 : 0,
        8,
        delta,
      );
      for (const item of room.xrayTargets) {
        if (currentXrayAlpha > 0.02) {
          item.material.transparent = true;
          item.material.opacity = THREE.MathUtils.lerp(
            item.baseOpacity,
            0.22,
            currentXrayAlpha,
          );
          item.material.depthWrite = false;
        } else {
          item.material.transparent = item.baseTransparent;
          item.material.opacity = item.baseOpacity;
          item.material.depthWrite = true;
        }
      }

      // 4. Device Operational Kinematics
      // 4a. Genesis Speaker cone excursion & sound waves radiating downward
      const audioPowerNorm = tel.audioActive && tel.lineSupervisionOk
        ? Math.min(1, tel.speakerPowerW / 2.0 + 0.15)
        : 0;
      if (audioPowerNorm > 0) {
        devicesRig.speakerCone.position.y =
          -0.06 + Math.sin(elapsed * 42) * 0.008 * audioPowerNorm;
      } else {
        devicesRig.speakerCone.position.y = THREE.MathUtils.damp(
          devicesRig.speakerCone.position.y,
          -0.06,
          12,
          delta,
        );
      }

      for (let w = 0; w < devicesRig.speakerWaves.length; w++) {
        const wave = devicesRig.speakerWaves[w];
        const wMat = wave.material as THREE.MeshBasicMaterial;
        if (audioPowerNorm > 0.02) {
          wave.visible = true;
          const phase = (elapsed * 0.85 + w * 0.25) % 1;
          wave.position.y = -0.22 - phase * 1.95;
          const s = 0.65 + phase * (1.8 + audioPowerNorm * 0.9);
          wave.scale.setScalar(s);
          wMat.opacity = (1 - phase) * 0.55 * audioPowerNorm;
          wMat.color.setHex(tel.chimeActive ? 0xf59e0b : 0x22d3ee);
        } else {
          wave.visible = false;
        }
      }

      // Speaker Tap selector indicator offset
      const tapIndex =
        st.controlsState.speakerTap === '0.25W'
          ? 0
          : st.controlsState.speakerTap === '0.5W'
            ? 1
            : st.controlsState.speakerTap === '1W'
              ? 2
              : 3;
      devicesRig.speakerTapIndicator.position.x = -0.021 + tapIndex * 0.014;

      // 4b. Mic Paging PTT LED & Chime Ring
      if (tel.chimeActive) {
        devicesRig.micPttLedMat.color.setHex(0xf59e0b);
        devicesRig.micPttLedMat.emissive.setHex(0xf59e0b);
        devicesRig.micPttLedMat.emissiveIntensity = 1.6;
        devicesRig.micChimeRing.visible = true;
        const cPhase = (elapsed * 2.2) % 1;
        devicesRig.micChimeRing.scale.setScalar(0.8 + cPhase * 2.2);
        (devicesRig.micChimeRing.material as THREE.MeshBasicMaterial).opacity =
          (1 - cPhase) * 0.85;
      } else if (tel.relayClosed) {
        devicesRig.micPttLedMat.color.setHex(0x22d3ee);
        devicesRig.micPttLedMat.emissive.setHex(0x22d3ee);
        devicesRig.micPttLedMat.emissiveIntensity = 1.4;
        devicesRig.micChimeRing.visible = false;
      } else {
        devicesRig.micPttLedMat.color.setHex(0x0e7490);
        devicesRig.micPttLedMat.emissive.setHex(0x0e7490);
        devicesRig.micPttLedMat.emissiveIntensity = 0.25;
        devicesRig.micChimeRing.visible = false;
      }

      // 4c. Mixer Faders & LED Meter Bridge + Amplifier Rack Bars
      devicesRig.mixerChannel1Fader.position.z =
        0.055 - (st.controlsState.channel1Fader / 100) * 0.11;
      devicesRig.mixerMainFader.position.z =
        0.055 - (st.controlsState.mainMixFader / 100) * 0.11;

      const meterNorm = tel.audioActive
        ? Math.min(1, Math.max(0.15, (tel.mixerBusDb + 40) / 44))
        : 0.04;
      devicesRig.mixerLedBars.forEach((bar, idx) => {
        const thresh = idx / devicesRig.mixerLedBars.length;
        const lit = meterNorm > thresh;
        (bar.material as THREE.MeshStandardMaterial).emissiveIntensity = lit
          ? 1.35
          : 0.1;
      });
      room.ampMeterBars.forEach((bar, idx) => {
        const thresh = idx / room.ampMeterBars.length;
        const lit = meterNorm > thresh && tel.lineSupervisionOk;
        (bar.material as THREE.MeshStandardMaterial).emissiveIntensity = lit
          ? 1.4
          : 0.12;
      });

      // 4d. Sensor Suhu Thermal Probe Color
      if (tel.tempAlarm === 'critical') {
        devicesRig.tempProbeMat.emissive.setHex(0xef4444);
        devicesRig.tempProbeMat.emissiveIntensity =
          0.9 + 0.5 * Math.sin(elapsed * 8);
      } else if (tel.tempAlarm === 'warning') {
        devicesRig.tempProbeMat.emissive.setHex(0xf59e0b);
        devicesRig.tempProbeMat.emissiveIntensity = 0.75;
      } else {
        devicesRig.tempProbeMat.emissive.setHex(0x22d3ee);
        devicesRig.tempProbeMat.emissiveIntensity = 0.2;
      }

      // 4e. Sensor Udara Micro-Fan rotation & Laser Beam
      const fanSpeed = Math.max(0.4, tel.airflowMs * 4.5);
      devicesRig.airFanRotor.rotation.z -= delta * fanSpeed;
      devicesRig.airLaserBeamMat.opacity =
        tel.airAlarm === 'normal'
          ? 0.45
          : 0.65 + 0.3 * Math.sin(elapsed * 9);

      // 4f. Sensor Arus Toroid Glow
      if (tel.currentAlarm === 'critical') {
        devicesRig.currentCoreGlowMat.emissive.setHex(0xef4444);
        devicesRig.currentCoreGlowMat.emissiveIntensity =
          0.9 + 0.5 * Math.sin(elapsed * 9);
      } else if (tel.currentAlarm === 'warning') {
        devicesRig.currentCoreGlowMat.emissive.setHex(0xf59e0b);
        devicesRig.currentCoreGlowMat.emissiveIntensity = 0.7;
      } else {
        devicesRig.currentCoreGlowMat.emissive.setHex(0x22d3ee);
        devicesRig.currentCoreGlowMat.emissiveIntensity =
          0.15 + Math.min(0.65, tel.currentA * 0.08);
      }

      // 5. Signal Pulse Beads Moving Along Room Conduits
      for (const beadInfo of room.signalPulseBeads) {
        let active = false;
        let speed = 0.55;
        if (beadInfo.kind === 'mic_to_mixer') {
          active = tel.audioActive;
          speed = 0.95;
        } else if (beadInfo.kind === 'mixer_to_speaker') {
          active = tel.audioActive && tel.lineSupervisionOk;
          speed = 0.45;
        } else {
          active = true; // Continuous sensor monitoring bus
          speed = 0.28;
        }
        beadInfo.mesh.visible = active;
        if (active) {
          beadInfo.phase = (beadInfo.phase + delta * speed) % 1;
          beadInfo.curve.getPointAt(beadInfo.phase, _vec3);
          beadInfo.mesh.position.copy(_vec3);
        }
      }

      // 6. Per-Device & Wall Alarm Beacons
      const devAlarms: Record<DeviceId, AlarmLevel> = {
        speaker:
          tel.currentAlarm === 'critical' && !tel.lineSupervisionOk
            ? 'critical'
            : 'normal',
        mic: 'normal',
        mixer: tel.tempAlarm === 'critical' ? 'warning' : 'normal',
        temp_sensor: tel.tempAlarm,
        air_sensor: tel.airAlarm,
        current_sensor: tel.currentAlarm,
      };
      (Object.keys(devAlarms) as DeviceId[]).forEach((id) => {
        const lvl = devAlarms[id];
        const bMat = devicesRig.beacons[id];
        bMat.color.setHex(alarmColorHex(lvl));
        bMat.emissive.setHex(alarmColorHex(lvl));
        bMat.emissiveIntensity =
          lvl === 'critical'
            ? 1.2 + 0.8 * Math.sin(elapsed * 10)
            : lvl === 'warning'
              ? 0.9 + 0.4 * Math.sin(elapsed * 5)
              : 0.45;
      });

      room.wallBeaconMat.color.setHex(alarmColorHex(tel.globalAlarm));
      room.wallBeaconMat.emissive.setHex(alarmColorHex(tel.globalAlarm));
      room.wallBeaconMat.emissiveIntensity =
        tel.globalAlarm === 'critical'
          ? 1.5 + 1.0 * Math.sin(elapsed * 10)
          : tel.globalAlarm === 'warning'
            ? 1.0 + 0.4 * Math.sin(elapsed * 5)
            : 0.45;

      // 7. World-to-Screen 3D Label Projection (Direct DOM Transform for 60fps)
      const cw = container.clientWidth || window.innerWidth;
      const ch = container.clientHeight || window.innerHeight;
      (Object.keys(devicesRig.deviceWorldAnchors) as DeviceId[]).forEach((id) => {
        const el = labelRefs.current[id];
        if (!el) return;
        if (!st.showLabels) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        _projVec.copy(devicesRig.deviceWorldAnchors[id]).project(camera);
        if (_projVec.z > 1 || _projVec.z < -1) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        const sx = ((_projVec.x + 1) / 2) * cw;
        const sy = ((-_projVec.y + 1) / 2) * ch;
        el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      });

      // Keep targetVec3 referenced cleanly (no unused warning)
      _targetVec3.copy(controls.target);

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlStart);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        onContextRestored,
      );
      controls.dispose();
      textures.dispose();
      envTex.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const deviceAlarmMap: Record<DeviceId, AlarmLevel> = {
    speaker:
      telemetry.currentAlarm === 'critical' && !telemetry.lineSupervisionOk
        ? 'critical'
        : 'normal',
    mic: 'normal',
    mixer: telemetry.tempAlarm === 'critical' ? 'warning' : 'normal',
    temp_sensor: telemetry.tempAlarm,
    air_sensor: telemetry.airAlarm,
    current_sensor: telemetry.currentAlarm,
  };

  return (
    <div className="relative w-full h-full bg-[#12161F]">
      {/* Dedicated WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* 3D Floating Device Labels */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        {(Object.keys(DEVICE_SPECS) as DeviceId[]).map((id, idx) => {
          const spec = DEVICE_SPECS[id];
          const isSelected = selectedDevice === id;
          const alarm = deviceAlarmMap[id];
          const borderClass =
            alarm === 'critical'
              ? 'border-red-500/80 text-red-100'
              : alarm === 'warning'
                ? 'border-amber-400/80 text-amber-100'
                : isSelected
                  ? 'border-cyan-400 text-cyan-100'
                  : 'border-slate-500/40 text-slate-200 hover:border-cyan-400/70';

          const liveMetric =
            id === 'speaker'
              ? `${controlsState.speakerTap} · ${telemetry.speakerSplDb} dB`
              : id === 'mic'
                ? telemetry.relayClosed
                  ? 'PTT AKTIF'
                  : 'Standby'
                : id === 'mixer'
                  ? `${telemetry.mixerBusDb} dB`
                  : id === 'temp_sensor'
                    ? `${telemetry.temperatureC}°C`
                    : id === 'air_sensor'
                      ? `${telemetry.dustUgM3} µg · ${telemetry.airflowMs} m/s`
                      : `${telemetry.currentA} A`;

          return (
            <button
              key={id}
              ref={(el) => {
                labelRefs.current[id] = el;
              }}
              onClick={() => onSelectDeviceLabel(id)}
              style={{ top: 0, left: 0, opacity: showLabels ? 1 : 0 }}
              className={`absolute flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0E131C]/92 border text-xs transition-colors duration-150 shadow-lg whitespace-nowrap ${borderClass}`}
            >
              <span className="font-mono-tabular text-[11px] font-semibold text-cyan-300">
                0{idx + 1}
              </span>
              <span className="font-medium">{spec.shortName}</span>
              <span className="text-slate-500">·</span>
              <span className="font-mono-tabular text-[11px] text-slate-300">
                {liveMetric}
              </span>
              {alarm !== 'normal' && (
                <span
                  className={`font-mono-tabular text-[10px] font-semibold px-1 rounded ${
                    alarm === 'critical'
                      ? 'bg-red-500/25 text-red-300'
                      : 'bg-amber-500/25 text-amber-300'
                  }`}
                >
                  {alarm === 'critical' ? 'KRITIS' : 'PERINGATAN'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Graceful WebGL context loss fallback */}
      {contextLost && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#12161F]/95 text-center p-6">
          <div className="max-w-md border border-slate-700 bg-[#181E2B] rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-white">
              Konteks WebGL Terhenti
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Perangkat grafis sedang memulihkan konteks 3D. Silakan muat ulang halaman jika tampilan tidak kembali otomatis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
