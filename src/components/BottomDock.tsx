import React from 'react';
import {
  AlertTriangle,
  BellRing,
  Camera,
  ChevronDown,
  ChevronUp,
  Layers,
  Mic,
  Radio,
  Sliders,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { CAMERA_PRESETS, DEVICE_SPECS } from '../data/devices';
import {
  AlarmScenarioId,
  CameraPresetId,
  CurrentFaultMode,
  DeviceId,
  DockTab,
  LineVoltage,
  SimulationControls,
  TapSetting,
  TelemetrySnapshot,
} from '../types/twin';

interface BottomDockProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedDevice: DeviceId | null;
  onSelectDevice: (id: DeviceId) => void;
  cameraPreset: CameraPresetId;
  onSelectCameraPreset: (id: CameraPresetId) => void;
  explodePercent: number;
  onChangeExplodePercent: (val: number) => void;
  explodeScope: 'selected' | 'all';
  onChangeExplodeScope: (scope: 'selected' | 'all') => void;
  controlsState: SimulationControls;
  onUpdateControls: (patch: Partial<SimulationControls>) => void;
  onTriggerChime: () => void;
  onApplyAlarmScenario: (scenario: AlarmScenarioId) => void;
  telemetry: TelemetrySnapshot;
  integratedRunning: boolean;
  liveMicActive: boolean;
  liveMicLevel: number;
  liveMicError: string | null;
  onToggleLiveMic: () => void;
  activeTab: DockTab;
  onChangeTab: (tab: DockTab) => void;
  onResetSessionDefaults: () => void;
}

const DEVICE_ORDER: DeviceId[] = [
  'speaker',
  'mic',
  'mixer',
  'temp_sensor',
  'air_sensor',
  'current_sensor',
];

