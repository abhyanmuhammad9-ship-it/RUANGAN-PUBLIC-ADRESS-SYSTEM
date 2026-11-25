import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  X,
} from 'lucide-react';
import { DEVICE_SPECS } from '../data/devices';
import {
  AlarmLevel,
  DeviceId,
  SimulationControls,
  TelemetrySnapshot,
} from '../types/twin';

interface ComponentInspectorProps {
  selectedDevice: DeviceId | null;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string) => void;
  onClose: () => void;
  controlsState: SimulationControls;
  telemetry: TelemetrySnapshot;
  explodePercent: number;
  onChangeExplodePercent: (val: number) => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  selectedDevice,
  selectedComponentId,
  onSelectComponent,
  onClose,
  controlsState,
  telemetry,
  explodePercent,
  onChangeExplodePercent,
}) => {
  if (!selectedDevice) return null;

  const spec = DEVICE_SPECS[selectedDevice];
  const activeComp =
    spec.components.find((c) => c.id === selectedComponentId) ??
    spec.components[0];

  const deviceAlarm: AlarmLevel =
    selectedDevice === 'temp_sensor'
      ? telemetry.tempAlarm
      : selectedDevice === 'air_sensor'
        ? telemetry.airAlarm
        : selectedDevice === 'current_sensor'
          ? telemetry.currentAlarm
          : selectedDevice === 'speaker' && !telemetry.lineSupervisionOk
            ? 'critical'
            : selectedDevice === 'mixer' && telemetry.tempAlarm === 'critical'
              ? 'warning'
              : 'normal';

  const relevantAlerts = telemetry.activeAlerts.filter(
    (a) =>
      a.deviceId === selectedDevice ||
      (selectedDevice === 'speaker' && a.deviceId === 'current_sensor') ||
      (selectedDevice === 'mixer' && a.deviceId === 'temp_sensor'),
  );

  return (
    <aside className="fixed top-14 right-4 z-20 w-[min(390px,92vw)] max-h-[calc(100vh-190px)] flex flex-col rounded-xl bg-[#0F141F]/95 border border-slate-700/60 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-[#0B0F18]/90">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-cyan-400">
            <span>{spec.code}</span>
            <span className="text-slate-600">·</span>
            <span
              className={
                deviceAlarm === 'critical'
                  ? 'text-red-400 font-semibold'
                  : deviceAlarm === 'warning'
                    ? 'text-amber-300 font-semibold'
                    : 'text-emerald-400'
              }
            >
              {deviceAlarm === 'critical'
                ? 'ALARM KRITIS'
                : deviceAlarm === 'warning'
                  ? 'PERINGATAN'
                  : 'OPERASIONAL NORMAL'}
            </span>
          </div>
          <h2 className="font-display text-base font-semibold text-white truncate mt-0.5">
            {spec.name}
          </h2>
          <p className="text-[11px] text-slate-400 truncate">{spec.locationLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Inspector"
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-4">
        {/* Alert Diagnostic if active */}
        {relevantAlerts.length > 0 && (
          <div className="space-y-2">
            {relevantAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs ${
                  alert.level === 'critical'
                    ? 'bg-red-500/15 border-red-500/50 text-red-100'
                    : 'bg-amber-500/15 border-amber-500/50 text-amber-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{alert.title}</span>
                </div>
                <p className="mt-1 text-[11px] opacity-90">{alert.detail}</p>
                <p className="mt-1.5 text-[11px] font-medium text-white/90">
                  Tindakan: {alert.action}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Exploded Slider Quick Control */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Bedah Alat
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={explodePercent}
            onChange={(e) => onChangeExplodePercent(Number(e.target.value))}
            className="studio-slider flex-1"
          />
          <span className="font-mono-tabular text-xs text-cyan-300 w-9 text-right">
            {explodePercent}%
          </span>
        </div>

        {/* Selected Sub-Component Card */}
        <div className="p-3 rounded-lg bg-[#141B29] border border-cyan-500/35 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
            <Cpu className="w-3.5 h-3.5" />
            <span>Komponen Terpilih</span>
          </div>
          <h3 className="text-sm font-semibold text-white">{activeComp.name}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{activeComp.role}</p>
          <div className="pt-1.5 border-t border-slate-800 space-y-1">
            <div className="text-[11px] font-medium text-amber-300">
              Prinsip Kerja / Kegunaan:
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeComp.principle}
            </p>
          </div>
          <div className="text-[11px] font-mono-tabular text-slate-400 pt-1">
            {activeComp.specs}
          </div>
        </div>

        {/* Sub-Component Selector List */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-200">
            Daftar Bedah Komponen ({spec.components.length})
          </div>
          <div className="space-y-1">
            {spec.components.map((comp, idx) => {
              const isCurrent = comp.id === activeComp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => onSelectComponent(comp.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md border text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-100'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="truncate">
                    <span className="font-mono-tabular text-slate-500 mr-1.5">
                      {idx + 1}.
                    </span>
                    {comp.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Working Principle Flowchart */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-200">
            {spec.workingPrincipleTitle}
          </div>
          <div className="space-y-1.5">
            {spec.signalChain.map((step, idx) => (
              <div
                key={step}
                className="flex items-start gap-2 text-[11px] text-slate-300 bg-slate-900/50 px-2.5 py-1.5 rounded border border-slate-800/80"
              >
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-mono-tabular text-slate-400 mr-1">
                    0{idx + 1}
                  </strong>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Special Pinout & Relay Schematic for Mikrofon Paging */}
        {selectedDevice === 'mic' && (
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-amber-300">
              Pinout Konektor XLR 5-Pin & Sirkuit PTT/Chime
            </div>
            <div className="grid grid-cols-1 gap-1 text-[11px] font-mono-tabular text-slate-300">
              <div>Pin 1: Ground / Shield (Pelindung EMI)</div>
              <div>Pin 2: Audio Hot (+) Balanced</div>
              <div>Pin 3: Audio Cold (-) Balanced</div>
              <div>Pin 4: Kontrol PTT (+) → Relay Zona</div>
              <div>Pin 5: Return Relay / Chime Trigger (-)</div>
            </div>
          </div>
        )}

        {/* Live Telemetry Readout */}
        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span>Telemetri Real-Time</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          {selectedDevice === 'speaker' && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular text-slate-300">
              <div>Tap: {controlsState.speakerTap}</div>
              <div>Tegangan: {controlsState.lineVoltage}</div>
              <div>Impedansi: {telemetry.speakerImpedanceOhm} Ω</div>
              <div>SPL: {telemetry.speakerSplDb} dB</div>
            </div>
          )}
          {selectedDevice === 'mic' && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular text-slate-300">
              <div>PTT: {telemetry.relayClosed ? 'AKTIF' : 'STANDBY'}</div>
              <div>Chime: {telemetry.chimeActive ? 'BERBUNYI' : 'SIAP'}</div>
              <div>Gain: +{controlsState.micGainDb} dB</div>
              <div>Output: {telemetry.micOutputMv} mV</div>
            </div>
          )}
          {selectedDevice === 'mixer' && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular text-slate-300">
              <div>Bus Out: {telemetry.mixerBusDb} dBu</div>
              <div>Amp Out: {telemetry.ampOutputVrms} Vrms</div>
              <div>CH1 Fader: {controlsState.channel1Fader}%</div>
              <div>Phantom: {controlsState.phantom48V ? '+48V ON' : 'OFF'}</div>
            </div>
          )}
          {selectedDevice === 'temp_sensor' && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular text-slate-300">
              <div>Suhu Terukur: {telemetry.temperatureC} °C</div>
              <div>Status: {telemetry.tempAlarm.toUpperCase()}</div>
            </div>
          )}
          {selectedDevice === 'air_sensor' && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular text-slate-300">
              <div>Partikulat: {telemetry.dustUgM3} µg/m³</div>
              <div>Airflow: {telemetry.airflowMs} m/s</div>
            </div>
          )}
          {selectedDevice === 'current_sensor' && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-tabular text-slate-300">
              <div>Arus Jalur: {telemetry.currentA} A</div>
              <div>Beban Daya: {telemetry.powerVa} VA</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
