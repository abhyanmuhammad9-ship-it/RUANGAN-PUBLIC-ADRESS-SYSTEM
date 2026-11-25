import {
  AlarmLevel,
  AlarmScenarioId,
  SimulationControls,
  TapSetting,
  LineVoltage,
  TelemetrySnapshot,
} from '../types/twin';

export const DEFAULT_CONTROLS: SimulationControls = {
  pttActive: false,
  chimeTriggeredAt: 0,
  micGainDb: 26,
  monitorVolume: 0.85,
  terminalEcho: true,

  mixerGain: 68,
  mixerEqLow: 1,
  mixerEqMid: 3,
  mixerEqHigh: 2,
  channel1Fader: 75,
  mainMixFader: 78,
  phantom48V: true,

  speakerTap: '1W',
  lineVoltage: '70V',

  manualTempC: 36.5,
  manualDustUg: 22,
  manualAirflowMs: 2.4,
  manualCurrentA: 1.45,
  currentFaultMode: 'normal',
};

const TAP_WATTS: Record<TapSetting, number> = {
  '0.25W': 0.25,
  '0.5W': 0.5,
  '1W': 1.0,
  '2W': 2.0,
};

const LINE_VOLTS: Record<LineVoltage, number> = {
  '25V': 25,
  '70V': 70.7,
  '100V': 100,
};

