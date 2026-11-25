export type DeviceId =
  | 'speaker'
  | 'mic'
  | 'mixer'
  | 'temp_sensor'
  | 'air_sensor'
  | 'current_sensor';

export type AlarmLevel = 'normal' | 'warning' | 'critical';

export type CameraPresetId =
  | 'overview'
  | 'speaker'
  | 'console'
  | 'temp_sensor'
  | 'air_sensor'
  | 'current_sensor';

export type TapSetting = '0.25W' | '0.5W' | '1W' | '2W';
export type LineVoltage = '25V' | '70V' | '100V';
export type CurrentFaultMode = 'normal' | 'overload' | 'open_line';

export type AlarmScenarioId =
  | 'normal'
  | 'overheat'
  | 'air_quality'
  | 'overcurrent';

export interface SubComponentSpec {
  id: string;
  name: string;
  role: string;
  principle: string;
  specs: string;
}

export interface DeviceSpec {
  id: DeviceId;
  code: string;
  name: string;
  shortName: string;
  locationLabel: string;
  description: string;
  workingPrincipleTitle: string;
  signalChain: string[];
  components: SubComponentSpec[];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface SimulationControls {
  // Mic Paging
  pttActive: boolean;
  chimeTriggeredAt: number; // timestamp ms
  micGainDb: number;
  monitorVolume: number; // 0..1.5 speaker output monitor level
  terminalEcho: boolean;

  // 12-Channel Mixer
  mixerGain: number; // 0..100 (%)
  mixerEqLow: number; // -12..+12 dB
  mixerEqMid: number; // -12..+12 dB
  mixerEqHigh: number; // -12..+12 dB
  channel1Fader: number; // 0..100 (%)
  mainMixFader: number; // 0..100 (%)
  phantom48V: boolean;

  // Genesis PA Ceiling Speaker
  speakerTap: TapSetting;
  lineVoltage: LineVoltage;

  // Sensors (manual baseline / override)
  manualTempC: number; // 20..95
  manualDustUg: number; // 5..250
  manualAirflowMs: number; // 0.1..5.0
  manualCurrentA: number; // 0.0..12.0
  currentFaultMode: CurrentFaultMode;
}

export interface TelemetrySnapshot {
  // Audio chain
  audioActive: boolean;
  chimeActive: boolean;
  relayClosed: boolean;
  micOutputMv: number;
  mixerBusDb: number;
  ampOutputVrms: number;
  speakerPowerW: number;
  speakerImpedanceOhm: number;
  speakerSplDb: number;
  lineSupervisionOk: boolean;

  // Sensors
  temperatureC: number;
  dustUgM3: number;
  airflowMs: number;
  currentA: number;
  powerVa: number;

  // Alarms per device & global
  tempAlarm: AlarmLevel;
  airAlarm: AlarmLevel;
  currentAlarm: AlarmLevel;
  globalAlarm: AlarmLevel;
  activeAlerts: Array<{
    id: string;
    deviceId: DeviceId;
    level: AlarmLevel;
    title: string;
    detail: string;
    action: string;
  }>;
}

export interface ProjectedLabel {
  id: DeviceId;
  x: number;
  y: number;
  visible: boolean;
  alarm: AlarmLevel;
}

export type DockTab = 'camera' | 'sim' | 'alarm';

export interface UiPreferences {
  selectedDevice: DeviceId | null;
  selectedComponentId: string | null;
  explodePercent: number;
  explodeScope: 'selected' | 'all';
  xrayMode: boolean;
  showLabels: boolean;
  dockCollapsed: boolean;
  cameraPreset: CameraPresetId;
  activeDockTab: DockTab;
}

export interface PersistedSession {
  version: 1;
  controlsState: SimulationControls;
  uiPreferences: UiPreferences;
  updatedAt: number;
}