export const BottomDock: React.FC<BottomDockProps> = ({
  collapsed,
  onToggleCollapse,
  selectedDevice,
  onSelectDevice,
  cameraPreset,
  onSelectCameraPreset,
  explodePercent,
  onChangeExplodePercent,
  explodeScope,
  onChangeExplodeScope,
  controlsState,
  onUpdateControls,
  onTriggerChime,
  onApplyAlarmScenario,
  telemetry,
  integratedRunning,
  liveMicActive,
  liveMicLevel,
  liveMicError,
  onToggleLiveMic,
  activeTab,
  onChangeTab,
  onResetSessionDefaults,
}) => {
  const simDevice: DeviceId = selectedDevice ?? 'mic';

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(1020px,95vw)] flex flex-col items-center">
      {/* Collapse / Expand Handle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1 rounded-t-lg bg-[#111622]/95 border border-b-0 border-slate-700/60 text-xs font-medium text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tampilkan Kontrol</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sembunyikan Kontrol</span>
          </>
        )}
      </button>

      {/* Main Dock Surface */}
      {!collapsed && (
        <div className="pointer-events-auto w-full rounded-xl bg-[#0F141F]/95 border border-slate-700/60 shadow-2xl overflow-hidden">
          {/* Tab Header Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-slate-800/90 bg-[#0B0F18]/80">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChangeTab('camera')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Kamera & Exploded View</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('sim')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'sim'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulasi Alat</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('alarm')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'alarm'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Skenario Alarm</span>
              </button>
            </div>

            {/* Compact Live Telemetry Strip */}
            <div className="hidden md:flex items-center gap-3 text-[11px] font-mono-tabular text-slate-300">
              <span>
                SPL: <strong className="text-cyan-300">{telemetry.speakerSplDb} dB</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span>
                Suhu:{' '}
                <strong
                  className={
                    telemetry.tempAlarm === 'critical'
                      ? 'text-red-400'
                      : telemetry.tempAlarm === 'warning'
                        ? 'text-amber-300'
                        : 'text-slate-100'
                  }
                >
                  {telemetry.temperatureC}°C
                </strong>
              </span>
              <span className="text-slate-600">·</span>
              <span>
                Debu:{' '}
                <strong
                  className={
                    telemetry.airAlarm === 'critical'
                      ? 'text-red-400'
                      : telemetry.airAlarm === 'warning'
                        ? 'text-amber-300'
                        : 'text-slate-100'
                  }
                >
                  {telemetry.dustUgM3} µg/m³
                </strong>
              </span>
              <span className="text-slate-600">·</span>
              <span>
                Arus:{' '}
                <strong
                  className={
                    telemetry.currentAlarm === 'critical'
                      ? 'text-red-400'
                      : telemetry.currentAlarm === 'warning'
                        ? 'text-amber-300'
                        : 'text-slate-100'
                  }
                >
                  {telemetry.currentA} A
                </strong>
              </span>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={onResetSessionDefaults}
                title="Kembalikan seluruh kontrol simulasi & preferensi UI ke pengaturan awal"
                className="font-sans px-2 py-0.5 rounded border border-slate-700 bg-slate-800/80 text-[11px] font-medium text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer whitespace-nowrap"
              >
                Reset Default
              </button>
            </div>
          </div>

          {/* Tab Body */}
          <div className="p-4">
            {/* TAB 1: CAMERA & EXPLODED VIEW */}
            {activeTab === 'camera' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Camera Presets */}
                <div className="lg:col-span-7 flex flex-col gap-2">
                  <span className="text-[11px] font-medium text-slate-400">
                    Preset Kamera Ruangan & Fokus Perangkat
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((pid) => {
                      const preset = CAMERA_PRESETS[pid];
                      const active = cameraPreset === pid;
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => onSelectCameraPreset(pid)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-semibold'
                              : 'bg-slate-800/70 text-slate-200 border-slate-700 hover:border-cyan-400/50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exploded View Controls */}
                <div className="lg:col-span-5 flex flex-col gap-2 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Exploded View ({explodePercent}%)
                    </span>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-700/70">
                      <button
                        type="button"
                        onClick={() => onChangeExplodeScope('selected')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                          explodeScope === 'selected'
                            ? 'bg-cyan-500/25 text-cyan-200'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Alat Fokus
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeExplodeScope('all')}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                          explodeScope === 'all'
                            ? 'bg-cyan-500/25 text-cyan-200'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Semua 6 Alat
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={explodePercent}
                      onChange={(e) => onChangeExplodePercent(Number(e.target.value))}
                      className="studio-slider flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => onChangeExplodePercent(explodePercent > 0 ? 0 : 75)}
                      className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-200 hover:border-cyan-400/50 whitespace-nowrap cursor-pointer"
                    >
                      {explodePercent > 0 ? 'Rakit' : 'Bedah 75%'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {explodeScope === 'all'
                      ? 'Membedah seluruh 6 perangkat di ruangan.'
                      : selectedDevice
                        ? `Membedah: ${DEVICE_SPECS[selectedDevice].name}`
                        : 'Pilih perangkat di 3D atau preset untuk membedah komponen.'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: INDIVIDUAL DEVICE SIMULATION */}
            {activeTab === 'sim' && (
              <div className="flex flex-col gap-3">
                {/* Device Selector Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {DEVICE_ORDER.map((id) => {
                      const active = simDevice === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onSelectDevice(id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                              : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {DEVICE_SPECS[id].shortName}
                        </button>
                      );
                    })}
                  </div>
                  {integratedRunning && (
                    <span className="text-[11px] font-medium text-amber-300">
                      Mode Simulasi Gabungan 6 Alat Aktif
                    </span>
                  )}
                </div>

                {/* Per-Device Interactive Simulation Controls */}
                {simDevice === 'mic' && (
                  <div className="space-y-2 bg-[#0B0F18]/70 p-3 rounded-lg border border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={onToggleLiveMic}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            liveMicActive
                              ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                              : 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/30'
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>
                            {liveMicActive ? 'Matikan Mic Laptop' : 'Bicara (Mic Laptop)'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateControls({ pttActive: !controlsState.pttActive })
                          }
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            controlsState.pttActive || telemetry.relayClosed
                              ? 'bg-cyan-400 text-slate-950'
                              : 'bg-slate-800 text-slate-100 border border-slate-600 hover:border-cyan-400'
                          }`}
                        >
                          {controlsState.pttActive ? 'PTT ON' : 'Tekan PTT'}
                        </button>
                        <button
                          type="button"
                          onClick={onTriggerChime}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-amber-500/20 border border-amber-400/50 text-amber-200 hover:bg-amber-500/30 transition-colors cursor-pointer"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          <span>Chime</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>Preamp Gain</span>
                          <span className="font-mono-tabular text-cyan-300">
                            +{controlsState.micGainDb} dB
                          </span>
                        </div>
                        <input
                          type="range"
                          min={12}
                          max={40}
                          value={controlsState.micGainDb}
                          onChange={(e) =>
                            onUpdateControls({ micGainDb: Number(e.target.value) })
                          }
                          className="studio-slider"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>Volume Speaker Laptop</span>
                          <span className="font-mono-tabular text-amber-300">
                            {Math.round(controlsState.monitorVolume * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={150}
                          value={Math.round(controlsState.monitorVolume * 100)}
                          onChange={(e) =>
                            onUpdateControls({
                              monitorVolume: Number(e.target.value) / 100,
                            })
                          }
                          className="studio-slider amber"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular text-slate-300">
                        <div>
                          <div>
                            Relay:{' '}
                            <strong
                              className={
                                telemetry.relayClosed ? 'text-cyan-300' : 'text-slate-400'
                              }
                            >
                              {telemetry.relayClosed ? 'AKTIF' : 'STANDBY'}
                            </strong>
                          </div>
                          <div>
                            Out:{' '}
                            <strong className="text-amber-300">
                              {telemetry.micOutputMv} mV
                            </strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateControls({
                              terminalEcho: !controlsState.terminalEcho,
                            })
                          }
                          className={`px-2 py-1 rounded text-[11px] font-sans font-medium border cursor-pointer ${
                            controlsState.terminalEcho
                              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          Gema PA: {controlsState.terminalEcho ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Real-time Microphone Level Bar & Status */}
                    {liveMicActive && (
                      <div className="flex items-center gap-3 pt-1 text-[11px]">
                        <span className="text-emerald-300 font-medium whitespace-nowrap">
                          Suara Mic Laptop:
                        </span>
                        <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 transition-transform duration-75 origin-left"
                            style={{
                              transform: `scaleX(${Math.max(0.02, liveMicLevel)})`,
                            }}
                          />
                        </div>
                        <span className="font-mono-tabular text-slate-300 whitespace-nowrap">
                          {controlsState.pttActive
                            ? 'Terdengar di Speaker Laptop'
                            : 'Aktifkan PTT agar suara terdengar'}
                        </span>
                      </div>
                    )}

                    {liveMicError && (
                      <div className="text-[11px] text-red-300 pt-1">
                        {liveMicError}
                      </div>
                    )}
                  </div>
                )}

                {simDevice === 'mixer' && (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-center bg-[#0B0F18]/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>CH1 Gain</span>
                        <span className="font-mono-tabular text-cyan-300">
                          {controlsState.mixerGain}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={controlsState.mixerGain}
                        onChange={(e) =>
                          onUpdateControls({ mixerGain: Number(e.target.value) })
                        }
                        className="studio-slider"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>EQ Low</span>
                        <span className="font-mono-tabular text-slate-200">
                          {controlsState.mixerEqLow > 0
                            ? `+${controlsState.mixerEqLow}`
                            : controlsState.mixerEqLow}{' '}
                          dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        value={controlsState.mixerEqLow}
                        onChange={(e) =>
                          onUpdateControls({ mixerEqLow: Number(e.target.value) })
                        }
                        className="studio-slider"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>EQ Mid</span>
                        <span className="font-mono-tabular text-slate-200">
                          {controlsState.mixerEqMid > 0
                            ? `+${controlsState.mixerEqMid}`
                            : controlsState.mixerEqMid}{' '}
                          dB
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        value={controlsState.mixerEqMid}
                        onChange={(e) =>
                          onUpdateControls({ mixerEqMid: Number(e.target.value) })
                        }
                        className="studio-slider"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>CH1 Fader</span>
                        <span className="font-mono-tabular text-cyan-300">
                          {controlsState.channel1Fader}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={controlsState.channel1Fader}
                        onChange={(e) =>
                          onUpdateControls({ channel1Fader: Number(e.target.value) })
                        }
                        className="studio-slider"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-slate-300">
                        <span>Main Mix</span>
                        <span className="font-mono-tabular text-amber-300">
                          {controlsState.mainMixFader}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={controlsState.mainMixFader}
                        onChange={(e) =>
                          onUpdateControls({ mainMixFader: Number(e.target.value) })
                        }
                        className="studio-slider amber"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateControls({ phantom48V: !controlsState.phantom48V })
                        }
                        className={`px-2 py-1 rounded text-[11px] font-semibold border cursor-pointer ${
                          controlsState.phantom48V
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        +48V Phantom: {controlsState.phantom48V ? 'ON' : 'OFF'}
                      </button>
                      <div className="text-[11px] font-mono-tabular text-cyan-300">
                        Bus: {telemetry.mixerBusDb} dBu
                      </div>
                    </div>
                  </div>
                )}

                {simDevice === 'speaker' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-[#0B0F18]/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-slate-400">
                        Wattage Tap Selector Switch
                      </span>
                      <div className="flex gap-1">
                        {(['0.25W', '0.5W', '1W', '2W'] as TapSetting[]).map((tap) => (
                          <button
                            key={tap}
                            type="button"
                            onClick={() => onUpdateControls({ speakerTap: tap })}
                            className={`flex-1 py-1 rounded text-xs font-mono-tabular border cursor-pointer ${
                              controlsState.speakerTap === tap
                                ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-semibold'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {tap === '0.25W' ? '1/4W' : tap === '0.5W' ? '1/2W' : tap}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-slate-400">
                        Jalur Tegangan Trafo Matching
                      </span>
                      <div className="flex gap-1">
                        {(['25V', '70V', '100V'] as LineVoltage[]).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => onUpdateControls({ lineVoltage: v })}
                            className={`flex-1 py-1 rounded text-xs font-mono-tabular border cursor-pointer ${
                              controlsState.lineVoltage === v
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] font-mono-tabular text-slate-300 space-y-0.5">
                      <div>
                        Impedansi Primer:{' '}
                        <strong className="text-cyan-300">
                          {telemetry.speakerImpedanceOhm} Ω
                        </strong>{' '}
                        · Out: <strong className="text-amber-300">{telemetry.speakerPowerW} W</strong>
                      </div>
                      <div>
                        SPL Ruangan:{' '}
                        <strong className="text-white">{telemetry.speakerSplDb} dB</strong> · DC
                        Supervisi:{' '}
                        <strong
                          className={
                            telemetry.lineSupervisionOk ? 'text-emerald-400' : 'text-red-400'
                          }
                        >
                          {telemetry.lineSupervisionOk ? 'OK' : 'PUTUS'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {simDevice === 'temp_sensor' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#0B0F18]/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                          Simulasi Suhu Zona Mixer / Amplifier
                        </span>
                        <span className="font-mono-tabular font-semibold text-cyan-300">
                          {telemetry.temperatureC} °C
                        </span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={92}
                        step={0.5}
                        value={controlsState.manualTempC}
                        onChange={(e) =>
                          onUpdateControls({ manualTempC: Number(e.target.value) })
                        }
                        className="studio-slider amber"
                      />
                    </div>
                    <div className="text-xs text-slate-300">
                      Ambang Peringatan: <span className="font-mono-tabular">55°C</span> · Kritis:{' '}
                      <span className="font-mono-tabular">72°C</span> · Status:{' '}
                      <strong
                        className={
                          telemetry.tempAlarm === 'critical'
                            ? 'text-red-400'
                            : telemetry.tempAlarm === 'warning'
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                        }
                      >
                        {telemetry.tempAlarm.toUpperCase()}
                      </strong>
                    </div>
                  </div>
                )}

                {simDevice === 'air_sensor' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#0B0F18]/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-cyan-400" />
                          Partikulat / Debu (PM2.5)
                        </span>
                        <span className="font-mono-tabular text-cyan-300">
                          {telemetry.dustUgM3} µg/m³
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={250}
                        value={controlsState.manualDustUg}
                        onChange={(e) =>
                          onUpdateControls({ manualDustUg: Number(e.target.value) })
                        }
                        className="studio-slider"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-slate-200">
                        <span>Aliran Udara (Airflow)</span>
                        <span className="font-mono-tabular text-amber-300">
                          {telemetry.airflowMs} m/s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={5.0}
                        step={0.05}
                        value={controlsState.manualAirflowMs}
                        onChange={(e) =>
                          onUpdateControls({ manualAirflowMs: Number(e.target.value) })
                        }
                        className="studio-slider amber"
                      />
                    </div>

                    <div className="text-xs text-slate-300">
                      Status Udara & Sirkulasi:{' '}
                      <strong
                        className={
                          telemetry.airAlarm === 'critical'
                            ? 'text-red-400'
                            : telemetry.airAlarm === 'warning'
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                        }
                      >
                        {telemetry.airAlarm.toUpperCase()}
                      </strong>
                    </div>
                  </div>
                )}

                {simDevice === 'current_sensor' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#0B0F18]/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-slate-200">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          Arus Beban Dasar Jalur
                        </span>
                        <span className="font-mono-tabular text-cyan-300">
                          {telemetry.currentA} A
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={12.0}
                        step={0.1}
                        value={controlsState.manualCurrentA}
                        onChange={(e) =>
                          onUpdateControls({
                            manualCurrentA: Number(e.target.value),
                            currentFaultMode: 'normal',
                          })
                        }
                        className="studio-slider amber"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-slate-400">
                        Simulasi Kondisi Jalur 70V/100V
                      </span>
                      <div className="flex gap-1">
                        {(
                          [
                            { id: 'normal', label: 'Normal' },
                            { id: 'overload', label: 'Overload' },
                            { id: 'open_line', label: 'Putus' },
                          ] as Array<{ id: CurrentFaultMode; label: string }>
                        ).map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() =>
                              onUpdateControls({ currentFaultMode: mode.id })
                            }
                            className={`flex-1 py-1 rounded text-xs font-medium border cursor-pointer ${
                              controlsState.currentFaultMode === mode.id
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs font-mono-tabular text-slate-300">
                      Daya Jalur: <strong className="text-white">{telemetry.powerVa} VA</strong> ·{' '}
                      <strong
                        className={
                          telemetry.currentAlarm === 'critical'
                            ? 'text-red-400'
                            : telemetry.currentAlarm === 'warning'
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                        }
                      >
                        {telemetry.currentAlarm.toUpperCase()}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ALARM SCENARIOS */}
            {activeTab === 'alarm' && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => onApplyAlarmScenario('normal')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 text-xs font-semibold cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Normal Operation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyAlarmScenario('overheat')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-red-500/50 bg-red-500/15 text-red-200 hover:bg-red-500/25 text-xs font-semibold cursor-pointer"
                  >
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Alarm Suhu Tinggi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyAlarmScenario('air_quality')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 text-xs font-semibold cursor-pointer"
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>Alarm Debu & Airflow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyAlarmScenario('overcurrent')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-red-500/50 bg-red-500/15 text-red-200 hover:bg-red-500/25 text-xs font-semibold cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Alarm Arus Berlebih</span>
                  </button>
                </div>

                {/* Manual Sensor Quick Tuning + Alert Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0B0F18]/70 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Suhu (°C)</span>
                      <span className="font-mono-tabular">{telemetry.temperatureC}°C</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={92}
                      step={0.5}
                      value={controlsState.manualTempC}
                      onChange={(e) =>
                        onUpdateControls({ manualTempC: Number(e.target.value) })
                      }
                      className="studio-slider amber"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Debu (µg/m³) / Airflow (m/s)</span>
                      <span className="font-mono-tabular">
                        {telemetry.dustUgM3} / {telemetry.airflowMs}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="range"
                        min={5}
                        max={250}
                        value={controlsState.manualDustUg}
                        onChange={(e) =>
                          onUpdateControls({ manualDustUg: Number(e.target.value) })
                        }
                        className="studio-slider flex-1"
                      />
                      <input
                        type="range"
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        value={controlsState.manualAirflowMs}
                        onChange={(e) =>
                          onUpdateControls({ manualAirflowMs: Number(e.target.value) })
                        }
                        className="studio-slider amber flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Arus Jalur (A)</span>
                      <span className="font-mono-tabular">{telemetry.currentA} A</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={12.0}
                      step={0.1}
                      value={controlsState.manualCurrentA}
                      onChange={(e) =>
                        onUpdateControls({
                          manualCurrentA: Number(e.target.value),
                          currentFaultMode: 'normal',
                        })
                      }
                      className="studio-slider amber"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