export function computeTelemetry(
  controls: SimulationControls,
  integratedRunning: boolean,
  integratedElapsedSec: number,
  nowMs: number,
  liveMicActive = false,
  liveMicLevel = 0,
): TelemetrySnapshot {
  // Determine chime & PTT state (integrated simulation cycles smoothly)
  const chimeWindowMs = 1500;
  const chimeActiveManual = nowMs - controls.chimeTriggeredAt < chimeWindowMs;

  let effectivePtt = controls.pttActive;
  let chimeActive = chimeActiveManual;

  if (integratedRunning) {
    const cyclePos = integratedElapsedSec % 8.0;
    effectivePtt = cyclePos < 6.8;
    chimeActive = cyclePos < 1.6 || chimeActiveManual;
  }

  const relayClosed = effectivePtt || chimeActive;
  const audioActive = effectivePtt || chimeActive;

  // Mic output (mV) — driven by real laptop mic RMS when active!
  const voiceEnvelope = audioActive
    ? chimeActive
      ? 0.88
      : liveMicActive
        ? Math.max(0.06, Math.min(1.0, liveMicLevel))
        : 0.58 + 0.25 * Math.sin(nowMs * 0.011) * Math.cos(nowMs * 0.0047)
    : 0.02;

  const micGainFactor = Math.pow(10, (controls.micGainDb - 20) / 20);
  const micOutputMv = audioActive
    ? Number((14.5 * voiceEnvelope * micGainFactor).toFixed(1))
    : 0.2;

  // Mixer bus calculation
  const eqPresence = (controls.mixerEqMid * 0.4 + controls.mixerEqHigh * 0.25) / 12;
  const faderGain =
    (controls.mixerGain / 100) *
    (controls.channel1Fader / 100) *
    (controls.mainMixFader / 100);
  const activeSignalNorm = audioActive
    ? Math.min(1.15, Math.max(0.05, voiceEnvelope * faderGain * (1.35 + eqPresence)))
    : 0.03;

  const mixerBusDb = audioActive
    ? Number((-28 + activeSignalNorm * 32).toFixed(1))
    : -60.0;

  // Amplifier & 25V/70V/100V line
  const nominalV = LINE_VOLTS[controls.lineVoltage];
  const tapW = TAP_WATTS[controls.speakerTap];
  const ampOutputVrms =
    controls.currentFaultMode === 'open_line'
      ? 0
      : Number((nominalV * Math.min(1, activeSignalNorm)).toFixed(1));

  // Speaker transformer & acoustic output
  const lineSupervisionOk = controls.currentFaultMode !== 'open_line';
  const speakerImpedanceOhm = Math.round((nominalV * nominalV) / tapW);
  const speakerPowerW =
    audioActive && lineSupervisionOk
      ? Number((tapW * Math.min(1.1, activeSignalNorm * 1.15)).toFixed(2))
      : 0;

  // Genesis sensitivity ~92 dB @ 1W/1m
  const speakerSplDb =
    speakerPowerW > 0.01
      ? Number((92 + 10 * Math.log10(speakerPowerW)).toFixed(1))
      : 38.0; // ambient airport room floor

  // Sensors with realistic physical coupling during Integrated Simulation
  const thermalLoadBoost = integratedRunning
    ? 4.2 + faderGain * 3.5
    : audioActive
      ? 1.8
      : 0;
  const temperatureC = Number(
    (controls.manualTempC + thermalLoadBoost).toFixed(1),
  );

  const dustUgM3 = Number(controls.manualDustUg.toFixed(1));
  const airflowMs = Number(controls.manualAirflowMs.toFixed(2));

  // Current sensor combines baseline load + audio tap draw + fault overrides
  const audioCurrentDraw =
    audioActive && lineSupervisionOk ? (speakerPowerW / nominalV) * 8 + 0.35 * faderGain : 0;
  let currentA = controls.manualCurrentA + audioCurrentDraw;
  if (controls.currentFaultMode === 'overload') {
    currentA = Math.max(currentA, 10.6 + 0.4 * Math.sin(nowMs * 0.008));
  } else if (controls.currentFaultMode === 'open_line') {
    currentA = 0.02;
  }
  currentA = Number(currentA.toFixed(2));
  const powerVa = Number((currentA * (nominalV === 100 ? 100 : 70)).toFixed(1));

  // Alarm thresholds
  let tempAlarm: AlarmLevel = 'normal';
  if (temperatureC >= 72) tempAlarm = 'critical';
  else if (temperatureC >= 55) tempAlarm = 'warning';

  let airAlarm: AlarmLevel = 'normal';
  if (dustUgM3 >= 150 || airflowMs <= 0.5) airAlarm = 'critical';
  else if (dustUgM3 >= 75 || airflowMs <= 1.0) airAlarm = 'warning';

  let currentAlarm: AlarmLevel = 'normal';
  if (
    controls.currentFaultMode === 'overload' ||
    currentA >= 9.5 ||
    controls.currentFaultMode === 'open_line'
  ) {
    currentAlarm = 'critical';
  } else if (currentA >= 6.5) {
    currentAlarm = 'warning';
  }

  const priority = { normal: 0, warning: 1, critical: 2 };
  const maxVal = Math.max(
    priority[tempAlarm],
    priority[airAlarm],
    priority[currentAlarm],
  );
  const globalAlarm: AlarmLevel =
    maxVal === 2 ? 'critical' : maxVal === 1 ? 'warning' : 'normal';

  const activeAlerts: TelemetrySnapshot['activeAlerts'] = [];

  if (tempAlarm !== 'normal') {
    activeAlerts.push({
      id: 'alert-temp',
      deviceId: 'temp_sensor',
      level: tempAlarm,
      title:
        tempAlarm === 'critical'
          ? 'ALARM KRITIS: Suhu Overheat Terdeteksi!'
          : 'Peringatan: Suhu Peralatan Meningkat',
      detail: `Sensor suhu membaca ${temperatureC}°C pada zona PSU 12-Channel Mixer & rak amplifier.`,
      action:
        'Kurangi beban Main Mix Fader, periksa kipas pendingin rak, dan verifikasi sirkulasi udara.',
    });
  }

  if (airAlarm !== 'normal') {
    activeAlerts.push({
      id: 'alert-air',
      deviceId: 'air_sensor',
      level: airAlarm,
      title:
        airAlarm === 'critical'
          ? 'ALARM KRITIS: Kualitas Udara Buruk / Airflow Rendah!'
          : 'Peringatan: Debu Meningkat atau Sirkulasi Melemah',
      detail: `Partikulat terukur ${dustUgM3} µg/m³ dengan kecepatan aliran udara ${airflowMs} m/s.`,
      action:
        'Jadwalkan pembersihan filter rak peralatan & periksa saluran ventilasi HVAC ruang operator.',
    });
  }

  if (currentAlarm !== 'normal') {
    const isOpen = controls.currentFaultMode === 'open_line';
    activeAlerts.push({
      id: 'alert-current',
      deviceId: 'current_sensor',
      level: currentAlarm,
      title: isOpen
        ? 'ALARM KRITIS: Gangguan Jalur Terputus (Open Line)!'
        : currentAlarm === 'critical'
          ? 'ALARM KRITIS: Arus Berlebih / Overload Jalur PA!'
          : 'Peringatan: Beban Arus Mendekati Batas Aman',
      detail: isOpen
        ? `Arus jalur supervisi turun ke ${currentA} A (kabel jalur 70V/100V ke speaker terputus).`
        : `Sensor arus mendeteksi lonjakan beban ${currentA} A pada jalur distribusi ${controls.lineVoltage}.`,
      action: isOpen
        ? 'Periksa Terminal Block & DC Blocking Capacitor pada speaker serta sambungan conduit plafon.'
        : 'Periksa potensi hubung singkat (short) jalur speaker atau turunkan Wattage Tap / Main Gain.',
    });
  }

  return {
    audioActive,
    chimeActive,
    relayClosed,
    micOutputMv,
    mixerBusDb,
    ampOutputVrms,
    speakerPowerW,
    speakerImpedanceOhm,
    speakerSplDb,
    lineSupervisionOk,
    temperatureC,
    dustUgM3,
    airflowMs,
    currentA,
    powerVa,
    tempAlarm,
    airAlarm,
    currentAlarm,
    globalAlarm,
    activeAlerts,
  };
}

export function applyAlarmScenarioPreset(
  prev: SimulationControls,
  scenario: AlarmScenarioId,
): SimulationControls {
  switch (scenario) {
    case 'normal':
      return {
        ...prev,
        manualTempC: 36.5,
        manualDustUg: 22,
        manualAirflowMs: 2.4,
        manualCurrentA: 1.45,
        currentFaultMode: 'normal',
      };
    case 'overheat':
      return {
        ...prev,
        manualTempC: 78.5,
        manualDustUg: 28,
        manualAirflowMs: 1.9,
        manualCurrentA: 2.1,
        currentFaultMode: 'normal',
      };
    case 'air_quality':
      return {
        ...prev,
        manualTempC: 44.0,
        manualDustUg: 185,
        manualAirflowMs: 0.35,
        manualCurrentA: 1.5,
        currentFaultMode: 'normal',
      };
    case 'overcurrent':
      return {
        ...prev,
        manualTempC: 49.0,
        manualDustUg: 25,
        manualAirflowMs: 2.2,
        manualCurrentA: 10.8,
        currentFaultMode: 'overload',
      };
  }
}
