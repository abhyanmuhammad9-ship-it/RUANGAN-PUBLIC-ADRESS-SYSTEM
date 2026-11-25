import { CAMERA_PRESETS, DEVICE_SPECS } from '../data/devices';
import { DEFAULT_CONTROLS } from '../simulation/engine';
import {
  CameraPresetId,
  CurrentFaultMode,
  DeviceId,
  DockTab,
  LineVoltage,
  PersistedSession,
  SimulationControls,
  TapSetting,
  UiPreferences,
} from '../types/twin';

const STORAGE_KEY = 'pa_bandara_digital_twin_session_v1';

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  selectedDevice: null,
  selectedComponentId: null,
  explodePercent: 0,
  explodeScope: 'selected',
  xrayMode: false,
  showLabels: true,
  dockCollapsed: false,
  cameraPreset: 'overview',
  activeDockTab: 'camera',
};

const VALID_DEVICES = new Set<DeviceId>(Object.keys(DEVICE_SPECS) as DeviceId[]);
const VALID_PRESETS = new Set<CameraPresetId>(
  Object.keys(CAMERA_PRESETS) as CameraPresetId[],
);
const VALID_TAPS = new Set<TapSetting>(['0.25W', '0.5W', '1W', '2W']);
const VALID_VOLTS = new Set<LineVoltage>(['25V', '70V', '100V']);
const VALID_FAULTS = new Set<CurrentFaultMode>([
  'normal',
  'overload',
  'open_line',
]);
const VALID_TABS = new Set<DockTab>(['camera', 'sim', 'alarm']);

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.min(max, Math.max(min, val));
}

function sanitizeControls(raw: unknown): SimulationControls {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONTROLS };
  const r = raw as Record<string, unknown>;

  return {
    pttActive: typeof r.pttActive === 'boolean' ? r.pttActive : DEFAULT_CONTROLS.pttActive,
    chimeTriggeredAt: 0, // Never auto-replay stale chime from previous session
    micGainDb: clampNum(r.micGainDb, 12, 40, DEFAULT_CONTROLS.micGainDb),
    monitorVolume: clampNum(r.monitorVolume, 0, 1.5, DEFAULT_CONTROLS.monitorVolume),
    terminalEcho:
      typeof r.terminalEcho === 'boolean'
        ? r.terminalEcho
        : DEFAULT_CONTROLS.terminalEcho,

    mixerGain: clampNum(r.mixerGain, 10, 100, DEFAULT_CONTROLS.mixerGain),
    mixerEqLow: clampNum(r.mixerEqLow, -12, 12, DEFAULT_CONTROLS.mixerEqLow),
    mixerEqMid: clampNum(r.mixerEqMid, -12, 12, DEFAULT_CONTROLS.mixerEqMid),
    mixerEqHigh: clampNum(r.mixerEqHigh, -12, 12, DEFAULT_CONTROLS.mixerEqHigh),
    channel1Fader: clampNum(
      r.channel1Fader,
      0,
      100,
      DEFAULT_CONTROLS.channel1Fader,
    ),
    mainMixFader: clampNum(r.mainMixFader, 0, 100, DEFAULT_CONTROLS.mainMixFader),
    phantom48V:
      typeof r.phantom48V === 'boolean'
        ? r.phantom48V
        : DEFAULT_CONTROLS.phantom48V,

    speakerTap: VALID_TAPS.has(r.speakerTap as TapSetting)
      ? (r.speakerTap as TapSetting)
      : DEFAULT_CONTROLS.speakerTap,
    lineVoltage: VALID_VOLTS.has(r.lineVoltage as LineVoltage)
      ? (r.lineVoltage as LineVoltage)
      : DEFAULT_CONTROLS.lineVoltage,

    manualTempC: clampNum(r.manualTempC, 20, 95, DEFAULT_CONTROLS.manualTempC),
    manualDustUg: clampNum(r.manualDustUg, 5, 250, DEFAULT_CONTROLS.manualDustUg),
    manualAirflowMs: clampNum(
      r.manualAirflowMs,
      0.1,
      5.0,
      DEFAULT_CONTROLS.manualAirflowMs,
    ),
    manualCurrentA: clampNum(
      r.manualCurrentA,
      0.0,
      12.0,
      DEFAULT_CONTROLS.manualCurrentA,
    ),
    currentFaultMode: VALID_FAULTS.has(r.currentFaultMode as CurrentFaultMode)
      ? (r.currentFaultMode as CurrentFaultMode)
      : DEFAULT_CONTROLS.currentFaultMode,
  };
}

