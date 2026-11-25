import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { AboutModal } from './components/AboutModal';
import { BottomDock } from './components/BottomDock';
import { ComponentInspector } from './components/ComponentInspector';
import { TopBar } from './components/TopBar';
import { Viewport3D } from './components/Viewport3D';
import { CAMERA_PRESETS, DEVICE_SPECS } from './data/devices';
import {
  applyAlarmScenarioPreset,
  computeTelemetry,
  DEFAULT_CONTROLS,
} from './simulation/engine';
import {
  clearPersistedSession,
  DEFAULT_UI_PREFERENCES,
  loadPersistedSession,
  savePersistedSession,
} from './storage/sessionStorage';
import {
  AlarmScenarioId,
  CameraPresetId,
  DeviceId,
  DockTab,
  SimulationControls,
  UiPreferences,
} from './types/twin';

const DEVICE_TO_PRESET: Record<DeviceId, CameraPresetId> = {
  speaker: 'speaker',
  mic: 'console',
  mixer: 'console',
  temp_sensor: 'temp_sensor',
  air_sensor: 'air_sensor',
  current_sensor: 'current_sensor',
};

export default function App() {
  // Hydrate initial simulation controls & UI preferences once from localStorage
  const [initialSession] = useState(() => loadPersistedSession());

  const [selectedDevice, setSelectedDevice] = useState<DeviceId | null>(
    initialSession.uiPreferences.selectedDevice,
  );
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    initialSession.uiPreferences.selectedComponentId,
  );
  const [explodePercent, setExplodePercent] = useState<number>(
    initialSession.uiPreferences.explodePercent,
  );
  const [explodeScope, setExplodeScope] = useState<'selected' | 'all'>(
    initialSession.uiPreferences.explodeScope,
  );
  const [xrayMode, setXrayMode] = useState<boolean>(
    initialSession.uiPreferences.xrayMode,
  );
  const [showLabels, setShowLabels] = useState<boolean>(
    initialSession.uiPreferences.showLabels,
  );
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(
    initialSession.uiPreferences.dockCollapsed,
  );
  const [activeDockTab, setActiveDockTab] = useState<DockTab>(
    initialSession.uiPreferences.activeDockTab,
  );
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);

  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>(
    initialSession.uiPreferences.cameraPreset,
  );
  const [cameraTriggerNonce, setCameraTriggerNonce] = useState<number>(0);

  const [controlsState, setControlsState] = useState<SimulationControls>(
    initialSession.controlsState,
  );
  const [integratedRunning, setIntegratedRunning] = useState<boolean>(false);
  const [integratedElapsedSec, setIntegratedElapsedSec] = useState<number>(0);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [liveMicActive, setLiveMicActive] = useState<boolean>(false);
  const [liveMicLevel, setLiveMicLevel] = useState<number>(0);
  const [liveMicError, setLiveMicError] = useState<string | null>(null);
  const [dismissedAlertBanner, setDismissedAlertBanner] =
    useState<boolean>(false);

  const integratedStartRef = useRef<number>(0);
  const lastCycleIndexRef = useRef<number>(-1);

  const uiPreferences = useMemo<UiPreferences>(
    () => ({
      selectedDevice,
      selectedComponentId,
      explodePercent,
      explodeScope,
      xrayMode,
      showLabels,
      dockCollapsed,
      cameraPreset,
      activeDockTab,
    }),
    [
      selectedDevice,
      selectedComponentId,
      explodePercent,
      explodeScope,
      xrayMode,
      showLabels,
      dockCollapsed,
      cameraPreset,
      activeDockTab,
    ],
  );

  // Latest ref for synchronous flush on beforeunload
  const latestSessionRef = useRef({ controlsState, uiPreferences });
  latestSessionRef.current = { controlsState, uiPreferences };

  // Debounced auto-save to localStorage whenever simulation controls or UI preferences change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      savePersistedSession(controlsState, uiPreferences);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [controlsState, uiPreferences]);

  useEffect(() => {
    const onBeforeUnload = () => {
      savePersistedSession(
        latestSessionRef.current.controlsState,
        latestSessionRef.current.uiPreferences,
      );
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Real-time simulation clock & live mic RMS polling
  useEffect(() => {
    const intervalMs = liveMicActive ? 60 : 100;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (liveMicActive) {
        setLiveMicLevel(soundEngine.getLiveMicLevel());
      } else {
        setLiveMicLevel(0);
      }
      if (integratedRunning) {
        const elapsedSec = (current - integratedStartRef.current) / 1000;
        setIntegratedElapsedSec(elapsedSec);
        const cycleIdx = Math.floor(elapsedSec / 8.0);
        if (cycleIdx !== lastCycleIndexRef.current) {
          lastCycleIndexRef.current = cycleIdx;
          soundEngine.playChime();
        }
      }
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [integratedRunning, liveMicActive]);

  const telemetry = useMemo(
    () =>
      computeTelemetry(
        controlsState,
        integratedRunning,
        integratedElapsedSec,
        nowMs,
        liveMicActive,
        liveMicLevel,
      ),
    [
      controlsState,
      integratedRunning,
      integratedElapsedSec,
      nowMs,
      liveMicActive,
      liveMicLevel,
    ],
  );

  // Sync Web Audio Engine (live laptop mic DSP + fallback synthetic tone + alarms)
  useEffect(() => {
    const tapPowerW =
      controlsState.speakerTap === '0.25W'
        ? 0.25
        : controlsState.speakerTap === '0.5W'
          ? 0.5
          : controlsState.speakerTap === '1W'
            ? 1.0
            : 2.0;

    soundEngine.updateLiveMicRouting({
      pttActive: telemetry.relayClosed,
      micGainDb: controlsState.micGainDb,
      mixerGain: controlsState.mixerGain,
      mixerEqLow: controlsState.mixerEqLow,
      mixerEqMid: controlsState.mixerEqMid,
      mixerEqHigh: controlsState.mixerEqHigh,
      channel1Fader: controlsState.channel1Fader,
      mainMixFader: controlsState.mainMixFader,
      speakerTapPowerW: tapPowerW,
      lineSupervisionOk: telemetry.lineSupervisionOk,
      monitorVolume: controlsState.monitorVolume,
      terminalEcho: controlsState.terminalEcho,
    });

    const activeVoice =
      telemetry.audioActive &&
      !telemetry.chimeActive &&
      telemetry.lineSupervisionOk;
    const normGain =
      (controlsState.channel1Fader / 100) * (controlsState.mainMixFader / 100);
    soundEngine.updatePaVoiceCarrier(activeVoice, normGain);
    soundEngine.syncAlarmLoop(telemetry.globalAlarm);
  }, [
    telemetry.audioActive,
    telemetry.chimeActive,
    telemetry.relayClosed,
    telemetry.lineSupervisionOk,
    telemetry.globalAlarm,
    controlsState,
    audioEnabled,
    liveMicActive,
  ]);

  useEffect(() => {
    return () => {
      soundEngine.dispose();
    };
  }, []);

  // Keyboard shortcuts: H = toggle dock, Escape = close modal/inspector
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((v) => !v);
      } else if (e.key === 'Escape') {
        if (aboutOpen) setAboutOpen(false);
        else setSelectedDevice(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [aboutOpen]);

  const handleToggleIntegrated = useCallback(() => {
    setIntegratedRunning((prev) => {
      const next = !prev;
      if (next) {
        integratedStartRef.current = Date.now();
        lastCycleIndexRef.current = 0;
        setIntegratedElapsedSec(0);
        soundEngine.playRelayClick();
        soundEngine.playChime();
      }
      return next;
    });
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      soundEngine.setEnabled(next);
      if (next && telemetry.chimeActive) {
        soundEngine.playChime();
      }
      return next;
    });
  }, [telemetry.chimeActive]);

  const handleToggleLiveMic = useCallback(async () => {
    if (liveMicActive) {
      soundEngine.stopLiveMic();
      setLiveMicActive(false);
      setLiveMicLevel(0);
      setLiveMicError(null);
      setControlsState((prev) => ({ ...prev, pttActive: false }));
      return;
    }

    setLiveMicError(null);
    soundEngine.setEnabled(true);
    setAudioEnabled(true);

    const res = await soundEngine.startLiveMic();
    if (res.ok) {
      setLiveMicActive(true);
      soundEngine.playRelayClick();
      soundEngine.playChime();
      setControlsState((prev) => ({
        ...prev,
        pttActive: true,
        chimeTriggeredAt: Date.now(),
      }));
    } else {
      setLiveMicActive(false);
      setLiveMicError(res.error ?? 'Gagal mengaktifkan mikrofon laptop.');
    }
  }, [liveMicActive]);

  const handleUpdateControls = useCallback(
    (patch: Partial<SimulationControls>) => {
      setControlsState((prev) => {
        if (patch.pttActive !== undefined && patch.pttActive !== prev.pttActive) {
          soundEngine.playRelayClick();
          if (patch.pttActive) {
            soundEngine.playChime();
            return {
              ...prev,
              ...patch,
              chimeTriggeredAt: Date.now(),
            };
          }
        }
        return { ...prev, ...patch };
      });
    },
    [],
  );

  const handleTriggerChime = useCallback(() => {
    soundEngine.setEnabled(true);
    setAudioEnabled(true);
    soundEngine.playChime();
    setControlsState((prev) => ({
      ...prev,
      chimeTriggeredAt: Date.now(),
    }));
  }, []);

  const handleApplyAlarmScenario = useCallback((scenario: AlarmScenarioId) => {
    setDismissedAlertBanner(false);
    setControlsState((prev) => applyAlarmScenarioPreset(prev, scenario));
  }, []);

  const handleSelectPart = useCallback(
    (deviceId: DeviceId, componentId: string | null) => {
      setSelectedDevice(deviceId);
      setSelectedComponentId(
        componentId ?? DEVICE_SPECS[deviceId].components[0].id,
      );
    },
    [],
  );

  const handleFocusDevice = useCallback((deviceId: DeviceId) => {
    setSelectedDevice(deviceId);
    setSelectedComponentId(DEVICE_SPECS[deviceId].components[0].id);
    setCameraPreset(DEVICE_TO_PRESET[deviceId]);
    setCameraTriggerNonce((n) => n + 1);
  }, []);

  const handleSelectCameraPreset = useCallback((presetId: CameraPresetId) => {
    setCameraPreset(presetId);
    setCameraTriggerNonce((n) => n + 1);
    const focus = CAMERA_PRESETS[presetId].focusDevice;
    if (focus) {
      setSelectedDevice(focus);
      setSelectedComponentId(DEVICE_SPECS[focus].components[0].id);
    } else if (presetId === 'overview') {
      setSelectedDevice(null);
    }
  }, []);

  const handleResetView = useCallback(() => {
    setCameraPreset('overview');
    setCameraTriggerNonce((n) => n + 1);
    setSelectedDevice(null);
    setSelectedComponentId(null);
    setExplodePercent(0);
    setXrayMode(false);
  }, []);

  const handleResetSessionDefaults = useCallback(() => {
    if (liveMicActive) {
      soundEngine.stopLiveMic();
      setLiveMicActive(false);
      setLiveMicLevel(0);
    }
    setIntegratedRunning(false);
    setDismissedAlertBanner(false);
    setControlsState({ ...DEFAULT_CONTROLS });
    setSelectedDevice(DEFAULT_UI_PREFERENCES.selectedDevice);
    setSelectedComponentId(DEFAULT_UI_PREFERENCES.selectedComponentId);
    setExplodePercent(DEFAULT_UI_PREFERENCES.explodePercent);
    setExplodeScope(DEFAULT_UI_PREFERENCES.explodeScope);
    setXrayMode(DEFAULT_UI_PREFERENCES.xrayMode);
    setShowLabels(DEFAULT_UI_PREFERENCES.showLabels);
    setDockCollapsed(DEFAULT_UI_PREFERENCES.dockCollapsed);
    setCameraPreset(DEFAULT_UI_PREFERENCES.cameraPreset);
    setActiveDockTab(DEFAULT_UI_PREFERENCES.activeDockTab);
    setCameraTriggerNonce((n) => n + 1);
    clearPersistedSession();
  }, [liveMicActive]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#12161F] text-[#F8FAFC] overflow-hidden">
      <TopBar
        integratedRunning={integratedRunning}
        audioEnabled={audioEnabled}
        liveMicActive={liveMicActive}
        showLabels={showLabels}
        xrayMode={xrayMode}
        globalAlarm={telemetry.globalAlarm}
        alertCount={telemetry.activeAlerts.length}
        onToggleIntegrated={handleToggleIntegrated}
        onToggleAudio={handleToggleAudio}
        onToggleLiveMic={handleToggleLiveMic}
        onToggleLabels={() => setShowLabels((v) => !v)}
        onToggleXray={() => setXrayMode((v) => !v)}
        onResetView={handleResetView}
        onOpenAbout={() => setAboutOpen(true)}
      />

      <main className="relative flex-1 min-h-0">
        <Viewport3D
          selectedDevice={selectedDevice}
          selectedComponentId={selectedComponentId}
          explodePercent={explodePercent}
          explodeScope={explodeScope}
          xrayMode={xrayMode}
          showLabels={showLabels}
          cameraPreset={cameraPreset}
          cameraTriggerNonce={cameraTriggerNonce}
          controlsState={controlsState}
          telemetry={telemetry}
          onSelectPart={handleSelectPart}
          onSelectDeviceLabel={handleFocusDevice}
        />

        {/* Mic Permission Error Toast if blocked */}
        {liveMicError && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D1216]/95 border border-red-500/60 text-xs text-red-200 shadow-xl">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{liveMicError}</span>
            <button
              type="button"
              onClick={() => setLiveMicError(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Alarm Notification Banner (Top-Left, only shown when alarm active) */}
        {telemetry.activeAlerts.length > 0 && !dismissedAlertBanner && (
          <div className="fixed top-14 left-4 z-20 w-[min(360px,90vw)] space-y-2">
            {telemetry.activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border shadow-xl text-xs ${
                  alert.level === 'critical'
                    ? 'bg-[#1D1216]/95 border-red-500/70 text-red-100'
                    : 'bg-[#1C1810]/95 border-amber-500/70 text-amber-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleFocusDevice(alert.deviceId)}
                    className="flex items-center gap-1.5 font-semibold text-left hover:underline cursor-pointer"
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 ${
                        alert.level === 'critical'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    />
                    <span>{alert.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedAlertBanner(true)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Tutup peringatan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">{alert.detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* Right Slide-In Component Inspector (Only visible when device selected) */}
        <ComponentInspector
          selectedDevice={selectedDevice}
          selectedComponentId={selectedComponentId}
          onSelectComponent={(cid) => setSelectedComponentId(cid)}
          onClose={() => setSelectedDevice(null)}
          controlsState={controlsState}
          telemetry={telemetry}
          explodePercent={explodePercent}
          onChangeExplodePercent={setExplodePercent}
        />

        {/* Unified Collapsible Bottom Control Dock */}
        <BottomDock
          collapsed={dockCollapsed}
          onToggleCollapse={() => setDockCollapsed((v) => !v)}
          selectedDevice={selectedDevice}
          onSelectDevice={handleFocusDevice}
          cameraPreset={cameraPreset}
          onSelectCameraPreset={handleSelectCameraPreset}
          explodePercent={explodePercent}
          onChangeExplodePercent={setExplodePercent}
          explodeScope={explodeScope}
          onChangeExplodeScope={setExplodeScope}
          controlsState={controlsState}
          onUpdateControls={handleUpdateControls}
          onTriggerChime={handleTriggerChime}
          onApplyAlarmScenario={handleApplyAlarmScenario}
          telemetry={telemetry}
          integratedRunning={integratedRunning}
          liveMicActive={liveMicActive}
          liveMicLevel={liveMicLevel}
          liveMicError={liveMicError}
          onToggleLiveMic={handleToggleLiveMic}
          activeTab={activeDockTab}
          onChangeTab={setActiveDockTab}
          onResetSessionDefaults={handleResetSessionDefaults}
        />
      </main>

      <AboutModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onSelectDevice={handleFocusDevice}
      />
    </div>
  );
}
