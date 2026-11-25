import React from 'react';
import {
  Activity,
  AlertTriangle,
  Eye,
  Info,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Square,
  Tag,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TEAM_IDENTITY } from '../data/devices';
import { AlarmLevel } from '../types/twin';

interface TopBarProps {
  integratedRunning: boolean;
  audioEnabled: boolean;
  liveMicActive: boolean;
  showLabels: boolean;
  xrayMode: boolean;
  globalAlarm: AlarmLevel;
  alertCount: number;
  onToggleIntegrated: () => void;
  onToggleAudio: () => void;
  onToggleLiveMic: () => void;
  onToggleLabels: () => void;
  onToggleXray: () => void;
  onResetView: () => void;
  onOpenAbout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  integratedRunning,
  audioEnabled,
  liveMicActive,
  showLabels,
  xrayMode,
  globalAlarm,
  alertCount,
  onToggleIntegrated,
  onToggleAudio,
  onToggleLiveMic,
  onToggleLabels,
  onToggleXray,
  onResetView,
  onOpenAbout,
}) => {
  return (
    <header className="relative z-20 flex items-center justify-between gap-4 px-5 py-2.5 bg-[#0D111A]/95 border-b border-slate-700/40">
      {/* Left: Brand & Team Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-display text-base font-semibold tracking-tight text-[#F8FAFC] whitespace-nowrap shrink-0">
          Digital Twin PA Bandara
        </span>
        <span className="hidden sm:inline text-slate-600" aria-hidden="true">
          |
        </span>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 truncate">
          <span className="font-semibold text-cyan-400 whitespace-nowrap shrink-0">
            {TEAM_IDENTITY.groupName}
          </span>
          <span className="text-slate-500" aria-hidden="true">
            ·
          </span>
          <span className="truncate text-slate-300">
            {TEAM_IDENTITY.members.join(' · ')}
          </span>
        </div>
      </div>

      {/* Right: Operational Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Global Alarm Indicator (Non-hue-only text + icon, no pulsing dot) */}
        <div
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap ${
            globalAlarm === 'critical'
              ? 'bg-red-500/15 border-red-500/50 text-red-200'
              : globalAlarm === 'warning'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
          }`}
        >
          {globalAlarm === 'normal' ? (
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                globalAlarm === 'critical' ? 'text-red-400' : 'text-amber-400'
              }`}
            />
          )}
          <span>
            {globalAlarm === 'normal'
              ? 'Sistem Normal'
              : `${alertCount} Alarm ${
                  globalAlarm === 'critical' ? 'Kritis' : 'Peringatan'
                }`}
          </span>
        </div>

        {/* Live Laptop Microphone to Speaker PA CTA */}
        <button
          type="button"
          onClick={onToggleLiveMic}
          title="Bicara menggunakan mikrofon laptop dan dengarkan langsung di speaker laptop"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            liveMicActive
              ? 'bg-emerald-400 text-slate-950 border-emerald-300 hover:bg-emerald-300'
              : 'bg-slate-800/90 border-cyan-500/40 text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/15'
          }`}
        >
          {liveMicActive ? (
            <Mic className="w-3.5 h-3.5" />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-cyan-300" />
          )}
          <span>{liveMicActive ? 'Mic Laptop Aktif' : 'Bicara (Mic Laptop)'}</span>
        </button>

        {/* Integrated 6-Device Simulation Primary CTA */}
        <button
          type="button"
          onClick={onToggleIntegrated}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            integratedRunning
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
          }`}
        >
          {integratedRunning ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>
            {integratedRunning
              ? 'Hentikan Simulasi'
              : 'Simulasi Gabungan 6 Alat'}
          </span>
        </button>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={onToggleAudio}
          title={audioEnabled ? 'Matikan Audio Output' : 'Aktifkan Audio Output'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            audioEnabled
              ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          {audioEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden xl:inline">
            {audioEnabled ? 'Audio Aktif' : 'Audio Mute'}
          </span>
        </button>

        {/* 3D Labels Toggle */}
        <button
          type="button"
          onClick={onToggleLabels}
          title="Tampilkan / Sembunyikan Label 3D"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            showLabels
              ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Label 3D</span>
        </button>

        {/* X-Ray / Cutaway Toggle */}
        <button
          type="button"
          onClick={onToggleXray}
          title="Mode X-Ray / Cutaway Plafon & Dinding"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            xrayMode
              ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">X-Ray</span>
        </button>

        {/* Reset View */}
        <button
          type="button"
          onClick={onResetView}
          title="Reset Kamera ke Overview Ruangan"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-200 hover:text-white hover:border-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset View</span>
        </button>

        {/* Team & Info Modal */}
        <button
          type="button"
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-200 hover:text-white hover:border-cyan-400/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Info Tim</span>
        </button>
      </div>
    </header>
  );
};