function sanitizeUiPreferences(raw: unknown): UiPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_UI_PREFERENCES };
  const r = raw as Record<string, unknown>;

  const selectedDevice = VALID_DEVICES.has(r.selectedDevice as DeviceId)
    ? (r.selectedDevice as DeviceId)
    : null;

  let selectedComponentId: string | null = null;
  if (selectedDevice && typeof r.selectedComponentId === 'string') {
    const validComp = DEVICE_SPECS[selectedDevice].components.some(
      (c) => c.id === r.selectedComponentId,
    );
    selectedComponentId = validComp
      ? r.selectedComponentId
      : DEVICE_SPECS[selectedDevice].components[0].id;
  }

  return {
    selectedDevice,
    selectedComponentId,
    explodePercent: clampNum(
      r.explodePercent,
      0,
      100,
      DEFAULT_UI_PREFERENCES.explodePercent,
    ),
    explodeScope:
      r.explodeScope === 'all' || r.explodeScope === 'selected'
        ? r.explodeScope
        : DEFAULT_UI_PREFERENCES.explodeScope,
    xrayMode:
      typeof r.xrayMode === 'boolean'
        ? r.xrayMode
        : DEFAULT_UI_PREFERENCES.xrayMode,
    showLabels:
      typeof r.showLabels === 'boolean'
        ? r.showLabels
        : DEFAULT_UI_PREFERENCES.showLabels,
    dockCollapsed:
      typeof r.dockCollapsed === 'boolean'
        ? r.dockCollapsed
        : DEFAULT_UI_PREFERENCES.dockCollapsed,
    cameraPreset: VALID_PRESETS.has(r.cameraPreset as CameraPresetId)
      ? (r.cameraPreset as CameraPresetId)
      : DEFAULT_UI_PREFERENCES.cameraPreset,
    activeDockTab: VALID_TABS.has(r.activeDockTab as DockTab)
      ? (r.activeDockTab as DockTab)
      : DEFAULT_UI_PREFERENCES.activeDockTab,
  };
}

export function loadPersistedSession(): {
  controlsState: SimulationControls;
  uiPreferences: UiPreferences;
  restored: boolean;
} {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        controlsState: { ...DEFAULT_CONTROLS },
        uiPreferences: { ...DEFAULT_UI_PREFERENCES },
        restored: false,
      };
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        controlsState: { ...DEFAULT_CONTROLS },
        uiPreferences: { ...DEFAULT_UI_PREFERENCES },
        restored: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    if (!parsed || parsed.version !== 1) {
      return {
        controlsState: { ...DEFAULT_CONTROLS },
        uiPreferences: { ...DEFAULT_UI_PREFERENCES },
        restored: false,
      };
    }
    return {
      controlsState: sanitizeControls(parsed.controlsState),
      uiPreferences: sanitizeUiPreferences(parsed.uiPreferences),
      restored: true,
    };
  } catch {
    return {
      controlsState: { ...DEFAULT_CONTROLS },
      uiPreferences: { ...DEFAULT_UI_PREFERENCES },
      restored: false,
    };
  }
}

export function savePersistedSession(
  controlsState: SimulationControls,
  uiPreferences: UiPreferences,
): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const payload: PersistedSession = {
      version: 1,
      controlsState,
      uiPreferences,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / privacy mode errors gracefully
  }
}

export function clearPersistedSession(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore gracefully
  }
}
